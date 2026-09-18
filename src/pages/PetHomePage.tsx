import { useState } from "react";
import { petEmotion } from "../lib/petEmotion";
import type { Doc } from "../../convex/_generated/dataModel";
import { actionPose } from "../lib/petPose";
import { playPetSound, unlockPetSound } from "../lib/petSound";
import { computeMoodBucket } from "../../convex/lib/petMath";
import { SPECIES_CONFIG, type SpeciesId } from "../../convex/lib/species";
import { ActionBar } from "../components/pet/ActionBar";
import { AgeBadge } from "../components/pet/AgeBadge";
import { PetStage } from "../components/pet/PetStage";
import { StatBar } from "../components/pet/StatBar";
import { useNow } from "../hooks/useNow";
import { usePetLiveStats } from "../hooks/usePetLiveStats";
import { RoomScene } from "../components/room/RoomScene";

type ActivePet = Doc<"pets"> & { ageMs: number; asOf: number };

export function PetHomePage({ pet, embedded = false }: { pet: ActivePet; embedded?: boolean }) {
  const live = usePetLiveStats(pet);
  const now = useNow();
  const config = SPECIES_CONFIG[pet.species as SpeciesId];
  const vitals = live ?? pet;
  const mood = computeMoodBucket(vitals);
  const [reaction, setReaction] = useState<{ action: string; id: number; petId: string } | null>(null);
  const [sound, setSound] = useState(false);


  function react(action: string) {

    setReaction({ action, id: Date.now(), petId: pet._id });
    if (sound && window.matchMedia("(hover: hover) and (pointer: fine)").matches) playPetSound(actionPose(action));

  }

  const petContent = <div className={`flex flex-1 flex-col gap-5 ${embedded ? "pet-home-embedded" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-cocoa">{pet.name}</h1>
          <p className="text-xs text-cocoa-soft">
            {config.label}
            {pet.generation > 0 && ` · Generation ${pet.generation}`}
          </p>
        </div>
        <AgeBadge ageMs={live?.ageMs ?? pet.ageMs} lifespanTargetMs={pet.lifespanTargetMs} />
      </div>

      {!embedded ? <RoomScene compact><PetStage species={config.id} appearance={pet.appearance} clothingId={pet.equippedClothingId} mood={mood} emotion={petEmotion(vitals)} reaction={reaction?.petId === pet._id ? reaction : null} onReactionComplete={() => setReaction(null)} ageMs={live?.ageMs ?? pet.ageMs} lifespanTargetMs={pet.lifespanTargetMs} /></RoomScene> : <PetStage species={config.id} appearance={pet.appearance} clothingId={pet.equippedClothingId} mood={mood} emotion={petEmotion(vitals)} reaction={reaction?.petId === pet._id ? reaction : null} onReactionComplete={() => setReaction(null)} ageMs={live?.ageMs ?? pet.ageMs} lifespanTargetMs={pet.lifespanTargetMs} />}
      <button type="button" className="pet-sound-toggle" aria-pressed={sound}
        onClick={() => { if (!sound) unlockPetSound(); setSound(!sound); }}>
        Sound {sound ? "on" : "off"}
      </button>

      <div className="flex flex-col gap-3 rounded-cozy bg-white/70 p-4 shadow-sm">
        <StatBar label="Hunger" value={vitals.hunger} icon="🍖" colorVar="var(--color-stat-hunger)" />
        <StatBar label="Cleanliness" value={vitals.cleanliness} icon="🧼" colorVar="var(--color-stat-clean)" />
        <StatBar label="Happiness" value={vitals.happiness} icon="💖" colorVar="var(--color-stat-happy)" />
        <StatBar label="Health" value={vitals.health} icon="❤️" colorVar="var(--color-stat-health)" />
      </div>

      <ActionBar
        key={pet._id}
        busy={reaction?.petId === pet._id}
        petId={pet._id}
        species={config.id}
        actionCooldowns={pet.actionCooldowns}
        now={now}
        onActionStart={() => { if (sound) unlockPetSound(); }}
        onActionSuccess={react}
      />
    </div>;
  return petContent;
}
