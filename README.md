# FA Inspections — Schema & Form Engine

A schema-driven mobile inspection app built with Expo + React Native. Forms are defined entirely in JSON — no code changes needed to add or modify an inspection type.

---

## How It Works

Each inspection form is a single JSON schema file. The app reads the schema and renders the appropriate UI components automatically. To create a new form (for any inspection type, not just CAN/ULC), write a new schema file following the spec below.

---

## Schema Structure

```
InspectionSchema
  └── sections[]
        ├── fields[]        (flat section)
        ├── subsections[]   (grouped section)
        │     └── fields[]
        └── item_fields[]   (repeatable list)
```

### Top-Level Schema Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique schema identifier (e.g. `can_ulc_s536_2019`) |
| `title` | string | Display name of the form |
| `version` | string | Schema version string |
| `description` | string | Short description shown to the user |
| `defaults` | object | App-wide defaults. Currently: `{ "required": true }` |
| `sections` | array | Ordered list of top-level sections |
| `field_type_definitions` | object | Reference: describes each field type |

---

## Sections

A section is the top-level grouping for a form. Sections render as pages or collapsible cards on mobile.

### Section Properties

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique section identifier |
| `title` | string | Display title |
| `description` | string | Optional subtitle or instruction text |
| `type` | string | Section behaviour — see Section Types below |
| `fields` | array | Fields rendered directly in this section |
| `subsections` | array | Named sub-groups, each with their own `fields` |
| `item_fields` | array | Field template for repeatable lists |
| `instance_label` | string | Label for each instance (e.g. `"Control Unit"`) |
| `applicable_toggle` | object | Adds a Yes/No toggle that collapses the section if set to false |
| `mobile_note` | string | Rendering hint for the mobile UI |
| `clause` | string | Optional standard clause reference (CAN/ULC-specific) |

### Section Types

| `type` value | Behaviour |
|---|---|
| *(omitted)* | Standard section — renders `fields` or `subsections` once |
| `repeatable_section` | The entire section (including all its subsections) can be instantiated multiple times. Use for things like "one per control unit" or "one per building floor". |
| `repeatable_list` | Renders an add/remove item interface. Each item is a card built from `item_fields`. Use for tabular records like device logs or deficiency lists. |

### `applicable_toggle`

Makes a section optional. Renders a toggle at the top of the section; if switched off, the section body collapses and its fields are skipped.

```json
"applicable_toggle": {
  "id": "vc_applicable",
  "label": "Voice Communication capabilities exist on this system",
  "type": "boolean",
  "default": true
}
```

---

## Fields

Fields are the leaf-level inputs. They appear inside `fields`, `subsections[].fields`, or `item_fields` arrays.

### Field Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Unique field identifier within the schema. Used as the data key. |
| `label` | string | yes | Display label shown to the user |
| `type` | string | yes | Input type — see Field Types below |
| `required` | boolean | no | Set `false` to make the field optional. Fields are required by default. |
| `options` | array | depends | List of option strings for `radio`, `multi_checkbox`, `dropdown` |
| `conditional_on` | object | no | Hides this field unless a condition is met — see Conditionals below |
| `hint` | string | no | Placeholder or helper text shown inside the input |
| `auto_increment` | boolean | no | Automatically sets integer value on each new list item |
| `source` | string | no | Reference to a `device_type_legend` or lookup table (e.g. `"s23_1.device_type_legend"`) |

### Field Types

| Type | Component | Notes |
|---|---|---|
| `string` | Single-line text input | General text |
| `textarea` | Multi-line text input | Notes, descriptions |
| `integer` | Number input (numeric keyboard) | Whole numbers only |
| `number` | Number input (numeric keyboard) | Decimals allowed |
| `date` | Date picker | Stored as `YYYY-MM-DD`, displayed as `MM/DD/YY` |
| `time` | Time picker | 12h or 24h |
| `phone` | Phone input with formatting | |
| `boolean` | Single on/off toggle | |
| `boolean_yn` | Yes / No two-button toggle | |
| `tri_state` | Pass (✓) / Fail (✗) / N/A (—) | Core test result type |
| `pass_fail` | Pass (P) / Fail (F) | Used for circuit fault tolerance |
| `radio` | Single-select from a fixed list | Requires `options` array |
| `multi_checkbox` | Multi-select checkboxes | Requires `options` array |
| `dropdown` | Searchable single-select picker | Requires `options` or `source` |
| `signature` | Touch/stylus signature capture | Stores image + timestamp |

---

## Conditionals

A field can be hidden until another field meets a condition.

```json
"conditional_on": { "field": "system_stage", "value": "Other" }
```

```json
"conditional_on": { "field": "system_technology", "contains": "Conventional" }
```

```json
"conditional_on": { "field": "eps_type", "contains_any": ["Generator", "Combination"] }
```

```json
"conditional_on": { "field": "dev_type", "value_in": ["OD", "MC", "V"] }
```

| Operator | Matches when… |
|---|---|
| `value` | Field equals this exact value |
| `contains` | Field (multi-select) includes this value |
| `contains_any` | Field (multi-select) includes any of these values |
| `value_in` | Field value is in this list |

---

## Defaults

Fields are **required by default**. Only set `"required": false` to make a field optional:

```json
{ "id": "contact_fax", "label": "Contact Fax", "type": "phone", "required": false }
```

The app-wide default is stored in the schema's top-level `defaults` block:

```json
"defaults": {
  "required": true
}
```

---

## Writing a Custom Form

Below is a minimal, non-CAN/ULC schema you can use as a starting point for any inspection type:

```json
{
  "id": "fire_extinguisher_annual_2024",
  "title": "Fire Extinguisher Annual Inspection",
  "version": "2024/1",
  "description": "Annual inspection record for portable fire extinguishers.",

  "defaults": {
    "required": true
  },

  "sections": [
    {
      "id": "s_info",
      "title": "Inspection Info",
      "fields": [
        { "id": "tech_name",     "label": "Technician Name",  "type": "string" },
        { "id": "tech_cert",     "label": "Certificate No.",  "type": "string" },
        { "id": "date_service",  "label": "Date of Service",  "type": "date" },
        { "id": "work_order",    "label": "Work Order No.",   "type": "string" },
        { "id": "tech_sig",      "label": "Signature",        "type": "signature" }
      ]
    },

    {
      "id": "s_building",
      "title": "Building Information",
      "fields": [
        { "id": "bldg_name",    "label": "Building Name",    "type": "string" },
        { "id": "bldg_address", "label": "Street Address",   "type": "string" },
        { "id": "bldg_contact", "label": "Contact Person",   "type": "string" },
        { "id": "bldg_phone",   "label": "Contact Phone",    "type": "phone" }
      ]
    },

    {
      "id": "s_devices",
      "title": "Extinguisher Records",
      "type": "repeatable_list",
      "item_fields": [
        { "id": "ext_location",     "label": "Location",               "type": "string" },
        { "id": "ext_type",         "label": "Agent Type",             "type": "radio",    "options": ["ABC Dry Chemical", "CO2", "Class K", "Water", "Halon"] },
        { "id": "ext_size",         "label": "Size (lbs / L)",         "type": "string" },
        { "id": "ext_last_service", "label": "Last Service Date",      "type": "date",     "required": false },
        { "id": "ext_hydro_date",   "label": "Hydrostatic Test Date",  "type": "date",     "required": false },
        { "id": "ext_seal_intact",  "label": "Tamper Seal Intact",     "type": "boolean_yn" },
        { "id": "ext_pin_present",  "label": "Safety Pin Present",     "type": "boolean_yn" },
        { "id": "ext_gauge_ok",     "label": "Gauge in Operable Range","type": "tri_state" },
        { "id": "ext_accessible",   "label": "Unobstructed / Accessible", "type": "tri_state" },
        { "id": "ext_condition",    "label": "Physical Condition",     "type": "tri_state" },
        { "id": "ext_comments",     "label": "Comments",               "type": "textarea", "required": false }
      ]
    }
  ]
}
```

---

## Project Roadmap

This app is being built in stages. See [claude.md](claude.md) for the full roadmap.

| Stage | Description | Status |
|---|---|---|
| 1 | Form Engine (UI Only) | In progress |
| 2 | Schema System | In progress |
| 3 | Local Persistence (Offline) | Planned |
| 4 | Backend + Multi-Tenant | Planned |
| 5 | Admin Panel | Planned |
| 6 | Real Offline Sync | Planned |
| 7 | PDF Generation + Audit Logs | Planned |
| 8 | Billing (Stripe) | Planned |
