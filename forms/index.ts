import type { InspectionDocument } from '../types/inspection'
import type { InspectionSchema } from '../form_schema/types'
import type { CompanyProfile } from '../services/companyProfile'
import type { PdfTheme } from '../types/pdfTheme'
import {
  generate as universalGenerate,
  generateMeasurementHtml as universalMeasure,
  generatePortraitHtml as universalPortrait,
  generateLandscapeHtml as universalLandscape,
} from './universal'
import type { PaginationLayout } from '../types/pdfLayout'

export type TemplateGenerateFn = (
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  theme: PdfTheme,
) => string

export function generate(doc: InspectionDocument, schema: InspectionSchema, profile: CompanyProfile, theme: PdfTheme): string {
  return universalGenerate(doc, schema, profile, theme)
}

export function generateMeasurementHtml(doc: InspectionDocument, schema: InspectionSchema, profile: CompanyProfile, theme: PdfTheme): string {
  return universalMeasure(doc, schema, profile, theme)
}

export function generatePortraitHtml(doc: InspectionDocument, schema: InspectionSchema, profile: CompanyProfile, theme: PdfTheme, layout: PaginationLayout): string {
  return universalPortrait(doc, schema, profile, theme, layout)
}

export function generateLandscapeHtml(doc: InspectionDocument, schema: InspectionSchema, profile: CompanyProfile, theme: PdfTheme, layout: PaginationLayout): string {
  return universalLandscape(doc, schema, profile, theme, layout)
}
