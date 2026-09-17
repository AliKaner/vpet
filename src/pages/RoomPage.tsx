import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { getShopItem, SHOP_CATALOG, type DecorItem, type WallpaperItem } from "../../convex/lib/shopItems";

const DEFAULT_BG = "#fdf6ec";

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

export function RoomPage() {
  const room = useQuery(api.decor.getMyRoom);
  const ownedIds = useQuery(api.decor.getMyDecorInventory);
  const placeItem = useMutation(api.decor.placeItem);
  const removeItem = useMutation(api.decor.removeItem);
  const setWallpaper = useMutation(api.decor.setWallpaper);
  const music = useMusicPlayer();
  const [error, setError] = useState<string | null>(null);

  if (room === undefined || ownedIds === undefined) {
    return <p className="py-10 text-center text-sm text-cocoa-soft">Loading your room...</p>;
  }

  const ownedDecor = SHOP_CATALOG.filter(
    (item): item is DecorItem => item.kind === "decor" && ownedIds.includes(item.id),
  );
  const ownedWallpaper = SHOP_CATALOG.filter(
    (item): item is WallpaperItem => item.kind === "wallpaper" && ownedIds.includes(item.id),
  );
  const activeWallpaper = room.wallpaperId !== undefined ? getShopItem(room.wallpaperId) : undefined;
  const bgColor = activeWallpaper?.kind === "wallpaper" ? activeWallpaper.bgColor : DEFAULT_BG;

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

  return (
    <div className="flex flex-col gap-5 py-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-cocoa">Your Room</h1>
        <p className="mt-1 text-sm text-cocoa-soft">Decorate your shared space - buy more in the Shop.</p>
      </div>

      <div
        className="flex min-h-40 flex-wrap items-center justify-center gap-4 rounded-cozy border border-cream-dark p-6 transition-colors duration-500"
        style={{ backgroundColor: bgColor }}
      >
        {room.placedItemIds.length === 0 ? (
          <p className="text-sm text-cocoa-soft">Nothing placed yet - add some decor below.</p>
        ) : (
          room.placedItemIds.map((itemId) => {
            const item = getShopItem(itemId);
            if (item === undefined) return null;
            const isMusicPlayer = itemId === "decor_music_player";
            return (
              <button
                key={itemId}
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
          })
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-cocoa-soft">Wallpaper</h2>
        {ownedWallpaper.length === 0 ? (
          <p className="text-xs text-cocoa-soft">No wallpaper owned yet - check the Shop.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void chooseWallpaper(null)}
              className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                room.wallpaperId === undefined ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
              }`}
            >
              Default
            </button>
            {ownedWallpaper.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void chooseWallpaper(item.id)}
                className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition ${
                  room.wallpaperId === item.id ? "border-peach bg-peach/10 text-peach-dark" : "border-cream-dark text-cocoa-soft"
                }`}
              >
                <i className="inline-block h-3 w-3 rounded-full" style={{ background: item.bgColor }} aria-hidden />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-cocoa-soft">Your decor</h2>
        {ownedDecor.length === 0 ? (
          <p className="text-xs text-cocoa-soft">No decor owned yet - check the Shop.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ownedDecor.map((item) => {
              const placed = room.placedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void togglePlacement(item.id, placed)}
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
      {error && <p className="text-sm font-semibold text-blossom-dark">{error}</p>}
    </div>
  );
}
