import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all comments for a specific task, ordered by creation time (oldest first)
 */
export const listByTask = query({
    args: { taskId: v.id("tasks") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("taskComments")
            .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
            .order("asc")
            .collect();
    },
});

/**
 * Add a new comment to a task
 */
export const addComment = mutation({
    args: {
        taskId: v.id("tasks"),
        authorName: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify task exists
        const task = await ctx.db.get(args.taskId);
        if (!task) {
            throw new Error("Task not found");
        }

        // Create comment
        const commentId = await ctx.db.insert("taskComments", {
            taskId: args.taskId,
            authorId: "admin", // Can be enhanced with actual admin auth
            authorName: args.authorName,
            text: args.text,
            createdAt: Date.now(),
        });

        return commentId;
    },
});

/**
 * Delete a comment
 */
export const deleteComment = mutation({
    args: { commentId: v.id("taskComments") },
    handler: async (ctx, args) => {
        // Verify comment exists
        const comment = await ctx.db.get(args.commentId);
        if (!comment) {
            throw new Error("Comment not found");
        }

        await ctx.db.delete(args.commentId);
    },
});
