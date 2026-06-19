import * as FileSystem from 'expo-file-system/legacy'
import * as DocumentPicker from 'expo-document-picker'
import * as Sharing from 'expo-sharing'
import type { InspectionSchema } from '../form_schema/types'

// Bundled system schemas — imported at compile time
import canUlcS536Json from '../form_schema/can_ulc_s536.json'

const SYSTEM_SCHEMAS: InspectionSchema[] = [
  canUlcS536Json as unknown as InspectionSchema,
]

const DIR = FileSystem.documentDirectory + 'schemas/'

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

// ── User schema CRUD ──────────────────────────────────────────────────────────

export async function listUserSchemas(): Promise<InspectionSchema[]> {
  await ensureDir()
  const files = await FileSystem.readDirectoryAsync(DIR)
  const schemas: InspectionSchema[] = []
  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const raw = await FileSystem.readAsStringAsync(DIR + file)
      const parsed = JSON.parse(raw) as InspectionSchema
      if (parsed.id && parsed.title && Array.isArray(parsed.sections)) {
        schemas.push(parsed)
      }
    } catch { /* skip malformed */ }
  }
  return schemas
}

export async function listAllSchemas(): Promise<InspectionSchema[]> {
  const user = await listUserSchemas()
  const userIds = new Set(user.map(s => s.id))
  const bundled = SYSTEM_SCHEMAS.filter(s => !userIds.has(s.id))
  return [...bundled, ...user]
}

export function listSystemSchemas(): InspectionSchema[] {
  return SYSTEM_SCHEMAS
}

export async function getSchema(id: string): Promise<InspectionSchema | undefined> {
  const system = SYSTEM_SCHEMAS.find(s => s.id === id)
  if (system) return system
  const user = await listUserSchemas()
  return user.find(s => s.id === id)
}

export async function importSchema(): Promise<InspectionSchema | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri)
  let parsed: InspectionSchema
  try {
    parsed = JSON.parse(raw)
    if (!parsed.id || !parsed.title || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid schema format')
    }
  } catch {
    throw new Error('File is not a valid form schema.')
  }
  // Reject overwriting system schemas
  if (SYSTEM_SCHEMAS.some(s => s.id === parsed.id)) {
    throw new Error(`"${parsed.id}" is a system schema and cannot be overwritten.`)
  }
  await ensureDir()
  await FileSystem.writeAsStringAsync(DIR + parsed.id + '.json', raw)
  return parsed
}

export async function deleteUserSchema(id: string): Promise<void> {
  if (SYSTEM_SCHEMAS.some(s => s.id === id)) {
    throw new Error('System schemas cannot be deleted.')
  }
  await FileSystem.deleteAsync(DIR + id + '.json', { idempotent: true })
}

export async function exportSchema(id: string): Promise<void> {
  const schema = await getSchema(id)
  if (!schema) throw new Error('Schema not found.')
  const path = FileSystem.cacheDirectory + id + '.json'
  await FileSystem.writeAsStringAsync(path, JSON.stringify(schema, null, 2))
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: schema.title, UTI: 'public.json' })
}

export function isSystemSchema(id: string): boolean {
  return SYSTEM_SCHEMAS.some(s => s.id === id)
}
