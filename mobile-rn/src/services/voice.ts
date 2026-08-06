import { Audio } from 'expo-av';
import {
  isElevenLabsConfigured,
  revokeElevenLabsAudioUrl,
  synthesizeElevenLabsSpeech,
} from './elevenLabs';
import type { VoiceOptions } from './voiceProfiles';

let activeSound: Audio.Sound | null = null;
let unlimitedLoop = false;
let playbackCancelled = false;
let activeText: string | null = null;
let abortController: AbortController | null = null;

async function unloadActiveSound(): Promise<void> {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    // Sound may already be unloaded
  }
  activeSound = null;
}

export function stopSpeaking(): void {
  playbackCancelled = true;
  unlimitedLoop = false;
  activeText = null;
  abortController?.abort();
  abortController = null;
  void unloadActiveSound();
}

export function getActiveSpeechText(): string | null {
  return activeText;
}

export function isSpeaking(): boolean {
  return Boolean(activeSound) && !playbackCancelled;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function playAudioUri(uri: string, volume: number): Promise<void> {
  await unloadActiveSound();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync({ uri }, { volume, shouldPlay: true });
  activeSound = sound;

  await new Promise<void>((resolve, reject) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        resolve();
      }
    });
  });

  await unloadActiveSound();
}

export async function speakAffirmation(
  text: string,
  repeatCount: number,
  options: VoiceOptions,
  onComplete?: () => void,
  unlimited = false,
): Promise<void> {
  if (!isElevenLabsConfigured()) {
    throw new Error('Premium voice is not configured.');
  }

  stopSpeaking();
  playbackCancelled = false;
  unlimitedLoop = unlimited;
  activeText = text;
  abortController = new AbortController();

  let audioUri: string | null = null;

  try {
    audioUri = await synthesizeElevenLabsSpeech(
      text,
      options.elevenLabsVoiceId,
      abortController.signal,
    );

    const count = Math.max(1, Math.min(repeatCount, 108));

    if (unlimited) {
      while (unlimitedLoop && !playbackCancelled) {
        await playAudioUri(audioUri, options.volume);
        if (!unlimitedLoop || playbackCancelled) break;
        await sleep(options.pauseMs);
      }
    } else {
      for (let index = 0; index < count; index += 1) {
        if (playbackCancelled) break;
        await playAudioUri(audioUri, options.volume);
        if (playbackCancelled || index >= count - 1) break;
        await sleep(options.pauseMs);
      }
    }
  } finally {
    if (audioUri) {
      await revokeElevenLabsAudioUrl(audioUri);
    }
    abortController = null;
    activeText = null;
    if (!playbackCancelled) {
      onComplete?.();
    }
  }
}

export async function previewVoice(text: string, options: VoiceOptions): Promise<void> {
  await speakAffirmation(text, 1, options);
}
