import * as FileSystem from 'expo-file-system/legacy'
import type { InspectionDocument, StoredListItem } from '../types/inspection'
import type { InspectionSchema, FieldDefinition, SectionDefinition, SubsectionDefinition } from '../form_schema/types'
import type { CompanyProfile } from './companyProfile'
import type { DeviceLegendEntry } from '../constants/legend'
import { buildPagesFromDocument, fieldMeetsCondition, type FormPage } from './formPages'
import { resolveComputedField } from './computedFields'

// ─── HTML escape (exported so templates can use it) ──────────────────────────

export function h(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Field value → HTML string ────────────────────────────────────────────────

function triStateBadge(val: string): string {
  if (val === 'pass') return `<span class="badge pass">✓ Pass</span>`
  if (val === 'fail') return `<span class="badge fail">✗ Fail</span>`
  if (val === 'na')   return `<span class="badge na">— N/A</span>`
  return `<span class="empty">—</span>`
}

function passFailBadge(val: string): string {
  if (val === 'pass') return `<span class="badge pass">P</span>`
  if (val === 'fail') return `<span class="badge fail">F</span>`
  return `<span class="empty">—</span>`
}

function renderFieldValue(
  field: FieldDefinition,
  raw: string,
  doc: InspectionDocument,
  schema: InspectionSchema,
  pages: FormPage[],
): string {
  if (field.computed) {
    if (field.computed === 'pdf_page_count') {
      return h(String(pages.filter((p) => p.isApplicable).length))
    }
    const val = resolveComputedField(field.computed, doc.fieldValues, doc.listItems, schema)
    return val !== null ? h(val) : `<span class="empty">—</span>`
  }

  switch (field.type) {
    case 'note':
    case 'label':
      return ''

    case 'tri_state':
      return triStateBadge(raw)

    case 'pass_fail':
      return passFailBadge(raw)

    case 'boolean':
    case 'boolean_yn':
      return raw === 'Yes' ? 'Yes' : raw === 'No' ? 'No' : `<span class="empty">—</span>`

    case 'multi_checkbox': {
      try {
        const arr: string[] = JSON.parse(raw)
        return arr.length > 0 ? arr.map(h).join(', ') : `<span class="empty">—</span>`
      } catch {
        return raw ? h(raw) : `<span class="empty">—</span>`
      }
    }

    case 'signature':
      return raw
        ? `<img class="signature-img" src="${raw}" alt="Signature" />`
        : `<span class="empty">Not signed</span>`

    default:
      return raw ? h(raw) : `<span class="empty">—</span>`
  }
}

// ─── Notes ───────────────────────────────────────────────────────────────────

function renderNotes(notes: { label: string; group_label?: string }[]): string {
  if (!notes || notes.length === 0) return ''
  return notes.map((n) => {
    const gl = n.group_label ? `<div class="note-group-label">${n.group_label}</div>` : ''
    return `${gl}<p class="note-text">${n.label}</p>`
  }).join('')
}

// ─── Field grid (label / value table) ────────────────────────────────────────

function renderFieldGrid(
  fields: FieldDefinition[],
  groupKey: string,
  doc: InspectionDocument,
  schema: InspectionSchema,
  pages: FormPage[],
): string {
  const visible = fields.filter((f) =>
    f.type !== 'note' &&
    f.type !== 'label' &&
    fieldMeetsCondition(f, doc.fieldValues, groupKey)
  )
  if (visible.length === 0) return ''

  let currentGroupLabel = ''
  const rows = visible.map((field) => {
    const ctxKey = `${groupKey}/${field.id}`
    const raw = doc.fieldValues[ctxKey] ?? ''
    const valueHtml = renderFieldValue(field, raw, doc, schema, pages)
    const fieldNotes = field.notes?.length ? `<div class="field-notes">${renderNotes(field.notes)}</div>` : ''

    let groupHeader = ''
    if (field.group_label && field.group_label !== currentGroupLabel) {
      currentGroupLabel = field.group_label
      groupHeader = `<tr><td colspan="2" class="group-header">${field.group_label}</td></tr>`
    }

    return `${groupHeader}<tr>
      <td class="field-label">${field.label}${fieldNotes}</td>
      <td class="field-value">${valueHtml}</td>
    </tr>`
  }).join('\n')

  return `<table class="field-table">${rows}</table>`
}

// ─── Legend table ─────────────────────────────────────────────────────────────

function renderLegendTable(legend: DeviceLegendEntry[]): string {
  if (!legend || legend.length === 0) return '<p class="empty">No legend entries.</p>'
  const rows = legend.map((e) => `<tr>
    <td>${h(e.code)}</td>
    <td>${h(e.description)}</td>
    <td>${h(e.type ?? '')}</td>
    <td>${h(e.modelNo ?? '')}</td>
    <td>${h(e.manufacturer ?? '')}</td>
    <td>${h(e.sensitivityRange ?? '')}</td>
    <td>${h(e.sensitivityTestMethod ?? '')}</td>
  </tr>`).join('\n')
  return `<table class="data-table">
    <thead><tr>
      <th>Code</th><th>Description</th><th>Type</th><th>Model No.</th>
      <th>Manufacturer</th><th>Sensitivity Range</th><th>Sensitivity Method</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
}

// ─── Repeatable list table (also used for device_record_list) ─────────────────

function resolveItemDisplayValue(
  field: FieldDefinition,
  val: string,
  legend: DeviceLegendEntry[],
): string {
  if (!val) return `<span class="empty">—</span>`
  // If this field uses an ID-based legend source, stored value = legend entry id — resolve to display label
  const sources = field.options_source
    ? (Array.isArray(field.options_source) ? field.options_source : [field.options_source])
    : []
  const hasIdBasedSource = sources.some(s => !s.startsWith('legend:'))
  if (hasIdBasedSource) {
    const entry = legend.find((e) => e.id === val)
    if (entry) {
      const display = field.options_display ?? 'both'
      const suffix = entry.isStandard ? '' : ' (custom)'
      if (display === 'code') return h(`${entry.code}${suffix}`)
      if (display === 'description') return h(`${entry.description}${suffix}`)
      return h(`${entry.code} — ${entry.description}${suffix}`)
    }
  }
  return h(val)
}

function renderItemListTable(
  items: StoredListItem[],
  itemFields: FieldDefinition[],
  legend: DeviceLegendEntry[],
): string {
  if (!items || items.length === 0) return '<p class="empty">No entries.</p>'
  const headers = itemFields.map((f) => `<th>${f.label}</th>`).join('')
  const rows = items.map((item) => {
    const cells = itemFields.map((f) => {
      const val = item.values[f.id] ?? ''
      let cell: string
      if (f.type === 'tri_state') cell = triStateBadge(val)
      else if (f.type === 'pass_fail') cell = passFailBadge(val)
      else cell = resolveItemDisplayValue(f, val, legend)
      return `<td class="${f.type === 'tri_state' || f.type === 'pass_fail' ? 'center' : ''}">${cell}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('\n')
  return `<table class="data-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`
}

// ─── Section notes (notes_before/after before field content) ─────────────────

export function renderSectionContent(
  page: FormPage,
  target: SectionDefinition | SubsectionDefinition,
  section: SectionDefinition,
  doc: InspectionDocument,
  schema: InspectionSchema,
  pages: FormPage[],
): string {
  const isFirstSub = page.subsectionId && section.subsections?.[0]?.id === page.subsectionId
  const prefixBefore = isFirstSub ? (section.notes_before ?? []) : []
  const prefixAfter  = isFirstSub ? (section.notes_after  ?? []) : []
  const notesBefore = [...prefixBefore, ...(target.notes_before ?? [])]
  const notesAfter  = [...(target.notes_after ?? []), ...prefixAfter]

  const nb = renderNotes(notesBefore)
  const na = renderNotes(notesAfter)

  let body = ''
  const ctxKey = `${page.groupKey}/${target.id}`

  if (target.type === 'device_legend') {
    body = renderLegendTable(doc.legend)
  } else if (target.type === 'repeatable_list' || target.type === 'device_record_list') {
    const items = doc.listItems[ctxKey] ?? []
    body = renderItemListTable(items, target.item_fields ?? [], doc.legend)
  } else if (target.fields && target.fields.length > 0) {
    // Render note-type and label-type fields as prose before the grid
    const noteLabelFields = target.fields.filter(
      (f) => (f.type === 'note' || f.type === 'label') && fieldMeetsCondition(f, doc.fieldValues, page.groupKey)
    )
    const noteFieldHtml = noteLabelFields.map((f) => `<p class="note-text">${f.label}</p>`).join('')
    const grid = renderFieldGrid(target.fields, page.groupKey, doc, schema, pages)
    body = noteFieldHtml + grid
  }

  return `${nb}${body}${na}`
}

// ─── Template dispatcher ──────────────────────────────────────────────────────
// CSS and layout live in forms/<template-id>.ts; this is just the orchestrator.

import { getTemplate } from '../forms'

export function generateReportHtml(
  doc: InspectionDocument,
  schema: InspectionSchema,
  profile: CompanyProfile,
  logoDataUri: string | null,
): string {
  const generate = getTemplate(schema.template ?? schema.id)
  return generate(doc, schema, profile, logoDataUri)
}

// ─── Logo helper ──────────────────────────────────────────────────────────────

export async function logoToDataUri(logoUri: string | null): Promise<string | null> {
  if (!logoUri) return null
  try {
    const base64 = await FileSystem.readAsStringAsync(logoUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    const ext = logoUri.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

// ─── PDF export (uses expo-print — installed separately) ─────────────────────

export async function exportInspectionPdf(html: string, filename: string): Promise<string> {
  // Dynamic require so TS doesn't error before expo-print is installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Print = require('expo-print') as {
    printToFileAsync: (opts: { html: string; base64?: boolean }) => Promise<{ uri: string }>
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  const safeName = (filename || 'Inspection Report').replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'report'
  const dest = FileSystem.cacheDirectory + safeName + '.pdf'
  await FileSystem.deleteAsync(dest, { idempotent: true })
  await FileSystem.moveAsync({ from: uri, to: dest })
  return dest
}
