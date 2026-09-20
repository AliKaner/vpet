import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { STARTING_PET_SLOTS } from "./lib/constants";
import { appearanceValidator } from "./lib/petAppearances";
import { eyeColorValidator, genderValidator, hairColorValidator, hairStyleValidator } from "./lib/character";
import { skinToneValidator, accessoryValidator } from "./lib/character";

const progressValidator = v.object({
  petsCreatedCount: v.number(),
  careActionsCount: v.number(),
  oldAgeDeathsCount: v.number(),
  shopPurchasesCount: v.number(),
  visitsGivenCount: v.number(),
  speciesRaised: v.array(v.string()),
});

export default defineSchema({
  ...authTables,
  gameAssets:defineTable({path:v.string(),storageId:v.id("_storage"),sha256:v.string(),size:v.number()}).index("by_path",["path"]),
  activities: defineTable({
    ownerId:v.id("users"),day:v.string(),dailyClaimed:v.boolean(),memoryWins:v.number(),shiftsPaid:v.number(),
    shiftReadyAt:v.optional(v.number()),gameId:v.number(),board:v.array(v.number()),matched:v.array(v.number()),
    faceUp:v.array(v.number()),turn:v.number(),resetAt:v.number(),active:v.boolean(),expiresAt:v.number(),
  }).index("by_owner",["ownerId"]),

  users: defineTable({
    ...authTables.users.validator.fields,
    petSlots: v.optional(v.number()), // undefined treated as STARTING_PET_SLOTS
    coins: v.optional(v.number()), // undefined treated as 0
    progress: v.optional(progressValidator), // undefined treated as all-zero/empty
    partnerId: v.optional(v.id("users")), // mutual once paired - raise pets together
    characterGender: v.optional(genderValidator),
    characterHairStyle: v.optional(hairStyleValidator),
    characterEyeColor: v.optional(eyeColorValidator),
    characterHairColor: v.optional(hairColorValidator),
    characterClothingId: v.optional(v.string()),
    characterSkinTone: v.optional(skinToneValidator),
    characterAccessory: v.optional(accessoryValidator),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  pets: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    species: v.string(),
    appearance: v.optional(appearanceValidator),
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

    // Keyed by care action id (species-specific action catalog), replacing the
    // fixed lastFedAt/lastPettedAt/lastCleanedAt fields from Phase 1.
    actionCooldowns: v.optional(v.record(v.string(), v.number())),

    equippedToyId: v.optional(v.string()),
    equippedClothingId: v.optional(v.string()),
    lastVisitedAt: v.optional(v.number()),

    deathCause: v.optional(v.union(v.literal("neglect"), v.literal("old_age"))),
    deathAt: v.optional(v.number()),

    // Forward-compat for a later breeding/generations phase; unused by current logic.
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

  inventoryItems: defineTable({
    ownerId: v.id("users"),
    itemId: v.string(), // key into the static SHOP_CATALOG
    purchasedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_item", ["ownerId", "itemId"]),

  achievementUnlocks: defineTable({
    ownerId: v.id("users"),
    achievementId: v.string(), // key into the static ACHIEVEMENTS catalog
    unlockedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_achievement", ["ownerId", "achievementId"]),

  invites: defineTable({
    code: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    usedBy: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
    // "partner" = exclusive 1-on-1 pairing (raise pets + chat together); undefined
    // is treated as "partner" for invites created before this field existed.
    // "friend" = non-exclusive, add as many as you like, curated visit list.
    kind: v.optional(v.union(v.literal("partner"), v.literal("friend"))),
  })
    .index("by_code", ["code"])
    .index("by_creator", ["createdBy"]),

  friendships: defineTable({
    ownerId: v.id("users"),
    friendId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_friend", ["ownerId", "friendId"]),

  partnerMessages: defineTable({
    // Sorted [userA, userB] ids joined by "_" - the same key regardless of who's
    // asking, so one index covers a pair's whole conversation.
    pairKey: v.string(),
    senderId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_pair", ["pairKey", "createdAt"]),

  // A "room" is shared: keyed by the same pair-key as partnerMessages when paired,
  // or just your own user id when solo. Either partner can decorate and re-wallpaper
  // it, and either partner's purchased decor is placeable in it.
  rooms: defineTable({
    roomKey: v.string(),
    tiles:v.optional(v.array(v.object({x:v.number(),y:v.number()}))),
    tilePurchases:v.optional(v.number()),
    gardenTiles:v.optional(v.array(v.object({x:v.number(),y:v.number()}))),
    gardenPurchases:v.optional(v.number()),
    level: v.optional(v.number()),
    wallpaperId: v.optional(v.string()),
    floorId: v.optional(v.string()),
  }).index("by_room", ["roomKey"]),

  roomPlacements: defineTable({
    roomKey: v.string(),
    itemId: v.string(), // key into the static SHOP_CATALOG (kind "decor" or "furniture")
    placedAt: v.number(),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    flipped: v.optional(v.boolean()),
    tileX:v.optional(v.number()),
    tileY:v.optional(v.number()),
    area: v.optional(v.union(v.literal("room"),v.literal("garden"))),
  })
    .index("by_room", ["roomKey"])
    .index("by_room_item", ["roomKey", "itemId"]),
});

export const DEFAULT_PET_SLOTS = STARTING_PET_SLOTS;
export type Progress = {
  petsCreatedCount: number;
  careActionsCount: number;
  oldAgeDeathsCount: number;
  shopPurchasesCount: number;
  visitsGivenCount: number;
  speciesRaised: string[];
};

export const EMPTY_PROGRESS: Progress = {
  petsCreatedCount: 0,
  careActionsCount: 0,
  oldAgeDeathsCount: 0,
  shopPurchasesCount: 0,
  visitsGivenCount: 0,
  speciesRaised: [],
};
