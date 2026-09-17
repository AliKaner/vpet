import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { VISIT_COOLDOWN_MS } from "../../../convex/lib/constants";
import { getShopItem } from "../../../convex/lib/shopItems";
import type { SpeciesId } from "../../../convex/lib/species";
import { formatCountdown } from "../../lib/formatDuration";
import { PetSprite } from "../pet/PetSprite";

const MOOD_LABEL: Record<string, string> = {
  great: "Feeling great!",
  content: "Doing okay",
  distressed: "Needs attention",
  critical: "In trouble!",
};

interface VisitCardProps {
  petId: Id<"pets">;
  name: string;
  species: string;
  mood: string;
  equippedClothingId?: string;
  lastVisitedAt?: number;
  now: number;
}

export function VisitCard({ petId, name, species, mood, equippedClothingId, lastVisitedAt, now }: VisitCardProps) {
  const visitPet = useMutation(api.social.visitPet);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clothing = equippedClothingId !== undefined ? getShopItem(equippedClothingId) : undefined;
  const cooldownRemainingMs = lastVisitedAt !== undefined ? Math.max(0, lastVisitedAt + VISIT_COOLDOWN_MS - now) : 0;
  const disabled = busy || cooldownRemainingMs > 0;

  async function handleWave() {
    setBusy(true);
    setError(null);
    try {
      await visitPet({ petId });
    } catch {
      setError("Couldn't visit right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 rounded-cozy bg-white/70 p-3 text-center shadow-sm">
      <div className="relative">
        <PetSprite species={species as SpeciesId} small />
        {clothing && (
          <span className="absolute -right-1 -top-1 text-base" aria-hidden>
            {clothing.icon}
          </span>
        )}
      </div>
      <p className="font-bold text-cocoa">{name}</p>
      <p className="text-[11px] text-cocoa-soft">{MOOD_LABEL[mood] ?? mood}</p>
      <button
        type="button"
        onClick={() => void handleWave()}
        disabled={disabled}
        className="mt-1 rounded-full bg-blossom px-3 py-1 text-xs font-bold text-white transition hover:bg-blossom-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldownRemainingMs > 0 ? formatCountdown(cooldownRemainingMs) : "\u{1F44B} Wave"}
      </button>
      {error && <p className="text-[10px] font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
