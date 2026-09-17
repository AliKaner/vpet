import { computeLifeStage, type LifeStage } from "../../../convex/lib/petMath";

const STAGE_LABEL: Record<LifeStage, string> = {
  baby: "Baby",
  young: "Young",
  adult: "Adult",
  senior: "Senior",
};

const STAGE_EMOJI: Record<LifeStage, string> = {
  baby: "🐣",
  young: "🌱",
  adult: "🌻",
  senior: "🌙",
};

interface AgeBadgeProps {
  ageMs: number;
  lifespanTargetMs: number;
}

export function AgeBadge({ ageMs, lifespanTargetMs }: AgeBadgeProps) {
  const stage = computeLifeStage(ageMs, lifespanTargetMs);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-3 py-1 text-xs font-bold text-cocoa-soft">
      <span aria-hidden>{STAGE_EMOJI[stage]}</span>
      {STAGE_LABEL[stage]}
    </span>
  );
}
