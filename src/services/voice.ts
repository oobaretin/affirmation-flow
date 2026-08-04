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

let activeUtterances = 0;
let unlimitedLoop = false;
let activeText: string | null = null;
let activeAudio: HTMLAudioElement | null = null;
let elevenLabsAbort: AbortController | null = null;
let playbackCancelled = false;
let keyboardInterruptActive = false;
let keyboardGuardInitialized = false;

function stopAudioPlayback() {
  playbackCancelled = true;
  elevenLabsAbort?.abort();
  elevenLabsAbort = null;

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
}

export function stopSpeaking() {
  unlimitedLoop = false;
  activeText = null;
  stopAudioPlayback();
  activeUtterances = 0;
}

export function getActiveSpeechText(): string | null {
  return activeText;
}

export function resumeSpeakingIfInterrupted(): void {
  if (playbackCancelled || !activeAudio || activeAudio.ended) return;

  if (!activeAudio.paused) return;

  void activeAudio.play().catch(() => {});
}

export function initVoiceKeyboardGuard(): void {
  if (keyboardGuardInitialized || !Capacitor.isNativePlatform()) return;
  keyboardGuardInitialized = true;

  void Keyboard.addListener('keyboardWillShow', () => {
    keyboardInterruptActive = true;
    window.setTimeout(() => resumeSpeakingIfInterrupted(), 50);
  });

  void Keyboard.addListener('keyboardDidShow', () => {
    window.setTimeout(() => resumeSpeakingIfInterrupted(), 100);
  });

  void Keyboard.addListener('keyboardWillHide', () => {
    keyboardInterruptActive = false;
  });
}

function attachKeyboardResumeHandler(audio: HTMLAudioElement): () => void {
  const handlePause = () => {
    if (playbackCancelled || audio.ended) return;
    if (!keyboardInterruptActive && document.activeElement?.tagName !== 'TEXTAREA') return;
    window.setTimeout(() => {
      if (playbackCancelled || activeAudio !== audio || audio.ended) return;
      if (audio.paused) {
        resumeSpeakingIfInterrupted();
      }
    }, 50);
  };

  audio.addEventListener('pause', handlePause);
  return () => audio.removeEventListener('pause', handlePause);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function playAudioUrl(url: string, volume: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    activeAudio = audio;
    audio.volume = volume;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');

    const detachPauseHandler = attachKeyboardResumeHandler(audio);

    const finish = () => {
      detachPauseHandler();
      if (activeAudio === audio) activeAudio = null;
    };

    audio.onended = () => {
      finish();
      resolve();
    };

    audio.onerror = () => {
      finish();
      if (playbackCancelled) {
        resolve();
        return;
      }
      reject(new Error('Audio playback failed on device'));
    };

    void audio.play().catch((error: unknown) => {
      finish();
      if (playbackCancelled) {
        resolve();
        return;
      }
      reject(error instanceof Error ? error : new Error('Audio play() rejected'));
    });
  });
}

async function speakAffirmationElevenLabs(
  text: string,
  repeatCount: number,
  onComplete?: () => void,
  unlimited = false,
  options: VoiceOptions = getVoiceOptions('soothing'),
): Promise<void> {
  stopSpeaking();
  unlimitedLoop = unlimited;
  activeText = text;
  playbackCancelled = false;
  elevenLabsAbort = new AbortController();

  let audioUrl: string | null = null;

  try {
    audioUrl = await synthesizeElevenLabsSpeech(
      text,
      options.elevenLabsVoiceId,
      elevenLabsAbort.signal,
    );

    const count = Math.max(1, Math.min(repeatCount, 108));

    if (unlimited) {
      while (unlimitedLoop && !playbackCancelled) {
        activeUtterances += 1;
        await playAudioUrl(audioUrl, options.volume);
        activeUtterances = Math.max(0, activeUtterances - 1);
        if (!unlimitedLoop || playbackCancelled) break;
        await sleep(options.pauseMs);
      }
    } else {
      for (let index = 0; index < count; index += 1) {
        if (playbackCancelled) break;

        activeUtterances += 1;
        await playAudioUrl(audioUrl, options.volume);
        activeUtterances = Math.max(0, activeUtterances - 1);

        if (playbackCancelled || index >= count - 1) break;
        await sleep(options.pauseMs);
      }
    }

    setLastPremiumVoiceError(null);
  } catch (error) {
    if (playbackCancelled) {
      return;
    }

    const message = error instanceof Error ? error.message : 'Premium voice failed';
    setLastPremiumVoiceError(message);
    throw error;
  } finally {
    if (audioUrl) revokeElevenLabsAudioUrl(audioUrl);
    elevenLabsAbort = null;
    activeUtterances = 0;
    activeText = null;
    if (!playbackCancelled) {
      onComplete?.();
    }
  }
}

export function previewVoice(text: string, options: VoiceOptions): Promise<void> {
  if (!isElevenLabsConfigured()) {
    return Promise.reject(new Error('Premium voice is not configured.'));
  }

  return speakAffirmationElevenLabs(text, 1, undefined, false, {
    ...options,
    useElevenLabs: true,
  }).catch((error) => {
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
): Promise<void> {
  if (!isElevenLabsConfigured()) {
    return Promise.reject(new Error('Premium voice is not configured.'));
  }

  return speakAffirmationElevenLabs(text, repeatCount, onComplete, unlimited, {
    ...options,
    useElevenLabs: true,
  }).catch((error) => {
    if (playbackCancelled) {
      return;
    }
    throw error;
  });
}

export function isSpeaking(): boolean {
  if (playbackCancelled) return false;
  if (activeAudio && !activeAudio.ended) {
    return !activeAudio.paused || keyboardInterruptActive;
  }
  return activeUtterances > 0 || Boolean(activeText && unlimitedLoop);
}

export { VOICE_PRESETS };
