import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { awardCoins } from "./helpers";
import { ACHIEVEMENTS, evaluateAchievements } from "./lib/achievements";
import { COIN_PER_ACHIEVEMENT } from "./lib/constants";
import type { Progress } from "./schema";
import { query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getMyAchievements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not signed in");
    }
    const unlocks = await ctx.db
      .query("achievementUnlocks")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    const unlockedIds = new Set(unlocks.map((u) => u.achievementId));
    return ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedIds.has(def.id),
      unlockedAt: unlocks.find((u) => u.achievementId === def.id)?.unlockedAt,
    }));
  },
});

/**
 * Diffs the caller's current progress against already-unlocked achievements,
 * inserts unlock records for anything newly satisfied, and pays out the coin
 * bonus for each. Called from the end of any mutation that changes progress
 * counters (createPet, performCareAction, buyItem, evaluateAllPets, visitPet).
 */
export async function unlockNewAchievements(ctx: MutationCtx, userId: Id<"users">, progress: Progress) {
  const satisfiedIds = evaluateAchievements(progress);
  if (satisfiedIds.length === 0) return;

  const existing = await ctx.db
    .query("achievementUnlocks")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  const alreadyUnlocked = new Set(existing.map((u) => u.achievementId));

  const now = Date.now();
  for (const achievementId of satisfiedIds) {
    if (alreadyUnlocked.has(achievementId)) continue;
    await ctx.db.insert("achievementUnlocks", { ownerId: userId, achievementId, unlockedAt: now });
    await awardCoins(ctx, userId, COIN_PER_ACHIEVEMENT);
  }
}
