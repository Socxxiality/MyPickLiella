"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Picks } from "@/components/ExportBoards";
import {
  EMPTY_COMMUNITY_STATS,
  type CommunitySongStat,
  type CommunityStats,
} from "@/lib/community";

type Lang = "en" | "ja";

interface CommunityPicksProps {
  active: boolean;
  lang: Lang;
  picks: Picks;
  picksReady: boolean;
}

const VOTER_KEY = "liella_community_voter_v1";
const LAST_SYNC_KEY = "liella_community_last_picks_v2";
const TOTAL_PICKS = 12;

const text = {
  en: {
    eyebrow: "ANONYMOUS COMMUNITY RESULTS",
    title: "Community",
    accent: "Picks",
    intro: "Watch the Liella! community setlist take shape. Your current board is synced automatically.",
    ballots: "pick boards",
    selections: "song selections",
    updated: "last updated",
    waiting: "Waiting for picks",
    syncing: "Syncing...",
    synced: "Synced automatically",
    empty: "No community ballots yet. Your picks can be the first.",
    group: "Liella! songs",
    unit: "Subunit songs",
    solo: "Solo songs",
    others: "Others",
    note: "One current ballot per browser. Display names are never submitted or stored.",
    retry: "Could not load Community Picks.",
  },
  ja: {
    eyebrow: "匿名コミュニティ集計",
    title: "みんなの",
    accent: "選曲",
    intro: "Liella!ファンのみんなが選んだ楽曲を集計しています。選曲は自動で反映されます。",
    ballots: "選曲ボード",
    selections: "選曲数",
    updated: "最終更新",
    waiting: "選曲を待っています",
    syncing: "同期中...",
    synced: "自動同期済み",
    empty: "まだ選曲がありません。最初の一票を追加してみよう。",
    group: "Liella! 楽曲",
    unit: "ユニット楽曲",
    solo: "ソロ楽曲",
    others: "その他",
    note: "ブラウザごとに最新の1票のみ集計します。表示名は送信・保存されません。",
    retry: "Community Picksを読み込めませんでした。",
  },
} satisfies Record<Lang, Record<string, string>>;

function getVoterId(): string {
  const existing = localStorage.getItem(VOTER_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(VOTER_KEY, created);
  return created;
}

function RankingSection({
  title,
  color,
  songs,
  ballots,
}: {
  title: string;
  color: string;
  songs: CommunitySongStat[];
  ballots: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? songs : songs.slice(0, 5);

  return (
    <section className="community-ranking">
      <header>
        <i style={{ background: color }} />
        <h3>{title}</h3>
        <span>TOP {Math.min(5, songs.length) || 5}</span>
      </header>
      <div className="ranking-list">
        {visible.map((song, index) => (
          <article className="ranking-row" key={song.slug}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <img src={song.cover} alt="" />
            <div>
              <strong>{song.title}</strong>
              <small>{song.artist}</small>
              <span>
                <i
                  style={{
                    width: `${Math.max(song.percentage * 100, 2)}%`,
                    background: color,
                  }}
                />
              </span>
            </div>
            <p>
              <strong>{song.count}</strong>
              <small>{ballots ? `${(song.percentage * 100).toFixed(1)}%` : "0%"}</small>
            </p>
          </article>
        ))}
      </div>
      {songs.length > 5 && (
        <button className="ranking-expand" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show top 5" : `Show all ${songs.length}`}
        </button>
      )}
    </section>
  );
}

export default function CommunityPicks({
  active,
  lang,
  picks,
  picksReady,
}: CommunityPicksProps) {
  const [stats, setStats] = useState<CommunityStats>(EMPTY_COMMUNITY_STATS);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [notice, setNotice] = useState("");
  const syncVersion = useRef(0);
  const t = text[lang];
  const selectedCount = Object.keys(picks).length;
  const serializedPicks = useMemo(
    () => JSON.stringify(
      Object.fromEntries(
        Object.entries(picks).sort(([left], [right]) => left.localeCompare(right)),
      ),
    ),
    [picks],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/community", { cache: "no-store" });
      if (!response.ok) throw new Error("Request failed");
      setStats(await response.json() as CommunityStats);
      setNotice("");
    } catch {
      setNotice(t.retry);
    } finally {
      setLoading(false);
    }
  }, [t.retry]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  useEffect(() => {
    if (!picksReady) return;

    const lastSyncedPicks = localStorage.getItem(LAST_SYNC_KEY);
    if (selectedCount === 0 && !localStorage.getItem(VOTER_KEY)) {
      localStorage.removeItem(LAST_SYNC_KEY);
      setSyncState("idle");
      return;
    }
    if (selectedCount > 0 && lastSyncedPicks === serializedPicks) {
      setSyncState("saved");
      return;
    }

    const version = ++syncVersion.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSyncState("saving");
      setNotice("");
      try {
        const voterId = selectedCount === 0
          ? localStorage.getItem(VOTER_KEY)
          : getVoterId();
        if (!voterId) {
          localStorage.removeItem(LAST_SYNC_KEY);
          setSyncState("idle");
          return;
        }

        const response = await fetch("/api/community", {
          method: selectedCount === 0 ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedCount === 0
            ? { voterId }
            : { voterId, picks: JSON.parse(serializedPicks) as Picks }),
          signal: controller.signal,
        });
        const body = await response.json() as CommunityStats | { error: string };
        if (!response.ok || "error" in body) {
          throw new Error("error" in body ? body.error : "Could not sync picks.");
        }
        if (version !== syncVersion.current) return;
        if (selectedCount === 0) {
          localStorage.removeItem(LAST_SYNC_KEY);
        } else {
          localStorage.setItem(LAST_SYNC_KEY, serializedPicks);
        }
        setStats(body);
        setSyncState(selectedCount === 0 ? "idle" : "saved");
      } catch (error) {
        if (controller.signal.aborted || version !== syncVersion.current) return;
        setSyncState("error");
        setNotice(error instanceof Error ? error.message : t.retry);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [picksReady, selectedCount, serializedPicks, t.retry]);

  const syncLabel =
    syncState === "saving"
      ? t.syncing
      : syncState === "saved"
        ? t.synced
        : syncState === "error"
          ? t.retry
          : t.waiting;

  const updated = stats.updatedAt
    ? new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(stats.updatedAt))
    : "—";

  return (
    <section className={`community-sheet${active ? "" : " view-hidden"}`}>
      <header className="community-hero">
        <div>
          <small>{t.eyebrow}</small>
          <h2>{t.title} <em>{t.accent}</em></h2>
          <p>{t.intro}</p>
        </div>
        <div className={`community-sync-status is-${syncState}`} role="status" aria-live="polite">
          <i />
          <span>{syncLabel}</span>
          <small>{selectedCount} / {TOTAL_PICKS}</small>
        </div>
      </header>

      <div className="community-stats">
        <article><strong>{stats.ballots.toLocaleString()}</strong><span>{t.ballots}</span></article>
        <article><strong>{stats.selections.toLocaleString()}</strong><span>{t.selections}</span></article>
        <article><strong className="date-stat">{updated}</strong><span>{t.updated}</span></article>
      </div>

      {notice && <p className="community-notice">{notice}</p>}

      {loading ? (
        <div className="community-loading">Loading Community Picks...</div>
      ) : stats.ballots === 0 ? (
        <div className="community-empty">
          <strong>COMMUNITY PICKS</strong>
          <p>{t.empty}</p>
        </div>
      ) : (
        <div className="community-grid">
          <RankingSection title={t.group} color="#a760c3" songs={stats.group} ballots={stats.ballots} />
          <RankingSection title={t.unit} color="#e78c52" songs={stats.unit} ballots={stats.ballots} />
          <RankingSection title={t.solo} color="#d75f91" songs={stats.solo} ballots={stats.ballots} />
          <RankingSection title={t.others} color="#4f8f87" songs={stats.others} ballots={stats.ballots} />
        </div>
      )}

      <p className="community-privacy">{t.note}</p>
    </section>
  );
}
