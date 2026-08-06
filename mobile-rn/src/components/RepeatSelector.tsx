import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MANTRA_COUNTS, formatRepeatLabel, type RepeatMode } from '@/src/types/settings';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type RepeatSelectorProps = {
  repeatMode: RepeatMode;
  repeatCount: number;
  onModeChange: (mode: RepeatMode) => void;
  onCountChange: (count: number) => void;
};

export default function RepeatSelector({
  repeatMode,
  repeatCount,
  onModeChange,
  onCountChange,
}: RepeatSelectorProps) {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];

  const adjustCount = (delta: number) => {
    onModeChange('fixed');
    onCountChange(Math.min(108, Math.max(1, repeatCount + delta)));
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.display, { color: palette.text }]}>
        {formatRepeatLabel(repeatMode, repeatCount)}
      </Text>

      <Text style={[styles.label, { color: palette.muted }]}>Mantra counts</Text>
      <View style={styles.chipRow}>
        {MANTRA_COUNTS.map((count) => {
          const active = repeatMode === 'fixed' && repeatCount === count;
          return (
            <Pressable
              key={count}
              style={[
                styles.chip,
                {
                  borderColor: active ? palette.tint : palette.border,
                  backgroundColor: active ? `${palette.tint}22` : palette.card,
                },
              ]}
              onPress={() => {
                onModeChange('fixed');
                onCountChange(count);
              }}>
              <Text style={{ color: active ? palette.tint : palette.text }}>{count}x</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[
            styles.chip,
            {
              borderColor: repeatMode === 'unlimited' ? palette.tint : palette.border,
              backgroundColor: repeatMode === 'unlimited' ? `${palette.tint}22` : palette.card,
            },
          ]}
          onPress={() => onModeChange('unlimited')}>
          <Text style={{ color: repeatMode === 'unlimited' ? palette.tint : palette.text }}>Unlimited</Text>
        </Pressable>
      </View>

      {repeatMode === 'fixed' && (
        <View style={styles.stepperRow}>
          <Pressable style={[styles.stepperButton, { borderColor: palette.border }]} onPress={() => adjustCount(-1)}>
            <Text style={{ color: palette.text, fontSize: 20 }}>−</Text>
          </Pressable>
          <Text style={{ color: palette.text, fontSize: 17, fontWeight: '600' }}>{repeatCount}x</Text>
          <Pressable style={[styles.stepperButton, { borderColor: palette.border }]} onPress={() => adjustCount(1)}>
            <Text style={{ color: palette.text, fontSize: 20 }}>+</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  display: { fontSize: 28, fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepperButton: {
    borderWidth: 1,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
