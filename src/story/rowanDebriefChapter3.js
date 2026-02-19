import { OBJECTIVE_IDS } from "./objectives.js";

export const CHAPTER3_FLAGS = Object.freeze({
  ROWAN_DEBRIEF_DONE: "chapter3_rowan_debrief_done",
  LISTENING_SPIKE_LEAD_UNLOCKED: "listening_spike_lead_unlocked",
});

const DEBRIEF_LINES = Object.freeze([
  "Rowan: Willow. You found us a sharp road, as ever.",
  "Willow: I found ash, sparks, and your favorite stoic sword. In that order.",
  "Arthur: We held the scouts, but Vaeloris was probing ahead of us.",
  "Rowan: Then hear this clearly. They have changed methods.",
  "Elaine: If this is another ledger trick, say so.",
  "Rowan: Not drills. Listening Spikes. They do not mine. They listen.",
  "Willow: Metal ears in root-soil. Very rude engineering.",
  "Arthur: Listening for what?",
  "Rowan: Pulse cadence. Crown memory. Us.",
  "Elaine: I grew up at Vaeloris tables. Posture, silence, obedience. This is their newer etiquette.",
  "Arthur: Rowan found me near split roots. If they are listening there too, I need answers.",
  "Willow: Answers later. Ears first. Snap the Spike before it learns your names.",
  "Rowan: Go to Emberfall. Follow the metallic hum. Find the Listening Spike.",
]);

export function tryTriggerRowanDebrief(context = {}) {
  const {
    currentSceneId = "",
    nearRowan = false,
    willowJoined = false,
    chapter3RowanDebriefDone = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    force = false,
  } = context;

  if (!force) {
    if (String(currentSceneId ?? "").toLowerCase() !== "thornmere") return { triggered: false };
    if (!nearRowan) return { triggered: false };
    if (!willowJoined) return { triggered: false };
    if (Boolean(chapter3RowanDebriefDone)) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen) return { triggered: false };
  } else if (String(currentSceneId ?? "").toLowerCase() !== "thornmere") {
    return { triggered: false };
  }

  return {
    triggered: true,
    lockSeconds: 1,
    lines: [...DEBRIEF_LINES],
    objectiveId: OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE,
    unlockToast: "A metallic hum threads through Emberfall.",
    setFlags: Object.freeze({
      [CHAPTER3_FLAGS.ROWAN_DEBRIEF_DONE]: true,
      [CHAPTER3_FLAGS.LISTENING_SPIKE_LEAD_UNLOCKED]: true,
    }),
  };
}
