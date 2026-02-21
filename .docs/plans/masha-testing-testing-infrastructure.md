# Feature: Testing Infrastructure

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Establish a comprehensive testing infrastructure for the Tuk-Tuk project using Vitest and `convex-test`. This covers:

1. **Convex backend unit tests** for all 8 domain modules (participants, groups, matching, payments, feedback, support, notifications, crons)
2. **HTTP endpoint tests** for webhook handlers (PayPlus, Telegram, health)
3. **Matching algorithm tests** — the most critical business logic, requiring algorithm parity validation against known scenarios
4. **Test configuration** at the monorepo root level for Convex functions

The PRD explicitly identifies "Algorithm Parity Failure" as Risk #1 (High Impact) and states: "Write comprehensive test suite with known input/output pairs." Additionally, "Automated testing suite" is listed under Technical Debt in Section 4.

## User Story

As a **developer maintaining Tuk-Tuk**
I want to **have automated tests for all backend functions and critical business logic**
So that **I can confidently make changes, catch regressions early, and validate matching algorithm correctness**

## Problem Statement

The project has zero test infrastructure — no test framework, no test files, no test configuration. The PRD identifies this as a critical gap, especially for the matching algorithm which is the core business logic. Without tests:
- Matching algorithm correctness cannot be verified against the legacy Google Script
- Payment webhook handling cannot be validated
- Refactoring any backend function risks silent regressions
- No CI/CD pipeline can be built without a test suite

## Solution Statement

Install `convex-test` + Vitest + `@edge-runtime/vm` at the root level. Create a `vitest.config.mts` at the project root targeting the `convex/` directory. Write test files colocated with their source modules in `convex/` (e.g., `convex/participants.test.ts`). Focus test coverage on:
1. All CRUD operations (participants, groups, feedback, support, payments)
2. The 5-stage matching algorithm with edge cases
3. HTTP webhook handlers
4. Scheduled function handlers (cron jobs)
5. Business rule validation (duplicate prevention, status workflows, point awards)

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: Medium-High
**Primary Systems Affected**: Convex backend (`convex/`), root `package.json`
**Dependencies**: `convex-test`, `vitest`, `@edge-runtime/vm`

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` (full file) - Why: All 6 table schemas with validators and indexes — needed for every test
- `convex/participants.ts` (full file) - Why: 10 functions (4 public queries/mutations, 3 internal mutations, 1 internal query) to test
- `convex/groups.ts` (full file) - Why: 6 functions (3 public queries, 3 internal queries/mutations) to test
- `convex/matching.ts` (full file) - Why: **CRITICAL** — 5-stage matching algorithm with 8 helper functions. Most important test target
- `convex/payments.ts` (full file) - Why: Payment lifecycle (create link, process success/failure, log) with PayPlus integration
- `convex/feedback.ts` (full file) - Why: Feedback CRUD with business rules (duplicate prevention, point awards, group membership check)
- `convex/support.ts` (full file) - Why: Support ticket lifecycle (create, answer, close) with validation
- `convex/notifications.ts` (full file) - Why: External API calls (Telegram) that need fetch mocking
- `convex/crons.ts` (full file) - Why: Scheduled handlers (week close, payment reminders, cleanup)
- `convex/http.ts` (full file) - Why: HTTP webhook handlers (PayPlus callback, Telegram webhook, health check)
- `package.json` (root) - Why: Need to add devDependencies and test scripts here
- `convex/tsconfig.json` - Why: TypeScript config for the Convex environment, tests must match this

### New Files to Create

- `vitest.config.mts` - Vitest configuration for Convex backend tests
- `convex/testUtils.ts` - Shared test utilities: participant factories, group factories, common setup
- `convex/participants.test.ts` - Tests for participant CRUD and lifecycle
- `convex/groups.test.ts` - Tests for group CRUD and lifecycle
- `convex/matching.test.ts` - Tests for the 5-stage matching algorithm (most critical)
- `convex/payments.test.ts` - Tests for payment lifecycle
- `convex/feedback.test.ts` - Tests for feedback submission and business rules
- `convex/support.test.ts` - Tests for support ticket lifecycle
- `convex/http.test.ts` - Tests for HTTP webhook handlers
- `convex/crons.test.ts` - Tests for scheduled function handlers

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Testing with convex-test](https://docs.convex.dev/testing/convex-test)
  - Specific section: Full setup guide, API surface, examples
  - Why: Primary testing library — all patterns must follow this guide
- [Vitest Documentation](https://vitest.dev/guide/)
  - Specific section: Configuration, mocking, fake timers
  - Why: Test runner configuration and assertion patterns
- [convex-test npm package](https://www.npmjs.com/package/convex-test)
  - Why: Latest version info and API reference

### Patterns to Follow

**convex-test Initialization Pattern:**
```typescript
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

test("test name", async () => {
    const t = convexTest(schema);
    // Use t.query(), t.mutation(), t.action(), t.run(), t.fetch()
});
```

**Database Seeding Pattern (use `t.run()`):**
```typescript
const t = convexTest(schema);
const participantId = await t.run(async (ctx) => {
    return await ctx.db.insert("participants", {
        name: "Test User",
        phone: "+972501234567",
        telegramId: "123456",
        age: 30,
        gender: "Male",
        region: "Center",
        status: "Active",
        onPause: false,
        totalPoints: 0,
        registrationDate: Date.now(),
        inChannel: false,
        periodsPaid: 0,
    });
});
```

**Fetch Mocking Pattern (for actions calling external APIs):**
```typescript
vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
        json: async () => ({ ok: true, result: { invite_link: "https://t.me/+abc" } }),
    }) as unknown as Response),
);
// ... run action ...
vi.unstubAllGlobals();
```

**HTTP Endpoint Testing Pattern:**
```typescript
const t = convexTest(schema);
const response = await t.fetch("/health", { method: "GET" });
expect(response.status).toBe(200);
```

**Error Assertion Pattern:**
```typescript
await expect(async () => {
    await t.mutation(api.participants.register, { /* duplicate data */ });
}).rejects.toThrowError("Participant with this Telegram ID already exists");
```

**Naming Conventions:**
- Test files: `{module}.test.ts` colocated in `convex/`
- Test names: descriptive, use domain language ("registers a new participant as Lead status")
- Factory functions: `createTestParticipant()`, `createTestGroup()`, etc.

**Error Handling Pattern in Source:**
- Functions throw `new Error("descriptive message")` for validation failures
- Actions return `{ success: boolean, error?: string }` objects for external API failures

**Module Import Pattern:**
```typescript
// Public functions via api
import { api } from "./_generated/api";
// Internal functions via internal
import { internal } from "./_generated/api";
```

### Blueprint Alignment (Critical)

- **Data Architecture**: `convex/schema.ts` is the source of truth. Tests must create data matching ALL required fields per table schema. No schema changes needed for testing.
- **Logic Workflows**: No workflow file changes. Tests validate existing Convex function logic.
- **No UI Impact**: Testing infrastructure is backend-only. No frontend changes.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Test Infrastructure Setup

Install dependencies, create configuration, establish shared utilities.

**Tasks:**
- Install `convex-test`, `vitest`, `@edge-runtime/vm` as root devDependencies
- Create `vitest.config.mts` at project root
- Add test scripts to root `package.json`
- Create `convex/testUtils.ts` with factory functions and shared helpers

### Phase 2: Core CRUD Tests — Participants, Groups, Support

Test basic CRUD operations and business rules for the simplest modules first.

**Tasks:**
- Write `convex/participants.test.ts` — registration, profile updates, pause toggle, deactivation, internal mutations
- Write `convex/groups.test.ts` — group creation, listing, filtering, close operations, participant lookup
- Write `convex/support.test.ts` — ticket creation, answering, closing, validation rules

### Phase 3: Business Logic Tests — Matching, Feedback, Payments

Test complex business logic including the critical matching algorithm.

**Tasks:**
- Write `convex/matching.test.ts` — all 5 stages, edge cases, group size constraints, history prevention
- Write `convex/feedback.test.ts` — submission, duplicate prevention, group membership validation, point awards
- Write `convex/payments.test.ts` — payment logging, success/failure processing, subscription date calculation

### Phase 4: Integration Tests — HTTP, Crons, Notifications

Test webhook handlers, scheduled functions, and external API integrations.

**Tasks:**
- Write `convex/http.test.ts` — PayPlus callback, Telegram webhook, health check
- Write `convex/crons.test.ts` — week close handler, payment reminder logic
- Write notification-related test scenarios with fetch mocking

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: UPDATE `package.json` (root)

- **IMPLEMENT**: Add `convex-test`, `vitest`, and `@edge-runtime/vm` to `devDependencies`. Add test scripts.
- **PATTERN**: Follow existing `devDependencies` format in root `package.json`
- **DETAILS**:
  ```json
  {
    "scripts": {
      "test": "vitest",
      "test:once": "vitest run",
      "test:coverage": "vitest run --coverage --coverage.reporter=text"
    },
    "devDependencies": {
      "convex-test": "^0.0.34",
      "@edge-runtime/vm": "^4.0.4",
      "vitest": "^3.0.0"
    }
  }
  ```
- **GOTCHA**: Do NOT remove existing scripts or devDependencies. Merge with existing content. Check latest versions of `convex-test` on npm before installing — the version above is approximate.
- **VALIDATE**: `npm install` completes without errors

### Task 2: CREATE `vitest.config.mts`

- **IMPLEMENT**: Create Vitest config at project root that runs tests in `edge-runtime` environment for Convex backend tests.
- **DETAILS**:
  ```typescript
  import { defineConfig } from "vitest/config";

  export default defineConfig({
      test: {
          environment: "edge-runtime",
          server: { deps: { inline: ["convex-test"] } },
      },
  });
  ```
- **GOTCHA**: Must use `.mts` extension (not `.ts`) to ensure ESM module resolution works correctly with the monorepo setup. The `edge-runtime` environment is required for `convex-test` to work — it simulates the Convex server runtime.
- **VALIDATE**: `npx vitest run --passWithNoTests` exits 0

### Task 3: CREATE `convex/testUtils.ts`

- **IMPLEMENT**: Shared test utilities with factory functions for creating test data. These factories produce complete objects matching the schema validators so tests don't need to repeat boilerplate.
- **PATTERN**: Mirror field definitions from `convex/schema.ts` (lines 5-49 for participants)
- **IMPORTS**: `import { convexTest } from "convex-test"; import schema from "./schema";`
- **DETAILS**:
  ```typescript
  import { convexTest } from "convex-test";
  import schema from "./schema";

  /**
   * Create a fresh convexTest instance with schema.
   * Every test should call this to get an isolated database.
   */
  export function setupTest() {
      return convexTest(schema);
  }

  /**
   * Default participant data matching schema requirements.
   * Override any field by passing partial overrides.
   */
  export function makeParticipant(overrides: Partial<{
      name: string;
      phone: string;
      telegramId: string;
      tgFirstName: string;
      tgLastName: string;
      photo: string;
      age: number;
      gender: string;
      region: string;
      city: string;
      familyStatus: string;
      targetGender: string;
      targetAgeFrom: number;
      targetAgeTo: number;
      formatPreference: string;
      aboutMe: string;
      profession: string;
      whoToMeet: string;
      values: string[];
      interests: string[];
      status: string;
      onPause: boolean;
      totalPoints: number;
      registrationDate: number;
      paidUntil: number;
      paymentDate: number;
      inChannel: boolean;
      periodsPaid: number;
  }> = {}) {
      return {
          name: "Test User",
          phone: "+972501234567",
          telegramId: "100001",
          age: 30,
          gender: "Male",
          region: "Center",
          status: "Active",
          onPause: false,
          totalPoints: 0,
          registrationDate: Date.now(),
          inChannel: false,
          periodsPaid: 0,
          ...overrides,
      };
  }

  /**
   * Seed multiple participants and return their IDs.
   * Useful for matching algorithm tests that need many participants.
   */
  export async function seedParticipants(
      t: ReturnType<typeof convexTest>,
      participants: Array<ReturnType<typeof makeParticipant>>
  ) {
      const ids = [];
      for (const p of participants) {
          const id = await t.run(async (ctx) => {
              return await ctx.db.insert("participants", p);
          });
          ids.push(id);
      }
      return ids;
  }
  ```
- **GOTCHA**: Factory defaults must include ALL required fields from schema.ts. The `telegramId` should be unique per test participant — use overrides when creating multiple participants.
- **VALIDATE**: `npx vitest run --passWithNoTests` still passes (this file has no tests)

### Task 4: CREATE `convex/participants.test.ts`

- **IMPLEMENT**: Tests for all participant functions. Cover:
  1. `register` — creates participant with "Lead" status, sets defaults (onPause=false, totalPoints=0, periodsPaid=0)
  2. `register` — throws on duplicate telegramId
  3. `getByTelegramId` — returns participant or null
  4. `getMyProfile` — returns subset of fields
  5. `list` — returns all participants, with status filter, with status+region filter
  6. `updateProfile` — updates specified fields, ignores undefined
  7. `togglePause` — toggles onPause boolean, returns new value
  8. `deactivate` — sets status to "Inactive", onPause to false
  9. `getActiveForMatching` (internal) — returns Active and Lead participants not on pause
  10. `updateStatus` (internal) — patches status
  11. `updatePaymentInfo` (internal) — updates paidUntil, paymentDate, increments periodsPaid, sets status to "Active"
  12. `addPoints` (internal) — increments totalPoints
- **PATTERN**: Use `setupTest()` and `makeParticipant()` from `convex/testUtils.ts`
- **IMPORTS**: `import { expect, test, describe } from "vitest"; import { api, internal } from "./_generated/api"; import { setupTest, makeParticipant, seedParticipants } from "./testUtils";`
- **GOTCHA**: The `register` mutation takes raw args (not the full schema object) — it adds `status`, `onPause`, `totalPoints`, `registrationDate`, `inChannel`, `periodsPaid` internally. So test args should NOT include these fields.
- **VALIDATE**: `npx vitest run convex/participants.test.ts`

### Task 5: CREATE `convex/groups.test.ts`

- **IMPLEMENT**: Tests for all group functions. Cover:
  1. `create` (internal) — creates group with "Active" status
  2. `list` — returns groups, filters by status
  3. `getForParticipant` — returns groups containing a specific participant with enriched member data
  4. `getActiveForParticipant` — returns active group or null
  5. `getParticipantsInActiveGroups` (internal) — returns flat array of participant IDs from active groups
  6. `getHistoryLastWeeks` (internal) — returns groups created within N weeks
  7. `updateStatus` (internal) — patches group status
  8. `closeActiveGroups` (internal) — sets all active groups to "Completed", returns count
- **PATTERN**: Seed participants first using `seedParticipants()`, then create groups via `internal.groups.create`
- **IMPORTS**: Same as Task 4 plus `import schema from "./schema";`
- **GOTCHA**: Groups store `participant1`, `participant2` as required IDs and `participant3`, `participant4` as optional. The `getForParticipant` and `getActiveForParticipant` functions first look up the participant by telegramId, then filter groups — so participant must exist in DB.
- **VALIDATE**: `npx vitest run convex/groups.test.ts`

### Task 6: CREATE `convex/support.test.ts`

- **IMPLEMENT**: Tests for support ticket functions. Cover:
  1. `createTicket` — creates ticket with "Open" status, links to participant if exists
  2. `createTicket` — throws on empty question
  3. `getMyTickets` — returns tickets for a telegramId
  4. `list` — returns all tickets, filters by status, enriches with participant name
  5. `answerTicket` — sets answer and status to "Answered"
  6. `answerTicket` — throws on non-existent ticket
  7. `answerTicket` — throws on empty answer
  8. `closeTicket` — sets status to "Closed"
  9. `closeTicket` — throws on non-existent ticket
- **PATTERN**: Same as above
- **GOTCHA**: `createTicket` works even without a registered participant (links `participantId` only if found). The `getMyTickets` function filters by BOTH telegramId match and participantId match.
- **VALIDATE**: `npx vitest run convex/support.test.ts`

### Task 7: CREATE `convex/feedback.test.ts`

- **IMPLEMENT**: Tests for feedback functions. Cover:
  1. `submitFeedback` — creates feedback record, awards 10 points to participant
  2. `submitFeedback` — throws if participant not found
  3. `submitFeedback` — throws if group not found
  4. `submitFeedback` — throws if participant was not in the group
  5. `submitFeedback` — throws if feedback already submitted for this group
  6. `submitFeedback` — throws if rating not between 1 and 5
  7. `getForParticipant` — returns feedback submitted by participant
  8. `getPendingFeedback` — returns completed groups without feedback
  9. `getForGroup` — returns all feedback for a group with participant names
- **PATTERN**: Requires seeding participants + creating a group + completing it before feedback can be submitted
- **GOTCHA**: The `submitFeedback` validates rating is 1-5 (not 1-10 as PRD says — code says `if (args.rating < 1 || args.rating > 5)`). The `getPendingFeedback` only returns groups with status "Completed". Points are added directly via `ctx.db.patch` (not through `internal.participants.addPoints`).
- **VALIDATE**: `npx vitest run convex/feedback.test.ts`

### Task 8: CREATE `convex/payments.test.ts`

- **IMPLEMENT**: Tests for payment functions (internal mutations — skip the action that calls PayPlus API). Cover:
  1. `logPaymentAttempt` (internal) — creates payment log with "Pending" status
  2. `processSuccessfulPayment` (internal) — updates recent pending log to "Success", calculates new paidUntil date, activates participant
  3. `processSuccessfulPayment` — creates new log if no pending log exists
  4. `processSuccessfulPayment` — extends from current paidUntil if still in the future
  5. `processFailedPayment` (internal) — updates recent pending log to "Failed"
  6. `getPaymentHistory` — returns payments for a participant ordered desc
  7. `getParticipantByTelegramId` (internal) — returns {_id, name, phone} or null
- **PATTERN**: Seed participant, then call internal payment mutations
- **GOTCHA**: The `processSuccessfulPayment` calculates `paidUntil` as: `baseDate + months * 30 * 24 * 60 * 60 * 1000` where baseDate is the later of current paidUntil or now. This means if paidUntil is in the future, it extends from there. Use fixed timestamps (not `Date.now()`) in tests to ensure deterministic assertions.
- **VALIDATE**: `npx vitest run convex/payments.test.ts`

### Task 9: CREATE `convex/matching.test.ts`

- **IMPLEMENT**: **MOST CRITICAL TEST FILE**. Tests for the 5-stage matching algorithm. Cover:
  1. **Not enough participants** — returns success=false with <2 participants
  2. **All in active groups** — returns success=true with 0 groups when all participants are busy
  3. **Stage A (strict)** — same region, ±10 years age, no repeats. Verify participants in same region and close age get matched
  4. **Stage A respects history** — participants who met within 4 weeks are NOT matched in Stage A
  5. **Stage B (expanded age)** — ±15 years tolerance. Verify wider age range matches
  6. **Stage C (allow repeats)** — previously-met participants CAN be matched
  7. **Stage D (neighboring regions)** — North+Center and Center+South can match, but NOT North+South
  8. **Stage E (force majeure)** — everyone gets a group, North+South still forbidden
  9. **Group sizes** — groups are 2-4 participants, never 1
  10. **Single remaining participant** — gets added to an existing group if possible
  11. **Full pipeline test** — 10+ participants across regions, verify all get matched
  12. **Deterministic region separation** — Center participants in Stage E go with North first, then South gets remaining Center
- **PATTERN**: The `runWeeklyMatching` is an `internalAction` that calls `internal.participants.getActiveForMatching`, `internal.groups.getParticipantsInActiveGroups`, `internal.groups.getHistoryLastWeeks`, and `internal.groups.create`. All these are real Convex functions that will run against the test DB.
- **IMPORTS**: `import { expect, test, describe } from "vitest"; import { internal } from "./_generated/api"; import { setupTest, makeParticipant, seedParticipants } from "./testUtils";`
- **GOTCHA**: The matching algorithm uses `Math.random()` for group size selection, making exact group composition non-deterministic. Tests should assert on PROPERTIES (all participants matched, group sizes 2-4, no North+South in same group) rather than exact group compositions. Seed data with enough participants per region to ensure predictable stage activation.
- **GOTCHA**: `runWeeklyMatching` is an `internalAction`, call it via `t.action(internal.matching.runWeeklyMatching, {})`.
- **VALIDATE**: `npx vitest run convex/matching.test.ts`

### Task 10: CREATE `convex/http.test.ts`

- **IMPLEMENT**: Tests for HTTP webhook handlers. Cover:
  1. **Health check** — GET `/health` returns 200 with status "ok"
  2. **PayPlus callback success** — POST `/payplus-callback` with status_code "000" processes payment
  3. **PayPlus callback failure** — POST `/payplus-callback` with other status codes processes failure
  4. **PayPlus callback missing participantId** — returns 400
  5. **PayPlus callback malformed body** — returns 500
  6. **Telegram webhook callback query** — handles menu button presses
  7. **Telegram webhook /start command** — handles start command
  8. **Telegram webhook empty** — returns 200 ok
- **PATTERN**: Use `t.fetch()` method from convex-test
- **DETAILS**:
  ```typescript
  const t = setupTest();
  const response = await t.fetch("/health", { method: "GET" });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("ok");
  ```
- **GOTCHA**: The PayPlus callback handler reads `body.transaction.status_code`, `body.transaction.uid`, `body.more_info`, `body.transaction.amount`. The `more_info` field is cast as `Id<"participants">` — in tests, seed a participant and use its actual ID. The handler calls `internal.payments.processSuccessfulPayment` or `processFailedPayment` which are real mutations running against the test DB.
- **VALIDATE**: `npx vitest run convex/http.test.ts`

### Task 11: CREATE `convex/crons.test.ts`

- **IMPLEMENT**: Tests for cron handler functions. Cover:
  1. `closeWeekAndRequestFeedback` — closes all active groups, returns null
  2. `getParticipantsForPaymentReminders` — categorizes participants by reminder type (three_days, one_day, expired, grace_expired)
  3. `sendPaymentReminders` — deactivates participants past grace period
- **PATTERN**: `closeWeekAndRequestFeedback` is an `internalAction` that calls `internal.groups.closeActiveGroups`. Seed active groups first.
- **GOTCHA**: `sendPaymentReminders` calls `internal.crons.getParticipantsForPaymentReminders` (internal query) and `internal.participants.updateStatus` (internal mutation). The query function `getParticipantsForPaymentReminders` takes 4 timestamp args. Use fixed timestamps to test each reminder category.
- **GOTCHA**: `cleanupOldData` is a TODO stub — only test that it doesn't throw.
- **VALIDATE**: `npx vitest run convex/crons.test.ts`

### Task 12: RUN full test suite and fix any issues

- **IMPLEMENT**: Run the entire test suite. Fix any failing tests. Ensure all tests pass.
- **VALIDATE**: `npx vitest run` — all tests pass with 0 failures

### Task 13: UPDATE `CLAUDE.md` with test commands

- **IMPLEMENT**: Add test commands to the Commands section of CLAUDE.md
- **DETAILS**: Add:
  ```
  # Test
  npm test             # Run tests in watch mode
  npm run test:once    # Run tests once
  npm run test:coverage # Run tests with coverage report
  ```
- **GOTCHA**: Do not remove or modify existing content in CLAUDE.md. Only add the test section.
- **VALIDATE**: Read CLAUDE.md to verify formatting

---

## TESTING STRATEGY

### Unit Tests

Each Convex module gets a colocated `.test.ts` file. Tests use `convex-test` to run functions against an in-memory database that resets between tests.

**Test isolation**: Each `test()` block creates a fresh `convexTest(schema)` instance, ensuring complete database isolation between tests.

**Data seeding**: Use `t.run()` with `ctx.db.insert()` to pre-populate the database with test data. Use factory functions from `testUtils.ts` for consistency.

**Internal functions**: Test internal functions (internalQuery, internalMutation, internalAction) directly via `internal.*` imports — `convex-test` allows calling both public and internal functions.

### Integration Tests

The matching algorithm test (`matching.test.ts`) serves as the primary integration test — it exercises the full pipeline from participant querying through group creation, spanning multiple modules.

HTTP endpoint tests (`http.test.ts`) are integration tests that exercise webhook → mutation → database update flows.

### Edge Cases

**Matching Algorithm:**
- 0 participants (not enough)
- 1 participant (not enough)
- 2 participants, same region (simplest match)
- All participants in one region
- Participants spread across 3 regions
- All participants have met within 4 weeks (forces Stage C+)
- North and South only (forces Stage D+E, verifies forbidden pairing)
- Single remaining participant after grouping
- Odd number of participants

**Participants:**
- Duplicate Telegram ID registration
- Update with no changed fields
- Toggle pause twice (back to original)
- Deactivate already inactive participant

**Feedback:**
- Rating exactly 1 and exactly 5 (boundary)
- Rating 0 and 6 (out of bounds)
- Feedback for non-existent group
- Feedback from non-group-member

**Payments:**
- Successful payment when paidUntil is in the past (resets from now)
- Successful payment when paidUntil is in the future (extends)
- Multiple payment logs for same participant

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
```

### Level 2: Unit Tests

```bash
npx vitest run
```

### Level 3: Full Coverage Report

```bash
npx vitest run --coverage --coverage.reporter=text
```

### Level 4: Individual Module Tests

```bash
npx vitest run convex/participants.test.ts
npx vitest run convex/matching.test.ts
npx vitest run convex/http.test.ts
```

### Level 5: Convex Backend Validation

```bash
npx convex dev --once
```
(Ensures all Convex functions still compile and deploy correctly after adding test files)

---

## ACCEPTANCE CRITERIA

- [ ] `npm install` succeeds with new devDependencies
- [ ] `npx vitest run` passes with 0 failures
- [ ] All 8 backend modules have test files with meaningful coverage
- [ ] Matching algorithm has 10+ test cases covering all 5 stages
- [ ] HTTP webhooks have tests for success, failure, and error paths
- [ ] Feedback submission validates group membership and prevents duplicates
- [ ] Payment processing correctly calculates subscription extension dates
- [ ] Participant lifecycle (Lead → Active → Inactive, pause/resume) is tested
- [ ] No regressions in existing `npx tsc --noEmit`
- [ ] No regressions in `npx convex dev --once` (Convex compilation)
- [ ] CLAUDE.md updated with test commands
- [ ] Test utilities provide reusable factories for test data

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1-13)
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (`npx vitest run`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Convex backend still compiles (`npx convex dev --once`)
- [ ] CLAUDE.md updated with test commands
- [ ] Test count: ~60+ individual test cases across 8 test files

---

## NOTES

### Design Decisions

1. **Colocated test files**: Tests live in `convex/` alongside source files (e.g., `convex/participants.test.ts`) rather than a separate `__tests__/` directory. This follows modern conventions and makes it easy to find tests for each module.

2. **Single vitest config at root**: Since the only tests right now are for Convex functions, we use one `vitest.config.mts` at root. If frontend component tests are added later, this can be extended with `environmentMatchGlobs` to use `jsdom` for `apps/**` and `edge-runtime` for `convex/**`.

3. **No notifications.test.ts**: The notifications module consists entirely of `internalAction` functions that call `fetch()` to the Telegram Bot API. Testing them requires mocking `fetch` and `process.env` — these would essentially test that "fetch was called with the right URL." While this could be added, the value is low compared to testing business logic. The notification functions are indirectly tested through the crons and HTTP tests. If a separate notifications test file is desired, it can be added later.

4. **Factory approach over fixtures**: Using `makeParticipant()` with overrides is more flexible than JSON fixtures. Each test can create exactly the data it needs while inheriting sensible defaults.

5. **Matching non-determinism**: The matching algorithm uses `Math.random()` for group size selection. Rather than mocking `Math.random()`, tests assert on invariants (all matched, sizes 2-4, no forbidden region pairs). This tests the algorithm's guarantees rather than its specific choices.

### Known Limitation: convex-test vs Production

Per the `convex-test` docs, the mock has differences from production:
- No enforcement of size/time limits
- No cron job scheduling (we test cron _handlers_ directly, not the cron scheduling itself)
- Error messages may differ from real backend
- ID format is not representative

These limitations are acceptable for unit testing. Production integration testing should use the Convex dashboard or a staging deployment.

### Pivot: Rating Range

The PRD says feedback rating is 1-10, but the code validates 1-5. Tests should match the CODE (1-5), not the PRD. This discrepancy should be noted for future resolution.
