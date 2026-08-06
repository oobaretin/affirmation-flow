import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type SettingsBackHeaderProps = {
  title: string;
};

export default function SettingsBackHeader({ title }: SettingsBackHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.header, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={[styles.back, { color: palette.tint }]}>Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { fontSize: 17, fontWeight: '500', minWidth: 48 },
  title: { fontSize: 17, fontWeight: '600' },
  spacer: { minWidth: 48 },
});
