import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonAccordion,
  IonAccordionGroup,
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronForward } from 'ionicons/icons';
import { useSettings } from '../hooks/useSettings';
import { useSubscription } from '../hooks/useSubscription';
import { clearAllAppData } from '../services/session';
import { openExternalUrl } from '../services/links';
import { APP_NAME, APP_VERSION, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../constants/app';
import {
  formatFocusSummary,
  formatRenewalDate,
  getPracticeSummary,
  getRemindersSummary,
  getVoiceSummary,
} from './settings/settingsSummaries';
import './Settings.css';

type SettingsRowProps = {
  title: string;
  detail: string;
  path: string;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ title, detail, path }) => {
  const history = useHistory();

  return (
    <IonItem
      button
      detail={false}
      className="settings-menu-item"
      onClick={() => history.push(path)}
    >
      <IonLabel>
        <h2>{title}</h2>
        <p>{detail}</p>
      </IonLabel>
      <IonIcon slot="end" icon={chevronForward} className="settings-menu-chevron" aria-hidden="true" />
    </IonItem>
  );
};

const Settings: React.FC = () => {
  const history = useHistory();
  const { settings, updateSettings, resetOnboarding } = useSettings();
  const { status, isSubscribed } = useSubscription();
  const [showClearAlert, setShowClearAlert] = useState(false);

  const handleClearAll = async () => {
    await clearAllAppData();
    window.location.replace('/onboarding');
  };

  const subscriptionSummary = isSubscribed
    ? `Premium ${status.plan === 'yearly' ? 'Annual' : 'Monthly'} · Renews ${formatRenewalDate(status.expirationDate)}`
    : 'Premium subscription required';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="settings-content settings-hub-content" scrollY>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        <p className="settings-group-label">Profile</p>
        <IonList inset className="settings-menu-list">
          <IonItem lines="full" className="settings-name-item">
            <IonInput
              label="Your name"
              labelPlacement="stacked"
              value={settings.name}
              onIonInput={(e) => updateSettings({ name: e.detail.value ?? '' })}
            />
          </IonItem>
        </IonList>

        <p className="settings-group-label">Preferences</p>
        <IonList inset className="settings-menu-list">
          <SettingsRow title="Subscription" detail={subscriptionSummary} path="/settings/subscription" />
          <SettingsRow title="Practice" detail={getPracticeSummary(settings)} path="/settings/practice" />
          <SettingsRow title="Voice" detail={getVoiceSummary(settings)} path="/settings/voice" />
          <SettingsRow title="Reminders" detail={getRemindersSummary(settings)} path="/settings/reminders" />
          <SettingsRow title="Focus Areas" detail={formatFocusSummary(settings.focusCategories)} path="/settings/focus" />
        </IonList>

        <p className="settings-group-label">About</p>
        <IonList inset className="settings-menu-list">
          <IonItem lines="none" className="settings-menu-item">
            <IonLabel>
              <h2>{APP_NAME}</h2>
              <p>Version {APP_VERSION}</p>
            </IonLabel>
          </IonItem>
          <IonItem button detail={false} className="settings-menu-item" onClick={() => openExternalUrl(PRIVACY_POLICY_URL)}>
            <IonLabel>Privacy Policy</IonLabel>
            <IonIcon slot="end" icon={chevronForward} className="settings-menu-chevron" aria-hidden="true" />
          </IonItem>
          <IonItem button detail={false} className="settings-menu-item" href={`mailto:${SUPPORT_EMAIL}`}>
            <IonLabel>Contact Support</IonLabel>
            <IonIcon slot="end" icon={chevronForward} className="settings-menu-chevron" aria-hidden="true" />
          </IonItem>
        </IonList>

        <div className="settings-section settings-advanced-section">
          <IonAccordionGroup className="settings-advanced-accordion">
            <IonAccordion value="advanced">
              <IonItem slot="header" color="light" lines="none">
                <IonLabel>
                  <IonText color="medium">
                    <h3 className="settings-advanced-heading">Advanced</h3>
                  </IonText>
                  <p className="settings-advanced-summary">Reset or erase this device</p>
                </IonLabel>
              </IonItem>
              <div slot="content" className="settings-advanced-content">
                <p className="settings-hint">
                  AffirmEaze stores everything locally on this device. There is no cloud account.
                </p>
                <div className="settings-actions">
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
            </IonAccordion>
          </IonAccordionGroup>
        </div>

        <IonAlert
          isOpen={showClearAlert}
          onDidDismiss={() => setShowClearAlert(false)}
          header="Clear All Data?"
          message="This permanently deletes your profile, favorites, and settings. This cannot be undone."
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
