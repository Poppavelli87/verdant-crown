import { OBJECTIVE_IDS } from "./objectives.js";

function asNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function tryStartSpireBreach(context = {}) {
  const {
    currentSceneId = "",
    objectiveId = "",
    nearGateZone = false,
    outerSpireBreached = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    menuOpen = false,
    pressureStage = 1,
    breachConfig = null,
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "")
    .trim()
    .toLowerCase();
  const objective = String(objectiveId ?? "")
    .trim()
    .toLowerCase();

  if (sceneId !== "spire_approach") {
    return { triggered: false };
  }

  if (!force) {
    if (objective !== OBJECTIVE_IDS.BREACH_OUTER_SPIRE) return { triggered: false };
    if (!nearGateZone) return { triggered: false };
    if (outerSpireBreached) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen || menuOpen) return { triggered: false };
  }

  const center = breachConfig?.gateCenter ?? { x: 2.84, y: -0.14 };
  const lockNodes = Array.isArray(breachConfig?.lockNodes) && breachConfig.lockNodes.length >= 3
    ? breachConfig.lockNodes
    : [
        { id: "lock-node-1", x: 2.22, y: 0.56 },
        { id: "lock-node-2", x: 3.46, y: 0.52 },
        { id: "lock-node-3", x: 3.14, y: -0.92 },
      ];
  const stage = Math.max(1, Math.min(3, Math.floor(asNumber(pressureStage, 1))));
  const enemySpawns = [
    {
      id: "spire-breach-scout-a",
      role: "striker",
      type: "ambush",
      x: asNumber(center.x, 2.84) - 1.12,
      z: asNumber(center.y, -0.14) + 0.94,
      maxHealth: 44 + stage * 4,
      aggroRadius: 4.2,
      attackRange: 0.72,
      attackCooldown: 1.06,
      lingerTag: "spire-breach",
    },
    {
      id: "spire-breach-scout-b",
      role: "skirmisher",
      type: "standard",
      x: asNumber(center.x, 2.84) + 1.04,
      z: asNumber(center.y, -0.14) + 0.86,
      maxHealth: 48 + stage * 4,
      aggroRadius: 4.3,
      attackRange: 0.72,
      attackCooldown: 1.18,
      lingerTag: "spire-breach",
    },
    {
      id: "spire-breach-scout-c",
      role: stage >= 2 ? "construct" : "harrier",
      type: "standard",
      x: asNumber(center.x, 2.84) + 0.14,
      z: asNumber(center.y, -0.14) - 1.06,
      maxHealth: 52 + stage * 5,
      aggroRadius: 4.4,
      attackRange: stage >= 2 ? 1.04 : 0.68,
      attackCooldown: stage >= 2 ? 1.42 : 1.12,
      lingerTag: "spire-breach",
    },
  ];

  return {
    triggered: true,
    objectiveId: OBJECTIVE_IDS.BREACH_OUTER_SPIRE,
    center: {
      x: asNumber(center.x, 2.84),
      y: asNumber(center.y, -0.14),
    },
    arenaRadius: Math.max(1.8, asNumber(breachConfig?.arenaRadius, 2.68)),
    triggerRadius: Math.max(0.6, asNumber(breachConfig?.triggerRadius, 1.16)),
    checkpoint: breachConfig?.checkpoint
      ? {
          x: asNumber(breachConfig.checkpoint.x, 1.38),
          z: asNumber(breachConfig.checkpoint.z, -0.08),
        }
      : { x: 1.38, z: -0.08 },
    lockNodes: lockNodes.map((node, index) => ({
      id: String(node?.id ?? `lock-node-${index + 1}`),
      x: asNumber(node?.x, index === 0 ? 2.22 : index === 1 ? 3.46 : 3.14),
      y: asNumber(node?.y, index === 2 ? -0.92 : 0.56),
    })),
    enemySpawns,
  };
}

