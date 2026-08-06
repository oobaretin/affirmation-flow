import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import RepeatSelector from '@/src/components/RepeatSelector';
import SettingsBackHeader from '@/src/components/SettingsBackHeader';
import { useSettings } from '@/src/context/SettingsContext';
import { getRemindersSummary, getVoiceSummary } from '@/src/pages/settingsSummaries';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsPracticeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, updateSettings } = useSettings();

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SettingsBackHeader title="Your Practice" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hint, { color: palette.muted }]}>
          How many times each affirmation repeats during a session.
        </Text>
        <RepeatSelector
          repeatMode={settings.repeatMode}
          repeatCount={settings.repeatCount}
          onModeChange={(mode) => updateSettings({ repeatMode: mode })}
          onCountChange={(count) => updateSettings({ repeatCount: count, repeatMode: 'fixed' })}
        />

        <Text style={[styles.groupLabel, { color: palette.muted }]}>Also in your practice</Text>
        <Pressable
          style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push('/settings/voice')}>
          <View>
            <Text style={[styles.rowTitle, { color: palette.text }]}>Voice</Text>
            <Text style={{ color: palette.muted }}>{getVoiceSummary(settings)}</Text>
          </View>
          <Text style={{ color: palette.muted }}>›</Text>
        </Pressable>
        <Pressable
          style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}
          onPress={() => router.push('/settings/reminders')}>
          <View>
            <Text style={[styles.rowTitle, { color: palette.text }]}>Reminders</Text>
            <Text style={{ color: palette.muted }}>{getRemindersSummary(settings)}</Text>
          </View>
          <Text style={{ color: palette.muted }}>›</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  hint: { fontSize: 14, lineHeight: 20 },
  groupLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
});
