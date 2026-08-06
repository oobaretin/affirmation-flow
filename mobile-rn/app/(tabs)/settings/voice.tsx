import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import SettingsBackHeader from '@/src/components/SettingsBackHeader';
import VoiceSettingsPanel from '@/src/components/VoiceSettingsPanel';
import { useSettings } from '@/src/context/SettingsContext';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsVoiceScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, updateSettings } = useSettings();

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SettingsBackHeader title="Voice" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.text }}>Voice affirmations</Text>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={(voiceEnabled) => updateSettings({ voiceEnabled })}
          />
        </View>
        {settings.voiceEnabled && (
          <VoiceSettingsPanel
            voiceStyle={settings.voiceStyle}
            elevenLabsVoiceId={settings.elevenLabsVoiceId}
            onStyleChange={(voiceStyle) => updateSettings({ voiceStyle })}
            onElevenLabsVoiceChange={(elevenLabsVoiceId) => updateSettings({ elevenLabsVoiceId })}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
