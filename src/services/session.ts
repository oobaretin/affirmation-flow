import { cancelDailyNotification } from './notifications';
import { resetFreePreview, FREE_PREVIEW_KEY } from './freePreview';
import { SEEN_KEY, resetSeenAffirmations } from './seenAffirmations';
import { stopSpeaking } from './voice';

export const STORAGE_KEYS = [
  'affirmation-flow-settings',
  'affirmation-flow-custom',
  'affirmation-flow-favorites',
  'affirmation-flow-streak',
  'affirmation-flow-pinned-today',
  'affirmation-flow-pinned-date',
  FREE_PREVIEW_KEY,
  SEEN_KEY,
] as const;

export async function clearAllAppData(): Promise<void> {
  stopSpeaking();
  try {
    await cancelDailyNotification();
  } catch {
    // Notifications unavailable on this platform
  }
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  resetFreePreview();
  resetSeenAffirmations();
}
