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
    return memorials.sort((a, b) => b.diedAt - a.diedAt);
  },
});
