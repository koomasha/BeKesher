# Date: 2026-02-16
# Branch: masha/season-flow
# Brainstorm: Seasons + Tasks Integration
# Status: Exploration

## The Idea

Integrate a **seasons concept** into BeKesher where:
- **Seasons are 4 weeks long**, starting every second Sunday of the month
- **Groups are rematched weekly** within a season (Week 1, Week 2, Week 3, Week 4)
- **Tasks are part of the season structure** - need to determine how they're assigned/rotated

**Core question:** How do seasons, weekly rematching, and tasks work together as a cohesive system?

## Context from Previous Brainstorms

From [masha-tasks-missions-implementation-20260216-1430.md](masha-tasks-missions-implementation-20260216-1430.md):
- ✅ **Decision made:** Option B (Tasks as Group Assignments)
- Tasks have: title, description, onlineInstructions, reportInstructions, type, difficulty, purpose, status
- Task assignments tracked via `taskAssignments` table
- Admin reviews task completions
- Points awarded: +5 text, +10 with photos

From [option-b-ui-sketches.md](option-b-ui-sketches.md):
- Detailed UI mockups for task cards, completion forms, admin review queue
- Clear separation between task completion and feedback

## Codebase Context

### What We Have

**Current Weekly System:**
- **Sunday 18:00** - Weekly matching runs (cron)
- **Saturday 23:00** - Week closes, groups marked "Completed", feedback requested
- **Matching algorithm** - 5 stages, checks last 4 weeks of history to prevent repeats
- **Groups table** - `participant1-4`, `status` (Active/Completed/Cancelled), `region`, `createdAt`
- **No seasons table** - system is purely weekly currently

**Alignment with 4-week seasons:**
- History check is already 4 weeks (matches season length!)
- This means matching algorithm naturally prevents repeats within a season

**Points system:**
- Feedback submission: +10 points (automatic)
- Task completion (planned): +5 text or +10 photos (after admin review)

### Constraints

**Technical:**
- Must not break existing weekly matching logic
- Seasons need to start "every second Sunday of the month"
- Groups rematch weekly (not persistent for entire season)
- Task assignment needs to work with weekly rematching

**Business Logic:**
- Seasons are a container/context for 4 weekly cycles
- Within a season, participants meet different people each week
- Tasks are "part of the season" - but how?

**Calendar Complexity:**
- "Second Sunday of the month" means:
  - January: 2nd Sunday (e.g., Jan 12)
  - February: 2nd Sunday (e.g., Feb 9)
  - etc.
- This creates **irregular intervals** between seasons (not always 4 weeks!)
- Example: If Feb has 2nd Sunday on Feb 9, season runs Feb 9, 16, 23, Mar 2
  - But March's 2nd Sunday might be Mar 9 (1 week gap!)
  - Or if Mar 2 is still the season, next season starts Mar 9 (immediate)

**Key realization:** "Every second Sunday" does NOT mean "every 4 weeks starting from the second Sunday." It means seasons might have gaps or overlaps!

### Opportunities

- **Leverage existing 4-week history** - it aligns perfectly with season length
- **Seasons add narrative structure** - "Winter Season 2026", "Spring Adventure", etc.
- **Task rotation per season** - curate 4 tasks for each season's 4 weeks
- **Season-level analytics** - completion rates, engagement, cohort analysis
- **Season finale events** - special meetup for participants who completed all 4 weeks

### Risks

- **Calendar complexity** - irregular season boundaries could confuse users and code
- **Mid-season joins** - what happens if someone registers Week 2 of a season?
- **Season transition** - do we clear groups? Reset something? Special logic?
- **Task assignment complexity** - if groups change weekly, how do tasks persist?
- **Scope creep** - seasons could become over-engineered

## Open Questions

### Season Structure

1. **What exactly does "every second Sunday of the month" mean?**
   - Option A: Season starts 2nd Sunday, runs 4 weeks (may span into next month)
   - Option B: New season starts on 2nd Sunday of EVERY month (irregular gaps)
   - **This needs clarification from stakeholder!**

2. **What happens at season boundaries?**
   - All groups close?
   - Registration pause?
   - Special "finale week"?
   - Automatic rollover to next season?

3. **Can participants join mid-season?**
   - If yes, do they get matched immediately or wait for next season?
   - Do they see tasks from Week 1 that already passed?

### Tasks + Seasons Integration

4. **How many tasks per season?**
   - Option: 1 task for entire season (all 4 weeks)
   - Option: 4 tasks (1 per week, curated set)
   - Option: 1 task per week from active pool (not curated)

5. **Are tasks assigned at season start or week start?**
   - Season start: All 4 weeks' tasks pre-assigned
   - Week start: Task assigned during weekly matching

6. **Do tasks carry over between weeks within a season?**
   - Scenario: Group in Week 1 doesn't complete task. Week 2 they're rematched.
     - Should the incomplete task still count?
     - New group, new task?

7. **What if someone completes Week 1 task but gets rematched Week 2?**
   - Is task completion tied to the individual or the group?
   - From Option B decision: submission references both `groupId` and `submittedBy` participant

### Data Model Questions

8. **Do we need a `seasons` table?**
   - Option: Explicit `seasons` table with start/end dates, name, status
   - Option: Implicit - calculate season from group `createdAt` timestamp
   - Option: Hybrid - seasons table for metadata, groups reference seasonId

9. **How do groups relate to seasons?**
   - Add `seasonId` to groups table?
   - Add `weekInSeason` (1-4) to groups table?
   - Calculate season from `createdAt` on-the-fly?

10. **How do tasks relate to seasons?**
    - Add `seasonId` to tasks table?
    - Add `weekInSeason` to taskAssignments?
    - Tasks are season-agnostic, only assignments are season-aware?

## Options

### Option A: Explicit Seasons Table (Structured)

**Approach:**
Create a `seasons` table as a first-class entity. Groups and task assignments reference the season and week number.

**Data Model:**
```typescript
seasons: {
  name: string,                    // "Winter 2026"
  startDate: number,               // Timestamp of first Sunday
  endDate: number,                 // Timestamp of last Saturday
  status: "Upcoming" | "Active" | "Completed",
  weekCount: 4,                    // Always 4
}

groups: {
  ...existing fields,
  seasonId: Id<"seasons">,         // NEW
  weekInSeason: 1 | 2 | 3 | 4,     // NEW
}

tasks: {
  ...existing fields,
  // Tasks are season-agnostic, reusable
}

taskAssignments: {
  groupId: Id<"groups">,
  taskId: Id<"tasks">,
  seasonId: Id<"seasons">,         // NEW - for analytics
  weekInSeason: 1 | 2 | 3 | 4,     // NEW
  assignedAt: number,
  completedAt?: number,
  ...completion fields
}
```

**How it works:**
1. **Season creation:** Admin or cron creates season on second Sunday
2. **Weekly matching:** When creating groups, lookup active season, set `seasonId` and calculate `weekInSeason`
3. **Task assignment:**
   - Admin curates 4 tasks for the season (maps task to week 1-4)
   - OR system assigns from active pool per week
4. **Season transition:** Cron job checks if it's a new season start date, marks old season "Completed", creates new season

**Leverages:**
- Clean separation of concerns
- Rich analytics (completion rate per season, per week)
- Easy to query "all groups in Winter 2026"
- Season-level features (leaderboards, finale events)

**Constraints:**
- More complex data model (3 new fields across 2 tables)
- Season creation/transition logic needed
- Need to handle edge cases (what if cron fails to create season?)

**Effort:** Medium-High (3-4 days)
- Schema changes
- Season management functions (create, activate, complete)
- Update matching logic to set season fields
- Admin UI for season management
- Season transition cron logic

**Risk:** Medium
- Calendar math for "second Sunday" could be tricky
- Season boundary edge cases
- Migration: existing groups have no seasonId (backfill or ignore?)

---

### Option B: Implicit Seasons (Calculated)

**Approach:**
No `seasons` table. Calculate season membership from group `createdAt` timestamp using calendar math.

**Data Model:**
```typescript
// groups table unchanged (no seasonId)
// Add helper functions to calculate season

function getSeasonForDate(timestamp: number) {
  // Calculate which season this date belongs to
  // Return { seasonNumber, weekInSeason, startDate, endDate }
}
```

**How it works:**
1. **No explicit season creation** - seasons are a calculated concept
2. **Weekly matching:** Groups created as usual, `createdAt` is the source of truth
3. **Task assignment:** Calculate current week in season during matching, assign task based on week number
4. **Querying:** Use calculated fields to filter/group by season

**Leverages:**
- Minimal schema changes
- No season lifecycle management needed
- Simpler implementation

**Constraints:**
- Can't name seasons ("Winter 2026" would need to be calculated or stored separately)
- Harder to do season-level features (finale events, special rewards)
- Less clear boundaries (when does a season "end"?)
- Calendar math in every query that needs season context

**Effort:** Low-Medium (2-3 days)
- Calendar calculation utilities
- Update task assignment logic to be week-aware
- No new tables

**Risk:** Low-Medium
- Calendar edge cases still exist
- Harder to extend with season-specific features later
- Potential performance issues if calculating season for every group query

---

### Option C: Hybrid - Seasons Metadata + Implicit Weeks

**Approach:**
Create a lightweight `seasons` table for metadata and admin UI, but groups don't reference it directly. Calculate week-in-season from `createdAt`.

**Data Model:**
```typescript
seasons: {
  name: string,
  startDate: number,
  endDate: number,
  status: "Upcoming" | "Active" | "Completed",
}

// groups table unchanged

// Task assignments reference season for analytics
taskAssignments: {
  ...existing,
  seasonId: Id<"seasons">,  // For reporting
  weekInSeason: 1 | 2 | 3 | 4,
}
```

**How it works:**
1. **Season table for admin:** List of seasons, names, dates
2. **Groups remain simple:** No seasonId, use `createdAt` to calculate which season they belong to
3. **Task assignments track season:** For analytics, we record which season the task was for
4. **Best of both worlds:** Named seasons + simple group model

**Leverages:**
- Season names and metadata for UI
- Groups table stays simple
- Can still query "tasks completed in Winter 2026"

**Constraints:**
- Dual system: explicit seasons + implicit group-to-season mapping
- Need to ensure season dates don't overlap
- Slight inconsistency (seasons explicit, group membership implicit)

**Effort:** Medium (3-4 days)
- Lightweight seasons table
- Calendar utilities to map groups to seasons
- Task assignment updates
- Admin season management UI

**Risk:** Low-Medium
- Complexity of maintaining two systems
- Potential bugs if season dates are wrong

---

### Option D: Tasks Per Season (Curated Sets)

**Approach:**
Focus on the task relationship: each season has a curated set of 4 tasks (one per week). This option works with any of the above (A, B, or C) but emphasizes task curation.

**Data Model:**
```typescript
seasons: {
  name: string,
  startDate: number,
  endDate: number,
  status: "Upcoming" | "Active" | "Completed",
  week1TaskId: Id<"tasks">,  // Curated task for week 1
  week2TaskId: Id<"tasks">,  // Curated task for week 2
  week3TaskId: Id<"tasks">,  // Curated task for week 3
  week4TaskId: Id<"tasks">,  // Curated task for week 4
}
```

**OR:**
```typescript
seasonTasks: {
  seasonId: Id<"seasons">,
  weekNumber: 1 | 2 | 3 | 4,
  taskId: Id<"tasks">,
}
```

**How it works:**
1. **Admin curates season:** Before season starts, admin selects 4 tasks for the 4 weeks
2. **Week-based assignment:** During Sunday matching, assign task based on current week in season
3. **Themed seasons:** Could have "Adventure Season" with adventure tasks, "Connection Season" with conversation tasks

**Leverages:**
- Strong narrative (seasons feel intentional, not random)
- Better user experience (themed tasks create anticipation)
- Admin control over task progression

**Constraints:**
- Requires admin to plan ahead
- Less flexible (can't change task mid-week)
- What if not enough tasks exist for a season?

**Effort:** Medium (builds on Option A or C)
- Season-task relationship table or fields
- Admin UI for curating season tasks
- Task assignment logic reads from season

**Risk:** Medium
- Admin burden (must curate every season)
- Rigidity (locked into 4 tasks per season)

---

## Current Direction

**✅ DECISIONS MADE - 2026-02-16**

### **Confirmed Requirements:**

1. **Season activation:** Manual from admin panel (not automatic cron)
   - Conceptually "every second Sunday" but allows flexibility for gaps/exceptions

2. **Task assignment:** Manual by admin, 4 tasks per season
   - No "default task" field in schema (UX concept only)
   - Each group gets `taskId` assigned individually
   - Admin UI allows bulk selection to assign same task to multiple groups at once

3. **Mid-season joins:** Not allowed in MVP
   - Participants enroll before season starts
   - Once season is active, no new enrollments

4. **Task visibility:** All groups get same task in MVP (personalized tasks in future)
   - After Alice completes Week 1 task with Group A, she gets Week 2 task with Group B
   - Tasks are per week, not per group

5. **Season lifecycle:** After season ends, participants stop being matched
   - Must enroll in new season to participate again
   - Tracked via `seasonParticipants` table

6. **Matching schedule:** **Saturday 18:00** (changed from Sunday)
   - Groups created with `taskId = undefined`
   - Admin assigns tasks manually after matching

7. **Task reveal timing:** **Sunday 8:00 AM**
   - Admin assigns tasks anytime between Saturday 18:00 - Sunday 8:00
   - Tasks appear to participants starting Sunday 8:00
   - Admin responsibility to assign before deadline

8. **Task completion tracking:** New group = new task, no carry over
   - Get feedback on why task wasn't completed (for analytics)
   - TaskAssignment created when admin assigns task (status: "Pending")

9. **Season enrollment states:**
   - "Enrolled" - active, will be matched
   - "Paused" - skip matching this week
   - "Completed" - finished all 4 weeks
   - "Dropped" - left season early

### **Data Model Decision:**

**Simplified structure** - no curated task fields in seasons table:
- Seasons table: metadata only (name, dates, status)
- Groups table: seasonId, weekInSeason, taskId (assigned manually)
- seasonParticipants table: enrollment tracking
- taskAssignments table: completion lifecycle tracking

Tasks are season-agnostic and reusable. Future: personalized task assignment algorithm.

## Notes

### Calendar Math Example

**Scenario:** Seasons start "every second Sunday of the month"

- **January 2026:** 2nd Sunday = Jan 11
  - Season runs: Jan 11, 18, 25, Feb 1 (spans into February)
- **February 2026:** 2nd Sunday = Feb 8
  - **Gap!** Feb 1 (end of Jan season) → Feb 8 (start of Feb season) = 1 week gap
  - Season runs: Feb 8, 15, 22, Mar 1
- **March 2026:** 2nd Sunday = Mar 8
  - **Gap!** Mar 1 (end of Feb season) → Mar 8 (start of Mar season) = 1 week gap

**Observation:** This creates irregular gaps and requires special handling for "off weeks" where no season is active.

**Alternative interpretation:**
Maybe the intention is "seasons run continuously, each starting exactly 4 weeks after the previous, and the first one starts on the second Sunday"?

### Task Completion Across Rematches

**Scenario:** Alice is in Group A (Week 1), task is "Что ты умеешь?"
- Group A meets Monday, completes task, Alice submits report
- Saturday: Week 1 ends, Group A marked "Completed"
- Sunday: Week 2 matching - Alice gets matched into Group B (new people)
- **Question:** Does Alice see a new Week 2 task? Or is she "done" since she completed Week 1?

**Answer depends on task assignment model:**
- **If tasks are per season:** Alice sees Week 2 task (different from Week 1)
- **If tasks are per group:** Group B gets a task, Alice participates (could be same or different)

**Recommendation:** Tasks are per week-in-season, not per group. This means:
- Week 1 of season: All groups get Task A
- Week 2 of season: All groups get Task B
- Alice can complete one task per week (even if she's in a new group)

### Season Lifecycle States

If we have a `seasons` table, useful states:
- **Draft:** Admin is setting it up (selecting tasks, naming it)
- **Upcoming:** Created but start date not reached
- **Active:** Currently running
- **Completed:** All 4 weeks finished
- **Archived:** Old season, hidden from UI

### Migration Consideration

If we add `seasonId` to groups:
- Existing groups (before seasons feature) would have `seasonId: undefined`
- Could backfill by calculating which season they belonged to based on `createdAt`
- Or just leave old groups without season (acceptable)

### Season Finale Feature Ideas

If we have explicit seasons:
- **Season completion badge:** Participants who completed all 4 weeks
- **Season leaderboard:** Top point earners for the season
- **Finale event:** Optional in-person gathering for season completers
- **Season recap:** "You met 12 new people this season, completed 3/4 tasks"

These features strongly favor Option A or C (explicit seasons table).

---

## FINAL DATA STRUCTURE - APPROVED FOR IMPLEMENTATION

**Date finalized:** 2026-02-16
**Status:** ✅ Ready for implementation

### Schema Changes

```typescript
// ========================================
// SEASONS TABLE - New
// ========================================
seasons: {
  name: string,                      // "Winter 2026"
  description?: string,              // Optional theme/description
  startDate: number,                 // First Saturday 18:00 timestamp
  endDate: number,                   // Last Saturday 23:00 (4 weeks later)
  status: "Draft" | "Active" | "Completed",
  createdAt: number,
  createdByEmail: string,            // Admin email from ctx.adminEmail
}
  .index("by_status", ["status"])

// ========================================
// SEASON PARTICIPANTS TABLE - New
// ========================================
seasonParticipants: {
  seasonId: Id<"seasons">,
  participantId: Id<"participants">,
  enrolledAt: number,
  status: "Enrolled" | "Paused" | "Completed" | "Dropped",
}
  .index("by_seasonId", ["seasonId"])
  .index("by_participantId", ["participantId"])
  .index("by_seasonId_and_status", ["seasonId", "status"])

// ========================================
// GROUPS TABLE - Updated
// ========================================
groups: {
  // Existing fields (unchanged)
  createdAt: number,
  status: "Active" | "Completed" | "Cancelled",
  region?: "North" | "Center" | "South",
  participant1: Id<"participants">,
  participant2: Id<"participants">,
  participant3?: Id<"participants">,
  participant4?: Id<"participants">,

  // NEW fields for seasons
  seasonId: Id<"seasons">,
  weekInSeason: 1 | 2 | 3 | 4,
  taskId?: Id<"tasks">,              // Assigned manually by admin after matching
}
  .index("by_status", ["status"])
  .index("by_createdAt", ["createdAt"])
  .index("by_seasonId", ["seasonId"])                              // NEW
  .index("by_seasonId_and_weekInSeason", ["seasonId", "weekInSeason"])  // NEW
  .index("by_seasonId_and_status", ["seasonId", "status"])         // NEW

// ========================================
// TASKS TABLE - Updated
// ========================================
tasks: {
  title: string,
  description: string,
  onlineInstructions?: string,       // How to adapt for remote/video call
  reportInstructions: string,        // What to submit as proof
  type: "Activity" | "Conversation" | "Creative" | "Philosophy",
  difficulty: "Easy" | "Medium" | "Hard",
  purpose: "Everyone" | "Romantic" | "Friendship",
  status: "Active" | "Archive",
  createdAt: number,
  createdByEmail?: string,           // Optional: track creator
}
  .index("by_status", ["status"])
  .index("by_type", ["type"])

// ========================================
// TASK ASSIGNMENTS TABLE - New
// ========================================
taskAssignments: {
  groupId: Id<"groups">,
  taskId: Id<"tasks">,
  weekInSeason: 1 | 2 | 3 | 4,       // Denormalized for analytics

  // Assignment tracking
  assignedAt: number,
  assignedByEmail: string,           // Admin who assigned the task

  // Participant submission
  completedAt?: number,
  completionNotes?: string,
  completionPhotos?: Id<"_storage">[],
  submittedBy?: Id<"participants">,
  submittedAt?: number,

  // Admin review
  reviewStatus: "Pending" | "Approved" | "Revision" | "Rejected" | "NotCompleted",
  reviewedAt?: number,
  reviewedByEmail?: string,          // Admin who reviewed
  reviewComment?: string,
  pointsAwarded: number,             // 0, 5, or 10

  // Analytics & feedback
  notCompletedReason?: string,       // Why task wasn't completed
}
  .index("by_groupId", ["groupId"])
  .index("by_taskId", ["taskId"])
  .index("by_reviewStatus", ["reviewStatus"])
  .index("by_submittedBy", ["submittedBy"])
  .index("by_weekInSeason", ["weekInSeason"])

// ========================================
// PARTICIPANTS TABLE - No changes needed
// ========================================
// Season enrollment tracked separately in seasonParticipants table
```

### Weekly Flow

#### **Saturday 18:00 - Matching (Automated Cron)**
```typescript
1. Get active season
2. Get enrolled participants:
   - seasonParticipants.status = "Enrolled" (excludes "Paused")
   - participants.status = "Active"
   - participants.onPause = false
3. Run 5-stage matching algorithm
4. Create groups:
   {
     seasonId,
     weekInSeason,           // Calculated based on season.startDate
     taskId: undefined,      // Not assigned yet
     status: "Active",
     ...participants
   }
5. NO taskAssignments created yet
```

**Cron update needed:**
```typescript
// Change from Sunday to Saturday
crons.cron("weekly-matching", "0 16 * * 6", ...)  // Saturday 16:00 UTC (18:00 Israel)
```

#### **Saturday 18:00 - Sunday 8:00 AM - Admin Assigns Tasks (Manual)**

**Admin UI workflow:**
1. Admin sees notification: "Week 2 matching completed! 15 groups created. [Assign tasks →]"
2. Admin opens task assignment page
3. Selects task from dropdown
4. Options:
   - "Assign to all groups" - bulk assign same task
   - Select specific groups - bulk assign to subset
   - Individual override per group
5. Clicks "Assign" button

**Backend mutation (assignTasksToGroups):**
```typescript
for each selected group:
  1. Update group: set taskId
  2. Create taskAssignment:
     {
       groupId,
       taskId,
       weekInSeason: group.weekInSeason,
       assignedAt: now,
       assignedByEmail: ctx.adminEmail,
       reviewStatus: "Pending",
       pointsAwarded: 0,
     }
```

**Important:** Admin must complete task assignment before Sunday 8:00 AM (admin responsibility).

#### **Sunday 8:00 AM - Tasks Become Visible to Participants**

**User query (getActiveGroup):**
```typescript
const group = await getMyActiveGroup();
if (!group.taskId) {
  return { group, task: null };  // No task assigned yet
}

// Calculate task reveal time: Sunday 8:00 AM of group's week
const groupCreatedAt = new Date(group.createdAt);
const nextSunday = getNextSunday(groupCreatedAt);
const taskRevealTime = new Date(nextSunday);
taskRevealTime.setHours(8, 0, 0, 0);  // Sunday 8:00 AM Israel time

if (Date.now() < taskRevealTime.getTime()) {
  return { group, task: null };  // Task assigned but not visible yet
}

const task = await ctx.db.get(group.taskId);
return { group, task };
```

**Helper function:**
```typescript
// Get next Sunday 8:00 AM after a given date
function getNextSunday8AM(timestamp: number): number {
  const date = new Date(timestamp);
  const dayOfWeek = date.getDay();
  const daysUntilSunday = dayOfWeek === 6 ? 1 : 0;  // If Saturday, Sunday is +1 day

  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(8, 0, 0, 0);
  return date.getTime();
}
```

#### **During Week - Participant Submits Task Completion**

**User flow:**
1. Participant views task (visible from Sunday 8:00 AM)
2. Group completes task during week
3. Participant uploads photos, writes notes
4. Submits completion

**Backend mutation (submitTaskCompletion):**
```typescript
const assignment = await ctx.db
  .query("taskAssignments")
  .withIndex("by_groupId", q => q.eq("groupId", groupId))
  .first();

await ctx.db.patch(assignment._id, {
  completedAt: Date.now(),
  completionNotes: args.notes,
  completionPhotos: args.photoIds,
  submittedBy: ctx.participantId,
  submittedAt: Date.now(),
  // reviewStatus remains "Pending" (awaits admin review)
});
```

#### **Admin Reviews Task Completion**

**Admin UI:**
- Review queue showing submissions (status: "Pending")
- View photos, notes, group info
- Choose points: text (+5) or photos (+10)
- Approve / Request revision / Reject
- Optional comment

**Backend mutation (reviewTaskCompletion):**
```typescript
await ctx.db.patch(assignmentId, {
  reviewStatus: "Approved",
  reviewedAt: Date.now(),
  reviewedByEmail: ctx.adminEmail,
  reviewComment: args.comment,
  pointsAwarded: args.points,  // 5 or 10
});

// Award points to participant
const assignment = await ctx.db.get(assignmentId);
const participant = await ctx.db.get(assignment.submittedBy);
await ctx.db.patch(participant._id, {
  totalPoints: participant.totalPoints + args.points,
});
```

#### **Next Saturday 18:00 - Week Closes & New Week Begins**

**Week close logic:**
```typescript
1. Mark all active groups as "Completed"
2. For taskAssignments with reviewStatus = "Pending":
   - Update to "NotCompleted"
   - Optionally send notification asking for reason
3. Trigger new matching for next week
```

### Admin UI Mockup: Task Assignment Page

```
┌────────────────────────────────────────────────────────────┐
│ BEKESHER Admin                                             │
│ ┌─────┬──────┬──────┬───────┬─────┬─────────┐             │
│ │ ... │Groups│Tasks │Support│... │Seasons  │             │
│ └─────┴──────┴──────┴───────┴─────┴────▼────┘             │
│                                                            │
│ Winter 2026 > Week 2 > Task Assignment                    │
│ ════════════════════════════════════════════               │
│                                                            │
│ 🔔 Week 2 matching completed at Sat 18:00                 │
│    15 groups created, 0 have tasks assigned               │
│    ⏰ Deadline: Sunday 8:00 AM (tasks become visible)     │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Quick Assign to All Groups:                        │    │
│ │                                                     │    │
│ │ Select task: [Что ты умеешь?              ▼]      │    │
│ │                                                     │    │
│ │ [Assign to all 15 groups]                          │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Groups:                           Status: [All ▼]  │    │
│ │                                                     │    │
│ │ ☑ Select All (15)                                  │    │
│ │                                                     │    │
│ │ ☑ Group #847 │ North  │ 3 people │ Active          │    │
│ │   Task: [Not assigned                          ▼]  │    │
│ │   Created: Sat Feb 15, 18:00                       │    │
│ │                                                     │    │
│ │ ☑ Group #848 │ Center │ 4 people │ Active          │    │
│ │   Task: [Not assigned                          ▼]  │    │
│ │                                                     │    │
│ │ ☐ Group #849 │ South  │ 2 people │ Active          │    │
│ │   Task: [Человек-город                         ▼]  │    │
│ │   ✅ Assigned by masha@koomasha.com                │    │
│ │                                                     │    │
│ │ ... (12 more groups)                                │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Bulk assign to 2 selected groups:                  │    │
│ │ [Select task                               ▼]      │    │
│ │ [Assign to selected]                               │    │
│ └────────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### User Experience: Task Visibility Timeline

**Saturday 18:00:**
- Group created via matching
- User sees "Your group for Week 2" with members
- Task section shows: "⏳ This week's task will be revealed on Sunday morning"

**Saturday 18:00 - Sunday 8:00:**
- Admin assigns task
- User still sees: "⏳ This week's task will be revealed on Sunday morning"
- (Task exists in database but not shown to user yet)

**Sunday 8:00 AM:**
- Task becomes visible
- User sees task card with title, description, "Mark as complete" button
- Can read full task details, submit completion anytime during the week

**Key point:** This creates anticipation and gives admin time to curate the best task for each group.
