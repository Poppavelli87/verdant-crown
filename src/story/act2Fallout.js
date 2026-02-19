export const ACT2_FALLOUT_FLAG = "act2_fallout_done";
export const RIDGE_GATE_UNLOCKED_FLAG = "ridge_gate_unlocked";

export const ACT2_FALLOUT_CHOICES = Object.freeze({
  SHATTER: "shatter",
  SALVAGE: "salvage",
});

function normalizeChoice(choice) {
  const normalized = String(choice ?? "").trim().toLowerCase();
  if (normalized === ACT2_FALLOUT_CHOICES.SHATTER || normalized === ACT2_FALLOUT_CHOICES.SALVAGE) {
    return normalized;
  }
  return "";
}

function buildLines({ choice, willowJoined }) {
  const lines = [
    "Elaine: That rig wasn't just mining. It was listening.",
    "Arthur: So... it's not over.",
  ];

  if (willowJoined) {
    lines.push("Willow: Nothing that learns ever stops at one lesson.");
  }

  if (choice === ACT2_FALLOUT_CHOICES.SHATTER) {
    lines.push("Rowan: You did right to shatter it. Vaeloris will answer that loss.");
  } else {
    lines.push("Rowan: Salvage buys us proof, but it paints a target.");
  }

  lines.push(
    "Elaine: They were mapping us. We'll need to move first.",
    "Rowan: A ridge path opens when the roots agree.",
    "Rowan: If Vaeloris is moving gear... follow their trail."
  );

  return lines;
}

export function tryTriggerAct2Fallout(context = {}) {
  const {
    currentSceneId = "",
    harvesterChoice = "",
    act2FalloutDone = false,
    willowJoined = false,
    pressureStage = 1,
    force = false,
  } = context;

  const choice = normalizeChoice(harvesterChoice);
  if (!force) {
    if (currentSceneId !== "thornmere") return { triggered: false };
    if (!choice) return { triggered: false };
    if (Boolean(act2FalloutDone)) return { triggered: false };
  } else if (!choice) {
    return { triggered: false };
  }

  const watchedToast =
    choice === ACT2_FALLOUT_CHOICES.SALVAGE || Number(pressureStage) >= 2 ? "The Crown feels... watched." : "";

  return {
    triggered: true,
    choice,
    lockSeconds: 1.0,
    lines: buildLines({ choice, willowJoined: Boolean(willowJoined) }),
    unlockToast: "A path in the roots opens.",
    watchedToast,
    setFlags: Object.freeze({
      [ACT2_FALLOUT_FLAG]: true,
      [RIDGE_GATE_UNLOCKED_FLAG]: true,
    }),
  };
}
