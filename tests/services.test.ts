import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../src/domain/Language';
import { I18n } from '../src/i18n/I18n';
import { MESSAGES } from '../src/i18n/messages';
import { MemoryStore } from '../src/services/KeyValueStore';
import { groupByPlace } from '../src/domain/EverydayObject';
import { SearchIndex } from '../src/services/SearchIndex';
import { SettingsStore } from '../src/services/SettingsStore';
import { affixHref, objectHref, parseRoute, rootHref } from '../src/ui/routes';
import { diskRepository } from './helpers';

describe('SearchIndex', async () => {
  const repo = diskRepository();
  const index = new SearchIndex(await repo.listRoots(), (await repo.getAffixes()).values());

  it('finds a word and points to its root', () => {
    expect(index.search('inspection')[0]).toEqual({ label: 'inspection', rootId: 'spec', wordId: 'inspection', affix: null });
  });
  it('finds affixes by their written form, homographs side by side', () => {
    expect(index.search('-ion')[0]?.affix?.id).toBe('-ion');
    expect(index.search('in-').slice(0, 2).map((h) => h.affix?.id).sort()).toEqual(['in-', 'in-not-']);
    expect(index.search('inspect')[0]?.wordId).toBe('inspect');
  });
  it('ranks prefix matches before inner matches', () => {
    const labels = index.search('port').map((h) => h.label);
    expect(labels[0]).toBe('port');
    expect(labels.indexOf('portable')).toBeLessThan(labels.indexOf('export'));
  });
  it('ignores case and accents', () => {
    expect(index.search('ÍNSPECT')[0]?.wordId).toBe('inspect');
  });
  it('returns nothing for an empty query', () => {
    expect(index.search('   ')).toEqual([]);
  });
});

describe('SearchIndex with objects', async () => {
  const repo = diskRepository();
  const index = new SearchIndex(await repo.listRoots(), (await repo.getAffixes()).values(), await repo.listObjects());

  it('finds an object by its English name', () => {
    expect(index.search('chalk')[0]).toMatchObject({ label: 'chalk', objectId: 'chalk' });
  });
  it('finds an object by a translation, without its article, and says what matched', () => {
    expect(index.search('tebeşir')[0]).toMatchObject({ objectId: 'chalk', matched: 'tebeşir' });
    expect(index.search('kreide')[0]).toMatchObject({ objectId: 'chalk', matched: 'die Kreide' });
    expect(index.search('eponge')[0]).toMatchObject({ objectId: 'sponge', matched: "l'éponge" });
    expect(index.search('kevgir')[0]?.objectId).toBe('colander');
  });
  it('lists an object once even when several of its names match', () => {
    const hits = index.search('sp').filter((h) => h.objectId === 'spatula');
    expect(hits.length).toBe(1);
  });
  it('strips articles in all five languages', () => {
    expect(['der Kamm', 'la tiza', "l'agrafeuse", 'lo specchio', 'les ciseaux', 'el grifo'].map(SearchIndex.stripArticle)).toEqual([
      'Kamm',
      'tiza',
      'agrafeuse',
      'specchio',
      'ciseaux',
      'grifo',
    ]);
  });
});

describe('groupByPlace', async () => {
  const repo = diskRepository();
  const [objects, places] = [await repo.listObjects(), await repo.getPlaces()];

  it('puts every object under its place, A–Z inside, places sorted in the given language', () => {
    const groups = groupByPlace(objects, places, 'tr');
    expect(groups.map((g) => g.place.id)).toEqual(['bathroom', 'kitchen', 'classroom']); // banyo, mutfak, sınıf
    expect(groups.reduce((n, g) => n + g.objects.length, 0)).toBe(objects.length);
    const kitchen = groups.find((g) => g.place.id === 'kitchen')!.objects.map((o) => o.name);
    expect(kitchen).toContain('colander');
    expect(kitchen).toEqual([...kitchen].sort((a, b) => a.localeCompare(b)));
  });
  it('leaves out places without objects', () => {
    const extra = new Map([...places, ['garden', { id: 'garden', name: { en: 'garden' } }]]);
    expect(groupByPlace(objects, extra, 'en').some((g) => g.place.id === 'garden')).toBe(false);
  });
});

describe('SettingsStore', () => {
  it('guesses the interface language from the browser', () => {
    const s = new SettingsStore(new MemoryStore(), ['de-AT', 'en']).value;
    expect(s.uiLang).toBe('de');
    expect(s.translationLangs).toEqual(['de']);
    expect(s.onboarded).toBe(false);
    expect(s.browseMode).toBe('root');
    expect(s.objectGrouping).toBe('place');
  });
  it('falls back to English and Turkish translations for unknown browsers', () => {
    const s = new SettingsStore(new MemoryStore(), ['ja']).value;
    expect(s.uiLang).toBe('en');
    expect(s.translationLangs).toEqual(['tr']);
  });
  it('persists updates and notifies subscribers', () => {
    const memory = new MemoryStore();
    const store = new SettingsStore(memory);
    const seen: string[] = [];
    store.subscribe((now, before) => seen.push(`${before.theme}->${now.theme}`));
    store.update({ theme: 'dark', translationLangs: ['fr', 'es'], onboarded: true });
    expect(seen).toEqual(['system->dark']);
    const reloaded = new SettingsStore(memory).value;
    expect(reloaded.theme).toBe('dark');
    expect(reloaded.translationLangs).toEqual(['fr', 'es']);
    expect(reloaded.onboarded).toBe(true);
  });
  it('drops invalid saved values instead of crashing', () => {
    const memory = new MemoryStore();
    memory.set('specroots.settings.v1', JSON.stringify({ uiLang: 'xx', translationLangs: ['tr', 'en', 'zz'], theme: 'neon' }));
    const s = new SettingsStore(memory, ['it']).value;
    expect(s.uiLang).toBe('it');
    expect(s.translationLangs).toEqual(['tr']);
    expect(s.theme).toBe('system');
    expect(s.browseMode).toBe('root');
    memory.set('specroots.settings.v1', JSON.stringify({ browseMode: 'suffix' }));
    expect(new SettingsStore(memory).value.browseMode).toBe('suffix');
    memory.set('specroots.settings.v1', '{broken');
    expect(new SettingsStore(memory).value.theme).toBe('system');
  });
});

describe('routes', () => {
  it('round-trips root, word and affix links', () => {
    expect(parseRoute(rootHref('spec', 'inspection'))).toEqual({ kind: 'root', rootId: 'spec', wordId: 'inspection' });
    expect(parseRoute(affixHref('in-not-'))).toEqual({ kind: 'affix', affixId: 'in-not-' });
    expect(parseRoute(affixHref('-ion'))).toEqual({ kind: 'affix', affixId: '-ion' });
    expect(parseRoute('#/affix/')).toEqual({ kind: 'home' });
    expect(parseRoute(objectHref('paper-clip'))).toEqual({ kind: 'object', objectId: 'paper-clip' });
  });
});

describe('I18n', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it('every language uses the same placeholders as English', () => {
    for (const lang of LANGUAGES) {
      for (const [key, text] of Object.entries(MESSAGES[lang])) {
        expect(placeholders(text), `${lang}.${key}`).toEqual(placeholders(MESSAGES.en[key as keyof typeof MESSAGES.en]));
      }
    }
  });
  it('fills placeholders', () => {
    const i18n = new I18n('tr');
    expect(i18n.t('wordCount', { count: 7 })).toBe('7 kelime');
    i18n.setLanguage('fr');
    expect(i18n.t('derivedFrom', { word: 'inspect' })).toBe('de inspect');
  });
});
