import type { Affirmation } from '../data/affirmations';
import type { UserSettings } from '../types/settings';
import { cancelDailyNotification, scheduleDailyNotification } from './notifications';
import { stopSpeaking } from './voice';

export const STORAGE_KEYS = [
  'affirmation-flow-settings',
  'affirmation-flow-custom',
  'affirmation-flow-favorites',
  'affirmation-flow-streak',
  'affirmation-flow-pinned-today',
  'affirmation-flow-pinned-date',
] as const;

export const EXPLICIT_LOGOUT_KEY = 'affirmation-flow-explicit-logout';

export function getLoggedOutDefaultRoute(isExplicitLogout: boolean): '/signed-out' | '/welcome' {
  return isExplicitLogout ? '/signed-out' : '/welcome';
}

export function markExplicitLogout(): void {
  sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
}

export function clearExplicitLogout(): void {
  sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
}

export function hasExplicitLogout(): boolean {
  return sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1';
}

export async function pauseSession(): Promise<void> {
  stopSpeaking();
  try {
    await cancelDailyNotification();
  } catch {
    // Notifications unavailable on this platform
  }
}

export async function resumeSession(
  settings: UserSettings,
  custom: Affirmation[] = [],
): Promise<void> {
  if (settings.notificationsEnabled) {
    await scheduleDailyNotification(settings, custom);
  }
}

export async function clearAllAppData(): Promise<void> {
  await pauseSession();
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
