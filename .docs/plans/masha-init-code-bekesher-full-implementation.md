# Feature: Tuk-Tuk Full Application Implementation

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files.

## Feature Description

Complete rebuild of the Tuk-Tuk networking platform using Convex backend, React User UI (Telegram Mini App), and React Admin Dashboard. Replaces existing Google Script + Make.com + Airtable infrastructure.

## User Story

As a **new immigrant in Israel**
I want to **connect with compatible people through weekly group matching**
So that **I can build meaningful friendships and overcome social isolation**

As an **administrator**
I want to **manage participants and trigger matching through a dedicated dashboard**
So that **I don't need to manage raw database data in Airtable**

## Problem Statement

Current system is fragmented across no-code tools (Make.com, Airtable, Google Script) with:
- High operational costs and scalability limits
- Fragile automation workflows
- Poor developer experience for maintenance
- No proper UI for users (only Telegram bot + forms)

## Solution Statement

Build a modern, unified full-stack application:
- **Convex** for real-time backend with built-in scheduling
- **React + Vite** for User Mini App and Admin Dashboard
- **Netlify** for frontend deployment
- Port matching algorithm from Google Script to TypeScript

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: Backend (new), User UI (new), Admin UI (new)
**Dependencies**: Convex, React, Vite, Telegram Web App SDK, PayPlus API

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING!

- `legacy/google_script.js` (lines 1-684) - **CRITICAL**: Contains matching algorithm to port
- `legacy/airtable.json` (full file) - Database schema reference for Convex schema
- `legacy/old_architecture.md` (full file) - Current system architecture overview
- `legacy/random_cofee.html` (full file) - UI reference for Telegram Mini App styling
- `.docs/PRD.md` (full file) - Product requirements and feature specifications

### New Files to Create

```
tuk-tuk/
├── convex/
│   ├── schema.ts                    # Database schema
│   ├── participants.ts              # Participant CRUD
│   ├── groups.ts                    # Group management
│   ├── matching.ts                  # Matching algorithm
│   ├── payments.ts                  # Payment processing
│   ├── feedback.ts                  # Feedback collection
│   ├── support.ts                   # Support ticket handling
│   ├── notifications.ts             # Telegram notifications
│   ├── crons.ts                     # Scheduled jobs
│   └── http.ts                      # Webhook endpoints
├── apps/
│   ├── user/                        # Telegram Mini App
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── index.css
│   │       ├── pages/
│   │       └── components/
│   └── admin/                       # Admin Dashboard
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── index.css
│           ├── pages/
│           └── components/
├── package.json                     # Root workspace
└── netlify.toml                     # Deployment config
```

### Relevant Documentation - READ BEFORE IMPLEMENTING!

- [Convex Docs](https://docs.convex.dev)
  - Schema: https://docs.convex.dev/database/schemas
  - Queries: https://docs.convex.dev/functions/query-functions
  - Mutations: https://docs.convex.dev/functions/mutation-functions
  - Actions: https://docs.convex.dev/functions/actions
  - HTTP: https://docs.convex.dev/functions/http-actions
  - Scheduling: https://docs.convex.dev/scheduling/cron-jobs
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
  - SDK usage, theming, initData validation
- [PayPlus API](https://www.payplus.co.il/api-documentation)
  - Payment link generation, webhook callbacks

### Patterns to Follow (from Convex Rules)

**Function Syntax:**
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
  args: { fieldName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Implementation
    return null;
  },
});
```

**Schema Definition:**
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tableName: defineTable({
    field: v.string(),
  }).index("by_field", ["field"]),
});
```

**HTTP Endpoints:**
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();
http.route({
  path: "/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }),
});
export default http;
```

**Cron Jobs:**
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("job-name", { hours: 24 }, internal.module.function, {});
export default crons;
```

**Key Convex Rules:**
- ALWAYS use `v.null()` for functions with no return value
- ALWAYS include both `args` and `returns` validators
- Use `internalQuery/Mutation/Action` for private functions
- Use `withIndex()` instead of `filter()` for queries
- Actions cannot use `ctx.db` - must call queries/mutations
- Include all index fields in index name: `by_field1_and_field2`

### Make.com Workflow Mapping (17 Scenarios → Convex Functions)

**CRITICAL**: All Make.com workflows must be ported to Convex. Reference these blueprints:

| # | Make.com Scenario | Purpose | Convex Replacement |
|---|-------------------|---------|-------------------|
| 1 | `1_Dispatcher_TUK-TUK v2` | Main Telegram bot dispatcher - routes commands/callbacks | `convex/http.ts` - Telegram webhook endpoint + router logic |
| 2 | `2_Начало` (Start) | Welcome new user, create channel invite link | `convex/participants.ts` → `onRegistrationComplete` action |
| 3 | `3_Social_game_Создание платежа` | Create PayPlus payment link | `convex/payments.ts` → `createPaymentLink` action |
| 3.1 | `3.1_PayPlus Callback` | Handle payment success/failure webhook | `convex/http.ts` → `/payplus-callback` + `convex/payments.ts` |
| 3.2 | `3.2_Напоминания об оплате` | Payment expiry reminders (3d, 1d, 0d) | `convex/crons.ts` → scheduled payment reminder job |
| 4 | `4_Подбор_пар` (Matching) | Trigger Google Script matching | `convex/matching.ts` → `runWeeklyMatching` mutation |
| 6 | `6_Обработка фидбека` (Feedback) | Process feedback submissions | `convex/feedback.ts` → `submitFeedback` mutation |
| 8 | `8_Закрытие недели` (Week Close) | Close active groups, update statuses | `convex/crons.ts` → weekly close job + `convex/groups.ts` |
| M1 | `M1_Мой профиль` (My Profile) | Show user profile | `convex/participants.ts` → `getMyProfile` query |
| M2 | `М2_Изменить анкету` (Edit Profile) | Edit profile flow | `convex/participants.ts` → `updateProfile` mutation |
| M3 | `М3_Вопрос в поддержку` (Support) | Submit support question | `convex/support.ts` → `createTicket` mutation |
| M4 | `М4_Оплата` (Payment) | Payment flow from bot | `convex/payments.ts` → `initiatePayment` action |
| M5 | `М5_Пауза-Возобновление` (Pause) | Toggle pause status | `convex/participants.ts` → `togglePause` mutation |
| M6 | `M6_Unsubscribe` | Unsubscribe/deactivate user | `convex/participants.ts` → `deactivate` mutation |
| - | `TUK-TUK Random Coffee` | Random coffee matching | **OUT OF MVP SCOPE** (Phase 2) |
| - | `Уборщик_TUK-TUK` (Cleaner) | Cleanup old data | `convex/crons.ts` → cleanup job |

**Workflow Details to Port:**

1. **Dispatcher Logic** (from `1_Dispatcher`):
   - Routes Telegram callback_query based on `data` field
   - Menu commands: profile, edit, support, payment, pause
   - Must maintain same callback data patterns for backward compatibility

2. **Welcome Flow** (from `2_Начало`):
   - Create one-time Telegram channel invite link (expires in 24h, limit 1 member)
   - Send welcome message with invite link
   - Channel ID: `-1003279683267` (store in env var)

3. **Payment Reminders** (from `3.2_Напоминания`):
   - 3 days before expiry: "Your subscription expires in 3 days"
   - 1 day before: "Tomorrow is the last day!"
   - On expiry day: "Last chance to renew!"
   - 6 days after: Grace period ends, deactivate

4. **Week Close** (from `8_Закрытие недели`):
   - Change group status from "Active" to "Completed"
   - Trigger feedback request to all group members
   - Run every Sunday evening

### Blueprint Alignment

- **Data Architecture**: Schema derived from `legacy/airtable.json`
- **Logic Workflows**: Matching algorithm from `legacy/google_script.js`
- **Identity Guidelines**: UI inspired by `legacy/random_cofee.html` styling

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Tasks 1-8)

Set up project infrastructure, Convex schema, and basic CRUD operations.

**Tasks:**
- Initialize monorepo with npm workspaces
- Set up Convex project
- Define database schema matching Airtable structure
- Implement participant queries and mutations
- Set up both React apps with Vite

### Phase 2: Core Backend (Tasks 9-18)

Port matching algorithm and implement all backend logic.

**Tasks:**
- Port matching algorithm from Google Script
- Implement group management
- Create payment integration with PayPlus
- Set up webhook endpoints
- Implement notification system
- Create scheduled jobs (crons)

### Phase 3: User Interface (Tasks 19-28)

Build user-facing Mini App.

**Tasks:**
- Registration flow
- Profile management
- Groups view
- Payment/subscription screens
- Feedback forms
- Telegram Mini App integration

### Phase 4: Admin Dashboard (Tasks 29-38)

Build admin panel.

**Tasks:**
- Participant list with filters
- Participant detail/edit views
- Group management
- Matching control panel
- Analytics dashboard
- Admin authentication

---

## STEP-BY-STEP TASKS

### Task 1: CREATE package.json (root)

- **IMPLEMENT**: Initialize npm workspace for monorepo
- **VALIDATE**: `npm install`

```json
{
  "name": "tuk-tuk",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev:user": "npm run dev -w apps/user",
    "dev:admin": "npm run dev -w apps/admin",
    "convex": "convex dev"
  },
  "devDependencies": {
    "convex": "^1.17.0",
    "typescript": "^5.7.0"
  }
}
```

### Task 2: CREATE convex/schema.ts

- **IMPLEMENT**: Define all database tables from Airtable schema
- **PATTERN**: Follow Convex schema guidelines
- **IMPORTS**: `defineSchema`, `defineTable` from `convex/server`, `v` from `convex/values`
- **GOTCHA**: Index names must include all fields (e.g., `by_status_and_region`)
- **VALIDATE**: `npx convex dev` (schema should sync)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  participants: defineTable({
    // Identity
    name: v.string(),
    phone: v.string(),
    telegramId: v.string(),
    tgFirstName: v.optional(v.string()),
    tgLastName: v.optional(v.string()),
    photo: v.optional(v.string()),
    
    // Demographics
    age: v.number(),
    gender: v.string(),
    region: v.string(), // "North" | "Center" | "South"
    city: v.optional(v.string()),
    familyStatus: v.optional(v.string()),
    
    // Preferences
    targetGender: v.optional(v.string()),
    targetAgeFrom: v.optional(v.number()),
    targetAgeTo: v.optional(v.number()),
    formatPreference: v.optional(v.string()),
    
    // Profile
    aboutMe: v.optional(v.string()),
    profession: v.optional(v.string()),
    whoToMeet: v.optional(v.string()),
    values: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    
    // Status
    status: v.string(), // "Lead" | "Active" | "Inactive"
    onPause: v.boolean(),
    totalPoints: v.number(),
    registrationDate: v.number(),
    
    // Subscription
    paidUntil: v.optional(v.number()),
    paymentDate: v.optional(v.number()),
    inChannel: v.boolean(),
    periodsPaid: v.number(),
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_status", ["status"])
    .index("by_status_and_region", ["status", "region"])
    .index("by_status_and_onPause", ["status", "onPause"]),

  groups: defineTable({
    createdAt: v.number(),
    status: v.string(), // "Active" | "Completed" | "Cancelled"
    region: v.optional(v.string()),
    participant1: v.id("participants"),
    participant2: v.id("participants"),
    participant3: v.optional(v.id("participants")),
    participant4: v.optional(v.id("participants")),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  feedback: defineTable({
    groupId: v.id("groups"),
    participantId: v.id("participants"),
    rating: v.number(),
    textFeedback: v.optional(v.string()),
    wouldMeetAgain: v.optional(v.boolean()),
    photos: v.optional(v.array(v.string())),
    submittedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_participantId", ["participantId"]),

  paymentLogs: defineTable({
    participantId: v.id("participants"),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    payPlusTransactionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_participantId", ["participantId"]),

  supportTickets: defineTable({
    participantId: v.optional(v.id("participants")),
    telegramId: v.string(),
    question: v.string(),
    answer: v.optional(v.string()),
    status: v.string(), // "Open" | "Answered" | "Closed"
    createdAt: v.number(),
  })
    .index("by_status", ["status"]),

  admins: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
  })
    .index("by_email", ["email"]),
});
```

### Task 3: CREATE convex/participants.ts

- **IMPLEMENT**: CRUD operations for participants
- **PATTERN**: Use new function syntax with validators
- **IMPORTS**: `query`, `mutation`, `internalQuery` from `./_generated/server`
- **VALIDATE**: `npx convex dev`

### Task 4: CREATE convex/groups.ts

- **IMPLEMENT**: Group management queries and mutations
- **PATTERN**: Use `withIndex` for filtering, never `filter`
- **VALIDATE**: `npx convex dev`

### Task 5: CREATE convex/matching.ts

- **IMPLEMENT**: Port matching algorithm from `legacy/google_script.js`
- **PATTERN**: Use `internalMutation` for matching logic
- **GOTCHA**: Algorithm has 5 stages (A-E) - implement all
- **VALIDATE**: `npx convex dev`

### Task 6: CREATE convex/payments.ts

- **IMPLEMENT**: Payment link generation and webhook handling
- **PATTERN**: Use `action` for external PayPlus API calls
- **GOTCHA**: Actions cannot use `ctx.db` - must call mutations
- **VALIDATE**: `npx convex dev`

### Task 7: CREATE convex/http.ts

- **IMPLEMENT**: HTTP endpoints for PayPlus webhook
- **PATTERN**: Use `httpRouter` and `httpAction`
- **VALIDATE**: `npx convex dev`

### Task 8: CREATE convex/crons.ts

- **IMPLEMENT**: Weekly matching scheduler, expiry reminders
- **PATTERN**: Use `cronJobs()` with `internal` function references
- **GOTCHA**: Only use `crons.interval` or `crons.cron`, not helpers
- **VALIDATE**: `npx convex dev`

### Task 9: CREATE apps/user/ structure

- **IMPLEMENT**: Initialize Vite + React app for user Mini App
- **VALIDATE**: `cd apps/user && npm run dev`

### Task 10: CREATE apps/admin/ structure

- **IMPLEMENT**: Initialize Vite + React app for admin dashboard
- **VALIDATE**: `cd apps/admin && npm run dev`

### Task 11-38: See detailed tasks in follow-up plan documents

---

## TESTING STRATEGY

### Unit Tests

- Test matching algorithm with known input/output pairs from legacy system
- Test each Convex function with Convex test framework

### Integration Tests

- Test full user registration flow
- Test payment webhook processing
- Test matching trigger and notification flow

### Edge Cases

- Matching with odd number of participants
- Payment webhook retry/duplicate handling
- Telegram initData validation edge cases

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
npx eslint convex/ apps/
```

### Level 2: Convex Functions

```bash
npx convex dev  # Should sync without errors
```

### Level 3: App Builds

```bash
npm run build -w apps/user
npm run build -w apps/admin
```

### Level 4: Manual Validation

- Open user app in Telegram Mini App context
- Test matching algorithm via Convex dashboard
- Verify PayPlus webhook endpoint responds

---

## ACCEPTANCE CRITERIA

- [ ] Convex schema deployed with all tables and indexes
- [ ] Matching algorithm produces same results as Google Script
- [ ] User can register, view profile, see groups
- [ ] Admin can view/edit participants, trigger matching
- [ ] PayPlus payment flow works end-to-end
- [ ] Telegram notifications sent on match creation
- [ ] Both apps deploy to Netlify successfully

---

## COMPLETION CHECKLIST

- [ ] All Convex functions have arg and return validators
- [ ] No use of `filter()` in queries - all use indexes
- [ ] Actions use `ctx.runQuery`/`ctx.runMutation` for DB access
- [ ] Crons use `internal` function references
- [ ] HTTP endpoints return proper Response objects
- [ ] Both frontends connect to Convex successfully

---

## NOTES

**Key Design Decisions:**

1. **Single Convex file per domain** - Simpler than nested folders for MVP
2. **Matching as internalMutation** - Can be scheduled and called from admin
3. **PayPlus integration via Action** - External API calls need Action context
4. **Admin auth via simple password** - SSO deferred to post-MVP

**Potential Pivots:**

- If Convex rate limits become an issue, batch operations where possible
- If Telegram Mini App has limitations, provide fallback web link

**Confidence Score: 8/10**

High confidence due to:
- Clear PRD with detailed requirements
- Legacy code available for reference
- Convex patterns well-documented

Risk areas:
- PayPlus API integration details not fully known
- Telegram Mini App testing requires real device
