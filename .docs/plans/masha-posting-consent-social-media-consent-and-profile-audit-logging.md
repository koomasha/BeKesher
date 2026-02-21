# Feature: Social Media Posting Consent and Profile Audit Logging

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Add the ability for participants to consent (or decline) to having their photographs posted on social media platforms, plus an optional email field for contact purposes. This includes a pre-checked checkbox during onboarding, the ability to toggle this setting while editing their profile, and a comprehensive audit logging system that tracks all changes to key profile fields (including email) for compliance and troubleshooting purposes.

## User Story

As a Tuk-Tuk participant
I want to control whether my photos can be posted on social media
So that I maintain privacy control over my image and personal information

As a Tuk-Tuk administrator
I want to track changes to participant profile data
So that I can ensure compliance, investigate issues, and maintain data integrity

## Problem Statement

Currently, Tuk-Tuk has no mechanism for participants to consent to social media photo posting, which is a privacy concern and potential GDPR/compliance issue. Additionally, there's no audit trail for profile changes, making it difficult to track when and how participant data changes over time.

## Solution Statement

1. Add a `socialMediaConsent` boolean field to the participants schema (defaulting to true for opt-in during registration)
2. Add an `email` optional string field to the participants schema for additional contact information
3. Display a pre-checked checkbox in the onboarding form's first step (Personal Info section)
4. Add an email input field in the onboarding form's first step (Personal Info section)
5. Allow participants to toggle consent and update email when editing their profile
6. Create a new `participantChangeLogs` table that tracks changes to critical profile fields (including email)
7. Automatically log changes whenever these fields are updated via `updateProfile` mutation

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- Convex Backend (schema, participants module)
- User Telegram Mini App (OnboardingPage, ProfilePage)
- Testing infrastructure

**Dependencies**:
- convex (1.17.0+)
- convex-test (0.0.34+)
- React (via apps/user)
- @lingui/macro (for i18n)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` (lines 15-107) - Why: Current database schema, need to add socialMediaConsent field and new participantChangeLogs table
- `convex/validators.ts` (entire file) - Why: Pattern for creating validators, may need to add change log field validator
- `convex/participants.ts` (lines 228-287) - Why: `register` mutation that needs to accept socialMediaConsent field
- `convex/participants.ts` (lines 292-332) - Why: `updateProfile` mutation that needs to log changes before patching
- `convex/participants.ts` (lines 21-60) - Why: `getByTelegramId` query return type needs socialMediaConsent field
- `convex/participants.ts` (lines 65-113) - Why: `getMyProfile` query return type needs socialMediaConsent field
- `convex/test.utils.ts` (lines 66-116) - Why: `makeParticipant` factory function needs socialMediaConsent field
- `convex/participants.test.ts` (lines 1-100) - Why: Testing patterns to follow for new tests
- `apps/user/src/pages/OnboardingPage.tsx` (lines 14-31) - Why: FormData interface needs socialMediaConsent field
- `apps/user/src/pages/OnboardingPage.tsx` (lines 265-360) - Why: Step 1 render function where checkbox should be added
- `apps/user/src/pages/OnboardingPage.tsx` (lines 164-244) - Why: handleFinish function that submits form data
- `apps/user/src/pages/ProfilePage.tsx` (lines 116-156) - Why: Main info section where consent status should be displayed
- `apps/user/src/pages/ProfilePage.tsx` (lines 203-221) - Why: Edit button navigation that passes profileData state

### New Files to Create

- None (all changes are modifications to existing files)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Schema Documentation](https://docs.convex.dev/database/schemas)
  - Specific section: Defining tables and indexes
  - Why: Need to add new table with proper structure and indexes

- [Convex Validators](https://docs.convex.dev/database/types)
  - Specific section: Using v.object() and field validators
  - Why: Proper validation patterns for new fields

- [React Checkbox Input](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable)
  - Specific section: Controlled checkbox components
  - Why: Implementing the consent checkbox with proper state management

- [Vitest Testing](https://vitest.dev/guide/)
  - Specific section: Writing tests and assertions
  - Why: Testing patterns for new functionality

### Patterns to Follow

**Schema Definition Pattern:**
```typescript
// From convex/schema.ts
participants: defineTable({
    // Identity
    name: v.string(),
    phone: v.string(),
    // ... other fields
})
    .index("by_telegramId", ["telegramId"])
    .index("by_status", ["status"])
```

**Validator Pattern:**
```typescript
// From convex/validators.ts
export const statusValidator = v.union(
  v.literal("Open"),
  v.literal("Answered"),
  v.literal("Closed")
);

export type Status = Infer<typeof statusValidator>;
```

**Mutation Pattern with Validation:**
```typescript
// From convex/participants.ts
export const updateProfile = userMutation({
    args: {
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        // ... other optional fields
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        // Remove undefined values
        const cleanUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(args)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        if (Object.keys(cleanUpdates).length > 0) {
            await ctx.db.patch(participant._id, cleanUpdates);
        }

        return null;
    },
});
```

**Testing Pattern:**
```typescript
// From convex/participants.test.ts
test("registers a new participant with Lead status", async () => {
    const t = setupTest();

    const participantId = await t.mutation(api.participants.register, {
        name: "Alice Cohen",
        phone: "+972501111111",
        telegramId: "alice123",
        birthDate: `${new Date().getFullYear() - 28}-01-01`,
        gender: "Female",
        region: "Center",
    });

    expect(participantId).toBeDefined();

    const token = await createTestSession(t, "alice123");
    const participant = await t.query(api.participants.getByTelegramId, {
        sessionToken: token,
    });

    expect(participant).not.toBeNull();
    expect(participant?.name).toBe("Alice Cohen");
});
```

**React Form Field Pattern:**
```typescript
// From apps/user/src/pages/OnboardingPage.tsx
<div className="form-group">
    <label className="form-label"><Trans>Имя *</Trans></label>
    <input
        type="text"
        className={`form-input ${errors.name ? 'error' : ''}`}
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        placeholder={t`Введите ваше имя`}
    />
    {errors.name && <div className="error-text">{errors.name}</div>}
</div>
```

**React Checkbox Pattern:**
```typescript
// From apps/user/src/pages/OnboardingPage.tsx (gender radio buttons)
<label className="radio-label">
    <input
        type="radio"
        name="gender"
        value={t`Мужчина`}
        checked={formData.gender === t`Мужчина`}
        onChange={(e) => handleInputChange('gender', e.target.value)}
    />
    <span><Trans>Мужчина</Trans></span>
</label>
```

**Factory Function Pattern:**
```typescript
// From convex/test.utils.ts
export function makeParticipant(
    overrides: Partial<{
        name: string;
        phone: string;
        // ... other fields
    }> = {}
) {
    return {
        name: "Test User",
        phone: "+972501234567",
        telegramId: "100001",
        status: "Active" as const,
        // ... defaults
        ...overrides,
    };
}
```

### Blueprint Alignment (Critical)

**Data Architecture**: The feature requires modifications to the Convex schema (`convex/schema.ts`):
1. Add `socialMediaConsent` boolean field to the existing `participants` table
2. Create a new `participantChangeLogs` table with the following structure:
   - `participantId`: reference to participants table
   - `field`: the name of the field that changed
   - `oldValue`: the previous value (stored as string for consistency)
   - `newValue`: the new value (stored as string for consistency)
   - `changedAt`: timestamp of change
   - Index on `participantId` for efficient querying

**Logic Workflows**: No n8n.json or workflow files identified in this codebase.

**Identity Guidelines**: No branding.pdf or style guides identified. UI should follow existing patterns in OnboardingPage and ProfilePage.

---

## IMPLEMENTATION PLAN

### Phase 1: Backend Schema & Validators

Add the `socialMediaConsent` field to the participants table and create the new audit logging table with proper indexes.

**Tasks:**
- Add `socialMediaConsent: v.boolean()` to participants schema
- Create `participantChangeLogs` table in schema with all required fields
- Add index `by_participantId` to participantChangeLogs for efficient querying
- Add index `by_participantId_and_changedAt` for time-based queries

### Phase 2: Backend Business Logic

Implement the change logging mechanism and update mutations to handle the new consent field.

**Tasks:**
- Create internal mutation `logParticipantChange` to insert change logs
- Update `register` mutation to accept and save `socialMediaConsent` (default: true)
- Update `updateProfile` mutation to:
  - Accept optional `email` and `socialMediaConsent` parameters
  - Detect changes in tracked fields (name, phone, email, birthDate, gender, region, city, aboutMe, profession, purpose, expectations, socialMediaConsent)
  - Call `logParticipantChange` for each changed field before patching
- Update `getByTelegramId` query return type to include `socialMediaConsent`
- Update `getMyProfile` query return type to include `socialMediaConsent`

### Phase 3: Frontend Integration

Add UI elements for consent management in both onboarding and profile editing flows.

**Tasks:**
- Update `FormData` interface in OnboardingPage to include `socialMediaConsent: boolean`
- Add pre-checked checkbox to Step 1 (after gender field) for social media consent
- Update `handleFinish` to include `socialMediaConsent` in registration call
- Update `handleFinish` to include `socialMediaConsent` in profile update call
- Update ProfilePage to display consent status in Main Info section (read-only display)
- Update ProfilePage edit navigation to include `socialMediaConsent` in profileData state

### Phase 4: Testing & Validation

Comprehensive test coverage for new functionality including edge cases.

**Tasks:**
- Update `makeParticipant` factory to include `socialMediaConsent: true` as default
- Add tests for registration with consent
- Add tests for profile updates that trigger change logs
- Add tests for change log querying
- Add integration tests for the full flow (register → update → verify logs)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: UPDATE convex/schema.ts - Add email and socialMediaConsent fields to participants table

- **IMPLEMENT**: Add two new fields in the participants table definition:
  1. `email: v.optional(v.string())` in the "Identity" section (after line 24, after `photo` field)
  2. `socialMediaConsent: v.boolean()` in the "Profile" section (after line 36, after `expectations` field)
- **PATTERN**: Follow existing optional string pattern like `photo: v.optional(v.string())` and boolean pattern like `onPause: v.boolean()` at line 40
- **IMPORTS**: No new imports needed
- **GOTCHA**: Place email in Identity section (with contact info), socialMediaConsent in Profile section (not Status section)
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: CREATE participantChangeLogs table in convex/schema.ts

- **IMPLEMENT**: Add new table `participantChangeLogs` after the `participants` table definition (after line 53, before `groups` table)
- **SCHEMA**:
  ```typescript
  participantChangeLogs: defineTable({
      participantId: v.id("participants"),
      field: v.string(), // Name of the field that changed
      oldValue: v.union(v.string(), v.null()), // Previous value as string
      newValue: v.union(v.string(), v.null()), // New value as string
      changedAt: v.number(), // Timestamp
  })
      .index("by_participantId", ["participantId"])
      .index("by_participantId_and_changedAt", ["participantId", "changedAt"])
  ```
- **PATTERN**: Follow existing table pattern from schema.ts (lines 55-65 for groups table structure)
- **IMPORTS**: No new imports needed
- **GOTCHA**: Values stored as strings to handle different data types uniformly; use v.union(v.string(), v.null()) to allow null values for fields that can be cleared
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: CREATE internal mutation logParticipantChange in convex/participants.ts

- **IMPLEMENT**: Add new internal mutation after the existing internal mutations (after line 542)
- **CODE**:
  ```typescript
  /**
   * Log a participant profile field change
   * Internal mutation called by updateProfile to create audit trail
   */
  export const logParticipantChange = internalMutation({
      args: {
          participantId: v.id("participants"),
          field: v.string(),
          oldValue: v.union(v.string(), v.null()),
          newValue: v.union(v.string(), v.null()),
      },
      returns: v.null(),
      handler: async (ctx, args) => {
          await ctx.db.insert("participantChangeLogs", {
              participantId: args.participantId,
              field: args.field,
              oldValue: args.oldValue,
              newValue: args.newValue,
              changedAt: Date.now(),
          });
          return null;
      },
  });
  ```
- **PATTERN**: Mirror internal mutation pattern from lines 459-469 (updateStatus)
- **IMPORTS**: No new imports needed (v and internalMutation already imported)
- **GOTCHA**: Use Date.now() for timestamp consistency across codebase
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE register mutation in convex/participants.ts - Accept email and socialMediaConsent

- **IMPLEMENT**: Add `email` and `socialMediaConsent` to args validator (line 229) and pass them through to insert
- **UPDATE ARGS** (line 244): Add:
  - `email: v.optional(v.string()),`
  - `socialMediaConsent: v.optional(v.boolean()),`
- **UPDATE HANDLER** (line 256): In the existing participant patch, add:
  - `email: args.email,`
  - `socialMediaConsent: args.socialMediaConsent ?? true,`
- **UPDATE HANDLER** (line 275): In the new participant insert, add:
  - `email: args.email,`
  - `socialMediaConsent: args.socialMediaConsent ?? true,`
- **PATTERN**: Follow optional field pattern like `city: v.optional(v.string())` at line 240
- **IMPORTS**: No new imports needed
- **GOTCHA**: Default socialMediaConsent to `true` (opt-in) if not provided; email has no default (remains undefined if not provided)
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: DEFINE tracked fields constant in convex/participants.ts

- **IMPLEMENT**: Add constant array of fields to track for audit logging (add after imports, around line 13)
- **CODE**:
  ```typescript
  /**
   * Fields that should be logged in participantChangeLogs when changed
   */
  const TRACKED_FIELDS = [
      "name",
      "phone",
      "email",
      "birthDate",
      "gender",
      "region",
      "city",
      "aboutMe",
      "profession",
      "purpose",
      "expectations",
      "socialMediaConsent",
  ] as const;
  ```
- **PATTERN**: Use const assertion for type safety
- **IMPORTS**: No new imports needed
- **GOTCHA**: Place this constant at module level, not inside a function
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: UPDATE updateProfile mutation - Add change logging, email, and socialMediaConsent support

- **IMPLEMENT**: Modify updateProfile mutation to log changes and accept email and socialMediaConsent
- **UPDATE ARGS** (line 303): Add:
  - `email: v.optional(v.string()),`
  - `socialMediaConsent: v.optional(v.boolean()),`
- **UPDATE HANDLER** (after line 314, before cleanUpdates logic): Add change detection and logging:
  ```typescript
  // Log changes to tracked fields
  for (const field of TRACKED_FIELDS) {
      if (args[field as keyof typeof args] !== undefined) {
          const oldValue = participant[field as keyof typeof participant];
          const newValue = args[field as keyof typeof args];

          // Convert values to strings for storage, handle null/undefined
          const oldValueStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : null;
          const newValueStr = newValue !== undefined && newValue !== null ? String(newValue) : null;

          // Only log if value actually changed
          if (oldValueStr !== newValueStr) {
              await ctx.runMutation(internal.participants.logParticipantChange, {
                  participantId: participant._id,
                  field: field,
                  oldValue: oldValueStr,
                  newValue: newValueStr,
              });
          }
      }
  }
  ```
- **PATTERN**: Use ctx.runMutation to call internal mutations (similar to how ctx.runAction is used elsewhere in codebase)
- **IMPORTS**: Add `internal` to imports from `./_generated/api` (should be alongside `api` import)
- **GOTCHA**: Must compare string values to detect actual changes; don't log if values are identical
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: UPDATE getByTelegramId query return type - Include email and socialMediaConsent

- **IMPLEMENT**: Add `email` and `socialMediaConsent` to the return type validator
- **UPDATE** (line 42): Add after the `expectations` field:
  - `email: v.optional(v.string()),`
  - `socialMediaConsent: v.boolean(),`
- **PATTERN**: Follow existing field pattern in return type object
- **IMPORTS**: No new imports needed
- **GOTCHA**: This is in the return type validator, not the schema; email is optional, socialMediaConsent is required
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: UPDATE getMyProfile query return type - Include email and socialMediaConsent

- **IMPLEMENT**: Add `email` and `socialMediaConsent` to return type and include in returned object
- **UPDATE RETURN TYPE** (line 78): Add after `expectations`:
  - `email: v.optional(v.string()),`
  - `socialMediaConsent: v.boolean(),`
- **UPDATE RETURN OBJECT** (line 106): Add after `expectations`:
  - `email: participant.email,`
  - `socialMediaConsent: participant.socialMediaConsent,`
- **PATTERN**: Mirror the pattern of other fields in this query
- **IMPORTS**: No new imports needed
- **GOTCHA**: Must update both the validator AND the actual return object
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: UPDATE FormData interface in apps/user/src/pages/OnboardingPage.tsx

- **IMPLEMENT**: Add `email` and `socialMediaConsent` fields to FormData interface
- **UPDATE INTERFACE** (line 30): Add after `expectations: string;`:
  - `email: string;`
  - `socialMediaConsent: boolean;`
- **UPDATE STATE INITIALIZATION** (line 54): Add to initial state object:
  - `email: '',`
  - `socialMediaConsent: true`
- **PATTERN**: Follow existing field pattern in interface
- **IMPORTS**: No new imports needed
- **GOTCHA**: Email defaults to empty string; socialMediaConsent defaults to `true` (pre-checked)
- **VALIDATE**: `npm run dev:user` (check for TypeScript errors in terminal)

### Task 10: ADD email input field to OnboardingPage Step 1

- **IMPLEMENT**: Add email input field after the phone field (after line 294, before the region dropdown)
- **CODE**:
  ```typescript
  <div className="form-group">
      <label className="form-label"><Trans>Email (опционально)</Trans></label>
      <input
          type="email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder={t`example@email.com`}
      />
      {errors.email && <div className="error-text">{errors.email}</div>}
  </div>
  ```
- **PATTERN**: Follow existing input field pattern from name/phone fields (lines 272-294)
- **IMPORTS**: Trans and t already imported from @lingui/macro
- **GOTCHA**: Email is optional, so no validation required unless you want to validate email format
- **VALIDATE**: Run app and visually verify email field appears in Step 1

### Task 11: ADD social media consent checkbox to OnboardingPage Step 1

- **IMPLEMENT**: Add checkbox form group after the gender field (after line 358, before closing </div> of step-content)
- **CODE**:
  ```typescript
  <div className="form-group">
      <label className="checkbox-label">
          <input
              type="checkbox"
              checked={formData.socialMediaConsent}
              onChange={(e) => handleInputChange('socialMediaConsent', e.target.checked)}
          />
          <span>
              <Trans>Я согласен(на) на размещение моих фотографий в социальных сетях</Trans>
          </span>
      </label>
      <p className="form-hint">
          <Trans>Вы можете изменить это в любое время в настройках профиля</Trans>
      </p>
  </div>
  ```
- **PATTERN**: Use checkbox input with controlled component pattern
- **IMPORTS**: Trans already imported from @lingui/macro
- **GOTCHA**: Use `e.target.checked` for checkbox, not `e.target.value`; TypeScript may require updating handleInputChange to accept boolean
- **VALIDATE**: Run app and visually verify checkbox appears in Step 1

### Task 12: UPDATE handleInputChange in OnboardingPage to support boolean values

- **IMPLEMENT**: Modify handleInputChange function signature to accept string | boolean
- **UPDATE** (line 246): Change function to:
  ```typescript
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
      setFormData({ ...formData, [field]: value });
  };
  ```
- **PATTERN**: Use union type for value parameter
- **IMPORTS**: No new imports needed
- **GOTCHA**: TypeScript will infer the correct type based on usage
- **VALIDATE**: `npm run dev:user` (check for TypeScript errors)

### Task 13: UPDATE handleFinish in OnboardingPage - Include email and socialMediaConsent in registration

- **IMPLEMENT**: Pass email and socialMediaConsent to registerParticipant mutation
- **UPDATE** (line 227): Add before the closing });:
  - `email: formData.email,`
  - `socialMediaConsent: formData.socialMediaConsent,`
- **PATTERN**: Follow pattern of other form fields being passed to mutation
- **IMPORTS**: No new imports needed
- **GOTCHA**: Place fields with other profile data, not after closing brace
- **VALIDATE**: `npm run dev:user` and test registration flow

### Task 14: UPDATE handleFinish in OnboardingPage - Include email and socialMediaConsent in profile update

- **IMPLEMENT**: Pass email and socialMediaConsent to updateProfile mutation in edit mode
- **UPDATE** (line 194): Add after `expectations`:
  - `email: formData.email,`
  - `socialMediaConsent: formData.socialMediaConsent,`
- **PATTERN**: Follow pattern of other fields in updateProfile call
- **IMPORTS**: No new imports needed
- **GOTCHA**: This is in the `isEditing` branch of handleFinish
- **VALIDATE**: `npm run dev:user` and test edit profile flow

### Task 15: UPDATE ProfilePage - Add email and socialMediaConsent to info display

- **IMPLEMENT**: Add email and consent status display in the Main Info section
- **UPDATE** (after line 154, before closing </div> of info-grid): Add:
  ```typescript
  <div className="info-item">
      <span className="info-label"><Trans>Email</Trans></span>
      <span className="info-value">{profile?.email || '\u2014'}</span>
  </div>
  <div className="info-item">
      <span className="info-label"><Trans>Согласие на публикацию фото</Trans></span>
      <span className="info-value">
          {profile?.socialMediaConsent ?
              <Trans>Разрешено</Trans> :
              <Trans>Не разрешено</Trans>
          }
      </span>
  </div>
  ```
- **PATTERN**: Follow existing info-item pattern from lines 125-154
- **IMPORTS**: Trans already imported from @lingui/macro
- **GOTCHA**: Use optional chaining `profile?.` to handle undefined; show em-dash for empty email
- **VALIDATE**: Run app and visually verify email and consent status display

### Task 16: UPDATE ProfilePage - Include email and socialMediaConsent in edit navigation state

- **IMPLEMENT**: Add email and socialMediaConsent to profileData state passed to OnboardingPage
- **UPDATE** (line 215): Add after `expectations`:
  - `email: profile?.email || '',`
  - `socialMediaConsent: profile?.socialMediaConsent ?? true,`
- **PATTERN**: Follow pattern of other fields in profileData object
- **IMPORTS**: No new imports needed
- **GOTCHA**: Use nullish coalescing `??` for boolean, `||` for string; default socialMediaConsent to true if undefined
- **VALIDATE**: `npm run dev:user` and test navigating to edit mode

### Task 17: UPDATE makeParticipant factory in convex/test.utils.ts

- **IMPLEMENT**: Add email and socialMediaConsent to factory function default values and type
- **UPDATE TYPE** (line 85): Add to Partial<{}> type:
  - `email: string;`
  - `socialMediaConsent: boolean;`
- **UPDATE RETURN** (line 113): Add before `...otherOverrides,`:
  - (no default for email - undefined is appropriate)
  - `socialMediaConsent: true,`
- **PATTERN**: Follow existing field pattern in factory
- **IMPORTS**: No new imports needed
- **GOTCHA**: Default socialMediaConsent to true for test consistency; email has no default (undefined)
- **VALIDATE**: `npm run test:once` (run existing tests to ensure no breaks)

### Task 18: CREATE tests for email and socialMediaConsent in convex/participants.test.ts

- **IMPLEMENT**: Add test cases for the new consent field functionality
- **ADD** (after existing registration tests, around line 90):
  ```typescript
  test("registers participant with explicit socialMediaConsent", async () => {
      const t = setupTest();

      // Test with consent = false
      const participantId = await t.mutation(api.participants.register, {
          name: "Privacy User",
          phone: "+972509999999",
          telegramId: "privacyuser",
          birthDate: `${new Date().getFullYear() - 30}-01-01`,
          gender: "Female",
          region: "Center",
          socialMediaConsent: false,
      });

      const token = await createTestSession(t, "privacyuser");
      const participant = await t.query(api.participants.getByTelegramId, {
          sessionToken: token,
      });

      expect(participant?.socialMediaConsent).toBe(false);
  });

  test("defaults socialMediaConsent to true when not provided", async () => {
      const t = setupTest();

      const participantId = await t.mutation(api.participants.register, {
          name: "Default Consent User",
          phone: "+972508888888",
          telegramId: "defaultuser",
          birthDate: `${new Date().getFullYear() - 25}-01-01`,
          gender: "Male",
          region: "North",
      });

      const token = await createTestSession(t, "defaultuser");
      const participant = await t.query(api.participants.getByTelegramId, {
          sessionToken: token,
      });

      expect(participant?.socialMediaConsent).toBe(true);
  });
  ```
- **PATTERN**: Follow existing test structure from participants.test.ts
- **IMPORTS**: Already imported via existing imports
- **GOTCHA**: Use createTestSession for authenticated queries
- **VALIDATE**: `npm run test:once`

### Task 19: CREATE test file convex/participantChangeLogs.test.ts

- **IMPLEMENT**: Create comprehensive test suite for change logging functionality
- **CREATE**: New file `convex/participantChangeLogs.test.ts`
- **CODE**:
  ```typescript
  import { expect, test, describe } from "vitest";
  import { api } from "./_generated/api";
  import { setupTest, makeParticipant, createTestSession } from "./test.utils";

  describe("participantChangeLogs", () => {
      describe("profile update logging", () => {
          test("logs name change when profile is updated", async () => {
              const t = setupTest();

              // Register participant
              const participantId = await t.mutation(api.participants.register, {
                  ...makeParticipant({
                      name: "Original Name",
                      telegramId: "changetest1",
                  }),
              });

              // Create session and update name
              const token = await createTestSession(t, "changetest1");
              await t.mutation(api.participants.updateProfile, {
                  sessionToken: token,
                  name: "Updated Name",
              });

              // Query change logs
              const logs = await t.run(async (ctx) => {
                  return await ctx.db
                      .query("participantChangeLogs")
                      .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                      .collect();
              });

              expect(logs).toHaveLength(1);
              expect(logs[0].field).toBe("name");
              expect(logs[0].oldValue).toBe("Original Name");
              expect(logs[0].newValue).toBe("Updated Name");
              expect(logs[0].changedAt).toBeDefined();
          });

          test("logs multiple field changes in single update", async () => {
              const t = setupTest();

              const participantId = await t.mutation(api.participants.register, {
                  ...makeParticipant({
                      name: "Test User",
                      phone: "+972501111111",
                      region: "Center",
                      telegramId: "changetest2",
                  }),
              });

              const token = await createTestSession(t, "changetest2");
              await t.mutation(api.participants.updateProfile, {
                  sessionToken: token,
                  name: "New Name",
                  phone: "+972502222222",
                  region: "North",
              });

              const logs = await t.run(async (ctx) => {
                  return await ctx.db
                      .query("participantChangeLogs")
                      .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                      .collect();
              });

              expect(logs).toHaveLength(3);

              const nameLog = logs.find(l => l.field === "name");
              expect(nameLog?.oldValue).toBe("Test User");
              expect(nameLog?.newValue).toBe("New Name");

              const phoneLog = logs.find(l => l.field === "phone");
              expect(phoneLog?.oldValue).toBe("+972501111111");
              expect(phoneLog?.newValue).toBe("+972502222222");

              const regionLog = logs.find(l => l.field === "region");
              expect(regionLog?.oldValue).toBe("Center");
              expect(regionLog?.newValue).toBe("North");
          });

          test("logs socialMediaConsent toggle", async () => {
              const t = setupTest();

              const participantId = await t.mutation(api.participants.register, {
                  ...makeParticipant({
                      telegramId: "changetest3",
                      socialMediaConsent: true,
                  }),
              });

              const token = await createTestSession(t, "changetest3");
              await t.mutation(api.participants.updateProfile, {
                  sessionToken: token,
                  socialMediaConsent: false,
              });

              const logs = await t.run(async (ctx) => {
                  return await ctx.db
                      .query("participantChangeLogs")
                      .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                      .collect();
              });

              expect(logs).toHaveLength(1);
              expect(logs[0].field).toBe("socialMediaConsent");
              expect(logs[0].oldValue).toBe("true");
              expect(logs[0].newValue).toBe("false");
          });

          test("does not log when value doesn't change", async () => {
              const t = setupTest();

              const participantId = await t.mutation(api.participants.register, {
                  ...makeParticipant({
                      name: "Same Name",
                      telegramId: "changetest4",
                  }),
              });

              const token = await createTestSession(t, "changetest4");
              // Update with same name
              await t.mutation(api.participants.updateProfile, {
                  sessionToken: token,
                  name: "Same Name",
              });

              const logs = await t.run(async (ctx) => {
                  return await ctx.db
                      .query("participantChangeLogs")
                      .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                      .collect();
              });

              expect(logs).toHaveLength(0);
          });

          test("logs optional field changes (null to value, value to null)", async () => {
              const t = setupTest();

              const participantId = await t.mutation(api.participants.register, {
                  ...makeParticipant({
                      telegramId: "changetest5",
                      city: undefined,
                  }),
              });

              const token = await createTestSession(t, "changetest5");

              // Add city (null -> value)
              await t.mutation(api.participants.updateProfile, {
                  sessionToken: token,
                  city: "Tel Aviv",
              });

              let logs = await t.run(async (ctx) => {
                  return await ctx.db
                      .query("participantChangeLogs")
                      .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                      .collect();
              });

              expect(logs).toHaveLength(1);
              expect(logs[0].field).toBe("city");
              expect(logs[0].oldValue).toBeNull();
              expect(logs[0].newValue).toBe("Tel Aviv");
          });
      });
  });
  ```
- **PATTERN**: Follow test structure from convex/participants.test.ts
- **IMPORTS**: Import from test.utils and generated API
- **GOTCHA**: Use t.run() to access raw database for querying change logs; handle optional fields with null checks
- **VALIDATE**: `npm run test:once -- participantChangeLogs.test.ts`

### Task 20: ADD CSS styles for consent checkbox in OnboardingPage.css

- **IMPLEMENT**: Add styles for checkbox label and hint text
- **READ FIRST**: `apps/user/src/pages/OnboardingPage.css` to see existing styles
- **ADD** (at end of file):
  ```css
  .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      font-size: 0.95rem;
  }

  .checkbox-label input[type="checkbox"] {
      margin-top: 3px;
      cursor: pointer;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
  }

  .checkbox-label span {
      flex: 1;
      line-height: 1.5;
  }

  .form-hint {
      margin-top: 8px;
      font-size: 0.85rem;
      color: var(--text-secondary, #6b7280);
      font-style: italic;
  }
  ```
- **PATTERN**: Follow existing CSS class naming and structure from OnboardingPage.css
- **IMPORTS**: N/A (CSS file)
- **GOTCHA**: Use flexbox for alignment; ensure checkbox doesn't shrink
- **VALIDATE**: Visually inspect in browser that checkbox and label are properly styled

---

## TESTING STRATEGY

### Unit Tests

**Scope**: Test each Convex function independently with isolated data

**Coverage Requirements**:
- All new mutations and queries (logParticipantChange, updated register, updated updateProfile)
- Edge cases: null values, unchanged values, multiple field updates
- Default behavior: socialMediaConsent defaults to true when not provided

**Test Files**:
- `convex/participants.test.ts` - Extended with consent field tests
- `convex/participantChangeLogs.test.ts` - New comprehensive change log tests

### Integration Tests

**Scope**: End-to-end flows through multiple functions

**Test Scenarios**:
1. Register new participant with consent → Verify participant has consent = true
2. Register with explicit consent = false → Verify stored correctly
3. Update participant profile (multiple fields) → Verify all changes logged
4. Toggle consent → Verify change logged with old/new boolean values
5. Update field with same value → Verify no log created

### Edge Cases

**Critical Edge Cases to Test**:
1. Optional fields transitioning from null → value → null
2. Multiple simultaneous field updates in single mutation call
3. Boolean field (socialMediaConsent) conversion to string in logs
4. Empty/undefined values in change detection
5. Concurrent profile updates (race conditions)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

**TypeScript Type Checking:**
```bash
npx tsc --noEmit
```
Expected: 0 errors

**Linting (User App):**
```bash
cd apps/user && npm run lint
```
Expected: 0 warnings, 0 errors

### Level 2: Unit Tests

**Run All Tests:**
```bash
npm run test:once
```
Expected: All tests pass

**Run Specific Test File:**
```bash
npm run test:once -- participantChangeLogs.test.ts
```
Expected: All change log tests pass

**Run with Coverage:**
```bash
npm run test:coverage
```
Expected: New code has >80% coverage

### Level 3: Integration Tests

**Full Test Suite:**
```bash
npm run test:once
```
Expected: All existing tests still pass + new tests pass

### Level 4: Manual Validation

**Registration Flow:**
1. Start dev servers: `npm run dev:user` and `npm run convex`
2. Navigate to onboarding page
3. Verify consent checkbox appears in Step 1, is pre-checked
4. Uncheck consent checkbox
5. Complete registration
6. Verify participant created with socialMediaConsent = false

**Profile Edit Flow:**
1. Navigate to profile page
2. Verify consent status displays (should show "Не разрешено" if unchecked)
3. Click "Edit Profile"
4. Verify checkbox state matches stored value
5. Toggle checkbox to checked
6. Save profile
7. Verify consent status updated and change logged

**Change Logging Verification:**
Using Convex dashboard or MCP:
```typescript
// Query change logs for a specific participant
db.query("participantChangeLogs")
  .withIndex("by_participantId", q => q.eq("participantId", "<id>"))
  .collect()
```
Expected: See logged changes with correct old/new values

### Level 5: Additional Validation (Optional)

**Convex MCP Server (if available):**
Use MCP tools to query:
- Participants table to verify socialMediaConsent field exists
- participantChangeLogs table to verify change logs are created
- Test data retrieval through MCP queries

---

## ACCEPTANCE CRITERIA

- [x] Schema includes `email` optional string field in participants table
- [x] Schema includes `socialMediaConsent` boolean field in participants table
- [x] Schema includes new `participantChangeLogs` table with proper structure and indexes
- [x] Onboarding form displays email input field in Step 1
- [x] Onboarding form displays pre-checked consent checkbox in Step 1
- [x] Email field accepts optional input (no validation errors if left empty)
- [x] Consent checkbox functions correctly (check/uncheck updates state)
- [x] Registration saves email and socialMediaConsent values (socialMediaConsent defaults to true if not provided)
- [x] Profile page displays current email in read-only format
- [x] Profile page displays current consent status in read-only format
- [x] Profile editing flow includes email field with current value
- [x] Profile editing flow includes consent checkbox with current value
- [x] Profile updates log changes to all tracked fields (12 fields total)
- [x] Change logs store old value, new value, field name, and timestamp
- [x] Change logs only created when values actually change (not for identical updates)
- [x] All validation commands pass with zero errors
- [x] Unit test coverage >80% for new code
- [x] Integration tests verify end-to-end workflows
- [x] Manual testing confirms UI/UX works as expected
- [x] No regressions in existing functionality
- [x] TypeScript types are correct and compile without errors
- [x] i18n strings use Trans/t from @lingui/macro correctly

---

## COMPLETION CHECKLIST

- [ ] All 20 tasks completed in order
- [ ] Each task validation passed immediately after implementation
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors in user app
- [ ] Manual testing confirms:
  - [ ] Consent checkbox appears and functions in onboarding
  - [ ] Consent status displays in profile view
  - [ ] Consent can be toggled in profile editing
  - [ ] Change logs created for profile updates
  - [ ] Change logs have correct data (old/new values, timestamps)
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability
- [ ] Ready for deployment

---

## NOTES

### Design Decisions

**Consent Default (True/Opt-In)**:
The checkbox is pre-checked (defaulting to true) following an opt-in consent model. This is a business decision that assumes most users will consent, but gives them explicit choice. This could be changed to opt-out (default false) if legal/compliance requirements dictate.

**String Storage for Change Logs**:
All values in change logs are stored as strings (or null) to provide a uniform data type that can handle any field type (string, boolean, number, enum). This simplifies querying and display logic. Boolean values are stored as "true"/"false" strings.

**Tracked Fields**:
The 12 tracked fields represent personal and preference data that may have legal/compliance implications. Fields like `status`, `onPause`, `totalPoints`, `paidUntil` are system-managed and intentionally excluded from audit logging as they're tracked through other mechanisms (payment logs, status transitions).

**No Migration Script**:
Existing participants in the database will not have the `socialMediaConsent` field until this schema update is deployed. Convex will handle this gracefully:
- Reads will return undefined for existing records (queries should handle with `??` operator)
- First profile update will set the field explicitly
- Consider adding a migration script post-deployment if needed: `ctx.db.patch(id, { socialMediaConsent: true })` for all existing participants

**Index Strategy**:
Two indexes on `participantChangeLogs`:
1. `by_participantId` - For fetching all changes for a participant
2. `by_participantId_and_changedAt` - For time-range queries (e.g., "changes in last 30 days")

### Potential Future Enhancements

1. **Change Log Query API**: Add a userQuery to let participants view their own change history
2. **Admin Change Log View**: Dashboard page to view/filter change logs across all participants
3. **Retention Policy**: Auto-delete change logs older than X months for GDPR compliance
4. **Who Made Change**: Add `changedBy` field to track which user/admin made the change
5. **Reason Field**: Add optional `reason: string` to change logs for admin-initiated changes
6. **Rollback Capability**: Use change logs to implement profile field rollback functionality

### Migration Considerations

**Existing Participants**:
After deployment, existing participants will not have `socialMediaConsent` field set. Options:
1. Let it be undefined until they next edit their profile (queries use `?? true` to default)
2. Run a one-time migration to set all existing participants to `true` (opt-in):
   ```typescript
   // Migration script (run once after deployment)
   const participants = await ctx.db.query("participants").collect();
   for (const p of participants) {
       if (p.socialMediaConsent === undefined) {
           await ctx.db.patch(p._id, { socialMediaConsent: true });
       }
   }
   ```
3. Default to `false` (opt-out) for existing users and require explicit consent

**Recommended Approach**: Option 1 (lazy update) for simplicity, with UI defaulting to true if undefined.

### i18n Strings Added

Russian strings added (will need to run `npm run lingui:extract` to update message catalogs):
- "Email (опционально)"
- "example@email.com"
- "Email"
- "Я согласен(на) на размещение моих фотографий в социальных сетях"
- "Вы можете изменить это в любое время в настройках профиля"
- "Согласие на публикацию фото"
- "Разрешено"
- "Не разрешено"

After extraction, these will need translations for other locales if applicable.
