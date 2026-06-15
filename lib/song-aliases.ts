export const SONG_SLUG_ALIASES: Readonly<Record<string, string>> = {
  "catalog-1891029909": "live-with-a-smile",
};

export function canonicalSongSlug(slug: string): string {
  return SONG_SLUG_ALIASES[slug] ?? slug;
}
