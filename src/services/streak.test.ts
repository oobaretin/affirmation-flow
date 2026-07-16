import { describe, expect, it, beforeEach } from 'vitest';
import { getStreak, recordPractice } from './streak';

describe('practice streak', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts a streak on first practice', () => {
    const result = recordPractice();
    expect(result.currentStreak).toBe(1);
    expect(getStreak()).toBe(1);
  });

  it('does not increment streak twice on same day', () => {
    recordPractice();
    const second = recordPractice();
    expect(second.currentStreak).toBe(1);
    expect(second.isNewDay).toBe(false);
  });
});
