import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import SettingsBackHeader from '@/src/components/SettingsBackHeader';
import { useSubscription } from '@/src/context/SubscriptionContext';
import { formatRenewalDate } from '@/src/pages/settingsSummaries';
import { openManageSubscriptions } from '@/src/services/subscription';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsSubscriptionScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { status, purchasing, restore, isSubscribed } = useSubscription();

  const planLabel = status.plan === 'yearly' ? 'Annual' : 'Monthly';
  const summary = isSubscribed
    ? `Premium ${planLabel} · Renews ${formatRenewalDate(status.expirationDate)}`
    : 'Premium subscription required';

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <SettingsBackHeader title="Subscription" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: palette.muted }]}>{summary}</Text>
        <Text style={[styles.hint, { color: palette.muted }]}>
          Manage billing, change plans, or cancel anytime through your Apple ID.
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: palette.tint }]}
          onPress={() => openManageSubscriptions()}>
          <Text style={styles.primaryButtonText}>Manage Subscription</Text>
        </Pressable>
        <Pressable
          style={styles.textButton}
          disabled={purchasing}
          onPress={() => void restore()}>
          {purchasing ? (
            <ActivityIndicator color={palette.tint} />
          ) : (
            <Text style={{ color: palette.tint, fontSize: 16, fontWeight: '600' }}>Restore Purchases</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  lead: { fontSize: 16, lineHeight: 24 },
  hint: { fontSize: 14, lineHeight: 20 },
  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  textButton: { paddingVertical: 12, alignItems: 'center' },
});
