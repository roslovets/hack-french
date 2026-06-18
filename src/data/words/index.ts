import type { Word, WordCase, WordMechanic } from '@/types';

import wordMechanicsJson from '../word-mechanics.json';

/**
 * Word Lab content loader — the vocabulary-trainer analogue of `src/data/index.ts`.
 * Lexicon entries (lexicon/<theme>.json) and word-cases (word-cases/<theme>.json)
 * are split one file per theme and loaded via Vite's glob, so adding a theme is just
 * a new file — no edits here. This is the only place word JSON becomes domain types.
 * Imported only by the lazy `/words` routes, so it stays out of the main bundle.
 */

const lexiconModules = import.meta.glob<Word[]>('./lexicon/*.json', {
  eager: true,
  import: 'default',
});
const caseModules = import.meta.glob<WordCase[]>('./word-cases/*.json', {
  eager: true,
  import: 'default',
});

/** Flatten glob results in a deterministic (path-sorted) order. */
const collect = <T>(mods: Record<string, T[]>): T[] =>
  Object.keys(mods)
    .sort()
    .flatMap((k) => mods[k] ?? []);

export const words: Word[] = collect(lexiconModules);
export const wordMechanics = wordMechanicsJson as WordMechanic[];
export const wordCases: WordCase[] = collect(caseModules);

const wordById = new Map(words.map((w) => [w.id, w]));
const wordCaseById = new Map(wordCases.map((c) => [c.id, c]));
const wordMechanicById = new Map<string, WordMechanic>(wordMechanics.map((m) => [m.id, m]));

export const getWord = (id: string): Word | undefined => wordById.get(id);
export const getWordCase = (id: string): WordCase | undefined => wordCaseById.get(id);
export const getWordMechanic = (id: string): WordMechanic | undefined => wordMechanicById.get(id);

export const totalWords = words.length;
