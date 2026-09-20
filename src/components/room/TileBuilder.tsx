import { availableTiles,roomGeometry,tileKey,type RoomTile } from "../../../convex/lib/roomTiles";
export function TileBuilder({tiles,selected,onSelect}:{tiles:RoomTile[];selected:RoomTile|null;onSelect:(tile:RoomTile)=>void}) {
  const candidates=availableTiles(tiles),g=roomGeometry(tiles);
  // SVG overflow exposes a single ring beyond the current floor without moving the camera.
  return <svg className="tile-builder" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Choose an adjoining floor tile">
    {candidates.map(tile=>{
      const {x,y}=tile,points=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([u,v])=>{const p=g.project(u,v);return `${p.left},${p.top}`;}).join(" ");
      return <polygon key={tileKey(tile)} points={points} role="button" tabIndex={0} aria-label={`Add tile ${x}, ${y}`} aria-pressed={selected?.x===x&&selected?.y===y} onClick={()=>onSelect(tile)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(tile);}}}/>;
    })}
  </svg>;
}
