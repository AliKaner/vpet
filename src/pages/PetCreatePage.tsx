import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppearancePicker } from "../components/pet/AppearancePicker";
import { resolveAppearance, type AppearanceId } from "../../convex/lib/petAppearances";
import { PetSprite } from "../components/pet/PetSprite";
import { SPECIES_CONFIG, SPECIES_IDS, type SpeciesId } from "../../convex/lib/species";

export function PetCreatePage() {
  const createPet = useMutation(api.pets.createPet);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<SpeciesId>(SPECIES_IDS[0]);
  const [appearance, setAppearance] = useState<AppearanceId>("classic");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createPet({ name, species, appearance: resolveAppearance(species, appearance) });
      navigate("/", { replace: true });
    } catch {
      setError("Couldn't create your pet - give it a name and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Welcome a new pet</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Name it and pick its kind.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-cozy bg-white/80 p-6 shadow-md">
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

        <AppearancePicker species={species} value={resolveAppearance(species, appearance)} onChange={setAppearance} disabled={submitting} />
        {error && <p className="mt-3 text-sm font-semibold text-blossom-dark">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-xl bg-peach px-4 py-2 font-bold text-white shadow-sm transition hover:bg-peach-dark disabled:opacity-60"
        >
          Bring them home
        </button>
      </form>
    </div>
  );
}

