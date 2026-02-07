# BeKesher - Product Requirements Document

**Version:** 1.0  
**Date:** 2026-02-07  
**Status:** Draft

---

## 1. Executive Summary

**BeKesher** (בְּקֶשֶׁר — "In Touch") is an automated networking and socialization platform designed specifically for new immigrants in Israel. The application facilitates meaningful connections through weekly task-based meetups and gamified social interactions.

The current system operates as a **No-Code/Low-Code MVP** built on Telegram, Make.com, Airtable, and Google Apps Script. This PRD outlines the complete rebuild of the platform using a modern, scalable full-stack architecture with **Convex** as the backend, replacing the existing fragmented infrastructure. The new system will include a dedicated **User UI** (replacing Fillout forms) and an **Admin Panel** (replacing Airtable management).

**Core Value Proposition:**
- Help new immigrants overcome social isolation through structured, gamified networking
- Match participants based on region, age, interests, and values
- Provide weekly tasks that encourage in-person meetups
- Create a sustainable community with subscription-based access

**MVP Goal Statement:**
Deliver a production-ready application with Convex backend, user-facing web interface (Telegram Mini App), and admin dashboard that replicates 100% of current functionality while enabling future scalability and AI-enhanced matching.

---

## 2. Mission

### Mission Statement
*Empower new immigrants in Israel to build meaningful, lasting connections through structured social activities, fostering a sense of belonging and community integration.*

### Core Principles

1. **Connection First** — Every feature should facilitate genuine human connections, not just surface-level networking
2. **Inclusive Design** — Support for Russian-speaking users with RTL Hebrew considerations for future expansion
3. **Thoughtful Matching** — Use sophisticated algorithms (and eventually AI) to create compatible pairings that maximize connection quality
4. **Gamification with Purpose** — Points, tasks, and seasons add fun without losing sight of meaningful outcomes
5. **Privacy & Trust** — Handle personal information responsibly; matching requires data, but minimize exposure

---

## 3. Target Users

### Primary Persona: New Immigrant ("Oleh/Olah Chadasha")

| Attribute | Details |
|-----------|---------|
| **Demographics** | Adults aged 20-60, recently immigrated to Israel (within 5 years) |
| **Location** | Three regions: North, Center, South of Israel |
| **Language** | Primarily Russian-speaking; Hebrew as secondary |
| **Technical Comfort** | Comfortable with Telegram and mobile apps; varied computer literacy |
| **Goals** | Find friends, build professional network, integrate into Israeli society |
| **Pain Points** | Loneliness, language barriers, difficulty meeting like-minded people organically |

### Secondary Persona: Community Administrator

| Attribute | Details |
|-----------|---------|
| **Role** | Manage participants, monitor groups, handle support tickets, process payments |
| **Technical Comfort** | Moderate; needs intuitive UI rather than raw database access |
| **Goals** | Efficiently manage growing community, minimize manual matching, track metrics |
| **Pain Points** | Current Airtable management is complex; Make.com scenarios are fragile |

---

## 4. MVP Scope

### ✅ In Scope

#### Core Functionality
- ✅ User registration and profile management via web UI
- ✅ Weekly automated group matching (2-4 participants per group)
- ✅ Multi-stage matching algorithm (strict → relaxed criteria)
- ✅ Subscription/payment management with PayPlus integration
- ✅ Feedback collection after weekly meetups
- ✅ Points and scoring system
- ✅ Pause/Resume participation
- ✅ Telegram integration for notifications

#### Admin Panel
- ✅ Participant management (view, edit, status changes)
- ✅ Group management and manual overrides
- ✅ Weekly matching trigger and monitoring
- ✅ Payment status tracking
- ✅ Support ticket management
- ✅ Analytics dashboard (basic metrics)

#### Technical
- ✅ Convex backend with real-time database
- ✅ React-based User UI (Telegram Mini App compatible)
- ✅ React-based Admin Dashboard
- ✅ Scheduled functions (cron jobs) for matching and reminders
- ✅ PayPlus webhook endpoint for payment callbacks
- ✅ Telegram Bot API integration for outbound notifications

#### Deployment
- ✅ Netlify deployment for frontends
- ✅ Convex cloud for backend
- ✅ Production environment with proper secrets management

### ❌ Out of Scope (Future Phases)

#### Deferred Features
- ❌ **Random Coffee** instant matching feature (Phase 2)
- ❌ AI/ML-based matching using vector embeddings
- ❌ Multi-language support (Hebrew, English)
- ❌ Mobile native apps (iOS/Android)
- ❌ Advanced gamification (badges, leaderboards, seasons)
- ❌ Group chat creation within app
- ❌ Photo verification system
- ❌ Referral/invite system with incentives
- ❌ Partner organization integrations

#### Technical Debt
- ❌ Migration of historical data from Airtable
- ❌ Automated testing suite
- ❌ CI/CD pipeline with preview environments

---

## 5. User Stories

### Primary User Stories

1. **As a new immigrant**, I want to **register with my profile information**, so that **I can be matched with compatible people in my region**.
   - *Example:* Maria, 32, from Moscow, fills out her profile with age, city (Haifa), interests ("Psychology", "Hiking"), and what she's looking for in connections.

2. **As a participant**, I want to **receive a weekly notification about my matched group**, so that **I can plan a meetup with my group members**.
   - *Example:* On Sunday, Alex receives a Telegram message with his group: two people from the Center region, similar ages, with contact details and this week's suggested activity.

3. **As a participant**, I want to **submit feedback after my meetup**, so that **I can earn points and help improve future matches**.
   - *Example:* After meeting her group, Olga rates the experience 8/10, uploads a photo, and indicates she'd meet one of the participants again.

4. **As a participant**, I want to **manage my subscription and payment**, so that **I can continue participating or pause when needed**.
   - *Example:* Igor wants to pause for a month due to travel. He clicks "Pause" and is excluded from matching until he resumes.

5. **As a participant**, I want to **view and update my profile**, so that **my preferences are always current**.
   - *Example:* After 6 months, Natasha moves from North to Center region. She updates her profile to reflect the new location.

### Admin User Stories

6. **As an admin**, I want to **view all participants with filters**, so that **I can quickly find and manage specific users**.
   - *Example:* Admin filters for "Active" participants in "South" region to check subscription expiry dates.

7. **As an admin**, I want to **manually trigger the weekly matching algorithm**, so that **I can control when groups are formed**.
   - *Example:* Admin reviews active participant count, confirms no issues, then triggers matching for the week.

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────┬───────────────────────────────────────┤
│    User UI              │           Admin Dashboard             │
│  (Telegram Mini App)    │         (Web Application)             │
│    React + Vite         │          React + Vite                 │
└─────────────┬───────────┴───────────────┬───────────────────────┘
              │                           │
              │    Convex React Hooks     │
              │                           │
┌─────────────▼───────────────────────────▼───────────────────────┐
│                       CONVEX BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│  • Queries (Read operations)                                     │
│  • Mutations (Write operations)                                  │
│  • Actions (External API calls, complex logic)                   │
│  • HTTP Endpoints (Webhooks)                                     │
│  • Scheduled Functions (Cron jobs)                               │
├─────────────────────────────────────────────────────────────────┤
│                    CONVEX DATABASE                               │
│  (Real-time, ACID, Schema-validated)                            │
└─────────────────────────────────────────────────────────────────┘
              │
              ├── Telegram Bot API (Notifications)
              ├── PayPlus API (Payments)
              └── Telegram Web App SDK (Authentication)
```

### Directory Structure

```
bekesher/
├── .docs/                      # Documentation
│   ├── PRD.md                  # This document
│   └── brainstorming/          # Design discussions
├── convex/                     # Convex backend
│   ├── schema.ts               # Database schema
│   ├── participants/           # Participant-related functions
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── groups/                 # Group-related functions
│   ├── matching/               # Matching algorithm
│   │   ├── algorithm.ts
│   │   └── scheduled.ts
│   ├── payments/               # Payment processing
│   ├── feedback/               # Feedback handling
│   └── http.ts                 # HTTP endpoints (webhooks)
├── apps/
│   ├── user/                   # User-facing Mini App
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   └── package.json
│   └── admin/                  # Admin dashboard
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   └── App.tsx
│       └── package.json
├── legacy/                     # Reference files (old system)
└── package.json                # Root workspace config
```

### Key Design Patterns

1. **Event-Driven Architecture** — All state changes trigger real-time updates via Convex subscriptions
2. **Domain-Driven Modules** — Code organized by business domain (participants, groups, matching)
3. **Staged Matching Algorithm** — Waterfall approach from strict to relaxed criteria
4. **Optimistic Updates** — UI updates immediately, rolls back on error
5. **Webhook-Based Integration** — External services (PayPlus, Telegram) communicate via HTTP endpoints

---

## 7. Features

### 7.1 Participant Management

**Purpose:** Handle all participant lifecycle from registration to deactivation.

| Operation | Description |
|-----------|-------------|
| `registerParticipant` | Create new participant from Telegram data + profile form |
| `updateProfile` | Modify participant details (region, age, interests, etc.) |
| `setStatus` | Change status (Active, Lead, Pause, Inactive) |
| `togglePause` | Put participant on pause or resume participation |
| `getParticipantByTelegramId` | Lookup by Telegram user ID |
| `listActiveParticipants` | Get all participants eligible for matching |

**Key Features:**
- Profile data includes: name, phone, Telegram ID, age, region, city, gender, family status, interests, values, preferences
- Status workflow: Lead → Active → (Pause ↔ Active) → Inactive
- Subscription tracking with expiry dates

### 7.2 Weekly Matching Algorithm

**Purpose:** Automatically create compatible groups of 2-4 participants each week.

| Stage | Criteria | Description |
|-------|----------|-------------|
| **A: Strict** | Same region, ±10y age, no repeats (4 weeks) | Best possible matches |
| **B: Expanded Age** | Same region, ±15y age, no repeats | Widen age tolerance |
| **C: Allow Repeats** | Same region, ±15y age, can repeat | Accept repeated pairs |
| **D: Neighboring Regions** | Adjacent regions, ±15y age | North↔Center, Center↔South |
| **E: Force Majeure** | Any compatible (never North+South) | Ensures no one left out |

**Algorithm Flow:**
1. Fetch active participants not already in active groups
2. Build history map from last 4 weeks of groups
3. Run stages A→E sequentially, moving unpaired to next stage
4. Create group records with status "Active"
5. Trigger notifications to all matched participants

### 7.3 Payments & Subscriptions

**Purpose:** Handle subscription lifecycle and payment processing.

| Operation | Description |
|-----------|-------------|
| `createPaymentRequest` | Generate PayPlus payment link |
| `handlePaymentCallback` | Process PayPlus webhook on success/failure |
| `updateSubscription` | Extend `paidUntil` date on successful payment |
| `sendExpiryReminders` | Scheduled job for 3-day, 1-day, same-day warnings |
| `handleExpiredSubscriptions` | Deactivate overdue accounts (grace: 6 days) |

**Key Features:**
- Integration with PayPlus payment gateway
- Telegram channel invite link generation on first payment
- Automatic reminder sequence before expiry

### 7.4 Feedback System

**Purpose:** Collect post-meetup feedback to improve matching and track engagement.

| Field | Type | Description |
|-------|------|-------------|
| `groupId` | Reference | Link to the group |
| `participantId` | Reference | Who submitted feedback |
| `rating` | Number (1-10) | Overall experience rating |
| `photos` | Attachments | Optional meetup photos |
| `textFeedback` | Text | Open-ended comments |
| `wouldMeetAgain` | Boolean | Re-match preference |

**Points System:**
- Submit feedback: +10 points
- Upload photo: +5 points
- Points visible on participant profile

### 7.5 Admin Dashboard

**Purpose:** Provide administrators with tools to manage the community.

| Module | Features |
|--------|----------|
| **Participants** | List view with filters (status, region, subscription), detail view, inline editing |
| **Groups** | View current/historical groups, status management, manual participant assignment |
| **Matching** | Trigger weekly algorithm, view matching results, handle edge cases |
| **Payments** | View transaction logs, payment status, manual subscription extension |
| **Support** | Ticket list, response interface, ticket status management |
| **Analytics** | Active users, match success rate, feedback averages, revenue |

---

## 8. Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Convex** | Latest | Backend-as-a-Service: database, functions, scheduling |
| **TypeScript** | 5.x | Type-safe development |
| **Convex Actions** | - | External API calls (Telegram, PayPlus) |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **Vite** | 5.x | Build tool and dev server |
| **TypeScript** | 5.x | Type safety |
| **Convex React** | Latest | Real-time data binding |
| **React Router** | 6.x | Client-side routing |

### Styling

| Technology | Purpose |
|------------|---------|
| **Vanilla CSS** | Flexible, custom styling |
| **CSS Variables** | Theming and dark mode support |
| **Google Fonts (Inter)** | Modern typography |

### External Integrations

| Service | Purpose |
|---------|---------|
| **Telegram Bot API** | Send notifications, manage channel access |
| **Telegram Web App SDK** | User authentication, Mini App integration |
| **PayPlus** | Israeli payment processing |

### Deployment

| Service | Purpose |
|---------|---------|
| **Convex Cloud** | Backend hosting (included with Convex) |
| **Netlify** | Frontend hosting for both apps |

### Optional Dependencies

| Package | Purpose |
|---------|---------|
| `dayjs` | Date manipulation |
| `zod` | Runtime validation (if not using Convex validators) |
| `react-hot-toast` | Toast notifications |

---

## 9. Security & Configuration

### Authentication & Authorization

| Component | Method |
|-----------|--------|
| **User UI** | Telegram Web App `initData` validation |
| **Admin Dashboard** | Password-based login (MVP), SSO (future) |
| **API Security** | Convex built-in authentication, HTTP endpoint validation |

### Environment Variables

```env
# Convex (auto-managed)
CONVEX_URL=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=

# PayPlus
PAYPLUS_API_KEY=
PAYPLUS_SECRET_KEY=
PAYPLUS_TERMINAL_UID=

# App URLs
VITE_USER_APP_URL=
VITE_ADMIN_APP_URL=
```

### Security Scope

#### ✅ In Scope
- Telegram `initData` signature validation
- Admin authentication with session management
- Environment secrets in Convex dashboard
- HTTPS everywhere (enforced by Netlify/Convex)

#### ❌ Out of Scope (Future)
- Rate limiting
- GDPR data export/deletion tooling
- Full audit logging
- Two-factor authentication for admins

---

## 10. API Specification

### Convex Queries

```typescript
// participants/queries.ts
getParticipantByTelegramId(telegramId: string): Participant | null
listParticipants(filters?: { status?: Status, region?: Region }): Participant[]
getParticipantGroups(participantId: Id<"participants">): Group[]

// groups/queries.ts
getActiveGroups(): Group[]
getGroupById(groupId: Id<"groups">): Group | null
getGroupHistory(weeks: number): Group[]
```

### Convex Mutations

```typescript
// participants/mutations.ts
registerParticipant(data: RegistrationData): Id<"participants">
updateProfile(id: Id<"participants">, updates: Partial<Participant>): void
setParticipantStatus(id: Id<"participants">, status: Status): void

// groups/mutations.ts
createGroup(participants: Id<"participants">[]): Id<"groups">
updateGroupStatus(id: Id<"groups">, status: GroupStatus): void

// matching/mutations.ts
runWeeklyMatching(): MatchingResult
```

### HTTP Endpoints

```typescript
// http.ts - Webhook handlers

POST /api/telegram-webhook
// Receives Telegram bot updates
// Body: Telegram Update object
// Response: { ok: true }

POST /api/payplus-callback
// Receives PayPlus payment notifications
// Body: PayPlus callback payload
// Response: { received: true }

POST /api/trigger-matching
// Admin-triggered matching (authenticated)
// Headers: Authorization: Bearer <token>
// Response: { groupsCreated: number, unpaired: number }
```

---

## 11. Success Criteria

### MVP Success Definition

The MVP is successful when:
1. All active participants can be matched weekly using the new system
2. Admin can manage participants without accessing raw database
3. Users can register, update profiles, and view matches via the Mini App
4. Payment flow works end-to-end with PayPlus
5. System handles 100+ concurrent users without degradation

### Functional Requirements

- ✅ Matching algorithm produces identical results to Google Script implementation
- ✅ Payment webhooks process within 1 second
- ✅ Notifications delivered to Telegram within 2 seconds of trigger
- ✅ Admin dashboard loads participant list in under 1 second

### Quality Indicators

| Metric | Target |
|--------|--------|
| **Uptime** | 99.5% |
| **API Response Time (p95)** | < 500ms |
| **Frontend Load Time** | < 2 seconds (LCP) |
| **Error Rate** | < 0.1% |
| **Real-time Sync Latency** | < 200ms |

### User Experience Goals

- 🎯 Users can complete registration in under 3 minutes
- 🎯 Admin can find any participant within 3 clicks
- 🎯 Weekly matching runs without manual intervention
- 🎯 Mobile-first design works flawlessly in Telegram Mini App context

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up project infrastructure and database schema.

**Deliverables:**
- ✅ Initialize Convex project with schema matching Airtable structure
- ✅ Create monorepo structure with `apps/user` and `apps/admin`
- ✅ Implement basic Convex queries and mutations for participants
- ✅ Set up Netlify deployment pipeline

**Validation:**
- Schema correctly represents all entities from `airtable.json`
- Basic CRUD operations work via Convex dashboard
- Both apps deploy to Netlify (even if just with placeholder content)

---

### Phase 2: Core Backend (Week 3-4)

**Goal:** Implement all backend logic including matching algorithm.

**Deliverables:**
- ✅ Port matching algorithm from `google_script.js` to Convex actions
- ✅ Create scheduled functions for weekly matching and reminders
- ✅ Set up HTTP endpoint for PayPlus payment callback
- ✅ Payment flow integration with PayPlus
- ✅ Telegram Bot API integration for sending notifications

**Validation:**
- Matching algorithm produces correct groups given test data
- Webhook endpoints respond to test payloads

---

### Phase 3: User Interface (Week 5-6)

**Goal:** Build user-facing Mini App with full feature parity.

**Deliverables:**
- ✅ Registration flow with multi-step form
- ✅ Profile view and edit screens
- ✅ My groups/matches view
- ✅ Subscription status and payment initiation
- ✅ Feedback submission form
- ✅ Telegram Mini App integration (theming, haptics, auth)

**Validation:**
- Complete user journey works from registration to feedback
- UI correctly adapts to Telegram theme (light/dark)
- All forms validate input correctly

---

### Phase 4: Admin Dashboard & Polish (Week 7-8)

**Goal:** Complete admin panel and prepare for production.

**Deliverables:**
- ✅ Participant list with filtering and search
- ✅ Participant detail view with editing
- ✅ Group management interface
- ✅ Matching control panel (trigger, view results)
- ✅ Support ticket management
- ✅ Basic analytics dashboard
- ✅ Admin authentication

**Validation:**
- Admin can perform all currently Airtable-based operations
- Matching can be triggered and monitored
- Support tickets can be viewed and responded to

---

## 13. Future Considerations

### Post-MVP Enhancements

1. **AI-Powered Matching**
   - Use vector embeddings for "About Me" and interests fields
   - Semantic similarity scoring for better compatibility
   - Learning from feedback to improve future matches

2. **Enhanced Gamification**
   - Seasons with reset points and prizes
   - Achievement badges (First Match, Consistent Participant, etc.)
   - Leaderboards by region

3. **Multi-Language Support**
   - Hebrew interface for native speakers
   - English for international participants
   - RTL layout support

4. **Advanced Analytics**
   - Match success prediction
   - Churn risk identification
   - Network graph visualization

### Integration Opportunities

- **Calendar Integration** — Add meetups to Google/Apple calendars
- **Venue Suggestions** — Partner with cafes for discounts
- **Event Platform** — Group events beyond 1:1 matches
- **CRM Integration** — Export to marketing/community tools

---

## 14. Risks & Mitigations

### Risk 1: Algorithm Parity Failure
**Description:** New matching algorithm produces different results than legacy Google Script.
**Impact:** High — Users may get worse matches, affecting retention.
**Mitigation:**
- Write comprehensive test suite with known input/output pairs
- Run parallel matching (old vs new) for 2 weeks before cutover
- Maintain ability to roll back to Make.com trigger

### Risk 2: PayPlus Integration Issues
**Description:** Payment webhook handling fails, causing lost payments.
**Impact:** Critical — Direct revenue impact, user frustration.
**Mitigation:**
- Implement idempotent payment processing
- Log all webhook payloads for debugging
- Set up manual payment override in admin panel

### Risk 3: Telegram Mini App Limitations
**Description:** UI doesn't work correctly in Telegram Mini App context.
**Impact:** Medium — Core user experience degraded.
**Mitigation:**
- Test extensively in Telegram clients (iOS, Android, Desktop)
- Use Telegram Web App SDK properly for theming/navigation
- Have fallback web link for features that don't work in Mini App

### Risk 4: Data Migration Corruption
**Description:** Historical data from Airtable is lost or corrupted during migration.
**Impact:** High — User history, payment records affected.
**Mitigation:**
- Export full Airtable backup before any migration
- Run migration scripts in dry-run mode first
- Validate record counts and key fields post-migration

### Risk 5: Scaling Beyond Convex Limits
**Description:** System hits Convex rate limits or pricing thresholds unexpectedly.
**Impact:** Medium — Performance degradation or cost overrun.
**Mitigation:**
- Monitor Convex usage dashboard
- Implement caching for frequently-accessed queries
- Design with batch operations where possible

---

## 15. Appendix

### Project Blueprints

| File | Type | Purpose |
|------|------|---------|
| `legacy/airtable.json` | Database Schema | Complete Airtable structure with all tables and fields |
| `legacy/google_script.js` | Business Logic | v3.1 matching algorithm implementation |
| `legacy/make-blueprint/*.json` | Workflow Definitions | Make.com scenario exports (17 scenarios) |
| `legacy/old_architecture.md` | Documentation | Current system architecture overview |
| `legacy/random_cofee.html` | UI Reference | Telegram Mini App UI for Random Coffee |

### Key Dependencies

| Dependency | Documentation |
|------------|---------------|
| Convex | https://docs.convex.dev |
| Telegram Bot API | https://core.telegram.org/bots/api |
| Telegram Web Apps | https://core.telegram.org/bots/webapps |
| PayPlus API | https://www.payplus.co.il/api-documentation |

### Database Tables (From Airtable)

| Table (Russian) | Table (English) | Purpose |
|-----------------|-----------------|---------|
| Участники | Participants | User profiles and preferences |
| Группы | Groups | Weekly matched groups |
| Random Coffee | Random Coffee | On-demand matching requests *(Phase 2)* |
| Лог платежей | Payment Logs | Transaction history |
| Финансы | Finance | Revenue/expense tracking |
| Вопрос/Ответ | Support Tickets | User support requests |
| Лог ошибок | Error Logs | System error tracking |

### Participant Fields Summary

**Core Identity:** Name, Phone, Telegram_ID, TG_First_Name, TG_Last_Name, Photo
**Demographics:** Age, Gender, Region, City, Family Status
**Preferences:** Target Gender, Target Age Range (From/To), Format Preference (Online/Offline/Travel)
**Profile Content:** About Me, Profession, Who I Want to Meet, Values, Interests
**Game Status:** Status, On Pause, Total Points, Registration Date
**Subscription:** Paid Until, Payment Date, In Channel, Periods Paid
**Groups:** Links to Groups 1-4, Feedback records

---

*Document generated following `.cursor/commands/create-prd.md` template.*
