# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BeKesher is a networking platform that connects people through weekly meetups. It consists of a Convex serverless backend, a user-facing Telegram Mini App, and an admin dashboard.

## Commands

```bash
# Install all dependencies (npm workspaces)
npm install

# Run development servers
npm run dev:user      # User Telegram Mini App (port 5173)
npm run tunnel:user   # Expose User App via ngrok (https URL for Telegram)
npm run dev:admin     # Admin Dashboard (port 5174)
npm run convex        # Convex backend dev server (watches & syncs functions)

# Build
cd apps/user && npm run build    # TypeScript check + Vite build
cd apps/admin && npm run build

# Lint
cd apps/user && npm run lint     # ESLint (--max-warnings 0)
cd apps/admin && npm run lint

# Type checking
npx tsc --noEmit

# Deploy backend
npm run convex:deploy

# Testing
npm run test          # Run tests in watch mode
npm run test:once     # Run tests once
npm run test:coverage # Run tests with coverage report
```

## Architecture

**Monorepo** using npm workspaces with three main areas:

### `convex/` — Serverless Backend
All backend logic runs on Convex. Files are organized by domain:
- **schema.ts** — Database tables: `participants`, `groups`, `feedback`, `paymentLogs`, `supportTickets`, `admins`
- **participants.ts** — User registration, profile management. Statuses: "Lead" → "Active" → "Inactive"
- **matching.ts** — Weekly 5-stage matching algorithm that progressively relaxes constraints (region, age range, repeat history) to ensure all active participants get matched into groups of 2-4
- **groups.ts** — Group lifecycle management. Statuses: "Active" → "Completed" / "Cancelled"
- **payments.ts** — PayPlus integration for subscription payments
- **notifications.ts** — Telegram Bot API for messaging users
- **feedback.ts** — Post-meetup feedback collection (awards 10 points)
- **support.ts** — Support ticket system
- **crons.ts** — Scheduled jobs (weekly matching Sunday 18:00 Israel, week close Saturday 23:00, daily payment reminders, Monday cleanup)
- **http.ts** — HTTP routes for webhooks (`/payplus-callback`, `/telegram-webhook`, `/health`)

Convex uses four function types: `query` (read), `mutation` (write), `action` (external API calls), and `internalQuery`/`internalMutation` (private system functions). Validators use the Convex `v` module.

### `apps/user/` — Telegram Mini App (React + Vite)
User-facing app with pages: Home, Profile, Groups, Feedback, Support. Uses React Router v6 and Convex React hooks (`useQuery`, `useMutation`).

### `apps/admin/` — Admin Dashboard (React + Vite)
Admin app with pages: Dashboard, Participants, Groups, Support, Matching. Includes a Sidebar navigation component. Same tech stack as user app.

Both frontend apps share the same path alias: `convex/_generated/*` maps to `../../convex/_generated/*`.

## Environment Variables

Backend (set in Convex dashboard):
- `TELEGRAM_BOT_TOKEN` — Telegram bot token for notifications
- `TELEGRAM_CHANNEL_ID` — Telegram channel for announcements
- `PAYPLUS_API_KEY` — PayPlus payment gateway API key
- `PAYPLUS_SECRET_KEY` — PayPlus payment gateway secret key
- `PAYPLUS_PAGE_UID` — PayPlus payment page UID
- `PAYMENT_AMOUNT` — Monthly subscription price in shekels (default: 100)
- `PAYPLUS_CALLBACK_URL` — PayPlus webhook callback URL (differs per environment)

Frontend (`.env.local` in each app): `VITE_CONVEX_URL`

## Key Conventions

- Database indexes follow the pattern `by_field` or `by_field1_and_field2`
- Region values: "North", "Center", "South"
- Matching history prevents re-matching for 4 weeks
- Group sizes: 2-4 participants

## Testing

Tests use **Vitest** with **convex-test** for testing Convex backend functions. Test files are colocated with source files (e.g., `convex/participants.test.ts`).

### Test Utilities
`convex/test.utils.ts` provides factory functions for creating test data:
- `setupTest()` — Creates isolated convexTest instance
- `makeParticipant()`, `makeGroup()`, `makeFeedback()`, etc. — Factory functions with sensible defaults
- `seedParticipants()` — Seed multiple participants
- `uniqueTelegramId(index)` — Generate unique test telegramIds

### Test Coverage
- **participants.test.ts** — Registration, profile updates, status management
- **groups.test.ts** — Group creation, listing, lifecycle
- **support.test.ts** — Ticket creation, answering, closing
- **feedback.test.ts** — Feedback submission, validation, point awards
- **payments.test.ts** — Payment logging, success/failure processing
- **matching.test.ts** — 5-stage matching algorithm, edge cases
- **http.test.ts** — Webhook handlers (PayPlus, Telegram, health)
- **crons.test.ts** — Scheduled job handlers

