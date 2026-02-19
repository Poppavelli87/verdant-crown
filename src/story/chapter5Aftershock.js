import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER5_FLAGS = Object.freeze({
  AFTERSHOCK_DONE: "chapter5_aftershock_done",
  RIDGE_GATE_UNLOCKED: "ridge_gate_unlocked",
  PATROL_SETPIECE_DONE: "vaeloris_patrol_setpiece_done",
  REGION3_SEED_UNLOCKED: "region3_seed_unlocked",
});

export const CHAPTER5_HARVESTER_CHOICES = Object.freeze({
  SHATTER: "shatter",
  SALVAGE: "salvage",
});

function normalizeHarvesterChoice(choice) {
  const normalized = String(choice ?? "")
    .trim()
    .toLowerCase();
  if (normalized === CHAPTER5_HARVESTER_CHOICES.SHATTER || normalized === CHAPTER5_HARVESTER_CHOICES.SALVAGE) {
    return normalized;
  }
  return "";
}

function buildDialogueLines(choice) {
  const lines = [
    "Rowan: The ridge is already whispering your choice back to me.",
    "Arthur: We stopped the Warden, but it feels like trouble only changed shape.",
    "Elaine: Vaeloris does not mourn losses. It recalculates.",
    "Willow: Translation: metal scouts, less subtle hats.",
  ];
  if (choice === CHAPTER5_HARVESTER_CHOICES.SHATTER) {
    lines.push("Rowan: You shattered the core. Good. They will answer that with retaliation, not restraint.");
    lines.push("Elaine: A cleaner decision, though it invites a harsher response.");
  } else {
    lines.push("Rowan: You carried salvage home. Useful... and dangerous.");
    lines.push("Elaine: I know exactly what Vaeloris does with 'useful' things.");
  }
  lines.push(
    "Arthur: I don't want Thornmere paying for choices I made in Emberfall.",
    "Elaine: Then we answer quickly, before Vaeloris writes the next move for us.",
    "Rowan: Then make the next one quickly.",
    "Willow: They're not angry. They're curious. That's worse.",
    "Elaine: Scouts are already probing the ridge road.",
    "Arthur: Then we clear the road before they map the village.",
    "Rowan: Exactly. Break the patrol near the gate.",
    "Rowan: Then cross the ridge path and see what waits beyond."
  );
  return lines;
}

export function resolveChapter5PressureStage(choice, currentStage = 1) {
  const normalizedChoice = normalizeHarvesterChoice(choice);
  const baseStage = Math.max(1, Math.floor(Number(currentStage) || 1));
  if (normalizedChoice === CHAPTER5_HARVESTER_CHOICES.SALVAGE) {
    return Math.max(2, baseStage);
  }
  return Math.max(1, Math.min(baseStage, 1));
}

export function tryTriggerChapter5Aftershock(context = {}) {
  const {
    currentSceneId = "",
    nearRowan = false,
    harvesterWardenDefeated = false,
    harvesterChoice = "",
    chapter5AftershockDone = false,
    willowJoined = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    force = false,
    currentPressureStage = 1,
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  const normalizedChoice = normalizeHarvesterChoice(harvesterChoice);

  if (!force) {
    if (sceneId !== "thornmere") return { triggered: false };
    if (!nearRowan) return { triggered: false };
    if (!harvesterWardenDefeated) return { triggered: false };
    if (!normalizedChoice) return { triggered: false };
    if (!willowJoined) return { triggered: false };
    if (Boolean(chapter5AftershockDone)) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (sceneId !== "thornmere" || !normalizedChoice) {
    return { triggered: false };
  }

  return {
    triggered: true,
    choice: normalizedChoice,
    lockSeconds: 1,
    pressureStage: resolveChapter5PressureStage(normalizedChoice, currentPressureStage),
    lines: buildDialogueLines(normalizedChoice),
    unlockToast: "A path in the roots opens toward the ridge.",
    objectiveId: OBJECTIVE_IDS.CLEAR_RIDGE_PATROL,
    setFlags: Object.freeze({
      [CHAPTER5_FLAGS.AFTERSHOCK_DONE]: true,
      [CHAPTER5_FLAGS.RIDGE_GATE_UNLOCKED]: true,
      [CHAPTER5_FLAGS.REGION3_SEED_UNLOCKED]: true,
      [CHAPTER5_FLAGS.PATROL_SETPIECE_DONE]: false,
    }),
  };
}
