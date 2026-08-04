import { useEffect, useMemo, useState } from 'react';
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

const STEP_TITLES = ['Focus', 'Listen', 'Ready'] as const;
const STEPS = ['focus', 'listen', 'ready'] as const;
const MAX_FOCUS_AREAS = 2;

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
  const previewText = useMemo(
    () => getDailyAffirmation([], focusCategories.length > 0 ? focusCategories : ['Self-Love']).text,
    [focusCategories],
  );

  const toggleCategory = (category: string) => {
    setFocusCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= MAX_FOCUS_AREAS) {
        return prev;
      }
      return [...prev, category];
    });
  };

  const playFirstAffirmation = async () => {
    if (!voiceReady) return;

    setPreviewError('');
    setPreviewPlaying(true);
    const previewOptions = buildVoiceOptions(DEFAULT_SETTINGS);

    try {
      await previewVoice(previewText, previewOptions);
    } catch {
      setPreviewError('Voice preview unavailable right now.');
    } finally {
      setPreviewPlaying(false);
    }
  };

  useEffect(() => {
    if (STEPS[step] !== 'listen' || !voiceReady) return;
    void playFirstAffirmation();
    return () => {
      stopSpeaking();
      setPreviewPlaying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay when entering listen step
  }, [step, voiceReady]);

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

        {currentStep === 'focus' && (
          <div className="onboarding-step">
            <AppLogo size="lg" className="onboarding-logo" />
            <h1>What matters to you?</h1>
            <p>Pick up to two focus areas for your daily affirmations.</p>
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
            <IonButton
              expand="block"
              onClick={() => setStep(1)}
              disabled={focusCategories.length === 0}
            >
              Continue
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
            {focusCategories.length === 0 && (
              <p className="onboarding-voice-note">Choose at least one focus area to continue.</p>
            )}
          </div>
        )}

        {currentStep === 'listen' && (
          <div className="onboarding-step onboarding-step--listen">
            <h1>Your first affirmation</h1>
            <p className="onboarding-preview-category">
              {focusCategories[0] ?? 'Self-Love'}
            </p>
            <p className="onboarding-preview-text">{previewText}</p>
            {voiceReady ? (
              <>
                <p className="onboarding-voice-note">
                  {previewPlaying ? 'Playing…' : 'Tap below to hear it again.'}
                </p>
                <IonButton expand="block" fill="outline" onClick={() => void playFirstAffirmation()}>
                  <IonIcon slot="start" icon={previewPlaying ? stopCircle : volumeHigh} />
                  {previewPlaying ? 'Playing…' : 'Hear again'}
                </IonButton>
                {previewError && (
                  <p className="onboarding-voice-note onboarding-preview-error">{previewError}</p>
                )}
              </>
            ) : (
              <p className="onboarding-voice-note">
                Voice will be available once premium is active.
              </p>
            )}
            <IonButton expand="block" onClick={() => setStep(2)}>
              Continue
              <IonIcon slot="end" icon={arrowForward} />
            </IonButton>
          </div>
        )}

        {currentStep === 'ready' && (
          <div className="onboarding-step">
            <h1>Almost ready</h1>
            <p>Name and reminders — adjust anytime in Settings.</p>
            <IonItem className="onboarding-input">
              <IonInput
                label="Your name (optional)"
                labelPlacement="stacked"
                placeholder="What should we call you?"
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem lines="none">
              <IonLabel>Voice affirmations</IonLabel>
              <IonToggle
                checked={voiceEnabled}
                onIonChange={(e) => setVoiceEnabled(e.detail.checked)}
              />
            </IonItem>
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
            <IonButton expand="block" onClick={() => void finish()}>
              Start My Journey
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
