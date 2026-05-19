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

# Stage 1 — Form Engine (UI Only)

## Goal
Build a dynamic, paginated inspection UI system without backend or auth.

## Stack
- Expo + React Native
- Tamagui
- React Hook Form
- Zod (basic validation only)
- Static mock JSON data

## Deliverables

### Component System

Create standardized components:

- FormRenderer
- FormSection
- FormField
- DeviceTable
- CheckboxGroup
- SignatureBlock
- PaginationStepper

Focus on:

- Clean visual hierarchy
- Smooth pagination
- Performance with 1,000+ rows
- Field validation feedback
- One-handed field usability

No persistence. No backend. No auth.

Outcome: A reusable inspection form UI framework.

---

# Stage 2 — Schema System

## Goal
Extract the schema definition from the UI. Convert hardcoded UI into a dynamic renderer.

## Core Types (Conceptual)

FieldDefinition:
- id: string
- type: "text" | "number" | "checkbox" | "table" | "signature"
- label: string
- required?: boolean
- validation?: Zod schema

SectionDefinition:
- id: string
- title: string
- fields: FieldDefinition[]

InspectionSchema:
- version: string
- sections: SectionDefinition[]

## Deliverables

- FormRenderer driven entirely by schema
- Versioned schema objects
- Dynamic field rendering
- Validation driven from schema
- Pagination driven by schema sections

Outcome: Core inspection engine with versionable standards.

---

# Stage 3 — Local Persistence (Offline-Only)

## Goal
Add local draft saving without backend.

## Stack
- Expo SQLite

## Features

- Save inspection draft locally
- Load draft
- Edit draft
- Duplicate inspection (simulate annual rollover)
- Persist schema version with each inspection

Inspection structure:

- id: string
- schemaVersion: string
- status: "draft" | "signed"
- data: JSON object
- createdAt: Date
- updatedAt: Date

At this stage: app works fully offline, no authentication, no cloud sync.

Outcome: Fully functional offline inspection app.

---

# Stage 4 — Backend + Multi-Tenant Structure

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

# Stage 5 — Admin Panel (Web Dashboard)

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

# Stage 6 — Real Offline Sync

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

# Stage 7 — PDF Generation + Audit Logs

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

# Stage 8 — Billing (Stripe)

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
