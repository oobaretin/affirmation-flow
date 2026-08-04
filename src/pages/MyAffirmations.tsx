import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  add,
  createOutline,
  heart,
  heartOutline,
  shareOutline,
  stopCircle,
  sunny,
  trash,
  volumeHigh,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { CATEGORIES, type Affirmation } from '../data/affirmations';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { shareAffirmation } from '../services/share';
import { queueTodayAffirmation } from '../services/todaySelection';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { getActiveSpeechText, isSpeaking, resumeSpeakingIfInterrupted, speakAffirmation, stopSpeaking } from '../services/voice';
import './MyAffirmations.css';

const CATEGORY_ORDER: string[] = [...CATEGORIES, 'Custom'];

function groupByCategory(items: Affirmation[]): [string, Affirmation[]][] {
  const groups = new Map<string, Affirmation[]>();

  for (const item of items) {
    const category = item.category || 'Custom';
    const bucket = groups.get(category) ?? [];
    bucket.push(item);
    groups.set(category, bucket);
  }

  return [...groups.entries()].sort(([left], [right]) => {
    const leftIndex = CATEGORY_ORDER.indexOf(left);
    const rightIndex = CATEGORY_ORDER.indexOf(right);
    const normalizedLeft = leftIndex === -1 ? CATEGORY_ORDER.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? CATEGORY_ORDER.length : rightIndex;
    return normalizedLeft - normalizedRight || left.localeCompare(right);
  });
}

function AffirmationRow({
  affirmation,
  speakingId,
  voiceEnabled,
  saved,
  onUseToday,
  onSpeak,
  onShare,
  onToggleFavorite,
  onRemove,
}: {
  affirmation: Affirmation;
  speakingId: string | null;
  voiceEnabled: boolean;
  saved: boolean;
  onUseToday: (item: Affirmation) => void;
  onSpeak: (id: string, text: string) => void;
  onShare: (text: string) => void;
  onToggleFavorite: (item: Affirmation) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <IonItem lines="full" className="affirmation-row">
      <IonLabel className="ion-text-wrap">
        <h2 className="affirmation-row-text">{affirmation.text}</h2>
      </IonLabel>
      <div className="affirmation-row-actions" slot="end">
        <button
          type="button"
          className="affirmation-row-action"
          onClick={() => onUseToday(affirmation)}
          aria-label="Use on Today"
        >
          <IonIcon icon={sunny} />
        </button>
        <button
          type="button"
          className={`affirmation-row-action ${saved ? 'saved' : ''}`}
          onClick={() => onToggleFavorite(affirmation)}
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IonIcon icon={saved ? heart : heartOutline} />
        </button>
        {voiceEnabled && (
          <button
            type="button"
            className={`affirmation-row-action ${speakingId === affirmation.id ? 'active' : ''}`}
            onClick={() => onSpeak(affirmation.id, affirmation.text)}
            aria-label={speakingId === affirmation.id ? 'Stop speaking' : 'Speak affirmation'}
          >
            <IonIcon icon={speakingId === affirmation.id ? stopCircle : volumeHigh} />
          </button>
        )}
        <button
          type="button"
          className="affirmation-row-action"
          onClick={() => onShare(affirmation.text)}
          aria-label="Share affirmation"
        >
          <IonIcon icon={shareOutline} />
        </button>
        <button
          type="button"
          className="affirmation-row-action affirmation-row-action--delete"
          onClick={() => onRemove(affirmation.id)}
          aria-label="Delete affirmation"
        >
          <IonIcon icon={trash} />
        </button>
      </div>
    </IonItem>
  );
}

type CustomAffirmationFormProps = {
  onAdd: (text: string) => void;
};

const CustomAffirmationForm = memo(function CustomAffirmationForm({ onAdd }: CustomAffirmationFormProps) {
  const customInputRef = useRef<HTMLTextAreaElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState('');

  useEffect(() => {
    if (!modalOpen) return;
    const timer = window.setTimeout(() => {
      customInputRef.current?.focus();
      resumeSpeakingIfInterrupted();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleAddCustom = async () => {
    const resolved = customInputRef.current?.value.trim() ?? '';
    if (!resolved) return;

    onAdd(resolved);
    if (customInputRef.current) {
      customInputRef.current.value = '';
    }
    setSaveToast('Affirmation saved');
    setTimeout(() => setSaveToast(''), 2000);
    closeModal();

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleInputFocus = () => {
    window.setTimeout(() => resumeSpeakingIfInterrupted(), 100);
  };

  const openModal = () => {
    setModalOpen(true);
    window.setTimeout(() => resumeSpeakingIfInterrupted(), 150);
  };

  return (
    <>
      <div className="custom-add-trigger">
        <IonButton expand="block" fill="outline" onClick={openModal}>
          <IonIcon slot="start" icon={add} />
          Add custom affirmation
        </IonButton>
        {saveToast && <p className="custom-save-toast">{saveToast}</p>}
      </div>

      <IonModal
        isOpen={modalOpen}
        onDidDismiss={closeModal}
        initialBreakpoint={0.55}
        breakpoints={[0, 0.55, 0.85]}
        className="custom-add-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="clear" onClick={closeModal}>
                Cancel
              </IonButton>
            </IonButtons>
            <IonTitle>Custom affirmation</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={() => void handleAddCustom()}>
                Save
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="custom-add-modal-content">
          <textarea
            ref={customInputRef}
            className="custom-affirmation-input"
            placeholder="I am becoming the person I want to be."
            rows={5}
            autoComplete="off"
            autoCorrect="on"
            onFocus={handleInputFocus}
          />
        </IonContent>
      </IonModal>
    </>
  );
});

const MyAffirmations: React.FC = () => {
  const history = useHistory();
  const { settings } = useSettings();
  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const { custom, addCustom, removeCustom } = useCustomAffirmations();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const favoritesByCategory = useMemo(() => groupByCategory(favorites), [favorites]);

  const handleAddCustom = useCallback((text: string) => {
    addCustom(text);
  }, [addCustom]);

  useIonViewWillEnter(() => {
    if (!isSpeaking()) {
      setSpeakingId(null);
      return;
    }

    const activeText = getActiveSpeechText();
    const activeAffirmation = [...favorites, ...custom].find((item) => item.text === activeText);
    setSpeakingId(activeAffirmation?.id ?? null);
  });

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
      buildVoiceOptions(settings),
    );
    if (!isSpeaking()) setSpeakingId(null);
  };

  const handleUseToday = (affirmation: Affirmation) => {
    queueTodayAffirmation(affirmation, true);
    history.push('/today', { affirmation });
  };

  const handleRemoveFavorite = async (id: string) => {
    removeFavorite(id);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleRemoveCustom = async (id: string) => {
    removeCustom(id);
    if (isFavorite(id)) {
      removeFavorite(id);
    }
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Affirmations</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="my-affirmations-content" scrollY>
        <section className="my-affirmations-section">
          <h2>Favorites</h2>
          <p className="section-hint">
            Saved from Today — grouped by each line&apos;s focus area.
          </p>
          {favorites.length === 0 ? (
            <div className="my-affirmations-empty">
              <IonIcon icon={heart} aria-hidden="true" />
              <h3>No favorites yet</h3>
              <p>Tap the heart on Today to save affirmations here.</p>
            </div>
          ) : (
            favoritesByCategory.map(([category, items]) => (
              <div key={category} className="my-affirmations-category-group">
                <h3 className="my-affirmations-category-label">{category}</h3>
                <IonList>
                  {items.map((affirmation) => (
                    <AffirmationRow
                      key={affirmation.id}
                      affirmation={affirmation}
                      speakingId={speakingId}
                      voiceEnabled={settings.voiceEnabled}
                      saved
                      onUseToday={handleUseToday}
                      onSpeak={handleSpeak}
                      onShare={(text) => void shareAffirmation(text)}
                      onToggleFavorite={toggleFavorite}
                      onRemove={handleRemoveFavorite}
                    />
                  ))}
                </IonList>
              </div>
            ))
          )}
        </section>

        <section className="my-affirmations-section">
          <h2>Custom</h2>
          <CustomAffirmationForm onAdd={handleAddCustom} />
          {custom.length === 0 ? (
            <div className="my-affirmations-empty">
              <IonIcon icon={createOutline} aria-hidden="true" />
              <h3>No custom affirmations yet</h3>
              <p>Tap the button above to add your first one.</p>
            </div>
          ) : (
            <IonList>
              {custom.map((affirmation) => (
                <AffirmationRow
                  key={affirmation.id}
                  affirmation={affirmation}
                  speakingId={speakingId}
                  voiceEnabled={settings.voiceEnabled}
                  saved={isFavorite(affirmation.id)}
                  onUseToday={handleUseToday}
                  onSpeak={handleSpeak}
                  onShare={(text) => void shareAffirmation(text)}
                  onToggleFavorite={toggleFavorite}
                  onRemove={handleRemoveCustom}
                />
              ))}
            </IonList>
          )}
        </section>
      </IonContent>
    </IonPage>
  );
};

export default MyAffirmations;
