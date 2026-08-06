import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { PRIVACY_POLICY_URL } from '@/src/constants/app';
import {
  PAYWALL_FEATURES,
  SUBSCRIPTION_DISPLAY,
  SUBSCRIPTION_TRIAL_HEADLINE,
  YEARLY_MONTHLY_EQUIVALENT,
  buildSubscriptionLegal,
} from '@/src/constants/subscription';
import { useSettings } from '@/src/context/SettingsContext';
import { useSubscription } from '@/src/context/SubscriptionContext';
import { getDailyAffirmation } from '@/src/data/affirmations';
import { isElevenLabsConfigured } from '@/src/services/elevenLabs';
import {
  formatPackagePeriod,
  formatPackagePrice,
  formatPlanTrialNote,
  isSubscriptionDevBypass,
} from '@/src/services/subscription';
import { buildVoiceOptions } from '@/src/services/voiceProfiles';
import { isSpeaking, previewVoice, stopSpeaking } from '@/src/services/voice';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings } = useSettings();
  const {
    loading,
    purchasing,
    error,
    offering,
    isSubscribed,
    nativePurchasesEnabled,
    devBypassEnabled,
    purchase,
    restore,
    clearError,
  } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const previewText = useMemo(
    () => getDailyAffirmation([], settings.focusCategories).text,
    [settings.focusCategories],
  );
  const voiceReady = isElevenLabsConfigured() && settings.voiceEnabled;

  if (settings.onboardingComplete && isSubscribed && !loading) {
    return <Redirect href="/" />;
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} size="large" />
      </View>
    );
  }

  const monthlyPrice = formatPackagePrice(offering.monthly, 'monthly');
  const yearlyPrice = formatPackagePrice(offering.yearly, 'yearly');
  const selectedPrice = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;
  const canPurchase = nativePurchasesEnabled || devBypassEnabled;
  const greeting = settings.name
    ? `${settings.name}, listen to today's affirmation`
    : "Listen to today's affirmation";

  const finish = () => router.replace('/');

  const handlePurchase = async () => {
    clearError();
    const success = await purchase(selectedPlan);
    if (success) finish();
  };

  const handleRestore = async () => {
    clearError();
    const success = await restore();
    if (success) finish();
  };

  const handlePreview = async () => {
    if (previewPlaying) {
      stopSpeaking();
      setPreviewPlaying(false);
      return;
    }

    setPreviewError('');
    setPreviewPlaying(true);
    try {
      await previewVoice(previewText, buildVoiceOptions(settings));
    } catch {
      setPreviewError('Voice preview unavailable right now.');
    } finally {
      if (!isSpeaking()) setPreviewPlaying(false);
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.text }]}>Hear the difference</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        Natural premium voices bring your daily affirmations to life.
      </Text>
      <Text style={[styles.trialHeadline, { color: palette.tint }]}>{SUBSCRIPTION_TRIAL_HEADLINE}</Text>

      {voiceReady && (
        <View style={[styles.previewCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.previewLabel, { color: palette.muted }]}>{greeting}</Text>
          <Text style={[styles.previewText, { color: palette.text }]}>&ldquo;{previewText}&rdquo;</Text>
          <Pressable style={[styles.secondaryButton, { borderColor: palette.border }]} onPress={() => void handlePreview()}>
            <Text style={{ color: palette.text }}>{previewPlaying ? 'Stop Preview' : 'Hear Sample Voice'}</Text>
          </Pressable>
          {previewError ? <Text style={[styles.error, { color: palette.danger }]}>{previewError}</Text> : null}
        </View>
      )}

      {PAYWALL_FEATURES.map((feature) => (
        <Text key={feature} style={[styles.feature, { color: palette.text }]}>
          ✓ {feature}
        </Text>
      ))}

      <Pressable
        style={[
          styles.plan,
          { borderColor: selectedPlan === 'yearly' ? palette.tint : palette.border, backgroundColor: palette.card },
        ]}
        onPress={() => setSelectedPlan('yearly')}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planTitle, { color: palette.text }]}>{SUBSCRIPTION_DISPLAY.yearly.label}</Text>
          <Text style={[styles.badge, { color: palette.tint }]}>{SUBSCRIPTION_DISPLAY.yearly.savingsLabel}</Text>
        </View>
        <Text style={[styles.price, { color: palette.text }]}>
          {yearlyPrice}
          <Text style={{ color: palette.muted }}> / {formatPackagePeriod('yearly')}</Text>
        </Text>
        <Text style={[styles.planMeta, { color: palette.muted }]}>
          {YEARLY_MONTHLY_EQUIVALENT}/mo billed annually
        </Text>
        <Text style={[styles.planMeta, { color: palette.muted }]}>
          {formatPlanTrialNote('yearly', offering.yearly)}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.plan,
          { borderColor: selectedPlan === 'monthly' ? palette.tint : palette.border, backgroundColor: palette.card },
        ]}
        onPress={() => setSelectedPlan('monthly')}
      >
        <Text style={[styles.planTitle, { color: palette.text }]}>{SUBSCRIPTION_DISPLAY.monthly.label}</Text>
        <Text style={[styles.price, { color: palette.text }]}>
          {monthlyPrice}
          <Text style={{ color: palette.muted }}> / {formatPackagePeriod('monthly')}</Text>
        </Text>
        <Text style={[styles.planMeta, { color: palette.muted }]}>
          {formatPlanTrialNote('monthly', offering.monthly)}
        </Text>
      </Pressable>

      {!nativePurchasesEnabled && !devBypassEnabled && (
        <Text style={[styles.note, { color: palette.muted }]}>
          Add EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY and run with `npx expo run:ios` for App Store purchases. Expo Go does not support RevenueCat.
        </Text>
      )}

      {devBypassEnabled && isSubscriptionDevBypass() && (
        <Text style={[styles.note, { color: palette.muted }]}>Developer bypass is enabled for local testing.</Text>
      )}

      {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryButton, { backgroundColor: palette.tint, opacity: canPurchase && !purchasing ? 1 : 0.5 }]}
        disabled={!canPurchase || purchasing}
        onPress={() => void handlePurchase()}
      >
        <Text style={styles.primaryButtonText}>
          {purchasing ? 'Processing…' : devBypassEnabled ? 'Continue (dev bypass)' : 'Start 7-Day Free Trial'}
        </Text>
      </Pressable>

      <Pressable disabled={!canPurchase || purchasing} onPress={() => void handleRestore()}>
        <Text style={[styles.link, { color: palette.tint, opacity: canPurchase && !purchasing ? 1 : 0.5 }]}>
          Restore Purchases
        </Text>
      </Pressable>

      <Pressable onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
        <Text style={[styles.link, { color: palette.muted }]}>Privacy Policy</Text>
      </Pressable>

      <Text style={[styles.legal, { color: palette.muted }]}>
        {buildSubscriptionLegal(selectedPlan, selectedPrice)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  trialHeadline: { textAlign: 'center', fontWeight: '600', marginBottom: 4 },
  previewCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  previewLabel: { fontSize: 13, textAlign: 'center' },
  previewText: { fontSize: 18, lineHeight: 28, textAlign: 'center', fontWeight: '300' },
  secondaryButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  feature: { fontSize: 15, lineHeight: 22 },
  plan: { borderWidth: 2, borderRadius: 16, padding: 16, gap: 6 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 17, fontWeight: '600' },
  badge: { fontSize: 13, fontWeight: '700' },
  price: { fontSize: 24, fontWeight: '700' },
  planMeta: { fontSize: 13, lineHeight: 18 },
  note: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  error: { fontSize: 14, textAlign: 'center' },
  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 15, paddingVertical: 8 },
  legal: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
});
