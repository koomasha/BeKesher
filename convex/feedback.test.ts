import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, makeParticipant, seedParticipants, uniqueTelegramId } from "./test.utils";

describe("feedback", () => {
    // ============================================
    // SUBMIT FEEDBACK TESTS
    // ============================================

    describe("submitFeedback", () => {
        test("creates feedback record and awards 10 points to participant", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "feedbackuser1", name: "Feedback User 1", totalPoints: 0 }),
                makeParticipant({ telegramId: "feedbackuser2", name: "Feedback User 2" }),
            ]);

            // Create and complete a group
            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            // Submit feedback
            const feedbackId = await t.mutation(api.feedback.submitFeedback, {
                telegramId: "feedbackuser1",
                groupId,
                rating: 5,
                textFeedback: "Great meeting!",
                wouldMeetAgain: "yes",
            });

            expect(feedbackId).toBeDefined();

            // Check points were awarded
            const participant = await t.query(api.participants.getByTelegramId, {
                telegramId: "feedbackuser1",
            });
            expect(participant?.totalPoints).toBe(10);
        });

        test("throws if participant not found", async () => {
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
                status: "Completed",
            });

            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "nonexistent",
                    groupId,
                    rating: 4,
                })
            ).rejects.toThrowError("Participant not found");
        });

        test("throws if group not found", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "fakegroupuser" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            // Create and delete a group to get a valid-looking but non-existent ID
            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.run(async (ctx) => {
                await ctx.db.delete(groupId);
            });

            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "fakegroupuser",
                    groupId,
                    rating: 4,
                })
            ).rejects.toThrowError("Group not found");
        });

        test("throws if participant was not in the group", async () => {
            const t = setupTest();

            const [p1, p2, outsider] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: "outsider" }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "outsider",
                    groupId,
                    rating: 4,
                })
            ).rejects.toThrowError("You were not in this group");
        });

        test("throws if feedback already submitted for this group", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "duplicatefb" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            // First feedback should succeed
            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "duplicatefb",
                groupId,
                rating: 5,
            });

            // Second feedback should fail
            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "duplicatefb",
                    groupId,
                    rating: 4,
                })
            ).rejects.toThrowError("Feedback already submitted for this group");
        });

        test("throws if rating is less than 1", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "ratingtest1" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "ratingtest1",
                    groupId,
                    rating: 0,
                })
            ).rejects.toThrowError("Rating must be between 1 and 10");
        });

        test("throws if rating is greater than 10", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "ratingtest2" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            await expect(
                t.mutation(api.feedback.submitFeedback, {
                    telegramId: "ratingtest2",
                    groupId,
                    rating: 11,
                })
            ).rejects.toThrowError("Rating must be between 1 and 10");
        });

        test("accepts rating exactly 1 (boundary)", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "rating1test" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            const feedbackId = await t.mutation(api.feedback.submitFeedback, {
                telegramId: "rating1test",
                groupId,
                rating: 1,
            });

            expect(feedbackId).toBeDefined();
        });

        test("accepts rating exactly 10 (boundary)", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "rating10test" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, {
                groupId,
                status: "Completed",
            });

            const feedbackId = await t.mutation(api.feedback.submitFeedback, {
                telegramId: "rating10test",
                groupId,
                rating: 10,
            });

            expect(feedbackId).toBeDefined();
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("getForParticipant", () => {
        test("returns feedback submitted by participant", async () => {
            const t = setupTest();

            const [p1, p2, p3] = await seedParticipants(t, [
                makeParticipant({ telegramId: "fbparticipant1" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
            ]);

            // Create two groups
            const groupId1 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });
            const groupId2 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p3,
            });

            await t.mutation(internal.groups.updateStatus, { groupId: groupId1, status: "Completed" });
            await t.mutation(internal.groups.updateStatus, { groupId: groupId2, status: "Completed" });

            // Submit feedback for both
            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "fbparticipant1",
                groupId: groupId1,
                rating: 4,
            });
            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "fbparticipant1",
                groupId: groupId2,
                rating: 5,
            });

            const feedback = await t.query(api.feedback.getForParticipant, {
                telegramId: "fbparticipant1",
            });

            expect(feedback).toHaveLength(2);
        });

        test("returns empty array for participant with no feedback", async () => {
            const t = setupTest();

            await seedParticipants(t, [
                makeParticipant({ telegramId: "nofeedbackuser" }),
            ]);

            const feedback = await t.query(api.feedback.getForParticipant, {
                telegramId: "nofeedbackuser",
            });

            expect(feedback).toHaveLength(0);
        });

        test("returns empty array for non-existent participant", async () => {
            const t = setupTest();

            const feedback = await t.query(api.feedback.getForParticipant, {
                telegramId: "nonexistent",
            });

            expect(feedback).toHaveLength(0);
        });
    });

    describe("getPendingFeedback", () => {
        test("returns completed groups without feedback", async () => {
            const t = setupTest();

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: "pendinguser" }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            // Create two completed groups with participant p1
            const groupId1 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });
            const groupId2 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p3,
            });
            // Active group - should not show in pending
            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p4,
            });

            await t.mutation(internal.groups.updateStatus, { groupId: groupId1, status: "Completed" });
            await t.mutation(internal.groups.updateStatus, { groupId: groupId2, status: "Completed" });

            // Submit feedback for only one group
            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "pendinguser",
                groupId: groupId1,
                rating: 4,
            });

            const pending = await t.query(api.feedback.getPendingFeedback, {
                telegramId: "pendinguser",
            });

            expect(pending).toHaveLength(1);
            expect(pending[0].groupId).toBe(groupId2);
        });

        test("returns empty array for non-existent participant", async () => {
            const t = setupTest();

            const pending = await t.query(api.feedback.getPendingFeedback, {
                telegramId: "nonexistent",
            });

            expect(pending).toHaveLength(0);
        });
    });

    describe("getForGroup", () => {
        test("returns all feedback for a group with participant names", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: "groupfb1", name: "User One" }),
                makeParticipant({ telegramId: "groupfb2", name: "User Two" }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            await t.mutation(internal.groups.updateStatus, { groupId, status: "Completed" });

            // Both submit feedback
            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "groupfb1",
                groupId,
                rating: 4,
                textFeedback: "Nice meeting!",
            });

            await t.mutation(api.feedback.submitFeedback, {
                telegramId: "groupfb2",
                groupId,
                rating: 5,
                textFeedback: "Excellent!",
            });

            const feedback = await t.query(api.feedback.getForGroup, { groupId });

            expect(feedback).toHaveLength(2);
            expect(feedback.some((f) => f.participantName === "User One")).toBe(true);
            expect(feedback.some((f) => f.participantName === "User Two")).toBe(true);
        });

        test("returns empty array for group with no feedback", async () => {
            const t = setupTest();

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const feedback = await t.query(api.feedback.getForGroup, { groupId });

            expect(feedback).toHaveLength(0);
        });
    });
});
