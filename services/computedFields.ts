import type { InspectionSchema } from '../schema/types'
import { defaultGroupKeyForField } from './schemaDefaults'

/**
 * Resolves computed field values from inspection document state.
 *
 * - 'list_non_empty:<listId>'   : 'Yes' if that list has any items, else 'No'.
 * - 'field_non_empty:<fieldId>' : 'Yes' if that field's value is non-empty, else 'No'.
 * - 'pdf_page_count'            : returns null — resolved at PDF generation time only.
 *
 * Returns null when the value cannot be determined at form time.
 */
export function resolveComputedField(
  key: string,
  fieldValues: Record<string, string>,
  listItems: Record<string, unknown[]>,
  schema: InspectionSchema,
): string | null {
  if (key === 'pdf_page_count') return null

  const [operator, ref] = key.split(':')

  switch (operator) {
    case 'list_non_empty': {
      const groupKey = defaultGroupKeyForField(schema, ref)
      if (!groupKey) return null
      return (listItems[`${groupKey}/${ref}`]?.length ?? 0) > 0 ? 'Yes' : 'No'
    }

    case 'field_non_empty': {
      const groupKey = defaultGroupKeyForField(schema, ref)
      if (!groupKey) return null
      const val = fieldValues[`${groupKey}/${ref}`]?.trim() ?? ''
      return val.length > 0 ? 'Yes' : 'No'
    }

    default:
      return null
  }
}
