import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getMyMemorials = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not signed in");
    }
    const memorials = await ctx.db
      .query("memorials")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    // Small per-owner lists, so an in-memory join for lineage info is simpler and
    // cheap enough rather than adding a dedicated index just for this.
    const allMyPets = await ctx.db
      .query("pets")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    return memorials
      .map((memorial) => {
        const pet = allMyPets.find((p) => p._id === memorial.petId);
        const child = allMyPets.find((p) => p.parentPetId === memorial.petId);
        return {
          ...memorial,
          generation: pet?.generation ?? 0,
          continuedByName: child?.name,
        };
      })
      .sort((a, b) => b.diedAt - a.diedAt);
  },
});
