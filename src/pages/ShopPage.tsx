import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SHOP_CATALOG } from "../../convex/lib/shopItems";
import { ShopItemCard } from "../components/shop/ShopItemCard";

export function ShopPage() {
  const inventory = useQuery(api.shop.getMyInventory);
  const profile = useQuery(api.users.getMyProfile);
  const pets = useQuery(api.pets.getMyPets);

  if (inventory === undefined || profile === undefined || pets === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading shop...</p>;
  }

  const ownedIds = new Set(inventory);
  const toys = SHOP_CATALOG.filter((item) => item.kind === "toy");
  const clothing = SHOP_CATALOG.filter((item) => item.kind === "clothing");

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Shop</h1>
        <span className="rounded-full bg-sun/40 px-3 py-1 text-sm font-bold text-sun-dark">
          {"\u{1FA99}"} {profile.coins}
        </span>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-cocoa-soft">Toys</h2>
        {toys.map((item) => (
          <ShopItemCard key={item.id} item={item} owned={ownedIds.has(item.id)} coins={profile.coins} pets={pets} />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-cocoa-soft">Clothing</h2>
        {clothing.map((item) => (
          <ShopItemCard key={item.id} item={item} owned={ownedIds.has(item.id)} coins={profile.coins} pets={pets} />
        ))}
      </section>
    </div>
  );
}
