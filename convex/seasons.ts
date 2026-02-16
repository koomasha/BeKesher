import { adminQuery, adminMutation } from "./authAdmin";
import { internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { seasonStatusValidator } from "./validators";

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * List all seasons (admin only)
 */
export const list = adminQuery({
  args: {
    status: v.optional(seasonStatusValidator),
  },
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
      enrolledCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let seasons;

    if (args.status !== undefined) {
      const status = args.status;
      seasons = await ctx.db
        .query("seasons")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else {
      seasons = await ctx.db.query("seasons").order("desc").collect();
    }

    // Enrich with enrollment count
    const enriched = await Promise.all(
      seasons.map(async (season) => {
        const enrolled = await ctx.db
          .query("seasonParticipants")
          .withIndex("by_seasonId_and_status", (q) =>
            q.eq("seasonId", season._id).eq("status", "Enrolled")
          )
          .collect();

        return {
          _id: season._id,
          name: season.name,
          description: season.description,
          startDate: season.startDate,
          endDate: season.endDate,
          status: season.status,
          createdAt: season.createdAt,
          createdByEmail: season.createdByEmail,
          enrolledCount: enrolled.length,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single season by ID
 */
export const get = adminQuery({
  args: { seasonId: v.id("seasons") },
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season) return null;

    return {
      _id: season._id,
      name: season.name,
      description: season.description,
      startDate: season.startDate,
      endDate: season.endDate,
      status: season.status,
      createdAt: season.createdAt,
      createdByEmail: season.createdByEmail,
    };
  },
});

/**
 * Get currently active season
 */
export const getActive = adminQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      description: v.optional(v.string()),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
      createdAt: v.number(),
      createdByEmail: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (!activeSeason) return null;

    return {
      _id: activeSeason._id,
      name: activeSeason.name,
      description: activeSeason.description,
      startDate: activeSeason.startDate,
      endDate: activeSeason.endDate,
      status: activeSeason.status,
      createdAt: activeSeason.createdAt,
      createdByEmail: activeSeason.createdByEmail,
    };
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

/**
 * Create a new season
 */
export const create = adminMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
  },
  returns: v.id("seasons"),
  handler: async (ctx, args) => {
    // Calculate endDate: 4 weeks after startDate
    const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
    const endDate = args.startDate + fourWeeks;

    const seasonId = await ctx.db.insert("seasons", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: endDate,
      status: "Draft",
      createdAt: Date.now(),
      createdByEmail: ctx.adminEmail,
    });

    console.log("✅ Season created:", args.name);
    return seasonId;
  },
});

/**
 * Update season details
 */
export const update = adminMutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { seasonId, ...updates } = args;

    const season = await ctx.db.get(seasonId);
    if (!season) {
      throw new ConvexError("Season not found");
    }

    if (season.status !== "Draft") {
      throw new ConvexError("Can only edit seasons in Draft status");
    }

    // If startDate is updated, recalculate endDate
    if (updates.startDate) {
      const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
      const endDate = updates.startDate + fourWeeks;
      await ctx.db.patch(seasonId, { ...updates, endDate });
    } else {
      await ctx.db.patch(seasonId, updates);
    }

    return null;
  },
});

/**
 * Activate a season (only one can be active at a time)
 */
export const activate = adminMutation({
  args: { seasonId: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if there's already an active season
    const existingActive = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();

    if (existingActive) {
      throw new ConvexError("Another season is already active. Please complete it first.");
    }

    // Activate the season
    await ctx.db.patch(args.seasonId, { status: "Active" });
    console.log("✅ Season activated");

    return null;
  },
});

/**
 * Complete a season
 */
export const complete = adminMutation({
  args: { seasonId: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.seasonId, { status: "Completed" });

    // Update all enrolled participants to "Completed"
    const enrollments = await ctx.db
      .query("seasonParticipants")
      .withIndex("by_seasonId_and_status", (q) =>
        q.eq("seasonId", args.seasonId).eq("status", "Enrolled")
      )
      .collect();

    for (const enrollment of enrollments) {
      await ctx.db.patch(enrollment._id, { status: "Completed" });
    }

    console.log("✅ Season completed");
    return null;
  },
});

// ============================================
// INTERNAL QUERIES
// ============================================

/**
 * Get active season (internal use by matching)
 */
export const getActiveInternal = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("seasons"),
      name: v.string(),
      startDate: v.number(),
      endDate: v.number(),
      status: seasonStatusValidator,
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const season = await ctx.db
      .query("seasons")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .first();
    if (!season) return null;
    return {
      _id: season._id,
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      status: season.status,
    };
  },
});

