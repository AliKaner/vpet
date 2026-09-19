import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { NavLink } from "react-router-dom";
import { api } from "../../../convex/_generated/api";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition ${
    isActive ? "bg-peach text-white" : "text-cocoa-soft hover:bg-cream-dark"
  }`;

export function NavBar() {
  const { signOut } = useAuthActions();
  const memorials = useQuery(api.memorials.getMyMemorials);
  const profile = useQuery(api.users.getMyProfile);
  const hasMemorials = memorials !== undefined && memorials.length > 0;

  return (
    <header
      className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-display text-lg font-extrabold text-cocoa">Vpet</span>
          {profile !== undefined && (
            <span className="shrink-0 rounded-full bg-sun/40 px-2.5 py-1 text-xs font-bold text-sun-dark">
              {"\u{1FA99}"} {profile.coins}
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-cocoa-soft transition hover:bg-cream-dark"
          >
            Sign out
          </button>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            My Room
          </NavLink>
          <NavLink to="/shop" className={linkClass}>
            Shop
          </NavLink>
          <NavLink to="/activities" className={linkClass}>Town Square</NavLink>
          <NavLink to="/barber" className={linkClass}>
            Barber
          </NavLink>
          <NavLink to="/character" className={linkClass}>
            Character
          </NavLink>
          <NavLink to="/achievements" className={linkClass}>
            Achievements
          </NavLink>
          <NavLink to="/visit" className={linkClass}>
            Visit
          </NavLink>
          <NavLink to="/friends" className={linkClass}>
            Friends
          </NavLink>
          <NavLink to="/partner" className={linkClass}>
            Together
          </NavLink>
          {hasMemorials && (
            <NavLink to="/graveyard" className={linkClass}>
              Graveyard
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
