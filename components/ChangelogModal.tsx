"use client";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1",
    date: "2026-06-15",
    changes: [
      "Merged duplicate「LIVE with a smile!」entries — existing Liella! Ver. votes now count toward the main song",
      "Added Changelog page",
    ],
  },
  {
    version: "1.0",
    date: "2026-06-15",
    changes: [
      "Initial release of MY PICK Liella!",
      "Song picker with Liella!, Subunit, Solo, and Others categories",
      "Added「MOST PICKED SONGS」section — combined Top 10 across all categories",
      "Per-category rankings locked to Top 10",
      "Merged export boards into a single image download",
      "Compact layout for export board — blocks hug content tightly",
      "Preview modal now shows one image with one download button",
      "Consolidated solo picks into 3 unified slots (from 10 per-member slots)",
      "Added「Others」category for collaborations and cross-series songs",
      "Community Picks with real-time anonymous voting and rankings",
      "Song catalog synchronized with Apple Music",
      "Bilingual support (English / 日本語)",
      "Redesigned UI with premium glassmorphism aesthetic",
    ],
  },
];

interface ChangelogModalProps {
  onClose: () => void;
}

export default function ChangelogModal({ onClose }: ChangelogModalProps) {
  return (
    <div className="modal-shell changelog-shell" role="dialog" aria-modal="true" aria-label="Changelog">
      <button className="modal-backdrop" aria-label="Close changelog" onClick={onClose} />
      <section className="changelog-panel">
        <header className="changelog-header">
          <div>
            <strong>Changelog</strong>
            <span>What&apos;s new in MY PICK Liella!</span>
          </div>
          <button className="icon-button dark" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="changelog-body">
          {CHANGELOG.map((entry) => (
            <article className="changelog-entry" key={entry.version}>
              <div className="changelog-version-row">
                <span className="changelog-badge">v{entry.version}</span>
                <time>{entry.date}</time>
              </div>
              <ul>
                {entry.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
