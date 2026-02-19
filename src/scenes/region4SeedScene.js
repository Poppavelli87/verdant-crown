import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.22, -0.08);
const VAULT_APPROACH_CENTER = new THREE.Vector2(1.82, 0.24);
const VAULT_APPROACH_RADIUS = 0.68;
const VAULT_DOOR_POSITION = new THREE.Vector2(3.12, -0.24);
const VAULT_ARENA_CENTER = new THREE.Vector2(3.68, -1.16);
const VAULT_ARENA_RADIUS = 2.48;
const VAULT_BOSS_TRIGGER_RADIUS = 1.12;
const OATH_SHRINE_CENTER = new THREE.Vector2(-1.34, 1.36);
const OATH_SHRINE_RADIUS = 0.72;
const OATH_PLINTH_POSITION = new THREE.Vector2(-1.56, 1.22);
const OATH_SIGIL_DOOR_POSITION = new THREE.Vector2(-0.82, 1.36);
const OATH_MEMORY_SLATE_POSITION = new THREE.Vector2(-1.22, 1.74);
const OATH_CHECKPOINT = new THREE.Vector2(-2.16, 1.08);

const WORLDROOT_ANCHORS = Object.freeze([
  Object.freeze({ x: 2.58, y: 0.18 }),
  Object.freeze({ x: 3.82, y: 0.12 }),
  Object.freeze({ x: 3.18, y: -0.98 }),
]);

const NULL_LATTICE_SPIRES = Object.freeze([
  Object.freeze({ x: 1.84, y: -0.86 }),
  Object.freeze({ x: 4.26, y: -0.72 }),
  Object.freeze({ x: 3.42, y: 0.72 }),
]);

const MEMORY_SHARD_POINTS = Object.freeze([
  Object.freeze({ x: 3.02, y: -0.82 }),
  Object.freeze({ x: 4.02, y: -1.18 }),
  Object.freeze({ x: 3.62, y: -0.08 }),
]);

function makeFallback(painter, width = 36, height = 52) {
  return createPixelBillboardFallbackTexture(painter, width, height);
}

function createRootArchFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#45382d";
    ctx.fillRect(9, 12, 6, 30);
    ctx.fillRect(21, 12, 6, 30);
    ctx.fillRect(13, 10, 10, 6);
    ctx.fillStyle = "#715641";
    ctx.fillRect(10, 13, 4, 28);
    ctx.fillRect(22, 13, 4, 28);
    ctx.fillRect(14, 11, 8, 3);
    ctx.fillStyle = "#92dd9a";
    ctx.fillRect(12, 26, 2, 2);
    ctx.fillRect(22, 22, 2, 2);
  });
}

function createFungusFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(9, 42, 18, 4);
    ctx.fillStyle = "#2f4232";
    ctx.fillRect(14, 27, 8, 15);
    ctx.fillStyle = "#79c98b";
    ctx.fillRect(12, 21, 12, 7);
    ctx.fillRect(15, 17, 6, 4);
    ctx.fillStyle = "#b8ffbd";
    ctx.fillRect(16, 19, 4, 2);
  });
}

function createDoorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(6, 42, 24, 4);
    ctx.fillStyle = "#2f2d36";
    ctx.fillRect(8, 8, 20, 34);
    ctx.fillStyle = "#4f4a63";
    ctx.fillRect(9, 9, 18, 31);
    ctx.fillStyle = "#d8f9e3";
    ctx.fillRect(13, 14, 10, 3);
    ctx.fillRect(12, 24, 12, 2);
    ctx.fillRect(14, 31, 8, 2);
  });
}

function createAnchorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(10, 42, 16, 4);
    ctx.fillStyle = "#3f5350";
    ctx.fillRect(14, 14, 8, 28);
    ctx.fillStyle = "#78cdb2";
    ctx.fillRect(13, 11, 10, 5);
    ctx.fillStyle = "#d3ffe7";
    ctx.fillRect(15, 13, 6, 2);
    ctx.fillRect(16, 21, 4, 2);
  });
}

function createSpireFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(10, 42, 16, 4);
    ctx.fillStyle = "#2f3b47";
    ctx.fillRect(15, 10, 6, 32);
    ctx.fillRect(11, 22, 14, 3);
    ctx.fillStyle = "#8ec8ea";
    ctx.fillRect(14, 7, 8, 4);
    ctx.fillRect(12, 23, 12, 1);
  });
}

function createShardFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(12, 42, 12, 3);
    ctx.fillStyle = "#6687a8";
    ctx.fillRect(15, 14, 6, 24);
    ctx.fillStyle = "#c9e7ff";
    ctx.fillRect(16, 12, 4, 3);
    ctx.fillRect(17, 20, 2, 12);
  });
}

function createOathPlinthFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#3d3d48";
    ctx.fillRect(11, 16, 14, 26);
    ctx.fillStyle = "#5f6273";
    ctx.fillRect(12, 18, 12, 20);
    ctx.fillStyle = "#c8dcff";
    ctx.fillRect(14, 21, 8, 3);
    ctx.fillRect(16, 29, 4, 2);
  });
}

function createSigilDoorFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(6, 42, 24, 4);
    ctx.fillStyle = "#252b38";
    ctx.fillRect(8, 10, 20, 32);
    ctx.fillStyle = "#49546b";
    ctx.fillRect(9, 11, 18, 28);
    ctx.fillStyle = "#e6f0ff";
    ctx.fillRect(14, 16, 8, 3);
    ctx.fillRect(12, 28, 12, 2);
  });
}

function createMemorySlateFallback() {
  return makeFallback((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.26)";
    ctx.fillRect(10, 42, 16, 4);
    ctx.fillStyle = "#3a4253";
    ctx.fillRect(12, 14, 12, 28);
    ctx.fillStyle = "#6f86aa";
    ctx.fillRect(13, 16, 10, 22);
    ctx.fillStyle = "#f2fbff";
    ctx.fillRect(15, 20, 6, 2);
    ctx.fillRect(14, 28, 8, 2);
  });
}

const ROOT_ARCH_FALLBACK = createRootArchFallback();
const FUNGUS_FALLBACK = createFungusFallback();
const CROWNHEART_DOOR_FALLBACK = createDoorFallback();
const WORLDROOT_ANCHOR_FALLBACK = createAnchorFallback();
const NULL_SPIRE_FALLBACK = createSpireFallback();
const MEMORY_SHARD_FALLBACK = createShardFallback();
const OATH_PLINTH_FALLBACK = createOathPlinthFallback();
const OATH_SIGIL_DOOR_FALLBACK = createSigilDoorFallback();
const OATH_MEMORY_SLATE_FALLBACK = createMemorySlateFallback();

export class Region4SeedScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "region4_seed";
    this.displayName = "Rootway";
    this.regionId = "umbral-hollows";

    this._wasNearReturnPortal = false;
    this._wasNearVaultApproach = false;
    this._wasNearOathShrine = false;
    this._titleShown = false;
    this._vaultPulseTime = 0;
    this._chapter9AnchorsAttuned = Boolean(
      this.saveState?.getStoryFlag?.("chapter9_anchors_attuned") ??
        this.saveState?.getFlag?.("story.chapter9_anchors_attuned")
    );
    this._chapter9NullArchivistDefeated = Boolean(
      this.saveState?.getStoryFlag?.("chapter9_null_archivist_defeated") ??
        this.saveState?.getFlag?.("story.chapter9_null_archivist_defeated")
    );
    this._endgameThirdSealObtained = Boolean(
      this.saveState?.getStoryFlag?.("endgame_task_third_seal_obtained") ??
        this.saveState?.getFlag?.("story.endgame_task_third_seal_obtained")
    );

    this._door = null;
    this._anchorNodes = [];
    this._nullSpires = [];
    this._memoryShards = [];
    this._oathPlinth = null;
    this._oathSigilDoor = null;
    this._oathMemorySlate = null;

    this._createProps();
    this._returnPortal = this.addPortal({
      id: "rootway-return-gate",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#c0d7a5",
      label: "Return to Thornmere",
    });
    this._applyVaultState();
    this._applyOathShrineState();
  }

  _createProps() {
    const arches = [
      { x: -2.7, z: -1.1, scale: 1.06 },
      { x: -1.0, z: 1.8, scale: 0.94 },
      { x: 1.9, z: -1.7, scale: 1.02 },
      { x: 3.1, z: 1.2, scale: 0.98 },
      { x: 2.6, z: -0.1, scale: 1.06 },
    ];
    for (const arch of arches) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/root_arch.png",
        fallbackTexture: ROOT_ARCH_FALLBACK,
        width: 1.34 * arch.scale,
        height: 1.92 * arch.scale,
        position: new THREE.Vector2(arch.x, arch.z),
        groundY: -0.9,
        depthBaseOrder: 1144,
        shadowOpacity: 0.2,
      });
    }

    const fungus = [
      { x: -2.1, z: 0.72, scale: 0.84, phase: 0.24 },
      { x: -0.52, z: -1.32, scale: 0.96, phase: 0.58 },
      { x: 1.12, z: 1.54, scale: 0.9, phase: 0.9 },
      { x: 2.68, z: -0.58, scale: 1.02, phase: 1.26 },
      { x: 0.4, z: 0.24, scale: 0.78, phase: 1.6 },
      { x: 2.22, z: -0.2, scale: 0.9, phase: 2.1 },
      { x: 3.46, z: -0.94, scale: 0.86, phase: 2.42 },
    ];

    for (const entry of fungus) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/glow_fungus.png",
        fallbackTexture: FUNGUS_FALLBACK,
        width: 0.74 * entry.scale,
        height: 0.94 * entry.scale,
        position: new THREE.Vector2(entry.x, entry.z),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1124,
        shadowOpacity: 0.12,
        swayAmount: 0.02,
        swaySpeed: 1,
        swayPhase: entry.phase,
      });
    }

    this._door = this.addBillboard({
      assetPath: "./assets/sprites/props/crownheart_door.png",
      fallbackTexture: CROWNHEART_DOOR_FALLBACK,
      width: 1.88,
      height: 2.48,
      position: VAULT_DOOR_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.05,
      depthBaseOrder: 1162,
      shadowOpacity: 0.24,
      groundPatchOpacity: 0.12,
      scaleWithProps: false,
      tint: "#d2dfd8",
    });

    this._anchorNodes = WORLDROOT_ANCHORS.map((anchor, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/worldroot_anchor.png",
        fallbackTexture: WORLDROOT_ANCHOR_FALLBACK,
        width: 0.86,
        height: 1.28,
        position: new THREE.Vector2(anchor.x, anchor.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1156 + index,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#d5f6df",
      })
    );

    this._nullSpires = NULL_LATTICE_SPIRES.map((spire, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/null_lattice_spire.png",
        fallbackTexture: NULL_SPIRE_FALLBACK,
        width: 0.78,
        height: 1.3,
        position: new THREE.Vector2(spire.x, spire.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1148 + index,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
        scaleWithProps: false,
        tint: "#bfd8e9",
      })
    );

    this._memoryShards = MEMORY_SHARD_POINTS.map((point, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/memory_shard.png",
        fallbackTexture: MEMORY_SHARD_FALLBACK,
        width: 0.44,
        height: 0.82,
        position: new THREE.Vector2(point.x, point.y),
        groundY: -0.9,
        yOffset: 0.02,
        depthBaseOrder: 1168 + index,
        shadowOpacity: 0.1,
        anchorShadow: false,
        scaleWithProps: false,
        tint: "#d6eeff",
      })
    );

    this._oathPlinth = this.addBillboard({
      assetPath: "./assets/sprites/props/oath_plinth.png",
      fallbackTexture: OATH_PLINTH_FALLBACK,
      width: 0.92,
      height: 1.34,
      position: OATH_PLINTH_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1158,
      shadowOpacity: 0.18,
      groundPatchOpacity: 0.08,
      scaleWithProps: false,
      tint: "#d8e4ff",
    });

    this._oathSigilDoor = this.addBillboard({
      assetPath: "./assets/sprites/props/sigil_door.png",
      fallbackTexture: OATH_SIGIL_DOOR_FALLBACK,
      width: 1.04,
      height: 1.62,
      position: OATH_SIGIL_DOOR_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1161,
      shadowOpacity: 0.18,
      groundPatchOpacity: 0.08,
      scaleWithProps: false,
      tint: "#cfdaf5",
    });

    this._oathMemorySlate = this.addBillboard({
      assetPath: "./assets/sprites/props/memory_slate.png",
      fallbackTexture: OATH_MEMORY_SLATE_FALLBACK,
      width: 0.78,
      height: 1.22,
      position: OATH_MEMORY_SLATE_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.02,
      depthBaseOrder: 1157,
      shadowOpacity: 0.14,
      groundPatchOpacity: 0.06,
      scaleWithProps: false,
      tint: "#d5e8ff",
    });
  }

  _applyVaultState() {
    const doorOpen = this._chapter9AnchorsAttuned || this._chapter9NullArchivistDefeated;
    if (this._door?.mesh?.material) {
      this._door.mesh.material.color.set(doorOpen ? "#9bd6d2" : "#d2dfd8");
      this._door.mesh.material.opacity = doorOpen ? 0.78 : 0.96;
    }
  }

  _applyOathShrineState() {
    const bound = Boolean(this._endgameThirdSealObtained);
    if (this._oathPlinth?.mesh?.material) {
      this._oathPlinth.mesh.material.color.set(bound ? "#96d5b7" : "#d8e4ff");
      this._oathPlinth.mesh.material.opacity = bound ? 0.84 : 0.94;
    }
    if (this._oathSigilDoor?.mesh?.material) {
      this._oathSigilDoor.mesh.material.color.set(bound ? "#9fc8e9" : "#cfdaf5");
      this._oathSigilDoor.mesh.material.opacity = bound ? 0.76 : 0.9;
    }
    if (this._oathMemorySlate?.mesh?.material) {
      this._oathMemorySlate.mesh.material.color.set(bound ? "#9fd8cf" : "#d5e8ff");
      this._oathMemorySlate.mesh.material.opacity = bound ? 0.82 : 0.94;
    }
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.chapter9_anchors_attuned" || flagKey === "chapter9_anchors_attuned") {
      this._chapter9AnchorsAttuned = Boolean(value);
      this._applyVaultState();
    }
    if (flagKey === "story.chapter9_null_archivist_defeated" || flagKey === "chapter9_null_archivist_defeated") {
      this._chapter9NullArchivistDefeated = Boolean(value);
      this._applyVaultState();
    }
    if (flagKey === "story.endgame_task_third_seal_obtained" || flagKey === "endgame_task_third_seal_obtained") {
      this._endgameThirdSealObtained = Boolean(value);
      this._applyOathShrineState();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(0.88, 0.1);
  }

  getVisualConfig() {
    return {
      skyTint: "#6f755f",
      lightTint: "#d7c7a2",
      groundTint: "#4e6747",
      fogMultiplier: 0.98,
    };
  }

  getRootwayChapter9Config() {
    return {
      vaultApproach: {
        center: { x: VAULT_APPROACH_CENTER.x, y: VAULT_APPROACH_CENTER.y },
        radius: VAULT_APPROACH_RADIUS,
      },
      vaultDoor: {
        position: { x: VAULT_DOOR_POSITION.x, y: VAULT_DOOR_POSITION.y },
      },
      vaultArena: {
        center: { x: VAULT_ARENA_CENTER.x, y: VAULT_ARENA_CENTER.y },
        radius: VAULT_ARENA_RADIUS,
      },
      worldrootAnchors: WORLDROOT_ANCHORS.map((entry) => ({ x: entry.x, y: entry.y })),
      nullLatticeSpires: NULL_LATTICE_SPIRES.map((entry) => ({ x: entry.x, y: entry.y })),
      memoryShards: MEMORY_SHARD_POINTS.map((entry) => ({ x: entry.x, y: entry.y })),
      anchorsAttuned: Boolean(this._chapter9AnchorsAttuned),
      archivistDefeated: Boolean(this._chapter9NullArchivistDefeated),
      returnGate: {
        position: { x: THORNMERE_RETURN_PORTAL.x, y: THORNMERE_RETURN_PORTAL.y },
        interactRadius: 1.05,
      },
    };
  }

  getEndgameThirdSealConfig() {
    return {
      center: { x: OATH_SHRINE_CENTER.x, y: OATH_SHRINE_CENTER.y },
      triggerRadius: OATH_SHRINE_RADIUS,
      arenaRadius: 2.14,
      checkpoint: { x: OATH_CHECKPOINT.x, z: OATH_CHECKPOINT.y },
      attunePosition: { x: OATH_PLINTH_POSITION.x, y: OATH_PLINTH_POSITION.y },
      miniBossSpawn: { x: OATH_SIGIL_DOOR_POSITION.x + 0.18, y: OATH_SIGIL_DOOR_POSITION.y - 0.42 },
      hazardSpires: [
        { x: OATH_SHRINE_CENTER.x - 0.84, y: OATH_SHRINE_CENTER.y - 0.38 },
        { x: OATH_SHRINE_CENTER.x + 0.82, y: OATH_SHRINE_CENTER.y - 0.52 },
      ],
      alreadyObtained: Boolean(this._endgameThirdSealObtained),
    };
  }

  getBossArenaConfig() {
    return {
      bossId: "null_archivist",
      bounds: {
        type: "circle",
        center: { x: VAULT_ARENA_CENTER.x, y: VAULT_ARENA_CENTER.y },
        radius: VAULT_ARENA_RADIUS,
      },
      trigger: {
        center: { x: VAULT_ARENA_CENTER.x, y: VAULT_ARENA_CENTER.y },
        radius: VAULT_BOSS_TRIGGER_RADIUS,
      },
      resetCooldownSeconds: 3.5,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._vaultPulseTime += dtSeconds;

    const beat = 0.5 + Math.sin(this._vaultPulseTime * 2.8) * 0.5;
    if (this._door?.mesh?.material) {
      const base = this._chapter9AnchorsAttuned ? 0.66 : 0.86;
      this._door.mesh.material.opacity = base + beat * 0.1;
    }
    for (let i = 0; i < this._anchorNodes.length; i += 1) {
      const node = this._anchorNodes[i];
      if (!node?.mesh?.material) continue;
      const pulse = 0.5 + Math.sin(this._vaultPulseTime * 3.4 + i * 0.82) * 0.5;
      node.mesh.position.y = -0.86 + pulse * 0.02;
      node.mesh.material.opacity = 0.74 + pulse * 0.22;
    }
    for (let i = 0; i < this._nullSpires.length; i += 1) {
      const spire = this._nullSpires[i];
      if (!spire?.mesh?.material) continue;
      const pulse = 0.5 + Math.sin(this._vaultPulseTime * 2.9 + i * 1.1) * 0.5;
      spire.mesh.position.y = -0.86 + pulse * 0.015;
      spire.mesh.material.opacity = 0.66 + pulse * 0.2;
    }
    if (this._oathPlinth?.mesh?.material) {
      const pulse = 0.5 + Math.sin(this._vaultPulseTime * 3.1 + 0.6) * 0.5;
      this._oathPlinth.mesh.position.y = -0.86 + pulse * 0.016;
      this._oathPlinth.mesh.material.opacity = (this._endgameThirdSealObtained ? 0.78 : 0.86) + pulse * 0.08;
    }
    if (this._oathMemorySlate?.mesh?.material) {
      const pulse = 0.5 + Math.sin(this._vaultPulseTime * 2.5 + 1.2) * 0.5;
      this._oathMemorySlate.mesh.position.y = -0.86 + pulse * 0.014;
      this._oathMemorySlate.mesh.material.opacity = (this._endgameThirdSealObtained ? 0.76 : 0.88) + pulse * 0.08;
    }

    const distanceToPortal = Math.hypot(
      playerPosition.x - THORNMERE_RETURN_PORTAL.x,
      playerPosition.z - THORNMERE_RETURN_PORTAL.y
    );
    const nearPortal = distanceToPortal <= 1.16;
    if (nearPortal && !this._wasNearReturnPortal) {
      this.pushSceneToast("Thornmere waits above the rootway.");
    }
    this._wasNearReturnPortal = nearPortal;

    const distanceToApproach = Math.hypot(
      playerPosition.x - VAULT_APPROACH_CENTER.x,
      playerPosition.z - VAULT_APPROACH_CENTER.y
    );
    const nearApproach = distanceToApproach <= VAULT_APPROACH_RADIUS;
    if (nearApproach && !this._wasNearVaultApproach) {
      this.pushSceneToast("The Crownheart Vault groans below.");
    }
    this._wasNearVaultApproach = nearApproach;

    const distanceToShrine = Math.hypot(
      playerPosition.x - OATH_SHRINE_CENTER.x,
      playerPosition.z - OATH_SHRINE_CENTER.y
    );
    const nearShrine = distanceToShrine <= OATH_SHRINE_RADIUS;
    if (nearShrine && !this._wasNearOathShrine) {
      this.pushSceneToast(
        this._endgameThirdSealObtained
          ? "The Oath Sigil rests in your pulse."
          : "An Oath Court shrine answers your step."
      );
    }
    this._wasNearOathShrine = nearShrine;

    if (!this._titleShown) {
      this.pushSceneToast("ROOTWAY");
      this._titleShown = true;
    }
  }
}
