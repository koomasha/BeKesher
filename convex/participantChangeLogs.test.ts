import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTest, makeParticipant, createTestSession } from "./test.utils";

describe("participantChangeLogs", () => {
    describe("profile update logging", () => {
        test("logs name change when profile is updated", async () => {
            const t = setupTest();

            // Register participant
            const participantId = await t.mutation(api.participants.register, {
                name: "Original Name",
                phone: "+972501111111",
                telegramId: "changetest1",
                birthDate: `${new Date().getFullYear() - 30}-01-01`,
                gender: "Male",
                region: "Center",
            });

            // Create session and update name
            const token = await createTestSession(t, "changetest1");
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                name: "Updated Name",
            });

            // Query change logs
            const logs = await t.run(async (ctx) => {
                return await ctx.db
                    .query("participantChangeLogs")
                    .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                    .collect();
            });

            expect(logs).toHaveLength(1);
            expect(logs[0].field).toBe("name");
            expect(logs[0].oldValue).toBe("Original Name");
            expect(logs[0].newValue).toBe("Updated Name");
            expect(logs[0].changedAt).toBeDefined();
        });

        test("logs multiple field changes in single update", async () => {
            const t = setupTest();

            const participantId = await t.mutation(api.participants.register, {
                name: "Test User",
                phone: "+972501111111",
                telegramId: "changetest2",
                birthDate: `${new Date().getFullYear() - 28}-01-01`,
                gender: "Female",
                region: "Center",
            });

            const token = await createTestSession(t, "changetest2");
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                name: "New Name",
                phone: "+972502222222",
                region: "North",
            });

            const logs = await t.run(async (ctx) => {
                return await ctx.db
                    .query("participantChangeLogs")
                    .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                    .collect();
            });

            expect(logs).toHaveLength(3);

            const nameLog = logs.find(l => l.field === "name");
            expect(nameLog?.oldValue).toBe("Test User");
            expect(nameLog?.newValue).toBe("New Name");

            const phoneLog = logs.find(l => l.field === "phone");
            expect(phoneLog?.oldValue).toBe("+972501111111");
            expect(phoneLog?.newValue).toBe("+972502222222");

            const regionLog = logs.find(l => l.field === "region");
            expect(regionLog?.oldValue).toBe("Center");
            expect(regionLog?.newValue).toBe("North");
        });

        test("logs socialMediaConsent toggle", async () => {
            const t = setupTest();

            const participantId = await t.mutation(api.participants.register, {
                name: "Consent Test",
                phone: "+972503333333",
                telegramId: "changetest3",
                birthDate: `${new Date().getFullYear() - 25}-01-01`,
                gender: "Male",
                region: "North",
                socialMediaConsent: true,
            });

            const token = await createTestSession(t, "changetest3");
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                socialMediaConsent: false,
            });

            const logs = await t.run(async (ctx) => {
                return await ctx.db
                    .query("participantChangeLogs")
                    .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                    .collect();
            });

            expect(logs).toHaveLength(1);
            expect(logs[0].field).toBe("socialMediaConsent");
            expect(logs[0].oldValue).toBe("true");
            expect(logs[0].newValue).toBe("false");
        });

        test("does not log when value doesn't change", async () => {
            const t = setupTest();

            const participantId = await t.mutation(api.participants.register, {
                name: "Same Name",
                phone: "+972504444444",
                telegramId: "changetest4",
                birthDate: `${new Date().getFullYear() - 32}-01-01`,
                gender: "Female",
                region: "South",
            });

            const token = await createTestSession(t, "changetest4");
            // Update with same name
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                name: "Same Name",
            });

            const logs = await t.run(async (ctx) => {
                return await ctx.db
                    .query("participantChangeLogs")
                    .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                    .collect();
            });

            expect(logs).toHaveLength(0);
        });

        test("logs optional field changes (null to value, value to null)", async () => {
            const t = setupTest();

            const participantId = await t.mutation(api.participants.register, {
                name: "City Test",
                phone: "+972505555555",
                telegramId: "changetest5",
                birthDate: `${new Date().getFullYear() - 27}-01-01`,
                gender: "Male",
                region: "Center",
                // city is not provided, so it will be undefined
            });

            const token = await createTestSession(t, "changetest5");

            // Add city (null -> value)
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                city: "Tel Aviv",
            });

            let logs = await t.run(async (ctx) => {
                return await ctx.db
                    .query("participantChangeLogs")
                    .withIndex("by_participantId", (q) => q.eq("participantId", participantId))
                    .collect();
            });

            expect(logs).toHaveLength(1);
            expect(logs[0].field).toBe("city");
            expect(logs[0].oldValue).toBeNull();
            expect(logs[0].newValue).toBe("Tel Aviv");
        });
    });
});
