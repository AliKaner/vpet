import { getShopItem } from "../../../convex/lib/shopItems";
import { roomGeometry,tileKey,type RoomTile } from "../../../convex/lib/roomTiles";
import { useId } from "react";
import { ROOM_THEMES } from "../../../convex/lib/roomThemes";
export function TileSurfaces({tiles,gardenTiles=[],wallpaperId,floorId}:{tiles:RoomTile[];gardenTiles?:RoomTile[];wallpaperId?:string;floorId?:string}) {
  const g=roomGeometry([...tiles,...gardenTiles]),occupied=new Set(tiles.map(tileKey));
  const id=useId().replace(/:/g,"");
  const motif=ROOM_THEMES.find(t=>wallpaperId===`wallpaper_theme_${t.id}`)?.pattern??"stripes";
  const wall=getShopItem(wallpaperId??""),floor=getShopItem(floorId??"");
  const wallColor=wall?.kind==="wallpaper"?wall.bgColor:"#e1e9d8",floorColor=floor?.kind==="floor"?floor.bgColor:"#dbb98d";
  const point=(x:number,y:number,raise=0)=>{const p=g.project(x,y);return `${p.left},${p.top-raise}`;};
  return <svg className="room-shell" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><pattern id={`${id}-wall`} width={6*g.scale} height={6*g.scale} patternUnits="userSpaceOnUse"><g transform={`scale(${g.scale})`}>
      {motif==="circuit"?<path d="M0 2h3v3h3M1 0v2M4 5v1" fill="none" stroke="#48d9d4" opacity=".4" strokeWidth=".25"/>:motif==="stars"?<path d="m3 1 .5 1.4 1.5.1-1.2 1 .4 1.5L3 4.2 1.8 5l.4-1.5L1 2.5l1.5-.1Z" fill="#fff2b4" opacity=".6"/>:motif==="hearts"?<path d="M3 5Q0 3 1 1.5Q2 .5 3 2Q4 .5 5 1.5Q6 3 3 5Z" fill="#e2a0bb" opacity=".4"/>:motif==="waves"?<path d="M0 3q1.5-2 3 0t3 0" fill="none" stroke="#73aab6" opacity=".4" strokeWidth=".4"/>:motif==="goth"?<path d="m3 1 2 2-2 2-2-2Z" fill="none" stroke="#b97a96" strokeWidth=".3"/>:motif==="leaves"?<path d="M3 5V2M3 4Q0 3 1 1Q4 1 3 4M3 3Q6 2 5 1Q3 1 3 3" fill="#73956e" opacity=".3"/>:motif==="disco"?<g opacity=".4"><path d="M0 0h2v2H0Z" fill="#d28cdf"/><path d="M3 3h2v2H3Z" fill="#80d6e1"/></g>:motif==="flowers"?<g fill="#d4849b" opacity=".3"><circle cx="3" cy="2" r="1"/><circle cx="2" cy="3" r="1"/><circle cx="4" cy="3" r="1"/><circle cx="3" cy="4" r="1"/></g>:<path d="M3 0v6" stroke="#ffffff30" strokeWidth=".6"/>}
    </g></pattern></defs>
    {gardenTiles.map(({x,y})=><g key={`grass${x},${y}`}><polygon data-tile-area="garden" points={[point(x,y),point(x+1,y),point(x+1,y+1),point(x,y+1)].join(" ")} fill={(x+y)%2?"#a8c888":"#b4d395"} stroke="#769c5e" strokeWidth=".2"/>{[[.3,.3],[.7,.6],[.35,.8]].map(([u,v],i)=>{const p=g.project(x+u,y+v);return <path key={i} d={`M${p.left-.4},${p.top}l.2,-.7 .3,.5 .3,-.6`} fill="none" stroke="#729955" strokeWidth=".18"/>;})}</g>)}
    {tiles.map(({x,y})=><polygon data-tile-area="room" key={`floor${x},${y}`} points={[point(x,y),point(x+1,y),point(x+1,y+1),point(x,y+1)].join(" ")} fill={floorColor} stroke="#a5846333" strokeWidth=".25"/>)}
    {[...tiles].sort((a,b)=>a.x+a.y-b.x-b.y).flatMap(({x,y})=>[
      ...(!occupied.has(`${x-1},${y}`)?[[x,y,x,y+1]]:[]),...(!occupied.has(`${x},${y-1}`)?[[x,y,x+1,y]]:[]),
    ].map(([ax,ay,bx,by],i)=>{const polygon=[point(ax,ay),point(bx,by),point(bx,by,g.wallHeight),point(ax,ay,g.wallHeight)].join(" ");return <g key={`${x},${y}-${i}`}><polygon points={polygon} fill={wallColor}/><polygon points={polygon} fill={`url(#${id}-wall)`}/><path d={`M${point(ax,ay,g.scale)} L${point(bx,by,g.scale)} M${point(ax,ay,g.wallHeight)} L${point(bx,by,g.wallHeight)}`} stroke="#fff2d7" strokeWidth={g.scale}/></g>;}))}
    {tiles.flatMap(({x,y})=>[...(!occupied.has(`${x+1},${y}`)?[[x+1,y,x+1,y+1]]:[]),...(!occupied.has(`${x},${y+1}`)?[[x,y+1,x+1,y+1]]:[])].map(([ax,ay,bx,by],i)=><polygon key={`${x},${y}-${i}`} points={[point(ax,ay),point(bx,by),point(bx,by,-2*g.scale),point(ax,ay,-2*g.scale)].join(" ")} fill="#ae8762"/>))}
  </svg>;
}
