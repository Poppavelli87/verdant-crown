import { OBJECTIVE_IDS } from "./objectives.js";

export const ROWAN_COUNCIL_FLAG = "rowan_council_done";
export const EMBERFALL_LEAD_UNLOCKED_FLAG = "emberfall_lead_unlocked";
export const CURRENT_OBJECTIVE_FLAG = "current_objective";

function buildCouncilLines({ willowJoined = false, elaineJoined = false } = {}) {
  const lines = [
    "Rowan: The Crown is ancient memory, Arthur. Not ore for a ledger.",
    "Arthur: I don't understand all of it... but I can't ignore it.",
    "Rowan: Good. Because they are listening through the roots.",
    "Rowan: In Emberfall, a gem-touched watcher tracks the same pattern.",
    "Arthur: A watcher in the ash?",
    "Rowan: Willow. Sharp eyes. Sharper temper.",
  ];
  if (elaineJoined) {
    lines.splice(1, 0,
      "Elaine: Vaeloris never saw that. They called every pulse a metric.",
      "Elaine: I left when they tried to map people the same way."
    );
  }
  if (willowJoined) {
    lines.push("Willow: You're late. I already heard the ridge arguing with itself.");
  } else {
    lines.push("Elaine: If Willow is still out there, she saw their trail first.");
  }
  lines.push("Rowan: Follow the ash wind east. Reach the ridge path. Seek Emberfall.");
  return lines;
}

export function tryTriggerRowanCouncil(context = {}) {
  const {
    currentSceneId = "",
    nearRowan = false,
    milestoneMet = false,
    rowanCouncilDone = false,
    emberfallLeadUnlocked = false,
    willowJoined = false,
    elaineJoined = false,
    harvesterChoiceResolved = false,
    force = false,
  } = context;

  if (!force) {
    if (currentSceneId !== "thornmere") return { triggered: false };
    if (!nearRowan) return { triggered: false };
    if (!milestoneMet) return { triggered: false };
    if (Boolean(rowanCouncilDone)) return { triggered: false };
    if (Boolean(harvesterChoiceResolved)) return { triggered: false };
    if (Boolean(emberfallLeadUnlocked)) return { triggered: false };
    if (!Boolean(elaineJoined)) return { triggered: false };
  } else if (currentSceneId !== "thornmere") {
    return { triggered: false };
  }

  return {
    triggered: true,
    lockSeconds: 1.0,
    lines: buildCouncilLines({ willowJoined: Boolean(willowJoined), elaineJoined: Boolean(elaineJoined) }),
    unlockToast: "A path in the roots opens.",
    setFlags: Object.freeze({
      [ROWAN_COUNCIL_FLAG]: true,
      [EMBERFALL_LEAD_UNLOCKED_FLAG]: true,
    }),
    objectiveId: OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL,
  };
}
