import { DEFAULT_ELEVENLABS_VOICE_ID } from '../constants/elevenLabsVoices';
import type { UserSettings, VoiceStyle } from '../types/settings';

export interface VoiceOptions {
  volume: number;
  pauseMs: number;
  elevenLabsVoiceId: string;
}

export const VOICE_PRESETS: Record<VoiceStyle, { pauseMs: number; volume: number; label: string }> = {
  soothing: { pauseMs: 1900, volume: 0.9, label: 'Soothing' },
  balanced: { pauseMs: 1200, volume: 0.95, label: 'Balanced' },
  bright: { pauseMs: 900, volume: 1, label: 'Bright' },
};

export function buildVoiceOptions(settings: UserSettings): VoiceOptions {
  const preset = VOICE_PRESETS[settings.voiceStyle];
  return {
    volume: preset.volume,
    pauseMs: preset.pauseMs,
    elevenLabsVoiceId: settings.elevenLabsVoiceId || DEFAULT_ELEVENLABS_VOICE_ID,
  };
}
