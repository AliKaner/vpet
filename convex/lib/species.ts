export type SpeciesId = "cat" | "dog";

export interface SpeciesConfig {
  id: SpeciesId;
  label: string;
  emoji: string;
  blurb: string;
  hungerDecayMult: number;
  cleanlinessDecayMult: number;
  happinessDecayMult: number;
}

// Phase 1 ships two species with (deliberately) near-identical mechanics to prove
// out the "species is just config" pattern. Real per-species mechanics (walks for
// dogs, grooming for horses, etc.) arrive in a later phase alongside more species -
// at that point this file grows, nothing else needs to change.
export const SPECIES_CONFIG: Record<SpeciesId, SpeciesConfig> = {
  cat: {
    id: "cat",
    label: "Cat",
    emoji: "\u{1F431}",
    blurb: "Independent and tidy - grooms itself, so cleanliness fades a little slower.",
    hungerDecayMult: 1,
    cleanlinessDecayMult: 0.85,
    happinessDecayMult: 1,
  },
  dog: {
    id: "dog",
    label: "Dog",
    emoji: "\u{1F436}",
    blurb: "Affectionate and social - craves attention, so happiness fades a little faster.",
    hungerDecayMult: 1,
    cleanlinessDecayMult: 1,
    happinessDecayMult: 1.1,
  },
};

export const SPECIES_IDS = Object.keys(SPECIES_CONFIG) as SpeciesId[];

export function isSpeciesId(value: string): value is SpeciesId {
  return value in SPECIES_CONFIG;
}
