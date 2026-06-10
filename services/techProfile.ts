import * as FileSystem from 'expo-file-system/legacy'

const DIR = FileSystem.documentDirectory + 'settings/'
const TECH_PATH = DIR + 'tech_profile.json'

export interface TechnicianProfile {
  name: string
  certNumber: string
}

export const EMPTY_TECH_PROFILE: TechnicianProfile = {
  name: '',
  certNumber: '',
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

export async function loadTechProfile(): Promise<TechnicianProfile> {
  try {
    const raw = await FileSystem.readAsStringAsync(TECH_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return { ...EMPTY_TECH_PROFILE, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_TECH_PROFILE }
  }
}

export async function saveTechProfile(profile: TechnicianProfile): Promise<void> {
  await ensureDir()
  await FileSystem.writeAsStringAsync(TECH_PATH, JSON.stringify(profile), {
    encoding: FileSystem.EncodingType.UTF8,
  })
}

export const TECH_GROUP_KEY = 's20__0'

export function techToFieldValues(profile: TechnicianProfile): Record<string, string> {
  const g = TECH_GROUP_KEY
  return {
    [`${g}/primary_tech_name`]: profile.name,
    [`${g}/primary_tech_id`]: profile.certNumber,
  }
}

export function techIsPopulated(profile: TechnicianProfile): boolean {
  return profile.name.trim().length > 0
}
