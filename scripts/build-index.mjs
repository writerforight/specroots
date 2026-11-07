// Also public/data/de/index.json for the German roots.
// Builds public/data/index.json (the alphabetical root list) and public/data/affix-index.json
// (which words of which roots carry each prefix and suffix) from public/data/roots/*.json, and
// public/data/objects-index.json + lists-index.json from public/data/objects/*.json and lists/*.json.
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

// Objects and lists: every file is read again on each run, so a new object lands in alphabetical
// order, a name that is already taken (in any language) is reported instead of silently added twice,
// and a list that points to a missing object fails the build.
const objectsDir = join(dataDir, 'objects');
const listsDir = join(dataDir, 'lists');
const readAll = (dir) => readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const objects = readAll(objectsDir).sort((a, b) => a.name.localeCompare(b.name));
const lists = readAll(listsDir).sort((a, b) => a.title.en.localeCompare(b.title.en));
const objectIds = new Set(objects.map((o) => o.id));
const listsOf = new Map(objects.map((o) => [o.id, []]));
for (const list of lists) {
  for (const id of list.objects) {
    if (!objectIds.has(id)) throw new Error(`lists/${list.id}.json: object "${id}" has no file in objects/`);
    listsOf.get(id).push(list.id);
  }
}
const seen = new Map();
for (const { id, name, names } of objects) {
  if (listsOf.get(id).length === 0) console.warn(`warning: ${id} is in no list`);
  for (const [lang, text] of [['en', name], ...Object.entries(names)]) {
    const key = `${lang}:${text.toLowerCase()}`;
    if (seen.has(key)) console.warn(`warning: ${lang} "${text}" is used by both ${seen.get(key)} and ${id}`);
    else seen.set(key, id);
  }
}
const objectLines = objects.map(({ id, name, names, image }) => `  ${JSON.stringify({ id, name, names, lists: listsOf.get(id), photo: image?.file ?? null })}`);
writeFileSync(join(dataDir, 'objects-index.json'), `[\n${objectLines.join(',\n')}\n]\n`);
const listLines = lists.map(({ id, title, objects: ids }) => `  ${JSON.stringify({ id, title, count: ids.length })}`);
writeFileSync(join(dataDir, 'lists-index.json'), `[\n${listLines.join(',\n')}\n]\n`);
console.log(`objects-index.json: ${objects.length} objects; lists-index.json: ${lists.map((l) => `${l.id} ${l.objects.length}`).join(', ')}`);

// German roots (SPEC decision 16): public/data/de/ has the same layout as public/data. Only the list
// index is needed for now; German affixes have no pages of their own yet.
const deDir = join(dataDir, 'de');
const deRoots = readAll(join(deDir, 'roots')).sort((a, b) => a.forms[0].localeCompare(b.forms[0], 'de'));
const deIndex = deRoots.map(({ id, forms, origin, meaning, words }) => ({ id, forms, origin, meaning, words: words.map((w) => w.id) }));
writeFileSync(join(deDir, 'index.json'), JSON.stringify(deIndex, null, 2) + '\n');
console.log(`de/index.json: ${deIndex.length} German roots, ${deIndex.reduce((n, r) => n + r.words.length, 0)} words`);
