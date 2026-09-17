import {
  CLEAN_CLEANLINESS_GAIN,
  CLEAN_COOLDOWN_MS,
  FEED_COOLDOWN_MS,
  FEED_HAPPINESS_BONUS,
  FEED_HUNGER_GAIN,
  HOUR_MS,
  MINUTE_MS,
} from "./constants";
import type { SpeciesId } from "./species";

export interface CareActionConfig {
  id: string;
  label: string;
  icon: string;
  cooldownMs: number;
  gains: Partial<Record<"hunger" | "cleanliness" | "happiness", number>>;
}

// Every action only ever nudges hunger/cleanliness/happiness - health stays purely
// derived by settleStats. Species differ only in which actions exist and how often
// they're needed, not in the underlying stat model.
//
// The affection action per species (pet/walk/chirp_back/handle/play/exercise) is
// deliberately cooldown-free (0ms) - feeding and cleaning are metered, but showing
// your pet love never is. To keep that from also being a free coin/achievement
// faucet, performCareAction only pays coins and counts toward progress for actions
// that DO have a cooldown.
export const CARE_ACTIONS_BY_SPECIES: Record<SpeciesId, CareActionConfig[]> = {
  cat: [
    { id: "feed", label: "Feed", icon: "🍖", cooldownMs: FEED_COOLDOWN_MS, gains: { hunger: FEED_HUNGER_GAIN, happiness: FEED_HAPPINESS_BONUS } },
    { id: "pet", label: "Pet", icon: "✋", cooldownMs: 0, gains: { happiness: 8 } },
    { id: "clean_litter", label: "Litter", icon: "🧼", cooldownMs: CLEAN_COOLDOWN_MS, gains: { cleanliness: CLEAN_CLEANLINESS_GAIN } },
  ],
  dog: [
    { id: "feed", label: "Feed", icon: "🍖", cooldownMs: FEED_COOLDOWN_MS, gains: { hunger: FEED_HUNGER_GAIN, happiness: FEED_HAPPINESS_BONUS } },
    { id: "walk", label: "Walk", icon: "🦴", cooldownMs: 0, gains: { happiness: 8 } },
    { id: "bathe", label: "Bathe", icon: "🛁", cooldownMs: 60 * MINUTE_MS, gains: { cleanliness: 40 } },
  ],
  bird: [
    { id: "feed", label: "Feed", icon: "🌾", cooldownMs: 20 * MINUTE_MS, gains: { hunger: 20 } },
    { id: "chirp_back", label: "Chirp back", icon: "🎵", cooldownMs: 0, gains: { happiness: 8 } },
    { id: "clean_cage", label: "Clean cage", icon: "🧹", cooldownMs: 40 * MINUTE_MS, gains: { cleanliness: 35 } },
  ],
  snake: [
    { id: "feed", label: "Feed", icon: "🐭", cooldownMs: 24 * HOUR_MS, gains: { hunger: 100 } },
    { id: "handle", label: "Handle", icon: "🤚", cooldownMs: 0, gains: { happiness: 5 } },
    { id: "clean_tank", label: "Clean tank", icon: "🧼", cooldownMs: 12 * HOUR_MS, gains: { cleanliness: 60 } },
  ],
  mouse: [
    { id: "feed", label: "Feed", icon: "🧀", cooldownMs: 15 * MINUTE_MS, gains: { hunger: 18 } },
    { id: "play", label: "Play", icon: "🎡", cooldownMs: 0, gains: { happiness: 8 } },
    { id: "clean_cage", label: "Clean cage", icon: "🧹", cooldownMs: 20 * MINUTE_MS, gains: { cleanliness: 25 } },
  ],
  horse: [
    { id: "feed", label: "Feed", icon: "🌾", cooldownMs: 45 * MINUTE_MS, gains: { hunger: 45 } },
    { id: "groom", label: "Groom", icon: "🪮", cooldownMs: 40 * MINUTE_MS, gains: { cleanliness: 35 } },
    { id: "exercise", label: "Exercise", icon: "🏇", cooldownMs: 0, gains: { happiness: 8 } },
  ],
};
