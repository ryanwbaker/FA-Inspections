import type { InspectionDocument } from '../types/inspection'
import type { InspectionSchema } from '../form_schema/types'
import type { CompanyProfile } from '../services/companyProfile'
import type { PdfTheme } from '../types/pdfTheme'
import { generate as universalGenerate } from './universal'

export type TemplateGenerateFn = (
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  theme: PdfTheme,
) => string

export function generate(
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  theme: PdfTheme,
): string {
  return universalGenerate(doc, schema, profile, theme)
}
