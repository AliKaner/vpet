import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CLEAN_COOLDOWN_MS, FEED_COOLDOWN_MS, PET_COOLDOWN_MS } from "../../../convex/lib/constants";
import { ActionButton } from "./ActionButton";

interface ActionBarProps {
  petId: Id<"pets">;
  lastFedAt?: number;
  lastPettedAt?: number;
  lastCleanedAt?: number;
  now: number;
}

type ActionKind = "feed" | "pet" | "clean";

function remainingCooldown(lastAt: number | undefined, cooldownMs: number, now: number): number {
  if (lastAt === undefined) return 0;
  return Math.max(0, lastAt + cooldownMs - now);
}

export function ActionBar({ petId, lastFedAt, lastPettedAt, lastCleanedAt, now }: ActionBarProps) {
  const feedPet = useMutation(api.pets.feedPet);
  const petPet = useMutation(api.pets.petPet);
  const cleanPet = useMutation(api.pets.cleanPet);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ActionKind | null>(null);

  async function run(action: ActionKind, fn: () => Promise<unknown>) {
    setPending(action);
    setError(null);
    try {
      await fn();
    } catch {
      setError("That didn't work - try again in a moment.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <ActionButton
          label="Feed"
          icon="🍖"
          accentClass="bg-peach hover:bg-peach-dark"
          cooldownRemainingMs={remainingCooldown(lastFedAt, FEED_COOLDOWN_MS, now)}
          pending={pending === "feed"}
          onPress={() => void run("feed", () => feedPet({ petId }))}
        />
        <ActionButton
          label="Pet"
          icon="✋"
          accentClass="bg-blossom hover:bg-blossom-dark"
          cooldownRemainingMs={remainingCooldown(lastPettedAt, PET_COOLDOWN_MS, now)}
          pending={pending === "pet"}
          onPress={() => void run("pet", () => petPet({ petId }))}
        />
        <ActionButton
          label="Clean"
          icon="🧼"
          accentClass="bg-sky hover:bg-sky-dark"
          cooldownRemainingMs={remainingCooldown(lastCleanedAt, CLEAN_COOLDOWN_MS, now)}
          pending={pending === "clean"}
          onPress={() => void run("clean", () => cleanPet({ petId }))}
        />
      </div>
      {error && <p className="text-center text-xs font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
