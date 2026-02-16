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
    let tasks;

    if (args.status !== undefined) {
      const status = args.status;
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else {
      tasks = await ctx.db.query("tasks").order("desc").collect();
    }

    if (args.type) {
      tasks = tasks.filter((t) => t.type === args.type);
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
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    return {
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
    };
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
