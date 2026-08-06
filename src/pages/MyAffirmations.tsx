import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonActionSheet,
  IonButton,
  IonButtons,
  IonChip,
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
  ellipsisHorizontal,
  heart,
  heartOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { CATEGORIES, type Affirmation } from '../data/affirmations';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { shareAffirmation } from '../services/share';
import { queueTodayAffirmation } from '../services/todaySelection';
import { buildVoiceOptions } from '../services/voiceProfiles';
import { ensurePlaybackContinues, getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import './MyAffirmations.css';

type SavedFilter = 'all' | 'favorites' | 'custom';

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
  saved,
  onOpenActions,
  onToggleFavorite,
}: {
  affirmation: Affirmation;
  speakingId: string | null;
  saved: boolean;
  onOpenActions: (item: Affirmation) => void;
  onToggleFavorite: (item: Affirmation) => void;
}) {
  const isSpeakingRow = speakingId === affirmation.id;

  return (
    <IonItem
      button
      lines="full"
      className={`affirmation-row${isSpeakingRow ? ' affirmation-row--speaking' : ''}`}
      onClick={() => onOpenActions(affirmation)}
    >
      <IonLabel className="ion-text-wrap affirmation-row-label">
        <p className="affirmation-row-text">{affirmation.text}</p>
      </IonLabel>
      <IonButtons slot="end" className="affirmation-row-actions">
        <button
          type="button"
          className={`affirmation-row-action ${saved ? 'saved' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(affirmation);
          }}
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IonIcon icon={saved ? heart : heartOutline} />
        </button>
        <button
          type="button"
          className="affirmation-row-action"
          onClick={(event) => {
            event.stopPropagation();
            onOpenActions(affirmation);
          }}
          aria-label="More actions"
        >
          <IonIcon icon={ellipsisHorizontal} />
        </button>
      </IonButtons>
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
      ensurePlaybackContinues();
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
    window.setTimeout(() => ensurePlaybackContinues(), 100);
  };

  const handleInputChange = () => {
    window.setTimeout(() => ensurePlaybackContinues(), 50);
  };

  const openModal = () => {
    setModalOpen(true);
    window.setTimeout(() => ensurePlaybackContinues(), 150);
    window.setTimeout(() => ensurePlaybackContinues(), 400);
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
            onInput={handleInputChange}
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
  const [filter, setFilter] = useState<SavedFilter>('all');
  const [actionTarget, setActionTarget] = useState<Affirmation | null>(null);
  const favoritesByCategory = useMemo(() => groupByCategory(favorites), [favorites]);

  const handleFilterChange = useCallback((value: SavedFilter) => {
    setFilter(value);
    window.setTimeout(() => ensurePlaybackContinues(), 50);
  }, []);

  const handleAddCustom = useCallback((text: string) => {
    addCustom(text);
  }, [addCustom]);

  useIonViewWillEnter(() => {
    ensurePlaybackContinues();

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

  const isCustomAffirmation = (item: Affirmation) => custom.some((entry) => entry.id === item.id);

  const buildActionButtons = (item: Affirmation) => {
    const customItem = isCustomAffirmation(item);
    const speaking = speakingId === item.id;
    const buttons: Array<{
      text: string;
      role?: string;
      handler: () => void;
    }> = [
      {
        text: 'Use on Today',
        handler: () => handleUseToday(item),
      },
    ];

    if (settings.voiceEnabled) {
      buttons.push({
        text: speaking ? 'Stop speaking' : 'Speak',
        handler: () => {
          void handleSpeak(item.id, item.text);
        },
      });
    }

    buttons.push({
      text: 'Share',
      handler: () => {
        void shareAffirmation(item.text);
      },
    });

    if (customItem) {
      buttons.push({
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          void handleRemoveCustom(item.id);
        },
      });
    } else {
      buttons.push({
        text: 'Remove from Saved',
        role: 'destructive',
        handler: () => {
          void handleRemoveFavorite(item.id);
        },
      });
    }

    buttons.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {},
    });

    return buttons;
  };

  const showFavorites = filter === 'all' || filter === 'favorites';
  const showCustom = filter === 'all' || filter === 'custom';
  const emptyAll = favorites.length === 0 && custom.length === 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Saved</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="my-affirmations-content" scrollY>
        <div className="saved-filter-chips">
          {(['all', 'favorites', 'custom'] as SavedFilter[]).map((value) => (
            <IonChip
              key={value}
              outline={filter !== value}
              color={filter === value ? 'primary' : undefined}
              onClick={() => handleFilterChange(value)}
            >
              {value === 'all' ? 'All' : value === 'favorites' ? 'Favorites' : 'Custom'}
            </IonChip>
          ))}
        </div>

        {emptyAll ? (
          <>
            <div className="my-affirmations-empty">
              <IonIcon icon={heart} aria-hidden="true" />
              <h3>Nothing saved yet</h3>
              <p>Tap the heart on Today to save affirmations, or add your own below.</p>
            </div>
            <section className="my-affirmations-section">
              <CustomAffirmationForm onAdd={handleAddCustom} />
            </section>
          </>
        ) : (
          <>
            {showFavorites && favorites.length > 0 && (
              <section className="my-affirmations-section">
                {filter === 'all' && <h2>Favorites</h2>}
                {filter === 'favorites' && (
                  <p className="section-hint">Saved from Today, grouped by focus area.</p>
                )}
                {favoritesByCategory.map(([category, items]) => (
                  <div key={category} className="my-affirmations-category-group">
                    <h3 className="my-affirmations-category-label">{category}</h3>
                    <IonList lines="full" className="my-affirmations-list">
                      {items.map((affirmation) => (
                        <AffirmationRow
                          key={affirmation.id}
                          affirmation={affirmation}
                          speakingId={speakingId}
                          saved
                          onOpenActions={setActionTarget}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </IonList>
                  </div>
                ))}
              </section>
            )}

            {showFavorites && filter === 'favorites' && favorites.length === 0 && (
              <div className="my-affirmations-empty">
                <IonIcon icon={heart} aria-hidden="true" />
                <h3>No favorites yet</h3>
                <p>Tap the heart on Today to save affirmations here.</p>
              </div>
            )}

            {showCustom && (
              <section className="my-affirmations-section">
                {filter === 'all' && <h2>Custom</h2>}
                <CustomAffirmationForm onAdd={handleAddCustom} />
                {custom.length === 0 ? (
                  <div className="my-affirmations-empty">
                    <IonIcon icon={createOutline} aria-hidden="true" />
                    <h3>No custom affirmations yet</h3>
                    <p>Tap the button above to add your first one.</p>
                  </div>
                ) : (
                  <IonList lines="full" className="my-affirmations-list">
                    {custom.map((affirmation) => (
                      <AffirmationRow
                        key={affirmation.id}
                        affirmation={affirmation}
                        speakingId={speakingId}
                        saved={isFavorite(affirmation.id)}
                        onOpenActions={setActionTarget}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </IonList>
                )}
              </section>
            )}
          </>
        )}

        <IonActionSheet
          isOpen={Boolean(actionTarget)}
          onDidDismiss={() => setActionTarget(null)}
          header={actionTarget?.text}
          buttons={actionTarget ? buildActionButtons(actionTarget) : []}
        />
      </IonContent>
    </IonPage>
  );
};

export default MyAffirmations;
