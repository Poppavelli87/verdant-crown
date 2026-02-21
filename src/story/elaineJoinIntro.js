import { OBJECTIVE_IDS } from "./objectives.js";

export const ELAINE_JOIN_INTRO_DONE_FLAG = "elaine_join_intro_done";

const BASE_LINES = Object.freeze([
  "Elaine: Before you ask — yes. I know what Vaeloris builds.",
  "Elaine: No, I'm not here to defend them.",
  "Arthur: Then why are you here?",
  "Elaine: Because the ground is changing… and they think it belongs to them.",
  "Elaine: I'm here to prevent a mistake that cannot be paid back.",
  "Arthur: I don't understand half of what's happening.",
  "Elaine: Good. That means you haven't started pretending.",
  "Elaine: You pulled something old into motion.",
  "Elaine: Now we move carefully — and quickly.",
  "Arthur: Carefully and quickly. Right.",
]);

const WILLOW_QUIP = "Willow: Fancy words, noble. Try not to trip over them.";

export function tryTriggerElaineJoinIntro(context = {}) {
  const {
    elaineJoined = false,
    introDone = false,
    willowJoined = false,
    objectiveId = OBJECTIVE_IDS.RETURN_TO_ROWAN,
  } = context;

  if (!elaineJoined || introDone) {
    return { triggered: false };
  }

  const objective = String(objectiveId ?? "").trim() || OBJECTIVE_IDS.RETURN_TO_ROWAN;
  const lines = [...BASE_LINES];
  if (willowJoined) {
    lines.push(WILLOW_QUIP);
  }

  if (objective === OBJECTIVE_IDS.STABILIZE_VEIN) {
    lines.push("Elaine: Stabilize the vein before it answers back.");
  } else {
    lines.push("Elaine: Return to Rowan. He'll know what the village felt.");
  }

  return {
    triggered: true,
    lockSeconds: 0.6,
    lines,
    setFlags: {
      [ELAINE_JOIN_INTRO_DONE_FLAG]: true,
    },
  };
}
