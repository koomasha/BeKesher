import { customQuery, customMutation, customAction } from "convex-helpers/server/customFunctions";
import { query, mutation, action } from "./_generated/server";
import { ConvexError } from "convex/values";

// ============================================
// ADMIN EMAIL ALLOWLIST
// ============================================

/**
 * Hardcoded list of authorized admin emails.
 * Admin authorization is determined by this list, NOT by the admins table.
 * The admins table stores profile metadata only.
 */
const ADMIN_EMAILS: readonly string[] = [
    "masha@koomasha.com",
    "migdalor80@gmail.com",
    "brookyuri@gmail.com",
] as const;

/**
 * Check if an email is in the admin allowlist.
 */
export function isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// CUSTOM FUNCTION WRAPPERS — ADMIN
// ============================================

/**
 * adminQuery — Authenticated query for admin users.
 * Validates that the authenticated user's email is in the admin allowlist.
 * Uses Google OIDC identity from ctx.auth.getUserIdentity().
 * Injects `ctx.adminEmail` into the context.
 */
export const adminQuery = customQuery(query, {
    args: {},
    input: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new ConvexError("Admin authentication required");
        }
        if (!isAdminEmail(identity.email)) {
            throw new ConvexError("Unauthorized: not an admin");
        }
        return { ctx: { ...ctx, adminEmail: identity.email }, args };
    },
});

/**
 * adminMutation — Authenticated mutation for admin users.
 * Same admin auth pattern as adminQuery.
 */
export const adminMutation = customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new ConvexError("Admin authentication required");
        }
        if (!isAdminEmail(identity.email)) {
            throw new ConvexError("Unauthorized: not an admin");
        }
        return { ctx: { ...ctx, adminEmail: identity.email }, args };
    },
});

/**
 * adminAction — Authenticated action for admin users.
 * Same admin auth pattern.
 */
export const adminAction = customAction(action, {
    args: {},
    input: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new ConvexError("Admin authentication required");
        }
        if (!isAdminEmail(identity.email)) {
            throw new ConvexError("Unauthorized: not an admin");
        }
        return { ctx: { ...ctx, adminEmail: identity.email }, args };
    },
});

// ============================================
// ADMIN IDENTITY
// ============================================

/**
 * getAdminIdentity
 * Returns the authenticated admin's identity (email, name, picture)
 * if they are logged in and authorized. Returns null otherwise.
 * Used by the frontend to determine authentication state.
 */
/**
 * getAdminIdentity
 * Returns the authenticated user's identity and authorization state.
 * safe for use by unauthenticated clients (returns null).
 */
export const getAdminIdentity = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return {
            email: identity.email!,
            name: identity.name,
            picture: identity.pictureUrl,
            isAuthorized: identity.email ? isAdminEmail(identity.email) : false,
        };
    },
});


