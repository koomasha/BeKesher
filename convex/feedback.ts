import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get feedback submissions for a participant
 */
export const getForParticipant = query({
    args: { telegramId: v.string() },
    returns: v.array(
        v.object({
            _id: v.id("feedback"),
            groupId: v.id("groups"),
            rating: v.number(),
            textFeedback: v.optional(v.string()),
            wouldMeetAgain: v.optional(v.boolean()),
            submittedAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            return [];
        }

        const feedback = await ctx.db
            .query("feedback")
            .withIndex("by_participantId", (q) =>
                q.eq("participantId", participant._id)
            )
            .order("desc")
            .collect();

        return feedback.map((f) => ({
            _id: f._id,
            groupId: f.groupId,
            rating: f.rating,
            textFeedback: f.textFeedback,
            wouldMeetAgain: f.wouldMeetAgain,
            submittedAt: f.submittedAt,
        }));
    },
});

/**
 * Check if participant has pending feedback to submit
 */
export const getPendingFeedback = query({
    args: { telegramId: v.string() },
    returns: v.array(
        v.object({
            groupId: v.id("groups"),
            groupCreatedAt: v.number(),
            members: v.array(v.string()),
        })
    ),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            return [];
        }

        // Get completed groups this participant was in
        const completedGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Completed"))
            .collect();

        const participantGroups = completedGroups.filter((g) => {
            return (
                g.participant1 === participant._id ||
                g.participant2 === participant._id ||
                g.participant3 === participant._id ||
                g.participant4 === participant._id
            );
        });

        // Get existing feedback from this participant
        const existingFeedback = await ctx.db
            .query("feedback")
            .withIndex("by_participantId", (q) =>
                q.eq("participantId", participant._id)
            )
            .collect();

        const feedbackGroupIds = new Set(existingFeedback.map((f) => f.groupId));

        // Filter to groups without feedback
        const pendingGroups = participantGroups.filter(
            (g) => !feedbackGroupIds.has(g._id)
        );

        // Enrich with member names
        const result = await Promise.all(
            pendingGroups.map(async (g) => {
                const memberIds = [
                    g.participant1,
                    g.participant2,
                    g.participant3,
                    g.participant4,
                ].filter((id) => id !== undefined && id !== participant._id);

                const memberNames = await Promise.all(
                    memberIds.map(async (id) => {
                        const member = await ctx.db.get(id!);
                        return member?.name || "Unknown";
                    })
                );

                return {
                    groupId: g._id,
                    groupCreatedAt: g.createdAt,
                    members: memberNames,
                };
            })
        );

        return result;
    },
});

/**
 * Get all feedback for a group (admin view)
 */
export const getForGroup = query({
    args: { groupId: v.id("groups") },
    returns: v.array(
        v.object({
            _id: v.id("feedback"),
            participantName: v.string(),
            rating: v.number(),
            textFeedback: v.optional(v.string()),
            wouldMeetAgain: v.optional(v.boolean()),
            submittedAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const feedback = await ctx.db
            .query("feedback")
            .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
            .collect();

        const enrichedFeedback = await Promise.all(
            feedback.map(async (f) => {
                const participant = await ctx.db.get(f.participantId);
                return {
                    _id: f._id,
                    participantName: participant?.name || "Unknown",
                    rating: f.rating,
                    textFeedback: f.textFeedback,
                    wouldMeetAgain: f.wouldMeetAgain,
                    submittedAt: f.submittedAt,
                };
            })
        );

        return enrichedFeedback;
    },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Submit feedback for a group meetup
 */
export const submitFeedback = mutation({
    args: {
        telegramId: v.string(),
        groupId: v.id("groups"),
        rating: v.number(),
        textFeedback: v.optional(v.string()),
        wouldMeetAgain: v.optional(v.boolean()),
        photos: v.optional(v.array(v.string())),
    },
    returns: v.id("feedback"),
    handler: async (ctx, args) => {
        // Get participant
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        // Verify participant was in this group
        const group = await ctx.db.get(args.groupId);
        if (!group) {
            throw new Error("Group not found");
        }

        const wasInGroup =
            group.participant1 === participant._id ||
            group.participant2 === participant._id ||
            group.participant3 === participant._id ||
            group.participant4 === participant._id;

        if (!wasInGroup) {
            throw new Error("You were not in this group");
        }

        // Check if feedback already submitted
        const existingFeedback = await ctx.db
            .query("feedback")
            .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
            .collect();

        const alreadySubmitted = existingFeedback.some(
            (f) => f.participantId === participant._id
        );

        if (alreadySubmitted) {
            throw new Error("Feedback already submitted for this group");
        }

        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }

        // Create feedback
        const feedbackId = await ctx.db.insert("feedback", {
            groupId: args.groupId,
            participantId: participant._id,
            rating: args.rating,
            textFeedback: args.textFeedback,
            wouldMeetAgain: args.wouldMeetAgain,
            photos: args.photos,
            submittedAt: Date.now(),
        });

        // Award points for submitting feedback
        const currentPoints = participant.totalPoints;
        await ctx.db.patch(participant._id, {
            totalPoints: currentPoints + 10, // 10 points for feedback
        });

        return feedbackId;
    },
});
