import { v } from "convex/values";
import { userQuery, userMutation } from "./authUser";
import { adminQuery, adminMutation } from "./authAdmin";
import { supportStatusValidator } from "./validators";

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get support tickets for a user
 */
export const getMyTickets = userQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("supportTickets"),
            question: v.string(),
            answer: v.optional(v.string()),
            status: supportStatusValidator,
            createdAt: v.number(),
        })
    ),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        // Get tickets by telegramId (works even if not a registered participant)
        const tickets = await ctx.db
            .query("supportTickets")
            .order("desc")
            .collect();

        const userTickets = tickets.filter(
            (t) =>
                t.telegramId === ctx.telegramId ||
                (participant && t.participantId === participant._id)
        );

        return userTickets.map((t) => ({
            _id: t._id,
            question: t.question,
            answer: t.answer,
            status: t.status,
            createdAt: t.createdAt,
        }));
    },
});

/**
 * List all tickets (admin view)
 */
export const list = adminQuery({
    args: {
        status: v.optional(supportStatusValidator),
    },
    returns: v.array(
        v.object({
            _id: v.id("supportTickets"),
            telegramId: v.string(),
            participantName: v.optional(v.string()),
            question: v.string(),
            answer: v.optional(v.string()),
            status: supportStatusValidator,
            createdAt: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        let ticketQuery;

        if (args.status) {
            ticketQuery = ctx.db
                .query("supportTickets")
                .withIndex("by_status", (q) => q.eq("status", args.status!));
        } else {
            ticketQuery = ctx.db.query("supportTickets").order("desc");
        }

        const tickets = await ticketQuery.collect();

        const enrichedTickets = await Promise.all(
            tickets.map(async (t) => {
                let participantName: string | undefined;

                if (t.participantId) {
                    const participant = await ctx.db.get(t.participantId);
                    participantName = participant?.name;
                }

                return {
                    _id: t._id,
                    telegramId: t.telegramId,
                    participantName,
                    question: t.question,
                    answer: t.answer,
                    status: t.status,
                    createdAt: t.createdAt,
                };
            })
        );

        return enrichedTickets;
    },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Create a new support ticket
 */
export const createTicket = userMutation({
    args: {
        question: v.string(),
    },
    returns: v.id("supportTickets"),
    handler: async (ctx, args) => {
        if (!args.question.trim()) {
            throw new Error("Question cannot be empty");
        }

        // Try to find participant
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        const ticketId = await ctx.db.insert("supportTickets", {
            participantId: participant?._id,
            telegramId: ctx.telegramId,
            question: args.question.trim(),
            status: "Open",
            createdAt: Date.now(),
        });

        return ticketId;
    },
});

/**
 * Answer a support ticket (admin)
 */
export const answerTicket = adminMutation({
    args: {
        ticketId: v.id("supportTickets"),
        answer: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        if (!args.answer.trim()) {
            throw new Error("Answer cannot be empty");
        }

        await ctx.db.patch(args.ticketId, {
            answer: args.answer.trim(),
            status: "Answered",
        });

        // TODO: Send notification to user via Telegram

        return null;
    },
});

/**
 * Close a ticket
 */
export const closeTicket = adminMutation({
    args: {
        ticketId: v.id("supportTickets"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const ticket = await ctx.db.get(args.ticketId);

        if (!ticket) {
            throw new Error("Ticket not found");
        }

        await ctx.db.patch(args.ticketId, {
            status: "Closed",
        });

        return null;
    },
});
