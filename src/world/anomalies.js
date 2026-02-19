import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { resolveDepthOrder } from "../render/billboard.js";

const ANOMALY_LIFETIME_SECONDS = 20;
const ANOMALY_TOUCH_RADIUS = 0.72;
const SPAWN_WINDOW_SECONDS = 12;
const MIN_SPAWN_TIME_SECONDS = 9;
const BASE_SPAWN_CHANCE = 0.08;
const OMINOUS_SPAWN_BONUS = 0.06;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyPixelTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createFallbackAnomalyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 24, 24);
  ctx.fillStyle = "#22492d";
  ctx.fillRect(8, 10, 8, 6);
  ctx.fillStyle = "#72d38b";
  ctx.fillRect(9, 9, 6, 1);
  ctx.fillRect(9, 16, 6, 1);
  ctx.fillRect(8, 10, 1, 6);
  ctx.fillRect(15, 10, 1, 6);
  ctx.fillStyle = "#b7ffd0";
  ctx.fillRect(10, 12, 4, 2);
  ctx.fillRect(11, 11, 2, 4);

  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, 8, 8);
  ctx.fillStyle = "#c9ffd8";
  ctx.fillRect(3, 3, 2, 2);
  ctx.fillStyle = "#8af0aa";
  ctx.fillRect(2, 3, 1, 1);
  ctx.fillRect(5, 4, 1, 1);

  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function disposeObject3D(object3D) {
  object3D.traverse((child) => {
    child.geometry?.dispose?.();
    const material = child.material;
    if (Array.isArray(material)) {
      for (const entry of material) {
        entry?.dispose?.();
      }
    } else {
      material?.dispose?.();
    }
  });
}

// VerdantAnomalySystem handles gentle deterministic anomaly spawns and collection events.
export class VerdantAnomalySystem {
  constructor({ threeScene, nextFloat, nextInt }) {
    this.threeScene = threeScene;
    this.nextFloat = nextFloat;
    this.nextInt = nextInt;

    this.root = new THREE.Group();
    this.root.name = "verdant-anomaly-root";
    this.threeScene.add(this.root);

    this._fallbackTexture = createFallbackAnomalyTexture();
    this._particleTexture = createParticleTexture();
    this._anomalyTexture = this._fallbackTexture;
    this._active = null;
    this._nextAnomalyId = 1;
    this._lastSpawnWindow = -1;
    this._spawnChanceModifier = 0;

    this._loadAnomalyTexture("./assets/sprites/anomaly.png");
  }

  _loadAnomalyTexture(path) {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const loaded = applyPixelTextureSettings(new THREE.Texture(image));
      this._anomalyTexture = loaded;
      if (this._active?.spriteMaterial) {
        this._active.spriteMaterial.map = loaded;
        this._active.spriteMaterial.needsUpdate = true;
      }
    };
    image.onerror = () => {};
    image.src = path;
  }

  _createAnomaly(position) {
    if (this._active) {
      this._disposeActive();
    }

    const group = new THREE.Group();

    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.45, 32),
      new THREE.MeshBasicMaterial({
        color: "#8de0a0",
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.set(position.x, -0.885, position.y);
    glowRing.renderOrder = resolveDepthOrder(position.y, 1020);
    group.add(glowRing);

    const spriteMaterial = new THREE.MeshBasicMaterial({
      map: this._anomalyTexture,
      transparent: true,
      opacity: 0.9,
      alphaTest: 0.08,
      depthWrite: false,
      color: "#d8ffe6",
    });
    const sprite = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.68), spriteMaterial);
    sprite.position.set(position.x, -0.57, position.y);
    sprite.renderOrder = resolveDepthOrder(position.y, 1180);
    group.add(sprite);

    const particles = [];
    for (let i = 0; i < 6; i += 1) {
      const particle = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this._particleTexture,
          transparent: true,
          opacity: 0.68,
          depthWrite: false,
          color: "#b0ffc8",
        })
      );
      particle.position.set(position.x, -0.72, position.y);
      particle.scale.set(0.11, 0.11, 1);
      particle.renderOrder = resolveDepthOrder(position.y, 1190);
      group.add(particle);

      particles.push({
        sprite: particle,
        angle: (Math.PI * 2 * i) / 6 + this.nextFloat() * 0.25,
        radius: 0.14 + this.nextFloat() * 0.1,
        lift: this.nextFloat() * 0.28,
      });
    }

    this.root.add(group);
    this._active = {
      id: `anomaly-${this._nextAnomalyId}`,
      sequence: this._nextAnomalyId,
      lifeRemaining: ANOMALY_LIFETIME_SECONDS,
      position: position.clone(),
      group,
      sprite,
      spriteMaterial,
      glowRing,
      particles,
    };
    this._nextAnomalyId += 1;
  }

  _disposeActive() {
    if (!this._active) return;
    if (this._active.group.parent === this.root) {
      this.root.remove(this._active.group);
    }
    disposeObject3D(this._active.group);
    this._active = null;
  }

  _resolveSpawnChance(omenTier) {
    const omenBonus = omenTier >= 2 ? OMINOUS_SPAWN_BONUS : 0;
    return clamp(BASE_SPAWN_CHANCE + omenBonus + this._spawnChanceModifier, 0, 0.94);
  }

  setSpawnChanceModifier(modifier) {
    const next = Number(modifier);
    if (!Number.isFinite(next)) {
      this._spawnChanceModifier = 0;
      return;
    }
    this._spawnChanceModifier = clamp(next, -0.08, 0.08);
  }

  _maybeSpawn({ elapsedSeconds, playerPosition, explorationActive, sceneId, omenTier }) {
    if (this._active || !explorationActive || sceneId !== "thornmere") {
      return;
    }
    if (elapsedSeconds < MIN_SPAWN_TIME_SECONDS) {
      return;
    }

    const spawnWindow = Math.floor(elapsedSeconds / SPAWN_WINDOW_SECONDS);
    if (spawnWindow <= this._lastSpawnWindow) {
      return;
    }
    this._lastSpawnWindow = spawnWindow;

    if (this.nextFloat() > this._resolveSpawnChance(omenTier)) {
      return;
    }

    const distance = 1.85 + this.nextFloat() * 1.8;
    const angle = this.nextFloat() * Math.PI * 2;
    const spawnX = Math.max(-7.6, Math.min(7.6, playerPosition.x + Math.cos(angle) * distance));
    const spawnZ = Math.max(-7.6, Math.min(7.6, playerPosition.z + Math.sin(angle) * distance));
    this._createAnomaly(new THREE.Vector2(spawnX, spawnZ));
  }

  spawnNearPlayer(playerPosition, { sceneId, explorationActive }) {
    if (!explorationActive || sceneId !== "thornmere") {
      return false;
    }
    const side = this._nextAnomalyId % 2 === 0 ? -1 : 1;
    const offset = new THREE.Vector2(0.88 * side, 0.16);
    this._createAnomaly(new THREE.Vector2(playerPosition.x + offset.x, playerPosition.z + offset.y));
    return true;
  }

  update(dtSeconds, { elapsedSeconds, playerPosition, explorationActive, sceneId, omenTier, camera, onCollected }) {
    if (sceneId !== "thornmere" && this._active) {
      this._disposeActive();
    }

    this._maybeSpawn({
      elapsedSeconds,
      playerPosition,
      explorationActive,
      sceneId,
      omenTier,
    });

    if (!this._active) {
      return {
        activeCount: 0,
        nearby: false,
      };
    }

    const anomaly = this._active;
    anomaly.lifeRemaining = Math.max(0, anomaly.lifeRemaining - dtSeconds);

    const fadeT = Math.min(1, anomaly.lifeRemaining / 1.5);
    const basePulse = 0.84 + Math.sin(elapsedSeconds * 3.2 + anomaly.sequence) * 0.16;
    anomaly.glowRing.material.opacity = 0.22 + basePulse * 0.2 * fadeT;
    anomaly.glowRing.scale.setScalar(0.94 + basePulse * 0.09);
    anomaly.glowRing.renderOrder = resolveDepthOrder(anomaly.position.y, 1020);

    anomaly.spriteMaterial.opacity = (0.66 + basePulse * 0.26) * fadeT;
    anomaly.sprite.renderOrder = resolveDepthOrder(anomaly.position.y, 1180);
    if (camera) {
      anomaly.sprite.lookAt(camera.position.x, anomaly.sprite.position.y, camera.position.z);
    }

    for (let i = 0; i < anomaly.particles.length; i += 1) {
      const particle = anomaly.particles[i];
      const orbital = elapsedSeconds * (1.05 + i * 0.06) + particle.angle;
      const radius = particle.radius + Math.sin(elapsedSeconds * 0.7 + i) * 0.02;
      particle.sprite.position.x = anomaly.position.x + Math.cos(orbital) * radius;
      particle.sprite.position.z = anomaly.position.y + Math.sin(orbital) * radius;
      particle.sprite.position.y = -0.76 + particle.lift + Math.sin(elapsedSeconds * 2.2 + i) * 0.02;
      particle.sprite.material.opacity = (0.26 + basePulse * 0.5) * fadeT;
      particle.sprite.renderOrder = resolveDepthOrder(anomaly.position.y, 1190);
    }

    const distanceToPlayer = Math.hypot(playerPosition.x - anomaly.position.x, playerPosition.z - anomaly.position.y);
    const playerTouching = distanceToPlayer <= ANOMALY_TOUCH_RADIUS;
    if (playerTouching && explorationActive) {
      const collectedPosition = anomaly.position.clone();
      this._disposeActive();
      onCollected?.(collectedPosition);
      return {
        activeCount: 0,
        nearby: false,
        collected: true,
      };
    }

    if (anomaly.lifeRemaining <= 0) {
      this._disposeActive();
      return {
        activeCount: 0,
        nearby: false,
      };
    }

    return {
      activeCount: 1,
      nearby: distanceToPlayer <= 2.1,
    };
  }

  getSnapshots() {
    if (!this._active) return [];
    return [
      {
        id: this._active.id,
        x: Number(this._active.position.x.toFixed(3)),
        z: Number(this._active.position.y.toFixed(3)),
        lifeRemaining: Number(this._active.lifeRemaining.toFixed(3)),
      },
    ];
  }

  clearActive() {
    this._disposeActive();
  }

  dispose() {
    this._disposeActive();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
    this._particleTexture.dispose();
    if (this._anomalyTexture !== this._fallbackTexture) {
      this._anomalyTexture.dispose();
    }
    this._fallbackTexture.dispose();
  }
}
