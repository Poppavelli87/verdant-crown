import { OBJECTIVE_IDS } from "./objectives.js";
import { CHAPTER2_FLAGS } from "./chapter2AshwindTrail.js";

const WILLOW_MEET_LINES = Object.freeze([
  "Willow: Oh good. Two strangers and a sword. My favorite weather.",
  "Arthur: We're not here to start trouble.",
  "Willow: Great. Trouble came first and saved us the effort.",
  "Elaine: You are Willow.",
  "Willow: Depends who is asking. If it's Vaeloris, I'm a cloud.",
  "Arthur: We're looking for answers about the Scar.",
  "Willow: Everyone is. Most call it work and invoice the pain.",
  "Elaine: They're drilling into living veins.",
  "Willow: Yes. The ground screamed. Quietly. Extremely impolite.",
  "Arthur: Can you help us stop them?",
  "Willow: Maybe. First, prove you're not the kind of hero who trips over his own legend.",
  "Willow: Scouts inbound. Hold this clearing, then we talk routes.",
]);

export function tryTriggerWillowMeet(context = {}) {
  const {
    currentSceneId = "",
    chapter2ArrivedEmberfall = false,
    willowMet = false,
    willowJoined = false,
    inTriggerZone = false,
    elaineJoined = false,
    force = false,
  } = context;

  if (!Boolean(elaineJoined)) {
    return {
      triggered: false,
      blocked: true,
      blockedToast: "A scorched path, but no guide. Return to Thornmere.",
      objectiveId: OBJECTIVE_IDS.RETURN_TO_ROWAN,
    };
  }

  if (!force) {
    if (String(currentSceneId ?? "").toLowerCase() !== "emberfall") return { triggered: false };
    if (!chapter2ArrivedEmberfall) return { triggered: false };
    if (Boolean(willowMet) || Boolean(willowJoined)) return { triggered: false };
    if (!inTriggerZone) return { triggered: false };
  } else if (String(currentSceneId ?? "").toLowerCase() !== "emberfall") {
    return { triggered: false };
  }

  return {
    triggered: true,
    lockSeconds: 1,
    lines: WILLOW_MEET_LINES,
    objectiveId: OBJECTIVE_IDS.SURVIVE_AMBUSH,
    setFlags: Object.freeze({
      [CHAPTER2_FLAGS.WILLOW_MET]: true,
    }),
  };
}
