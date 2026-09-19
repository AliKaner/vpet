export const ROOM_THEMES = [
  { id:"forest", label:"Forest Cottage", color:"#8faa7a", wall:"#e0ead6", floor:"#bc986f", pattern:"leaves" },
  { id:"seaside", label:"Seaside", color:"#7fbdce", wall:"#dceff2", floor:"#e9d6b7", pattern:"waves" },
  { id:"strawberry", label:"Strawberry", color:"#e69aab", wall:"#fae5e8", floor:"#eac8b8", pattern:"flowers" },
  { id:"midnight", label:"Midnight", color:"#55668f", wall:"#aab5d1", floor:"#8e7d7a", pattern:"stars" },
  { id:"goth",label:"Goth",color:"#5d233d",wall:"#4d4055",floor:"#54434a",pattern:"goth" },
  { id:"disco",label:"Disco",color:"#cd69df",wall:"#5a4277",floor:"#74678e",pattern:"disco" },
  { id:"pink",label:"Sweet Pink",color:"#f1a9c3",wall:"#fbe3ee",floor:"#e6c2cf",pattern:"hearts" },
  { id:"purple",label:"Purple Dream",color:"#a18aca",wall:"#e0d5f1",floor:"#b6a2ca",pattern:"stars" },
  { id:"cyberpunk",label:"Cyberpunk",color:"#48d2d7",wall:"#344354",floor:"#45445b",pattern:"circuit" },
] as const;
export const THEME_LABELS: Record<string,readonly string[]>={
  goth:["Velvet Throne","Gothic Cabinet","Candle Fireplace","Rose Pouf"],
  disco:["Holographic Chair","Jukebox","DJ Console","Dance Floor"],
  pink:["Heart Chair","Heart Wardrobe","Heart Vanity","Pink Pouf"],
  purple:["Scalloped Chair","Moon Bookcase","Moon Lamp","Star Pouf"],
  cyberpunk:["Neon Chair","Cyber Vending Machine","Neon Workstation","Light Platform"],
};
export type RoomThemeId = typeof ROOM_THEMES[number]["id"];
export const THEMED_FURNITURE_TYPES = [
  { id:"armchair",label:"Reading Chair",price:55 },
  { id:"wardrobe",label:"Wardrobe",price:75 },
  { id:"fireplace",label:"Fireplace",price:85 },
  { id:"ottoman",label:"Ottoman",price:35 },
] as const;
