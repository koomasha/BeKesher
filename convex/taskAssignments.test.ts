import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, withAdminIdentity, makeParticipant, makeTask, makeTaskAssignment, makeSeason, seedParticipants, uniqueTelegramId, createTestSession } from "./test.utils";

describe("taskAssignments", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("assignToGroups", () => {
        test("assigns task to multiple groups", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create participants and groups
            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            const group1Id = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            const group2Id = await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            // Create task
            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            // Assign task to both groups
            const count = await admin.mutation(api.taskAssignments.assignToGroups, {
                groupIds: [group1Id, group2Id],
                taskId,
            });

            expect(count).toBe(2);

            // Verify assignments created
            const assignments = await t.run(async (ctx) => {
                return await ctx.db.query("taskAssignments").collect();
            });
            expect(assignments).toHaveLength(2);
            expect(assignments[0].reviewStatus).toBe("Pending");
            expect(assignments[0].pointsAwarded).toBe(0);
        });

        test("updates group with taskId", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            await admin.mutation(api.taskAssignments.assignToGroups, {
                groupIds: [groupId],
                taskId,
            });

            const group = await t.run(async (ctx) => {
                return await ctx.db.get(groupId);
            });
            expect(group?.taskId).toBe(taskId);
        });
    });

    describe("submitCompletion", () => {
        test("updates assignment with completion data", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create participant, group, task, and assignment
            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, { seasonId }));
            });

            // Submit completion as user
            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            await t.mutation(api.taskAssignments.submitCompletion, {
                sessionToken,
                assignmentId,
                completionNotes: "We completed the task!",
                completionPhotos: [],
            });

            // Verify submission
            const assignment = await t.run(async (ctx) => {
                return await ctx.db.get(assignmentId);
            });
            expect(assignment?.completionNotes).toBe("We completed the task!");
            expect(assignment?.submittedBy).toBe(p1);
            expect(assignment?.reviewStatus).toBe("Pending");
        });
    });

    describe("reviewCompletion", () => {
        test("approves task and awards points", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create participant, group, task, and assignment
            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), totalPoints: 0 }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                    seasonId,
                    submittedBy: p1,
                    completionNotes: "Done!",
                }));
            });

            // Review and approve
            await admin.mutation(api.taskAssignments.reviewCompletion, {
                assignmentId,
                reviewStatus: "Approved",
                reviewComment: "Great work!",
                pointsAwarded: 10,
            });

            // Verify assignment updated
            const assignment = await t.run(async (ctx) => {
                return await ctx.db.get(assignmentId);
            });
            expect(assignment?.reviewStatus).toBe("Approved");
            expect(assignment?.reviewComment).toBe("Great work!");
            expect(assignment?.pointsAwarded).toBe(10);

            // Verify points awarded to participant
            const participant = await t.run(async (ctx) => {
                return await ctx.db.get(p1);
            });
            expect(participant?.totalPoints).toBe(10);
        });

        test("rejects task without awarding points", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), totalPoints: 0 }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                    seasonId,
                    submittedBy: p1,
                }));
            });

            await admin.mutation(api.taskAssignments.reviewCompletion, {
                assignmentId,
                reviewStatus: "Rejected",
                pointsAwarded: 0,
            });

            const participant = await t.run(async (ctx) => {
                return await ctx.db.get(p1);
            });
            expect(participant?.totalPoints).toBe(0);
        });
    });

    // ============================================
    // INTERNAL MUTATION TESTS
    // ============================================

    describe("markIncompleteAsNotCompleted", () => {
        test("marks pending assignments without completion as NotCompleted", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            // Assignment without completion
            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, { seasonId }));
            });

            const count = await t.mutation(internal.taskAssignments.markIncompleteAsNotCompleted, {
                groupIds: [groupId],
            });

            expect(count).toBe(1);

            const assignment = await t.run(async (ctx) => {
                return await ctx.db.get(assignmentId);
            });
            expect(assignment?.reviewStatus).toBe("NotCompleted");
        });

        test("does not mark completed assignments", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            // Assignment WITH completion
            await t.run(async (ctx) => {
                await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                    seasonId,
                    completedAt: Date.now(),
                }));
            });

            const count = await t.mutation(internal.taskAssignments.markIncompleteAsNotCompleted, {
                groupIds: [groupId],
            });

            expect(count).toBe(0);
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("getForActiveGroup", () => {
        test("returns assignment for caller's active group", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create participants
            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            // Create active group
            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            // Create task and assignment
            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask({ title: "Group Task" }));
            });

            await t.run(async (ctx) => {
                await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, { seasonId }));
            });

            // Query as participant1
            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const result = await t.query(api.taskAssignments.getForActiveGroup, {
                sessionToken,
            });

            expect(result).not.toBeNull();
            expect(result!.task.title).toBe("Group Task");
            expect(result!.reviewStatus).toBe("Pending");
        });

        test("returns null when no assignment exists", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create participants and group without any assignment
            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            // Query as participant1 — no assignment was created
            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            const result = await t.query(api.taskAssignments.getForActiveGroup, {
                sessionToken,
            });

            expect(result).toBeNull();
        });
    });

    describe("submitCompletion — authorization", () => {
        test("throws when non-member tries to submit", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            // Create three participants: p1 and p2 in a group, p3 outside
            const [p1, p2, p3] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, { seasonId }));
            });

            // Attempt to submit as participant3 (not a member of the group)
            const sessionToken = await createTestSession(t, uniqueTelegramId(3));
            await expect(
                t.mutation(api.taskAssignments.submitCompletion, {
                    sessionToken,
                    assignmentId,
                    completionNotes: "Sneaky submission",
                    completionPhotos: [],
                })
            ).rejects.toThrow("You are not a member of this group");
        });
    });

    describe("reviewCompletion — double-approval prevention", () => {
        test("throws when reviewing an already-approved assignment", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1), totalPoints: 0 }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                    seasonId,
                    submittedBy: p1,
                    completionNotes: "Done!",
                }));
            });

            // First approval succeeds
            await admin.mutation(api.taskAssignments.reviewCompletion, {
                assignmentId,
                reviewStatus: "Approved",
                reviewComment: "Good job",
                pointsAwarded: 10,
            });

            // Second approval should throw
            await expect(
                admin.mutation(api.taskAssignments.reviewCompletion, {
                    assignmentId,
                    reviewStatus: "Approved",
                    reviewComment: "Trying again",
                    pointsAwarded: 10,
                })
            ).rejects.toThrow("already approved");
        });
    });

    describe("submitCompletion — re-submission for Revision status", () => {
        test("allows submission when assignment has Revision status", async () => {
            const t = setupTest();

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
                seasonId: seasonId,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            // Create assignment already in Revision status
            const assignmentId = await t.run(async (ctx) => {
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, {
                    seasonId,
                    reviewStatus: "Revision",
                    submittedBy: p1,
                    completionNotes: "First attempt",
                }));
            });

            // Re-submit as the same user
            const sessionToken = await createTestSession(t, uniqueTelegramId(1));
            await t.mutation(api.taskAssignments.submitCompletion, {
                sessionToken,
                assignmentId,
                completionNotes: "Updated attempt after revision feedback",
                completionPhotos: [],
            });

            // Verify updated completion notes
            const assignment = await t.run(async (ctx) => {
                return await ctx.db.get(assignmentId);
            });
            expect(assignment?.completionNotes).toBe("Updated attempt after revision feedback");
            expect(assignment?.submittedBy).toBe(p1);
        });
    });

    describe("listForReview", () => {
        test("returns assignments for admin review", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask({ title: "Test Task" }));
            });

            await t.run(async (ctx) => {
                await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId, { seasonId }));
            });

            const assignments = await admin.query(api.taskAssignments.listForReview, {});
            expect(assignments).toHaveLength(1);
            expect(assignments[0].taskTitle).toBe("Test Task");
        });

        test("filters by review status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            // Create season
            const seasonId = await t.run(async (ctx) => {
                return await ctx.db.insert("seasons", makeSeason({ status: "Active" }));
            });

            const [p1, p2, p3, p4] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
                makeParticipant({ telegramId: uniqueTelegramId(3) }),
                makeParticipant({ telegramId: uniqueTelegramId(4) }),
            ]);

            const g1 = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
            });

            const g2 = await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
            });

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask());
            });

            await t.run(async (ctx) => {
                await ctx.db.insert("taskAssignments", makeTaskAssignment(g1, taskId, {
                    seasonId,
                    reviewStatus: "Pending",
                }));
                await ctx.db.insert("taskAssignments", makeTaskAssignment(g2, taskId, {
                    seasonId,
                    reviewStatus: "Approved",
                }));
            });

            const pending = await admin.query(api.taskAssignments.listForReview, {
                reviewStatus: "Pending",
            });
            expect(pending).toHaveLength(1);
            expect(pending[0].reviewStatus).toBe("Pending");
        });
    });
});
