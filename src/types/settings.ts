import { DEFAULT_ELEVENLABS_VOICE_ID } from '../constants/elevenLabsVoices';

export type RepeatMode = 'fixed' | 'unlimited';
export type VoiceStyle = 'soothing' | 'balanced' | 'bright';
export type VoiceProvider = 'device' | 'elevenlabs';

export interface UserSettings {
  name: string;
  onboardingComplete: boolean;
  isLoggedIn: boolean;
  repeatMode: RepeatMode;
  repeatCount: number;
  voiceEnabled: boolean;
  voiceStyle: VoiceStyle;
  voiceURI: string;
  voiceProvider: VoiceProvider;
  elevenLabsVoiceId: string;
  notificationsEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
  focusCategories: string[];
}

export const MANTRA_COUNTS = [3, 7, 21, 108] as const;

export const PRACTICE_PRESETS = [
  { id: 'quick', label: 'Quick', description: '1× — a single listen', count: 1, mode: 'fixed' as const },
  { id: 'daily', label: 'Daily', description: '3× — your everyday ritual', count: 3, mode: 'fixed' as const },
  { id: 'deep', label: 'Deep', description: '7× — slower, fuller practice', count: 7, mode: 'fixed' as const },
] as const;

export type PracticePresetId = (typeof PRACTICE_PRESETS)[number]['id'];

export function matchPracticePreset(
  mode: RepeatMode,
  count: number,
): PracticePresetId | 'custom' {
  if (mode === 'unlimited') return 'custom';
  const preset = PRACTICE_PRESETS.find((item) => item.count === count);
  return preset?.id ?? 'custom';
}

export const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  onboardingComplete: false,
  isLoggedIn: false,
  repeatMode: 'fixed',
  repeatCount: 3,
  voiceEnabled: true,
  voiceStyle: 'soothing',
  voiceURI: '',
  voiceProvider: 'elevenlabs',
  elevenLabsVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
  notificationsEnabled: true,
  notificationHour: 8,
  notificationMinute: 0,
  focusCategories: [],
};

export function formatRepeatLabel(mode: RepeatMode, count: number): string {
  if (mode === 'unlimited') return 'Unlimited';
  return `${count}x`;
}

export type PracticeProgress = {
  current: number;
  total: number;
  fraction?: number;
};

/** Practice repeat guidance on Today (voice and silent modes). */
export function getTodayPracticeHint(
  voiceEnabled: boolean,
  repeatMode: RepeatMode,
  repeatCount: number,
  progress?: PracticeProgress | null,
): string | null {
  if (voiceEnabled) {
    if (repeatMode === 'unlimited') return 'Playing on loop';
    if (progress && progress.total > 0) {
      return `Playing ${progress.current} of ${progress.total}`;
    }
    return `Plays ${formatRepeatLabel(repeatMode, repeatCount)}`;
  }

  if (repeatMode === 'unlimited') return 'Repeat at your own pace';
  return `Repeat to yourself ${formatRepeatLabel(repeatMode, repeatCount)}`;
}
