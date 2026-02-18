import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId, withAdminIdentity } from "./test.utils";

describe("crons", () => {
    // ============================================
    // WEEKLY CLOSE AND MATCH
    // ============================================

    describe("weeklyCloseAndMatch", () => {
        test("closes active groups and marks incomplete tasks", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), status: "Active", onPause: false, region: "Center" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), status: "Active", onPause: false, region: "Center" }),
                makeParticipant({ telegramId: uniqueTelegramId(3), status: "Active", onPause: false, region: "Center" }),
                makeParticipant({ telegramId: uniqueTelegramId(4), status: "Active", onPause: false, region: "Center" }),
            ]);

            // Create active groups
            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });
            await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
            });

            // Verify they're active
            const admin = withAdminIdentity(t);
            const activeBefore = await admin.query(api.groups.list, { status: "Active" });
            expect(activeBefore).toHaveLength(2);

            // Run the combined close + match handler
            await t.action(internal.crons.weeklyCloseAndMatch, {});

            // Verify old groups are now completed
            const completed = await admin.query(api.groups.list, { status: "Completed" });
            expect(completed).toHaveLength(2);
        });

        test("handles no active groups gracefully", async () => {
            const t = setupTest();

            // No groups exist — should not throw
            await t.action(internal.crons.weeklyCloseAndMatch, {});

            const admin = withAdminIdentity(t);
            const groups = await admin.query(api.groups.list, {});
            expect(groups).toHaveLength(0);
        });
    });

    // ============================================
    // PAYMENT REMINDERS
    // ============================================

    describe("getParticipantsForPaymentReminders (internal)", () => {
        test("returns participants whose paidUntil is within next 3 days", async () => {
            const t = setupTest();

            const now = Date.now();
            const oneDayFromNow = now + 1 * 24 * 60 * 60 * 1000;
            const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
            const tenDaysFromNow = now + 10 * 24 * 60 * 60 * 1000;
            const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

            // Expires in 2 days - should get "3_days" reminder
            const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;

            await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    name: "NeedsReminder2Days",
                    status: "Active",
                    paidUntil: twoDaysFromNow,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(2),
                    name: "NotYet",
                    status: "Active",
                    paidUntil: tenDaysFromNow,
                }),
                makeParticipant({
                    telegramId: uniqueTelegramId(3),
                    name: "NoPaidUntil",
                    status: "Active",
                    // paidUntil is undefined - should NOT be included
                }),
            ]);

            const reminders = await t.query(
                internal.crons.getParticipantsForPaymentReminders,
                {
                    threeDaysFromNow,
                    oneDayFromNow,
                    now,
                    sixDaysAgo,
                }
            );

            // Only "NeedsReminder2Days" should be included (paidUntil within 3 days)
            // "NotYet" is too far out (10 days)
            // "NoPaidUntil" has no paidUntil
            expect(reminders.length).toBeGreaterThanOrEqual(1);
            expect(reminders.some((p: { name: string }) => p.name === "NeedsReminder2Days")).toBe(true);
            expect(reminders.some((p: { name: string }) => p.name === "NotYet")).toBe(false);
        });
    });

    describe("sendPaymentReminders", () => {
        test("runs without errors when no participants need reminders", async () => {
            const t = setupTest();

            // No participants with upcoming payment due
            await seedParticipants(t, [
                makeParticipant({
                    telegramId: uniqueTelegramId(1),
                    status: "Active",
                    paidUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
                }),
            ]);

            // Should not throw
            await t.action(internal.crons.sendPaymentReminders, {});
        });
    });

    // ============================================
    // CLEANUP OLD DATA
    // ============================================

    describe("cleanupOldData", () => {
        test("runs without throwing errors (stub implementation)", async () => {
            const t = setupTest();

            // Create some old data
            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            // Insert old group
            const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
            await t.run(async (ctx) => {
                await ctx.db.insert("groups", {
                    participant1: p1,
                    participant2: p2,
                    status: "Completed",
                    createdAt: threeMonthsAgo,
                });
            });

            // Should not throw
            await t.action(internal.crons.cleanupOldData, {});
        });
    });
});
