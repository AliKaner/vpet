import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  getShopItem,
  SHOP_CATALOG,
  type DecorItem,
  type FloorItem,
  type FurnitureItem,
  type WallpaperItem,
} from "../../convex/lib/shopItems";

const DEFAULT_WALL_BG = "#fdf6ec";
const DEFAULT_FLOOR_BG = "#f0e4d0";

function useMusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      void contextRef.current?.close();
    };
  }, []);

  function playNote(frequency: number, startOffset: number) {
    const ctx = contextRef.current;
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + startOffset;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.05, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.32);
  }

  function toggle() {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }
    contextRef.current ??= new AudioContext();
    void contextRef.current.resume();
    const melody = [523, 659, 784, 659];
    const loop = () => melody.forEach((note, i) => playNote(note, i * 0.28));
    loop();
    intervalRef.current = setInterval(loop, melody.length * 280 + 400);
    setPlaying(true);
  }

  return { playing, toggle };
}

function ItemIcon({ itemId, music }: { itemId: string; music: ReturnType<typeof useMusicPlayer> }) {
  const item = getShopItem(itemId);
  if (item === undefined) return null;
  const isMusicPlayer = itemId === "decor_music_player";
  return (
    <button
      type="button"
      onClick={isMusicPlayer ? music.toggle : undefined}
      className={`flex flex-col items-center gap-1 ${isMusicPlayer ? "cursor-pointer" : "cursor-default"}`}
      title={item.label}
    >
      <span className={`text-5xl ${isMusicPlayer && music.playing ? "animate-idle" : ""}`} aria-hidden>
        {item.icon}
      </span>
      <span className="text-[10px] font-bold text-cocoa-soft">
        {isMusicPlayer ? (music.playing ? "Playing..." : "Tap to play") : item.label}
      </span>
    </button>
  );
}

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
  const music = useMusicPlayer();
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

  const activeWallpaper = room.wallpaperId !== undefined ? getShopItem(room.wallpaperId) : undefined;
  const wallColor = activeWallpaper?.kind === "wallpaper" ? activeWallpaper.bgColor : DEFAULT_WALL_BG;
  const activeFloor = room.floorId !== undefined ? getShopItem(room.floorId) : undefined;
  const floorColor = activeFloor?.kind === "floor" ? activeFloor.bgColor : DEFAULT_FLOOR_BG;

  const furnitureIds = new Set(ownedFurniture.map((item) => item.id));
  const placedDecor = room.placedItemIds.filter((id) => !furnitureIds.has(id));
  const placedFurniture = room.placedItemIds.filter((id) => furnitureIds.has(id));

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

      <div className="overflow-hidden rounded-cozy border border-cream-dark">
        <div
          className="flex min-h-28 flex-wrap items-center justify-center gap-4 p-6 transition-colors duration-500"
          style={{ backgroundColor: wallColor }}
        >
          {placedDecor.length === 0 ? (
            <p className="text-sm text-cocoa-soft">Nothing on the walls yet.</p>
          ) : (
            placedDecor.map((itemId) => <ItemIcon key={itemId} itemId={itemId} music={music} />)
          )}
        </div>
        <div
          className="flex min-h-20 flex-wrap items-center justify-center gap-4 border-t border-black/5 p-4 transition-colors duration-500"
          style={{ backgroundColor: floorColor }}
        >
          {placedFurniture.length === 0 ? (
            <p className="text-sm text-cocoa-soft">No furniture yet.</p>
          ) : (
            placedFurniture.map((itemId) => <ItemIcon key={itemId} itemId={itemId} music={music} />)
          )}
        </div>
      </div>

      <StylePicker label="Wallpaper" options={ownedWallpaper} activeId={room.wallpaperId} onChoose={chooseWallpaper} />
      <StylePicker label="Flooring" options={ownedFloor} activeId={room.floorId} onChoose={chooseFloor} />
      <PlaceableList label="Your decor" items={ownedDecor} placedItemIds={room.placedItemIds} onToggle={togglePlacement} />
      <PlaceableList label="Your furniture" items={ownedFurniture} placedItemIds={room.placedItemIds} onToggle={togglePlacement} />

      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
