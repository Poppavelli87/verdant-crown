import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER2_FLAGS = Object.freeze({
  STARTED: "chapter2_started",
  ARRIVED_EMBERFALL: "chapter2_arrived_emberfall",
  WILLOW_MET: "willow_met",
  EMBERFALL_UNLOCKED: "emberfall_unlocked",
});

export const CHAPTER2_ARRIVAL_TITLE = "EMBERFALL";

export const CHAPTER2_ARRIVAL_LINES = Object.freeze([
  "Elaine: Ash on the wind. This land was not merely burned... it was cauterized.",
  "Arthur: Feels like the ground remembers.",
  "Elaine: Keep your eyes up. Vaeloris favors places like this.",
  "Arthur: We're looking for... Willow?",
  "Elaine: A watcher. A rumor. A lead. Find her before the trail cools.",
]);

export function tryStartChapter2(context = {}) {
  const {
    milestoneMet = false,
    rowanCouncilDone = false,
    chapter2Started = false,
    emberfallUnlocked = false,
    force = false,
  } = context;

  if (!force) {
    if (!milestoneMet) return { triggered: false };
    if (!rowanCouncilDone) return { triggered: false };
    if (Boolean(chapter2Started) && Boolean(emberfallUnlocked)) return { triggered: false };
  }

  return {
    triggered: true,
    setFlags: Object.freeze({
      [CHAPTER2_FLAGS.STARTED]: true,
      [CHAPTER2_FLAGS.EMBERFALL_UNLOCKED]: true,
    }),
    objectiveId: OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL,
  };
}
