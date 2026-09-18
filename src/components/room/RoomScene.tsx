import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getShopItem } from "../../../convex/lib/shopItems";
import { CharacterAvatar } from "../character/CharacterAvatar";

const WALLPAPERS: Record<string, string> = {
  wallpaper_stripes: "repeating-linear-gradient(90deg, #fdeee0 0 34px, #f8dfcf 34px 38px)",
  wallpaper_party: "radial-gradient(circle at 20% 20%, #fff 0 3px, transparent 4px), #ffe3f1",
  wallpaper_night: "radial-gradient(circle at 20% 25%, #fff8c7 0 2px, transparent 3px), radial-gradient(circle at 80% 35%, #fff8c7 0 2px, transparent 3px), #dfe6ff",
};
const FLOOR: Record<string, string> = {
  floor_wood: "repeating-linear-gradient(0deg, #d9a86c 0 18px, #c99558 19px 21px)",
  floor_tile: "conic-gradient(#eee8dc 25%, #d9d2c4 0 50%, #eee8dc 0 75%, #d9d2c4 0) 0 0 / 34px 34px",
  floor_carpet: "radial-gradient(#c8afd9 1px, transparent 2px) 0 0 / 12px 12px, #d8c3e8",
};
const ATLAS_POSITION: Record<string, string> = {
  furniture_sofa: "0% 0%", furniture_table: "33.333% 0%", furniture_bed: "66.666% 0%", furniture_lamp: "100% 0%",
  furniture_rug: "0% 100%", decor_bookshelf: "33.333% 100%", decor_poster: "66.666% 100%", decor_disco_ball: "100% 100%",
};

function RoomItem({ itemId }: { itemId: string }) {
  const item = getShopItem(itemId);
  if (!item) return null;
  return <span className={`room-item room-item-${item.kind}`} title={item.label} aria-label={item.label}
    style={ATLAS_POSITION[itemId] ? { backgroundPosition: ATLAS_POSITION[itemId] } : undefined}>
    {!ATLAS_POSITION[itemId] && item.icon}
  </span>;
}

export function RoomScene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const room = useQuery(api.decor.getMyRoom);
  const profile = useQuery(api.users.getMyProfile);
  const wallpaper = room?.wallpaperId;
  const floor = room?.floorId;
  const wallpaperItem = wallpaper ? getShopItem(wallpaper) : undefined;
  const floorItem = floor ? getShopItem(floor) : undefined;
  const wallBackground = wallpaper ? (WALLPAPERS[wallpaper] ?? (wallpaperItem?.kind === "wallpaper" ? wallpaperItem.bgColor : undefined)) : undefined;
  const floorBackground = floor ? (FLOOR[floor] ?? (floorItem?.kind === "floor" ? floorItem.bgColor : undefined)) : undefined;
  const placed = room?.placedItemIds ?? [];
  const wallItems = placed.filter((id) => getShopItem(id)?.kind === "decor");
  const floorItems = placed.filter((id) => getShopItem(id)?.kind === "furniture");
  return <section className={`room-scene ${compact ? "room-scene-compact" : ""}`} style={{ background: wallBackground ?? WALLPAPERS.wallpaper_stripes }}>
    <div className="room-wall-decor">{wallItems.map((id) => <RoomItem key={id} itemId={id} />)}</div>
    <div className="room-pet-area">{children}</div>
    <div className="room-floor" style={{ background: floorBackground ?? FLOOR.floor_wood }}>
      {profile?.character && <div className="room-character"><CharacterAvatar character={profile.character} small /><span>You</span></div>}
      {floorItems.map((id) => <RoomItem key={`floor-${id}`} itemId={id} />)}
    </div>
  </section>;
}
