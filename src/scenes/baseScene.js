import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BillboardSprite, resolveDepthOrder } from "../render/billboard.js";
import { PROP_SCALE } from "../config/scale.js";
import { REGIONS_BY_ID } from "../data/regions.js";
import { NpcEntity } from "../world/npc.js";

function disposeObject3D(root) {
  root.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") {
      child.geometry.dispose();
    }

    if (Array.isArray(child.material)) {
      for (const material of child.material) {
        material?.dispose?.();
      }
    } else if (child.material && typeof child.material.dispose === "function") {
      child.material.dispose();
    }
  });
}

function isPortalActive(portal) {
  return Boolean(
    portal &&
      Number(portal.interactRadius) > 0 &&
      portal.ring?.visible !== false &&
      portal.marker?.mesh?.visible !== false
  );
}

// BaseScene provides a disposable scene root, portal helpers, and shared metadata hooks.
export class BaseScene {
  constructor({ threeScene, rng, saveState }) {
    this.threeScene = threeScene;
    this.rng = rng;
    this.saveState = saveState;
    this.root = new THREE.Group();
    this.root.name = "scene-root";
    this.threeScene.add(this.root);

    this.id = "base";
    this.displayName = "Base Scene";
    this.regionId = "verdant-wilds";

    this._portals = [];
    this._portalPulseTime = 0;
    this._billboards = [];
    this._npcs = [];
    this._foliageMotionIntensity = 1;
    this._sceneToast = null;
    this._npcFocusId = null;
  }

  // Lifecycle hook: called by SceneManager after scene instance creation.
  init(_context = {}) {
    this.ensureMounted();
  }

  // Lifecycle hook: called by SceneManager when the scene becomes active.
  onEnter(_context = {}) {
    this.ensureMounted();
  }

  ensureMounted() {
    if (this.root.parent !== this.threeScene) {
      this.threeScene.add(this.root);
    }
  }

  addObject(object3D) {
    this.root.add(object3D);
    return object3D;
  }

  addBillboard(config) {
    const {
      position,
      width = 1,
      groundY = -0.9,
      anchorShadow = true,
      shadowOpacity = 0.22,
      groundPatchOpacity = 0.06,
      scaleWithProps = true,
    } = config;
    const scale = scaleWithProps ? PROP_SCALE : 1;
    const scaledWidth = width * scale;
    const scaledHeight = (config.height ?? 1) * scale;

    if (anchorShadow && position) {
      const shadowRadius = Math.max(0.16, scaledWidth * 0.24);
      const groundPatch = new THREE.Mesh(
        new THREE.CircleGeometry(shadowRadius * 1.34, 20),
        new THREE.MeshBasicMaterial({
          color: "#10230f",
          transparent: true,
          opacity: groundPatchOpacity,
          depthWrite: false,
        })
      );
      groundPatch.rotation.x = -Math.PI / 2;
      groundPatch.position.set(position.x, groundY + 0.004, position.y);
      groundPatch.renderOrder = resolveDepthOrder(position.y, 905);
      this.addObject(groundPatch);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(shadowRadius, 20),
        new THREE.MeshBasicMaterial({
          color: "#000000",
          transparent: true,
          opacity: shadowOpacity,
          depthWrite: false,
        })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(position.x, groundY + 0.006, position.y);
      shadow.renderOrder = resolveDepthOrder(position.y, 915);
      this.addObject(shadow);
    }

    const billboard = new BillboardSprite({
      root: this.root,
      ...config,
      width: scaledWidth,
      height: scaledHeight,
    });
    this._billboards.push(billboard);
    return billboard;
  }

  addPortal({
    id,
    targetSceneId,
    position,
    radius = 0.75,
    interactRadius = 1.0,
    color = "#8be6a1",
    label = "Portal",
  }) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.72, radius, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, -0.86, position.y);
    ring.renderOrder = resolveDepthOrder(position.y, 1030);
    this.addObject(ring);

    const marker = this.addBillboard({
      assetPath: "./assets/sprites/stump.png",
      width: 0.9,
      height: 0.9,
      position: position.clone(),
      groundY: -0.9,
      yOffset: 0.06,
      depthBaseOrder: 1140,
      opacity: 0.9,
      tint: color,
      scaleWithProps: false,
    });

    const portal = {
      id,
      targetSceneId,
      label,
      position: position.clone(),
      radius,
      interactRadius,
      ring,
      marker,
    };
    this._portals.push(portal);
    return portal;
  }

  addNpc(config) {
    const npc = new NpcEntity({
      root: this.root,
      ...config,
    });
    this._npcs.push(npc);
    return npc;
  }

  getNpcs() {
    return this._npcs;
  }

  getNpcNearPoint(point, radiusScale = 1) {
    for (const npc of this._npcs) {
      if (npc.containsPoint(point, radiusScale)) {
        return npc;
      }
    }
    return null;
  }

  getNearestNpcInRange(point, range) {
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const npc of this._npcs) {
      const distance = npc.distanceToPoint(point);
      if (distance <= range && distance < bestDistance) {
        best = npc;
        bestDistance = distance;
      }
    }
    return best;
  }

  getNpcById(npcId) {
    return this._npcs.find((npc) => npc.id === npcId) ?? null;
  }

  interactNpcById(npcId, context = {}) {
    const npc = this.getNpcById(npcId);
    if (!npc) return null;
    return npc.buildInteraction(context);
  }

  setNpcFocus(npcId) {
    this._npcFocusId = npcId;
  }

  pushSceneToast(message) {
    this._sceneToast = message;
  }

  consumeSceneToast() {
    const message = this._sceneToast;
    this._sceneToast = null;
    return message;
  }

  getPortals() {
    return this._portals.filter((portal) => isPortalActive(portal));
  }

  getPortalNearPoint(point, radiusScale = 1) {
    for (const portal of this._portals) {
      if (!isPortalActive(portal)) continue;
      const distance = portal.position.distanceTo(point);
      if (distance <= portal.radius * radiusScale) {
        return portal;
      }
    }
    return null;
  }

  getNearestPortalInRange(point, range) {
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const portal of this._portals) {
      if (!isPortalActive(portal)) continue;
      const distance = portal.position.distanceTo(point);
      if (distance <= range && distance < bestDistance) {
        best = portal;
        bestDistance = distance;
      }
    }
    return best;
  }

  getPortalById(portalId) {
    const portal = this._portals.find((entry) => entry.id === portalId);
    if (!isPortalActive(portal)) return null;
    return portal ?? null;
  }

  setFoliageMotionIntensity(intensity) {
    this._foliageMotionIntensity = intensity;
  }

  getSpawnPosition() {
    return new THREE.Vector2(0, 0);
  }

  getVisualConfig() {
    return {
      skyTint: "#6b7280",
      lightTint: "#ffffff",
      groundTint: "#4f742b",
    };
  }

  getEnemySpawns() {
    return [];
  }

  getPulseSurgeSpawns(_roles = []) {
    return [];
  }

  getContextState() {
    return {
      combatForced: false,
      sceneId: this.id,
      sceneName: this.displayName,
      regionId: this.regionId,
      region: REGIONS_BY_ID[this.regionId]?.displayName ?? this.displayName,
      sceneToast: this.consumeSceneToast(),
    };
  }

  update(dtSeconds) {
    this._portalPulseTime += dtSeconds;
    for (const portal of this._portals) {
      if (!isPortalActive(portal)) continue;
      const pulse = 0.85 + Math.sin(this._portalPulseTime * 4.2) * 0.15;
      portal.ring.material.opacity = 0.56 + pulse * 0.22;
      portal.ring.renderOrder = resolveDepthOrder(portal.position.y, 1030);
      portal.marker.setOpacity(0.76 + pulse * 0.26);
    }
  }

  render({ camera, dtSeconds = 0, elapsedSeconds = 0 }) {
    if (!camera) return;
    for (const billboard of this._billboards) {
      billboard.update(dtSeconds, elapsedSeconds, camera, this._foliageMotionIntensity);
    }
    for (const npc of this._npcs) {
      npc.update({
        dtSeconds,
        elapsedSeconds,
        camera,
        foliageMotionIntensity: this._foliageMotionIntensity,
        inRange: npc.id === this._npcFocusId,
      });
    }
    this._npcFocusId = null;
  }

  dispose() {
    for (const npc of this._npcs) {
      npc.dispose(this.root);
    }
    this._npcs.length = 0;
    for (const billboard of this._billboards) {
      billboard.dispose();
    }
    this._billboards.length = 0;
    this.threeScene.remove(this.root);
    disposeObject3D(this.root);
    this._portals.length = 0;
  }
}
