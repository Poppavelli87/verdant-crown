import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { REGIONS_BY_ID } from "../data/regions.js";
import { canTransition } from "../data/sceneGraph.js";
import { ArthurOpeningScene } from "./arthurOpeningScene.js";
import { EmberfallScene } from "./emberfallScene.js";
import { EndgameRouteSeedScene } from "./endgameRouteSeedScene.js";
import { HollowScarScene } from "./hollowScarScene.js";
import { InnerSpireLastDoorScene } from "./innerSpireLastDoorScene.js";
import { InnerSpireScene } from "./innerSpireScene.js";
import { LastSpireScene } from "./lastSpireScene.js";
import { MythicPrologueScene } from "./mythicPrologueScene.js";
import { Region4SeedScene } from "./region4SeedScene.js";
import { RidgePassScene } from "./ridgePassScene.js";
import { SpireAntechamberScene } from "./spireAntechamberScene.js";
import { SpireApproachScene } from "./spireApproachScene.js";
import { StartScreenScene } from "./startScreenScene.js";
import { ThornmereScene } from "./thornmereScene.js";
import { WindwardScene } from "./windwardScene.js";

const SCENE_CLASSES = {
  start: StartScreenScene,
  prologue: MythicPrologueScene,
  arthurOpening: ArthurOpeningScene,
  thornmere: ThornmereScene,
  hollowScar: HollowScarScene,
  emberfall: EmberfallScene,
  ridgepass: RidgePassScene,
  windward: WindwardScene,
  region4_seed: Region4SeedScene,
  endgame_route_seed: EndgameRouteSeedScene,
  spire_approach: SpireApproachScene,
  spire_antechamber: SpireAntechamberScene,
  inner_spire: InnerSpireScene,
  inner_spire_last_door: InnerSpireLastDoorScene,
  last_spire: LastSpireScene,
  // Compatibility alias while older flags/tests still refer to region3_seed.
  region3_seed: WindwardScene,
};

const PERSISTED_SCENES = new Set([
  "thornmere",
  "hollowScar",
  "emberfall",
  "ridgepass",
  "windward",
  "region4_seed",
  "endgame_route_seed",
  "spire_approach",
  "spire_antechamber",
  "inner_spire",
  "inner_spire_last_door",
  "last_spire",
]);
const FADE_TOTAL_SECONDS = 0.5;
const FADE_HALF_SECONDS = FADE_TOTAL_SECONDS / 2;

function normalizeSceneId(sceneId) {
  const raw = String(sceneId ?? "").trim();
  const lower = raw.toLowerCase();
  if (lower === "start" || lower === "title") return "start";
  if (lower === "prologue" || lower === "mythicprologue") return "prologue";
  if (lower === "arthuropening" || lower === "arthur_opening" || lower === "arthur-opening") return "arthurOpening";
  if (raw === "arthurOpening") return "arthurOpening";
  if (lower === "thornmere") return "thornmere";
  if (lower === "hollowscar" || lower === "hollow_scar" || lower === "hollow-scar") return "hollowScar";
  if (raw === "hollowScar") return "hollowScar";
  if (lower === "emberfall" || lower === "ember_fall" || lower === "ember-fall") return "emberfall";
  if (lower === "ridgepass" || lower === "ridge_pass" || lower === "ridge-pass") return "ridgepass";
  if (lower === "windward" || lower === "region3_windward" || lower === "region3-windward") return "windward";
  if (lower === "region3_seed" || lower === "region3-seed" || lower === "region3seed") return "windward";
  if (lower === "region4_seed" || lower === "region4-seed" || lower === "region4seed" || lower === "rootway") {
    return "region4_seed";
  }
  if (lower === "endgame_route_seed" || lower === "endgame-route-seed") {
    return "endgame_route_seed";
  }
  if (lower === "spire_approach" || lower === "spire-approach" || lower === "outer_spire") {
    return "spire_approach";
  }
  if (lower === "spire_antechamber" || lower === "spire-antechamber" || lower === "antechamber") {
    return "spire_antechamber";
  }
  if (lower === "inner_spire" || lower === "inner-spire" || lower === "innerspire") {
    return "inner_spire";
  }
  if (
    lower === "inner_spire_last_door" ||
    lower === "inner-spire-last-door" ||
    lower === "innerspirelastdoor" ||
    lower === "last_door"
  ) {
    return "inner_spire_last_door";
  }
  if (lower === "last_spire" || lower === "last-spire" || lower === "lastspire") {
    return "last_spire";
  }
  return null;
}

function isPersistedScene(sceneId) {
  return PERSISTED_SCENES.has(sceneId);
}

function createFadeOverlay() {
  const overlay = document.createElement("div");
  overlay.dataset.testid = "scene-fade";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.background = "#0a0a10";
  overlay.style.opacity = "0";
  overlay.style.zIndex = "15";
  document.body.appendChild(overlay);
  return overlay;
}

// SceneManager owns scene lifecycle, transition fades, and portal/NPC interactions.
export class SceneManager {
  constructor({ threeScene, saveState, rng }) {
    this.threeScene = threeScene;
    this.saveState = saveState;
    this.rng = rng;

    this.currentScene = null;
    this.currentSceneId = null;
    this.pendingPortalId = null;
    this.pendingNpcId = null;
    this.pendingNpcInteraction = null;
    this.fadeOverlay = createFadeOverlay();
    this.transition = null;
  }

  _createScene(sceneId) {
    const normalizedSceneId = normalizeSceneId(sceneId) ?? "thornmere";
    const SceneClass = SCENE_CLASSES[normalizedSceneId] ?? ThornmereScene;
    const scene = new SceneClass({
      threeScene: this.threeScene,
      rng: this.rng,
      saveState: this.saveState,
    });
    scene.id = normalizedSceneId;
    return scene;
  }

  _activateScene(scene, sceneId, reason = "load") {
    if (!scene) return;
    scene.ensureMounted?.();
    scene.init?.({
      manager: this,
      sceneId,
      reason,
    });
    scene.onEnter?.({
      manager: this,
      sceneId,
      reason,
    });
    scene.ensureMounted?.();
  }

  _resolveSafeSceneId(sceneId) {
    return normalizeSceneId(sceneId) ?? "thornmere";
  }

  _resolveSafePlayableSceneId(sceneId) {
    const normalized = normalizeSceneId(sceneId);
    if (normalized && isPersistedScene(normalized)) {
      return normalized;
    }
    return "thornmere";
  }

  _getSpawnPositionForScene(sceneId, fallbackPosition = null, { useSaved = true } = {}) {
    const safeSceneId = this._resolveSafeSceneId(sceneId);
    if (useSaved && isPersistedScene(safeSceneId)) {
      const saved = this.saveState.getPlayerPosition(safeSceneId);
      if (saved) return new THREE.Vector2(saved.x, saved.z);
    }
    if (fallbackPosition) return fallbackPosition.clone();
    const scene = this._createScene(safeSceneId);
    if (!scene) return new THREE.Vector2(0, 0);
    const spawn = scene.getSpawnPosition();
    scene.dispose();
    return spawn.clone();
  }

  _persistLastScene(sceneId) {
    if (!isPersistedScene(sceneId)) return;
    this.saveState.setLastSceneId(sceneId);
  }

  _handleStartSceneAction() {
    if (!this.currentScene || this.currentSceneId !== "start" || this.transition) return;
    const action = this.currentScene.consumeAction?.();
    if (!action) return;

    if (action === "new-game") {
      this.saveState.clear();
      this.saveState.setStoryFlag("title_seen", true);
      this.saveState.setFlag("story.title_seen", true);
      this.saveState.setStoryFlag("is_new_game", true);
      this.saveState.setFlag("story.is_new_game", true);
      this.requestTransition("prologue", { flow: "new-game" });
      return;
    }

    if (action === "continue") {
      this.saveState.setStoryFlag("title_seen", true);
      this.saveState.setFlag("story.title_seen", true);
      this.saveState.setStoryFlag("is_new_game", false);
      this.saveState.setFlag("story.is_new_game", false);
      const targetSceneId = this._resolveSafePlayableSceneId(this.saveState.getLastSceneId());
      this.requestTransition(targetSceneId, { flow: "continue" });
    }
  }

  _handlePrologueSceneAction() {
    if (!this.currentScene || this.currentSceneId !== "prologue" || this.transition) return;
    const action = this.currentScene.consumeAction?.();
    if (!action || action.type !== "prologue-complete") return;

    this.saveState.setStoryFlag("prologue_seen", true);
    this.saveState.setFlag("story.prologue_seen", true);
    const openingPlayed = Boolean(
      this.saveState.getStoryFlag?.("opening_played") ?? this.saveState.getFlag?.("story.opening_played")
    );
    const isNewGame = Boolean(this.saveState.getStoryFlag?.("is_new_game") ?? this.saveState.getFlag?.("story.is_new_game"));
    const targetScene = isNewGame && !openingPlayed ? "arthurOpening" : "thornmere";
    this.requestTransition(targetScene, {
      flow: "prologue-complete",
      reason: action.reason ?? "completed",
    });
  }

  loadInitialScene(_sceneId) {
    const initialSceneId = "start";
    this.currentScene = this._createScene(initialSceneId);
    this.currentSceneId = initialSceneId;
    this._activateScene(this.currentScene, this.currentSceneId, "initial");
    return this._getSpawnPositionForScene(initialSceneId, this.currentScene.getSpawnPosition(), { useSaved: false });
  }

  loadScene(sceneId) {
    return this.forceLoadScene(sceneId);
  }

  forceLoadScene(sceneId) {
    const safeSceneId = this._resolveSafeSceneId(sceneId);
    this.transition = null;
    this.pendingPortalId = null;
    this.pendingNpcId = null;
    this.pendingNpcInteraction = null;
    this.fadeOverlay.style.opacity = "0";

    if (this.currentScene) {
      this.currentScene.dispose();
    }
    this.currentScene = this._createScene(safeSceneId);
    this.currentSceneId = safeSceneId;
    this._activateScene(this.currentScene, this.currentSceneId, "force-load");
    this._persistLastScene(safeSceneId);
    return this._getSpawnPositionForScene(safeSceneId, this.currentScene.getSpawnPosition(), {
      useSaved: isPersistedScene(safeSceneId),
    });
  }

  isStartSceneActive() {
    return this.currentSceneId === "start";
  }

  isPrologueSceneActive() {
    return this.currentSceneId === "prologue";
  }

  // Backward-compatible alias used in older tests/hooks.
  isTitleSceneActive() {
    return this.isStartSceneActive();
  }

  hasBlockingUiScene() {
    return this.isStartSceneActive() || this.isPrologueSceneActive();
  }

  startTitle() {
    if (!this.currentScene || this.currentSceneId !== "start") return false;
    if (this.transition) return false;
    return Boolean(this.currentScene.requestStart?.());
  }

  handleSceneKeyDown(event) {
    return Boolean(this.currentScene?.handleKeyDown?.(event));
  }

  handleSceneKeyUp(event) {
    return Boolean(this.currentScene?.handleKeyUp?.(event));
  }

  handleScenePointerDown(event) {
    return Boolean(this.currentScene?.handlePointerDown?.(event));
  }

  handleScenePointerUp(event) {
    return Boolean(this.currentScene?.handlePointerUp?.(event));
  }

  handleScenePointerCancel(event) {
    return Boolean(this.currentScene?.handlePointerCancel?.(event));
  }

  debugPrologueNext() {
    return Boolean(this.currentScene?.debugNextSlide?.());
  }

  getSceneUiState() {
    return this.currentScene?.getUiState?.() ?? {};
  }

  getCurrentSceneInfo() {
    if (!this.currentScene) {
      return {
        sceneId: "thornmere",
        sceneName: "Thornmere",
        regionId: "verdant-wilds",
        regionName: "Verdant Wilds",
      };
    }
    const state = this.currentScene.getContextState();
    return {
      sceneId: state.sceneId,
      sceneName: state.sceneName,
      regionId: state.regionId,
      regionName: state.region,
    };
  }

  getSceneSpawnPosition(sceneId = this.currentSceneId, { useSaved = false } = {}) {
    const safeSceneId = this._resolveSafeSceneId(sceneId);
    const spawn = this._getSpawnPositionForScene(safeSceneId, null, { useSaved });
    return {
      x: spawn.x,
      z: spawn.y,
    };
  }

  getVisualConfig() {
    return this.currentScene?.getVisualConfig() ?? {
      skyTint: "#6b7280",
      lightTint: "#ffffff",
      groundTint: "#4f742b",
    };
  }

  getEnemySpawns() {
    return this.currentScene?.getEnemySpawns?.() ?? [];
  }

  getPulseSurgeSpawns(roles = []) {
    return this.currentScene?.getPulseSurgeSpawns?.(roles) ?? [];
  }

  getBossArenaConfig() {
    return this.currentScene?.getBossArenaConfig?.() ?? null;
  }

  getHarvesterSiteConfig() {
    return this.currentScene?.getHarvesterSiteConfig?.() ?? null;
  }

  getRidgeGateConfig() {
    return this.currentScene?.getRidgeGateConfig?.() ?? null;
  }

  getRootwayGateConfig() {
    return this.currentScene?.getRootwayGateConfig?.() ?? null;
  }

  getRootwayChapter9Config() {
    return this.currentScene?.getRootwayChapter9Config?.() ?? null;
  }

  getEndgameThirdSealConfig() {
    return this.currentScene?.getEndgameThirdSealConfig?.() ?? null;
  }

  getSpireBreachConfig() {
    return this.currentScene?.getSpireBreachConfig?.() ?? null;
  }

  getEndgameGateConfig() {
    return this.currentScene?.getEndgameGateConfig?.() ?? null;
  }

  getInnerSpireConfig() {
    return this.currentScene?.getInnerSpireConfig?.() ?? null;
  }

  getInnerSpireLastDoorConfig() {
    return this.currentScene?.getInnerSpireLastDoorConfig?.() ?? null;
  }

  getLastSpireConfig() {
    return this.currentScene?.getLastSpireConfig?.() ?? null;
  }

  getAshGateConfig() {
    return this.currentScene?.getAshGateConfig?.() ?? null;
  }

  getVaelorisFieldConfig() {
    return this.currentScene?.getVaelorisFieldConfig?.() ?? null;
  }

  getWillowEncounterConfig() {
    return this.currentScene?.getWillowEncounterConfig?.() ?? null;
  }

  getListeningSpikeSiteConfig() {
    return this.currentScene?.getListeningSpikeSiteConfig?.() ?? null;
  }

  getWaystoneCircleConfig() {
    return this.currentScene?.getWaystoneCircleConfig?.() ?? null;
  }

  getWindwardRelayConfig() {
    return this.currentScene?.getWindwardRelayConfig?.() ?? null;
  }

  setVaelorisExtractorDestroyed(destroyed) {
    this.currentScene?.setVaelorisExtractorDestroyed?.(destroyed);
  }

  isVaelorisExtractorDestroyed() {
    return Boolean(this.currentScene?.isVaelorisExtractorDestroyed?.());
  }

  getRegionBaselinePressure() {
    const regionId = this.currentScene?.regionId;
    const metadata = regionId ? REGIONS_BY_ID[regionId] : null;
    return typeof metadata?.baselinePressure === "number" ? metadata.baselinePressure : 0.35;
  }

  setFoliageMotionIntensity(intensity) {
    this.currentScene?.setFoliageMotionIntensity?.(intensity);
  }

  getPortals() {
    if (!this.currentScene?.getPortals) return [];
    return this.currentScene.getPortals().map((portal) => ({
      id: portal.id,
      targetSceneId: portal.targetSceneId,
      x: portal.position.x,
      z: portal.position.y,
      label: portal.label,
    }));
  }


  getCollisionAgents({ radiusPadding = 0 } = {}) {
    if (!this.currentScene?.getNpcs) return [];
    const padding = Math.max(0, Number(radiusPadding) || 0);
    return this.currentScene.getNpcs().map((npc) => ({
      id: `npc:${npc.id}`,
      x: npc.position.x,
      z: npc.position.y,
      radius: Math.max(0.2, npc.interactRadius * 0.6 + padding),
    }));
  }

  getNpcs() {
    if (!this.currentScene?.getNpcs) return [];
    return this.currentScene.getNpcs().map((npc) => npc.toSnapshot());
  }

  setNpcFocus(npcId) {
    this.currentScene?.setNpcFocus?.(npcId);
  }

  getNearestNpcInRange(playerPosition, range = 1.05) {
    if (!this.currentScene?.getNearestNpcInRange) return null;
    return this.currentScene.getNearestNpcInRange(playerPosition, range);
  }

  handleNpcTap(worldPoint, playerPosition) {
    if (!this.currentScene || this.transition || !this.currentScene.getNpcNearPoint) {
      return { consumed: false };
    }

    const npc = this.currentScene.getNpcNearPoint(worldPoint, 0.92);
    if (!npc) {
      this.pendingNpcId = null;
      return { consumed: false };
    }

    const distanceToPlayer = npc.distanceToPoint(playerPosition);
    if (distanceToPlayer <= npc.interactRadius) {
      this.pendingNpcId = null;
      const interaction = this.currentScene.interactNpcById(npc.id, {
        sceneId: this.currentSceneId,
        saveState: this.saveState,
      });
      return {
        consumed: true,
        npcId: npc.id,
        clearTarget: true,
        npcInteraction: interaction,
      };
    }

    this.pendingNpcId = npc.id;
    return {
      consumed: true,
      npcId: npc.id,
      target: npc.position.clone(),
    };
  }

  triggerNearbyNpcInteraction(playerPosition) {
    if (!this.currentScene || this.transition || !this.currentScene.getNearestNpcInRange) return null;
    const npc = this.currentScene.getNearestNpcInRange(playerPosition, 1.05);
    if (!npc) return null;

    this.pendingNpcId = null;
    return this.currentScene.interactNpcById(npc.id, {
      sceneId: this.currentSceneId,
      saveState: this.saveState,
    });
  }

  notifyStoryFlagChanged(flagKey, value) {
    this.currentScene?.onStoryFlagChanged?.(flagKey, value);
  }

  isTransitioning() {
    return Boolean(this.transition);
  }

  requestTransition(targetSceneId, metadata = null) {
    const safeTargetSceneId = this._resolveSafeSceneId(targetSceneId);
    if (!this.currentSceneId || !SCENE_CLASSES[safeTargetSceneId]) return false;
    if (this.transition) return false;
    if (!canTransition(this.currentSceneId, safeTargetSceneId)) return false;

    this.transition = {
      fromSceneId: this.currentSceneId,
      toSceneId: safeTargetSceneId,
      phase: "fadeOut",
      timer: 0,
      switched: false,
      metadata,
    };
    return true;
  }

  handlePortalTap(worldPoint, playerPosition) {
    if (!this.currentScene || this.transition || !this.currentScene.getPortalNearPoint) {
      return { consumed: false };
    }

    const portal = this.currentScene.getPortalNearPoint(worldPoint, 1.2);
    if (!portal) {
      this.pendingPortalId = null;
      return { consumed: false };
    }

    const distanceToPlayer = portal.position.distanceTo(playerPosition);
    if (distanceToPlayer <= portal.interactRadius) {
      this.pendingPortalId = null;
      this.requestTransition(portal.targetSceneId);
      return { consumed: true, clearTarget: true };
    }

    this.pendingPortalId = portal.id;
    return {
      consumed: true,
      target: portal.position.clone(),
    };
  }

  triggerNearbyPortal(playerPosition) {
    if (!this.currentScene || this.transition || !this.currentScene.getNearestPortalInRange) return false;
    const portal = this.currentScene.getNearestPortalInRange(playerPosition, 1.1);
    if (!portal) return false;
    this.pendingPortalId = null;
    return this.requestTransition(portal.targetSceneId);
  }

  update(dtSeconds, { playerPosition, onSceneWillChange, onSceneChanged }) {
    if (!this.currentScene) {
      return {
        combatForced: false,
        sceneName: "Thornmere",
        sceneId: "thornmere",
        regionId: "verdant-wilds",
        region: "Verdant Wilds",
        sceneToast: null,
        npcInteraction: null,
      };
    }

    this._handleStartSceneAction();
    this._handlePrologueSceneAction();

    if (!this.transition && this.pendingPortalId && this.currentScene.getPortalById) {
      const portal = this.currentScene.getPortalById(this.pendingPortalId);
      if (!portal) {
        this.pendingPortalId = null;
      } else if (portal.position.distanceTo(playerPosition) <= portal.interactRadius) {
        this.pendingPortalId = null;
        this.requestTransition(portal.targetSceneId);
      }
    }

    if (!this.transition && this.pendingNpcId && this.currentScene.getNpcById) {
      const npc = this.currentScene.getNpcById(this.pendingNpcId);
      if (!npc) {
        this.pendingNpcId = null;
      } else if (npc.distanceToPoint(playerPosition) <= npc.interactRadius) {
        this.pendingNpcInteraction = this.currentScene.interactNpcById(npc.id, {
          sceneId: this.currentSceneId,
          saveState: this.saveState,
        });
        this.pendingNpcId = null;
      }
    }

    if (this.transition) {
      if (this.transition.phase === "fadeOut") {
        this.transition.timer += dtSeconds;
        const t = Math.min(1, this.transition.timer / FADE_HALF_SECONDS);
        this.fadeOverlay.style.opacity = t.toFixed(3);
        if (this.transition.timer >= FADE_HALF_SECONDS) {
          if (!this.transition.switched) {
            onSceneWillChange?.(this.transition.fromSceneId, this.transition.toSceneId, this.transition.metadata);
            this.pendingNpcId = null;
            this.pendingNpcInteraction = null;
            this.currentScene.dispose();
            this.currentScene = this._createScene(this.transition.toSceneId);
            this.currentSceneId = this.transition.toSceneId;
            this._activateScene(this.currentScene, this.currentSceneId, "transition");
            this._persistLastScene(this.currentSceneId);
            this.transition.switched = true;
            const spawnPosition = this._getSpawnPositionForScene(
              this.currentSceneId,
              this.currentScene.getSpawnPosition(),
              { useSaved: isPersistedScene(this.currentSceneId) }
            );
            onSceneChanged?.(this.currentSceneId, spawnPosition, this.transition.metadata);
          }
          this.transition.phase = "fadeIn";
          this.transition.timer = FADE_HALF_SECONDS;
        }
      } else {
        this.transition.timer = Math.max(0, this.transition.timer - dtSeconds);
        const t = this.transition.timer / FADE_HALF_SECONDS;
        this.fadeOverlay.style.opacity = t.toFixed(3);
        if (this.transition.timer <= 0) {
          this.fadeOverlay.style.opacity = "0";
          this.transition = null;
        }
      }
    } else {
      this.fadeOverlay.style.opacity = "0";
    }

    this.currentScene.update(dtSeconds, { playerPosition });
    const npcInteraction = this.pendingNpcInteraction;
    this.pendingNpcInteraction = null;
    return {
      ...this.currentScene.getContextState(),
      npcInteraction,
    };
  }

  render({ camera, dtSeconds = 0, elapsedSeconds = 0 } = {}) {
    this.currentScene?.render({ camera, dtSeconds, elapsedSeconds });
  }

  dispose() {
    this.currentScene?.dispose();
    this.currentScene = null;
    this.currentSceneId = null;
    this.fadeOverlay.remove();
  }
}
