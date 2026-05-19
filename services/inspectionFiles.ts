import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import * as DocumentPicker from 'expo-document-picker'
import type { InspectionDocument } from '../types/inspection'

const DIR = FileSystem.documentDirectory + 'inspections/'

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export async function saveInspection(doc: InspectionDocument): Promise<string> {
  await ensureDir()
  const path = doc.filePath ?? DIR + doc.id + '.json'
  await FileSystem.writeAsStringAsync(path, JSON.stringify(doc, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  })
  return path
}

// Save a copy under a new filename (Save As). Returns the new document.
export async function saveInspectionAs(
  doc: InspectionDocument,
  filename: string,
): Promise<InspectionDocument> {
  await ensureDir()
  const safeName = filename.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'inspection'
  const path = DIR + safeName + '_' + doc.id + '.json'
  const copy: InspectionDocument = { ...doc, filename, filePath: path }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(copy, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  })
  return copy
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadInspection(path: string): Promise<InspectionDocument> {
  const raw = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  })
  return JSON.parse(raw) as InspectionDocument
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface InspectionMeta {
  filename: string
  filePath: string
  updatedAt: string
  schemaId: string
  status: InspectionDocument['status']
}

export async function listInspections(): Promise<InspectionMeta[]> {
  await ensureDir()
  const files = await FileSystem.readDirectoryAsync(DIR)
  const results: InspectionMeta[] = []

  for (const file of files.filter(f => f.endsWith('.json'))) {
    try {
      const raw = await FileSystem.readAsStringAsync(DIR + file, {
        encoding: FileSystem.EncodingType.UTF8,
      })
      const doc = JSON.parse(raw) as InspectionDocument
      results.push({
        filename: doc.filename,
        filePath: DIR + file,
        updatedAt: doc.updatedAt,
        schemaId: doc.schemaId,
        status: doc.status,
      })
    } catch {
      // skip corrupted files
    }
  }

  return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteInspection(filePath: string): Promise<void> {
  await FileSystem.deleteAsync(filePath, { idempotent: true })
}

// ─── Share ────────────────────────────────────────────────────────────────────

export async function shareInspection(doc: InspectionDocument): Promise<void> {
  // Ensure it's saved to a stable path first
  const path = await saveInspection(doc)
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: doc.filename,
      UTI: 'public.json',
    })
  }
}

// ─── Import from device (file picker) ────────────────────────────────────────

export async function importInspection(): Promise<InspectionDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null

  const asset = result.assets[0]
  const raw = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  })
  const doc = JSON.parse(raw) as InspectionDocument

  // Copy to inspections directory
  await ensureDir()
  const dest = DIR + doc.id + '.json'
  await FileSystem.copyAsync({ from: asset.uri, to: dest })
  return { ...doc, filePath: dest }
}
