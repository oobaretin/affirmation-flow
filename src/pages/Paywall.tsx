import { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { checkmarkCircle, stopCircle, volumeHigh } from 'ionicons/icons';
import AppLogo from '../components/AppLogo';
import { PRIVACY_POLICY_URL } from '../constants/app';
import { ELEVENLABS_VOICES } from '../constants/elevenLabsVoices';
import {
  PAYWALL_FEATURES,
  SUBSCRIPTION_DISPLAY,
  SUBSCRIPTION_TRIAL_HEADLINE,
  YEARLY_MONTHLY_EQUIVALENT,
  buildSubscriptionLegal,
} from '../constants/subscription';
import { getDailyAffirmation } from '../data/affirmations';
import { useSettings } from '../hooks/useSettings';
import { useSubscription } from '../hooks/useSubscription';
import { isElevenLabsConfigured } from '../services/elevenLabs';
import {
  formatPackagePeriod,
  formatPackagePrice,
  formatPlanTrialNote,
  isSubscriptionDevBypass,
} from '../services/subscription';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { openExternalUrl } from '../services/links';
import { isSpeaking, previewVoice, stopSpeaking } from '../services/voice';
import './Paywall.css';

const Paywall: React.FC = () => {
  const history = useHistory();
  const { settings } = useSettings();
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
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const previewText = useMemo(
    () => getDailyAffirmation([], settings.focusCategories).text,
    [settings.focusCategories],
  );
  const voiceReady = isElevenLabsConfigured() && settings.voiceEnabled;
  const previewOptions = buildVoiceOptions(settings);

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

  const handlePreview = async () => {
    if (previewPlaying) {
      stopSpeaking();
      setPreviewPlaying(false);
      return;
    }

    setPreviewError('');
    setPreviewPlaying(true);
    try {
      await previewVoice(previewText, previewOptions);
    } catch {
      setPreviewError('Voice preview unavailable right now.');
    } finally {
      if (!isSpeaking()) {
        setPreviewPlaying(false);
      } else {
        setPreviewPlaying(false);
      }
    }
  };

  const monthlyPrice = formatPackagePrice(offering.monthly, 'monthly');
  const yearlyPrice = formatPackagePrice(offering.yearly, 'yearly');
  const selectedPrice = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;
  const monthlyTrialNote = formatPlanTrialNote('monthly', offering.monthly);
  const yearlyTrialNote = formatPlanTrialNote('yearly', offering.yearly);
  const subscriptionLegal = buildSubscriptionLegal(selectedPlan, selectedPrice);
  const greeting = settings.name ? `${settings.name}, listen to today's affirmation` : 'Listen to today\'s affirmation';

  return (
    <IonPage>
      <IonContent fullscreen className="paywall-content">
        <div className="paywall-shell">
          <AppLogo size="md" className="paywall-logo" />

          <h1>Hear the difference</h1>
          <p className="paywall-subtitle">
            Natural premium voices bring your daily affirmations to life.
          </p>
          <p className="paywall-trial-headline">{SUBSCRIPTION_TRIAL_HEADLINE}</p>

          {voiceReady && (
            <div className="paywall-preview">
              <p className="paywall-preview-label">{greeting}</p>
              <p className="paywall-preview-text">&ldquo;{previewText}&rdquo;</p>
              <div className="paywall-voice-tags">
                {ELEVENLABS_VOICES.map((voice) => (
                  <span key={voice.id} className="paywall-voice-tag">
                    {voice.name} · {voice.description}
                  </span>
                ))}
              </div>
              <IonButton
                expand="block"
                fill="outline"
                className="paywall-preview-btn"
                onClick={() => void handlePreview()}
              >
                <IonIcon slot="start" icon={previewPlaying ? stopCircle : volumeHigh} />
                {previewPlaying ? 'Stop Preview' : 'Hear Sample Voice'}
              </IonButton>
              {previewError && (
                <p className="paywall-preview-error">{previewError}</p>
              )}
            </div>
          )}

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
                  <p className="paywall-plan-equivalent">
                    {YEARLY_MONTHLY_EQUIVALENT}/mo billed annually
                  </p>
                  <p className="paywall-plan-trial">{yearlyTrialNote}</p>
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
                  <p className="paywall-plan-trial">{monthlyTrialNote}</p>
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
                {purchasing ? 'Processing...' : 'Start 7-Day Free Trial'}
              </IonButton>

              <IonButton
                expand="block"
                fill="clear"
                disabled={purchasing || (!nativePurchasesEnabled && !devBypassEnabled)}
                onClick={() => void handleRestore()}
              >
                Restore Purchases
              </IonButton>

              <IonButton expand="block" fill="clear" onClick={() => openExternalUrl(PRIVACY_POLICY_URL)}>
                Privacy Policy
              </IonButton>
            </>
          )}

          <p className="paywall-legal">{subscriptionLegal}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Paywall;
