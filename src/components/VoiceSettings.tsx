import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ensureVoicesLoaded, getAvailableVoices, previewVoice } from '../services/voice';
import {
  dedupeVoicesByBaseName,
  filterCalmClearVoices,
  formatVoiceLabel,
  getRecommendedVoice,
  getVoiceOptions,
  VOICE_PRESETS,
} from '../services/voiceProfiles';
import './VoiceSettings.css';

type VoiceSettingsProps = {
  voiceStyle: VoiceStyle;
  voiceURI: string;
  onStyleChange: (style: VoiceStyle) => void;
  onVoiceURIChange: (voiceURI: string) => void;
};

const PREVIEW_TEXT =
  'I am worthy of love, calm, and confidence. I release what no longer serves me.';

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceStyle,
  voiceURI,
  onStyleChange,
  onVoiceURIChange,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const loadVoices = useCallback(async () => {
    setLoadingVoices(true);
    const loaded = await ensureVoicesLoaded();
    setVoices(loaded.length > 0 ? loaded : getAvailableVoices());
    setLoadingVoices(false);
  }, []);

  useEffect(() => {
    void loadVoices();

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        void loadVoices();
      };
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [loadVoices]);

  const calmVoices = useMemo(
    () => dedupeVoicesByBaseName(filterCalmClearVoices(voices, voiceURI)),
    [voices, voiceURI],
  );

  const recommendedVoice = useMemo(
    () => getRecommendedVoice(voices),
    [voices],
  );

  const handlePreview = () => {
    previewVoice(PREVIEW_TEXT, getVoiceOptions(voiceStyle, voiceURI));
  };

  return (
    <div className="voice-settings">
      <IonText color="medium">
        <p className="settings-hint">
          Keep <strong>Soothing</strong> + <strong>Auto</strong> for the softest tone.
        </p>
      </IonText>

      {loadingVoices && (
        <p className="voice-status">Loading voices...</p>
      )}

      {!loadingVoices && recommendedVoice && !voiceURI && (
        <p className="voice-recommended">
          Auto will use: <strong>{formatVoiceLabel(recommendedVoice)}</strong>
        </p>
      )}

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

      {calmVoices.length > 0 && (
        <IonItem lines="none">
          <IonSelect
            label="Voice"
            labelPlacement="stacked"
            value={voiceURI || 'auto'}
            onIonChange={(e) => onVoiceURIChange(e.detail.value === 'auto' ? '' : e.detail.value)}
          >
            <IonSelectOption value="auto">Auto (best calm voice)</IonSelectOption>
            {calmVoices.map((voice) => {
              const isRecommended = voice.voiceURI === recommendedVoice?.voiceURI;
              const label = formatVoiceLabel(voice);
              return (
                <IonSelectOption key={voice.voiceURI} value={voice.voiceURI}>
                  {isRecommended ? `★ ${label}` : label}
                </IonSelectOption>
              );
            })}
          </IonSelect>
        </IonItem>
      )}

      {!loadingVoices && calmVoices.length === 0 && (
        <p className="voice-status">No calm voices found on this device.</p>
      )}

      <IonButton expand="block" fill="outline" onClick={handlePreview}>
        Preview Voice
      </IonButton>
    </div>
  );
};

export default VoiceSettings;
