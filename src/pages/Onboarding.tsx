import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonRange,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import { arrowForward, stopCircle, volumeHigh } from 'ionicons/icons';
import AppLogo from '../components/AppLogo';
import { CATEGORIES, getDailyAffirmation } from '../data/affirmations';
import { useSettings } from '../hooks/useSettings';
import { requestNotificationPermission, scheduleDailyNotification } from '../services/notifications';
import { isElevenLabsConfigured } from '../services/elevenLabs';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { previewVoice, stopSpeaking } from '../services/voice';
import { DEFAULT_SETTINGS } from '../types/settings';
import './Onboarding.css';

const STEP_TITLES = ['Welcome', 'Ready'] as const;
const STEPS = ['setup', 'ready'] as const;

const Onboarding: React.FC = () => {
  const history = useHistory();
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focusCategories, setFocusCategories] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationHour, setNotificationHour] = useState(8);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const voiceReady = isElevenLabsConfigured() && voiceEnabled;

  const toggleCategory = (category: string) => {
    setFocusCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleVoicePreview = async () => {
    if (previewPlaying) {
      stopSpeaking();
      setPreviewPlaying(false);
      return;
    }

    setPreviewError('');
    setPreviewPlaying(true);

    const categories = focusCategories.length > 0 ? focusCategories : ['Self-Love'];
    const previewText = getDailyAffirmation([], categories).text;
    const previewOptions = buildVoiceOptions(DEFAULT_SETTINGS);

    try {
      await previewVoice(previewText, previewOptions);
    } catch {
      setPreviewError('Voice preview unavailable right now.');
    } finally {
      setPreviewPlaying(false);
    }
  };

  const finish = async () => {
    const settings = {
      name: name.trim(),
      focusCategories,
      repeatCount: 3,
      repeatMode: 'fixed' as const,
      voiceEnabled,
      notificationsEnabled,
      notificationHour,
      notificationMinute: 0,
    };

    completeOnboarding(settings);
    history.replace('/today');

    if (notificationsEnabled) {
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleDailyNotification({
            name: settings.name,
            notificationsEnabled: settings.notificationsEnabled,
            notificationHour: settings.notificationHour,
            notificationMinute: 0,
            focusCategories: settings.focusCategories,
          });
        }
      } catch {
        // Notifications unavailable on this platform
      }
    }
  };

  const currentStep = STEPS[step];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{STEP_TITLES[step]}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="onboarding-content">
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        {currentStep === 'setup' && (
          <div className="onboarding-step">
            <AppLogo size="lg" className="onboarding-logo" />
            <h1>Welcome to AffirmEaze</h1>
            <p>Daily affirmations with calm, natural premium voices.</p>
            <IonItem className="onboarding-input">
              <IonInput
                label="Your name"
                labelPlacement="stacked"
                placeholder="What should we call you?"
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
              />
            </IonItem>
            <IonText color="medium">
              <p className="time-label">What matters to you?</p>
            </IonText>
            <div className="category-grid">
              {CATEGORIES.map((category) => (
                <IonItem key={category} lines="none" className="category-chip">
                  <IonCheckbox
                    checked={focusCategories.includes(category)}
                    onIonChange={() => toggleCategory(category)}
                  />
                  <IonLabel>{category}</IonLabel>
                </IonItem>
              ))}
            </div>
            <IonButton expand="block" onClick={() => setStep(1)} disabled={!name.trim() || focusCategories.length === 0}>
              Continue
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
            {focusCategories.length === 0 && (
              <p className="onboarding-voice-note">Choose at least one focus area to continue.</p>
            )}
          </div>
        )}

        {currentStep === 'ready' && (
          <div className="onboarding-step">
            <h1>Your daily practice</h1>
            <p>Voice and reminders — adjust anytime in Settings.</p>
            <IonItem lines="none">
              <IonLabel>Voice affirmations</IonLabel>
              <IonToggle
                checked={voiceEnabled}
                onIonChange={(e) => setVoiceEnabled(e.detail.checked)}
              />
            </IonItem>
            <p className="onboarding-voice-note">
              Spoken affirmations use calm, natural premium voices.
            </p>
            {voiceReady && (
              <>
                <IonButton expand="block" fill="outline" onClick={() => void handleVoicePreview()}>
                  <IonIcon slot="start" icon={previewPlaying ? stopCircle : volumeHigh} />
                  {previewPlaying ? 'Stop Preview' : 'Preview Voice'}
                </IonButton>
                {previewError && (
                  <p className="onboarding-voice-note onboarding-preview-error">{previewError}</p>
                )}
              </>
            )}
            <IonItem lines="none">
              <IonLabel>Daily reminder</IonLabel>
              <IonToggle
                checked={notificationsEnabled}
                onIonChange={(e) => setNotificationsEnabled(e.detail.checked)}
              />
            </IonItem>
            {notificationsEnabled && (
              <>
                <IonText color="medium">
                  <p className="time-label">Reminder time</p>
                </IonText>
                <IonRange
                  min={5}
                  max={22}
                  step={1}
                  value={notificationHour}
                  onIonChange={(e) => setNotificationHour(e.detail.value as number)}
                  pin
                />
                <p className="time-display">
                  {notificationHour > 12 ? notificationHour - 12 : notificationHour}:00{' '}
                  {notificationHour >= 12 ? 'PM' : 'AM'}
                </p>
              </>
            )}
            <IonButton expand="block" onClick={finish}>
              Start My Journey
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
