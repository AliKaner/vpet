import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  CLEAN_CLEANLINESS_GAIN,
  CLEAN_COOLDOWN_MS,
  FEED_COOLDOWN_MS,
  FEED_HAPPINESS_BONUS,
  FEED_HUNGER_GAIN,
  PET_COOLDOWN_MS,
  PET_HAPPINESS_GAIN,
  STARTING_CARE_EMA,
  STARTING_PET_SLOTS,
  STARTING_STAT,
  MIN_LIFESPAN_MS,
} from "./lib/constants";
import { clamp, settleStats } from "./lib/petMath";
import { isSpeciesId, SPECIES_IDS } from "./lib/species";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

function projectPet(pet: Doc<"pets">, now: number) {
  const settled = settleStats(pet, pet.lastStatsUpdate, now, pet.species as "cat" | "dog");
  return {
    ...pet,
    hunger: settled.hunger,
    cleanliness: settled.cleanliness,
    happiness: settled.happiness,
    health: settled.health,
    ageMs: now - pet.createdAt,
    // The client ticks stats forward locally between syncs for smooth bars; it must
    // continue decaying from *this* projection time, not the stale `lastStatsUpdate`
    // (which would double-count the decay already applied above).
    asOf: now,
  };
}

export const getMyActivePet = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const pet = await ctx.db
      .query("pets")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", userId).eq("status", "alive"))
      .unique();
    if (pet === null) return null;
    return projectPet(pet, Date.now());
  },
});

export const getMySlots = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    return user?.petSlots ?? STARTING_PET_SLOTS;
  },
});

export const createPet = mutation({
  args: { name: v.string(), species: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim().slice(0, 24);
    if (name.length === 0) {
      throw new ConvexError("Give your pet a name.");
    }
    if (!isSpeciesId(args.species)) {
      throw new ConvexError(`Unknown species. Choose one of: ${SPECIES_IDS.join(", ")}`);
    }

    const existingAlive = await ctx.db
      .query("pets")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", userId).eq("status", "alive"))
      .collect();

    const user = await ctx.db.get(userId);
    const slots = user?.petSlots ?? STARTING_PET_SLOTS;
    if (existingAlive.length >= slots) {
      throw new ConvexError("You don't have a free pet slot right now.");
    }

    const now = Date.now();
    await ctx.db.insert("pets", {
      ownerId: userId,
      name,
      species: args.species,
      status: "alive",
      createdAt: now,
      hunger: STARTING_STAT,
      cleanliness: STARTING_STAT,
      happiness: STARTING_STAT,
      health: STARTING_STAT,
      lastStatsUpdate: now,
      lifespanTargetMs: MIN_LIFESPAN_MS,
      careScoreEma: STARTING_CARE_EMA,
      lastCareEvaluation: now,
      generation: 0,
    });
  },
});

async function applyCareAction(
  ctx: MutationCtx,
  userId: Id<"users">,
  petId: Id<"pets">,
  cooldownField: "lastFedAt" | "lastPettedAt" | "lastCleanedAt",
  cooldownMs: number,
  applyGain: (settled: { hunger: number; cleanliness: number; happiness: number; health: number }) => Partial<
    Pick<Doc<"pets">, "hunger" | "cleanliness" | "happiness">
  >,
) {
  const pet = await ctx.db.get(petId);
  if (pet === null || pet.ownerId !== userId) {
    throw new ConvexError("Pet not found.");
  }
  if (pet.status !== "alive") {
    throw new ConvexError("This pet is no longer with us.");
  }

  const now = Date.now();
  const lastActionAt = pet[cooldownField];
  if (lastActionAt !== undefined && now - lastActionAt < cooldownMs) {
    const remainingMs = cooldownMs - (now - lastActionAt);
    throw new ConvexError({ code: "COOLDOWN", remainingMs });
  }

  const settled = settleStats(pet, pet.lastStatsUpdate, now, pet.species as "cat" | "dog");
  const gains = applyGain(settled);

  await ctx.db.patch(petId, {
    hunger: clamp(gains.hunger ?? settled.hunger, 0, 100),
    cleanliness: clamp(gains.cleanliness ?? settled.cleanliness, 0, 100),
    happiness: clamp(gains.happiness ?? settled.happiness, 0, 100),
    health: settled.health,
    lastStatsUpdate: now,
    [cooldownField]: now,
  });
}

export const feedPet = mutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await applyCareAction(ctx, userId, args.petId, "lastFedAt", FEED_COOLDOWN_MS, (settled) => ({
      hunger: settled.hunger + FEED_HUNGER_GAIN,
      happiness: settled.happiness + FEED_HAPPINESS_BONUS,
    }));
  },
});

export const petPet = mutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await applyCareAction(ctx, userId, args.petId, "lastPettedAt", PET_COOLDOWN_MS, (settled) => ({
      happiness: settled.happiness + PET_HAPPINESS_GAIN,
    }));
  },
});

export const cleanPet = mutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await applyCareAction(ctx, userId, args.petId, "lastCleanedAt", CLEAN_COOLDOWN_MS, (settled) => ({
      cleanliness: settled.cleanliness + CLEAN_CLEANLINESS_GAIN,
    }));
  },
});
