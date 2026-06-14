import { createContext } from 'react';

/** A collected insight (for the collection). */
export interface CollectedInsight {
  caseId: string;
  mechanism: string;
  text: string;
  at: number;
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
  /** ids of completed "catch it in real life" missions. */
  caughtMissions: string[];
  xp: number;
  /** caseId -> review schedule. */
  review: Record<string, ReviewEntry>;
  /** Current streak of correct review answers. */
  reviewStreak: number;
  /** Best review streak. */
  reviewBest: number;
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
  xp: 0,
  review: {},
  reviewStreak: 0,
  reviewBest: 0,
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
  | { type: 'RESET_CASE'; caseId: string; stepIds: string[]; stepXp: number; caseBonus: number }
  | { type: 'REVIEW_GRADE'; caseId: string; correct: boolean; intervals: number[]; at: number }
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
      return {
        ...state,
        completedCases: state.completedCases.filter((id) => id !== action.caseId),
        caseSteps,
        insights: state.insights.filter((i) => i.caseId !== action.caseId),
        ownPhrases,
        caughtMissions: state.caughtMissions.filter((id) => !stepIdSet.has(id)),
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
  resetCase: (caseId: string) => void;
  gradeReview: (caseId: string, correct: boolean) => void;
  importProgress: (next: ProgressState) => void;
  resetProgress: () => void;
  isCaseCompleted: (caseId: string) => boolean;
  completedStepCount: (caseId: string) => number;
  isStepCompleted: (caseId: string, stepId: string) => boolean;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);
