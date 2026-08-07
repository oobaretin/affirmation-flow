import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  getTodayViewSession,
  markTodayPracticeStarted,
  resetTodayViewSession,
  setTodayVoicePracticeActive,
  subscribeTodayVoicePractice,
} from './todayViewSession';

describe('todayViewSession', () => {
  beforeEach(() => {
    resetTodayViewSession();
  });

  it('keeps practice started across remount-style resets', () => {
    markTodayPracticeStarted('aff-1');
    setTodayVoicePracticeActive(true);

    const session = getTodayViewSession();
    expect(session.awaitingPlay).toBe(false);
    expect(session.voicePracticeActive).toBe(true);
    expect(session.affirmationId).toBe('aff-1');
  });

  it('notifies subscribers when voice practice active changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTodayVoicePractice(listener);

    setTodayVoicePracticeActive(true);
    expect(listener).toHaveBeenCalledTimes(1);

    setTodayVoicePracticeActive(true);
    expect(listener).toHaveBeenCalledTimes(1);

    setTodayVoicePracticeActive(false);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setTodayVoicePracticeActive(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
