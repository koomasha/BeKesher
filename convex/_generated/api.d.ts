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
import type * as i18n from "../i18n.js";
import type * as matching from "../matching.js";
import type * as notifications from "../notifications.js";
import type * as participants from "../participants.js";
import type * as payments from "../payments.js";
import type * as seasonParticipants from "../seasonParticipants.js";
import type * as seasons from "../seasons.js";
import type * as seed from "../seed.js";
import type * as support from "../support.js";
import type * as taskAssignments from "../taskAssignments.js";
import type * as tasks from "../tasks.js";
import type * as utils from "../utils.js";
import type * as validators from "../validators.js";

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
  i18n: typeof i18n;
  matching: typeof matching;
  notifications: typeof notifications;
  participants: typeof participants;
  payments: typeof payments;
  seasonParticipants: typeof seasonParticipants;
  seasons: typeof seasons;
  seed: typeof seed;
  support: typeof support;
  taskAssignments: typeof taskAssignments;
  tasks: typeof tasks;
  utils: typeof utils;
  validators: typeof validators;
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
