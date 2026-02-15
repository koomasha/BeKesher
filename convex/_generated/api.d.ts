/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as authAdmin from "../authAdmin.js";
import type * as authUser from "../authUser.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as matching from "../matching.js";
import type * as notifications from "../notifications.js";
import type * as participants from "../participants.js";
import type * as payments from "../payments.js";
import type * as seed from "../seed.js";
import type * as support from "../support.js";
import type * as testSetup from "../testSetup.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  authAdmin: typeof authAdmin;
  authUser: typeof authUser;
  crons: typeof crons;
  feedback: typeof feedback;
  groups: typeof groups;
  http: typeof http;
  matching: typeof matching;
  notifications: typeof notifications;
  participants: typeof participants;
  payments: typeof payments;
  seed: typeof seed;
  support: typeof support;
  testSetup: typeof testSetup;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
