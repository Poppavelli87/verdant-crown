import { OBJECTIVE_IDS } from "./objectives.js";

function normalizeChoice(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeTier(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "still" || normalized === "uneasy" || normalized === "balanced" || normalized === "restless" || normalized === "fractured") {
    return normalized;
  }
  return "balanced";
}

function getChoiceLine(choice) {
  if (choice === "seal") {
    return "You sealed the Vault, so the engine reads you as stabilizers and enemies both.";
  }
  if (choice === "take_key") {
    return "You carry the Crownheart Key, and the engine treats you like a rival author.";
  }
  return "The engine cannot resolve your intent, only your presence.";
}

function getTierLine(tier) {
  if (tier === "still" || tier === "uneasy") {
    return "The Crown's tone is controlled, clinical, and almost patient.";
  }
  if (tier === "fractured") {
    return "The Crown's tone is splintered, ready to cut memory to keep shape.";
  }
  if (tier === "restless") {
    return "The Crown's tone jitters between protection and panic.";
  }
  return "The Crown's tone is balanced but watchful.";
}

export function playEndgameAct3LoreVision(context = {}) {
  const chapter9Choice = normalizeChoice(context.chapter9Choice);
  const crownTier = normalizeTier(context.crownTier);
  return {
    triggered: true,
    lockSeconds: 0.9,
    objectiveId: OBJECTIVE_IDS.REACH_CROWN_ENGINE,
    preface: getChoiceLine(chapter9Choice),
    tierThread: getTierLine(crownTier),
    panels: [
      {
        id: "act3-panel-1",
        title: "THE LAST SPIRE",
        text: "This is not a throne. It is a rewrite engine that edits what was, not only what will be.",
      },
      {
        id: "act3-panel-2",
        title: "SINGLE NARRATOR",
        text: "Vaeloris seeks one voice over reality itself. Memory, law, and grief under a single script.",
      },
      {
        id: "act3-panel-3",
        title: "CROWN PARADOX",
        text: "The Crown preserves coherence, but when afraid it erases contradiction first and people second.",
      },
    ],
    finalLine: "Cross the Rift, reach the Engine, and deny the world a single narrator.",
  };
}

