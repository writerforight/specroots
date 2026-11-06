// Builds public/data/index.json (the alphabetical root list) and public/data/affix-index.json
// (which words of which roots carry each prefix and suffix) from public/data/roots/*.json.
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
