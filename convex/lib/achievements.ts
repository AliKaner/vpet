import type { Progress } from "../schema";
import { SPECIES_IDS } from "./species";

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_pet", label: "New Beginnings", description: "Welcome your first pet.", icon: "\u{1F43E}" },
  { id: "first_old_age", label: "A Life Well Lived", description: "See a pet through to old age.", icon: "\u{1F319}" },
  { id: "all_species", label: "Zookeeper", description: "Raise every species at least once.", icon: "\u{1F3C6}" },
  { id: "care_50", label: "Caretaker", description: "Perform 50 care actions.", icon: "\u{1F4AA}" },
  { id: "care_200", label: "Devoted", description: "Perform 200 care actions.", icon: "\u{1F31F}" },
  { id: "shop_5", label: "Shopper", description: "Buy 5 shop items.", icon: "\u{1F6CD}️" },
  { id: "visits_10", label: "Good Neighbor", description: "Visit 10 other pets.", icon: "\u{1F44B}" },
];

/** Given the current progress counters, returns every achievement id currently satisfied. */
export function evaluateAchievements(progress: Progress): string[] {
  const satisfied: string[] = [];
  if (progress.petsCreatedCount >= 1) satisfied.push("first_pet");
  if (progress.oldAgeDeathsCount >= 1) satisfied.push("first_old_age");
  if (SPECIES_IDS.every((id) => progress.speciesRaised.includes(id))) satisfied.push("all_species");
  if (progress.careActionsCount >= 50) satisfied.push("care_50");
  if (progress.careActionsCount >= 200) satisfied.push("care_200");
  if (progress.shopPurchasesCount >= 5) satisfied.push("shop_5");
  if (progress.visitsGivenCount >= 10) satisfied.push("visits_10");
  return satisfied;
}
