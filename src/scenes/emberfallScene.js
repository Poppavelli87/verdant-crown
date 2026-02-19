import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BaseScene } from "./baseScene.js";
import { createPixelBillboardFallbackTexture } from "../render/billboard.js";

const THORNMERE_RETURN_PORTAL = new THREE.Vector2(-4.25, 0.15);
const WILLOW_POSITION = new THREE.Vector2(2.35, -0.82);
const WILLOW_LANDMARK_RADIUS = 1.15;
const WILLOW_MEET_TRIGGER_RADIUS = 1.12;
const WILLOW_AMBUSH_RADIUS = 2.45;
const ASH_PARTICLE_COUNT = 16;
const HARVESTER_SITE_CENTER = new THREE.Vector2(4.28, -2.18);
const HARVESTER_TRIGGER_RADIUS = 1.26;
const HARVESTER_INTERACT_RADIUS = 1.08;
const HARVESTER_ARENA_RADIUS = 2.95;
const HARVESTER_ANCHORS = Object.freeze([
  { x: HARVESTER_SITE_CENTER.x - 0.95, y: HARVESTER_SITE_CENTER.y - 0.22 },
  { x: HARVESTER_SITE_CENTER.x + 0.62, y: HARVESTER_SITE_CENTER.y - 0.92 },
  { x: HARVESTER_SITE_CENTER.x + 0.34, y: HARVESTER_SITE_CENTER.y + 0.78 },
]);

const WILLOW_PREMEET_LINES = Object.freeze(["Willow: Hold that thought. Scouts first, stories second."]);

const WILLOW_REPEAT_LINES = Object.freeze(["Willow: Emberfall listens before it burns."]);
const LISTENING_SPIKE_POSITION = new THREE.Vector2(-1.95, 2.08);
const LISTENING_SPIKE_TRIGGER_RADIUS = 1.16;
const LISTENING_SPIKE_INTERACT_RADIUS = 1.02;
const LISTENING_SPIKE_ARENA_RADIUS = 2.38;

function createListeningSpikeFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(8, 42, 20, 4);
    ctx.fillStyle = "#3a4348";
    ctx.fillRect(15, 13, 6, 28);
    ctx.fillStyle = "#93b4bd";
    ctx.fillRect(17, 6, 2, 7);
    ctx.fillStyle = "#acd5de";
    ctx.fillRect(13, 29, 10, 2);
    ctx.fillRect(11, 34, 14, 2);
    ctx.fillStyle = "#74d2c1";
    ctx.fillRect(17, 4, 2, 2);
  }, 36, 52);
}

export class EmberfallScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "emberfall";
    this.displayName = "Emberfall";
    this.regionId = "emberfall-crags";
    this._ashTime = 0;
    this._ashParticles = [];
    this._ventPulses = [];
    this._willowJoined = Boolean(
      this.saveState?.getStoryFlag?.("willow_joined") ?? this.saveState?.getFlag?.("story.willow_joined")
    );
    this._willowMet = Boolean(
      this.saveState?.getStoryFlag?.("willow_met") ?? this.saveState?.getFlag?.("story.willow_met")
    );
    this._willowNpc = null;
    this._willowLandmarkRing = null;
    this._harvesterSetpiece = null;
    this._harvesterPulseSeconds = 0;
    this._harvesterDefeated = Boolean(
      this.saveState?.getStoryFlag?.("vaeloris_harvester_defeated") ??
        this.saveState?.getFlag?.("story.vaeloris_harvester_defeated")
    );
    this._listeningSpikeCleared = Boolean(
      this.saveState?.getStoryFlag?.("listening_spike_site_cleared") ??
        this.saveState?.getFlag?.("story.listening_spike_site_cleared")
    );
    this._listeningSpikeSite = null;
    this._createProps();
    this._createHarvesterSite();
    this._createListeningSpikeSite();
    this.addPortal({
      id: "emberfall_to_thornmere",
      targetSceneId: "thornmere",
      position: THORNMERE_RETURN_PORTAL.clone(),
      radius: 0.82,
      interactRadius: 1.05,
      color: "#e8b179",
      label: "Thornmere Pass",
    });
    this._createWillowNpc();
    this._applyWillowVisibility();
  }

  _createProps() {
    const charredTrees = [
      { x: -3.45, z: -2.3 },
      { x: -2.95, z: 2.4 },
      { x: 2.95, z: -2.45 },
      { x: 3.25, z: 2.35 },
      { x: 0.35, z: 3.05 },
    ];
    for (let i = 0; i < charredTrees.length; i += 1) {
      const tree = charredTrees[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/charred_tree.png",
        width: 1.82,
        height: 2.05,
        position: new THREE.Vector2(tree.x, tree.z),
        groundY: -0.9,
        swayAmount: 0.018,
        swaySpeed: 0.9,
        swayPhase: i * 0.61,
        shadowOpacity: 0.2,
      });
    }

    const basalt = [
      { x: -1.8, z: -0.95, scale: 1.08 },
      { x: 0.65, z: -2.05, scale: 0.95 },
      { x: 1.95, z: 1.55, scale: 1.02 },
      { x: -2.15, z: 1.65, scale: 0.92 },
    ];
    for (const rock of basalt) {
      this.addBillboard({
        assetPath: "./assets/sprites/props/basalt_rock.png",
        width: 1.3 * rock.scale,
        height: 0.82 * rock.scale,
        position: new THREE.Vector2(rock.x, rock.z),
        groundY: -0.9,
        depthBaseOrder: 1110,
        shadowOpacity: 0.19,
      });
    }

    const vents = [
      new THREE.Vector2(1.45, -0.35),
      new THREE.Vector2(2.7, -1.4),
      new THREE.Vector2(-0.9, 1.75),
    ];
    for (let i = 0; i < vents.length; i += 1) {
      const ventPos = vents[i];
      this.addBillboard({
        assetPath: "./assets/sprites/props/ember_vent.png",
        width: 1.05,
        height: 1.28,
        position: ventPos.clone(),
        groundY: -0.9,
        yOffset: 0.01,
        depthBaseOrder: 1140,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
      });
      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(0.26, 0.34, 28),
        new THREE.MeshBasicMaterial({
          color: "#ffd6a1",
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.set(ventPos.x, -0.884, ventPos.y);
      pulse.renderOrder = 1038;
      this.addObject(pulse);
      this._ventPulses.push({
        mesh: pulse,
        phase: i * 0.72,
      });
    }

    this._willowLandmarkRing = new THREE.Mesh(
      new THREE.RingGeometry(WILLOW_LANDMARK_RADIUS * 0.78, WILLOW_LANDMARK_RADIUS, 32),
      new THREE.MeshBasicMaterial({
        color: "#b8f5bb",
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this._willowLandmarkRing.rotation.x = -Math.PI / 2;
    this._willowLandmarkRing.position.set(WILLOW_POSITION.x, -0.886, WILLOW_POSITION.y);
    this._willowLandmarkRing.renderOrder = 1041;
    this.addObject(this._willowLandmarkRing);

    for (let i = 0; i < ASH_PARTICLE_COUNT; i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: i % 2 === 0 ? "#d4d7dc" : "#c8bbb2",
          transparent: true,
          opacity: 0.26 + (i % 3) * 0.04,
          depthWrite: false,
        })
      );
      const seedA = i * 0.731 + 0.25;
      const seedB = i * 0.447 + 0.63;
      const x = Math.sin(seedA * 2.9) * 4.1;
      const z = Math.cos(seedB * 3.3) * 3.2;
      const y = -0.62 + (i % 6) * 0.11;
      const scale = 0.04 + (i % 4) * 0.012;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(x, y, z);
      sprite.renderOrder = 1189;
      this.addObject(sprite);
      this._ashParticles.push({
        sprite,
        baseX: x,
        baseZ: z,
        baseY: y,
        driftX: 0.05 + (i % 5) * 0.018,
        driftZ: 0.03 + (i % 4) * 0.016,
        riseSpeed: 0.04 + (i % 6) * 0.01,
        phase: i * 0.53,
      });
    }
  }

  _createWillowNpc() {
    this._willowNpc = this.addNpc({
      id: "willow",
      name: "Willow",
      sprite: "./assets/sprites/npc/willow.png",
      position: WILLOW_POSITION.clone(),
      width: 1.5,
      height: 2.0,
      interactRadius: 1.02,
      dialogueScript: () => (this._willowJoined ? WILLOW_REPEAT_LINES : WILLOW_PREMEET_LINES),
      onInteractCallback: ({ saveState }) => {
        if (this._willowJoined || this._willowMet) return;
        saveState?.setStoryFlag?.("willow_pending_intro", true);
        saveState?.setFlag?.("story.willow_pending_intro", true);
        this._applyWillowVisibility();
      },
    });
  }

  _createHarvesterSite() {
    const rig = this.addBillboard({
      assetPath: "./assets/sprites/props/harvester_rig.png",
      width: 1.5,
      height: 2.25,
      position: HARVESTER_SITE_CENTER.clone(),
      groundY: -0.9,
      yOffset: 0.04,
      depthBaseOrder: 1190,
      opacity: 0.94,
      tint: "#dbe6f0",
      swayAmount: 0,
      scaleWithProps: false,
      shadowOpacity: 0.22,
      groundPatchOpacity: 0.1,
    });

    const anchorBillboards = HARVESTER_ANCHORS.map((entry, index) =>
      this.addBillboard({
        assetPath: "./assets/sprites/props/anchor_node.png",
        width: 0.96,
        height: 1.26,
        position: new THREE.Vector2(entry.x, entry.y),
        groundY: -0.9,
        yOffset: 0.03,
        depthBaseOrder: 1186,
        opacity: 0.95,
        tint: "#d7e2eb",
        swayAmount: 0.01,
        swaySpeed: 0.78,
        swayPhase: index * 0.66,
        scaleWithProps: false,
        shadowOpacity: 0.18,
        groundPatchOpacity: 0.08,
      })
    );

    const triggerRing = new THREE.Mesh(
      new THREE.RingGeometry(HARVESTER_TRIGGER_RADIUS * 0.82, HARVESTER_TRIGGER_RADIUS, 36),
      new THREE.MeshBasicMaterial({
        color: "#ffc992",
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    triggerRing.rotation.x = -Math.PI / 2;
    triggerRing.position.set(HARVESTER_SITE_CENTER.x, -0.886, HARVESTER_SITE_CENTER.y);
    triggerRing.renderOrder = 1043;
    this.addObject(triggerRing);

    const areaRing = new THREE.Mesh(
      new THREE.RingGeometry(HARVESTER_ARENA_RADIUS * 0.97, HARVESTER_ARENA_RADIUS, 72),
      new THREE.MeshBasicMaterial({
        color: "#ffc38d",
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    areaRing.rotation.x = -Math.PI / 2;
    areaRing.position.set(HARVESTER_SITE_CENTER.x, -0.887, HARVESTER_SITE_CENTER.y);
    areaRing.renderOrder = 1025;
    this.addObject(areaRing);

    const rigGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.66, 26),
      new THREE.MeshBasicMaterial({
        color: "#9affbb",
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
    );
    rigGlow.rotation.x = -Math.PI / 2;
    rigGlow.position.set(HARVESTER_SITE_CENTER.x, -0.883, HARVESTER_SITE_CENTER.y);
    rigGlow.renderOrder = 1038;
    this.addObject(rigGlow);

    const particles = [];
    for (let i = 0; i < 6; i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: "#b9ffd2",
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      );
      const scale = 0.07 + (i % 3) * 0.016;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(HARVESTER_SITE_CENTER.x, -0.66 + i * 0.03, HARVESTER_SITE_CENTER.y);
      sprite.renderOrder = 1189;
      this.addObject(sprite);
      particles.push({
        sprite,
        phase: i * 0.71,
        radius: 0.08 + i * 0.013,
        lift: 0.05 + i * 0.012,
      });
    }

    this._harvesterSetpiece = {
      rig,
      anchors: anchorBillboards,
      triggerRing,
      areaRing,
      rigGlow,
      particles,
    };
    this._applyHarvesterVisibility();
  }

  _createListeningSpikeSite() {
    const spike = this.addBillboard({
      assetPath: "./assets/sprites/props/listening_spike.png",
      fallbackTexture: createListeningSpikeFallbackTexture(),
      width: 1.1,
      height: 1.94,
      position: LISTENING_SPIKE_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.03,
      depthBaseOrder: 1192,
      opacity: 0.95,
      tint: "#d9e6ec",
      swayAmount: 0.006,
      swaySpeed: 0.9,
      scaleWithProps: false,
      shadowOpacity: 0.22,
      groundPatchOpacity: 0.1,
    });

    const triggerRing = new THREE.Mesh(
      new THREE.RingGeometry(LISTENING_SPIKE_TRIGGER_RADIUS * 0.82, LISTENING_SPIKE_TRIGGER_RADIUS, 36),
      new THREE.MeshBasicMaterial({
        color: "#b8d8c2",
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    triggerRing.rotation.x = -Math.PI / 2;
    triggerRing.position.set(LISTENING_SPIKE_POSITION.x, -0.886, LISTENING_SPIKE_POSITION.y);
    triggerRing.renderOrder = 1044;
    this.addObject(triggerRing);

    const areaRing = new THREE.Mesh(
      new THREE.RingGeometry(LISTENING_SPIKE_ARENA_RADIUS * 0.97, LISTENING_SPIKE_ARENA_RADIUS, 64),
      new THREE.MeshBasicMaterial({
        color: "#b7dbc7",
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    areaRing.rotation.x = -Math.PI / 2;
    areaRing.position.set(LISTENING_SPIKE_POSITION.x, -0.887, LISTENING_SPIKE_POSITION.y);
    areaRing.renderOrder = 1026;
    this.addObject(areaRing);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.58, 26),
      new THREE.MeshBasicMaterial({
        color: "#8ee9d0",
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(LISTENING_SPIKE_POSITION.x, -0.883, LISTENING_SPIKE_POSITION.y);
    glow.renderOrder = 1040;
    this.addObject(glow);

    const particles = [];
    for (let i = 0; i < 5; i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          color: "#a9f3dd",
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      );
      const scale = 0.055 + (i % 3) * 0.014;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(LISTENING_SPIKE_POSITION.x, -0.72 + i * 0.03, LISTENING_SPIKE_POSITION.y);
      sprite.renderOrder = 1189;
      this.addObject(sprite);
      particles.push({
        sprite,
        phase: i * 0.69,
        radius: 0.05 + i * 0.012,
        lift: 0.04 + i * 0.01,
      });
    }

    this._listeningSpikeSite = {
      spike,
      triggerRing,
      areaRing,
      glow,
      particles,
    };
    this._applyListeningSpikeVisibility();
  }

  _applyHarvesterVisibility() {
    if (!this._harvesterSetpiece) return;
    const visible = !this._harvesterDefeated;
    this._harvesterSetpiece.rig.mesh.visible = true;
    this._harvesterSetpiece.triggerRing.visible = visible;
    this._harvesterSetpiece.areaRing.visible = visible;
    this._harvesterSetpiece.rigGlow.visible = true;
    for (const anchor of this._harvesterSetpiece.anchors) {
      anchor.mesh.visible = visible;
    }
    for (const particle of this._harvesterSetpiece.particles) {
      particle.sprite.visible = true;
    }
  }

  _applyListeningSpikeVisibility() {
    if (!this._listeningSpikeSite) return;
    const cleared = Boolean(this._listeningSpikeCleared);
    this._listeningSpikeSite.spike.mesh.visible = true;
    this._listeningSpikeSite.spike.mesh.material.opacity = cleared ? 0.86 : 0.95;
    this._listeningSpikeSite.spike.mesh.material.color.set(cleared ? "#8fa4a9" : "#d9e6ec");
    this._listeningSpikeSite.triggerRing.visible = !cleared;
    this._listeningSpikeSite.areaRing.visible = !cleared;
    this._listeningSpikeSite.glow.visible = true;
    for (const particle of this._listeningSpikeSite.particles) {
      particle.sprite.visible = true;
    }
  }

  _applyWillowVisibility() {
    const visible = !this._willowJoined;
    if (this._willowNpc) {
      this._willowNpc.interactRadius = visible && this._willowMet ? 1.02 : 0;
      if (this._willowNpc._billboard?.mesh) {
        this._willowNpc._billboard.mesh.visible = visible;
      }
      if (this._willowNpc._interactRing) {
        this._willowNpc._interactRing.visible = visible && this._willowMet;
      }
    }
    if (this._willowLandmarkRing) {
      this._willowLandmarkRing.visible = visible;
    }
  }

  onStoryFlagChanged(flagKey, value) {
    if (flagKey === "story.willow_joined" || flagKey === "willow_joined") {
      this._willowJoined = Boolean(value);
      this._applyWillowVisibility();
    } else if (flagKey === "story.willow_met" || flagKey === "willow_met") {
      this._willowMet = Boolean(value);
      this._applyWillowVisibility();
    } else if (flagKey === "story.vaeloris_harvester_defeated" || flagKey === "vaeloris_harvester_defeated") {
      this._harvesterDefeated = Boolean(value);
      this._applyHarvesterVisibility();
    } else if (flagKey === "story.listening_spike_site_cleared" || flagKey === "listening_spike_site_cleared") {
      this._listeningSpikeCleared = Boolean(value);
      this._applyListeningSpikeVisibility();
    }
  }

  getSpawnPosition() {
    return new THREE.Vector2(-2.75, 0.2);
  }

  getVisualConfig() {
    return {
      skyTint: "#a16b52",
      lightTint: "#ffd1a2",
      groundTint: "#8f5336",
      fogMultiplier: 1.05,
    };
  }

  getWillowEncounterConfig() {
    return {
      center: { x: WILLOW_POSITION.x, y: WILLOW_POSITION.y },
      triggerRadius: WILLOW_MEET_TRIGGER_RADIUS,
      ambushRadius: WILLOW_AMBUSH_RADIUS,
      willowMet: this._willowMet,
      willowJoined: this._willowJoined,
    };
  }

  getHarvesterSiteConfig() {
    return {
      center: { x: HARVESTER_SITE_CENTER.x, y: HARVESTER_SITE_CENTER.y },
      triggerRadius: HARVESTER_TRIGGER_RADIUS,
      interactRadius: HARVESTER_INTERACT_RADIUS,
      anchorPositions: HARVESTER_ANCHORS.map((entry) => ({ x: entry.x, y: entry.y })),
      defeated: this._harvesterDefeated,
    };
  }

  getListeningSpikeSiteConfig() {
    return {
      center: { x: LISTENING_SPIKE_POSITION.x, y: LISTENING_SPIKE_POSITION.y },
      triggerRadius: LISTENING_SPIKE_TRIGGER_RADIUS,
      interactRadius: LISTENING_SPIKE_INTERACT_RADIUS,
      arenaRadius: LISTENING_SPIKE_ARENA_RADIUS,
      cleared: this._listeningSpikeCleared,
    };
  }

  getBossArenaConfig() {
    return {
      bossId: "harvester_warden",
      bounds: {
        type: "circle",
        center: { x: HARVESTER_SITE_CENTER.x, y: HARVESTER_SITE_CENTER.y },
        radius: HARVESTER_ARENA_RADIUS,
      },
      trigger: {
        center: { x: HARVESTER_SITE_CENTER.x, y: HARVESTER_SITE_CENTER.y },
        radius: HARVESTER_TRIGGER_RADIUS,
      },
      resetCooldownSeconds: 5,
    };
  }

  getEnemySpawns() {
    return [
      {
        id: "emberfall-skirmisher-1",
        type: "standard",
        role: "skirmisher",
        x: 1.9,
        z: 0.8,
        maxHealth: 38,
        aggroRadius: 2.6,
        attackRange: 0.7,
        attackCooldown: 1.3,
        lingerTag: "emberfall-pack",
      },
      {
        id: "emberfall-harrier-1",
        type: "ambush",
        role: "harrier",
        x: -1.25,
        z: -1.5,
        maxHealth: 46,
        aggroRadius: 2.1,
        attackRange: 0.68,
        attackCooldown: 1.8,
        lingerTag: "emberfall-pack",
      },
    ];
  }

  update(dtSeconds, { playerPosition }) {
    super.update(dtSeconds, { playerPosition });
    this._ashTime += dtSeconds;

    for (let i = 0; i < this._ventPulses.length; i += 1) {
      const pulse = this._ventPulses[i];
      const beat = 0.5 + Math.sin(this._ashTime * 2.2 + pulse.phase) * 0.5;
      pulse.mesh.material.opacity = 0.1 + beat * 0.22;
      const scale = 0.9 + beat * 0.4;
      pulse.mesh.scale.setScalar(scale);
    }

    if (this._willowLandmarkRing?.visible) {
      const beat = 0.5 + Math.sin(this._ashTime * 3.1) * 0.5;
      this._willowLandmarkRing.material.opacity = 0.12 + beat * 0.12;
    }

    this._harvesterPulseSeconds += dtSeconds;
    if (this._harvesterSetpiece) {
      const beat = 0.5 + Math.sin(this._harvesterPulseSeconds * 2.7) * 0.5;
      this._harvesterSetpiece.rigGlow.material.opacity = 0.08 + beat * 0.18;
      const triggerOpacity = this._harvesterDefeated ? 0 : 0.1 + beat * 0.12;
      this._harvesterSetpiece.triggerRing.material.opacity = triggerOpacity;
      this._harvesterSetpiece.areaRing.material.opacity = this._harvesterDefeated ? 0 : 0.05 + beat * 0.05;
      for (let i = 0; i < this._harvesterSetpiece.particles.length; i += 1) {
        const particle = this._harvesterSetpiece.particles[i];
        const drift = this._harvesterPulseSeconds * (1 + i * 0.15) + particle.phase;
        const loop = (this._harvesterPulseSeconds * (0.28 + i * 0.035) + i * 0.22) % 1;
        particle.sprite.position.x = HARVESTER_SITE_CENTER.x + Math.cos(drift) * particle.radius;
        particle.sprite.position.z = HARVESTER_SITE_CENTER.y + Math.sin(drift * 1.17) * particle.radius;
        particle.sprite.position.y = -0.7 + particle.lift + loop * 0.32;
        particle.sprite.material.opacity = 0.12 + beat * 0.3;
      }
    }

    if (this._listeningSpikeSite) {
      const beat = 0.5 + Math.sin(this._harvesterPulseSeconds * 2.45 + 1.2) * 0.5;
      this._listeningSpikeSite.glow.material.opacity = this._listeningSpikeCleared ? 0.08 + beat * 0.08 : 0.11 + beat * 0.16;
      this._listeningSpikeSite.triggerRing.material.opacity = this._listeningSpikeCleared ? 0 : 0.08 + beat * 0.12;
      this._listeningSpikeSite.areaRing.material.opacity = this._listeningSpikeCleared ? 0 : 0.04 + beat * 0.05;
      for (let i = 0; i < this._listeningSpikeSite.particles.length; i += 1) {
        const particle = this._listeningSpikeSite.particles[i];
        const drift = this._harvesterPulseSeconds * (0.93 + i * 0.12) + particle.phase;
        const loop = (this._harvesterPulseSeconds * (0.24 + i * 0.03) + i * 0.19) % 1;
        particle.sprite.position.x = LISTENING_SPIKE_POSITION.x + Math.cos(drift) * particle.radius;
        particle.sprite.position.z = LISTENING_SPIKE_POSITION.y + Math.sin(drift * 1.13) * particle.radius;
        particle.sprite.position.y = -0.72 + particle.lift + loop * 0.28;
        particle.sprite.material.opacity = this._listeningSpikeCleared ? 0.08 + beat * 0.08 : 0.12 + beat * 0.2;
      }
    }

    for (let i = 0; i < this._ashParticles.length; i += 1) {
      const particle = this._ashParticles[i];
      const driftT = this._ashTime + particle.phase;
      particle.sprite.position.x = particle.baseX + Math.sin(driftT * 0.8) * particle.driftX;
      particle.sprite.position.z = particle.baseZ + Math.cos(driftT * 0.7) * particle.driftZ;
      particle.sprite.position.y = -0.7 + ((particle.baseY + this._ashTime * particle.riseSpeed + particle.phase * 0.03) % 0.95);
      const pulse = 0.52 + Math.sin(driftT * 1.3) * 0.48;
      particle.sprite.material.opacity = 0.12 + pulse * 0.18;
    }
  }
}
