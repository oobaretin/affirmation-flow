import { CATEGORIES } from '../../data/affirmations';
import { ELEVENLABS_VOICES } from '../../constants/elevenLabsVoices';
import { formatRepeatLabel, type UserSettings } from '../../types/settings';
import { VOICE_PRESETS } from '../../services/voiceProfiles';

export function formatReminderHour(hour: number): string {
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${h}:00 ${ampm}`;
}

export function formatFocusSummary(selected: string[]): string {
  if (selected.length === 0) return 'None selected';
  if (selected.length === CATEGORIES.length) return 'All areas';
  return `${selected.length} selected`;
}

export function getPracticeSummary(settings: UserSettings): string {
  return formatRepeatLabel(settings.repeatMode, settings.repeatCount);
}

export function getVoiceSummary(settings: UserSettings): string {
  if (!settings.voiceEnabled) return 'Off';
  const voice = ELEVENLABS_VOICES.find((item) => item.id === settings.elevenLabsVoiceId);
  const style = VOICE_PRESETS[settings.voiceStyle].label;
  return voice ? `${voice.name} · ${style}` : style;
}

export function getRemindersSummary(settings: UserSettings): string {
  if (!settings.notificationsEnabled) return 'Off';
  return formatReminderHour(settings.notificationHour);
}

export function getHubSummary(settings: UserSettings): string {
  return [
    getRemindersSummary(settings),
    formatFocusSummary(settings.focusCategories),
    getVoiceSummary(settings),
    getPracticeSummary(settings),
  ].join(' · ');
}

export function formatRenewalDate(value: string | null): string {
  if (!value) return 'Active';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Active';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
