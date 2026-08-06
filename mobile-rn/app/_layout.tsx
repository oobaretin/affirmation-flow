import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { CustomAffirmationsProvider } from '@/src/context/CustomAffirmationsContext';
import { FavoritesProvider } from '@/src/context/FavoritesContext';
import { SettingsProvider } from '@/src/context/SettingsContext';
import { SubscriptionProvider } from '@/src/context/SubscriptionContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SettingsProvider>
      <SubscriptionProvider>
        <CustomAffirmationsProvider>
          <FavoritesProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="paywall" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </FavoritesProvider>
        </CustomAffirmationsProvider>
      </SubscriptionProvider>
    </SettingsProvider>
  );
}
