import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, withAdminIdentity, makeSeason, makeParticipant, makeSeasonParticipant, seedParticipants, uniqueTelegramId } from "./test.utils";
import { calculateWeekInSeason } from "./utils";

describe("seasons", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("create", () => {
        test("creates season with Draft status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await admin.mutation(api.seasons.create, {
                name: "Winter 2026",
                startDate: Date.now(),
            });

            expect(seasonId).toBeDefined();

            const seasons = await admin.query(api.seasons.list, {});
            expect(seasons).toHaveLength(1);
            expect(seasons[0].name).toBe("Winter 2026");
            expect(seasons[0].status).toBe("Draft");
            expect(seasons[0].enrolledCount).toBe(0);
        });

        test("calculates endDate as 4 weeks after startDate", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const startDate = Date.now();
            const seasonId = await admin.mutation(api.seasons.create, {
                name: "Test Season",
                startDate,
            });

            const season = await admin.query(api.seasons.get, { seasonId });
            const fourWeeks = 4 * 7 * 24 * 60 * 60 * 1000;
            expect(season?.endDate).toBe(startDate + fourWeeks);
        });
    });

    describe("activate", () => {
        test("activates a Draft season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason());
            });

            await admin.mutation(api.seasons.activate, { seasonId });

            const season = await admin.query(api.seasons.get, { seasonId });
            expect(season?.status).toBe("Active");
        });

        test("prevents activating when another season is active", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create and activate first season
            const season1Id = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Season 1" }));
            });
            await admin.mutation(api.seasons.activate, { seasonId: season1Id });

            // Try to activate second season
            const season2Id = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Season 2" }));
            });

            await expect(
                admin.mutation(api.seasons.activate, { seasonId: season2Id })
            ).rejects.toThrow();
        });

        test("activate prevents duplicate active", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create and activate first season
            const season1Id = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "First Active" }));
            });
            await admin.mutation(api.seasons.activate, { seasonId: season1Id });

            // Create a second draft season and try to activate it
            const season2Id = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Second Draft" }));
            });

            await expect(
                admin.mutation(api.seasons.activate, { seasonId: season2Id })
            ).rejects.toThrow("Another season is already active");
        });
    });

    describe("update", () => {
        test("draft-only guard for update — rejects Active season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create a season and activate it
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Original Name" }));
            });
            await admin.mutation(api.seasons.activate, { seasonId });

            // Verify it is Active
            const season = await admin.query(api.seasons.get, { seasonId });
            expect(season?.status).toBe("Active");

            // Attempt to update should throw
            await expect(
                admin.mutation(api.seasons.update, { seasonId, name: "New Name" })
            ).rejects.toThrow("Can only edit seasons in Draft status");
        });

        test("draft-only guard for update — rejects Completed season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create a season, activate it, then complete it
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Original Name" }));
            });
            await admin.mutation(api.seasons.activate, { seasonId });
            await admin.mutation(api.seasons.complete, { seasonId });

            // Verify it is Completed
            const season = await admin.query(api.seasons.get, { seasonId });
            expect(season?.status).toBe("Completed");

            // Attempt to update should throw
            await expect(
                admin.mutation(api.seasons.update, { seasonId, name: "New Name" })
            ).rejects.toThrow("Can only edit seasons in Draft status");
        });
    });

    describe("complete", () => {
        test("marks season as Completed and updates enrollments", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season and participants
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(seasonId, p1));
            });

            // Complete season
            await admin.mutation(api.seasons.complete, { seasonId });

            const season = await admin.query(api.seasons.get, { seasonId });
            expect(season?.status).toBe("Completed");

            // Check enrollments updated
            const enrollments = await t.run(async (ctx) => {
                return await ctx.db
                    .query("seasonParticipants")
                    .filter((q) => q.eq(q.field("seasonId"), seasonId))
                    .collect();
            });
            expect(enrollments[0].status).toBe("Completed");
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("list", () => {
        test("returns all seasons with enrollment counts", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create seasons
            const season1Id = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ name: "Season 1" }));
            });

            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({ name: "Season 2" }));
            });

            // Add participant to season 1
            const [p1] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasonParticipants", makeSeasonParticipant(season1Id, p1));
            });

            const seasons = await admin.query(api.seasons.list, {});
            expect(seasons).toHaveLength(2);
            expect(seasons.find(s => s.name === "Season 1")?.enrolledCount).toBe(1);
            expect(seasons.find(s => s.name === "Season 2")?.enrolledCount).toBe(0);
        });

        test("filters by status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({ status: "Draft" }));
                await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
                await ctx.db.insert("seasons", makeSeason({ status: "Completed" }));
            });

            const activeSeasons = await admin.query(api.seasons.list, { status: "Active" });
            expect(activeSeasons).toHaveLength(1);
            expect(activeSeasons[0].status).toBe("Active");
        });
    });

    describe("getActive", () => {
        test("returns active season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("seasons", makeSeason({ name: "Active Season", status: "Active" }));
            });

            const activeSeason = await admin.query(api.seasons.getActive, {});
            expect(activeSeason?.name).toBe("Active Season");
            expect(activeSeason?.status).toBe("Active");
        });

        test("returns null when no active season", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const activeSeason = await admin.query(api.seasons.getActive, {});
            expect(activeSeason).toBeNull();
        });
    });

    // ============================================
    // PURE FUNCTION TESTS
    // ============================================

    describe("calculateWeekInSeason", () => {
        test("returns correct week number", () => {
            const weekMs = 7 * 24 * 60 * 60 * 1000;
            const startDate = Date.now();

            expect(calculateWeekInSeason(startDate, startDate)).toBe(1);
            expect(calculateWeekInSeason(startDate, startDate + weekMs)).toBe(2);
            expect(calculateWeekInSeason(startDate, startDate + 2 * weekMs)).toBe(3);
            expect(calculateWeekInSeason(startDate, startDate + 3 * weekMs)).toBe(4);
        });

        test("returns null outside bounds", () => {
            const weekMs = 7 * 24 * 60 * 60 * 1000;
            const startDate = Date.now();

            expect(calculateWeekInSeason(startDate, startDate - weekMs)).toBeNull();
            expect(calculateWeekInSeason(startDate, startDate + 4 * weekMs)).toBeNull();
        });
    });
});
