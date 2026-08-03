import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonCheckbox,
  IonChip,
  IonIcon,
  IonLabel,
  IonSpinner,
} from '@ionic/react';
import { checkmark, refresh, sparkles } from 'ionicons/icons';
import { CATEGORIES, type Category } from '../data/affirmations';
import {
  generateAffirmations,
  type GeneratedAffirmation,
} from '../services/aiAffirmations';
import './AiGenerator.css';

interface AiGeneratorProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  onSave: (affirmations: { text: string; category: string }[]) => number;
}

function formatCategoryList(categories: Category[]): string {
  if (categories.length === 0) return 'your categories';
  if (categories.length === 1) return categories[0];
  if (categories.length === 2) return `${categories[0]} and ${categories[1]}`;
  return `${categories.length} categories`;
}

const AiGenerator: React.FC<AiGeneratorProps> = ({
  categories,
  onCategoriesChange,
  onSave,
}) => {
  const [generated, setGenerated] = useState<GeneratedAffirmation[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [source, setSource] = useState<'ai' | 'local' | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const categoryLabel = useMemo(() => formatCategoryList(categories), [categories]);

  const toggleCategory = (nextCategory: Category) => {
    if (categories.includes(nextCategory)) {
      if (categories.length === 1) return;
      onCategoriesChange(categories.filter((category) => category !== nextCategory));
      return;
    }

    onCategoriesChange([...categories, nextCategory]);
  };

  const handleGenerate = async () => {
    if (categories.length === 0) return;

    setLoading(true);
    setSavedCount(0);
    try {
      const result = await generateAffirmations({
        categories,
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

    const toSave = indices
      .map((index) => generated[index])
      .filter(Boolean);

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
          <h3>Create Affirmations</h3>
          <p>Select categories, then generate lines to save.</p>
        </div>
      </div>

      <div className="ai-category-chips">
        {CATEGORIES.map((chipCategory) => (
          <IonChip
            key={chipCategory}
            color={categories.includes(chipCategory) ? 'primary' : 'medium'}
            outline={!categories.includes(chipCategory)}
            onClick={() => toggleCategory(chipCategory)}
          >
            <IonLabel>{chipCategory}</IonLabel>
          </IonChip>
        ))}
      </div>

      <IonButton
        expand="block"
        onClick={handleGenerate}
        disabled={loading || categories.length === 0}
      >
        {loading ? <IonSpinner name="crescent" /> : <IonIcon slot="start" icon={sparkles} />}
        {loading ? 'Generating...' : 'Generate Affirmations'}
      </IonButton>

      {source && generated.length > 0 && (
        <div className="ai-results" ref={resultsRef}>
          <p className="ai-source-label">
            {source === 'ai' ? 'Powered by AI' : 'Personalized for you'}
          </p>
          <p className="ai-scroll-hint">
            Select affirmations to save to {categoryLabel}
          </p>
          <div className="ai-results-scroll">
            <ul className="ai-results-list">
              {generated.map((affirmation, index) => (
                <li key={`${affirmation.category}-${index}-${affirmation.text}`} className="ai-result-item">
                  <div className="ai-result-row">
                    <IonCheckbox
                      checked={selected.has(index)}
                      onIonChange={() => toggleSelected(index)}
                    />
                    <div className="ai-result-copy">
                      <span className="ai-result-category">{affirmation.category}</span>
                      <span className="ai-result-text">{affirmation.text}</span>
                    </div>
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
              Save {selectedCount} affirmation{selectedCount === 1 ? '' : 's'}
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
          {savedCount} affirmation{savedCount === 1 ? '' : 's'} saved!
        </p>
      )}
    </div>
  );
};

export default AiGenerator;
