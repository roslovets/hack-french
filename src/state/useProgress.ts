import { useContext } from 'react';

import { ProgressContext, type ProgressContextValue } from './progress-context';

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (ctx === null) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return ctx;
}
