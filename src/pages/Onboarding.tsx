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
import RepeatSelector from '../components/RepeatSelector';
import { useSettings } from '../hooks/useSettings';
import { requestNotificationPermission, scheduleDailyNotification } from '../services/notifications';
import { isElevenLabsConfigured } from '../services/elevenLabs';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { previewVoice, stopSpeaking } from '../services/voice';
import { DEFAULT_SETTINGS, type RepeatMode } from '../types/settings';
import './Onboarding.css';

const STEP_TITLES = ['Welcome', 'Focus', 'Practice', 'Reminders'] as const;

const STEPS = ['welcome', 'focus', 'repeat', 'notifications'] as const;

const Onboarding: React.FC = () => {
  const history = useHistory();
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focusCategories, setFocusCategories] = useState<string[]>([]);
  const [repeatCount, setRepeatCount] = useState(3);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('fixed');
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
      repeatCount,
      repeatMode,
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

        {currentStep === 'welcome' && (
          <div className="onboarding-step">
            <AppLogo size="lg" className="onboarding-logo" />
            <h1>Welcome to AffirmEaze</h1>
            <p>Build a daily practice of self-belief with natural premium voices. Let's personalize your experience.</p>
            <IonItem className="onboarding-input">
              <IonInput
                label="Your name"
                labelPlacement="stacked"
                placeholder="What should we call you?"
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
              />
            </IonItem>
            <IonButton expand="block" onClick={() => setStep(1)} disabled={!name.trim()}>
              Continue
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          </div>
        )}

        {currentStep === 'focus' && (
          <div className="onboarding-step">
            <h1>What matters to you?</h1>
            <p>Pick the areas you'd like to focus on. You can change these later.</p>
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
            <IonButton expand="block" onClick={() => setStep(2)} disabled={focusCategories.length === 0}>
              Continue
            </IonButton>
            {focusCategories.length === 0 && (
              <p className="onboarding-voice-note">Choose at least one focus area to continue.</p>
            )}
          </div>
        )}

        {currentStep === 'repeat' && (
          <div className="onboarding-step">
            <h1>How many times?</h1>
            <p>Choose a mantra count or set unlimited repetitions.</p>
            <RepeatSelector
              repeatMode={repeatMode}
              repeatCount={repeatCount}
              onModeChange={setRepeatMode}
              onCountChange={setRepeatCount}
            />
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
            <IonButton expand="block" onClick={() => setStep(3)}>
              Continue
            </IonButton>
          </div>
        )}

        {currentStep === 'notifications' && (
          <div className="onboarding-step">
            <h1>Daily reminders</h1>
            <p>Get a gentle nudge each morning with your affirmation.</p><IonItem lines="none">
              <IonLabel>Daily notifications</IonLabel>
              <IonToggle
                checked={notificationsEnabled}
                onIonChange={(e) => setNotificationsEnabled(e.detail.checked)}
              />
            </IonItem>
            {notificationsEnabled && (
              <>
                <IonText color="medium">
                  <p className="time-label">Notification time</p>
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
            <p className="onboarding-voice-note">
              Next up: natural premium voices and your full daily practice.
            </p>
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
