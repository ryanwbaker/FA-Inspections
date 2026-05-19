export type FieldType =
  | 'string'
  | 'textarea'
  | 'integer'
  | 'number'
  | 'date'
  | 'time'
  | 'phone'
  | 'boolean'
  | 'boolean_yn'
  | 'tri_state'
  | 'pass_fail'
  | 'radio'
  | 'multi_checkbox'
  | 'dropdown'
  | 'signature'

export type SectionType = 'repeatable_section' | 'repeatable_list'

export interface ConditionalOn {
  field: string
  value?: unknown
  contains?: string
  contains_any?: string[]
  value_in?: string[]
}

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  required?: boolean       // defaults to true per schema defaults
  options?: string[]
  conditional_on?: ConditionalOn
  hint?: string
  auto_increment?: boolean
  source?: string
  group_label?: string     // visual group header rendered before this field within its card
}

export interface ApplicableToggle {
  id: string
  label: string
  type: 'boolean'
  default: boolean
}

export interface SubsectionDefinition {
  id: string
  title: string
  type?: SectionType
  fields?: FieldDefinition[]
  item_fields?: FieldDefinition[]
  mobile_note?: string
  applicable_toggle?: ApplicableToggle
  clause?: string
  reference?: string
}

export interface SectionDefinition {
  id: string
  title: string
  description?: string
  type?: SectionType
  fields?: FieldDefinition[]
  subsections?: SubsectionDefinition[]
  item_fields?: FieldDefinition[]
  instance_label?: string
  applicable_toggle?: ApplicableToggle
  mobile_note?: string
  clause?: string
  reference?: string
}

export interface InspectionSchema {
  id: string
  title: string
  version: string
  description: string
  defaults: {
    required: boolean
  }
  mobile_notes: {
    tri_state_legend: { pass: string; fail: string; na: string }
    skip_pattern: string
  }
  sections: SectionDefinition[]
  field_type_definitions: Record<string, string>
}
