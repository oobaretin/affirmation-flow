import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ELEVENLABS_VOICES } from '@/src/constants/elevenLabsVoices';
import { isElevenLabsConfigured } from '@/src/services/elevenLabs';
import { previewVoice } from '@/src/services/voice';
import { buildVoiceOptions, VOICE_PRESETS } from '@/src/services/voiceProfiles';
import type { UserSettings, VoiceStyle } from '@/src/types/settings';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type VoiceSettingsPanelProps = {
  voiceStyle: VoiceStyle;
  elevenLabsVoiceId: string;
  onStyleChange: (style: VoiceStyle) => void;
  onElevenLabsVoiceChange: (voiceId: string) => void;
};

const PREVIEW_TEXT = 'I am worthy of love, calm, and confidence. I release what no longer serves me.';

export default function VoiceSettingsPanel({
  voiceStyle,
  elevenLabsVoiceId,
  onStyleChange,
  onElevenLabsVoiceChange,
}: VoiceSettingsPanelProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [previewStatus, setPreviewStatus] = useState('');

  const playPreview = async () => {
    if (!isElevenLabsConfigured()) {
      setPreviewStatus('Add EXPO_PUBLIC_ELEVENLABS_API_KEY to preview voices.');
      return;
    }

    setPreviewStatus('Playing…');
    try {
      const settings = {
        voiceStyle,
        elevenLabsVoiceId,
        voiceEnabled: true,
      } as UserSettings;
      await previewVoice(PREVIEW_TEXT, buildVoiceOptions(settings));
      setPreviewStatus('');
    } catch {
      setPreviewStatus('Preview unavailable right now.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.muted }]}>Voice style</Text>
      <View style={styles.chipRow}>
        {(Object.keys(VOICE_PRESETS) as VoiceStyle[]).map((style) => {
          const active = voiceStyle === style;
          return (
            <Pressable
              key={style}
              style={[
                styles.chip,
                {
                  borderColor: active ? palette.tint : palette.border,
                  backgroundColor: active ? `${palette.tint}22` : palette.card,
                },
              ]}
              onPress={() => onStyleChange(style)}>
              <Text style={{ color: active ? palette.tint : palette.text }}>{VOICE_PRESETS[style].label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: palette.muted }]}>Narrator</Text>
      {ELEVENLABS_VOICES.map((voice) => {
        const active = elevenLabsVoiceId === voice.id;
        return (
          <Pressable
            key={voice.id}
            style={[
              styles.voiceRow,
              {
                borderColor: active ? palette.tint : palette.border,
                backgroundColor: palette.card,
              },
            ]}
            onPress={() => onElevenLabsVoiceChange(voice.id)}>
            <Text style={{ color: palette.text, fontWeight: active ? '600' : '400' }}>{voice.name}</Text>
            <Text style={{ color: palette.muted, fontSize: 13 }}>{voice.description}</Text>
          </Pressable>
        );
      })}

      <Pressable style={[styles.previewButton, { borderColor: palette.border }]} onPress={() => void playPreview()}>
        <Text style={{ color: palette.text }}>Preview voice</Text>
      </Pressable>
      {previewStatus ? <Text style={{ color: palette.muted, fontSize: 13 }}>{previewStatus}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  voiceRow: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  previewButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
