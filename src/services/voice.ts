import {
  getVoiceOptions,
  pickSoothingVoice,
  type VoiceOptions,
  VOICE_PRESETS,
} from './voiceProfiles';

let activeUtterances = 0;
let unlimitedLoop = false;
let activeText: string | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function readVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

function primeVoiceDiscovery(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // iOS often returns an empty/partial voice list until speech synthesis runs once.
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
  window.speechSynthesis.cancel();
}

function refreshVoices(): SpeechSynthesisVoice[] {
  const voices = readVoices();
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices;
}

export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      voicesReadyPromise = null;
      return;
    }

    const finish = () => {
      const voices = refreshVoices();
      if (voices.length > 0) {
        voicesReadyPromise = null;
        resolve(voices);
        return true;
      }
      return false;
    };

    const onVoicesChanged = () => {
      if (finish()) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };

    window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    primeVoiceDiscovery();

    if (finish()) {
      window.speechSynthesis.onvoiceschanged = null;
      return;
    }

    const delays = [100, 300, 600, 1200];
    delays.forEach((delay) => {
      window.setTimeout(() => {
        if (finish()) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      }, delay);
    });

    window.setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      voicesReadyPromise = null;
      resolve(refreshVoices());
    }, 1500);
  });

  return voicesReadyPromise;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  primeVoiceDiscovery();
  refreshVoices();
  void ensureVoicesLoaded();
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return refreshVoices();
}

export function stopSpeaking() {
  unlimitedLoop = false;
  activeText = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterances = 0;
  }
}

export function getActiveSpeechText(): string | null {
  return activeText;
}

function applyVoiceOptions(utterance: SpeechSynthesisUtterance, options: VoiceOptions) {
  const voices = refreshVoices();
  const voice = pickSoothingVoice(voices, options.voiceURI);
  if (voice) utterance.voice = voice;

  utterance.rate = options.rate;
  utterance.pitch = options.pitch;
  utterance.volume = options.volume;
}

function createUtterance(text: string, options: VoiceOptions): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  applyVoiceOptions(utterance, options);
  return utterance;
}

export function previewVoice(text: string, options: VoiceOptions): void {
  if (!window.speechSynthesis) return;

  stopSpeaking();
  const utterance = createUtterance(text, options);
  window.speechSynthesis.speak(utterance);
}

export function speakAffirmation(
  text: string,
  repeatCount: number,
  onComplete?: () => void,
  unlimited = false,
  options: VoiceOptions = getVoiceOptions('soothing'),
): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    stopSpeaking();
    unlimitedLoop = unlimited;
    activeText = text;

    if (unlimited) {
      const speakLoop = () => {
        if (!unlimitedLoop) {
          activeUtterances = 0;
          activeText = null;
          onComplete?.();
          resolve();
          return;
        }

        const utterance = createUtterance(text, options);
        utterance.onend = () => {
          if (!unlimitedLoop) {
            activeUtterances = 0;
            activeText = null;
            onComplete?.();
            resolve();
            return;
          }
          setTimeout(speakLoop, options.pauseMs);
        };
        utterance.onerror = () => {
          activeUtterances = 0;
          activeText = null;
          unlimitedLoop = false;
          resolve();
        };
        activeUtterances += 1;
        window.speechSynthesis.speak(utterance);
      };
      speakLoop();
      return;
    }

    const count = Math.max(1, Math.min(repeatCount, 108));

    const speakNext = (index: number) => {
      const utterance = createUtterance(text, options);
      utterance.onend = () => {
        if (index < count - 1) {
          setTimeout(() => speakNext(index + 1), options.pauseMs);
        } else {
          activeUtterances = 0;
          activeText = null;
          onComplete?.();
          resolve();
        }
      };
      utterance.onerror = () => {
        activeUtterances = 0;
        activeText = null;
        resolve();
      };
      activeUtterances += 1;
      window.speechSynthesis.speak(utterance);
    };

    speakNext(0);
  });
}

export function isSpeaking(): boolean {
  return activeUtterances > 0 || window.speechSynthesis?.speaking === true;
}

export { VOICE_PRESETS };
