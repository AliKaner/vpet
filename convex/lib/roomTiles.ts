export type RoomTile={x:number;y:number};
export const BASE_TILES:RoomTile[]=Array.from({length:16},(_,i)=>({x:i%4,y:Math.floor(i/4)}));
export const MAX_TILES=3200;
export const tileKey=({x,y}:RoomTile)=>`${x},${y}`;
// Gentler growth than before (12% vs. the old 35% per tile) so the price curve
// actually spans a meaningful chunk of the much higher MAX_TILES instead of
// hitting the 1B cap almost immediately - reaches the cap around tile #142.
export const tilePrice=(purchased:number)=>Math.min(1_000_000_000,Math.ceil(100*Math.pow(1.12,purchased)/10)*10);
export const defaultGardenTiles=(home:RoomTile[])=>availableTiles(home).filter(t=>t.x>=4||t.y>=4);
// Bounding box sized to comfortably fit MAX_TILES (60x60=3600 cells >= 3200).
const BOUND_MIN=-28,BOUND_MAX=32;
export function availableTiles(tiles:RoomTile[]) {
  const occupied=new Set(tiles.map(tileKey)),candidates=new Map<string,RoomTile>();
  for(const tile of tiles) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const next={x:tile.x+dx,y:tile.y+dy};
    if(next.x>=BOUND_MIN&&next.y>=BOUND_MIN&&next.x<BOUND_MAX&&next.y<BOUND_MAX&&!occupied.has(tileKey(next))) candidates.set(tileKey(next),next);
  }
  return tiles.length>=MAX_TILES?[]:[...candidates.values()];
}
export const onRoomTile=(tiles:RoomTile[],x:number,y:number)=>Number.isFinite(x)&&Number.isFinite(y)&&tiles.some(t=>Math.floor(x)===t.x&&Math.floor(y)===t.y);
/** One projection shared by floors, furniture, drag inversion and pet placement. */
export function roomGeometry(tiles:RoomTile[]) {
  const points=tiles.flatMap(t=>[[t.x,t.y],[t.x+1,t.y],[t.x+1,t.y+1],[t.x,t.y+1]]);
  const ratio=4/7,wall=24/7;
  const xs=points.map(([x,y])=>x-y),ys=points.map(([x,y])=>(x+y)*ratio);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys)-wall,maxY=Math.max(...ys);
  const unit=Math.min(84/(maxX-minX),84/(maxY-minY));
  const originX=50-(minX+maxX)/2*unit,originY=48-(minY+maxY)/2*unit;
  const project=(x:number,y:number)=>({left:originX+(x-y)*unit,top:originY+(x+y)*unit*ratio});
  const invert=(left:number,top:number)=>({x:((left-originX)/unit+(top-originY)/unit/ratio)/2,y:((top-originY)/unit/ratio-(left-originX)/unit)/2});
  return {unit,scale:unit/10.5,wallHeight:wall*unit,project,invert};
}
