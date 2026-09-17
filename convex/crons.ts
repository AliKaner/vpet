import { cronJobs } from "convex/server";
import { EVAL_INTERVAL_MINUTES } from "./lib/constants";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "evaluate pet aging and death",
  { minutes: EVAL_INTERVAL_MINUTES },
  internal.internal.petEvaluation.evaluateAllPets,
);

export default crons;
