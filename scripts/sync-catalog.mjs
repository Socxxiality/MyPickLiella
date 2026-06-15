import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LIELLA_ARTIST_ID = 1560074513;
const MEMBERS = [
  "澁谷かのん",
  "唐 可可",
  "嵐 千砂都",
  "平安名すみれ",
  "葉月 恋",
  "桜小路きな子",
  "米女メイ",
  "若菜四季",
  "鬼塚夏美",
  "ウィーン・マルガレーテ",
  "鬼塚冬毬",
];
const OTHER_TITLE_PREFIXES = [
  "LIVE with a smile!",
  "Shooting Voice!!",
];
const EXCLUDED_TRACK_IDS = new Set([
  1891029909, // LIVE with a smile! (Liella! Ver.)
]);

const root = process.cwd();
const catalogPath = path.join(root, "lib", "catalog.ts");
const outputPath = path.join(root, "lib", "supplemental-songs.ts");
const coverDir = path.join(root, "public", "covers", "catalog");

function normalize(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[〜～]/g, "~")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function slugFor(track) {
  return `catalog-${track.trackId}`;
}

function artworkUrl(value) {
  return value
    .replace(/\/\d+x\d+bb\./, "/600x600bb.")
    .replace(/^http:/, "https:");
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "liella-mypick-catalog-sync/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Catalog request failed (${response.status}): ${url}`);
  }
  return response.json();
}

async function artistTracks() {
  const url = new URL("https://itunes.apple.com/lookup");
  url.searchParams.set("id", String(LIELLA_ARTIST_ID));
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", "jp");
  url.searchParams.set("limit", "200");
  const data = await requestJson(url);
  return data.results.filter((result) => result.wrapperType === "track");
}

async function memberTracks(member) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", member);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", "jp");
  url.searchParams.set("limit", "200");
  const data = await requestJson(url);
  return data.results.filter((result) => result.artistName?.startsWith(member));
}

function bucketFor(track, fromMemberSearch) {
  if (OTHER_TITLE_PREFIXES.some((prefix) => track.trackName.startsWith(prefix))) {
    return "others";
  }
  if (!fromMemberSearch) return "group";
  return /[,&＆]/.test(track.artistName) ? "group" : "solo";
}

function isEligible(track) {
  if (!track.trackName || !track.artistName || !track.artworkUrl100 || !track.trackViewUrl) {
    return false;
  }
  if (EXCLUDED_TRACK_IDS.has(track.trackId)) return false;
  if (/off vocal|instrumental/i.test(track.trackName)) return false;
  const releaseTime = Date.parse(track.releaseDate);
  return !Number.isFinite(releaseTime) || releaseTime <= Date.now();
}

function pickPreferred(current, candidate) {
  if (!current) return candidate;
  const currentDate = Date.parse(current.releaseDate) || Number.MAX_SAFE_INTEGER;
  const candidateDate = Date.parse(candidate.releaseDate) || Number.MAX_SAFE_INTEGER;
  return candidateDate < currentDate ? candidate : current;
}

const baseCatalog = await readFile(catalogPath, "utf8");
const existingTitles = new Set(
  [...baseCatalog.matchAll(/title:\s*"([^"]+)"/g)].map((match) => normalize(match[1])),
);

const candidates = new Map();
for (const track of await artistTracks()) {
  if (!isEligible(track)) continue;
  const key = normalize(track.trackName);
  candidates.set(key, {
    ...pickPreferred(candidates.get(key)?.track, track),
    bucket: bucketFor(track, false),
    track,
  });
}

for (const member of MEMBERS) {
  for (const track of await memberTracks(member)) {
    if (!isEligible(track)) continue;
    const key = normalize(track.trackName);
    const current = candidates.get(key);
    const preferred = pickPreferred(current?.track, track);
    candidates.set(key, {
      ...preferred,
      bucket: current?.bucket ?? bucketFor(track, true),
      track: preferred,
    });
  }
}

const songs = [...candidates.entries()]
  .filter(([key]) => !existingTitles.has(key))
  .map(([, value]) => ({
    slug: slugFor(value.track),
    title: value.track.trackName,
    bucket: value.bucket,
    artist: value.track.artistName.replace(/\s*\(CV\.[^)]+\)/g, ""),
    cover: `/covers/catalog/${value.track.collectionId}.jpg`,
    source: value.track.trackViewUrl,
    releaseDate: value.track.releaseDate,
    artwork: artworkUrl(value.track.artworkUrl100),
    collectionId: value.track.collectionId,
  }))
  .sort((left, right) =>
    left.bucket.localeCompare(right.bucket) ||
    Date.parse(left.releaseDate) - Date.parse(right.releaseDate) ||
    left.title.localeCompare(right.title, "ja")
  );

await mkdir(coverDir, { recursive: true });
const covers = new Map(songs.map((song) => [song.collectionId, song.artwork]));
for (const [collectionId, url] of covers) {
  const destination = path.join(coverDir, `${collectionId}.jpg`);
  const response = await fetch(url, {
    headers: { "User-Agent": "liella-mypick-catalog-sync/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Cover download failed (${response.status}): ${url}`);
  }
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

const generated = `import type { Song } from "@/lib/catalog";

// Generated by scripts/sync-catalog.mjs. Do not edit manually.
export const SUPPLEMENTAL_SONGS: Song[] = ${JSON.stringify(
  songs.map(({ releaseDate, artwork, collectionId, ...song }) => song),
  null,
  2,
)};
`;

await writeFile(outputPath, generated, "utf8");

const counts = songs.reduce((result, song) => {
  result[song.bucket] = (result[song.bucket] ?? 0) + 1;
  return result;
}, {});
console.log(JSON.stringify({ generated: songs.length, counts }, null, 2));
