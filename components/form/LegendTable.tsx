import { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  TextInput, Alert, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { Divider } from '../primitives'
import type { DeviceLegendEntry } from '../../constants/legend'
import { sortLegend } from '../../constants/legend'

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function hasOptionalData(e: DeviceLegendEntry) {
  return !!(e.type || e.modelNo || e.manufacturer || e.sensitivityRange || e.sensitivityTestMethod)
}

// ─── Entry edit modal ─────────────────────────────────────────────────────────

interface EntryModalProps {
  entry: DeviceLegendEntry
  isNew?: boolean
  onSave: (e: DeviceLegendEntry) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

function EntryModal({ entry, isNew, onSave, onDelete, onClose }: EntryModalProps) {
  const [draft, setDraft] = useState(entry)

  const set = (key: keyof DeviceLegendEntry, val: string) =>
    setDraft(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    if (!draft.code.trim() || !draft.description.trim()) {
      Alert.alert('Required', 'Code and description are required.')
      return
    }
    onSave(draft)
  }

  const handleDelete = () => {
    Alert.alert('Remove Entry', `Remove "${draft.code} — ${draft.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete?.(draft.id) },
    ])
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={m.safe}>
        <View style={m.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={m.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={m.title}>{isNew ? 'Add Custom Type' : 'Entry Details'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={m.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={m.content}>
          {/* Code + Description */}
          <View style={m.card}>
            <Text style={m.sectionLabel}>Device Type</Text>
            <View style={m.row}>
              {draft.isStandard ? (
                <>
                  <View style={m.lockedBadge}>
                    <Text style={m.lockedBadgeText}>{draft.code}</Text>
                  </View>
                  <Text style={m.lockedDescription}>{draft.description}</Text>
                </>
              ) : (
                <>
                  <TextInput
                    style={[m.input, m.codeInput]}
                    value={draft.code}
                    onChangeText={v => set('code', v.toUpperCase())}
                    placeholder="CODE"
                    placeholderTextColor={Colors.secondary}
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                  <TextInput
                    style={[m.input, { flex: 1 }]}
                    value={draft.description}
                    onChangeText={v => set('description', v)}
                    placeholder="Description"
                    placeholderTextColor={Colors.secondary}
                  />
                </>
              )}
            </View>
          </View>

          {/* Optional documentation columns */}
          <View style={m.card}>
            <Text style={m.sectionLabel}>System Documentation (optional)</Text>
            <Text style={m.sectionNote}>
              Fill in what applies to this specific system. Multiple models can be noted with slashes (e.g. FST-851 / FST-851R).
            </Text>

            <Text style={m.fieldLabel}>Type</Text>
            <TextInput
              style={m.input}
              value={draft.type ?? ''}
              onChangeText={v => set('type', v)}
              placeholder="e.g. Photoelectric, Magnetic"
              placeholderTextColor={Colors.secondary}
            />

            <Divider />
            <Text style={m.fieldLabel}>Model No.</Text>
            <TextInput
              style={m.input}
              value={draft.modelNo ?? ''}
              onChangeText={v => set('modelNo', v)}
              placeholder="e.g. FST-851 / FST-851R"
              placeholderTextColor={Colors.secondary}
            />

            <Divider />
            <Text style={m.fieldLabel}>Manufacturer</Text>
            <TextInput
              style={m.input}
              value={draft.manufacturer ?? ''}
              onChangeText={v => set('manufacturer', v)}
              placeholder="e.g. System Sensor"
              placeholderTextColor={Colors.secondary}
            />

            <Divider />
            <Text style={m.fieldLabel}>Sensitivity Range</Text>
            <TextInput
              style={m.input}
              value={draft.sensitivityRange ?? ''}
              onChangeText={v => set('sensitivityRange', v)}
              placeholder="e.g. 1.0–2.5 %/ft"
              placeholderTextColor={Colors.secondary}
            />
          </View>

          {/* Sensitivity test info — S and DS only */}
          {draft.hasSensitivityTest && (
            <View style={m.card}>
              <Text style={m.sectionLabel}>Sensitivity Test (CAN/ULC-S529)</Text>
              <Text style={m.sectionNote}>
                Required range: 0.5–4.0 %/ft obscuration. Recorded units may differ depending on test method used.
              </Text>
              <Text style={m.fieldLabel}>Test Method / Equipment (Model / Method)</Text>
              <TextInput
                style={[m.input, m.inputMulti]}
                value={draft.sensitivityTestMethod ?? ''}
                onChangeText={v => set('sensitivityTestMethod', v)}
                placeholder="e.g. Magpointer Model 200, functional test per Annex C"
                placeholderTextColor={Colors.secondary}
                multiline
              />
            </View>
          )}

          {/* Delete (custom entries only) */}
          {!draft.isStandard && !isNew && onDelete && (
            <TouchableOpacity style={m.deleteBtn} onPress={handleDelete}>
              <Text style={m.deleteBtnText}>Remove Custom Entry</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

// ─── Legend table ─────────────────────────────────────────────────────────────

interface Props {
  legend: DeviceLegendEntry[]
  onLegendChange: (legend: DeviceLegendEntry[]) => void
}

export default function LegendTable({ legend, onLegendChange }: Props) {
  const [editingEntry, setEditingEntry] = useState<DeviceLegendEntry | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const sorted = sortLegend(legend)
  const standard = sorted.filter(e => e.isStandard)
  const custom = sorted.filter(e => !e.isStandard)

  const handleSave = (updated: DeviceLegendEntry) => {
    onLegendChange(legend.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(null)
  }

  const handleAdd = (entry: DeviceLegendEntry) => {
    onLegendChange([...legend, entry])
    setShowAddModal(false)
  }

  const handleDelete = (id: string) => {
    onLegendChange(legend.filter(e => e.id !== id))
    setEditingEntry(null)
  }

  const newCustomEntry = (): DeviceLegendEntry => ({
    id: newId(),
    code: '',
    description: '',
    isStandard: false,
  })

  const renderRow = (entry: DeviceLegendEntry, last: boolean) => {
    const filled = hasOptionalData(entry)
    return (
      <View key={entry.id}>
        <TouchableOpacity
          style={t.row}
          onPress={() => setEditingEntry(entry)}
          activeOpacity={0.7}
        >
          <View style={[t.codeBadge, entry.isStandard ? t.codeBadgeStd : t.codeBadgeCustom]}>
            <Text style={[t.codeText, entry.isStandard ? t.codeTextStd : t.codeTextCustom]}>
              {entry.code}
            </Text>
          </View>
          <Text style={t.description} numberOfLines={2}>{entry.description}</Text>
          {filled && <View style={t.filledDot} />}
          <Text style={t.chevron}>›</Text>
        </TouchableOpacity>
        {!last && <Divider />}
      </View>
    )
  }

  return (
    <View>
      {/* Standard entries */}
      <View style={t.card}>
        <Text style={t.groupLabel}>Standard — CAN/ULC-S536:2019</Text>
        {standard.map((e, i) => renderRow(e, i === standard.length - 1))}
      </View>

      {/* Custom entries */}
      <View style={t.card}>
        <View style={t.customHeader}>
          <Text style={t.groupLabel}>Custom</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Text style={t.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {custom.length === 0 && (
          <Text style={t.emptyText}>No custom types added.</Text>
        )}
        {custom.map((e, i) => renderRow(e, i === custom.length - 1))}
      </View>

      {editingEntry && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {showAddModal && (
        <EntryModal
          entry={newCustomEntry()}
          isNew
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </View>
  )
}

const t = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  groupLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  codeBadge: {
    minWidth: 48,
    borderRadius: Radii.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  codeBadgeStd: { backgroundColor: Colors.accentSoft },
  codeBadgeCustom: { backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  codeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  codeTextStd: { color: Colors.accent },
  codeTextCustom: { color: Colors.primary },
  description: { flex: 1, fontSize: FontSize.md, color: Colors.primary, lineHeight: 18 },
  filledDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.pass },
  chevron: { fontSize: 18, color: Colors.secondary },
})

const m = StyleSheet.create({
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
  doneText: { fontSize: FontSize.lg, color: Colors.accent, fontWeight: FontWeight.semibold },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionNote: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    lineHeight: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lockedBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  lockedBadgeText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.accent },
  lockedDescription: { flex: 1, fontSize: FontSize.md, color: Colors.secondary },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  codeInput: { width: 72, textAlign: 'center', fontWeight: FontWeight.bold },
  deleteBtn: {
    borderWidth: 1,
    borderColor: Colors.fail,
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  deleteBtnText: { color: Colors.fail, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
})
