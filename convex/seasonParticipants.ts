import { adminQuery, adminMutation } from "./authAdmin";
import { userQuery, userMutation } from "./authUser";
import { internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { seasonParticipantStatusValidator, seasonStatusValidator, regionValidator, genderValidator } from "./validators";
import { calculateWeekInSeason } from "./utils";

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
      seasonStartDate: v.number(),
      seasonEndDate: v.number(),
      seasonStatus: seasonStatusValidator,
      weekInSeason: v.union(v.number(), v.null()),
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

    // Check active season first, then fall back to draft seasons
    let season = null;
    let enrollment = null;

    // 1. Try active season
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (activeSeason) {
      const activeEnrollment = await ctx.db
        .query("seasonParticipants")
        .withIndex("by_seasonId_and_participantId", (q) =>
          q.eq("seasonId", activeSeason._id).eq("participantId", participant._id)
        )
        .first();
      if (activeEnrollment) {
        season = activeSeason;
        enrollment = activeEnrollment;
      }
    }

    // 2. If not enrolled in active season, check draft seasons
    if (!enrollment) {
      const draftSeasons = await ctx.db
        .query("seasons")
        .withIndex("by_status", (q) => q.eq("status", "Draft"))
        .collect();

      for (const draft of draftSeasons) {
        const draftEnrollment = await ctx.db
          .query("seasonParticipants")
          .withIndex("by_seasonId_and_participantId", (q) =>
            q.eq("seasonId", draft._id).eq("participantId", participant._id)
          )
          .first();
        if (draftEnrollment) {
          season = draft;
          enrollment = draftEnrollment;
          break;
        }
      }
    }

    if (!season || !enrollment) return null;

    return {
      _id: enrollment._id,
      seasonId: enrollment.seasonId,
      seasonName: season.name,
      seasonStartDate: season.startDate,
      seasonEndDate: season.endDate,
      seasonStatus: season.status,
      weekInSeason: calculateWeekInSeason(season.startDate, Date.now()),
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
    };
  },
});

/**
 * Self-enroll the authenticated user in a season (free for now).
 */
export const selfEnroll = userMutation({
  args: {
    seasonId: v.id("seasons"),
  },
  returns: v.id("seasonParticipants"),
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
      .unique();

    if (!participant) {
      throw new ConvexError("Participant not found");
    }

    const season = await ctx.db.get(args.seasonId);
    if (!season) {
      throw new ConvexError("Season not found");
    }
    if (season.status !== "Draft" && season.status !== "Active") {
      throw new ConvexError("Season is not open for enrollment");
    }

    const existing = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_participantId", (q) =>
        q.eq("seasonId", args.seasonId).eq("participantId", participant._id)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const enrollmentId = await ctx.db.insert("seasonParticipants", {
      seasonId: args.seasonId,
      participantId: participant._id,
      enrolledAt: Date.now(),
      status: "Enrolled",
    });

    // Activate participant if they are Lead or Inactive
    if (participant.status !== "Active") {
      await ctx.db.patch(participant._id, { status: "Active" });
    }

    return enrollmentId;
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
      participantRegion: v.optional(regionValidator),
      participantGender: v.optional(genderValidator),
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
          _id: enrollment._id,
          participantId: enrollment.participantId,
          participantName: participant?.name || "Unknown",
          participantEmail: participant?.email,
          participantRegion: participant?.region,
          participantGender: participant?.gender,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
        };
      })
    );

    return enriched;
  },
});

/**
 * List all season enrollments for a participant (history)
 */
export const listForParticipant = adminQuery({
  args: {
    participantId: v.id("participants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("seasonParticipants"),
      seasonId: v.id("seasons"),
      seasonName: v.string(),
      seasonStatus: seasonStatusValidator,
      status: seasonParticipantStatusValidator,
      enrolledAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_participantId", (q) => q.eq("participantId", args.participantId))
      .collect();

    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const season = await ctx.db.get(enrollment.seasonId);
        return {
          _id: enrollment._id,
          seasonId: enrollment.seasonId,
          seasonName: season?.name || "Unknown",
          seasonStatus: (season?.status || "Completed") as "Draft" | "Active" | "Completed",
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
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
      .withIndex("by_seasonId_and_participantId", (q) =>
        q.eq("seasonId", args.seasonId).eq("participantId", args.participantId)
      )
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

    // Activate participant if they are not already Active
    const participant = await ctx.db.get(args.participantId);
    if (participant && participant.status !== "Active") {
      await ctx.db.patch(args.participantId, { status: "Active" });
    }

    return enrollmentId;
  },
});

/**
 * List all enrollments for active and draft seasons (for participants table)
 */
export const listEnrollmentsForOpenSeasons = adminQuery({
  args: {},
  returns: v.array(
    v.object({
      participantId: v.id("participants"),
      seasonId: v.id("seasons"),
      seasonName: v.string(),
      seasonStatus: seasonStatusValidator,
    })
  ),
  handler: async (ctx) => {
    const activeSeasons = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();
    const draftSeasons = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Draft"))
      .collect();
    const openSeasons = [...activeSeasons, ...draftSeasons];

    const result = [];
    for (const season of openSeasons) {
      const enrollments = await ctx.db
        .query("seasonParticipants")
        .withIndex("by_seasonId_and_status", (q) =>
          q.eq("seasonId", season._id).eq("status", "Enrolled")
        )
        .collect();

      for (const e of enrollments) {
        result.push({
          participantId: e.participantId,
          seasonId: season._id,
          seasonName: season.name,
          seasonStatus: season.status,
        });
      }
    }

    return result;
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

/**
 * Get enrolled participants who are not in any active group (for admin dashboard)
 */
export const getUnmatchedForSeason = adminQuery({
  args: { seasonId: v.id("seasons") },
  returns: v.array(
    v.object({
      participantId: v.id("participants"),
      participantName: v.string(),
      participantRegion: v.optional(regionValidator),
      participantGender: v.optional(genderValidator),
      onPause: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // 1. Get enrolled participants for this season
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_status", (q) =>
        q.eq("seasonId", args.seasonId).eq("status", "Enrolled")
      )
      .collect();

    // 2. Get participants in active groups
    const activeGroups = await ctx.db
      .query("groups")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .collect();

    const busyIds = new Set<string>();
    for (const g of activeGroups) {
      if (g.participant1) busyIds.add(g.participant1);
      if (g.participant2) busyIds.add(g.participant2);
      if (g.participant3) busyIds.add(g.participant3);
      if (g.participant4) busyIds.add(g.participant4);
    }

    // 3. Filter enrolled who are Active, and not in any active group
    const result = [];
    for (const enrollment of enrollments) {
      if (busyIds.has(enrollment.participantId)) continue;

      const participant = await ctx.db.get(enrollment.participantId);
      if (!participant || participant.status !== "Active") continue;

      result.push({
        participantId: enrollment.participantId,
        participantName: participant.name,
        participantRegion: participant.region,
        participantGender: participant.gender,
        onPause: participant.onPause ?? false,
      });
    }

    return result;
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
