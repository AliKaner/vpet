/** Sprite order is stable: four objects per row, four rows per atlas. */
export const FURNITURE_SETS = [
  {id:"library",label:"Library",items:["Oak Bookcase","Mint Bookcase","Reading Armchair","Book Trolley"],prices:[75,55,60,35]},
  {id:"gamer",label:"Gamer",items:["Dual Monitor Desk","RGB Gaming Chair","Glass PC Tower","Retro Arcade"],prices:[100,65,80,90]},
  {id:"plants",label:"Greenhouse",items:["Monstera","Fern Stand","Indoor Palm","Daisy Basket"],prices:[25,40,45,20]},
  {id:"plush",label:"Plush Friends",items:["Teddy Bear","Bunny Plush","Cat Plush","Frog Plush"],prices:[30,30,30,30]},
  {id:"kitchen",label:"Kitchen",items:["Mint Refrigerator","Cream Oven","Oak Sink Counter","Breakfast Island"],prices:[85,75,65,90]},
  {id:"patio",label:"Garden Living",items:["Patio Dining Set","Flower Swing","Garden Hammock","Barbecue Grill"],prices:[80,70,55,65]},
  {id:"spa",label:"Spa Retreat",items:["Bubbling Jacuzzi","Sauna Lounger","Parasol Daybed","Spa Towel Rack"],prices:[140,55,85,30]},
  {id:"curtains",label:"Curtains",items:["Pink Bow Curtains","Lavender Star Curtains","Sage Linen Curtains","Gothic Velvet Curtains"],prices:[35,35,35,40]},
] as const;
export type FurnitureSetId = typeof FURNITURE_SETS[number]["id"];
export const SET_FURNITURE = FURNITURE_SETS.flatMap((set,row)=>set.items.map((label,col)=>({
  id:`furniture_set_${set.id}_${col}`,label,price:set.prices[col],collection:set.id,
  outdoor:set.id==="patio" || set.id==="spa",wallMounted:set.id==="curtains",sprite:56+row*4+col,
})));
