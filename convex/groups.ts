import {
    internalQuery,
    internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { userQuery } from "./authUser";
import { adminQuery, adminMutation } from "./authAdmin";
import { groupStatusValidator, regionValidator, weekInSeasonValidator } from "./validators";

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get groups for a participant
 */
export const getForParticipant = userQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("groups"),
            createdAt: v.number(),
            status: groupStatusValidator,
            region: v.optional(regionValidator),
            members: v.array(
                v.object({
                    _id: v.id("participants"),
                    name: v.string(),
                    telegramId: v.string(),
                })
            ),
        })
    ),
    handler: async (ctx) => {
        // First get the participant
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            return [];
        }

        // Query using all 4 participant indexes instead of full table scan
        const [asP1, asP2, asP3, asP4] = await Promise.all([
            ctx.db
                .query("groups")
                .withIndex("by_participant1", (q) => q.eq("participant1", participant._id))
                .collect(),
            ctx.db
                .query("groups")
                .withIndex("by_participant2", (q) => q.eq("participant2", participant._id))
                .collect(),
            ctx.db
                .query("groups")
                .withIndex("by_participant3", (q) => q.eq("participant3", participant._id))
                .collect(),
            ctx.db
                .query("groups")
                .withIndex("by_participant4", (q) => q.eq("participant4", participant._id))
                .collect(),
        ]);

        // Combine and deduplicate
        const groupMap = new Map<string, typeof asP1[0]>();
        for (const g of [...asP1, ...asP2, ...asP3, ...asP4]) {
            groupMap.set(g._id, g);
        }
        const participantGroups = Array.from(groupMap.values());

        // Enrich with member details
        const enrichedGroups = await Promise.all(
            participantGroups.map(async (group) => {
                const memberIds = [
                    group.participant1,
                    group.participant2,
                    group.participant3,
                    group.participant4,
                ].filter((id): id is Id<"participants"> => id !== undefined);

                const members = await Promise.all(
                    memberIds.map(async (id) => {
                        const member = await ctx.db.get(id);
                        if (!member) return null;
                        return {
                            _id: member._id,
                            name: member.name,
                            telegramId: member.telegramId,
                        };
                    })
                );

                return {
                    _id: group._id,
                    createdAt: group.createdAt,
                    status: group.status,
                    region: group.region,
                    members: members.filter(
                        (m): m is { _id: Id<"participants">; name: string; telegramId: string } =>
                            m !== null
                    ),
                };
            })
        );

        return enrichedGroups;
    },
});

/**
 * Get active group for a participant (if any)
 */
export const getActiveForParticipant = userQuery({
    args: {},
    returns: v.union(
        v.object({
            _id: v.id("groups"),
            createdAt: v.number(),
            region: v.optional(regionValidator),
            members: v.array(
                v.object({
                    _id: v.id("participants"),
                    name: v.string(),
                    telegramId: v.string(),
                    phone: v.string(),
                })
            ),
        }),
        v.null()
    ),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            return null;
        }

        // Get active groups
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        // Find group containing this participant
        const myGroup = activeGroups.find((g) => {
            return (
                g.participant1 === participant._id ||
                g.participant2 === participant._id ||
                g.participant3 === participant._id ||
                g.participant4 === participant._id
            );
        });

        if (!myGroup) {
            return null;
        }

        // Get member details
        const memberIds = [
            myGroup.participant1,
            myGroup.participant2,
            myGroup.participant3,
            myGroup.participant4,
        ].filter((id): id is Id<"participants"> => id !== undefined);

        const members = await Promise.all(
            memberIds.map(async (id) => {
                const member = await ctx.db.get(id);
                if (!member) return null;
                return {
                    _id: member._id,
                    name: member.name,
                    telegramId: member.telegramId,
                    phone: member.phone,
                };
            })
        );

        return {
            _id: myGroup._id,
            createdAt: myGroup.createdAt,
            region: myGroup.region,
            members: members.filter(
                (m): m is { _id: Id<"participants">; name: string; telegramId: string; phone: string } =>
                    m !== null
            ),
        };
    },
});

/**
 * List all groups (for admin)
 */
export const list = adminQuery({
    args: {
        status: v.optional(groupStatusValidator),
        seasonId: v.optional(v.id("seasons")),
    },
    returns: v.array(
        v.object({
            _id: v.id("groups"),
            createdAt: v.number(),
            status: groupStatusValidator,
            region: v.optional(regionValidator),
            memberCount: v.number(),
            seasonId: v.optional(v.id("seasons")),
            seasonName: v.optional(v.string()),
            weekInSeason: v.optional(weekInSeasonValidator),
        })
    ),
    handler: async (ctx, args) => {
        let groupQuery;

        if (args.seasonId) {
            groupQuery = ctx.db
                .query("groups")
                .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId!));
        } else if (args.status) {
            groupQuery = ctx.db
                .query("groups")
                .withIndex("by_status", (q) => q.eq("status", args.status!));
        } else {
            groupQuery = ctx.db.query("groups").order("desc");
        }

        let groups = await groupQuery.collect();

        // Apply status filter in memory when combined with seasonId
        if (args.seasonId && args.status) {
            groups = groups.filter((g) => g.status === args.status);
        }

        // Batch-fetch season names
        const seasonIds = [...new Set(
            groups.map((g) => g.seasonId).filter((id): id is Id<"seasons"> => id !== undefined)
        )];
        const seasonMap = new Map<string, string>();
        await Promise.all(
            seasonIds.map(async (id) => {
                const season = await ctx.db.get(id);
                if (season) seasonMap.set(id, season.name);
            })
        );

        return groups.map((g) => {
            const memberCount = [
                g.participant1,
                g.participant2,
                g.participant3,
                g.participant4,
            ].filter((id) => id !== undefined).length;

            return {
                _id: g._id,
                createdAt: g.createdAt,
                status: g.status,
                region: g.region,
                memberCount,
                seasonId: g.seasonId,
                seasonName: g.seasonId ? seasonMap.get(g.seasonId) : undefined,
                weekInSeason: g.weekInSeason,
            };
        });
    },
});

/**
 * List active groups with participant names (for assignments page)
 */
export const listActive = adminQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("groups"),
            participant1Name: v.string(),
            participant2Name: v.string(),
            participant3Name: v.optional(v.string()),
            participant4Name: v.optional(v.string()),
            weekInSeason: v.optional(weekInSeasonValidator),
            taskId: v.optional(v.id("tasks")),
        })
    ),
    handler: async (ctx) => {
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        // Enrich with participant names
        const enriched = await Promise.all(
            activeGroups.map(async (group) => {
                const p1 = await ctx.db.get(group.participant1);
                const p2 = await ctx.db.get(group.participant2);
                const p3 = group.participant3 ? await ctx.db.get(group.participant3) : null;
                const p4 = group.participant4 ? await ctx.db.get(group.participant4) : null;

                return {
                    _id: group._id,
                    participant1Name: p1?.name || "Unknown",
                    participant2Name: p2?.name || "Unknown",
                    participant3Name: p3?.name,
                    participant4Name: p4?.name,
                    weekInSeason: group.weekInSeason,
                    taskId: group.taskId,
                };
            })
        );

        return enriched;
    },
});

/**
 * Get full group details by ID with participant names (admin only)
 */
export const getById = adminQuery({
    args: {
        groupId: v.id("groups"),
    },
    returns: v.union(
        v.object({
            _id: v.id("groups"),
            createdAt: v.number(),
            status: groupStatusValidator,
            region: v.optional(regionValidator),
            seasonId: v.optional(v.id("seasons")),
            seasonName: v.optional(v.string()),
            weekInSeason: v.optional(weekInSeasonValidator),
            taskId: v.optional(v.id("tasks")),
            taskTitle: v.optional(v.string()),
            taskType: v.optional(v.string()),
            taskDifficulty: v.optional(v.string()),
            members: v.array(
                v.object({
                    _id: v.id("participants"),
                    name: v.string(),
                    telegramId: v.string(),
                    region: regionValidator,
                })
            ),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);
        if (!group) return null;

        const participantIds = [
            group.participant1,
            group.participant2,
            group.participant3,
            group.participant4,
        ].filter((id): id is Id<"participants"> => id !== undefined);

        const members = await Promise.all(
            participantIds.map(async (id) => {
                const p = await ctx.db.get(id);
                return {
                    _id: id,
                    name: p?.name || "Unknown",
                    telegramId: p?.telegramId || "",
                    region: p?.region || ("Center" as const),
                };
            })
        );

        const seasonName = group.seasonId ? (await ctx.db.get(group.seasonId))?.name : undefined;

        // Fetch task details if assigned
        let taskTitle: string | undefined;
        let taskType: string | undefined;
        let taskDifficulty: string | undefined;
        if (group.taskId) {
            const task = await ctx.db.get(group.taskId);
            if (task) {
                taskTitle = task.title;
                taskType = task.type;
                taskDifficulty = task.difficulty;
            }
        }

        return {
            _id: group._id,
            createdAt: group.createdAt,
            status: group.status,
            region: group.region,
            seasonId: group.seasonId,
            seasonName,
            weekInSeason: group.weekInSeason,
            taskId: group.taskId,
            taskTitle,
            taskType,
            taskDifficulty,
            members,
        };
    },
});

/**
 * Admin update group status
 */
export const adminUpdateStatus = adminMutation({
    args: {
        groupId: v.id("groups"),
        status: groupStatusValidator,
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);
        if (!group) throw new Error("Group not found");
        await ctx.db.patch(args.groupId, { status: args.status });
        return null;
    },
});

// ============================================
// INTERNAL QUERIES (for matching algorithm)
// ============================================

/**
 * Get participants currently in active groups
 */
export const getParticipantsInActiveGroups = internalQuery({
    args: {},
    returns: v.array(v.id("participants")),
    handler: async (ctx) => {
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        const participantIds: Id<"participants">[] = [];

        for (const group of activeGroups) {
            if (group.participant1) participantIds.push(group.participant1);
            if (group.participant2) participantIds.push(group.participant2);
            if (group.participant3) participantIds.push(group.participant3);
            if (group.participant4) participantIds.push(group.participant4);
        }

        return participantIds;
    },
});

/**
 * Get IDs of all active groups (for cron)
 */
export const getActiveGroupIds = internalQuery({
    args: {},
    returns: v.array(v.id("groups")),
    handler: async (ctx) => {
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        return activeGroups.map((g) => g._id);
    },
});

/**
 * Get group history for the last N weeks (for repeat checking)
 */
export const getHistoryLastWeeks = internalQuery({
    args: { weeks: v.number() },
    returns: v.array(
        v.object({
            participant1: v.id("participants"),
            participant2: v.id("participants"),
            participant3: v.optional(v.id("participants")),
            participant4: v.optional(v.id("participants")),
        })
    ),
    handler: async (ctx, args) => {
        const weeksAgo = Date.now() - args.weeks * 7 * 24 * 60 * 60 * 1000;

        // Use index with range filter instead of collecting all + filtering
        const recentGroups = await ctx.db
            .query("groups")
            .withIndex("by_createdAt", (q) => q.gte("createdAt", weeksAgo))
            .collect();

        return recentGroups.map((g) => ({
            participant1: g.participant1,
            participant2: g.participant2,
            participant3: g.participant3,
            participant4: g.participant4,
        }));
    },
});

// ============================================
// INTERNAL MUTATIONS
// ============================================

/**
 * Create a new group (called by matching algorithm)
 */
export const create = internalMutation({
    args: {
        participant1: v.id("participants"),
        participant2: v.id("participants"),
        participant3: v.optional(v.id("participants")),
        participant4: v.optional(v.id("participants")),
        region: v.optional(regionValidator),
        // Season fields
        seasonId: v.optional(v.id("seasons")),
        weekInSeason: v.optional(weekInSeasonValidator),
    },
    returns: v.id("groups"),
    handler: async (ctx, args) => {
        const groupId = await ctx.db.insert("groups", {
            participant1: args.participant1,
            participant2: args.participant2,
            participant3: args.participant3,
            participant4: args.participant4,
            region: args.region,
            status: "Active",
            createdAt: Date.now(),
            seasonId: args.seasonId,
            weekInSeason: args.weekInSeason,
        });

        return groupId;
    },
});

/**
 * Update group status
 */
export const updateStatus = internalMutation({
    args: {
        groupId: v.id("groups"),
        status: groupStatusValidator,
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.groupId, { status: args.status });
        return null;
    },
});

/**
 * Close all active groups (week close)
 */
export const closeActiveGroups = internalMutation({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const activeGroups = await ctx.db
            .query("groups")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        for (const group of activeGroups) {
            await ctx.db.patch(group._id, { status: "Completed" });
        }

        return activeGroups.length;
    },
});
