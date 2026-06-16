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
    version: "1.2",
    date: "2026-06-15",
    changes: {
      en: [
        "Added a 'By generation' / 'Liella!' mode toggle to view picks either way",
        "Split Liella! songs into Generation rows — Gen 1, Gen 2, and Gen 3 — based on LL-Fans lineup data",
        "Added a dedicated Solo row for all member solo songs",
        "Added a Liella! no Uta (リエラのうた) row",
        "By generation has 7 rows (21 picks): Gen 1 / Gen 2 / Gen 3 / Subunit / Solo / Liella! no Uta / Others",
        "Updated song titles with authoritative romanized names from LL-Fans",
        "Switching modes preserves your picks: the Liella! view can show only 3 full-group songs, but extra Gen picks stay remembered and reappear in By generation (deleting a visible song removes it from both)",
      ],
      ja: [
        "「世代別」「Liella!」表示を切り替えるモードトグルを追加",
        "Liella!楽曲をLL-Fansのメンバー編成データに基づき1期生・2期生・3期生に分割",
        "全メンバーのソロ曲をまとめた「ソロ楽曲」枠を追加",
        "「リエラのうた」枠を追加",
        "世代別表示を7カテゴリ（21曲）に拡張：1期生 / 2期生 / 3期生 / ユニット / ソロ / リエラのうた / その他",
        "LL-Fans準拠のローマ字表記に楽曲タイトルを更新",
        "モード切り替えで選曲を保持：Liella!表示はグループ曲を3曲しか表示できませんが、超過した世代別の選曲は記憶され、世代別表示に戻すと復元されます（表示中の曲を削除すると両方から削除）",
      ],
      zh: [
        "新增「按世代」/「Liella!」模式切换，可用两种方式查看选曲",
        "根据 LL-Fans 的成员编成数据，将 Liella! 歌曲拆分为一期生 / 二期生 / 三期生",
        "新增「个人歌曲」分类，集中所有成员个人曲",
        "新增「リエラのうた」分类",
        "按世代模式扩展为7个分类（21首）：一期生 / 二期生 / 三期生 / 小组 / 个人 / リエラのうた / 其他",
        "使用 LL-Fans 权威罗马音更新歌曲标题",
        "切换模式时保留选曲：Liella! 视图仅能显示3首团体曲，超出的世代选曲会被记住并在切回按世代时恢复（删除可见曲会同时从两者移除）",
      ],
    },
  },
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
