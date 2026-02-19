import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";

// ArthurOpeningScene is a short playable cold-open combat beat before Thornmere.
export class ArthurOpeningScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "arthurOpening";
    this.displayName = "Hollow Edge";
    this.regionId = "umbral-hollows";

    this._createProps();
  }

  _createProps() {
    const rocks = [
      { x: -2.25, z: -1.25, variant: "rock_b", scale: 1.02 },
      { x: 2.15, z: -1.45, variant: "rock_a", scale: 0.96 },
      { x: 1.7, z: 1.85, variant: "rock_b", scale: 0.9 },
      { x: -1.75, z: 1.65, variant: "rock_a", scale: 0.9 },
    ];
    for (const rock of rocks) {
      this.addBillboard({
        assetPath: `./assets/sprites/rocks/${rock.variant}.png`,
        width: 1.08 * rock.scale,
        height: 0.72 * rock.scale,
        position: new THREE.Vector2(rock.x, rock.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        tint: "#c5cbd0",
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/props/root_spike.png",
      width: 0.95,
      height: 1.4,
      position: new THREE.Vector2(0.95, 0.62),
      groundY: -0.9,
      depthBaseOrder: 1165,
      tint: "#ced8c9",
      swayAmount: 0.015,
      swaySpeed: 0.72,
      scaleWithProps: false,
    });
  }

  getSpawnPosition() {
    return new THREE.Vector2(-1.05, 0.08);
  }

  getVisualConfig() {
    return {
      skyTint: "#6f7a81",
      lightTint: "#dce4ef",
      groundTint: "#647264",
      fogMultiplier: 1.16,
    };
  }

  getEnemySpawns() {
    return [
      {
        id: "opening-skirmisher-1",
        type: "standard",
        role: "skirmisher",
        x: 1.45,
        z: 0.2,
        maxHealth: 32,
        aggroRadius: 3.4,
        attackRange: 0.72,
        attackCooldown: 1.08,
        lingerTag: "opening",
      },
    ];
  }

  getContextState() {
    const base = super.getContextState();
    return {
      ...base,
      combatForced: true,
    };
  }
}

