import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRange,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import RepeatSelector from '../components/RepeatSelector';
import FocusCategoryPicker from '../components/FocusCategoryPicker';
import VoiceSettings from '../components/VoiceSettings';
import AppLogo from '../components/AppLogo';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useSettings } from '../hooks/useSettings';
import { useSubscription } from '../hooks/useSubscription';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
} from '../services/notifications';
import { clearAllAppData, markExplicitLogout, pauseSession } from '../services/session';
import { openManageSubscriptions } from '../services/subscription';
import { APP_NAME, APP_VERSION, SUPPORT_EMAIL } from '../constants/app';
import './Settings.css';

const Settings: React.FC = () => {
  const history = useHistory();
  const { settings, updateSettings, resetOnboarding, logout } = useSettings();
  const { status, purchasing, restore, isSubscribed } = useSubscription();
  const { custom } = useCustomAffirmations();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);
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

  const handleFocusChange = async (focusCategories: string[]) => {
    const updated = { ...settings, focusCategories };
    updateSettings({ focusCategories });
    if (settings.notificationsEnabled) {
      await scheduleDailyNotification(updated, custom);
    }
  };

  const handleLogout = async () => {
    await pauseSession();
    markExplicitLogout();
    logout();
    history.replace('/signed-out');
  };

  const handleClearAll = async () => {
    await clearAllAppData();
    window.location.replace('/onboarding');
  };

  const formatHour = (hour: number) => {
    const h = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${ampm}`;
  };

  const formatRenewalDate = (value: string | null) => {
    if (!value) return 'Active';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Active';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="settings-content" scrollY>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="settings-brand">
          <AppLogo size="sm" />
          <div className="settings-brand-text">
            <h2>AffirmEaze</h2>
            <p>Daily affirmations, your way</p>
          </div>
        </div>

        <div className="settings-section">
          <IonText color="medium">
            <h3>Subscription</h3>
          </IonText>
          <p className="settings-hint">
            {isSubscribed
              ? `Premium ${status.plan === 'yearly' ? 'Annual' : 'Monthly'} · Renews ${formatRenewalDate(status.expirationDate)}`
              : 'Premium subscription required to use AffirmEaze.'}
          </p>
          <div className="settings-actions">
            <IonButton expand="block" fill="outline" onClick={() => openManageSubscriptions()}>
              Manage Subscription
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              disabled={purchasing}
              onClick={() => void restore()}
            >
              Restore Purchases
            </IonButton>
          </div>
        </div>

        <div className="settings-section settings-account-section">
          <IonText color="medium">
            <h3>This Device</h3>
          </IonText>
          <p className="settings-hint">
            AffirmEaze stores everything locally on this device. There is no cloud account.
          </p>
          <div className="settings-actions">
            <IonButton
              expand="block"
              color="primary"
              className="settings-logout-btn"
              onClick={() => setShowLogoutAlert(true)}
            >
              Lock App
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => {
                resetOnboarding();
                history.push('/onboarding');
              }}
            >
              Redo Onboarding
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="danger"
              onClick={() => setShowClearAlert(true)}
            >
              Clear All Data & Start Over
            </IonButton>
          </div>
        </div>

        <IonList>
          <IonItem>
            <IonInput
              label="Your name"
              labelPlacement="stacked"
              value={settings.name}
              onIonInput={(e) => updateSettings({ name: e.detail.value ?? '' })}
            />
          </IonItem>
        </IonList>

        <div className="settings-section">
          <IonText color="medium">
            <h3>Focus Areas</h3>
          </IonText>
          <p className="settings-hint">
            Your daily affirmation prefers these categories
          </p>
          <FocusCategoryPicker
            selected={settings.focusCategories}
            onChange={handleFocusChange}
          />
        </div>

        <div className="settings-section">
          <IonText color="medium">
            <h3>Your Practice</h3>
          </IonText>
          <p className="settings-hint">
            Mantra-style repeats or unlimited until you stop
          </p>
          <RepeatSelector
            repeatMode={settings.repeatMode}
            repeatCount={settings.repeatCount}
            onModeChange={(mode) => updateSettings({ repeatMode: mode })}
            onCountChange={(count) => updateSettings({ repeatCount: count, repeatMode: 'fixed' })}
          />
          <IonItem lines="none">
            <IonLabel>Voice affirmations</IonLabel>
            <IonToggle
              checked={settings.voiceEnabled}
              onIonChange={(e) => updateSettings({ voiceEnabled: e.detail.checked })}
            />
          </IonItem>
          {settings.voiceEnabled && (
            <VoiceSettings
              voiceStyle={settings.voiceStyle}
              voiceURI={settings.voiceURI}
              onStyleChange={(voiceStyle) => updateSettings({ voiceStyle })}
              onVoiceURIChange={(voiceURI) => updateSettings({ voiceURI })}
            />
          )}
        </div>

        <div className="settings-section">
          <IonText color="medium">
            <h3>Notifications</h3>
          </IonText>
          <IonItem lines="none">
            <IonLabel>Daily reminder</IonLabel>
            <IonToggle
              checked={settings.notificationsEnabled}
              onIonChange={(e) => handleNotificationToggle(e.detail.checked)}
            />
          </IonItem>
          {notificationHint && (
            <p className="settings-hint settings-warning">{notificationHint}</p>
          )}
          {settings.notificationsEnabled && (
            <>
              <p className="settings-hint">Reminder time: {formatHour(settings.notificationHour)}</p>
              <IonRange
                min={5}
                max={22}
                step={1}
                value={settings.notificationHour}
                onIonChange={(e) => handleTimeChange(e.detail.value as number)}
                pin
              />
            </>
          )}
        </div>

        <div className="settings-section settings-about-section">
          <IonText color="medium">
            <h3>About</h3>
          </IonText>
          <p className="settings-hint">
            {APP_NAME} v{APP_VERSION}
          </p>
          <div className="settings-actions">
            <IonButton expand="block" fill="clear" onClick={() => history.push('/privacy')}>
              Privacy Policy
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              Contact Support
            </IonButton>
          </div>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Lock App?"
          message="You'll return to the lock screen. Your affirmations, favorites, and settings stay on this device."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Lock App', handler: handleLogout },
          ]}
        />

        <IonAlert
          isOpen={showClearAlert}
          onDidDismiss={() => setShowClearAlert(false)}
          header="Clear All Data?"
          message="This permanently deletes your profile, custom affirmations, favorites, and settings. This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete Everything', role: 'destructive', handler: handleClearAll },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
