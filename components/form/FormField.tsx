import { View, Text, StyleSheet } from 'react-native'
import type { FieldDefinition } from '../../schema/types'
import type { TriStateVal } from '../fields/TriStateField'
import {
  NoteField, StringField, NumberField, DateField, BooleanYNField,
  TriStateField, RadioField, MultiCheckboxField, DropdownField,
  PassFailField, SignatureField,
} from '../fields'
import { useInspection } from '../../context/InspectionContext'
import { FieldLabel } from '../primitives'
import { resolveComputedField } from '../../services/computedFields'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'

interface Props {
  field: FieldDefinition
  groupKey: string
}

function ComputedDisplay({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={cs.container}>
      <View style={cs.headerRow}>
        <View style={cs.labelWrap}>
          <FieldLabel label={label} required={false} />
        </View>
        <View style={cs.badge}>
          <Text style={cs.badgeText}>AUTO</Text>
        </View>
      </View>
      <View style={cs.valueBox}>
        <Text style={value !== null ? cs.valueText : cs.placeholder}>
          {value ?? 'Calculated on export'}
        </Text>
      </View>
    </View>
  )
}

export default function FormField({ field, groupKey }: Props) {
  const { doc, dispatch } = useInspection()

  if (field.computed) {
    const resolved = resolveComputedField(field.computed, doc.fieldValues, doc.listItems)
    return <ComputedDisplay label={field.label} value={resolved} />
  }

  const ctxKey = `${groupKey}/${field.id}`
  const raw = doc.fieldValues[ctxKey] ?? ''
  const required = field.required !== false
  const set = (val: string) => dispatch({ type: 'SET_FIELD', key: ctxKey, value: val })

  switch (field.type) {
    case 'note':
      return <NoteField text={field.label} />
    case 'label':
      return <FieldLabel label={field.label} />
    case 'string':
      return <StringField label={field.label} required={required} hint={field.hint} value={raw} onChange={set} />
    case 'textarea':
      return <StringField label={field.label} required={required} hint={field.hint} multiline value={raw} onChange={set} />
    case 'phone':
      return <StringField label={field.label} required={required} hint={field.hint ?? 'e.g. 604-555-0100'} value={raw} onChange={set} />
    case 'time':
      return <StringField label={field.label} required={required} hint={field.hint ?? 'HH:MM'} value={raw} onChange={set} />
    case 'integer':
      return <NumberField label={field.label} required={required} value={raw} onChange={set} />
    case 'number':
      return <NumberField label={field.label} required={required} decimal value={raw} onChange={set} />
    case 'date':
      return <DateField label={field.label} required={required} value={raw} onChange={set} />
    case 'boolean':
    case 'boolean_yn':
      return (
        <BooleanYNField
          label={field.label}
          required={required}
          value={raw === 'Yes' ? true : raw === 'No' ? false : null}
          onChange={v => set(v === null ? '' : v ? 'Yes' : 'No')}
        />
      )
    case 'tri_state':
      return (
        <TriStateField
          label={field.label}
          required={required}
          value={(raw || null) as TriStateVal}
          onChange={v => set(v ?? '')}
        />
      )
    case 'pass_fail':
      return (
        <PassFailField
          label={field.label}
          required={required}
          value={(raw || null) as 'pass' | 'fail' | null}
          onChange={v => set(v)}
        />
      )
    case 'radio':
      return (
        <RadioField
          label={field.label}
          required={required}
          options={field.options ?? []}
          value={raw || null}
          onChange={set}
        />
      )
    case 'multi_checkbox': {
      let checked: string[] = []
      try { checked = raw ? JSON.parse(raw) : [] } catch { /* ignore */ }
      return (
        <MultiCheckboxField
          label={field.label}
          required={required}
          options={field.options ?? []}
          value={checked}
          onChange={arr => set(JSON.stringify(arr))}
        />
      )
    }
    case 'dropdown':
      return (
        <DropdownField
          label={field.label}
          required={required}
          options={field.options ?? []}
          value={raw || null}
          onChange={set}
        />
      )
    case 'signature':
      return (
        <SignatureField
          label={field.label}
          required={required}
          value={raw || null}
          onChange={v => set(v ?? '')}
        />
      )
    default:
      return <StringField label={field.label} required={required} value={raw} onChange={set} />
  }
}

export const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
})

const cs = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  labelWrap: { flex: 1, marginRight: Spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.naSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
  valueBox: {
    backgroundColor: Colors.naSoft,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  valueText: {
    fontSize: FontSize.lg,
    color: Colors.secondary,
  },
  placeholder: {
    fontSize: FontSize.lg,
    color: Colors.na,
    fontStyle: 'italic',
  },
})
