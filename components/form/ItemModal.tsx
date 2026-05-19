import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, ScrollView, StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { FieldLabel, Divider } from '../primitives'
import DateField from '../fields/DateField'
import TriStateField from '../fields/TriStateField'
import type { FieldDefinition } from '../../schema/types'
import type { TriStateVal } from '../fields'

export type ItemValues = Record<string, string>

interface Props {
  fields: FieldDefinition[]
  values: ItemValues
  isNew: boolean
  onUpdate: (values: ItemValues) => void
  onSave: () => void
  onCancel: () => void
}

// ─── Controlled field renderer ────────────────────────────────────────────────

function ControlledField({
  field,
  values,
  onUpdate,
}: {
  field: FieldDefinition
  values: ItemValues
  onUpdate: (values: ItemValues) => void
}) {
  const required = field.required !== false
  const value = values[field.id] ?? ''
  const set = (v: string) => onUpdate({ ...values, [field.id]: v })

  if (field.auto_increment) {
    return (
      <View style={f.readOnlyRow}>
        <Text style={f.readOnlyLabel}>{field.label}</Text>
        <Text style={f.readOnlyValue}>{value || '—'}</Text>
      </View>
    )
  }

  switch (field.type) {
    case 'date':
      return <DateField label={field.label} required={required} value={value} onChange={set} />

    case 'tri_state':
      return (
        <TriStateField
          label={field.label}
          required={required}
          value={(value as TriStateVal) || null}
          onChange={v => set(v ?? '')}
        />
      )

    case 'boolean_yn': {
      const opts: { label: string; val: string }[] = [
        { label: 'Yes', val: 'yes' },
        { label: 'No', val: 'no' },
      ]
      return (
        <View style={f.fieldBlock}>
          <FieldLabel label={field.label} required={required} />
          <View style={f.optionRow}>
            {opts.map(o => (
              <TouchableOpacity
                key={o.val}
                style={[f.optionBtn, value === o.val && f.optionBtnActive]}
                onPress={() => set(o.val)}
              >
                <Text style={[f.optionText, value === o.val && f.optionTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    }

    case 'radio': {
      const opts = field.options ?? []
      return (
        <View style={f.fieldBlock}>
          <FieldLabel label={field.label} required={required} />
          <View style={f.optionRow}>
            {opts.map(o => (
              <TouchableOpacity
                key={o}
                style={[f.optionBtn, value === o && f.optionBtnActive]}
                onPress={() => set(o)}
              >
                <Text style={[f.optionText, value === o && f.optionTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    }

    case 'textarea':
      return (
        <View style={f.fieldBlock}>
          <FieldLabel label={field.label} required={required} />
          <TextInput
            style={[f.input, f.inputMulti]}
            value={value}
            onChangeText={set}
            placeholder="Enter value…"
            placeholderTextColor={Colors.secondary}
            multiline
            textAlignVertical="top"
          />
        </View>
      )

    case 'integer':
    case 'number':
      return (
        <View style={f.fieldBlock}>
          <FieldLabel label={field.label} required={required} />
          <TextInput
            style={f.input}
            value={value}
            onChangeText={set}
            placeholder="0"
            placeholderTextColor={Colors.secondary}
            keyboardType="numeric"
          />
        </View>
      )

    default:
      return (
        <View style={f.fieldBlock}>
          <FieldLabel label={field.label} required={required} />
          <TextInput
            style={f.input}
            value={value}
            onChangeText={set}
            placeholder="Enter value…"
            placeholderTextColor={Colors.secondary}
          />
        </View>
      )
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function ItemModal({ fields, values, isNew, onUpdate, onSave, onCancel }: Props) {
  const visibleFields = fields.filter(field => {
    if (!field.conditional_on) return true
    const dep = values[field.conditional_on.field] ?? ''
    return dep === field.conditional_on.value
  })

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={m.safe}>
        <View style={m.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={m.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={m.title}>{isNew ? 'New Entry' : 'Edit Entry'}</Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={m.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={m.scroll}
          contentContainerStyle={m.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={m.card}>
            {visibleFields.map((field, i) => (
              <View key={field.id}>
                {i > 0 && <Divider />}
                <ControlledField field={field} values={values} onUpdate={onUpdate} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const shared = {
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.primary,
  } as const,
}

const f = StyleSheet.create({
  fieldBlock: { paddingVertical: Spacing.xs },
  input: { ...shared.input },
  inputMulti: { minHeight: 80 },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  readOnlyLabel: { fontSize: FontSize.sm, color: Colors.secondary },
  readOnlyValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  optionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  optionBtnActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent },
  optionText: { fontSize: FontSize.md, color: Colors.secondary },
  optionTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
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
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  cancelText: { fontSize: FontSize.lg, color: Colors.secondary },
  doneText: { fontSize: FontSize.lg, color: Colors.accent, fontWeight: FontWeight.semibold },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
})
