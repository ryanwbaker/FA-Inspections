import type { InspectionSchema } from './types'

import canUlcS536 from './can_ulc_s536.json'

export type { InspectionSchema, SectionDefinition, SubsectionDefinition, FieldDefinition, FieldType, ConditionalOn, ApplicableToggle } from './types'

const schemaRegistry: Record<string, InspectionSchema> = {
  [canUlcS536.id]: canUlcS536 as unknown as InspectionSchema,
}

export function getSchema(id: string): InspectionSchema | undefined {
  return schemaRegistry[id]
}

export function listSchemas(): InspectionSchema[] {
  return Object.values(schemaRegistry)
}

export { schemaRegistry }
