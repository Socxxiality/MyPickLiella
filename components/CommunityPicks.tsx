"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Picks } from "@/components/ExportBoards";
import {
  EMPTY_COMMUNITY_STATS,
  type CommunitySongStat,
  type CommunityStats,
} from "@/lib/community";

type Lang = "en" | "ja" | "zh";

interface CommunityPicksProps {
  active: boolean;
  lang: Lang;
  picks: Picks;
  picksReady: boolean;
}

const VOTER_KEY = "liella_community_voter_v1";
const LAST_SYNC_KEY = "liella_community_last_picks_v2";
const TOTAL_PICKS = 21;

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
    gen1: "Gen 1 songs",
    gen2: "Gen 2 songs",
    gen3: "Gen 3 songs",
    solo: "Solo songs",
    unit: "Subunit songs",
    uta: "Liella! no Uta",
    others: "Others",
    mostPicked: "MOST PICKED SONGS",
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
    gen1: "1期生楽曲",
    gen2: "2期生楽曲",
    gen3: "3期生楽曲",
    solo: "ソロ楽曲",
    unit: "ユニット楽曲",
    uta: "リエラのうた",
    others: "その他",
    mostPicked: "最も選ばれた楽曲",
    note: "ブラウザごとに最新の1票のみ集計します。表示名は送信・保存されません。",
    retry: "Community Picksを読み込めませんでした。",
  },
  zh: {
    eyebrow: "匿名社区统计",
    title: "社区",
    accent: "选曲",
    intro: "查看 Liella! 社区的歌单统计。你的选曲会自动同步。",
    ballots: "选曲板",
    selections: "歌曲选择",
    updated: "最后更新",
    waiting: "等待选曲中",
    syncing: "同步中...",
    synced: "已自动同步",
    empty: "还没有社区投票。你的选曲可以成为第一个。",
    gen1: "一期生歌曲",
    gen2: "二期生歌曲",
    gen3: "三期生歌曲",
    solo: "个人歌曲",
    unit: "小组歌曲",
    uta: "Liella!之歌",
    others: "其他",
    mostPicked: "最受欢迎歌曲",
    note: "每个浏览器仅统计最新的一票。显示名称不会被发送或保存。",
    retry: "无法加载社区选曲。",
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
  const visible = songs.slice(0, 10);

  return (
    <section className="community-ranking">
      <header>
        <i style={{ background: color }} />
        <h3>{title}</h3>
        <span>TOP {Math.min(10, songs.length) || 10}</span>
      </header>
      <div className="ranking-list">
        {visible.map((song, index) => (
          <article className="ranking-row" key={song.slug}>
            <b>#{index + 1}</b>
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
    </section>
  );
}

function MostPickedSection({
  title,
  stats,
}: {
  title: string;
  stats: CommunityStats;
}) {
  const allSongs = useMemo(() => {
    const merged = new Map<string, CommunitySongStat>();
    for (const bucket of [
      stats.gen1,
      stats.gen2,
      stats.gen3,
      stats.solo,
      stats.unit,
      stats.uta,
      stats.others,
    ]) {
      for (const song of bucket) {
        const existing = merged.get(song.slug);
        if (existing) {
          existing.count += song.count;
        } else {
          merged.set(song.slug, { ...song });
        }
      }
    }
    // Recalculate percentage based on total ballots
    const ballots = stats.ballots;
    return [...merged.values()]
      .map((song) => ({ ...song, percentage: ballots ? song.count / ballots : 0 }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ja"))
      .slice(0, 10);
  }, [stats]);

  if (!allSongs.length) return null;

  const color = "#4a8fc5";

  return (
    <section className="community-ranking most-picked-ranking">
      <header>
        <i style={{ background: color }} />
        <h3>{title}</h3>
        <span>TOP {Math.min(10, allSongs.length)}</span>
      </header>
      <div className="ranking-list">
        {allSongs.map((song, index) => (
          <article className="ranking-row" key={song.slug}>
            <b>#{index + 1}</b>
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
              <small>{stats.ballots ? `${(song.percentage * 100).toFixed(1)}%` : "0%"}</small>
            </p>
          </article>
        ))}
      </div>
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
    ? new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : lang === "zh" ? "zh-CN" : "en-GB", {
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
        <>
          <MostPickedSection title={t.mostPicked} stats={stats} />
          <div className="community-grid">
            <RankingSection title={t.gen1} color="#d75f91" songs={stats.gen1} ballots={stats.ballots} />
            <RankingSection title={t.gen2} color="#9b6cc9" songs={stats.gen2} ballots={stats.ballots} />
            <RankingSection title={t.gen3} color="#4f9fb0" songs={stats.gen3} ballots={stats.ballots} />
            <RankingSection title={t.unit} color="#e78c52" songs={stats.unit} ballots={stats.ballots} />
            <RankingSection title={t.solo} color="#c95fa0" songs={stats.solo} ballots={stats.ballots} />
            <RankingSection title={t.uta} color="#5fa86a" songs={stats.uta} ballots={stats.ballots} />
            <RankingSection title={t.others} color="#4f8f87" songs={stats.others} ballots={stats.ballots} />
          </div>
        </>
      )}

      <p className="community-privacy">{t.note}</p>
    </section>
  );
}
