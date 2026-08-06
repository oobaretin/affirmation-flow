import { ScrollView, StyleSheet, View } from 'react-native';

import FocusCategoryPicker from '@/src/components/FocusCategoryPicker';
import SettingsBackHeader from '@/src/components/SettingsBackHeader';
import { useCustomAffirmations } from '@/src/context/CustomAffirmationsContext';
import { useSettings } from '@/src/context/SettingsContext';
import { scheduleDailyNotification } from '@/src/services/notifications';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsFocusScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
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
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SettingsBackHeader title="Focus Areas" />
      <ScrollView contentContainerStyle={styles.content}>
        <FocusCategoryPicker
          selected={settings.focusCategories}
          onChange={(focusCategories) => void handleFocusChange(focusCategories)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
});
