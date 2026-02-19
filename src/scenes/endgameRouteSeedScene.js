import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.18, -0.02);
const ROOTWAY_RETURN_PORTAL = new THREE.Vector2(4.06, -0.08);

export class EndgameRouteSeedScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "endgame_route_seed";
    this.displayName = "Last Spire Route";
    this.regionId = "umbral-hollows";
    this._wasNearReturnPortal = false;
    this._wasNearForwardPortal = false;

    this._createProps();
    this.addPortal({
      id: "endgame_seed_to_thornmere",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.84,
      interactRadius: 1.05,
      color: "#c7dcff",
      label: "Return to Thornmere",
    });
    this.addPortal({
      id: "endgame_seed_to_region4",
      targetSceneId: "region4_seed",
      position: ROOTWAY_RETURN_PORTAL.clone(),
      radius: 0.84,
      interactRadius: 1.05,
      color: "#bce2d5",
      label: "Vault Approach",
    });
  }

  _createProps() {
    const spires = [
      { x: -2.7, z: -1.6, w: 1.1, h: 1.95 },
      { x: -0.95, z: 1.55, w: 0.96, h: 1.72 },
      { x: 1.32, z: -1.4, w: 1, h: 1.8 },
      { x: 2.88, z: 1.36, w: 1.18, h: 2.02 },
    ];
    for (const spire of spires) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/null_lattice_spire.png",
        width: spire.w,
        height: spire.h,
        position: new THREE.Vector2(spire.x, spire.z),
        groundY: -0.9,
        depthBaseOrder: 1148,
        shadowOpacity: 0.2,
      });
    }

    const markers = [
      { x: -1.8, z: 0.18 },
      { x: -0.12, z: -0.42 },
      { x: 1.74, z: 0.56 },
    ];
    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/memory_shard.png",
        width: 0.42,
        height: 0.72,
        position: new THREE.Vector2(marker.x, marker.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1160 + i,
        anchorShadow: false,
        shadowOpacity: 0.08,
      });
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(-0.14, 0.02);
  }

  getVisualConfig() {
    return {
      skyTint: "#756f86",
      lightTint: "#d7cad8",
      groundTint: "#4f5963",
      fogMultiplier: 1.05,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    const distanceToReturn = Math.hypot(
      playerPosition.x - THORNMERE_RETURN_PORTAL.x,
      playerPosition.z - THORNMERE_RETURN_PORTAL.y
    );
    const nearReturn = distanceToReturn <= 1.2;
    if (nearReturn && !this._wasNearReturnPortal) {
      this.pushSceneToast("Retreat remains possible. Not for long.");
    }
    this._wasNearReturnPortal = nearReturn;

    const distanceToForward = Math.hypot(
      playerPosition.x - ROOTWAY_RETURN_PORTAL.x,
      playerPosition.z - ROOTWAY_RETURN_PORTAL.y
    );
    const nearForward = distanceToForward <= 1.2;
    if (nearForward && !this._wasNearForwardPortal) {
      this.pushSceneToast("The Vault corridor still answers your mark.");
    }
    this._wasNearForwardPortal = nearForward;
  }
}
