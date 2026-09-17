import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { resolveAppearance, type AppearanceId } from "../../convex/lib/petAppearances";
import { SPECIES_CONFIG, type SpeciesId } from "../../convex/lib/species";
import { AppearancePicker } from "../components/pet/AppearancePicker";
import { PetSprite } from "../components/pet/PetSprite";

export function BarberPage() {
  const pets = useQuery(api.pets.getMyPets);
  const setAppearance = useMutation(api.pets.setAppearance);
  const [savingPetId, setSavingPetId] = useState<Id<"pets"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeAppearance(petId: Id<"pets">, appearance: AppearanceId) {
    setSavingPetId(petId);
    setError(null);
    try {
      await setAppearance({ petId, appearance });
    } catch {
      setError("Couldn't save that look - try again.");
    } finally {
      setSavingPetId(null);
    }
  }

  if (pets === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading...</p>;
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="text-4xl" aria-hidden>
          {"✂️"}
        </span>
        <p className="text-sm text-cocoa-soft">You don't have a pet to restyle yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Barber</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Give your pet a new look, any time.</p>
      </div>

      {pets.map((pet) => {
        const config = SPECIES_CONFIG[pet.species as SpeciesId];
        return (
          <div key={pet._id} className="flex flex-col gap-3 rounded-cozy bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <PetSprite species={pet.species as SpeciesId} appearance={pet.appearance} small />
              <div>
                <p className="font-bold text-cocoa">{pet.name}</p>
                <p className="text-xs text-cocoa-soft">{config.label}</p>
              </div>
            </div>
            <AppearancePicker
              species={pet.species as SpeciesId}
              value={resolveAppearance(pet.species as SpeciesId, pet.appearance)}
              onChange={(value) => void changeAppearance(pet._id, value)}
              disabled={savingPetId === pet._id}
            />
          </div>
        );
      })}
      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
