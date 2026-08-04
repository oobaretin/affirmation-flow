import { useState } from 'react';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonPage,
  IonRange,
  IonToggle,
} from '@ionic/react';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import { useCustomAffirmations } from '../../hooks/useCustomAffirmations';
import { useSettings } from '../../hooks/useSettings';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
} from '../../services/notifications';
import { formatReminderHour } from './settingsSummaries';
import '../Settings.css';

const SettingsReminders: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { custom } = useCustomAffirmations();
  const [notificationHint, setNotificationHint] = useState('');

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotificationHint('Notifications are disabled. Enable them in iOS Settings → AffirmEaze → Notifications.');
        return;
      }
      setNotificationHint('');
    } else {
      setNotificationHint('');
    }

    const updated = { ...settings, notificationsEnabled: enabled };
    updateSettings({ notificationsEnabled: enabled });
    await scheduleDailyNotification(updated, custom);
  };

  const handleTimeChange = async (hour: number) => {
    const updated = { ...settings, notificationHour: hour };
    updateSettings({ notificationHour: hour });
    if (settings.notificationsEnabled) {
      await scheduleDailyNotification(updated, custom);
    }
  };

  return (
    <IonPage>
      <SettingsBackHeader title="Reminders" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <p className="settings-hint">
            A gentle nudge to open AffirmEaze and practice your daily affirmation.
          </p>
          <IonItem lines="none" className="settings-inline-item">
            <IonLabel>Daily reminder</IonLabel>
            <IonToggle
              checked={settings.notificationsEnabled}
              onIonChange={(e) => void handleNotificationToggle(e.detail.checked)}
            />
          </IonItem>
          {notificationHint && (
            <p className="settings-hint settings-warning">{notificationHint}</p>
          )}
          {settings.notificationsEnabled && (
            <>
              <p className="settings-hint">
                Reminder time: {formatReminderHour(settings.notificationHour)}
              </p>
              <IonRange
                min={5}
                max={22}
                step={1}
                value={settings.notificationHour}
                onIonChange={(e) => void handleTimeChange(e.detail.value as number)}
                pin
              />
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsReminders;
