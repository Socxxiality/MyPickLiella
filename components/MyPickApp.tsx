"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { domToBlob } from "modern-screenshot";
import ChangelogModal from "@/components/ChangelogModal";
import CommunityPicks from "@/components/CommunityPicks";
import ExportBoards, { type Picks } from "@/components/ExportBoards";
import PreviewModal from "@/components/PreviewModal";
import SongPicker from "@/components/SongPicker";
import {
  MEMBERS,
  SONGS,
  SONG_BY_SLUG,
  songsForBucket,
  type Song,
  type SongBucket,
} from "@/lib/catalog";
import { canonicalSongSlug } from "@/lib/song-aliases";

type Lang = "en" | "ja" | "zh";
type View = "picker" | "community";
type Theme = "light" | "dark";

interface ActivePicker {
  bucket: SongBucket;
  slot: string;
  label: string;
  color: string;
}

const copy = {
  en: {
    subtitle: "Build the Liella! setlist that feels most like yours.",
    group: "Liella! songs",
    groupHelp: "Choose your top three songs performed by Liella!.",
    unit: "Subunit songs",
    unitHelp: "Pick three songs from CatChu!, KALEIDOSCORE, and 5yncri5e!.",
    solo: "Solo picks",
    soloHelp: "Choose three solo songs from any Liella! member.",
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
    group: "Liella! 楽曲",
    groupHelp: "Liella!の楽曲からお気に入りを3曲選んでください。",
    unit: "ユニット楽曲",
    unitHelp: "CatChu!、KALEIDOSCORE、5yncri5e!から3曲選んでください。",
    solo: "ソロ楽曲",
    soloHelp: "Liella!メンバーのソロ曲からお気に入りを3曲選んでください。",
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
    group: "Liella! 歌曲",
    groupHelp: "从 Liella! 的歌曲中选出你最喜欢的3首。",
    unit: "小组歌曲",
    unitHelp: "从 CatChu!、KALEIDOSCORE、5yncri5e! 中各选3首。",
    solo: "个人歌曲",
    soloHelp: "从任意 Liella! 成员的独唱曲中选出3首。",
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

const STORAGE_KEY = "liella_mypicks_v2";
const LEGACY_STORAGE_KEY = "liella_mypicks_v1";
const NAME_KEY = "liella_mypick_name";
const THEME_KEY = "liella_mypick_theme";
const TOTAL_PICKS = 12;
const PICK_BUCKETS: SongBucket[] = ["group", "unit", "solo", "others"];
const LEGACY_MEMBER_IDS = new Set<string>(MEMBERS.map((member) => member.id));

function normalizeStoredPicks(input: unknown): Picks {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const next: Picks = {};
  const used = new Map<SongBucket, Set<string>>();
  const legacySoloSlugs: string[] = [];

  for (const [slot, slug] of Object.entries(input)) {
    if (typeof slug !== "string") continue;
    const canonicalSlug = canonicalSongSlug(slug);
    const song = SONG_BY_SLUG[canonicalSlug];
    if (!song) continue;

    const [bucket, indexText] = slot.split("#");
    const index = Number(indexText);
    if (
      PICK_BUCKETS.includes(bucket as SongBucket) &&
      Number.isInteger(index) &&
      index >= 0 &&
      index < 3 &&
      song.bucket === bucket
    ) {
      const songBucket = bucket as SongBucket;
      const bucketUsed = used.get(songBucket) ?? new Set<string>();
      if (!bucketUsed.has(canonicalSlug)) {
        next[`${songBucket}#${index}`] = canonicalSlug;
        bucketUsed.add(canonicalSlug);
        used.set(songBucket, bucketUsed);
      }
      continue;
    }

    if (LEGACY_MEMBER_IDS.has(bucket) && song.bucket === "solo") {
      if (!legacySoloSlugs.includes(canonicalSlug)) legacySoloSlugs.push(canonicalSlug);
    }
  }

  const usedSolo = used.get("solo") ?? new Set<string>();
  for (const slug of legacySoloSlugs) {
    if (usedSolo.has(slug)) continue;
    const openIndex = [0, 1, 2].find((index) => !next[`solo#${index}`]);
    if (openIndex === undefined) break;
    next[`solo#${openIndex}`] = slug;
    usedSolo.add(slug);
  }

  return next;
}

function SongSlot({
  slot,
  placeholder,
  color,
  picks,
  onOpen,
}: {
  slot: string;
  placeholder: string;
  color: string;
  picks: Picks;
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
  const urls = useRef<string[]>([]);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const cleaned = normalizeStoredPicks(JSON.parse(stored));
        setPicks(cleaned);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  const selectedCount = Object.keys(picks).length;
  const t = copy[lang];

  const pickerSongs = useMemo(
    () => (active ? songsForBucket(active.bucket) : []),
    [active],
  );
  const unavailable = useMemo(() => {
    if (!active) return new Set<string>();
    return new Set(
      Object.entries(picks)
        .filter(([slot]) => slot !== active.slot && slot.startsWith(`${active.bucket}#`))
        .map(([, slug]) => slug),
    );
  }, [active, picks]);

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
    savePicks({ ...picks, [active.slot]: song.slug });
    setActive(null);
  };

  const clearAll = () => {
    if (!selectedCount || window.confirm(t.clearConfirm)) savePicks({});
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
          <div className="control-actions">
            <span><strong>{selectedCount}</strong> / {TOTAL_PICKS} {t.selected}</span>
            <button className="secondary-button" onClick={clearAll} disabled={!selectedCount}>{t.clear}</button>
            <button className="primary-button" onClick={generate} disabled={generating || !selectedCount}>
              {generating ? t.generating : t.download}
            </button>
          </div>
        </section>

        <section className="selection-sheet">
          <header className="section-heading">
            <div><small>01</small><h2>{t.group}</h2></div>
            <p>{t.groupHelp}</p>
          </header>
          <div className="feature-card group-card">
            <div className="feature-label">
              <strong>Liella!</strong>
              <span>11 MEMBERS</span>
            </div>
            <div className="three-slots">
              {[0, 1, 2].map((index) => (
                <SongSlot
                  key={index}
                  slot={`group#${index}`}
                  placeholder={`PICK #${index + 1}`}
                  color="#a760c3"
                  picks={picks}
                  onOpen={() => setActive({
                    bucket: "group",
                    slot: `group#${index}`,
                    label: `${t.group} #${index + 1}`,
                    color: "#a760c3",
                  })}
                />
              ))}
            </div>
          </div>

          <header className="section-heading spaced">
            <div><small>02</small><h2>{t.unit}</h2></div>
            <p>{t.unitHelp}</p>
          </header>
          <div className="feature-card project-card">
            <div className="feature-label">
              <strong>SUBUNITS</strong>
              <span>CatChu! · KALEIDOSCORE · 5yncri5e! · Sunny Passion</span>
            </div>
            <div className="three-slots">
              {[0, 1, 2].map((index) => (
                <SongSlot
                  key={index}
                  slot={`unit#${index}`}
                  placeholder={`PICK #${index + 1}`}
                  color="#e78c52"
                  picks={picks}
                  onOpen={() => setActive({
                    bucket: "unit",
                    slot: `unit#${index}`,
                    label: `${t.unit} #${index + 1}`,
                    color: "#e78c52",
                  })}
                />
              ))}
            </div>
          </div>

          <header className="section-heading spaced">
            <div><small>03</small><h2>{t.solo}</h2></div>
            <p>{t.soloHelp}</p>
          </header>
          <div className="feature-card solo-card">
            <div className="feature-label">
              <strong>SOLO</strong>
              <span>11 MEMBERS · 3 PICKS</span>
            </div>
            <div className="three-slots">
              {[0, 1, 2].map((index) => (
                <SongSlot
                  key={index}
                  slot={`solo#${index}`}
                  placeholder={`PICK #${index + 1}`}
                  color="#d75f91"
                  picks={picks}
                  onOpen={() => setActive({
                    bucket: "solo",
                    slot: `solo#${index}`,
                    label: `${t.solo} #${index + 1}`,
                    color: "#d75f91",
                  })}
                />
              ))}
            </div>
          </div>

          <header className="section-heading spaced">
            <div><small>04</small><h2>{t.others}</h2></div>
            <p>{t.othersHelp}</p>
          </header>
          <div className="feature-card others-card">
            <div className="feature-label">
              <strong>OTHERS</strong>
              <span>COLLABS · CROSS-SERIES</span>
            </div>
            <div className="three-slots">
              {[0, 1, 2].map((index) => (
                <SongSlot
                  key={index}
                  slot={`others#${index}`}
                  placeholder={`PICK #${index + 1}`}
                  color="#4f8f87"
                  picks={picks}
                  onOpen={() => setActive({
                    bucket: "others",
                    slot: `others#${index}`,
                    label: `${t.others} #${index + 1}`,
                    color: "#4f8f87",
                  })}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <CommunityPicks
        active={view === "community"}
        lang={lang}
        picks={picks}
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
          label={active.label}
          color={active.color}
          songs={pickerSongs}
          currentSlug={picks[active.slot]}
          unavailable={unavailable}
          onClose={() => setActive(null)}
          onSelect={chooseSong}
          onClear={picks[active.slot] ? () => {
            const next = { ...picks };
            delete next[active.slot];
            savePicks(next);
            setActive(null);
          } : undefined}
        />
      )}

      <ExportBoards picks={picks} name={name} showTitles={showTitles} transparent={transparent} />

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
