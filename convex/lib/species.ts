export type SpeciesId = "cat" | "dog" | "bird" | "snake" | "mouse" | "horse";

export interface SpeciesConfig {
  id: SpeciesId;
  label: string;
  emoji: string;
  blurb: string;
  hungerDecayMult: number;
  cleanlinessDecayMult: number;
  happinessDecayMult: number;
}

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
  bird: {
    id: "bird",
    label: "Bird",
    emoji: "\u{1F426}",
    blurb: "Small and quick-metabolism - gets hungry faster, but its cage is easy to keep tidy.",
    hungerDecayMult: 1.2,
    cleanlinessDecayMult: 0.8,
    happinessDecayMult: 1,
  },
  snake: {
    id: "snake",
    label: "Snake",
    emoji: "\u{1F40D}",
    blurb: "Low-maintenance - barely eats and rarely needs attention, but is slow to cheer up.",
    hungerDecayMult: 0.3,
    cleanlinessDecayMult: 0.5,
    happinessDecayMult: 0.6,
  },
  mouse: {
    id: "mouse",
    label: "Mouse",
    emoji: "\u{1F42D}",
    blurb: "Tiny and busy - eats often and its little habitat gets messy fast.",
    hungerDecayMult: 1.3,
    cleanlinessDecayMult: 1.3,
    happinessDecayMult: 1,
  },
  horse: {
    id: "horse",
    label: "Horse",
    emoji: "\u{1F434}",
    blurb: "Big appetite and needs real exercise, but a sturdy, steady temperament.",
    hungerDecayMult: 1.3,
    cleanlinessDecayMult: 1,
    happinessDecayMult: 0.8,
  },
};

export const SPECIES_IDS = Object.keys(SPECIES_CONFIG) as SpeciesId[];

export function isSpeciesId(value: string): value is SpeciesId {
  return value in SPECIES_CONFIG;
}
