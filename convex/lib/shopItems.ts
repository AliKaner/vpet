import { ROOM_THEMES, THEMED_FURNITURE_TYPES, THEME_LABELS, type RoomThemeId } from "./roomThemes";
import { SET_FURNITURE, type FurnitureSetId } from "./furnitureSets";

export interface ToyItem {
  id: string;
  kind: "toy";
  label: string;
  icon: string;
  price: number;
  description: string;
  effect: { stat: "hunger" | "cleanliness" | "happiness"; decayMultiplier: number };
}

export interface ClothingItem {
  id: string;
  kind: "clothing";
  label: string;
  icon: string;
  price: number;
  description: string;
}

export interface DecorItem {
  id: string;
  kind: "decor";
  label: string;
  icon: string;
  price: number;
  description: string;
}

export interface WallpaperItem {
  theme?: RoomThemeId;
  id: string;
  kind: "wallpaper";
  label: string;
  icon: string;
  price: number;
  description: string;
  bgColor: string;
}

export interface FloorItem {
  theme?: RoomThemeId;
  id: string;
  kind: "floor";
  label: string;
  icon: string;
  price: number;
  description: string;
  bgColor: string;
}

export interface FurnitureItem {
  scale?: number;
  floorMat?: boolean;
  collection?: FurnitureSetId;
  wallMounted?: boolean;
  theme?: RoomThemeId;
  outdoor?: boolean;
  id: string;
  kind: "furniture";
  label: string;
  icon: string;
  price: number;
  description: string;
}

export type ShopItem = ToyItem | ClothingItem | DecorItem | WallpaperItem | FloorItem | FurnitureItem;

/** Items that can be freely placed/removed in a room (as opposed to wallpaper/floor,
 * which are a single active choice). */
export function isPlaceable(item: ShopItem): item is DecorItem | FurnitureItem {
  return item.kind === "decor" || item.kind === "furniture";
}

export function isWallFurniture(id: string): boolean {
  const item = getShopItem(id);
  return item?.kind === "furniture" ? item.wallMounted === true : item?.kind === "decor" && /window$|clock|poster|banner|streamers|disco/.test(id);
}

/** Items that set a single active room style rather than being placed individually. */
export function isRoomStyle(item: ShopItem): item is WallpaperItem | FloorItem {
  return item.kind === "wallpaper" || item.kind === "floor";
}

export const SHOP_CATALOG: ShopItem[] = [
  ...SET_FURNITURE.map((item): FurnitureItem => ({...item,kind:"furniture",icon:"🛋️",description:`Part of the ${item.collection} set. Place, move and flip it to make it yours.`})),
  ...ROOM_THEMES.flatMap((theme): ShopItem[] => [
    ...THEMED_FURNITURE_TYPES.map((type,index): FurnitureItem => ({
      id:`furniture_${theme.id}_${type.id}`, kind:"furniture", theme:theme.id,
      label:`${theme.label} ${THEME_LABELS[theme.id]?.[index] ?? type.label}`, icon:"🛋️",price:type.price,
      description:`Part of the ${theme.label} collection. Mix colors or build a matching room.`,
    })),
    { id:`wallpaper_theme_${theme.id}`,kind:"wallpaper",theme:theme.id,label:`${theme.label} Walls`,icon:"🎨",price:40,description:`Patterned walls for the ${theme.label} collection.`,bgColor:theme.wall },
    { id:`floor_theme_${theme.id}`,kind:"floor",theme:theme.id,label:`${theme.label} Floor`,icon:"🪵",price:35,description:`Coordinating flooring for the ${theme.label} collection.`,bgColor:theme.floor },
  ]),
  {id:"furniture_garden_bench",kind:"furniture",outdoor:true,label:"Flower Garden Bench",icon:"🌷",price:35,description:"A flower-framed seat for your garden."},
  {id:"furniture_garden_arch",kind:"furniture",outdoor:true,label:"Rose Pergola",icon:"🌹",price:55,description:"A flowering entrance to your garden."},
  {id:"furniture_garden_fountain",kind:"furniture",outdoor:true,label:"Garden Fountain",icon:"⛲",price:70,description:"A little stone fountain for your outdoor corner."},
  {id:"furniture_garden_planter",kind:"furniture",outdoor:true,label:"Raised Flower Bed",icon:"🌻",price:25,description:"A colorful raised flower garden."},
  { id: "furniture_cat_tree", kind: "furniture", label: "Cat Tree", icon: "🐈", price: 65, description: "A climbing tower with a lavender lookout." },
  { id: "furniture_perch", kind: "furniture", label: "Bird Perch", icon: "🦜", price: 40, description: "A raised perch for a feathered roommate." },
  { id: "furniture_terrarium", kind: "furniture", label: "Glass Terrarium", icon: "🌿", price: 70, description: "A planted glass habitat for a quiet corner." },
  { id: "furniture_tunnel", kind: "furniture", label: "Mouse Tunnel", icon: "🐭", price: 35, description: "A little lavender hideaway." },
  { id: "furniture_hay", kind: "furniture", label: "Hay Bale", icon: "🌾", price: 30, description: "A golden bale for your stable corner." },
  { id: "furniture_aquarium", kind: "furniture", label: "Mini Aquarium", icon: "🐠", price: 80, description: "A peaceful blue accent for your room." },
  { id: "cloth_sweater", kind: "clothing", label: "Rose Sweater", icon: "🧶", price: 45, description: "A warm rose-colored knit." },
  { id: "cloth_vest", kind: "clothing", label: "Forest Vest", icon: "🌿", price: 45, description: "A soft moss-green outfit." },
  {
    id: "toy_ball",
    kind: "toy",
    label: "Squeaky Ball",
    icon: "\u{1F3BE}",
    price: 30,
    description: "Happiness fades 15% slower while equipped.",
    effect: { stat: "happiness", decayMultiplier: 0.85 },
  },
  {
    id: "toy_puzzle",
    kind: "toy",
    label: "Puzzle Feeder",
    icon: "\u{1F9E9}",
    price: 50,
    description: "Hunger fades 10% slower while equipped.",
    effect: { stat: "hunger", decayMultiplier: 0.9 },
  },
  {
    id: "toy_scratcher",
    kind: "toy",
    label: "Scratch Post",
    icon: "\u{1FAB5}",
    price: 40,
    description: "Cleanliness fades 10% slower while equipped.",
    effect: { stat: "cleanliness", decayMultiplier: 0.9 },
  },
  {
    id: "cloth_bow",
    kind: "clothing",
    label: "Bow",
    icon: "\u{1F380}",
    price: 20,
    description: "A cute little bow. Purely for show.",
  },
  {
    id: "cloth_cap",
    kind: "clothing",
    label: "Tiny Cap",
    icon: "\u{1F9E2}",
    price: 25,
    description: "A tiny cap. Purely for show.",
  },
  {
    id: "cloth_scarf",
    kind: "clothing",
    label: "Scarf",
    icon: "\u{1F9E3}",
    price: 35,
    description: "A cozy scarf. Purely for show.",
  },
  { id: "cloth_hoodie", kind: "clothing", label: "Cozy Hoodie", icon: "🧥", price: 45, description: "A soft hoodie for chilly naps." },
  { id: "cloth_raincoat", kind: "clothing", label: "Raincoat", icon: "🌧️", price: 50, description: "Ready for every puddle." },
  { id: "cloth_crown", kind: "clothing", label: "Tiny Crown", icon: "👑", price: 75, description: "For the ruler of the room." },
  { id: "cloth_pajamas", kind: "clothing", label: "Pajamas", icon: "🌙", price: 40, description: "The official bedtime uniform." },
  { id: "cloth_overalls", kind: "clothing", label: "Overalls", icon: "🧢", price: 55, description: "Ready for a day of play." },
  {
    id: "decor_disco_ball",
    kind: "decor",
    label: "Disco Ball",
    icon: "🪩",
    price: 60,
    description: "Non-negotiable. Every room needs one.",
  },
  {
    id: "decor_poster",
    kind: "decor",
    label: "Pop Star Poster",
    icon: "\u{1F5BC}\u{FE0F}",
    price: 40,
    description: "A poster of your household's favorite pop star.",
  },
  {
    id: "decor_streamers",
    kind: "decor",
    label: "Party Streamers",
    icon: "\u{1F389}",
    price: 25,
    description: "Frilly, festive, and always ready for a party.",
  },
  {
    id: "decor_music_player",
    kind: "decor",
    label: "Music Player",
    icon: "\u{1F4FB}",
    price: 50,
    description: "Plays a little tune when you turn it on.",
  },
  { id: "decor_plant", kind: "decor", label: "Leafy Plant", icon: "🪴", price: 30, description: "A cheerful corner plant." },
  { id: "decor_window", kind: "decor", label: "Sunny Window", icon: "🪟", price: 55, description: "A little view of the outside." },
  { id: "decor_clock", kind: "decor", label: "Cozy Clock", icon: "🕰️", price: 25, description: "Tick-tock, cozy o'clock." },
  { id: "decor_paw_banner", kind: "decor", label: "Paw Banner", icon: "🎏", price: 35, description: "A banner for your favorite pet." },
  {
    id: "decor_bookshelf",
    kind: "decor",
    label: "Bookshelf",
    icon: "\u{1F4DA}",
    price: 35,
    description: "A cozy little shelf of books.",
  },
  {
    id: "wallpaper_stripes",
    kind: "wallpaper",
    label: "Cozy Stripes",
    icon: "\u{1F3A8}",
    price: 30,
    description: "A warm, striped wallpaper.",
    bgColor: "#fdeee0",
  },
  {
    id: "wallpaper_party",
    kind: "wallpaper",
    label: "Party Pink",
    icon: "\u{1F3A8}",
    price: 45,
    description: "Bright and celebratory.",
    bgColor: "#ffe3f1",
  },
  {
    id: "wallpaper_night",
    kind: "wallpaper",
    label: "Starry Night",
    icon: "\u{1F3A8}",
    price: 45,
    description: "Cool and dreamy.",
    bgColor: "#e3e8ff",
  },
  { id: "wallpaper_garden", kind: "wallpaper", label: "Garden Morning", icon: "🎨", price: 55, description: "Soft leaves and morning light.", bgColor: "#e0f0d9" },
  { id: "wallpaper_candy", kind: "wallpaper", label: "Candy Clouds", icon: "🎨", price: 55, description: "Playful peach and lavender clouds.", bgColor: "#f5e0ef" },
  { id: "wallpaper_seaside", kind: "wallpaper", label: "Sea Breeze", icon: "🎨", price: 60, description: "A calm blue room with sunlight.", bgColor: "#d9eef0" },
  {
    id: "floor_wood",
    kind: "floor",
    label: "Polished Wood",
    icon: "\u{1FAB5}",
    price: 30,
    description: "Warm honey-toned floorboards.",
    bgColor: "#d9a86c",
  },
  {
    id: "floor_tile",
    kind: "floor",
    label: "Checkered Tile",
    icon: "\u{25FB}️",
    price: 35,
    description: "Crisp black-and-cream tile.",
    bgColor: "#e8e2d6",
  },
  {
    id: "floor_carpet",
    kind: "floor",
    label: "Plush Carpet",
    icon: "\u{1F7EB}",
    price: 35,
    description: "Soft and cozy underfoot.",
    bgColor: "#d8c3e8",
  },
  { id: "floor_sunlit", kind: "floor", label: "Sunlit Boards", icon: "🪵", price: 45, description: "Pale boards with warm light.", bgColor: "#edc98e" },
  { id: "floor_sage", kind: "floor", label: "Sage Mat", icon: "🟩", price: 45, description: "A soft green woven floor.", bgColor: "#b9d2b5" },
  {
    id: "furniture_sofa",
    kind: "furniture",
    label: "Sofa",
    icon: "\u{1F6CB}️",
    price: 55,
    description: "Somewhere comfy to sit.",
  },
  {
    id: "furniture_table",
    kind: "furniture",
    label: "Coffee Table",
    icon: "\u{1F6CE}️",
    price: 30,
    description: "Perfect for a snack bowl.",
  },
  {
    id: "furniture_bed",
    kind: "furniture",
    label: "Pet Bed",
    icon: "\u{1F6CF}️",
    price: 45,
    description: "A soft little bed of their own.",
  },
  {
    id: "furniture_lamp",
    kind: "furniture",
    label: "Floor Lamp",
    icon: "\u{1F4A1}",
    price: 25,
    description: "Warm, cozy lighting.",
  },
  {
    id: "furniture_rug",
    kind: "furniture",
    label: "Round Rug",
    icon: "\u{1F7E0}",
    price: 20,
    description: "Ties the whole room together.",
  },
  { id: "furniture_desk", kind: "furniture", label: "Writing Desk", icon: "🪑", price: 50, description: "A tiny desk for big ideas." },
  { id: "furniture_plant_stand", kind: "furniture", label: "Plant Stand", icon: "🪴", price: 40, description: "A raised spot for greenery." },
  { id: "furniture_window_seat", kind: "furniture", label: "Window Seat", icon: "🛋️", price: 65, description: "The best nap spot in the room." },
];

export function getShopItem(itemId: string): ShopItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === itemId);
}

/** The decay multipliers contributed by whatever toy is currently equipped. */
export function getEquippedEffects(
  equippedToyId: string | undefined,
): Partial<Record<"hunger" | "cleanliness" | "happiness", number>> {
  if (equippedToyId === undefined) return {};
  const item = getShopItem(equippedToyId);
  if (item === undefined || item.kind !== "toy") return {};
  return { [item.effect.stat]: item.effect.decayMultiplier };
}
