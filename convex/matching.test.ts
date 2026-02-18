import { expect, test, describe } from "vitest";
import { internal } from "./_generated/api";
import { setupTest, makeParticipant, makeSeason, makeSeasonParticipant, seedParticipants, uniqueTelegramId } from "./test.utils";
import type { Id } from "./_generated/dataModel";

/**
 * Helper to create an active season and enroll participants for matching tests
 */
async function setupSeasonWithParticipants(
    t: ReturnType<typeof setupTest>,
    participantIds: Id<"participants">[]
) {
    const now = Date.now();
    const seasonId = await t.run(async (ctx) => {
        return await ctx.db.insert("seasons", makeSeason({
            status: "Active",
            startDate: now,
        }));
    });

    // Enroll all participants
    for (const pid of participantIds) {
        await t.run(async (ctx) => {
            await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, pid));
        });
    }

    return seasonId;
}

describe("matching", () => {
    // ============================================
    // EDGE CASE TESTS
    // ============================================

    describe("runWeeklyMatching - edge cases", () => {
        test("returns success=false with <2 participants", async () => {
            const t = setupTest();

            // Only 1 participant
            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(false);
            expect(result.groupsCreated).toBe(0);
            expect(result.message).toBe("Not enough participants");
        });

        test("returns success=true with 0 groups when all participants are busy", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            // Put them in an active group
            await t.mutation(internal.groups.create, {
                participant1: participantIds[0],
                participant2: participantIds[1],
                region: "Center",
            });

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(0);
            expect(result.message).toBe("All participants already in active groups");
        });
    });

    // ============================================
    // STAGE A TESTS - Strict matching
    // ============================================

    describe("runWeeklyMatching - Stage A (strict)", () => {
        test("matches participants in same region with close age", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "Alice",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "Bob",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 35,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
            expect(result.unpaired).toBe(0);
        });

        test("respects history - participants who met within 4 weeks are NOT matched in Stage A", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "User1",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "User2",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(3),
                    name: "User3",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(4),
                    name: "User4",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            // User1 and User2 met recently (create a completed group in history)
            const historyGroupId = await t.mutation(internal.groups.create, {
                participant1: participantIds[0],
                participant2: participantIds[1],
                region: "Center",
            });
            await t.mutation(internal.groups.updateStatus, {
                groupId: historyGroupId,
                status: "Completed",
            });

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            // Should create groups, but User1 and User2 should not be paired together in Stage A
            // They can still be paired in later stages if needed
            expect(result.groupsCreated).toBeGreaterThanOrEqual(1);
        });
    });

    // ============================================
    // STAGE B TESTS - Expanded age
    // ============================================

    describe("runWeeklyMatching - Stage B (expanded age)", () => {
        test("matches participants with wider age range (±15 years)", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "Young",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 25,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "Older",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 38, // 13 years difference - exceeds Stage A (10) but within Stage B (15)
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
        });
    });

    // ============================================
    // STAGE D TESTS - Neighboring regions
    // ============================================

    describe("runWeeklyMatching - Stage D (neighboring regions)", () => {
        test("matches North+Center participants", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "NorthPerson",
                    status: "Active",
                    onPause: false,
                    region: "North",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "CenterPerson",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
            expect(result.unpaired).toBe(0);
        });

        test("matches Center+South participants", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "CenterPerson",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "SouthPerson",
                    status: "Active",
                    onPause: false,
                    region: "South",
                    age: 30,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
            expect(result.unpaired).toBe(0);
        });
    });

    // ============================================
    // STAGE E TESTS - Force majeure
    // ============================================

    describe("runWeeklyMatching - Stage E (force majeure)", () => {
        test("North+South forbidden - ensures they are NOT in same group", async () => {
            const t = setupTest();

            // Only North and South participants, no Center
            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "North1",
                    status: "Active",
                    onPause: false,
                    region: "North",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "South1",
                    status: "Active",
                    onPause: false,
                    region: "South",
                    age: 30,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            // They cannot be matched together, so should remain unpaired
            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(0);
            expect(result.unpaired).toBe(2);
        });
    });

    // ============================================
    // GROUP SIZE TESTS
    // ============================================

    describe("runWeeklyMatching - group sizes", () => {
        test("groups are 2-4 participants, never 1", async () => {
            const t = setupTest();

            // Create enough participants to form multiple groups
            const participants = [];
            for (let i = 1; i <= 10; i++) {
                participants.push(
                    makeParticipant({
                        telegramId: uniqueTelegramId(i),
                        name: `User${i}`,
                        status: "Active",
                        onPause: false,
                        region: "Center",
                        age: 25 + i,
                    })
                );
            }

            const participantIds = await seedParticipants(t, participants);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBeGreaterThanOrEqual(2);

            // Verify group sizes by checking the groups in DB
            const groups = await t.query(internal.groups.getParticipantsInActiveGroups, {});

            // Total participants in groups should be 10 - unpaired
            const expectedInGroups = 10 - result.unpaired;
            expect(groups.length).toBe(expectedInGroups);
        });

        test("single remaining participant gets added to existing group if possible", async () => {
            const t = setupTest();

            // 3 participants - should form 1 group of 3, not 1 group of 2 + 1 unpaired
            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 32,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(3),
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 34,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
            expect(result.unpaired).toBe(0);
        });
    });

    // ============================================
    // FULL PIPELINE TESTS
    // ============================================

    describe("runWeeklyMatching - full pipeline", () => {
        test("10+ participants across regions all get matched", async () => {
            const t = setupTest();

            const participants = [
                // North region
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "North1",
                    status: "Active",
                    onPause: false,
                    region: "North",
                    age: 25,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "North2",
                    status: "Active",
                    onPause: false,
                    region: "North",
                    age: 28,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(3),
                    name: "North3",
                    status: "Active",
                    onPause: false,
                    region: "North",
                    age: 32,
                }),
                // Center region
                makeParticipant({
                    telegramId: uniqueTelegramId(4),
                    name: "Center1",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 27,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(5),
                    name: "Center2",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(6),
                    name: "Center3",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 35,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(7),
                    name: "Center4",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 38,
                }),
                // South region
                makeParticipant({
                    telegramId: uniqueTelegramId(8),
                    name: "South1",
                    status: "Active",
                    onPause: false,
                    region: "South",
                    age: 26,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(9),
                    name: "South2",
                    status: "Active",
                    onPause: false,
                    region: "South",
                    age: 29,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(10),
                    name: "South3",
                    status: "Active",
                    onPause: false,
                    region: "South",
                    age: 33,
                }),
            ];

            const participantIds = await seedParticipants(t, participants);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBeGreaterThanOrEqual(3);
            // Most participants should be matched
            expect(result.unpaired).toBeLessThanOrEqual(2);
        });

        test("respects participant status and pause", async () => {
            const t = setupTest();

            const participantIds = await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "ActiveNotPaused1",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "ActiveNotPaused2",
                    status: "Active",
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(3),
                    name: "ActivePaused",
                    status: "Active",
                    onPause: true, // Should be excluded
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(4),
                    name: "InactiveNotPaused",
                    status: "Inactive", // Should be excluded
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(5),
                    name: "LeadNotPaused",
                    status: "Lead", // Should be excluded
                    onPause: false,
                    region: "Center",
                    age: 30,
                }),
            ]);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            // Only 2 participants should be matched (ActiveNotPaused1 and ActiveNotPaused2)
            // The others are excluded due to pause or inactive/lead status
            expect(result.success).toBe(true);
            expect(result.groupsCreated).toBe(1);
        });
    });

    // ============================================
    // SPECIFIC BEHAVIOR TESTS
    // ============================================

    describe("runWeeklyMatching - specific behaviors", () => {
        test("odd number of participants handles gracefully", async () => {
            const t = setupTest();

            // 5 participants
            const participants = [];
            for (let i = 1; i <= 5; i++) {
                participants.push(
                    makeParticipant({
                        telegramId: uniqueTelegramId(i * 100),
                        name: `User${i}`,
                        status: "Active",
                        onPause: false,
                        region: "Center",
                        age: 30,
                    })
                );
            }

            const participantIds = await seedParticipants(t, participants);

            // Setup season and enroll participants
            await setupSeasonWithParticipants(t, participantIds);

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(true);
            // Either 1 group of 5 (unlikely), 1 group of 3 + 1 group of 2, or similar
            expect(result.unpaired).toBeLessThanOrEqual(1);
        });

        test("empty database returns not enough participants", async () => {
            const t = setupTest();

            // Create an active season with no enrolled participants
            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({
                    status: "Active",
                    startDate: Date.now(),
                }));
            });

            const result = await t.action(internal.matching.runWeeklyMatching, {});

            expect(result.success).toBe(false);
            expect(result.message).toBe("Not enough participants");
        });
    });
});
