"use client";

import { MEMBERS, SONG_BY_SLUG } from "@/lib/catalog";
import { ROMAJI_TITLES } from "@/lib/romaji";

export type Lang = "en" | "ja" | "zh";
export type Picks = Record<string, string>;
export type Mode = "liella" | "gen";

interface ExportBoardsProps {
  picks: Picks;
  name: string;
  showTitles: boolean;
  transparent: boolean;
  lang: Lang;
  mode: Mode;
}

interface ExportBlockConfig {
  title: string;
  bucket: string;
  className: string;
}

const BLOCKS: Record<Mode, ExportBlockConfig[]> = {
  liella: [
    { title: "Liella!", bucket: "group", className: "group-block" },
    { title: "SUBUNIT SONGS", bucket: "unit", className: "project-block" },
    { title: "SOLO PICKS", bucket: "solo", className: "solo-block" },
    { title: "OTHERS", bucket: "others", className: "others-block" },
  ],
  gen: [
    { title: "GEN 1 SONGS", bucket: "gen1", className: "gen-block gen1-block" },
    { title: "GEN 2 SONGS", bucket: "gen2", className: "gen-block gen2-block" },
    { title: "GEN 3 SONGS", bucket: "gen3", className: "gen-block gen3-block" },
    { title: "SUBUNIT SONGS", bucket: "unit", className: "project-block" },
    { title: "SOLO PICKS", bucket: "solo", className: "solo-block" },
    { title: "LIELLA! NO UTA", bucket: "uta", className: "uta-block" },
    { title: "OTHERS", bucket: "others", className: "others-block" },
  ],
};

const SECTION_LABEL: Record<Mode, string> = {
  liella: "Liella! · SUBUNIT · SOLO · OTHERS",
  gen: "GEN 1·2·3 · SOLO · SUBUNIT · UTA · OTHERS",
};

const MEMBER_COLORS = MEMBERS.map((member) => member.color);

function Spectrum() {
  return (
    <div className="export-spectrum">
      {MEMBER_COLORS.map((color, index) => (
        <i key={`${color}-${index}`} style={{ background: color }} />
      ))}
    </div>
  );
}

function ExportHeader({ section }: { section: string }) {
  return (
    <header className="export-header">
      <small>ラブライブ！スーパースター!!</small>
      <h1>MY PICK <em>Liella!</em></h1>
      <p>お気に入り楽曲セレクション</p>
      <div>
        <span>{section}</span>
      </div>
    </header>
  );
}

function ExportFooter({ name }: { name: string }) {
  return (
    <footer className="export-footer">
      <strong>UNOFFICIAL FAN SELECTION BOARD</strong>
      <span>{name.trim() ? `Selected by ${name.trim()}` : "MY PICK Liella!"}</span>
    </footer>
  );
}

function Cover({
  picks,
  slot,
  placeholder,
  showTitles,
  lang,
}: {
  picks: Picks;
  slot: string;
  placeholder: string;
  showTitles: boolean;
  lang: Lang;
}) {
  const song = SONG_BY_SLUG[picks[slot]];
  return (
    <div className={`export-cover${song ? " filled" : ""}`}>
      {song ? (
        <>
          <img src={song.cover} alt="" />
          {showTitles && (
            <div className="export-cover-title">
              <strong>{song.title}</strong>
              {lang !== "ja" && ROMAJI_TITLES[song.slug] && (
                <em className="romaji">{ROMAJI_TITLES[song.slug]}</em>
              )}
              <span>{song.artist}</span>
            </div>
          )}
        </>
      ) : (
        <span>{placeholder}</span>
      )}
    </div>
  );
}

function ExportBlock({
  title,
  bucket,
  className,
  picks,
  showTitles,
  lang,
}: {
  title: string;
  bucket: string;
  className: string;
  picks: Picks;
  showTitles: boolean;
  lang: Lang;
}) {
  return (
    <div className={`export-block ${className}`}>
      <h2>{title}</h2>
      <div className="export-three">
        {[0, 1, 2].map((index) => (
          <Cover
            key={index}
            picks={picks}
            slot={`${bucket}#${index}`}
            placeholder={`#${index + 1}`}
            showTitles={showTitles}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

export default function ExportBoards({
  picks,
  name,
  showTitles,
  transparent,
  lang,
  mode,
}: ExportBoardsProps) {
  const boardClass = `export-board${transparent ? " transparent" : ""}`;

  return (
    <div className="export-stage" aria-hidden>
      <section id="export-board" className={boardClass}>
        <ExportHeader section={SECTION_LABEL[mode]} />
        <Spectrum />
        {BLOCKS[mode].map((block) => (
          <ExportBlock
            key={block.bucket}
            title={block.title}
            bucket={block.bucket}
            className={block.className}
            picks={picks}
            showTitles={showTitles}
            lang={lang}
          />
        ))}
        <ExportFooter name={name} />
      </section>
    </div>
  );
}
