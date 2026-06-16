import { SUPPLEMENTAL_SONGS } from "@/lib/supplemental-songs";
import { SONG_SLUG_ALIASES } from "@/lib/song-aliases";

export type SongBucket = "group" | "unit" | "solo" | "others";

export type MemberId =
  | "kanon"
  | "keke"
  | "chisato"
  | "sumire"
  | "ren"
  | "kinako"
  | "mei"
  | "shiki"
  | "natsumi"
  | "margarete"
  | "tomari";

export interface Song {
  slug: string;
  title: string;
  bucket: SongBucket;
  artist: string;
  cover: string;
  source: string;
}

export interface Member {
  id: MemberId;
  name: string;
  nameJa: string;
  color: string;
  unit: "CatChu!" | "KALEIDOSCORE" | "5yncri5e!";
}

export const MEMBERS: Member[] = [
  { id: "kanon", name: "Kanon Shibuya", nameJa: "澁谷かのん", color: "#ff8b38", unit: "CatChu!" },
  { id: "keke", name: "Keke Tang", nameJa: "唐 可可", color: "#6edee8", unit: "KALEIDOSCORE" },
  { id: "chisato", name: "Chisato Arashi", nameJa: "嵐 千砂都", color: "#ff728f", unit: "5yncri5e!" },
  { id: "sumire", name: "Sumire Heanna", nameJa: "平安名すみれ", color: "#73c95b", unit: "CatChu!" },
  { id: "ren", name: "Ren Hazuki", nameJa: "葉月 恋", color: "#4f65c9", unit: "KALEIDOSCORE" },
  { id: "kinako", name: "Kinako Sakurakoji", nameJa: "桜小路きな子", color: "#f2bd3c", unit: "5yncri5e!" },
  { id: "mei", name: "Mei Yoneme", nameJa: "米女メイ", color: "#dc4b53", unit: "CatChu!" },
  { id: "shiki", name: "Shiki Wakana", nameJa: "若菜四季", color: "#77c7b3", unit: "5yncri5e!" },
  { id: "natsumi", name: "Natsumi Onitsuka", nameJa: "鬼塚夏美", color: "#e96ab0", unit: "5yncri5e!" },
  { id: "margarete", name: "Margarete Wien", nameJa: "ウィーン・マルガレーテ", color: "#9f6ac7", unit: "KALEIDOSCORE" },
  { id: "tomari", name: "Tomari Onitsuka", nameJa: "鬼塚冬毬", color: "#617e9e", unit: "5yncri5e!" },
];

const official = "https://www.lovelive-anime.jp/yuigaoka/music/";
const first = "/covers/liella-first.jpg";
const second = "/covers/liella-second.jpg";
const aspire = "/covers/liella-aspire.jpg";
const startTrueDreams = "/covers/catalog/1891011687.jpg";
const whatAWonderfulDream = "/covers/catalog/1822711899.jpg";
const weWill = "/covers/catalog/1822719909.jpg";
const secondSparkle = "/covers/catalog/1765297122.jpg";
const oikakeruYume = "/covers/catalog/1822719774.jpg";
const letsBeOne = "/covers/catalog/1769354044.jpg";
const daisukiFullPower = "/covers/catalog/1769353965.jpg";
const aspireOriginal = "/covers/catalog/1811959762.jpg";
const unitAlbum = "/covers/unit-jump.jpg";
const catChu = "/covers/unit-catchu.jpg";
const kaleido = "/covers/unit-kaleidoscore.jpg";
const syncrise = "/covers/unit-5yncri5e.jpg";
const uta3 = "/covers/liella-uta3.jpg";
const aiScream = "/covers/others-aiscream.jpg";
const aiScreamNextCard = "/covers/others-aiscream-next-card.jpg";
const ijigenBigbang = "/covers/others-ijigen-bigbang.jpg";
const bringTheLove = "/covers/others-bring-the-love.jpg";
const liveWithASmile = "/covers/catalog/1891029905.jpg";
const shootingVoice = "/covers/catalog/1891005157.jpg";
const sunnyPassion = "/covers/sunny-passion.jpg";
const koiNoTutorial = "/covers/koi-no-tutorial.jpg";

export const SONGS: Song[] = [
  { slug: "koi-no-tutorial", title: "恋のチュートリアル", bucket: "group", artist: "Liella!", cover: koiNoTutorial, source: "https://www.lovelive-anime.jp/yuigaoka/music/detail.php?p=01_5987" },
  { slug: "start-true-dreams", title: "START!! True dreams", bucket: "group", artist: "Liella!", cover: startTrueDreams, source: official },
  { slug: "what-a-wonderful-dream", title: "What a Wonderful Dream!!", bucket: "group", artist: "Liella!", cover: whatAWonderfulDream, source: official },
  { slug: "hajimari-wa-kimi-no-sora", title: "始まりは君の空", bucket: "group", artist: "Liella!", cover: whatAWonderfulDream, source: official },
  { slug: "mirai-wa-kaze-no-you-ni", title: "未来は風のように", bucket: "group", artist: "Liella!", cover: whatAWonderfulDream, source: official },
  { slug: "unison", title: "ユニゾン", bucket: "group", artist: "Liella!", cover: whatAWonderfulDream, source: official },
  { slug: "we-will", title: "WE WILL!!", bucket: "group", artist: "Liella!", cover: weWill, source: official },
  { slug: "second-sparkle", title: "Second Sparkle", bucket: "group", artist: "Liella!", cover: secondSparkle, source: official },
  { slug: "watashi-no-symphony-2022", title: "私のSymphony ～2022Ver.～", bucket: "group", artist: "Liella!", cover: secondSparkle, source: official },
  { slug: "oikakeru-yume-no-saki-de", title: "追いかける夢の先で", bucket: "group", artist: "Liella!", cover: oikakeruYume, source: official },
  { slug: "lets-be-one", title: "Let's be ONE", bucket: "group", artist: "Liella!", cover: letsBeOne, source: official },
  { slug: "aspire", title: "Aspire", bucket: "group", artist: "Liella!", cover: aspireOriginal, source: official },
  { slug: "daisuki-full-power", title: "DAISUKI FULL POWER", bucket: "group", artist: "Liella!", cover: daisukiFullPower, source: official },

  { slug: "alternate", title: "オルタネイト", bucket: "unit", artist: "CatChu!", cover: unitAlbum, source: official },
  { slug: "kageasobi", title: "影遊び", bucket: "unit", artist: "CatChu!", cover: unitAlbum, source: official },
  { slug: "distortion", title: "ディストーション", bucket: "unit", artist: "CatChu!", cover: catChu, source: official },
  { slug: "zenryoku-riot", title: "全力ライオット", bucket: "unit", artist: "CatChu!", cover: catChu, source: official },
  { slug: "wawd-catchu", title: "What a Wonderful Dream!! ～CatChu! Ver.～", bucket: "unit", artist: "CatChu!", cover: catChu, source: official },
  { slug: "velour", title: "ベロア", bucket: "unit", artist: "KALEIDOSCORE", cover: unitAlbum, source: official },
  { slug: "fukashi-na-blue", title: "不可視なブルー", bucket: "unit", artist: "KALEIDOSCORE", cover: unitAlbum, source: official },
  { slug: "neutral", title: "ニュートラル", bucket: "unit", artist: "KALEIDOSCORE", cover: kaleido, source: official },
  { slug: "camellia-no-sasayaki", title: "カメリアの囁き", bucket: "unit", artist: "KALEIDOSCORE", cover: kaleido, source: official },
  { slug: "wawd-kaleidoscore", title: "What a Wonderful Dream!! ～KALEIDOSCORE Ver.～", bucket: "unit", artist: "KALEIDOSCORE", cover: kaleido, source: official },
  { slug: "dancing-raspberry", title: "Dancing Raspberry", bucket: "unit", artist: "5yncri5e!", cover: unitAlbum, source: official },
  { slug: "a-little-love", title: "A Little Love", bucket: "unit", artist: "5yncri5e!", cover: unitAlbum, source: official },
  { slug: "jellyfish", title: "Jellyfish", bucket: "unit", artist: "5yncri5e!", cover: syncrise, source: official },
  { slug: "thank-you-good-morning", title: "Thank you Good morning", bucket: "unit", artist: "5yncri5e!", cover: syncrise, source: official },
  { slug: "wawd-5yncri5e", title: "What a Wonderful Dream!! ～5yncri5e! Ver.～", bucket: "unit", artist: "5yncri5e!", cover: syncrise, source: official },
  { slug: "hot-passion", title: "HOT PASSION!!!", bucket: "unit", artist: "Sunny Passion", cover: sunnyPassion, source: official },
  { slug: "till-sunrise", title: "Till Sunrise", bucket: "unit", artist: "Sunny Passion", cover: sunnyPassion, source: official },

  { slug: "aozora-wo-matteru", title: "青空を待ってる", bucket: "solo", artist: "澁谷かのん", cover: whatAWonderfulDream, source: official },
  { slug: "free-flight", title: "Free Flight", bucket: "solo", artist: "澁谷かのん", cover: secondSparkle, source: official },
  { slug: "over-over", title: "Over Over", bucket: "solo", artist: "澁谷かのん", cover: aspireOriginal, source: official },

  { slug: "mizuiro-no-sunday", title: "水色のSunday", bucket: "solo", artist: "唐 可可", cover: whatAWonderfulDream, source: official },
  { slug: "hoshikuzu-cruising", title: "星屑クルージング", bucket: "solo", artist: "唐 可可", cover: secondSparkle, source: official },
  { slug: "fundamental", title: "ファンダメンタル", bucket: "solo", artist: "唐 可可", cover: aspireOriginal, source: official },

  { slug: "flyers-high", title: "Flyer's High", bucket: "solo", artist: "嵐 千砂都", cover: whatAWonderfulDream, source: official },
  { slug: "kimi-wo-omou-hana-ni-naru", title: "君を想う花になる", bucket: "solo", artist: "嵐 千砂都", cover: secondSparkle, source: official },
  { slug: "rhythm", title: "Rhythm", bucket: "solo", artist: "嵐 千砂都", cover: aspireOriginal, source: official },

  { slug: "mitero", title: "みてろ！", bucket: "solo", artist: "平安名すみれ", cover: whatAWonderfulDream, source: official },
  { slug: "starry-prayer", title: "Starry Prayer", bucket: "solo", artist: "平安名すみれ", cover: secondSparkle, source: official },
  { slug: "just-woo", title: "Just woo!!", bucket: "solo", artist: "平安名すみれ", cover: aspireOriginal, source: official },

  { slug: "binetsu-no-waltz", title: "微熱のワルツ", bucket: "solo", artist: "葉月 恋", cover: whatAWonderfulDream, source: official },
  { slug: "midnight-rhapsody", title: "ミッドナイトラプソディ", bucket: "solo", artist: "葉月 恋", cover: secondSparkle, source: official },
  { slug: "musubiba", title: "結び葉", bucket: "solo", artist: "葉月 恋", cover: aspireOriginal, source: official },

  { slug: "beginners-rock", title: "ビギナーズRock!!", bucket: "solo", artist: "桜小路きな子", cover: secondSparkle, source: official },
  { slug: "tekuteku-biyori", title: "てくてく日和", bucket: "solo", artist: "桜小路きな子", cover: aspireOriginal, source: official },

  { slug: "akane-gokoro", title: "茜心", bucket: "solo", artist: "米女メイ", cover: secondSparkle, source: official },
  { slug: "sky-linker", title: "Sky Linker", bucket: "solo", artist: "米女メイ", cover: aspireOriginal, source: official },

  { slug: "glass-ball-rejection", title: "ガラスボールリジェクション", bucket: "solo", artist: "若菜四季", cover: secondSparkle, source: official },
  { slug: "lilia", title: "LiLiA", bucket: "solo", artist: "若菜四季", cover: aspireOriginal, source: official },

  { slug: "eye-wo-choudai", title: "Eyeをちょうだい", bucket: "solo", artist: "鬼塚夏美", cover: secondSparkle, source: official },
  { slug: "pastel-collage", title: "パステルコラージュ", bucket: "solo", artist: "鬼塚夏美", cover: aspireOriginal, source: official },

  { slug: "dolce-margarete", title: "dolce (ウィーン・マルガレーテ Ver.)", bucket: "solo", artist: "ウィーン・マルガレーテ", cover: uta3, source: official },
  { slug: "ruka", title: "ルカ", bucket: "solo", artist: "ウィーン・マルガレーテ", cover: aspireOriginal, source: official },

  { slug: "dolce-tomari", title: "dolce (鬼塚冬毬 Ver.)", bucket: "solo", artist: "鬼塚冬毬", cover: uta3, source: official },
  { slug: "wild-card", title: "ワイルドカード", bucket: "solo", artist: "鬼塚冬毬", cover: aspireOriginal, source: official },

  { slug: "ai-scream", title: "愛♡スクリ～ム!", bucket: "others", artist: "AiScReam", cover: aiScream, source: "https://lovelive-anime.jp/special/live/live_detail.php?p=aiscream" },
  { slug: "ice-limit", title: "ICE LIMIT", bucket: "others", artist: "AiScReam", cover: aiScream, source: "https://lovelive-anime.jp/special/live/live_detail.php?p=aiscream" },
  { slug: "next-card", title: "NEXT CARD", bucket: "others", artist: "AiScReam", cover: aiScreamNextCard, source: "https://lovelive-anime.jp/special/live/live_detail.php?p=aiscream" },
  { slug: "ijigen-bigbang", title: "異次元★♥BIGBANG", bucket: "others", artist: "異次元フェス選抜メンバー", cover: ijigenBigbang, source: "https://www.ijigen-fes.jp/utagassen/theme.php" },
  { slug: "bring-the-love", title: "Bring the LOVE!", bucket: "others", artist: "ラブライブ！シリーズ選抜メンバー", cover: bringTheLove, source: "https://lovelive-anime.jp/special/live/live_detail.php?p=asiatour_2024" },
  { slug: "live-with-a-smile", title: "LIVE with a smile!", bucket: "others", artist: "Aqours・虹ヶ咲・Liella!", cover: liveWithASmile, source: "https://www.lovelive-anime.jp/" },
  { slug: "shooting-voice", title: "Shooting Voice!!", bucket: "others", artist: "Liella!", cover: shootingVoice, source: "https://www.lovelive-anime.jp/" },
  ...SUPPLEMENTAL_SONGS.filter((song) => !SONG_SLUG_ALIASES[song.slug]),
];

export const SONG_BY_SLUG = Object.fromEntries(
  SONGS.map((song) => [song.slug, song]),
) as Record<string, Song>;

export function songsForBucket(bucket: SongBucket): Song[] {
  return SONGS.filter((song) => song.bucket === bucket);
}
