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
    let assignments;

    if (args.reviewStatus !== undefined) {
      const reviewStatus = args.reviewStatus;
      assignments = await ctx.db
        .query("taskAssignments")
        .withIndex("by_reviewStatus", (q) =>
          q.eq("reviewStatus", reviewStatus)
        )
        .collect();
    } else {
      assignments = await ctx.db.query("taskAssignments").collect();
    }

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
