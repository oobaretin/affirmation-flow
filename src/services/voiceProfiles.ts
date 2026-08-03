import { DEFAULT_ELEVENLABS_VOICE_ID } from '../constants/elevenLabsVoices';
import { isElevenLabsConfigured } from './elevenLabs';
import type { UserSettings, VoiceProvider, VoiceStyle } from '../types/settings';

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
    rate: 0.68,
    pitch: 0.85,
    pauseMs: 1900,
    volume: 0.9,
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
  useElevenLabs?: boolean;
  elevenLabsVoiceId?: string;
}

/** Legacy device voice allowlist — kept for tests; app uses ElevenLabs only. */
const DEVICE_VOICE_ALLOWLIST = ['karen'] as const;

export const DEVICE_VOICE_PICKER_ORDER = ['karen'] as const;

const SUPPLEMENTAL_CALM_VOICE_HINTS: string[] = [];

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
  return matchesVoiceHint(name, [...DEVICE_VOICE_ALLOWLIST]);
}

export function scoreVoiceForSoothing(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;

  if (voice.lang.toLowerCase().startsWith('en-us')) score += 3;
  else if (voice.lang.toLowerCase().startsWith('en')) score += 2;
  if (voice.localService) score += 2;

  const hintIndex = DEVICE_VOICE_ALLOWLIST.findIndex((hint) =>
    matchesVoiceHint(name, [hint]),
  );
  if (hintIndex >= 0) score += 14 - hintIndex;

  const supplementalIndex = SUPPLEMENTAL_CALM_VOICE_HINTS.findIndex((hint) =>
    matchesVoiceHint(name, [hint]),
  );
  if (supplementalIndex >= 0) score += 8 - supplementalIndex;

  if (name.includes('premium') || name.includes('enhanced') || name.includes('neural')) score += 8;
  if (name.includes('female') || name.includes('woman')) score += 3;
  if (name.includes('compact')) score -= 4;
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

  return orderDevicePickerVoices(calmVoices);
}

function orderDevicePickerVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const byBaseName = new Map(
    voices.map((voice) => [getVoiceBaseName(voice.name), voice]),
  );

  return DEVICE_VOICE_PICKER_ORDER
    .map((name) => byBaseName.get(name))
    .filter((voice): voice is SpeechSynthesisVoice => Boolean(voice));
}

/** Settings picker: Auto plus Karen only (free tier). */
export function filterDeviceVoicesForPicker(
  voices: SpeechSynthesisVoice[],
  savedURI = '',
): SpeechSynthesisVoice[] {
  const allowed = dedupeVoicesByBaseName(voices.filter(isCalmClearVoice));
  const ordered = orderDevicePickerVoices(allowed);

  if (!savedURI) return ordered;

  const saved = voices.find((voice) => voice.voiceURI === savedURI);
  if (!saved || !isCalmClearVoice(saved)) return ordered;

  const savedKey = getVoiceBaseName(saved.name);
  if (ordered.some((voice) => getVoiceBaseName(voice.name) === savedKey)) {
    return ordered;
  }

  return orderDevicePickerVoices([...allowed, saved]);
}

function getCalmClearPool(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const pool = dedupeVoicesByBaseName(voices.filter(isCalmClearVoice));
  return sortVoicesForSoothing(pool);
}

export function getRecommendedVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const pool = getCalmClearPool(voices);
  return pool[0] ?? null;
}

export function getVoiceOptions(
  style: VoiceStyle,
  voiceURI = '',
  voiceProvider: VoiceProvider = 'elevenlabs',
  elevenLabsVoiceId = DEFAULT_ELEVENLABS_VOICE_ID,
): VoiceOptions {
  const preset = VOICE_PRESETS[style];
  const useElevenLabs = voiceProvider === 'elevenlabs' && isElevenLabsConfigured();

  return {
    rate: preset.rate,
    pitch: preset.pitch,
    pauseMs: preset.pauseMs,
    volume: preset.volume,
    voiceURI: voiceURI || undefined,
    useElevenLabs,
    elevenLabsVoiceId: elevenLabsVoiceId || DEFAULT_ELEVENLABS_VOICE_ID,
  };
}

export function buildVoiceOptions(
  settings: Pick<UserSettings, 'voiceStyle' | 'voiceURI' | 'voiceProvider' | 'elevenLabsVoiceId'>,
): VoiceOptions {
  return getVoiceOptions(
    settings.voiceStyle,
    settings.voiceURI,
    'elevenlabs',
    settings.elevenLabsVoiceId || DEFAULT_ELEVENLABS_VOICE_ID,
  );
}
