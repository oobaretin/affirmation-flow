import { describe, expect, it } from 'vitest';
import { getTodayPracticeHint } from '../types/settings';

describe('getTodayPracticeHint', () => {
  it('guides voice playback repeat count', () => {
    expect(getTodayPracticeHint(true, 'fixed', 3)).toBe('Plays 3x');
    expect(getTodayPracticeHint(true, 'unlimited', 3)).toBe('Playing on loop');
    expect(getTodayPracticeHint(true, 'fixed', 3, { current: 2, total: 3 })).toBe(
      'Playing 2 of 3',
    );
  });

  it('guides silent mantra practice when voice is off', () => {
    expect(getTodayPracticeHint(false, 'fixed', 3)).toBe('Repeat to yourself 3x');
    expect(getTodayPracticeHint(false, 'unlimited', 3)).toBe('Repeat at your own pace');
  });
});
