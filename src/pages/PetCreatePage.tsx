import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AppearancePicker } from "../components/pet/AppearancePicker";
import { PET_APPEARANCES, resolveAppearance, type AppearanceId } from "../../convex/lib/petAppearances";
import { PetSprite } from "../components/pet/PetSprite";
import { SPECIES_CONFIG, SPECIES_IDS, type SpeciesId } from "../../convex/lib/species";

export function PetCreatePage() {
  const createPet = useMutation(api.pets.createPet);
  const memorials = useQuery(api.memorials.getMyMemorials);
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<SpeciesId>(SPECIES_IDS[0]);
  const [appearance, setAppearance] = useState<AppearanceId>("classic");
  const [parentMemorialId, setParentMemorialId] = useState<Id<"memorials"> | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const eligibleParents = (memorials ?? []).filter((m) => m.cause === "old_age");
  const hasColorChoice = PET_APPEARANCES[species].length > 1;

  async function finishCreating() {
    setError(null);
    setSubmitting(true);
    try {
      await createPet({
        name,
        species,
        appearance: resolveAppearance(species, appearance),
        parentMemorialId: parentMemorialId === "" ? undefined : parentMemorialId,
      });
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't create your pet - give it a name and try again.");
      setSubmitting(false);
    }
  }

  function handleContinue(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) return;
    // Nothing to choose on a second screen for this species - just create it.
    if (!hasColorChoice && eligibleParents.length === 0) {
      void finishCreating();
      return;
    }
    setStep(2);
  }

  function handleConfirm(event: FormEvent) {
    event.preventDefault();
    void finishCreating();
  }

  if (step === 2) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold text-cocoa">Make {name} their own</h1>
          <p className="mt-1 text-sm text-cocoa-soft">Almost there.</p>
        </div>
        <form onSubmit={handleConfirm} className="w-full max-w-sm rounded-cozy bg-white/80 p-6 shadow-md">
          {hasColorChoice && (
            <AppearancePicker species={species} value={resolveAppearance(species, appearance)} onChange={setAppearance} disabled={submitting} />
          )}

          {eligibleParents.length > 0 && (
            <label className="mt-4 flex flex-col gap-1 text-sm font-semibold text-cocoa-soft">
              In memory of (optional)
              <select
                value={parentMemorialId}
                onChange={(e) => setParentMemorialId(e.target.value as Id<"memorials"> | "")}
                className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-cocoa outline-none focus:border-peach"
              >
                <option value="">A fresh start</option>
                {eligibleParents.map((memorial) => (
                  <option key={memorial._id} value={memorial._id}>
                    Child of {memorial.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-blossom-dark">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="rounded-xl border border-cream-dark px-4 py-2 font-bold text-cocoa-soft transition hover:bg-cream-dark disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-peach px-4 py-2 font-bold text-white shadow-sm transition hover:bg-peach-dark disabled:opacity-60"
            >
              Bring them home
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Welcome a new pet</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Name it and pick its kind.</p>
      </div>
      <form onSubmit={handleContinue} className="w-full max-w-sm rounded-cozy bg-white/80 p-6 shadow-md">
        <label className="flex flex-col gap-1 text-sm font-semibold text-cocoa-soft">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            required
            className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-cocoa outline-none focus:border-peach"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {SPECIES_IDS.map((id) => {
            const config = SPECIES_CONFIG[id];
            const selected = species === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => { setSpecies(id); setAppearance("classic"); }}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition ${
                  selected ? "border-peach bg-peach/10" : "border-cream-dark bg-white"
                }`}
              >
                <PetSprite species={id} small />
                <span className="font-bold text-cocoa">{config.label}</span>
                <span className="text-[11px] leading-snug text-cocoa-soft">{config.blurb}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-blossom-dark">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-peach px-4 py-2 font-bold text-white shadow-sm transition hover:bg-peach-dark disabled:opacity-60"
        >
          {submitting ? "Bringing them home..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
