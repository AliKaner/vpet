import { useMutation } from "convex/react";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ShopItem } from "../../../convex/lib/shopItems";
import { FurniturePreview } from "./FurniturePreview";
import { ToyClothingArt } from "./ToyClothingArt";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return fallback;
}

interface PetOption {
  _id: Id<"pets">;
  name: string;
  equippedToyId?: string;
  equippedClothingId?: string;
}

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  coins: number;
  pets: PetOption[];
}

export function ShopItemCard({ item, owned, coins, pets }: ShopItemCardProps) {
  const buyItem = useMutation(api.shop.buyItem);
  const equipItem = useMutation(api.shop.equipItem);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleBuy() {
    setBusy(true);
    setError(null);
    try {
      await buyItem({ itemId: item.id });
    } catch (err) {
      setError(errorMessage(err, "Couldn't buy that - check your coin balance."));
    } finally {
      setBusy(false);
    }
  }

  async function handleEquipChange(petId: string, checked: boolean) {
    if (item.kind !== "toy" && item.kind !== "clothing") return;
    setError(null);
    try {
      await equipItem({ petId: petId as Id<"pets">, itemId: checked ? item.id : null, slot: item.kind });
    } catch (err) {
      setError(errorMessage(err, "Couldn't equip that item."));
    }
  }

  const isPetEquippable = item.kind === "toy" || item.kind === "clothing";
  const equippedField = item.kind === "toy" ? "equippedToyId" : "equippedClothingId";

  return (
    <div className={`flex flex-col gap-2 rounded-cozy bg-white/70 p-4 shadow-sm ${item.kind === "furniture" || item.kind === "decor" ? "shop-decoration-card" : ""}`}>
      <div className="shop-item-heading flex items-center gap-3">
        {item.kind === "furniture" || item.kind === "decor" ? (
          <FurniturePreview item={item} />
        ) : item.kind === "wallpaper" || item.kind === "floor" ? (
          <span className="shop-material-preview" aria-hidden style={{ backgroundColor: item.bgColor }} />
        ) : (
          <span className="shop-toy-clothing-preview" aria-hidden>
            <ToyClothingArt id={item.id} />
          </span>
        )}
        <div className="flex-1">
          <p className="font-bold text-cocoa">{item.label}</p>
          <p className="text-xs text-cocoa-soft">{item.description}</p>
        </div>
      </div>

      {!owned ? (
        <button
          type="button"
          onClick={() => void handleBuy()}
          disabled={busy || coins < item.price}
          className="self-start rounded-xl bg-peach px-3 py-1.5 text-sm font-bold text-white transition hover:bg-peach-dark disabled:opacity-50"
        >
          Buy for {"\u{1FA99}"} {item.price}
        </button>
      ) : isPetEquippable && pets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pets.map((pet) => {
            const checked = pet[equippedField] === item.id;
            return (
              <label
                key={pet._id}
                className={`flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                  checked ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => void handleEquipChange(pet._id, e.target.checked)}
                />
                {pet.name}
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-xs font-bold text-mint-dark">
          {isPetEquippable
            ? "Owned"
            : item.kind === "wallpaper" || item.kind === "floor"
              ? "Owned - choose it in your Room"
              : "Owned - place it in your Room"}
        </p>
      )}
      {error && <p className="text-xs font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
