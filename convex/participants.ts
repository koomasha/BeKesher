import {
    internalQuery,
    internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { userQuery, userMutation, publicMutation } from "./authUser";
import { adminQuery, adminMutation } from "./authAdmin";
import { internal } from "./_generated/api";
import {
    participantStatusValidator,
    genderValidator,
    regionValidator,
} from "./validators";

/**
 * Fields that should be logged in participantChangeLogs when changed
 */
const TRACKED_FIELDS = [
    "name",
    "phone",
    "email",
    "birthDate",
    "gender",
    "region",
    "city",
    "aboutMe",
    "profession",
    "purpose",
    "expectations",
    "socialMediaConsent",
] as const;

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get a participant by their Telegram ID (resolved from auth)
 */
export const getByTelegramId = userQuery({
    args: {},
    returns: v.union(
        v.object({
            _id: v.id("participants"),
            _creationTime: v.number(),
            name: v.string(),
            phone: v.string(),
            telegramId: v.string(),
            tgFirstName: v.optional(v.string()),
            tgLastName: v.optional(v.string()),
            tgUsername: v.optional(v.string()),
            photo: v.optional(v.string()),
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
            city: v.optional(v.string()),
            aboutMe: v.optional(v.string()),
            profession: v.optional(v.string()),
            purpose: v.optional(v.string()),
            expectations: v.optional(v.string()),
            email: v.optional(v.string()),
            socialMediaConsent: v.boolean(),
            status: participantStatusValidator,
            onPause: v.boolean(),
            totalPoints: v.number(),
            registrationDate: v.number(),
            paidUntil: v.optional(v.number()),
            paymentDate: v.optional(v.number()),
            periodsPaid: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx) => {
        const p = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();
        if (!p) return null;
        return {
            _id: p._id,
            _creationTime: p._creationTime,
            name: p.name,
            phone: p.phone,
            telegramId: p.telegramId,
            tgFirstName: p.tgFirstName,
            tgLastName: p.tgLastName,
            tgUsername: p.tgUsername,
            photo: p.photo,
            birthDate: p.birthDate,
            gender: p.gender,
            region: p.region,
            city: p.city,
            aboutMe: p.aboutMe,
            profession: p.profession,
            purpose: p.purpose,
            expectations: p.expectations,
            email: p.email,
            socialMediaConsent: p.socialMediaConsent,
            status: p.status,
            onPause: p.onPause,
            totalPoints: p.totalPoints,
            registrationDate: p.registrationDate,
            paidUntil: p.paidUntil,
            paymentDate: p.paymentDate,
            periodsPaid: p.periodsPaid,
        };
    },
});

/**
 * Get participant profile for display (public-facing)
 */
export const getMyProfile = userQuery({
    args: {},
    returns: v.union(
        v.object({
            name: v.string(),
            phone: v.string(),
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
            city: v.optional(v.string()),
            aboutMe: v.optional(v.string()),
            profession: v.optional(v.string()),
            purpose: v.optional(v.string()),
            expectations: v.optional(v.string()),
            email: v.optional(v.string()),
            socialMediaConsent: v.boolean(),
            status: participantStatusValidator,
            onPause: v.boolean(),
            totalPoints: v.number(),
            paidUntil: v.optional(v.number()),
            telegramId: v.string(),
        }),
        v.null()
    ),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) return null;

        return {
            name: participant.name,
            phone: participant.phone,
            birthDate: participant.birthDate,
            gender: participant.gender,
            region: participant.region,
            city: participant.city,
            aboutMe: participant.aboutMe,
            profession: participant.profession,
            purpose: participant.purpose,
            expectations: participant.expectations,
            email: participant.email,
            socialMediaConsent: participant.socialMediaConsent,
            status: participant.status,
            onPause: participant.onPause,
            totalPoints: participant.totalPoints,
            paidUntil: participant.paidUntil,
            telegramId: participant.telegramId,
        };
    },
});

/**
 * List all participants (for admin)
 */
export const list = adminQuery({
    args: {
        status: v.optional(participantStatusValidator),
        region: v.optional(regionValidator),
    },
    returns: v.array(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            telegramId: v.string(),
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
            status: participantStatusValidator,
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

        // Apply region filter in memory if only region is specified (no index for region-only)
        let participants = await query.collect();

        if (args.region && !args.status) {
            participants = participants.filter((p) => p.region === args.region);
        }

        return participants.map((p) => ({
            _id: p._id,
            name: p.name,
            telegramId: p.telegramId,
            birthDate: p.birthDate,
            gender: p.gender,
            region: p.region,
            status: p.status,
            onPause: p.onPause,
            paidUntil: p.paidUntil,
        }));
    },
});

/**
 * Get full participant details by ID (admin only)
 */
export const getById = adminQuery({
    args: {
        participantId: v.id("participants"),
    },
    returns: v.union(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            phone: v.string(),
            telegramId: v.string(),
            tgFirstName: v.optional(v.string()),
            tgLastName: v.optional(v.string()),
            tgUsername: v.optional(v.string()),
            email: v.optional(v.string()),
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
            city: v.optional(v.string()),
            aboutMe: v.optional(v.string()),
            profession: v.optional(v.string()),
            status: participantStatusValidator,
            onPause: v.boolean(),
            paidUntil: v.optional(v.number()),
            totalPoints: v.number(),
            registrationDate: v.optional(v.number()),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const p = await ctx.db.get(args.participantId);
        if (!p) return null;
        return {
            _id: p._id,
            name: p.name,
            phone: p.phone,
            telegramId: p.telegramId,
            tgFirstName: p.tgFirstName,
            tgLastName: p.tgLastName,
            tgUsername: p.tgUsername,
            email: p.email,
            birthDate: p.birthDate,
            gender: p.gender,
            region: p.region,
            city: p.city,
            aboutMe: p.aboutMe,
            profession: p.profession,
            status: p.status,
            onPause: p.onPause,
            paidUntil: p.paidUntil,
            totalPoints: p.totalPoints,
            registrationDate: p.registrationDate,
        };
    },
});

/**
 * Admin update participant fields
 */
export const adminUpdate = adminMutation({
    args: {
        participantId: v.id("participants"),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        region: v.optional(regionValidator),
        city: v.optional(v.string()),
        gender: v.optional(genderValidator),
        status: v.optional(participantStatusValidator),
        onPause: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const { participantId, ...updates } = args;
        const participant = await ctx.db.get(participantId);
        if (!participant) throw new Error("Participant not found");

        // Build patch object with only provided fields
        const patch: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                patch[key] = value;
            }
        }

        if (Object.keys(patch).length > 0) {
            await ctx.db.patch(participantId, patch);
        }
        return null;
    },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Create a minimal Lead participant when user first opens the bot.
 * This captures Telegram data for follow-up even if they don't complete registration.
 * Public because user isn't authenticated yet.
 */
export const createLeadParticipant = publicMutation({
    args: {
        telegramId: v.string(),
        tgFirstName: v.optional(v.string()),
        tgLastName: v.optional(v.string()),
        tgUsername: v.optional(v.string()),
        photo: v.optional(v.string()),
    },
    returns: v.union(v.id("participants"), v.null()),
    handler: async (ctx, args) => {
        // Check if participant already exists
        const existing = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (existing) {
            return null; // Already exists, no need to create
        }

        // Create minimal participant with placeholder values for required fields
        const participantId = await ctx.db.insert("participants", {
            telegramId: args.telegramId,
            tgFirstName: args.tgFirstName,
            tgLastName: args.tgLastName,
            tgUsername: args.tgUsername,
            photo: args.photo,
            // Placeholder values for required fields
            name: args.tgFirstName || "Пользователь",
            phone: "",
            birthDate: "2000-01-01",
            gender: "Male",
            region: "Center",
            status: "Lead",
            onPause: false,
            totalPoints: 0,
            registrationDate: Date.now(),
            periodsPaid: 0,
            socialMediaConsent: true,
        });

        return participantId;
    },
});

/**
 * Register a new participant
 * Public because user isn't authenticated yet during registration.
 * Still accepts telegramId as an explicit arg.
 */
export const register = publicMutation({
    args: {
        name: v.string(),
        phone: v.string(),
        telegramId: v.string(),
        tgFirstName: v.optional(v.string()),
        tgLastName: v.optional(v.string()),
        tgUsername: v.optional(v.string()),
        photo: v.optional(v.string()),
        birthDate: v.string(),
        gender: genderValidator,
        region: regionValidator,
        city: v.optional(v.string()),
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        purpose: v.optional(v.string()),
        expectations: v.optional(v.string()),
        email: v.optional(v.string()),
        socialMediaConsent: v.optional(v.boolean()),
    },
    returns: v.id("participants"),
    handler: async (ctx, args) => {
        // Check if participant already exists
        const existing = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (existing) {
            // Update existing Lead participant instead of throwing error
            await ctx.db.patch(existing._id, {
                name: args.name,
                phone: args.phone,
                tgFirstName: args.tgFirstName,
                tgLastName: args.tgLastName,
                tgUsername: args.tgUsername,
                photo: args.photo,
                birthDate: args.birthDate,
                gender: args.gender,
                region: args.region,
                city: args.city,
                aboutMe: args.aboutMe,
                profession: args.profession,
                purpose: args.purpose,
                expectations: args.expectations,
                email: args.email,
                socialMediaConsent: args.socialMediaConsent ?? true,
            });
            return existing._id;
        }

        const participantId = await ctx.db.insert("participants", {
            ...args,
            email: args.email,
            socialMediaConsent: args.socialMediaConsent ?? true,
            status: "Lead", // New participants start as Lead
            onPause: false,
            totalPoints: 0,
            registrationDate: Date.now(),
            periodsPaid: 0,
        });

        return participantId;
    },
});

/**
 * Update participant profile
 */
export const updateProfile = userMutation({
    args: {
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        birthDate: v.optional(v.string()),
        gender: v.optional(genderValidator),
        region: v.optional(regionValidator),
        city: v.optional(v.string()),
        aboutMe: v.optional(v.string()),
        profession: v.optional(v.string()),
        purpose: v.optional(v.string()),
        expectations: v.optional(v.string()),
        email: v.optional(v.string()),
        socialMediaConsent: v.optional(v.boolean()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            throw new Error("Participant not found");
        }

        // Log changes to tracked fields
        for (const field of TRACKED_FIELDS) {
            if (args[field as keyof typeof args] !== undefined) {
                const oldValue = participant[field as keyof typeof participant];
                const newValue = args[field as keyof typeof args];

                // Convert values to strings for storage, handle null/undefined
                const oldValueStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : null;
                const newValueStr = newValue !== undefined && newValue !== null ? String(newValue) : null;

                // Only log if value actually changed
                if (oldValueStr !== newValueStr) {
                    await ctx.runMutation(internal.participants.logParticipantChange, {
                        participantId: participant._id,
                        field: field,
                        oldValue: oldValueStr,
                        newValue: newValueStr,
                    });
                }
            }
        }

        const updates = args;

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
export const togglePause = userMutation({
    args: {},
    returns: v.boolean(),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
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
export const deactivate = userMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
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
export const deleteParticipant = userMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            return null;
        }

        await ctx.db.delete(participant._id);

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
            birthDate: v.string(),
            gender: genderValidator,
            region: regionValidator,
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
            birthDate: p.birthDate,
            gender: p.gender,
            region: p.region,
        }));
    },
});

// ============================================
// INTERNAL MUTATIONS (for system operations)
// ============================================

/**
 * Get participant by ID (internal)
 */
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
        const p = await ctx.db.get(args.participantId);
        if (!p) return null;
        return {
            _id: p._id,
            name: p.name,
            telegramId: p.telegramId,
            birthDate: p.birthDate,
            gender: p.gender,
            region: p.region,
            status: p.status,
            onPause: p.onPause,
        };
    },
});

/**
 * Update participant status (used by payment processing)
 */
export const updateStatus = internalMutation({
    args: {
        participantId: v.id("participants"),
        status: participantStatusValidator,
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
 * Toggle pause status (used by telegram webhook)
 */
export const togglePauseInternal = internalMutation({
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

/**
 * Log a participant profile field change
 * Internal mutation called by updateProfile to create audit trail
 */
export const logParticipantChange = internalMutation({
    args: {
        participantId: v.id("participants"),
        field: v.string(),
        oldValue: v.union(v.string(), v.null()),
        newValue: v.union(v.string(), v.null()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.insert("participantChangeLogs", {
            participantId: args.participantId,
            field: args.field,
            oldValue: args.oldValue,
            newValue: args.newValue,
            changedAt: Date.now(),
        });
        return null;
    },
});

/**
 * One-time migration: Add socialMediaConsent field to existing participants
 * Run this once after deploying the schema change
 */
export const migrateSocialMediaConsent = internalMutation({
    args: {},
    returns: v.object({
        updated: v.number(),
        skipped: v.number(),
    }),
    handler: async (ctx) => {
        const allParticipants = await ctx.db.query("participants").collect();

        let updated = 0;
        let skipped = 0;

        for (const participant of allParticipants) {
            if (participant.socialMediaConsent === undefined) {
                await ctx.db.patch(participant._id, {
                    socialMediaConsent: true, // Default to true (opt-in)
                });
                updated++;
            } else {
                skipped++;
            }
        }

        console.log(`Migration complete: ${updated} participants updated, ${skipped} already had the field`);

        return { updated, skipped };
    },
});
