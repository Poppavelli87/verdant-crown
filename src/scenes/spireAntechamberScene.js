import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const RETURN_PORTAL = new THREE.Vector2(-3.84, 0.02);
const INNER_SPIRE_ENTRY = new THREE.Vector2(3.62, -0.24);

function makeFallback(painter, width = 40, height = 56) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createHallPillarFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.fillRect(12, 46, 16, 4);
    ctx.fillStyle = "#2c3340";
    ctx.fillRect(14, 10, 12, 36);
    ctx.fillStyle = "#4f5b70";
    ctx.fillRect(15, 13, 10, 30);
    ctx.fillStyle = "#bcd2ea";
    ctx.fillRect(17, 20, 6, 2);
  });
}

function createInnerDoorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(6, 46, 28, 4);
    ctx.fillStyle = "#202736";
    ctx.fillRect(8, 12, 24, 34);
    ctx.fillStyle = "#39455a";
    ctx.fillRect(9, 13, 22, 30);
    ctx.fillStyle = "#d6ebff";
    ctx.fillRect(14, 18, 12, 3);
    ctx.fillRect(12, 32, 16, 2);
  }, 42, 56);
}

const HALL_PILLAR_FALLBACK = createHallPillarFallback();
const INNER_DOOR_FALLBACK = createInnerDoorFallback();

export class SpireAntechamberScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "spire_antechamber";
    this.displayName = "Spire Antechamber";
    this.regionId = "umbral-hollows";

    this._pulseTime = 0;
    this._wasNearReturn = false;
    this._wasNearInnerEntry = false;
    this._titleShown = false;
    this._gatewardenDefeated = Boolean(
      this.saveState?.getStoryFlag?.("endgame_gatewarden_defeated") ??
        this.saveState?.getFlag?.("story.endgame_gatewarden_defeated")
    );

    this._createProps();
    this.addPortal({
      id: "spire-antechamber-return",
      targetSceneId: "spire_approach",
      position: RETURN_PORTAL.clone(),
      radius: 0.86,
      interactRadius: 1.05,
      color: "#b7d4ff",
      label: "Return to the breach",
    });
    this._innerEntryPortal = this.addPortal({
      id: "inner-spire-entry",
      targetSceneId: "inner_spire",
      position: INNER_SPIRE_ENTRY.clone(),
      radius: 0.84,
      interactRadius: 0,
      color: "#c7e8ff",
      label: "Enter the Inner Spire",
    });
    this._syncInnerSpireEntry();
  }

  _createProps() {
    const pillars = [
      { x: -1.88, z: -1.22, scale: 1.05 },
      { x: -0.12, z: -0.84, scale: 1.12 },
      { x: 1.42, z: -1.12, scale: 1.08 },
      { x: 2.84, z: -0.72, scale: 1.04 },
    ];
    for (const pillar of pillars) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/antechamber_pillar.png",
        fallbackTexture: HALL_PILLAR_FALLBACK,
        width: 0.94 * pillar.scale,
        height: 1.66 * pillar.scale,
        position: new THREE.Vector2(pillar.x, pillar.z),
        groundY: -0.9,
        depthBaseOrder: 1148,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#cfdded",
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/props/spire_inner_door.png",
      fallbackTexture: INNER_DOOR_FALLBACK,
      width: 2.02,
      height: 2.82,
      position: new THREE.Vector2(3.62, -0.24),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1168,
      shadowOpacity: 0.22,
      groundPatchOpacity: 0.1,
      scaleWithProps: false,
      tint: "#dce9f7",
    });
  }

  getSpawnPosition() {
    return new THREE.Vector2(-1.24, 0.02);
  }

  getVisualConfig() {
    return {
      skyTint: "#7b7388",
      lightTint: "#dfd5e6",
      groundTint: "#55586a",
      fogMultiplier: 1.02,
    };
  }

  _syncInnerSpireEntry() {
    if (!this._innerEntryPortal) return;
    const open = Boolean(this._gatewardenDefeated);
    this._innerEntryPortal.interactRadius = open ? 1.08 : 0;
    this._innerEntryPortal.ring.visible = open;
    this._innerEntryPortal.marker.mesh.visible = open;
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.endgame_gatewarden_defeated" || flagKey === "endgame_gatewarden_defeated") {
      this._gatewardenDefeated = Boolean(value);
      this._syncInnerSpireEntry();
    }
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._pulseTime += dtSeconds;

    const nearReturn = Math.hypot(playerPosition.x - RETURN_PORTAL.x, playerPosition.z - RETURN_PORTAL.y) <= 1.18;
    if (nearReturn && !this._wasNearReturn) {
      this.pushSceneToast("The breach still answers behind you.");
    }
    this._wasNearReturn = nearReturn;

    const nearInnerEntry = Math.hypot(playerPosition.x - INNER_SPIRE_ENTRY.x, playerPosition.z - INNER_SPIRE_ENTRY.y) <= 1.22;
    if (nearInnerEntry && !this._wasNearInnerEntry) {
      this.pushSceneToast(
        this._gatewardenDefeated ? "The Inner Spire hums beyond this threshold." : "The inner gate is sealed by ward logic."
      );
    }
    this._wasNearInnerEntry = nearInnerEntry;

    if (!this._titleShown) {
      this.pushSceneToast("THE OUTER SPIRE");
      this._titleShown = true;
    }
  }
}
