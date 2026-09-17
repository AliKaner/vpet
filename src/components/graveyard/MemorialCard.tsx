import { SPECIES_CONFIG, type SpeciesId } from "../../../convex/lib/species";
import { formatAge } from "../../lib/formatDuration";

interface MemorialCardProps {
  name: string;
  species: string;
  bornAt: number;
  diedAt: number;
  ageAtDeathMs: number;
  cause: "neglect" | "old_age";
  grantedChildSlot: boolean;
  generation?: number;
  continuedByName?: string;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function MemorialCard({
  name,
  species,
  bornAt,
  diedAt,
  ageAtDeathMs,
  cause,
  grantedChildSlot,
  generation,
  continuedByName,
}: MemorialCardProps) {
  const config = SPECIES_CONFIG[species as SpeciesId] as (typeof SPECIES_CONFIG)[SpeciesId] | undefined;

  return (
    <div className="rounded-cozy border border-cream-dark bg-white/70 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {config?.emoji ?? "🐾"}
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-cocoa">
            {name}
            {generation !== undefined && generation > 0 && (
              <span className="ml-1.5 text-xs font-bold text-cocoa-soft">Gen {generation}</span>
            )}
          </p>
          <p className="text-xs text-cocoa-soft">
            {dateFormatter.format(bornAt)} - {dateFormatter.format(diedAt)} - lived {formatAge(ageAtDeathMs)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-1 font-bold ${
            cause === "old_age" ? "bg-mint/40 text-mint-dark" : "bg-blossom/40 text-blossom-dark"
          }`}
        >
          {cause === "old_age" ? "Old age" : "Neglected"}
        </span>
        {grantedChildSlot && (
          <span className="rounded-full bg-sun/40 px-2 py-1 font-bold text-sun-dark">+1 pet slot earned</span>
        )}
        {continuedByName && (
          <span className="rounded-full bg-peach/30 px-2 py-1 font-bold text-peach-dark">
            Lineage continues with {continuedByName}
          </span>
        )}
      </div>
    </div>
  );
}
