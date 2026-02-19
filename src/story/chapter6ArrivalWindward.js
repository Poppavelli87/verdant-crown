import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER6_FLAGS = Object.freeze({
  ARRIVED_WINDWARD: "chapter6_arrived_windward",
  RELAY_DROPPED: "chapter6_relay_dropped",
  WAYSTONE_ATTUNED: "chapter6_waystone_attuned",
});

export const CHAPTER6_ARRIVAL_TITLE = "WINDWARD RIDGE";

function normalizeHarvesterChoice(choice) {
  const normalized = String(choice ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "shatter" || normalized === "salvage") return normalized;
  return "";
}

function buildArrivalLines(harvesterChoice) {
  const lines = [
    "Arthur: Different air. Like the ridge is listening before we speak.",
    "Elaine: The wind carries residue. Refined, metallic, and deliberate.",
    "Willow: Also it steals hairpins and dignity. Very rude weather.",
  ];
  if (harvesterChoice === "salvage") {
    lines.push("Elaine: The core we kept may be amplifying what the stones hear.");
  } else if (harvesterChoice === "shatter") {
    lines.push("Arthur: Feels quieter than Emberfall. Not calm. Just quieter.");
  }
  lines.push(
    "Willow: Listen for the clean whistle under the static. That's Waystone direction.",
    "Arthur: Then we follow it and keep moving.",
    "Elaine: Find the Waystone Circle first. We can interpret after."
  );
  return lines;
}

export function tryTriggerChapter6Arrival(context = {}) {
  const {
    currentSceneId = "",
    chapter6ArrivedWindward = false,
    chapter5AftershockDone = false,
    patrolSetpieceDone = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    force = false,
    harvesterChoice = "",
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  const normalizedChoice = normalizeHarvesterChoice(harvesterChoice);
  if (!force) {
    if (sceneId !== "windward" && sceneId !== "region3_seed") return { triggered: false };
    if (Boolean(chapter6ArrivedWindward)) return { triggered: false };
    if (!Boolean(chapter5AftershockDone) || !Boolean(patrolSetpieceDone)) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (sceneId !== "windward" && sceneId !== "region3_seed") {
    return { triggered: false };
  }

  return {
    triggered: true,
    lockSeconds: 0.8,
    title: CHAPTER6_ARRIVAL_TITLE,
    lines: buildArrivalLines(normalizedChoice),
    objectiveId: OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE,
    setFlags: Object.freeze({
      [CHAPTER6_FLAGS.ARRIVED_WINDWARD]: true,
    }),
  };
}
