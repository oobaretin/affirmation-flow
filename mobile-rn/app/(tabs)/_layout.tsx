import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        headerStyle: { backgroundColor: palette.background },
        headerTitleStyle: { color: palette.text },
        tabBarStyle: { backgroundColor: palette.card },
      }}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
