import { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonCheckbox,
  IonChip,
  IonIcon,
  IonLabel,
  IonSpinner,
  IonTextarea,
} from '@ionic/react';
import { checkmark, refresh, sparkles } from 'ionicons/icons';
import { CATEGORIES } from '../data/affirmations';
import { generateAffirmations } from '../services/aiAffirmations';
import { useSettings } from '../hooks/useSettings';
import './AiGenerator.css';

interface AiGeneratorProps {
  onSave: (affirmations: { text: string; category: string }[]) => number;
}

const AiGenerator: React.FC<AiGeneratorProps> = ({ onSave }) => {
  const { settings } = useSettings();
  const [intention, setIntention] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    settings.focusCategories.length > 0 ? settings.focusCategories : ['Self-Love'],
  );
  const [generated, setGenerated] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<'ai' | 'local' | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.length > 1
          ? prev.filter((c) => c !== category)
          : prev
        : [...prev, category],
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSavedCount(0);
    try {
      const result = await generateAffirmations({
        categories: selectedCategories,
        intention: intention.trim() || undefined,
        count: 5,
      });
      setGenerated(result.affirmations);
      setSelected(new Set(result.affirmations.map((_, index) => index)));
      setSource(result.source);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (generated.length === 0) return;

    if (actionsRef.current && typeof actionsRef.current.scrollIntoView === 'function') {
      actionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [generated]);

  const toggleSelected = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size > 1) next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const saveAffirmations = (indices: number[]) => {
    if (indices.length === 0) return 0;

    const category = selectedCategories[0] ?? 'Custom';
    const toSave = indices
      .map((index) => generated[index])
      .filter(Boolean)
      .map((text) => ({ text, category }));

    const saved = onSave(toSave);
    setSavedCount((prev) => prev + saved);

    const remaining = generated.filter((_, index) => !indices.includes(index));
    const nextSelected = new Set<number>();
    remaining.forEach((_, index) => nextSelected.add(index));

    setGenerated(remaining);
    setSelected(nextSelected);
    if (remaining.length === 0) setSource(null);

    return saved;
  };

  const handleSaveSelected = () => {
    saveAffirmations([...selected]);
  };

  const handleSaveOne = (index: number) => {
    saveAffirmations([index]);
  };

  const selectedCount = selected.size;

  return (
    <div className="ai-generator">
      <div className="ai-generator-header">
        <IonIcon icon={sparkles} className="ai-generator-icon" />
        <div>
          <h3>AI Affirmation Generator</h3>
          <p>Personalized affirmations based on your focus areas</p>
        </div>
      </div>

      <IonTextarea
        placeholder="What do you want to focus on? e.g. morning confidence, career growth..."
        value={intention}
        onIonInput={(e) => setIntention(e.detail.value ?? '')}
        rows={2}
        autoGrow
        className="ai-intention-input"
      />

      <div className="ai-category-chips">
        {CATEGORIES.map((category) => (
          <IonChip
            key={category}
            color={selectedCategories.includes(category) ? 'primary' : 'medium'}
            outline={!selectedCategories.includes(category)}
            onClick={() => toggleCategory(category)}
          >
            <IonLabel>{category}</IonLabel>
          </IonChip>
        ))}
      </div>

      <IonButton expand="block" onClick={handleGenerate} disabled={loading}>
        {loading ? <IonSpinner name="crescent" /> : <IonIcon slot="start" icon={sparkles} />}
        {loading ? 'Generating...' : 'Generate Affirmations'}
      </IonButton>
      <p className="ai-privacy-note">
        Without an OpenAI API key, affirmations are generated locally. With a key, your intention may be sent to OpenAI.
      </p>

      {source && generated.length > 0 && (
        <div className="ai-results" ref={resultsRef}>
          <p className="ai-source-label">
            {source === 'ai' ? 'Powered by AI' : 'Personalized for you'}
          </p>
          <p className="ai-scroll-hint">Select affirmations to save, then tap Save to Library</p>
          <div className="ai-results-scroll">
            <ul className="ai-results-list">
              {generated.map((text, index) => (
                <li key={index} className="ai-result-item">
                  <div className="ai-result-row">
                    <IonCheckbox
                      checked={selected.has(index)}
                      onIonChange={() => toggleSelected(index)}
                    />
                    <span className="ai-result-text">{text}</span>
                  </div>
                  <IonButton
                    size="small"
                    fill="outline"
                    className="ai-save-one-btn"
                    onClick={() => handleSaveOne(index)}
                  >
                    <IonIcon slot="start" icon={checkmark} />
                    Save
                  </IonButton>
                </li>
              ))}
            </ul>
          </div>
          <div className="ai-results-actions" ref={actionsRef}>
            <IonButton expand="block" onClick={handleSaveSelected} disabled={selectedCount === 0}>
              <IonIcon slot="start" icon={checkmark} />
              Save {selectedCount} to Library
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={handleGenerate} disabled={loading}>
              <IonIcon slot="start" icon={refresh} />
              Regenerate
            </IonButton>
          </div>
        </div>
      )}

      {savedCount > 0 && (
        <p className="ai-saved-msg" style={{ color: 'var(--ion-color-success)' }}>
          {savedCount} affirmation{savedCount === 1 ? '' : 's'} saved to My Affirmations!
        </p>
      )}
    </div>
  );
};

export default AiGenerator;
