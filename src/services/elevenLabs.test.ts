import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  KNIGHT_VOICE_ID,
  MAYA_VOICE_ID,
} from '../constants/elevenLabsVoices';
import {
  filterVoicesForApiAccess,
  getElevenLabsApiKey,
  isElevenLabsConfigured,
  isFreeTierSubscription,
  isVoiceAllowedOnFreeApi,
  listElevenLabsVoices,
  mergeAppVoiceCatalog,
  pickDefaultApiVoice,
  revokeElevenLabsAudioUrl,
  synthesizeElevenLabsSpeech,
  type ElevenLabsSubscriptionInfo,
} from './elevenLabs';

describe('elevenLabs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports unconfigured when API key is missing', () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', '');
    expect(isElevenLabsConfigured()).toBe(false);
    expect(getElevenLabsApiKey()).toBe('');
  });

  it('synthesizes speech and returns an object URL', async () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', 'test-key');

    const createObjectURL = vi.fn(() => 'blob:audio-test');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/mpeg' })),
    });
    vi.stubGlobal('fetch', fetchMock);

    const url = await synthesizeElevenLabsSpeech('I am calm.', DEFAULT_ELEVENLABS_VOICE_ID);

    expect(url).toBe('blob:audio-test');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/text-to-speech/${DEFAULT_ELEVENLABS_VOICE_ID}`),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'xi-api-key': 'test-key',
        }),
      }),
    );

    revokeElevenLabsAudioUrl(url);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:audio-test');
  });

  it('throws when the API responds with insufficient credits', async () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({ detail: { code: 'insufficient_credits', message: 'Quota exceeded' } }),
    }));

    await expect(synthesizeElevenLabsSpeech('Hello')).rejects.toThrow('Out of ElevenLabs credits');
  });

  it('throws when free tier uses a library voice via the API', async () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: () => Promise.resolve({
        detail: {
          code: 'paid_plan_required',
          message: 'Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.',
        },
      }),
    }));

    await expect(synthesizeElevenLabsSpeech('Hello')).rejects.toThrow('Free ElevenLabs plans cannot use premade');
  });

  it('lists only custom app voices from the ElevenLabs account', async () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            voices: [
              { voice_id: 'F80m7ynQfU9Xf6NPSJdt', name: 'Trinity', description: 'Echoey and determined', category: 'premade' },
              { voice_id: MAYA_VOICE_ID, name: 'Maya', description: 'Custom', category: 'generated' },
              { voice_id: KNIGHT_VOICE_ID, name: 'Knight', description: 'Custom', category: 'generated' },
            ],
          }),
      }),
    );

    const voices = await listElevenLabsVoices();

    expect(voices.map((voice) => voice.name)).toEqual(['Knight', 'Maya', 'Ro']);
  });

  it('always keeps configured custom voices in the catalog', () => {
    const merged = mergeAppVoiceCatalog([
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm', category: 'premade' },
      { id: MAYA_VOICE_ID, name: 'Maya', description: 'From API', category: 'generated' },
    ]);

    expect(merged.map((voice) => voice.name)).toEqual(['Knight', 'Maya', 'Ro']);
    expect(merged.some((voice) => voice.name === 'Rachel')).toBe(false);
  });

  it('prefers Knight on free tier when a premade voice was saved', () => {
    const subscription: ElevenLabsSubscriptionInfo = {
      tier: 'free',
      characterCount: 100,
      characterLimit: 10000,
      remainingCharacters: 9900,
      isFreeTier: true,
    };

    const voices = [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Premade', category: 'premade' },
      { id: KNIGHT_VOICE_ID, name: 'Knight', description: 'Custom', category: 'generated' },
      { id: MAYA_VOICE_ID, name: 'Maya', description: 'Custom', category: 'generated' },
    ];

    expect(pickDefaultApiVoice(voices, subscription, '21m00Tcm4TlvDq8ikWAM')).toBe(KNIGHT_VOICE_ID);
  });

  it('filters to custom and generated voices on free tier', () => {
    const subscription: ElevenLabsSubscriptionInfo = {
      tier: 'free',
      characterCount: 100,
      characterLimit: 10000,
      remainingCharacters: 9900,
      isFreeTier: true,
    };

    const voices = [
      { id: 'premade-1', name: 'Rachel', description: 'Premade', category: 'premade' },
      { id: MAYA_VOICE_ID, name: 'Maya', description: 'Custom', category: 'generated' },
    ];

    expect(filterVoicesForApiAccess(voices, subscription).map((voice) => voice.id)).toEqual([MAYA_VOICE_ID]);
    expect(isVoiceAllowedOnFreeApi({ id: MAYA_VOICE_ID, category: 'generated' })).toBe(true);
    expect(isVoiceAllowedOnFreeApi({ id: KNIGHT_VOICE_ID, category: 'premade' })).toBe(true);
    expect(isFreeTierSubscription('free')).toBe(true);
    expect(pickDefaultApiVoice(voices, subscription, MAYA_VOICE_ID)).toBe(MAYA_VOICE_ID);
  });
});
