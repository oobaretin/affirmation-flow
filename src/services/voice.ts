import {
  getVoiceOptions,
  type VoiceOptions,
  VOICE_PRESETS,
} from './voiceProfiles';
import {
  isElevenLabsConfigured,
  revokeElevenLabsAudioUrl,
  setLastPremiumVoiceError,
  synthesizeElevenLabsSpeech,
} from './elevenLabs';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import {
  clearMediaSession,
  initMediaSessionHandlers,
  updateMediaSessionMetadata,
  updateMediaSessionPosition,
  updateMediaSessionState,
} from './mediaSession';
import { getTodayViewSession, getTodayVoiceSnapshot, setTodayVoiceSnapshot } from './todayViewSession';

export type SpeakProgress = {
  current: number;
  total: number;
  fraction?: number;
};

type SavedPlayback = {
  text: string;
  repeatCount: number;
  unlimited: boolean;
  options: VoiceOptions;
  onComplete?: () => void;
  onProgress?: (progress: SpeakProgress) => void;
};

let activeUtterances = 0;
let unlimitedLoop = false;
let activeText: string | null = null;
let activeAudio: HTMLAudioElement | null = null;
let persistentAudio: HTMLAudioElement | null = null;
let elevenLabsAbort: AbortController | null = null;
let playbackCancelled = false;
let keyboardInterruptActive = false;
let keyboardGuardInitialized = false;
let playbackGeneration = 0;
let cachedAudioUrl: string | null = null;
let cachedAudioText: string | null = null;
let savedPlayback: SavedPlayback | null = null;
let resumeInFlight = false;
let loopRunningGeneration: number | null = null;
let lastAudioProgressAt = 0;
let lastAudioCurrentTime = 0;
let pendingPlayRelease: (() => void) | null = null;
let audioContext: AudioContext | null = null;
let mediaElementSource: MediaElementAudioSourceNode | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let activeGainNode: GainNode | null = null;
let cachedAudioBuffer: AudioBuffer | null = null;
let cachedBufferText: string | null = null;
let nativePlaybackStartedAt = 0;
let nativePlaybackDurationMs = 0;
let nativePlaybackEndResolve: (() => void) | null = null;
let userPausedPlayback = false;
let mediaSessionBootstrapped = false;

function useNativeBufferPlayback(): boolean {
  // BufferSource playback is unreliable in iOS WKWebView.
  return false;
}

function useNativeMediaElementBoost(): boolean {
  return Capacitor.isNativePlatform();
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function wireMediaElementToAudioContext(audio: HTMLAudioElement): void {
  if (mediaElementSource || !useNativeMediaElementBoost()) return;
  const ctx = getAudioContext();
  mediaElementSource = ctx.createMediaElementSource(audio);
  mediaElementSource.connect(ctx.destination);
}

function stopNativeAudio(): void {
  if (activeBufferSource) {
    try {
      activeBufferSource.stop();
    } catch {
      // Already stopped
    }
    activeBufferSource.disconnect();
    activeBufferSource = null;
  }
  if (activeGainNode) {
    activeGainNode.disconnect();
    activeGainNode = null;
  }
  nativePlaybackStartedAt = 0;
  nativePlaybackDurationMs = 0;
  nativePlaybackEndResolve?.();
  nativePlaybackEndResolve = null;
}

function isActiveGeneration(generation: number): boolean {
  return generation === playbackGeneration && !playbackCancelled;
}

function getPersistentAudio(): HTMLAudioElement {
  if (!persistentAudio) {
    persistentAudio = document.createElement('audio');
    persistentAudio.setAttribute('playsinline', 'true');
    persistentAudio.setAttribute('webkit-playsinline', 'true');
    persistentAudio.preload = 'auto';
    persistentAudio.style.display = 'none';
    document.body.appendChild(persistentAudio);
  }
  return persistentAudio;
}

function releasePendingPlay(): void {
  pendingPlayRelease?.();
  pendingPlayRelease = null;
}

function stopAllAudioElements(): void {
  const audio = persistentAudio;
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.ontimeupdate = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  activeAudio = null;
  lastAudioProgressAt = 0;
  lastAudioCurrentTime = 0;
  stopNativeAudio();
  releasePendingPlay();
}

function forceRestartPlayback(): number {
  const generation = invalidatePlaybackGeneration();
  playbackCancelled = false;
  stopAllAudioElements();
  loopRunningGeneration = null;
  resumeInFlight = false;
  if (savedPlayback) {
    activeText = savedPlayback.text;
    unlimitedLoop = savedPlayback.unlimited;
  }
  return generation;
}

function markAudioProgress(audio: HTMLAudioElement): void {
  const currentTime = audio.currentTime;
  if (currentTime > lastAudioCurrentTime + 0.005) {
    lastAudioCurrentTime = currentTime;
    lastAudioProgressAt = Date.now();
  }
}

function isPlaybackStalled(): boolean {
  if (useNativeBufferPlayback() && activeBufferSource) {
    const ctx = audioContext;
    if (ctx?.state === 'suspended') return true;
    if (nativePlaybackDurationMs > 0) {
      return Date.now() - nativePlaybackStartedAt > nativePlaybackDurationMs + 800;
    }
    return false;
  }

  if (!activeAudio || activeAudio.ended) return true;
  markAudioProgress(activeAudio);
  if (activeAudio.paused) {
    if (lastAudioProgressAt === 0) return false;
    return Date.now() - lastAudioProgressAt > 400;
  }
  if (lastAudioProgressAt === 0) return false;
  return Date.now() - lastAudioProgressAt > 750;
}

function clearCachedAudio(): void {
  if (cachedAudioUrl) {
    revokeElevenLabsAudioUrl(cachedAudioUrl);
    cachedAudioUrl = null;
    cachedAudioText = null;
  }
  cachedAudioBuffer = null;
  cachedBufferText = null;
}

function stopAudioPlayback(): void {
  playbackCancelled = true;
  elevenLabsAbort?.abort();
  elevenLabsAbort = null;
  stopAllAudioElements();
}

function invalidatePlaybackGeneration(): number {
  playbackGeneration += 1;
  playbackCancelled = false;
  return playbackGeneration;
}

function beginNewPlaybackSession(): number {
  invalidatePlaybackGeneration();
  elevenLabsAbort?.abort();
  elevenLabsAbort = null;
  stopAllAudioElements();
  loopRunningGeneration = null;
  resumeInFlight = false;
  activeUtterances = 0;
  playbackCancelled = false;
  return playbackGeneration;
}

function snapshotToSavedPlayback(
  snapshot: NonNullable<ReturnType<typeof getTodayVoiceSnapshot>>,
): SavedPlayback {
  return {
    text: snapshot.text,
    repeatCount: snapshot.repeatCount,
    unlimited: snapshot.unlimited,
    options: {
      ...getVoiceOptions('soothing'),
      volume: snapshot.volume,
      pauseMs: snapshot.pauseMs,
      elevenLabsVoiceId: snapshot.elevenLabsVoiceId,
      useElevenLabs: true,
    },
  };
}

function rehydrateSavedPlaybackFromSession(): boolean {
  const session = getTodayViewSession();
  const snapshot = getTodayVoiceSnapshot();
  if (!session.voicePracticeActive || !snapshot || savedPlayback) return false;

  savedPlayback = snapshotToSavedPlayback(snapshot);
  activeText = snapshot.text;
  unlimitedLoop = snapshot.unlimited;
  playbackCancelled = false;
  return true;
}

export function stopSpeaking(): void {
  invalidatePlaybackGeneration();
  unlimitedLoop = false;
  activeText = null;
  savedPlayback = null;
  resumeInFlight = false;
  loopRunningGeneration = null;
  userPausedPlayback = false;
  setTodayVoiceSnapshot(null);
  stopAudioPlayback();
  clearCachedAudio();
  activeUtterances = 0;
  clearMediaSession();
}

export function pauseSpeaking(): void {
  if (!activeAudio || activeAudio.paused) return;
  userPausedPlayback = true;
  activeAudio.pause();
  updateMediaSessionState('paused');
}

export function resumeSpeaking(): void {
  if (!savedPlayback && !activeText) return;
  userPausedPlayback = false;
  if (activeAudio && activeAudio.paused && !activeAudio.ended) {
    void activeAudio.play().then(() => {
      updateMediaSessionState('playing');
    }).catch(() => {
      ensurePlaybackContinues();
    });
    return;
  }
  ensurePlaybackContinues();
  updateMediaSessionState('playing');
}

export function isPlaybackPaused(): boolean {
  return userPausedPlayback;
}

export function getActiveSpeechText(): string | null {
  return activeText;
}

export function resumeSpeakingIfInterrupted(): void {
  if (userPausedPlayback) return;
  if (useNativeMediaElementBoost() && audioContext?.state === 'suspended') {
    void audioContext.resume();
  }

  if (playbackCancelled || !activeAudio || activeAudio.ended) return;
  if (!activeAudio.paused) return;

  void activeAudio.play().catch(() => {});
}

function schedulePlaybackLoop(generation: number): void {
  resumeInFlight = true;
  void restartPlaybackLoop(generation)
    .catch(() => {})
    .finally(() => {
      if (playbackGeneration === generation) {
        resumeInFlight = false;
      }
    });
}

async function restartPlaybackLoop(generation: number): Promise<void> {
  if (!savedPlayback || !isActiveGeneration(generation)) return;

  loopRunningGeneration = generation;
  const { text, repeatCount, unlimited, options, onComplete, onProgress } = savedPlayback;
  activeText = text;
  unlimitedLoop = unlimited;
  playbackCancelled = false;

  let audioUrl = cachedAudioUrl;
  if (!audioUrl || cachedAudioText !== text) {
    elevenLabsAbort = new AbortController();
    try {
      audioUrl = await synthesizeElevenLabsSpeech(
        text,
        options.elevenLabsVoiceId,
        elevenLabsAbort.signal,
      );
      if (!isActiveGeneration(generation)) return;
      clearCachedAudio();
      cachedAudioUrl = audioUrl;
      cachedAudioText = text;
    } catch (error) {
      if (!isActiveGeneration(generation)) return;
      if (playbackCancelled) return;
      const message = error instanceof Error ? error.message : 'Premium voice failed';
      setLastPremiumVoiceError(message);
      throw error;
    } finally {
      elevenLabsAbort = null;
    }
  }

  if (!isActiveGeneration(generation) || !audioUrl) return;

  const count = Math.max(1, Math.min(repeatCount, 108));

  try {
    if (unlimited) {
      let loopIndex = 0;
      while (unlimitedLoop && isActiveGeneration(generation)) {
        loopIndex += 1;
        onProgress?.({ current: loopIndex, total: 0, fraction: 0 });
        updateMediaSessionMetadata(text, `Loop ${loopIndex}`);
        updateMediaSessionState('playing');
        activeUtterances += 1;
        await playAudioUrl(audioUrl, options.volume, generation, (fraction) => {
          onProgress?.({ current: loopIndex, total: 0, fraction });
        });
        activeUtterances = Math.max(0, activeUtterances - 1);
        if (!unlimitedLoop || !isActiveGeneration(generation)) break;
        await sleep(options.pauseMs, generation);
      }
    } else {
      for (let index = 0; index < count; index += 1) {
        if (!isActiveGeneration(generation)) break;

        onProgress?.({ current: index + 1, total: count, fraction: 0 });
        updateMediaSessionMetadata(text, `${index + 1} of ${count}`);
        updateMediaSessionState('playing');
        activeUtterances += 1;
        await playAudioUrl(audioUrl, options.volume, generation, (fraction) => {
          onProgress?.({ current: index + 1, total: count, fraction });
        });
        activeUtterances = Math.max(0, activeUtterances - 1);

        if (!isActiveGeneration(generation) || index >= count - 1) break;
        await sleep(options.pauseMs, generation);
      }
    }

    if (!isActiveGeneration(generation) || playbackCancelled) return;

    setLastPremiumVoiceError(null);
    activeText = null;
    savedPlayback = null;
    setTodayVoiceSnapshot(null);
    clearCachedAudio();
    clearMediaSession();
    onComplete?.();
  } catch (error) {
    if (!isActiveGeneration(generation) || playbackCancelled) return;
    const message = error instanceof Error ? error.message : 'Premium voice failed';
    setLastPremiumVoiceError(message);
    throw error;
  } finally {
    if (loopRunningGeneration === generation) {
      loopRunningGeneration = null;
    }
    if (!isActiveGeneration(generation)) return;
    activeUtterances = 0;
  }
}

export function ensurePlaybackContinues(): void {
  if (userPausedPlayback) return;
  rehydrateSavedPlaybackFromSession();

  const session = getTodayViewSession();
  const shouldKeepPlaying = Boolean(
    savedPlayback && (session.voicePracticeActive || activeText),
  );
  const stalled = isPlaybackStalled();

  if (activeAudio && !activeAudio.ended && !stalled) {
    if (activeAudio.paused) {
      resumeSpeakingIfInterrupted();
    }
    return;
  }

  if (useNativeBufferPlayback() && activeBufferSource && !stalled) {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    return;
  }

  // The repeat loop owns gaps between utterances; don't restart from zero mid-session.
  if (loopRunningGeneration !== null) {
    if (activeAudio && !activeAudio.ended && activeAudio.paused) {
      resumeSpeakingIfInterrupted();
    }
    return;
  }

  if (!shouldKeepPlaying) return;

  if (stalled || !activeAudio || activeAudio.ended) {
    stopAllAudioElements();
  }

  if (resumeInFlight && !stalled && (activeAudio || activeBufferSource)) return;
  if (!savedPlayback) return;

  const generation = forceRestartPlayback();

  schedulePlaybackLoop(generation);
}

export function initVoiceKeyboardGuard(): void {
  if (keyboardGuardInitialized || !Capacitor.isNativePlatform()) return;
  keyboardGuardInitialized = true;

  void Keyboard.addListener('keyboardWillShow', () => {
    keyboardInterruptActive = true;
    window.setTimeout(() => ensurePlaybackContinues(), 50);
    window.setTimeout(() => ensurePlaybackContinues(), 350);
    window.setTimeout(() => ensurePlaybackContinues(), 800);
  });

  void Keyboard.addListener('keyboardDidShow', () => {
    window.setTimeout(() => ensurePlaybackContinues(), 100);
    window.setTimeout(() => ensurePlaybackContinues(), 500);
  });

  void Keyboard.addListener('keyboardDidHide', () => {
    keyboardInterruptActive = false;
    window.setTimeout(() => ensurePlaybackContinues(), 100);
  });
}

export function initPersistentVoiceAudio(): void {
  const audio = getPersistentAudio();
  if (useNativeMediaElementBoost()) {
    wireMediaElementToAudioContext(audio);
  }
}

export function initVoicePlaybackGuard(): void {
  if (typeof document === 'undefined') return;

  if (!mediaSessionBootstrapped) {
    mediaSessionBootstrapped = true;
    initMediaSessionHandlers({
      onPlay: () => resumeSpeaking(),
      onPause: () => pauseSpeaking(),
      onStop: () => stopSpeaking(),
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      ensurePlaybackContinues();
    }
  });
}

function attachPlaybackResumeHandler(audio: HTMLAudioElement, generation: number): () => void {
  const handlePause = () => {
    if (!isActiveGeneration(generation) || audio.ended || userPausedPlayback) return;
    window.setTimeout(() => {
      if (!isActiveGeneration(generation) || activeAudio !== audio || audio.ended) return;
      if (userPausedPlayback) return;
      if (audio.paused) resumeSpeakingIfInterrupted();
    }, 50);
  };

  audio.addEventListener('pause', handlePause);
  return () => audio.removeEventListener('pause', handlePause);
}

function sleep(ms: number, generation: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, isActiveGeneration(generation) ? ms : 0);
  });
}

async function decodeAudioBuffer(url: string, text: string): Promise<AudioBuffer> {
  if (cachedAudioBuffer && cachedBufferText === text) {
    return cachedAudioBuffer;
  }

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
  cachedAudioBuffer = buffer;
  cachedBufferText = text;
  return buffer;
}

function playAudioUrlNative(url: string, volume: number, generation: number): Promise<void> {
  return new Promise((resolve) => {
    if (!isActiveGeneration(generation)) {
      resolve();
      return;
    }

    stopAllAudioElements();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      stopNativeAudio();
      resolve();
    };

    nativePlaybackEndResolve = finish;

    const generationWatch = window.setInterval(() => {
      if (!isActiveGeneration(generation)) {
        window.clearInterval(generationWatch);
        finish();
      }
    }, 200);

    void (async () => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const text = savedPlayback?.text ?? cachedAudioText ?? '';
        const buffer = await decodeAudioBuffer(url, text);
        if (!isActiveGeneration(generation) || settled) {
          window.clearInterval(generationWatch);
          finish();
          return;
        }

        stopNativeAudio();

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(ctx.destination);

        activeBufferSource = source;
        activeGainNode = gain;
        nativePlaybackStartedAt = Date.now();
        nativePlaybackDurationMs = buffer.duration * 1000;
        lastAudioProgressAt = Date.now();

        source.onended = () => {
          window.clearInterval(generationWatch);
          finish();
        };

        source.start(0);
      } catch (error) {
        window.clearInterval(generationWatch);
        if (isActiveGeneration(generation)) {
          window.setTimeout(() => ensurePlaybackContinues(), 50);
        }
      }
    })();
  });
}

function playAudioUrl(
  url: string,
  volume: number,
  generation: number,
  onFraction?: (fraction: number) => void,
): Promise<void> {
  if (useNativeBufferPlayback()) {
    return playAudioUrlNative(url, volume, generation);
  }

  return new Promise((resolve) => {
    if (!isActiveGeneration(generation)) {
      resolve();
      return;
    }

    stopAllAudioElements();
    userPausedPlayback = false;

    const audio = getPersistentAudio();
    wireMediaElementToAudioContext(audio);
    activeAudio = audio;
    audio.volume = volume;

    void getAudioContext().resume().catch(() => {});

    const detachPauseHandler = attachPlaybackResumeHandler(audio, generation);
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      detachPauseHandler();
      audio.ontimeupdate = null;
      if (activeAudio === audio) activeAudio = null;
      if (pendingPlayRelease === releasePlay) pendingPlayRelease = null;
      resolve();
    };

    const releasePlay = finish;
    pendingPlayRelease = releasePlay;

    const generationWatch = window.setInterval(() => {
      if (!isActiveGeneration(generation)) {
        window.clearInterval(generationWatch);
        finish();
      }
    }, 200);

    const finishAndClearWatch = () => {
      window.clearInterval(generationWatch);
      finish();
    };

    audio.onended = () => {
      onFraction?.(1);
      finishAndClearWatch();
    };

    audio.onerror = () => {
      if (isActiveGeneration(generation)) {
        window.setTimeout(() => ensurePlaybackContinues(), 50);
      }
    };

    audio.ontimeupdate = () => {
      markAudioProgress(audio);
      const duration = audio.duration;
      if (Number.isFinite(duration) && duration > 0) {
        const fraction = Math.min(1, Math.max(0, audio.currentTime / duration));
        onFraction?.(fraction);
        updateMediaSessionPosition(audio.currentTime, duration);
      }
    };

    audio.src = url;
    audio.load();
    lastAudioProgressAt = Date.now();
    lastAudioCurrentTime = 0;

    const attemptPlay = (attempt: number) => {
      if (!isActiveGeneration(generation) || settled) {
        finishAndClearWatch();
        return;
      }

      void audio.play().then(() => {
        lastAudioProgressAt = Date.now();
        updateMediaSessionState('playing');
      }).catch(() => {
        if (!isActiveGeneration(generation) || settled) {
          finishAndClearWatch();
          return;
        }
        if (attempt >= 6) {
          window.setTimeout(() => ensurePlaybackContinues(), 50);
          return;
        }
        window.setTimeout(() => attemptPlay(attempt + 1), 120 * attempt);
      });
    };

    attemptPlay(1);
  });
}

async function speakAffirmationElevenLabs(
  text: string,
  repeatCount: number,
  onComplete?: () => void,
  unlimited = false,
  options: VoiceOptions = getVoiceOptions('soothing'),
  persistSession = true,
  onProgress?: (progress: SpeakProgress) => void,
): Promise<void> {
  if (cachedAudioText !== text) {
    clearCachedAudio();
  }

  const generation = beginNewPlaybackSession();
  activeText = text;
  unlimitedLoop = unlimited;
  savedPlayback = { text, repeatCount, unlimited, options, onComplete, onProgress };
  if (persistSession) {
    setTodayVoiceSnapshot({
      text,
      repeatCount,
      unlimited,
      elevenLabsVoiceId: options.elevenLabsVoiceId ?? getVoiceOptions('soothing').elevenLabsVoiceId!,
      volume: options.volume,
      pauseMs: options.pauseMs,
    });
  }

  await restartPlaybackLoop(generation);
}

export function previewVoice(text: string, options: VoiceOptions): Promise<void> {
  if (!isElevenLabsConfigured()) {
    return Promise.reject(new Error('Premium voice is not configured.'));
  }

  return speakAffirmationElevenLabs(text, 1, undefined, false, {
    ...options,
    useElevenLabs: true,
  }, false).catch((error) => {
    if (playbackCancelled) {
      return;
    }
    throw error;
  });
}

export function speakAffirmation(
  text: string,
  repeatCount: number,
  onComplete?: () => void,
  unlimited = false,
  options: VoiceOptions = getVoiceOptions('soothing'),
  onProgress?: (progress: SpeakProgress) => void,
): Promise<void> {
  if (!isElevenLabsConfigured()) {
    return Promise.reject(new Error('Premium voice is not configured.'));
  }

  return speakAffirmationElevenLabs(
    text,
    repeatCount,
    onComplete,
    unlimited,
    {
      ...options,
      useElevenLabs: true,
    },
    true,
    onProgress,
  ).catch((error) => {
    if (playbackCancelled) {
      return;
    }
    throw error;
  });
}

export function isSpeaking(): boolean {
  if (playbackCancelled) return false;
  if (activeBufferSource) return true;
  if (activeText) {
    if (activeAudio && !activeAudio.ended) return true;
    return activeUtterances > 0 || unlimitedLoop || resumeInFlight;
  }
  return false;
}

export { VOICE_PRESETS };
