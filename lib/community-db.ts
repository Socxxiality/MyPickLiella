import "server-only";

import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  PICK_GROUPS,
  SONG_BY_SLUG,
  pickGroupForSong,
  type PickGroup,
} from "@/lib/catalog";
import type { CommunitySongStat, CommunityStats } from "@/lib/community";
import { canonicalSongSlug } from "@/lib/song-aliases";

type Picks = Record<string, string>;

interface BallotRow {
  voter_key: string;
  picks_json: string;
  updated_at: string;
}

const MAX_PICKS = PICK_GROUPS.length * 3;
const validSlots = new Set(
  PICK_GROUPS.flatMap((group) => [`${group}#0`, `${group}#1`, `${group}#2`]),
);

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
  if (entries.length < 1 || entries.length > MAX_PICKS) {
    throw new Error(`A ballot must contain between 1 and ${MAX_PICKS} picks.`);
  }

  const clean: Picks = {};
  const usedByGroup = new Map<string, Set<string>>();

  for (const [slot, slug] of entries) {
    if (!validSlots.has(slot) || typeof slug !== "string") {
      throw new Error("The ballot contains an invalid slot.");
    }

    const canonicalSlug = canonicalSongSlug(slug);
    const song = SONG_BY_SLUG[canonicalSlug];
    const group = slot.split("#")[0];
    if (!song || pickGroupForSong(song) !== group) {
      throw new Error("A selected song does not belong to its slot.");
    }

    const used = usedByGroup.get(group) ?? new Set<string>();
    if (used.has(canonicalSlug)) continue;
    used.add(canonicalSlug);
    usedByGroup.set(group, used);
    clean[slot] = canonicalSlug;
  }

  return clean;
}

// Re-bucket a stored ballot (any prior slot vocabulary — group#/solo#/gen#/
// member-id#) into the current rows by resolving each slug's canonical song and
// current pick group. Preserves the chosen songs; only slot keys are remapped.
function normalizeStoredPicks(input: unknown): Picks {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const clean: Picks = {};
  const used = new Map<string, Set<string>>();

  const place = (group: string, slug: string) => {
    const groupUsed = used.get(group) ?? new Set<string>();
    if (groupUsed.has(slug)) return;
    const openIndex = [0, 1, 2].find((index) => !clean[`${group}#${index}`]);
    if (openIndex === undefined) return;
    clean[`${group}#${openIndex}`] = slug;
    groupUsed.add(slug);
    used.set(group, groupUsed);
  };

  for (const slug of Object.values(input)) {
    if (typeof slug !== "string") continue;
    const canonicalSlug = canonicalSongSlug(slug);
    const song = SONG_BY_SLUG[canonicalSlug];
    if (!song) continue;
    place(pickGroupForSong(song), canonicalSlug);
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

  const tallies: Record<PickGroup, Map<string, number>> = {
    gen1: new Map<string, number>(),
    gen2: new Map<string, number>(),
    gen3: new Map<string, number>(),
    solo: new Map<string, number>(),
    unit: new Map<string, number>(),
    uta: new Map<string, number>(),
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
      const group = pickGroupForSong(song);
      if (!group) continue;
      tallies[group].set(slug, (tallies[group].get(slug) ?? 0) + 1);
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
    gen1: rank(tallies.gen1),
    gen2: rank(tallies.gen2),
    gen3: rank(tallies.gen3),
    solo: rank(tallies.solo),
    unit: rank(tallies.unit),
    uta: rank(tallies.uta),
    others: rank(tallies.others),
  };
  globalCommunity.liellaCommunityStatsCache = {
    value: stats,
    expiresAt: now + 5_000,
  };
  return stats;
}
