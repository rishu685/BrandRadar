# High-Level Design (HLD)

## 1. Overview

BrandRadar is an AI-powered SEO and brand-visibility SaaS application. The product helps users do two main things:

- AI keyword research: analyze a keyword, identify content opportunities, source patterns, and competitor signals.
- AI search visibility tracking: audit how ChatGPT and Gemini mention a brand and whether the website gets cited for relevant prompts.

The platform is built as a Next.js application with protected dashboard flows, asynchronous background processing, and storage in MongoDB via Prisma.

## 2. Business Goals

- Convert a single keyword or topic into an evidence-based research brief.
- Measure how AI search engines present a brand in real-world prompts.
- Persist report history so users can revisit finished results.
- Support paid plans with per-feature usage limits.
- Keep AI workloads asynchronous so the user experience remains responsive.

## 3. High-Level Architecture

### 3.1 Presentation Layer

The frontend is built with:

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn-inspired UI primitives

This layer includes:

- public marketing home page
- authentication flows
- dashboard UI
- keyword research and visibility forms
- live progress tracking and report viewing

### 3.2 API and Server Layer

The server exposes route handlers under the App Router for:

- authentication
- billing status
- report creation
- report retrieval
- background job orchestration

These server routes validate input, authorize the current user, persist state, and start background tasks.

### 3.3 Background Processing Layer

This is handled by Trigger.dev.

Trigger tasks are used for:

- keyword research
- AI visibility scan generation

These tasks run asynchronously and update the report record with progress, completion, or failure states. This allows the UI to stay responsive during long-running AI and external data collection jobs.

### 3.4 Data Layer

The application uses MongoDB through Prisma models for:

- users
- sessions
- OAuth/account data
- report records
- subscriptions

This gives a single source of truth for user identity, billing, and saved reports.

### 3.5 AI and Data Provider Layer

The app integrates with external services:

- Google Gemini via the AI SDK to generate structured research and visibility reports.
- Bright Data APIs to collect search/AI answer data for both keyword and visibility workflows.
- Stripe for billing and subscription management.

## 4. Core User Flows

### 4.1 Keyword Research Flow

1. User enters a keyword and country from the dashboard.
2. The app validates the request and ensures auth is present.
3. A report record is created in MongoDB with status PENDING.
4. Trigger.dev starts the keyword research background task.
5. The task fetches Bright Data research for the keyword.
6. The system updates report progress while collecting and analyzing.
7. Gemini produces a structured keyword report.
8. The final report is saved and displayed to the user.

### 4.2 AI Visibility Flow

1. User enters a website, brand, and topic.
2. The app validates the request and checks the session.
3. A visibility report row is created.
4. The task generates neutral prompts for the topic.
5. Bright Data collects answers from ChatGPT and Gemini.
6. Gemini evaluates mentions, citations, and competitor exposure.
7. Final structured report is saved and surfaced in the UI.

## 5. Data Model Summary

### Main Entities

- User
  - identity
  - authentication state
  - Stripe customer linkage
  - relationship to reports

- Report
  - type: KEYWORD or VISIBILITY
  - status: PENDING, COLLECTING, ANALYZING, COMPLETED, FAILED
  - input fields like keyword, country, website, brand, topic
  - progress tracking
  - result payload JSON
  - triggerRunId for async job mapping

- Subscription
  - plan metadata
  - Stripe subscription IDs
  - payment lifecycle state

## 6. Security and Access Controls

- Protected dashboard routes redirect unauthenticated users.
- API routes require a valid session for authenticated actions.
- Report data is scoped by userId to avoid cross-user access.
- Billing limits are enforced per user and plan on both keyword research and visibility scan endpoints.

## 7. Failure Handling

The platform treats long-running intelligence jobs as asynchronous operations with explicit progress states.

When failures occur:

- the report status may be updated to FAILED
- error messages are saved to the report
- UI can show the last known state or failure message

This is handled through Trigger.dev run reconciliation and DB updates.

## 8. Operational Considerations

### Scalability

- report generation is decoupled from request handling via background jobs
- repeated API calls are cheap because the work is deferred
- MongoDB supports the user and report growth profile well for SaaS use

### Maintainability

- route code is separated from business logic
- schemas are centralized for validation
- report generation logic is isolated under Trigger tasks

### Reliability

- external provider failures are surfaced in report state
- job monitoring is done through Trigger.dev metadata and execution status
- app status updates are persisted for recovery and debugging

## 9. Risks and Constraints

- the app has high dependency on external APIs and may be sensitive to provider downtimes
- background tasks require valid environment configuration for Stripe, Gemini, MongoDB, and Bright Data
- the product is designed for a single app instance plus background worker orchestration

## 10. Conclusion

This architecture is a good fit for an AI research product because it separates user experience from expensive and slow data processing. The system combines a modern web frontend with a robust async processing model and persistent reporting layer, which is exactly what a research-heavy SaaS product needs.
