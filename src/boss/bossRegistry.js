import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VEIN_GUARDIAN_MAX_HP } from "../combat/veinGuardian.js";

const DEFAULT_TELEGRAPH_COLOR = "#b6f9c4";

function getOrCreateScriptState(ctx, key, initialValue) {
  if (!Object.prototype.hasOwnProperty.call(ctx.scriptState, key)) {
    ctx.scriptState[key] = initialValue;
  }
  return ctx.scriptState[key];
}

function phaseOneUpdate(ctx, dtSeconds) {
  const timer = getOrCreateScriptState(ctx, "p1PulseTimer", 1.2);
  const nextTimer = timer - dtSeconds;
  ctx.scriptState.p1PulseTimer = nextTimer;
  if (nextTimer > 0) {
    return;
  }

  ctx.scriptState.p1PulseTimer = 2.9;
  ctx.vfx.spawnRing({
    position: ctx.bossPosition,
    innerRadius: 1.0,
    outerRadius: 1.55,
    color: DEFAULT_TELEGRAPH_COLOR,
    life: 0.62,
    opacity: 0.72,
    spread: 0.48,
  });
}

function phaseTwoUpdate(ctx, dtSeconds) {
  const summonTimer = getOrCreateScriptState(ctx, "p2SummonTimer", 5.1) - dtSeconds;
  ctx.scriptState.p2SummonTimer = summonTimer;
  if (summonTimer <= 0) {
    ctx.scriptState.p2SummonTimer = 8.2;
    const existingCount = ctx.combat.countAlive(ctx.scriptState.p2MinionIds ?? []);
    if (existingCount < 2) {
      const angle = ctx.rng.nextFloat() * Math.PI * 2;
      const offsets = [0, Math.PI];
      const definitions = offsets.map((phase, index) => ({
        id: `boss-p2-skirmisher-${ctx.elapsedTag}-${index + 1}`,
        role: "skirmisher",
        type: "standard",
        x: ctx.bossPosition.x + Math.cos(angle + phase) * 1.3,
        z: ctx.bossPosition.y + Math.sin(angle + phase) * 1.3,
        aggroRadius: 3.2,
        attackRange: 0.68,
        lingerTag: "boss-instance-minion",
      }));
      const ids = ctx.combat.spawnMinions(definitions);
      ctx.scriptState.p2MinionIds = [...(ctx.scriptState.p2MinionIds ?? []), ...ids];
    }
  }

  const lineTimer = getOrCreateScriptState(ctx, "p2LineTimer", 1.6) - dtSeconds;
  ctx.scriptState.p2LineTimer = lineTimer;
  if (lineTimer <= 0) {
    ctx.scriptState.p2LineTimer = 3.8;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#c8ffd6",
      life: 0.42,
      width: 0.1,
    });
  }
}

function phaseThreeUpdate(ctx, dtSeconds) {
  const pulseTimer = getOrCreateScriptState(ctx, "p3PulseTimer", 1.1) - dtSeconds;
  ctx.scriptState.p3PulseTimer = pulseTimer;
  if (pulseTimer <= 0) {
    ctx.scriptState.p3PulseTimer = 1.95;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.95,
      outerRadius: 1.82,
      color: "#d1ffe0",
      life: 0.56,
      opacity: 0.78,
      spread: 0.75,
    });
  }

  const arcTimer = getOrCreateScriptState(ctx, "p3ArcTimer", 1.45) - dtSeconds;
  ctx.scriptState.p3ArcTimer = arcTimer;
  if (arcTimer <= 0) {
    ctx.scriptState.p3ArcTimer = 3.05;
    const baseAngle = ctx.rng.nextFloat() * Math.PI * 2;
    for (let i = -2; i <= 2; i += 1) {
      const angle = baseAngle + i * 0.36;
      const point = new THREE.Vector2(
        ctx.bossPosition.x + Math.cos(angle) * (0.8 + Math.abs(i) * 0.22),
        ctx.bossPosition.y + Math.sin(angle) * (0.8 + Math.abs(i) * 0.22)
      );
      ctx.vfx.spawnRing({
        position: point,
        innerRadius: 0.2,
        outerRadius: 0.36,
        color: "#b8f7c8",
        life: 0.56,
        opacity: 0.82,
        spread: 0.28,
      });
    }
  }
}

function createVeinGuardianBoss({
  id = "crown_manifestation",
  name = "Vein Guardian",
  maxHP = Math.max(VEIN_GUARDIAN_MAX_HP, 300),
  bossConfig = null,
} = {}) {
  return {
    id,
    name,
    maxHP,
    bossConfig,
    phases: [
      {
        id: "p1",
        label: "Gathering Roots",
        hpAbove: 0.66,
        telegraphs: ["radial-pulse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Roots coil around the arena.");
          ctx.vfx.spawnRing({
            position: ctx.bossPosition,
            innerRadius: 0.62,
            outerRadius: 1.34,
            color: "#c6ffd6",
            life: 0.7,
            opacity: 0.76,
            spread: 0.44,
          });
        },
        updatePhase: phaseOneUpdate,
      },
      {
        id: "p2",
        label: "Orb Bloom",
        hpAbove: 0.33,
        telegraphs: ["summon-minions", "orb-line"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The manifestation splits into hunting echoes.");
          ctx.vfx.spawnRing({
            position: ctx.bossPosition,
            innerRadius: 0.74,
            outerRadius: 1.42,
            color: "#c8ffd8",
            life: 0.66,
            opacity: 0.74,
            spread: 0.5,
          });
          ctx.scriptState.p2SummonTimer = 0.4;
          ctx.scriptState.p2LineTimer = 1.0;
        },
        updatePhase: phaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Crown Surge",
        hpAbove: 0.0,
        telegraphs: ["spike-arc", "rapid-pulse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The Crown surges through the roots!");
          ctx.vfx.spawnRing({
            position: ctx.bossPosition,
            innerRadius: 0.82,
            outerRadius: 1.88,
            color: "#ddffe8",
            life: 0.68,
            opacity: 0.78,
            spread: 0.82,
          });
        },
        updatePhase: phaseThreeUpdate,
      },
    ],
    onBossDamaged(ctx, amount) {
      const total = getOrCreateScriptState(ctx, "damageWindow", 0) + Math.max(0, amount);
      ctx.scriptState.damageWindow = total;
      if (total >= 36) {
        ctx.scriptState.damageWindow = 0;
        ctx.vfx.spawnRing({
          position: ctx.bossPosition,
          innerRadius: 0.4,
          outerRadius: 0.86,
          color: "#d4ffe3",
          life: 0.32,
          opacity: 0.78,
          spread: 0.6,
        });
      }
    },
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The Vein Guardian collapses into pale ash.");
      ctx.worldState.applyCrownCalm(0.06);
      ctx.worldState.applyStabilityBump(0.05, ctx.sceneId, ctx.regionName);
    },
  };
}

function harvesterPhaseOneUpdate(ctx, dtSeconds) {
  const beamTimer = getOrCreateScriptState(ctx, "harvesterBeamTimer", 1.4) - dtSeconds;
  ctx.scriptState.harvesterBeamTimer = beamTimer;
  if (beamTimer <= 0) {
    ctx.scriptState.harvesterBeamTimer = 2.85;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#ffd5ad",
      life: 0.56,
      width: 0.11,
    });
  }

  const suppressionTimer = getOrCreateScriptState(ctx, "harvesterSuppressionTimer", 2.1) - dtSeconds;
  ctx.scriptState.harvesterSuppressionTimer = suppressionTimer;
  if (suppressionTimer <= 0) {
    ctx.scriptState.harvesterSuppressionTimer = 4.4;
    ctx.bossEvents?.triggerSuppressionPulse?.(6);
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.64,
      outerRadius: 1.18,
      color: "#9de9d7",
      life: 0.6,
      opacity: 0.72,
      spread: 0.48,
    });
  }
}

function harvesterPhaseTwoUpdate(ctx, dtSeconds) {
  harvesterPhaseOneUpdate(ctx, dtSeconds);
  const summonTimer = getOrCreateScriptState(ctx, "harvesterDroneTimer", 2.6) - dtSeconds;
  ctx.scriptState.harvesterDroneTimer = summonTimer;
  if (summonTimer <= 0) {
    ctx.scriptState.harvesterDroneTimer = 8;
    const existingCount = ctx.combat.countAlive(ctx.scriptState.harvesterDroneIds ?? []);
    if (existingCount < 2) {
      ctx.bossEvents?.nudgeExtraction?.(0.06);
      const angle = ctx.rng.nextFloat() * Math.PI * 2;
      const defs = [0, Math.PI].map((phase, index) => ({
        id: `harvester-drone-${ctx.elapsedTag}-${index + 1}`,
        role: "construct",
        type: "standard",
        x: ctx.bossPosition.x + Math.cos(angle + phase) * 1.28,
        z: ctx.bossPosition.y + Math.sin(angle + phase) * 1.28,
        aggroRadius: 3.6,
        attackRange: 1.15,
        attackCooldown: 1.55,
        lingerTag: "boss-harvester-drone",
      }));
      const ids = ctx.combat.spawnMinions(defs);
      ctx.scriptState.harvesterDroneIds = [...(ctx.scriptState.harvesterDroneIds ?? []), ...ids];
    }
  }
}

function harvesterPhaseThreeUpdate(ctx, dtSeconds) {
  const beamTimer = getOrCreateScriptState(ctx, "harvesterBeamTimer", 0.8) - dtSeconds;
  ctx.scriptState.harvesterBeamTimer = beamTimer;
  if (beamTimer <= 0) {
    ctx.scriptState.harvesterBeamTimer = 1.9;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#ffd3a2",
      life: 0.46,
      width: 0.12,
    });
  }

  const ventTimer = getOrCreateScriptState(ctx, "harvesterVentTimer", 0.9) - dtSeconds;
  ctx.scriptState.harvesterVentTimer = ventTimer;
  if (ventTimer <= 0) {
    ctx.scriptState.harvesterVentTimer = 2.6;
    ctx.bossEvents?.nudgeExtraction?.(0.08);
    const baseAngle = ctx.rng.nextFloat() * Math.PI * 2;
    for (let i = 0; i < 3; i += 1) {
      const angle = baseAngle + i * ((Math.PI * 2) / 3);
      const point = new THREE.Vector2(
        ctx.bossPosition.x + Math.cos(angle) * 1.15,
        ctx.bossPosition.y + Math.sin(angle) * 1.15
      );
      ctx.vfx.spawnRing({
        position: point,
        innerRadius: 0.24,
        outerRadius: 0.44,
        color: "#ffb981",
        life: 0.55,
        opacity: 0.76,
        spread: 0.34,
      });
    }
  }
}

function createHarvesterWardenBoss() {
  return {
    id: "harvester_warden",
    name: "Harvester Warden",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 330),
    phases: [
      {
        id: "p1",
        label: "Cutting Lattice",
        hpAbove: 0.66,
        telegraphs: ["cutter-beam", "suppression-pulse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The Warden calibrates a cutting lattice.");
          ctx.scriptState.harvesterBeamTimer = 1.05;
          ctx.scriptState.harvesterSuppressionTimer = 2.1;
        },
        updatePhase: harvesterPhaseOneUpdate,
      },
      {
        id: "p2",
        label: "Extraction Surge",
        hpAbove: 0.33,
        telegraphs: ["drone-spawn", "suppression-pulse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Anchor nodes overheat as drones deploy.");
          ctx.scriptState.harvesterDroneTimer = 2.3;
        },
        updatePhase: harvesterPhaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Overclocked Vents",
        hpAbove: 0,
        telegraphs: ["rapid-cutter", "vent-eruption"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The rig overclocks. Break the anchors.");
          ctx.scriptState.harvesterBeamTimer = 0.72;
          ctx.scriptState.harvesterVentTimer = 0.84;
        },
        updatePhase: harvesterPhaseThreeUpdate,
      },
    ],
    onBossDamaged(ctx, amount) {
      const next = getOrCreateScriptState(ctx, "harvesterDamageWindow", 0) + Math.max(0, amount);
      ctx.scriptState.harvesterDamageWindow = next;
      if (next >= 40) {
        ctx.scriptState.harvesterDamageWindow = 0;
        ctx.vfx.spawnRing({
          position: ctx.bossPosition,
          innerRadius: 0.32,
          outerRadius: 0.74,
          color: "#e8ffc7",
          life: 0.28,
          opacity: 0.74,
          spread: 0.46,
        });
      }
    },
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The Warden stalls in a spray of sparks.");
    },
  };
}

function nullArchivistPhaseOneUpdate(ctx, dtSeconds) {
  const beamTimer = getOrCreateScriptState(ctx, "nullBeamTimer", 1.3) - dtSeconds;
  ctx.scriptState.nullBeamTimer = beamTimer;
  if (beamTimer <= 0) {
    ctx.scriptState.nullBeamTimer = 2.8;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#d5edff",
      life: 0.5,
      width: 0.1,
    });
  }

  const eraseTimer = getOrCreateScriptState(ctx, "erasePulseTimer", 4.8) - dtSeconds;
  ctx.scriptState.erasePulseTimer = eraseTimer;
  if (eraseTimer <= 0) {
    ctx.scriptState.erasePulseTimer = 7.5;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.82,
      outerRadius: 1.74,
      color: "#d8f0ff",
      life: 0.58,
      opacity: 0.74,
      spread: 0.78,
    });
    ctx.enqueueMessage("Erase Pulse gathers.");
  }
}

function nullArchivistPhaseTwoUpdate(ctx, dtSeconds) {
  nullArchivistPhaseOneUpdate(ctx, dtSeconds);
  const nodeTimer = getOrCreateScriptState(ctx, "echoNodePromptTimer", 2.2) - dtSeconds;
  ctx.scriptState.echoNodePromptTimer = nodeTimer;
  if (nodeTimer <= 0) {
    ctx.scriptState.echoNodePromptTimer = 7.8;
    ctx.enqueueMessage("Echo Nodes stabilize the wipe lattice.");
  }
}

function nullArchivistPhaseThreeUpdate(ctx, dtSeconds) {
  const fieldTimer = getOrCreateScriptState(ctx, "nullFieldTimer", 1.1) - dtSeconds;
  ctx.scriptState.nullFieldTimer = fieldTimer;
  if (fieldTimer <= 0) {
    ctx.scriptState.nullFieldTimer = 2.4;
    const angle = ctx.rng.nextFloat() * Math.PI * 2;
    const radius = 0.8 + ctx.rng.nextFloat() * 0.7;
    const point = new THREE.Vector2(
      ctx.bossPosition.x + Math.cos(angle) * radius,
      ctx.bossPosition.y + Math.sin(angle) * radius
    );
    ctx.vfx.spawnRing({
      position: point,
      innerRadius: 0.3,
      outerRadius: 0.62,
      color: "#bfd6ff",
      life: 0.62,
      opacity: 0.76,
      spread: 0.4,
    });
  }

  const collapseTimer = getOrCreateScriptState(ctx, "memoryCollapseTimer", 3.7) - dtSeconds;
  ctx.scriptState.memoryCollapseTimer = collapseTimer;
  if (collapseTimer <= 0) {
    ctx.scriptState.memoryCollapseTimer = 7.2;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 1.2,
      outerRadius: 2.18,
      color: "#e2f2ff",
      life: 0.7,
      opacity: 0.84,
      spread: 0.96,
    });
    ctx.enqueueMessage("Memory Collapse incoming.");
  }
}

function createNullArchivistBoss() {
  return {
    id: "null_archivist",
    name: "NULL ARCHIVIST",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 348),
    phases: [
      {
        id: "p1",
        label: "Erase Pulse",
        hpAbove: 0.66,
        telegraphs: ["null-beam", "erase-pulse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The Archivist indexes your names.");
          ctx.scriptState.nullBeamTimer = 1.1;
          ctx.scriptState.erasePulseTimer = 4.2;
        },
        updatePhase: nullArchivistPhaseOneUpdate,
      },
      {
        id: "p2",
        label: "Echo Lattice",
        hpAbove: 0.33,
        telegraphs: ["echo-nodes", "wipe-lattice"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Echo Nodes bloom around the arena.");
          ctx.scriptState.echoNodePromptTimer = 1.8;
        },
        updatePhase: nullArchivistPhaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Memory Collapse",
        hpAbove: 0,
        telegraphs: ["null-fields", "memory-collapse"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Null fields spread. Hold the attuned light.");
          ctx.scriptState.nullFieldTimer = 0.95;
          ctx.scriptState.memoryCollapseTimer = 3.2;
        },
        updatePhase: nullArchivistPhaseThreeUpdate,
      },
    ],
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The Archivist shatters into unkept histories.");
    },
  };
}

function spireGatewardenPhaseOneUpdate(ctx, dtSeconds) {
  const beamTimer = getOrCreateScriptState(ctx, "spireBeamTimer", 1.1) - dtSeconds;
  ctx.scriptState.spireBeamTimer = beamTimer;
  if (beamTimer <= 0) {
    ctx.scriptState.spireBeamTimer = 2.7;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#f8deb2",
      life: 0.48,
      width: 0.11,
    });
  }

  const droneTimer = getOrCreateScriptState(ctx, "spireDroneTimer", 3.2) - dtSeconds;
  ctx.scriptState.spireDroneTimer = droneTimer;
  if (droneTimer <= 0) {
    ctx.scriptState.spireDroneTimer = 7.2;
    const alive = ctx.combat.countAlive(ctx.scriptState.spireDroneIds ?? []);
    if (alive < 1) {
      const defs = [
        {
          id: `spire-gate-drone-${ctx.elapsedTag}`,
          role: "construct",
          type: "standard",
          x: ctx.bossPosition.x - 1.18,
          z: ctx.bossPosition.y + 0.36,
          aggroRadius: 3.9,
          attackRange: 1.02,
          attackCooldown: 1.38,
          maxHealth: 56,
          lingerTag: "spire-gatewarden-drone",
        },
      ];
      const ids = ctx.combat.spawnMinions(defs);
      ctx.scriptState.spireDroneIds = [...(ctx.scriptState.spireDroneIds ?? []), ...ids];
    }
  }
}

function spireGatewardenPhaseTwoUpdate(ctx, dtSeconds) {
  spireGatewardenPhaseOneUpdate(ctx, dtSeconds);
  const overloadTimer = getOrCreateScriptState(ctx, "spireOverloadTimer", 2.8) - dtSeconds;
  ctx.scriptState.spireOverloadTimer = overloadTimer;
  if (overloadTimer <= 0) {
    ctx.scriptState.spireOverloadTimer = 7.4;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.9,
      outerRadius: 2.1,
      color: "#ffc79d",
      life: 0.68,
      opacity: 0.84,
      spread: 0.95,
    });
    ctx.enqueueMessage("Conduit Overload gathers.");
  }
}

function spireGatewardenPhaseThreeUpdate(ctx, dtSeconds) {
  const beamTimer = getOrCreateScriptState(ctx, "spireBeamTimer", 0.95) - dtSeconds;
  ctx.scriptState.spireBeamTimer = beamTimer;
  if (beamTimer <= 0) {
    ctx.scriptState.spireBeamTimer = 2.05;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#ffd8b0",
      life: 0.44,
      width: 0.12,
    });
  }

  const clampTimer = getOrCreateScriptState(ctx, "spireClampTimer", 1.9) - dtSeconds;
  ctx.scriptState.spireClampTimer = clampTimer;
  if (clampTimer <= 0) {
    ctx.scriptState.spireClampTimer = 6;
    const angle = ctx.rng.nextFloat() * Math.PI * 2;
    const radius = 0.72 + ctx.rng.nextFloat() * 0.84;
    const point = new THREE.Vector2(
      ctx.bossPosition.x + Math.cos(angle) * radius,
      ctx.bossPosition.y + Math.sin(angle) * radius
    );
    ctx.vfx.spawnRing({
      position: point,
      innerRadius: 0.34,
      outerRadius: 0.76,
      color: "#9ec6ff",
      life: 0.72,
      opacity: 0.8,
      spread: 0.42,
    });
  }

  const overloadTimer = getOrCreateScriptState(ctx, "spireOverloadTimer", 2.2) - dtSeconds;
  ctx.scriptState.spireOverloadTimer = overloadTimer;
  if (overloadTimer <= 0) {
    ctx.scriptState.spireOverloadTimer = 6.6;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.96,
      outerRadius: 2.24,
      color: "#ffc28f",
      life: 0.72,
      opacity: 0.86,
      spread: 1.02,
    });
    ctx.enqueueMessage("Conduit Overload incoming.");
  }
}

function createSpireGatewardenBoss() {
  return {
    id: "spire_gatewarden",
    name: "SPIRE GATEWARDEN",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 388),
    phases: [
      {
        id: "p1",
        label: "Conduit Lances",
        hpAbove: 0.7,
        telegraphs: ["conduit-beam", "drone-summon"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The gatewarden marks intruders.");
          ctx.scriptState.spireBeamTimer = 1;
          ctx.scriptState.spireDroneTimer = 2.4;
        },
        updatePhase: spireGatewardenPhaseOneUpdate,
      },
      {
        id: "p2",
        label: "Conduit Overload",
        hpAbove: 0.35,
        telegraphs: ["overload-ring", "cover-check"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Overload rings shear the platform.");
          ctx.scriptState.spireOverloadTimer = 2;
        },
        updatePhase: spireGatewardenPhaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Null Clamp",
        hpAbove: 0,
        telegraphs: ["null-clamp-zones", "overload-ring"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Null clamps lock down healing channels.");
          ctx.scriptState.spireClampTimer = 1.5;
          ctx.scriptState.spireOverloadTimer = 1.9;
        },
        updatePhase: spireGatewardenPhaseThreeUpdate,
      },
    ],
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The gatewarden collapses and the gate unlocks.");
    },
  };
}

function loomProctorPhaseOneUpdate(ctx, dtSeconds) {
  const cutTimer = getOrCreateScriptState(ctx, "loomCutTimer", 1.25) - dtSeconds;
  ctx.scriptState.loomCutTimer = cutTimer;
  if (cutTimer <= 0) {
    ctx.scriptState.loomCutTimer = 2.55;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#d7e5ff",
      life: 0.52,
      width: 0.11,
    });
    const angle = ctx.rng.nextFloat() * Math.PI * 2;
    const radius = 0.72 + ctx.rng.nextFloat() * 0.82;
    const point = new THREE.Vector2(
      ctx.bossPosition.x + Math.cos(angle) * radius,
      ctx.bossPosition.y + Math.sin(angle) * radius
    );
    ctx.vfx.spawnRing({
      position: point,
      innerRadius: 0.22,
      outerRadius: 0.54,
      color: "#b9c8ff",
      life: 0.6,
      opacity: 0.74,
      spread: 0.42,
    });
  }
}

function loomProctorPhaseTwoUpdate(ctx, dtSeconds) {
  loomProctorPhaseOneUpdate(ctx, dtSeconds);
  const pillarTimer = getOrCreateScriptState(ctx, "loomPillarTimer", 2.2) - dtSeconds;
  ctx.scriptState.loomPillarTimer = pillarTimer;
  if (pillarTimer <= 0) {
    ctx.scriptState.loomPillarTimer = 7.1;
    ctx.enqueueMessage("Prism Pillars align the Loom shield.");
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.88,
      outerRadius: 1.82,
      color: "#d8e4ff",
      life: 0.68,
      opacity: 0.76,
      spread: 0.88,
    });
  }
}

function loomProctorPhaseThreeUpdate(ctx, dtSeconds) {
  const cutTimer = getOrCreateScriptState(ctx, "loomCutTimer", 1.0) - dtSeconds;
  ctx.scriptState.loomCutTimer = cutTimer;
  if (cutTimer <= 0) {
    ctx.scriptState.loomCutTimer = 2.15;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#d5ddff",
      life: 0.48,
      width: 0.12,
    });
  }

  const taxTimer = getOrCreateScriptState(ctx, "loomTaxTimer", 1.9) - dtSeconds;
  ctx.scriptState.loomTaxTimer = taxTimer;
  if (taxTimer <= 0) {
    ctx.scriptState.loomTaxTimer = 5.8;
    const angle = ctx.rng.nextFloat() * Math.PI * 2;
    const radius = 0.74 + ctx.rng.nextFloat() * 0.88;
    const point = new THREE.Vector2(
      ctx.bossPosition.x + Math.cos(angle) * radius,
      ctx.bossPosition.y + Math.sin(angle) * radius
    );
    ctx.vfx.spawnRing({
      position: point,
      innerRadius: 0.3,
      outerRadius: 0.74,
      color: "#bfb8ff",
      life: 0.74,
      opacity: 0.8,
      spread: 0.48,
    });
  }
}

function createLoomProctorBoss() {
  return {
    id: "loom_proctor",
    name: "THE LOOM PROCTOR",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 412),
    phases: [
      {
        id: "p1",
        label: "Weave Cut",
        hpAbove: 0.7,
        telegraphs: ["weave-cut", "memory-fissure"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The Loom Proctor threads a killing line.");
          ctx.scriptState.loomCutTimer = 0.92;
        },
        updatePhase: loomProctorPhaseOneUpdate,
      },
      {
        id: "p2",
        label: "Prism Lock",
        hpAbove: 0.35,
        telegraphs: ["prism-pillars", "loom-shield"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Prism Pillars refract the strike path.");
          ctx.scriptState.loomPillarTimer = 1.8;
        },
        updatePhase: loomProctorPhaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Memory Tax",
        hpAbove: 0,
        telegraphs: ["memory-tax", "weave-cut"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Memory Tax begins. Healing channels thin.");
          ctx.scriptState.loomTaxTimer = 1.4;
        },
        updatePhase: loomProctorPhaseThreeUpdate,
      },
    ],
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The Proctor unweaves and the Loom opens its archive.");
    },
  };
}

function narratorCrownPhaseOneUpdate(ctx, dtSeconds) {
  const lineTimer = getOrCreateScriptState(ctx, "narratorLineTimer", 1.2) - dtSeconds;
  ctx.scriptState.narratorLineTimer = lineTimer;
  if (lineTimer <= 0) {
    ctx.scriptState.narratorLineTimer = 2.7;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#dfd8ff",
      life: 0.52,
      width: 0.12,
    });
  }

  const addTimer = getOrCreateScriptState(ctx, "narratorAddTimer", 3.4) - dtSeconds;
  ctx.scriptState.narratorAddTimer = addTimer;
  if (addTimer <= 0) {
    ctx.scriptState.narratorAddTimer = 8.4;
    const alive = ctx.combat.countAlive(ctx.scriptState.narratorAdds ?? []);
    if (alive < 1) {
      const ids = ctx.combat.spawnMinions([
        {
          id: `narrator-echo-add-${ctx.elapsedTag}`,
          role: "skirmisher",
          type: "echo_knight",
          x: ctx.bossPosition.x - 1.02,
          z: ctx.bossPosition.y + 0.38,
          maxHealth: 52,
          aggroRadius: 4,
          attackRange: 0.74,
          attackCooldown: 1.06,
          lingerTag: "narrator-echo-add",
        },
      ]);
      ctx.scriptState.narratorAdds = [...(ctx.scriptState.narratorAdds ?? []), ...ids];
    }
  }
}

function narratorCrownPhaseTwoUpdate(ctx, dtSeconds) {
  narratorCrownPhaseOneUpdate(ctx, dtSeconds);
  const shockTimer = getOrCreateScriptState(ctx, "narratorShockTimer", 2.3) - dtSeconds;
  ctx.scriptState.narratorShockTimer = shockTimer;
  if (shockTimer <= 0) {
    ctx.scriptState.narratorShockTimer = 7.1;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 0.88,
      outerRadius: 2.22,
      color: "#c9b7ff",
      life: 0.72,
      opacity: 0.84,
      spread: 1.02,
    });
    ctx.enqueueMessage("Rift Shockwave gathers.");
  }
}

function narratorCrownPhaseThreeUpdate(ctx, dtSeconds) {
  const lineTimer = getOrCreateScriptState(ctx, "narratorLineTimer", 0.86) - dtSeconds;
  ctx.scriptState.narratorLineTimer = lineTimer;
  if (lineTimer <= 0) {
    ctx.scriptState.narratorLineTimer = 2.05;
    ctx.vfx.spawnTelegraphLine({
      from: ctx.bossPosition,
      to: ctx.player.arthur,
      color: "#e2dbff",
      life: 0.46,
      width: 0.13,
    });
  }

  const shockTimer = getOrCreateScriptState(ctx, "narratorShockTimer", 1.6) - dtSeconds;
  ctx.scriptState.narratorShockTimer = shockTimer;
  if (shockTimer <= 0) {
    ctx.scriptState.narratorShockTimer = 5.8;
    ctx.vfx.spawnRing({
      position: ctx.bossPosition,
      innerRadius: 1.06,
      outerRadius: 2.4,
      color: "#d2c1ff",
      life: 0.74,
      opacity: 0.88,
      spread: 1.08,
    });
    ctx.enqueueMessage("Rewrite Mark spreads.");
  }
}

function createNarratorCrownBoss() {
  return {
    id: "narrator_crown",
    name: "NARRATOR CROWN",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 460),
    phases: [
      {
        id: "p1",
        label: "Narration Lines",
        hpAbove: 0.7,
        telegraphs: ["line-slice", "echo-add"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The Crown begins dictating your ending.");
          ctx.scriptState.narratorLineTimer = 0.92;
          ctx.scriptState.narratorAddTimer = 2.8;
        },
        updatePhase: narratorCrownPhaseOneUpdate,
      },
      {
        id: "p2",
        label: "Rift Shockwave",
        hpAbove: 0.35,
        telegraphs: ["shockwave-ring", "prism-cover"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("Shockwaves cut the arena. Mind the ring.");
          ctx.scriptState.narratorShockTimer = 1.8;
        },
        updatePhase: narratorCrownPhaseTwoUpdate,
      },
      {
        id: "p3",
        label: "Rewrite Mark",
        hpAbove: 0,
        telegraphs: ["rewrite-mark", "rapid-line-slice"],
        onEnterPhase(ctx) {
          ctx.enqueueMessage("The script tightens. Hold your names.");
          ctx.scriptState.narratorLineTimer = 0.8;
          ctx.scriptState.narratorShockTimer = 1.5;
        },
        updatePhase: narratorCrownPhaseThreeUpdate,
      },
    ],
    onBossDefeated(ctx) {
      ctx.enqueueMessage("The Narrator Crown fractures into unbound voices.");
    },
  };
}

export const BOSSES = Object.freeze({
  crown_manifestation: createVeinGuardianBoss({
    id: "crown_manifestation",
    name: "Vein Guardian",
    bossConfig: {
      onBattleStartActionId: "stone_master_start",
      phaseTriggers: [
        { condition: "hpBelowPercent", value: 0.66, actionId: "shade_archivist_start" },
        { condition: "hpBelowPercent", value: 0.4, actionId: "final_boss_surge" },
      ],
      specialBehaviorId: "adaptive_boss_cadence",
    },
  }),
  harvester_warden: createHarvesterWardenBoss(),
  null_archivist: createNullArchivistBoss(),
  spire_gatewarden: createSpireGatewardenBoss(),
  loom_proctor: createLoomProctorBoss(),
  narrator_crown: createNarratorCrownBoss(),
  trial3_stone_master: createVeinGuardianBoss({
    id: "trial3_stone_master",
    name: "Stone Master",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 260),
    bossConfig: {
      onBattleStartActionId: "stone_master_start",
      phaseTriggers: [],
      specialBehaviorId: "",
    },
  }),
  trial5_shade_archivist: createVeinGuardianBoss({
    id: "trial5_shade_archivist",
    name: "Shade Archivist",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 300),
    bossConfig: {
      onBattleStartActionId: "shade_archivist_start",
      phaseTriggers: [],
      specialBehaviorId: "",
    },
  }),
  trial7_volt_twins: createVeinGuardianBoss({
    id: "trial7_volt_twins",
    name: "Volt Twins",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 320),
    bossConfig: {
      onBattleStartActionId: "stone_master_start",
      phaseTriggers: [{ condition: "timerSeconds", value: 2, actionId: "volt_twins_shift" }],
      specialBehaviorId: "adaptive_boss_cadence",
    },
  }),
  final_crown_boss: createVeinGuardianBoss({
    id: "final_crown_boss",
    name: "Crown Manifest",
    maxHP: Math.max(VEIN_GUARDIAN_MAX_HP, 360),
    bossConfig: {
      onBattleStartActionId: "shade_archivist_start",
      phaseTriggers: [{ condition: "hpBelowPercent", value: 0.4, actionId: "final_boss_surge" }],
      specialBehaviorId: "adaptive_boss_cadence",
    },
  }),
});
