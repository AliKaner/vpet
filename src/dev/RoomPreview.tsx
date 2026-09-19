import { useState,type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { RoomSceneView } from "../components/room/RoomScene";
import { RoomPet } from "../components/room/RoomPet";
import { PetStage } from "../components/pet/PetStage";
import { CharacterAvatar } from "../components/character/CharacterAvatar";
import { SHOP_CATALOG } from "../../convex/lib/shopItems";
import { ROOM_THEMES, THEMED_FURNITURE_TYPES, type RoomThemeId } from "../../convex/lib/roomThemes";
import { ThemeFilter } from "../components/room/ThemeFilter";
import { FurnitureArt } from "../components/room/FurnitureArt";
import "../index.css";
const character = { gender:"neutral",hairStyle:"bob",hairColor:"chestnut",eyeColor:"green",skinTone:"warm",accessory:"glasses",clothingId:"cloth_overalls" } as const;
export function Preview() {
  const [room,setRoom] = useState<ComponentProps<typeof RoomSceneView>["room"]>({ level:1,wallpaperId:undefined,floorId:undefined,placedItemIds:[],placements:[
    { itemId:"furniture_sofa",x:12,y:55 }, { itemId:"furniture_cat_tree",x:72,y:14 }, { itemId:"furniture_rug",x:50,y:53 }, { itemId:"furniture_lamp",x:8,y:82 }, { itemId:"furniture_aquarium",x:14,y:14 }, { itemId:"decor_window",x:20,y:35 },
  ].map(p => ({...p,flipped:false})) });
  const [action,setAction] = useState<{action:string;id:number}|null>(null);
  const [theme,setTheme]=useState<RoomThemeId | "all">("all");
  function chooseTheme(value:RoomThemeId | "all") {
    setTheme(value);
    if(value==="all") return;
    const coordinates=[[18,55],[65,12],[15,15],[70,63]];
    setRoom(prev=>({ ...prev,wallpaperId:`wallpaper_theme_${value}`,floorId:`floor_theme_${value}`,placements:[...prev.placements.filter(p=>p.area==="garden"),...THEMED_FURNITURE_TYPES.map((type,i)=>({itemId:`furniture_${value}_${type.id}`,x:coordinates[i][0],y:coordinates[i][1],flipped:false}))] }));
  }
  return <main style={{ maxWidth:760,margin:"24px auto",padding:16 }}><ThemeFilter value={theme} onChange={chooseTheme} /><RoomSceneView room={room} character={character} coins={1000} onUpgrade={async()=>setRoom(prev=>({...prev,level:(prev.level??1)+1}))} picker={close=><div className="preview-picker-grid">{SHOP_CATALOG.filter(i=>i.kind==="furniture").map(item=><button key={item.id} onClick={()=>{setRoom(prev=>({...prev,placements:[...prev.placements.filter(p=>p.itemId!==item.id),{itemId:item.id,x:30,y:30,area:item.kind==="furniture"&&item.outdoor?"garden":"room",flipped:false}]}));close();}}><FurnitureArt id={item.id}/>{item.label}</button>)}</div>} move={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.map(p => p.itemId === args.itemId ? {...p,...args} : p) })); }} remove={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.filter(p => p.itemId !== args.itemId) })); }}>
    <RoomPet index={0} name="Miso"><PetStage species="cat" mood="content" reaction={null} /></RoomPet>
    <RoomPet index={1} name="Pepper"><PetStage species="dog" appearance="midnight" mood="content" reaction={action} onReactionComplete={() => setAction(null)} /></RoomPet>
    <div className="room-toolbar">{["feed","pet","clean"].map(action => <button key={action} onClick={() => setAction({action,id:Date.now()})}>{action}</button>)}</div>
  </RoomSceneView><div className="theme-preview-gallery">{ROOM_THEMES.flatMap(t=>THEMED_FURNITURE_TYPES.map(type=><div key={`${t.id}-${type.id}`}><FurnitureArt id={`furniture_${t.id}_${type.id}`} /><p>{t.label} {type.label}</p></div>))}</div><div style={{ display:"flex",flexWrap:"wrap" }}>{SHOP_CATALOG.filter(i => i.kind === "clothing").map(i => <div key={i.id}><CharacterAvatar character={{ ...character,clothingId:i.id }} /><p>{i.label}</p></div>)}</div></main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
