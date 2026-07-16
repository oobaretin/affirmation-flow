import type { Affirmation } from '../data/affirmations';

const PINNED_KEY = 'affirmation-flow-pinned-today';
const PINNED_DATE_KEY = 'affirmation-flow-pinned-date';

export function pinAffirmationForToday(affirmation: Affirmation): void {
  localStorage.setItem(PINNED_KEY, JSON.stringify(affirmation));
  localStorage.setItem(PINNED_DATE_KEY, new Date().toDateString());
}

export function getPinnedAffirmationForToday(): Affirmation | null {
  const date = localStorage.getItem(PINNED_DATE_KEY);
  if (date !== new Date().toDateString()) {
    clearPinnedAffirmation();
    return null;
  }

  const stored = localStorage.getItem(PINNED_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Affirmation;
  } catch {
    return null;
  }
}

export function clearPinnedAffirmation(): void {
  localStorage.removeItem(PINNED_KEY);
  localStorage.removeItem(PINNED_DATE_KEY);
}

export function isPinnedToday(affirmationId: string): boolean {
  const pinned = getPinnedAffirmationForToday();
  return pinned?.id === affirmationId;
}
