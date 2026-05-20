# Fire Alarm Inspection SaaS — Development Roadmap

## Vision

Build a schema-versioned, offline-capable, multi-tenant fire alarm inspection SaaS with:

- Mobile-first inspection workflow
- Schema-driven dynamic forms
- Annual rollover + schema connectors
- Offline drafting + cloud sync
- PDF exports
- Audit logs
- Subscription billing

This roadmap prioritizes:

- Fast iteration
- Clean architecture
- Progressive hardening
- Avoiding premature complexity

---

# Architecture Principles

1. Build the form engine first.
2. Separate UI rendering from schema definition.
3. Store inspections as JSON documents (not per-section SQL tables).
4. Add cloud only after local persistence works.
5. Add billing last.
6. Optimize for maintainability, not premature scale.

---

# Stage 1 — Form Engine (UI Only) ✓ Complete

## Stack Used
- Expo bare workflow + React Native (plain StyleSheet — no Tamagui)
- useReducer + React Context (no React Hook Form)
- Static JSON schema (no Zod validation yet)

## Built
- Schema-driven paginated form UI
- SectionPage, FormField, PaginationStepper, SectionSidebar
- DeviceList, ItemList, LegendTable
- All field types: string, number, date, phone, boolean_yn, tri_state, radio, multi_checkbox, signature
- Repeatable sections and repeatable lists
- Optional sections with applicable_toggle
- Collapsible sidebar with section navigation + add/remove group instances

---

# Stage 2 — Schema System ✓ Complete

## Core Types (Actual)

FieldDefinition:
- id, label, type, required?, options?, conditional_on?, hint?, auto_increment?, source?, group_label?

SectionDefinition:
- id, title, description?, type?, fields?, subsections?, item_fields?, instance_label?, applicable_toggle?, clause?

InspectionSchema:
- id, title, version, description, defaults, sections[], field_type_definitions

## Built
- Full CAN/ULC-S536:2019 schema in `schema/can_ulc_s536.json`
- `group_label` on FieldDefinition for inline visual grouping within a card (no extra pagination)
- FormPage model derived via useMemo from repeatableGroups + applicableStates
- Conditional field rendering (value, contains, contains_any, value_in)

## Notes
- Company profile (name, address, credentials) will be a separate profile/settings feature in Stage 4+. Do not add company address fields to the inspection schema — the inspection covers the site only.

---

# Stage 3 — Local Persistence (Offline-Only) ✓ Complete

## Stack Used
- expo-file-system/legacy (JSON files in app sandbox — not SQLite)
- expo-sharing (share sheet for file export)
- expo-document-picker (import from Files app)

## Built
- InspectionDocument as a single JSON blob per inspection
- InspectionContext (useReducer) — all form state flows through this
- Auto-save with 2s debounce; Save As; Share via iOS share sheet
- Home screen (SchemaListScreen) lists all saved inspections with open/delete/import
- Inspection document structure:
  - id, schemaId, schemaVersion, status (draft | signed)
  - filename, filePath, createdAt, updatedAt
  - fieldValues: Record<string, string>  — keyed `${groupKey}/${fieldId}`
  - listItems: Record<string, StoredListItem[]>
  - deviceRecords: Record<string, DeviceRecord[]>
  - legend: DeviceLegendEntry[]
  - repeatableGroups: Record<string, string[]>
  - applicableStates: Record<string, boolean>

## Notes
- Files save to the iOS app sandbox (`Documents/inspections/`). They are NOT visible in the iOS Files app without `UIFileSharingEnabled` in Info.plist. Share sheet is the correct export path for now.

Outcome: Fully functional offline inspection app.

---

# Stage 3.5 — Company Profile + Settings ✓ Complete

## Built
- `services/companyProfile.ts` — load/save profile as JSON in sandbox (`Documents/settings/`)
- `screens/SettingsScreen.tsx` — company name, phone, address, logo (picked via document picker)
- Settings accessible via ⚙ button on home screen
- New inspections auto-populate service company fields (svc_*) from saved profile
- On file load: if file has different company name than settings, user is prompted — "Use My Settings" or "Keep File Data"
- Logo stored as a copied image file in `Documents/settings/logo.{ext}`

## Notes
- Signatures are stored as base64 data URIs in `fieldValues`. This is fine for local JSON (typically 20–50 KB per signature). When cloud sync is added in Stage 6, extract to Supabase Storage and replace with a URL. For PDF generation, base64 embeds directly into HTML — no change needed.
- Company profile fields map to the `s20_1_service` subsection (`groupKey: s20_1__0`).

---

# Stage 4 — PDF Generation (Next Priority)

## Goal
Generate a compliant CAN/ULC-S536 inspection report PDF from within the app.

## Approach
Mobile-first: generate HTML from the inspection document, render it in a WebView, and print/export via the iOS print system (AirPrint / Save to Files). No server required.

## Stack (proposed)
- `react-native-webview` — render the HTML report preview
- `expo-print` — convert HTML to PDF using iOS WKWebView print pipeline
- `expo-sharing` — share/export the resulting PDF file

## Deliverables
- HTML report template matching CAN/ULC-S536 layout
  - Cover page: company logo, company info, building info, system info
  - One section per schema section, preserving clause references
  - Device tables, item lists, tri-state results with pass/fail/na styling
  - Signature fields rendered as embedded images (base64)
- PDF generation triggered from the inspection sidebar ("Export PDF…")
- PDF saved to sandbox, then shared via share sheet

## Notes
- Generate PDF client-side only. No server dependency at this stage.
- Company logo (base64 or file URI) and signatures (base64) embed directly into HTML.
- Signed inspections should generate a final PDF automatically on signing.

---

# Stage 5 — Backend + Multi-Tenant Structure

## Goal
Introduce cloud persistence and organization separation.

## Stack
- Supabase
- Postgres
- Supabase Auth

## Core Tables

organizations: id, name

users: id, org_id, role (assistant | technician)

buildings: id, org_id, name

inspections: id, org_id, building_id, schema_version, status, signed_at, data (jsonb), created_at, updated_at

## Deliverables

- Authentication
- Organization isolation
- Cloud save/load inspections
- Role enforcement (backend enforced)
- Signed inspections become immutable

Outcome: Multi-tenant cloud-backed SaaS foundation.

---

# Stage 6 — Admin Panel (Web Dashboard)

## Goal
Create internal and organization admin tooling.

## Stack
- Next.js
- Hosted on Vercel

## Features

- Organization management
- User management
- Role assignment
- Inspection viewer
- Schema upload/management
- Audit log viewer (read-only)

Outcome: Sales-ready and support-ready tooling.

---

# Stage 7 — Real Offline Sync

## Goal
Upgrade from local-only persistence to full offline-first sync.

## Requirements

- Mutation queue
- Push local changes on reconnect
- Pull remote updates
- Conflict strategy
- Signed inspections lock record

## Rules

- Draft inspections editable
- Signed inspections immutable
- Full JSON document sync
- Server writes audit log for every mutation

Outcome: Production-grade offline reliability.

---

# Stage 8 — PDF Generation + Audit Logs

## Audit Logs Table

audit_logs: id, org_id, user_id, inspection_id, action_type, before_json, after_json, timestamp

Every inspection mutation writes an immutable audit record.

## PDF Generation Flow

1. Client requests PDF
2. Server renders HTML inspection view
3. Convert HTML to PDF
4. Store in Supabase Storage
5. Save file reference in inspection record

PDFs are generated server-side only.

Outcome: Compliance-ready, legally defensible records.

---

# Stage 9 — Billing (Stripe)

## Goal
Monetize per organization.

## Flow

- Stripe subscription per organization
- Webhook updates organization subscription status
- Backend enforces access restrictions
- Frontend reflects subscription state

Do not enforce billing in frontend only. Backend must validate subscription status.

Outcome: Revenue-enabled SaaS.

---

# Competitive Moat Focus

Spend engineering time on:

- Schema engine
- Schema versioning
- Connector mapping system
- Rollover logic
- Device table UX
- Offline reliability

Do not over-optimize:

- Hosting
- Auth provider
- Payment processor

---

# Rough Timeline (Solo Founder)

- Stage 1–2: 4–6 weeks
- Stage 3: 2–3 weeks
- Stage 4: 3–4 weeks
- Stage 5: 2–3 weeks
- Stage 6: 4–6 weeks
- Stage 7: 2–3 weeks
- Stage 8: 1–2 weeks

Estimated: 4–6 months to serious beta.

---

# End State

You are building:

- A schema-versioned compliance engine
- An inspection lifecycle management system
- A vertical SaaS for fire protection contractors

Not just a form app.
