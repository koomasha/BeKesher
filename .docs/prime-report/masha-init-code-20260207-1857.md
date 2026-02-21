# Prime Report: Tuk-Tuk

**Branch:** `masha/init-code`
**Date:** 2026-02-07 18:57
**Commit:** `9312df6` — base project initiated

---

## Project Overview

- **Purpose:** Automated networking/socialization platform for new immigrants in Israel. Connects people through weekly task-based group meetups via a Telegram Mini App.
- **Name:** Tuk-Tuk (Hebrew: "In Touch")
- **Current State:** MVP / Foundation phase. Full codebase scaffolded (backend + two frontends). Not yet deployed or tested against live data.
- **Origin:** Migrating from a no-code stack (Make.com + Airtable + Google Apps Script + Fillout forms + Telegram Bot) to a modern full-stack architecture.
- **Active Users (legacy):** ~73 active participants, ~85 total registered
- **Target Launch:** Purim (March 2026)

---

## Architecture

### Overall Structure

**Monorepo** using npm workspaces with three main areas:

```
tuk-tuk/
├── convex/           # Serverless backend (Convex)
├── apps/
│   ├── user/         # Telegram Mini App (React + Vite, port 5173)
│   └── admin/        # Admin Dashboard (React + Vite, port 5174)
├── legacy/           # Reference files from old system
├── .docs/            # PRD, meeting transcripts, implementation plans
└── package.json      # Root workspace config
```

### Key Architectural Patterns

- **Event-Driven Architecture** — Real-time updates via Convex subscriptions
- **Domain-Driven Modules** — Backend code organized by business domain (single file per domain)
- **Staged Matching Algorithm** — 5-stage waterfall from strict to relaxed criteria
- **Webhook-Based Integration** — PayPlus and Telegram communicate via HTTP endpoints
- **Implicit Trust Auth Model** — User identified by Telegram ID from Mini App SDK; no separate auth tokens
- **Public vs Internal Functions** — User-facing `query`/`mutation` vs system-only `internalQuery`/`internalMutation`/`internalAction`

### Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `convex/` | All backend logic: schema, CRUD, matching algorithm, payments, notifications, cron jobs, webhooks |
| `apps/user/` | User-facing Telegram Mini App: registration, profile, groups, feedback, support |
| `apps/admin/` | Admin dashboard: participant management, group overview, matching trigger, support tickets, KPI dashboard |
| `legacy/` | Reference material: Airtable schema (`airtable.json`), Google Script matching algorithm (`google_script.js`), Make.com blueprint exports (17 scenarios), old architecture docs |
| `.docs/` | PRD, meeting transcripts, implementation plans |

---

## Sub-System Deep Dives

### Convex Backend (`convex/`)

**Architecture:** Domain-driven, single-file-per-domain modules. Uses Convex function types: `query` (read), `mutation` (write), `action` (external API), `internal*` (private system functions).

**Modules:**

| File | Purpose | Key Functions |
|------|---------|---------------|
| `schema.ts` | 6 tables with indexes | participants, groups, feedback, paymentLogs, supportTickets, admins |
| `participants.ts` | User lifecycle (Lead -> Active -> Inactive) | `register`, `updateProfile`, `togglePause`, `getActiveForMatching` |
| `groups.ts` | Group lifecycle (Active -> Completed/Cancelled) | `create`, `getHistoryLastWeeks`, `closeActiveGroups` |
| `matching.ts` | 5-stage weekly matching algorithm | `runWeeklyMatching` (orchestrator), stages A-E with progressive constraint relaxation |
| `payments.ts` | PayPlus integration | `createPaymentLink`, `processSuccessfulPayment`, `processFailedPayment` |
| `feedback.ts` | Post-meetup ratings | `submitFeedback` (+10 points), `getPendingFeedback`, duplicate prevention |
| `support.ts` | Support tickets | `createTicket`, `answerTicket`, `closeTicket` |
| `notifications.ts` | Telegram Bot API messaging | `sendTelegramMessage`, `createChannelInviteLink`, `notifyGroupMembers` |
| `crons.ts` | 4 scheduled jobs | Weekly matching (Sun 18:00 IL), week close (Sat 23:00 IL), daily payment reminders, Monday cleanup |
| `http.ts` | Webhook endpoints | `/payplus-callback`, `/telegram-webhook`, `/health` |

**Matching Algorithm Detail (5 stages):**
1. **Stage A (Strict):** Same region, age +/-10y, no repeats in 4 weeks
2. **Stage B (Expanded):** Same region, age +/-15y, no repeats
3. **Stage C (Allow Repeats):** Same region, age +/-15y, repeats OK
4. **Stage D (Neighboring Regions):** North<->Center, Center<->South (never North+South)
5. **Stage E (Force Majeure):** Group all remaining participants

**Database Schema (6 tables):**
- `participants` — 24 fields (identity, demographics, preferences, profile, status, subscription) with 4 indexes
- `groups` — Stores 2-4 participant IDs, status, region, creation timestamp
- `feedback` — Rating (1-10), text, photos, wouldMeetAgain flag
- `paymentLogs` — Transaction records linked to participants
- `supportTickets` — Question/answer with Open/Answered/Closed status
- `admins` — Email/password auth for admin dashboard

### User Mini App (`apps/user/`)

**Architecture:** React + React Router v6, 5 pages, no shared component library yet.

| Page | Features |
|------|----------|
| `HomePage` | Greeting with Telegram name, status card (badge, points, subscription), navigation hub |
| `ProfilePage` | Personal details grid, subscription status, pause toggle, points display |
| `GroupsPage` | Active group card with member list/phones, past 5 groups history |
| `FeedbackPage` | 5-star rating, would-meet-again toggle, optional comments, +10 point reward |
| `SupportPage` | Question form, ticket history with status badges, answer display |

**Styling:** CSS Variables with purple gradient branding (#667eea -> #764ba2), dark theme support via `.dark` class, safe area insets for Telegram Mini App.

**Telegram Integration:** `window.Telegram.WebApp` SDK used for user ID extraction, `ready()`, `expand()`, theme params, color scheme detection.

### Admin Dashboard (`apps/admin/`)

**Architecture:** React + React Router v6, sidebar navigation, 5 pages.

| Page | Features |
|------|----------|
| `DashboardPage` | KPI grid (total/active/leads/groups/tickets), recent activity table |
| `ParticipantsPage` | Dual-filter (status + region), data table with all participant fields |
| `GroupsPage` | Status filter, groups table with member count |
| `MatchingPage` | Manual trigger button with confirmation, results display (groups created, unpaired) |
| `SupportPage` | Status filter, inline answer form, status-aware action buttons |

**Navigation:** Sidebar component with emoji icons (Dashboard, Participants, Groups, Matching, Support). Fixed 250px width.

---

## Tech Stack

### Languages & Versions
- **TypeScript** 5.7+ — Strict mode, ESNext target
- **JavaScript** — Legacy Google Apps Script (matching algorithm reference)

### Frameworks & Libraries
- **Convex** ^1.17.0 — Backend-as-a-Service (database, functions, scheduling, HTTP)
- **React** ^18.2.0 — UI framework
- **React Router** ^6.22.0 — Client-side routing (v6)
- **Convex React** — Real-time data binding (`useQuery`, `useMutation`, `useAction`)

### Build Tools
- **Vite** ^5.0.10 — Build tool and dev server
- **@vitejs/plugin-react** ^4.2.1 — React SWC/Babel plugin
- **npm workspaces** — Monorepo management

### External Integrations
- **Telegram Bot API** — Outbound notifications, channel invite links
- **Telegram Web App SDK** — User authentication, Mini App integration
- **PayPlus** — Israeli payment processing gateway

### Deployment Target
- **Convex Cloud** — Backend hosting
- **Netlify** — Frontend hosting (planned)

---

## Core Principles

### Code Style & Conventions
- 4-space indentation across all files
- All Convex functions include both `args` and `returns` validators
- Functions return `v.null()` when no return value
- Index names follow pattern `by_field` or `by_field1_and_field2`
- Region values standardized: "North", "Center", "South"
- Internal functions prefixed with `internal` module imports
- No testing framework configured yet

### Status Flow Patterns
- **Participants:** Lead -> Active -> Inactive (with Pause toggle)
- **Groups:** Active -> Completed / Cancelled
- **Support Tickets:** Open -> Answered -> Closed
- **Payments:** Pending -> Success / Failed

### Documentation Standards
- PRD (`.docs/PRD.md`) — Comprehensive 700-line document with architecture, features, API specs, risk analysis
- Implementation plan (`.docs/plans/`) — Step-by-step task breakdown
- Meeting transcripts (`.docs/meetings/`) — Raw meeting recordings (Russian language)
- CLAUDE.md — Agent-facing codebase guide
- Legacy reference material preserved in `legacy/`

---

## Current State

### Active Branch
`masha/init-code` — up to date with `origin/masha/init-code`

### Recent Development Focus
Most recent commits (newest first):
1. `9312df6` — base project initiated (current HEAD)
2. `2e70770` — feature plan created
3. `0546154` — PRD created
4. `dc51d77` — merge legacy docs PR
5. Earlier commits: legacy documentation, Make.com blueprints, meeting transcripts

### Untracked Files
- `.claude/` — Claude Code configuration
- `.mcp.json` — MCP server configuration
- `CLAUDE.md` — Agent instructions

### Completeness Assessment

**Fully Scaffolded:**
- All 10 Convex backend modules (schema, 7 domain modules, http, crons)
- User app with 5 pages + Telegram SDK integration
- Admin dashboard with 5 pages + sidebar navigation
- CSS theming and responsive layouts

**Partial / TODO:**
- Telegram notifications marked TODO in support/feedback answer flows
- Group detail views are placeholder buttons
- Data cleanup cron functions marked TODO
- No testing framework or tests
- No ESLint configuration
- No CI/CD pipeline
- No Netlify deployment config
- Admin authentication not fully implemented (admins table exists but no login flow)

### Immediate Observations & Concerns

1. **No Tests:** No testing framework configured. The PRD lists algorithm parity testing as a critical requirement.
2. **Security Gap:** Telegram `initData` validation is not implemented — user ID is taken from `initDataUnsafe` without server-side signature verification.
3. **Admin Auth Missing:** The `admins` table exists with `passwordHash` field, but there's no login page or auth middleware in the admin app.
4. **Legacy Migration:** No data migration tooling exists for transferring Airtable records to Convex.
5. **Payment Integration:** PayPlus API integration functions exist but haven't been tested against live or sandbox endpoints.
6. **Notification TODOs:** Several notification triggers are stubbed but not wired (feedback answer notification, support ticket answer notification).

---

## External Service Dependencies

| Service | Env Variable | Purpose |
|---------|-------------|---------|
| Telegram Bot API | `TELEGRAM_BOT_TOKEN` | Send messages, create channel invites |
| Telegram Channel | `TELEGRAM_CHANNEL_ID` | Community channel for paid members |
| PayPlus | `PAYPLUS_API_KEY`, `PAYPLUS_SECRET_KEY`, `PAYPLUS_PAGE_UID` | Payment processing |
| Convex | `VITE_CONVEX_URL` | Frontend-to-backend connection |

---

## Make.com Scenario Migration Map

All 17 Make.com workflows have been mapped to Convex functions:

| Legacy Scenario | Convex Replacement | Status |
|---|---|---|
| Dispatcher (bot menu routing) | `http.ts` Telegram webhook | Scaffolded |
| Welcome flow | `notifications.ts` sendWelcomeMessage | Implemented |
| Payment creation | `payments.ts` createPaymentLink | Implemented |
| PayPlus callback | `http.ts` /payplus-callback | Implemented |
| Payment reminders | `crons.ts` daily reminder job | Scheduled, TODO handler |
| Matching trigger | `matching.ts` runWeeklyMatching | Implemented |
| Feedback processing | `feedback.ts` submitFeedback | Implemented |
| Week close | `crons.ts` weekly close job | Scheduled, TODO handler |
| Profile view/edit | `participants.ts` getMyProfile/updateProfile | Implemented |
| Support | `support.ts` createTicket/answerTicket | Implemented |
| Pause/Resume | `participants.ts` togglePause | Implemented |
| Unsubscribe | `participants.ts` deactivate | Implemented |
| Random Coffee | OUT OF SCOPE (Phase 2) | N/A |
| Cleaner | `crons.ts` Monday cleanup job | Scheduled, TODO handler |
