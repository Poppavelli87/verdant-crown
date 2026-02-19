import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";
import { BaseScene } from "./baseScene.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.18, 0.04);

const WAYSTONE_CENTER = new THREE.Vector2(1.9, -0.26);
const WAYSTONE_TRIGGER_RADIUS = 1.1;
const WAYSTONE_INTERACT_RADIUS = 1.02;
const WAYSTONE_AURA_RADIUS = 1.64;

const RELAY_CENTER = new THREE.Vector2(2.72, 1.38);
const RELAY_TRIGGER_RADIUS = 1.15;
const RELAY_ARENA_RADIUS = 2.42;
const RELAY_TETHERS = Object.freeze([
  { x: RELAY_CENTER.x - 0.92, y: RELAY_CENTER.y - 0.26 },
  { x: RELAY_CENTER.x + 0.68, y: RELAY_CENTER.y - 0.86 },
  { x: RELAY_CENTER.x + 0.24, y: RELAY_CENTER.y + 0.84 },
]);

const WIND_THREAD_COUNT = 14;

function createWaystoneFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#5d666d";
    ctx.fillRect(12, 16, 12, 26);
    ctx.fillStyle = "#768790";
    ctx.fillRect(13, 17, 10, 24);
    ctx.fillStyle = "#cde8f2";
    ctx.fillRect(16, 10, 4, 8);
    ctx.fillStyle = "#8be4ea";
    ctx.fillRect(17, 7, 2, 3);
  }, 36, 52);
}

function createRelayFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#4a4f58";
    ctx.fillRect(16, 10, 4, 30);
    ctx.fillRect(9, 24, 18, 3);
    ctx.fillStyle = "#9fd5e8";
    ctx.fillRect(15, 4, 6, 7);
    ctx.fillStyle = "#9be7d4";
    ctx.fillRect(16, 5, 4, 4);
  }, 36, 52);
}

function createTetherFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#575f66";
    ctx.fillRect(15, 18, 6, 24);
    ctx.fillStyle = "#9bd7bf";
    ctx.fillRect(16, 13, 4, 5);
  }, 36, 52);
}

function createStandingStoneFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.33)";
    ctx.fillRect(7, 42, 22, 4);
    ctx.fillStyle = "#6a737d";
    ctx.fillRect(11, 12, 14, 30);
    ctx.fillStyle = "#7e8a95";
    ctx.fillRect(12, 13, 12, 28);
    ctx.fillStyle = "#c8d7df";
    ctx.fillRect(14, 16, 3, 8);
    ctx.fillRect(20, 22, 2, 7);
  }, 36, 52);
}

function createRidgeCairnFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#5f686f";
    ctx.fillRect(10, 31, 16, 11);
    ctx.fillRect(12, 24, 12, 8);
    ctx.fillRect(14, 18, 8, 6);
    ctx.fillStyle = "#84919b";
    ctx.fillRect(12, 32, 4, 4);
    ctx.fillRect(18, 26, 3, 3);
  }, 36, 52);
}

const STANDING_STONE_FALLBACK_TEXTURE = createStandingStoneFallbackTexture();
const RIDGE_CAIRN_FALLBACK_TEXTURE = createRidgeCairnFallbackTexture();

export class WindwardScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "windward";
    this.displayName = "Windward Ridge";
    this.regionId = "skyreach-steppe";

    this._windTime = 0;
    this._windThreads = [];
    this._relayPulseTime = 0;
    this._wasNearReturnPortal = false;

    this._chapter6RelayDropped = Boolean(
      this.saveState?.getStoryFlag?.("chapter6_relay_dropped") ?? this.saveState?.getFlag?.("story.chapter6_relay_dropped")
    );
    this._chapter6WaystoneAttuned = Boolean(
      this.saveState?.getStoryFlag?.("chapter6_waystone_attuned") ??
        this.saveState?.getFlag?.("story.chapter6_waystone_attuned")
    );

    this._waystoneSite = null;
    this._relaySite = null;

    this._createProps();
    this._createWaystoneCircle();
    this._createRelaySite();

    this._returnPortal = this.addPortal({
      id: "windward_to_thornmere",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#d4e9da",
      label: "Windward Return Gate",
    });

    this._applyRelayVisibility();
    this._applyWaystoneState();
  }

  _createProps() {
    const standingStones = [
      { x: -3.2, z: -1.85, scale: 0.95 },
      { x: -2.65, z: 1.92, scale: 1.08 },
      { x: 0.1, z: -2.42, scale: 0.88 },
      { x: 0.88, z: 2.62, scale: 1.02 },
      { x: 3.28, z: -2.1, scale: 0.92 },
      { x: 3.48, z: 2.18, scale: 1.06 },
    ];
    for (const stone of standingStones) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/standing_stone.png",
        fallbackTexture: STANDING_STONE_FALLBACK_TEXTURE,
        width: 1.22 * stone.scale,
        height: 1.84 * stone.scale,
        position: new THREE.Vector2(stone.x, stone.z),
        groundY: -0.9,
        swayAmount: 0,
        depthBaseOrder: 1145,
        shadowOpacity: 0.2,
      });
    }

    const cairns = [
      { x: -1.35, z: -0.24, scale: 0.98 },
      { x: 2.4, z: -2.76, scale: 0.86 },
      { x: 2.94, z: 0.08, scale: 0.92 },
    ];
    for (const cairn of cairns) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/ridge_cairn.png",
        fallbackTexture: RIDGE_CAIRN_FALLBACK_TEXTURE,
        width: 0.96 * cairn.scale,
        height: 0.94 * cairn.scale,
        position: new THREE.Vector2(cairn.x, cairn.z),
        groundY: -0.9,
        depthBaseOrder: 1138,
        shadowOpacity: 0.18,
      });
    }

    const shrubs = [
      { x: -2.08, z: -0.98, phase: 0.2 },
      { x: -0.84, z: 1.76, phase: 0.74 },
      { x: 1.04, z: -1.92, phase: 1.1 },
      { x: 2.35, z: 2.18, phase: 1.46 },
      { x: 0.62, z: 0.94, phase: 1.84 },
    ];
    for (const shrub of shrubs) {
      this.addBillboard({
        assetPath: "./assets/sprites/details/grass_clump.png",
        width: 0.52,
        height: 0.66,
        position: new THREE.Vector2(shrub.x, shrub.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1098,
        swayAmount: 0.05,
        swaySpeed: 1.1,
        swayPhase: shrub.phase,
        anchorShadow: false,
      });
    }

    for (let i = 0; i < WIND_THREAD_COUNT; i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: i % 2 === 0 ? "#d6e9ef" : "#cbe2e7",
          transparent: true,
          opacity: 0.18 + (i % 3) * 0.05,
          depthWrite: false,
        })
      );
      const baseX = Math.sin(i * 0.73 + 0.18) * 4.2;
      const baseZ = Math.cos(i * 0.67 + 0.52) * 3.2;
      const baseY = -0.58 + (i % 7) * 0.1;
      const scale = 0.06 + (i % 4) * 0.015;
      sprite.scale.set(scale, scale * 0.42, 1);
      sprite.position.set(baseX, baseY, baseZ);
      sprite.renderOrder = 1188;
      this.addObject(sprite);
      this._windThreads.push({
        sprite,
        baseX,
        baseZ,
        baseY,
        driftX: 0.08 + (i % 5) * 0.018,
        driftZ: 0.05 + (i % 4) * 0.014,
        lift: 0.04 + (i % 5) * 0.01,
        phase: i * 0.63,
      });
    }
  }

  _createWaystoneCircle() {
    const waystone = this.addBillboard({
      assetPath: "./assets/sprites/props/waystone.png",
      fallbackTexture: createWaystoneFallbackTexture(),
      width: 1.2,
      height: 1.98,
      position: WAYSTONE_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1193,
      opacity: 0.96,
      tint: "#deecf3",
      swayAmount: 0.004,
      swaySpeed: 0.84,
      scaleWithProps: false,
      shadowOpacity: 0.22,
      groundPatchOpacity: 0.11,
    });

    const triggerRing = new THREE.Mesh(
      new THREE.RingGeometry(WAYSTONE_TRIGGER_RADIUS * 0.82, WAYSTONE_TRIGGER_RADIUS, 36),
      new THREE.MeshBasicMaterial({
        color: "#cce4d9",
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    triggerRing.rotation.x = -Math.PI / 2;
    triggerRing.position.set(WAYSTONE_CENTER.x, -0.886, WAYSTONE_CENTER.y);
    triggerRing.renderOrder = 1046;
    this.addObject(triggerRing);

    const auraRing = new THREE.Mesh(
      new THREE.RingGeometry(WAYSTONE_AURA_RADIUS * 0.96, WAYSTONE_AURA_RADIUS, 56),
      new THREE.MeshBasicMaterial({
        color: "#bfd9e6",
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.set(WAYSTONE_CENTER.x, -0.887, WAYSTONE_CENTER.y);
    auraRing.renderOrder = 1031;
    this.addObject(auraRing);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 26),
      new THREE.MeshBasicMaterial({
        color: "#a9e7ef",
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(WAYSTONE_CENTER.x, -0.883, WAYSTONE_CENTER.y);
    glow.renderOrder = 1040;
    this.addObject(glow);

    this._waystoneSite = {
      waystone,
      triggerRing,
      auraRing,
      glow,
    };
  }

  _createRelaySite() {
    const relay = this.addBillboard({
      assetPath: "./assets/sprites/props/signal_relay.png",
      fallbackTexture: createRelayFallbackTexture(),
      width: 1.2,
      height: 1.86,
      position: RELAY_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1192,
      opacity: 0.95,
      tint: "#dce5ec",
      swayAmount: 0.006,
      swaySpeed: 0.8,
      scaleWithProps: false,
      shadowOpacity: 0.21,
      groundPatchOpacity: 0.1,
    });

    const tethers = RELAY_TETHERS.map((entry, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/tether_post.png",
        fallbackTexture: createTetherFallbackTexture(),
        width: 0.82,
        height: 1.22,
        position: new THREE.Vector2(entry.x, entry.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1188,
        opacity: 0.94,
        tint: "#d4dde6",
        swayAmount: 0.012,
        swaySpeed: 0.96,
        swayPhase: index * 0.63,
        scaleWithProps: false,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
      })
    );

    const triggerRing = new THREE.Mesh(
      new THREE.RingGeometry(RELAY_TRIGGER_RADIUS * 0.82, RELAY_TRIGGER_RADIUS, 34),
      new THREE.MeshBasicMaterial({
        color: "#b4d8d7",
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    triggerRing.rotation.x = -Math.PI / 2;
    triggerRing.position.set(RELAY_CENTER.x, -0.886, RELAY_CENTER.y);
    triggerRing.renderOrder = 1045;
    this.addObject(triggerRing);

    const areaRing = new THREE.Mesh(
      new THREE.RingGeometry(RELAY_ARENA_RADIUS * 0.97, RELAY_ARENA_RADIUS, 60),
      new THREE.MeshBasicMaterial({
        color: "#9fc3d6",
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    areaRing.rotation.x = -Math.PI / 2;
    areaRing.position.set(RELAY_CENTER.x, -0.887, RELAY_CENTER.y);
    areaRing.renderOrder = 1030;
    this.addObject(areaRing);

    const relayGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.54, 22),
      new THREE.MeshBasicMaterial({
        color: "#9de6ec",
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      })
    );
    relayGlow.rotation.x = -Math.PI / 2;
    relayGlow.position.set(RELAY_CENTER.x, -0.883, RELAY_CENTER.y);
    relayGlow.renderOrder = 1038;
    this.addObject(relayGlow);

    this._relaySite = {
      relay,
      tethers,
      triggerRing,
      areaRing,
      relayGlow,
    };
  }

  _applyRelayVisibility() {
    if (!this._relaySite) return;
    const dropped = Boolean(this._chapter6RelayDropped);
    this._relaySite.relay.mesh.visible = true;
    this._relaySite.relay.mesh.material.opacity = dropped ? 0.8 : 0.95;
    this._relaySite.relay.mesh.material.color.set(dropped ? "#8fa3ad" : "#dce5ec");
    this._relaySite.triggerRing.visible = !dropped;
    this._relaySite.areaRing.visible = !dropped;
    this._relaySite.relayGlow.visible = true;
    for (const tether of this._relaySite.tethers) {
      tether.mesh.visible = !dropped;
    }
  }

  _applyWaystoneState() {
    if (!this._waystoneSite) return;
    const attuned = Boolean(this._chapter6WaystoneAttuned);
    this._waystoneSite.waystone.mesh.visible = true;
    this._waystoneSite.waystone.mesh.material.color.set(attuned ? "#b8dde9" : "#deecf3");
    this._waystoneSite.waystone.mesh.material.opacity = attuned ? 0.9 : 0.96;
    this._waystoneSite.triggerRing.visible = true;
    this._waystoneSite.auraRing.visible = true;
    this._waystoneSite.glow.visible = true;
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.chapter6_relay_dropped" || flagKey === "chapter6_relay_dropped") {
      this._chapter6RelayDropped = Boolean(value);
      this._applyRelayVisibility();
    }
    if (flagKey === "story.chapter6_waystone_attuned" || flagKey === "chapter6_waystone_attuned") {
      this._chapter6WaystoneAttuned = Boolean(value);
      this._applyWaystoneState();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(0.88, 0.14);
  }

  getVisualConfig() {
    return {
      skyTint: "#91abb3",
      lightTint: "#e9eef2",
      groundTint: "#798a74",
      fogMultiplier: 0.94,
    };
  }

  getWaystoneCircleConfig() {
    return {
      center: { x: WAYSTONE_CENTER.x, y: WAYSTONE_CENTER.y },
      triggerRadius: WAYSTONE_TRIGGER_RADIUS,
      interactRadius: WAYSTONE_INTERACT_RADIUS,
      auraRadius: WAYSTONE_AURA_RADIUS,
      attuned: Boolean(this._chapter6WaystoneAttuned),
    };
  }

  getWindwardRelayConfig() {
    return {
      center: { x: RELAY_CENTER.x, y: RELAY_CENTER.y },
      triggerRadius: RELAY_TRIGGER_RADIUS,
      arenaRadius: RELAY_ARENA_RADIUS,
      tetherPositions: RELAY_TETHERS.map((entry) => ({ x: entry.x, y: entry.y })),
      relayDropped: Boolean(this._chapter6RelayDropped),
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._windTime += dtSeconds;
    this._relayPulseTime += dtSeconds;

    if (!this._wasNearReturnPortal) {
      const distance = Math.hypot(
        playerPosition.x - THORNMERE_RETURN_PORTAL.x,
        playerPosition.z - THORNMERE_RETURN_PORTAL.y
      );
      if (distance <= 1.18) {
        this.pushSceneToast("Thornmere lies behind the ridge wind.");
        this._wasNearReturnPortal = true;
      }
    }

    if (this._relaySite) {
      const beat = 0.5 + Math.sin(this._relayPulseTime * 2.4 + 0.35) * 0.5;
      this._relaySite.relayGlow.material.opacity = this._chapter6RelayDropped ? 0.08 + beat * 0.07 : 0.1 + beat * 0.14;
      this._relaySite.triggerRing.material.opacity = this._chapter6RelayDropped ? 0 : 0.08 + beat * 0.1;
      this._relaySite.areaRing.material.opacity = this._chapter6RelayDropped ? 0 : 0.05 + beat * 0.05;
    }

    if (this._waystoneSite) {
      const beat = 0.5 + Math.sin(this._relayPulseTime * 2.2 + 1.25) * 0.5;
      this._waystoneSite.glow.material.opacity = this._chapter6WaystoneAttuned ? 0.16 + beat * 0.16 : 0.1 + beat * 0.12;
      this._waystoneSite.triggerRing.material.opacity = 0.08 + beat * 0.12;
      this._waystoneSite.auraRing.material.opacity = this._chapter6WaystoneAttuned ? 0.09 + beat * 0.07 : 0.05 + beat * 0.05;
    }

    for (const particle of this._windThreads) {
      const driftT = this._windTime + particle.phase;
      particle.sprite.position.x = particle.baseX + Math.sin(driftT * 0.72) * particle.driftX;
      particle.sprite.position.z = particle.baseZ + Math.cos(driftT * 0.66) * particle.driftZ;
      particle.sprite.position.y = -0.68 + ((particle.baseY + this._windTime * particle.lift + particle.phase * 0.02) % 1.02);
      const pulse = 0.52 + Math.sin(driftT * 1.25) * 0.48;
      particle.sprite.material.opacity = 0.1 + pulse * 0.16;
    }
  }
}
