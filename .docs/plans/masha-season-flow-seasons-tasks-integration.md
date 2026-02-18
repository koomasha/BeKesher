# Feature: Seasons + Tasks Integration for BeKesher

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Integrate a comprehensive seasons and tasks system into BeKesher that transforms the weekly matching model into a structured 4-week season experience with creative group tasks. Seasons are 4-week periods manually activated by admins, where participants enroll, get matched weekly with different people, and complete curated tasks. Each week within a season, groups receive tasks assigned by admins, complete them together, and earn points through an admin-reviewed submission process.

## User Story

**As a BeKesher participant**, I want to enroll in themed seasons and complete creative weekly tasks with my matched groups, so that I have a structured, gamified networking experience with clear progression and rewards.

**As a BeKesher admin**, I want to manage seasons, curate tasks, and manually assign them to groups, so that I can create intentional, themed experiences and maintain quality control over task completions.

## Problem Statement

The current BeKesher system operates on an infinite weekly matching cycle without narrative structure or engagement mechanics beyond basic meetups. Participants meet once, leave feedback (+10 points), and get rematched the next week with no sense of progression, completion, or creative challenges. The system lacks:

1. **Temporal boundaries** - No defined cycles or seasons to create anticipation and closure
2. **Task engagement** - No creative activities beyond "meet and chat"
3. **Quality control** - No admin oversight on task completions
4. **Enrollment management** - No way to pause matching or track season participation
5. **Narrative structure** - Meetings feel disconnected without themed progression

## Solution Statement

Introduce a **seasons framework** where 4-week periods serve as cohesive units with enrollment tracking, and a **tasks system** where admins curate and manually assign creative challenges to groups. The solution includes:

1. **Seasons Table** - Explicit season entities with metadata (name, dates, status)
2. **Season Enrollment** - Participants enroll per season with status tracking (Enrolled/Paused/Completed/Dropped)
3. **Tasks Library** - Reusable creative tasks with full metadata (type, difficulty, purpose, instructions)
4. **Manual Task Assignment** - Admins assign tasks to groups between Saturday matching (18:00) and Sunday reveal (8:00 AM)
5. **Task Reveal Timeline** - Tasks become visible Sunday 8:00 AM, creating anticipation
6. **Admin Review Workflow** - Task completions reviewed and awarded points (+5 text, +10 photos)
7. **Weekly Rematching Within Seasons** - Groups change weekly but season context persists

## Feature Metadata

**Feature Type**: New Capability (with Enhancement to existing matching)
**Estimated Complexity**: High
**Primary Systems Affected**:
- Database Schema (4 new tables, 3 updated tables)
- Matching Algorithm (cron timing change, season context)
- Admin Dashboard (3 new pages: Seasons, Tasks, Task Assignments)
- User App (task display, completion submission)
- Points System (new award mechanism)

**Dependencies**:
- Convex database and validators
- React (user and admin apps)
- @lingui/macro (i18n)
- Convex file storage (_storage) for photos

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Schema & Validation:**
- [convex/schema.ts](../convex/schema.ts) - Current database schema structure to extend
- [convex/validators.ts](../convex/validators.ts) - Pattern for creating new validators (lines 1-130)

**Backend Patterns:**
- [convex/groups.ts](../convex/groups.ts) (lines 1-150) - Pattern for queries/mutations with enrichment
- [convex/matching.ts](../convex/matching.ts) (lines 1-215) - Matching algorithm to modify for seasons
- [convex/crons.ts](../convex/crons.ts) - Cron job structure to update
- [convex/feedback.ts](../convex/feedback.ts) - Points award pattern to mirror for tasks
- [convex/authAdmin.ts](../convex/authAdmin.ts) - Admin auth wrapper pattern

**Testing Patterns:**
- [convex/test.utils.ts](../convex/test.utils.ts) - Factory functions pattern
- [convex/groups.test.ts](../convex/groups.test.ts) - Test structure with convex-test

**Frontend Patterns:**
- [apps/user/src/pages/GroupsPage.tsx](../apps/user/src/pages/GroupsPage.tsx) - User page structure
- [apps/admin/src/pages/GroupsPage.tsx](../apps/admin/src/pages/GroupsPage.tsx) - Admin page structure with filters

**Utilities:**
- [convex/utils.ts](../convex/utils.ts) - Existing helper functions (calculateAge)

### New Files to Create

**Backend (Convex):**
- `convex/seasons.ts` - Season management queries/mutations
- `convex/seasonParticipants.ts` - Enrollment management
- `convex/tasks.ts` - Task CRUD operations
- `convex/taskAssignments.ts` - Assignment lifecycle management
- `convex/seasons.test.ts` - Season tests
- `convex/tasks.test.ts` - Task tests
- `convex/taskAssignments.test.ts` - Assignment tests

**Frontend - User App:**
- `apps/user/src/components/TaskCard.tsx` - Task display component
- `apps/user/src/components/TaskCompletionModal.tsx` - Completion submission form

**Frontend - Admin App:**
- `apps/admin/src/pages/SeasonsPage.tsx` - Season management page
- `apps/admin/src/pages/TasksPage.tsx` - Task library management
- `apps/admin/src/pages/TaskAssignmentPage.tsx` - Weekly task assignment interface
- `apps/admin/src/pages/TaskReviewPage.tsx` - Review queue for completions

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Schema Documentation](https://docs.convex.dev/database/schemas)
  - Specific section: Defining tables and indexes
  - Why: Required for understanding index patterns and optional fields

- [Convex Validators](https://docs.convex.dev/functions/validation)
  - Specific section: Union types and object validators
  - Why: Needed for status enums and nested object validation

- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
  - Specific section: Cron schedule syntax
  - Why: Changing matching from Sunday to Saturday

- [Convex File Storage](https://docs.convex.dev/file-storage)
  - Specific section: Storing and retrieving files
  - Why: Photo uploads for task completions

- [React Router v6](https://reactrouter.com/en/main/start/tutorial)
  - Specific section: Routes and navigation
  - Why: Adding new pages to user and admin apps

- [Lingui i18n](https://lingui.dev/tutorials/react)
  - Specific section: Trans component usage
  - Why: All user-facing text must use i18n

### Patterns to Follow

**Naming Conventions:**
```typescript
// Tables: lowercase plural
seasons, taskAssignments, seasonParticipants

// Indexes: by_field or by_field1_and_field2
.index("by_status", ["status"])
.index("by_seasonId_and_status", ["seasonId", "status"])

// Validators: fieldValidator pattern
const seasonStatusValidator = v.union(...)
export type SeasonStatus = Infer<typeof seasonStatusValidator>;

// Functions: descriptive action + entity
createSeason, assignTaskToGroups, getActiveSeasonForAdmin
```

**Error Handling:**
```typescript
// Use ConvexError for user-facing errors
import { ConvexError } from "convex/values";

if (!season) {
  throw new ConvexError("Season not found");
}
```

**Logging Pattern:**
```typescript
// Console logs for debugging (seen in matching.ts)
console.log("✅ Season created:", season.name);
console.log("❌ No active season found");
```

**Auth Wrappers:**
```typescript
// Admin functions use adminQuery/adminMutation
export const createSeason = adminMutation({
  args: { ... },
  handler: async (ctx, args) => {
    // ctx.adminEmail is available
  }
});

// User functions use userQuery/userMutation
export const getActiveSeason = userQuery({
  args: {},
  handler: async (ctx) => {
    // ctx.telegramId is available
  }
});
```

**Query Enrichment Pattern (from groups.ts):**
```typescript
// Load related entities and enrich response
const members = await Promise.all(
  memberIds.map(async (id) => {
    const member = await ctx.db.get(id);
    return { _id: member._id, name: member.name };
  })
);
```

**Test Factory Pattern (from test.utils.ts):**
```typescript
export function makeSeason(overrides = {}) {
  return {
    name: "Test Season",
    status: "Draft",
    startDate: Date.now(),
    ...overrides,
  };
}
```

### Blueprint Alignment (Critical)

**Data Architecture (schema.ts):**
- Add 4 new tables: `seasons`, `seasonParticipants`, `tasks`, `taskAssignments`
- Update 1 existing table: `groups` (add seasonId, weekInSeason, taskId fields)
- No changes needed to: `participants`, `feedback`, `paymentLogs`, `supportTickets`

**Validator Blueprint (validators.ts):**
- Create validators for all new enum fields before defining schema
- Follow existing pattern: validator definition → type export
- New validators needed: `seasonStatusValidator`, `taskTypeValidator`, `taskDifficultyValidator`, `taskPurposeValidator`, `taskReviewStatusValidator`, `seasonParticipantStatusValidator`

**No workflow changes (n8n.json doesn't exist):**
- No external workflows to update

**No branding changes (branding.pdf doesn't exist):**
- UI design follows existing admin/user app patterns

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Schema & Validators)

Set up database schema and validation layer as the foundation for all subsequent work. This phase establishes the data model that all other phases depend on.

**Tasks:**
- Define validators for all new enum types
- Create schema definitions for 4 new tables
- Update groups table schema with season fields
- Add comprehensive indexes for query performance

### Phase 2: Core Backend (Seasons & Tasks Management)

Implement backend logic for seasons and tasks management, excluding matching integration. This allows admin UI to be built and tested independently.

**Tasks:**
- Create seasons CRUD operations
- Create tasks CRUD operations
- Implement season participant enrollment system
- Add task assignment mutations (manual assignment logic)
- Build task review and approval workflow

### Phase 3: Matching Integration

Modify existing matching algorithm to work within season context. This is the most critical integration point.

**Tasks:**
- Update cron schedule (Sunday → Saturday)
- Add season awareness to matching logic
- Update group creation to include seasonId and weekInSeason
- Implement week close logic for task assignments
- Add season transition detection

### Phase 4: Admin Dashboard UI

Build admin interfaces for managing the entire seasons + tasks lifecycle.

**Tasks:**
- Create SeasonsPage (CRUD + activation)
- Create TasksPage (library management)
- Create TaskAssignmentPage (weekly assignment workflow)
- Create TaskReviewPage (review queue)
- Update Sidebar navigation

### Phase 5: User App UI

Add task viewing and completion features to user-facing app.

**Tasks:**
- Create TaskCard component for GroupsPage
- Implement task reveal timeline logic (Sunday 8:00 AM)
- Create TaskCompletionModal with photo upload
- Add task status display (Pending/Approved/Revision)
- Update GroupsPage layout

### Phase 6: Testing & Validation

Comprehensive test coverage for all new functionality.

**Tasks:**
- Write season lifecycle tests
- Write task CRUD tests
- Write assignment workflow tests
- Write integration tests for matching
- Add frontend component tests (if testing infrastructure exists)

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### PHASE 1: FOUNDATION

#### Task 1.1: CREATE validators for new enum types

- **IMPLEMENT**: Add all new validators to `convex/validators.ts`
- **PATTERN**: Follow existing validator pattern (lines 12-115 in validators.ts)
- **IMPORTS**: `v` from `convex/values`, `Infer` for type exports
- **GOTCHA**: Define validator BEFORE using in schema, export both validator and type
- **CODE**:
```typescript
// Season status
export const seasonStatusValidator = v.union(
  v.literal("Draft"),
  v.literal("Active"),
  v.literal("Completed")
);
export type SeasonStatus = Infer<typeof seasonStatusValidator>;

// Season participant status
export const seasonParticipantStatusValidator = v.union(
  v.literal("Enrolled"),
  v.literal("Paused"),
  v.literal("Completed"),
  v.literal("Dropped")
);
export type SeasonParticipantStatus = Infer<typeof seasonParticipantStatusValidator>;

// Task type
export const taskTypeValidator = v.union(
  v.literal("Activity"),
  v.literal("Conversation"),
  v.literal("Creative"),
  v.literal("Philosophy")
);
export type TaskType = Infer<typeof taskTypeValidator>;

// Task difficulty
export const taskDifficultyValidator = v.union(
  v.literal("Easy"),
  v.literal("Medium"),
  v.literal("Hard")
);
export type TaskDifficulty = Infer<typeof taskDifficultyValidator>;

// Task purpose
export const taskPurposeValidator = v.union(
  v.literal("Everyone"),
  v.literal("Romantic"),
  v.literal("Friendship")
);
export type TaskPurpose = Infer<typeof taskPurposeValidator>;

// Task review status
export const taskReviewStatusValidator = v.union(
  v.literal("Pending"),
  v.literal("Approved"),
  v.literal("Revision"),
  v.literal("Rejected"),
  v.literal("NotCompleted")
);
export type TaskReviewStatus = Infer<typeof taskReviewStatusValidator>;

// Week in season (literal union for 1-4)
export const weekInSeasonValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4)
);
export type WeekInSeason = Infer<typeof weekInSeasonValidator>;
```
- **VALIDATE**: `npx tsc --noEmit` (should pass with no errors)

#### Task 1.2: UPDATE schema.ts - Import new validators

- **IMPLEMENT**: Add imports at top of schema.ts (after line 13)
- **PATTERN**: MIRROR existing import pattern (lines 4-13 in schema.ts)
- **CODE**:
```typescript
import {
    // ... existing imports
    seasonStatusValidator,
    seasonParticipantStatusValidator,
    taskTypeValidator,
    taskDifficultyValidator,
    taskPurposeValidator,
    taskReviewStatusValidator,
    weekInSeasonValidator,
} from "./validators";
```
- **VALIDATE**: `npx tsc --noEmit`

#### Task 1.3: CREATE seasons table in schema.ts

- **IMPLEMENT**: Add seasons table definition in schema (before groups table)
- **PATTERN**: MIRROR participants table structure (lines 16-55 in schema.ts)
- **CODE**:
```typescript
  seasons: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),  // First Saturday 18:00 timestamp
    endDate: v.number(),    // Last Saturday 23:00 (4 weeks later)
    status: seasonStatusValidator,
    createdAt: v.number(),
    createdByEmail: v.string(),  // Admin email from ctx.adminEmail
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
```
- **GOTCHA**: Ensure this table is added to the schema object BEFORE the closing brace
- **VALIDATE**: `npx tsc --noEmit` and `npm run convex` (should sync without errors)

#### Task 1.4: CREATE seasonParticipants table in schema.ts

- **IMPLEMENT**: Add seasonParticipants table after seasons table
- **PATTERN**: MIRROR groups table with multiple indexes (lines 67-77 in schema.ts)
- **CODE**:
```typescript
  seasonParticipants: defineTable({
    seasonId: v.id("seasons"),
    participantId: v.id("participants"),
    enrolledAt: v.number(),
    status: seasonParticipantStatusValidator,
  })
    .index("by_seasonId", ["seasonId"])
    .index("by_participantId", ["participantId"])
    .index("by_seasonId_and_status", ["seasonId", "status"]),
```
- **VALIDATE**: `npm run convex`

#### Task 1.5: CREATE tasks table in schema.ts

- **IMPLEMENT**: Add tasks table after seasonParticipants
- **PATTERN**: MIRROR participants table with metadata fields
- **CODE**:
```typescript
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    onlineInstructions: v.optional(v.string()),
    reportInstructions: v.string(),
    type: taskTypeValidator,
    difficulty: taskDifficultyValidator,
    purpose: taskPurposeValidator,
    status: v.union(v.literal("Active"), v.literal("Archive")),
    createdAt: v.number(),
    createdByEmail: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"]),
```
- **VALIDATE**: `npm run convex`

#### Task 1.6: CREATE taskAssignments table in schema.ts

- **IMPLEMENT**: Add taskAssignments table after tasks
- **PATTERN**: MIRROR feedback table structure with multiple optional fields (lines 79-91)
- **CODE**:
```typescript
  taskAssignments: defineTable({
    groupId: v.id("groups"),
    taskId: v.id("tasks"),
    weekInSeason: weekInSeasonValidator,

    // Assignment tracking
    assignedAt: v.number(),
    assignedByEmail: v.string(),

    // Participant submission
    completedAt: v.optional(v.number()),
    completionNotes: v.optional(v.string()),
    completionPhotos: v.optional(v.array(v.id("_storage"))),
    submittedBy: v.optional(v.id("participants")),
    submittedAt: v.optional(v.number()),

    // Admin review
    reviewStatus: taskReviewStatusValidator,
    reviewedAt: v.optional(v.number()),
    reviewedByEmail: v.optional(v.string()),
    reviewComment: v.optional(v.string()),
    pointsAwarded: v.number(),

    // Analytics
    notCompletedReason: v.optional(v.string()),
  })
    .index("by_groupId", ["groupId"])
    .index("by_taskId", ["taskId"])
    .index("by_reviewStatus", ["reviewStatus"])
    .index("by_submittedBy", ["submittedBy"])
    .index("by_weekInSeason", ["weekInSeason"]),
```
- **VALIDATE**: `npm run convex`

#### Task 1.7: UPDATE groups table - Add season fields

- **IMPLEMENT**: Add seasonId, weekInSeason, taskId to groups table (after line 74)
- **PATTERN**: Add optional fields similar to participant3/participant4 pattern
- **CODE**:
```typescript
  groups: defineTable({
    createdAt: v.number(),
    status: groupStatusValidator,
    region: v.optional(regionValidator),
    participant1: v.id("participants"),
    participant2: v.id("participants"),
    participant3: v.optional(v.id("participants")),
    participant4: v.optional(v.id("participants")),

    // NEW: Season integration fields
    seasonId: v.optional(v.id("seasons")),
    weekInSeason: v.optional(weekInSeasonValidator),
    taskId: v.optional(v.id("tasks")),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    // NEW: Season-aware indexes
    .index("by_seasonId", ["seasonId"])
    .index("by_seasonId_and_weekInSeason", ["seasonId", "weekInSeason"])
    .index("by_seasonId_and_status", ["seasonId", "status"]),
```
- **GOTCHA**: seasonId, weekInSeason, taskId are OPTIONAL because existing groups won't have them
- **VALIDATE**: `npm run convex` (should migrate existing data automatically)

### PHASE 2: CORE BACKEND

#### Task 2.1: CREATE convex/seasons.ts - Season CRUD

- **IMPLEMENT**: Complete season management with CRUD operations
- **PATTERN**: MIRROR convex/groups.ts structure (lines 1-150)
- **IMPORTS**: Import from proper files (adminQuery, adminMutation from authAdmin, validators from validators)
- **CODE**:
```typescript
import { adminQuery, adminMutation } from "./authAdmin";
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { seasonStatusValidator } from "./validators";

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List all seasons (admin only)
 */
export const list = adminQuery({
  args: {
    status: v.optional(seasonStatusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
      enrolledCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db.query("seasons");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const seasons = await query.order("desc").collect();

    // Enrich with enrollment count
    const enriched = await Promise.all(
      seasons.map(async (season) => {
        const enrolled = await ctx.db
          .query("seasonParticipants")
          .withIndex("by_seasonId_and_status", (q) =>
            q.eq("seasonId", season._id).eq("status", "Enrolled")
          )
          .collect();

        return {
          ...season,
          enrolledCount: enrolled.length,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single season by ID
 */
export const get = adminQuery({
  args: { seasonId: v.id("seasons") },
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.seasonId);
  },
});

/**
 * Get currently active season
 */
export const getActive = adminQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    return activeSeason;
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Create a new season
 */
export const create = adminMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
  },
  returns: v.id("seasons"),
  handler: async (ctx, args) => {
    // Calculate endDate: 4 weeks after startDate
    const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
    const endDate = args.startDate + fourWeeks;

    const seasonId = await ctx.db.insert("seasons", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: endDate,
      status: "Draft",
      createdAt: Date.now(),
      createdByEmail: ctx.adminEmail,
    });

    console.log("✅ Season created:", args.name);
    return seasonId;
  },
});

/**
 * Update season details
 */
export const update = adminMutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { seasonId, ...updates } = args;

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
});

/**
 * Activate a season (only one can be active at a time)
 */
export const activate = adminMutation({
  args: { seasonId: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if there's already an active season
    const existingActive = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (existingActive) {
      throw new ConvexError("Another season is already active. Please complete it first.");
    }

    // Activate the season
    await ctx.db.patch(args.seasonId, { status: "Active" });
    console.log("✅ Season activated");

    return null;
  },
});

/**
 * Complete a season
 */
export const complete = adminMutation({
  args: { seasonId: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.seasonId, { status: "Completed" });

    // Update all enrolled participants to "Completed"
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_status", (q) =>
        q.eq("seasonId", args.seasonId).eq("status", "Enrolled")
      )
      .collect();

    for (const enrollment of enrollments) {
      await ctx.db.patch(enrollment._id, { status: "Completed" });
    }

    console.log("✅ Season completed");
    return null;
  },
});

// ============================================
// INTERNAL QUERIES
// ============================================

/**
 * Get active season (internal use by matching)
 */
export const getActiveInternal = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
    }),
    v.null()
  ),
  handler: async (ctx) => {
    return await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();
  },
});

/**
 * Calculate which week in season (1-4) based on timestamp
 */
export const calculateWeekInSeason = internalQuery({
  args: {
    seasonStartDate: v.number(),
    currentTimestamp: v.number(),
  },
  returns: v.union(v.number(), v.null()),
  handler: async (_ctx, args) => {
    const elapsed = args.currentTimestamp - args.seasonStartDate;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekNumber = Math.floor(elapsed / weekMs) + 1;

    if (weekNumber < 1 || weekNumber > 4) {
      return null;  // Outside season bounds
    }

    return weekNumber;
  },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 2.2: CREATE convex/seasonParticipants.ts - Enrollment

- **IMPLEMENT**: Enrollment and status management
- **PATTERN**: MIRROR convex/support.ts structure
- **CODE**:
```typescript
import { adminQuery, adminMutation } from "./authAdmin";
import { userQuery, userMutation } from "./authUser";
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { seasonParticipantStatusValidator } from "./validators";

// ============================================
// USER QUERIES
// ============================================

/**
 * Get participant's enrollment for active season
 */
export const getMyEnrollment = userQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasonParticipants"),
      seasonId: v.id("seasons"),
      seasonName: v.string(),
      status: seasonParticipantStatusValidator,
      enrolledAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
      .unique();

    if (!participant) return null;

    // Get active season
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (!activeSeason) return null;

    // Get enrollment
    const enrollment = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", activeSeason._id))
      .filter((q) => q.eq(q.field("participantId"), participant._id))
      .first();

    if (!enrollment) return null;

    return {
      _id: enrollment._id,
      seasonId: enrollment.seasonId,
      seasonName: activeSeason.name,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    };
  },
});

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List all enrollments for a season
 */
export const listForSeason = adminQuery({
  args: {
    seasonId: v.id("seasons"),
    status: v.optional(seasonParticipantStatusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("seasonParticipants"),
      participantId: v.id("participants"),
      participantName: v.string(),
      participantEmail: v.optional(v.string()),
      status: seasonParticipantStatusValidator,
      enrolledAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const enrollments = await query.collect();

    // Enrich with participant data
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const participant = await ctx.db.get(enrollment.participantId);
        return {
          ...enrollment,
          participantName: participant?.name || "Unknown",
          participantEmail: participant?.email,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Enroll a participant in a season
 */
export const enroll = adminMutation({
  args: {
    seasonId: v.id("seasons"),
    participantId: v.id("participants"),
  },
  returns: v.id("seasonParticipants"),
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (existing) {
      throw new ConvexError("Participant already enrolled in this season");
    }

    const enrollmentId = await ctx.db.insert("seasonParticipants", {
      seasonId: args.seasonId,
      participantId: args.participantId,
      enrolledAt: Date.now(),
      status: "Enrolled",
    });

    return enrollmentId;
  },
});

/**
 * Update enrollment status
 */
export const updateStatus = adminMutation({
  args: {
    enrollmentId: v.id("seasonParticipants"),
    status: seasonParticipantStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, { status: args.status });
    return null;
  },
});

// ============================================
// INTERNAL QUERIES
// ============================================

/**
 * Get enrolled participants for active season (for matching)
 */
export const getEnrolledForMatching = internalQuery({
  args: { seasonId: v.id("seasons") },
  returns: v.array(v.id("participants")),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_status", (q) =>
        q.eq("seasonId", args.seasonId).eq("status", "Enrolled")
      )
      .collect();

    return enrollments.map((e) => e.participantId);
  },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 2.3: CREATE convex/tasks.ts - Task library CRUD

- **IMPLEMENT**: Task management operations
- **PATTERN**: MIRROR convex/seasons.ts CRUD structure
- **CODE**:
```typescript
import { adminQuery, adminMutation } from "./authAdmin";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  taskTypeValidator,
  taskDifficultyValidator,
  taskPurposeValidator,
} from "./validators";

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List all tasks with filters
 */
export const list = adminQuery({
  args: {
    status: v.optional(v.union(v.literal("Active"), v.literal("Archive"))),
    type: v.optional(taskTypeValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
      description: v.string(),
      onlineInstructions: v.optional(v.string()),
      reportInstructions: v.string(),
      type: taskTypeValidator,
      difficulty: taskDifficultyValidator,
      purpose: taskPurposeValidator,
      status: v.union(v.literal("Active"), v.literal("Archive")),
      createdAt: v.number(),
      createdByEmail: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db.query("tasks");

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    let tasks = await query.order("desc").collect();

    if (args.type) {
      tasks = tasks.filter((t) => t.type === args.type);
    }

    return tasks;
  },
});

/**
 * Get a single task by ID
 */
export const get = adminQuery({
  args: { taskId: v.id("tasks") },
  returns: v.union(
    v.object({
      _id: v.id("tasks"),
      title: v.string(),
      description: v.string(),
      onlineInstructions: v.optional(v.string()),
      reportInstructions: v.string(),
      type: taskTypeValidator,
      difficulty: taskDifficultyValidator,
      purpose: taskPurposeValidator,
      status: v.union(v.literal("Active"), v.literal("Archive")),
      createdAt: v.number(),
      createdByEmail: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Create a new task
 */
export const create = adminMutation({
  args: {
    title: v.string(),
    description: v.string(),
    onlineInstructions: v.optional(v.string()),
    reportInstructions: v.string(),
    type: taskTypeValidator,
    difficulty: taskDifficultyValidator,
    purpose: taskPurposeValidator,
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "Active",
      createdAt: Date.now(),
      createdByEmail: ctx.adminEmail,
    });

    console.log("✅ Task created:", args.title);
    return taskId;
  },
});

/**
 * Update a task
 */
export const update = adminMutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    onlineInstructions: v.optional(v.string()),
    reportInstructions: v.optional(v.string()),
    type: v.optional(taskTypeValidator),
    difficulty: v.optional(taskDifficultyValidator),
    purpose: v.optional(taskPurposeValidator),
    status: v.optional(v.union(v.literal("Active"), v.literal("Archive"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
    return null;
  },
});

/**
 * Archive a task
 */
export const archive = adminMutation({
  args: { taskId: v.id("tasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: "Archive" });
    return null;
  },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 2.4: CREATE convex/taskAssignments.ts - Assignment workflow

- **IMPLEMENT**: Task assignment, submission, and review logic
- **PATTERN**: MIRROR convex/feedback.ts structure with enrichment
- **IMPORTS**: Storage for file uploads, internal queries for group lookups
- **CODE**:
```typescript
import { adminQuery, adminMutation } from "./authAdmin";
import { userQuery, userMutation } from "./authUser";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { taskReviewStatusValidator, weekInSeasonValidator } from "./validators";

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List task assignments with filters (for review queue)
 */
export const listForReview = adminQuery({
  args: {
    reviewStatus: v.optional(taskReviewStatusValidator),
    weekInSeason: v.optional(weekInSeasonValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("taskAssignments"),
      groupId: v.id("groups"),
      taskId: v.id("tasks"),
      taskTitle: v.string(),
      weekInSeason: weekInSeasonValidator,
      reviewStatus: taskReviewStatusValidator,
      completionNotes: v.optional(v.string()),
      completionPhotos: v.optional(v.array(v.id("_storage"))),
      submittedAt: v.optional(v.number()),
      submittedBy: v.optional(v.id("participants")),
      submittedByName: v.optional(v.string()),
      pointsAwarded: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db.query("taskAssignments");

    if (args.reviewStatus) {
      query = query.withIndex("by_reviewStatus", (q) =>
        q.eq("reviewStatus", args.reviewStatus)
      );
    }

    let assignments = await query.collect();

    if (args.weekInSeason) {
      assignments = assignments.filter((a) => a.weekInSeason === args.weekInSeason);
    }

    // Enrich with task and participant data
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const task = await ctx.db.get(assignment.taskId);
        let submittedByName: string | undefined;

        if (assignment.submittedBy) {
          const participant = await ctx.db.get(assignment.submittedBy);
          submittedByName = participant?.name;
        }

        return {
          ...assignment,
          taskTitle: task?.title || "Unknown",
          submittedByName,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get assignments for a specific group
 */
export const listForGroup = adminQuery({
  args: { groupId: v.id("groups") },
  returns: v.array(
    v.object({
      _id: v.id("taskAssignments"),
      taskId: v.id("tasks"),
      taskTitle: v.string(),
      weekInSeason: weekInSeasonValidator,
      reviewStatus: taskReviewStatusValidator,
      pointsAwarded: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("taskAssignments")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const task = await ctx.db.get(a.taskId);
        return {
          _id: a._id,
          taskId: a.taskId,
          taskTitle: task?.title || "Unknown",
          weekInSeason: a.weekInSeason,
          reviewStatus: a.reviewStatus,
          pointsAwarded: a.pointsAwarded,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// USER QUERIES
// ============================================

/**
 * Get task assignment for participant's active group
 */
export const getForActiveGroup = userQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("taskAssignments"),
      task: v.object({
        _id: v.id("tasks"),
        title: v.string(),
        description: v.string(),
        onlineInstructions: v.optional(v.string()),
        reportInstructions: v.string(),
      }),
      reviewStatus: taskReviewStatusValidator,
      completionNotes: v.optional(v.string()),
      completionPhotos: v.optional(v.array(v.id("_storage"))),
      pointsAwarded: v.number(),
      reviewComment: v.optional(v.string()),
      revealTime: v.number(),  // Sunday 8:00 AM timestamp
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // Get participant
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
      .unique();

    if (!participant) return null;

    // Get active group
    const activeGroups = await ctx.db
      .query("groups")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    const myGroup = activeGroups.find((g) =>
      [g.participant1, g.participant2, g.participant3, g.participant4].includes(
        participant._id
      )
    );

    if (!myGroup) return null;

    // Get task assignment for this group
    const assignment = await ctx.db
      .query("taskAssignments")
      .withIndex("by_groupId", (q) => q.eq("groupId", myGroup._id))
      .first();

    if (!assignment) return null;

    // Calculate reveal time: Sunday 8:00 AM after group creation
    const groupCreated = new Date(myGroup.createdAt);
    const nextSunday = new Date(groupCreated);
    nextSunday.setDate(groupCreated.getDate() + (groupCreated.getDay() === 6 ? 1 : 0));
    nextSunday.setHours(8, 0, 0, 0);
    const revealTime = nextSunday.getTime();

    // Get task details
    const task = await ctx.db.get(assignment.taskId);
    if (!task) return null;

    return {
      _id: assignment._id,
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        onlineInstructions: task.onlineInstructions,
        reportInstructions: task.reportInstructions,
      },
      reviewStatus: assignment.reviewStatus,
      completionNotes: assignment.completionNotes,
      completionPhotos: assignment.completionPhotos,
      pointsAwarded: assignment.pointsAwarded,
      reviewComment: assignment.reviewComment,
      revealTime,
    };
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Assign tasks to groups (bulk operation)
 */
export const assignToGroups = adminMutation({
  args: {
    groupIds: v.array(v.id("groups")),
    taskId: v.id("tasks"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let count = 0;

    for (const groupId of args.groupIds) {
      const group = await ctx.db.get(groupId);
      if (!group || !group.weekInSeason) continue;

      // Check if assignment already exists
      const existing = await ctx.db
        .query("taskAssignments")
        .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
        .first();

      if (existing) {
        // Update existing assignment
        await ctx.db.patch(existing._id, { taskId: args.taskId });
      } else {
        // Create new assignment
        await ctx.db.insert("taskAssignments", {
          groupId,
          taskId: args.taskId,
          weekInSeason: group.weekInSeason,
          assignedAt: Date.now(),
          assignedByEmail: ctx.adminEmail,
          reviewStatus: "Pending",
          pointsAwarded: 0,
        });
      }

      // Update group with taskId
      await ctx.db.patch(groupId, { taskId: args.taskId });
      count++;
    }

    console.log(`✅ Assigned task to ${count} groups`);
    return count;
  },
});

/**
 * Review task completion
 */
export const reviewCompletion = adminMutation({
  args: {
    assignmentId: v.id("taskAssignments"),
    reviewStatus: v.union(
      v.literal("Approved"),
      v.literal("Revision"),
      v.literal("Rejected")
    ),
    reviewComment: v.optional(v.string()),
    pointsAwarded: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new ConvexError("Assignment not found");
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
});

// ============================================
// USER MUTATIONS
// ============================================

/**
 * Submit task completion
 */
export const submitCompletion = userMutation({
  args: {
    assignmentId: v.id("taskAssignments"),
    completionNotes: v.string(),
    completionPhotos: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
      .unique();

    if (!participant) {
      throw new ConvexError("Participant not found");
    }

    await ctx.db.patch(args.assignmentId, {
      completedAt: Date.now(),
      completionNotes: args.completionNotes,
      completionPhotos: args.completionPhotos,
      submittedBy: participant._id,
      submittedAt: Date.now(),
      // reviewStatus remains "Pending"
    });

    console.log("✅ Task completion submitted");
    return null;
  },
});

// ============================================
// INTERNAL MUTATIONS
// ============================================

/**
 * Mark incomplete assignments as "NotCompleted" (called by week close cron)
 */
export const markIncompleteAsNotCompleted = internalMutation({
  args: { groupIds: v.array(v.id("groups")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    let count = 0;

    for (const groupId of args.groupIds) {
      const assignment = await ctx.db
        .query("taskAssignments")
        .withIndex("by_groupId", (q) => q.eq("groupId", groupId))
        .first();

      if (assignment && assignment.reviewStatus === "Pending" && !assignment.completedAt) {
        await ctx.db.patch(assignment._id, {
          reviewStatus: "NotCompleted",
        });
        count++;
      }
    }

    return count;
  },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

### PHASE 3: MATCHING INTEGRATION

#### Task 3.1: UPDATE convex/crons.ts - Change matching to Saturday

- **IMPLEMENT**: Change cron schedule from Sunday to Saturday
- **PATTERN**: MIRROR existing cron pattern (lines 12-19 in crons.ts)
- **CODE**:
```typescript
// BEFORE (line 12-19):
crons.cron(
    "weekly-matching",
    // Sunday at 18:00 Israel time (UTC+2/+3)
    // Using 16:00 UTC to approximate 18:00 Israel time
    "0 16 * * 0",
    internal.matching.runWeeklyMatching,
    {}
);

// AFTER:
crons.cron(
    "weekly-matching",
    // Saturday at 18:00 Israel time (UTC+2/+3)
    // Using 16:00 UTC to approximate 18:00 Israel time
    "0 16 * * 6",  // Changed from 0 (Sunday) to 6 (Saturday)
    internal.matching.runWeeklyMatching,
    {}
);
```
- **GOTCHA**: Cron day of week: 0=Sunday, 6=Saturday
- **VALIDATE**: `npm run convex` (cron will update)

#### Task 3.2: UPDATE convex/matching.ts - Add season awareness

- **IMPLEMENT**: Modify runWeeklyMatching to work with seasons
- **PATTERN**: Enhance existing matching logic (lines 57-214 in matching.ts)
- **IMPORTS**: Add internal.seasons, internal.seasonParticipants queries
- **CODE**:
```typescript
// ADD at top after existing imports (line 7):
import { internal } from "./_generated/api";

// MODIFY runWeeklyMatching handler (replace lines 66-110):
handler: async (ctx) => {
    console.log("🚀 Starting weekly matching v4.0 (with seasons)...");

    // 1. Check for active season
    const activeSeason = await ctx.runQuery(internal.seasons.getActiveInternal, {});
    if (!activeSeason) {
        console.log("❌ No active season found!");
        return {
            success: false,
            groupsCreated: 0,
            unpaired: 0,
            unpairedNames: [],
            message: "No active season",
        };
    }
    console.log(`✅ Active season: ${activeSeason.name}`);

    // 2. Calculate current week in season
    const currentTime = Date.now();
    const weekNumber = await ctx.runQuery(internal.seasons.calculateWeekInSeason, {
        seasonStartDate: activeSeason.startDate,
        currentTimestamp: currentTime,
    });

    if (!weekNumber || weekNumber < 1 || weekNumber > 4) {
        console.log("❌ Current time is outside season bounds!");
        return {
            success: false,
            groupsCreated: 0,
            unpaired: 0,
            unpairedNames: [],
            message: "Outside season bounds",
        };
    }
    console.log(`✅ Week ${weekNumber} of season`);

    // 3. Get enrolled participants for this season
    const enrolledIds = await ctx.runQuery(
        internal.seasonParticipants.getEnrolledForMatching,
        { seasonId: activeSeason._id }
    );
    console.log(`✅ Enrolled participants: ${enrolledIds.length}`);

    // 4. Get full participant data for enrolled participants
    const allParticipants: Participant[] = [];
    for (const id of enrolledIds) {
        const p = await ctx.runQuery(internal.participants.get, { participantId: id });
        if (p && p.status === "Active" && !p.onPause) {
            allParticipants.push({
                _id: p._id,
                name: p.name,
                telegramId: p.telegramId,
                birthDate: p.birthDate,
                gender: p.gender,
                region: p.region,
            });
        }
    }
    console.log(`✅ Active enrolled participants: ${allParticipants.length}`);

    if (allParticipants.length < 2) {
        console.log("❌ Not enough participants for matching!");
        return {
            success: false,
            groupsCreated: 0,
            unpaired: 0,
            unpairedNames: [],
            message: "Not enough participants",
        };
    }

    // REST OF MATCHING LOGIC STAYS THE SAME (lines 88-182)...

    // 5. Get participants in active groups
    const busyParticipantIds: Id<"participants">[] = await ctx.runQuery(
        internal.groups.getParticipantsInActiveGroups,
        {}
    );
    const busySet = new Set(busyParticipantIds);
    console.log(`✅ Already in active groups: ${busySet.size} people`);

    // 6. Filter available participants
    const availableParticipants = allParticipants.filter(
        (p) => !busySet.has(p._id)
    );
    console.log(`✅ Available for matching: ${availableParticipants.length}`);

    if (availableParticipants.length < 2) {
        console.log("⚠️ Not enough available participants!");
        return {
            success: true,
            groupsCreated: 0,
            unpaired: 0,
            unpairedNames: [],
            message: "All participants already in active groups",
        };
    }

    // Continue with existing 5-stage matching (lines 112-181)...
    // [Keep all the multi-stage matching logic unchanged]

    // MODIFY group creation (replace lines 183-197):
    // Save groups to database WITH SEASON CONTEXT
    let createdCount = 0;
    for (const group of allGroups) {
        const participants = group.participants;
        if (participants.length >= 2) {
            await ctx.runMutation(internal.groups.create, {
                participant1: participants[0]._id,
                participant2: participants[1]._id,
                participant3: participants[2]?._id,
                participant4: participants[3]?._id,
                region: group.region,
                seasonId: activeSeason._id,  // NEW
                weekInSeason: weekNumber as 1 | 2 | 3 | 4,  // NEW
            });
            createdCount++;
        }
    }

    // Rest stays the same (lines 199-214)...
},
```
- **GOTCHA**: Don't modify the 5-stage matching algorithm itself, only the participant sourcing and group creation
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 3.3: UPDATE convex/groups.ts - Update create mutation signature

- **IMPLEMENT**: Add optional seasonId and weekInSeason parameters to internal create mutation
- **PATTERN**: MIRROR existing create mutation structure
- **LOCATE**: Find the `export const create = internalMutation` function in groups.ts
- **CODE**:
```typescript
// UPDATE the create mutation args (add after region):
export const create = internalMutation({
    args: {
        participant1: v.id("participants"),
        participant2: v.id("participants"),
        participant3: v.optional(v.id("participants")),
        participant4: v.optional(v.id("participants")),
        region: v.optional(regionValidator),
        // NEW: Season fields
        seasonId: v.optional(v.id("seasons")),
        weekInSeason: v.optional(weekInSeasonValidator),
    },
    returns: v.id("groups"),
    handler: async (ctx, args) => {
        const groupId = await ctx.db.insert("groups", {
            participant1: args.participant1,
            participant2: args.participant2,
            participant3: args.participant3,
            participant4: args.participant4,
            region: args.region,
            status: "Active",
            createdAt: Date.now(),
            // NEW: Include season fields if provided
            seasonId: args.seasonId,
            weekInSeason: args.weekInSeason,
            taskId: undefined,  // Will be assigned by admin later
        });
        return groupId;
    },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 3.4: UPDATE convex/crons.ts - Week close with task cleanup

- **IMPLEMENT**: Modify closeWeekAndRequestFeedback to mark incomplete tasks
- **PATTERN**: ENHANCE existing cron handler (lines 67-82 in crons.ts)
- **CODE**:
```typescript
// REPLACE closeWeekAndRequestFeedback handler (lines 70-81):
handler: async (ctx) => {
    // Get all active groups before closing
    const activeGroups = await ctx.runQuery(
        internal.groups.getActiveGroupIds,  // Need to create this query
        {}
    );

    // Mark incomplete task assignments as "NotCompleted"
    if (activeGroups.length > 0) {
        const markedCount = await ctx.runMutation(
            internal.taskAssignments.markIncompleteAsNotCompleted,
            { groupIds: activeGroups }
        );
        console.log(`✅ Marked ${markedCount} incomplete tasks as NotCompleted`);
    }

    // Close all active groups
    await ctx.runMutation(
        internal.groups.closeActiveGroups,
        {}
    );

    // TODO: Send feedback request notifications to all group members
    // This would use internal.notifications.sendFeedbackRequest

    return null;
},
```
- **VALIDATE**: `npm run convex`

#### Task 3.5: ADD internal query to groups.ts - getActiveGroupIds

- **IMPLEMENT**: Create helper query to get active group IDs for cron
- **PATTERN**: MIRROR existing internal queries in groups.ts
- **CODE**:
```typescript
// ADD to groups.ts after getParticipantsInActiveGroups:
/**
 * Get IDs of all active groups (for cron)
 */
export const getActiveGroupIds = internalQuery({
    args: {},
    returns: v.array(v.id("groups")),
    handler: async (ctx) => {
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        return activeGroups.map((g) => g._id);
    },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

#### Task 3.6: ADD internal query to participants.ts - get by ID

- **IMPLEMENT**: Create internal query to get participant by ID (needed for matching)
- **PATTERN**: MIRROR existing queries
- **CODE**:
```typescript
// ADD to participants.ts:
export const get = internalQuery({
    args: { participantId: v.id("participants") },
    returns: v.union(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            telegramId: v.string(),
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
            status: participantStatusValidator,
            onPause: v.boolean(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.participantId);
    },
});
```
- **VALIDATE**: `npm run convex && npx tsc --noEmit`

### PHASE 4: ADMIN DASHBOARD UI

#### Task 4.1: CREATE apps/admin/src/pages/SeasonsPage.tsx

- **IMPLEMENT**: Full season management interface with create/list/activate/complete
- **PATTERN**: MIRROR apps/admin/src/pages/GroupsPage.tsx structure (lines 1-86)
- **IMPORTS**: useQuery, useMutation from convex/react, api from convex/_generated/api
- **CODE**:
```typescript
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans } from '@lingui/macro';
import type { Id } from 'convex/_generated/dataModel';

function SeasonsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const seasons = useQuery(api.seasons.list, {
        status: statusFilter || undefined,
    });

    const createSeason = useMutation(api.seasons.create);
    const activateSeason = useMutation(api.seasons.activate);
    const completeSeason = useMutation(api.seasons.complete);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const startTimestamp = new Date(formData.startDate).getTime();
        await createSeason({
            name: formData.name,
            description: formData.description || undefined,
            startDate: startTimestamp,
        });
        setShowCreateModal(false);
        setFormData({ name: '', description: '', startDate: '' });
    };

    const handleActivate = async (seasonId: Id<"seasons">) => {
        if (confirm('Activate this season? Only one season can be active at a time.')) {
            await activateSeason({ seasonId });
        }
    };

    const handleComplete = async (seasonId: Id<"seasons">) => {
        if (confirm('Complete this season? All enrolled participants will be marked as completed.')) {
            await completeSeason({ seasonId });
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Seasons</Trans></h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Trans>+ Create Season</Trans>
                </button>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label"><Trans>Status:</Trans></label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value=""><Trans>All</Trans></option>
                        <option value="Draft"><Trans>Draft</Trans></option>
                        <option value="Active"><Trans>Active</Trans></option>
                        <option value="Completed"><Trans>Completed</Trans></option>
                    </select>
                </div>
            </div>

            <div className="card">
                {seasons === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : seasons.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No seasons found.</Trans>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Trans>Name</Trans></th>
                                    <th><Trans>Status</Trans></th>
                                    <th><Trans>Start Date</Trans></th>
                                    <th><Trans>End Date</Trans></th>
                                    <th><Trans>Enrolled</Trans></th>
                                    <th><Trans>Actions</Trans></th>
                                </tr>
                            </thead>
                            <tbody>
                                {seasons.map((season) => (
                                    <tr key={season._id}>
                                        <td>
                                            <strong>{season.name}</strong>
                                            {season.description && (
                                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                                    {season.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge badge-${season.status.toLowerCase()}`}>
                                                {season.status}
                                            </span>
                                        </td>
                                        <td>{new Date(season.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(season.endDate).toLocaleDateString()}</td>
                                        <td>{season.enrolledCount}</td>
                                        <td>
                                            {season.status === 'Draft' && (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleActivate(season._id)}
                                                >
                                                    <Trans>Activate</Trans>
                                                </button>
                                            )}
                                            {season.status === 'Active' && (
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => handleComplete(season._id)}
                                                >
                                                    <Trans>Complete</Trans>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Season Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2><Trans>Create New Season</Trans></h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label><Trans>Season Name</Trans></label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Winter 2026"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Trans>Description (Optional)</Trans></label>
                                <textarea
                                    className="input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Themed season description..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label><Trans>Start Date (Saturday 18:00)</Trans></label>
                                <input
                                    type="datetime-local"
                                    className="input"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    <Trans>Create</Trans>
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    <Trans>Cancel</Trans>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SeasonsPage;
```
- **VALIDATE**: `cd apps/admin && npm run lint && npx tsc --noEmit`

#### Task 4.2: CREATE apps/admin/src/pages/TasksPage.tsx

- **IMPLEMENT**: Task library management page with CRUD
- **PATTERN**: MIRROR SeasonsPage structure
- **CODE**: [Similar structure to SeasonsPage with task-specific fields: title, description, type, difficulty, purpose, status]
- **VALIDATE**: `cd apps/admin && npm run lint && npx tsc --noEmit`

#### Task 4.3: CREATE apps/admin/src/pages/TaskAssignmentPage.tsx

- **IMPLEMENT**: Weekly task assignment interface (bulk assign to groups)
- **PATTERN**: MIRROR UI mockup from brainstorming (lines 762-811 in season-flow doc)
- **FEATURES**: List groups for current week, select task from dropdown, bulk assign, individual override
- **VALIDATE**: `cd apps/admin && npm run lint && npx tsc --noEmit`

#### Task 4.4: CREATE apps/admin/src/pages/TaskReviewPage.tsx

- **IMPLEMENT**: Review queue for task completions
- **PATTERN**: MIRROR UI mockup (lines 430-484 in brainstorming doc)
- **FEATURES**: Tabs for Pending/Approved/Revision, photo gallery, point selection, approve/revision/reject actions
- **VALIDATE**: `cd apps/admin && npm run lint && npx tsc --noEmit`

#### Task 4.5: UPDATE apps/admin/src/App.tsx - Add routes

- **IMPLEMENT**: Register new routes for new pages
- **PATTERN**: MIRROR existing route structure in App.tsx
- **IMPORTS**: Import new pages
- **CODE**:
```typescript
import SeasonsPage from './pages/SeasonsPage';
import TasksPage from './pages/TasksPage';
import TaskAssignmentPage from './pages/TaskAssignmentPage';
import TaskReviewPage from './pages/TaskReviewPage';

// Add routes:
<Route path="/seasons" element={<SeasonsPage />} />
<Route path="/tasks" element={<TasksPage />} />
<Route path="/task-assignment" element={<TaskAssignmentPage />} />
<Route path="/task-review" element={<TaskReviewPage />} />
```
- **VALIDATE**: `cd apps/admin && npm run lint`

#### Task 4.6: UPDATE apps/admin Sidebar - Add navigation links

- **IMPLEMENT**: Add Seasons, Tasks, Task Assignment, Task Review links to sidebar
- **PATTERN**: MIRROR existing sidebar link structure
- **LOCATE**: Find Sidebar component in admin app
- **VALIDATE**: `cd apps/admin && npm run lint`

### PHASE 5: USER APP UI

#### Task 5.1: CREATE apps/user/src/components/TaskCard.tsx

- **IMPLEMENT**: Task display component for GroupsPage
- **PATTERN**: MIRROR UI mockup (lines 7-54 in option-b-ui-sketches.md)
- **FEATURES**: Task title, truncated description, "Read full" expander, metadata badges, "Mark as complete" button
- **PROPS**: task object, onMarkComplete callback
- **VALIDATE**: `cd apps/user && npm run lint && npx tsc --noEmit`

#### Task 5.2: CREATE apps/user/src/components/TaskCompletionModal.tsx

- **IMPLEMENT**: Task completion submission form with photo upload
- **PATTERN**: MIRROR UI mockup (lines 119-166 in option-b-ui-sketches.md)
- **FEATURES**: Photo upload (multiple), text notes (500 char limit), submit button
- **IMPORTS**: useMutation for file uploads and submission
- **VALIDATE**: `cd apps/user && npm run lint && npx tsc --noEmit`

#### Task 5.3: UPDATE apps/user/src/pages/GroupsPage.tsx - Integrate TaskCard

- **IMPLEMENT**: Add task display above active group card
- **PATTERN**: ENHANCE existing GroupsPage (lines 1-100)
- **LOGIC**:
  1. Query task assignment via useQuery(api.taskAssignments.getForActiveGroup)
  2. Check reveal time: if Date.now() < revealTime, show "Tasks revealed Sunday 8:00 AM"
  3. If revealed, show TaskCard component
  4. Handle "Mark as complete" to open TaskCompletionModal
- **CODE**:
```typescript
// Add query after activeGroup query:
const taskAssignment = useQuery(
    api.taskAssignments.getForActiveGroup,
    isAuthenticated ? authArgs : 'skip'
);

// Add logic in JSX (before activeGroup card):
{taskAssignment && Date.now() >= taskAssignment.revealTime && (
    <TaskCard
        task={taskAssignment.task}
        reviewStatus={taskAssignment.reviewStatus}
        onMarkComplete={() => setShowCompletionModal(true)}
    />
)}

{taskAssignment && Date.now() < taskAssignment.revealTime && (
    <div className="card">
        <p>⏳ <Trans>This week's task will be revealed on Sunday morning</Trans></p>
    </div>
)}
```
- **VALIDATE**: `cd apps/user && npm run lint && npx tsc --noEmit`

### PHASE 6: TESTING & VALIDATION

#### Task 6.1: CREATE convex/seasons.test.ts

- **IMPLEMENT**: Test season lifecycle (create, activate, complete)
- **PATTERN**: MIRROR convex/groups.test.ts structure (lines 1-417)
- **TESTS**:
  - create season with valid data
  - activate season (only one active at a time)
  - complete season (marks enrollments as completed)
  - list seasons with filters
  - calculate week in season
- **IMPORTS**: setupTest, withAdminIdentity from test.utils
- **VALIDATE**: `npm run test:once`

#### Task 6.2: CREATE convex/tasks.test.ts

- **IMPLEMENT**: Test task CRUD operations
- **PATTERN**: MIRROR groups.test.ts
- **TESTS**:
  - create task with all fields
  - update task
  - archive task
  - list tasks with filters (status, type)
- **VALIDATE**: `npm run test:once`

#### Task 6.3: CREATE convex/taskAssignments.test.ts

- **IMPLEMENT**: Test assignment workflow (assign, submit, review)
- **PATTERN**: MIRROR feedback.test.ts
- **TESTS**:
  - assign task to groups (bulk)
  - submit task completion
  - review task completion (approve/reject)
  - award points on approval
  - mark incomplete as NotCompleted
  - get assignment for active group (user perspective)
- **VALIDATE**: `npm run test:once`

#### Task 6.4: UPDATE convex/matching.test.ts - Add season context tests

- **IMPLEMENT**: Test matching with seasons
- **TESTS**:
  - matching fails when no active season
  - matching uses enrolled participants only
  - groups created with seasonId and weekInSeason
  - matching respects week bounds (1-4)
- **PATTERN**: ENHANCE existing matching tests
- **VALIDATE**: `npm run test:once`

#### Task 6.5: UPDATE convex/test.utils.ts - Add factory functions

- **IMPLEMENT**: Add makeSeason, makeTask, makeTaskAssignment, makeSeasonParticipant
- **PATTERN**: MIRROR existing factory functions (lines 66-143 in test.utils.ts)
- **CODE**:
```typescript
export function makeSeason(overrides = {}) {
  return {
    name: "Test Season",
    startDate: Date.now(),
    endDate: Date.now() + 4 * 7 * 24 * 60 * 60 * 1000,
    status: "Draft",
    createdAt: Date.now(),
    createdByEmail: "test@example.com",
    ...overrides,
  };
}

export function makeTask(overrides = {}) {
  return {
    title: "Test Task",
    description: "Test task description",
    reportInstructions: "Submit photos",
    type: "Activity",
    difficulty: "Medium",
    purpose: "Everyone",
    status: "Active",
    createdAt: Date.now(),
    ...overrides,
  };
}

export function makeSeasonParticipant(
  seasonId: Id<"seasons">,
  participantId: Id<"participants">,
  overrides = {}
) {
  return {
    seasonId,
    participantId,
    enrolledAt: Date.now(),
    status: "Enrolled",
    ...overrides,
  };
}

export function makeTaskAssignment(
  groupId: Id<"groups">,
  taskId: Id<"tasks">,
  overrides = {}
) {
  return {
    groupId,
    taskId,
    weekInSeason: 1,
    assignedAt: Date.now(),
    assignedByEmail: "admin@example.com",
    reviewStatus: "Pending",
    pointsAwarded: 0,
    ...overrides,
  };
}
```
- **VALIDATE**: `npm run test:once`

#### Task 6.6: RUN full test suite

- **IMPLEMENT**: Execute all tests and ensure 100% pass
- **VALIDATE**: `npm run test:once`
- **GOTCHA**: If any tests fail, fix them before proceeding

#### Task 6.7: RUN full validation suite

- **VALIDATE**: Execute all validation commands:
```bash
# Level 1: Syntax & Style
npx tsc --noEmit
cd apps/user && npm run lint
cd apps/admin && npm run lint

# Level 2: Unit Tests
npm run test:once

# Level 3: Build
cd apps/user && npm run build
cd apps/admin && npm run build

# Level 4: Convex sync
npm run convex
```
- **GOTCHA**: All commands must pass with zero errors

---

## TESTING STRATEGY

### Unit Tests (Convex Backend)

**Framework**: Vitest with convex-test

**Coverage Requirements**: 80%+ for all new backend files

**Test Structure**:
- Use `setupTest()` for isolated database per test
- Use `withAdminIdentity(t)` for admin-authenticated tests
- Use `createTestSession(t, telegramId)` for user-authenticated tests
- Use factory functions from test.utils for consistent test data

**Test Files**:
1. `convex/seasons.test.ts` - Season lifecycle, activation, completion
2. `convex/tasks.test.ts` - CRUD operations, filtering
3. `convex/taskAssignments.test.ts` - Assignment workflow, review, points
4. `convex/matching.test.ts` - Season-aware matching

**Key Test Scenarios**:
- Season activation (only one active)
- Task assignment to groups (bulk operation)
- Task reveal timeline (Sunday 8:00 AM logic)
- Task completion submission
- Admin review and point awards
- Week close marking incomplete tasks
- Matching within season bounds

### Integration Tests

**Scope**: End-to-end workflows combining multiple backend functions

**Critical Integration Paths**:
1. **Season Activation → Matching → Task Assignment → Completion → Review**
   - Create and activate season
   - Enroll participants
   - Run matching (creates groups with seasonId)
   - Admin assigns tasks
   - User submits completion
   - Admin reviews and awards points

2. **Week Transition**
   - Active groups close
   - Incomplete tasks marked as NotCompleted
   - New matching run creates Week 2 groups
   - Task assignment for Week 2

### Edge Cases

**Critical Edge Cases to Test**:
1. **No Active Season** - Matching should fail gracefully
2. **Season Boundary** - Week calculation outside 1-4 range
3. **Duplicate Enrollment** - Prevent same participant enrolling twice in one season
4. **Task Assignment Without Task** - Group created but admin doesn't assign task before Sunday 8 AM
5. **Multiple Active Seasons** - Activation should fail if another season is active
6. **Incomplete Task on Week Close** - Ensure reviewStatus changes to "NotCompleted"
7. **Task Reveal Before Sunday 8 AM** - User should not see task details
8. **Photo Upload Limits** - Handle large files or many photos gracefully

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# TypeScript type checking (backend)
npx tsc --noEmit

# ESLint (user app)
cd apps/user && npm run lint

# ESLint (admin app)
cd apps/admin && npm run lint
```

**Expected**: Zero errors, zero warnings

### Level 2: Unit Tests

```bash
# Run all backend tests
npm run test:once

# Run with coverage report
npm run test:coverage
```

**Expected**: All tests pass, 80%+ coverage for new files

### Level 3: Build Validation

```bash
# Build user app
cd apps/user && npm run build

# Build admin app
cd apps/admin && npm run build
```

**Expected**: Successful builds with no errors

### Level 4: Convex Sync

```bash
# Sync Convex schema and functions
npm run convex
```

**Expected**: Schema migration successful, all functions synced

### Level 5: Manual Testing Checklist

**Admin Workflows:**
- [ ] Create a new season (Draft status)
- [ ] Activate the season (status → Active)
- [ ] Enroll participants in season
- [ ] Run matching manually (Saturday 18:00 simulation)
- [ ] Verify groups created with seasonId and weekInSeason
- [ ] Assign task to all groups
- [ ] Verify task assignment appears in review queue
- [ ] Complete a season (status → Completed, enrollments → Completed)

**User Workflows:**
- [ ] View active group (should show group members)
- [ ] Before Sunday 8 AM: See "Task will be revealed" message
- [ ] After Sunday 8 AM: See task card with full details
- [ ] Submit task completion with photos
- [ ] View completion status (Pending → Approved)
- [ ] Verify points awarded after admin approval

**Task Review Workflow:**
- [ ] View pending submissions in review queue
- [ ] Approve submission (award +10 points for photos)
- [ ] Request revision (status → Revision)
- [ ] Reject submission (status → Rejected)
- [ ] Verify points only awarded on approval

**Week Transition:**
- [ ] Close week (Saturday 23:00 cron)
- [ ] Verify incomplete tasks marked as "NotCompleted"
- [ ] Run matching for Week 2
- [ ] Verify weekInSeason = 2 for new groups

---

## ACCEPTANCE CRITERIA

- [x] **Schema**: 4 new tables (seasons, seasonParticipants, tasks, taskAssignments) created with all indexes
- [x] **Schema**: Groups table updated with seasonId, weekInSeason, taskId fields
- [x] **Validators**: All new enum validators defined and exported
- [x] **Backend - Seasons**: CRUD operations, activation, completion logic
- [x] **Backend - Tasks**: CRUD operations, status management
- [x] **Backend - Enrollments**: Participant enrollment and status tracking
- [x] **Backend - Assignments**: Task assignment, submission, review workflow
- [x] **Matching**: Modified to work with seasons, sourcing enrolled participants only
- [x] **Matching**: Groups created with seasonId and weekInSeason
- [x] **Cron**: Matching changed to Saturday 18:00
- [x] **Cron**: Week close marks incomplete tasks as NotCompleted
- [x] **Admin UI - Seasons**: Create, list, activate, complete seasons
- [x] **Admin UI - Tasks**: Full task library management
- [x] **Admin UI - Assignment**: Bulk task assignment interface
- [x] **Admin UI - Review**: Review queue with approve/reject actions
- [x] **User UI - Task Display**: Tasks visible after Sunday 8 AM reveal time
- [x] **User UI - Completion**: Photo upload and submission form
- [x] **User UI - Status**: Display review status and points awarded
- [x] **Points**: Task completion awards +5 (text) or +10 (photos) after admin approval
- [x] **Tests**: All new backend functions have unit tests (80%+ coverage)
- [x] **Tests**: Integration tests for season lifecycle
- [x] **Tests**: Matching tests updated for season context
- [x] **Validation**: All linting, type checking, and build commands pass
- [x] **No Regressions**: Existing functionality (feedback, payments, support) unaffected

---

## COMPLETION CHECKLIST

- [ ] All Phase 1 tasks completed (Schema & Validators)
- [ ] All Phase 2 tasks completed (Core Backend)
- [ ] All Phase 3 tasks completed (Matching Integration)
- [ ] All Phase 4 tasks completed (Admin Dashboard UI)
- [ ] All Phase 5 tasks completed (User App UI)
- [ ] All Phase 6 tasks completed (Testing)
- [ ] All validation commands pass (Levels 1-5)
- [ ] Manual testing checklist 100% complete
- [ ] All acceptance criteria met
- [ ] No regressions in existing features
- [ ] Code reviewed for patterns and quality
- [ ] Ready for production deployment

---

## NOTES

### Design Decisions

**1. Manual Task Assignment (vs. Automatic)**
- **Decision**: Admin manually assigns tasks between Saturday 18:00 - Sunday 8:00 AM
- **Rationale**: Allows admin to curate the best task for each group context, maintaining quality control
- **Trade-off**: More admin work, but better user experience

**2. Task Reveal Timeline (Sunday 8:00 AM)**
- **Decision**: Tasks become visible Sunday morning, not immediately after matching
- **Rationale**: Creates anticipation, gives admin time to assign thoughtfully
- **Implementation**: Frontend checks `Date.now() < revealTime` before displaying task

**3. Optional Season Fields in Groups Table**
- **Decision**: seasonId, weekInSeason, taskId are optional fields
- **Rationale**: Backward compatibility with existing groups created before seasons feature
- **Migration**: Existing groups remain valid with undefined season fields

**4. Season Status Lifecycle**
- **Draft** → **Active** → **Completed**
- No "Archived" status: completed seasons remain visible for analytics
- Only one Active season allowed at a time

**5. Task Assignment ReviewStatus States**
- **Pending**: Awaiting admin review (default)
- **Approved**: Admin approved, points awarded
- **Revision**: Admin requested changes
- **Rejected**: Admin rejected completion
- **NotCompleted**: Week closed without submission

### Calendar Math Considerations

**Week Calculation**:
- Week 1: Days 0-6 after season start
- Week 2: Days 7-13
- Week 3: Days 14-20
- Week 4: Days 21-27

**Helper Function**:
```typescript
const weekNumber = Math.floor(elapsedMs / weekMs) + 1;
```

**Sunday 8:00 AM Reveal Calculation**:
```typescript
const groupCreated = new Date(createdAt);
const nextSunday = new Date(groupCreated);
nextSunday.setDate(groupCreated.getDate() + (groupCreated.getDay() === 6 ? 1 : 0));
nextSunday.setHours(8, 0, 0, 0);
```

### Points System Integration

**Existing**: Feedback submission awards +10 points automatically

**New**: Task completion awards +5 (text) or +10 (photos) after admin review

**Total Possible per Week**: 20 points (10 feedback + 10 task with photos)

### Migration Strategy

**No database migration needed** - all new fields are optional, existing groups/participants continue working.

**Gradual rollout**:
1. Deploy schema changes (backward compatible)
2. Deploy backend functions
3. Create first season (Draft)
4. Enroll participants manually
5. Activate season → matching begins with season context

### Future Enhancements (Out of Scope)

- Personalized task assignment algorithm (per participant preferences)
- Public task completion gallery (showcase best submissions)
- Season leaderboards (top point earners)
- Season finale events (in-person gathering for completers)
- Task templates and duplication
- Automatic enrollment from previous season
- Mid-season joins (currently not allowed in MVP)

### Key Risks Mitigated

- ✅ **Matching failing without active season** - Handled with clear error message
- ✅ **Admin forgetting to assign tasks** - UI notification shows unassigned groups
- ✅ **Task revealed before Sunday 8 AM** - Frontend checks reveal time
- ✅ **Multiple active seasons** - Activation mutation checks and prevents
- ✅ **Existing groups breaking** - Optional season fields maintain backward compatibility
- ✅ **Points awarded before approval** - Review workflow gates point award

### Testing Notes

**convex-test setup**:
- Every test calls `setupTest()` for isolated database
- Factory functions ensure consistent test data
- Use `withAdminIdentity(t)` for admin functions
- Use `createTestSession(t, telegramId)` for user functions

**Coverage targets**:
- seasons.ts: 90%+ (critical lifecycle logic)
- tasks.ts: 85%+ (CRUD operations)
- taskAssignments.ts: 90%+ (complex workflow)
- matching.ts: 85%+ (season integration)

**Integration test priority**:
1. Full season lifecycle (create → activate → match → assign → complete → review)
2. Week transition (close → new match → new assignments)
3. Points award workflow (submit → review → points increase)

---

## Implementation Confidence: 8.5/10

**High Confidence Because**:
- Clear schema design with explicit decisions
- Strong patterns from existing codebase
- Comprehensive step-by-step tasks
- Thorough testing strategy
- All edge cases documented

**Moderate Risk Areas**:
- Calendar math for week calculation (mitigated with tests)
- Admin UI complexity for task assignment (mitigated with mockups)
- File upload for photos (existing pattern in feedback.ts)

**Success Factors**:
- Follow existing patterns religiously
- Test each phase independently
- Validate frequently (after each task)
- Use factory functions for consistent test data
