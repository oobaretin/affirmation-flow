import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonPage } from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import RepeatSelector from '../../components/RepeatSelector';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import { useSettings } from '../../hooks/useSettings';
import { getRemindersSummary, getVoiceSummary } from './settingsSummaries';
import '../Settings.css';

const SettingsPractice: React.FC = () => {
  const history = useHistory();
  const { settings, updateSettings } = useSettings();

  return (
    <IonPage>
      <SettingsBackHeader title="Your Practice" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <p className="settings-hint">
            How many times each affirmation repeats during a session.
          </p>
          <RepeatSelector
            repeatMode={settings.repeatMode}
            repeatCount={settings.repeatCount}
            onModeChange={(mode) => updateSettings({ repeatMode: mode })}
            onCountChange={(count) => updateSettings({ repeatCount: count, repeatMode: 'fixed' })}
          />
        </div>

        <p className="settings-group-label">Also in your practice</p>
        <IonList inset className="settings-menu-list">
          <IonItem button detail={false} className="settings-menu-item" onClick={() => history.push('/settings/voice')}>
            <IonLabel>
              <h2>Voice</h2>
              <p>{getVoiceSummary(settings)}</p>
            </IonLabel>
            <IonIcon slot="end" icon={chevronForward} className="settings-menu-chevron" aria-hidden="true" />
          </IonItem>
          <IonItem button detail={false} className="settings-menu-item" onClick={() => history.push('/settings/reminders')}>
            <IonLabel>
              <h2>Reminders</h2>
              <p>{getRemindersSummary(settings)}</p>
            </IonLabel>
            <IonIcon slot="end" icon={chevronForward} className="settings-menu-chevron" aria-hidden="true" />
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPractice;
