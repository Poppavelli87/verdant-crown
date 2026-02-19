import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER9_FLAGS = Object.freeze({
  STARTED: "chapter9_started",
  ANCHORS_ATTUNED: "chapter9_anchors_attuned",
  NULL_ARCHIVIST_DEFEATED: "chapter9_null_archivist_defeated",
  CHOICE: "chapter9_choice",
});

const CHAPTER9_TITLE = "CROWNHEART VAULT";

const CHAPTER9_OPENING_LINES = Object.freeze([
  "Arthur: The air is heavy. Like the stone is holding its breath.",
  "Elaine: This architecture predates Vaeloris by dynasties. That should worry us.",
  "Willow: The roots are yelling in harmonies. Rude but talented.",
  "Arthur: Yelling about what?",
  "Willow: Memory. Too much, too fast. They're remembering hard enough to split the floor.",
  "Elaine: Then we stop the split now. Anchors first, argument later.",
  "Arthur: Three anchors, then the door.",
  "Willow: And something mean behind it. I can feel the librarian teeth.",
  "Elaine: Good. We have a plan and no time.",
  "Arthur: Move. Attune the anchors.",
]);

export function tryTriggerChapter9Start(context = {}) {
  const {
    currentSceneId = "",
    nearVaultApproach = false,
    chapter8MuteSpikesCleared = false,
    region4SeedUnlocked = false,
    chapter9Started = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    menuOpen = false,
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "")
    .trim()
    .toLowerCase();
  const inRootway = sceneId === "region4_seed" || sceneId === "rootway";

  if (!force) {
    if (!inRootway) return { triggered: false };
    if (!nearVaultApproach) return { triggered: false };
    if (!chapter8MuteSpikesCleared || !region4SeedUnlocked) return { triggered: false };
    if (chapter9Started) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen || menuOpen) return { triggered: false };
  } else if (!inRootway) {
    return { triggered: false };
  }

  return {
    triggered: true,
    title: CHAPTER9_TITLE,
    lines: [...CHAPTER9_OPENING_LINES],
    objectiveId: OBJECTIVE_IDS.STABILIZE_WORLDROOTS,
    startSunderMeter: true,
    lockSeconds: 0.9,
    setFlags: Object.freeze({
      [CHAPTER9_FLAGS.STARTED]: true,
      [CHAPTER9_FLAGS.ANCHORS_ATTUNED]: false,
      [CHAPTER9_FLAGS.NULL_ARCHIVIST_DEFEATED]: false,
    }),
  };
}

