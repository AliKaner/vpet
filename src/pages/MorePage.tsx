import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const LINKS: { to: string; label: string; icon: string; description: string }[] = [
  { to: "/barber", label: "Barber", icon: "✂️", description: "Change your pet's look" },
  { to: "/character", label: "Character", icon: "\u{1F9D1}", description: "Customize your own look" },
  { to: "/achievements", label: "Achievements", icon: "\u{1F3C6}", description: "See what you've unlocked" },
  { to: "/visit", label: "Visit", icon: "\u{1F44B}", description: "Wave at other players' pets" },
  { to: "/friends", label: "Friends", icon: "\u{1F3D8}️", description: "Add friends and see their pets" },
];

export function MorePage() {
  const memorials = useQuery(api.memorials.getMyMemorials);
  const hasMemorials = memorials !== undefined && memorials.length > 0;

  return (
    <div className="flex flex-col gap-3 py-4">
      <h1 className="font-display text-2xl font-extrabold text-cocoa">More</h1>
      <div className="flex flex-col gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-cozy bg-white/70 p-4 shadow-sm transition hover:bg-white"
          >
            <span className="text-2xl" aria-hidden>
              {link.icon}
            </span>
            <div className="flex-1">
              <p className="font-bold text-cocoa">{link.label}</p>
              <p className="text-xs text-cocoa-soft">{link.description}</p>
            </div>
          </Link>
        ))}
        {hasMemorials && (
          <Link
            to="/graveyard"
            className="flex items-center gap-3 rounded-cozy bg-white/70 p-4 shadow-sm transition hover:bg-white"
          >
            <span className="text-2xl" aria-hidden>
              {"\u{1F319}"}
            </span>
            <div className="flex-1">
              <p className="font-bold text-cocoa">Graveyard</p>
              <p className="text-xs text-cocoa-soft">Remember the pets you've raised</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
