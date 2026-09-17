import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { EMPTY_PROGRESS } from "./schema";
import { STARTING_PET_SLOTS } from "./lib/constants";
import { query } from "./_generated/server";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not signed in");
    }
    const user = await ctx.db.get(userId);
    return {
      coins: user?.coins ?? 0,
      petSlots: user?.petSlots ?? STARTING_PET_SLOTS,
      progress: user?.progress ?? EMPTY_PROGRESS,
    };
  },
});
