import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { SHOP_CATALOG, type ShopItem } from "../../convex/lib/shopItems";
import { ShopItemCard } from "../components/shop/ShopItemCard";
import { ThemeFilter } from "../components/room/ThemeFilter";
import { FurnitureSetFilter } from "../components/room/FurnitureSetFilter";
import type { FurnitureSetId } from "../../convex/lib/furnitureSets";
import type { RoomThemeId } from "../../convex/lib/roomThemes";

const CATEGORIES: { id: ShopItem["kind"]; label: string }[] = [
  { id: "toy", label: "Toys" },
  { id: "clothing", label: "Clothing" },
  { id: "decor", label: "Decor" },
  { id: "furniture", label: "Furniture" },
  { id: "wallpaper", label: "Wallpaper" },
  { id: "floor", label: "Flooring" },
];

export function ShopPage() {
  const inventory = useQuery(api.shop.getMyInventory);
  const decorInventory = useQuery(api.decor.getMyDecorInventory);
  const profile = useQuery(api.users.getMyProfile);
  const pets = useQuery(api.pets.getMyPets);
  // The deployed backend's own copy of the catalog - can briefly lag behind the
  // frontend's if the frontend and Convex backend deploy separately. Filtering
  // against this means the Shop only ever offers items the backend can actually sell.
  const supportedIds = useQuery(api.shop.getSupportedCatalogIds);
  const [filter, setFilter] = useState<ShopItem["kind"] | "all">("all");
  const [theme,setTheme] = useState<RoomThemeId | "all">("all");
  const [collection,setCollection]=useState<FurnitureSetId|"all">("all");

  if (
    inventory === undefined ||
    decorInventory === undefined ||
    profile === undefined ||
    pets === undefined ||
    supportedIds === undefined
  ) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading shop...</p>;
  }

  const supportedIdSet = new Set(supportedIds);
  const availableCatalog = SHOP_CATALOG.filter((item) => supportedIdSet.has(item.id) && (theme === "all" || ("theme" in item && item.theme === theme)) && (collection==="all" || (item.kind==="furniture" && item.collection===collection)));
  const ownedIds = new Set(inventory);
  // Decor/wallpaper/floor/furniture are shared with a partner, so anything either of
  // you bought counts as owned here (no reason to let it be bought twice).
  const householdOwnedIds = new Set([...inventory, ...decorInventory]);

  const visibleCategories = filter === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === filter);

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Shop</h1>
        <span className="rounded-full bg-sun/40 px-3 py-1 text-sm font-bold text-sun-dark">
          {"\u{1FA99}"} {profile.coins}
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {setFilter("all");setTheme("all");setCollection("all");}}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            filter === "all" ? "bg-peach text-white" : "bg-white/70 text-cocoa-soft hover:bg-cream-dark"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => {setFilter(category.id);setTheme("all");setCollection("all");}}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              filter === category.id ? "bg-peach text-white" : "bg-white/70 text-cocoa-soft hover:bg-cream-dark"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {(filter === "all" || filter === "furniture" || filter === "wallpaper" || filter === "floor") && <ThemeFilter value={theme} onChange={value=>{setTheme(value);setCollection("all");}} />}
      {(filter==="all" || filter==="furniture") && <FurnitureSetFilter value={collection} onChange={value=>{setCollection(value);setTheme("all");setFilter("furniture");}} />}
      {availableCatalog.length === 0 && <p className="text-sm text-cocoa-soft">This collection is not available yet.</p>}
      {visibleCategories.map((category) => {
        const items = availableCatalog.filter((item) => item.kind === category.id);
        if (items.length === 0) return null;
        const isPersonal = category.id === "toy" || category.id === "clothing";
        return (
          <section key={category.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-cocoa-soft">{category.label}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={isPersonal ? ownedIds.has(item.id) : householdOwnedIds.has(item.id)}
                  coins={profile.coins}
                  pets={isPersonal ? pets : []}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
