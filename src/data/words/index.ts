import type { Word, WordCase, WordMechanic } from '@/types';

import wordMechanicsJson from '../word-mechanics.json';
import bossCases from './word-cases/boss.json';
import boulangerieCases from './word-cases/boulangerie.json';
import cafeCases from './word-cases/cafe.json';
import ecoleCases from './word-cases/ecole.json';
import maisonCases from './word-cases/maison.json';
import perceptionCases from './word-cases/perception.json';
import politesseCases from './word-cases/politesse.json';
import prendreCases from './word-cases/prendre.json';
import savoirCases from './word-cases/savoir.json';
import tempsCases from './word-cases/temps.json';
import villeCases from './word-cases/ville.json';
import wordsJson from './words.json';

/**
 * Word Lab content loader — the vocabulary-trainer analogue of `src/data/index.ts`.
 * This is the only place word JSON is cast to domain types. Kept separate from the
 * grammar loader so word-cases never enter the grammar `cases` array (different
 * invariants + progress namespace). Imported only by the lazy `/words` routes.
 */

export const words = wordsJson as Word[];

export const wordMechanics = wordMechanicsJson as WordMechanic[];

const wordCaseFiles = [
  boulangerieCases,
  cafeCases,
  ecoleCases,
  maisonCases,
  perceptionCases,
  politesseCases,
  prendreCases,
  savoirCases,
  tempsCases,
  villeCases,
  bossCases,
];

export const wordCases: WordCase[] = wordCaseFiles.flat() as unknown as WordCase[];

const wordById = new Map(words.map((w) => [w.id, w]));
const wordCaseById = new Map(wordCases.map((c) => [c.id, c]));
const wordMechanicById = new Map<string, WordMechanic>(wordMechanics.map((m) => [m.id, m]));

export const getWord = (id: string): Word | undefined => wordById.get(id);
export const getWordCase = (id: string): WordCase | undefined => wordCaseById.get(id);
export const getWordMechanic = (id: string): WordMechanic | undefined => wordMechanicById.get(id);

export const totalWords = words.length;
