import { v } from "convex/values";
import type { SpeciesId } from "./species";

export const appearanceValidator = v.union(
  v.literal("classic"), v.literal("silver"), v.literal("chocolate"),
  v.literal("sunny"), v.literal("cream"), v.literal("midnight"), v.literal("rose"),
);
export type AppearanceId = "classic" | "silver" | "chocolate" | "sunny" | "cream" | "midnight" | "rose";
type Appearance = { id: AppearanceId; label: string; color: string; filter?: string };
const options = (...items: Appearance[]): Appearance[] => items;
const classic = (label: string, color: string): Appearance => ({ id: "classic", label, color });
const tint = (id: AppearanceId, label: string, color: string, filter: string): Appearance => ({ id, label, color, filter });
export const PET_APPEARANCES: Record<SpeciesId, Appearance[]> = {
  cat: options(classic("Ginger tabby", "#e99b4e"), { id: "silver", label: "Silver tabby", color: "#9ca7bc" }, tint("cream", "Cream point", "#f2d5a5", "saturate(.65) hue-rotate(14deg)"), tint("midnight", "Midnight", "#45465f", "brightness(.62) saturate(.85)"), tint("rose", "Rose", "#d9869a", "hue-rotate(318deg) saturate(.85)"), tint("sunny", "Sunbeam", "#e8c44f", "hue-rotate(20deg) saturate(1.35)")),
  dog: options(classic("Golden puppy", "#e7b363"), { id: "chocolate", label: "Chocolate puppy", color: "#80543e" }, tint("cream", "Cream puppy", "#f1d9ad", "saturate(.55) brightness(1.08)"), tint("midnight", "Black puppy", "#3b3c47", "brightness(.55) saturate(.8)"), tint("rose", "Rose puppy", "#d88983", "hue-rotate(330deg) saturate(.9)"), tint("sunny", "Sunny puppy", "#f2cf43", "hue-rotate(12deg) saturate(1.4)")),
  bird: options(classic("Turquoise", "#55b7bc"), { id: "sunny", label: "Sunshine yellow", color: "#edcc55" }, tint("cream", "Cloud white", "#eee8d5", "grayscale(.6) brightness(1.2)"), tint("midnight", "Night blue", "#5967a5", "hue-rotate(40deg) saturate(.9)"), tint("rose", "Berry pink", "#dc87ae", "hue-rotate(295deg) saturate(1.1)"), tint("chocolate", "Cocoa", "#a17a5e", "sepia(.65) saturate(.8)")),
  snake: options(classic("Mint", "#87bc86"), tint("cream", "Sand", "#d4b773", "sepia(.5) saturate(.8)"), tint("midnight", "Indigo", "#5368a1", "hue-rotate(45deg) saturate(.9)"), tint("rose", "Coral", "#d58d87", "hue-rotate(315deg) saturate(.8)"), tint("sunny", "Lemon", "#d5c755", "hue-rotate(10deg) saturate(1.2)"), tint("chocolate", "Moss", "#7f9564", "sepia(.35) saturate(.7)")),
  mouse: options(classic("Lavender", "#b09cb7"), tint("cream", "Vanilla", "#e9d2af", "sepia(.45) saturate(.7) brightness(1.08)"), tint("midnight", "Slate", "#69758e", "grayscale(.35) brightness(.8)"), tint("rose", "Strawberry", "#d58aa2", "hue-rotate(325deg) saturate(.9)"), tint("sunny", "Honey", "#d3b656", "sepia(.75) saturate(1.1)"), tint("chocolate", "Cocoa", "#9a6c59", "sepia(.55) saturate(.85)")),
  horse: options(classic("Chestnut", "#b66d3d"), tint("cream", "Palomino", "#dfc277", "sepia(.65) saturate(.8) brightness(1.12)"), tint("midnight", "Raven", "#4c4c56", "brightness(.58) saturate(.75)"), tint("rose", "Rosewood", "#ae665f", "hue-rotate(330deg) saturate(.85)"), tint("sunny", "Golden", "#d2a849", "sepia(.6) saturate(1.2)"), tint("chocolate", "Bay brown", "#82513f", "sepia(.35) saturate(.9)")),
};
export function appearanceDetails(species: SpeciesId, appearance?: string): Appearance {
  return PET_APPEARANCES[species].find((option) => option.id === appearance) ?? PET_APPEARANCES[species][0];
}
export function isAppearanceForSpecies(species: SpeciesId, appearance: string): boolean {
  return PET_APPEARANCES[species].some((option) => option.id === appearance);
}
export function resolveAppearance(species: SpeciesId, appearance?: string): AppearanceId {
  return PET_APPEARANCES[species].find((option) => option.id === appearance)?.id ?? "classic";
}
