import { unlockNewAchievements } from "../achievements";
import { bumpProgress } from "../helpers";
import { advanceCareAndLifespan, isNeglectDeath, isOldAgeDeath, settleStats } from "../lib/petMath";
import { getEquippedEffects } from "../lib/shopItems";
import type { SpeciesId } from "../lib/species";
import { internalMutation } from "../_generated/server";

// Server-authoritative sweep: settles every alive pet's stats forward to `now`,
// advances its care score / lifespan target, and transitions it to "deceased"
// (with a memorial + slot grant) if either death condition is met. This is what
// lets a pet die while its owner is offline, not just when they open the app.
export const evaluateAllPets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const alivePets = await ctx.db
      .query("pets")
      .withIndex("by_status", (q) => q.eq("status", "alive"))
      .collect();

    for (const pet of alivePets) {
      const settled = settleStats(
        pet,
        pet.lastStatsUpdate,
        now,
        pet.species as SpeciesId,
        getEquippedEffects(pet.equippedToyId),
      );
      const ageMs = now - pet.createdAt;

      if (isNeglectDeath(settled.health)) {
        await ctx.db.patch(pet._id, {
          hunger: settled.hunger,
          cleanliness: settled.cleanliness,
          happiness: settled.happiness,
          health: 0,
          lastStatsUpdate: now,
          status: "deceased",
          deathCause: "neglect",
          deathAt: now,
        });
        await ctx.db.insert("memorials", {
          ownerId: pet.ownerId,
          petId: pet._id,
          name: pet.name,
          species: pet.species,
          bornAt: pet.createdAt,
          diedAt: now,
          ageAtDeathMs: ageMs,
          lifespanTargetMs: pet.lifespanTargetMs,
          cause: "neglect",
          grantedChildSlot: false,
        });
        continue;
      }

      const { careScoreEma, lifespanTargetMs } = advanceCareAndLifespan(
        { careScoreEma: pet.careScoreEma, lifespanTargetMs: pet.lifespanTargetMs },
        settled,
      );

      if (isOldAgeDeath(ageMs, lifespanTargetMs)) {
        await ctx.db.patch(pet._id, {
          hunger: settled.hunger,
          cleanliness: settled.cleanliness,
          happiness: settled.happiness,
          health: settled.health,
          lastStatsUpdate: now,
          careScoreEma,
          lifespanTargetMs,
          lastCareEvaluation: now,
          status: "deceased",
          deathCause: "old_age",
          deathAt: now,
        });
        await ctx.db.insert("memorials", {
          ownerId: pet.ownerId,
          petId: pet._id,
          name: pet.name,
          species: pet.species,
          bornAt: pet.createdAt,
          diedAt: now,
          ageAtDeathMs: ageMs,
          lifespanTargetMs,
          cause: "old_age",
          grantedChildSlot: true,
        });
        const owner = await ctx.db.get(pet.ownerId);
        const currentSlots = owner?.petSlots ?? 1;
        await ctx.db.patch(pet.ownerId, { petSlots: currentSlots + 1 });
        const progress = await bumpProgress(ctx, pet.ownerId, { oldAgeDeathsCount: 1 });
        await unlockNewAchievements(ctx, pet.ownerId, progress);
        continue;
      }

      await ctx.db.patch(pet._id, {
        hunger: settled.hunger,
        cleanliness: settled.cleanliness,
        happiness: settled.happiness,
        health: settled.health,
        lastStatsUpdate: now,
        careScoreEma,
        lifespanTargetMs,
        lastCareEvaluation: now,
      });
    }
  },
});
