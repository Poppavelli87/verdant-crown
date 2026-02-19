import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VeinGuardian } from "../combat/veinGuardian.js";
import { BOSSES } from "./bossRegistry.js";
import { BOSS_BEHAVIORS } from "../data/bossBehaviors.js";

const DEFAULT_RESET_COOLDOWN_SECONDS = 5;
const ESCAPE_RESET_SECONDS = 0.75;
const BARRIER_COLLISION_PADDING = 0.08;
const HARVESTER_BOSS_ID = "harvester_warden";
const NULL_ARCHIVIST_BOSS_ID = "null_archivist";
const LOOM_PROCTOR_BOSS_ID = "loom_proctor";
const NARRATOR_CROWN_BOSS_ID = "narrator_crown";
const HARVESTER_ANCHOR_MAX_HP = 58;
const HARVESTER_ANCHOR_HIT_RADIUS = 0.68;
const HARVESTER_ANCHOR_LIGHT_DAMAGE = 16;
const HARVESTER_ANCHOR_HEAVY_DAMAGE = 28;
const HARVESTER_EXTRACTION_PHASE_FILL = Object.freeze({
  p1: 0.072,
  p2: 0.102,
  p3: 0.132,
});
const HARVESTER_EXTRACTION_SURGE_DAMAGE = 11;
const HARVESTER_EXTRACTION_DROP_ON_BREAK = 0.4;
const HARVESTER_EXTRACTION_SLOW_SECONDS = 4;
const HARVESTER_EXTRACTION_SLOW_MULTIPLIER = 0.52;
const HARVESTER_ANCHOR_REPAIR_SECONDS = 3.6;
const HARVESTER_SUPPRESSION_SECONDS = 6;
const HARVESTER_SUPPRESSION_COOLDOWN_SECONDS = 0.9;
const HARVESTER_PARTY_IDS = Object.freeze(["arthur", "elaine", "willow"]);

function hashToSeed(input) {
  const text = String(input ?? "boss");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seedInput) {
  let state = hashToSeed(seedInput) || 0x6d2b79f5;
  const nextFloat = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    nextFloat,
    nextInt(max) {
      const safeMax = Math.max(1, Math.floor(Number(max) || 1));
      return Math.floor(nextFloat() * safeMax);
    },
  };
}

function normalizeBounds(arenaBounds) {
  const center = arenaBounds?.center ?? { x: 0, y: 0 };
  const radius = Math.max(0.8, Number(arenaBounds?.radius) || 2);
  const anchorPositions = Array.isArray(arenaBounds?.anchorPositions)
    ? arenaBounds.anchorPositions
        .map((entry) => ({
          x: Number(entry?.x),
          y: Number(entry?.y ?? entry?.z),
        }))
        .filter((entry) => Number.isFinite(entry.x) && Number.isFinite(entry.y))
    : [];
  return {
    type: "circle",
    center: new THREE.Vector2(Number(center.x) || 0, Number(center.y) || 0),
    radius,
    trigger: {
      center: new THREE.Vector2(
        Number(arenaBounds?.trigger?.center?.x ?? center.x) || 0,
        Number(arenaBounds?.trigger?.center?.y ?? center.y) || 0
      ),
      radius: Math.max(0.3, Number(arenaBounds?.trigger?.radius) || 1.2),
    },
    resetCooldownSeconds: Math.max(
      0.5,
      Number(arenaBounds?.resetCooldownSeconds) || DEFAULT_RESET_COOLDOWN_SECONDS
    ),
    anchorPositions,
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export class BossInstance {
  constructor({
    threeScene,
    combatSystem,
    damageSystem,
    vfxSystem,
    audioBus,
    worldState,
    saveState,
    getPartyMembers = () => [],
    getPlayerPosition = () => new THREE.Vector2(0, 0),
    getRegionName = () => "Unknown Region",
    setStoryFlag = () => {},
    setTransientMessage = () => {},
    grantRelicShards = () => {},
    onBossOutcome = () => {},
    onRespawnPlayer = () => {},
    applyStatusEffect = () => false,
    initialSeed = 1337,
  }) {
    this.threeScene = threeScene;
    this.combatSystem = combatSystem;
    this.damageSystem = damageSystem;
    this.vfxSystem = vfxSystem;
    this.audioBus = audioBus;
    this.worldState = worldState;
    this.saveState = saveState;
    this.getPartyMembers = getPartyMembers;
    this.getPlayerPosition = getPlayerPosition;
    this.getRegionName = getRegionName;
    this.setStoryFlag = setStoryFlag;
    this.setTransientMessage = setTransientMessage;
    this.grantRelicShards = grantRelicShards;
    this.onBossOutcome = onBossOutcome;
    this.onRespawnPlayer = onRespawnPlayer;
    this.applyStatusEffect = typeof applyStatusEffect === "function" ? applyStatusEffect : () => false;
    this.seedBase = Number(initialSeed) || 1337;

    this.root = new THREE.Group();
    this.root.name = "boss-instance-root";
    this.threeScene.add(this.root);

    this.barrierRoot = new THREE.Group();
    this.barrierRoot.name = "boss-barrier-root";
    this.root.add(this.barrierRoot);

    this.telegraphRoot = new THREE.Group();
    this.telegraphRoot.name = "boss-telegraph-root";
    this.root.add(this.telegraphRoot);

    this.objectiveRoot = new THREE.Group();
    this.objectiveRoot.name = "boss-objective-root";
    this.root.add(this.objectiveRoot);

    this.barrierSegments = [];
    this.telegraphLines = [];

    this.active = false;
    this.bossId = "";
    this.sceneId = "";
    this.bossDefinition = null;
    this.bossEntity = null;
    this.arenaBounds = normalizeBounds(null);
    this.lockedExits = false;
    this.resetCooldownRemaining = 0;
    this.elapsedSeconds = 0;
    this.phaseId = "";
    this.phaseLabel = "";
    this.phaseIndex = -1;
    this.finalPhaseMusicTriggered = false;
    this.escapeOutsideSeconds = 0;
    this.lastKnownHp = 0;
    this.playerCorrection = null;
    this.lastState = this._createIdleState();
    this.pendingMusicReturn = null;
    this.pendingMusicReturnSeconds = 0;
    this.scriptState = {};
    this.summonedEnemyIds = new Set();
    this.rng = createSeededRng(this.seedBase);
    this.triggeredActions = new Set();
    this.pendingDamageTemp = [];
    this.harvesterObjective = this._createHarvesterObjectiveState();
    this.battleState = {
      damageModifier: 1,
      incomingDamageModifier: 1,
      outgoingDamageModifier: 1,
      firstHitReduced: false,
      firstHitConsumed: false,
      statuses: {
        boss: null,
        player: null,
      },
    };
  }

  _createIdleState() {
    return {
      active: false,
      defeated: false,
      justDefeated: false,
      bossId: "",
      bossName: "",
      sceneId: "",
      hp: 0,
      maxHP: 0,
      hpRatio: 0,
      phaseId: "",
      phaseLabel: "",
      lockActive: false,
      lockCollided: false,
      correctedPlayerPosition: null,
      musicTrack: this.audioBus?.currentMusic ?? "",
      musicTransition: this.audioBus?.getDebugState?.()?.transition ?? null,
      telegraphCount: 0,
      guardian: null,
      objective: null,
      battleState: null,
    };
  }

  _createHarvesterObjectiveState() {
    return {
      extraction: 0,
      slowRemaining: 0,
      suppressionCooldown: 0,
      surgeCount: 0,
      anchors: [],
      anchorRepairRemaining: 0,
      phaseRespawnsUsed: {
        p1: 0,
        p2: 0,
        p3: 0,
      },
      phaseEntered: "",
    };
  }

  _isHarvesterBoss() {
    return this.bossId === HARVESTER_BOSS_ID;
  }

  _isNullArchivistBoss() {
    return this.bossId === NULL_ARCHIVIST_BOSS_ID;
  }

  _isLoomProctorBoss() {
    return this.bossId === LOOM_PROCTOR_BOSS_ID;
  }

  _isNarratorCrownBoss() {
    return this.bossId === NARRATOR_CROWN_BOSS_ID;
  }

  isActive() {
    return this.active;
  }

  isOnCooldown() {
    return this.resetCooldownRemaining > 0;
  }

  canTriggerAtPoint(sceneId, point) {
    if (this.active || this.isOnCooldown()) return false;
    if (!point || !this.arenaBounds?.trigger) return false;
    if (String(sceneId ?? "") !== String(this.sceneId || sceneId || "")) {
      // scene check handled by caller, this method only checks trigger geometry.
    }
    const trigger = this.arenaBounds.trigger;
    const distance = Math.hypot(point.x - trigger.center.x, point.y - trigger.center.y);
    return distance <= trigger.radius;
  }

  enterBossArena(bossId, sceneId, arenaBounds = null) {
    const normalizedBossId = String(bossId ?? "").trim();
    const definition = BOSSES[normalizedBossId];
    if (!definition) return false;
    if (this.active && this.bossId === normalizedBossId) return true;
    if (this.active || this.resetCooldownRemaining > 0) return false;

    this.bossId = normalizedBossId;
    this.sceneId = String(sceneId ?? "").trim() || "unknown";
    this.bossDefinition = definition;
    this.arenaBounds = normalizeBounds(arenaBounds);
    this.elapsedSeconds = 0;
    this.phaseId = "";
    this.phaseLabel = "";
    this.phaseIndex = -1;
    this.finalPhaseMusicTriggered = false;
    this.escapeOutsideSeconds = 0;
    this.playerCorrection = null;
    this.scriptState = {};
    this.summonedEnemyIds.clear();
    this.rng = createSeededRng(`${this.seedBase}:${this.sceneId}:${this.bossId}`);
    this.triggeredActions.clear();
    this.pendingDamageTemp.length = 0;
    this.battleState = {
      damageModifier: 1,
      incomingDamageModifier: 1,
      outgoingDamageModifier: 1,
      firstHitReduced: false,
      firstHitConsumed: false,
      statuses: {
        boss: null,
        player: null,
      },
    };

    const spawned = this.spawnBossEntity(normalizedBossId);
    if (!spawned) {
      this.bossId = "";
      this.sceneId = "";
      this.bossDefinition = null;
      this.harvesterObjective = this._createHarvesterObjectiveState();
      return false;
    }

    this.lockExits();
    this.active = true;
    if (this._isHarvesterBoss()) {
      this.setStoryFlag("vein_guardian_active", false);
      this.setStoryFlag("vaeloris_harvester_active", true);
      this.setStoryFlag("chapter9_null_archivist_active", false);
      this.setStoryFlag("endgame_loom_proctor_active", false);
      this.setStoryFlag("endgame_narrator_crown_active", false);
      this.harvesterObjective = this._createHarvesterObjectiveState();
      this._spawnHarvesterAnchors();
      this.setTransientMessage("The Harvester Warden engages.", 1.5);
    } else if (this._isNullArchivistBoss()) {
      this.setStoryFlag("vein_guardian_active", false);
      this.setStoryFlag("vaeloris_harvester_active", false);
      this.setStoryFlag("chapter9_null_archivist_active", true);
      this.setStoryFlag("endgame_loom_proctor_active", false);
      this.setStoryFlag("endgame_narrator_crown_active", false);
      this.setTransientMessage("NULL ARCHIVIST seals the vault arena.", 1.5);
    } else if (this._isLoomProctorBoss()) {
      this.setStoryFlag("vein_guardian_active", false);
      this.setStoryFlag("vaeloris_harvester_active", false);
      this.setStoryFlag("chapter9_null_archivist_active", false);
      this.setStoryFlag("endgame_spire_gatewarden_active", false);
      this.setStoryFlag("endgame_loom_proctor_active", true);
      this.setStoryFlag("endgame_narrator_crown_active", false);
      this.setTransientMessage("THE LOOM PROCTOR locks the weave.", 1.5);
    } else if (this._isNarratorCrownBoss()) {
      this.setStoryFlag("vein_guardian_active", false);
      this.setStoryFlag("vaeloris_harvester_active", false);
      this.setStoryFlag("chapter9_null_archivist_active", false);
      this.setStoryFlag("endgame_loom_proctor_active", false);
      this.setStoryFlag("endgame_narrator_crown_active", true);
      this.setTransientMessage("NARRATOR CROWN seals the final arena.", 1.5);
    } else {
      this.setStoryFlag("vaeloris_harvester_active", false);
      this.setStoryFlag("chapter9_null_archivist_active", false);
      this.setStoryFlag("endgame_loom_proctor_active", false);
      this.setStoryFlag("endgame_narrator_crown_active", false);
      this.setStoryFlag("vein_guardian_active", true);
      this.setTransientMessage("The Vein Guardian manifests.", 1.5);
    }

    if (typeof this.audioBus?.crossfadeTo === "function") {
      this.audioBus.crossfadeTo("battle_boss", 460);
    } else {
      this.audioBus?.playTrack?.("battle_boss");
    }

    this._runAction(this.bossDefinition?.bossConfig?.onBattleStartActionId, null);

    return true;
  }

  spawnBossEntity(bossId) {
    if (!this.bossDefinition || bossId !== this.bossDefinition.id) {
      return false;
    }

    this.cleanupBossEntity();
    const harvester = this._isHarvesterBoss();
    const archivist = this._isNullArchivistBoss();
    const loomProctor = this._isLoomProctorBoss();
    const narratorCrown = this._isNarratorCrownBoss();
    this.bossEntity = new VeinGuardian({
      threeScene: this.threeScene,
      damageSystem: this.damageSystem,
      vfxSystem: this.vfxSystem,
      spriteAssetPath: harvester
        ? "./assets/sprites/enemies/harvester_warden.png"
        : archivist
          ? "./assets/sprites/enemies/null_archivist.png"
          : loomProctor
            ? "./assets/sprites/enemies/loom_proctor.png"
            : narratorCrown
              ? "./assets/sprites/enemies/narrator_crown.png"
              : "./assets/sprites/enemies/guardian_manifestation.png",
      spriteTint: harvester
        ? "#d5e3ee"
        : archivist
          ? "#cfe2ff"
          : loomProctor
            ? "#d8deff"
            : narratorCrown
              ? "#f0e8ff"
              : "#d9fbe1",
      glowColor: harvester
        ? "#8be6ff"
        : archivist
          ? "#a6ccff"
          : loomProctor
            ? "#aeb4ff"
            : narratorCrown
              ? "#d9bfff"
              : "#8bf4ae",
      shadowOpacity: harvester || archivist || loomProctor || narratorCrown ? 0.24 : 0.2,
    });
    this.bossEntity.setMaxHP?.(this.bossDefinition.maxHP, { preserveRatio: false });
    this.bossEntity.spawn({
      x: this.arenaBounds.center.x,
      y: this.arenaBounds.center.y,
    });
    this.lastKnownHp = this.bossDefinition.maxHP;
    return true;
  }

  lockExits() {
    this._clearBarrierSegments();
    const segmentCount = 28;
    for (let i = 0; i < segmentCount; i += 1) {
      const angle = (i / segmentCount) * Math.PI * 2;
      const x = this.arenaBounds.center.x + Math.cos(angle) * this.arenaBounds.radius;
      const z = this.arenaBounds.center.y + Math.sin(angle) * this.arenaBounds.radius;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.11, 0.52, 5),
        new THREE.MeshBasicMaterial({
          color: "#9af4b1",
          transparent: true,
          opacity: 0.82,
          depthWrite: false,
        })
      );
      spike.position.set(x, -0.64, z);
      spike.rotation.y = -angle;
      spike.renderOrder = 1190;
      this.barrierRoot.add(spike);
      this.barrierSegments.push(spike);
    }
    this.lockedExits = true;
  }

  _getDefaultHarvesterAnchorPositions() {
    const radius = Math.max(1.2, this.arenaBounds.radius * 0.56);
    const center = this.arenaBounds.center;
    return [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => ({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    }));
  }

  _setAnchorVisual(anchor, beat = 0) {
    if (!anchor?.mesh || !anchor?.ring) return;
    const hpRatio = anchor.destroyed ? 0 : clamp01(anchor.hp / anchor.maxHP);
    const tint = anchor.destroyed ? "#5b646c" : hpRatio > 0.5 ? "#cfdce6" : "#ffcc97";
    anchor.mesh.material.color.set(tint);
    anchor.mesh.material.opacity = anchor.destroyed ? 0.36 : 0.92;
    anchor.mesh.scale.setScalar(anchor.destroyed ? 0.72 : 0.95 + beat * 0.08);

    anchor.ring.material.color.set(anchor.destroyed ? "#5b6165" : "#9df7d6");
    anchor.ring.material.opacity = anchor.destroyed ? 0.1 : 0.2 + beat * 0.14;
    anchor.ring.scale.setScalar(anchor.destroyed ? 0.8 : 0.96 + beat * 0.22);
  }

  _spawnHarvesterAnchors() {
    this._clearHarvesterAnchors();
    if (!this._isHarvesterBoss()) return;
    const sourcePositions =
      this.arenaBounds.anchorPositions.length >= 1
        ? this.arenaBounds.anchorPositions
        : this._getDefaultHarvesterAnchorPositions();
    this.harvesterObjective.anchors = sourcePositions.map((entry, index) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6),
        new THREE.MeshBasicMaterial({
          color: "#cfdce6",
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        })
      );
      mesh.position.set(entry.x, -0.64, entry.y);
      mesh.renderOrder = 1212;
      this.objectiveRoot.add(mesh);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.22, 0.32, 24),
        new THREE.MeshBasicMaterial({
          color: "#9df7d6",
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(entry.x, -0.884, entry.y);
      ring.renderOrder = 1208;
      this.objectiveRoot.add(ring);

      const anchor = {
        index,
        position: new THREE.Vector2(entry.x, entry.y),
        hp: HARVESTER_ANCHOR_MAX_HP,
        maxHP: HARVESTER_ANCHOR_MAX_HP,
        destroyed: false,
        mesh,
        ring,
      };
      this._setAnchorVisual(anchor, 0);
      return anchor;
    });
  }

  _clearHarvesterAnchors() {
    const anchors = Array.isArray(this.harvesterObjective?.anchors) ? this.harvesterObjective.anchors : [];
    for (const anchor of anchors) {
      if (anchor?.mesh) {
        this.objectiveRoot.remove(anchor.mesh);
        anchor.mesh.geometry?.dispose?.();
        anchor.mesh.material?.dispose?.();
      }
      if (anchor?.ring) {
        this.objectiveRoot.remove(anchor.ring);
        anchor.ring.geometry?.dispose?.();
        anchor.ring.material?.dispose?.();
      }
    }
    if (this.harvesterObjective) {
      this.harvesterObjective.anchors = [];
    }
  }

  _restoreHarvesterAnchors() {
    if (!this._isHarvesterBoss()) return false;
    if (!this.harvesterObjective.anchors.length) {
      this._spawnHarvesterAnchors();
      return true;
    }
    for (const anchor of this.harvesterObjective.anchors) {
      anchor.destroyed = false;
      anchor.hp = anchor.maxHP;
      this._setAnchorVisual(anchor, 0);
    }
    this.harvesterObjective.anchorRepairRemaining = 0;
    return true;
  }

  _getHarvesterPhaseId() {
    if (this.phaseId === "p1" || this.phaseId === "p2" || this.phaseId === "p3") {
      return this.phaseId;
    }
    return "p1";
  }

  _getHarvesterExtractionFillRate() {
    const phaseId = this._getHarvesterPhaseId();
    const baseRate = HARVESTER_EXTRACTION_PHASE_FILL[phaseId] ?? HARVESTER_EXTRACTION_PHASE_FILL.p1;
    const aliveAnchors = this.harvesterObjective.anchors.filter((anchor) => !anchor.destroyed).length;
    const anchorScalar = aliveAnchors <= 0 ? 0.15 : 0.9 + Math.min(0.42, (aliveAnchors - 1) * 0.2);
    const slowScalar = this.harvesterObjective.slowRemaining > 0 ? HARVESTER_EXTRACTION_SLOW_MULTIPLIER : 1;
    return Math.max(0, baseRate * anchorScalar * slowScalar);
  }

  _queueHarvesterAnchorRepairIfNeeded() {
    if (!this._isHarvesterBoss()) return;
    const allDestroyed =
      this.harvesterObjective.anchors.length > 0 &&
      this.harvesterObjective.anchors.every((anchor) => anchor.destroyed);
    if (!allDestroyed) {
      this.harvesterObjective.anchorRepairRemaining = 0;
      return;
    }
    const phaseId = this._getHarvesterPhaseId();
    const used = Number(this.harvesterObjective.phaseRespawnsUsed?.[phaseId] ?? 0);
    if (used >= 1) return;
    if (this.harvesterObjective.anchorRepairRemaining <= 0) {
      this.harvesterObjective.anchorRepairRemaining = HARVESTER_ANCHOR_REPAIR_SECONDS;
    }
  }

  _damageHarvesterAnchor(index, amount = 0) {
    if (!this._isHarvesterBoss()) return { damaged: false, destroyed: false };
    const anchor = this.harvesterObjective.anchors.find((entry) => entry.index === index);
    if (!anchor || anchor.destroyed) return { damaged: false, destroyed: false };
    const incoming = Math.max(0, Number(amount) || 0);
    if (incoming <= 0) return { damaged: false, destroyed: false };

    anchor.hp = Math.max(0, anchor.hp - incoming);
    const destroyed = anchor.hp <= 0;
    if (destroyed) {
      anchor.destroyed = true;
      this.harvesterObjective.extraction = Math.max(
        0,
        this.harvesterObjective.extraction - HARVESTER_EXTRACTION_DROP_ON_BREAK
      );
      this.harvesterObjective.slowRemaining = Math.max(
        this.harvesterObjective.slowRemaining,
        HARVESTER_EXTRACTION_SLOW_SECONDS
      );
      this._queueHarvesterAnchorRepairIfNeeded();
      this.vfxSystem?.spawnGroundRing?.({
        position: anchor.position,
        innerRadius: 0.24,
        outerRadius: 0.44,
        color: "#d5ffd8",
        life: 0.34,
        opacity: 0.82,
        spread: 0.42,
      });
      this.setTransientMessage("Anchor node ruptured.", 1.0);
    }
    this._setAnchorVisual(anchor, 0);
    return { damaged: true, destroyed };
  }

  _applySuppressionFieldPulse(durationSeconds = HARVESTER_SUPPRESSION_SECONDS) {
    if (!this._isHarvesterBoss()) return false;
    if (this.harvesterObjective.suppressionCooldown > 0) return false;
    this.harvesterObjective.suppressionCooldown = HARVESTER_SUPPRESSION_COOLDOWN_SECONDS;
    const partyMembers = this.getPartyMembers?.() ?? [];
    const known = new Set(["arthur"]);
    for (const member of partyMembers) {
      const normalized = String(member ?? "").trim().toLowerCase();
      if (normalized === "arthur" || normalized === "elaine" || normalized === "willow") {
        known.add(normalized);
      }
    }
    let applied = false;
    for (const targetId of HARVESTER_PARTY_IDS) {
      if (!known.has(targetId)) continue;
      applied =
        this.applyStatusEffect?.({
          targetId,
          effectId: "suppression_field",
          durationSeconds: Math.max(0.25, Number(durationSeconds) || HARVESTER_SUPPRESSION_SECONDS),
          sourceId: this.bossId,
        }) || applied;
    }
    this.vfxSystem?.spawnGroundRing?.({
      position: this.arenaBounds.center,
      innerRadius: 0.52,
      outerRadius: Math.max(1.04, this.arenaBounds.radius * 0.55),
      color: "#9de9d7",
      life: 0.42,
      opacity: 0.74,
      spread: 0.5,
    });
    if (applied) {
      this.setTransientMessage("Suppression field dampens healing.", 1.1);
    }
    return applied;
  }

  _triggerHarvesterExtractionSurge(onPlayerDamaged = null) {
    if (!this._isHarvesterBoss()) return;
    this.harvesterObjective.surgeCount += 1;
    this.vfxSystem?.spawnGroundRing?.({
      position: this.arenaBounds.center,
      innerRadius: 0.76,
      outerRadius: Math.max(1.8, this.arenaBounds.radius * 0.9),
      color: "#ffd2a1",
      life: 0.58,
      opacity: 0.76,
      spread: 0.86,
    });
    onPlayerDamaged?.(HARVESTER_EXTRACTION_SURGE_DAMAGE, {
      source: "harvester_surge",
      position: this.arenaBounds.center.clone(),
    });
    this._applySuppressionFieldPulse(3.8);
  }

  _updateHarvesterObjective(dtSeconds, onPlayerDamaged = null) {
    if (!this._isHarvesterBoss()) return;
    this.harvesterObjective.slowRemaining = Math.max(0, this.harvesterObjective.slowRemaining - dtSeconds);
    this.harvesterObjective.suppressionCooldown = Math.max(0, this.harvesterObjective.suppressionCooldown - dtSeconds);
    this.harvesterObjective.anchorRepairRemaining = Math.max(
      0,
      this.harvesterObjective.anchorRepairRemaining - dtSeconds
    );

    const phaseId = this._getHarvesterPhaseId();
    if (this.harvesterObjective.phaseEntered !== phaseId) {
      this.harvesterObjective.phaseEntered = phaseId;
      this._restoreHarvesterAnchors();
    }

    if (this.harvesterObjective.anchorRepairRemaining <= 0.001) {
      const allDestroyed =
        this.harvesterObjective.anchors.length > 0 &&
        this.harvesterObjective.anchors.every((anchor) => anchor.destroyed);
      if (allDestroyed) {
        const used = Number(this.harvesterObjective.phaseRespawnsUsed?.[phaseId] ?? 0);
        if (used < 1) {
          this.harvesterObjective.phaseRespawnsUsed[phaseId] = used + 1;
          this._restoreHarvesterAnchors();
          this.setTransientMessage("Anchor nodes reinitialize.", 1.0);
        }
      }
    }

    this.harvesterObjective.extraction = clamp01(
      this.harvesterObjective.extraction + this._getHarvesterExtractionFillRate() * dtSeconds
    );
    if (this.harvesterObjective.extraction >= 1) {
      this.harvesterObjective.extraction = 0;
      this._triggerHarvesterExtractionSurge(onPlayerDamaged);
    }

    const beat = 0.5 + Math.sin(this.elapsedSeconds * 3.2) * 0.5;
    for (const anchor of this.harvesterObjective.anchors) {
      this._setAnchorVisual(anchor, beat);
    }
  }

  _applyAttackEventsToHarvesterAnchors(attackEvents, playerPosition, options = {}) {
    const consumed = new Set();
    if (!this._isHarvesterBoss()) return consumed;
    if (!Array.isArray(attackEvents) || attackEvents.length === 0) return consumed;
    if (!playerPosition) return consumed;
    const aliveAnchors = this.harvesterObjective.anchors.filter((anchor) => !anchor.destroyed);
    if (aliveAnchors.length === 0) return consumed;

    const heavyDamageMultiplier = Math.max(0.1, Number(options.heavyDamageMultiplier) || 1);
    const attackMultiplier = Math.max(0.1, Number(options.attackMultiplier) || 1);
    const origin = new THREE.Vector2(Number(playerPosition.x) || 0, Number(playerPosition.z) || 0);

    for (let index = 0; index < attackEvents.length; index += 1) {
      const attack = attackEvents[index];
      const direction = attack?.direction?.clone?.() ?? new THREE.Vector2(0, 1);
      if (direction.lengthSq() <= 1e-6) {
        direction.set(0, 1);
      } else {
        direction.normalize();
      }
      const range = Math.max(0.45, Number(attack?.range) || 1.2);
      const minDot = Number(attack?.minDot);
      let bestAnchor = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const anchor of aliveAnchors) {
        if (anchor.destroyed) continue;
        const delta = new THREE.Vector2(anchor.position.x - origin.x, anchor.position.y - origin.y);
        const distance = delta.length();
        if (distance > range + HARVESTER_ANCHOR_HIT_RADIUS) continue;
        if (distance > 0.0001 && Number.isFinite(minDot)) {
          const dot = delta.normalize().dot(direction);
          if (dot < minDot) continue;
        }
        if (distance < bestDistance) {
          bestDistance = distance;
          bestAnchor = anchor;
        }
      }
      if (!bestAnchor) continue;
      const baseDamage =
        attack?.type === "charge"
          ? HARVESTER_ANCHOR_HEAVY_DAMAGE * heavyDamageMultiplier
          : HARVESTER_ANCHOR_LIGHT_DAMAGE;
      const damage = baseDamage * attackMultiplier;
      this._damageHarvesterAnchor(bestAnchor.index, damage);
      consumed.add(index);
    }

    return consumed;
  }

  getActiveEntity() {
    return this.bossEntity;
  }

  getTargetPoint() {
    return this.bossEntity?.getTargetPoint?.() ?? null;
  }

  pickAtWorldPoint(worldPoint, radius = 0.9) {
    return this.bossEntity?.pickAtWorldPoint?.(worldPoint, radius) ?? null;
  }

  applyPlayerAttackEvents(attackEvents, playerPosition, options = {}) {
    if (!this.active || !this.bossEntity) {
      return { consumedIndexes: [], damageDealt: 0 };
    }
    const anchorConsumed = this._applyAttackEventsToHarvesterAnchors(attackEvents, playerPosition, options);
    const filteredEvents = [];
    const filteredIndexMap = [];
    for (let i = 0; i < (Array.isArray(attackEvents) ? attackEvents.length : 0); i += 1) {
      if (anchorConsumed.has(i)) continue;
      filteredIndexMap.push(i);
      filteredEvents.push(attackEvents[i]);
    }
    const incomingDamageMultiplier = this._resolveIncomingDamageMultiplier();
    const result = this.bossEntity.applyPlayerAttackEvents(filteredEvents, playerPosition, {
      ...options,
      incomingDamageMultiplier,
    });
    const remappedBossConsumed = (result.consumedIndexes ?? [])
      .map((index) => filteredIndexMap[index])
      .filter((value) => Number.isInteger(value));
    const mergedConsumed = [...anchorConsumed, ...remappedBossConsumed].sort((a, b) => a - b);
    if (this.battleState.firstHitReduced && !this.battleState.firstHitConsumed && (result.damageDealt ?? 0) > 0) {
      this.battleState.firstHitConsumed = true;
      this.setTransientMessage("Vein Guardian's Stone Ward absorbed the blow!", 1.2);
    }
    return {
      ...result,
      consumedIndexes: mergedConsumed,
    };
  }

  applySupportHit(amount) {
    if (!this.active || !this.bossEntity) {
      return { damage: 0, brokeShield: false };
    }
    const scaledAmount = Number(amount) * this._resolveIncomingDamageMultiplier();
    const result = this.bossEntity.applySupportHit(scaledAmount);
    if (this.battleState.firstHitReduced && !this.battleState.firstHitConsumed && (result.damage ?? 0) > 0) {
      this.battleState.firstHitConsumed = true;
      this.setTransientMessage("Vein Guardian's Stone Ward absorbed the blow!", 1.2);
    }
    return result;
  }

  damageBoss(amount = 0) {
    if (!this.active || !this.bossEntity) return { dealt: 0, state: this.getState() };
    const dealt = this.bossEntity.damageDirect(Number(amount) || 0);
    this.lastState = this.bossEntity.getState();
    return { dealt, state: this.lastState };
  }

  setBossHpPercent(percent = 1) {
    if (!this.bossEntity) return this.getState();
    const state = this.bossEntity.setHpRatio?.(Number(percent) || 0) ?? this.bossEntity.getState();
    this.lastState = state;
    return state;
  }

  forcePhase(phaseId = "p1") {
    if (!this.bossEntity) return this.getState();
    const state = this.bossEntity.forcePhase?.(phaseId) ?? this.bossEntity.getState();
    this.lastState = state;
    return state;
  }

  setExtractionMeter(value = 0) {
    if (!this._isHarvesterBoss()) return this.getState();
    this.harvesterObjective.extraction = clamp01(Number(value) || 0);
    return this.getState();
  }

  nudgeExtractionMeter(delta = 0) {
    if (!this._isHarvesterBoss()) return this.getState();
    this.harvesterObjective.extraction = clamp01(this.harvesterObjective.extraction + (Number(delta) || 0));
    return this.getState();
  }

  damageAnchor(index = 0, amount = HARVESTER_ANCHOR_LIGHT_DAMAGE) {
    if (!this._isHarvesterBoss()) return { damaged: false, destroyed: false, state: this.getState() };
    const result = this._damageHarvesterAnchor(Math.max(0, Math.floor(Number(index) || 0)), amount);
    return {
      ...result,
      state: this.getState(),
    };
  }

  _spawnTelegraphLine({ from, to, color = "#ccffdc", life = 0.4, width = 0.09 }) {
    if (!from || !to) return;
    const fromVec = new THREE.Vector2(from.x, from.y);
    const toVec = new THREE.Vector2(to.x, to.y);
    const delta = new THREE.Vector2(toVec.x - fromVec.x, toVec.y - fromVec.y);
    const distance = delta.length();
    if (distance <= 0.001) return;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(distance, width),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    const angle = Math.atan2(delta.y, delta.x);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -angle;
    mesh.position.set((fromVec.x + toVec.x) * 0.5, -0.83, (fromVec.y + toVec.y) * 0.5);
    mesh.renderOrder = 1215;
    this.telegraphRoot.add(mesh);
    this.telegraphLines.push({
      mesh,
      life,
      maxLife: Math.max(0.0001, life),
    });
  }

  _updateTelegraphLines(dtSeconds) {
    for (let i = this.telegraphLines.length - 1; i >= 0; i -= 1) {
      const line = this.telegraphLines[i];
      line.life = Math.max(0, line.life - dtSeconds);
      const t = line.life / line.maxLife;
      line.mesh.material.opacity = 0.82 * t;
      if (line.life <= 0) {
        this.telegraphRoot.remove(line.mesh);
        line.mesh.geometry?.dispose?.();
        line.mesh.material?.dispose?.();
        this.telegraphLines.splice(i, 1);
      }
    }
  }

  _resolvePhaseDefinition(hpRatio) {
    if (!this.bossDefinition?.phases) return null;
    for (let i = 0; i < this.bossDefinition.phases.length; i += 1) {
      const phase = this.bossDefinition.phases[i];
      if (hpRatio > phase.hpAbove) {
        return { phase, index: i };
      }
    }
    const fallback = this.bossDefinition.phases[this.bossDefinition.phases.length - 1] ?? null;
    if (!fallback) return null;
    return { phase: fallback, index: this.bossDefinition.phases.length - 1 };
  }

  _updateDamageTemps(dtSeconds) {
    if (!this.pendingDamageTemp.length) return;
    for (let i = this.pendingDamageTemp.length - 1; i >= 0; i -= 1) {
      const mod = this.pendingDamageTemp[i];
      mod.remaining = Math.max(0, mod.remaining - dtSeconds);
      if (mod.remaining <= 0) {
        this.pendingDamageTemp.splice(i, 1);
      }
    }
  }

  _resolveIncomingDamageMultiplier() {
    let value = this.battleState.damageModifier * this.battleState.incomingDamageModifier;
    for (const mod of this.pendingDamageTemp) {
      if (mod.target === "boss" || mod.target === "both") {
        value *= mod.multiplier;
      }
    }
    if (this.battleState.firstHitReduced && !this.battleState.firstHitConsumed) {
      value *= 0.5;
    }
    return Math.max(0, value);
  }

  _resolveOutgoingDamageMultiplier() {
    let value = this.battleState.damageModifier * this.battleState.outgoingDamageModifier;
    for (const mod of this.pendingDamageTemp) {
      if (mod.target === "player" || mod.target === "both") {
        value *= mod.multiplier;
      }
    }
    return Math.max(0, value);
  }

  _setBattleModifier(key, value) {
    if (!key) return this.battleState;
    if (typeof key === "object" && key) {
      for (const [entryKey, entryValue] of Object.entries(key)) {
        this._setBattleModifier(entryKey, entryValue);
      }
      return this.battleState;
    }
    const normalizedKey = String(key);
    if (normalizedKey in this.battleState) {
      const numericValue = Number(value);
      this.battleState[normalizedKey] = Number.isFinite(numericValue) ? numericValue : value;
    }
    return this.battleState;
  }

  _repositionBoss(reason = "default") {
    if (!this.bossEntity || !this.active) return false;
    const angle = this.rng.nextFloat() * Math.PI * 2;
    const radius = Math.max(0.8, this.arenaBounds.radius * 0.62);
    const nextPosition = {
      x: this.arenaBounds.center.x + Math.cos(angle) * radius,
      y: this.arenaBounds.center.y + Math.sin(angle) * radius,
    };
    this.bossEntity.relocate?.(nextPosition);
    this.scriptState.lastSwitchReason = reason;
    this.scriptState.lastSwitchTime = this.elapsedSeconds;
    this.vfxSystem?.spawnGroundRing?.({
      position: new THREE.Vector2(nextPosition.x, nextPosition.y),
      innerRadius: 0.25,
      outerRadius: 0.75,
      color: "#d8ffe7",
      life: 0.42,
      opacity: 0.82,
      spread: 0.56,
    });
    return true;
  }

  _runAction(actionId, bossStateSnapshot, payload = null) {
    const key = String(actionId ?? "").trim();
    if (!key) return false;
    const behavior = BOSS_BEHAVIORS[key];
    if (typeof behavior !== "function") return false;
    behavior(this._createHookContext(bossStateSnapshot, payload));
    return true;
  }

  _updateBossConfigTriggers(bossStateSnapshot, dtSeconds) {
    const config = this.bossDefinition?.bossConfig;
    if (!config) return;

    if (config.specialBehaviorId) {
      this._runAction(config.specialBehaviorId, bossStateSnapshot, {
        dt: Math.max(0, Number(dtSeconds) || 0),
        passive: true,
      });
    }

    const triggers = Array.isArray(config.phaseTriggers) ? config.phaseTriggers : [];
    for (let i = 0; i < triggers.length; i += 1) {
      const trigger = triggers[i];
      const triggerKey = `${i}:${trigger.actionId}:${trigger.condition}:${trigger.value}`;
      if (this.triggeredActions.has(triggerKey)) continue;

      let shouldFire = false;
      if (trigger.condition === "hpBelowPercent") {
        const threshold = Math.max(0, Math.min(1, Number(trigger.value) || 0));
        shouldFire = (bossStateSnapshot.hpRatio ?? 1) <= threshold;
      } else if (trigger.condition === "timerSeconds") {
        const threshold = Math.max(0, Number(trigger.value) || 0);
        shouldFire = this.elapsedSeconds >= threshold;
      }

      if (!shouldFire) continue;
      this.triggeredActions.add(triggerKey);
      this._runAction(trigger.actionId, bossStateSnapshot);
    }
  }

  _createHookContext(bossStateSnapshot, payload = null) {
    const playerPos = this.getPlayerPosition?.() ?? new THREE.Vector2(0, 0);
    const position = new THREE.Vector2(
      bossStateSnapshot?.position?.x ?? this.arenaBounds.center.x,
      bossStateSnapshot?.position?.z ?? this.arenaBounds.center.y
    );
    return {
      player: {
        arthur: new THREE.Vector2(playerPos.x, playerPos.y),
        partyMembers: this.getPartyMembers?.() ?? [],
      },
      combat: {
        spawnMinions: (definitions = []) => {
          const ids = this.combatSystem.spawnEnemies(definitions);
          for (const id of ids) {
            this.summonedEnemyIds.add(id);
          }
          return ids;
        },
        countAlive: (enemyIds = []) => this.combatSystem.countAliveEnemiesByIds(enemyIds),
      },
      vfx: {
        spawnRing: (config) => this.vfxSystem?.spawnGroundRing?.(config),
        spawnTelegraphLine: (config) => this._spawnTelegraphLine(config),
      },
      worldState: this.worldState,
      sceneId: this.sceneId,
      regionName: this.getRegionName?.() ?? "Unknown Region",
      bossPosition: position,
      activeCreature: this.bossEntity,
      opponentCreature: {
        id: "arthur",
        position: new THREE.Vector2(playerPos.x, playerPos.y),
      },
      battleState: this.battleState,
      scriptState: this.scriptState,
      elapsedTag: Math.floor(this.elapsedSeconds * 10),
      enqueueMessage: (message, duration = 1.5) => this.setTransientMessage(String(message ?? ""), duration),
      applyStatus: (target = "boss", status = null) => {
        const normalizedTarget = String(target ?? "boss");
        if (normalizedTarget === "player" || normalizedTarget === "both") {
          this.battleState.statuses.player = status ? String(status) : null;
        }
        if (normalizedTarget === "boss" || normalizedTarget === "both") {
          this.battleState.statuses.boss = status ? String(status) : null;
        }
      },
      modifyDamageTemp: ({ target = "both", multiplier = 1, seconds = 0.9 } = {}) => {
        this.pendingDamageTemp.push({
          target: String(target ?? "both"),
          multiplier: Math.max(0, Number(multiplier) || 0),
          remaining: Math.max(0.05, Number(seconds) || 0.05),
        });
      },
      repositionBoss: (reason = "script") => this._repositionBoss(reason),
      setBattleModifier: (key, value) => this._setBattleModifier(key, value),
      playMusic: (trackId, durationMs = 400) => {
        if (typeof this.audioBus?.crossfadeTo === "function") {
          this.audioBus.crossfadeTo(trackId, durationMs);
        } else {
          this.audioBus?.playTrack?.(trackId);
        }
      },
      bossEvents: {
        triggerSuppressionPulse: (durationSeconds = HARVESTER_SUPPRESSION_SECONDS) =>
          this._applySuppressionFieldPulse(durationSeconds),
        setExtraction: (value = 0) => this.setExtractionMeter(value),
        nudgeExtraction: (delta = 0) => this.nudgeExtractionMeter(delta),
        damageAnchor: (index = 0, amount = HARVESTER_ANCHOR_LIGHT_DAMAGE) => this.damageAnchor(index, amount),
      },
      rng: this.rng,
      payload,
    };
  }

  _enforceArenaLock(playerPosition, dtSeconds) {
    this.playerCorrection = null;
    if (!this.active || !this.lockedExits || !playerPosition) {
      return { lockCollided: false, escaped: false };
    }

    const center = this.arenaBounds.center;
    const dx = playerPosition.x - center.x;
    const dz = playerPosition.z - center.y;
    const distance = Math.hypot(dx, dz);
    const radius = this.arenaBounds.radius;
    const maxDistance = Math.max(0.2, radius - BARRIER_COLLISION_PADDING);
    let lockCollided = false;

    if (distance > maxDistance) {
      const normX = dx / Math.max(0.0001, distance);
      const normZ = dz / Math.max(0.0001, distance);
      this.playerCorrection = new THREE.Vector2(center.x + normX * maxDistance, center.y + normZ * maxDistance);
      lockCollided = true;
    }

    if (distance > radius + 1.05) {
      this.escapeOutsideSeconds += dtSeconds;
    } else {
      this.escapeOutsideSeconds = Math.max(0, this.escapeOutsideSeconds - dtSeconds * 2.5);
    }

    return {
      lockCollided,
      escaped: this.escapeOutsideSeconds >= ESCAPE_RESET_SECONDS,
    };
  }

  _updatePendingMusicReturn(dtSeconds) {
    if (!this.pendingMusicReturn) {
      return;
    }
    this.pendingMusicReturnSeconds = Math.max(0, this.pendingMusicReturnSeconds - dtSeconds);
    if (this.pendingMusicReturnSeconds > 0) {
      return;
    }
    const track = this.pendingMusicReturn;
    this.pendingMusicReturn = null;
    this.pendingMusicReturnSeconds = 0;
    if (typeof this.audioBus?.crossfadeTo === "function") {
      this.audioBus.crossfadeTo(track, 420);
    } else {
      this.audioBus?.playTrack?.(track);
    }
  }

  update(dtSeconds, { elapsedSeconds = 0, playerPosition = null, onPlayerDamaged = null } = {}) {
    const dt = Math.max(0, Number(dtSeconds) || 0);
    this._updatePendingMusicReturn(dt);
    this._updateTelegraphLines(dt);
    this._updateDamageTemps(dt);

    if (!this.active || !this.bossEntity || !this.bossDefinition) {
      this.resetCooldownRemaining = Math.max(0, this.resetCooldownRemaining - dt);
      return this.getState();
    }

    this.elapsedSeconds += dt;
    const bossState = this.bossEntity.update(dt, {
      elapsedSeconds,
      playerPosition: playerPosition ?? { x: 0, z: 0 },
      onPlayerDamaged: (damage, payload = null) => {
        const scaled = Math.max(0, Number(damage) || 0) * this._resolveOutgoingDamageMultiplier();
        onPlayerDamaged?.(scaled, payload);
      },
      onSpawnMinions: (definitions = []) => {
        const ids = this.combatSystem.spawnEnemies(definitions);
        for (const id of ids) {
          this.summonedEnemyIds.add(id);
        }
        return ids;
      },
    });

    const damageThisTick = Math.max(0, this.lastKnownHp - (bossState.hp ?? 0));
    this.lastKnownHp = bossState.hp ?? this.lastKnownHp;

    const phaseResult = this._resolvePhaseDefinition(bossState.hpRatio ?? 0);
    if (phaseResult) {
      if (phaseResult.phase.id !== this.phaseId) {
        this.phaseId = phaseResult.phase.id;
        this.phaseLabel = phaseResult.phase.label ?? this.phaseId;
        this.phaseIndex = phaseResult.index;
        phaseResult.phase.onEnterPhase?.(this._createHookContext(bossState));
      }

      phaseResult.phase.updatePhase?.(this._createHookContext(bossState), dt);
    }

    this._updateBossConfigTriggers(bossState, dt);
    this._updateHarvesterObjective(dt, onPlayerDamaged);

    if (damageThisTick > 0 && typeof this.bossDefinition.onBossDamaged === "function") {
      this.bossDefinition.onBossDamaged(this._createHookContext(bossState), damageThisTick);
    }

    if (!this.finalPhaseMusicTriggered && (bossState.hpRatio ?? 1) < 0.33) {
      this.finalPhaseMusicTriggered = true;
      if (typeof this.audioBus?.crossfadeTo === "function") {
        this.audioBus.crossfadeTo("battle_final_phase", 360);
      } else {
        this.audioBus?.playTrack?.("battle_final_phase");
      }
    }

    const lockState = this._enforceArenaLock(playerPosition, dt);
    if (lockState.escaped) {
      this.endBossFight("fail");
    } else if (bossState.justDefeated) {
      this.endBossFight("victory");
    }

    this.lastState = {
      ...bossState,
      active: this.active && !bossState.justDefeated,
      bossId: this.bossId,
      bossName: this.bossDefinition.name,
      sceneId: this.sceneId,
      phaseId: this.phaseId,
      phaseLabel: this.phaseLabel,
      lockActive: this.lockedExits,
      lockCollided: lockState.lockCollided,
      correctedPlayerPosition: this.playerCorrection
        ? { x: this.playerCorrection.x, y: this.playerCorrection.y }
        : null,
      musicTrack: this.audioBus?.currentMusic ?? "",
      musicTransition: this.audioBus?.getDebugState?.()?.transition ?? null,
      guardian: bossState,
      objective: this._isHarvesterBoss()
        ? {
            extraction: Number(this.harvesterObjective.extraction.toFixed(4)),
            surgeCount: this.harvesterObjective.surgeCount,
            anchors: this.harvesterObjective.anchors.map((anchor) => ({
              index: anchor.index,
              hp: Number(anchor.hp.toFixed(2)),
              maxHP: anchor.maxHP,
              destroyed: anchor.destroyed,
              x: Number(anchor.position.x.toFixed(3)),
              z: Number(anchor.position.y.toFixed(3)),
            })),
          }
        : null,
      battleState: {
        ...this.battleState,
        statuses: { ...this.battleState.statuses },
      },
    };
    return this.lastState;
  }

  getHudState() {
    if (!this.active || !this.lastState) {
      return {
        active: false,
        name: "",
        phaseLabel: "",
        hp: 0,
        maxHP: 0,
        hpRatio: 0,
        extraction: null,
      };
    }
    const extraction = this._isHarvesterBoss()
      ? {
          label: "Extraction",
          value: Number(clamp01(this.harvesterObjective.extraction).toFixed(4)),
          anchorsAlive: this.harvesterObjective.anchors.filter((anchor) => !anchor.destroyed).length,
          anchorsTotal: this.harvesterObjective.anchors.length,
        }
      : null;
    return {
      active: true,
      name: this.bossDefinition?.name ?? "Boss",
      phaseLabel: this.phaseLabel || "Manifesting",
      hp: Math.max(0, Number(this.lastState.hp) || 0),
      maxHP: Math.max(1, Number(this.lastState.maxHP ?? this.bossDefinition?.maxHP ?? 1)),
      hpRatio: clamp01(Number(this.lastState.hpRatio) || 0),
      extraction,
    };
  }

  getPlayerCorrection() {
    if (!this.playerCorrection) return null;
    return this.playerCorrection.clone();
  }

  endBossFight(outcome = "fail") {
    const resolved = String(outcome ?? "fail");
    const wasActive = this.active;
    const wasHarvester = this._isHarvesterBoss();
    const wasNullArchivist = this._isNullArchivistBoss();
    const wasLoomProctor = this._isLoomProctorBoss();
    const wasNarratorCrown = this._isNarratorCrownBoss();
    this.active = false;
    this.lockedExits = false;
    this.playerCorrection = null;
    this.escapeOutsideSeconds = 0;

    if (wasActive && resolved === "victory") {
      if (wasHarvester) {
        this.setStoryFlag("vaeloris_harvester_active", false);
        this.setStoryFlag("vaeloris_harvester_defeated", true);
      } else if (wasNullArchivist) {
        this.setStoryFlag("chapter9_null_archivist_active", false);
        this.setStoryFlag("chapter9_null_archivist_defeated", true);
        this.setStoryFlag("vein_guardian_active", false);
      } else if (wasLoomProctor) {
        this.setStoryFlag("endgame_loom_proctor_active", false);
        this.setStoryFlag("endgame_loom_proctor_defeated", true);
        this.setStoryFlag("vein_guardian_active", false);
      } else if (wasNarratorCrown) {
        this.setStoryFlag("endgame_narrator_crown_active", false);
        this.setStoryFlag("vein_guardian_active", false);
      } else {
        this.setStoryFlag("vein_guardian_active", false);
        this.setStoryFlag("chapter9_null_archivist_active", false);
        this.setStoryFlag("endgame_loom_proctor_active", false);
        this.setStoryFlag("endgame_narrator_crown_active", false);
        this.setStoryFlag("vein_guardian_defeated", true);
        this.grantRelicShards(1);
      }
      this.bossDefinition?.onBossDefeated?.(this._createHookContext(this.lastState ?? {}));
      this.setTransientMessage(
        wasHarvester
          ? "The Harvester core cracks open."
          : wasNullArchivist
            ? "The Vault memory lock breaks."
            : wasLoomProctor
              ? "The Memory Loom yields its final thread."
              : wasNarratorCrown
                ? "The final script fractures."
            : "A relic shard resonates in your hand.",
        wasHarvester || wasNullArchivist || wasLoomProctor || wasNarratorCrown ? 1.6 : 2.0
      );
      this.pendingMusicReturn = "battle_normal";
      this.pendingMusicReturnSeconds = 1.6;
      this.audioBus?.playTrack?.("victory_boss");
    } else {
      this.setStoryFlag("vein_guardian_active", false);
      this.setStoryFlag("vaeloris_harvester_active", false);
      this.setStoryFlag("chapter9_null_archivist_active", false);
      this.setStoryFlag("endgame_loom_proctor_active", false);
      this.setStoryFlag("endgame_narrator_crown_active", false);
      this.setTransientMessage(
        resolved === "fail"
          ? wasHarvester
            ? "The rig shutters and resets."
            : wasNullArchivist
              ? "The Archivist rewrites the arena."
              : wasLoomProctor
                ? "The Loom restitches the arena."
                : wasNarratorCrown
                  ? "The Crown drags your names back to the start."
            : "The manifestation slips back into the scar."
          : "",
        resolved === "fail" ? 1.5 : 0
      );
      if (resolved === "fail") {
        this.resetCooldownRemaining = this.arenaBounds.resetCooldownSeconds;
        this.onRespawnPlayer?.();
      }
      if (typeof this.audioBus?.crossfadeTo === "function") {
        this.audioBus.crossfadeTo("battle_normal", 360);
      } else {
        this.audioBus?.playTrack?.("battle_normal");
      }
    }

    if (wasActive) {
      this.onBossOutcome?.(resolved, {
        bossId: this.bossId,
        sceneId: this.sceneId,
      });
    }

    this.cleanupBossEntity();
    this.cleanupBossSpecificEntities();
    this._clearBarrierSegments();
    this._clearTelegraphLines();
    this._clearHarvesterAnchors();

    this.phaseId = "";
    this.phaseLabel = "";
    this.phaseIndex = -1;
    this.finalPhaseMusicTriggered = false;
    this.scriptState = {};
    this.harvesterObjective = this._createHarvesterObjectiveState();
    this.triggeredActions.clear();
    this.pendingDamageTemp.length = 0;
    this.battleState = {
      damageModifier: 1,
      incomingDamageModifier: 1,
      outgoingDamageModifier: 1,
      firstHitReduced: false,
      firstHitConsumed: false,
      statuses: {
        boss: null,
        player: null,
      },
    };

    this.lastState = {
      ...this._createIdleState(),
      active: false,
      justDefeated: resolved === "victory",
      defeated: resolved === "victory",
      bossId: this.bossId,
      sceneId: this.sceneId,
      musicTrack: this.audioBus?.currentMusic ?? "",
      musicTransition: this.audioBus?.getDebugState?.()?.transition ?? null,
    };
    return this.lastState;
  }

  cleanupBossSpecificEntities() {
    if (this.summonedEnemyIds.size > 0) {
      this.combatSystem.despawnEnemiesByIds([...this.summonedEnemyIds]);
      this.summonedEnemyIds.clear();
    }
    this._clearHarvesterAnchors();
  }

  cleanupBossEntity() {
    if (!this.bossEntity) return;
    this.bossEntity.dispose();
    this.bossEntity = null;
  }

  _clearBarrierSegments() {
    for (const spike of this.barrierSegments) {
      this.barrierRoot.remove(spike);
      spike.geometry?.dispose?.();
      spike.material?.dispose?.();
    }
    this.barrierSegments.length = 0;
  }

  _clearTelegraphLines() {
    for (const line of this.telegraphLines) {
      this.telegraphRoot.remove(line.mesh);
      line.mesh.geometry?.dispose?.();
      line.mesh.material?.dispose?.();
    }
    this.telegraphLines.length = 0;
  }

  getState() {
    if (this.active && this.lastState) {
      return {
        ...this.lastState,
        correctedPlayerPosition: this.playerCorrection
          ? { x: this.playerCorrection.x, y: this.playerCorrection.y }
          : null,
      };
    }
    return {
      ...this.lastState,
      active: false,
      musicTrack: this.audioBus?.currentMusic ?? "",
      musicTransition: this.audioBus?.getDebugState?.()?.transition ?? null,
    };
  }

  dispose() {
    this.endBossFight("reset");
    this.cleanupBossEntity();
    this.cleanupBossSpecificEntities();
    this._clearBarrierSegments();
    this._clearTelegraphLines();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}
