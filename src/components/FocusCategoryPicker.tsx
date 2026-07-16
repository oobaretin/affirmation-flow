import { IonCheckbox, IonItem, IonLabel } from '@ionic/react';
import { CATEGORIES } from '../data/affirmations';
import './FocusCategoryPicker.css';

type FocusCategoryPickerProps = {
  selected: string[];
  onChange: (categories: string[]) => void;
};

const FocusCategoryPicker: React.FC<FocusCategoryPickerProps> = ({ selected, onChange }) => {
  const toggleCategory = (category: string) => {
    onChange(
      selected.includes(category)
        ? selected.filter((item) => item !== category)
        : [...selected, category],
    );
  };

  return (
    <div className="focus-category-picker">
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
  );
};

export default FocusCategoryPicker;
