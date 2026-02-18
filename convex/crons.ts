import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

// ============================================
// WEEKLY CYCLE - Every Saturday at 18:00 Israel time
// Step 1: Close current week's groups + mark incomplete tasks
// Step 2: Run matching for next week
// Both run sequentially in a single action to avoid ordering bugs
// ============================================

crons.cron(
    "weekly-cycle",
    // Saturday at 18:00 Israel time (UTC+2/+3)
    // Using 16:00 UTC to approximate 18:00 Israel time
    "0 16 * * 6",
    internal.crons.weeklyCloseAndMatch,
    {}
);

// ============================================
// PAYMENT REMINDERS - Daily at 10:00 Israel time
// Check for expiring subscriptions
// ============================================

crons.cron(
    "payment-reminders",
    // Daily at 08:00 UTC (10:00 Israel time)
    "0 8 * * *",
    internal.crons.sendPaymentReminders,
    {}
);

// ============================================
// CLEANUP - Weekly on Monday at 03:00
// Clean up old data
// ============================================

crons.cron(
    "weekly-cleanup",
    // Monday at 01:00 UTC (03:00 Israel time)
    "0 1 * * 1",
    internal.crons.cleanupOldData,
    {}
);

// ============================================
// CRON HANDLERS
// ============================================

/**
 * Weekly cycle: close current week, then run matching for next week.
 * Runs as a single sequential action to ensure groups are closed
 * BEFORE matching runs (otherwise participants in active groups
 * would be filtered out as "busy" and matching creates 0 groups).
 */
export const weeklyCloseAndMatch = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // === STEP 1: Close current week ===
        console.log("📦 Step 1: Closing current week...");

        // Get all active groups before closing
        const activeGroups = await ctx.runQuery(
            internal.groups.getActiveGroupIds,
            {}
        );

        // Mark incomplete task assignments as "NotCompleted"
        if (activeGroups.length > 0) {
            const markedCount = await ctx.runMutation(
                internal.taskAssignments.markIncompleteAsNotCompleted,
                { groupIds: activeGroups }
            );
            console.log(`✅ Marked ${markedCount} incomplete tasks as NotCompleted`);
        }

        // Close all active groups
        const closedCount = await ctx.runMutation(
            internal.groups.closeActiveGroups,
            {}
        );
        console.log(`✅ Closed ${closedCount} active groups`);

        // TODO: Send feedback request notifications to all group members

        // === STEP 2: Run matching for next week ===
        console.log("🚀 Step 2: Running matching for next week...");

        const result = await ctx.runAction(
            internal.matching.runWeeklyMatching,
            {}
        );

        console.log(`✅ Matching complete: ${result.groupsCreated} groups created, ${result.unpaired} unpaired`);

        return null;
    },
});

/**
 * Send payment reminders to users with expiring subscriptions
 */
export const sendPaymentReminders = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = Date.now();
        const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
        const oneDayFromNow = now + 1 * 24 * 60 * 60 * 1000;
        const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

        // Get participants who need reminders
        const participants = await ctx.runQuery(
            internal.crons.getParticipantsForPaymentReminders,
            {
                threeDaysFromNow,
                oneDayFromNow,
                now,
                sixDaysAgo,
            }
        );

        // TODO: Send notifications via Telegram
        // Different messages based on:
        // - 3 days before: "Your subscription expires in 3 days"
        // - 1 day before: "Tomorrow is the last day!"
        // - On expiry day: "Last chance to renew!"
        // - 6 days after: Grace period ends

        // Deactivate participants who are 6+ days past expiry
        for (const p of participants) {
            if (p.paidUntil && p.paidUntil < sixDaysAgo) {
                await ctx.runMutation(internal.participants.updateStatus, {
                    participantId: p._id,
                    status: "Inactive",
                });
            }
        }

        return null;
    },
});

/**
 * Get participants who need payment reminders
 */
export const getParticipantsForPaymentReminders = internalQuery({
    args: {
        threeDaysFromNow: v.number(),
        oneDayFromNow: v.number(),
        now: v.number(),
        sixDaysAgo: v.number(),
    },
    returns: v.array(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            telegramId: v.string(),
            paidUntil: v.optional(v.number()),
            reminderType: v.string(),
        })
    ),
    handler: async (ctx, args) => {
        // Get active participants
        const activeParticipants = await ctx.db
            .query("participants")
            .withIndex("by_status", (q) => q.eq("status", "Active"))
            .collect();

        const needReminders: Array<{
            _id: typeof activeParticipants[0]["_id"];
            name: string;
            telegramId: string;
            paidUntil?: number;
            reminderType: string;
        }> = [];

        for (const p of activeParticipants) {
            if (!p.paidUntil) continue;

            let reminderType = "";

            if (p.paidUntil < args.sixDaysAgo) {
                reminderType = "grace_expired";
            } else if (p.paidUntil < args.now) {
                reminderType = "expired";
            } else if (p.paidUntil < args.oneDayFromNow) {
                reminderType = "one_day";
            } else if (p.paidUntil < args.threeDaysFromNow) {
                reminderType = "three_days";
            }

            if (reminderType) {
                needReminders.push({
                    _id: p._id,
                    name: p.name,
                    telegramId: p.telegramId,
                    paidUntil: p.paidUntil,
                    reminderType,
                });
            }
        }

        return needReminders;
    },
});

/**
 * Clean up old data
 */
export const cleanupOldData = internalAction({
    args: {},
    returns: v.null(),
    handler: async (_ctx) => {
        // TODO: Implement cleanup logic
        // - Remove very old completed groups (>6 months)
        // - Clean up old payment logs
        // - Archive old support tickets

        return null;
    },
});

export default crons;
