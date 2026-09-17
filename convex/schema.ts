import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { STARTING_PET_SLOTS } from "./lib/constants";

export default defineSchema({
  ...authTables,

  users: defineTable({
    ...authTables.users.validator.fields,
    petSlots: v.optional(v.number()), // undefined treated as STARTING_PET_SLOTS
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  pets: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    species: v.string(),
    status: v.union(v.literal("alive"), v.literal("deceased")),
    createdAt: v.number(),

    hunger: v.number(),
    cleanliness: v.number(),
    happiness: v.number(),
    health: v.number(),
    lastStatsUpdate: v.number(),

    lifespanTargetMs: v.number(),
    careScoreEma: v.number(),
    lastCareEvaluation: v.number(),

    lastFedAt: v.optional(v.number()),
    lastPettedAt: v.optional(v.number()),
    lastCleanedAt: v.optional(v.number()),

    deathCause: v.optional(v.union(v.literal("neglect"), v.literal("old_age"))),
    deathAt: v.optional(v.number()),

    // Forward-compat for a later breeding/generations phase; unused by Phase 1 logic.
    generation: v.number(),
    parentPetId: v.optional(v.id("pets")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_status", ["status"]),

  memorials: defineTable({
    ownerId: v.id("users"),
    petId: v.id("pets"),
    name: v.string(),
    species: v.string(),
    bornAt: v.number(),
    diedAt: v.number(),
    ageAtDeathMs: v.number(),
    lifespanTargetMs: v.number(),
    cause: v.union(v.literal("neglect"), v.literal("old_age")),
    grantedChildSlot: v.boolean(),
  }).index("by_owner", ["ownerId"]),
});

export const DEFAULT_PET_SLOTS = STARTING_PET_SLOTS;
