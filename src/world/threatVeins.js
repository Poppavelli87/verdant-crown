import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import {
  BillboardSprite,
  createPixelBillboardFallbackTexture,
  resolveDepthOrder,
} from "../render/billboard.js";
import { PROP_SCALE } from "../config/scale.js";

const VEIN_STATES = Object.freeze({
  IDLE: "idle",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED_COOLDOWN: "failedCooldown",
});

const VEIN_FAIL_COOLDOWN_SECONDS = 8;
const VEIN_WAVE_BREATH_SECONDS = 1.2;
const VEIN_WAVE_TRANSITION_SECONDS = 0.55;
const VEIN_WAVE_BREATH_SCALE_MIN = 0.78;
const VEIN_WAVE_BREATH_SCALE_MAX = 1.28;
const VEIN_MIN_WAVES = 2;
const VEIN_MAX_WAVES = 4;
const VEIN_LOCAL_OVERLAY_MAX = 0.11;
const VEIN_LOCAL_FOG_DENSITY_MAX = 0.0034;
const VEIN_LOCAL_TINT_DARKEN_MAX = 0.1;
const VEIN_LOCAL_DESATURATION_MAX = 0.14;
const VEIN_STABILITY_BUMP = 0.03;
const VEIN_PULSE_INTERVAL_SECONDS = 1.5;
const VEIN_ROOT_SURGE_SECONDS = 0.6;
const VEIN_CAMERA_MICRO_ZOOM = 1.036;
const VEIN_COLLISION_RADIUS = 0.26;
const PLAYER_COLLISION_RADIUS = 0.18;
const BARRIER_COLLIDER_SCALE = Math.max(1, PROP_SCALE * 0.78);
const VEIN_COMPLETION_FOG_RELIEF_SECONDS = 1.4;
const VEIN_COMPLETION_FOG_RELIEF_DELTA = -0.0016;

const DEFAULT_SCENE_VEINS = Object.freeze({
  hollowScar: [
    {
      id: "hollowscar-corridor-vein",
      center: { x: 2.2, y: 1.05 },
      radius: 2.08,
    },
  ],
  emberfall: [
    {
      id: "emberfall-clearing-vein",
      center: { x: 1.7, y: -0.9 },
      radius: 2.02,
    },
  ],
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function easeOutCubic(t) {
  const clamped = clamp01(t);
  return 1 - (1 - clamped) ** 3;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededFloat(seed, token) {
  let t = (seed ^ hashString(token) ^ 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function normalizeAngle(angle) {
  let result = angle % (Math.PI * 2);
  if (result < 0) result += Math.PI * 2;
  return result;
}

function angularDistance(a, b) {
  const delta = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(delta, Math.PI * 2 - delta);
}

function getVeinFlagKey(sceneId, veinId) {
  return `vein_completed_${sceneId}_${veinId}`;
}

function resolveWaveCount(playerStrain) {
  const strain = clamp01(Number(playerStrain) || 0);
  if (strain >= 0.75) return 2;
  if (strain >= 0.35) return 3;
  return 4;
}

function createFallbackRootSpikeTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#10160f";
    ctx.fillRect(14, 2, 4, 28);
    ctx.fillRect(12, 8, 2, 12);
    ctx.fillRect(18, 7, 2, 13);
    ctx.fillStyle = "#2a4426";
    ctx.fillRect(14, 6, 3, 21);
    ctx.fillRect(13, 14, 2, 11);
    ctx.fillRect(17, 13, 2, 11);
    ctx.fillStyle = "#4c6f41";
    ctx.fillRect(15, 10, 1, 12);
    ctx.fillRect(13, 20, 6, 2);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(10, 31, 12, 2);
  }, 32, 34);
}

function createBarrierDustTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 8, 8);
    ctx.fillStyle = "#d8ffd3";
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillStyle = "#b7efad";
    ctx.fillRect(2, 3, 1, 1);
    ctx.fillRect(5, 4, 1, 1);
  }, 8, 8);
}

const runtime = {
  sceneId: null,
  seed: 1337,
  root: null,
  threeScene: null,
  saveState: null,
  activationRadiusScale: 1,
  veins: [],
  lastContext: null,
  lastPlayerPosition: new THREE.Vector2(0, 0),
  debugVeinCounter: 1,
  fallbackRootSpikeTexture: null,
  fallbackBarrierDustTexture: null,
};

function ensureRoot(threeScene) {
  if (!threeScene) return null;
  if (!runtime.root) {
    runtime.root = new THREE.Group();
    runtime.root.name = "threat-vein-root";
  }
  if (runtime.root.parent !== threeScene) {
    if (runtime.root.parent) {
      runtime.root.parent.remove(runtime.root);
    }
    threeScene.add(runtime.root);
  }
  runtime.threeScene = threeScene;
  return runtime.root;
}

function disposeBarrier(vein) {
  if (!vein?.barrier) return;
  for (const segment of vein.barrier.segments) {
    segment.billboard.dispose();
    if (segment.shadow.parent === runtime.root) {
      runtime.root.remove(segment.shadow);
    }
    if (segment.basePatch.parent === runtime.root) {
      runtime.root.remove(segment.basePatch);
    }
    if (segment.glow.parent === runtime.root) {
      runtime.root.remove(segment.glow);
    }
    for (const particle of segment.particles) {
      if (particle.sprite.parent === runtime.root) {
        runtime.root.remove(particle.sprite);
      }
      particle.sprite.material.dispose();
    }
    segment.shadow.geometry.dispose();
    segment.shadow.material.dispose();
    segment.basePatch.geometry.dispose();
    segment.basePatch.material.dispose();
    segment.glow.geometry.dispose();
    segment.glow.material.dispose();
  }
  vein.barrier.segments.length = 0;
  vein.barrier.active = false;
  vein.barrier.growth = 0;
  vein.barrier.averageScale = 0;
}

function clearVeinRipples(vein) {
  for (const ripple of vein.pulseRipples) {
    if (ripple.mesh.parent === runtime.root) {
      runtime.root.remove(ripple.mesh);
    }
    ripple.mesh.geometry.dispose();
    ripple.mesh.material.dispose();
  }
  vein.pulseRipples.length = 0;
}

function disposeVein(vein) {
  disposeBarrier(vein);
  clearVeinRipples(vein);
  if (vein.baseRing.parent === runtime.root) {
    runtime.root.remove(vein.baseRing);
  }
  if (vein.localFogOverlay.parent === runtime.root) {
    runtime.root.remove(vein.localFogOverlay);
  }
  if (vein.localDesatOverlay.parent === runtime.root) {
    runtime.root.remove(vein.localDesatOverlay);
  }
  if (vein.localOverlay.parent === runtime.root) {
    runtime.root.remove(vein.localOverlay);
  }
  vein.baseRing.geometry.dispose();
  vein.baseRing.material.dispose();
  vein.localFogOverlay.geometry.dispose();
  vein.localFogOverlay.material.dispose();
  vein.localDesatOverlay.geometry.dispose();
  vein.localDesatOverlay.material.dispose();
  vein.localOverlay.geometry.dispose();
  vein.localOverlay.material.dispose();
}

function disposeAllVeins() {
  for (const vein of runtime.veins) {
    disposeVein(vein);
  }
  runtime.veins.length = 0;
}

function createVeinVisuals(center, radius) {
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.9, radius, 56),
    new THREE.MeshBasicMaterial({
      color: "#8ace8f",
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.set(center.x, -0.886, center.y);
  baseRing.renderOrder = resolveDepthOrder(center.y, 1040);
  runtime.root.add(baseRing);

  const localFogOverlay = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.82, 56),
    new THREE.MeshBasicMaterial({
      color: "#889e8c",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  localFogOverlay.rotation.x = -Math.PI / 2;
  localFogOverlay.position.set(center.x, -0.891, center.y);
  localFogOverlay.renderOrder = resolveDepthOrder(center.y, 1032);
  runtime.root.add(localFogOverlay);

  const localDesatOverlay = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.84, 56),
    new THREE.MeshBasicMaterial({
      color: "#8c9589",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  localDesatOverlay.rotation.x = -Math.PI / 2;
  localDesatOverlay.position.set(center.x, -0.892, center.y);
  localDesatOverlay.renderOrder = resolveDepthOrder(center.y, 1033);
  runtime.root.add(localDesatOverlay);

  const localOverlay = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.86, 56),
    new THREE.MeshBasicMaterial({
      color: "#3f6a45",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  localOverlay.rotation.x = -Math.PI / 2;
  localOverlay.position.set(center.x, -0.889, center.y);
  localOverlay.renderOrder = resolveDepthOrder(center.y, 1035);
  runtime.root.add(localOverlay);

  return { baseRing, localFogOverlay, localDesatOverlay, localOverlay };
}

function createVeinEntry(definition, sceneId, completed) {
  const center = new THREE.Vector2(definition.center.x, definition.center.y);
  const radius = definition.radius ?? 2.05;
  const visuals = createVeinVisuals(center, radius);
  const seedToken = `${runtime.seed}:${sceneId}:${definition.id}`;
  return {
    id: definition.id,
    sceneId,
    center: { x: center.x, y: center.y },
    radius,
    state: completed ? VEIN_STATES.COMPLETED : VEIN_STATES.IDLE,
    waveIndex: 0,
    totalWaves: 0,
    enemiesRemaining: 0,
    startedAt: 0,
    lastWaveAt: 0,
    activeEnemyIds: [],
    waveBreathRemaining: 0,
    waveBreathScale: 1,
    waveTransitionRemaining: 0,
    failCooldownRemaining: 0,
    startPulseRemaining: 0,
    rootSurgeRemaining: 0,
    completionFogReliefRemaining: 0,
    lastPulseAt: 0,
    pulseRipples: [],
    localOverlayOpacity: 0,
    localFogDensityDelta: 0,
    localTintDarken: 0,
    localDesaturation: 0,
    baseRing: visuals.baseRing,
    localFogOverlay: visuals.localFogOverlay,
    localDesatOverlay: visuals.localDesatOverlay,
    localOverlay: visuals.localOverlay,
    barrier: {
      active: false,
      segments: [],
      growth: 0,
      averageScale: 0,
      seedToken,
    },
  };
}

function createBarrierSegments(vein) {
  if (vein.barrier.active) return;
  if (!runtime.fallbackRootSpikeTexture) {
    runtime.fallbackRootSpikeTexture = createFallbackRootSpikeTexture();
  }
  if (!runtime.fallbackBarrierDustTexture) {
    runtime.fallbackBarrierDustTexture = createBarrierDustTexture();
  }

  const seedToken = vein.barrier.seedToken;
  const segmentCount = 9 + Math.floor(seededFloat(runtime.seed, `${seedToken}:segment-count`) * 2);
  const baseAngle = seededFloat(runtime.seed, `${seedToken}:base-angle`) * Math.PI * 2;
  const gapCenterA = seededFloat(runtime.seed, `${seedToken}:gap-a`) * Math.PI * 2;
  const gapCenterB = normalizeAngle(gapCenterA + Math.PI + (seededFloat(runtime.seed, `${seedToken}:gap-b`) - 0.5) * 0.56);
  const gapHalfWidth = 0.34;

  for (let i = 0; i < segmentCount; i += 1) {
    const angle = normalizeAngle(baseAngle + (Math.PI * 2 * i) / segmentCount);
    const inGapA = angularDistance(angle, gapCenterA) <= gapHalfWidth;
    const inGapB = angularDistance(angle, gapCenterB) <= gapHalfWidth;
    if (inGapA || inGapB) {
      continue;
    }

    const radialJitter = (seededFloat(runtime.seed, `${seedToken}:jitter:${i}`) - 0.5) * 0.18;
    const radius = vein.radius * (0.95 + radialJitter * 0.22);
    const x = vein.center.x + Math.cos(angle) * radius;
    const y = vein.center.y + Math.sin(angle) * radius;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.23, 18),
      new THREE.MeshBasicMaterial({
        color: "#000000",
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, -0.885, y);
    shadow.renderOrder = resolveDepthOrder(y, 980);
    runtime.root.add(shadow);

    const basePatch = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 16),
      new THREE.MeshBasicMaterial({
        color: "#142313",
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      })
    );
    basePatch.rotation.x = -Math.PI / 2;
    basePatch.position.set(x, -0.883, y);
    basePatch.renderOrder = resolveDepthOrder(y, 982);
    runtime.root.add(basePatch);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.17, 16),
      new THREE.MeshBasicMaterial({
        color: "#74d28f",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(x, -0.882, y);
    glow.renderOrder = resolveDepthOrder(y, 983);
    runtime.root.add(glow);

    const billboard = new BillboardSprite({
      root: runtime.root,
      assetPath: "./assets/sprites/props/root_spike.png",
      fallbackTexture: runtime.fallbackRootSpikeTexture,
      width: 0.72 * PROP_SCALE,
      height: 1.18 * PROP_SCALE,
      position: new THREE.Vector2(x, y),
      groundY: -0.9,
      yOffset: 0.02,
      depthBaseOrder: 1175,
      opacity: 0.92,
      tint: "#d0dcc1",
      swayAmount: 0.012,
      swaySpeed: 0.7,
      swayPhase: i * 0.31,
    });
    billboard.mesh.rotation.z = (seededFloat(runtime.seed, `${seedToken}:tilt:${i}`) - 0.5) * 0.16;
    const baseBillboardY = billboard.mesh.position.y;
    billboard.mesh.scale.set(0.1, 0.1, 1);
    billboard.mesh.position.y = baseBillboardY - 0.16;

    const particles = [];
    const particleCount = 2;
    for (let p = 0; p < particleCount; p += 1) {
      const token = `${seedToken}:particle:${i}:${p}`;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: runtime.fallbackBarrierDustTexture,
          transparent: true,
          opacity: 0,
          color: "#9ee4a0",
          depthWrite: false,
        })
      );
      const scale = 0.06 + seededFloat(runtime.seed, `${token}:size`) * 0.04;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(x, -0.82, y);
      sprite.renderOrder = resolveDepthOrder(y, 1162);
      runtime.root.add(sprite);
      particles.push({
        sprite,
        orbitRadius: 0.05 + seededFloat(runtime.seed, `${token}:radius`) * 0.08,
        orbitSpeed: 0.55 + seededFloat(runtime.seed, `${token}:orbit-speed`) * 0.65,
        orbitPhase: seededFloat(runtime.seed, `${token}:orbit-phase`) * Math.PI * 2,
        bobSpeed: 1.25 + seededFloat(runtime.seed, `${token}:bob-speed`) * 0.9,
        bobPhase: seededFloat(runtime.seed, `${token}:bob-phase`) * Math.PI * 2,
        baseOpacity: 0.06 + seededFloat(runtime.seed, `${token}:opacity`) * 0.08,
      });
    }

    vein.barrier.segments.push({
      billboard,
      shadow,
      basePatch,
      glow,
      particles,
      collider: {
        x,
        y,
        radius: VEIN_COLLISION_RADIUS * BARRIER_COLLIDER_SCALE,
      },
      surgeDelaySeconds: seededFloat(runtime.seed, `${seedToken}:surge-delay:${i}`) * 0.16,
      baseBillboardY,
      glowPhase: seededFloat(runtime.seed, `${seedToken}:glow-phase:${i}`),
      currentScale: 0.1,
    });
  }

  vein.barrier.active = true;
  vein.barrier.growth = 0;
  vein.barrier.averageScale = vein.barrier.segments.length > 0 ? 0.1 : 0;
}

function spawnVeinRipple(
  vein,
  {
    innerRadius = 0.45,
    outerRadius = 0.62,
    opacity = 0.33,
    color = "#9cf2b0",
    life = 1.2,
    spread = vein.radius * 1.65,
    renderBase = 1044,
  } = {}
) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(vein.center.x, -0.884, vein.center.y);
  mesh.renderOrder = resolveDepthOrder(vein.center.y, renderBase);
  runtime.root.add(mesh);
  vein.pulseRipples.push({
    mesh,
    life,
    maxLife: life,
    spread,
    baseOpacity: opacity,
    renderBase,
  });
}

function updateVeinVisuals(vein, dtSeconds, elapsedSeconds, camera) {
  vein.startPulseRemaining = Math.max(0, vein.startPulseRemaining - dtSeconds);
  vein.completionFogReliefRemaining = Math.max(0, vein.completionFogReliefRemaining - dtSeconds);
  vein.rootSurgeRemaining = Math.max(0, vein.rootSurgeRemaining - dtSeconds);
  vein.waveTransitionRemaining = Math.max(0, vein.waveTransitionRemaining - dtSeconds);

  const isActive = vein.state === VEIN_STATES.ACTIVE;
  const isCooldown = vein.state === VEIN_STATES.FAILED_COOLDOWN;
  const surgeElapsed = VEIN_ROOT_SURGE_SECONDS - vein.rootSurgeRemaining;
  const waveTransitionT = clamp01(vein.waveTransitionRemaining / VEIN_WAVE_TRANSITION_SECONDS);

  if (isActive) {
    const beat = 0.5 + Math.sin(elapsedSeconds * 4.2 + vein.radius) * 0.5;
    const pulseBoost = vein.startPulseRemaining > 0 ? clamp01(vein.startPulseRemaining / 0.7) * 0.12 : 0;
    vein.baseRing.material.opacity = 0.3 + beat * 0.2 + pulseBoost;
    vein.baseRing.material.color.set("#a6f0b1");
    vein.localOverlayOpacity = 0.06 + beat * 0.045 + pulseBoost * 0.8 + waveTransitionT * 0.015;
    vein.localFogDensityDelta = clamp(
      0.0018 + beat * 0.001 + pulseBoost * 0.0034 + waveTransitionT * 0.0007,
      0,
      VEIN_LOCAL_FOG_DENSITY_MAX
    );
    vein.localTintDarken = clamp(0.042 + beat * 0.024 + waveTransitionT * 0.02, 0, VEIN_LOCAL_TINT_DARKEN_MAX);
    vein.localDesaturation = clamp(0.07 + beat * 0.03 + waveTransitionT * 0.035, 0, VEIN_LOCAL_DESATURATION_MAX);
    vein.localOverlay.material.opacity = vein.localOverlayOpacity;
    vein.localFogOverlay.material.opacity = clamp01(vein.localFogDensityDelta / VEIN_LOCAL_FOG_DENSITY_MAX) * 0.16;
    vein.localDesatOverlay.material.opacity = clamp01(vein.localDesaturation / VEIN_LOCAL_DESATURATION_MAX) * 0.13;

    if (elapsedSeconds - vein.lastPulseAt >= VEIN_PULSE_INTERVAL_SECONDS) {
      vein.lastPulseAt = elapsedSeconds;
      spawnVeinRipple(vein);
    }
  } else if (isCooldown) {
    const fade = clamp01(vein.failCooldownRemaining / VEIN_FAIL_COOLDOWN_SECONDS);
    vein.baseRing.material.opacity = 0.12 + fade * 0.12;
    vein.baseRing.material.color.set("#b7a7a7");
    vein.localOverlayOpacity = 0;
    vein.localFogDensityDelta = 0;
    vein.localTintDarken = 0;
    vein.localDesaturation = 0;
    vein.localOverlay.material.opacity = 0;
    vein.localFogOverlay.material.opacity = 0;
    vein.localDesatOverlay.material.opacity = 0;
  } else if (vein.state === VEIN_STATES.COMPLETED) {
    const completionGlow = clamp01(vein.completionFogReliefRemaining / VEIN_COMPLETION_FOG_RELIEF_SECONDS);
    vein.baseRing.material.opacity = completionGlow * 0.14;
    vein.baseRing.material.color.set("#c5ffd2");
    vein.localOverlayOpacity = completionGlow * 0.03;
    vein.localFogDensityDelta = 0;
    vein.localTintDarken = 0;
    vein.localDesaturation = 0;
    vein.localOverlay.material.opacity = vein.localOverlayOpacity;
    vein.localFogOverlay.material.opacity = completionGlow * 0.02;
    vein.localDesatOverlay.material.opacity = completionGlow * 0.015;
  } else {
    vein.baseRing.material.opacity = 0.16;
    vein.baseRing.material.color.set("#9fc894");
    vein.localOverlayOpacity = 0;
    vein.localFogDensityDelta = 0;
    vein.localTintDarken = 0;
    vein.localDesaturation = 0;
    vein.localOverlay.material.opacity = 0;
    vein.localFogOverlay.material.opacity = 0;
    vein.localDesatOverlay.material.opacity = 0;
  }

  vein.baseRing.renderOrder = resolveDepthOrder(vein.center.y, 1040);
  vein.localFogOverlay.renderOrder = resolveDepthOrder(vein.center.y, 1032);
  vein.localDesatOverlay.renderOrder = resolveDepthOrder(vein.center.y, 1033);
  vein.localOverlay.renderOrder = resolveDepthOrder(vein.center.y, 1035);

  let barrierScaleTotal = 0;
  for (const segment of vein.barrier.segments) {
    segment.billboard.update(dtSeconds, elapsedSeconds, camera, 1);
    const localSurgeT = clamp01(
      (surgeElapsed - segment.surgeDelaySeconds) /
        Math.max(0.0001, VEIN_ROOT_SURGE_SECONDS - segment.surgeDelaySeconds)
    );
    const easedSurge = easeOutCubic(localSurgeT);
    const spikeScale = 0.1 + easedSurge * 0.9;
    const riseOffset = (1 - easedSurge) * -0.18;
    segment.currentScale = spikeScale;
    segment.billboard.mesh.scale.set(spikeScale, spikeScale, 1);
    segment.billboard.mesh.position.y = segment.baseBillboardY + riseOffset;

    segment.shadow.renderOrder = resolveDepthOrder(segment.collider.y, 980);
    segment.shadow.material.opacity = (isActive ? 0.3 : 0.24) * (0.7 + spikeScale * 0.3);
    segment.basePatch.renderOrder = resolveDepthOrder(segment.collider.y, 982);
    segment.basePatch.material.opacity = (isActive ? 0.24 : 0.18) * (0.65 + spikeScale * 0.35);
    segment.glow.renderOrder = resolveDepthOrder(segment.collider.y, 983);
    const glowBeat = 0.5 + Math.sin(elapsedSeconds * (4.8 + segment.glowPhase) + segment.glowPhase * 7.1) * 0.5;
    const glowStrength = (isActive ? 0.05 : 0.012) + waveTransitionT * 0.026;
    segment.glow.material.opacity = glowStrength * (0.6 + glowBeat * 0.4) * easedSurge;
    const glowScale = 0.9 + glowBeat * 0.22 + (1 - easedSurge) * 0.14;
    segment.glow.scale.set(glowScale, glowScale, glowScale);

    for (const particle of segment.particles) {
      const orbit = elapsedSeconds * particle.orbitSpeed + particle.orbitPhase;
      const bob = Math.sin(elapsedSeconds * particle.bobSpeed + particle.bobPhase);
      particle.sprite.position.x = segment.collider.x + Math.cos(orbit) * particle.orbitRadius;
      particle.sprite.position.z = segment.collider.y + Math.sin(orbit * 1.17) * particle.orbitRadius * 0.7;
      particle.sprite.position.y = -0.81 + bob * 0.03 + (1 - easedSurge) * -0.08;
      const visibility = isActive ? 1 : isCooldown ? 0.4 : 0.2;
      particle.sprite.material.opacity =
        particle.baseOpacity * visibility * easedSurge * (0.68 + (0.5 + Math.sin(orbit * 2.3) * 0.5) * 0.32);
      particle.sprite.renderOrder = resolveDepthOrder(segment.collider.y, 1162);
    }

    barrierScaleTotal += spikeScale;
  }
  vein.barrier.averageScale =
    vein.barrier.segments.length > 0 ? barrierScaleTotal / vein.barrier.segments.length : 0;
  vein.barrier.growth = clamp01((vein.barrier.averageScale - 0.1) / 0.9);

  for (let i = vein.pulseRipples.length - 1; i >= 0; i -= 1) {
    const ripple = vein.pulseRipples[i];
    ripple.life = Math.max(0, ripple.life - dtSeconds);
    const lifeT = ripple.life / ripple.maxLife;
    ripple.mesh.material.opacity = ripple.baseOpacity * lifeT;
    const scale = 1 + (1 - lifeT) * ripple.spread;
    ripple.mesh.scale.setScalar(scale);
    ripple.mesh.renderOrder = resolveDepthOrder(vein.center.y, ripple.renderBase);
    if (ripple.life <= 0) {
      if (ripple.mesh.parent === runtime.root) {
        runtime.root.remove(ripple.mesh);
      }
      ripple.mesh.geometry.dispose();
      ripple.mesh.material.dispose();
      vein.pulseRipples.splice(i, 1);
    }
  }
}

function resolveBarrierCollisions(vein, playerPos) {
  if (!vein.barrier.active || vein.state !== VEIN_STATES.ACTIVE) {
    return { x: playerPos.x, y: playerPos.y, collided: false };
  }

  let correctedX = playerPos.x;
  let correctedY = playerPos.y;
  let collided = false;

  for (let i = 0; i < vein.barrier.segments.length; i += 1) {
    const collider = vein.barrier.segments[i].collider;
    const dx = correctedX - collider.x;
    const dy = correctedY - collider.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = collider.radius + PLAYER_COLLISION_RADIUS;
    if (distance >= minDistance) continue;

    const safeDistance = distance <= 0.00001 ? minDistance : minDistance / distance;
    correctedX = collider.x + dx * safeDistance;
    correctedY = collider.y + dy * safeDistance;
    if (distance <= 0.00001) {
      correctedX += Math.cos(i * 1.7) * 0.015;
      correctedY += Math.sin(i * 1.7) * 0.015;
    }
    collided = true;
  }

  return { x: correctedX, y: correctedY, collided };
}

function buildWaveSpawnDefinitions(vein, roles, waveIndex) {
  const count = roles.length;
  const spawnRadius = Math.max(0.9, vein.radius * 0.58);
  const baseAngle = seededFloat(runtime.seed, `${vein.id}:wave:${waveIndex}:base`) * Math.PI * 2;
  const definitions = [];

  for (let i = 0; i < count; i += 1) {
    const role = roles[i];
    const jitter = (seededFloat(runtime.seed, `${vein.id}:wave:${waveIndex}:jitter:${i}`) - 0.5) * 0.42;
    const angle = baseAngle + (Math.PI * 2 * i) / Math.max(1, count) + jitter;
    const x = vein.center.x + Math.cos(angle) * spawnRadius;
    const z = vein.center.y + Math.sin(angle) * spawnRadius;
    const attackRangeByRole =
      role === "brute" || role === "bulwark"
        ? 0.76
        : role === "hexer" || role === "construct"
          ? 1.04
          : role === "striker"
            ? 0.72
            : 0.68;
    const enemyTypeByRole = role === "harrier" || role === "striker" ? "ambush" : "standard";
    definitions.push({
      id: `${vein.id}-wave-${waveIndex + 1}-enemy-${i + 1}`,
      role,
      type: enemyTypeByRole,
      x,
      z,
      aggroRadius: 2.9,
      attackRange: attackRangeByRole,
      lingerTag: `vein-${vein.id}`,
    });
  }

  return definitions;
}

function startWave(vein, context) {
  const composition = (context.getEncounterComposition?.(context.regionBaselinePressure) ?? ["skirmisher"]).slice(0, 3);
  const spawnDefinitions = buildWaveSpawnDefinitions(vein, composition, vein.waveIndex);
  vein.activeEnemyIds = context.spawnEnemies?.(spawnDefinitions) ?? [];
  vein.enemiesRemaining =
    context.countAliveEnemies?.(vein.activeEnemyIds) ?? vein.activeEnemyIds.length;
  vein.lastWaveAt = context.elapsedSeconds ?? 0;
  context.onWaveStart?.(vein, vein.waveIndex + 1);
}

function markVeinFailed(vein, context) {
  if (vein.state !== VEIN_STATES.ACTIVE) return false;
  if (vein.activeEnemyIds.length > 0) {
    context.despawnEnemies?.(vein.activeEnemyIds);
  }
  vein.state = VEIN_STATES.FAILED_COOLDOWN;
  vein.waveIndex = 0;
  vein.totalWaves = 0;
  vein.enemiesRemaining = 0;
  vein.startedAt = 0;
  vein.lastWaveAt = 0;
  vein.waveBreathRemaining = 0;
  vein.waveBreathScale = 1;
  vein.waveTransitionRemaining = 0;
  vein.failCooldownRemaining = VEIN_FAIL_COOLDOWN_SECONDS;
  vein.startPulseRemaining = 0;
  vein.rootSurgeRemaining = 0;
  vein.completionFogReliefRemaining = 0;
  vein.activeEnemyIds = [];
  disposeBarrier(vein);
  clearVeinRipples(vein);
  context.onToast?.("Vein lost.", 1.5);
  context.onVeinEnded?.(vein, "failed");
  context.onDirectorEvent?.("vein_failed");
  return true;
}

function markVeinCompleted(vein, context) {
  if (vein.state !== VEIN_STATES.ACTIVE) return false;
  vein.state = VEIN_STATES.COMPLETED;
  vein.enemiesRemaining = 0;
  vein.waveBreathRemaining = 0;
  vein.waveBreathScale = 1;
  vein.waveTransitionRemaining = 0;
  vein.startPulseRemaining = 0;
  vein.rootSurgeRemaining = 0;
  vein.completionFogReliefRemaining = VEIN_COMPLETION_FOG_RELIEF_SECONDS;
  vein.activeEnemyIds = [];
  disposeBarrier(vein);
  clearVeinRipples(vein);

  const flagKey = getVeinFlagKey(vein.sceneId, vein.id);
  context.saveState?.setStoryFlag?.(flagKey, true);
  context.onStabilityReward?.(VEIN_STABILITY_BUMP, vein);
  context.onToast?.("Vein stabilized.", 1.9);
  context.onVeinEnded?.(vein, "completed");
  context.onDirectorEvent?.("vein_completed");
  return true;
}

function startVeinIfEligible(vein, playerDistance, context) {
  const activationRadius = vein.radius * runtime.activationRadiusScale;
  if (vein.state !== VEIN_STATES.IDLE) return false;
  if (playerDistance > activationRadius) return false;

  vein.state = VEIN_STATES.ACTIVE;
  vein.waveIndex = 0;
  const waveOffset = Math.round(Number(context.waveCountOffset) || 0);
  vein.totalWaves = clamp(resolveWaveCount(context.playerStrain) + waveOffset, VEIN_MIN_WAVES, VEIN_MAX_WAVES);
  vein.startedAt = context.elapsedSeconds ?? 0;
  vein.lastWaveAt = vein.startedAt;
  vein.waveBreathRemaining = 0;
  vein.waveBreathScale = clamp(
    Number(context.waveBreathScale) || 1,
    VEIN_WAVE_BREATH_SCALE_MIN,
    VEIN_WAVE_BREATH_SCALE_MAX
  );
  vein.waveTransitionRemaining = 0;
  vein.failCooldownRemaining = 0;
  vein.startPulseRemaining = 0.7;
  vein.rootSurgeRemaining = VEIN_ROOT_SURGE_SECONDS;
  vein.completionFogReliefRemaining = 0;
  vein.activeEnemyIds = [];
  createBarrierSegments(vein);
  clearVeinRipples(vein);
  startWave(vein, context);

  context.onToast?.("A vein awakens.", 1.6);
  context.onVeinStarted?.(vein);
  context.onDirectorEvent?.("vein_started");
  return true;
}

function ensureSceneVeins(sceneId) {
  const definitions = DEFAULT_SCENE_VEINS[sceneId] ?? [];
  for (const definition of definitions) {
    const completed = Boolean(runtime.saveState?.getStoryFlag?.(getVeinFlagKey(sceneId, definition.id)));
    runtime.veins.push(createVeinEntry(definition, sceneId, completed));
  }
}

export function initThreatVeinsForScene(sceneId, rngSeed, options = {}) {
  runtime.seed = Number.isFinite(Number(rngSeed)) ? Number(rngSeed) >>> 0 : runtime.seed;
  runtime.saveState = options.saveState ?? runtime.saveState;

  const scene = options.threeScene ?? runtime.threeScene;
  if (!scene) {
    runtime.sceneId = sceneId;
    runtime.veins = [];
    return [];
  }

  ensureRoot(scene);
  disposeAllVeins();
  runtime.sceneId = sceneId;
  runtime.lastContext = null;
  runtime.lastPlayerPosition.set(0, 0);
  ensureSceneVeins(sceneId);

  return getThreatVeins();
}

export function setThreatVeinActivationBias(bias = 0) {
  const numericBias = Number(bias);
  if (!Number.isFinite(numericBias)) {
    runtime.activationRadiusScale = 1;
    return runtime.activationRadiusScale;
  }
  runtime.activationRadiusScale = clamp(1 + numericBias, 0.88, 1.16);
  return runtime.activationRadiusScale;
}

export function debugSpawnVeinNearPlayer() {
  if (!runtime.root || !runtime.sceneId) return null;
  if (!runtime.lastPlayerPosition) return null;
  if (!runtime.fallbackRootSpikeTexture) {
    runtime.fallbackRootSpikeTexture = createFallbackRootSpikeTexture();
  }

  const offsetSign = runtime.debugVeinCounter % 2 === 0 ? -1 : 1;
  const center = {
    x: runtime.lastPlayerPosition.x + 1.4 * offsetSign,
    y: runtime.lastPlayerPosition.y + 0.55,
  };
  const id = `debug-vein-${runtime.debugVeinCounter}`;
  runtime.debugVeinCounter += 1;
  runtime.veins.push(
    createVeinEntry(
      {
        id,
        center,
        radius: 1.98,
      },
      runtime.sceneId,
      false
    )
  );
  return id;
}

export function onVeinFail(veinId) {
  const vein = runtime.veins.find((entry) => entry.id === veinId);
  if (!vein) return false;
  return markVeinFailed(vein, runtime.lastContext ?? {});
}

export function onVeinComplete(veinId) {
  const vein = runtime.veins.find((entry) => entry.id === veinId);
  if (!vein) return false;
  return markVeinCompleted(vein, runtime.lastContext ?? {});
}

export function hasActiveVein() {
  return runtime.veins.some((vein) => vein.state === VEIN_STATES.ACTIVE);
}

export function updateThreatVeins(dtSeconds, playerPos, context) {
  const dt = Math.max(0, dtSeconds);
  if (!runtime.root || !context || context.sceneId !== runtime.sceneId) {
    return {
      active: false,
      hudText: "",
      localOverlayOpacity: 0,
      localFogDensityDelta: 0,
      localTintDarken: 0,
      localDesaturation: 0,
      localFogReliefDelta: 0,
      cameraZoomTarget: 1,
      waveTransitionActive: false,
      waveTransitionIntensity: 0,
      waveFoliageBoost: 1,
      waveShakeScalar: 0,
      barrierScale: 0,
      barrierGrowth: 0,
      correctedPlayerPosition: null,
      playerInsideActiveRadius: false,
    };
  }

  runtime.lastContext = context;
  runtime.lastPlayerPosition.set(playerPos.x, playerPos.y);

  let correctedPlayerPosition = null;
  let playerInsideActiveRadius = false;
  let activeVein = null;
  let strongestOverlay = 0;
  let strongestFogDensityDelta = 0;
  let strongestTintDarken = 0;
  let strongestDesaturation = 0;
  let strongestFogReliefDelta = 0;
  let strongestWaveTransition = 0;

  for (const vein of runtime.veins) {
    const distanceToPlayer = Math.hypot(playerPos.x - vein.center.x, playerPos.y - vein.center.y);

    if (vein.state === VEIN_STATES.FAILED_COOLDOWN) {
      vein.failCooldownRemaining = Math.max(0, vein.failCooldownRemaining - dt);
      if (vein.failCooldownRemaining <= 0) {
        vein.state = VEIN_STATES.IDLE;
      }
    }

    if (!context.suppressActivation) {
      startVeinIfEligible(vein, distanceToPlayer, context);
    }

    if (vein.state === VEIN_STATES.ACTIVE) {
      activeVein = vein;
      if (distanceToPlayer > vein.radius) {
        markVeinFailed(vein, context);
      } else {
        playerInsideActiveRadius = true;
        const resolved = resolveBarrierCollisions(vein, playerPos);
        if (resolved.collided) {
          correctedPlayerPosition = { x: resolved.x, y: resolved.y };
          playerPos.x = resolved.x;
          playerPos.y = resolved.y;
        }

        vein.enemiesRemaining = context.countAliveEnemies?.(vein.activeEnemyIds) ?? 0;
        if (vein.enemiesRemaining <= 0) {
          if (vein.waveIndex + 1 >= vein.totalWaves) {
            markVeinCompleted(vein, context);
          } else {
            if (vein.waveBreathRemaining <= 0) {
              vein.waveBreathRemaining = VEIN_WAVE_BREATH_SECONDS * (vein.waveBreathScale ?? 1);
              vein.waveTransitionRemaining = VEIN_WAVE_TRANSITION_SECONDS;
              spawnVeinRipple(vein, {
                innerRadius: 0.34,
                outerRadius: 0.5,
                opacity: 0.36,
                color: "#a7f4ba",
                life: 0.85,
                spread: vein.radius * 2.45,
                renderBase: 1048,
              });
              const nextWave = vein.waveIndex + 2;
              context.onToast?.(`Wave ${nextWave} rises.`, 1.2);
            }
            vein.waveBreathRemaining = Math.max(0, vein.waveBreathRemaining - dt);
            if (vein.waveBreathRemaining <= 0) {
              vein.waveIndex += 1;
              startWave(vein, context);
            }
          }
        }
      }
    }

    updateVeinVisuals(vein, dt, context.elapsedSeconds ?? 0, context.camera);
    strongestOverlay = Math.max(strongestOverlay, vein.localOverlayOpacity ?? 0);
    strongestFogDensityDelta = Math.max(strongestFogDensityDelta, vein.localFogDensityDelta ?? 0);
    strongestTintDarken = Math.max(strongestTintDarken, vein.localTintDarken ?? 0);
    strongestDesaturation = Math.max(strongestDesaturation, vein.localDesaturation ?? 0);
    strongestWaveTransition = Math.max(
      strongestWaveTransition,
      clamp01(vein.waveTransitionRemaining / VEIN_WAVE_TRANSITION_SECONDS)
    );
    if (vein.completionFogReliefRemaining > 0) {
      const reliefT = clamp01(vein.completionFogReliefRemaining / VEIN_COMPLETION_FOG_RELIEF_SECONDS);
      strongestFogReliefDelta = Math.min(
        strongestFogReliefDelta,
        VEIN_COMPLETION_FOG_RELIEF_DELTA * reliefT
      );
    }
  }

  const activeHudText = activeVein
    ? `Vein: Wave ${Math.min(activeVein.waveIndex + 1, Math.max(1, activeVein.totalWaves))}/${Math.max(1, activeVein.totalWaves)}`
    : "";

  return {
    active: Boolean(activeVein),
    activeVeinId: activeVein?.id ?? null,
    state: activeVein?.state ?? "",
    waveIndex: activeVein?.waveIndex ?? 0,
    totalWaves: activeVein?.totalWaves ?? 0,
    enemiesRemaining: activeVein?.enemiesRemaining ?? 0,
    hudText: activeHudText,
    localOverlayOpacity: clamp(strongestOverlay, 0, VEIN_LOCAL_OVERLAY_MAX),
    localFogDensityDelta: clamp(strongestFogDensityDelta, 0, VEIN_LOCAL_FOG_DENSITY_MAX),
    localTintDarken: clamp(strongestTintDarken, 0, VEIN_LOCAL_TINT_DARKEN_MAX),
    localDesaturation: clamp(strongestDesaturation, 0, VEIN_LOCAL_DESATURATION_MAX),
    localFogReliefDelta: strongestFogReliefDelta,
    cameraZoomTarget: activeVein ? VEIN_CAMERA_MICRO_ZOOM : 1,
    waveTransitionActive: strongestWaveTransition > 0.001,
    waveTransitionIntensity: strongestWaveTransition,
    waveFoliageBoost: 1 + strongestWaveTransition * 0.24,
    waveShakeScalar: strongestWaveTransition,
    barrierScale: activeVein?.barrier.averageScale ?? 0,
    barrierGrowth: activeVein?.barrier.growth ?? 0,
    waveBreathScale: activeVein?.waveBreathScale ?? 1,
    correctedPlayerPosition,
    playerInsideActiveRadius,
  };
}

export function getThreatVeins() {
  return runtime.veins.map((vein) => ({
    id: vein.id,
    sceneId: vein.sceneId,
    center: {
      x: Number(vein.center.x.toFixed(3)),
      y: Number(vein.center.y.toFixed(3)),
    },
    radius: Number(vein.radius.toFixed(3)),
    state: vein.state,
    waveIndex: vein.waveIndex,
    totalWaves: vein.totalWaves,
    waveBreathScale: Number((vein.waveBreathScale ?? 1).toFixed(3)),
    enemiesRemaining: vein.enemiesRemaining,
    startedAt: Number((vein.startedAt ?? 0).toFixed(3)),
    lastWaveAt: Number((vein.lastWaveAt ?? 0).toFixed(3)),
    barrier: {
      active: vein.barrier.active,
      averageScale: Number((vein.barrier.averageScale ?? 0).toFixed(3)),
      growth: Number((vein.barrier.growth ?? 0).toFixed(3)),
      segments: vein.barrier.segments.map((segment) => ({
        x: Number(segment.collider.x.toFixed(3)),
        y: Number(segment.collider.y.toFixed(3)),
        radius: Number(segment.collider.radius.toFixed(3)),
        scale: Number((segment.currentScale ?? 0).toFixed(3)),
      })),
    },
  }));
}

export function clearThreatVeinsCompletionFlags(saveState) {
  if (!saveState?.getStoryFlags) return 0;
  const storyFlags = saveState.getStoryFlags();
  let cleared = 0;
  for (const key of Object.keys(storyFlags)) {
    if (!key.startsWith("vein_completed_")) continue;
    saveState.setStoryFlag(key, false);
    cleared += 1;
  }
  return cleared;
}

export function disposeThreatVeins() {
  disposeAllVeins();
  if (runtime.root?.parent) {
    runtime.root.parent.remove(runtime.root);
  }
  runtime.root = null;
  runtime.sceneId = null;
  runtime.lastContext = null;
  runtime.activationRadiusScale = 1;
  if (runtime.fallbackRootSpikeTexture) {
    runtime.fallbackRootSpikeTexture.dispose();
    runtime.fallbackRootSpikeTexture = null;
  }
  if (runtime.fallbackBarrierDustTexture) {
    runtime.fallbackBarrierDustTexture.dispose();
    runtime.fallbackBarrierDustTexture = null;
  }
}
