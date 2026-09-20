import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { getShopItem } from "../../../convex/lib/shopItems";
import { NavBar } from "./NavBar";
import { BottomTabBar } from "./BottomTabBar";
import { useLocation } from "react-router-dom";

export function AppShell({ children }: { children: ReactNode }) {
  const home=useLocation().pathname==="/";
  const room = useQuery(api.decor.getMyRoom);
  const activeWallpaper = room?.wallpaperId !== undefined ? getShopItem(room.wallpaperId) : undefined;
  // Only the background token changes site-wide - text/border colors stay put, so
  // contrast stays safe no matter which (deliberately light, pastel) wallpaper is active.
  const backgroundColor = activeWallpaper?.kind === "wallpaper" ? activeWallpaper.bgColor : undefined;

  return (
    <div className="flex min-h-svh flex-col bg-cream transition-colors duration-700" style={{ backgroundColor }}>
      <NavBar />
      <main
        className={`mx-auto flex w-full flex-1 flex-col px-4 pb-20 ${
          home ? "home-main pt-3 sm:pb-3" : "max-w-2xl pt-6 sm:pb-6"
        }`}
      >
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
