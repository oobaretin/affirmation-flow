import { useLayoutEffect, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  play,
  refresh,
  settingsOutline,
  shareOutline,
  stopCircle,
  volumeHigh,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import AppLogoLoader from '../components/AppLogoLoader';
import { useMinimumLoaderDuration } from '../hooks/useMinimumLoaderDuration';
import {
  AFFIRMATIONS,
  getDailyAffirmation,
  getRandomAffirmation,
  type Affirmation,
} from '../data/affirmations';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { getTodayPracticeHint } from '../types/settings';
import { useSettings } from '../hooks/useSettings';
import { shareAffirmation } from '../services/share';
import { generateNextAffirmation, isOpenAiConfigured } from '../services/aiAffirmations';
import { getStreak, recordPractice } from '../services/streak';
import {
  getPinnedAffirmationForToday,
  isPinnedToday,
} from '../services/todayAffirmation';
import { consumeQueuedTodayAffirmation } from '../services/todaySelection';
import {
  getTodayViewSession,
  markTodayAwaitingPlay,
  markTodayPracticeStarted,
  setTodayVoicePracticeActive,
} from '../services/todayViewSession';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import './Today.css';

type TodayLocationState = {
  affirmation?: Affirmation;
};

const Today: React.FC = () => {
  const history = useHistory();
  const location = useLocation<TodayLocationState>();
  const { settings } = useSettings();
  const { custom } = useCustomAffirmations();
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [voicePracticeActive, setVoicePracticeActive] = useState(
    () => getTodayViewSession().voicePracticeActive,
  );
  const [streak, setStreak] = useState(0);
  const [awaitingPlay, setAwaitingPlay] = useState(() => getTodayViewSession().awaitingPlay);
  const [shareToast, setShareToast] = useState('');
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isFirstTodayVisit] = useState(() => !getTodayViewSession().initialized);
  const showTodayLoader = useMinimumLoaderDuration(
    !affirmation,
    isFirstTodayVisit ? undefined : 0,
  );

  const greeting = settings.name ? `Hello, ${settings.name}` : 'Today';
  const pinned = isPinnedToday(affirmation?.id ?? '');
  const voiceOptions = buildVoiceOptions(settings);

  const endVoicePractice = () => {
    setTodayVoicePracticeActive(false);
    setSpeaking(false);
    setVoicePracticeActive(false);
  };

  const beginVoicePractice = () => {
    setTodayVoicePracticeActive(true);
    setVoicePracticeActive(true);
    setSpeaking(true);
  };

  const handleStop = () => {
    stopSpeaking();
    endVoicePractice();
  };

  const speakDailyAffirmation = (daily: Affirmation) => {
    if (!settings.voiceEnabled) return;

    stopSpeaking();
    beginVoicePractice();
    const unlimited = settings.repeatMode === 'unlimited';
    speakAffirmation(
      daily.text,
      settings.repeatCount,
      () => endVoicePractice(),
      unlimited,
      voiceOptions,
    ).catch(() => {
      endVoicePractice();
    });
  };

  const startPractice = async (daily: Affirmation, withVoice: boolean) => {
    const practice = recordPractice();
    setStreak(practice.currentStreak);
    markTodayPracticeStarted(daily.id);
    setAwaitingPlay(false);

    if (withVoice && settings.voiceEnabled) {
      speakDailyAffirmation(daily);
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics unavailable on web
    }
  };

  useIonViewWillEnter(() => {
    const session = getTodayViewSession();
    const speakingNow = isSpeaking();
    const hasActiveSpeech = Boolean(getActiveSpeechText());
    const resumeVoicePractice = session.voicePracticeActive || speakingNow || hasActiveSpeech;

    if (resumeVoicePractice) {
      setVoicePracticeActive(true);
      setSpeaking(speakingNow || session.voicePracticeActive);
      setAwaitingPlay(false);
    } else {
      setAwaitingPlay(session.awaitingPlay);
    }

    setStreak(getStreak());

    const queued = consumeQueuedTodayAffirmation();
    const passed = queued?.affirmation ?? location.state?.affirmation;
    const shouldAutoPlay = queued?.autoPlay ?? Boolean(location.state?.affirmation);

    if (passed) {
      setAffirmation(passed);
      if (shouldAutoPlay) {
        void startPractice(passed, true);
      } else {
        markTodayAwaitingPlay(passed.id);
        setAwaitingPlay(true);
      }
      history.replace('/today');
      return;
    }

    const pinnedToday = getPinnedAffirmationForToday();
    if (pinnedToday) {
      setAffirmation(pinnedToday);
      if (!session.initialized) {
        session.initialized = true;
        if (!resumeVoicePractice) {
          markTodayAwaitingPlay(pinnedToday.id);
          setAwaitingPlay(true);
        }
      }
      return;
    }

    if (!session.initialized) {
      session.initialized = true;
      const daily = getDailyAffirmation(custom, settings.focusCategories);
      setAffirmation(daily);
      if (!resumeVoicePractice) {
        markTodayAwaitingPlay(daily.id);
        setAwaitingPlay(true);
      }
    }
  });

  useLayoutEffect(() => {
    if (affirmation) return;

    const pinnedToday = getPinnedAffirmationForToday();
    if (pinnedToday) {
      setAffirmation(pinnedToday);
      return;
    }

    const session = getTodayViewSession();
    if (!session.initialized) return;

    if (session.affirmationId) {
      const daily = getDailyAffirmation(custom, settings.focusCategories, pinnedToday);
      if (daily.id === session.affirmationId) {
        setAffirmation(daily);
        return;
      }

      const fromCustom = custom.find((item) => item.id === session.affirmationId);
      if (fromCustom) {
        setAffirmation(fromCustom);
        return;
      }

      const fromPool = [...AFFIRMATIONS, ...custom].find(
        (item) => item.id === session.affirmationId,
      );
      if (fromPool) {
        setAffirmation(fromPool);
      }
    }
  }, [affirmation, custom, settings.focusCategories]);

  if (showTodayLoader || !affirmation) {
    return (
      <IonPage>
        <IonContent fullscreen className="today-content">
          <AppLogoLoader />
        </IonContent>
      </IonPage>
    );
  }

  const saved = isFavorite(affirmation.id);

  const handleSpeak = async (target: Affirmation) => {
    if (!settings.voiceEnabled) return;
    beginVoicePractice();
    const unlimited = settings.repeatMode === 'unlimited';
    await speakAffirmation(
      target.text,
      settings.repeatCount,
      () => endVoicePractice(),
      unlimited,
      voiceOptions,
    );
    if (!isSpeaking() && !getActiveSpeechText()) {
      endVoicePractice();
    }
  };

  const handleBeginPractice = () => {
    void startPractice(affirmation, true);
  };

  const handleNewAffirmation = async () => {
    if (generatingAffirmation) return;

    handleStop();
    setGeneratingAffirmation(true);

    try {
      const useAi = isOpenAiConfigured();

      const next = useAi
        ? await generateNextAffirmation(settings.focusCategories)
        : getRandomAffirmation(custom, settings.focusCategories);

      markTodayAwaitingPlay(next.id);
      setAffirmation(next);
      setAwaitingPlay(true);

      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics unavailable on web
      }
    } catch {
      // Generation failed; leave current affirmation in place
    } finally {
      setGeneratingAffirmation(false);
    }
  };

  const handleToggleFavorite = async () => {
    toggleFavorite(affirmation);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleVoiceToggle = async () => {
    if (voicePracticeActive) {
      handleStop();
      return;
    }
    await handleSpeak(affirmation);
  };

  const handleShare = async () => {
    const shared = await shareAffirmation(affirmation.text);
    if (shared) {
      setShareToast('Shared!');
      setTimeout(() => setShareToast(''), 2000);
    }
  };

  const streakLabel = streak > 0
    ? `${streak} day streak 🔥`
    : 'Start your streak today ✨';

  const practiceHint = getTodayPracticeHint(
    settings.voiceEnabled,
    settings.repeatMode,
    settings.repeatCount,
  );
  const showStopButton = settings.voiceEnabled && voicePracticeActive;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" className="today-header-logo">
            <AppLogo size="xs" />
          </IonButtons>
          <IonTitle>{greeting}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/settings')} aria-label="Open settings">
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="today-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{greeting}</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="today-streak">
          <IonText color="primary">
            <p>{streakLabel}</p>
          </IonText>
        </div>

        <div className={`affirmation-card${voicePracticeActive ? ' affirmation-card--practice-active' : ''}`}>
          <p className="affirmation-category">
            {affirmation.category}
            {pinned && <span className="pinned-badge"> · Pinned today</span>}
          </p>
          <p className="affirmation-text">{affirmation.text}</p>
          {practiceHint && (
            <p className={`repeat-hint${voicePracticeActive ? ' repeat-hint--active' : ''}`}>
              {practiceHint}
            </p>
          )}
          {showStopButton && (
            <div className="today-stop-inline">
              <IonButton expand="block" color="danger" onClick={handleStop}>
                <IonIcon slot="start" icon={stopCircle} />
                Stop Affirmation
              </IonButton>
            </div>
          )}
          {!awaitingPlay && (
            <div className="today-actions-row">
              <button
                className={`favorite-btn ${saved ? 'saved' : ''}`}
                onClick={handleToggleFavorite}
                aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
              >
                <IonIcon icon={saved ? heart : heartOutline} />
              </button>
              <button
                className="voice-btn"
                onClick={handleShare}
                aria-label="Share affirmation"
              >
                <IonIcon icon={shareOutline} />
              </button>
              {settings.voiceEnabled && (
                <button
                  className={`voice-btn ${voicePracticeActive ? 'active' : ''}`}
                  onClick={handleVoiceToggle}
                  aria-label={voicePracticeActive ? 'Stop speaking' : 'Speak affirmation'}
                >
                  <IonIcon icon={voicePracticeActive ? stopCircle : volumeHigh} />
                </button>
              )}
            </div>
          )}
          {shareToast && <p className="today-share-toast">{shareToast}</p>}
        </div>

        {awaitingPlay && (
          <div className="today-begin-section">
            <IonButton expand="block" className="today-begin-btn" onClick={handleBeginPractice}>
              <IonIcon slot="start" icon={play} />
              {settings.voiceEnabled ? 'Listen now' : 'Begin today'}
            </IonButton>
          </div>
        )}

        <div className="today-actions">
          <IonButton
            expand="block"
            fill="outline"
            disabled={generatingAffirmation}
            onClick={() => void handleNewAffirmation()}
          >
            {generatingAffirmation ? (
              <IonSpinner name="crescent" slot="start" />
            ) : (
              <IonIcon slot="start" icon={refresh} />
            )}
            {generatingAffirmation ? 'Generating…' : 'New Affirmation'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Today;
