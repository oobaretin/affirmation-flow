import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCustomAffirmations } from '@/src/context/CustomAffirmationsContext';
import { useFavorites } from '@/src/context/FavoritesContext';
import { useSettings } from '@/src/context/SettingsContext';
import type { Affirmation } from '@/src/data/affirmations';
import Colors from '@/src/theme/colors';
import { useColorScheme } from '@/components/useColorScheme';

type Filter = 'all' | 'favorites' | 'custom';

export default function SavedScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const { favorites, toggleFavorite } = useFavorites();
  const { custom, addCustom, removeCustom } = useCustomAffirmations();
  const { settings } = useSettings();
  const [filter, setFilter] = useState<Filter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const items = useMemo(() => {
    if (filter === 'favorites') return favorites;
    if (filter === 'custom') return custom;
    return [...favorites, ...custom];
  }, [custom, favorites, filter]);

  const saveCustom = () => {
    addCustom(draft);
    setDraft('');
    setModalOpen(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <View style={styles.filters}>
        {(['all', 'favorites', 'custom'] as Filter[]).map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, { backgroundColor: filter === value ? palette.tint : palette.card, borderColor: palette.border }]}
            onPress={() => setFilter(value)}>
            <Text style={{ color: filter === value ? '#fff' : palette.text, textTransform: 'capitalize' }}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>
            {filter === 'custom' ? 'No custom affirmations yet.' : 'Nothing saved yet. Tap ♥ on Today.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.rowText, { color: palette.text }]}>{item.text}</Text>
            <View style={styles.rowActions}>
              <Pressable onPress={() => toggleFavorite(item)}>
                <Text style={{ color: palette.tint, fontSize: 22 }}>♥</Text>
              </Pressable>
              {custom.some((entry) => entry.id === item.id) && (
                <Pressable onPress={() => removeCustom(item.id)}>
                  <Text style={{ color: palette.danger }}>Delete</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      />

      {(filter === 'all' || filter === 'custom') && (
        <Pressable style={[styles.addButton, { borderColor: palette.border }]} onPress={() => setModalOpen(true)}>
          <Text style={{ color: palette.tint, fontWeight: '600' }}>Add custom affirmation</Text>
        </Pressable>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Custom affirmation</Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="I am becoming the person I want to be."
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)}>
                <Text style={{ color: palette.muted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveCustom}>
                <Text style={{ color: palette.tint, fontWeight: '600' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {!settings.voiceEnabled && (
        <Text style={[styles.hint, { color: palette.muted }]}>Voice is off in Settings.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filters: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  row: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  rowText: { fontSize: 16, lineHeight: 24 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  addButton: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: { textAlign: 'center', paddingBottom: 12, fontSize: 13 },
});
