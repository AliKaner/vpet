export type PetEmotion = "content" | "hungry" | "dirty" | "lonely" | "scared" | "happy";
export function petEmotion(vitals: { hunger: number; cleanliness: number; happiness: number; health: number }): PetEmotion {
  if (vitals.health < 25) return "scared";
  const needs = [
    { value: vitals.hunger, emotion: "hungry" as const },
    { value: vitals.cleanliness, emotion: "dirty" as const },
    { value: vitals.happiness, emotion: "lonely" as const },
  ].sort((a, b) => a.value - b.value);
  if (needs[0].value < 40) return needs[0].emotion;
  if (vitals.happiness >= 80 && vitals.hunger >= 60 && vitals.cleanliness >= 60 && vitals.health >= 60) return "happy";
  return "content";
}
export const EMOTION_LABEL: Record<PetEmotion, string> = {
  content: "Feeling calm and cozy", hungry: "A little hungry… time for a snack?",
  dirty: "A little stinky… could use a clean!", lonely: "Feeling lonely… stay a while?",
  scared: "Feeling frightened and unwell — needs care", happy: "Happy to be here with you!",
};
