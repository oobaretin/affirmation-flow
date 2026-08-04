import {
  IonButton,
  IonContent,
  IonPage,
  IonText,
} from '@ionic/react';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import { useSubscription } from '../../hooks/useSubscription';
import { openManageSubscriptions } from '../../services/subscription';
import { formatRenewalDate } from './settingsSummaries';
import '../Settings.css';

const SettingsSubscription: React.FC = () => {
  const { status, purchasing, restore, isSubscribed } = useSubscription();

  const planLabel = status.plan === 'yearly' ? 'Annual' : 'Monthly';
  const summary = isSubscribed
    ? `Premium ${planLabel} · Renews ${formatRenewalDate(status.expirationDate)}`
    : 'Premium subscription required';

  return (
    <IonPage>
      <SettingsBackHeader title="Subscription" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <IonText color="medium">
            <p className="settings-detail-lead">{summary}</p>
          </IonText>
          <p className="settings-hint">
            Manage billing, change plans, or cancel anytime through your Apple ID.
          </p>
          <div className="settings-actions">
            <IonButton expand="block" onClick={() => openManageSubscriptions()}>
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
      </IonContent>
    </IonPage>
  );
};

export default SettingsSubscription;
