# Feature: Improve Schema Type Safety with Literal Union Types

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Replace loosely-typed string fields in the Convex schema with strongly-typed literal unions to eliminate runtime type errors, improve developer experience with autocomplete, and prevent invalid data from being stored in the database. Currently, fields like participant status ("Lead", "Active", "Inactive"), group status ("Active", "Completed", "Cancelled"), and other enum-like fields are defined as plain `v.string()`, which provides no compile-time type safety.

## User Story

As a developer working on the Tuk-Tuk codebase
I want strongly-typed schema fields instead of generic strings
So that I can catch type errors at compile time, get better IDE autocomplete, and prevent invalid data from being stored in the database

## Problem Statement

The current schema uses `v.string()` for fields that should only accept specific string literal values. This leads to:
- **Runtime errors**: Invalid status values can be stored in the database (e.g., "active" instead of "Active")
- **Poor developer experience**: No autocomplete when setting status values
- **Maintenance burden**: Status values are scattered throughout the codebase as magic strings
- **Type safety gaps**: TypeScript cannot validate string values against allowed options
- **Documentation gaps**: No single source of truth for what values are valid

Specific fields affected:
- `participants.status`: "Lead" | "Active" | "Inactive"
- `participants.gender`: "Male" | "Female" | "Other"
- `participants.region`: "North" | "Center" | "South"
- `groups.status`: "Active" | "Completed" | "Cancelled"
- `groups.region`: "North" | "Center" | "South"
- `paymentLogs.status`: "Pending" | "Success" | "Failed"
- `paymentLogs.currency`: "ILS"
- `supportTickets.status`: "Open" | "Answered" | "Closed"
- `sessions.source`: "ai" | "cicd" | "dev" | "test"
- `feedback.wouldMeetAgain`: "yes" | "no" | "maybe"

Additionally, these **unused fields will be removed** entirely:
- `participants.targetGender` (dead code - not used by matching algorithm)
- `participants.targetAgeFrom` (dead code - not used by matching algorithm)
- `participants.targetAgeTo` (dead code - not used by matching algorithm)
- `participants.formatPreference` (dead code - not used anywhere)
- `participants.familyStatus` (dead code - set in seed but never used)
- `participants.values` (dead code - profile field never used in business logic)
- `participants.interests` (dead code - profile field never used in business logic)

## Solution Statement

Use Convex's `v.union()` and `v.literal()` validators to define type-safe string literal unions in the schema. Create reusable validator constants in a new `convex/validators.ts` file that can be used across schema definitions and function validators. Additionally, remove unused preference fields (targetGender, targetAgeFrom, targetAgeTo, formatPreference) that are defined but never used by the matching algorithm. This ensures:
- Compile-time type checking via auto-generated TypeScript types
- Single source of truth for allowed values
- Reusable validators across the codebase
- Automatic TypeScript inference in generated `dataModel.d.ts`
- Cleaner schema without dead code

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- Schema definitions (schema.ts)
- All functions using status/enum fields (participants.ts, groups.ts, payments.ts, support.ts)
- Test utilities (test.utils.ts)
- Seed data (seed.ts)
- Test files

**Dependencies**:
- Convex `v.union()` and `v.literal()` validators
- TypeScript type inference from Convex schema

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- [convex/schema.ts](convex/schema.ts) (all lines) - Current schema definitions with loose string types
- [convex/participants.ts](convex/participants.ts) (lines 36, 44, 81, 218, 322, 379, 416, 445) - Uses status field in queries/mutations
- [convex/groups.ts](convex/groups.ts) (lines 54, 131, 203, 311, 343) - Uses status field
- [convex/support.ts](convex/support.ts) (lines 19, 45, 92, 134, 164, 189) - Uses status field
- [convex/payments.ts](convex/payments.ts) (lines 21, 47, 216, 243, 245, 254, 302, 304) - Uses status and currency fields
- [convex/seed.ts](convex/seed.ts) (lines 31-33, 41-43, 56-60, 68-71, 94, 119) - Hardcoded string literals for all enum values
- [convex/test.utils.ts](convex/test.utils.ts) (lines 66, 80, 103, 124, 147, 193, 202) - Factory functions with string defaults
- [convex/participants.test.ts](convex/participants.test.ts) (lines 19, 49, 60, 74, 78, 94) - Test data with string literals
- [convex/http.test.ts](convex/http.test.ts) (lines 44, 87, 113) - Payment status in tests
- [convex/crons.ts](convex/crons.ts) - May use status values for filtering

### New Files to Create

- `convex/validators.ts` - Reusable validator definitions for all enum-like fields

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Schema Documentation](https://docs.convex.dev/database/schemas)
  - Specific section: Using v.literal and v.union for type-safe enums
  - Why: Shows official Convex pattern for defining literal unions
- [TypeScript Union Types Guide by Convex](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-union-types)
  - Specific section: Union type patterns and discriminated unions
  - Why: Best practices for working with union types in Convex
- [TypeScript Best Practices](https://medium.com/@soroushysf/union-types-vs-enums-in-typescript-choosing-the-right-approach-for-your-codebase-dcc7238b3522)
  - Specific section: Why literal unions over enums
  - Why: Explains benefits of literal unions for bundle size and type safety

### Patterns to Follow

**Validator Definition Pattern:**
```typescript
// From Convex docs - define reusable validators
export const statusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed")
);

// Use in schema
participants: defineTable({
  status: statusValidator,
  // ...
})
```

**Naming Convention:**
All validator constants should use `camelCase` with `Validator` suffix (e.g., `participantStatusValidator`, `regionValidator`)

**Import Pattern:**
```typescript
// In schema.ts
import { participantStatusValidator, regionValidator } from "./validators";
```

**Testing Pattern:**
Use the actual literal values from validators in tests. Do NOT create separate test constants.

**Error Handling:**
No special error handling needed - Convex validators automatically reject invalid values at runtime.

### Blueprint Alignment (Critical)

- **Data Architecture**: The schema.ts file IS the data architecture blueprint. This refactor enhances type safety without changing table structure.
- **Logic Workflows**: No workflow changes required - this is purely a type safety improvement.
- **Identity Guidelines**: Not applicable to this refactor.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Create centralized validator definitions file with all enum-like validators before modifying schema. This establishes single source of truth for all literal union types.

**Tasks:**
- Create `convex/validators.ts` with all literal union validators
- Export TypeScript type helpers for use in non-schema code
- Document each validator with comments explaining allowed values and usage

### Phase 2: Core Implementation

Update schema.ts to use the new validators, replacing all `v.string()` fields that should be literal unions.

**Tasks:**
- Import validators into schema.ts
- Replace string fields with typed validators
- Verify schema compiles without errors
- Run `npx convex dev` to regenerate TypeScript types

### Phase 3: Function Validators

Update all Convex function validators (args and returns) to use literal unions instead of plain v.string().

**Tasks:**
- Update participant function validators in participants.ts
- Update group function validators in groups.ts
- Update support function validators in support.ts
- Update payment function validators in payments.ts
- Verify all functions use consistent validators

### Phase 4: Testing & Validation

Update test utilities and test data to use type-safe literal values, then run full test suite.

**Tasks:**
- Update test.utils.ts factory functions with proper types
- Update seed.ts to use validator constants (or literal values)
- Update all test files to use correct literal values
- Run full test suite and fix any type errors
- Verify TypeScript compilation passes

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE convex/validators.ts

- **IMPLEMENT**: Export reusable Convex validators for all enum-like schema fields
- **PATTERN**: Follow Convex pattern of `v.union(v.literal("a"), v.literal("b"))`
- **IMPORTS**: `import { v } from "convex/values";`
- **GOTCHA**: Validators MUST be defined with `as const` or using v.literal to preserve literal types
- **VALIDATE**: `npx tsc --noEmit` (should show no errors in validators.ts)

Define the following validators:
```typescript
// Participant field validators
export const participantStatusValidator = v.union(
  v.literal("Lead"),
  v.literal("Active"),
  v.literal("Inactive")
);

export const genderValidator = v.union(
  v.literal("Male"),
  v.literal("Female"),
  v.literal("Other")
);

export const regionValidator = v.union(
  v.literal("North"),
  v.literal("Center"),
  v.literal("South")
);

// formatPreference, familyStatus, values, interests removed - were never used

// Group field validators
export const groupStatusValidator = v.union(
  v.literal("Active"),
  v.literal("Completed"),
  v.literal("Cancelled")
);

// Payment field validators
export const paymentStatusValidator = v.union(
  v.literal("Pending"),
  v.literal("Success"),
  v.literal("Failed")
);

export const currencyValidator = v.union(
  v.literal("ILS")
);

// Support ticket field validators
export const supportStatusValidator = v.union(
  v.literal("Open"),
  v.literal("Answered"),
  v.literal("Closed")
);

// Session field validators
export const sessionSourceValidator = v.union(
  v.literal("ai"),
  v.literal("cicd"),
  v.literal("dev"),
  v.literal("test")
);

// Feedback field validators
export const wouldMeetAgainValidator = v.union(
  v.literal("yes"),
  v.literal("no"),
  v.literal("maybe")
);
```

Add TypeScript type exports:
```typescript
// TypeScript type helpers (inferred from validators)
import type { Infer } from "convex/values";

export type ParticipantStatus = Infer<typeof participantStatusValidator>;
export type Gender = Infer<typeof genderValidator>;
export type Region = Infer<typeof regionValidator>;
export type GroupStatus = Infer<typeof groupStatusValidator>;
export type PaymentStatus = Infer<typeof paymentStatusValidator>;
export type Currency = Infer<typeof currencyValidator>;
export type SupportStatus = Infer<typeof supportStatusValidator>;
export type SessionSource = Infer<typeof sessionSourceValidator>;
export type WouldMeetAgain = Infer<typeof wouldMeetAgainValidator>;
```

### UPDATE convex/schema.ts

- **IMPLEMENT**: Replace all `v.string()` with appropriate validators from validators.ts
- **PATTERN**: Import validators at top, use in defineTable definitions
- **IMPORTS**: `import { participantStatusValidator, genderValidator, regionValidator, formatPreferenceValidator, groupStatusValidator, paymentStatusValidator, currencyValidator, supportStatusValidator, sessionSourceValidator } from "./validators";`
- **GOTCHA**: Optional fields still need `v.optional()` wrapper: `targetGender: v.optional(genderValidator)`
- **VALIDATE**: `npx tsc --noEmit && npx convex dev --once` (regenerates types)

Replace the following fields in schema.ts:

**participants table:**
- Line 16: `gender: v.string(),` → `gender: genderValidator,`
- Line 17: `region: v.string(),` → `region: regionValidator,`
- Line 36: `status: v.string(),` → `status: participantStatusValidator,`
- **REMOVE** these lines entirely (dead code - lines 19, 22-25, 32-33):
  ```typescript
  familyStatus: v.optional(v.string()),
  targetGender: v.optional(v.string()),
  targetAgeFrom: v.optional(v.number()),
  targetAgeTo: v.optional(v.number()),
  formatPreference: v.optional(v.string()),
  values: v.optional(v.array(v.string())),
  interests: v.optional(v.array(v.string())),
  ```

**groups table:**
- Line 54: `status: v.string(),` → `status: groupStatusValidator,`
- Line 55: `region: v.optional(v.string()),` → `region: v.optional(regionValidator),`

**paymentLogs table:**
- Line 81: `currency: v.string(),` → `currency: currencyValidator,`
- Line 82: `status: v.string(),` → `status: paymentStatusValidator,`

**supportTickets table:**
- Line 92: `status: v.string(),` → `status: supportStatusValidator,`

**sessions table:**
- Line 100: `source: v.string(),` → `source: sessionSourceValidator,`

**feedback table:**
- Line 69: `wouldMeetAgain: v.optional(v.string()),` → `wouldMeetAgain: v.optional(wouldMeetAgainValidator),`

### REMOVE dead fields from convex/schema.ts

- **IMPLEMENT**: Delete unused profile fields from participants table
- **PATTERN**: Remove lines for familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests
- **IMPORTS**: None
- **GOTCHA**: This will break functions that reference these fields - we'll fix them next
- **VALIDATE**: `npx tsc --noEmit` (will show errors - that's expected)

Remove these 7 lines from the participants table definition:
```typescript
familyStatus: v.optional(v.string()),
targetGender: v.optional(v.string()),
targetAgeFrom: v.optional(v.number()),
targetAgeTo: v.optional(v.number()),
formatPreference: v.optional(v.string()),
values: v.optional(v.array(v.string())),
interests: v.optional(v.array(v.string())),
```

### UPDATE convex/participants.ts - remove dead fields

- **IMPLEMENT**: Remove all references to familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests
- **PATTERN**: Remove from function args, returns, and variable assignments
- **IMPORTS**: `import { participantStatusValidator, genderValidator, regionValidator } from "./validators";`
- **GOTCHA**: These fields appear in multiple functions - must remove from ALL of them
- **VALIDATE**: `npx tsc --noEmit` (should compile after removing all references)

**REMOVE these fields from function args/returns (dead code):**
- getByTelegramId returns object: REMOVE familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests
- getMyProfile returns object: REMOVE familyStatus (if present)
- register args: REMOVE familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests
- updateProfile args: REMOVE familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests
- getActiveForMatching returns object: REMOVE targetGender, targetAgeFrom, targetAgeTo

**UPDATE these field validators (replace v.string() with typed validators):**
- Line 30: `gender: v.string(),` → `gender: genderValidator,`
- Line 31: `region: v.string(),` → `region: regionValidator,`
- Line 44: `status: v.string(),` → `status: participantStatusValidator,`
- Line 74: `gender: v.string(),` → `gender: genderValidator,`
- Line 75: `region: v.string(),` → `region: regionValidator,`
- Line 81: `status: v.string(),` → `status: participantStatusValidator,`
- Line 122: `status: v.optional(v.string()),` → `status: v.optional(participantStatusValidator),`
- Line 123: `region: v.optional(v.string()),` → `region: v.optional(regionValidator),`
- Line 131: `gender: v.string(),` → `gender: genderValidator,`
- Line 132: `region: v.string(),` → `region: regionValidator,`
- Line 133: `status: v.string(),` → `status: participantStatusValidator,`
- Line 189: `gender: v.string(),` → `gender: genderValidator,`
- Line 190: `region: v.string(),` → `region: regionValidator,`
- Line 238: `gender: v.optional(v.string()),` → `gender: v.optional(genderValidator),`
- Line 239: `region: v.optional(v.string()),` → `region: v.optional(regionValidator),`
- Line 367: `gender: v.string(),` → `gender: genderValidator,`
- Line 416: `status: v.string(),` → `status: participantStatusValidator,`

### UPDATE convex/groups.ts function validators

- **IMPLEMENT**: Replace status validators with groupStatusValidator
- **PATTERN**: Import from validators.ts, use in all function validators
- **IMPORTS**: `import { groupStatusValidator, regionValidator } from "./validators";`
- **GOTCHA**: Make sure to import from "./validators" not from schema
- **VALIDATE**: `npx tsc --noEmit`

Update these function validators:
- Line 23: `status: v.string(),` → `status: groupStatusValidator,`
- Line 24: `region: v.optional(v.string()),` → `region: v.optional(regionValidator),`
- Line 186: `status: v.optional(v.string()),` → `status: v.optional(groupStatusValidator),`
- Line 192: `status: v.string(),` → `status: groupStatusValidator,`
- Line 305: `region: v.optional(v.string()),` → `region: v.optional(regionValidator),`
- Line 325: `status: v.string(),` → `status: groupStatusValidator,`

### UPDATE convex/support.ts function validators

- **IMPLEMENT**: Replace status validators with supportStatusValidator
- **PATTERN**: Import from validators.ts
- **IMPORTS**: `import { supportStatusValidator } from "./validators";`
- **GOTCHA**: None
- **VALIDATE**: `npx tsc --noEmit`

Update these function validators:
- Line 19: `status: v.string(),` → `status: supportStatusValidator,`
- Line 56: `status: v.optional(v.string()),` → `status: v.optional(supportStatusValidator),`
- Line 65: `status: v.string(),` → `status: supportStatusValidator,`

### UPDATE convex/payments.ts function validators

- **IMPLEMENT**: Replace status and currency validators
- **PATTERN**: Import from validators.ts
- **IMPORTS**: `import { paymentStatusValidator, currencyValidator } from "./validators";`
- **GOTCHA**: None
- **VALIDATE**: `npx tsc --noEmit`

Update these function validators:
- Line 20: `currency: v.string(),` → `currency: currencyValidator,`
- Line 21: `status: v.string(),` → `status: paymentStatusValidator,`
- Line 208: `currency: v.string(),` → `currency: currencyValidator,`

### UPDATE convex/feedback.ts - add wouldMeetAgain validator

- **IMPLEMENT**: Replace v.optional(v.string()) with v.optional(wouldMeetAgainValidator)
- **PATTERN**: Import validator from validators.ts, use in all function validators
- **IMPORTS**: `import { wouldMeetAgainValidator } from "./validators";`
- **GOTCHA**: Field is optional, so wrap with v.optional()
- **VALIDATE**: `npx tsc --noEmit`

Update these function validators (should be around 5-6 occurrences):
- Line 21: `wouldMeetAgain: v.optional(v.string()),` → `wouldMeetAgain: v.optional(wouldMeetAgainValidator),`
- Line 156: `wouldMeetAgain: v.optional(v.string()),` → `wouldMeetAgain: v.optional(wouldMeetAgainValidator),`
- Line 229: `wouldMeetAgain: v.optional(v.string()),` → `wouldMeetAgain: v.optional(wouldMeetAgainValidator),`
- Line 286: `wouldMeetAgain: v.optional(v.string()),` → `wouldMeetAgain: v.optional(wouldMeetAgainValidator),`

### UPDATE convex/matching.ts - remove dead fields

- **IMPLEMENT**: Remove targetGender, targetAgeFrom, targetAgeTo from Participant interface
- **PATTERN**: Delete lines 23-25 from interface definition
- **IMPORTS**: None
- **GOTCHA**: These fields are defined but never used in the matching logic
- **VALIDATE**: `npx tsc --noEmit`

Remove these 3 lines from the Participant interface (lines 23-25):
```typescript
targetGender?: string;
targetAgeFrom?: number;
targetAgeTo?: number;
```

### UPDATE convex/test.utils.ts

- **IMPLEMENT**: Remove preference fields and update type imports
- **PATTERN**: Import types from validators.ts for better type safety
- **IMPORTS**: `import type { ParticipantStatus, Gender, Region, GroupStatus, SupportStatus, PaymentStatus, Currency, WouldMeetAgain } from "./validators";`
- **GOTCHA**: These are TypeScript types (not validators), use in type annotations only
- **VALIDATE**: `npx tsc --noEmit`

Update makeParticipant overrides type (lines 56-88):
```typescript
export function makeParticipant(
    overrides: Partial<{
        name: string;
        phone: string;
        telegramId: string;
        tgFirstName: string;
        tgLastName: string;
        photo: string;
        birthDate: string;
        age: number;
        gender: Gender;  // Changed from string
        region: Region;  // Changed from string
        city: string;
        // REMOVED: familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests (dead code)
        aboutMe: string;
        profession: string;
        purpose: string;
        expectations: string;
        status: ParticipantStatus;  // Changed from string
        onPause: boolean;
        totalPoints: number;
        registrationDate: number;
        paidUntil: number;
        paymentDate: number;
        inChannel: boolean;
        periodsPaid: number;
    }> = {}
) {
    // Implementation stays the same
}
```

Update makeGroup overrides type (lines 121-127):
```typescript
export function makeGroup(
    participant1: Id<"participants">,
    participant2: Id<"participants">,
    overrides: Partial<{
        participant3: Id<"participants">;
        participant4: Id<"participants">;
        status: GroupStatus;  // Changed from string
        region: Region;  // Changed from string
        createdAt: number;
    }> = {}
) {
    // Implementation stays the same
}
```

Update makeSupportTicket overrides type (lines 141-149):
```typescript
export function makeSupportTicket(
    overrides: Partial<{
        participantId: Id<"participants">;
        telegramId: string;
        question: string;
        answer: string;
        status: SupportStatus;  // Changed from string
        createdAt: number;
    }> = {}
) {
    // Implementation stays the same
}
```

Update makePaymentLog overrides type (lines 188-196):
```typescript
export function makePaymentLog(
    participantId: Id<"participants">,
    overrides: Partial<{
        amount: number;
        currency: Currency;  // Changed from string
        status: PaymentStatus;  // Changed from string
        payPlusTransactionId: string;
        createdAt: number;
    }> = {}
) {
    // Implementation stays the same
}
```

### RUN TypeScript compilation and Convex type generation

- **IMPLEMENT**: Regenerate TypeScript types from updated schema
- **PATTERN**: Run convex dev to generate updated dataModel.d.ts
- **IMPORTS**: N/A
- **GOTCHA**: Must run convex dev to see new types in _generated/dataModel.d.ts
- **VALIDATE**: `npx tsc --noEmit && npm run convex 2>&1 | head -20`

Check that generated types in `convex/_generated/dataModel.d.ts` now have proper literal unions instead of plain strings.

### RUN full test suite

- **IMPLEMENT**: Execute all tests to ensure no regressions
- **PATTERN**: Standard test execution
- **IMPORTS**: N/A
- **GOTCHA**: Tests may fail if they use invalid literal values (fix them)
- **VALIDATE**: `npm run test:once`

All tests should pass. If any tests fail due to type errors:
1. Check that test data uses correct literal values
2. Verify validators are imported correctly
3. Ensure schema regenerated properly

### UPDATE convex/seed.ts

- **IMPLEMENT**: Remove dead preference fields and add type safety
- **PATTERN**: Import types, update gender array, remove dead field assignments
- **IMPORTS**: `import type { ParticipantStatus, Gender, Region } from "./validators";`
- **GOTCHA**: Must delete lines that assign targetGender, targetAgeFrom, targetAgeTo, formatPreference
- **VALIDATE**: `npx tsc --noEmit`

**Update type safety (lines 31-33):**
```typescript
const regions: Region[] = ["North", "Center", "South"];
const genders: Gender[] = ["Male", "Female", "Other"];  // Added "Other"
const statuses: ParticipantStatus[] = ["Active", "Lead", "Inactive"];
```

**REMOVE these lines from participant creation (around lines 68-71):**
Delete the following field assignments inside the `ctx.db.insert("participants", {...})` call:
```typescript
targetGender: gender === "Male" ? "Female" : "Male",
targetAgeFrom: 20,
targetAgeTo: 40,
formatPreference: "In Person",
```

---

## TESTING STRATEGY

### Unit Tests

All existing unit tests should pass without modification since we're only changing type definitions, not runtime behavior. The validators enforce the same string values that were previously used.

**Coverage requirements:**
- All existing tests in participants.test.ts, groups.test.ts, support.test.ts, payments.test.ts must pass
- Test utilities must compile with new type signatures
- No new tests required (this is a refactor, not new functionality)

### Integration Tests

Not applicable - this refactor doesn't change API behavior or integration points.

### Edge Cases

**Invalid literal values:**
Test that Convex validators reject invalid values:
```typescript
// This should throw a Convex validation error
await ctx.db.insert("participants", {
  ...validData,
  status: "invalid" // Not a valid ParticipantStatus
});
```

**TypeScript compilation errors:**
Verify TypeScript catches invalid assignments:
```typescript
const status: ParticipantStatus = "invalid"; // TypeScript error
```

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
```
Expected: No type errors

```bash
cd apps/user && npm run lint
```
Expected: No linting errors

```bash
cd apps/admin && npm run lint
```
Expected: No linting errors

### Level 2: Unit Tests

```bash
npm run test:once
```
Expected: All tests pass (participants, groups, support, payments, feedback, http, crons, matching)

### Level 3: Type Generation

```bash
npm run convex 2>&1 | head -30
```
Expected: Convex dev runs successfully and regenerates types

Manually verify `convex/_generated/dataModel.d.ts` contains literal union types (not just `string`).

### Level 4: Manual Validation

1. Open `convex/_generated/dataModel.d.ts` in VS Code
2. Find the `participants` document type
3. Verify `status` field shows as `"Lead" | "Active" | "Inactive"` (not `string`)
4. Verify `gender` field shows as `"Male" | "Female"` (not `string`)
5. Verify `region` field shows as `"North" | "Center" | "South"` (not `string`)
6. Repeat for groups, paymentLogs, supportTickets, sessions tables

Test autocomplete in IDE:
1. Open a Convex function file
2. Type `await ctx.db.insert("participants", { status: "`
3. Verify IDE shows autocomplete suggestions for "Lead", "Active", "Inactive"

### Level 5: Build Validation

```bash
cd apps/user && npm run build
```
Expected: Build succeeds

```bash
cd apps/admin && npm run build
```
Expected: Build succeeds

---

## ACCEPTANCE CRITERIA

- [ ] All enum-like string fields in schema use v.union with v.literal
- [ ] Dead fields removed from schema (7 total: familyStatus, targetGender, targetAgeFrom, targetAgeTo, formatPreference, values, interests)
- [ ] New validators.ts file created with all reusable validators
- [ ] TypeScript type helpers exported from validators.ts
- [ ] All function validators updated to use typed validators
- [ ] All references to dead preference fields removed from codebase
- [ ] Test utilities use proper TypeScript types (and removed dead fields)
- [ ] Seed data updated (removed 7 dead fields, added "Other" gender, typed wouldMeetAgain)
- [ ] Matching.ts Participant interface updated (removed 3 dead fields)
- [ ] Feedback.ts validators updated (wouldMeetAgain typed)
- [ ] All validation commands pass with zero errors
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Generated dataModel.d.ts contains literal union types (verified manually)
- [ ] IDE autocomplete works for all enum fields
- [ ] No regressions in existing functionality
- [ ] TypeScript compilation succeeds with no errors

---

## COMPLETION CHECKLIST

- [ ] validators.ts created with all enum validators (including "Other" for gender, wouldMeetAgain)
- [ ] Dead fields (7 total) removed from schema.ts
- [ ] schema.ts updated to use validators (including wouldMeetAgain in feedback table)
- [ ] participants.ts dead fields (7 total) removed and validators updated
- [ ] feedback.ts wouldMeetAgain validator updated
- [ ] matching.ts Participant interface updated (3 dead fields removed)
- [ ] groups.ts function validators updated
- [ ] support.ts function validators updated
- [ ] payments.ts function validators updated
- [ ] test.utils.ts types updated (dead fields removed, wouldMeetAgain typed)
- [ ] seed.ts updated (7 dead fields removed, "Other" gender added, wouldMeetAgain typed)
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Convex types regenerated (`npm run convex`)
- [ ] All tests pass (`npm run test:once`)
- [ ] Manual IDE autocomplete verification completed
- [ ] Both apps build successfully
- [ ] No linting errors in any package
- [ ] Generated types manually verified in dataModel.d.ts

---

## NOTES

### Design Decisions

**Why v.union + v.literal instead of TypeScript enums?**
- Convex validators are runtime validation, not just compile-time types
- v.literal + v.union provides both runtime validation AND TypeScript inference
- Smaller bundle size (no enum code emitted)
- Better alignment with Convex best practices
- Easier to use with external APIs that send string values

**Why create validators.ts instead of defining inline?**
- Single source of truth for all enum values
- Reusability across schema and function validators
- Easier to maintain and update allowed values
- Clearer documentation of domain types

**Why export TypeScript types from validators.ts?**
- Allows type annotations in non-Convex code (utilities, helpers)
- Better developer experience with autocomplete
- Consistent type usage across frontend and backend

**Why remove targetGender, targetAgeFrom, targetAgeTo, formatPreference?**
- These fields are defined in the schema but **never used** by the matching algorithm
- The matching algorithm only considers: region, age (from birthDate), and meeting history
- Removing dead code improves maintainability and reduces confusion
- Reduces schema bloat and simplifies participant model
- If preferences are needed in the future, they can be re-added with proper implementation

**Why add "Other" to gender?**
- More inclusive and allows for non-binary gender identities
- Industry best practice for modern applications
- Small addition that makes the system more flexible

### Trade-offs

**Pro:**
- ✅ Compile-time type safety
- ✅ Runtime validation
- ✅ Better IDE autocomplete
- ✅ Prevents invalid data in database
- ✅ Self-documenting allowed values
- ✅ Smaller bundle size vs enums

**Con:**
- ⚠️ Requires updating all uses of these fields (mitigated by TypeScript catching them)
- ⚠️ More verbose schema definitions (mitigated by reusable validators)
- ⚠️ Must regenerate types after schema changes (standard Convex workflow)

### Future Enhancements

None identified - all relevant enum-like fields have been typed or removed as dead code.

### Migration Notes

This refactor is **backwards compatible** at runtime because:
- The same string values are still used (just now validated)
- Database data doesn't need migration
- Existing API responses unchanged
- Only adds type safety, doesn't change behavior

No data migration required!

---

## RESEARCH REFERENCES

- [Convex Schemas Documentation](https://docs.convex.dev/database/schemas) - Official guide for v.literal and v.union
- [TypeScript Union Types by Convex](https://www.convex.dev/typescript/advanced/type-operators-manipulation/typescript-union-types) - Best practices for union types
- [Union Types vs Enums in TypeScript](https://medium.com/@soroushysf/union-types-vs-enums-in-typescript-choosing-the-right-approach-for-your-codebase-dcc7238b3522) - Why literal unions over enums
- [Why Use String Literal Unions Over Enums](https://www.typescriptcourse.com/string-literal-unions-over-enums) - Bundle size and type safety benefits
