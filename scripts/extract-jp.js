const fs = require('fs');
const catalog = fs.readFileSync('lib/catalog.ts', 'utf8');
const supplemental = fs.readFileSync('lib/supplemental-songs.ts', 'utf8');
const jpPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
const results = {};

for (const match of catalog.matchAll(/slug:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"/g)) {
  if (jpPattern.test(match[2])) results[match[1]] = match[2];
}
for (const match of supplemental.matchAll(/"slug":\s*"([^"]+)"[\s\S]*?"title":\s*"([^"]+)"/g)) {
  if (jpPattern.test(match[2])) results[match[1]] = match[2];
}
fs.mkdirSync('scratch', { recursive: true });
fs.writeFileSync('scratch/jp-songs.json', JSON.stringify(results, null, 2));
console.log(`Extracted ${Object.keys(results).length} songs.`);
