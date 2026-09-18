import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { SHOP_CATALOG, type ShopItem } from "../../../convex/lib/shopItems";

const groups: { kind: ShopItem["kind"]; label: string }[] = [
  { kind: "wallpaper", label: "Wallpaper" }, { kind: "floor", label: "Floor" },
  { kind: "decor", label: "Wall decor" }, { kind: "furniture", label: "Furniture" },
];

export function RoomControls() {
  const room = useQuery(api.decor.getMyRoom);
  const owned = useQuery(api.decor.getMyDecorInventory);
  const place = useMutation(api.decor.placeItem);
  const remove = useMutation(api.decor.removeItem);
  const setWallpaper = useMutation(api.decor.setWallpaper);
  const setFloor = useMutation(api.decor.setFloor);
  const [error, setError] = useState<string | null>(null);
  if (!room || !owned) return <p className="text-center text-xs text-cocoa-soft">Loading room controls…</p>;
  const ownedSet = new Set(owned);
  const placed = new Set(room.placedItemIds);
  async function toggle(item: ShopItem) {
    try { setError(null); if (placed.has(item.id)) await remove({ itemId: item.id }); else await place({ itemId: item.id }); }
    catch { setError("This room item could not be changed."); }
  }
  async function choose(kind: "wallpaper" | "floor", itemId: string | null) {
    try { setError(null); if (kind === "wallpaper") await setWallpaper({ itemId }); else await setFloor({ itemId }); }
    catch { setError("This room style could not be changed."); }
  }
  return <section className="room-controls" aria-label="Decorate your room">
    <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold text-cocoa">Make the room yours</h2><p className="text-xs text-cocoa-soft">Tap an owned item to place or remove it. Changes appear above instantly.</p></div><span aria-hidden>🛋️</span></div>
    {groups.map(({ kind, label }) => <div key={kind} className="room-control-group"><h3>{label}</h3><div className="room-control-items">
      {kind === "wallpaper" && <button type="button" className={!room.wallpaperId ? "selected" : ""} onClick={() => void choose("wallpaper", null)}>Default</button>}
      {kind === "floor" && <button type="button" className={!room.floorId ? "selected" : ""} onClick={() => void choose("floor", null)}>Default</button>}
      {SHOP_CATALOG.filter((item) => item.kind === kind && ownedSet.has(item.id)).map((item) => {
        const selected = kind === "wallpaper" ? room.wallpaperId === item.id : kind === "floor" ? room.floorId === item.id : placed.has(item.id);
        return <button type="button" key={item.id} className={selected ? "selected" : ""} onClick={() => void (kind === "wallpaper" || kind === "floor" ? choose(kind, item.id) : toggle(item))}>
          <span aria-hidden>{item.icon}</span> {item.label} <small>{selected ? "✓" : kind === "wallpaper" || kind === "floor" ? "set" : "add"}</small>
        </button>;
      })}
      {!SHOP_CATALOG.some((item) => item.kind === kind && ownedSet.has(item.id)) && <span className="room-empty">Buy more in Shop</span>}
    </div></div>)}
    {error && <p role="alert" className="text-xs font-bold text-blossom-dark">{error}</p>}
  </section>;
}
