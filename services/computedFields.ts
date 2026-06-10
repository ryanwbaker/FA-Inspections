/**
 * Resolves computed field values from inspection document state.
 *
 * - 'pdf_page_count'   : returns null — resolved at PDF generation time only.
 * - 'has_deficiencies' : 'Yes' if the deficiency list has any items, else 'No'.
 * - 'has_recommendations' : 'Yes' if recommendations notes is non-empty, else 'No'.
 *
 * Returns null when the value cannot be determined at form time.
 */
export function resolveComputedField(
  key: string,
  fieldValues: Record<string, string>,
  listItems: Record<string, unknown[]>,
): string | null {
  switch (key) {
    case 'has_deficiencies':
      return (listItems['s20_2_deficiencies']?.length ?? 0) > 0 ? 'Yes' : 'No'

    case 'has_recommendations': {
      const notes = fieldValues['s20_3__0/recommendations_notes']?.trim() ?? ''
      return notes.length > 0 ? 'Yes' : 'No'
    }

    case 'pdf_page_count':
      return null

    default:
      return null
  }
}
