export type RepeatMode = 'fixed' | 'unlimited';
export type VoiceStyle = 'soothing' | 'balanced' | 'bright';

export interface UserSettings {
  name: string;
  onboardingComplete: boolean;
  isLoggedIn: boolean;
  repeatMode: RepeatMode;
  repeatCount: number;
  voiceEnabled: boolean;
  voiceStyle: VoiceStyle;
  voiceURI: string;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  focusCategories: string[];
}

export const MANTRA_COUNTS = [3, 7, 21, 108] as const;

export const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  onboardingComplete: false,
  isLoggedIn: false,
  repeatMode: 'fixed',
  repeatCount: 3,
  voiceEnabled: true,
  voiceStyle: 'soothing',
  voiceURI: '',
  notificationsEnabled: true,
  notificationHour: 8,
  notificationMinute: 0,
  focusCategories: [],
};

export function formatRepeatLabel(mode: RepeatMode, count: number): string {
  if (mode === 'unlimited') return 'Unlimited';
  return `${count}x`;
}
