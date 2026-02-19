import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER8_FLAGS = Object.freeze({
  AFTERMATH_DONE: "chapter8_aftermath_done",
  RETALIATION_STARTED: "chapter8_retaliation_started",
  MUTE_SPIKES_CLEARED: "chapter8_mute_spikes_cleared",
  REGION4_SEED_UNLOCKED: "region4_seed_unlocked",
  REGION4_SEED_GATE_UNLOCKED: "region4_seed_gate_unlocked",
});

export const CONVERGENCE_CHOICES = Object.freeze({
  SHATTER: "shatter",
  TUNE: "tune",
});

function normalizeChoice(value, allowed = []) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return allowed.includes(normalized) ? normalized : "";
}

function normalizeMoodTier(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["still", "uneasy", "balanced", "restless", "fractured"].includes(normalized)) {
    return normalized;
  }
  return "balanced";
}

function buildChoiceReaction(convergenceChoice, harvesterChoice) {
  const lines = [];
  if (convergenceChoice === CONVERGENCE_CHOICES.SHATTER) {
    lines.push("Rowan: You shattered the Choir. Necessary... and loud enough to draw knives.");
    lines.push("Elaine: Vaeloris will call it vandalism. They punish embarrassment by example.");
  } else {
    lines.push("Rowan: You tuned the Choir. Merciful, perhaps. Risky, certainly.");
    lines.push("Willow: We taught it a new song, and now everyone wants sheet music.");
  }

  if (harvesterChoice === "salvage") {
    lines.push("Rowan: Salvaging that core brought their curiosity home with you.");
    lines.push("Arthur: Then we make sure curiosity breaks before the village does.");
  } else {
    lines.push("Rowan: Shattering the Harvester bought trust, but not peace.");
    lines.push("Elaine: Vaeloris responds to losses with arithmetic and retaliation.");
  }

  return lines;
}

function buildMoodLine(crownTier) {
  if (crownTier === "still") {
    return "Rowan: Even calm roots can be cut. Do not mistake quiet for safety.";
  }
  if (crownTier === "fractured") {
    return "Rowan: The Crown is fractured and the village feels it. Every delay costs us.";
  }
  if (crownTier === "restless") {
    return "Rowan: Restless currents tonight. Vaeloris will ride them hard.";
  }
  if (crownTier === "uneasy") {
    return "Rowan: Uneasy roots, uneasy men. We move before both harden.";
  }
  return "Rowan: The Crown holds a narrow balance. Let us not squander it.";
}

function buildLines({ convergenceChoice, harvesterChoice, crownTier }) {
  const lines = [
    "Rowan: You're back. Good. Thornmere has been holding its breath.",
    "Arthur: The Convergence is done. Not clean, but done.",
    "Elaine: Vaeloris heard us. They always hear disruption.",
    "Willow: Not with ears. With math. Worse manners, too.",
    ...buildChoiceReaction(convergenceChoice, harvesterChoice),
    buildMoodLine(crownTier),
    "Arthur: This place raised me. I won't let it pay for my hands.",
    "Elaine: I know what Vaeloris does when a village refuses to kneel.",
    "Willow: Scouts are planting Mute Spikes by the ridge verge. Tiny rude towers.",
    "Rowan: Then there is no council, only work.",
    "Rowan: Go now. Break every Mute Spike before the roots fall silent.",
  ];
  return lines;
}

export function tryTriggerChapter8Aftermath(context = {}) {
  const {
    currentSceneId = "",
    nearRowan = false,
    chapter7ChoirEngineDefeated = false,
    chapter7ConvergenceChoice = "",
    harvesterChoice = "",
    crownTier = "balanced",
    chapter8AftermathDone = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    force = false,
    vaelorisPressureStage = 1,
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  const convergenceChoice = normalizeChoice(chapter7ConvergenceChoice, [
    CONVERGENCE_CHOICES.SHATTER,
    CONVERGENCE_CHOICES.TUNE,
  ]);
  const normalizedHarvester = normalizeChoice(harvesterChoice, ["shatter", "salvage"]);
  const moodTier = normalizeMoodTier(crownTier);
  const pressureStage = Math.max(1, Math.floor(Number(vaelorisPressureStage) || 1));

  if (!force) {
    if (sceneId !== "thornmere") return { triggered: false };
    if (!nearRowan) return { triggered: false };
    if (!chapter7ChoirEngineDefeated) return { triggered: false };
    if (!convergenceChoice) return { triggered: false };
    if (Boolean(chapter8AftermathDone)) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (sceneId !== "thornmere" || !convergenceChoice) {
    return { triggered: false };
  }

  const nextPressure = normalizedHarvester === "salvage" || convergenceChoice === CONVERGENCE_CHOICES.TUNE
    ? Math.max(2, pressureStage)
    : Math.max(1, Math.min(pressureStage, 2));

  return {
    triggered: true,
    lockSeconds: 1,
    lines: buildLines({
      convergenceChoice,
      harvesterChoice: normalizedHarvester,
      crownTier: moodTier,
    }),
    objectiveId: OBJECTIVE_IDS.STOP_MUTE_SPIKES,
    pressureStage: nextPressure,
    warningToast: "Scouts move on Thornmere. Hurry.",
    setFlags: Object.freeze({
      [CHAPTER8_FLAGS.AFTERMATH_DONE]: true,
      [CHAPTER8_FLAGS.RETALIATION_STARTED]: true,
      [CHAPTER8_FLAGS.MUTE_SPIKES_CLEARED]: false,
      [CHAPTER8_FLAGS.REGION4_SEED_UNLOCKED]: true,
      [CHAPTER8_FLAGS.REGION4_SEED_GATE_UNLOCKED]: false,
    }),
  };
}
