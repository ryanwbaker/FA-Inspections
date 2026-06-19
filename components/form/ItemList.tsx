import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { ConfirmModal } from '../primitives'
import ItemModal from './ItemModal'
import type { FieldDefinition } from '../../form_schema/types'
import type { StoredListItem } from '../../types/inspection'
import { useInspection } from '../../context/InspectionContext'
import { sortLegend, type DeviceLegendEntry } from '../../constants/legend'
import type { InspectionSchema } from '../../form_schema/types'

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

type Item = StoredListItem

function makeBlankItem(fields: FieldDefinition[], nextNum: number): Item {
  const values: Record<string, string> = {}
  fields.forEach(f => {
    values[f.id] = f.auto_increment ? String(nextNum) : ''
  })
  return { id: newId(), values }
}

// Returns true if options_source refers to a device_legend section/subsection.
function isLegendSource(source: string, schema: InspectionSchema): boolean {
  if (source.startsWith('legend:')) return true  // legacy syntax
  for (const section of schema.sections) {
    if (section.id === source && section.type === 'device_legend') return true
    for (const sub of section.subsections ?? []) {
      if (sub.id === source && sub.type === 'device_legend') return true
    }
  }
  return false
}

// Builds the display label for a legend entry based on options_display.
// Custom entries (isStandard: false) get a suffix so they're distinguishable
// from any standard entry that shares the same code.
function legendLabel(e: DeviceLegendEntry, display: 'code' | 'description' | 'both'): string {
  const suffix = e.isStandard ? '' : ' (custom)'
  if (display === 'code') return `${e.code}${suffix}`
  if (display === 'description') return `${e.description}${suffix}`
  return `${e.code} — ${e.description}${suffix}`
}

// Resolves `options_source` into options (stored values) + optionLabels (display strings).
//
// Stored value = legend entry `id` (always unique, even when codes collide like "–").
// Display label = controlled by field.options_display ('code' | 'description' | 'both').
//
// options_source accepts a single ID or an array of IDs. All referenced legend sections
// draw from doc.legend (which holds both standard and custom entries), deduplicated by id.
function resolveOptions(
  fields: FieldDefinition[],
  legend: DeviceLegendEntry[],
  schema: InspectionSchema,
): FieldDefinition[] {
  return fields.map(f => {
    if (!f.options_source) return f

    const sources = Array.isArray(f.options_source) ? f.options_source : [f.options_source]
    const display = f.options_display ?? 'both'

    // Legacy "legend:<col>" syntax — value = code (may not be unique), label = formatted
    if (sources.length === 1 && sources[0].startsWith('legend:')) {
      const col = sources[0].slice('legend:'.length) as keyof DeviceLegendEntry
      const sorted = sortLegend(legend)
      const options = sorted.map(e => e[col]).filter((v): v is string => typeof v === 'string' && v.length > 0)
      const optionLabels = sorted.filter(e => typeof e[col] === 'string').map(e => legendLabel(e, display))
      return { ...f, options, optionLabels }
    }

    // ID-based: collect entries from doc.legend for each referenced legend section,
    // deduplicated by entry.id. doc.legend already contains all entries (standard + custom).
    const legendSources = sources.filter(s => isLegendSource(s, schema))
    if (legendSources.length === 0) return f

    const seen = new Set<string>()
    const entries: DeviceLegendEntry[] = []
    for (const e of sortLegend(legend)) {
      if (!seen.has(e.id)) {
        seen.add(e.id)
        entries.push(e)
      }
    }

    const options = entries.map(e => e.id)
    const optionLabels = entries.map(e => legendLabel(e, display))
    return { ...f, options, optionLabels }
  })
}

// ─── Summary row helpers ──────────────────────────────────────────────────────

function primaryField(fields: FieldDefinition[]): FieldDefinition | undefined {
  return fields.find(f => !f.auto_increment && (f.type === 'string' || f.type === 'textarea' || f.type === 'date' || f.type === 'time'))
}

function secondaryField(fields: FieldDefinition[], skip: FieldDefinition | undefined): FieldDefinition | undefined {
  return fields.find(f => !f.auto_increment && f !== skip && (f.type === 'string' || f.type === 'date'))
}

function summaryFor(item: Item, fields: FieldDefinition[], index: number, instanceLabelField?: string) {
  const autoField = fields.find(f => f.auto_increment)
  const badge = autoField ? (item.values[autoField.id] || String(index + 1)) : String(index + 1)

  const pf = instanceLabelField
    ? (fields.find(f => f.id === instanceLabelField) ?? primaryField(fields))
    : primaryField(fields)
  const sf = secondaryField(fields, pf)
  const title = pf ? (item.values[pf.id] || '—') : '—'
  const subtitle = sf ? item.values[sf.id] : undefined

  return { badge, title, subtitle }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  itemFields: FieldDefinition[]
  groupKey: string
  targetId: string
  instanceLabelField?: string
}

export default function ItemList({ itemFields, groupKey, targetId, instanceLabelField }: Props) {
  const { doc, dispatch, schema } = useInspection()
  const ctxKey = `${groupKey}/${targetId}`
  const items = doc.listItems[ctxKey] ?? []
  const setItems = (next: Item[]) => dispatch({ type: 'SET_LIST_ITEMS', key: ctxKey, items: next })
  const [editing, setEditing] = useState<{ item: Item; isNew: boolean } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const resolvedFields = resolveOptions(itemFields, doc.legend, schema)

  const autoIncrField = resolvedFields.find(f => f.auto_increment)
  const nextNum = autoIncrField
    ? Math.max(0, ...items.map(it => parseInt(it.values[autoIncrField.id] || '0', 10))) + 1
    : items.length + 1

  const openNew = () => {
    const item = makeBlankItem(resolvedFields, nextNum)
    resolvedFields.forEach(f => {
      if (f.source_default) {
        const v = doc.fieldValues[f.source_default]
        if (v) item.values[f.id] = v
      }
    })
    setEditing({ item, isNew: true })
  }

  const openEdit = (item: Item) => {
    setEditing({ item: { ...item, values: { ...item.values } }, isNew: false })
  }

  const handleSave = () => {
    if (!editing) return
    if (editing.isNew) {
      setItems([...items, editing.item])
    } else {
      setItems(items.map(x => x.id === editing.item.id ? editing.item : x))
    }
    setEditing(null)
  }

  const labelFieldId = instanceLabelField ?? primaryField(resolvedFields)?.id
  const filteredItems = searchText.trim()
    ? items.filter(item => {
        const titleVal = labelFieldId ? item.values[labelFieldId] ?? '' : ''
        return titleVal.toLowerCase().includes(searchText.toLowerCase())
      })
    : items

  return (
    <View>
      {items.length > 3 && (
        <TextInput
          style={s.search}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search…"
          placeholderTextColor={Colors.secondary}
          clearButtonMode="while-editing"
        />
      )}

      {filteredItems.length === 0 && items.length === 0 && (
        <Text style={s.empty}>No entries yet. Tap below to add one.</Text>
      )}

      {filteredItems.length === 0 && items.length > 0 && (
        <Text style={s.empty}>No entries match "{searchText}"</Text>
      )}

      {filteredItems.map((item, i) => {
        const { badge, title, subtitle } = summaryFor(item, resolvedFields, i, instanceLabelField)
        return (
          <TouchableOpacity
            key={item.id}
            style={s.row}
            onPress={() => openEdit(item)}
            activeOpacity={0.7}
          >
            <View style={s.rowInner}>
              <View style={s.numBadge}>
                <Text style={s.numBadgeText}>{badge}</Text>
              </View>
              <View style={s.summary}>
                <Text style={s.summaryTitle} numberOfLines={1}>{title}</Text>
                {subtitle ? (
                  <Text style={s.summarySubtitle} numberOfLines={1}>{subtitle}</Text>
                ) : null}
              </View>
              <Text style={s.chevron}>›</Text>
            </View>
            <TouchableOpacity
              style={s.deleteBtn}
              onPress={() => setConfirmDeleteId(item.id)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Feather name="trash-2" size={15} color={Colors.fail} />
            </TouchableOpacity>
          </TouchableOpacity>
        )
      })}

      <TouchableOpacity style={s.addBtn} onPress={openNew}>
        <Text style={s.addBtnText}>+ Add Entry</Text>
      </TouchableOpacity>

      {editing && (
        <ItemModal
          fields={resolvedFields}
          values={editing.item.values}
          isNew={editing.isNew}
          onUpdate={values => setEditing(prev => prev ? { ...prev, item: { ...prev.item, values } } : null)}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <ConfirmModal
        visible={!!confirmDeleteId}
        title="Remove Entry"
        message="Remove this entry?"
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          setItems(items.filter(x => x.id !== confirmDeleteId))
          setConfirmDeleteId(null)
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  search: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  empty: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.inputBg,
    overflow: 'hidden',
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  numBadge: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 32,
    alignItems: 'center',
    flexShrink: 0,
  },
  numBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  summary: { flex: 1 },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  summarySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    marginTop: 1,
  },
  chevron: { fontSize: 18, color: Colors.secondary },
  deleteBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: Radii.md,
    borderStyle: 'dashed',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  addBtnText: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
})
