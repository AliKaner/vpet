/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as decor from "../decor.js";
import type * as friends from "../friends.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as internal_petEvaluation from "../internal/petEvaluation.js";
import type * as lib_achievements from "../lib/achievements.js";
import type * as lib_careActions from "../lib/careActions.js";
import type * as lib_character from "../lib/character.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_petAppearances from "../lib/petAppearances.js";
import type * as lib_petMath from "../lib/petMath.js";
import type * as lib_shopItems from "../lib/shopItems.js";
import type * as lib_species from "../lib/species.js";
import type * as memorials from "../memorials.js";
import type * as partners from "../partners.js";
import type * as pets from "../pets.js";
import type * as shop from "../shop.js";
import type * as social from "../social.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  auth: typeof auth;
  crons: typeof crons;
  decor: typeof decor;
  friends: typeof friends;
  helpers: typeof helpers;
  http: typeof http;
  "internal/petEvaluation": typeof internal_petEvaluation;
  "lib/achievements": typeof lib_achievements;
  "lib/careActions": typeof lib_careActions;
  "lib/character": typeof lib_character;
  "lib/constants": typeof lib_constants;
  "lib/petAppearances": typeof lib_petAppearances;
  "lib/petMath": typeof lib_petMath;
  "lib/shopItems": typeof lib_shopItems;
  "lib/species": typeof lib_species;
  memorials: typeof memorials;
  partners: typeof partners;
  pets: typeof pets;
  shop: typeof shop;
  social: typeof social;
  users: typeof users;
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
