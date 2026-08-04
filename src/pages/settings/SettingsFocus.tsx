import { IonContent, IonPage } from '@ionic/react';
import FocusCategoryPicker from '../../components/FocusCategoryPicker';
import SettingsBackHeader from '../../components/SettingsBackHeader';
import { useCustomAffirmations } from '../../hooks/useCustomAffirmations';
import { useSettings } from '../../hooks/useSettings';
import { scheduleDailyNotification } from '../../services/notifications';
import '../Settings.css';

const SettingsFocus: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { custom } = useCustomAffirmations();

  const handleFocusChange = async (focusCategories: string[]) => {
    const updated = { ...settings, focusCategories };
    updateSettings({ focusCategories });
    if (settings.notificationsEnabled) {
      await scheduleDailyNotification(updated, custom);
    }
  };

  return (
    <IonPage>
      <SettingsBackHeader title="Focus Areas" />
      <IonContent fullscreen className="settings-content settings-detail-content">
        <div className="settings-detail-section">
          <FocusCategoryPicker
            variant="inline"
            selected={settings.focusCategories}
            onChange={(focusCategories) => void handleFocusChange(focusCategories)}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsFocus;
