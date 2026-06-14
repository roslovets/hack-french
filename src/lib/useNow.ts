import { useEffect, useState } from 'react';

/**
 * Current time as a reactive value. `Date.now()` must not be called during
 * render (impure function) nor synchronously in an effect body (cascading
 * render), so we take the timestamp asynchronously — right after mount and,
 * optionally, periodically. Returns 0 until the first tick.
 */
export function useNow(refreshMs?: number): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
    };
    const initial = setTimeout(tick, 0);
    const interval = refreshMs ? setInterval(tick, refreshMs) : undefined;
    return () => {
      clearTimeout(initial);
      if (interval) clearInterval(interval);
    };
  }, [refreshMs]);
  return now;
}
