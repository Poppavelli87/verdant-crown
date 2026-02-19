const THORNMERE_SCENE_ID = "thornmere";

export const VAELORIS_PATROL_FLAGS = Object.freeze({
  CLEARED_ONCE: "vaeloris_patrol_cleared_once",
  TAG_OBTAINED: "vaeloris_tag_obtained",
});

export const VAELORIS_PATROL_ZONE = Object.freeze({
  centerX: 6.88,
  centerY: 2.48,
  halfWidth: 1.12,
  halfHeight: 0.96,
});

const STAGE_CONFIG = Object.freeze({
  1: Object.freeze({
    respawnSeconds: 90,
    units: Object.freeze([
      Object.freeze({
        role: "construct",
        x: 6.42,
        y: 2.26,
        maxHealth: 60,
        attackCooldown: 1.68,
      }),
      Object.freeze({
        role: "harrier",
        x: 7.18,
        y: 2.68,
        maxHealth: 42,
        attackCooldown: 1.92,
      }),
    ]),
  }),
  2: Object.freeze({
    respawnSeconds: 72,
    units: Object.freeze([
      Object.freeze({
        role: "construct",
        x: 6.38,
        y: 2.16,
        maxHealth: 62,
        attackCooldown: 1.62,
      }),
      Object.freeze({
        role: "construct",
        x: 7.26,
        y: 2.14,
        maxHealth: 62,
        attackCooldown: 1.62,
      }),
      Object.freeze({
        role: "harrier",
        x: 6.86,
        y: 2.92,
        maxHealth: 44,
        attackCooldown: 1.82,
      }),
    ]),
  }),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeChoice(choice) {
  const normalized = String(choice ?? "").trim().toLowerCase();
  if (normalized === "salvage" || normalized === "shatter") return normalized;
  return "";
}

function normalizePressureStage(raw, choice = "") {
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return clamp(Math.floor(numeric), 1, 2);
  }
  return normalizeChoice(choice) === "salvage" ? 2 : 1;
}

function isInsidePatrolZone(playerPosition) {
  const px = Number(playerPosition?.x);
  const py = Number(playerPosition?.z ?? playerPosition?.y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return false;
  return (
    Math.abs(px - VAELORIS_PATROL_ZONE.centerX) <= VAELORIS_PATROL_ZONE.halfWidth &&
    Math.abs(py - VAELORIS_PATROL_ZONE.centerY) <= VAELORIS_PATROL_ZONE.halfHeight
  );
}

function buildSpawnDefinitions(stage, serial) {
  const bucket = stage >= 2 ? 2 : 1;
  const config = STAGE_CONFIG[bucket];
  return config.units.map((unit, index) => ({
    id: `vaeloris-patrol-${serial}-${index + 1}`,
    role: unit.role,
    type: unit.role === "harrier" ? "ambush" : "standard",
    x: unit.x,
    z: unit.y,
    maxHealth: unit.maxHealth,
    aggroRadius: 4.2,
    attackRange: unit.role === "construct" ? 1.08 : 0.72,
    attackCooldown: unit.attackCooldown,
    lingerTag: "vaeloris-patrol",
  }));
}

export class VaelorisPressureSystem {
  constructor() {
    this.pressureStage = 1;
    this.harvesterChoice = "";
    this.patrolEnemyIds = [];
    this.cooldownRemaining = 0;
    this.wasInsideZone = false;
    this.patrolSerial = 1;
    this.patrolClearedOnce = false;
    this.tagObtained = false;
  }

  syncStoryState({ pressureStage = 1, harvesterChoice = "", patrolClearedOnce = false, tagObtained = false } = {}) {
    this.harvesterChoice = normalizeChoice(harvesterChoice);
    this.pressureStage = normalizePressureStage(pressureStage, this.harvesterChoice);
    this.patrolClearedOnce = Boolean(patrolClearedOnce);
    this.tagObtained = Boolean(tagObtained);
    return this.getDebugState();
  }

  getPressureStage() {
    return this.pressureStage;
  }

  spawnPatrol(combatSystem, { force = false } = {}) {
    if (!combatSystem?.spawnEnemies) {
      return { spawned: false, enemyIds: [] };
    }
    if (!force && this.patrolEnemyIds.length > 0) {
      return { spawned: false, enemyIds: [] };
    }
    if (!force && this.cooldownRemaining > 0) {
      return { spawned: false, enemyIds: [] };
    }

    const definitions = buildSpawnDefinitions(this.pressureStage, this.patrolSerial);
    this.patrolSerial += 1;
    this.patrolEnemyIds = combatSystem.spawnEnemies(definitions) ?? [];
    return {
      spawned: this.patrolEnemyIds.length > 0,
      enemyIds: [...this.patrolEnemyIds],
      stage: this.pressureStage,
    };
  }

  update(
    dtSeconds,
    {
      sceneId = "",
      playerPosition = null,
      allowSpawn = true,
      combatSystem = null,
      pressureStage = 1,
      harvesterChoice = "",
      patrolClearedOnce = false,
      tagObtained = false,
    } = {}
  ) {
    const dt = Math.max(0, Number(dtSeconds) || 0);
    this.syncStoryState({
      pressureStage,
      harvesterChoice,
      patrolClearedOnce,
      tagObtained,
    });
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);

    const activeBefore = this.patrolEnemyIds.length > 0;
    if (activeBefore && combatSystem?.countAliveEnemiesByIds) {
      const aliveCount = combatSystem.countAliveEnemiesByIds(this.patrolEnemyIds);
      if (aliveCount <= 0) {
        this.patrolEnemyIds = [];
        this.cooldownRemaining = STAGE_CONFIG[this.pressureStage >= 2 ? 2 : 1].respawnSeconds;
      }
    }

    const sceneAllowsPatrol = sceneId === THORNMERE_SCENE_ID;
    if (!sceneAllowsPatrol) {
      this.wasInsideZone = false;
      return {
        stage: this.pressureStage,
        zone: VAELORIS_PATROL_ZONE,
        active: this.patrolEnemyIds.length > 0,
        spawned: false,
        firstCleared: false,
        tagAwarded: false,
        cooldownRemaining: this.cooldownRemaining,
      };
    }

    const insideZone = isInsidePatrolZone(playerPosition);
    const justEnteredZone = insideZone && !this.wasInsideZone;
    this.wasInsideZone = insideZone;

    const spawnedInfo =
      allowSpawn && justEnteredZone
        ? this.spawnPatrol(combatSystem, { force: false })
        : { spawned: false, enemyIds: [] };

    let firstCleared = false;
    let tagAwarded = false;
    if (activeBefore && this.patrolEnemyIds.length === 0) {
      if (!this.patrolClearedOnce) {
        this.patrolClearedOnce = true;
        firstCleared = true;
      }
      if (!this.tagObtained) {
        this.tagObtained = true;
        tagAwarded = true;
      }
    }

    return {
      stage: this.pressureStage,
      zone: VAELORIS_PATROL_ZONE,
      active: this.patrolEnemyIds.length > 0,
      spawned: Boolean(spawnedInfo.spawned),
      firstCleared,
      tagAwarded,
      cooldownRemaining: this.cooldownRemaining,
      enemyIds: [...this.patrolEnemyIds],
      insideZone,
    };
  }

  getDebugState() {
    return {
      stage: this.pressureStage,
      choice: this.harvesterChoice,
      active: this.patrolEnemyIds.length > 0,
      enemyIds: [...this.patrolEnemyIds],
      cooldownRemaining: Number(this.cooldownRemaining.toFixed(3)),
      zone: VAELORIS_PATROL_ZONE,
      patrolClearedOnce: this.patrolClearedOnce,
      tagObtained: this.tagObtained,
    };
  }
}
