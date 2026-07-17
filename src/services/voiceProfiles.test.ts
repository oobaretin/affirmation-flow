import { describe, expect, it } from 'vitest';
import {
  dedupeVoicesByBaseName,
  filterCalmClearVoices,
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
  it('prefers soothing english voices like Samantha', () => {
    const voices = [
      mockVoice('Alex'),
      mockVoice('Samantha'),
      mockVoice('Fred'),
    ];

    expect(pickSoothingVoice(voices)?.name).toBe('Samantha');
  });

  it('prefers en-US over other english voices', () => {
    const voices = [
      mockVoice('Serena', 'en-GB'),
      mockVoice('Karen', 'en-US'),
    ];

    expect(pickSoothingVoice(voices)?.name).toBe('Karen');
  });

  it('uses softer defaults for soothing preset', () => {
    const options = getVoiceOptions('soothing');
    expect(options.rate).toBeLessThan(VOICE_PRESETS.balanced.rate);
    expect(options.pitch).toBeLessThan(1);
    expect(options.pauseMs).toBeGreaterThan(VOICE_PRESETS.balanced.pauseMs);
    expect(options.volume).toBeLessThan(1);
  });

  it('scores enhanced female voices higher', () => {
    const soothing = scoreVoiceForSoothing(mockVoice('Samantha (Enhanced)'));
    const generic = scoreVoiceForSoothing(mockVoice('Alex'));
    expect(soothing).toBeGreaterThan(generic);
  });

  it('returns recommended voice from device list', () => {
    const voices = [mockVoice('Alex'), mockVoice('Samantha')];
    expect(getRecommendedVoice(voices)?.name).toBe('Samantha');
  });

  it('filters to calm clear voices only', () => {
    const voices = [
      mockVoice('Alex'),
      mockVoice('Samantha'),
      mockVoice('Karen'),
      mockVoice('Zarvox'),
      mockVoice('Marie', 'fr-FR'),
    ];

    const calm = filterCalmClearVoices(voices);
    expect(calm.map((voice) => voice.name)).toEqual(['Samantha', 'Karen']);
    expect(isCalmClearVoice(mockVoice('Alex'))).toBe(false);
    expect(isCalmClearVoice(mockVoice('Samantha'))).toBe(true);
  });

  it('dedupes duplicate voice names like multiple Karen variants', () => {
    const voices = [
      mockVoice('Karen'),
      mockVoice('Karen (Enhanced)'),
      mockVoice('Samantha (Premium)'),
      mockVoice('Samantha'),
    ];

    const calm = dedupeVoicesByBaseName(filterCalmClearVoices(voices));
    expect(calm.map((voice) => getVoiceBaseName(voice.name))).toEqual(['samantha', 'karen']);
    expect(calm[0].name).toBe('Samantha (Premium)');
    expect(calm[1].name).toBe('Karen (Enhanced)');
  });

  it('includes iOS compact voices like Samantha (Compact)', () => {
    const voices = [
      mockVoice('Karen'),
      mockVoice('Samantha (Compact)'),
      mockVoice('Nicky (Compact)'),
    ];

    const calm = filterCalmClearVoices(voices);
    expect(calm.map((voice) => getVoiceBaseName(voice.name))).toEqual([
      'samantha',
      'karen',
      'nicky',
    ]);
  });
});
