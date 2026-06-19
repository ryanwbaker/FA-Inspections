import * as FileSystem from 'expo-file-system/legacy'
import * as DocumentPicker from 'expo-document-picker'
import * as Sharing from 'expo-sharing'
import type { PdfTheme } from '../types/pdfTheme'

// Bundled system themes — imported at compile time
import defaultThemeJson from '../pdf_themes/default.json'
import canUlcThemeJson  from '../pdf_themes/can_ulc_s536.json'

const SYSTEM_THEMES: PdfTheme[] = [
  defaultThemeJson as unknown as PdfTheme,
  canUlcThemeJson  as unknown as PdfTheme,
]

export const DEFAULT_THEME_ID = 'default'

const DIR = FileSystem.documentDirectory + 'themes/'

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

// ── User theme CRUD ───────────────────────────────────────────────────────────

export async function listUserThemes(): Promise<PdfTheme[]> {
  await ensureDir()
  const files = await FileSystem.readDirectoryAsync(DIR)
  const themes: PdfTheme[] = []
  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const raw = await FileSystem.readAsStringAsync(DIR + file)
      const parsed = JSON.parse(raw) as PdfTheme
      if (parsed.id && parsed.name && parsed.colors) {
        themes.push(parsed)
      }
    } catch { /* skip malformed */ }
  }
  return themes
}

export async function listAllThemes(): Promise<PdfTheme[]> {
  const user = await listUserThemes()
  const userIds = new Set(user.map(t => t.id))
  const bundled = SYSTEM_THEMES.filter(t => !userIds.has(t.id))
  return [...bundled, ...user]
}

export function listSystemThemes(): PdfTheme[] {
  return SYSTEM_THEMES
}

export async function getTheme(id: string | undefined | null): Promise<PdfTheme> {
  if (id) {
    const system = SYSTEM_THEMES.find(t => t.id === id)
    if (system) return system
    try {
      const raw = await FileSystem.readAsStringAsync(DIR + id + '.json')
      const parsed = JSON.parse(raw) as PdfTheme
      if (parsed.id && parsed.name && parsed.colors) return parsed
    } catch { /* fall through to default */ }
  }
  return SYSTEM_THEMES.find(t => t.id === DEFAULT_THEME_ID) ?? SYSTEM_THEMES[0]
}

export async function importTheme(): Promise<PdfTheme | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri)
  let parsed: PdfTheme
  try {
    parsed = JSON.parse(raw)
    if (!parsed.id || !parsed.name || !parsed.colors) throw new Error('Invalid theme format')
  } catch {
    throw new Error('File is not a valid PDF theme.')
  }
  if (SYSTEM_THEMES.some(t => t.id === parsed.id)) {
    throw new Error(`"${parsed.id}" is a system theme and cannot be overwritten.`)
  }
  await ensureDir()
  await FileSystem.writeAsStringAsync(DIR + parsed.id + '.json', raw)
  return parsed
}

export async function deleteUserTheme(id: string): Promise<void> {
  if (SYSTEM_THEMES.some(t => t.id === id)) {
    throw new Error('System themes cannot be deleted.')
  }
  await FileSystem.deleteAsync(DIR + id + '.json', { idempotent: true })
}

export async function exportTheme(id: string): Promise<void> {
  const theme = await getTheme(id)
  const path = FileSystem.cacheDirectory + id + '.json'
  await FileSystem.writeAsStringAsync(path, JSON.stringify(theme, null, 2))
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: theme.name, UTI: 'public.json' })
}

export function isSystemTheme(id: string): boolean {
  return SYSTEM_THEMES.some(t => t.id === id)
}
