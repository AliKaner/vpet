import { useState } from "react";
import { FurnitureArt } from "../room/FurnitureArt";
import { DecorationDialog } from "../room/DecorationDialog";
import type { ShopItem } from "../../../convex/lib/shopItems";
export function FurniturePreview({item}:{item:ShopItem}) {
  const [open,setOpen]=useState(false);
  const [flipped,setFlipped]=useState(false);
  return <>
    <button type="button" className="shop-furniture-preview" aria-label={`Preview ${item.label}`} onClick={()=>setOpen(true)}><FurnitureArt id={item.id}/><small>Preview ↗</small></button>
    {open && <DecorationDialog open={open} onClose={()=>setOpen(false)} title={item.label} description={`${item.price} coins · Furniture preview`}>
      <div className="furniture-detail-preview"><div style={{transform:flipped?"scaleX(-1)":undefined}}><FurnitureArt id={item.id}/></div></div>
      <p>{item.description}</p><button className="furniture-preview-flip" type="button" onClick={()=>setFlipped(!flipped)}>Flip preview</button>
      <p className="text-xs text-cocoa-soft">Close the preview to purchase. Previewing does not spend coins.</p>
    </DecorationDialog>}
  </>;
}
