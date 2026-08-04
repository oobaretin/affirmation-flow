import { describe, expect, it, beforeEach } from 'vitest';
import {
  getTodayViewSession,
  markTodayPracticeStarted,
  resetTodayViewSession,
  setTodayVoicePracticeActive,
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
});
