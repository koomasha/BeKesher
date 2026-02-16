import { adminQuery, adminMutation } from "./authAdmin";
import { userQuery, userMutation } from "./authUser";
import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { seasonParticipantStatusValidator } from "./validators";

// ============================================
// USER QUERIES
// ============================================

/**
 * Get participant's enrollment for active season
 */
export const getMyEnrollment = userQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasonParticipants"),
      seasonId: v.id("seasons"),
      seasonName: v.string(),
      status: seasonParticipantStatusValidator,
      enrolledAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
      .unique();

    if (!participant) return null;

    // Get active season
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (!activeSeason) return null;

    // Get enrollment
    const enrollment = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", activeSeason._id))
      .filter((q) => q.eq(q.field("participantId"), participant._id))
      .first();

    if (!enrollment) return null;

    return {
      _id: enrollment._id,
      seasonId: enrollment.seasonId,
      seasonName: activeSeason.name,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    };
  },
});

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List all enrollments for a season
 */
export const listForSeason = adminQuery({
  args: {
    seasonId: v.id("seasons"),
    status: v.optional(seasonParticipantStatusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("seasonParticipants"),
      participantId: v.id("participants"),
      participantName: v.string(),
      participantEmail: v.optional(v.string()),
      status: seasonParticipantStatusValidator,
      enrolledAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const enrollments = await query.collect();

    // Enrich with participant data
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const participant = await ctx.db.get(enrollment.participantId);
        return {
          ...enrollment,
          participantName: participant?.name || "Unknown",
          participantEmail: participant?.email,
        };
      })
    );

    return enriched;
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Enroll a participant in a season
 */
export const enroll = adminMutation({
  args: {
    seasonId: v.id("seasons"),
    participantId: v.id("participants"),
  },
  returns: v.id("seasonParticipants"),
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (existing) {
      throw new ConvexError("Participant already enrolled in this season");
    }

    const enrollmentId = await ctx.db.insert("seasonParticipants", {
      seasonId: args.seasonId,
      participantId: args.participantId,
      enrolledAt: Date.now(),
      status: "Enrolled",
    });

    return enrollmentId;
  },
});

/**
 * Update enrollment status
 */
export const updateStatus = adminMutation({
  args: {
    enrollmentId: v.id("seasonParticipants"),
    status: seasonParticipantStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, { status: args.status });
    return null;
  },
});

// ============================================
// INTERNAL QUERIES
// ============================================

/**
 * Get enrolled participants for active season (for matching)
 */
export const getEnrolledForMatching = internalQuery({
  args: { seasonId: v.id("seasons") },
  returns: v.array(v.id("participants")),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_status", (q) =>
        q.eq("seasonId", args.seasonId).eq("status", "Enrolled")
      )
      .collect();

    return enrollments.map((e) => e.participantId);
  },
});
