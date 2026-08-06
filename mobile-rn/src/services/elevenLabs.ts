import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  ELEVENLABS_VOICES,
} from '../constants/elevenLabsVoices';
import { getElevenLabsApiKey } from '../config/env';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE = 'https://api.elevenlabs.io/v1';
const TTS_MODEL = 'eleven_flash_v2_5';

let lastPremiumVoiceError: string | null = null;

export function setLastPremiumVoiceError(message: string | null): void {
  lastPremiumVoiceError = message;
}

export function getLastPremiumVoiceError(): string | null {
  return lastPremiumVoiceError;
}

export function isElevenLabsConfigured(): boolean {
  return getElevenLabsApiKey().length > 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return globalThis.btoa(binary);
}

export async function synthesizeElevenLabsSpeech(
  text: string,
  voiceId = DEFAULT_ELEVENLABS_VOICE_ID,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ElevenLabs API key is not configured');
  }

  const response = await fetch(`${API_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      voice_settings: {
        stability: 0.65,
        similarity_boost: 0.75,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const message = `ElevenLabs TTS failed (${response.status})`;
    setLastPremiumVoiceError(message);
    throw new Error(message);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    const message = 'ElevenLabs returned empty audio';
    setLastPremiumVoiceError(message);
    throw new Error(message);
  }

  const base64 = bytesToBase64(new Uint8Array(arrayBuffer));
  const fileUri = `${FileSystem.cacheDirectory}elevenlabs-${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  setLastPremiumVoiceError(null);
  return fileUri;
}

export async function revokeElevenLabsAudioUrl(url: string): Promise<void> {
  await FileSystem.deleteAsync(url, { idempotent: true });
}

export { ELEVENLABS_VOICES };
