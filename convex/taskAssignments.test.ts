import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import { setupTest, withAdminIdentity, makeParticipant, makeTask, makeTaskAssignment, seedParticipants, uniqueTelegramId, createTestSession } from "./test.utils";

describe("taskAssignments", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("assignToGroups", () => {
        test("assigns task to multiple groups", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

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
            });

            const group2Id = await t.mutation(internal.groups.create, {
                participant1: p3,
                participant2: p4,
                weekInSeason: 1,
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

            const [p1, p2] = await seedParticipants(t, [
                makeParticipant({ telegramId: uniqueTelegramId(1) }),
                makeParticipant({ telegramId: uniqueTelegramId(2) }),
            ]);

            const groupId = await t.mutation(internal.groups.create, {
                participant1: p1,
                participant2: p2,
                weekInSeason: 1,
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
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId));
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
                return await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId));
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

    describe("listForReview", () => {
        test("returns assignments for admin review", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

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
                await ctx.db.insert("taskAssignments", makeTaskAssignment(groupId, taskId));
            });

            const assignments = await admin.query(api.taskAssignments.listForReview, {});
            expect(assignments).toHaveLength(1);
            expect(assignments[0].taskTitle).toBe("Test Task");
        });

        test("filters by review status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

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
                    reviewStatus: "Pending",
                }));
                await ctx.db.insert("taskAssignments", makeTaskAssignment(g2, taskId, {
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
