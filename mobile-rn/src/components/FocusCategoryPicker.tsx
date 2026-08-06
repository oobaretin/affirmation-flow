import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '@/src/data/affirmations';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type FocusCategoryPickerProps = {
  selected: string[];
  onChange: (categories: string[]) => void;
};

export default function FocusCategoryPicker({ selected, onChange }: FocusCategoryPickerProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const toggleCategory = (category: string) => {
    onChange(
      selected.includes(category) ? selected.filter((item) => item !== category) : [...selected, category],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: palette.muted }]}>
        Your daily affirmation prefers these categories
      </Text>
      {CATEGORIES.map((category) => {
        const active = selected.includes(category);
        return (
          <Pressable
            key={category}
            style={[
              styles.row,
              {
                borderColor: active ? palette.tint : palette.border,
                backgroundColor: palette.card,
              },
            ]}
            onPress={() => toggleCategory(category)}>
            <View style={[styles.checkbox, { borderColor: active ? palette.tint : palette.border, backgroundColor: active ? palette.tint : 'transparent' }]} />
            <Text style={{ color: palette.text }}>{category}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2 },
});
