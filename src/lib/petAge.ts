export type PetAgeStage = "young" | "adult" | "elder";
export function petAgeStage(ageMs: number, lifespanTargetMs: number): PetAgeStage {
  const ratio = lifespanTargetMs <= 0 ? 0 : ageMs / lifespanTargetMs;
  if (ratio < 0.22) return "young";
  if (ratio < 0.78) return "adult";
  return "elder";
}
export const PET_AGE_LABEL: Record<PetAgeStage, string> = {
  young: "Young", adult: "Adult", elder: "Elder",
};
