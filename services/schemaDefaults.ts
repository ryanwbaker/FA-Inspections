import type { InspectionSchema, FieldDefinition, SectionDefinition, SubsectionDefinition } from '../form_schema/types'

// Group key a field falls under by default: the parent (sub)section's first
// instance, following the same convention makePages/collectFieldDefaults use —
// `${id}__0`, where `id` is the subsection's own id if it's independently
// repeatable, otherwise the top-level section's id.
function ownerGroupKey(section: SectionDefinition, sub?: SubsectionDefinition): string {
  if (sub && sub.type === 'repeatable_subsection') return `${sub.id}__0`
  return `${section.id}__0`
}

// Looks up the default groupKey for a field id or a subsection id (e.g. a
// repeatable_list's id, used as the key into doc.listItems).
export function defaultGroupKeyForField(schema: InspectionSchema, id: string): string | null {
  for (const section of schema.sections) {
    if (section.fields?.some(f => f.id === id)) return ownerGroupKey(section)
    for (const sub of section.subsections ?? []) {
      if (sub.id === id) return ownerGroupKey(section, sub)
      if (sub.fields?.some(f => f.id === id)) return ownerGroupKey(section, sub)
    }
  }
  return null
}

export function findFieldBySource(
  schema: InspectionSchema,
  source: string,
): { fieldId: string; groupKey: string } | null {
  for (const section of schema.sections) {
    const f = section.fields?.find(fd => fd.source === source)
    if (f) return { fieldId: f.id, groupKey: ownerGroupKey(section) }
    for (const sub of section.subsections ?? []) {
      const sf = sub.fields?.find(fd => fd.source === source)
      if (sf) return { fieldId: sf.id, groupKey: ownerGroupKey(section, sub) }
    }
  }
  return null
}

function getSourceValue(profiles: Record<string, object | undefined>, source: string): string {
  const [bagKey, ...rest] = source.split('.')
  let val: unknown = profiles[bagKey]
  for (const key of rest) {
    if (!val || typeof val !== 'object') return ''
    val = (val as Record<string, unknown>)[key]
  }
  return typeof val === 'string' ? val.trim() : ''
}

interface ResolveOpts {
  skipIfFilled?: Record<string, string>  // existing fieldValues; entries with non-empty values here are left alone
  prefix?: string                        // only resolve `source` values starting with this prefix, e.g. "tech_profile."
}

// Walks every field with a `source`, resolves its value from `profiles` (a bag of
// profile objects keyed by name, e.g. { company_profile, tech_profile, location }),
// and returns a fieldValues patch keyed `${groupKey}/${fieldId}`.
export function resolveSourceDefaults(
  schema: InspectionSchema,
  profiles: Record<string, object | undefined>,
  opts: ResolveOpts = {},
): Record<string, string> {
  const values: Record<string, string> = {}

  const apply = (fields: FieldDefinition[] | undefined, groupKey: string) => {
    for (const f of fields ?? []) {
      if (!f.source) continue
      if (opts.prefix && !f.source.startsWith(opts.prefix)) continue
      const key = `${groupKey}/${f.id}`
      if (opts.skipIfFilled?.[key]?.trim()) continue
      const val = getSourceValue(profiles, f.source)
      if (val) values[key] = val
    }
  }

  for (const section of schema.sections) {
    apply(section.fields, ownerGroupKey(section))
    for (const sub of section.subsections ?? []) {
      apply(sub.fields, ownerGroupKey(section, sub))
    }
  }

  return values
}
