import { useRef, useState } from 'react';
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
  pin,
  play,
  refresh,
  settingsOutline,
  shareOutline,
  stopCircle,
  volumeHigh,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import AppLogo from '../components/AppLogo';
import {
  getDailyAffirmation,
  getRandomAffirmation,
  type Affirmation,
} from '../data/affirmations';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { formatRepeatLabel } from '../types/settings';
import { useSettings } from '../hooks/useSettings';
import { shareAffirmation } from '../services/share';
import { getStreak, recordPractice } from '../services/streak';
import {
  getPinnedAffirmationForToday,
  isPinnedToday,
  pinAffirmationForToday,
} from '../services/todayAffirmation';
import { consumeQueuedTodayAffirmation } from '../services/todaySelection';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
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
  const [streak, setStreak] = useState(0);
  const [awaitingPlay, setAwaitingPlay] = useState(true);
  const [shareToast, setShareToast] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();
  const initializedRef = useRef(false);

  const greeting = settings.name ? `Hello, ${settings.name}` : 'Today';
  const pinned = isPinnedToday(affirmation?.id ?? '');
  const voiceOptions = buildVoiceOptions(settings);

  const handleStop = () => {
    stopSpeaking();
    setSpeaking(false);
  };

  const speakDailyAffirmation = (daily: Affirmation) => {
    if (!settings.voiceEnabled) return;

    stopSpeaking();
    const unlimited = settings.repeatMode === 'unlimited';
    speakAffirmation(
      daily.text,
      settings.repeatCount,
      () => setSpeaking(false),
      unlimited,
      voiceOptions,
    );
    setSpeaking(true);
  };

  const startPractice = async (daily: Affirmation, withVoice: boolean) => {
    const practice = recordPractice();
    setStreak(practice.currentStreak);
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
    setSpeaking(isSpeaking());
    setStreak(getStreak());

    const queued = consumeQueuedTodayAffirmation();
    const passed = queued?.affirmation ?? location.state?.affirmation;
    const shouldAutoPlay = queued?.autoPlay ?? Boolean(location.state?.affirmation);

    if (passed) {
      setAffirmation(passed);
      if (shouldAutoPlay) {
        void startPractice(passed, true);
      } else {
        setAwaitingPlay(true);
      }
      history.replace('/today');
      return;
    }

    const pinnedToday = getPinnedAffirmationForToday();
    if (pinnedToday) {
      setAffirmation(pinnedToday);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setAwaitingPlay(true);
      }
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      const daily = getDailyAffirmation(custom, settings.focusCategories);
      setAffirmation(daily);
      setAwaitingPlay(true);
    }
  });

  if (!affirmation) {
    return (
      <IonPage>
        <IonContent fullscreen className="today-content">
          <div className="today-loading">
            <IonSpinner name="crescent" />
            <p>Preparing your affirmation...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const saved = isFavorite(affirmation.id);

  const handleSpeak = async (target: Affirmation) => {
    if (!settings.voiceEnabled) return;
    setSpeaking(true);
    const unlimited = settings.repeatMode === 'unlimited';
    await speakAffirmation(target.text, settings.repeatCount, () => setSpeaking(false), unlimited, voiceOptions);
    if (!isSpeaking()) setSpeaking(false);
  };

  const handleBeginPractice = () => {
    void startPractice(affirmation, true);
  };

  const handleNewAffirmation = async () => {
    handleStop();
    setAffirmation(getRandomAffirmation(custom, settings.focusCategories));
    setAwaitingPlay(true);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
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
    if (speaking) {
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

  const handlePin = async () => {
    pinAffirmationForToday(affirmation);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
    }
  };

  const streakLabel = streak > 0
    ? `${streak} day streak 🔥`
    : 'Start your streak today ✨';

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

        <div className="affirmation-card">
          <p className="affirmation-category">
            {affirmation.category}
            {pinned && <span className="pinned-badge"> · Pinned today</span>}
          </p>
          <p className="affirmation-text">{affirmation.text}</p>
          {settings.voiceEnabled && !awaitingPlay && (
            <p className="repeat-hint">
              {settings.repeatMode === 'unlimited'
                ? 'Repeats until you stop'
                : `Repeats ${formatRepeatLabel(settings.repeatMode, settings.repeatCount)}`}
            </p>
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
              {!pinned && (
                <button
                  className="voice-btn"
                  onClick={handlePin}
                  aria-label="Pin for today"
                >
                  <IonIcon icon={pin} />
                </button>
              )}
              {settings.voiceEnabled && (
                <button
                  className={`voice-btn ${speaking ? 'active' : ''}`}
                  onClick={handleVoiceToggle}
                  aria-label={speaking ? 'Stop speaking' : 'Speak affirmation'}
                >
                  <IonIcon icon={speaking ? stopCircle : volumeHigh} />
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
              {settings.voiceEnabled ? 'Begin today\'s practice' : 'Begin today'}
            </IonButton>
          </div>
        )}

        {speaking && settings.voiceEnabled && (
          <div className="today-stop-section">
            <IonButton expand="block" color="danger" onClick={handleStop}>
              <IonIcon slot="start" icon={stopCircle} />
              Stop Affirmation
            </IonButton>
          </div>
        )}

        <div className="today-actions">
          <IonButton expand="block" fill="outline" onClick={handleNewAffirmation}>
            <IonIcon slot="start" icon={refresh} />
            New Affirmation
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Today;
