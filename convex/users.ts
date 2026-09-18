import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { EMPTY_PROGRESS } from "./schema";
import { getShopItem } from "./lib/shopItems";
import { STARTING_PET_SLOTS } from "./lib/constants";
import { mutation, query } from "./_generated/server";
import { eyeColorValidator, genderValidator, hairColorValidator, hairStyleValidator } from "./lib/character";
import { skinToneValidator, accessoryValidator } from "./lib/character";

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
      character: user?.characterGender ? { gender: user.characterGender, hairStyle: user.characterHairStyle ?? "short", eyeColor: user.characterEyeColor ?? "brown", hairColor: user.characterHairColor ?? "chestnut", clothingId: user.characterClothingId, skinTone: user.characterSkinTone, accessory: user.characterAccessory } : null,
    };
  },
});

export const updateCharacter = mutation({
  args: { gender: genderValidator, hairStyle: hairStyleValidator, eyeColor: eyeColorValidator, hairColor: hairColorValidator, clothingId: v.optional(v.string()), skinTone: v.optional(skinToneValidator), accessory: v.optional(accessoryValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not signed in");
    if (args.clothingId) {
      const item = getShopItem(args.clothingId);
      const owned = await ctx.db.query("inventoryItems").withIndex("by_owner_item", (q) => q.eq("ownerId", userId).eq("itemId", args.clothingId!)).unique();
      if (item?.kind !== "clothing" || !owned) throw new ConvexError("Buy this outfit before wearing it.");
    }
    await ctx.db.patch(userId, { characterGender: args.gender, characterHairStyle: args.hairStyle, characterEyeColor: args.eyeColor, characterHairColor: args.hairColor, characterClothingId: args.clothingId });
    await ctx.db.patch(userId, { characterSkinTone: args.skinTone, characterAccessory: args.accessory });
    return null;
  },
});
