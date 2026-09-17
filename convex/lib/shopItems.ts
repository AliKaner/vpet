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

export type ShopItem = ToyItem | ClothingItem;

export const SHOP_CATALOG: ShopItem[] = [
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
