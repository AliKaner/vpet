import { useRef,useState, type ReactNode, type PointerEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getShopItem, isWallFurniture } from "../../../convex/lib/shopItems";
import { CharacterAvatar } from "../character/CharacterAvatar";
import { FurnitureArt } from "./FurnitureArt";
import { FURNITURE_CELLS, furnitureAnchor } from "./furnitureAtlas";
import { RoomWorld,RoomGeometry } from "./roomContext";
import { BASE_TILES,defaultGardenTiles,onRoomTile,roomGeometry,tilePrice,MAX_TILES,type RoomTile } from "../../../convex/lib/roomTiles";
import { TileSurfaces } from "./TileSurfaces";
import { TileBuilder } from "./TileBuilder";
import { ConvexError } from "convex/values";
import { DecorationDialog } from "./DecorationDialog";
import { RoomControls } from "./RoomControls";
import { FurnitureTray } from "./FurnitureTray";
import { HOME_LEVELS,homeLevel } from "../../../convex/lib/homeLevels";
import type { Character } from "../../../convex/lib/character";
const wallItem = isWallFurniture;
type Position = { x: number; y: number; flipped: boolean };
export function RoomScene({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const room = useQuery(api.decor.getMyRoom);
  const profile = useQuery(api.users.getMyProfile);
  const move = useMutation(api.decor.moveItem);
  const remove = useMutation(api.decor.removeItem);
  const upgrade=useMutation(api.decor.upgradeHome);
  const buyTile=useMutation(api.decor.buyTile);
  if (!room) return <p role="status">Loading your room…</p>;
  return <RoomSceneView room={room} character={profile?.character} move={args=>move({...args,grid:true})} remove={remove} compact={compact} coins={profile?.coins ?? 0} onBuyTile={(tile,area)=>buyTile({...tile,area,expectedPurchases:room.tilePurchases})} onUpgrade={()=>upgrade({expectedLevel:room.level})} picker={close=><RoomControls onPlaced={close} />}>{children}</RoomSceneView>;
}
export function RoomSceneView({ room, character, move, remove, children, compact = false,picker,coins=0,onUpgrade,onBuyTile }: {
  room:{level?:number;tiles?:RoomTile[];tilePurchases?:number;gardenTiles?:RoomTile[];gardenPurchases?:number;wallpaperId?:string;floorId?:string;placedItemIds:string[];placements:Array<{itemId:string;x?:number;y?:number;tileX?:number;tileY?:number;flipped?:boolean;area?:"room"|"garden"}>};
  character?: Character | null;
  move: (args: Position & { itemId: string }) => Promise<unknown>;
  remove: (args: { itemId: string }) => Promise<unknown>;
  children: ReactNode;
  compact?: boolean;
  picker?:(close:(itemId?:string)=>void)=>ReactNode;
  coins?:number;
  onUpgrade?:()=>Promise<unknown>;
  onBuyTile?:(tile:RoomTile,area:"room"|"garden")=>Promise<unknown>;
}) {
  const [world, setWorld] = useState<HTMLDivElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [pickerOpen,setPickerOpen]=useState(false);
  const [building,setBuilding]=useState(false),[buildArea,setBuildArea]=useState<"room"|"garden">("room");
  const [trayArea,setTrayArea]=useState<"room"|"garden">("room");
  const purchaseLock=useRef(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Position>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; pos: Position;garden?:boolean } | null>(null);
  const placements = room?.placements ?? [];
  const level=homeLevel(room.level);
  const tiles=room.tiles??BASE_TILES,gardenTiles=room.gardenTiles??defaultGardenTiles(tiles),g=roomGeometry([...tiles,...gardenTiles]),price=tilePrice(room.tilePurchases??0);
  const indoorCapacity=level.indoor+((room.tilePurchases??0)-(room.gardenPurchases??0))*2;
  const gardenCapacity=level.garden+(room.gardenPurchases??0)*2;
  const characterPoint=g.project(.98,3.35);

  const next=HOME_LEVELS.find(candidate=>candidate.level===level.level+1);
  const indoor=placements.filter(p=>p.area!=="garden");
  const garden=placements.filter(p=>p.area==="garden");
  function position(id: string, index: number): Position {
    const p = placements.find(p => p.itemId === id);
    if(p?.area==="garden"&&p.tileX===undefined&&!draft[id]) {
      const tile=gardenTiles[Math.min(gardenTiles.length-1,Math.floor((p.x??50)/100*gardenTiles.length))];
      if(tile)return {x:(tile.x+.5)*25,y:(tile.y+.5)*25,flipped:p.flipped??false};
    }
    return draft[id] ?? { x:p?.tileX!==undefined?p.tileX*25:p?.x ?? 18+index%4*19, y:p?.tileY!==undefined?p.tileY*25:p?.y ?? Math.min(85,18+Math.floor(index/4)*20), flipped: p?.flipped ?? false };
  }
  async function purchase(tile:RoomTile) {
    if(purchaseLock.current||saving||coins<price)return;
    purchaseLock.current=true;setSaving(true);setError("");
    try {await onBuyTile?.(tile,buildArea);}
    catch(e){setError(e instanceof ConvexError?String(e.data):"Couldn't buy this tile. Try again.");}
    finally{purchaseLock.current=false;setSaving(false);}
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
    if(!rect) return;
    const dx = (e.clientX-drag.startX)/rect.width*100;
    const dy = (e.clientY-drag.startY)/rect.height*100;
    const x=drag.pos.x+(dx/.42+dy/.24)/2/g.scale,y=drag.pos.y+(dy/.24-dx/.42)/2/g.scale;
    if(onRoomTile(drag.garden?gardenTiles:tiles,x/25,y/25)) setDraft(prev=>({...prev,[drag.id]:{...drag.pos,x,y}}));
  }
  return <RoomGeometry.Provider value={g}><RoomWorld.Provider value={world}>
    <div className={`home-play-layout ${compact?"is-compact":""}`}><section className="room-workspace">
      <div className="room-toolbar"><div><strong>{level.label} · Lv. {level.level}</strong><p>{editing ? "Drag furniture · arrow keys to move · flip to change direction" : `${indoor.length}/${indoorCapacity} inside · ${garden.length}/${gardenCapacity} garden spaces · ${tiles.length} tiles`}</p></div><div className="room-toolbar-actions">{onBuyTile&&<button aria-pressed={building} onClick={()=>{setBuilding(!building);setEditing(false);}}>{building?"Finish building":"Build tiles"}</button>}<button onClick={() => {setBuilding(false);setEditing(!editing);setSelected(null);}} aria-pressed={editing}>{editing ? "Done" : "Decorate"}</button></div></div>
      {building&&<div className="tile-build-controls"><div className="room-theme-filter"><button aria-pressed={buildArea==="room"} onClick={()=>setBuildArea("room")}>House floor</button><button aria-pressed={buildArea==="garden"} onClick={()=>setBuildArea("garden")}>Garden grass</button></div><strong>{price.toLocaleString()} coins per tile · {tiles.length+gardenTiles.length}/{MAX_TILES}</strong><p>Click an outlined tile to buy immediately. House mode also converts grass into floor. Prices increase after each purchase.</p>{coins<price&&<p>Need {(price-coins).toLocaleString()} more coins.</p>}</div>}
      {next && onUpgrade && <div className="home-upgrade"><span>Next: {next.indoor} indoor + {next.garden} garden spaces</span><button disabled={saving || coins<next.price} onClick={async()=>{setSaving(true);setError("");try{await onUpgrade();}catch{setError("Couldn't expand your home. Check your coins and current level.");}finally{setSaving(false);}}}>Expand home · {next.price} coins</button></div>}
      <div className={`estate-world estate-level-${level.level}`} data-home-model={level.label}>
      <div className="room-house" style={{width:`${level.width}%`}}>
      <div ref={setWorld} className={`room-world ${editing ? "is-editing" : ""}`}>
        <TileSurfaces tiles={tiles} gardenTiles={gardenTiles} wallpaperId={room.wallpaperId} floorId={room.floorId}/>
        {building&&<TileBuilder tiles={tiles} gardenTiles={gardenTiles} area={buildArea} disabled={saving||coins<price} onBuy={tile=>void purchase(tile)}/>}
        {placements.map((p, index) => {
          const pos = position(p.itemId,index); let screen = g.project(pos.x/25,pos.y/25); const onWall = p.area!=="garden"&&wallItem(p.itemId);
          if(onWall) {
            const edges=tiles.flatMap(t=>[...(!tiles.some(n=>n.x===t.x-1&&n.y===t.y)?[{x:t.x,y:t.y+.5}]:[]),...(!tiles.some(n=>n.x===t.x&&n.y===t.y-1)?[{x:t.x+.5,y:t.y}]:[])]);
            const nearest=edges.sort((a,b)=>Math.hypot(a.x-pos.x/25,a.y-pos.y/25)-Math.hypot(b.x-pos.x/25,b.y-pos.y/25))[0];
            screen=g.project(nearest.x,nearest.y);screen.top-=g.wallHeight*.55;
          }
          const item=getShopItem(p.itemId);
          const width=(FURNITURE_CELLS[p.itemId] === undefined ? 19 : 27*(item?.kind==="furniture"?(item.scale??1):1))*g.scale;
          const floorMat=p.itemId.includes("rug") || (item?.kind==="furniture" && item.floorMat);
          const top = screen.top;
          return <button key={p.itemId} type="button" className={`world-furniture ${p.area==="garden"?"garden-furniture":""} ${selected === p.itemId ? "selected" : ""}`} style={{ left: `${screen.left}%`, top: `${top}%`, width:`${width}%`, transform:`translate(-50%,-${furnitureAnchor(p.itemId)}%)`, zIndex: floorMat ? 2 : Math.round(top) }} aria-label={item?.label} aria-pressed={selected === p.itemId} disabled={saving}
            onPointerDown={e => { if (!editing) return; e.currentTarget.setPointerCapture(e.pointerId); setSelected(p.itemId); setDrag({ id: p.itemId,startX:e.clientX,startY:e.clientY,pos,garden:p.area==="garden" }); }}
            onPointerMove={pointerMove} onPointerUp={() => { if (drag) { void persist(p.itemId,draft[p.itemId] ?? pos); setDrag(null); } }} onPointerCancel={() => { setDrag(null); setDraft({}); }}
            onKeyDown={e => { if (!editing || !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return; e.preventDefault(); setSelected(p.itemId); const next = { ...pos,x:Math.max(-198,Math.min(298,pos.x+(e.key === "ArrowRight" ? 4 : e.key === "ArrowLeft" ? -4 : 0))),y:Math.max(-198,Math.min(298,pos.y+(e.key === "ArrowDown" ? 4 : e.key === "ArrowUp" ? -4 : 0))) }; void persist(p.itemId,next); }}>
            <span style={{ display:"block",transform:pos.flipped ? "scaleX(-1)" : undefined }}><FurnitureArt id={p.itemId} /></span>
          </button>;
        })}
        {character && <div className="world-character" style={{left:`${characterPoint.left}%`,top:`${characterPoint.top}%`,width:`${12*g.scale}%`,zIndex:Math.round(characterPoint.top)}}><CharacterAvatar character={character} /><span>You</span></div>}
        {compact && <div className="world-compact-pet">{children}</div>}
      </div>
      </div>

      </div>
      {editing && selected && <div className="room-toolbar"><strong>{getShopItem(selected)?.label}</strong><button disabled={saving} onClick={() => { const pos = position(selected,placements.findIndex(p => p.itemId === selected)); void persist(selected,{ ...pos,flipped:!pos.flipped }); }}>Flip direction</button><button disabled={saving} onClick={async () => { setSaving(true); try { await remove({ itemId:selected }); setSelected(null); } catch { setError("Couldn't remove this item."); } finally { setSaving(false); } }}>Put away</button></div>}
      {error && <p role="alert">{error}</p>}{saving && <p role="status">Saving layout…</p>}
      {editing && <FurnitureTray area={trayArea} onAreaChange={setTrayArea} onSelect={setSelected} onOpenMore={()=>setPickerOpen(true)} onClose={()=>{setEditing(false);setSelected(null);}} />}
      <DecorationDialog open={pickerOpen} onClose={()=>setPickerOpen(false)}>{picker?.((itemId)=>{setPickerOpen(false);if(itemId)setSelected(itemId);}) ?? <p>Choose a collection above to preview its furniture.</p>}</DecorationDialog>
    </section>
    {!compact && children}</div>
  </RoomWorld.Provider></RoomGeometry.Provider>;
}
