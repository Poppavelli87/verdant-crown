import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BillboardSprite, resolveDepthOrder } from "../render/billboard.js";

// NpcEntity is a lightweight world actor with billboard visuals and interaction metadata.
export class NpcEntity {
  constructor({
    root,
    id,
    name,
    sprite,
    position,
    dialogueScript,
    interactRadius = 0.95,
    onInteractCallback = null,
    width = 1.56,
    height = 1.9,
    groundY = -0.9,
    tint = "#ffffff",
    depthBaseOrder = 1160,
  }) {
    this.id = id;
    this.name = name;
    this.position = position.clone();
    this.dialogueScript = dialogueScript;
    this.interactRadius = interactRadius;
    this.onInteractCallback = onInteractCallback;
    this._baseY = groundY + height * 0.5 + 0.02;
    this._idlePhase = (position.x * 0.71 + position.y * 0.47) * Math.PI * 0.5;

    this._billboard = new BillboardSprite({
      root,
      assetPath: sprite,
      width,
      height,
      position: this.position,
      groundY,
      yOffset: 0.02,
      depthBaseOrder,
      tint,
      swayAmount: 0.012,
      swaySpeed: 0.9,
      swayPhase: this._idlePhase,
    });

    this._interactRing = new THREE.Mesh(
      new THREE.RingGeometry(interactRadius * 0.72, interactRadius * 0.88, 24),
      new THREE.MeshBasicMaterial({
        color: "#e3f8cf",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this._interactRing.rotation.x = -Math.PI / 2;
    this._interactRing.position.set(this.position.x, groundY + 0.005, this.position.y);
    this._interactRing.renderOrder = resolveDepthOrder(this.position.y, 1025);
    root.add(this._interactRing);
  }

  distanceToPoint(point) {
    return Math.hypot(point.x - this.position.x, point.y - this.position.y);
  }

  containsPoint(worldPoint, radiusScale = 1) {
    return this.distanceToPoint(worldPoint) <= this.interactRadius * radiusScale;
  }

  resolveDialogueScript(context = {}) {
    if (typeof this.dialogueScript === "function") {
      return this.dialogueScript(context);
    }
    return this.dialogueScript;
  }

  buildInteraction(context = {}) {
    const script = this.resolveDialogueScript(context);
    return {
      npcId: this.id,
      npcName: this.name,
      script: Array.isArray(script) ? [...script] : [],
      onComplete: () => {
        this.onInteractCallback?.(context);
      },
    };
  }

  update({ dtSeconds, elapsedSeconds, camera, foliageMotionIntensity = 1, inRange = false }) {
    this._billboard.update(dtSeconds, elapsedSeconds, camera, foliageMotionIntensity);

    const idleLift = Math.sin(elapsedSeconds * 1.15 + this._idlePhase) * 0.02;
    this._billboard.mesh.position.y = this._baseY + idleLift;

    this._interactRing.material.opacity = inRange ? 0.24 : 0;
    this._interactRing.renderOrder = resolveDepthOrder(this.position.y, 1025);
  }

  toSnapshot() {
    return {
      id: this.id,
      name: this.name,
      x: Number(this.position.x.toFixed(3)),
      z: Number(this.position.y.toFixed(3)),
      interactRadius: this.interactRadius,
    };
  }

  dispose(root) {
    this._billboard.dispose();
    if (this._interactRing.parent === root) {
      root.remove(this._interactRing);
    }
    this._interactRing.geometry.dispose();
    this._interactRing.material.dispose();
  }
}
