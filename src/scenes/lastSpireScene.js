import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const RETURN_PORTAL = new THREE.Vector2(-4.06, 0.02);
const RIFT_CENTER = new THREE.Vector2(-1.18, 0.08);
const RIFT_RADIUS = 1.24;
const RIFT_TRIGGER_RADIUS = 1.18;
const RIFT_ANCHORS = Object.freeze([
  Object.freeze({ id: "rift-anchor-1", x: -2.08, y: 0.88 }),
  Object.freeze({ id: "rift-anchor-2", x: -1.04, y: -0.86 }),
  Object.freeze({ id: "rift-anchor-3", x: 0.08, y: 0.82 }),
]);

const CROWN_ENGINE_CENTER = new THREE.Vector2(2.46, -0.34);
const CORE_SETPIECE_RADIUS = 2.72;
const CORE_TRIGGER_RADIUS = 1.18;
const FINAL_CLAMPS = Object.freeze([
  Object.freeze({ id: "final-clamp-1", x: 1.8, y: 0.38 }),
  Object.freeze({ id: "final-clamp-2", x: 3.08, y: 0.22 }),
  Object.freeze({ id: "final-clamp-3", x: 2.98, y: -1.24 }),
]);
const CORE_PILLARS = Object.freeze([
  Object.freeze({ x: 1.66, y: -1.16 }),
  Object.freeze({ x: 3.68, y: -0.82 }),
]);

const BOSS_ARENA_CENTER = new THREE.Vector2(3.26, -1.08);
const BOSS_ARENA_RADIUS = 2.7;
const BOSS_TRIGGER_RADIUS = 1.14;
const CHOICE_ALTAR = new THREE.Vector2(4.04, -1.76);
const CHOICE_ALTAR_RADIUS = 1.12;

function makeFallback(painter, width = 42, height = 58) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createSpireColumnFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(8, 46, 26, 4);
    ctx.fillStyle = "#242835";
    ctx.fillRect(16, 6, 10, 40);
    ctx.fillRect(14, 16, 14, 4);
    ctx.fillStyle = "#4d5f7a";
    ctx.fillRect(17, 8, 8, 34);
    ctx.fillStyle = "#d6e7ff";
    ctx.fillRect(19, 12, 4, 2);
    ctx.fillRect(19, 24, 4, 2);
  });
}

function createCoreFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(7, 46, 28, 4);
    ctx.fillStyle = "#1f2a3c";
    ctx.fillRect(10, 10, 22, 36);
    ctx.fillStyle = "#3f5b80";
    ctx.fillRect(11, 12, 20, 31);
    ctx.fillStyle = "#d4f1ff";
    ctx.fillRect(15, 16, 12, 4);
    ctx.fillRect(13, 29, 16, 3);
    ctx.fillRect(16, 37, 10, 2);
  });
}

function createRiftFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(6, 44, 30, 4);
    ctx.fillStyle = "rgba(117, 141, 255, 0.42)";
    ctx.fillRect(8, 14, 26, 30);
    ctx.fillStyle = "rgba(180, 208, 255, 0.56)";
    ctx.fillRect(11, 17, 20, 24);
    ctx.fillStyle = "rgba(240, 249, 255, 0.42)";
    ctx.fillRect(16, 22, 10, 14);
  });
}

function createAnchorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(10, 44, 22, 4);
    ctx.fillStyle = "#253448";
    ctx.fillRect(16, 12, 10, 32);
    ctx.fillStyle = "#6a92be";
    ctx.fillRect(14, 10, 14, 5);
    ctx.fillStyle = "#e3f4ff";
    ctx.fillRect(17, 14, 8, 2);
    ctx.fillRect(17, 24, 8, 2);
  });
}

function createChoiceFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(8, 46, 26, 4);
    ctx.fillStyle = "#2a3446";
    ctx.fillRect(12, 18, 18, 28);
    ctx.fillStyle = "#617ea4";
    ctx.fillRect(13, 20, 16, 22);
    ctx.fillStyle = "#dff4ff";
    ctx.fillRect(15, 24, 12, 3);
    ctx.fillRect(16, 33, 10, 2);
  });
}

const SPIRE_COLUMN_FALLBACK = createSpireColumnFallback();
const CORE_FALLBACK = createCoreFallback();
const RIFT_FALLBACK = createRiftFallback();
const ANCHOR_FALLBACK = createAnchorFallback();
const CHOICE_FALLBACK = createChoiceFallback();

export class LastSpireScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "last_spire";
    this.displayName = "The Last Spire";
    this.regionId = "umbral-hollows";

    this._pulseTime = 0;
    this._titleShown = false;
    this._wasNearRift = false;
    this._wasNearCore = false;
    this._wasNearAltar = false;

    this._coreReached = Boolean(
      this.saveState?.getStoryFlag?.("endgame_setpiece_core_reached") ??
        this.saveState?.getFlag?.("story.endgame_setpiece_core_reached")
    );
    this._bossDefeated = Boolean(
      this.saveState?.getStoryFlag?.("endgame_final_boss_defeated") ??
        this.saveState?.getFlag?.("story.endgame_final_boss_defeated")
    );

    this._riftBillboard = null;
    this._clampBillboards = [];
    this._altarBillboard = null;

    this._createProps();
    this.addPortal({
      id: "last-spire-return",
      targetSceneId: "inner_spire_last_door",
      position: RETURN_PORTAL.clone(),
      radius: 0.86,
      interactRadius: 1.05,
      color: "#d9e8ff",
      label: "Return to the Last Door",
    });
    this._syncStoryVisuals();
  }

  _createProps() {
    const silhouetteColumns = [
      { x: -2.96, z: -1.7, scale: 1.82, opacity: 0.78 },
      { x: 0.24, z: -2.16, scale: 2.1, opacity: 0.86 },
      { x: 2.66, z: -2.22, scale: 2.36, opacity: 0.9 },
      { x: 4.86, z: -1.58, scale: 1.74, opacity: 0.8 },
    ];
    for (const entry of silhouetteColumns) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/spire_silhouette.png",
        fallbackTexture: SPIRE_COLUMN_FALLBACK,
        width: 1.58 * entry.scale,
        height: 2.36 * entry.scale,
        position: new THREE.Vector2(entry.x, entry.z),
        groundY: -0.9,
        depthBaseOrder: 1080,
        shadowOpacity: 0.05,
        groundPatchOpacity: 0.03,
        opacity: entry.opacity,
      });
    }

    this._riftBillboard = this.addBillboard({
      assetPath: "./assets/sprites/props/reality_rift.png",
      fallbackTexture: RIFT_FALLBACK,
      width: 2.18,
      height: 2.38,
      position: RIFT_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.06,
      depthBaseOrder: 1162,
      shadowOpacity: 0.06,
      groundPatchOpacity: 0.04,
      scaleWithProps: false,
      tint: "#d8e6ff",
      opacity: 0.86,
    });

    for (let i = 0; i < RIFT_ANCHORS.length; i += 1) {
      const anchor = RIFT_ANCHORS[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/worldroot_anchor.png",
        fallbackTexture: ANCHOR_FALLBACK,
        width: 0.86,
        height: 1.26,
        position: new THREE.Vector2(anchor.x, anchor.y),
        groundY: -0.9,
        yOffset: 0.03,
        depthBaseOrder: 1164 + i,
        shadowOpacity: 0.16,
        groundPatchOpacity: 0.07,
        scaleWithProps: false,
        tint: "#d4ebff",
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/props/crown_engine_core.png",
      fallbackTexture: CORE_FALLBACK,
      width: 2.18,
      height: 2.76,
      position: CROWN_ENGINE_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.06,
      depthBaseOrder: 1170,
      shadowOpacity: 0.24,
      groundPatchOpacity: 0.12,
      scaleWithProps: false,
      tint: "#d7e9ff",
    });

    this._clampBillboards = FINAL_CLAMPS.map((entry, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/lock_node.png",
        fallbackTexture: ANCHOR_FALLBACK,
        width: 0.84,
        height: 1.24,
        position: new THREE.Vector2(entry.x, entry.y),
        groundY: -0.9,
        yOffset: 0.03,
        depthBaseOrder: 1168 + index,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#cfe2ff",
      })
    );

    for (let i = 0; i < CORE_PILLARS.length; i += 1) {
      const pillar = CORE_PILLARS[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/prism_pillar.png",
        fallbackTexture: CHOICE_FALLBACK,
        width: 0.94,
        height: 1.54,
        position: new THREE.Vector2(pillar.x, pillar.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1152 + i,
        shadowOpacity: 0.2,
        groundPatchOpacity: 0.09,
        scaleWithProps: false,
        tint: "#d4e1f8",
      });
    }

    this._altarBillboard = this.addBillboard({
      assetPath: "./assets/sprites/props/memory_slate.png",
      fallbackTexture: CHOICE_FALLBACK,
      width: 1.12,
      height: 1.5,
      position: CHOICE_ALTAR.clone(),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1174,
      shadowOpacity: 0.2,
      groundPatchOpacity: 0.1,
      scaleWithProps: false,
      tint: "#dfecff",
      opacity: 0.52,
    });
  }

  _syncStoryVisuals() {
    for (const clamp of this._clampBillboards) {
      if (!clamp?.mesh) continue;
      clamp.mesh.visible = !this._coreReached;
      if (clamp.mesh.material) {
        clamp.mesh.material.opacity = this._coreReached ? 0.3 : 0.88;
      }
    }
    if (this._altarBillboard?.mesh?.material) {
      this._altarBillboard.mesh.material.opacity = this._bossDefeated ? 0.9 : 0.52;
      this._altarBillboard.mesh.material.color.set(this._bossDefeated ? "#b8e4ff" : "#dfecff");
    }
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.endgame_setpiece_core_reached" || flagKey === "endgame_setpiece_core_reached") {
      this._coreReached = Boolean(value);
      this._syncStoryVisuals();
      return;
    }
    if (flagKey === "story.endgame_final_boss_defeated" || flagKey === "endgame_final_boss_defeated") {
      this._bossDefeated = Boolean(value);
      this._syncStoryVisuals();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(-3.12, 0.04);
  }

  getVisualConfig() {
    return {
      skyTint: "#7a7f9e",
      lightTint: "#d9e3ff",
      groundTint: "#4a4f63",
      fogMultiplier: 1.08,
    };
  }

  getLastSpireConfig() {
    return {
      rift: {
        center: { x: RIFT_CENTER.x, y: RIFT_CENTER.y },
        radius: RIFT_RADIUS,
        triggerRadius: RIFT_TRIGGER_RADIUS,
        checkpoint: { x: -2.86, z: 0.04 },
        anchors: RIFT_ANCHORS.map((entry) => ({ id: entry.id, x: entry.x, y: entry.y })),
      },
      core: {
        center: { x: CROWN_ENGINE_CENTER.x, y: CROWN_ENGINE_CENTER.y },
        radius: CORE_SETPIECE_RADIUS,
        triggerRadius: CORE_TRIGGER_RADIUS,
        checkpoint: { x: 0.94, z: -0.12 },
        clamps: FINAL_CLAMPS.map((entry) => ({ id: entry.id, x: entry.x, y: entry.y })),
        coverPillars: CORE_PILLARS.map((entry) => ({ x: entry.x, y: entry.y })),
      },
      bossArena: {
        center: { x: BOSS_ARENA_CENTER.x, y: BOSS_ARENA_CENTER.y },
        radius: BOSS_ARENA_RADIUS,
        triggerRadius: BOSS_TRIGGER_RADIUS,
      },
      choiceAltar: {
        x: CHOICE_ALTAR.x,
        y: CHOICE_ALTAR.y,
        interactRadius: CHOICE_ALTAR_RADIUS,
      },
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._pulseTime += dtSeconds;

    if (this._riftBillboard?.mesh?.material) {
      const pulse = 0.5 + Math.sin(this._pulseTime * 3.2) * 0.5;
      this._riftBillboard.mesh.material.opacity = 0.58 + pulse * 0.26;
      this._riftBillboard.mesh.position.y = -0.84 + pulse * 0.03;
    }
    if (this._altarBillboard?.mesh?.material && this._bossDefeated) {
      const pulse = 0.5 + Math.sin(this._pulseTime * 2.4 + 0.32) * 0.5;
      this._altarBillboard.mesh.material.opacity = 0.72 + pulse * 0.24;
    }

    const nearRift = Math.hypot(playerPosition.x - RIFT_CENTER.x, playerPosition.z - RIFT_CENTER.y) <= 1.32;
    if (nearRift && !this._wasNearRift) {
      this.pushSceneToast("Reality is torn thin. Cross quickly.");
    }
    this._wasNearRift = nearRift;

    const nearCore = Math.hypot(playerPosition.x - CROWN_ENGINE_CENTER.x, playerPosition.z - CROWN_ENGINE_CENTER.y) <= 1.34;
    if (nearCore && !this._wasNearCore) {
      this.pushSceneToast("The Crown Engine is awake.");
    }
    this._wasNearCore = nearCore;

    const nearAltar = Math.hypot(playerPosition.x - CHOICE_ALTAR.x, playerPosition.z - CHOICE_ALTAR.y) <= 1.26;
    if (nearAltar && !this._wasNearAltar && this._bossDefeated) {
      this.pushSceneToast("The altar waits for your verdict.");
    }
    this._wasNearAltar = nearAltar;

    if (!this._titleShown) {
      this.pushSceneToast("THE LAST SPIRE");
      this._titleShown = true;
    }
  }
}
