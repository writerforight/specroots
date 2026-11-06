import { Affix, type AffixIndex, type AffixKind, type AffixOccurrence } from '../domain/Affix';
import { isLang, type Localized } from '../domain/Language';
import { Morpheme } from '../domain/Morpheme';
import { Root, type Origin, type RootSummary } from '../domain/Root';
import { Sentence } from '../domain/Sentence';
import { Word, type PartOfSpeech } from '../domain/Word';

export class LexiconError extends Error {
  constructor(where: string, problem: string) {
    super(`${where}: ${problem}`);
    this.name = 'LexiconError';
  }
}

const ORIGINS: readonly Origin[] = ['la', 'gr'];
const PARTS_OF_SPEECH: readonly PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb', 'preposition'];
const AFFIX_KINDS: readonly AffixKind[] = ['prefix', 'suffix'];

type Json = Record<string, unknown>;

/**
 * Turns the raw JSON files in public/data into domain objects and rejects anything malformed,
 * so a broken data file fails loudly in tests instead of rendering half a page.
 */
export class LexiconParser {
  parseAffixes(raw: unknown): Map<string, Affix> {
    const obj = this.object(raw, 'affixes.json');
    const affixes = new Map<string, Affix>();
    for (const [id, value] of Object.entries(obj)) {
      const where = `affixes.json › ${id}`;
      const entry = this.object(value, where);
      const kind = this.oneOf(entry.kind, AFFIX_KINDS, `${where} › kind`);
      const shape = kind === 'prefix' ? /^[a-z]+(-[a-z]+)*-$/ : /^-[a-z]+(-[a-z]+)*$/;
      if (!shape.test(id)) throw new LexiconError(where, `a ${kind} id must look like ${kind === 'prefix' ? '"re-" or "in-not-"' : '"-ion" or "-ive-adj"'}`);
      const form = entry.form === undefined ? id.replace(/^-|-$/g, '') : this.string(entry.form, `${where} › form`);
      if (!/^[a-z]+$/.test(form)) throw new LexiconError(where, `form "${form}" must be lowercase letters only; homograph ids need an explicit "form"`);
      if (entry.combining !== undefined && typeof entry.combining !== 'boolean') throw new LexiconError(where, '"combining" must be true or false');
      affixes.set(id, new Affix(id, kind, this.localized(entry.meaning, `${where} › meaning`), form, entry.combining === true));
    }
    return affixes;
  }

  parseRoot(raw: unknown, affixes: ReadonlyMap<string, Affix>): Root {
    const obj = this.object(raw, 'root');
    const id = this.string(obj.id, 'root › id');
    const where = `roots/${id}.json`;
    const forms = this.strings(obj.forms, `${where} › forms`);
    const words = this.array(obj.words, `${where} › words`).map((w, i) =>
      this.parseWord(w, `${where} › words[${i}]`, forms, affixes),
    );

    const ids = new Set<string>();
    for (const word of words) {
      if (ids.has(word.id)) throw new LexiconError(where, `word "${word.id}" appears twice`);
      ids.add(word.id);
    }
    for (const word of words) {
      if (word.parentId !== null && !ids.has(word.parentId)) {
        throw new LexiconError(`${where} › ${word.id}`, `parent "${word.parentId}" is not a word of this root`);
      }
    }

    return new Root(
      id,
      forms,
      this.oneOf(obj.origin, ORIGINS, `${where} › origin`),
      this.string(obj.etymon, `${where} › etymon`),
      this.localized(obj.meaning, `${where} › meaning`),
      words,
    );
  }

  parseAffixIndex(raw: unknown, affixes: ReadonlyMap<string, Affix>): AffixIndex {
    const obj = this.object(raw, 'affix-index.json');
    const index = new Map<string, AffixOccurrence[]>();
    for (const [id, value] of Object.entries(obj)) {
      const where = `affix-index.json › ${id}`;
      if (!affixes.has(id)) throw new LexiconError(where, `affix "${id}" is not in affixes.json`);
      const byRoot = this.object(value, where);
      index.set(
        id,
        Object.entries(byRoot).map(([rootId, words]) => ({ rootId, wordIds: this.strings(words, `${where} › ${rootId}`) })),
      );
    }
    return index;
  }

  parseIndex(raw: unknown): RootSummary[] {
    return this.array(raw, 'index.json').map((value, i) => {
      const where = `index.json[${i}]`;
      const obj = this.object(value, where);
      return {
        id: this.string(obj.id, `${where} › id`),
        forms: this.strings(obj.forms, `${where} › forms`),
        origin: this.oneOf(obj.origin, ORIGINS, `${where} › origin`),
        meaning: this.localized(obj.meaning, `${where} › meaning`),
        words: this.strings(obj.words, `${where} › words`),
      };
    });
  }

  private parseWord(raw: unknown, where: string, forms: readonly string[], affixes: ReadonlyMap<string, Affix>): Word {
    const obj = this.object(raw, where);
    const id = this.string(obj.id, `${where} › id`);
    const here = `${where} (${id})`;

    const parts = this.strings(obj.parts, `${here} › parts`).map((part) => {
      if (part.startsWith('-') || part.endsWith('-')) {
        const affix = affixes.get(part);
        if (!affix) throw new LexiconError(here, `affix "${part}" is not in affixes.json`);
        return Morpheme.ofAffix(affix);
      }
      if (!forms.includes(part)) throw new LexiconError(here, `"${part}" is not one of the root forms ${forms.join(', ')}`);
      return Morpheme.ofRoot(part);
    });
    if (!parts.some((p) => p.kind === 'root')) throw new LexiconError(here, 'parts must contain the root');

    const parent = obj.parent === null ? null : this.string(obj.parent, `${here} › parent`);
    const sentences = this.array(obj.sentences, `${here} › sentences`).map((s, i) => {
      const sw = `${here} › sentences[${i}]`;
      const { en, ...rest } = this.localized(s, sw);
      if (!en) throw new LexiconError(sw, 'an English sentence is required');
      const sentence = new Sentence(en, rest);
      if (sentence.highlighted.length !== 1) throw new LexiconError(sw, 'mark exactly one [word] in the English sentence');
      return sentence;
    });

    const word = new Word(id, this.oneOf(obj.pos, PARTS_OF_SPEECH, `${here} › pos`), parent, parts, this.localized(obj.gloss, `${here} › gloss`), sentences);
    if (word.text !== id) throw new LexiconError(here, `parts spell "${word.text}", not "${id}"`);
    return word;
  }

  private object(value: unknown, where: string): Json {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new LexiconError(where, 'expected an object');
    return value as Json;
  }

  private array(value: unknown, where: string): unknown[] {
    if (!Array.isArray(value)) throw new LexiconError(where, 'expected an array');
    return value;
  }

  private string(value: unknown, where: string): string {
    if (typeof value !== 'string' || value.length === 0) throw new LexiconError(where, 'expected a non-empty string');
    return value;
  }

  private strings(value: unknown, where: string): string[] {
    const list = this.array(value, where).map((v, i) => this.string(v, `${where}[${i}]`));
    if (list.length === 0) throw new LexiconError(where, 'must not be empty');
    return list;
  }

  private oneOf<T extends string>(value: unknown, allowed: readonly T[], where: string): T {
    if (!allowed.includes(value as T)) throw new LexiconError(where, `expected one of ${allowed.join(', ')}`);
    return value as T;
  }

  private localized(value: unknown, where: string): Localized {
    const obj = this.object(value, where);
    const out: Localized = {};
    for (const [lang, text] of Object.entries(obj)) {
      if (!isLang(lang)) throw new LexiconError(where, `unknown language "${lang}"`);
      out[lang] = this.string(text, `${where} › ${lang}`);
    }
    return out;
  }
}
