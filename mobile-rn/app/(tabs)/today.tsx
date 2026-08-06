import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useCustomAffirmations } from '@/src/context/CustomAffirmationsContext';
import { useFavorites } from '@/src/context/FavoritesContext';
import { useSettings } from '@/src/context/SettingsContext';
import { getDailyAffirmation, getRandomAffirmation, type Affirmation } from '@/src/data/affirmations';
import { generateNextAffirmation, isOpenAiConfigured } from '@/src/services/aiAffirmations';
import { getStreak, recordPractice } from '@/src/services/streak';
import { isPinnedToday } from '@/src/services/todayAffirmation';
import {
  getTodayViewSession,
  markTodayPracticeStarted,
  setTodayVoicePracticeActive,
} from '@/src/services/todayViewSession';
import { buildVoiceOptions } from '@/src/services/voiceProfiles';
import { isSpeaking, speakAffirmation, stopSpeaking } from '@/src/services/voice';
import { getTimeAwareGreeting } from '@/src/utils/greeting';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings } = useSettings();
  const { custom } = useCustomAffirmations();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [streak, setStreak] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [started, setStarted] = useState(false);

  const endVoice = useCallback(() => {
    setTodayVoicePracticeActive(false);
    setVoiceActive(false);
  }, []);

  const startPractice = useCallback(
    async (daily: Affirmation, withVoice: boolean) => {
      const practice = recordPractice();
      setStreak(practice.currentStreak);
      markTodayPracticeStarted(daily.id);
      setStarted(true);

      if (withVoice && settings.voiceEnabled) {
        setTodayVoicePracticeActive(true);
        setVoiceActive(true);
        try {
          await speakAffirmation(
            daily.text,
            settings.repeatCount,
            buildVoiceOptions(settings),
            () => {
              endVoice();
              setSessionComplete(true);
              setTimeout(() => setSessionComplete(false), 3000);
            },
            settings.repeatMode === 'unlimited',
          );
        } catch {
          endVoice();
        }
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [endVoice, settings],
  );

  useEffect(() => {
    const session = getTodayViewSession();
    if (session.initialized && session.affirmationId) {
      const pool = getDailyAffirmation(custom, settings.focusCategories);
      setAffirmation(pool);
      setStarted(!session.awaitingPlay);
      setStreak(getStreak());
      if (session.voicePracticeActive || isSpeaking()) {
        setVoiceActive(true);
      }
      return;
    }

    session.initialized = true;
    const daily = getDailyAffirmation(custom, settings.focusCategories);
    setAffirmation(daily);
    setStreak(getStreak());
    void startPractice(daily, settings.voiceEnabled);
  }, [custom, settings.focusCategories, settings.voiceEnabled, startPractice]);

  if (!affirmation) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  const saved = isFavorite(affirmation.id);
  const greeting = getTimeAwareGreeting(settings.name);

  const handlePrimary = async () => {
    if (voiceActive) {
      stopSpeaking();
      endVoice();
      return;
    }

    if (settings.voiceEnabled) {
      setVoiceActive(true);
      setTodayVoicePracticeActive(true);
      await speakAffirmation(
        affirmation.text,
        settings.repeatCount,
        buildVoiceOptions(settings),
        () => {
          endVoice();
          setSessionComplete(true);
          setTimeout(() => setSessionComplete(false), 3000);
        },
        settings.repeatMode === 'unlimited',
      );
      return;
    }

    await startPractice(affirmation, false);
  };

  const handleAnotherLine = async () => {
    if (generating) return;
    stopSpeaking();
    endVoice();
    setGenerating(true);
    try {
      const next = isOpenAiConfigured()
        ? await generateNextAffirmation(settings.focusCategories)
        : getRandomAffirmation(custom, settings.focusCategories);
      setAffirmation(next);
      setSessionComplete(false);
      await startPractice(next, settings.voiceEnabled);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Text style={[styles.greeting, { color: palette.text }]}>{greeting}</Text>
      {!sessionComplete && (
        <Text style={[styles.streak, { color: palette.muted }]}>
          {streak > 0 ? `${streak} day streak` : 'Start your streak today'}
        </Text>
      )}

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.category, { color: palette.tint }]}>
          {affirmation.category}
          {isPinnedToday(affirmation.id) ? ' · Pinned today' : ''}
        </Text>
        <Text style={[styles.affirmation, { color: palette.text }]}>{affirmation.text}</Text>
        {sessionComplete && <Text style={[styles.complete, { color: palette.tint }]}>Done for today</Text>}
      </View>

      <Pressable style={[styles.primaryButton, { backgroundColor: palette.tint }]} onPress={() => void handlePrimary()}>
        <Text style={styles.primaryButtonText}>
          {voiceActive ? 'Pause' : settings.voiceEnabled ? (started ? 'Listen again' : 'Listen now') : 'Begin today'}
        </Text>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable onPress={() => toggleFavorite(affirmation)}>
          <Text style={{ color: saved ? palette.danger : palette.muted, fontSize: 28 }}>{saved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => void handleAnotherLine()} disabled={generating}>
        <Text style={[styles.anotherLine, { color: palette.muted }]}>
          {generating ? 'Generating…' : 'Another line'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: '600', marginTop: 8 },
  streak: { marginTop: 4, marginBottom: 16, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 20, padding: 24, minHeight: 280, justifyContent: 'center' },
  category: { textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  affirmation: { textAlign: 'center', fontSize: 28, lineHeight: 38, fontWeight: '300' },
  complete: { textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '600' },
  primaryButton: { marginTop: 20, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryRow: { marginTop: 16, alignItems: 'center' },
  anotherLine: { marginTop: 20, textAlign: 'center', fontSize: 15 },
});
