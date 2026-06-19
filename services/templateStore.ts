import * as FileSystem from 'expo-file-system/legacy'
import type { InspectionTemplate } from '../types/inspectionTemplate'

// Bundled system templates (schema + theme combos that ship with the app)
const SYSTEM_TEMPLATES: InspectionTemplate[] = [
  {
    id: 'can_ulc_s536_standard',
    name: 'CAN/ULC-S536 Annual Inspection',
    schemaId: 'can_ulc_s536_2019',
    themeId: 'can_ulc_s536',
    system: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

const DIR      = FileSystem.documentDirectory + 'templates/'
const IDX_PATH = DIR + 'index.json'

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

// ── User template CRUD ────────────────────────────────────────────────────────

async function readIndex(): Promise<InspectionTemplate[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(IDX_PATH)
    return JSON.parse(raw) as InspectionTemplate[]
  } catch {
    return []
  }
}

async function writeIndex(templates: InspectionTemplate[]): Promise<void> {
  await ensureDir()
  await FileSystem.writeAsStringAsync(IDX_PATH, JSON.stringify(templates))
}

export async function listUserTemplates(): Promise<InspectionTemplate[]> {
  return readIndex()
}

export async function listAllTemplates(): Promise<InspectionTemplate[]> {
  const index = await readIndex()
  // Merge hidden overrides (stored as system stubs in the index) into system templates
  const hiddenMap = new Map(index.filter(t => t.system).map(t => [t.id, t.hidden ?? false]))
  const systemWithState = SYSTEM_TEMPLATES.map(t => ({ ...t, hidden: hiddenMap.get(t.id) ?? false }))
  const userTemplates = index.filter(t => !t.system)
  return [...systemWithState, ...userTemplates]
}

export function listSystemTemplates(): InspectionTemplate[] {
  return SYSTEM_TEMPLATES
}

export async function saveUserTemplate(template: Omit<InspectionTemplate, 'system' | 'createdAt'>): Promise<InspectionTemplate> {
  const all = await readIndex()
  const existing = all.findIndex(t => t.id === template.id)
  const entry: InspectionTemplate = {
    ...template,
    system: false,
    createdAt: existing >= 0 ? all[existing].createdAt : new Date().toISOString(),
  }
  if (existing >= 0) all[existing] = entry
  else all.push(entry)
  await writeIndex(all)
  return entry
}

export async function deleteUserTemplate(id: string): Promise<void> {
  if (SYSTEM_TEMPLATES.some(t => t.id === id)) {
    throw new Error('System templates cannot be deleted.')
  }
  const all = await readIndex()
  await writeIndex(all.filter(t => t.id !== id))
}

// System templates can be hidden (not shown in the home screen) but not deleted.
export async function setSystemTemplateHidden(id: string, hidden: boolean): Promise<void> {
  const all = await readIndex()
  const existing = all.find(t => t.id === id)
  if (existing) {
    existing.hidden = hidden
    await writeIndex(all)
  } else {
    // Store a hidden-override record for this system template
    all.push({ id, name: '', schemaId: '', themeId: '', system: true, hidden, createdAt: new Date().toISOString() })
    await writeIndex(all)
  }
}

// Returns visible templates for the home screen (system templates with hidden state merged in)
export async function listVisibleTemplates(): Promise<InspectionTemplate[]> {
  const all = await listAllTemplates()
  return all.filter(t => !t.hidden)
}

export function isSystemTemplate(id: string): boolean {
  return SYSTEM_TEMPLATES.some(t => t.id === id)
}

const newId = () => `tpl_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
export { newId as newTemplateId }
