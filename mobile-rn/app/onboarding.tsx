import { useMemo, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettings } from '@/src/context/SettingsContext';
import { CATEGORIES, getDailyAffirmation } from '@/src/data/affirmations';
import { isElevenLabsConfigured } from '@/src/services/elevenLabs';
import { buildVoiceOptions } from '@/src/services/voiceProfiles';
import { previewVoice, stopSpeaking } from '@/src/services/voice';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

const STEPS = ['focus', 'listen', 'ready'] as const;
const MAX_FOCUS = 2;

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, completeOnboarding } = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focusCategories, setFocusCategories] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  if (settings.onboardingComplete) {
    return <Redirect href="/" />;
  }

  const previewText = useMemo(
    () => getDailyAffirmation([], focusCategories.length > 0 ? focusCategories : ['Self-Love']).text,
    [focusCategories],
  );

  const toggleCategory = (category: string) => {
    setFocusCategories((prev) => {
      if (prev.includes(category)) return prev.filter((item) => item !== category);
      if (prev.length >= MAX_FOCUS) return prev;
      return [...prev, category];
    });
  };

  const playPreview = async () => {
    if (!voiceEnabled || !isElevenLabsConfigured()) return;
    setPreviewPlaying(true);
    try {
      await previewVoice(previewText, buildVoiceOptions({ ...settings, voiceEnabled: true }));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Preview unavailable
    } finally {
      setPreviewPlaying(false);
    }
  };

  const finish = () => {
    stopSpeaking();
    completeOnboarding({
      name: name.trim(),
      focusCategories,
      voiceEnabled,
      notificationsEnabled,
      notificationHour: 8,
      notificationMinute: 0,
      repeatCount: 3,
      repeatMode: 'fixed',
    });
    router.replace('/');
  };

  const current = STEPS[step];

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <View style={styles.progressRow}>
        {STEPS.map((_, index) => (
          <View
            key={STEPS[index]}
            style={[
              styles.dot,
              { backgroundColor: index <= step ? palette.tint : palette.border },
            ]}
          />
        ))}
      </View>

      {current === 'focus' && (
        <>
          <Text style={[styles.title, { color: palette.text }]}>What matters to you?</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Pick up to two focus areas.</Text>
          {CATEGORIES.map((category) => {
            const selected = focusCategories.includes(category);
            return (
              <Pressable
                key={category}
                style={[styles.chip, { borderColor: selected ? palette.tint : palette.border, backgroundColor: palette.card }]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={{ color: selected ? palette.tint : palette.text }}>{category}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.primaryButton, { backgroundColor: palette.tint, opacity: focusCategories.length ? 1 : 0.5 }]}
            disabled={focusCategories.length === 0}
            onPress={() => setStep(1)}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </>
      )}

      {current === 'listen' && (
        <>
          <Text style={[styles.title, { color: palette.text }]}>Your first affirmation</Text>
          <Text style={[styles.category, { color: palette.tint }]}>{focusCategories[0] ?? 'Self-Love'}</Text>
          <Text style={[styles.affirmation, { color: palette.text }]}>{previewText}</Text>
          {voiceEnabled && isElevenLabsConfigured() && (
            <Pressable style={[styles.secondaryButton, { borderColor: palette.border }]} onPress={() => void playPreview()}>
              <Text style={{ color: palette.text }}>{previewPlaying ? 'Playing…' : 'Hear it'}</Text>
            </Pressable>
          )}
          <Pressable style={[styles.primaryButton, { backgroundColor: palette.tint }]} onPress={() => setStep(2)}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </>
      )}

      {current === 'ready' && (
        <>
          <Text style={[styles.title, { color: palette.text }]}>Almost ready</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name (optional)"
            placeholderTextColor={palette.muted}
            style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
          />
          <View style={[styles.row, { backgroundColor: palette.card }]}>
            <Text style={{ color: palette.text }}>Voice affirmations</Text>
            <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} />
          </View>
          <View style={[styles.row, { backgroundColor: palette.card }]}>
            <Text style={{ color: palette.text }}>Daily reminder</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          </View>
          <Pressable style={[styles.primaryButton, { backgroundColor: palette.tint }]} onPress={finish}>
            <Text style={styles.primaryButtonText}>Start My Journey</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, gap: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  title: { fontSize: 28, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
  category: { textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  affirmation: { fontSize: 24, lineHeight: 34, textAlign: 'center', fontWeight: '300', marginVertical: 12 },
  chip: { borderWidth: 1, borderRadius: 12, padding: 14 },
  row: { borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
});
