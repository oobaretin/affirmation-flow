import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import SettingsBackHeader from '@/src/components/SettingsBackHeader';
import { useCustomAffirmations } from '@/src/context/CustomAffirmationsContext';
import { useSettings } from '@/src/context/SettingsContext';
import { formatReminderHour } from '@/src/pages/settingsSummaries';
import { requestNotificationPermission, scheduleDailyNotification } from '@/src/services/notifications';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsRemindersScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, updateSettings } = useSettings();
  const { custom } = useCustomAffirmations();
  const [notificationHint, setNotificationHint] = useState('');

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotificationHint('Notifications are disabled. Enable them in iOS Settings → AffirmEaze → Notifications.');
        return;
      }
      setNotificationHint('');
    } else {
      setNotificationHint('');
    }

    const updated = { ...settings, notificationsEnabled: enabled };
    updateSettings({ notificationsEnabled: enabled });
    await scheduleDailyNotification(updated, custom);
  };

  const handleTimeChange = async (hour: number) => {
    const updated = { ...settings, notificationHour: hour };
    updateSettings({ notificationHour: hour });
    if (settings.notificationsEnabled) {
      await scheduleDailyNotification(updated, custom);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SettingsBackHeader title="Reminders" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hint, { color: palette.muted }]}>
          A gentle nudge to open AffirmEaze and practice your daily affirmation.
        </Text>
        <View style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.text }}>Daily reminder</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(enabled) => void handleNotificationToggle(enabled)}
          />
        </View>
        {notificationHint ? (
          <Text style={[styles.hint, { color: palette.danger }]}>{notificationHint}</Text>
        ) : null}
        {settings.notificationsEnabled && (
          <>
            <Text style={[styles.hint, { color: palette.muted }]}>
              Reminder time: {formatReminderHour(settings.notificationHour)}
            </Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperButton, { borderColor: palette.border }]}
                onPress={() => void handleTimeChange(Math.max(5, settings.notificationHour - 1))}>
                <Text style={{ color: palette.text, fontSize: 20 }}>−</Text>
              </Pressable>
              <Text style={{ color: palette.text, fontSize: 17, fontWeight: '600' }}>
                {formatReminderHour(settings.notificationHour)}
              </Text>
              <Pressable
                style={[styles.stepperButton, { borderColor: palette.border }]}
                onPress={() => void handleTimeChange(Math.min(22, settings.notificationHour + 1))}>
                <Text style={{ color: palette.text, fontSize: 20 }}>+</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  hint: { fontSize: 14, lineHeight: 20 },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepperButton: {
    borderWidth: 1,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
