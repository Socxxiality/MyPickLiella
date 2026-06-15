"use client";

type Lang = "en" | "ja" | "zh";

const SITE_URL = "https://mypick-liella.kotoha.moe/";

const ui = {
  en: {
    title: "Your My Pick image",
    subtitle: "One portrait board, ready for sharing.",
    downloadInline: "Download image",
    download: "Download image",
    regenerating: "Regenerating...",
    showTitles: "Show song titles",
    transparent: "Transparent background",
    shareX: "Share to X",
    shareCaption: `Here's my Liella! setlist! 🌟\nCreate yours → ${SITE_URL}\n#lovelive #Liella #MyPickLiella`,
  },
  ja: {
    title: "あなたの My Pick 画像",
    subtitle: "1枚のボード、共有の準備ができました。",
    downloadInline: "画像をダウンロード",
    download: "画像をダウンロード",
    regenerating: "再生成中...",
    showTitles: "曲名を表示",
    transparent: "背景を透明にする",
    shareX: "Xでシェア",
    shareCaption: `私のLiella!セットリストはこちら！🌟\nあなたも作ってみてね → ${SITE_URL}\n#lovelive #Liella #MyPickLiella`,
  },
  zh: {
    title: "你的 My Pick 图片",
    subtitle: "一张选曲板，准备分享。",
    downloadInline: "下载图片",
    download: "下载图片",
    regenerating: "重新生成中...",
    showTitles: "显示歌曲名",
    transparent: "透明背景",
    shareX: "分享到 X",
    shareCaption: `这是我的 Liella! 歌单！🌟\n来创建你的吧 → ${SITE_URL}\n#lovelive #Liella #MyPickLiella`,
  },
} satisfies Record<Lang, Record<string, string>>;

interface PreviewModalProps {
  image: string;
  lang: Lang;
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

function shareToX(caption: string) {
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(caption)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function PreviewModal({
  image,
  lang,
  showTitles,
  transparent,
  generating,
  onToggleTitles,
  onToggleTransparent,
  onClose,
}: PreviewModalProps) {
  const t = ui[lang];

  return (
    <div className="modal-shell preview-shell" role="dialog" aria-modal="true" aria-label="Image preview">
      <button className="modal-backdrop" aria-label="Close preview" onClick={onClose} />
      <section className="preview-panel">
        <header className="preview-header">
          <div>
            <strong>{t.title}</strong>
            <span>{t.subtitle}</span>
          </div>
          <button className="icon-button dark" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="preview-images single-image">
          <figure>
            <img src={image} alt="My Pick Liella! board" />
            <button onClick={() => download(image, "mypick-liella.webp")}>
              {t.downloadInline}
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
            {t.showTitles}
          </label>
          <label>
            <input
              type="checkbox"
              checked={transparent}
              onChange={(event) => onToggleTransparent(event.target.checked)}
            />
            {t.transparent}
          </label>
          <div className="preview-actions">
            <button
              className="primary-button"
              disabled={generating}
              onClick={() => download(image, "mypick-liella.webp")}
            >
              {generating ? t.regenerating : t.download}
            </button>
            <button
              className="share-x-button"
              onClick={() => shareToX(t.shareCaption)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {t.shareX}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
