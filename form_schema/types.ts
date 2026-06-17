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

export type SectionType =
  | 'repeatable_section'
  | 'repeatable_list'
  | 'repeatable_subsection'
  | 'device_legend'        // renders LegendTable (editable device-type reference table)
  | 'device_record_list'   // renders DeviceList (per-device records, looked up against the device_legend)

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
  optionLabels?: string[]  // parallel display strings for options; optionLabels[i] shown, options[i] stored
  options_source?: string | string[]  // ID (or array of IDs) of device_legend sections — populates options from doc.legend at render time
  options_display?: 'code' | 'description' | 'both'  // how legend options are labelled (default: 'both')
  conditional_on?: ConditionalOn
  hint?: string
  auto_increment?: boolean
  source?: string          // profile default key, e.g. "company_profile.name", "tech_profile.cert_number", "location.city"
  group_label?: string     // visual group header rendered before this field within its card
  default?: string         // pre-populated value on new inspection creation
  computed?: string        // computation key; "list_non_empty:<listId>" | "field_non_empty:<fieldId>" | "pdf_page_count"
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
  formId: string
  version: string
  description: string
  template?: string   // ID of the PDF template in forms/ (defaults to schema id)
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
