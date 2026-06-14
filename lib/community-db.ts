import "server-only";

import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MEMBERS, SONG_BY_SLUG, type SongBucket } from "@/lib/catalog";
import type { CommunitySongStat, CommunityStats } from "@/lib/community";

type Picks = Record<string, string>;

interface BallotRow {
  voter_key: string;
  picks_json: string;
  updated_at: string;
}

const buckets: SongBucket[] = ["group", "unit", "solo", "others"];
const legacyMemberIds = new Set<string>(MEMBERS.map((member) => member.id));
const validSlots = new Set([
  "group#0",
  "group#1",
  "group#2",
  "unit#0",
  "unit#1",
  "unit#2",
  "solo#0",
  "solo#1",
  "solo#2",
  "others#0",
  "others#1",
  "others#2",
]);

const globalCommunity = globalThis as typeof globalThis & {
  liellaCommunityDb?: DatabaseSync;
  liellaCommunityStatsCache?: {
    value: CommunityStats;
    expiresAt: number;
  };
};

function getDb(): DatabaseSync {
  if (globalCommunity.liellaCommunityDb) {
    return globalCommunity.liellaCommunityDb;
  }

  const dataDir = path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "liella-community-picks.sqlite3"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS ballots (
      voter_key TEXT PRIMARY KEY,
      picks_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  globalCommunity.liellaCommunityDb = db;
  return db;
}

export function validatePicks(input: unknown): Picks {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Picks must be an object.");
  }

  const entries = Object.entries(input);
  if (entries.length < 1 || entries.length > 12) {
    throw new Error("A ballot must contain between 1 and 12 picks.");
  }

  const clean: Picks = {};
  const usedByBucket = new Map<string, Set<string>>();

  for (const [slot, slug] of entries) {
    if (!validSlots.has(slot) || typeof slug !== "string") {
      throw new Error("The ballot contains an invalid slot.");
    }

    const song = SONG_BY_SLUG[slug];
    const bucket = slot.split("#")[0];
    if (!song || song.bucket !== bucket) {
      throw new Error("A selected song does not belong to its slot.");
    }

    const used = usedByBucket.get(bucket) ?? new Set<string>();
    if (used.has(slug)) {
      throw new Error("The same song cannot be selected twice in one category.");
    }
    used.add(slug);
    usedByBucket.set(bucket, used);
    clean[slot] = slug;
  }

  return clean;
}

function normalizeStoredPicks(input: unknown): Picks {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const clean: Picks = {};
  const usedByBucket = new Map<SongBucket, Set<string>>();
  const legacySoloSlugs: string[] = [];

  for (const [slot, slug] of Object.entries(input)) {
    if (typeof slug !== "string") continue;
    const song = SONG_BY_SLUG[slug];
    if (!song) continue;

    const [bucket] = slot.split("#");
    if (validSlots.has(slot) && buckets.includes(bucket as SongBucket) && song.bucket === bucket) {
      const songBucket = bucket as SongBucket;
      const used = usedByBucket.get(songBucket) ?? new Set<string>();
      if (!used.has(slug)) {
        clean[slot] = slug;
        used.add(slug);
        usedByBucket.set(songBucket, used);
      }
      continue;
    }

    if (legacyMemberIds.has(bucket) && song.bucket === "solo") {
      if (!legacySoloSlugs.includes(slug)) legacySoloSlugs.push(slug);
    }
  }

  const usedSolo = usedByBucket.get("solo") ?? new Set<string>();
  for (const slug of legacySoloSlugs) {
    if (usedSolo.has(slug)) continue;
    const openIndex = [0, 1, 2].find((index) => !clean[`solo#${index}`]);
    if (openIndex === undefined) break;
    clean[`solo#${openIndex}`] = slug;
    usedSolo.add(slug);
  }

  return clean;
}

export function saveBallot(voterId: string, picks: Picks): void {
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(voterId)) {
    throw new Error("Invalid anonymous voter ID.");
  }

  const voterKey = createHash("sha256").update(voterId).digest("hex");
  getDb()
    .prepare(`
      INSERT INTO ballots (voter_key, picks_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(voter_key) DO UPDATE SET
        picks_json = excluded.picks_json,
        updated_at = excluded.updated_at
    `)
    .run(voterKey, JSON.stringify(picks), new Date().toISOString());
  globalCommunity.liellaCommunityStatsCache = undefined;
}

export function deleteBallot(voterId: string): void {
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(voterId)) {
    throw new Error("Invalid anonymous voter ID.");
  }

  const voterKey = createHash("sha256").update(voterId).digest("hex");
  getDb().prepare("DELETE FROM ballots WHERE voter_key = ?").run(voterKey);
  globalCommunity.liellaCommunityStatsCache = undefined;
}

export function getCommunityStats(): CommunityStats {
  const now = Date.now();
  const cached = globalCommunity.liellaCommunityStatsCache;
  if (cached && cached.expiresAt > now) return cached.value;

  const rows = getDb()
    .prepare("SELECT voter_key, picks_json, updated_at FROM ballots ORDER BY updated_at DESC")
    .all() as unknown as BallotRow[];

  const tallies = {
    group: new Map<string, number>(),
    unit: new Map<string, number>(),
    solo: new Map<string, number>(),
    others: new Map<string, number>(),
  };
  const activeRows: Array<{ picks: Picks; updatedAt: string }> = [];
  let selections = 0;

  for (const row of rows) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.picks_json);
    } catch {
      continue;
    }

    const picks = normalizeStoredPicks(parsed);
    if (!Object.keys(picks).length) {
      getDb().prepare("DELETE FROM ballots WHERE voter_key = ?").run(row.voter_key);
      continue;
    }

    const normalizedJson = JSON.stringify(picks);
    if (normalizedJson !== row.picks_json) {
      getDb()
        .prepare("UPDATE ballots SET picks_json = ? WHERE voter_key = ?")
        .run(normalizedJson, row.voter_key);
    }
    activeRows.push({ picks, updatedAt: row.updated_at });

    for (const slug of Object.values(picks)) {
      const song = SONG_BY_SLUG[slug];
      if (!song) continue;
      tallies[song.bucket].set(slug, (tallies[song.bucket].get(slug) ?? 0) + 1);
      selections += 1;
    }
  }

  const rank = (tally: Map<string, number>): CommunitySongStat[] =>
    [...tally.entries()]
      .map(([slug, count]) => {
        const song = SONG_BY_SLUG[slug];
        return {
          slug,
          title: song.title,
          artist: song.artist,
          cover: song.cover,
          count,
          percentage: activeRows.length ? count / activeRows.length : 0,
        };
      })
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ja"));

  const stats = {
    ballots: activeRows.length,
    selections,
    updatedAt: activeRows[0]?.updatedAt ?? null,
    group: rank(tallies.group),
    unit: rank(tallies.unit),
    solo: rank(tallies.solo),
    others: rank(tallies.others),
  };
  globalCommunity.liellaCommunityStatsCache = {
    value: stats,
    expiresAt: now + 5_000,
  };
  return stats;
}
