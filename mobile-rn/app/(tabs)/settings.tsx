import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { APP_NAME, APP_VERSION } from '@/src/constants/app';
import { useSettings } from '@/src/context/SettingsContext';
import { formatFocusSummary, getHubSummary, getPracticeSummary } from '@/src/pages/settingsSummaries';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, updateSettings } = useSettings();

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={[styles.summary, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.tint }]}>Your practice</Text>
        <Text style={{ color: palette.text }}>{getHubSummary(settings)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.label, { color: palette.muted }]}>Your name</Text>
        <TextInput
          value={settings.name}
          onChangeText={(name) => updateSettings({ name })}
          placeholder="Optional"
          placeholderTextColor={palette.muted}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.row}>
          <Text style={{ color: palette.text }}>Voice affirmations</Text>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={(voiceEnabled) => updateSettings({ voiceEnabled })}
          />
        </View>
        <Text style={[styles.detail, { color: palette.muted }]}>
          Practice: {getPracticeSummary(settings)} · Focus: {formatFocusSummary(settings.focusCategories)}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontWeight: '600' }}>{APP_NAME}</Text>
        <Text style={{ color: palette.muted }}>Version {APP_VERSION} · React Native preview</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12 },
  summary: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  summaryLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detail: { fontSize: 14, lineHeight: 20 },
});
