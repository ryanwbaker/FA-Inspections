/**
 * PDF report template for CAN/ULC-S536:2019 — Annual Fire Alarm System Inspection.
 *
 * This file owns the visual design of the report: CSS, page layout, header/cover
 * block, and section rendering decisions (e.g. which sections go landscape).
 * Generic field/table renderers live in services/pdfReport.ts and are imported here.
 */

import type { InspectionDocument } from '../types/inspection'
import type { InspectionSchema, SectionDefinition, SubsectionDefinition } from '../form_schema/types'
import type { CompanyProfile } from '../services/companyProfile'
import { buildPagesFromDocument } from '../services/formPages'
import { h, renderSectionContent } from '../services/pdfReport'

// ─── Colour palette (mirrors tokens/colors.ts — plain hex for HTML context) ──

const C = {
  pass:       '#389E0D',
  passSoft:   '#F6FFED',
  fail:       '#CF1322',
  failSoft:   '#FFF1F0',
  na:         '#8C8C8C',
  naSoft:     '#FAFAFA',
  accent:     '#D4380D',
  accentSoft: '#FFF1ED',
  border:     '#E0DED8',
  primary:    '#1A1A1A',
  secondary:  '#6B6B6B',
  surface:    '#FFFFFF',
  bg:         '#F5F5F0',
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

export function buildCss(): string {
  return `
    /* ── Page setup ── */
    @page {
      size: letter;
      margin: 0.65in 0.65in 0.85in 0.65in;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: -apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif;
        font-size: 8px;
        color: ${C.secondary};
      }
    }
    @page landscape-page {
      size: letter landscape;
      margin: 0.5in 0.5in 0.7in 0.5in;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: -apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif;
        font-size: 8px;
        color: ${C.secondary};
      }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, system-ui, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10px;
      color: ${C.primary};
      background: #fff;
      line-height: 1.45;
    }

    /* Visible margins in the WebView preview; ignored in print */
    @media screen { body { padding: 0.65in; } }

    /* ── Header ── */
    .report-header {
      display: flex; align-items: flex-start; gap: 14px;
      border-bottom: 2px solid ${C.accent};
      padding-bottom: 12px; margin-bottom: 14px;
    }
    .logo-col { flex-shrink: 0; width: 140px; }
    .logo { max-height: 80px; max-width: 140px; object-fit: contain; object-position: left top; display: block; }
    .header-text { flex: 1; }
    .schema-title { font-size: 13px; font-weight: 700; color: ${C.primary}; margin-bottom: 3px; }
    .form-meta { font-size: 9px; color: ${C.secondary}; margin-bottom: 2px; }
    .generated { font-size: 9px; color: ${C.secondary}; }
    .company-block {
      background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 5px;
      padding: 8px 12px; margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;
    }
    .company-block div { font-size: 9.5px; color: ${C.secondary}; }
    .company-block strong { color: ${C.primary}; font-weight: 600; }

    /* ── Section headings ── */
    .page-section { margin-bottom: 20px; }
    .page-break { page-break-before: always; }
    .landscape-section { page: landscape-page; page-break-before: always; page-break-after: always; }
    .section-heading {
      display: flex; align-items: center; gap: 7px;
      border-bottom: 1px solid ${C.border}; padding-bottom: 7px; margin-bottom: 10px;
    }
    .clause-badge {
      font-size: 8px; font-weight: 700; color: ${C.accent};
      background: ${C.accentSoft}; border: 1px solid ${C.accent};
      border-radius: 3px; padding: 1px 5px; white-space: nowrap; flex-shrink: 0;
    }
    .section-title { font-size: 11px; font-weight: 600; color: ${C.primary}; }
    .na-card {
      background: ${C.naSoft}; border: 1px solid ${C.border}; border-radius: 4px;
      padding: 8px 12px; font-size: 9.5px; color: ${C.secondary}; font-style: italic; margin-bottom: 10px;
    }

    /* ── Field table ── */
    .field-table {
      width: 100%; border-collapse: collapse;
      border: 1px solid ${C.border}; border-radius: 4px; overflow: hidden; margin-bottom: 10px;
    }
    .field-table tr:last-child td { border-bottom: none; }
    .field-label {
      width: 42%; padding: 5px 8px;
      border-bottom: 1px solid ${C.border}; border-right: 1px solid ${C.border};
      color: ${C.secondary}; font-size: 9px; vertical-align: top;
    }
    .field-value {
      width: 58%; padding: 5px 8px;
      border-bottom: 1px solid ${C.border}; font-size: 10px; vertical-align: top; word-break: break-word;
    }
    .group-header {
      padding: 5px 8px; font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
      color: ${C.secondary}; background: ${C.bg}; border-bottom: 1px solid ${C.border};
    }
    .field-notes { margin-top: 3px; }

    /* ── Data tables ── */
    .data-table { width: 100%; border-collapse: collapse; border: 1px solid ${C.border}; margin-bottom: 10px; font-size: 9px; }
    .data-table th { background: ${C.bg}; border: 1px solid ${C.border}; padding: 4px 6px; font-weight: 600; text-align: left; color: ${C.secondary}; }
    .data-table td { border: 1px solid ${C.border}; padding: 4px 6px; vertical-align: top; word-break: break-word; }
    .data-table tr:nth-child(even) td { background: #fafaf8; }

    /* ── Badges ── */
    .badge { display: inline-block; font-size: 8.5px; font-weight: 700; border-radius: 3px; padding: 1px 6px; border: 1px solid; white-space: nowrap; }
    .badge.pass { background: ${C.passSoft}; color: ${C.pass}; border-color: ${C.pass}; }
    .badge.fail { background: ${C.failSoft}; color: ${C.fail}; border-color: ${C.fail}; }
    .badge.na   { background: ${C.naSoft};   color: ${C.na};   border-color: ${C.border}; }
    .empty { color: ${C.secondary}; font-style: italic; }
    .center { text-align: center; }

    /* ── Notes ── */
    .note-text { font-size: 8.5px; color: ${C.secondary}; font-style: italic; margin-bottom: 5px; }
    .note-group-label { font-size: 8px; font-weight: 700; text-transform: uppercase; color: ${C.secondary}; margin-top: 6px; }

    /* ── Signatures ── */
    .signature-img { max-width: 180px; max-height: 70px; border: 1px solid ${C.border}; border-radius: 3px; }
  `
}

// ─── Template entry point ─────────────────────────────────────────────────────

export function generate(
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  logoDataUri: string | null,
): string {
  const pages = buildPagesFromDocument(schema, doc.repeatableGroups, doc.applicableStates)
  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  // Cover header
  const logoHtml = logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Company Logo" />` : ''
  const companyAddr = [profile.address1, profile.address2, profile.city, profile.province, profile.postalCode]
    .filter(Boolean).join(', ')
  const header = `
    <div class="report-header">
      <div class="logo-col">${logoHtml}</div>
      <div class="header-text">
        <div class="schema-title">${schema.title}</div>
        <div class="form-meta">Form ${h(schema.formId)} · Version ${h(schema.version)}</div>
        <div class="generated">Generated: ${today} · Inspection: ${h(doc.filename)}</div>
      </div>
    </div>
    <div class="company-block">
      <div><strong>${h(profile.name || 'Service Company')}</strong></div>
      ${profile.phone ? `<div>Phone: ${h(profile.phone)}</div>` : ''}
      ${companyAddr ? `<div>Address: ${h(companyAddr)}</div>` : ''}
    </div>`

  // Section pages
  let lastSectionId = ''
  const sectionsHtml = pages.map((page) => {
    const section = schema.sections.find((s) => s.id === page.sectionId)!
    const target: SectionDefinition | SubsectionDefinition = page.subsectionId
      ? section.subsections!.find((s) => s.id === page.subsectionId)!
      : section

    const isNewSection = page.sectionId !== lastSectionId
    lastSectionId = page.sectionId

    const isLandscape =
      target.type === 'device_legend' ||
      target.type === 'device_record_list' ||
      (target.type === 'repeatable_list' && (target.item_fields?.length ?? 0) > 5)

    const divClass = isLandscape
      ? 'page-section landscape-section'
      : isNewSection ? 'page-section page-break' : 'page-section'

    const clauseHtml = page.clause ? `<span class="clause-badge">§${page.clause}</span>` : ''
    const heading = `<div class="section-heading">${clauseHtml}<span class="section-title">${page.title}</span></div>`
    const body = page.isApplicable
      ? renderSectionContent(page, target, section, doc, schema, pages)
      : `<div class="na-card">— Not Applicable —</div>`

    return `<div class="${divClass}">${heading}${body}</div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${h(doc.filename)} — Inspection Report</title>
  <style>${buildCss()}</style>
</head>
<body>
  ${header}
  ${sectionsHtml}
</body>
</html>`
}
