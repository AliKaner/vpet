import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VisitCard } from "../components/social/VisitCard";
import { useNow } from "../hooks/useNow";

export function VisitPage() {
  const visitablePets = useQuery(api.social.listVisitablePets);
  const now = useNow();

  if (visitablePets === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading nearby pets...</p>;
  }

  if (visitablePets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="text-4xl" aria-hidden>
          🏡
        </span>
        <p className="text-sm text-cocoa-soft">No other pets to visit yet - check back once more players join in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <h1 className="font-display text-2xl font-extrabold text-cocoa">Visit</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visitablePets.map((pet) => (
          <VisitCard key={pet.petId} now={now} {...pet} />
        ))}
      </div>
    </div>
  );
}
