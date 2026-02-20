import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BillboardSprite, createPixelBillboardFallbackTexture, resolveDepthOrder } from "../render/billboard.js";
import { CHARACTER_SCALE } from "../config/scale.js";
import { createWeaponFallbackTexture, getWeaponGlow, getWeaponOffset, getWeaponSprite } from "../render/weaponAttachment.js";
import {
  chooseThreat,
  computeDesiredPosition,
  computeSeparationVector,
  hasThreatWithinRadius,
} from "./roleAi.js";

const FOLLOW_OFFSET = new THREE.Vector2(-0.75, 0.55);
const WILLOW_FOLLOW_OFFSET = new THREE.Vector2(0.82, 0.5);
const FOLLOW_MIN_DISTANCE = 0.46;
const FOLLOW_SPEED = 3.2;
const WILLOW_FOLLOW_SPEED = 3.55;
const ARTHUR_AI_SPEED = 3.45;
const THREAT_NEAR_RADIUS = 5.1;
const SEPARATION_RADIUS = 1.6;
const SEPARATION_STRENGTH = 1.15;
const ARTHUR_MELEE_RANGE = 1.28;
const ELAINE_ATTACK_RANGE = 2.35;
const ELAINE_ATTACK_DAMAGE = 5;
const ELAINE_ATTACK_COOLDOWN = 1.05;
const PROJECTILE_LIFETIME = 0.18;
const WILLOW_PROJECTILE_LIFETIME = 0.22;
const WILLOW_ATTACK_RANGE = 3.45;
const WILLOW_ATTACK_DAMAGE = 6;
const HOLY_BOLT_DAMAGE = 4;
const HOLY_BOLT_COOLDOWN = 0.34;
const HERO_WIDTH = 2.4 * CHARACTER_SCALE;
const HERO_HEIGHT = 3.2 * CHARACTER_SCALE;
const AUTOMATED_TEST_MODE = typeof navigator !== "undefined" && Boolean(navigator.webdriver);

function applyNearestTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

async function loadPixelTexture(assetPath, fallbackTexture) {
  if (AUTOMATED_TEST_MODE) {
    return fallbackTexture;
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(applyNearestTextureSettings(new THREE.Texture(image)));
    image.onerror = () => resolve(fallbackTexture);
    image.src = assetPath;
  });
}

function createElaineFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(11, 44, 10, 3);
    ctx.fillStyle = "#121820";
    ctx.fillRect(12, 12, 8, 24);
    // Keep Elaine's hair visibly blonde in fallback/test mode.
    ctx.fillStyle = "#8f6a2c";
    ctx.fillRect(12, 12, 8, 2);
    ctx.fillStyle = "#f5d36a";
    ctx.fillRect(12, 14, 8, 4);
    ctx.fillRect(12, 18, 2, 2);
    ctx.fillRect(18, 18, 2, 2);
    ctx.fillStyle = "#efd8b8";
    ctx.fillRect(13, 17, 6, 3);
    ctx.fillStyle = "#6f8fa7";
    ctx.fillRect(13, 20, 6, 12);
    ctx.fillStyle = "#4a6f8d";
    ctx.fillRect(13, 24, 6, 8);
    ctx.fillStyle = "#f2e0be";
    ctx.fillRect(19, 22, 4, 2);
    ctx.fillStyle = "#32414f";
    ctx.fillRect(13, 36, 2, 6);
    ctx.fillRect(17, 36, 2, 6);
  }, 32, 48);
}

function createProjectileTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = "#d7ffda";
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillStyle = "#9df0a8";
    ctx.fillRect(2, 3, 1, 1);
    ctx.fillRect(5, 4, 1, 1);
  }, 8, 8);
}

function createWillowProjectileTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = "rgba(108, 240, 201, 0.92)";
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = "#dbfff0";
    ctx.fillRect(3, 3, 2, 2);
  }, 8, 8);
}

function createWillowFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 32, 48);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(10, 43, 12, 3);
    ctx.fillStyle = "#1b2530";
    ctx.fillRect(12, 10, 8, 9);
    ctx.fillStyle = "#d59b56";
    ctx.fillRect(11, 8, 10, 3);
    ctx.fillRect(11, 10, 2, 6);
    ctx.fillRect(19, 10, 2, 6);
    ctx.fillStyle = "#efd8b8";
    ctx.fillRect(13, 12, 6, 4);
    ctx.fillStyle = "#5d7fa8";
    ctx.fillRect(12, 18, 8, 16);
    ctx.fillStyle = "#9bc3e9";
    ctx.fillRect(13, 20, 6, 10);
    ctx.fillStyle = "#3f556c";
    ctx.fillRect(12, 34, 3, 8);
    ctx.fillRect(17, 34, 3, 8);
    ctx.fillStyle = "#8d6844";
    ctx.fillRect(20, 17, 2, 18);
    ctx.fillStyle = "#5be0bf";
    ctx.fillRect(19, 13, 4, 4);
    ctx.fillStyle = "#e1fff6";
    ctx.fillRect(20, 14, 2, 2);
  }, 32, 48);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isPlayableScene(sceneId) {
  return (
    sceneId === "thornmere" ||
    sceneId === "hollowScar" ||
    sceneId === "emberfall" ||
    sceneId === "arthurOpening" ||
    sceneId === "windward" ||
    sceneId === "region3_seed" ||
    sceneId === "ridgepass" ||
    sceneId === "region4_seed" ||
    sceneId === "endgame_route_seed" ||
    sceneId === "spire_approach" ||
    sceneId === "spire_antechamber" ||
    sceneId === "inner_spire" ||
    sceneId === "inner_spire_last_door"
  );
}

function disposeMesh(mesh, root) {
  if (mesh.parent === root) {
    root.remove(mesh);
  }
  mesh.geometry.dispose();
  mesh.material.dispose();
}

export class PartySystem {
  constructor({
    threeScene,
    combatSystem,
    getSupportTarget = null,
    getWillowTarget = null,
    onSupportHit = null,
  }) {
    this.threeScene = threeScene;
    this.combatSystem = combatSystem;
    this.getSupportTarget = typeof getSupportTarget === "function" ? getSupportTarget : null;
    this.getWillowTarget = typeof getWillowTarget === "function" ? getWillowTarget : null;
    this.onSupportHit = typeof onSupportHit === "function" ? onSupportHit : null;
    this.root = new THREE.Group();
    this.root.name = "party-root";
    this.threeScene.add(this.root);

    this.elaineJoined = false;
    this.willowJoined = false;
    this.activeCharacterId = "arthur";
    this.activeSceneId = "";
    this.elaineFollower = null;
    this.willowFollower = null;
    this.elaineStaging = null;
    this.elaineAttackCooldown = 0;
    this.willowAttackCooldown = 0;
    this.holyBoltCooldown = 0;
    this.willowShotCount = 0;
    this.followerHoldRemaining = 0;
    this.projectiles = [];
    this._weaponTextureCache = new Map();
    this._arthurProxyPosition = new THREE.Vector2(0, 0);
    this._arthurProxyInitialized = false;
    this._aiFrame = {
      combatActive: false,
      bossActive: false,
      currentMode: "balanced",
      members: [],
    };

    this._projectileTexture = createProjectileTexture();
    this._willowProjectileTexture = createWillowProjectileTexture();
  }

  _createElaineBillboard(position, { opacity = 1, depthBaseOrder = 1180 } = {}) {
    return new BillboardSprite({
      root: this.root,
      assetPath: "./assets/sprites/npc/elaine.png",
      fallbackTexture: createElaineFallbackTexture(),
      width: HERO_WIDTH,
      height: HERO_HEIGHT,
      position,
      groundY: -0.9,
      yOffset: 0.02,
      depthBaseOrder,
      opacity,
      tint: "#ffffff",
      swayAmount: 0.011,
      swaySpeed: 0.92,
      scaleWithProps: false,
    });
  }

  _createWillowBillboard(position, { opacity = 1, depthBaseOrder = 1180 } = {}) {
    return new BillboardSprite({
      root: this.root,
      assetPath: "./assets/sprites/npc/willow.png",
      fallbackTexture: createWillowFallbackTexture(),
      width: HERO_WIDTH,
      height: HERO_HEIGHT,
      position,
      groundY: -0.9,
      yOffset: 0.02,
      depthBaseOrder,
      opacity,
      tint: "#ffffff",
      swayAmount: 0.009,
      swaySpeed: 0.86,
      scaleWithProps: false,
    });
  }

  _getWeaponTextureRecord(key, assetPath) {
    const cacheKey = `${key}:${assetPath}`;
    const cached = this._weaponTextureCache.get(cacheKey);
    if (cached) return cached;

    const fallbackTexture = createWeaponFallbackTexture(key);
    const record = {
      texture: fallbackTexture,
      fallbackTexture,
      disposed: false,
    };
    this._weaponTextureCache.set(cacheKey, record);

    loadPixelTexture(assetPath, fallbackTexture).then((texture) => {
      if (record.disposed) {
        if (texture && texture !== fallbackTexture) {
          texture.dispose?.();
        }
        return;
      }
      record.texture = texture;
    });
    return record;
  }

  _applyWeaponDescriptor(material, descriptor) {
    if (!material || !descriptor?.key || !descriptor?.assetPath) return false;
    const record = this._getWeaponTextureRecord(descriptor.key, descriptor.assetPath);
    if (material.map !== record.texture) {
      material.map = record.texture;
      material.needsUpdate = true;
    }
    material.alphaTest = Number.isFinite(descriptor.alphaTest) ? descriptor.alphaTest : material.alphaTest;
    material.opacity = Number.isFinite(descriptor.opacity) ? descriptor.opacity : 1;
    if (descriptor.color) {
      material.color?.set?.(descriptor.color);
    } else if (material.color) {
      material.color.set("#ffffff");
    }
    return true;
  }

  _attachElaineWeaponVisuals(entity) {
    if (!entity?.sprite?.mesh || entity.weaponAttachment) return;
    const weaponMaterial = new THREE.SpriteMaterial({
      map: createWeaponFallbackTexture("elaine_staff"),
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      opacity: 0.98,
    });
    const weaponSprite = new THREE.Sprite(weaponMaterial);
    weaponSprite.center.set(0.5, 0.5);
    weaponSprite.position.set(0.2, 0.08, 0.03);
    weaponSprite.scale.set(0.98, 0.98, 1);
    entity.sprite.mesh.add(weaponSprite);

    const glowMaterial = new THREE.SpriteMaterial({
      map: createWeaponFallbackTexture("pearl_glow"),
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      opacity: 0,
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.center.set(0.5, 0.5);
    glowSprite.position.set(0.21, 0.3, 0.04);
    glowSprite.scale.set(0.34, 0.34, 1);
    entity.sprite.mesh.add(glowSprite);

    entity.weaponAttachment = {
      weaponSprite,
      weaponMaterial,
      glowSprite,
      glowMaterial,
    };
    entity.walkTimer = Number(entity.walkTimer) || 0;
    entity.facing = entity.facing || "down";
    entity.lastPosition = entity.position?.clone?.() ?? new THREE.Vector2(0, 0);
  }

  _detachElaineWeaponVisuals(entity) {
    if (!entity?.weaponAttachment) return;
    const { weaponSprite, weaponMaterial, glowSprite, glowMaterial } = entity.weaponAttachment;
    if (weaponSprite?.parent) {
      weaponSprite.parent.remove(weaponSprite);
    }
    if (glowSprite?.parent) {
      glowSprite.parent.remove(glowSprite);
    }
    weaponMaterial?.dispose?.();
    glowMaterial?.dispose?.();
    entity.weaponAttachment = null;
  }

  _resolveFacingFromDelta(deltaX, deltaZ, fallback = "down") {
    if (Math.abs(deltaX) < 0.0001 && Math.abs(deltaZ) < 0.0001) {
      return fallback;
    }
    if (Math.abs(deltaX) > Math.abs(deltaZ)) {
      return deltaX < 0 ? "left" : "right";
    }
    return deltaZ < 0 ? "up" : "down";
  }

  _updateElaineWeaponVisuals(entity, { dtSeconds, elapsedSeconds, castActive = false, castRatio = 0 } = {}) {
    if (!entity?.weaponAttachment) return;

    const deltaX = entity.position.x - entity.lastPosition.x;
    const deltaZ = entity.position.y - entity.lastPosition.y;
    const isMoving = Math.hypot(deltaX, deltaZ) > 0.002;
    entity.facing = this._resolveFacingFromDelta(deltaX, deltaZ, entity.facing ?? "down");
    if (isMoving) {
      entity.walkTimer = (Number(entity.walkTimer) || 0) + dtSeconds * 6.2;
    } else {
      entity.walkTimer = 0;
    }
    entity.lastPosition.copy(entity.position);

    const animState = {
      movementState: isMoving ? "walk" : "idle",
      walkTimer: entity.walkTimer,
      castActive: Boolean(castActive),
      castRatio: Math.max(0, Math.min(1, Number(castRatio) || 0)),
      facing: entity.facing,
      elapsedSeconds,
    };
    const spriteDescriptor = getWeaponSprite("elaine", entity.facing, animState);
    this._applyWeaponDescriptor(entity.weaponAttachment.weaponMaterial, spriteDescriptor);

    const weaponPose = getWeaponOffset("elaine", entity.facing, animState);
    entity.weaponAttachment.weaponSprite.visible = weaponPose.mounted !== false;
    entity.weaponAttachment.weaponSprite.position.set(weaponPose.x, weaponPose.y, weaponPose.z);
    entity.weaponAttachment.weaponSprite.material.rotation = weaponPose.rotation;
    entity.weaponAttachment.weaponSprite.scale.set(weaponPose.scale, weaponPose.scale, 1);

    const glowDescriptor = getWeaponGlow("elaine", animState);
    this._applyWeaponDescriptor(entity.weaponAttachment.glowMaterial, glowDescriptor);
    entity.weaponAttachment.glowSprite.visible = Boolean(glowDescriptor.enabled);
    entity.weaponAttachment.glowSprite.position.set(glowDescriptor.x, glowDescriptor.y, glowDescriptor.z);
    entity.weaponAttachment.glowSprite.scale.set(glowDescriptor.scale, glowDescriptor.scale, 1);
    entity.weaponAttachment.glowMaterial.opacity = glowDescriptor.opacity;

    const baseOrder = resolveDepthOrder(entity.position.y, 1206);
    entity.weaponAttachment.weaponSprite.renderOrder = baseOrder;
    entity.weaponAttachment.glowSprite.renderOrder = baseOrder + 1;
  }

  _syncPresence(playerPosition = null) {
    const shouldShowFollower = this.elaineJoined && isPlayableScene(this.activeSceneId) && this.activeCharacterId !== "elaine";
    if (shouldShowFollower && !this.elaineFollower && playerPosition) {
      const spawn = new THREE.Vector2(playerPosition.x + FOLLOW_OFFSET.x, playerPosition.z + FOLLOW_OFFSET.y);
      const sprite = this._createElaineBillboard(spawn, { depthBaseOrder: 1184 });
      this.elaineFollower = {
        sprite,
        position: spawn.clone(),
        facing: "down",
        walkTimer: 0,
        lastPosition: spawn.clone(),
        weaponAttachment: null,
      };
      this._attachElaineWeaponVisuals(this.elaineFollower);
    } else if (!shouldShowFollower && this.elaineFollower) {
      this._detachElaineWeaponVisuals(this.elaineFollower);
      this.elaineFollower.sprite.dispose();
      this.elaineFollower = null;
    }

    const shouldShowWillowFollower =
      this.willowJoined && isPlayableScene(this.activeSceneId) && this.activeCharacterId !== "willow";
    if (shouldShowWillowFollower && !this.willowFollower && playerPosition) {
      const spawn = new THREE.Vector2(
        playerPosition.x + WILLOW_FOLLOW_OFFSET.x,
        playerPosition.z + WILLOW_FOLLOW_OFFSET.y
      );
      const sprite = this._createWillowBillboard(spawn, { depthBaseOrder: 1183 });
      this.willowFollower = {
        sprite,
        position: spawn.clone(),
        facing: "down",
        walkTimer: 0,
        lastPosition: spawn.clone(),
      };
    } else if (!shouldShowWillowFollower && this.willowFollower) {
      this.willowFollower.sprite.dispose();
      this.willowFollower = null;
    }

    const shouldShowStaging = Boolean(this.elaineStaging?.sceneId === this.activeSceneId);
    if (this.elaineStaging && !shouldShowStaging) {
      this._detachElaineWeaponVisuals(this.elaineStaging);
      this.elaineStaging.sprite.dispose();
      this.elaineStaging = null;
    }
  }

  setActiveScene(sceneId, playerPosition = null) {
    this.activeSceneId = sceneId;
    this._syncPresence(playerPosition);
    if (!isPlayableScene(sceneId)) {
      this.clearProjectiles();
    }
  }

  setJoined(joined, playerPosition = null) {
    this.elaineJoined = Boolean(joined);
    if (this.elaineJoined) {
      this.clearStaging();
    }
    this._syncPresence(playerPosition);
  }

  setWillowJoined(joined, playerPosition = null) {
    this.willowJoined = Boolean(joined);
    if (!this.willowJoined && this.activeCharacterId === "willow") {
      this.activeCharacterId = "arthur";
    }
    this._syncPresence(playerPosition);
  }

  hasMember(memberId = "") {
    const normalized = String(memberId ?? "").trim().toLowerCase();
    if (normalized === "arthur") return true;
    if (normalized === "elaine") return this.elaineJoined;
    if (normalized === "willow") return this.willowJoined;
    return false;
  }

  setActiveCharacter(characterId = "arthur", playerPosition = null) {
    const normalized = String(characterId).toLowerCase();
    if (normalized === "elaine") {
      this.activeCharacterId = this.elaineJoined ? "elaine" : "arthur";
    } else if (normalized === "willow") {
      this.activeCharacterId = this.willowJoined ? "willow" : "arthur";
    } else {
      this.activeCharacterId = "arthur";
    }
    this._syncArthurProxy(playerPosition);
    this._syncPresence(playerPosition);
  }

  _syncArthurProxy(playerPosition = null) {
    if (!playerPosition) return;
    const nextX = Number(playerPosition.x) || 0;
    const nextZ = Number(playerPosition.z) || 0;
    if (!this._arthurProxyInitialized || this.activeCharacterId === "arthur") {
      this._arthurProxyPosition.set(nextX, nextZ);
      this._arthurProxyInitialized = true;
    }
  }

  _getAliveEnemies() {
    const snapshots = this.combatSystem.getEnemySnapshots?.() ?? [];
    return snapshots
      .filter((enemy) => enemy && enemy.state !== "dead" && (Number(enemy.health) || 0) > 0)
      .map((enemy) => ({
        id: enemy.id,
        x: Number(enemy.x) || 0,
        z: Number(enemy.z) || 0,
        health: Number(enemy.health) || 0,
        maxHealth: Number(enemy.maxHealth) || 1,
        role: enemy.role ?? "",
        state: enemy.state ?? "aggro",
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  _resolveMemberPosition(memberId, playerPosition) {
    if (memberId === this.activeCharacterId && playerPosition) {
      return new THREE.Vector2(Number(playerPosition.x) || 0, Number(playerPosition.z) || 0);
    }
    if (memberId === "elaine" && this.elaineFollower) {
      return this.elaineFollower.position.clone();
    }
    if (memberId === "willow" && this.willowFollower) {
      return this.willowFollower.position.clone();
    }
    if (memberId === "arthur" && this._arthurProxyInitialized) {
      return this._arthurProxyPosition.clone();
    }
    return new THREE.Vector2(Number(playerPosition?.x) || 0, Number(playerPosition?.z) || 0);
  }

  _buildPartyMembers(playerPosition, partyVitals = null) {
    const vitals = partyVitals ?? {};
    const members = [];

    const arthurPos = this._resolveMemberPosition("arthur", playerPosition);
    members.push({
      id: "arthur",
      role: "arthur",
      x: arthurPos.x,
      z: arthurPos.y,
      hp: Number(vitals.arthur?.hp) || 100,
      maxHp: Number(vitals.arthur?.maxHp) || 100,
      downed: Boolean(vitals.arthur?.downed),
      active: this.activeCharacterId === "arthur",
    });

    if (this.elaineJoined) {
      const elainePos = this._resolveMemberPosition("elaine", playerPosition);
      members.push({
        id: "elaine",
        role: "elaine",
        x: elainePos.x,
        z: elainePos.y,
        hp: Number(vitals.elaine?.hp) || 70,
        maxHp: Number(vitals.elaine?.maxHp) || 70,
        downed: Boolean(vitals.elaine?.downed),
        active: this.activeCharacterId === "elaine",
      });
    }

    if (this.willowJoined) {
      const willowPos = this._resolveMemberPosition("willow", playerPosition);
      members.push({
        id: "willow",
        role: "willow",
        x: willowPos.x,
        z: willowPos.y,
        hp: Number(vitals.willow?.hp) || 100,
        maxHp: Number(vitals.willow?.maxHp) || 100,
        downed: Boolean(vitals.willow?.downed),
        active: this.activeCharacterId === "willow",
      });
    }
    return members;
  }

  _getFollowAnchor(memberId, leaderPosition) {
    const leaderX = Number(leaderPosition?.x) || 0;
    const leaderZ = Number(leaderPosition?.z) || 0;
    if (memberId === "willow") {
      return {
        x: leaderX + WILLOW_FOLLOW_OFFSET.x,
        z: leaderZ + WILLOW_FOLLOW_OFFSET.y,
      };
    }
    if (memberId === "elaine") {
      return {
        x: leaderX + FOLLOW_OFFSET.x,
        z: leaderZ + FOLLOW_OFFSET.y,
      };
    }
    return {
      x: leaderX + 0.35,
      z: leaderZ - 0.72,
    };
  }

  _recordAiState({
    id,
    position,
    aiState = "follow",
    threatId = "",
    distToThreat = null,
    desiredRange = null,
    mode = "balanced",
  }) {
    const posX = Number(position?.x) || 0;
    const posZ = Number(position?.z ?? position?.y) || 0;
    this._aiFrame.members.push({
      id,
      x: Number(posX.toFixed(3)),
      z: Number(posZ.toFixed(3)),
      aiState,
      threatId: threatId ? String(threatId) : "",
      distToThreat: distToThreat == null ? null : Number(Math.max(0, distToThreat).toFixed(3)),
      desiredRange: desiredRange == null ? null : Number(Math.max(0, desiredRange).toFixed(3)),
      mode,
    });
  }

  _movePointToward(position, desired, dtSeconds, speed) {
    const toDesiredX = desired.x - position.x;
    const toDesiredZ = desired.z - position.y;
    const distance = Math.hypot(toDesiredX, toDesiredZ);
    if (distance <= 0.001) return;
    const maxStep = Math.max(0.2, Number(speed) || FOLLOW_SPEED) * dtSeconds;
    const step = Math.min(maxStep, distance);
    position.x += (toDesiredX / distance) * step;
    position.y += (toDesiredZ / distance) * step;
  }

  _updateFollowerVisual(entity, dtSeconds, elapsedSeconds, camera, { castActive = false, castRatio = 0 } = {}) {
    if (!entity?.sprite) return;
    entity.sprite.position2D.set(entity.position.x, entity.position.y);
    entity.sprite.mesh.position.x = entity.position.x;
    entity.sprite.mesh.position.z = entity.position.y;
    if (entity === this.elaineFollower || entity === this.elaineStaging) {
      this._updateElaineWeaponVisuals(entity, {
        dtSeconds,
        elapsedSeconds,
        castActive,
        castRatio,
      });
    }
    entity.sprite.update(dtSeconds, elapsedSeconds, camera, 1);
  }

  _resolveCombatMode(leaderPosition, enemies, combatActive, partyMembers = []) {
    if (combatActive) return true;
    if (!leaderPosition) return false;
    if (hasThreatWithinRadius(leaderPosition, enemies, THREAT_NEAR_RADIUS)) return true;
    for (const member of partyMembers) {
      if (!member || member.downed) continue;
      if (hasThreatWithinRadius(member, enemies, THREAT_NEAR_RADIUS - 0.3)) {
        return true;
      }
    }
    return false;
  }

  getActiveCharacter() {
    return this.activeCharacterId;
  }

  showElaineStaging(sceneId, position) {
    this.clearStaging();
    const pos = new THREE.Vector2(position.x, position.y);
    const sprite = this._createElaineBillboard(pos, { opacity: 0.96, depthBaseOrder: 1182 });
    this.elaineStaging = {
      sceneId,
      position: pos,
      sprite,
      facing: "down",
      walkTimer: 0,
      lastPosition: pos.clone(),
      weaponAttachment: null,
    };
    this._attachElaineWeaponVisuals(this.elaineStaging);
    this._syncPresence();
  }

  clearStaging() {
    if (this.elaineStaging) {
      this._detachElaineWeaponVisuals(this.elaineStaging);
      this.elaineStaging.sprite.dispose();
      this.elaineStaging = null;
    }
  }

  setFollowerHold(seconds = 0) {
    this.followerHoldRemaining = Math.max(this.followerHoldRemaining, Math.max(0, Number(seconds) || 0));
  }

  spawnProjectile(
    from,
    to,
    {
      texture = this._projectileTexture,
      color = "#ffffff",
      lifetime = PROJECTILE_LIFETIME,
      baseY = -0.45,
      arcHeight = 0.08,
      scale = 0.16,
      renderBase = 1206,
    } = {}
  ) {
    const mesh = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
      })
    );
    mesh.scale.set(scale, scale, 1);
    mesh.position.set(from.x, baseY, from.y);
    mesh.renderOrder = resolveDepthOrder(from.y, renderBase);
    this.root.add(mesh);
    const life = Math.max(0.05, Number(lifetime) || PROJECTILE_LIFETIME);
    this.projectiles.push({
      mesh,
      from: from.clone(),
      to: to.clone(),
      life,
      maxLife: life,
      baseY,
      arcHeight,
      renderBase,
    });
  }

  clearProjectiles() {
    for (const projectile of this.projectiles) {
      disposeMesh(projectile.mesh, this.root);
    }
    this.projectiles.length = 0;
  }

  _findEnemyTargetById(enemyId) {
    if (!enemyId) return null;
    const snapshots = this.combatSystem.getEnemySnapshots?.() ?? [];
    const target = snapshots.find((enemy) => enemy.id === enemyId && enemy.state !== "dead");
    if (!target) return null;
    return {
      id: target.id,
      x: target.x,
      z: target.z,
      kind: "enemy",
    };
  }

  _resolveSupportTargetByPoint(point, maxRange = ELAINE_ATTACK_RANGE) {
    if (!point) return null;
    const probe = new THREE.Vector2(Number(point.x) || 0, Number(point.y ?? point.z) || 0);
    const target = this.combatSystem.getClosestAliveEnemy(probe, maxRange);
    if (!target) return null;
    return {
      id: target.id,
      x: target.x,
      z: target.z,
      kind: "enemy",
    };
  }

  _fireSupportShot(
    target,
    {
      damage = ELAINE_ATTACK_DAMAGE,
      knockback = 0.42,
      staggerSeconds = 0.08,
      cooldown = ELAINE_ATTACK_COOLDOWN,
      spawnProjectile = true,
      sourcePosition = null,
    } = {}
  ) {
    if (!target) return 0;
    const from = sourcePosition
      ? new THREE.Vector2(sourcePosition.x, sourcePosition.y ?? sourcePosition.z)
      : this.elaineFollower
        ? this.elaineFollower.position.clone()
        : null;
    if (!from) return 0;
    const to = new THREE.Vector2(target.x, target.z);
    if (spawnProjectile) {
      this.spawnProjectile(from, to);
    }

    if (target.kind === "guardian" && this.onSupportHit) {
      const dealt = this.onSupportHit({
        targetId: target.id ?? "guardian",
        kind: "guardian",
        amount: damage,
        from,
      });
      this.elaineAttackCooldown = Math.max(0, Number(cooldown) || 0);
      return Math.max(0, Number(dealt) || 0);
    }

    const dealt = this.combatSystem.applySupportDamageToEnemy(target.id, damage, from, {
      knockback,
      staggerSeconds,
      attackerId: "elaine",
      attackType: "bolt",
      damageType: "holy",
      source: "elaine_support",
      consumeStatusCharges: true,
    });
    this.elaineAttackCooldown = Math.max(0, Number(cooldown) || 0);
    return dealt;
  }

  triggerHolyBolt(
    targetEnemyId = null,
    targetPoint = null,
    damageMultiplier = 1,
    {
      sourcePosition = null,
      cooldown = HOLY_BOLT_COOLDOWN,
      ignoreCooldown = false,
      maxRange = ELAINE_ATTACK_RANGE,
    } = {}
  ) {
    if (!this.elaineJoined || this.followerHoldRemaining > 0) return 0;
    if (!ignoreCooldown && this.holyBoltCooldown > 0) return 0;
    const source =
      sourcePosition != null
        ? new THREE.Vector2(sourcePosition.x, sourcePosition.y ?? sourcePosition.z)
        : this.elaineFollower
          ? this.elaineFollower.position.clone()
          : null;
    if (!source) return 0;

    const callbackTarget =
      this.getSupportTarget?.(source, Math.max(0, Number(maxRange) || ELAINE_ATTACK_RANGE)) ?? null;
    const target =
      (callbackTarget && callbackTarget.id === targetEnemyId
        ? {
            id: callbackTarget.id,
            x: callbackTarget.x,
            z: callbackTarget.z,
            kind: callbackTarget.kind ?? "enemy",
          }
        : null) ||
      this._findEnemyTargetById(targetEnemyId) ||
      (callbackTarget
        ? {
            id: callbackTarget.id,
            x: callbackTarget.x,
            z: callbackTarget.z,
            kind: callbackTarget.kind ?? "enemy",
          }
        : null) ||
      this._resolveSupportTargetByPoint(targetPoint ?? source, Math.max(0, Number(maxRange) || ELAINE_ATTACK_RANGE));
    if (!target) return 0;

    const dealt = this._fireSupportShot(target, {
      damage: HOLY_BOLT_DAMAGE * Math.max(0.1, Number(damageMultiplier) || 1),
      knockback: 0.32,
      staggerSeconds: 0.04,
      cooldown: 0,
      spawnProjectile: true,
      sourcePosition: source,
    });
    if (dealt > 0) {
      this.holyBoltCooldown = ignoreCooldown ? 0 : Math.max(0, Number(cooldown) || HOLY_BOLT_COOLDOWN);
    }
    return dealt;
  }

  _fireWillowShot(
    target,
    {
      sourcePosition = null,
      damage = WILLOW_ATTACK_DAMAGE,
      knockback = 0.36,
      staggerSeconds = 0.05,
      cooldown = 0.72,
      spawnProjectile = true,
    } = {}
  ) {
    if (!target) return 0;
    const from = sourcePosition
      ? new THREE.Vector2(sourcePosition.x, sourcePosition.y ?? sourcePosition.z)
      : this.willowFollower
        ? this.willowFollower.position.clone()
        : null;
    if (!from) return 0;
    const to = new THREE.Vector2(target.x, target.z);
    if (spawnProjectile) {
      this.spawnProjectile(from, to, {
        texture: this._willowProjectileTexture,
        color: "#92f2d8",
        lifetime: WILLOW_PROJECTILE_LIFETIME,
        baseY: -0.43,
        arcHeight: 0.06,
        scale: 0.17,
        renderBase: 1209,
      });
    }
    const dealt = this.combatSystem.applySupportDamageToEnemy(target.id, damage, from, {
      knockback,
      staggerSeconds,
      attackerId: "willow",
      attackType: "bolt",
      damageType: "arcane",
      source: "willow_bolt",
      consumeStatusCharges: true,
    });
    if (dealt > 0) {
      this.willowShotCount += 1;
    }
    this.willowAttackCooldown = Math.max(0, Number(cooldown) || 0);
    return dealt;
  }

  triggerWillowBolt(
    targetEnemyId = null,
    targetPoint = null,
    {
      sourcePosition = null,
      damage = WILLOW_ATTACK_DAMAGE,
      cooldown = 0.72,
      ignoreCooldown = false,
    } = {}
  ) {
    if (!this.willowJoined) return 0;
    if (!ignoreCooldown && this.willowAttackCooldown > 0) return 0;
    const source =
      sourcePosition
        ? new THREE.Vector2(sourcePosition.x, sourcePosition.y ?? sourcePosition.z)
        : this.willowFollower
          ? this.willowFollower.position.clone()
          : null;
    if (!source) return 0;

    const target =
      this._findEnemyTargetById(targetEnemyId) ||
      this._resolveSupportTargetByPoint(targetPoint ?? source, WILLOW_ATTACK_RANGE);
    if (!target) return 0;

    return this._fireWillowShot(target, {
      sourcePosition: source,
      damage: Math.max(0, Number(damage) || WILLOW_ATTACK_DAMAGE),
      cooldown,
      knockback: 0.32,
      staggerSeconds: 0.04,
    });
  }

  _applySeparation(memberRecord, partyMembers, desiredPosition) {
    const separation = computeSeparationVector(
      memberRecord,
      partyMembers,
      SEPARATION_RADIUS,
      SEPARATION_STRENGTH
    );
    return {
      x: desiredPosition.x + separation.x,
      z: desiredPosition.z + separation.z,
    };
  }

  _updateArthurProxyAi(
    dtSeconds,
    leaderRecord,
    partyMembers,
    enemies,
    { tacticsMode = "balanced", combatMode = false } = {}
  ) {
    const arthur = partyMembers.find((member) => member.id === "arthur");
    if (!arthur) return;
    if (this.activeCharacterId === "arthur") {
      this._arthurProxyPosition.set(arthur.x, arthur.z);
      this._recordAiState({
        id: "arthur",
        position: { x: arthur.x, z: arthur.z },
        aiState: "player",
        threatId: "",
        desiredRange: 0,
        mode: tacticsMode,
      });
      return;
    }
    if (arthur.downed) {
      this._recordAiState({
        id: "arthur",
        position: { x: this._arthurProxyPosition.x, z: this._arthurProxyPosition.y },
        aiState: "recover",
        threatId: "",
        desiredRange: 0,
        mode: tacticsMode,
      });
      return;
    }
    const threat = combatMode ? chooseThreat(partyMembers, enemies, "arthur", leaderRecord?.id ?? "arthur") : null;
    const followAnchor = this._getFollowAnchor("arthur", leaderRecord ?? arthur);
    const desired = threat
      ? computeDesiredPosition(arthur, "arthur", tacticsMode, threat, partyMembers, enemies, {
          leader: leaderRecord,
          followAnchor,
          meleeRange: ARTHUR_MELEE_RANGE,
        })
      : {
          x: followAnchor.x,
          z: followAnchor.z,
          desiredRange: ARTHUR_MELEE_RANGE * 0.9,
          stateHint: "follow",
          distToThreat: null,
        };
    const separated = this._applySeparation(arthur, partyMembers, desired);
    const speedScale = tacticsMode === "defensive" ? 0.94 : tacticsMode === "aggressive" ? 1.08 : 1;
    this._movePointToward(this._arthurProxyPosition, separated, dtSeconds, ARTHUR_AI_SPEED * speedScale);
    arthur.x = this._arthurProxyPosition.x;
    arthur.z = this._arthurProxyPosition.y;
    this._recordAiState({
      id: "arthur",
      position: { x: arthur.x, z: arthur.z },
      aiState: combatMode ? desired.stateHint || "intercept" : "follow",
      threatId: threat?.id ?? "",
      distToThreat:
        threat == null ? null : Math.hypot((threat.x ?? 0) - arthur.x, (threat.z ?? 0) - arthur.z),
      desiredRange: desired.desiredRange ?? ARTHUR_MELEE_RANGE * 0.9,
      mode: tacticsMode,
    });
  }

  _updateElaineFollower(
    dtSeconds,
    elapsedSeconds,
    camera,
    leaderRecord,
    partyMembers,
    enemies,
    {
      tacticsMode = "balanced",
      combatMode = false,
      castRooted = false,
      preferredTargetEnemyId = "",
      downed = false,
    } = {}
  ) {
    if (!this.elaineFollower) return 0;
    this.elaineAttackCooldown = Math.max(0, this.elaineAttackCooldown - dtSeconds);

    const elaineRecord = partyMembers.find((member) => member.id === "elaine");
    if (elaineRecord) {
      elaineRecord.x = this.elaineFollower.position.x;
      elaineRecord.z = this.elaineFollower.position.y;
    }
    if (downed) {
      this._recordAiState({
        id: "elaine",
        position: { x: this.elaineFollower.position.x, z: this.elaineFollower.position.y },
        aiState: "recover",
        threatId: "",
        desiredRange: 0,
        mode: tacticsMode,
      });
      this._updateFollowerVisual(this.elaineFollower, dtSeconds, elapsedSeconds, camera, {
        castActive: false,
        castRatio: 0,
      });
      return 0;
    }

    const threat = combatMode ? chooseThreat(partyMembers, enemies, "elaine", leaderRecord?.id ?? "arthur") : null;
    const followAnchor = this._getFollowAnchor("elaine", leaderRecord ?? this.elaineFollower.position);
    const desired = computeDesiredPosition(
      {
        id: "elaine",
        x: this.elaineFollower.position.x,
        z: this.elaineFollower.position.y,
      },
      "elaine",
      tacticsMode,
      threat,
      partyMembers,
      enemies,
      {
        leader: leaderRecord,
        followAnchor,
        castingRooted: castRooted,
      }
    );
    const separated = castRooted
      ? { x: this.elaineFollower.position.x, z: this.elaineFollower.position.y }
      : this._applySeparation(
          {
            id: "elaine",
            x: this.elaineFollower.position.x,
            z: this.elaineFollower.position.y,
          },
          partyMembers,
          desired
        );
    const speedScale = tacticsMode === "defensive" ? 0.92 : tacticsMode === "aggressive" ? 1.05 : 1;
    if (!castRooted) {
      this._movePointToward(this.elaineFollower.position, separated, dtSeconds, FOLLOW_SPEED * speedScale);
    }

    if (elaineRecord) {
      elaineRecord.x = this.elaineFollower.position.x;
      elaineRecord.z = this.elaineFollower.position.y;
    }
    this._recordAiState({
      id: "elaine",
      position: { x: this.elaineFollower.position.x, z: this.elaineFollower.position.y },
      aiState: castRooted ? "support_cast" : combatMode ? desired.stateHint || "engage" : "follow",
      threatId: threat?.id ?? "",
      distToThreat:
        threat == null
          ? null
          : Math.hypot(
              (threat.x ?? 0) - this.elaineFollower.position.x,
              (threat.z ?? 0) - this.elaineFollower.position.y
            ),
      desiredRange: desired.desiredRange ?? 4,
      mode: tacticsMode,
    });

    this._updateFollowerVisual(this.elaineFollower, dtSeconds, elapsedSeconds, camera, {
      castActive: castRooted,
      castRatio: castRooted ? 0.72 : 0,
    });

    if (castRooted || this.elaineAttackCooldown > 0) {
      return 0;
    }

    const callbackTarget = this.getSupportTarget?.(this.elaineFollower.position, ELAINE_ATTACK_RANGE) ?? null;
    const preferredTarget = this._findEnemyTargetById(preferredTargetEnemyId);
    const fallbackTarget = this.combatSystem.getClosestAliveEnemy(this.elaineFollower.position, ELAINE_ATTACK_RANGE);
    const target = callbackTarget
      ? {
          ...callbackTarget,
          x: callbackTarget.x,
          z: callbackTarget.z,
          kind: callbackTarget.kind ?? "enemy",
        }
      : preferredTarget
        ? { id: preferredTarget.id, x: preferredTarget.x, z: preferredTarget.z, kind: "enemy" }
        : fallbackTarget
          ? { id: fallbackTarget.id, x: fallbackTarget.x, z: fallbackTarget.z, kind: "enemy" }
          : null;
    if (!target) return 0;
    return this._fireSupportShot(target);
  }

  _updateWillowFollower(
    dtSeconds,
    elapsedSeconds,
    camera,
    leaderRecord,
    partyMembers,
    enemies,
    { tacticsMode = "balanced", combatMode = false, preferredTargetEnemyId = "", downed = false } = {}
  ) {
    if (!this.willowFollower) return 0;
    this.willowAttackCooldown = Math.max(0, this.willowAttackCooldown - dtSeconds);

    const willowRecord = partyMembers.find((member) => member.id === "willow");
    if (willowRecord) {
      willowRecord.x = this.willowFollower.position.x;
      willowRecord.z = this.willowFollower.position.y;
    }
    if (downed) {
      this._recordAiState({
        id: "willow",
        position: { x: this.willowFollower.position.x, z: this.willowFollower.position.y },
        aiState: "recover",
        threatId: "",
        desiredRange: 0,
        mode: tacticsMode,
      });
      this._updateFollowerVisual(this.willowFollower, dtSeconds, elapsedSeconds, camera, {
        castActive: false,
        castRatio: 0,
      });
      return 0;
    }

    const threat = combatMode ? chooseThreat(partyMembers, enemies, "willow", leaderRecord?.id ?? "arthur") : null;
    const followAnchor = this._getFollowAnchor("willow", leaderRecord ?? this.willowFollower.position);
    const desired = computeDesiredPosition(
      {
        id: "willow",
        x: this.willowFollower.position.x,
        z: this.willowFollower.position.y,
      },
      "willow",
      tacticsMode,
      threat,
      partyMembers,
      enemies,
      {
        leader: leaderRecord,
        followAnchor,
      }
    );
    const separated = this._applySeparation(
      {
        id: "willow",
        x: this.willowFollower.position.x,
        z: this.willowFollower.position.y,
      },
      partyMembers,
      desired
    );
    const speedScale = tacticsMode === "defensive" ? 0.9 : tacticsMode === "aggressive" ? 1.08 : 1;
    this._movePointToward(this.willowFollower.position, separated, dtSeconds, WILLOW_FOLLOW_SPEED * speedScale);

    if (willowRecord) {
      willowRecord.x = this.willowFollower.position.x;
      willowRecord.z = this.willowFollower.position.y;
    }
    this._recordAiState({
      id: "willow",
      position: { x: this.willowFollower.position.x, z: this.willowFollower.position.y },
      aiState: combatMode ? desired.stateHint || "engage" : "follow",
      threatId: threat?.id ?? "",
      distToThreat:
        threat == null
          ? null
          : Math.hypot(
              (threat.x ?? 0) - this.willowFollower.position.x,
              (threat.z ?? 0) - this.willowFollower.position.y
            ),
      desiredRange: desired.desiredRange ?? 5,
      mode: tacticsMode,
    });

    this._updateFollowerVisual(this.willowFollower, dtSeconds, elapsedSeconds, camera, {
      castActive: false,
      castRatio: 0,
    });

    if (this.willowAttackCooldown > 0) return 0;
    const callbackTarget =
      this.getWillowTarget?.(this.willowFollower.position, WILLOW_ATTACK_RANGE, preferredTargetEnemyId) ?? null;
    const preferredTarget = this._findEnemyTargetById(preferredTargetEnemyId);
    const nearest = this.combatSystem.getClosestAliveEnemy(this.willowFollower.position, WILLOW_ATTACK_RANGE);
    const target = callbackTarget
      ? {
          id: callbackTarget.id,
          x: callbackTarget.x,
          z: callbackTarget.z,
          kind: callbackTarget.kind ?? "enemy",
        }
      : preferredTarget
        ? { id: preferredTarget.id, x: preferredTarget.x, z: preferredTarget.z, kind: "enemy" }
        : nearest
          ? { id: nearest.id, x: nearest.x, z: nearest.z, kind: "enemy" }
          : null;
    if (!target) return 0;

    const fireCooldown = tacticsMode === "aggressive" ? 0.58 : tacticsMode === "defensive" ? 0.86 : 0.72;
    return this._fireWillowShot(target, {
      sourcePosition: this.willowFollower.position,
      damage: WILLOW_ATTACK_DAMAGE,
      cooldown: fireCooldown,
      knockback: 0.34,
      staggerSeconds: 0.05,
    });
  }

  _updateProjectiles(dtSeconds) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.life = Math.max(0, projectile.life - dtSeconds);
      const t = 1 - projectile.life / projectile.maxLife;
      const x = projectile.from.x + (projectile.to.x - projectile.from.x) * t;
      const z = projectile.from.y + (projectile.to.y - projectile.from.y) * t;
      projectile.mesh.position.set(
        x,
        (projectile.baseY ?? -0.45) + Math.sin(t * Math.PI) * (projectile.arcHeight ?? 0.08),
        z
      );
      projectile.mesh.material.opacity = clamp(projectile.life / projectile.maxLife, 0, 1) * 0.96;
      projectile.mesh.renderOrder = resolveDepthOrder(z, (projectile.renderBase ?? 1208) + 2);
      if (projectile.life <= 0) {
        disposeMesh(projectile.mesh, this.root);
        this.projectiles.splice(i, 1);
      }
    }
  }

  update({
    dtSeconds,
    elapsedSeconds,
    sceneId,
    camera,
    playerPosition,
    tacticsMode = "balanced",
    preferredTargetEnemyId = "",
    combatActive = false,
    bossInstanceActive = false,
    partyVitals = null,
    elaineCastRooted = false,
  }) {
    if (sceneId !== this.activeSceneId) {
      this.setActiveScene(sceneId, playerPosition);
    }
    this._syncArthurProxy(playerPosition);

    if (this.elaineStaging) {
      this._updateElaineWeaponVisuals(this.elaineStaging, {
        dtSeconds,
        elapsedSeconds,
        castActive: false,
        castRatio: 0,
      });
      this.elaineStaging.sprite.update(dtSeconds, elapsedSeconds, camera, 1);
    }

    this.followerHoldRemaining = Math.max(0, this.followerHoldRemaining - dtSeconds);
    this.holyBoltCooldown = Math.max(0, this.holyBoltCooldown - dtSeconds);

    const enemies = this._getAliveEnemies();
    const partyMembers = this._buildPartyMembers(playerPosition, partyVitals);
    const leaderRecord =
      partyMembers.find((member) => member.id === this.activeCharacterId) ??
      partyMembers.find((member) => member.id === "arthur") ??
      partyMembers[0] ??
      null;
    const combatMode = this._resolveCombatMode(
      leaderRecord ? { x: leaderRecord.x, z: leaderRecord.z } : null,
      enemies,
      combatActive,
      partyMembers
    );
    this._aiFrame = {
      combatActive: Boolean(combatMode),
      bossActive: Boolean(bossInstanceActive),
      currentMode: tacticsMode,
      members: [],
    };
    for (const member of partyMembers.filter((entry) => entry.active)) {
      this._recordAiState({
        id: member.id,
        position: { x: member.x, z: member.z },
        aiState: "player",
        threatId: "",
        distToThreat: null,
        desiredRange: 0,
        mode: tacticsMode,
      });
    }

    this._updateArthurProxyAi(dtSeconds, leaderRecord, partyMembers, enemies, {
      tacticsMode,
      combatMode,
    });

    let damageDealt = 0;
    if (this.elaineJoined) {
      damageDealt =
        this.followerHoldRemaining > 0
          ? 0
          : this._updateElaineFollower(dtSeconds, elapsedSeconds, camera, leaderRecord, partyMembers, enemies, {
              tacticsMode,
              combatMode,
              castRooted: Boolean(elaineCastRooted),
              preferredTargetEnemyId,
              downed: Boolean(partyMembers.find((member) => member.id === "elaine")?.downed),
            });
    }
    if (this.willowJoined && this.followerHoldRemaining <= 0) {
      damageDealt += this._updateWillowFollower(dtSeconds, elapsedSeconds, camera, leaderRecord, partyMembers, enemies, {
        tacticsMode,
        combatMode,
        preferredTargetEnemyId,
        downed: Boolean(partyMembers.find((member) => member.id === "willow")?.downed),
      });
    } else if (this.willowJoined) {
      const willowPosition = this._resolveMemberPosition("willow", playerPosition);
      this._recordAiState({
        id: "willow",
        position: willowPosition,
        aiState: "follow",
        threatId: "",
        distToThreat: null,
        desiredRange: 0,
        mode: tacticsMode,
      });
    }
    const recordedIds = new Set(this._aiFrame.members.map((member) => member.id));
    for (const member of partyMembers) {
      if (recordedIds.has(member.id)) continue;
      this._recordAiState({
        id: member.id,
        position: { x: member.x, z: member.z },
        aiState: member.downed ? "recover" : member.active ? "player" : combatMode ? "engage" : "follow",
        threatId: "",
        distToThreat: null,
        desiredRange: 0,
        mode: tacticsMode,
      });
    }
    this._updateProjectiles(dtSeconds);
    return {
      damageDealt,
      ai: this.getAiState(),
    };
  }

  getState() {
    const members = ["Arthur"];
    if (this.elaineJoined) members.push("Elaine");
    if (this.willowJoined) members.push("Willow");
    return {
      joined: this.elaineJoined || this.willowJoined,
      willowJoined: this.willowJoined,
      members,
      activeCharacter: this.activeCharacterId,
      stagingVisible: Boolean(this.elaineStaging),
      followerVisible: Boolean(this.elaineFollower),
      willowFollowerVisible: Boolean(this.willowFollower),
      follower: this.elaineFollower
        ? {
            x: Number(this.elaineFollower.position.x.toFixed(3)),
            z: Number(this.elaineFollower.position.y.toFixed(3)),
          }
        : null,
      willowFollower: this.willowFollower
        ? {
            x: Number(this.willowFollower.position.x.toFixed(3)),
            z: Number(this.willowFollower.position.y.toFixed(3)),
          }
        : null,
      arthurProxy:
        this._arthurProxyInitialized
          ? {
              x: Number(this._arthurProxyPosition.x.toFixed(3)),
              z: Number(this._arthurProxyPosition.y.toFixed(3)),
            }
          : null,
      projectiles: this.projectiles.length,
      holyBoltCooldown: Number(this.holyBoltCooldown.toFixed(3)),
      willowBoltCooldown: Number(this.willowAttackCooldown.toFixed(3)),
      willowShotCount: this.willowShotCount,
      ai: this.getAiState(),
    };
  }

  getAiState() {
    return {
      combatActive: Boolean(this._aiFrame.combatActive),
      bossActive: Boolean(this._aiFrame.bossActive),
      currentMode: this._aiFrame.currentMode ?? "balanced",
      members: (this._aiFrame.members ?? []).map((member) => ({ ...member })),
    };
  }

  _snapshotFollowerRenderState(entity) {
    if (!entity) {
      return {
        hasBase: false,
        baseVisible: false,
        hasWeapon: false,
        weaponScale: 0,
        groupScale: 0,
      };
    }
    const baseMesh = entity.sprite?.mesh ?? null;
    const weaponSprite = entity.weaponAttachment?.weaponSprite ?? null;
    const baseScale = Number(baseMesh?.scale?.x ?? 1);
    return {
      hasBase: Boolean(baseMesh),
      baseVisible: Boolean(baseMesh?.visible ?? false),
      hasWeapon: Boolean(weaponSprite?.visible ?? false),
      weaponScale: Number((weaponSprite?.scale?.x ?? 0).toFixed(3)),
      groupScale: Number(baseScale.toFixed(3)),
    };
  }

  getRenderState() {
    return {
      activeCharacter: this.activeCharacterId,
      arthur: {
        active: this.activeCharacterId === "arthur",
        hasBase: this.activeCharacterId === "arthur",
        baseVisible: this.activeCharacterId === "arthur",
        hasWeapon: false,
        weaponScale: 0,
        groupScale: 1,
      },
      elaine: {
        active: this.activeCharacterId === "elaine",
        ...this._snapshotFollowerRenderState(this.elaineFollower),
      },
      willow: {
        active: this.activeCharacterId === "willow",
        ...this._snapshotFollowerRenderState(this.willowFollower),
      },
    };
  }

  dispose() {
    this.clearProjectiles();
    this.clearStaging();
    if (this.elaineFollower) {
      this._detachElaineWeaponVisuals(this.elaineFollower);
      this.elaineFollower.sprite.dispose();
      this.elaineFollower = null;
    }
    if (this.willowFollower) {
      this.willowFollower.sprite.dispose();
      this.willowFollower = null;
    }
    for (const record of this._weaponTextureCache.values()) {
      record.disposed = true;
      record.texture?.dispose?.();
      if (record.fallbackTexture && record.fallbackTexture !== record.texture) {
        record.fallbackTexture.dispose?.();
      }
    }
    this._weaponTextureCache.clear();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
    this._projectileTexture.dispose();
    this._willowProjectileTexture.dispose();
  }
}
