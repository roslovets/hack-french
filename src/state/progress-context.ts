import { createContext } from 'react';

import type { WordDimension } from '@/types';

/** A collected insight (for the collection). */
export interface CollectedInsight {
  caseId: string;
  mechanism: string;
  text: string;
  at: number;
}

/** A real-world catch: the learner confirmed using/hearing the mechanism in life. */
export interface MissionCatch {
  /** When it was logged (timestamp). */
  at: number;
  /** Optional reflection: where it was heard / what was said. */
  note?: string;
}

/** Per-dimension spaced-repetition state for one word (parallels ReviewEntry). */
export interface DimensionState {
  strength: number;
  intervalIdx: number;
  due: number;
  reviewed: number;
}

/** Word Lab mastery for one word: independent per-dimension scheduling + personal data. */
export interface WordMastery {
  dims: Partial<Record<WordDimension, DimensionState>>;
  mnemonic?: string;
  introducedAt?: number;
}

/** Spaced-repetition schedule for a single case. */
export interface ReviewEntry {
  /** When the case will "cool down" again and become due for review (timestamp). */
  due: number;
  /** Index on the interval scale (grows on correct answers). */
  intervalIdx: number;
  /** Accumulated mechanism "strength" (for the map). */
  strength: number;
  /** When it was last reviewed. */
  reviewed: number;
}

/** Player progress state, persisted to localStorage in its entirety. */
export interface ProgressState {
  version: number;
  completedCases: string[];
  /** caseId -> ids of completed steps. */
  caseSteps: Record<string, string[]>;
  insights: CollectedInsight[];
  /** stepId -> the user's own phrases. */
  ownPhrases: Record<string, string[]>;
  /** ids of accepted "catch it in real life" missions (taken on, not necessarily caught yet). */
  caughtMissions: string[];
  /** stepId -> real-world catch log (confirmed used/heard in life + optional note). */
  missionLog: Record<string, MissionCatch>;
  xp: number;
  /** caseId -> review schedule. */
  review: Record<string, ReviewEntry>;
  /** Current streak of correct review answers. */
  reviewStreak: number;
  /** Best review streak. */
  reviewBest: number;
  /** Word Lab: wordId -> per-dimension mastery + personal data. */
  wordMastery: Record<string, WordMastery>;
  /** Word Lab (M29): stepId -> hint level used to recall (0 = clean recall). */
  wordHintLog: Record<string, number>;
}

export const PROGRESS_VERSION = 1;
export const STORAGE_KEY = 'hack-french:progress:v1';

export const initialProgress: ProgressState = {
  version: PROGRESS_VERSION,
  completedCases: [],
  caseSteps: {},
  insights: [],
  ownPhrases: {},
  caughtMissions: [],
  missionLog: {},
  xp: 0,
  review: {},
  reviewStreak: 0,
  reviewBest: 0,
  wordMastery: {},
  wordHintLog: {},
};

export type ProgressAction =
  | { type: 'COMPLETE_STEP'; caseId: string; stepId: string; xp: number }
  | {
      type: 'COMPLETE_CASE';
      caseId: string;
      mechanism: string;
      insight: string;
      xp: number;
      at: number;
    }
  | { type: 'SAVE_OWN_PHRASES'; stepId: string; phrases: string[] }
  | { type: 'CATCH_MISSION'; stepId: string }
  | { type: 'LOG_MISSION'; stepId: string; at: number; note?: string }
  | { type: 'UNLOG_MISSION'; stepId: string }
  | { type: 'RESET_CASE'; caseId: string; stepIds: string[]; stepXp: number; caseBonus: number }
  | { type: 'REVIEW_GRADE'; caseId: string; correct: boolean; intervals: number[]; at: number }
  | {
      type: 'GRADE_WORD_DIMENSION';
      wordId: string;
      dimension: WordDimension;
      correct: boolean;
      intervals: number[];
      at: number;
    }
  | { type: 'SAVE_WORD_MNEMONIC'; wordId: string; mnemonic: string }
  | { type: 'LOG_WORD_HINT'; stepId: string; level: number }
  | { type: 'IMPORT'; state: ProgressState }
  | { type: 'RESET' };

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'COMPLETE_STEP': {
      const done = state.caseSteps[action.caseId] ?? [];
      if (done.includes(action.stepId)) return state;
      return {
        ...state,
        caseSteps: { ...state.caseSteps, [action.caseId]: [...done, action.stepId] },
        xp: state.xp + action.xp,
      };
    }
    case 'COMPLETE_CASE': {
      if (state.completedCases.includes(action.caseId)) return state;
      return {
        ...state,
        completedCases: [...state.completedCases, action.caseId],
        insights: [
          ...state.insights,
          {
            caseId: action.caseId,
            mechanism: action.mechanism,
            text: action.insight,
            at: action.at,
          },
        ],
        xp: state.xp + action.xp,
      };
    }
    case 'SAVE_OWN_PHRASES': {
      return {
        ...state,
        ownPhrases: { ...state.ownPhrases, [action.stepId]: action.phrases },
      };
    }
    case 'CATCH_MISSION': {
      if (state.caughtMissions.includes(action.stepId)) return state;
      return { ...state, caughtMissions: [...state.caughtMissions, action.stepId] };
    }
    case 'LOG_MISSION': {
      // Logging a real-world catch also implies the mission was accepted.
      const caughtMissions = state.caughtMissions.includes(action.stepId)
        ? state.caughtMissions
        : [...state.caughtMissions, action.stepId];
      return {
        ...state,
        caughtMissions,
        missionLog: {
          ...state.missionLog,
          [action.stepId]: { at: action.at, ...(action.note ? { note: action.note } : {}) },
        },
      };
    }
    case 'UNLOG_MISSION': {
      if (!state.missionLog[action.stepId]) return state;
      const missionLog = { ...state.missionLog };
      delete missionLog[action.stepId];
      return { ...state, missionLog };
    }
    case 'RESET_CASE': {
      const doneSteps = state.caseSteps[action.caseId]?.length ?? 0;
      const wasCompleted = state.completedCases.includes(action.caseId);
      const xpRemoved = doneSteps * action.stepXp + (wasCompleted ? action.caseBonus : 0);
      const caseSteps = { ...state.caseSteps };
      delete caseSteps[action.caseId];
      const ownPhrases = { ...state.ownPhrases };
      for (const stepId of action.stepIds) delete ownPhrases[stepId];
      const stepIdSet = new Set(action.stepIds);
      const review = { ...state.review };
      delete review[action.caseId];
      const missionLog = { ...state.missionLog };
      for (const stepId of action.stepIds) delete missionLog[stepId];
      return {
        ...state,
        completedCases: state.completedCases.filter((id) => id !== action.caseId),
        caseSteps,
        insights: state.insights.filter((i) => i.caseId !== action.caseId),
        ownPhrases,
        caughtMissions: state.caughtMissions.filter((id) => !stepIdSet.has(id)),
        missionLog,
        review,
        xp: Math.max(0, state.xp - xpRemoved),
      };
    }
    case 'REVIEW_GRADE': {
      const prev = state.review[action.caseId];
      const lastIdx = action.intervals.length - 1;
      const newIdx = action.correct ? Math.min((prev?.intervalIdx ?? -1) + 1, lastIdx) : 0;
      const dueMs = action.intervals[newIdx] ?? action.intervals[0] ?? 0;
      const newStreak = action.correct ? state.reviewStreak + 1 : 0;
      const prevStrength = prev?.strength ?? 0;
      return {
        ...state,
        review: {
          ...state.review,
          [action.caseId]: {
            due: action.at + dueMs,
            intervalIdx: newIdx,
            strength: action.correct ? prevStrength + 1 : Math.max(0, prevStrength - 1),
            reviewed: action.at,
          },
        },
        reviewStreak: newStreak,
        reviewBest: Math.max(state.reviewBest, newStreak),
      };
    }
    case 'GRADE_WORD_DIMENSION': {
      const wm = state.wordMastery[action.wordId] ?? { dims: {} };
      const prev = wm.dims[action.dimension];
      const lastIdx = action.intervals.length - 1;
      const newIdx = action.correct ? Math.min((prev?.intervalIdx ?? -1) + 1, lastIdx) : 0;
      const dueMs = action.intervals[newIdx] ?? action.intervals[0] ?? 0;
      const prevStrength = prev?.strength ?? 0;
      return {
        ...state,
        wordMastery: {
          ...state.wordMastery,
          [action.wordId]: {
            ...wm,
            introducedAt: wm.introducedAt ?? action.at,
            dims: {
              ...wm.dims,
              [action.dimension]: {
                strength: action.correct ? prevStrength + 1 : Math.max(0, prevStrength - 1),
                intervalIdx: newIdx,
                due: action.at + dueMs,
                reviewed: action.at,
              },
            },
          },
        },
      };
    }
    case 'SAVE_WORD_MNEMONIC': {
      const wm = state.wordMastery[action.wordId] ?? { dims: {} };
      return {
        ...state,
        wordMastery: {
          ...state.wordMastery,
          [action.wordId]: { ...wm, mnemonic: action.mnemonic || undefined },
        },
      };
    }
    case 'LOG_WORD_HINT': {
      return {
        ...state,
        wordHintLog: { ...state.wordHintLog, [action.stepId]: action.level },
      };
    }
    case 'IMPORT':
      return { ...action.state, version: PROGRESS_VERSION };
    case 'RESET':
      return { ...initialProgress };
    default:
      return state;
  }
}

export interface ProgressContextValue {
  state: ProgressState;
  completeStep: (caseId: string, stepId: string, xp?: number) => void;
  completeCase: (caseId: string, mechanism: string, insight: string, isBoss?: boolean) => void;
  saveOwnPhrases: (stepId: string, phrases: string[]) => void;
  catchMission: (stepId: string) => void;
  logMission: (stepId: string, note?: string) => void;
  unlogMission: (stepId: string) => void;
  gradeWordDimension: (wordId: string, dimension: WordDimension, correct: boolean) => void;
  saveWordMnemonic: (wordId: string, mnemonic: string) => void;
  logWordHint: (stepId: string, level: number) => void;
  resetCase: (caseId: string) => void;
  gradeReview: (caseId: string, correct: boolean) => void;
  importProgress: (next: ProgressState) => void;
  resetProgress: () => void;
  isCaseCompleted: (caseId: string) => boolean;
  completedStepCount: (caseId: string) => number;
  isStepCompleted: (caseId: string, stepId: string) => boolean;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);
