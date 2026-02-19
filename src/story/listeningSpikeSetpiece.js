import { OBJECTIVE_IDS } from "./objectives.js";

export const LISTENING_SPIKE_FLAGS = Object.freeze({
  SITE_CLEARED: "listening_spike_site_cleared",
  CHOICE: "listening_spike_choice",
});

export const LISTENING_SPIKE_CHOICE_VALUES = Object.freeze({
  NONE: "",
  CRUSH: "crush",
  POCKET: "pocket",
});

const DEFAULT_SETPIECE_RADIUS = 2.5;

const LISTENING_SPIKE_SCOUTS = Object.freeze([
  Object.freeze({
    id: "listening-spike-construct-a",
    role: "construct",
    type: "standard",
    offsetX: 0.86,
    offsetZ: 0.34,
    maxHealth: 46,
    aggroRadius: 3.9,
    attackRange: 1.06,
    attackCooldown: 1.72,
    lingerTag: "listening-spike",
  }),
  Object.freeze({
    id: "listening-spike-striker-a",
    role: "striker",
    type: "ambush",
    offsetX: -0.88,
    offsetZ: -0.45,
    maxHealth: 40,
    aggroRadius: 3.8,
    attackRange: 0.74,
    attackCooldown: 1.04,
    lingerTag: "listening-spike",
  }),
  Object.freeze({
    id: "listening-spike-harrier-a",
    role: "harrier",
    type: "standard",
    offsetX: 0.15,
    offsetZ: -1.02,
    maxHealth: 42,
    aggroRadius: 3.7,
    attackRange: 0.72,
    attackCooldown: 1.78,
    lingerTag: "listening-spike",
  }),
]);

export function normalizeListeningSpikeChoice(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === LISTENING_SPIKE_CHOICE_VALUES.CRUSH || normalized === LISTENING_SPIKE_CHOICE_VALUES.POCKET) {
    return normalized;
  }
  return LISTENING_SPIKE_CHOICE_VALUES.NONE;
}

export function tryStartListeningSpikeSetpiece(context = {}) {
  const {
    currentSceneId = "",
    leadUnlocked = false,
    siteCleared = false,
    choice = LISTENING_SPIKE_CHOICE_VALUES.NONE,
    active = false,
    inTriggerZone = false,
    center = null,
    radius = DEFAULT_SETPIECE_RADIUS,
    force = false,
  } = context;

  const normalizedChoice = normalizeListeningSpikeChoice(choice);
  if (!force) {
    if (String(currentSceneId ?? "").toLowerCase() !== "emberfall") return { triggered: false };
    if (!leadUnlocked) return { triggered: false };
    if (siteCleared) return { triggered: false };
    if (normalizedChoice !== LISTENING_SPIKE_CHOICE_VALUES.NONE) return { triggered: false };
    if (active) return { triggered: false };
    if (!inTriggerZone) return { triggered: false };
    if (!center) return { triggered: false };
  } else if (String(currentSceneId ?? "").toLowerCase() !== "emberfall" || !center) {
    return { triggered: false };
  }

  return {
    triggered: true,
    center: {
      x: Number(center?.x) || 0,
      y: Number(center?.y) || 0,
    },
    radius: Math.max(1.8, Number(radius) || DEFAULT_SETPIECE_RADIUS),
    enemySpawns: LISTENING_SPIKE_SCOUTS.map((entry) => ({
      ...entry,
      x: (Number(center?.x) || 0) + entry.offsetX,
      z: (Number(center?.y) || 0) + entry.offsetZ,
    })),
    objectiveId: OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE,
  };
}

export function resolveListeningSpikeChoiceOutcome(choice, currentPressureStage = 1) {
  const resolvedChoice = normalizeListeningSpikeChoice(choice);
  if (resolvedChoice === LISTENING_SPIKE_CHOICE_VALUES.NONE) {
    return {
      applied: false,
      choice: LISTENING_SPIKE_CHOICE_VALUES.NONE,
      moodDelta: 0,
      pressureStage: Math.max(1, Math.floor(Number(currentPressureStage) || 1)),
      toast: "",
    };
  }
  if (resolvedChoice === LISTENING_SPIKE_CHOICE_VALUES.CRUSH) {
    return {
      applied: true,
      choice: LISTENING_SPIKE_CHOICE_VALUES.CRUSH,
      moodDelta: 4,
      pressureStage: Math.max(1, Math.floor(Number(currentPressureStage) || 1)),
      toast: "The hum dies. The ash feels lighter.",
    };
  }
  return {
    applied: true,
    choice: LISTENING_SPIKE_CHOICE_VALUES.POCKET,
    moodDelta: -4,
    pressureStage: Math.max(Math.max(1, Math.floor(Number(currentPressureStage) || 1)), 2),
    toast: "The core thrums quietly, like it remembers you.",
  };
}
