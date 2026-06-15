"use client";

import { MEMBERS, SONG_BY_SLUG } from "@/lib/catalog";
import { ROMAJI_TITLES } from "@/lib/romaji";

export type Lang = "en" | "ja" | "zh";
export type Picks = Record<string, string>;

interface ExportBoardsProps {
  picks: Picks;
  name: string;
  showTitles: boolean;
  transparent: boolean;
  lang: Lang;
}

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
  bucket: "group" | "unit" | "solo" | "others";
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
}: ExportBoardsProps) {
  const boardClass = `export-board${transparent ? " transparent" : ""}`;

  return (
    <div className="export-stage" aria-hidden>
      <section id="export-board" className={boardClass}>
        <ExportHeader section="Liella! · SUBUNIT · SOLO · OTHERS" />
        <Spectrum />
        <ExportBlock
          title="Liella!"
          bucket="group"
          className="group-block"
          picks={picks}
          showTitles={showTitles}
          lang={lang}
        />
        <ExportBlock
          title="SUBUNIT SONGS"
          bucket="unit"
          className="project-block"
          picks={picks}
          showTitles={showTitles}
          lang={lang}
        />
        <ExportBlock
          title="SOLO PICKS"
          bucket="solo"
          className="solo-block"
          picks={picks}
          showTitles={showTitles}
          lang={lang}
        />
        <ExportBlock
          title="OTHERS"
          bucket="others"
          className="others-block"
          picks={picks}
          showTitles={showTitles}
          lang={lang}
        />
        <ExportFooter name={name} />
      </section>
    </div>
  );
}
