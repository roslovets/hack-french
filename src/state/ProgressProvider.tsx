import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { getCase } from '@/data';
import { loadJSON, saveJSON } from '@/lib/storage';

import {
  initialProgress,
  PROGRESS_VERSION,
  progressReducer,
  ProgressContext,
  STORAGE_KEY,
  type ProgressContextValue,
  type ProgressState,
} from './progress-context';

const STEP_XP = 10;
const CASE_XP = 50;
const BOSS_XP = 120;

/** Review interval scale: 1 → 3 → 7 → 21 → 60 days (in ms). */
const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_INTERVALS = [1, 3, 7, 21, 60].map((d) => d * DAY_MS);

function init(): ProgressState {
  const stored = loadJSON<ProgressState>(STORAGE_KEY, initialProgress);
  if (stored.version !== PROGRESS_VERSION) return initialProgress;
  return { ...initialProgress, ...stored };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(progressReducer, undefined, init);

  useEffect(() => {
    saveJSON(STORAGE_KEY, state);
  }, [state]);

  const completeStep = useCallback((caseId: string, stepId: string, xp = STEP_XP) => {
    dispatch({ type: 'COMPLETE_STEP', caseId, stepId, xp });
  }, []);

  const completeCase = useCallback(
    (caseId: string, mechanism: string, insight: string, isBoss = false) => {
      dispatch({
        type: 'COMPLETE_CASE',
        caseId,
        mechanism,
        insight,
        xp: isBoss ? BOSS_XP : CASE_XP,
        at: Date.now(),
      });
    },
    [],
  );

  const saveOwnPhrases = useCallback((stepId: string, phrases: string[]) => {
    dispatch({ type: 'SAVE_OWN_PHRASES', stepId, phrases });
  }, []);

  const catchMission = useCallback((stepId: string) => {
    dispatch({ type: 'CATCH_MISSION', stepId });
  }, []);

  const resetCase = useCallback((caseId: string) => {
    const caseItem = getCase(caseId);
    const stepIds = caseItem?.steps.map((s) => s.id) ?? [];
    const caseBonus = caseItem?.isBoss ? BOSS_XP : CASE_XP;
    dispatch({ type: 'RESET_CASE', caseId, stepIds, stepXp: STEP_XP, caseBonus });
  }, []);

  const gradeReview = useCallback((caseId: string, correct: boolean) => {
    dispatch({
      type: 'REVIEW_GRADE',
      caseId,
      correct,
      intervals: REVIEW_INTERVALS,
      at: Date.now(),
    });
  }, []);

  const importProgress = useCallback((next: ProgressState) => {
    dispatch({ type: 'IMPORT', state: next });
  }, []);

  const resetProgress = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      completeStep,
      completeCase,
      saveOwnPhrases,
      catchMission,
      resetCase,
      gradeReview,
      importProgress,
      resetProgress,
      isCaseCompleted: (caseId) => state.completedCases.includes(caseId),
      completedStepCount: (caseId) => state.caseSteps[caseId]?.length ?? 0,
      isStepCompleted: (caseId, stepId) => (state.caseSteps[caseId] ?? []).includes(stepId),
    }),
    [
      state,
      completeStep,
      completeCase,
      saveOwnPhrases,
      catchMission,
      resetCase,
      gradeReview,
      importProgress,
      resetProgress,
    ],
  );

  return <ProgressContext value={value}>{children}</ProgressContext>;
}
