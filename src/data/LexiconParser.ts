import { Affix, type AffixIndex, type AffixKind, type AffixOccurrence } from '../domain/Affix';
import { Contributor } from '../domain/Contributor';
import { BREAKDOWN_LANGS, EverydayObject, stripArticle, type CommonsImage, type ListSummary, type NamePart, type ObjectSummary, type WordList } from '../domain/EverydayObject';
import { isLang, TRANSLATION_LANGUAGES, type Localized, type SourceLang, type TranslationLang } from '../domain/Language';
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

const ORIGINS: readonly Origin[] = ['la', 'gr', 'de'];
const PARTS_OF_SPEECH: readonly PartOfSpeech[] = ['verb', 'noun', 'adjective', 'adverb', 'preposition'];
const SOURCE_LANGS: readonly SourceLang[] = ['en', 'de'];
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
      // German affixes keep their umlauts and ß (über-, -schaft); English ones are plain a–z.
      const shape = kind === 'prefix' ? /^[a-zäöüß]+(-[a-zäöüß]+)*-$/ : /^-[a-zäöüß]+(-[a-zäöüß]+)*$/;
      if (!shape.test(id)) throw new LexiconError(where, `a ${kind} id must look like ${kind === 'prefix' ? '"re-" or "in-not-"' : '"-ion" or "-ive-adj"'}`);
      const form = entry.form === undefined ? id.replace(/^-|-$/g, '') : this.string(entry.form, `${where} › form`);
      if (!/^[a-zäöüß]+$/.test(form)) throw new LexiconError(where, `form "${form}" must be lowercase letters only; homograph ids need an explicit "form"`);
      if (entry.combining !== undefined && typeof entry.combining !== 'boolean') throw new LexiconError(where, '"combining" must be true or false');
      affixes.set(id, new Affix(id, kind, this.localized(entry.meaning, `${where} › meaning`), form, entry.combining === true));
    }
    return affixes;
  }

  /** language: what the root's words are in; German words keep their capitals (Verstand) and German sentences lead. */
  parseRoot(raw: unknown, affixes: ReadonlyMap<string, Affix>, language: SourceLang = 'en'): Root {
    const obj = this.object(raw, 'root');
    const id = this.string(obj.id, 'root › id');
    const where = `roots/${id}.json`;
    const forms = this.strings(obj.forms, `${where} › forms`);
    const words = this.array(obj.words, `${where} › words`).map((w, i) =>
      this.parseWord(w, `${where} › words[${i}]`, forms, affixes, language),
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
      language,
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

  parseContributors(raw: unknown): Contributor[] {
    return this.array(raw, 'contributors-index.json').map((value, i) => {
      const where = `contributors-index.json[${i}]`;
      const obj = this.object(value, where);
      const words = this.object(obj.words, `${where} › words`);
      const count = (v: unknown, what: string): number => {
        if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) throw new LexiconError(where, `"${what}" must be a count`);
        return v;
      };
      const roots = this.array(obj.roots, `${where} › roots`).map((r, j) => {
        const root = this.object(r, `${where} › roots[${j}]`);
        return { id: this.string(root.id, `${where} › roots[${j}] › id`), label: this.string(root.label, `${where} › roots[${j}] › label`), lang: this.oneOf(root.lang, SOURCE_LANGS, `${where} › roots[${j}] › lang`) };
      });
      const lists = this.array(obj.lists, `${where} › lists`).map((l, j) => {
        const list = this.object(l, `${where} › lists[${j}]`);
        return { id: this.string(list.id, `${where} › lists[${j}] › id`), title: this.localized(list.title, `${where} › lists[${j}] › title`) };
      });
      return new Contributor(
        this.string(obj.id, `${where} › id`),
        this.string(obj.name, `${where} › name`),
        { en: count(words.en, 'words.en'), de: count(words.de, 'words.de') },
        count(obj.objects, 'objects'),
        roots,
        lists,
      );
    });
  }

  parseListIndex(raw: unknown): ListSummary[] {
    return this.array(raw, 'lists-index.json').map((value, i) => {
      const where = `lists-index.json[${i}]`;
      const obj = this.object(value, where);
      if (typeof obj.count !== 'number') throw new LexiconError(where, '"count" must be a number');
      return { id: this.string(obj.id, `${where} › id`), title: this.localized(obj.title, `${where} › title`), count: obj.count };
    });
  }

  parseList(raw: unknown): WordList {
    const obj = this.object(raw, 'list');
    const id = this.string(obj.id, 'list › id');
    const where = `lists/${id}.json`;
    const objectIds = this.strings(obj.objects, `${where} › objects`);
    const seen = new Set<string>();
    for (const objectId of objectIds) {
      if (seen.has(objectId)) throw new LexiconError(where, `"${objectId}" appears twice`);
      seen.add(objectId);
    }
    return { id, title: this.localized(obj.title, `${where} › title`), count: objectIds.length, objectIds };
  }

  parseObjectIndex(raw: unknown): ObjectSummary[] {
    return this.array(raw, 'objects-index.json').map((value, i) => {
      const where = `objects-index.json[${i}]`;
      const obj = this.object(value, where);
      return {
        ...this.objectNames(obj, where),
        lists: this.array(obj.lists, `${where} › lists`).map((l, j) => this.string(l, `${where} › lists[${j}]`)),
        photo: obj.photo === null || obj.photo === undefined ? null : this.string(obj.photo, `${where} › photo`),
      };
    });
  }

  parseObject(raw: unknown, affixes: ReadonlyMap<string, Affix>): EverydayObject {
    const obj = this.object(raw, 'object');
    const { id, name, names } = this.objectNames(obj, 'object');
    const where = `objects/${id}.json`;
    const root = obj.root === null || obj.root === undefined ? null : this.string(obj.root, `${where} › root`);
    let image: CommonsImage | null = null;
    if (obj.image !== null && obj.image !== undefined) {
      const img = this.object(obj.image, `${where} › image`);
      const wikidata = this.string(img.wikidata, `${where} › image › wikidata`);
      if (!/^Q\d+$/.test(wikidata)) throw new LexiconError(`${where} › image`, `"${wikidata}" is not a Wikidata id like "Q183670"`);
      image = { file: this.string(img.file, `${where} › image › file`), wikidata };
    }
    const rawBreakdown = obj.breakdown === undefined ? {} : this.object(obj.breakdown, `${where} › breakdown`);
    const breakdown: Partial<Record<(typeof BREAKDOWN_LANGS)[number], NamePart[]>> = {};
    for (const [lang, value] of Object.entries(rawBreakdown)) {
      const bw = `${where} › breakdown › ${lang}`;
      if (!(BREAKDOWN_LANGS as readonly string[]).includes(lang)) throw new LexiconError(bw, `only ${BREAKDOWN_LANGS.join(', ')} names are split`);
      const parts = this.array(value, bw).map((p, i) => this.namePart(p, `${bw}[${i}]`, affixes));
      if (parts.length === 0) throw new LexiconError(bw, 'must not be empty');
      // The pieces must spell the name: "Wasser"+"kocher" = "der Wasserkocher" without its article.
      const target = lang === 'en' ? name : stripArticle(names.de);
      const squash = (t: string) => t.replace(/[\s-]/g, '').toLowerCase();
      if (squash(parts.map((p) => p.text).join('')) !== squash(target)) {
        throw new LexiconError(bw, `parts spell "${parts.map((p) => p.text).join('')}", not "${target}"`);
      }
      breakdown[lang as 'en' | 'de'] = parts;
    }
    const sentences = this.sentences(obj.sentences, where);
    if (sentences.length === 0) throw new LexiconError(`${where} › sentences`, 'must not be empty');
    return new EverydayObject(id, name, names, this.localized(obj.definition, `${where} › definition`), breakdown, this.string(obj.origin, `${where} › origin`), root, image, sentences);
  }

  private namePart(raw: unknown, where: string, affixes: ReadonlyMap<string, Affix>): NamePart {
    const obj = this.object(raw, where);
    const affixId = obj.affix === undefined ? null : this.string(obj.affix, `${where} › affix`);
    if (affixId !== null && !affixes.has(affixId)) throw new LexiconError(where, `affix "${affixId}" is not in affixes.json`);
    return {
      text: this.string(obj.text, `${where} › text`),
      gloss: this.string(obj.gloss, `${where} › gloss`),
      rootId: obj.root === undefined ? null : this.string(obj.root, `${where} › root`),
      affixId,
    };
  }

  /** Fields shared by an object file and its index entry. */
  private objectNames(obj: Json, where: string): Pick<ObjectSummary, 'id' | 'name' | 'names'> {
    const id = this.string(obj.id, `${where} › id`);
    const here = `${where} (${id})`;
    const name = this.string(obj.name, `${here} › name`);
    if (id !== name.replace(/ /g, '-')) throw new LexiconError(here, `id must be the name with dashes for spaces ("${name.replace(/ /g, '-')}")`);
    const rawNames = this.object(obj.names, `${here} › names`);
    const names = {} as Record<TranslationLang, string>;
    for (const lang of TRANSLATION_LANGUAGES) names[lang] = this.string(rawNames[lang], `${here} › names › ${lang}`);
    for (const lang of Object.keys(rawNames)) {
      if (!(TRANSLATION_LANGUAGES as readonly string[]).includes(lang)) throw new LexiconError(`${here} › names`, `unknown translation language "${lang}"`);
    }
    return { id, name, names };
  }

  /** Example sentences: English with exactly one [marked] word, plus translations. */
  private sentences(raw: unknown, here: string, source: SourceLang = 'en'): Sentence[] {
    const name = source === 'en' ? 'English' : 'German';
    return this.array(raw, `${here} › sentences`).map((s, i) => {
      const sw = `${here} › sentences[${i}]`;
      const { [source]: marked, ...rest } = this.localized(s, sw);
      if (!marked) throw new LexiconError(sw, `a ${name} sentence is required`);
      const sentence = new Sentence(marked, rest, source);
      if (sentence.highlighted.length !== 1) throw new LexiconError(sw, `mark exactly one [word] in the ${name} sentence`);
      return sentence;
    });
  }

  private parseWord(raw: unknown, where: string, forms: readonly string[], affixes: ReadonlyMap<string, Affix>, language: SourceLang = 'en'): Word {
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
    const sentences = this.sentences(obj.sentences, here, language);

    // Parts are written in lower case; a German noun's capital comes from its id (ver + stand = Verstand).
    const spelled = parts.map((p) => p.text).join('');
    const sameLetters = language === 'de' ? spelled.toLowerCase() === id.toLowerCase() : spelled === id;
    if (!sameLetters) throw new LexiconError(here, `parts spell "${spelled}", not "${id}"`);
    let at = 0;
    const respelled = parts.map((p) => p.respelled(id.slice(at, (at += p.text.length))));
    return new Word(id, this.oneOf(obj.pos, PARTS_OF_SPEECH, `${here} › pos`), parent, respelled, this.localized(obj.gloss, `${here} › gloss`), sentences);
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
