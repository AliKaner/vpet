import type { SpeciesId } from "../../../convex/lib/species";
import { PET_APPEARANCES, type AppearanceId } from "../../../convex/lib/petAppearances";
import { PetSprite } from "./PetSprite";
export function AppearancePicker({ species, value, onChange, disabled = false }: {
  species: SpeciesId; value: AppearanceId; onChange: (value: AppearanceId) => void; disabled?: boolean;
}) {
  const options = PET_APPEARANCES[species];
  if (options.length < 2) return null;
  return <fieldset disabled={disabled} className="appearance-picker">
    <legend>Choose their look</legend>
    <div className="appearance-options">
      {options.map((option) => <button key={option.id} type="button" aria-pressed={value === option.id}
        className={`appearance-option ${value === option.id ? "is-selected" : ""}`}
        onClick={() => onChange(option.id)}>
        <PetSprite species={species} appearance={option.id} small />
        <span><i style={{ background: option.color }} aria-hidden="true" />{option.label}</span>
      </button>)}
    </div>
  </fieldset>;
}
