/**
 * Auth configuration for Convex.
 *
 * This configures Convex to accept JWTs from Google Identity Services.
 * When the admin frontend sends a Google credential JWT via ConvexProviderWithAuth,
 * Convex validates it against Google's OIDC discovery endpoint and populates
 * ctx.auth.getUserIdentity() with the verified identity.
 *
 * This is the "missing link" between the Google Sign-In on the frontend
 * and the adminQuery/adminMutation/adminAction wrappers that call
 * ctx.auth.getUserIdentity() to verify admin access.
 *
 * Note: Telegram user auth does NOT use this config — it uses per-request
 * HMAC-SHA256 validation of initData directly in the userQuery/userMutation wrappers.
 */
export default {
    providers: [
        {
            // Google OIDC provider for admin authentication
            domain: "https://accounts.google.com",
            applicationID: "679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com",
        },
    ],
};
