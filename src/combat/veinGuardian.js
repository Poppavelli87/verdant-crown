import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { getEnemyRoleProfile } from "./enemy.js";
import { DamageSystem } from "./damageSystem.js";
import { resolveDepthOrder } from "../render/billboard.js";

const AUTOMATED_TEST_MODE = typeof navigator !== "undefined" && Boolean(navigator.webdriver);

const GUARDIAN_ID = "vein-guardian";
const MAX_HP = Math.round(getEnemyRoleProfile("brute").maxHealth * 3);
const COLLISION_RADIUS = 0.92;
const BASE_MOVE_SPEED = 0.22;
const PHASE3_MOVE_SPEED = 0.36;
const SHIELD_DURATION_SECONDS = 2.0;
const SHIELD_COOLDOWN_SECONDS = 7.2;
const SHIELD_SYNERGY_WINDOW_SECONDS = 1.0;
const TELEGRAPH_SECONDS = 0.6;
const PULSE_RADIUS_PHASE1 = 1.55;
const PULSE_RADIUS_PHASE3 = 1.85;
const PULSE_DAMAGE_PHASE1 = 11;
const PULSE_DAMAGE_PHASE3 = 13;
const PROJECTILE_DAMAGE = 9;
const PROJECTILE_SPEED = 1.5;
const PROJECTILE_LIFETIME = 3.1;
const SPIKE_DAMAGE = 12;
const SPIKE_RADIUS = 0.42;
const SUMMON_INTERVAL_PHASE2 = 8.0;
const PHASE1_PULSE_INTERVAL = 3.0;
const PHASE2_PULSE_INTERVAL = 2.75;
const PHASE2_PROJECTILE_INTERVAL = 4.2;
const PHASE3_PULSE_INTERVAL = 2.1;
const PHASE3_SPIKE_INTERVAL = 3.3;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function applyPixelTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGuardianFallbackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 64, 64);

  const fillSym = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(64 - x - w, y, w, h);
  };

  fillSym(30, 10, 4, 44, "#111b1a");
  fillSym(27, 16, 3, 31, "#2e4c43");
  fillSym(34, 16, 3, 31, "#2e4c43");
  fillSym(22, 22, 5, 24, "#223a34");
  fillSym(16, 28, 6, 17, "#1c2f2b");
  fillSym(12, 35, 5, 11, "#172723");
  fillSym(25, 18, 3, 6, "#79d9a1");
  fillSym(21, 25, 2, 4, "#57b884");
  fillSym(18, 31, 2, 4, "#57b884");
  fillSym(23, 42, 2, 5, "#57b884");
  ctx.fillStyle = "#8cefb0";
  ctx.fillRect(31, 23, 2, 10);
  ctx.fillRect(30, 33, 4, 3);

  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.fillRect(18, 56, 28, 4);

  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function createProjectileTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 12;
  canvas.height = 12;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 12, 12);
  ctx.fillStyle = "#d2ffe1";
  ctx.fillRect(5, 5, 2, 2);
  ctx.fillStyle = "#8ff1a8";
  ctx.fillRect(4, 5, 1, 1);
  ctx.fillRect(7, 6, 1, 1);
  ctx.fillRect(5, 4, 1, 1);
  ctx.fillRect(6, 7, 1, 1);
  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function disposeMesh(mesh, root) {
  if (!mesh) return;
  if (mesh.parent === root) {
    root.remove(mesh);
  }
  mesh.geometry?.dispose?.();
  const material = mesh.material;
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry?.dispose?.();
    }
  } else {
    material?.dispose?.();
  }
}

export class VeinGuardian {
  constructor({
    threeScene,
    damageSystem = new DamageSystem(),
    vfxSystem = null,
    spriteAssetPath = "./assets/sprites/enemies/guardian_manifestation.png",
    spriteTint = "#d9fbe1",
    glowColor = "#8bf4ae",
    shadowOpacity = 0.2,
  }) {
    this.threeScene = threeScene;
    this.damageSystem = damageSystem;
    this.vfxSystem = vfxSystem;

    this.root = new THREE.Group();
    this.root.name = "vein-guardian-root";
    this.threeScene.add(this.root);

    this.spriteFallbackTexture = createGuardianFallbackTexture();
    this.projectileTexture = createProjectileTexture();

    this.position = new THREE.Vector2(0, 0);
    this.anchor = new THREE.Vector2(0, 0);
    this.active = false;
    this.defeated = false;
    this.justDefeated = false;
    this.hp = MAX_HP;
    this.maxHP = MAX_HP;
    this.phase = 1;
    this.spriteAssetPath = String(spriteAssetPath || "./assets/sprites/enemies/guardian_manifestation.png");

    this.shieldActive = false;
    this.shieldRemaining = 0;
    this.shieldCooldownRemaining = SHIELD_COOLDOWN_SECONDS;
    this.shieldSynergyWindowRemaining = 0;

    this.pulseTimer = 0;
    this.projectileTimer = 0;
    this.spikeTimer = 0;
    this.summonTimer = 0;
    this.patternCounter = 0;

    this.pendingAttack = null;
    this.telegraphCount = 0;
    this.projectiles = [];
    this.spikeEchoes = [];
    this.damageDealtThisFrame = 0;
    this.damageTakenThisFrame = 0;
    this.recentPulseHit = false;

    this.group = new THREE.Group();
    this.group.visible = false;
    this.root.add(this.group);

    this.spriteMaterial = new THREE.SpriteMaterial({
      map: this.spriteFallbackTexture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      opacity: 1,
      color: spriteTint || "#d9fbe1",
    });
    this.sprite = new THREE.Sprite(this.spriteMaterial);
    this.sprite.center.set(0.5, 0.18);
    this.sprite.scale.set(2.4, 2.7, 1);
    this.group.add(this.sprite);

    this.coreGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.46, 24),
      new THREE.MeshBasicMaterial({
        color: glowColor || "#8bf4ae",
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.coreGlow.rotation.x = -Math.PI / 2;
    this.coreGlow.position.y = -0.56;
    this.group.add(this.coreGlow);

    this.shieldRing = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 1.05, 36),
      new THREE.MeshBasicMaterial({
        color: "#b5ffca",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.shieldRing.rotation.x = -Math.PI / 2;
    this.shieldRing.position.y = -0.83;
    this.group.add(this.shieldRing);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 28),
      new THREE.MeshBasicMaterial({
        color: "#000000",
        transparent: true,
        opacity: Math.max(0, Math.min(1, Number(shadowOpacity) || 0.2)),
        depthWrite: false,
      })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -0.885;
    this.group.add(this.shadow);

    this._loadSpriteTexture(this.spriteAssetPath);
  }

  _loadSpriteTexture(path) {
    if (AUTOMATED_TEST_MODE) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const texture = applyPixelTextureSettings(new THREE.Texture(image));
      this.spriteMaterial.map = texture;
      this.spriteMaterial.needsUpdate = true;
    };
    image.onerror = () => {};
    image.src = path;
  }

  isActive() {
    return this.active;
  }

  isDefeated() {
    return this.defeated;
  }

  spawn(position = { x: 0, y: 0 }) {
    this.active = true;
    this.defeated = false;
    this.justDefeated = false;
    this.hp = this.maxHP;
    this.phase = 1;
    this.position.set(position.x, position.y);
    this.anchor.set(position.x, position.y);
    this.group.visible = true;

    this.shieldActive = false;
    this.shieldRemaining = 0;
    this.shieldCooldownRemaining = 4.6;
    this.shieldSynergyWindowRemaining = 0;

    this.pulseTimer = 1.3;
    this.projectileTimer = 3.2;
    this.spikeTimer = 2.5;
    this.summonTimer = 5.2;
    this.patternCounter = 0;
    this.pendingAttack = null;
    this.telegraphCount = 0;
    this.damageDealtThisFrame = 0;
    this.damageTakenThisFrame = 0;
    this.recentPulseHit = false;
    this._clearProjectiles();
    this._clearSpikeEchoes();
    return true;
  }

  clear() {
    this.active = false;
    this.pendingAttack = null;
    this.telegraphCount = 0;
    this.shieldActive = false;
    this.shieldRemaining = 0;
    this.shieldSynergyWindowRemaining = 0;
    this.group.visible = false;
    this.damageDealtThisFrame = 0;
    this.damageTakenThisFrame = 0;
    this.recentPulseHit = false;
    this._clearProjectiles();
    this._clearSpikeEchoes();
  }

  _clearProjectiles() {
    for (const projectile of this.projectiles) {
      disposeMesh(projectile.mesh, this.root);
    }
    this.projectiles.length = 0;
  }

  _clearSpikeEchoes() {
    for (const spike of this.spikeEchoes) {
      disposeMesh(spike.mesh, this.root);
    }
    this.spikeEchoes.length = 0;
  }

  pickAtWorldPoint(worldPoint, radius = 0.82) {
    if (!this.active || !worldPoint) return null;
    const distance = Math.hypot(worldPoint.x - this.position.x, worldPoint.y - this.position.y);
    if (distance > COLLISION_RADIUS + radius) return null;
    return {
      id: GUARDIAN_ID,
      x: this.position.x,
      z: this.position.y,
      distance,
    };
  }

  getTargetPoint() {
    if (!this.active) return null;
    return {
      id: GUARDIAN_ID,
      x: this.position.x,
      z: this.position.y,
    };
  }

  _resolvePhase() {
    const ratio = this.hp / this.maxHP;
    if (ratio > 2 / 3) return 1;
    if (ratio > 1 / 3) return 2;
    return 3;
  }

  _startTelegraph(type, position, radius, color = "#a7f4ba") {
    this.pendingAttack = {
      type,
      telegraphRemaining: TELEGRAPH_SECONDS,
      position: position.clone(),
      radius,
      data: {},
    };
    this.telegraphCount += 1;
    this.vfxSystem?.spawnGroundRing?.({
      position,
      innerRadius: Math.max(0.2, radius * 0.84),
      outerRadius: Math.max(0.28, radius),
      color,
      life: TELEGRAPH_SECONDS + 0.02,
      opacity: 0.9,
      spread: 0.12,
    });
  }

  _startPulseTelegraph() {
    const pulseRadius = this.phase >= 3 ? PULSE_RADIUS_PHASE3 : PULSE_RADIUS_PHASE1;
    this._startTelegraph("pulse", this.position, pulseRadius, "#b2f8bf");
  }

  _startProjectileTelegraph() {
    this._startTelegraph("projectile", this.position, 0.95, "#a4f4b4");
  }

  _buildSpikePattern() {
    const index = this.patternCounter % 4;
    this.patternCounter += 1;

    const points = [];
    if (index % 2 === 0) {
      const axis = index === 0 ? new THREE.Vector2(1, 0) : new THREE.Vector2(0.7, 0.7).normalize();
      const perpendicular = new THREE.Vector2(-axis.y, axis.x);
      for (let i = -2; i <= 2; i += 1) {
        const distance = i * 0.54;
        const spread = (Math.abs(i) % 2) * 0.16;
        points.push(
          new THREE.Vector2(
            this.position.x + axis.x * distance + perpendicular.x * spread,
            this.position.y + axis.y * distance + perpendicular.y * spread
          )
        );
      }
    } else {
      const start = index === 1 ? -0.95 : 0.4;
      for (let i = 0; i < 5; i += 1) {
        const angle = start + i * 0.44;
        const radius = 0.95 + i * 0.22;
        points.push(new THREE.Vector2(this.position.x + Math.cos(angle) * radius, this.position.y + Math.sin(angle) * radius));
      }
    }
    return points;
  }

  _startSpikesTelegraph() {
    const points = this._buildSpikePattern();
    this.pendingAttack = {
      type: "spikes",
      telegraphRemaining: TELEGRAPH_SECONDS,
      position: this.position.clone(),
      radius: SPIKE_RADIUS,
      data: { points },
    };
    this.telegraphCount += points.length;
    for (const point of points) {
      this.vfxSystem?.spawnGroundRing?.({
        position: point,
        innerRadius: 0.22,
        outerRadius: 0.38,
        color: "#a5f7b8",
        life: TELEGRAPH_SECONDS + 0.02,
        opacity: 0.88,
        spread: 0.14,
      });
    }
  }

  _executePendingAttack(playerPosition, onPlayerDamaged) {
    if (!this.pendingAttack) return;
    const attack = this.pendingAttack;
    this.pendingAttack = null;

    if (attack.type === "pulse") {
      const radius = attack.radius;
      const distance = Math.hypot(playerPosition.x - attack.position.x, playerPosition.z - attack.position.y);
      if (distance <= radius) {
        this.recentPulseHit = true;
        const damage = this.phase >= 3 ? PULSE_DAMAGE_PHASE3 : PULSE_DAMAGE_PHASE1;
        onPlayerDamaged?.(damage, { position: attack.position.clone() });
      }
      this.vfxSystem?.spawnGroundRing?.({
        position: attack.position,
        innerRadius: Math.max(0.25, radius * 0.4),
        outerRadius: Math.max(0.45, radius * 0.9),
        color: "#c8ffd3",
        life: 0.48,
        opacity: 0.78,
        spread: radius * 1.2,
      });
      return;
    }

    if (attack.type === "projectile") {
      const toPlayer = new THREE.Vector2(playerPosition.x - this.position.x, playerPosition.z - this.position.y);
      if (toPlayer.lengthSq() <= 1e-6) {
        toPlayer.set(0, 1);
      } else {
        toPlayer.normalize();
      }
      const mesh = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.projectileTexture,
          transparent: true,
          opacity: 0.94,
          depthWrite: false,
        })
      );
      mesh.scale.set(0.34, 0.34, 1);
      mesh.position.set(this.position.x, -0.48, this.position.y);
      this.root.add(mesh);
      this.projectiles.push({
        mesh,
        position: new THREE.Vector2(this.position.x, this.position.y),
        velocity: toPlayer.multiplyScalar(PROJECTILE_SPEED),
        life: PROJECTILE_LIFETIME,
      });
      return;
    }

    if (attack.type === "spikes") {
      const points = attack.data.points ?? [];
      let playerHit = false;
      for (const point of points) {
        const spikeMesh = new THREE.Mesh(
          new THREE.RingGeometry(0.14, 0.32, 12),
          new THREE.MeshBasicMaterial({
            color: "#98ecac",
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        spikeMesh.rotation.x = -Math.PI / 2;
        spikeMesh.position.set(point.x, -0.84, point.y);
        spikeMesh.renderOrder = resolveDepthOrder(point.y, 1186);
        this.root.add(spikeMesh);
        this.spikeEchoes.push({
          mesh: spikeMesh,
          life: 0.36,
          maxLife: 0.36,
        });

        if (!playerHit) {
          const distance = Math.hypot(playerPosition.x - point.x, playerPosition.z - point.y);
          if (distance <= SPIKE_RADIUS) {
            playerHit = true;
          }
        }
      }
      if (playerHit) {
        onPlayerDamaged?.(SPIKE_DAMAGE, { position: this.position.clone() });
      }
    }
  }

  _updateShield(dtSeconds) {
    if (this.shieldActive) {
      this.shieldRemaining = Math.max(0, this.shieldRemaining - dtSeconds);
      this.shieldSynergyWindowRemaining = Math.max(0, this.shieldSynergyWindowRemaining - dtSeconds);
      if (this.shieldRemaining <= 0) {
        this.shieldActive = false;
        this.shieldCooldownRemaining = SHIELD_COOLDOWN_SECONDS;
        this.shieldSynergyWindowRemaining = 0;
      }
      return;
    }

    this.shieldCooldownRemaining = Math.max(0, this.shieldCooldownRemaining - dtSeconds);
    if (this.shieldCooldownRemaining <= 0) {
      this.shieldActive = true;
      this.shieldRemaining = SHIELD_DURATION_SECONDS;
      this.shieldSynergyWindowRemaining = 0;
    }
  }

  _updateMovement(dtSeconds, playerPosition, elapsedSeconds) {
    const toPlayer = new THREE.Vector2(playerPosition.x - this.position.x, playerPosition.z - this.position.y);
    const distance = toPlayer.length();
    if (distance > 1e-5) {
      toPlayer.multiplyScalar(1 / distance);
    } else {
      toPlayer.set(0, 1);
    }
    const desiredDistance = this.phase >= 3 ? 1.42 : 1.62;
    const speed = this.phase >= 3 ? PHASE3_MOVE_SPEED : BASE_MOVE_SPEED;
    const move = new THREE.Vector2(0, 0);
    if (distance > desiredDistance + 0.18) {
      move.copy(toPlayer);
    } else if (distance < desiredDistance - 0.24) {
      move.copy(toPlayer).multiplyScalar(-1);
    }
    this.position.x += move.x * speed * dtSeconds;
    this.position.y += move.y * speed * dtSeconds;

    const bob = Math.sin(elapsedSeconds * (this.phase >= 3 ? 3.1 : 2.2)) * 0.085;
    const pulse = 0.78 + Math.sin(elapsedSeconds * 2.8 + 0.4) * 0.14;
    this.group.position.set(this.position.x, 0, this.position.y);
    this.sprite.position.y = -0.46 + bob;
    this.sprite.material.opacity = pulse * (this.shieldActive ? 0.84 : 1);
    this.coreGlow.material.opacity = (0.2 + Math.sin(elapsedSeconds * 3.4) * 0.1) * (this.shieldActive ? 1.35 : 1);
    this.coreGlow.scale.setScalar(this.shieldActive ? 1.18 : 1);
    this.shieldRing.material.opacity = this.shieldActive ? 0.2 + Math.sin(elapsedSeconds * 10.5) * 0.07 : 0;
    this.shieldRing.scale.setScalar(this.shieldActive ? 1.06 + Math.sin(elapsedSeconds * 4) * 0.02 : 1);
    this.shadow.material.opacity = this.shieldActive ? 0.24 : 0.2;

    const order = resolveDepthOrder(this.position.y, 1205);
    this.group.renderOrder = order;
    this.sprite.renderOrder = order + 2;
    this.coreGlow.renderOrder = resolveDepthOrder(this.position.y, 1120);
    this.shieldRing.renderOrder = resolveDepthOrder(this.position.y, 1130);
    this.shadow.renderOrder = resolveDepthOrder(this.position.y, 982);
  }

  _updateProjectiles(dtSeconds, playerPosition, onPlayerDamaged) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.life = Math.max(0, projectile.life - dtSeconds);
      const toPlayer = new THREE.Vector2(playerPosition.x - projectile.position.x, playerPosition.z - projectile.position.y);
      if (toPlayer.lengthSq() > 1e-6) {
        toPlayer.normalize().multiplyScalar(PROJECTILE_SPEED);
        projectile.velocity.lerp(toPlayer, clamp01(dtSeconds * 1.25));
      }
      projectile.position.x += projectile.velocity.x * dtSeconds;
      projectile.position.y += projectile.velocity.y * dtSeconds;

      projectile.mesh.position.set(projectile.position.x, -0.48 + Math.sin(projectile.life * 7.2) * 0.04, projectile.position.y);
      projectile.mesh.material.opacity = clamp01(projectile.life / PROJECTILE_LIFETIME) * 0.94;
      projectile.mesh.renderOrder = resolveDepthOrder(projectile.position.y, 1212);

      const hitDistance = Math.hypot(playerPosition.x - projectile.position.x, playerPosition.z - projectile.position.y);
      if (hitDistance <= 0.34) {
        onPlayerDamaged?.(PROJECTILE_DAMAGE, { position: projectile.position.clone() });
        disposeMesh(projectile.mesh, this.root);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (projectile.life <= 0) {
        disposeMesh(projectile.mesh, this.root);
        this.projectiles.splice(i, 1);
      }
    }
  }

  _updateSpikeEchoes(dtSeconds) {
    for (let i = this.spikeEchoes.length - 1; i >= 0; i -= 1) {
      const spike = this.spikeEchoes[i];
      spike.life = Math.max(0, spike.life - dtSeconds);
      const t = spike.life / spike.maxLife;
      spike.mesh.material.opacity = 0.8 * t;
      const scale = 1 + (1 - t) * 0.65;
      spike.mesh.scale.set(scale, scale, scale);
      if (spike.life <= 0) {
        disposeMesh(spike.mesh, this.root);
        this.spikeEchoes.splice(i, 1);
      }
    }
  }

  _maybeSummonMinions(onSpawnMinions) {
    if (this.phase !== 2) return;
    if (this.summonTimer > 0) return;
    this.summonTimer = SUMMON_INTERVAL_PHASE2;
    const angleBase = (this.patternCounter % 8) * 0.5;
    const first = {
      id: `guardian-summon-${this.patternCounter}-1`,
      role: "skirmisher",
      type: "standard",
      x: this.position.x + Math.cos(angleBase) * 1.28,
      z: this.position.y + Math.sin(angleBase) * 1.28,
      aggroRadius: 3.2,
      attackRange: 0.7,
      lingerTag: "guardian-summon",
    };
    const second = {
      id: `guardian-summon-${this.patternCounter}-2`,
      role: "skirmisher",
      type: "standard",
      x: this.position.x + Math.cos(angleBase + Math.PI) * 1.18,
      z: this.position.y + Math.sin(angleBase + Math.PI) * 1.18,
      aggroRadius: 3.2,
      attackRange: 0.7,
      lingerTag: "guardian-summon",
    };
    onSpawnMinions?.([first, second]);
  }

  _maybeQueueAttack() {
    if (this.pendingAttack) return;
    if (this.phase === 1) {
      if (this.pulseTimer <= 0) {
        this.pulseTimer = PHASE1_PULSE_INTERVAL;
        this._startPulseTelegraph();
      }
      return;
    }

    if (this.phase === 2) {
      if (this.projectileTimer <= 0) {
        this.projectileTimer = PHASE2_PROJECTILE_INTERVAL;
        this._startProjectileTelegraph();
        return;
      }
      if (this.pulseTimer <= 0) {
        this.pulseTimer = PHASE2_PULSE_INTERVAL;
        this._startPulseTelegraph();
      }
      return;
    }

    if (this.spikeTimer <= 0) {
      this.spikeTimer = PHASE3_SPIKE_INTERVAL;
      this._startSpikesTelegraph();
      return;
    }
    if (this.pulseTimer <= 0) {
      this.pulseTimer = PHASE3_PULSE_INTERVAL;
      this._startPulseTelegraph();
    }
  }

  applyPlayerAttackEvents(
    attackEvents = [],
    playerPosition,
    { heavyDamageMultiplier = 1, attackMultiplier = 1, incomingDamageMultiplier = 1 } = {}
  ) {
    if (!this.active || !Array.isArray(attackEvents) || attackEvents.length === 0) {
      return { consumedIndexes: [], damageDealt: 0 };
    }

    const consumedIndexes = [];
    let totalDealt = 0;

    for (let i = 0; i < attackEvents.length; i += 1) {
      const attack = attackEvents[i];
      const targetId = String(attack.targetEnemyId ?? "");
      if (targetId && targetId !== GUARDIAN_ID && targetId !== "guardian") {
        continue;
      }

      const direction = attack.direction?.clone?.() ?? new THREE.Vector2(0, 1);
      if (direction.lengthSq() <= 1e-6) {
        direction.set(0, 1);
      } else {
        direction.normalize();
      }

      const toGuardian = new THREE.Vector2(this.position.x - playerPosition.x, this.position.y - playerPosition.z);
      const distance = toGuardian.length();
      const effectiveDistance = Math.max(0, distance - COLLISION_RADIUS);
      const range = Math.max(0.4, Number(attack.range) || 1.2);
      if (effectiveDistance > range + 0.08) {
        continue;
      }
      if (distance > 1e-6) {
        toGuardian.multiplyScalar(1 / distance);
      } else {
        toGuardian.set(0, 1);
      }
      const minDot = typeof attack.minDot === "number" ? attack.minDot : -0.05;
      if (toGuardian.dot(direction) < minDot) {
        continue;
      }

      consumedIndexes.push(i);
      let baseDamage = 0;
      if (attack.type === "charge") {
        const charge = this.damageSystem.getChargeDamage(attack.chargeRatio ?? 0);
        baseDamage = charge.amount * Math.max(1, Number(heavyDamageMultiplier) || 1);
      } else {
        baseDamage = this.damageSystem.getLightDamage(attack.comboStep ?? 1);
      }
      baseDamage *= Math.max(0, Number(attackMultiplier) || 0);
      baseDamage *= Math.max(0, Number(incomingDamageMultiplier) || 0);

      if (this.shieldActive) {
        if (attack.type === "charge" && (attack.chargeRatio ?? 0) >= 0.58) {
          this.shieldSynergyWindowRemaining = SHIELD_SYNERGY_WINDOW_SECONDS;
        }
        continue;
      }

      const dealt = Math.max(0, Math.min(this.hp, baseDamage));
      if (dealt <= 0) continue;
      this.hp -= dealt;
      totalDealt += dealt;
      this.damageTakenThisFrame += dealt;
      if (this.hp <= 0) {
        this.hp = 0;
        break;
      }
    }

    return {
      consumedIndexes,
      damageDealt: totalDealt,
    };
  }

  applySupportHit(amount = 0) {
    if (!this.active) return { damage: 0, brokeShield: false };
    const resolved = Math.max(0, Number(amount) || 0);
    if (resolved <= 0) return { damage: 0, brokeShield: false };

    if (this.shieldActive) {
      if (this.shieldSynergyWindowRemaining > 0) {
        this.shieldActive = false;
        this.shieldRemaining = 0;
        this.shieldSynergyWindowRemaining = 0;
        this.shieldCooldownRemaining = SHIELD_COOLDOWN_SECONDS * 0.85;
        return { damage: 0, brokeShield: true };
      }
      return { damage: 0, brokeShield: false };
    }

    const dealt = Math.max(0, Math.min(this.hp, resolved));
    if (dealt > 0) {
      this.hp -= dealt;
      this.damageTakenThisFrame += dealt;
    }
    return { damage: dealt, brokeShield: false };
  }

  forceShield() {
    if (!this.active) return false;
    this.shieldActive = true;
    this.shieldRemaining = SHIELD_DURATION_SECONDS;
    this.shieldSynergyWindowRemaining = 0;
    this.shieldCooldownRemaining = SHIELD_COOLDOWN_SECONDS;
    return true;
  }

  relocate(position = { x: 0, y: 0 }) {
    const nextX = Number(position.x) || 0;
    const nextY = Number(position.y) || 0;
    this.position.set(nextX, nextY);
    this.anchor.set(nextX, nextY);
    this.pendingAttack = null;
    this.telegraphCount = 0;
    this._clearProjectiles();
    this._clearSpikeEchoes();
    return this.getState();
  }

  setMaxHP(value, { preserveRatio = true } = {}) {
    const nextMax = Math.max(1, Math.floor(Number(value) || 1));
    const previousRatio = this.maxHP > 0 ? this.hp / this.maxHP : 1;
    this.maxHP = nextMax;
    if (preserveRatio) {
      this.hp = Math.max(0, Math.min(this.maxHP, Math.round(this.maxHP * previousRatio)));
    } else {
      this.hp = this.maxHP;
    }
    this.phase = this._resolvePhase();
    return this.getState();
  }

  setHpRatio(ratio) {
    const clamped = clamp01(Number(ratio) || 0);
    this.hp = Math.max(0, Math.min(this.maxHP, Math.round(this.maxHP * clamped)));
    this.phase = this._resolvePhase();
    return this.getState();
  }

  forcePhase(phaseId) {
    const normalized = String(phaseId ?? "").trim().toLowerCase();
    if (normalized === "p1" || normalized === "1") {
      return this.setHpRatio(0.84);
    }
    if (normalized === "p2" || normalized === "2") {
      return this.setHpRatio(0.5);
    }
    return this.setHpRatio(0.2);
  }

  damageDirect(amount = 0) {
    if (!this.active) return 0;
    const dealt = Math.max(0, Math.min(this.hp, Number(amount) || 0));
    if (dealt <= 0) return 0;
    this.hp -= dealt;
    this.damageTakenThisFrame += dealt;
    return dealt;
  }

  update(dtSeconds, { elapsedSeconds, playerPosition, onPlayerDamaged, onSpawnMinions } = {}) {
    this.justDefeated = false;
    this.damageDealtThisFrame = 0;
    this.damageTakenThisFrame = 0;
    this.recentPulseHit = false;

    const dt = Math.max(0, dtSeconds);
    this._updateSpikeEchoes(dt);
    if (!this.active) {
      return this.getState();
    }

    this.phase = this._resolvePhase();
    this._updateShield(dt);
    this._updateMovement(dt, playerPosition, elapsedSeconds ?? 0);

    this.pulseTimer = Math.max(0, this.pulseTimer - dt);
    this.projectileTimer = Math.max(0, this.projectileTimer - dt);
    this.spikeTimer = Math.max(0, this.spikeTimer - dt);
    this.summonTimer = Math.max(0, this.summonTimer - dt);

    if (this.pendingAttack) {
      this.pendingAttack.telegraphRemaining = Math.max(0, this.pendingAttack.telegraphRemaining - dt);
      if (this.pendingAttack.telegraphRemaining <= 0) {
        this._executePendingAttack(playerPosition, onPlayerDamaged);
      }
    }

    this._updateProjectiles(dt, playerPosition, onPlayerDamaged);
    this._maybeSummonMinions(onSpawnMinions);
    this._maybeQueueAttack();

    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      this.defeated = true;
      this.justDefeated = true;
      this.pendingAttack = null;
      this.shieldActive = false;
      this.shieldRemaining = 0;
      this.shieldSynergyWindowRemaining = 0;
      this.group.visible = false;
      this.vfxSystem?.spawnGroundRing?.({
        position: this.position.clone(),
        innerRadius: 0.45,
        outerRadius: 1.1,
        color: "#d3ffe1",
        life: 0.7,
        opacity: 0.88,
        spread: 2.4,
      });
      this.vfxSystem?.spawnGroundRing?.({
        position: this.position.clone(),
        innerRadius: 0.35,
        outerRadius: 0.8,
        color: "#9ef5b8",
        life: 0.55,
        opacity: 0.74,
        spread: 1.8,
      });
      this._clearProjectiles();
    }

    return this.getState();
  }

  getState() {
    return {
      id: GUARDIAN_ID,
      active: this.active,
      defeated: this.defeated,
      justDefeated: this.justDefeated,
      hp: Number(this.hp.toFixed(2)),
      maxHP: this.maxHP,
      hpRatio: Number((this.maxHP > 0 ? this.hp / this.maxHP : 0).toFixed(4)),
      phase: this.phase,
      shieldActive: this.shieldActive,
      shieldRemaining: Number(this.shieldRemaining.toFixed(3)),
      shieldSynergyWindow: Number(this.shieldSynergyWindowRemaining.toFixed(3)),
      telegraphActive: Boolean(this.pendingAttack),
      telegraphType: this.pendingAttack?.type ?? "",
      telegraphRemaining: Number((this.pendingAttack?.telegraphRemaining ?? 0).toFixed(3)),
      telegraphCount: this.telegraphCount,
      projectiles: this.projectiles.length,
      spikeEchoes: this.spikeEchoes.length,
      recentPulseHit: this.recentPulseHit,
      damageTakenThisFrame: Number(this.damageTakenThisFrame.toFixed(3)),
      position: {
        x: Number(this.position.x.toFixed(3)),
        z: Number(this.position.y.toFixed(3)),
      },
      collisionRadius: COLLISION_RADIUS,
      spriteVisible: this.group.visible,
    };
  }

  dispose() {
    this.clear();
    this._clearSpikeEchoes();
    this.spriteFallbackTexture.dispose();
    this.projectileTexture.dispose();
    this.spriteMaterial.dispose();
    this.coreGlow.geometry.dispose();
    this.coreGlow.material.dispose();
    this.shieldRing.geometry.dispose();
    this.shieldRing.material.dispose();
    this.shadow.geometry.dispose();
    this.shadow.material.dispose();
    this.group.clear();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

export const VEIN_GUARDIAN_ID = GUARDIAN_ID;
export const VEIN_GUARDIAN_MAX_HP = MAX_HP;
