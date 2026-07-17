import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import AppLogo from '../components/AppLogo';
import { PAYWALL_FEATURES, SUBSCRIPTION_DISPLAY, SUBSCRIPTION_LEGAL } from '../constants/subscription';
import { useSubscription } from '../hooks/useSubscription';
import {
  formatPackagePeriod,
  formatPackagePrice,
  isSubscriptionDevBypass,
} from '../services/subscription';
import './Paywall.css';

const Paywall: React.FC = () => {
  const history = useHistory();
  const {
    loading,
    purchasing,
    error,
    offering,
    nativePurchasesEnabled,
    devBypassEnabled,
    purchase,
    restore,
    clearError,
  } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const finish = () => {
    history.replace('/today');
  };

  const handlePurchase = async () => {
    clearError();
    const success = await purchase(selectedPlan);
    if (success) finish();
  };

  const handleRestore = async () => {
    clearError();
    const success = await restore();
    if (success) finish();
  };

  const monthlyPrice = formatPackagePrice(offering.monthly, 'monthly');
  const yearlyPrice = formatPackagePrice(offering.yearly, 'yearly');

  return (
    <IonPage>
      <IonContent fullscreen className="paywall-content">
        <div className="paywall-shell">
          <AppLogo size="md" className="paywall-logo" />

          <h1>Unlock AffirmEaze Premium</h1>
          <p className="paywall-subtitle">
            A calm daily affirmation practice with voice, favorites, streaks, and AI — all included.
          </p>

          <ul className="paywall-features">
            {PAYWALL_FEATURES.map((feature) => (
              <li key={feature}>
                <IonIcon icon={checkmarkCircle} aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {loading ? (
            <div className="paywall-loading">
              <IonSpinner name="crescent" />
              <p>Loading plans...</p>
            </div>
          ) : (
            <>
              <div className="paywall-plans">
                <button
                  type="button"
                  className={`paywall-plan ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('yearly')}
                >
                  <div className="paywall-plan-header">
                    <strong>{SUBSCRIPTION_DISPLAY.yearly.label}</strong>
                    <span className="paywall-badge">{SUBSCRIPTION_DISPLAY.yearly.savingsLabel}</span>
                  </div>
                  <p className="paywall-price">
                    {yearlyPrice}
                    <span> / {formatPackagePeriod('yearly')}</span>
                  </p>
                </button>

                <button
                  type="button"
                  className={`paywall-plan ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="paywall-plan-header">
                    <strong>{SUBSCRIPTION_DISPLAY.monthly.label}</strong>
                  </div>
                  <p className="paywall-price">
                    {monthlyPrice}
                    <span> / {formatPackagePeriod('monthly')}</span>
                  </p>
                </button>
              </div>

              {!nativePurchasesEnabled && !devBypassEnabled && (
                <p className="paywall-note">
                  Subscriptions are processed through the App Store in the iOS app.
                </p>
              )}

              {devBypassEnabled && isSubscriptionDevBypass() && (
                <p className="paywall-note">Developer bypass is enabled for local testing.</p>
              )}

              {error && (
                <IonText color="danger">
                  <p className="paywall-error">{error}</p>
                </IonText>
              )}

              <IonButton
                expand="block"
                className="paywall-primary-btn"
                disabled={purchasing || (!nativePurchasesEnabled && !devBypassEnabled)}
                onClick={() => void handlePurchase()}
              >
                {purchasing ? 'Processing...' : 'Start Premium'}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                disabled={purchasing || (!nativePurchasesEnabled && !devBypassEnabled)}
                onClick={() => void handleRestore()}
              >
                Restore Purchases
              </IonButton>

              <IonButton expand="block" fill="clear" onClick={() => history.push('/privacy')}>
                Privacy Policy
              </IonButton>
            </>
          )}

          <p className="paywall-legal">{SUBSCRIPTION_LEGAL}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Paywall;
