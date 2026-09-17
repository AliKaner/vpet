export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;
export const YEAR_MS = 365 * DAY_MS;

export const STARTING_STAT = 100;
export const STARTING_CARE_EMA = 0.5;

// Passive decay, in stat points per hour, before species multipliers.
export const HUNGER_DECAY_PER_HOUR = 4;
export const CLEANLINESS_DECAY_PER_HOUR = 3;
export const HAPPINESS_DECAY_PER_HOUR = 3.5;

// Health integrates neglect of the other three stats rather than decaying on its own.
export const NEGLECT_THRESHOLD = 30;
export const COMFORT_THRESHOLD = 60;
export const HEALTH_LOSS_COEFFICIENT = 0.007;
export const HEALTH_REGEN_PER_HOUR = 1.5;

// Aging: lifespan target drifts toward a value based on sustained care quality.
export const MIN_LIFESPAN_MS = WEEK_MS;
export const MAX_LIFESPAN_MS = 2 * YEAR_MS;
export const CARE_EMA_ALPHA = 0.05;
export const LIFESPAN_ADJUST_RATE = 0.03;

// Care actions: gains and cooldowns.
export const FEED_HUNGER_GAIN = 35;
export const FEED_HAPPINESS_BONUS = 5;
export const FEED_COOLDOWN_MS = 30 * MINUTE_MS;

export const PET_HAPPINESS_GAIN = 20;
export const PET_COOLDOWN_MS = 10 * MINUTE_MS;

export const CLEAN_CLEANLINESS_GAIN = 40;
export const CLEAN_COOLDOWN_MS = 45 * MINUTE_MS;

// How often the server-side cron sweeps all alive pets for death/aging checks.
export const EVAL_INTERVAL_MINUTES = 10;

export const STARTING_PET_SLOTS = 1;

// Currency: the only two reward paths, matching "earn coins through care and milestones."
export const COIN_PER_CARE_ACTION = 1;
export const COIN_PER_ACHIEVEMENT = 15;

// Visiting other users' pets.
export const VISIT_COOLDOWN_MS = 10 * MINUTE_MS;
export const VISIT_HAPPINESS_GAIN = 10;
export const VISIT_COIN_REWARD = 3;
export const MAX_VISITABLE_PETS = 24;
