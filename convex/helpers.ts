import { EMPTY_PROGRESS, type Progress } from "./schema";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Adds `amount` to the user's coin balance (defaulting an unset balance to 0). */
export async function awardCoins(ctx: MutationCtx, userId: Id<"users">, amount: number) {
  const user = await ctx.db.get(userId);
  await ctx.db.patch(userId, { coins: (user?.coins ?? 0) + amount });
}

/**
 * Adds numeric deltas to the user's progress counters and merges any new entries
 * into `speciesRaised`, defaulting an unset progress object to all-zero/empty first.
 */
export async function bumpProgress(
  ctx: MutationCtx,
  userId: Id<"users">,
  delta: Partial<Omit<Progress, "speciesRaised">>,
  newSpecies?: string,
): Promise<Progress> {
  const user = await ctx.db.get(userId);
  const current = user?.progress ?? EMPTY_PROGRESS;

  const speciesRaised =
    newSpecies !== undefined && !current.speciesRaised.includes(newSpecies)
      ? [...current.speciesRaised, newSpecies]
      : current.speciesRaised;

  const next: Progress = {
    petsCreatedCount: current.petsCreatedCount + (delta.petsCreatedCount ?? 0),
    careActionsCount: current.careActionsCount + (delta.careActionsCount ?? 0),
    oldAgeDeathsCount: current.oldAgeDeathsCount + (delta.oldAgeDeathsCount ?? 0),
    shopPurchasesCount: current.shopPurchasesCount + (delta.shopPurchasesCount ?? 0),
    visitsGivenCount: current.visitsGivenCount + (delta.visitsGivenCount ?? 0),
    speciesRaised,
  };

  await ctx.db.patch(userId, { progress: next });
  return next;
}
