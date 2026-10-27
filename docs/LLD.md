# Low-Level Design (LLD)

## 1. Module Inventory

### Frontend Modules

- public landing page under app/(routes)/(root)
- protected dashboard under app/(routes)/(dashboard)
- auth screens under app/(routes)/(root)/auth and dashboard auth flow
- report pages under app/(routes)/(dashboard)/reports

### Shared Components

- ui: reusable primitives such as button, card, input, table, tabs, dialog, badge
- auth: sign in, sign up, logout actions
- ai-keyword: keyword search input and report display
- ai-search-visibility: visibility form and result cards
- reports: history table, progress components, error views

### Backend Modules

- lib/auth.ts: Better Auth configuration and Stripe plugin setup
- lib/billing.ts: billing status logic and plan usage checks
- lib/plans.ts: plan limits definitions
- lib/reports.ts: Trigger run reconciliation
- lib/prisma.ts: Prisma client singleton
- lib/auth-schemas.ts: validation schemas for authentication
- lib/search-visibility-schema.ts: validation for visibility request payloads

### Background Tasks

- trigger/keyword-research.ts: performs keyword search and analysis
- trigger/search-visibility.ts: generates prompts, fetches AI answers, and creates visibility report

## 2. Request Processing Details

### 2.1 Keyword Research API

File: app/api/keyword-research/route.ts

Flow:

1. Load session using Better Auth.
2. Reject request if not authenticated.
3. Parse JSON and validate the keyword and country with Zod.
4. Create a report record with type KEYWORD and status PENDING.
5. Trigger the Trigger.dev task named keyword-research.
6. Save the Trigger run ID into the report record.
7. Return a 202 Accepted response with job metadata.

Key fields stored:

- userId
- type
- keyword
- country
- status
- progress
- currentStep
- triggerRunId

**Note:** Usage limit checking is **now enforced** via `checkUsageLimit()` call.

### 2.2 AI Visibility API

File: app/api/search-visibility/route.ts

Flow:

1. Load user session.
2. Validate website, brand, and topic inputs using Zod.
3. **Call `checkUsageLimit()` to enforce monthly plan limits.**
4. Return 403 if the user has exhausted their monthly visibility scans.
5. Create a VISIBILITY report record.
6. Trigger the search-visibility job.
7. Return a 202 response with run metadata.

**Status:** Usage limit enforcement is **active and working** in this route.

## 3. Background Job Design

### 3.1 Keyword Research Task

File: trigger/keyword-research.ts

Responsibilities:

- validate job identity and report ownership
- fetch Bright Data research with the provided keyword and country
- wait for the Bright Data webhook callback
- parse returned search result records
- generate a structured report using Gemini
- update final report as COMPLETED with result JSON

Important substeps:

- wait.createToken creates a callback token used for external delivery
- triggerKeywordCollection posts to Bright Data dataset endpoint
- generateReport builds the report using AI output schema validation
- metadata.flush persists Trigger state metadata

### 3.2 Search Visibility Task

File: trigger/search-visibility.ts

Responsibilities:

- validate the submitted visibility job payload
- generate five neutral prompts for the brand/topic
- trigger Bright Data tasks for both ChatGPT and Gemini answers
- wait for both callback tokens
- analyze the answers with Gemini and produce a structured visibility score
- save final report JSON and mark job complete

Important components:

- generateVisibilityPrompts
- triggerVisibilityCollection
- generateVisibilityReport
- updateJobProgress
- markJobFailed

## 4. Database Schema Details

The Prisma schema defines the following main models:

### User

- id: MongoDB ObjectId
- name
- email unique
- emailVerified
- image
- createdAt, updatedAt
- stripeCustomerId
- relations: sessions, accounts, reports

### Session

- token unique
- userId relation
- expiresAt
- ipAddress, userAgent

### Account

- userId relation
- providerId
- accessToken, refreshToken
- password
- timestamps

### Verification

- identifier + value for token verification flows

### Report

- id: ObjectId
- userId relation
- type: KEYWORD / VISIBILITY
- status: PENDING / COLLECTING / ANALYZING / COMPLETED / FAILED
- keyword, language, country
- website, brand, topic
- progress, currentStep, triggerRunId
- brightDataSnapshots: string[]
- result: Json
- errorMessage
- createdAt, updatedAt, completedAt

### Subscription

- plan
- Stripe subscription references
- status, billing dates
- cancel flags

## 5. Frontend State Model

The app uses a mixture of server-side state and client-side React Query state.

### Report List Screen

- fetches data from /api/reports
- tracks loading / error / retry state
- refreshes automatically while processing

### Single Report Screen

- fetches /api/reports/[id]
- if the report is still processing, it uses the Trigger public token to reconnect to the live run
- it re-renders the live progress widget until the job finishes

### Keyword Search Screen

- user enters search terms and target country
- starts a mutation to POST to /api/keyword-research
- shows live progress if the background job is active
- renders results when complete

### Visibility Screen

- user enters website, brand, and topic
- starts POST to /api/search-visibility
- displays live progress for the run
- shows the final AI visibility report when ready

## 6. Validation and Input Rules

### Keyword Validation

- keyword trimmed and >= 2 chars
- country transformed to uppercase
- must match two-letter ISO code format

### Visibility Validation

- website must be a valid http or https URL
- brand must be 2+ chars
- topic must be 3+ chars

These validations are enforced at API boundaries with Zod and also reflected in UI forms.

## 7. Billing Design

The billing service in lib/billing.ts calculates:

- active subscription plan
- monthly usage numbers for keyword searches and visibility scans
- remaining allowance for the current plan

Plan limits are defined in lib/plans.ts:

- free: 2 keyword searches, 2 visibility scans
- pro: 100 keyword searches, 25 visibility scans
- plus: 500 keyword searches, 100 visibility scans

Usage limit enforcement status:

- **Keyword Research API**: ✅ Usage limits are enforced via `checkUsageLimit()` call
- **AI Visibility API**: ✅ Usage limits are enforced via `checkUsageLimit()` call

Both routes now properly check remaining allowance and return 403 if the user has exhausted their monthly limit.

## 8. Error Handling Strategy

There are three relevant classes of errors:

1. validation errors from client input
2. runtime errors from external services such as Bright Data or Gemini
3. background task failures or timeouts from Trigger.dev

The app handles these by:

- returning 400 for invalid requests
- returning 401 for unauthenticated users
- returning 202 for accepted asynchronous work
- saving failures into the report row
- surfacing error text in the UI

## 9. Component Relationships

### Routing Structure

- root route: landing page
- dashboard routes: protected product flows
- reports pages: saved history and report details

### UI Composition Flow

- Page component initializes state and fetches data
- form components capture user input
- API mutation launches asynchronous processing
- LiveProgress component subscribes to job progress
- final result views render the structured report payload

## 10. Notable Risks and Follow-ups

- plan enforcement logic is not yet fully connected to the API submission path in the current codebase
- background job failures should be monitored with stronger observability
- authentication and Stripe setup need complete environment configuration before production use
- reporting tasks depend on valid Bright Data and Gemini credentials in runtime config

## 11. Summary

The low-level design follows a clean layered architecture: UI → API → persistent data model → Trigger jobs → external AI providers. This architecture is appropriate for a SaaS product that needs reliable async processing and saved history without blocking the user experience.
