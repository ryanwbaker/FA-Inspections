# QW Forms

A standalone, offline-first mobile app for creating and filling out custom digital forms on iOS. Forms are defined entirely in JSON — no code changes needed to add a new form type. Built for Quickway Electric.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Xcode (latest stable)
- CocoaPods (`sudo gem install cocoapods`)

### First-time setup after cloning

```bash
npm ci                            # install JS dependencies
cd ios && pod install && cd ..    # install native iOS dependencies
npx expo run:ios                  # build and launch on simulator
```

### Regenerating the native iOS project

Only needed if you change `app.json` (icon, splash screen, bundle ID, Info.plist entries, etc.):

```bash
npx expo prebuild --platform ios --no-install
cd ios && pod install && cd ..
npx expo run:ios
```

---

## How It Works

Each form is a JSON schema file. The app reads the schema and renders the appropriate UI components automatically. To create a new form type, write a schema file and import it via Settings → Form Schemas.

PDF output is controlled by a separate JSON theme file (Settings → PDF Themes). The same form data can be rendered with different themes.

---

## Schema Structure

```
InspectionSchema
  └── sections[]
        ├── fields[]        (flat section)
        ├── subsections[]   (grouped section)
        │     └── fields[]
        └── item_fields[]   (repeatable list / table)
```

### Top-Level Schema Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique schema identifier |
| `title` | string | Display name of the form |
| `formId` | string | Form number shown in PDF headers |
| `version` | string | Schema version string |
| `description` | string | Short description shown to the user |
| `template` | string | PDF template ID (defaults to `"default"`) |
| `defaults` | object | App-wide defaults: `{ "required": true }` |
| `sections` | array | Ordered list of top-level sections |

---

## Sections

### Section Properties

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique section identifier |
| `title` | string | Display title |
| `clause` | string | Optional standard clause reference (e.g. `"20.1"`) |
| `type` | string | Section behaviour — see Section Types below |
| `fields` | array | Fields rendered directly in this section |
| `subsections` | array | Named sub-groups, each with their own `fields` |
| `item_fields` | array | Field template for repeatable list rows |
| `instance_label_field` | string | Which `item_field` id drives the row title in lists |
| `applicable_toggle` | object | Adds a Yes/No toggle that collapses the section if false |
| `notes_before` | NoteEntry[] | Explanatory text rendered before section content (appears in PDF) |
| `notes_after` | NoteEntry[] | Regulatory clauses or footnotes rendered after content |
| `mobile_note` | string | In-app hint text (not shown in PDF) |
| `info_text` | string | Info banner shown in-app above the section |

### Section Types

| `type` value | Behaviour |
|---|---|
| *(omitted)* | Standard section — renders `fields` or `subsections` once |
| `repeatable_section` | Entire section can be instantiated multiple times |
| `repeatable_list` | Renders an add/remove item table built from `item_fields` |
| `device_legend` | Renders the field device legend (editable code reference table) |
| `device_record_list` | Per-device test records linked against the device legend |

### Notes (`notes_before` / `notes_after`)

```json
"notes_before": [
  { "label": "Complete one section per <i>control unit</i>." },
  { "label": "See <a ref=\"s22_1\">§22.1</a> for definitions.", "group_label": "Reference" }
]
```

Notes support inline markup: `<i>`, `<b>`, `<strong>`, `<em>`, `<u>`. Cross-reference links via `<a ref="sectionId">` are tappable in the mobile form and navigate to that section.

---

## Fields

### Field Properties

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique field identifier within the schema |
| `label` | string | Display label (supports `<i>`, `<b>` markup) |
| `type` | string | Input type — see Field Types below |
| `required` | boolean | Defaults to `true`. Set `false` to make optional. |
| `options` | array | Option strings for `radio`, `multi_checkbox`, `dropdown` |
| `optionLabels` | array | Display labels parallel to `options` (stored value vs. shown value) |
| `options_source` | string | ID of a `device_legend` section — populates options from the legend |
| `conditional_on` | object | Hides this field unless a condition is met |
| `hint` | string | Placeholder or helper text |
| `auto_increment` | boolean | Auto-sets integer value on each new list item |
| `source` | string | Profile default key: `company_profile.name`, `tech_profile.certNumber`, `location.city`, `custom.key` |
| `group_label` | string | Renders a section header before this field within its card |
| `default` | string | Pre-populated value on new form creation. `"$today"` inserts today's date. |
| `computed` | string | Auto-computed: `"pdf_page_count"`, `"list_non_empty:<listId>"`, `"field_non_empty:<fieldId>"` |
| `pdf_hidden` | boolean | Field shown in mobile form but omitted from the PDF field table |
| `notes` | NoteEntry[] | Explanatory notes rendered below the field |

### Field Types

| Type | Component | Notes |
|---|---|---|
| `string` | Single-line text input | |
| `textarea` | Multi-line text input | |
| `integer` | Number input | Whole numbers only |
| `number` | Number input | Decimals allowed |
| `date` | Date picker | Stored as `YYYY-MM-DD` |
| `time` | Text input | Format: `HH:MM` |
| `phone` | Text input | Phone keyboard |
| `boolean_yn` | Yes / No toggle | |
| `tri_state` | Pass ✓ / Fail ✗ / N/A — | Core test result type |
| `pass_fail` | Pass P / Fail F | |
| `radio` | Single-select button group | Requires `options` |
| `multi_checkbox` | Multi-select checkboxes | Requires `options` |
| `dropdown` | Single-select picker | Requires `options` or `options_source` |
| `signature` | Touch signature capture | Stored as base64 data URI |
| `image` | Image picker | Stored as base64 data URI; supports Photos and Files |
| `note` | Static text block | Label is rendered as prose; no input |
| `label` | Static label | Rendered inline; no input |

---

## Conditionals

```json
"conditional_on": { "field": "system_stage", "value": "Other" }
"conditional_on": { "field": "technology", "contains": "Conventional" }
"conditional_on": { "field": "eps_type", "contains_any": ["Generator", "Combination"] }
"conditional_on": { "field": "dev_type", "value_in": ["OD", "MC", "V"] }
```

| Operator | Matches when… |
|---|---|
| `value` | Field equals this exact value |
| `contains` | Field (multi-select) includes this value |
| `contains_any` | Field (multi-select) includes any of these values |
| `value_in` | Field value is in this list |

---

## Default Values via `source`

Fields with a `source` property are auto-populated when a new form is created, using values from the user's saved defaults.

| Source prefix | Populated from |
|---|---|
| `company_profile.*` | Settings → Defaults → Company Info |
| `tech_profile.*` | Settings → Defaults → Primary Technician |
| `location.*` | Settings → Defaults → Default Location |
| `custom.*` | Settings → Defaults → Custom Defaults |

Example:
```json
{ "id": "company_name", "label": "Company", "type": "string", "source": "company_profile.name" }
```

---

## PDF Themes

PDF output is controlled by a JSON theme file separate from the schema. Themes live in `pdf_themes/` (bundled) or `Documents/themes/` (user-imported).

```json
{
  "id": "my_theme",
  "name": "My Custom Theme",
  "page": { "size": "letter", "margins": { "top": 50, "right": 47, "bottom": 36, "left": 47 } },
  "colors": { "accent": "#D4380D", "pass": "#389E0D", "fail": "#CF1322", ... },
  "cover": { "show_logo": true, "show_title": true, "show_company_block": true },
  "header": { "left": ["logo", "company_name"], "right": ["form_id"] },
  "footer": { "left": ["form_id", "doc_filename"], "right": ["page_of_total"] }
}
```

Header/footer slots: `logo`, `company_name`, `form_id`, `schema_title`, `doc_filename`, `today`, `page_of_total`.

---

## Example Schema

```json
{
  "id": "fire_extinguisher_annual",
  "title": "Fire Extinguisher Annual Inspection",
  "formId": "FE-ANNUAL-2024",
  "version": "2024/1",
  "description": "Annual inspection record for portable fire extinguishers.",
  "defaults": { "required": true },
  "sections": [
    {
      "id": "s_info",
      "title": "Inspection Info",
      "fields": [
        { "id": "tech_name",    "label": "Technician Name", "type": "string", "source": "tech_profile.name" },
        { "id": "date_service", "label": "Date of Service", "type": "date",   "default": "$today" },
        { "id": "work_order",   "label": "Work Order No.",  "type": "string" },
        { "id": "tech_sig",     "label": "Signature",       "type": "signature" }
      ]
    },
    {
      "id": "s_devices",
      "title": "Extinguisher Records",
      "type": "repeatable_list",
      "instance_label_field": "ext_location",
      "item_fields": [
        { "id": "ext_location",  "label": "Location",          "type": "string" },
        { "id": "ext_type",      "label": "Agent Type",        "type": "radio", "options": ["ABC Dry Chemical", "CO2", "Class K", "Water"] },
        { "id": "ext_gauge_ok",  "label": "Gauge in Range",    "type": "tri_state" },
        { "id": "ext_condition", "label": "Physical Condition","type": "tri_state" },
        { "id": "ext_comments",  "label": "Comments",          "type": "textarea", "required": false }
      ]
    }
  ]
}
```

---

## Roadmap

See [CLAUDE.md](CLAUDE.md) for the full development roadmap.

| Stage | Description | Status |
|---|---|---|
| 1 | Form Engine | ✓ Complete |
| 2 | Schema System | ✓ Complete |
| 3 | Local Persistence | ✓ Complete |
| 3.5 | Defaults + Settings | ✓ Complete |
| 4 | PDF Generation | ✓ Complete |
| 5 | Schema + Theme Ecosystem | In Progress |
| 6 | App Store Release | Planned |
| 7 | Cloud Storage Sync (iCloud, Google Drive, OneDrive) | Planned |
