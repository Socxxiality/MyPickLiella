"use client";

interface PreviewModalProps {
  image: string;
  showTitles: boolean;
  transparent: boolean;
  generating: boolean;
  onToggleTitles: (value: boolean) => void;
  onToggleTransparent: (value: boolean) => void;
  onClose: () => void;
}

function download(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

export default function PreviewModal({
  image,
  showTitles,
  transparent,
  generating,
  onToggleTitles,
  onToggleTransparent,
  onClose,
}: PreviewModalProps) {
  return (
    <div className="modal-shell preview-shell" role="dialog" aria-modal="true" aria-label="Image preview">
      <button className="modal-backdrop" aria-label="Close preview" onClick={onClose} />
      <section className="preview-panel">
        <header className="preview-header">
          <div>
            <strong>Your My Pick image</strong>
            <span>One portrait board, ready for sharing.</span>
          </div>
          <button className="icon-button dark" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="preview-images single-image">
          <figure>
            <img src={image} alt="My Pick Liella! board" />
            <button onClick={() => download(image, "mypick-liella.webp")}>
              Download image
            </button>
          </figure>
        </div>

        <footer className="preview-options">
          <label>
            <input
              type="checkbox"
              checked={showTitles}
              onChange={(event) => onToggleTitles(event.target.checked)}
            />
            Show song titles
          </label>
          <label>
            <input
              type="checkbox"
              checked={transparent}
              onChange={(event) => onToggleTransparent(event.target.checked)}
            />
            Transparent background
          </label>
          <button
            className="primary-button"
            disabled={generating}
            onClick={() => download(image, "mypick-liella.webp")}
          >
            {generating ? "Regenerating..." : "Download image"}
          </button>
        </footer>
      </section>
    </div>
  );
}
