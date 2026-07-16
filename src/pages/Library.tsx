import { useEffect, useMemo, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { add, heart, heartOutline, pin, sparkles, stopCircle, trash, volumeHigh } from 'ionicons/icons';
import {
  AFFIRMATIONS,
  CATEGORIES,
  type Affirmation,
  type Category,
} from '../data/affirmations';
import AiGenerator from '../components/AiGenerator';
import { useCustomAffirmations } from '../hooks/useCustomAffirmations';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { getVoiceOptions } from '../services/voiceProfiles';
import { getActiveSpeechText, isSpeaking, speakAffirmation, stopSpeaking } from '../services/voice';
import { pinAffirmationForToday, isPinnedToday } from '../services/todayAffirmation';
import './Library.css';

const CATEGORY_ICONS: Record<Category, string> = {
  'Self-Love': '💜',
  Confidence: '✨',
  Gratitude: '🙏',
  Peace: '🕊️',
  Abundance: '💫',
  Health: '🌿',
};

const Library: React.FC = () => {
  const { settings } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { custom, addCustom, addMany, removeCustom } = useCustomAffirmations();
  const [expanded, setExpanded] = useState<string | undefined>();
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Custom');
  const [showForm, setShowForm] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const myAffirmationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.focusCategories.length > 0) {
      setExpanded(settings.focusCategories[0]);
    }
  }, [settings.focusCategories]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (affirmation: Affirmation) => {
    if (!normalizedQuery) return true;
    return (
      affirmation.text.toLowerCase().includes(normalizedQuery)
      || affirmation.category.toLowerCase().includes(normalizedQuery)
    );
  };

  const filteredCustom = useMemo(
    () => custom.filter(matchesSearch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [custom, normalizedQuery],
  );

  const filteredByCategory = useMemo(() => {
    const result: Partial<Record<Category, Affirmation[]>> = {};
    CATEGORIES.forEach((category) => {
      const items = AFFIRMATIONS.filter((item) => item.category === category).filter(matchesSearch);
      if (items.length > 0) result[category] = items;
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedQuery]);

  const hasSearchResults =
    !normalizedQuery
    || filteredCustom.length > 0
    || Object.values(filteredByCategory).some((items) => (items?.length ?? 0) > 0);

  useIonViewWillEnter(() => {
    if (!isSpeaking()) {
      setSpeakingId(null);
      return;
    }

    const activeText = getActiveSpeechText();
    if (!activeText) {
      setSpeakingId(null);
      return;
    }

    const activeAffirmation = [...custom, ...AFFIRMATIONS].find((item) => item.text === activeText);
    setSpeakingId(activeAffirmation?.id ?? null);
  });

  const handleToggle = async (affirmation: Affirmation) => {
    toggleFavorite(affirmation);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleAddCustom = async (keepOpen = false) => {
    if (!newText.trim()) return;

    const lines = newText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      addMany(lines.map((text) => ({ text, category: newCategory })));
    } else {
      addCustom(newText, newCategory);
    }

    setNewText('');
    if (!keepOpen) setShowForm(false);
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // Haptics unavailable on web
    }
  };

  const handleSpeak = async (affirmation: Affirmation) => {
    if (speakingId === affirmation.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    stopSpeaking();
    setSpeakingId(affirmation.id);
    const unlimited = settings.repeatMode === 'unlimited';
    await speakAffirmation(
      affirmation.text,
      settings.repeatCount,
      () => setSpeakingId(null),
      unlimited,
      getVoiceOptions(settings.voiceStyle, settings.voiceURI),
    );
    if (!isSpeaking()) setSpeakingId(null);
  };

  const handleStopAll = () => {
    stopSpeaking();
    setSpeakingId(null);
  };

  const handleAiSave = (affirmations: { text: string; category: string }[]) => {
    const saved = addMany(affirmations);

    if (saved.length > 0) {
      setExpanded('Custom');
      setSaveToast(`${saved.length} saved to My Affirmations`);
      setTimeout(() => {
        if (myAffirmationsRef.current && typeof myAffirmationsRef.current.scrollIntoView === 'function') {
          myAffirmationsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }

    return saved.length;
  };

  const handlePin = async (affirmation: Affirmation) => {
    pinAffirmationForToday(affirmation);
    setSaveToast('Pinned for today');
    setTimeout(() => setSaveToast(''), 2000);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics unavailable on web
    }
  };

  const renderAffirmation = (affirmation: Affirmation, onDelete?: () => void) => {
    const saved = isFavorite(affirmation.id);
    const isActive = speakingId === affirmation.id;
    const pinned = isPinnedToday(affirmation.id);
    return (
      <IonItem key={affirmation.id} className="affirmation-item">
        <IonLabel className="ion-text-wrap">
          <p>{affirmation.text}</p>
          {pinned && <p className="library-pinned-label">Pinned for today</p>}
        </IonLabel>
        <button
          className={`pin-btn-sm ${pinned ? 'active' : ''}`}
          onClick={() => handlePin(affirmation)}
          aria-label="Pin for today"
        >
          <IonIcon icon={pin} />
        </button>
        {settings.voiceEnabled && (
          <button
            className={`speak-btn-sm ${isActive ? 'active' : ''}`}
            onClick={() => handleSpeak(affirmation)}
            aria-label={isActive ? 'Stop speaking' : 'Speak affirmation'}
          >
            <IonIcon icon={isActive ? stopCircle : volumeHigh} />
          </button>
        )}
        <button
          className={`favorite-btn-sm ${saved ? 'saved' : ''}`}
          onClick={() => handleToggle(affirmation)}
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
        >
          <IonIcon icon={saved ? heart : heartOutline} />
        </button>
        {onDelete && (
          <button
            className="delete-btn-sm"
            onClick={onDelete}
            aria-label="Delete affirmation"
          >
            <IonIcon icon={trash} />
          </button>
        )}
      </IonItem>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Library</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="library-content" scrollY>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Library</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
          placeholder="Search affirmations"
          debounce={150}
        />

        <div className="custom-section">
          <div className="library-action-row">
            <IonButton expand="block" fill="outline" onClick={() => setShowForm(!showForm)}>
              <IonIcon slot="start" icon={add} />
              Add Affirmations
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="secondary"
              onClick={() => setShowAi(!showAi)}
            >
              <IonIcon slot="start" icon={sparkles} />
              AI Generator
            </IonButton>
          </div>

          {speakingId && (
            <IonButton expand="block" color="danger" className="stop-all-btn" onClick={handleStopAll}>
              <IonIcon slot="start" icon={stopCircle} />
              Stop Speaking
            </IonButton>
          )}

          {showForm && (
            <div className="custom-form">
              <IonSelect
                label="Category"
                labelPlacement="stacked"
                value={newCategory}
                onIonChange={(e) => setNewCategory(e.detail.value)}
              >
                <IonSelectOption value="Custom">Custom</IonSelectOption>
                {CATEGORIES.map((category) => (
                  <IonSelectOption key={category} value={category}>
                    {category}
                  </IonSelectOption>
                ))}
              </IonSelect>
              <IonTextarea
                placeholder="Write one affirmation, or paste multiple (one per line)..."
                value={newText}
                onIonInput={(e) => setNewText(e.detail.value ?? '')}
                rows={4}
                autoGrow
              />
              <IonButton expand="block" onClick={() => handleAddCustom(false)} disabled={!newText.trim()}>
                Save to Library
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => handleAddCustom(true)}
                disabled={!newText.trim()}
              >
                Save & Add Another
              </IonButton>
            </div>
          )}

          {showAi && (
            <AiGenerator onSave={handleAiSave} />
          )}

          {saveToast && (
            <p className="library-save-toast">{saveToast}</p>
          )}
        </div>

        <div ref={myAffirmationsRef}>
        {normalizedQuery && !hasSearchResults ? (
          <div className="library-empty-search">
            <p>No affirmations match &ldquo;{searchQuery.trim()}&rdquo;</p>
          </div>
        ) : (
        <IonAccordionGroup
          value={expanded}
          onIonChange={(e) => setExpanded(e.detail.value as string | undefined)}
        >
          {custom.length > 0 && filteredCustom.length > 0 && (
            <IonAccordion value="Custom">
              <IonItem slot="header" color="light">
                <span className="category-icon" slot="start">✍️</span>
                <IonLabel>
                  <h2>My Affirmations</h2>
                  <p>{filteredCustom.length} custom</p>
                </IonLabel>
              </IonItem>
              <IonList slot="content">
                {filteredCustom.map((affirmation) =>
                  renderAffirmation(affirmation, () => removeCustom(affirmation.id)),
                )}
              </IonList>
            </IonAccordion>
          )}

          {CATEGORIES.map((category) => {
            const items = filteredByCategory[category];
            if (!items || items.length === 0) return null;
            return (
              <IonAccordion key={category} value={category}>
                <IonItem slot="header" color="light">
                  <span className="category-icon" slot="start">
                    {CATEGORY_ICONS[category]}
                  </span>
                  <IonLabel>
                    <h2>{category}</h2>
                    <p>{items.length} affirmations</p>
                  </IonLabel>
                </IonItem>
                <IonList slot="content">
                  {items.map((affirmation) => renderAffirmation(affirmation))}
                </IonList>
              </IonAccordion>
            );
          })}
        </IonAccordionGroup>
        )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Library;
