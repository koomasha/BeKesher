import {
    query,
    mutation,
    internalQuery,
    internalMutation,
} from "./_generated/server";
import { v } from "convex/values";

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get a participant by their Telegram ID
 */
export const getByTelegramId = query({
    args: { telegramId: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("participants"),
            _creationTime: v.number(),
            name: v.string(),
            phone: v.string(),
            telegramId: v.string(),
            tgFirstName: v.optional(v.string()),
            tgLastName: v.optional(v.string()),
            photo: v.optional(v.string()),
            age: v.number(),
            gender: v.string(),
            region: v.string(),
            city: v.optional(v.string()),
            familyStatus: v.optional(v.string()),
            targetGender: v.optional(v.string()),
            targetAgeFrom: v.optional(v.number()),
            targetAgeTo: v.optional(v.number()),
            formatPreference: v.optional(v.string()),
            aboutMe: v.optional(v.string()),
            profession: v.optional(v.string()),
            whoToMeet: v.optional(v.string()),
            values: v.optional(v.array(v.string())),
            interests: v.optional(v.array(v.string())),
            status: v.string(),
            onPause: v.boolean(),
            totalPoints: v.number(),
            registrationDate: v.number(),
            paidUntil: v.optional(v.number()),
            paymentDate: v.optional(v.number()),
            inChannel: v.boolean(),
            periodsPaid: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();
        return participant;
    },
});

/**
 * Get participant profile for display (public-facing)
 */
export const getMyProfile = query({
    args: { telegramId: v.string() },
    returns: v.union(
        v.object({
            name: v.string(),
            age: v.number(),
            gender: v.string(),
            region: v.string(),
            city: v.optional(v.string()),
            aboutMe: v.optional(v.string()),
            profession: v.optional(v.string()),
            status: v.string(),
            onPause: v.boolean(),
            totalPoints: v.number(),
            paidUntil: v.optional(v.number()),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) return null;

        return {
            name: participant.name,
            age: participant.age,
            gender: participant.gender,
            region: participant.region,
            city: participant.city,
            aboutMe: participant.aboutMe,
            profession: participant.profession,
            status: participant.status,
            onPause: participant.onPause,
            totalPoints: participant.totalPoints,
            paidUntil: participant.paidUntil,
        };
    },
});

/**
 * List all participants (for admin)
 */
export const list = query({
    args: {
        status: v.optional(v.string()),
        region: v.optional(v.string()),
    },
    returns: v.array(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            telegramId: v.string(),
            age: v.number(),
            gender: v.string(),
            region: v.string(),
            status: v.string(),
            onPause: v.boolean(),
            paidUntil: v.optional(v.number()),
        })
    ),
    handler: async (ctx, args) => {
        let query;

        if (args.status && args.region) {
            query = ctx.db
                .query("participants")
                .withIndex("by_status_and_region", (q) =>
                    q.eq("status", args.status!).eq("region", args.region!)
                );
        } else if (args.status) {
            query = ctx.db
                .query("participants")
                .withIndex("by_status", (q) => q.eq("status", args.status!));
        } else {
            query = ctx.db.query("participants");
        }

        const participants = await query.collect();

        return participants.map((p) => ({
            _id: p._id,
            name: p.name,
            telegramId: p.telegramId,
            age: p.age,
            gender: p.gender,
            region: p.region,
            status: p.status,
            onPause: p.onPause,
            paidUntil: p.paidUntil,
        }));
    },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Register a new participant
 */
export const register = mutation({
    args: {
        name: v.string(),
        phone: v.string(),
        telegramId: v.string(),
        tgFirstName: v.optional(v.string()),
        tgLastName: v.optional(v.string()),
        photo: v.optional(v.string()),
        age: v.number(),
        gender: v.string(),
        region: v.string(),
        city: v.optional(v.string()),
        familyStatus: v.optional(v.string()),
        targetGender: v.optional(v.string()),
        targetAgeFrom: v.optional(v.number()),
        targetAgeTo: v.optional(v.number()),
        formatPreference: v.optional(v.string()),
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        whoToMeet: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        interests: v.optional(v.array(v.string())),
    },
    returns: v.id("participants"),
    handler: async (ctx, args) => {
        // Check if participant already exists
        const existing = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (existing) {
            throw new Error("Participant with this Telegram ID already exists");
        }

        const participantId = await ctx.db.insert("participants", {
            ...args,
            status: "Lead", // New participants start as Lead
            onPause: false,
            totalPoints: 0,
            registrationDate: Date.now(),
            inChannel: false,
            periodsPaid: 0,
        });

        return participantId;
    },
});

/**
 * Update participant profile
 */
export const updateProfile = mutation({
    args: {
        telegramId: v.string(),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        region: v.optional(v.string()),
        city: v.optional(v.string()),
        familyStatus: v.optional(v.string()),
        targetGender: v.optional(v.string()),
        targetAgeFrom: v.optional(v.number()),
        targetAgeTo: v.optional(v.number()),
        formatPreference: v.optional(v.string()),
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        whoToMeet: v.optional(v.string()),
        values: v.optional(v.array(v.string())),
        interests: v.optional(v.array(v.string())),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        const { telegramId, ...updates } = args;

        // Remove undefined values
        const cleanUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                cleanUpdates[key] = value;
            }
        }

        if (Object.keys(cleanUpdates).length > 0) {
            await ctx.db.patch(participant._id, cleanUpdates);
        }

        return null;
    },
});

/**
 * Toggle pause status
 */
export const togglePause = mutation({
    args: { telegramId: v.string() },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        const newPauseStatus = !participant.onPause;
        await ctx.db.patch(participant._id, { onPause: newPauseStatus });

        return newPauseStatus;
    },
});

/**
 * Deactivate participant (unsubscribe)
 */
export const deactivate = mutation({
    args: { telegramId: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        await ctx.db.patch(participant._id, {
            status: "Inactive",
            onPause: false,
        });

        return null;
    },
});

/**
 * Delete a participant completely (for testing/cleanup)
 */
export const deleteParticipant = mutation({
    args: { telegramId: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) {
            console.log(`Participant with telegramId ${args.telegramId} not found`);
            return null;
        }

        await ctx.db.delete(participant._id);
        console.log(`Deleted participant: ${participant.name} (${args.telegramId})`);

        return null;
    },
});

// ============================================
// INTERNAL QUERIES (for matching algorithm)
// ============================================

/**
 * Get all active participants for matching
 */
export const getActiveForMatching = internalQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            telegramId: v.string(),
            age: v.number(),
            gender: v.string(),
            region: v.string(),
            targetGender: v.optional(v.string()),
            targetAgeFrom: v.optional(v.number()),
            targetAgeTo: v.optional(v.number()),
        })
    ),
    handler: async (ctx) => {
        // Get participants with status "Active" or "Lead" and not on pause
        const activeParticipants = await ctx.db
            .query("participants")
            .withIndex("by_status_and_onPause", (q) =>
                q.eq("status", "Active").eq("onPause", false)
            )
            .collect();

        const leadParticipants = await ctx.db
            .query("participants")
            .withIndex("by_status_and_onPause", (q) =>
                q.eq("status", "Lead").eq("onPause", false)
            )
            .collect();

        const allActive = [...activeParticipants, ...leadParticipants];

        return allActive.map((p) => ({
            _id: p._id,
            name: p.name,
            telegramId: p.telegramId,
            age: p.age,
            gender: p.gender,
            region: p.region,
            targetGender: p.targetGender,
            targetAgeFrom: p.targetAgeFrom,
            targetAgeTo: p.targetAgeTo,
        }));
    },
});

// ============================================
// INTERNAL MUTATIONS (for system operations)
// ============================================

/**
 * Update participant status (used by payment processing)
 */
export const updateStatus = internalMutation({
    args: {
        participantId: v.id("participants"),
        status: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.participantId, { status: args.status });
        return null;
    },
});

/**
 * Update payment info
 */
export const updatePaymentInfo = internalMutation({
    args: {
        participantId: v.id("participants"),
        paidUntil: v.number(),
        paymentDate: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db.get(args.participantId);
        if (!participant) {
            throw new Error("Participant not found");
        }

        await ctx.db.patch(args.participantId, {
            paidUntil: args.paidUntil,
            paymentDate: args.paymentDate,
            periodsPaid: participant.periodsPaid + 1,
            status: "Active", // Activate participant after payment
        });

        return null;
    },
});

/**
 * Add points to participant
 */
export const addPoints = internalMutation({
    args: {
        participantId: v.id("participants"),
        points: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db.get(args.participantId);
        if (!participant) {
            throw new Error("Participant not found");
        }

        await ctx.db.patch(args.participantId, {
            totalPoints: participant.totalPoints + args.points,
        });

        return null;
    },
});
