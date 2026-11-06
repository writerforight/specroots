// Builds public/data/index.json (the alphabetical root list) and public/data/affix-index.json
// (which words of which roots carry each prefix and suffix) from public/data/roots/*.json, and
// public/data/objects-index.json (the alphabetical object list) from public/data/objects/*.json.
// Run: npm run data. The build runs it too, so the indexes never drift from the root files.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dirname, '..', 'public', 'data');
const rootsDir = join(dataDir, 'roots');

const roots = readdirSync(rootsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(rootsDir, f), 'utf8')))
  .sort((a, b) => a.forms[0].localeCompare(b.forms[0]));

const index = roots.map(({ id, forms, origin, meaning, words }) => ({ id, forms, origin, meaning, words: words.map((w) => w.id) }));
writeFileSync(join(dataDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');

// affix id → root id → word ids, roots in list order. One line per affix keeps diffs readable.
const usage = new Map();
for (const root of roots) {
  for (const word of root.words) {
    for (const part of new Set(word.parts.filter((p) => p.startsWith('-') || p.endsWith('-')))) {
      const byRoot = usage.get(part) ?? usage.set(part, {}).get(part);
      (byRoot[root.id] ??= []).push(word.id);
    }
  }
}
const lines = [...usage].sort(([a], [b]) => a.localeCompare(b)).map(([id, byRoot]) => `  ${JSON.stringify(id)}: ${JSON.stringify(byRoot)}`);
writeFileSync(join(dataDir, 'affix-index.json'), `{\n${lines.join(',\n')}\n}\n`);

console.log(`index.json: ${index.length} roots, ${index.reduce((n, r) => n + r.words.length, 0)} words`);
console.log(`affix-index.json: ${usage.size} affixes`);

// Objects: every file is read again on each run, so a new object lands in alphabetical order and a
// name that is already taken (in any language) is reported instead of silently added twice.
const objectsDir = join(dataDir, 'objects');
const objects = readdirSync(objectsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(objectsDir, f), 'utf8')))
  .sort((a, b) => a.name.localeCompare(b.name));
const seen = new Map();
for (const { id, name, names } of objects) {
  for (const [lang, text] of [['en', name], ...Object.entries(names)]) {
    const key = `${lang}:${text.toLowerCase()}`;
    if (seen.has(key)) console.warn(`warning: ${lang} "${text}" is used by both ${seen.get(key)} and ${id}`);
    else seen.set(key, id);
  }
}
const objectLines = objects.map(({ id, name, place, names }) => `  ${JSON.stringify({ id, name, place, names })}`);
writeFileSync(join(dataDir, 'objects-index.json'), `[\n${objectLines.join(',\n')}\n]\n`);
console.log(`objects-index.json: ${objects.length} objects`);
