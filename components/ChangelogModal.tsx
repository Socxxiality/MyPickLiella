"use client";

type Lang = "en" | "ja" | "zh";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: Record<Lang, string[]>;
}

const ui = {
  en: { title: "Changelog", subtitle: "What's new in MY PICK Liella!" },
  ja: { title: "更新履歴", subtitle: "MY PICK Liella! の最新情報" },
  zh: { title: "更新日志", subtitle: "MY PICK Liella! 的最新动态" },
} satisfies Record<Lang, { title: string; subtitle: string }>;

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1",
    date: "2026-06-15",
    changes: {
      en: [
        "Merged duplicate「LIVE with a smile!」entries — existing Liella! Ver. votes now count toward the main song",
        "Added Changelog page",
        "Added Chinese (中文) language support",
        "Added Share to X button in preview modal",
        "Added Dark Mode theme toggle",
        "Added Sunny Passion songs to the Subunit catalog",
        "Added Romaji subtitles and Romaji search functionality for Japanese Title songs",
      ],
      ja: [
        "重複していた「LIVE with a smile!」を統合 — 既存のLiella! Ver.の投票はメイン楽曲に移行",
        "更新履歴ページを追加",
        "中国語（中文）対応を追加",
        "プレビューモーダルにXへのシェアボタンを追加",
        "ダークモードのテーマ切り替えを追加",
        "サブユニットにSunny Passionの楽曲を追加",
        "日本語楽曲にローマ字のサブタイトルと検索機能を追加",
      ],
      zh: [
        "合并了重复的「LIVE with a smile!」条目 — 现有 Liella! Ver. 的投票已转移至主歌曲",
        "新增更新日志页面",
        "新增中文语言支持",
        "预览弹窗新增分享到 X 按钮",
        "新增深色模式主题切换",
        "在小分队曲目中新增 Sunny Passion 的歌曲",
        "为日文歌曲新增罗马音字幕及罗马音搜索功能",
      ],
    },
  },
  {
    version: "1.0",
    date: "2026-06-15",
    changes: {
      en: [
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
      ja: [
        "MY PICK Liella! 初回リリース",
        "Liella!、ユニット、ソロ、その他カテゴリの選曲機能",
        "「最も選ばれた楽曲」セクションを追加 — 全カテゴリ横断のトップ10",
        "カテゴリ別ランキングをトップ10に固定",
        "エクスポートボードを1枚の画像にまとめてダウンロード",
        "エクスポートボードのコンパクトレイアウト",
        "プレビューモーダルで1枚の画像と1つのダウンロードボタンを表示",
        "ソロ楽曲を3枠に統合（メンバーごと10枠から変更）",
        "コラボ・シリーズ横断楽曲の「その他」カテゴリを追加",
        "リアルタイム匿名投票のCommunity Picks機能",
        "Apple Musicと同期した楽曲カタログ",
        "バイリンガル対応（English / 日本語）",
        "グラスモーフィズムのプレミアムUIデザイン",
      ],
      zh: [
        "MY PICK Liella! 首次发布",
        "支持 Liella!、小组、个人、其他分类的选曲功能",
        "新增「最受欢迎歌曲」板块 — 跨分类综合 Top 10",
        "各分类排行锁定为 Top 10",
        "导出面板合并为单张图片下载",
        "导出面板紧凑布局",
        "预览弹窗显示单张图片和单个下载按钮",
        "个人歌曲整合为3个统一槽位（原为每成员10个）",
        "新增「其他」分类，支持合作曲和跨系列歌曲",
        "社区选曲功能，支持实时匿名投票和排行",
        "歌曲目录与 Apple Music 同步",
        "双语支持（English / 日本語）",
        "全新高级玻璃拟态 UI 设计",
      ],
    },
  },
];

interface ChangelogModalProps {
  lang: Lang;
  onClose: () => void;
}

export default function ChangelogModal({ lang, onClose }: ChangelogModalProps) {
  const t = ui[lang];

  return (
    <div className="modal-shell changelog-shell" role="dialog" aria-modal="true" aria-label="Changelog">
      <button className="modal-backdrop" aria-label="Close changelog" onClick={onClose} />
      <section className="changelog-panel">
        <header className="changelog-header">
          <div>
            <strong>{t.title}</strong>
            <span>{t.subtitle}</span>
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
                {entry.changes[lang].map((change, index) => (
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
