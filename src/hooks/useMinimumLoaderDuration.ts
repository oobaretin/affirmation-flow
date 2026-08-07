import { useEffect, useRef, useState } from 'react';

/** Short brand beat — long enough to register, short enough not to block. */
export const LOADER_MIN_DURATION_MS = 1800;

export function useMinimumLoaderDuration(
  isLoading: boolean,
  minimumMs: number = LOADER_MIN_DURATION_MS,
): boolean {
  const [visible, setVisible] = useState(isLoading);
  const startedAt = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (minimumMs <= 0) {
      setVisible(isLoading);
      return;
    }

    if (isLoading) {
      if (startedAt.current === null) {
        startedAt.current = Date.now();
      }
      setVisible(true);
      return;
    }

    if (startedAt.current === null) {
      setVisible(false);
      return;
    }

    const remaining = minimumMs - (Date.now() - startedAt.current);
    if (remaining <= 0) {
      setVisible(false);
      startedAt.current = null;
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      startedAt.current = null;
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [isLoading, minimumMs]);

  if (minimumMs <= 0) {
    return isLoading;
  }

  return visible;
}
