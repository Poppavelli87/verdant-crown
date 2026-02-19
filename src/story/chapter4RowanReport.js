import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER4_FLAGS = Object.freeze({
  ROWAN_REPORT_DONE: "chapter4_rowan_report_done",
  HARVESTER_SITE_UNLOCKED: "harvester_site_unlocked",
  HARVESTER_WARDEN_DEFEATED: "harvester_warden_defeated",
});

function normalizeListeningChoice(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "crush" || normalized === "pocket") return normalized;
  return "";
}

const BASE_LINES = Object.freeze([
  "Rowan: You came back with ash on your boots and questions in your eyes.",
  "Arthur: The Spike was not mining. It was listening.",
  "Rowan: Aye. Vaeloris has moved from hunger to attention.",
  "Elaine: At their tables, listening was always the first weapon.",
  "Arthur: So the ground... remembers us?",
  "Rowan: It remembers cadence, intent, and who keeps pressing.",
  "Willow: Think of it like gossip, but with roots and worse manners.",
  "Elaine: Willow.",
  "Willow: I am being restrained. This is my formal voice.",
  "Rowan: Listening is how they learn where to cut without bleeding themselves.",
  "Willow: And where to make everyone else bleed very precisely.",
]);

const CRUSH_REACTION_LINES = Object.freeze([
  "Arthur: We crushed the core. The hum dropped off hard.",
  "Elaine: A proper choice. Cleaner, if less useful.",
  "Rowan: Clean is a luxury. Today it was the right one.",
]);

const POCKET_REACTION_LINES = Object.freeze([
  "Arthur: We kept the core. I wanted to see what it was learning.",
  "Elaine: Strategically useful. Morally untidy.",
  "Rowan: Untidy paths still lead somewhere. Walk them carefully.",
]);

const CLOSING_LINES = Object.freeze([
  "Rowan: There is a bigger rig in Emberfall. A Harvester Site, anchored deep.",
  "Elaine: If the anchors stand, the surge will not stop.",
  "Rowan: Return to Emberfall. Find the rig. Break its anchors. Bring me what you learn.",
]);

export function tryTriggerChapter4RowanReport(context = {}) {
  const {
    currentSceneId = "",
    nearRowan = false,
    listeningSpikeSiteCleared = false,
    listeningSpikeChoice = "",
    chapter4RowanReportDone = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    force = false,
  } = context;

  const normalizedSceneId = String(currentSceneId ?? "").trim().toLowerCase();
  const normalizedChoice = normalizeListeningChoice(listeningSpikeChoice);

  if (!force) {
    if (normalizedSceneId !== "thornmere") return { triggered: false };
    if (!nearRowan) return { triggered: false };
    if (!listeningSpikeSiteCleared) return { triggered: false };
    if (!normalizedChoice) return { triggered: false };
    if (Boolean(chapter4RowanReportDone)) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (normalizedSceneId !== "thornmere" || !normalizedChoice) {
    return { triggered: false };
  }

  const choiceLines = normalizedChoice === "crush" ? CRUSH_REACTION_LINES : POCKET_REACTION_LINES;
  return {
    triggered: true,
    lockSeconds: 1,
    lines: [...BASE_LINES, ...choiceLines, ...CLOSING_LINES],
    objectiveId: OBJECTIVE_IDS.REACH_HARVESTER_SITE,
    unlockToast: "A Harvester Site wakes deeper in Emberfall.",
    setFlags: Object.freeze({
      [CHAPTER4_FLAGS.ROWAN_REPORT_DONE]: true,
      [CHAPTER4_FLAGS.HARVESTER_SITE_UNLOCKED]: true,
    }),
  };
}
