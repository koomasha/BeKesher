import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { userQuery, userAction } from "./authUser";
import { paymentStatusValidator, currencyValidator } from "./validators";

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Get the default payment amount from environment variable
 * Defaults to 100 shekels if not set
 */
export const getPaymentAmount = query({
    args: {},
    returns: v.number(),
    handler: async () => {
        const amount = process.env.PAYMENT_AMOUNT;
        return amount ? parseFloat(amount) : 100;
    },
});

/**
 * Get payment history for a participant
 */
export const getPaymentHistory = userQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("paymentLogs"),
            amount: v.number(),
            currency: currencyValidator,
            status: paymentStatusValidator,
            createdAt: v.number(),
        })
    ),
    handler: async (ctx) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", ctx.telegramId))
            .unique();

        if (!participant) {
            return [];
        }

        const payments = await ctx.db
            .query("paymentLogs")
            .withIndex("by_participantId", (q) =>
                q.eq("participantId", participant._id)
            )
            .order("desc")
            .collect();

        return payments.map((p) => ({
            _id: p._id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            createdAt: p.createdAt,
        }));
    },
});

// ============================================
// PUBLIC ACTIONS
// ============================================

// PayPlus API response interface
interface PayPlusResponse {
    results?: {
        status: string;
        description?: string;
    };
    data?: {
        payment_page_link?: string;
    };
}

/**
 * Create a payment link via PayPlus
 */
export const createPaymentLink = userAction({
    args: {
        amount: v.number(),
        months: v.number(),
    },
    returns: v.object({
        success: v.boolean(),
        paymentUrl: v.optional(v.string()),
        error: v.optional(v.string()),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: async (ctx: any, args: any): Promise<{ success: boolean; paymentUrl?: string; error?: string }> => {
        // Get participant
        const participant: { _id: Id<"participants">; name: string; phone: string; email?: string } | null = await ctx.runQuery(
            internal.payments.getParticipantByTelegramId,
            { telegramId: ctx.telegramId }
        );

        if (!participant) {
            return { success: false, error: "Participant not found" };
        }

        // Get PayPlus credentials from environment
        const apiKey = process.env.PAYPLUS_API_KEY;
        const secretKey = process.env.PAYPLUS_SECRET_KEY;
        const paymentPageUid = process.env.PAYPLUS_PAGE_UID;
        const callbackUrl = process.env.PAYPLUS_CALLBACK_URL || `${process.env.CONVEX_CLOUD_URL}/payplus-callback`;

        if (!apiKey || !secretKey || !paymentPageUid) {
            console.error("PayPlus credentials not configured");
            return { success: false, error: "Payment system not configured" };
        }

        try {
            // Create payment request to PayPlus
            const response: Response = await fetch(
                "https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "api-key": apiKey,
                        "secret-key": secretKey,
                    },
                    body: JSON.stringify({
                        payment_page_uid: paymentPageUid,
                        amount: args.amount,
                        currency_code: "ILS",
                        charge_method: 1,
                        sendEmailApproval: true,
                        sendEmailFailure: false,
                        initial_invoice: true,
                        more_info: participant._id,
                        refURL_callback: callbackUrl,
                        customer: {
                            customer_name: participant.name,
                            phone: participant.phone,
                            email: participant.email || "",
                        },
                        items: [
                            {
                                name: `Tuk-Tuk Subscription - ${args.months} month(s)`,
                                quantity: 1,
                                price: args.amount,
                            },
                        ],
                    }),
                }
            );

            const data: PayPlusResponse = await response.json();

            if (data.results?.status === "success" && data.data?.payment_page_link) {
                // Log the payment attempt
                await ctx.runMutation(internal.payments.logPaymentAttempt, {
                    participantId: participant._id,
                    amount: args.amount,
                    currency: "ILS",
                });

                return {
                    success: true,
                    paymentUrl: data.data.payment_page_link,
                };
            } else {
                console.error("PayPlus error:", data);
                return {
                    success: false,
                    error: data.results?.description || "Payment link creation failed",
                };
            }
        } catch (error) {
            console.error("PayPlus API error:", error);
            return {
                success: false,
                error: "Failed to connect to payment system",
            };
        }
    },
});

// ============================================
// INTERNAL QUERIES
// ============================================

export const getParticipantByTelegramId = internalQuery({
    args: { telegramId: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("participants"),
            name: v.string(),
            phone: v.string(),
            email: v.optional(v.string()),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("participants")
            .withIndex("by_telegramId", (q) => q.eq("telegramId", args.telegramId))
            .unique();

        if (!participant) return null;

        return {
            _id: participant._id,
            name: participant.name,
            phone: participant.phone,
            email: participant.email,
        };
    },
});

// ============================================
// INTERNAL MUTATIONS
// ============================================

/**
 * Log a payment attempt
 */
export const logPaymentAttempt = internalMutation({
    args: {
        participantId: v.id("participants"),
        amount: v.number(),
        currency: currencyValidator,
    },
    returns: v.id("paymentLogs"),
    handler: async (ctx, args) => {
        return await ctx.db.insert("paymentLogs", {
            participantId: args.participantId,
            amount: args.amount,
            currency: args.currency,
            status: "Pending",
            createdAt: Date.now(),
        });
    },
});

/**
 * Process successful payment (called by webhook handler)
 */
export const processSuccessfulPayment = internalMutation({
    args: {
        participantId: v.id("participants"),
        transactionId: v.string(),
        amount: v.number(),
        months: v.number(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Update payment log
        const recentPayment = await ctx.db
            .query("paymentLogs")
            .withIndex("by_participantId", (q) =>
                q.eq("participantId", args.participantId)
            )
            .order("desc")
            .first();

        if (recentPayment && recentPayment.status === "Pending") {
            await ctx.db.patch(recentPayment._id, {
                status: "Success",
                payPlusTransactionId: args.transactionId,
            });
        } else {
            // Create new payment log
            await ctx.db.insert("paymentLogs", {
                participantId: args.participantId,
                amount: args.amount,
                currency: "ILS",
                status: "Success",
                payPlusTransactionId: args.transactionId,
                createdAt: Date.now(),
            });
        }

        // Calculate new paid until date
        const participant = await ctx.db.get(args.participantId);
        if (!participant) {
            throw new Error("Participant not found");
        }

        const now = Date.now();
        const currentPaidUntil = participant.paidUntil || now;
        const baseDate = currentPaidUntil > now ? currentPaidUntil : now;
        const newPaidUntil = baseDate + args.months * 30 * 24 * 60 * 60 * 1000;

        // Update participant
        await ctx.runMutation(internal.participants.updatePaymentInfo, {
            participantId: args.participantId,
            paidUntil: newPaidUntil,
            paymentDate: now,
        });

        return null;
    },
});

/**
 * Process failed payment
 */
export const processFailedPayment = internalMutation({
    args: {
        participantId: v.id("participants"),
        transactionId: v.optional(v.string()),
        reason: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        // Update recent pending payment
        const recentPayment = await ctx.db
            .query("paymentLogs")
            .withIndex("by_participantId", (q) =>
                q.eq("participantId", args.participantId)
            )
            .order("desc")
            .first();

        if (recentPayment && recentPayment.status === "Pending") {
            await ctx.db.patch(recentPayment._id, {
                status: "Failed",
                payPlusTransactionId: args.transactionId,
            });
        }

        return null;
    },
});
