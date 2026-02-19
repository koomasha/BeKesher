import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List all comments for a specific season, ordered by creation time (oldest first)
 */
export const listBySeason = query({
    args: { seasonId: v.id("seasons") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("seasonComments")
            .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
            .order("asc")
            .collect();
    },
});

/**
 * Add a new comment to a season
 */
export const addComment = mutation({
    args: {
        seasonId: v.id("seasons"),
        authorName: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify season exists
        const season = await ctx.db.get(args.seasonId);
        if (!season) {
            throw new Error("Season not found");
        }

        // Create comment
        const commentId = await ctx.db.insert("seasonComments", {
            seasonId: args.seasonId,
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
    args: { commentId: v.id("seasonComments") },
    handler: async (ctx, args) => {
        // Verify comment exists
        const comment = await ctx.db.get(args.commentId);
        if (!comment) {
            throw new Error("Comment not found");
        }

        await ctx.db.delete(args.commentId);
    },
});
