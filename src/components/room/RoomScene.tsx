import { useRef,useState, type ReactNode, type PointerEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getShopItem, isWallFurniture } from "../../../convex/lib/shopItems";
import { CharacterAvatar } from "../character/CharacterAvatar";
import { FurnitureArt } from "./FurnitureArt";
import { FURNITURE_CELLS, furnitureAnchor } from "./furnitureAtlas";
import { RoomWorld } from "./roomContext";
import { RoomSurfaces } from "./RoomSurfaces";
import { DecorationDialog } from "./DecorationDialog";
import { RoomControls } from "./RoomControls";
import { HOME_LEVELS,homeLevel } from "../../../convex/lib/homeLevels";
import type { Character } from "../../../convex/lib/character";
const wallItem = isWallFurniture;
type Position = { x: number; y: number; flipped: boolean };
const project = (x: number, y: number) => ({ left: 50+(x-y)*.42, top: 42+(x+y)*.24 });
export function RoomScene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const room = useQuery(api.decor.getMyRoom);
  const profile = useQuery(api.users.getMyProfile);
  const move = useMutation(api.decor.moveItem);
  const remove = useMutation(api.decor.removeItem);
  const upgrade=useMutation(api.decor.upgradeHome);
  if (!room) return <p role="status">Loading your room…</p>;
  return <RoomSceneView room={room} character={profile?.character} move={move} remove={remove} compact={compact} coins={profile?.coins ?? 0} onUpgrade={()=>upgrade({expectedLevel:room.level})} picker={close=><RoomControls onPlaced={close} />}>{children}</RoomSceneView>;
}
export function RoomSceneView({ room, character, move, remove, children, compact = false,picker,coins=0,onUpgrade }: {
  room:{level?:number;wallpaperId?:string;floorId?:string;placedItemIds:string[];placements:Array<{itemId:string;x?:number;y?:number;flipped?:boolean;area?:"room"|"garden"}>};
  character?: Character | null;
  move: (args: Position & { itemId: string }) => Promise<unknown>;
  remove: (args: { itemId: string }) => Promise<unknown>;
  children: ReactNode;
  compact?: boolean;
  picker?:(close:(itemId?:string)=>void)=>ReactNode;
  coins?:number;
  onUpgrade?:()=>Promise<unknown>;
}) {
  const [world, setWorld] = useState<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [pickerOpen,setPickerOpen]=useState(false);
  const estateRef=useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Position>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; pos: Position;garden?:boolean } | null>(null);
  const placements = room?.placements ?? [];
  const level=homeLevel(room.level);
  function gardenBounds(x:number) {
    const offset=Math.abs(24+x*.52-50);
    return {inner:level.width*.9/1.12+2-offset*.24/.42/1.12,outer:96-offset*.78};
  }
  const next=HOME_LEVELS.find(candidate=>candidate.level===level.level+1);
  const indoor=placements.filter(p=>p.area!=="garden");
  const garden=placements.filter(p=>p.area==="garden");
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
    const rect = (drag.garden ? estateRef.current : world)?.getBoundingClientRect();
    if(!rect) return;
    const dx = (e.clientX-drag.startX)/rect.width*100;
    const dy = (e.clientY-drag.startY)/rect.height*100;
    const clamp = (n: number) => Math.max(8, Math.min(92, Math.round(n/4)*4));
    if(drag.garden) {
      const x=clamp(drag.pos.x+dx/.52);
      const before=gardenBounds(drag.pos.x);const after=gardenBounds(x);
      const top=before.inner+(before.outer-before.inner)*drag.pos.y/100+dy;
      const y=clamp((top-after.inner)/(after.outer-after.inner)*100);
      setDraft(prev=>({...prev,[drag.id]:{...drag.pos,x,y}}));return;
    }
    const onWall = wallItem(drag.id);
    setDraft(prev => ({ ...prev, [drag.id]: { ...drag.pos, x: clamp(drag.pos.x+(onWall ? dx/.65 : (dx/.42+dy/.24)/2)), y: clamp(drag.pos.y+(onWall ? dy/.3 : (dy/.24-dx/.42)/2)) } }));
  }
  return <RoomWorld.Provider value={world}>
    <section className="room-workspace">
      <div className="room-toolbar"><div><strong>{level.label} · Lv. {level.level}</strong><p>{editing ? "Drag furniture · arrow keys to move · flip to change direction" : `${indoor.length}/${level.indoor} inside · ${garden.length}/${level.garden} garden spaces`}</p></div><div className="room-toolbar-actions">{editing && <button onClick={()=>setPickerOpen(true)}>Choose furniture</button>}<button onClick={() => {setEditing(!editing);setSelected(null);if(!editing)setPickerOpen(true);}} aria-pressed={editing}>{editing ? "Done" : "Decorate"}</button></div></div>
      {next && onUpgrade && <div className="home-upgrade"><span>Next: {next.indoor} indoor + {next.garden} garden spaces</span><button disabled={saving || coins<next.price} onClick={async()=>{setSaving(true);setError("");try{await onUpgrade();}catch{setError("Couldn't expand your home. Check your coins and current level.");}finally{setSaving(false);}}}>Expand home · {next.price} coins</button></div>}
      <div className={`estate-world estate-level-${level.level}`} ref={estateRef} data-home-model={level.label}>
        <svg className="estate-garden" style={{transform:`scale(${Math.min(1,.88+(level.level-1)*.04)})`,transformOrigin:"50% 60%"}} viewBox="0 0 100 100" aria-hidden="true"><path d="M50 23 98 59 50 98 2 59Z" fill="#a3bd86" stroke="#7f9e68" strokeWidth="1" /><path d="M50 27 94 59 50 94 6 59Z" fill="#b8cf99" /><path d="m43 88 7 5 7-5-7-5Z" fill="#e5d4ad" />{level.level>=5 && <><path d="m9 59 41 31 41-31M18 66l32 24 32-24" fill="none" stroke="#e5d4ad" strokeWidth="2"/><path d="M5 59 50 94 95 59" fill="none" stroke="#638650" strokeWidth="2" strokeDasharray="2 1"/></>}{[0,1,2,3,4,5].map(i=><g key={i} fill="#f3d7a2"><circle cx={9+i*3} cy={60+i*2} r=".5"/><circle cx={91-i*3} cy={60+i*2} r=".5"/></g>)}</svg>
      <div className="room-house" style={{width:`${level.width}%`}}>
      <div ref={setWorld} className={`room-world ${editing ? "is-editing" : ""}`}>
        <RoomSurfaces wallpaperId={room.wallpaperId} floorId={room.floorId} level={level.level} />
        {indoor.map((p, index) => {
          const pos = position(p.itemId,index); const screen = project(pos.x,pos.y); const onWall = wallItem(p.itemId);
          const item=getShopItem(p.itemId);
          const width=FURNITURE_CELLS[p.itemId] === undefined ? 19 : 27*(item?.kind==="furniture"?(item.scale??1):1);
          const floorMat=p.itemId.includes("rug") || (item?.kind==="furniture" && item.floorMat);
          const top = onWall ? 19+pos.y*.3 : screen.top;
          return <button key={p.itemId} type="button" className={`world-furniture ${selected === p.itemId ? "selected" : ""}`} style={{ left: `${onWall ? 20+pos.x*.65 : screen.left}%`, top: `${top}%`, width:`${width}%`, transform:`translate(-50%,-${furnitureAnchor(p.itemId)}%)`, zIndex: floorMat ? 2 : Math.round(top) }} aria-label={item?.label} aria-pressed={selected === p.itemId} disabled={saving}
            onPointerDown={e => { if (!editing) return; e.currentTarget.setPointerCapture(e.pointerId); setSelected(p.itemId); setDrag({ id: p.itemId,startX:e.clientX,startY:e.clientY,pos }); }}
            onPointerMove={pointerMove} onPointerUp={() => { if (drag) { void persist(p.itemId,draft[p.itemId] ?? pos); setDrag(null); } }} onPointerCancel={() => { setDrag(null); setDraft({}); }}
            onKeyDown={e => { if (!editing || !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return; e.preventDefault(); setSelected(p.itemId); const next = { ...pos,x:Math.max(8,Math.min(92,pos.x+(e.key === "ArrowRight" ? 4 : e.key === "ArrowLeft" ? -4 : 0))),y:Math.max(8,Math.min(92,pos.y+(e.key === "ArrowDown" ? 4 : e.key === "ArrowUp" ? -4 : 0))) }; void persist(p.itemId,next); }}>
            <span style={{ display:"block",transform:pos.flipped ? "scaleX(-1)" : undefined }}><FurnitureArt id={p.itemId} /></span>
          </button>;
        })}
        {character && <div className="world-character"><CharacterAvatar character={character} /><span>You</span></div>}
        {compact && <div className="world-compact-pet">{children}</div>}
      </div>
      </div>
      {garden.map((p,index)=>{
        const pos=position(p.itemId,index);
        const bounds=gardenBounds(pos.x);
        const top=bounds.inner+(bounds.outer-bounds.inner)*pos.y/100;
        return <button key={p.itemId} className={`world-furniture garden-furniture ${editing ? "editable" : ""} ${selected===p.itemId ? "selected" : ""}`} style={{left:`${24+pos.x*.52}%`,top:`${top}%`,width:"22%",transform:`translate(-50%,-${furnitureAnchor(p.itemId)}%)`,zIndex:100+Math.round(top)}} aria-label={getShopItem(p.itemId)?.label} disabled={saving}
          onPointerDown={e=>{if(!editing)return;e.currentTarget.setPointerCapture(e.pointerId);setSelected(p.itemId);setDrag({id:p.itemId,startX:e.clientX,startY:e.clientY,pos,garden:true});}}
          onPointerMove={pointerMove} onPointerUp={()=>{if(drag){void persist(p.itemId,draft[p.itemId]??pos);setDrag(null);}}} onPointerCancel={()=>{setDrag(null);setDraft({});}}
          onKeyDown={e=>{if(!editing||!e.key.startsWith("Arrow"))return;e.preventDefault();setSelected(p.itemId);void persist(p.itemId,{...pos,x:Math.max(8,Math.min(92,pos.x+(e.key==="ArrowRight"?4:e.key==="ArrowLeft"?-4:0))),y:Math.max(8,Math.min(92,pos.y+(e.key==="ArrowDown"?4:e.key==="ArrowUp"?-4:0)))});}}>
          <span style={{display:"block",transform:pos.flipped?"scaleX(-1)":undefined}}><FurnitureArt id={p.itemId}/></span>
        </button>;
      })}
      <span className="garden-caption">Garden · {garden.length}/{level.garden}</span>
      </div>
      {editing && selected && <div className="room-toolbar"><strong>{getShopItem(selected)?.label}</strong><button disabled={saving} onClick={() => { const pos = position(selected,placements.findIndex(p => p.itemId === selected)); void persist(selected,{ ...pos,flipped:!pos.flipped }); }}>Flip direction</button><button disabled={saving} onClick={async () => { setSaving(true); try { await remove({ itemId:selected }); setSelected(null); } catch { setError("Couldn't remove this item."); } finally { setSaving(false); } }}>Put away</button></div>}
      {error && <p role="alert">{error}</p>}{saving && <p role="status">Saving layout…</p>}
      <DecorationDialog open={pickerOpen} onClose={()=>setPickerOpen(false)}>{picker?.((itemId)=>{setPickerOpen(false);if(itemId)setSelected(itemId);}) ?? <p>Choose a collection above to preview its furniture.</p>}</DecorationDialog>
    </section>
    {!compact && children}
  </RoomWorld.Provider>;
}
