import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const RETURN_PORTAL = new THREE.Vector2(-3.66, 0.04);
const LAST_DOOR_PORTAL = new THREE.Vector2(3.82, -1.46);
const LOCK_POSITIONS = Object.freeze([
  Object.freeze({ id: "resonance-lock-1", x: -1.76, y: -0.62 }),
  Object.freeze({ id: "resonance-lock-2", x: 0.18, y: 1.28 }),
  Object.freeze({ id: "resonance-lock-3", x: 2.26, y: -0.14 }),
]);
const MEMORY_LOOM_CENTER = new THREE.Vector2(2.18, 0.22);
const LOOM_ARENA_RADIUS = 2.58;
const LOOM_TRIGGER_RADIUS = 1.16;
const PRISM_PILLARS = Object.freeze([
  Object.freeze({ x: 1.34, y: -1.04 }),
  Object.freeze({ x: 3.04, y: 0.72 }),
]);

function makeFallback(painter, width = 40, height = 56) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createLockFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.fillRect(10, 46, 20, 4);
    ctx.fillStyle = "#243245";
    ctx.fillRect(14, 14, 12, 32);
    ctx.fillStyle = "#4f81a6";
    ctx.fillRect(13, 11, 14, 5);
    ctx.fillStyle = "#d7f0ff";
    ctx.fillRect(16, 13, 8, 2);
    ctx.fillRect(16, 23, 8, 2);
  }, 42, 58);
}

function createLoomFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(8, 46, 24, 4);
    ctx.fillStyle = "#2a3244";
    ctx.fillRect(12, 10, 16, 36);
    ctx.fillStyle = "#49617f";
    ctx.fillRect(13, 12, 14, 30);
    ctx.fillStyle = "#b8e8ff";
    ctx.fillRect(16, 16, 8, 3);
    ctx.fillRect(15, 25, 10, 2);
    ctx.fillRect(17, 33, 6, 2);
  }, 44, 58);
}

function createPillarFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(12, 45, 16, 4);
    ctx.fillStyle = "#2f3d4e";
    ctx.fillRect(14, 12, 12, 33);
    ctx.fillStyle = "#627a9b";
    ctx.fillRect(15, 14, 10, 28);
    ctx.fillStyle = "#d9efff";
    ctx.fillRect(17, 21, 6, 2);
  }, 40, 54);
}

function createTileShardFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(12, 45, 16, 3);
    ctx.fillStyle = "#3f4b61";
    ctx.fillRect(13, 22, 14, 23);
    ctx.fillStyle = "#60789a";
    ctx.fillRect(14, 24, 12, 18);
    ctx.fillStyle = "#c6e0ff";
    ctx.fillRect(16, 30, 8, 2);
  }, 42, 56);
}

const RESONANCE_LOCK_FALLBACK = createLockFallback();
const MEMORY_LOOM_FALLBACK = createLoomFallback();
const PRISM_PILLAR_FALLBACK = createPillarFallback();
const TILE_SHARD_FALLBACK = createTileShardFallback();

export class InnerSpireScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "inner_spire";
    this.displayName = "Inner Spire";
    this.regionId = "umbral-hollows";

    this._pulseTime = 0;
    this._titleShown = false;
    this._act3Unlocked = Boolean(
      this.saveState?.getStoryFlag?.("endgame_act3_unlocked") ?? this.saveState?.getFlag?.("story.endgame_act3_unlocked")
    );
    this._wasNearDoorPortal = false;
    this._wasNearLoom = false;

    this._doorPortal = null;
    this._lockBillboards = [];
    this._loomBillboard = null;

    this._createProps();
    this.addPortal({
      id: "inner-spire-return",
      targetSceneId: "spire_antechamber",
      position: RETURN_PORTAL.clone(),
      radius: 0.86,
      interactRadius: 1.05,
      color: "#cddffb",
      label: "Return to antechamber",
    });
    this._doorPortal = this.addPortal({
      id: "inner-spire-last-door-entry",
      targetSceneId: "inner_spire_last_door",
      position: LAST_DOOR_PORTAL.clone(),
      radius: 0.84,
      interactRadius: 0,
      color: "#c7e8ff",
      label: "Approach the Last Door",
    });
    this._syncDoorPortal();
  }

  _createProps() {
    const shardColumns = [
      { x: -2.8, z: -1.28, scale: 1.08 },
      { x: -0.82, z: -1.48, scale: 0.94 },
      { x: 0.96, z: 1.74, scale: 1.02 },
      { x: 2.96, z: -1.02, scale: 1.06 },
      { x: 3.56, z: 1.12, scale: 0.92 },
    ];
    for (const entry of shardColumns) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/inner_spire_tile.png",
        fallbackTexture: TILE_SHARD_FALLBACK,
        width: 0.98 * entry.scale,
        height: 1.6 * entry.scale,
        position: new THREE.Vector2(entry.x, entry.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1144,
        shadowOpacity: 0.16,
        groundPatchOpacity: 0.07,
        scaleWithProps: false,
        tint: "#d6e2f7",
      });
    }

    this._lockBillboards = LOCK_POSITIONS.map((lock, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/resonance_lock.png",
        fallbackTexture: RESONANCE_LOCK_FALLBACK,
        width: 0.84,
        height: 1.3,
        position: new THREE.Vector2(lock.x, lock.y),
        groundY: -0.9,
        yOffset: 0.03,
        depthBaseOrder: 1160 + index,
        shadowOpacity: 0.17,
        groundPatchOpacity: 0.07,
        scaleWithProps: false,
        tint: "#d6ecff",
      })
    );

    this._loomBillboard = this.addBillboard({
      assetPath: "./assets/sprites/props/memory_loom.png",
      fallbackTexture: MEMORY_LOOM_FALLBACK,
      width: 1.84,
      height: 2.52,
      position: MEMORY_LOOM_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1168,
      shadowOpacity: 0.24,
      groundPatchOpacity: 0.11,
      scaleWithProps: false,
      tint: "#d5e8ff",
    });

    for (let i = 0; i < PRISM_PILLARS.length; i += 1) {
      const pillar = PRISM_PILLARS[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/prism_pillar.png",
        fallbackTexture: PRISM_PILLAR_FALLBACK,
        width: 0.92,
        height: 1.54,
        position: new THREE.Vector2(pillar.x, pillar.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1152 + i,
        shadowOpacity: 0.2,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#cae4ff",
      });
    }
  }

  _syncDoorPortal() {
    if (!this._doorPortal) return;
    const open = Boolean(this._act3Unlocked);
    this._doorPortal.interactRadius = open ? 1.08 : 0;
    this._doorPortal.ring.visible = open;
    this._doorPortal.marker.mesh.visible = open;
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.endgame_act3_unlocked" || flagKey === "endgame_act3_unlocked") {
      this._act3Unlocked = Boolean(value);
      this._syncDoorPortal();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(-2.92, 0.04);
  }

  getVisualConfig() {
    return {
      skyTint: "#6f7f98",
      lightTint: "#dbe6f9",
      groundTint: "#4f5c73",
      fogMultiplier: 1.02,
    };
  }

  getInnerSpireConfig() {
    return {
      resonanceLocks: LOCK_POSITIONS.map((lock) => ({ id: lock.id, x: lock.x, y: lock.y })),
      interactRadius: 1.02,
      memoryLoom: { x: MEMORY_LOOM_CENTER.x, y: MEMORY_LOOM_CENTER.y },
      loomArena: {
        center: { x: MEMORY_LOOM_CENTER.x, y: MEMORY_LOOM_CENTER.y },
        radius: LOOM_ARENA_RADIUS,
      },
      loomTriggerRadius: LOOM_TRIGGER_RADIUS,
      prismPillars: PRISM_PILLARS.map((entry) => ({ x: entry.x, y: entry.y })),
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._pulseTime += dtSeconds;

    for (let i = 0; i < this._lockBillboards.length; i += 1) {
      const lock = this._lockBillboards[i];
      if (!lock?.mesh?.material) continue;
      const pulse = 0.5 + Math.sin(this._pulseTime * 3.4 + i * 0.82) * 0.5;
      lock.mesh.position.y = -0.86 + pulse * 0.02;
      lock.mesh.material.opacity = 0.72 + pulse * 0.2;
    }
    if (this._loomBillboard?.mesh?.material) {
      const pulse = 0.5 + Math.sin(this._pulseTime * 2.5 + 0.24) * 0.5;
      this._loomBillboard.mesh.material.opacity = 0.78 + pulse * 0.14;
    }

    const nearDoor = Math.hypot(playerPosition.x - LAST_DOOR_PORTAL.x, playerPosition.z - LAST_DOOR_PORTAL.y) <= 1.24;
    if (nearDoor && !this._wasNearDoorPortal) {
      this.pushSceneToast(
        this._act3Unlocked ? "The Last Door corridor opens ahead." : "The final corridor is still sealed."
      );
    }
    this._wasNearDoorPortal = nearDoor;

    const nearLoom = Math.hypot(playerPosition.x - MEMORY_LOOM_CENTER.x, playerPosition.z - MEMORY_LOOM_CENTER.y) <= 1.34;
    if (nearLoom && !this._wasNearLoom) {
      this.pushSceneToast("The Memory Loom vibrates through your bones.");
    }
    this._wasNearLoom = nearLoom;

    if (!this._titleShown) {
      this.pushSceneToast("INNER SPIRE");
      this._titleShown = true;
    }
  }
}
