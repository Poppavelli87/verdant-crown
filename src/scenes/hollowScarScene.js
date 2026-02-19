import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const DANGER_ZONE_RADIUS = 1.9;
const DANGER_COOLDOWN_SECONDS = 2;
const BOSS_TRIGGER_RADIUS = 1.35;
const BOSS_ARENA_RADIUS = 2.55;
const BOSS_ARENA_CENTER = new THREE.Vector2(0, 0);
const VAELORIS_EXTRACTOR_POSITION = new THREE.Vector2(6.2, -3.2);
const VAELORIS_TRIGGER_RADIUS = 1.45;
const VAELORIS_INTERACT_RADIUS = 1.08;

function createExtractorFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 32, 48);
    ctx.fillStyle = "#222a31";
    ctx.fillRect(10, 44, 12, 3);
    ctx.fillStyle = "#10171e";
    ctx.fillRect(13, 8, 6, 34);
    ctx.fillStyle = "#4b5967";
    ctx.fillRect(14, 10, 4, 29);
    ctx.fillStyle = "#8ea6bc";
    ctx.fillRect(14, 4, 4, 6);
    ctx.fillStyle = "#d4ecff";
    ctx.fillRect(14, 2, 4, 2);
    ctx.fillStyle = "#5b6874";
    ctx.fillRect(11, 18, 2, 18);
    ctx.fillRect(19, 16, 2, 22);
    ctx.fillStyle = "#7ff0ab";
    ctx.fillRect(14, 22, 4, 2);
    ctx.fillStyle = "#67cf8a";
    ctx.fillRect(14, 27, 4, 2);
    ctx.fillStyle = "#4b5561";
    ctx.fillRect(8, 34, 5, 3);
    ctx.fillRect(19, 31, 5, 3);
  }, 32, 48);
}

// HollowScar is a stub region scene with distinct tinting and a combat danger zone.
export class HollowScarScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "hollowScar";
    this.displayName = "Hollow Scar";
    this.regionId = "umbral-hollows";
    this._dangerCooldownRemaining = 0;
    this._veinQuestActive = Boolean(
      this.saveState?.getStoryFlag?.("vein_quest_active") ?? this.saveState?.getFlag?.("story.vein_quest_active")
    );
    this._veinQuestComplete = Boolean(
      this.saveState?.getStoryFlag?.("vein_quest_complete") ?? this.saveState?.getFlag?.("story.vein_quest_complete")
    );
    this._veinGuardianDefeated = Boolean(
      this.saveState?.getStoryFlag?.("vein_guardian_defeated") ??
        this.saveState?.getFlag?.("story.vein_guardian_defeated")
    );
    this._vaelorisFieldTriggered = Boolean(
      this.saveState?.getStoryFlag?.("vaeloris_field_triggered") ??
        this.saveState?.getFlag?.("story.vaeloris_field_triggered")
    );
    this._vaelorisChoice = String(
      this.saveState?.getStoryFlag?.("vaeloris_first_choice") ??
        this.saveState?.getFlag?.("story.vaeloris_first_choice") ??
        ""
    );
    this._vaelorisUnlocked = this._veinGuardianDefeated || this._vaelorisFieldTriggered || this._vaelorisChoice !== "";
    this._extractorDestroyed = this._vaelorisChoice === "disable";
    this._veinQuestMarker = null;
    this._extractorCamp = null;
    this._extractorPulseSeconds = 0;

    this._createProps();
    this.addPortal({
      id: "hollow_to_thornmere",
      targetSceneId: "thornmere",
      position: new THREE.Vector2(-4.2, 0),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#c4b7ff",
      label: "Thornmere Return Gate",
    });
    this._createQuestMarker();
    this._syncQuestMarkerVisibility();
  }

  _createProps() {
    const rocks = [
      { x: -2.65, z: -1.95, variant: "rock_b", scale: 1.05 },
      { x: 2.25, z: -2.25, variant: "rock_a", scale: 1.0 },
      { x: 3.15, z: 1.95, variant: "rock_b", scale: 1.08 },
      { x: -1.95, z: 2.55, variant: "rock_a", scale: 0.92 },
      { x: 0.15, z: -2.95, variant: "rock_b", scale: 0.94 },
    ];
    for (const rock of rocks) {
      this.addBillboard({
        assetPath: `./assets/sprites/rocks/${rock.variant}.png`,
        width: 1.2 * rock.scale,
        height: 0.76 * rock.scale,
        position: new THREE.Vector2(rock.x, rock.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        tint: "#c4cad1",
      });
    }

    const scarTrees = [
      { x: -3.15, z: 0.35 },
      { x: 2.95, z: -0.35 },
    ];
    for (let i = 0; i < scarTrees.length; i += 1) {
      const tree = scarTrees[i];
      this.addBillboard({
        assetPath: i % 2 === 0 ? "./assets/sprites/trees/tree_oak_b.png" : "./assets/sprites/trees/tree_oak_a.png",
        width: 1.72,
        height: 1.88,
        position: new THREE.Vector2(tree.x, tree.z),
        groundY: -0.9,
        swayAmount: 0.03,
        swaySpeed: 1.1,
        swayPhase: i * 0.8,
        tint: "#afb7c2",
      });
    }

    this.addBillboard({
      assetPath: "./assets/sprites/stump.png",
      width: 0.72,
      height: 0.72,
      position: new THREE.Vector2(1.45, 2.95),
      groundY: -0.9,
      depthBaseOrder: 1120,
      tint: "#c7ced8",
    });

    const dangerRing = new THREE.Mesh(
      new THREE.RingGeometry(BOSS_TRIGGER_RADIUS * 0.86, BOSS_TRIGGER_RADIUS, 40),
      new THREE.MeshBasicMaterial({
        color: "#fca5a5",
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    dangerRing.rotation.x = -Math.PI / 2;
    dangerRing.position.set(0, -0.885, 0);
    this.addObject(dangerRing);

    const dangerCore = new THREE.Mesh(
      new THREE.CircleGeometry(BOSS_TRIGGER_RADIUS * 0.66, 40),
      new THREE.MeshBasicMaterial({
        color: "#826f88",
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      })
    );
    dangerCore.rotation.x = -Math.PI / 2;
    dangerCore.position.set(0, -0.89, 0);
    this.addObject(dangerCore);

    const arenaGuide = new THREE.Mesh(
      new THREE.RingGeometry(BOSS_ARENA_RADIUS * 0.98, BOSS_ARENA_RADIUS, 80),
      new THREE.MeshBasicMaterial({
        color: "#b8ffd1",
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    arenaGuide.rotation.x = -Math.PI / 2;
    arenaGuide.position.set(BOSS_ARENA_CENTER.x, -0.887, BOSS_ARENA_CENTER.y);
    arenaGuide.renderOrder = 1018;
    this.addObject(arenaGuide);

    this._createVaelorisCamp();
  }

  _createVaelorisCamp() {
    const extractor = this.addBillboard({
      assetPath: null,
      fallbackTexture: createExtractorFallbackTexture(),
      width: 1.36,
      height: 2.2,
      position: VAELORIS_EXTRACTOR_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.06,
      depthBaseOrder: 1182,
      opacity: 0.96,
      tint: "#d9e4ec",
      swayAmount: 0,
      scaleWithProps: false,
      shadowOpacity: 0.2,
      groundPatchOpacity: 0.09,
    });

    const baseGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.56, 28),
      new THREE.MeshBasicMaterial({
        color: "#89efad",
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    );
    baseGlow.rotation.x = -Math.PI / 2;
    baseGlow.position.set(VAELORIS_EXTRACTOR_POSITION.x, -0.884, VAELORIS_EXTRACTOR_POSITION.y);
    baseGlow.renderOrder = 1037;
    this.addObject(baseGlow);

    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.36, 24),
      new THREE.MeshBasicMaterial({
        color: "#b9ffc4",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.set(VAELORIS_EXTRACTOR_POSITION.x, -0.883, VAELORIS_EXTRACTOR_POSITION.y);
    pulseRing.renderOrder = 1038;
    this.addObject(pulseRing);

    const conduit = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 1.2),
      new THREE.MeshBasicMaterial({
        color: "#4f5d65",
        transparent: true,
        opacity: 0.54,
        depthWrite: false,
      })
    );
    conduit.rotation.x = -Math.PI / 2;
    conduit.rotation.z = -0.42;
    conduit.position.set(VAELORIS_EXTRACTOR_POSITION.x - 0.22, -0.886, VAELORIS_EXTRACTOR_POSITION.y + 0.45);
    conduit.renderOrder = 1033;
    this.addObject(conduit);

    const particles = [];
    for (let i = 0; i < 4; i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: "#b2ffd1",
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        })
      );
      const scale = 0.09 + i * 0.015;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(VAELORIS_EXTRACTOR_POSITION.x, -0.66 + i * 0.06, VAELORIS_EXTRACTOR_POSITION.y);
      sprite.renderOrder = 1186;
      this.addObject(sprite);
      particles.push({
        sprite,
        phase: i * 0.83,
        radius: 0.07 + i * 0.015,
        lift: 0.05 + i * 0.025,
      });
    }

    this._extractorCamp = {
      extractor,
      baseGlow,
      pulseRing,
      conduit,
      particles,
    };
    this._applyExtractorVisibility();
  }

  _applyExtractorVisibility() {
    if (!this._extractorCamp) return;
    const visible = this._vaelorisUnlocked && !this._extractorDestroyed;
    this._extractorCamp.extractor.mesh.visible = visible;
    this._extractorCamp.baseGlow.visible = visible;
    this._extractorCamp.pulseRing.visible = visible;
    this._extractorCamp.conduit.visible = visible;
    for (const particle of this._extractorCamp.particles) {
      particle.sprite.visible = visible;
    }
  }

  _createQuestMarker() {
    const markerPosition = new THREE.Vector2(2.22, 1.05);
    this._veinQuestMarker = this.addBillboard({
      assetPath: "./assets/sprites/anomaly.png",
      width: 0.52,
      height: 0.52,
      position: markerPosition,
      groundY: -0.9,
      yOffset: 0.08,
      depthBaseOrder: 1168,
      opacity: 0.78,
      anchorShadow: false,
      swayAmount: 0.016,
      swaySpeed: 0.9,
      scaleWithProps: false,
      tint: "#ccffc9",
    });
  }

  _syncQuestMarkerVisibility() {
    if (!this._veinQuestMarker) return;
    this._veinQuestMarker.mesh.visible = this._veinQuestActive && !this._veinQuestComplete;
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.vein_quest_active" || flagKey === "vein_quest_active") {
      this._veinQuestActive = Boolean(value);
      this._syncQuestMarkerVisibility();
    } else if (flagKey === "story.vein_quest_complete" || flagKey === "vein_quest_complete") {
      this._veinQuestComplete = Boolean(value);
      this._syncQuestMarkerVisibility();
    } else if (flagKey === "story.vein_guardian_defeated" || flagKey === "vein_guardian_defeated") {
      this._veinGuardianDefeated = Boolean(value);
      this._vaelorisUnlocked = this._veinGuardianDefeated || this._vaelorisFieldTriggered || this._vaelorisChoice !== "";
      this._applyExtractorVisibility();
    } else if (flagKey === "story.vaeloris_field_triggered" || flagKey === "vaeloris_field_triggered") {
      this._vaelorisFieldTriggered = Boolean(value);
      this._vaelorisUnlocked = this._veinGuardianDefeated || this._vaelorisFieldTriggered || this._vaelorisChoice !== "";
      this._applyExtractorVisibility();
    } else if (flagKey === "story.vaeloris_first_choice" || flagKey === "vaeloris_first_choice") {
      this._vaelorisChoice = String(value ?? "");
      this._vaelorisUnlocked = this._veinGuardianDefeated || this._vaelorisFieldTriggered || this._vaelorisChoice !== "";
      this._extractorDestroyed = this._vaelorisChoice === "disable";
      this._applyExtractorVisibility();
    }
  }

  setVaelorisExtractorDestroyed(destroyed) {
    this._extractorDestroyed = Boolean(destroyed);
    this._applyExtractorVisibility();
  }

  isVaelorisExtractorDestroyed() {
    return this._extractorDestroyed;
  }

  getVaelorisFieldConfig() {
    return {
      extractorPosition: { x: VAELORIS_EXTRACTOR_POSITION.x, y: VAELORIS_EXTRACTOR_POSITION.y },
      triggerCenter: { x: VAELORIS_EXTRACTOR_POSITION.x - 0.3, y: VAELORIS_EXTRACTOR_POSITION.y + 0.12 },
      triggerRadius: VAELORIS_TRIGGER_RADIUS,
      interactRadius: VAELORIS_INTERACT_RADIUS,
      constructSpawns: [
        { x: VAELORIS_EXTRACTOR_POSITION.x - 0.62, y: VAELORIS_EXTRACTOR_POSITION.y + 0.42 },
        { x: VAELORIS_EXTRACTOR_POSITION.x + 0.56, y: VAELORIS_EXTRACTOR_POSITION.y - 0.48 },
      ],
      extractorDestroyed: this._extractorDestroyed,
    };
  }

  getSpawnPosition() {
    return new THREE.Vector2(-1.6, 0);
  }

  getVisualConfig() {
    return {
      skyTint: "#6e7887",
      lightTint: "#d4dceb",
      groundTint: "#5f6d62",
      fogMultiplier: 1.24,
    };
  }

  getBossArenaConfig() {
    return {
      bossId: "crown_manifestation",
      bounds: {
        type: "circle",
        center: { x: BOSS_ARENA_CENTER.x, y: BOSS_ARENA_CENTER.y },
        radius: BOSS_ARENA_RADIUS,
      },
      trigger: {
        center: { x: BOSS_ARENA_CENTER.x, y: BOSS_ARENA_CENTER.y },
        radius: BOSS_TRIGGER_RADIUS,
      },
      resetCooldownSeconds: 5,
    };
  }

  getEnemySpawns() {
    return [
      {
        id: "hollow-foe-1",
        type: "standard",
        role: "skirmisher",
        x: 0.85,
        z: -0.45,
        maxHealth: 36,
        aggroRadius: 2.8,
        attackRange: 0.68,
        attackCooldown: 1.2,
        lingerTag: "hollowscar-pack",
      },
      {
        id: "hollow-foe-2",
        type: "ambush",
        role: "harrier",
        x: 2.95,
        z: 2.25,
        maxHealth: 46,
        aggroRadius: 1.6,
        attackRange: 0.68,
        attackCooldown: 1.8,
        lingerTag: "hollowscar-pack",
      },
      {
        id: "hollow-foe-3",
        type: "standard",
        role: "brute",
        x: 3.25,
        z: -2.2,
        maxHealth: 72,
        aggroRadius: 1.6,
        attackRange: 0.74,
        attackCooldown: 2,
        lingerTag: "hollowscar-pack",
      },
    ];
  }

  getPulseSurgeSpawns(roles = []) {
    const roleList = Array.isArray(roles) && roles.length > 0 ? roles.slice(0, 3) : ["skirmisher", "skirmisher"];
    const layouts = [
      [
        { x: -0.75, z: -2.85 },
        { x: 2.55, z: 2.85 },
        { x: 0.35, z: 3.05 },
      ],
      [
        { x: 2.55, z: -2.65 },
        { x: -1.35, z: 2.65 },
        { x: 0.6, z: -3.0 },
      ],
    ];
    const layoutIndex = this.rng?.nextInt ? this.rng.nextInt(layouts.length) : 0;
    const layout = layouts[layoutIndex];

    return roleList.map((role, index) => {
      const point = layout[index % layout.length];
      return {
        id: `pulse-surge-${role}-${index + 1}`,
        role,
        type: role === "harrier" ? "ambush" : "standard",
        x: point.x,
        z: point.z,
        aggroRadius: 3.1,
        attackRange: role === "brute" ? 0.76 : 0.67,
        lingerTag: "pulse-wave",
      };
    });
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds);

    this._extractorPulseSeconds += dtSeconds;

    if (this._veinQuestMarker && this._veinQuestMarker.mesh.visible) {
      const pulse = 0.58 + Math.sin(this._portalPulseTime * 4.4) * 0.42;
      this._veinQuestMarker.setOpacity(0.52 + pulse * 0.32);
    }

    if (this._extractorCamp && !this._extractorDestroyed) {
      const pulse = 0.55 + Math.sin(this._extractorPulseSeconds * 2.9) * 0.45;
      this._extractorCamp.baseGlow.material.opacity = 0.11 + pulse * 0.17;
      this._extractorCamp.pulseRing.material.opacity = 0.14 + pulse * 0.22;
      const ringScale = 0.9 + pulse * 0.32;
      this._extractorCamp.pulseRing.scale.setScalar(ringScale);
      for (let i = 0; i < this._extractorCamp.particles.length; i += 1) {
        const particle = this._extractorCamp.particles[i];
        const wobble = this._extractorPulseSeconds * (1.2 + i * 0.14) + particle.phase;
        const loop = (this._extractorPulseSeconds * (0.32 + i * 0.04) + i * 0.23) % 1;
        const radius = particle.radius + Math.sin(wobble * 1.5) * 0.018;
        particle.sprite.position.x = VAELORIS_EXTRACTOR_POSITION.x + Math.cos(wobble) * radius;
        particle.sprite.position.z = VAELORIS_EXTRACTOR_POSITION.y + Math.sin(wobble * 1.3) * radius;
        particle.sprite.position.y = -0.73 + particle.lift + loop * 0.28;
        particle.sprite.material.opacity = 0.18 + pulse * 0.35;
      }
    }

    const dx = playerPosition.x;
    const dz = playerPosition.z;
    const distance = Math.hypot(dx, dz);

    if (distance <= DANGER_ZONE_RADIUS) {
      this._dangerCooldownRemaining = DANGER_COOLDOWN_SECONDS;
    } else {
      this._dangerCooldownRemaining = Math.max(0, this._dangerCooldownRemaining - dtSeconds);
    }
  }

  getContextState() {
    const base = super.getContextState();
    return {
      ...base,
      combatForced: this._dangerCooldownRemaining > 0,
    };
  }
}
