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
  const renamePet = useMutation(api.pets.renamePet);
  const [savingPetId, setSavingPetId] = useState<Id<"pets"> | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
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

  async function saveName(petId: Id<"pets">, name: string) {
    setSavingPetId(petId);
    setError(null);
    try {
      await renamePet({ petId, name });
      setNameDrafts((prev) => {
        const next = { ...prev };
        delete next[petId];
        return next;
      });
    } catch {
      setError("Couldn't save that name - try again.");
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
        <p className="mt-1 text-sm text-cocoa-soft">Give your pet a new name or look, any time.</p>
      </div>

      {pets.map((pet) => {
        const config = SPECIES_CONFIG[pet.species as SpeciesId];
        const draft = nameDrafts[pet._id] ?? pet.name;
        const trimmedDraft = draft.trim();
        const canSaveName = trimmedDraft.length > 0 && trimmedDraft !== pet.name && savingPetId !== pet._id;
        return (
          <div key={pet._id} className="flex flex-col gap-3 rounded-cozy bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <PetSprite species={pet.species as SpeciesId} appearance={pet.appearance} small />
              <div className="flex-1">
                <p className="text-xs text-cocoa-soft">{config.label}</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSaveName) void saveName(pet._id, trimmedDraft);
              }}
              className="flex gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setNameDrafts((prev) => ({ ...prev, [pet._id]: e.target.value }))}
                maxLength={24}
                className="flex-1 rounded-xl border border-cream-dark bg-white px-3 py-2 text-sm text-cocoa outline-none focus:border-peach"
              />
              <button
                type="submit"
                disabled={!canSaveName}
                className="rounded-xl bg-peach px-3 py-1.5 text-sm font-bold text-white transition hover:bg-peach-dark disabled:opacity-50"
              >
                Rename
              </button>
            </form>

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
