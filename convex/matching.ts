import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { adminAction } from "./authAdmin";
import { calculateAge } from "./utils";
import type { Region } from "./validators";

// ============================================
// HELPER FUNCTIONS
// ============================================

// ============================================
// TYPES
// ============================================

interface Participant {
    _id: Id<"participants">;
    name: string;
    telegramId: string;
    birthDate: string;
    gender: string;
    region: string;
}

interface MatchingCriteria {
    sameRegion: boolean;
    ageRange: number;
    allowRepeats: boolean;
}

interface GroupResult {
    participants: Participant[];
    region: Region | undefined;
    isForceMajeure?: boolean;
}

interface MatchingStageResult {
    groups: GroupResult[];
    unpaired: Participant[];
}

// ============================================
// CONSTANTS
// ============================================

const HISTORY_WEEKS = 4;

const NEIGHBORING_REGIONS: Record<Region, Region[]> = {
    North: ["Center"],
    Center: ["North", "South"],
    South: ["Center"],
};

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

/**
 * Run the weekly matching algorithm
 * This is the main entry point called by the cron job or admin
 */
export const runWeeklyMatching = internalAction({
    args: {},
    returns: v.object({
        success: v.boolean(),
        groupsCreated: v.number(),
        unpaired: v.number(),
        unpairedNames: v.array(v.string()),
        message: v.optional(v.string()),
    }),
    handler: async (ctx) => {
        console.log("🚀 Starting weekly matching v3.1...");

        // 1. Get active participants
        const participants: Participant[] = await ctx.runQuery(
            internal.participants.getActiveForMatching,
            {}
        );
        console.log(`✅ Found ${participants.length} active participants`);

        if (participants.length < 2) {
            console.log("❌ Not enough participants for matching!");
            return {
                success: false,
                groupsCreated: 0,
                unpaired: 0,
                unpairedNames: [],
                message: "Not enough participants",
            };
        }

        // 2. Get participants in active groups (they're busy)
        const busyParticipantIds: Id<"participants">[] = await ctx.runQuery(
            internal.groups.getParticipantsInActiveGroups,
            {}
        );
        const busySet = new Set(busyParticipantIds);
        console.log(`✅ Already in active groups: ${busySet.size} people`);

        // 3. Filter available participants
        const availableParticipants = participants.filter(
            (p) => !busySet.has(p._id)
        );
        console.log(`✅ Available for matching: ${availableParticipants.length}`);

        if (availableParticipants.length < 2) {
            console.log("⚠️ Not enough available participants!");
            return {
                success: true,
                groupsCreated: 0,
                unpaired: 0,
                unpairedNames: [],
                message: "All participants already in active groups",
            };
        }

        // 4. Get group history for the last 4 weeks (for repeat checking)
        const groupHistory = await ctx.runQuery(internal.groups.getHistoryLastWeeks, {
            weeks: HISTORY_WEEKS,
        });
        console.log(
            `✅ Group history (last ${HISTORY_WEEKS} weeks): ${groupHistory.length} records`
        );

        const historyMap = buildHistoryMap(groupHistory);

        // MULTI-STAGE MATCHING
        let allGroups: GroupResult[] = [];
        let unpaired = availableParticipants;

        // STAGE A: Strict (region + ±10 years + not met in 4 weeks)
        console.log("\n🎯 STAGE A: Strict matching (region + ±10 years + new people)");
        const resultA = matchGroupsWithCriteria(unpaired, historyMap, {
            sameRegion: true,
            ageRange: 10,
            allowRepeats: false,
        });
        allGroups = allGroups.concat(resultA.groups);
        unpaired = resultA.unpaired;
        console.log(
            `✅ Stage A: ${resultA.groups.length} groups, ${unpaired.length} remaining`
        );

        // STAGE B: Expanded age (region + ±15 years + not met)
        console.log("\n🎯 STAGE B: Expanded age (±15 years + new people)");
        const resultB = matchGroupsWithCriteria(unpaired, historyMap, {
            sameRegion: true,
            ageRange: 15,
            allowRepeats: false,
        });
        allGroups = allGroups.concat(resultB.groups);
        unpaired = resultB.unpaired;
        console.log(
            `✅ Stage B: ${resultB.groups.length} groups, ${unpaired.length} remaining`
        );

        // STAGE C: Allow repeats (region + ±15 years + allow repeats)
        console.log("\n🎯 STAGE C: Allow repeats");
        const resultC = matchGroupsWithCriteria(unpaired, historyMap, {
            sameRegion: true,
            ageRange: 15,
            allowRepeats: true,
        });
        allGroups = allGroups.concat(resultC.groups);
        unpaired = resultC.unpaired;
        console.log(
            `✅ Stage C: ${resultC.groups.length} groups, ${unpaired.length} remaining`
        );

        // STAGE D: Neighboring regions
        console.log("\n🎯 STAGE D: Neighboring regions");
        const resultD = matchGroupsNeighboringRegions(unpaired, historyMap);
        allGroups = allGroups.concat(resultD.groups);
        unpaired = resultD.unpaired;
        console.log(
            `✅ Stage D: ${resultD.groups.length} groups, ${unpaired.length} remaining`
        );

        // STAGE E: Force majeure (no one left behind!)
        console.log("\n🎯 STAGE E: Force majeure (no one left behind!)");
        const resultE = matchGroupsForceMajeure(unpaired);
        allGroups = allGroups.concat(resultE.groups);
        unpaired = resultE.unpaired;
        console.log(
            `✅ Stage E: ${resultE.groups.length} groups, ${unpaired.length} remaining`
        );

        // Save groups to database
        let createdCount = 0;
        for (const group of allGroups) {
            const participants = group.participants;
            if (participants.length >= 2) {
                await ctx.runMutation(internal.groups.create, {
                    participant1: participants[0]._id,
                    participant2: participants[1]._id,
                    participant3: participants[2]?._id,
                    participant4: participants[3]?._id,
                    region: group.region,
                });
                createdCount++;
            }
        }

        console.log("\n🎉 MATCHING COMPLETE!");
        console.log(`✅ Groups created: ${createdCount}`);
        console.log(`⚠️ Without group: ${unpaired.length}`);

        // Log remaining (if any)
        for (const p of unpaired) {
            console.log(`❌ WITHOUT GROUP: ${p.name} | ${p.region}`);
        }

        return {
            success: true,
            groupsCreated: createdCount,
            unpaired: unpaired.length,
            unpairedNames: unpaired.map((p) => p.name),
        };
    },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build a map of participant meeting history
 */
function buildHistoryMap(
    groupHistory: Array<{
        participant1: Id<"participants">;
        participant2: Id<"participants">;
        participant3?: Id<"participants">;
        participant4?: Id<"participants">;
    }>
): Map<Id<"participants">, Set<Id<"participants">>> {
    const map = new Map<Id<"participants">, Set<Id<"participants">>>();

    for (const group of groupHistory) {
        const participants = [
            group.participant1,
            group.participant2,
            group.participant3,
            group.participant4,
        ].filter((id): id is Id<"participants"> => id !== undefined);

        // Each participant met every other participant in this group
        for (let i = 0; i < participants.length; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const a = participants[i];
                const b = participants[j];

                if (!map.has(a)) map.set(a, new Set());
                if (!map.has(b)) map.set(b, new Set());

                map.get(a)!.add(b);
                map.get(b)!.add(a);
            }
        }
    }

    return map;
}

/**
 * Match groups with specific criteria
 */
function matchGroupsWithCriteria(
    participants: Participant[],
    historyMap: Map<Id<"participants">, Set<Id<"participants">>>,
    criteria: MatchingCriteria
): MatchingStageResult {
    const groups: GroupResult[] = [];
    const matched = new Set<Id<"participants">>();

    // Create pools based on region criteria
    const pools: Array<{ region: Region | undefined; participants: Participant[] }> = [];

    if (criteria.sameRegion) {
        const byRegion: Record<Region, Participant[]> = {
            North: [],
            Center: [],
            South: [],
        };
        for (const p of participants) {
            if (p.region && (p.region === "North" || p.region === "Center" || p.region === "South")) {
                byRegion[p.region].push(p);
            }
        }

        for (const region of ["North", "Center", "South"] as const) {
            if (byRegion[region].length > 0) {
                pools.push({ region, participants: byRegion[region] });
            }
        }
    } else {
        pools.push({ region: undefined, participants });
    }

    for (const pool of pools) {
        // Sort by age
        const sortedPool = [...pool.participants].sort((a, b) =>
            calculateAge(a.birthDate) - calculateAge(b.birthDate)
        );
        let available = sortedPool.filter((p) => !matched.has(p._id));

        while (available.length >= 2) {
            const maxPossible = Math.min(4, available.length);
            let groupSize = 2 + Math.floor(Math.random() * (maxPossible - 1));

            if (available.length <= 4) {
                groupSize = available.length;
            }

            const group = findCompatibleGroup(
                available,
                historyMap,
                criteria,
                groupSize
            );

            if (group) {
                groups.push({
                    participants: group,
                    region: pool.region,
                });

                for (const p of group) {
                    matched.add(p._id);
                }

                console.log(
                    `👥 Group (${group.length}) in ${pool.region}: ${group.map((p) => p.name).join(" + ")}`
                );

                available = available.filter((p) => !matched.has(p._id));
            } else {
                break;
            }
        }
    }

    const unpaired = participants.filter((p) => !matched.has(p._id));

    return { groups, unpaired };
}

/**
 * Find a compatible group of target size
 */
function findCompatibleGroup(
    available: Participant[],
    historyMap: Map<Id<"participants">, Set<Id<"participants">>>,
    criteria: MatchingCriteria,
    targetSize: number
): Participant[] | null {
    for (let i = 0; i < available.length; i++) {
        const group: Participant[] = [available[i]];

        for (let j = 0; j < available.length && group.length < targetSize; j++) {
            if (i === j) continue;

            const candidate = available[j];
            let compatible = true;

            for (const member of group) {
                if (!checkCompatibility(member, candidate, historyMap, criteria)) {
                    compatible = false;
                    break;
                }
            }

            if (compatible) {
                group.push(candidate);
            }
        }

        if (group.length >= 2) {
            return group;
        }
    }

    return null;
}

/**
 * Check if two participants are compatible
 */
function checkCompatibility(
    p1: Participant,
    p2: Participant,
    historyMap: Map<Id<"participants">, Set<Id<"participants">>>,
    criteria: MatchingCriteria
): boolean {
    // Check age range
    const ageDiff = Math.abs(calculateAge(p1.birthDate) - calculateAge(p2.birthDate));
    if (ageDiff > criteria.ageRange) {
        return false;
    }

    // Check history (if repeats not allowed)
    if (!criteria.allowRepeats) {
        const p1History = historyMap.get(p1._id);
        if (p1History && p1History.has(p2._id)) {
            return false;
        }
    }

    return true;
}

/**
 * Match groups across neighboring regions
 */
function matchGroupsNeighboringRegions(
    participants: Participant[],
    historyMap: Map<Id<"participants">, Set<Id<"participants">>>
): MatchingStageResult {
    const groups: GroupResult[] = [];
    const matched = new Set<Id<"participants">>();

    // Group by region
    const byRegion: Record<string, Participant[]> = {};
    for (const p of participants) {
        const region = p.region || "Unknown";
        if (!byRegion[region]) byRegion[region] = [];
        byRegion[region].push(p);
    }

    // Try to combine neighboring regions
    const regionPairs: [string, string][] = [
        ["North", "Center"],
        ["Center", "South"],
    ];

    for (const [region1, region2] of regionPairs) {
        let combined: Participant[] = [];

        if (byRegion[region1]) {
            combined = combined.concat(
                byRegion[region1].filter((p) => !matched.has(p._id))
            );
        }
        if (byRegion[region2]) {
            combined = combined.concat(
                byRegion[region2].filter((p) => !matched.has(p._id))
            );
        }

        if (combined.length >= 2) {
            const result = matchGroupsWithCriteria(combined, historyMap, {
                sameRegion: false,
                ageRange: 15,
                allowRepeats: true,
            });

            for (const group of result.groups) {
                groups.push(group);
                for (const p of group.participants) {
                    matched.add(p._id);
                }
            }
        }
    }

    const unpaired = participants.filter((p) => !matched.has(p._id));

    return { groups, unpaired };
}

/**
 * Force majeure matching - no one left behind (but North+South forbidden)
 */
function matchGroupsForceMajeure(participants: Participant[]): MatchingStageResult {
    const groups: GroupResult[] = [];
    const matched = new Set<Id<"participants">>();

    console.log(`🚨 Force majeure: ${participants.length} people`);

    // Group by region
    const byRegion: Record<string, Participant[]> = {
        North: [],
        Center: [],
        South: [],
    };

    for (const p of participants) {
        const region = p.region || "Center";
        if (!byRegion[region]) byRegion[region] = [];
        byRegion[region].push(p);
    }

    // First: North + Center
    const northCenter = [...byRegion["North"], ...byRegion["Center"]];
    const resultNC = formForceMajeureGroups(northCenter, matched);
    groups.push(...resultNC);

    // Then: South + remaining Center
    const availableCenter = byRegion["Center"].filter((p) => !matched.has(p._id));
    const southCenter = [...byRegion["South"], ...availableCenter];
    const resultSC = formForceMajeureGroups(southCenter, matched);
    groups.push(...resultSC);

    // Remaining
    let unpaired = participants.filter((p) => !matched.has(p._id));

    // If 1 person remains, try to add to existing group
    if (unpaired.length === 1 && groups.length > 0) {
        const loner = unpaired[0];
        const lonerRegion = loner.region || "Center";

        for (const group of groups) {
            if (group.participants.length < 4) {
                const groupRegions = group.participants.map((p) => p.region || "Center");
                let compatible = true;

                // Check: North and South should not be together
                if (lonerRegion === "North" && groupRegions.includes("South"))
                    compatible = false;
                if (lonerRegion === "South" && groupRegions.includes("North"))
                    compatible = false;

                if (compatible) {
                    group.participants.push(loner);
                    console.log(`🚨 Added to group: ${loner.name}`);
                    unpaired = [];
                    break;
                }
            }
        }
    }

    return { groups, unpaired };
}

/**
 * Form groups in force majeure mode
 */
function formForceMajeureGroups(
    participants: Participant[],
    matched: Set<Id<"participants">>
): GroupResult[] {
    const groups: GroupResult[] = [];
    let remaining = participants.filter((p) => !matched.has(p._id));

    while (remaining.length >= 2) {
        const maxSize = Math.min(4, remaining.length);
        let groupSize = 2 + Math.floor(Math.random() * (maxSize - 1));

        if (remaining.length <= 4) {
            groupSize = remaining.length;
        }

        const groupParticipants = remaining.slice(0, groupSize);

        groups.push({
            participants: groupParticipants,
            region: undefined,
            isForceMajeure: true,
        });

        for (const p of groupParticipants) {
            matched.add(p._id);
        }

        console.log(
            `🚨 Force majeure group (${groupSize}): ${groupParticipants.map((p) => p.name).join(" + ")}`
        );

        remaining = remaining.slice(groupSize);
    }

    return groups;
}

// ============================================
// PUBLIC API (for admin dashboard)
// ============================================

/**
 * Public wrapper for runWeeklyMatching, callable from the admin dashboard.
 */
export const runWeeklyMatchingPublic = adminAction({
    args: {},
    returns: v.object({
        success: v.boolean(),
        groupsCreated: v.number(),
        unpaired: v.number(),
        unpairedNames: v.array(v.string()),
        message: v.optional(v.string()),
    }),
    handler: async (ctx): Promise<{
        success: boolean;
        groupsCreated: number;
        unpaired: number;
        unpairedNames: string[];
        message?: string;
    }> => {
        return await ctx.runAction(internal.matching.runWeeklyMatching, {});
    },
});
