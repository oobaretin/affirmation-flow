import type { Affirmation } from '../data/affirmations';
import { readStorage, removeStorage, writeStorage } from '../storage/memoryStorage';

const PINNED_KEY = 'affirmation-flow-pinned-today';
const PINNED_DATE_KEY = 'affirmation-flow-pinned-date';

export function pinAffirmationForToday(affirmation: Affirmation): void {
  writeStorage(PINNED_KEY, JSON.stringify(affirmation));
  writeStorage(PINNED_DATE_KEY, new Date().toDateString());
}

export function getPinnedAffirmationForToday(): Affirmation | null {
  const date = readStorage(PINNED_DATE_KEY);
  if (date !== new Date().toDateString()) {
    clearPinnedAffirmation();
    return null;
  }

  const stored = readStorage(PINNED_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Affirmation;
  } catch {
    return null;
  }
}

export function clearPinnedAffirmation(): void {
  removeStorage(PINNED_KEY);
  removeStorage(PINNED_DATE_KEY);
}

export function isPinnedToday(affirmationId: string): boolean {
  const pinned = getPinnedAffirmationForToday();
  return pinned?.id === affirmationId;
}
