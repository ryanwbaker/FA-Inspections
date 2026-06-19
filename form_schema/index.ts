export type { InspectionSchema, SectionDefinition, SubsectionDefinition, FieldDefinition, FieldType, ConditionalOn, ApplicableToggle } from './types'

// Re-export async store API for callers that need dynamic (user + system) schemas
export { getSchema, listAllSchemas, listSystemSchemas, isSystemSchema } from '../services/schemaStore'

// Sync helpers for callers that only need bundled schemas (e.g. navigation params lookup at render time)
import canUlcS536 from './can_ulc_s536.json'
import type { InspectionSchema } from './types'

const BUNDLED: Record<string, InspectionSchema> = {
  [canUlcS536.id]: canUlcS536 as unknown as InspectionSchema,
}

export function getSchemaSync(id: string): InspectionSchema | undefined {
  return BUNDLED[id]
}

export function listSchemas(): InspectionSchema[] {
  return Object.values(BUNDLED)
}
