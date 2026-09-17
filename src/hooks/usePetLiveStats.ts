import { settleStats, type PetVitals } from "../../convex/lib/petMath";
import type { SpeciesId } from "../../convex/lib/species";
import { useNow } from "./useNow";

interface LivePetSnapshot extends PetVitals {
  asOf: number;
  createdAt: number;
  species: string;
}

export interface LiveStats extends PetVitals {
  ageMs: number;
}

/**
 * Ticks a query-projected pet snapshot forward client-side for smooth, real-time
 * stat bars between server syncs. Purely for display - the server (mutations +
 * the evaluateAllPets cron) remains the sole source of truth for actual state.
 */
export function usePetLiveStats(pet: LivePetSnapshot | null | undefined): LiveStats | null {
  const now = useNow();

  if (!pet) return null;

  const settled = settleStats(pet, pet.asOf, now, pet.species as SpeciesId);
  return { ...settled, ageMs: now - pet.createdAt };
}
