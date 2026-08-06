import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/src/constants/app';
import { useSettings } from '@/src/context/SettingsContext';
import { useSubscription } from '@/src/context/SubscriptionContext';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PaywallScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { settings } = useSettings();
  const { isSubscribed, devBypassEnabled } = useSubscription();

  if (settings.onboardingComplete && isSubscribed) {
    return <Redirect href="/" />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text }]}>{APP_NAME} Premium</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        Natural premium voices, daily practice, saved affirmations, and reminders.
      </Text>
      {devBypassEnabled ? (
        <Pressable style={[styles.primaryButton, { backgroundColor: palette.tint }]} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Continue (dev bypass)</Text>
        </Pressable>
      ) : (
        <Text style={[styles.note, { color: palette.muted }]}>
          RevenueCat purchases will be wired here before TestFlight. For now, set EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS=true in mobile-rn/.env.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  note: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
