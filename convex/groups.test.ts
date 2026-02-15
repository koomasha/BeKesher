import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId, createTestSession, withAdminIdentity } from "./test.utils";

describe("groups", () => {
    // ============================================
    // INTERNAL MUTATION TESTS
    // ============================================

    describe("create (internal)", () => {
        test("creates group with Active status", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                region: "Center",
            });

            expect(groupId).toBeDefined();

            // Verify group was created
            const admin = withAdminIdentity(t);
            const groups = await admin.query(api.groups.list, {});
            expect(groups).toHaveLength(1);
            expect(groups[0].status).toBe("Active");
            expect(groups[0].memberCount).toBe(2);
        });

        test("creates group with 3-4 participants", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                participant3: p3,
                participant4: p4,
                region: "North",
            });

            const admin = withAdminIdentity(t);
            const groups = await admin.query(api.groups.list, {});
            expect(groups[0].memberCount).toBe(4);
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("list", () => {
        test("returns all groups", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
            });

            const admin = withAdminIdentity(t);
            const groups = await admin.query(api.groups.list, {});
            expect(groups).toHaveLength(2);
        });

        test("filters by status", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            const groupId1 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
            });

            // Complete one group
            await t.mutation(internal.groups.updateStatus, {
                groupId: groupId1,
                status: "Completed",
            });

            const admin = withAdminIdentity(t);
            const activeGroups = await admin.query(api.groups.list, { status: "Active" });
            expect(activeGroups).toHaveLength(1);

            const completedGroups = await admin.query(api.groups.list, { status: "Completed" });
            expect(completedGroups).toHaveLength(1);
        });
    });

    describe("getForParticipant", () => {
        test("returns groups containing the participant with enriched member data", async () => {
            const t = setupTest();

            const [p1, p2, p3] = await seedParticipants(t, [
                makeParticipant({ telegramId: "user1", name: "User One" }),
                makeParticipant({ telegramId: "user2", name: "User Two" }),
                makeParticipant({ telegramId: "user3", name: "User Three" }),
            ]);

            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.create, {
                participant1: p2,
                participant2: p3,
            });

            const token = await createTestSession(t, "user2");
            const user2Groups = await t.query(api.groups.getForParticipant, {
                sessionToken: token,
            });

            expect(user2Groups).toHaveLength(2);
            expect(user2Groups[0].members.length).toBeGreaterThanOrEqual(2);
        });

        test("returns empty array for non-existent participant", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            const groups = await t.query(api.groups.getForParticipant, {
                sessionToken: token,
            });

            expect(groups).toHaveLength(0);
        });

        test("returns empty array for participant with no groups", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "loneuser" }),
            ]);

            const token = await createTestSession(t, "loneuser");
            const groups = await t.query(api.groups.getForParticipant, {
                sessionToken: token,
            });

            expect(groups).toHaveLength(0);
        });
    });

    describe("getActiveForParticipant", () => {
        test("returns active group for participant", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "activeuser1", name: "Active User 1" }),
                makeParticipant({ telegramId: "activeuser2", name: "Active User 2" }),
            ]);

            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                region: "Center",
            });

            const token = await createTestSession(t, "activeuser1");
            const activeGroup = await t.query(api.groups.getActiveForParticipant, {
                sessionToken: token,
            });

            expect(activeGroup).not.toBeNull();
            expect(activeGroup?.members).toHaveLength(2);
            // TODO: add name to members return type in getActiveForParticipant so @ts-ignore isn't needed
            // @ts-ignore
            expect(activeGroup?.members.some((m) => m.name === "Active User 1")).toBe(true);
            // @ts-ignore
            expect(activeGroup?.members.some((m) => m.name === "Active User 2")).toBe(true);
        });

        test("returns null when no active group", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "noactiveuser1" }),
                makeParticipant({ telegramId: "noactiveuser2" }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            // Complete the group
            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            const token = await createTestSession(t, "noactiveuser1");
            const activeGroup = await t.query(api.groups.getActiveForParticipant, {
                sessionToken: token,
            });

            expect(activeGroup).toBeNull();
        });

        test("returns null for non-existent participant", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            const activeGroup = await t.query(api.groups.getActiveForParticipant, {
                sessionToken: token,
            });

            expect(activeGroup).toBeNull();
        });
    });

    // ============================================
    // INTERNAL QUERY TESTS
    // ============================================

    describe("getParticipantsInActiveGroups (internal)", () => {
        test("returns flat array of participant IDs from active groups", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4, p5] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
                makeParticipant({ telegramId: uniqueTelegramId(5) }),
            ]);

            // Create active group with p1, p2
            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            // Create completed group with p3, p4 (should not be included)
            const completedGroupId = await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
            });
            await t.mutation(internal.groups.updateStatus, {
                groupId: completedGroupId,
                status: "Completed",
            });

            // p5 has no group

            const busyIds = await t.query(internal.groups.getParticipantsInActiveGroups, {});

            expect(busyIds).toHaveLength(2);
            expect(busyIds).toContain(p1);
            expect(busyIds).toContain(p2);
            expect(busyIds).not.toContain(p3);
            expect(busyIds).not.toContain(p5);
        });

        test("returns empty array when no active groups", async () => {
            const t = setupTest();

            const busyIds = await t.query(internal.groups.getParticipantsInActiveGroups, {});

            expect(busyIds).toHaveLength(0);
        });
    });

    describe("getHistoryLastWeeks (internal)", () => {
        test("returns groups created within N weeks", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            // Create a recent group
            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            // Create an old group (simulate by inserting directly)
            const fiveWeeksAgo = Date.now() - 5 * 7 * 24 * 60 * 60 * 1000;
            await t.run(async (ctx) => {
                await ctx.db.insert("groups", {
                    participant1: p3,
                    participant2: p4,
                    status: "Completed",
                    createdAt: fiveWeeksAgo,
                });
            });

            const history = await t.query(internal.groups.getHistoryLastWeeks, { weeks: 4 });

            // Only the recent group should be included
            expect(history).toHaveLength(1);
            expect(history[0].participant1).toBe(p1);
        });

        test("returns empty array when no recent groups", async () => {
            const t = setupTest();

            const history = await t.query(internal.groups.getHistoryLastWeeks, { weeks: 4 });

            expect(history).toHaveLength(0);
        });
    });

    // ============================================
    // INTERNAL MUTATION TESTS (continued)
    // ============================================

    describe("updateStatus (internal)", () => {
        test("patches group status", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Cancelled",
            });

            const admin = withAdminIdentity(t);
            const groups = await admin.query(api.groups.list, { status: "Cancelled" });
            expect(groups).toHaveLength(1);
        });
    });

    describe("closeActiveGroups (internal)", () => {
        test("sets all active groups to Completed and returns count", async () => {
            const t = setupTest();

            const participants = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
                makeParticipant({ telegramId: uniqueTelegramId(5) }),
                makeParticipant({ telegramId: uniqueTelegramId(6) }),
            ]);

            // Create 3 active groups
            await t.mutation(internal.groups.create, {
                participant1: participants[0],
                participant2: participants[1],
            });
            await t.mutation(internal.groups.create, {
                participant1: participants[2],
                participant2: participants[3],
            });
            await t.mutation(internal.groups.create, {
                participant1: participants[4],
                participant2: participants[5],
            });

            const closedCount = await t.mutation(internal.groups.closeActiveGroups, {});

            expect(closedCount).toBe(3);

            const admin = withAdminIdentity(t);
            const activeGroups = await admin.query(api.groups.list, { status: "Active" });
            expect(activeGroups).toHaveLength(0);

            const completedGroups = await admin.query(api.groups.list, { status: "Completed" });
            expect(completedGroups).toHaveLength(3);
        });

        test("returns 0 when no active groups", async () => {
            const t = setupTest();

            const closedCount = await t.mutation(internal.groups.closeActiveGroups, {});

            expect(closedCount).toBe(0);
        });
    });
});
