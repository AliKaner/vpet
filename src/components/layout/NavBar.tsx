import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { NavLink } from "react-router-dom";
import { api } from "../../../convex/_generated/api";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-bold transition ${
    isActive ? "bg-peach text-white" : "text-cocoa-soft hover:bg-cream-dark"
  }`;

export function NavBar() {
  const { signOut } = useAuthActions();
  const memorials = useQuery(api.memorials.getMyMemorials);
  const hasMemorials = memorials !== undefined && memorials.length > 0;

  return (
    <header
      className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-extrabold text-cocoa">Vpet</span>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          {hasMemorials && (
            <NavLink to="/graveyard" className={linkClass}>
              Graveyard
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="ml-1 rounded-full px-3 py-1.5 text-sm font-bold text-cocoa-soft transition hover:bg-cream-dark"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
