import type {
  AudioSet,
  MechanicId,
  TaskKind,
  TaskStep,
  Word,
  WordCase,
  WordCategory,
  WordDimension,
  WordLevel,
  WordMechanic,
} from '@/types';

import wordCategoriesJson from '../word-categories.json';
import wordMechanicsJson from '../word-mechanics.json';
import indexJson from './wordlab-index.json';

/**
 * Word Lab content loader.
 *
 * The full dossiers (lexicon/<theme>.json) and full task steps (word-cases/<file>)
 * are HEAVY, so they are NOT bundled eagerly. Instead a small generated index
 * (wordlab-index.json — lemmas + per-case step descriptors) loads eagerly to drive
 * the overview and the scheduler, and the full content is fetched lazily per file
 * on first use (opening a dossier, playing a session/boss). Run `bun run words:index`
 * to regenerate the index after editing content; `words:check` flags a stale index.
 */

/** Eager, lightweight word — enough for chips, the session strip and scheduling. */
export interface WordLite {
  id: string;
  lemma: string;
  displayForm?: string;
  level: WordLevel;
  frequencyRank: number;
  audio?: AudioSet;
  file: string; // lexicon filename holding the full dossier
}

/** A step stripped to what scheduling needs; full content is lazy. */
export interface StepMeta {
  id: string;
  kind: TaskKind;
  wordId?: string;
  dimension?: WordDimension;
  mechanic?: MechanicId;
}

/** A case stripped to metadata + step descriptors. */
export interface WordCaseMeta {
  id: string;
  title: string;
  theme: string;
  level: WordLevel;
  isBoss?: boolean;
  wordIds: string[];
  file: string; // word-cases filename holding the full steps
  steps: StepMeta[];
}

interface WordlabIndex {
  words: WordLite[];
  cases: WordCaseMeta[];
}

const index = indexJson as WordlabIndex;

export const words: WordLite[] = index.words;
export const wordCases: WordCaseMeta[] = index.cases;
export const wordMechanics = wordMechanicsJson as WordMechanic[];
export const wordCategories = wordCategoriesJson as WordCategory[];

const wordById = new Map(words.map((w) => [w.id, w]));
const wordCaseById = new Map(wordCases.map((c) => [c.id, c]));
const wordMechanicById = new Map<string, WordMechanic>(wordMechanics.map((m) => [m.id, m]));

export const getWord = (id: string): WordLite | undefined => wordById.get(id);
export const getWordCase = (id: string): WordCaseMeta | undefined => wordCaseById.get(id);
export const getWordMechanic = (id: string): WordMechanic | undefined => wordMechanicById.get(id);

export const totalWords = words.length;

// ── Lazy full content ───────────────────────────────────────────────────────
const lexiconLoaders = import.meta.glob<{ default: Word[] }>('./lexicon/*.json');
const caseLoaders = import.meta.glob<{ default: WordCase[] }>('./word-cases/*.json');

const fullWordCache = new Map<string, Word>();
const fullStepCache = new Map<string, TaskStep>();
const loadedCaseFiles = new Set<string>();

/** Load (and cache) the full dossier for one word. */
export async function loadWordFull(id: string): Promise<Word | undefined> {
  if (fullWordCache.has(id)) return fullWordCache.get(id);
  const lite = wordById.get(id);
  if (!lite) return undefined;
  const loader = lexiconLoaders[`./lexicon/${lite.file}`];
  if (!loader) return undefined;
  const mod = await loader();
  for (const w of mod.default) fullWordCache.set(w.id, w);
  return fullWordCache.get(id);
}

async function ingestCaseFile(file: string) {
  if (loadedCaseFiles.has(file)) return;
  const loader = caseLoaders[`./word-cases/${file}`];
  if (!loader) return;
  const mod = await loader();
  for (const c of mod.default) for (const s of c.steps) fullStepCache.set(s.id, s);
  loadedCaseFiles.add(file);
}

/** Load the full steps for a single case, in case order. */
export async function loadCaseSteps(caseId: string): Promise<TaskStep[]> {
  const meta = wordCaseById.get(caseId);
  if (!meta) return [];
  await ingestCaseFile(meta.file);
  return meta.steps.map((d) => fullStepCache.get(d.id)).filter((s): s is TaskStep => Boolean(s));
}

/** Ensure the given case files are loaded, then resolve a step id to its full step. */
export async function loadSteps(
  files: Iterable<string>,
): Promise<(id: string) => TaskStep | undefined> {
  await Promise.all([...new Set(files)].map(ingestCaseFile));
  return (id: string) => fullStepCache.get(id);
}
