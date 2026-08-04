import { IonContent, IonPage } from '@ionic/react';
import RepeatSelector from '../../components/RepeatSelector';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import { useSettings } from '../../hooks/useSettings';
import '../Settings.css';

const SettingsPractice: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  return (
    <IonPage>
      <SettingsBackHeader title="Practice" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <p className="settings-hint">
            How many times you repeat each affirmation during silent practice.
          </p>
          <RepeatSelector
            repeatMode={settings.repeatMode}
            repeatCount={settings.repeatCount}
            onModeChange={(mode) => updateSettings({ repeatMode: mode })}
            onCountChange={(count) => updateSettings({ repeatCount: count, repeatMode: 'fixed' })}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPractice;
