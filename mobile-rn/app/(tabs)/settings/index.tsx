import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { APP_NAME, APP_VERSION, PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/src/constants/app';
import { useCustomAffirmations } from '@/src/context/CustomAffirmationsContext';
import { useFavorites } from '@/src/context/FavoritesContext';
import { useSettings } from '@/src/context/SettingsContext';
import { useSubscription } from '@/src/context/SubscriptionContext';
import {
  formatFocusSummary,
  formatRenewalDate,
  getHubSummary,
  getPracticeSummary,
} from '@/src/pages/settingsSummaries';
import { clearAllAppData } from '@/src/services/session';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type SettingsRowProps = {
  title: string;
  detail: string;
  path: string;
};

function SettingsRow({ title, detail, path }: SettingsRowProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}
      onPress={() => router.push(path as never)}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: palette.muted }]}>{detail}</Text>
      </View>
      <Text style={{ color: palette.muted }}>›</Text>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings, updateSettings, resetOnboarding, resetSettings } = useSettings();
  const { clearFavorites } = useFavorites();
  const { clearCustom } = useCustomAffirmations();
  const { status, isSubscribed } = useSubscription();

  const subscriptionSummary = isSubscribed
    ? `Premium ${status.plan === 'yearly' ? 'Annual' : 'Monthly'} · Renews ${formatRenewalDate(status.expirationDate)}`
    : 'Premium subscription required';

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data?',
      'This permanently deletes your profile, favorites, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            void clearAllAppData().then(() => {
              resetSettings();
              clearFavorites();
              clearCustom();
              router.replace('/onboarding');
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.summary, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.summaryLabel, { color: palette.tint }]}>Your practice</Text>
        <Text style={{ color: palette.text }}>{getHubSummary(settings)}</Text>
      </View>

      <Text style={[styles.groupLabel, { color: palette.muted }]}>Profile</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.fieldLabel, { color: palette.muted }]}>Your name</Text>
        <TextInput
          value={settings.name}
          onChangeText={(name) => updateSettings({ name })}
          placeholder="Optional"
          placeholderTextColor={palette.muted}
          style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        />
      </View>

      <Text style={[styles.groupLabel, { color: palette.muted }]}>Preferences</Text>
      <SettingsRow title="Account" detail={subscriptionSummary} path="/settings/subscription" />
      <SettingsRow
        title="Your Practice"
        detail={`${getPracticeSummary(settings)} · Voice & reminders`}
        path="/settings/practice"
      />
      <SettingsRow title="Focus Areas" detail={formatFocusSummary(settings.focusCategories)} path="/settings/focus" />

      <Text style={[styles.groupLabel, { color: palette.muted }]}>About</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={{ color: palette.text, fontWeight: '600' }}>{APP_NAME}</Text>
        <Text style={{ color: palette.muted }}>Version {APP_VERSION} · React Native preview</Text>
      </View>
      <Pressable
        style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
        <Text style={{ color: palette.text }}>Privacy Policy</Text>
        <Text style={{ color: palette.muted }}>›</Text>
      </Pressable>
      <Pressable
        style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}
        onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
        <Text style={{ color: palette.text }}>Contact Support</Text>
        <Text style={{ color: palette.muted }}>›</Text>
      </Pressable>

      <Text style={[styles.groupLabel, { color: palette.muted }]}>Advanced</Text>
      <Text style={[styles.hint, { color: palette.muted }]}>
        AffirmEaze stores everything locally on this device. There is no cloud account.
      </Text>
      <Pressable
        style={[styles.outlineButton, { borderColor: palette.border }]}
        onPress={() => {
          resetOnboarding();
          router.push('/onboarding');
        }}>
        <Text style={{ color: palette.text }}>Redo Onboarding</Text>
      </Pressable>
      <Pressable style={[styles.outlineButton, { borderColor: palette.danger }]} onPress={handleClearAll}>
        <Text style={{ color: palette.danger }}>Clear All Data & Start Over</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  summary: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
  summaryLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  groupLabel: { fontSize: 13, fontWeight: '600', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: { flex: 1, gap: 4, paddingRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowDetail: { fontSize: 14, lineHeight: 20 },
  hint: { fontSize: 14, lineHeight: 20 },
  outlineButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
