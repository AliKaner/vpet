import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { getShopItem } from "./lib/shopItems";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function requireUserId(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

/** Solo players get their own room; paired partners share one, keyed the same way
 * as their chat conversation, so decorating together falls out naturally. */
async function getRoomKey(ctx: QueryCtx, userId: Id<"users">): Promise<string> {
  const user = await ctx.db.get(userId);
  if (user?.partnerId === undefined) return userId;
  return [userId, user.partnerId].sort().join("_");
}

async function getHouseholdOwnerIds(ctx: QueryCtx, userId: Id<"users">): Promise<Id<"users">[]> {
  const user = await ctx.db.get(userId);
  return user?.partnerId === undefined ? [userId] : [userId, user.partnerId];
}

async function ownsItem(ctx: QueryCtx, ownerIds: Id<"users">[], itemId: string): Promise<boolean> {
  for (const ownerId of ownerIds) {
    const owned = await ctx.db
      .query("inventoryItems")
      .withIndex("by_owner_item", (q) => q.eq("ownerId", ownerId).eq("itemId", itemId))
      .unique();
    if (owned !== null) return true;
  }
  return false;
}

export const getMyRoom = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const roomKey = await getRoomKey(ctx, userId);

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room", (q) => q.eq("roomKey", roomKey))
      .unique();
    const placements = await ctx.db
      .query("roomPlacements")
      .withIndex("by_room", (q) => q.eq("roomKey", roomKey))
      .collect();

    return {
      wallpaperId: room?.wallpaperId,
      placedItemIds: placements.map((p) => p.itemId),
    };
  },
});

// Everything decor/wallpaper that either you or your partner own - the shared pool
// available to place in your shared room.
export const getMyDecorInventory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const ownerIds = await getHouseholdOwnerIds(ctx, userId);

    const itemIds = new Set<string>();
    for (const ownerId of ownerIds) {
      const owned: Doc<"inventoryItems">[] = await ctx.db
        .query("inventoryItems")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect();
      for (const row of owned) {
        const item = getShopItem(row.itemId);
        if (item?.kind === "decor" || item?.kind === "wallpaper") {
          itemIds.add(row.itemId);
        }
      }
    }
    return Array.from(itemIds);
  },
});

export const placeItem = mutation({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    const item = getShopItem(itemId);
    if (item === undefined || item.kind !== "decor") {
      throw new ConvexError("That item can't be placed in the room.");
    }
    const ownerIds = await getHouseholdOwnerIds(ctx, userId);
    if (!(await ownsItem(ctx, ownerIds, itemId))) {
      throw new ConvexError("Your household doesn't own this item yet.");
    }

    const roomKey = await getRoomKey(ctx, userId);
    const existing = await ctx.db
      .query("roomPlacements")
      .withIndex("by_room_item", (q) => q.eq("roomKey", roomKey).eq("itemId", itemId))
      .unique();
    if (existing !== null) return;

    await ctx.db.insert("roomPlacements", { roomKey, itemId, placedAt: Date.now() });
  },
});

export const removeItem = mutation({
  args: { itemId: v.string() },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    const roomKey = await getRoomKey(ctx, userId);
    const existing = await ctx.db
      .query("roomPlacements")
      .withIndex("by_room_item", (q) => q.eq("roomKey", roomKey).eq("itemId", itemId))
      .unique();
    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const setWallpaper = mutation({
  args: { itemId: v.union(v.string(), v.null()) },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    const roomKey = await getRoomKey(ctx, userId);

    if (itemId !== null) {
      const item = getShopItem(itemId);
      if (item === undefined || item.kind !== "wallpaper") {
        throw new ConvexError("That item isn't a wallpaper.");
      }
      const ownerIds = await getHouseholdOwnerIds(ctx, userId);
      if (!(await ownsItem(ctx, ownerIds, itemId))) {
        throw new ConvexError("Your household doesn't own this wallpaper yet.");
      }
    }

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room", (q) => q.eq("roomKey", roomKey))
      .unique();
    if (room === null) {
      await ctx.db.insert("rooms", { roomKey, wallpaperId: itemId ?? undefined });
    } else {
      await ctx.db.patch(room._id, { wallpaperId: itemId ?? undefined });
    }
  },
});
