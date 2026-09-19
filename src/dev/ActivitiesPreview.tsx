import { useState,type ComponentProps } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ActivitiesView } from "../pages/ActivitiesPage";
import { FurniturePreview } from "../components/shop/FurniturePreview";
import { SHOP_CATALOG } from "../../convex/lib/shopItems";
import "../index.css";
type State=ComponentProps<typeof ActivitiesView>["state"];
export function Preview() {
  const [state,setState]=useState<State>(()=>({coins:100,dailyClaimed:false,memoryWins:0,shiftsPaid:0,shiftReadyAt:null,gameId:0,cards:[],matched:[],turn:0,resetAt:0,active:false,expiresAt:0,serverNow:Date.now()}));
  return <main style={{maxWidth:680,margin:"auto",padding:16}}><ActivitiesView state={state} act={async action=>{
    if(action==="daily") {setState(p=>({...p,dailyClaimed:true,coins:p.coins+15}));return 15;}
    if(action==="startShift") {setState(p=>({...p,shiftReadyAt:Date.now()+120000}));return null;}
    if(action==="claimShift") {setState(p=>({...p,shiftReadyAt:null,shiftsPaid:p.shiftsPaid+1,coins:p.coins+25}));return 25;}
    setState(p=>({...p,gameId:p.gameId+1,cards:Array(12).fill(null),matched:[],active:true,expiresAt:Date.now()+900000}));return null;
  }} flip={async index=>{setState(p=>({...p,cards:p.cards.map((v,i)=>i===index?Math.floor(i/2):v)}));return 0;}}/>
  <h2 style={{fontSize:24,fontWeight:800,marginTop:24}}>Decoration Shop · Preview</h2><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16}}>{SHOP_CATALOG.filter(i=>i.kind==="furniture"&&["lounge","bedroom","bathroom","accents"].includes(i.collection??"")).map(item=><div key={item.id} className="shop-decoration-card rounded-cozy bg-white/70 p-4"><div className="shop-item-heading flex"><FurniturePreview item={item}/><strong>{item.label}</strong></div><p>{item.price} coins</p></div>)}</div></main>;
}
createRoot(document.getElementById("root")!).render(<BrowserRouter><Preview/></BrowserRouter>);
