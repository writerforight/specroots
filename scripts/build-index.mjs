// Builds public/data/index.json (the alphabetical root list) from public/data/roots/*.json.
// Run: npm run data. The build runs it too, so the index never drifts from the root files.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dirname, '..', 'public', 'data');
const rootsDir = join(dataDir, 'roots');

const index = readdirSync(rootsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(rootsDir, f), 'utf8')))
  .map(({ id, forms, origin, meaning, words }) => ({ id, forms, origin, meaning, words: words.map((w) => w.id) }))
  .sort((a, b) => a.forms[0].localeCompare(b.forms[0]));

writeFileSync(join(dataDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`index.json: ${index.length} roots, ${index.reduce((n, r) => n + r.words.length, 0)} words`);
