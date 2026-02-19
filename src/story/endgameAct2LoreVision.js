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

function getChoiceThread(choice) {
  if (choice === "seal") {
    return "The Loom shows sealed gates and sharpened reprisals: safety bought with open retaliation.";
  }
  if (choice === "take_key") {
    return "The Loom catches on the Crownheart Key in your grip, power humming louder than caution.";
  }
  return "The Loom cannot decide whether you chose caution or leverage.";
}

function getTierThread(tier) {
  if (tier === "still" || tier === "uneasy") {
    return "The Crown's tone is held and deliberate, as if waiting for a final witness.";
  }
  if (tier === "fractured") {
    return "The Crown's tone is splintered and surgical, willing to cut memory to keep shape.";
  }
  if (tier === "restless") {
    return "The Crown's tone jitters between mercy and erasure.";
  }
  return "The Crown's tone stays balanced, but not benevolent.";
}

export function playEndgameAct2Lore(context = {}) {
  const chapter9Choice = normalizeChoice(context.chapter9Choice);
  const crownTier = normalizeTier(context.crownTier);
  return {
    triggered: true,
    lockSeconds: 1,
    objectiveId: OBJECTIVE_IDS.APPROACH_LAST_DOOR,
    preface: getChoiceThread(chapter9Choice),
    tierThread: getTierThread(crownTier),
    panels: [
      {
        id: "loom-1",
        title: "Rewrite Engine",
        text: "The Last Spire is not a tower. It is a rewrite engine built to edit what happened.",
      },
      {
        id: "loom-2",
        title: "Single Narrator",
        text: "Vaeloris does not seek rulership alone. They seek authorship: one narrator for all reality.",
      },
      {
        id: "loom-3",
        title: "Crown's Edge",
        text: "The Crown heals coherence, but it also erases contradictions when panic wins.",
      },
      {
        id: "loom-4",
        title: "Borrowed Voices",
        text: "Willow hears Mirthsage Ilyra named again, and whispers she was taught to run only once.",
      },
      {
        id: "loom-5",
        title: "Oaths and Seeds",
        text: "Elaine admits her house fed the cages. Arthur understands Crownseed means a living override key.",
      },
    ],
    finalLine: "The Last Door is ahead. Gather breath, then breach the final act.",
  };
}
