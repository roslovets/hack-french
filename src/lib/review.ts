/**
 * Spaced-repetition logic ("Летучка"): what has "cooled down" and is due for
 * review, how to assemble a session (case steps + "recall the insight") and how
 * to compute the mechanism strength map. Pure functions — no side effects.
 */
import { cases, getCase, getMechanism } from '@/data';
import type { Case, ChoiceStep, TaskKind, TaskStep } from '@/types';

import type { ProgressState } from '@/state/progress-context';

import { seededShuffle } from './shuffle';

/** Step kinds suitable for cold re-checking (one correct option out of several). */
const REVIEW_STEP_KINDS = new Set<TaskKind>([
  'strangeness',
  'hypothesis',
  'expand',
  'fixCalque',
  'scene',
  'mutation',
  'oddOneOut',
  'explainError',
  'cloze',
  'collapse',
  'compare',
  'trap',
  'simpler',
]);

/** Steps whose options are French phrases (monospace font). */
const FRENCH_OPTION_KINDS = new Set<TaskKind>([
  'collapse',
  'cloze',
  'fixCalque',
  'scene',
  'mutation',
  'oddOneOut',
  'expand',
  'trap',
  'simpler',
]);

export type ReviewTier = 'locked' | 'fresh' | 'learning' | 'solid';

export interface ReviewOption {
  text: string;
  correct: boolean;
}

export interface ReviewItemData {
  caseId: string;
  caseTitle: string;
  kind: 'step' | 'insight';
  stepKind?: TaskKind;
  prompt: string;
  phrase?: string;
  clues?: string[];
  situation?: string;
  phrases?: string[];
  options: ReviewOption[];
  explanation: string;
  frenchOptions: boolean;
  mechanismName: string;
}

function isReviewableStep(s: TaskStep): s is ChoiceStep {
  return (
    REVIEW_STEP_KINDS.has(s.kind) &&
    'options' in s &&
    Array.isArray(s.options) &&
    typeof (s as ChoiceStep).correctIndex === 'number'
  );
}

/** A case has "cooled down" (due for review) if it's solved and its time has come. */
export function dueCaseIds(state: ProgressState, now: number): string[] {
  return state.completedCases
    .filter((id) => {
      const e = state.review[id];
      return !e || e.due <= now;
    })
    .sort((a, b) => (state.review[a]?.due ?? 0) - (state.review[b]?.due ?? 0));
}

/** The weakest solved cases (lowest strength) — for "review the weak ones". */
export function weakestCaseIds(state: ProgressState, limit: number): string[] {
  return state.completedCases
    .slice()
    .sort((a, b) => (state.review[a]?.strength ?? 0) - (state.review[b]?.strength ?? 0))
    .slice(0, limit);
}

function buildStepItem(caseItem: Case, step: ChoiceStep, seed: string): ReviewItemData {
  const options = seededShuffle(
    step.options.map((text, i) => ({ text, correct: i === step.correctIndex })),
    `${step.id}-${seed}`,
  );
  return {
    caseId: caseItem.id,
    caseTitle: caseItem.title,
    kind: 'step',
    stepKind: step.kind,
    prompt: step.prompt,
    phrase: step.phrase,
    clues: step.clues,
    situation: step.situation,
    phrases: step.phrases,
    options,
    explanation: step.explanation,
    frenchOptions: FRENCH_OPTION_KINDS.has(step.kind),
    mechanismName: getMechanism(caseItem.mechanism)?.name ?? caseItem.mechanism,
  };
}

function buildInsightItem(caseItem: Case, seed: string): ReviewItemData {
  const mechName = getMechanism(caseItem.mechanism)?.name ?? caseItem.mechanism;
  const pool = cases.filter(
    (c) => c.insight !== caseItem.insight && c.mechanism !== caseItem.mechanism,
  );
  const seen = new Set<string>();
  const distractors = seededShuffle(pool, `${caseItem.id}-ins-${seed}`)
    .filter((c) => (seen.has(c.insight) ? false : (seen.add(c.insight), true)))
    .slice(0, 3)
    .map((c) => ({ text: c.insight, correct: false }));
  const options = seededShuffle(
    [{ text: caseItem.insight, correct: true }, ...distractors],
    `${caseItem.id}-insopt-${seed}`,
  );
  return {
    caseId: caseItem.id,
    caseTitle: caseItem.title,
    kind: 'insight',
    prompt: `Какое озарение у механизма «${mechName}»?`,
    situation: caseItem.strangeness,
    options,
    explanation: 'Это ключевое правило механизма — оно остаётся в голове после дела.',
    frenchOptions: false,
    mechanismName: mechName,
  };
}

/** Assemble a review session: one item per case (every 3rd one is an insight). */
export function buildSession(caseIds: string[], seed: string, limit = 10): ReviewItemData[] {
  const items: ReviewItemData[] = [];
  caseIds.slice(0, limit).forEach((id, i) => {
    const caseItem = getCase(id);
    if (!caseItem) return;
    const steps = caseItem.steps.filter(isReviewableStep);
    const useInsight = i % 3 === 2 || steps.length === 0;
    if (useInsight) {
      items.push(buildInsightItem(caseItem, seed));
    } else {
      const step = seededShuffle(steps, `${id}-pick-${seed}`)[0];
      if (step) items.push(buildStepItem(caseItem, step, seed));
      else items.push(buildInsightItem(caseItem, seed));
    }
  });
  return items;
}

export interface MechanismMastery {
  id: string;
  token: string;
  name: string;
  total: number;
  solved: number;
  avgStrength: number;
  tier: ReviewTier;
}

function tierOf(solved: number, avgStrength: number): ReviewTier {
  if (solved === 0) return 'locked';
  if (avgStrength >= 3) return 'solid';
  if (avgStrength >= 1) return 'learning';
  return 'fresh';
}

/** Mechanism strength map: how confidently each one holds up. */
export function mechanismMap(state: ProgressState): MechanismMastery[] {
  const byMech = new Map<string, { total: number; solvedStrengths: number[] }>();
  for (const c of cases) {
    const agg = byMech.get(c.mechanism) ?? { total: 0, solvedStrengths: [] };
    agg.total += 1;
    if (state.completedCases.includes(c.id)) {
      agg.solvedStrengths.push(state.review[c.id]?.strength ?? 0);
    }
    byMech.set(c.mechanism, agg);
  }
  const result: MechanismMastery[] = [];
  for (const [id, agg] of byMech) {
    const mech = getMechanism(id);
    const solved = agg.solvedStrengths.length;
    const avgStrength = solved ? agg.solvedStrengths.reduce((a, b) => a + b, 0) / solved : 0;
    result.push({
      id,
      token: mech?.token ?? id,
      name: mech?.name ?? id,
      total: agg.total,
      solved,
      avgStrength,
      tier: tierOf(solved, avgStrength),
    });
  }
  return result;
}
