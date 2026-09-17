import {
  CARE_EMA_ALPHA,
  COMFORT_THRESHOLD,
  HAPPINESS_DECAY_PER_HOUR,
  HEALTH_LOSS_COEFFICIENT,
  HEALTH_REGEN_PER_HOUR,
  HOUR_MS,
  HUNGER_DECAY_PER_HOUR,
  CLEANLINESS_DECAY_PER_HOUR,
  LIFESPAN_ADJUST_RATE,
  MAX_LIFESPAN_MS,
  MIN_LIFESPAN_MS,
  NEGLECT_THRESHOLD,
} from "./constants";
import { SPECIES_CONFIG, type SpeciesId } from "./species";

export interface PetVitals {
  hunger: number;
  cleanliness: number;
  happiness: number;
  health: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function distress(hunger: number, cleanliness: number, happiness: number): number {
  return (
    Math.max(0, NEGLECT_THRESHOLD - hunger) +
    Math.max(0, NEGLECT_THRESHOLD - cleanliness) +
    Math.max(0, NEGLECT_THRESHOLD - happiness)
  );
}

export interface SettleResult extends PetVitals {
  hoursElapsed: number;
}

export type DecayMultipliers = Partial<Record<"hunger" | "cleanliness" | "happiness", number>>;

/**
 * Pure, deterministic projection of a pet's vitals forward from `lastStatsUpdate`
 * to `now`. This is the single source of truth for decay math - the server persists
 * its result on every mutation and cron sweep, and the frontend imports this same
 * function to animate stat bars between syncs (display only, never trusted as state).
 *
 * `decayMultipliers` lets an equipped toy slow one stat's decay; every call site
 * (server and client alike) derives it the same way via shopItems.getEquippedEffects,
 * so client and server can never disagree about the resulting numbers.
 */
export function settleStats(
  vitals: PetVitals,
  lastStatsUpdate: number,
  now: number,
  speciesId: SpeciesId,
  decayMultipliers: DecayMultipliers = {},
): SettleResult {
  const hoursElapsed = Math.max(0, now - lastStatsUpdate) / HOUR_MS;
  const species = SPECIES_CONFIG[speciesId];

  const hunger = clamp(
    vitals.hunger -
      HUNGER_DECAY_PER_HOUR * species.hungerDecayMult * (decayMultipliers.hunger ?? 1) * hoursElapsed,
    0,
    100,
  );
  const cleanliness = clamp(
    vitals.cleanliness -
      CLEANLINESS_DECAY_PER_HOUR *
        species.cleanlinessDecayMult *
        (decayMultipliers.cleanliness ?? 1) *
        hoursElapsed,
    0,
    100,
  );
  const happiness = clamp(
    vitals.happiness -
      HAPPINESS_DECAY_PER_HOUR * species.happinessDecayMult * (decayMultipliers.happiness ?? 1) * hoursElapsed,
    0,
    100,
  );

  const distressPre = distress(vitals.hunger, vitals.cleanliness, vitals.happiness);
  const distressPost = distress(hunger, cleanliness, happiness);
  const avgDistress = (distressPre + distressPost) / 2;

  const comfortablePre = distressPre === 0 && Math.min(vitals.hunger, vitals.cleanliness, vitals.happiness) >= COMFORT_THRESHOLD;
  const comfortablePost = distressPost === 0 && Math.min(hunger, cleanliness, happiness) >= COMFORT_THRESHOLD;

  let health = vitals.health;
  if (avgDistress > 0) {
    health = clamp(health - avgDistress * HEALTH_LOSS_COEFFICIENT * hoursElapsed, 0, 100);
  } else if (comfortablePre && comfortablePost) {
    health = clamp(health + HEALTH_REGEN_PER_HOUR * hoursElapsed, 0, 100);
  }

  return { hunger, cleanliness, happiness, health, hoursElapsed };
}

export function isNeglectDeath(health: number): boolean {
  return health <= 0;
}

export function isOldAgeDeath(ageMs: number, lifespanTargetMs: number): boolean {
  return ageMs >= lifespanTargetMs;
}

export interface CareState {
  careScoreEma: number;
  lifespanTargetMs: number;
}

/**
 * Advances the slow-moving care score and the lifespan target it drives.
 * Called only from the server-side cron sweep (not from queries or per-action
 * mutations), using the settled vitals at the moment of evaluation.
 */
export function advanceCareAndLifespan(state: CareState, settled: PetVitals): CareState {
  const instantCare = (settled.hunger + settled.cleanliness + settled.happiness) / 300;
  const careScoreEma = state.careScoreEma * (1 - CARE_EMA_ALPHA) + instantCare * CARE_EMA_ALPHA;
  const targetForCurrentCare = lerp(MIN_LIFESPAN_MS, MAX_LIFESPAN_MS, careScoreEma);
  const lifespanTargetMs =
    state.lifespanTargetMs + (targetForCurrentCare - state.lifespanTargetMs) * LIFESPAN_ADJUST_RATE;
  return { careScoreEma, lifespanTargetMs };
}

export type MoodBucket = "great" | "content" | "distressed" | "critical";

export function computeMoodBucket(vitals: PetVitals): MoodBucket {
  if (vitals.health < 25) return "critical";
  const avgCare = (vitals.hunger + vitals.cleanliness + vitals.happiness) / 3;
  if (avgCare < NEGLECT_THRESHOLD || vitals.health < 50) return "distressed";
  if (avgCare >= COMFORT_THRESHOLD) return "great";
  return "content";
}

export type LifeStage = "baby" | "young" | "adult" | "senior";

export function computeLifeStage(ageMs: number, lifespanTargetMs: number): LifeStage {
  const ratio = lifespanTargetMs > 0 ? ageMs / lifespanTargetMs : 1;
  if (ratio < 0.1) return "baby";
  if (ratio < 0.4) return "young";
  if (ratio < 0.75) return "adult";
  return "senior";
}
