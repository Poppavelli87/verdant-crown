import { OBJECTIVE_IDS } from "./objectives.js";
import { CHAPTER6_FLAGS } from "./chapter6ArrivalWindward.js";

function normalizeChoice(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "shatter" || normalized === "salvage") return normalized;
  return "";
}

function normalizeTier(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "still") return "still";
  if (normalized === "uneasy") return "uneasy";
  if (normalized === "restless") return "restless";
  if (normalized === "fractured") return "fractured";
  return "balanced";
}

function tierDescriptor(tier) {
  if (tier === "still") return "The stones breathe in long, patient intervals.";
  if (tier === "uneasy") return "The Circle answers in careful, unsettled pulses.";
  if (tier === "restless") return "The wind catches on every carved edge, impatient and sharp.";
  if (tier === "fractured") return "The Waystone chatters in broken echoes, like split glass under pressure.";
  return "The tone holds steady, but only barely.";
}

function choiceDescriptor(choice) {
  if (choice === "salvage") {
    return "Willow: It can smell the salvaged core. Curious, hungry, nosy.";
  }
  if (choice === "shatter") {
    return "Elaine: The absence of that core left cleaner harmonics. Quieter, but not harmless.";
  }
  return "Arthur: Whatever this is, it knows we changed something in Emberfall.";
}

function buildWaystoneLines({ harvesterChoice = "", crownTier = "balanced" } = {}) {
  const lines = [
    "Arthur: It's warm. Like a heartbeat under stone.",
    "Elaine: Maintain composure. Waystones answer cadence as much as touch.",
    tierDescriptor(normalizeTier(crownTier)),
    choiceDescriptor(normalizeChoice(harvesterChoice)),
    "Willow: Translation for normal people: the Crown noticed us noticing it.",
    "Arthur: I know this pattern. Not from memory... from somewhere older.",
    "Elaine: The old houses taught a phrase for this: 'Witness, and be witnessed.'",
    "Willow: Cute phrase. Terrifying implication.",
  ];
  if (normalizeChoice(harvesterChoice) === "salvage") {
    lines.push("Elaine: If Vaeloris traces that resonance, Thornmere becomes a waypoint.");
  } else {
    lines.push("Arthur: If this is the quiet version, I don't want the loud one.");
  }
  lines.push(
    "Willow: Then we do the sensible thing and sprint this to Rowan.",
    "Arthur: Agreed. Back to Thornmere."
  );
  return lines;
}

export function tryTriggerWaystoneLore(context = {}) {
  const {
    currentSceneId = "",
    chapter6ArrivedWindward = false,
    relayDropped = false,
    waystoneAttuned = false,
    nearWaystone = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    harvesterChoice = "",
    crownTier = "balanced",
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  if (!force) {
    if (sceneId !== "windward" && sceneId !== "region3_seed") return { triggered: false };
    if (!chapter6ArrivedWindward) return { triggered: false };
    if (!relayDropped) return { triggered: false };
    if (waystoneAttuned) return { triggered: false };
    if (!nearWaystone) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (sceneId !== "windward" && sceneId !== "region3_seed") {
    return { triggered: false };
  }

  return {
    triggered: true,
    lockSeconds: 1,
    lines: buildWaystoneLines({
      harvesterChoice,
      crownTier,
    }),
    objectiveId: OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS,
    setFlags: Object.freeze({
      [CHAPTER6_FLAGS.WAYSTONE_ATTUNED]: true,
    }),
    toast: "The Waystone answers, then falls quiet.",
  };
}
