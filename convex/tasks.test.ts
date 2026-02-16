import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTest, withAdminIdentity, makeTask } from "./test.utils";

describe("tasks", () => {
    // ============================================
    // ADMIN MUTATION TESTS
    // ============================================

    describe("create", () => {
        test("creates task with all fields", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const taskId = await admin.mutation(api.tasks.create, {
                title: "Что ты умеешь?",
                description: "Share a hidden talent with your group",
                onlineInstructions: "Can be done over video call",
                reportInstructions: "Submit photos of your performance",
                type: "Creative",
                difficulty: "Medium",
                purpose: "Everyone",
            });

            expect(taskId).toBeDefined();

            const task = await admin.query(api.tasks.get, { taskId });
            expect(task?.title).toBe("Что ты умеешь?");
            expect(task?.type).toBe("Creative");
            expect(task?.status).toBe("Active");
        });
    });

    describe("update", () => {
        test("updates task fields", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask({ title: "Original Title" }));
            });

            await admin.mutation(api.tasks.update, {
                taskId,
                title: "Updated Title",
                difficulty: "Hard",
            });

            const task = await admin.query(api.tasks.get, { taskId });
            expect(task?.title).toBe("Updated Title");
            expect(task?.difficulty).toBe("Hard");
        });
    });

    describe("archive", () => {
        test("archives a task", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            const taskId = await t.run(async (ctx) => {
                return await ctx.db.insert("tasks", makeTask({ status: "Active" }));
            });

            await admin.mutation(api.tasks.archive, { taskId });

            const task = await admin.query(api.tasks.get, { taskId });
            expect(task?.status).toBe("Archive");
        });
    });

    // ============================================
    // QUERY TESTS
    // ============================================

    describe("list", () => {
        test("returns all tasks", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("tasks", makeTask({ title: "Task 1" }));
                await ctx.db.insert("tasks", makeTask({ title: "Task 2" }));
            });

            const tasks = await admin.query(api.tasks.list, {});
            expect(tasks).toHaveLength(2);
        });

        test("filters by status", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("tasks", makeTask({ status: "Active" }));
                await ctx.db.insert("tasks", makeTask({ status: "Archive" }));
            });

            const activeTasks = await admin.query(api.tasks.list, { status: "Active" });
            expect(activeTasks).toHaveLength(1);
            expect(activeTasks[0].status).toBe("Active");
        });

        test("filters by type", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("tasks", makeTask({ type: "Activity" }));
                await ctx.db.insert("tasks", makeTask({ type: "Conversation" }));
                await ctx.db.insert("tasks", makeTask({ type: "Creative" }));
            });

            const creativeTasks = await admin.query(api.tasks.list, { type: "Creative" });
            expect(creativeTasks).toHaveLength(1);
            expect(creativeTasks[0].type).toBe("Creative");
        });

        test("filters by both status and type", async () => {
            const t = setupTest();
            const admin = withAdminIdentity(t);

            await t.run(async (ctx) => {
                await ctx.db.insert("tasks", makeTask({ status: "Active", type: "Activity" }));
                await ctx.db.insert("tasks", makeTask({ status: "Archive", type: "Activity" }));
                await ctx.db.insert("tasks", makeTask({ status: "Active", type: "Creative" }));
            });

            const filtered = await admin.query(api.tasks.list, {
                status: "Active",
                type: "Activity"
            });
            expect(filtered).toHaveLength(1);
            expect(filtered[0].status).toBe("Active");
            expect(filtered[0].type).toBe("Activity");
        });
    });
});
