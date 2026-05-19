import { View, StyleSheet } from 'react-native'
import type { FieldDefinition } from '../../schema/types'
import type { TriStateVal } from '../fields/TriStateField'
import {
  StringField, NumberField, DateField, BooleanYNField,
  TriStateField, RadioField, MultiCheckboxField, DropdownField,
  PassFailField, SignatureField,
} from '../fields'
import { useInspection } from '../../context/InspectionContext'

interface Props {
  field: FieldDefinition
  groupKey: string
}

export default function FormField({ field, groupKey }: Props) {
  const { doc, dispatch } = useInspection()
  const ctxKey = `${groupKey}/${field.id}`
  const raw = doc.fieldValues[ctxKey] ?? ''
  const required = field.required !== false
  const set = (val: string) => dispatch({ type: 'SET_FIELD', key: ctxKey, value: val })

  switch (field.type) {
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
          value={raw === 'true' ? true : raw === 'false' ? false : null}
          onChange={v => set(v === null ? '' : String(v))}
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
