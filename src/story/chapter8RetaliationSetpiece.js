import { OBJECTIVE_IDS } from "./objectives.js";
import { CHAPTER8_FLAGS, CONVERGENCE_CHOICES } from "./chapter8Aftermath.js";

const DEFAULT_ARENA_RADIUS = 2.35;
const DEFAULT_SILENCE_RADIUS = 1.18;

function normalizePressureStage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.min(3, Math.floor(numeric)));
}

function normalizeConvergenceChoice(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === CONVERGENCE_CHOICES.SHATTER || normalized === CONVERGENCE_CHOICES.TUNE) {
    return normalized;
  }
  return "";
}

function buildSpikeDefinitions(spikePositions = []) {
  return spikePositions.map((entry, index) => ({
    id: `mute-spike-${index + 1}`,
    x: Number(entry?.x) || 0,
    z: Number(entry?.y) || 0,
    maxHealth: 44,
    alive: true,
  }));
}

function buildEnemySpawns(stage, convergenceChoice, center) {
  const spawns = [
    {
      id: "mute-defense-construct-a",
      role: "construct",
      type: "standard",
      offsetX: -0.86,
      offsetZ: -0.18,
      maxHealth: 52,
      attackCooldown: 1.72,
    },
    {
      id: "mute-defense-striker-a",
      role: "striker",
      type: "ambush",
      offsetX: 0.92,
      offsetZ: 0.36,
      maxHealth: 40,
      attackCooldown: 1.05,
    },
  ];
  if (stage >= 2) {
    spawns.push({
      id: "mute-defense-construct-b",
      role: "construct",
      type: "standard",
      offsetX: 0.18,
      offsetZ: -1.02,
      maxHealth: 54,
      attackCooldown: 1.64,
    });
  }
  if (stage >= 3 || convergenceChoice === CONVERGENCE_CHOICES.TUNE) {
    spawns.push({
      id: "mute-defense-hexer-a",
      role: "hexer",
      type: "standard",
      offsetX: -0.18,
      offsetZ: 1.02,
      maxHealth: 43,
      attackCooldown: 1.86,
    });
  }

  return spawns.map((entry) => ({
    id: entry.id,
    role: entry.role,
    type: entry.type,
    x: Number(center?.x) + entry.offsetX,
    z: Number(center?.y) + entry.offsetZ,
    maxHealth: entry.maxHealth,
    aggroRadius: 4.2,
    attackRange: entry.role === "construct" ? 1.04 : entry.role === "hexer" ? 1.08 : 0.74,
    attackCooldown: entry.attackCooldown,
    lingerTag: "chapter8-retaliation",
  }));
}

export function tryStartRetaliationSetpiece(context = {}) {
  const {
    currentSceneId = "",
    retaliationStarted = false,
    muteSpikesCleared = false,
    setpieceActive = false,
    inTriggerZone = false,
    retaliationConfig = null,
    pressureStage = 1,
    convergenceChoice = "",
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  if (!force) {
    if (sceneId !== "thornmere") return { triggered: false };
    if (!retaliationStarted) return { triggered: false };
    if (muteSpikesCleared) return { triggered: false };
    if (setpieceActive) return { triggered: false };
    if (!inTriggerZone) return { triggered: false };
    if (!retaliationConfig?.center || !Array.isArray(retaliationConfig?.spikePositions)) return { triggered: false };
  } else if (sceneId !== "thornmere" || !retaliationConfig?.center) {
    return { triggered: false };
  }

  const center = {
    x: Number(retaliationConfig.center.x) || 0,
    y: Number(retaliationConfig.center.y) || 0,
  };
  const spikes = buildSpikeDefinitions(retaliationConfig.spikePositions ?? []);
  if (spikes.length <= 0) {
    return { triggered: false };
  }
  const stage = normalizePressureStage(pressureStage);
  const choice = normalizeConvergenceChoice(convergenceChoice);
  return {
    triggered: true,
    center,
    arenaRadius: Math.max(1.75, Number(retaliationConfig.arenaRadius) || DEFAULT_ARENA_RADIUS),
    silenceRadius: Math.max(0.85, Number(retaliationConfig.silenceRadius) || DEFAULT_SILENCE_RADIUS),
    spikes,
    enemySpawns: buildEnemySpawns(stage, choice, center),
    objectiveId: OBJECTIVE_IDS.STOP_MUTE_SPIKES,
    setFlags: Object.freeze({
      [CHAPTER8_FLAGS.MUTE_SPIKES_CLEARED]: false,
    }),
    startToast: "Mute Spikes are smothering the grove.",
    boundsToast: "A metal hush pins you in.",
    completeToast: "The roots breathe again.",
  };
}
