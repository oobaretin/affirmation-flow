export type VoiceStyle = 'soothing' | 'balanced' | 'bright';

export interface VoicePreset {
  rate: number;
  pitch: number;
  pauseMs: number;
  volume: number;
  label: string;
  description: string;
}

export const VOICE_PRESETS: Record<VoiceStyle, VoicePreset> = {
  soothing: {
    rate: 0.72,
    pitch: 0.88,
    pauseMs: 1800,
    volume: 0.92,
    label: 'Soothing',
    description: 'Soft, slow, and warm — best for affirmations',
  },
  balanced: {
    rate: 0.88,
    pitch: 1,
    pauseMs: 1200,
    volume: 0.95,
    label: 'Balanced',
    description: 'Clear and natural',
  },
  bright: {
    rate: 0.96,
    pitch: 1.05,
    pauseMs: 900,
    volume: 1,
    label: 'Bright',
    description: 'Upbeat and energizing',
  },
};

export interface VoiceOptions {
  rate: number;
  pitch: number;
  pauseMs: number;
  volume: number;
  voiceURI?: string;
}

const CALM_CLEAR_VOICE_HINTS = [
  'samantha',
  'karen',
  'ava',
  'allison',
  'nicky',
  'victoria',
  'fiona',
  'serena',
  'tessa',
  'moira',
  'kate',
  'susan',
  'hazel',
  'martha',
];

const SUPPLEMENTAL_CALM_VOICE_HINTS = [
  'joanna',
  'salli',
  'kendra',
  'ivy',
  'catherine',
  'zira',
];

const VOICE_EXCLUDE_HINTS = [
  'bells',
  'bad news',
  'bubbles',
  'zarvox',
  'whisper',
  'squeaky',
  'espeak',
  'mbrola',
  'trinoids',
  'boing',
  'cellos',
  'good news',
  'pipe organ',
  'grandma',
  'grandpa',
  'jester',
];

const MALE_VOICE_HINTS = [
  'alex',
  'fred',
  'daniel',
  'tom',
  'ralph',
  'bruce',
  'aaron',
  'nathan',
  'evan',
  'gordon',
  'arthur',
  'reed',
  'david',
  'james',
  'mark',
  'dan',
];

export function getVoiceBaseName(name: string): string {
  return name.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
}

function matchesVoiceHint(name: string, hints: string[]): boolean {
  const baseName = getVoiceBaseName(name);
  return hints.includes(baseName);
}

function isExcludedVoice(name: string): boolean {
  const baseName = getVoiceBaseName(name);
  return (
    VOICE_EXCLUDE_HINTS.some((hint) => name.includes(hint)) ||
    MALE_VOICE_HINTS.includes(baseName)
  );
}

function isEnglishVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.lang.toLowerCase().startsWith('en');
}

export function isCalmClearVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  if (!isEnglishVoice(voice)) return false;
  if (isExcludedVoice(name)) return false;
  return (
    matchesVoiceHint(name, CALM_CLEAR_VOICE_HINTS) ||
    matchesVoiceHint(name, SUPPLEMENTAL_CALM_VOICE_HINTS)
  );
}

export function scoreVoiceForSoothing(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;

  if (voice.lang.toLowerCase().startsWith('en-us')) score += 3;
  else if (voice.lang.toLowerCase().startsWith('en')) score += 2;
  if (voice.localService) score += 2;

  const hintIndex = CALM_CLEAR_VOICE_HINTS.findIndex((hint) =>
    matchesVoiceHint(name, [hint]),
  );
  if (hintIndex >= 0) score += 14 - hintIndex;

  const supplementalIndex = SUPPLEMENTAL_CALM_VOICE_HINTS.findIndex((hint) =>
    matchesVoiceHint(name, [hint]),
  );
  if (supplementalIndex >= 0) score += 8 - supplementalIndex;

  if (name.includes('premium') || name.includes('enhanced')) score += 5;
  if (name.includes('female') || name.includes('woman')) score += 3;
  if (isExcludedVoice(name)) score -= 20;

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

  if (voices.length === 0) return null;

  return getCalmClearPool(voices)[0] ?? null;
}

export function sortVoicesForSoothing(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return [...voices].sort((a, b) => scoreVoiceForSoothing(b) - scoreVoiceForSoothing(a));
}

export function dedupeVoicesByBaseName(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const sorted = sortVoicesForSoothing(voices);
  const seen = new Set<string>();
  const unique: SpeechSynthesisVoice[] = [];

  for (const voice of sorted) {
    const key = getVoiceBaseName(voice.name);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(voice);
  }

  return unique;
}

export function formatVoiceLabel(voice: SpeechSynthesisVoice): string {
  return voice.name.trim();
}

export function filterCalmClearVoices(
  voices: SpeechSynthesisVoice[],
  savedURI = '',
): SpeechSynthesisVoice[] {
  const calmVoices = dedupeVoicesByBaseName(voices.filter(isCalmClearVoice));

  if (savedURI) {
    const saved = voices.find((voice) => voice.voiceURI === savedURI);
    if (saved) {
      const savedKey = getVoiceBaseName(saved.name);
      const alreadyIncluded = calmVoices.some(
        (voice) => getVoiceBaseName(voice.name) === savedKey,
      );
      if (!alreadyIncluded) calmVoices.push(saved);
    }
  }

  return sortVoicesForSoothing(calmVoices);
}

function getCalmClearPool(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const calmVoices = filterCalmClearVoices(voices);
  if (calmVoices.length > 0) return calmVoices;

  const englishVoices = voices.filter(
    (voice) =>
      voice.lang.toLowerCase().startsWith('en') && !isExcludedVoice(voice.name.toLowerCase()),
  );
  return sortVoicesForSoothing(englishVoices).slice(0, 1);
}

export function getRecommendedVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const pool = getCalmClearPool(voices);
  return pool[0] ?? null;
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
    volume: preset.volume,
    voiceURI: voiceURI || undefined,
  };
}
