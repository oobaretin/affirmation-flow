import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSettings } from '@/src/context/SettingsContext';
import { useSubscription } from '@/src/context/SubscriptionContext';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Index() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { ready, settings } = useSettings();
  const { isSubscribed, loading: subscriptionLoading } = useSubscription();

  if (!ready || subscriptionLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (!settings.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (!isSubscribed) {
    return <Redirect href="/paywall" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
