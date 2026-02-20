import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { computeFeetDepthWorldZ, resolveDepthOrder } from "../render/billboard.js";
import { ENEMY_STAGGER_SECONDS } from "./damageSystem.js";

const DEAD_FADE_PER_SECOND = 0.95;
const HIT_FLASH_SECONDS = 0.08;
const ATTACK_STRIKE_FLASH_SECONDS = 0.12;
const KNOCKBACK_DAMPING = 7.5;
const FLASH_COLOR = new THREE.Color("#f8f2de");
const ATTACK_TELL_COLOR = new THREE.Color("#f8dca9");
const ATTACK_STRIKE_COLOR = new THREE.Color("#ffd7ca");
const ATTACK_RING_BASE_COLOR = new THREE.Color("#a4f9ad");
const SPECIAL_TELL_COLOR = new THREE.Color("#b7f9ff");
const SHIELD_ACTIVE_COLOR = new THREE.Color("#a6c7ff");

const ROLE_TEXTURE_PATHS = Object.freeze({
  skirmisher: "./assets/sprites/enemies/skirmisher.png",
  brute: "./assets/sprites/enemies/brute.png",
  harrier: "./assets/sprites/enemies/harrier.png",
  construct: "./assets/sprites/enemies/vaeloris_construct.png",
  striker: "./assets/sprites/enemies/striker.png",
  bulwark: "./assets/sprites/enemies/bulwark.png",
  hexer: "./assets/sprites/enemies/hexer.png",
});
const TYPE_TEXTURE_PATHS = Object.freeze({
  echo_knight: "./assets/sprites/enemies/echo_knight.png",
  lattice_sentinel: "./assets/sprites/enemies/lattice_sentinel.png",
});

const ROLE_TINTS = Object.freeze({
  skirmisher: new THREE.Color("#d7f2d4"),
  brute: new THREE.Color("#f2d5d1"),
  harrier: new THREE.Color("#d5e6f4"),
  construct: new THREE.Color("#c8d8ef"),
  striker: new THREE.Color("#d3f1dd"),
  bulwark: new THREE.Color("#d8dde8"),
  hexer: new THREE.Color("#d8ddf7"),
});

const ROLE_ALERT_COLOR = new THREE.Color("#efe0a0");
const ROLE_AGGRO_COLOR = new THREE.Color("#f4b6a8");

const roleTextureCache = new Map();

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

function drawFallbackRoleTexture(role) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fill = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  // Shared pixel-shadow patch to anchor each silhouette.
  fill(10, 36, 12, 2, "rgba(0,0,0,0.28)");

  if (role === "brute") {
    fill(8, 7, 16, 20, "#12151b");
    fill(7, 10, 18, 17, "#5c3f3c");
    fill(11, 11, 10, 7, "#c58f86");
    fill(9, 26, 5, 8, "#6c473e");
    fill(18, 26, 5, 8, "#6c473e");
    fill(6, 18, 3, 9, "#3d2e2f");
    fill(23, 18, 3, 9, "#3d2e2f");
  } else if (role === "harrier") {
    fill(11, 7, 11, 19, "#11151e");
    fill(12, 9, 9, 17, "#385363");
    fill(13, 9, 8, 6, "#9cbfd8");
    fill(9, 20, 3, 7, "#203643");
    fill(21, 17, 3, 8, "#203643");
    fill(11, 26, 4, 8, "#314652");
    fill(18, 26, 4, 8, "#314652");
    fill(22, 11, 3, 4, "#8eb3cd");
  } else if (role === "construct") {
    fill(9, 7, 14, 22, "#11151c");
    fill(10, 9, 12, 18, "#425362");
    fill(11, 10, 10, 6, "#90abc6");
    fill(8, 17, 2, 8, "#27323b");
    fill(22, 17, 2, 8, "#27323b");
    fill(12, 24, 3, 9, "#4d5d69");
    fill(17, 24, 3, 9, "#4d5d69");
    fill(12, 18, 8, 2, "#8cf0ff");
    fill(12, 20, 8, 1, "#6bc9d9");
  } else if (role === "striker") {
    fill(11, 8, 10, 19, "#11151c");
    fill(12, 9, 8, 16, "#335f4e");
    fill(13, 9, 7, 6, "#9ecfb2");
    fill(10, 16, 2, 9, "#274439");
    fill(20, 15, 3, 9, "#274439");
    fill(12, 25, 3, 8, "#496f5e");
    fill(16, 26, 3, 8, "#496f5e");
    fill(20, 13, 3, 4, "#7bf3c8");
  } else if (role === "bulwark") {
    fill(9, 7, 14, 22, "#11151d");
    fill(10, 9, 12, 18, "#4d5a69");
    fill(11, 10, 10, 6, "#a4b5ca");
    fill(7, 14, 4, 16, "#3f4a56");
    fill(8, 17, 2, 10, "#8db7d9");
    fill(12, 25, 4, 9, "#637180");
    fill(17, 25, 4, 9, "#637180");
  } else if (role === "hexer") {
    fill(10, 7, 12, 23, "#10141d");
    fill(11, 9, 10, 19, "#3f486d");
    fill(12, 10, 8, 6, "#a2b0d0");
    fill(9, 17, 2, 10, "#2a3252");
    fill(21, 19, 2, 11, "#2a3252");
    fill(13, 27, 3, 8, "#60729a");
    fill(17, 27, 3, 8, "#60729a");
    fill(21, 10, 2, 18, "#667e9e");
    fill(21, 8, 4, 3, "#75fff2");
  } else {
    fill(12, 7, 9, 18, "#12161d");
    fill(13, 9, 7, 16, "#345b38");
    fill(13, 9, 7, 6, "#9dcb90");
    fill(10, 17, 3, 8, "#284a2d");
    fill(20, 18, 3, 8, "#284a2d");
    fill(13, 25, 3, 8, "#476b49");
    fill(17, 25, 3, 8, "#476b49");
  }

  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function resolveTexturePath(textureKey = "skirmisher") {
  return TYPE_TEXTURE_PATHS[textureKey] ?? ROLE_TEXTURE_PATHS[textureKey] ?? ROLE_TEXTURE_PATHS.skirmisher;
}

function ensureRoleTextureRecord(textureKey, fallbackRole = "skirmisher") {
  const key = String(textureKey ?? "skirmisher")
    .trim()
    .toLowerCase();
  if (!roleTextureCache.has(key)) {
    const fallback = drawFallbackRoleTexture(resolveRole(fallbackRole));
    roleTextureCache.set(key, {
      texture: fallback,
      loading: false,
      loaded: false,
      loadedFromAsset: false,
      pending: [],
    });
  }
  return roleTextureCache.get(key);
}

function requestRoleTexture(textureKey, fallbackRole, onReady) {
  const key = String(textureKey ?? "skirmisher")
    .trim()
    .toLowerCase();
  const record = ensureRoleTextureRecord(key, fallbackRole);
  if (typeof onReady === "function" && record.loaded) {
    onReady(record.texture, record.loadedFromAsset);
    return;
  }
  if (typeof onReady === "function") {
    record.pending.push(onReady);
  }

  if (record.loading || record.loaded) {
    return;
  }

  record.loading = true;
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    const texture = applyPixelTextureSettings(new THREE.Texture(image));
    record.texture = texture;
    record.loaded = true;
    record.loadedFromAsset = true;
    record.loading = false;
    const callbacks = [...record.pending];
    record.pending.length = 0;
    for (const callback of callbacks) {
      callback(texture, true);
    }
  };
  image.onerror = () => {
    record.loaded = true;
    record.loadedFromAsset = false;
    record.loading = false;
    const callbacks = [...record.pending];
    record.pending.length = 0;
    for (const callback of callbacks) {
      callback(record.texture, false);
    }
  };
  image.src = resolveTexturePath(key);
}

function resolveTextureKey(role, type = "standard") {
  const normalizedType = String(type ?? "")
    .trim()
    .toLowerCase();
  if (TYPE_TEXTURE_PATHS[normalizedType]) return normalizedType;
  return resolveRole(role);
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

export const ENEMY_STATES = Object.freeze({
  IDLE: "idle",
  PATROL: "patrol",
  ALERT: "alert",
  AGGRO: "aggro",
  ATTACK: "attack",
  DEAD: "dead",
});

export const ENEMY_ROLE_PROFILES = Object.freeze({
  skirmisher: Object.freeze({
    maxHealth: 34,
    moveSpeed: 1.36,
    attackCooldown: 1.05,
    attackDamage: 7.5,
    aggroRadiusBonus: 0.02,
    collisionRadius: 0.32,
    knockbackMultiplier: 0.9,
    staggerDurationScale: 1,
    attackWindupSeconds: 0.27,
    retreatHealthRatio: 0.25,
    roleTint: "#d7f2d4",
    visualScale: { x: 1.06, y: 1.42 },
  }),
  brute: Object.freeze({
    maxHealth: 72,
    moveSpeed: 0.73,
    attackCooldown: 1.95,
    attackDamage: 12.2,
    aggroRadiusBonus: 0.1,
    collisionRadius: 0.5,
    knockbackMultiplier: 0.46,
    staggerDurationScale: 0.5,
    attackWindupSeconds: 0.34,
    retreatHealthRatio: 0,
    roleTint: "#f2d5d1",
    visualScale: { x: 1.35, y: 1.55 },
  }),
  harrier: Object.freeze({
    maxHealth: 47,
    moveSpeed: 1.1,
    attackCooldown: 1.68,
    attackDamage: 9.1,
    aggroRadiusBonus: 0.36,
    collisionRadius: 0.37,
    knockbackMultiplier: 0.74,
    staggerDurationScale: 0.9,
    attackWindupSeconds: 0.3,
    retreatHealthRatio: 0,
    harrierPreferredDistance: 1.3,
    harrierMinDistance: 0.84,
    flankDistance: 0.72,
    roleTint: "#d5e6f4",
    visualScale: { x: 1.16, y: 1.46 },
  }),
  construct: Object.freeze({
    maxHealth: 58,
    moveSpeed: 0.82,
    attackCooldown: 1.7,
    attackDamage: 9.8,
    aggroRadiusBonus: 0.28,
    collisionRadius: 0.44,
    knockbackMultiplier: 0.52,
    staggerDurationScale: 0.66,
    attackWindupSeconds: 0.36,
    retreatHealthRatio: 0,
    constructPreferredDistance: 2.2,
    constructMinDistance: 1.2,
    constructProjectileSpeed: 3.4,
    constructProjectileLifetime: 1.65,
    roleTint: "#c8d8ef",
    visualScale: { x: 1.28, y: 1.56 },
  }),
  striker: Object.freeze({
    maxHealth: 40,
    moveSpeed: 1.62,
    attackCooldown: 0.98,
    attackDamage: 8.2,
    aggroRadiusBonus: 0.42,
    collisionRadius: 0.33,
    knockbackMultiplier: 0.84,
    staggerDurationScale: 0.92,
    attackWindupSeconds: 0.22,
    retreatHealthRatio: 0,
    strikerDashCooldown: 2.35,
    strikerDashTelegraphSeconds: 0.35,
    strikerDashDistance: 1.2,
    roleTint: "#d3f1dd",
    visualScale: { x: 1.08, y: 1.44 },
  }),
  bulwark: Object.freeze({
    maxHealth: 84,
    moveSpeed: 0.64,
    attackCooldown: 2.05,
    attackDamage: 10.8,
    aggroRadiusBonus: 0.14,
    collisionRadius: 0.54,
    knockbackMultiplier: 0.38,
    staggerDurationScale: 0.46,
    attackWindupSeconds: 0.32,
    retreatHealthRatio: 0,
    bulwarkShieldCooldown: 4.2,
    bulwarkShieldTelegraphSeconds: 0.4,
    bulwarkShieldSeconds: 1.8,
    bulwarkShieldDamageScale: 0.5,
    bulwarkShieldConeDot: 0.42,
    roleTint: "#d8dde8",
    visualScale: { x: 1.42, y: 1.62 },
  }),
  hexer: Object.freeze({
    maxHealth: 52,
    moveSpeed: 0.9,
    attackCooldown: 1.85,
    attackDamage: 6.8,
    aggroRadiusBonus: 0.34,
    collisionRadius: 0.39,
    knockbackMultiplier: 0.6,
    staggerDurationScale: 0.7,
    attackWindupSeconds: 0.34,
    retreatHealthRatio: 0,
    hexerPreferredDistance: 2.5,
    hexerMinDistance: 1.3,
    hexerDebuffCooldown: 6.4,
    hexerDebuffTelegraphSeconds: 0.5,
    hexerProjectileSpeed: 3.1,
    hexerProjectileLifetime: 1.45,
    roleTint: "#d8ddf7",
    visualScale: { x: 1.2, y: 1.5 },
  }),
});

function resolveRole(role) {
  if (
    role === "brute" ||
    role === "harrier" ||
    role === "skirmisher" ||
    role === "construct" ||
    role === "striker" ||
    role === "bulwark" ||
    role === "hexer"
  ) {
    return role;
  }
  return "skirmisher";
}

export function getEnemyRoleProfile(role) {
  return ENEMY_ROLE_PROFILES[resolveRole(role)];
}

// Enemy is a lightweight data + visuals container used by CombatSystem.
export class Enemy {
  constructor({
    id,
    type = "standard",
    role = "skirmisher",
    position,
    health,
    maxHealth,
    aggroRadius = 2.8,
    attackRange = 0.9,
    attackCooldown,
    lingerTag = "wild",
    patrolSpan = 0.8,
    patrolSpeed,
  }) {
    this.id = id;
    this.type = type;
    this.role = resolveRole(role);
    this.profile = getEnemyRoleProfile(this.role);
    this.state = ENEMY_STATES.IDLE;

    this.maxHealth = maxHealth ?? this.profile.maxHealth;
    this.health = health ?? this.maxHealth;
    this.aggroRadius = aggroRadius + this.profile.aggroRadiusBonus;
    this.attackRange = attackRange;
    this.attackCooldown = attackCooldown ?? this.profile.attackCooldown;
    this.attackDamage = this.profile.attackDamage;
    this.lingerTag = lingerTag;
    this.moveSpeed = this.profile.moveSpeed;
    this.collisionRadius = this.profile.collisionRadius;
    this.knockbackMultiplier = this.profile.knockbackMultiplier;
    this.staggerDurationScale = this.profile.staggerDurationScale;
    this.attackWindupSeconds = this.profile.attackWindupSeconds;
    this.retreatHealthRatio = this.profile.retreatHealthRatio;
    this.harrierPreferredDistance = this.profile.harrierPreferredDistance ?? attackRange * 1.55;
    this.harrierMinDistance = this.profile.harrierMinDistance ?? attackRange * 0.9;
    this.flankDistance = this.profile.flankDistance ?? 0.68;
    this.constructPreferredDistance = this.profile.constructPreferredDistance ?? attackRange * 2.1;
    this.constructMinDistance = this.profile.constructMinDistance ?? attackRange * 1.1;
    this.constructProjectileSpeed = this.profile.constructProjectileSpeed ?? 3.4;
    this.constructProjectileLifetime = this.profile.constructProjectileLifetime ?? 1.65;
    this.strikerDashCooldown = this.profile.strikerDashCooldown ?? 2.35;
    this.strikerDashTelegraphSeconds = this.profile.strikerDashTelegraphSeconds ?? 0.35;
    this.strikerDashDistance = this.profile.strikerDashDistance ?? 1.2;
    this.bulwarkShieldCooldown = this.profile.bulwarkShieldCooldown ?? 4.2;
    this.bulwarkShieldTelegraphSeconds = this.profile.bulwarkShieldTelegraphSeconds ?? 0.4;
    this.bulwarkShieldSeconds = this.profile.bulwarkShieldSeconds ?? 1.8;
    this.bulwarkShieldDamageScale = this.profile.bulwarkShieldDamageScale ?? 0.5;
    this.bulwarkShieldConeDot = this.profile.bulwarkShieldConeDot ?? 0.42;
    this.hexerPreferredDistance = this.profile.hexerPreferredDistance ?? attackRange * 2.2;
    this.hexerMinDistance = this.profile.hexerMinDistance ?? attackRange * 1.2;
    this.hexerDebuffCooldown = this.profile.hexerDebuffCooldown ?? 6.4;
    this.hexerDebuffTelegraphSeconds = this.profile.hexerDebuffTelegraphSeconds ?? 0.5;
    this.hexerProjectileSpeed = this.profile.hexerProjectileSpeed ?? 3.1;
    this.hexerProjectileLifetime = this.profile.hexerProjectileLifetime ?? 1.45;

    this.position = position.clone();
    this.spawnPosition = position.clone();
    this.facing = new THREE.Vector2(0, 1);
    this.flankSide = hashString(String(id)) % 2 === 0 ? 1 : -1;

    this.attackCooldownRemaining = 0;
    this.staggerRemaining = 0;
    this.stateTime = 0;
    this.hitFlashRemaining = 0;
    this.attackStrikeFlashRemaining = 0;
    this.specialCooldownRemaining = 0;
    this.specialTelegraphRemaining = 0;
    this.specialTelegraphDuration = 0;
    this.specialAction = "";
    this.specialTargetId = "";
    this.specialTargetPosition = null;
    this.shieldActiveRemaining = 0;
    this.isShielding = false;
    this.currentTargetId = "";
    this.targetLockRemaining = 0;
    this.lastHitBlocked = false;
    this.lastDamagerId = "";
    this.knockbackVelocity = new THREE.Vector2(0, 0);

    this.patrolSpan = patrolSpan;
    this.patrolSpeed = patrolSpeed ?? Math.max(0.35, this.moveSpeed * 0.72);
    this.patrolDirection = 1;

    this.deadFade = 1;
    this.deadRemoved = false;

    this.group = null;
    this.sprite = null;
    this.shadow = null;
    this.aggroRing = null;
    this.debugAggro = false;
    this.projectileTelegraph = null;
    this.specialTelegraphMesh = null;
    this.shieldMesh = null;
    this.staggerIndicator = null;
    this.staggerStars = [];
    this.textureKey = resolveTextureKey(this.role, this.type);
    this.roleAssetPath = resolveTexturePath(this.textureKey);
    this.textureLoaded = false;
  }

  attachToScene(root, { debugAggro = false } = {}) {
    const group = new THREE.Group();
    const visualScale = this.profile.visualScale;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: ensureRoleTextureRecord(this.textureKey, this.role).texture,
      color: this.profile.roleTint,
      transparent: true,
      alphaTest: 0.16,
      depthWrite: false,
      opacity: 1,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(visualScale.x, visualScale.y, 1);
    sprite.center.set(0.5, 0.08);
    group.add(sprite);

    // Set refs before requesting texture so sync cache hits still update this enemy.
    this.group = group;
    this.sprite = sprite;

    requestRoleTexture(this.textureKey, this.role, (texture, loadedFromAsset) => {
      if (!this.sprite) return;
      this.sprite.material.map = texture;
      this.sprite.material.needsUpdate = true;
      this.roleAssetPath = loadedFromAsset ? resolveTexturePath(this.textureKey) : this.roleAssetPath;
      this.textureLoaded = Boolean(loadedFromAsset);
    });

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.28 + this.collisionRadius * 0.52, 20),
      new THREE.MeshBasicMaterial({
        color: "#000000",
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.885, 0);
    group.add(shadow);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(this.aggroRadius * 0.97, this.aggroRadius, 38),
      new THREE.MeshBasicMaterial({
        color: "#a4f9ad",
        transparent: true,
        opacity: debugAggro ? 0.12 : 0,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, -0.88, 0);
    group.add(ring);

    let projectileTelegraph = null;
    let specialTelegraphMesh = null;
    let shieldMesh = null;
    if (this.role === "construct" || this.role === "striker") {
      projectileTelegraph = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, this.role === "striker" ? 1.25 : 1),
        new THREE.MeshBasicMaterial({
          color: this.role === "striker" ? "#d8ffd8" : "#9ce8f2",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      projectileTelegraph.rotation.x = -Math.PI / 2;
      projectileTelegraph.visible = false;
      projectileTelegraph.position.set(0, -0.875, 0);
      group.add(projectileTelegraph);
    }
    if (this.role === "hexer") {
      specialTelegraphMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.42, 28),
        new THREE.MeshBasicMaterial({
          color: "#8af5d6",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      specialTelegraphMesh.rotation.x = -Math.PI / 2;
      specialTelegraphMesh.visible = false;
      specialTelegraphMesh.position.set(0, -0.878, 0);
      group.add(specialTelegraphMesh);
    }
    if (this.role === "bulwark") {
      shieldMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.52, 0.66, 36, 1, Math.PI * 1.16, Math.PI * 0.66),
        new THREE.MeshBasicMaterial({
          color: "#95b9ff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
      );
      shieldMesh.rotation.x = -Math.PI / 2;
      shieldMesh.visible = false;
      shieldMesh.position.set(0, -0.875, 0);
      group.add(shieldMesh);
    }

    const staggerGroup = new THREE.Group();
    staggerGroup.visible = false;
    const starMaterial = new THREE.MeshBasicMaterial({
      color: "#fce78a",
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    for (let i = 0; i < 3; i += 1) {
      const star = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.06, 6), starMaterial.clone());
      star.rotation.x = -Math.PI / 2;
      staggerGroup.add(star);
      this.staggerStars.push(star);
    }
    staggerGroup.position.set(0, 0.42, 0);
    group.add(staggerGroup);

    group.position.set(this.position.x, 0, this.position.y);
    root.add(group);

    this.shadow = shadow;
    this.aggroRing = ring;
    this.debugAggro = Boolean(debugAggro);
    this.projectileTelegraph = projectileTelegraph;
    this.specialTelegraphMesh = specialTelegraphMesh;
    this.shieldMesh = shieldMesh;
    this.staggerIndicator = staggerGroup;
  }

  setState(nextState) {
    if (this.state === nextState) return;
    this.state = nextState;
    this.stateTime = 0;
  }

  applyHitFeedback({ direction, knockback = 1 }) {
    const dir = direction?.clone?.() ?? new THREE.Vector2(0, 1);
    if (dir.lengthSq() > 1e-6) {
      dir.normalize();
      this.knockbackVelocity.x += dir.x * knockback * this.knockbackMultiplier;
      this.knockbackVelocity.y += dir.y * knockback * this.knockbackMultiplier;
    }
    this.hitFlashRemaining = HIT_FLASH_SECONDS;
  }

  markAttackStrike() {
    this.attackStrikeFlashRemaining = ATTACK_STRIKE_FLASH_SECONDS;
  }

  isLowHealth() {
    return this.health <= this.maxHealth * this.retreatHealthRatio;
  }

  updateVisuals(dtSeconds, elapsedSeconds) {
    this.stateTime += dtSeconds;
    this.attackCooldownRemaining = Math.max(0, this.attackCooldownRemaining - dtSeconds);
    this.staggerRemaining = Math.max(0, this.staggerRemaining - dtSeconds);
    this.hitFlashRemaining = Math.max(0, this.hitFlashRemaining - dtSeconds);
    this.attackStrikeFlashRemaining = Math.max(0, this.attackStrikeFlashRemaining - dtSeconds);
    this.specialCooldownRemaining = Math.max(0, this.specialCooldownRemaining - dtSeconds);
    this.specialTelegraphRemaining = Math.max(0, this.specialTelegraphRemaining - dtSeconds);
    this.shieldActiveRemaining = Math.max(0, this.shieldActiveRemaining - dtSeconds);
    this.targetLockRemaining = Math.max(0, this.targetLockRemaining - dtSeconds);
    this.isShielding = this.shieldActiveRemaining > 0;

    if (this.knockbackVelocity.lengthSq() > 1e-5) {
      this.position.x += this.knockbackVelocity.x * dtSeconds;
      this.position.y += this.knockbackVelocity.y * dtSeconds;
      const damping = Math.max(0, 1 - KNOCKBACK_DAMPING * dtSeconds);
      this.knockbackVelocity.multiplyScalar(damping);
    }

    if (!this.group || !this.sprite) return;

    this.group.position.set(this.position.x, 0, this.position.y);
    const feetDepthWorldZ = computeFeetDepthWorldZ(this.position.y, this.sprite.scale.y, this.sprite.center.y, 0.08);
    const depthOrder = resolveDepthOrder(feetDepthWorldZ, 1160);
    this.group.renderOrder = depthOrder;
    this.sprite.renderOrder = depthOrder;
    if (this.shadow) {
      this.shadow.renderOrder = resolveDepthOrder(feetDepthWorldZ, 980);
    }
    if (this.aggroRing) {
      this.aggroRing.renderOrder = resolveDepthOrder(feetDepthWorldZ, 1030);
    }

    const bobScale = this.state === ENEMY_STATES.AGGRO || this.state === ENEMY_STATES.ATTACK ? 1.35 : 1;
    const bob = Math.sin(elapsedSeconds * 5.2 + this.position.x * 0.35) * 0.03 * bobScale;
    this.sprite.position.y = bob;

    const roleColor = ROLE_TINTS[this.role].clone();
    if (this.state === ENEMY_STATES.ALERT) {
      roleColor.lerp(ROLE_ALERT_COLOR, 0.22);
    } else if (this.state === ENEMY_STATES.AGGRO || this.state === ENEMY_STATES.ATTACK) {
      roleColor.lerp(ROLE_AGGRO_COLOR, 0.2);
    }

    const windupDuration = Math.max(0, this.attackWindupSeconds);
    const inAttackTell =
      this.state === ENEMY_STATES.ATTACK &&
      this.staggerRemaining <= 0 &&
      this.attackCooldownRemaining <= 0 &&
      windupDuration > 0 &&
      this.stateTime < windupDuration;
    const attackTellProgress = inAttackTell ? clamp01(this.stateTime / windupDuration) : 0;
    if (inAttackTell) {
      roleColor.lerp(ATTACK_TELL_COLOR, 0.2 + attackTellProgress * 0.36);
    }
    if (this.attackStrikeFlashRemaining > 0) {
      const strikeMix = clamp01(this.attackStrikeFlashRemaining / ATTACK_STRIKE_FLASH_SECONDS);
      roleColor.lerp(ATTACK_STRIKE_COLOR, strikeMix * 0.65);
    }

    if (this.hitFlashRemaining > 0) {
      const flashMix = clamp01(this.hitFlashRemaining / HIT_FLASH_SECONDS);
      roleColor.lerp(FLASH_COLOR, flashMix * 0.8);
    }
    const specialTellActive = this.specialTelegraphRemaining > 0.001;
    if (specialTellActive) {
      const specialMix = clamp01(
        this.specialTelegraphDuration > 0
          ? this.specialTelegraphRemaining / this.specialTelegraphDuration
          : this.specialTelegraphRemaining
      );
      roleColor.lerp(SPECIAL_TELL_COLOR, 0.2 + specialMix * 0.2);
    }
    if (this.isShielding) {
      roleColor.lerp(SHIELD_ACTIVE_COLOR, 0.26);
    }
    this.sprite.material.color.copy(roleColor);

    if (this.aggroRing) {
      const ringColor = ATTACK_RING_BASE_COLOR;
      let ringOpacity = 0;
      if (this.debugAggro && this.state !== ENEMY_STATES.DEAD) {
        ringOpacity = this.state === ENEMY_STATES.AGGRO || this.state === ENEMY_STATES.ATTACK ? 0.12 : 0.06;
      }
      if (inAttackTell) {
        ringOpacity = Math.max(ringOpacity, 0.2 + attackTellProgress * 0.26);
        ringColor.copy(ATTACK_TELL_COLOR);
      } else if (specialTellActive) {
        const specialMix = clamp01(
          this.specialTelegraphDuration > 0
            ? this.specialTelegraphRemaining / this.specialTelegraphDuration
            : this.specialTelegraphRemaining
        );
        ringOpacity = Math.max(ringOpacity, 0.18 + specialMix * 0.2);
        ringColor.copy(SPECIAL_TELL_COLOR);
      } else if (this.attackStrikeFlashRemaining > 0) {
        const strikeMix = clamp01(this.attackStrikeFlashRemaining / ATTACK_STRIKE_FLASH_SECONDS);
        ringOpacity = Math.max(ringOpacity, 0.2 * strikeMix);
        ringColor.copy(ATTACK_STRIKE_COLOR);
      }
      this.aggroRing.material.color.copy(ringColor);
      this.aggroRing.material.opacity = ringOpacity;
    }

    if (this.projectileTelegraph) {
      const showTelegraph =
        (inAttackTell && this.role === "construct") ||
        (this.role === "striker" && specialTellActive && this.specialAction === "striker_dash");
      this.projectileTelegraph.visible = showTelegraph;
      if (showTelegraph) {
        const telegraphLength =
          this.role === "striker"
            ? Math.max(this.strikerDashDistance + 0.4, this.attackRange + 0.45)
            : Math.max(this.constructPreferredDistance * 0.92, this.attackRange + 0.38);
        const facingLengthSq = this.facing.lengthSq();
        const dirX = facingLengthSq > 1e-6 ? this.facing.x / Math.sqrt(facingLengthSq) : 0;
        const dirY = facingLengthSq > 1e-6 ? this.facing.y / Math.sqrt(facingLengthSq) : 1;
        this.projectileTelegraph.position.set(dirX * telegraphLength * 0.5, -0.875, dirY * telegraphLength * 0.5);
        this.projectileTelegraph.rotation.z = Math.atan2(dirX, dirY);
        this.projectileTelegraph.scale.set(1, telegraphLength, 1);
        if (this.role === "striker") {
          const strikerMix = clamp01(
            this.specialTelegraphDuration > 0
              ? this.specialTelegraphRemaining / this.specialTelegraphDuration
              : this.specialTelegraphRemaining
          );
          this.projectileTelegraph.material.opacity = 0.24 + strikerMix * 0.42;
        } else {
          this.projectileTelegraph.material.opacity = 0.2 + attackTellProgress * 0.46;
        }
        this.projectileTelegraph.renderOrder = resolveDepthOrder(feetDepthWorldZ, 1042);
      }
    }

    if (this.specialTelegraphMesh) {
      const showTelegraph = specialTellActive && this.role === "hexer" && this.specialAction === "hexer_hex";
      this.specialTelegraphMesh.visible = showTelegraph;
      if (showTelegraph) {
        const target = this.specialTargetPosition ?? this.position;
        const telegraphMix = clamp01(
          this.specialTelegraphDuration > 0
            ? this.specialTelegraphRemaining / this.specialTelegraphDuration
            : this.specialTelegraphRemaining
        );
        this.specialTelegraphMesh.position.set(
          target.x - this.position.x,
          -0.878,
          target.y - this.position.y
        );
        const scale = 0.82 + (1 - telegraphMix) * 1.25;
        this.specialTelegraphMesh.scale.set(scale, scale, scale);
        this.specialTelegraphMesh.material.opacity = 0.2 + telegraphMix * 0.25;
        this.specialTelegraphMesh.renderOrder = resolveDepthOrder(target.y, 1044);
      }
    }

    if (this.shieldMesh) {
      const showShield = this.isShielding || (specialTellActive && this.role === "bulwark");
      this.shieldMesh.visible = showShield;
      if (showShield) {
        const facing = this.facing.lengthSq() > 1e-6 ? this.facing.clone().normalize() : new THREE.Vector2(0, 1);
        this.shieldMesh.rotation.z = Math.atan2(facing.x, facing.y);
        const pulse = 0.5 + Math.sin(elapsedSeconds * 6.5 + this.position.x * 0.8) * 0.5;
        if (this.isShielding) {
          this.shieldMesh.material.opacity = 0.14 + pulse * 0.2;
        } else {
          const telegraphMix = clamp01(
            this.specialTelegraphDuration > 0
              ? this.specialTelegraphRemaining / this.specialTelegraphDuration
              : this.specialTelegraphRemaining
          );
          this.shieldMesh.material.opacity = 0.12 + telegraphMix * 0.2;
        }
        this.shieldMesh.renderOrder = resolveDepthOrder(feetDepthWorldZ, 1043);
      }
    }

    if (this.staggerIndicator) {
      const showStagger = this.staggerRemaining > 0 && this.state !== ENEMY_STATES.DEAD;
      this.staggerIndicator.visible = showStagger;
      if (showStagger) {
        const staggerStrength = clamp01(this.staggerRemaining / ENEMY_STAGGER_SECONDS);
        for (let i = 0; i < this.staggerStars.length; i += 1) {
          const star = this.staggerStars[i];
          const angle = elapsedSeconds * 5.2 + i * (Math.PI * 2) / this.staggerStars.length;
          const orbitX = 0.17 + staggerStrength * 0.08;
          const orbitZ = 0.13 + staggerStrength * 0.06;
          star.position.set(Math.cos(angle) * orbitX, 0, Math.sin(angle) * orbitZ);
          const starScale = 1 + staggerStrength * 0.55;
          star.scale.set(starScale, starScale, starScale);
          star.rotation.z = angle;
          star.material.opacity = 0.85 + staggerStrength * 0.15;
        }
      }
    }

    if (this.state === ENEMY_STATES.DEAD) {
      this.deadFade = Math.max(0, this.deadFade - dtSeconds * DEAD_FADE_PER_SECOND);
      this.sprite.material.opacity = this.deadFade;
      if (this.shadow) {
        this.shadow.material.opacity = 0.2 * this.deadFade;
      }
      if (this.deadFade <= 0.02 && this.group.parent) {
        this.group.parent.remove(this.group);
        this.deadRemoved = true;
      }
    }
  }

  markDead() {
    this.setState(ENEMY_STATES.DEAD);
    this.attackCooldownRemaining = 0;
    this.staggerRemaining = 0;
    this.hitFlashRemaining = 0;
    this.attackStrikeFlashRemaining = 0;
    this.specialCooldownRemaining = 0;
    this.specialTelegraphRemaining = 0;
    this.specialTelegraphDuration = 0;
    this.specialAction = "";
    this.shieldActiveRemaining = 0;
    this.isShielding = false;
    this.knockbackVelocity.set(0, 0);
    if (this.staggerIndicator) {
      this.staggerIndicator.visible = false;
    }
  }

  dispose(root) {
    if (!this.group) return;
    if (this.group.parent === root) {
      root.remove(this.group);
    }
    this.group.traverse((child) => {
      if (child.geometry && typeof child.geometry.dispose === "function") {
        child.geometry.dispose();
      }
      const material = child.material;
      if (Array.isArray(material)) {
        for (const entry of material) {
          entry?.dispose?.();
        }
      } else {
        material?.dispose?.();
      }
    });
    this.group = null;
    this.sprite = null;
    this.shadow = null;
    this.aggroRing = null;
    this.projectileTelegraph = null;
    this.specialTelegraphMesh = null;
    this.shieldMesh = null;
    this.staggerIndicator = null;
    this.staggerStars.length = 0;
  }

  isAlive() {
    return this.state !== ENEMY_STATES.DEAD;
  }

  toSnapshot() {
    return {
      id: this.id,
      type: this.type,
      role: this.role,
      state: this.state,
      health: Number(this.health.toFixed(2)),
      maxHealth: this.maxHealth,
      x: Number(this.position.x.toFixed(3)),
      z: Number(this.position.y.toFixed(3)),
      spriteAsset: this.roleAssetPath,
      textureLoaded: this.textureLoaded,
      staggered: this.staggerRemaining > 0,
      telegraphActive: Boolean(
        this.projectileTelegraph?.visible || this.specialTelegraphMesh?.visible || this.specialTelegraphRemaining > 0
      ),
      targetId: this.currentTargetId || "",
      isShielding: this.isShielding,
      debuffCooldown: Number(Math.max(0, this.specialCooldownRemaining).toFixed(3)),
      lastHitBlocked: Boolean(this.lastHitBlocked),
      lastDamagerId: String(this.lastDamagerId ?? ""),
    };
  }
}
