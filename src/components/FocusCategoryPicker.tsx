import { useState } from 'react';
import {
  IonAccordion,
  IonAccordionGroup,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonText,
} from '@ionic/react';
import { CATEGORIES } from '../data/affirmations';
import './FocusCategoryPicker.css';

type FocusCategoryPickerProps = {
  selected: string[];
  onChange: (categories: string[]) => void;
};

const FocusCategoryPicker: React.FC<FocusCategoryPickerProps> = ({ selected, onChange }) => {
  const [expanded, setExpanded] = useState<string | undefined>();

  const toggleCategory = (category: string) => {
    onChange(
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  };

  const summary =
    selected.length === 0
      ? 'None selected'
      : selected.length === CATEGORIES.length
        ? 'All areas'
        : `${selected.length} selected`;

  return (
    <IonAccordionGroup
      className="focus-category-accordion"
      value={expanded}
      onIonChange={(e) => setExpanded(e.detail.value as string | undefined)}
    >
      <IonAccordion value="focus-areas">
        <IonItem slot="header" color="light" lines="none">
          <IonLabel>
            <IonText color="medium">
              <h3 className="focus-category-heading">Focus Areas</h3>
            </IonText>
            <p className="focus-category-summary">{summary}</p>
          </IonLabel>
        </IonItem>
        <div slot="content" className="focus-category-picker">
          <p className="focus-category-hint">
            Your daily affirmation prefers these categories
          </p>
          {CATEGORIES.map((category) => (
            <IonItem key={category} lines="none" className="category-chip">
              <IonCheckbox
                checked={selected.includes(category)}
                onIonChange={() => toggleCategory(category)}
              />
              <IonLabel>{category}</IonLabel>
            </IonItem>
          ))}
        </div>
      </IonAccordion>
    </IonAccordionGroup>
  );
};

export default FocusCategoryPicker;
