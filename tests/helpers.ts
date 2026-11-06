import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JsonLexiconRepository } from '../src/data/JsonLexiconRepository';

export const DATA_DIR = join(import.meta.dirname, '..', 'public', 'data');

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(join(DATA_DIR, path), 'utf8'));
}

export function rootFiles(): string[] {
  return readdirSync(join(DATA_DIR, 'roots')).filter((f) => f.endsWith('.json'));
}

/** The real repository, reading the real files from disk instead of over HTTP. */
export function diskRepository(): JsonLexiconRepository {
  return new JsonLexiconRepository(async (path) => readJson(path.replace(/^data\//, '')));
}
