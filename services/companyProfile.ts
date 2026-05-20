import * as FileSystem from 'expo-file-system/legacy'
import * as DocumentPicker from 'expo-document-picker'

const DIR = FileSystem.documentDirectory + 'settings/'
const PROFILE_PATH = DIR + 'profile.json'

export interface CompanyProfile {
  name: string
  phone: string
  address1: string
  address2: string
  city: string
  province: string
  postalCode: string
  logoUri: string | null
}

export const EMPTY_PROFILE: CompanyProfile = {
  name: '', phone: '', address1: '', address2: '',
  city: '', province: '', postalCode: '', logoUri: null,
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true })
}

export async function loadProfile(): Promise<CompanyProfile> {
  try {
    const raw = await FileSystem.readAsStringAsync(PROFILE_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    })
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export async function saveProfile(profile: CompanyProfile): Promise<void> {
  await ensureDir()
  await FileSystem.writeAsStringAsync(PROFILE_PATH, JSON.stringify(profile), {
    encoding: FileSystem.EncodingType.UTF8,
  })
}

export async function pickAndSaveLogo(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'image/*',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  const asset = result.assets[0]
  await ensureDir()
  const ext = (asset.name?.split('.').pop() ?? 'png').toLowerCase()
  const dest = DIR + 'logo.' + ext
  await FileSystem.copyAsync({ from: asset.uri, to: dest })
  return dest
}

// ─── Helpers for InspectionScreen ────────────────────────────────────────────

// The groupKey for the service company subsection (non-repeatable, index 0)
export const SVC_GROUP_KEY = 's20_1__0'

export function profileToSvcValues(profile: CompanyProfile): Record<string, string> {
  const g = SVC_GROUP_KEY
  return {
    [`${g}/svc_company_name`]: profile.name,
    [`${g}/svc_phone`]: profile.phone,
    [`${g}/svc_address_1`]: profile.address1,
    [`${g}/svc_address_2`]: profile.address2,
    [`${g}/svc_city`]: profile.city,
    [`${g}/svc_province`]: profile.province,
    [`${g}/svc_postal_code`]: profile.postalCode,
  }
}

export function profileIsPopulated(profile: CompanyProfile): boolean {
  return profile.name.trim().length > 0
}

export function fileSvcDiffersFromProfile(
  fieldValues: Record<string, string>,
  profile: CompanyProfile,
): boolean {
  const fileName = fieldValues[`${SVC_GROUP_KEY}/svc_company_name`]?.trim() ?? ''
  return fileName.length > 0 && fileName !== profile.name.trim()
}
