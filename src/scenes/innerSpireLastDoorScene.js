import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const RETURN_PORTAL = new THREE.Vector2(-3.42, 0.02);
const LAST_DOOR_POSITION = new THREE.Vector2(1.84, -0.14);
const LAST_DOOR_INTERACT_RADIUS = 1.1;

function makeFallback(painter, width = 42, height = 58) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createHallPillarFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(12, 46, 18, 4);
    ctx.fillStyle = "#293547";
    ctx.fillRect(15, 12, 12, 34);
    ctx.fillStyle = "#5f7391";
    ctx.fillRect(16, 14, 10, 28);
    ctx.fillStyle = "#d9eeff";
    ctx.fillRect(18, 20, 6, 2);
  }, 44, 58);
}

function createLastDoorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(7, 46, 28, 4);
    ctx.fillStyle = "#1f2b3c";
    ctx.fillRect(9, 10, 24, 36);
    ctx.fillStyle = "#445b79";
    ctx.fillRect(10, 11, 22, 32);
    ctx.fillStyle = "#d3efff";
    ctx.fillRect(15, 16, 12, 3);
    ctx.fillRect(14, 28, 14, 2);
    ctx.fillRect(16, 36, 10, 2);
  }, 44, 60);
}

const PILLAR_FALLBACK = createHallPillarFallback();
const LAST_DOOR_FALLBACK = createLastDoorFallback();

export class InnerSpireLastDoorScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "inner_spire_last_door";
    this.displayName = "Last Door Threshold";
    this.regionId = "umbral-hollows";

    this._pulseTime = 0;
    this._titleShown = false;
    this._wasNearDoor = false;

    this._createProps();
    this.addPortal({
      id: "inner-spire-last-door-return",
      targetSceneId: "inner_spire",
      position: RETURN_PORTAL.clone(),
      radius: 0.86,
      interactRadius: 1.05,
      color: "#cfdff7",
      label: "Return to the Loom hall",
    });
  }

  _createProps() {
    const pillars = [
      { x: -1.82, z: -1.18, scale: 1.04 },
      { x: -0.16, z: -0.92, scale: 1.08 },
      { x: 1.22, z: -1.24, scale: 1.02 },
      { x: 2.82, z: -1.02, scale: 1.06 },
    ];
    for (const entry of pillars) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/prism_pillar.png",
        fallbackTexture: PILLAR_FALLBACK,
        width: 0.94 * entry.scale,
        height: 1.58 * entry.scale,
        position: new THREE.Vector2(entry.x, entry.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1148,
        shadowOpacity: 0.19,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#d0e1fb",
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/props/spire_inner_door.png",
      fallbackTexture: LAST_DOOR_FALLBACK,
      width: 2.24,
      height: 2.92,
      position: LAST_DOOR_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1172,
      shadowOpacity: 0.24,
      groundPatchOpacity: 0.1,
      scaleWithProps: false,
      tint: "#deecff",
    });
  }

  getSpawnPosition() {
    return new THREE.Vector2(-1.98, 0.02);
  }

  getVisualConfig() {
    return {
      skyTint: "#6f7792",
      lightTint: "#d9e3f4",
      groundTint: "#4d566c",
      fogMultiplier: 1.04,
    };
  }

  getInnerSpireLastDoorConfig() {
    return {
      lastDoor: {
        x: LAST_DOOR_POSITION.x,
        y: LAST_DOOR_POSITION.y,
        interactRadius: LAST_DOOR_INTERACT_RADIUS,
      },
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._pulseTime += dtSeconds;
    const nearDoor = Math.hypot(playerPosition.x - LAST_DOOR_POSITION.x, playerPosition.z - LAST_DOOR_POSITION.y) <= 1.2;
    if (nearDoor && !this._wasNearDoor) {
      this.pushSceneToast("The Last Door listens, but does not open.");
    }
    this._wasNearDoor = nearDoor;
    if (!this._titleShown) {
      this.pushSceneToast("LAST DOOR THRESHOLD");
      this._titleShown = true;
    }
  }
}
