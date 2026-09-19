import { FURNITURE_CELLS } from "./furnitureAtlas";
import { ROOM_ATLASES } from "./roomAssetUrls";

export function FurnitureArt({ id }: { id: string }) {
  const index=FURNITURE_CELLS[id];
  const cell=index === undefined ? undefined : index>=48 ? index-48 : index%16;
  const rows=index>=48 ? 2 : 4;
  const atlas=index>=48 ? ROOM_ATLASES.garden : index>=32 ? ROOM_ATLASES.styles : index>=16 ? ROOM_ATLASES.themes : ROOM_ATLASES.base;
  const cuts=[0,.271,.515,.75,1];
  const row=cell===undefined ? 0 : Math.floor(cell/4);
  const custom=index>=32 && index<48;
  const height=custom ? cuts[row+1]-cuts[row] : 1/rows;
  const top=custom ? cuts[row] : row/rows;
  if (cell !== undefined) return <span className="furniture-pixel-art" aria-hidden="true" style={{ backgroundImage:`url('${atlas}')`,aspectRatio:custom?`${.25/height}`:undefined,backgroundSize:`400% ${100/height}%`,backgroundPosition:`${cell%4*100/3}% ${top/(1-height)*100}%`, transform:id === "furniture_rug" ? "scaleY(.55)" : undefined, transformOrigin:"50% 76%" }} />;
  // Wall decorations use the same warm palette as the raster furniture.
  let art;
  if (id === "decor_window") art = <><path d="m23 25 68-14v64L23 89Z" fill="#bce0e5" stroke="#a98061" strokeWidth="6" /><path d="m57 19v63M24 56l66-14" stroke="#fff2d5" strokeWidth="5" /><path d="m28 73 17-18 15 9 23-23v31Z" fill="#9ec29a" /></>;
  else if (id === "decor_clock") art = <><circle cx="60" cy="45" r="26" fill="#fff1d4" stroke="#8e735e" strokeWidth="5" /><path d="M60 27v20l14 8" fill="none" stroke="#80624f" strokeWidth="3" /></>;
  else if (id === "decor_disco_ball") art = <><path d="M60 0v20" stroke="#80624f" strokeWidth="3" /><circle cx="60" cy="45" r="26" fill="#b7c9de" stroke="#8e735e" strokeWidth="3" /><path d="M35 40h50M37 53h46M50 22v46M65 20v49M77 26v35" stroke="#f8e7e9" strokeWidth="3" /></>;
  else if (/banner|streamers/.test(id)) art = <><path d="M10 30q50 35 100 0" fill="none" stroke="#a98061" strokeWidth="2" />{[0,1,2,3,4].map(i=><path key={i} d={`m${13+i*19} ${34+Math.sin(i/4*Math.PI)*12} 8 20 8-16Z`} fill={["#dca5b5","#abc7ac","#e7c288"][i%3]} />)}</>;
  else art = <><path d="m24 25 67-14v60L24 85Z" fill="#fff1d4" stroke="#ac7e65" strokeWidth="5" /><path d="m42 62 3-26 13 8 15-13 4 27-17 13Z" fill="#d4a2b4" /></>;
  return <svg viewBox="0 0 120 116" aria-hidden="true" className="furniture-art">{art}</svg>;
}
