import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemorialCard } from "../components/graveyard/MemorialCard";

export function GraveyardPage() {
  const memorials = useQuery(api.memorials.getMyMemorials);

  if (memorials === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading...</p>;
  }

  if (memorials.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="text-4xl" aria-hidden>
          🌤️
        </span>
        <p className="text-sm text-cocoa-soft">No memories yet - every pet you've raised will be remembered here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <h1 className="font-display text-2xl font-extrabold text-cocoa">Memories</h1>
      {memorials.map((memorial) => (
        <MemorialCard key={memorial._id} {...memorial} />
      ))}
    </div>
  );
}
