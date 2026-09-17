import type { Doc } from "../../convex/_generated/dataModel";
import { computeMoodBucket } from "../../convex/lib/petMath";
import { SPECIES_CONFIG, type SpeciesId } from "../../convex/lib/species";
import { ActionBar } from "../components/pet/ActionBar";
import { AgeBadge } from "../components/pet/AgeBadge";
import { PetStage } from "../components/pet/PetStage";
import { StatBar } from "../components/pet/StatBar";
import { useNow } from "../hooks/useNow";
import { usePetLiveStats } from "../hooks/usePetLiveStats";

type ActivePet = Doc<"pets"> & { ageMs: number; asOf: number };

export function PetHomePage({ pet }: { pet: ActivePet }) {
  const live = usePetLiveStats(pet);
  const now = useNow();
  const config = SPECIES_CONFIG[pet.species as SpeciesId];
  const vitals = live ?? pet;
  const mood = computeMoodBucket(vitals);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-cocoa">{pet.name}</h1>
          <p className="text-xs text-cocoa-soft">{config.label}</p>
        </div>
        <AgeBadge ageMs={live?.ageMs ?? pet.ageMs} lifespanTargetMs={pet.lifespanTargetMs} />
      </div>

      <PetStage emoji={config.emoji} mood={mood} />

      <div className="flex flex-col gap-3 rounded-cozy bg-white/70 p-4 shadow-sm">
        <StatBar label="Hunger" value={vitals.hunger} icon="🍖" colorVar="var(--color-stat-hunger)" />
        <StatBar label="Cleanliness" value={vitals.cleanliness} icon="🧼" colorVar="var(--color-stat-clean)" />
        <StatBar label="Happiness" value={vitals.happiness} icon="💖" colorVar="var(--color-stat-happy)" />
        <StatBar label="Health" value={vitals.health} icon="❤️" colorVar="var(--color-stat-health)" />
      </div>

      <ActionBar
        petId={pet._id}
        lastFedAt={pet.lastFedAt}
        lastPettedAt={pet.lastPettedAt}
        lastCleanedAt={pet.lastCleanedAt}
        now={now}
      />
    </div>
  );
}
