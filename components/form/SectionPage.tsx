import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { Divider } from '../primitives'
import { NoteField } from '../fields'
import LegendTable from './LegendTable'
import ItemList from './ItemList'
import type { FieldDefinition, NoteEntry, SectionDefinition, SubsectionDefinition, InspectionSchema } from '../../form_schema/types'
import type { FormPage } from '../../screens/InspectionScreen'
import type { DeviceLegendEntry } from '../../constants/legend'
import FormField from './FormField'
import { useInspection } from '../../context/InspectionContext'
import { fieldMeetsCondition } from '../../services/formPages'

function FieldGroup({ fields, groupKey }: { fields: FieldDefinition[]; groupKey: string }) {
  const { doc } = useInspection()
  const visible = fields.filter(f => fieldMeetsCondition(f, doc.fieldValues, groupKey))

  return (
    <View>
      {visible.map((field, i) => (
        <View key={field.id}>
          {field.group_label ? (
            <View style={s.groupLabelRow}>
              <Text style={s.groupLabelText}>{field.group_label}</Text>
            </View>
          ) : i > 0 ? (
            <Divider />
          ) : null}
          <FormField field={field} groupKey={groupKey} />
          {field.notes && field.notes.length > 0 && (
            <View style={s.fieldNotes}>
              <Notes notes={field.notes} />
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

// ─── Applicable toggle banner ─────────────────────────────────────────────────

interface ToggleBannerProps {
  label: string
  isApplicable: boolean
  onToggle: () => void
}

function ApplicableBanner({ label, isApplicable, onToggle }: ToggleBannerProps) {
  return (
    <View style={[s.banner, isApplicable ? s.bannerOn : s.bannerOff]}>
      <Text style={[s.bannerLabel, !isApplicable && s.bannerLabelOff]} numberOfLines={2}>
        {label}
      </Text>
      <TouchableOpacity
        style={[s.togglePill, isApplicable ? s.pillOn : s.pillOff]}
        onPress={onToggle}
      >
        <Text style={[s.pillText, isApplicable ? s.pillTextOn : s.pillTextOff]}>
          {isApplicable ? 'Applicable' : 'N/A'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Content renderer ─────────────────────────────────────────────────────────

interface ContentProps {
  target: SectionDefinition | SubsectionDefinition
  groupKey: string
  legend: DeviceLegendEntry[]
  onLegendChange: (legend: DeviceLegendEntry[]) => void
  prefixNotesBefore?: NoteEntry[]
  prefixNotesAfter?: NoteEntry[]
}

function Notes({ notes }: { notes: NoteEntry[] }) {
  return (
    <>
      {notes.map((n, i) => (
        <View key={i}>
          {n.group_label && (
            <View style={s.groupLabelRow}>
              <Text style={s.groupLabelText}>{n.group_label}</Text>
            </View>
          )}
          <NoteField text={n.label} />
        </View>
      ))}
    </>
  )
}

function SectionContent({ target, groupKey, legend, onLegendChange, prefixNotesBefore = [], prefixNotesAfter = [] }: ContentProps) {
  const notesBefore = [...prefixNotesBefore, ...(target.notes_before ?? [])]
  const notesAfter = [...(target.notes_after ?? []), ...prefixNotesAfter]

  if (target.type === 'device_legend') {
    return <LegendTable legend={legend} onLegendChange={onLegendChange} />
  }

  if (target.type === 'repeatable_list' || target.type === 'device_record_list') {
    return (
      <View>
        {notesBefore.length > 0 && <Notes notes={notesBefore} />}
        {target.item_fields
          ? <ItemList groupKey={groupKey} targetId={target.id} itemFields={target.item_fields} />
          : null
        }
        {notesAfter.length > 0 && <View style={s.notesAfter}><Notes notes={notesAfter} /></View>}
      </View>
    )
  }

  const hasFields = target.fields && target.fields.length > 0
  if (notesBefore.length > 0 || notesAfter.length > 0 || hasFields) {
    return (
      <View style={s.card}>
        {notesBefore.length > 0 && <Notes notes={notesBefore} />}
        {hasFields && <FieldGroup fields={target.fields!} groupKey={groupKey} />}
        {notesAfter.length > 0 && <Notes notes={notesAfter} />}
      </View>
    )
  }

  return null
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Props {
  page: FormPage
  schema: InspectionSchema
  legend: DeviceLegendEntry[]
  onLegendChange: (legend: DeviceLegendEntry[]) => void
  onToggleApplicable: () => void
}

export default function SectionPage({ page, schema, legend, onLegendChange, onToggleApplicable }: Props) {
  const section = schema.sections.find(s => s.id === page.sectionId)!

  const target: SectionDefinition | SubsectionDefinition = page.subsectionId
    ? section.subsections!.find(s => s.id === page.subsectionId)!
    : section

  const toggleLabel = page.subsectionId
    ? (target as SubsectionDefinition).applicable_toggle?.label
    : section.applicable_toggle?.label

  // Section-level notes appear on the first subsection's page
  const isFirstSubsection = page.subsectionId && section.subsections?.[0]?.id === page.subsectionId
  const prefixNotesBefore = isFirstSubsection ? (section.notes_before ?? []) : []
  const prefixNotesAfter = isFirstSubsection ? (section.notes_after ?? []) : []

  const applicableToggle = page.subsectionId
    ? (target as SubsectionDefinition).applicable_toggle
    : section.applicable_toggle
  const greyOut = applicableToggle?.grey_out === true

  const subsectionHeading = page.isRepeatable && page.subsectionId
    ? { clause: (target as SubsectionDefinition).clause, title: target.title }
    : null

  const content = (
    <SectionContent
      target={target}
      groupKey={page.groupKey}
      legend={legend}
      onLegendChange={onLegendChange}
      prefixNotesBefore={prefixNotesBefore}
      prefixNotesAfter={prefixNotesAfter}
    />
  )

  return (
    <View style={s.root}>
      {subsectionHeading && (
        <View style={s.subsectionHeading}>
          {subsectionHeading.clause && (
            <Text style={s.subsectionClause}>§{subsectionHeading.clause}</Text>
          )}
          <Text style={s.subsectionTitle}>{subsectionHeading.title}</Text>
        </View>
      )}

      {page.isOptional && toggleLabel && (
        <ApplicableBanner
          label={toggleLabel}
          isApplicable={page.isApplicable}
          onToggle={onToggleApplicable}
        />
      )}

      {page.isApplicable && content}

      {!page.isApplicable && greyOut && (
        <View style={s.greyedOut} pointerEvents="none">
          {content}
        </View>
      )}

      {!page.isApplicable && !greyOut && (
        <View style={s.naCard}>
          <Text style={s.naText}>Marked as not applicable — tap above to re-enable.</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: Spacing.lg },
  notesAfter: { marginTop: Spacing.lg },
  greyedOut: { opacity: 0.35 },
  fieldNotes: { marginTop: Spacing.sm },

  subsectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  subsectionClause: {
    flexShrink: 0,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  subsectionTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },

  // Applicable banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  bannerOn: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  bannerOff: {
    backgroundColor: Colors.naSoft,
    borderColor: Colors.na,
  },
  bannerLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.primary,
    lineHeight: 20,
  },
  bannerLabelOff: {
    color: Colors.secondary,
  },
  togglePill: {
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    flexShrink: 0,
  },
  pillOn: { backgroundColor: Colors.passSoft, borderColor: Colors.pass },
  pillOff: { backgroundColor: Colors.naSoft, borderColor: Colors.na },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  pillTextOn: { color: Colors.pass },
  pillTextOff: { color: Colors.na },

  // Inline group label
  groupLabelRow: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  groupLabelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // N/A placeholder
  naCard: {
    backgroundColor: Colors.naSoft,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  naText: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
