/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as internal_petEvaluation from "../internal/petEvaluation.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_petMath from "../lib/petMath.js";
import type * as lib_species from "../lib/species.js";
import type * as memorials from "../memorials.js";
import type * as pets from "../pets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  "internal/petEvaluation": typeof internal_petEvaluation;
  "lib/constants": typeof lib_constants;
  "lib/petMath": typeof lib_petMath;
  "lib/species": typeof lib_species;
  memorials: typeof memorials;
  pets: typeof pets;
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
