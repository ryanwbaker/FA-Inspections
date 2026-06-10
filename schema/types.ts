export type FieldType =
  | 'note'
  | 'label'
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

export type SectionType = 'repeatable_section' | 'repeatable_list' | 'repeatable_subsection'

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
  default?: string         // pre-populated value on new inspection creation
  computed?: string        // computation key; field is read-only and resolved by the app/PDF generator
  source_default?: string  // fieldValues key to copy as the initial value when creating a new list item
  notes?: NoteEntry[]      // explanatory notes rendered below the field
}

export interface NoteEntry {
  label: string
  group_label?: string
}

export interface ApplicableToggle {
  id: string
  label: string
  type: 'boolean'
  default: boolean
  grey_out?: boolean  // render content greyed-out when N/A instead of hiding it
}

export interface SubsectionDefinition {
  id: string
  title: string
  type?: SectionType
  fields?: FieldDefinition[]
  item_fields?: FieldDefinition[]
  notes_before?: NoteEntry[]
  notes_after?: NoteEntry[]
  mobile_note?: string
  applicable_toggle?: ApplicableToggle
  clause?: string
  reference?: string
  info_text?: string
}

export interface SectionDefinition {
  id: string
  title: string
  description?: string
  type?: SectionType
  fields?: FieldDefinition[]
  subsections?: SubsectionDefinition[]
  item_fields?: FieldDefinition[]
  notes_before?: NoteEntry[]
  notes_after?: NoteEntry[]
  instance_label?: string
  applicable_toggle?: ApplicableToggle
  mobile_note?: string
  clause?: string
  reference?: string
  info_text?: string
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
