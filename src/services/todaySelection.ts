import type { Affirmation } from '../data/affirmations';

type TodaySelection = {
  affirmation: Affirmation;
  autoPlay: boolean;
};

let pendingSelection: TodaySelection | null = null;

export function queueTodayAffirmation(affirmation: Affirmation, autoPlay = true): void {
  pendingSelection = { affirmation, autoPlay };
}

export function consumeQueuedTodayAffirmation(): TodaySelection | null {
  const selection = pendingSelection;
  pendingSelection = null;
  return selection;
}
