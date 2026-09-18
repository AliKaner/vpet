import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { unlockNewAchievements } from "./achievements";
import { bumpProgress } from "./helpers";
import { getShopItem, SHOP_CATALOG } from "./lib/shopItems";
import { mutation, query, type QueryCtx } from "./_generated/server";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

// The item ids this *currently deployed backend* actually recognizes. The
// frontend's own copy of SHOP_CATALOG can briefly get ahead of a not-yet-redeployed
// backend (e.g. a static-hosted frontend redeploying before `convex deploy` runs) -
// this lets the Shop page hide anything the backend can't yet process instead of
// showing a Buy button that fails.
export const getSupportedCatalogIds = query({
  args: {},
  handler: async () => SHOP_CATALOG.map((item) => item.id),
});

export const getMyInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const owned = await ctx.db
      .query("inventoryItems")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    return owned.map((row) => row.itemId);
  },
});

export const buyItem = mutation({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    const item = getShopItem(itemId);
    if (item === undefined) {
      throw new ConvexError("Unknown shop item.");
    }

    const alreadyOwned = await ctx.db
      .query("inventoryItems")
      .withIndex("by_owner_item", (q) => q.eq("ownerId", userId).eq("itemId", itemId))
      .unique();
    if (alreadyOwned !== null) {
      throw new ConvexError("You already own this item.");
    }

    const user = await ctx.db.get(userId);
    const coins = user?.coins ?? 0;
    if (coins < item.price) {
      throw new ConvexError("Not enough coins.");
    }

    await ctx.db.patch(userId, { coins: coins - item.price });
    await ctx.db.insert("inventoryItems", { ownerId: userId, itemId, purchasedAt: Date.now() });
    const progress = await bumpProgress(ctx, userId, { shopPurchasesCount: 1 });
    await unlockNewAchievements(ctx, userId, progress);
  },
});

export const equipItem = mutation({
  args: { petId: v.id("pets"), itemId: v.union(v.string(), v.null()), slot: v.union(v.literal("toy"), v.literal("clothing")) },
  handler: async (ctx, { petId, itemId, slot }) => {
    const userId = await requireUserId(ctx);
    const pet = await ctx.db.get(petId);
    if (pet === null || pet.ownerId !== userId) {
      throw new ConvexError("Pet not found.");
    }

    if (itemId === null) {
      await ctx.db.patch(petId, slot === "toy" ? { equippedToyId: undefined } : { equippedClothingId: undefined });
      return;
    }

    const item = getShopItem(itemId);
    if (item === undefined || item.kind !== slot) {
      throw new ConvexError("That item doesn't fit this slot.");
    }

    const owned = await ctx.db
      .query("inventoryItems")
      .withIndex("by_owner_item", (q) => q.eq("ownerId", userId).eq("itemId", itemId))
      .unique();
    if (owned === null) {
      throw new ConvexError("You don't own this item yet.");
    }

    await ctx.db.patch(petId, slot === "toy" ? { equippedToyId: itemId } : { equippedClothingId: itemId });
  },
});
