import type { InspectionSchema, FieldDefinition, ConditionalOn } from '../form_schema/types'

export interface FormPage {
  key: string
  sectionId: string
  subsectionId?: string
  groupKey: string
  clause?: string
  title: string
  isRepeatable: boolean
  isOptional: boolean
  isApplicable: boolean
  repeatableGroupId?: string
}

export function makePages(
  schema: InspectionSchema,
  sectionId: string,
  groupKey: string,
  repeatableGroups: Record<string, string[]> = {},
): FormPage[] {
  const section = schema.sections.find((s) => s.id === sectionId)!
  const isRepeatable = section.type === 'repeatable_section'

  if (section.subsections && section.subsections.length > 0) {
    return section.subsections.flatMap((sub, subIndex) => {
      if (sub.type === 'repeatable_subsection') {
        const subGroupKeys = repeatableGroups[sub.id] ?? [`${sub.id}__0`]
        return subGroupKeys.map((sgk) => ({
          key: sgk,
          sectionId: section.id,
          subsectionId: sub.id,
          groupKey: sgk,
          clause: sub.clause,
          title: sub.title,
          isRepeatable: true,
          isOptional: !!sub.applicable_toggle,
          isApplicable: sub.applicable_toggle ? sub.applicable_toggle.default : true,
          repeatableGroupId: sub.id,
        }))
      }
      return [{
        key: `${groupKey}__${sub.id}`,
        sectionId: section.id,
        subsectionId: sub.id,
        groupKey,
        clause:
          sub.clause ??
          (section.clause ? `${section.clause} (${subIndex + 1})` : undefined),
        title: sub.title,
        isRepeatable,
        isOptional: !!sub.applicable_toggle,
        isApplicable: sub.applicable_toggle ? sub.applicable_toggle.default : true,
        repeatableGroupId: isRepeatable ? sectionId : undefined,
      }]
    })
  }

  return [{
    key: `${groupKey}__${section.id}`,
    sectionId: section.id,
    subsectionId: undefined,
    groupKey,
    clause: section.clause,
    title: section.title,
    isRepeatable,
    isOptional: !!section.applicable_toggle,
    isApplicable: section.applicable_toggle ? section.applicable_toggle.default : true,
    repeatableGroupId: isRepeatable ? sectionId : undefined,
  }]
}

export function buildPagesFromDocument(
  schema: InspectionSchema,
  repeatableGroups: Record<string, string[]>,
  applicableStates: Record<string, boolean>,
): FormPage[] {
  return schema.sections.flatMap((section) => {
    const groupKeys = repeatableGroups[section.id] ?? [`${section.id}__0`]
    return groupKeys.flatMap((groupKey) => {
      const rawPages = makePages(schema, section.id, groupKey, repeatableGroups)
      return rawPages.map((p) => {
        if (p.isOptional && applicableStates[p.key] !== undefined) {
          return { ...p, isApplicable: applicableStates[p.key] }
        }
        return p
      })
    })
  })
}

export function fieldMeetsCondition(
  field: FieldDefinition,
  fieldValues: Record<string, string>,
  groupKey: string,
): boolean {
  const cond: ConditionalOn | undefined = field.conditional_on
  if (!cond) return true
  const depVal = fieldValues[`${groupKey}/${cond.field}`] ?? ''
  if (cond.value !== undefined) return depVal === cond.value
  if (cond.contains !== undefined) return depVal.includes(cond.contains)
  if (cond.contains_any !== undefined) {
    let arr: string[] = []
    try { arr = JSON.parse(depVal) } catch { arr = depVal ? [depVal] : [] }
    return cond.contains_any.some((v) => arr.includes(v))
  }
  if (cond.value_in !== undefined) return cond.value_in.includes(depVal)
  return true
}
