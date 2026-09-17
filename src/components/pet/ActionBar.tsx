import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CARE_ACTIONS_BY_SPECIES } from "../../../convex/lib/careActions";
import type { SpeciesId } from "../../../convex/lib/species";
import { ActionButton } from "./ActionButton";

interface ActionBarProps {
  petId: Id<"pets">;
  species: SpeciesId;
  actionCooldowns: Record<string, number> | undefined;
  now: number;
  busy?: boolean;
  onActionStart: () => void;
  onActionSuccess: (action: string) => void;
}

function remainingCooldown(lastAt: number | undefined, cooldownMs: number, now: number): number {
  if (lastAt === undefined) return 0;
  return Math.max(0, lastAt + cooldownMs - now);
}

export function ActionBar({ petId, species, actionCooldowns, now, busy = false, onActionStart, onActionSuccess }: ActionBarProps) {
  const performCareAction = useMutation(api.pets.performCareAction);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const actions = CARE_ACTIONS_BY_SPECIES[species];
  const accentClasses = ["bg-peach hover:bg-peach-dark", "bg-blossom hover:bg-blossom-dark", "bg-sky hover:bg-sky-dark"];

  async function run(actionId: string) {
    if (pending || busy) return;
    onActionStart();
    setPending(actionId);
    setError(null);
    try {
      await performCareAction({ petId, actionId });
      onActionSuccess(actionId);
    } catch {
      setError("That didn't work - try again in a moment.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {actions.map((action, index) => (
          <ActionButton
            key={action.id}
            label={action.label}
            icon={action.icon}
            accentClass={accentClasses[index % accentClasses.length]}
            cooldownRemainingMs={remainingCooldown(actionCooldowns?.[action.id], action.cooldownMs, now)}
            pending={pending !== null || busy}
            onPress={() => void run(action.id)}
          />
        ))}
      </div>
      {error && <p className="text-center text-xs font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
