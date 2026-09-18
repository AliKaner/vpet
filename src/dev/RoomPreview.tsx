import { useState } from "react";
import { createRoot } from "react-dom/client";
import { RoomSceneView } from "../components/room/RoomScene";
import { RoomPet } from "../components/room/RoomPet";
import { PetStage } from "../components/pet/PetStage";
import { CharacterAvatar } from "../components/character/CharacterAvatar";
import { SHOP_CATALOG } from "../../convex/lib/shopItems";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../convex/_generated/api";
import "../index.css";
const character = { gender:"neutral",hairStyle:"bob",hairColor:"chestnut",eyeColor:"green",skinTone:"warm",accessory:"glasses",clothingId:"cloth_overalls" } as const;
export function Preview() {
  const [room,setRoom] = useState<FunctionReturnType<typeof api.decor.getMyRoom>>({ wallpaperId:undefined,floorId:undefined,placedItemIds:[],placements:[
    { itemId:"furniture_sofa",x:12,y:55 }, { itemId:"furniture_cat_tree",x:72,y:14 }, { itemId:"furniture_rug",x:50,y:53 }, { itemId:"furniture_lamp",x:8,y:82 }, { itemId:"furniture_aquarium",x:14,y:14 }, { itemId:"decor_window",x:20,y:35 },
  ].map(p => ({...p,flipped:false})) });
  const [action,setAction] = useState<{action:string;id:number}|null>(null);
  return <main style={{ maxWidth:760,margin:"24px auto",padding:16 }}><RoomSceneView room={room} character={character} move={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.map(p => p.itemId === args.itemId ? args : p) })); }} remove={async args => { setRoom(prev => ({ ...prev,placements:prev.placements.filter(p => p.itemId !== args.itemId) })); }}>
    <RoomPet index={0} name="Miso"><PetStage species="cat" mood="content" reaction={null} /></RoomPet>
    <RoomPet index={1} name="Pepper"><PetStage species="dog" appearance="midnight" mood="content" reaction={action} onReactionComplete={() => setAction(null)} /></RoomPet>
    <div className="room-toolbar">{["feed","pet","clean"].map(action => <button key={action} onClick={() => setAction({action,id:Date.now()})}>{action}</button>)}</div>
  </RoomSceneView><div style={{ display:"flex",flexWrap:"wrap" }}>{SHOP_CATALOG.filter(i => i.kind === "clothing").map(i => <div key={i.id}><CharacterAvatar character={{ ...character,clothingId:i.id }} /><p>{i.label}</p></div>)}</div></main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
