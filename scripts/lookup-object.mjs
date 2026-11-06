// Looks up an everyday object before it is added to public/data/objects/.
// Prints Wiktionary (via kaikki.org) noun senses with TR/DE/FR/IT/ES translations, genders and the
// etymology, and Wikidata items with their photo (P18). Nothing is written: a person (or Claude)
// picks the right sense and writes the object file by hand, so wrong senses never slip in.
// Run: node scripts/lookup-object.mjs "chalk" ["paper clip" …]
const LANGS = ['tr', 'de', 'fr', 'it', 'es'];
const UA = { 'User-Agent': 'specroots-lookup/0.1 (https://github.com/writerforight/specroots)' };

async function json(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function kaikki(word) {
  const a = word[0];
  const ab = word.slice(0, 2).padEnd(2, '_');
  const url = `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(a)}/${encodeURIComponent(ab)}/${encodeURIComponent(word)}.jsonl`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return [];
  const text = await res.text();
  return text.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.pos === 'noun');
}

async function wikidata(word) {
  const search = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(word)}&language=en&format=json&limit=4`);
  const ids = search.search.map((r) => r.id);
  if (ids.length === 0) return [];
  const ents = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=claims|descriptions&languages=en&format=json`);
  return ids.map((id) => {
    const e = ents.entities[id];
    return { id, description: e.descriptions?.en?.value ?? '', image: e.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null };
  });
}

for (const word of process.argv.slice(2)) {
  console.log(`\n=== ${word} ===`);
  const [entries, items] = await Promise.all([kaikki(word), wikidata(word).catch(() => [])]);
  for (const entry of entries) {
    if (entry.etymology_text) console.log(`etym: ${entry.etymology_text.replace(/\s+/g, ' ').slice(0, 220)}`);
    const bySense = new Map();
    for (const t of entry.translations ?? []) {
      if (!LANGS.includes(t.code)) continue;
      const sense = (t.sense ?? '').slice(0, 70);
      const list = bySense.get(sense) ?? bySense.set(sense, []).get(sense);
      list.push(`${t.code}:${t.word}${t.tags?.length ? `(${t.tags.filter((g) => /masculine|feminine|neuter/.test(g)).map((g) => g[0]).join('')})` : ''}`);
    }
    for (const [sense, list] of bySense) console.log(`  [${sense}] ${list.join(' ')}`);
  }
  for (const item of items) console.log(`  wd ${item.id}: ${item.description} | ${item.image ?? '-'}`);
}
