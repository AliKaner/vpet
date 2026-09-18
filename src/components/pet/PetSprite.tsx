import { useEffect, useRef, useState } from "react";
import type { SpeciesId } from "../../../convex/lib/species";
import { appearanceDetails, resolveAppearance } from "../../../convex/lib/petAppearances";
import { sampleAnimation, type AnimationPose } from "../../lib/petAnimation";
import type { PetEmotion } from "../../lib/petEmotion";
export type PetPose = AnimationPose;
const EMOTION_PAIR: Record<PetEmotion, number> = { hungry: 0, dirty: 2, lonely: 4, scared: 6, happy: 8, content: 10 };
const SPECIES_ROW: Record<SpeciesId, number> = { cat: 0, dog: 2, bird: 4, snake: 0, mouse: 2, horse: 4 };
export function PetSprite({ species, appearance, pose = "idle", emotion = "content", small = false, onComplete }: {
  species: SpeciesId; appearance?: string; pose?: PetPose; emotion?: PetEmotion; small?: boolean; onComplete?: () => void;
}) {
  const [frameState, setFrameState] = useState({ key: "", cell: 0 });
  const completeRef = useRef(onComplete);
  useEffect(() => { completeRef.current = onComplete; }, [onComplete]);
  const look = resolveAppearance(species, appearance);
  const details = appearanceDetails(species, appearance);
  const emotionalIdle = pose === "idle" && emotion !== "content";
  const generated = (species === "cat" && look === "silver") || (species === "dog" && look === "chocolate") || (species === "bird" && look === "sunny");
  const group = generated ? "variants" : (["cat", "dog", "bird"].includes(species) ? "companions" : "small-friends");
  const source = emotionalIdle ? `/assets/pets/animations/moods-${group}.png` : `/assets/pets/animations/${species}-${generated ? look : "classic"}.png`;
  const columns = emotionalIdle ? 6 : 4;
  const base = emotionalIdle ? SPECIES_ROW[species] * 6 + EMOTION_PAIR[emotion] : 0;
  const frameKey = `${source}:${pose}:${base}`;
  const cell = frameState.key === frameKey ? frameState.cell : base;
  useEffect(() => {
    let stopped = false;
    let handle = 0;
    let completion: ReturnType<typeof setTimeout> | undefined;
    let started: number | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const img = new Image();
    function tick(now: number) {
      if (stopped) return;
      started ??= now;
      const elapsed = now - started;
      const frame = sampleAnimation(pose, elapsed);
      const next = emotionalIdle ? base + (elapsed % 2100 > 1650 ? 1 : 0) : frame.cell;
      const visible = motion.matches ? (pose === "idle" ? base : (frame.done ? 0 : { feed: 6, pet: 10, clean: 14 }[pose])) : next;
      setFrameState((previous) => previous.key === frameKey && previous.cell === visible ? previous : { key: frameKey, cell: visible });
      if (frame.done) {
        completion = setTimeout(() => { if (!stopped) completeRef.current?.(); }, 180);
        return;
      }
      handle = requestAnimationFrame(tick);
    }
    img.onload = () => { if (!stopped) handle = requestAnimationFrame(tick); };
    img.onerror = () => { if (!stopped) completeRef.current?.(); };
    img.src = source;
    return () => { stopped = true; cancelAnimationFrame(handle); clearTimeout(completion); };
  }, [source, pose, emotionalIdle, base, frameKey]);
  return <span aria-hidden="true" className={`pet-sprite ${small ? "pet-sprite-small" : ""}`}
    data-pose={pose} data-cell={cell} data-emotion={emotion}
    style={{ backgroundImage: `url('${source}')`, filter: details.filter, backgroundSize: `${columns * 100}% ${columns * 100}%`,
      backgroundPosition: `${cell % columns * 100 / (columns - 1)}% ${Math.floor(cell / columns) * 100 / (columns - 1)}%` }} />;
}

