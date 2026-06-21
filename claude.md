# QW Forms — Development Roadmap

## Vision

QW Forms (Quickway Forms) is a standalone, offline-first native mobile app for creating and filling out custom digital forms on iOS. Built for Quickway Electric and anyone who needs quick, mobile-optimized forms with professional PDF output — no cloud account, no subscription, no server required.

The name is intentional: **Quick**way + **Quick** forms. Fast to fill out, easy to customize, always available offline.

Core goals:
- Mobile-first form experience
- Schema-driven dynamic forms (no hardcoding per form type)
- Schemas and PDF themes are external JSON files — importable, shareable, editable off-app
- Professional PDF export with multi-orientation support
- Everything runs on-device

This roadmap prioritizes:
- Fast iteration
- Clean architecture
- Avoiding premature complexity

---

# Architecture Principles

1. **Form schema = model.** The JSON schema defines structure, fields, validation, and defaults.
2. **Form engine = mobile view.** React Native components render any schema without per-form code.
3. **PDF theme = print view.** JSON theme files drive PDF layout, colors, and margins — separate from schema.
4. **Store data as JSON documents.** One file per form submission; no SQL tables per section.
5. **Local-first.** Everything works offline. Sharing is via the iOS share sheet.
6. **Schemas and themes are loadable at runtime.** Users can import new form types without an app update.
7. **Optimize for maintainability, not premature scale.**

---

# Stage 1 — Form Engine ✓ Complete

- Expo bare workflow + React Native (plain StyleSheet)
- useReducer + React Context
- Schema-driven paginated form UI
- All field types: string, textarea, number, integer, date, time, phone, boolean_yn, tri_state, pass_fail, radio, multi_checkbox, dropdown, signature, image
- Repeatable sections and repeatable lists
- Optional sections with applicable_toggle
- Conditional field rendering (value, contains, contains_any, value_in)
- Collapsible sidebar with section navigation + add/remove group instances

---

# Stage 2 — Schema System ✓ Complete

## Core Types

**FieldDefinition:** id, label, type, required?, options?, conditional_on?, hint?, auto_increment?, source?, group_label?, pdf_hidden?, instance_label_field?, notes?

**SectionDefinition:** id, title, type?, fields?, subsections?, item_fields?, instance_label_field?, applicable_toggle?, clause?, notes_before?, notes_after?

**InspectionSchema:** id, title, formId, version, description, template?, defaults, sections[]

## Built
- Full CAN/ULC-S536:2019 schema in `form_schema/can_ulc_s536.json`
- `group_label` for inline visual grouping within a card
- FormPage model derived via useMemo from repeatableGroups + applicableStates
- Conditional field rendering
- `pdf_hidden` flag — field visible in form but omitted from PDF field grid
- `instance_label_field` — which item_field drives the row title in repeatable lists
- Section cross-reference links in notes via `<a ref="sectionId">` syntax

---

# Stage 3 — Local Persistence ✓ Complete

- expo-file-system/legacy (JSON files in app sandbox)
- expo-sharing (share sheet for file export)
- expo-document-picker (import from Files app)
- InspectionDocument as a single JSON blob per submission
- InspectionContext (useReducer) — all form state flows through this
- Auto-save with 2s debounce; Save As; Share via iOS share sheet
- Home screen lists all saved forms with open/delete/import/bulk-share
- Search within saved forms

Document structure:
- id, schemaId, schemaVersion, themeId, status (draft | signed)
- filename, filePath, createdAt, updatedAt
- fieldValues: Record<string, string> — keyed `${groupKey}/${fieldId}`
- listItems: Record<string, StoredListItem[]>
- legend: DeviceLegendEntry[]
- repeatableGroups, applicableStates

---

# Stage 3.5 — Defaults + Settings ✓ Complete

## Built
- Settings hub screen → Defaults / Schemas / Themes / Templates sub-screens
- **Defaults:** company profile (name, phone, address, logo), technician defaults, location defaults, custom key-value defaults (`custom.*` source)
- **Schemas:** import/export/delete user form schemas; system schemas protected
- **Themes:** import/export/delete user PDF themes; system themes protected
- **Templates:** named schema + theme combos; system templates hideable; user templates creatable
- Home screen shows templates instead of raw schemas
- New forms auto-populate from saved defaults via `source` field mapping
- On file load: conflict prompt if company name differs from settings

## Notes
- Signatures and images stored as base64 data URIs in fieldValues
- Logo is now a schema field (`type: image`, `pdf_hidden: true`, `source: company_profile.logoUri`) — travels with the form file, editable in-form
- Custom defaults accessible in schemas via `source: "custom.key_name"`

---

# Stage 4 — PDF Generation ✓ Complete (refinement ongoing)

## Architecture
- **Model:** form schema (JSON)
- **View:** `forms/universal.ts` — universal renderer driven by the schema + a PDF theme
- **Theme:** `pdf_themes/*.json` — controls colors, margins, cover layout, header/footer slots

## Stack
- expo-print (`printToFileAsync`) — HTML → PDF via iOS WKWebView
- react-native-webview — hidden measurement pass
- expo-sharing — share/export PDF
- pdf-lib — merge portrait + landscape PDFs

## How PDF generation works
1. **Measure:** load the full HTML in an off-screen WebView (816px wide to match print context); pagination script bins sections into pages, postMessages the layout
2. **Portrait pass:** generate static HTML from layout (pre-built page divs + small script to set pixel heights); print at portrait orientation
3. **Landscape pass** (if landscape sections exist): generate HTML for wide tables only; print at landscape orientation
4. **Merge:** pdf-lib splices landscape pages into the portrait PDF at the correct positions
5. Share via iOS share sheet

## Landscape sections
Sections classified as landscape: `device_legend`, `device_record_list`, `repeatable_list` with >5 item_fields AND actual data rows.

## Notes
- PDF themes are external JSON — users can import custom themes without an app update
- `pdf_hidden: true` on a field: shown in mobile form, omitted from PDF field table (used for the logo field)
- Measurement WebView must be 816px wide to match expo-print's body width for letter paper

---

# Stage 5 — Schema + Theme Ecosystem (In Progress)

## Goal
Make it easy to author, distribute, and update form schemas and PDF themes without an app update.

## What's done
- Runtime schema loading from `Documents/schemas/`
- Runtime theme loading from `Documents/themes/`
- Import/export via share sheet + document picker
- Templates (schema + theme combo) stored in `Documents/templates/`

## What's next
- Schema authoring guide / documentation
- More built-in form schemas beyond CAN/ULC-S536
- Ability to download schemas/themes from a URL (simple fetch, no auth)

---

# Stage 6 — Polish + App Store Release

## Goal
Ship a clean, stable v1.0 to the App Store.

## Deliverables
- App icon + splash screen finalized (QW Forms branding)
- Bundle ID finalized (`com.quickway.qwforms` or similar)
- Onboarding / first-run experience
- App Store listing copy + screenshots
- TestFlight beta → App Store submission

---

# Stage 7 — Cloud Storage Sync (Last)

## Goal
Allow users to back up and access their forms from their preferred cloud storage provider. No proprietary server — we write to the user's own cloud storage account.

## Providers
- **iCloud Drive** — native iOS integration, no separate login required
- **Google Drive** — via Google Drive API + OAuth
- **Microsoft OneDrive** — via Microsoft Graph API + OAuth

## Approach
Each provider gets a dedicated folder (e.g., `QW Forms/inspections/`). The app reads/writes form JSON files to that folder. No server middleware — the app communicates directly with each provider's API.

Schemas and themes could optionally sync the same way, making it easy to share custom forms across devices.

## Notes
- iCloud is the highest-value first since it requires no extra login on iOS
- Google Drive and OneDrive need OAuth flows and their respective SDKs
- Conflict resolution strategy needed when the same file is edited on two devices

---

# What This Is Not

- Not a SaaS
- Not multi-tenant
- Not subscription-based
- Not a server-dependent app

QW Forms is a **native tool** — like a sophisticated PDF app with a built-in form engine. It runs entirely on-device. Distribution is via the App Store.

---

# Key File Locations

| What | Where |
|---|---|
| Form schemas | `form_schema/` (bundled), `Documents/schemas/` (user) |
| PDF themes | `pdf_themes/` (bundled), `Documents/themes/` (user) |
| Universal PDF renderer | `forms/universal.ts` |
| Field components | `components/fields/` |
| Form engine | `components/form/` |
| Settings sub-screens | `screens/settings/` |
| Store services | `services/schemaStore.ts`, `themeStore.ts`, `templateStore.ts` |
| Defaults | `services/companyProfile.ts`, `techProfile.ts`, `locationDefaults.ts`, `customDefaults.ts` |
| PDF merge | `services/pdfMerge.ts` |
