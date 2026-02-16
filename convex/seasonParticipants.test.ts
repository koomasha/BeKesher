import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import {
    setupTest,
    withAdminIdentity,
    makeParticipant,
    makeSeason,
    makeSeasonParticipant,
    seedParticipants,
    uniqueTelegramId,
    createTestSession,
} from "./test.utils";

describe("seasonParticipants", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("enroll", () => {
        test("enrolls a participant in a season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const enrollmentId = await admin.mutation(api.seasonParticipants.enroll, {
                seasonId,
                participantId: p1,
            });

            expect(enrollmentId).toBeDefined();

            const enrollments = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
            });
            expect(enrollments).toHaveLength(1);
            expect(enrollments[0].status).toBe("Enrolled");
        });

        test("prevents duplicate enrollment", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await admin.mutation(api.seasonParticipants.enroll, {
                seasonId,
                participantId: p1,
            });

            await expect(
                admin.mutation(api.seasonParticipants.enroll, {
                    seasonId,
                    participantId: p1,
                })
            ).rejects.toThrow();
        });
    });

    describe("updateStatus", () => {
        test("updates enrollment status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const enrollmentId = await t.run(async (ctx) => {
                return await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1)
                );
            });

            await admin.mutation(api.seasonParticipants.updateStatus, {
                enrollmentId,
                status: "Paused",
            });

            const enrollment = await t.run(async (ctx) => {
                return await ctx.db.get(enrollmentId);
            });
            expect(enrollment?.status).toBe("Paused");
        });
    });

    // ============================================
    // ADMIN QUERY TESTS
    // ============================================

    describe("listForSeason", () => {
        test("returns all enrollments with participant names", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), name: "Alice" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), name: "Bob" }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p1));
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p2));
            });

            const enrollments = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
            });
            expect(enrollments).toHaveLength(2);
            expect(enrollments.map((e: { participantName: string }) => e.participantName).sort()).toEqual(["Alice", "Bob"]);
        });

        test("filters by status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1, { status: "Enrolled" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p2, { status: "Paused" })
                );
            });

            const enrolled = await admin.query(api.seasonParticipants.listForSeason, {
                seasonId,
                status: "Enrolled",
            });
            expect(enrolled).toHaveLength(1);
        });
    });

    // ============================================
    // USER QUERY TESTS
    // ============================================

    describe("getMyEnrollment", () => {
        test("returns enrollment for active season", async () => {
            const t = setupTest();

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert(
                    "seasons",
                    makeSeason({ name: "Winter 2026", status: "Active" })
                );
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p1));
            });

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).not.toBeNull();
            expect(enrollment?.seasonName).toBe("Winter 2026");
            expect(enrollment?.status).toBe("Enrolled");
        });

        test("returns null when not enrolled", async () => {
            const t = setupTest();

            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).toBeNull();
        });

        test("returns null when no active season", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const enrollment = await t.query(api.seasonParticipants.getMyEnrollment, {
                sessionToken,
            });

            expect(enrollment).toBeNull();
        });
    });

    // ============================================
    // INTERNAL QUERY TESTS
    // ============================================

    describe("getEnrolledForMatching", () => {
        test("returns only enrolled participant IDs", async () => {
            const t = setupTest();

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2, p3] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p1, { status: "Enrolled" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p2, { status: "Paused" })
                );
                await ctx.db.insert(
                    "seasonParticipants",
                    makeSeasonParticipant(seasonId, p3, { status: "Dropped" })
                );
            });

            const enrolled = await t.query(
                internal.seasonParticipants.getEnrolledForMatching,
                { seasonId }
            );
            expect(enrolled).toHaveLength(1);
            expect(enrolled[0]).toBe(p1);
        });
    });
});
