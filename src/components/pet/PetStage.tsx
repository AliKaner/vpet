
import type { MoodBucket } from "../../../convex/lib/petMath";
import type { AppearanceId } from "../../../convex/lib/petAppearances";
import type { SpeciesId } from "../../../convex/lib/species";
import { EMOTION_LABEL, type PetEmotion } from "../../lib/petEmotion";
import { actionPose, type PetAction } from "../../lib/petPose";
import { PetSprite } from "./PetSprite";
import { petAgeStage, PET_AGE_LABEL, type PetAgeStage } from "../../lib/petAge";

const MOOD_LABEL = { great: "Feeling great!", content: "Doing okay", distressed: "Needs attention", critical: "In trouble!" };
const REACTION: Record<SpeciesId, Record<PetAction, string>> = {
  cat: { feed: "Nom nom… whiskers approved!", pet: "Purrr… don't stop!", clean: "Wet paws, sparkling fur!" },
  dog: { feed: "Chomp! Best meal ever!", pet: "Tail-wagging happiness!", clean: "Splish, splash… shake!" },
  bird: { feed: "Peck, peck… delicious!", pet: "Chirp! Happy little feathers!", clean: "A splash and a flutter!" },
  snake: { feed: "A tasty little mouthful!", pet: "A very happy little coil!", clean: "Squeaky-clean scales!" },
  mouse: { feed: "Nibble, nibble… yum!", pet: "Tiny paws, big happiness!", clean: "Clean from ears to tail!" },
  horse: { feed: "Munch, munch… more hay?", pet: "A nuzzle just for you!", clean: "A shiny coat and a happy hoof!" },
};
const ACTION_LABEL: Record<string, string> = {
  walk: "Happy paws, let's go for a walk!", chirp_back: "Chirp chirp! Singing together!",
  handle: "A gentle hold, a happy little coil!", play: "Wheee! Tiny paws at play!",
  exercise: "Clip-clop! Stretching those legs!", groom: "A brushed mane and a glossy coat!",
  clean_litter: "Fresh litter, happy whiskers!", clean_cage: "A fresh little home!", clean_tank: "A sparkling habitat!",
};



interface PetStageProps {
  species: SpeciesId;
  appearance?: AppearanceId;
  mood: MoodBucket;
  emotion?: PetEmotion;
  reaction: { action: string; id: number } | null;
  onReactionComplete?: () => void;
  ageMs?: number;
  lifespanTargetMs?: number;
}

export function PetStage({ species, appearance, mood, emotion = "content", reaction, onReactionComplete, ageMs = 0, lifespanTargetMs = 1 }: PetStageProps) {
  const pose = reaction ? actionPose(reaction.action) : "idle";
  const age: PetAgeStage = petAgeStage(ageMs, lifespanTargetMs);



  return (
    <div className={`pet-stage pet-mood-${mood} pet-cursor-${pose} pet-age-${age}`} data-age={age}>
      <span className="pet-stage-caption">YOUR LITTLE COMPANION</span>
      <div className="pet-ground" />
      <div key={`${species}-${appearance}-${reaction?.id ?? "idle"}`} className="pet-actor">
        <PetSprite species={species} appearance={appearance} pose={pose} emotion={emotion} onComplete={onReactionComplete} />
      </div>
      <p role="status" aria-live="polite" className="pet-reaction-label">
        {reaction ? (ACTION_LABEL[reaction.action] ?? REACTION[species][actionPose(reaction.action)]) : EMOTION_LABEL[emotion] ?? MOOD_LABEL[mood]}
      </p>
      <span className="pet-age-label">{PET_AGE_LABEL[age]}</span>
    </div>
  );
}

