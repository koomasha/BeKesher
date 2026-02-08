import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Temporary mutation for setting up test data
 * Creates a completed group for the test participant
 */
export const createTestGroup = mutation({
    args: {
        testParticipantId: v.id("participants"),
    },
    returns: v.id("groups"),
    handler: async (ctx, args) => {
        // Get other participants for the test group
        const otherParticipants = await ctx.db
            .query("participants")
            .filter((q) => q.neq(q.field("_id"), args.testParticipantId))
            .take(3);

        if (otherParticipants.length < 3) {
            throw new Error("Not enough participants to create a test group");
        }

        // Create a completed group from 1 week ago
        const groupId = await ctx.db.insert("groups", {
            createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
            status: "Completed",
            region: "Center",
            participant1: args.testParticipantId,
            participant2: otherParticipants[0]._id,
            participant3: otherParticipants[1]._id,
            participant4: otherParticipants[2]._id,
        });

        return groupId;
    },
});

/**
 * Delete all feedback for a participant (for testing)
 */
export const deleteFeedbackForParticipant = mutation({
    args: {
        telegramId: v.string(),
    },
    returns: v.object({
        deletedCount: v.number(),
    }),
    handler: async (ctx, args) => {
        // Find participant
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        // Find all feedback for this participant
        const feedbackList = await ctx.db
            .query("feedback")
            .withIndex("by_participantId", (q) => q.eq("participantId", participant._id))
            .collect();

        // Delete all feedback
        for (const feedback of feedbackList) {
            await ctx.db.delete(feedback._id);
        }

        return { deletedCount: feedbackList.length };
    },
});
