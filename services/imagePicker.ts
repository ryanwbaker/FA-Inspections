import { Platform, ActionSheetIOS } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'

// Reads a file URI as a base64 data URI.
async function uriToDataUri(uri: string, mimeHint?: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    const mime = mimeHint ?? 'image/jpeg'
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

async function pickFromFiles(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'image/*',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  const ext = (asset.name?.split('.').pop() ?? 'png').toLowerCase()
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
  return uriToDataUri(asset.uri, mime)
}

async function pickFromPhotos(): Promise<string | null> {
  // Dynamic require so TS compiles without expo-image-picker in devDependencies.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker')

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: 0.85,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]

  // expo-image-picker returns base64 directly when base64: true
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg'
    return `data:${mime};base64,${asset.base64}`
  }

  // Fallback: read from URI
  return uriToDataUri(asset.uri, asset.mimeType ?? 'image/jpeg')
}

/**
 * Presents an image picker appropriate for the platform.
 * iOS: action sheet with "Photos" and "Files" options.
 * Android: system file picker (covers photos natively).
 * Returns a base64 data URI, or null if cancelled.
 */
export function pickImageAsDataUri(): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return pickFromFiles()
  }

  return new Promise((resolve) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Choose from Photos', 'Browse Files'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) { resolve(null); return }
        if (buttonIndex === 1) {
          resolve(await pickFromPhotos())
        } else {
          resolve(await pickFromFiles())
        }
      },
    )
  })
}
