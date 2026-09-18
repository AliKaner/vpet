import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  SHOP_CATALOG,
  type DecorItem,
  type FloorItem,
  type FurnitureItem,
  type WallpaperItem,
} from "../../convex/lib/shopItems";
import { RoomScene } from "../components/room/RoomScene";

interface StylePickerProps {
  label: string;
  options: (WallpaperItem | FloorItem)[];
  activeId: string | undefined;
  onChoose: (itemId: string | null) => void;
}

function StylePicker({ label, options, activeId, onChoose }: StylePickerProps) {
  if (options.length === 0) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-cocoa-soft">{label}</h2>
        <p className="text-xs text-cocoa-soft">None owned yet - check the Shop.</p>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-cocoa-soft">{label}</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChoose(null)}
          className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
            activeId === undefined ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
          }`}
        >
          Default
        </button>
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChoose(item.id)}
            className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
              activeId === item.id ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
            }`}
          >
            <i className="inline-block h-3 w-3 rounded-full" style={{ background: item.bgColor }} aria-hidden />
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

interface PlaceableListProps {
  label: string;
  items: (DecorItem | FurnitureItem)[];
  placedItemIds: string[];
  onToggle: (itemId: string, placed: boolean) => void;
}

function PlaceableList({ label, items, placedItemIds, onToggle }: PlaceableListProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-cocoa-soft">{label}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-cocoa-soft">None owned yet - check the Shop.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const placed = placedItemIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id, placed)}
                className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                  placed ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
                <span className="text-[10px] opacity-70">{placed ? "(in room)" : "(add)"}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function RoomPage() {
  const room = useQuery(api.decor.getMyRoom);
  const ownedIds = useQuery(api.decor.getMyDecorInventory);
  const placeItem = useMutation(api.decor.placeItem);
  const removeItem = useMutation(api.decor.removeItem);
  const setWallpaper = useMutation(api.decor.setWallpaper);
  const setFloor = useMutation(api.decor.setFloor);
  const [error, setError] = useState<string | null>(null);

  if (room === undefined || ownedIds === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading your room...</p>;
  }

  const ownedDecor = SHOP_CATALOG.filter(
    (item): item is DecorItem => item.kind === "decor" && ownedIds.includes(item.id),
  );
  const ownedFurniture = SHOP_CATALOG.filter(
    (item): item is FurnitureItem => item.kind === "furniture" && ownedIds.includes(item.id),
  );
  const ownedWallpaper = SHOP_CATALOG.filter(
    (item): item is WallpaperItem => item.kind === "wallpaper" && ownedIds.includes(item.id),
  );
  const ownedFloor = SHOP_CATALOG.filter(
    (item): item is FloorItem => item.kind === "floor" && ownedIds.includes(item.id),
  );

  async function togglePlacement(itemId: string, placed: boolean) {
    setError(null);
    try {
      if (placed) {
        await removeItem({ itemId });
      } else {
        await placeItem({ itemId });
      }
    } catch {
      setError("Couldn't update the room right now.");
    }
  }

  async function chooseWallpaper(itemId: string | null) {
    setError(null);
    try {
      await setWallpaper({ itemId });
    } catch {
      setError("Couldn't change the wallpaper right now.");
    }
  }

  async function chooseFloor(itemId: string | null) {
    setError(null);
    try {
      await setFloor({ itemId });
    } catch {
      setError("Couldn't change the flooring right now.");
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Your Room</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Decorate your shared space - buy more in the Shop.</p>
      </div>

      <RoomScene>
        <div className="room-editor-pet-placeholder">Your pet's room will look like this on Home.</div>
      </RoomScene>

      <StylePicker label="Wallpaper" options={ownedWallpaper} activeId={room.wallpaperId} onChoose={chooseWallpaper} />
      <StylePicker label="Flooring" options={ownedFloor} activeId={room.floorId} onChoose={chooseFloor} />
      <PlaceableList label="Your decor" items={ownedDecor} placedItemIds={room.placedItemIds} onToggle={togglePlacement} />
      <PlaceableList label="Your furniture" items={ownedFurniture} placedItemIds={room.placedItemIds} onToggle={togglePlacement} />

      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
