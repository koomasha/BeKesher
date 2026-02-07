import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// ============================================
// PAYPLUS WEBHOOK
// ============================================

/**
 * PayPlus payment callback webhook
 * Called by PayPlus when payment status changes
 */
http.route({
    path: "/payplus-callback",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        try {
            const body = await req.json();

            console.log("PayPlus callback received:", JSON.stringify(body, null, 2));

            // Extract payment details from PayPlus callback
            const status = body.transaction?.status_code;
            const transactionId = body.transaction?.uid;
            const participantId = body.more_info as Id<"participants"> | undefined;
            const amount = body.transaction?.amount;

            if (!participantId) {
                console.error("No participant ID in callback");
                return new Response(JSON.stringify({ error: "Missing participant ID" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // Status codes: 000 = success, others = failure
            if (status === "000") {
                // Successful payment
                await ctx.runMutation(internal.payments.processSuccessfulPayment, {
                    participantId,
                    transactionId: transactionId || "",
                    amount: amount || 0,
                    months: 1, // Default to 1 month, could be derived from amount
                });

                console.log(`✅ Payment successful for ${participantId}`);
            } else {
                // Failed payment
                await ctx.runMutation(internal.payments.processFailedPayment, {
                    participantId,
                    transactionId,
                    reason: `Status code: ${status}`,
                });

                console.log(`❌ Payment failed for ${participantId}: ${status}`);
            }

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("PayPlus callback error:", error);
            return new Response(
                JSON.stringify({ error: "Internal server error" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    }),
});

// ============================================
// TELEGRAM BOT WEBHOOK
// ============================================

/**
 * Telegram bot webhook for handling bot updates
 * This is optional - main UI is via Mini App
 */
http.route({
    path: "/telegram-webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        try {
            const update = await req.json();

            console.log("Telegram update received:", JSON.stringify(update, null, 2));

            // Handle callback queries (button presses in bot)
            if (update.callback_query) {
                const callbackData = update.callback_query.data;
                const chatId = update.callback_query.message?.chat?.id;
                const userId = update.callback_query.from?.id?.toString();

                console.log(`Callback: ${callbackData} from user ${userId}`);

                // Route based on callback data
                // This maps to the Make.com dispatcher logic
                switch (callbackData) {
                    case "menu_profile":
                        // Would redirect to Mini App profile page
                        break;
                    case "menu_edit":
                        // Would redirect to Mini App edit page
                        break;
                    case "menu_payment":
                        // Would redirect to Mini App payment page
                        break;
                    case "menu_pause":
                        // Toggle pause - could handle directly
                        if (userId) {
                            await ctx.runMutation(api.participants.togglePause, {
                                telegramId: userId,
                            });
                        }
                        break;
                    case "menu_support":
                        // Would prompt for support question
                        break;
                }

                // Acknowledge the callback
                return new Response(JSON.stringify({ ok: true }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // Handle regular messages
            if (update.message) {
                const text = update.message.text;
                const chatId = update.message.chat.id;

                // Handle /start command
                if (text?.startsWith("/start")) {
                    console.log(`User ${chatId} started the bot`);
                    // Would send welcome message with Mini App button
                }
            }

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Telegram webhook error:", error);
            return new Response(
                JSON.stringify({ error: "Internal server error" }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
    }),
});

// ============================================
// HEALTH CHECK
// ============================================

http.route({
    path: "/health",
    method: "GET",
    handler: httpAction(async () => {
        return new Response(
            JSON.stringify({
                status: "ok",
                timestamp: new Date().toISOString(),
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    }),
});

export default http;
