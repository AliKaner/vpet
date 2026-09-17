import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { unlockNewAchievements } from "./achievements";
import { CARE_ACTIONS_BY_SPECIES } from "./lib/careActions";
import {
  COIN_PER_CARE_ACTION,
  MIN_LIFESPAN_MS,
  STARTING_CARE_EMA,
  STARTING_PET_SLOTS,
  STARTING_STAT,
} from "./lib/constants";
import { awardCoins, bumpProgress } from "./helpers";
import { clamp, settleStats } from "./lib/petMath";
import { getEquippedEffects } from "./lib/shopItems";
import { isSpeciesId, SPECIES_IDS, type SpeciesId } from "./lib/species";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { appearanceValidator, isAppearanceForSpecies } from "./lib/petAppearances";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

export function projectPet(pet: Doc<"pets">, now: number) {
  const settled = settleStats(
    pet,
    pet.lastStatsUpdate,
    now,
    pet.species as SpeciesId,
    getEquippedEffects(pet.equippedToyId),
  );
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

export const getMyPets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const pets = await ctx.db
      .query("pets")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", userId).eq("status", "alive"))
      .collect();
    const now = Date.now();
    return pets.map((pet) => projectPet(pet, now));
  },
});

// Both my own pets and (if I've paired up with a partner) theirs, side by side, so
// a couple can raise pets together. "isMine" tells the UI whose is whose; care
// permission for partner pets is enforced separately in performCareAction.
export const getHouseholdPets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const user = await ctx.db.get(userId);
    const now = Date.now();

    const myPets = await ctx.db
      .query("pets")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", userId).eq("status", "alive"))
      .collect();

    let partnerPets: Doc<"pets">[] = [];
    if (user?.partnerId !== undefined) {
      partnerPets = await ctx.db
        .query("pets")
        .withIndex("by_owner_status", (q) => q.eq("ownerId", user.partnerId!).eq("status", "alive"))
        .collect();
    }

    return [
      ...myPets.map((pet) => ({ ...projectPet(pet, now), isMine: true })),
      ...partnerPets.map((pet) => ({ ...projectPet(pet, now), isMine: false })),
    ];
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
  args: { name: v.string(), species: v.string(), appearance: v.optional(appearanceValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim().slice(0, 24);
    if (name.length === 0) {
      throw new ConvexError("Give your pet a name.");
    }
    if (!isSpeciesId(args.species)) {
      throw new ConvexError(`Unknown species. Choose one of: ${SPECIES_IDS.join(", ")}`);
    }
    const appearance = args.appearance ?? "classic";
    if (!isAppearanceForSpecies(args.species, appearance)) {
      throw new ConvexError("Choose an appearance available for this species.");
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
      appearance,
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

    const progress = await bumpProgress(ctx, userId, { petsCreatedCount: 1 }, args.species);
    await unlockNewAchievements(ctx, userId, progress);
    return null;
  },
});

export const setAppearance = mutation({
  args: { petId: v.id("pets"), appearance: appearanceValidator },
  returns: v.null(),
  handler: async (ctx, { petId, appearance }) => {
    const userId = await requireUserId(ctx);
    const pet = await ctx.db.get(petId);
    if (!pet || pet.ownerId !== userId || pet.status !== "alive") throw new ConvexError("Pet not found.");
    if (!isSpeciesId(pet.species) || !isAppearanceForSpecies(pet.species, appearance)) {
      throw new ConvexError("Choose an appearance available for this species.");
    }
    await ctx.db.patch(petId, { appearance });
    return null;
  },
});

export const performCareAction = mutation({
  args: { petId: v.id("pets"), actionId: v.string() },
  handler: async (ctx, { petId, actionId }) => {
    const userId = await requireUserId(ctx);
    const pet = await ctx.db.get(petId);
    if (pet === null) {
      throw new ConvexError("Pet not found.");
    }
    if (pet.ownerId !== userId) {
      const caller = await ctx.db.get(userId);
      if (caller?.partnerId !== pet.ownerId) {
        throw new ConvexError("Pet not found.");
      }
    }
    if (pet.status !== "alive") {
      throw new ConvexError("This pet is no longer with us.");
    }

    const action = CARE_ACTIONS_BY_SPECIES[pet.species as SpeciesId]?.find((a) => a.id === actionId);
    if (!action) {
      throw new ConvexError("Unknown action for this species.");
    }

    const now = Date.now();
    const lastActionAt = pet.actionCooldowns?.[actionId];
    if (lastActionAt !== undefined && now - lastActionAt < action.cooldownMs) {
      throw new ConvexError({ code: "COOLDOWN", remainingMs: action.cooldownMs - (now - lastActionAt) });
    }

    const settled = settleStats(
      pet,
      pet.lastStatsUpdate,
      now,
      pet.species as SpeciesId,
      getEquippedEffects(pet.equippedToyId),
    );

    await ctx.db.patch(petId, {
      hunger: clamp(settled.hunger + (action.gains.hunger ?? 0), 0, 100),
      cleanliness: clamp(settled.cleanliness + (action.gains.cleanliness ?? 0), 0, 100),
      happiness: clamp(settled.happiness + (action.gains.happiness ?? 0), 0, 100),
      health: settled.health,
      lastStatsUpdate: now,
      actionCooldowns: { ...(pet.actionCooldowns ?? {}), [actionId]: now },
    });

    // Cooldown-free actions (unlimited affection) don't pay coins or count toward
    // progress/achievements - only metered actions (feed/clean/etc.) do.
    if (action.cooldownMs > 0) {
      await awardCoins(ctx, userId, COIN_PER_CARE_ACTION);
      const progress = await bumpProgress(ctx, userId, { careActionsCount: 1 });
      await unlockNewAchievements(ctx, userId, progress);
    }
  },
});
