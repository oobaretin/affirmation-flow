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
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  play,
  refresh,
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
import { useFreePreview } from '../hooks/useFreePreview';
import { getTodayPracticeHint, type PracticeProgress } from '../types/settings';
import { useSettings } from '../hooks/useSettings';
import { useSubscription } from '../hooks/useSubscription';
import { shareAffirmation } from '../services/share';
import { generateNextAffirmation, isOpenAiConfigured } from '../services/aiAffirmations';
import { getStreak, getWeekPracticeHistory, recordPractice } from '../services/streak';
import {
  getPinnedAffirmationForToday,
  isPinnedToday,
} from '../services/todayAffirmation';
import { consumeQueuedTodayAffirmation } from '../services/todaySelection';
import { getSeenAffirmationIds, markAffirmationSeen } from '../services/seenAffirmations';
import {
  getTodayViewSession,
  markTodayAwaitingPlay,
  markTodayPracticeStarted,
  setTodayVoicePracticeActive,
} from '../services/todayViewSession';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { ensurePlaybackContinues, getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import { updateTodayWidget } from '../services/todayWidget';
import { getTimeAwareGreeting } from '../utils/greeting';
import './Today.css';

type TodayLocationState = {
  affirmation?: Affirmation;
};

const Today: React.FC = () => {
  const history = useHistory();
  const location = useLocation<TodayLocationState>();
  const { settings } = useSettings();
  const { isSubscribed } = useSubscription();
  const { freePreviewConsumed, consumeFreePreview } = useFreePreview();
  const { custom } = useCustomAffirmations();
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [voicePracticeActive, setVoicePracticeActive] = useState(
    () => getTodayViewSession().voicePracticeActive,
  );
  const [practiceStarted, setPracticeStarted] = useState(
    () => !getTodayViewSession().awaitingPlay,
  );
  const [streak, setStreak] = useState(0);
  const [weekHistory, setWeekHistory] = useState(() => getWeekPracticeHistory());
  const [toastMessage, setToastMessage] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [playProgress, setPlayProgress] = useState<PracticeProgress | null>(null);
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
    if (!affirmation) return;
    void updateTodayWidget({
      text: affirmation.text,
      category: affirmation.category,
    });
  }, [affirmation]);

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

  const finishFreePreviewIfNeeded = () => {
    if (isSubscribed || freePreviewConsumed) return;
    window.setTimeout(() => {
      consumeFreePreview();
    }, 1600);
  };

  const endVoicePractice = () => {
    setTodayVoicePracticeActive(false);
    setVoicePracticeActive(false);
    setPlayProgress(null);
  };

  const beginVoicePractice = () => {
    setTodayVoicePracticeActive(true);
    setVoicePracticeActive(true);
  };

  const handleStop = () => {
    stopSpeaking();
    endVoicePractice();
    setSessionComplete(true);
    finishFreePreviewIfNeeded();
    window.setTimeout(() => setSessionComplete(false), 3000);
  };

  const speakDailyAffirmation = (daily: Affirmation, onNaturalEnd?: () => void) => {
    if (!settings.voiceEnabled) return;

    beginVoicePractice();
    const unlimited = settings.repeatMode === 'unlimited';
    setPlayProgress(
      unlimited
        ? { current: 1, total: 0 }
        : { current: 1, total: settings.repeatCount },
    );
    speakAffirmation(
      daily.text,
      settings.repeatCount,
      () => {
        endVoicePractice();
        onNaturalEnd?.();
      },
      unlimited,
      voiceOptions,
      (progress) => setPlayProgress(progress),
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
    setWeekHistory(getWeekPracticeHistory());
    markTodayPracticeStarted(daily.id);
    setPracticeStarted(true);

    if (withVoice && settings.voiceEnabled) {
      speakDailyAffirmation(daily, () => {
        setSessionComplete(true);
        finishFreePreviewIfNeeded();
        window.setTimeout(() => setSessionComplete(false), 3000);
      });
    } else {
      finishFreePreviewIfNeeded();
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
      markAffirmationSeen(passed.id);
      markTodayAwaitingPlay(passed.id);
      setPracticeStarted(false);
      history.replace('/today');
      return;
    }

    const pinnedToday = getPinnedAffirmationForToday();
    if (pinnedToday) {
      setAffirmation(pinnedToday);
      markAffirmationSeen(pinnedToday.id);
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
      const daily = getDailyAffirmation(
        custom,
        settings.focusCategories,
        null,
        getSeenAffirmationIds(),
      );
      setAffirmation(daily);
      markAffirmationSeen(daily.id);
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
      const daily = getDailyAffirmation(
        custom,
        settings.focusCategories,
        pinnedToday,
        getSeenAffirmationIds(),
      );
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
        setWeekHistory(getWeekPracticeHistory());
        markTodayPracticeStarted(affirmation.id);
        setPracticeStarted(true);
      }
      speakDailyAffirmation(affirmation, () => {
        setSessionComplete(true);
        finishFreePreviewIfNeeded();
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
    setGenerateError('');
    setSessionComplete(false);

    try {
      const useAi = isOpenAiConfigured();
      const next = useAi
        ? await generateNextAffirmation(settings.focusCategories)
        : getRandomAffirmation(custom, settings.focusCategories, getSeenAffirmationIds());

      setAffirmation(next);
      markAffirmationSeen(next.id);
      void startPractice(next, settings.voiceEnabled);

      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics unavailable on web
      }
    } catch {
      setGenerateError("Couldn't generate another line. Try again.");
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
    const shared = await shareAffirmation(affirmation.text, affirmation.category);
    if (shared) {
      setToastMessage('Shared!');
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {
        // Haptics unavailable on web
      }
    }
  };

  const streakLabel = streak > 0
    ? `${streak} day streak`
    : 'Start your streak today';

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDots = weekHistory.map((day) => {
    const weekday = weekdayLabels[new Date(`${day.date}T12:00:00`).getDay()];
    return { ...day, weekday };
  });

  const practiceHint = getTodayPracticeHint(
    settings.voiceEnabled,
    settings.repeatMode,
    settings.repeatCount,
    voicePracticeActive ? playProgress : null,
  );

  const primaryLabel = voicePracticeActive
    ? 'Stop'
    : settings.voiceEnabled
      ? practiceStarted
        ? 'Listen again'
        : 'Listen now'
      : practiceStarted
        ? 'Practice again'
        : 'Begin today';

  const primaryIcon = voicePracticeActive
    ? stopCircle
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
            <div className="today-week" aria-label="This week's practice">
              {weekDots.map((day) => (
                <div
                  key={day.date}
                  className={`today-week-day${day.practiced ? ' practiced' : ''}${day.isToday ? ' today' : ''}`}
                >
                  <span>{day.weekday}</span>
                  <i />
                </div>
              ))}
            </div>
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
          {voicePracticeActive && playProgress && (
            <div
              className="today-listen-meter"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(
                ((playProgress.total > 0
                  ? (playProgress.current - 1 + (playProgress.fraction ?? 0)) / playProgress.total
                  : playProgress.fraction ?? 0) * 100),
              )}
              aria-label="Listening progress"
            >
              <div
                className="today-listen-meter-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (playProgress.total > 0
                        ? (playProgress.current - 1 + (playProgress.fraction ?? 0)) / playProgress.total
                        : playProgress.fraction ?? 0) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
          )}
          {practiceHint && !settings.voiceEnabled && (
            <p className="repeat-hint">{practiceHint}</p>
          )}
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
          {generateError && (
            <p className="today-generate-error">
              {generateError}{' '}
              <button
                type="button"
                className="today-generate-retry"
                onClick={() => void handleNewAffirmation()}
              >
                Retry
              </button>
            </p>
          )}
        </div>

        <IonToast
          isOpen={Boolean(toastMessage)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          onDidDismiss={() => setToastMessage('')}
        />
      </IonContent>
    </IonPage>
  );
};

export default Today;
