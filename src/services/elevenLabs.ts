import {
  APP_ELEVENLABS_VOICE_IDS,
  DEFAULT_ELEVENLABS_VOICE_ID,
  ELEVENLABS_VOICES,
  type ElevenLabsVoice,
} from '../constants/elevenLabsVoices';

const API_BASE = 'https://api.elevenlabs.io/v1';
const TTS_MODEL = 'eleven_flash_v2_5';

let lastPremiumVoiceError: string | null = null;

export function setLastPremiumVoiceError(message: string | null): void {
  lastPremiumVoiceError = message;
}

export function getLastPremiumVoiceError(): string | null {
  return lastPremiumVoiceError;
}

type ElevenLabsErrorDetail = {
  type?: string;
  code?: string;
  message?: string;
  status?: string;
};

export type ElevenLabsSubscriptionInfo = {
  tier: string;
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
  isFreeTier: boolean;
};

type ElevenLabsApiVoice = {
  voice_id: string;
  name: string;
  description?: string;
  category?: string;
};

export function isFreeTierSubscription(tier: string): boolean {
  const normalized = tier.trim().toLowerCase();
  return normalized === 'free' || normalized === 'trial';
}

export function isVoiceAllowedOnFreeApi(voice: Pick<ElevenLabsVoice, 'id' | 'category'>): boolean {
  if (APP_ELEVENLABS_VOICE_IDS.has(voice.id)) return true;
  return voice.category === 'generated';
}

export function mergeAppVoiceCatalog(apiVoices: ElevenLabsVoice[]): ElevenLabsVoice[] {
  const apiById = new Map(apiVoices.map((voice) => [voice.id, voice]));

  return ELEVENLABS_VOICES.map((fallbackVoice) => {
    const fromApi = apiById.get(fallbackVoice.id);
    if (!fromApi) return fallbackVoice;

    return {
      ...fallbackVoice,
      name: fromApi.name || fallbackVoice.name,
      description: fromApi.description || fallbackVoice.description,
      category: fromApi.category ?? fallbackVoice.category,
    };
  });
}

export function filterVoicesForApiAccess(
  voices: ElevenLabsVoice[],
  subscription: ElevenLabsSubscriptionInfo | null,
): ElevenLabsVoice[] {
  if (!subscription?.isFreeTier) return voices;
  const accessible = voices.filter((voice) => isVoiceAllowedOnFreeApi(voice));
  return accessible.length > 0 ? accessible : voices;
}

export function pickDefaultApiVoice(
  voices: ElevenLabsVoice[],
  subscription: ElevenLabsSubscriptionInfo | null,
  currentVoiceId: string,
): string {
  const accessible = filterVoicesForApiAccess(voices, subscription);
  if (accessible.some((voice) => voice.id === currentVoiceId)) {
    return currentVoiceId;
  }
  const preferred = accessible.find((voice) => voice.id === DEFAULT_ELEVENLABS_VOICE_ID);
  if (preferred) return preferred.id;
  return accessible[0]?.id ?? DEFAULT_ELEVENLABS_VOICE_ID;
}

async function parseElevenLabsErrorDetail(response: Response): Promise<ElevenLabsErrorDetail> {
  try {
    const body = (await response.json()) as { detail?: ElevenLabsErrorDetail | string };
    const detail = body.detail;
    if (typeof detail === 'object' && detail) return detail;
    if (typeof detail === 'string') return { message: detail };
  } catch {
    // Ignore JSON parse errors
  }
  return {};
}

async function describeElevenLabsError(response: Response): Promise<string> {
  const detail = await parseElevenLabsErrorDetail(response);
  const code = detail.code ?? detail.status;
  const message = detail.message ?? '';

  if (
    code === 'paid_plan_required'
    || message.toLowerCase().includes('library voices')
    || message.toLowerCase().includes('upgrade your subscription')
  ) {
    return 'Free ElevenLabs plans cannot use premade or library voices via the API (usage will not increase). Create a voice with Voice Design on elevenlabs.io, or upgrade to Starter ($6/mo).';
  }

  if (code === 'insufficient_credits' || detail.status === 'quota_exceeded') {
    return 'Out of ElevenLabs credits. Check elevenlabs.io/account/usage and your API key credit limit under Developers → API Keys.';
  }

  if (response.status === 402) {
    return message
      || 'ElevenLabs requires a paid plan or more credits for this voice. Create a Voice Design voice or upgrade your plan.';
  }

  if (response.status === 401 || code === 'invalid_api_key') {
    return 'Invalid ElevenLabs API key. Update VITE_ELEVENLABS_API_KEY and rebuild.';
  }

  if (response.status === 403 || code === 'voice_access_denied') {
    return 'This ElevenLabs voice is not available on your current plan.';
  }

  if (response.status === 429 || detail.type === 'rate_limit_error') {
    return 'ElevenLabs rate limit reached. Try again in a few minutes.';
  }

  if (message) {
    return message;
  }

  return `ElevenLabs TTS failed (${response.status})`;
}

export function getElevenLabsApiKey(): string {
  return import.meta.env.VITE_ELEVENLABS_API_KEY?.trim() ?? '';
}

export function isElevenLabsConfigured(): boolean {
  return getElevenLabsApiKey().length > 0;
}

export async function getElevenLabsSubscription(
  signal?: AbortSignal,
): Promise<ElevenLabsSubscriptionInfo | null> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return null;

  const response = await fetch(`${API_BASE}/user/subscription`, {
    headers: { 'xi-api-key': apiKey },
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    tier?: string;
    character_count?: number;
    character_limit?: number;
  };

  const characterCount = data.character_count ?? 0;
  const characterLimit = data.character_limit ?? 0;

  return {
    tier: data.tier ?? 'unknown',
    characterCount,
    characterLimit,
    remainingCharacters: Math.max(0, characterLimit - characterCount),
    isFreeTier: isFreeTierSubscription(data.tier ?? ''),
  };
}

export async function listElevenLabsVoices(signal?: AbortSignal): Promise<ElevenLabsVoice[]> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return ELEVENLABS_VOICES;

  const response = await fetch(`${API_BASE}/voices`, {
    headers: {
      'xi-api-key': apiKey,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs voices failed (${response.status})`);
  }

  const data = (await response.json()) as { voices?: ElevenLabsApiVoice[] };
  const voices = (data.voices ?? []).map((voice) => ({
    id: voice.voice_id,
    name: voice.name,
    description: voice.description?.trim() || voice.category || 'ElevenLabs voice',
    category: voice.category,
  }));

  if (voices.length === 0) return mergeAppVoiceCatalog(ELEVENLABS_VOICES);

  return mergeAppVoiceCatalog(voices);
}

export async function synthesizeElevenLabsSpeech(
  text: string,
  voiceId = DEFAULT_ELEVENLABS_VOICE_ID,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ElevenLabs API key is not configured');
  }

  const response = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.75,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const errorMessage = await describeElevenLabsError(response);
    setLastPremiumVoiceError(errorMessage);
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    const errorMessage = 'ElevenLabs returned empty audio';
    setLastPremiumVoiceError(errorMessage);
    throw new Error(errorMessage);
  }

  setLastPremiumVoiceError(null);
  return URL.createObjectURL(blob);
}

export function revokeElevenLabsAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}
