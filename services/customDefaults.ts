import * as FileSystem from 'expo-file-system/legacy'

export interface CustomDefault {
  id: string
  key: string    // source path suffix — accessible in schemas as custom.{key}
  value: string
}

const PATH = FileSystem.documentDirectory + 'settings/custom_defaults.json'

export async function loadCustomDefaults(): Promise<CustomDefault[]> {
  try {
    const raw = await FileSystem.readAsStringAsync(PATH)
    return JSON.parse(raw) as CustomDefault[]
  } catch {
    return []
  }
}

export async function saveCustomDefaults(defaults: CustomDefault[]): Promise<void> {
  await FileSystem.writeAsStringAsync(PATH, JSON.stringify(defaults))
}

// Returns a plain object keyed by custom.{key} for use in resolveSourceDefaults profiles bag.
export function toProfilesBag(defaults: CustomDefault[]): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const d of defaults) {
    if (d.key.trim()) obj[d.key.trim()] = d.value
  }
  return obj
}

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
export { newId as newCustomDefaultId }
