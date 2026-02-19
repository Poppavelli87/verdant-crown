import { OBJECTIVE_IDS } from "./objectives.js";
import { CHAPTER6_FLAGS } from "./chapter6ArrivalWindward.js";

const DEFAULT_ARENA_RADIUS = 2.4;

function normalizeStage(value) {
  const stage = Math.floor(Number(value) || 1);
  return Math.max(1, Math.min(3, stage));
}

function buildRelayScouts(stage, center) {
  const base = [
    {
      id: "relay-construct-a",
      role: "construct",
      type: "standard",
      offsetX: -0.92,
      offsetZ: 0.2,
      maxHealth: 48,
      aggroRadius: 4.1,
      attackRange: 1.02,
      attackCooldown: 1.7,
    },
    {
      id: "relay-striker-a",
      role: "striker",
      type: "ambush",
      offsetX: 0.95,
      offsetZ: -0.38,
      maxHealth: 42,
      aggroRadius: 4.2,
      attackRange: 0.72,
      attackCooldown: 1.08,
    },
  ];
  if (stage >= 2) {
    base.push({
      id: "relay-construct-b",
      role: "construct",
      type: "standard",
      offsetX: 0.16,
      offsetZ: 1.08,
      maxHealth: 50,
      aggroRadius: 4.15,
      attackRange: 1.03,
      attackCooldown: 1.68,
    });
  }
  if (stage >= 3) {
    base.push({
      id: "relay-hexer-a",
      role: "hexer",
      type: "standard",
      offsetX: -0.2,
      offsetZ: -1.12,
      maxHealth: 44,
      aggroRadius: 4.2,
      attackRange: 1.05,
      attackCooldown: 1.86,
    });
  }
  return base.map((entry) => ({
    ...entry,
    x: Number(center?.x) + entry.offsetX,
    z: Number(center?.y) + entry.offsetZ,
    lingerTag: "windward-relay",
  }));
}

function buildTethers(tetherPositions = []) {
  return tetherPositions.map((entry, index) => ({
    id: `relay-tether-${index + 1}`,
    x: Number(entry?.x) || 0,
    z: Number(entry?.y) || 0,
    maxHealth: 32,
  }));
}

export function tryStartRelaySetpiece(context = {}) {
  const {
    currentSceneId = "",
    chapter6ArrivedWindward = false,
    relayDropped = false,
    relayActive = false,
    inTriggerZone = false,
    relayConfig = null,
    pressureStage = 1,
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "").trim().toLowerCase();
  if (!force) {
    if (sceneId !== "windward" && sceneId !== "region3_seed") return { triggered: false };
    if (!chapter6ArrivedWindward) return { triggered: false };
    if (relayDropped) return { triggered: false };
    if (relayActive) return { triggered: false };
    if (!inTriggerZone) return { triggered: false };
    if (!relayConfig?.center || !Array.isArray(relayConfig?.tetherPositions)) return { triggered: false };
  } else if ((sceneId !== "windward" && sceneId !== "region3_seed") || !relayConfig?.center) {
    return { triggered: false };
  }

  const center = {
    x: Number(relayConfig.center.x) || 0,
    y: Number(relayConfig.center.y) || 0,
  };
  const stage = normalizeStage(pressureStage);
  const arenaRadius = Math.max(1.8, Number(relayConfig.arenaRadius) || DEFAULT_ARENA_RADIUS);
  const tethers = buildTethers(relayConfig.tetherPositions ?? []);
  if (tethers.length <= 0) {
    return { triggered: false };
  }
  return {
    triggered: true,
    center,
    arenaRadius,
    stage,
    tethers,
    enemySpawns: buildRelayScouts(stage, center),
    objectiveId: OBJECTIVE_IDS.DROP_RELAY,
    setFlags: Object.freeze({
      [CHAPTER6_FLAGS.RELAY_DROPPED]: false,
    }),
    startToast: "A signal relay locks onto the Circle.",
    boundsToast: "A metal hush pins you in.",
  };
}
