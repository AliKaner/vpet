import { NavLink } from "react-router-dom";

const TABS: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: "/", label: "Home", icon: "\u{1F3E0}", end: true },
  { to: "/shop", label: "Shop", icon: "\u{1F6CD}️" },
  { to: "/activities", label: "Town", icon: "\u{1F3D8}️" },
  { to: "/partner", label: "Together", icon: "\u{1F91D}" },
  { to: "/more", label: "More", icon: "☰" },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-bold transition ${
    isActive ? "text-peach-dark" : "text-cocoa-soft"
  }`;

// Mobile-only bottom tab bar (hidden from sm breakpoint up, where NavBar's own
// link row is shown instead) - the 5 most-used destinations, thumb-reachable.
// Everything else lives behind the "More" tab.
export function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-cream-dark bg-cream/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary navigation"
    >
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
          <span className="text-xl leading-none" aria-hidden>
            {tab.icon}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
