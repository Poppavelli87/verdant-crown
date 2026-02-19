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

function getConvergenceColor(choice) {
  if (choice === "tune") {
    return "The vision is curious and hungry, listening back as hard as you listen.";
  }
  if (choice === "shatter") {
    return "The vision is quiet and almost relieved, as if one screaming wire finally snapped.";
  }
  return "The vision wavers between hunger and hush.";
}

function getHarvesterThread(choice) {
  if (choice === "salvage") {
    return "A low thrum answers you: you carried a piece of their industry into this chamber.";
  }
  if (choice === "shatter") {
    return "The chamber notes your refusal: you broke their machine instead of bargaining with it.";
  }
  return "The chamber measures your earlier choices and keeps its verdict hidden.";
}

function getTierDescriptor(tier) {
  if (tier === "still") return "steady";
  if (tier === "uneasy") return "nervous";
  if (tier === "restless") return "frayed";
  if (tier === "fractured") return "splintered";
  return "balanced";
}

export function playChapter9LoreVision(context = {}) {
  const convergenceChoice = normalizeChoice(context.chapter7ConvergenceChoice);
  const harvesterChoice = normalizeChoice(context.vaelorisHarvesterChoice);
  const crownTier = normalizeTier(context.crownTier);
  const tierDescriptor = getTierDescriptor(crownTier);

  const panels = [
    {
      id: "panel-1",
      title: "Memory Organ",
      text: "The Crown is memory, the world's immune system. It sings reality back into coherence.",
    },
    {
      id: "panel-2",
      title: "Spiral Time",
      text: `Sunders happened before: 100,000-year echoes folding into a spiral. This cycle feels ${tierDescriptor}.`,
    },
    {
      id: "panel-3",
      title: "Old Oaths",
      text: "Vaeloris descends from the Oath Court, wardens who drifted from guardianship into industry.",
    },
    {
      id: "panel-4",
      title: "Hidden Bloodlines",
      text: "Willow's teacher appears: Mirthsage Ilyra, the Laughing Seer of Saffron Glass. Arthur is named Crownseed, Rootbound foundling.",
    },
    {
      id: "panel-5",
      title: "Last Spire",
      text: "Elaine sees her family oath clearly: polite cages around the Crown. Vaeloris builds THE LAST SPIRE to become the sole voice.",
    },
  ];

  return {
    triggered: true,
    lockSeconds: 1,
    objectiveId: OBJECTIVE_IDS.MAKE_VAULT_CHOICE,
    preface: getConvergenceColor(convergenceChoice),
    harvesterThread: getHarvesterThread(harvesterChoice),
    panels,
    finalLine:
      "If the Last Spire ascends, the world's memory collapses into one will. Stop it, or everything becomes edited silence.",
  };
}

