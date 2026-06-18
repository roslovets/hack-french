import type { Word, WordCase, WordMechanic } from '@/types';

import wordMechanicsJson from '../word-mechanics.json';
import boulangerieCases from './word-cases/boulangerie.json';
import wordsJson from './words.json';

/**
 * Word Lab content loader — the vocabulary-trainer analogue of `src/data/index.ts`.
 * This is the only place word JSON is cast to domain types. Kept separate from the
 * grammar loader so word-cases never enter the grammar `cases` array (different
 * invariants + progress namespace). Imported only by the lazy `/words` routes.
 */

export const words = wordsJson as Word[];

export const wordMechanics = wordMechanicsJson as WordMechanic[];

const wordCaseFiles = [boulangerieCases];

export const wordCases: WordCase[] = wordCaseFiles.flat() as unknown as WordCase[];

const wordById = new Map(words.map((w) => [w.id, w]));
const wordCaseById = new Map(wordCases.map((c) => [c.id, c]));
const wordMechanicById = new Map<string, WordMechanic>(wordMechanics.map((m) => [m.id, m]));

export const getWord = (id: string): Word | undefined => wordById.get(id);
export const getWordCase = (id: string): WordCase | undefined => wordCaseById.get(id);
export const getWordMechanic = (id: string): WordMechanic | undefined => wordMechanicById.get(id);

export const totalWords = words.length;
