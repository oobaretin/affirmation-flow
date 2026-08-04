import { describe, expect, it } from 'vitest';
import { getTodayPracticeHint } from '../types/settings';

describe('getTodayPracticeHint', () => {
  it('returns null when voice is on (listen-only mode)', () => {
    expect(getTodayPracticeHint(true, 'fixed', 3)).toBeNull();
    expect(getTodayPracticeHint(true, 'unlimited', 3)).toBeNull();
  });

  it('guides silent mantra practice when voice is off', () => {
    expect(getTodayPracticeHint(false, 'fixed', 3)).toBe('Repeat to yourself 3x');
    expect(getTodayPracticeHint(false, 'unlimited', 3)).toBe('Repeat at your own pace');
  });
});
