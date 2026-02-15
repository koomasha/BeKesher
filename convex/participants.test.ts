import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId, createTestSession, withAdminIdentity } from "./test.utils";

describe("participants", () => {
    // ============================================
    // REGISTRATION TESTS
    // ============================================

    describe("register", () => {
        test("registers a new participant with Lead status", async () => {
            const t = setupTest();

            const participantId = await t.mutation(api.participants.register, {
                name: "Alice Cohen",
                phone: "+972501111111",
                telegramId: "alice123",
                birthDate: `${new Date().getFullYear() - 28}-01-01`,
                gender: "Female",
                region: "Center",
            });

            expect(participantId).toBeDefined();

            // Verify the participant was created correctly
            const token = await createTestSession(t, "alice123");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant).not.toBeNull();
            expect(participant?.name).toBe("Alice Cohen");
            expect(participant?.status).toBe("Lead");
            expect(participant?.onPause).toBe(false);
            expect(participant?.totalPoints).toBe(0);
            expect(participant?.periodsPaid).toBe(0);
            expect(participant?.inChannel).toBe(false);
        });

        test("throws on duplicate telegramId", async () => {
            const t = setupTest();

            // Register first participant
            await t.mutation(api.participants.register, {
                name: "First User",
                phone: "+972501111111",
                telegramId: "duplicate123",
                birthDate: `${new Date().getFullYear() - 30}-01-01`,
                gender: "Male",
                region: "North",
            });

            // Attempt to register with same telegramId
            await expect(
                t.mutation(api.participants.register, {
                    name: "Second User",
                    phone: "+972502222222",
                    telegramId: "duplicate123",
                    birthDate: `${new Date().getFullYear() - 25}-01-01`,
                    gender: "Female",
                    region: "South",
                })
            ).rejects.toThrowError("Participant with this Telegram ID already exists");
        });

        test("registers participant with all optional fields", async () => {
            const t = setupTest();

            await t.mutation(api.participants.register, {
                name: "Full Profile User",
                phone: "+972501234567",
                telegramId: "fullprofile",
                birthDate: `${new Date().getFullYear() - 35}-01-01`,
                gender: "Male",
                region: "Center",
                city: "Tel Aviv",
                familyStatus: "Single",
                targetGender: "Female",
                targetAgeFrom: 25,
                targetAgeTo: 40,
                formatPreference: "Coffee",
                aboutMe: "I love coding",
                profession: "Developer",
                values: ["Honesty", "Growth"],
                interests: ["Tech", "Music"],
            });

            const token = await createTestSession(t, "fullprofile");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.city).toBe("Tel Aviv");
            expect(participant?.targetGender).toBe("Female");
            expect(participant?.values).toEqual(["Honesty", "Growth"]);
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("getByTelegramId", () => {
        test("returns participant when found", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "user123", name: "Test User" }),
            ]);

            const token = await createTestSession(t, "user123");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant).not.toBeNull();
            expect(participant?.name).toBe("Test User");
        });

        test("returns null when not found", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant).toBeNull();
        });
    });

    describe("getMyProfile", () => {
        test("returns profile subset of fields", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({
                    telegramId: "profileuser",
                    name: "Profile Test",
                    age: 32,
                    gender: "Female",
                    region: "South",
                    city: "Beer Sheva",
                    aboutMe: "Hello world",
                    profession: "Teacher",
                    status: "Active",
                    onPause: true,
                    totalPoints: 50,
                    paidUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
                }),
            ]);

            const token = await createTestSession(t, "profileuser");
            const profile = await t.query(api.participants.getMyProfile, {
                sessionToken: token,
            });

            expect(profile).not.toBeNull();
            expect(profile?.name).toBe("Profile Test");
            expect(profile?.birthDate).toBe(`${new Date().getFullYear() - 32}-01-01`);
            expect(profile?.region).toBe("South");
            expect(profile?.city).toBe("Beer Sheva");
            expect(profile?.status).toBe("Active");
            expect(profile?.onPause).toBe(true);
            expect(profile?.totalPoints).toBe(50);
            expect(profile?.paidUntil).toBeDefined();
        });

        test("returns null for non-existent user", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            const profile = await t.query(api.participants.getMyProfile, {
                sessionToken: token,
            });

            expect(profile).toBeNull();
        });
    });

    describe("list", () => {
        test("returns all participants when no filter", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), name: "User 1", status: "Active" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), name: "User 2", status: "Lead" }),
                makeParticipant({ telegramId: uniqueTelegramId(3), name: "User 3", status: "Inactive" }),
            ]);

            const admin = withAdminIdentity(t);
            const participants = await admin.query(api.participants.list, {});

            expect(participants).toHaveLength(3);
        });

        test("filters by status", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), name: "Active 1", status: "Active" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), name: "Active 2", status: "Active" }),
                makeParticipant({ telegramId: uniqueTelegramId(3), name: "Lead 1", status: "Lead" }),
            ]);

            const admin = withAdminIdentity(t);
            const activeParticipants = await admin.query(api.participants.list, {
                status: "Active",
            });

            expect(activeParticipants).toHaveLength(2);
            expect(activeParticipants.every((p: { status: string }) => p.status === "Active")).toBe(true);
        });

        test("filters by status and region", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), status: "Active", region: "North" }),
                makeParticipant({ telegramId: uniqueTelegramId(2), status: "Active", region: "Center" }),
                makeParticipant({ telegramId: uniqueTelegramId(3), status: "Active", region: "Center" }),
                makeParticipant({ telegramId: uniqueTelegramId(4), status: "Lead", region: "Center" }),
            ]);

            const admin = withAdminIdentity(t);
            const activeCenterParticipants = await admin.query(api.participants.list, {
                status: "Active",
                region: "Center",
            });

            expect(activeCenterParticipants).toHaveLength(2);
        });
    });

    // ============================================
    // MUTATION TESTS
    // ============================================

    describe("updateProfile", () => {
        test("updates specified fields", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "updateuser", name: "Original Name", age: 25 }),
            ]);

            const token = await createTestSession(t, "updateuser");
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                name: "Updated Name",
                birthDate: `${new Date().getFullYear() - 30}-01-01`,
                city: "Haifa",
            });

            const updated = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(updated?.name).toBe("Updated Name");
            expect(updated?.birthDate).toBe(`${new Date().getFullYear() - 30}-01-01`);
            expect(updated?.city).toBe("Haifa");
        });

        test("ignores undefined values", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "partialupdate", name: "Keep This", age: 25, city: "Tel Aviv" }),
            ]);

            const token = await createTestSession(t, "partialupdate");
            await t.mutation(api.participants.updateProfile, {
                sessionToken: token,
                birthDate: `${new Date().getFullYear() - 30}-01-01`,
            });

            const updated = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(updated?.name).toBe("Keep This");
            expect(updated?.birthDate).toBe(`${new Date().getFullYear() - 30}-01-01`);
            expect(updated?.city).toBe("Tel Aviv");
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            await expect(
                t.mutation(api.participants.updateProfile, {
                    sessionToken: token,
                    name: "New Name",
                })
            ).rejects.toThrowError("Participant not found");
        });
    });

    describe("togglePause", () => {
        test("toggles onPause from false to true", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "pauseuser", onPause: false }),
            ]);

            const token = await createTestSession(t, "pauseuser");
            const newStatus = await t.mutation(api.participants.togglePause, {
                sessionToken: token,
            });

            expect(newStatus).toBe(true);

            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });
            expect(participant?.onPause).toBe(true);
        });

        test("toggles onPause from true to false", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "unpauseuser", onPause: true }),
            ]);

            const token = await createTestSession(t, "unpauseuser");
            const newStatus = await t.mutation(api.participants.togglePause, {
                sessionToken: token,
            });

            expect(newStatus).toBe(false);
        });

        test("toggle pause twice returns to original", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "doubletoggle", onPause: false }),
            ]);

            const token = await createTestSession(t, "doubletoggle");
            await t.mutation(api.participants.togglePause, { sessionToken: token });
            const finalStatus = await t.mutation(api.participants.togglePause, {
                sessionToken: token,
            });

            expect(finalStatus).toBe(false);
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            await expect(
                t.mutation(api.participants.togglePause, {
                    sessionToken: token,
                })
            ).rejects.toThrowError("Participant not found");
        });
    });

    describe("deactivate", () => {
        test("sets status to Inactive and onPause to false", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "deactivateuser", status: "Active", onPause: true }),
            ]);

            const token = await createTestSession(t, "deactivateuser");
            await t.mutation(api.participants.deactivate, {
                sessionToken: token,
            });

            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.status).toBe("Inactive");
            expect(participant?.onPause).toBe(false);
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            const token = await createTestSession(t, "nonexistent");
            await expect(
                t.mutation(api.participants.deactivate, {
                    sessionToken: token,
                })
            ).rejects.toThrowError("Participant not found");
        });
    });

    // ============================================
    // INTERNAL FUNCTION TESTS
    // ============================================

    describe("getActiveForMatching (internal)", () => {
        test("returns Active and Lead participants not on pause", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), status: "Active", onPause: false }),
                makeParticipant({ telegramId: uniqueTelegramId(2), status: "Lead", onPause: false }),
                makeParticipant({ telegramId: uniqueTelegramId(3), status: "Active", onPause: true }), // excluded
                makeParticipant({ telegramId: uniqueTelegramId(4), status: "Inactive", onPause: false }), // excluded
            ]);

            const active = await t.query(internal.participants.getActiveForMatching, {});

            expect(active).toHaveLength(2);
        });
    });

    describe("updateStatus (internal)", () => {
        test("updates participant status", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "statususer", status: "Lead" }),
            ]);

            await t.mutation(internal.participants.updateStatus, {
                participantId,
                status: "Active",
            });

            const token = await createTestSession(t, "statususer");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.status).toBe("Active");
        });
    });

    describe("updatePaymentInfo (internal)", () => {
        test("updates paidUntil, paymentDate, increments periodsPaid, and sets status to Active", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "paymentuser", status: "Lead", periodsPaid: 0 }),
            ]);

            const paidUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
            const paymentDate = Date.now();

            await t.mutation(internal.participants.updatePaymentInfo, {
                participantId,
                paidUntil,
                paymentDate,
            });

            const token = await createTestSession(t, "paymentuser");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.paidUntil).toBe(paidUntil);
            expect(participant?.paymentDate).toBe(paymentDate);
            expect(participant?.periodsPaid).toBe(1);
            expect(participant?.status).toBe("Active");
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            // Create a fake ID by seeding and then using a different approach
            const [realId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "temp" }),
            ]);

            // Delete the participant
            await t.run(async (ctx) => {
                await ctx.db.delete(realId);
            });

            await expect(
                t.mutation(internal.participants.updatePaymentInfo, {
                    participantId: realId,
                    paidUntil: Date.now(),
                    paymentDate: Date.now(),
                })
            ).rejects.toThrowError("Participant not found");
        });
    });

    describe("addPoints (internal)", () => {
        test("increments totalPoints", async () => {
            const t = setupTest();

            const [participantId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "pointsuser", totalPoints: 10 }),
            ]);

            await t.mutation(internal.participants.addPoints, {
                participantId,
                points: 15,
            });

            const token = await createTestSession(t, "pointsuser");
            const participant = await t.query(api.participants.getByTelegramId, {
                sessionToken: token,
            });

            expect(participant?.totalPoints).toBe(25);
        });

        test("throws when participant not found", async () => {
            const t = setupTest();

            const [realId] = await seedParticipants(t, [
                makeParticipant({ telegramId: "temp" }),
            ]);

            await t.run(async (ctx) => {
                await ctx.db.delete(realId);
            });

            await expect(
                t.mutation(internal.participants.addPoints, {
                    participantId: realId,
                    points: 10,
                })
            ).rejects.toThrowError("Participant not found");
        });
    });
});
