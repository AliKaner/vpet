import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { getShopItem, isPlaceable, isWallFurniture } from "./lib/shopItems";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { HOME_LEVELS, homeLevel } from "./lib/homeLevels";
import { BASE_TILES,MAX_TILES,availableTiles,onRoomTile,tilePrice } from "./lib/roomTiles";
const areaValidator=v.union(v.literal("room"),v.literal("garden"));

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
  returns: v.object({ level:v.number(),tiles:v.array(v.object({x:v.number(),y:v.number()})),tilePurchases:v.number(),wallpaperId: v.optional(v.string()), floorId: v.optional(v.string()), placedItemIds: v.array(v.string()), placements: v.array(v.object({ itemId: v.string(), x: v.optional(v.number()), y: v.optional(v.number()),tileX:v.optional(v.number()),tileY:v.optional(v.number()), flipped: v.optional(v.boolean()),area:v.optional(areaValidator) })) }),
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
      level:room?.level ?? 1,
      tiles:room?.tiles??BASE_TILES,tilePurchases:room?.tilePurchases??0,
      wallpaperId: room?.wallpaperId,
      floorId: room?.floorId,
      placedItemIds: placements.map((p) => p.itemId),
      placements: placements.map(({ itemId, x, y, tileX,tileY,flipped,area }) => ({ itemId, x, y, tileX,tileY,flipped,area })),
    };
  },
});

export const moveItem = mutation({
  args: { itemId: v.string(), x: v.number(), y: v.number(), flipped: v.boolean(),grid:v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, { itemId, x, y, flipped,grid }) => {
    const userId = await requireUserId(ctx);
    if(![x,y].every(Number.isFinite)) throw new ConvexError("Invalid position.");
    const roomKey = await getRoomKey(ctx, userId);
    const row = await ctx.db.query("roomPlacements").withIndex("by_room_item", (q) => q.eq("roomKey", roomKey).eq("itemId", itemId)).unique();
    if (!row) throw new ConvexError("Place this item first.");
    if (!(await ownsItem(ctx, await getHouseholdOwnerIds(ctx, userId), itemId))) throw new ConvexError("Your household doesn't own this item.");
    if(grid && row.area!=="garden") {
      const room=await ctx.db.query("rooms").withIndex("by_room",q=>q.eq("roomKey",roomKey)).unique();
      if(!onRoomTile(room?.tiles??BASE_TILES,x/25,y/25)) throw new ConvexError("Buy this floor tile before placing furniture on it.");
      await ctx.db.patch(row._id,{tileX:x/25,tileY:y/25,flipped});return null;
    }
    if(![x,y].every(n=>n>=8&&n<=92)) throw new ConvexError("Keep furniture inside the room.");
    await ctx.db.patch(row._id, { x, y, flipped,tileX:undefined,tileY:undefined });
    return null;
  },
});

// Everything decor/furniture/wallpaper/floor that either you or your partner own -
// the shared pool available to use in your shared room.
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
        if (item?.kind === "decor" || item?.kind === "furniture" || item?.kind === "wallpaper" || item?.kind === "floor") {
          itemIds.add(row.itemId);
        }
      }
    }
    return Array.from(itemIds);
  },
});

export const placeItem = mutation({
  args: { itemId: v.string(),area:v.optional(areaValidator) },
  returns:v.null(),
  handler: async (ctx, { itemId,area="room" }) => {
    const userId = await requireUserId(ctx);
    const item = getShopItem(itemId);
    if (item === undefined || !isPlaceable(item)) {
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
    if (existing !== null) return null;
    const room=await ctx.db.query("rooms").withIndex("by_room",q=>q.eq("roomKey",roomKey)).unique();
    const limits=homeLevel(room?.level);
    const placements=await ctx.db.query("roomPlacements").withIndex("by_room",q=>q.eq("roomKey",roomKey)).take(201);
    const capacity=area==="room"?limits.indoor+(room?.tilePurchases??0)*2:limits.garden;
    if(placements.filter(p=>(p.area ?? "room")===area).length>=capacity) throw new ConvexError("Upgrade your home to make more space.");
    if(isWallFurniture(item.id) && area==="garden") throw new ConvexError("Wall decorations belong inside.");
    const count=placements.filter(p=>(p.area ?? "room")===area).length;

    await ctx.db.insert("roomPlacements", { roomKey,itemId,area,placedAt:Date.now(),x:20+(count%4)*20,y:20+Math.floor(count/4)%4*20 });
    return null;
  },
});

export const upgradeHome=mutation({
  args:{expectedLevel:v.number()},returns:v.number(),
  handler:async(ctx,{expectedLevel})=>{
    const userId=await requireUserId(ctx);
    const roomKey=await getRoomKey(ctx,userId);
    const room=await ctx.db.query("rooms").withIndex("by_room",q=>q.eq("roomKey",roomKey)).unique();
    const current=room?.level ?? 1;
    if(current!==expectedLevel) throw new ConvexError("Your home has already changed. Check the new level.");
    const next=HOME_LEVELS[current];
    if(!next) throw new ConvexError("Your home is already at its largest size.");
    const user=await ctx.db.get(userId);
    if(!user || (user.coins ?? 0)<next.price) throw new ConvexError("Not enough coins to expand your home.");
    await ctx.db.patch(userId,{coins:(user.coins ?? 0)-next.price});
    if(room) await ctx.db.patch(room._id,{level:next.level});
    else await ctx.db.insert("rooms",{roomKey,level:next.level});
    return next.level;
  },
});

export const buyTile=mutation({
  args:{x:v.number(),y:v.number(),expectedPurchases:v.number()},returns:v.number(),
  handler:async(ctx,{x,y,expectedPurchases})=>{
    const userId=await requireUserId(ctx),roomKey=await getRoomKey(ctx,userId);
    const room=await ctx.db.query("rooms").withIndex("by_room",q=>q.eq("roomKey",roomKey)).unique();
    const tiles=room?.tiles??BASE_TILES,purchases=room?.tilePurchases??0;
    if(expectedPurchases!==purchases) throw new ConvexError("Your room changed. Check the updated tile price.");
    if(tiles.length>=MAX_TILES) throw new ConvexError("Your plot is fully built.");
    if(!Number.isInteger(x)||!Number.isInteger(y)||!availableTiles(tiles).some(t=>t.x===x&&t.y===y)) throw new ConvexError("Choose an empty tile beside your existing floor.");
    const price=tilePrice(purchases),user=await ctx.db.get(userId);
    if(!user||(user.coins??0)<price) throw new ConvexError("Not enough coins for this tile.");
    await ctx.db.patch(userId,{coins:(user.coins??0)-price});
    const update={tiles:[...tiles,{x,y}],tilePurchases:purchases+1};
    if(room) await ctx.db.patch(room._id,update);else await ctx.db.insert("rooms",{roomKey,...update});
    return price;
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

async function setRoomStyle(
  ctx: MutationCtx,
  userId: Id<"users">,
  slot: "wallpaperId" | "floorId",
  expectedKind: "wallpaper" | "floor",
  itemId: string | null,
) {
  const roomKey = await getRoomKey(ctx, userId);

  if (itemId !== null) {
    const item = getShopItem(itemId);
    if (item === undefined || item.kind !== expectedKind) {
      throw new ConvexError(`That item isn't a ${expectedKind}.`);
    }
    const ownerIds = await getHouseholdOwnerIds(ctx, userId);
    if (!(await ownsItem(ctx, ownerIds, itemId))) {
      throw new ConvexError(`Your household doesn't own this ${expectedKind} yet.`);
    }
  }

  const room = await ctx.db
    .query("rooms")
    .withIndex("by_room", (q) => q.eq("roomKey", roomKey))
    .unique();
  if (room === null) {
    await ctx.db.insert("rooms", { roomKey, [slot]: itemId ?? undefined });
  } else {
    await ctx.db.patch(room._id, { [slot]: itemId ?? undefined });
  }
}

export const setWallpaper = mutation({
  args: { itemId: v.union(v.string(), v.null()) },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    await setRoomStyle(ctx, userId, "wallpaperId", "wallpaper", itemId);
  },
});

export const setFloor = mutation({
  args: { itemId: v.union(v.string(), v.null()) },
  handler: async (ctx, { itemId }) => {
    const userId = await requireUserId(ctx);
    await setRoomStyle(ctx, userId, "floorId", "floor", itemId);
  },
});
