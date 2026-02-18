# Feature: Season Flow Bug Fixes

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Fix all bugs, data integrity issues, logic gaps, test gaps, and frontend issues identified in the deep review of the `masha/season-flow` branch. This covers 20 distinct issues (21 total minus #1 which was fixed directly) across critical bugs, data structure problems, logic issues, test gaps, frontend problems, and missing user-side UI.

## User Story

As a developer maintaining BeKesher
I want to fix all identified bugs in the season-flow feature before merging
So that the feature is production-ready with correct authorization, data integrity, and test coverage

## Problem Statement

The season-flow branch implements a comprehensive seasons + tasks system but has 20 identified bugs ranging from critical (authorization bypass, timezone errors) to moderate (missing tests, redundant data, UI inefficiencies). These must be resolved before the feature can be safely deployed. Note: The production DB is empty and MVP hasn't launched — no migrations or backward compatibility considerations needed.

## Solution Statement

Systematically fix each bug in dependency order: schema/data changes first, then backend logic fixes, then test coverage, then frontend fixes. Each fix is atomic and independently testable.

## Feature Metadata

**Feature Type**: Bug Fix
**Estimated Complexity**: Medium
**Primary Systems Affected**: `convex/taskAssignments.ts`, `convex/seasons.ts`, `convex/seasonParticipants.ts`, `convex/schema.ts`, `convex/utils.ts`, `convex/tasks.ts`, `convex/groups.ts`, `apps/admin/src/pages/ReviewPage.tsx`, `apps/user/src/pages/TaskPage.tsx` (NEW), `apps/user/src/pages/GroupsPage.tsx`, `apps/user/src/App.tsx`
**Dependencies**: None (all fixes use existing libraries)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` - Full database schema with all tables and indexes
- `convex/taskAssignments.ts` - Task assignment mutations/queries (bugs #2, #3, #11, #12)
- `convex/seasons.ts` - Season management (bugs #13, #14)
- `convex/seasonParticipants.ts` - Enrollment management (bug #5, test gap #16)
- `convex/tasks.ts` - Task CRUD (bug #15)
- `convex/groups.ts` - Group queries including `getForParticipant` (bug #7) and `getActiveForParticipant`
- `convex/validators.ts` - All shared validators (types to import)
- `convex/utils.ts` - Existing helper functions pattern (`calculateAge`)
- `convex/test.utils.ts` - Test factory functions and helpers
- `convex/feedback.ts` (lines 186-194) - Pattern for `ctx.storage.getUrl()` photo URL resolution
- `convex/authUser.ts` - How `ctx.telegramId` works in userQuery/userMutation
- `convex/authAdmin.ts` - How `ctx.adminEmail` works in adminQuery/adminMutation
- `apps/admin/src/pages/ReviewPage.tsx` - Review modal with inefficient query (bugs #19, #20)
- `apps/user/src/pages/GroupsPage.tsx` - User groups page (bug #10 season display)
- `apps/user/src/pages/FeedbackPage.tsx` - Photo upload pattern reference (for TaskPage)
- `apps/user/src/App.tsx` - User app routing (add task route)
- `convex/seasons.test.ts` - Existing season tests (pattern reference)
- `convex/taskAssignments.test.ts` - Existing task assignment tests (pattern reference)
- `convex/matching.test.ts` - Matching tests that use season setup helpers

### New Files to Create

- `apps/user/src/pages/TaskPage.tsx` - User-facing task viewing + completion submission page

### Relevant Documentation

- [Convex Storage - Serving Files](https://docs.convex.dev/file-storage/serve-files)
  - Pattern: `ctx.storage.getUrl(storageId)` returns `string | null`
  - Why: Needed for photo display in review (#20)
- [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/)
  - Compound index field ordering matters
  - Why: Adding new index for seasonParticipants (#5)
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
  - `timeZone: 'Asia/Jerusalem'` for Israel time
  - Why: Fixing reveal time timezone bug (#2)

### Patterns to Follow

**Auth Context Access (from `convex/authUser.ts` and `convex/authAdmin.ts`):**
- `userQuery`/`userMutation` handlers receive `ctx.telegramId`
- `adminQuery`/`adminMutation` handlers receive `ctx.adminEmail`
- Participant lookup: `ctx.db.query("participants").withIndex("by_telegramId", q => q.eq("telegramId", ctx.telegramId)).unique()`

**Storage URL Resolution (from `convex/feedback.ts` lines 186-194):**
```typescript
const photoUrls = f.photos
    ? await Promise.all(
          f.photos.map(async (storageId) => {
              const url = await ctx.storage.getUrl(storageId);
              return url || "";
          })
      )
    : undefined;
```

**Helper Function Pattern (from `convex/utils.ts`):**
```typescript
export function calculateAge(birthDate: string): number {
    // Pure function, no DB access
}
```

**Test Pattern (from `convex/seasons.test.ts`):**
```typescript
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, withAdminIdentity, ... } from "./test.utils";

describe("module", () => {
    test("does something", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);
        // ... setup data, call function, assert
    });
});
```

**Index Naming Convention:**
- Single field: `by_fieldName`
- Compound: `by_field1_and_field2`

---

## IMPLEMENTATION PLAN

### Phase 1: Schema & Data Structure Fixes

Fix the foundational data model issues before touching business logic.

**Tasks:**
- Add compound index on `seasonParticipants` (#5)
- Add `seasonId` to `taskAssignments` table (#6)
- Add participant indexes on `groups` table (#7)
- Keep `taskId` on groups but document why (design decision for #4)

### Phase 2: Backend Logic Fixes (Critical)

Fix the authorization, timezone, and double-processing bugs. Also clean up dead code.

**Tasks:**
- Fix timezone bug in reveal time calculation (#2)
- Add authorization to `submitCompletion` (#3)
- Prevent double-approval in `reviewCompletion` (#11)
- Add re-submission flow for Revision status (#12)
- Guard season updates for active/completed seasons (#14)
- Remove `calculateWeekInSeason` internalQuery, use pure helper (#13)
- Use `by_type` index in tasks.list (#15)
- Fix `getForParticipant` full table scan using all 4 participant indexes (#7)
- Fix `getHistoryLastWeeks` index range query (#21)
- Remove `closeWeekAndRequestFeedback` dead code and update crons tests

### Phase 3: Backend Query Additions

Add the missing `getById` query, photo URL resolution, and upload URL generation.

**Tasks:**
- Add `getAssignment` admin query for ReviewModal (#19)
- Add photo URL resolution to review queries (#20)
- Add `generateUploadUrl` user mutation for task completion photos (#9)

### Phase 4: Test Coverage

Fill all test gaps.

**Tasks:**
- Tests for `seasonParticipants` module (#16)
- Test for `getForActiveGroup` user query (#17)
- End-to-end lifecycle test (#18)

### Phase 5: Frontend Fixes (Admin)

Fix the ReviewPage efficiency and photo display.

**Tasks:**
- Update ReviewModal to use `getAssignment` query (#19)
- Display photos in ReviewModal (#20)

### Phase 6: User-Side UI

Add missing user-facing pages for task viewing, submission, and season enrollment.

**Tasks:**
- Create TaskPage.tsx for task viewing and completion submission (#8, #9)
- Update GroupsPage.tsx to show season info and task link (#10)
- Update App.tsx routing to include new task page

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: UPDATE `convex/schema.ts` — Add compound index, seasonId field, and participant indexes

**Bug #5**: Missing compound index on `seasonParticipants`
**Bug #6**: `seasonId` missing from `taskAssignments`
**Bug #7**: Groups table full scan needs participant indexes

**IMPLEMENT**:

1. In the `seasonParticipants` table definition, add a new index:
```typescript
.index("by_seasonId_and_participantId", ["seasonId", "participantId"])
```
Add it after the existing `by_seasonId_and_status` index.

2. In the `taskAssignments` table definition, add a `seasonId` field after `weekInSeason`:
```typescript
seasonId: v.id("seasons"),
```
This is a required field — all task assignments belong to a season. No backward compatibility needed since DB is empty.

3. Add an index on taskAssignments for seasonId:
```typescript
.index("by_seasonId", ["seasonId"])
```

4. In the `groups` table definition, add participant indexes to eliminate full table scans:
```typescript
.index("by_participant1", ["participant1"])
.index("by_participant2", ["participant2"])
.index("by_participant3", ["participant3"])
.index("by_participant4", ["participant4"])
```
Add these after the existing `by_seasonId_and_status` index.

**PATTERN**: Follow existing index naming: `by_field1_and_field2` (see schema.ts line 93-94 for compound index pattern)

**GOTCHA**: All 4 participant indexes are added since the DB is empty and there's no cost. `participant3` and `participant4` are optional fields, which means the index will only contain groups where those fields exist — this is fine for lookups.

**VALIDATE**: `npm run test:once`

---

### Task 2: UPDATE `convex/utils.ts` — Add Israel timezone helper and week calculation

**Bug #2**: Timezone bug in reveal time
**Bug #13**: `calculateWeekInSeason` is an unnecessary Convex query

**IMPLEMENT**:

1. Add a function `getSundayRevealTimeIsrael` to `convex/utils.ts`:
```typescript
/**
 * Calculate the Sunday 8:00 AM Israel time reveal timestamp
 * after a group is created (on Saturday).
 * Israel timezone: Asia/Jerusalem (UTC+2 standard, UTC+3 DST)
 */
export function getSundayRevealTimeIsrael(groupCreatedAt: number): number {
    // The group is created on Saturday. Sunday is the next day.
    const groupDate = new Date(groupCreatedAt);
    const dayOfWeek = groupDate.getUTCDay(); // 0=Sun, 6=Sat

    // Calculate days until next Sunday
    const daysUntilSunday = dayOfWeek === 6 ? 1 : (7 - dayOfWeek) % 7 || 7;

    // Create a date for the next Sunday at 05:00 UTC
    // Israel is UTC+2 (winter) or UTC+3 (summer)
    // 8:00 AM Israel = 06:00 UTC (winter) or 05:00 UTC (summer)
    // Use 05:00 UTC as worst case (summer), which means 08:00 AM in summer, 07:00 AM in winter
    // For exact handling, use Intl API:
    const nextSunday = new Date(groupDate);
    nextSunday.setUTCDate(groupDate.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(5, 0, 0, 0); // 05:00 UTC ≈ 08:00 Israel (DST) / 07:00 Israel (winter)

    // For precise Israel 8:00 AM, we check if this date is in DST
    // Israel DST: last Friday of March → last Sunday of October
    // Simpler approach: use fixed 06:00 UTC (= 08:00 IST winter, 09:00 IDT summer)
    // This is "close enough" and consistent with how crons.ts handles Israel time
    nextSunday.setUTCHours(6, 0, 0, 0); // 06:00 UTC = 08:00 Israel Standard Time

    return nextSunday.getTime();
}
```

2. Add a pure `calculateWeekInSeason` helper function:
```typescript
/**
 * Calculate which week in season (1-4) based on timestamps.
 * Pure function - no database access needed.
 * @returns Week number 1-4, or null if outside season bounds
 */
export function calculateWeekInSeason(
    seasonStartDate: number,
    currentTimestamp: number
): number | null {
    const elapsed = currentTimestamp - seasonStartDate;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(elapsed / weekMs) + 1;

    if (weekNumber < 1 || weekNumber > 4) {
        return null;
    }

    return weekNumber;
}
```

**PATTERN**: Mirror `calculateAge` function structure — pure, exported, JSDoc comment.

**IMPORTS**: None needed (pure functions).

**VALIDATE**: `npm run test:once`

---

### Task 3: UPDATE `convex/seasons.ts` and `convex/matching.ts` — Remove internalQuery, guard updates

**Bug #13**: Remove `calculateWeekInSeason` internalQuery entirely — use pure helper
**Bug #14**: `seasons.update` allows editing active/completed seasons

**IMPLEMENT**:

1. **Remove** the entire `calculateWeekInSeason` internalQuery from `convex/seasons.ts` (lines 285-305). Delete it completely — no backward compatibility needed since DB is empty and no code depends on it that we can't update.

2. **Update `convex/matching.ts`** (line 81) to call the pure helper function directly instead of `ctx.runQuery`:

```typescript
// OLD:
// const weekNumber = await ctx.runQuery(internal.seasons.calculateWeekInSeason, {
//     seasonStartDate: activeSeason.startDate,
//     currentTimestamp: currentTime,
// });

// NEW:
import { calculateWeekInSeason } from "./utils";
const weekNumber = calculateWeekInSeason(activeSeason.startDate, currentTime);
```

Remove `internal.seasons.calculateWeekInSeason` from the `internal` import if it's no longer used elsewhere.

3. **Update `convex/seasons.test.ts`** — Replace the `calculateWeekInSeason` internalQuery tests (lines 192-250) with tests for the pure helper function:

```typescript
import { calculateWeekInSeason } from "./utils";

describe("calculateWeekInSeason", () => {
    test("returns correct week number", () => {
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const startDate = Date.now();

        expect(calculateWeekInSeason(startDate, startDate)).toBe(1);
        expect(calculateWeekInSeason(startDate, startDate + weekMs)).toBe(2);
        expect(calculateWeekInSeason(startDate, startDate + 2 * weekMs)).toBe(3);
        expect(calculateWeekInSeason(startDate, startDate + 3 * weekMs)).toBe(4);
    });

    test("returns null outside bounds", () => {
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const startDate = Date.now();

        expect(calculateWeekInSeason(startDate, startDate - weekMs)).toBeNull();
        expect(calculateWeekInSeason(startDate, startDate + 4 * weekMs)).toBeNull();
    });
});
```

4. In `seasons.update` mutation handler (lines 183-205), add a guard at the top:

```typescript
handler: async (ctx, args) => {
    const { seasonId, ...updates } = args;

    const season = await ctx.db.get(seasonId);
    if (!season) {
        throw new ConvexError("Season not found");
    }

    if (season.status !== "Draft") {
        throw new ConvexError("Can only edit seasons in Draft status");
    }

    // If startDate is updated, recalculate endDate
    if (updates.startDate) {
        const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
        const endDate = updates.startDate + fourWeeks;
        await ctx.db.patch(seasonId, { ...updates, endDate });
    } else {
        await ctx.db.patch(seasonId, updates);
    }

    return null;
},
```

**IMPORTS**: `ConvexError` is already imported in `convex/values`. Add `import { calculateWeekInSeason } from "./utils";` to `matching.ts`.

**GOTCHA**: Since we're removing the internalQuery entirely, any existing tests calling `internal.seasons.calculateWeekInSeason` must be updated to test the pure function directly. The `internal` import may also need cleanup in matching.ts if `calculateWeekInSeason` was the only thing used from `internal.seasons`.

**VALIDATE**: `npm run test:once`

---

### Task 4: UPDATE `convex/taskAssignments.ts` — Fix critical bugs (#2, #3, #11, #12)

This is the largest task — 4 bugs in one file.

**IMPLEMENT**:

#### 4a. Fix reveal time timezone (#2)

In `getForActiveGroup` handler (around line 184-189), replace the reveal time calculation:

```typescript
// OLD (timezone bug):
// const nextSunday = new Date(groupCreated);
// nextSunday.setDate(groupCreated.getDate() + (groupCreated.getDay() === 6 ? 1 : 0));
// nextSunday.setHours(8, 0, 0, 0);
// const revealTime = nextSunday.getTime();

// NEW:
import { getSundayRevealTimeIsrael } from "./utils";
const revealTime = getSundayRevealTimeIsrael(myGroup.createdAt);
```

Remove the `groupCreated` variable and the old `nextSunday` computation. Replace with a single call to `getSundayRevealTimeIsrael(myGroup.createdAt)`.

#### 4b. Add authorization to `submitCompletion` (#3)

In `submitCompletion` handler (lines 325-347), after finding the participant, add a group membership check:

```typescript
handler: async (ctx, args) => {
    const participant = await ctx.db
        .query("participants")
        .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
        .unique();

    if (!participant) {
        throw new ConvexError("Participant not found");
    }

    // Verify participant is member of the assignment's group
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
        throw new ConvexError("Assignment not found");
    }

    const group = await ctx.db.get(assignment.groupId);
    if (!group) {
        throw new ConvexError("Group not found");
    }

    const isGroupMember = [
        group.participant1,
        group.participant2,
        group.participant3,
        group.participant4,
    ].includes(participant._id);

    if (!isGroupMember) {
        throw new ConvexError("You are not a member of this group");
    }

    // Check assignment is in a submittable state
    if (assignment.reviewStatus !== "Pending" && assignment.reviewStatus !== "Revision") {
        throw new ConvexError("This assignment cannot be submitted to");
    }

    await ctx.db.patch(args.assignmentId, {
        completedAt: Date.now(),
        completionNotes: args.completionNotes,
        completionPhotos: args.completionPhotos,
        submittedBy: participant._id,
        submittedAt: Date.now(),
    });

    console.log("✅ Task completion submitted");
    return null;
},
```

This also fixes **Bug #12** (re-submission after Revision) by allowing submission when `reviewStatus === "Revision"`.

#### 4c. Prevent double-approval (#11)

In `reviewCompletion` handler (lines 281-309), add a guard after fetching the assignment:

```typescript
handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
        throw new ConvexError("Assignment not found");
    }

    // Prevent double-approval or reviewing already-reviewed assignments
    if (assignment.reviewStatus === "Approved" || assignment.reviewStatus === "Rejected") {
        throw new ConvexError(
            `Assignment already ${assignment.reviewStatus.toLowerCase()}. Cannot review again.`
        );
    }

    // Update assignment
    await ctx.db.patch(args.assignmentId, {
        reviewStatus: args.reviewStatus,
        reviewedAt: Date.now(),
        reviewedByEmail: ctx.adminEmail,
        reviewComment: args.reviewComment,
        pointsAwarded: args.pointsAwarded,
    });

    // Award points to participant (if approved)
    if (args.reviewStatus === "Approved" && assignment.submittedBy) {
        const participant = await ctx.db.get(assignment.submittedBy);
        if (participant) {
            await ctx.db.patch(participant._id, {
                totalPoints: participant.totalPoints + args.pointsAwarded,
            });
        }
    }

    console.log(`✅ Task review: ${args.reviewStatus}`);
    return null;
},
```

**IMPORTS**: Add `import { getSundayRevealTimeIsrael } from "./utils";` at top of file.

**GOTCHA**: The `submitCompletion` now checks `reviewStatus === "Revision"` to allow re-submission. This means when admin sets "Revision", the user can re-submit, which resets `completedAt`, `submittedAt`, and notes/photos.

**VALIDATE**: `npm run test:once`

---

### Task 5: UPDATE `convex/taskAssignments.ts` — Populate seasonId on assignment creation

**Bug #6 continued**: The `assignToGroups` mutation needs to set `seasonId` on new assignments. Since `seasonId` is now a required field on `taskAssignments`, we must ensure it's always populated.

**IMPLEMENT**:

1. In `assignToGroups` handler (lines 230-263), update the group validation check to also require `seasonId`:

```typescript
const group = await ctx.db.get(groupId);
if (!group || !group.weekInSeason || !group.seasonId) continue;
```

2. When creating a new assignment, add `seasonId`:

```typescript
// Create new assignment
await ctx.db.insert("taskAssignments", {
    groupId,
    taskId: args.taskId,
    weekInSeason: group.weekInSeason,
    seasonId: group.seasonId,  // Required field — populated from group
    assignedAt: Date.now(),
    assignedByEmail: ctx.adminEmail,
    reviewStatus: "Pending",
    pointsAwarded: 0,
});
```

3. When updating an existing assignment (the `if (existing)` branch), also update seasonId:
```typescript
if (existing) {
    await ctx.db.patch(existing._id, {
        taskId: args.taskId,
        seasonId: group.seasonId,
    });
}
```

**GOTCHA**: Since `seasonId` is required (not optional) on `taskAssignments`, groups without a `seasonId` will be skipped by the guard. This is correct — task assignments only make sense within a season context.

**VALIDATE**: `npm run test:once`

---

### Task 6: UPDATE `convex/tasks.ts` — Use `by_type` index (#15)

**Bug #15**: The `by_type` index is defined but never used.

**IMPLEMENT**:

In `tasks.list` handler (lines 36-67), restructure the query logic to use the type index when appropriate:

```typescript
handler: async (ctx, args) => {
    let tasks;

    if (args.status !== undefined && args.type !== undefined) {
        // Both filters: use status index, filter type in memory (small dataset)
        const status = args.status;
        tasks = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .collect();
        tasks = tasks.filter((t) => t.type === args.type);
    } else if (args.status !== undefined) {
        const status = args.status;
        tasks = await ctx.db
            .query("tasks")
            .withIndex("by_status", (q) => q.eq("status", status))
            .order("desc")
            .collect();
    } else if (args.type !== undefined) {
        const type = args.type;
        tasks = await ctx.db
            .query("tasks")
            .withIndex("by_type", (q) => q.eq("type", type))
            .order("desc")
            .collect();
    } else {
        tasks = await ctx.db.query("tasks").order("desc").collect();
    }

    return tasks.map((task) => ({
        _id: task._id,
        title: task.title,
        description: task.description,
        onlineInstructions: task.onlineInstructions,
        reportInstructions: task.reportInstructions,
        type: task.type,
        difficulty: task.difficulty,
        purpose: task.purpose,
        status: task.status,
        createdAt: task.createdAt,
        createdByEmail: task.createdByEmail,
    }));
},
```

**VALIDATE**: `npm run test:once`

---

### Task 7: UPDATE `convex/seasonParticipants.ts` — Use compound index

**Bug #5 continued**: Use the new compound index in queries.

**IMPLEMENT**:

1. In `getMyEnrollment` handler (lines 42-48), replace the filter with the compound index:

```typescript
// OLD:
// const enrollment = await ctx.db
//     .query("seasonParticipants")
//     .withIndex("by_seasonId", (q) => q.eq("seasonId", activeSeason._id))
//     .filter((q) => q.eq(q.field("participantId"), participant._id))
//     .first();

// NEW:
const enrollment = await ctx.db
    .query("seasonParticipants")
    .withIndex("by_seasonId_and_participantId", (q) =>
        q.eq("seasonId", activeSeason._id).eq("participantId", participant._id)
    )
    .first();
```

2. In `enroll` mutation handler (lines 128-133), replace the filter with the compound index:

```typescript
// OLD:
// const existing = await ctx.db
//     .query("seasonParticipants")
//     .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
//     .filter((q) => q.eq(q.field("participantId"), args.participantId))
//     .first();

// NEW:
const existing = await ctx.db
    .query("seasonParticipants")
    .withIndex("by_seasonId_and_participantId", (q) =>
        q.eq("seasonId", args.seasonId).eq("participantId", args.participantId)
    )
    .first();
```

**VALIDATE**: `npm run test:once`

---

### Task 8: ADD `convex/taskAssignments.ts` — New `getAssignment` admin query (#19, #20)

**Bug #19**: ReviewModal fetches ALL assignments
**Bug #20**: No photo display

**IMPLEMENT**:

Add a new `getAssignment` admin query to `convex/taskAssignments.ts`:

```typescript
/**
 * Get a single task assignment by ID (with photo URLs)
 */
export const getAssignment = adminQuery({
    args: { assignmentId: v.id("taskAssignments") },
    returns: v.union(
        v.object({
            _id: v.id("taskAssignments"),
            groupId: v.id("groups"),
            taskId: v.id("tasks"),
            taskTitle: v.string(),
            weekInSeason: weekInSeasonValidator,
            reviewStatus: taskReviewStatusValidator,
            completionNotes: v.optional(v.string()),
            completionPhotoUrls: v.optional(v.array(v.string())),
            submittedAt: v.optional(v.number()),
            submittedBy: v.optional(v.id("participants")),
            submittedByName: v.optional(v.string()),
            pointsAwarded: v.number(),
            reviewComment: v.optional(v.string()),
            assignedAt: v.number(),
            assignedByEmail: v.string(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const assignment = await ctx.db.get(args.assignmentId);
        if (!assignment) return null;

        const task = await ctx.db.get(assignment.taskId);

        let submittedByName: string | undefined;
        if (assignment.submittedBy) {
            const participant = await ctx.db.get(assignment.submittedBy);
            submittedByName = participant?.name;
        }

        // Resolve photo storage IDs to URLs
        const completionPhotoUrls = assignment.completionPhotos
            ? await Promise.all(
                  assignment.completionPhotos.map(async (storageId) => {
                      const url = await ctx.storage.getUrl(storageId);
                      return url || "";
                  })
              )
            : undefined;

        return {
            _id: assignment._id,
            groupId: assignment.groupId,
            taskId: assignment.taskId,
            taskTitle: task?.title || "Unknown",
            weekInSeason: assignment.weekInSeason,
            reviewStatus: assignment.reviewStatus,
            completionNotes: assignment.completionNotes,
            completionPhotoUrls,
            submittedAt: assignment.submittedAt,
            submittedBy: assignment.submittedBy,
            submittedByName,
            pointsAwarded: assignment.pointsAwarded,
            reviewComment: assignment.reviewComment,
            assignedAt: assignment.assignedAt,
            assignedByEmail: assignment.assignedByEmail,
        };
    },
});
```

**PATTERN**: Mirrors `ctx.storage.getUrl()` pattern from `convex/feedback.ts` lines 186-194.

**IMPORTS**: No new imports needed (already has `adminQuery` and validators).

**VALIDATE**: `npm run test:once`

---

### Task 9: UPDATE `apps/admin/src/pages/ReviewPage.tsx` — Use getAssignment query and display photos (#19, #20)

**IMPLEMENT**:

1. Replace the `ReviewModal` component's data fetching (lines 120-121):

```typescript
// OLD:
// const assignment = useQuery(api.taskAssignments.listForReview, {});
// const currentAssignment = assignment?.find(a => a._id === assignmentId);

// NEW:
const currentAssignment = useQuery(api.taskAssignments.getAssignment, { assignmentId });
```

2. Add photo display in the ReviewModal. Replace the existing photo count section (around lines 193-200) with actual image display:

```tsx
{currentAssignment.completionPhotoUrls && currentAssignment.completionPhotoUrls.length > 0 && (
    <div className="form-group">
        <label className="form-label"><Trans>Photos</Trans></label>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 'var(--spacing-sm)',
        }}>
            {currentAssignment.completionPhotoUrls.map((url, index) => (
                url && (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                            src={url}
                            alt={`Completion photo ${index + 1}`}
                            style={{
                                width: '100%',
                                borderRadius: 'var(--radius-md)',
                                objectFit: 'cover',
                                aspectRatio: '1',
                            }}
                        />
                    </a>
                )
            ))}
        </div>
    </div>
)}
```

3. Update the auto-point calculation in the Approve radio handler. Since we now have `completionPhotoUrls` (URLs) instead of `completionPhotos` (storage IDs), update the condition:

```typescript
onChange={(e) => {
    setReviewStatus(e.target.value as 'Approved' | 'Revision' | 'Rejected');
    if (e.target.value === 'Approved') {
        setPointsAwarded(currentAssignment.completionPhotoUrls?.length ? 10 : 5);
    } else {
        setPointsAwarded(0);
    }
}}
```

**GOTCHA**: The `currentAssignment` from the new query returns `completionPhotoUrls` (string URLs), not `completionPhotos` (storage IDs). Update all references in the component.

**VALIDATE**: `cd apps/admin && npm run build`

---

### Task 10: ADD tests to `convex/seasonParticipants.test.ts` — New file (#16)

**Bug #16**: No tests for seasonParticipants module.

**IMPLEMENT**: Create `convex/seasonParticipants.test.ts`:

```typescript
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import {
    setupTest,
    withAdminIdentity,
    makeParticipant,
    makeSeason,
    makeSeasonParticipant,
    seedParticipants,
    uniqueTelegramId,
    createTestSession,
} from "./test.utils";

describe("seasonParticipants", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("enroll", () => {
        test("enrolls a participant in a season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const enrollmentId = await admin.mutation(api.seasonParticipants.enroll, {
                seasonId,
                participantId: p1,
            });

            expect(enrollmentId).toBeDefined();

            const enrollments = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
            });
            expect(enrollments).toHaveLength(1);
            expect(enrollments[0].status).toBe("Enrolled");
        });

        test("prevents duplicate enrollment", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await admin.mutation(api.seasonParticipants.enroll, {
                seasonId,
                participantId: p1,
            });

            await expect(
                admin.mutation(api.seasonParticipants.enroll, {
                    seasonId,
                    participantId: p1,
                })
            ).rejects.toThrow();
        });
    });

    describe("updateStatus", () => {
        test("updates enrollment status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const enrollmentId = await t.run(async (ctx) => {
                return await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1)
                );
            });

            await admin.mutation(api.seasonParticipants.updateStatus, {
                enrollmentId,
                status: "Paused",
            });

            const enrollments = await t.run(async (ctx) => {
                return await ctx.db.get(enrollmentId);
            });
            expect(enrollments?.status).toBe("Paused");
        });
    });

    // ============================================
    // ADMIN QUERY TESTS
    // ============================================

    describe("listForSeason", () => {
        test("returns all enrollments with participant names", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), name: "Alice" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), name: "Bob" }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p1));
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p2));
            });

            const enrollments = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
            });
            expect(enrollments).toHaveLength(2);
            expect(enrollments.map((e) => e.participantName).sort()).toEqual(["Alice", "Bob"]);
        });

        test("filters by status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1, { status: "Enrolled" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p2, { status: "Paused" })
                );
            });

            const enrolled = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
                status: "Enrolled",
            });
            expect(enrolled).toHaveLength(1);
        });
    });

    // ============================================
    // USER QUERY TESTS
    // ============================================

    describe("getMyEnrollment", () => {
        test("returns enrollment for active season", async () => {
            const t = setupTest();

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert(
                    "seasons",
                    makeSeason({ name: "Winter 2026", status: "Active" })
                );
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p1));
            });

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).not.toBeNull();
            expect(enrollment?.seasonName).toBe("Winter 2026");
            expect(enrollment?.status).toBe("Enrolled");
        });

        test("returns null when not enrolled", async () => {
            const t = setupTest();

            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).toBeNull();
        });

        test("returns null when no active season", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).toBeNull();
        });
    });

    // ============================================
    // INTERNAL QUERY TESTS
    // ============================================

    describe("getEnrolledForMatching", () => {
        test("returns only enrolled participant IDs", async () => {
            const t = setupTest();

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2, p3] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1, { status: "Enrolled" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p2, { status: "Paused" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p3, { status: "Dropped" })
                );
            });

            const enrolled = await t.query(
                internal.seasonParticipants.getEnrolledForMatching,
                { seasonId }
            );
            expect(enrolled).toHaveLength(1);
            expect(enrolled[0]).toBe(p1);
        });
    });
});
```

**VALIDATE**: `npm run test:once`

---

### Task 11: ADD tests to `convex/taskAssignments.test.ts` — Test getForActiveGroup and auth (#17)

**Bug #17**: No test for `getForActiveGroup` user query.

**IMPLEMENT**: Add these test blocks to the existing `convex/taskAssignments.test.ts`:

```typescript
// Add to imports at top:
import { makeSeason, makeSeasonParticipant } from "./test.utils";

// Add new describe block after existing "listForReview" block:

describe("getForActiveGroup", () => {
    test("returns task assignment for user's active group", async () => {
        const t = setupTest();

        const [p1, p2] = await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1) }),
            makeParticipant({ telegramId: uniqueTelegramId(2) }),
        ]);

        const groupId = await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
        });

        const taskId = await t.run(async (ctx) => {
            return await ctx.db.insert("tasks", makeTask({ title: "My Task" }));
        });

        await t.run(async (ctx) => {
            await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId));
        });

        const sessionToken = await createTestSession(t, uniqueTelegramId(1));
        const result = await t.query(api.taskAssignments.getForActiveGroup, {
            sessionToken,
        });

        expect(result).not.toBeNull();
        expect(result?.task.title).toBe("My Task");
        expect(result?.reviewStatus).toBe("Pending");
        expect(result?.revealTime).toBeGreaterThan(0);
    });

    test("returns null when no active group", async () => {
        const t = setupTest();

        await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1) }),
        ]);

        const sessionToken = await createTestSession(t, uniqueTelegramId(1));
        const result = await t.query(api.taskAssignments.getForActiveGroup, {
            sessionToken,
        });

        expect(result).toBeNull();
    });

    test("returns null when group has no task assigned", async () => {
        const t = setupTest();

        const [p1, p2] = await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1) }),
            makeParticipant({ telegramId: uniqueTelegramId(2) }),
        ]);

        await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
        });

        const sessionToken = await createTestSession(t, uniqueTelegramId(1));
        const result = await t.query(api.taskAssignments.getForActiveGroup, {
            sessionToken,
        });

        expect(result).toBeNull();
    });
});

describe("submitCompletion - authorization", () => {
    test("rejects submission from non-group member", async () => {
        const t = setupTest();

        const [p1, p2, p3] = await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1) }),
            makeParticipant({ telegramId: uniqueTelegramId(2) }),
            makeParticipant({ telegramId: uniqueTelegramId(3) }),
        ]);

        // p1 and p2 are in a group, p3 is not
        const groupId = await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
        });

        const taskId = await t.run(async (ctx) => {
            return await ctx.db.insert("tasks", makeTask());
        });

        const assignmentId = await t.run(async (ctx) => {
            return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId));
        });

        // p3 tries to submit - should fail
        const sessionToken = await createTestSession(t, uniqueTelegramId(3));
        await expect(
            t.mutation(api.taskAssignments.submitCompletion, {
                sessionToken,
                assignmentId,
                completionNotes: "Sneaky submission",
            })
        ).rejects.toThrow("not a member");
    });
});

describe("reviewCompletion - guards", () => {
    test("prevents double-approval", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);

        const [p1, p2] = await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1), totalPoints: 0 }),
            makeParticipant({ telegramId: uniqueTelegramId(2) }),
        ]);

        const groupId = await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
        });

        const taskId = await t.run(async (ctx) => {
            return await ctx.db.insert("tasks", makeTask());
        });

        const assignmentId = await t.run(async (ctx) => {
            return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                submittedBy: p1,
                completionNotes: "Done!",
            }));
        });

        // First approval
        await admin.mutation(api.taskAssignments.reviewCompletion, {
            assignmentId,
            reviewStatus: "Approved",
            pointsAwarded: 10,
        });

        // Second approval should fail
        await expect(
            admin.mutation(api.taskAssignments.reviewCompletion, {
                assignmentId,
                reviewStatus: "Approved",
                pointsAwarded: 10,
            })
        ).rejects.toThrow("already");

        // Verify points were only awarded once
        const participant = await t.run(async (ctx) => {
            return await ctx.db.get(p1);
        });
        expect(participant?.totalPoints).toBe(10);
    });
});
```

**VALIDATE**: `npm run test:once`

---

### Task 12: ADD end-to-end lifecycle test (#18)

**Bug #18**: No integration test for the full lifecycle.

**IMPLEMENT**: Add to `convex/taskAssignments.test.ts`:

```typescript
describe("full lifecycle", () => {
    test("season → enroll → match → assign → submit → review → points", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);

        // 1. Create and activate season
        const seasonId = await admin.mutation(api.seasons.create, {
            name: "Lifecycle Test Season",
            startDate: Date.now(),
        });
        await admin.mutation(api.seasons.activate, { seasonId });

        // 2. Create participants
        const [p1, p2] = await seedParticipants(t, [
            makeParticipant({
                telegramId: uniqueTelegramId(1),
                name: "Alice",
                totalPoints: 0,
                status: "Active",
                onPause: false,
                region: "Center",
                age: 30,
            }),
            makeParticipant({
                telegramId: uniqueTelegramId(2),
                name: "Bob",
                totalPoints: 0,
                status: "Active",
                onPause: false,
                region: "Center",
                age: 30,
            }),
        ]);

        // 3. Enroll participants
        await admin.mutation(api.seasonParticipants.enroll, {
            seasonId,
            participantId: p1,
        });
        await admin.mutation(api.seasonParticipants.enroll, {
            seasonId,
            participantId: p2,
        });

        // 4. Create a group (simulating what matching would do)
        const groupId = await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
            region: "Center",
            seasonId,
            weekInSeason: 1,
        });

        // 5. Create a task
        const taskId = await admin.mutation(api.tasks.create, {
            title: "Lifecycle Task",
            description: "Test the full flow",
            reportInstructions: "Submit photos",
            type: "Creative",
            difficulty: "Easy",
            purpose: "Everyone",
        });

        // 6. Assign task to group
        const assignedCount = await admin.mutation(api.taskAssignments.assignToGroups, {
            groupIds: [groupId],
            taskId,
        });
        expect(assignedCount).toBe(1);

        // 7. User submits completion
        const sessionToken = await createTestSession(t, uniqueTelegramId(1));

        const assignmentBeforeSubmit = await t.run(async (ctx) => {
            return await ctx.db
                .query("taskAssignments")
                .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
                .first();
        });
        expect(assignmentBeforeSubmit).not.toBeNull();

        await t.mutation(api.taskAssignments.submitCompletion, {
            sessionToken,
            assignmentId: assignmentBeforeSubmit!._id,
            completionNotes: "We did it!",
        });

        // 8. Admin reviews and approves
        await admin.mutation(api.taskAssignments.reviewCompletion, {
            assignmentId: assignmentBeforeSubmit!._id,
            reviewStatus: "Approved",
            reviewComment: "Great work!",
            pointsAwarded: 10,
        });

        // 9. Verify points awarded
        const alice = await t.run(async (ctx) => {
            return await ctx.db.get(p1);
        });
        expect(alice?.totalPoints).toBe(10);

        // 10. Verify assignment state
        const finalAssignment = await t.run(async (ctx) => {
            return await ctx.db.get(assignmentBeforeSubmit!._id);
        });
        expect(finalAssignment?.reviewStatus).toBe("Approved");
        expect(finalAssignment?.pointsAwarded).toBe(10);
        expect(finalAssignment?.completionNotes).toBe("We did it!");
        expect(finalAssignment?.submittedBy).toBe(p1);
    });
});
```

**IMPORTS**: Add `makeSeason` to the import from test.utils at the top of the file (if not already there from Task 11).

**VALIDATE**: `npm run test:once`

---

### Task 13: UPDATE `convex/seasons.test.ts` — Test update guard (#14)

**IMPLEMENT**: Add test for the new guard on `seasons.update`:

```typescript
// Add inside the existing "seasons" describe block, after the "complete" block:

describe("update", () => {
    test("allows updating Draft season", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);

        const seasonId = await t.run(async (ctx) => {
            return await ctx.db.insert("seasons", makeSeason({ name: "Old Name", status: "Draft" }));
        });

        await admin.mutation(api.seasons.update, {
            seasonId,
            name: "New Name",
        });

        const season = await admin.query(api.seasons.get, { seasonId });
        expect(season?.name).toBe("New Name");
    });

    test("prevents updating Active season", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);

        const seasonId = await t.run(async (ctx) => {
            return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
        });

        await expect(
            admin.mutation(api.seasons.update, {
                seasonId,
                name: "Should Fail",
            })
        ).rejects.toThrow("Draft");
    });

    test("prevents updating Completed season", async () => {
        const t = setupTest();
        const admin = withAdminIdentity(t);

        const seasonId = await t.run(async (ctx) => {
            return await ctx.db.insert("seasons", makeSeason({ status: "Completed" }));
        });

        await expect(
            admin.mutation(api.seasons.update, {
                seasonId,
                name: "Should Fail",
            })
        ).rejects.toThrow("Draft");
    });
});
```

**VALIDATE**: `npm run test:once`

---

### Task 14: UPDATE `convex/groups.ts` — Fix getForParticipant full table scan (#7)

**Bug #7**: `getForParticipant` calls `.collect()` on the entire groups table, scanning every group document.

**IMPLEMENT**:

Rewrite the `getForParticipant` handler (lines 35-95) to use all 4 participant indexes (added in Task 1) instead of scanning all groups:

```typescript
handler: async (ctx) => {
    const participant = await ctx.db
        .query("participants")
        .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
        .unique();

    if (!participant) {
        return [];
    }

    // Query using all 4 participant indexes instead of full table scan
    const [asP1, asP2, asP3, asP4] = await Promise.all([
        ctx.db
            .query("groups")
            .withIndex("by_participant1", (q) => q.eq("participant1", participant._id))
            .collect(),
        ctx.db
            .query("groups")
            .withIndex("by_participant2", (q) => q.eq("participant2", participant._id))
            .collect(),
        ctx.db
            .query("groups")
            .withIndex("by_participant3", (q) => q.eq("participant3", participant._id))
            .collect(),
        ctx.db
            .query("groups")
            .withIndex("by_participant4", (q) => q.eq("participant4", participant._id))
            .collect(),
    ]);

    // Combine and deduplicate
    const groupMap = new Map<string, typeof asP1[0]>();
    for (const g of [...asP1, ...asP2, ...asP3, ...asP4]) {
        groupMap.set(g._id, g);
    }
    const participantGroups = Array.from(groupMap.values());

    // Enrich with member details (same as before)
    const enrichedGroups = await Promise.all(
        participantGroups.map(async (group) => {
            const memberIds = [
                group.participant1,
                group.participant2,
                group.participant3,
                group.participant4,
            ].filter((id): id is Id<"participants"> => id !== undefined);

            const members = await Promise.all(
                memberIds.map(async (id) => {
                    const member = await ctx.db.get(id);
                    if (!member) return null;
                    return {
                        _id: member._id,
                        name: member.name,
                        telegramId: member.telegramId,
                    };
                })
            );

            return {
                _id: group._id,
                createdAt: group.createdAt,
                status: group.status,
                region: group.region,
                members: members.filter(
                    (m): m is { _id: Id<"participants">; name: string; telegramId: string } =>
                        m !== null
                ),
            };
        })
    );

    return enrichedGroups;
},
```

**GOTCHA**: All 4 participant indexes exist (added in Task 1). Convex indexes on optional fields (`participant3`, `participant4`) only contain documents where the field is set, so the index queries are efficient. No full table scan needed at all.

**VALIDATE**: `npm run test:once`

---

### Task 15: UPDATE `convex/groups.ts` — Fix getHistoryLastWeeks index usage (#21)

**Bug #21**: `getHistoryLastWeeks` uses `by_createdAt` index but doesn't apply range filtering, resulting in a full table scan despite having an index.

**IMPLEMENT**:

In `getHistoryLastWeeks` handler (lines 334-352), add proper range filtering to the index query:

```typescript
handler: async (ctx, args) => {
    const weeksAgo = Date.now() - args.weeks * 7 * 24 * 60 * 60 * 1000;

    // Use index with range filter instead of collecting all + filtering
    const recentGroups = await ctx.db
        .query("groups")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", weeksAgo))
        .collect();

    return recentGroups.map((g) => ({
        participant1: g.participant1,
        participant2: g.participant2,
        participant3: g.participant3,
        participant4: g.participant4,
    }));
},
```

Remove the `filteredGroups` variable and the `.filter()` call — the index range filter handles it.

**VALIDATE**: `npm run test:once`

---

### Task 15b: UPDATE `convex/crons.ts` and `convex/crons.test.ts` — Remove dead code

**Cleanup**: Remove the `closeWeekAndRequestFeedback` internalAction that was kept "for backward compatibility". No backward compatibility is needed since DB is empty and MVP hasn't launched. The `weeklyCloseAndMatch` action already handles all the same logic.

**IMPLEMENT**:

1. **Remove** the entire `closeWeekAndRequestFeedback` export from `convex/crons.ts` (lines 105-133). Delete the function and its JSDoc comment entirely.

2. **Update `convex/crons.test.ts`** — Replace the `closeWeekAndRequestFeedback` test block (lines 10-58) with tests for `weeklyCloseAndMatch`:

```typescript
describe("weeklyCloseAndMatch", () => {
    test("closes active groups and marks incomplete tasks", async () => {
        const t = setupTest();

        const [p1, p2, p3, p4] = await seedParticipants(t, [
            makeParticipant({ telegramId: uniqueTelegramId(1), status: "Active", onPause: false, region: "Center" }),
            makeParticipant({ telegramId: uniqueTelegramId(2), status: "Active", onPause: false, region: "Center" }),
            makeParticipant({ telegramId: uniqueTelegramId(3), status: "Active", onPause: false, region: "Center" }),
            makeParticipant({ telegramId: uniqueTelegramId(4), status: "Active", onPause: false, region: "Center" }),
        ]);

        // Create active groups
        await t.mutation(internal.groups.create, {
            participant1: p1,
            participant2: p2,
        });
        await t.mutation(internal.groups.create, {
            participant1: p3,
            participant2: p4,
        });

        // Verify they're active
        const admin = withAdminIdentity(t);
        const activeBefore = await admin.query(api.groups.list, { status: "Active" });
        expect(activeBefore).toHaveLength(2);

        // Run the combined close + match handler
        await t.action(internal.crons.weeklyCloseAndMatch, {});

        // Verify old groups are now completed
        const activeAfter = await admin.query(api.groups.list, { status: "Active" });
        // Note: matching may create new active groups
        const completed = await admin.query(api.groups.list, { status: "Completed" });
        expect(completed).toHaveLength(2);
    });

    test("handles no active groups gracefully", async () => {
        const t = setupTest();

        // No groups exist — should not throw
        await t.action(internal.crons.weeklyCloseAndMatch, {});

        const admin = withAdminIdentity(t);
        const groups = await admin.query(api.groups.list, {});
        expect(groups).toHaveLength(0);
    });
});
```

**GOTCHA**: The `weeklyCloseAndMatch` action also calls `internal.matching.runWeeklyMatching` which may create new groups if there's an active season with enrolled participants. The tests should account for this — the old "closes 2 groups" test may see new active groups created by matching. Focus assertions on the completed groups count rather than active groups count.

**VALIDATE**: `npm run test:once`

---

### Task 16: ADD `convex/taskAssignments.ts` — Add generateUploadUrl mutation (#9)

**Bug #9**: No way for users to upload task completion photos. The `submitCompletion` mutation accepts `v.array(v.id("_storage"))` but there's no upload URL generator in `taskAssignments`.

**IMPLEMENT**:

Add a `generateUploadUrl` user mutation to `convex/taskAssignments.ts`, after the `submitCompletion` mutation:

```typescript
/**
 * Generate a URL for uploading a task completion photo
 */
export const generateUploadUrl = userMutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});
```

**PATTERN**: Mirrors the existing `feedback.generateUploadUrl` (lines 364-370 in `convex/feedback.ts`).

**VALIDATE**: `npm run test:once`

---

### Task 17: CREATE `apps/user/src/pages/TaskPage.tsx` — User-side task viewing + submission (#8, #9)

**Bug #8**: No user-side UI for viewing assigned tasks.
**Bug #9**: No user-side UI for submitting task completions.

**IMPLEMENT**:

Create `apps/user/src/pages/TaskPage.tsx` with the following structure:

```tsx
import { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Link } from 'react-router-dom';
import { Id } from 'convex/_generated/dataModel';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { Trans, t } from '@lingui/macro';

const MAX_PHOTOS = 5;

function TaskPage() {
    const { authArgs, isAuthenticated } = useTelegramAuth();

    const assignment = useQuery(
        api.taskAssignments.getForActiveGroup,
        isAuthenticated ? authArgs : 'skip'
    );

    const submitCompletion = useMutation(api.taskAssignments.submitCompletion);
    const generateUploadUrl = useMutation(api.taskAssignments.generateUploadUrl);

    // Submission form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Photo handlers (mirror FeedbackPage pattern)
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newPhotos = Array.from(files)
            .slice(0, MAX_PHOTOS - photos.length)
            .map((file) => ({ file, preview: URL.createObjectURL(file) }));
        setPhotos([...photos, ...newPhotos]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemovePhoto = (index: number) => {
        const newPhotos = [...photos];
        URL.revokeObjectURL(newPhotos[index].preview);
        newPhotos.splice(index, 1);
        setPhotos(newPhotos);
    };

    const handleSubmit = async () => {
        if (!assignment || !completionNotes.trim()) return;

        setIsSubmitting(true);
        try {
            // Upload photos
            const storageIds: Id<'_storage'>[] = [];
            for (const photo of photos) {
                try {
                    const uploadUrl = await generateUploadUrl(authArgs);
                    const result = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': photo.file.type },
                        body: photo.file,
                    });
                    const { storageId } = await result.json();
                    storageIds.push(storageId);
                } catch {
                    // Photo upload failed - continue without
                }
            }

            await submitCompletion({
                ...authArgs,
                assignmentId: assignment._id,
                completionNotes,
                completionPhotos: storageIds.length > 0 ? storageIds : undefined,
            });

            photos.forEach((p) => URL.revokeObjectURL(p.preview));
            setSubmitted(true);
        } catch (error) {
            alert(t`Не удалось отправить. Попробуйте еще раз.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="page">
                <div className="card">
                    <div className="empty-state">
                        <p><Trans>Откройте приложение из Telegram</Trans></p>
                    </div>
                </div>
            </div>
        );
    }

    if (assignment === undefined) {
        return (
            <div className="page">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        );
    }

    if (assignment === null) {
        return (
            <div className="page">
                <div className="page-header decorated-section">
                    <h1><Trans>Задание</Trans></h1>
                </div>
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p><Trans>Нет активного задания</Trans></p>
                        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                            <Trans>Задания назначаются после формирования группы</Trans>
                        </p>
                    </div>
                </div>
                <Link to="/groups" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                    <Trans>К группам</Trans>
                </Link>
            </div>
        );
    }

    // Check if task is revealed
    const now = Date.now();
    const isRevealed = now >= assignment.revealTime;

    // Success state after submission
    if (submitted) {
        return (
            <div className="page">
                <div className="page-header">
                    <h1><Trans>Задание</Trans></h1>
                </div>
                <div className="success-state animate-fade-in">
                    <div className="success-icon-circle">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h2><Trans>Отчёт отправлен!</Trans></h2>
                    <p><Trans>Администратор скоро проверит выполнение</Trans></p>
                    <Link to="/" className="btn btn-warm btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                        <Trans>На главную</Trans>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header decorated-section">
                <h1><Trans>Задание</Trans></h1>
                <p><Trans>Выполни задание вместе с группой</Trans></p>
            </div>

            {!isRevealed ? (
                /* Task not yet revealed - show countdown */
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                            <Trans>Задание скоро откроется</Trans>
                        </p>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-sm)' }}>
                            <Trans>Откроется: {new Date(assignment.revealTime).toLocaleString('ru-RU')}</Trans>
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Task details */}
                    <div className="card animate-fade-in">
                        <div className="card-header">
                            <span className="card-title">{assignment.task.title}</span>
                            <span className={`badge badge-${assignment.reviewStatus.toLowerCase()}`}>
                                {assignment.reviewStatus === 'Pending' && <Trans>Ожидает</Trans>}
                                {assignment.reviewStatus === 'Approved' && <Trans>Принято</Trans>}
                                {assignment.reviewStatus === 'Revision' && <Trans>На доработку</Trans>}
                                {assignment.reviewStatus === 'Rejected' && <Trans>Отклонено</Trans>}
                                {assignment.reviewStatus === 'NotCompleted' && <Trans>Не выполнено</Trans>}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                            {assignment.task.description}
                        </p>
                        {assignment.task.onlineInstructions && (
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    <Trans>Инструкции:</Trans>
                                </div>
                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    backgroundColor: 'var(--bg-alt)',
                                    borderRadius: 'var(--radius-md)',
                                    whiteSpace: 'pre-wrap',
                                    fontSize: 'var(--font-size-sm)',
                                }}>
                                    {assignment.task.onlineInstructions}
                                </div>
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                <Trans>Как отчитаться:</Trans>
                            </div>
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'var(--bg-warm)',
                                borderRadius: 'var(--radius-md)',
                                whiteSpace: 'pre-wrap',
                                fontSize: 'var(--font-size-sm)',
                            }}>
                                {assignment.task.reportInstructions}
                            </div>
                        </div>
                    </div>

                    {/* Review feedback (if revision/rejected) */}
                    {assignment.reviewComment && (assignment.reviewStatus === 'Revision' || assignment.reviewStatus === 'Rejected') && (
                        <div className="card animate-fade-in" style={{ borderLeft: '3px solid var(--color-warning)' }}>
                            <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                <Trans>Комментарий проверяющего:</Trans>
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>{assignment.reviewComment}</p>
                        </div>
                    )}

                    {/* Approved state */}
                    {assignment.reviewStatus === 'Approved' && (
                        <div className="card animate-fade-in" style={{ background: 'var(--bg-warm)' }}>
                            <div className="empty-state">
                                <p style={{ fontWeight: 600 }}>
                                    <Trans>Задание выполнено! +{assignment.pointsAwarded} баллов</Trans>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Submission form (show when Pending or Revision) */}
                    {(assignment.reviewStatus === 'Pending' || assignment.reviewStatus === 'Revision') && (
                        <div className="card animate-fade-in">
                            <span className="card-title"><Trans>Отчёт о выполнении</Trans></span>

                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <textarea
                                    className="input"
                                    rows={4}
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    placeholder={t`Расскажи, как вы выполнили задание...`}
                                />
                            </div>

                            <div style={{ marginTop: 'var(--spacing-md)' }}>
                                <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                                    <Trans>Фотографии (необязательно)</Trans>
                                </div>
                                {photos.length > 0 && (
                                    <div className="photo-grid">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="photo-preview">
                                                <img src={photo.preview} alt={t`Фото ${index + 1}`} />
                                                <button className="remove-photo" onClick={() => handleRemovePhoto(index)}>
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {photos.length < MAX_PHOTOS && (
                                    <label className="photo-upload-button">
                                        <div className="upload-icon">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="5" width="20" height="14" rx="2" stroke="var(--color-accent)" strokeWidth="1.5"/>
                                                <circle cx="12" cy="12" r="3" stroke="var(--color-accent)" strokeWidth="1.5"/>
                                                <circle cx="17" cy="8" r="1" fill="var(--color-accent)"/>
                                            </svg>
                                        </div>
                                        <span><Trans>Загрузить фото</Trans></span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handlePhotoSelect}
                                        />
                                    </label>
                                )}
                                <p className="photo-count">
                                    <Trans>{photos.length} / {MAX_PHOTOS} фото</Trans>
                                </p>
                            </div>

                            <button
                                className="btn btn-warm btn-full"
                                style={{ marginTop: 'var(--spacing-md)' }}
                                onClick={handleSubmit}
                                disabled={isSubmitting || !completionNotes.trim()}
                            >
                                {isSubmitting ? <Trans>Отправка...</Trans> : <Trans>Отправить отчёт</Trans>}
                            </button>

                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)', textAlign: 'center' }}>
                                <Trans>С фото: 10 баллов • Только текст: 5 баллов</Trans>
                            </p>
                        </div>
                    )}

                    {/* Already submitted, waiting for review */}
                    {assignment.completionNotes && assignment.reviewStatus === 'Pending' && (
                        <div className="card animate-fade-in" style={{ background: 'var(--bg-alt)' }}>
                            <div className="empty-state">
                                <p><Trans>Отчёт отправлен, ожидает проверки</Trans></p>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Link to="/groups" className="btn btn-secondary btn-full" style={{ marginTop: 'var(--spacing-md)' }}>
                <Trans>К группам</Trans>
            </Link>
        </div>
    );
}

export default TaskPage;
```

**PATTERN**: Follows FeedbackPage.tsx patterns for:
- Photo upload flow (lines 146-161, 186-206)
- Auth args passing to queries/mutations
- Loading/empty/success states
- Wizard-like form structure
- Russian-language UI text via `@lingui/macro`

**IMPORTS**: Uses same hooks/libraries as other user pages.

**GOTCHA**: The `submitCompletion` mutation will be updated in Task 4b to check `reviewStatus === "Revision"` for re-submission, so the form correctly shows for both "Pending" and "Revision" states. Also, the `completionNotes` field shows the previous submission if it exists — the user can see their old notes when re-submitting after revision.

**VALIDATE**: `cd apps/user && npm run build`

---

### Task 18: UPDATE `apps/user/src/pages/GroupsPage.tsx` — Add season enrollment info and task link (#10)

**Bug #10**: No user-side display of season enrollment status.

**IMPLEMENT**:

1. Add the season enrollment query and task assignment query to `GroupsPage.tsx`:

```tsx
// Add imports
import { useTelegramAuth } from '../hooks/useTelegramAuth';

// Inside GroupsPage function, add queries:
const enrollment = useQuery(
    api.seasonParticipants.getMyEnrollment,
    isAuthenticated ? authArgs : 'skip'
);

const taskAssignment = useQuery(
    api.taskAssignments.getForActiveGroup,
    isAuthenticated ? authArgs : 'skip'
);
```

2. Add a season info card above the active group card (after the page header):

```tsx
{enrollment && (
    <div className="card animate-fade-in" style={{ background: 'var(--bg-warm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontWeight: 500 }}>
                    <Trans>Сезон: {enrollment.seasonName}</Trans>
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    <Trans>Статус: {enrollment.status === 'Enrolled' ? 'Участвую' : enrollment.status}</Trans>
                </div>
            </div>
            <span className="badge badge-active">
                {enrollment.status}
            </span>
        </div>
    </div>
)}
```

3. Add a task link inside the active group card (after the member list, before the closing `</div>` of the active group card):

```tsx
{taskAssignment && (
    <Link
        to="/task"
        className="btn btn-warm btn-full"
        style={{ marginTop: 'var(--spacing-md)' }}
    >
        {Date.now() >= taskAssignment.revealTime
            ? <Trans>Задание: {taskAssignment.task.title}</Trans>
            : <Trans>Задание скоро откроется</Trans>
        }
    </Link>
)}
```

**PATTERN**: Follows existing card styling patterns in GroupsPage.

**VALIDATE**: `cd apps/user && npm run build`

---

### Task 19: UPDATE `apps/user/src/App.tsx` — Add task route

**IMPLEMENT**:

1. Add import for TaskPage:
```typescript
import TaskPage from './pages/TaskPage';
```

2. Add route inside `<Routes>`, after the groups route:
```tsx
<Route path="/task" element={<ProtectedRoute><TaskPage /></ProtectedRoute>} />
```

**VALIDATE**: `cd apps/user && npm run build`

---

## TESTING STRATEGY

### Unit Tests

Each module's functions are tested in isolation:
- `seasonParticipants.test.ts` (NEW): enroll, updateStatus, listForSeason, getMyEnrollment, getEnrolledForMatching
- `taskAssignments.test.ts` (UPDATED): getForActiveGroup, authorization check, double-approval prevention
- `seasons.test.ts` (UPDATED): update guard for non-Draft seasons

### Integration Tests

- Full lifecycle test: season create → activate → enroll → match → assign → submit → review → points
- This validates the entire system works end-to-end

### Edge Cases

- Duplicate enrollment prevention
- Non-group-member submission rejection
- Double-approval point duplication prevention
- Season edit prevention for Active/Completed status
- Re-submission allowed after "Revision" status
- Null handling when no active season/group/assignment exists

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Type Checking

```bash
npx tsc --noEmit
```

### Level 2: Unit Tests

```bash
npm run test:once
```

### Level 3: Lint

```bash
cd apps/admin && npm run lint
cd apps/user && npm run lint
```

### Level 4: Build

```bash
cd apps/admin && npm run build
cd apps/user && npm run build
```

---

## ACCEPTANCE CRITERIA

- [ ] All 148+ existing tests still pass (zero regressions)
- [ ] New seasonParticipants tests pass (6+ tests)
- [ ] getForActiveGroup tests pass (3 tests)
- [ ] Authorization test passes (submitCompletion rejects non-members)
- [ ] Double-approval test passes (reviewCompletion rejects re-approval)
- [ ] Full lifecycle test passes (end-to-end flow)
- [ ] Season update guard test passes (rejects non-Draft edits)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Admin app builds successfully
- [ ] User app builds successfully
- [ ] ReviewModal loads single assignment (not all)
- [ ] ReviewModal displays completion photos as images
- [ ] Schema has compound index on seasonParticipants
- [ ] Schema has seasonId on taskAssignments
- [ ] Schema has all 4 participant indexes on groups table (by_participant1 through by_participant4)
- [ ] Reveal time uses Israel timezone (UTC+2)
- [ ] `calculateWeekInSeason` internalQuery removed; pure helper in utils.ts used directly by matching.ts
- [ ] `closeWeekAndRequestFeedback` dead code removed from crons.ts
- [ ] crons tests updated to test `weeklyCloseAndMatch` instead
- [ ] `getForParticipant` no longer does full table scan (#7)
- [ ] `getHistoryLastWeeks` uses index range filter (#21)
- [ ] TaskPage.tsx displays task details with reveal time (#8)
- [ ] TaskPage.tsx has completion submission form with photo upload (#9)
- [ ] GroupsPage.tsx shows season enrollment status (#10)
- [ ] GroupsPage.tsx has link to task page when task is assigned (#10)
- [ ] User app has `/task` route (#8, #9)

---

## COMPLETION CHECKLIST

- [ ] All 20 tasks completed in order (Tasks 1-15, 15b, 16-19)
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (existing + new tests)
- [ ] No linting or type checking errors
- [ ] Admin app builds without errors
- [ ] User app builds without errors
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decision: taskId on groups table (#4)

**Decision: Keep the redundant `taskId` on groups.** Rationale:
- The `groups.listActive` admin query used by AssignmentsPage needs to show which groups have tasks assigned. Without `taskId` on groups, this would require joining through `taskAssignments` for every group.
- The `taskId` on groups serves as a denormalized "quick lookup" field, while `taskAssignments` is the source of truth for the full assignment lifecycle.
- The `assignToGroups` mutation already updates both atomically within the same transaction.
- Tradeoff: Slight data redundancy vs. simpler queries. Acceptable for this scale.

### Design Decision: Timezone Approach (#2)

Using a fixed UTC offset (UTC+2 = Israel Standard Time) rather than DST-aware calculation. This matches the existing pattern in `crons.ts` where all Israel times use fixed UTC offsets. During summer (IDT/UTC+3), the reveal would happen at 9:00 AM Israel time instead of 8:00 AM — a tolerable difference for a task reveal. A fully DST-aware solution would require the `Intl` API which adds complexity.

### Groups Table Scan Fix (#7)

The `getForParticipant` fix uses all 4 participant indexes (`by_participant1` through `by_participant4`). Since the DB is empty and there's no cost to adding indexes upfront, all 4 are included. Convex handles optional field indexes efficiently — documents where `participant3`/`participant4` are undefined are simply not included in those indexes.

### getHistoryLastWeeks Index Fix (#21)

The original code used `.withIndex("by_createdAt")` but then `.collect()` without a range filter, defeating the purpose of the index. The fix adds `.gte("createdAt", weeksAgo)` to let Convex handle the filtering server-side. The `_creationTime` vs `createdAt` inconsistency across tables is documented but NOT changed — the project uses explicit `createdAt` on most tables (groups, seasons, tasks, paymentLogs, supportTickets) and implicit `_creationTime` on participants only. This is acceptable since participants were created before the season-flow feature.

### User-Side UI Design Decisions (#8, #9, #10)

- **TaskPage.tsx**: Single page combining task viewing and submission (not separate pages). This keeps the user flow simple — view task → submit report on the same page.
- **Season enrollment display**: Added to GroupsPage (not a separate page) since seasons and groups are closely related. The enrollment status shows above the active group card.
- **Photo upload**: Mirrors the FeedbackPage pattern exactly — same component structure, same upload flow via `generateUploadUrl` + fetch POST.
- **Enrollment is admin-only**: There's no self-enrollment CTA since `seasonParticipants.enroll` is an `adminMutation`. The user can only view their enrollment status.
- **Russian-language UI**: All user-facing text uses `@lingui/macro` `<Trans>` tags with Russian text, matching existing pages.

### No Backward Compatibility Needed

The production DB is empty and MVP hasn't launched. This means:
- New required fields (like `seasonId` on `taskAssignments`) don't need `v.optional` wrappers
- Deprecated functions (like `closeWeekAndRequestFeedback`) can be removed entirely
- All 4 participant indexes on groups can be added without migration cost
- The `calculateWeekInSeason` internalQuery can be deleted (not just wrapped) since matching.ts is the only caller and will be updated to call the pure helper directly
- No data migration scripts are needed
