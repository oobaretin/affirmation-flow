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

let activeUtterances = 0;
let unlimitedLoop = false;
let activeText: string | null = null;
let activeAudio: HTMLAudioElement | null = null;
let elevenLabsAbort: AbortController | null = null;
let playbackCancelled = false;

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

    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
      resolve();
    };

    audio.onerror = () => {
      if (activeAudio === audio) activeAudio = null;
      if (playbackCancelled) {
        resolve();
        return;
      }
      reject(new Error('Audio playback failed on device'));
    };

    void audio.play().catch((error: unknown) => {
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
  return activeAudio != null && !activeAudio.paused && !activeAudio.ended;
}

export { VOICE_PRESETS };
