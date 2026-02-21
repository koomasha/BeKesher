# Date: 2026-02-16 14:30
# Branch: masha/posting-consent
# Brainstorm: Tasks/Missions Implementation for Tuk-Tuk
# Status: ✅ Decision Made - Option B Selected

## The Idea

Add a tasks/missions system to Tuk-Tuk where:
- **Admin side**: Create, edit, and manage weekly tasks that groups complete
- **User side**: View current week's task assigned to their group, submit completion reports with photos/feedback

Looking at the legacy system (airtable_missions.txt), tasks were a core part of the game - each week groups would get a creative mission like "Что ты умеешь?" (What can you do?), "Неслучайные совпадения" (Non-random coincidences), etc. Participants would complete the task together and submit reports to earn points.

## Codebase Context

### What We Have

**Database Schema** (convex/schema.ts):
- ✅ `participants` - user profiles with points system
- ✅ `groups` - weekly matched groups with status (Active/Completed/Cancelled)
- ✅ `feedback` - post-meetup feedback with ratings, photos, text feedback
- ❌ No `tasks` or `missions` table yet

**Backend Functions** (convex/):
- ✅ `groups.ts` - group lifecycle management, CRUD operations
- ✅ `feedback.ts` - feedback submission with point awards (+10 points)
- ✅ `matching.ts` - weekly matching algorithm (runs Sunday 18:00)
- ✅ `crons.ts` - scheduled jobs for matching and week close
- ✅ Auth system with `userQuery`, `userMutation`, `adminQuery`, `adminMutation`

**Frontend - User App** (apps/user/):
- ✅ GroupsPage.tsx - displays active group and past groups
- ✅ FeedbackPage.tsx - submit feedback with ratings and photos
- ✅ Already uses i18n with @lingui/macro for Russian text
- ❌ No task view or task completion UI

**Frontend - Admin App** (apps/admin/):
- ✅ GroupsPage, ParticipantsPage, SupportPage, MatchingPage
- ❌ No tasks management page

**Existing Patterns**:
- Real-time data via Convex queries (`useQuery`)
- File uploads via Convex storage (`_storage`)
- Points system (feedback awards +10 points)
- Status-based workflows (groups: Active → Completed)

### Legacy System Structure

From `legacy/airtable.json` and `airtable_missions.txt`, tasks had:
- **Number**: Auto-incrementing task number (1, 2, 3...)
- **Name**: Task title (e.g., "Что ты умеешь?")
- **Description**: Full task description with:
  - Main instructions
  - 💻 Online version (how to adapt for video call)
  - Отчёт section (what to submit as proof)
- **Status**: "Активное" (Active), "Использовано" (Used), "Архив" (Archive)
- **Type**: Activity, Conversation, Creative, Philosophy, etc.
- **Difficulty**: Easy, Medium, Hard
- **Purpose**: For everyone / Romantic / Friendship

**Key insights from legacy missions**:
- Tasks are creative and require in-person interaction
- Each task has online adaptation instructions
- Reports require photos + text description
- Tasks are reusable (status: Archive → Active → Used → Archive cycle)

### Constraints

**Technical**:
- Must work in Telegram Mini App context (mobile-first)
- Photo uploads already working for feedback (can reuse pattern)
- Real-time updates needed (Convex handles this)
- Admin needs simple CRUD interface (not database access)

**Business Logic**:
- Tasks assigned **per group** for a specific week
- One active task per group at a time
- Task completion tied to feedback system (already awards points)
- Tasks are reusable across different weeks/seasons

**Data Relationships**:
- Groups → have one active task
- Tasks → used by multiple groups over time
- Feedback → could reference task completion

### Opportunities

- **Leverage existing feedback system**: Task reports could extend the current feedback mechanism
- **Reuse file upload infrastructure**: Photos for task completion use same `_storage` as feedback
- **Align with weekly cycle**: Tasks assigned during Sunday matching, completed before Saturday week close
- **Expand points system**: Award points for creative task completion (beyond just feedback)

### Risks

- **Scope creep**: Tasks could become complex with types, difficulty, filters
- **Assignment logic**: How to assign tasks to groups? Manual? Automatic rotation?
- **Migration**: ~12 legacy tasks to potentially import
- **UX complexity**: Task view needs to be intuitive within limited mobile space

## Options

### Option A: Minimal - Extend Feedback System

**Approach**:
Treat tasks as "weekly themes" stored in a simple `tasks` table. Don't assign tasks to groups explicitly - instead, display the current week's active task to all groups, and capture task-related info in the existing feedback form.

**Leverages**:
- Existing `feedback` table (already has `taskEffect` field!)
- Current feedback submission flow and photo uploads
- Weekly cron cycle (matching Sunday → week close Saturday)

**How it works**:
1. Add `tasks` table with: title, description, status, weekNumber
2. Admin creates/activates one task per week
3. User app shows "This week's task" to all active groups
4. When submitting feedback, users optionally upload task completion photos/notes
5. Points awarded via existing feedback mechanism

**Constraints**:
- All groups get same task (no personalization)
- Task completion mixed with feedback (less structured)
- No task assignment history per group

**Effort**: Low (2-3 days)
- Schema: Add simple `tasks` table
- Backend: 3-4 queries/mutations for task CRUD
- User UI: Add task card to GroupsPage
- Admin UI: Simple tasks list + form

**Risk**: Low
- Minimal changes to existing flow
- Could feel "tacked on" vs. integrated feature

---

### Option B: Integrated - Tasks as Group Assignments

**Approach**:
Create a robust tasks system with explicit task assignment to groups. Each group gets assigned a specific task when matched, and task completion is tracked separately from general feedback.

**Leverages**:
- Existing group lifecycle (Active → Completed)
- Real-time queries for showing group-specific data
- File storage for task completion evidence

**How it works**:
1. Add `tasks` table: id, title, description, onlineVersion, reportInstructions, type, difficulty, status (Active/Archive/Used)
2. Add `taskAssignments` table: groupId, taskId, assignedAt, completedAt, submittedBy[], completionPhotos[], completionNotes
3. During weekly matching (Sunday), assign tasks to groups:
   - Round-robin from Active tasks
   - Or manual admin selection
   - Or random assignment
4. User app:
   - Active group card shows "Your task this week"
   - Dedicated task completion form (separate from feedback)
   - Photo upload + text notes
   - All group members can see task, any member can submit
5. Admin app:
   - Full task CRUD (create, edit, activate, archive)
   - View task usage statistics
   - See which groups completed which tasks

**Constraints**:
- More complex data model (3 tables vs 1)
- Task assignment logic needs decisions (who chooses? how to rotate?)
- Migration of legacy tasks requires more structure

**Effort**: Medium (5-7 days)
- Schema: 2 new tables with relationships
- Backend: 8-10 queries/mutations (task CRUD, assignment logic, completion tracking)
- User UI: Dedicated task section in GroupsPage, task completion modal/page
- Admin UI: Full tasks management page with filters, task creation form, assignment controls

**Risk**: Medium
- Assignment logic could be contentious (admin wants control vs. automation)
- More moving parts = more potential bugs
- Scope could expand (task scheduling, task pools per region, etc.)

---

### Option C: Advanced - Tasks with Completion Workflow

**Approach**:
Build Option B plus add task completion as a multi-stage workflow with validation, admin review, and enhanced gamification.

**Leverages**:
- All of Option B
- Existing admin review patterns (like support tickets)
- Points system with potential for variable rewards

**How it works**:
- Everything from Option B, plus:
  1. Task completion has status: Draft → Submitted → Reviewed → Approved/Rejected
  2. Admin reviews task completion submissions
  3. Points awarded only upon approval (variable points based on task difficulty)
  4. Task completion gallery (public showcase of best submissions)
  5. Task categories and filters (type, difficulty, purpose)
  6. Task templates and duplication

**Constraints**:
- Significantly more admin work (review each submission)
- Complex workflow states
- Higher UX expectations (users expect polished experience)

**Effort**: High (10+ days)
- All of Option B
- Admin review interface
- Workflow state machine
- Gallery/showcase feature
- Advanced filtering and search

**Risk**: High
- Overengineering for MVP
- Admin burden could be unsustainable
- Feature bloat

---

### Option D: Hybrid - Simple Tasks + Smart Integration

**Approach**:
Combine the simplicity of Option A with strategic elements from Option B. Tasks are simple and shared, but we track which groups engaged with which tasks for future ML/matching improvements.

**Leverages**:
- Simple task structure (like Option A)
- Light tracking (inspired by Option B)
- Existing feedback system

**How it works**:
1. Add `tasks` table: id, title, description, onlineInstructions, reportInstructions, status, activeWeek (optional)
2. Extend `feedback` table: add `completedTaskId` (optional reference to task)
3. Admin:
   - Create tasks with simple form
   - Mark one task as "active this week" (or set for specific week)
4. User app:
   - Show current active task to all groups
   - When submitting feedback, checkbox "We completed this week's task"
   - If checked, show task-specific upload section
5. Backend tracking:
   - Record which participants/groups engaged with which tasks
   - Data useful for future AI matching (people who like similar tasks)

**Constraints**:
- Still shared tasks (not personalized per group)
- Completion tracking is lightweight (yes/no + evidence)

**Effort**: Low-Medium (3-4 days)
- Schema: 1 table + 1 field addition
- Backend: 4-5 queries/mutations
- User UI: Task card + enhanced feedback form
- Admin UI: Simple task management page

**Risk**: Low-Medium
- Good balance of functionality vs complexity
- Could expand to Option B later if needed
- Might lack the "special" feeling of assigned tasks

## Open Questions

### Task Assignment
1. **Who assigns tasks to groups?**
   - Option: Admin manually selects (high control, high effort)
   - Option: Auto-assign round-robin from active pool (low effort, fair distribution)
   - Option: Random from active pool (simple, potentially repetitive)

2. **Same task for all groups or different tasks?**
   - All groups same task = easier to manage, builds shared experience
   - Different tasks = more personalized, but complex tracking

### Task Completion
3. **Is task completion mandatory or optional?**
   - Mandatory = blocks feedback? Affects points?
   - Optional = bonus points? How to incentivize?

4. **Who can submit task completion for a group?**
   - Any member
   - Requires all members to confirm
   - First person to submit represents group

5. **What's the relationship between task completion and feedback?**
   - Same form (unified experience)
   - Separate forms (cleaner separation)
   - Task completion required before feedback submission

### Admin Experience
6. **How much control does admin need over task assignment?**
   - Full control (assign specific task to specific group)
   - Moderate (activate/deactivate tasks, system assigns)
   - Minimal (create tasks, system handles rest)

7. **Should admin review task completions?**
   - Yes = quality control, more admin work
   - No = autonomous, faster, less oversight

### Migration & Data
8. **Migrate 12 legacy tasks from Airtable?**
   - Import all at once
   - Start fresh, add as needed
   - Import incrementally with admin review

9. **Track historical task usage?**
   - Which tasks are most popular
   - Which groups completed which tasks
   - Task completion rates

## Current Direction

**✅ DECISION: Going with Option B (Integrated - Tasks as Group Assignments)**

**Date decided:** 2026-02-16
**Status:** Ready for implementation planning

### Confirmed Requirements

**Answers to key questions:**
1. ✅ **Task assignment**: Same task for all groups (MVP), with shift to personalized tasks in the future
2. ✅ **Task completion**: Optional, awards bonus points
   - Text feedback: +5 points
   - Photo feedback: +10 points
3. ✅ **Admin review**: Yes, required for quality control (will be automated with AI when app scales)

### Why Option B?

**Advantages:**
- Clean separation between task completion and feedback
- Dedicated admin review workflow for quality control
- Better tracking of which groups completed which tasks
- Scalable to personalized task assignment later
- Rich analytics on task engagement and popularity
- Professional UX with dedicated task completion flow

**Implementation approach:**
- Start with same task for all groups (simpler assignment logic)
- Build full review queue for admin
- Task completion separate from feedback submission
- Two separate point awards: base feedback (+10) + task completion (+5 text or +10 photo)

### Next Steps

1. ✅ Create detailed schema design
2. ✅ Plan backend functions (queries/mutations)
3. ✅ Design UI mockups → See [option-b-ui-sketches.md](option-b-ui-sketches.md)
4. Create implementation plan with tasks breakdown
5. Begin development

## Notes

**From the legacy missions analysis**:
- Tasks are incredibly creative and thoughtful (not just "grab coffee")
- The online adaptation is important (post-COVID consideration)
- Report requirements are clear (photo + description pattern works)
- Tasks are seasonal/reusable (good for long-term game)

**Technical note**:
The feedback table already has a `taskEffect` field - this suggests the original plan may have included task integration with feedback. We should explore what this field was meant for.

**UX consideration**:
Tasks should feel like an exciting bonus, not homework. The current GroupsPage shows active group + members. Adding a beautiful task card with imagery/icons could make it feel like a "weekly mission" game element.

**Next steps after decision**:
1. Confirm Option and answer open questions
2. Create detailed schema design
3. Plan backend functions (queries/mutations)
4. Design UI mockups (task card, admin form)
5. Implement and test
