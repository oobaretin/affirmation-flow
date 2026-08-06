/** Survives Ionic tab remounts so Today practice UI state is not lost mid-session. */
export type TodayViewSession = {
  initialized: boolean;
  awaitingPlay: boolean;
  voicePracticeActive: boolean;
  affirmationId: string | null;
};

const todayViewSession: TodayViewSession = {
  initialized: false,
  awaitingPlay: true,
  voicePracticeActive: false,
  affirmationId: null,
};

export function getTodayViewSession(): TodayViewSession {
  return todayViewSession;
}

export function resetTodayViewSession(): void {
  todayViewSession.initialized = false;
  todayViewSession.awaitingPlay = true;
  todayViewSession.voicePracticeActive = false;
  todayViewSession.affirmationId = null;
}

export function markTodayPracticeStarted(affirmationId: string): void {
  todayViewSession.awaitingPlay = false;
  todayViewSession.affirmationId = affirmationId;
}

export function markTodayAwaitingPlay(affirmationId: string): void {
  todayViewSession.awaitingPlay = true;
  todayViewSession.voicePracticeActive = false;
  todayViewSession.affirmationId = affirmationId;
}

export function setTodayVoicePracticeActive(active: boolean): void {
  todayViewSession.voicePracticeActive = active;
}
