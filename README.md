# My Pick Liella!

Unofficial fan selection board for **Liella! / Love Live! Superstar!!**.

This is a standalone project. It does not share source files, browser storage,
or the Community Picks database with My Pick IKIZULIVE or the Aqours counter.

## Features

- 3 favorite Liella! songs
- 3 favorite songs from CatChu!, KALEIDOSCORE, and 5yncri5e!
- 3 favorite solo songs from any of the 11 members
- 3 collaboration, cross-series, or special songs in Others
- Header widget showing the current total catalog size
- English and Japanese interface
- Picks and display name saved locally in the browser
- Two downloadable 9:16 WebP boards
- Anonymous Community Picks with one current ballot per browser
- Automatic community sync when a pick is added, changed, or removed

Community ballots are stored in `data/liella-community-picks.sqlite3`. The
random browser voter ID is hashed before storage. Display names are never sent
to the API.

The initial catalog is based on official Love Live! music pages and includes
songs from `What a Wonderful Dream!!`, `Second Sparkle`, `Aspire`, the unit
mini album, the first subunit singles, AiScReam, and cross-series projects such
as Ijigen Fes. Supplemental tracks are synced from the official Liella! artist
catalog on Apple Music, with off-vocal and instrumental tracks excluded.

Refresh the generated catalog and local covers with:

```powershell
npm run catalog:sync
```

## Development

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>.

## References

- <https://www.lovelive-anime.jp/yuigaoka/member/>
- <https://www.lovelive-anime.jp/yuigaoka/music/>
- <https://github.com/rurimegu/MyPickHasunosora>
- <https://aqours-mypick.ccwu.cc/>
- <https://mypick-ikizulive.kotoha.moe/>
- <https://mypick-nijigaku.naufalalfa.com//>
