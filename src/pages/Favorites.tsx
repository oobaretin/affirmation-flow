import { useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { heart, shareOutline, stopCircle, sunny, trash, volumeHigh } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { shareAffirmation } from '../services/share';
import { getVoiceOptions } from '../services/voiceProfiles';
import { getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import './Favorites.css';

const Favorites: React.FC = () => {
  const history = useHistory();
  const { settings } = useSettings();
  const { favorites, removeFavorite } = useFavorites();
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useIonViewWillEnter(() => {
    if (!isSpeaking()) {
      setSpeakingId(null);
      return;
    }

    const activeText = getActiveSpeechText();
    const activeAffirmation = favorites.find((item) => item.text === activeText);
    setSpeakingId(activeAffirmation?.id ?? null);
  });

  const handleRemove = async (id: string) => {
    removeFavorite(id);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleSpeak = async (id: string, text: string) => {
    if (!settings.voiceEnabled) return;

    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    stopSpeaking();
    setSpeakingId(id);
    const unlimited = settings.repeatMode === 'unlimited';
    await speakAffirmation(
      text,
      settings.repeatCount,
      () => setSpeakingId(null),
      unlimited,
      getVoiceOptions(settings.voiceStyle, settings.voiceURI),
    );
    if (!isSpeaking()) setSpeakingId(null);
  };

  const handleShare = async (text: string) => {
    await shareAffirmation(text);
  };

  const handleUseToday = (affirmation: (typeof favorites)[number]) => {
    history.push('/today', { affirmation });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Favorites</IonTitle>
          </IonToolbar>
        </IonHeader>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={heart} className="empty-icon" />
            <h2>No favorites yet</h2>
            <p>Tap the heart on any affirmation to save it here.</p>
          </div>
        ) : (
          <IonList>
            {favorites.map((affirmation) => (
              <IonItemSliding key={affirmation.id}>
                <IonItem>
                  <IonLabel className="ion-text-wrap">
                    <p className="favorite-category">{affirmation.category}</p>
                    <h2>{affirmation.text}</h2>
                  </IonLabel>
                  <div className="favorite-actions" slot="end">
                    <button
                      className="favorite-action-btn"
                      onClick={() => handleUseToday(affirmation)}
                      aria-label="Use on Today"
                    >
                      <IonIcon icon={sunny} />
                    </button>
                    {settings.voiceEnabled && (
                      <button
                        className={`favorite-action-btn ${speakingId === affirmation.id ? 'active' : ''}`}
                        onClick={() => handleSpeak(affirmation.id, affirmation.text)}
                        aria-label={speakingId === affirmation.id ? 'Stop speaking' : 'Speak affirmation'}
                      >
                        <IonIcon icon={speakingId === affirmation.id ? stopCircle : volumeHigh} />
                      </button>
                    )}
                    <button
                      className="favorite-action-btn"
                      onClick={() => handleShare(affirmation.text)}
                      aria-label="Share affirmation"
                    >
                      <IonIcon icon={shareOutline} />
                    </button>
                  </div>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => handleRemove(affirmation.id)}
                  >
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Favorites;
