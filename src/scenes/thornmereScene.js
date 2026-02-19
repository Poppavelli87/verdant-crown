import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const ELDER_ROWAN_CLASSIC_OPENING = "Arthur... the Hollow Scar is restless again.";
const ELDER_ROWAN_PROLOGUE_OPENING = "The Scar stirred again last night.";
const ELDER_ROWAN_INTRO_REST = Object.freeze([
  "The air hums in ways it has not in years.",
  "You always wander too close to that place.",
  "Be careful. The roots remember more than we do.",
  "If the vein tightens again, don't run.",
  "Steady it. Or it will spread.",
]);

const ELDER_ROWAN_REPEAT_SCRIPT = Object.freeze(["You know what must be done."]);
const ELDER_ROWAN_FALLOUT_SCRIPT = Object.freeze([
  "The Harvester didn't just dig. It listened.",
  "A ridge path opens when the roots agree.",
  "If Vaeloris is moving gear, follow their trail.",
]);
const ELDER_ROWAN_COUNCIL_SCRIPT = Object.freeze([
  "Follow the ash wind east.",
  "The ridge path remembers Emberfall now.",
  "Find Willow before Vaeloris does.",
]);

const RIDGE_GATE_POSITION = new THREE.Vector2(7.42, 2.68);
const RIDGE_GATE_INTERACT_RADIUS = 1.05;
const ROOTWAY_GATE_POSITION = new THREE.Vector2(-4.42, 2.84);
const ROOTWAY_GATE_INTERACT_RADIUS = 1.05;
const ENDGAME_GATE_POSITION = new THREE.Vector2(6.34, -2.44);
const ENDGAME_GATE_INTERACT_RADIUS = 1.08;

function createRidgeGateFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.fillRect(5, 40, 22, 4);
    ctx.fillStyle = "#304036";
    ctx.fillRect(7, 14, 3, 28);
    ctx.fillRect(22, 14, 3, 28);
    ctx.fillStyle = "#5c7a65";
    ctx.fillRect(10, 15, 12, 5);
    ctx.fillRect(10, 24, 12, 4);
    ctx.fillRect(10, 32, 12, 4);
    ctx.fillStyle = "#95bf99";
    ctx.fillRect(11, 16, 10, 2);
    ctx.fillRect(11, 25, 10, 1);
  }, 32, 48);
}

function createRootwayGateFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.fillRect(5, 40, 22, 4);
    ctx.fillStyle = "#2e3a30";
    ctx.fillRect(7, 12, 4, 30);
    ctx.fillRect(21, 12, 4, 30);
    ctx.fillStyle = "#4f6450";
    ctx.fillRect(11, 12, 10, 4);
    ctx.fillRect(11, 24, 10, 3);
    ctx.fillStyle = "#84a28b";
    ctx.fillRect(12, 13, 8, 2);
    ctx.fillStyle = "#9de6a6";
    ctx.fillRect(14, 20, 4, 3);
  }, 32, 48);
}

function createEndgameGateFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.fillRect(5, 40, 22, 4);
    ctx.fillStyle = "#2f3545";
    ctx.fillRect(7, 12, 4, 30);
    ctx.fillRect(21, 12, 4, 30);
    ctx.fillStyle = "#4d5870";
    ctx.fillRect(11, 12, 10, 4);
    ctx.fillRect(11, 24, 10, 3);
    ctx.fillStyle = "#cbe8ff";
    ctx.fillRect(12, 13, 8, 2);
    ctx.fillRect(14, 19, 4, 3);
  }, 32, 48);
}

// Thornmere is the default playable scene with a portal into Hollow Scar.
export class ThornmereScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "thornmere";
    this.displayName = "Thornmere";
    this.regionId = "verdant-wilds";
    this._hollowPortalPosition = new THREE.Vector2(4.2, 0);
    this._emberfallPortalPosition = new THREE.Vector2(8.25, -3.15);
    this._ridgeGatePosition = RIDGE_GATE_POSITION.clone();
    this._rootwayGatePosition = ROOTWAY_GATE_POSITION.clone();
    this._endgameGatePosition = ENDGAME_GATE_POSITION.clone();
    this._wasNearHollowPortal = false;
    this._wasNearEmberfallPortal = false;
    this._wasNearRidgeGate = false;
    this._wasNearRootwayGate = false;
    this._wasNearEndgameGate = false;

    const introFlag = this.saveState?.getStoryFlag?.("intro_spoken");
    const legacyIntroFlag = this.saveState?.getFlag?.("story.intro_spoken");
    this._introSpoken = Boolean(introFlag ?? legacyIntroFlag);
    this._veinQuestActive = Boolean(
      this.saveState?.getStoryFlag?.("vein_quest_active") ?? this.saveState?.getFlag?.("story.vein_quest_active")
    );
    this._veinQuestComplete = Boolean(
      this.saveState?.getStoryFlag?.("vein_quest_complete") ?? this.saveState?.getFlag?.("story.vein_quest_complete")
    );
    this._elaineJoined = Boolean(
      this.saveState?.getStoryFlag?.("elaine_joined") ?? this.saveState?.getFlag?.("story.elaine_joined")
    );
    this._act2FalloutDone = Boolean(
      this.saveState?.getStoryFlag?.("act2_fallout_done") ?? this.saveState?.getFlag?.("story.act2_fallout_done")
    );
    this._rowanCouncilDone = Boolean(
      this.saveState?.getStoryFlag?.("rowan_council_done") ?? this.saveState?.getFlag?.("story.rowan_council_done")
    );
    this._emberfallLeadUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("emberfall_lead_unlocked") ??
        this.saveState?.getFlag?.("story.emberfall_lead_unlocked")
    );
    this._storyEmberfallUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("emberfall_unlocked") ?? this.saveState?.getFlag?.("story.emberfall_unlocked")
    );
    this._ridgeGateUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("ridge_gate_unlocked") ?? this.saveState?.getFlag?.("story.ridge_gate_unlocked")
    );
    this._region3SeedUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("region3_seed_unlocked") ??
        this.saveState?.getFlag?.("story.region3_seed_unlocked")
    );
    this._region4SeedGateUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("region4_seed_gate_unlocked") ??
        this.saveState?.getFlag?.("story.region4_seed_gate_unlocked")
    );
    this._endgameRouteSeedUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("endgame_route_seed_unlocked") ??
        this.saveState?.getFlag?.("story.endgame_route_seed_unlocked")
    );
    this._endgameOuterSpireUnlocked = Boolean(
      this.saveState?.getStoryFlag?.("endgame_outer_spire_unlocked") ??
        this.saveState?.getFlag?.("story.endgame_outer_spire_unlocked")
    );
    this._emberfallUnlocked =
      (this._veinQuestComplete && this._elaineJoined) || this._emberfallLeadUnlocked || this._storyEmberfallUnlocked;
    this._questMarkerRing = null;
    this._questMarkerBillboard = null;
    this._emberfallPortal = null;
    this._emberfallSignpost = null;
    this._ridgeGatePortal = null;
    this._ridgeGateMarker = null;
    this._rootwayGatePortal = null;
    this._rootwayGateMarker = null;
    this._endgameGatePortal = null;
    this._endgameGateMarker = null;

    this._createProps();
    this.addPortal({
      id: "thornmere_to_hollow",
      targetSceneId: "hollowScar",
      position: this._hollowPortalPosition,
      radius: 0.82,
      interactRadius: 1.05,
      color: "#8be39a",
      label: "Hollow Scar Gate",
    });
    this._emberfallPortal = this.addPortal({
      id: "thornmere_to_emberfall",
      targetSceneId: "emberfall",
      position: this._emberfallPortalPosition,
      radius: 0.82,
      interactRadius: 1.05,
      color: "#e9b17a",
      label: "Ash Gate",
    });
    this._emberfallSignpost = this.addBillboard({
      assetPath: "./assets/sprites/props/signpost.png",
      width: 0.72,
      height: 1.05,
      position: this._emberfallPortalPosition.clone().add(new THREE.Vector2(-0.45, 0.28)),
      groundY: -0.9,
      depthBaseOrder: 1140,
      shadowOpacity: 0.16,
      groundPatchOpacity: 0.05,
    });
    this._ridgeGatePortal = this.addPortal({
      id: "thornmere_to_ridgepass",
      targetSceneId: "ridgepass",
      position: this._ridgeGatePosition,
      radius: 0.86,
      interactRadius: RIDGE_GATE_INTERACT_RADIUS,
      color: "#d7e6bb",
      label: "Ridge Gate",
    });
    this._ridgeGateMarker = this.addBillboard({
      assetPath: "./assets/sprites/props/ridge_gate.png",
      fallbackTexture: createRidgeGateFallbackTexture(),
      width: 1.34,
      height: 1.8,
      position: this._ridgeGatePosition.clone().add(new THREE.Vector2(0.02, 0.04)),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1152,
      shadowOpacity: 0.2,
      groundPatchOpacity: 0.08,
      scaleWithProps: false,
    });
    this._rootwayGatePortal = this.addPortal({
      id: "thornmere_to_region4_seed",
      targetSceneId: "region4_seed",
      position: this._rootwayGatePosition,
      radius: 0.84,
      interactRadius: ROOTWAY_GATE_INTERACT_RADIUS,
      color: "#bfdfae",
      label: "Rootway Gate",
    });
    this._rootwayGateMarker = this.addBillboard({
      assetPath: "./assets/sprites/props/root_arch.png",
      fallbackTexture: createRootwayGateFallbackTexture(),
      width: 1.28,
      height: 1.7,
      position: this._rootwayGatePosition.clone().add(new THREE.Vector2(0.02, 0.04)),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1153,
      shadowOpacity: 0.2,
      groundPatchOpacity: 0.08,
      scaleWithProps: false,
    });
    this._endgameGatePortal = this.addPortal({
      id: "endgame-gate",
      targetSceneId: "endgame_route_seed",
      position: this._endgameGatePosition,
      radius: 0.84,
      interactRadius: ENDGAME_GATE_INTERACT_RADIUS,
      color: "#bfd2ff",
      label: "Last Spire Route",
    });
    this._endgameGateMarker = this.addBillboard({
      assetPath: "./assets/sprites/props/endgame_gate.png",
      fallbackTexture: createEndgameGateFallbackTexture(),
      width: 1.26,
      height: 1.72,
      position: this._endgameGatePosition.clone().add(new THREE.Vector2(0.02, 0.04)),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1154,
      shadowOpacity: 0.2,
      groundPatchOpacity: 0.08,
      scaleWithProps: false,
    });
    this._syncEmberfallPortalVisibility();
    this._syncRidgeGateState();
    this._syncRootwayGateState();
    this._syncEndgameGateState();
    this._createElderRowanNpc();
    this._createQuestMarker();
    this._setQuestMarkerVisible(this._veinQuestActive && !this._veinQuestComplete);
  }

  _createProps() {
    const treeSpots = [
      { x: -3.45, z: -2.2, variant: "tree_oak_a" },
      { x: -3.15, z: 2.35, variant: "tree_oak_b" },
      { x: 2.65, z: -2.55, variant: "tree_oak_b" },
      { x: 2.95, z: 2.5, variant: "tree_oak_a" },
      { x: -0.35, z: 3.2, variant: "tree_oak_a" },
      { x: 1.05, z: -3.05, variant: "tree_oak_b" },
    ];
    for (let i = 0; i < treeSpots.length; i += 1) {
      const spot = treeSpots[i];
      this.addBillboard({
        assetPath: `./assets/sprites/trees/${spot.variant}.png`,
        width: 1.85,
        height: 1.95,
        position: new THREE.Vector2(spot.x, spot.z),
        groundY: -0.9,
        swayAmount: 0.05,
        swaySpeed: 1.4,
        swayPhase: i * 0.53,
        shadowOpacity: 0.2,
      });
    }

    const rockSpots = [
      { x: -2.4, z: -0.95, variant: "rock_a", scale: 1 },
      { x: -0.95, z: 2.55, variant: "rock_b", scale: 0.96 },
      { x: 2.55, z: 1.85, variant: "rock_a", scale: 0.92 },
      { x: 1.95, z: -1.05, variant: "rock_b", scale: 0.88 },
    ];
    for (const spot of rockSpots) {
      this.addBillboard({
        assetPath: `./assets/sprites/rocks/${spot.variant}.png`,
        width: 1.18 * spot.scale,
        height: 0.74 * spot.scale,
        position: new THREE.Vector2(spot.x, spot.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        shadowOpacity: 0.18,
      });
    }

    const stumpSpots = [
      { x: -1.55, z: -2.75 },
      { x: 0.95, z: 2.7 },
    ];
    for (const spot of stumpSpots) {
      this.addBillboard({
        assetPath: "./assets/sprites/stump.png",
        width: 0.72,
        height: 0.72,
        position: new THREE.Vector2(spot.x, spot.z),
        groundY: -0.9,
        depthBaseOrder: 1120,
        shadowOpacity: 0.14,
      });
    }

    const decor = [
      { path: "./assets/sprites/details/flower_a.png", x: -0.25, z: -1.55, w: 0.36, h: 0.52 },
      { path: "./assets/sprites/details/flower_a.png", x: 1.65, z: 0.85, w: 0.36, h: 0.52 },
      { path: "./assets/sprites/details/grass_clump.png", x: -1.65, z: 1.1, w: 0.42, h: 0.55 },
      { path: "./assets/sprites/details/grass_clump.png", x: 0.35, z: 2.15, w: 0.42, h: 0.55 },
    ];
    for (let i = 0; i < decor.length; i += 1) {
      const prop = decor[i];
      this.addBillboard({
        assetPath: prop.path,
        width: prop.w,
        height: prop.h,
        position: new THREE.Vector2(prop.x, prop.z),
        groundY: -0.9,
        swayAmount: 0.03,
        swaySpeed: 1.2,
        swayPhase: i * 0.9,
        depthBaseOrder: 1090,
        anchorShadow: false,
      });
    }

    const villageProps = [
      { path: "./assets/sprites/props/hut_silhouette.png", x: -3.95, z: 0.1, w: 2.35, h: 1.58 },
      { path: "./assets/sprites/props/fence_segment.png", x: -2.75, z: -0.05, w: 1.24, h: 0.76 },
      { path: "./assets/sprites/props/fence_segment.png", x: -2.75, z: 0.75, w: 1.24, h: 0.76 },
      { path: "./assets/sprites/props/signpost.png", x: -0.7, z: -0.2, w: 0.6, h: 0.95 },
      { path: "./assets/sprites/props/well.png", x: -1.1, z: 0.55, w: 0.95, h: 0.9 },
    ];

    for (const prop of villageProps) {
      this.addBillboard({
        assetPath: prop.path,
        width: prop.w,
        height: prop.h,
        position: new THREE.Vector2(prop.x, prop.z),
        groundY: -0.9,
        depthBaseOrder: 1135,
        shadowOpacity: 0.16,
        groundPatchOpacity: 0.05,
      });
    }
  }

  _createElderRowanNpc() {
    this.addNpc({
      id: "elder_rowan",
      name: "Elder Rowan",
      sprite: "./assets/sprites/npc/elder_rowan.png",
      position: new THREE.Vector2(-0.25, 0.42),
      width: 1.48,
      height: 1.9,
      interactRadius: 1.02,
      dialogueScript: ({ saveState }) => {
        if (this._act2FalloutDone) return ELDER_ROWAN_FALLOUT_SCRIPT;
        if (this._rowanCouncilDone) return ELDER_ROWAN_COUNCIL_SCRIPT;
        if (this._introSpoken) return ELDER_ROWAN_REPEAT_SCRIPT;
        const prologueSeen = Boolean(
          saveState?.getStoryFlag?.("prologue_seen") ?? saveState?.getFlag?.("story.prologue_seen")
        );
        const isNewGameFlow = Boolean(
          saveState?.getStoryFlag?.("is_new_game") ?? saveState?.getFlag?.("story.is_new_game")
        );
        const opening = prologueSeen || isNewGameFlow ? ELDER_ROWAN_PROLOGUE_OPENING : ELDER_ROWAN_CLASSIC_OPENING;
        return [opening, ...ELDER_ROWAN_INTRO_REST];
      },
      onInteractCallback: ({ saveState }) => {
        if (this._introSpoken) return;
        this._introSpoken = true;
        saveState?.setStoryFlag?.("intro_spoken", true);
        saveState?.setFlag?.("story.intro_spoken", true);
        if (!this._veinQuestComplete) {
          this._veinQuestActive = true;
          saveState?.setStoryFlag?.("vein_quest_active", true);
          saveState?.setFlag?.("story.vein_quest_active", true);
          saveState?.setStoryFlag?.("vein_quest_complete", false);
          saveState?.setFlag?.("story.vein_quest_complete", false);
        }
        this._setQuestMarkerVisible(this._veinQuestActive && !this._veinQuestComplete);
      },
    });
  }

  _createQuestMarker() {
    const markerPosition = new THREE.Vector2(3.32, 0.52);
    this._questMarkerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.51, 24),
      new THREE.MeshBasicMaterial({
        color: "#bdf8a7",
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this._questMarkerRing.rotation.x = -Math.PI / 2;
    this._questMarkerRing.position.set(markerPosition.x, -0.885, markerPosition.y);
    this._questMarkerRing.renderOrder = 1098;
    this.addObject(this._questMarkerRing);

    this._questMarkerBillboard = this.addBillboard({
      assetPath: "./assets/sprites/anomaly.png",
      width: 0.55,
      height: 0.55,
      position: markerPosition,
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1150,
      opacity: 0.84,
      anchorShadow: false,
      swayAmount: 0.01,
      swaySpeed: 0.85,
      scaleWithProps: false,
    });
  }

  _setQuestMarkerVisible(visible) {
    if (this._questMarkerRing) {
      this._questMarkerRing.visible = visible;
    }
    if (this._questMarkerBillboard) {
      this._questMarkerBillboard.mesh.visible = visible;
    }
  }

  _syncEmberfallPortalVisibility() {
    if (!this._emberfallPortal) return;
    const unlocked = Boolean(this._emberfallUnlocked);
    this._emberfallPortal.interactRadius = unlocked ? 1.05 : 0;
    this._emberfallPortal.ring.visible = unlocked;
    this._emberfallPortal.marker.mesh.visible = unlocked;
    if (this._emberfallSignpost) {
      this._emberfallSignpost.mesh.visible = unlocked;
    }
  }

  _syncRidgeGateState() {
    if (!this._ridgeGatePortal) return;
    const unlocked = Boolean(this._ridgeGateUnlocked);
    this._ridgeGatePortal.targetSceneId = this._region3SeedUnlocked ? "windward" : "ridgepass";
    this._ridgeGatePortal.interactRadius = unlocked ? RIDGE_GATE_INTERACT_RADIUS : 0;
    this._ridgeGatePortal.ring.visible = unlocked;
    this._ridgeGatePortal.marker.mesh.visible = unlocked;
    if (this._ridgeGateMarker?.mesh) {
      this._ridgeGateMarker.mesh.visible = true;
      this._ridgeGateMarker.mesh.material.opacity = unlocked ? 0.96 : 0.82;
      this._ridgeGateMarker.mesh.material.color.set(unlocked ? "#dceacb" : "#8e957f");
    }
  }

  _syncRootwayGateState() {
    if (!this._rootwayGatePortal) return;
    const unlocked = Boolean(this._region4SeedGateUnlocked);
    this._rootwayGatePortal.targetSceneId = "region4_seed";
    this._rootwayGatePortal.interactRadius = unlocked ? ROOTWAY_GATE_INTERACT_RADIUS : 0;
    this._rootwayGatePortal.ring.visible = unlocked;
    this._rootwayGatePortal.marker.mesh.visible = unlocked;
    if (this._rootwayGateMarker?.mesh) {
      this._rootwayGateMarker.mesh.visible = true;
      this._rootwayGateMarker.mesh.material.opacity = unlocked ? 0.96 : 0.8;
      this._rootwayGateMarker.mesh.material.color.set(unlocked ? "#dceacb" : "#7d876f");
    }
  }

  _syncEndgameGateState() {
    if (!this._endgameGatePortal) return;
    const unlocked = Boolean(this._endgameRouteSeedUnlocked || this._endgameOuterSpireUnlocked);
    this._endgameGatePortal.targetSceneId = this._endgameOuterSpireUnlocked ? "spire_approach" : "endgame_route_seed";
    this._endgameGatePortal.label = this._endgameOuterSpireUnlocked ? "Outer Spire Approach" : "Last Spire Route";
    this._endgameGatePortal.interactRadius = unlocked ? ENDGAME_GATE_INTERACT_RADIUS : 0;
    this._endgameGatePortal.ring.visible = unlocked;
    this._endgameGatePortal.marker.mesh.visible = unlocked;
    if (this._endgameGateMarker?.mesh) {
      this._endgameGateMarker.mesh.visible = unlocked;
      this._endgameGateMarker.mesh.material.opacity = unlocked ? 0.96 : 0;
      this._endgameGateMarker.mesh.material.color.set(this._endgameOuterSpireUnlocked ? "#b9dcff" : "#c8daff");
    }
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.intro_spoken" || flagKey === "intro_spoken") {
      this._introSpoken = Boolean(value);
    } else if (flagKey === "story.elaine_joined" || flagKey === "elaine_joined") {
      this._elaineJoined = Boolean(value);
    } else if (flagKey === "story.vein_quest_active" || flagKey === "vein_quest_active") {
      this._veinQuestActive = Boolean(value);
    } else if (flagKey === "story.vein_quest_complete" || flagKey === "vein_quest_complete") {
      this._veinQuestComplete = Boolean(value);
    } else if (flagKey === "story.act2_fallout_done" || flagKey === "act2_fallout_done") {
      this._act2FalloutDone = Boolean(value);
    } else if (flagKey === "story.rowan_council_done" || flagKey === "rowan_council_done") {
      this._rowanCouncilDone = Boolean(value);
    } else if (flagKey === "story.emberfall_lead_unlocked" || flagKey === "emberfall_lead_unlocked") {
      this._emberfallLeadUnlocked = Boolean(value);
    } else if (flagKey === "story.emberfall_unlocked" || flagKey === "emberfall_unlocked") {
      this._storyEmberfallUnlocked = Boolean(value);
    } else if (flagKey === "story.ridge_gate_unlocked" || flagKey === "ridge_gate_unlocked") {
      this._ridgeGateUnlocked = Boolean(value);
    } else if (flagKey === "story.region3_seed_unlocked" || flagKey === "region3_seed_unlocked") {
      this._region3SeedUnlocked = Boolean(value);
    } else if (flagKey === "story.region4_seed_gate_unlocked" || flagKey === "region4_seed_gate_unlocked") {
      this._region4SeedGateUnlocked = Boolean(value);
    } else if (flagKey === "story.endgame_route_seed_unlocked" || flagKey === "endgame_route_seed_unlocked") {
      this._endgameRouteSeedUnlocked = Boolean(value);
    } else if (flagKey === "story.endgame_outer_spire_unlocked" || flagKey === "endgame_outer_spire_unlocked") {
      this._endgameOuterSpireUnlocked = Boolean(value);
    }
    this._emberfallUnlocked =
      (this._veinQuestComplete && this._elaineJoined) || this._emberfallLeadUnlocked || this._storyEmberfallUnlocked;
    this._syncEmberfallPortalVisibility();
    this._syncRidgeGateState();
    this._syncRootwayGateState();
    this._syncEndgameGateState();
    this._setQuestMarkerVisible(this._veinQuestActive && !this._veinQuestComplete);
  }

  getRidgeGateConfig() {
    return {
      position: { x: this._ridgeGatePosition.x, y: this._ridgeGatePosition.y },
      interactRadius: RIDGE_GATE_INTERACT_RADIUS,
      unlocked: Boolean(this._ridgeGateUnlocked),
      targetSceneId: this._region3SeedUnlocked ? "windward" : "ridgepass",
      region3Unlocked: Boolean(this._region3SeedUnlocked),
    };
  }

  getAshGateConfig() {
    return {
      position: { x: this._emberfallPortalPosition.x, y: this._emberfallPortalPosition.y },
      interactRadius: 1.05,
      unlocked: Boolean(this._emberfallUnlocked),
    };
  }

  getRootwayGateConfig() {
    return {
      position: { x: this._rootwayGatePosition.x, y: this._rootwayGatePosition.y },
      interactRadius: ROOTWAY_GATE_INTERACT_RADIUS,
      unlocked: Boolean(this._region4SeedGateUnlocked),
      targetSceneId: "region4_seed",
    };
  }

  getEndgameGateConfig() {
    return {
      position: { x: this._endgameGatePosition.x, y: this._endgameGatePosition.y },
      interactRadius: ENDGAME_GATE_INTERACT_RADIUS,
      unlocked: Boolean(this._endgameRouteSeedUnlocked || this._endgameOuterSpireUnlocked),
      targetSceneId: this._endgameOuterSpireUnlocked ? "spire_approach" : "endgame_route_seed",
    };
  }

  getSpawnPosition() {
    return new THREE.Vector2(0, 0);
  }

  getVisualConfig() {
    return {
      skyTint: "#7f9578",
      lightTint: "#f1ead2",
      groundTint: "#6c9354",
      fogMultiplier: 0.96,
    };
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });

    if (this._veinQuestActive && !this._veinQuestComplete && this._questMarkerRing && this._questMarkerRing.visible) {
      const pulse = 0.7 + Math.sin(this._portalPulseTime * 4.6) * 0.3;
      this._questMarkerRing.material.opacity = 0.16 + pulse * 0.16;
      this._questMarkerBillboard.setOpacity(0.62 + pulse * 0.24);
    }

    const distanceToPortal = Math.hypot(
      playerPosition.x - this._hollowPortalPosition.x,
      playerPosition.z - this._hollowPortalPosition.y
    );
    const nearPortal = distanceToPortal <= 1.35;
    if (this._veinQuestActive && !this._veinQuestComplete && nearPortal && !this._wasNearHollowPortal) {
      this.pushSceneToast("The roots pulse faintly.");
    }
    this._wasNearHollowPortal = nearPortal;

    const distanceToEmberPortal = Math.hypot(
      playerPosition.x - this._emberfallPortalPosition.x,
      playerPosition.z - this._emberfallPortalPosition.y
    );
    const nearEmberPortal = this._emberfallUnlocked && distanceToEmberPortal <= 1.2;
    if (nearEmberPortal && !this._wasNearEmberfallPortal) {
      this.pushSceneToast("Ash rides the wind beyond the gate.");
    }
    this._wasNearEmberfallPortal = nearEmberPortal;

    const distanceToRidgeGate = Math.hypot(
      playerPosition.x - this._ridgeGatePosition.x,
      playerPosition.z - this._ridgeGatePosition.y
    );
    const nearRidgeGate = distanceToRidgeGate <= 1.18;
    if (nearRidgeGate && !this._wasNearRidgeGate) {
      this.pushSceneToast(this._ridgeGateUnlocked ? "The ridge wind tastes of iron." : "The roots knot tight across the ridge.");
    }
    this._wasNearRidgeGate = nearRidgeGate;

    const distanceToRootwayGate = Math.hypot(
      playerPosition.x - this._rootwayGatePosition.x,
      playerPosition.z - this._rootwayGatePosition.y
    );
    const nearRootwayGate = distanceToRootwayGate <= 1.18;
    if (nearRootwayGate && !this._wasNearRootwayGate) {
      this.pushSceneToast(
        this._region4SeedGateUnlocked ? "The rootway opens below Thornmere." : "The roots are knotted shut."
      );
    }
    this._wasNearRootwayGate = nearRootwayGate;

    const distanceToEndgameGate = Math.hypot(
      playerPosition.x - this._endgameGatePosition.x,
      playerPosition.z - this._endgameGatePosition.y
    );
    const nearEndgameGate = distanceToEndgameGate <= 1.2;
    if (nearEndgameGate && !this._wasNearEndgameGate && (this._endgameRouteSeedUnlocked || this._endgameOuterSpireUnlocked)) {
      this.pushSceneToast(
        this._endgameOuterSpireUnlocked ? "The Outer Spire route crackles open." : "The Last Spire route hums awake."
      );
    }
    this._wasNearEndgameGate = nearEndgameGate;
  }
}
