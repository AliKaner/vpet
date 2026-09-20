import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ConvexError } from "convex/values";
import { homeLevel } from "../../../convex/lib/homeLevels";
import { api } from "../../../convex/_generated/api";
import { SHOP_CATALOG, type ShopItem } from "../../../convex/lib/shopItems";
import { ThemeFilter } from "./ThemeFilter";
import { FurnitureArt } from "./FurnitureArt";
import { FurnitureSetFilter } from "./FurnitureSetFilter";
import type { FurnitureSetId } from "../../../convex/lib/furnitureSets";
import type { RoomThemeId } from "../../../convex/lib/roomThemes";

const groups: { kind: ShopItem["kind"]; label: string }[] = [
  { kind: "wallpaper", label: "Wallpaper" }, { kind: "floor", label: "Floor" },
  { kind: "decor", label: "Wall decor" }, { kind: "furniture", label: "Furniture" },
];

export function RoomControls({onPlaced}:{onPlaced?:(itemId?:string)=>void}={}) {
  const room = useQuery(api.decor.getMyRoom);
  const owned = useQuery(api.decor.getMyDecorInventory);
  const place = useMutation(api.decor.placeItem);
  const remove = useMutation(api.decor.removeItem);
  const setWallpaper = useMutation(api.decor.setWallpaper);
  const setFloor = useMutation(api.decor.setFloor);
  const [error, setError] = useState<string | null>(null);
  const [theme,setTheme] = useState<RoomThemeId | "all">("all");
  const [area,setArea]=useState<"room"|"garden">("room");
  const [busy,setBusy]=useState(false);
  const [collection,setCollection]=useState<FurnitureSetId|"all">("all");
  if (!room || !owned) return <p className="text-center text-xs text-cocoa-soft">Loading room controls…</p>;
  const ownedSet = new Set(owned);
  const placed = new Set(room.placedItemIds);
  const limits=homeLevel(room.level);
  const count=room.placements.filter(p=>(p.area??"room")===area).length;
  const visible = SHOP_CATALOG.filter(item => (theme === "all" || ("theme" in item && item.theme === theme)) && (collection==="all" || (item.kind==="furniture" && item.collection===collection)) && !(area==="garden" && item.kind==="furniture" && item.wallMounted));
  async function toggle(item: ShopItem) {
    setBusy(true);
    try { setError(null); if (placed.has(item.id)) await remove({ itemId: item.id }); else {await place({ itemId:item.id,area });onPlaced?.(item.id);} }
    catch(error) { setError(error instanceof ConvexError ? String(error.data) : "This room item could not be changed."); }
    finally {setBusy(false);}
  }
  async function choose(kind: "wallpaper" | "floor", itemId: string | null) {
    try { setError(null); if (kind === "wallpaper") await setWallpaper({ itemId }); else await setFloor({ itemId }); }
    catch { setError("This room style could not be changed."); }
  }
  return <section className="room-controls" aria-label="Decorate your room">
    <div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold text-cocoa">Make the room yours</h2><p className="text-xs text-cocoa-soft">Tap an owned item to place or remove it. Changes appear above instantly.</p></div><span aria-hidden>🛋️</span></div>
    <ThemeFilter value={theme} onChange={value=>{setTheme(value);setCollection("all");}} />
    <FurnitureSetFilter value={collection} onChange={value=>{setCollection(value);setTheme("all");}} />
    <div className="room-theme-filter" role="group" aria-label="Placement area"><button type="button" aria-pressed={area==="room"} onClick={()=>setArea("room")}>Inside</button><button type="button" aria-pressed={area==="garden"} onClick={()=>setArea("garden")}>Garden</button></div>
    <p className="text-xs text-cocoa-soft">{count}/{area==="room"?limits.indoor+room.tilePurchases*2:limits.garden} spaces used · Add floor tiles or expand your home for more space.</p>
    <Link to="/shop" onClick={()=>onPlaced?.()} className="text-sm font-bold text-peach-dark">Shop more furniture →</Link>
    {groups.filter(g=>area==="room" || g.kind==="furniture").map(({ kind, label }) => <div key={kind} className="room-control-group"><h3>{label}</h3><div className="room-control-items">
      {kind === "wallpaper" && <button type="button" className={!room.wallpaperId ? "selected" : ""} onClick={() => void choose("wallpaper", null)}>Default</button>}
      {kind === "floor" && <button type="button" className={!room.floorId ? "selected" : ""} onClick={() => void choose("floor", null)}>Default</button>}
      {visible.filter((item) => item.kind === kind && ownedSet.has(item.id)).map((item) => {
        const selected = kind === "wallpaper" ? room.wallpaperId === item.id : kind === "floor" ? room.floorId === item.id : placed.has(item.id);
        return <button type="button" key={item.id} disabled={busy} className={selected ? "selected" : ""} onClick={() => void (kind === "wallpaper" || kind === "floor" ? choose(kind, item.id) : toggle(item))}>
          {kind === "furniture" || kind === "decor" ? <span className="room-inventory-preview"><FurnitureArt id={item.id} /></span> : <span aria-hidden>{item.icon}</span>} {item.label} <small>{selected ? (kind === "furniture" || kind === "decor" ? "Put away" : "Selected") : kind === "wallpaper" || kind === "floor" ? "Set" : "Place"}</small>
        </button>;
      })}
      {!visible.some((item) => item.kind === kind && ownedSet.has(item.id)) && <span className="room-empty">Buy more in Shop</span>}
    </div></div>)}
    {error && <p role="alert" className="text-xs font-bold text-blossom-dark">{error}</p>}
  </section>;
}
