# Feature: Authentication & Authorization Layer

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

Implement a comprehensive authentication and authorization layer for BeKesher that operates in three modes:

1. **Production Mode** — Telegram Mini App `telegramToken` (Telegram's `initData`) HMAC-SHA256 validation **per-request in function wrappers** for user app; Google OAuth (Identity Services) for admin dashboard; secured Convex functions via custom middleware wrappers. Session-based auth is **blocked** in production.
2. **Development Mode** — ngrok tunnel for local Telegram Mini App testing with real Telegram auth; Convex stays cloud-hosted. Both `telegramToken` and session-based auth are available (requires `AUTH_BYPASS_SECRET`).
3. **AI Agent / CI/CD Mode** — Session-based auth bypass via `sessions` table. Sessions are created via an HTTP endpoint using `AUTH_BYPASS_SECRET`. Supports multi-user impersonation.

## User Story

As a **platform operator**
I want to secure all backend functions so that only authenticated users can access their own data and only verified admins can access admin functions
So that user data is protected, admin operations are gated, and the system can be tested in dev/CI environments without Telegram.

## Problem Statement

Currently, BeKesher has **zero authentication or authorization**. All Convex functions are public and accept a `telegramId` string parameter from the client without any server-side validation. Any client can call any function with any `telegramId`, accessing or modifying other users' data. The admin dashboard has no login gate. Webhooks are unauthenticated. The `initDataUnsafe` field used on the client is not cryptographically verified.

## Solution Statement

Implement a layered auth system using:
- **Telegram `telegramToken` HMAC-SHA256 validation per-request** inside custom function wrappers (`userQuery`, `userMutation`, `userAction`). The frontend passes `telegramToken` (sourced from `window.Telegram.WebApp.initData`) as an argument to every function call. The wrapper validates it inline and extracts `telegramId` — **no JWTs, no certificates, no JWKS** needed for Telegram auth. (`auth.config.ts` exists only for admin Google OIDC.)
- **Sessions table** (`sessions`) for CI/CD/AI/developer bypass. A bypass session is created via `POST /auth/bypass-session` with `AUTH_BYPASS_SECRET`, returning a `sessionToken`. The sessionToken is then passed as an argument to function calls instead of `telegramToken`.
- **Session auth blocked in production**: When `AUTH_BYPASS_SECRET` is not set, session-based auth is rejected both at session creation AND at resolution time. In dev, both `telegramToken` and `sessionToken` are available.
- **Google Identity Services OIDC** for admin authentication via `ctx.auth.getUserIdentity()` and a hardcoded email allowlist.
- **Custom function wrappers** (`convex-helpers` `customQuery`/`customMutation`/`customAction`) that replace raw `query`/`mutation` imports, enforcing auth checks on every function.
- **ngrok** integration guide for dev mode Telegram testing.

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: `convex/` (all function files), `apps/user/` (auth provider, telegramToken sending), `apps/admin/` (Google login, auth provider)
**Dependencies**: `convex-helpers`, `@react-oauth/google`, Web Crypto API (built-in to Convex runtime)

### Admin Authorization — Hardcoded Email Allowlist

For the initial implementation, admin authorization uses a **hardcoded list of admin emails** in `convex/authAdmin.ts` rather than querying an `admins` database table. This keeps things simple and avoids extra DB reads for admin checks.

**Authorized admin emails:**
- `masha@koomasha.com`
- `migdalor80@gmail.com`
- `brookyuri@gmail.com`

The `adminQuery`/`adminMutation`/`adminAction` wrappers verify that `ctx.auth.getUserIdentity().email` is in this list. The `admins` table in the schema can still exist for storing admin profile metadata (name, picture) but is **not** used for authorization decisions.

### Google OAuth Client ID

**Client ID**: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`

This should be set as:
- `VITE_GOOGLE_CLIENT_ID` in `apps/admin/.env` (frontend)
- `GOOGLE_CLIENT_ID` in Convex environment variables (for server-side Google token verification)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `convex/schema.ts` (lines 1-110) — Why: Contains all table definitions including `sessions` table for auth bypass and `admins` table for admin profile metadata.
- `convex/authUser.ts` — Why: **IMPLEMENTED** — User auth: `userQuery`, `userMutation`, `userAction`, `publicQuery`, `publicMutation`, Telegram token HMAC validation (`validateTelegramToken`), session management.
- `convex/authAdmin.ts` — Why: **IMPLEMENTED** — Admin auth: `adminQuery`, `adminMutation`, `adminAction`, hardcoded email allowlist, `getAdminIdentity` query.
- `convex/auth.config.ts` — Why: **IMPLEMENTED** — Google OIDC provider config for admin auth (NOT used for Telegram).
- `convex/participants.ts` (lines 1-60) — Why: Shows current function pattern using raw `query()` import + `telegramId` arg. ALL public functions across ALL files follow this pattern and need to be wrapped with auth middleware
- `convex/groups.ts` (lines 1-8) — Why: Same import pattern for `query`, `mutation`, `internalQuery`, `internalMutation`
- `convex/feedback.ts` — Why: Same pattern, needs auth wrapping
- `convex/support.ts` — Why: Same pattern, needs auth wrapping
- `convex/payments.ts` — Why: Contains PayPlus actions accessing `process.env`, needs secured endpoints
- `convex/matching.ts` — Why: Contains admin-only `runWeeklyMatchingPublic` function (line 572) that needs admin auth
- `convex/notifications.ts` (lines 11-53) — Why: Shows `internalAction` pattern with `process.env.TELEGRAM_BOT_TOKEN`
- `convex/http.ts` — Why: **UPDATED** — HTTP router with `/auth/bypass-session` endpoint for creating sessions. (No `/auth/admin/google` — admin auth uses `auth.config.ts` + `ConvexProviderWithAuth` directly.)
- `convex/_generated/server.d.ts` (lines 32-96) — Why: Shows the `query`, `mutation`, `action` builder types that custom wrappers will extend
- `apps/user/src/main.tsx` (lines 1-60) — Why: Current Convex client setup with `ConvexProvider` — needs to inject initData into every function call
- `apps/user/src/pages/HomePage.tsx` (lines 1-82) — Why: Shows current pattern of reading `window.Telegram.WebApp.initDataUnsafe.user` — needs to send `initData` (signed) instead
- `apps/admin/src/main.tsx` (lines 1-15) — Why: Current admin entry point — needs Google OAuth provider + `ConvexProviderWithAuth`
- `apps/admin/src/App.tsx` (lines 1-31) — Why: Admin router — needs login route + auth guard
- `convex/test.utils.ts` (lines 1-184) — Why: Test utilities — needs auth-aware test helpers
- `convex/participants.test.ts` (lines 1-50) — Why: Shows test pattern calling `t.mutation(api.participants.register, {...})` directly — tests need to be updated for new auth wrappers

### New Files to Create

- ~~`convex/authUser.ts`~~ — **DONE** ✅ (user auth wrappers, Telegram HMAC, session management)
- ~~`convex/authAdmin.ts`~~ — **DONE** ✅ (admin auth wrappers, email allowlist)
- ~~`convex/auth.config.ts`~~ — **DONE** ✅ (Google OIDC config for admin auth)
- `apps/admin/src/components/LoginPage.tsx` — Google Sign-In button page for admin authentication
- `apps/admin/src/hooks/useAdminAuth.ts` — Custom hook wiring Google auth state to Convex's `ConvexProviderWithAuth` interface
- `apps/user/src/hooks/useTelegramAuth.ts` — Hook that provides `telegramToken` to Convex function calls as an argument

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Convex Custom Functions (convex-helpers)](https://stack.convex.dev/custom-functions)
  - Specific section: `customQuery`, `customMutation`, `customCtx`
  - Why: Core pattern for auth middleware wrappers
- [Convex Auth Wrappers as Middleware](https://stack.convex.dev/wrappers-as-middleware-authentication)
  - Why: Shows exact pattern for auth validation in custom wrappers
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
import { userQuery, userMutation } from "./authUser";
import { adminQuery } from "./authAdmin";
import { v } from "convex/values";

export const myFunction = userQuery({
    args: {}, // telegramId no longer needed as arg — resolved from telegramToken/sessionToken by wrapper
    returns: v.union(v.object({...}), v.null()),
    handler: async (ctx, args) => {
        // ctx.telegramId is available — resolved from auth (telegramToken HMAC or session lookup)
        // telegramToken and sessionToken are consumed by wrapper, NOT visible here
    },
});
```

**Auth Wrapper Args (auto-injected by wrapper, NOT in handler args):**
```typescript
// The wrapper automatically adds these to every function:
//   telegramToken?: string — Telegram's initData string for production auth
//   sessionToken?: string  — Session token for CI/CD/AI bypass auth (requires AUTH_BYPASS_SECRET)
//
// Frontend calls: myFunction({ telegramToken: window.Telegram.WebApp.initData, ...otherArgs })
// AI/CI calls:    myFunction({ sessionToken: "abc-123", ...otherArgs })
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

**Test Pattern:**
```typescript
// Tests will need to create bypass sessions or mock initData
const t = setupTest();
// Option A: Use session token (for most tests)
const token = await createTestSession(t, "alice123");
await t.mutation(api.participants.register, { sessionToken: token, ... });
// Option B: For admin tests, use withIdentity()
const admin = t.withIdentity({ email: "masha@koomasha.com" });
await admin.query(api.groups.listAll);
```

### Blueprint Alignment

- **Data Architecture**: The `sessions` table in `convex/schema.ts` stores bypass sessions for CI/CD/AI auth. The `admins` table stores admin profile metadata from Google OAuth. Admin authorization uses the hardcoded email allowlist.
- **Logic Workflows**: Cron jobs in `convex/crons.ts` use `internal` functions which bypass auth — no changes needed for crons.
- **Identity Guidelines**: Not applicable (no branding changes).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Auth Infrastructure ✅ DONE

Set up the core auth validation utilities, custom function wrappers, and schema updates. No frontend changes yet.

**Completed tasks:**
- [x] Installed `convex-helpers` dependency
- [x] Added `sessions` table for CI/CD/AI bypass auth
- [x] Split auth into `convex/authUser.ts` and `convex/authAdmin.ts`
- [x] Created `convex/authUser.ts` with:
  - Telegram `telegramToken` HMAC-SHA256 per-request validation (`validateTelegramToken`) using Web Crypto API
  - Custom function wrappers: `userQuery`, `userMutation`, `userAction`, `publicQuery`, `publicMutation`
  - Auth resolution: accepts `telegramToken` (production) or `sessionToken` (bypass, requires `AUTH_BYPASS_SECRET`)
  - Session auth **blocked at resolution time** in production (not just at creation time)
  - Session management: `createBypassSession`, `resolveSessionToken`, `cleanupExpiredSessions`
  - Token generation uses `crypto.randomUUID()` (cryptographically secure)
  - Proper Convex types (`QueryCtx["db"]`) instead of `any`
- [x] Created `convex/authAdmin.ts` with:
  - Custom function wrappers: `adminQuery`, `adminMutation`, `adminAction`
  - Hardcoded admin email allowlist
  - `getAdminIdentity` query for frontend auth checks
- [x] Removed `admins` table and `convex/admins.ts` (not needed — admins are stateless, just an email allowlist)
- [x] Updated `convex/http.ts` with:
  - `POST /auth/bypass-session` — Creates a session for CI/CD/AI/developer use
  - Proper `ConvexError` error handling (not heuristic-based)
- [x] Created `convex/auth.config.ts` for Google OIDC JWT validation (needed ONLY for admin, NOT for Telegram)

### Phase 2: Backend Migration — Secure All Functions

Replace all `query`/`mutation` imports across backend files with appropriate auth wrappers. Remove `telegramId` from args where it's now resolved from auth context.

**Tasks:**
- Migrate `convex/participants.ts` — wrap user-facing functions with `userQuery`/`userMutation`, keep `register` as `publicMutation`
- Migrate `convex/groups.ts` — wrap with `userQuery`/`adminMutation`
- Migrate `convex/feedback.ts` — wrap with `userQuery`/`userMutation`
- Migrate `convex/support.ts` — wrap with `userQuery`/`userMutation`
- Migrate `convex/payments.ts` — keep `internalMutation` as-is, secure public-facing functions
- Migrate `convex/matching.ts` — wrap admin-triggered functions with `adminAction`
- Health check stays public

### Phase 3: Frontend Integration — User App (Telegram)

Wire the Telegram Mini App to pass `telegramToken` to every Convex function call.

**Tasks:**
- Create `apps/user/src/hooks/useTelegramAuth.ts` — hook that reads `window.Telegram.WebApp.initData` and provides it as `telegramToken` to all Convex calls. For AI/CI/CD mode: reads `sessionToken` from localStorage or env var.
- Update `apps/user/src/main.tsx` — integrate auth context provider that injects telegramToken/sessionToken
- Update all pages to remove manual `telegramId` extraction — use auth context instead
- Handle "not in Telegram" state gracefully (show message to open from Telegram)

### Phase 4: Frontend Integration — Admin Dashboard (Google OAuth)

Implement admin login with Google Sign-In.

**Tasks:**
- Install `@react-oauth/google` in `apps/admin`
- Ensure `convex/auth.config.ts` is configured for Google OIDC
- Create `apps/admin/src/components/LoginPage.tsx` with Google Sign-In button
- Create `apps/admin/src/hooks/useAdminAuth.ts` — wire Google token to `ConvexProviderWithAuth`
- Update `apps/admin/src/main.tsx` — wrap with `GoogleOAuthProvider` + `ConvexProviderWithAuth`
- Update `apps/admin/src/App.tsx` — add login route, auth guard on all admin routes
- Use `api.authAdmin.getAdminIdentity` to check login state and display user info
- Admin verification is handled by the hardcoded email allowlist — no need for seeding or DB-based admin CRUD.

### Phase 5: Dev Mode — ngrok Setup

Document and configure development workflow for Telegram testing.

**Tasks:**
- Add ngrok configuration notes to README or `.docs/`
- Update `apps/user/vite.config.ts` to support ngrok-friendly settings
- Document static ngrok domain registration with BotFather

### Phase 6: AI/CI/CD Mode — Auth Bypass

Implement auth bypass for testing and automated pipelines.

**Tasks:**
- ✅ `AUTH_BYPASS_SECRET` environment variable support in `convex/authUser.ts`
- ✅ `POST /auth/bypass-session` HTTP endpoint for creating sessions
- For `convex-test` unit tests: update `test.utils.ts` to create bypass sessions and inject `sessionToken` in test calls
- For Playwright E2E: create helper that injects `sessionToken` into function calls (instead of mocking Telegram WebApp)
- Support multi-user testing: create sessions with different `telegramId` values
- Update existing test files to work with new auth wrappers

### Phase 7: Testing & Validation

Ensure all auth flows work correctly.

**Tasks:**
- Write unit tests for `convex/authUser.ts` and `convex/authAdmin.ts` (telegramToken validation, session creation/lookup, admin verification)
- Update all existing test files to pass auth when calling wrapped functions
- Test Google OAuth login flow manually
- Test Telegram telegramToken flow manually (via ngrok)
- Verify AI/CI/CD bypass works with Playwright

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: ADD `convex-helpers` dependency ✅ DONE

- **STATUS**: Completed
- **VALIDATE**: `npm ls convex-helpers`

### Task 2: UPDATE `convex/schema.ts` — Add sessions table and modify admins table ✅ DONE

- **STATUS**: Completed
- Sessions table for CI/CD/AI bypass auth
- Admins table updated: `passwordHash` → `googleId`, added `picture`, added `by_googleId` index

### Task 3: CREATE `convex/authUser.ts` + `convex/authAdmin.ts` — Core auth modules ✅ DONE

- **STATUS**: Completed
- **APPROACH (Per-Request HMAC — definitive)**:
  1. Frontend passes `telegramToken` (from `window.Telegram.WebApp.initData`) as an argument to every Convex function call
  2. Custom function wrapper (`userQuery`/`userMutation`/`userAction`) validates HMAC-SHA256 inline
  3. Wrapper extracts `telegramId` from validated token and injects it into `ctx.telegramId`
  4. Alternative: `sessionToken` arg for CI/CD/AI bypass → lookup in `sessions` table (requires `AUTH_BYPASS_SECRET`)
  5. Auth args (`telegramToken`/`sessionToken`) are consumed by wrapper — handler never sees them

- **Why per-request HMAC (not JWT)**:
  - No certificates, key pairs, or JWKS needed
  - No `auth.config.ts` needed for Telegram auth
  - `telegramToken` is stable per app-open, so query caching works fine
  - Simpler to understand and maintain
  - HMAC is deterministic, so it works in Convex queries/mutations
  - CI/CD/AI uses the same wrappers with `sessionToken` instead of `telegramToken`

### Task 4: CREATE `convex/auth.config.ts` — Google OIDC for admin ✅ DONE

- **STATUS**: Completed — configures Google OIDC provider for admin auth. NOT used for Telegram auth.

### Task 5: UPDATE `convex/http.ts` — Auth endpoints ✅ DONE

- **STATUS**: Completed
- Removed `POST /auth/telegram` (no longer needed — telegramToken validated per-request in wrappers)
- Added `POST /auth/bypass-session` for creating CI/CD/AI sessions
- No `/auth/admin/google` endpoint needed — admin auth uses `auth.config.ts` + `ConvexProviderWithAuth` directly

### Task 6: UPDATE `convex/participants.ts` — Apply auth wrappers

- **IMPLEMENT**: 
  - Replace `import { query, mutation } from "./_generated/server"` with imports from `./authUser` (or `./authAdmin`)
  - User-facing queries (`getByTelegramId`, `getMyProfile`, etc.) → `userQuery` — remove `telegramId` from args, use `ctx.telegramId`
  - `register` → stays `publicMutation` (user not authenticated yet during registration, but receives `telegramToken` for telegramId extraction)
  - Internal functions (`internalQuery`, `internalMutation`) → keep as-is
  - Admin-facing functions (like `listAll`, status changes) → `adminMutation`
- **GOTCHA**: All pages that currently pass `telegramId` as a query arg will need to pass `telegramToken` instead. The `returns` validators should remain the same — only `args` and handler context change.
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

- **IMPLEMENT**: `runWeeklyMatchingPublic` (line 572) → `adminAction`. All other matching internals stay as-is (called by crons).
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

- **IMPLEMENT**: Create a hook/context that:
  - Reads `window.Telegram.WebApp.initData` (the signed string, NOT `initDataUnsafe`)
  - Provides it as `telegramToken` string to be passed as arg to every Convex function call
  - For AI/CI/CD mode: checks for `sessionToken` in localStorage and provides that instead
  - Handles "not in Telegram" state (telegramToken empty, no sessionToken)
  - **NOTE**: This does NOT call any HTTP endpoint — telegramToken is passed directly to function wrappers
- **VALIDATE**: TypeScript compiles without errors

### Task 18: UPDATE `apps/user/src/main.tsx` — Wire Telegram auth context

- **IMPLEMENT**:
  - Add auth context provider that makes `telegramToken`/`sessionToken` available to all components
  - Keep Telegram WebApp initialization (`ready()`, `expand()`)
- **VALIDATE**: `cd apps/user && npm run build`

### Task 19: UPDATE user app pages — Remove manual telegramId extraction

- **IMPLEMENT**: Update all pages that currently do:
  ```typescript
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramId = telegramUser?.id?.toString() || '';
  ```
  Replace with:
  ```typescript
  const { telegramToken, sessionToken } = useTelegramAuth();
  // Pass to every Convex call:
  useQuery(api.participants.getByTelegramId, { telegramToken, sessionToken });
  ```
  
  Pages to update:
  - `apps/user/src/pages/HomePage.tsx`
  - `apps/user/src/pages/GroupsPage.tsx`
  - `apps/user/src/pages/SupportPage.tsx`
  - `apps/user/src/pages/FeedbackPage.tsx`
  - `apps/user/src/pages/OnboardingPage.tsx` — registration happens before auth, may use `publicMutation`
  - `apps/user/src/pages/ProfilePage.tsx`
- **GOTCHA**: Some pages use `telegramUser?.first_name` for display — this can come from `initDataUnsafe.user` for display (client-side only), while auth validation happens server-side from `initData`.
- **VALIDATE**: `cd apps/user && npm run build`

### Task 20: UPDATE `convex/test.utils.ts` — Auth-aware test helpers

- **IMPLEMENT**: Add helpers for auth in tests:
  - `createTestSession(t, telegramId)` — creates a bypass session in the test DB and returns the `sessionToken`
  - `withAdminIdentity(t, email)` — returns a test client with admin identity (using `t.withIdentity()`)
  - Update `setupTest()` to configure `AUTH_BYPASS_SECRET` env var for test environment
- **VALIDATE**: `npm run test:once`

### Task 21: UPDATE existing test files — Pass auth identity

- **IMPLEMENT**: Update all test files to use `sessionToken` when calling wrapped functions:
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
  const token = await createTestSession(t, "alice123");
  await t.mutation(api.participants.register, { sessionToken: token, ... });
  ```
- **VALIDATE**: `npm run test:once` — all tests pass

### Task 22: ADD environment variables documentation

- **IMPLEMENT**: Update `.env.example` with new env vars:
  - `TELEGRAM_BOT_TOKEN` — already exists, now also used for HMAC telegramToken validation in function wrappers
  - `AUTH_BYPASS_SECRET` — secret for creating CI/CD/AI bypass sessions (e.g., a random UUID). Only set in dev/test environments.
  - `VITE_GOOGLE_CLIENT_ID=679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com` — Google OAuth client ID for admin dashboard
  - `GOOGLE_CLIENT_ID=679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com` — for server-side Google token verification (Convex env var)
- **VALIDATE**: File exists and contains all variables with descriptions

### Task 23: ADD Playwright auth helpers (AI/CI/CD mode)

- **IMPLEMENT**: Create a Playwright helper file (or document the pattern) for:
  - Creating a bypass session via `POST /auth/bypass-session`
  - Storing the sessionToken for use in E2E tests
  - Multi-user testing by creating sessions with different telegramIds
- **PATTERN**:
  ```typescript
  // E2E test setup
  const response = await fetch(`${CONVEX_URL}/auth/bypass-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          secret: process.env.AUTH_BYPASS_SECRET,
          telegramId: "12345",
          source: "e2e",
      }),
  });
  const { token } = await response.json();
  // Inject into page
  await page.addInitScript((sessionToken) => {
      localStorage.setItem("sessionToken", sessionToken);
  }, token);
  ```
- **VALIDATE**: Pattern documented and runnable

---

## TESTING STRATEGY

### Unit Tests

Based on existing Vitest + `convex-test` pattern in the project:

- **`convex/authUser.test.ts`** (NEW):
  - Test `validateTelegramToken` with valid and invalid data
  - Test bypass session creation with valid/invalid `AUTH_BYPASS_SECRET`
  - Test session token resolution (valid, expired, missing)
  - Test `userQuery` wrapper rejects unauthenticated calls
  - Test `userQuery` wrapper accepts valid telegramToken
  - Test `userQuery` wrapper accepts valid sessionToken
  - Test `adminQuery` wrapper rejects non-admin users
  - Test `adminQuery` wrapper allows verified admins

- **Update existing tests**:
  - All existing test files need `sessionToken` or bypass configuration
  - Verify that existing test assertions still pass after auth migration

### Integration Tests

- Test full Telegram auth flow: telegramToken → function call → validated → response
- Test full bypass flow: create session → sessionToken → function call → validated → response
- Test full Google OAuth flow: Google JWT → admin query → verified → response
- Test mixed auth: some calls with telegramToken, some with sessionToken in same session

### Edge Cases

- Invalid HMAC signature (tampered telegramToken)
- Valid Telegram auth but participant not found (new user, not yet registered)
- Admin with valid Google auth but email not in hardcoded admin allowlist
- Expired session token
- Missing `telegramToken` and missing `sessionToken` (app opened outside Telegram without bypass)
- Empty `AUTH_BYPASS_SECRET` in production (session auth blocked at both creation and resolution)
- Concurrent requests with same session token

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
   - Verify telegramToken is passed to function calls
   - Verify user sees their profile (not someone else's)

2. **Admin Google Auth**:
   - Start admin dev server: `npm run dev:admin`
   - Navigate to `http://localhost:5174`
   - Verify redirect to login page
   - Click Google Sign-In, verify login
   - Verify admin pages load with data

3. **Auth Bypass (AI/CI/CD)**:
   - Set `AUTH_BYPASS_SECRET` in Convex env vars
   - Create a session via `POST /auth/bypass-session`
   - Use returned `sessionToken` in function calls
   - Verify bypass works for both queries and mutations

4. **Security Validation**:
   - Try calling a `userQuery` without telegramToken or sessionToken → should fail
   - Try calling an `adminMutation` without admin identity → should fail
   - Try passing tampered telegramToken → HMAC should fail
   - Try using an expired sessionToken → should fail

### Level 5: Additional Validation

```bash
npm run test:coverage  # Verify coverage doesn't drop
npx convex dev         # Verify Convex accepts all changes
```

---

## ACCEPTANCE CRITERIA

- [ ] All Convex public functions require authentication (no unauthenticated access to user data)
- [ ] Telegram `telegramToken` is validated server-side using HMAC-SHA256 **per-request in function wrappers**
- [ ] Admin dashboard requires Google Sign-In and verifies email against hardcoded admin email allowlist
- [ ] Custom function wrappers (`userQuery`, `userMutation`, `userAction`, `adminQuery`, `adminMutation`, `adminAction`) are used consistently across all backend files
- [ ] `telegramId` is no longer passed as a client argument — resolved from `telegramToken` or `sessionToken` by auth wrappers
- [ ] CI/CD/AI bypass works via `sessions` table with `AUTH_BYPASS_SECRET` protection
- [ ] Both `telegramToken` and `sessionToken` auth are available in dev mode (when `AUTH_BYPASS_SECRET` is set)
- [ ] Multiple users can be impersonated via session creation with different telegramIds
- [ ] All existing tests pass after migration (zero regressions)
- [ ] New auth tests cover telegramToken validation, session management, and wrapper auth checks
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

### Critical Architecture Decision: Per-Request HMAC vs JWT

**Chosen approach: Per-request HMAC-SHA256 validation in function wrappers.**

The initial plan considered issuing JWTs from an HTTP action after validating Telegram initData, then configuring Convex's `auth.config.ts` with a custom JWT provider. This was abandoned because:

1. **JWT requires RSA/EC key pairs** — Convex only supports RS256 and ES256 for custom JWT providers, requiring certificate generation, JWKS endpoints, and key management
2. **Unnecessary complexity** — The per-request HMAC approach is simpler, requires no certificates, and works directly in function wrappers
3. **telegramToken is stable per session** — Telegram's `initData` doesn't change between calls within a single app-open, so query caching works fine
4. **HMAC is deterministic** — It works in Convex queries/mutations (no non-deterministic API restrictions)

**Trade-off**: An extra HMAC computation per request (very fast, ~microseconds), plus a DB read per request for sessionToken-based auth (indexed lookup, negligible).

### Dual Auth Resolution

Every `userQuery`/`userMutation`/`userAction` accepts two optional auth args:
- `telegramToken` — Telegram production auth (HMAC validated per-request)
- `sessionToken` — CI/CD/AI/developer bypass auth (session table lookup, requires `AUTH_BYPASS_SECRET`)

The wrapper checks in priority order:
1. If `telegramToken` provided → validate HMAC → extract telegramId
2. If `sessionToken` provided → check `AUTH_BYPASS_SECRET` is set → lookup in sessions table → extract telegramId
3. Neither → throw "Authentication required"

In production, `AUTH_BYPASS_SECRET` is not set, so session auth is rejected at both creation and resolution time, forcing telegramToken-only auth. In dev, both are available simultaneously.

### Session Table Management

The `sessions` table stores bypass sessions with:
- `telegramId` — the impersonated user ID
- `token` — random UUID-like string
- `expiresAt` — auto-expiry (24 hours default)
- `source` — "ai" | "cicd" | "dev"

Sessions are created via `POST /auth/bypass-session` (HTTP endpoint) which calls `createBypassSession` (internal mutation, requires `AUTH_BYPASS_SECRET`). Old sessions can be cleaned up by `cleanupExpiredSessions` (internal mutation, can be called by cron).

### Admin Auth — Uses ctx.auth.getUserIdentity() via auth.config.ts

Admin authentication uses Google OIDC and `ctx.auth.getUserIdentity()` via Convex's built-in auth system. `convex/auth.config.ts` is configured with Google's OIDC discovery endpoint. The admin wrappers in `convex/authAdmin.ts` (`adminQuery`, `adminMutation`, `adminAction`) call `ctx.auth.getUserIdentity()` and verify the email against the hardcoded allowlist.

### Webhook Security (Future Enhancement)

PayPlus webhook (`/payplus-callback`) and Telegram webhook (`/telegram-webhook`) currently have no signature validation. This should be addressed as a follow-up:
- PayPlus: Verify request signature using `PAYPLUS_SECRET_KEY`
- Telegram: Verify `X-Telegram-Bot-Api-Secret-Token` header

### Dependency on `convex-helpers`

The `convex-helpers` package is maintained by the Convex team and is the official recommended approach for custom function wrappers. It provides type-safe `customQuery`, `customMutation`, `customAction`, and `customCtx` utilities.

### Google OAuth Setup Prerequisites

Google Cloud project is already set up with OAuth credentials:
- **Client ID**: `679039448865-v5geg0pklkrdspeqn4a4qc86c4jnfpnn.apps.googleusercontent.com`
- Ensure authorized JavaScript origins include: `http://localhost:5174` (dev) and the production URL
- Ensure authorized redirect URIs are configured if needed
- Set `VITE_GOOGLE_CLIENT_ID` in `apps/admin/.env` and `GOOGLE_CLIENT_ID` in Convex env vars
