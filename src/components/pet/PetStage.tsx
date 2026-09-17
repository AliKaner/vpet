import type { MoodBucket } from "../../../convex/lib/petMath";

interface PetStageProps {
  emoji: string;
  mood: MoodBucket;
}

const MOOD_BACKDROP: Record<MoodBucket, string> = {
  great: "bg-mint/30",
  content: "bg-sky/25",
  distressed: "bg-sun/35",
  critical: "bg-blossom/35",
};

const MOOD_LABEL: Record<MoodBucket, string> = {
  great: "Feeling great!",
  content: "Doing okay",
  distressed: "Needs attention",
  critical: "In trouble!",
};

export function PetStage({ emoji, mood }: PetStageProps) {
  const isUneasy = mood === "distressed" || mood === "critical";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-cozy py-8 transition-colors duration-700 ${MOOD_BACKDROP[mood]}`}
    >
      <span
        role="img"
        aria-label="Your pet"
        className={`text-8xl ${isUneasy ? "animate-distress" : "animate-idle"}`}
      >
        {emoji}
      </span>
      <span className="text-xs font-bold text-cocoa-soft">{MOOD_LABEL[mood]}</span>
    </div>
  );
}
