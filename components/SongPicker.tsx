"use client";

import { useEffect, useMemo, useState } from "react";
import type { Song } from "@/lib/catalog";
import { ROMAJI_TITLES } from "@/lib/romaji";

type Lang = "en" | "ja" | "zh";

interface SongPickerProps {
  lang: Lang;
  label: string;
  color: string;
  songs: Song[];
  currentSlug?: string;
  unavailable: Set<string>;
  onClose: () => void;
  onSelect: (song: Song) => void;
  onClear?: () => void;
}

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

export default function SongPicker({
  lang,
  label,
  color,
  songs,
  currentSlug,
  unavailable,
  onClose,
  onSelect,
  onClear,
}: SongPickerProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return songs.filter((song) => {
      if (unavailable.has(song.slug) && song.slug !== currentSlug) return false;
      if (!needle) return true;
      const romaji = ROMAJI_TITLES[song.slug] || "";
      return normalize(`${song.title} ${song.artist} ${song.slug} ${romaji}`).includes(needle);
    });
  }, [currentSlug, query, songs, unavailable]);

  return (
    <div className="modal-shell" role="dialog" aria-modal="true" aria-label={`Select song for ${label}`}>
      <button className="modal-backdrop" aria-label="Close song picker" onClick={onClose} />
      <section className="picker-panel">
        <header className="picker-header" style={{ background: color }}>
          <div>
            <strong>Select a song</strong>
            <span>{label}</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="picker-search">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or artist..."
          />
        </div>

        <div className="picker-results">
          {filtered.map((song) => {
            const selected = song.slug === currentSlug;
            return (
              <button
                key={song.slug}
                className={`picker-song${selected ? " is-selected" : ""}`}
                onClick={() => onSelect(song)}
              >
                <img src={song.cover} alt="" />
                <span>
                  <strong>{song.title}</strong>
                  {lang !== "ja" && ROMAJI_TITLES[song.slug] && (
                    <em className="romaji">{ROMAJI_TITLES[song.slug]}</em>
                  )}
                  <small>{song.artist}</small>
                </span>
                {selected && <b>✓</b>}
              </button>
            );
          })}
          {filtered.length === 0 && <p className="empty-results">No matching songs.</p>}
        </div>

        <footer className="picker-footer">
          {onClear ? <button onClick={onClear}>Clear this pick</button> : <span />}
          <span>{filtered.length} songs</span>
        </footer>
      </section>
    </div>
  );
}
