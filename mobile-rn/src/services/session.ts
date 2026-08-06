import { removeStorage } from '../storage/memoryStorage';
import { cancelDailyNotification } from './notifications';
import { stopSpeaking } from './voice';

export const STORAGE_KEYS = [
  'affirmation-flow-settings',
  'affirmation-flow-custom',
  'affirmation-flow-favorites',
  'affirmation-flow-streak',
  'affirmation-flow-pinned-today',
  'affirmation-flow-pinned-date',
] as const;

export async function clearAllAppData(): Promise<void> {
  stopSpeaking();
  try {
    await cancelDailyNotification();
  } catch {
    // Notifications unavailable on this platform
  }
  STORAGE_KEYS.forEach((key) => removeStorage(key));
}
