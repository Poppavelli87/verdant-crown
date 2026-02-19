import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.15, 0.08);
const WINDWARD_FORWARD_PORTAL = new THREE.Vector2(4.2, -0.06);

export class RidgePassScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "ridgepass";
    this.displayName = "Ridge Pass";
    this.regionId = "verdant-wilds";
    this._wasNearReturnPortal = false;
    this._wasNearForwardPortal = false;
    this._returnPortal = null;
    this._forwardPortal = null;

    this._createProps();
    this._returnPortal = this.addPortal({
      id: "ridgepass_to_thornmere",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#d3e6b8",
      label: "Return to Thornmere",
    });
    this._forwardPortal = this.addPortal({
      id: "ridgepass_to_windward",
      targetSceneId: "windward",
      position: WINDWARD_FORWARD_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#cde4dd",
      label: "Windward Ridge",
    });
  }

  _createProps() {
    const rockSpots = [
      { x: -2.75, z: -1.15, w: 1.36, h: 0.84 },
      { x: -1.05, z: 1.4, w: 1.08, h: 0.74 },
      { x: 1.45, z: -0.98, w: 1.24, h: 0.78 },
      { x: 2.7, z: 1.22, w: 1.28, h: 0.82 },
    ];
    for (const spot of rockSpots) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/basalt_rock.png",
        width: spot.w,
        height: spot.h,
        position: new THREE.Vector2(spot.x, spot.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        shadowOpacity: 0.2,
      });
    }

    const trees = [
      { x: -3.15, z: 2.05 },
      { x: 3.05, z: -2.15 },
    ];
    for (let i = 0; i < trees.length; i += 1) {
      const tree = trees[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/charred_tree.png",
        width: 1.65,
        height: 1.9,
        position: new THREE.Vector2(tree.x, tree.z),
        groundY: -0.9,
        swayAmount: 0.015,
        swaySpeed: 0.85,
        swayPhase: i * 0.53,
      });
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(0.5, 0.05);
  }

  getVisualConfig() {
    return {
      skyTint: "#8f8a7a",
      lightTint: "#f5dec0",
      groundTint: "#78674f",
      fogMultiplier: 1.01,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    if (!this._returnPortal) return;
    const distance = Math.hypot(
      playerPosition.x - THORNMERE_RETURN_PORTAL.x,
      playerPosition.z - THORNMERE_RETURN_PORTAL.y
    );
    const nearPortal = distance <= 1.22;
    if (nearPortal && !this._wasNearReturnPortal) {
      this.pushSceneToast("The ridge wind cuts toward Thornmere.");
    }
    this._wasNearReturnPortal = nearPortal;

    const forwardDistance = Math.hypot(
      playerPosition.x - WINDWARD_FORWARD_PORTAL.x,
      playerPosition.z - WINDWARD_FORWARD_PORTAL.y
    );
    const nearForwardPortal = forwardDistance <= 1.22;
    if (nearForwardPortal && !this._wasNearForwardPortal) {
      this.pushSceneToast("The pass narrows toward Windward Ridge.");
    }
    this._wasNearForwardPortal = nearForwardPortal;
  }
}
