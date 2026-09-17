import { useQuery } from "convex/react";
import type { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { getShopItem } from "../../../convex/lib/shopItems";
import { NavBar } from "./NavBar";

export function AppShell({ children }: { children: ReactNode }) {
  const room = useQuery(api.decor.getMyRoom);
  const activeWallpaper = room?.wallpaperId !== undefined ? getShopItem(room.wallpaperId) : undefined;
  // Only the background token changes site-wide - text/border colors stay put, so
  // contrast stays safe no matter which (deliberately light, pastel) wallpaper is active.
  const backgroundColor = activeWallpaper?.kind === "wallpaper" ? activeWallpaper.bgColor : undefined;

  return (
    <div className="flex min-h-svh flex-col bg-cream transition-colors duration-700" style={{ backgroundColor }}>
      <NavBar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">{children}</main>
    </div>
  );
}
