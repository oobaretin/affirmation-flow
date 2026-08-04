import { IonContent, IonItem, IonLabel, IonPage, IonToggle } from '@ionic/react';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import VoiceSettings from '../../components/VoiceSettings';
import { useSettings } from '../../hooks/useSettings';
import '../Settings.css';

const SettingsVoice: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <IonPage>
      <SettingsBackHeader title="Voice" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <IonItem lines="none" className="settings-inline-item">
            <IonLabel>Voice affirmations</IonLabel>
            <IonToggle
              checked={settings.voiceEnabled}
              onIonChange={(e) => updateSettings({ voiceEnabled: e.detail.checked })}
            />
          </IonItem>
          {settings.voiceEnabled && (
            <VoiceSettings
              voiceStyle={settings.voiceStyle}
              elevenLabsVoiceId={settings.elevenLabsVoiceId}
              onStyleChange={(voiceStyle) => updateSettings({ voiceStyle })}
              onElevenLabsVoiceChange={(elevenLabsVoiceId) => updateSettings({ elevenLabsVoiceId })}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsVoice;
