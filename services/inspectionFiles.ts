import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import Share from 'react-native-share'
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
  await saveInspection(doc)
  if (!(await Sharing.isAvailableAsync())) return

  // Share a copy under a clean, human-readable name — the saved file's name
  // includes a `_<id>` suffix that would otherwise show up as the suggested
  // filename in the share sheet's "Save to Files" dialog.
  const safeName = (doc.filename || 'Untitled').replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'Untitled'
  const sharePath = FileSystem.cacheDirectory + safeName + '.json'
  await FileSystem.writeAsStringAsync(sharePath, JSON.stringify(doc, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  })

  await Sharing.shareAsync(sharePath, {
    mimeType: 'application/json',
    dialogTitle: doc.filename,
    UTI: 'public.json',
  })
}

// Share multiple saved inspection files in a single share sheet (combined
// AirDrop / Messages attachment, etc.) via react-native-share, which supports
// an array of file URLs unlike expo-sharing.
export async function shareInspectionFiles(
  items: { filePath: string; filename: string }[],
): Promise<void> {
  if (items.length === 0) return

  const usedNames = new Set<string>()
  const urls: string[] = []
  for (const item of items) {
    const base = (item.filename || 'Untitled').replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'Untitled'
    let candidate = base
    let n = 2
    while (usedNames.has(candidate)) {
      candidate = `${base} (${n})`
      n++
    }
    usedNames.add(candidate)

    const sharePath = FileSystem.cacheDirectory + candidate + '.json'
    await FileSystem.deleteAsync(sharePath, { idempotent: true })
    await FileSystem.copyAsync({ from: item.filePath, to: sharePath })
    urls.push(sharePath)
  }

  await Share.open({
    urls,
    failOnCancel: false,
  })
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
