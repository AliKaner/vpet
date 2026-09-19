import { useId } from "react";
import { getShopItem } from "../../../convex/lib/shopItems";
import { ROOM_THEMES } from "../../../convex/lib/roomThemes";
export function RoomSurfaces({ wallpaperId,floorId,level=1 }: { wallpaperId?:string;floorId?:string;level?:number }) {
  const id=useId().replace(/:/g,"");
  const wall=wallpaperId ? getShopItem(wallpaperId) : undefined;
  const floor=floorId ? getShopItem(floorId) : undefined;
  const theme=ROOM_THEMES.find(t=>wallpaperId===`wallpaper_theme_${t.id}`);
  const motif=theme?.pattern ?? ({wallpaper_garden:"leaves",wallpaper_night:"stars",wallpaper_seaside:"waves",wallpaper_candy:"flowers",wallpaper_party:"flowers"} as Record<string,string>)[wallpaperId ?? ""] ?? "stripes";
  const tile=floorId=== "floor_tile" || floorId=== "floor_theme_strawberry";
  const carpet=floorId=== "floor_carpet" || floorId=== "floor_sage";
  return <svg className="room-shell" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <pattern id={`${id}-planks`} width="12" height="8" patternUnits="userSpaceOnUse" patternTransform="skewY(29)"><path d="M0 0H12M0 0V8" stroke="#795938" opacity=".18" strokeWidth=".4" /></pattern>
      <pattern id={`${id}-tile`} width="10" height="6" patternUnits="userSpaceOnUse"><path d="m0 3 5-3 5 3-5 3Z" fill="#fff" opacity=".28" /><path d="m0 3 5-3 5 3-5 3Z" fill="none" stroke="#826b55" opacity=".15" strokeWidth=".2" /></pattern>
      <pattern id={`${id}-carpet`} width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0 1h2M1 0v2" stroke="#fff" opacity=".2" strokeWidth=".2" /></pattern>
      <pattern id={`${id}-motif`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="scale(.65)">
        {motif==="goth"&&<path d="M4 1 7 4 4 7 1 4Z M4 2v4M2 4h4" fill="none" stroke="#b97a96" strokeWidth=".35" opacity=".5"/>}
        {motif==="disco"&&<g opacity=".5"><path d="M1 1h2v2H1Z M5 5h2v2H5Z" fill="#d28cdf"/><path d="M5 1h2v2H5Z M1 5h2v2H1Z" fill="#80d6e1"/></g>}
        {motif==="hearts"&&<path d="M4 6Q0 4 1 2Q2 0 4 2Q6 0 7 2Q8 4 4 6Z" fill="#e2a0bb" opacity=".35"/>}
        {motif==="circuit"&&<path d="M0 2h4v4h4M2 0v2M6 6v2" fill="none" stroke="#48d9d4" opacity=".4" strokeWidth=".3"/>}
        {motif==="leaves" ? <path d="M4 7V3M4 5Q0 4 1 1Q5 1 4 5M4 4Q8 3 7 1Q4 1 4 4" fill="#73956e" opacity=".2" /> : motif==="stars" ? <path d="m4 1 .7 2 2.3.1-1.8 1.4.6 2.2L4 5.5 2.2 6.7l.6-2.2L1 3.1 2.3 3Z" fill="#fff2b4" opacity=".65" /> : motif==="waves" ? <path d="M0 4q2-2 4 0t4 0" fill="none" stroke="#73aab6" opacity=".25" strokeWidth=".5" /> : motif==="flowers" ? <g fill="#d4849b" opacity=".25"><circle cx="4" cy="3" r="1.2" /><circle cx="3" cy="4" r="1.2" /><circle cx="5" cy="4" r="1.2" /><circle cx="4" cy="5" r="1.2" /><circle cx="4" cy="4" r=".6" fill="#fff" /></g> : <path d="M4 0v8" stroke="#fff" strokeWidth="1" opacity=".15" />}
      </pattern>
    </defs>
    <path d="M8 66 50 42 92 66 50 90Z" fill={floor?.kind==="floor" ? floor.bgColor : "#dbb98d"} />
    <path d="M8 66 50 42 92 66 50 90Z" fill={`url(#${id}-${tile ? "tile" : carpet ? "carpet" : "planks"})`} />
    <path d="M8 66V30L50 6V42Z M50 6 92 30V66L50 42Z" fill={wall?.kind==="wallpaper" ? wall.bgColor : "#e1e9d8"} />
    <path d="M8 66V30L50 6V42Z M50 6 92 30V66L50 42Z" fill={`url(#${id}-motif)`} />
    <path d="M50 6 92 30V66L50 42Z" fill="#68533c" opacity=".1" />
    {level>=5 && <g stroke="#f9ebd0" strokeWidth="1.2" strokeLinejoin="round">
      <path d="m16 33 22-12v20L16 53Z" fill="#9cc7c6"/><path d="m27 27v20m-11-4 22-12" fill="none"/>
      <path d="M9 31 50 8 91 31" fill="none" strokeWidth="2"/>
      {level>=6 && <><path d="m63 22 21 12v19L63 41Z" fill="#9cc7c6"/><path d="m74 28v19m-11-15 21 12" fill="none"/><path d="M10 33v29M49 11v28M90 33v29" strokeWidth="2"/><path d="m13 66 37 21 37-21" fill="none" stroke="#f3dfb4"/></>}
    </g>}
    <path d="M8 63 50 39 92 63M50 6V42" fill="none" stroke="#fcf1d9" strokeWidth="1.2" />
    <path d="M8 66 50 90 92 66V69L50 93 8 69Z" fill="#af8864" />
  </svg>;
}
