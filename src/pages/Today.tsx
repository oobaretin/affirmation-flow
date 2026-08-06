import { useLayoutEffect, useEffect, useState } from 'react';
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
  pause,
  play,
  refresh,
  shareOutline,
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
import { ensurePlaybackContinues, getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import { getTimeAwareGreeting } from '../utils/greeting';
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
  const [voicePracticeActive, setVoicePracticeActive] = useState(
    () => getTodayViewSession().voicePracticeActive,
  );
  const [practiceStarted, setPracticeStarted] = useState(
    () => !getTodayViewSession().awaitingPlay,
  );
  const [streak, setStreak] = useState(0);
  const [shareToast, setShareToast] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isFirstTodayVisit] = useState(() => !getTodayViewSession().initialized);
  const loaderVisible = useMinimumLoaderDuration(
    !affirmation,
    isFirstTodayVisit ? undefined : 0,
  );
  const [introLoaderPhase, setIntroLoaderPhase] = useState<'visible' | 'exit' | 'hidden'>(
    isFirstTodayVisit ? 'visible' : 'hidden',
  );

  useEffect(() => {
    if (!isFirstTodayVisit || !affirmation) return;

    if (loaderVisible) {
      setIntroLoaderPhase('visible');
      return;
    }

    setIntroLoaderPhase('exit');
    const timer = window.setTimeout(() => setIntroLoaderPhase('hidden'), 480);
    return () => window.clearTimeout(timer);
  }, [affirmation, isFirstTodayVisit, loaderVisible]);

  const greeting = getTimeAwareGreeting(settings.name);
  const pinned = isPinnedToday(affirmation?.id ?? '');
  const voiceOptions = buildVoiceOptions(settings);

  const endVoicePractice = () => {
    setTodayVoicePracticeActive(false);
    setVoicePracticeActive(false);
  };

  const beginVoicePractice = () => {
    setTodayVoicePracticeActive(true);
    setVoicePracticeActive(true);
  };

  const handleStop = () => {
    stopSpeaking();
    endVoicePractice();
    setSessionComplete(true);
    window.setTimeout(() => setSessionComplete(false), 3000);
  };

  const speakDailyAffirmation = (daily: Affirmation, onNaturalEnd?: () => void) => {
    if (!settings.voiceEnabled) return;

    beginVoicePractice();
    const unlimited = settings.repeatMode === 'unlimited';
    speakAffirmation(
      daily.text,
      settings.repeatCount,
      () => {
        endVoicePractice();
        onNaturalEnd?.();
      },
      unlimited,
      voiceOptions,
    ).catch(() => {
      if (getTodayViewSession().voicePracticeActive) {
        ensurePlaybackContinues();
      } else {
        endVoicePractice();
      }
    });
  };

  const startPractice = async (daily: Affirmation, withVoice: boolean) => {
    const practice = recordPractice();
    setStreak(practice.currentStreak);
    markTodayPracticeStarted(daily.id);
    setPracticeStarted(true);

    if (withVoice && settings.voiceEnabled) {
      speakDailyAffirmation(daily, () => {
        setSessionComplete(true);
        window.setTimeout(() => setSessionComplete(false), 3000);
      });
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
      setPracticeStarted(true);
      ensurePlaybackContinues();
    } else {
      setPracticeStarted(!session.awaitingPlay);
    }

    setStreak(getStreak());

    const queued = consumeQueuedTodayAffirmation();
    const passed = queued?.affirmation ?? location.state?.affirmation;

    if (passed) {
      setAffirmation(passed);
      markTodayAwaitingPlay(passed.id);
      setPracticeStarted(false);
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
          setPracticeStarted(false);
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
        setPracticeStarted(false);
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

  if (!affirmation) {
    return (
      <IonPage>
        <IonContent fullscreen className="today-content">
          <AppLogoLoader />
        </IonContent>
      </IonPage>
    );
  }

  const saved = isFavorite(affirmation.id);

  const handlePrimaryAction = () => {
    if (voicePracticeActive) {
      handleStop();
      return;
    }

    if (settings.voiceEnabled) {
      if (!practiceStarted) {
        const practice = recordPractice();
        setStreak(practice.currentStreak);
        markTodayPracticeStarted(affirmation.id);
        setPracticeStarted(true);
      }
      speakDailyAffirmation(affirmation, () => {
        setSessionComplete(true);
        window.setTimeout(() => setSessionComplete(false), 3000);
      });
      return;
    }

    void startPractice(affirmation, false);
  };

  const handleNewAffirmation = async () => {
    if (generatingAffirmation) return;

    stopSpeaking();
    endVoicePractice();
    setGeneratingAffirmation(true);
    setSessionComplete(false);

    try {
      const useAi = isOpenAiConfigured();
      const next = useAi
        ? await generateNextAffirmation(settings.focusCategories)
        : getRandomAffirmation(custom, settings.focusCategories);

      setAffirmation(next);
      void startPractice(next, settings.voiceEnabled);

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

  const handleShare = async () => {
    const shared = await shareAffirmation(affirmation.text);
    if (shared) {
      setShareToast('Shared!');
      setTimeout(() => setShareToast(''), 2000);
    }
  };

  const streakLabel = streak > 0
    ? `${streak} day streak`
    : 'Start your streak today';

  const practiceHint = getTodayPracticeHint(
    settings.voiceEnabled,
    settings.repeatMode,
    settings.repeatCount,
  );

  const primaryLabel = voicePracticeActive
    ? 'Pause'
    : settings.voiceEnabled
      ? practiceStarted
        ? 'Listen again'
        : 'Listen now'
      : practiceStarted
        ? 'Practice again'
        : 'Begin today';

  const primaryIcon = voicePracticeActive
    ? pause
    : settings.voiceEnabled
      ? volumeHigh
      : play;

  if (isFirstTodayVisit && introLoaderPhase !== 'hidden') {
    return (
      <IonPage>
        <IonContent fullscreen className="today-content">
          <AppLogoLoader exiting={introLoaderPhase === 'exit'} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className={isFirstTodayVisit ? 'today-page--enter' : undefined}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" className="today-header-logo">
            <AppLogo size="xs" />
          </IonButtons>
          <IonTitle>{greeting}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="today-content">
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{greeting}</IonTitle>
          </IonToolbar>
        </IonHeader>

        {!sessionComplete && (
          <div className="today-streak">
            <IonText color="medium">
              <p>{streakLabel}</p>
            </IonText>
          </div>
        )}

        <div className={`affirmation-card${voicePracticeActive ? ' affirmation-card--practice-active' : ''}`}>
          <p className="affirmation-category">
            {affirmation.category}
            {pinned && <span className="pinned-badge"> · Pinned today</span>}
          </p>
          <p className="affirmation-text">{affirmation.text}</p>
          {sessionComplete && (
            <p className="today-session-complete">Done for today</p>
          )}
          {practiceHint && voicePracticeActive && (
            <p className="repeat-hint repeat-hint--active">{practiceHint}</p>
          )}
          {practiceHint && !settings.voiceEnabled && (
            <p className="repeat-hint">{practiceHint}</p>
          )}
          {shareToast && <p className="today-share-toast">{shareToast}</p>}
        </div>

        <div className="today-primary-section">
          <IonButton
            expand="block"
            className="today-primary-btn"
            onClick={handlePrimaryAction}
          >
            <IonIcon slot="start" icon={primaryIcon} />
            {primaryLabel}
          </IonButton>
        </div>

        <div className="today-secondary-actions">
          <button
            type="button"
            className={`today-secondary-btn ${saved ? 'saved' : ''}`}
            onClick={() => void handleToggleFavorite()}
            aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
          >
            <IonIcon icon={saved ? heart : heartOutline} />
          </button>
          <button
            type="button"
            className="today-secondary-btn"
            onClick={() => void handleShare()}
            aria-label="Share affirmation"
          >
            <IonIcon icon={shareOutline} />
          </button>
        </div>

        <div className="today-actions">
          <IonButton
            expand="block"
            fill="clear"
            size="small"
            className="today-another-line-btn"
            disabled={generatingAffirmation}
            onClick={() => void handleNewAffirmation()}
          >
            {generatingAffirmation ? (
              <IonSpinner name="crescent" slot="start" />
            ) : (
              <IonIcon slot="start" icon={refresh} />
            )}
            {generatingAffirmation ? 'Generating…' : 'Another line'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Today;
