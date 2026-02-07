import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

// ============================================
// WEEKLY MATCHING - Every Sunday at 18:00 Israel time
// ============================================

crons.cron(
    "weekly-matching",
    // Sunday at 18:00 Israel time (UTC+2/+3)
    // Using 16:00 UTC to approximate 18:00 Israel time
    "0 16 * * 0",
    internal.matching.runWeeklyMatching,
    {}
);

// ============================================
// WEEK CLOSE - Every Saturday at 23:00 Israel time
// Close active groups and request feedback
// ============================================

crons.cron(
    "weekly-close",
    // Saturday at 21:00 UTC (23:00 Israel time)
    "0 21 * * 6",
    internal.crons.closeWeekAndRequestFeedback,
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
 * Close active groups and request feedback from participants
 */
export const closeWeekAndRequestFeedback = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        console.log("🔒 Closing active groups...");

        // Close all active groups
        const closedCount: number = await ctx.runMutation(
            internal.groups.closeActiveGroups,
            {}
        );

        console.log(`✅ Closed ${closedCount} groups`);

        // TODO: Send feedback request notifications to all group members
        // This would use internal.notifications.sendFeedbackRequest

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
        console.log("💳 Checking for expiring subscriptions...");

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

        console.log(`📧 Sending ${participants.length} payment reminders`);

        // TODO: Send notifications via Telegram
        // Different messages based on:
        // - 3 days before: "Your subscription expires in 3 days"
        // - 1 day before: "Tomorrow is the last day!"
        // - On expiry day: "Last chance to renew!"
        // - 6 days after: Grace period ends

        // Deactivate participants who are 6+ days past expiry
        for (const p of participants) {
            if (p.paidUntil && p.paidUntil < sixDaysAgo) {
                console.log(`❌ Deactivating ${p.name} - grace period expired`);
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
export const getParticipantsForPaymentReminders = internalMutation({
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
        console.log("🧹 Running weekly cleanup...");

        // TODO: Implement cleanup logic
        // - Remove very old completed groups (>6 months)
        // - Clean up old payment logs
        // - Archive old support tickets

        console.log("✅ Cleanup complete");

        return null;
    },
});

export default crons;
