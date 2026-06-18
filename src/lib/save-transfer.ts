/**
 * Save transfer via a `.json` file (no backend). On export we drop everything
 * derivable from `caseId` (insight texts, steps of completed cases); on import
 * we rehydrate from the bundled data and validate: unknown ids are ignored, so
 * files survive the addition of new cases. See README → «Перенос сейва».
 */
import { cases, getCase } from '@/data';
import { wordCases, words } from '@/data/words';

import {
  initialProgress,
  PROGRESS_VERSION,
  type ProgressState,
  type ReviewEntry,
  type WordMastery,
} from '@/state/progress-context';

import type { WordDimension } from '@/types';

const WORD_DIMENSIONS: WordDimension[] = [
  'visualRecognition',
  'contextualUnderstanding',
  'listeningRecognition',
  'contrastiveUnderstanding',
  'collocationKnowledge',
  'activeRecall',
  'personalUsage',
];

const FORMAT = 'hack-french-save';
const FORMAT_VERSION = 1;

interface SaveData {
  xp: number;
  reviewStreak: number;
  reviewBest: number;
  completedCases: string[];
  caseSteps: Record<string, string[]>;
  /** caseId -> when the insight was collected; text/mechanism rehydrated from data. */
  insightsAt: Record<string, number>;
  caughtMissions: string[];
  /** stepId -> real-world catch log (timestamp + optional note). */
  missionLog: Record<string, { at: number; note?: string }>;
  ownPhrases: Record<string, string[]>;
  review: Record<string, ReviewEntry>;
  /** Word Lab: per-word mastery + personal data. */
  wordMastery: Record<string, WordMastery>;
  /** Word Lab: stepId -> hint level used (M29 analytics). */
  wordHintLog: Record<string, number>;
}

export interface SaveFile {
  format: typeof FORMAT;
  formatVersion: number;
  progressVersion: number;
  exportedAt: number;
  app: string;
  data: SaveData;
}

/** Save-file parse error — its message is shown to the user. */
export class SaveParseError extends Error {}

export interface ImportResult {
  state: ProgressState;
  /** What was successfully transferred (for confirmation and the final message). */
  summary: { cases: number; insights: number; dropped: number };
}

export function exportSave(state: ProgressState, appVersion = '0.1.0'): string {
  const insightsAt: Record<string, number> = {};
  for (const ins of state.insights) insightsAt[ins.caseId] = ins.at;
  const file: SaveFile = {
    format: FORMAT,
    formatVersion: FORMAT_VERSION,
    progressVersion: state.version,
    exportedAt: Date.now(),
    app: appVersion,
    data: {
      xp: state.xp,
      reviewStreak: state.reviewStreak,
      reviewBest: state.reviewBest,
      completedCases: state.completedCases,
      caseSteps: state.caseSteps,
      insightsAt,
      caughtMissions: state.caughtMissions,
      missionLog: state.missionLog,
      ownPhrases: state.ownPhrases,
      review: state.review,
      wordMastery: state.wordMastery,
      wordHintLog: state.wordHintLog,
    },
  };
  return JSON.stringify(file, null, 2);
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export function importSave(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveParseError('Файл не читается как JSON.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new SaveParseError('Файл пустой или повреждён.');
  }
  const file = parsed as Partial<SaveFile>;
  if (file.format !== FORMAT) {
    throw new SaveParseError('Это не похоже на файл сейва Hack French.');
  }
  const data = file.data;
  if (!data || typeof data !== 'object') {
    throw new SaveParseError('В файле нет данных прогресса.');
  }

  // Maps of valid ids from the current data — everything else is silently dropped.
  const stepIdsByCase = new Map<string, Set<string>>();
  const allStepIds = new Set<string>();
  for (const c of cases) {
    const set = new Set(c.steps.map((s) => s.id));
    stepIdsByCase.set(c.id, set);
    for (const id of set) allStepIds.add(id);
  }

  const rawCompleted = Array.isArray(data.completedCases) ? data.completedCases : [];
  const completedCases: string[] = [];
  let dropped = 0;
  for (const id of rawCompleted) {
    if (typeof id === 'string' && getCase(id)) completedCases.push(id);
    else dropped++;
  }

  // Insights are rehydrated from completed cases; we take only the time from the file.
  const insightsAt = asRecord(data.insightsAt);
  const insights = completedCases.flatMap((id) => {
    const c = getCase(id);
    if (!c) return [];
    return [
      {
        caseId: id,
        mechanism: c.mechanism,
        text: c.insight,
        at: num(insightsAt[id], file.exportedAt ?? 0),
      },
    ];
  });

  // Steps: keep the existing ones; for completed cases mark all steps.
  const caseSteps: Record<string, string[]> = {};
  for (const [caseId, ids] of Object.entries(asRecord(data.caseSteps))) {
    const valid = stepIdsByCase.get(caseId);
    if (!valid || !Array.isArray(ids)) continue;
    const filtered = ids.filter((s): s is string => typeof s === 'string' && valid.has(s));
    if (filtered.length) caseSteps[caseId] = filtered;
  }
  for (const id of completedCases) {
    const valid = stepIdsByCase.get(id);
    if (valid) caseSteps[id] = [...valid];
  }

  const review: Record<string, ReviewEntry> = {};
  for (const [caseId, raw] of Object.entries(asRecord(data.review))) {
    if (!getCase(caseId)) continue;
    const r = asRecord(raw);
    review[caseId] = {
      due: num(r.due, 0),
      intervalIdx: clampInt(num(r.intervalIdx, 0), 0, 10),
      strength: Math.max(0, num(r.strength, 0)),
      reviewed: num(r.reviewed, 0),
    };
  }

  const ownPhrases: Record<string, string[]> = {};
  for (const [stepId, phrases] of Object.entries(asRecord(data.ownPhrases))) {
    if (!allStepIds.has(stepId) || !Array.isArray(phrases)) continue;
    const arr = phrases.filter((p): p is string => typeof p === 'string');
    if (arr.length) ownPhrases[stepId] = arr;
  }

  const rawMissions = Array.isArray(data.caughtMissions) ? data.caughtMissions : [];
  const caughtMissions = rawMissions.filter(
    (id): id is string => typeof id === 'string' && allStepIds.has(id),
  );

  // Mission log: keep entries for known step ids; cap the free-text note.
  const missionLog: Record<string, { at: number; note?: string }> = {};
  for (const [stepId, raw] of Object.entries(asRecord(data.missionLog))) {
    if (!allStepIds.has(stepId)) continue;
    const r = asRecord(raw);
    const entry: { at: number; note?: string } = { at: num(r.at, file.exportedAt ?? 0) };
    if (typeof r.note === 'string' && r.note.trim()) entry.note = r.note.trim().slice(0, 280);
    missionLog[stepId] = entry;
  }

  // Word Lab mastery: keep known word ids; clamp per-dimension entries; cap the mnemonic.
  const validWordIds = new Set(words.map((w) => w.id));
  const wordDimSet = new Set<string>(WORD_DIMENSIONS);
  const wordMastery: Record<string, WordMastery> = {};
  for (const [wid, raw] of Object.entries(asRecord(data.wordMastery))) {
    if (!validWordIds.has(wid)) continue;
    const r = asRecord(raw);
    const dims: WordMastery['dims'] = {};
    for (const [dim, draw] of Object.entries(asRecord(r.dims))) {
      if (!wordDimSet.has(dim)) continue;
      const d = asRecord(draw);
      dims[dim as WordDimension] = {
        strength: Math.max(0, num(d.strength, 0)),
        intervalIdx: clampInt(num(d.intervalIdx, 0), 0, 10),
        due: num(d.due, 0),
        reviewed: num(d.reviewed, 0),
      };
    }
    const entry: WordMastery = { dims };
    if (typeof r.mnemonic === 'string' && r.mnemonic.trim()) {
      entry.mnemonic = r.mnemonic.trim().slice(0, 280);
    }
    if (typeof r.introducedAt === 'number' && Number.isFinite(r.introducedAt)) {
      entry.introducedAt = r.introducedAt;
    }
    wordMastery[wid] = entry;
  }

  // Word Lab hint log: keep entries for known word-case step ids.
  const validWordStepIds = new Set(wordCases.flatMap((c) => c.steps.map((s) => s.id)));
  const wordHintLog: Record<string, number> = {};
  for (const [stepId, lvl] of Object.entries(asRecord(data.wordHintLog))) {
    if (validWordStepIds.has(stepId) && typeof lvl === 'number' && Number.isFinite(lvl)) {
      wordHintLog[stepId] = Math.max(0, Math.round(lvl));
    }
  }

  const state: ProgressState = {
    ...initialProgress,
    version: PROGRESS_VERSION,
    completedCases,
    caseSteps,
    insights,
    ownPhrases,
    caughtMissions,
    missionLog,
    wordMastery,
    wordHintLog,
    xp: Math.max(0, num(data.xp, 0)),
    review,
    reviewStreak: Math.max(0, num(data.reviewStreak, 0)),
    reviewBest: Math.max(0, num(data.reviewBest, 0)),
  };

  return { state, summary: { cases: completedCases.length, insights: insights.length, dropped } };
}
