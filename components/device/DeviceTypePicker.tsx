import { useState } from 'react'
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  TextInput, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { sortLegend } from '../../constants/legend'
import type { DeviceLegendEntry } from '../../constants/legend'

interface Props {
  legend: DeviceLegendEntry[]
  selectedId: string
  onSelect: (entry: DeviceLegendEntry) => void
  onClose: () => void
}

export default function DeviceTypePicker({ legend, selectedId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')

  const sorted = sortLegend(legend)
  const filtered = query.trim()
    ? sorted.filter(e =>
        e.code.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase())
      )
    : sorted

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>Device Type</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={s.searchRow}>
          <TextInput
            style={s.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search code or description…"
            placeholderTextColor={Colors.secondary}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {filtered.map(entry => {
            const isSelected = entry.id === selectedId
            return (
              <TouchableOpacity
                key={entry.id}
                style={[s.row, isSelected && s.rowSelected]}
                onPress={() => { onSelect(entry); onClose() }}
                activeOpacity={0.7}
              >
                <View style={[s.badge, entry.isStandard ? s.badgeStd : s.badgeCustom]}>
                  <Text style={[s.badgeText, entry.isStandard ? s.badgeTextStd : s.badgeTextCustom]}>
                    {entry.code}
                  </Text>
                </View>
                <Text style={[s.description, isSelected && s.descriptionSelected]} numberOfLines={2}>
                  {entry.description}
                </Text>
                {isSelected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          })}
          {filtered.length === 0 && (
            <Text style={s.empty}>No matching device types.</Text>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  cancelText: { fontSize: FontSize.lg, color: Colors.secondary },
  searchRow: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  search: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowSelected: { backgroundColor: Colors.accentSoft },
  badge: {
    minWidth: 48,
    borderRadius: Radii.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeStd: { backgroundColor: Colors.accentSoft },
  badgeCustom: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  badgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  badgeTextStd: { color: Colors.accent },
  badgeTextCustom: { color: Colors.primary },
  description: { flex: 1, fontSize: FontSize.md, color: Colors.primary, lineHeight: 20 },
  descriptionSelected: { color: Colors.accent, fontWeight: FontWeight.semibold },
  checkmark: { fontSize: FontSize.lg, color: Colors.accent, fontWeight: FontWeight.bold },
  empty: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: 'center',
    padding: Spacing.xxl,
  },
})
