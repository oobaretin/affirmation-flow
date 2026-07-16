export type VoiceStyle = 'soothing' | 'balanced' | 'bright';

export interface VoicePreset {
  rate: number;
  pitch: number;
  pauseMs: number;
  label: string;
  description: string;
}

export const VOICE_PRESETS: Record<VoiceStyle, VoicePreset> = {
  soothing: {
    rate: 0.78,
    pitch: 0.9,
    pauseMs: 1600,
    label: 'Soothing',
    description: 'Soft, slow, and warm — best for affirmations',
  },
  balanced: {
    rate: 0.88,
    pitch: 1,
    pauseMs: 1200,
    label: 'Balanced',
    description: 'Clear and natural',
  },
  bright: {
    rate: 0.96,
    pitch: 1.05,
    pauseMs: 900,
    label: 'Bright',
    description: 'Upbeat and energizing',
  },
};

export interface VoiceOptions {
  rate: number;
  pitch: number;
  pauseMs: number;
  voiceURI?: string;
}

const SOOTHING_VOICE_HINTS = [
  'samantha',
  'karen',
  'victoria',
  'fiona',
  'serena',
  'tessa',
  'allison',
  'ava',
  'susan',
  'salli',
  'joanna',
  'kendra',
  'ivy',
  'moira',
  'kate',
  'zira',
];

export function scoreVoiceForSoothing(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;

  if (voice.lang.toLowerCase().startsWith('en')) score += 2;
  if (voice.localService) score += 1;

  const hintIndex = SOOTHING_VOICE_HINTS.findIndex((hint) => name.includes(hint));
  if (hintIndex >= 0) score += 12 - hintIndex;

  if (name.includes('female') || name.includes('woman')) score += 4;
  if (name.includes('enhanced') || name.includes('premium')) score += 2;
  if (name.includes('compact')) score -= 2;

  return score;
}

export function pickSoothingVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI?: string,
): SpeechSynthesisVoice | null {
  if (preferredURI) {
    const selected = voices.find((voice) => voice.voiceURI === preferredURI);
    if (selected) return selected;
  }

  const englishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en'));
  const pool = englishVoices.length > 0 ? englishVoices : voices;
  if (pool.length === 0) return null;

  return [...pool].sort((a, b) => scoreVoiceForSoothing(b) - scoreVoiceForSoothing(a))[0];
}

export function getVoiceOptions(
  style: VoiceStyle,
  voiceURI = '',
): VoiceOptions {
  const preset = VOICE_PRESETS[style];
  return {
    rate: preset.rate,
    pitch: preset.pitch,
    pauseMs: preset.pauseMs,
    voiceURI: voiceURI || undefined,
  };
}
