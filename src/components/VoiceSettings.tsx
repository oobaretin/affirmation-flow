import { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/react';
import type { VoiceStyle } from '../types/settings';
import { getAvailableVoices, previewVoice } from '../services/voice';
import { getVoiceOptions, VOICE_PRESETS } from '../services/voiceProfiles';
import './VoiceSettings.css';

type VoiceSettingsProps = {
  voiceStyle: VoiceStyle;
  voiceURI: string;
  onStyleChange: (style: VoiceStyle) => void;
  onVoiceURIChange: (voiceURI: string) => void;
};

const PREVIEW_TEXT = 'I am worthy of love, calm, and confidence.';

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceStyle,
  voiceURI,
  onStyleChange,
  onVoiceURIChange,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(getAvailableVoices());
    load();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = load;
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const englishVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase().startsWith('en')),
    [voices],
  );

  const handlePreview = () => {
    previewVoice(PREVIEW_TEXT, getVoiceOptions(voiceStyle, voiceURI));
  };

  return (
    <div className="voice-settings">
      <IonText color="medium">
        <p className="settings-hint">
          Uses your device&apos;s built-in voices. For a soft, warm tone, try Soothing with Samantha on iPhone.
        </p>
      </IonText>

      <IonRadioGroup
        value={voiceStyle}
        onIonChange={(e) => onStyleChange(e.detail.value as VoiceStyle)}
      >
        {(Object.keys(VOICE_PRESETS) as VoiceStyle[]).map((style) => (
          <IonItem key={style} lines="none">
            <IonRadio value={style} justify="start" labelPlacement="end">
              <IonLabel>
                <h3>{VOICE_PRESETS[style].label}</h3>
                <p>{VOICE_PRESETS[style].description}</p>
              </IonLabel>
            </IonRadio>
          </IonItem>
        ))}
      </IonRadioGroup>

      {englishVoices.length > 0 && (
        <IonItem lines="none">
          <IonSelect
            label="Voice"
            labelPlacement="stacked"
            value={voiceURI || 'auto'}
            onIonChange={(e) => onVoiceURIChange(e.detail.value === 'auto' ? '' : e.detail.value)}
          >
            <IonSelectOption value="auto">Auto (best soothing voice)</IonSelectOption>
            {englishVoices.map((voice) => (
              <IonSelectOption key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      )}

      <IonButton expand="block" fill="outline" onClick={handlePreview}>
        Preview Voice
      </IonButton>
    </div>
  );
};

export default VoiceSettings;
