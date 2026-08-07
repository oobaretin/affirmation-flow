import { APP_NAME } from '../constants/app';

export type SpeakProgress = {
  current: number;
  total: number;
  /** 0–1 progress within the current utterance, when available. */
  fraction?: number;
};

type MediaSessionPlaybackState = 'none' | 'paused' | 'playing';

let mediaSessionReady = false;

function canUseMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function initMediaSessionHandlers(handlers: {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}): void {
  if (!canUseMediaSession() || mediaSessionReady) return;
  mediaSessionReady = true;

  try {
    navigator.mediaSession.setActionHandler('play', () => handlers.onPlay());
    navigator.mediaSession.setActionHandler('pause', () => handlers.onPause());
    navigator.mediaSession.setActionHandler('stop', () => handlers.onStop());
  } catch {
    // Action handlers unavailable on this platform
  }
}

export function updateMediaSessionMetadata(text: string, subtitle?: string): void {
  if (!canUseMediaSession()) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: text.length > 80 ? `${text.slice(0, 77)}…` : text,
      artist: APP_NAME,
      album: subtitle || 'Daily affirmation',
    });
  } catch {
    // MediaMetadata unavailable
  }
}

export function updateMediaSessionState(state: MediaSessionPlaybackState): void {
  if (!canUseMediaSession()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // playbackState unavailable
  }
}

export function updateMediaSessionPosition(
  positionSec: number,
  durationSec: number,
): void {
  if (!canUseMediaSession() || !durationSec || !Number.isFinite(durationSec)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: durationSec,
      position: Math.min(Math.max(positionSec, 0), durationSec),
      playbackRate: 1,
    });
  } catch {
    // setPositionState unavailable
  }
}

export function clearMediaSession(): void {
  if (!canUseMediaSession()) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  } catch {
    // clear unavailable
  }
}
