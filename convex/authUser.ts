import { customQuery, customMutation, customAction } from "convex-helpers/server/customFunctions";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";

// ============================================
// TELEGRAM TOKEN HMAC-SHA256 VALIDATION
// ============================================

/**
 * Validate Telegram telegramToken using HMAC-SHA256.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Runs inside query/mutation wrappers. The bot token is read from
 * process.env.TELEGRAM_BOT_TOKEN (accessible in Convex queries/mutations).
 * HMAC is deterministic, so no Convex runtime restrictions apply.
 *
 * @param telegramToken - The raw telegramToken string from Telegram WebApp
 * @param botToken - The bot token for HMAC validation
 * @returns The telegramId if valid, null otherwise
 */
export async function validateTelegramToken(
    telegramToken: string,
    botToken: string
): Promise<string | null> {
    try {
        const params = new URLSearchParams(telegramToken);
        const hash = params.get("hash");
        if (!hash) return null;

        // Remove hash from params and sort alphabetically
        params.delete("hash");
        const sortedParams = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        // Create secret key: HMAC-SHA256 of bot token with "WebAppData" as key
        const encoder = new TextEncoder();
        const secretKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode("WebAppData"),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const secretHash = await crypto.subtle.sign("HMAC", secretKey, encoder.encode(botToken));

        // Create data check: HMAC-SHA256 of sorted params with secret key
        const dataKey = await crypto.subtle.importKey(
            "raw",
            secretHash,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const dataHash = await crypto.subtle.sign("HMAC", dataKey, encoder.encode(sortedParams));

        // Compare hashes
        const computedHash = Array.from(new Uint8Array(dataHash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        if (computedHash !== hash) {
            return null;
        }

        // Parse user data
        const userStr = params.get("user");
        if (!userStr) return null;

        const user = JSON.parse(userStr);
        return String(user.id);
    } catch {
        return null;
    }
}

// ============================================
// AUTH RESOLUTION
// ============================================

/**
 * Resolve telegramId from either telegramToken (production) or sessionToken (CI/CD/AI).
 *
 * Priority:
 *   1. telegramToken provided → validate HMAC → extract telegramId
 *   2. sessionToken provided → requires AUTH_BYPASS_SECRET → lookup in sessions table
 *   3. Neither → throw "Authentication required"
 *
 * In production, AUTH_BYPASS_SECRET is not set, so session auth is rejected
 * at resolution time (not just at creation time).
 */
async function resolveTelegramToken(telegramToken: string): Promise<string> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        throw new ConvexError("Server configuration error: TELEGRAM_BOT_TOKEN not set");
    }

    const telegramId = await validateTelegramToken(telegramToken, botToken);
    if (!telegramId) {
        throw new ConvexError("Invalid Telegram token");
    }

    return telegramId;
}

async function resolveSessionFromDb(
    ctx: { db: QueryCtx["db"] },
    sessionToken: string
): Promise<string> {
    if (!process.env.AUTH_BYPASS_SECRET) {
        throw new ConvexError("Session auth is not enabled in this environment");
    }

    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", sessionToken))
        .unique();

    if (!session) {
        throw new ConvexError("Invalid session token");
    }

    if (session.expiresAt < Date.now()) {
        throw new ConvexError("Session expired");
    }

    return session.telegramId;
}

async function resolveUserAuth(
    ctx: { db: QueryCtx["db"] },
    authArgs: { telegramToken?: string; sessionToken?: string }
): Promise<string> {
    if (authArgs.telegramToken) {
        return resolveTelegramToken(authArgs.telegramToken);
    }

    if (authArgs.sessionToken) {
        return resolveSessionFromDb(ctx, authArgs.sessionToken);
    }

    throw new ConvexError("Authentication required: provide telegramToken or sessionToken");
}

// ============================================
// CUSTOM FUNCTION WRAPPERS — USER
// ============================================

/**
 * userQuery — Authenticated query for regular Telegram users.
 *
 * Consumes `telegramToken` or `sessionToken` from args, validates auth,
 * injects `ctx.telegramId`, strips auth args from handler args.
 *
 * Usage:
 *   export const myQuery = userQuery({
 *       args: { someArg: v.string() },
 *       handler: async (ctx, args) => {
 *           // ctx.telegramId is available
 *           // args.someArg is available (telegramToken/sessionToken stripped)
 *       },
 *   });
 */
export const userQuery = customQuery(query, {
    args: {
        telegramToken: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    input: async (ctx, { telegramToken, sessionToken }) => {
        const telegramId = await resolveUserAuth(ctx, { telegramToken, sessionToken });
        return { ctx: { ...ctx, telegramId }, args: {} };
    },
});

/**
 * userMutation — Authenticated mutation for regular Telegram users.
 * Same auth pattern as userQuery.
 */
export const userMutation = customMutation(mutation, {
    args: {
        telegramToken: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    input: async (ctx, { telegramToken, sessionToken }) => {
        const telegramId = await resolveUserAuth(ctx, { telegramToken, sessionToken });
        return { ctx: { ...ctx, telegramId }, args: {} };
    },
});

/**
 * userAction — Authenticated action for regular Telegram users.
 * Same auth pattern, but actions can't query DB directly.
 * For session token auth, resolves telegramId via an internal query.
 */
export const userAction = customAction(action, {
    args: {
        telegramToken: v.optional(v.string()),
        sessionToken: v.optional(v.string()),
    },
    input: async (ctx, { telegramToken, sessionToken }) => {
        if (telegramToken) {
            const telegramId = await resolveTelegramToken(telegramToken);
            return { ctx: { ...ctx, telegramId }, args: {} };
        }

        if (sessionToken) {
            if (!process.env.AUTH_BYPASS_SECRET) {
                throw new ConvexError("Session auth is not enabled in this environment");
            }
            const result = await ctx.runQuery(internal.authUser.resolveSessionToken, {
                token: sessionToken,
            });
            if (!result) {
                throw new ConvexError("Invalid or expired session token");
            }
            return { ctx: { ...ctx, telegramId: result }, args: {} };
        }

        throw new ConvexError("Authentication required: provide telegramToken or sessionToken");
    },
});

// ============================================
// CUSTOM FUNCTION WRAPPERS — PUBLIC
// ============================================

/**
 * publicQuery — No authentication required.
 * Use for endpoints that should be accessible to anyone.
 */
export const publicQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        return { ctx, args };
    },
});

/**
 * publicMutation — No authentication required.
 * Use for unauthenticated endpoints like registration.
 * Registration still receives telegramToken for telegramId extraction.
 */
export const publicMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        return { ctx, args };
    },
});

// ============================================
// SESSION MANAGEMENT (CI/CD/AI bypass)
// ============================================

/**
 * Internal query to resolve a session token to a telegramId.
 * Used by userAction wrapper which can't access ctx.db directly.
 */
export const resolveSessionToken = internalQuery({
    args: { token: v.string() },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query("sessions")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!session) return null;
        if (session.expiresAt < Date.now()) return null;

        return session.telegramId;
    },
});

/**
 * Create a bypass session for CI/CD/AI/developer use.
 * Requires AUTH_BYPASS_SECRET to be set in the environment.
 *
 * Usage:
 *   POST with { secret: "your-bypass-secret", telegramId: "12345", source: "ai" }
 *   Returns: { token: "uuid-session-token" }
 */
export const createBypassSession = internalMutation({
    args: {
        secret: v.string(),
        telegramId: v.string(),
        source: v.optional(v.string()),
    },
    returns: v.object({ token: v.string() }),
    handler: async (ctx, args) => {
        const bypassSecret = process.env.AUTH_BYPASS_SECRET;
        if (!bypassSecret) {
            throw new ConvexError("Auth bypass is not enabled in this environment");
        }

        if (args.secret !== bypassSecret) {
            throw new ConvexError("Invalid bypass secret");
        }

        // Generate a simple token (UUID-like)
        const token = generateToken();

        // Create session with 24-hour expiry
        await ctx.db.insert("sessions", {
            telegramId: args.telegramId,
            token,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            source: args.source || "dev",
        });

        return { token };
    },
});

/**
 * Clean up expired sessions. Can be called by a cron job.
 */
export const cleanupExpiredSessions = internalMutation({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const now = Date.now();
        const expired = await ctx.db
            .query("sessions")
            .filter((q) => q.lt(q.field("expiresAt"), now))
            .collect();

        for (const session of expired) {
            await ctx.db.delete(session._id);
        }

        return expired.length;
    },
});

// ============================================
// UTILITY
// ============================================

function generateToken(): string {
    return crypto.randomUUID();
}
