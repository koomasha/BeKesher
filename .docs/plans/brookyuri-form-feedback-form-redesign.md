# Feature: User Feedback Form Redesign

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Redesign the user feedback form to match the reference form (Fillout-based). The new form is a multi-step wizard in Russian with a 1-10 rating scale, photo upload (up to 5), multiple-choice task effect question, 3-option "would meet again" (Yes/No/Maybe), two separate text areas (what liked + improvement suggestions), and visual dividers between sections.

**Reference form**: https://forms.fillout.com/t/7L5qme6cqzus

## User Story

As a Tuk-Tuk participant
I want to submit detailed feedback about my weekly meetup through a guided multi-step form
So that the organizers get richer data about meeting quality and I can share photos from the meetup

## Problem Statement

The current feedback form is a basic single-page form with a 1-5 star rating, boolean yes/no "would meet again", and a single comments textarea. It doesn't capture nuanced feedback like task effect on communication, improvement suggestions, or meetup photos. The form is in English while the user base is Russian-speaking.

## Solution Statement

Replace the current FeedbackPage with a multi-step wizard form in Russian that mirrors the reference Fillout form. Add new schema fields (`taskEffect`, `improvementSuggestion`), change `wouldMeetAgain` from boolean to string with 3 options, expand rating to 1-10 scale, and implement Convex file storage for photo uploads.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: `convex/schema.ts`, `convex/feedback.ts`, `apps/user/src/pages/FeedbackPage.tsx`, `apps/user/src/index.css`, `convex/feedback.test.ts`, `convex/test.utils.ts`
**Dependencies**: Convex file storage API (built-in, no new npm packages needed)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` (lines 63-73) - Why: feedback table definition that needs new fields
- `convex/feedback.ts` (lines 1-254) - Why: ALL backend feedback functions need updates (rating range, new fields, return types)
- `convex/feedback.test.ts` (lines 1-456) - Why: ALL tests need updates for new schema (rating 1-10, new fields)
- `convex/test.utils.ts` (lines 114-132) - Why: `makeFeedback` factory needs new fields
- `apps/user/src/pages/FeedbackPage.tsx` (lines 1-221) - Why: Complete rewrite as multi-step wizard
- `apps/user/src/index.css` - Why: Add new CSS classes for wizard steps, rating scale, photo upload
- `apps/user/src/App.tsx` (lines 1-24) - Why: Route config (no changes needed, just understand structure)
- `convex/http.ts` (lines 1-186) - Why: HTTP route patterns for reference (not changed)

### New Files to Create

- None — all changes are to existing files

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex File Storage – Upload Files](https://docs.convex.dev/file-storage/upload-files)
  - Specific section: Three-step upload process (generateUploadUrl → POST → save storageId)
  - Why: Required for implementing photo upload in feedback
- [Convex File Storage – Serve Files](https://docs.convex.dev/file-storage/serve-files)
  - Specific section: Using ctx.storage.getUrl() in queries
  - Why: Needed for displaying uploaded photos

### Patterns to Follow

**Naming Conventions:**
- Backend functions: camelCase (`submitFeedback`, `getForParticipant`)
- CSS classes: kebab-case (`btn-primary`, `card-title`, `animate-fade-in`)
- CSS variables: `--spacing-md`, `--font-size-sm`, `--primary-gradient`
- Schema indexes: `by_field` pattern (`by_groupId`, `by_participantId`)

**Component Structure Pattern (from existing pages):**
```tsx
function PageName() {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const telegramId = telegramUser?.id?.toString() || '';
    // useQuery hooks
    // useMutation hooks
    // useState for form state
    // Early returns: no telegramId → loading → success → main content
    // Wrap in <div className="page"> with <header className="header">
}
export default PageName;
```

**Convex Mutation Pattern:**
```ts
export const functionName = mutation({
    args: { /* v.string(), v.number(), etc. */ },
    returns: v.id("tableName"),
    handler: async (ctx, args) => {
        // validate, insert, return id
    },
});
```

**Test Pattern:**
```ts
describe("featureName", () => {
    test("description", async () => {
        const t = setupTest();
        const [p1, p2] = await seedParticipants(t, [...]);
        const groupId = await t.mutation(internal.groups.create, {...});
        await t.mutation(internal.groups.updateStatus, { groupId, status: "Completed" });
        // act & assert
    });
});
```

**CSS Pattern - Inline styles use CSS variables:**
```tsx
style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}
```

### Blueprint Alignment

- **Data Architecture**: `convex/schema.ts` feedback table needs 2 new fields (`taskEffect`, `improvementSuggestion`) and `wouldMeetAgain` type change from `v.optional(v.boolean())` to `v.optional(v.string())`. The `photos` field changes from `v.optional(v.array(v.string()))` to `v.optional(v.array(v.id("_storage")))` to use proper Convex storage IDs.

---

## IMPLEMENTATION PLAN

### Phase 1: Schema & Backend Foundation

Update the database schema with new fields and change existing field types. Add file storage mutation. Update all backend feedback functions.

**Tasks:**
- Update feedback table schema (new fields, type changes)
- Add `generateUploadUrl` mutation for photo upload
- Update `submitFeedback` mutation (new args, 1-10 rating validation, new field types)
- Update `getForParticipant` query (return new fields)
- Update `getForGroup` query (return new fields, resolve photo URLs)
- Update `getPendingFeedback` query (no changes needed — it doesn't return feedback data)

### Phase 2: Test Updates

Update all existing tests and add new tests for the expanded fields.

**Tasks:**
- Update `makeFeedback` factory in test utils
- Update all existing `submitFeedback` tests for new rating range (1-10)
- Add test for `taskEffect` field
- Add test for `wouldMeetAgain` as string
- Add test for `improvementSuggestion` field
- Update query tests for new return shapes

### Phase 3: Frontend Multi-Step Wizard

Rebuild FeedbackPage as a multi-step wizard form in Russian with all new fields.

**Tasks:**
- Add new CSS classes for wizard steps, progress indicator, rating scale, photo upload
- Rewrite FeedbackPage.tsx as multi-step wizard with Russian UI text

### Phase 4: Testing & Validation

Run tests, lint, and type-check to ensure everything works.

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: UPDATE `convex/schema.ts` — Feedback table schema

- **IMPLEMENT**: Modify the `feedback` table definition:
  1. Change `wouldMeetAgain` from `v.optional(v.boolean())` to `v.optional(v.string())` — values will be "yes", "no", "maybe"
  2. Change `photos` from `v.optional(v.array(v.string()))` to `v.optional(v.array(v.id("_storage")))` — proper Convex storage IDs
  3. Add `taskEffect` field: `v.optional(v.string())` — values: "deeper", "fun", "not_fit"
  4. Add `improvementSuggestion` field: `v.optional(v.string())`
- **PATTERN**: Follow existing schema patterns at `convex/schema.ts:63-73`
- **GOTCHA**: The rating field stays as `v.number()` — the range validation (1-10) happens in the mutation handler, not schema
- **VALIDATE**: `npx tsc --noEmit` from project root (will fail until mutations are updated — that's expected)

---

### Task 2: UPDATE `convex/feedback.ts` — Add generateUploadUrl mutation

- **IMPLEMENT**: Add a new public mutation `generateUploadUrl` near the top of the mutations section:
  ```ts
  export const generateUploadUrl = mutation({
      args: {},
      returns: v.string(),
      handler: async (ctx) => {
          return await ctx.storage.generateUploadUrl();
      },
  });
  ```
- **PATTERN**: Follow Convex file storage docs pattern — [Upload Files](https://docs.convex.dev/file-storage/upload-files)
- **IMPORTS**: No new imports needed — `mutation` is already imported
- **VALIDATE**: `npx tsc --noEmit` (may still fail due to other pending changes)

---

### Task 3: UPDATE `convex/feedback.ts` — Update submitFeedback mutation

- **IMPLEMENT**: Modify the `submitFeedback` mutation (line 179):
  1. Update `args`:
     - Change `photos: v.optional(v.array(v.string()))` to `photos: v.optional(v.array(v.id("_storage")))`
     - Change `wouldMeetAgain: v.optional(v.boolean())` to `wouldMeetAgain: v.optional(v.string())`
     - Add `taskEffect: v.optional(v.string())`
     - Add `improvementSuggestion: v.optional(v.string())`
  2. Update rating validation from `args.rating < 1 || args.rating > 5` to `args.rating < 1 || args.rating > 10`
  3. Update error message from `"Rating must be between 1 and 5"` to `"Rating must be between 1 and 10"`
  4. Add new fields to the `ctx.db.insert` call:
     ```ts
     taskEffect: args.taskEffect,
     improvementSuggestion: args.improvementSuggestion,
     ```
- **PATTERN**: Follow existing mutation pattern at `convex/feedback.ts:179-254`
- **GOTCHA**: Keep all existing validations (participant exists, group exists, was in group, duplicate check)
- **VALIDATE**: `npx tsc --noEmit`

---

### Task 4: UPDATE `convex/feedback.ts` — Update getForParticipant query

- **IMPLEMENT**: Modify the `getForParticipant` query (line 11):
  1. Update `returns` validator to include new fields:
     - Add `taskEffect: v.optional(v.string())`
     - Add `improvementSuggestion: v.optional(v.string())`
     - Change `wouldMeetAgain: v.optional(v.boolean())` to `v.optional(v.string())`
     - Add `photos: v.optional(v.array(v.id("_storage")))`
  2. Update the return mapping to include new fields:
     ```ts
     taskEffect: f.taskEffect,
     improvementSuggestion: f.improvementSuggestion,
     photos: f.photos,
     ```
- **PATTERN**: Follow existing query return pattern at `convex/feedback.ts:41-48`
- **VALIDATE**: `npx tsc --noEmit`

---

### Task 5: UPDATE `convex/feedback.ts` — Update getForGroup query

- **IMPLEMENT**: Modify the `getForGroup` query (line 136):
  1. Update `returns` validator to include new fields:
     - Add `taskEffect: v.optional(v.string())`
     - Add `improvementSuggestion: v.optional(v.string())`
     - Change `wouldMeetAgain: v.optional(v.boolean())` to `v.optional(v.string())`
     - Add `photoUrls: v.optional(v.array(v.string()))` — resolved URLs for display
  2. In the handler, resolve photo storage IDs to URLs using `ctx.storage.getUrl()`:
     ```ts
     const photoUrls = f.photos
         ? await Promise.all(
               f.photos.map(async (storageId) => {
                   const url = await ctx.storage.getUrl(storageId);
                   return url;
               })
           )
         : undefined;
     ```
  3. Filter out null URLs (in case a file was deleted):
     ```ts
     const validUrls = photoUrls?.filter((url): url is string => url !== null);
     ```
  4. Include in return object: `photoUrls: validUrls && validUrls.length > 0 ? validUrls : undefined`
- **PATTERN**: Follow existing enrichment pattern at `convex/feedback.ts:154-166`
- **VALIDATE**: `npx tsc --noEmit`

---

### Task 6: UPDATE `convex/test.utils.ts` — Update makeFeedback factory

- **IMPLEMENT**: Update the `makeFeedback` factory function (line 114):
  1. Change `wouldMeetAgain: boolean` to `wouldMeetAgain: string` in overrides type
  2. Add `taskEffect: string` to overrides type
  3. Add `improvementSuggestion: string` to overrides type
  4. Keep `photos: string[]` for now (test utils don't use real storage IDs in convex-test)
- **PATTERN**: Follow existing factory pattern at `convex/test.utils.ts:114-132`
- **VALIDATE**: `npx tsc --noEmit`

---

### Task 7: UPDATE `convex/feedback.test.ts` — Update existing tests

- **IMPLEMENT**: Update all tests in `convex/feedback.test.ts`:
  1. **Rating boundary tests** (lines 165-271):
     - Change error message assertions from `"Rating must be between 1 and 5"` to `"Rating must be between 1 and 10"`
     - Change "accepts rating exactly 5 (boundary)" to "accepts rating exactly 10 (boundary)" with `rating: 10`
     - Change "throws if rating is greater than 5" to "throws if rating is greater than 10" with `rating: 11`
  2. **Main submit test** (lines 11-46):
     - Add new fields to the submit call: `taskEffect: "deeper"`, `wouldMeetAgain: "yes"` (string instead of boolean), `improvementSuggestion: "More time"`
  3. **Add new test**: "submits feedback with all new fields including taskEffect and improvementSuggestion"
     - Submit with all fields filled, verify the feedback record contains them by querying `getForParticipant`
  4. **Add new test**: "submits feedback with photos as storage IDs" (if convex-test supports storage mocking; otherwise skip and add a comment)
  5. Update `wouldMeetAgain: true` → `wouldMeetAgain: "yes"` in any test that uses it
- **PATTERN**: Follow existing test patterns at `convex/feedback.test.ts`
- **GOTCHA**: The `wouldMeetAgain` type change from boolean to string affects every test that passes this field
- **VALIDATE**: `npm run test:once`

---

### Task 8: UPDATE `apps/user/src/index.css` — Add wizard and new component styles

- **IMPLEMENT**: Add the following CSS classes to the end of the file (before the closing of global styles):

  1. **Wizard step container & progress:**
     ```css
     .wizard-progress {
         display: flex;
         justify-content: center;
         gap: var(--spacing-xs);
         padding: var(--spacing-md) 0;
     }
     .wizard-dot {
         width: 8px;
         height: 8px;
         border-radius: var(--radius-full);
         background: var(--border-color);
         transition: background 0.3s ease;
     }
     .wizard-dot.active {
         background: var(--primary-start);
     }
     .wizard-dot.completed {
         background: var(--accent-success);
     }
     ```

  2. **Rating scale 1-10:**
     ```css
     .rating-scale {
         display: flex;
         justify-content: space-between;
         gap: var(--spacing-xs);
         padding: var(--spacing-sm) 0;
     }
     .rating-scale-item {
         width: 36px;
         height: 36px;
         border-radius: var(--radius-full);
         border: 2px solid var(--border-color);
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: var(--font-size-sm);
         font-weight: 600;
         cursor: pointer;
         transition: all 0.2s ease;
         background: var(--bg-secondary);
         color: var(--text-primary);
     }
     .rating-scale-item.selected {
         background: var(--primary-gradient);
         border-color: var(--primary-start);
         color: white;
     }
     .rating-scale-item:hover {
         border-color: var(--primary-start);
         transform: scale(1.1);
     }
     .rating-scale-labels {
         display: flex;
         justify-content: space-between;
         font-size: var(--font-size-xs);
         color: var(--text-muted);
         padding-top: var(--spacing-xs);
     }
     ```

  3. **Photo upload:**
     ```css
     .photo-upload-area {
         border: 2px dashed var(--border-color);
         border-radius: var(--radius-lg);
         padding: var(--spacing-lg);
         text-align: center;
         cursor: pointer;
         transition: border-color 0.2s ease;
     }
     .photo-upload-area:hover {
         border-color: var(--primary-start);
     }
     .photo-preview-grid {
         display: grid;
         grid-template-columns: repeat(3, 1fr);
         gap: var(--spacing-sm);
         margin-top: var(--spacing-md);
     }
     .photo-preview-item {
         position: relative;
         aspect-ratio: 1;
         border-radius: var(--radius-md);
         overflow: hidden;
     }
     .photo-preview-item img {
         width: 100%;
         height: 100%;
         object-fit: cover;
     }
     .photo-preview-remove {
         position: absolute;
         top: 4px;
         right: 4px;
         width: 24px;
         height: 24px;
         border-radius: var(--radius-full);
         background: rgba(0, 0, 0, 0.6);
         color: white;
         border: none;
         cursor: pointer;
         display: flex;
         align-items: center;
         justify-content: center;
         font-size: var(--font-size-xs);
     }
     ```

  4. **Multiple choice option buttons:**
     ```css
     .option-group {
         display: flex;
         flex-direction: column;
         gap: var(--spacing-sm);
     }
     .option-btn {
         display: flex;
         align-items: center;
         gap: var(--spacing-md);
         padding: var(--spacing-md);
         border: 2px solid var(--border-color);
         border-radius: var(--radius-md);
         background: var(--bg-secondary);
         cursor: pointer;
         transition: all 0.2s ease;
         text-align: left;
         font-size: var(--font-size-base);
         color: var(--text-primary);
     }
     .option-btn.selected {
         border-color: var(--primary-start);
         background: rgba(102, 126, 234, 0.05);
     }
     .option-btn:hover {
         border-color: var(--primary-start);
     }
     ```

  5. **Divider:**
     ```css
     .form-divider {
         height: 1px;
         background: var(--border-color);
         margin: var(--spacing-lg) 0;
     }
     ```

  6. **Wizard navigation buttons:**
     ```css
     .wizard-nav {
         display: flex;
         gap: var(--spacing-sm);
         margin-top: var(--spacing-lg);
     }
     .wizard-nav .btn {
         flex: 1;
     }
     ```

- **PATTERN**: Follow existing CSS variable usage and class naming from `apps/user/src/index.css`
- **GOTCHA**: Don't modify existing classes — only add new ones
- **VALIDATE**: Visual inspection (no automated CSS test)

---

### Task 9: UPDATE `apps/user/src/pages/FeedbackPage.tsx` — Complete rewrite as multi-step wizard

- **IMPLEMENT**: Rewrite the entire FeedbackPage component. The form has **6 steps** after group selection:

  **State Management:**
  ```tsx
  const [selectedGroup, setSelectedGroup] = useState<Id<'groups'> | null>(null);
  const [step, setStep] = useState(0); // 0-5 for 6 wizard steps
  const [rating, setRating] = useState(0); // 1-10 scale
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [uploadedStorageIds, setUploadedStorageIds] = useState<string[]>([]);
  const [taskEffect, setTaskEffect] = useState<string | null>(null);
  const [wouldMeetAgain, setWouldMeetAgain] = useState<string | null>(null);
  const [textFeedback, setTextFeedback] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  ```

  **Mutations:**
  ```tsx
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  const generateUploadUrl = useMutation(api.feedback.generateUploadUrl);
  ```

  **Wizard Steps (0-indexed):**

  | Step | Question (Russian) | Field | Required |
  |------|-------------------|-------|----------|
  | 0 | Дай оценку этой недели (1 — Полный отстой, 10 — Не хочу чтобы она заканчивалась) | rating (1-10) | Yes |
  | 1 | Загрузи фотку с вашей встречи (если хочешь) | photos (up to 5) | No |
  | 2 | Как задание повлияло на ваше общение? | taskEffect | Yes |
  | 3 | Хочешь ли встретиться с этим партнером снова? | wouldMeetAgain | Yes |
  | 4 | Что понравилось в этой встрече? | textFeedback | No |
  | 5 | Что бы ты хотел/а улучшить в игре? | improvementSuggestion | No |

  **Step 0 — Rating (1-10):**
  - Render 10 numbered circles using `.rating-scale` and `.rating-scale-item` classes
  - Labels below: "Полный отстой" (left) and "Не хочу чтобы заканчивалась" (right)
  - "Далее" (Next) button — disabled until rating > 0

  **Step 1 — Photo Upload:**
  - File input (hidden) triggered by clicking `.photo-upload-area`
  - Accept `image/*`, allow multiple files
  - Show photo previews in `.photo-preview-grid` with remove buttons
  - Max 5 photos — hide upload area when 5 reached
  - Store files locally; actual upload happens on submit
  - "Далее" button (always enabled — photos are optional)
  - "Назад" (Back) button

  **Step 2 — Task Effect (Multiple Choice):**
  - 3 options rendered as `.option-btn`:
    - "Сделало общение глубже" → value `"deeper"`
    - "Добавило веселья" → value `"fun"`
    - "Не очень подошло" → value `"not_fit"`
  - "Далее" button — disabled until option selected

  **Step 3 — Would Meet Again (Multiple Choice):**
  - 3 options rendered as `.option-btn`:
    - "Да" → value `"yes"`
    - "Нет" → value `"no"`
    - "Может быть" → value `"maybe"`
  - "Далее" button — disabled until option selected

  **Step 4 — What Liked (Textarea):**
  - Textarea with `.input` class, 4 rows
  - Placeholder: "Расскажи, что понравилось..."
  - "Далее" button (always enabled — optional field)

  **Step 5 — Improvement Suggestions (Textarea) + Submit:**
  - Textarea with `.input` class, 4 rows
  - Placeholder: "Расскажи, что можно улучшить..."
  - "Отправить" (Submit) button instead of "Далее"

  **Submit Handler Logic:**
  1. Set `isSubmitting = true`
  2. Upload photos (if any):
     - For each photo file, call `generateUploadUrl()` to get a presigned URL
     - POST each file to the presigned URL with `Content-Type: file.type`
     - Collect all `storageId` values from responses
  3. Call `submitFeedback` with all fields + storageIds
  4. On success: show success screen, reset all state
  5. On error: show alert, keep form state
  6. Set `isSubmitting = false`

  **Progress Indicator:**
  - Render `.wizard-progress` with 6 `.wizard-dot` elements
  - Current step → `.active`, completed steps → `.completed`

  **Navigation:**
  - Each step has "Далее"/"Назад" buttons in `.wizard-nav`
  - Step 0: only "Далее" (no back — back goes to group selection)
  - Steps 1-4: both "Назад" and "Далее"
  - Step 5: "Назад" and "Отправить"
  - A cancel/back-to-group-selection link above the wizard

  **Other UI States (keep existing patterns):**
  - No telegramId: show "Откройте приложение из Telegram" (Russian)
  - Loading: show spinner
  - No pending feedback: show "Нет ожидающих отзывов" with checkmark
  - Group selection: show list of pending groups (keep existing layout, translate to Russian)
  - Success: show "Спасибо за отзыв! Вы получили 10 баллов!" with button "Оставить ещё отзыв"

- **PATTERN**: Follow existing page structure from `apps/user/src/pages/FeedbackPage.tsx`
- **IMPORTS**: `useState, useRef` from React, `useQuery, useMutation` from `convex/react`, `api` from `convex/_generated/api`, `Link` from `react-router-dom`, `Id` from `convex/_generated/dataModel`
- **GOTCHA**:
  - Photo upload must create object URLs for preview (`URL.createObjectURL(file)`) and revoke them on cleanup
  - The `storageId` returned from fetch to the upload URL is in the format `{ storageId: "..." }` — parse with `result.json()`
  - File input needs a ref to reset it after selection
  - Don't forget to handle the case where photo upload fails mid-way (partial uploads)
- **VALIDATE**: `cd apps/user && npm run build`

---

## TESTING STRATEGY

### Unit Tests (convex/feedback.test.ts)

Tests to update:
1. **Rating range tests**: Change boundary from 5 to 10, error message from "1 and 5" to "1 and 10"
2. **Submit test**: Add `taskEffect`, `wouldMeetAgain` as string, `improvementSuggestion`
3. **wouldMeetAgain**: Change from `true`/`false` to `"yes"`/`"no"`/`"maybe"` strings

New tests to add:
1. **"submits feedback with all new fields"**: Submit with `taskEffect: "deeper"`, `wouldMeetAgain: "yes"`, `improvementSuggestion: "More time"`, verify they're returned by `getForParticipant`
2. **"accepts all valid taskEffect values"**: Test "deeper", "fun", "not_fit"
3. **"accepts all valid wouldMeetAgain values"**: Test "yes", "no", "maybe"

### Edge Cases

- Submit with only required fields (rating + taskEffect + wouldMeetAgain)
- Submit with all optional fields empty
- Photo upload with 0 photos (skip step)
- Photo upload with exactly 5 photos (max limit)
- Very long text in textFeedback and improvementSuggestion
- Rating exactly 1 and exactly 10 (boundary)
- Rating 0 and 11 (invalid boundary)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Type Checking

```bash
npx tsc --noEmit
```

### Level 2: Linting

```bash
cd apps/user && npm run lint
```

### Level 3: Unit Tests

```bash
npm run test:once
```

### Level 4: Build

```bash
cd apps/user && npm run build
```

### Level 5: Manual Validation

1. Open the user app at localhost:5173/feedback
2. Verify group selection screen shows in Russian
3. Select a group and walk through all 6 wizard steps
4. Verify progress dots update correctly
5. Verify back/next navigation works
6. Verify required field validation (can't proceed without rating, taskEffect, wouldMeetAgain)
7. Test photo upload: select files, see previews, remove a photo
8. Submit and verify success screen in Russian
9. Verify 10 points awarded

---

## ACCEPTANCE CRITERIA

- [ ] Schema updated with `taskEffect`, `improvementSuggestion` fields and `wouldMeetAgain` type changed to string
- [ ] `photos` field uses `v.id("_storage")` for proper Convex file storage
- [ ] Rating validation is 1-10 (not 1-5)
- [ ] `generateUploadUrl` mutation exists and works
- [ ] `submitFeedback` accepts and stores all new fields
- [ ] Query functions return new fields
- [ ] All UI text is in Russian
- [ ] Form is a multi-step wizard with 6 steps
- [ ] Progress indicator shows current step
- [ ] Back/Next navigation between steps works
- [ ] Photo upload works (select, preview, remove, upload to Convex storage)
- [ ] Max 5 photos enforced
- [ ] All existing tests updated and passing
- [ ] New tests added for new fields
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes in apps/user
- [ ] `npm run test:once` passes
- [ ] `npm run build` passes in apps/user
- [ ] 10 points still awarded on feedback submission
- [ ] No regressions in existing functionality

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (Tasks 1-9)
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit)
- [ ] No linting or type checking errors
- [ ] Build succeeds
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Design Decisions

1. **wouldMeetAgain type change**: Changed from `boolean` to `string` to support "maybe" option. This is a breaking change for existing data — old records have `true`/`false`, new records will have `"yes"`/`"no"`/`"maybe"`. The queries should handle both formats gracefully, OR a data migration should be considered. For simplicity, old data with boolean values will be treated as-is (queries return what's stored).

2. **Photo upload strategy**: Using Convex's built-in file storage rather than external services. Photos are uploaded sequentially on submit (not on selection) to avoid orphaned files if the user cancels. The trade-off is a longer submit time if many photos are selected.

3. **Rating scale change**: Moving from 5-star to 1-10 numeric scale. This changes the semantics of historical data (a "5" in old data meant "excellent", but in new data "5" is "middle"). The admin dashboard may need context about when the scale changed.

4. **Multi-step vs single page**: Multi-step wizard chosen to match reference form and reduce cognitive load. Each step focuses on one question, which tends to improve completion rates on mobile.

5. **Russian language**: Hardcoded Russian strings in the component. If i18n is needed later, these can be extracted to a translations file. For now, keeping it simple with inline strings.

### Risks

- **convex-test and file storage**: The `convex-test` library may not fully support `ctx.storage` operations in tests. Photo upload tests may need to be integration-level rather than unit-level. If `ctx.storage.generateUploadUrl()` is not available in convex-test, the `generateUploadUrl` mutation test should be skipped with a comment explaining why.

- **Backward compatibility**: Existing feedback records have `wouldMeetAgain` as boolean. The `getForParticipant` and `getForGroup` queries need to handle both old (boolean) and new (string) formats, OR a migration needs to run first. Recommendation: handle both in queries by checking the type at runtime and converting booleans to strings.
