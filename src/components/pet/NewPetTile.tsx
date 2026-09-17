import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";

export function NewPetTile({ myPetsCount }: { myPetsCount: number }) {
  const slots = useQuery(api.pets.getMySlots);
  const navigate = useNavigate();
  const freeSlots = slots === undefined ? 0 : Math.max(0, slots - myPetsCount);

  if (freeSlots === 0) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/create")}
      className="flex w-72 shrink-0 flex-col items-center justify-center gap-1 rounded-cozy border-2 border-dashed border-cream-dark py-10 text-cocoa-soft transition hover:border-peach hover:text-peach-dark"
    >
      <span className="text-3xl leading-none">+</span>
      <span className="text-xs font-bold">New pet</span>
    </button>
  );
}
