import { useState, type ReactNode, type PointerEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getShopItem } from "../../../convex/lib/shopItems";
import { CharacterAvatar } from "../character/CharacterAvatar";
import { FurnitureArt } from "./FurnitureArt";
import { FURNITURE_CELLS, furnitureAnchor } from "./furnitureAtlas";
import { RoomWorld } from "./roomContext";
import type { FunctionReturnType } from "convex/server";
import type { Character } from "../../../convex/lib/character";
const wallItem = (id: string) => /window$|clock|poster|banner|streamers|disco/.test(id);
type Position = { x: number; y: number; flipped: boolean };
const project = (x: number, y: number) => ({ left: 50+(x-y)*.42, top: 42+(x+y)*.24 });
export function RoomScene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const room = useQuery(api.decor.getMyRoom);
  const profile = useQuery(api.users.getMyProfile);
  const move = useMutation(api.decor.moveItem);
  const remove = useMutation(api.decor.removeItem);
  if (!room) return <p role="status">Loading your room…</p>;
  return <RoomSceneView room={room} character={profile?.character} move={move} remove={remove} compact={compact}>{children}</RoomSceneView>;
}
export function RoomSceneView({ room, character, move, remove, children, compact = false }: {
  room: FunctionReturnType<typeof api.decor.getMyRoom>;
  character?: Character | null;
  move: (args: Position & { itemId: string }) => Promise<unknown>;
  remove: (args: { itemId: string }) => Promise<unknown>;
  children: ReactNode;
  compact?: boolean;
}) {
  const [world, setWorld] = useState<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Position>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; pos: Position } | null>(null);
  const placements = room?.placements ?? [];
  function position(id: string, index: number): Position {
    const p = placements.find(p => p.itemId === id);
    return draft[id] ?? { x: p?.x ?? 18+index%4*19, y: p?.y ?? Math.min(85,18+Math.floor(index/4)*20), flipped: p?.flipped ?? false };
  }
  async function persist(id: string, pos: Position) {
    setSaving(true); setError("");
    try { await move({ itemId: id, ...pos }); }
    catch { setError("Couldn't save the layout. Please try again."); }
    finally { setDraft(prev => { const next = { ...prev }; delete next[id]; return next; }); setSaving(false); }
  }
  function pointerMove(e: PointerEvent) {
    if (!drag || !world) return;
    const rect = world.getBoundingClientRect();
    const dx = (e.clientX-drag.startX)/rect.width*100;
    const dy = (e.clientY-drag.startY)/rect.height*100;
    const clamp = (n: number) => Math.max(8, Math.min(92, Math.round(n/4)*4));
    const onWall = wallItem(drag.id);
    setDraft(prev => ({ ...prev, [drag.id]: { ...drag.pos, x: clamp(drag.pos.x+(onWall ? dx/.65 : (dx/.42+dy/.24)/2)), y: clamp(drag.pos.y+(onWall ? dy/.3 : (dy/.24-dx/.42)/2)) } }));
  }
  const wall = room?.wallpaperId ? getShopItem(room.wallpaperId) : undefined;
  const floor = room?.floorId ? getShopItem(room.floorId) : undefined;
  return <RoomWorld.Provider value={world}>
    <section className="room-workspace">
      <div className="room-toolbar"><div><strong>Our little place</strong><p>{editing ? "Drag furniture · arrow keys to move · flip to change direction" : "A shared home for you and your companions"}</p></div><button onClick={() => { setEditing(!editing); setSelected(null); }} aria-pressed={editing}>{editing ? "Done" : "Decorate"}</button></div>
      <div ref={setWorld} className={`room-world ${editing ? "is-editing" : ""}`}>
        <svg className="room-shell" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><pattern id="room-planks" width="12" height="8" patternUnits="userSpaceOnUse" patternTransform="skewY(29)"><path d="M0 0H12M0 0V8" stroke="#795938" opacity=".18" strokeWidth=".4" /></pattern></defs>
          <path d="M8 66 50 42 92 66 50 90Z" fill={floor?.kind === "floor" ? floor.bgColor : "#dbb98d"} />
          <path d="M8 66 50 42 92 66 50 90Z" fill="url(#room-planks)" />
          <path d="M8 66V30L50 6V42Z" fill={wall?.kind === "wallpaper" ? wall.bgColor : "#e1e9d8"} />
          <path d="M50 6 92 30V66L50 42Z" fill={wall?.kind === "wallpaper" ? wall.bgColor : "#e1e9d8"} />
          <path d="M50 6 92 30V66L50 42Z" fill="#68533c" opacity=".1" />
          <path d="M8 63 50 39 92 63M50 6V42" fill="none" stroke="#fcf1d9" strokeWidth="1.2" />
          <path d="M8 66 50 90 92 66V69L50 93 8 69Z" fill="#af8864" />
        </svg>
        {placements.map((p, index) => {
          const pos = position(p.itemId,index); const screen = project(pos.x,pos.y); const onWall = wallItem(p.itemId);
          const top = onWall ? 19+pos.y*.3 : screen.top;
          return <button key={p.itemId} type="button" className={`world-furniture ${selected === p.itemId ? "selected" : ""}`} style={{ left: `${onWall ? 20+pos.x*.65 : screen.left}%`, top: `${top}%`, width:FURNITURE_CELLS[p.itemId] === undefined ? "19%" : "27%", transform:`translate(-50%,-${furnitureAnchor(p.itemId)}%)`, zIndex: p.itemId.includes("rug") ? 2 : Math.round(top) }} aria-label={getShopItem(p.itemId)?.label} aria-pressed={selected === p.itemId} disabled={saving}
            onPointerDown={e => { if (!editing) return; e.currentTarget.setPointerCapture(e.pointerId); setSelected(p.itemId); setDrag({ id: p.itemId,startX:e.clientX,startY:e.clientY,pos }); }}
            onPointerMove={pointerMove} onPointerUp={() => { if (drag) { void persist(p.itemId,draft[p.itemId] ?? pos); setDrag(null); } }} onPointerCancel={() => { setDrag(null); setDraft({}); }}
            onKeyDown={e => { if (!editing || !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return; e.preventDefault(); setSelected(p.itemId); const next = { ...pos,x:Math.max(8,Math.min(92,pos.x+(e.key === "ArrowRight" ? 4 : e.key === "ArrowLeft" ? -4 : 0))),y:Math.max(8,Math.min(92,pos.y+(e.key === "ArrowDown" ? 4 : e.key === "ArrowUp" ? -4 : 0))) }; void persist(p.itemId,next); }}>
            <span style={{ display:"block",transform:pos.flipped ? "scaleX(-1)" : undefined }}><FurnitureArt id={p.itemId} /></span>
          </button>;
        })}
        {character && <div className="world-character"><CharacterAvatar character={character} /><span>You</span></div>}
        {compact && <div className="world-compact-pet">{children}</div>}
      </div>
      {editing && selected && <div className="room-toolbar"><strong>{getShopItem(selected)?.label}</strong><button disabled={saving} onClick={() => { const pos = position(selected,placements.findIndex(p => p.itemId === selected)); void persist(selected,{ ...pos,flipped:!pos.flipped }); }}>Flip direction</button><button disabled={saving} onClick={async () => { setSaving(true); try { await remove({ itemId:selected }); setSelected(null); } catch { setError("Couldn't remove this item."); } finally { setSaving(false); } }}>Put away</button></div>}
      {error && <p role="alert">{error}</p>}{saving && <p role="status">Saving layout…</p>}
    </section>
    {!compact && children}
  </RoomWorld.Provider>;
}
