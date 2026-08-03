import { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { ELEVENLABS_VOICES, type ElevenLabsVoice } from '../constants/elevenLabsVoices';
import type { VoiceStyle } from '../types/settings';
import {
  filterVoicesForApiAccess,
  getElevenLabsSubscription,
  getLastPremiumVoiceError,
  isElevenLabsConfigured,
  listElevenLabsVoices,
  pickDefaultApiVoice,
  type ElevenLabsSubscriptionInfo,
} from '../services/elevenLabs';
import { previewVoice } from '../services/voice';
import { buildVoiceOptions, VOICE_PRESETS } from '../services/voiceProfiles';
import './VoiceSettings.css';

type VoiceSettingsProps = {
  voiceStyle: VoiceStyle;
  elevenLabsVoiceId: string;
  onStyleChange: (style: VoiceStyle) => void;
  onElevenLabsVoiceChange: (voiceId: string) => void;
};

const PREVIEW_TEXT =
  'I am worthy of love, calm, and confidence. I release what no longer serves me.';

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceStyle,
  elevenLabsVoiceId,
  onStyleChange,
  onElevenLabsVoiceChange,
}) => {
  const [elevenLabsVoices, setElevenLabsVoices] = useState<ElevenLabsVoice[]>(ELEVENLABS_VOICES);
  const [elevenLabsSubscription, setElevenLabsSubscription] = useState<ElevenLabsSubscriptionInfo | null>(null);
  const [previewStatus, setPreviewStatus] = useState('');
  const elevenLabsReady = isElevenLabsConfigured();

  useEffect(() => {
    if (!elevenLabsReady) return;

    let cancelled = false;

    Promise.all([listElevenLabsVoices(), getElevenLabsSubscription()])
      .then(([loaded, subscription]) => {
        if (cancelled) return;
        setElevenLabsVoices(loaded);
        setElevenLabsSubscription(subscription);

        const nextVoiceId = pickDefaultApiVoice(loaded, subscription, elevenLabsVoiceId);
        if (nextVoiceId !== elevenLabsVoiceId) {
          onElevenLabsVoiceChange(nextVoiceId);
        }
      })
      .catch(() => {
        if (!cancelled) setElevenLabsVoices(ELEVENLABS_VOICES);
      });

    return () => {
      cancelled = true;
    };
  }, [elevenLabsReady, elevenLabsVoiceId, onElevenLabsVoiceChange]);

  const apiAccessibleVoices = useMemo(
    () => filterVoicesForApiAccess(elevenLabsVoices, elevenLabsSubscription),
    [elevenLabsVoices, elevenLabsSubscription],
  );

  const premiumVoiceOptions = useMemo(() => {
    const baseVoices = apiAccessibleVoices;
    if (!elevenLabsVoiceId) return baseVoices;
    if (baseVoices.some((voice) => voice.id === elevenLabsVoiceId)) {
      return baseVoices;
    }

    return [
      { id: elevenLabsVoiceId, name: 'Saved voice', description: '' },
      ...baseVoices,
    ];
  }, [apiAccessibleVoices, elevenLabsVoiceId]);

  const previewOptions = buildVoiceOptions({
    voiceStyle,
    voiceURI: '',
    voiceProvider: 'elevenlabs',
    elevenLabsVoiceId,
  });

  const handlePreview = async () => {
    setPreviewStatus('');
    try {
      await previewVoice(PREVIEW_TEXT, previewOptions);
      const error = getLastPremiumVoiceError();
      if (error) {
        setPreviewStatus(error);
      }
    } catch {
      setPreviewStatus('Preview unavailable. Check your premium voice configuration.');
    }
  };

  return (
    <div className="voice-settings">
      <p className="voice-settings-intro">
        AffirmEaze uses natural premium voices for every spoken affirmation.
      </p>

      {elevenLabsReady ? (
        <IonItem lines="none">
          <IonSelect
            label="Voice"
            labelPlacement="stacked"
            value={elevenLabsVoiceId}
            onIonChange={(e) => onElevenLabsVoiceChange(e.detail.value)}
          >
            {premiumVoiceOptions.map((voice) => (
              <IonSelectOption key={voice.id} value={voice.id}>
                {voice.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      ) : (
        <p className="voice-status voice-status-warning">
          Premium voice is not configured in this build.
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
              </IonLabel>
            </IonRadio>
          </IonItem>
        ))}
      </IonRadioGroup>

      <IonButton expand="block" fill="outline" onClick={() => void handlePreview()}>
        Preview Voice
      </IonButton>
      {previewStatus && (
        <p className="voice-status voice-status-warning">
          {previewStatus}
        </p>
      )}
    </div>
  );
};

export default VoiceSettings;
