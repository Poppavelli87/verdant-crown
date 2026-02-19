import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.22, -0.02);
const SPIRE_GATE_CENTER = new THREE.Vector2(2.84, -0.14);
const SPIRE_GATE_TRIGGER_RADIUS = 1.12;
const SPIRE_ARENA_CENTER = new THREE.Vector2(3.44, -0.92);
const SPIRE_ARENA_RADIUS = 2.62;

const LOCK_NODES = Object.freeze([
  Object.freeze({ id: "lock-node-1", x: 2.22, y: 0.56 }),
  Object.freeze({ id: "lock-node-2", x: 3.46, y: 0.52 }),
  Object.freeze({ id: "lock-node-3", x: 3.14, y: -0.92 }),
]);

const CONDUIT_CABLES = Object.freeze([
  Object.freeze({ x: 1.66, y: 0.34, scale: 1.05 }),
  Object.freeze({ x: 2.44, y: -0.7, scale: 0.98 }),
  Object.freeze({ x: 3.74, y: 0.22, scale: 1.02 }),
  Object.freeze({ x: 4.24, y: -0.82, scale: 1.08 }),
]);

const OVERLOAD_COVER_PILLARS = Object.freeze([
  Object.freeze({ x: 2.36, y: -1.36 }),
  Object.freeze({ x: 4.14, y: -0.34 }),
]);

function makeFallback(painter, width = 40, height = 56) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createSpireSilhouetteFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(8, 46, 24, 4);
    ctx.fillStyle = "#2a2d38";
    ctx.fillRect(16, 6, 8, 40);
    ctx.fillRect(13, 18, 14, 3);
    ctx.fillStyle = "#4f586b";
    ctx.fillRect(17, 8, 6, 34);
    ctx.fillStyle = "#d8e4ff";
    ctx.fillRect(18, 12, 4, 3);
    ctx.fillRect(18, 22, 4, 2);
    ctx.fillRect(19, 30, 2, 8);
  });
}

function createSpireGateFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(5, 46, 30, 4);
    ctx.fillStyle = "#232937";
    ctx.fillRect(7, 10, 26, 36);
    ctx.fillStyle = "#3d4960";
    ctx.fillRect(8, 11, 24, 33);
    ctx.fillStyle = "#cde7ff";
    ctx.fillRect(13, 16, 14, 3);
    ctx.fillRect(11, 29, 18, 2);
    ctx.fillRect(14, 36, 12, 2);
  }, 42, 56);
}

function createLockNodeFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(10, 44, 20, 4);
    ctx.fillStyle = "#2c3947";
    ctx.fillRect(15, 14, 10, 30);
    ctx.fillStyle = "#7199c7";
    ctx.fillRect(14, 11, 12, 5);
    ctx.fillStyle = "#ddf4ff";
    ctx.fillRect(17, 13, 6, 2);
    ctx.fillRect(17, 23, 6, 2);
  }, 40, 52);
}

function createCableFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(4, 34, 32, 4);
    ctx.fillStyle = "#3b424f";
    ctx.fillRect(6, 32, 28, 3);
    ctx.fillStyle = "#5f7797";
    ctx.fillRect(10, 33, 20, 1);
  }, 44, 40);
}

function createPillarFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(12, 45, 16, 4);
    ctx.fillStyle = "#353f4a";
    ctx.fillRect(14, 12, 12, 33);
    ctx.fillStyle = "#556274";
    ctx.fillRect(15, 14, 10, 28);
    ctx.fillStyle = "#a4bdd8";
    ctx.fillRect(17, 20, 6, 2);
  }, 40, 54);
}

const SPIRE_SILHOUETTE_FALLBACK = createSpireSilhouetteFallback();
const SPIRE_GATE_FALLBACK = createSpireGateFallback();
const LOCK_NODE_FALLBACK = createLockNodeFallback();
const CABLE_FALLBACK = createCableFallback();
const PILLAR_FALLBACK = createPillarFallback();

export class SpireApproachScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "spire_approach";
    this.displayName = "Outer Spire Approach";
    this.regionId = "umbral-hollows";

    this._pulseTime = 0;
    this._wasNearReturnPortal = false;
    this._wasNearGate = false;
    this._titleShown = false;

    this._outerSpireBreached = Boolean(
      this.saveState?.getStoryFlag?.("endgame_outer_spire_breached") ??
        this.saveState?.getFlag?.("story.endgame_outer_spire_breached")
    );
    this._spireEntryUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("endgame_spire_entry_unlocked") ??
        this.saveState?.getFlag?.("story.endgame_spire_entry_unlocked")
    );

    this._gateBillboard = null;
    this._lockNodeBillboards = [];
    this._entryPortal = null;

    this._createProps();
    this.addPortal({
      id: "spire-approach-return",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.86,
      interactRadius: 1.05,
      color: "#cfdfff",
      label: "Return to Thornmere",
    });
    this._entryPortal = this.addPortal({
      id: "spire-approach-enter",
      targetSceneId: "spire_antechamber",
      position: SPIRE_GATE_CENTER.clone().add(new THREE.Vector2(0.6, -0.72)),
      radius: 0.86,
      interactRadius: 0,
      color: "#9ed4ff",
      label: "Enter the Spire",
    });
    this._syncGateState();
  }

  _createProps() {
    const silhouettes = [
      { x: 0.56, z: -1.78, scale: 1.9, opacity: 0.82 },
      { x: 2.94, z: -2.26, scale: 2.6, opacity: 0.9 },
      { x: 4.72, z: -1.54, scale: 1.75, opacity: 0.78 },
    ];
    for (const entry of silhouettes) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/spire_silhouette.png",
        fallbackTexture: SPIRE_SILHOUETTE_FALLBACK,
        width: 1.66 * entry.scale,
        height: 2.48 * entry.scale,
        position: new THREE.Vector2(entry.x, entry.z),
        groundY: -0.9,
        depthBaseOrder: 1088,
        shadowOpacity: 0.05,
        groundPatchOpacity: 0.03,
        opacity: entry.opacity,
      });
    }

    this._gateBillboard = this.addBillboard({
      assetPath: "./assets/sprites/props/spire_gate.png",
      fallbackTexture: SPIRE_GATE_FALLBACK,
      width: 2.18,
      height: 2.9,
      position: SPIRE_GATE_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1168,
      shadowOpacity: 0.24,
      groundPatchOpacity: 0.12,
      scaleWithProps: false,
      tint: "#d1dfef",
    });

    this._lockNodeBillboards = LOCK_NODES.map((node, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/lock_node.png",
        fallbackTexture: LOCK_NODE_FALLBACK,
        width: 0.84,
        height: 1.24,
        position: new THREE.Vector2(node.x, node.y),
        groundY: -0.9,
        yOffset: 0.03,
        depthBaseOrder: 1160 + index,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#d2e4ff",
      })
    );

    for (const cable of CONDUIT_CABLES) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/conduit_cable.png",
        fallbackTexture: CABLE_FALLBACK,
        width: 1.44 * cable.scale,
        height: 0.64 * cable.scale,
        position: new THREE.Vector2(cable.x, cable.y),
        groundY: -0.9,
        yOffset: 0.01,
        depthBaseOrder: 1128,
        shadowOpacity: 0.1,
        groundPatchOpacity: 0.05,
        scaleWithProps: false,
        tint: "#b4c5d9",
      });
    }

    for (let i = 0; i < OVERLOAD_COVER_PILLARS.length; i += 1) {
      const pillar = OVERLOAD_COVER_PILLARS[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/standing_stone_cover.png",
        fallbackTexture: PILLAR_FALLBACK,
        width: 0.94,
        height: 1.52,
        position: new THREE.Vector2(pillar.x, pillar.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1150 + i,
        shadowOpacity: 0.2,
        groundPatchOpacity: 0.09,
        scaleWithProps: false,
        tint: "#c8d6e9",
      });
    }
  }

  _syncGateState() {
    if (this._entryPortal) {
      const open = Boolean(this._spireEntryUnlocked);
      this._entryPortal.interactRadius = open ? 1.08 : 0;
      this._entryPortal.ring.visible = open;
      this._entryPortal.marker.mesh.visible = open;
    }

    if (this._gateBillboard?.mesh?.material) {
      const open = Boolean(this._outerSpireBreached || this._spireEntryUnlocked);
      this._gateBillboard.mesh.material.color.set(open ? "#9bcdf4" : "#d1dfef");
      this._gateBillboard.mesh.material.opacity = open ? 0.76 : 0.95;
    }

    for (const node of this._lockNodeBillboards) {
      if (!node?.mesh?.material) continue;
      const active = !this._outerSpireBreached;
      node.mesh.visible = active;
      node.mesh.material.opacity = active ? 0.9 : 0.35;
    }
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.endgame_outer_spire_breached" || flagKey === "endgame_outer_spire_breached") {
      this._outerSpireBreached = Boolean(value);
      this._syncGateState();
      return;
    }
    if (flagKey === "story.endgame_spire_entry_unlocked" || flagKey === "endgame_spire_entry_unlocked") {
      this._spireEntryUnlocked = Boolean(value);
      this._syncGateState();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(-1.64, 0.02);
  }

  getVisualConfig() {
    return {
      skyTint: "#8a725f",
      lightTint: "#ead3bf",
      groundTint: "#61554a",
      fogMultiplier: 1.04,
    };
  }

  getSpireBreachConfig() {
    return {
      gateCenter: { x: SPIRE_GATE_CENTER.x, y: SPIRE_GATE_CENTER.y },
      triggerRadius: SPIRE_GATE_TRIGGER_RADIUS,
      arenaRadius: SPIRE_ARENA_RADIUS,
      lockNodes: LOCK_NODES.map((node) => ({ id: node.id, x: node.x, y: node.y })),
      checkpoint: { x: -0.74, z: 0.02 },
      coverPillars: OVERLOAD_COVER_PILLARS.map((entry) => ({ x: entry.x, y: entry.y })),
    };
  }

  getBossArenaConfig() {
    return {
      bossId: "spire_gatewarden",
      bounds: {
        type: "circle",
        center: { x: SPIRE_ARENA_CENTER.x, y: SPIRE_ARENA_CENTER.y },
        radius: SPIRE_ARENA_RADIUS,
      },
      trigger: {
        center: { x: SPIRE_ARENA_CENTER.x, y: SPIRE_ARENA_CENTER.y },
        radius: 1.18,
      },
      resetCooldownSeconds: 3.5,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._pulseTime += dtSeconds;

    if (this._gateBillboard?.mesh?.material) {
      const pulse = 0.5 + Math.sin(this._pulseTime * 2.8) * 0.5;
      const baseOpacity = this._outerSpireBreached || this._spireEntryUnlocked ? 0.68 : 0.84;
      this._gateBillboard.mesh.material.opacity = baseOpacity + pulse * 0.1;
    }
    for (let i = 0; i < this._lockNodeBillboards.length; i += 1) {
      const node = this._lockNodeBillboards[i];
      if (!node?.mesh?.material || !node.mesh.visible) continue;
      const pulse = 0.5 + Math.sin(this._pulseTime * 4.2 + i * 0.82) * 0.5;
      node.mesh.position.y = -0.86 + pulse * 0.02;
      node.mesh.material.opacity = 0.72 + pulse * 0.22;
    }

    const returnDistance = Math.hypot(
      playerPosition.x - THORNMERE_RETURN_PORTAL.x,
      playerPosition.z - THORNMERE_RETURN_PORTAL.y
    );
    const nearReturn = returnDistance <= 1.18;
    if (nearReturn && !this._wasNearReturnPortal) {
      this.pushSceneToast("Thornmere remains behind you.");
    }
    this._wasNearReturnPortal = nearReturn;

    const gateDistance = Math.hypot(
      playerPosition.x - SPIRE_GATE_CENTER.x,
      playerPosition.z - SPIRE_GATE_CENTER.y
    );
    const nearGate = gateDistance <= 1.26;
    if (nearGate && !this._wasNearGate) {
      this.pushSceneToast(
        this._outerSpireBreached || this._spireEntryUnlocked
          ? "The breach trembles open."
          : "The Outer Spire gate hums with locked current."
      );
    }
    this._wasNearGate = nearGate;

    if (!this._titleShown) {
      this.pushSceneToast("OUTER SPIRE APPROACH");
      this._titleShown = true;
    }
  }
}

