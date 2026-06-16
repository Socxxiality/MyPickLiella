"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { domToBlob } from "modern-screenshot";
import ChangelogModal from "@/components/ChangelogModal";
import CommunityPicks from "@/components/CommunityPicks";
import ExportBoards, { type Picks } from "@/components/ExportBoards";
import PreviewModal from "@/components/PreviewModal";
import SongPicker from "@/components/SongPicker";
import {
  MEMBERS,
  PICK_GROUPS,
  SONGS,
  SONG_BY_SLUG,
  pickGroupForSong,
  type Song,
} from "@/lib/catalog";
import { canonicalSongSlug } from "@/lib/song-aliases";
import { ROMAJI_TITLES } from "@/lib/romaji";

type Lang = "en" | "ja" | "zh";
type View = "picker" | "community";
type Theme = "light" | "dark";
// "liella" = original grouping (by song bucket); "gen" = generation split.
type Mode = "liella" | "gen";

interface ActivePicker {
  bucket: string;
  slot: string;
  label: string;
  color: string;
}

// Which row a song belongs to in a given mode.
function groupOf(song: Song, mode: Mode): string {
  return mode === "liella" ? song.bucket : pickGroupForSong(song);
}

const copy = {
  en: {
    subtitle: "Build the Liella! setlist that feels most like yours.",
    modeLiella: "Liella!",
    modeGen: "By generation",
    group: "Liella! songs",
    groupHelp: "Choose your top three songs performed by Liella!.",
    gen1: "Gen 1 songs",
    gen1Help: "Liella! songs from the 1st-generation (5-member) era.",
    gen2: "Gen 2 songs",
    gen2Help: "Liella! songs from the 2nd-generation (9-member) era.",
    gen3: "Gen 3 songs",
    gen3Help: "Liella! songs from the 3rd-generation (11-member) era.",
    solo: "Solo songs",
    soloHelp: "Choose three solo songs from any Liella! member.",
    unit: "Subunit songs",
    unitHelp: "Pick three songs from CatChu!, KALEIDOSCORE, and 5yncri5e!.",
    uta: "Liella! no Uta",
    utaHelp: "Pick three songs from the Liella! no Uta series.",
    others: "Others",
    othersHelp: "Pick three collaborations, cross-series songs, or special songs featuring Liella! members.",
    name: "Your name (optional)",
    download: "Download images",
    pickerTab: "Build my picks",
    communityTab: "Community Picks",
    clear: "Clear all",
    selected: "selected",
    generating: "Generating...",
    clearConfirm: "Clear every selection?",
    songs: "songs",
  },
  ja: {
    subtitle: "あなたらしいLiella!のセットリストを作ろう。",
    modeLiella: "Liella!",
    modeGen: "世代別",
    group: "Liella! 楽曲",
    groupHelp: "Liella!の楽曲からお気に入りを3曲選んでください。",
    gen1: "1期生楽曲",
    gen1Help: "1期生（5人体制）期のLiella!楽曲から3曲選んでください。",
    gen2: "2期生楽曲",
    gen2Help: "2期生加入（9人体制）期のLiella!楽曲から3曲選んでください。",
    gen3: "3期生楽曲",
    gen3Help: "3期生加入（11人体制）期のLiella!楽曲から3曲選んでください。",
    solo: "ソロ楽曲",
    soloHelp: "Liella!メンバーのソロ曲からお気に入りを3曲選んでください。",
    unit: "ユニット楽曲",
    unitHelp: "CatChu!、KALEIDOSCORE、5yncri5e!から3曲選んでください。",
    uta: "リエラのうた",
    utaHelp: "「リエラのうた」シリーズから3曲選んでください。",
    others: "その他",
    othersHelp: "コラボ、シリーズ横断、Liella!メンバー参加曲から3曲選んでください。",
    name: "名前（任意）",
    download: "画像をダウンロード",
    pickerTab: "選曲を作る",
    communityTab: "みんなの選曲",
    clear: "すべてクリア",
    selected: "曲選択済み",
    generating: "作成中...",
    clearConfirm: "すべての選曲をクリアしますか？",
    songs: "曲",
  },
  zh: {
    subtitle: "打造属于你的 Liella! 歌单吧。",
    modeLiella: "Liella!",
    modeGen: "按世代",
    group: "Liella! 歌曲",
    groupHelp: "从 Liella! 的歌曲中选出你最喜欢的3首。",
    gen1: "一期生歌曲",
    gen1Help: "一期生（5人时期）的 Liella! 歌曲中选出3首。",
    gen2: "二期生歌曲",
    gen2Help: "二期生加入（9人时期）的 Liella! 歌曲中选出3首。",
    gen3: "三期生歌曲",
    gen3Help: "三期生加入（11人时期）的 Liella! 歌曲中选出3首。",
    solo: "个人歌曲",
    soloHelp: "从任意 Liella! 成员的独唱曲中选出3首。",
    unit: "小组歌曲",
    unitHelp: "从 CatChu!、KALEIDOSCORE、5yncri5e! 中各选3首。",
    uta: "Liella!之歌",
    utaHelp: "从「Liella!之歌」系列中选出3首。",
    others: "其他",
    othersHelp: "选出3首合作曲、跨系列歌曲或 Liella! 成员参与的特别歌曲。",
    name: "你的名字（选填）",
    download: "下载图片",
    pickerTab: "创建选曲",
    communityTab: "社区选曲",
    clear: "全部清除",
    selected: "已选",
    generating: "生成中...",
    clearConfirm: "确定要清除所有选曲吗？",
    songs: "首歌曲",
  },
} satisfies Record<Lang, Record<string, string>>;

const STORAGE_KEY = "liella_mypicks_v3";
const LEGACY_STORAGE_KEYS = ["liella_mypicks_v2", "liella_mypicks_v1"];
const NAME_KEY = "liella_mypick_name";
const THEME_KEY = "liella_mypick_theme";
const MODE_KEY = "liella_mypick_mode";

// ── Pick-state model ────────────────────────────────────────────────────────
// The GENERATION layout is the lossless master: picks are always STORED in gen
// rows (gen1/gen2/gen3/solo/unit/uta/others — ≤3 each), at their exact slot
// indices (deliberate gaps are preserved). Liella! mode is an INDEX-PRESERVING
// projection of that master onto the original four rows (Liella!/Subunit/Solo/
// Others): a master song at row#i shows at bucket#i — so a song you put in a
// row's 3rd slot stays in the 3rd slot. Because the single "Liella!" row draws
// from gen1/gen2/gen3 (+ Uta), two songs can land on the same Liella! slot; the
// earlier generation (PICK_GROUPS order) keeps it and the other is HIDDEN but
// kept in the master. So switching gen → liella → gen restores everything;
// deleting a *visible* song in Liella! removes it from the master, while songs
// hidden by a slot clash survive the round-trip.

// Build the master from stored slot→slug pairs, preserving each song's gen row
// AND slot index. A gen-row slot stays put; a legacy Liella! slot (e.g. group#2)
// maps to the song's gen row at the same index (gen{N}#2). Dedupes songs; on a
// rare index clash, falls back to the first free slot in that row.
function buildMaster(entries: Iterable<[string, string]>): Picks {
  const master: Picks = {};
  const placed = new Set<string>();
  for (const [slot, rawSlug] of entries) {
    if (typeof rawSlug !== "string") continue;
    const slug = canonicalSongSlug(rawSlug);
    const song = SONG_BY_SLUG[slug];
    if (!song || placed.has(slug)) continue;
    const group = pickGroupForSong(song);
    const parsed = Number(slot.split("#")[1]);
    const index = Number.isInteger(parsed) && parsed >= 0 && parsed < 3 ? parsed : -1;
    let target = index >= 0 ? `${group}#${index}` : "";
    if (!target || master[target]) {
      const free = [0, 1, 2].find((i) => !master[`${group}#${i}`]);
      if (free === undefined) continue;
      target = `${group}#${free}`;
    }
    master[target] = slug;
    placed.add(slug);
  }
  return master;
}

// Project the master onto Liella! rows by song.bucket. Two passes:
//   1. POSITIONAL — a master song at row#i takes bucket#i if free (so a song in a
//      row's 3rd slot stays in the 3rd slot). On a clash the earlier generation
//      keeps the slot; the loser is deferred.
//   2. FILL — remaining deferred songs slide into any still-empty slots of their
//      bucket (gen order). Whatever doesn't fit is hidden but kept in the master.
// Returns the displayed picks plus a map from each display slot to its master
// slot (used to apply Liella!-mode edits back onto the master).
function projectToLiella(master: Picks): { display: Picks; source: Record<string, string> } {
  const display: Picks = {};
  const source: Record<string, string> = {};
  const deferred: Array<{ masterSlot: string; slug: string; bucket: string }> = [];

  for (const group of PICK_GROUPS) {
    for (const index of [0, 1, 2]) {
      const masterSlot = `${group}#${index}`;
      const slug = master[masterSlot];
      if (!slug) continue;
      const song = SONG_BY_SLUG[slug];
      if (!song) continue;
      const target = `${song.bucket}#${index}`;
      if (display[target]) {
        deferred.push({ masterSlot, slug, bucket: song.bucket });
        continue;
      }
      display[target] = slug;
      source[target] = masterSlot;
    }
  }

  for (const { masterSlot, slug, bucket } of deferred) {
    const free = [0, 1, 2].find((i) => !display[`${bucket}#${i}`]);
    if (free === undefined) continue; // bucket full → hidden, still in the master
    display[`${bucket}#${free}`] = slug;
    source[`${bucket}#${free}`] = masterSlot;
  }

  return { display, source };
}

// Seed the sticky Liella! view from the master: the projected display plus the
// "stash" of master songs the cap couldn't show (kept at their gen slots so the
// master can be rebuilt from view + stash).
function enterLiellaView(master: Picks): { display: Picks; stash: Picks } {
  const { display } = projectToLiella(master);
  const shown = new Set(Object.values(display));
  const stash: Picks = {};
  for (const [slot, slug] of Object.entries(master)) {
    if (!shown.has(slug)) stash[slot] = slug;
  }
  return { display, stash };
}

function SongSlot({
  slot,
  placeholder,
  color,
  picks,
  lang,
  onOpen,
}: {
  slot: string;
  placeholder: string;
  color: string;
  picks: Picks;
  lang: Lang;
  onOpen: () => void;
}) {
  const song = SONG_BY_SLUG[picks[slot]];
  return (
    <button
      className={`song-slot${song ? " filled" : ""}`}
      onClick={onOpen}
      style={{ "--slot-color": color } as React.CSSProperties}
    >
      {song ? (
        <>
          <img src={song.cover} alt="" />
          <span>
            <strong>{song.title}</strong>
            {lang !== "ja" && ROMAJI_TITLES[song.slug] && (
              <em className="romaji">{ROMAJI_TITLES[song.slug]}</em>
            )}
            <small>{song.artist}</small>
          </span>
        </>
      ) : (
        <span className="song-placeholder">
          <b>+</b>
          {placeholder}
        </span>
      )}
    </button>
  );
}

export default function MyPickApp() {
  const [picks, setPicks] = useState<Picks>({});
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<View>("picker");
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showTitles, setShowTitles] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [picksReady, setPicksReady] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [mode, setMode] = useState<Mode>("gen");
  // Liella!-mode is a sticky projection: `liellaView` is the editable display
  // (clearing a slot leaves a gap — overflow only slides in on re-entry), and
  // `hiddenStash` holds the master songs the cap couldn't show, preserved so the
  // gen master can be rebuilt from view + stash on every edit.
  const [liellaView, setLiellaView] = useState<Picks>({});
  const [hiddenStash, setHiddenStash] = useState<Picks>({});
  const urls = useRef<string[]>([]);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(MODE_KEY) === "liella" ? "liella" : "gen";
      setMode(storedMode);
      const stored =
        localStorage.getItem(STORAGE_KEY) ??
        LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean) ??
        null;
      if (stored) {
        // Master is always gen rows, regardless of the mode/layout it was saved in.
        const cleaned = buildMaster(Object.entries(JSON.parse(stored)));
        setPicks(cleaned);
        if (storedMode === "liella") {
          const { display, stash } = enterLiellaView(cleaned);
          setLiellaView(display);
          setHiddenStash(stash);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
      }
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      for (const key of LEGACY_STORAGE_KEYS) localStorage.removeItem(key);
    } finally {
      setPicksReady(true);
    }

    const storedTheme = localStorage.getItem(THEME_KEY) as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const savePicks = useCallback((next: Picks) => {
    setPicks(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateName = (value: string) => {
    setName(value);
    localStorage.setItem(NAME_KEY, value);
  };

  // Switching modes never loses songs. Entering Liella! re-projects the master
  // into a fresh sticky view (this is when overflow songs slide into gaps).
  // Leaving it keeps the master, which liella edits have kept current.
  const switchMode = useCallback(
    (next: Mode) => {
      if (next === mode) return;
      if (next === "liella") {
        const { display, stash } = enterLiellaView(picks);
        setLiellaView(display);
        setHiddenStash(stash);
      }
      setMode(next);
      localStorage.setItem(MODE_KEY, next);
      setActive(null);
    },
    [mode, picks],
  );

  const t = copy[lang];

  const LAYOUTS: Record<Mode, Array<{
    group: string; num: string; tag: string; color: string;
    cardClass: string; title: string; help: string; sub: string;
  }>> = {
    liella: [
      { group: "group", num: "01", tag: "Liella!", color: "#a760c3", cardClass: "group-card", title: t.group, help: t.groupHelp, sub: "11 MEMBERS" },
      { group: "unit", num: "02", tag: "SUBUNITS", color: "#e78c52", cardClass: "project-card", title: t.unit, help: t.unitHelp, sub: "CatChu! · KALEIDOSCORE · 5yncri5e! · Sunny Passion" },
      { group: "solo", num: "03", tag: "SOLO", color: "#c95fa0", cardClass: "solo-card", title: t.solo, help: t.soloHelp, sub: "11 MEMBERS" },
      { group: "others", num: "04", tag: "OTHERS", color: "#4f8f87", cardClass: "others-card", title: t.others, help: t.othersHelp, sub: "COLLABS · CROSS-SERIES" },
    ],
    gen: [
      { group: "gen1", num: "01", tag: "GEN 1", color: "#d75f91", cardClass: "gen-card gen1-card", title: t.gen1, help: t.gen1Help, sub: "5 MEMBERS · 2021.07-2022.06" },
      { group: "gen2", num: "02", tag: "GEN 2", color: "#9b6cc9", cardClass: "gen-card gen2-card", title: t.gen2, help: t.gen2Help, sub: "9 MEMBERS · 2022.07-2023.05" },
      { group: "gen3", num: "03", tag: "GEN 3", color: "#4f9fb0", cardClass: "gen-card gen3-card", title: t.gen3, help: t.gen3Help, sub: "11 MEMBERS · 2023.06-" },
      { group: "unit", num: "04", tag: "SUBUNITS", color: "#e78c52", cardClass: "project-card", title: t.unit, help: t.unitHelp, sub: "CatChu! · KALEIDOSCORE · 5yncri5e! · Sunny Passion" },
      { group: "solo", num: "05", tag: "SOLO", color: "#c95fa0", cardClass: "solo-card", title: t.solo, help: t.soloHelp, sub: "11 MEMBERS" },
      { group: "uta", num: "06", tag: "Liella no Uta", color: "#5fa86a", cardClass: "uta-card", title: t.uta, help: t.utaHelp, sub: "リエラのうた" },
      { group: "others", num: "07", tag: "OTHERS", color: "#4f8f87", cardClass: "others-card", title: t.others, help: t.othersHelp, sub: "COLLABS · CROSS-SERIES" },
    ],
  };
  const sections = LAYOUTS[mode];
  const totalPicks = sections.length * 3;

  // The picks shown/edited in the current mode: the master itself in gen mode,
  // or the sticky Liella! view (seeded on mode entry, edited in place).
  const activeDisplay = mode === "gen" ? picks : liellaView;

  // Apply a Liella!-mode slot edit: update the sticky view (clearing leaves a
  // gap — no auto-fill), then rebuild the gen master from view + stash so it
  // stays current for gen mode, community, export, and persistence.
  const editLiellaSlot = useCallback(
    (slot: string, slug: string | null) => {
      const nextView: Picks = { ...liellaView };
      if (slug) {
        for (const [s, v] of Object.entries(nextView)) if (v === slug) delete nextView[s]; // dedupe
        nextView[slot] = slug;
      } else {
        delete nextView[slot];
      }
      setLiellaView(nextView);
      savePicks(buildMaster([...Object.entries(nextView), ...Object.entries(hiddenStash)]));
    },
    [liellaView, hiddenStash, savePicks],
  );

  // Community results are always generation-canonical — the master already is.
  const communityPicks = picks;

  // Total songs selected (master) and how many are visible in the current view.
  const selectedCount = Object.keys(picks).length;
  const shownCount = Object.keys(activeDisplay).length;

  const pickerSongs = useMemo(
    () => (active ? SONGS.filter((song) => groupOf(song, mode) === active.bucket) : []),
    [active, mode],
  );

  const unavailable = useMemo(() => {
    if (!active) return new Set<string>();
    const current = activeDisplay[active.slot];
    return new Set(
      Object.values(picks).filter((slug) => {
        const song = SONG_BY_SLUG[slug];
        return song && slug !== current && groupOf(song, mode) === active.bucket;
      }),
    );
  }, [active, picks, activeDisplay, mode]);

  const closePreviews = useCallback(() => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = [];
    setPreview(null);
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 80));
      const options = {
        scale: 2,
        timeout: 20000,
        type: "image/webp",
        quality: 0.92,
      } as const;
      const blob = await domToBlob(document.getElementById("export-board")!, options);
      for (const url of urls.current) URL.revokeObjectURL(url);
      const next = [URL.createObjectURL(blob)];
      urls.current = next;
      setPreview(next[0]);
    } catch (error) {
      console.error(error);
      window.alert("Could not generate the image. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (!preview) return;
    const timer = window.setTimeout(generate, 100);
    return () => window.clearTimeout(timer);
  }, [generate, showTitles, transparent]);

  useEffect(() => () => {
    for (const url of urls.current) URL.revokeObjectURL(url);
  }, []);

  const chooseSong = (song: Song) => {
    if (!active) return;
    if (mode === "gen") {
      const next: Picks = {};
      for (const [slot, slug] of Object.entries(picks)) {
        if (slug !== song.slug) next[slot] = slug; // dedupe the song
      }
      next[active.slot] = song.slug;
      savePicks(next);
    } else {
      editLiellaSlot(active.slot, song.slug);
    }
    setActive(null);
  };

  const clearSlot = (slot: string) => {
    if (mode === "gen") {
      const next = { ...picks };
      delete next[slot];
      savePicks(next);
    } else {
      editLiellaSlot(slot, null);
    }
  };

  const clearAll = () => {
    if (!selectedCount || window.confirm(t.clearConfirm)) {
      savePicks({});
      setLiellaView({});
      setHiddenStash({});
    }
  };

  return (
    <main className="page-shell">
      <div className="top-spectrum">
        {MEMBERS.map((member) => <i key={member.id} style={{ background: member.color }} />)}
      </div>

      <header className="site-header">
        <div>
          <small>ラブライブ！スーパースター!!</small>
          <h1>MY PICK <span>Liella!</span></h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="header-tools">
          <div className="catalog-total" aria-label={`${SONGS.length} ${t.songs}`}>
            <strong>{SONGS.length}</strong>
            <span>{t.songs}</span>
          </div>
          <div className="language-toggle" aria-label="Language">
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "ja" ? "active" : ""} onClick={() => setLang("ja")}>日本語</button>
            <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
          </div>
          <button
            className="theme-toggle"
            onClick={() => {
              const next = theme === "light" ? "dark" : "light";
              setTheme(next);
              localStorage.setItem(THEME_KEY, next);
            }}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Page sections">
        <button className={view === "picker" ? "active" : ""} onClick={() => setView("picker")}>
          <span>01</span>{t.pickerTab}
        </button>
        <button className={view === "community" ? "active" : ""} onClick={() => setView("community")}>
          <span>02</span>{t.communityTab}
        </button>
      </nav>

      <div className={view === "picker" ? "" : "view-hidden"}>
        <section className="control-panel">
          <label>
            <span>{t.name}</span>
            <input
              value={name}
              maxLength={40}
              onChange={(event) => updateName(event.target.value)}
              placeholder="Selected by..."
            />
          </label>
          <div className="mode-switch" role="group" aria-label="Grouping mode">
            <button className={mode === "liella" ? "active" : ""} onClick={() => switchMode("liella")}>
              {t.modeLiella}
            </button>
            <button className={mode === "gen" ? "active" : ""} onClick={() => switchMode("gen")}>
              {t.modeGen}
            </button>
          </div>
          <div className="control-actions">
            <span><strong>{shownCount}</strong> / {totalPicks} {t.selected}</span>
            <button className="secondary-button" onClick={clearAll} disabled={!selectedCount}>{t.clear}</button>
            <button className="primary-button" onClick={generate} disabled={generating || !selectedCount}>
              {generating ? t.generating : t.download}
            </button>
          </div>
        </section>

        <section className="selection-sheet">
          {sections.map((sec, sectionIndex) => (
            <Fragment key={sec.group}>
              <header className={`section-heading${sectionIndex === 0 ? "" : " spaced"}`}>
                <div><small>{sec.num}</small><h2>{sec.title}</h2></div>
                <p>{sec.help}</p>
              </header>
              <div className={`feature-card ${sec.cardClass}`}>
                <div className="feature-label">
                  <strong>{sec.tag}</strong>
                  <span>{sec.sub}</span>
                </div>
                <div className="three-slots">
                  {[0, 1, 2].map((index) => (
                    <SongSlot
                      key={index}
                      slot={`${sec.group}#${index}`}
                      placeholder={`PICK #${index + 1}`}
                      color={sec.color}
                      picks={activeDisplay}
                      lang={lang}
                      onOpen={() => setActive({
                        bucket: sec.group,
                        slot: `${sec.group}#${index}`,
                        label: `${sec.title} #${index + 1}`,
                        color: sec.color,
                      })}
                    />
                  ))}
                </div>
              </div>
            </Fragment>
          ))}
        </section>
      </div>

      <CommunityPicks
        active={view === "community"}
        lang={lang}
        picks={communityPicks}
        picksReady={picksReady}
      />

      <footer className="site-footer">
        <div className="footer-brand">
          <strong>MY PICK Liella!</strong>
          <span>Unofficial fan selection board</span>
          <span className="footer-credit">
            Developed by <a href="https://x.com/socxx_" target="_blank" rel="noreferrer"><b>SCX</b></a>
          </span>
          <span className="footer-credit">Deployed by <b>Jayjayli</b></span>
        </div>
        <div className="footer-meta">
          <p>
            Song titles and cover images belong to their respective rights holders.
            Catalog based on official Love Live! music and event pages.
          </p>
          <p className="footer-inspired">
            Inspired by{" "}
            <a href="https://github.com/rurimegu/MyPickHasunosora" target="_blank" rel="noreferrer">
              MyPickHasunosora
            </a>
            ,{" "}
            <a href="https://aqours-mypick.ccwu.cc/" target="_blank" rel="noreferrer">
              MyPickAqours
            </a>
            , and{" "}
            <a href="https://mypick-ikizulive.kotoha.moe/" target="_blank" rel="noreferrer">
              MyPickIKIZULIVE
            </a>
            .
          </p>
          <button className="footer-changelog-link" onClick={() => setShowChangelog(true)}>Changelog</button>
        </div>
      </footer>

      {active && (
        <SongPicker
          lang={lang}
          label={active.label}
          color={active.color}
          songs={pickerSongs}
          currentSlug={activeDisplay[active.slot]}
          unavailable={unavailable}
          onClose={() => setActive(null)}
          onSelect={chooseSong}
          onClear={activeDisplay[active.slot] ? () => {
            clearSlot(active.slot);
            setActive(null);
          } : undefined}
        />
      )}

      <ExportBoards picks={activeDisplay} name={name} showTitles={showTitles} transparent={transparent} lang={lang} mode={mode} />

      {preview && (
        <PreviewModal
          image={preview}
          lang={lang}
          showTitles={showTitles}
          transparent={transparent}
          generating={generating}
          onToggleTitles={setShowTitles}
          onToggleTransparent={setTransparent}
          onClose={closePreviews}
        />
      )}

      {showChangelog && (
        <ChangelogModal lang={lang} onClose={() => setShowChangelog(false)} />
      )}
    </main>
  );
}
