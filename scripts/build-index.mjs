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

// Everyday expressions (SPEC decision 19): one file per category, in the order of CATEGORY_ORDER below
// (the order a learner meets the feelings in, not A–Z); a category not named there goes to the end.
// An expression id is used once in the whole section, so a search hit can never point at two cards.
const CATEGORY_ORDER = ['anger', 'happiness', 'sadness', 'anxiety', 'surprise', 'confusion', 'exhaustion', 'confidence', 'embarrassment', 'fear', 'affection', 'indifference', 'relief', 'conflict'];
const rank = (id) => (CATEGORY_ORDER.indexOf(id) + 1 || CATEGORY_ORDER.length + 1);
const categories = readAll(join(dataDir, 'expressions')).sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
const expressionHome = new Map();
for (const category of categories) {
  for (const { id } of category.expressions) {
    if (expressionHome.has(id)) throw new Error(`expressions/${category.id}.json: "${id}" is already in expressions/${expressionHome.get(id)}.json`);
    expressionHome.set(id, category.id);
  }
}
const categoryLines = categories.map(({ id, title, expressions }) => `  ${JSON.stringify({ id, title, expressions: expressions.map((e) => ({ id: e.id, expr: e.expr, kind: e.kind })) })}`);
writeFileSync(join(dataDir, 'expressions-index.json'), `[\n${categoryLines.join(',\n')}\n]\n`);
console.log(`expressions-index.json: ${categories.length} categories, ${expressionHome.size} expressions`);

// German roots (SPEC decision 16): public/data/de/ has the same layout as public/data. Only the list
// index is needed for now; German affixes have no pages of their own yet.
const deDir = join(dataDir, 'de');
const deRoots = readAll(join(deDir, 'roots')).sort((a, b) => a.forms[0].localeCompare(b.forms[0], 'de'));
const deIndex = deRoots.map(({ id, forms, origin, meaning, words }) => ({ id, forms, origin, meaning, words: words.map((w) => w.id) }));
writeFileSync(join(deDir, 'index.json'), JSON.stringify(deIndex, null, 2) + '\n');
console.log(`de/index.json: ${deIndex.length} German roots, ${deIndex.reduce((n, r) => n + r.words.length, 0)} words`);

// Contributors (SPEC decision 18): contributors.json names the people; every root, object and list
// file says who added it in "addedBy". A word added later to someone else's root carries its own
// "addedBy"; without one it counts for whoever added the root. One line per person, A–Z by id, so
// two pull requests rarely touch the same line.
const people = JSON.parse(readFileSync(join(dataDir, 'contributors.json'), 'utf8'));
const tally = new Map(Object.entries(people).map(([id, { name }]) => [id, { id, name, words: { en: 0, de: 0 }, objects: 0, roots: [], lists: [], expressions: 0 }]));
const credit = (id, where) => {
  const entry = tally.get(id);
  if (!entry) throw new Error(`${where}: "addedBy" is ${JSON.stringify(id)}; it must be a GitHub user name listed in contributors.json`);
  return entry;
};
for (const [lang, list, dir] of [['en', roots, 'roots'], ['de', deRoots, 'de/roots']]) {
  for (const root of list) {
    credit(root.addedBy, `${dir}/${root.id}.json`).roots.push({ id: root.id, label: root.forms[0], lang });
    for (const word of root.words) credit(word.addedBy ?? root.addedBy, `${dir}/${root.id}.json, word ${word.id}`).words[lang]++;
  }
}
for (const object of objects) credit(object.addedBy, `objects/${object.id}.json`).objects++;
for (const list of lists) credit(list.addedBy, `lists/${list.id}.json`).lists.push({ id: list.id, title: list.title });
for (const category of categories) credit(category.addedBy, `expressions/${category.id}.json`).expressions += category.expressions.length;
const contributorLines = [...tally.values()].sort((a, b) => a.id.localeCompare(b.id)).map((c) => `  ${JSON.stringify(c)}`);
writeFileSync(join(dataDir, 'contributors-index.json'), `[\n${contributorLines.join(',\n')}\n]\n`);
console.log(`contributors-index.json: ${tally.size} contributors`);
