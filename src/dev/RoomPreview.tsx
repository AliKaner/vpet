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
import { BASE_TILES,defaultGardenTiles } from "../../convex/lib/roomTiles";
import { FurniturePreview } from "../components/shop/FurniturePreview";
import { FurnitureSetFilter } from "../components/room/FurnitureSetFilter";
import { SET_FURNITURE, type FurnitureSetId } from "../../convex/lib/furnitureSets";
import "../index.css";
import { StatBar } from "../components/pet/StatBar";
import { ActionButton } from "../components/pet/ActionButton";
const character = { gender:"neutral",hairStyle:"bob",hairColor:"chestnut",eyeColor:"green",skinTone:"warm",accessory:"glasses",clothingId:"cloth_overalls" } as const;
export function Preview() {
  const [room,setRoom] = useState<ComponentProps<typeof RoomSceneView>["room"]>({ level:1,wallpaperId:undefined,floorId:undefined,placedItemIds:[],placements:[
    { itemId:"furniture_sofa",x:12,y:55 }, { itemId:"furniture_cat_tree",x:72,y:14 }, { itemId:"furniture_rug",x:50,y:53 }, { itemId:"furniture_lamp",x:8,y:82 }, { itemId:"furniture_aquarium",x:14,y:14 }, { itemId:"decor_window",x:20,y:35 },
  ].map(p => ({...p,flipped:false})) });
  const [action,setAction] = useState<{action:string;id:number}|null>(null);
  const [theme,setTheme]=useState<RoomThemeId | "all">("all");
  const [collection,setCollection]=useState<FurnitureSetId|"all">("all");
  function chooseSet(value:FurnitureSetId|"all") {
    setCollection(value);setTheme("all");
    if(value==="all") return;
    const coordinates=[[18,60],[65,16],[15,15],[72,65]];
    setRoom(prev=>({...prev,placements:SET_FURNITURE.filter(i=>i.collection===value).map((item,i)=>({itemId:item.id,x:coordinates[i][0],y:coordinates[i][1],flipped:false,area:item.outdoor?"garden":"room"}))}));
  }
  function chooseTheme(value:RoomThemeId | "all") {
    setTheme(value);
    if(value==="all") return;
    const coordinates=[[18,55],[65,12],[15,15],[70,63]];
    setRoom(prev=>({ ...prev,wallpaperId:`wallpaper_theme_${value}`,floorId:`floor_theme_${value}`,placements:[...prev.placements.filter(p=>p.area==="garden"),...THEMED_FURNITURE_TYPES.map((type,i)=>({itemId:`furniture_${value}_${type.id}`,x:coordinates[i][0],y:coordinates[i][1],flipped:false}))] }));
  }
  return <main style={{ maxWidth:1280,margin:"24px auto",padding:16 }}><ThemeFilter value={theme} onChange={chooseTheme} /><RoomSceneView room={room} character={character} coins={1000000} onBuyTile={async (tile,area)=>setRoom(prev=>{const home=prev.tiles??BASE_TILES,grass=prev.gardenTiles??defaultGardenTiles(home);return {...prev,tiles:area==="room"?[...home,tile]:home,gardenTiles:area==="garden"?[...grass,tile]:grass.filter(t=>t.x!==tile.x||t.y!==tile.y),gardenPurchases:(prev.gardenPurchases??0)+(area==="garden"?1:0),tilePurchases:(prev.tilePurchases??0)+1};})} onUpgrade={async()=>setRoom(prev=>({...prev,level:(prev.level??1)+1}))} picker={close=><div className="preview-picker-grid">{SHOP_CATALOG.filter(i=>i.kind==="furniture").map(item=><button key={item.id} onClick={()=>{setRoom(prev=>{const grass=prev.gardenTiles??defaultGardenTiles(prev.tiles??BASE_TILES),tile=grass[prev.placements.filter(p=>p.area==="garden").length%grass.length];return {...prev,placements:[...prev.placements.filter(p=>p.itemId!==item.id),{itemId:item.id,x:30,y:30,area:item.kind==="furniture"&&item.outdoor?"garden":"room",...(item.kind==="furniture"&&item.outdoor?{tileX:tile.x+.5,tileY:tile.y+.5}:{}),flipped:false}]};});close();}}><FurnitureArt id={item.id}/>{item.label}</button>)}</div>} move={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.map(p => p.itemId === args.itemId ? {...p,...args,tileX:args.x/25,tileY:args.y/25} : p) })); }} remove={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.filter(p => p.itemId !== args.itemId) })); }}>
    <RoomPet index={0} name="Miso"><PetStage species="cat" mood="content" reaction={null} /></RoomPet>
    <RoomPet index={1} name="Pepper"><PetStage species="dog" appearance="midnight" mood="content" reaction={action} onReactionComplete={() => setAction(null)} /></RoomPet>
    <div className="room-multi-pets">{["Miso","Pepper"].map(name=><div key={name} className="room-pet-card"><div className="pet-home-embedded flex flex-col gap-5"><div className="flex justify-between"><div><h1>{name}</h1><p className="text-xs">Happy companion</p></div><span className="text-xs">Young · 3 days</span></div><button className="pet-sound-toggle">Sound off</button><div className="pet-vitals"><StatBar label="Hunger" value={74} icon="🍖" colorVar="#dfb278"/><StatBar label="Cleanliness" value={88} icon="🧼" colorVar="#85b9c3"/><StatBar label="Happiness" value={91} icon="💗" colorVar="#dba5b7"/><StatBar label="Health" value={95} icon="❤️" colorVar="#a6bf8a"/></div><div className="pet-actions flex gap-2">{["feed","pet","clean"].map((value,index)=><ActionButton key={value} label={value} icon={["🍖","💗","🧼"][index]} accentClass="bg-peach" cooldownRemainingMs={0} pending={false} onPress={()=>setAction({action:value,id:Date.now()})}/>)}</div></div></div>)}</div>
  </RoomSceneView><FurnitureSetFilter value={collection} onChange={chooseSet}/><div className="theme-preview-gallery">{SHOP_CATALOG.filter(i=>i.kind==="furniture" && i.collection===collection).map(item=><div key={item.id}><FurniturePreview item={item}/><p>{item.label}</p></div>)}</div><div className="theme-preview-gallery">{ROOM_THEMES.flatMap(t=>THEMED_FURNITURE_TYPES.map(type=><div key={`${t.id}-${type.id}`}><FurnitureArt id={`furniture_${t.id}_${type.id}`} /><p>{t.label} {type.label}</p></div>))}</div><div style={{ display:"flex",flexWrap:"wrap" }}>{SHOP_CATALOG.filter(i => i.kind === "clothing").map(i => <div key={i.id}><CharacterAvatar character={{ ...character,clothingId:i.id }} /><p>{i.label}</p></div>)}</div></main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
