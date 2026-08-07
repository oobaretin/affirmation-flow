/** Survives Ionic tab remounts so Today practice UI state is not lost mid-session. */
export type VoicePlaybackSnapshot = {
  text: string;
  repeatCount: number;
  unlimited: boolean;
  elevenLabsVoiceId: string;
  volume: number;
  pauseMs: number;
};

export type TodayViewSession = {
  initialized: boolean;
  awaitingPlay: boolean;
  voicePracticeActive: boolean;
  affirmationId: string | null;
  voiceSnapshot: VoicePlaybackSnapshot | null;
};

const todayViewSession: TodayViewSession = {
  initialized: false,
  awaitingPlay: true,
  voicePracticeActive: false,
  affirmationId: null,
  voiceSnapshot: null,
};

const voicePracticeListeners = new Set<() => void>();

function emitVoicePracticeChange(): void {
  voicePracticeListeners.forEach((listener) => listener());
}

export function getTodayViewSession(): TodayViewSession {
  return todayViewSession;
}

export function isTodayVoicePracticeActive(): boolean {
  return todayViewSession.voicePracticeActive;
}

export function subscribeTodayVoicePractice(listener: () => void): () => void {
  voicePracticeListeners.add(listener);
  return () => voicePracticeListeners.delete(listener);
}

export function resetTodayViewSession(): void {
  todayViewSession.initialized = false;
  todayViewSession.awaitingPlay = true;
  todayViewSession.voicePracticeActive = false;
  todayViewSession.affirmationId = null;
  todayViewSession.voiceSnapshot = null;
  emitVoicePracticeChange();
}

export function markTodayPracticeStarted(affirmationId: string): void {
  todayViewSession.awaitingPlay = false;
  todayViewSession.affirmationId = affirmationId;
}

export function markTodayAwaitingPlay(affirmationId: string): void {
  todayViewSession.awaitingPlay = true;
  todayViewSession.voicePracticeActive = false;
  todayViewSession.affirmationId = affirmationId;
  emitVoicePracticeChange();
}

export function setTodayVoicePracticeActive(active: boolean): void {
  if (todayViewSession.voicePracticeActive === active) return;
  todayViewSession.voicePracticeActive = active;
  emitVoicePracticeChange();
}

export function setTodayVoiceSnapshot(snapshot: VoicePlaybackSnapshot | null): void {
  todayViewSession.voiceSnapshot = snapshot;
}

export function getTodayVoiceSnapshot(): VoicePlaybackSnapshot | null {
  return todayViewSession.voiceSnapshot;
}
