import type { Case, Category, Mechanism, Scene } from '@/types';

import categoriesJson from './categories.json';
import enginesCases from './cases/engines.json';
import sentenceCases from './cases/sentence.json';
import articlesCases from './cases/articles.json';
import adjectivesCases from './cases/adjectives.json';
import possessivesCases from './cases/possessives.json';
import pronounsCases from './cases/pronouns.json';
import negationCases from './cases/negation.json';
import movementCases from './cases/movement.json';
import reflexivesCases from './cases/reflexives.json';
import modalsCases from './cases/modals.json';
import timeCases from './cases/time.json';
import numbersCases from './cases/numbers.json';
import spokenCases from './cases/spoken.json';
import pronunciationCases from './cases/pronunciation.json';
import socialCases from './cases/social.json';
import connectorsCases from './cases/connectors.json';
import trapsCases from './cases/traps.json';
import dialoguesCases from './cases/dialogues.json';
import bossCases from './cases/boss.json';
import mechanismsJson from './mechanisms.json';
import scenesJson from './scenes.json';

/**
 * All app data is stored as JSON. Here it is cast once to the domain-model
 * types — this is the only place where type casting happens.
 */

export const categories = (categoriesJson as Category[]).slice().sort((a, b) => a.order - b.order);

export const mechanisms = mechanismsJson as Mechanism[];

export const scenes = scenesJson as Scene[];

const caseFiles = [
  enginesCases,
  sentenceCases,
  articlesCases,
  adjectivesCases,
  possessivesCases,
  pronounsCases,
  negationCases,
  movementCases,
  reflexivesCases,
  modalsCases,
  timeCases,
  numbersCases,
  spokenCases,
  pronunciationCases,
  socialCases,
  connectorsCases,
  trapsCases,
  dialoguesCases,
  bossCases,
];

export const cases: Case[] = caseFiles.flat() as unknown as Case[];

const caseById = new Map(cases.map((c) => [c.id, c]));
const mechanismById = new Map(mechanisms.map((m) => [m.id, m]));
const categoryById = new Map(categories.map((c) => [c.id, c]));
const sceneById = new Map(scenes.map((s) => [s.id, s]));

export const getCase = (id: string): Case | undefined => caseById.get(id);
export const getMechanism = (id: string): Mechanism | undefined => mechanismById.get(id);
export const getCategory = (id: string): Category | undefined => categoryById.get(id);
export const getScene = (id: string): Scene | undefined => sceneById.get(id);

export const casesByCategory = (categoryId: string): Case[] =>
  cases.filter((c) => c.category === categoryId);

export const totalCases = cases.length;
export const totalSteps = cases.reduce((sum, c) => sum + c.steps.length, 0);
