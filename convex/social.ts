import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { unlockNewAchievements } from "./achievements";
import { awardCoins, bumpProgress } from "./helpers";
import { MAX_VISITABLE_PETS, VISIT_COIN_REWARD, VISIT_COOLDOWN_MS, VISIT_HAPPINESS_GAIN } from "./lib/constants";
import { computeLifeStage, computeMoodBucket, clamp, settleStats } from "./lib/petMath";
import { getEquippedEffects } from "./lib/shopItems";
import type { SpeciesId } from "./lib/species";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

// Deliberately exposes only what's needed to render a sprite card - no owner
// identity, exact stat numbers, cooldowns, coins, or inventory.
function projectVisitCard(pet: Doc<"pets">, now: number) {
  const settled = settleStats(
    pet,
    pet.lastStatsUpdate,
    now,
    pet.species as SpeciesId,
    getEquippedEffects(pet.equippedToyId),
  );
  return {
    petId: pet._id,
    name: pet.name,
    species: pet.species,
    mood: computeMoodBucket(settled),
    lifeStage: computeLifeStage(now - pet.createdAt, pet.lifespanTargetMs),
    equippedClothingId: pet.equippedClothingId,
    lastVisitedAt: pet.lastVisitedAt,
  };
}

export const listVisitablePets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const alive = await ctx.db
      .query("pets")
      .withIndex("by_status", (q) => q.eq("status", "alive"))
      .take(200);

    return alive
      .filter((pet) => pet.ownerId !== userId)
      .slice(0, MAX_VISITABLE_PETS)
      .map((pet) => projectVisitCard(pet, now));
  },
});

// Just your friends' pets, grouped by friend - a curated alternative to the random
// pool in listVisitablePets. Same visit/wave mechanics (visitPet works on any pet
// you don't own, friend or stranger).
export const listFriendsPets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        const pets = await ctx.db
          .query("pets")
          .withIndex("by_owner_status", (q) => q.eq("ownerId", friendship.friendId).eq("status", "alive"))
          .collect();
        return {
          friendId: friendship.friendId,
          friendName: friend?.name ?? friend?.email ?? "A friend",
          pets: pets.map((pet) => projectVisitCard(pet, now)),
        };
      }),
    );
  },
});

export const visitPet = mutation({
  args: { petId: v.id("pets") },
  handler: async (ctx, { petId }) => {
    const userId = await requireUserId(ctx);
    const pet = await ctx.db.get(petId);
    if (pet === null || pet.status !== "alive") {
      throw new ConvexError("Pet not found.");
    }
    if (pet.ownerId === userId) {
      throw new ConvexError("You can't visit your own pet.");
    }

    const now = Date.now();
    if (pet.lastVisitedAt !== undefined && now - pet.lastVisitedAt < VISIT_COOLDOWN_MS) {
      throw new ConvexError({ code: "COOLDOWN", remainingMs: VISIT_COOLDOWN_MS - (now - pet.lastVisitedAt) });
    }

    const settled = settleStats(
      pet,
      pet.lastStatsUpdate,
      now,
      pet.species as SpeciesId,
      getEquippedEffects(pet.equippedToyId),
    );

    await ctx.db.patch(petId, {
      hunger: settled.hunger,
      cleanliness: settled.cleanliness,
      happiness: clamp(settled.happiness + VISIT_HAPPINESS_GAIN, 0, 100),
      health: settled.health,
      lastStatsUpdate: now,
      lastVisitedAt: now,
    });

    await awardCoins(ctx, userId, VISIT_COIN_REWARD);
    const progress = await bumpProgress(ctx, userId, { visitsGivenCount: 1 });
    await unlockNewAchievements(ctx, userId, progress);
  },
});
