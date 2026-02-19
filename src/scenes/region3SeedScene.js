import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.18, 0.04);

export class Region3SeedScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "region3_seed";
    this.displayName = "Ridge Beyond";
    this.regionId = "skyreach-steppe";
    this._wasNearReturnPortal = false;
    this._createProps();
    this._returnPortal = this.addPortal({
      id: "region3_seed_to_thornmere",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#d0e8d2",
      label: "Return to Thornmere",
    });
    this._titleCardShown = false;
  }

  _createProps() {
    const rocks = [
      { x: -2.75, z: -1.05, w: 1.28, h: 0.82 },
      { x: -1.35, z: 1.6, w: 1.1, h: 0.76 },
      { x: 1.55, z: -1.28, w: 1.22, h: 0.8 },
      { x: 2.92, z: 1.36, w: 1.36, h: 0.86 },
    ];
    for (const rock of rocks) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/basalt_rock.png",
        width: rock.w,
        height: rock.h,
        position: new THREE.Vector2(rock.x, rock.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        shadowOpacity: 0.2,
      });
    }

    const grass = [
      { x: -2.25, z: 0.65 },
      { x: -0.35, z: -1.75 },
      { x: 0.88, z: 1.88 },
      { x: 2.18, z: -0.44 },
    ];
    for (let i = 0; i < grass.length; i += 1) {
      const patch = grass[i];
      this.addBillboard({
        assetPath: "./assets/sprites/details/grass_clump.png",
        width: 0.5,
        height: 0.62,
        position: new THREE.Vector2(patch.x, patch.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1094,
        swayAmount: 0.032,
        swaySpeed: 1.05,
        swayPhase: i * 0.58,
        anchorShadow: false,
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/props/signpost.png",
      width: 0.64,
      height: 0.98,
      position: new THREE.Vector2(0.9, 0.18),
      groundY: -0.9,
      depthBaseOrder: 1140,
      shadowOpacity: 0.14,
      groundPatchOpacity: 0.05,
    });
  }

  onEnter() {
    this._titleCardShown = false;
  }

  getSpawnPosition() {
    return new THREE.Vector2(0.88, 0.14);
  }

  getVisualConfig() {
    return {
      skyTint: "#9ab2b5",
      lightTint: "#f3e5c6",
      groundTint: "#6f7f63",
      fogMultiplier: 0.95,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    const distance = Math.hypot(
      playerPosition.x - THORNMERE_RETURN_PORTAL.x,
      playerPosition.z - THORNMERE_RETURN_PORTAL.y
    );
    const nearPortal = distance <= 1.18;
    if (nearPortal && !this._wasNearReturnPortal) {
      this.pushSceneToast("The ridge wind points back toward Thornmere.");
    }
    this._wasNearReturnPortal = nearPortal;

    if (!this._titleCardShown) {
      this.pushSceneToast("THE RIDGE BEYOND");
      this._titleCardShown = true;
    }
  }
}
