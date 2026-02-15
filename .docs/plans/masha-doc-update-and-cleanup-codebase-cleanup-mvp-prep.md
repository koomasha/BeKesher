# Feature: Codebase Cleanup for MVP User Testing

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Comprehensive codebase cleanup to remove dead code, code duplications, development leftovers, and improve code quality before the BeKesher MVP enters user testing. This refactoring ensures a maintainable, professional codebase with reduced bundle sizes, better performance, and cleaner code for future development.

## User Story

As a **developer maintaining the BeKesher platform**
I want to **clean up technical debt accumulated during rapid MVP development**
So that **the codebase is production-ready, maintainable, and optimized for user testing and future feature development**

## Problem Statement

The BeKesher MVP has been developed rapidly and contains significant technical debt:
- **Code Duplication**: The `calculateAge()` function is duplicated in 4 locations; i18n configuration, `useLanguage` hook, and `LanguageSwitcher` component are duplicated between user and admin apps
- **Debug Code**: 20+ console.log statements scattered across backend and frontend
- **Incomplete Work**: 12+ TODO comments indicating unfinished features or type improvements
- **Type Safety**: Multiple uses of `any` type and `@ts-ignore` comments in tests
- **Unused Code**: Test setup mutations (`testSetup.ts`) that may not be used in the test suite

These issues increase bundle size, reduce code maintainability, and create potential bugs.

## Solution Statement

Systematically refactor the codebase by:
1. **Consolidating duplicated code** into shared utilities and components
2. **Removing debug logging** or replacing with proper error handling
3. **Addressing TODO comments** by implementing fixes or documenting as future work
4. **Improving type safety** by replacing `any` types with proper TypeScript types
5. **Removing unused code** that serves no purpose in production or testing
6. **Ensuring zero regressions** through comprehensive test validation after each change

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium-High
**Primary Systems Affected**:
- Convex backend (`convex/`)
- User Telegram Mini App (`apps/user/`)
- Admin Dashboard (`apps/admin/`)

**Dependencies**:
- TypeScript 5.3+
- Vitest (testing framework)
- ESLint (linting)
- Convex runtime

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

#### Duplicated Code to Consolidate

- [`convex/participants.ts`](convex/participants.ts) (lines 12-23) - Why: Contains `calculateAge()` function (instance #1)
- [`convex/matching.ts`](convex/matching.ts) (lines 14-25) - Why: Contains `calculateAge()` function (instance #2)
- [`apps/user/src/pages/ProfilePage.tsx`](apps/user/src/pages/ProfilePage.tsx) (lines 22-33) - Why: Contains `calculateAge()` function (instance #3)
- [`apps/admin/src/pages/ParticipantsPage.tsx`](apps/admin/src/pages/ParticipantsPage.tsx) - Why: Contains `calculateAge()` function (instance #4)

- [`apps/user/src/i18n.ts`](apps/user/src/i18n.ts) (lines 1-27) - Why: i18n configuration duplicated with admin
- [`apps/admin/src/i18n.ts`](apps/admin/src/i18n.ts) (lines 1-27) - Why: Identical i18n configuration

- [`apps/user/src/hooks/useLanguage.ts`](apps/user/src/hooks/useLanguage.ts) (lines 1-29) - Why: Language hook duplicated (uses 'bekesher_locale')
- [`apps/admin/src/hooks/useLanguage.ts`](apps/admin/src/hooks/useLanguage.ts) (lines 1-29) - Why: Nearly identical hook (uses 'bekesher_admin_locale')

- [`apps/user/src/components/LanguageSwitcher.tsx`](apps/user/src/components/LanguageSwitcher.tsx) (lines 1-24) - Why: Duplicated component
- [`apps/admin/src/components/LanguageSwitcher.tsx`](apps/admin/src/components/LanguageSwitcher.tsx) (lines 1-24) - Why: Identical component

#### Files with Console Logging to Clean

**Backend:**
- [`convex/http.ts`](convex/http.ts) (lines 25, 34, 51, 60, 68) - Why: Contains debug console.log/error statements
- [`convex/crons.ts`](convex/crons.ts) (lines 71, 79, 95, 113, 208) - Why: Contains emoji debug logs
- [`convex/participants.ts`](convex/participants.ts) (lines 358, 363) - Why: Contains debug logs
- [`convex/notifications.ts`](convex/notifications.ts) (line 23+) - Why: Contains error logging
- [`convex/payments.ts`](convex/payments.ts) (lines 88, 141, 148) - Why: Contains error logging

**Frontend:**
- [`apps/admin/src/components/LoginPage.tsx`](apps/admin/src/components/LoginPage.tsx) (line 82) - Why: Debug error log
- [`apps/admin/src/pages/MatchingPage.tsx`](apps/admin/src/pages/MatchingPage.tsx) (line 30) - Why: Debug error log
- [`apps/admin/src/pages/SupportPage.tsx`](apps/admin/src/pages/SupportPage.tsx) (lines 28, 37) - Why: Debug error logs
- [`apps/user/src/pages/FeedbackPage.tsx`](apps/user/src/pages/FeedbackPage.tsx) (lines 204, 227) - Why: Debug error logs
- [`apps/user/src/pages/OnboardingPage.tsx`](apps/user/src/pages/OnboardingPage.tsx) (lines 193, 225, 228) - Why: Debug logs
- [`apps/user/src/pages/SupportPage.tsx`](apps/user/src/pages/SupportPage.tsx) (line 47) - Why: Debug error log

#### Files with TODO Comments

- [`convex/authUser.ts`](convex/authUser.ts) (line 198) - Why: TODO to replace `any` type
- [`convex/crons.ts`](convex/crons.ts) (lines 81, 115, 210) - Why: TODOs for notifications and cleanup
- [`convex/notifications.ts`](convex/notifications.ts) (lines 66, 97, 131, 136) - Why: TODOs for locale parameter
- [`convex/payments.ts`](convex/payments.ts) (lines 70, 125) - Why: TODOs for type improvements
- [`convex/support.ts`](convex/support.ts) (line 167) - Why: TODO for Telegram notification
- [`convex/feedback.test.ts`](convex/feedback.test.ts) (line 451) - Why: TODO for return type validator
- [`convex/groups.test.ts`](convex/groups.test.ts) (line 202) - Why: TODO for return type validator
- [`convex/participants.test.ts`](convex/participants.test.ts) (line 212) - Why: TODO for return type validator
- [`convex/support.test.ts`](convex/support.test.ts) (line 154) - Why: TODO for return type validator

#### Files with Type Safety Issues

- [`convex/authUser.ts`](convex/authUser.ts) (line 199) - Why: Uses `any` type for userAction
- [`convex/payments.ts`](convex/payments.ts) (lines 71, 126) - Why: Uses `any` for ctx, args, and response data
- [`convex/feedback.test.ts`](convex/feedback.test.ts) (line 452) - Why: @ts-ignore comment
- [`convex/groups.test.ts`](convex/groups.test.ts) (line 203) - Why: @ts-ignore comment
- [`convex/support.test.ts`](convex/support.test.ts) (line 155) - Why: @ts-ignore comment

#### Unused Code Files

- [`convex/testSetup.ts`](convex/testSetup.ts) - Why: Test utilities that may not be used (need verification)

#### Test Utilities Reference

- [`convex/test.utils.ts`](convex/test.utils.ts) - Why: Existing test utilities pattern to follow

### New Files to Create

- `convex/utils.ts` - Shared utility functions for backend (calculateAge)
- `apps/user/src/utils/dateUtils.ts` - Shared date utilities for frontend (calculateAge)
- `apps/admin/src/utils/dateUtils.ts` - Symlink or copy of user dateUtils (or shared package in future)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
  - Specific section: Type Guards and Type Assertions
  - Why: Needed to properly type the `any` types in payments.ts and authUser.ts

- [Convex Validators Documentation](https://docs.convex.dev/database/types#validators)
  - Specific section: Return Value Validators
  - Why: Needed to fix @ts-ignore comments in test files by adding proper return type validators

- [Vitest API Reference](https://vitest.dev/api/)
  - Specific section: Test Suite APIs
  - Why: Ensure tests continue to pass after refactoring

### Patterns to Follow

#### Naming Conventions
- Backend utilities: `convex/utils.ts`, `convex/dateUtils.ts`
- Frontend utilities: `apps/*/src/utils/[domain]Utils.ts` (e.g., `dateUtils.ts`)
- Shared components: Keep in respective app's `components/` for now (no shared package yet)

#### Error Handling Pattern (from existing code)
```typescript
// In mutation/query handlers - throw errors, don't log
if (!participant) {
    throw new Error("Participant not found");
}

// In actions - can log critical errors but always throw
if (!response.ok) {
    const errorText = await response.text();
    console.error("API error:", errorText);
    throw new Error(`API request failed: ${errorText}`);
}
```

#### Console Logging Pattern
- **REMOVE** all debug console.log statements
- **KEEP** critical console.error in actions (external API failures)
- **REPLACE** informational logs with proper error handling or remove entirely

#### Utility Function Pattern (from test.utils.ts)
```typescript
/**
 * Clear JSDoc comment explaining purpose
 */
export function utilityName(params: Type): ReturnType {
    // Implementation
}
```

#### Import Organization
```typescript
// 1. External dependencies
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// 2. Local utilities
import { calculateAge } from "./utils";

// 3. Types
import { Id } from "./_generated/dataModel";
```

### Blueprint Alignment (Critical)

- **Data Architecture**: No schema changes required - this is pure code cleanup
- **Logic Workflows**: No workflow changes - refactoring maintains existing behavior
- **Identity Guidelines**: No UI/UX changes - cleanup is internal code quality

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Create Shared Utilities

Set up shared utility files for duplicated functions before removing duplicates.

**Tasks:**
- Create `convex/utils.ts` with `calculateAge()` function
- Create `apps/user/src/utils/dateUtils.ts` with `calculateAge()` function
- Create `apps/admin/src/utils/dateUtils.ts` with `calculateAge()` function (same implementation)

### Phase 2: Core Implementation - Eliminate Duplications

Systematically remove duplicated code across the codebase, replacing with imports from shared utilities.

**Tasks:**
- Remove `calculateAge()` from `convex/participants.ts` and import from `convex/utils.ts`
- Remove `calculateAge()` from `convex/matching.ts` and import from `convex/utils.ts`
- Remove `calculateAge()` from `apps/user/src/pages/ProfilePage.tsx` and import from utils
- Remove `calculateAge()` from `apps/admin/src/pages/ParticipantsPage.tsx` and import from utils
- Document i18n and hook duplication (will address in future refactor - requires shared packages)

### Phase 3: Code Quality - Remove Debug Code

Remove all debug console.log statements and clean up logging.

**Tasks:**
- Clean console logs from backend files (http, crons, participants, notifications, payments)
- Clean console logs from frontend files (all pages and components)
- Keep only critical error logging in actions for external API failures

### Phase 4: Type Safety - Improve TypeScript

Replace `any` types with proper TypeScript types and fix test type issues.

**Tasks:**
- Fix type annotations in `convex/payments.ts`
- Fix type annotation in `convex/authUser.ts`
- Add proper return type validators in test files to remove @ts-ignore comments

### Phase 5: Cleanup - Address TODOs and Unused Code

Review and address TODO comments; remove or document as future work.

**Tasks:**
- Review each TODO comment and either implement the fix or document as GitHub issue
- Verify if `convex/testSetup.ts` exports are actually used; remove if not
- Clean up any remaining development artifacts

### Phase 6: Testing & Validation

Comprehensive testing to ensure zero regressions.

**Tasks:**
- Run full test suite to verify all tests pass
- Run linting on both frontend apps
- Run TypeScript type checking
- Manual smoke test of key user flows

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### PHASE 1: CREATE SHARED UTILITIES

#### Task 1: CREATE convex/utils.ts

- **IMPLEMENT**: Export `calculateAge()` function for backend use
- **PATTERN**: Follow utility pattern from `convex/test.utils.ts` with JSDoc comments
- **IMPORTS**: None (pure utility function)
- **CODE**:
```typescript
/**
 * Calculate age from birth date string.
 * @param birthDate - Date string in format "YYYY-MM-DD"
 * @returns Age in years
 */
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}
```
- **VALIDATE**: `npm run test:once` (ensure no test failures)

#### Task 2: CREATE apps/user/src/utils/dateUtils.ts

- **IMPLEMENT**: Export `calculateAge()` function for user app
- **PATTERN**: Same implementation as convex/utils.ts
- **IMPORTS**: None
- **CODE**: Same as Task 1
- **VALIDATE**: `cd apps/user && npm run build` (ensure TypeScript compiles)

#### Task 3: CREATE apps/admin/src/utils/dateUtils.ts

- **IMPLEMENT**: Export `calculateAge()` function for admin app
- **PATTERN**: Same implementation as convex/utils.ts
- **IMPORTS**: None
- **CODE**: Same as Task 1
- **VALIDATE**: `cd apps/admin && npm run build` (ensure TypeScript compiles)

---

### PHASE 2: ELIMINATE CODE DUPLICATION

#### Task 4: UPDATE convex/participants.ts

- **IMPLEMENT**: Remove `calculateAge()` definition (lines 12-23), add import from `./utils`
- **PATTERN**: Import at top of file after other imports
- **IMPORTS**: `import { calculateAge } from "./utils";`
- **GOTCHA**: Ensure all references to `calculateAge` still work (used in `getAge` query)
- **VALIDATE**: `npm run test:once` + manually verify `getAge` query works

#### Task 5: UPDATE convex/matching.ts

- **IMPLEMENT**: Remove `calculateAge()` definition (lines 14-25), add import from `./utils`
- **PATTERN**: Import at top of file after other imports
- **IMPORTS**: `import { calculateAge } from "./utils";`
- **GOTCHA**: Ensure matching algorithm still uses `calculateAge` correctly
- **VALIDATE**: `npm run test:once` (matching.test.ts should pass)

#### Task 6: UPDATE apps/user/src/pages/ProfilePage.tsx

- **IMPLEMENT**: Remove `calculateAge()` definition (lines 22-33), add import
- **PATTERN**: Import from `../utils/dateUtils`
- **IMPORTS**: `import { calculateAge } from '../utils/dateUtils';`
- **GOTCHA**: Ensure age display still works in profile UI
- **VALIDATE**: `cd apps/user && npm run build && npm run lint`

#### Task 7: UPDATE apps/admin/src/pages/ParticipantsPage.tsx

- **IMPLEMENT**: Remove `calculateAge()` definition, add import
- **PATTERN**: Import from `../utils/dateUtils`
- **IMPORTS**: `import { calculateAge } from '../utils/dateUtils';`
- **GOTCHA**: Ensure participant age column still displays correctly
- **VALIDATE**: `cd apps/admin && npm run build && npm run lint`

---

### PHASE 3: REMOVE DEBUG CODE

#### Task 8: CLEAN convex/http.ts

- **REMOVE**: Console.log/error statements at lines 25, 34, 51, 60, 68
- **PATTERN**: Keep error throwing, remove logging
- **GOTCHA**: These are in HTTP endpoints - errors should be thrown, not logged
- **VALIDATE**: `npm run test:once` (http.test.ts should pass)

#### Task 9: CLEAN convex/crons.ts

- **REMOVE**: All console.log statements (lines 71, 79, 95, 113, 208)
- **PATTERN**: Remove emoji logs, keep error throwing
- **GOTCHA**: Cron jobs are scheduled - ensure error handling remains robust
- **VALIDATE**: `npm run test:once` (crons.test.ts should pass)

#### Task 10: CLEAN convex/participants.ts

- **REMOVE**: Console.log statements at lines 358, 363
- **PATTERN**: Remove debug logging
- **VALIDATE**: `npm run test:once` (participants.test.ts should pass)

#### Task 11: CLEAN convex/notifications.ts

- **REMOVE**: Console.error statements except for critical API failures
- **PATTERN**: Keep error in catch blocks for external Telegram API calls
- **GOTCHA**: External API errors should be logged for debugging
- **VALIDATE**: `npm run test:once`

#### Task 12: CLEAN convex/payments.ts

- **REMOVE**: Console.error statements except for critical PayPlus API failures
- **PATTERN**: Keep error in catch blocks for external PayPlus API calls
- **GOTCHA**: External API errors should be logged for debugging
- **VALIDATE**: `npm run test:once` (payments.test.ts should pass)

#### Task 13: CLEAN apps/admin/src/components/LoginPage.tsx

- **REMOVE**: Console.error at line 82
- **PATTERN**: Error is already shown in UI via alert/toast
- **VALIDATE**: `cd apps/admin && npm run lint`

#### Task 14: CLEAN apps/admin/src/pages/MatchingPage.tsx

- **REMOVE**: Console.error at line 30
- **PATTERN**: Error handling via try-catch is sufficient
- **VALIDATE**: `cd apps/admin && npm run lint`

#### Task 15: CLEAN apps/admin/src/pages/SupportPage.tsx

- **REMOVE**: Console.error at lines 28, 37
- **PATTERN**: Error handling is already in place
- **VALIDATE**: `cd apps/admin && npm run lint`

#### Task 16: CLEAN apps/user/src/pages/FeedbackPage.tsx

- **REMOVE**: Console.error at lines 204, 227
- **PATTERN**: Error handling via UI feedback is sufficient
- **VALIDATE**: `cd apps/user && npm run lint`

#### Task 17: CLEAN apps/user/src/pages/OnboardingPage.tsx

- **REMOVE**: Console.log/error at lines 193, 225, 228
- **PATTERN**: Success/error feedback already in UI
- **VALIDATE**: `cd apps/user && npm run lint`

#### Task 18: CLEAN apps/user/src/pages/SupportPage.tsx

- **REMOVE**: Console.error at line 47
- **PATTERN**: Error handling already in place
- **VALIDATE**: `cd apps/user && npm run lint`

---

### PHASE 4: IMPROVE TYPE SAFETY

#### Task 19: FIX convex/payments.ts type annotations

- **IMPLEMENT**: Replace `any` types with proper TypeScript types
- **PATTERN**: Use Convex action context type and PayPlus API response types
- **CHANGES**:
  - Line 71: Define proper handler signature using Convex types
  - Line 126: Define `PayPlusResponse` interface for API response
- **GOTCHA**: This addresses TODO comments at lines 70 and 125
- **VALIDATE**: `npm run test:once` + TypeScript compilation with `npx tsc --noEmit`

#### Task 20: FIX convex/authUser.ts type annotation

- **IMPLEMENT**: Replace `any` type for `userAction` export
- **PATTERN**: Use proper Convex customAction return type
- **CHANGES**: Line 199: Add proper type annotation from customAction
- **GOTCHA**: This addresses TODO comment at line 198
- **VALIDATE**: `npx tsc --noEmit` (TypeScript should compile without errors)

#### Task 21: FIX convex/feedback.test.ts @ts-ignore

- **IMPLEMENT**: Add `participantName` to return type validator for `getForGroup`
- **PATTERN**: Follow existing validator patterns in feedback.ts
- **CHANGES**: Update validator in feedback.ts to include participantName field
- **GOTCHA**: This addresses TODO at line 451
- **VALIDATE**: `npm run test:once` (feedback.test.ts should pass without @ts-ignore)

#### Task 22: FIX convex/groups.test.ts @ts-ignore

- **IMPLEMENT**: Add `name` to members return type in `getActiveForParticipant`
- **PATTERN**: Follow existing validator patterns in groups.ts
- **CHANGES**: Update validator in groups.ts to include name field
- **GOTCHA**: This addresses TODO at line 202
- **VALIDATE**: `npm run test:once` (groups.test.ts should pass without @ts-ignore)

#### Task 23: FIX convex/participants.test.ts @ts-ignore

- **IMPLEMENT**: Add `status` to return type validator for `list`
- **PATTERN**: Follow existing validator patterns in participants.ts
- **CHANGES**: Update validator in participants.ts to include status field
- **GOTCHA**: This addresses TODO at line 212
- **VALIDATE**: `npm run test:once` (participants.test.ts should pass without @ts-ignore)

#### Task 24: FIX convex/support.test.ts @ts-ignore

- **IMPLEMENT**: Add `participantName`/`telegramId` to return type validator for `list`
- **PATTERN**: Follow existing validator patterns in support.ts
- **CHANGES**: Update validator in support.ts to include these fields
- **GOTCHA**: This addresses TODO at line 154
- **VALIDATE**: `npm run test:once` (support.test.ts should pass without @ts-ignore)

---

### PHASE 5: ADDRESS TODOS AND UNUSED CODE

#### Task 25: REVIEW AND DOCUMENT remaining TODOs

- **IMPLEMENT**: Review remaining TODOs in crons.ts, notifications.ts, support.ts
- **PATTERN**: Either implement the TODO or create GitHub issue for future work
- **TODOS TO ADDRESS**:
  - `convex/crons.ts:81` - Feedback request notifications
  - `convex/crons.ts:115` - Matching notifications
  - `convex/crons.ts:210` - Cleanup logic
  - `convex/notifications.ts:66,97,131,136` - Locale parameter
  - `convex/support.ts:167` - Telegram notification on ticket answer
- **DECISION**: Document these as GitHub issues for post-MVP implementation
- **VALIDATE**: Ensure all TODOs are either resolved or documented in issue tracker

#### Task 26: VERIFY convex/testSetup.ts usage

- **IMPLEMENT**: Search codebase for imports of testSetup functions
- **PATTERN**: Use Grep to find `import.*testSetup`
- **DECISION**: If not used anywhere, remove the file entirely
- **VALIDATE**: `npm run test:once` (ensure no test failures after removal)

---

### PHASE 6: FINAL VALIDATION

#### Task 27: RUN full test suite

- **VALIDATE**: `npm run test:once` (all tests must pass)

#### Task 28: RUN linting on user app

- **VALIDATE**: `cd apps/user && npm run lint` (0 warnings, 0 errors)

#### Task 29: RUN linting on admin app

- **VALIDATE**: `cd apps/admin && npm run lint` (0 warnings, 0 errors)

#### Task 30: RUN TypeScript type checking

- **VALIDATE**: `npx tsc --noEmit` (no type errors)

#### Task 31: BUILD both frontend apps

- **VALIDATE**: `cd apps/user && npm run build && cd ../admin && npm run build`

#### Task 32: MANUAL smoke test

- **IMPLEMENT**: Test key user flows manually
- **FLOWS TO TEST**:
  - User registration/onboarding
  - Profile viewing (verify age calculation works)
  - Admin login and participant list (verify age column)
  - Feedback submission
  - Support ticket creation
- **VALIDATE**: All features work as before cleanup

---

## TESTING STRATEGY

### Unit Tests

**Framework**: Vitest with convex-test

**Scope**: All backend functions (participants, groups, matching, feedback, support, payments, http, crons)

**Approach**: Run existing test suite after each cleanup phase to ensure zero regressions

**Coverage Requirement**: Maintain existing coverage (should not decrease)

### Integration Tests

**Scope**: HTTP webhooks (PayPlus, Telegram), cron jobs, matching algorithm

**Approach**: Existing integration tests in `convex/*.test.ts` files must all pass

### Edge Cases

**calculateAge() consolidation**:
- Verify age calculation for participants born on leap years
- Verify age calculation for participants with birthdays today
- Verify age calculation works across timezone boundaries

**Type safety improvements**:
- Ensure PayPlus API responses are properly typed (success and error cases)
- Ensure return type validators include all fields used in tests

**Console logging removal**:
- Verify critical errors in external API calls (Telegram, PayPlus) are still visible for debugging
- Ensure internal logic errors are thrown, not logged

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

**User App Linting**:
```bash
cd apps/user && npm run lint
```
Expected: 0 errors, 0 warnings

**Admin App Linting**:
```bash
cd apps/admin && npm run lint
```
Expected: 0 errors, 0 warnings

**TypeScript Compilation**:
```bash
npx tsc --noEmit
```
Expected: 0 type errors

### Level 2: Unit Tests

**Run all backend tests**:
```bash
npm run test:once
```
Expected: All tests pass (participants, groups, matching, feedback, support, payments, http, crons)

**Run with coverage**:
```bash
npm run test:coverage
```
Expected: Coverage should not decrease from baseline

### Level 3: Build Validation

**User App Build**:
```bash
cd apps/user && npm run build
```
Expected: Build succeeds with no errors

**Admin App Build**:
```bash
cd apps/admin && npm run build
```
Expected: Build succeeds with no errors

### Level 4: Manual Validation

**Start development servers**:
```bash
npm run dev:user    # Terminal 1
npm run dev:admin   # Terminal 2
npm run convex      # Terminal 3
```

**Test User App Flows**:
1. Open user app at http://localhost:5173
2. Register a new participant (verify onboarding works)
3. View profile page (verify age displays correctly)
4. Submit feedback for a completed group
5. Create a support ticket

**Test Admin App Flows**:
1. Open admin app at http://localhost:5174
2. Login with Google authentication
3. View participants page (verify age column displays correctly)
4. Run manual matching
5. View and answer a support ticket

**Expected**: All flows work identically to pre-cleanup behavior

### Level 5: Additional Validation

**Check for remaining debug code**:
```bash
# Search for console.log in backend (should find only critical error logs)
grep -r "console.log" convex/ --include="*.ts" --exclude="*.test.ts"

# Search for console.log in frontend (should find none)
grep -r "console.log" apps/user/src/ --include="*.tsx" --include="*.ts"
grep -r "console.log" apps/admin/src/ --include="*.tsx" --include="*.ts"
```
Expected: Only console.error in external API error handlers (notifications.ts, payments.ts)

**Check for remaining TODOs**:
```bash
grep -r "TODO" convex/ apps/ --include="*.ts" --include="*.tsx"
```
Expected: Only documented TODOs that are tracked in GitHub issues

**Check for remaining @ts-ignore**:
```bash
grep -r "@ts-ignore" convex/ --include="*.ts"
```
Expected: Zero occurrences

**Check for remaining `any` types**:
```bash
grep -r ": any" convex/ --include="*.ts" --exclude="*.test.ts"
```
Expected: Zero occurrences (or only in unavoidable external library interfaces)

---

## ACCEPTANCE CRITERIA

- [x] **Code Duplication Eliminated**
  - [x] `calculateAge()` function consolidated to 3 shared utility files
  - [x] All 4 instances replaced with imports from shared utilities
  - [x] i18n/hook/component duplication documented for future refactor

- [x] **Debug Code Removed**
  - [x] All console.log statements removed from backend and frontend
  - [x] Only critical console.error kept in external API error handlers
  - [x] No debug logs in user-facing code

- [x] **Type Safety Improved**
  - [x] `any` types in payments.ts replaced with proper types
  - [x] `any` type in authUser.ts replaced with proper type
  - [x] All @ts-ignore comments in tests removed
  - [x] Return type validators updated to include all fields

- [x] **TODOs Addressed**
  - [x] Type-related TODOs implemented (payments, authUser, test validators)
  - [x] Feature TODOs documented as GitHub issues for post-MVP work

- [x] **Unused Code Removed**
  - [x] testSetup.ts verified and removed if unused

- [x] **Zero Regressions**
  - [x] All unit tests pass (100% pass rate)
  - [x] All integration tests pass
  - [x] No linting errors in user app
  - [x] No linting errors in admin app
  - [x] No TypeScript type errors
  - [x] Both frontend apps build successfully
  - [x] Manual testing confirms all features work identically

- [x] **Code Quality Metrics**
  - [x] Test coverage maintained or improved
  - [x] Bundle sizes reduced (due to removed dead code)
  - [x] TypeScript strict mode compliance improved

---

## COMPLETION CHECKLIST

- [ ] All 32 tasks completed in order
- [ ] Each task validation passed immediately after implementation
- [ ] All validation commands executed successfully:
  - [ ] User app linting (0 warnings, 0 errors)
  - [ ] Admin app linting (0 warnings, 0 errors)
  - [ ] TypeScript compilation (0 type errors)
  - [ ] Full test suite passes (100% pass rate)
  - [ ] User app builds successfully
  - [ ] Admin app builds successfully
- [ ] Manual testing confirms feature parity:
  - [ ] User onboarding works
  - [ ] Profile age display works
  - [ ] Admin participant age column works
  - [ ] Feedback submission works
  - [ ] Support tickets work
  - [ ] Matching algorithm works
- [ ] Code quality checks pass:
  - [ ] No console.log in production code
  - [ ] No TODO comments (except documented ones)
  - [ ] No @ts-ignore comments
  - [ ] No `any` types (except unavoidable)
- [ ] Acceptance criteria all met
- [ ] Code reviewed for maintainability

---

## NOTES

### Decision: i18n and Component Duplication

The following duplications are **documented but not addressed** in this cleanup:
- `apps/user/src/i18n.ts` and `apps/admin/src/i18n.ts`
- `apps/user/src/hooks/useLanguage.ts` and `apps/admin/src/hooks/useLanguage.ts`
- `apps/user/src/components/LanguageSwitcher.tsx` and `apps/admin/src/components/LanguageSwitcher.tsx`

**Rationale**: These require creating a shared package in the npm workspace (e.g., `packages/shared`), which is a larger architectural change better suited for post-MVP. For now, we document this technical debt for future refactoring.

**Future Work**: Create GitHub issue "Consolidate shared i18n and component code into shared package"

### Decision: Console Logging in External API Calls

Console.error statements are **kept** in the following locations:
- `convex/notifications.ts` - Telegram API errors
- `convex/payments.ts` - PayPlus API errors

**Rationale**: These are external API calls where logging errors is critical for debugging production issues. These logs provide visibility into third-party service failures that may not be caught by the application's own error handling.

### Decision: TODO Comments for Feature Work

The following TODOs are **documented as future work** and not implemented in this cleanup:
- Weekly feedback request notifications (crons.ts:81)
- Matching completion notifications (crons.ts:115)
- Weekly cleanup logic (crons.ts:210)
- Locale parameter for notifications (notifications.ts multiple locations)
- Support ticket answer notification (support.ts:167)

**Rationale**: These are new features or enhancements, not cleanup tasks. They should be properly planned and implemented after MVP testing, not rushed during cleanup.

### Decision: testSetup.ts Removal

**Action**: Verify usage and remove if unused

**Verification Method**: Search for `import.*from.*testSetup` across all test files

**Expected Result**: If no imports found, file can be safely deleted as it provides test utilities (`createTestGroup`, `deleteFeedbackForParticipant`) that are not being used

### Type Safety Improvements

The following type improvements are **critical** for this cleanup:
1. **PayPlus API Response Typing**: Define proper interface for PayPlus webhook responses to eliminate `any`
2. **Convex Action Context Typing**: Use proper Convex types for action handlers instead of `any`
3. **Test Return Type Validators**: Add missing fields to validators so tests can verify response shape without `@ts-ignore`

These improvements not only clean up the code but also provide better IDE autocomplete and catch potential bugs at compile-time.

### Performance Considerations

**Bundle Size Reduction**: Removing dead code and unused imports should reduce bundle sizes for both frontend apps

**Runtime Performance**: Consolidating `calculateAge()` has no performance impact (same implementation, just deduplicated)

**Build Time**: Type safety improvements may slightly increase build time but improve long-term maintainability

### Maintenance Benefits

After this cleanup:
- **Easier Debugging**: No debug console.logs cluttering production logs
- **Better Types**: Fewer runtime type errors due to improved TypeScript usage
- **Reduced Duplication**: Shared utilities mean one place to fix bugs
- **Clearer Code**: Removed TODOs and dead code reduce cognitive load
- **Safer Refactoring**: Proper types and tests enable confident future changes
