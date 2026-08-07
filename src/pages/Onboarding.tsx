import { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonRange,
} from '@ionic/react';
import { arrowForward, checkmarkCircle, stopCircle, volumeHigh } from 'ionicons/icons';
import AppLogo from '../components/AppLogo';
import { ELEVENLABS_VOICES, DEFAULT_ELEVENLABS_VOICE_ID } from '../constants/elevenLabsVoices';
import { CATEGORIES, getDailyAffirmation } from '../data/affirmations';
import { useSettings } from '../hooks/useSettings';
import { requestNotificationPermission, scheduleDailyNotification } from '../services/notifications';
import { isElevenLabsConfigured } from '../services/elevenLabs';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { previewVoice, stopSpeaking } from '../services/voice';
import { DEFAULT_SETTINGS } from '../types/settings';
import './Onboarding.css';

const STEP_TITLES = ['Focus', 'Voice', 'Reminders'] as const;
const STEPS = ['focus', 'listen', 'ready'] as const;
const MAX_FOCUS_AREAS = 2;

const CATEGORY_BLURBS: Record<string, string> = {
  'Self-Love': 'Kindness toward yourself',
  Confidence: 'Stand in your strength',
  Gratitude: "Notice what's already good",
  Peace: 'Calm mind and body',
  Abundance: 'Open to possibility',
  Health: 'Care for your energy',
};

const Onboarding: React.FC = () => {
  const history = useHistory();
  const { completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focusCategories, setFocusCategories] = useState<string[]>([]);
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(DEFAULT_ELEVENLABS_VOICE_ID);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationHour, setNotificationHour] = useState(8);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [permissionHint, setPermissionHint] = useState('');

  const voiceReady = isElevenLabsConfigured();
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

  const playFirstAffirmation = async (voiceId = elevenLabsVoiceId) => {
    if (!voiceReady) return;

    setPreviewError('');
    setPreviewPlaying(true);
    const previewOptions = buildVoiceOptions({
      ...DEFAULT_SETTINGS,
      elevenLabsVoiceId: voiceId,
    });

    try {
      await previewVoice(previewText, previewOptions);
    } catch {
      setPreviewError('Voice preview unavailable right now.');
    } finally {
      setPreviewPlaying(false);
    }
  };

  const selectVoice = (voiceId: string) => {
    setElevenLabsVoiceId(voiceId);
    stopSpeaking();
    void playFirstAffirmation(voiceId);
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
      voiceEnabled: true,
      elevenLabsVoiceId,
      notificationsEnabled,
      notificationHour,
      notificationMinute: 0,
    };

    if (notificationsEnabled) {
      try {
        setPermissionHint('Allow notifications so we can nudge you at your chosen time.');
        const granted = await requestNotificationPermission();
        if (!granted) {
          settings.notificationsEnabled = false;
          setPermissionHint('Reminders stay off until you allow notifications in Settings.');
        } else {
          await scheduleDailyNotification({
            name: settings.name,
            notificationsEnabled: true,
            notificationHour: settings.notificationHour,
            notificationMinute: 0,
            focusCategories: settings.focusCategories,
          });
        }
      } catch {
        settings.notificationsEnabled = false;
      }
    }

    completeOnboarding(settings);
    history.replace('/today');
  };

  const currentStep = STEPS[step];
  const reminderLabel =
    notificationHour > 12
      ? `${notificationHour - 12}:00 PM`
      : `${notificationHour === 0 ? 12 : notificationHour}:00 ${notificationHour >= 12 ? 'PM' : 'AM'}`;

  return (
    <IonPage>
      <IonContent fullscreen className="onboarding-content">
        <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <span key={i} className={`dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>
        <p className="onboarding-step-label">{STEP_TITLES[step]}</p>

        {currentStep === 'focus' && (
          <div className="onboarding-step">
            <AppLogo size="lg" className="onboarding-logo" />
            <h1>What matters to you?</h1>
            <p>Pick up to two focus areas. We’ll shape your daily line around them.</p>
            <div className="focus-card-grid" role="group" aria-label="Focus areas">
              {CATEGORIES.map((category) => {
                const selected = focusCategories.includes(category);
                const disabled = !selected && focusCategories.length >= MAX_FOCUS_AREAS;
                return (
                  <button
                    key={category}
                    type="button"
                    className={`focus-card${selected ? ' selected' : ''}`}
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="focus-card-title">{category}</span>
                    <span className="focus-card-blurb">{CATEGORY_BLURBS[category]}</span>
                    {selected && (
                      <IonIcon className="focus-card-check" icon={checkmarkCircle} aria-hidden="true" />
                    )}
                  </button>
                );
              })}
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
            <h1>Choose your voice</h1>
            <p className="onboarding-preview-category">
              {focusCategories[0] ?? 'Self-Love'}
            </p>
            <p className="onboarding-preview-text">{previewText}</p>
            {voiceReady ? (
              <>
                <p className="onboarding-voice-note">
                  {previewPlaying ? 'Playing…' : 'Tap a voice to hear this line.'}
                </p>
                <div className="onboarding-voice-chips" role="radiogroup" aria-label="Voice">
                  {ELEVENLABS_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      type="button"
                      role="radio"
                      aria-checked={elevenLabsVoiceId === voice.id}
                      className={`onboarding-voice-chip${elevenLabsVoiceId === voice.id ? ' selected' : ''}`}
                      onClick={() => selectVoice(voice.id)}
                    >
                      <strong>{voice.name}</strong>
                      <span>{voice.description}</span>
                    </button>
                  ))}
                </div>
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
                Voice preview isn’t configured on this build yet. You can still continue.
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
            <h1>Make it yours</h1>
            <p>A name for greetings, and a gentle daily nudge — both optional.</p>
            <IonItem className="onboarding-input">
              <IonInput
                label="Your name (optional)"
                labelPlacement="stacked"
                placeholder="What should we call you?"
                value={name}
                onIonInput={(e) => setName(e.detail.value ?? '')}
              />
            </IonItem>

            <div className="onboarding-reminder-card">
              <div className="onboarding-reminder-header">
                <div>
                  <strong>Daily reminder</strong>
                  <p>
                    A quiet nudge at your time so today’s affirmation doesn’t get lost.
                  </p>
                </div>
                <button
                  type="button"
                  className={`onboarding-reminder-toggle${notificationsEnabled ? ' on' : ''}`}
                  aria-pressed={notificationsEnabled}
                  onClick={() => setNotificationsEnabled((prev) => !prev)}
                >
                  {notificationsEnabled ? 'On' : 'Off'}
                </button>
              </div>
              {notificationsEnabled && (
                <>
                  <p className="time-label">Reminder time</p>
                  <IonRange
                    min={5}
                    max={22}
                    step={1}
                    value={notificationHour}
                    onIonChange={(e) => setNotificationHour(e.detail.value as number)}
                    pin
                  />
                  <p className="time-display">{reminderLabel}</p>
                </>
              )}
            </div>

            {permissionHint && (
              <p className="onboarding-voice-note">{permissionHint}</p>
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
