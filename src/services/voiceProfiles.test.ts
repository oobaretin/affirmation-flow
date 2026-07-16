import { describe, expect, it } from 'vitest';
import { pickSoothingVoice, scoreVoiceForSoothing } from './voiceProfiles';

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

  it('scores enhanced female voices higher', () => {
    const soothing = scoreVoiceForSoothing(mockVoice('Samantha'));
    const generic = scoreVoiceForSoothing(mockVoice('Alex'));
    expect(soothing).toBeGreaterThan(generic);
  });
});
