import type { DeviceLegendEntry } from '../constants/legend'

export interface StoredListItem {
  id: string
  values: Record<string, string>
}

export interface InspectionDocument {
  id: string
  schemaId: string
  schemaVersion: string
  status: 'draft' | 'signed'
  filename: string
  filePath: string | null     // absolute path on device; null until first auto-save
  createdAt: string           // ISO
  updatedAt: string

  // Navigation / structure
  repeatableGroups: Record<string, string[]>   // sectionId → groupKey[]
  applicableStates: Record<string, boolean>    // pageKey → isApplicable (overrides only)

  // Form data — all field values serialised to strings
  // Key: `${groupKey}/${fieldId}`
  fieldValues: Record<string, string>

  // Repeatable list items — covers repeatable_list and device_record_list sections
  // Key: `${groupKey}/${targetId}`
  listItems: Record<string, StoredListItem[]>

  // Legend (§23.1) — per-inspection, technician adds system-specific hardware
  legend: DeviceLegendEntry[]
}

export type InspectionAction =
  | { type: 'SET_FIELD'; key: string; value: string }
  | { type: 'SET_LIST_ITEMS'; key: string; items: StoredListItem[] }
  | { type: 'SET_LEGEND'; legend: DeviceLegendEntry[] }
  | { type: 'SET_APPLICABLE'; pageKey: string; value: boolean }
  | { type: 'ADD_GROUP'; sectionId: string; groupKey: string }
  | { type: 'REMOVE_GROUP'; groupKey: string; pageKeys: string[] }
  | { type: 'SET_FILENAME'; filename: string }
  | { type: 'SET_FILE_PATH'; filePath: string }
