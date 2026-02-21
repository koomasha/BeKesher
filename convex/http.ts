import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";


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
            // Extract payment details from PayPlus callback
            const status = body.transaction?.status_code;
            const transactionId = body.transaction?.uid;
            const amount = body.transaction?.amount;

            // Parse more_info: can be JSON (new format) or plain participantId (legacy)
            let participantId: Id<"participants"> | undefined;
            let seasonId: string | undefined;
            const moreInfo = body.transaction?.more_info || body.more_info;

            if (moreInfo) {
                try {
                    // PayPlus may double-escape the JSON string, so try cleaning it
                    const cleaned = typeof moreInfo === "string"
                        ? moreInfo.replace(/\\\\/g, "\\").replace(/\\"/g, '"')
                        : moreInfo;
                    const toParse = typeof cleaned === "string" ? cleaned : JSON.stringify(cleaned);
                    const parsed = JSON.parse(toParse);
                    participantId = parsed.participantId as Id<"participants">;
                    seasonId = parsed.seasonId;
                } catch (e) {
                    console.error("Failed to parse more_info:", moreInfo, e);
                    // Legacy format: plain participantId string
                    participantId = moreInfo as Id<"participants">;
                }
            }

            if (!participantId) {
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
                    months: 1,
                    seasonId,
                });
            } else {
                // Failed payment
                await ctx.runMutation(internal.payments.processFailedPayment, {
                    participantId,
                    transactionId,
                    reason: `Status code: ${status}`,
                });
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
 * Currently only handles menu_pause callback; other menu items
 * are served via the Mini App.
 */
http.route({
    path: "/telegram-webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        try {
            const update = await req.json();

            if (update.callback_query) {
                const callbackData = update.callback_query.data;
                const userId = update.callback_query.from?.id?.toString();

                if (callbackData === "menu_pause" && userId) {
                    await ctx.runMutation(internal.participants.togglePauseInternal, {
                        telegramId: userId,
                    });
                }

                return new Response(JSON.stringify({ ok: true }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
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
// AUTH: BYPASS SESSION (CI/CD/AI/Developer)
// ============================================

/**
 * POST /auth/bypass-session
 * Creates a bypass session for CI/CD/AI/developer use.
 * Requires AUTH_BYPASS_SECRET in the environment.
 *
 * Body: { secret: string, telegramId: string, source?: string }
 * Returns: { token: string, telegramId: string }
 */
http.route({
    path: "/auth/bypass-session",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
        };

        try {
            const body = await req.json();

            if (!body.secret || !body.telegramId) {
                return new Response(
                    JSON.stringify({ error: "Missing secret or telegramId" }),
                    { status: 400, headers: corsHeaders }
                );
            }

            const result = await ctx.runMutation(internal.authUser.createBypassSession, {
                secret: body.secret,
                telegramId: body.telegramId,
                source: body.source || "dev",
            });

            return new Response(
                JSON.stringify({ token: result.token, telegramId: body.telegramId }),
                { status: 200, headers: corsHeaders }
            );
        } catch (error) {
            console.error("Bypass session error:", error);
            const isAuthError = error instanceof ConvexError;
            const message = isAuthError ? String(error.data) : "Internal server error";
            return new Response(
                JSON.stringify({ error: message }),
                { status: isAuthError ? 403 : 500, headers: corsHeaders }
            );
        }
    }),
});

// CORS preflight for /auth/bypass-session
http.route({
    path: "/auth/bypass-session",
    method: "OPTIONS",
    handler: httpAction(async () => {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
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
