import { MAX_TILES,availableTiles,roomGeometry,tileKey,type RoomTile } from "../../../convex/lib/roomTiles";
export function TileBuilder({tiles,gardenTiles,area,disabled,onBuy}:{tiles:RoomTile[];gardenTiles:RoomTile[];area:"room"|"garden";disabled:boolean;onBuy:(tile:RoomTile)=>void}) {
  const plot=[...tiles,...gardenTiles],g=roomGeometry(plot);
  const candidates=availableTiles(area==="room"?tiles:plot).filter(t=>plot.length<MAX_TILES||gardenTiles.some(g=>g.x===t.x&&g.y===t.y));
  return <svg className={`tile-builder tile-builder-${area}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`Buy ${area} tiles with one click`}>
    {candidates.map(({x,y})=>{
      const points=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([u,v])=>{const p=g.project(u,v);return `${p.left},${p.top}`;}).join(" ");
      const converts=area==="room"&&gardenTiles.some(t=>t.x===x&&t.y===y);
      const label=converts?`Convert garden tile ${x}, ${y} to house floor`:`Buy ${area} tile ${x}, ${y}`;
      return <polygon key={tileKey({x,y})} points={points} className={converts?"is-conversion":undefined} role="button" tabIndex={disabled?-1:0} aria-label={label} aria-disabled={disabled} onClick={()=>{if(!disabled)onBuy({x,y});}} onKeyDown={e=>{if(!disabled&&(e.key==="Enter"||e.key===" ")){e.preventDefault();onBuy({x,y});}}}/>;
    })}
  </svg>;
}
