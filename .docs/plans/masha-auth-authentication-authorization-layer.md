# Feature: Authentication & Authorization Layer

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Implement a comprehensive authentication and authorization layer for BeKesher that operates in three modes:

1. **Production Mode** — Telegram Mini App `initData` HMAC-SHA256 validation for user app; Google OAuth (Identity Services) JWT for admin dashboard; secured Convex functions via custom middleware wrappers.
2. **Development Mode** — ngrok tunnel for local Telegram Mini App testing with real Telegram auth; Convex stays cloud-hosted.
3. **AI Agent / CI/CD Mode** — Auth bypass mechanism via environment variables for Playwright browser automation (without Telegram), E2E testing, and `convex-test` unit tests. Supports multi-user impersonation.

## User Story

As a **platform operator**
I want to secure all backend functions so that only authenticated users can access their own data and only verified admins can access admin functions
So that user data is protected, admin operations are gated, and the system can be tested in dev/CI environments without Telegram.

## Problem Statement

Currently, BeKesher has **zero authentication or authorization**. All Convex functions are public and accept a `telegramId` string parameter from the client without any server-side validation. Any client can call any function with any `telegramId`, accessing or modifying other users' data. The admin dashboard has no login gate. Webhooks are unauthenticated. The `initDataUnsafe` field used on the client is not cryptographically verified.

## Solution Statement

Implement a layered auth system using:
- **Telegram `initData` HMAC-SHA256 validation** on the server for user authentication (via an HTTP action that issues short-lived JWT sessions stored client-side, or per-request validation via custom function wrappers)
- **Google Identity Services OIDC** for admin authentication, with Convex's built-in `auth.config.ts` custom JWT provider support
- **Custom function wrappers** (`convex-helpers` `customQuery`/`customMutation`) that replace raw `query`/`mutation` imports, enforcing auth checks on every public function
- **Environment variable bypass** (`CONVEX_SITE_URL` check or dedicated `AUTH_BYPASS_SECRET`) for AI/CI/CD mode
- **ngrok** integration guide for dev mode Telegram testing

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: `convex/` (all function files), `apps/user/` (auth provider, initData sending), `apps/admin/` (Google login, auth provider)
**Dependencies**: `convex-helpers`, `@react-oauth/google`, `google-auth-library` (optional), Web Crypto API (built-in to Convex runtime)

### Admin Authorization — Hardcoded Email Allowlist

For the initial implementation, admin authorization uses a **hardcoded list of admin emails** in `convex/auth.ts` rather than querying an `admins` database table. This keeps things simple and avoids extra DB reads for admin checks.

**Authorized admin emails:**
- `masha@koomasha.com`
- `migdalor80@gmail.com`
- `alisazelencova8@gmail.com`
- `brookyuri@gmail.com`

The `adminQuery`/`adminMutation`/`adminAction` wrappers verify that `ctx.auth.getUserIdentity().email` is in this list. The `admins` table in the schema can still exist for storing admin profile metadata (name, picture) but is **not** used for authorization decisions.

### Google OAuth Client ID

**Client ID**: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`

This should be set as:
- `VITE_GOOGLE_CLIENT_ID` in `apps/admin/.env` (frontend)
- `GOOGLE_CLIENT_ID` in Convex environment variables (for server-side JWT verification in `auth.config.ts`)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` (lines 1-100) — Why: Contains all table definitions including `admins` table (lines 95-99) which needs schema update (replace `passwordHash` with `googleId`). Note: the `admins` table is used for profile metadata only — authorization uses a hardcoded email allowlist.
- `convex/participants.ts` (lines 1-60) — Why: Shows current function pattern using raw `query()` import + `telegramId` arg. ALL public functions across ALL files follow this pattern and need to be wrapped with auth middleware
- `convex/groups.ts` (lines 1-8) — Why: Same import pattern for `query`, `mutation`, `internalQuery`, `internalMutation`
- `convex/feedback.ts` — Why: Same pattern, needs auth wrapping
- `convex/support.ts` — Why: Same pattern, needs auth wrapping
- `convex/payments.ts` — Why: Contains PayPlus actions accessing `process.env`, needs secured endpoints
- `convex/matching.ts` — Why: Contains admin-only `runWeeklyMatchingPublic` function (line 572) that needs admin auth
- `convex/notifications.ts` (lines 11-53) — Why: Shows `internalAction` pattern with `process.env.TELEGRAM_BOT_TOKEN` — this token is also used for initData validation
- `convex/http.ts` (lines 1-185) — Why: HTTP router where new auth endpoints will be added (`/auth/telegram`, `/auth/admin/google`)
- `convex/_generated/server.d.ts` (lines 32-96) — Why: Shows the `query`, `mutation`, `action` builder types that custom wrappers will extend
- `apps/user/src/main.tsx` (lines 1-60) — Why: Current Convex client setup with `ConvexProvider` — needs to switch to `ConvexProviderWithAuth` or add auth header injection
- `apps/user/src/pages/HomePage.tsx` (lines 1-82) — Why: Shows current pattern of reading `window.Telegram.WebApp.initDataUnsafe.user` — needs to send `initData` (signed) instead
- `apps/admin/src/main.tsx` (lines 1-15) — Why: Current admin entry point — needs Google OAuth provider + `ConvexProviderWithAuth`
- `apps/admin/src/App.tsx` (lines 1-31) — Why: Admin router — needs login route + auth guard
- `convex/test.utils.ts` (lines 1-184) — Why: Test utilities — needs auth-aware test helpers
- `convex/participants.test.ts` (lines 1-50) — Why: Shows test pattern calling `t.mutation(api.participants.register, {...})` directly — tests need to be updated for new auth wrappers

### New Files to Create

- `convex/auth.ts` — Custom function wrappers (`userQuery`, `userMutation`, `userAction`, `adminQuery`, `adminMutation`, `adminAction`, `publicQuery`, `publicMutation`) + Telegram initData validation logic + hardcoded admin email allowlist + auth bypass logic
- `convex/auth.config.ts` — Convex auth configuration with Google OIDC provider for admin dashboard (if using Convex built-in JWT validation)
- `apps/admin/src/components/LoginPage.tsx` — Google Sign-In button page for admin authentication
- `apps/admin/src/hooks/useAdminAuth.ts` — Custom hook wiring Google auth state to Convex's `ConvexProviderWithAuth` interface
- `apps/user/src/hooks/useTelegramAuth.ts` — Hook managing Telegram auth flow (send initData to backend, receive session, provide to Convex)

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Custom Functions (convex-helpers)](https://stack.convex.dev/custom-functions)
  - Specific section: `customQuery`, `customMutation`, `customCtx`
  - Why: Core pattern for auth middleware wrappers
- [Convex Auth Wrappers as Middleware](https://stack.convex.dev/wrappers-as-middleware-authentication)
  - Why: Shows exact pattern for auth validation in custom wrappers
- [Convex Custom Auth Integration](https://docs.convex.dev/auth/advanced/custom-auth)
  - Specific section: Client-side `ConvexProviderWithAuth` setup
  - Why: Shows how to wire custom auth to Convex React client
- [Convex Custom JWT Provider](https://docs.convex.dev/auth/advanced/custom-jwt)
  - Specific section: `auth.config.ts` with `customJwt` provider
  - Why: For admin Google OIDC JWT validation
- [Telegram Mini App initData Validation](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
  - Why: Official docs for HMAC-SHA256 validation algorithm
- [Google Identity Services for Web](https://developers.google.com/identity/gsi/web/guides/overview)
  - Why: Admin login button integration
- [@react-oauth/google npm package](https://www.npmjs.com/package/@react-oauth/google)
  - Why: React wrapper for Google Sign-In
- [Convex Testing with convex-test](https://docs.convex.dev/testing/convex-test)
  - Specific section: Authentication / `withIdentity()`
  - Why: Shows how to mock auth identity in tests

### Patterns to Follow

**Naming Conventions:**
- Database indexes: `by_field` or `by_field1_and_field2` (existing pattern in `schema.ts`)
- Function exports: camelCase (`getByTelegramId`, `updateProfile`, etc.)
- Internal functions: prefixed with `internal` visibility via `internalQuery`/`internalMutation`
- Files: domain-based single files (`participants.ts`, `groups.ts`, `auth.ts`)

**Function Definition Pattern (current — to be replaced):**
```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myFunction = query({
    args: { telegramId: v.string() },
    returns: v.union(v.object({...}), v.null()),
    handler: async (ctx, args) => {
        // lookup by telegramId — NO AUTH CHECK
    },
});
```

**Function Definition Pattern (new — with auth wrapper):**
```typescript
import { userQuery, userMutation, userAction, adminQuery, adminAction } from "./auth";
import { v } from "convex/values";

export const myFunction = userQuery({
    args: {}, // telegramId no longer needed as arg — resolved from auth
    returns: v.union(v.object({...}), v.null()),
    handler: async (ctx, args) => {
        // ctx.participant is available — resolved by auth wrapper
        // ctx.telegramId is available
    },
});
```

**Error Handling:**
```typescript
throw new Error("Participant not found"); // existing pattern
throw new Error("Unauthenticated");       // new auth errors
throw new Error("Unauthorized: not an admin"); // new admin errors
```

**Environment Variable Access (in actions only):**
```typescript
const botToken = process.env.TELEGRAM_BOT_TOKEN;
```

**Test Pattern (current):**
```typescript
const t = setupTest();
await t.mutation(api.participants.register, { telegramId: "alice123", ... });
```

### Blueprint Alignment

- **Data Architecture**: The `admins` table in `convex/schema.ts` (line 95-99) needs modification: replace `passwordHash: v.string()` with `googleId: v.string()` and add optional `picture: v.optional(v.string())`. Add `by_googleId` index. Note: this table is for **profile metadata only** — admin authorization is determined by the hardcoded email allowlist in `convex/auth.ts`.
- **Logic Workflows**: Cron jobs in `convex/crons.ts` use `internal` functions which bypass auth — no changes needed for crons.
- **Identity Guidelines**: Not applicable (no branding changes).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Auth Infrastructure

Set up the core auth validation utilities, custom function wrappers, and schema updates. No frontend changes yet.

**Tasks:**
- Install `convex-helpers` dependency
- Update `admins` table schema for Google OAuth (profile metadata storage only)
- Create `convex/auth.ts` with:
  - Telegram `initData` HMAC-SHA256 validation function (using Web Crypto API for Convex compatibility)
  - Custom function wrappers: `userQuery`, `userMutation`, `userAction`, `adminQuery`, `adminMutation`, `adminAction`
  - Public (unauthenticated) wrappers for registration: `publicQuery`, `publicMutation`
  - Hardcoded admin email allowlist for authorization
  - Auth bypass logic for AI/CI/CD mode (check `AUTH_BYPASS_SECRET` env var)

### Phase 2: Backend Migration — Secure All Functions

Replace all `query`/`mutation` imports across backend files with appropriate auth wrappers. Remove `telegramId` from args where it's now resolved from auth context.

**Tasks:**
- Migrate `convex/participants.ts` — wrap user-facing functions with `userQuery`/`userMutation`, keep `register` as `publicMutation`
- Migrate `convex/groups.ts` — wrap with `userQuery`/`adminMutation`
- Migrate `convex/feedback.ts` — wrap with `userQuery`/`userMutation`
- Migrate `convex/support.ts` — wrap with `userQuery`/`userMutation`
- Migrate `convex/payments.ts` — keep `internalMutation` as-is, secure public-facing functions
- Migrate `convex/matching.ts` — wrap admin-triggered functions with `adminMutation`
- Add auth endpoints to `convex/http.ts`:
  - `POST /auth/telegram` — validate initData, return session JWT (or just validate per-request)
  - Health check stays public

### Phase 3: Frontend Integration — User App (Telegram)

Wire the Telegram Mini App to send `initData` for authentication.

**Tasks:**
- Create `apps/user/src/hooks/useTelegramAuth.ts` — hook that reads `window.Telegram.WebApp.initData` and provides it for Convex calls
- Update `apps/user/src/main.tsx` — integrate auth mechanism (either `ConvexProviderWithAuth` or a context provider that injects initData)
- Update all pages to remove manual `telegramId` extraction — use auth context instead
- Handle "not in Telegram" state gracefully (show message to open from Telegram)

### Phase 4: Frontend Integration — Admin Dashboard (Google OAuth)

Implement admin login with Google Sign-In.

**Tasks:**
- Install `@react-oauth/google` in `apps/admin`
- Create `convex/auth.config.ts` for Google OIDC JWT validation (if using Convex built-in JWT)
- Create `apps/admin/src/components/LoginPage.tsx` with Google Sign-In button
- Create `apps/admin/src/hooks/useAdminAuth.ts` — wire Google token to `ConvexProviderWithAuth`
- Update `apps/admin/src/main.tsx` — wrap with `GoogleOAuthProvider` + `ConvexProviderWithAuth`
- Update `apps/admin/src/App.tsx` — add login route, auth guard on all admin routes
- Admin verification is handled by the hardcoded email allowlist — no need for seeding or DB-based admin CRUD. The `admins` table is only for optional profile metadata (name, picture from Google profile).

### Phase 5: Dev Mode — ngrok Setup

Document and configure development workflow for Telegram testing.

**Tasks:**
- Add ngrok configuration notes to README or `.docs/`
- Update `apps/user/vite.config.ts` to support ngrok-friendly settings
- Document static ngrok domain registration with BotFather

### Phase 6: AI/CI/CD Mode — Auth Bypass

Implement auth bypass for testing and automated pipelines.

**Tasks:**
- Add `AUTH_BYPASS_SECRET` environment variable support to `convex/auth.ts` bypass logic
- For `convex-test` unit tests: update `test.utils.ts` to provide `withIdentity()` helpers or mock initData generation
- For Playwright E2E: create helper that mocks `window.Telegram.WebApp` via `addInitScript()`
- Support multi-user testing: bypass accepts arbitrary `telegramId` when secret matches
- Update existing test files to work with new auth wrappers

### Phase 7: Testing & Validation

Ensure all auth flows work correctly.

**Tasks:**
- Write unit tests for `convex/auth.ts` (initData validation, bypass, admin verification)
- Update all existing test files to pass auth when calling wrapped functions
- Test Google OAuth login flow manually
- Test Telegram initData flow manually (via ngrok)
- Verify AI/CI/CD bypass works with Playwright

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: ADD `convex-helpers` dependency

- **IMPLEMENT**: Install `convex-helpers` package at root workspace level
- **IMPORTS**: This provides `customQuery`, `customMutation`, `customCtx` from `convex-helpers/server/customFunctions`
- **VALIDATE**: `npm ls convex-helpers`

### Task 2: UPDATE `convex/schema.ts` — Modify admins table

- **IMPLEMENT**: Replace `passwordHash: v.string()` with `googleId: v.string()` and add `picture: v.optional(v.string())`. Add `by_googleId` index. This table stores admin **profile metadata only** — authorization is handled by the hardcoded email allowlist in `convex/auth.ts`.
- **PATTERN**: Follow existing index naming: `by_email`, `by_googleId`
- **GOTCHA**: This is a schema change — if there's existing admin data with `passwordHash`, it needs migration. Since there are no admins in the database yet, this is safe.
- **VALIDATE**: `npx convex dev` should accept the schema change without errors

**New schema:**
```typescript
admins: defineTable({
    email: v.string(),
    googleId: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
}).index("by_email", ["email"])
  .index("by_googleId", ["googleId"]),
```

### Task 3: CREATE `convex/auth.ts` — Core auth module

- **IMPLEMENT**: Create the central auth module with:
  1. `validateTelegramInitData(initData: string, botToken: string): { valid: boolean; user?: TelegramUser }` — Uses Web Crypto API (`crypto.subtle`) for HMAC-SHA256 validation
  2. `userQuery` / `userMutation` / `userAction` — Custom wrappers using `convex-helpers` `customQuery`/`customMutation`/`customAction`. These validate the authenticated identity and add `ctx.participant` and `ctx.telegramId` to the context.
  3. `adminQuery` / `adminMutation` / `adminAction` — Custom wrappers that verify the caller's email is in the **hardcoded admin email allowlist** (via `ctx.auth.getUserIdentity()` + email check against `ADMIN_EMAILS` constant). **No database lookup needed.**
  4. `publicQuery` / `publicMutation` — Unwrapped (or minimally wrapped) for unauthenticated endpoints like user registration.
  5. Auth bypass: When `process.env.AUTH_BYPASS_SECRET` is set and the client provides a matching secret, skip validation and use the provided identity directly.
  6. **Hardcoded admin email allowlist constant**:
     ```typescript
     const ADMIN_EMAILS = [
       "masha@koomasha.com",
       "migdalor80@gmail.com",
       "alisazelencova8@gmail.com",
       "brookyuri@gmail.com",
     ] as const;
     
     function isAdmin(email: string): boolean {
       return ADMIN_EMAILS.includes(email as any);
     }
     ```
  7. **Action helper functions**: `userAction` and `adminAction` wrappers follow the same pattern as their query/mutation counterparts but are built on top of `customAction` (or wrap `action` from `_generated/server`). Actions CAN access `process.env`, so the auth bypass check can read the env var directly. The wrappers should:
     - Validate identity via `ctx.auth.getUserIdentity()`
     - For `userAction`: resolve `ctx.telegramId` from identity, optionally resolve `ctx.participant` via an internal query
     - For `adminAction`: verify identity email is in `ADMIN_EMAILS`
- **PATTERN**: Mirror `convex/_generated/server.d.ts` builder types. Use `customQuery(query, ...)` from `convex-helpers`.
- **IMPORTS**: `import { query, mutation, action } from "./_generated/server"; import { customQuery, customMutation, customCtx } from "convex-helpers/server/customFunctions"; import { v } from "convex/values";`
- **GOTCHA**: Convex queries/mutations **cannot** access `process.env` — only actions can. For Telegram initData validation inside queries/mutations, the auth approach works through Convex's identity system (`ctx.auth.getUserIdentity()`), NOT direct env var access.
- **APPROACH (JWT — definitive)**: HTTP action validates initData → issues JWT → Convex verifies JWT via `auth.config.ts` → `ctx.auth.getUserIdentity()` works in all function types (queries, mutations, AND actions). This is the chosen approach because:
  - `ctx.auth.getUserIdentity()` is a zero-cost built-in Convex feature
  - No extra DB reads per request
  - Same mechanism works for both admin (Google JWT) and user (custom JWT)
  - `convex-test`'s `withIdentity()` works seamlessly
- **VALIDATE**: `npx tsc --noEmit` should pass

### Task 4: CREATE `convex/auth.config.ts` — Convex auth providers

- **IMPLEMENT**: Configure Convex's built-in auth with providers:
  1. Google OIDC provider (for admin dashboard) — Client ID: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`
  2. Custom JWT provider (for Telegram auth — your own JWT issuer from the HTTP action)
- **GOTCHA**: When using your own JWT issuer for Telegram auth, you need to generate and serve a JWKS endpoint, OR use a symmetric secret approach. Convex supports `RS256` and `ES256` only for custom JWT. You may need to use a third-party JWT library in the action.
- **VALIDATE**: `npx convex dev` should recognize the auth config

### Task 5: CREATE auth HTTP endpoints in `convex/http.ts`

- **IMPLEMENT**: Add new routes:
  1. `POST /auth/telegram` — Receives `initData` in request body, validates HMAC-SHA256 using `TELEGRAM_BOT_TOKEN`, returns a session token or JWT
  2. Optionally: `POST /auth/admin/verify` — For additional admin verification
- **PATTERN**: Follow existing `httpAction` pattern in `convex/http.ts` (lines 16-76)
- **IMPORTS**: `import { httpAction } from "./_generated/server";`
- **GOTCHA**: HTTP actions CAN access `process.env`, so Telegram initData validation works here. This is where the bot token is available.
- **VALIDATE**: `npx convex dev` — endpoint should be registered

### Task 6: UPDATE `convex/participants.ts` — Apply auth wrappers

- **IMPLEMENT**: 
  - Replace `import { query, mutation } from "./_generated/server"` with imports from `./auth`
  - User-facing queries (`getByTelegramId`, `getMyProfile`, etc.) → `userQuery` — remove `telegramId` from args, use `ctx.telegramId` or `ctx.participant`
  - `register` → stays `publicMutation` (user not authenticated yet during registration, but still needs initData validation for telegramId extraction)
  - Internal functions (`internalQuery`, `internalMutation`) → keep as-is (internal functions are already system-only)
  - Admin-facing functions (like `listAll`, status changes) → `adminMutation`
- **PATTERN**: See "Function Definition Pattern (new)" in Patterns section above
- **GOTCHA**: All pages that currently pass `telegramId` as a query arg will need to be updated. The `returns` validators should remain the same — only `args` and handler context change.
- **VALIDATE**: `npx tsc --noEmit`

### Task 7: UPDATE `convex/groups.ts` — Apply auth wrappers

- **IMPLEMENT**: Same pattern as Task 6. User queries → `userQuery`, admin operations → `adminMutation`, internals stay as-is.
- **VALIDATE**: `npx tsc --noEmit`

### Task 8: UPDATE `convex/feedback.ts` — Apply auth wrappers

- **IMPLEMENT**: Same pattern. `submitFeedback` → `userMutation`, feedback queries → `userQuery`.
- **VALIDATE**: `npx tsc --noEmit`

### Task 9: UPDATE `convex/support.ts` — Apply auth wrappers

- **IMPLEMENT**: Same pattern. User ticket creation/viewing → `userQuery`/`userMutation`. Admin answer/close → `adminMutation`.
- **VALIDATE**: `npx tsc --noEmit`

### Task 10: UPDATE `convex/payments.ts` — Apply auth wrappers

- **IMPLEMENT**: Public payment initiation → `userMutation` or `userAction`. Internal processing stays as-is.
- **VALIDATE**: `npx tsc --noEmit`

### Task 11: UPDATE `convex/matching.ts` — Apply admin auth

- **IMPLEMENT**: `runWeeklyMatchingPublic` (line 572) → `adminMutation` or `adminAction`. All other matching internals stay as-is (called by crons).
- **VALIDATE**: `npx tsc --noEmit`

### Task 12: ADD `@react-oauth/google` to admin app

- **IMPLEMENT**: Install in `apps/admin`: `npm install @react-oauth/google`
- **VALIDATE**: `npm ls @react-oauth/google`

### Task 13: CREATE `apps/admin/src/components/LoginPage.tsx`

- **IMPLEMENT**: Create a login page with:
  - Centered card layout with BeKesher branding
  - `<GoogleLogin>` component from `@react-oauth/google`
  - Success handler that stores the credential JWT
  - Error handling for failed login
- **PATTERN**: Follow existing page styling from admin pages
- **VALIDATE**: `cd apps/admin && npm run build`

### Task 14: CREATE `apps/admin/src/hooks/useAdminAuth.ts`

- **IMPLEMENT**: Create a hook that:
  - Manages Google auth state (token, isLoading, isAuthenticated)
  - Implements the `useAuth` interface expected by `ConvexProviderWithAuth`: `{ isLoading, isAuthenticated, fetchAccessToken }`
  - `fetchAccessToken` returns the Google ID token (credential JWT)
  - Persists login state in localStorage for session survival
- **PATTERN**: Follow Convex docs on custom auth integration
- **VALIDATE**: TypeScript compiles without errors

### Task 15: UPDATE `apps/admin/src/main.tsx` — Wire Google OAuth

- **IMPLEMENT**: 
  - Wrap with `GoogleOAuthProvider` from `@react-oauth/google`
  - Replace `ConvexProvider` with `ConvexProviderWithAuth` using the custom `useAdminAuth` hook
  - Add `VITE_GOOGLE_CLIENT_ID` env var usage (value: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`)
- **IMPORTS**: `import { GoogleOAuthProvider } from '@react-oauth/google'; import { ConvexProviderWithAuth } from 'convex/react';`
- **VALIDATE**: `cd apps/admin && npm run build`

### Task 16: UPDATE `apps/admin/src/App.tsx` — Add auth guard + login route

- **IMPLEMENT**:
  - Add `/login` route → `LoginPage`
  - Wrap all other routes in an auth guard component that redirects to `/login` if not authenticated
  - Use `useConvexAuth()` from `convex/react` to check auth state
- **VALIDATE**: `cd apps/admin && npm run build`

### Task 17: CREATE `apps/user/src/hooks/useTelegramAuth.ts`

- **IMPLEMENT**: Create a hook that:
  - Reads `window.Telegram.WebApp.initData` (the signed string, NOT `initDataUnsafe`)
  - Calls the `/auth/telegram` HTTP endpoint to validate and get a session token
  - Provides the token to Convex via `ConvexProviderWithAuth`'s `fetchAccessToken`
  - Handles "not in Telegram" state (initData empty)
  - For AI/CI/CD mode: checks for a `VITE_AUTH_BYPASS_TOKEN` env var and uses it instead
- **VALIDATE**: TypeScript compiles without errors

### Task 18: UPDATE `apps/user/src/main.tsx` — Wire Telegram auth

- **IMPLEMENT**:
  - Replace `ConvexProvider` with `ConvexProviderWithAuth` using `useTelegramAuth` hook
  - Keep Telegram WebApp initialization (`ready()`, `expand()`)
- **VALIDATE**: `cd apps/user && npm run build`

### Task 19: UPDATE user app pages — Remove manual telegramId extraction

- **IMPLEMENT**: Update all pages that currently do:
  ```typescript
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramId = telegramUser?.id?.toString() || '';
  ```
  Remove this pattern. The telegramId is now resolved server-side from auth. Queries/mutations no longer need `telegramId` as an argument (it comes from `ctx.participant` in the wrapper).
  
  Pages to update:
  - `apps/user/src/pages/HomePage.tsx` (line 7-8)
  - `apps/user/src/pages/GroupsPage.tsx` (line 6)
  - `apps/user/src/pages/SupportPage.tsx` (line 7)
  - `apps/user/src/pages/FeedbackPage.tsx` (line 104)
  - `apps/user/src/pages/OnboardingPage.tsx` (line 144) — this one is special: registration happens before auth, may still need initData
  - `apps/user/src/pages/ProfilePage.tsx`
- **GOTCHA**: Some pages use `telegramUser?.first_name` for display — this can come from a new `useCurrentUser()` hook or from the participant object returned by queries.
- **VALIDATE**: `cd apps/user && npm run build`

### Task 20: UPDATE `convex/test.utils.ts` — Auth-aware test helpers

- **IMPLEMENT**: Add helpers for auth in tests:
  - `withUserIdentity(t, telegramId)` — returns a test client with Telegram user identity (using `t.withIdentity()` or by setting up bypass)
  - `withAdminIdentity(t, email)` — returns a test client with admin identity
  - Update `setupTest()` if needed to configure auth bypass for test environment
- **PATTERN**: Use `convex-test`'s built-in `withIdentity()` method
- **VALIDATE**: `npm run test:once`

### Task 21: UPDATE existing test files — Pass auth identity

- **IMPLEMENT**: Update all test files to use auth identities when calling wrapped functions:
  - `convex/participants.test.ts`
  - `convex/groups.test.ts`
  - `convex/feedback.test.ts`
  - `convex/support.test.ts`
  - `convex/payments.test.ts`
  - `convex/matching.test.ts`
  - `convex/http.test.ts`
  - `convex/crons.test.ts`
- **PATTERN**: 
  ```typescript
  const t = setupTest();
  const asUser = t.withIdentity({ subject: "alice123", issuer: "telegram" });
  await asUser.mutation(api.participants.register, { ... });
  ```
- **VALIDATE**: `npm run test:once` — all tests pass

### Task 22: ADD environment variables documentation

- **IMPLEMENT**: Update `.env.example` with new env vars:
  - `TELEGRAM_BOT_TOKEN` — already exists, now also used for initData validation
  - `AUTH_BYPASS_SECRET` — secret for AI/CI/CD bypass mode (e.g., a random UUID)
  - `VITE_GOOGLE_CLIENT_ID=679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com` — Google OAuth client ID for admin dashboard
  - `VITE_AUTH_BYPASS_TOKEN` — for frontend bypass in AI/CI/CD mode
  - `GOOGLE_CLIENT_ID=679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com` — for server-side Google JWT verification (Convex env var)
- **VALIDATE**: File exists and contains all variables with descriptions

### Task 23: ADD Playwright auth helpers (AI/CI/CD mode)

- **IMPLEMENT**: Create a Playwright helper file (or document the pattern) for:
  - Mocking `window.Telegram.WebApp` with valid-looking data + bypass token
  - Admin login bypass
  - Multi-user testing by switching mock identities
- **PATTERN**:
  ```typescript
  await page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        ready: () => {},
        expand: () => {},
        initData: "__BYPASS__",
        initDataUnsafe: {
          user: { id: 12345, first_name: "Test", last_name: "User" },
        },
        // ... other required fields
      },
    };
  });
  ```
- **VALIDATE**: Pattern documented and runnable

---

## TESTING STRATEGY

### Unit Tests

Based on existing Vitest + `convex-test` pattern in the project:

- **`convex/auth.test.ts`** (NEW):
  - Test `validateTelegramInitData` with valid and invalid data
  - Test auth bypass when `AUTH_BYPASS_SECRET` matches
  - Test auth rejection when bypass secret doesn't match
  - Test `userQuery` wrapper rejects unauthenticated calls
  - Test `adminQuery` wrapper rejects non-admin users
  - Test `adminQuery` wrapper allows verified admins

- **Update existing tests**:
  - All existing test files need `withIdentity()` or bypass configuration
  - Verify that existing test assertions still pass after auth migration

### Integration Tests

- Test full Telegram auth flow: initData → HTTP action → session → query with session
- Test full Google OAuth flow: Google JWT → Convex auth → admin query succeeds
- Test auth bypass flow: bypass secret → query with arbitrary identity

### Edge Cases

- Expired Telegram initData (check `auth_date` is within acceptable window)
- Invalid HMAC signature (tampered initData)
- Valid Telegram auth but participant not found (new user, not yet registered)
- Admin with valid Google auth but email not in hardcoded admin allowlist
- Concurrent requests with same auth token
- Missing `initData` (app opened outside Telegram)
- Empty `AUTH_BYPASS_SECRET` in production (bypass disabled)
- Token refresh flow (expired JWT, needs new one)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
cd apps/user && npm run lint
cd apps/admin && npm run lint
npx tsc --noEmit
```

### Level 2: Unit Tests

```bash
npm run test:once
```

### Level 3: Integration Tests

```bash
npm run test:once -- --reporter=verbose
```

### Level 4: Manual Validation

1. **Telegram User Auth**: 
   - Start ngrok: `ngrok http 5173 --domain=your-domain.ngrok-free.app`
   - Open Mini App from Telegram
   - Verify initData is sent and validated
   - Verify user sees their profile (not someone else's)

2. **Admin Google Auth**:
   - Start admin dev server: `npm run dev:admin`
   - Navigate to `http://localhost:5174`
   - Verify redirect to login page
   - Click Google Sign-In, verify login
   - Verify admin pages load with data

3. **Auth Bypass (AI/CI/CD)**:
   - Set `AUTH_BYPASS_SECRET` in Convex env vars
   - Set `VITE_AUTH_BYPASS_TOKEN` in frontend env
   - Open user app in browser (without Telegram)
   - Verify bypass activates and user can interact

4. **Security Validation**:
   - Try calling a `userQuery` from browser console without auth → should fail
   - Try calling an `adminMutation` from user app → should fail
   - Try passing another user's `telegramId` → should be ignored (server resolves from auth)

### Level 5: Additional Validation

```bash
npm run test:coverage  # Verify coverage doesn't drop
npx convex dev         # Verify Convex accepts all changes
```

---

## ACCEPTANCE CRITERIA

- [ ] All Convex public functions require authentication (no unauthenticated access to user data)
- [ ] Telegram `initData` is validated server-side using HMAC-SHA256 with the bot token
- [ ] Admin dashboard requires Google Sign-In and verifies email against hardcoded admin email allowlist (`masha@koomasha.com`, `migdalor80@gmail.com`, `alisazelencova8@gmail.com`, `brookyuri@gmail.com`)
- [ ] Custom function wrappers (`userQuery`, `userMutation`, `userAction`, `adminQuery`, `adminMutation`, `adminAction`) are used consistently across all backend files
- [ ] `telegramId` is no longer passed as a client argument — resolved from authenticated identity
- [ ] Auth bypass works via environment variable for AI agents and CI/CD pipelines
- [ ] Multiple users can be impersonated in tests via `withIdentity()` or bypass mechanism
- [ ] All existing tests pass after migration (zero regressions)
- [ ] New auth tests achieve 80%+ coverage of auth module
- [ ] Admin `passwordHash` field is replaced with `googleId` in schema
- [ ] Dev mode with ngrok is documented and functional
- [ ] No linting or type checking errors
- [ ] Internal functions and cron jobs are unaffected (they bypass auth by design)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (unit + integration)
- [ ] No linting or type checking errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met
- [ ] Code reviewed for quality and maintainability

---

## NOTES

### Critical Architecture Decision: How Telegram Auth Reaches Queries/Mutations

The most important architectural constraint is that **Convex queries and mutations cannot access `process.env`** — only actions and HTTP actions can. This means Telegram initData validation CANNOT happen inside a `customQuery`/`customMutation` wrapper directly (since the bot token is needed from env vars).

**Chosen approach (JWT via `auth.config.ts`):**
1. Frontend sends `initData` to `POST /auth/telegram` HTTP action
2. HTTP action validates initData using bot token from `process.env.TELEGRAM_BOT_TOKEN`
3. HTTP action issues a short-lived JWT with the user's `telegramId` as the `subject` claim
4. Frontend stores the JWT and provides it to Convex via `ConvexProviderWithAuth`'s `fetchAccessToken`
5. Convex verifies the JWT via the custom JWT provider configured in `auth.config.ts`
6. Custom wrappers call `ctx.auth.getUserIdentity()` which Convex populates from the verified JWT
7. Wrapper resolves participant from the identity's `subject` (telegramId)

**Why JWT (not sessions table):**
- `ctx.auth.getUserIdentity()` is a zero-cost built-in Convex feature — no DB reads per request
- Same mechanism works for both admin (Google JWT) and user (custom JWT)
- `convex-test`'s `withIdentity()` works seamlessly with this approach
- No need for a `sessions` table, session cleanup crons, or extra DB queries in every wrapper

### Auth Bypass Design for AI/CI/CD

The bypass mechanism should be **secure** even in production:
- `AUTH_BYPASS_SECRET` env var is only set in dev/test Convex deployments
- If `AUTH_BYPASS_SECRET` is empty or unset, bypass is completely disabled
- The bypass works by accepting a special header or argument: `X-Auth-Bypass: <secret>:<telegramId>`
- This allows AI agents and Playwright to authenticate as any user without Telegram
- In `convex-test`, `withIdentity()` is the native bypass — no env var needed

### Schema Migration Consideration

The `admins` table currently has `passwordHash` which will change to `googleId`. Since there are no admins in the database yet (no admin auth was ever implemented), this is a non-breaking schema change. The `admins` table now serves as **optional profile metadata storage** (name, picture from Google profile). Admin authorization is determined by the hardcoded email allowlist — no seeding required.

### Action Helper Functions

`userAction` and `adminAction` are essential wrappers alongside the query/mutation wrappers. Actions differ from queries/mutations in that they **can** access `process.env` directly, but the auth pattern should remain consistent:

- **`userAction`**: Validates identity via `ctx.auth.getUserIdentity()`, resolves `ctx.telegramId` from `identity.subject`. Optionally fetches `ctx.participant` via an internal query (since actions cannot read the DB directly). Falls back to auth bypass if `AUTH_BYPASS_SECRET` matches.
- **`adminAction`**: Validates identity, checks email against `ADMIN_EMAILS` hardcoded list. Used for admin operations that need `process.env` access (e.g., calling external APIs, sending notifications).

Both follow the same `customAction` pattern from `convex-helpers`:
```typescript
export const adminAction = customAction(action, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email || !isAdmin(identity.email)) {
      throw new Error("Unauthorized: not an admin");
    }
    return { ctx: { ...ctx, adminEmail: identity.email }, args };
  },
});
```

### Webhook Security (Future Enhancement)

PayPlus webhook (`/payplus-callback`) and Telegram webhook (`/telegram-webhook`) currently have no signature validation. This should be addressed as a follow-up:
- PayPlus: Verify request signature using `PAYPLUS_SECRET_KEY`
- Telegram: Verify `X-Telegram-Bot-Api-Secret-Token` header

### Dependency on `convex-helpers`

The `convex-helpers` package is maintained by the Convex team and is the official recommended approach for custom function wrappers. It provides type-safe `customQuery`, `customMutation`, and `customCtx` utilities. Current latest version should be installed.

### Google OAuth Setup Prerequisites

Google Cloud project is already set up with OAuth credentials:
- **Client ID**: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`
- Ensure authorized JavaScript origins include: `http://localhost:5174` (dev) and the production URL
- Ensure authorized redirect URIs are configured if needed
- Set `VITE_GOOGLE_CLIENT_ID` in `apps/admin/.env` and `GOOGLE_CLIENT_ID` in Convex env vars
