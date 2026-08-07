import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { getStreak, getWeekPracticeHistory, recordPractice } from './streak';

describe('practice streak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-06T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('uses a freeze after missing one day', () => {
    recordPractice();
    vi.setSystemTime(new Date('2026-08-08T12:00:00Z'));
    const result = recordPractice();
    expect(result.freezeUsed).toBe(true);
    expect(result.currentStreak).toBe(2);
    expect(getStreak()).toBe(2);
  });

  it('tracks a week of practice history', () => {
    recordPractice();
    const week = getWeekPracticeHistory();
    expect(week).toHaveLength(7);
    expect(week[6].practiced).toBe(true);
    expect(week[6].isToday).toBe(true);
  });
});
