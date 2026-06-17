/**
 * Template registry — maps schema.template IDs to generate() functions.
 *
 * Each template owns its CSS, page layout, and header design.
 * Generic field/table renderers are shared via services/pdfReport.ts.
 *
 * To add a new form template:
 *   1. Create forms/<template-id>.ts exporting a generate() function
 *   2. Add it to the registry below
 *   3. Set "template": "<template-id>" in the form_schema JSON
 */

import type { InspectionDocument } from '../types/inspection'
import type { InspectionSchema } from '../form_schema/types'
import type { CompanyProfile } from '../services/companyProfile'

import * as canUlcS536 from './can_ulc_s536'

export type TemplateGenerateFn = (
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  logoDataUri: string | null,
) => string

const registry: Record<string, TemplateGenerateFn> = {
  can_ulc_s536: canUlcS536.generate,
}

export function getTemplate(templateId: string): TemplateGenerateFn {
  return registry[templateId] ?? canUlcS536.generate
}
