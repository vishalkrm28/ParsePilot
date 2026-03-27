# ParsePilot AI

## Overview

ParsePilot AI is a production-ready SaaS web app that helps users tailor their CVs to job descriptions using AI. Users upload their CV (PDF/DOCX), paste a job description, and get back an ATS-optimized CV, keyword analysis, missing info questions, and an optional cover letter — all without ever inventing fake experience.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/parse-pilot), Tailwind CSS, shadcn-inspired components
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **AI**: OpenAI via Replit AI Integrations proxy (gpt-5.2)
- **Auth**: Replit Auth (OIDC) — `@workspace/replit-auth-web` on the frontend, `lib/auth.ts` + `authMiddleware.ts` on the server
- **File parsing**: mammoth (DOCX), pdfjs-dist (PDF)
- **File export**: docx (DOCX generation)
- **Build**: esbuild (CJS bundle for API server)

## Architecture

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/        # auth.ts (OIDC), logger.ts
│   │       ├── middlewares/ # authMiddleware.ts
│   │       ├── routes/     # health.ts, auth.ts, applications.ts, upload.ts, export.ts
│   │       └── services/   # ai.ts, fileParser.ts, exporter.ts
│   └── parse-pilot/        # React + Vite frontend (served at /)
│       └── src/
│           ├── pages/      # landing.tsx, dashboard.tsx, new-application.tsx, application-detail.tsx, terms.tsx, privacy.tsx
│           ├── components/ # Button, Card, Badge, Input, Textarea, layout/ (sidebar, app-layout, footer)
│           └── hooks/      # use-toast.ts
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── replit-auth-web/    # useAuth() hook for browser auth
│   ├── db/                 # Drizzle ORM schema + DB connection
│   │   └── src/schema/     # applications.ts, auth.ts (sessions, users)
│   └── integrations-openai-ai-server/  # Replit AI Integration client
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

## Key Features

1. **Auth** - Replit OIDC login; landing page for unauthenticated users, dashboard for signed-in users
2. **CV Upload** - PDF and DOCX file upload with text extraction, or manual paste
3. **JD Parsing** - Job description parsed into structured JSON (`parseJobDescription()` via Responses API): required_skills, preferred_skills, key_responsibilities, must_have, nice_to_have, experience_years, job_type, location_type
4. **AI Analysis** - GPT-5.2 analyzes CV vs parsed JD (Responses API), returns ATS-optimized rewrite; fabrication strictly forbidden in prompts; `parsedJdJson` + `sectionSuggestions` saved to DB
5. **Keyword Match** - Shows match score %, matched/missing keywords as visual chips; score ring color-coded (green/amber/red)
6. **Section Suggestions** - 5th tab: AI structural suggestions based only on existing CV content
7. **Missing Info** - AI surfaces questions if key info is absent; user can answer and re-analyze with confirmed context
8. **Cover Letter** - AI generates tone-controlled cover letter (professional/enthusiastic/concise); editable + saveable
9. **Edit & Save** - Tailored CV and cover letter are fully editable with unsaved-changes indicator and Save/Discard buttons
10. **Export** - Download tailored CV or cover letter as DOCX
11. **Saved Applications** - All applications saved per authenticated user with status tracking

## Critical Rules (enforced in AI prompts)

- NEVER invent fake work experience, skills, tools, degrees, certifications, or achievements
- Only rewrite and reorganize based on information present in the source CV
- If information is missing, surface it as a question (Missing Info tab)
- Keep output ATS-friendly

## API Routes

### Auth
- `GET  /api/auth/user` — get current auth user (from session)
- `GET  /api/login` — start OIDC browser login flow
- `GET  /api/callback` — OIDC callback
- `GET  /api/logout` — clear session, OIDC logout

### Applications
- `GET  /api/applications?userId=xxx` — list applications
- `POST /api/applications` — create application
- `GET  /api/applications/:id` — get application
- `PUT  /api/applications/:id` — update application
- `DELETE /api/applications/:id` — delete application
- `POST /api/applications/:id/analyze` — AI CV analysis
- `POST /api/applications/:id/cover-letter` — AI cover letter generation
- `PATCH /api/applications/:id/tailored-cv` — save edited tailored CV text
- `PATCH /api/applications/:id/cover-letter-save` — save edited cover letter text
- `POST /api/upload-cv` — multipart file upload (PDF/DOCX/DOC/TXT, max 10MB) → extracts text AND parses structured JSON with AI (non-fatal; returns parsedCv: null on parse failure)
- `POST /api/parse-cv` — parse raw CV text into structured JSON using OpenAI Responses API (Zod-validated body: `{ rawText: string }`)
- `GET  /api/export/application/:id/docx` — download DOCX (CV or cover letter via `?type=cover`); marks status as "exported"
- `GET  /api/export/application/:id/pdf` — returns print-optimized HTML with auto-print trigger (CV or cover letter via `?type=cover`); use `?noprint` to suppress auto-print
- `GET  /api/healthz` — health check

## Database Schema (Drizzle/PostgreSQL)

### `applications` table
- `id` (uuid, PK)
- `userId` (text) — Replit user ID from auth session
- `jobTitle`, `company` (text)
- `jobDescription` (text)
- `originalCvText` (text)
- `parsedCvJson` (jsonb, nullable) — structured CV data from AI parse: `{ name, email, phone, location, summary, work_experience[], education[], skills[], certifications[], languages[] }`
- `tailoredCvText` (text, nullable)
- `coverLetterText` (text, nullable)
- `keywordMatchScore` (real, nullable)
- `missingKeywords`, `matchedKeywords`, `missingInfoQuestions` (jsonb arrays)
- `status` (enum: draft | analyzed | exported)
- `createdAt`, `updatedAt` (timestamptz)

### `user_identity_profiles` table
- `userId` (varchar, PK, FK → users.id) — one row per user
- `primaryIdentityHash` (varchar) — SHA256[:32] of first CV identity seen (name + email)
- `primaryIdentityName`, `primaryIdentityEmail` (varchar, nullable) — display fields for logging
- `distinctIdentityCount` (integer) — total distinct people ever submitted
- `identityHistory` (jsonb) — append-only list of up to 20 `{ hash, name, email, detectedAt }` entries
- `createdAt`, `updatedAt` (timestamptz)

### `sessions` table
- `id` (text, PK) — session token
- `userId` (text)
- `expiresAt` (timestamptz)
- `createdAt` (timestamptz)

### `users` table
- `id` (text, PK) — Replit user ID
- `email`, `firstName`, `lastName`, `profileImageUrl` (text, nullable)
- `createdAt`, `updatedAt` (timestamptz)

## Running Locally

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/parse-pilot run dev

# Push DB schema
pnpm --filter @workspace/db run push

# Run codegen after OpenAPI spec changes
pnpm --filter @workspace/api-spec run codegen
```

## Content Gating (Milestone 14)

**Central helper:** `artifacts/api-server/src/lib/preview.ts`
- `applyFreeFilter(row)` — strips `tailoredCvText` + `coverLetterText`, attaches `freePreview: { summaryPreview, firstBullet, lockedSectionsCount }`
- `applyProPass(row)` — passes full row through, adds `freePreview: null`
- `buildCvPreview(text)` — extracts summary snippet (220 chars) + first bullet + locked section count

**Free user API response:** `tailoredCvText: null, coverLetterText: null, freePreview: {...}`
**Pro user API response:** `tailoredCvText: "full CV...", freePreview: null`

**Full tailored CV is always saved to DB** (so free→Pro upgrade instantly unlocks it without re-running analysis)

**Gating points (server-side, not just frontend):**
- `GET /applications/:id` — content stripped + owner check (prevents cross-user access)
- `GET /applications` list — tailoredCvText/coverLetterText stripped for free users
- `POST /analyze` response — stripped for free users
- `PATCH /tailored-cv` — `requirePro`
- `PATCH /cover-letter-save` — `requirePro`
- `GET /export/*/docx` and `/pdf` — `requirePro` (existing)
- `POST /cover-letter` — `requirePro` (existing)

**Frontend locked state:** `LockedCvSection` component in `application-detail.tsx` — shows summary preview + first bullet + blurred placeholder rows + upgrade CTA. Triggered when `isLockedForFree = !isPro && app.status === "analyzed" && !app.tailoredCvText && !!freePreview`.

## AI Credits System (Milestone 12)

**Tables:** `usage_balances` (one row per user), `usage_events` (append-only audit trail)

**Central service:** `artifacts/api-server/src/lib/credits.ts`
- `initFreeCredits(userId)` — idempotent (ON CONFLICT DO NOTHING); called on every login; awards 3 free credits to new users only
- `resetProCreditsIfNeeded(userId, periodStart, periodEnd)` — idempotent (compares `billingPeriodStart`); seeds 100 Pro credits only when billing period changes; called from `applySubscription` in webhook
- `spendCredits(userId, amount, type)` — atomic (`UPDATE ... WHERE available_credits >= amount`); returns `{success, remaining}`; no race condition possible
- `canSpendCredits` / `getUserCredits` — read helpers

**Credit costs:** cv_optimization=1, cover_letter=1, docx_export=0, pdf_export=0, identity_switch_penalty=1 (charged in addition to cv_optimization when a different person's CV is detected)

**API endpoint:** `GET /api/billing/credits` → `{availableCredits, lifetimeCreditsUsed, billingPeriodEnd, planAllowance, isPro}`

**Frontend:**
- `hooks/use-credits.ts` — fetches /api/billing/credits
- `components/billing/credits-badge.tsx` — compact inline badge in dashboard header
- `components/billing/credits-card.tsx` — full card in Settings → AI Credits section

**Gated routes:**
- `POST /applications/:id/analyze` → 1 credit; returns 402 `CREDITS_EXHAUSTED` if blocked
- `POST /applications/:id/cover-letter` → 1 credit; returns 402 `CREDITS_EXHAUSTED` if blocked

## Identity & Anti-Abuse System (Milestone 16)

### Goal
Prevent one Pro account from being used as a CV-generation service for many different people, without hard-blocking legitimate use.

### Strategy: friction, not blocks
- No hard blocks. If a different identity is detected, analysis still succeeds.
- An **extra 1 credit** is charged (total: 2 credits instead of 1) for any CV submitted for a person other than the account's primary identity.
- A **soft limit of 3 distinct identities** per account is tracked. Beyond that the same penalty applies indefinitely.
- An **amber warning banner** is shown in the UI immediately after analysis completes.

### How identity is detected

**Source:** `parsedCvJson.name` and `parsedCvJson.email` — already extracted by the AI CV parser at upload time. No extra AI call needed.

**`isSameIdentity(a, b)` — confidence ladder:**
1. **Email match (definitive):** if both sides have an email, they must match exactly.
2. **Name match (fallback):** token-sorted lowercase comparison so "John Smith" and "Smith, John" resolve to the same person.
3. **No signal (conservative):** if both name and email are missing on either side, returns `true` (same person) to avoid false positives.

**Identity hash:** `SHA256(normalized_name + "||" + email)[:32]` — stored instead of raw PII.

### Database table: `user_identity_profiles`

One row per user. Created when the first CV is analyzed.

| Column | Type | Description |
|---|---|---|
| `user_id` | varchar PK | FK → `users.id` |
| `primary_identity_hash` | varchar | Hash of the first identity ever seen |
| `primary_identity_name` | varchar | Name from first CV |
| `primary_identity_email` | varchar | Email from first CV |
| `distinct_identity_count` | integer | Running count of distinct identities |
| `identity_history` | jsonb | Append-only log, capped at 20 entries |
| `created_at`, `updated_at` | timestamptz | — |

### Audit trail
- Every identity switch is recorded in `usage_events` with `type: "identity_switch"` and `creditsDelta: 0`.
- The penalty credit spend is recorded separately with `type: "identity_switch_penalty"`.
- `logger.warn(...)` is emitted for every switch with `{ userId, applicationId, fromHash, toHash, distinctCount }`.

### Key files
- `artifacts/api-server/src/lib/identity.ts` — `extractIdentityFromParsedCv()`, `isSameIdentity()`, `checkAndRecordIdentity()`, `MAX_DISTINCT_IDENTITIES = 3`
- `lib/db/src/schema/identity.ts` — `userIdentityProfilesTable` Drizzle schema
- `artifacts/api-server/src/routes/applications.ts` — `POST /analyze` restructured to: fetch app → ownership check → identity check → credit gate (base + penalty) → AI analysis → return

### Non-fatal design
Every error in the identity check is caught and logged. The analysis always proceeds. If the identity system is unavailable (DB failure), the user sees no penalty and no warning.

### Analyze route response shape (new fields)
```json
{
  "identityWarning": true,
  "identityAboveLimit": false,
  "distinctIdentityCount": 2,
  "...existing fields..."
}
```

## One-Time Result Unlock (Milestone 17)

### Goal
Allow free users to pay $4 once to unlock the full tailored CV + DOCX/PDF export for a single specific result, without subscribing. This is a low-friction conversion path alongside the Pro subscription.

### Access logic (authoritative — `userCanAccessFullResult()`)

| State | Access |
|---|---|
| Pro subscription (active or trialing) | Full access to all results |
| One-time unlock purchased for this result | Full access for that result only |
| Free, no unlock | Preview only (summary + first bullet) |

### Unlock scope
- **Per-result**: each `applicationId` needs its own purchase
- **Includes**: full `tailoredCvText`, `coverLetterText` (if generated), DOCX + PDF export
- **Excludes**: generating a new cover letter (credit-gated, Pro only)
- **Option A** (implemented): export included in the $4 unlock

### Database table: `unlock_purchases`

| Column | Type | Description |
|---|---|---|
| `id` | varchar PK | gen_random_uuid() |
| `user_id` | varchar | FK → `users.id` |
| `application_id` | uuid | FK → `applications.id` |
| `stripe_checkout_session_id` | varchar UNIQUE | Idempotency key for webhook |
| `stripe_payment_intent_id` | varchar UNIQUE | From Stripe session |
| `amount_paid` | integer | Stripe `amount_total` (cents) |
| `currency` | varchar | From Stripe session |
| `status` | varchar | `"paid"` when access is granted |
| `created_at`, `updated_at` | timestamptz | — |

### Stripe flow
1. Frontend calls `POST /api/billing/unlock` with `{ applicationId, successUrl, cancelUrl }`
2. API verifies ownership, creates Stripe Checkout session (`mode: "payment"`) with metadata: `{ userId, applicationId, purchaseType: "one_time_unlock" }`
3. User pays on Stripe Checkout → redirected to `/billing/unlock-success?application_id=...`
4. Stripe fires `checkout.session.completed` → webhook dispatches to `onUnlockCheckoutCompleted()` → upserts `unlock_purchases` row with `status: "paid"`
5. Next `GET /applications/:id` call returns `isUnlockedResult: true` + full `tailoredCvText`

### New env var required
`STRIPE_PRICE_PARSEPILOT_UNLOCK` — Stripe Price ID for the $4 one-time unlock product. Must be a one-time (non-recurring) price.

### Key files
- `lib/db/src/schema/unlock.ts` — `unlockPurchasesTable` Drizzle schema
- `artifacts/api-server/src/lib/billing.ts` — `hasUnlockedResult()`, `userCanAccessFullResult()`
- `artifacts/api-server/src/lib/preview.ts` — `applyUnlockPass()` (sends full content + `isUnlockedResult: true`)
- `artifacts/api-server/src/routes/billing.ts` — `POST /billing/unlock`
- `artifacts/api-server/src/routes/webhook.ts` — `onUnlockCheckoutCompleted()`
- `artifacts/api-server/src/routes/applications.ts` — GET /:id uses `hasUnlockedResult` alongside `isUserPro`
- `artifacts/api-server/src/routes/export.ts` — both export routes use `userCanAccessFullResult` (not `requirePro`)
- `artifacts/parse-pilot/src/components/billing/unlock-button.tsx` — `<UnlockButton applicationId>` component
- `artifacts/parse-pilot/src/components/results/locked-preview-card.tsx` — dual CTA: unlock ($4) + Pro trial
- `artifacts/parse-pilot/src/pages/unlock-success.tsx` — success landing page (cosmetic only — no access granted here)

## Environment Validation

`artifacts/api-server/src/lib/env.ts` — `validateEnv()` runs before `app.listen()` in `index.ts`.
- Required vars: `PORT`, `DATABASE_URL`, `REPL_ID` — server exits with code 1 if missing
- Billing vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PARSEPILOT_PRO` — all three must be set together; partial config logs a clear warning
- One-time unlock: `STRIPE_PRICE_PARSEPILOT_UNLOCK` — Stripe Price ID for the $4 one-time result unlock; `POST /billing/unlock` returns 503 if missing
- Optional vars: `OPENAI_API_KEY`, `STRIPE_CUSTOMER_PORTAL_RETURN_URL` — missing values log actionable hints
- Startup log includes `billingEnabled` and `aiEnabled` flags

## Webhook Safety

`artifacts/api-server/src/routes/webhook.ts`:
- Responds `{ received: true }` immediately after signature verification (before processing), so slow DB writes don't cause Stripe retries
- Each event handler wrapped in `safeHandle()` — a bug in one handler can't crash others
- Handles: `checkout.session.completed` (subscription AND one-time unlock), `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- `checkout.session.completed` dispatches by `session.metadata.purchaseType`: `one_time_unlock` → `onUnlockCheckoutCompleted()`, else subscription flow
- `invoice.payment_failed` logs attempt count and next retry time; status downgrade handled by `customer.subscription.updated` from Stripe's dunning system
- Defensive null-guards on all Stripe object fields throughout

## Feature Gating (Free vs Pro)

**Backend (source of truth)** — `artifacts/api-server/src/middlewares/requirePro.ts`:
- `requirePro` middleware calls `isUserPro(req.user.id)` → returns 403 `{code: "PRO_REQUIRED"}` for free users
- Gated routes:
  - `POST /api/applications` → free users limited to 1 application (checks count before insert)
  - `POST /api/applications/:id/cover-letter` → Pro only (`requirePro` middleware)
  - `GET /api/export/application/:id/docx` → Pro OR one-time unlock for that result (`userCanAccessFullResult`)
  - `GET /api/export/application/:id/pdf` → Pro OR one-time unlock for that result (`userCanAccessFullResult`)

**Frontend (UX)** — no duplicated logic, gates driven by `GET /api/billing/status`:
- `artifacts/parse-pilot/src/hooks/use-billing-status.ts` — React hook, 30 s cache
- `artifacts/parse-pilot/src/components/billing/pro-gate.tsx` — `<ProGate isPro compact>` wrapper (compact = inline lock button, full = upgrade card)
- Dashboard (`dashboard.tsx`) — shows violet upgrade banner + "Upgrade for More" button when free user has ≥ 1 app
- Application detail (`application-detail.tsx`) — compact ProGate replaces export buttons; full ProGate covers Cover Letter tab

## Milestone 18 — Free-User Conversion Optimization

### Goal
Maximize conversion from free users to paid users ($4 unlock or Pro subscription) by replacing the generic locked tab view with a dedicated, scrollable preview experience.

### Preview vs Full Access

| Content | Free user | One-time unlock | Pro |
|---|---|---|---|
| Match score + all keywords | Full | Full | Full |
| AI insights / suggestions | Full | Full | Full |
| Summary preview (truncated, gradient-faded) | Preview | Full | Full |
| First experience bullet | Preview | Full | Full |
| Full tailored CV text | — | Full | Full |
| Cover letter teaser (static blurred) | Teaser | Full (if generated) | Full |
| Cover letter generation | — | — | Full |
| DOCX / PDF export | — | Full (this result) | All results |

### Unlock flow
1. Free user analyzes → server runs analysis, returns `freePreview` (stripped `tailoredCvText`)
2. `isLockedForFree = !isPro && !isUnlockedResult && status==="analyzed" && !tailoredCvText && !!freePreview`
3. When `isLockedForFree`: render `FreeResultsView` (full-page conversion experience)
4. When Pro or unlocked: render tab bar + tab content as normal

### CTA placement strategy (FreeResultsView)
- **CTA-1** (top): compact inline banner immediately after the match score card — shows both $4 unlock and "Start Pro free" without friction
- **CTA-2** (middle): full conversion block after the summary/experience previews — price, what's included, trust signals, no-subscription note
- **CTA-3** (bottom): dark gradient `UpgradeCTACard` banner with `applicationId` (shows Pro primary + $4 unlock secondary)

### New files
- `artifacts/parse-pilot/src/components/results/free-results-view.tsx` — the full free-user conversion page

### CTA copy rules
- Primary: "Unlock now — $4" / "Unlock — $4" (one-time, no subscription)
- Secondary: "Start Pro free" / "Try free →" (7-day trial)
- Trust signals: "No fake experience added · ATS-friendly formatting · Edit before export"
- No hype language or AI buzzwords

## Vite Config Note

`artifacts/parse-pilot/vite.config.ts` has `fs.allow` set to include the workspace root's `lib/` and `node_modules/` directories so that workspace packages (e.g. `@workspace/replit-auth-web`) can be resolved by Vite in development.

## esbuild / Zod Note

The API server is bundled by esbuild. `lib/db` exports TypeScript source directly (not compiled dist). Because `lib/db/src/schema/*.ts` uses `import { z } from "zod/v4"`, esbuild will fail to resolve this subpath if you import from `@workspace/db` in a way that forces esbuild to traverse into those schema files.

**Rule**: In `artifacts/api-server/src/**`, always `import { z } from "zod"` (not `"zod/v4"`). Only import *types* (not values) from `@workspace/db` schema exports that use `"zod/v4"`. Define local Zod schemas using regular `"zod"` imports for runtime use. `zod` must be listed as a direct dependency in `artifacts/api-server/package.json`.
