import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PetStage } from "../components/pet/PetStage";
import { AppearancePicker } from "../components/pet/AppearancePicker";
import { SPECIES_IDS, type SpeciesId } from "../../convex/lib/species";
import { resolveAppearance, type AppearanceId } from "../../convex/lib/petAppearances";
import { EMOTION_LABEL, type PetEmotion } from "../lib/petEmotion";
import "../index.css";
export function Preview() {
  const [species, setSpecies] = useState<SpeciesId>("cat");
  const [appearance, setAppearance] = useState<AppearanceId>("classic");
  const [emotion, setEmotion] = useState<PetEmotion>("content");
  const [reaction, setReaction] = useState<{ action: string; id: number } | null>(null);
  return <main style={{ width: "min(100% - 32px, 640px)", margin: "32px auto" }}>
    <h1 className="text-2xl font-bold">Pet animation studio</h1>
    <p className="my-3 text-sm">Pick a companion, try a care action, and watch them return to idle.</p>
    <div className="mb-4 flex flex-wrap gap-2">{SPECIES_IDS.map((id) => <button type="button" key={id} aria-pressed={species === id}
      className="rounded-xl bg-white px-3 py-2" onClick={() => { setSpecies(id); setAppearance("classic"); setReaction(null); }}>{id}</button>)}</div>
    <PetStage species={species} appearance={resolveAppearance(species, appearance)} mood="content" emotion={emotion} reaction={reaction} onReactionComplete={() => setReaction(null)} />
    <div className="my-3 flex gap-2">{["feed", "pet", "clean"].map((action) => <button type="button" key={action} disabled={!!reaction}
      className="rounded-xl bg-peach px-4 py-2 disabled:opacity-50" onClick={() => setReaction({ action, id: Date.now() })}>{action}</button>)}</div>
    <p data-testid="playback-status">{reaction ? `Playing ${reaction.action}` : "Idle loop"}</p>
    <AppearancePicker species={species} value={resolveAppearance(species, appearance)} onChange={setAppearance} disabled={!!reaction} />
    <label className="mt-5 flex flex-col gap-2">Feeling
      <select aria-label="Feeling" value={emotion} onChange={(event) => setEmotion(event.target.value as PetEmotion)} className="rounded-xl bg-white p-3">
        {Object.keys(EMOTION_LABEL).map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">{SPECIES_IDS.map((id) => <div key={id}>
      <h2 className="font-bold">{id}</h2><PetStage species={id} mood="content" emotion={emotion} reaction={null} />
    </div>)}</div>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Preview />);


