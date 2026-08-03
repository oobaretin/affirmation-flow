import { describe, expect, it, vi } from 'vitest';
import {
  buildVoiceOptions,
  dedupeVoicesByBaseName,
  filterCalmClearVoices,
  filterDeviceVoicesForPicker,
  getRecommendedVoice,
  getVoiceOptions,
  getVoiceBaseName,
  isCalmClearVoice,
  pickSoothingVoice,
  scoreVoiceForSoothing,
  VOICE_PRESETS,
} from './voiceProfiles';

function mockVoice(name: string, lang = 'en-US', localService = true): SpeechSynthesisVoice {
  return {
    name,
    lang,
    localService,
    default: false,
    voiceURI: `mock://${name}`,
  } as SpeechSynthesisVoice;
}

describe('voiceProfiles', () => {
  it('uses Karen as the free device voice', () => {
    const voices = [
      mockVoice('Alex'),
      mockVoice('Samantha'),
      mockVoice('Karen'),
      mockVoice('Fred'),
    ];

    expect(pickSoothingVoice(voices)?.name).toBe('Karen');
  });

  it('prefers Karen (Enhanced) over plain Karen', () => {
    const voices = [
      mockVoice('Karen'),
      mockVoice('Karen (Enhanced)'),
    ];

    expect(pickSoothingVoice(voices)?.name).toBe('Karen (Enhanced)');
  });

  it('uses softer defaults for soothing preset', () => {
    const options = getVoiceOptions('soothing');
    expect(options.rate).toBeLessThan(VOICE_PRESETS.balanced.rate);
    expect(options.pitch).toBeLessThan(1);
    expect(options.pauseMs).toBeGreaterThan(VOICE_PRESETS.balanced.pauseMs);
    expect(options.volume).toBeLessThan(1);
  });

  it('scores enhanced Karen higher than plain Karen', () => {
    const enhanced = scoreVoiceForSoothing(mockVoice('Karen (Enhanced)'));
    const plain = scoreVoiceForSoothing(mockVoice('Karen'));
    expect(enhanced).toBeGreaterThan(plain);
  });

  it('returns Karen as recommended free device voice', () => {
    const voices = [mockVoice('Alex'), mockVoice('Karen'), mockVoice('Samantha')];
    expect(getRecommendedVoice(voices)?.name).toBe('Karen');
  });

  it('allows only Karen in the free voice allowlist', () => {
    const voices = [
      mockVoice('Alex'),
      mockVoice('Samantha'),
      mockVoice('Karen'),
      mockVoice('Moira', 'en-IE'),
      mockVoice('Zarvox'),
      mockVoice('Marie', 'fr-FR'),
    ];

    const calm = filterCalmClearVoices(voices);
    expect(calm.map((voice) => voice.name)).toEqual(['Karen']);
    expect(isCalmClearVoice(mockVoice('Alex'))).toBe(false);
    expect(isCalmClearVoice(mockVoice('Samantha'))).toBe(false);
    expect(isCalmClearVoice(mockVoice('Moira'))).toBe(false);
    expect(isCalmClearVoice(mockVoice('Karen'))).toBe(true);
  });

  it('dedupes duplicate Karen variants', () => {
    const voices = [
      mockVoice('Karen'),
      mockVoice('Karen (Enhanced)'),
      mockVoice('Samantha'),
    ];

    const deduped = dedupeVoicesByBaseName(voices.filter(isCalmClearVoice));
    expect(deduped).toHaveLength(1);
    expect(deduped[0].name).toBe('Karen (Enhanced)');

    const calm = filterCalmClearVoices(voices);
    expect(calm.map((voice) => getVoiceBaseName(voice.name))).toEqual(['karen']);
  });

  it('shows only Karen in the device voice picker', () => {
    const voices = [
      mockVoice('Samantha'),
      mockVoice('Fiona', 'en-GB'),
      mockVoice('Moira', 'en-IE'),
      mockVoice('Karen'),
      mockVoice('Zarvox'),
    ];

    const picker = filterDeviceVoicesForPicker(voices);
    expect(picker.map((voice) => getVoiceBaseName(voice.name))).toEqual(['karen']);
  });

  it('excludes funny and non-allowlisted voices from picker', () => {
    const voices = [
      mockVoice('Karen'),
      mockVoice('Boing'),
      mockVoice('Serena', 'en-GB'),
    ];

    const picker = filterDeviceVoicesForPicker(voices);
    expect(picker.map((voice) => getVoiceBaseName(voice.name))).toEqual(['karen']);
  });

  it('enables ElevenLabs in voice options when configured', () => {
    vi.stubEnv('VITE_ELEVENLABS_API_KEY', 'test-key');
    const options = buildVoiceOptions({
      voiceStyle: 'soothing',
      voiceURI: '',
      voiceProvider: 'elevenlabs',
      elevenLabsVoiceId: 'voice-123',
    });
    expect(options.useElevenLabs).toBe(true);
    expect(options.elevenLabsVoiceId).toBe('voice-123');
    vi.unstubAllEnvs();
  });
});
