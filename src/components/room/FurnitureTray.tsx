import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { SHOP_CATALOG, type ShopItem } from "../../../convex/lib/shopItems";
import { FurnitureArt } from "./FurnitureArt";

interface FurnitureTrayProps {
  area: "room" | "garden";
  onAreaChange: (area: "room" | "garden") => void;
  onSelect?: (itemId: string) => void;
  onOpenMore: () => void;
  onClose: () => void;
}

// A non-modal bottom tray for placing/removing owned furniture & decor while the
// room stays fully visible above it (unlike DecorationDialog, which covers the
// screen) - scroll sideways through owned items, tap to place or put away.
// Wallpaper/floor/theme choices are comparatively rare, so those stay behind the
// "More" button, which opens the fuller RoomControls dialog.
export function FurnitureTray({ area, onAreaChange, onSelect, onOpenMore, onClose }: FurnitureTrayProps) {
  const room = useQuery(api.decor.getMyRoom);
  const owned = useQuery(api.decor.getMyDecorInventory);
  const place = useMutation(api.decor.placeItem);
  const remove = useMutation(api.decor.removeItem);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!room || !owned) {
    return null;
  }

  const ownedSet = new Set(owned);
  const placed = new Set(room.placedItemIds);
  const items = SHOP_CATALOG.filter(
    (item): item is Extract<ShopItem, { kind: "furniture" | "decor" }> =>
      (item.kind === "furniture" || item.kind === "decor") &&
      ownedSet.has(item.id) &&
      !(area === "garden" && item.kind === "furniture" && item.wallMounted),
  );

  async function toggle(item: ShopItem) {
    setBusy(item.id);
    setError(null);
    try {
      if (placed.has(item.id)) {
        await remove({ itemId: item.id });
      } else {
        await place({ itemId: item.id, area });
        onSelect?.(item.id);
      }
    } catch (err) {
      setError(err instanceof ConvexError ? String(err.data) : "Couldn't update the room.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="furniture-tray">
      <div className="furniture-tray-header">
        <div className="room-theme-filter" role="group" aria-label="Placement area">
          <button type="button" aria-pressed={area === "room"} onClick={() => onAreaChange("room")}>
            Inside
          </button>
          <button type="button" aria-pressed={area === "garden"} onClick={() => onAreaChange("garden")}>
            Garden
          </button>
        </div>
        <div className="furniture-tray-header-actions">
          <button type="button" onClick={onOpenMore} className="furniture-tray-more">
            Wallpaper &amp; floor
          </button>
          <button type="button" onClick={onClose} aria-label="Close furniture tray">
            {"✕"}
          </button>
        </div>
      </div>
      <div className="furniture-tray-scroll">
        {items.length === 0 && <p className="furniture-tray-empty">Nothing owned yet - check the Shop.</p>}
        {items.map((item) => {
          const selected = placed.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={busy === item.id}
              aria-pressed={selected}
              aria-label={selected ? `Remove ${item.label} from the room` : `Place ${item.label} in the room`}
              onClick={() => void toggle(item)}
              className={`furniture-tray-item ${selected ? "is-placed" : ""}`}
            >
              {selected && (
                <span className="furniture-tray-remove" aria-hidden>
                  {"✕"}
                </span>
              )}
              <span className="furniture-tray-icon">
                <FurnitureArt id={item.id} />
              </span>
              <span className="furniture-tray-label">{item.label}</span>
              <span className="furniture-tray-status">{selected ? "Tap to remove" : "Tap to place"}</span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="furniture-tray-error">{error}</p>}
    </div>
  );
}
