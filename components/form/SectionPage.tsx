import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, FontSize, FontWeight, Spacing, Radii } from '../../tokens'
import { Divider } from '../primitives'
import { DeviceList } from '../device'
import LegendTable from './LegendTable'
import ItemList from './ItemList'
import type { FieldDefinition, SectionDefinition, SubsectionDefinition, InspectionSchema } from '../../schema/types'
import type { FormPage } from '../../screens/InspectionScreen'
import type { DeviceLegendEntry } from '../../constants/legend'
import FormField from './FormField'

// ─── Field group ─────────────────────────────────────────────────────────────

function FieldGroup({ fields, groupKey }: { fields: FieldDefinition[]; groupKey: string }) {
  return (
    <View>
      {fields.map((field, i) => (
        <View key={field.id}>
          {field.group_label ? (
            <View style={s.groupLabelRow}>
              <Text style={s.groupLabelText}>{field.group_label}</Text>
            </View>
          ) : i > 0 ? (
            <Divider />
          ) : null}
          <FormField field={field} groupKey={groupKey} />
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
}

function SectionContent({ target, groupKey, legend, onLegendChange }: ContentProps) {
  const isDeviceRecord = target.id === 's23_2'
  const isLegend = target.id === 's23_1'

  if (isLegend) {
    return <LegendTable legend={legend} onLegendChange={onLegendChange} />
  }

  if (target.type === 'repeatable_list') {
    return isDeviceRecord
      ? <DeviceList groupKey={groupKey} targetId={target.id} legend={legend} />
      : target.item_fields
        ? <ItemList groupKey={groupKey} targetId={target.id} itemFields={target.item_fields} />
        : null
  }

  if (target.fields && target.fields.length > 0) {
    return (
      <View style={s.card}>
        <FieldGroup fields={target.fields} groupKey={groupKey} />
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

  return (
    <View style={s.root}>
      {page.isOptional && toggleLabel && (
        <ApplicableBanner
          label={toggleLabel}
          isApplicable={page.isApplicable}
          onToggle={onToggleApplicable}
        />
      )}

      {page.isApplicable && (
        <SectionContent
          target={target}
          groupKey={page.groupKey}
          legend={legend}
          onLegendChange={onLegendChange}
        />
      )}

      {!page.isApplicable && (
        <View style={s.naCard}>
          <Text style={s.naText}>Marked as not applicable — tap above to re-enable.</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { gap: Spacing.lg },

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
