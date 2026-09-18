import { v } from "convex/values";
export const skinToneValidator = v.union(v.literal("peach"), v.literal("warm"), v.literal("tan"), v.literal("deep"));
export const accessoryValidator = v.union(v.literal("none"), v.literal("glasses"), v.literal("freckles"));
export const genderValidator = v.union(v.literal("feminine"), v.literal("masculine"), v.literal("neutral"));
export const hairStyleValidator = v.union(v.literal("bob"), v.literal("curly"), v.literal("short"), v.literal("long"), v.literal("bun"));
export const eyeColorValidator = v.union(v.literal("brown"), v.literal("green"), v.literal("blue"), v.literal("hazel"), v.literal("violet"));
export const hairColorValidator = v.union(v.literal("chestnut"), v.literal("black"), v.literal("blonde"), v.literal("pink"), v.literal("blue"));
export type Character = { gender: "feminine" | "masculine" | "neutral"; hairStyle: "bob" | "curly" | "short" | "long" | "bun"; eyeColor: "brown" | "green" | "blue" | "hazel" | "violet"; hairColor: "chestnut" | "black" | "blonde" | "pink" | "blue"; clothingId?: string; skinTone?: "peach" | "warm" | "tan" | "deep"; accessory?: "none" | "glasses" | "freckles" };
