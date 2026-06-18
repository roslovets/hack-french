/**
 * Word Lab scheduling — the vocabulary-trainer analogue of `lib/review.ts`.
 * Pure functions, no side effects. Phase 1 builds a simple session from all
 * word-case steps (new words first); dimension-driven due scheduling arrives in
 * a later phase. Per-word mastery aggregates the 7 dimensions.
 */
import { wordCases, words } from '@/data/words';
import type { TaskStep, WordDimension } from '@/types';

import type { ProgressState } from '@/state/progress-context';

import type { ReviewTier } from './review';
import { seededShuffle } from './shuffle';

/** Dimensions we drive scheduling on. listeningRecognition is included; words
 *  without an audio step simply have no listening entry and aren't penalised. */
export const SCHEDULED_DIMENSIONS: WordDimension[] = [
  'visualRecognition',
  'contextualUnderstanding',
  'contrastiveUnderstanding',
  'collocationKnowledge',
  'activeRecall',
  'listeningRecognition',
];

export interface WordSessionItem {
  step: TaskStep;
  wordId: string;
  dimension: WordDimension;
  caseTitle: string;
}

/** Regular (non-boss) word-cases — the daily curriculum. */
export const curriculumCases = wordCases.filter((c) => !c.isBoss);
/** Boss word-cases (M30) — capstones, launched explicitly, not in the daily session. */
export const bossCases = wordCases.filter((c) => c.isBoss);

/** Every trainable step across the curriculum (boss cases excluded). */
function allWordSteps(): WordSessionItem[] {
  const items: WordSessionItem[] = [];
  for (const c of curriculumCases) {
    for (const s of c.steps) {
      if (s.wordId && s.dimension) {
        items.push({ step: s, wordId: s.wordId, dimension: s.dimension, caseTitle: c.title });
      }
    }
  }
  return items;
}

/** Which scheduled dimensions a word actually has steps for (memoised, curriculum only). */
let _dimsByWord: Map<string, Set<WordDimension>> | null = null;
function scheduledDimsFor(wordId: string): WordDimension[] {
  if (!_dimsByWord) {
    _dimsByWord = new Map();
    for (const c of curriculumCases) {
      for (const s of c.steps) {
        if (!s.wordId || !s.dimension) continue;
        const set = _dimsByWord.get(s.wordId) ?? new Set<WordDimension>();
        set.add(s.dimension);
        _dimsByWord.set(s.wordId, set);
      }
    }
  }
  const avail = _dimsByWord.get(wordId);
  const dims = SCHEDULED_DIMENSIONS.filter((d) => avail?.has(d));
  return dims.length ? dims : SCHEDULED_DIMENSIONS;
}

/** A boss (M30) unlocks once every word it tests is at least at the "learning" tier. */
export function bossUnlocked(state: ProgressState, wordIds: string[]): boolean {
  if (wordIds.length === 0) return false;
  return wordIds.every((id) => {
    const tier = wordTier(state, id);
    return tier === 'learning' || tier === 'solid';
  });
}

/** How many of the boss's words are ready (>= learning) — for the lock progress label. */
export function bossReadyCount(state: ProgressState, wordIds: string[]): number {
  return wordIds.filter((id) => {
    const tier = wordTier(state, id);
    return tier === 'learning' || tier === 'solid';
  }).length;
}

/** Per-word aggregate mastery in [0,1], averaged over the dimensions the word trains. */
export function wordMasteryScore(state: ProgressState, wordId: string): number {
  const wm = state.wordMastery[wordId];
  if (!wm) return 0;
  const CAP = 4; // strength at which a dimension counts as fully solid
  const dims = scheduledDimsFor(wordId);
  let sum = 0;
  for (const dim of dims) {
    sum += Math.min(1, (wm.dims[dim]?.strength ?? 0) / CAP);
  }
  return sum / dims.length;
}

/** Per-word tier, reusing review.ts tier semantics. */
export function wordTier(state: ProgressState, wordId: string): ReviewTier {
  const wm = state.wordMastery[wordId];
  if (!wm || Object.keys(wm.dims).length === 0) return 'locked';
  const score = wordMasteryScore(state, wordId);
  if (score >= 0.75) return 'solid';
  if (score >= 0.34) return 'learning';
  return 'fresh';
}

export interface WordDimDue {
  wordId: string;
  dimension: WordDimension;
  due: number;
}

/** (word, dimension) pairs whose scheduled review time has arrived, oldest first. */
export function dueWordDimensions(state: ProgressState, now: number): WordDimDue[] {
  const out: WordDimDue[] = [];
  for (const [wordId, wm] of Object.entries(state.wordMastery)) {
    for (const dim of SCHEDULED_DIMENSIONS) {
      const d = wm.dims[dim];
      if (d && d.due <= now) out.push({ wordId, dimension: dim, due: d.due });
    }
  }
  return out.sort((a, b) => a.due - b.due);
}

/** The weakest scheduled dimension for a word (the next thing worth training). */
export function weakestDimension(state: ProgressState, wordId: string): WordDimension {
  const wm = state.wordMastery[wordId];
  let best: WordDimension = SCHEDULED_DIMENSIONS[0] ?? 'visualRecognition';
  let bestStrength = Infinity;
  for (const dim of SCHEDULED_DIMENSIONS) {
    const s = wm?.dims[dim]?.strength ?? 0;
    if (s < bestStrength) {
      bestStrength = s;
      best = dim;
    }
  }
  return best;
}

/** Avoid two adjacent items sharing the same mechanic (best-effort, single pass). */
function spreadMechanics(items: WordSessionItem[]): WordSessionItem[] {
  const out = [...items];
  for (let i = 1; i < out.length; i += 1) {
    const prev = out[i - 1]?.step.mechanic;
    const cur = out[i];
    if (prev && cur && cur.step.mechanic === prev) {
      const j = out.findIndex((it, k) => k > i && it.step.mechanic !== prev);
      const swap = j > i ? out[j] : undefined;
      if (swap) {
        out[i] = swap;
        out[j] = cur;
      }
    }
  }
  return out;
}

/**
 * Build a daily session: new words first (lowest frequency rank, one intro step
 * each), then due reviews (most-overdue dimension first), topped up with any
 * remaining steps, then spread so the same mechanic doesn't repeat back-to-back.
 */
export function buildWordSession(
  state: ProgressState,
  seed: string,
  opts: { limit?: number; maxNew?: number; wordIds?: string[]; now?: number } = {},
): WordSessionItem[] {
  // Optional themed drill: restrict the whole session to one theme's words.
  const only = opts.wordIds && opts.wordIds.length ? new Set(opts.wordIds) : null;
  const limit = opts.limit ?? 12;
  const maxNew = opts.maxNew ?? 5;
  // Only dimensions whose review time has actually arrived count as "due"; without
  // a clock (now omitted) everything is treated as due, preserving old behaviour.
  const now = opts.now ?? Infinity;
  const all = allWordSteps().filter((it) => !only || only.has(it.wordId));
  const byWord = new Map<string, WordSessionItem[]>();
  for (const it of all) {
    const list = byWord.get(it.wordId);
    if (list) list.push(it);
    else byWord.set(it.wordId, [it]);
  }

  const strengthOf = (wid: string, dim: WordDimension) =>
    state.wordMastery[wid]?.dims[dim]?.strength ?? 0;

  const result: WordSessionItem[] = [];
  const used = new Set<WordSessionItem>();
  const usedDims = new Map<string, Set<WordDimension>>();
  const push = (it: WordSessionItem | undefined) => {
    if (!it || used.has(it)) return;
    used.add(it);
    const set = usedDims.get(it.wordId) ?? new Set<WordDimension>();
    set.add(it.dimension);
    usedDims.set(it.wordId, set);
    result.push(it);
  };

  // Pick a word's next step: weakest dimension first, skipping dimensions already
  // shown this session — so a repeat drills a *different* facet, not the same card.
  const pickForWord = (wid: string, salt: string): WordSessionItem | undefined => {
    const steps = (byWord.get(wid) ?? []).filter((it) => !used.has(it));
    if (!steps.length) return undefined;
    const seen = usedDims.get(wid);
    const fresh = seen ? steps.filter((it) => !seen.has(it.dimension)) : steps;
    const pool = fresh.length ? fresh : steps;
    const minStrength = Math.min(...pool.map((it) => strengthOf(wid, it.dimension)));
    const weakest = pool.filter((it) => strengthOf(wid, it.dimension) === minStrength);
    return seededShuffle(weakest, `${seed}-${wid}-${salt}`)[0];
  };

  // 1) New words: have steps but no mastery yet, lowest frequencyRank first.
  const newWordIds = words
    .filter((w) => byWord.has(w.id) && !state.wordMastery[w.id])
    .sort((a, b) => a.frequencyRank - b.frequencyRank)
    .slice(0, maxNew)
    .map((w) => w.id);
  for (const wid of newWordIds) push(pickForWord(wid, 'new'));

  // 2) Due reviews: introduced words, most-overdue dimension first.
  const dueList: WordDimDue[] = [];
  for (const [wid, wm] of Object.entries(state.wordMastery)) {
    if (only && !only.has(wid)) continue;
    for (const dim of SCHEDULED_DIMENSIONS) {
      const d = wm.dims[dim];
      if (d && d.due <= now) dueList.push({ wordId: wid, dimension: dim, due: d.due });
    }
  }
  dueList.sort((a, b) => a.due - b.due);
  for (const due of dueList) {
    if (result.length >= limit) break;
    const items = (byWord.get(due.wordId) ?? []).filter(
      (it) => it.dimension === due.dimension && !used.has(it),
    );
    push(seededShuffle(items, `${seed}-${due.wordId}-${due.dimension}`)[0]);
  }

  // 3) Top up by rotating through words, each pass taking the weakest dimension
  //    not yet shown — keeps a short (or repeated) session varied, not one card twice.
  const rotation = [
    ...newWordIds,
    ...seededShuffle(
      [...byWord.keys()].filter((w) => !newWordIds.includes(w)),
      seed,
    ),
  ];
  for (let pass = 0; result.length < limit; pass += 1) {
    let added = false;
    for (const wid of rotation) {
      if (result.length >= limit) break;
      const it = pickForWord(wid, `top${pass}`);
      if (it) {
        push(it);
        added = true;
      }
    }
    if (!added) break;
  }

  return spreadMechanics(result).slice(0, limit);
}
