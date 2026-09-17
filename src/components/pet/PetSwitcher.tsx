import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { SpeciesId } from "../../../convex/lib/species";
import { PetSprite } from "./PetSprite";

type PetSummary = Pick<Doc<"pets">, "_id" | "name" | "species" | "appearance"> & { isMine: boolean };

interface PetSwitcherProps {
  pets: PetSummary[];
  selectedPetId: string;
  onSelect: (petId: string) => void;
}

export function PetSwitcher({ pets, selectedPetId, onSelect }: PetSwitcherProps) {
  const slots = useQuery(api.pets.getMySlots);
  const navigate = useNavigate();
  const myPetsCount = pets.filter((pet) => pet.isMine).length;
  const freeSlots = slots === undefined ? 0 : Math.max(0, slots - myPetsCount);

  if (pets.length <= 1 && freeSlots === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {pets.map((pet) => {
        const selected = pet._id === selectedPetId;
        return (
          <button
            key={pet._id}
            type="button"
            onClick={() => onSelect(pet._id)}
            aria-pressed={selected}
            className={`relative flex shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 px-2 py-1 transition ${
              selected ? "border-peach bg-peach/10" : "border-transparent bg-white/60"
            }`}
          >
            {!pet.isMine && (
              <span className="absolute -right-1 -top-1 text-xs" aria-hidden title="Your partner's pet">
                {"\u{1F91D}"}
              </span>
            )}
            <PetSprite species={pet.species as SpeciesId} appearance={pet.appearance} small />
            <span className="max-w-[72px] truncate text-[11px] font-bold text-cocoa-soft">{pet.name}</span>
          </button>
        );
      })}
      {freeSlots > 0 && (
        <button
          type="button"
          onClick={() => navigate("/create")}
          className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-dashed border-cream-dark px-4 py-3 text-cocoa-soft transition hover:border-peach hover:text-peach-dark"
        >
          <span className="text-xl leading-none">+</span>
          <span className="text-[10px] font-bold">New pet</span>
        </button>
      )}
    </div>
  );
}

