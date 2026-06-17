import * as FileSystem from 'expo-file-system/legacy'

const DIR = FileSystem.documentDirectory + 'settings/'
const LOCATION_PATH = DIR + 'location_defaults.json'

export interface LocationDefaults {
  country: string
  province: string
  city: string
}

export const EMPTY_LOCATION_DEFAULTS: LocationDefaults = {
  country: '',
  province: '',
  city: '',
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

export async function loadLocationDefaults(): Promise<LocationDefaults> {
  try {
    const raw = await FileSystem.readAsStringAsync(LOCATION_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return { ...EMPTY_LOCATION_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_LOCATION_DEFAULTS }
  }
}

export async function saveLocationDefaults(loc: LocationDefaults): Promise<void> {
  await ensureDir()
  await FileSystem.writeAsStringAsync(LOCATION_PATH, JSON.stringify(loc), {
    encoding: FileSystem.EncodingType.UTF8,
  })
}
