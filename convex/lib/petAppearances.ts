import { v } from "convex/values";
import type { SpeciesId } from "./species";

export const appearanceValidator = v.union(v.literal("classic"), v.literal("silver"), v.literal("chocolate"), v.literal("sunny"));
export type AppearanceId = "classic" | "silver" | "chocolate" | "sunny";
export const PET_APPEARANCES: Record<SpeciesId, { id: AppearanceId; label: string; color: string }[]> = {
  cat: [{ id: "classic", label: "Ginger tabby", color: "#e99b4e" }, { id: "silver", label: "Silver tabby", color: "#9ca7bc" }],
  dog: [{ id: "classic", label: "Golden puppy", color: "#e7b363" }, { id: "chocolate", label: "Chocolate puppy", color: "#80543e" }],
  bird: [{ id: "classic", label: "Turquoise", color: "#55b7bc" }, { id: "sunny", label: "Sunshine yellow", color: "#edcc55" }],
  snake: [{ id: "classic", label: "Mint", color: "#87bc86" }],
  mouse: [{ id: "classic", label: "Lavender", color: "#b09cb7" }],
  horse: [{ id: "classic", label: "Chestnut", color: "#b66d3d" }],
};
export function isAppearanceForSpecies(species: SpeciesId, appearance: string): boolean {
  return PET_APPEARANCES[species].some((option) => option.id === appearance);
}
export function resolveAppearance(species: SpeciesId, appearance?: string): AppearanceId {
  return PET_APPEARANCES[species].find((option) => option.id === appearance)?.id ?? "classic";
}
