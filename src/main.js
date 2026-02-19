// Verdant Crown
// Web-based adaptive mythic RPG
// Internal Codename: Verdant Crown
// Working Title: Echoes of the Verdant Crown

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BossInstance } from "./boss/bossInstance.js";
import { BOSSES } from "./boss/bossRegistry.js";
import { CombatSystem } from "./combat/combatSystem.js";
import { DamageSystem } from "./combat/damageSystem.js";
import { STATUS_EFFECT_IDS, StatusEffectManager } from "./combat/statusEffects.js";
import { VEIN_GUARDIAN_ID } from "./combat/veinGuardian.js";
import { PacingDirector } from "./director/pacingDirector.js";
import { AudioBus } from "./audio/audioBus.js";
import { CHARACTER_SCALE, TILE_REPEAT_SCALE } from "./config/scale.js";
import { GAME_VERSION } from "./config/version.js";
import { REGIONS } from "./data/regions.js";
import { InputManager } from "./input/inputManager.js";
import { KeyboardInput } from "./input/keyboardInput.js";
import { TouchInput } from "./input/touchInput.js";
import { PartySystem } from "./party/partySystem.js";
import { getWillowAutoStanceBanter, planWillowAutoStance } from "./party/willowAutoPlanner.js";
import { BanterDirector, BANTER_FREQUENCY_VALUES } from "./party/banter.js";
import { GuidanceDirector } from "./party/guidance.js";
import { formatTacticsMode, PartyTactics } from "./party/tactics.js";
import {
  ACT2_FALLOUT_FLAG,
  RIDGE_GATE_UNLOCKED_FLAG,
  tryTriggerAct2Fallout,
} from "./story/act2Fallout.js";
import {
  CHAPTER2_ARRIVAL_LINES,
  CHAPTER2_ARRIVAL_TITLE,
  CHAPTER2_FLAGS,
  tryStartChapter2,
} from "./story/chapter2AshwindTrail.js";
import {
  LISTENING_SPIKE_CHOICE_VALUES,
  LISTENING_SPIKE_FLAGS,
  normalizeListeningSpikeChoice,
  resolveListeningSpikeChoiceOutcome,
  tryStartListeningSpikeSetpiece,
} from "./story/listeningSpikeSetpiece.js";
import {
  getObjectiveHudLine,
  getObjectiveHint,
  OBJECTIVE_IDS,
  normalizeObjectiveId,
  resolveCurrentObjective,
} from "./story/objectives.js";
import { validateStoryState } from "./story/storyIntegrity.js";
import { CHAPTER3_FLAGS, tryTriggerRowanDebrief } from "./story/rowanDebriefChapter3.js";
import { CHAPTER4_FLAGS, tryTriggerChapter4RowanReport } from "./story/chapter4RowanReport.js";
import { CHAPTER5_FLAGS, tryTriggerChapter5Aftershock } from "./story/chapter5Aftershock.js";
import {
  CHAPTER6_ARRIVAL_TITLE,
  CHAPTER6_FLAGS,
  tryTriggerChapter6Arrival,
} from "./story/chapter6ArrivalWindward.js";
import { tryStartRelaySetpiece } from "./story/chapter6RelaySetpiece.js";
import { tryTriggerWaystoneLore } from "./story/chapter6WaystoneLore.js";
import { CHAPTER8_FLAGS, tryTriggerChapter8Aftermath } from "./story/chapter8Aftermath.js";
import { tryStartRetaliationSetpiece } from "./story/chapter8RetaliationSetpiece.js";
import { CHAPTER9_FLAGS, tryTriggerChapter9Start } from "./story/chapter9Start.js";
import { playChapter9LoreVision } from "./story/chapter9LoreVision.js";
import { ENDGAME_ACT1_FLAGS, tryStartEndgameAct1 } from "./story/endgameAct1Start.js";
import { tryStartSpireBreach } from "./story/endgameSpireBreachSetpiece.js";
import {
  applyRiftAnchorStabilized,
  isRiftCrossingActive,
  tryStartRiftCrossing,
  updateRiftCrossing,
} from "./story/endgameAct3Setpieces.js";
import { playEndingRewrite, playEndingSeal } from "./story/endings.js";
import { playEndgameAct2Lore } from "./story/endgameAct2LoreVision.js";
import { playEndgameAct3LoreVision } from "./story/endgameAct3LoreVision.js";
import {
  CURRENT_OBJECTIVE_FLAG,
  EMBERFALL_LEAD_UNLOCKED_FLAG,
  ROWAN_COUNCIL_FLAG,
  tryTriggerRowanCouncil,
} from "./story/rowanCouncilEvent.js";
import { tryTriggerWillowMeet } from "./story/willowMeetEvent.js";
import { formatWillowStanceLabel, WillowStanceState } from "./party/willowStance.js";
import {
  getWillowSpell,
  getWillowSpellKeys,
  getWillowSpellSet,
  normalizeWillowSpellKey,
  normalizeWillowStance,
} from "./party/willowSpells.js";
import { PlayerController } from "./player/playerController.js";
import { PlayerState } from "./player/playerState.js";
import { resolveDepthOrder } from "./render/billboard.js";
import {
  createWeaponFallbackTexture,
  getWeaponGlow,
  getWeaponOffset,
  getWeaponSprite,
  getWillowGemColor,
} from "./render/weaponAttachment.js";
import {
  applyVisuals,
  composeVisualConfig,
  getBaselineVisuals,
  getDynamicVisualModifiers,
} from "./render/sceneVisuals.js";
import { VfxSystem } from "./render/vfx.js";
import { SpriteAnimator, resolveDirectionFromVector } from "./render/spriteAnimator.js";
import { SaveState } from "./save/saveState.js";
import { SceneManager } from "./scenes/sceneManager.js";
import { createDialogueBox } from "./ui/dialogueBox.js";
import { createHud } from "./ui/hud.js";
import { createPartyChat } from "./ui/partyChat.js";
import { nextFloat, nextInt, setSeed } from "./util/rng.js";
import { VerdantAnomalySystem } from "./world/anomalies.js";
import { WorldEventRunner } from "./world/events.js";
import { ShrineSystem } from "./world/shrine.js";
import {
  clearThreatVeinsCompletionFlags,
  debugSpawnVeinNearPlayer,
  disposeThreatVeins,
  getThreatVeins,
  initThreatVeinsForScene,
  onVeinComplete,
  onVeinFail,
  setThreatVeinActivationBias,
  updateThreatVeins,
} from "./world/threatVeins.js";
import { CrownMoodState } from "./world/crownMood.js";
import { createMemoryPressureTracker } from "./world/memoryPressure.js";
import {
  canStartResonanceLock,
  completeResonanceLock,
  destroyResonanceEchoNode,
  getResonanceChannelState,
  getResonanceLockCountRemaining,
  getResonanceLocks,
  initResonanceLocks,
  isNearResonanceLock,
  startResonanceLockChannel,
  updateResonanceLocks,
} from "./world/resonanceLocks.js";
import { WorldState } from "./world/worldState.js";
import { VAELORIS_PATROL_FLAGS, VaelorisPressureSystem } from "./world/vaelorisPressure.js";

const DEFAULT_RNG_SEED = 1337;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_INVULN_WINDOW_MS = 350;
const PLAYER_SPRITE_FRAME_WIDTH = 48;
const PLAYER_SPRITE_FRAME_HEIGHT = 64;
const PLAYER_SPRITE_WORLD_WIDTH = 2.4;
const PLAYER_SPRITE_WORLD_HEIGHT = 3.2;
const MOBILE_AUTO_ATTACK_RANGE = 1.2;
const ELAINE_AUTO_ATTACK_RANGE = 3.1;
const ELAINE_BOLT_TARGET_RANGE = 3.25;
const ELAINE_BOLT_FRONT_DOT = 0.06;
const ELAINE_BASIC_BOLT_COOLDOWN = 0.72;
const ELAINE_CHARGED_BOLT_COOLDOWN = 1.08;
const ELAINE_CHARGED_BOLT_DAMAGE_MULTIPLIER = 1.7;
const ELAINE_BOLT_CAST_FLASH_SECONDS = 0.2;
const CAMERA_FOLLOW_SHARPNESS = 9.5;
const CAMERA_HEIGHT = 5.1;
const CAMERA_DISTANCE = 5.4;
const CAMERA_LOOK_Y = -0.24;
const CAMERA_VEIN_ZOOM_EASE_SECONDS = 0.5;
const CAMERA_WAVE_SHAKE_WORLD_MAX = 0.018;
const CAMERA_HIT_NUDGE_WORLD = 0.035;
const CAMERA_ATTACK_NUDGE_WORLD = 0.02;
const AMBIENT_MOTE_COUNT = 14;
const HOLLOWSCAR_PULSE_EVENT_ID = "hollowscar_pulse";
const CLASSIC_INTRO_TEXT_MESSAGE = "The wind carries something older than memory.";
const THORNMERE_MORNING_MESSAGE = "Thornmere. Morning.";
const PLAYER_HIT_FLASH_SECONDS = 0.1;
const PLAYER_HIT_TINT_SECONDS = 0.15;
const PLAYER_KNOCKBACK_DAMPING = 8.4;
const PLAYER_HIT_KNOCKBACK = 1.25;
const PLAYER_HIT_FLASH_COLOR = new THREE.Color("#ff9696");
const SAFE_SPOT_UPDATE_SECONDS = 0.8;
const RESPAWN_INVULN_SECONDS = 0.6;
const MAP_REFRESH_WATCHDOG_SECONDS = 3;
const OPENING_SCENE_ID = "arthurOpening";
const FIRST_VEIN_COMPLETION_FLAG = "vein_completed_hollowScar_hollowscar-corridor-vein";
const CROWN_MANIFESTATION_BOSS_ID = BOSSES.crown_manifestation?.id ?? "crown_manifestation";
const HARVESTER_WARDEN_BOSS_ID = BOSSES.harvester_warden?.id ?? "harvester_warden";
const NULL_ARCHIVIST_BOSS_ID = BOSSES.null_archivist?.id ?? "null_archivist";
const SPIRE_GATEWARDEN_BOSS_ID = BOSSES.spire_gatewarden?.id ?? "spire_gatewarden";
const LOOM_PROCTOR_BOSS_ID = BOSSES.loom_proctor?.id ?? "loom_proctor";
const NARRATOR_CROWN_BOSS_ID = BOSSES.narrator_crown?.id ?? "narrator_crown";
const GUARDIAN_TRIGGER_CENTER = new THREE.Vector2(0, 0);
const GUARDIAN_TRIGGER_RADIUS = 1.35;
const GUARDIAN_CALM_AWARENESS_DELTA = 0.06;
const GUARDIAN_STABILITY_BUMP = 0.05;
const OPENING_DIALOGUE_LINES = Object.freeze([
  "That wasn't here yesterday...",
  "Why does it feel louder?",
]);
const ELAINE_INTRO_LINES = Object.freeze([
  "Elaine: You felt it too, didn't you?",
  "Elaine: The pulse.",
  "Elaine: Vaeloris thinks it can measure this.",
  "Elaine: They're wrong.",
  "Arthur: You know about the Scar?",
  "Elaine: I know enough to know it won't stay quiet.",
  "Elaine: And neither should we.",
]);
const VAELORIS_DIALOGUE_LINES = Object.freeze([
  "Elaine: That's Vaeloris tech.",
  "Elaine: They're tapping the vein directly.",
  "Arthur: They'll break it.",
  "Elaine: Or they'll stabilize it in their own way.",
]);
const VAELORIS_CHOICE_VALUES = Object.freeze({
  NONE: "",
  DISABLE: "disable",
  LEAVE: "leave",
});
const VAELORIS_FIELD_TRIGGER_FLAG = "vaeloris_field_triggered";
const VAELORIS_HARVESTER_ACTIVE_FLAG = "vaeloris_harvester_active";
const VAELORIS_HARVESTER_DEFEATED_FLAG = "vaeloris_harvester_defeated";
const VAELORIS_HARVESTER_CHOICE_FLAG = "vaeloris_harvester_choice";
const VAELORIS_PRESSURE_STAGE_FLAG = "vaeloris_pressure_stage";
const VAELORIS_PATROL_COOLDOWN_TOAST_SECONDS = 1.4;
const VAELORIS_ACTIVE_PRESSURE_DELTA = 0.018;
const VAELORIS_LEAVE_PRESSURE_DELTA = 0.011;
const VAELORIS_DISABLE_ANOMALY_BIAS = -0.018;
const VAELORIS_LEAVE_ANOMALY_BIAS = 0.024;
const VAELORIS_DISABLE_VEIN_BIAS = -0.035;
const VAELORIS_LEAVE_VEIN_BIAS = 0.055;
const VAELORIS_STAGE2_ANOMALY_BIAS = 0.008;
const VAELORIS_STAGE2_VEIN_BIAS = 0.012;
const VAELORIS_STAGE2_PRESSURE_DELTA = 0.004;
const HARVESTER_CHOICE_VALUES = Object.freeze({
  NONE: "",
  SHATTER: "shatter",
  SALVAGE: "salvage",
});
const CHAPTER2_ARRIVAL_LOCK_SECONDS = 0.8;
const CHAPTER2_WILLOW_MEET_LOCK_SECONDS = 1;
const CHAPTER2_AMBUSH_BOUNDS_TOAST_SECONDS = 1.15;
const CHAPTER2_AMBUSH_BOUNDS_COOLDOWN_SECONDS = 1.1;
const CHAPTER3_DEBRIEF_LOCK_SECONDS = 1;
const CHAPTER4_ROWAN_REPORT_LOCK_SECONDS = 1;
const CHAPTER5_AFTERSHOCK_LOCK_SECONDS = 1;
const CHAPTER6_ARRIVAL_LOCK_SECONDS = 0.8;
const CHAPTER6_WAYSTONE_LOCK_SECONDS = 1;
const CHAPTER8_AFTERMATH_LOCK_SECONDS = 1;
const LISTENING_SPIKE_BOUNDS_TOAST_SECONDS = 1.15;
const LISTENING_SPIKE_BOUNDS_COOLDOWN_SECONDS = 1.1;
const WINDWARD_RELAY_BOUNDS_TOAST_SECONDS = 1.15;
const WINDWARD_RELAY_BOUNDS_COOLDOWN_SECONDS = 1.1;
const RIDGE_GATE_SEALED_MESSAGE = "The ridge is sealed.";
const RIDGE_SCOUTS_BLOCK_MESSAGE = "Scouts still prowl the ridge road.";
const ROOTWAY_GATE_SEALED_MESSAGE = "The roots are knotted shut.";
const ROOTWAY_GATE_BLOCKED_MESSAGE = "The roots are still choking. Clear the spikes.";
const RIDGE_GATE_UNLOCK_TOAST_SECONDS = 1.6;
const RIDGE_PATROL_BOUNDS_TOAST_SECONDS = 1.15;
const RIDGE_PATROL_BOUNDS_COOLDOWN_SECONDS = 1.1;
const CHAPTER8_RETALIATION_BOUNDS_TOAST_SECONDS = 1.15;
const CHAPTER8_RETALIATION_BOUNDS_COOLDOWN_SECONDS = 1.1;
const CHAPTER8_RETALIATION_SPIKE_INTERACT_RADIUS = 1.15;
const CHAPTER8_RETALIATION_SPIKE_DAMAGE = 16;
const CHAPTER8_SILENCE_GRACE_SECONDS = 0.5;
const CHAPTER9_TITLE_LOCK_SECONDS = 0.9;
const CHAPTER9_ANCHOR_ATTUNE_SECONDS = 1.5;
const CHAPTER9_ANCHOR_RETRY_COOLDOWN_SECONDS = 3;
const CHAPTER9_SUNDER_FILL_PER_SECOND = 0.11;
const CHAPTER9_SUNDER_FILL_BOSS_MULTIPLIER = 0.58;
const CHAPTER9_SUNDER_WAVE_RESET_VALUE = 0.55;
const CHAPTER9_SUNDER_WAVE_DAMAGE = 14;
const CHAPTER9_SUNDER_WAVE_KNOCK = 1.32;
const CHAPTER9_FAIL_WAVE_LIMIT = 3;
const CHAPTER9_ANCHOR_METER_DROP = 0.3;
const CHAPTER9_ANCHOR_FILL_SLOW_SECONDS = 4;
const CHAPTER9_ANCHOR_FILL_SLOW_MULTIPLIER = 0.62;
const CHAPTER9_ANCHOR_INTERACT_RADIUS = 1.06;
const CHAPTER9_ECHO_NODE_INTERACT_RADIUS = 1.08;
const CHAPTER9_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const CHAPTER9_NULL_FIELD_SECONDS = 6.2;
const CHAPTER9_MEMORY_COLLAPSE_DAMAGE = 22;
const CHAPTER9_MEMORY_COLLAPSE_RADIUS = 1.2;
const CHAPTER9_ENDGAME_GOAL_ID = "STOP_THE_LAST_SPIRE";
const CHAPTER9_CHOICE_SEAL = "seal";
const CHAPTER9_CHOICE_TAKE_KEY = "take_key";
const ENDGAME_ENDING_SEAL = "seal";
const ENDGAME_ENDING_REWRITE = "rewrite";
const ENDGAME_ACT2_FLAGS = Object.freeze({
  STARTED: "endgame_act2_started",
  INNER_SPIRE_ENTERED: "endgame_inner_spire_entered",
  RESONANCE_LOCK_1: "endgame_resonance_lock_1",
  RESONANCE_LOCK_2: "endgame_resonance_lock_2",
  RESONANCE_LOCK_3: "endgame_resonance_lock_3",
  LOOM_PROCTOR_DEFEATED: "endgame_loom_proctor_defeated",
  ACT3_UNLOCKED: "endgame_act3_unlocked",
  LAST_DOOR_SEEN: "endgame_last_door_seen",
  LOOM_PROCTOR_ACTIVE: "endgame_loom_proctor_active",
});
const ENDGAME_ACT3_FLAGS = Object.freeze({
  STARTED: "endgame_act3_started",
  LAST_DOOR_OPENED: "endgame_last_door_opened",
  LAST_SPIRE_ENTERED: "endgame_last_spire_entered",
  SETPIECE_RIFT_CROSSED: "endgame_setpiece_rift_crossed",
  SETPIECE_CORE_REACHED: "endgame_setpiece_core_reached",
  FINAL_BOSS_DEFEATED: "endgame_final_boss_defeated",
  CHOICE_MADE: "endgame_choice_made",
  ENDING: "endgame_ending",
  CREDITS_SEEN: "endgame_credits_seen",
  NGPLUS_UNLOCKED: "ngplus_unlocked",
  NARRATOR_ACTIVE: "endgame_narrator_crown_active",
});
const ENDGAME_ACT1_LOCK_SECONDS = 0.9;
const ENDGAME_ACT2_LOCK_SECONDS = 0.85;
const ENDGAME_ACT3_LOCK_SECONDS = 0.85;
const THIRD_SEAL_ATTUNE_SECONDS = 1.5;
const THIRD_SEAL_RETRY_COOLDOWN_SECONDS = 3;
const THIRD_SEAL_INTERACT_RADIUS = 1.02;
const BREACH_FILL_PER_SECOND = 0.092;
const BREACH_WAVE_RESET_VALUE = 0.6;
const BREACH_WAVE_DAMAGE = 11;
const BREACH_WAVE_KNOCK = 1.08;
const BREACH_NODE_INTERACT_RADIUS = 1.02;
const BREACH_NODE_METER_DROP = 0.25;
const BREACH_FILL_SLOW_SECONDS = 4;
const BREACH_FILL_SLOW_MULTIPLIER = 0.62;
const BREACH_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const GATEWARDEN_OVERLOAD_DAMAGE = 18;
const GATEWARDEN_OVERLOAD_RADIUS = 1.35;
const GATEWARDEN_PILLAR_SAFE_RADIUS = 0.78;
const GATEWARDEN_NULL_CLAMP_SECONDS = 6;
const GATEWARDEN_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const MEMORY_PRESSURE_FILL_PER_SECOND = 0.064;
const MEMORY_PRESSURE_RELIEF = 0.25;
const MEMORY_PRESSURE_SLOW_SECONDS = 4;
const MEMORY_PRESSURE_SLOWED_MULTIPLIER = 0.62;
const MEMORY_PRESSURE_THRESHOLDS = Object.freeze([0.33, 0.66]);
const RESONANCE_LOCK_CHANNEL_SECONDS = 1.5;
const RESONANCE_LOCK_RETRY_COOLDOWN_SECONDS = 3;
const RESONANCE_LOCK_INTERACT_RADIUS = 1.02;
const RESONANCE_LOCK_CHANNEL_BREAK_BUFFER = 0.24;
const RESONANCE_LOCK_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const LOOM_PROCTOR_WEAVE_CUT_DAMAGE = 15;
const LOOM_PROCTOR_WEAVE_CUT_RADIUS = 0.62;
const LOOM_PROCTOR_WEAVE_CUT_FISSURE_SECONDS = 6;
const LOOM_PROCTOR_PRISM_PHASE_THRESHOLD_P2 = 0.7;
const LOOM_PROCTOR_PRISM_PHASE_THRESHOLD_P3 = 0.35;
const LOOM_PROCTOR_MEMORY_TAX_SECONDS = 6;
const LOOM_PROCTOR_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const LOOM_PROCTOR_WEAVE_TELL_SECONDS = 0.78;
const LOOM_PROCTOR_PRISM_PILLAR_HP = 54;
const LOOM_PROCTOR_PRISM_PILLAR_HIT_DAMAGE = 27;
const LOOM_PROCTOR_MEMORY_TAX_INTERVAL = 5.8;
const LOOM_PROCTOR_WEAVE_CUT_INTERVAL = 4.3;
const LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL = 5.1;
const LOOM_PROCTOR_PHASE2_WEAVE_INTERVAL = 4.4;
const LOOM_PROCTOR_PHASE3_WEAVE_INTERVAL = 3.6;
const LOOM_PROCTOR_PILLAR_INTERACT_RADIUS = 1.05;
const LOOM_PROCTOR_LAST_DOOR_TOAST_SECONDS = 1.55;
const LAST_DOOR_OPEN_TOAST_SECONDS = 1.35;
const RIFT_STABILITY_START = 0.7;
const RIFT_STABILITY_RESET = 0.4;
const RIFT_STABILITY_DECAY_PER_SECOND = 0.075;
const RIFT_ANCHOR_STABILITY_GAIN = 0.28;
const RIFT_ANCHOR_CHANNEL_SECONDS = 1;
const RIFT_ANCHOR_RETRY_COOLDOWN_SECONDS = 3;
const RIFT_ANCHOR_INTERACT_RADIUS = 1.02;
const RIFT_SHOCKWAVE_DAMAGE = 10;
const RIFT_SHOCKWAVE_KNOCK = 1.1;
const RIFT_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const CORE_CLAMP_INTERACT_RADIUS = 1.05;
const CORE_CLAMP_CHANNEL_SECONDS = 1.5;
const CORE_CLAMP_RETRY_COOLDOWN_SECONDS = 3;
const CORE_ENGINE_PULSE_DAMAGE = 18;
const CORE_ENGINE_PULSE_RADIUS = 1.34;
const CORE_ENGINE_PULSE_SAFE_RADIUS = 0.8;
const CORE_ENGINE_PULSE_INTERVAL = 10;
const CORE_ENGINE_PULSE_TELEGRAPH_SECONDS = 1.1;
const CORE_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const NARRATOR_LINE_DAMAGE = 16;
const NARRATOR_LINE_RADIUS = 0.62;
const NARRATOR_LINE_TELL_SECONDS = 0.72;
const NARRATOR_LINE_INTERVAL_P1 = 4.6;
const NARRATOR_LINE_INTERVAL_P2 = 3.8;
const NARRATOR_LINE_INTERVAL_P3 = 2.9;
const NARRATOR_SHOCKWAVE_DAMAGE = 20;
const NARRATOR_SHOCKWAVE_SAFE_INNER = 0.94;
const NARRATOR_SHOCKWAVE_SAFE_OUTER = 1.9;
const NARRATOR_SHOCKWAVE_TELL_SECONDS = 1.15;
const NARRATOR_SHOCKWAVE_INTERVAL_P2 = 7.2;
const NARRATOR_SHOCKWAVE_INTERVAL_P3 = 6.1;
const NARRATOR_REWRITE_MARK_SECONDS = 6;
const NARRATOR_REWRITE_MARK_INTERVAL = 5.7;
const NARRATOR_SHORT_CALLOUT_COOLDOWN_SECONDS = 20;
const PARTY_BLEEDOUT_SECONDS = 10;
const PARTY_BANTER_IDLE_SECONDS = 6;
const PARTY_BANTER_COOLDOWN_SECONDS = 20;
const PARTY_BANTER_OFFTRACK_SECONDS = 10;
const PARTY_BANTER_PROGRESS_EPSILON = 0.02;
const CROWN_MOOD_VEIN_COMPLETED_DELTA = 5;
const CROWN_MOOD_VEIN_FAILED_DELTA = -3;
const CROWN_MOOD_GUARDIAN_DEFEATED_DELTA = 8;
const CROWN_MOOD_PARTY_WIPE_DELTA = -4;
const CROWN_MOOD_EXTRACTOR_DISABLED_DELTA = 3;
const CROWN_MOOD_EXTRACTOR_LEFT_DELTA = -5;
const CROWN_MOOD_HARVESTER_SHATTER_DELTA = 6;
const CROWN_MOOD_HARVESTER_SALVAGE_DELTA = -6;
const CROWN_MOOD_LISTENING_SPIKE_CRUSH_DELTA = 4;
const CROWN_MOOD_LISTENING_SPIKE_POCKET_DELTA = -4;
const CHAPTER7_CHOIR_ENGINE_DEFEATED_FLAG = "chapter7_choir_engine_defeated";
const CHAPTER7_CONVERGENCE_CHOICE_FLAG = "chapter7_convergence_choice";
const ARTHUR_AI_INTERCEPT_RADIUS = 1.45;
const ARTHUR_AI_LIGHT_RANGE = 1.3;
const ARTHUR_AI_CHARGE_RANGE = 2.25;
const ARTHUR_AI_LIGHT_COOLDOWN = 0.38;
const ARTHUR_AI_CHARGE_COOLDOWN = 0.56;
const ELAINE_MAX_HEALTH = 70;
const ELAINE_MP_MAX = 100;
const ELAINE_MP_REGEN_PER_SECOND = 10;
const WILLOW_MP_MAX = 100;
const WILLOW_MP_REGEN_PER_SECOND = 6;
const WILLOW_STANCE_COOLDOWN_MS = 60000;
const WILLOW_MANUAL_LOCK_MS = 300000;
const WILLOW_AUTO_BANTER_COOLDOWN_SECONDS = 7;
const WILLOW_GEM_PULSE_SPEED = 7.2;
const WILLOW_GEM_PULSE_MIN = 0.16;
const WILLOW_GEM_PULSE_MAX = 0.58;
const WILLOW_BOLT_LIGHT_DAMAGE = 6;
const WILLOW_BOLT_CHARGED_DAMAGE = 9;
const STATUS_ENTITY_IDS = Object.freeze({
  ARTHUR: "arthur",
  ELAINE: "elaine",
  WILLOW: "willow",
  TARGET: "target",
});
const WILLOW_DEBUFF_TO_EFFECT_ID = Object.freeze({
  ignite: STATUS_EFFECT_IDS.IGNITE_MARK,
  wither: STATUS_EFFECT_IDS.WITHER_MARK,
  focus: STATUS_EFFECT_IDS.FOCUS_MARK,
});
const EFFECT_ID_TO_LEGACY_WILLOW = Object.freeze({
  [STATUS_EFFECT_IDS.IGNITE_MARK]: "ignite",
  [STATUS_EFFECT_IDS.WITHER_MARK]: "wither",
  [STATUS_EFFECT_IDS.FOCUS_MARK]: "focus",
});

const ELAINE_SPELLS = Object.freeze({
  singleHeal: Object.freeze({
    id: "singleHeal",
    key: "u",
    mpCost: 18,
    castSeconds: 1.5,
    cooldownSeconds: 4.5,
    interruptCooldownSeconds: 3,
    healAmount: 38,
    rooted: true,
  }),
  groupHeal: Object.freeze({
    id: "groupHeal",
    key: "i",
    mpCost: 34,
    castSeconds: 0,
    cooldownSeconds: 14,
    healAmount: 24,
    rooted: false,
  }),
  blessing: Object.freeze({
    id: "blessing",
    key: "o",
    mpCost: 26,
    castSeconds: 0,
    cooldownSeconds: 60,
    buffSeconds: 60,
    rooted: false,
  }),
  resurrect: Object.freeze({
    id: "resurrect",
    key: "p",
    mpCost: 45,
    castSeconds: 2,
    cooldownSeconds: 16,
    interruptCooldownSeconds: 5,
    rooted: true,
    reviveHealthRatio: 0.5,
  }),
});

const PLAYER_UPGRADE_DEFAULTS = Object.freeze({
  maxHpLevel: 0,
  chargeSpeedLevel: 0,
  moveSpeedLevel: 0,
  relicAttunementLevel: 0,
});

const ATTACK_SWING_PROFILES = Object.freeze({
  light: Object.freeze({
    windupSeconds: 0.05,
    activeSeconds: 0.12,
    recoverySeconds: 0.15,
    travelRadians: 1.9,
    followThroughRadians: 0.22,
    scale: 0.76,
  }),
  charge: Object.freeze({
    windupSeconds: 0.08,
    activeSeconds: 0.18,
    recoverySeconds: 0.26,
    travelRadians: 2.9,
    followThroughRadians: 0.44,
    scale: 0.9,
  }),
});
const PLAYABLE_SCENE_IDS = new Set([
  "thornmere",
  "hollowScar",
  "emberfall",
  "ridgepass",
  "region3_seed",
  "windward",
  "region4_seed",
  "spire_approach",
  "spire_antechamber",
  "inner_spire",
  "inner_spire_last_door",
  "last_spire",
]);
const EMBERFALL_TILE_ASSETS = Object.freeze([
  "./assets/sprites/terrain/emberfall_tile_a.png",
  "./assets/sprites/terrain/emberfall_tile_b.png",
  "./assets/sprites/terrain/emberfall_tile_c.png",
]);
const WINDWARD_TILE_ASSETS = Object.freeze([
  "./assets/sprites/terrain/windward_tile_0.png",
  "./assets/sprites/terrain/windward_tile_1.png",
]);
const ROOTWAY_TILE_ASSETS = Object.freeze([
  "./assets/sprites/terrain/rootway_tile_0.png",
]);
const INNER_SPIRE_TILE_ASSETS = Object.freeze([
  "./assets/sprites/terrain/inner_spire_tile.png",
  "./assets/sprites/terrain/inner_spire_tile_b.png",
]);
const LAST_SPIRE_TILE_ASSETS = Object.freeze([
  "./assets/sprites/terrain/last_spire_tile_0.png",
  "./assets/sprites/terrain/last_spire_tile_1.png",
]);
const DEV_MODE = location.hostname === "127.0.0.1" || location.hostname === "localhost";
const AUTOMATED_TEST_MODE = typeof navigator !== "undefined" && Boolean(navigator.webdriver);
let currentRngSeed = DEFAULT_RNG_SEED;
const PRIMARY_ATTACK_PROFILES = Object.freeze({
  arthur: "melee",
  elaine: "ranged",
  willow: "ranged",
});

function resolvePlayerUpgrades(rawValue) {
  return {
    ...PLAYER_UPGRADE_DEFAULTS,
    ...(rawValue ?? {}),
  };
}

setSeed(DEFAULT_RNG_SEED);

const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";

const scene = new THREE.Scene();
scene.background = new THREE.Color("#8a9f8b");
scene.fog = new THREE.FogExp2(new THREE.Color("#8a9f8b"), 0.006);
const groundBaseColor = "#6a9354";
const cameraFollowTarget = new THREE.Vector3();
const cameraDesiredTarget = new THREE.Vector3();
const cameraDesiredPosition = new THREE.Vector3();
const cameraShakeOffset = new THREE.Vector3();
const cameraLookOffset = new THREE.Vector3();
const cameraWaveShakeOffset = new THREE.Vector2(0, 0);
const cameraHitNudgeOffset = new THREE.Vector2(0, 0);
const cameraAttackNudgeOffset = new THREE.Vector2(0, 0);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
camera.lookAt(0, CAMERA_LOOK_Y, 0);

const ambientLight = new THREE.AmbientLight("#a9bead", 0.84);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("#f4d9b2", 1.02);
directionalLight.position.set(4, 8, 2);
scene.add(directionalLight);

const groundMaterial = new THREE.MeshBasicMaterial({
  map: createTerrainTileTexture("thornmere"),
  color: "#6a9354",
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), groundMaterial);
ground.name = "ground";
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.9;
scene.add(ground);

let mapDirty = true;
let mapRefreshGeneration = 0;
let lastMapRenderTimeSeconds = 0;
let lastAutoRefreshSceneId = "";
let lastAutoRefreshVeinBarrierActive = false;
let lastAutoRefreshBossBarrierActive = false;
const terrainTileImageCache = new Map();
const terrainTilePending = new Set();

function ensureGroundMounted() {
  const foundGround = scene.getObjectByName("ground");
  if (!foundGround) {
    scene.add(ground);
  } else if (foundGround !== ground) {
    foundGround.name = "ground";
  }
  ground.visible = true;
}

function markMapDirty() {
  mapDirty = true;
}

function rebuildMapRender({ regenerateTexture = false } = {}) {
  ensureGroundMounted();
  const terrainSceneId = currentSceneInfo?.sceneId ?? "thornmere";
  const terrainFamily =
    terrainSceneId === "emberfall"
      ? "emberfall"
      : terrainSceneId === "windward"
        ? "windward"
        : terrainSceneId === "region4_seed"
          ? "rootway"
          : terrainSceneId === "last_spire"
            ? "last_spire"
          : terrainSceneId === "inner_spire" || terrainSceneId === "inner_spire_last_door"
            ? "inner_spire"
          : "verdant";

  if (regenerateTexture || !groundMaterial.map) {
    const previous = groundMaterial.map;
    const nextTexture = createTerrainTileTexture(terrainSceneId);
    nextTexture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
    groundMaterial.map = nextTexture;
    if (previous && previous !== nextTexture) {
      previous.dispose?.();
    }
  } else {
    const mapFamily = groundMaterial.map?.userData?.terrainFamily ?? "";
    if (mapFamily !== terrainFamily) {
      const previous = groundMaterial.map;
      const nextTexture = createTerrainTileTexture(terrainSceneId);
      nextTexture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
      groundMaterial.map = nextTexture;
      if (previous && previous !== nextTexture) {
        previous.dispose?.();
      }
    }
    groundMaterial.map.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
    groundMaterial.map.needsUpdate = true;
  }

  groundMaterial.needsUpdate = true;
  ground.visible = true;
  mapDirty = false;
  mapRefreshGeneration += 1;
  lastMapRenderTimeSeconds = world?.elapsedSeconds ?? 0;
}

function applyPixelArtTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGrassVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const basePalettes = [
    ["#6a9650", "#6f9e54", "#628d4a", "#739f58", "#5d8747"],
    ["#6f9b53", "#78a65a", "#668f4d", "#7aa95f", "#5f8848"],
    ["#66924e", "#709a54", "#60874a", "#739f58", "#5b8246"],
  ];
  const palette = basePalettes[variantIndex % basePalettes.length];

  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const cell = ((x >> 1) * (5 + variantIndex) + (y >> 1) * (7 + variantIndex * 2) + variantIndex * 3) % palette.length;
      ctx.fillStyle = palette[cell];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = variantIndex === 1 ? "rgba(157, 206, 124, 0.2)" : "rgba(147, 194, 117, 0.18)";
  for (let y = variantIndex; y < tileSize; y += 4) {
    for (let x = (y + variantIndex * 2) % 6; x < tileSize; x += 6) {
      ctx.fillRect(x, y, 1, 2);
    }
  }

  return tile;
}

function stampDarkGrassPatch(ctx, cellX, cellY, tileSize) {
  const baseX = cellX * tileSize;
  const baseY = cellY * tileSize;
  ctx.fillStyle = "rgba(35, 56, 29, 0.12)";
  ctx.fillRect(baseX + 6, baseY + 8, 12, 8);
  ctx.fillRect(baseX + 10, baseY + 5, 8, 4);
  ctx.fillRect(baseX + 8, baseY + 15, 10, 5);
}

function createGrassTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [createGrassVariantTile(0, tileSize), createGrassVariantTile(1, tileSize), createGrassVariantTile(2, tileSize)];
  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  const patchGrid = Array.from({ length: cells }, () => new Array(cells).fill(false));

  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
      patchGrid[y][x] = nextInt(7) === 0;
    }
  }

  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
    patchGrid[i][cells - 1] = patchGrid[i][0];
    patchGrid[cells - 1][i] = patchGrid[0][i];
  }

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
      if (patchGrid[y][x]) {
        stampDarkGrassPatch(ctx, x, y, tileSize);
      }
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  return texture;
}

function requestTerrainTileCanvas(assetPath, tileSize = 32) {
  const cached = terrainTileImageCache.get(assetPath);
  if (cached) {
    return cached;
  }
  if (AUTOMATED_TEST_MODE || terrainTilePending.has(assetPath)) {
    return null;
  }
  terrainTilePending.add(assetPath);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    terrainTilePending.delete(assetPath);
    const tile = document.createElement("canvas");
    tile.width = tileSize;
    tile.height = tileSize;
    const ctx = tile.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, tileSize, tileSize);
    ctx.drawImage(image, 0, 0, tileSize, tileSize);
    terrainTileImageCache.set(assetPath, tile);
    markMapDirty();
  };
  image.onerror = () => {
    terrainTilePending.delete(assetPath);
  };
  image.src = assetPath;
  return null;
}

function createEmberfallVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const palettes = [
    ["#75422f", "#824a31", "#8f5335", "#6a3b2a", "#9b5a39"],
    ["#6f3f2e", "#7c4630", "#8a5035", "#653829", "#97583a"],
    ["#6a3d2c", "#764330", "#844c34", "#5f3527", "#92553a"],
  ];
  const palette = palettes[variantIndex % palettes.length];
  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const idx = ((x >> 1) * (3 + variantIndex) + (y >> 1) * (7 + variantIndex) + variantIndex * 5) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = variantIndex === 1 ? "rgba(250, 178, 96, 0.22)" : "rgba(238, 162, 92, 0.16)";
  for (let y = variantIndex; y < tileSize; y += 5) {
    for (let x = (variantIndex * 3 + y) % 7; x < tileSize; x += 7) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = "rgba(36, 20, 14, 0.24)";
  for (let x = 2 + variantIndex; x < tileSize - 2; x += 7) {
    const y = (x * 3 + variantIndex * 4) % tileSize;
    ctx.fillRect(x, y, 1, 3);
    if (y + 2 < tileSize) {
      ctx.fillRect(Math.max(0, x - 1), y + 2, 2, 1);
    }
  }

  return tile;
}

function stampEmberCrackPatch(ctx, cellX, cellY, tileSize) {
  const baseX = cellX * tileSize;
  const baseY = cellY * tileSize;
  ctx.fillStyle = "rgba(25, 12, 8, 0.26)";
  ctx.fillRect(baseX + 5, baseY + 9, 13, 2);
  ctx.fillRect(baseX + 12, baseY + 6, 2, 10);
  ctx.fillStyle = "rgba(241, 160, 88, 0.22)";
  ctx.fillRect(baseX + 10, baseY + 8, 2, 1);
  ctx.fillRect(baseX + 13, baseY + 11, 1, 2);
}

function createEmberfallTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [
    createEmberfallVariantTile(0, tileSize),
    createEmberfallVariantTile(1, tileSize),
    createEmberfallVariantTile(2, tileSize),
  ];
  for (let i = 0; i < EMBERFALL_TILE_ASSETS.length; i += 1) {
    const loaded = requestTerrainTileCanvas(EMBERFALL_TILE_ASSETS[i], tileSize);
    if (loaded) {
      variants[i % variants.length] = loaded;
    }
  }

  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  const patchGrid = Array.from({ length: cells }, () => new Array(cells).fill(false));

  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
      patchGrid[y][x] = nextInt(6) === 0;
    }
  }

  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
    patchGrid[i][cells - 1] = patchGrid[i][0];
    patchGrid[cells - 1][i] = patchGrid[0][i];
  }

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
      if (patchGrid[y][x]) {
        stampEmberCrackPatch(ctx, x, y, tileSize);
      }
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  texture.userData.sceneId = "emberfall";
  texture.userData.terrainFamily = "emberfall";
  return texture;
}

function createWindwardVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const palettes = [
    ["#8fa79a", "#97afa2", "#839a8f", "#a0b8ab", "#7a9187"],
    ["#93ab9f", "#9cb5a8", "#869d92", "#a6beb2", "#7f968c"],
  ];
  const palette = palettes[variantIndex % palettes.length];
  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const idx = ((x >> 1) * (5 + variantIndex) + (y >> 1) * (3 + variantIndex * 2) + variantIndex * 7) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = "rgba(214, 229, 236, 0.18)";
  for (let y = variantIndex; y < tileSize; y += 6) {
    for (let x = (y + variantIndex * 2) % 8; x < tileSize; x += 8) {
      ctx.fillRect(x, y, 1, 2);
    }
  }

  ctx.fillStyle = "rgba(52, 64, 62, 0.16)";
  for (let x = 1 + variantIndex; x < tileSize - 1; x += 7) {
    const y = (x * 2 + variantIndex * 5) % tileSize;
    ctx.fillRect(x, y, 2, 1);
    if (y + 2 < tileSize) {
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  return tile;
}

function stampWindwardStonePatch(ctx, cellX, cellY, tileSize) {
  const baseX = cellX * tileSize;
  const baseY = cellY * tileSize;
  ctx.fillStyle = "rgba(67, 77, 79, 0.18)";
  ctx.fillRect(baseX + 6, baseY + 8, 10, 7);
  ctx.fillRect(baseX + 13, baseY + 6, 8, 5);
  ctx.fillStyle = "rgba(196, 213, 220, 0.16)";
  ctx.fillRect(baseX + 9, baseY + 9, 7, 3);
}

function createWindwardTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [createWindwardVariantTile(0, tileSize), createWindwardVariantTile(1, tileSize)];
  for (let i = 0; i < WINDWARD_TILE_ASSETS.length; i += 1) {
    const loaded = requestTerrainTileCanvas(WINDWARD_TILE_ASSETS[i], tileSize);
    if (loaded) {
      variants[i % variants.length] = loaded;
    }
  }

  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  const patchGrid = Array.from({ length: cells }, () => new Array(cells).fill(false));

  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
      patchGrid[y][x] = nextInt(5) === 0;
    }
  }

  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
    patchGrid[i][cells - 1] = patchGrid[i][0];
    patchGrid[cells - 1][i] = patchGrid[0][i];
  }

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
      if (patchGrid[y][x]) {
        stampWindwardStonePatch(ctx, x, y, tileSize);
      }
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  texture.userData.sceneId = "windward";
  texture.userData.terrainFamily = "windward";
  return texture;
}

function createRootwayVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const palettes = [
    ["#3b4337", "#445042", "#353b32", "#4d5849", "#2f362c"],
    ["#3f473a", "#495446", "#384033", "#505c4d", "#32392e"],
  ];
  const palette = palettes[variantIndex % palettes.length];
  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const index = ((x >> 1) * (7 + variantIndex) + (y >> 1) * (5 + variantIndex * 3) + variantIndex * 4) % palette.length;
      ctx.fillStyle = palette[index];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = "rgba(157, 228, 140, 0.17)";
  for (let y = variantIndex; y < tileSize; y += 6) {
    for (let x = (variantIndex * 3 + y) % 9; x < tileSize; x += 9) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = "rgba(18, 24, 20, 0.21)";
  for (let x = 2 + variantIndex; x < tileSize - 2; x += 7) {
    const y = (x * 4 + variantIndex * 2) % tileSize;
    ctx.fillRect(x, y, 2, 1);
    if (y + 2 < tileSize) {
      ctx.fillRect(x + 1, y + 1, 1, 2);
    }
  }

  return tile;
}

function stampRootwayPatch(ctx, cellX, cellY, tileSize) {
  const baseX = cellX * tileSize;
  const baseY = cellY * tileSize;
  ctx.fillStyle = "rgba(122, 155, 109, 0.16)";
  ctx.fillRect(baseX + 8, baseY + 8, 10, 3);
  ctx.fillRect(baseX + 10, baseY + 11, 7, 2);
  ctx.fillStyle = "rgba(24, 30, 24, 0.2)";
  ctx.fillRect(baseX + 7, baseY + 15, 12, 2);
}

function createRootwayTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [createRootwayVariantTile(0, tileSize), createRootwayVariantTile(1, tileSize)];
  for (let i = 0; i < ROOTWAY_TILE_ASSETS.length; i += 1) {
    const loaded = requestTerrainTileCanvas(ROOTWAY_TILE_ASSETS[i], tileSize);
    if (loaded) {
      variants[i % variants.length] = loaded;
    }
  }

  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  const patchGrid = Array.from({ length: cells }, () => new Array(cells).fill(false));

  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
      patchGrid[y][x] = nextInt(5) === 0;
    }
  }

  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
    patchGrid[i][cells - 1] = patchGrid[i][0];
    patchGrid[cells - 1][i] = patchGrid[0][i];
  }

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
      if (patchGrid[y][x]) {
        stampRootwayPatch(ctx, x, y, tileSize);
      }
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  texture.userData.sceneId = "region4_seed";
  texture.userData.terrainFamily = "rootway";
  return texture;
}

function createInnerSpireVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const palettes = [
    ["#454f67", "#505c77", "#3f485f", "#58647f", "#384055"],
    ["#4b5670", "#58647f", "#444e67", "#616f8a", "#3d455b"],
  ];
  const palette = palettes[variantIndex % palettes.length];

  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const index = ((x >> 1) * (5 + variantIndex) + (y >> 1) * (9 + variantIndex * 2) + variantIndex * 6) % palette.length;
      ctx.fillStyle = palette[index];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = "rgba(188, 224, 255, 0.16)";
  for (let y = variantIndex; y < tileSize; y += 7) {
    for (let x = (variantIndex * 2 + y) % 11; x < tileSize; x += 11) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = "rgba(18, 22, 34, 0.24)";
  for (let x = 2 + variantIndex; x < tileSize - 2; x += 8) {
    const y = (x * 3 + variantIndex * 5) % tileSize;
    ctx.fillRect(x, y, 2, 1);
  }

  return tile;
}

function createInnerSpireTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [createInnerSpireVariantTile(0, tileSize), createInnerSpireVariantTile(1, tileSize)];
  for (let i = 0; i < INNER_SPIRE_TILE_ASSETS.length; i += 1) {
    const loaded = requestTerrainTileCanvas(INNER_SPIRE_TILE_ASSETS[i], tileSize);
    if (loaded) {
      variants[i % variants.length] = loaded;
    }
  }

  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
    }
  }
  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
  }
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  texture.userData.sceneId = "inner_spire";
  texture.userData.terrainFamily = "inner_spire";
  return texture;
}

function createLastSpireVariantTile(variantIndex, tileSize = 32) {
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const ctx = tile.getContext("2d");

  const palettes = [
    ["#4b4f69", "#5c6280", "#434862", "#676d8e", "#3b4058"],
    ["#56567a", "#686995", "#4e5070", "#7576a5", "#434665"],
  ];
  const palette = palettes[variantIndex % palettes.length];

  for (let y = 0; y < tileSize; y += 2) {
    for (let x = 0; x < tileSize; x += 2) {
      const index = ((x >> 1) * (6 + variantIndex) + (y >> 1) * (7 + variantIndex * 3) + variantIndex * 5) % palette.length;
      ctx.fillStyle = palette[index];
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ctx.fillStyle = "rgba(212, 220, 255, 0.16)";
  for (let y = variantIndex; y < tileSize; y += 8) {
    for (let x = (variantIndex * 3 + y) % 10; x < tileSize; x += 10) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = "rgba(24, 24, 37, 0.24)";
  for (let x = 3 + variantIndex; x < tileSize - 2; x += 9) {
    const y = (x * 2 + variantIndex * 4) % tileSize;
    ctx.fillRect(x, y, 2, 1);
  }

  return tile;
}

function createLastSpireTileTexture() {
  const tileSize = 32;
  const cells = 16;
  const atlasSize = tileSize * cells;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = atlasSize;
  textureCanvas.height = atlasSize;
  const ctx = textureCanvas.getContext("2d");

  const variants = [createLastSpireVariantTile(0, tileSize), createLastSpireVariantTile(1, tileSize)];
  for (let i = 0; i < LAST_SPIRE_TILE_ASSETS.length; i += 1) {
    const loaded = requestTerrainTileCanvas(LAST_SPIRE_TILE_ASSETS[i], tileSize);
    if (loaded) {
      variants[i % variants.length] = loaded;
    }
  }

  const variantGrid = Array.from({ length: cells }, () => new Array(cells).fill(0));
  for (let y = 0; y < cells - 1; y += 1) {
    for (let x = 0; x < cells - 1; x += 1) {
      variantGrid[y][x] = nextInt(variants.length);
    }
  }
  for (let i = 0; i < cells; i += 1) {
    variantGrid[i][cells - 1] = variantGrid[i][0];
    variantGrid[cells - 1][i] = variantGrid[0][i];
  }
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.drawImage(variants[variantGrid[y][x]], x * tileSize, y * tileSize);
    }
  }

  const texture = applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILE_REPEAT_SCALE, TILE_REPEAT_SCALE);
  texture.userData.sceneId = "last_spire";
  texture.userData.terrainFamily = "last_spire";
  return texture;
}

function createTerrainTileTexture(sceneId) {
  if (sceneId === "emberfall") {
    return createEmberfallTileTexture();
  }
  if (sceneId === "windward") {
    return createWindwardTileTexture();
  }
  if (sceneId === "region4_seed") {
    return createRootwayTileTexture();
  }
  if (sceneId === "inner_spire" || sceneId === "inner_spire_last_door") {
    return createInnerSpireTileTexture();
  }
  if (sceneId === "last_spire") {
    return createLastSpireTileTexture();
  }
  const texture = createGrassTileTexture();
  texture.userData.terrainFamily = "verdant";
  return texture;
}

function drawProceduralPlayerFrame(ctx, frameX, frameY, direction, frameType) {
  const ox = frameX * PLAYER_SPRITE_FRAME_WIDTH;
  const oy = frameY * PLAYER_SPRITE_FRAME_HEIGHT;

  const fill = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  };

  fill(16, 54, 16, 5, "rgba(0,0,0,0.35)");
  fill(17, 16, 14, 10, "#111827");
  fill(18, 17, 12, 8, "#efd7a9");
  fill(18, 15, 12, 2, "#31432e");
  fill(17, 24, 14, 24, "#111827");
  fill(18, 25, 12, 22, "#355d2f");
  fill(20, 31, 8, 11, "#de703c");
  fill(19, 41, 10, 2, "#6b4a2b");

  const stepOffset = frameType === "walk1" ? -1 : frameType === "walk2" ? 1 : 0;
  fill(19 + stepOffset, 46, 4, 4, "#a7d1ef");
  fill(25 - stepOffset, 46, 4, 4, "#a7d1ef");
  fill(19 + stepOffset, 46, 4, 1, "#0b1220");
  fill(25 - stepOffset, 46, 4, 1, "#0b1220");

  if (direction === "left") {
    fill(17, 20, 2, 2, "#0f172a");
    fill(13, 33, 6, 2, "#bcd8eb");
    if (frameType === "attack") {
      fill(8, 29, 10, 2, "#f5f4de");
    }
  } else if (direction === "right") {
    fill(29, 20, 2, 2, "#0f172a");
    fill(30, 33, 6, 2, "#bcd8eb");
    if (frameType === "attack") {
      fill(31, 29, 10, 2, "#f5f4de");
    }
  } else if (direction === "up") {
    fill(21, 18, 6, 1, "#26352d");
    fill(30, 24, 2, 8, "#bcd8eb");
    if (frameType === "attack") {
      fill(32, 20, 8, 2, "#f5f4de");
    }
  } else {
    fill(30, 34, 2, 8, "#bcd8eb");
    if (frameType === "attack") {
      fill(32, 38, 8, 2, "#f5f4de");
    }
  }
}

function createProceduralPlayerSpriteSheetTexture() {
  const columns = 4;
  const rows = 4;
  const sheetCanvas = document.createElement("canvas");
  sheetCanvas.width = PLAYER_SPRITE_FRAME_WIDTH * columns;
  sheetCanvas.height = PLAYER_SPRITE_FRAME_HEIGHT * rows;
  const ctx = sheetCanvas.getContext("2d");

  const directions = ["down", "left", "right", "up"];
  const frames = ["idle", "walk1", "walk2", "attack"];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      drawProceduralPlayerFrame(ctx, col, row, directions[row], frames[col]);
    }
  }

  return applyPixelArtTextureSettings(new THREE.CanvasTexture(sheetCanvas));
}

async function loadPixelSpriteTexture(assetPath, fallbackTexture) {
  if (AUTOMATED_TEST_MODE) {
    return fallbackTexture;
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(applyPixelArtTextureSettings(new THREE.Texture(image)));
    image.onerror = () => resolve(fallbackTexture);
    image.src = assetPath;
  });
}

function getWeaponTextureRecord(key, assetPath) {
  const cacheKey = `${key}:${assetPath}`;
  const cached = weaponTextureCache.get(cacheKey);
  if (cached) return cached;

  const fallbackTexture = createWeaponFallbackTexture(key);
  const record = {
    key,
    assetPath,
    texture: fallbackTexture,
    fallbackTexture,
    disposed: false,
  };
  weaponTextureCache.set(cacheKey, record);

  loadPixelSpriteTexture(assetPath, fallbackTexture).then((texture) => {
    if (record.disposed) {
      if (texture && texture !== fallbackTexture) {
        texture.dispose?.();
      }
      return;
    }
    record.texture = texture;
  });
  return record;
}

function applyWeaponDescriptor(material, descriptor) {
  if (!material || !descriptor?.key || !descriptor?.assetPath) return;
  const record = getWeaponTextureRecord(descriptor.key, descriptor.assetPath);
  if (material.map !== record.texture) {
    material.map = record.texture;
    material.needsUpdate = true;
  }
  material.opacity = Number.isFinite(descriptor.opacity) ? descriptor.opacity : 1;
  material.alphaTest = Number.isFinite(descriptor.alphaTest) ? descriptor.alphaTest : material.alphaTest;
  if (descriptor.color) {
    material.color?.set?.(descriptor.color);
  } else if (material.color) {
    material.color.set("#ffffff");
  }
}

function createFootstepTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 16;
  textureCanvas.height = 16;
  const ctx = textureCanvas.getContext("2d");

  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = "rgba(190, 220, 165, 0.9)";
  ctx.beginPath();
  ctx.arc(8, 8, 3, 0, Math.PI * 2);
  ctx.fill();

  return applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
}

function createFootstepSystem(sceneRef) {
  const particles = [];
  const texture = createFootstepTexture();

  for (let i = 0; i < 24; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      })
    );
    sprite.visible = false;
    sprite.renderOrder = 3;
    sprite.userData.life = 0;
    sprite.userData.maxLife = 0;
    sprite.scale.set(0.22, 0.22, 1);
    sceneRef.add(sprite);
    particles.push(sprite);
  }

  return {
    particles,
    nextIndex: 0,
    spawnAccumulator: 0,
    stepParity: 0,
  };
}

function spawnFootstep(system, playerPosition, moveDirection, isRunning) {
  const particle = system.particles[system.nextIndex % system.particles.length];
  system.nextIndex += 1;
  const side = system.stepParity % 2 === 0 ? 1 : -1;
  system.stepParity += 1;

  const forward = moveDirection.clone();
  if (forward.lengthSq() < 0.0001) {
    forward.set(0, 1);
  }
  forward.normalize();
  const perpendicular = new THREE.Vector2(-forward.y, forward.x);

  const sideOffset = perpendicular.multiplyScalar(0.14 * side);
  const backOffset = forward.multiplyScalar(-0.22);
  particle.position.set(
    playerPosition.x + sideOffset.x + backOffset.x,
    -0.86,
    playerPosition.z + sideOffset.y + backOffset.y
  );

  const maxLife = isRunning ? 0.24 : 0.32;
  const baseOpacity = isRunning ? 0.36 : 0.25;
  const baseScale = isRunning ? 0.26 : 0.22;
  particle.userData.life = maxLife;
  particle.userData.maxLife = maxLife;
  particle.userData.baseOpacity = baseOpacity;
  particle.userData.baseScale = baseScale;
  particle.material.opacity = baseOpacity;
  particle.scale.set(baseScale, baseScale, 1);
  particle.visible = true;
}

function updateFootstepSystem(system, dtSeconds, movementInfo, playerPosition) {
  for (const particle of system.particles) {
    if (!particle.visible) continue;

    particle.userData.life = Math.max(0, particle.userData.life - dtSeconds);
    if (particle.userData.life <= 0) {
      particle.visible = false;
      continue;
    }

    const lifeT = particle.userData.life / particle.userData.maxLife;
    particle.material.opacity = particle.userData.baseOpacity * lifeT;
    const scale = particle.userData.baseScale + (1 - lifeT) * 0.07;
    particle.scale.set(scale, scale, 1);
  }

  if (!movementInfo.isMoving) {
    system.spawnAccumulator = 0;
    return;
  }

  const spawnRate = movementInfo.isRunning ? 11 : 6;
  system.spawnAccumulator += dtSeconds * spawnRate;
  while (system.spawnAccumulator >= 1) {
    spawnFootstep(system, playerPosition, movementInfo.moveDirection, movementInfo.isRunning);
    system.spawnAccumulator -= 1;
  }
}

function createAmbientMoteTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 10;
  textureCanvas.height = 10;
  const ctx = textureCanvas.getContext("2d");

  ctx.clearRect(0, 0, 10, 10);
  ctx.fillStyle = "rgba(220, 244, 208, 0.9)";
  ctx.fillRect(4, 4, 2, 2);
  ctx.fillStyle = "rgba(173, 220, 168, 0.7)";
  ctx.fillRect(3, 4, 1, 1);
  ctx.fillRect(6, 5, 1, 1);

  return applyPixelArtTextureSettings(new THREE.CanvasTexture(textureCanvas));
}

function createAmbientMoteSystem(sceneRef, count = AMBIENT_MOTE_COUNT) {
  const particles = [];
  const texture = createAmbientMoteTexture();

  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        color: "#d2f4cc",
      })
    );
    sprite.scale.set(0.14 + nextFloat() * 0.1, 0.14 + nextFloat() * 0.1, 1);
    sprite.position.set((nextFloat() - 0.5) * 12, -0.2 + nextFloat() * 2.3, (nextFloat() - 0.5) * 12);
    sprite.renderOrder = 1400;
    sceneRef.add(sprite);

    particles.push({
      sprite,
      velocityX: (nextFloat() - 0.5) * 0.12,
      velocityY: 0.02 + nextFloat() * 0.03,
      velocityZ: (nextFloat() - 0.5) * 0.12,
      phase: nextFloat() * Math.PI * 2,
      wobble: 0.02 + nextFloat() * 0.05,
    });
  }

  return { particles, texture };
}

function updateAmbientMoteSystem(system, dtSeconds, elapsedSeconds, centerPosition) {
  const bounds = 10.4;
  for (const mote of system.particles) {
    const sprite = mote.sprite;
    sprite.position.x += mote.velocityX * dtSeconds;
    sprite.position.y += mote.velocityY * dtSeconds;
    sprite.position.z += mote.velocityZ * dtSeconds;

    sprite.position.x += Math.sin(elapsedSeconds * 0.85 + mote.phase) * mote.wobble * dtSeconds;
    sprite.position.z += Math.cos(elapsedSeconds * 0.7 + mote.phase) * mote.wobble * dtSeconds;

    if (sprite.position.y > 2.35) {
      sprite.position.y = -0.24;
    }

    if (sprite.position.x < centerPosition.x - bounds) sprite.position.x = centerPosition.x + bounds;
    if (sprite.position.x > centerPosition.x + bounds) sprite.position.x = centerPosition.x - bounds;
    if (sprite.position.z < centerPosition.z - bounds) sprite.position.z = centerPosition.z + bounds;
    if (sprite.position.z > centerPosition.z + bounds) sprite.position.z = centerPosition.z - bounds;
  }
}

function disposeAmbientMoteSystem(system, sceneRef) {
  for (const mote of system.particles) {
    if (mote.sprite.parent === sceneRef) {
      sceneRef.remove(mote.sprite);
    }
    mote.sprite.material.dispose();
  }
  system.texture.dispose();
  system.particles.length = 0;
}

function createPulsePresentationSystem(sceneRef) {
  const root = new THREE.Group();
  root.name = "pulse-presentation-root";
  sceneRef.add(root);

  const ripples = [];
  let rippleAccumulator = 0;
  let overlay = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.dataset.testid = "pulse-overlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "14";
    overlay.style.background =
      "radial-gradient(circle at 50% 55%, rgba(132, 186, 144, 0.18), rgba(34, 45, 42, 0.24) 64%, rgba(8, 10, 12, 0.34) 100%)";
    overlay.style.opacity = "0";
    document.body.appendChild(overlay);
    return overlay;
  }

  function clearOverlay() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
  }

  function spawnRippleRing(position) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.62, 40),
      new THREE.MeshBasicMaterial({
        color: "#a5f2ba",
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, -0.884, position.y);
    ring.renderOrder = resolveDepthOrder(position.y, 1022);
    root.add(ring);

    ripples.push({
      mesh: ring,
      life: 1.05,
      maxLife: 1.05,
      baseZ: position.y,
    });
  }

  function clearRipples() {
    for (const ripple of ripples) {
      if (ripple.mesh.parent === root) {
        root.remove(ripple.mesh);
      }
      ripple.mesh.geometry.dispose();
      ripple.mesh.material.dispose();
    }
    ripples.length = 0;
  }

  function update(dtSeconds, { active, elapsedSeconds, sceneId, center }) {
    const inHollowScar = sceneId === "hollowScar";
    if (!active || !inHollowScar) {
      clearOverlay();
      clearRipples();
      rippleAccumulator = 0;
      return {
        active: false,
        pulseScalar: 0,
        fogDensityDelta: 0,
        ambientIntensityDelta: 0,
        tintStrengthDelta: 0,
        foliageSwayMultiplier: 1,
        overlayPulseOpacityDelta: 0,
        overlayActive: false,
      };
    }

    const pulse = 0.52 + Math.sin(elapsedSeconds * 4.8) * 0.48;
    const pulseScalar = Math.max(0, Math.min(1, pulse));

    ensureOverlay();

    rippleAccumulator += dtSeconds * (1.75 + pulse * 0.6);
    while (rippleAccumulator >= 1) {
      spawnRippleRing(center);
      rippleAccumulator -= 1;
    }

    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const ripple = ripples[i];
      ripple.life = Math.max(0, ripple.life - dtSeconds);
      const lifeT = ripple.life / ripple.maxLife;
      ripple.mesh.material.opacity = 0.42 * lifeT;
      const scale = 1 + (1 - lifeT) * 3.6;
      ripple.mesh.scale.set(scale, scale, scale);
      ripple.mesh.renderOrder = resolveDepthOrder(ripple.baseZ, 1022);
      if (ripple.life <= 0) {
        root.remove(ripple.mesh);
        ripple.mesh.geometry.dispose();
        ripple.mesh.material.dispose();
        ripples.splice(i, 1);
      }
    }

    return {
      active: true,
      pulseScalar,
      fogDensityDelta: 0.003 + pulse * 0.0024,
      ambientIntensityDelta: -(0.048 + pulse * 0.03),
      tintStrengthDelta: 0.048 + pulse * 0.04,
      foliageSwayMultiplier: 1.2 + pulse * 0.34,
      overlayPulseOpacityDelta: 0.034 + pulse * 0.032,
      overlayActive: true,
    };
  }

  function setOverlayOpacity(opacity) {
    if (!overlay) return;
    const clamped = Math.max(0, Math.min(0.22, opacity));
    overlay.style.opacity = clamped.toFixed(3);
  }

  function clear() {
    clearOverlay();
    clearRipples();
    rippleAccumulator = 0;
  }

  function dispose() {
    clear();
    if (root.parent) {
      root.parent.remove(root);
    }
  }

  return {
    update,
    setOverlayOpacity,
    clear,
    dispose,
  };
}

function createIntroTextBeat() {
  const root = document.createElement("div");
  root.dataset.testid = "intro-text-root";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "none";
  root.style.pointerEvents = "none";
  root.style.zIndex = "13";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.textAlign = "center";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  root.style.color = "#e4efda";
  root.style.textShadow = "0 2px 8px rgba(0, 0, 0, 0.82)";
  root.style.letterSpacing = "0.04em";
  root.style.background = "radial-gradient(circle at 50% 56%, rgba(32, 45, 34, 0.17), rgba(0, 0, 0, 0.28) 100%)";

  const text = document.createElement("div");
  text.dataset.testid = "intro-text-line";
  text.style.maxWidth = "820px";
  text.style.padding = "0 24px";
  text.style.fontSize = "32px";
  text.style.lineHeight = "1.25";
  text.style.opacity = "0";
  root.appendChild(text);
  document.body.appendChild(root);

  const defaultDurations = {
    fadeIn: 2,
    hold: 2,
    fadeOut: 2,
  };

  let active = false;
  let elapsedSeconds = 0;
  let message = "";
  let durations = { ...defaultDurations };
  let totalDuration = durations.fadeIn + durations.hold + durations.fadeOut;

  function start(nextMessage, overrides = null) {
    durations = {
      ...defaultDurations,
      ...(overrides ?? {}),
    };
    totalDuration = durations.fadeIn + durations.hold + durations.fadeOut;
    message = String(nextMessage ?? "");
    elapsedSeconds = 0;
    active = true;
    text.textContent = message;
    text.style.opacity = "0";
    root.style.display = "flex";
  }

  function clear() {
    active = false;
    elapsedSeconds = 0;
    durations = { ...defaultDurations };
    totalDuration = durations.fadeIn + durations.hold + durations.fadeOut;
    text.style.opacity = "0";
    root.style.display = "none";
  }

  function update(dtSeconds) {
    if (!active) return false;
    elapsedSeconds += dtSeconds;

    let alpha = 1;
    if (elapsedSeconds <= durations.fadeIn) {
      alpha = Math.max(0, Math.min(1, elapsedSeconds / durations.fadeIn));
    } else if (elapsedSeconds <= durations.fadeIn + durations.hold) {
      alpha = 1;
    } else {
      const fadeOutElapsed = elapsedSeconds - (durations.fadeIn + durations.hold);
      alpha = Math.max(0, Math.min(1, 1 - fadeOutElapsed / durations.fadeOut));
    }

    text.style.opacity = alpha.toFixed(3);
    if (elapsedSeconds >= totalDuration) {
      clear();
      return true;
    }
    return false;
  }

  return {
    start,
    clear,
    update,
    isActive: () => active,
    getMessage: () => message,
    destroy() {
      root.remove();
    },
  };
}

function createDamageTintOverlay() {
  const overlay = document.createElement("div");
  overlay.dataset.testid = "damage-tint";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "13";
  overlay.style.background = "rgba(160, 24, 24, 0.22)";
  overlay.style.opacity = "0";
  document.body.appendChild(overlay);

  return {
    setOpacity(opacity) {
      const clamped = Math.max(0, Math.min(1, opacity));
      overlay.style.opacity = clamped.toFixed(3);
    },
    destroy() {
      overlay.remove();
    },
  };
}

function createSceneDebugOverlay() {
  const root = document.createElement("div");
  root.dataset.testid = "debug-scene-overlay";
  root.style.position = "fixed";
  root.style.top = "12px";
  root.style.left = "260px";
  root.style.zIndex = "20";
  root.style.pointerEvents = "none";
  root.style.fontFamily = '"Consolas", "Courier New", monospace';
  root.style.fontSize = "11px";
  root.style.lineHeight = "1.35";
  root.style.color = "#d7e2d2";
  root.style.background = "rgba(4, 8, 8, 0.58)";
  root.style.border = "1px solid rgba(138, 171, 144, 0.42)";
  root.style.padding = "6px 8px";
  root.style.borderRadius = "4px";
  root.style.minWidth = "240px";

  const sceneId = document.createElement("div");
  sceneId.dataset.testid = "debug-scene-id";
  const sceneObjects = document.createElement("div");
  sceneObjects.dataset.testid = "debug-scene-objects";
  const hasGround = document.createElement("div");
  hasGround.dataset.testid = "debug-has-ground";
  const portalCount = document.createElement("div");
  const npcCount = document.createElement("div");
  const enemyCount = document.createElement("div");
  const attacksEnabled = document.createElement("div");
  attacksEnabled.dataset.testid = "debug-attacks-enabled";
  const terrainStatus = document.createElement("div");
  const aiHeader = document.createElement("div");
  aiHeader.style.display = "none";
  aiHeader.style.marginTop = "5px";
  aiHeader.style.opacity = "0.86";
  aiHeader.style.color = "#d8f5d3";
  const aiArthur = document.createElement("div");
  aiArthur.style.display = "none";
  const aiElaine = document.createElement("div");
  aiElaine.style.display = "none";
  const aiWillow = document.createElement("div");
  aiWillow.style.display = "none";

  root.append(
    sceneId,
    sceneObjects,
    hasGround,
    portalCount,
    npcCount,
    enemyCount,
    attacksEnabled,
    terrainStatus,
    aiHeader,
    aiArthur,
    aiElaine,
    aiWillow
  );
  document.body.appendChild(root);

  function formatAiLine(member) {
    if (!member) return "";
    const targetText = member.threatId ? ` -> ${member.threatId}` : "";
    const distanceText = Number.isFinite(member.distToThreat) ? ` d=${Number(member.distToThreat).toFixed(2)}` : "";
    const desiredText = Number.isFinite(member.desiredRange) ? ` r=${Number(member.desiredRange).toFixed(2)}` : "";
    return `${member.id}: ${member.aiState}${targetText}${distanceText}${desiredText} [${member.mode}]`;
  }

  return {
    update({
      currentSceneId,
      sceneObjectCount,
      hasGroundMesh,
      hasPortalCount,
      hasNpcCount,
      hasEnemyCount,
      enemyAttacksEnabled,
      terrainStatusText,
      aiOverlayEnabled = false,
      partyAiState = null,
    }) {
      sceneId.textContent = `scene=${currentSceneId}`;
      sceneObjects.textContent = `objects=${sceneObjectCount}`;
      hasGround.textContent = `hasGround=${hasGroundMesh}`;
      portalCount.textContent = `portals=${hasPortalCount}`;
      npcCount.textContent = `npcs=${hasNpcCount}`;
      enemyCount.textContent = `enemies=${hasEnemyCount}`;
      attacksEnabled.textContent = `attacksEnabled=${enemyAttacksEnabled}`;
      terrainStatus.textContent = `terrain=${terrainStatusText}`;
      if (!aiOverlayEnabled) {
        aiHeader.style.display = "none";
        aiArthur.style.display = "none";
        aiElaine.style.display = "none";
        aiWillow.style.display = "none";
        return;
      }
      const members = partyAiState?.members ?? [];
      const byId = new Map(members.map((member) => [member.id, member]));
      aiHeader.style.display = "block";
      aiHeader.textContent = `partyAI combat=${Boolean(partyAiState?.combatActive)} boss=${Boolean(partyAiState?.bossActive)}`;
      aiArthur.style.display = byId.has("arthur") ? "block" : "none";
      aiElaine.style.display = byId.has("elaine") ? "block" : "none";
      aiWillow.style.display = byId.has("willow") ? "block" : "none";
      aiArthur.textContent = formatAiLine(byId.get("arthur"));
      aiElaine.textContent = formatAiLine(byId.get("elaine"));
      aiWillow.textContent = formatAiLine(byId.get("willow"));
    },
    destroy() {
      root.remove();
    },
  };
}

function createVaelorisChoicePanel({ onChoose }) {
  const root = document.createElement("div");
  root.dataset.testid = "extractor-choice-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "30px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(300px, 90vw)";
  root.style.padding = "10px";
  root.style.background = "rgba(14, 18, 20, 0.93)";
  root.style.border = "2px solid rgba(152, 197, 214, 0.74)";
  root.style.boxShadow = "0 0 0 2px rgba(20, 31, 36, 0.92) inset";
  root.style.zIndex = "32";
  root.style.display = "none";
  root.style.pointerEvents = "auto";

  const title = document.createElement("div");
  title.dataset.testid = "extractor-choice-title";
  title.textContent = "Vaeloris Extractor";
  title.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  title.style.fontSize = "13px";
  title.style.color = "#deedf4";
  title.style.letterSpacing = "0.02em";

  const subtitle = document.createElement("div");
  subtitle.textContent = "The rig hums beneath the roots.";
  subtitle.style.marginTop = "4px";
  subtitle.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  subtitle.style.fontSize = "11px";
  subtitle.style.color = "#bbd4df";
  subtitle.style.opacity = "0.88";

  const disableButton = document.createElement("button");
  disableButton.type = "button";
  disableButton.dataset.testid = "extractor-choice-disable";
  disableButton.textContent = "Disable Device";
  disableButton.style.display = "block";
  disableButton.style.width = "100%";
  disableButton.style.marginTop = "8px";
  disableButton.style.padding = "7px 9px";
  disableButton.style.border = "1px solid rgba(168, 224, 177, 0.72)";
  disableButton.style.background = "rgba(24, 37, 29, 0.9)";
  disableButton.style.color = "#e7f7e9";
  disableButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  disableButton.style.fontSize = "12px";
  disableButton.style.cursor = "pointer";

  const leaveButton = document.createElement("button");
  leaveButton.type = "button";
  leaveButton.dataset.testid = "extractor-choice-leave";
  leaveButton.textContent = "Leave It Running";
  leaveButton.style.display = "block";
  leaveButton.style.width = "100%";
  leaveButton.style.marginTop = "6px";
  leaveButton.style.padding = "7px 9px";
  leaveButton.style.border = "1px solid rgba(161, 183, 201, 0.66)";
  leaveButton.style.background = "rgba(28, 34, 40, 0.9)";
  leaveButton.style.color = "#d9e8f0";
  leaveButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  leaveButton.style.fontSize = "12px";
  leaveButton.style.cursor = "pointer";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.dataset.testid = "extractor-choice-close";
  closeButton.textContent = "Close";
  closeButton.style.display = "block";
  closeButton.style.width = "100%";
  closeButton.style.marginTop = "8px";
  closeButton.style.padding = "6px 9px";
  closeButton.style.border = "1px solid rgba(113, 133, 145, 0.5)";
  closeButton.style.background = "rgba(20, 24, 28, 0.9)";
  closeButton.style.color = "#c7d4db";
  closeButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  closeButton.style.fontSize = "11px";
  closeButton.style.cursor = "pointer";

  root.append(title, subtitle, disableButton, leaveButton, closeButton);
  document.body.appendChild(root);

  let open = false;

  const close = () => {
    open = false;
    root.style.display = "none";
  };

  disableButton.addEventListener("click", () => onChoose?.(VAELORIS_CHOICE_VALUES.DISABLE));
  leaveButton.addEventListener("click", () => onChoose?.(VAELORIS_CHOICE_VALUES.LEAVE));
  closeButton.addEventListener("click", close);

  return {
    isOpen() {
      return open;
    },
    open() {
      open = true;
      root.style.display = "block";
    },
    close,
    destroy() {
      root.remove();
    },
  };
}

function createHarvesterChoicePanel({ onChoose }) {
  const root = document.createElement("div");
  root.dataset.testid = "harvester-choice-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "34px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(318px, 92vw)";
  root.style.padding = "10px";
  root.style.background = "rgba(18, 16, 14, 0.94)";
  root.style.border = "2px solid rgba(237, 206, 172, 0.74)";
  root.style.boxShadow = "0 0 0 2px rgba(34, 24, 18, 0.9) inset";
  root.style.zIndex = "33";
  root.style.display = "none";
  root.style.pointerEvents = "auto";

  const title = document.createElement("div");
  title.textContent = "Harvester Core";
  title.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  title.style.fontSize = "13px";
  title.style.color = "#f4e9dd";

  const subtitle = document.createElement("div");
  subtitle.textContent = "Vaeloris machinery hums under fractured heat-veins.";
  subtitle.style.marginTop = "4px";
  subtitle.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  subtitle.style.fontSize = "11px";
  subtitle.style.color = "#e6d4c2";
  subtitle.style.opacity = "0.88";

  const shatterButton = document.createElement("button");
  shatterButton.type = "button";
  shatterButton.dataset.testid = "choice-shatter";
  shatterButton.textContent = "Shatter Core";
  shatterButton.style.display = "block";
  shatterButton.style.width = "100%";
  shatterButton.style.marginTop = "8px";
  shatterButton.style.padding = "7px 9px";
  shatterButton.style.border = "1px solid rgba(214, 242, 188, 0.74)";
  shatterButton.style.background = "rgba(28, 40, 26, 0.92)";
  shatterButton.style.color = "#eff9e8";
  shatterButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  shatterButton.style.fontSize = "12px";
  shatterButton.style.cursor = "pointer";

  const salvageButton = document.createElement("button");
  salvageButton.type = "button";
  salvageButton.dataset.testid = "choice-salvage";
  salvageButton.textContent = "Salvage Core";
  salvageButton.style.display = "block";
  salvageButton.style.width = "100%";
  salvageButton.style.marginTop = "6px";
  salvageButton.style.padding = "7px 9px";
  salvageButton.style.border = "1px solid rgba(161, 196, 224, 0.72)";
  salvageButton.style.background = "rgba(24, 30, 40, 0.92)";
  salvageButton.style.color = "#e2edf7";
  salvageButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  salvageButton.style.fontSize = "12px";
  salvageButton.style.cursor = "pointer";

  root.append(title, subtitle, shatterButton, salvageButton);
  document.body.appendChild(root);

  let open = false;

  const close = () => {
    open = false;
    root.style.display = "none";
  };

  shatterButton.addEventListener("click", () => onChoose?.(HARVESTER_CHOICE_VALUES.SHATTER));
  salvageButton.addEventListener("click", () => onChoose?.(HARVESTER_CHOICE_VALUES.SALVAGE));

  return {
    isOpen() {
      return open;
    },
    open() {
      open = true;
      root.style.display = "block";
    },
    close,
    destroy() {
      root.remove();
    },
  };
}

function createListeningSpikeChoicePanel({ onChoose }) {
  const root = document.createElement("div");
  root.dataset.testid = "spike-choice-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "34px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(316px, 92vw)";
  root.style.padding = "10px";
  root.style.background = "rgba(16, 19, 18, 0.94)";
  root.style.border = "2px solid rgba(171, 215, 198, 0.76)";
  root.style.boxShadow = "0 0 0 2px rgba(22, 30, 28, 0.9) inset";
  root.style.zIndex = "33";
  root.style.display = "none";
  root.style.pointerEvents = "auto";

  const title = document.createElement("div");
  title.textContent = "Listening Spike";
  title.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  title.style.fontSize = "13px";
  title.style.color = "#ecf6ef";

  const subtitle = document.createElement("div");
  subtitle.textContent = "A resonator core still hums beneath the ash.";
  subtitle.style.marginTop = "4px";
  subtitle.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  subtitle.style.fontSize = "11px";
  subtitle.style.color = "#d8e9e0";
  subtitle.style.opacity = "0.88";

  const crushButton = document.createElement("button");
  crushButton.type = "button";
  crushButton.dataset.testid = "choice-crush";
  crushButton.textContent = "Crush the Spike";
  crushButton.style.display = "block";
  crushButton.style.width = "100%";
  crushButton.style.marginTop = "8px";
  crushButton.style.padding = "7px 9px";
  crushButton.style.border = "1px solid rgba(191, 238, 202, 0.74)";
  crushButton.style.background = "rgba(23, 41, 29, 0.92)";
  crushButton.style.color = "#eef9f0";
  crushButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  crushButton.style.fontSize = "12px";
  crushButton.style.cursor = "pointer";

  const pocketButton = document.createElement("button");
  pocketButton.type = "button";
  pocketButton.dataset.testid = "choice-pocket";
  pocketButton.textContent = "Pocket the Resonator Core";
  pocketButton.style.display = "block";
  pocketButton.style.width = "100%";
  pocketButton.style.marginTop = "6px";
  pocketButton.style.padding = "7px 9px";
  pocketButton.style.border = "1px solid rgba(168, 193, 227, 0.72)";
  pocketButton.style.background = "rgba(24, 30, 41, 0.92)";
  pocketButton.style.color = "#e2ebf7";
  pocketButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  pocketButton.style.fontSize = "12px";
  pocketButton.style.cursor = "pointer";

  root.append(title, subtitle, crushButton, pocketButton);
  document.body.appendChild(root);

  let open = false;

  const close = () => {
    open = false;
    root.style.display = "none";
  };

  crushButton.addEventListener("click", () => onChoose?.(LISTENING_SPIKE_CHOICE_VALUES.CRUSH));
  pocketButton.addEventListener("click", () => onChoose?.(LISTENING_SPIKE_CHOICE_VALUES.POCKET));

  return {
    isOpen() {
      return open;
    },
    open() {
      open = true;
      root.style.display = "block";
    },
    close,
    destroy() {
      root.remove();
    },
  };
}

function createVaultChoicePanel({ onChoose }) {
  const root = document.createElement("div");
  root.dataset.testid = "vault-choice-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "34px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(332px, 94vw)";
  root.style.padding = "10px";
  root.style.background = "rgba(18, 18, 22, 0.95)";
  root.style.border = "2px solid rgba(198, 224, 255, 0.75)";
  root.style.boxShadow = "0 0 0 2px rgba(26, 32, 44, 0.9) inset";
  root.style.zIndex = "34";
  root.style.display = "none";
  root.style.pointerEvents = "auto";

  const title = document.createElement("div");
  title.textContent = "Crownheart Vault";
  title.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  title.style.fontSize = "13px";
  title.style.color = "#e8f3ff";

  const subtitle = document.createElement("div");
  subtitle.textContent = "One choice, no undo.";
  subtitle.style.marginTop = "4px";
  subtitle.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  subtitle.style.fontSize = "11px";
  subtitle.style.color = "#ceddf3";
  subtitle.style.opacity = "0.88";

  const sealButton = document.createElement("button");
  sealButton.type = "button";
  sealButton.dataset.testid = "choice-seal-vault";
  sealButton.textContent = "SEAL THE VAULT";
  sealButton.style.display = "block";
  sealButton.style.width = "100%";
  sealButton.style.marginTop = "8px";
  sealButton.style.padding = "7px 9px";
  sealButton.style.border = "1px solid rgba(174, 228, 180, 0.74)";
  sealButton.style.background = "rgba(25, 43, 30, 0.92)";
  sealButton.style.color = "#eef9f0";
  sealButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  sealButton.style.fontSize = "12px";
  sealButton.style.cursor = "pointer";

  const keyButton = document.createElement("button");
  keyButton.type = "button";
  keyButton.dataset.testid = "choice-take-crownkey";
  keyButton.textContent = "TAKE THE CROWNHEART KEY";
  keyButton.style.display = "block";
  keyButton.style.width = "100%";
  keyButton.style.marginTop = "6px";
  keyButton.style.padding = "7px 9px";
  keyButton.style.border = "1px solid rgba(170, 195, 236, 0.72)";
  keyButton.style.background = "rgba(24, 31, 46, 0.92)";
  keyButton.style.color = "#e3edfb";
  keyButton.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  keyButton.style.fontSize = "12px";
  keyButton.style.cursor = "pointer";

  root.append(title, subtitle, sealButton, keyButton);
  document.body.appendChild(root);

  let open = false;

  const close = () => {
    open = false;
    root.style.display = "none";
  };

  sealButton.addEventListener("click", () => onChoose?.(CHAPTER9_CHOICE_SEAL));
  keyButton.addEventListener("click", () => onChoose?.(CHAPTER9_CHOICE_TAKE_KEY));

  return {
    isOpen() {
      return open;
    },
    open() {
      open = true;
      root.style.display = "block";
    },
    close,
    destroy() {
      root.remove();
    },
  };
}

function createLoreVisionOverlay() {
  const root = document.createElement("div");
  root.dataset.testid = "lore-vision-overlay";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "none";
  root.style.pointerEvents = "auto";
  root.style.background = "rgba(10, 12, 18, 0.78)";
  root.style.zIndex = "36";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.padding = "18px";

  const panel = document.createElement("div");
  panel.style.width = "min(560px, 94vw)";
  panel.style.background = "rgba(18, 22, 30, 0.94)";
  panel.style.border = "2px solid rgba(179, 207, 248, 0.72)";
  panel.style.boxShadow = "0 0 0 2px rgba(26, 33, 46, 0.88) inset";
  panel.style.padding = "14px";
  panel.style.color = "#e9f3ff";
  panel.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';

  const panelTitle = document.createElement("div");
  panelTitle.dataset.testid = "lore-vision-title";
  panelTitle.style.fontSize = "13px";
  panelTitle.style.letterSpacing = "0.03em";
  panelTitle.style.opacity = "0.95";

  const panelText = document.createElement("div");
  panelText.dataset.testid = "lore-vision-text";
  panelText.style.marginTop = "8px";
  panelText.style.fontSize = "12px";
  panelText.style.lineHeight = "1.4";
  panelText.style.color = "#d6e7ff";

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.dataset.testid = "lore-vision-continue";
  continueButton.textContent = "Continue";
  continueButton.style.display = "block";
  continueButton.style.marginTop = "12px";
  continueButton.style.width = "100%";
  continueButton.style.padding = "7px 9px";
  continueButton.style.border = "1px solid rgba(172, 204, 242, 0.74)";
  continueButton.style.background = "rgba(28, 44, 70, 0.9)";
  continueButton.style.color = "#f2f7ff";
  continueButton.style.fontSize = "12px";
  continueButton.style.cursor = "pointer";

  panel.append(panelTitle, panelText, continueButton);
  root.append(panel);
  document.body.appendChild(root);

  let open = false;
  let queue = [];
  let index = 0;
  let onComplete = null;

  function close() {
    open = false;
    queue = [];
    index = 0;
    onComplete = null;
    root.style.display = "none";
    panelTitle.textContent = "";
    panelText.textContent = "";
  }

  function render() {
    const entry = queue[index] ?? null;
    if (!entry) {
      const done = onComplete;
      close();
      done?.();
      return;
    }
    panelTitle.textContent = String(entry.title ?? "VISION");
    panelText.textContent = String(entry.text ?? "");
  }

  continueButton.addEventListener("click", () => {
    if (!open) return;
    index += 1;
    render();
  });

  return {
    isOpen() {
      return open;
    },
    play(entries = [], { onDone = null } = {}) {
      queue = Array.isArray(entries) ? entries.filter(Boolean) : [];
      index = 0;
      onComplete = typeof onDone === "function" ? onDone : null;
      if (!queue.length) {
        close();
        onComplete?.();
        return false;
      }
      open = true;
      root.style.display = "flex";
      render();
      return true;
    },
    advance() {
      if (!open) return false;
      index += 1;
      render();
      return true;
    },
    close,
    destroy() {
      root.remove();
    },
  };
}

function createCinematicPanelOverlay() {
  const TYPE_SPEED = 62;
  const root = document.createElement("div");
  root.dataset.testid = "cinematic-panel";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "none";
  root.style.pointerEvents = "auto";
  root.style.background = "radial-gradient(circle at 50% 36%, rgba(30, 40, 62, 0.66), rgba(8, 10, 16, 0.86))";
  root.style.zIndex = "37";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.padding = "16px";

  const panel = document.createElement("div");
  panel.style.position = "relative";
  panel.style.width = "min(560px, 94vw)";
  panel.style.background = "rgba(12, 18, 28, 0.94)";
  panel.style.border = "2px solid rgba(176, 204, 245, 0.74)";
  panel.style.boxShadow = "0 0 0 2px rgba(20, 28, 42, 0.9) inset";
  panel.style.padding = "14px";
  panel.style.color = "#e7f1ff";
  panel.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';

  const pulseGlyph = document.createElement("div");
  pulseGlyph.textContent = "◈";
  pulseGlyph.style.position = "absolute";
  pulseGlyph.style.top = "8px";
  pulseGlyph.style.right = "10px";
  pulseGlyph.style.fontSize = "12px";
  pulseGlyph.style.opacity = "0.58";
  pulseGlyph.style.color = "#d4e6ff";

  const panelTitle = document.createElement("div");
  panelTitle.style.fontSize = "13px";
  panelTitle.style.letterSpacing = "0.04em";
  panelTitle.style.opacity = "0.95";

  const panelText = document.createElement("div");
  panelText.style.marginTop = "8px";
  panelText.style.fontSize = "12px";
  panelText.style.lineHeight = "1.42";
  panelText.style.color = "#d4e4ff";
  panelText.style.minHeight = "54px";
  panelText.style.whiteSpace = "pre-wrap";

  const hint = document.createElement("div");
  hint.style.marginTop = "10px";
  hint.style.fontSize = "10px";
  hint.style.opacity = "0.84";
  hint.textContent = "Press Space/Enter or Tap to advance";

  panel.append(pulseGlyph, panelTitle, panelText, hint);
  root.append(panel);
  document.body.appendChild(root);

  let open = false;
  let queue = [];
  let index = 0;
  let visibleChars = 0;
  let doneCallback = null;
  let pulseTime = 0;

  function getCurrentEntry() {
    return queue[index] ?? null;
  }

  function render() {
    if (!open) {
      root.style.display = "none";
      panelTitle.textContent = "";
      panelText.textContent = "";
      return;
    }
    root.style.display = "flex";
    const entry = getCurrentEntry();
    if (!entry) return;
    const title = String(entry.title ?? "VISION");
    const text = String(entry.text ?? "");
    panelTitle.textContent = title;
    const clamped = Math.max(0, Math.min(text.length, Math.floor(visibleChars)));
    panelText.textContent = text.slice(0, clamped);
  }

  function finish() {
    const done = doneCallback;
    open = false;
    queue = [];
    index = 0;
    visibleChars = 0;
    doneCallback = null;
    pulseTime = 0;
    render();
    done?.();
  }

  function advance() {
    if (!open) return false;
    const entry = getCurrentEntry();
    if (!entry) {
      finish();
      return true;
    }
    const text = String(entry.text ?? "");
    if (visibleChars < text.length) {
      visibleChars = text.length;
      render();
      return true;
    }
    index += 1;
    const next = getCurrentEntry();
    if (!next) {
      finish();
      return true;
    }
    visibleChars = 0;
    render();
    return true;
  }

  return {
    isOpen() {
      return open;
    },
    play(entries = [], { onDone = null } = {}) {
      const nextQueue = Array.isArray(entries) ? entries.filter(Boolean) : [];
      if (nextQueue.length <= 0) {
        finish();
        return false;
      }
      open = true;
      queue = nextQueue;
      index = 0;
      visibleChars = 0;
      doneCallback = typeof onDone === "function" ? onDone : null;
      pulseTime = 0;
      render();
      return true;
    },
    update(dtSeconds) {
      if (!open) return;
      pulseTime += Math.max(0, Number(dtSeconds) || 0);
      pulseGlyph.style.opacity = `${0.42 + (0.5 + Math.sin(pulseTime * 3.2) * 0.5) * 0.34}`;
      const entry = getCurrentEntry();
      if (!entry) return;
      const text = String(entry.text ?? "");
      if (visibleChars < text.length) {
        visibleChars = Math.min(text.length, visibleChars + TYPE_SPEED * Math.max(0, Number(dtSeconds) || 0));
        render();
      }
    },
    advance,
    close() {
      finish();
    },
    destroy() {
      root.remove();
    },
  };
}

function createEndingChoicePanel({ onConfirm }) {
  const root = document.createElement("div");
  root.dataset.testid = "ending-choice-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "28px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(360px, 94vw)";
  root.style.padding = "12px";
  root.style.background = "rgba(14, 18, 24, 0.95)";
  root.style.border = "2px solid rgba(196, 220, 255, 0.75)";
  root.style.boxShadow = "0 0 0 2px rgba(20, 28, 42, 0.9) inset";
  root.style.zIndex = "38";
  root.style.display = "none";
  root.style.pointerEvents = "auto";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  root.style.color = "#eaf4ff";

  const title = document.createElement("div");
  title.textContent = "The Last Verdict";
  title.style.fontSize = "13px";
  title.style.letterSpacing = "0.03em";

  const subtitle = document.createElement("div");
  subtitle.textContent = "Choose carefully. Confirm required.";
  subtitle.style.marginTop = "4px";
  subtitle.style.fontSize = "11px";
  subtitle.style.opacity = "0.86";

  const sealButton = document.createElement("button");
  sealButton.type = "button";
  sealButton.dataset.testid = "ending-choice-seal";
  sealButton.style.display = "flex";
  sealButton.style.alignItems = "center";
  sealButton.style.gap = "8px";
  sealButton.style.width = "100%";
  sealButton.style.marginTop = "10px";
  sealButton.style.padding = "7px 8px";
  sealButton.style.border = "1px solid rgba(178, 229, 184, 0.74)";
  sealButton.style.background = "rgba(24, 43, 31, 0.9)";
  sealButton.style.color = "#ecf9ee";
  sealButton.style.cursor = "pointer";

  const sealIcon = document.createElement("img");
  sealIcon.src = "./assets/sprites/ui/choice_seal.png";
  sealIcon.alt = "";
  sealIcon.width = 16;
  sealIcon.height = 16;
  sealIcon.style.imageRendering = "pixelated";
  const sealText = document.createElement("span");
  sealText.textContent = "Seal the Crown";
  sealText.style.flex = "1";
  sealText.style.textAlign = "left";
  sealButton.append(sealIcon, sealText);

  const rewriteButton = document.createElement("button");
  rewriteButton.type = "button";
  rewriteButton.dataset.testid = "ending-choice-rewrite";
  rewriteButton.style.display = "flex";
  rewriteButton.style.alignItems = "center";
  rewriteButton.style.gap = "8px";
  rewriteButton.style.width = "100%";
  rewriteButton.style.marginTop = "6px";
  rewriteButton.style.padding = "7px 8px";
  rewriteButton.style.border = "1px solid rgba(176, 196, 244, 0.74)";
  rewriteButton.style.background = "rgba(24, 30, 45, 0.9)";
  rewriteButton.style.color = "#e8efff";
  rewriteButton.style.cursor = "pointer";

  const rewriteIcon = document.createElement("img");
  rewriteIcon.src = "./assets/sprites/ui/choice_rewrite.png";
  rewriteIcon.alt = "";
  rewriteIcon.width = 16;
  rewriteIcon.height = 16;
  rewriteIcon.style.imageRendering = "pixelated";
  const rewriteText = document.createElement("span");
  rewriteText.textContent = "Rewrite the World";
  rewriteText.style.flex = "1";
  rewriteText.style.textAlign = "left";
  rewriteButton.append(rewriteIcon, rewriteText);

  const confirmHint = document.createElement("div");
  confirmHint.dataset.testid = "ending-choice-confirm-hint";
  confirmHint.style.marginTop = "8px";
  confirmHint.style.fontSize = "10px";
  confirmHint.style.opacity = "0.9";

  root.append(title, subtitle, sealButton, rewriteButton, confirmHint);
  document.body.appendChild(root);

  let open = false;
  let selected = ENDGAME_ENDING_SEAL;
  let confirmArmed = false;
  let lastInputMode = "keyboard";

  function updateVisuals() {
    const sealSelected = selected === ENDGAME_ENDING_SEAL;
    sealButton.style.outline = sealSelected ? "2px solid rgba(222, 253, 208, 0.88)" : "none";
    sealButton.style.outlineOffset = "1px";
    rewriteButton.style.outline = !sealSelected ? "2px solid rgba(209, 224, 255, 0.9)" : "none";
    rewriteButton.style.outlineOffset = "1px";
    confirmHint.textContent = confirmArmed
      ? lastInputMode === "touch"
        ? "Tap selected option again to confirm"
        : "Press Enter again to confirm"
      : "Use A/D or Arrow keys to select, Enter to confirm";
  }

  function close() {
    open = false;
    root.style.display = "none";
    confirmArmed = false;
  }

  function setSelection(next, { fromTouch = false } = {}) {
    const normalized = String(next ?? "")
      .trim()
      .toLowerCase();
    if (normalized !== ENDGAME_ENDING_SEAL && normalized !== ENDGAME_ENDING_REWRITE) return false;
    if (selected !== normalized) {
      selected = normalized;
      confirmArmed = false;
    }
    if (fromTouch) {
      lastInputMode = "touch";
    }
    updateVisuals();
    return true;
  }

  function requestConfirm() {
    if (!open) return false;
    if (!confirmArmed) {
      confirmArmed = true;
      updateVisuals();
      return false;
    }
    const choice = selected;
    close();
    onConfirm?.(choice);
    return true;
  }

  sealButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const changed = setSelection(ENDGAME_ENDING_SEAL, { fromTouch: true });
    if (!changed) return;
    requestConfirm();
  });
  rewriteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const changed = setSelection(ENDGAME_ENDING_REWRITE, { fromTouch: true });
    if (!changed) return;
    requestConfirm();
  });

  return {
    isOpen() {
      return open;
    },
    open({ defaultChoice = ENDGAME_ENDING_SEAL } = {}) {
      open = true;
      root.style.display = "block";
      selected = defaultChoice === ENDGAME_ENDING_REWRITE ? ENDGAME_ENDING_REWRITE : ENDGAME_ENDING_SEAL;
      confirmArmed = false;
      lastInputMode = "keyboard";
      updateVisuals();
    },
    close,
    handleKey(event) {
      if (!open) return false;
      const code = String(event?.code ?? "");
      if (code === "ArrowLeft" || code === "KeyA") {
        setSelection(ENDGAME_ENDING_SEAL);
        event?.preventDefault?.();
        return true;
      }
      if (code === "ArrowRight" || code === "KeyD") {
        setSelection(ENDGAME_ENDING_REWRITE);
        event?.preventDefault?.();
        return true;
      }
      if (code === "Enter") {
        event?.preventDefault?.();
        requestConfirm();
        return true;
      }
      if (code === "Escape") {
        event?.preventDefault?.();
        close();
        return true;
      }
      return false;
    },
    select(choice) {
      return setSelection(choice);
    },
    confirm() {
      return requestConfirm();
    },
    getState() {
      return {
        open,
        selected,
        confirmArmed,
      };
    },
    destroy() {
      root.remove();
    },
  };
}

function createCreditsOverlay() {
  const root = document.createElement("div");
  root.dataset.testid = "credits-overlay";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.display = "none";
  root.style.pointerEvents = "auto";
  root.style.zIndex = "39";
  root.style.background = "rgba(8, 10, 14, 0.92)";
  root.style.padding = "22px 14px";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  root.style.color = "#e8f1ff";

  const panel = document.createElement("div");
  panel.style.maxWidth = "540px";
  panel.style.margin = "0 auto";
  panel.style.border = "1px solid rgba(175, 198, 238, 0.66)";
  panel.style.background = "rgba(18, 24, 36, 0.92)";
  panel.style.boxShadow = "0 0 0 1px rgba(26, 36, 54, 0.82) inset";
  panel.style.padding = "12px";

  const title = document.createElement("div");
  title.style.fontSize = "14px";
  title.style.letterSpacing = "0.05em";
  title.style.marginBottom = "8px";
  title.textContent = "CREDITS";

  const body = document.createElement("div");
  body.style.fontSize = "12px";
  body.style.lineHeight = "1.45";
  body.style.whiteSpace = "pre-wrap";
  body.style.minHeight = "90px";

  const hint = document.createElement("div");
  hint.style.marginTop = "10px";
  hint.style.fontSize = "10px";
  hint.style.opacity = "0.88";
  hint.textContent = "Press Space/Enter or Tap to continue";

  panel.append(title, body, hint);
  root.append(panel);
  document.body.appendChild(root);

  let open = false;
  let doneCallback = null;

  function close() {
    open = false;
    doneCallback = null;
    root.style.display = "none";
    body.textContent = "";
  }

  function advance() {
    if (!open) return false;
    const done = doneCallback;
    close();
    done?.();
    return true;
  }

  return {
    isOpen() {
      return open;
    },
    open({ lines = [], epilogues = [], ngPlusHook = "" } = {}, { onDone = null } = {}) {
      const allLines = [];
      for (const line of Array.isArray(lines) ? lines : []) {
        allLines.push(String(line ?? ""));
      }
      if (Array.isArray(epilogues) && epilogues.length > 0) {
        allLines.push("", "Epilogue");
        for (const line of epilogues) {
          allLines.push(`- ${String(line ?? "")}`);
        }
      }
      if (ngPlusHook) {
        allLines.push("", String(ngPlusHook));
      }
      body.textContent = allLines.join("\n");
      doneCallback = typeof onDone === "function" ? onDone : null;
      open = true;
      root.style.display = "block";
      return true;
    },
    advance,
    close,
    destroy() {
      root.remove();
    },
  };
}

function createElaineSpellBar({ onSpellKey }) {
  const root = document.createElement("div");
  root.id = "elaine-spellbar";
  root.dataset.testid = "elaine-spellbar";
  root.style.position = "fixed";
  root.style.right = "10px";
  root.style.top = "35%";
  root.style.display = "none";
  root.style.flexDirection = "column";
  root.style.gap = "8px";
  root.style.zIndex = "34";
  root.style.pointerEvents = "auto";
  root.style.touchAction = "none";

  const spellDefs = [
    ELAINE_SPELLS.singleHeal,
    ELAINE_SPELLS.groupHeal,
    ELAINE_SPELLS.blessing,
    ELAINE_SPELLS.resurrect,
  ];

  const buttons = spellDefs.map((spell) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.testid = `spell-${spell.key}`;
    button.textContent = spell.key.toUpperCase();
    button.style.width = "48px";
    button.style.height = "48px";
    button.style.position = "relative";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.border = "1px solid rgba(212, 240, 255, 0.92)";
    button.style.borderRadius = "10px";
    button.style.background = "rgba(159, 216, 255, 0.7)";
    button.style.color = "#0f2233";
    button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
    button.style.fontSize = "20px";
    button.style.fontWeight = "700";
    button.style.lineHeight = "1";
    button.style.boxShadow = "0 2px 8px rgba(8, 16, 28, 0.45)";
    button.style.opacity = "0.72";
    button.style.cursor = "pointer";
    button.style.userSelect = "none";
    button.style.webkitUserSelect = "none";
    button.style.padding = "0";

    const cooldownOverlay = document.createElement("div");
    cooldownOverlay.style.position = "absolute";
    cooldownOverlay.style.inset = "0";
    cooldownOverlay.style.borderRadius = "9px";
    cooldownOverlay.style.display = "none";
    cooldownOverlay.style.pointerEvents = "none";
    cooldownOverlay.style.background = "rgba(10, 18, 28, 0.22)";

    const cooldownText = document.createElement("div");
    cooldownText.style.position = "absolute";
    cooldownText.style.bottom = "3px";
    cooldownText.style.right = "5px";
    cooldownText.style.fontSize = "10px";
    cooldownText.style.fontWeight = "700";
    cooldownText.style.color = "#eff6ff";
    cooldownText.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.8)";
    cooldownText.style.display = "none";
    cooldownText.style.pointerEvents = "none";

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onSpellKey?.(spell.key);
    });

    button.append(cooldownOverlay, cooldownText);
    root.appendChild(button);
    return { spell, button, cooldownOverlay, cooldownText };
  });

  document.body.appendChild(root);

  return {
    update({ visible, mp = 0, cooldowns = {}, interactive = true }) {
      root.style.display = visible ? "flex" : "none";
      if (!visible) return;

      const availableMp = Math.max(0, Number(mp) || 0);
      for (const entry of buttons) {
        const cooldown = Math.max(0, Number(cooldowns[entry.spell.id]) || 0);
        const cooldownRatio = Math.max(0, Math.min(1, cooldown / Math.max(0.001, entry.spell.cooldownSeconds)));
        const hasMp = availableMp + 0.001 >= entry.spell.mpCost;
        const enabled = interactive && cooldown <= 0.001 && hasMp;

        entry.button.disabled = !enabled;
        entry.button.style.opacity = hasMp ? "0.72" : "0.58";
        entry.button.style.background = hasMp ? "rgba(159, 216, 255, 0.7)" : "rgba(120, 138, 154, 0.66)";
        entry.button.style.color = hasMp ? "#0f2233" : "#dce5ed";
        entry.button.style.cursor = enabled ? "pointer" : "default";
        entry.button.style.filter = hasMp ? "none" : "grayscale(0.35)";

        if (cooldown > 0.001) {
          const degrees = Math.max(2, Math.round(cooldownRatio * 360));
          entry.cooldownOverlay.style.display = "block";
          entry.cooldownOverlay.style.background = `conic-gradient(rgba(8, 16, 26, 0.7) ${degrees}deg, rgba(8, 16, 26, 0.08) ${degrees}deg 360deg)`;
          entry.cooldownText.style.display = "block";
          entry.cooldownText.textContent = `${Math.max(0, cooldown).toFixed(1)}s`;
        } else {
          entry.cooldownOverlay.style.display = "none";
          entry.cooldownText.style.display = "none";
        }
      }
    },
    destroy() {
      root.remove();
    },
  };
}

function createWillowSpellBar({ onSpellKey }) {
  const root = document.createElement("div");
  root.id = "willow-spellbar";
  root.dataset.testid = "willow-spellbar";
  root.style.position = "fixed";
  root.style.left = "10px";
  root.style.bottom = "70px";
  root.style.display = "none";
  root.style.flexDirection = "column";
  root.style.gap = "7px";
  root.style.zIndex = "34";
  root.style.pointerEvents = "auto";
  root.style.touchAction = "none";

  const spellKeys = getWillowSpellKeys();
  const entries = spellKeys.map((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.testid = `willow-spell-${key}`;
    button.style.width = "46px";
    button.style.height = "46px";
    button.style.position = "relative";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.border = "1px solid rgba(186, 224, 255, 0.92)";
    button.style.borderRadius = "10px";
    button.style.background = "rgba(117, 168, 222, 0.68)";
    button.style.color = "#071524";
    button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
    button.style.fontSize = "11px";
    button.style.fontWeight = "700";
    button.style.lineHeight = "1";
    button.style.boxShadow = "0 2px 8px rgba(8, 16, 28, 0.45)";
    button.style.opacity = "0.76";
    button.style.cursor = "pointer";
    button.style.userSelect = "none";
    button.style.webkitUserSelect = "none";
    button.style.padding = "0";

    const icon = document.createElement("div");
    icon.style.fontSize = "14px";
    icon.style.fontWeight = "700";
    icon.style.marginTop = "2px";
    icon.textContent = key.toUpperCase();

    const keyLabel = document.createElement("div");
    keyLabel.style.position = "absolute";
    keyLabel.style.left = "4px";
    keyLabel.style.bottom = "3px";
    keyLabel.style.fontSize = "9px";
    keyLabel.style.opacity = "0.86";
    keyLabel.textContent = key.toUpperCase();

    const cooldownOverlay = document.createElement("div");
    cooldownOverlay.style.position = "absolute";
    cooldownOverlay.style.inset = "0";
    cooldownOverlay.style.borderRadius = "9px";
    cooldownOverlay.style.display = "none";
    cooldownOverlay.style.pointerEvents = "none";
    cooldownOverlay.style.background = "rgba(8, 16, 26, 0.35)";

    const cooldownText = document.createElement("div");
    cooldownText.style.position = "absolute";
    cooldownText.style.right = "4px";
    cooldownText.style.bottom = "3px";
    cooldownText.style.fontSize = "9px";
    cooldownText.style.fontWeight = "700";
    cooldownText.style.color = "#eff6ff";
    cooldownText.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.8)";
    cooldownText.style.display = "none";
    cooldownText.style.pointerEvents = "none";

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onSpellKey?.(key);
    });

    button.append(icon, keyLabel, cooldownOverlay, cooldownText);
    root.appendChild(button);
    return { key, button, icon, keyLabel, cooldownOverlay, cooldownText };
  });

  document.body.appendChild(root);

  return {
    update({ visible, stance = "ruby", mp = 0, cooldowns = {}, interactive = true }) {
      root.style.display = visible ? "flex" : "none";
      if (!visible) return;
      const spellSet = getWillowSpellSet(stance);
      const availableMp = Math.max(0, Number(mp) || 0);
      for (const entry of entries) {
        const spell = spellSet[entry.key];
        if (!spell) continue;
        const cooldown = Math.max(0, Number(cooldowns[entry.key]) || 0);
        const cooldownRatio = Math.max(0, Math.min(1, cooldown / Math.max(0.001, spell.cooldownSeconds)));
        const hasMp = availableMp + 0.001 >= spell.mpCost;
        const enabled = interactive && cooldown <= 0.001 && hasMp;

        entry.button.disabled = !enabled;
        entry.button.style.cursor = enabled ? "pointer" : "default";
        entry.button.style.opacity = hasMp ? "0.76" : "0.58";
        entry.button.style.filter = hasMp ? "none" : "grayscale(0.4)";
        entry.button.style.background = hasMp ? "rgba(117, 168, 222, 0.68)" : "rgba(108, 122, 136, 0.66)";
        entry.icon.textContent = spell.icon;
        entry.icon.style.color = spell.color;
        entry.keyLabel.style.color = hasMp ? "#d9eeff" : "#cdd8e2";
        entry.button.title = `${spell.name} (${spell.mpCost} MP)`;

        if (cooldown > 0.001) {
          const degrees = Math.max(2, Math.round(cooldownRatio * 360));
          entry.cooldownOverlay.style.display = "block";
          entry.cooldownOverlay.style.background = `conic-gradient(rgba(8, 16, 26, 0.72) ${degrees}deg, rgba(8, 16, 26, 0.08) ${degrees}deg 360deg)`;
          entry.cooldownText.style.display = "block";
          entry.cooldownText.textContent = `${cooldown.toFixed(1)}s`;
        } else {
          entry.cooldownOverlay.style.display = "none";
          entry.cooldownText.style.display = "none";
        }
      }
    },
    destroy() {
      root.remove();
    },
  };
}

function createWillowAutoStanceToggle({ onToggle }) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.testid = "toggle-willow-auto-stance";
  button.style.position = "fixed";
  button.style.left = "10px";
  button.style.bottom = "272px";
  button.style.width = "108px";
  button.style.height = "32px";
  button.style.display = "none";
  button.style.padding = "4px 6px";
  button.style.border = "1px solid rgba(171, 212, 237, 0.88)";
  button.style.borderRadius = "8px";
  button.style.background = "rgba(38, 63, 84, 0.76)";
  button.style.color = "#d9f0ff";
  button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  button.style.fontSize = "10px";
  button.style.lineHeight = "1.1";
  button.style.boxShadow = "0 2px 8px rgba(7, 14, 24, 0.45)";
  button.style.zIndex = "34";
  button.style.pointerEvents = "auto";
  button.style.touchAction = "none";
  button.textContent = "Auto Stance ON";

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggle?.();
  });

  document.body.appendChild(button);

  return {
    update({ visible, enabled = true } = {}) {
      button.style.display = visible ? "block" : "none";
      if (visible) {
        button.textContent = enabled ? "Auto Stance ON" : "Auto Stance OFF";
        button.style.background = enabled ? "rgba(38, 63, 84, 0.76)" : "rgba(65, 56, 72, 0.76)";
      }
    },
    destroy() {
      button.remove();
    },
  };
}

function createTacticsToggleButton({ onToggle }) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.testid = "tactics-toggle";
  button.style.position = "fixed";
  button.style.right = "10px";
  button.style.top = "64%";
  button.style.width = "54px";
  button.style.height = "44px";
  button.style.display = "none";
  button.style.padding = "4px 6px";
  button.style.border = "1px solid rgba(202, 232, 255, 0.88)";
  button.style.borderRadius = "8px";
  button.style.background = "rgba(118, 160, 184, 0.72)";
  button.style.color = "#eff7ff";
  button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  button.style.fontSize = "10px";
  button.style.lineHeight = "1.1";
  button.style.boxShadow = "0 2px 8px rgba(7, 14, 24, 0.45)";
  button.style.zIndex = "34";
  button.style.pointerEvents = "auto";
  button.style.touchAction = "none";
  button.textContent = "Mode";
  button.title = "Cycle tactics";

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggle?.();
  });

  document.body.appendChild(button);

  return {
    update({ visible, modeLabel = "Balanced" }) {
      button.style.display = visible ? "block" : "none";
      if (visible) {
        button.textContent = `Mode\n${modeLabel}`;
      }
    },
    destroy() {
      button.remove();
    },
  };
}

function createPartyPortraitBar({ onSelect, onLongSelect }) {
  const root = document.createElement("div");
  root.dataset.testid = "party-portraits";
  root.style.position = "fixed";
  root.style.left = "10px";
  root.style.bottom = "12px";
  root.style.display = "none";
  root.style.flexDirection = "row";
  root.style.gap = "8px";
  root.style.zIndex = "34";
  root.style.pointerEvents = "auto";
  root.style.touchAction = "none";

  function makePortrait(id, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.testid = `portrait-${id}`;
    button.textContent = label;
    button.style.width = "44px";
    button.style.height = "44px";
    button.style.border = "1px solid rgba(198, 219, 232, 0.88)";
    button.style.borderRadius = "9px";
    button.style.background = "rgba(30, 47, 56, 0.72)";
    button.style.color = "#ddeaf2";
    button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
    button.style.fontSize = "10px";
    button.style.fontWeight = "700";
    button.style.lineHeight = "1.1";
    button.style.boxShadow = "0 2px 8px rgba(7, 14, 24, 0.45)";
    button.style.padding = "0";
    button.style.cursor = "pointer";

    let longPressTimer = null;
    let longPressTriggered = false;
    const clearLongPress = () => {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggered = false;
      clearLongPress();
      if (id === "willow" && typeof onLongSelect === "function") {
        longPressTimer = window.setTimeout(() => {
          longPressTriggered = true;
          onLongSelect(id);
        }, 450);
      }
    });
    button.addEventListener("pointerup", clearLongPress);
    button.addEventListener("pointercancel", clearLongPress);
    button.addEventListener("pointerleave", clearLongPress);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (longPressTriggered) {
        longPressTriggered = false;
        return;
      }
      onSelect?.(id);
    });
    return button;
  }

  const arthur = makePortrait("arthur", "AR");
  const elaine = makePortrait("elaine", "EL");
  const willow = makePortrait("willow", "WI");
  root.append(arthur, elaine, willow);
  document.body.appendChild(root);

  return {
    update({ visible, activeCharacterId = "arthur", elaineAvailable = false, willowAvailable = false }) {
      root.style.display = visible ? "flex" : "none";
      if (!visible) return;

      const highlight = (button, active) => {
        button.style.background = active ? "rgba(143, 197, 225, 0.82)" : "rgba(30, 47, 56, 0.72)";
        button.style.color = active ? "#102332" : "#ddeaf2";
      };

      elaine.disabled = !elaineAvailable;
      elaine.style.opacity = elaineAvailable ? "1" : "0.6";
      elaine.style.cursor = elaineAvailable ? "pointer" : "default";
      willow.style.display = willowAvailable ? "block" : "none";
      willow.disabled = !willowAvailable;
      willow.style.opacity = willowAvailable ? "1" : "0.6";
      willow.style.cursor = willowAvailable ? "pointer" : "default";
      highlight(arthur, activeCharacterId === "arthur");
      highlight(elaine, activeCharacterId === "elaine");
      highlight(willow, activeCharacterId === "willow");
    },
    destroy() {
      root.remove();
    },
  };
}

function createTapRipple(clientX, clientY) {
  const ripple = document.createElement("div");
  ripple.style.position = "fixed";
  ripple.style.left = `${clientX}px`;
  ripple.style.top = `${clientY}px`;
  ripple.style.width = "14px";
  ripple.style.height = "14px";
  ripple.style.border = "1px solid rgba(187, 247, 208, 0.75)";
  ripple.style.borderRadius = "999px";
  ripple.style.pointerEvents = "none";
  ripple.style.transform = "translate(-50%, -50%) scale(1)";
  ripple.style.opacity = "0.78";
  ripple.style.zIndex = "12";
  ripple.style.transition = "transform 260ms ease-out, opacity 260ms ease-out";
  document.body.appendChild(ripple);

  requestAnimationFrame(() => {
    ripple.style.transform = "translate(-50%, -50%) scale(2.1)";
    ripple.style.opacity = "0";
  });

  window.setTimeout(() => ripple.remove(), 280);
}

const pointerToNdc = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const movementPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const projectedPoint = new THREE.Vector3();
const planeHit = new THREE.Vector3();
const playerXZ = new THREE.Vector2();
const pulseCenter = new THREE.Vector2();

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  pointerToNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerToNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointerToNdc, camera);
  if (!raycaster.ray.intersectPlane(movementPlane, planeHit)) {
    return null;
  }

  return new THREE.Vector2(planeHit.x, planeHit.z);
}

function worldToScreen(worldX, worldZ) {
  const rect = canvas.getBoundingClientRect();
  projectedPoint.set(worldX, 0, worldZ).project(camera);
  return {
    x: rect.left + ((projectedPoint.x + 1) * 0.5) * rect.width,
    y: rect.top + ((1 - projectedPoint.y) * 0.5) * rect.height,
  };
}

const world = new WorldState(
  REGIONS.map((region) => ({
    id: region.id,
    name: region.displayName,
  }))
);
const saveState = new SaveState();
const crownMood = new CrownMoodState({
  initialMood: saveState.getCrownMoodScore?.() ?? 0,
});
const statusEffects = new StatusEffectManager({ initialTimeSeconds: 0 });
const vaelorisPressureSystem = new VaelorisPressureSystem();
const eventRunner = new WorldEventRunner();
const hud = createHud({ version: GAME_VERSION });
const sceneDebugOverlay = createSceneDebugOverlay();
const dialogueBox = createDialogueBox();
const footstepSystem = createFootstepSystem(scene);
const ambientMoteSystem = createAmbientMoteSystem(scene);
const pulsePresentation = createPulsePresentationSystem(scene);
const introTextBeat = createIntroTextBeat();
const damageTintOverlay = createDamageTintOverlay();
const audioBus = new AudioBus();
const anomalySystem = new VerdantAnomalySystem({
  threeScene: scene,
  nextFloat,
  nextInt,
});
const sceneManager = new SceneManager({
  threeScene: scene,
  saveState,
  rng: { nextInt },
});

const initialSpawnPosition = sceneManager.loadInitialScene(saveState.getLastSceneId());
let currentSceneInfo = sceneManager.getCurrentSceneInfo();
if (currentSceneInfo.sceneId === "region3_seed" || currentSceneInfo.sceneId === "windward") {
  setStoryValue("region3_seed_entered", true);
}
if (currentSceneInfo.sceneId === "region4_seed") {
  setStoryValue("region4_seed_entered", true);
}
world.setActiveRegion(currentSceneInfo.regionId, currentSceneInfo.regionName);
cameraFollowTarget.set(initialSpawnPosition.x, 0, initialSpawnPosition.y);
camera.position.set(initialSpawnPosition.x, CAMERA_HEIGHT, initialSpawnPosition.y + CAMERA_DISTANCE);
camera.lookAt(initialSpawnPosition.x, CAMERA_LOOK_Y, initialSpawnPosition.y);

const damageSystem = new DamageSystem();
const combatSystem = new CombatSystem({
  threeScene: scene,
  damageSystem,
  devMode: DEV_MODE,
});
combatSystem.setDamageResolver((payload) => resolveDamageWithStatus(payload));
combatSystem.loadScene(currentSceneInfo.sceneId, sceneManager.getEnemySpawns());

const pacingDirector = new PacingDirector();
initThreatVeinsForScene(currentSceneInfo.sceneId, currentRngSeed, {
  threeScene: scene,
  saveState,
});
maybeStartHollowScarPulse();
maybeStartClassicIntroTextBeat();
syncSceneMusic(currentSceneInfo.sceneId);
if (isPlayableScene(currentSceneInfo.sceneId)) {
  saveState.setSafeSpot(currentSceneInfo.sceneId, {
    x: initialSpawnPosition.x,
    z: initialSpawnPosition.y,
  });
}
const playerState = new PlayerState({
  maxHP: PLAYER_MAX_HEALTH,
  invulnWindowMs: PLAYER_INVULN_WINDOW_MS,
});
let activePartyMember = "arthur";
let arthurDowned = false;
let arthurBleedoutRemaining = 0;
let elaineHp = ELAINE_MAX_HEALTH;
let elaineMaxHp = ELAINE_MAX_HEALTH;
let elaineDowned = false;
let elaineBleedoutRemaining = 0;
let elaineInvulnRemaining = 0;
let elaineMp = ELAINE_MP_MAX;
let elaineMaxMp = ELAINE_MP_MAX;
let elaineSpellCast = null;
let elaineInterruptLockRemaining = 0;
let willowMp = WILLOW_MP_MAX;
let willowMaxMp = WILLOW_MP_MAX;
const willowSpellCooldowns = {
  h: 0,
  j: 0,
  k: 0,
  l: 0,
};
const willowPendingCasts = [];
let willowAutoBanterCooldown = 0;
let willowJoinedCached = Boolean(saveState.getStoryFlag("willow_joined") ?? saveState.getFlag("story.willow_joined"));
let willowJoinToastShown = willowJoinedCached;
const elaineSpellCooldowns = {
  [ELAINE_SPELLS.singleHeal.id]: 0,
  [ELAINE_SPELLS.groupHeal.id]: 0,
  [ELAINE_SPELLS.blessing.id]: 0,
  [ELAINE_SPELLS.resurrect.id]: 0,
};
let playerUpgrades = resolvePlayerUpgrades(saveState.getPlayerUpgrades?.());
let relicShardCount = saveState.getRelicShards?.() ?? 0;
let vaelorisChoice = String(
  saveState.getStoryFlag("vaeloris_first_choice") ?? saveState.getFlag("story.vaeloris_first_choice") ?? ""
);
if (vaelorisChoice !== VAELORIS_CHOICE_VALUES.DISABLE && vaelorisChoice !== VAELORIS_CHOICE_VALUES.LEAVE) {
  vaelorisChoice = VAELORIS_CHOICE_VALUES.NONE;
}
let harvesterChoice = getHarvesterChoice();
let listeningSpikeChoice = getListeningSpikeChoice();
let vaelorisPressureStage = getVaelorisPressureStage();
if (vaelorisPressureStage < 1) {
  vaelorisPressureStage = 1;
  setVaelorisPressureStage(1);
}
let vaelorisPatrolFrame = {
  stage: vaelorisPressureStage,
  active: false,
  spawned: false,
  firstCleared: false,
  tagAwarded: false,
  cooldownRemaining: 0,
  enemyIds: [],
  insideZone: false,
};
let act2FalloutPending = null;
let rowanCouncilPending = null;
let chapter2ArrivalPending = null;
let chapter3DebriefPending = null;
let chapter4RowanReportPending = null;
let chapter5AftershockPending = null;
let chapter6ArrivalPending = null;
let chapter6WaystoneLorePending = null;
let chapter8AftermathPending = null;
let chapter9StartPending = null;
let chapter9LoreVisionPending = null;
let endgameAct1StartPending = null;
let endgameAct2StartPending = null;
let endgameAct2LorePending = null;
let endgameAct3StartPending = null;
let endgameAct3LorePanelsPending = null;
let endgameAct3EndingPending = null;
let willowMeetPending = null;
const willowAmbushState = {
  active: false,
  center: new THREE.Vector2(0, 0),
  radius: 0,
  enemyIds: [],
  boundsToastCooldown: 0,
};
const listeningSpikeSetpieceState = {
  active: false,
  center: new THREE.Vector2(0, 0),
  radius: 0,
  enemyIds: [],
  boundsToastCooldown: 0,
};
const ridgePatrolSetpieceState = {
  active: false,
  center: new THREE.Vector2(0, 0),
  radius: 1.9,
  enemyIds: [],
  boundsToastCooldown: 0,
};
const chapter6RelaySetpieceState = {
  active: false,
  center: new THREE.Vector2(0, 0),
  radius: 2.4,
  enemyIds: [],
  tethers: [],
  boundsToastCooldown: 0,
};
const chapter8RetaliationSetpieceState = {
  active: false,
  center: new THREE.Vector2(0, 0),
  radius: 2.35,
  silenceRadius: 1.18,
  enemyIds: [],
  spikes: [],
  boundsToastCooldown: 0,
  silenceGraceByEntity: {
    [STATUS_ENTITY_IDS.ARTHUR]: 0,
    [STATUS_ENTITY_IDS.ELAINE]: 0,
    [STATUS_ENTITY_IDS.WILLOW]: 0,
  },
  silenceRings: [],
  wardMarkers: [],
};
const chapter9SetpieceState = {
  active: false,
  started: false,
  center: new THREE.Vector2(0, 0),
  radius: 2.48,
  anchors: [],
  spires: [],
  shards: [],
  anchorCooldowns: [0, 0, 0],
  channeling: null,
  sunderActive: false,
  sunderMeter: 0,
  sunderFillRate: CHAPTER9_SUNDER_FILL_PER_SECOND,
  sunderFillSlowRemaining: 0,
  sunderWaves: 0,
  failures: 0,
  checkpoint: null,
  waveFxSeconds: 0,
  waveFxScale: 0.2,
  bossStarted: false,
  bossArena: null,
  echoNodes: [],
  erasePulseTimer: 7.8,
  nullFields: [],
  nullFieldTimer: 0,
  memoryCollapseTimer: 0,
  memoryCollapseTelegraph: null,
  memoryCollapseResolveTimer: 0,
  shortCalloutCooldown: 0,
  lorePending: false,
  choicePending: false,
};
const thirdSealQuestState = {
  active: false,
  started: false,
  center: new THREE.Vector2(0, 0),
  radius: 2.1,
  checkpoint: null,
  enemyIds: [],
  custodianId: "",
  miniBossSpawned: false,
  attuneReady: false,
  attuned: false,
  channeling: null,
  retryCooldown: 0,
  hazardSpires: [],
  shortCalloutCooldown: 0,
  lorePending: false,
};
const spireBreachState = {
  active: false,
  started: false,
  center: new THREE.Vector2(0, 0),
  radius: 2.62,
  checkpoint: null,
  enemyIds: [],
  lockNodes: [],
  nodeCooldowns: [0, 0, 0],
  channeling: null,
  meterActive: false,
  meter: 0,
  fillRate: BREACH_FILL_PER_SECOND,
  fillSlowRemaining: 0,
  discharges: 0,
  waveFxSeconds: 0,
  bossStarted: false,
  shortCalloutCooldown: 0,
  coverPillars: [],
  nullClampZones: [],
  overloadTelegraph: null,
  overloadResolveTimer: 0,
  overloadTimer: 0,
  nullClampTimer: 0,
};
const memoryPressureTracker = createMemoryPressureTracker({
  fillPerSecond: MEMORY_PRESSURE_FILL_PER_SECOND,
  reliefAmount: MEMORY_PRESSURE_RELIEF,
  slowSecondsOnRelief: MEMORY_PRESSURE_SLOW_SECONDS,
  slowedFillMultiplier: MEMORY_PRESSURE_SLOWED_MULTIPLIER,
  thresholds: MEMORY_PRESSURE_THRESHOLDS,
});
const innerSpireState = {
  active: false,
  initialized: false,
  lockChanneling: false,
  pressureTierEvents: [],
  pressureEnemyIds: [],
  shortCalloutCooldown: 0,
  loomBossStarted: false,
  loomCenter: new THREE.Vector2(2.18, 0.22),
  loomRadius: 2.58,
  weaveCutTimer: LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL,
  weaveCutResolveTimer: 0,
  weaveCutTelegraph: null,
  fissures: [],
  prismPillars: [],
  memoryTaxTimer: LOOM_PROCTOR_MEMORY_TAX_INTERVAL,
  lorePending: false,
};
const lastSpireState = {
  active: false,
  initialized: false,
  riftActive: false,
  riftStarted: false,
  riftCenter: new THREE.Vector2(-1.18, 0.08),
  riftRadius: 1.24,
  riftTriggerRadius: 1.18,
  riftAnchors: [],
  riftAnchorCooldowns: [0, 0, 0],
  riftChanneling: null,
  riftStability: RIFT_STABILITY_START,
  riftShockwaves: 0,
  riftEnemyIds: [],
  riftCheckpoint: null,
  riftWaveFxSeconds: 0,
  riftWaveFxScale: 0.22,
  coreActive: false,
  coreStarted: false,
  coreCenter: new THREE.Vector2(2.46, -0.34),
  coreRadius: 2.72,
  coreTriggerRadius: 1.18,
  coreCheckpoint: null,
  finalClamps: [],
  finalClampCooldowns: [0, 0, 0],
  coreChanneling: null,
  coreEnemyIds: [],
  coreCoverPillars: [],
  enginePulseTimer: CORE_ENGINE_PULSE_INTERVAL,
  enginePulseResolveTimer: 0,
  bossStarted: false,
  narratorPhase: "",
  narratorLineTimer: NARRATOR_LINE_INTERVAL_P1,
  narratorLineResolveTimer: 0,
  narratorLineTelegraph: null,
  narratorShockwaveTimer: NARRATOR_SHOCKWAVE_INTERVAL_P2,
  narratorShockwaveResolveTimer: 0,
  narratorRewriteMarkTimer: NARRATOR_REWRITE_MARK_INTERVAL,
  narratorChoiceReady: false,
  shortCalloutCooldown: 0,
  lorePanelsShown: false,
  phase2CalloutDone: false,
  phase3CalloutDone: false,
};
let vaelorisFieldTriggered = Boolean(
  saveState.getStoryFlag(VAELORIS_FIELD_TRIGGER_FLAG) ?? saveState.getFlag(`story.${VAELORIS_FIELD_TRIGGER_FLAG}`)
);
let playerHeavyDamageMultiplier = 1;
const playerKnockbackVelocity = new THREE.Vector2(0, 0);
const playerAttackNudgeDirection = new THREE.Vector2(0, 1);
let playerHitFlashRemaining = 0;
let playerHitTintRemaining = 0;
let playerHitNudgeRemaining = 0;
let hasShownPlayerHitToast = false;
let nearDeathLatched = false;
let stabilityToastText = "";
let stabilityToastSeconds = 0;
let veinDroneActive = false;
let cameraZoomScalar = 1;
let safeSpotWriteAccumulator = 0;
let swordWalkBobTimer = 0;
let swordAttackType = "";
let swordAttackElapsed = 0;
let swordAttackDuration = 0;
let swordAttackChargeRatio = 0;
let swordAttackDirection = "down";
let swordAttackFollowThroughHold = 0;
let elaineBoltCastFlashRemaining = 0;
let willowSpellCastFlashRemaining = 0;
let activeWeaponKey = "arthur_sword";
let activeWeaponGlowKey = "pearl_glow";
let activeWeaponMounted = true;
let lastAttackTypePlayed = "";
let lastRenderedAnimState = "idle";
let lastPlayerMeleeEventCount = 0;
const weaponTextureCache = new Map();

const fallbackPlayerTexture = createProceduralPlayerSpriteSheetTexture();
const playerMaterial = new THREE.SpriteMaterial({
  map: fallbackPlayerTexture,
  transparent: true,
});
const player = new THREE.Sprite(playerMaterial);
player.position.set(initialSpawnPosition.x, 0, initialSpawnPosition.y);
player.scale.set(PLAYER_SPRITE_WORLD_WIDTH * CHARACTER_SCALE, PLAYER_SPRITE_WORLD_HEIGHT * CHARACTER_SCALE, 1);
player.center.set(0.5, 0.22);
scene.add(player);

const playerOutlineMaterial = new THREE.SpriteMaterial({
  map: fallbackPlayerTexture,
  transparent: true,
  color: "#11161d",
  opacity: 0.62,
  depthWrite: false,
});
const playerOutline = new THREE.Sprite(playerOutlineMaterial);
playerOutline.position.copy(player.position);
playerOutline.scale.set(2.52 * CHARACTER_SCALE, 3.34 * CHARACTER_SCALE, 1);
playerOutline.center.copy(player.center);
scene.add(playerOutline);

const playerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.52 * CHARACTER_SCALE, 24),
  new THREE.MeshBasicMaterial({
    color: "#000000",
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  })
);
playerShadow.rotation.x = -Math.PI / 2;
playerShadow.position.set(initialSpawnPosition.x, -0.885, initialSpawnPosition.y);
scene.add(playerShadow);

let playerAnimator = new SpriteAnimator({
  texture: fallbackPlayerTexture,
  frameWidth: PLAYER_SPRITE_FRAME_WIDTH,
  frameHeight: PLAYER_SPRITE_FRAME_HEIGHT,
});
let lastSpriteFrame = playerAnimator.getFrameData();
const activeWeaponMaterial = new THREE.SpriteMaterial({
  map: createWeaponFallbackTexture("arthur_sword"),
  transparent: true,
  alphaTest: 0.08,
  depthWrite: false,
});
const activeWeaponSprite = new THREE.Sprite(activeWeaponMaterial);
activeWeaponSprite.center.set(0.5, 0.5);
activeWeaponSprite.position.set(0.28, 0.14, 0.03);
activeWeaponSprite.scale.set(0.96, 0.96, 1);
player.add(activeWeaponSprite);

const activeWeaponGlowMaterial = new THREE.SpriteMaterial({
  map: createWeaponFallbackTexture("pearl_glow"),
  transparent: true,
  alphaTest: 0.02,
  depthWrite: false,
  opacity: 0,
});
const activeWeaponGlowSprite = new THREE.Sprite(activeWeaponGlowMaterial);
activeWeaponGlowSprite.center.set(0.5, 0.5);
activeWeaponGlowSprite.position.set(0.2, 0.3, 0.04);
activeWeaponGlowSprite.scale.set(0.34, 0.34, 1);
activeWeaponGlowSprite.visible = false;
player.add(activeWeaponGlowSprite);

const activeWeaponGemMaterial = new THREE.SpriteMaterial({
  transparent: true,
  alphaTest: 0.01,
  depthWrite: false,
  opacity: 0,
});
const activeWeaponGemSprite = new THREE.Sprite(activeWeaponGemMaterial);
activeWeaponGemSprite.center.set(0.5, 0.5);
activeWeaponGemSprite.position.set(0.18, 0.24, 0.05);
activeWeaponGemSprite.scale.set(0.1, 0.1, 1);
activeWeaponGemSprite.visible = false;
player.add(activeWeaponGemSprite);

const vfxSystem = new VfxSystem({ threeScene: scene });
const bossInstance = new BossInstance({
  threeScene: scene,
  combatSystem,
  damageSystem,
  vfxSystem,
  audioBus,
  worldState: world,
  saveState,
  getPartyMembers: () => partySystem.getState().members ?? [],
  getPlayerPosition: () => new THREE.Vector2(player.position.x, player.position.z),
  getRegionName: () => currentSceneInfo.regionName,
  setStoryFlag: (flagKey, value) => setStoryFlag(flagKey, Boolean(value)),
  setTransientMessage: (message, durationSeconds = 1.4) =>
    setTransientMessage(message, durationSeconds),
  grantRelicShards: (amount = 1) => {
    const delta = Math.max(0, Math.floor(Number(amount) || 0));
    relicShardCount = saveState.addRelicShards?.(delta) ?? relicShardCount + delta;
    return relicShardCount;
  },
  onBossOutcome: (outcome, payload = {}) => {
    const resolvedOutcome = String(outcome ?? "");
    const bossId = String(payload?.bossId ?? "");
    if (resolvedOutcome === "victory" && bossId === CROWN_MANIFESTATION_BOSS_ID) {
      adjustCrownMood(CROWN_MOOD_GUARDIAN_DEFEATED_DELTA, "vein_guardian_defeated");
    }
    if (resolvedOutcome === "victory" && bossId === HARVESTER_WARDEN_BOSS_ID) {
      setHarvesterBossDefeated(true);
      setHarvesterBossActive(false);
      harvesterChoice = getHarvesterChoice();
      if (harvesterChoice === HARVESTER_CHOICE_VALUES.NONE) {
        harvesterChoicePanel.open();
        setTransientMessage("The core is exposed. Choose quickly.", 1.4);
      }
    }
    if (resolvedOutcome === "victory" && bossId === NULL_ARCHIVIST_BOSS_ID) {
      setChapter9NullArchivistDefeated(true);
      chapter9SetpieceState.active = false;
      chapter9SetpieceState.sunderActive = true;
      chapter9SetpieceState.sunderMeter = Math.max(0.2, chapter9SetpieceState.sunderMeter * 0.6);
      queueChapter9LoreVision({ force: true });
      setCurrentObjectiveId(OBJECTIVE_IDS.MAKE_VAULT_CHOICE);
      refreshQuestText();
    }
    if (resolvedOutcome === "victory" && bossId === SPIRE_GATEWARDEN_BOSS_ID) {
      setEndgameGatewardenDefeated(true);
      setEndgameSpireEntryUnlocked(true);
      setStoryFlag("endgame_spire_gatewarden_active", false);
      spireBreachState.bossStarted = false;
      spireBreachState.meterActive = false;
      clearSpireNullClampZones();
      gatewardenOverloadRing.visible = false;
      setCurrentObjectiveId(OBJECTIVE_IDS.ENTER_OUTER_SPIRE);
      refreshQuestText();
      setTransientMessage("Gatewarden down. The Spire stands open.", 1.45);
    }
    if (resolvedOutcome === "victory" && bossId === LOOM_PROCTOR_BOSS_ID) {
      setEndgameLoomProctorDefeated(true);
      setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
      innerSpireState.loomBossStarted = false;
      innerSpireState.active = true;
      memoryPressureTracker.setActive(false, { resetValue: true });
      queueEndgameAct2LoreVision({ force: true });
      setCurrentObjectiveId(OBJECTIVE_IDS.APPROACH_LAST_DOOR);
      refreshQuestText();
      setTransientMessage("Loom Proctor down. The Last Door responds.", 1.45);
    }
    if (resolvedOutcome === "victory" && bossId === NARRATOR_CROWN_BOSS_ID) {
      setEndgameFinalBossDefeated(true);
      setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
      lastSpireState.bossStarted = false;
      lastSpireState.narratorChoiceReady = true;
      lastSpireState.narratorLineResolveTimer = 0;
      lastSpireState.narratorShockwaveResolveTimer = 0;
      lastSpireState.narratorLineTelegraph = null;
      narratorShockwaveRing.visible = false;
      setCurrentObjectiveId(OBJECTIVE_IDS.CHOOSE_ENDING);
      refreshQuestText();
      setTransientMessage("Narrator Crown shattered. The altar is yours.", 1.55);
      emitLastSpireCallout("Arthur: Hold formation. Verdict at the altar.");
    }
    if (resolvedOutcome !== "victory" && bossId === HARVESTER_WARDEN_BOSS_ID) {
      setHarvesterBossActive(false);
    }
    if (resolvedOutcome !== "victory" && bossId === NULL_ARCHIVIST_BOSS_ID) {
      chapter9SetpieceState.bossStarted = false;
    }
    if (resolvedOutcome !== "victory" && bossId === SPIRE_GATEWARDEN_BOSS_ID) {
      setStoryFlag("endgame_spire_gatewarden_active", false);
      spireBreachState.bossStarted = false;
      clearSpireNullClampZones();
      gatewardenOverloadRing.visible = false;
    }
    if (resolvedOutcome !== "victory" && bossId === LOOM_PROCTOR_BOSS_ID) {
      setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
      innerSpireState.loomBossStarted = false;
      innerSpireState.weaveCutResolveTimer = 0;
      innerSpireState.weaveCutTelegraph = null;
      clearLoomPrismPillars();
      clearLoomFissures();
    }
    if (resolvedOutcome !== "victory" && bossId === NARRATOR_CROWN_BOSS_ID) {
      setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
      lastSpireState.bossStarted = false;
      lastSpireState.narratorLineResolveTimer = 0;
      lastSpireState.narratorShockwaveResolveTimer = 0;
      lastSpireState.narratorLineTelegraph = null;
      narratorShockwaveRing.visible = false;
    }
  },
  applyStatusEffect: ({ targetId = "", effectId = "", durationSeconds = 1, sourceId = "boss" } = {}) => {
    const resolvedTargetId = String(targetId ?? "").trim();
    const resolvedEffectId = String(effectId ?? "").trim();
    if (!resolvedTargetId || !resolvedEffectId) return false;
    const added = statusEffects.addEffect(resolvedTargetId, {
      id: resolvedEffectId,
      durationSeconds: Math.max(0.05, Number(durationSeconds) || 0.05),
      sourceId: String(sourceId ?? "boss"),
    });
    return Boolean(added);
  },
  onRespawnPlayer: () => {
    if (!playerState.isDepleted()) {
      respawnPlayerAfterDefeat();
    }
  },
  initialSeed: currentRngSeed,
});

// If a sprite asset exists, use it; otherwise keep the generated placeholder.
loadPixelSpriteTexture("./assets/sprites/arthur_placeholder.png", fallbackPlayerTexture).then((loadedTexture) => {
  if (loadedTexture !== fallbackPlayerTexture) {
    playerMaterial.map = loadedTexture;
    playerMaterial.needsUpdate = true;
    playerOutlineMaterial.map = loadedTexture;
    playerOutlineMaterial.needsUpdate = true;
    playerAnimator = new SpriteAnimator({
      texture: loadedTexture,
      frameWidth: PLAYER_SPRITE_FRAME_WIDTH,
      frameHeight: PLAYER_SPRITE_FRAME_HEIGHT,
    });
    lastSpriteFrame = playerAnimator.getFrameData();
  }
});

const playerController = new PlayerController();
let pendingMobileAttackEnemyId = null;
let pendingNpcInteractionId = null;
let verdantMoteCount = 0;
const partySystem = new PartySystem({
  threeScene: scene,
  combatSystem,
  getSupportTarget: (elainePosition, range) => {
    if (!bossInstance.isActive()) return null;
    const guardian = bossInstance.getTargetPoint();
    if (!guardian) return null;
    const distance = Math.hypot(guardian.x - elainePosition.x, guardian.z - elainePosition.y);
    if (distance > Math.max(0, Number(range) || 0)) return null;
    return {
      id: guardian.id,
      kind: "guardian",
      x: guardian.x,
      z: guardian.z,
      distance,
    };
  },
  onSupportHit: ({ amount }) => {
    const resolvedAmount = computeStatusAdjustedDamage({
      baseDamage: amount,
      attackerId: STATUS_ENTITY_IDS.ELAINE,
      targetId: VEIN_GUARDIAN_ID,
      attackMultiplier: 1,
      damageType: "holy",
    });
    const outcome = bossInstance.applySupportHit(resolvedAmount);
    if (outcome.brokeShield) {
      const guardianTarget = bossInstance.getTargetPoint();
      setTransientMessage("The shield fractures.", 1.1);
      vfxSystem.spawnGroundRing?.({
        position: guardianTarget
          ? new THREE.Vector2(guardianTarget.x, guardianTarget.z)
          : new THREE.Vector2(player.position.x, player.position.z),
        innerRadius: 0.45,
        outerRadius: 0.68,
        color: "#c6ffd4",
        life: 0.35,
        opacity: 0.78,
        spread: 0.65,
      });
    }
    return outcome.damage;
  },
  getWillowTarget: (willowPosition, range, preferredTargetEnemyId = "") => {
    const guardian = bossInstance.getTargetPoint();
    if (!guardian) return null;
    const preferredId = String(preferredTargetEnemyId ?? "");
    if (preferredId && preferredId !== VEIN_GUARDIAN_ID) return null;
    const distance = Math.hypot(guardian.x - willowPosition.x, guardian.z - willowPosition.y);
    if (distance > Math.max(0, Number(range) || 0)) return null;
    return {
      id: guardian.id,
      kind: "guardian",
      x: guardian.x,
      z: guardian.z,
      distance,
    };
  },
});
const shrineSystem = new ShrineSystem({
  threeScene: scene,
  onPurchase: (upgradeId, cost, currency = "motes") => {
    if (currency === "shards") {
      if (relicShardCount < cost) return false;
      relicShardCount = saveState.addRelicShards?.(-cost) ?? Math.max(0, relicShardCount - cost);
    } else {
      if (verdantMoteCount < cost) return false;
      verdantMoteCount = Math.max(0, verdantMoteCount - cost);
    }
    const nextUpgrades = resolvePlayerUpgrades(saveState.incrementPlayerUpgrade?.(upgradeId, 1));
    playerUpgrades = nextUpgrades;
    applyPlayerUpgrades(true);
    return true;
  },
});
const vaelorisChoicePanel = createVaelorisChoicePanel({
  onChoose: (choice) => applyVaelorisChoice(choice),
});
const harvesterChoicePanel = createHarvesterChoicePanel({
  onChoose: (choice) => applyHarvesterChoice(choice),
});
const listeningSpikeChoicePanel = createListeningSpikeChoicePanel({
  onChoose: (choice) => applyListeningSpikeChoice(choice),
});
const vaultChoicePanel = createVaultChoicePanel({
  onChoose: (choice) => applyChapter9VaultChoice(choice),
});
const loreVisionOverlay = createLoreVisionOverlay();
const cinematicPanelOverlay = createCinematicPanelOverlay();
const endingChoicePanel = createEndingChoicePanel({
  onConfirm: (choice) => applyEndgameEndingChoice(choice),
});
const creditsOverlay = createCreditsOverlay();
let debugForceMobileUi = null;
const partyTactics = new PartyTactics();
const willowSaveState = saveState.getWillowState?.() ?? {
  activeStance: saveState.getWillowStance?.() ?? "ruby",
  autoStanceEnabled: saveState.getWillowAutoStanceEnabled?.() ?? true,
};
const willowStance = new WillowStanceState({
  initialStance: willowSaveState.activeStance ?? "ruby",
  autoStanceEnabled: willowSaveState.autoStanceEnabled !== false,
  stanceCooldownMs: WILLOW_STANCE_COOLDOWN_MS,
  manualLockMs: WILLOW_MANUAL_LOCK_MS,
});
const guidanceDirector = new GuidanceDirector();
const persistedBanterState = saveState.getBanterState?.() ?? {
  frequency: BANTER_FREQUENCY_VALUES.high,
};
const banterDirector = new BanterDirector({
  idleSeconds: PARTY_BANTER_IDLE_SECONDS,
  guidanceCooldownSeconds: PARTY_BANTER_COOLDOWN_SECONDS,
  initialFrequency: persistedBanterState.frequency ?? BANTER_FREQUENCY_VALUES.high,
  persistentState: persistedBanterState,
});
const partyChat = createPartyChat();
let guidanceLineText = "";
let currentObjectiveState = {
  id: OBJECTIVE_IDS.NONE,
  hudLine: "",
  progressKey: `${OBJECTIVE_IDS.NONE}:${currentSceneInfo.sceneId}`,
};
let objectiveDistanceNow = null;
let objectiveDistancePrev = null;
let objectiveOffTrackSeconds = 0;
let objectiveTravelingSeconds = 0;
let objectiveIdleSeconds = 0;
let objectiveOnTrack = false;
let objectiveTelemetryKey = `${OBJECTIVE_IDS.NONE}:${currentSceneInfo.sceneId}`;
let lastArthurTargetEnemyId = "";
let debugTargetEntityIdOverride = "";
let arthurAiAttackCooldown = 0;
let arthurAiChargeMeter = 0;
const aiStats = {
  arthurHeavyCount: 0,
  arthurLightCount: 0,
  arthurInterceptCount: 0,
  elaineHealCount: 0,
  elaineResCount: 0,
  elaineGroupHealCount: 0,
  elaineBuffCount: 0,
  elaineHolyBoltCount: 0,
  willowBoltCount: 0,
  willowSpellCastCount: 0,
  willowSpellAiCastCount: 0,
  willowMarkCastCount: 0,
  willowAoeCastCount: 0,
  willowDebuffApplyCount: 0,
};
const elaineSpellBar = createElaineSpellBar({
  onSpellKey: (spellKey) => handleElaineSpellUiTap(spellKey),
});
const willowSpellBar = createWillowSpellBar({
  onSpellKey: (spellKey) => handleWillowSpellUiTap(spellKey),
});
const tacticsToggleButton = createTacticsToggleButton({
  onToggle: () => cycleTacticsMode(),
});
const willowAutoStanceToggle = createWillowAutoStanceToggle({
  onToggle: () => toggleWillowAutoStanceFromUi(),
});
const partyPortraitBar = createPartyPortraitBar({
  onSelect: (characterId) => requestActiveCharacter(characterId, { showFailureToast: false, fromUi: true }),
  onLongSelect: (characterId) => {
    if (characterId === "willow") {
      cycleWillowStanceManual({
        showLockedToast: true,
        fromUi: true,
        requireWillowActive: false,
      });
    }
  },
});
const willowAmbushRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.1, 52),
  new THREE.MeshBasicMaterial({
    color: "#eec49a",
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
willowAmbushRing.rotation.x = -Math.PI / 2;
willowAmbushRing.visible = false;
willowAmbushRing.renderOrder = 1044;
scene.add(willowAmbushRing);
const listeningSpikeRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.1, 52),
  new THREE.MeshBasicMaterial({
    color: "#b7dbc7",
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
listeningSpikeRing.rotation.x = -Math.PI / 2;
listeningSpikeRing.visible = false;
listeningSpikeRing.renderOrder = 1045;
scene.add(listeningSpikeRing);
const ridgePatrolRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.1, 52),
  new THREE.MeshBasicMaterial({
    color: "#d6e8bf",
    transparent: true,
    opacity: 0.23,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
ridgePatrolRing.rotation.x = -Math.PI / 2;
ridgePatrolRing.visible = false;
ridgePatrolRing.renderOrder = 1046;
scene.add(ridgePatrolRing);
const chapter6RelayRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.12, 52),
  new THREE.MeshBasicMaterial({
    color: "#b7dde5",
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
chapter6RelayRing.rotation.x = -Math.PI / 2;
chapter6RelayRing.visible = false;
chapter6RelayRing.renderOrder = 1047;
scene.add(chapter6RelayRing);
const chapter8RetaliationRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.12, 56),
  new THREE.MeshBasicMaterial({
    color: "#9bc8a7",
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
chapter8RetaliationRing.rotation.x = -Math.PI / 2;
chapter8RetaliationRing.visible = false;
chapter8RetaliationRing.renderOrder = 1048;
scene.add(chapter8RetaliationRing);
const thirdSealRitualRing = new THREE.Mesh(
  new THREE.RingGeometry(0.78, 0.96, 56),
  new THREE.MeshBasicMaterial({
    color: "#8fd3be",
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
thirdSealRitualRing.rotation.x = -Math.PI / 2;
thirdSealRitualRing.visible = false;
thirdSealRitualRing.renderOrder = 1049;
scene.add(thirdSealRitualRing);
const chapter9SunderWaveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.84, 1.04, 72),
  new THREE.MeshBasicMaterial({
    color: "#f4c989",
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
chapter9SunderWaveRing.rotation.x = -Math.PI / 2;
chapter9SunderWaveRing.visible = false;
chapter9SunderWaveRing.renderOrder = 1052;
scene.add(chapter9SunderWaveRing);

const chapter9MemoryCollapseRing = new THREE.Mesh(
  new THREE.RingGeometry(CHAPTER9_MEMORY_COLLAPSE_RADIUS * 0.9, CHAPTER9_MEMORY_COLLAPSE_RADIUS, 62),
  new THREE.MeshBasicMaterial({
    color: "#dbe8ff",
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
chapter9MemoryCollapseRing.rotation.x = -Math.PI / 2;
chapter9MemoryCollapseRing.visible = false;
chapter9MemoryCollapseRing.renderOrder = 1053;
scene.add(chapter9MemoryCollapseRing);
const spireBreachWaveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.76, 0.94, 72),
  new THREE.MeshBasicMaterial({
    color: "#7dd3fc",
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
spireBreachWaveRing.rotation.x = -Math.PI / 2;
spireBreachWaveRing.visible = false;
spireBreachWaveRing.renderOrder = 1054;
scene.add(spireBreachWaveRing);

const gatewardenOverloadRing = new THREE.Mesh(
  new THREE.RingGeometry(GATEWARDEN_OVERLOAD_RADIUS * 0.86, GATEWARDEN_OVERLOAD_RADIUS, 62),
  new THREE.MeshBasicMaterial({
    color: "#ffc18b",
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
gatewardenOverloadRing.rotation.x = -Math.PI / 2;
gatewardenOverloadRing.visible = false;
gatewardenOverloadRing.renderOrder = 1055;
scene.add(gatewardenOverloadRing);

const lastSpireRiftShockwaveRing = new THREE.Mesh(
  new THREE.RingGeometry(0.72, 0.9, 72),
  new THREE.MeshBasicMaterial({
    color: "#b9c8ff",
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
lastSpireRiftShockwaveRing.rotation.x = -Math.PI / 2;
lastSpireRiftShockwaveRing.visible = false;
lastSpireRiftShockwaveRing.renderOrder = 1056;
scene.add(lastSpireRiftShockwaveRing);

const lastSpireCorePulseRing = new THREE.Mesh(
  new THREE.RingGeometry(CORE_ENGINE_PULSE_RADIUS * 0.88, CORE_ENGINE_PULSE_RADIUS, 64),
  new THREE.MeshBasicMaterial({
    color: "#f6c4a1",
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
lastSpireCorePulseRing.rotation.x = -Math.PI / 2;
lastSpireCorePulseRing.visible = false;
lastSpireCorePulseRing.renderOrder = 1057;
scene.add(lastSpireCorePulseRing);

const narratorShockwaveRing = new THREE.Mesh(
  new THREE.RingGeometry(NARRATOR_SHOCKWAVE_SAFE_INNER, NARRATOR_SHOCKWAVE_SAFE_OUTER, 72),
  new THREE.MeshBasicMaterial({
    color: "#d5c1ff",
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
);
narratorShockwaveRing.rotation.x = -Math.PI / 2;
narratorShockwaveRing.visible = false;
narratorShockwaveRing.renderOrder = 1058;
scene.add(narratorShockwaveRing);

function createMuteSpikeFallbackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 48;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(8, 42, 16, 4);
  ctx.fillStyle = "#2f3735";
  ctx.fillRect(14, 12, 4, 30);
  ctx.fillRect(11, 22, 10, 3);
  ctx.fillStyle = "#4a5c57";
  ctx.fillRect(12, 13, 2, 28);
  ctx.fillRect(18, 13, 2, 28);
  ctx.fillStyle = "#98dcb4";
  ctx.fillRect(13, 16, 6, 3);
  ctx.fillRect(13, 24, 6, 2);
  ctx.fillRect(14, 30, 4, 2);
  return applyPixelArtTextureSettings(new THREE.CanvasTexture(canvas));
}

function createRootWardFallbackTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 28;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(6, 34, 16, 4);
  ctx.fillStyle = "#4f5f47";
  ctx.fillRect(11, 12, 6, 22);
  ctx.fillStyle = "#75614c";
  ctx.fillRect(8, 8, 12, 5);
  ctx.fillStyle = "#a6c98e";
  ctx.fillRect(10, 15, 8, 2);
  ctx.fillRect(12, 21, 4, 2);
  return applyPixelArtTextureSettings(new THREE.CanvasTexture(canvas));
}

const chapter8MuteSpikeFallbackTexture = createMuteSpikeFallbackTexture();
let chapter8MuteSpikeTexture = chapter8MuteSpikeFallbackTexture;
loadPixelSpriteTexture("./assets/sprites/props/mute_spike.png", chapter8MuteSpikeFallbackTexture).then((texture) => {
  chapter8MuteSpikeTexture = texture;
});
const chapter8RootWardFallbackTexture = createRootWardFallbackTexture();
let chapter8RootWardTexture = chapter8RootWardFallbackTexture;
loadPixelSpriteTexture("./assets/sprites/props/root_ward_marker.png", chapter8RootWardFallbackTexture).then((texture) => {
  chapter8RootWardTexture = texture;
});
let lastWillowShotCountSeen = partySystem.getState().willowShotCount ?? 0;

function applyPlayerUpgrades(restoreToFull = false) {
  const maxHp = PLAYER_MAX_HEALTH + playerUpgrades.maxHpLevel * 20;
  const moveSpeedMultiplier = 1 + playerUpgrades.moveSpeedLevel * 0.05;
  const chargeSpeedMultiplier = 1 + playerUpgrades.chargeSpeedLevel * 0.1;
  playerHeavyDamageMultiplier = 1 + playerUpgrades.relicAttunementLevel * 0.1;
  playerState.setMaxHP(maxHp, { restoreToFull });
  playerController.setStatModifiers({
    moveSpeedMultiplier,
    chargeSpeedMultiplier,
  });
}

applyPlayerUpgrades(false);
const initialElaineJoined = Boolean(saveState.getStoryFlag("elaine_joined") ?? saveState.getFlag("story.elaine_joined"));
const initialWillowJoined = Boolean(saveState.getStoryFlag("willow_joined") ?? saveState.getFlag("story.willow_joined"));
partySystem.setJoined(initialElaineJoined, player.position);
partySystem.setWillowJoined(initialWillowJoined, player.position);
partySystem.setActiveCharacter(activePartyMember, player.position);
partySystem.setActiveScene(currentSceneInfo.sceneId, player.position);
shrineSystem.setScene(currentSceneInfo.sceneId);
if (hasElaineJoined()) {
  resetElaineSupportState({ restoreFull: true });
  elaineDowned = false;
} else {
  elaineDowned = true;
  elaineHp = elaineMaxHp;
  elaineMp = elaineMaxMp;
}
resetWillowSpellState({ restoreFull: true, resetStance: false });

const keyboardInput = new KeyboardInput(window);
const touchInput = new TouchInput(canvas, {
  screenToWorld,
  getPlayerPosition: () => new THREE.Vector2(player.position.x, player.position.z),
  onTapRipple: createTapRipple,
  onWorldTap: ({ worldPoint, pointerType }) => {
    if (sceneManager.hasBlockingUiScene()) {
      return { consumed: true, clearTarget: true };
    }
    if (introTextBeat.isActive()) {
      return { consumed: true, clearTarget: true };
    }
    if (vaelorisChoicePanel.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (harvesterChoicePanel.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (listeningSpikeChoicePanel.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (vaultChoicePanel.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (loreVisionOverlay.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (cinematicPanelOverlay.isOpen()) {
      cinematicPanelOverlay.advance();
      return { consumed: true, clearTarget: true };
    }
    if (endingChoicePanel.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (creditsOverlay.isOpen()) {
      creditsOverlay.advance();
      return { consumed: true, clearTarget: true };
    }
    if (shrineSystem.isOpen()) {
      return { consumed: true, clearTarget: true };
    }
    if (dialogueBox.isOpen()) {
      dialogueBox.advance();
      return { consumed: true, clearTarget: true };
    }

    const shrineTap = shrineSystem.handleWorldTap(worldPoint);
    if (shrineTap?.consumed) {
      return shrineTap;
    }

    if (tryDamageNearestRelayTether({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryDamageNearestChapter8MuteSpike({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryAttuneNearestChapter9Anchor({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryDamageNearestChapter9EchoNode({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryAttuneThirdSealSigil({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryDisableNearestLockNode({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryStartNearestResonanceLock({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryShatterNearestLoomPrismPillar({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryInspectLastDoor({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryAttuneNearestRiftAnchor({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryDisableNearestFinalClamp({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }
    if (tryOpenEndingChoiceAltar({ showToast: true })) {
      return { consumed: true, clearTarget: true };
    }

    if (tryTriggerChapter6WaystoneLoreEvent()) {
      return { consumed: true, clearTarget: true };
    }

    if (
      currentSceneInfo.sceneId === "hollowScar" &&
      vaelorisChoice === VAELORIS_CHOICE_VALUES.NONE &&
      hasVeinGuardianDefeated() &&
      hasVaelorisFieldTriggered() &&
      vaelorisConstructsAlive <= 0
    ) {
      const vaelorisConfig = getVaelorisFieldConfig();
      const extractor = vaelorisConfig?.extractorPosition;
      if (extractor) {
        const tapDistance = Math.hypot(worldPoint.x - extractor.x, worldPoint.y - extractor.y);
        const tapRadius = Math.max(0.7, Number(vaelorisConfig.interactRadius) || 1.05);
        if (tapDistance <= tapRadius) {
          if (isNearVaelorisExtractor()) {
            vaelorisChoicePanel.open();
            return { consumed: true, clearTarget: true };
          }
          return { consumed: false };
        }
      }
    }

    if (currentSceneInfo.sceneId === "thornmere") {
      const ashGateConfig = getAshGateConfig();
      if (ashGateConfig && !ashGateConfig.unlocked) {
        const tapRadius = Math.max(0.72, Number(ashGateConfig.interactRadius) || 1.05);
        const tapDistance = Math.hypot(worldPoint.x - ashGateConfig.position.x, worldPoint.y - ashGateConfig.position.y);
        if (tapDistance <= tapRadius) {
          if (tryHandleLockedRidgeGateInteraction({ showToast: true })) {
            return { consumed: true, clearTarget: true };
          }
        }
      }
      const ridgeConfig = getRidgeGateConfig();
      if (ridgeConfig) {
        const tapRadius = Math.max(0.72, Number(ridgeConfig.interactRadius) || 1.05);
        const tapDistance = Math.hypot(worldPoint.x - ridgeConfig.position.x, worldPoint.y - ridgeConfig.position.y);
        if (tapDistance <= tapRadius) {
          if ((!ridgeConfig.unlocked || isNearRidgeGateBlockedByPatrol()) && tryHandleLockedRidgeGateInteraction({ showToast: true })) {
            return { consumed: true, clearTarget: true };
          }
        }
      }
      const rootwayConfig = getRootwayGateConfig();
      if (rootwayConfig) {
        const tapRadius = Math.max(0.72, Number(rootwayConfig.interactRadius) || 1.05);
        const tapDistance = Math.hypot(worldPoint.x - rootwayConfig.position.x, worldPoint.y - rootwayConfig.position.y);
        if (tapDistance <= tapRadius) {
          if (
            (!rootwayConfig.unlocked || isNearRootwayGateBlockedByRetaliation()) &&
            tryHandleLockedRootwayGateInteraction({ showToast: true })
          ) {
            return { consumed: true, clearTarget: true };
          }
        }
      }
    }

    const tappedGuardian = bossInstance.pickAtWorldPoint(worldPoint, 0.9);
    if (tappedGuardian) {
      vfxSystem.spawnTapTargetRing(new THREE.Vector2(tappedGuardian.x, tappedGuardian.z), "#b8f6bf");
      if (pointerType !== "mouse") {
        const distanceToGuardian = Math.hypot(
          player.position.x - tappedGuardian.x,
          player.position.z - tappedGuardian.z
        );
        if (distanceToGuardian <= getPrimaryAutoAttackRange(activePartyMember) + 0.25) {
          playerController.requestLightAttack({
            targetEnemyId: VEIN_GUARDIAN_ID,
            targetPoint: new THREE.Vector2(tappedGuardian.x, tappedGuardian.z),
          });
          pendingMobileAttackEnemyId = null;
          return { consumed: true, clearTarget: true };
        }

        pendingMobileAttackEnemyId = VEIN_GUARDIAN_ID;
        return { consumed: true, target: new THREE.Vector2(tappedGuardian.x, tappedGuardian.z) };
      }
      return { consumed: true, clearTarget: true };
    }

    const tappedEnemy = combatSystem.pickEnemyAtWorldPoint(worldPoint, 0.85);
    if (tappedEnemy) {
      vfxSystem.spawnTapTargetRing(tappedEnemy.position, "#f9e38f");
      // Mobile taps on enemies trigger light attacks. Mouse clicks are handled by charge controls,
      // but should still consume tap-to-move so attack clicks do not retarget movement.
      if (pointerType !== "mouse") {
        const distanceToEnemy = Math.hypot(
          player.position.x - tappedEnemy.position.x,
          player.position.z - tappedEnemy.position.y
        );
        if (distanceToEnemy <= getPrimaryAutoAttackRange(activePartyMember)) {
          playerController.requestLightAttack({
            targetEnemyId: tappedEnemy.id,
            targetPoint: tappedEnemy.position,
          });
          pendingMobileAttackEnemyId = null;
          return { consumed: true, clearTarget: true };
        }

        pendingMobileAttackEnemyId = tappedEnemy.id;
        return { consumed: true, target: tappedEnemy.position };
      }
      return { consumed: true, clearTarget: true };
    }

    if (guardianCombatForced) {
      pendingNpcInteractionId = null;
      return { consumed: false };
    }

    const npcTap = sceneManager.handleNpcTap(worldPoint, playerXZ.set(player.position.x, player.position.z));
    if (npcTap.consumed) {
      if (npcTap.npcInteraction) {
        openNpcDialogue(npcTap.npcInteraction);
        pendingNpcInteractionId = null;
      } else {
        pendingNpcInteractionId = npcTap.npcId ?? null;
      }
      pendingMobileAttackEnemyId = null;
      return npcTap;
    }

    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
    playerXZ.set(player.position.x, player.position.z);
    return sceneManager.handlePortalTap(worldPoint, playerXZ);
  },
});
const inputManager = new InputManager({ keyboardInput, touchInput });

const mouseChargeState = {
  active: false,
  pointerId: null,
  startTime: 0,
  targetIntent: null,
};

canvas.addEventListener("pointerdown", (event) => {
  if (sceneManager.hasBlockingUiScene()) {
    if (sceneManager.handleScenePointerDown(event)) {
      event.preventDefault();
    }
    return;
  }
  if (introTextBeat.isActive()) return;
  if (dialogueBox.isOpen()) return;
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  inputManager.clearTouchTarget();
  pendingMobileAttackEnemyId = null;
  pendingNpcInteractionId = null;

  const worldPoint = screenToWorld(event.clientX, event.clientY);
  const targetEnemy = worldPoint ? combatSystem.pickEnemyAtWorldPoint(worldPoint, 0.95) : null;
  const targetGuardian = !targetEnemy && worldPoint ? bossInstance.pickAtWorldPoint(worldPoint, 0.95) : null;

  mouseChargeState.active = true;
  mouseChargeState.pointerId = event.pointerId;
  mouseChargeState.startTime = event.timeStamp;
  mouseChargeState.targetIntent = targetEnemy
    ? {
        targetEnemyId: targetEnemy.id,
        targetPoint: targetEnemy.position,
      }
    : targetGuardian
      ? {
          targetEnemyId: VEIN_GUARDIAN_ID,
          targetPoint: new THREE.Vector2(targetGuardian.x, targetGuardian.z),
        }
    : null;

  playerController.startCharge();
});

canvas.addEventListener("pointerup", (event) => {
  if (sceneManager.hasBlockingUiScene()) {
    if (sceneManager.handleScenePointerUp(event)) {
      event.preventDefault();
    }
    return;
  }
  if (introTextBeat.isActive()) return;
  if (dialogueBox.isOpen()) return;
  if (!mouseChargeState.active) return;
  if (event.pointerType !== "mouse") return;
  if (event.pointerId !== mouseChargeState.pointerId) return;

  const targetIntent = mouseChargeState.targetIntent;
  mouseChargeState.active = false;
  mouseChargeState.pointerId = null;
  mouseChargeState.targetIntent = null;

  playerController.releaseCharge(targetIntent);
});

canvas.addEventListener("pointercancel", (event) => {
  if (sceneManager.hasBlockingUiScene()) {
    if (sceneManager.handleScenePointerCancel(event)) {
      event.preventDefault();
    }
    return;
  }
  if (introTextBeat.isActive()) return;
  if (dialogueBox.isOpen()) return;
  if (!mouseChargeState.active) return;
  if (event.pointerType !== "mouse") return;
  if (event.pointerId !== mouseChargeState.pointerId) return;

  mouseChargeState.active = false;
  mouseChargeState.pointerId = null;
  mouseChargeState.targetIntent = null;
  playerController.interruptCharge();
  resetSwordAttackState();
});

let devCombatOverride = false;
let sceneCombatForced = false;
let combatFromEnemies = false;
let guardianCombatForced = false;
let transientMessageSeconds = 0;
let transientMessageText = "";
let controlLockRemaining = 0;
let saveWriteAccumulator = 0;
let lastCombatFrame = {
  combatActive: false,
  anyAggro: false,
  combatLingerRemaining: 0,
  damageDealt: 0,
  damageTaken: 0,
  lootCount: 0,
  enemiesAlive: 0,
  enemiesTotal: 0,
  enemiesDefeated: 0,
  activeOrbs: 0,
  activeProjectiles: 0,
};
let lastAnomalyFrame = {
  activeCount: 0,
  nearby: false,
  collected: false,
};
let lastPartyFrame = {
  damageDealt: 0,
  joined: false,
  followerVisible: false,
  stagingVisible: false,
  follower: null,
  projectiles: 0,
};
let aiOverlayEnabled = false;
let lastPartyAiFrame = partySystem.getAiState?.() ?? { members: [], combatActive: false, bossActive: false };
let lastGuardianFrame = bossInstance.getState();
let lastVeinFrame = {
  active: false,
  activeVeinId: null,
  state: "",
  waveIndex: 0,
  totalWaves: 0,
  enemiesRemaining: 0,
  hudText: "",
  localOverlayOpacity: 0,
  localFogDensityDelta: 0,
  localTintDarken: 0,
  localDesaturation: 0,
  localFogReliefDelta: 0,
  cameraZoomTarget: 1,
  waveTransitionActive: false,
  waveTransitionIntensity: 0,
  waveFoliageBoost: 1,
  waveShakeScalar: 0,
  barrierScale: 0,
  barrierGrowth: 0,
  correctedPlayerPosition: null,
  playerInsideActiveRadius: false,
};
let debugVeinSuppressionRemaining = 0;
let lastPulseFrame = {
  active: false,
  elapsedSeconds: 0,
  progress: 0,
  phaseId: "",
  phaseProgress: 0,
  surgeSpawned: false,
  surgeRoles: [],
  overlayVisible: false,
};
let lastVisualFrame = {
  sceneId: "thornmere",
  ambientIntensity: 0.84,
  directionalIntensity: 1.02,
  fogDensity: 0.006,
  overlayOpacity: 0.04,
  regionTintStrength: 0.12,
  foliageSwayMultiplier: 1,
  pulseOverlayOpacity: 0,
  saturationShift: 0,
  warmthShift: 0,
};
let lastSceneDebugFrame = {
  currentSceneId: "thornmere",
  sceneObjectCount: 0,
  hasGroundMesh: false,
  hasPortalCount: 0,
  hasNpcCount: 0,
  hasEnemyCount: 0,
  enemyAttacksEnabled: true,
  terrainStatusText: "unknown",
};
let lastInteractionPrompt = "";
let pulseSurgeSpawned = false;
let pulseSurgeRoles = [];
let pulseDamageTaken = 0;
let openingLineTimer = 0;
let openingLineIndex = 0;
let openingKillResolved = false;
let openingTransitionTimer = 0;
let elaineIntroActive = false;
let elaineIntroLineIndex = 0;
let elaineIntroLineTimer = 0;
let firstVeinCompletedLatched = Boolean(saveState.getStoryFlag(FIRST_VEIN_COMPLETION_FLAG));
let currentQuestText = "";
let vaelorisDialogueActive = false;
let vaelorisDialogueIndex = 0;
let vaelorisDialogueTimer = 0;
let vaelorisConstructEnemyIds = [];
let vaelorisConstructsAlive = 0;
let vaelorisExtractorPromptVisible = false;
let vaelorisPendingConstructSpawn = false;
let vaelorisEventActive = false;
let crownOmenFlashRemaining = 0;
let crownOmenTierLabel = crownMood.getTierLabel();
syncVaelorisExtractorVisual();
applyVaelorisWorldModifiers();

let lastMovementInfo = {
  isMoving: false,
  isRunning: false,
  speed: 0,
  context: "exploration",
  mode: "walk",
  moveDirection: new THREE.Vector2(0, 1),
  target: null,
  attackEvents: [],
  chargeMeter: 0,
  charging: false,
  comboStep: 0,
};

const playerFacingVector = new THREE.Vector2(0, 1);
const playerTargetVector = new THREE.Vector2();
const veinPlayerProbe = new THREE.Vector2();
const elaineBoltOriginWorld = new THREE.Vector3();

function isEditableElement(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}

function isTypingContext(target = null) {
  return isEditableElement(target) || isEditableElement(document.activeElement);
}

function isMobileInputDevice() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const touchPoints = Number(navigator?.maxTouchPoints ?? 0) > 0;
  return coarsePointer || touchPoints;
}

function isMobileUiEnabled() {
  if (debugForceMobileUi === true) return true;
  if (debugForceMobileUi === false) return false;
  return isMobileInputDevice();
}

function setDebugMobileUiOverride(value) {
  if (value === null || value === undefined) {
    debugForceMobileUi = null;
  } else {
    debugForceMobileUi = Boolean(value);
  }
  return {
    forced: debugForceMobileUi,
    enabled: isMobileUiEnabled(),
  };
}

function getTacticsMode() {
  return partyTactics.getTacticsMode();
}

function setTacticsMode(mode) {
  const next = partyTactics.setTacticsMode(mode);
  return next;
}

function cycleTacticsMode() {
  const next = partyTactics.cycleTacticsMode();
  setTransientMessage(`Tactics: ${formatTacticsMode(next)}`, 0.9);
  return next;
}

function normalizePartyCharacterId(characterId) {
  const normalized = String(characterId ?? "").toLowerCase();
  if (normalized === "elaine") return "elaine";
  if (normalized === "willow") return "willow";
  return "arthur";
}

function getPrimaryAttackProfile(characterId = activePartyMember) {
  const normalized = normalizePartyCharacterId(characterId);
  return PRIMARY_ATTACK_PROFILES[normalized] ?? PRIMARY_ATTACK_PROFILES.arthur;
}

function getPrimaryAutoAttackRange(characterId = activePartyMember) {
  const normalized = normalizePartyCharacterId(characterId);
  if (normalized === "elaine") return ELAINE_AUTO_ATTACK_RANGE;
  return MOBILE_AUTO_ATTACK_RANGE;
}

function canActivateCharacter(characterId) {
  const normalized = normalizePartyCharacterId(characterId);
  if (normalized === "elaine") {
    return hasElaineJoined() && !elaineDowned;
  }
  if (normalized === "willow") {
    return hasWillowJoined();
  }
  return !arthurDowned;
}

function requestActiveCharacter(characterId, { showFailureToast = true, fromUi = false } = {}) {
  const normalized = normalizePartyCharacterId(characterId);
  if (normalized === "elaine" && !hasElaineJoined()) {
    if (showFailureToast) {
      setTransientMessage("Not yet", 0.9);
    }
    return false;
  }
  if (normalized === "willow" && !hasWillowJoined()) {
    if (showFailureToast) {
      setTransientMessage("Not yet", 0.9);
    }
    return false;
  }
  if (!canActivateCharacter(normalized)) {
    if (showFailureToast) {
      const label = normalized === "elaine" ? "Elaine" : normalized === "willow" ? "Willow" : "Arthur";
      setTransientMessage(`${label} cannot answer.`, 0.9);
    }
    return false;
  }
  setActivePartyMember(normalized, { snapCamera: true });
  if (fromUi) {
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
  }
  return true;
}

function resetAiStats() {
  for (const key of Object.keys(aiStats)) {
    aiStats[key] = 0;
  }
  arthurAiAttackCooldown = 0;
  arthurAiChargeMeter = 0;
  lastArthurTargetEnemyId = "";
  lastWillowShotCountSeen = partySystem?.getState?.().willowShotCount ?? 0;
}

function canProcessGameplayInput(event) {
  const target = event?.target ?? null;
  const typing = isTypingContext(target);
  const canvasFocused = document.activeElement === canvas || target === canvas;
  if (sceneManager.hasBlockingUiScene()) return false;
  if (dialogueBox.isOpen()) return false;
  if (shrineSystem.isOpen()) return false;
  if (vaelorisChoicePanel.isOpen()) return false;
  if (harvesterChoicePanel.isOpen()) return false;
  if (listeningSpikeChoicePanel.isOpen()) return false;
  if (vaultChoicePanel.isOpen()) return false;
  if (loreVisionOverlay.isOpen()) return false;
  if (cinematicPanelOverlay.isOpen()) return false;
  if (endingChoicePanel.isOpen()) return false;
  if (creditsOverlay.isOpen()) return false;
  if (introTextBeat.isActive()) return false;
  return canvasFocused || !typing;
}

function getEffectiveMovementContext() {
  return devCombatOverride || sceneCombatForced || combatFromEnemies || guardianCombatForced ? "combat" : "exploration";
}

function isPlayableScene(sceneId) {
  return PLAYABLE_SCENE_IDS.has(sceneId);
}

function randomizeSeed() {
  const nextSeed = ((Date.now() & 0xffffffff) ^ (Math.floor(performance.now() * 1000) >>> 0)) >>> 0;
  currentRngSeed = nextSeed;
  setSeed(nextSeed);
  markMapDirty();
  rebuildMapRender({ regenerateTexture: true });
  initThreatVeinsForScene(currentSceneInfo.sceneId, currentRngSeed, {
    threeScene: scene,
    saveState,
  });
  setTransientMessage("Fate shifts", 1.6);
}

function getPlayerXZ() {
  playerXZ.set(player.position.x, player.position.z);
  return playerXZ;
}

function setTransientMessage(message, durationSeconds = 1.2) {
  transientMessageText = message;
  transientMessageSeconds = Math.max(transientMessageSeconds, durationSeconds);
}

function setVeinDroneEnabled(enabled) {
  const shouldEnable = Boolean(enabled);
  if (veinDroneActive === shouldEnable) return;
  veinDroneActive = shouldEnable;
  if (shouldEnable) {
    audioBus.playMusic("vein_low_drone", "vein");
  } else {
    audioBus.stopMusic("vein");
  }
}

function updateSceneDebugState() {
  const groundRef = scene.getObjectByName("ground");
  const hasGroundMesh = Boolean(groundRef && groundRef.visible);
  const sceneObjectCount = scene.children.length;
  const hasPortalCount = sceneManager.getPortals().length;
  const hasNpcCount = sceneManager.getNpcs().length;
  const hasEnemyCount = lastCombatFrame.enemiesAlive;
  const enemyAttacksEnabled = combatSystem.isEnemyAttacksEnabled();

  let terrainStatusText = "mounted";
  if (!groundRef) {
    terrainStatusText = "missing-ground";
  } else if (!groundRef.visible) {
    terrainStatusText = "hidden-ground";
  } else if (groundRef.parent !== scene) {
    terrainStatusText = "detached-ground";
  } else if (currentSceneInfo.sceneId === "start") {
    terrainStatusText = "start-mounted";
  } else if (currentSceneInfo.sceneId === "prologue") {
    terrainStatusText = "prologue-mounted";
  }

  lastSceneDebugFrame = {
    currentSceneId: currentSceneInfo.sceneId,
    sceneObjectCount,
    hasGroundMesh,
    hasPortalCount,
    hasNpcCount,
    hasEnemyCount,
    enemyAttacksEnabled,
    terrainStatusText,
  };
  sceneDebugOverlay.update({
    ...lastSceneDebugFrame,
    aiOverlayEnabled,
    partyAiState: lastPartyAiFrame,
  });
}

function syncWorldRegion(sceneInfo = currentSceneInfo) {
  if (!sceneInfo?.regionId) return;
  world.setActiveRegion(sceneInfo.regionId, sceneInfo.regionName);
}

function forceLoadSceneForDebug(sceneId) {
  const spawnPosition = sceneManager.loadScene(sceneId);
  player.position.set(spawnPosition.x, 0, spawnPosition.y);
  cameraFollowTarget.set(spawnPosition.x, 0, spawnPosition.y);
  updateCamera(fixedStep, true);
  playerShadow.position.set(spawnPosition.x, -0.885, spawnPosition.y);

  inputManager.clearTouchTarget();
  pendingMobileAttackEnemyId = null;
  pendingNpcInteractionId = null;
  playerController.interruptCharge();
  resetSwordAttackState();
  dialogueBox.closeDialogue();
  introTextBeat.clear();
  vaelorisChoicePanel.close();
  harvesterChoicePanel.close();
  listeningSpikeChoicePanel.close();
  vaultChoicePanel.close();
  loreVisionOverlay.close();
  cinematicPanelOverlay.close();
  endingChoicePanel.close();
  creditsOverlay.close();
  controlLockRemaining = 0;
  act2FalloutPending = null;
  rowanCouncilPending = null;
  chapter2ArrivalPending = null;
  chapter3DebriefPending = null;
  chapter4RowanReportPending = null;
  chapter5AftershockPending = null;
  chapter6ArrivalPending = null;
  chapter6WaystoneLorePending = null;
  chapter8AftermathPending = null;
  chapter9StartPending = null;
  chapter9LoreVisionPending = null;
  endgameAct1StartPending = null;
  endgameAct2StartPending = null;
  endgameAct2LorePending = null;
  endgameAct3StartPending = null;
  endgameAct3LorePanelsPending = null;
  willowMeetPending = null;
  clearWillowAmbushState();
  clearListeningSpikeSetpieceState();
  clearRidgePatrolSetpieceState();
  clearChapter6RelaySetpieceState();
  clearChapter8RetaliationSetpieceState();
  clearChapter9SetpieceState();
  clearThirdSealQuestState();
  clearSpireBreachState();
  resetInnerSpireRuntime({ keepProgress: true });
  resetLastSpireRuntime({ keepProgress: true });
  pulsePresentation.clear();
  eventRunner.clear();
  clearGuardianEncounterState({ clearStoryActiveFlag: true });
  lastGuardianFrame = bossInstance.getState();

  pulseSurgeSpawned = false;
  pulseSurgeRoles = [];
  pulseDamageTaken = 0;
  stabilityToastText = "";
  stabilityToastSeconds = 0;
  playerKnockbackVelocity.set(0, 0);
  playerHitFlashRemaining = 0;
  playerHitTintRemaining = 0;
  playerHitNudgeRemaining = 0;
  cameraHitNudgeOffset.set(0, 0);
  cameraAttackNudgeOffset.set(0, 0);
  cameraZoomScalar = 1;
  damageTintOverlay.setOpacity(0);
  setActivePartyMember("arthur");
  arthurDowned = false;
  arthurBleedoutRemaining = 0;
  if (hasElaineJoined()) {
    resetElaineSupportState({ restoreFull: true });
    elaineDowned = false;
  } else {
    elaineDowned = true;
    clearElaineCastState();
  }
  resetWillowSpellState({ restoreFull: true, resetStance: false });
  setVeinDroneEnabled(false);
  lastPulseFrame = {
    active: false,
    elapsedSeconds: 0,
    progress: 0,
    phaseId: "",
    phaseProgress: 0,
    surgeSpawned: false,
    surgeRoles: [],
    overlayVisible: false,
  };
  lastVeinFrame = {
    active: false,
    activeVeinId: null,
    state: "",
    waveIndex: 0,
    totalWaves: 0,
    enemiesRemaining: 0,
    hudText: "",
    localOverlayOpacity: 0,
    localFogDensityDelta: 0,
    localTintDarken: 0,
    localDesaturation: 0,
    localFogReliefDelta: 0,
    cameraZoomTarget: 1,
    waveTransitionActive: false,
    waveTransitionIntensity: 0,
    waveFoliageBoost: 1,
    waveShakeScalar: 0,
    barrierScale: 0,
    barrierGrowth: 0,
    correctedPlayerPosition: null,
    playerInsideActiveRadius: false,
  };
  vaelorisChoice = getVaelorisChoice();
  harvesterChoice = getHarvesterChoice();
  listeningSpikeChoice = getListeningSpikeChoice();
  vaelorisPressureStage = getVaelorisPressureStage();
  vaelorisFieldTriggered = hasVaelorisFieldTriggered();
  vaelorisEventActive = false;
  vaelorisDialogueActive = false;
  vaelorisDialogueIndex = 0;
  vaelorisDialogueTimer = 0;
  vaelorisConstructEnemyIds = [];
  vaelorisConstructsAlive = 0;
  vaelorisPendingConstructSpawn = false;
  vaelorisExtractorPromptVisible = false;
  vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();

  currentSceneInfo = sceneManager.getCurrentSceneInfo();
  if (currentSceneInfo.sceneId === "region3_seed" || currentSceneInfo.sceneId === "windward") {
    setRegion3SeedEntered(true);
  }
  if (currentSceneInfo.sceneId === "region4_seed") {
    setRegion4SeedEntered(true);
  }
  syncWorldRegion(currentSceneInfo);
  partySystem.setActiveScene(currentSceneInfo.sceneId, player.position);
  partySystem.setJoined(hasElaineJoined(), player.position);
  partySystem.setWillowJoined(hasWillowJoined(), player.position);
  shrineSystem.setScene(currentSceneInfo.sceneId);
  combatSystem.loadScene(currentSceneInfo.sceneId, sceneManager.getEnemySpawns());
  initThreatVeinsForScene(currentSceneInfo.sceneId, currentRngSeed, {
    threeScene: scene,
    saveState,
  });
  maybeStartHollowScarPulse();
  maybeStartClassicIntroTextBeat();
  syncVaelorisExtractorVisual();
  applyVaelorisWorldModifiers();
  syncSceneMusic(currentSceneInfo.sceneId);

  saveState.setPlayerPosition(currentSceneInfo.sceneId, {
    x: player.position.x,
    z: player.position.z,
  });
  if (isPlayableScene(currentSceneInfo.sceneId)) {
    saveState.setSafeSpot(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
  }
  saveWriteAccumulator = 0;
  safeSpotWriteAccumulator = 0;
  refreshQuestText();
  markMapDirty();
  ensureGroundMounted();
  updateSceneDebugState();
}

function hasIntroSpoken() {
  return Boolean(saveState.getStoryFlag("intro_spoken") ?? saveState.getFlag("story.intro_spoken"));
}

function hasPrologueSeen() {
  return Boolean(saveState.getStoryFlag("prologue_seen") ?? saveState.getFlag("story.prologue_seen"));
}

function hasIntroTextSeen() {
  return Boolean(saveState.getStoryFlag("intro_text_seen") ?? saveState.getFlag("story.intro_text_seen"));
}

function markIntroTextSeen() {
  saveState.setStoryFlag("intro_text_seen", true);
  saveState.setFlag("story.intro_text_seen", true);
  sceneManager.notifyStoryFlagChanged("story.intro_text_seen", true);
}

function hasPulseSeen() {
  return Boolean(saveState.getStoryFlag("hollowscar_pulse_seen") ?? saveState.getFlag("story.hollowscar_pulse_seen"));
}

function markPulseSeen() {
  saveState.setStoryFlag("hollowscar_pulse_seen", true);
  saveState.setFlag("story.hollowscar_pulse_seen", true);
  sceneManager.notifyStoryFlagChanged("story.hollowscar_pulse_seen", true);
}

function getStoryValue(flagKey, legacyPrefix = "story.", fallback = null) {
  const direct = saveState.getStoryFlag(flagKey);
  if (direct !== undefined) return direct;
  const legacy = saveState.getFlag(`${legacyPrefix}${flagKey}`);
  if (legacy !== undefined) return legacy;
  return fallback;
}

function setStoryValue(flagKey, value) {
  saveState.setStoryFlag(flagKey, value);
  saveState.setFlag(`story.${flagKey}`, value);
  sceneManager.notifyStoryFlagChanged(flagKey, value);
  sceneManager.notifyStoryFlagChanged(`story.${flagKey}`, value);
}

function getStoryFlag(flagKey, legacyPrefix = "story.") {
  return Boolean(getStoryValue(flagKey, legacyPrefix, false));
}

function setStoryFlag(flagKey, value) {
  setStoryValue(flagKey, value);
}

function hasOpeningPlayed() {
  return getStoryFlag("opening_played");
}

function markOpeningPlayed() {
  setStoryFlag("opening_played", true);
}

function hasVeinQuestActive() {
  return getStoryFlag("vein_quest_active");
}

function setVeinQuestActive(active) {
  setStoryFlag("vein_quest_active", Boolean(active));
}

function hasVeinQuestComplete() {
  return getStoryFlag("vein_quest_complete");
}

function setVeinQuestComplete(completed) {
  setStoryFlag("vein_quest_complete", Boolean(completed));
}

function hasChapter2Started() {
  return getStoryFlag(CHAPTER2_FLAGS.STARTED);
}

function setChapter2Started(started) {
  setStoryFlag(CHAPTER2_FLAGS.STARTED, Boolean(started));
}

function hasChapter2ArrivedEmberfall() {
  return getStoryFlag(CHAPTER2_FLAGS.ARRIVED_EMBERFALL);
}

function setChapter2ArrivedEmberfall(arrived) {
  setStoryFlag(CHAPTER2_FLAGS.ARRIVED_EMBERFALL, Boolean(arrived));
}

function hasWillowMet() {
  return getStoryFlag(CHAPTER2_FLAGS.WILLOW_MET);
}

function setWillowMet(met) {
  setStoryFlag(CHAPTER2_FLAGS.WILLOW_MET, Boolean(met));
}

function hasStoryEmberfallUnlocked() {
  return getStoryFlag(CHAPTER2_FLAGS.EMBERFALL_UNLOCKED);
}

function setStoryEmberfallUnlocked(unlocked) {
  setStoryFlag(CHAPTER2_FLAGS.EMBERFALL_UNLOCKED, Boolean(unlocked));
}

function hasChapter3RowanDebriefDone() {
  return getStoryFlag(CHAPTER3_FLAGS.ROWAN_DEBRIEF_DONE);
}

function setChapter3RowanDebriefDone(done) {
  setStoryFlag(CHAPTER3_FLAGS.ROWAN_DEBRIEF_DONE, Boolean(done));
}

function hasChapter4RowanReportDone() {
  return getStoryFlag(CHAPTER4_FLAGS.ROWAN_REPORT_DONE);
}

function setChapter4RowanReportDone(done) {
  setStoryFlag(CHAPTER4_FLAGS.ROWAN_REPORT_DONE, Boolean(done));
}

function hasChapter5AftershockDone() {
  return getStoryFlag(CHAPTER5_FLAGS.AFTERSHOCK_DONE);
}

function setChapter5AftershockDone(done) {
  setStoryFlag(CHAPTER5_FLAGS.AFTERSHOCK_DONE, Boolean(done));
}

function hasRegion3SeedUnlocked() {
  return getStoryFlag(CHAPTER5_FLAGS.REGION3_SEED_UNLOCKED);
}

function setRegion3SeedUnlocked(unlocked) {
  setStoryFlag(CHAPTER5_FLAGS.REGION3_SEED_UNLOCKED, Boolean(unlocked));
}

function hasVaelorisPatrolSetpieceDone() {
  return getStoryFlag(CHAPTER5_FLAGS.PATROL_SETPIECE_DONE);
}

function setVaelorisPatrolSetpieceDone(done) {
  setStoryFlag(CHAPTER5_FLAGS.PATROL_SETPIECE_DONE, Boolean(done));
}

function hasRegion3SeedEntered() {
  return getStoryFlag("region3_seed_entered");
}

function setRegion3SeedEntered(entered) {
  setStoryFlag("region3_seed_entered", Boolean(entered));
}

function hasChapter6ArrivedWindward() {
  return getStoryFlag(CHAPTER6_FLAGS.ARRIVED_WINDWARD);
}

function setChapter6ArrivedWindward(arrived) {
  setStoryFlag(CHAPTER6_FLAGS.ARRIVED_WINDWARD, Boolean(arrived));
}

function hasChapter6RelayDropped() {
  return getStoryFlag(CHAPTER6_FLAGS.RELAY_DROPPED);
}

function setChapter6RelayDropped(dropped) {
  setStoryFlag(CHAPTER6_FLAGS.RELAY_DROPPED, Boolean(dropped));
}

function hasChapter6WaystoneAttuned() {
  return getStoryFlag(CHAPTER6_FLAGS.WAYSTONE_ATTUNED);
}

function setChapter6WaystoneAttuned(attuned) {
  setStoryFlag(CHAPTER6_FLAGS.WAYSTONE_ATTUNED, Boolean(attuned));
}

function hasChapter7ChoirEngineDefeated() {
  return getStoryFlag(CHAPTER7_CHOIR_ENGINE_DEFEATED_FLAG);
}

function setChapter7ChoirEngineDefeated(defeated) {
  setStoryFlag(CHAPTER7_CHOIR_ENGINE_DEFEATED_FLAG, Boolean(defeated));
}

function getChapter7ConvergenceChoice() {
  const normalized = String(getStoryValue(CHAPTER7_CONVERGENCE_CHOICE_FLAG, "story.", ""))
    .trim()
    .toLowerCase();
  if (normalized === "shatter" || normalized === "tune") return normalized;
  return "";
}

function setChapter7ConvergenceChoice(choice) {
  const normalized = String(choice ?? "")
    .trim()
    .toLowerCase();
  if (normalized !== "shatter" && normalized !== "tune") {
    setStoryValue(CHAPTER7_CONVERGENCE_CHOICE_FLAG, "");
    return "";
  }
  setStoryValue(CHAPTER7_CONVERGENCE_CHOICE_FLAG, normalized);
  return normalized;
}

function hasChapter8AftermathDone() {
  return getStoryFlag(CHAPTER8_FLAGS.AFTERMATH_DONE);
}

function setChapter8AftermathDone(done) {
  setStoryFlag(CHAPTER8_FLAGS.AFTERMATH_DONE, Boolean(done));
}

function hasChapter8RetaliationStarted() {
  return getStoryFlag(CHAPTER8_FLAGS.RETALIATION_STARTED);
}

function setChapter8RetaliationStarted(started) {
  setStoryFlag(CHAPTER8_FLAGS.RETALIATION_STARTED, Boolean(started));
}

function hasChapter8MuteSpikesCleared() {
  return getStoryFlag(CHAPTER8_FLAGS.MUTE_SPIKES_CLEARED);
}

function setChapter8MuteSpikesCleared(cleared) {
  setStoryFlag(CHAPTER8_FLAGS.MUTE_SPIKES_CLEARED, Boolean(cleared));
}

function hasRegion4SeedUnlocked() {
  return getStoryFlag(CHAPTER8_FLAGS.REGION4_SEED_UNLOCKED);
}

function setRegion4SeedUnlocked(unlocked) {
  setStoryFlag(CHAPTER8_FLAGS.REGION4_SEED_UNLOCKED, Boolean(unlocked));
}

function hasRegion4SeedGateUnlocked() {
  return getStoryFlag(CHAPTER8_FLAGS.REGION4_SEED_GATE_UNLOCKED);
}

function setRegion4SeedGateUnlocked(unlocked) {
  setStoryFlag(CHAPTER8_FLAGS.REGION4_SEED_GATE_UNLOCKED, Boolean(unlocked));
}

function hasRegion4SeedEntered() {
  return getStoryFlag("region4_seed_entered");
}

function setRegion4SeedEntered(entered) {
  setStoryFlag("region4_seed_entered", Boolean(entered));
}

function hasChapter9Started() {
  return getStoryFlag(CHAPTER9_FLAGS.STARTED);
}

function setChapter9Started(started) {
  setStoryFlag(CHAPTER9_FLAGS.STARTED, Boolean(started));
}

function hasChapter9AnchorsAttuned() {
  return getStoryFlag(CHAPTER9_FLAGS.ANCHORS_ATTUNED);
}

function setChapter9AnchorsAttuned(attuned) {
  setStoryFlag(CHAPTER9_FLAGS.ANCHORS_ATTUNED, Boolean(attuned));
}

function hasChapter9NullArchivistDefeated() {
  return getStoryFlag(CHAPTER9_FLAGS.NULL_ARCHIVIST_DEFEATED);
}

function setChapter9NullArchivistDefeated(defeated) {
  setStoryFlag(CHAPTER9_FLAGS.NULL_ARCHIVIST_DEFEATED, Boolean(defeated));
}

function getChapter9Choice() {
  const normalized = String(getStoryValue(CHAPTER9_FLAGS.CHOICE, "story.", ""))
    .trim()
    .toLowerCase();
  if (normalized === CHAPTER9_CHOICE_SEAL || normalized === CHAPTER9_CHOICE_TAKE_KEY) {
    return normalized;
  }
  return "";
}

function setChapter9Choice(choice) {
  const normalized = String(choice ?? "")
    .trim()
    .toLowerCase();
  if (normalized !== CHAPTER9_CHOICE_SEAL && normalized !== CHAPTER9_CHOICE_TAKE_KEY) {
    setStoryValue(CHAPTER9_FLAGS.CHOICE, "");
    return "";
  }
  setStoryValue(CHAPTER9_FLAGS.CHOICE, normalized);
  return normalized;
}

function hasEndgameStarted() {
  return getStoryFlag("endgame_started");
}

function setEndgameStarted(started) {
  setStoryFlag("endgame_started", Boolean(started));
}

function getEndgameGoalId() {
  return String(getStoryValue("endgame_goal_id", "story.", "") ?? "");
}

function setEndgameGoalId(goalId) {
  setStoryValue("endgame_goal_id", String(goalId ?? ""));
}

function hasEndgameRouteSeedUnlocked() {
  return getStoryFlag("endgame_route_seed_unlocked");
}

function setEndgameRouteSeedUnlocked(unlocked) {
  setStoryFlag("endgame_route_seed_unlocked", Boolean(unlocked));
}

function hasEndgameAct1Started() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.STARTED);
}

function setEndgameAct1Started(started) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.STARTED, Boolean(started));
}

function hasEndgameThirdSealObtained() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.THIRD_SEAL_OBTAINED);
}

function setEndgameThirdSealObtained(obtained) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.THIRD_SEAL_OBTAINED, Boolean(obtained));
}

function hasEndgameOuterSpireUnlocked() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.OUTER_SPIRE_UNLOCKED);
}

function setEndgameOuterSpireUnlocked(unlocked) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.OUTER_SPIRE_UNLOCKED, Boolean(unlocked));
}

function hasEndgameOuterSpireBreached() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.OUTER_SPIRE_BREACHED);
}

function setEndgameOuterSpireBreached(breached) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.OUTER_SPIRE_BREACHED, Boolean(breached));
}

function hasEndgameGatewardenDefeated() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.GATEWARDEN_DEFEATED);
}

function setEndgameGatewardenDefeated(defeated) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.GATEWARDEN_DEFEATED, Boolean(defeated));
}

function hasEndgameSpireEntryUnlocked() {
  return getStoryFlag(ENDGAME_ACT1_FLAGS.SPIRE_ENTRY_UNLOCKED);
}

function setEndgameSpireEntryUnlocked(unlocked) {
  setStoryFlag(ENDGAME_ACT1_FLAGS.SPIRE_ENTRY_UNLOCKED, Boolean(unlocked));
}

function hasEndgameAct2Started() {
  return getStoryFlag(ENDGAME_ACT2_FLAGS.STARTED);
}

function setEndgameAct2Started(started) {
  setStoryFlag(ENDGAME_ACT2_FLAGS.STARTED, Boolean(started));
}

function hasEndgameInnerSpireEntered() {
  return getStoryFlag(ENDGAME_ACT2_FLAGS.INNER_SPIRE_ENTERED);
}

function setEndgameInnerSpireEntered(entered) {
  setStoryFlag(ENDGAME_ACT2_FLAGS.INNER_SPIRE_ENTERED, Boolean(entered));
}

function hasEndgameResonanceLock(index = 1) {
  const safe = Math.max(1, Math.min(3, Math.floor(Number(index) || 1)));
  if (safe === 1) return getStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_1);
  if (safe === 2) return getStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_2);
  return getStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_3);
}

function setEndgameResonanceLock(index = 1, value = false) {
  const safe = Math.max(1, Math.min(3, Math.floor(Number(index) || 1)));
  const resolved = Boolean(value);
  if (safe === 1) {
    setStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_1, resolved);
    return resolved;
  }
  if (safe === 2) {
    setStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_2, resolved);
    return resolved;
  }
  setStoryFlag(ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_3, resolved);
  return resolved;
}

function hasEndgameAllResonanceLocks() {
  return hasEndgameResonanceLock(1) && hasEndgameResonanceLock(2) && hasEndgameResonanceLock(3);
}

function hasEndgameLoomProctorDefeated() {
  return getStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_DEFEATED);
}

function setEndgameLoomProctorDefeated(defeated) {
  setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_DEFEATED, Boolean(defeated));
}

function hasEndgameAct3Unlocked() {
  return getStoryFlag(ENDGAME_ACT2_FLAGS.ACT3_UNLOCKED);
}

function setEndgameAct3Unlocked(unlocked) {
  setStoryFlag(ENDGAME_ACT2_FLAGS.ACT3_UNLOCKED, Boolean(unlocked));
}

function hasEndgameLastDoorSeen() {
  return getStoryFlag(ENDGAME_ACT2_FLAGS.LAST_DOOR_SEEN);
}

function setEndgameLastDoorSeen(seen) {
  setStoryFlag(ENDGAME_ACT2_FLAGS.LAST_DOOR_SEEN, Boolean(seen));
}

function hasEndgameAct3Started() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.STARTED);
}

function setEndgameAct3Started(started) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.STARTED, Boolean(started));
}

function hasEndgameLastDoorOpened() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.LAST_DOOR_OPENED);
}

function setEndgameLastDoorOpened(opened) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.LAST_DOOR_OPENED, Boolean(opened));
}

function hasEndgameLastSpireEntered() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.LAST_SPIRE_ENTERED);
}

function setEndgameLastSpireEntered(entered) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.LAST_SPIRE_ENTERED, Boolean(entered));
}

function hasEndgameSetpieceRiftCrossed() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.SETPIECE_RIFT_CROSSED);
}

function setEndgameSetpieceRiftCrossed(crossed) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.SETPIECE_RIFT_CROSSED, Boolean(crossed));
}

function hasEndgameSetpieceCoreReached() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.SETPIECE_CORE_REACHED);
}

function setEndgameSetpieceCoreReached(reached) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.SETPIECE_CORE_REACHED, Boolean(reached));
}

function hasEndgameFinalBossDefeated() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.FINAL_BOSS_DEFEATED);
}

function setEndgameFinalBossDefeated(defeated) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.FINAL_BOSS_DEFEATED, Boolean(defeated));
}

function hasEndgameChoiceMade() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.CHOICE_MADE);
}

function setEndgameChoiceMade(made) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.CHOICE_MADE, Boolean(made));
}

function getEndgameEnding() {
  const normalized = String(getStoryValue(ENDGAME_ACT3_FLAGS.ENDING, "story.", "") ?? "")
    .trim()
    .toLowerCase();
  if (normalized === ENDGAME_ENDING_SEAL || normalized === ENDGAME_ENDING_REWRITE) return normalized;
  return "";
}

function setEndgameEnding(ending) {
  const normalized = String(ending ?? "")
    .trim()
    .toLowerCase();
  if (normalized !== ENDGAME_ENDING_SEAL && normalized !== ENDGAME_ENDING_REWRITE) {
    setStoryValue(ENDGAME_ACT3_FLAGS.ENDING, "");
    return "";
  }
  setStoryValue(ENDGAME_ACT3_FLAGS.ENDING, normalized);
  return normalized;
}

function hasEndgameCreditsSeen() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.CREDITS_SEEN);
}

function setEndgameCreditsSeen(seen) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.CREDITS_SEEN, Boolean(seen));
}

function hasNgPlusUnlocked() {
  return getStoryFlag(ENDGAME_ACT3_FLAGS.NGPLUS_UNLOCKED);
}

function setNgPlusUnlocked(unlocked) {
  setStoryFlag(ENDGAME_ACT3_FLAGS.NGPLUS_UNLOCKED, Boolean(unlocked));
}

function hasHarvesterSiteUnlocked() {
  return getStoryFlag(CHAPTER4_FLAGS.HARVESTER_SITE_UNLOCKED);
}

function setHarvesterSiteUnlocked(unlocked) {
  setStoryFlag(CHAPTER4_FLAGS.HARVESTER_SITE_UNLOCKED, Boolean(unlocked));
}

function hasListeningSpikeLeadUnlocked() {
  return getStoryFlag(CHAPTER3_FLAGS.LISTENING_SPIKE_LEAD_UNLOCKED);
}

function setListeningSpikeLeadUnlocked(unlocked) {
  setStoryFlag(CHAPTER3_FLAGS.LISTENING_SPIKE_LEAD_UNLOCKED, Boolean(unlocked));
}

function hasListeningSpikeSiteCleared() {
  return getStoryFlag(LISTENING_SPIKE_FLAGS.SITE_CLEARED);
}

function setListeningSpikeSiteCleared(cleared) {
  setStoryFlag(LISTENING_SPIKE_FLAGS.SITE_CLEARED, Boolean(cleared));
}

function getListeningSpikeChoice() {
  return normalizeListeningSpikeChoice(getStoryValue(LISTENING_SPIKE_FLAGS.CHOICE, "story.", ""));
}

function setListeningSpikeChoice(choice) {
  const resolved = normalizeListeningSpikeChoice(choice);
  setStoryValue(LISTENING_SPIKE_FLAGS.CHOICE, resolved);
  return resolved;
}

function isEmberfallUnlocked() {
  return hasStoryEmberfallUnlocked() || hasEmberfallLeadUnlocked() || (hasElaineJoined() && hasVeinQuestComplete());
}

function hasElaineJoined() {
  return getStoryFlag("elaine_joined");
}

function hasWillowJoined() {
  return getStoryFlag("willow_joined");
}

function hasPartyCompanionJoined() {
  return hasElaineJoined() || hasWillowJoined();
}

function setElaineJoined(joined) {
  setStoryFlag("elaine_joined", Boolean(joined));
  partySystem.setJoined(Boolean(joined), player.position);
  partySystem.setActiveCharacter(activePartyMember, player.position);
  if (joined) {
    resetElaineSupportState({ restoreFull: true });
  } else {
    statusEffects.clearEffects(STATUS_ENTITY_IDS.ELAINE);
    setActivePartyMember("arthur");
    elaineDowned = true;
  }
}

function setWillowJoined(joined, { showToast = false } = {}) {
  const resolved = Boolean(joined);
  const wasJoined = willowJoinedCached;
  setStoryFlag("willow_joined", resolved);
  if (resolved) {
    setWillowMet(true);
  }
  partySystem.setWillowJoined(resolved, player.position);
  partySystem.setActiveCharacter(activePartyMember, player.position);
  willowJoinedCached = resolved;
  if (resolved) {
    if (getCurrentObjectiveId() === OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL) {
      setCurrentObjectiveId(OBJECTIVE_IDS.NONE);
    }
    if (!wasJoined) {
      willowMp = willowMaxMp;
      for (const key of Object.keys(willowSpellCooldowns)) {
        willowSpellCooldowns[key] = 0;
      }
    }
    if (showToast || !willowJoinToastShown) {
      setTransientMessage("Willow joined the party.", 1.8);
    }
    willowJoinToastShown = true;
  } else {
    statusEffects.clearEffects(STATUS_ENTITY_IDS.WILLOW);
    willowPendingCasts.length = 0;
    clearEnemyStatusEffects();
    willowJoinToastShown = false;
    if (activePartyMember === "willow") {
      setActivePartyMember("arthur", { snapCamera: true });
    }
  }
}

function syncWillowJoinState() {
  const joined = hasWillowJoined();
  if (joined === willowJoinedCached) return;
  setWillowJoined(joined, { showToast: joined });
}

function hasVeinGuardianActive() {
  return getStoryFlag("vein_guardian_active");
}

function setVeinGuardianActive(active) {
  setStoryFlag("vein_guardian_active", Boolean(active));
}

function hasVeinGuardianDefeated() {
  return getStoryFlag("vein_guardian_defeated");
}

function setVeinGuardianDefeated(defeated) {
  setStoryFlag("vein_guardian_defeated", Boolean(defeated));
}

function hasHarvesterBossActive() {
  return getStoryFlag(VAELORIS_HARVESTER_ACTIVE_FLAG);
}

function setHarvesterBossActive(active) {
  setStoryFlag(VAELORIS_HARVESTER_ACTIVE_FLAG, Boolean(active));
}

function hasHarvesterBossDefeated() {
  return getStoryFlag(VAELORIS_HARVESTER_DEFEATED_FLAG) || getStoryFlag(CHAPTER4_FLAGS.HARVESTER_WARDEN_DEFEATED);
}

function setHarvesterBossDefeated(defeated) {
  const resolved = Boolean(defeated);
  setStoryFlag(VAELORIS_HARVESTER_DEFEATED_FLAG, resolved);
  setStoryFlag(CHAPTER4_FLAGS.HARVESTER_WARDEN_DEFEATED, resolved);
}

function hasAct2FalloutDone() {
  return getStoryFlag(ACT2_FALLOUT_FLAG);
}

function setAct2FalloutDone(done) {
  setStoryFlag(ACT2_FALLOUT_FLAG, Boolean(done));
}

function hasRowanCouncilDone() {
  return getStoryFlag(ROWAN_COUNCIL_FLAG);
}

function setRowanCouncilDone(done) {
  setStoryFlag(ROWAN_COUNCIL_FLAG, Boolean(done));
}

function hasEmberfallLeadUnlocked() {
  return getStoryFlag(EMBERFALL_LEAD_UNLOCKED_FLAG);
}

function setEmberfallLeadUnlocked(unlocked) {
  setStoryFlag(EMBERFALL_LEAD_UNLOCKED_FLAG, Boolean(unlocked));
}

function getCurrentObjectiveId() {
  const stored = getStoryValue(CURRENT_OBJECTIVE_FLAG, "story.", OBJECTIVE_IDS.NONE);
  return normalizeObjectiveId(stored);
}

function setCurrentObjectiveId(objectiveId) {
  const normalized = normalizeObjectiveId(objectiveId);
  setStoryValue(CURRENT_OBJECTIVE_FLAG, normalized);
  return normalized;
}

function isRidgeGateUnlocked() {
  return getStoryFlag(RIDGE_GATE_UNLOCKED_FLAG);
}

function setRidgeGateUnlocked(unlocked) {
  setStoryFlag(RIDGE_GATE_UNLOCKED_FLAG, Boolean(unlocked));
}

function hasVaelorisPatrolClearedOnce() {
  return getStoryFlag(VAELORIS_PATROL_FLAGS.CLEARED_ONCE);
}

function setVaelorisPatrolClearedOnce(cleared) {
  setStoryFlag(VAELORIS_PATROL_FLAGS.CLEARED_ONCE, Boolean(cleared));
}

function hasVaelorisTagObtained() {
  return getStoryFlag(VAELORIS_PATROL_FLAGS.TAG_OBTAINED);
}

function setVaelorisTagObtained(obtained) {
  setStoryFlag(VAELORIS_PATROL_FLAGS.TAG_OBTAINED, Boolean(obtained));
}

function normalizeHarvesterChoice(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === HARVESTER_CHOICE_VALUES.SHATTER || normalized === HARVESTER_CHOICE_VALUES.SALVAGE) {
    return normalized;
  }
  return HARVESTER_CHOICE_VALUES.NONE;
}

function getHarvesterChoice() {
  return normalizeHarvesterChoice(getStoryValue(VAELORIS_HARVESTER_CHOICE_FLAG, "story.", ""));
}

function setHarvesterChoice(choice) {
  const resolved = normalizeHarvesterChoice(choice);
  setStoryValue(VAELORIS_HARVESTER_CHOICE_FLAG, resolved);
  return resolved;
}

function getVaelorisPressureStage() {
  const stored = getStoryValue(VAELORIS_PRESSURE_STAGE_FLAG, "story.", null);
  if (stored === null || stored === undefined || stored === "") {
    return getHarvesterChoice() === HARVESTER_CHOICE_VALUES.SALVAGE ? 2 : 1;
  }
  const raw = Number(stored);
  if (!Number.isFinite(raw)) return 1;
  return Math.max(1, Math.min(2, Math.floor(raw)));
}

function setVaelorisPressureStage(stage) {
  const resolved = Math.max(1, Math.min(2, Math.floor(Number(stage) || 1)));
  setStoryValue(VAELORIS_PRESSURE_STAGE_FLAG, resolved);
  return resolved;
}

function normalizeVaelorisChoice(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === VAELORIS_CHOICE_VALUES.DISABLE || normalized === VAELORIS_CHOICE_VALUES.LEAVE) {
    return normalized;
  }
  return VAELORIS_CHOICE_VALUES.NONE;
}

function hasVaelorisFieldTriggered() {
  return Boolean(
    saveState.getStoryFlag(VAELORIS_FIELD_TRIGGER_FLAG) ??
      saveState.getFlag(`story.${VAELORIS_FIELD_TRIGGER_FLAG}`)
  );
}

function setVaelorisFieldTriggered(triggered) {
  const resolved = Boolean(triggered);
  vaelorisFieldTriggered = resolved;
  setStoryFlag(VAELORIS_FIELD_TRIGGER_FLAG, resolved);
}

function getVaelorisChoice() {
  return normalizeVaelorisChoice(
    saveState.getStoryFlag("vaeloris_first_choice") ?? saveState.getFlag("story.vaeloris_first_choice")
  );
}

function setVaelorisChoice(choice) {
  const resolved = normalizeVaelorisChoice(choice);
  vaelorisChoice = resolved;
  saveState.setStoryFlag("vaeloris_first_choice", resolved);
  saveState.setFlag("story.vaeloris_first_choice", resolved);
  sceneManager.notifyStoryFlagChanged("vaeloris_first_choice", resolved);
  sceneManager.notifyStoryFlagChanged("story.vaeloris_first_choice", resolved);
  return resolved;
}

function syncVaelorisExtractorVisual() {
  sceneManager.setVaelorisExtractorDestroyed(vaelorisChoice === VAELORIS_CHOICE_VALUES.DISABLE);
}

function getVaelorisFieldConfig() {
  return sceneManager.getVaelorisFieldConfig?.() ?? null;
}

function getRidgeGateConfig() {
  return sceneManager.getRidgeGateConfig?.() ?? null;
}

function getAshGateConfig() {
  return sceneManager.getAshGateConfig?.() ?? null;
}

function getRootwayGateConfig() {
  return sceneManager.getRootwayGateConfig?.() ?? null;
}

function isNearLockedAshGate() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  const config = getAshGateConfig();
  if (!config || config.unlocked) return false;
  const interactionRadius = Math.max(0.75, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(player.position.x - config.position.x, player.position.z - config.position.y);
  return distance <= interactionRadius;
}

function isNearLockedRidgeGate() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  const config = getRidgeGateConfig();
  if (!config || config.unlocked) return false;
  const interactionRadius = Math.max(0.75, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(player.position.x - config.position.x, player.position.z - config.position.y);
  return distance <= interactionRadius;
}

function isNearRidgeGateBlockedByPatrol() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  if (!hasChapter5AftershockDone()) return false;
  if (hasVaelorisPatrolSetpieceDone()) return false;
  const config = getRidgeGateConfig();
  if (!config || !config.unlocked) return false;
  const interactionRadius = Math.max(0.75, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(player.position.x - config.position.x, player.position.z - config.position.y);
  return distance <= interactionRadius;
}

function isNearLockedRootwayGate() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  const config = getRootwayGateConfig();
  if (!config || config.unlocked) return false;
  const interactionRadius = Math.max(0.72, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(player.position.x - config.position.x, player.position.z - config.position.y);
  return distance <= interactionRadius;
}

function isNearRootwayGateBlockedByRetaliation() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  if (!hasRegion4SeedUnlocked()) return false;
  if (!hasChapter8AftermathDone()) return false;
  if (hasChapter8MuteSpikesCleared()) return false;
  const config = getRootwayGateConfig();
  if (!config) return false;
  const interactionRadius = Math.max(0.72, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(player.position.x - config.position.x, player.position.z - config.position.y);
  return distance <= interactionRadius;
}

function tryHandleLockedRidgeGateInteraction({ showToast = true } = {}) {
  if (isNearRidgeGateBlockedByPatrol()) {
    if (showToast) {
      setTransientMessage(RIDGE_SCOUTS_BLOCK_MESSAGE, 1.15);
    }
    return true;
  }
  if (!isNearLockedRidgeGate() && !isNearLockedAshGate()) return false;
  if (showToast) {
    setTransientMessage(RIDGE_GATE_SEALED_MESSAGE, 1.15);
  }
  return true;
}

function tryHandleLockedRootwayGateInteraction({ showToast = true } = {}) {
  if (isNearRootwayGateBlockedByRetaliation()) {
    if (showToast) {
      setTransientMessage(ROOTWAY_GATE_BLOCKED_MESSAGE, 1.15);
    }
    return true;
  }
  if (!isNearLockedRootwayGate()) return false;
  if (showToast) {
    setTransientMessage(ROOTWAY_GATE_SEALED_MESSAGE, 1.15);
  }
  return true;
}

function syncVaelorisPressureState() {
  vaelorisPressureStage = getVaelorisPressureStage();
  vaelorisPatrolFrame = vaelorisPressureSystem.syncStoryState({
    pressureStage: vaelorisPressureStage,
    harvesterChoice: getHarvesterChoice(),
    patrolClearedOnce: hasVaelorisPatrolClearedOnce(),
    tagObtained: hasVaelorisTagObtained(),
  });
  return vaelorisPatrolFrame;
}

function hasRowanCouncilMilestone() {
  if (hasVeinGuardianDefeated()) return true;
  if (getStoryFlag("first_vein_stabilized")) return true;
  const stabilizedCount = Math.max(
    0,
    Number(getStoryValue("progress_beats.veins_stabilized_count", "story.", 0)) || 0
  );
  if (stabilizedCount >= 1) return true;
  return Boolean(saveState.getStoryFlag(FIRST_VEIN_COMPLETION_FLAG));
}

function resolveStoryObjectiveState() {
  const bossState = bossInstance.getState();
  const chapter7ConvergenceChoice = getChapter7ConvergenceChoice();
  const harvesterChoiceResolved = getHarvesterChoice() !== HARVESTER_CHOICE_VALUES.NONE;
  const harvesterDefeated = hasHarvesterBossDefeated();
  const harvesterBossActive = Boolean(
    hasHarvesterBossActive() || (bossState?.active && bossState?.bossId === HARVESTER_WARDEN_BOSS_ID)
  );
  const bossAvailable =
    currentSceneInfo.sceneId === "emberfall" &&
    hasVeinGuardianDefeated() &&
    hasHarvesterSiteUnlocked() &&
    !harvesterDefeated &&
    !harvesterChoiceResolved &&
    !bossInstance.isActive();
  const ridgeGateUnlocked = isRidgeGateUnlocked();
  const chapter5AftershockDone = hasChapter5AftershockDone();
  const patrolSetpieceDone = hasVaelorisPatrolSetpieceDone();
  const region3SeedUnlocked = hasRegion3SeedUnlocked();
  const enteredRegion3Seed = hasRegion3SeedEntered();
  const chapter6ArrivedWindward = hasChapter6ArrivedWindward();
  const chapter6RelayDropped = hasChapter6RelayDropped();
  const chapter6WaystoneAttuned = hasChapter6WaystoneAttuned();
  const chapter8AftermathDone = hasChapter8AftermathDone();
  const chapter8RetaliationStarted = hasChapter8RetaliationStarted();
  const chapter8MuteSpikesCleared = hasChapter8MuteSpikesCleared();
  const region4SeedUnlocked = hasRegion4SeedUnlocked();
  const region4SeedGateUnlocked = hasRegion4SeedGateUnlocked();
  const region4SeedEntered = hasRegion4SeedEntered();
  const chapter9Started = hasChapter9Started();
  const chapter9AnchorsAttuned = hasChapter9AnchorsAttuned();
  const chapter9NullArchivistDefeated = hasChapter9NullArchivistDefeated();
  const chapter9Choice = getChapter9Choice();
  const chapter9BossActive = Boolean(
    (bossState?.active && bossState?.bossId === NULL_ARCHIVIST_BOSS_ID) || getStoryFlag("chapter9_null_archivist_active")
  );
  const spireGatewardenActive = Boolean(
    (bossState?.active && bossState?.bossId === SPIRE_GATEWARDEN_BOSS_ID) ||
      getStoryFlag("endgame_spire_gatewarden_active")
  );
  const loomProctorActive = Boolean(
    (bossState?.active && bossState?.bossId === LOOM_PROCTOR_BOSS_ID) ||
      getStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE)
  );
  const narratorCrownActive = Boolean(
    (bossState?.active && bossState?.bossId === NARRATOR_CROWN_BOSS_ID) ||
      getStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE)
  );
  const endgameStarted = hasEndgameStarted();
  const endgameGoalId = getEndgameGoalId();
  const endgameRouteSeedUnlocked = hasEndgameRouteSeedUnlocked();
  const endgameAct1Started = hasEndgameAct1Started();
  const endgameTaskThirdSealObtained = hasEndgameThirdSealObtained();
  const endgameOuterSpireUnlocked = hasEndgameOuterSpireUnlocked();
  const endgameOuterSpireBreached = hasEndgameOuterSpireBreached();
  const endgameGatewardenDefeated = hasEndgameGatewardenDefeated();
  const endgameSpireEntryUnlocked = hasEndgameSpireEntryUnlocked();
  const endgameAct2Started = hasEndgameAct2Started();
  const endgameInnerSpireEntered = hasEndgameInnerSpireEntered();
  const endgameResonanceLock1 = hasEndgameResonanceLock(1);
  const endgameResonanceLock2 = hasEndgameResonanceLock(2);
  const endgameResonanceLock3 = hasEndgameResonanceLock(3);
  const endgameLoomProctorDefeated = hasEndgameLoomProctorDefeated();
  const endgameAct3Unlocked = hasEndgameAct3Unlocked();
  const endgameLastDoorSeen = hasEndgameLastDoorSeen();
  const endgameAct3Started = hasEndgameAct3Started();
  const endgameLastDoorOpened = hasEndgameLastDoorOpened();
  const endgameLastSpireEntered = hasEndgameLastSpireEntered();
  const endgameSetpieceRiftCrossed = hasEndgameSetpieceRiftCrossed();
  const endgameSetpieceCoreReached = hasEndgameSetpieceCoreReached();
  const endgameFinalBossDefeated = hasEndgameFinalBossDefeated();
  const endgameChoiceMade = hasEndgameChoiceMade();
  const endgameEnding = getEndgameEnding();
  const endgameCreditsSeen = hasEndgameCreditsSeen();
  const ngplusUnlocked = hasNgPlusUnlocked();
  const memoryPressureState = memoryPressureTracker.getState();
  const chapter9AnchorsRemaining =
    chapter9SetpieceState.anchors.length > 0
      ? chapter9SetpieceState.anchors.reduce((count, anchor) => count + (anchor?.attuned ? 0 : 1), 0)
      : chapter9AnchorsAttuned
        ? 0
        : 3;
  const chapter6RelayActive = chapter6RelaySetpieceState.active;
  const chapter6RelayRemainingTethers = getRelaySetpieceRemainingTethers();
  const chapter6RelayEnemyCount =
    chapter6RelaySetpieceState.active && Array.isArray(chapter6RelaySetpieceState.enemyIds)
      ? combatSystem.countAliveEnemiesByIds(chapter6RelaySetpieceState.enemyIds)
      : 0;
  const chapter8EnemyCount =
    chapter8RetaliationSetpieceState.active && Array.isArray(chapter8RetaliationSetpieceState.enemyIds)
      ? combatSystem.countAliveEnemiesByIds(chapter8RetaliationSetpieceState.enemyIds)
      : 0;
  const chapter8RemainingSpikes = chapter8RetaliationSetpieceState.active
    ? chapter8RetaliationSetpieceState.spikes.reduce((count, spike) => count + (spike?.hp > 0 ? 1 : 0), 0)
    : 0;
  const patrolNearby =
    currentSceneInfo.sceneId === "thornmere" &&
    Boolean(vaelorisPatrolFrame.active || vaelorisPatrolFrame.insideZone);
  const nearRowanNpc =
    currentSceneInfo.sceneId === "thornmere"
      ? sceneManager.getNearestNpcInRange(getPlayerXZ(), 1.06)
      : null;
  const nearRowan = nearRowanNpc?.id === "elder_rowan";
  return resolveCurrentObjective({
    sceneId: currentSceneInfo.sceneId,
    nearRowan,
    milestoneMet: hasRowanCouncilMilestone(),
    rowanCouncilDone: hasRowanCouncilDone(),
    chapter2Started: hasChapter2Started(),
    chapter2ArrivedEmberfall: hasChapter2ArrivedEmberfall(),
    chapter2AmbushActive: willowAmbushState.active,
    chapter2AmbushEnemyCount: willowAmbushState.enemyIds.length,
    emberfallLeadUnlocked: hasEmberfallLeadUnlocked(),
    emberfallUnlocked: hasStoryEmberfallUnlocked(),
    willowMet: hasWillowMet(),
    willowJoined: hasWillowJoined(),
    chapter3RowanDebriefDone: hasChapter3RowanDebriefDone(),
    chapter4RowanReportDone: hasChapter4RowanReportDone(),
    harvesterSiteUnlocked: hasHarvesterSiteUnlocked(),
    harvesterBossActive,
    harvesterBossDefeated: harvesterDefeated,
    listeningSpikeLeadUnlocked: hasListeningSpikeLeadUnlocked(),
    listeningSpikeSiteCleared: hasListeningSpikeSiteCleared(),
    listeningSpikeChoice: getListeningSpikeChoice(),
    listeningSpikeChoiceResolved: getListeningSpikeChoice() !== LISTENING_SPIKE_CHOICE_VALUES.NONE,
    chapter5AftershockDone,
    patrolSetpieceDone,
    region3SeedUnlocked,
    enteredRegion3Seed,
    chapter6ArrivedWindward,
    chapter6RelayActive,
    chapter6RelayDropped,
    chapter6RelayRemainingTethers,
    chapter6RelayEnemyCount,
    chapter6WaystoneAttuned,
    chapter7ChoirEngineDefeated: hasChapter7ChoirEngineDefeated(),
    chapter7ConvergenceChoice,
    chapter8AftermathDone,
    chapter8RetaliationStarted,
    chapter8MuteSpikesCleared,
    chapter8SetpieceActive: chapter8RetaliationSetpieceState.active,
    chapter8RemainingSpikes,
    chapter8EnemyCount,
    region4SeedUnlocked,
    region4SeedGateUnlocked,
    region4SeedEntered,
    chapter9Started,
    chapter9SetpieceActive: chapter9SetpieceState.active || chapter9BossActive,
    chapter9AnchorsAttuned,
    chapter9AnchorsRemaining,
    chapter9SunderWaves: chapter9SetpieceState.sunderWaves,
    chapter9BossActive,
    chapter9NullArchivistDefeated,
    chapter9Choice,
    endgameStarted,
    endgameGoalId,
    endgameRouteSeedUnlocked,
    endgameAct1Started,
    endgameTaskThirdSealObtained,
    endgameOuterSpireUnlocked,
    endgameOuterSpireBreached,
    endgameGatewardenDefeated,
    endgameSpireEntryUnlocked,
    endgameAct2Started,
    endgameInnerSpireEntered,
    endgameResonanceLock1,
    endgameResonanceLock2,
    endgameResonanceLock3,
    endgameLoomProctorDefeated,
    endgameAct3Unlocked,
    endgameLastDoorSeen,
    endgameAct3Started,
    endgameLastDoorOpened,
    endgameLastSpireEntered,
    endgameSetpieceRiftCrossed,
    endgameSetpieceCoreReached,
    endgameFinalBossDefeated,
    endgameChoiceMade,
    endgameEnding,
    endgameCreditsSeen,
    ngplusUnlocked,
    thirdSealSetpieceActive: thirdSealQuestState.active,
    thirdSealAttuneReady: thirdSealQuestState.attuneReady,
    thirdSealChanneling: Boolean(thirdSealQuestState.channeling),
    spireBreachActive: spireBreachState.active,
    spireBreachNodesRemaining: spireBreachState.lockNodes.reduce((count, node) => count + (node?.disabled ? 0 : 1), 0),
    spireBreachDischarges: Number(spireBreachState.discharges ?? 0),
    spireGatewardenActive,
    loomProctorActive,
    narratorCrownActive,
    riftAnchorCount: lastSpireState.riftAnchors.reduce((count, anchor) => count + (anchor?.attuned ? 1 : 0), 0),
    riftSetpieceActive: Boolean(lastSpireState.riftActive),
    coreClampsRemaining: lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 0 : 1), 0),
    coreSetpieceActive: Boolean(lastSpireState.coreActive),
    memoryPressureActive: Boolean(memoryPressureState.active),
    memoryPressureTierCount: Array.isArray(memoryPressureState.triggeredThresholds)
      ? memoryPressureState.triggeredThresholds.length
      : 0,
    ridgeGateUnlocked,
    ridgeTrailActive: ridgeGateUnlocked && chapter5AftershockDone && !patrolSetpieceDone,
    ridgePathReady: ridgeGateUnlocked && chapter5AftershockDone && patrolSetpieceDone,
    patrolEnemyCount: Array.isArray(vaelorisPatrolFrame.enemyIds) ? vaelorisPatrolFrame.enemyIds.length : 0,
    veinActive: lastVeinFrame.active,
    bossAvailable,
    patrolNearby,
    harvesterChoiceResolved,
  });
}

function queueRowanCouncil(outcome) {
  if (!outcome?.triggered) return false;

  setRowanCouncilDone(true);
  setEmberfallLeadUnlocked(true);
  setRidgeGateUnlocked(true);
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }

  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || 1);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  rowanCouncilPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    unlockToast: String(outcome.unlockToast ?? ""),
  };
  return true;
}

function tryTriggerRowanCouncilEvent({ force = false } = {}) {
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (dialogueBox.isOpen()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }

  const rowanNpc =
    currentSceneInfo.sceneId === "thornmere"
      ? sceneManager.getNearestNpcInRange(getPlayerXZ(), 1.06)
      : null;
  const outcome = tryTriggerRowanCouncil({
    currentSceneId: currentSceneInfo.sceneId,
    nearRowan: rowanNpc?.id === "elder_rowan",
    milestoneMet: hasRowanCouncilMilestone(),
    rowanCouncilDone: hasRowanCouncilDone(),
    emberfallLeadUnlocked: hasEmberfallLeadUnlocked(),
    willowJoined: hasWillowJoined(),
    harvesterChoiceResolved: getHarvesterChoice() !== HARVESTER_CHOICE_VALUES.NONE,
    force,
  });
  if (!outcome?.triggered) return false;
  const queued = queueRowanCouncil(outcome);
  if (queued) {
    refreshQuestText();
    applyVaelorisWorldModifiers();
  }
  return queued;
}

function updateRowanCouncilSequence(dtSeconds) {
  if (!rowanCouncilPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  rowanCouncilPending.lockRemaining = Math.max(0, rowanCouncilPending.lockRemaining - dt);
  if (rowanCouncilPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (dialogueBox.isOpen()) return;
  if (sceneManager.hasBlockingUiScene()) return;

  const script = Array.isArray(rowanCouncilPending.lines) ? rowanCouncilPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (rowanCouncilPending.unlockToast) {
    setTransientMessage(rowanCouncilPending.unlockToast, RIDGE_GATE_UNLOCK_TOAST_SECONDS);
  }
  rowanCouncilPending = null;
}

function queueChapter3Debrief(outcome) {
  if (!outcome?.triggered) return false;
  setChapter3RowanDebriefDone(true);
  setListeningSpikeLeadUnlocked(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE);
  refreshQuestText();
  controlLockRemaining = Math.max(
    controlLockRemaining,
    Math.max(0, Number(outcome.lockSeconds) || CHAPTER3_DEBRIEF_LOCK_SECONDS)
  );
  chapter3DebriefPending = {
    lockRemaining: Math.max(0, Number(outcome.lockSeconds) || CHAPTER3_DEBRIEF_LOCK_SECONDS),
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    unlockToast: String(outcome.unlockToast ?? ""),
  };
  return true;
}

function tryTriggerRowanDebriefChapter3Event({ force = false, nearRowan = false } = {}) {
  if (!force && chapter3DebriefPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerRowanDebrief({
    currentSceneId: currentSceneInfo.sceneId,
    nearRowan,
    willowJoined: hasWillowJoined(),
    chapter3RowanDebriefDone: hasChapter3RowanDebriefDone(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter3Debrief(outcome);
}

function updateChapter3DebriefSequence(dtSeconds) {
  if (!chapter3DebriefPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter3DebriefPending.lockRemaining = Math.max(0, chapter3DebriefPending.lockRemaining - dt);
  if (chapter3DebriefPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(chapter3DebriefPending.lines) ? chapter3DebriefPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (chapter3DebriefPending.unlockToast) {
    setTransientMessage(chapter3DebriefPending.unlockToast, 1.7);
  }
  chapter3DebriefPending = null;
}

function queueChapter4RowanReport(outcome) {
  if (!outcome?.triggered) return false;
  setChapter4RowanReportDone(true);
  setHarvesterSiteUnlocked(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.REACH_HARVESTER_SITE);
  refreshQuestText();
  controlLockRemaining = Math.max(
    controlLockRemaining,
    Math.max(0, Number(outcome.lockSeconds) || CHAPTER4_ROWAN_REPORT_LOCK_SECONDS)
  );
  chapter4RowanReportPending = {
    lockRemaining: Math.max(0, Number(outcome.lockSeconds) || CHAPTER4_ROWAN_REPORT_LOCK_SECONDS),
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    unlockToast: String(outcome.unlockToast ?? ""),
  };
  return true;
}

function tryTriggerChapter4RowanReportEvent({ force = false, nearRowan = false } = {}) {
  if (!force && chapter4RowanReportPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerChapter4RowanReport({
    currentSceneId: currentSceneInfo.sceneId,
    nearRowan,
    listeningSpikeSiteCleared: hasListeningSpikeSiteCleared(),
    listeningSpikeChoice: getListeningSpikeChoice(),
    chapter4RowanReportDone: hasChapter4RowanReportDone(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter4RowanReport(outcome);
}

function updateChapter4RowanReportSequence(dtSeconds) {
  if (!chapter4RowanReportPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter4RowanReportPending.lockRemaining = Math.max(0, chapter4RowanReportPending.lockRemaining - dt);
  if (chapter4RowanReportPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(chapter4RowanReportPending.lines) ? chapter4RowanReportPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (chapter4RowanReportPending.unlockToast) {
    setTransientMessage(chapter4RowanReportPending.unlockToast, 1.7);
  }
  chapter4RowanReportPending = null;
}

function queueChapter5Aftershock(outcome) {
  if (!outcome?.triggered) return false;
  setChapter5AftershockDone(true);
  setRidgeGateUnlocked(true);
  setRegion3SeedUnlocked(true);
  setVaelorisPatrolSetpieceDone(false);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  vaelorisPressureStage = setVaelorisPressureStage(outcome.pressureStage ?? vaelorisPressureStage);
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.CLEAR_RIDGE_PATROL);
  refreshQuestText();
  applyVaelorisWorldModifiers();

  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER5_AFTERSHOCK_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter5AftershockPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    unlockToast: String(outcome.unlockToast ?? ""),
    watchedToast:
      Number(outcome.pressureStage ?? 1) >= 2 && String(outcome.choice ?? "").toLowerCase() === "salvage"
        ? "The Crown feels... watched."
        : "",
  };
  return true;
}

function tryTriggerChapter5AftershockEvent({ force = false, nearRowan = false } = {}) {
  if (!force && chapter5AftershockPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerChapter5Aftershock({
    currentSceneId: currentSceneInfo.sceneId,
    nearRowan,
    harvesterWardenDefeated: hasHarvesterBossDefeated(),
    harvesterChoice: getHarvesterChoice(),
    chapter5AftershockDone: hasChapter5AftershockDone(),
    willowJoined: hasWillowJoined(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    currentPressureStage: getVaelorisPressureStage(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter5Aftershock(outcome);
}

function updateChapter5AftershockSequence(dtSeconds) {
  if (!chapter5AftershockPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter5AftershockPending.lockRemaining = Math.max(0, chapter5AftershockPending.lockRemaining - dt);
  if (chapter5AftershockPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(chapter5AftershockPending.lines) ? chapter5AftershockPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (chapter5AftershockPending.unlockToast) {
    setTransientMessage(chapter5AftershockPending.unlockToast, 1.8);
  }
  if (chapter5AftershockPending.watchedToast) {
    stabilityToastText = chapter5AftershockPending.watchedToast;
    stabilityToastSeconds = Math.max(stabilityToastSeconds, 1.45);
  }
  chapter5AftershockPending = null;
}

function queueChapter6Arrival(outcome) {
  if (!outcome?.triggered) return false;
  setChapter6ArrivedWindward(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE);
  refreshQuestText();
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER6_ARRIVAL_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter6ArrivalPending = {
    lockRemaining: lockSeconds,
    title: String(outcome.title || CHAPTER6_ARRIVAL_TITLE),
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
  };
  introTextBeat.start(chapter6ArrivalPending.title, {
    fadeIn: 0.2,
    hold: 0.42,
    fadeOut: 0.36,
  });
  return true;
}

function tryTriggerChapter6ArrivalEvent({ force = false } = {}) {
  if (!force && chapter6ArrivalPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerChapter6Arrival({
    currentSceneId: currentSceneInfo.sceneId,
    chapter6ArrivedWindward: hasChapter6ArrivedWindward(),
    chapter5AftershockDone: hasChapter5AftershockDone(),
    patrolSetpieceDone: hasVaelorisPatrolSetpieceDone(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    harvesterChoice: getHarvesterChoice(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter6Arrival(outcome);
}

function updateChapter6ArrivalSequence(dtSeconds) {
  if (!chapter6ArrivalPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter6ArrivalPending.lockRemaining = Math.max(0, chapter6ArrivalPending.lockRemaining - dt);
  if (chapter6ArrivalPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (introTextBeat.isActive()) return;
  const script = Array.isArray(chapter6ArrivalPending.lines) ? chapter6ArrivalPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "chapter6_arrival",
      npcName: "Windward Ridge",
      script,
    });
  }
  chapter6ArrivalPending = null;
}

function getRelaySetpieceAliveTethers() {
  return chapter6RelaySetpieceState.tethers.filter((entry) => entry.hp > 0);
}

function getRelaySetpieceRemainingTethers() {
  return getRelaySetpieceAliveTethers().length;
}

function startChapter6RelaySetpiece({ force = false } = {}) {
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const relayConfig = getWindwardRelayConfig();
  if (!relayConfig?.center) return false;
  const triggerRadius = Math.max(0.7, Number(relayConfig.triggerRadius) || 1.1);
  const inTriggerZone =
    Math.hypot(player.position.x - relayConfig.center.x, player.position.z - relayConfig.center.y) <= triggerRadius;
  const outcome = tryStartRelaySetpiece({
    currentSceneId: currentSceneInfo.sceneId,
    chapter6ArrivedWindward: hasChapter6ArrivedWindward(),
    relayDropped: hasChapter6RelayDropped(),
    relayActive: chapter6RelaySetpieceState.active,
    inTriggerZone,
    relayConfig,
    pressureStage: getVaelorisPressureStage(),
    force,
  });
  if (!outcome?.triggered) return false;

  const enemyIds = combatSystem.spawnEnemies(
    (outcome.enemySpawns ?? []).map((entry) => ({
      id: entry.id,
      role: entry.role,
      type: entry.type,
      x: entry.x,
      z: entry.z,
      maxHealth: entry.maxHealth,
      aggroRadius: entry.aggroRadius,
      attackRange: entry.attackRange,
      attackCooldown: entry.attackCooldown,
      lingerTag: entry.lingerTag,
    }))
  );
  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) {
    return false;
  }

  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }

  chapter6RelaySetpieceState.active = true;
  chapter6RelaySetpieceState.center.set(outcome.center.x, outcome.center.y);
  chapter6RelaySetpieceState.radius = Math.max(1.85, Number(outcome.arenaRadius) || 2.4);
  chapter6RelaySetpieceState.enemyIds = [...enemyIds];
  chapter6RelaySetpieceState.tethers = (outcome.tethers ?? []).map((entry, index) => ({
    id: entry.id ?? `relay-tether-${index + 1}`,
    x: Number(entry.x) || 0,
    z: Number(entry.z) || 0,
    maxHealth: Math.max(1, Number(entry.maxHealth) || 32),
    hp: Math.max(1, Number(entry.maxHealth) || 32),
  }));
  chapter6RelaySetpieceState.boundsToastCooldown = 0;
  chapter6RelayRing.visible = true;
  chapter6RelayRing.position.set(outcome.center.x, -0.884, outcome.center.y);
  chapter6RelayRing.scale.set(chapter6RelaySetpieceState.radius, chapter6RelaySetpieceState.radius, 1);
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.DROP_RELAY);
  refreshQuestText();
  setTransientMessage(String(outcome.startToast ?? "A signal relay locks onto the Circle."), 1.45);
  markMapDirty();
  return true;
}

function completeChapter6RelaySetpiece({ force = false } = {}) {
  if (!force && !chapter6RelaySetpieceState.active) return false;
  clearChapter6RelaySetpieceState();
  setChapter6RelayDropped(true);
  setTransientMessage("The wind quiets. The relay falls silent.", 1.55);
  setCurrentObjectiveId(OBJECTIVE_IDS.ATTUNE_WAYSTONE);
  refreshQuestText();
  markMapDirty();
  return true;
}

function damageChapter6RelayTether(index = 0, amount = 999) {
  if (!chapter6RelaySetpieceState.active) return null;
  const tetherIndex = Math.max(0, Math.floor(Number(index) || 0));
  const tether = chapter6RelaySetpieceState.tethers[tetherIndex];
  if (!tether || tether.hp <= 0) return null;
  const damage = Math.max(0, Number(amount) || 0);
  if (damage <= 0) return null;
  tether.hp = Math.max(0, tether.hp - damage);
  if (tether.hp <= 0) {
    setTransientMessage(`Tether ${tetherIndex + 1} snaps.`, 1.05);
  }
  if (getRelaySetpieceRemainingTethers() <= 0) {
    completeChapter6RelaySetpiece();
  }
  return {
    index: tetherIndex,
    hp: Number(tether.hp.toFixed(3)),
    remainingTethers: getRelaySetpieceRemainingTethers(),
  };
}

function tryDamageNearestRelayTether({ showToast = true } = {}) {
  if (!chapter6RelaySetpieceState.active) return false;
  if (currentSceneInfo.sceneId !== "windward") return false;
  const alive = getRelaySetpieceAliveTethers();
  if (alive.length <= 0) return false;
  const nearest = [...alive].sort((a, b) => {
    const da = Math.hypot(player.position.x - a.x, player.position.z - a.z);
    const db = Math.hypot(player.position.x - b.x, player.position.z - b.z);
    if (Math.abs(da - db) > 1e-4) return da - db;
    return String(a.id).localeCompare(String(b.id));
  })[0];
  const distance = Math.hypot(player.position.x - nearest.x, player.position.z - nearest.z);
  if (distance > 1.15) return false;
  const index = chapter6RelaySetpieceState.tethers.findIndex((entry) => entry.id === nearest.id);
  const result = damageChapter6RelayTether(index, 16);
  if (!result && showToast) {
    setTransientMessage("No tether responds.", 0.9);
  }
  return Boolean(result);
}

function isNearChapter6RelayTetherInteraction() {
  if (!chapter6RelaySetpieceState.active) return false;
  if (currentSceneInfo.sceneId !== "windward") return false;
  const alive = getRelaySetpieceAliveTethers();
  if (alive.length <= 0) return false;
  for (const tether of alive) {
    const distance = Math.hypot(player.position.x - tether.x, player.position.z - tether.z);
    if (distance <= 1.15) return true;
  }
  return false;
}

function updateChapter6RelaySetpiece(dtSeconds) {
  chapter6RelaySetpieceState.boundsToastCooldown = Math.max(
    0,
    chapter6RelaySetpieceState.boundsToastCooldown - Math.max(0, Number(dtSeconds) || 0)
  );
  if (!chapter6RelaySetpieceState.active) {
    chapter6RelayRing.visible = false;
    return;
  }
  if (currentSceneInfo.sceneId !== "windward") {
    clearChapter6RelaySetpieceState();
    return;
  }

  chapter6RelayRing.visible = true;
  chapter6RelayRing.position.set(chapter6RelaySetpieceState.center.x, -0.884, chapter6RelaySetpieceState.center.y);
  chapter6RelayRing.scale.set(chapter6RelaySetpieceState.radius, chapter6RelaySetpieceState.radius, 1);
  chapter6RelayRing.material.opacity =
    0.13 + (0.5 + Math.sin(world.elapsedSeconds * 3.9 + chapter6RelaySetpieceState.center.x * 0.27) * 0.5) * 0.14;

  const offsetX = player.position.x - chapter6RelaySetpieceState.center.x;
  const offsetZ = player.position.z - chapter6RelaySetpieceState.center.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > chapter6RelaySetpieceState.radius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x = chapter6RelaySetpieceState.center.x + offsetX * inv * chapter6RelaySetpieceState.radius;
    player.position.z = chapter6RelaySetpieceState.center.y + offsetZ * inv * chapter6RelaySetpieceState.radius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    if (chapter6RelaySetpieceState.boundsToastCooldown <= 0) {
      setTransientMessage("A metal hush pins you in.", WINDWARD_RELAY_BOUNDS_TOAST_SECONDS);
      chapter6RelaySetpieceState.boundsToastCooldown = WINDWARD_RELAY_BOUNDS_COOLDOWN_SECONDS;
    }
  }

  if (getRelaySetpieceRemainingTethers() <= 0) {
    completeChapter6RelaySetpiece();
  }
}

function queueChapter6WaystoneLore(outcome) {
  if (!outcome?.triggered) return false;
  setChapter6WaystoneAttuned(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS);
  refreshQuestText();
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER6_WAYSTONE_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter6WaystoneLorePending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    toast: String(outcome.toast ?? ""),
  };
  return true;
}

function isNearWaystoneInteraction() {
  if (currentSceneInfo.sceneId !== "windward") return false;
  if (!hasChapter6ArrivedWindward()) return false;
  if (!hasChapter6RelayDropped()) return false;
  if (hasChapter6WaystoneAttuned()) return false;
  const config = getWaystoneCircleConfig();
  if (!config?.center) return false;
  const radius = Math.max(0.72, Number(config.interactRadius) || 1.02);
  return Math.hypot(player.position.x - config.center.x, player.position.z - config.center.y) <= radius;
}

function tryTriggerChapter6WaystoneLoreEvent({ force = false } = {}) {
  if (!force && chapter6WaystoneLorePending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerWaystoneLore({
    currentSceneId: currentSceneInfo.sceneId,
    chapter6ArrivedWindward: hasChapter6ArrivedWindward(),
    relayDropped: hasChapter6RelayDropped(),
    waystoneAttuned: hasChapter6WaystoneAttuned(),
    nearWaystone: force ? true : isNearWaystoneInteraction(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    harvesterChoice: getHarvesterChoice(),
    crownTier: crownMood.getTierLabel(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter6WaystoneLore(outcome);
}

function updateChapter6WaystoneLoreSequence(dtSeconds) {
  if (!chapter6WaystoneLorePending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter6WaystoneLorePending.lockRemaining = Math.max(0, chapter6WaystoneLorePending.lockRemaining - dt);
  if (chapter6WaystoneLorePending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(chapter6WaystoneLorePending.lines) ? chapter6WaystoneLorePending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "chapter6_waystone",
      npcName: "Waystone Circle",
      script,
    });
  }
  if (chapter6WaystoneLorePending.toast) {
    setTransientMessage(chapter6WaystoneLorePending.toast, 1.55);
  }
  chapter6WaystoneLorePending = null;
}

function queueChapter8Aftermath(outcome) {
  if (!outcome?.triggered) return false;
  setChapter8AftermathDone(true);
  setChapter8RetaliationStarted(true);
  setChapter8MuteSpikesCleared(false);
  setRegion4SeedUnlocked(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  if (Number.isFinite(Number(outcome.pressureStage))) {
    vaelorisPressureStage = setVaelorisPressureStage(Number(outcome.pressureStage));
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.STOP_MUTE_SPIKES);
  refreshQuestText();
  applyVaelorisWorldModifiers();
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER8_AFTERMATH_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter8AftermathPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    warningToast: String(outcome.warningToast ?? ""),
  };
  return true;
}

function tryTriggerChapter8AftermathEvent({ force = false, nearRowan = false } = {}) {
  if (!force && chapter8AftermathPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerChapter8Aftermath({
    currentSceneId: currentSceneInfo.sceneId,
    nearRowan,
    chapter7ChoirEngineDefeated: hasChapter7ChoirEngineDefeated(),
    chapter7ConvergenceChoice: getChapter7ConvergenceChoice(),
    harvesterChoice: getHarvesterChoice(),
    crownTier: crownMood.getTierLabel(),
    chapter8AftermathDone: hasChapter8AftermathDone(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: guardianCombatForced || bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    vaelorisPressureStage: getVaelorisPressureStage(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueChapter8Aftermath(outcome);
}

function updateChapter8AftermathSequence(dtSeconds) {
  if (!chapter8AftermathPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter8AftermathPending.lockRemaining = Math.max(0, chapter8AftermathPending.lockRemaining - dt);
  if (chapter8AftermathPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(chapter8AftermathPending.lines) ? chapter8AftermathPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (chapter8AftermathPending.warningToast) {
    setTransientMessage(chapter8AftermathPending.warningToast, 1.55);
  }
  chapter8AftermathPending = null;
}

function queueAct2Fallout(outcome) {
  if (!outcome?.triggered) return false;

  setAct2FalloutDone(true);
  setRidgeGateUnlocked(true);
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }

  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || 1);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  act2FalloutPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    unlockToast: String(outcome.unlockToast ?? ""),
    watchedToast: String(outcome.watchedToast ?? ""),
  };
  return true;
}

function tryTriggerAct2FalloutEvent({ force = false } = {}) {
  if (!force && rowanCouncilPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (dialogueBox.isOpen()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const outcome = tryTriggerAct2Fallout({
    currentSceneId: currentSceneInfo.sceneId,
    harvesterChoice: getHarvesterChoice(),
    act2FalloutDone: hasAct2FalloutDone(),
    willowJoined: hasWillowJoined(),
    pressureStage: getVaelorisPressureStage(),
    force,
  });
  if (!outcome?.triggered) return false;
  const queued = queueAct2Fallout(outcome);
  if (queued) {
    refreshQuestText();
    applyVaelorisWorldModifiers();
  }
  return queued;
}

function updateAct2FalloutSequence(dtSeconds) {
  if (!act2FalloutPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  act2FalloutPending.lockRemaining = Math.max(0, act2FalloutPending.lockRemaining - dt);
  if (act2FalloutPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (dialogueBox.isOpen()) return;
  if (sceneManager.hasBlockingUiScene()) return;

  const script = Array.isArray(act2FalloutPending.lines) ? act2FalloutPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "elder_rowan",
      npcName: "Elder Rowan",
      script,
    });
  }
  if (act2FalloutPending.unlockToast) {
    setTransientMessage(act2FalloutPending.unlockToast, RIDGE_GATE_UNLOCK_TOAST_SECONDS);
  }
  if (act2FalloutPending.watchedToast) {
    stabilityToastText = act2FalloutPending.watchedToast;
    stabilityToastSeconds = Math.max(stabilityToastSeconds, 1.45);
  }
  act2FalloutPending = null;
  rowanCouncilPending = null;
}

function tryStartChapter2Flow({ force = false } = {}) {
  const outcome = tryStartChapter2({
    milestoneMet: hasRowanCouncilMilestone(),
    rowanCouncilDone: hasRowanCouncilDone(),
    chapter2Started: hasChapter2Started(),
    emberfallUnlocked: hasStoryEmberfallUnlocked(),
    force,
  });
  if (!outcome?.triggered) return false;

  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setEmberfallLeadUnlocked(true);
  if (!hasChapter2ArrivedEmberfall()) {
    setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL);
  }
  refreshQuestText();
  return true;
}

function getWillowEncounterConfig() {
  return sceneManager.getWillowEncounterConfig?.() ?? null;
}

function getListeningSpikeSiteConfig() {
  return sceneManager.getListeningSpikeSiteConfig?.() ?? null;
}

function getWaystoneCircleConfig() {
  return sceneManager.getWaystoneCircleConfig?.() ?? null;
}

function getWindwardRelayConfig() {
  return sceneManager.getWindwardRelayConfig?.() ?? null;
}

function getRootwayChapter9Config() {
  return sceneManager.getRootwayChapter9Config?.() ?? null;
}

function getEndgameThirdSealConfig() {
  return sceneManager.getEndgameThirdSealConfig?.() ?? null;
}

function getSpireBreachConfig() {
  return sceneManager.getSpireBreachConfig?.() ?? null;
}

function getEndgameGateConfig() {
  return sceneManager.getEndgameGateConfig?.() ?? null;
}

function getChapter8RetaliationConfig() {
  return {
    center: { x: -3.26, y: 2.22 },
    triggerRadius: 1.2,
    arenaRadius: 2.35,
    silenceRadius: 1.18,
    spikePositions: [
      { x: -4.08, y: 2.08 },
      { x: -2.88, y: 1.42 },
      { x: -2.62, y: 2.98 },
    ],
  };
}

function clearWillowAmbushState() {
  willowAmbushState.active = false;
  willowAmbushState.center.set(0, 0);
  willowAmbushState.radius = 0;
  willowAmbushState.enemyIds = [];
  willowAmbushState.boundsToastCooldown = 0;
  willowAmbushRing.visible = false;
}

function clearListeningSpikeSetpieceState() {
  listeningSpikeSetpieceState.active = false;
  listeningSpikeSetpieceState.center.set(0, 0);
  listeningSpikeSetpieceState.radius = 0;
  listeningSpikeSetpieceState.enemyIds = [];
  listeningSpikeSetpieceState.boundsToastCooldown = 0;
  listeningSpikeRing.visible = false;
}

function clearRidgePatrolSetpieceState() {
  ridgePatrolSetpieceState.active = false;
  ridgePatrolSetpieceState.center.set(0, 0);
  ridgePatrolSetpieceState.radius = 1.9;
  ridgePatrolSetpieceState.enemyIds = [];
  ridgePatrolSetpieceState.boundsToastCooldown = 0;
  ridgePatrolRing.visible = false;
}

function clearChapter6RelaySetpieceState() {
  chapter6RelaySetpieceState.active = false;
  chapter6RelaySetpieceState.center.set(0, 0);
  chapter6RelaySetpieceState.radius = 2.4;
  chapter6RelaySetpieceState.enemyIds = [];
  chapter6RelaySetpieceState.tethers = [];
  chapter6RelaySetpieceState.boundsToastCooldown = 0;
  chapter6RelayRing.visible = false;
}

function clearChapter8RetaliationSetpieceState() {
  const previousWardMarkers = Array.isArray(chapter8RetaliationSetpieceState.wardMarkers)
    ? [...chapter8RetaliationSetpieceState.wardMarkers]
    : [];
  const previousSpikes = Array.isArray(chapter8RetaliationSetpieceState.spikes)
    ? [...chapter8RetaliationSetpieceState.spikes]
    : [];
  const previousRings = Array.isArray(chapter8RetaliationSetpieceState.silenceRings)
    ? [...chapter8RetaliationSetpieceState.silenceRings]
    : [];

  chapter8RetaliationSetpieceState.active = false;
  chapter8RetaliationSetpieceState.center.set(0, 0);
  chapter8RetaliationSetpieceState.radius = 2.35;
  chapter8RetaliationSetpieceState.silenceRadius = 1.18;
  chapter8RetaliationSetpieceState.enemyIds = [];
  chapter8RetaliationSetpieceState.spikes = [];
  chapter8RetaliationSetpieceState.boundsToastCooldown = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.ARTHUR] = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.ELAINE] = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.WILLOW] = 0;
  for (const marker of previousWardMarkers) {
    scene.remove(marker);
    marker.material?.dispose?.();
  }
  chapter8RetaliationSetpieceState.wardMarkers = [];
  for (const spike of previousSpikes) {
    if (spike?.sprite) {
      scene.remove(spike.sprite);
      spike.sprite.material?.dispose?.();
    }
  }
  for (const ring of previousRings) {
    scene.remove(ring);
    ring.geometry?.dispose?.();
    ring.material?.dispose?.();
  }
  chapter8RetaliationSetpieceState.silenceRings = [];
  statusEffects.removeEffect(STATUS_ENTITY_IDS.ARTHUR, STATUS_EFFECT_IDS.SILENCED_ROOTS);
  statusEffects.removeEffect(STATUS_ENTITY_IDS.ELAINE, STATUS_EFFECT_IDS.SILENCED_ROOTS);
  statusEffects.removeEffect(STATUS_ENTITY_IDS.WILLOW, STATUS_EFFECT_IDS.SILENCED_ROOTS);
  chapter8RetaliationRing.visible = false;
}

function getChapter8RetaliationRemainingSpikes() {
  if (!chapter8RetaliationSetpieceState.active) return 0;
  return chapter8RetaliationSetpieceState.spikes.reduce((count, spike) => count + (spike?.hp > 0 ? 1 : 0), 0);
}

function getChapter8AliveSpikes() {
  if (!chapter8RetaliationSetpieceState.active) return [];
  return chapter8RetaliationSetpieceState.spikes.filter((spike) => spike?.hp > 0);
}

function getPartyEntityRuntimePosition(entityId) {
  const normalized = String(entityId ?? "").trim().toLowerCase();
  if (!normalized) return null;
  const snapshot = partySystem.getState?.() ?? {};
  if (normalized === STATUS_ENTITY_IDS.ARTHUR) {
    if (activePartyMember === "arthur") {
      return { x: player.position.x, z: player.position.z };
    }
    const proxy = snapshot.arthurProxy ?? { x: player.position.x, z: player.position.z };
    return { x: Number(proxy.x) || 0, z: Number(proxy.z) || 0 };
  }
  if (normalized === STATUS_ENTITY_IDS.ELAINE && hasElaineJoined() && !elaineDowned) {
    if (activePartyMember === "elaine") {
      return { x: player.position.x, z: player.position.z };
    }
    const follower = snapshot.follower ?? null;
    if (!follower) return null;
    return { x: Number(follower.x) || 0, z: Number(follower.z) || 0 };
  }
  if (normalized === STATUS_ENTITY_IDS.WILLOW && hasWillowJoined()) {
    if (activePartyMember === "willow") {
      return { x: player.position.x, z: player.position.z };
    }
    const follower = snapshot.willowFollower ?? null;
    if (!follower) return null;
    return { x: Number(follower.x) || 0, z: Number(follower.z) || 0 };
  }
  return null;
}

function startChapter8RetaliationSetpiece({ force = false } = {}) {
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const config = getChapter8RetaliationConfig();
  if (!config?.center) return false;
  const triggerRadius = Math.max(0.65, Number(config.triggerRadius) || 1.2);
  const inTriggerZone =
    Math.hypot(player.position.x - (config.center?.x ?? 0), player.position.z - (config.center?.y ?? 0)) <= triggerRadius;
  const outcome = tryStartRetaliationSetpiece({
    currentSceneId: currentSceneInfo.sceneId,
    retaliationStarted: hasChapter8RetaliationStarted(),
    muteSpikesCleared: hasChapter8MuteSpikesCleared(),
    setpieceActive: chapter8RetaliationSetpieceState.active,
    inTriggerZone,
    retaliationConfig: config,
    pressureStage: getVaelorisPressureStage(),
    convergenceChoice: getChapter7ConvergenceChoice(),
    force,
  });
  if (!outcome?.triggered) return false;

  const enemyIds = combatSystem.spawnEnemies(
    (outcome.enemySpawns ?? []).map((entry) => ({
      id: entry.id,
      role: entry.role,
      type: entry.type,
      x: entry.x,
      z: entry.z,
      maxHealth: entry.maxHealth,
      aggroRadius: entry.aggroRadius,
      attackRange: entry.attackRange,
      attackCooldown: entry.attackCooldown,
      lingerTag: entry.lingerTag,
    }))
  );
  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) {
    return false;
  }

  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }

  chapter8RetaliationSetpieceState.active = true;
  chapter8RetaliationSetpieceState.center.set(outcome.center.x, outcome.center.y);
  chapter8RetaliationSetpieceState.radius = Math.max(1.8, Number(outcome.arenaRadius) || 2.35);
  chapter8RetaliationSetpieceState.silenceRadius = Math.max(0.85, Number(outcome.silenceRadius) || 1.18);
  chapter8RetaliationSetpieceState.enemyIds = [...enemyIds];
  chapter8RetaliationSetpieceState.spikes = (outcome.spikes ?? []).map((entry, index) => {
    const maxHealth = Math.max(1, Number(entry.maxHealth) || 44);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: chapter8MuteSpikeTexture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
        opacity: 0.97,
      })
    );
    sprite.center.set(0.5, 0.12);
    sprite.position.set(Number(entry.x) || 0, -0.85, Number(entry.z) || 0);
    sprite.scale.set(0.9, 1.22, 1);
    sprite.renderOrder = 1128;
    scene.add(sprite);
    return {
      id: entry.id ?? `mute-spike-${index + 1}`,
      x: Number(entry.x) || 0,
      z: Number(entry.z) || 0,
      maxHealth,
      hp: maxHealth,
      sprite,
    };
  });
  for (const marker of chapter8RetaliationSetpieceState.wardMarkers) {
    scene.remove(marker);
    marker.material?.dispose?.();
  }
  const wardOffsets = [
    { x: -0.64, z: -0.38 },
    { x: 0.74, z: -0.02 },
    { x: 0.08, z: 0.78 },
  ];
  chapter8RetaliationSetpieceState.wardMarkers = wardOffsets.map((offset, index) => {
    const marker = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: chapter8RootWardTexture,
        transparent: true,
        alphaTest: 0.08,
        depthWrite: false,
        opacity: 0.88,
      })
    );
    marker.center.set(0.5, 0.14);
    marker.position.set(outcome.center.x + offset.x, -0.86, outcome.center.y + offset.z);
    marker.scale.set(0.72, 0.98, 1);
    marker.renderOrder = 1126 + index;
    scene.add(marker);
    return marker;
  });
  chapter8RetaliationSetpieceState.boundsToastCooldown = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.ARTHUR] = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.ELAINE] = 0;
  chapter8RetaliationSetpieceState.silenceGraceByEntity[STATUS_ENTITY_IDS.WILLOW] = 0;

  for (const ring of chapter8RetaliationSetpieceState.silenceRings) {
    scene.remove(ring);
    ring.geometry?.dispose?.();
    ring.material?.dispose?.();
  }
  chapter8RetaliationSetpieceState.silenceRings = chapter8RetaliationSetpieceState.spikes.map((spike) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(
        chapter8RetaliationSetpieceState.silenceRadius * 0.92,
        chapter8RetaliationSetpieceState.silenceRadius,
        42
      ),
      new THREE.MeshBasicMaterial({
        color: "#9bc8a7",
        transparent: true,
        opacity: 0.21,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(spike.x, -0.884, spike.z);
    ring.renderOrder = 1049;
    ring.visible = true;
    scene.add(ring);
    return ring;
  });
  chapter8RetaliationRing.visible = true;
  chapter8RetaliationRing.position.set(outcome.center.x, -0.884, outcome.center.y);
  chapter8RetaliationRing.scale.set(chapter8RetaliationSetpieceState.radius, chapter8RetaliationSetpieceState.radius, 1);
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.STOP_MUTE_SPIKES);
  refreshQuestText();
  setTransientMessage(String(outcome.startToast ?? "Mute Spikes are smothering the grove."), 1.45);
  markMapDirty();
  return true;
}

function completeChapter8RetaliationSetpiece({ force = false } = {}) {
  if (!force && !chapter8RetaliationSetpieceState.active) return false;
  clearChapter8RetaliationSetpieceState();
  setChapter8MuteSpikesCleared(true);
  setRegion4SeedUnlocked(true);
  setRegion4SeedGateUnlocked(true);
  setTransientMessage("The roots breathe again.", 1.55);
  setCurrentObjectiveId(OBJECTIVE_IDS.TAKE_NEW_ROUTE);
  refreshQuestText();
  markMapDirty();
  return true;
}

function damageChapter8MuteSpike(index = 0, amount = CHAPTER8_RETALIATION_SPIKE_DAMAGE) {
  if (!chapter8RetaliationSetpieceState.active) return null;
  const spikeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const spike = chapter8RetaliationSetpieceState.spikes[spikeIndex];
  if (!spike || spike.hp <= 0) return null;
  const damage = Math.max(0, Number(amount) || 0);
  if (damage <= 0) return null;
  spike.hp = Math.max(0, spike.hp - damage);
  if (spike.hp <= 0) {
    if (spike.sprite) {
      spike.sprite.visible = false;
    }
    const ring = chapter8RetaliationSetpieceState.silenceRings[spikeIndex];
    if (ring) {
      ring.visible = false;
    }
    setTransientMessage(`Mute Spike ${spikeIndex + 1} shatters.`, 1.05);
  }
  const remainingSpikes = getChapter8RetaliationRemainingSpikes();
  if (remainingSpikes <= 0) {
    completeChapter8RetaliationSetpiece();
  }
  return {
    index: spikeIndex,
    hp: Number(spike.hp.toFixed(3)),
    remainingSpikes,
  };
}

function tryDamageNearestChapter8MuteSpike({ showToast = true } = {}) {
  if (!chapter8RetaliationSetpieceState.active) return false;
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  const alive = getChapter8AliveSpikes();
  if (alive.length <= 0) return false;
  const nearest = [...alive].sort((a, b) => {
    const da = Math.hypot(player.position.x - a.x, player.position.z - a.z);
    const db = Math.hypot(player.position.x - b.x, player.position.z - b.z);
    if (Math.abs(da - db) > 1e-4) return da - db;
    return String(a.id).localeCompare(String(b.id));
  })[0];
  const distance = Math.hypot(player.position.x - nearest.x, player.position.z - nearest.z);
  if (distance > CHAPTER8_RETALIATION_SPIKE_INTERACT_RADIUS) return false;
  const index = chapter8RetaliationSetpieceState.spikes.findIndex((entry) => entry.id === nearest.id);
  const result = damageChapter8MuteSpike(index, CHAPTER8_RETALIATION_SPIKE_DAMAGE);
  if (!result && showToast) {
    setTransientMessage("No spike answers your strike.", 0.9);
  }
  return Boolean(result);
}

function isNearChapter8MuteSpikeInteraction() {
  if (!chapter8RetaliationSetpieceState.active) return false;
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  for (const spike of getChapter8AliveSpikes()) {
    const distance = Math.hypot(player.position.x - spike.x, player.position.z - spike.z);
    if (distance <= CHAPTER8_RETALIATION_SPIKE_INTERACT_RADIUS) return true;
  }
  return false;
}

function updateChapter8RetaliationSetpiece(dtSeconds) {
  chapter8RetaliationSetpieceState.boundsToastCooldown = Math.max(
    0,
    chapter8RetaliationSetpieceState.boundsToastCooldown - Math.max(0, Number(dtSeconds) || 0)
  );
  if (!chapter8RetaliationSetpieceState.active) {
    chapter8RetaliationRing.visible = false;
    statusEffects.removeEffect(STATUS_ENTITY_IDS.ARTHUR, STATUS_EFFECT_IDS.SILENCED_ROOTS);
    statusEffects.removeEffect(STATUS_ENTITY_IDS.ELAINE, STATUS_EFFECT_IDS.SILENCED_ROOTS);
    statusEffects.removeEffect(STATUS_ENTITY_IDS.WILLOW, STATUS_EFFECT_IDS.SILENCED_ROOTS);
    return;
  }
  if (currentSceneInfo.sceneId !== "thornmere") {
    clearChapter8RetaliationSetpieceState();
    return;
  }

  chapter8RetaliationRing.visible = true;
  chapter8RetaliationRing.position.set(
    chapter8RetaliationSetpieceState.center.x,
    -0.884,
    chapter8RetaliationSetpieceState.center.y
  );
  chapter8RetaliationRing.scale.set(
    chapter8RetaliationSetpieceState.radius,
    chapter8RetaliationSetpieceState.radius,
    1
  );
  chapter8RetaliationRing.material.opacity =
    0.12 + (0.5 + Math.sin(world.elapsedSeconds * 3.9 + chapter8RetaliationSetpieceState.center.x * 0.27) * 0.5) * 0.12;

  const offsetX = player.position.x - chapter8RetaliationSetpieceState.center.x;
  const offsetZ = player.position.z - chapter8RetaliationSetpieceState.center.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > chapter8RetaliationSetpieceState.radius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x =
      chapter8RetaliationSetpieceState.center.x + offsetX * inv * chapter8RetaliationSetpieceState.radius;
    player.position.z =
      chapter8RetaliationSetpieceState.center.y + offsetZ * inv * chapter8RetaliationSetpieceState.radius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    if (chapter8RetaliationSetpieceState.boundsToastCooldown <= 0) {
      setTransientMessage("A metal hush pins you in.", CHAPTER8_RETALIATION_BOUNDS_TOAST_SECONDS);
      chapter8RetaliationSetpieceState.boundsToastCooldown = CHAPTER8_RETALIATION_BOUNDS_COOLDOWN_SECONDS;
    }
  }

  const aliveSpikes = getChapter8AliveSpikes();
  for (let i = 0; i < chapter8RetaliationSetpieceState.spikes.length; i += 1) {
    const spike = chapter8RetaliationSetpieceState.spikes[i];
    const ring = chapter8RetaliationSetpieceState.silenceRings[i];
    const alive = Boolean(spike?.hp > 0);
    if (spike?.sprite) {
      spike.sprite.visible = alive;
      if (spike.sprite.material?.map !== chapter8MuteSpikeTexture) {
        spike.sprite.material.map = chapter8MuteSpikeTexture;
        spike.sprite.material.needsUpdate = true;
      }
      if (alive) {
        const pulse = 0.5 + Math.sin(world.elapsedSeconds * 5.2 + i * 0.83) * 0.5;
        spike.sprite.position.y = -0.85 + pulse * 0.018;
        spike.sprite.material.opacity = 0.82 + pulse * 0.16;
      }
    }
    if (ring) {
      ring.visible = alive;
      if (alive) {
        ring.material.opacity =
          0.14 + (0.5 + Math.sin(world.elapsedSeconds * 4.9 + i * 0.71) * 0.5) * 0.2;
      }
    }
  }
  for (let i = 0; i < chapter8RetaliationSetpieceState.wardMarkers.length; i += 1) {
    const marker = chapter8RetaliationSetpieceState.wardMarkers[i];
    if (!marker?.material) continue;
    if (marker.material.map !== chapter8RootWardTexture) {
      marker.material.map = chapter8RootWardTexture;
      marker.material.needsUpdate = true;
    }
    const pulse = 0.5 + Math.sin(world.elapsedSeconds * 3.4 + i * 1.22) * 0.5;
    marker.position.y = -0.86 + pulse * 0.02;
    marker.material.opacity = 0.7 + pulse * 0.2;
  }

  const entityIds = [STATUS_ENTITY_IDS.ARTHUR];
  if (hasElaineJoined() && !elaineDowned) entityIds.push(STATUS_ENTITY_IDS.ELAINE);
  if (hasWillowJoined()) entityIds.push(STATUS_ENTITY_IDS.WILLOW);
  const dt = Math.max(0, Number(dtSeconds) || 0);
  for (const entityId of entityIds) {
    const pos = getPartyEntityRuntimePosition(entityId);
    const wasGrace = chapter8RetaliationSetpieceState.silenceGraceByEntity[entityId] ?? 0;
    let inSilence = false;
    if (pos) {
      for (const spike of aliveSpikes) {
        const dist = Math.hypot(pos.x - spike.x, pos.z - spike.z);
        if (dist <= chapter8RetaliationSetpieceState.silenceRadius) {
          inSilence = true;
          break;
        }
      }
    }
    if (inSilence) {
      chapter8RetaliationSetpieceState.silenceGraceByEntity[entityId] = CHAPTER8_SILENCE_GRACE_SECONDS;
      statusEffects.addEffect(entityId, {
        id: STATUS_EFFECT_IDS.SILENCED_ROOTS,
        durationSeconds: CHAPTER8_SILENCE_GRACE_SECONDS + 0.05,
        sourceId: "mute_spike",
      });
    } else {
      const nextGrace = Math.max(0, wasGrace - dt);
      chapter8RetaliationSetpieceState.silenceGraceByEntity[entityId] = nextGrace;
      if (nextGrace <= 0) {
        statusEffects.removeEffect(entityId, STATUS_EFFECT_IDS.SILENCED_ROOTS);
      } else {
        statusEffects.addEffect(entityId, {
          id: STATUS_EFFECT_IDS.SILENCED_ROOTS,
          durationSeconds: nextGrace + 0.05,
          sourceId: "mute_spike",
        });
      }
    }
  }

  const aliveEnemies = combatSystem.countAliveEnemiesByIds(chapter8RetaliationSetpieceState.enemyIds);
  if (aliveSpikes.length <= 0 || (aliveEnemies <= 0 && getChapter8RetaliationRemainingSpikes() <= 0)) {
    completeChapter8RetaliationSetpiece();
  }
}

function getChapter9AnchorCountRemaining() {
  if (!Array.isArray(chapter9SetpieceState.anchors) || chapter9SetpieceState.anchors.length <= 0) {
    return hasChapter9AnchorsAttuned() ? 0 : 3;
  }
  return chapter9SetpieceState.anchors.reduce((count, anchor) => count + (anchor?.attuned ? 0 : 1), 0);
}

function clearChapter9EchoNodes() {
  for (const node of chapter9SetpieceState.echoNodes) {
    if (node?.mesh) {
      scene.remove(node.mesh);
      node.mesh.geometry?.dispose?.();
      node.mesh.material?.dispose?.();
    }
    if (node?.ring) {
      scene.remove(node.ring);
      node.ring.geometry?.dispose?.();
      node.ring.material?.dispose?.();
    }
  }
  chapter9SetpieceState.echoNodes = [];
}

function clearChapter9NullFields() {
  for (const field of chapter9SetpieceState.nullFields) {
    if (!field?.ring) continue;
    scene.remove(field.ring);
    field.ring.geometry?.dispose?.();
    field.ring.material?.dispose?.();
  }
  chapter9SetpieceState.nullFields = [];
}

function clearChapter9SetpieceState({ keepProgress = false } = {}) {
  clearChapter9EchoNodes();
  clearChapter9NullFields();
  chapter9MemoryCollapseRing.visible = false;
  chapter9SunderWaveRing.visible = false;
  chapter9SetpieceState.active = false;
  chapter9SetpieceState.started = false;
  chapter9SetpieceState.center.set(0, 0);
  chapter9SetpieceState.radius = 2.48;
  chapter9SetpieceState.anchors = [];
  chapter9SetpieceState.spires = [];
  chapter9SetpieceState.shards = [];
  chapter9SetpieceState.anchorCooldowns = [0, 0, 0];
  chapter9SetpieceState.channeling = null;
  chapter9SetpieceState.sunderActive = false;
  chapter9SetpieceState.sunderMeter = 0;
  chapter9SetpieceState.sunderFillSlowRemaining = 0;
  chapter9SetpieceState.sunderWaves = 0;
  chapter9SetpieceState.waveFxSeconds = 0;
  chapter9SetpieceState.waveFxScale = 0.2;
  chapter9SetpieceState.bossStarted = false;
  chapter9SetpieceState.bossArena = null;
  chapter9SetpieceState.erasePulseTimer = 7.8;
  chapter9SetpieceState.nullFieldTimer = 0;
  chapter9SetpieceState.memoryCollapseTimer = 0;
  chapter9SetpieceState.memoryCollapseTelegraph = null;
  chapter9SetpieceState.memoryCollapseResolveTimer = 0;
  chapter9SetpieceState.shortCalloutCooldown = 0;
  chapter9SetpieceState.lorePending = false;
  chapter9SetpieceState.choicePending = false;
  if (!keepProgress) {
    chapter9SetpieceState.failures = 0;
  }
}

function getChapter9RootwayConfig() {
  const config = getRootwayChapter9Config();
  if (!config) return null;
  const vaultCenter = config.vaultArena?.center ?? { x: 3.68, y: -1.16 };
  return {
    vaultApproach: config.vaultApproach ?? { center: { x: 1.82, y: 0.24 }, radius: 1.15 },
    vaultDoor: config.vaultDoor ?? { position: { x: 3.12, y: -0.24 } },
    vaultArena: config.vaultArena ?? { center: { x: 3.68, y: -1.16 }, radius: 2.48 },
    worldrootAnchors: Array.isArray(config.worldrootAnchors) ? config.worldrootAnchors : [],
    nullLatticeSpires: Array.isArray(config.nullLatticeSpires) ? config.nullLatticeSpires : [],
    memoryShards: Array.isArray(config.memoryShards) ? config.memoryShards : [],
    checkpoint:
      config.vaultApproach?.center && config.vaultApproach?.radius
        ? {
            x: Number(config.vaultApproach.center.x) || 0,
            z: Number(config.vaultApproach.center.y) || 0,
          }
        : {
            x: Number(vaultCenter.x) || 0,
            z: Number(vaultCenter.y) || 0,
          },
  };
}

function primeChapter9SetpieceFromConfig(config = null, { preserveAttuned = false } = {}) {
  if (!config) return false;
  const arenaCenter = config.vaultArena?.center ?? { x: 3.68, y: -1.16 };
  chapter9SetpieceState.center.set(Number(arenaCenter.x) || 0, Number(arenaCenter.y) || 0);
  chapter9SetpieceState.radius = Math.max(1.8, Number(config.vaultArena?.radius) || 2.48);
  chapter9SetpieceState.checkpoint = config.checkpoint
    ? { x: Number(config.checkpoint.x) || 0, z: Number(config.checkpoint.z) || 0 }
    : null;
  chapter9SetpieceState.anchors = (config.worldrootAnchors ?? []).map((entry, index) => ({
    index,
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
    attuned: preserveAttuned ? hasChapter9AnchorsAttuned() : false,
  }));
  chapter9SetpieceState.spires = (config.nullLatticeSpires ?? []).map((entry, index) => ({
    index,
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
    pulseTimer: 1.3 + index * 0.55,
  }));
  chapter9SetpieceState.shards = (config.memoryShards ?? []).map((entry, index) => ({
    index,
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
  }));
  chapter9SetpieceState.anchorCooldowns = chapter9SetpieceState.anchors.map(() => 0);
  if (preserveAttuned && hasChapter9AnchorsAttuned()) {
    for (const anchor of chapter9SetpieceState.anchors) {
      anchor.attuned = true;
    }
  }
  return true;
}

function isNearChapter9VaultApproach(config = null) {
  const rootway = config ?? getChapter9RootwayConfig();
  const approach = rootway?.vaultApproach ?? null;
  if (!approach?.center) return false;
  const radius = Math.max(0.5, Number(approach.radius) || 1.1);
  const dx = player.position.x - (Number(approach.center.x) || 0);
  const dz = player.position.z - (Number(approach.center.y ?? approach.center.z) || 0);
  return Math.hypot(dx, dz) <= radius;
}

function queueChapter9Start(outcome) {
  if (!outcome?.triggered) return false;
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  chapter9SetpieceState.started = true;
  chapter9SetpieceState.active = true;
  chapter9SetpieceState.sunderActive = Boolean(outcome.startSunderMeter);
  chapter9SetpieceState.sunderMeter = 0.08;
  chapter9SetpieceState.sunderWaves = 0;
  chapter9SetpieceState.failures = 0;
  chapter9SetpieceState.sunderFillSlowRemaining = 0;
  chapter9SetpieceState.channeling = null;
  chapter9SetpieceState.choicePending = false;
  chapter9SetpieceState.lorePending = false;
  chapter9SetpieceState.shortCalloutCooldown = 0;
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.STABILIZE_WORLDROOTS);
  refreshQuestText();
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER9_TITLE_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter9StartPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
  };
  introTextBeat.start(String(outcome.title ?? "CROWNHEART VAULT"), {
    fadeIn: 0.2,
    hold: 0.38,
    fadeOut: 0.34,
  });
  setTransientMessage("The roots scream. Attune the anchors.", 1.55);
  return true;
}

function tryTriggerChapter9StartEvent({ force = false } = {}) {
  if (!hasRegion4SeedUnlocked() || !hasChapter8MuteSpikesCleared()) return false;
  if (currentSceneInfo.sceneId !== "region4_seed") return false;
  if (!force && chapter9StartPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (
      vaelorisChoicePanel.isOpen() ||
      harvesterChoicePanel.isOpen() ||
      listeningSpikeChoicePanel.isOpen() ||
      vaultChoicePanel.isOpen() ||
      loreVisionOverlay.isOpen()
    ) {
      return false;
    }
  }

  const config = getChapter9RootwayConfig();
  if (!config) return false;
  const nearVaultApproach = force ? true : isNearChapter9VaultApproach(config);
  const outcome = tryTriggerChapter9Start({
    currentSceneId: currentSceneInfo.sceneId,
    nearVaultApproach,
    chapter8MuteSpikesCleared: hasChapter8MuteSpikesCleared(),
    region4SeedUnlocked: hasRegion4SeedUnlocked(),
    chapter9Started: hasChapter9Started(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    menuOpen: shrineSystem.isOpen(),
    force,
  });
  if (!outcome?.triggered) return false;
  clearChapter9SetpieceState();
  primeChapter9SetpieceFromConfig(config, { preserveAttuned: false });
  chapter9SetpieceState.checkpoint = config.checkpoint;
  return queueChapter9Start(outcome);
}

function updateChapter9StartSequence(dtSeconds) {
  if (!chapter9StartPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter9StartPending.lockRemaining = Math.max(0, chapter9StartPending.lockRemaining - dt);
  if (chapter9StartPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (introTextBeat.isActive()) return;

  const script = Array.isArray(chapter9StartPending.lines) ? chapter9StartPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "chapter9_vault",
      npcName: "Crownheart Vault",
      script,
    });
  }
  chapter9StartPending = null;
}

function emitChapter9Callout(line = "") {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (chapter9SetpieceState.shortCalloutCooldown > 0) return false;
  chapter9SetpieceState.shortCalloutCooldown = CHAPTER9_SHORT_CALLOUT_COOLDOWN_SECONDS;
  partyChat.addLine(text, {
    channel: "guidance",
    lifetimeSeconds: 8.8,
  });
  if (transientMessageSeconds <= 0.001) {
    setTransientMessage(text, 1.6);
  }
  return true;
}

function triggerChapter9SunderWave({ center = null } = {}) {
  const origin = center ?? chapter9SetpieceState.center;
  chapter9SetpieceState.sunderWaves += 1;
  chapter9SetpieceState.sunderMeter = CHAPTER9_SUNDER_WAVE_RESET_VALUE;
  chapter9SetpieceState.waveFxSeconds = 0.56;
  chapter9SetpieceState.waveFxScale = 0.7;
  chapter9SunderWaveRing.visible = true;
  chapter9SunderWaveRing.position.set(origin.x, -0.884, origin.y);
  chapter9SunderWaveRing.scale.set(0.7, 0.7, 1);
  chapter9SunderWaveRing.material.opacity = 0.44;
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(origin.x, origin.y),
    innerRadius: 0.84,
    outerRadius: Math.max(1.7, chapter9SetpieceState.radius * 0.98),
    color: "#f2c38c",
    life: 0.52,
    opacity: 0.8,
    spread: 1.25,
  });
  const offsetX = player.position.x - origin.x;
  const offsetZ = player.position.z - origin.y;
  const mag = Math.hypot(offsetX, offsetZ);
  const inv = mag > 0.0001 ? 1 / mag : 0;
  playerKnockbackVelocity.x += offsetX * inv * CHAPTER9_SUNDER_WAVE_KNOCK;
  playerKnockbackVelocity.y += offsetZ * inv * CHAPTER9_SUNDER_WAVE_KNOCK;
  onPlayerDamaged(CHAPTER9_SUNDER_WAVE_DAMAGE, {
    source: "sunder_wave",
    position: new THREE.Vector2(origin.x, origin.y),
  });
  emitChapter9Callout("Willow: Wave! Keep moving!");
}

function resetChapter9SetpieceAtCheckpoint() {
  const config = getChapter9RootwayConfig();
  if (!config) return false;
  chapter9SetpieceState.failures += 1;
  primeChapter9SetpieceFromConfig(config, { preserveAttuned: false });
  chapter9SetpieceState.channeling = null;
  chapter9SetpieceState.sunderMeter = 0.12;
  chapter9SetpieceState.sunderWaves = 0;
  chapter9SetpieceState.sunderFillSlowRemaining = 0;
  chapter9SetpieceState.sunderActive = true;
  chapter9SetpieceState.bossStarted = false;
  chapter9SetpieceState.shortCalloutCooldown = Math.max(chapter9SetpieceState.shortCalloutCooldown, 3);
  chapter9SunderWaveRing.visible = false;
  chapter9MemoryCollapseRing.visible = false;
  clearChapter9EchoNodes();
  clearChapter9NullFields();
  setChapter9AnchorsAttuned(false);
  setCurrentObjectiveId(OBJECTIVE_IDS.STABILIZE_WORLDROOTS);
  refreshQuestText();
  const checkpoint = chapter9SetpieceState.checkpoint ?? config.checkpoint;
  if (checkpoint) {
    player.position.set(checkpoint.x, 0, checkpoint.z);
    cameraFollowTarget.set(checkpoint.x, 0, checkpoint.z);
    updateCamera(fixedStep, true);
  }
  setTransientMessage("The Sundering rewinds the approach. Try again.", 1.6);
  markMapDirty();
  return true;
}

function startChapter9AnchorAttunement(index = 0) {
  if (!chapter9SetpieceState.active || hasChapter9AnchorsAttuned()) return false;
  if (chapter9SetpieceState.channeling) return false;
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const anchor = chapter9SetpieceState.anchors[safeIndex];
  if (!anchor || anchor.attuned) return false;
  if ((chapter9SetpieceState.anchorCooldowns[safeIndex] ?? 0) > 0) return false;
  chapter9SetpieceState.channeling = {
    anchorIndex: safeIndex,
    remaining: CHAPTER9_ANCHOR_ATTUNE_SECONDS,
    interrupted: false,
  };
  controlLockRemaining = Math.max(controlLockRemaining, CHAPTER9_ANCHOR_ATTUNE_SECONDS);
  setTransientMessage(`Attuning Anchor ${safeIndex + 1}...`, 1);
  return true;
}

function completeChapter9AnchorAttunement(index = 0) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const anchor = chapter9SetpieceState.anchors[safeIndex];
  if (!anchor || anchor.attuned) return false;
  anchor.attuned = true;
  chapter9SetpieceState.anchorCooldowns[safeIndex] = 0;
  chapter9SetpieceState.channeling = null;
  chapter9SetpieceState.sunderMeter = Math.max(0, chapter9SetpieceState.sunderMeter - CHAPTER9_ANCHOR_METER_DROP);
  chapter9SetpieceState.sunderFillSlowRemaining = Math.max(
    chapter9SetpieceState.sunderFillSlowRemaining,
    CHAPTER9_ANCHOR_FILL_SLOW_SECONDS
  );
  setTransientMessage(`Anchor ${safeIndex + 1} attuned.`, 1.05);
  const remaining = getChapter9AnchorCountRemaining();
  if (remaining <= 0) {
    setChapter9AnchorsAttuned(true);
    chapter9SetpieceState.active = true;
    setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST);
    refreshQuestText();
    emitChapter9Callout("Elaine: The Vault opens. Inside, now.");
    setTransientMessage("Crownheart Door opens.", 1.4);
  }
  return true;
}

function failChapter9AnchorAttunement() {
  if (!chapter9SetpieceState.channeling) return false;
  const safeIndex = Math.max(0, Math.floor(Number(chapter9SetpieceState.channeling.anchorIndex) || 0));
  chapter9SetpieceState.channeling = null;
  chapter9SetpieceState.anchorCooldowns[safeIndex] = CHAPTER9_ANCHOR_RETRY_COOLDOWN_SECONDS;
  setTransientMessage("Attunement broken. Recenter and try again.", 1.15);
  return true;
}

function tryAttuneNearestChapter9Anchor({ showToast = true } = {}) {
  if (!chapter9SetpieceState.active || hasChapter9AnchorsAttuned()) return false;
  if (currentSceneInfo.sceneId !== "region4_seed") return false;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const anchor of chapter9SetpieceState.anchors) {
    if (!anchor || anchor.attuned) continue;
    const index = Math.max(0, Math.floor(Number(anchor.index) || 0));
    if ((chapter9SetpieceState.anchorCooldowns[index] ?? 0) > 0) continue;
    const distance = Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = anchor;
    }
  }
  if (!best || bestDistance > CHAPTER9_ANCHOR_INTERACT_RADIUS) {
    if (showToast) setTransientMessage("Move closer to a Worldroot Anchor.", 0.9);
    return false;
  }
  return startChapter9AnchorAttunement(best.index);
}

function isNearChapter9AnchorInteraction() {
  if (!chapter9SetpieceState.active || hasChapter9AnchorsAttuned()) return false;
  if (chapter9SetpieceState.channeling) return false;
  for (const anchor of chapter9SetpieceState.anchors) {
    if (!anchor || anchor.attuned) continue;
    const index = Math.max(0, Math.floor(Number(anchor.index) || 0));
    if ((chapter9SetpieceState.anchorCooldowns[index] ?? 0) > 0) continue;
    if (Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z) <= CHAPTER9_ANCHOR_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function spawnChapter9EchoNodes(count = 1) {
  clearChapter9EchoNodes();
  const shardPoints =
    chapter9SetpieceState.shards.length > 0
      ? chapter9SetpieceState.shards
      : [
          { x: chapter9SetpieceState.center.x - 0.55, z: chapter9SetpieceState.center.y + 0.42 },
          { x: chapter9SetpieceState.center.x + 0.66, z: chapter9SetpieceState.center.y - 0.36 },
        ];
  const takeCount = Math.max(1, Math.min(Math.floor(Number(count) || 1), shardPoints.length));
  chapter9SetpieceState.echoNodes = shardPoints.slice(0, takeCount).map((entry, index) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.44, 6),
      new THREE.MeshBasicMaterial({
        color: "#d6ecff",
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    mesh.position.set(entry.x, -0.64, entry.z);
    mesh.renderOrder = 1218;
    scene.add(mesh);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.34, 28),
      new THREE.MeshBasicMaterial({
        color: "#b9d5ff",
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(entry.x, -0.884, entry.z);
    ring.renderOrder = 1216;
    scene.add(ring);
    return {
      index,
      x: entry.x,
      z: entry.z,
      hp: 40,
      maxHp: 40,
      alive: true,
      mesh,
      ring,
    };
  });
  return chapter9SetpieceState.echoNodes.length;
}

function damageChapter9EchoNode(index = 0, amount = 999) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const node = chapter9SetpieceState.echoNodes[safeIndex];
  if (!node || !node.alive) return null;
  const damage = Math.max(0, Number(amount) || 0);
  if (damage <= 0) return null;
  node.hp = Math.max(0, node.hp - damage);
  if (node.hp <= 0) {
    node.alive = false;
    node.mesh.visible = false;
    node.ring.visible = false;
    setTransientMessage(`Echo Node ${safeIndex + 1} shattered.`, 1);
  }
  return {
    index: safeIndex,
    hp: Number(node.hp.toFixed(2)),
    alive: node.alive,
  };
}

function tryDamageNearestChapter9EchoNode({ showToast = true } = {}) {
  if (!chapter9SetpieceState.echoNodes.length) return false;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const node of chapter9SetpieceState.echoNodes) {
    if (!node?.alive) continue;
    const distance = Math.hypot(player.position.x - node.x, player.position.z - node.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  }
  if (!best || bestDistance > CHAPTER9_ECHO_NODE_INTERACT_RADIUS) {
    if (showToast) setTransientMessage("Move closer to an Echo Node.", 0.9);
    return false;
  }
  return Boolean(damageChapter9EchoNode(best.index, 24));
}

function isNearChapter9EchoNodeInteraction() {
  for (const node of chapter9SetpieceState.echoNodes) {
    if (!node?.alive) continue;
    if (Math.hypot(player.position.x - node.x, player.position.z - node.z) <= CHAPTER9_ECHO_NODE_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function spawnChapter9NullFields() {
  clearChapter9NullFields();
  const center = chapter9SetpieceState.center;
  const radius = Math.max(0.95, chapter9SetpieceState.radius * 0.48);
  chapter9SetpieceState.nullFields = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.62, 30),
      new THREE.MeshBasicMaterial({
        color: "#b7c8f9",
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center.x + Math.cos(angle) * radius, -0.884, center.y + Math.sin(angle) * radius);
    ring.renderOrder = 1215;
    scene.add(ring);
    return {
      index,
      angle,
      orbitalRadius: radius,
      radius: 0.62,
      ring,
    };
  });
}

function getNullArchivistArenaConfig() {
  const fromScene = sceneManager.getBossArenaConfig?.();
  if (fromScene?.bossId === NULL_ARCHIVIST_BOSS_ID) {
    return fromScene;
  }
  return {
    bossId: NULL_ARCHIVIST_BOSS_ID,
    bounds: {
      type: "circle",
      center: { x: chapter9SetpieceState.center.x, y: chapter9SetpieceState.center.y },
      radius: Math.max(1.8, chapter9SetpieceState.radius),
    },
    trigger: {
      center: { x: chapter9SetpieceState.center.x, y: chapter9SetpieceState.center.y },
      radius: 1.1,
    },
    resetCooldownSeconds: 3.5,
  };
}

function spawnNullArchivistEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "region4_seed") return false;
  if (bossInstance.isActive()) return bossInstance.getState()?.bossId === NULL_ARCHIVIST_BOSS_ID;
  if (!force && !hasChapter9AnchorsAttuned()) return false;
  if (!force && hasChapter9NullArchivistDefeated()) return false;
  const arena = getNullArchivistArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
  });
  if (!started) return false;
  guardianCombatForced = bossInstance.isActive();
  pacingDirector.setPaused(true);
  chapter9SetpieceState.bossStarted = true;
  chapter9SetpieceState.bossArena = arena;
  chapter9SetpieceState.sunderActive = true;
  chapter9SetpieceState.erasePulseTimer = 7.2;
  chapter9SetpieceState.nullFieldTimer = 2.4;
  chapter9SetpieceState.memoryCollapseTimer = 5.8;
  spawnChapter9EchoNodes(1);
  setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST);
  refreshQuestText();
  setTransientMessage("NULL ARCHIVIST: Arena lock engaged.", 1.35);
  return true;
}

function maybeTriggerNullArchivist() {
  if (currentSceneInfo.sceneId !== "region4_seed") return false;
  if (!hasChapter9AnchorsAttuned() || hasChapter9NullArchivistDefeated()) return false;
  if (bossInstance.isActive()) return false;
  const arena = getNullArchivistArenaConfig();
  const triggerCenter = arena.trigger?.center ?? arena.bounds?.center ?? { x: 3.68, y: -1.16 };
  const triggerRadius = Math.max(0.5, Number(arena.trigger?.radius) || 1.1);
  const distance = Math.hypot(player.position.x - triggerCenter.x, player.position.z - triggerCenter.y);
  if (distance > triggerRadius) return false;
  return spawnNullArchivistEncounter();
}

function queueChapter9LoreVision({ force = false } = {}) {
  if (!force && chapter9LoreVisionPending) return false;
  const payload = playChapter9LoreVision({
    chapter7ConvergenceChoice: getChapter7ConvergenceChoice(),
    vaelorisHarvesterChoice: getHarvesterChoice(),
    crownTier: crownMood.getTier(),
  });
  if (!payload?.triggered) return false;
  const lockSeconds = Math.max(0, Number(payload.lockSeconds) || 1);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  chapter9LoreVisionPending = {
    lockRemaining: lockSeconds,
    payload,
  };
  chapter9SetpieceState.lorePending = true;
  chapter9SetpieceState.choicePending = false;
  return true;
}

function updateChapter9LoreVisionSequence(dtSeconds) {
  if (!chapter9LoreVisionPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter9LoreVisionPending.lockRemaining = Math.max(0, chapter9LoreVisionPending.lockRemaining - dt);
  if (chapter9LoreVisionPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (dialogueBox.isOpen()) return;
  if (loreVisionOverlay.isOpen()) return;

  const payload = chapter9LoreVisionPending.payload ?? {};
  const entries = [];
  if (payload.preface) entries.push({ title: "THE SUNDERING", text: payload.preface });
  if (payload.harvesterThread) entries.push({ title: "ECHO THREAD", text: payload.harvesterThread });
  for (const panel of payload.panels ?? []) {
    entries.push({
      title: String(panel.title ?? "VISION"),
      text: String(panel.text ?? ""),
    });
  }
  if (payload.finalLine) entries.push({ title: "LAST SPIRE", text: String(payload.finalLine) });

  loreVisionOverlay.play(entries, {
    onDone: () => {
      setCurrentObjectiveId(payload.objectiveId ?? OBJECTIVE_IDS.MAKE_VAULT_CHOICE);
      refreshQuestText();
      chapter9SetpieceState.lorePending = false;
      chapter9SetpieceState.choicePending = true;
      if (!getChapter9Choice()) {
        vaultChoicePanel.open();
      }
    },
  });
  chapter9LoreVisionPending = null;
}

function applyChapter9EndgameState(choice = "") {
  const normalized = String(choice ?? "").trim().toLowerCase();
  if (normalized === CHAPTER9_CHOICE_SEAL) {
    setChapter9Choice(CHAPTER9_CHOICE_SEAL);
    setStoryFlag("endgame_retaliation_flag", true);
    adjustCrownMood(8, "chapter9_choice_seal");
  } else if (normalized === CHAPTER9_CHOICE_TAKE_KEY) {
    setChapter9Choice(CHAPTER9_CHOICE_TAKE_KEY);
    setStoryFlag("crownheart_key", true);
    adjustCrownMood(-8, "chapter9_choice_take_key");
  } else {
    return false;
  }

  setEndgameStarted(true);
  setEndgameGoalId(CHAPTER9_ENDGAME_GOAL_ID);
  const waystoneDone = hasChapter6WaystoneAttuned();
  setStoryFlag("endgame_task_waystone", waystoneDone);
  setStoryFlag("endgame_task_crownheart", true);
  setStoryFlag("endgame_task_third_seal", false);
  setStoryFlag("endgame_task_seal_1", waystoneDone);
  setStoryFlag("endgame_task_seal_2", getHarvesterChoice() === HARVESTER_CHOICE_VALUES.SALVAGE);
  setStoryFlag("endgame_task_seal_3", true);
  setEndgameRouteSeedUnlocked(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.PREPARE_ENDGAME);
  chapter9SetpieceState.choicePending = false;
  vaultChoicePanel.close();
  refreshQuestText();
  if (normalized === CHAPTER9_CHOICE_SEAL) {
    emitChapter9Callout("Elaine: We sealed it. Vaeloris will retaliate.");
  } else {
    emitChapter9Callout("Willow: Key acquired. Now we survive owning it.");
  }
  return true;
}

function applyChapter9VaultChoice(choice = "") {
  return applyChapter9EndgameState(choice);
}

function forceChapter9Choice(choice = CHAPTER9_CHOICE_SEAL) {
  const applied = applyChapter9EndgameState(choice);
  return {
    applied,
    choice: getChapter9Choice(),
    endgameStarted: hasEndgameStarted(),
    endgameGoalId: getEndgameGoalId(),
    endgameRouteSeedUnlocked: hasEndgameRouteSeedUnlocked(),
    crownMood: crownMood.getMood(),
    crownTier: crownMood.getTierLabel(),
    objective: resolveStoryObjectiveState().id,
  };
}

function emitThirdSealCallout(line = "") {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (thirdSealQuestState.shortCalloutCooldown > 0) return false;
  thirdSealQuestState.shortCalloutCooldown = BREACH_SHORT_CALLOUT_COOLDOWN_SECONDS;
  partyChat.addLine(text, {
    channel: "guidance",
    lifetimeSeconds: 8.6,
  });
  if (transientMessageSeconds <= 0.001) {
    setTransientMessage(text, 1.6);
  }
  return true;
}

function emitSpireCallout(line = "") {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (spireBreachState.shortCalloutCooldown > 0) return false;
  spireBreachState.shortCalloutCooldown = GATEWARDEN_SHORT_CALLOUT_COOLDOWN_SECONDS;
  partyChat.addLine(text, {
    channel: "guidance",
    lifetimeSeconds: 8.4,
  });
  if (transientMessageSeconds <= 0.001) {
    setTransientMessage(text, 1.6);
  }
  return true;
}

function getThirdSealConfig() {
  const config = getEndgameThirdSealConfig();
  if (!config) return null;
  const center = config.center ?? { x: -1.34, y: 1.36 };
  return {
    center: {
      x: Number(center.x) || -1.34,
      y: Number(center.y ?? center.z) || 1.36,
    },
    triggerRadius: Math.max(0.5, Number(config.triggerRadius) || 0.72),
    arenaRadius: Math.max(1.6, Number(config.arenaRadius) || 2.1),
    checkpoint: config.checkpoint
      ? { x: Number(config.checkpoint.x) || -2.16, z: Number(config.checkpoint.z) || 1.08 }
      : { x: -2.16, z: 1.08 },
    attunePosition: {
      x: Number(config.attunePosition?.x) || -1.56,
      z: Number(config.attunePosition?.y ?? config.attunePosition?.z) || 1.22,
    },
    miniBossSpawn: {
      x: Number(config.miniBossSpawn?.x) || -0.64,
      z: Number(config.miniBossSpawn?.y ?? config.miniBossSpawn?.z) || 0.94,
    },
    hazardSpires: Array.isArray(config.hazardSpires)
      ? config.hazardSpires.map((entry, index) => ({
          index,
          x: Number(entry?.x) || 0,
          z: Number(entry?.y ?? entry?.z) || 0,
          timer: 1.8 + index * 0.45,
        }))
      : [],
  };
}

function clearThirdSealQuestState({ keepProgress = false } = {}) {
  thirdSealRitualRing.visible = false;
  thirdSealQuestState.active = false;
  thirdSealQuestState.center.set(0, 0);
  thirdSealQuestState.radius = 2.1;
  thirdSealQuestState.checkpoint = null;
  thirdSealQuestState.enemyIds = [];
  thirdSealQuestState.custodianId = "";
  thirdSealQuestState.miniBossSpawned = false;
  thirdSealQuestState.attuneReady = false;
  thirdSealQuestState.channeling = null;
  thirdSealQuestState.retryCooldown = 0;
  thirdSealQuestState.hazardSpires = [];
  thirdSealQuestState.shortCalloutCooldown = 0;
  thirdSealQuestState.lorePending = false;
  if (!keepProgress) {
    thirdSealQuestState.started = false;
    thirdSealQuestState.attuned = false;
  }
}

function clearSpireNullClampZones() {
  for (const zone of spireBreachState.nullClampZones) {
    if (!zone?.ring) continue;
    scene.remove(zone.ring);
    zone.ring.geometry?.dispose?.();
    zone.ring.material?.dispose?.();
  }
  spireBreachState.nullClampZones = [];
}

function clearSpireBreachState({ keepProgress = false } = {}) {
  clearSpireNullClampZones();
  spireBreachWaveRing.visible = false;
  gatewardenOverloadRing.visible = false;
  setStoryFlag("endgame_spire_gatewarden_active", false);
  spireBreachState.active = false;
  spireBreachState.center.set(0, 0);
  spireBreachState.radius = 2.62;
  spireBreachState.checkpoint = null;
  spireBreachState.enemyIds = [];
  spireBreachState.lockNodes = [];
  spireBreachState.nodeCooldowns = [0, 0, 0];
  spireBreachState.channeling = null;
  spireBreachState.meterActive = false;
  spireBreachState.meter = 0;
  spireBreachState.fillSlowRemaining = 0;
  spireBreachState.discharges = 0;
  spireBreachState.waveFxSeconds = 0;
  spireBreachState.shortCalloutCooldown = 0;
  spireBreachState.coverPillars = [];
  spireBreachState.overloadTelegraph = null;
  spireBreachState.overloadResolveTimer = 0;
  spireBreachState.overloadTimer = 0;
  spireBreachState.nullClampTimer = 0;
  if (!keepProgress) {
    spireBreachState.started = false;
    spireBreachState.bossStarted = false;
  }
}

function queueEndgameAct1Start(outcome) {
  if (!outcome?.triggered) return false;
  if (outcome.setFlags && typeof outcome.setFlags === "object") {
    for (const [key, value] of Object.entries(outcome.setFlags)) {
      setStoryFlag(key, value);
    }
  }
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.OBTAIN_THIRD_SEAL);
  refreshQuestText();
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || ENDGAME_ACT1_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  endgameAct1StartPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
  };
  introTextBeat.start(String(outcome.title ?? "ENDGAME ACT I"), {
    fadeIn: 0.2,
    hold: 0.34,
    fadeOut: 0.32,
  });
  setTransientMessage("Bind the Third Seal. Then breach the Spire.", 1.55);
  return true;
}

function tryStartEndgameAct1Event({ force = false } = {}) {
  if (!hasEndgameStarted()) return false;
  if (hasEndgameAct1Started()) return false;
  if (!force && endgameAct1StartPending) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (
      vaelorisChoicePanel.isOpen() ||
      harvesterChoicePanel.isOpen() ||
      listeningSpikeChoicePanel.isOpen() ||
      vaultChoicePanel.isOpen() ||
      loreVisionOverlay.isOpen()
    ) {
      return false;
    }
  }
  const outcome = tryStartEndgameAct1({
    currentSceneId: currentSceneInfo.sceneId,
    endgameStarted: hasEndgameStarted(),
    endgameAct1Started: hasEndgameAct1Started(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    menuOpen: shrineSystem.isOpen(),
    force,
  });
  if (!outcome?.triggered) return false;
  return queueEndgameAct1Start(outcome);
}

function updateEndgameAct1StartSequence(dtSeconds) {
  if (!endgameAct1StartPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  endgameAct1StartPending.lockRemaining = Math.max(0, endgameAct1StartPending.lockRemaining - dt);
  if (endgameAct1StartPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (introTextBeat.isActive()) return;

  const script = Array.isArray(endgameAct1StartPending.lines) ? endgameAct1StartPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "endgame_act1",
      npcName: "Three Seals Doctrine",
      script,
    });
  }
  endgameAct1StartPending = null;
}

function startThirdSealQuestSetpiece({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "region4_seed") return false;
  if (!hasEndgameAct1Started() && !force) return false;
  if (hasEndgameThirdSealObtained()) return false;
  if (thirdSealQuestState.active || thirdSealQuestState.attuneReady) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
  }
  const config = getThirdSealConfig();
  if (!config) return false;
  const distance = Math.hypot(player.position.x - config.center.x, player.position.z - config.center.y);
  if (!force && distance > config.triggerRadius) return false;

  const pressureStage = Math.max(1, getVaelorisPressureStage());
  const enemyIds = combatSystem.spawnEnemies([
    {
      id: "third-seal-wave-a",
      role: "skirmisher",
      type: "standard",
      x: config.center.x - 0.94,
      z: config.center.y - 0.78,
      maxHealth: 48 + pressureStage * 4,
      aggroRadius: 3.8,
      attackRange: 0.74,
      attackCooldown: 1.2,
      lingerTag: "third-seal",
    },
    {
      id: "third-seal-wave-b",
      role: pressureStage >= 2 ? "construct" : "striker",
      type: "ambush",
      x: config.center.x + 0.88,
      z: config.center.y - 0.7,
      maxHealth: 52 + pressureStage * 5,
      aggroRadius: 3.9,
      attackRange: pressureStage >= 2 ? 1.04 : 0.72,
      attackCooldown: pressureStage >= 2 ? 1.4 : 1.08,
      lingerTag: "third-seal",
    },
  ]);
  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) return false;

  thirdSealQuestState.started = true;
  thirdSealQuestState.active = true;
  thirdSealQuestState.center.set(config.center.x, config.center.y);
  thirdSealQuestState.radius = config.arenaRadius;
  thirdSealQuestState.checkpoint = config.checkpoint;
  thirdSealQuestState.enemyIds = [...enemyIds];
  thirdSealQuestState.custodianId = "";
  thirdSealQuestState.miniBossSpawned = false;
  thirdSealQuestState.attuneReady = false;
  thirdSealQuestState.channeling = null;
  thirdSealQuestState.retryCooldown = 0;
  thirdSealQuestState.hazardSpires = [...config.hazardSpires];
  thirdSealQuestState.shortCalloutCooldown = 0;
  thirdSealQuestState.lorePending = false;
  thirdSealRitualRing.visible = true;
  thirdSealRitualRing.position.set(config.center.x, -0.884, config.center.y);
  thirdSealRitualRing.scale.set(config.arenaRadius, config.arenaRadius, 1);
  setCurrentObjectiveId(OBJECTIVE_IDS.OBTAIN_THIRD_SEAL);
  refreshQuestText();
  setTransientMessage("The Oath Sigil shrine wakes. Hold the line.", 1.45);
  emitThirdSealCallout("Willow: Shrine says 'prove it'! Fast proving, please.");
  return true;
}

function maybeSpawnThirdSealCustodian() {
  if (!thirdSealQuestState.active) return false;
  if (thirdSealQuestState.miniBossSpawned) return false;
  const alive = combatSystem.countAliveEnemiesByIds(thirdSealQuestState.enemyIds);
  if (alive > 0) return false;
  const config = getThirdSealConfig();
  if (!config) return false;
  const spawned = combatSystem.spawnEnemies([
    {
      id: "third-seal-oath-custodian",
      role: "bulwark",
      type: "elite",
      x: config.miniBossSpawn.x,
      z: config.miniBossSpawn.z,
      maxHealth: 118,
      health: 118,
      aggroRadius: 4,
      attackRange: 0.9,
      attackCooldown: 1.45,
      lingerTag: "third-seal-custodian",
    },
  ]);
  if (!Array.isArray(spawned) || spawned.length <= 0) return false;
  thirdSealQuestState.enemyIds = [...spawned];
  thirdSealQuestState.custodianId = spawned[0];
  thirdSealQuestState.miniBossSpawned = true;
  emitThirdSealCallout("Arthur: Custodian up. Break it.");
  setTransientMessage("Oath Custodian descends.", 1.3);
  return true;
}

function maybeUnlockThirdSealAttunement() {
  if (!thirdSealQuestState.active) return false;
  if (!thirdSealQuestState.miniBossSpawned) return false;
  if (thirdSealQuestState.attuneReady) return false;
  const alive = combatSystem.countAliveEnemiesByIds(thirdSealQuestState.enemyIds);
  if (alive > 0) return false;
  thirdSealQuestState.attuneReady = true;
  thirdSealQuestState.active = true;
  thirdSealQuestState.channeling = null;
  thirdSealQuestState.retryCooldown = 0;
  setTransientMessage("The Oath Sigil is exposed. Bind it.", 1.4);
  emitThirdSealCallout("Elaine: The rite is open. Attune now.");
  return true;
}

function startThirdSealAttunement() {
  if (!thirdSealQuestState.attuneReady) return false;
  if (thirdSealQuestState.channeling) return false;
  if (thirdSealQuestState.retryCooldown > 0) return false;
  const config = getThirdSealConfig();
  if (!config) return false;
  const dist = Math.hypot(player.position.x - config.attunePosition.x, player.position.z - config.attunePosition.z);
  if (dist > THIRD_SEAL_INTERACT_RADIUS) return false;
  thirdSealQuestState.channeling = {
    remaining: THIRD_SEAL_ATTUNE_SECONDS,
    interrupted: false,
  };
  controlLockRemaining = Math.max(controlLockRemaining, THIRD_SEAL_ATTUNE_SECONDS);
  setTransientMessage("Binding the Oath Sigil...", 0.9);
  return true;
}

function failThirdSealAttunement() {
  if (!thirdSealQuestState.channeling) return false;
  thirdSealQuestState.channeling = null;
  thirdSealQuestState.retryCooldown = THIRD_SEAL_RETRY_COOLDOWN_SECONDS;
  setTransientMessage("Attunement broken. Recenter and try again.", 1.1);
  return true;
}

function completeThirdSealAttunement() {
  if (!thirdSealQuestState.channeling) return false;
  thirdSealQuestState.channeling = null;
  thirdSealQuestState.attuned = true;
  thirdSealQuestState.active = false;
  thirdSealQuestState.attuneReady = false;
  thirdSealQuestState.lorePending = true;
  thirdSealQuestState.enemyIds = [];
  setEndgameThirdSealObtained(true);
  setStoryFlag("endgame_task_third_seal", true);
  setEndgameOuterSpireUnlocked(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.BREACH_OUTER_SPIRE);
  refreshQuestText();
  setTransientMessage("The Third Seal binds to you.", 1.4);
  emitThirdSealCallout("Willow: Oath Sigil secured. Spire time.");
  return true;
}

function tryAttuneThirdSealSigil({ showToast = true } = {}) {
  if (!thirdSealQuestState.attuneReady) return false;
  const started = startThirdSealAttunement();
  if (!started && showToast) {
    setTransientMessage("Move closer to the Oath Sigil.", 0.9);
  }
  return started;
}

function isNearThirdSealInteraction() {
  if (!thirdSealQuestState.attuneReady) return false;
  if (thirdSealQuestState.channeling) return false;
  if (thirdSealQuestState.retryCooldown > 0) return false;
  const config = getThirdSealConfig();
  if (!config) return false;
  return (
    Math.hypot(player.position.x - config.attunePosition.x, player.position.z - config.attunePosition.z) <=
    THIRD_SEAL_INTERACT_RADIUS
  );
}

function updateThirdSealQuest(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (thirdSealQuestState.shortCalloutCooldown > 0) {
    thirdSealQuestState.shortCalloutCooldown = Math.max(0, thirdSealQuestState.shortCalloutCooldown - dt);
  }
  thirdSealQuestState.retryCooldown = Math.max(0, thirdSealQuestState.retryCooldown - dt);

  if (!hasEndgameAct1Started() || hasEndgameThirdSealObtained()) {
    thirdSealRitualRing.visible = false;
    return;
  }
  if (currentSceneInfo.sceneId !== "region4_seed") {
    thirdSealRitualRing.visible = false;
    return;
  }

  if (!thirdSealQuestState.started) {
    startThirdSealQuestSetpiece({ force: false });
  }
  if (!thirdSealQuestState.started) return;

  thirdSealRitualRing.visible = true;
  thirdSealRitualRing.position.set(thirdSealQuestState.center.x, -0.884, thirdSealQuestState.center.y);
  thirdSealRitualRing.scale.set(thirdSealQuestState.radius, thirdSealQuestState.radius, 1);
  thirdSealRitualRing.material.opacity =
    0.14 + (0.5 + Math.sin(world.elapsedSeconds * 4.1 + thirdSealQuestState.center.x * 0.3) * 0.5) * 0.14;

  if (thirdSealQuestState.active) {
    const offsetX = player.position.x - thirdSealQuestState.center.x;
    const offsetZ = player.position.z - thirdSealQuestState.center.y;
    const distance = Math.hypot(offsetX, offsetZ);
    if (distance > thirdSealQuestState.radius) {
      const inv = distance > 0.0001 ? 1 / distance : 0;
      player.position.x = thirdSealQuestState.center.x + offsetX * inv * thirdSealQuestState.radius;
      player.position.z = thirdSealQuestState.center.y + offsetZ * inv * thirdSealQuestState.radius;
      cameraFollowTarget.set(player.position.x, 0, player.position.z);
    }
  }

  for (let i = 0; i < thirdSealQuestState.hazardSpires.length; i += 1) {
    const spire = thirdSealQuestState.hazardSpires[i];
    spire.timer = Math.max(0, Number(spire.timer) - dt);
    if (spire.timer > 0) continue;
    spire.timer = 2.8 + i * 0.4;
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(spire.x, spire.z),
      innerRadius: 0.2,
      outerRadius: 0.58,
      color: "#b6d9ff",
      life: 0.42,
      opacity: 0.72,
      spread: 0.35,
    });
    if (Math.hypot(player.position.x - spire.x, player.position.z - spire.z) <= 0.68) {
      onPlayerDamaged(6, {
        source: "oath_spire",
        position: new THREE.Vector2(spire.x, spire.z),
      });
      if (thirdSealQuestState.channeling) {
        thirdSealQuestState.channeling.interrupted = true;
      }
    }
  }

  maybeSpawnThirdSealCustodian();
  maybeUnlockThirdSealAttunement();

  if (thirdSealQuestState.channeling) {
    const config = getThirdSealConfig();
    const dist = config
      ? Math.hypot(player.position.x - config.attunePosition.x, player.position.z - config.attunePosition.z)
      : 999;
    if (dist > THIRD_SEAL_INTERACT_RADIUS + 0.24 || thirdSealQuestState.channeling.interrupted) {
      failThirdSealAttunement();
    } else {
      thirdSealQuestState.channeling.remaining = Math.max(0, thirdSealQuestState.channeling.remaining - dt);
      setTransientMessage(
        `Binding Oath Sigil ${Math.ceil(thirdSealQuestState.channeling.remaining * 10) / 10}s`,
        0.24
      );
      if (thirdSealQuestState.channeling.remaining <= 0) {
        completeThirdSealAttunement();
      }
    }
  }

  if (thirdSealQuestState.lorePending && !dialogueBox.isOpen() && !sceneManager.isTransitioning()) {
    thirdSealQuestState.lorePending = false;
    openNpcDialogue({
      npcId: "third_seal_lore",
      npcName: "Oath Sigil",
      script: [
        "Elaine: The phrase is exact: 'By courtesy, bind the wild song without breaking it.' We perform it now. Move.",
        "Arthur: It knew me. Like it expected me. No stopping now, just use it and move.",
        "Willow: Oath Court really were guardians once, huh? Funny how ledger people become cage people. Keep walking.",
        "Elaine: My family called those cages refinement. I call them fear. We breach the Spire next.",
        "Arthur: Third seal secured. Outer Spire, now.",
      ],
    });
  }
}

function startSpireBreachSetpiece({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "spire_approach") return false;
  if (!hasEndgameOuterSpireUnlocked()) return false;
  if (hasEndgameOuterSpireBreached()) return false;
  if (spireBreachState.active || spireBreachState.started) return false;
  const config = getSpireBreachConfig();
  if (!config?.gateCenter) return false;
  const nearGate =
    Math.hypot(player.position.x - config.gateCenter.x, player.position.z - config.gateCenter.y) <=
    Math.max(0.5, Number(config.triggerRadius) || 1.12);
  const outcome = tryStartSpireBreach({
    currentSceneId: currentSceneInfo.sceneId,
    objectiveId: resolveStoryObjectiveState().id,
    nearGateZone: nearGate,
    outerSpireBreached: hasEndgameOuterSpireBreached(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossActive: bossInstance.isActive(),
    dialogueOpen: dialogueBox.isOpen(),
    menuOpen: shrineSystem.isOpen(),
    pressureStage: getVaelorisPressureStage(),
    breachConfig: config,
    force,
  });
  if (!outcome?.triggered) return false;

  const enemyIds = combatSystem.spawnEnemies(
    (outcome.enemySpawns ?? []).map((entry) => ({
      id: entry.id,
      role: entry.role,
      type: entry.type,
      x: entry.x,
      z: entry.z,
      maxHealth: entry.maxHealth,
      aggroRadius: entry.aggroRadius,
      attackRange: entry.attackRange,
      attackCooldown: entry.attackCooldown,
      lingerTag: entry.lingerTag,
    }))
  );
  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) return false;

  spireBreachState.started = true;
  spireBreachState.active = true;
  spireBreachState.center.set(Number(outcome.center?.x) || 0, Number(outcome.center?.y) || 0);
  spireBreachState.radius = Math.max(1.8, Number(outcome.arenaRadius) || 2.62);
  spireBreachState.checkpoint = outcome.checkpoint
    ? { x: Number(outcome.checkpoint.x) || -0.74, z: Number(outcome.checkpoint.z) || 0.02 }
    : { x: -0.74, z: 0.02 };
  spireBreachState.enemyIds = [...enemyIds];
  spireBreachState.lockNodes = (outcome.lockNodes ?? []).map((entry, index) => ({
    index,
    id: String(entry?.id ?? `lock-node-${index + 1}`),
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
    disabled: false,
  }));
  spireBreachState.nodeCooldowns = spireBreachState.lockNodes.map(() => 0);
  spireBreachState.channeling = null;
  spireBreachState.meterActive = true;
  spireBreachState.meter = 0.08;
  spireBreachState.fillSlowRemaining = 0;
  spireBreachState.discharges = 0;
  spireBreachState.waveFxSeconds = 0;
  spireBreachState.bossStarted = false;
  spireBreachState.shortCalloutCooldown = 0;
  spireBreachState.coverPillars = Array.isArray(config.coverPillars)
    ? config.coverPillars.map((entry) => ({ x: Number(entry?.x) || 0, z: Number(entry?.y ?? entry?.z) || 0 }))
    : [];
  spireBreachWaveRing.visible = false;
  gatewardenOverloadRing.visible = false;
  setCurrentObjectiveId(OBJECTIVE_IDS.BREACH_OUTER_SPIRE);
  refreshQuestText();
  setTransientMessage("Disable all lock nodes before the gate discharges.", 1.5);
  emitSpireCallout("Elaine: Lock nodes first. We breach on my mark.");
  return true;
}

function startSpireLockNodeChannel(index = 0) {
  if (!spireBreachState.active || hasEndgameOuterSpireBreached()) return false;
  if (spireBreachState.channeling) return false;
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const node = spireBreachState.lockNodes[safeIndex];
  if (!node || node.disabled) return false;
  if ((spireBreachState.nodeCooldowns[safeIndex] ?? 0) > 0) return false;
  spireBreachState.channeling = {
    nodeIndex: safeIndex,
    remaining: THIRD_SEAL_ATTUNE_SECONDS,
    interrupted: false,
  };
  controlLockRemaining = Math.max(controlLockRemaining, THIRD_SEAL_ATTUNE_SECONDS);
  setTransientMessage(`Disabling Lock Node ${safeIndex + 1}...`, 0.9);
  return true;
}

function failSpireLockNodeChannel() {
  if (!spireBreachState.channeling) return false;
  const index = Math.max(0, Math.floor(Number(spireBreachState.channeling.nodeIndex) || 0));
  spireBreachState.channeling = null;
  spireBreachState.nodeCooldowns[index] = THIRD_SEAL_RETRY_COOLDOWN_SECONDS;
  setTransientMessage("Override interrupted. Reposition and retry.", 1.1);
  return true;
}

function completeSpireLockNodeChannel(index = 0) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const node = spireBreachState.lockNodes[safeIndex];
  if (!node || node.disabled) return false;
  node.disabled = true;
  spireBreachState.nodeCooldowns[safeIndex] = 0;
  spireBreachState.channeling = null;
  spireBreachState.meter = Math.max(0, spireBreachState.meter - BREACH_NODE_METER_DROP);
  spireBreachState.fillSlowRemaining = Math.max(spireBreachState.fillSlowRemaining, BREACH_FILL_SLOW_SECONDS);
  setTransientMessage(`Lock Node ${safeIndex + 1} disabled.`, 1);

  const remaining = spireBreachState.lockNodes.reduce((count, entry) => count + (entry?.disabled ? 0 : 1), 0);
  if (remaining <= 0) {
    spireBreachState.active = false;
    spireBreachState.meterActive = false;
    spireBreachState.waveFxSeconds = 0;
    spireBreachWaveRing.visible = false;
    setEndgameOuterSpireBreached(true);
    setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_GATEWARDEN);
    refreshQuestText();
    combatSystem.despawnEnemiesByIds(spireBreachState.enemyIds);
    spireBreachState.enemyIds = [];
    setTransientMessage("Outer Spire gate breached.", 1.4);
    emitSpireCallout("Arthur: Breach open. Gatewarden inbound.");
    spawnSpireGatewardenEncounter({ force: true });
  }
  return true;
}

function tryDisableNearestLockNode({ showToast = true } = {}) {
  if (!spireBreachState.active) return false;
  if (currentSceneInfo.sceneId !== "spire_approach") return false;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const node of spireBreachState.lockNodes) {
    if (!node || node.disabled) continue;
    const index = Math.max(0, Math.floor(Number(node.index) || 0));
    if ((spireBreachState.nodeCooldowns[index] ?? 0) > 0) continue;
    const dist = Math.hypot(player.position.x - node.x, player.position.z - node.z);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = node;
    }
  }
  if (!best || bestDistance > BREACH_NODE_INTERACT_RADIUS) {
    if (showToast) setTransientMessage("Move closer to a lock node.", 0.9);
    return false;
  }
  return startSpireLockNodeChannel(best.index);
}

function isNearSpireLockNodeInteraction() {
  if (!spireBreachState.active) return false;
  if (spireBreachState.channeling) return false;
  for (const node of spireBreachState.lockNodes) {
    if (!node || node.disabled) continue;
    const index = Math.max(0, Math.floor(Number(node.index) || 0));
    if ((spireBreachState.nodeCooldowns[index] ?? 0) > 0) continue;
    if (Math.hypot(player.position.x - node.x, player.position.z - node.z) <= BREACH_NODE_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function triggerSpireBreachDischarge() {
  const origin = spireBreachState.center;
  spireBreachState.discharges += 1;
  spireBreachState.meter = BREACH_WAVE_RESET_VALUE;
  spireBreachState.waveFxSeconds = 0.56;
  spireBreachWaveRing.visible = true;
  spireBreachWaveRing.position.set(origin.x, -0.884, origin.y);
  spireBreachWaveRing.scale.set(0.76, 0.76, 1);
  spireBreachWaveRing.material.opacity = 0.42;
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(origin.x, origin.y),
    innerRadius: 0.76,
    outerRadius: Math.max(1.7, spireBreachState.radius * 0.98),
    color: "#8fd6ff",
    life: 0.52,
    opacity: 0.78,
    spread: 1.16,
  });
  const offsetX = player.position.x - origin.x;
  const offsetZ = player.position.z - origin.y;
  const mag = Math.hypot(offsetX, offsetZ);
  const inv = mag > 0.0001 ? 1 / mag : 0;
  playerKnockbackVelocity.x += offsetX * inv * BREACH_WAVE_KNOCK;
  playerKnockbackVelocity.y += offsetZ * inv * BREACH_WAVE_KNOCK;
  onPlayerDamaged(BREACH_WAVE_DAMAGE, {
    source: "gate_discharge",
    position: new THREE.Vector2(origin.x, origin.y),
  });
  emitSpireCallout("Willow: Gate discharge! Move!");
}

function updateSpireBreachSetpiece(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (spireBreachState.shortCalloutCooldown > 0) {
    spireBreachState.shortCalloutCooldown = Math.max(0, spireBreachState.shortCalloutCooldown - dt);
  }

  if (currentSceneInfo.sceneId !== "spire_approach") {
    spireBreachWaveRing.visible = false;
    return;
  }

  if (!hasEndgameOuterSpireBreached()) {
    startSpireBreachSetpiece({ force: false });
  }

  if (spireBreachState.waveFxSeconds > 0) {
    spireBreachState.waveFxSeconds = Math.max(0, spireBreachState.waveFxSeconds - dt);
    const t = spireBreachState.waveFxSeconds / 0.56;
    const grow = 1 + (1 - t) * Math.max(1.2, spireBreachState.radius);
    spireBreachWaveRing.visible = true;
    spireBreachWaveRing.scale.set(grow, grow, 1);
    spireBreachWaveRing.material.opacity = 0.4 * t;
    cameraShakeOffset.x += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.35;
    cameraShakeOffset.z += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.35;
  } else if (!spireBreachState.meterActive) {
    spireBreachWaveRing.visible = false;
  }

  if (!spireBreachState.active && !spireBreachState.meterActive) {
    if (hasEndgameOuterSpireBreached() && !hasEndgameGatewardenDefeated()) {
      maybeTriggerSpireGatewarden();
    }
    return;
  }

  if (spireBreachState.active) {
    const offsetX = player.position.x - spireBreachState.center.x;
    const offsetZ = player.position.z - spireBreachState.center.y;
    const distance = Math.hypot(offsetX, offsetZ);
    if (distance > spireBreachState.radius) {
      const inv = distance > 0.0001 ? 1 / distance : 0;
      player.position.x = spireBreachState.center.x + offsetX * inv * spireBreachState.radius;
      player.position.z = spireBreachState.center.y + offsetZ * inv * spireBreachState.radius;
      cameraFollowTarget.set(player.position.x, 0, player.position.z);
    }
  }

  if (spireBreachState.meterActive) {
    spireBreachState.fillSlowRemaining = Math.max(0, spireBreachState.fillSlowRemaining - dt);
    let fillRate = spireBreachState.fillRate;
    if (spireBreachState.fillSlowRemaining > 0) fillRate *= BREACH_FILL_SLOW_MULTIPLIER;
    if (combatSystem.countAliveEnemiesByIds(spireBreachState.enemyIds) > 0) fillRate *= 1.08;
    spireBreachState.meter = Math.max(0, Math.min(1.2, spireBreachState.meter + fillRate * dt));
    if (spireBreachState.meter >= 1) {
      triggerSpireBreachDischarge();
    }
  }

  for (let i = 0; i < spireBreachState.nodeCooldowns.length; i += 1) {
    spireBreachState.nodeCooldowns[i] = Math.max(0, spireBreachState.nodeCooldowns[i] - dt);
  }

  if (spireBreachState.channeling) {
    const node = spireBreachState.lockNodes[spireBreachState.channeling.nodeIndex];
    if (!node || node.disabled) {
      spireBreachState.channeling = null;
    } else {
      const dist = Math.hypot(player.position.x - node.x, player.position.z - node.z);
      if (dist > BREACH_NODE_INTERACT_RADIUS + 0.24 || spireBreachState.channeling.interrupted) {
        failSpireLockNodeChannel();
      } else {
        spireBreachState.channeling.remaining = Math.max(0, spireBreachState.channeling.remaining - dt);
        setTransientMessage(
          `Disabling Lock Node ${spireBreachState.channeling.nodeIndex + 1} ${
            Math.ceil(spireBreachState.channeling.remaining * 10) / 10
          }s`,
          0.24
        );
        if (spireBreachState.channeling.remaining <= 0) {
          completeSpireLockNodeChannel(spireBreachState.channeling.nodeIndex);
        }
      }
    }
  }

  const remainingNodes = spireBreachState.lockNodes.reduce((count, node) => count + (node?.disabled ? 0 : 1), 0);
  if (spireBreachState.active && remainingNodes > 0) {
    const aliveEnemies = combatSystem.countAliveEnemiesByIds(spireBreachState.enemyIds);
    if (aliveEnemies <= 0) {
      const waveIndex = spireBreachState.discharges + remainingNodes;
      const ids = combatSystem.spawnEnemies([
        {
          id: `spire-breach-reinforce-a-${waveIndex}`,
          role: "skirmisher",
          type: "standard",
          x: spireBreachState.center.x - 0.98,
          z: spireBreachState.center.y + 0.84,
          maxHealth: 48,
          aggroRadius: 3.7,
          attackRange: 0.74,
          attackCooldown: 1.18,
          lingerTag: "spire-breach",
        },
        {
          id: `spire-breach-reinforce-b-${waveIndex}`,
          role: "striker",
          type: "ambush",
          x: spireBreachState.center.x + 1.02,
          z: spireBreachState.center.y + 0.8,
          maxHealth: 44,
          aggroRadius: 3.8,
          attackRange: 0.72,
          attackCooldown: 1.06,
          lingerTag: "spire-breach",
        },
      ]);
      spireBreachState.enemyIds = Array.from(new Set([...spireBreachState.enemyIds, ...(ids ?? [])]));
    }
  }
}

function getSpireGatewardenArenaConfig() {
  const fromScene = sceneManager.getBossArenaConfig?.();
  if (fromScene?.bossId === SPIRE_GATEWARDEN_BOSS_ID) {
    return fromScene;
  }
  return {
    bossId: SPIRE_GATEWARDEN_BOSS_ID,
    bounds: {
      type: "circle",
      center: { x: spireBreachState.center.x || 3.44, y: spireBreachState.center.y || -0.92 },
      radius: Math.max(2, spireBreachState.radius || 2.62),
    },
    trigger: {
      center: { x: spireBreachState.center.x || 3.44, y: spireBreachState.center.y || -0.92 },
      radius: 1.15,
    },
    resetCooldownSeconds: 3.5,
  };
}

function spawnSpireGatewardenEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "spire_approach") return false;
  if (bossInstance.isActive()) return bossInstance.getState()?.bossId === SPIRE_GATEWARDEN_BOSS_ID;
  if (!force && !hasEndgameOuterSpireBreached()) return false;
  if (!force && hasEndgameGatewardenDefeated()) return false;
  const arena = getSpireGatewardenArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
  });
  if (!started) return false;
  guardianCombatForced = bossInstance.isActive();
  pacingDirector.setPaused(true);
  spireBreachState.bossStarted = true;
  spireBreachState.meterActive = false;
  spireBreachState.overloadTimer = 4.6;
  spireBreachState.overloadResolveTimer = 0;
  spireBreachState.nullClampTimer = 2.4;
  setStoryFlag("endgame_spire_gatewarden_active", true);
  setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_GATEWARDEN);
  refreshQuestText();
  setTransientMessage("SPIRE GATEWARDEN: Arena lock engaged.", 1.35);
  return true;
}

function maybeTriggerSpireGatewarden() {
  if (currentSceneInfo.sceneId !== "spire_approach") return false;
  if (!hasEndgameOuterSpireBreached() || hasEndgameGatewardenDefeated()) return false;
  if (bossInstance.isActive()) return false;
  const arena = getSpireGatewardenArenaConfig();
  const triggerCenter = arena.trigger?.center ?? arena.bounds?.center ?? { x: 3.44, y: -0.92 };
  const triggerRadius = Math.max(0.5, Number(arena.trigger?.radius) || 1.15);
  const distance = Math.hypot(player.position.x - triggerCenter.x, player.position.z - triggerCenter.y);
  if (distance > triggerRadius) return false;
  return spawnSpireGatewardenEncounter();
}

function spawnSpireNullClampZones() {
  clearSpireNullClampZones();
  const center = spireBreachState.center;
  const radius = Math.max(0.86, spireBreachState.radius * 0.42);
  spireBreachState.nullClampZones = [0, Math.PI * 0.66, Math.PI * 1.33].map((angle, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.68, 30),
      new THREE.MeshBasicMaterial({
        color: "#8cb9ff",
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center.x + Math.cos(angle) * radius, -0.884, center.y + Math.sin(angle) * radius);
    ring.renderOrder = 1222;
    scene.add(ring);
    return {
      index,
      angle,
      orbit: radius,
      radius: 0.68,
      ring,
    };
  });
}

function updateSpireGatewardenBossMechanics(dtSeconds) {
  const state = bossInstance.getState();
  const active = Boolean(state?.active && state?.bossId === SPIRE_GATEWARDEN_BOSS_ID);
  if (!active) {
    setStoryFlag("endgame_spire_gatewarden_active", false);
    gatewardenOverloadRing.visible = false;
    spireBreachState.overloadResolveTimer = 0;
    clearSpireNullClampZones();
    return;
  }

  const dt = Math.max(0, Number(dtSeconds) || 0);
  const hpRatio = Number(state?.hpRatio ?? 1);
  const phase = hpRatio > 0.7 ? "p1" : hpRatio > 0.35 ? "p2" : "p3";

  if (phase === "p1") {
    clearSpireNullClampZones();
  }

  if (phase !== "p1") {
    spireBreachState.overloadTimer = Math.max(0, spireBreachState.overloadTimer - dt);
    if (spireBreachState.overloadTimer <= 0 && spireBreachState.overloadResolveTimer <= 0) {
      spireBreachState.overloadTimer = phase === "p2" ? 7.8 : 6.2;
      spireBreachState.overloadResolveTimer = 1.1;
      gatewardenOverloadRing.visible = true;
      gatewardenOverloadRing.position.set(spireBreachState.center.x, -0.884, spireBreachState.center.y);
      gatewardenOverloadRing.scale.set(1, 1, 1);
      emitSpireCallout("Elaine: Conduit Overload! Take cover!");
    }
  } else {
    spireBreachState.overloadResolveTimer = 0;
    gatewardenOverloadRing.visible = false;
  }

  if (spireBreachState.overloadResolveTimer > 0) {
    spireBreachState.overloadResolveTimer = Math.max(0, spireBreachState.overloadResolveTimer - dt);
    const telegraph = spireBreachState.overloadResolveTimer / 1.1;
    gatewardenOverloadRing.visible = true;
    gatewardenOverloadRing.material.opacity = 0.12 + (1 - telegraph) * 0.42;
    gatewardenOverloadRing.scale.set(1 + (1 - telegraph) * 0.8, 1 + (1 - telegraph) * 0.8, 1);
    if (spireBreachState.overloadResolveTimer <= 0) {
      gatewardenOverloadRing.visible = false;
      const dist = Math.hypot(player.position.x - spireBreachState.center.x, player.position.z - spireBreachState.center.y);
      const behindPillar = spireBreachState.coverPillars.some(
        (pillar) => Math.hypot(player.position.x - pillar.x, player.position.z - pillar.z) <= GATEWARDEN_PILLAR_SAFE_RADIUS
      );
      if (dist <= GATEWARDEN_OVERLOAD_RADIUS && !behindPillar) {
        onPlayerDamaged(GATEWARDEN_OVERLOAD_DAMAGE, {
          source: "conduit_overload",
          position: new THREE.Vector2(spireBreachState.center.x, spireBreachState.center.y),
        });
      }
    }
  }

  if (phase === "p3") {
    if (spireBreachState.nullClampZones.length <= 0) {
      spawnSpireNullClampZones();
    }
    for (let i = 0; i < spireBreachState.nullClampZones.length; i += 1) {
      const zone = spireBreachState.nullClampZones[i];
      zone.angle += dt * (0.44 + i * 0.12);
      zone.ring.position.x = spireBreachState.center.x + Math.cos(zone.angle) * zone.orbit;
      zone.ring.position.z = spireBreachState.center.y + Math.sin(zone.angle) * zone.orbit;
      zone.ring.material.opacity = 0.14 + (0.5 + Math.sin(world.elapsedSeconds * 3.2 + i) * 0.5) * 0.16;
    }
    const partyTargets = [STATUS_ENTITY_IDS.ARTHUR];
    if (hasElaineJoined() && !elaineDowned) partyTargets.push(STATUS_ENTITY_IDS.ELAINE);
    if (hasWillowJoined()) partyTargets.push(STATUS_ENTITY_IDS.WILLOW);
    for (const entityId of partyTargets) {
      const position = getPartyEntityRuntimePosition(entityId);
      if (!position) continue;
      for (const zone of spireBreachState.nullClampZones) {
        const dx = position.x - zone.ring.position.x;
        const dz = position.z - zone.ring.position.z;
        if (Math.hypot(dx, dz) <= zone.radius) {
          statusEffects.addEffect(entityId, {
            id: STATUS_EFFECT_IDS.NULL_CLAMP,
            durationSeconds: GATEWARDEN_NULL_CLAMP_SECONDS,
            sourceId: SPIRE_GATEWARDEN_BOSS_ID,
          });
          break;
        }
      }
    }
  } else {
    clearSpireNullClampZones();
  }
}

function getInnerSpireConfig() {
  const sceneConfig = sceneManager.getInnerSpireConfig?.();
  const defaultConfig = {
    resonanceLocks: [
      { id: "resonance-lock-1", x: -1.76, y: -0.62 },
      { id: "resonance-lock-2", x: 0.18, y: 1.28 },
      { id: "resonance-lock-3", x: 2.26, y: -0.14 },
    ],
    interactRadius: RESONANCE_LOCK_INTERACT_RADIUS,
    memoryLoom: { x: 2.18, y: 0.22 },
    loomArena: {
      center: { x: 2.18, y: 0.22 },
      radius: 2.58,
    },
    loomTriggerRadius: 1.16,
    prismPillars: [
      { x: 1.34, y: -1.04 },
      { x: 3.04, y: 0.72 },
    ],
  };
  if (!sceneConfig) return defaultConfig;
  return {
    ...defaultConfig,
    ...sceneConfig,
    resonanceLocks: Array.isArray(sceneConfig.resonanceLocks) ? sceneConfig.resonanceLocks : defaultConfig.resonanceLocks,
    loomArena: {
      ...defaultConfig.loomArena,
      ...(sceneConfig.loomArena ?? {}),
      center: {
        ...defaultConfig.loomArena.center,
        ...(sceneConfig.loomArena?.center ?? {}),
      },
    },
    memoryLoom: {
      ...defaultConfig.memoryLoom,
      ...(sceneConfig.memoryLoom ?? {}),
    },
    prismPillars: Array.isArray(sceneConfig.prismPillars) ? sceneConfig.prismPillars : defaultConfig.prismPillars,
  };
}

function getInnerSpireLastDoorConfig() {
  const sceneConfig = sceneManager.getInnerSpireLastDoorConfig?.();
  const defaultConfig = {
    lastDoor: {
      x: 1.84,
      y: -0.14,
      interactRadius: 1.1,
    },
  };
  if (!sceneConfig?.lastDoor) return defaultConfig;
  return {
    ...defaultConfig,
    ...sceneConfig,
    lastDoor: {
      ...defaultConfig.lastDoor,
      ...sceneConfig.lastDoor,
    },
  };
}

function emitInnerSpireCallout(line = "") {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (innerSpireState.shortCalloutCooldown > 0) return false;
  innerSpireState.shortCalloutCooldown = LOOM_PROCTOR_SHORT_CALLOUT_COOLDOWN_SECONDS;
  partyChat.addLine(text, {
    channel: "guidance",
    lifetimeSeconds: 8.4,
  });
  if (transientMessageSeconds <= 0.001) {
    setTransientMessage(text, 1.45);
  }
  return true;
}

function clearLoomFissures() {
  for (const fissure of innerSpireState.fissures) {
    if (!fissure?.ring) continue;
    scene.remove(fissure.ring);
    fissure.ring.geometry?.dispose?.();
    fissure.ring.material?.dispose?.();
  }
  innerSpireState.fissures = [];
}

function clearLoomPrismPillars() {
  for (const pillar of innerSpireState.prismPillars) {
    if (!pillar?.ring) continue;
    scene.remove(pillar.ring);
    pillar.ring.geometry?.dispose?.();
    pillar.ring.material?.dispose?.();
  }
  innerSpireState.prismPillars = [];
}

function resetInnerSpireRuntime({ keepProgress = true } = {}) {
  innerSpireState.active = false;
  innerSpireState.initialized = false;
  innerSpireState.lockChanneling = false;
  innerSpireState.pressureTierEvents = [];
  innerSpireState.pressureEnemyIds = [];
  innerSpireState.shortCalloutCooldown = 0;
  innerSpireState.loomBossStarted = false;
  innerSpireState.weaveCutTimer = LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL;
  innerSpireState.weaveCutResolveTimer = 0;
  innerSpireState.weaveCutTelegraph = null;
  innerSpireState.memoryTaxTimer = LOOM_PROCTOR_MEMORY_TAX_INTERVAL;
  innerSpireState.currentPhase = "";
  innerSpireState.phase2ShieldFloor = 0;
  innerSpireState.lorePending = false;
  clearLoomFissures();
  clearLoomPrismPillars();
  setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
  memoryPressureTracker.setActive(false, { resetValue: true });
  if (!keepProgress) {
    setEndgameAct2Started(false);
    setEndgameInnerSpireEntered(false);
    setEndgameResonanceLock(1, false);
    setEndgameResonanceLock(2, false);
    setEndgameResonanceLock(3, false);
    setEndgameLoomProctorDefeated(false);
    setEndgameAct3Unlocked(false);
    setEndgameLastDoorSeen(false);
  }
}

function initializeInnerSpireState({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "inner_spire") return false;
  if (innerSpireState.initialized && !force) return true;
  const config = getInnerSpireConfig();
  const lockLayout = Array.isArray(config.resonanceLocks)
    ? config.resonanceLocks.map((entry, index) => ({
        id: String(entry?.id ?? `resonance-lock-${index + 1}`),
        x: Number(entry?.x) || 0,
        y: Number(entry?.y ?? entry?.z) || 0,
      }))
    : undefined;
  initResonanceLocks("inner_spire", currentRngSeed, {
    locks: lockLayout,
    channelSeconds: RESONANCE_LOCK_CHANNEL_SECONDS,
    retryCooldownSeconds: RESONANCE_LOCK_RETRY_COOLDOWN_SECONDS,
    interactRadius: Number(config.interactRadius) || RESONANCE_LOCK_INTERACT_RADIUS,
  });
  if (hasEndgameResonanceLock(1)) completeResonanceLock(0);
  if (hasEndgameResonanceLock(2)) completeResonanceLock(1);
  if (hasEndgameResonanceLock(3)) completeResonanceLock(2);
  innerSpireState.loomCenter.set(Number(config.memoryLoom?.x) || 2.18, Number(config.memoryLoom?.y) || 0.22);
  innerSpireState.loomRadius = Math.max(2, Number(config.loomArena?.radius) || 2.58);
  innerSpireState.active = true;
  innerSpireState.initialized = true;
  innerSpireState.lockChanneling = false;
  innerSpireState.pressureEnemyIds = [];
  innerSpireState.pressureTierEvents = [];
  innerSpireState.shortCalloutCooldown = 0;
  innerSpireState.weaveCutTimer = LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL;
  innerSpireState.weaveCutResolveTimer = 0;
  innerSpireState.weaveCutTelegraph = null;
  innerSpireState.memoryTaxTimer = LOOM_PROCTOR_MEMORY_TAX_INTERVAL;
  innerSpireState.currentPhase = "";
  innerSpireState.phase2ShieldFloor = 0;
  clearLoomFissures();
  clearLoomPrismPillars();
  const locksRemaining = getResonanceLockCountRemaining();
  memoryPressureTracker.setActive(locksRemaining > 0 && !hasEndgameLoomProctorDefeated(), { resetValue: true });
  memoryPressureTracker.setValue(locksRemaining > 0 ? 0.08 : 0);
  return true;
}

function isNearResonanceLockInteraction() {
  if (currentSceneInfo.sceneId !== "inner_spire") return false;
  if (hasEndgameAllResonanceLocks()) return false;
  if (hasEndgameLoomProctorDefeated()) return false;
  const nearby = isNearResonanceLock(
    { x: player.position.x, z: player.position.z },
    {
      includeCompleted: false,
      interactRadius: RESONANCE_LOCK_INTERACT_RADIUS,
    }
  );
  return Boolean(nearby);
}

function tryStartNearestResonanceLock({ showToast = true } = {}) {
  if (currentSceneInfo.sceneId !== "inner_spire") return false;
  if (hasEndgameAllResonanceLocks()) return false;
  if (hasEndgameLoomProctorDefeated()) return false;
  if (!initializeInnerSpireState()) return false;
  const nearby = isNearResonanceLock(
    { x: player.position.x, z: player.position.z },
    {
      includeCompleted: false,
      interactRadius: RESONANCE_LOCK_INTERACT_RADIUS,
    }
  );
  if (!nearby) {
    if (showToast) setTransientMessage("Move closer to a Resonance Lock.", 0.9);
    return false;
  }
  const started = startResonanceLockChannel(nearby.index);
  if (!started) {
    if (showToast) setTransientMessage("Resonance lock not ready.", 0.9);
    return false;
  }
  const lockIndex = Math.max(1, Math.floor(Number(nearby.index) || 0) + 1);
  setTransientMessage(`Aligning Resonance Lock ${lockIndex}...`, 0.9);
  return true;
}

function spawnInnerSpirePressurePack(tierIndex = 0) {
  const config = getInnerSpireConfig();
  const anchors = Array.isArray(config.resonanceLocks) ? config.resonanceLocks : [];
  const baseA = anchors[Math.max(0, Math.min(2, tierIndex))] ?? { x: player.position.x - 0.8, y: player.position.z + 0.6 };
  const baseB = anchors[Math.max(0, Math.min(2, tierIndex + 1)) % Math.max(1, anchors.length)] ?? {
    x: player.position.x + 0.8,
    y: player.position.z - 0.6,
  };
  const spawns = [
    {
      id: `inner-spire-pressure-${tierIndex + 1}-a`,
      role: "striker",
      type: "echo_knight",
      x: Number(baseA.x) - 0.18,
      z: Number(baseA.y) + 0.2,
      maxHealth: tierIndex >= 1 ? 58 : 52,
      aggroRadius: 4,
      attackRange: 0.78,
      attackCooldown: 1.06,
      lingerTag: "inner-spire-pressure",
    },
    {
      id: `inner-spire-pressure-${tierIndex + 1}-b`,
      role: "construct",
      type: "lattice_sentinel",
      x: Number(baseB.x) + 0.14,
      z: Number(baseB.y) - 0.2,
      maxHealth: tierIndex >= 1 ? 64 : 56,
      aggroRadius: 4.1,
      attackRange: 1.02,
      attackCooldown: 1.3,
      lingerTag: "inner-spire-pressure",
    },
  ];
  if (tierIndex >= 1) {
    spawns.push({
      id: `inner-spire-pressure-${tierIndex + 1}-c`,
      role: "skirmisher",
      type: "echo_knight",
      x: innerSpireState.loomCenter.x - 0.86,
      z: innerSpireState.loomCenter.y + 0.76,
      maxHealth: 52,
      aggroRadius: 3.9,
      attackRange: 0.7,
      attackCooldown: 1.14,
      lingerTag: "inner-spire-pressure",
    });
  }
  const spawned = combatSystem.spawnEnemies(spawns);
  if (!Array.isArray(spawned) || spawned.length <= 0) return false;
  innerSpireState.pressureEnemyIds = Array.from(new Set([...innerSpireState.pressureEnemyIds, ...spawned]));
  emitInnerSpireCallout(tierIndex === 0 ? "Willow: Pressure spike! Cut through them!" : "Arthur: More sentinels. Keep locks moving.");
  return true;
}

function setResonanceLockStoryFlag(index = 0, completed = false) {
  const oneBased = Math.max(1, Math.floor(Number(index) || 0) + 1);
  setEndgameResonanceLock(oneBased, completed);
}

function getLoomProctorArenaConfig() {
  const config = getInnerSpireConfig();
  const arenaCenter = {
    x: Number(config.loomArena?.center?.x ?? config.memoryLoom?.x) || innerSpireState.loomCenter.x,
    y: Number(config.loomArena?.center?.y ?? config.memoryLoom?.y) || innerSpireState.loomCenter.y,
  };
  const radius = Math.max(2, Number(config.loomArena?.radius) || innerSpireState.loomRadius || 2.58);
  return {
    bossId: LOOM_PROCTOR_BOSS_ID,
    bounds: {
      type: "circle",
      center: arenaCenter,
      radius,
    },
    trigger: {
      center: {
        x: Number(config.memoryLoom?.x) || arenaCenter.x,
        y: Number(config.memoryLoom?.y) || arenaCenter.y,
      },
      radius: Math.max(0.7, Number(config.loomTriggerRadius) || 1.16),
    },
    resetCooldownSeconds: 3.2,
  };
}

function spawnLoomProctorEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "inner_spire") return false;
  if (!force && !hasEndgameAllResonanceLocks()) return false;
  if (!force && hasEndgameLoomProctorDefeated()) return false;
  if (bossInstance.isActive()) return bossInstance.getState()?.bossId === LOOM_PROCTOR_BOSS_ID;
  const arena = getLoomProctorArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
  });
  if (!started) return false;
  setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, true);
  innerSpireState.loomBossStarted = true;
  innerSpireState.weaveCutTimer = LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL;
  innerSpireState.weaveCutResolveTimer = 0;
  innerSpireState.weaveCutTelegraph = null;
  innerSpireState.memoryTaxTimer = LOOM_PROCTOR_MEMORY_TAX_INTERVAL;
  innerSpireState.currentPhase = "";
  innerSpireState.phase2ShieldFloor = 0;
  clearLoomFissures();
  clearLoomPrismPillars();
  setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR);
  refreshQuestText();
  setTransientMessage("THE LOOM PROCTOR: Arena lock engaged.", 1.4);
  emitInnerSpireCallout("Elaine: We cut the weave here. No retreat.");
  return true;
}

function queueEndgameAct2LoreVision({ force = false } = {}) {
  if (!force && endgameAct2LorePending) return false;
  const payload = playEndgameAct2Lore({
    chapter9Choice: getChapter9Choice(),
    crownTier: crownMood.getTierLabel(),
  });
  if (!payload?.triggered) return false;
  const lockSeconds = Math.max(0, Number(payload.lockSeconds) || 1);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  endgameAct2LorePending = {
    lockRemaining: lockSeconds,
    payload,
  };
  innerSpireState.lorePending = true;
  return true;
}

function updateEndgameAct2LoreSequence(dtSeconds) {
  if (!endgameAct2LorePending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  endgameAct2LorePending.lockRemaining = Math.max(0, endgameAct2LorePending.lockRemaining - dt);
  if (endgameAct2LorePending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (dialogueBox.isOpen()) return;
  if (loreVisionOverlay.isOpen()) return;

  const payload = endgameAct2LorePending.payload ?? {};
  const entries = [];
  if (payload.preface) entries.push({ title: "MEMORY LOOM", text: payload.preface });
  if (payload.tierThread) entries.push({ title: "CROWN ECHO", text: payload.tierThread });
  for (const panel of payload.panels ?? []) {
    entries.push({
      title: String(panel.title ?? "VISION"),
      text: String(panel.text ?? ""),
    });
  }
  if (payload.finalLine) entries.push({ title: "LAST DOOR", text: String(payload.finalLine) });

  loreVisionOverlay.play(entries, {
    onDone: () => {
      setEndgameAct3Unlocked(true);
      setCurrentObjectiveId(payload.objectiveId ?? OBJECTIVE_IDS.APPROACH_LAST_DOOR);
      refreshQuestText();
      innerSpireState.lorePending = false;
      setTransientMessage("The Last Door answers. Not yet.", 1.4);
    },
  });
  endgameAct2LorePending = null;
}

function queueEndgameAct2Start() {
  if (endgameAct2StartPending) return false;
  setEndgameAct2Started(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.ENTER_INNER_SPIRE);
  refreshQuestText();
  const lockSeconds = ENDGAME_ACT2_LOCK_SECONDS;
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  endgameAct2StartPending = {
    lockRemaining: lockSeconds,
    lines: [
      "Elaine: Doctrine calls this the second bind: locks, then proctor, then final door. Proceed inside.",
      "Arthur: We have truth. Now we take the tools and keep moving.",
      "Willow: Friendly reminder: the Spire is already humming our names. We should be louder.",
      "Elaine: Then no dithering. Inner gate, now.",
      "Arthur: Formation tight. We move.",
    ],
  };
  introTextBeat.start("ENDGAME ACT II", {
    fadeIn: 0.2,
    hold: 0.34,
    fadeOut: 0.32,
  });
  setTransientMessage("Inner Spire protocol: align locks, cut the proctor.", 1.55);
  return true;
}

function tryStartEndgameAct2Event({ force = false } = {}) {
  if (!hasEndgameStarted()) return false;
  if (!hasEndgameGatewardenDefeated() || !hasEndgameSpireEntryUnlocked()) return false;
  if (hasEndgameAct2Started()) return false;
  if (!force && endgameAct2StartPending) return false;
  const sceneId = currentSceneInfo.sceneId;
  const inAllowedScene =
    sceneId === "spire_antechamber" ||
    sceneId === "windward" ||
    sceneId === "thornmere" ||
    sceneId === "region4_seed";
  if (!force && !inAllowedScene) return false;
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (shrineSystem.isOpen()) return false;
    if (
      vaelorisChoicePanel.isOpen() ||
      harvesterChoicePanel.isOpen() ||
      listeningSpikeChoicePanel.isOpen() ||
      vaultChoicePanel.isOpen() ||
      loreVisionOverlay.isOpen()
    ) {
      return false;
    }
  }
  return queueEndgameAct2Start();
}

function updateEndgameAct2StartSequence(dtSeconds) {
  if (!endgameAct2StartPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  endgameAct2StartPending.lockRemaining = Math.max(0, endgameAct2StartPending.lockRemaining - dt);
  if (endgameAct2StartPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (introTextBeat.isActive()) return;
  const script = Array.isArray(endgameAct2StartPending.lines) ? endgameAct2StartPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "endgame_act2",
      npcName: "Inner Spire Protocol",
      script,
    });
  }
  endgameAct2StartPending = null;
}

function isNearLoomPrismPillarInteraction() {
  if (currentSceneInfo.sceneId !== "inner_spire") return false;
  const bossState = bossInstance.getState();
  if (!bossState?.active || bossState?.bossId !== LOOM_PROCTOR_BOSS_ID) return false;
  if (innerSpireState.prismPillars.length <= 0) return false;
  for (const pillar of innerSpireState.prismPillars) {
    if (!pillar?.alive) continue;
    if (Math.hypot(player.position.x - pillar.x, player.position.z - pillar.z) <= LOOM_PROCTOR_PILLAR_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function tryShatterNearestLoomPrismPillar({ showToast = true } = {}) {
  if (!isNearLoomPrismPillarInteraction()) {
    if (showToast) {
      setTransientMessage("Move closer to a Prism Pillar.", 0.9);
    }
    return false;
  }
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const pillar of innerSpireState.prismPillars) {
    if (!pillar?.alive) continue;
    const distance = Math.hypot(player.position.x - pillar.x, player.position.z - pillar.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = pillar;
    }
  }
  if (!best) return false;
  best.hp = Math.max(0, Number(best.hp) - LOOM_PROCTOR_PRISM_PILLAR_HIT_DAMAGE);
  const ratio = best.maxHp > 0 ? best.hp / best.maxHp : 0;
  if (best.ring?.material) {
    best.ring.material.opacity = 0.16 + Math.max(0.04, ratio) * 0.22;
  }
  if (best.hp <= 0) {
    best.alive = false;
    if (best.ring) {
      scene.remove(best.ring);
      best.ring.geometry?.dispose?.();
      best.ring.material?.dispose?.();
      best.ring = null;
    }
    setTransientMessage(`Prism Pillar ${best.index + 1} shattered.`, 1.05);
    const remaining = innerSpireState.prismPillars.reduce((count, pillar) => count + (pillar?.alive ? 1 : 0), 0);
    if (remaining <= 0) {
      innerSpireState.phase2ShieldFloor = 0;
      emitInnerSpireCallout("Arthur: Pillars down. Proctor exposed.");
    }
  } else {
    setTransientMessage(`Prism Pillar ${best.index + 1} cracking...`, 0.9);
  }
  return true;
}

function spawnLoomPrismPillars() {
  clearLoomPrismPillars();
  const config = getInnerSpireConfig();
  const layout = Array.isArray(config.prismPillars) ? config.prismPillars.slice(0, 2) : [];
  innerSpireState.prismPillars = layout.map((entry, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.54, 30),
      new THREE.MeshBasicMaterial({
        color: "#c8daff",
        transparent: true,
        opacity: 0.26,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(Number(entry?.x) || 0, -0.884, Number(entry?.y ?? entry?.z) || 0);
    ring.renderOrder = 1224;
    scene.add(ring);
    return {
      index,
      x: Number(entry?.x) || 0,
      z: Number(entry?.y ?? entry?.z) || 0,
      hp: LOOM_PROCTOR_PRISM_PILLAR_HP,
      maxHp: LOOM_PROCTOR_PRISM_PILLAR_HP,
      alive: true,
      ring,
    };
  });
  if (innerSpireState.prismPillars.length > 0) {
    emitInnerSpireCallout("Elaine: Prism Pillars are feeding its shield. Break them.");
  }
}

function spawnLoomFissureAt(x = 0, z = 0) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.24, LOOM_PROCTOR_WEAVE_CUT_RADIUS, 30),
    new THREE.MeshBasicMaterial({
      color: "#b7c9ff",
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(Number(x) || 0, -0.884, Number(z) || 0);
  ring.renderOrder = 1223;
  scene.add(ring);
  innerSpireState.fissures.push({
    x: Number(x) || 0,
    z: Number(z) || 0,
    radius: LOOM_PROCTOR_WEAVE_CUT_RADIUS,
    remaining: LOOM_PROCTOR_WEAVE_CUT_FISSURE_SECONDS,
    tick: 0.32,
    ring,
  });
}

function beginLoomWeaveCutTelegraph(intervalSeconds = LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL) {
  const targetX = player.position.x;
  const targetZ = player.position.z;
  innerSpireState.weaveCutTelegraph = {
    x: targetX,
    z: targetZ,
  };
  innerSpireState.weaveCutResolveTimer = LOOM_PROCTOR_WEAVE_TELL_SECONDS;
  innerSpireState.weaveCutTimer = Math.max(2.4, Number(intervalSeconds) || LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL);
  vfxSystem.spawnTelegraphLine?.({
    from: new THREE.Vector2(innerSpireState.loomCenter.x, innerSpireState.loomCenter.y),
    to: new THREE.Vector2(targetX, targetZ),
    color: "#d3deff",
    life: LOOM_PROCTOR_WEAVE_TELL_SECONDS,
    width: 0.12,
  });
}

function resolveLoomWeaveCut() {
  const telegraph = innerSpireState.weaveCutTelegraph;
  if (!telegraph) return;
  const dx = player.position.x - telegraph.x;
  const dz = player.position.z - telegraph.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= LOOM_PROCTOR_WEAVE_CUT_RADIUS) {
    onPlayerDamaged(LOOM_PROCTOR_WEAVE_CUT_DAMAGE, {
      source: "loom_weave_cut",
      position: new THREE.Vector2(telegraph.x, telegraph.z),
    });
  }
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(telegraph.x, telegraph.z),
    innerRadius: 0.18,
    outerRadius: LOOM_PROCTOR_WEAVE_CUT_RADIUS,
    color: "#b6c5ff",
    life: 0.48,
    opacity: 0.78,
    spread: 0.46,
  });
  spawnLoomFissureAt(telegraph.x, telegraph.z);
  innerSpireState.weaveCutTelegraph = null;
}

function updateInnerSpirePressure(dtSeconds) {
  if (currentSceneInfo.sceneId !== "inner_spire") {
    memoryPressureTracker.setActive(false, { resetValue: true });
    return;
  }
  if (!innerSpireState.initialized) {
    initializeInnerSpireState();
  }
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (innerSpireState.shortCalloutCooldown > 0) {
    innerSpireState.shortCalloutCooldown = Math.max(0, innerSpireState.shortCalloutCooldown - dt);
  }
  const locksRemaining = getResonanceLockCountRemaining();
  const shouldRun = locksRemaining > 0 && !hasEndgameLoomProctorDefeated();
  memoryPressureTracker.setActive(shouldRun, { resetValue: !shouldRun });
  const pressure = memoryPressureTracker.update(dt, { enabled: shouldRun });
  innerSpireState.pressureTierEvents = pressure.thresholdEvents ?? [];
  if (shouldRun && Array.isArray(pressure.thresholdEvents)) {
    for (const threshold of pressure.thresholdEvents) {
      const tier = MEMORY_PRESSURE_THRESHOLDS.findIndex((entry) => Math.abs(entry - threshold) <= 1e-5);
      if (tier >= 0) {
        spawnInnerSpirePressurePack(tier);
      }
    }
  }
}

function updateResonanceLockSetpiece(dtSeconds) {
  if (currentSceneInfo.sceneId !== "inner_spire") return;
  if (!hasEndgameAct2Started()) return;
  if (!hasEndgameInnerSpireEntered()) return;
  if (!innerSpireState.initialized) {
    initializeInnerSpireState();
  }
  const dt = Math.max(0, Number(dtSeconds) || 0);
  updateInnerSpirePressure(dt);
  const result = updateResonanceLocks(
    dt,
    { x: player.position.x, z: player.position.z },
    {
      interactRadius: RESONANCE_LOCK_INTERACT_RADIUS,
      retryCooldownSeconds: RESONANCE_LOCK_RETRY_COOLDOWN_SECONDS,
      interrupted:
        Boolean(bossInstance.isActive()) ||
        getEffectiveMovementContext() === "combat" ||
        sceneManager.isTransitioning() ||
        dialogueBox.isOpen() ||
        shrineSystem.isOpen(),
      onChannelTick: ({ index, remaining }) => {
        innerSpireState.lockChanneling = true;
        const lockIndex = Math.max(1, Math.floor(Number(index) || 0) + 1);
        setTransientMessage(`Aligning Lock ${lockIndex} ${Math.ceil(remaining * 10) / 10}s`, 0.24);
      },
      onChannelInterrupted: ({ index }) => {
        innerSpireState.lockChanneling = false;
        setTransientMessage(`Lock ${Math.max(1, Math.floor(Number(index) || 0) + 1)} alignment interrupted.`, 1.08);
      },
      onLockCompleted: ({ index, remaining }) => {
        innerSpireState.lockChanneling = false;
        setResonanceLockStoryFlag(index, true);
        memoryPressureTracker.relieve(MEMORY_PRESSURE_RELIEF, {
          slowSeconds: MEMORY_PRESSURE_SLOW_SECONDS,
        });
        setTransientMessage(`Resonance Lock ${Math.max(1, Number(index) + 1)} aligned.`, 1.05);
        emitInnerSpireCallout("Arthur: Lock aligned. Keep moving.");
        if (remaining <= 0) {
          setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR);
          refreshQuestText();
          spawnLoomProctorEncounter({ force: true });
        }
      },
    }
  );
  if (!result?.channel) {
    innerSpireState.lockChanneling = false;
  }
}

function updateLoomFissures(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  for (let i = innerSpireState.fissures.length - 1; i >= 0; i -= 1) {
    const fissure = innerSpireState.fissures[i];
    fissure.remaining = Math.max(0, Number(fissure.remaining) - dt);
    fissure.tick = Math.max(0, Number(fissure.tick) - dt);
    if (fissure.ring?.material) {
      const ratio = Math.max(0, Math.min(1, fissure.remaining / LOOM_PROCTOR_WEAVE_CUT_FISSURE_SECONDS));
      fissure.ring.material.opacity = 0.1 + ratio * 0.18;
    }
    if (fissure.tick <= 0) {
      fissure.tick = 0.72;
      const distance = Math.hypot(player.position.x - fissure.x, player.position.z - fissure.z);
      if (distance <= fissure.radius) {
        onPlayerDamaged(5, {
          source: "memory_fissure",
          position: new THREE.Vector2(fissure.x, fissure.z),
        });
      }
    }
    if (fissure.remaining <= 0) {
      if (fissure.ring) {
        scene.remove(fissure.ring);
        fissure.ring.geometry?.dispose?.();
        fissure.ring.material?.dispose?.();
      }
      innerSpireState.fissures.splice(i, 1);
    }
  }
}

function updateLoomProctorBossMechanics(dtSeconds) {
  const state = bossInstance.getState();
  const active = Boolean(state?.active && state?.bossId === LOOM_PROCTOR_BOSS_ID);
  if (!active) {
    setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
    innerSpireState.weaveCutResolveTimer = 0;
    innerSpireState.weaveCutTelegraph = null;
    innerSpireState.currentPhase = "";
    innerSpireState.phase2ShieldFloor = 0;
    clearLoomPrismPillars();
    clearLoomFissures();
    return;
  }
  const dt = Math.max(0, Number(dtSeconds) || 0);
  setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, true);
  innerSpireState.loomBossStarted = true;
  const hpRatio = Number(state?.hpRatio ?? 1);
  const phase = hpRatio > LOOM_PROCTOR_PRISM_PHASE_THRESHOLD_P2 ? "p1" : hpRatio > LOOM_PROCTOR_PRISM_PHASE_THRESHOLD_P3 ? "p2" : "p3";
  if (innerSpireState.currentPhase !== phase) {
    innerSpireState.currentPhase = phase;
    if (phase === "p1") {
      innerSpireState.weaveCutTimer = 1.6;
      clearLoomPrismPillars();
    } else if (phase === "p2") {
      innerSpireState.weaveCutTimer = 1.2;
      if (innerSpireState.prismPillars.length <= 0) {
        spawnLoomPrismPillars();
      }
      innerSpireState.phase2ShieldFloor = Math.max(0.36, hpRatio - 0.01);
    } else {
      innerSpireState.weaveCutTimer = 1.05;
      innerSpireState.memoryTaxTimer = 1.4;
      innerSpireState.phase2ShieldFloor = 0;
      clearLoomPrismPillars();
      emitInnerSpireCallout("Willow: Tax phase! Heals get stingy!");
    }
  }

  if (phase === "p2") {
    if (innerSpireState.prismPillars.length <= 0) {
      spawnLoomPrismPillars();
      innerSpireState.phase2ShieldFloor = Math.max(0.36, hpRatio - 0.01);
    }
    const remainingPillars = innerSpireState.prismPillars.reduce((count, pillar) => count + (pillar?.alive ? 1 : 0), 0);
    if (remainingPillars > 0 && innerSpireState.phase2ShieldFloor > 0 && hpRatio < innerSpireState.phase2ShieldFloor) {
      bossInstance.setBossHpPercent(innerSpireState.phase2ShieldFloor);
    }
  }

  const weaveInterval =
    phase === "p1"
      ? LOOM_PROCTOR_PHASE1_WEAVE_INTERVAL
      : phase === "p2"
        ? LOOM_PROCTOR_PHASE2_WEAVE_INTERVAL
        : LOOM_PROCTOR_PHASE3_WEAVE_INTERVAL;
  innerSpireState.weaveCutTimer = Math.max(0, innerSpireState.weaveCutTimer - dt);
  if (innerSpireState.weaveCutTimer <= 0 && innerSpireState.weaveCutResolveTimer <= 0) {
    beginLoomWeaveCutTelegraph(weaveInterval);
    emitInnerSpireCallout("Arthur: Weave Cut line. Move.");
  }

  if (innerSpireState.weaveCutResolveTimer > 0) {
    innerSpireState.weaveCutResolveTimer = Math.max(0, innerSpireState.weaveCutResolveTimer - dt);
    if (innerSpireState.weaveCutResolveTimer <= 0) {
      resolveLoomWeaveCut();
    }
  }

  if (phase === "p3") {
    innerSpireState.memoryTaxTimer = Math.max(0, innerSpireState.memoryTaxTimer - dt);
    if (innerSpireState.memoryTaxTimer <= 0) {
      innerSpireState.memoryTaxTimer = LOOM_PROCTOR_MEMORY_TAX_INTERVAL;
      const targets = [STATUS_ENTITY_IDS.ARTHUR];
      if (hasElaineJoined() && !elaineDowned) targets.push(STATUS_ENTITY_IDS.ELAINE);
      if (hasWillowJoined()) targets.push(STATUS_ENTITY_IDS.WILLOW);
      for (const entityId of targets) {
        statusEffects.addEffect(entityId, {
          id: STATUS_EFFECT_IDS.MEMORY_TAX,
          durationSeconds: LOOM_PROCTOR_MEMORY_TAX_SECONDS,
          sourceId: LOOM_PROCTOR_BOSS_ID,
        });
      }
      emitInnerSpireCallout("Elaine: Memory Tax incoming. Keep discipline.");
      vfxSystem.spawnGroundRing?.({
        position: new THREE.Vector2(innerSpireState.loomCenter.x, innerSpireState.loomCenter.y),
        innerRadius: 0.44,
        outerRadius: 1.12,
        color: "#bfb7ff",
        life: 0.54,
        opacity: 0.74,
        spread: 0.8,
      });
    }
  }

  updateLoomFissures(dt);
}

function isNearLastDoorInteraction() {
  if (currentSceneInfo.sceneId !== "inner_spire_last_door") return false;
  if (!hasEndgameAct3Unlocked()) return false;
  const config = getInnerSpireLastDoorConfig();
  const door = config.lastDoor ?? {};
  const distance = Math.hypot(player.position.x - (Number(door.x) || 1.84), player.position.z - (Number(door.y) || -0.14));
  const radius = Math.max(0.6, Number(door.interactRadius) || 1.1);
  return distance <= radius;
}

function getLastSpireConfig() {
  const sceneConfig = sceneManager.getLastSpireConfig?.();
  const defaults = {
    rift: {
      center: { x: -1.18, y: 0.08 },
      radius: 1.24,
      triggerRadius: 1.18,
      checkpoint: { x: -2.86, z: 0.04 },
      anchors: [
        { id: "rift-anchor-1", x: -2.08, y: 0.88 },
        { id: "rift-anchor-2", x: -1.04, y: -0.86 },
        { id: "rift-anchor-3", x: 0.08, y: 0.82 },
      ],
    },
    core: {
      center: { x: 2.46, y: -0.34 },
      radius: 2.72,
      triggerRadius: 1.18,
      checkpoint: { x: 0.94, z: -0.12 },
      clamps: [
        { id: "final-clamp-1", x: 1.8, y: 0.38 },
        { id: "final-clamp-2", x: 3.08, y: 0.22 },
        { id: "final-clamp-3", x: 2.98, y: -1.24 },
      ],
      coverPillars: [
        { x: 1.66, y: -1.16 },
        { x: 3.68, y: -0.82 },
      ],
    },
    bossArena: {
      center: { x: 3.26, y: -1.08 },
      radius: 2.7,
      triggerRadius: 1.14,
    },
    choiceAltar: {
      x: 4.04,
      y: -1.76,
      interactRadius: 1.12,
    },
  };
  if (!sceneConfig) return defaults;
  return {
    ...defaults,
    ...sceneConfig,
    rift: {
      ...defaults.rift,
      ...(sceneConfig.rift ?? {}),
      center: {
        ...defaults.rift.center,
        ...(sceneConfig.rift?.center ?? {}),
      },
      checkpoint: {
        ...defaults.rift.checkpoint,
        ...(sceneConfig.rift?.checkpoint ?? {}),
      },
      anchors: Array.isArray(sceneConfig.rift?.anchors) ? sceneConfig.rift.anchors : defaults.rift.anchors,
    },
    core: {
      ...defaults.core,
      ...(sceneConfig.core ?? {}),
      center: {
        ...defaults.core.center,
        ...(sceneConfig.core?.center ?? {}),
      },
      checkpoint: {
        ...defaults.core.checkpoint,
        ...(sceneConfig.core?.checkpoint ?? {}),
      },
      clamps: Array.isArray(sceneConfig.core?.clamps) ? sceneConfig.core.clamps : defaults.core.clamps,
      coverPillars: Array.isArray(sceneConfig.core?.coverPillars)
        ? sceneConfig.core.coverPillars
        : defaults.core.coverPillars,
    },
    bossArena: {
      ...defaults.bossArena,
      ...(sceneConfig.bossArena ?? {}),
      center: {
        ...defaults.bossArena.center,
        ...(sceneConfig.bossArena?.center ?? {}),
      },
    },
    choiceAltar: {
      ...defaults.choiceAltar,
      ...(sceneConfig.choiceAltar ?? {}),
    },
  };
}

function emitLastSpireCallout(line = "") {
  const text = String(line ?? "").trim();
  if (!text) return false;
  if (lastSpireState.shortCalloutCooldown > 0) return false;
  lastSpireState.shortCalloutCooldown = NARRATOR_SHORT_CALLOUT_COOLDOWN_SECONDS;
  partyChat.addLine(text, {
    channel: "guidance",
    lifetimeSeconds: 8.6,
  });
  if (transientMessageSeconds <= 0.001) {
    setTransientMessage(text, 1.45);
  }
  return true;
}

function clearLastSpireEnemyPressure() {
  if (lastSpireState.riftEnemyIds.length > 0) {
    combatSystem.despawnEnemiesByIds(lastSpireState.riftEnemyIds);
  }
  if (lastSpireState.coreEnemyIds.length > 0) {
    combatSystem.despawnEnemiesByIds(lastSpireState.coreEnemyIds);
  }
  lastSpireState.riftEnemyIds = [];
  lastSpireState.coreEnemyIds = [];
}

function resetLastSpireRuntime({ keepProgress = true } = {}) {
  clearLastSpireEnemyPressure();
  lastSpireState.active = false;
  lastSpireState.initialized = false;
  lastSpireState.riftActive = false;
  lastSpireState.riftStarted = false;
  lastSpireState.riftAnchors = [];
  lastSpireState.riftAnchorCooldowns = [0, 0, 0];
  lastSpireState.riftChanneling = null;
  lastSpireState.riftStability = RIFT_STABILITY_START;
  lastSpireState.riftShockwaves = 0;
  lastSpireState.riftWaveFxSeconds = 0;
  lastSpireState.riftWaveFxScale = 0.22;
  lastSpireState.riftSpawnWaves = 0;
  lastSpireState.riftHazardTick = 0;
  lastSpireState.coreActive = false;
  lastSpireState.coreStarted = false;
  lastSpireState.finalClamps = [];
  lastSpireState.finalClampCooldowns = [0, 0, 0];
  lastSpireState.coreChanneling = null;
  lastSpireState.coreSpawnWaves = 0;
  lastSpireState.enginePulseTimer = CORE_ENGINE_PULSE_INTERVAL;
  lastSpireState.enginePulseResolveTimer = 0;
  lastSpireState.bossStarted = false;
  lastSpireState.narratorPhase = "";
  lastSpireState.narratorLineTimer = NARRATOR_LINE_INTERVAL_P1;
  lastSpireState.narratorLineResolveTimer = 0;
  lastSpireState.narratorLineTelegraph = null;
  lastSpireState.narratorShockwaveTimer = NARRATOR_SHOCKWAVE_INTERVAL_P2;
  lastSpireState.narratorShockwaveResolveTimer = 0;
  lastSpireState.narratorRewriteMarkTimer = NARRATOR_REWRITE_MARK_INTERVAL;
  lastSpireState.narratorChoiceReady = false;
  lastSpireState.narratorAddTimer = 4.5;
  lastSpireState.narratorAddIds = [];
  lastSpireState.shortCalloutCooldown = 0;
  lastSpireState.lorePanelsShown = false;
  lastSpireState.phase2CalloutDone = false;
  lastSpireState.phase3CalloutDone = false;
  lastSpireRiftShockwaveRing.visible = false;
  lastSpireCorePulseRing.visible = false;
  narratorShockwaveRing.visible = false;
  setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
  if (!keepProgress) {
    setEndgameAct3Started(false);
    setEndgameLastDoorOpened(false);
    setEndgameLastSpireEntered(false);
    setEndgameSetpieceRiftCrossed(false);
    setEndgameSetpieceCoreReached(false);
    setEndgameFinalBossDefeated(false);
    setEndgameChoiceMade(false);
    setEndgameEnding("");
    setEndgameCreditsSeen(false);
    setNgPlusUnlocked(false);
  }
}

function initializeLastSpireState({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (lastSpireState.initialized && !force) return true;
  const config = getLastSpireConfig();
  lastSpireState.riftCenter.set(Number(config.rift?.center?.x) || -1.18, Number(config.rift?.center?.y) || 0.08);
  lastSpireState.riftRadius = Math.max(0.8, Number(config.rift?.radius) || 1.24);
  lastSpireState.riftTriggerRadius = Math.max(0.6, Number(config.rift?.triggerRadius) || 1.18);
  lastSpireState.riftCheckpoint = {
    x: Number(config.rift?.checkpoint?.x) || -2.86,
    z: Number(config.rift?.checkpoint?.z) || 0.04,
  };
  lastSpireState.riftAnchors = (Array.isArray(config.rift?.anchors) ? config.rift.anchors : []).map((entry, index) => ({
    index,
    id: String(entry?.id ?? `rift-anchor-${index + 1}`),
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
    attuned: hasEndgameSetpieceRiftCrossed(),
  }));
  lastSpireState.riftAnchorCooldowns = lastSpireState.riftAnchors.map(() => 0);
  lastSpireState.riftActive = false;
  lastSpireState.riftStarted = false;
  lastSpireState.riftChanneling = null;
  lastSpireState.riftStability = hasEndgameSetpieceRiftCrossed() ? 0.78 : RIFT_STABILITY_START;
  lastSpireState.riftShockwaves = 0;
  lastSpireState.riftWaveFxSeconds = 0;
  lastSpireState.riftWaveFxScale = 0.22;
  lastSpireState.riftSpawnWaves = 0;
  lastSpireState.riftHazardTick = 0.32;
  lastSpireState.riftEnemyIds = [];

  lastSpireState.coreCenter.set(Number(config.core?.center?.x) || 2.46, Number(config.core?.center?.y) || -0.34);
  lastSpireState.coreRadius = Math.max(2, Number(config.core?.radius) || 2.72);
  lastSpireState.coreTriggerRadius = Math.max(0.6, Number(config.core?.triggerRadius) || 1.18);
  lastSpireState.coreCheckpoint = {
    x: Number(config.core?.checkpoint?.x) || 0.94,
    z: Number(config.core?.checkpoint?.z) || -0.12,
  };
  lastSpireState.finalClamps = (Array.isArray(config.core?.clamps) ? config.core.clamps : []).map((entry, index) => ({
    index,
    id: String(entry?.id ?? `final-clamp-${index + 1}`),
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
    disabled: hasEndgameSetpieceCoreReached(),
  }));
  lastSpireState.finalClampCooldowns = lastSpireState.finalClamps.map(() => 0);
  lastSpireState.coreCoverPillars = (Array.isArray(config.core?.coverPillars) ? config.core.coverPillars : []).map((entry) => ({
    x: Number(entry?.x) || 0,
    z: Number(entry?.y ?? entry?.z) || 0,
  }));
  lastSpireState.coreActive = false;
  lastSpireState.coreStarted = false;
  lastSpireState.coreChanneling = null;
  lastSpireState.coreSpawnWaves = 0;
  lastSpireState.coreEnemyIds = [];
  lastSpireState.enginePulseTimer = CORE_ENGINE_PULSE_INTERVAL;
  lastSpireState.enginePulseResolveTimer = 0;

  lastSpireState.bossStarted = false;
  lastSpireState.narratorPhase = "";
  lastSpireState.narratorLineTimer = NARRATOR_LINE_INTERVAL_P1;
  lastSpireState.narratorLineResolveTimer = 0;
  lastSpireState.narratorLineTelegraph = null;
  lastSpireState.narratorShockwaveTimer = NARRATOR_SHOCKWAVE_INTERVAL_P2;
  lastSpireState.narratorShockwaveResolveTimer = 0;
  lastSpireState.narratorRewriteMarkTimer = NARRATOR_REWRITE_MARK_INTERVAL;
  lastSpireState.narratorChoiceReady = hasEndgameFinalBossDefeated();
  lastSpireState.narratorAddTimer = 4.5;
  lastSpireState.narratorAddIds = [];
  lastSpireState.shortCalloutCooldown = 0;
  lastSpireState.lorePanelsShown = hasEndgameSetpieceRiftCrossed();
  lastSpireState.phase2CalloutDone = false;
  lastSpireState.phase3CalloutDone = false;

  lastSpireRiftShockwaveRing.visible = false;
  lastSpireCorePulseRing.visible = false;
  narratorShockwaveRing.visible = false;
  lastSpireState.active = true;
  lastSpireState.initialized = true;
  return true;
}

function queueEndgameAct3Start() {
  if (endgameAct3StartPending) return false;
  const lockSeconds = ENDGAME_ACT3_LOCK_SECONDS;
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  endgameAct3StartPending = {
    lockRemaining: lockSeconds,
    openedDialogue: false,
    lines: [
      "Arthur: Door is awake. No more rehearsal.",
      "Elaine: Last protocol: we cross, we bind, we do not fracture under pressure.",
      "Willow: Spire heartbeat says we are late. Cool. Let us be violently punctual.",
      "Arthur: Then we move. Open it.",
    ],
  };
  return true;
}

function enterLastSpireThroughDoor() {
  setEndgameAct3Started(true);
  setEndgameLastDoorOpened(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.CROSS_RIFT);
  refreshQuestText();
  sceneManager.requestTransition("last_spire", { flow: "act3-last-door-open" });
  setTransientMessage("THE LAST SPIRE", LAST_DOOR_OPEN_TOAST_SECONDS);
}

function tryInspectLastDoor({ showToast = true } = {}) {
  if (currentSceneInfo.sceneId !== "inner_spire_last_door") return false;
  if (!hasEndgameAct3Unlocked()) return false;
  const config = getInnerSpireLastDoorConfig();
  const door = config.lastDoor ?? {};
  const distance = Math.hypot(player.position.x - (Number(door.x) || 1.84), player.position.z - (Number(door.y) || -0.14));
  const radius = Math.max(0.6, Number(door.interactRadius) || 1.1);
  if (distance > radius) {
    if (showToast) setTransientMessage("Move closer to the Last Door.", 0.9);
    return false;
  }
  if (!hasEndgameLastDoorSeen()) {
    setEndgameLastDoorSeen(true);
  }
  if (hasEndgameAct3Started() && !sceneManager.isTransitioning()) {
    enterLastSpireThroughDoor();
    return true;
  }
  setCurrentObjectiveId(OBJECTIVE_IDS.OPEN_LAST_DOOR);
  refreshQuestText();
  queueEndgameAct3Start();
  return true;
}

function updateEndgameAct3StartSequence(dtSeconds) {
  if (!endgameAct3StartPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  endgameAct3StartPending.lockRemaining = Math.max(0, endgameAct3StartPending.lockRemaining - dt);
  if (endgameAct3StartPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (endgameAct3StartPending.openedDialogue) return;
  endgameAct3StartPending.openedDialogue = true;
  openNpcDialogue({
    npcId: "last_door",
    npcName: "Last Door",
    script: endgameAct3StartPending.lines,
    onComplete: () => {
      if (!sceneManager.isTransitioning()) {
        enterLastSpireThroughDoor();
      }
      endgameAct3StartPending = null;
    },
  });
}

function isNearRiftAnchorInteraction() {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!lastSpireState.riftActive) return false;
  if (lastSpireState.riftChanneling) return false;
  for (const anchor of lastSpireState.riftAnchors) {
    if (!anchor || anchor.attuned) continue;
    const cooldown = lastSpireState.riftAnchorCooldowns[anchor.index] ?? 0;
    if (cooldown > 0) continue;
    if (Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z) <= RIFT_ANCHOR_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function startRiftAnchorChannel(index = 0) {
  if (!lastSpireState.riftActive) return false;
  if (lastSpireState.riftChanneling) return false;
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const anchor = lastSpireState.riftAnchors[safeIndex];
  if (!anchor || anchor.attuned) return false;
  if ((lastSpireState.riftAnchorCooldowns[safeIndex] ?? 0) > 0) return false;
  lastSpireState.riftChanneling = {
    anchorIndex: safeIndex,
    remaining: RIFT_ANCHOR_CHANNEL_SECONDS,
    interrupted: false,
  };
  controlLockRemaining = Math.max(controlLockRemaining, RIFT_ANCHOR_CHANNEL_SECONDS);
  setTransientMessage(`Stabilizing Rift Anchor ${safeIndex + 1}...`, 0.9);
  return true;
}

function failRiftAnchorChannel() {
  if (!lastSpireState.riftChanneling) return false;
  const index = Math.max(0, Math.floor(Number(lastSpireState.riftChanneling.anchorIndex) || 0));
  lastSpireState.riftChanneling = null;
  lastSpireState.riftAnchorCooldowns[index] = RIFT_ANCHOR_RETRY_COOLDOWN_SECONDS;
  setTransientMessage("Anchor channel interrupted. Reset and retry.", 1.05);
  return true;
}

function completeRiftAnchorChannel(index = 0) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const anchor = lastSpireState.riftAnchors[safeIndex];
  if (!anchor || anchor.attuned) return false;
  anchor.attuned = true;
  lastSpireState.riftChanneling = null;
  lastSpireState.riftAnchorCooldowns[safeIndex] = 0;
  const attunedCount = lastSpireState.riftAnchors.reduce((count, entry) => count + (entry?.attuned ? 1 : 0), 0);
  const nextState = applyRiftAnchorStabilized(
    {
      active: lastSpireState.riftActive,
      meter: lastSpireState.riftStability,
      anchorsDone: attunedCount - 1,
      shocks: lastSpireState.riftShockwaves,
    },
    {
      fillPerSecond: RIFT_STABILITY_DECAY_PER_SECOND,
      anchorBoost: RIFT_ANCHOR_STABILITY_GAIN,
      shockwaveReset: RIFT_STABILITY_RESET,
    }
  );
  lastSpireState.riftStability = Math.max(0, Math.min(1, Number(nextState.meter ?? lastSpireState.riftStability)));
  if (Boolean(nextState.completed)) {
    lastSpireState.riftActive = false;
  }
  emitLastSpireCallout(`Arthur: Anchor ${safeIndex + 1} stable.`);
  setTransientMessage(`Rift Anchor ${safeIndex + 1} stabilized.`, 1);
  return true;
}

function tryAttuneNearestRiftAnchor({ showToast = true } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!lastSpireState.riftActive) return false;
  if (!isNearRiftAnchorInteraction()) {
    if (showToast) setTransientMessage("Move closer to a Rift Anchor.", 0.9);
    return false;
  }
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const anchor of lastSpireState.riftAnchors) {
    if (!anchor || anchor.attuned) continue;
    const cooldown = lastSpireState.riftAnchorCooldowns[anchor.index] ?? 0;
    if (cooldown > 0) continue;
    const distance = Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = anchor;
    }
  }
  if (!best || bestDistance > RIFT_ANCHOR_INTERACT_RADIUS) {
    if (showToast) setTransientMessage("Move closer to a Rift Anchor.", 0.9);
    return false;
  }
  return startRiftAnchorChannel(best.index);
}

function triggerRiftShockwave() {
  const center = lastSpireState.riftCenter;
  lastSpireState.riftWaveFxSeconds = 0.56;
  lastSpireState.riftWaveFxScale = 0.22;
  lastSpireRiftShockwaveRing.visible = true;
  lastSpireRiftShockwaveRing.position.set(center.x, -0.884, center.y);
  lastSpireRiftShockwaveRing.scale.set(0.68, 0.68, 1);
  lastSpireRiftShockwaveRing.material.opacity = 0.42;
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(center.x, center.y),
    innerRadius: 0.66,
    outerRadius: Math.max(1.5, lastSpireState.riftRadius + 0.5),
    color: "#b9c9ff",
    life: 0.56,
    opacity: 0.76,
    spread: 1.18,
  });
  const dx = player.position.x - center.x;
  const dz = player.position.z - center.y;
  const distance = Math.hypot(dx, dz);
  const inv = distance > 0.0001 ? 1 / distance : 0;
  playerKnockbackVelocity.x += dx * inv * RIFT_SHOCKWAVE_KNOCK;
  playerKnockbackVelocity.y += dz * inv * RIFT_SHOCKWAVE_KNOCK;
  onPlayerDamaged(RIFT_SHOCKWAVE_DAMAGE, {
    source: "rift_shockwave",
    position: new THREE.Vector2(center.x, center.y),
  });
  emitLastSpireCallout("Willow: Rift snap! Keep moving!");
}

function spawnLastSpireRiftWave() {
  const waveIndex = lastSpireState.riftSpawnWaves + 1;
  const spawns = [
    {
      id: `last-spire-rift-wave-${waveIndex}-a`,
      role: "striker",
      type: "echo_knight",
      x: lastSpireState.riftCenter.x - 0.94,
      z: lastSpireState.riftCenter.y + 0.92,
      maxHealth: 50,
      aggroRadius: 4.1,
      attackRange: 0.76,
      attackCooldown: 1.04,
      lingerTag: "last-spire-rift",
    },
    {
      id: `last-spire-rift-wave-${waveIndex}-b`,
      role: "construct",
      type: "lattice_sentinel",
      x: lastSpireState.riftCenter.x + 1.02,
      z: lastSpireState.riftCenter.y - 0.86,
      maxHealth: 56,
      aggroRadius: 4.1,
      attackRange: 0.98,
      attackCooldown: 1.26,
      lingerTag: "last-spire-rift",
    },
  ];
  const spawned = combatSystem.spawnEnemies(spawns);
  if (!Array.isArray(spawned) || spawned.length <= 0) return false;
  lastSpireState.riftEnemyIds = Array.from(new Set([...lastSpireState.riftEnemyIds, ...spawned]));
  lastSpireState.riftSpawnWaves += 1;
  return true;
}

function queueEndgameAct3LorePanels({ force = false } = {}) {
  if (!force && endgameAct3LorePanelsPending) return false;
  const payload = playEndgameAct3LoreVision({
    chapter9Choice: getChapter9Choice(),
    crownTier: crownMood.getTierLabel(),
  });
  if (!payload?.triggered) return false;
  const lockSeconds = Math.max(0, Number(payload.lockSeconds) || 0.8);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  endgameAct3LorePanelsPending = {
    lockRemaining: lockSeconds,
    payload,
  };
  return true;
}

function updateEndgameAct3LorePanelsSequence(dtSeconds) {
  if (!endgameAct3LorePanelsPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  endgameAct3LorePanelsPending.lockRemaining = Math.max(0, endgameAct3LorePanelsPending.lockRemaining - dt);
  if (endgameAct3LorePanelsPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (dialogueBox.isOpen()) return;
  if (cinematicPanelOverlay.isOpen()) return;

  const payload = endgameAct3LorePanelsPending.payload ?? {};
  const basePanels = Array.isArray(payload.panels) ? payload.panels.slice(0, 3) : [];
  const entries = basePanels.map((panel, index) => {
    let extra = "";
    if (index === 0 && payload.preface) extra = `\n\n${String(payload.preface)}`;
    if (index === 1 && payload.tierThread) extra = `\n\n${String(payload.tierThread)}`;
    if (index === 2 && payload.finalLine) extra = `\n\n${String(payload.finalLine)}`;
    return {
      title: String(panel?.title ?? "VISION"),
      text: `${String(panel?.text ?? "")}${extra}`,
    };
  });
  cinematicPanelOverlay.play(entries, {
    onDone: () => {
      lastSpireState.lorePanelsShown = true;
      setCurrentObjectiveId(payload.objectiveId ?? OBJECTIVE_IDS.REACH_CROWN_ENGINE);
      refreshQuestText();
    },
  });
  endgameAct3LorePanelsPending = null;
}

function completeRiftCrossing() {
  lastSpireState.riftActive = false;
  lastSpireState.riftChanneling = null;
  setEndgameSetpieceRiftCrossed(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.REACH_CROWN_ENGINE);
  refreshQuestText();
  if (!lastSpireState.lorePanelsShown) {
    queueEndgameAct3LorePanels({ force: true });
  }
  partyChat.addLine("Arthur: Rift stable. Engine ahead.", { channel: "guidance", lifetimeSeconds: 7.8 });
  partyChat.addLine("Elaine: No triumph yet. Core clamps next.", { channel: "guidance", lifetimeSeconds: 7.8 });
  partyChat.addLine("Willow: Bridge is holding. Run before it changes its mind.", { channel: "guidance", lifetimeSeconds: 7.8 });
  setTransientMessage("Rift crossed. Crown Engine ahead.", 1.4);
}

function startLastSpireRiftSetpiece({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!initializeLastSpireState()) return false;
  if (hasEndgameSetpieceRiftCrossed()) return false;
  const distance = Math.hypot(
    player.position.x - lastSpireState.riftCenter.x,
    player.position.z - lastSpireState.riftCenter.y
  );
  const nearTrigger = distance <= Math.max(0.6, lastSpireState.riftTriggerRadius);
  const outcome =
    force
      ? { triggered: true, meterValue: RIFT_STABILITY_START, message: "Reality tears open. Stabilize three anchors." }
      : tryStartRiftCrossing({
          sceneId: currentSceneInfo.sceneId,
          objectiveId: resolveStoryObjectiveState().id,
          endgameSetpieceRiftCrossed: hasEndgameSetpieceRiftCrossed(),
          riftActive: lastSpireState.riftActive,
          nearTrigger,
        });
  if (!outcome?.triggered) return false;
  lastSpireState.riftActive = true;
  lastSpireState.riftStarted = true;
  lastSpireState.riftStability = Math.max(0.12, Number(outcome.meterValue ?? RIFT_STABILITY_START));
  lastSpireState.riftShockwaves = 0;
  lastSpireState.riftSpawnWaves = 0;
  lastSpireState.riftHazardTick = 0.32;
  setCurrentObjectiveId(OBJECTIVE_IDS.CROSS_RIFT);
  refreshQuestText();
  if (outcome.message) {
    setTransientMessage(String(outcome.message), 1.45);
  }
  emitLastSpireCallout("Elaine: Anchor the bridge before reality folds.");
  return true;
}

function updateLastSpireRiftSetpiece(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (lastSpireState.shortCalloutCooldown > 0) {
    lastSpireState.shortCalloutCooldown = Math.max(0, lastSpireState.shortCalloutCooldown - dt);
  }
  if (currentSceneInfo.sceneId !== "last_spire") {
    lastSpireRiftShockwaveRing.visible = false;
    return;
  }
  if (!initializeLastSpireState()) return;
  if (!hasEndgameSetpieceRiftCrossed()) {
    startLastSpireRiftSetpiece({ force: false });
  }
  if (lastSpireState.riftWaveFxSeconds > 0) {
    lastSpireState.riftWaveFxSeconds = Math.max(0, lastSpireState.riftWaveFxSeconds - dt);
    const ratio = lastSpireState.riftWaveFxSeconds / 0.56;
    const growth = 1 + (1 - ratio) * Math.max(1.2, lastSpireState.riftRadius * 1.1);
    lastSpireRiftShockwaveRing.visible = true;
    lastSpireRiftShockwaveRing.scale.set(growth, growth, 1);
    lastSpireRiftShockwaveRing.material.opacity = 0.42 * ratio;
    cameraShakeOffset.x += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.3;
    cameraShakeOffset.z += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.3;
  } else {
    lastSpireRiftShockwaveRing.visible = false;
  }
  if (!isRiftCrossingActive({ active: lastSpireState.riftActive })) {
    return;
  }

  const distanceToCenter = Math.hypot(
    player.position.x - lastSpireState.riftCenter.x,
    player.position.z - lastSpireState.riftCenter.y
  );
  lastSpireState.riftHazardTick = Math.max(0, Number(lastSpireState.riftHazardTick) - dt);
  if (distanceToCenter <= lastSpireState.riftRadius && lastSpireState.riftHazardTick <= 0) {
    lastSpireState.riftHazardTick = 0.42;
    const dx = player.position.x - lastSpireState.riftCenter.x;
    const dz = player.position.z - lastSpireState.riftCenter.y;
    const magnitude = Math.hypot(dx, dz);
    const inv = magnitude > 0.0001 ? 1 / magnitude : 0;
    playerKnockbackVelocity.x += dx * inv * 0.42;
    playerKnockbackVelocity.y += dz * inv * 0.42;
    onPlayerDamaged(6, {
      source: "reality_rift",
      position: new THREE.Vector2(lastSpireState.riftCenter.x, lastSpireState.riftCenter.y),
    });
    if (lastSpireState.riftChanneling) {
      lastSpireState.riftChanneling.interrupted = true;
    }
  }

  for (let i = 0; i < lastSpireState.riftAnchorCooldowns.length; i += 1) {
    lastSpireState.riftAnchorCooldowns[i] = Math.max(0, lastSpireState.riftAnchorCooldowns[i] - dt);
  }
  if (lastSpireState.riftChanneling) {
    const channel = lastSpireState.riftChanneling;
    const anchor = lastSpireState.riftAnchors[channel.anchorIndex];
    if (!anchor || anchor.attuned) {
      lastSpireState.riftChanneling = null;
    } else {
      const distance = Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z);
      if (distance > RIFT_ANCHOR_INTERACT_RADIUS + 0.24 || channel.interrupted || getEffectiveMovementContext() === "combat") {
        failRiftAnchorChannel();
      } else {
        channel.remaining = Math.max(0, channel.remaining - dt);
        setTransientMessage(`Stabilizing Anchor ${channel.anchorIndex + 1} ${Math.ceil(channel.remaining * 10) / 10}s`, 0.24);
        if (channel.remaining <= 0) {
          completeRiftAnchorChannel(channel.anchorIndex);
        }
      }
    }
  }

  const attunedCount = lastSpireState.riftAnchors.reduce((count, entry) => count + (entry?.attuned ? 1 : 0), 0);
  const next = updateRiftCrossing(
    dt,
    {
      active: lastSpireState.riftActive,
      meter: lastSpireState.riftStability,
      shocks: lastSpireState.riftShockwaves,
      anchorsDone: attunedCount,
    },
    {
      fillPerSecond: RIFT_STABILITY_DECAY_PER_SECOND,
      anchorBoost: RIFT_ANCHOR_STABILITY_GAIN,
      shockwaveReset: RIFT_STABILITY_RESET,
    }
  );
  lastSpireState.riftActive = Boolean(next.active);
  lastSpireState.riftStability = Math.max(0, Math.min(1, Number(next.meter ?? lastSpireState.riftStability)));
  lastSpireState.riftShockwaves = Math.max(0, Number(next.shocks ?? lastSpireState.riftShockwaves));
  if (next.shockEvent) {
    triggerRiftShockwave();
  }
  if (attunedCount >= 3 || next.completed) {
    completeRiftCrossing();
    return;
  }

  const alive = combatSystem.countAliveEnemiesByIds(lastSpireState.riftEnemyIds);
  if (alive <= 0 && lastSpireState.riftSpawnWaves < 2) {
    spawnLastSpireRiftWave();
  }
}

function isNearFinalClampInteraction() {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!lastSpireState.coreActive) return false;
  if (lastSpireState.coreChanneling) return false;
  for (const clamp of lastSpireState.finalClamps) {
    if (!clamp || clamp.disabled) continue;
    const cooldown = lastSpireState.finalClampCooldowns[clamp.index] ?? 0;
    if (cooldown > 0) continue;
    if (Math.hypot(player.position.x - clamp.x, player.position.z - clamp.z) <= CORE_CLAMP_INTERACT_RADIUS) {
      return true;
    }
  }
  return false;
}

function startFinalClampChannel(index = 0) {
  if (!lastSpireState.coreActive) return false;
  if (lastSpireState.coreChanneling) return false;
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const clamp = lastSpireState.finalClamps[safeIndex];
  if (!clamp || clamp.disabled) return false;
  if ((lastSpireState.finalClampCooldowns[safeIndex] ?? 0) > 0) return false;
  lastSpireState.coreChanneling = {
    clampIndex: safeIndex,
    remaining: CORE_CLAMP_CHANNEL_SECONDS,
    interrupted: false,
  };
  controlLockRemaining = Math.max(controlLockRemaining, CORE_CLAMP_CHANNEL_SECONDS);
  setTransientMessage(`Disabling Final Clamp ${safeIndex + 1}...`, 0.9);
  return true;
}

function failFinalClampChannel() {
  if (!lastSpireState.coreChanneling) return false;
  const index = Math.max(0, Math.floor(Number(lastSpireState.coreChanneling.clampIndex) || 0));
  lastSpireState.coreChanneling = null;
  lastSpireState.finalClampCooldowns[index] = CORE_CLAMP_RETRY_COOLDOWN_SECONDS;
  setTransientMessage("Clamp override interrupted. Reposition and retry.", 1.05);
  return true;
}

function completeFinalClampChannel(index = 0) {
  const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
  const clamp = lastSpireState.finalClamps[safeIndex];
  if (!clamp || clamp.disabled) return false;
  clamp.disabled = true;
  lastSpireState.finalClampCooldowns[safeIndex] = 0;
  lastSpireState.coreChanneling = null;
  setTransientMessage(`Final Clamp ${safeIndex + 1} disabled.`, 1);
  emitLastSpireCallout(`Arthur: Clamp ${safeIndex + 1} down.`);
  return true;
}

function tryDisableNearestFinalClamp({ showToast = true } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!lastSpireState.coreActive) return false;
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const clamp of lastSpireState.finalClamps) {
    if (!clamp || clamp.disabled) continue;
    const cooldown = lastSpireState.finalClampCooldowns[clamp.index] ?? 0;
    if (cooldown > 0) continue;
    const distance = Math.hypot(player.position.x - clamp.x, player.position.z - clamp.z);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = clamp;
    }
  }
  if (!best || bestDistance > CORE_CLAMP_INTERACT_RADIUS) {
    if (showToast) setTransientMessage("Move closer to a Final Clamp.", 0.9);
    return false;
  }
  return startFinalClampChannel(best.index);
}

function triggerCoreEnginePulse() {
  lastSpireState.enginePulseTimer = CORE_ENGINE_PULSE_INTERVAL;
  lastSpireState.enginePulseResolveTimer = CORE_ENGINE_PULSE_TELEGRAPH_SECONDS;
  lastSpireCorePulseRing.visible = true;
  lastSpireCorePulseRing.position.set(lastSpireState.coreCenter.x, -0.884, lastSpireState.coreCenter.y);
  lastSpireCorePulseRing.scale.set(0.72, 0.72, 1);
  lastSpireCorePulseRing.material.opacity = 0.18;
  emitLastSpireCallout("Elaine: Engine Pulse! Use cover!");
}

function spawnLastSpireCoreWave() {
  const wave = lastSpireState.coreSpawnWaves + 1;
  const spawns = [
    {
      id: `last-spire-core-wave-${wave}-a`,
      role: "striker",
      type: "echo_knight",
      x: lastSpireState.coreCenter.x - 1.06,
      z: lastSpireState.coreCenter.y + 0.92,
      maxHealth: 56,
      aggroRadius: 4.2,
      attackRange: 0.78,
      attackCooldown: 1.08,
      lingerTag: "last-spire-core",
    },
    {
      id: `last-spire-core-wave-${wave}-b`,
      role: "construct",
      type: "lattice_sentinel",
      x: lastSpireState.coreCenter.x + 1.04,
      z: lastSpireState.coreCenter.y - 0.9,
      maxHealth: 62,
      aggroRadius: 4.2,
      attackRange: 1.04,
      attackCooldown: 1.3,
      lingerTag: "last-spire-core",
    },
  ];
  const spawned = combatSystem.spawnEnemies(spawns);
  if (!Array.isArray(spawned) || spawned.length <= 0) return false;
  lastSpireState.coreEnemyIds = Array.from(new Set([...lastSpireState.coreEnemyIds, ...spawned]));
  lastSpireState.coreSpawnWaves += 1;
  return true;
}

function completeLastSpireCoreSetpiece() {
  lastSpireState.coreActive = false;
  lastSpireState.coreChanneling = null;
  lastSpireState.enginePulseResolveTimer = 0;
  lastSpireCorePulseRing.visible = false;
  combatSystem.despawnEnemiesByIds(lastSpireState.coreEnemyIds);
  lastSpireState.coreEnemyIds = [];
  setEndgameSetpieceCoreReached(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_FINAL_BOSS);
  refreshQuestText();
  setTransientMessage("Final clamps shattered. Crown core exposed.", 1.45);
  emitLastSpireCallout("Willow: Core unclamped. Narrator time.");
  spawnNarratorCrownEncounter({ force: true });
}

function startLastSpireCoreSetpiece({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!initializeLastSpireState()) return false;
  if (!hasEndgameSetpieceRiftCrossed()) return false;
  if (hasEndgameSetpieceCoreReached()) return false;
  if (lastSpireState.coreActive || lastSpireState.coreStarted) return false;
  const distance = Math.hypot(
    player.position.x - lastSpireState.coreCenter.x,
    player.position.z - lastSpireState.coreCenter.y
  );
  if (!force && distance > Math.max(0.6, lastSpireState.coreTriggerRadius)) return false;
  lastSpireState.coreActive = true;
  lastSpireState.coreStarted = true;
  lastSpireState.coreChanneling = null;
  lastSpireState.finalClampCooldowns = lastSpireState.finalClamps.map(() => 0);
  for (const clamp of lastSpireState.finalClamps) {
    clamp.disabled = false;
  }
  lastSpireState.coreEnemyIds = [];
  lastSpireState.coreSpawnWaves = 0;
  lastSpireState.enginePulseTimer = Math.max(3.8, CORE_ENGINE_PULSE_INTERVAL * 0.58);
  lastSpireState.enginePulseResolveTimer = 0;
  setCurrentObjectiveId(OBJECTIVE_IDS.REACH_CROWN_ENGINE);
  refreshQuestText();
  setTransientMessage("Break all final clamps before the Engine surges.", 1.4);
  emitLastSpireCallout("Arthur: Clamps first. Then crown.");
  spawnLastSpireCoreWave();
  return true;
}

function updateLastSpireCoreSetpiece(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (currentSceneInfo.sceneId !== "last_spire") {
    lastSpireCorePulseRing.visible = false;
    return;
  }
  if (!initializeLastSpireState()) return;
  if (hasEndgameSetpieceRiftCrossed() && !hasEndgameSetpieceCoreReached()) {
    startLastSpireCoreSetpiece({ force: false });
  }
  if (!lastSpireState.coreActive) {
    if (hasEndgameSetpieceCoreReached() && !hasEndgameFinalBossDefeated()) {
      maybeTriggerNarratorCrown();
    }
    return;
  }

  if (lastSpireState.enginePulseResolveTimer > 0) {
    lastSpireState.enginePulseResolveTimer = Math.max(0, lastSpireState.enginePulseResolveTimer - dt);
    const ratio = lastSpireState.enginePulseResolveTimer / CORE_ENGINE_PULSE_TELEGRAPH_SECONDS;
    lastSpireCorePulseRing.visible = true;
    const scale = 0.72 + (1 - ratio) * Math.max(0.9, CORE_ENGINE_PULSE_RADIUS * 0.9);
    lastSpireCorePulseRing.scale.set(scale, scale, 1);
    lastSpireCorePulseRing.material.opacity = 0.14 + (1 - ratio) * 0.34;
    if (lastSpireState.enginePulseResolveTimer <= 0) {
      lastSpireCorePulseRing.visible = false;
      const distance = Math.hypot(
        player.position.x - lastSpireState.coreCenter.x,
        player.position.z - lastSpireState.coreCenter.y
      );
      const behindPillar = lastSpireState.coreCoverPillars.some(
        (pillar) => Math.hypot(player.position.x - pillar.x, player.position.z - pillar.z) <= CORE_ENGINE_PULSE_SAFE_RADIUS
      );
      if (distance <= CORE_ENGINE_PULSE_RADIUS && !behindPillar) {
        onPlayerDamaged(CORE_ENGINE_PULSE_DAMAGE, {
          source: "crown_engine_pulse",
          position: new THREE.Vector2(lastSpireState.coreCenter.x, lastSpireState.coreCenter.y),
        });
      }
      vfxSystem.spawnGroundRing?.({
        position: new THREE.Vector2(lastSpireState.coreCenter.x, lastSpireState.coreCenter.y),
        innerRadius: 0.56,
        outerRadius: CORE_ENGINE_PULSE_RADIUS,
        color: "#d7e2ff",
        life: 0.48,
        opacity: 0.78,
        spread: 0.56,
      });
    }
  } else {
    lastSpireCorePulseRing.visible = false;
    lastSpireState.enginePulseTimer = Math.max(0, lastSpireState.enginePulseTimer - dt);
    if (lastSpireState.enginePulseTimer <= 0) {
      triggerCoreEnginePulse();
    }
  }

  for (let i = 0; i < lastSpireState.finalClampCooldowns.length; i += 1) {
    lastSpireState.finalClampCooldowns[i] = Math.max(0, Number(lastSpireState.finalClampCooldowns[i]) - dt);
  }
  if (lastSpireState.coreChanneling) {
    const channel = lastSpireState.coreChanneling;
    const clamp = lastSpireState.finalClamps[channel.clampIndex];
    if (!clamp || clamp.disabled) {
      lastSpireState.coreChanneling = null;
    } else {
      const distance = Math.hypot(player.position.x - clamp.x, player.position.z - clamp.z);
      if (distance > CORE_CLAMP_INTERACT_RADIUS + 0.24 || channel.interrupted || getEffectiveMovementContext() === "combat") {
        failFinalClampChannel();
      } else {
        channel.remaining = Math.max(0, channel.remaining - dt);
        setTransientMessage(
          `Disabling Clamp ${channel.clampIndex + 1} ${Math.ceil(channel.remaining * 10) / 10}s`,
          0.24
        );
        if (channel.remaining <= 0) {
          completeFinalClampChannel(channel.clampIndex);
        }
      }
    }
  }

  const offsetX = player.position.x - lastSpireState.coreCenter.x;
  const offsetZ = player.position.z - lastSpireState.coreCenter.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > lastSpireState.coreRadius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x = lastSpireState.coreCenter.x + offsetX * inv * lastSpireState.coreRadius;
    player.position.z = lastSpireState.coreCenter.y + offsetZ * inv * lastSpireState.coreRadius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
  }

  const clampsRemaining = lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 0 : 1), 0);
  if (clampsRemaining <= 0) {
    completeLastSpireCoreSetpiece();
    return;
  }
  const aliveEnemies = combatSystem.countAliveEnemiesByIds(lastSpireState.coreEnemyIds);
  if (aliveEnemies <= 0 && lastSpireState.coreSpawnWaves < 2) {
    spawnLastSpireCoreWave();
  }
}

function getNarratorCrownArenaConfig() {
  const sceneArena = sceneManager.getBossArenaConfig?.();
  if (sceneArena?.bossId === NARRATOR_CROWN_BOSS_ID) {
    return sceneArena;
  }
  return {
    bossId: NARRATOR_CROWN_BOSS_ID,
    bounds: {
      type: "circle",
      center: { x: lastSpireState.coreCenter.x || 3.26, y: lastSpireState.coreCenter.y || -1.08 },
      radius: Math.max(2.2, Number(lastSpireState.coreRadius) || 2.7),
    },
    trigger: {
      center: { x: Number(lastSpireState.coreCenter.x) || 3.26, y: Number(lastSpireState.coreCenter.y) || -1.08 },
      radius: 1.16,
    },
    resetCooldownSeconds: 3.2,
  };
}

function spawnNarratorEchoAdd() {
  const alive = combatSystem.countAliveEnemiesByIds(lastSpireState.narratorAddIds);
  if (alive > 0) return false;
  const ids = combatSystem.spawnEnemies([
    {
      id: `narrator-echo-add-${Math.floor(world.elapsedSeconds * 1000)}`,
      role: "skirmisher",
      type: "echo_knight",
      x: lastSpireState.coreCenter.x - 1.02,
      z: lastSpireState.coreCenter.y + 0.42,
      maxHealth: 54,
      aggroRadius: 4.2,
      attackRange: 0.74,
      attackCooldown: 1.06,
      lingerTag: "narrator-echo-add",
    },
  ]);
  if (!Array.isArray(ids) || ids.length <= 0) return false;
  lastSpireState.narratorAddIds = Array.from(new Set([...lastSpireState.narratorAddIds, ...ids]));
  return true;
}

function spawnNarratorCrownEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (bossInstance.isActive()) return bossInstance.getState()?.bossId === NARRATOR_CROWN_BOSS_ID;
  if (!force && !hasEndgameSetpieceCoreReached()) return false;
  if (!force && hasEndgameFinalBossDefeated()) return false;
  const arena = getNarratorCrownArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
  });
  if (!started) return false;
  guardianCombatForced = bossInstance.isActive();
  pacingDirector.setPaused(true);
  lastSpireState.bossStarted = true;
  lastSpireState.narratorPhase = "p1";
  lastSpireState.narratorLineTimer = 1.4;
  lastSpireState.narratorLineResolveTimer = 0;
  lastSpireState.narratorLineTelegraph = null;
  lastSpireState.narratorShockwaveTimer = 4.8;
  lastSpireState.narratorShockwaveResolveTimer = 0;
  lastSpireState.narratorRewriteMarkTimer = NARRATOR_REWRITE_MARK_INTERVAL;
  lastSpireState.narratorAddTimer = 3.6;
  lastSpireState.narratorAddIds = [];
  lastSpireState.phase2CalloutDone = false;
  lastSpireState.phase3CalloutDone = false;
  narratorShockwaveRing.visible = false;
  setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, true);
  setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_FINAL_BOSS);
  refreshQuestText();
  setTransientMessage("NARRATOR CROWN: Arena lock engaged.", 1.45);
  partyChat.addLine("Narrator Crown: I will write this ending alone.", {
    channel: "lore",
    lifetimeSeconds: 8.8,
  });
  return true;
}

function maybeTriggerNarratorCrown() {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!hasEndgameSetpieceCoreReached() || hasEndgameFinalBossDefeated()) return false;
  if (bossInstance.isActive()) return false;
  const arena = getNarratorCrownArenaConfig();
  const triggerCenter = arena.trigger?.center ?? arena.bounds?.center ?? { x: 3.26, y: -1.08 };
  const triggerRadius = Math.max(0.5, Number(arena.trigger?.radius) || 1.16);
  const distance = Math.hypot(player.position.x - triggerCenter.x, player.position.z - triggerCenter.y);
  if (distance > triggerRadius) return false;
  return spawnNarratorCrownEncounter({ force: false });
}

function beginNarratorLineTelegraph(intervalSeconds = NARRATOR_LINE_INTERVAL_P1) {
  const target = {
    x: Number(player.position.x) || 0,
    z: Number(player.position.z) || 0,
  };
  lastSpireState.narratorLineTelegraph = target;
  lastSpireState.narratorLineResolveTimer = NARRATOR_LINE_TELL_SECONDS;
  lastSpireState.narratorLineTimer = Math.max(2.2, Number(intervalSeconds) || NARRATOR_LINE_INTERVAL_P1);
  vfxSystem.spawnTelegraphLine?.({
    from: new THREE.Vector2(lastSpireState.coreCenter.x, lastSpireState.coreCenter.y),
    to: new THREE.Vector2(target.x, target.z),
    color: "#e1d9ff",
    life: NARRATOR_LINE_TELL_SECONDS,
    width: 0.12,
  });
}

function resolveNarratorLineTelegraph() {
  const target = lastSpireState.narratorLineTelegraph;
  if (!target) return;
  const distance = Math.hypot(player.position.x - target.x, player.position.z - target.z);
  if (distance <= NARRATOR_LINE_RADIUS) {
    onPlayerDamaged(NARRATOR_LINE_DAMAGE, {
      source: "narration_line",
      position: new THREE.Vector2(target.x, target.z),
    });
  }
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(target.x, target.z),
    innerRadius: 0.14,
    outerRadius: NARRATOR_LINE_RADIUS,
    color: "#d8d0ff",
    life: 0.44,
    opacity: 0.78,
    spread: 0.42,
  });
  lastSpireState.narratorLineTelegraph = null;
}

function beginNarratorShockwaveTelegraph(intervalSeconds = NARRATOR_SHOCKWAVE_INTERVAL_P2) {
  lastSpireState.narratorShockwaveResolveTimer = NARRATOR_SHOCKWAVE_TELL_SECONDS;
  lastSpireState.narratorShockwaveTimer = Math.max(4.2, Number(intervalSeconds) || NARRATOR_SHOCKWAVE_INTERVAL_P2);
  narratorShockwaveRing.visible = true;
  narratorShockwaveRing.position.set(lastSpireState.coreCenter.x, -0.884, lastSpireState.coreCenter.y);
  narratorShockwaveRing.scale.set(1, 1, 1);
  narratorShockwaveRing.material.opacity = 0.16;
}

function resolveNarratorShockwaveTelegraph() {
  narratorShockwaveRing.visible = false;
  const distance = Math.hypot(
    player.position.x - lastSpireState.coreCenter.x,
    player.position.z - lastSpireState.coreCenter.y
  );
  const behindPillar = lastSpireState.coreCoverPillars.some(
    (pillar) => Math.hypot(player.position.x - pillar.x, player.position.z - pillar.z) <= CORE_ENGINE_PULSE_SAFE_RADIUS
  );
  const inDangerBand = distance >= NARRATOR_SHOCKWAVE_SAFE_INNER && distance <= NARRATOR_SHOCKWAVE_SAFE_OUTER;
  if (inDangerBand && !behindPillar) {
    onPlayerDamaged(NARRATOR_SHOCKWAVE_DAMAGE, {
      source: "rift_shockwave",
      position: new THREE.Vector2(lastSpireState.coreCenter.x, lastSpireState.coreCenter.y),
    });
  }
  vfxSystem.spawnGroundRing?.({
    position: new THREE.Vector2(lastSpireState.coreCenter.x, lastSpireState.coreCenter.y),
    innerRadius: NARRATOR_SHOCKWAVE_SAFE_INNER,
    outerRadius: NARRATOR_SHOCKWAVE_SAFE_OUTER,
    color: "#d5c5ff",
    life: 0.5,
    opacity: 0.82,
    spread: 0.68,
  });
}

function applyNarratorRewriteMark() {
  const targets = [STATUS_ENTITY_IDS.ARTHUR];
  if (hasElaineJoined() && !elaineDowned) targets.push(STATUS_ENTITY_IDS.ELAINE);
  if (hasWillowJoined()) targets.push(STATUS_ENTITY_IDS.WILLOW);
  for (const entityId of targets) {
    statusEffects.addEffect(entityId, {
      id: STATUS_EFFECT_IDS.REWRITE_MARK,
      durationSeconds: NARRATOR_REWRITE_MARK_SECONDS,
      sourceId: NARRATOR_CROWN_BOSS_ID,
    });
  }
}

function updateNarratorCrownBossMechanics(dtSeconds) {
  const state = bossInstance.getState();
  const active = Boolean(state?.active && state?.bossId === NARRATOR_CROWN_BOSS_ID);
  if (!active) {
    setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
    narratorShockwaveRing.visible = false;
    lastSpireState.narratorLineResolveTimer = 0;
    lastSpireState.narratorShockwaveResolveTimer = 0;
    lastSpireState.narratorLineTelegraph = null;
    return;
  }
  const dt = Math.max(0, Number(dtSeconds) || 0);
  setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, true);
  lastSpireState.bossStarted = true;
  const hpRatio = Number(state?.hpRatio ?? 1);
  const phase = hpRatio > 0.7 ? "p1" : hpRatio > 0.35 ? "p2" : "p3";
  if (lastSpireState.narratorPhase !== phase) {
    lastSpireState.narratorPhase = phase;
    if (phase === "p2" && !lastSpireState.phase2CalloutDone) {
      lastSpireState.phase2CalloutDone = true;
      partyChat.addLine("Elaine: Shockwave ring. Read it early and reposition.", {
        channel: "guidance",
        lifetimeSeconds: 8.2,
      });
    }
    if (phase === "p3" && !lastSpireState.phase3CalloutDone) {
      lastSpireState.phase3CalloutDone = true;
      partyChat.addLine("Willow: Rewrite Mark incoming. Keep heals tight.", {
        channel: "guidance",
        lifetimeSeconds: 8.2,
      });
    }
  }

  const lineInterval = phase === "p1" ? NARRATOR_LINE_INTERVAL_P1 : phase === "p2" ? NARRATOR_LINE_INTERVAL_P2 : NARRATOR_LINE_INTERVAL_P3;
  lastSpireState.narratorLineTimer = Math.max(0, Number(lastSpireState.narratorLineTimer) - dt);
  if (lastSpireState.narratorLineTimer <= 0 && lastSpireState.narratorLineResolveTimer <= 0) {
    beginNarratorLineTelegraph(lineInterval);
  }
  if (lastSpireState.narratorLineResolveTimer > 0) {
    lastSpireState.narratorLineResolveTimer = Math.max(0, lastSpireState.narratorLineResolveTimer - dt);
    if (lastSpireState.narratorLineResolveTimer <= 0) {
      resolveNarratorLineTelegraph();
    }
  }

  if (phase !== "p1") {
    const shockInterval = phase === "p2" ? NARRATOR_SHOCKWAVE_INTERVAL_P2 : NARRATOR_SHOCKWAVE_INTERVAL_P3;
    lastSpireState.narratorShockwaveTimer = Math.max(0, Number(lastSpireState.narratorShockwaveTimer) - dt);
    if (lastSpireState.narratorShockwaveTimer <= 0 && lastSpireState.narratorShockwaveResolveTimer <= 0) {
      beginNarratorShockwaveTelegraph(shockInterval);
    }
  } else {
    narratorShockwaveRing.visible = false;
    lastSpireState.narratorShockwaveResolveTimer = 0;
  }
  if (lastSpireState.narratorShockwaveResolveTimer > 0) {
    lastSpireState.narratorShockwaveResolveTimer = Math.max(0, lastSpireState.narratorShockwaveResolveTimer - dt);
    const ratio = lastSpireState.narratorShockwaveResolveTimer / NARRATOR_SHOCKWAVE_TELL_SECONDS;
    narratorShockwaveRing.visible = true;
    narratorShockwaveRing.material.opacity = 0.14 + (1 - ratio) * 0.32;
    narratorShockwaveRing.scale.set(1 + (1 - ratio) * 0.7, 1 + (1 - ratio) * 0.7, 1);
    if (lastSpireState.narratorShockwaveResolveTimer <= 0) {
      resolveNarratorShockwaveTelegraph();
    }
  }

  if (phase === "p1" || phase === "p2") {
    lastSpireState.narratorAddTimer = Math.max(0, Number(lastSpireState.narratorAddTimer) - dt);
    if (lastSpireState.narratorAddTimer <= 0) {
      lastSpireState.narratorAddTimer = 8.2;
      spawnNarratorEchoAdd();
    }
  } else {
    lastSpireState.narratorRewriteMarkTimer = Math.max(0, Number(lastSpireState.narratorRewriteMarkTimer) - dt);
    if (lastSpireState.narratorRewriteMarkTimer <= 0) {
      lastSpireState.narratorRewriteMarkTimer = NARRATOR_REWRITE_MARK_INTERVAL;
      applyNarratorRewriteMark();
      emitLastSpireCallout("Arthur: Mark applied. Hold tempo.");
    }
  }
}

function isNearEndingChoiceAltar() {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!hasEndgameFinalBossDefeated()) return false;
  if (hasEndgameChoiceMade()) return false;
  const config = getLastSpireConfig();
  const altar = config.choiceAltar ?? { x: 4.04, y: -1.76, interactRadius: 1.12 };
  const distance = Math.hypot(player.position.x - (Number(altar.x) || 4.04), player.position.z - (Number(altar.y) || -1.76));
  return distance <= Math.max(0.6, Number(altar.interactRadius) || 1.12);
}

function tryOpenEndingChoiceAltar({ showToast = true } = {}) {
  if (currentSceneInfo.sceneId !== "last_spire") return false;
  if (!hasEndgameFinalBossDefeated()) return false;
  if (hasEndgameChoiceMade()) {
    if (showToast) setTransientMessage("The verdict is already sealed.", 0.9);
    return false;
  }
  if (!isNearEndingChoiceAltar()) {
    if (showToast) setTransientMessage("Move closer to the choice altar.", 0.9);
    return false;
  }
  if (!endingChoicePanel.isOpen()) {
    endingChoicePanel.open({ defaultChoice: ENDGAME_ENDING_SEAL });
  }
  setCurrentObjectiveId(OBJECTIVE_IDS.CHOOSE_ENDING);
  refreshQuestText();
  return true;
}

function beginCreditsRoll(payload = {}) {
  setCurrentObjectiveId(OBJECTIVE_IDS.CREDITS);
  refreshQuestText();
  creditsOverlay.open(
    {
      lines: payload.credits ?? [],
      epilogues: payload.epilogues ?? [],
      ngPlusHook: payload.ngPlusHook ?? "",
    },
    {
      onDone: () => {
        setEndgameCreditsSeen(true);
        setNgPlusUnlocked(true);
        setCurrentObjectiveId(OBJECTIVE_IDS.CREDITS);
        refreshQuestText();
        setTransientMessage("New Game+ unlocked.", 1.8);
        if (!sceneManager.isTransitioning()) {
          sceneManager.requestTransition("title", { flow: "act3-credits-complete" });
        }
      },
    }
  );
}

function applyEndgameEndingChoice(choice = ENDGAME_ENDING_SEAL) {
  const normalized = String(choice ?? "")
    .trim()
    .toLowerCase();
  if (normalized !== ENDGAME_ENDING_SEAL && normalized !== ENDGAME_ENDING_REWRITE) return false;
  if (!hasEndgameFinalBossDefeated()) return false;
  if (hasEndgameChoiceMade()) return false;
  endingChoicePanel.close();
  const payload =
    normalized === ENDGAME_ENDING_REWRITE
      ? playEndingRewrite({
          chapter9Choice: getChapter9Choice(),
          crownTier: crownMood.getTierLabel(),
          convergenceChoice: getChapter7ConvergenceChoice(),
          harvesterChoice: getHarvesterChoice(),
        })
      : playEndingSeal({
          chapter9Choice: getChapter9Choice(),
          crownTier: crownMood.getTierLabel(),
          convergenceChoice: getChapter7ConvergenceChoice(),
          harvesterChoice: getHarvesterChoice(),
        });
  setEndgameChoiceMade(true);
  setEndgameEnding(normalized);
  setCurrentObjectiveId(OBJECTIVE_IDS.CREDITS);
  refreshQuestText();
  openNpcDialogue({
    npcId: "ending_verdict",
    npcName: payload?.title ?? "Ending",
    script: Array.isArray(payload?.lines) ? payload.lines : [],
    onComplete: () => {
      beginCreditsRoll(payload ?? {});
    },
  });
  return true;
}

function updateChapter9Sunder(dtSeconds) {
  if (!chapter9SetpieceState.sunderActive) return;
  if (currentSceneInfo.sceneId !== "region4_seed") {
    chapter9SetpieceState.sunderActive = false;
    chapter9SetpieceState.sunderMeter = 0;
    chapter9SunderWaveRing.visible = false;
    return;
  }
  const dt = Math.max(0, Number(dtSeconds) || 0);
  if (chapter9SetpieceState.shortCalloutCooldown > 0) {
    chapter9SetpieceState.shortCalloutCooldown = Math.max(0, chapter9SetpieceState.shortCalloutCooldown - dt);
  }
  if (chapter9SetpieceState.waveFxSeconds > 0) {
    chapter9SetpieceState.waveFxSeconds = Math.max(0, chapter9SetpieceState.waveFxSeconds - dt);
    const t = chapter9SetpieceState.waveFxSeconds / 0.56;
    const grow = 1 + (1 - t) * Math.max(1.4, chapter9SetpieceState.radius);
    chapter9SunderWaveRing.visible = true;
    chapter9SunderWaveRing.scale.set(grow, grow, 1);
    chapter9SunderWaveRing.material.opacity = 0.45 * t;
    cameraShakeOffset.x += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.55;
    cameraShakeOffset.z += (nextFloat() - 0.5) * CAMERA_WAVE_SHAKE_WORLD_MAX * 1.55;
  } else {
    chapter9SunderWaveRing.visible = false;
  }
  chapter9SetpieceState.sunderFillSlowRemaining = Math.max(0, chapter9SetpieceState.sunderFillSlowRemaining - dt);
  const bossActive = bossInstance.isActive() && bossInstance.getState()?.bossId === NULL_ARCHIVIST_BOSS_ID;
  let fillRate = chapter9SetpieceState.sunderFillRate;
  if (bossActive) fillRate *= CHAPTER9_SUNDER_FILL_BOSS_MULTIPLIER;
  if (chapter9SetpieceState.sunderFillSlowRemaining > 0) fillRate *= CHAPTER9_ANCHOR_FILL_SLOW_MULTIPLIER;
  if (bossActive && chapter9SetpieceState.echoNodes.some((node) => node?.alive)) fillRate *= 1.45;
  chapter9SetpieceState.sunderMeter = Math.max(0, Math.min(1.2, chapter9SetpieceState.sunderMeter + fillRate * dt));
  if (chapter9SetpieceState.sunderMeter >= 1) triggerChapter9SunderWave();
  if (!hasChapter9AnchorsAttuned() && chapter9SetpieceState.sunderWaves >= CHAPTER9_FAIL_WAVE_LIMIT) {
    resetChapter9SetpieceAtCheckpoint();
  }
}

function updateChapter9AnchorSetpiece(dtSeconds) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  for (let i = 0; i < chapter9SetpieceState.anchorCooldowns.length; i += 1) {
    chapter9SetpieceState.anchorCooldowns[i] = Math.max(0, chapter9SetpieceState.anchorCooldowns[i] - dt);
  }
  if (!chapter9SetpieceState.active || hasChapter9AnchorsAttuned()) return;
  if (currentSceneInfo.sceneId !== "region4_seed") return;

  for (let i = 0; i < chapter9SetpieceState.spires.length; i += 1) {
    const spire = chapter9SetpieceState.spires[i];
    spire.pulseTimer = Math.max(0, Number(spire.pulseTimer) - dt);
    if (spire.pulseTimer > 0) continue;
    spire.pulseTimer = 2.8 + i * 0.35;
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(spire.x, spire.z),
      innerRadius: 0.22,
      outerRadius: 0.58,
      color: "#b9cfff",
      life: 0.4,
      opacity: 0.72,
      spread: 0.34,
    });
    if (Math.hypot(player.position.x - spire.x, player.position.z - spire.z) <= 0.72) {
      onPlayerDamaged(7, {
        source: "null_spire",
        position: new THREE.Vector2(spire.x, spire.z),
      });
      if (chapter9SetpieceState.channeling) chapter9SetpieceState.channeling.interrupted = true;
    }
  }

  const channel = chapter9SetpieceState.channeling;
  if (!channel) return;
  const anchor = chapter9SetpieceState.anchors[channel.anchorIndex];
  if (!anchor || anchor.attuned) {
    chapter9SetpieceState.channeling = null;
    return;
  }
  const distance = Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z);
  if (distance > CHAPTER9_ANCHOR_INTERACT_RADIUS + 0.24 || channel.interrupted) {
    failChapter9AnchorAttunement();
    return;
  }
  channel.remaining = Math.max(0, channel.remaining - dt);
  setTransientMessage(`Attuning Anchor ${channel.anchorIndex + 1} ${Math.ceil(channel.remaining * 10) / 10}s`, 0.25);
  if (channel.remaining <= 0) completeChapter9AnchorAttunement(channel.anchorIndex);
}

function updateChapter9BossMechanics(dtSeconds) {
  const state = bossInstance.getState();
  const bossActive = Boolean(state?.active && state?.bossId === NULL_ARCHIVIST_BOSS_ID);
  if (!bossActive) {
    clearChapter9EchoNodes();
    clearChapter9NullFields();
    chapter9MemoryCollapseRing.visible = false;
    chapter9SetpieceState.memoryCollapseResolveTimer = 0;
    return;
  }

  const dt = Math.max(0, Number(dtSeconds) || 0);
  const hpRatio = Number(state?.hpRatio ?? 1);
  const phase = hpRatio > 0.66 ? "p1" : hpRatio > 0.33 ? "p2" : "p3";
  if (phase === "p1" && chapter9SetpieceState.echoNodes.length === 0) {
    spawnChapter9EchoNodes(1);
  } else if (phase === "p2" && chapter9SetpieceState.echoNodes.length < 2) {
    spawnChapter9EchoNodes(2);
  } else if (phase === "p3" && chapter9SetpieceState.echoNodes.length > 0) {
    clearChapter9EchoNodes();
  }

  chapter9SetpieceState.erasePulseTimer = Math.max(0, chapter9SetpieceState.erasePulseTimer - dt);
  if (chapter9SetpieceState.erasePulseTimer <= 0) {
    chapter9SetpieceState.erasePulseTimer = phase === "p1" ? 8.2 : phase === "p2" ? 6.8 : 7.2;
    const liveNodes = chapter9SetpieceState.echoNodes.filter((node) => node?.alive);
    if (liveNodes.length > 0) {
      onPlayerDamaged(19, {
        source: "erase_pulse",
        position: new THREE.Vector2(chapter9SetpieceState.center.x, chapter9SetpieceState.center.y),
      });
      chapter9SetpieceState.sunderMeter = Math.min(1, chapter9SetpieceState.sunderMeter + 0.24);
      emitChapter9Callout("Arthur: Echo Nodes up. Break them!");
    }
  }

  if (phase === "p3") {
    if (chapter9SetpieceState.nullFields.length === 0) {
      spawnChapter9NullFields();
    }
    for (let i = 0; i < chapter9SetpieceState.nullFields.length; i += 1) {
      const field = chapter9SetpieceState.nullFields[i];
      field.angle += dt * (0.56 + i * 0.16);
      field.ring.position.x = chapter9SetpieceState.center.x + Math.cos(field.angle) * field.orbitalRadius;
      field.ring.position.z = chapter9SetpieceState.center.y + Math.sin(field.angle) * field.orbitalRadius;
      field.ring.material.opacity = 0.2 + (0.5 + Math.sin(world.elapsedSeconds * 3.4 + i) * 0.5) * 0.16;
    }

    const partyTargets = [STATUS_ENTITY_IDS.ARTHUR];
    if (hasElaineJoined() && !elaineDowned) partyTargets.push(STATUS_ENTITY_IDS.ELAINE);
    if (hasWillowJoined()) partyTargets.push(STATUS_ENTITY_IDS.WILLOW);
    for (const entityId of partyTargets) {
      const position = getPartyEntityRuntimePosition(entityId);
      if (!position) continue;
      for (const field of chapter9SetpieceState.nullFields) {
        const dx = position.x - field.ring.position.x;
        const dz = position.z - field.ring.position.z;
        if (Math.hypot(dx, dz) <= field.radius) {
          statusEffects.addEffect(entityId, {
            id: STATUS_EFFECT_IDS.NULL_SILENCE,
            durationSeconds: 6,
            sourceId: NULL_ARCHIVIST_BOSS_ID,
          });
          break;
        }
      }
    }

    chapter9SetpieceState.memoryCollapseTimer = Math.max(0, chapter9SetpieceState.memoryCollapseTimer - dt);
    if (chapter9SetpieceState.memoryCollapseTimer <= 0 && chapter9SetpieceState.memoryCollapseResolveTimer <= 0) {
      chapter9SetpieceState.memoryCollapseTimer = 9.4;
      chapter9SetpieceState.memoryCollapseResolveTimer = 1.25;
      chapter9MemoryCollapseRing.visible = true;
      chapter9MemoryCollapseRing.position.set(chapter9SetpieceState.center.x, -0.884, chapter9SetpieceState.center.y);
      chapter9MemoryCollapseRing.scale.set(1, 1, 1);
      emitChapter9Callout("Elaine: Memory Collapse! Anchor light or out!");
    }
    if (chapter9SetpieceState.memoryCollapseResolveTimer > 0) {
      chapter9SetpieceState.memoryCollapseResolveTimer = Math.max(0, chapter9SetpieceState.memoryCollapseResolveTimer - dt);
      const telegraph = chapter9SetpieceState.memoryCollapseResolveTimer / 1.25;
      chapter9MemoryCollapseRing.visible = true;
      chapter9MemoryCollapseRing.material.opacity = 0.1 + (1 - telegraph) * 0.42;
      chapter9MemoryCollapseRing.scale.set(1 + (1 - telegraph) * 0.8, 1 + (1 - telegraph) * 0.8, 1);
      if (chapter9SetpieceState.memoryCollapseResolveTimer <= 0) {
        chapter9MemoryCollapseRing.visible = false;
        const distToCenter = Math.hypot(
          player.position.x - chapter9SetpieceState.center.x,
          player.position.z - chapter9SetpieceState.center.y
        );
        const nearAttunedAnchor = chapter9SetpieceState.anchors.some(
          (anchor) =>
            anchor?.attuned &&
            Math.hypot(player.position.x - anchor.x, player.position.z - anchor.z) <= CHAPTER9_ANCHOR_INTERACT_RADIUS
        );
        if (distToCenter <= CHAPTER9_MEMORY_COLLAPSE_RADIUS && !nearAttunedAnchor) {
          onPlayerDamaged(CHAPTER9_MEMORY_COLLAPSE_DAMAGE, {
            source: "memory_collapse",
            position: new THREE.Vector2(chapter9SetpieceState.center.x, chapter9SetpieceState.center.y),
          });
        }
      }
    }
  } else {
    clearChapter9NullFields();
    chapter9MemoryCollapseRing.visible = false;
    chapter9SetpieceState.memoryCollapseResolveTimer = 0;
  }

  for (let i = 0; i < chapter9SetpieceState.echoNodes.length; i += 1) {
    const node = chapter9SetpieceState.echoNodes[i];
    if (!node?.alive) continue;
    const pulse = 0.5 + Math.sin(world.elapsedSeconds * 5.1 + i * 0.84) * 0.5;
    node.mesh.position.y = -0.64 + pulse * 0.05;
    node.mesh.material.opacity = 0.72 + pulse * 0.2;
    node.ring.material.opacity = 0.14 + pulse * 0.22;
  }
}

function updateChapter9Setpiece(dtSeconds) {
  if (currentSceneInfo.sceneId !== "region4_seed") return;
  if (!hasChapter9Started() && !chapter9StartPending) return;
  chapter9SetpieceState.active = !hasChapter9NullArchivistDefeated();
  updateChapter9AnchorSetpiece(dtSeconds);
  updateChapter9Sunder(dtSeconds);
  updateChapter9BossMechanics(dtSeconds);
  if (!hasChapter9AnchorsAttuned()) return;
  maybeTriggerNullArchivist();
}

function startRidgePatrolSetpiece() {
  if (ridgePatrolSetpieceState.active) return false;
  if (!hasChapter5AftershockDone()) return false;
  if (hasVaelorisPatrolSetpieceDone()) return false;
  if (!Array.isArray(vaelorisPatrolFrame.enemyIds) || vaelorisPatrolFrame.enemyIds.length <= 0) return false;
  const zone = vaelorisPatrolFrame.zone ?? {};
  const centerX = Number(zone.centerX);
  const centerZ = Number(zone.centerY);
  if (!Number.isFinite(centerX) || !Number.isFinite(centerZ)) return false;
  const radius = Math.max(
    1.6,
    Math.hypot(Number(zone.halfWidth) || 1, Number(zone.halfHeight) || 1) + 0.62
  );
  ridgePatrolSetpieceState.active = true;
  ridgePatrolSetpieceState.center.set(centerX, centerZ);
  ridgePatrolSetpieceState.radius = radius;
  ridgePatrolSetpieceState.enemyIds = [...vaelorisPatrolFrame.enemyIds];
  ridgePatrolSetpieceState.boundsToastCooldown = 0;
  ridgePatrolRing.visible = true;
  ridgePatrolRing.position.set(centerX, -0.884, centerZ);
  ridgePatrolRing.scale.set(radius, radius, 1);
  setTransientMessage("A metal hush pins you in.", 1.45);
  markMapDirty();
  return true;
}

function completeRidgePatrolSetpiece() {
  if (!ridgePatrolSetpieceState.active) return false;
  clearRidgePatrolSetpieceState();
  setVaelorisPatrolSetpieceDone(true);
  setVaelorisPatrolClearedOnce(true);
  setVaelorisTagObtained(true);
  setTransientMessage("The ridge road breathes again.", 1.45);
  setCurrentObjectiveId(OBJECTIVE_IDS.CROSS_RIDGE_GATE);
  refreshQuestText();
  markMapDirty();
  return true;
}

function updateRidgePatrolSetpiece(dtSeconds) {
  ridgePatrolSetpieceState.boundsToastCooldown = Math.max(
    0,
    ridgePatrolSetpieceState.boundsToastCooldown - Math.max(0, Number(dtSeconds) || 0)
  );
  if (!ridgePatrolSetpieceState.active) {
    ridgePatrolRing.visible = false;
    return;
  }
  if (currentSceneInfo.sceneId !== "thornmere") {
    clearRidgePatrolSetpieceState();
    return;
  }

  ridgePatrolRing.visible = true;
  ridgePatrolRing.position.set(ridgePatrolSetpieceState.center.x, -0.884, ridgePatrolSetpieceState.center.y);
  ridgePatrolRing.scale.set(ridgePatrolSetpieceState.radius, ridgePatrolSetpieceState.radius, 1);
  ridgePatrolRing.material.opacity =
    0.14 + (0.5 + Math.sin(world.elapsedSeconds * 4 + ridgePatrolSetpieceState.center.x * 0.31) * 0.5) * 0.14;

  const offsetX = player.position.x - ridgePatrolSetpieceState.center.x;
  const offsetZ = player.position.z - ridgePatrolSetpieceState.center.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > ridgePatrolSetpieceState.radius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x = ridgePatrolSetpieceState.center.x + offsetX * inv * ridgePatrolSetpieceState.radius;
    player.position.z = ridgePatrolSetpieceState.center.y + offsetZ * inv * ridgePatrolSetpieceState.radius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    if (ridgePatrolSetpieceState.boundsToastCooldown <= 0) {
      setTransientMessage(RIDGE_SCOUTS_BLOCK_MESSAGE, RIDGE_PATROL_BOUNDS_TOAST_SECONDS);
      ridgePatrolSetpieceState.boundsToastCooldown = RIDGE_PATROL_BOUNDS_COOLDOWN_SECONDS;
    }
  }

  const alive = combatSystem.countAliveEnemiesByIds(ridgePatrolSetpieceState.enemyIds);
  if (alive <= 0) {
    completeRidgePatrolSetpiece();
  }
}

function completeWillowAmbushSetpiece({ force = false } = {}) {
  if (!force && !willowAmbushState.active) return false;
  clearWillowAmbushState();
  setTransientMessage("The ash settles.", 1.5);
  setWillowJoined(true, { showToast: true });
  if (getHarvesterChoice() === HARVESTER_CHOICE_VALUES.NONE) {
    setCurrentObjectiveId(OBJECTIVE_IDS.RETURN_TO_ROWAN);
  }
  refreshQuestText();
  markMapDirty();
  return true;
}

function startWillowAmbushSetpiece({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "emberfall") return false;
  if (!force) {
    if (willowAmbushState.active) return false;
    if (!hasWillowMet() || hasWillowJoined()) return false;
  }

  const config = getWillowEncounterConfig();
  if (!config?.center) return false;
  const centerX = Number(config.center.x) || 0;
  const centerZ = Number(config.center.y) || 0;
  const radius = Math.max(1.8, Number(config.ambushRadius) || 2.45);

  const enemyIds = combatSystem.spawnEnemies([
    {
      id: "chapter2-ambush-construct-a",
      role: "construct",
      type: "standard",
      x: centerX + 0.96,
      z: centerZ + 0.32,
      maxHealth: 44,
      aggroRadius: 3.6,
      attackRange: 1.04,
      attackCooldown: 1.7,
      lingerTag: "chapter2-ambush",
    },
    {
      id: "chapter2-ambush-striker-a",
      role: "striker",
      type: "ambush",
      x: centerX - 0.9,
      z: centerZ - 0.48,
      maxHealth: 38,
      aggroRadius: 3.9,
      attackRange: 0.72,
      attackCooldown: 1.02,
      lingerTag: "chapter2-ambush",
    },
    {
      id: "chapter2-ambush-hexer-a",
      role: "hexer",
      type: "standard",
      x: centerX + 0.2,
      z: centerZ - 1.12,
      maxHealth: 42,
      aggroRadius: 3.8,
      attackRange: 1.04,
      attackCooldown: 1.85,
      lingerTag: "chapter2-ambush",
    },
  ]);

  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) {
    return false;
  }

  willowAmbushState.active = true;
  willowAmbushState.center.set(centerX, centerZ);
  willowAmbushState.radius = radius;
  willowAmbushState.enemyIds = [...enemyIds];
  willowAmbushState.boundsToastCooldown = 0;
  willowAmbushRing.visible = true;
  willowAmbushRing.position.set(centerX, -0.884, centerZ);
  willowAmbushRing.scale.set(radius, radius, 1);
  setTransientMessage("Vaeloris scouts close in.", 1.45);
  setCurrentObjectiveId(OBJECTIVE_IDS.SURVIVE_AMBUSH);
  refreshQuestText();
  markMapDirty();
  return true;
}

function queueChapter2ArrivalBeat() {
  if (chapter2ArrivalPending) return false;
  if (currentSceneInfo.sceneId !== "emberfall") return false;
  if (dialogueBox.isOpen()) return false;
  if (sceneManager.hasBlockingUiScene()) return false;
  if (!hasChapter2Started()) return false;
  if (hasChapter2ArrivedEmberfall()) return false;

  setChapter2ArrivedEmberfall(true);
  setCurrentObjectiveId(OBJECTIVE_IDS.FIND_WILLOW);
  refreshQuestText();
  controlLockRemaining = Math.max(controlLockRemaining, CHAPTER2_ARRIVAL_LOCK_SECONDS);
  chapter2ArrivalPending = {
    lockRemaining: CHAPTER2_ARRIVAL_LOCK_SECONDS,
    lines: [...CHAPTER2_ARRIVAL_LINES],
  };
  introTextBeat.start(CHAPTER2_ARRIVAL_TITLE, {
    fadeIn: 0.2,
    hold: 0.4,
    fadeOut: 0.35,
  });
  return true;
}

function updateChapter2ArrivalSequence(dtSeconds) {
  if (!chapter2ArrivalPending) return;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  chapter2ArrivalPending.lockRemaining = Math.max(0, chapter2ArrivalPending.lockRemaining - dt);
  if (chapter2ArrivalPending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;
  if (introTextBeat.isActive()) return;

  const script = Array.isArray(chapter2ArrivalPending.lines) ? chapter2ArrivalPending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "chapter2_arrival",
      npcName: "Ashwind Trail",
      script,
    });
  }
  chapter2ArrivalPending = null;
}

function queueWillowMeet(outcome) {
  if (!outcome?.triggered) return false;
  const lockSeconds = Math.max(0, Number(outcome.lockSeconds) || CHAPTER2_WILLOW_MEET_LOCK_SECONDS);
  controlLockRemaining = Math.max(controlLockRemaining, lockSeconds);
  willowMeetPending = {
    lockRemaining: lockSeconds,
    lines: Array.isArray(outcome.lines) ? [...outcome.lines] : [],
    objectiveId: outcome.objectiveId ?? OBJECTIVE_IDS.SURVIVE_AMBUSH,
    setFlags: outcome.setFlags && typeof outcome.setFlags === "object" ? { ...outcome.setFlags } : {},
  };
  return true;
}

function tryTriggerWillowMeetEvent({ force = false } = {}) {
  if (!force) {
    if (willowMeetPending || willowAmbushState.active) return false;
    if (sceneManager.isTransitioning()) return false;
    if (dialogueBox.isOpen()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen() || listeningSpikeChoicePanel.isOpen()) return false;
  }
  const config = getWillowEncounterConfig();
  const inTriggerZone = Boolean(
    config &&
      Math.hypot(player.position.x - (config.center?.x ?? 0), player.position.z - (config.center?.y ?? 0)) <=
        Math.max(0.55, Number(config?.triggerRadius) || 1.05)
  );
  const outcome = tryTriggerWillowMeet({
    currentSceneId: currentSceneInfo.sceneId,
    chapter2ArrivedEmberfall: hasChapter2ArrivedEmberfall(),
    willowMet: hasWillowMet(),
    willowJoined: hasWillowJoined(),
    inTriggerZone,
    force,
  });
  if (!outcome?.triggered) return false;
  return queueWillowMeet(outcome);
}

function updateWillowMeetSequence(dtSeconds) {
  if (!willowMeetPending) return;
  const pending = willowMeetPending;
  const dt = Math.max(0, Number(dtSeconds) || 0);
  pending.lockRemaining = Math.max(0, pending.lockRemaining - dt);
  if (pending.lockRemaining > 0) return;
  if (sceneManager.isTransitioning()) return;
  if (sceneManager.hasBlockingUiScene()) return;
  if (dialogueBox.isOpen()) return;

  const script = Array.isArray(pending.lines) ? pending.lines : [];
  if (script.length > 0) {
    openNpcDialogue({
      npcId: "willow",
      npcName: "Willow",
      script,
      onComplete: () => {
        if (pending.setFlags) {
          for (const [key, value] of Object.entries(pending.setFlags)) {
            setStoryFlag(key, value);
          }
        }
        setCurrentObjectiveId(pending.objectiveId ?? OBJECTIVE_IDS.SURVIVE_AMBUSH);
        refreshQuestText();
        startWillowAmbushSetpiece();
      },
    });
  }
  willowMeetPending = null;
}

function updateWillowAmbushSetpiece(dtSeconds) {
  willowAmbushState.boundsToastCooldown = Math.max(
    0,
    willowAmbushState.boundsToastCooldown - Math.max(0, Number(dtSeconds) || 0)
  );
  if (!willowAmbushState.active) {
    willowAmbushRing.visible = false;
    return;
  }
  if (currentSceneInfo.sceneId !== "emberfall") {
    clearWillowAmbushState();
    return;
  }

  willowAmbushRing.visible = true;
  willowAmbushRing.position.set(willowAmbushState.center.x, -0.884, willowAmbushState.center.y);
  willowAmbushRing.scale.set(willowAmbushState.radius, willowAmbushState.radius, 1);
  willowAmbushRing.material.opacity =
    0.16 + (0.5 + Math.sin(world.elapsedSeconds * 4.1 + willowAmbushState.center.x * 0.33) * 0.5) * 0.16;

  const offsetX = player.position.x - willowAmbushState.center.x;
  const offsetZ = player.position.z - willowAmbushState.center.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > willowAmbushState.radius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x = willowAmbushState.center.x + offsetX * inv * willowAmbushState.radius;
    player.position.z = willowAmbushState.center.y + offsetZ * inv * willowAmbushState.radius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    if (willowAmbushState.boundsToastCooldown <= 0) {
      setTransientMessage("The scouts box you into the clearing.", CHAPTER2_AMBUSH_BOUNDS_TOAST_SECONDS);
      willowAmbushState.boundsToastCooldown = CHAPTER2_AMBUSH_BOUNDS_COOLDOWN_SECONDS;
    }
  }

  const alive = combatSystem.countAliveEnemiesByIds(willowAmbushState.enemyIds);
  if (alive <= 0) {
    completeWillowAmbushSetpiece();
  }
}

function startListeningSpikeSetpiece({ force = false } = {}) {
  if (!force) {
    if (sceneManager.isTransitioning()) return false;
    if (sceneManager.hasBlockingUiScene()) return false;
    if (dialogueBox.isOpen()) return false;
    if (listeningSpikeChoicePanel.isOpen() || vaelorisChoicePanel.isOpen() || harvesterChoicePanel.isOpen()) return false;
  }
  const config = getListeningSpikeSiteConfig();
  if (!config?.center) return false;
  const triggerRadius = Math.max(0.55, Number(config.triggerRadius) || 1.05);
  const inTriggerZone =
    Math.hypot(player.position.x - (config.center?.x ?? 0), player.position.z - (config.center?.y ?? 0)) <=
    triggerRadius;
  const outcome = tryStartListeningSpikeSetpiece({
    currentSceneId: currentSceneInfo.sceneId,
    leadUnlocked: hasListeningSpikeLeadUnlocked(),
    siteCleared: hasListeningSpikeSiteCleared(),
    choice: getListeningSpikeChoice(),
    active: listeningSpikeSetpieceState.active,
    inTriggerZone,
    center: config.center,
    radius: config.arenaRadius,
    force,
  });
  if (!outcome?.triggered) return false;

  const enemyIds = combatSystem.spawnEnemies(
    (outcome.enemySpawns ?? []).map((entry) => ({
      id: entry.id,
      role: entry.role,
      type: entry.type,
      x: entry.x,
      z: entry.z,
      maxHealth: entry.maxHealth,
      aggroRadius: entry.aggroRadius,
      attackRange: entry.attackRange,
      attackCooldown: entry.attackCooldown,
      lingerTag: entry.lingerTag,
    }))
  );
  if (!Array.isArray(enemyIds) || enemyIds.length <= 0) {
    return false;
  }

  listeningSpikeSetpieceState.active = true;
  listeningSpikeSetpieceState.center.set(outcome.center.x, outcome.center.y);
  listeningSpikeSetpieceState.radius = Math.max(1.8, Number(outcome.radius) || 2.3);
  listeningSpikeSetpieceState.enemyIds = [...enemyIds];
  listeningSpikeSetpieceState.boundsToastCooldown = 0;
  listeningSpikeRing.visible = true;
  listeningSpikeRing.position.set(outcome.center.x, -0.884, outcome.center.y);
  listeningSpikeRing.scale.set(listeningSpikeSetpieceState.radius, listeningSpikeSetpieceState.radius, 1);
  setTransientMessage("Vaeloris scouts defend the Listening Spike.", 1.45);
  setCurrentObjectiveId(outcome.objectiveId ?? OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE);
  refreshQuestText();
  markMapDirty();
  return true;
}

function completeListeningSpikeSetpiece({ force = false } = {}) {
  if (!force && !listeningSpikeSetpieceState.active) return false;
  clearListeningSpikeSetpieceState();
  setListeningSpikeSiteCleared(true);
  setTransientMessage("The Spike buckles. Decide what to do with the core.", 1.5);
  setCurrentObjectiveId(OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE);
  refreshQuestText();
  markMapDirty();
  return true;
}

function updateListeningSpikeSetpiece(dtSeconds) {
  listeningSpikeSetpieceState.boundsToastCooldown = Math.max(
    0,
    listeningSpikeSetpieceState.boundsToastCooldown - Math.max(0, Number(dtSeconds) || 0)
  );
  if (!listeningSpikeSetpieceState.active) {
    listeningSpikeRing.visible = false;
    return;
  }
  if (currentSceneInfo.sceneId !== "emberfall") {
    clearListeningSpikeSetpieceState();
    return;
  }

  listeningSpikeRing.visible = true;
  listeningSpikeRing.position.set(listeningSpikeSetpieceState.center.x, -0.884, listeningSpikeSetpieceState.center.y);
  listeningSpikeRing.scale.set(listeningSpikeSetpieceState.radius, listeningSpikeSetpieceState.radius, 1);
  listeningSpikeRing.material.opacity =
    0.16 + (0.5 + Math.sin(world.elapsedSeconds * 4.2 + listeningSpikeSetpieceState.center.x * 0.29) * 0.5) * 0.16;

  const offsetX = player.position.x - listeningSpikeSetpieceState.center.x;
  const offsetZ = player.position.z - listeningSpikeSetpieceState.center.y;
  const distance = Math.hypot(offsetX, offsetZ);
  if (distance > listeningSpikeSetpieceState.radius) {
    const inv = distance > 0.0001 ? 1 / distance : 0;
    player.position.x = listeningSpikeSetpieceState.center.x + offsetX * inv * listeningSpikeSetpieceState.radius;
    player.position.z = listeningSpikeSetpieceState.center.y + offsetZ * inv * listeningSpikeSetpieceState.radius;
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    if (listeningSpikeSetpieceState.boundsToastCooldown <= 0) {
      setTransientMessage("Something pins you inside the hum.", LISTENING_SPIKE_BOUNDS_TOAST_SECONDS);
      listeningSpikeSetpieceState.boundsToastCooldown = LISTENING_SPIKE_BOUNDS_COOLDOWN_SECONDS;
    }
  }

  const alive = combatSystem.countAliveEnemiesByIds(listeningSpikeSetpieceState.enemyIds);
  if (alive <= 0) {
    completeListeningSpikeSetpiece();
  }
}

function isNearListeningSpikeInteraction() {
  if (currentSceneInfo.sceneId !== "emberfall") return false;
  if (!hasListeningSpikeLeadUnlocked()) return false;
  if (!hasListeningSpikeSiteCleared()) return false;
  if (getListeningSpikeChoice() !== LISTENING_SPIKE_CHOICE_VALUES.NONE) return false;
  const config = getListeningSpikeSiteConfig();
  if (!config?.center) return false;
  const interactRadius = Math.max(0.7, Number(config.interactRadius) || 1.02);
  const distance = Math.hypot(player.position.x - config.center.x, player.position.z - config.center.y);
  return distance <= interactRadius;
}

function tryOpenListeningSpikeChoicePanel() {
  if (!isNearListeningSpikeInteraction()) return false;
  if (listeningSpikeChoicePanel.isOpen()) return true;
  listeningSpikeChoicePanel.open();
  return true;
}

function applyListeningSpikeChoice(choice, { force = false } = {}) {
  const outcome = resolveListeningSpikeChoiceOutcome(choice, getVaelorisPressureStage());
  if (!outcome.applied) return false;
  if (!force) {
    if (!listeningSpikeChoicePanel.isOpen() && !isNearListeningSpikeInteraction()) {
      return false;
    }
  }

  setListeningSpikeSiteCleared(true);
  listeningSpikeChoice = setListeningSpikeChoice(outcome.choice);
  listeningSpikeChoicePanel.close();
  clearListeningSpikeSetpieceState();

  if (outcome.choice === LISTENING_SPIKE_CHOICE_VALUES.CRUSH) {
    adjustCrownMood(CROWN_MOOD_LISTENING_SPIKE_CRUSH_DELTA, "listening_spike_crushed");
  } else if (outcome.choice === LISTENING_SPIKE_CHOICE_VALUES.POCKET) {
    adjustCrownMood(CROWN_MOOD_LISTENING_SPIKE_POCKET_DELTA, "listening_spike_pocketed");
    vaelorisPressureStage = setVaelorisPressureStage(outcome.pressureStage);
  }
  applyVaelorisWorldModifiers();
  setCurrentObjectiveId(OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN);
  refreshQuestText();
  if (outcome.toast) {
    setTransientMessage(outcome.toast, 1.6);
  }
  markMapDirty();
  return true;
}

function updateVaelorisPatrolPressure(dtSeconds, { allowSpawn = true } = {}) {
  const chapter5PatrolObjectiveActive =
    hasChapter5AftershockDone() &&
    !hasVaelorisPatrolSetpieceDone() &&
    resolveStoryObjectiveState().id === OBJECTIVE_IDS.CLEAR_RIDGE_PATROL;
  const allowAutoSpawn = allowSpawn && (chapter5PatrolObjectiveActive || hasAct2FalloutDone());
  vaelorisPatrolFrame = vaelorisPressureSystem.update(dtSeconds, {
    sceneId: currentSceneInfo.sceneId,
    playerPosition: player.position,
    allowSpawn: allowAutoSpawn,
    combatSystem,
    pressureStage: vaelorisPressureStage,
    harvesterChoice: getHarvesterChoice(),
    patrolClearedOnce: hasVaelorisPatrolClearedOnce(),
    tagObtained: hasVaelorisTagObtained(),
  });

  if (vaelorisPatrolFrame.firstCleared) {
    setVaelorisPatrolClearedOnce(true);
  }
  if (vaelorisPatrolFrame.tagAwarded) {
    setVaelorisTagObtained(true);
    setTransientMessage("Recovered a Vaeloris tag.", 1.3);
  }
  if (vaelorisPatrolFrame.spawned) {
    const stageLabel = vaelorisPatrolFrame.stage >= 2 ? "heavy" : "scout";
    setTransientMessage(`A ${stageLabel} Vaeloris patrol moves on the ridge trail.`, VAELORIS_PATROL_COOLDOWN_TOAST_SECONDS);
    if (chapter5PatrolObjectiveActive) {
      startRidgePatrolSetpiece();
    }
    markMapDirty();
  }
}

function adjustCrownMood(amount, reason) {
  crownMood.setElapsedSeconds(world.elapsedSeconds);
  const nextMood = crownMood.adjustMood(amount, reason);
  saveState.setCrownMoodScore?.(nextMood);
  const nextTierLabel = crownMood.getTierLabel();
  if (nextTierLabel !== crownOmenTierLabel) {
    crownOmenTierLabel = nextTierLabel;
    crownOmenFlashRemaining = 0.38;
  }
  return nextMood;
}

function setCrownMood(value, reason = "manual") {
  crownMood.setElapsedSeconds(world.elapsedSeconds);
  const nextMood = crownMood.setMood(value, reason);
  saveState.setCrownMoodScore?.(nextMood);
  const nextTierLabel = crownMood.getTierLabel();
  if (nextTierLabel !== crownOmenTierLabel) {
    crownOmenTierLabel = nextTierLabel;
    crownOmenFlashRemaining = 0.38;
  }
  return nextMood;
}

function updateCrownMoodFlash(dtSeconds) {
  crownMood.setElapsedSeconds(world.elapsedSeconds);
  const nextTierLabel = crownMood.getTierLabel();
  if (nextTierLabel !== crownOmenTierLabel) {
    crownOmenTierLabel = nextTierLabel;
    crownOmenFlashRemaining = 0.38;
  }
  crownOmenFlashRemaining = Math.max(0, crownOmenFlashRemaining - dtSeconds);
}

function getCrownMoodInfluence() {
  return crownMood.getTierEffects();
}

function resolveVaelorisPressureDelta() {
  const moodInfluence = getCrownMoodInfluence();
  const stagePressure = vaelorisPressureStage >= 2 ? VAELORIS_STAGE2_PRESSURE_DELTA : 0;
  if (vaelorisChoice === VAELORIS_CHOICE_VALUES.LEAVE) {
    return VAELORIS_LEAVE_PRESSURE_DELTA + stagePressure + (moodInfluence.externalExtractionDelta ?? 0);
  }
  if (vaelorisEventActive && vaelorisConstructsAlive > 0) {
    return VAELORIS_ACTIVE_PRESSURE_DELTA + stagePressure + (moodInfluence.externalExtractionDelta ?? 0);
  }
  return stagePressure + (moodInfluence.externalExtractionDelta ?? 0);
}

function applyVaelorisWorldModifiers() {
  const moodInfluence = getCrownMoodInfluence();
  syncVaelorisPressureState();
  let anomalyBias = 0;
  let veinBias = 0;
  if (vaelorisChoice === VAELORIS_CHOICE_VALUES.DISABLE) {
    anomalyBias = VAELORIS_DISABLE_ANOMALY_BIAS;
    veinBias = VAELORIS_DISABLE_VEIN_BIAS;
  } else if (vaelorisChoice === VAELORIS_CHOICE_VALUES.LEAVE) {
    anomalyBias = VAELORIS_LEAVE_ANOMALY_BIAS;
    veinBias = VAELORIS_LEAVE_VEIN_BIAS;
  }
  if (vaelorisPressureStage >= 2) {
    anomalyBias += VAELORIS_STAGE2_ANOMALY_BIAS;
    veinBias += VAELORIS_STAGE2_VEIN_BIAS;
  }

  anomalySystem.setSpawnChanceModifier(anomalyBias + (moodInfluence.anomalySpawnBias ?? 0));
  setThreatVeinActivationBias(veinBias + (moodInfluence.veinActivationBias ?? 0));
  world.setExternalExtractionDelta(resolveVaelorisPressureDelta());
}

function spawnVaelorisConstructs(config) {
  if (!config?.constructSpawns || config.constructSpawns.length === 0) {
    vaelorisConstructEnemyIds = [];
    vaelorisConstructsAlive = 0;
    vaelorisPendingConstructSpawn = false;
    return;
  }
  vaelorisConstructEnemyIds = combatSystem.spawnEnemies(
    config.constructSpawns.map((spawn, index) => ({
      id: `vaeloris-construct-${index + 1}`,
      role: "construct",
      type: "standard",
      x: spawn.x,
      z: spawn.y,
      maxHealth: 62,
      aggroRadius: 4.6,
      attackRange: 1.1,
      attackCooldown: 1.72,
      lingerTag: "vaeloris-op",
    }))
  );
  vaelorisConstructsAlive = vaelorisConstructEnemyIds.length;
}

function startVaelorisDialogueSequence() {
  vaelorisDialogueActive = true;
  vaelorisDialogueIndex = 0;
  vaelorisDialogueTimer = 0.25;
}

function triggerVaelorisFieldOperation() {
  if (vaelorisChoice !== VAELORIS_CHOICE_VALUES.NONE) return false;
  const config = getVaelorisFieldConfig();
  if (!config || config.extractorDestroyed) return false;
  if (vaelorisEventActive && vaelorisConstructEnemyIds.length > 0) return false;

  setVaelorisFieldTriggered(true);
  vaelorisEventActive = true;
  vaelorisConstructEnemyIds = [];
  vaelorisConstructsAlive = 0;
  vaelorisPendingConstructSpawn = true;
  startVaelorisDialogueSequence();
  partySystem.setFollowerHold(1.05);
  audioBus.play("extractor_loop");
  return true;
}

function applyVaelorisChoice(choice) {
  const resolved = normalizeVaelorisChoice(choice);
  if (resolved === VAELORIS_CHOICE_VALUES.NONE) return false;
  if (vaelorisChoice !== VAELORIS_CHOICE_VALUES.NONE) return false;

  const config = getVaelorisFieldConfig();
  vaelorisChoicePanel.close();
  setVaelorisFieldTriggered(true);
  setVaelorisChoice(resolved);
  vaelorisEventActive = false;
  vaelorisDialogueActive = false;
  vaelorisDialogueTimer = 0;
  vaelorisDialogueIndex = 0;
  vaelorisPendingConstructSpawn = false;
  vaelorisExtractorPromptVisible = false;

  if (resolved === VAELORIS_CHOICE_VALUES.DISABLE) {
    syncVaelorisExtractorVisual();
    if (config?.extractorPosition) {
      const pos = new THREE.Vector2(config.extractorPosition.x, config.extractorPosition.y);
      vfxSystem.spawnGroundRing?.({
        position: pos,
        innerRadius: 0.48,
        outerRadius: 0.74,
        color: "#bef6c4",
        life: 0.4,
        opacity: 0.74,
        spread: 0.82,
      });
    }
    world.applyStabilityBump(0.03, currentSceneInfo.regionId, currentSceneInfo.regionName);
    world.applyCrownCalm(0.028);
    adjustCrownMood(CROWN_MOOD_EXTRACTOR_DISABLED_DELTA, "vaeloris_extractor_disabled");
    setTransientMessage("Elaine: That buys us time.", 1.5);
  } else {
    adjustCrownMood(CROWN_MOOD_EXTRACTOR_LEFT_DELTA, "vaeloris_extractor_left_running");
    syncVaelorisExtractorVisual();
    setTransientMessage("Elaine: You're gambling.", 1.5);
  }

  applyVaelorisWorldModifiers();
  markMapDirty();
  return true;
}

function applyHarvesterChoice(choice, { force = false } = {}) {
  const resolved = normalizeHarvesterChoice(choice);
  if (resolved === HARVESTER_CHOICE_VALUES.NONE) return false;
  const currentChoice = getHarvesterChoice();
  if (!force && currentChoice !== HARVESTER_CHOICE_VALUES.NONE) return false;
  if (!force && !hasHarvesterBossDefeated()) return false;

  setHarvesterChoice(resolved);
  harvesterChoice = resolved;
  setHarvesterBossActive(false);
  setHarvesterBossDefeated(true);
  setHarvesterSiteUnlocked(true);
  setChapter4RowanReportDone(true);
  harvesterChoicePanel.close();

  if (resolved === HARVESTER_CHOICE_VALUES.SHATTER) {
    vaelorisPressureStage = setVaelorisPressureStage(1);
    world.applyStabilityBump(0.03, currentSceneInfo.regionId, currentSceneInfo.regionName);
    world.applyCrownCalm(0.024);
    adjustCrownMood(CROWN_MOOD_HARVESTER_SHATTER_DELTA, "harvester_core_shatter");
    setTransientMessage("The hum breaks. The ash feels... lighter.", 1.6);
  } else {
    relicShardCount = saveState.addRelicShards?.(1) ?? relicShardCount + 1;
    vaelorisPressureStage = setVaelorisPressureStage(2);
    adjustCrownMood(CROWN_MOOD_HARVESTER_SALVAGE_DELTA, "harvester_core_salvage");
    setTransientMessage("The core thrums. Like it recognized you.", 1.6);
  }

  setCurrentObjectiveId(OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_HARVESTER);
  refreshQuestText();
  applyVaelorisWorldModifiers();
  markMapDirty();
  return true;
}

function updateVaelorisDialogue(dtSeconds) {
  if (!vaelorisDialogueActive) return;
  vaelorisDialogueTimer = Math.max(0, vaelorisDialogueTimer - dtSeconds);
  if (vaelorisDialogueTimer > 0) return;

  if (vaelorisDialogueIndex < VAELORIS_DIALOGUE_LINES.length) {
    setTransientMessage(VAELORIS_DIALOGUE_LINES[vaelorisDialogueIndex], 1.52);
    vaelorisDialogueIndex += 1;
    vaelorisDialogueTimer = 1.56;
    return;
  }
  vaelorisDialogueActive = false;
  if (vaelorisPendingConstructSpawn) {
    const config = getVaelorisFieldConfig();
    spawnVaelorisConstructs(config);
    vaelorisPendingConstructSpawn = false;
    vaelorisEventActive = vaelorisConstructEnemyIds.length > 0;
  }
}

function isNearVaelorisExtractor() {
  const config = getVaelorisFieldConfig();
  if (!config?.extractorPosition) return false;
  const interactionRadius = Math.max(0.6, Number(config.interactRadius) || 1.05);
  const distance = Math.hypot(
    player.position.x - config.extractorPosition.x,
    player.position.z - config.extractorPosition.y
  );
  return distance <= interactionRadius;
}

function tryOpenVaelorisChoicePanel() {
  if (currentSceneInfo.sceneId !== "hollowScar") return false;
  if (vaelorisChoice !== VAELORIS_CHOICE_VALUES.NONE) return false;
  if (!hasVeinGuardianDefeated()) return false;
  if (vaelorisConstructsAlive > 0) return false;
  if (!hasVaelorisFieldTriggered()) return false;
  const config = getVaelorisFieldConfig();
  if (!config || config.extractorDestroyed) return false;
  if (!isNearVaelorisExtractor()) return false;
  vaelorisChoicePanel.open();
  return true;
}

function updateVaelorisFieldOperation(dtSeconds, { allowTrigger = true } = {}) {
  const config = getVaelorisFieldConfig();
  if (currentSceneInfo.sceneId !== "hollowScar" || !config) {
    vaelorisDialogueActive = false;
    vaelorisDialogueIndex = 0;
    vaelorisDialogueTimer = 0;
    vaelorisConstructEnemyIds = [];
    vaelorisConstructsAlive = 0;
    vaelorisPendingConstructSpawn = false;
    vaelorisEventActive = false;
    vaelorisExtractorPromptVisible = false;
    vaelorisChoicePanel.close();
    applyVaelorisWorldModifiers();
    return;
  }

  vaelorisChoice = getVaelorisChoice();
  vaelorisFieldTriggered = hasVaelorisFieldTriggered();
  syncVaelorisExtractorVisual();

  if (vaelorisChoice !== VAELORIS_CHOICE_VALUES.NONE) {
    vaelorisDialogueActive = false;
    vaelorisDialogueIndex = 0;
    vaelorisDialogueTimer = 0;
    vaelorisConstructEnemyIds = [];
    vaelorisConstructsAlive = 0;
    vaelorisPendingConstructSpawn = false;
    vaelorisEventActive = false;
    vaelorisExtractorPromptVisible = false;
    vaelorisChoicePanel.close();
    applyVaelorisWorldModifiers();
    return;
  }

  if (vaelorisConstructEnemyIds.length > 0) {
    vaelorisConstructsAlive = combatSystem.countAliveEnemiesByIds(vaelorisConstructEnemyIds);
    if (vaelorisConstructsAlive <= 0) {
      vaelorisConstructEnemyIds = [];
      vaelorisConstructsAlive = 0;
      vaelorisPendingConstructSpawn = false;
      vaelorisEventActive = false;
    } else {
      vaelorisEventActive = true;
    }
  } else {
    vaelorisConstructsAlive = 0;
    if (!vaelorisPendingConstructSpawn) {
      vaelorisEventActive = false;
    }
  }

  if (!vaelorisFieldTriggered && allowTrigger && hasVeinGuardianDefeated() && !bossInstance.isActive()) {
    const triggerRadius = Math.max(0.8, Number(config.triggerRadius) || 1.4);
    const triggerCenter = config.triggerCenter ?? config.extractorPosition;
    if (triggerCenter) {
      const distance = Math.hypot(player.position.x - triggerCenter.x, player.position.z - triggerCenter.y);
      if (distance <= triggerRadius) {
        triggerVaelorisFieldOperation();
      }
    }
  }

  updateVaelorisDialogue(dtSeconds);
  applyVaelorisWorldModifiers();
}

function countCompletedVeins() {
  const storyFlags = saveState.getStoryFlags();
  let count = 0;
  for (const [key, value] of Object.entries(storyFlags)) {
    if (!key.startsWith("vein_completed_")) continue;
    if (Boolean(value)) {
      count += 1;
    }
  }
  return count;
}

function clearGuardianEncounterState({ clearStoryActiveFlag = true } = {}) {
  bossInstance.endBossFight("reset");
  guardianCombatForced = false;
  pacingDirector.setPaused(false);
  markMapDirty();
  if (clearStoryActiveFlag) {
    setVeinGuardianActive(false);
    setHarvesterBossActive(false);
  }
}

function getHollowScarBossArenaConfig() {
  const fromScene = sceneManager.getBossArenaConfig?.();
  if (fromScene?.bossId === CROWN_MANIFESTATION_BOSS_ID) {
    return fromScene;
  }
  return {
    bossId: CROWN_MANIFESTATION_BOSS_ID,
    bounds: {
      type: "circle",
      center: { x: GUARDIAN_TRIGGER_CENTER.x, y: GUARDIAN_TRIGGER_CENTER.y },
      radius: 2.55,
    },
    trigger: {
      center: { x: GUARDIAN_TRIGGER_CENTER.x, y: GUARDIAN_TRIGGER_CENTER.y },
      radius: GUARDIAN_TRIGGER_RADIUS,
    },
    resetCooldownSeconds: 5,
  };
}

function getEmberfallHarvesterSiteConfig() {
  return sceneManager.getHarvesterSiteConfig?.() ?? null;
}

function getEmberfallBossArenaConfig() {
  const fromScene = sceneManager.getBossArenaConfig?.();
  if (fromScene?.bossId === HARVESTER_WARDEN_BOSS_ID) {
    return fromScene;
  }
  const site = getEmberfallHarvesterSiteConfig();
  const center = site?.center ?? { x: 4.28, y: -2.18 };
  const triggerRadius = Math.max(0.45, Number(site?.triggerRadius) || 1.26);
  return {
    bossId: HARVESTER_WARDEN_BOSS_ID,
    bounds: {
      type: "circle",
      center,
      radius: 2.95,
      anchorPositions: site?.anchorPositions ?? [],
    },
    trigger: {
      center,
      radius: triggerRadius,
    },
    resetCooldownSeconds: 5,
  };
}

function spawnVeinGuardianEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "hollowScar") return false;
  if (bossInstance.isActive()) return true;
  if (!force && hasVeinGuardianDefeated()) return false;

  if (lastVeinFrame.active && lastVeinFrame.activeVeinId) {
    onVeinFail(lastVeinFrame.activeVeinId);
  }
  setVeinDroneEnabled(false);
  anomalySystem.clearActive();
  combatSystem.clearScene();
  combatSystem.setEnemyAttacksEnabled(true);
  const arena = getHollowScarBossArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
  });
  if (!started) {
    return false;
  }
  guardianCombatForced = bossInstance.isActive();
  pacingDirector.setPaused(true);
  setVeinGuardianActive(true);
  markMapDirty();
  audioBus.play("root_surge");
  setTransientMessage("A manifestation rises.", 1.4);
  return true;
}

function spawnHarvesterWardenEncounter({ force = false } = {}) {
  if (currentSceneInfo.sceneId !== "emberfall") return false;
  if (bossInstance.isActive()) return true;
  if (!force && hasHarvesterBossDefeated()) return false;
  if (!force && !hasHarvesterSiteUnlocked()) return false;
  if (!force && !hasVeinGuardianDefeated()) return false;

  if (lastVeinFrame.active && lastVeinFrame.activeVeinId) {
    onVeinFail(lastVeinFrame.activeVeinId);
  }
  setVeinDroneEnabled(false);
  anomalySystem.clearActive();
  combatSystem.clearScene();
  combatSystem.setEnemyAttacksEnabled(true);
  const arena = getEmberfallBossArenaConfig();
  const started = bossInstance.enterBossArena(arena.bossId, currentSceneInfo.sceneId, {
    ...arena.bounds,
    trigger: arena.trigger,
    resetCooldownSeconds: arena.resetCooldownSeconds,
    anchorPositions: arena.bounds?.anchorPositions ?? [],
  });
  if (!started) {
    return false;
  }
  guardianCombatForced = bossInstance.isActive();
  pacingDirector.setPaused(true);
  setHarvesterBossActive(true);
  markMapDirty();
  audioBus.play("root_surge");
  setTransientMessage("The Harvester Warden locks onto you.", 1.4);
  return true;
}

function maybeTriggerVeinGuardian() {
  if (currentSceneInfo.sceneId !== "hollowScar") return false;
  if (bossInstance.isActive()) return false;
  if (hasVeinGuardianDefeated()) return false;
  if (!hasVeinQuestComplete()) return false;
  if (countCompletedVeins() < 2) return false;
  const arena = getHollowScarBossArenaConfig();
  const triggerCenter = arena.trigger?.center ?? {
    x: GUARDIAN_TRIGGER_CENTER.x,
    y: GUARDIAN_TRIGGER_CENTER.y,
  };
  const triggerRadius = Math.max(0.3, Number(arena.trigger?.radius) || GUARDIAN_TRIGGER_RADIUS);
  const distanceToCenter = Math.hypot(
    player.position.x - triggerCenter.x,
    player.position.z - triggerCenter.y
  );
  if (distanceToCenter > triggerRadius) return false;
  return spawnVeinGuardianEncounter();
}

function maybeTriggerHarvesterWarden() {
  if (currentSceneInfo.sceneId !== "emberfall") return false;
  if (bossInstance.isActive()) return false;
  if (hasHarvesterBossDefeated()) return false;
  if (!hasHarvesterSiteUnlocked()) return false;
  if (!hasVeinGuardianDefeated()) return false;
  const arena = getEmberfallBossArenaConfig();
  const triggerCenter = arena.trigger?.center ?? arena.bounds?.center ?? { x: 4.28, y: -2.18 };
  const triggerRadius = Math.max(0.4, Number(arena.trigger?.radius) || 1.2);
  const distanceToCenter = Math.hypot(
    player.position.x - triggerCenter.x,
    player.position.z - triggerCenter.y
  );
  if (distanceToCenter > triggerRadius) return false;
  return spawnHarvesterWardenEncounter();
}

function refreshQuestText() {
  currentQuestText = hasVeinQuestActive() && !hasVeinQuestComplete() ? "Stabilize the Vein" : "";
}

function beginOpeningBeat() {
  openingLineTimer = 0.3;
  openingLineIndex = 0;
  openingKillResolved = false;
  openingTransitionTimer = 0;
}

function updateOpeningBeat(dtSeconds) {
  if (currentSceneInfo.sceneId !== OPENING_SCENE_ID) return;

  if (openingLineIndex < OPENING_DIALOGUE_LINES.length) {
    openingLineTimer = Math.max(0, openingLineTimer - dtSeconds);
    if (openingLineTimer <= 0) {
      setTransientMessage(OPENING_DIALOGUE_LINES[openingLineIndex], 1.45);
      openingLineIndex += 1;
      openingLineTimer = 1.45;
    }
  }

  if (!openingKillResolved && lastCombatFrame.enemiesAlive <= 0 && lastCombatFrame.enemiesTotal > 0) {
    openingKillResolved = true;
    openingTransitionTimer = 2.4;
    world.triggerPulsePressure(0.8);
    vfxSystem.spawnTapTargetRing(new THREE.Vector2(player.position.x, player.position.z), "#bff8c0");
    setTransientMessage("Arthur! Step away from there!", 1.9);
  }

  if (!openingKillResolved) return;
  openingTransitionTimer = Math.max(0, openingTransitionTimer - dtSeconds);
  if (openingTransitionTimer > 0 || sceneManager.isTransitioning()) return;

  if (!hasOpeningPlayed()) {
    markOpeningPlayed();
  }
  setStoryFlag("is_new_game", false);
  sceneManager.requestTransition("thornmere", { flow: "opening-complete" });
}

function beginElaineIntro() {
  if (elaineIntroActive || hasElaineJoined()) return;
  const veins = getThreatVeins();
  const firstVein = veins.find((entry) => entry.id === "hollowscar-corridor-vein");
  if (!firstVein) return;
  const introPosition = {
    x: firstVein.center.x + firstVein.radius * 0.86,
    y: firstVein.center.y - 0.18,
  };
  partySystem.showElaineStaging("hollowScar", introPosition);
  elaineIntroActive = true;
  elaineIntroLineIndex = 0;
  elaineIntroLineTimer = 0.3;
}

function updateElaineIntro(dtSeconds) {
  if (!elaineIntroActive) return;
  if (currentSceneInfo.sceneId !== "hollowScar") {
    elaineIntroLineTimer = Math.max(0.2, elaineIntroLineTimer - dtSeconds);
    return;
  }
  elaineIntroLineTimer = Math.max(0, elaineIntroLineTimer - dtSeconds);
  if (elaineIntroLineTimer > 0) return;

  if (elaineIntroLineIndex < ELAINE_INTRO_LINES.length) {
    setTransientMessage(ELAINE_INTRO_LINES[elaineIntroLineIndex], 1.65);
    elaineIntroLineIndex += 1;
    elaineIntroLineTimer = 1.7;
    return;
  }

  elaineIntroActive = false;
  partySystem.clearStaging();
  setElaineJoined(true);
  setTransientMessage("Elaine joins your party.", 1.6);
}

function maybeStartHollowScarPulse() {
  if (currentSceneInfo.sceneId !== "hollowScar") return false;
  if (!hasIntroSpoken()) return false;
  if (hasPulseSeen()) return false;
  if (eventRunner.isEventActive(HOLLOWSCAR_PULSE_EVENT_ID)) return false;

  const started = eventRunner.startEvent(HOLLOWSCAR_PULSE_EVENT_ID);
  if (!started) return false;

  pulseSurgeSpawned = false;
  pulseSurgeRoles = [];
  pulseDamageTaken = 0;
  world.triggerPulsePressure(6);
  audioBus.play("pulse");
  setTransientMessage("The roots are watching.", 2.0);
  pacingDirector.recordEvent("hollowscar_pulse_started");
  return true;
}

function maybeStartClassicIntroTextBeat() {
  if (currentSceneInfo.sceneId !== "thornmere") return false;
  if (hasPrologueSeen()) return false;
  if (hasIntroTextSeen()) return false;
  if (introTextBeat.isActive()) return false;
  introTextBeat.start(CLASSIC_INTRO_TEXT_MESSAGE);
  markIntroTextSeen();
  return true;
}

function startThornmereMorningBeat() {
  controlLockRemaining = Math.max(controlLockRemaining, 1.5);
  introTextBeat.start(THORNMERE_MORNING_MESSAGE, {
    fadeIn: 0.45,
    hold: 0.6,
    fadeOut: 0.45,
  });
  markIntroTextSeen();
}

function syncSceneMusic(sceneId) {
  if (sceneId === "start") {
    audioBus.playMusic("title_theme");
    return;
  }
  if (sceneId === "prologue") {
    audioBus.playMusic("title_theme");
    return;
  }
  if (sceneId === OPENING_SCENE_ID) {
    audioBus.playMusic("thornmere_theme");
    return;
  }
  if (sceneId === "thornmere") {
    audioBus.playMusic("thornmere_theme");
    return;
  }
  audioBus.stopMusic();
}

function resetRuntimeForNewGame() {
  currentRngSeed = DEFAULT_RNG_SEED;
  setSeed(DEFAULT_RNG_SEED);
  playerUpgrades = resolvePlayerUpgrades(saveState.getPlayerUpgrades?.());
  relicShardCount = saveState.getRelicShards?.() ?? 0;
  applyPlayerUpgrades(true);
  world.reset();
  setCrownMood(0, "new_game_reset");
  pacingDirector.reset();
  combatSystem.resetProgress();
  eventRunner.clear();
  anomalySystem.clearActive();
  disposeThreatVeins();

  devCombatOverride = false;
  sceneCombatForced = false;
  combatFromEnemies = false;
  guardianCombatForced = false;
  clearGuardianEncounterState({ clearStoryActiveFlag: false });
  setVeinGuardianActive(false);
  setVeinGuardianDefeated(false);
  setHarvesterBossActive(false);
  setHarvesterBossDefeated(false);
  setHarvesterChoice(HARVESTER_CHOICE_VALUES.NONE);
  setChapter5AftershockDone(false);
  setRegion3SeedUnlocked(false);
  setVaelorisPatrolSetpieceDone(false);
  setRegion3SeedEntered(false);
  setRidgeGateUnlocked(false);
  setChapter6ArrivedWindward(false);
  setChapter6RelayDropped(false);
  setChapter6WaystoneAttuned(false);
  setChapter9Started(false);
  setChapter9AnchorsAttuned(false);
  setChapter9NullArchivistDefeated(false);
  setChapter9Choice("");
  setEndgameStarted(false);
  setEndgameGoalId("");
  setEndgameRouteSeedUnlocked(false);
  setEndgameAct1Started(false);
  setEndgameThirdSealObtained(false);
  setEndgameOuterSpireUnlocked(false);
  setEndgameOuterSpireBreached(false);
  setEndgameGatewardenDefeated(false);
  setEndgameSpireEntryUnlocked(false);
  setEndgameAct2Started(false);
  setEndgameInnerSpireEntered(false);
  setEndgameResonanceLock(1, false);
  setEndgameResonanceLock(2, false);
  setEndgameResonanceLock(3, false);
  setEndgameLoomProctorDefeated(false);
  setEndgameAct3Unlocked(false);
  setEndgameLastDoorSeen(false);
  setEndgameAct3Started(false);
  setEndgameLastDoorOpened(false);
  setEndgameLastSpireEntered(false);
  setEndgameSetpieceRiftCrossed(false);
  setEndgameSetpieceCoreReached(false);
  setEndgameFinalBossDefeated(false);
  setEndgameChoiceMade(false);
  setEndgameEnding("");
  setEndgameCreditsSeen(false);
  setNgPlusUnlocked(false);
  setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
  setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
  setStoryFlag("crownheart_key", false);
  setStoryFlag("endgame_retaliation_flag", false);
  setStoryFlag("endgame_task_waystone", false);
  setStoryFlag("endgame_task_crownheart", false);
  setStoryFlag("endgame_task_third_seal", false);
  setStoryFlag("endgame_task_seal_1", false);
  setStoryFlag("endgame_task_seal_2", false);
  setStoryFlag("endgame_task_seal_3", false);
  harvesterChoice = HARVESTER_CHOICE_VALUES.NONE;
  vaelorisPressureStage = setVaelorisPressureStage(1);
  lastGuardianFrame = bossInstance.getState();
  pulseSurgeSpawned = false;
  pulseSurgeRoles = [];
  pulseDamageTaken = 0;
  transientMessageText = "";
  transientMessageSeconds = 0;
  stabilityToastText = "";
  stabilityToastSeconds = 0;
  controlLockRemaining = 0;
  act2FalloutPending = null;
  rowanCouncilPending = null;
  chapter2ArrivalPending = null;
  chapter3DebriefPending = null;
  chapter4RowanReportPending = null;
  chapter5AftershockPending = null;
  chapter6ArrivalPending = null;
  chapter6WaystoneLorePending = null;
  chapter9StartPending = null;
  chapter9LoreVisionPending = null;
  endgameAct1StartPending = null;
  endgameAct2StartPending = null;
  endgameAct2LorePending = null;
  endgameAct3StartPending = null;
  endgameAct3LorePanelsPending = null;
  willowMeetPending = null;
  clearWillowAmbushState();
  clearListeningSpikeSetpieceState();
  clearRidgePatrolSetpieceState();
  clearChapter6RelaySetpieceState();
  clearChapter8RetaliationSetpieceState();
  clearChapter9SetpieceState();
  clearThirdSealQuestState();
  clearSpireBreachState();
  resetInnerSpireRuntime({ keepProgress: false });
  resetLastSpireRuntime({ keepProgress: false });
  hasShownPlayerHitToast = false;
  playerState.restoreToFull({ resetInvulnerability: true });
  setActivePartyMember("arthur");
  arthurDowned = false;
  arthurBleedoutRemaining = 0;
  resetElaineSupportState({ restoreFull: true });
  resetWillowSpellState({ restoreFull: true, resetStance: true });
  statusEffects.clearAllEffects();
  nearDeathLatched = false;
  playerKnockbackVelocity.set(0, 0);
  playerHitFlashRemaining = 0;
  playerHitTintRemaining = 0;
  playerHitNudgeRemaining = 0;
  cameraHitNudgeOffset.set(0, 0);
  cameraAttackNudgeOffset.set(0, 0);
  cameraZoomScalar = 1;
  damageTintOverlay.setOpacity(0);
  setVeinDroneEnabled(false);
  verdantMoteCount = 0;
  openingLineTimer = 0;
  openingLineIndex = 0;
  openingKillResolved = false;
  openingTransitionTimer = 0;
  elaineIntroActive = false;
  elaineIntroLineIndex = 0;
  elaineIntroLineTimer = 0;
  vaelorisChoice = VAELORIS_CHOICE_VALUES.NONE;
  harvesterChoice = HARVESTER_CHOICE_VALUES.NONE;
  listeningSpikeChoice = LISTENING_SPIKE_CHOICE_VALUES.NONE;
  vaelorisFieldTriggered = false;
  vaelorisEventActive = false;
  vaelorisDialogueActive = false;
  vaelorisDialogueIndex = 0;
  vaelorisDialogueTimer = 0;
  vaelorisConstructEnemyIds = [];
  vaelorisConstructsAlive = 0;
  vaelorisPendingConstructSpawn = false;
  vaelorisExtractorPromptVisible = false;
  vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
  setTacticsMode("balanced");
  banterDirector.reset();
  resetObjectiveTelemetry();
  partyChat.clear();
  guidanceLineText = "";
  resetAiStats();
  firstVeinCompletedLatched = Boolean(saveState.getStoryFlag(FIRST_VEIN_COMPLETION_FLAG));
  refreshQuestText();
  partySystem.clearStaging();
  partySystem.setJoined(false, player.position);
  partySystem.setWillowJoined(false, player.position);
  willowJoinedCached = false;
  willowJoinToastShown = false;
  inputManager.clearTouchTarget();
  pendingMobileAttackEnemyId = null;
  pendingNpcInteractionId = null;
  playerController.interruptCharge();
  resetSwordAttackState();
  dialogueBox.closeDialogue();
  introTextBeat.clear();
  vaelorisChoicePanel.close();
  harvesterChoicePanel.close();
  listeningSpikeChoicePanel.close();
  vaultChoicePanel.close();
  loreVisionOverlay.close();
  cinematicPanelOverlay.close();
  endingChoicePanel.close();
  creditsOverlay.close();
  saveWriteAccumulator = 0;
  safeSpotWriteAccumulator = 0;
  lastAnomalyFrame = {
    activeCount: 0,
    nearby: false,
    collected: false,
  };
  lastPulseFrame = {
    active: false,
    elapsedSeconds: 0,
    progress: 0,
    phaseId: "",
    phaseProgress: 0,
    surgeSpawned: false,
    surgeRoles: [],
    overlayVisible: false,
  };
  lastVeinFrame = {
    active: false,
    activeVeinId: null,
    state: "",
    waveIndex: 0,
    totalWaves: 0,
    enemiesRemaining: 0,
    hudText: "",
    localOverlayOpacity: 0,
    localFogDensityDelta: 0,
    localTintDarken: 0,
    localDesaturation: 0,
    localFogReliefDelta: 0,
    cameraZoomTarget: 1,
    waveTransitionActive: false,
    waveTransitionIntensity: 0,
    waveFoliageBoost: 1,
    waveShakeScalar: 0,
    barrierScale: 0,
    barrierGrowth: 0,
    correctedPlayerPosition: null,
    playerInsideActiveRadius: false,
  };
  syncVaelorisExtractorVisual();
  applyVaelorisWorldModifiers();
  markMapDirty();
}

function updatePulseEvent(dtSeconds) {
  const eventsThisFrame = eventRunner.update(dtSeconds);
  const pulseState = eventsThisFrame.active.find((entry) => entry.id === HOLLOWSCAR_PULSE_EVENT_ID) ?? null;

  if (pulseState && !pulseSurgeSpawned && currentSceneInfo.sceneId === "hollowScar") {
    const regionBaselinePressure = sceneManager.getRegionBaselinePressure();
    pulseSurgeRoles = pacingDirector.getEncounterComposition(regionBaselinePressure, {
      sceneId: currentSceneInfo.sceneId,
      crownTier: crownMood.getTierLabel(),
      pressureStage: vaelorisPressureStage,
      forVein: false,
    });
    const surgeSpawns = sceneManager.getPulseSurgeSpawns(pulseSurgeRoles);
    if (surgeSpawns.length > 0) {
      combatSystem.spawnEnemies(surgeSpawns);
      pulseSurgeSpawned = true;
    }
  }

  if (pulseState && lastCombatFrame.damageTaken > 0) {
    pulseDamageTaken += lastCombatFrame.damageTaken;
    pacingDirector.recordEvent("hollowscar_pulse_damage_taken", lastCombatFrame.damageTaken);
  }

  const pulseCompleted = eventsThisFrame.completed.some((entry) => entry.id === HOLLOWSCAR_PULSE_EVENT_ID);
  if (pulseCompleted) {
    markPulseSeen();
    pacingDirector.recordEvent("hollowscar_pulse_completed");
    if (playerState.hp > 0 && !nearDeathLatched) {
      setTransientMessage("You could leave... or go deeper.", 2.5);
    }
    pulseSurgeSpawned = false;
    pulseSurgeRoles = [];
  }

  lastPulseFrame = {
    active: Boolean(pulseState),
    elapsedSeconds: Number((pulseState?.elapsedSeconds ?? 0).toFixed(3)),
    progress: Number((pulseState?.progress ?? 0).toFixed(3)),
    phaseId: pulseState?.phaseId ?? "",
    phaseProgress: Number((pulseState?.phaseProgress ?? 0).toFixed(3)),
    surgeSpawned: pulseSurgeSpawned,
    surgeRoles: pulseSurgeSpawned ? [...pulseSurgeRoles] : [],
    overlayVisible: false,
  };
}

function openNpcDialogue(interaction) {
  if (!interaction || !Array.isArray(interaction.script) || interaction.script.length === 0) return false;
  const isRowan = interaction.npcId === "elder_rowan" || interaction.npcName === "Elder Rowan";
  if (isRowan && getEffectiveMovementContext() === "exploration") {
    performRowanSanctuaryHeal();
  }
  if (isRowan) {
    const triggeredChapter8 = tryTriggerChapter8AftermathEvent({
      nearRowan: true,
      force: false,
    });
    if (triggeredChapter8) {
      return true;
    }
    const triggeredChapter5 = tryTriggerChapter5AftershockEvent({
      nearRowan: true,
      force: false,
    });
    if (triggeredChapter5) {
      return true;
    }
    const triggeredChapter4 = tryTriggerChapter4RowanReportEvent({
      nearRowan: true,
      force: false,
    });
    if (triggeredChapter4) {
      return true;
    }
    const triggered = tryTriggerRowanDebriefChapter3Event({
      nearRowan: true,
      force: false,
    });
    if (triggered) {
      return true;
    }
  }
  const opened = dialogueBox.openDialogue(interaction.script, {
    npcName: interaction.npcName,
    onComplete: interaction.onComplete,
  });
  if (opened) {
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
    playerController.interruptCharge();
    resetSwordAttackState();
  }
  return opened;
}

function updateCamera(dtSeconds, snap = false) {
  cameraDesiredTarget.set(player.position.x, 0, player.position.z);
  const followAlpha = snap ? 1 : 1 - Math.exp(-CAMERA_FOLLOW_SHARPNESS * dtSeconds);
  const zoomTarget = lastVeinFrame.cameraZoomTarget ?? 1;
  const zoomAlpha = snap ? 1 : 1 - Math.exp(-dtSeconds / Math.max(0.0001, CAMERA_VEIN_ZOOM_EASE_SECONDS));
  cameraZoomScalar += (zoomTarget - cameraZoomScalar) * zoomAlpha;

  const waveShakeStrength = Math.max(0, Math.min(1, lastVeinFrame.waveShakeScalar ?? 0));
  const waveShakeAmplitude = CAMERA_WAVE_SHAKE_WORLD_MAX * waveShakeStrength;
  const waveShakeX = Math.sin(world.elapsedSeconds * 29.5 + 0.35) * waveShakeAmplitude;
  const waveShakeZ = Math.cos(world.elapsedSeconds * 25.7 + 1.1) * waveShakeAmplitude * 0.72;
  cameraWaveShakeOffset.set(waveShakeX, waveShakeZ);
  cameraShakeOffset.set(
    cameraWaveShakeOffset.x + cameraHitNudgeOffset.x + cameraAttackNudgeOffset.x,
    cameraWaveShakeOffset.y * 0.4,
    cameraWaveShakeOffset.y + cameraHitNudgeOffset.y + cameraAttackNudgeOffset.y
  );
  cameraLookOffset.set(
    cameraWaveShakeOffset.x * 0.12 + cameraHitNudgeOffset.x * 0.26 + cameraAttackNudgeOffset.x * 0.2,
    0,
    cameraWaveShakeOffset.y * 0.12 + cameraHitNudgeOffset.y * 0.26 + cameraAttackNudgeOffset.y * 0.2
  );

  cameraFollowTarget.lerp(cameraDesiredTarget, followAlpha);

  const zoomDistance = CAMERA_DISTANCE / cameraZoomScalar;
  const zoomHeight = CAMERA_HEIGHT / cameraZoomScalar;
  cameraDesiredPosition.set(
    cameraFollowTarget.x + cameraShakeOffset.x,
    zoomHeight + cameraShakeOffset.y,
    cameraFollowTarget.z + zoomDistance + cameraShakeOffset.z
  );
  camera.position.lerp(cameraDesiredPosition, followAlpha);
  camera.lookAt(
    cameraFollowTarget.x + cameraLookOffset.x,
    CAMERA_LOOK_Y,
    cameraFollowTarget.z + cameraLookOffset.z
  );
}

function updatePlayerHitMotion(dtSeconds) {
  if (playerKnockbackVelocity.lengthSq() > 1e-6) {
    player.position.x += playerKnockbackVelocity.x * dtSeconds;
    player.position.z += playerKnockbackVelocity.y * dtSeconds;
    const damping = Math.max(0, 1 - PLAYER_KNOCKBACK_DAMPING * dtSeconds);
    playerKnockbackVelocity.multiplyScalar(damping);
  }

  playerHitFlashRemaining = Math.max(0, playerHitFlashRemaining - dtSeconds);
  playerHitTintRemaining = Math.max(0, playerHitTintRemaining - dtSeconds);
  playerHitNudgeRemaining = Math.max(0, playerHitNudgeRemaining - dtSeconds);
  elaineBoltCastFlashRemaining = Math.max(0, elaineBoltCastFlashRemaining - dtSeconds);
  willowSpellCastFlashRemaining = Math.max(0, willowSpellCastFlashRemaining - dtSeconds);

  const nudgeDamping = Math.max(0, 1 - 15 * dtSeconds);
  cameraHitNudgeOffset.multiplyScalar(nudgeDamping);
  if (cameraHitNudgeOffset.lengthSq() < 1e-6 || playerHitNudgeRemaining <= 0) {
    cameraHitNudgeOffset.set(0, 0);
    cameraAttackNudgeOffset.set(0, 0);
  }
  cameraAttackNudgeOffset.multiplyScalar(Math.max(0, 1 - 18 * dtSeconds));
  if (cameraAttackNudgeOffset.lengthSq() < 1e-6) {
    cameraAttackNudgeOffset.set(0, 0);
  }

  const tintMix = playerHitTintRemaining > 0 ? playerHitTintRemaining / PLAYER_HIT_TINT_SECONDS : 0;
  damageTintOverlay.setOpacity(Math.max(0, Math.min(1, tintMix)) * 0.85);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function startSwordAttackPose(attackEvent, direction) {
  swordAttackType = attackEvent.type === "charge" ? "charge" : "light";
  lastAttackTypePlayed = swordAttackType;
  swordAttackDirection = direction;
  swordAttackElapsed = 0;
  swordAttackChargeRatio = swordAttackType === "charge" ? attackEvent.chargeRatio ?? 0 : 0;
  const profile = ATTACK_SWING_PROFILES[swordAttackType];
  swordAttackDuration = profile.windupSeconds + profile.activeSeconds + profile.recoverySeconds;
  swordAttackFollowThroughHold = swordAttackType === "charge" ? 0.045 : 0;
}

function resetSwordAttackState() {
  swordWalkBobTimer = 0;
  swordAttackType = "";
  swordAttackElapsed = 0;
  swordAttackDuration = 0;
  swordAttackChargeRatio = 0;
  swordAttackDirection = "down";
  swordAttackFollowThroughHold = 0;
  elaineBoltCastFlashRemaining = 0;
  willowSpellCastFlashRemaining = 0;
}

function updateSwordTransform(dtSeconds, movementInfo, facingDirection) {
  const characterId = normalizePartyCharacterId(activePartyMember);
  const movementState = movementInfo.isMoving ? "walk" : "idle";
  if (movementInfo.isMoving) {
    swordWalkBobTimer += dtSeconds * (movementInfo.isRunning ? 9 : 6);
  } else {
    swordWalkBobTimer = 0;
  }
  if ((characterId === "arthur" || characterId === "willow") && swordAttackType) {
    swordAttackElapsed = Math.min(swordAttackDuration + swordAttackFollowThroughHold, swordAttackElapsed + dtSeconds);
    const profile = ATTACK_SWING_PROFILES[swordAttackType];
    const recoveryEnd = profile.windupSeconds + profile.activeSeconds + profile.recoverySeconds;
    if (swordAttackElapsed > recoveryEnd + swordAttackFollowThroughHold) {
      swordAttackType = "";
      swordAttackDirection = facingDirection;
      swordAttackElapsed = 0;
      swordAttackDuration = 0;
      swordAttackChargeRatio = 0;
      swordAttackFollowThroughHold = 0;
    }
  } else if (characterId === "elaine") {
    swordAttackType = "";
    swordAttackDuration = 0;
    swordAttackElapsed = 0;
    swordAttackChargeRatio = 0;
    swordAttackFollowThroughHold = 0;
    swordAttackDirection = facingDirection;
  }

  let castRatio = 0;
  const castSpell =
    elaineSpellCast &&
    (elaineSpellCast.spellId === ELAINE_SPELLS.singleHeal.id || elaineSpellCast.spellId === ELAINE_SPELLS.resurrect.id)
      ? Object.values(ELAINE_SPELLS).find((entry) => entry.id === elaineSpellCast.spellId) ?? null
      : null;
  if (castSpell && castSpell.castSeconds > 0) {
    castRatio = clamp01(1 - (elaineSpellCast.remaining ?? castSpell.castSeconds) / castSpell.castSeconds);
  }
  const boltFlashRatio = clamp01(elaineBoltCastFlashRemaining / ELAINE_BOLT_CAST_FLASH_SECONDS);
  castRatio = Math.max(castRatio, boltFlashRatio);
  const elaineCastActive = characterId === "elaine" && (Boolean(castSpell) || boltFlashRatio > 0.001);

  const animState = {
    movementState,
    walkTimer: swordWalkBobTimer,
    attackType: characterId === "arthur" || characterId === "willow" ? swordAttackType : "",
    attackElapsed: swordAttackElapsed,
    attackDuration: swordAttackDuration,
    attackChargeRatio: swordAttackChargeRatio,
    castActive: elaineCastActive || (characterId === "willow" && willowSpellCastFlashRemaining > 0.001),
    castRatio,
    facing: facingDirection,
    elapsedSeconds: world.elapsedSeconds,
    willowStance: willowStance.getWillowStance(),
  };

  const descriptor = getWeaponSprite(characterId, facingDirection, animState);
  applyWeaponDescriptor(activeWeaponMaterial, descriptor);
  activeWeaponKey = descriptor.key ?? activeWeaponKey;

  const pose = getWeaponOffset(characterId, facingDirection, animState);
  activeWeaponMounted = pose.mounted !== false;
  activeWeaponSprite.visible = activeWeaponMounted;
  if (activeWeaponMounted) {
    activeWeaponSprite.position.set(pose.x, pose.y, pose.z);
    activeWeaponSprite.material.rotation = pose.rotation;
    activeWeaponSprite.scale.set(pose.scale, pose.scale, 1);
  }

  const glowDescriptor = getWeaponGlow(characterId, animState);
  applyWeaponDescriptor(activeWeaponGlowMaterial, glowDescriptor);
  activeWeaponGlowKey = glowDescriptor.key ?? activeWeaponGlowKey;
  activeWeaponGlowSprite.visible = Boolean(glowDescriptor.enabled);
  if (activeWeaponGlowSprite.visible) {
    activeWeaponGlowSprite.position.set(glowDescriptor.x, glowDescriptor.y, glowDescriptor.z);
    activeWeaponGlowSprite.scale.set(glowDescriptor.scale, glowDescriptor.scale, 1);
  }
  activeWeaponGlowMaterial.opacity = Number.isFinite(glowDescriptor.opacity) ? glowDescriptor.opacity : 0;

  if (characterId === "willow") {
    const stanceColor = getWillowGemColor(willowStance.getWillowStance());
    const pulse = 0.5 + 0.5 * Math.sin(world.elapsedSeconds * WILLOW_GEM_PULSE_SPEED + 0.2);
    const opacityBase = WILLOW_GEM_PULSE_MIN + pulse * (WILLOW_GEM_PULSE_MAX - WILLOW_GEM_PULSE_MIN);
    const attackBoost = swordAttackType || willowSpellCastFlashRemaining > 0.001 ? 0.16 : 0;
    const gemScale = 0.11 + pulse * 0.02 + (attackBoost > 0 ? 0.02 : 0);
    activeWeaponGemSprite.visible = true;
    activeWeaponGemMaterial.color.set(stanceColor);
    activeWeaponGemMaterial.opacity = Math.min(0.9, opacityBase + attackBoost);
    activeWeaponGemSprite.position.set(glowDescriptor.x, glowDescriptor.y, 0.055);
    activeWeaponGemSprite.scale.set(gemScale, gemScale, 1);
  } else {
    activeWeaponGemSprite.visible = false;
    activeWeaponGemMaterial.opacity = 0;
  }
}

function setActivePartyMember(member, { snapCamera = false } = {}) {
  const requested = normalizePartyCharacterId(member);
  let next = requested;
  if (requested === "elaine" && (!hasElaineJoined() || elaineDowned)) {
    next = "arthur";
  }
  if (requested === "willow" && !hasWillowJoined()) {
    next = "arthur";
  }
  if (requested === "arthur" && arthurDowned) {
    if (hasElaineJoined() && !elaineDowned) {
      next = "elaine";
    } else if (hasWillowJoined()) {
      next = "willow";
    }
  }
  if (activePartyMember === next) {
    partySystem.setActiveCharacter(next, player.position);
    if (snapCamera) {
      cameraFollowTarget.set(player.position.x, 0, player.position.z);
      updateCamera(1 / 60, true);
    }
    return;
  }
  activePartyMember = next;
  resetSwordAttackState();
  partySystem.setActiveCharacter(next, player.position);
  if (snapCamera) {
    cameraFollowTarget.set(player.position.x, 0, player.position.z);
    updateCamera(1 / 60, true);
  }
}

function clearElaineCastState() {
  elaineSpellCast = null;
}

function setElaineCooldown(spellId, seconds) {
  if (!Object.prototype.hasOwnProperty.call(elaineSpellCooldowns, spellId)) return;
  elaineSpellCooldowns[spellId] = Math.max(elaineSpellCooldowns[spellId], Math.max(0, Number(seconds) || 0));
}

function resetElaineSupportState({ restoreFull = true } = {}) {
  if (restoreFull) {
    elaineHp = elaineMaxHp;
    elaineMp = elaineMaxMp;
  }
  elaineDowned = false;
  elaineBleedoutRemaining = 0;
  elaineInvulnRemaining = 0;
  elaineInterruptLockRemaining = 0;
  statusEffects.removeEffect(STATUS_ENTITY_IDS.ARTHUR, STATUS_EFFECT_IDS.BUFF_ATTDEF);
  statusEffects.removeEffect(STATUS_ENTITY_IDS.ELAINE, STATUS_EFFECT_IDS.BUFF_ATTDEF);
  statusEffects.removeEffect(STATUS_ENTITY_IDS.WILLOW, STATUS_EFFECT_IDS.BUFF_ATTDEF);
  clearElaineCastState();
  for (const key of Object.keys(elaineSpellCooldowns)) {
    elaineSpellCooldowns[key] = 0;
  }
}

function resetWillowSpellState({ restoreFull = true, resetStance = false } = {}) {
  if (restoreFull) {
    willowMp = willowMaxMp;
  }
  for (const key of Object.keys(willowSpellCooldowns)) {
    willowSpellCooldowns[key] = 0;
  }
  willowPendingCasts.length = 0;
  clearEnemyStatusEffects();
  willowAutoBanterCooldown = 0;
  willowSpellCastFlashRemaining = 0;
  if (resetStance) {
    willowStance.setWillowStance("ruby", "manual", { nowMs: getNowMs(), force: true });
    willowStance.setAutoStanceEnabled(true);
    persistWillowStanceSettings();
  }
}

function reviveArthur(healthRatio = 0.5) {
  arthurDowned = false;
  arthurBleedoutRemaining = 0;
  const ratio = clamp01(Number(healthRatio) || 0.5);
  playerState.setHP(playerState.maxHP * ratio, { resetInvulnerability: true });
  playerState.grantInvulnerability(0.45);
  nearDeathLatched = playerState.hp <= playerState.maxHP * 0.2;
}

function reviveElaine(healthRatio = 0.6) {
  const ratio = clamp01(Number(healthRatio) || 0.6);
  elaineDowned = false;
  elaineBleedoutRemaining = 0;
  elaineHp = Math.max(1, elaineMaxHp * ratio);
  elaineInvulnRemaining = PLAYER_INVULN_WINDOW_MS / 1000;
}

function refreshPartyControlAfterStateChange() {
  if (activePartyMember === "elaine" && (elaineDowned || !hasElaineJoined())) {
    if (hasWillowJoined()) {
      setActivePartyMember("willow", { snapCamera: true });
    } else {
      setActivePartyMember("arthur", { snapCamera: true });
    }
  }
  if (activePartyMember === "willow" && !hasWillowJoined()) {
    setActivePartyMember("arthur", { snapCamera: true });
  }
  if (activePartyMember === "arthur" && arthurDowned) {
    if (hasElaineJoined() && !elaineDowned) {
      setActivePartyMember("elaine", { snapCamera: true });
    } else if (hasWillowJoined()) {
      setActivePartyMember("willow", { snapCamera: true });
    }
  }
}

function handlePartyWipe() {
  adjustCrownMood(CROWN_MOOD_PARTY_WIPE_DELTA, "party_wipe");
  setActivePartyMember("arthur");
  arthurDowned = false;
  arthurBleedoutRemaining = 0;
  resetElaineSupportState({ restoreFull: true });
  respawnPlayerAfterDefeat();
}

function onArthurDowned() {
  if (arthurDowned) return;
  arthurDowned = true;
  arthurBleedoutRemaining = PARTY_BLEEDOUT_SECONDS;
  playerState.setHP(0, { resetInvulnerability: true });
  inputManager.clearTouchTarget();
  pendingMobileAttackEnemyId = null;
  pendingNpcInteractionId = null;
  playerController.interruptCharge();
  resetSwordAttackState();
  if (hasElaineJoined() && !elaineDowned) {
    setActivePartyMember("elaine", { snapCamera: true });
    playerState.grantInvulnerability(0.4);
    setTransientMessage("Arthur falls. Elaine steps in.", 1.2);
    return;
  }
  if (hasWillowJoined()) {
    setActivePartyMember("willow", { snapCamera: true });
    playerState.grantInvulnerability(0.4);
    setTransientMessage("Arthur falls. Willow takes point.", 1.2);
    return;
  }
  handlePartyWipe();
}

function onElaineDowned() {
  if (elaineDowned) return;
  elaineDowned = true;
  elaineBleedoutRemaining = PARTY_BLEEDOUT_SECONDS;
  clearElaineCastState();
  if (!arthurDowned) {
    setActivePartyMember("arthur", { snapCamera: true });
    setTransientMessage("Elaine falters.", 1.1);
    return;
  }
  if (hasWillowJoined()) {
    setActivePartyMember("willow", { snapCamera: true });
    setTransientMessage("Elaine falters. Willow steadies the line.", 1.2);
    return;
  }
  handlePartyWipe();
}

function resolveRespawnPoint(sceneId) {
  const safeSpot = saveState.getSafeSpot(sceneId);
  if (safeSpot) return safeSpot;
  return sceneManager.getSceneSpawnPosition(sceneId, { useSaved: false });
}

function respawnPlayerAfterDefeat() {
  const sceneId = currentSceneInfo.sceneId;
  const respawn = resolveRespawnPoint(sceneId);
  player.position.set(respawn.x, 0, respawn.z);
  cameraFollowTarget.set(respawn.x, 0, respawn.z);
  updateCamera(fixedStep, true);
  playerShadow.position.set(respawn.x, -0.885, respawn.z);

  inputManager.clearTouchTarget();
  pendingMobileAttackEnemyId = null;
  pendingNpcInteractionId = null;
  playerController.interruptCharge();
  resetSwordAttackState();
  playerKnockbackVelocity.set(0, 0);
  cameraHitNudgeOffset.set(0, 0);
  cameraAttackNudgeOffset.set(0, 0);
  playerHitFlashRemaining = 0;
  playerHitTintRemaining = 0;
  playerHitNudgeRemaining = 0;
  damageTintOverlay.setOpacity(0);
  nearDeathLatched = false;
  setActivePartyMember("arthur");
  arthurDowned = false;
  arthurBleedoutRemaining = 0;
  resetElaineSupportState({ restoreFull: true });
  resetWillowSpellState({ restoreFull: true, resetStance: false });
  clearAllPartyStatusEffects();
  playerState.restoreToFull({ resetInvulnerability: true });
  playerState.grantInvulnerability(RESPAWN_INVULN_SECONDS);
  saveState.setSafeSpot(sceneId, { x: respawn.x, z: respawn.z });

  if (lastVeinFrame.active && lastVeinFrame.activeVeinId) {
    onVeinFail(lastVeinFrame.activeVeinId);
  }
  setTransientMessage("You wake with a sharp breath.", 1.8);
}

function updatePlayerPresentation(dtSeconds, movementInfo) {
  if (movementInfo.isMoving && movementInfo.moveDirection.lengthSq() > 1e-6) {
    playerFacingVector.copy(movementInfo.moveDirection).normalize();
  } else if (movementInfo.target) {
    playerTargetVector.set(movementInfo.target.x - player.position.x, movementInfo.target.y - player.position.z);
    if (playerTargetVector.lengthSq() > 1e-6) {
      playerFacingVector.copy(playerTargetVector.normalize());
    }
  }

  const hasAttackEvents = movementInfo.attackEvents.length > 0;
  const elaineRangedAttack = activePartyMember === "elaine" && hasAttackEvents;
  if (hasAttackEvents) {
    const firstAttack = movementInfo.attackEvents[0];
    if (firstAttack.direction && firstAttack.direction.lengthSq() > 1e-6) {
      playerFacingVector.copy(firstAttack.direction).normalize();
    }
    if (!elaineRangedAttack) {
      startSwordAttackPose(firstAttack, resolveDirectionFromVector(playerFacingVector, "down"));
      const swingDuration =
        (firstAttack.windupSeconds ?? 0.06) + (firstAttack.activeSeconds ?? 0.12) + (firstAttack.recoverySeconds ?? 0.16);
      playerAnimator.triggerAttack(swingDuration);
    } else {
      lastAttackTypePlayed = firstAttack.type === "charge" ? "charge" : "light";
    }
  }

  const facingDirection = resolveDirectionFromVector(playerFacingVector, "down");
  playerAnimator.setDirection(facingDirection);
  playerAnimator.setState(movementInfo.isMoving ? "walk" : "idle");
  lastRenderedAnimState = hasAttackEvents
    ? elaineRangedAttack
      ? "cast"
      : "attack"
    : movementInfo.isMoving
      ? "walk"
      : "idle";
  const frameData = playerAnimator.update(dtSeconds);

  const combatActive = getEffectiveMovementContext() === "combat";
  const basePlayerColor = combatActive ? "#ffe7df" : "#ffffff";
  playerMaterial.color.set(basePlayerColor);
  if (playerHitFlashRemaining > 0) {
    const flashMix = Math.max(0, Math.min(1, playerHitFlashRemaining / PLAYER_HIT_FLASH_SECONDS));
    playerMaterial.color.lerp(PLAYER_HIT_FLASH_COLOR, flashMix);
  }
  player.scale.set(PLAYER_SPRITE_WORLD_WIDTH * CHARACTER_SCALE, PLAYER_SPRITE_WORLD_HEIGHT * CHARACTER_SCALE, 1);
  player.renderOrder = resolveDepthOrder(player.position.z, 1200);
  playerOutline.position.set(player.position.x, player.position.y, player.position.z);
  playerOutline.scale.set(2.52 * CHARACTER_SCALE, 3.34 * CHARACTER_SCALE, 1);
  playerOutline.renderOrder = resolveDepthOrder(player.position.z, 1195);
  playerOutlineMaterial.opacity = playerHitFlashRemaining > 0 ? 0.84 : combatActive ? 0.7 : 0.62;
  playerShadow.position.set(player.position.x, -0.885, player.position.z);
  playerShadow.renderOrder = resolveDepthOrder(player.position.z, 980);
  playerShadow.material.opacity = combatActive ? 0.29 : 0.24;
  updateSwordTransform(dtSeconds, movementInfo, facingDirection);
  activeWeaponSprite.renderOrder = resolveDepthOrder(player.position.z, 1206);
  activeWeaponGlowSprite.renderOrder = resolveDepthOrder(player.position.z, 1207);
  activeWeaponGemSprite.renderOrder = resolveDepthOrder(player.position.z, 1208);

  const spawnSlashVfx = activePartyMember === "arthur";
  for (const attackEvent of movementInfo.attackEvents) {
    if (spawnSlashVfx) {
      vfxSystem.spawnSlash({
        playerPosition: player.position,
        direction: attackEvent.direction,
        attackType: attackEvent.type,
        chargeRatio: attackEvent.type === "charge" ? attackEvent.chargeRatio : 0.12,
      });
    }
  }

  const showChargeFeedback = activePartyMember === "arthur";
  vfxSystem.updateChargeFeedback({
    playerPosition: player.position,
    chargeRatio: showChargeFeedback ? movementInfo.chargeMeter : 0,
    charging: showChargeFeedback ? movementInfo.charging : false,
    dtSeconds,
  });

  return frameData;
}

function consumeElaineMp(amount) {
  const value = Math.max(0, Number(amount) || 0);
  if (value <= 0) return true;
  if (elaineMp < value) return false;
  elaineMp -= value;
  return true;
}

function healArthur(amount) {
  if (arthurDowned) return 0;
  const healingScalar = statusEffects.getHealingReceivedMultiplier(STATUS_ENTITY_IDS.ARTHUR);
  const scaledAmount = Math.max(0, Number(amount) || 0) * Math.max(0, Number(healingScalar) || 0);
  const before = playerState.hp;
  playerState.setHP(playerState.hp + scaledAmount);
  return Math.max(0, playerState.hp - before);
}

function healElaine(amount) {
  if (elaineDowned) return 0;
  const healingScalar = statusEffects.getHealingReceivedMultiplier(STATUS_ENTITY_IDS.ELAINE);
  const scaledAmount = Math.max(0, Number(amount) || 0) * Math.max(0, Number(healingScalar) || 0);
  const before = elaineHp;
  elaineHp = Math.min(elaineMaxHp, elaineHp + scaledAmount);
  return Math.max(0, elaineHp - before);
}

function clearPartyStatusEffects() {
  clearElaineCastState();
  elaineInterruptLockRemaining = 0;
  clearAllPartyStatusEffects();
}

function performRowanSanctuaryHeal() {
  const hadArthurInjury = playerState.hp < playerState.maxHP - 0.01;
  const hadElaineInjury = hasElaineJoined() && elaineHp < elaineMaxHp - 0.01;
  const hadElaineMpLoss = hasElaineJoined() && elaineMp < elaineMaxMp - 0.01;
  const hadWillowMpLoss = hasWillowJoined() && willowMp < willowMaxMp - 0.01;
  const hadStatus =
    arthurDowned ||
    elaineDowned ||
    Boolean(elaineSpellCast) ||
    hasElaineAttDefBuff() ||
    elaineInterruptLockRemaining > 0 ||
    willowPendingCasts.length > 0 ||
    statusEffects.getEntityIdsWithEffects().length > 0;
  const needsRestoration =
    hadArthurInjury || hadElaineInjury || hadElaineMpLoss || hadWillowMpLoss || hadStatus;

  reviveArthur(1);
  resetElaineSupportState({ restoreFull: true });
  resetWillowSpellState({ restoreFull: true, resetStance: false });
  setActivePartyMember("arthur");
  playerState.restoreToFull({ resetInvulnerability: true });
  playerState.grantInvulnerability(0.2);
  if (isPlayableScene(currentSceneInfo.sceneId)) {
    saveState.setSafeSpot(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
  }
  clearPartyStatusEffects();
  if (needsRestoration) {
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(player.position.x, player.position.z),
      innerRadius: 0.5,
      outerRadius: 0.74,
      color: "#c6ffd2",
      life: 0.45,
      opacity: 0.78,
      spread: 0.62,
    });
    setTransientMessage("Rowan's ward steadies your breath.", 1.5);
  }
}

function findHealTarget() {
  if (arthurDowned && !elaineDowned) return "arthur";
  if (activePartyMember === "elaine" && !elaineDowned && elaineHp < elaineMaxHp) return "elaine";
  if (!arthurDowned && playerState.hp < playerState.maxHP) return "arthur";
  if (!elaineDowned && elaineHp < elaineMaxHp) return "elaine";
  return null;
}

function applyElaineSpellEffect(spell) {
  if (!spell) return false;
  if (spell.id === ELAINE_SPELLS.singleHeal.id) {
    const healTarget = findHealTarget();
    if (!healTarget) return false;
    if (healTarget === "arthur") {
      const healed = healArthur(spell.healAmount);
      if (healed <= 0) return false;
    } else {
      const healed = healElaine(spell.healAmount);
      if (healed <= 0) return false;
    }
    setTransientMessage("Elaine's light mends the wound.", 1.2);
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(player.position.x, player.position.z),
      innerRadius: 0.4,
      outerRadius: 0.56,
      color: "#d2ffe2",
      life: 0.3,
      opacity: 0.75,
      spread: 0.4,
    });
    return true;
  }

  if (spell.id === ELAINE_SPELLS.groupHeal.id) {
    const healedArthur = healArthur(spell.healAmount);
    const healedElaine = healElaine(spell.healAmount * 0.9);
    if (healedArthur <= 0 && healedElaine <= 0) return false;
    setTransientMessage("A soft ward washes over the party.", 1.2);
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(player.position.x, player.position.z),
      innerRadius: 0.48,
      outerRadius: 0.7,
      color: "#bdf4df",
      life: 0.35,
      opacity: 0.72,
      spread: 0.56,
    });
    return true;
  }

  if (spell.id === ELAINE_SPELLS.blessing.id) {
    statusEffects.addEffect(STATUS_ENTITY_IDS.ARTHUR, {
      id: STATUS_EFFECT_IDS.BUFF_ATTDEF,
      durationSeconds: spell.buffSeconds,
      sourceId: STATUS_ENTITY_IDS.ELAINE,
    });
    if (hasElaineJoined()) {
      statusEffects.addEffect(STATUS_ENTITY_IDS.ELAINE, {
        id: STATUS_EFFECT_IDS.BUFF_ATTDEF,
        durationSeconds: spell.buffSeconds,
        sourceId: STATUS_ENTITY_IDS.ELAINE,
      });
    }
    if (hasWillowJoined()) {
      statusEffects.addEffect(STATUS_ENTITY_IDS.WILLOW, {
        id: STATUS_EFFECT_IDS.BUFF_ATTDEF,
        durationSeconds: spell.buffSeconds,
        sourceId: STATUS_ENTITY_IDS.ELAINE,
      });
    }
    setTransientMessage("Elaine's blessing takes hold.", 1.2);
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(player.position.x, player.position.z),
      innerRadius: 0.35,
      outerRadius: 0.52,
      color: "#c7ffe0",
      life: 0.28,
      opacity: 0.78,
      spread: 0.34,
    });
    return true;
  }

  if (spell.id === ELAINE_SPELLS.resurrect.id) {
    if (!arthurDowned) return false;
    reviveArthur(spell.reviveHealthRatio);
    setActivePartyMember("arthur");
    setTransientMessage("Arthur rises with a ragged breath.", 1.4);
    vfxSystem.spawnGroundRing?.({
      position: new THREE.Vector2(player.position.x, player.position.z),
      innerRadius: 0.52,
      outerRadius: 0.74,
      color: "#d9ffeb",
      life: 0.44,
      opacity: 0.82,
      spread: 0.5,
    });
    return true;
  }

  return false;
}

function canUseElaineSpells() {
  if (!hasElaineJoined()) return false;
  if (elaineDowned) return false;
  if (sceneManager.hasBlockingUiScene()) return false;
  if (dialogueBox.isOpen()) return false;
  if (shrineSystem.isOpen()) return false;
  if (vaelorisChoicePanel.isOpen()) return false;
  if (harvesterChoicePanel.isOpen()) return false;
  if (listeningSpikeChoicePanel.isOpen()) return false;
  if (cinematicPanelOverlay.isOpen()) return false;
  if (endingChoicePanel.isOpen()) return false;
  if (creditsOverlay.isOpen()) return false;
  return true;
}

function getElaineSpellByKey(lowerKey) {
  if (lowerKey === ELAINE_SPELLS.singleHeal.key) return ELAINE_SPELLS.singleHeal;
  if (lowerKey === ELAINE_SPELLS.groupHeal.key) return ELAINE_SPELLS.groupHeal;
  if (lowerKey === ELAINE_SPELLS.blessing.key) return ELAINE_SPELLS.blessing;
  if (lowerKey === ELAINE_SPELLS.resurrect.key) return ELAINE_SPELLS.resurrect;
  return null;
}

function tryStartElaineSpell(spell, { showFailureToast = true } = {}) {
  const started = beginElaineSpell(spell);
  if (!started && showFailureToast) {
    setTransientMessage("Spell not ready.", 0.7);
  }
  return started;
}

function beginElaineSpell(spell) {
  if (!spell || !canUseElaineSpells()) return false;
  if (elaineInterruptLockRemaining > 0) return false;
  if (elaineSpellCast) return false;
  if ((elaineSpellCooldowns[spell.id] ?? 0) > 0) return false;
  if (!consumeElaineMp(spell.mpCost)) return false;

  if (spell.id === ELAINE_SPELLS.singleHeal.id && !findHealTarget()) {
    elaineMp = Math.min(elaineMaxMp, elaineMp + spell.mpCost);
    return false;
  }
  if (spell.id === ELAINE_SPELLS.resurrect.id && !arthurDowned) {
    elaineMp = Math.min(elaineMaxMp, elaineMp + spell.mpCost);
    return false;
  }

  if (spell.castSeconds > 0) {
    elaineSpellCast = {
      spellId: spell.id,
      remaining: spell.castSeconds,
      rooted: Boolean(spell.rooted),
      interruptCooldownSeconds: spell.interruptCooldownSeconds ?? 0,
    };
    setTransientMessage(
      spell.id === ELAINE_SPELLS.resurrect.id ? "Elaine begins a revival chant." : "Elaine begins a healing cast.",
      0.9
    );
    return true;
  }

  const applied = applyElaineSpellEffect(spell);
  if (!applied) {
    elaineMp = Math.min(elaineMaxMp, elaineMp + spell.mpCost);
    return false;
  }
  setElaineCooldown(spell.id, spell.cooldownSeconds);
  return true;
}

function interruptElaineCast() {
  if (!elaineSpellCast) return false;
  const spellId = elaineSpellCast.spellId;
  const spell =
    Object.values(ELAINE_SPELLS).find((entry) => entry.id === spellId) ?? null;
  const interruptCooldown = elaineSpellCast.interruptCooldownSeconds ?? spell?.interruptCooldownSeconds ?? 0;
  clearElaineCastState();
  if (interruptCooldown > 0) {
    elaineInterruptLockRemaining = Math.max(elaineInterruptLockRemaining, interruptCooldown);
    setElaineCooldown(spellId, interruptCooldown);
  }
  setTransientMessage("Elaine's cast breaks.", 0.95);
  return true;
}

function handleElaineSpellUiTap(spellKey) {
  const spell = getElaineSpellByKey(String(spellKey ?? "").toLowerCase());
  if (!spell) return false;
  return tryStartElaineSpell(spell, { showFailureToast: true });
}

function handleElaineSpellKey(event) {
  const lowerKey = String(event.key ?? "").toLowerCase();
  const spell = getElaineSpellByKey(lowerKey);
  if (!spell) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (!canProcessGameplayInput(event)) return false;
  if (!canUseElaineSpells()) return false;
  const started = tryStartElaineSpell(spell, { showFailureToast: !event.repeat });
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function getNowMs() {
  return Math.round(Math.max(0, world.elapsedSeconds) * 1000);
}

function getWillowRuntimePosition() {
  if (activePartyMember === "willow") {
    return new THREE.Vector2(player.position.x, player.position.z);
  }
  const snapshot = partySystem.getState?.();
  if (snapshot?.willowFollower) {
    return new THREE.Vector2(snapshot.willowFollower.x, snapshot.willowFollower.z);
  }
  return new THREE.Vector2(player.position.x, player.position.z);
}

function getElaineRuntimePosition() {
  if (activePartyMember === "elaine") {
    return new THREE.Vector2(player.position.x, player.position.z);
  }
  const snapshot = partySystem.getState?.();
  if (snapshot?.follower) {
    return new THREE.Vector2(snapshot.follower.x, snapshot.follower.z);
  }
  return new THREE.Vector2(player.position.x, player.position.z);
}

function resolveElaineBoltSourcePosition() {
  const sourceSprite = activeWeaponGlowSprite.visible ? activeWeaponGlowSprite : activeWeaponSprite;
  if (sourceSprite?.getWorldPosition) {
    sourceSprite.getWorldPosition(elaineBoltOriginWorld);
    return new THREE.Vector2(elaineBoltOriginWorld.x, elaineBoltOriginWorld.z);
  }
  return getElaineRuntimePosition();
}

function resolveElaineBoltTargetIntent(attackEvent) {
  const explicitEnemy = getEnemySnapshotById(attackEvent?.targetEnemyId);
  if (explicitEnemy) {
    return {
      targetEnemyId: explicitEnemy.id,
      targetPoint: new THREE.Vector2(explicitEnemy.x, explicitEnemy.z),
    };
  }

  const direction = attackEvent?.direction?.clone?.() ?? playerFacingVector.clone();
  if (direction.lengthSq() <= 1e-6) {
    direction.set(0, 1);
  } else {
    direction.normalize();
  }

  const originX = player.position.x;
  const originZ = player.position.z;
  const enemies = getAliveEnemySnapshots();
  const candidates = enemies
    .map((enemy) => {
      const dx = enemy.x - originX;
      const dz = enemy.z - originZ;
      const distance = Math.hypot(dx, dz);
      if (distance > ELAINE_BOLT_TARGET_RANGE) return null;
      const dot = distance <= 1e-6 ? 1 : (dx / distance) * direction.x + (dz / distance) * direction.y;
      return {
        id: enemy.id,
        x: enemy.x,
        z: enemy.z,
        distance,
        dot,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.distance - right.distance || String(left.id).localeCompare(String(right.id)));

  const frontCandidate = candidates.find((candidate) => candidate.dot >= ELAINE_BOLT_FRONT_DOT);
  const resolvedTarget = frontCandidate ?? candidates[0] ?? null;
  if (resolvedTarget) {
    return {
      targetEnemyId: resolvedTarget.id,
      targetPoint: new THREE.Vector2(resolvedTarget.x, resolvedTarget.z),
    };
  }

  const guardianTarget = bossInstance.getTargetPoint();
  if (guardianTarget) {
    return {
      targetEnemyId: guardianTarget.id ?? VEIN_GUARDIAN_ID,
      targetPoint: new THREE.Vector2(guardianTarget.x, guardianTarget.z),
    };
  }

  return {
    targetEnemyId: null,
    targetPoint: new THREE.Vector2(
      originX + direction.x * Math.min(ELAINE_BOLT_TARGET_RANGE, 2.2),
      originZ + direction.y * Math.min(ELAINE_BOLT_TARGET_RANGE, 2.2)
    ),
  };
}

function isWillowTargetMarked(enemyId) {
  const targetId = String(enemyId ?? "");
  if (!targetId) return false;
  const effects = statusEffects.getEffects(targetId);
  return effects.some((effect) => {
    return (
      effect.id === STATUS_EFFECT_IDS.IGNITE_MARK ||
      effect.id === STATUS_EFFECT_IDS.WITHER_MARK ||
      effect.id === STATUS_EFFECT_IDS.FOCUS_MARK
    );
  });
}

function applyWillowDebuff(enemyId, debuffId, durationSeconds) {
  const targetId = String(enemyId ?? "");
  if (!targetId) return false;
  const effectId = WILLOW_DEBUFF_TO_EFFECT_ID[String(debuffId ?? "").toLowerCase()];
  if (!effectId) return false;
  const effect = statusEffects.addEffect(targetId, {
    id: effectId,
    durationSeconds: Math.max(0.1, Number(durationSeconds) || 0.1),
    charges: effectId === STATUS_EFFECT_IDS.FOCUS_MARK ? 3 : undefined,
    sourceId: STATUS_ENTITY_IDS.WILLOW,
  });
  if (!effect) return false;
  aiStats.willowDebuffApplyCount += 1;
  return true;
}

function getElaineBuffRemainingSeconds() {
  const arthur = statusEffects.getEffect(STATUS_ENTITY_IDS.ARTHUR, STATUS_EFFECT_IDS.BUFF_ATTDEF)?.remainingSeconds ?? 0;
  const elaine = statusEffects.getEffect(STATUS_ENTITY_IDS.ELAINE, STATUS_EFFECT_IDS.BUFF_ATTDEF)?.remainingSeconds ?? 0;
  const willow = statusEffects.getEffect(STATUS_ENTITY_IDS.WILLOW, STATUS_EFFECT_IDS.BUFF_ATTDEF)?.remainingSeconds ?? 0;
  return Math.max(arthur, elaine, willow);
}

function hasElaineAttDefBuff() {
  return getElaineBuffRemainingSeconds() > 0.001;
}

function getActiveControlledEntityId() {
  if (activePartyMember === "elaine") return STATUS_ENTITY_IDS.ELAINE;
  if (activePartyMember === "willow") return STATUS_ENTITY_IDS.WILLOW;
  return STATUS_ENTITY_IDS.ARTHUR;
}

function computeStatusAdjustedDamage({
  baseDamage,
  attackerId = "",
  targetId = "",
  attackMultiplier = 1,
  damageType = "physical",
}) {
  const base = Math.max(0, Number(baseDamage) || 0);
  if (base <= 0) return 0;
  const attackScale = Math.max(0, Number(attackMultiplier) || 1);
  const resolvedAttackerId = String(attackerId ?? "");
  const resolvedTargetId = String(targetId ?? "");
  const attackerAttackMultiplier = statusEffects.getAttackMultiplier(resolvedAttackerId);
  const dealtMultiplier = statusEffects.getDamageDealtMultiplier(
    resolvedAttackerId,
    resolvedTargetId,
    damageType
  );
  const takenMultiplier = statusEffects.getDamageTakenMultiplier(
    resolvedTargetId,
    resolvedAttackerId,
    damageType
  );
  const defenseMultiplier = statusEffects.getDefenseMultiplier(resolvedTargetId);
  const safeDefense = Math.max(0.001, Number(defenseMultiplier) || 1);
  return base * attackScale * attackerAttackMultiplier * dealtMultiplier * takenMultiplier / safeDefense;
}

function resolveDamageWithStatus({
  baseDamage,
  attackerId = "",
  targetId = "",
  damageType = "physical",
  consumeStatusCharges = true,
}) {
  const resolvedDamage = computeStatusAdjustedDamage({
    baseDamage,
    attackerId,
    targetId,
    attackMultiplier: 1,
    damageType,
  });
  if (resolvedDamage > 0 && consumeStatusCharges !== false) {
    statusEffects.consumeHitCharges(attackerId, targetId, damageType);
  }
  return resolvedDamage;
}

function clearAllPartyStatusEffects() {
  statusEffects.clearEffects(STATUS_ENTITY_IDS.ARTHUR);
  statusEffects.clearEffects(STATUS_ENTITY_IDS.ELAINE);
  statusEffects.clearEffects(STATUS_ENTITY_IDS.WILLOW);
}

function clearEnemyStatusEffects() {
  const protectedEntities = new Set([
    STATUS_ENTITY_IDS.ARTHUR,
    STATUS_ENTITY_IDS.ELAINE,
    STATUS_ENTITY_IDS.WILLOW,
  ]);
  for (const entityId of statusEffects.getEntityIdsWithEffects()) {
    if (protectedEntities.has(entityId)) continue;
    statusEffects.clearEffects(entityId);
  }
}

function getLegacyWillowDebuffState() {
  const now = Math.max(0, Number(world.elapsedSeconds) || 0);
  const entries = [];
  for (const entityId of statusEffects.getEntityIdsWithEffects()) {
    if (entityId === STATUS_ENTITY_IDS.ARTHUR || entityId === STATUS_ENTITY_IDS.ELAINE || entityId === STATUS_ENTITY_IDS.WILLOW) {
      continue;
    }
    const effects = statusEffects.getEffects(entityId);
    let igniteUntil = 0;
    let witherUntil = 0;
    let focusUntil = 0;
    let focusHitsRemaining = 0;
    for (const effect of effects) {
      const until = now + Math.max(0, Number(effect.remainingSeconds) || 0);
      if (effect.id === STATUS_EFFECT_IDS.IGNITE_MARK) {
        igniteUntil = Math.max(igniteUntil, until);
      } else if (effect.id === STATUS_EFFECT_IDS.WITHER_MARK) {
        witherUntil = Math.max(witherUntil, until);
      } else if (effect.id === STATUS_EFFECT_IDS.FOCUS_MARK) {
        focusUntil = Math.max(focusUntil, until);
        focusHitsRemaining = Math.max(focusHitsRemaining, Number(effect.charges) || 0);
      }
    }
    if (igniteUntil > now || witherUntil > now || (focusUntil > now && focusHitsRemaining > 0)) {
      entries.push({
        enemyId: entityId,
        igniteUntil: Number(igniteUntil.toFixed(3)),
        witherUntil: Number(witherUntil.toFixed(3)),
        focusUntil: Number(focusUntil.toFixed(3)),
        focusHitsRemaining,
      });
    }
  }
  entries.sort((a, b) => String(a.enemyId).localeCompare(String(b.enemyId)));
  return entries;
}

function getStatusIcons(entityId) {
  const effects = statusEffects.getEffects(entityId);
  return effects.map((effect) => ({
    id: effect.id,
    icon: effect.icon,
    remaining: Number(Math.max(0, effect.remainingSeconds).toFixed(3)),
    charges: effect.charges == null ? null : effect.charges,
    expiring: effect.remainingSeconds < 2,
    positive: effect.positive === true,
  }));
}

function resolveDebugEntityId(entityId) {
  const raw = String(entityId ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (raw === "arthur" || raw === STATUS_ENTITY_IDS.ARTHUR) return STATUS_ENTITY_IDS.ARTHUR;
  if (raw === "elaine" || raw === STATUS_ENTITY_IDS.ELAINE) return STATUS_ENTITY_IDS.ELAINE;
  if (raw === "willow" || raw === STATUS_ENTITY_IDS.WILLOW) return STATUS_ENTITY_IDS.WILLOW;
  if (raw === STATUS_ENTITY_IDS.TARGET) {
    const preferred = String(debugTargetEntityIdOverride || lastArthurTargetEnemyId || "").trim();
    return preferred;
  }
  return String(entityId ?? "").trim();
}

function normalizeDebugEffectId(effectId) {
  const normalized = String(effectId ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === STATUS_EFFECT_IDS.BUFF_ATTDEF || normalized === "buff" || normalized === "buff_attdef") {
    return STATUS_EFFECT_IDS.BUFF_ATTDEF;
  }
  if (normalized === STATUS_EFFECT_IDS.IGNITE_MARK || normalized === "ignite") {
    return STATUS_EFFECT_IDS.IGNITE_MARK;
  }
  if (normalized === STATUS_EFFECT_IDS.WITHER_MARK || normalized === "wither") {
    return STATUS_EFFECT_IDS.WITHER_MARK;
  }
  if (normalized === STATUS_EFFECT_IDS.FOCUS_MARK || normalized === "focus") {
    return STATUS_EFFECT_IDS.FOCUS_MARK;
  }
  if (normalized === STATUS_EFFECT_IDS.SUPPRESSION_FIELD || normalized === "suppression" || normalized === "suppression_field") {
    return STATUS_EFFECT_IDS.SUPPRESSION_FIELD;
  }
  if (normalized === STATUS_EFFECT_IDS.HEX_WEAKENED || normalized === "hex" || normalized === "hex_weakened") {
    return STATUS_EFFECT_IDS.HEX_WEAKENED;
  }
  if (normalized === STATUS_EFFECT_IDS.SILENCED_ROOTS || normalized === "silenced" || normalized === "silenced_roots") {
    return STATUS_EFFECT_IDS.SILENCED_ROOTS;
  }
  if (normalized === STATUS_EFFECT_IDS.NULL_SILENCE || normalized === "null" || normalized === "null_silence") {
    return STATUS_EFFECT_IDS.NULL_SILENCE;
  }
  if (normalized === STATUS_EFFECT_IDS.NULL_CLAMP || normalized === "null_clamp" || normalized === "clamp") {
    return STATUS_EFFECT_IDS.NULL_CLAMP;
  }
  if (normalized === STATUS_EFFECT_IDS.MEMORY_TAX || normalized === "memory_tax" || normalized === "tax") {
    return STATUS_EFFECT_IDS.MEMORY_TAX;
  }
  if (normalized === STATUS_EFFECT_IDS.REWRITE_MARK || normalized === "rewrite_mark" || normalized === "rewrite") {
    return STATUS_EFFECT_IDS.REWRITE_MARK;
  }
  return "";
}

function persistWillowStanceSettings() {
  saveState.setWillowState?.({
    activeStance: willowStance.getWillowStance(),
    autoStanceEnabled: willowStance.getAutoStanceEnabled(),
  });
}

function isWillowStanceLockedForCombat() {
  const combatActive = getEffectiveMovementContext() === "combat";
  return !willowStance.canSwitchStance({
    combatActive,
    bossInstanceActive: bossInstance.isActive(),
  });
}

function setWillowAutoStanceEnabled(enabled, { showToast = false } = {}) {
  const next = willowStance.setAutoStanceEnabled(Boolean(enabled));
  persistWillowStanceSettings();
  if (showToast) {
    setTransientMessage(next ? "Willow auto-stance: enabled." : "Willow auto-stance: disabled.", 1.1);
  }
  return next;
}

function toggleWillowAutoStanceFromUi() {
  return setWillowAutoStanceEnabled(!willowStance.getAutoStanceEnabled(), { showToast: true });
}

function setWillowStanceMode(stance, source = "manual", { showToast = true, force = false } = {}) {
  const result = willowStance.setWillowStance(stance, source, {
    nowMs: getNowMs(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossInstanceActive: bossInstance.isActive(),
    force,
  });
  if (result.changed) {
    persistWillowStanceSettings();
    if (showToast) {
      setTransientMessage(`Willow attunes: ${formatWillowStanceLabel(result.stance)}`, 1.1);
    }
  }
  return result;
}

function cycleWillowStanceManual({ showLockedToast = true, fromUi = false, requireWillowActive = true } = {}) {
  if (!hasWillowJoined()) return false;
  if (requireWillowActive && activePartyMember !== "willow") return false;
  const result = willowStance.cycleManualStance({
    nowMs: getNowMs(),
    combatActive: getEffectiveMovementContext() === "combat",
    bossInstanceActive: bossInstance.isActive(),
  });
  if (!result.changed) {
    if (showLockedToast && result.reason === "locked_combat") {
      setTransientMessage("Willow cannot shift stance in combat.", 1.0);
    }
    return false;
  }
  persistWillowStanceSettings();
  setTransientMessage(`Willow attunes: ${formatWillowStanceLabel(result.stance)}`, 1.1);
  if (fromUi) {
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
  }
  return true;
}

function canUseWillowSpells() {
  if (!hasWillowJoined()) return false;
  if (!isPlayableScene(currentSceneInfo.sceneId)) return false;
  if (sceneManager.hasBlockingUiScene()) return false;
  if (dialogueBox.isOpen()) return false;
  if (shrineSystem.isOpen()) return false;
  if (vaelorisChoicePanel.isOpen()) return false;
  if (harvesterChoicePanel.isOpen()) return false;
  if (listeningSpikeChoicePanel.isOpen()) return false;
  if (cinematicPanelOverlay.isOpen()) return false;
  if (endingChoicePanel.isOpen()) return false;
  if (creditsOverlay.isOpen()) return false;
  return true;
}

function setWillowCooldown(spellKey, seconds) {
  const key = normalizeWillowSpellKey(spellKey);
  if (!key) return;
  willowSpellCooldowns[key] = Math.max(willowSpellCooldowns[key] ?? 0, Math.max(0, Number(seconds) || 0));
}

function consumeWillowMp(amount) {
  const value = Math.max(0, Number(amount) || 0);
  if (value <= 0) return true;
  if (willowMp + 0.001 < value) return false;
  willowMp = Math.max(0, willowMp - value);
  return true;
}

function resolveWillowSpellTarget({ sourcePosition = null, maxRange = 4.4, preferLeaderTarget = true } = {}) {
  const source = sourcePosition ? sourcePosition.clone() : getWillowRuntimePosition();
  if (preferLeaderTarget) {
    const preferred = getEnemySnapshotById(lastArthurTargetEnemyId);
    if (preferred) {
      const preferredDistance = Math.hypot(preferred.x - source.x, preferred.z - source.y);
      if (preferredDistance <= maxRange + 0.001) {
        return {
          id: preferred.id,
          x: preferred.x,
          z: preferred.z,
          distance: preferredDistance,
        };
      }
    }
  }
  const nearest = combatSystem.getClosestAliveEnemy(source, maxRange);
  if (!nearest) return null;
  return {
    id: nearest.id,
    x: nearest.x,
    z: nearest.z,
    distance: nearest.distance,
  };
}

function getEnemiesWithinRadius(center, radius) {
  const safeRadius = Math.max(0.01, Number(radius) || 0.01);
  const snapshots = getAliveEnemySnapshots();
  const inRange = [];
  for (const enemy of snapshots) {
    const distance = Math.hypot(enemy.x - center.x, enemy.z - center.y);
    if (distance <= safeRadius) {
      inRange.push({
        id: enemy.id,
        x: enemy.x,
        z: enemy.z,
        distance,
      });
    }
  }
  inRange.sort((a, b) => a.distance - b.distance || String(a.id).localeCompare(String(b.id)));
  return inRange;
}

function getEnemiesInPierceLine(source, target, { range = 3.7, width = 0.66, maxTargets = 2 } = {}) {
  const direction = new THREE.Vector2(target.x - source.x, target.z - source.y);
  if (direction.lengthSq() <= 1e-6) {
    direction.set(0, 1);
  } else {
    direction.normalize();
  }
  const snapshots = getAliveEnemySnapshots();
  const candidates = [];
  for (const enemy of snapshots) {
    const toEnemy = new THREE.Vector2(enemy.x - source.x, enemy.z - source.y);
    const projected = toEnemy.dot(direction);
    if (projected < 0 || projected > range) continue;
    const perpendicularX = toEnemy.x - direction.x * projected;
    const perpendicularZ = toEnemy.y - direction.y * projected;
    const perpendicularDistance = Math.hypot(perpendicularX, perpendicularZ);
    if (perpendicularDistance > width) continue;
    candidates.push({
      id: enemy.id,
      x: enemy.x,
      z: enemy.z,
      projected,
      perpendicularDistance,
    });
  }
  candidates.sort((a, b) => a.projected - b.projected || a.perpendicularDistance - b.perpendicularDistance);
  return candidates.slice(0, Math.max(1, Math.floor(maxTargets)));
}

function applyWillowDamageToEnemy(
  enemyId,
  baseDamage,
  sourcePosition,
  { knockback = 0.36, staggerSeconds = 0.05, consumeFocus = true, extraMultiplier = 1 } = {}
) {
  const resolvedDamage = Math.max(0, Number(baseDamage) || 0) * Math.max(0, Number(extraMultiplier) || 1);
  if (resolvedDamage <= 0) return 0;
  const dealt = combatSystem.applySupportDamageToEnemy(enemyId, resolvedDamage, sourcePosition, {
    knockback,
    staggerSeconds,
    attackerId: STATUS_ENTITY_IDS.WILLOW,
    attackType: "spell",
    damageType: "arcane",
    source: "willow_spell",
    consumeStatusCharges: consumeFocus,
  });
  if (dealt > 0) {
    pacingDirector.recordDamageDealt(dealt);
    lastArthurTargetEnemyId = enemyId;
  }
  return dealt;
}

function spawnWillowSpellRing(position, color, { innerRadius = 0.34, outerRadius = 0.58, life = 0.26, opacity = 0.76, spread = 0.4 } = {}) {
  vfxSystem.spawnGroundRing?.({
    position,
    innerRadius,
    outerRadius,
    color,
    life,
    opacity,
    spread,
  });
}

function queueWillowDelayedSpell({ spell, sourcePosition, target, fromAi = false }) {
  willowPendingCasts.push({
    executeAt: Math.max(0, Number(world.elapsedSeconds) || 0) + Math.max(0.08, Number(spell.delaySeconds) || 0.08),
    spell,
    sourcePosition: sourcePosition.clone(),
    targetId: target.id,
    targetPosition: new THREE.Vector2(target.x, target.z),
    fromAi: Boolean(fromAi),
  });
}

function executeWillowDelayedSpell(cast) {
  if (!cast?.spell) return 0;
  const resolvedTarget = getEnemySnapshotById(cast.targetId);
  const center = resolvedTarget
    ? new THREE.Vector2(resolvedTarget.x, resolvedTarget.z)
    : cast.targetPosition.clone();
  const spell = cast.spell;
  const targets = getEnemiesWithinRadius(center, spell.radius ?? 0.95);
  let damage = 0;
  for (const target of targets) {
    damage += applyWillowDamageToEnemy(target.id, spell.damage, cast.sourcePosition, {
      knockback: 0.46,
      staggerSeconds: 0.08,
      consumeFocus: true,
    });
  }
  spawnWillowSpellRing(center, spell.color, {
    innerRadius: 0.42,
    outerRadius: Math.max(0.56, Number(spell.radius) || 0.56),
    life: 0.32,
    opacity: 0.78,
    spread: 0.6,
  });
  if (damage > 0) {
    aiStats.willowAoeCastCount += 1;
    if (cast.fromAi) {
      aiStats.willowSpellAiCastCount += 1;
    } else {
      aiStats.willowSpellCastCount += 1;
    }
  }
  return damage;
}

function updateWillowPendingSpells() {
  if (willowPendingCasts.length === 0) return;
  const now = Math.max(0, Number(world.elapsedSeconds) || 0);
  for (let i = willowPendingCasts.length - 1; i >= 0; i -= 1) {
    const cast = willowPendingCasts[i];
    if (now < cast.executeAt) continue;
    executeWillowDelayedSpell(cast);
    willowPendingCasts.splice(i, 1);
  }
}

function castWillowSpell(spellKey, { showFailureToast = true, fromUi = false, fromAi = false } = {}) {
  const normalizedKey = normalizeWillowSpellKey(spellKey);
  if (!normalizedKey) {
    return { started: false, reason: "invalid_key" };
  }
  if (!canUseWillowSpells()) {
    return { started: false, reason: "blocked" };
  }
  const stance = willowStance.getWillowStance();
  const spell = getWillowSpell(stance, normalizedKey);
  if (!spell) {
    return { started: false, reason: "missing_spell" };
  }
  const cooldownRemaining = Math.max(0, Number(willowSpellCooldowns[normalizedKey]) || 0);
  if (cooldownRemaining > 0.001) {
    if (showFailureToast && !fromAi) {
      setTransientMessage("Spell not ready.", 0.7);
    }
    return { started: false, reason: "cooldown" };
  }
  if (!consumeWillowMp(spell.mpCost)) {
    if (showFailureToast && !fromAi) {
      setTransientMessage("Not enough MP.", 0.7);
    }
    return { started: false, reason: "mp" };
  }

  const sourcePosition = getWillowRuntimePosition();
  const target = resolveWillowSpellTarget({
    sourcePosition,
    maxRange: spell.range ?? 4.4,
    preferLeaderTarget: fromAi || activePartyMember !== "willow",
  });
  if (!target) {
    willowMp = Math.min(willowMaxMp, willowMp + spell.mpCost);
    if (showFailureToast && !fromAi) {
      setTransientMessage("No target", 0.75);
    }
    return { started: false, reason: "no_target" };
  }

  let damageDealt = 0;
  let debuffApplied = false;
  if (spell.type === "projectile") {
    const bonusMarked = spell.markedBonusMultiplier && isWillowTargetMarked(target.id) ? spell.markedBonusMultiplier : 1;
    partySystem.spawnProjectile(sourcePosition, new THREE.Vector2(target.x, target.z), {
      color: spell.color,
      lifetime: 0.2,
      baseY: -0.43,
      arcHeight: 0.05,
      scale: 0.16,
      renderBase: 1210,
    });
    damageDealt = applyWillowDamageToEnemy(target.id, spell.damage, sourcePosition, {
      knockback: spell.knockback ?? 0.34,
      staggerSeconds: 0.05,
      consumeFocus: true,
      extraMultiplier: bonusMarked,
    });
  } else if (spell.type === "spread") {
    const center = new THREE.Vector2(target.x, target.z);
    const candidates = getEnemiesWithinRadius(center, 1.45);
    const targets = candidates.length > 0 ? candidates.slice(0, spell.pellets ?? 3) : [target];
    for (let i = 0; i < targets.length; i += 1) {
      const candidate = targets[i];
      const falloff = i === 0 ? 1 : 0.84;
      partySystem.spawnProjectile(sourcePosition, new THREE.Vector2(candidate.x, candidate.z), {
        color: spell.color,
        lifetime: 0.18,
        baseY: -0.43,
        arcHeight: 0.04,
        scale: 0.15,
        renderBase: 1210,
      });
      damageDealt += applyWillowDamageToEnemy(candidate.id, spell.damage * falloff, sourcePosition, {
        knockback: 0.28,
        staggerSeconds: 0.03,
        consumeFocus: true,
      });
    }
  } else if (spell.type === "aoe") {
    const center = new THREE.Vector2(target.x, target.z);
    const victims = getEnemiesWithinRadius(center, spell.radius ?? 0.8);
    for (const victim of victims) {
      damageDealt += applyWillowDamageToEnemy(victim.id, spell.damage, sourcePosition, {
        knockback: 0.42,
        staggerSeconds: 0.07,
        consumeFocus: true,
      });
    }
    spawnWillowSpellRing(center, spell.color, {
      innerRadius: 0.36,
      outerRadius: Math.max(0.5, Number(spell.radius) || 0.5),
      life: 0.24,
      opacity: 0.76,
      spread: 0.42,
    });
  } else if (spell.type === "aoe_delayed") {
    queueWillowDelayedSpell({
      spell,
      sourcePosition,
      target,
      fromAi,
    });
    spawnWillowSpellRing(new THREE.Vector2(target.x, target.z), spell.color, {
      innerRadius: 0.3,
      outerRadius: Math.max(0.46, Number(spell.radius) || 0.46),
      life: Math.max(0.2, Number(spell.delaySeconds) || 0.2),
      opacity: 0.42,
      spread: 0.18,
    });
  } else if (spell.type === "pierce") {
    const victims = getEnemiesInPierceLine(sourcePosition, target, {
      range: spell.range,
      width: spell.width,
      maxTargets: spell.maxTargets,
    });
    if (victims.length === 0) {
      victims.push(target);
    }
    for (const victim of victims) {
      damageDealt += applyWillowDamageToEnemy(victim.id, spell.damage, sourcePosition, {
        knockback: 0.32,
        staggerSeconds: 0.04,
        consumeFocus: true,
      });
    }
    spawnWillowSpellRing(new THREE.Vector2(target.x, target.z), spell.color, {
      innerRadius: 0.24,
      outerRadius: 0.42,
      life: 0.2,
      opacity: 0.56,
      spread: 0.18,
    });
  } else if (spell.type === "debuff") {
    debuffApplied = applyWillowDebuff(target.id, spell.debuffId, spell.durationSeconds);
    damageDealt = applyWillowDamageToEnemy(target.id, 3.2, sourcePosition, {
      knockback: 0.25,
      staggerSeconds: 0.02,
      consumeFocus: spell.debuffId !== "focus",
    });
    spawnWillowSpellRing(new THREE.Vector2(target.x, target.z), spell.color, {
      innerRadius: 0.28,
      outerRadius: 0.44,
      life: 0.22,
      opacity: 0.68,
      spread: 0.26,
    });
  }

  if (!debuffApplied && damageDealt <= 0 && spell.type !== "aoe_delayed") {
    willowMp = Math.min(willowMaxMp, willowMp + spell.mpCost);
    return { started: false, reason: "no_effect" };
  }

  setWillowCooldown(normalizedKey, spell.cooldownSeconds);
  if (spell.type === "debuff") {
    aiStats.willowMarkCastCount += 1;
  }
  if (spell.type === "aoe" || spell.type === "aoe_delayed") {
    aiStats.willowAoeCastCount += 1;
  }
  if (fromAi) {
    aiStats.willowSpellAiCastCount += 1;
  } else {
    aiStats.willowSpellCastCount += 1;
  }
  willowSpellCastFlashRemaining = Math.max(
    willowSpellCastFlashRemaining,
    spell.type === "aoe_delayed" ? 0.18 : 0.22
  );
  if (fromUi) {
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
  }
  return {
    started: true,
    spellId: spell.id,
    spellName: spell.name,
    stance,
    key: normalizedKey,
    damageDealt: Number(damageDealt.toFixed(3)),
    debuffApplied,
  };
}

function handleWillowSpellUiTap(spellKey) {
  const outcome = castWillowSpell(spellKey, {
    showFailureToast: true,
    fromUi: true,
    fromAi: false,
  });
  return Boolean(outcome?.started);
}

function handleWillowSpellKey(event) {
  const key = normalizeWillowSpellKey(event.key);
  if (!key) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (!canProcessGameplayInput(event)) return false;
  if (!canUseWillowSpells()) return false;
  castWillowSpell(key, {
    showFailureToast: !event.repeat,
    fromUi: false,
    fromAi: false,
  });
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function isWillowBossObjectiveNearby() {
  if (currentSceneInfo.sceneId !== "hollowScar") return false;
  if (hasVeinGuardianDefeated()) return false;
  if (!hasVeinQuestComplete()) return false;
  const distance = Math.hypot(
    player.position.x - GUARDIAN_TRIGGER_CENTER.x,
    player.position.z - GUARDIAN_TRIGGER_CENTER.y
  );
  return distance <= GUARDIAN_TRIGGER_RADIUS + 1.8;
}

function updateWillowAutoStance(deltaSeconds, { freezeInput = false } = {}) {
  willowAutoBanterCooldown = Math.max(0, willowAutoBanterCooldown - Math.max(0, Number(deltaSeconds) || 0));
  if (!hasWillowJoined()) return;
  if (!willowStance.getAutoStanceEnabled()) return;
  if (freezeInput) return;
  if (!isPlayableScene(currentSceneInfo.sceneId)) return;
  if (
    dialogueBox.isOpen() ||
    shrineSystem.isOpen() ||
    vaelorisChoicePanel.isOpen() ||
    harvesterChoicePanel.isOpen() ||
    listeningSpikeChoicePanel.isOpen()
  ) {
    return;
  }
  if (getEffectiveMovementContext() === "combat" || bossInstance.isActive() || guardianCombatForced) return;

  const plannedStance = planWillowAutoStance({
    crownTier: crownMood.getTierLabel(),
    bossObjectiveNearby: isWillowBossObjectiveNearby(),
  });
  const result = willowStance.setWillowStance(plannedStance, "auto", {
    nowMs: getNowMs(),
    combatActive: false,
    bossInstanceActive: bossInstance.isActive(),
  });
  if (!result.changed) return;

  persistWillowStanceSettings();
  if (willowAutoBanterCooldown <= 0 && transientMessageSeconds <= 0.01) {
    setTransientMessage(getWillowAutoStanceBanter(result.stance), 1.2);
    willowAutoBanterCooldown = WILLOW_AUTO_BANTER_COOLDOWN_SECONDS;
  }
}

function updateWillowSupportAi(deltaSeconds, { allowAi = true, combatActive = false } = {}) {
  if (!allowAi || !hasWillowJoined()) return;
  if (activePartyMember === "willow") return;
  if (!combatActive) return;
  if (guardianCombatForced || bossInstance.isActive()) return;
  if (!canUseWillowSpells()) return;

  const stance = willowStance.getWillowStance();
  const spellSet = getWillowSpellSet(stance);
  const sourcePosition = getWillowRuntimePosition();
  const enemies = getAliveEnemySnapshots();
  if (enemies.length === 0) return;

  const nearbyEnemies = enemies.filter(
    (enemy) => Math.hypot(enemy.x - sourcePosition.x, enemy.z - sourcePosition.y) <= 1.25
  );
  const highestThreat = [...enemies].sort((a, b) => b.maxHealth - a.maxHealth || b.health - a.health)[0] ?? null;
  const canCastK =
    (willowSpellCooldowns.k ?? 0) <= 0.001 && willowMp + 0.001 >= (spellSet.k?.mpCost ?? Number.POSITIVE_INFINITY);
  const canCastL =
    (willowSpellCooldowns.l ?? 0) <= 0.001 && willowMp + 0.001 >= (spellSet.l?.mpCost ?? Number.POSITIVE_INFINITY);

  if (nearbyEnemies.length >= 2 && canCastK) {
    castWillowSpell("k", {
      showFailureToast: false,
      fromUi: false,
      fromAi: true,
    });
    return;
  }

  const eliteLike = highestThreat && (highestThreat.role === "brute" || highestThreat.role === "construct" || highestThreat.maxHealth >= 60);
  if (eliteLike && canCastL) {
    castWillowSpell("l", {
      showFailureToast: false,
      fromUi: false,
      fromAi: true,
    });
  }
}

function getAliveEnemySnapshots() {
  return (combatSystem.getEnemySnapshots?.() ?? []).filter((enemy) => enemy.state !== "dead" && enemy.health > 0);
}

function getEnemySnapshotById(enemyId) {
  if (!enemyId) return null;
  return (combatSystem.getEnemySnapshots?.() ?? []).find(
    (enemy) => enemy.id === enemyId && enemy.state !== "dead" && enemy.health > 0
  ) ?? null;
}

function resolveHudTarget() {
  if (
    !isPlayableScene(currentSceneInfo.sceneId) ||
    sceneManager.hasBlockingUiScene() ||
    getEffectiveMovementContext() !== "combat"
  ) {
    return null;
  }
  let candidateId = String(debugTargetEntityIdOverride ?? "");
  if (candidateId && !getEnemySnapshotById(candidateId)) {
    debugTargetEntityIdOverride = "";
    candidateId = "";
  }
  if (!candidateId && lastMovementInfo.attackEvents?.length) {
    candidateId = String(lastMovementInfo.attackEvents[0].targetEnemyId ?? "");
  }
  if (!candidateId && lastArthurTargetEnemyId) {
    candidateId = String(lastArthurTargetEnemyId);
  }
  if (!candidateId) return null;
  const targetEnemy = getEnemySnapshotById(candidateId);
  if (!targetEnemy) return null;
  return {
    active: true,
    id: targetEnemy.id,
    name: targetEnemy.role ? targetEnemy.role[0].toUpperCase() + targetEnemy.role.slice(1) : "Target",
    hp: targetEnemy.health,
    maxHp: targetEnemy.maxHealth,
  };
}

function getArthurAiChargeThreshold(mode) {
  if (mode === "aggressive") return 0.42;
  if (mode === "defensive") return 0.88;
  return 0.64;
}

function getArthurAiChargeBuildRate(mode) {
  if (mode === "aggressive") return 1.35;
  if (mode === "defensive") return 0.74;
  return 1.02;
}

function buildArthurAiAttackEvent(target, type = "light", chargeRatio = 0, sourcePosition = null) {
  const sourceX = Number(sourcePosition?.x) || player.position.x;
  const sourceZ = Number(sourcePosition?.z ?? sourcePosition?.y) || player.position.z;
  const direction = new THREE.Vector2(target.x - sourceX, target.z - sourceZ);
  if (direction.lengthSq() <= 1e-6) {
    direction.copy(playerFacingVector);
  }
  if (direction.lengthSq() <= 1e-6) {
    direction.set(0, 1);
  } else {
    direction.normalize();
  }

  if (type === "charge") {
    return {
      type: "charge",
      chargeRatio: clamp01(chargeRatio),
      range: 2.28,
      minDot: -0.15,
      direction,
      targetEnemyId: target.id ?? null,
      attackerId: STATUS_ENTITY_IDS.ARTHUR,
      damageType: "physical",
      windupSeconds: ATTACK_SWING_PROFILES.charge.windupSeconds,
      activeSeconds: ATTACK_SWING_PROFILES.charge.activeSeconds,
      recoverySeconds: ATTACK_SWING_PROFILES.charge.recoverySeconds,
      damageMultiplier: playerHeavyDamageMultiplier,
      sourcePosition: { x: sourceX, z: sourceZ },
    };
  }

  return {
    type: "light",
    comboStep: 1,
    range: 1.25,
    minDot: -0.05,
    direction,
    targetEnemyId: target.id ?? null,
    attackerId: STATUS_ENTITY_IDS.ARTHUR,
    damageType: "physical",
    windupSeconds: ATTACK_SWING_PROFILES.light.windupSeconds,
    activeSeconds: ATTACK_SWING_PROFILES.light.activeSeconds,
    recoverySeconds: ATTACK_SWING_PROFILES.light.recoverySeconds,
    sourcePosition: { x: sourceX, z: sourceZ },
  };
}

function updateArthurInactiveAi(deltaSeconds, { allowAi = true } = {}) {
  if (!allowAi) return [];
  if (!hasElaineJoined() || arthurDowned || (activePartyMember !== "elaine" && activePartyMember !== "willow")) {
    return [];
  }

  arthurAiAttackCooldown = Math.max(0, arthurAiAttackCooldown - deltaSeconds);
  const tacticsMode = getTacticsMode();
  arthurAiChargeMeter = clamp01(arthurAiChargeMeter + deltaSeconds * getArthurAiChargeBuildRate(tacticsMode));

  const enemies = getAliveEnemySnapshots();
  if (enemies.length === 0 || arthurAiAttackCooldown > 0) {
    return [];
  }

  const partyAiState = partySystem.getAiState?.() ?? { members: [] };
  const arthurAiMember = partyAiState.members?.find((member) => member.id === "arthur") ?? null;
  const arthurX = Number(arthurAiMember?.x) || player.position.x;
  const arthurZ = Number(arthurAiMember?.z) || player.position.z;
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let interceptTarget = null;
  const aiThreatId = String(arthurAiMember?.threatId ?? "");
  if (aiThreatId) {
    interceptTarget = enemies.find((enemy) => enemy.id === aiThreatId) ?? null;
  }

  for (const enemy of enemies) {
    const distance = Math.hypot(enemy.x - arthurX, enemy.z - arthurZ);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  if (!interceptTarget) {
    for (const enemy of enemies) {
      const distance = Math.hypot(enemy.x - arthurX, enemy.z - arthurZ);
      if (distance <= ARTHUR_AI_INTERCEPT_RADIUS) {
        interceptTarget = enemy;
        break;
      }
    }
  }

  const target = interceptTarget ?? nearest;
  if (!target) return [];
  if (nearestDistance > ARTHUR_AI_CHARGE_RANGE + 0.75) return [];

  const chargeThreshold = getArthurAiChargeThreshold(tacticsMode);
  const useCharge = nearestDistance <= ARTHUR_AI_CHARGE_RANGE && arthurAiChargeMeter >= chargeThreshold;
  if (useCharge) {
    const event = buildArthurAiAttackEvent(target, "charge", arthurAiChargeMeter, { x: arthurX, z: arthurZ });
    arthurAiChargeMeter = 0;
    arthurAiAttackCooldown = ARTHUR_AI_CHARGE_COOLDOWN;
    aiStats.arthurHeavyCount += 1;
    if (interceptTarget) {
      aiStats.arthurInterceptCount += 1;
    }
    lastArthurTargetEnemyId = target.id ?? "";
    return [event];
  }

  if (nearestDistance <= ARTHUR_AI_LIGHT_RANGE) {
    const event = buildArthurAiAttackEvent(target, "light", 0, { x: arthurX, z: arthurZ });
    arthurAiAttackCooldown = ARTHUR_AI_LIGHT_COOLDOWN;
    aiStats.arthurLightCount += 1;
    if (interceptTarget) {
      aiStats.arthurInterceptCount += 1;
    }
    lastArthurTargetEnemyId = target.id ?? "";
    return [event];
  }

  return [];
}

function updateElaineSupportAi(deltaSeconds, { allowAi = true, combatActive = false } = {}) {
  if (!allowAi || !hasElaineJoined() || elaineDowned) return;

  const canRunSupportAi = activePartyMember !== "elaine" || arthurDowned;
  if (!canRunSupportAi) return;
  if (!canUseElaineSpells()) return;
  const bossFightActive = guardianCombatForced || bossInstance.isActive();

  const arthurHpRatio = playerState.hp / Math.max(1, playerState.maxHP);
  const elaineHpRatio = elaineHp / Math.max(1, elaineMaxHp);
  const alliesBelowSeventy = Number(arthurHpRatio < 0.7) + Number(elaineHpRatio < 0.7);
  const enemiesAlive = getAliveEnemySnapshots().length;

  if (arthurDowned) {
    if (tryStartElaineSpell(ELAINE_SPELLS.resurrect, { showFailureToast: false })) {
      aiStats.elaineResCount += 1;
      return;
    }
  }

  if ((arthurHpRatio < 0.35 || elaineHpRatio < 0.35) && !elaineSpellCast) {
    if (tryStartElaineSpell(ELAINE_SPELLS.singleHeal, { showFailureToast: false })) {
      aiStats.elaineHealCount += 1;
      return;
    }
  }

  if (alliesBelowSeventy >= 2 && !elaineSpellCast) {
    if (tryStartElaineSpell(ELAINE_SPELLS.groupHeal, { showFailureToast: false })) {
      aiStats.elaineGroupHealCount += 1;
      return;
    }
  }

  const issuingDirectCommands =
    lastMovementInfo.isMoving ||
    lastMovementInfo.charging ||
    Boolean(lastMovementInfo.target) ||
    (lastMovementInfo.attackEvents?.length ?? 0) > 0;
  const stableForBossBuff =
    !arthurDowned &&
    arthurHpRatio >= 0.88 &&
    elaineHpRatio >= 0.88 &&
    !issuingDirectCommands &&
    !elaineSpellCast;
  const allowBuff = !bossFightActive || stableForBossBuff;
  if (allowBuff && enemiesAlive >= 2 && !hasElaineAttDefBuff() && !elaineSpellCast) {
    if (tryStartElaineSpell(ELAINE_SPELLS.blessing, { showFailureToast: false })) {
      aiStats.elaineBuffCount += 1;
      return;
    }
  }

  if (bossFightActive) return;
  if (!combatActive || arthurDowned) return;

  const boltMultiplier = 1;
  const fallbackTarget = combatSystem.getClosestAliveEnemy(
    new THREE.Vector2(player.position.x, player.position.z),
    3.3
  );
  const boltDamage = partySystem.triggerHolyBolt(
    lastArthurTargetEnemyId || fallbackTarget?.id || null,
    fallbackTarget ? { x: fallbackTarget.x, y: fallbackTarget.z } : { x: player.position.x, y: player.position.z },
    boltMultiplier
  );
  if (boltDamage > 0) {
    aiStats.elaineHolyBoltCount += 1;
    pacingDirector.recordDamageDealt(boltDamage);
  }
}

function updateGuidanceLine() {
  currentObjectiveState = resolveStoryObjectiveState();
  const persistedObjectiveId = getCurrentObjectiveId();
  if (persistedObjectiveId !== currentObjectiveState.id) {
    setCurrentObjectiveId(currentObjectiveState.id);
  }
  const emberfallUnlocked = isEmberfallUnlocked();
  const willowJoined = hasWillowJoined();
  const harvesterDefeated = hasHarvesterBossDefeated();
  const harvesterChoiceResolved = getHarvesterChoice() !== HARVESTER_CHOICE_VALUES.NONE;
  const act2FalloutPending = harvesterChoiceResolved && !hasAct2FalloutDone();
  const ridgeTrailActive = isRidgeGateUnlocked()
    && (hasChapter5AftershockDone() ? !hasVaelorisPatrolSetpieceDone() : !hasVaelorisPatrolClearedOnce());
  const ridgePathReady = isRidgeGateUnlocked()
    && (hasChapter5AftershockDone() ? hasVaelorisPatrolSetpieceDone() : hasVaelorisPatrolClearedOnce());
  const bossState = bossInstance.getState();
  const harvesterBossActive = Boolean(
    (hasHarvesterBossActive() || (bossState?.active && bossState?.bossId === HARVESTER_WARDEN_BOSS_ID)) &&
      !harvesterChoiceResolved
  );
  const harvesterAvailable =
    currentSceneInfo.sceneId === "emberfall" &&
    hasVeinGuardianDefeated() &&
    hasHarvesterSiteUnlocked() &&
    !harvesterDefeated &&
    !harvesterChoiceResolved;
  const harvesterPostChoice = harvesterDefeated && harvesterChoiceResolved;
  const guidanceVisible =
    currentObjectiveState.id !== OBJECTIVE_IDS.NONE ||
    hasPartyCompanionJoined() ||
    hasVeinQuestActive() ||
    lastVeinFrame.active ||
    hasVeinGuardianDefeated() ||
    vaelorisExtractorPromptVisible ||
    emberfallUnlocked ||
    harvesterAvailable ||
    harvesterBossActive ||
    harvesterPostChoice ||
    act2FalloutPending ||
    ridgeTrailActive ||
    ridgePathReady;
  guidanceLineText = guidanceDirector.update({
    objectiveId: currentObjectiveState.id,
    elaineJoined: hasElaineJoined(),
    willowJoined,
    emberfallUnlocked,
    emberfallHint: emberfallUnlocked && currentSceneInfo.sceneId === "thornmere" && !willowJoined,
    veinActive: lastVeinFrame.active,
    veinQuestActive: hasVeinQuestActive() && !hasVeinQuestComplete(),
    bossActive: guardianCombatForced || bossInstance.isActive(),
    shrinePromptVisible: Boolean(shrineSystem.getPromptText()),
    hasRelicShard: relicShardCount > 0 && hasVeinGuardianDefeated(),
    vaelorisPrompt: vaelorisExtractorPromptVisible,
    harvesterAvailable,
    harvesterBossActive,
    harvesterBossDefeated: harvesterDefeated,
    harvesterPostChoice,
    act2FalloutPending,
    ridgeTrailActive,
    ridgePathReady,
  });
  if (currentObjectiveState.id !== OBJECTIVE_IDS.NONE) {
    guidanceLineText = currentObjectiveState.hudLine || getObjectiveHudLine(currentObjectiveState.id);
  }
  if (!guidanceVisible) {
    guidanceLineText = "";
  }
}

function resolveBanterObjectiveContext() {
  const objectiveState = resolveStoryObjectiveState();
  currentObjectiveState = objectiveState;
  const harvesterDefeated = hasHarvesterBossDefeated();
  const harvesterChoiceResolved = getHarvesterChoice() !== HARVESTER_CHOICE_VALUES.NONE;
  const bossAvailable =
    currentSceneInfo.sceneId === "emberfall" &&
    hasVeinGuardianDefeated() &&
    hasHarvesterSiteUnlocked() &&
    !harvesterDefeated &&
    !harvesterChoiceResolved &&
    !bossInstance.isActive();
  const ridgeGateUnlocked = isRidgeGateUnlocked();
  const ridgePatrolCleared = hasChapter5AftershockDone() ? hasVaelorisPatrolSetpieceDone() : hasVaelorisPatrolClearedOnce();
  const patrolNearby =
    currentSceneInfo.sceneId === "thornmere" &&
    Boolean(vaelorisPatrolFrame.active || vaelorisPatrolFrame.insideZone);
  let activeObjective = objectiveState.id;
  let objectiveProgressKey = objectiveState.progressKey;
  if (activeObjective === OBJECTIVE_IDS.NONE && lastVeinFrame.active) {
    activeObjective = "vein";
    objectiveProgressKey = [
      "vein",
      lastVeinFrame.activeVeinId ?? "",
      lastVeinFrame.state ?? "",
      lastVeinFrame.waveIndex ?? 0,
      lastVeinFrame.enemiesRemaining ?? 0,
    ].join(":");
  } else if (activeObjective === OBJECTIVE_IDS.NONE && bossAvailable) {
    activeObjective = "boss";
    objectiveProgressKey = `boss:${currentSceneInfo.sceneId}:${Number(hasVeinGuardianDefeated())}:${Number(
      harvesterDefeated
    )}`;
  } else if (
    activeObjective === OBJECTIVE_IDS.NONE &&
    (patrolNearby || (ridgeGateUnlocked && !ridgePatrolCleared))
  ) {
    activeObjective = "patrol";
    objectiveProgressKey = [
      "patrol",
      Number(Boolean(vaelorisPatrolFrame.active)),
      Number(Boolean(vaelorisPatrolFrame.insideZone)),
      Number(ridgePatrolCleared),
      Number(hasVaelorisTagObtained()),
      (vaelorisPatrolFrame.enemyIds?.length ?? 0).toString(),
    ].join(":");
  } else if (activeObjective === OBJECTIVE_IDS.NONE && ridgeGateUnlocked) {
    activeObjective = "ridge";
    objectiveProgressKey = `ridge:${currentSceneInfo.sceneId}:${Number(ridgeGateUnlocked)}:${Number(
      ridgePatrolCleared
    )}`;
  }
  return {
    activeObjective,
    objectiveProgressKey,
    objectiveState,
    veinActive: Boolean(lastVeinFrame.active),
    bossAvailable,
    ridgeGateUnlocked,
    patrolNearby,
  };
}

function resetObjectiveTelemetry(telemetryKey = "") {
  objectiveDistanceNow = null;
  objectiveDistancePrev = null;
  objectiveOffTrackSeconds = 0;
  objectiveTravelingSeconds = 0;
  objectiveIdleSeconds = 0;
  objectiveOnTrack = false;
  objectiveTelemetryKey = telemetryKey || `${OBJECTIVE_IDS.NONE}:${currentSceneInfo.sceneId}`;
}

function updateObjectiveTelemetry(deltaSeconds, objectiveState, { stationary = false } = {}) {
  const dt = Math.max(0, Number(deltaSeconds) || 0);
  const objectiveId = normalizeObjectiveId(objectiveState?.id ?? OBJECTIVE_IDS.NONE);
  const hint = objectiveState?.hint ?? getObjectiveHint(objectiveId);
  const hintSceneId = hint?.sceneId ?? "none";
  const telemetryKey = `${objectiveId}:${hintSceneId}:${currentSceneInfo.sceneId}`;
  if (telemetryKey !== objectiveTelemetryKey) {
    resetObjectiveTelemetry(telemetryKey);
  }

  if (objectiveId === OBJECTIVE_IDS.NONE || !hint || hintSceneId !== currentSceneInfo.sceneId) {
    objectiveDistancePrev = objectiveDistanceNow;
    objectiveDistanceNow = null;
    objectiveOnTrack = false;
    objectiveOffTrackSeconds = 0;
    if (stationary) {
      objectiveIdleSeconds += dt;
      objectiveTravelingSeconds = 0;
    } else {
      objectiveIdleSeconds = 0;
      objectiveTravelingSeconds += dt;
    }
    return;
  }

  const distanceNow = Math.hypot(player.position.x - hint.x, player.position.z - hint.z);
  const previousDistance = Number.isFinite(objectiveDistanceNow) ? objectiveDistanceNow : distanceNow;
  const delta = previousDistance - distanceNow;

  objectiveDistancePrev = previousDistance;
  objectiveDistanceNow = distanceNow;

  if (stationary) {
    objectiveIdleSeconds += dt;
    objectiveTravelingSeconds = 0;
    return;
  }

  objectiveIdleSeconds = 0;
  objectiveTravelingSeconds += dt;

  if (delta > PARTY_BANTER_PROGRESS_EPSILON) {
    objectiveOnTrack = true;
    objectiveOffTrackSeconds = Math.max(0, objectiveOffTrackSeconds - dt * 1.3);
  } else if (delta < -PARTY_BANTER_PROGRESS_EPSILON) {
    objectiveOnTrack = false;
    objectiveOffTrackSeconds += dt;
  } else {
    objectiveOnTrack = objectiveOffTrackSeconds <= 0.001;
  }
}

function formatBanterDisplayLine(event = null) {
  if (!event) return "";
  const line = String(event.displayText ?? "").trim();
  if (line) return line;
  const speaker = String(event.speakerLabel ?? "").trim();
  const text = String(event.text ?? "").trim();
  if (!text) return "";
  return speaker ? `${speaker}: ${text}` : text;
}

function persistBanterStateIfDirty() {
  const persisted = banterDirector.consumePersistState?.();
  if (persisted) {
    saveState.setBanterState?.(persisted);
  }
}

function commitBanterEvent(event, { forceToast = false } = {}) {
  if (!event) return "";
  const line = formatBanterDisplayLine(event);
  if (!line) return "";
  partyChat.addLine(line, {
    channel: event.channel === "guidance" ? "guidance" : "lore",
    lifetimeSeconds: event.channel === "guidance" ? 11 : 10,
  });
  if ((forceToast || event.useToast) && transientMessageSeconds <= 0.001) {
    setTransientMessage(line, 2.1);
  }
  persistBanterStateIfDirty();
  return line;
}

function buildBanterContext({ deltaSeconds = 0, freezeInput = false, contextOverrideKey = "" } = {}) {
  const movementStationary =
    !freezeInput &&
    !lastMovementInfo.isMoving &&
    !lastMovementInfo.charging &&
    !lastMovementInfo.target;
  const combatActive = getEffectiveMovementContext() === "combat";
  const bossActive = guardianCombatForced || bossInstance.isActive();
  const chapter9HighUrgency =
    hasChapter9Started() &&
    !hasChapter9NullArchivistDefeated() &&
    (chapter9SetpieceState.active ||
      chapter9SetpieceState.sunderActive ||
      chapter9SetpieceState.channeling ||
      chapter9SetpieceState.lorePending ||
      chapter9SetpieceState.choicePending);
  const endgameAct1HighUrgency =
    (thirdSealQuestState.active ||
      thirdSealQuestState.channeling ||
      spireBreachState.active ||
      spireBreachState.channeling ||
      Boolean(getStoryFlag("endgame_spire_gatewarden_active")));
  const endgameAct2HighUrgency =
    currentSceneInfo.sceneId === "inner_spire" &&
    (Boolean(getResonanceChannelState()) ||
      isNearLoomPrismPillarInteraction() ||
      Boolean(getStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE)));
  const endgameAct3HighUrgency =
    currentSceneInfo.sceneId === "last_spire" &&
    (Boolean(lastSpireState.riftChanneling) ||
      Boolean(lastSpireState.coreChanneling) ||
      Boolean(getStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE)));
  const blocked =
    combatActive ||
    bossActive ||
    chapter9HighUrgency ||
    endgameAct1HighUrgency ||
    endgameAct2HighUrgency ||
    endgameAct3HighUrgency ||
    freezeInput ||
    dialogueBox.isOpen() ||
    sceneManager.hasBlockingUiScene() ||
    sceneManager.isTitleSceneActive() ||
    sceneManager.isStartSceneActive() ||
    currentSceneInfo.sceneId === "start";
  const partyMembersPresent = ["arthur"];
  if (hasElaineJoined()) {
    partyMembersPresent.push("elaine");
  }
  if (hasWillowJoined()) {
    partyMembersPresent.push("willow");
  }
  const inactiveMembers = partyMembersPresent.filter((memberId) => memberId !== activePartyMember);
  const objectiveContext = resolveBanterObjectiveContext();
  updateObjectiveTelemetry(deltaSeconds, objectiveContext.objectiveState, {
    stationary: movementStationary,
  });
  const objectiveDistanceDelta =
    Number.isFinite(objectiveDistancePrev) && Number.isFinite(objectiveDistanceNow)
      ? objectiveDistancePrev - objectiveDistanceNow
      : 0;
  const offTrackByDistance = objectiveDistanceDelta < -PARTY_BANTER_PROGRESS_EPSILON;
  const offTrack = objectiveOffTrackSeconds >= PARTY_BANTER_OFFTRACK_SECONDS || offTrackByDistance;
  const objectiveOnTrackResolved =
    Number.isFinite(objectiveDistanceNow) && Number.isFinite(objectiveDistancePrev) ? objectiveOnTrack : false;
  return {
    enabled: partyMembersPresent.length > 1,
    stationary: movementStationary,
    blocked,
    toastBusy: transientMessageSeconds > 0.001,
    combatActive,
    bossActive,
    idleSeconds: Number(Math.max(0, objectiveIdleSeconds).toFixed(3)),
    travelingSeconds: Number(Math.max(0, objectiveTravelingSeconds).toFixed(3)),
    offTrackSeconds: Number(Math.max(0, objectiveOffTrackSeconds).toFixed(3)),
    offTrack,
    onTrack: objectiveOnTrackResolved,
    objectiveDistanceNow: Number.isFinite(objectiveDistanceNow) ? Number(objectiveDistanceNow.toFixed(3)) : null,
    objectiveDistancePrev: Number.isFinite(objectiveDistancePrev) ? Number(objectiveDistancePrev.toFixed(3)) : null,
    activeObjective: objectiveContext.activeObjective,
    objectiveProgressKey: objectiveContext.objectiveProgressKey,
    crownTier: crownMood.getTierLabel(),
    sceneId: currentSceneInfo.sceneId,
    activeCharacterId: activePartyMember,
    playerPosition: {
      x: player.position.x,
      z: player.position.z,
    },
    partyMembersPresent,
    inactiveMembers,
    availableSpeakers: inactiveMembers,
    storyFlags: saveState.getStoryFlags(),
    contextOverrideKey: String(contextOverrideKey ?? ""),
    veinActive: objectiveContext.veinActive,
    bossAvailable: objectiveContext.bossAvailable,
    ridgeGateUnlocked: objectiveContext.ridgeGateUnlocked,
    patrolNearby: objectiveContext.patrolNearby,
    worldTimeSeconds: world.elapsedSeconds,
  };
}

function updateIdleBanter(deltaSeconds, { freezeInput = false } = {}) {
  const context = buildBanterContext({ deltaSeconds, freezeInput });
  const event = banterDirector.update(deltaSeconds, context);
  if (event) {
    commitBanterEvent(event);
  } else {
    persistBanterStateIfDirty();
  }
}

function resolveCombatDamageTarget(targetEntityIdOverride = "") {
  const requested = String(targetEntityIdOverride ?? "").trim().toLowerCase();
  if (requested === STATUS_ENTITY_IDS.ELAINE && hasElaineJoined() && !elaineDowned) {
    return STATUS_ENTITY_IDS.ELAINE;
  }
  if (requested === STATUS_ENTITY_IDS.WILLOW && hasWillowJoined()) {
    return activePartyMember === "willow" ? STATUS_ENTITY_IDS.WILLOW : STATUS_ENTITY_IDS.ARTHUR;
  }
  if (requested === STATUS_ENTITY_IDS.ARTHUR) {
    return STATUS_ENTITY_IDS.ARTHUR;
  }
  return getActiveControlledEntityId();
}

function buildEnemyThreatTargets() {
  const partySnapshot = partySystem.getState?.() ?? {};
  const targets = [];
  const arthurPosition =
    activePartyMember === "arthur"
      ? { x: player.position.x, z: player.position.z }
      : partySnapshot.arthurProxy ?? { x: player.position.x, z: player.position.z };
  targets.push({
    id: STATUS_ENTITY_IDS.ARTHUR,
    x: arthurPosition.x,
    z: arthurPosition.z,
    hp: playerState.hp,
    maxHp: playerState.maxHP,
    effectiveHp: playerState.hp / Math.max(0.65, statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.ARTHUR)),
    defense: statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.ARTHUR),
    threatScore: activePartyMember === "arthur" ? 1.2 : 1,
    hexPriority: 0.85,
    squishy: false,
    active: activePartyMember === "arthur",
    alive: !arthurDowned,
  });

  if (hasElaineJoined() && !elaineDowned) {
    const elainePosition =
      activePartyMember === "elaine"
        ? { x: player.position.x, z: player.position.z }
        : partySnapshot.follower ?? { x: arthurPosition.x + 0.4, z: arthurPosition.z + 0.4 };
    const mpUsage = 1 - elaineMp / Math.max(1, elaineMaxMp);
    targets.push({
      id: STATUS_ENTITY_IDS.ELAINE,
      x: elainePosition.x,
      z: elainePosition.z,
      hp: elaineHp,
      maxHp: elaineMaxHp,
      effectiveHp: elaineHp / Math.max(0.65, statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.ELAINE)),
      defense: statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.ELAINE),
      threatScore: activePartyMember === "elaine" ? 1.18 : 0.96,
      hexPriority: 1.25 + mpUsage * 0.45 + (elaineSpellCast ? 0.25 : 0),
      squishy: true,
      active: activePartyMember === "elaine",
      alive: true,
    });
  }

  if (hasWillowJoined()) {
    const willowPosition =
      activePartyMember === "willow"
        ? { x: player.position.x, z: player.position.z }
        : partySnapshot.willowFollower ?? null;
    if (willowPosition) {
      const mpUsage = 1 - willowMp / Math.max(1, willowMaxMp);
      const willowHp = activePartyMember === "willow" ? playerState.hp : 100;
      targets.push({
        id: STATUS_ENTITY_IDS.WILLOW,
        x: willowPosition.x,
        z: willowPosition.z,
        hp: willowHp,
        maxHp: 100,
        effectiveHp: willowHp / Math.max(0.65, statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.WILLOW)),
        defense: statusEffects.getDefenseMultiplier(STATUS_ENTITY_IDS.WILLOW),
        threatScore: activePartyMember === "willow" ? 1.14 : 0.9,
        hexPriority: 1.1 + mpUsage * 0.35,
        squishy: true,
        active: activePartyMember === "willow",
        alive: true,
      });
    }
  }

  return targets;
}

function onEnemyStatusApplied({ targetId = "", effectId = "", durationSeconds = 1, sourceEnemyId = "enemy" } = {}) {
  const requestedTarget = String(targetId ?? "").trim().toLowerCase();
  let resolvedTarget = STATUS_ENTITY_IDS.ARTHUR;
  if (requestedTarget === STATUS_ENTITY_IDS.ELAINE && hasElaineJoined()) {
    resolvedTarget = STATUS_ENTITY_IDS.ELAINE;
  } else if (requestedTarget === STATUS_ENTITY_IDS.WILLOW && hasWillowJoined()) {
    resolvedTarget = STATUS_ENTITY_IDS.WILLOW;
  }
  const resolvedEffectId = String(effectId ?? "").trim();
  if (!resolvedTarget || !resolvedEffectId) return false;
  const added = statusEffects.addEffect(resolvedTarget, {
    id: resolvedEffectId,
    durationSeconds: Math.max(0.05, Number(durationSeconds) || 0.05),
    sourceId: String(sourceEnemyId ?? "enemy"),
  });
  return Boolean(added);
}

function onPlayerDamaged(amount, sourceEnemy = null, targetEntityIdOverride = "") {
  const sourceEnemyId = String(sourceEnemy?.id ?? "");
  const targetEntityId = resolveCombatDamageTarget(targetEntityIdOverride);
  const scaledAmount = resolveDamageWithStatus({
    baseDamage: Math.max(0, Number(amount) || 0),
    attackerId: sourceEnemyId || "enemy",
    targetId: targetEntityId,
    damageType: "physical",
    consumeStatusCharges: false,
  });
  let damage = 0;
  if (targetEntityId === STATUS_ENTITY_IDS.ELAINE && hasElaineJoined() && !elaineDowned) {
    if (elaineInvulnRemaining <= 0) {
      const incoming = Math.max(0, scaledAmount);
      const nextHp = Math.max(0, elaineHp - incoming);
      damage = elaineHp - nextHp;
      elaineHp = nextHp;
      if (damage > 0) {
        elaineInvulnRemaining = PLAYER_INVULN_WINDOW_MS / 1000;
      }
    }
  } else {
    damage = playerState.applyDamage(scaledAmount);
  }

  if (damage <= 0) {
    return { damage: 0 };
  }

  const interrupted = playerController.interruptCharge();
  if (interrupted) {
    setTransientMessage("Your focus breaks", 0.7);
  }
  interruptElaineCast();

  playerHitFlashRemaining = PLAYER_HIT_FLASH_SECONDS;
  playerHitTintRemaining = PLAYER_HIT_TINT_SECONDS;
  playerHitNudgeRemaining = Math.max(playerHitNudgeRemaining, 0.16);
  const nudgeDirection = new THREE.Vector2(0, 1);
  if (sourceEnemy) {
    const awayFromEnemy = new THREE.Vector2(player.position.x - sourceEnemy.position.x, player.position.z - sourceEnemy.position.y);
    if (awayFromEnemy.lengthSq() > 1e-6) {
      awayFromEnemy.normalize();
      const impulse = PLAYER_HIT_KNOCKBACK * Math.max(0.7, Math.min(1.35, damage / 8));
      playerKnockbackVelocity.x += awayFromEnemy.x * impulse;
      playerKnockbackVelocity.y += awayFromEnemy.y * impulse;
      nudgeDirection.copy(awayFromEnemy);
    }
  } else if (playerFacingVector.lengthSq() > 1e-6) {
    nudgeDirection.copy(playerFacingVector).multiplyScalar(-1).normalize();
  }
  const nudgeImpulse = CAMERA_HIT_NUDGE_WORLD * Math.max(0.7, Math.min(1.35, damage / 8));
  cameraHitNudgeOffset.x += nudgeDirection.x * nudgeImpulse;
  cameraHitNudgeOffset.y += nudgeDirection.y * nudgeImpulse;

  audioBus.play("impact");
  if (!hasShownPlayerHitToast) {
    hasShownPlayerHitToast = true;
    setTransientMessage("Ouch.", 0.8);
  }

  const targetHp = targetEntityId === STATUS_ENTITY_IDS.ELAINE ? elaineHp : playerState.hp;
  const targetMaxHp = targetEntityId === STATUS_ENTITY_IDS.ELAINE ? elaineMaxHp : playerState.maxHP;
  if (targetHp <= targetMaxHp * 0.2 && !nearDeathLatched) {
    nearDeathLatched = true;
    pacingDirector.recordNearDeath();
  }
  if (targetHp > targetMaxHp * 0.35) {
    nearDeathLatched = false;
  }

  if (targetEntityId === STATUS_ENTITY_IDS.ELAINE) {
    if (elaineHp <= 0) {
      onElaineDowned();
    }
    return { damage, targetId: targetEntityId };
  }

  if (playerState.isDepleted()) {
    if (bossInstance.isActive()) {
      bossInstance.endBossFight("fail");
      guardianCombatForced = false;
      pacingDirector.setPaused(false);
    }
    onArthurDowned();
  }

  return { damage, targetId: targetEntityId };
}

function resolveDebugAttackTargetIntent() {
  if (bossInstance.isActive()) {
    const guardian = bossInstance.getTargetPoint();
    if (guardian) {
      return {
        targetEnemyId: VEIN_GUARDIAN_ID,
        targetPoint: new THREE.Vector2(guardian.x, guardian.z),
      };
    }
  }

  const aliveEnemies = getAliveEnemySnapshots();
  if (aliveEnemies.length === 0) return null;
  const preferred = getEnemySnapshotById(lastArthurTargetEnemyId) ?? aliveEnemies[0];
  lastArthurTargetEnemyId = preferred.id;
  return {
    targetEnemyId: preferred.id,
    targetPoint: new THREE.Vector2(preferred.x, preferred.z),
  };
}

function debugForceAttack(type = "light") {
  const normalized = String(type).toLowerCase();
  const attackType = normalized === "charged" || normalized === "charge" ? "charge" : "light";
  const targetIntent = resolveDebugAttackTargetIntent();
  if (!targetIntent) return false;

  mouseChargeState.active = false;
  mouseChargeState.pointerId = null;
  mouseChargeState.targetIntent = null;

  if (attackType === "light") {
    playerController.requestLightAttack(targetIntent);
    return true;
  }

  playerController.startCharge();
  playerController.attackState.chargeMeter = 1;
  playerController.attackState.chargeHeldSeconds = 0.34;
  playerController.releaseCharge(targetIntent);
  return true;
}

function debugForceBasicAttack() {
  return debugForceAttack("light");
}

function debugForceCast(spellName = "heal_single") {
  const normalized = String(spellName).toLowerCase();
  const spell =
    normalized === "heal_single" || normalized === "u"
      ? ELAINE_SPELLS.singleHeal
      : normalized === "heal_group" || normalized === "i"
        ? ELAINE_SPELLS.groupHeal
        : normalized === "buff" || normalized === "o"
          ? ELAINE_SPELLS.blessing
          : normalized === "res" || normalized === "resurrect" || normalized === "p"
            ? ELAINE_SPELLS.resurrect
            : null;
  if (!spell) return { started: false, reason: "unknown" };
  const started = tryStartElaineSpell(spell, { showFailureToast: false });
  return {
    started,
    spellId: spell.id,
    castActive: Boolean(elaineSpellCast),
  };
}

function debugForceElaineCast(spellKey = "u") {
  return debugForceCast(spellKey);
}

function debugDamageParty(payload = {}) {
  const arthurDelta = Number(payload?.arthurDelta) || 0;
  const elaineDelta = Number(payload?.elaineDelta) || 0;

  if (arthurDelta !== 0) {
    playerState.setHP(playerState.hp - arthurDelta, { resetInvulnerability: true });
    if (playerState.hp <= 0) {
      onArthurDowned();
    } else {
      arthurDowned = false;
      arthurBleedoutRemaining = 0;
      nearDeathLatched = playerState.hp <= playerState.maxHP * 0.2;
    }
  }

  if (elaineDelta !== 0 && hasElaineJoined()) {
    elaineHp = Math.max(0, Math.min(elaineMaxHp, elaineHp - elaineDelta));
    if (elaineHp <= 0) {
      onElaineDowned();
    } else {
      elaineDowned = false;
      elaineBleedoutRemaining = 0;
    }
  }

  refreshPartyControlAfterStateChange();
  return {
    arthur: {
      hp: Number(playerState.hp.toFixed(2)),
      maxHp: playerState.maxHP,
      downed: arthurDowned,
    },
    elaine: {
      hp: Number(elaineHp.toFixed(2)),
      maxHp: Number(elaineMaxHp.toFixed(2)),
      downed: elaineDowned,
    },
  };
}

function debugSetTargetHp(value = 1) {
  const intent = resolveDebugAttackTargetIntent();
  if (!intent) return null;

  if (intent.targetEnemyId === VEIN_GUARDIAN_ID && bossInstance.isActive()) {
    const hud = bossInstance.getHudState();
    const maxHp = Math.max(1, Number(hud.maxHP) || 1);
    const incoming = Number(value) || 0;
    const ratio = incoming <= 1 ? clamp01(incoming) : clamp01(incoming / maxHp);
    const boss = bossInstance.setBossHpPercent(ratio);
    return {
      id: VEIN_GUARDIAN_ID,
      hp: Number((boss?.health ?? maxHp * ratio).toFixed(2)),
      maxHp,
    };
  }

  const target = combatSystem.setEnemyHealth(intent.targetEnemyId, value);
  if (target) {
    lastArthurTargetEnemyId = intent.targetEnemyId;
  }
  return target;
}

window.addEventListener("keydown", (event) => {
  if (isEditableElement(event.target)) return;
  const lowerKey = event.key.toLowerCase();
  const gameplayInputAllowed = canProcessGameplayInput(event);

  if (handleWillowSpellKey(event)) {
    return;
  }
  if (handleElaineSpellKey(event)) {
    return;
  }

  if (sceneManager.hasBlockingUiScene()) {
    const consumed = sceneManager.handleSceneKeyDown(event);
    if (consumed) {
      event.preventDefault();
      return;
    }
    const isDevBypass = lowerKey === "p" || lowerKey === "o";
    if (!isDevBypass) return;
  }

  if (cinematicPanelOverlay.isOpen()) {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      cinematicPanelOverlay.advance();
      return;
    }
    if (event.code === "Escape") {
      event.preventDefault();
      cinematicPanelOverlay.close();
      return;
    }
    return;
  }

  if (endingChoicePanel.isOpen()) {
    const consumed = endingChoicePanel.handleKey(event);
    if (consumed) {
      event.preventDefault();
      return;
    }
    return;
  }

  if (creditsOverlay.isOpen()) {
    if (event.code === "Space" || event.code === "Enter" || event.code === "Escape") {
      event.preventDefault();
      creditsOverlay.advance();
      return;
    }
    return;
  }

  if (controlLockRemaining > 0) {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
    }
    return;
  }

  if (introTextBeat.isActive()) {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
    }
    return;
  }

  if (dialogueBox.isOpen() && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    dialogueBox.advance();
    return;
  }

  if (vaelorisChoicePanel.isOpen()) {
    if (event.code === "Space" || event.code === "Escape" || event.code === "Enter") {
      event.preventDefault();
      vaelorisChoicePanel.close();
      return;
    }
    return;
  }

  if (harvesterChoicePanel.isOpen()) {
    if (event.code === "Space" || event.code === "Escape" || event.code === "Enter") {
      event.preventDefault();
    }
    return;
  }

  if (listeningSpikeChoicePanel.isOpen()) {
    if (event.code === "Space" || event.code === "Escape" || event.code === "Enter") {
      event.preventDefault();
      listeningSpikeChoicePanel.close();
    }
    return;
  }

  if (vaultChoicePanel.isOpen()) {
    if (event.code === "Space" || event.code === "Escape" || event.code === "Enter") {
      event.preventDefault();
    }
    return;
  }

  if (loreVisionOverlay.isOpen()) {
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      loreVisionOverlay.advance();
      return;
    }
    if (event.code === "Escape") {
      event.preventDefault();
      loreVisionOverlay.close();
      return;
    }
    return;
  }

  if (shrineSystem.isOpen()) {
    if (event.code === "Space" || event.code === "Escape" || event.code === "Enter") {
      event.preventDefault();
      shrineSystem.close();
      return;
    }
    return;
  }

  if (!event.ctrlKey && !event.metaKey && !event.altKey && gameplayInputAllowed && !event.repeat) {
    if (event.code === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      cycleTacticsMode();
      return;
    }
    if (event.code === "Digit1") {
      event.preventDefault();
      event.stopPropagation();
      requestActiveCharacter("arthur");
      return;
    }
    if (event.code === "Digit2") {
      event.preventDefault();
      event.stopPropagation();
      requestActiveCharacter("elaine");
      return;
    }
    if (event.code === "Digit3") {
      event.preventDefault();
      event.stopPropagation();
      if (hasWillowJoined() && activePartyMember === "willow") {
        cycleWillowStanceManual({ showLockedToast: true, fromUi: false });
      } else {
        requestActiveCharacter("willow");
      }
      return;
    }
  }

  if (lowerKey === "f") {
    toggleFullscreen();
  }
  if (lowerKey === "k" && !event.repeat) {
    // Dev-only deterministic spike to pressure the world model for testing.
    world.triggerDebugExtractionSpike();
  }
  if (lowerKey === "j" && !event.repeat) {
    // Manual combat override remains available only for dev testing.
    devCombatOverride = !devCombatOverride;
    if (devCombatOverride) {
      inputManager.clearTouchTarget();
      pendingMobileAttackEnemyId = null;
    }
  }
  if (lowerKey === "l" && !event.repeat) {
    saveState.clear();
    setCrownMood(0, "debug_reset");
    playerUpgrades = resolvePlayerUpgrades(saveState.getPlayerUpgrades?.());
    relicShardCount = saveState.getRelicShards?.() ?? 0;
    applyPlayerUpgrades(true);
    devCombatOverride = false;
    sceneCombatForced = false;
    combatFromEnemies = false;
    guardianCombatForced = false;
    playerState.restoreToFull({ resetInvulnerability: true });
    setActivePartyMember("arthur");
    arthurDowned = false;
    arthurBleedoutRemaining = 0;
    resetElaineSupportState({ restoreFull: true });
    resetWillowSpellState({ restoreFull: true, resetStance: true });
    nearDeathLatched = false;
    playerKnockbackVelocity.set(0, 0);
    playerHitFlashRemaining = 0;
    playerHitTintRemaining = 0;
    playerHitNudgeRemaining = 0;
    cameraHitNudgeOffset.set(0, 0);
    cameraAttackNudgeOffset.set(0, 0);
    cameraZoomScalar = 1;
    damageTintOverlay.setOpacity(0);
    setVeinDroneEnabled(false);
    clearGuardianEncounterState({ clearStoryActiveFlag: false });
    setVeinGuardianActive(false);
    setVeinGuardianDefeated(false);
    setHarvesterBossActive(false);
    setHarvesterBossDefeated(false);
    setHarvesterChoice(HARVESTER_CHOICE_VALUES.NONE);
    setChapter9Started(false);
    setChapter9AnchorsAttuned(false);
    setChapter9NullArchivistDefeated(false);
    setChapter9Choice("");
    setEndgameStarted(false);
    setEndgameGoalId("");
    setEndgameRouteSeedUnlocked(false);
    setEndgameAct1Started(false);
    setEndgameThirdSealObtained(false);
    setEndgameOuterSpireUnlocked(false);
    setEndgameOuterSpireBreached(false);
    setEndgameGatewardenDefeated(false);
    setEndgameSpireEntryUnlocked(false);
    setEndgameAct2Started(false);
    setEndgameInnerSpireEntered(false);
    setEndgameResonanceLock(1, false);
    setEndgameResonanceLock(2, false);
    setEndgameResonanceLock(3, false);
    setEndgameLoomProctorDefeated(false);
    setEndgameAct3Unlocked(false);
    setEndgameLastDoorSeen(false);
    setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
    setStoryFlag("endgame_spire_gatewarden_active", false);
    setStoryFlag("crownheart_key", false);
    setStoryFlag("endgame_retaliation_flag", false);
    setStoryFlag("endgame_task_waystone", false);
    setStoryFlag("endgame_task_crownheart", false);
    setStoryFlag("endgame_task_third_seal", false);
    setStoryFlag("endgame_task_seal_1", false);
    setStoryFlag("endgame_task_seal_2", false);
    setStoryFlag("endgame_task_seal_3", false);
    harvesterChoice = HARVESTER_CHOICE_VALUES.NONE;
    vaelorisPressureStage = setVaelorisPressureStage(1);
    lastGuardianFrame = bossInstance.getState();
    hasShownPlayerHitToast = false;
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
    playerController.interruptCharge();
    resetSwordAttackState();
    dialogueBox.closeDialogue();
    introTextBeat.clear();
    vaelorisChoicePanel.close();
    harvesterChoicePanel.close();
    listeningSpikeChoicePanel.close();
    shrineSystem.close();
    controlLockRemaining = 0;
    act2FalloutPending = null;
    rowanCouncilPending = null;
    chapter2ArrivalPending = null;
    chapter3DebriefPending = null;
    chapter4RowanReportPending = null;
    chapter5AftershockPending = null;
    chapter6ArrivalPending = null;
    chapter6WaystoneLorePending = null;
    chapter8AftermathPending = null;
    chapter9StartPending = null;
    chapter9LoreVisionPending = null;
    endgameAct1StartPending = null;
    endgameAct2StartPending = null;
    endgameAct2LorePending = null;
    willowMeetPending = null;
    clearWillowAmbushState();
    clearListeningSpikeSetpieceState();
    clearRidgePatrolSetpieceState();
    clearChapter6RelaySetpieceState();
    clearChapter8RetaliationSetpieceState();
    clearChapter9SetpieceState();
    clearThirdSealQuestState();
    clearSpireBreachState();
    resetInnerSpireRuntime({ keepProgress: false });
    eventRunner.clear();
    pulsePresentation.clear();
    pulseSurgeSpawned = false;
    pulseSurgeRoles = [];
    pulseDamageTaken = 0;
    openingLineTimer = 0;
    openingLineIndex = 0;
    openingKillResolved = false;
    openingTransitionTimer = 0;
    elaineIntroActive = false;
    elaineIntroLineIndex = 0;
    elaineIntroLineTimer = 0;
    vaelorisChoice = VAELORIS_CHOICE_VALUES.NONE;
    harvesterChoice = HARVESTER_CHOICE_VALUES.NONE;
    listeningSpikeChoice = LISTENING_SPIKE_CHOICE_VALUES.NONE;
    vaelorisFieldTriggered = false;
    vaelorisEventActive = false;
    vaelorisDialogueActive = false;
    vaelorisDialogueIndex = 0;
    vaelorisDialogueTimer = 0;
    vaelorisConstructEnemyIds = [];
    vaelorisConstructsAlive = 0;
    vaelorisPendingConstructSpawn = false;
    vaelorisExtractorPromptVisible = false;
    vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
    setTacticsMode("balanced");
    banterDirector.reset();
    resetObjectiveTelemetry();
    partyChat.clear();
    guidanceLineText = "";
    resetAiStats();
    firstVeinCompletedLatched = false;
    partySystem.clearStaging();
    partySystem.setJoined(false, player.position);
    partySystem.setWillowJoined(false, player.position);
    willowJoinedCached = false;
    willowJoinToastShown = false;
    stabilityToastText = "";
    stabilityToastSeconds = 0;
    lastVeinFrame = {
      active: false,
      activeVeinId: null,
      state: "",
      waveIndex: 0,
      totalWaves: 0,
      enemiesRemaining: 0,
      hudText: "",
      localOverlayOpacity: 0,
      localFogDensityDelta: 0,
      localTintDarken: 0,
      localDesaturation: 0,
      localFogReliefDelta: 0,
      cameraZoomTarget: 1,
      waveTransitionActive: false,
      waveTransitionIntensity: 0,
      waveFoliageBoost: 1,
      waveShakeScalar: 0,
      barrierScale: 0,
      barrierGrowth: 0,
      correctedPlayerPosition: null,
      playerInsideActiveRadius: false,
    };
    lastPulseFrame = {
      active: false,
      elapsedSeconds: 0,
      progress: 0,
      phaseId: "",
      phaseProgress: 0,
      surgeSpawned: false,
      surgeRoles: [],
      overlayVisible: false,
    };

    const resetPosition = sceneManager.forceLoadScene("thornmere");
    player.position.set(resetPosition.x, 0, resetPosition.y);
    cameraFollowTarget.set(resetPosition.x, 0, resetPosition.y);
    updateCamera(1 / 60, true);
    currentSceneInfo = sceneManager.getCurrentSceneInfo();
    syncWorldRegion(currentSceneInfo);
    partySystem.setActiveScene(currentSceneInfo.sceneId, player.position);
    shrineSystem.setScene(currentSceneInfo.sceneId);
    combatSystem.loadScene(currentSceneInfo.sceneId, sceneManager.getEnemySpawns());
    initThreatVeinsForScene(currentSceneInfo.sceneId, currentRngSeed, {
      threeScene: scene,
      saveState,
    });
    syncVaelorisExtractorVisual();
    applyVaelorisWorldModifiers();
    maybeStartClassicIntroTextBeat();
    syncSceneMusic(currentSceneInfo.sceneId);
    combatSystem.lootCollected = 0;
    combatSystem.totalEnemiesDefeated = 0;
    verdantMoteCount = 0;
    anomalySystem.clearActive();
    lastAnomalyFrame = { activeCount: 0, nearby: false, collected: false };

    saveState.setPlayerPosition("thornmere", { x: player.position.x, z: player.position.z });
    markMapDirty();
    refreshQuestText();
    transientMessageSeconds = 0;
    transientMessageText = "";
  }
  if (lowerKey === "v" && !event.repeat) {
    const spawned = anomalySystem.spawnNearPlayer(player.position, {
      sceneId: currentSceneInfo.sceneId,
      explorationActive: getEffectiveMovementContext() === "exploration" && !sceneManager.isTransitioning(),
    });
    if (spawned) {
      setTransientMessage("Verdant shimmer gathers nearby.", 1.4);
    }
  }
  if (lowerKey === "p" && !event.repeat) {
    forceLoadSceneForDebug("thornmere");
    return;
  }
  if (lowerKey === "o" && !event.repeat) {
    forceLoadSceneForDebug("hollowscar");
    return;
  }
  if (lowerKey === "t" && !event.repeat) {
    const spawnedVeinId = debugSpawnVeinNearPlayer();
    if (spawnedVeinId) {
      setTransientMessage("A threat vein stirs nearby.", 1.6);
    }
  }
  if (lowerKey === "y" && !event.repeat && DEV_MODE) {
    const cleared = clearThreatVeinsCompletionFlags(saveState);
    window.__verdant_skip_save_on_unload = true;
    if (cleared > 0) {
      setTransientMessage("Vein marks cleared. Reweaving...", 1.2);
    }
    window.location.reload();
  }
  if (event.code === "Space" && !event.repeat && gameplayInputAllowed) {
    event.preventDefault();
    if (tryOpenVaelorisChoicePanel()) {
      return;
    }
    if (tryOpenListeningSpikeChoicePanel()) {
      return;
    }
    if (shrineSystem.tryInteract()) {
      return;
    }
    if (tryDamageNearestRelayTether({ showToast: true })) {
      return;
    }
    if (tryDamageNearestChapter8MuteSpike({ showToast: true })) {
      return;
    }
    if (tryAttuneNearestChapter9Anchor({ showToast: true })) {
      return;
    }
    if (tryDamageNearestChapter9EchoNode({ showToast: true })) {
      return;
    }
    if (tryAttuneThirdSealSigil({ showToast: true })) {
      return;
    }
    if (tryDisableNearestLockNode({ showToast: true })) {
      return;
    }
    if (tryStartNearestResonanceLock({ showToast: true })) {
      return;
    }
    if (tryShatterNearestLoomPrismPillar({ showToast: true })) {
      return;
    }
    if (tryInspectLastDoor({ showToast: true })) {
      return;
    }
    if (tryAttuneNearestRiftAnchor({ showToast: true })) {
      return;
    }
    if (tryDisableNearestFinalClamp({ showToast: true })) {
      return;
    }
    if (tryOpenEndingChoiceAltar({ showToast: true })) {
      return;
    }
    if (tryTriggerChapter6WaystoneLoreEvent()) {
      return;
    }
    const npcInteraction = sceneManager.triggerNearbyNpcInteraction(getPlayerXZ());
    if (npcInteraction) {
      openNpcDialogue(npcInteraction);
      return;
    }
    if (tryHandleLockedRidgeGateInteraction({ showToast: true })) {
      return;
    }
    if (tryHandleLockedRootwayGateInteraction({ showToast: true })) {
      return;
    }

    if (guardianCombatForced) {
      return;
    }

    const transitioned = sceneManager.triggerNearbyPortal(getPlayerXZ());
    if (transitioned) {
      inputManager.clearTouchTarget();
      pendingMobileAttackEnemyId = null;
      pendingNpcInteractionId = null;
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (isEditableElement(event.target)) return;
  if (!sceneManager.hasBlockingUiScene()) return;
  const consumed = sceneManager.handleSceneKeyUp(event);
  if (consumed) {
    event.preventDefault();
  }
});

const fixedStep = 1 / 60;
let screenshotMode = false;

function applyWorldVisuals(deltaSeconds) {
  updateCrownMoodFlash(deltaSeconds);
  const worldVisualState = world.getVisualState();
  const hudState = world.getHudState();
  const baselineVisuals = getBaselineVisuals(currentSceneInfo.sceneId);
  const crownMoodInfluence = getCrownMoodInfluence();
  const pulseVisual = pulsePresentation.update(deltaSeconds, {
    active: lastPulseFrame.active,
    elapsedSeconds: lastPulseFrame.elapsedSeconds,
    sceneId: currentSceneInfo.sceneId,
    center: pulseCenter.set(player.position.x, player.position.z),
  });
  lastPulseFrame.overlayVisible = pulseVisual.overlayActive;

  const modifiers = getDynamicVisualModifiers(
    worldVisualState,
    {
      pulse: pulseVisual,
      pulseActive: pulseVisual.active,
      veinLocalFogReliefDelta: lastVeinFrame.localFogReliefDelta,
      crownMood: {
        fogDensityDelta: crownMoodInfluence.fogDensityDelta,
        ambientIntensityDelta: crownMoodInfluence.ambientIntensityDelta,
        tintStrengthDelta: crownMoodInfluence.tintStrengthDelta,
        saturationShift: crownMoodInfluence.saturationShift,
        warmthShift: crownMoodInfluence.warmthShift,
      },
    },
    currentSceneInfo.sceneId
  );
  const finalVisuals = composeVisualConfig(baselineVisuals, modifiers);
  const veinWaveFoliageBoost = Math.max(1, lastVeinFrame.waveFoliageBoost ?? 1);
  const resolvedFoliageSwayMultiplier = finalVisuals.foliageSwayMultiplier * veinWaveFoliageBoost;
  applyVisuals(
    {
      scene,
      ambientLight,
      directionalLight,
      groundMaterial,
      groundBaseColor,
    },
    finalVisuals
  );

  sceneManager.setFoliageMotionIntensity(resolvedFoliageSwayMultiplier);
  pulsePresentation.setOverlayOpacity(pulseVisual.overlayActive ? finalVisuals.pulseOverlayOpacity : 0);

  lastVisualFrame = {
    sceneId: currentSceneInfo.sceneId,
    ambientIntensity: finalVisuals.ambientIntensity,
    directionalIntensity: finalVisuals.directionalIntensity,
    fogDensity: finalVisuals.fogDensity,
    overlayOpacity: finalVisuals.overlayOpacity,
    regionTintStrength: finalVisuals.regionTintStrength,
    foliageSwayMultiplier: resolvedFoliageSwayMultiplier,
    pulseOverlayOpacity: pulseVisual.overlayActive ? finalVisuals.pulseOverlayOpacity : 0,
    saturationShift: finalVisuals.saturationShift ?? 0,
    warmthShift: finalVisuals.warmthShift ?? 0,
  };

  updateFootstepSystem(footstepSystem, deltaSeconds, lastMovementInfo, player.position);

  const blockingUiScene = sceneManager.hasBlockingUiScene();
  const combatActive = getEffectiveMovementContext() === "combat";
  hud.setVisible(!blockingUiScene);

  if (transientMessageSeconds > 0) {
    transientMessageSeconds = Math.max(0, transientMessageSeconds - deltaSeconds);
    if (transientMessageSeconds <= 0) {
      transientMessageText = "";
    }
  }
  if (stabilityToastSeconds > 0) {
    stabilityToastSeconds = Math.max(0, stabilityToastSeconds - deltaSeconds);
    if (stabilityToastSeconds <= 0) {
      stabilityToastText = "";
    }
  }

  updateSceneDebugState();

  hud.setHazeOpacity(blockingUiScene ? 0 : finalVisuals.overlayOpacity);
  const partyState = partySystem.getState();
  const showMobilePartyControls =
    isMobileUiEnabled() &&
    currentSceneInfo.sceneId !== "start" &&
    !dialogueBox.isOpen() &&
    !shrineSystem.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    !blockingUiScene;
  tacticsToggleButton.update({
    visible: showMobilePartyControls,
    modeLabel: formatTacticsMode(getTacticsMode()),
  });
  const partyPortraitVisible = showMobilePartyControls && hasPartyCompanionJoined();
  partyPortraitBar.update({
    visible: partyPortraitVisible,
    activeCharacterId: activePartyMember,
    elaineAvailable: hasElaineJoined() && !elaineDowned,
    willowAvailable: hasWillowJoined(),
  });
  const showElaineSpellbar =
    isMobileUiEnabled() &&
    hasElaineJoined() &&
    Boolean(partyState.joined) &&
    currentSceneInfo.sceneId !== "start" &&
    !dialogueBox.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen();
  elaineSpellBar.update({
    visible: showElaineSpellbar,
    mp: elaineMp,
    cooldowns: elaineSpellCooldowns,
    interactive: canUseElaineSpells(),
  });
  const showWillowSpellbar =
    isMobileUiEnabled() &&
    hasWillowJoined() &&
    currentSceneInfo.sceneId !== "start" &&
    !dialogueBox.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen();
  willowSpellBar.update({
    visible: showWillowSpellbar,
    stance: willowStance.getWillowStance(),
    mp: willowMp,
    cooldowns: willowSpellCooldowns,
    interactive: canUseWillowSpells(),
  });
  const showWillowAutoToggle =
    hasWillowJoined() &&
    currentSceneInfo.sceneId !== "start" &&
    !dialogueBox.isOpen() &&
    !shrineSystem.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    !blockingUiScene;
  willowAutoStanceToggle.update({
    visible: showWillowAutoToggle,
    enabled: willowStance.getAutoStanceEnabled(),
  });
  partyChat.update(deltaSeconds, {
    visible:
      !blockingUiScene &&
      !dialogueBox.isOpen() &&
      !sceneManager.isTransitioning() &&
      currentSceneInfo.sceneId !== "start",
    mobileUi: isMobileUiEnabled(),
    portraitsVisible: partyPortraitVisible,
  });
  if (blockingUiScene) {
    return;
  }
  const displayHp = activePartyMember === "elaine" ? elaineHp : playerState.hp;
  const displayMaxHp = activePartyMember === "elaine" ? elaineMaxHp : playerState.maxHP;
  const partyHealth = {
    arthur: {
      hp: playerState.hp,
      maxHp: playerState.maxHP,
      downed: arthurDowned,
    },
    elaine: {
      hp: elaineHp,
      maxHp: elaineMaxHp,
      downed: elaineDowned,
      available: hasElaineJoined(),
    },
    willow: {
      available: hasWillowJoined(),
    },
  };
  const targetHud = resolveHudTarget();
  const bossHudState = bossInstance.getHudState();
  const partyStatus = {
    arthur: getStatusIcons(STATUS_ENTITY_IDS.ARTHUR),
    elaine: hasElaineJoined() ? getStatusIcons(STATUS_ENTITY_IDS.ELAINE) : [],
    willow: hasWillowJoined() ? getStatusIcons(STATUS_ENTITY_IDS.WILLOW) : [],
  };
  const targetStatus = targetHud?.id
    ? getStatusIcons(targetHud.id).filter((effect) => effect.positive !== true)
    : [];
  const supportHudBits = [];
  if (activePartyMember === "elaine") {
    supportHudBits.push("Control: Elaine");
  } else if (activePartyMember === "willow") {
    supportHudBits.push("Control: Willow");
  }
  if (arthurDowned) {
    supportHudBits.push(`Arthur downed ${Math.max(0, arthurBleedoutRemaining).toFixed(1)}s`);
  }
  if (elaineSpellCast) {
    const castLabel =
      elaineSpellCast.spellId === ELAINE_SPELLS.resurrect.id ? "Revive" : "Cast";
    supportHudBits.push(`${castLabel} ${Math.max(0, elaineSpellCast.remaining).toFixed(1)}s`);
  }
  const bossState = bossInstance.getState();
  const nullArchivistBossActive = Boolean(bossState?.active && bossState?.bossId === NULL_ARCHIVIST_BOSS_ID);
  hud.update({
    ...hudState,
    sceneName: `Scene: ${currentSceneInfo.sceneName}`,
    regionName: currentSceneInfo.regionName,
    crownOmen: crownMood.getTierLabel(),
    crownOmenFlash: crownOmenFlashRemaining,
    combatActive,
    veinStatus: lastVeinFrame.hudText,
    transientMessage: transientMessageSeconds > 0 ? transientMessageText : "",
    stabilityToast: stabilityToastSeconds > 0 ? stabilityToastText : "",
    lootCount: lastCombatFrame.lootCount,
    verdantMoteCount,
    relicShardCount,
    anomalyNearby: lastAnomalyFrame.nearby,
    interactionPrompt: dialogueBox.isOpen() ? "" : lastInteractionPrompt,
    hp: displayHp,
    maxHp: displayMaxHp,
    mp: hasElaineJoined() ? elaineMp : 0,
    maxMp: elaineMaxMp,
    showMp: hasElaineJoined(),
    willowMp: willowMp,
    willowMaxMp: willowMaxMp,
    showWillowMp: hasWillowJoined(),
    willowStanceText: hasWillowJoined() ? formatWillowStanceLabel(willowStance.getWillowStance()) : "",
    supportText: supportHudBits.join("  "),
    tacticsText: hasPartyCompanionJoined() ? formatTacticsMode(getTacticsMode()) : "",
    activeCharacterText: hasPartyCompanionJoined()
      ? activePartyMember === "elaine"
        ? "Elaine"
        : activePartyMember === "willow"
          ? "Willow"
          : "Arthur"
      : "",
    guidanceText: guidanceLineText,
    questText: currentQuestText,
    partyHealth,
    partyStatus,
    targetStatus,
    statusTime: world.elapsedSeconds,
    target: targetHud,
    boss: bossHudState,
    sunder:
      chapter9SetpieceState.sunderActive &&
      (chapter9SetpieceState.active || nullArchivistBossActive)
        ? {
            active: true,
            label: "SUNDER METER",
            value: chapter9SetpieceState.sunderMeter,
          }
        : null,
    breach:
      spireBreachState.meterActive && currentSceneInfo.sceneId === "spire_approach"
        ? {
            active: true,
            label: "BREACH METER",
            value: spireBreachState.meter,
          }
        : null,
    memoryPressure:
      currentSceneInfo.sceneId === "inner_spire" && !hasEndgameAllResonanceLocks() && !hasEndgameLoomProctorDefeated()
        ? {
            active: true,
            label: "MEMORY PRESSURE",
            value: memoryPressureTracker.getState().value,
          }
        : null,
    riftStability:
      currentSceneInfo.sceneId === "last_spire" && (lastSpireState.riftActive || !hasEndgameSetpieceRiftCrossed())
        ? {
            active: true,
            label: "RIFT STABILITY",
            value: clamp01(lastSpireState.riftStability),
          }
        : null,
    clampStatus:
      currentSceneInfo.sceneId === "last_spire" && !hasEndgameSetpieceCoreReached()
        ? {
            active: true,
            text: `Clamps: ${
              lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 1 : 0), 0)
            }/${Math.max(0, lastSpireState.finalClamps.length)}`,
          }
        : null,
    showAshGateMarker: currentSceneInfo.sceneId === "thornmere",
    showRidgeGateMarker: currentSceneInfo.sceneId === "thornmere",
  });

  const screenPosition = worldToScreen(player.position.x, player.position.z);
  const showMeleeChargeBar = activePartyMember !== "elaine";
  hud.updateChargeBar({
    value: showMeleeChargeBar ? lastMovementInfo.chargeMeter : 0,
    visible: showMeleeChargeBar && lastMovementInfo.charging,
    screenX: screenPosition.x,
    screenY: screenPosition.y,
  });
}

function update(deltaSeconds) {
  introTextBeat.update(deltaSeconds);
  dialogueBox.update(deltaSeconds);
  cinematicPanelOverlay.update(deltaSeconds);
  ensureGroundMounted();
  if (currentSceneInfo.sceneId !== lastAutoRefreshSceneId) {
    lastAutoRefreshSceneId = currentSceneInfo.sceneId;
    markMapDirty();
  }
  if (mapDirty) {
    rebuildMapRender();
  } else if (world.elapsedSeconds - lastMapRenderTimeSeconds >= MAP_REFRESH_WATCHDOG_SECONDS) {
    rebuildMapRender();
  }
  playerState.update(deltaSeconds);
  statusEffects.update(deltaSeconds);
  elaineInvulnRemaining = Math.max(0, elaineInvulnRemaining - deltaSeconds);
  elaineInterruptLockRemaining = Math.max(0, elaineInterruptLockRemaining - deltaSeconds);
  for (const key of Object.keys(elaineSpellCooldowns)) {
    elaineSpellCooldowns[key] = Math.max(0, elaineSpellCooldowns[key] - deltaSeconds);
  }
  for (const key of Object.keys(willowSpellCooldowns)) {
    willowSpellCooldowns[key] = Math.max(0, willowSpellCooldowns[key] - deltaSeconds);
  }
  if (!elaineDowned) {
    const elaineMpRegenScale = statusEffects.getMpRegenMultiplier(STATUS_ENTITY_IDS.ELAINE);
    elaineMp = Math.min(elaineMaxMp, elaineMp + ELAINE_MP_REGEN_PER_SECOND * elaineMpRegenScale * deltaSeconds);
  }
  if (hasWillowJoined()) {
    const willowMpRegenScale = statusEffects.getMpRegenMultiplier(STATUS_ENTITY_IDS.WILLOW);
    willowMp = Math.min(willowMaxMp, willowMp + WILLOW_MP_REGEN_PER_SECOND * willowMpRegenScale * deltaSeconds);
  }
  updateWillowPendingSpells();
  if (elaineSpellCast) {
    elaineSpellCast.remaining = Math.max(0, elaineSpellCast.remaining - deltaSeconds);
    if (elaineSpellCast.remaining <= 0) {
      const finishedSpell =
        Object.values(ELAINE_SPELLS).find((entry) => entry.id === elaineSpellCast.spellId) ?? null;
      clearElaineCastState();
      if (finishedSpell && applyElaineSpellEffect(finishedSpell)) {
        setElaineCooldown(finishedSpell.id, finishedSpell.cooldownSeconds);
      }
    }
  }
  if (arthurDowned) {
    arthurBleedoutRemaining = Math.max(0, arthurBleedoutRemaining - deltaSeconds);
  }
  if (elaineDowned) {
    elaineBleedoutRemaining = Math.max(0, elaineBleedoutRemaining - deltaSeconds);
  }
  if ((arthurDowned && arthurBleedoutRemaining <= 0) || (elaineDowned && elaineBleedoutRemaining <= 0)) {
    handlePartyWipe();
    return;
  }
  refreshPartyControlAfterStateChange();

  const sceneState = sceneManager.update(deltaSeconds, {
    playerPosition: getPlayerXZ(),
    onSceneWillChange: (fromSceneId, toSceneId, transitionMetadata = null) => {
      markMapDirty();
      if (isPlayableScene(fromSceneId)) {
        saveState.setPlayerPosition(fromSceneId, {
          x: player.position.x,
          z: player.position.z,
        });
      }
      if (transitionMetadata?.flow === "new-game") {
        resetRuntimeForNewGame();
      }
      inputManager.clearTouchTarget();
      pendingMobileAttackEnemyId = null;
      pendingNpcInteractionId = null;
      playerController.interruptCharge();
      resetSwordAttackState();
      willowPendingCasts.length = 0;
      clearEnemyStatusEffects();
      playerKnockbackVelocity.set(0, 0);
      playerHitFlashRemaining = 0;
      playerHitTintRemaining = 0;
      playerHitNudgeRemaining = 0;
      cameraHitNudgeOffset.set(0, 0);
      cameraAttackNudgeOffset.set(0, 0);
      cameraZoomScalar = 1;
      damageTintOverlay.setOpacity(0);
      setVeinDroneEnabled(false);
      stabilityToastText = "";
      stabilityToastSeconds = 0;
      dialogueBox.closeDialogue();
      introTextBeat.clear();
      vaelorisChoicePanel.close();
      harvesterChoicePanel.close();
      listeningSpikeChoicePanel.close();
      vaultChoicePanel.close();
      loreVisionOverlay.close();
      cinematicPanelOverlay.close();
      endingChoicePanel.close();
      creditsOverlay.close();
      shrineSystem.close();
      controlLockRemaining = 0;
      act2FalloutPending = null;
      rowanCouncilPending = null;
      chapter2ArrivalPending = null;
      chapter3DebriefPending = null;
      chapter4RowanReportPending = null;
      chapter5AftershockPending = null;
      chapter6ArrivalPending = null;
      chapter6WaystoneLorePending = null;
      chapter8AftermathPending = null;
      chapter9StartPending = null;
      chapter9LoreVisionPending = null;
      endgameAct1StartPending = null;
      endgameAct2StartPending = null;
      endgameAct2LorePending = null;
      endgameAct3StartPending = null;
      endgameAct3LorePanelsPending = null;
      willowMeetPending = null;
      clearWillowAmbushState();
      clearListeningSpikeSetpieceState();
      clearRidgePatrolSetpieceState();
      clearChapter6RelaySetpieceState();
      clearChapter8RetaliationSetpieceState();
      clearChapter9SetpieceState();
      clearThirdSealQuestState();
      clearSpireBreachState();
      resetInnerSpireRuntime({ keepProgress: true });
      resetLastSpireRuntime({ keepProgress: true });
      pulsePresentation.clear();
      banterDirector.reset();
      resetObjectiveTelemetry();
      partyChat.clear();
      guidanceLineText = "";
      resetAiStats();
      clearGuardianEncounterState({
        clearStoryActiveFlag: false,
      });
      lastGuardianFrame = bossInstance.getState();
      vaelorisEventActive = false;
      vaelorisDialogueActive = false;
      vaelorisDialogueIndex = 0;
      vaelorisDialogueTimer = 0;
      vaelorisConstructEnemyIds = [];
      vaelorisConstructsAlive = 0;
      vaelorisPendingConstructSpawn = false;
      vaelorisExtractorPromptVisible = false;
      vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
      applyVaelorisWorldModifiers();
      initThreatVeinsForScene(toSceneId, currentRngSeed, {
        threeScene: scene,
        saveState,
      });
      markMapDirty();
      lastVeinFrame = {
        active: false,
        activeVeinId: null,
        state: "",
        waveIndex: 0,
        totalWaves: 0,
        enemiesRemaining: 0,
        hudText: "",
        localOverlayOpacity: 0,
        localFogDensityDelta: 0,
        localTintDarken: 0,
        localDesaturation: 0,
        localFogReliefDelta: 0,
        cameraZoomTarget: 1,
        waveTransitionActive: false,
        waveTransitionIntensity: 0,
        waveFoliageBoost: 1,
        waveShakeScalar: 0,
        barrierScale: 0,
        barrierGrowth: 0,
        correctedPlayerPosition: null,
        playerInsideActiveRadius: false,
      };
      debugVeinSuppressionRemaining = 0;
    },
    onSceneChanged: (nextSceneId, spawnPosition, transitionMetadata = null) => {
      markMapDirty();
      player.position.set(spawnPosition.x, 0, spawnPosition.y);
      cameraFollowTarget.set(spawnPosition.x, 0, spawnPosition.y);
      updateCamera(deltaSeconds, true);
      playerShadow.position.set(spawnPosition.x, -0.885, spawnPosition.y);
      inputManager.clearTouchTarget();
      pendingMobileAttackEnemyId = null;
      pendingNpcInteractionId = null;
      playerController.interruptCharge();
      resetSwordAttackState();
      willowPendingCasts.length = 0;
      clearEnemyStatusEffects();
      playerKnockbackVelocity.set(0, 0);
      playerHitFlashRemaining = 0;
      playerHitTintRemaining = 0;
      playerHitNudgeRemaining = 0;
      cameraHitNudgeOffset.set(0, 0);
      cameraAttackNudgeOffset.set(0, 0);
      cameraZoomScalar = 1;
      damageTintOverlay.setOpacity(0);
      setVeinDroneEnabled(false);
      stabilityToastText = "";
      stabilityToastSeconds = 0;
      dialogueBox.closeDialogue();
      introTextBeat.clear();
      vaelorisChoicePanel.close();
      harvesterChoicePanel.close();
      listeningSpikeChoicePanel.close();
      vaultChoicePanel.close();
      loreVisionOverlay.close();
      cinematicPanelOverlay.close();
      endingChoicePanel.close();
      creditsOverlay.close();
      shrineSystem.close();
      controlLockRemaining = 0;
      act2FalloutPending = null;
      rowanCouncilPending = null;
      chapter2ArrivalPending = null;
      chapter3DebriefPending = null;
      chapter4RowanReportPending = null;
      chapter5AftershockPending = null;
      chapter6ArrivalPending = null;
      chapter6WaystoneLorePending = null;
      chapter8AftermathPending = null;
      chapter9StartPending = null;
      chapter9LoreVisionPending = null;
      endgameAct1StartPending = null;
      endgameAct2StartPending = null;
      endgameAct2LorePending = null;
      endgameAct3StartPending = null;
      endgameAct3LorePanelsPending = null;
      willowMeetPending = null;
      clearWillowAmbushState();
      clearListeningSpikeSetpieceState();
      clearRidgePatrolSetpieceState();
      clearChapter6RelaySetpieceState();
      clearChapter8RetaliationSetpieceState();
      clearChapter9SetpieceState();
      clearThirdSealQuestState();
      clearSpireBreachState();
      resetInnerSpireRuntime({ keepProgress: true });
      resetLastSpireRuntime({ keepProgress: true });
      banterDirector.reset();
      resetObjectiveTelemetry();
      partyChat.clear();
      guidanceLineText = "";
      resetAiStats();
      clearGuardianEncounterState({
        clearStoryActiveFlag: false,
      });
      lastGuardianFrame = bossInstance.getState();
      if (isPlayableScene(nextSceneId)) {
        saveState.setPlayerPosition(nextSceneId, {
          x: player.position.x,
          z: player.position.z,
        });
      }
      currentSceneInfo = sceneManager.getCurrentSceneInfo();
      if (nextSceneId === "region3_seed" || nextSceneId === "windward") {
        setRegion3SeedEntered(true);
      }
      if (nextSceneId === "region4_seed") {
        setRegion4SeedEntered(true);
      }
      syncWorldRegion(currentSceneInfo);
      partySystem.setActiveScene(currentSceneInfo.sceneId, player.position);
      partySystem.setJoined(hasElaineJoined(), player.position);
      partySystem.setWillowJoined(hasWillowJoined(), player.position);
      shrineSystem.setScene(currentSceneInfo.sceneId);
      vaelorisChoice = getVaelorisChoice();
      harvesterChoice = getHarvesterChoice();
      listeningSpikeChoice = getListeningSpikeChoice();
      vaelorisPressureStage = getVaelorisPressureStage();
      vaelorisFieldTriggered = hasVaelorisFieldTriggered();
      vaelorisEventActive = false;
      vaelorisDialogueActive = false;
      vaelorisDialogueIndex = 0;
      vaelorisDialogueTimer = 0;
      vaelorisConstructEnemyIds = [];
      vaelorisConstructsAlive = 0;
      vaelorisPendingConstructSpawn = false;
      vaelorisExtractorPromptVisible = false;
      vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
      combatSystem.loadScene(currentSceneInfo.sceneId, sceneManager.getEnemySpawns());
      initThreatVeinsForScene(currentSceneInfo.sceneId, currentRngSeed, {
        threeScene: scene,
        saveState,
      });
      syncVaelorisExtractorVisual();
      applyVaelorisWorldModifiers();
      maybeStartHollowScarPulse();
      if (nextSceneId === OPENING_SCENE_ID) {
        beginOpeningBeat();
      }
      if (transitionMetadata?.flow === "prologue-complete" && nextSceneId === "thornmere") {
        saveState.setStoryFlag("is_new_game", false);
        saveState.setFlag("story.is_new_game", false);
        startThornmereMorningBeat();
      } else {
        maybeStartClassicIntroTextBeat();
      }
      if (
        nextSceneId === "hollowScar" &&
        hasVeinGuardianActive() &&
        !hasVeinGuardianDefeated() &&
        !bossInstance.isActive()
      ) {
        spawnVeinGuardianEncounter({ force: true });
      }
      if (
        nextSceneId === "emberfall" &&
        hasHarvesterBossActive() &&
        !hasHarvesterBossDefeated() &&
        !bossInstance.isActive()
      ) {
        spawnHarvesterWardenEncounter({ force: true });
      }
      if (nextSceneId === "inner_spire") {
        setEndgameAct2Started(true);
        setEndgameInnerSpireEntered(true);
        initializeInnerSpireState({ force: true });
        if (!hasEndgameLoomProctorDefeated()) {
          setCurrentObjectiveId(hasEndgameAllResonanceLocks() ? OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR : OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS);
        } else if (hasEndgameAct3Unlocked()) {
          setCurrentObjectiveId(OBJECTIVE_IDS.APPROACH_LAST_DOOR);
        }
        refreshQuestText();
      } else if (nextSceneId === "inner_spire_last_door" && hasEndgameAct3Unlocked()) {
        setCurrentObjectiveId(OBJECTIVE_IDS.APPROACH_LAST_DOOR);
        refreshQuestText();
      } else if (nextSceneId === "last_spire") {
        setEndgameStarted(true);
        setEndgameAct3Started(true);
        setEndgameLastDoorOpened(true);
        setEndgameLastSpireEntered(true);
        initializeLastSpireState({ force: true });
        if (!hasEndgameSetpieceRiftCrossed()) {
          setCurrentObjectiveId(OBJECTIVE_IDS.CROSS_RIFT);
        } else if (!hasEndgameSetpieceCoreReached()) {
          setCurrentObjectiveId(OBJECTIVE_IDS.REACH_CROWN_ENGINE);
        } else if (!hasEndgameFinalBossDefeated()) {
          setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_FINAL_BOSS);
        } else if (!hasEndgameChoiceMade()) {
          setCurrentObjectiveId(OBJECTIVE_IDS.CHOOSE_ENDING);
        } else {
          setCurrentObjectiveId(OBJECTIVE_IDS.CREDITS);
        }
        refreshQuestText();
      }
      syncSceneMusic(currentSceneInfo.sceneId);
      saveWriteAccumulator = 0;
      safeSpotWriteAccumulator = 0;
      if (isPlayableScene(currentSceneInfo.sceneId)) {
        saveState.setSafeSpot(currentSceneInfo.sceneId, {
          x: spawnPosition.x,
          z: spawnPosition.y,
        });
      }
      markMapDirty();
    },
  });

  if (sceneState.sceneToast) {
    setTransientMessage(sceneState.sceneToast, 2.0);
  }
  if (sceneState.npcInteraction && !dialogueBox.isOpen()) {
    openNpcDialogue(sceneState.npcInteraction);
  }

  sceneCombatForced = Boolean(sceneState.combatForced);
  currentSceneInfo = {
    sceneId: sceneState.sceneId,
    sceneName: sceneState.sceneName,
    regionId: sceneState.regionId,
    regionName: sceneState.region,
  };
  syncWorldRegion(currentSceneInfo);
  syncWillowJoinState();
  shrineSystem.setScene(currentSceneInfo.sceneId);
  shrineSystem.update({
    dtSeconds: deltaSeconds,
    elapsedSeconds: world.elapsedSeconds,
    camera,
    playerPosition: player.position,
    motes: verdantMoteCount,
    shards: relicShardCount,
    upgrades: playerUpgrades,
    storyFlags: {
      vein_guardian_defeated: hasVeinGuardianDefeated(),
    },
  });
  refreshQuestText();
  if (!sceneManager.isTransitioning()) {
    tryTriggerChapter8AftermathEvent();
    tryTriggerRowanCouncilEvent();
    tryTriggerAct2FalloutEvent();
    tryStartChapter2Flow();
    queueChapter2ArrivalBeat();
    tryTriggerChapter6ArrivalEvent();
    tryTriggerWillowMeetEvent();
    startListeningSpikeSetpiece();
    startChapter6RelaySetpiece();
    startChapter8RetaliationSetpiece();
    tryTriggerChapter9StartEvent();
    tryStartEndgameAct1Event();
    tryStartEndgameAct2Event();
  }
  updateChapter8AftermathSequence(deltaSeconds);
  updateRowanCouncilSequence(deltaSeconds);
  updateChapter3DebriefSequence(deltaSeconds);
  updateChapter4RowanReportSequence(deltaSeconds);
  updateChapter5AftershockSequence(deltaSeconds);
  updateChapter6ArrivalSequence(deltaSeconds);
  updateAct2FalloutSequence(deltaSeconds);
  updateChapter2ArrivalSequence(deltaSeconds);
  updateWillowMeetSequence(deltaSeconds);
  updateWillowAmbushSetpiece(deltaSeconds);
  updateListeningSpikeSetpiece(deltaSeconds);
  updateRidgePatrolSetpiece(deltaSeconds);
  updateChapter6RelaySetpiece(deltaSeconds);
  updateChapter8RetaliationSetpiece(deltaSeconds);
  updateChapter6WaystoneLoreSequence(deltaSeconds);
  updateChapter9StartSequence(deltaSeconds);
  updateChapter9Setpiece(deltaSeconds);
  updateChapter9LoreVisionSequence(deltaSeconds);
  updateEndgameAct1StartSequence(deltaSeconds);
  updateThirdSealQuest(deltaSeconds);
  updateSpireBreachSetpiece(deltaSeconds);
  updateSpireGatewardenBossMechanics(deltaSeconds);
  updateEndgameAct2StartSequence(deltaSeconds);
  updateResonanceLockSetpiece(deltaSeconds);
  updateLoomProctorBossMechanics(deltaSeconds);
  updateEndgameAct2LoreSequence(deltaSeconds);
  updateEndgameAct3StartSequence(deltaSeconds);
  updateLastSpireRiftSetpiece(deltaSeconds);
  updateEndgameAct3LorePanelsSequence(deltaSeconds);
  updateLastSpireCoreSetpiece(deltaSeconds);
  updateNarratorCrownBossMechanics(deltaSeconds);

  const frozenForTransition = sceneManager.isTransitioning();
  const frozenForDialogue = dialogueBox.isOpen();
  const frozenForShrine = shrineSystem.isOpen();
  const frozenForVaelorisChoice = vaelorisChoicePanel.isOpen();
  const frozenForHarvesterChoice = harvesterChoicePanel.isOpen();
  const frozenForListeningSpikeChoice = listeningSpikeChoicePanel.isOpen();
  const frozenForVaultChoice = vaultChoicePanel.isOpen();
  const frozenForLoreVision = loreVisionOverlay.isOpen();
  const frozenForCinematicPanel = cinematicPanelOverlay.isOpen();
  const frozenForEndingChoice = endingChoicePanel.isOpen();
  const frozenForCredits = creditsOverlay.isOpen();
  const frozenForSceneUi = sceneManager.hasBlockingUiScene();
  const frozenForIntroText = introTextBeat.isActive();
  const frozenForChapter9Channel = Boolean(chapter9SetpieceState.channeling);
  const frozenForThirdSealChannel = Boolean(thirdSealQuestState.channeling);
  const frozenForSpireBreachChannel = Boolean(spireBreachState.channeling);
  const frozenForResonanceChannel = Boolean(getResonanceChannelState());
  const frozenForRiftChannel = Boolean(lastSpireState.riftChanneling);
  const frozenForCoreChannel = Boolean(lastSpireState.coreChanneling);
  const frozenForElaineCast = Boolean(elaineSpellCast?.rooted && activePartyMember === "elaine");
  if (controlLockRemaining > 0) {
    controlLockRemaining = Math.max(0, controlLockRemaining - deltaSeconds);
  }
  const freezeInput =
    frozenForTransition ||
    frozenForDialogue ||
    frozenForShrine ||
    frozenForVaelorisChoice ||
    frozenForHarvesterChoice ||
    frozenForListeningSpikeChoice ||
    frozenForVaultChoice ||
    frozenForLoreVision ||
    frozenForCinematicPanel ||
    frozenForEndingChoice ||
    frozenForCredits ||
    frozenForSceneUi ||
    frozenForIntroText ||
    frozenForChapter9Channel ||
    frozenForThirdSealChannel ||
    frozenForSpireBreachChannel ||
    frozenForResonanceChannel ||
    frozenForRiftChannel ||
    frozenForCoreChannel ||
    frozenForElaineCast ||
    controlLockRemaining > 0;
  updateWillowAutoStance(deltaSeconds, { freezeInput });
  if (!freezeInput && !sceneManager.isTransitioning()) {
    maybeTriggerVeinGuardian();
    maybeTriggerHarvesterWarden();
  }
  updateVaelorisFieldOperation(deltaSeconds, {
    allowTrigger: !freezeInput && !sceneManager.isTransitioning(),
  });
  updateVaelorisPatrolPressure(deltaSeconds, {
    allowSpawn:
      !freezeInput &&
      !sceneManager.isTransitioning() &&
      !dialogueBox.isOpen() &&
      !bossInstance.isActive() &&
      !guardianCombatForced &&
      getEffectiveMovementContext() === "exploration",
  });
  if (freezeInput) {
    inputManager.clearTouchTarget();
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
    playerController.interruptCharge();
    resetSwordAttackState();
  }

  const inputState = freezeInput
    ? {
        desiredMoveVector: new THREE.Vector2(0, 0),
        desiredMoveTarget: null,
        wantsRun: false,
        clearTarget: () => {},
      }
    : inputManager.getState();

  if (inputState.desiredMoveVector.lengthSq() > 0) {
    pendingMobileAttackEnemyId = null;
    pendingNpcInteractionId = null;
  }

  if (!freezeInput && pendingMobileAttackEnemyId) {
    const guardianTarget =
      pendingMobileAttackEnemyId === VEIN_GUARDIAN_ID ? bossInstance.getTargetPoint() : null;
    const enemyTarget = guardianTarget
      ? new THREE.Vector2(guardianTarget.x, guardianTarget.z)
      : combatSystem.getEnemyTargetPoint(pendingMobileAttackEnemyId);
    if (!enemyTarget) {
      pendingMobileAttackEnemyId = null;
      inputManager.clearTouchTarget();
    } else {
      const distanceToEnemy = Math.hypot(player.position.x - enemyTarget.x, player.position.z - enemyTarget.y);
      if (distanceToEnemy <= getPrimaryAutoAttackRange(activePartyMember)) {
        playerController.requestLightAttack({
          targetEnemyId: pendingMobileAttackEnemyId,
          targetPoint: enemyTarget,
        });
        pendingMobileAttackEnemyId = null;
        inputManager.clearTouchTarget();
      } else {
        touchInput.setMoveTarget(enemyTarget);
      }
    }
  }

  const nearNpc = sceneManager.getNearestNpcInRange(getPlayerXZ(), 1.06);
  sceneManager.setNpcFocus(nearNpc?.id ?? null);
  const usingMobileUi = isMobileUiEnabled();
  const shrinePrompt = !usingMobileUi && shrineSystem.getPromptText();
  const vaelorisPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    currentSceneInfo.sceneId === "hollowScar" &&
    vaelorisChoice === VAELORIS_CHOICE_VALUES.NONE &&
    hasVeinGuardianDefeated() &&
    hasVaelorisFieldTriggered() &&
    vaelorisConstructsAlive <= 0 &&
    isNearVaelorisExtractor()
      ? "Press Space to inspect extractor"
      : "";
  const ridgeGatePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearLockedAshGate()
      ? "Press Space to inspect the ash gate"
      : "";
  const listeningSpikePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearListeningSpikeInteraction()
      ? "Press Space to inspect listening spike"
      : "";
  const windwardRelayPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearChapter6RelayTetherInteraction()
      ? "Press Space to sever tether post"
      : "";
  const waystonePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearWaystoneInteraction()
      ? "Press Space to attune the Waystone"
      : "";
  const muteSpikePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearChapter8MuteSpikeInteraction()
      ? "Press Space to destroy mute spike"
      : "";
  const chapter9AnchorPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearChapter9AnchorInteraction()
      ? "Press Space to attune Worldroot Anchor"
      : "";
  const chapter9EchoPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearChapter9EchoNodeInteraction()
      ? "Press Space to shatter Echo Node"
      : "";
  const thirdSealPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearThirdSealInteraction()
      ? "Press Space to bind Oath Sigil"
      : "";
  const spireLockNodePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearSpireLockNodeInteraction()
      ? "Press Space to disable Lock Node"
      : "";
  const resonanceLockPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearResonanceLockInteraction()
      ? "Press Space to align Resonance Lock"
      : "";
  const prismPillarPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearLoomPrismPillarInteraction()
      ? "Press Space to shatter Prism Pillar"
      : "";
  const lastDoorPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearLastDoorInteraction()
      ? "Press Space to listen at the Last Door"
      : "";
  const riftAnchorPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearRiftAnchorInteraction()
      ? "Press Space to stabilize Rift Anchor"
      : "";
  const finalClampPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !riftAnchorPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearFinalClampInteraction()
      ? "Press Space to disable Final Clamp"
      : "";
  const endingChoicePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !riftAnchorPrompt &&
    !finalClampPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    !vaultChoicePanel.isOpen() &&
    !loreVisionOverlay.isOpen() &&
    isNearEndingChoiceAltar()
      ? "Press Space to choose the ending"
      : "";
  const ridgePatrolPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !chapter9AnchorPrompt &&
    !chapter9EchoPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !riftAnchorPrompt &&
    !finalClampPrompt &&
    !endingChoicePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearRidgeGateBlockedByPatrol()
      ? "Press Space to inspect the ridge road"
      : "";
  const rootwayBlockedPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !ridgePatrolPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearRootwayGateBlockedByRetaliation()
      ? "Press Space to inspect the rootway gate"
      : "";
  const sealedRidgePrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !ridgePatrolPrompt &&
    !rootwayBlockedPrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearLockedRidgeGate()
      ? "Press Space to inspect the ridge gate"
      : "";
  const sealedRootwayPrompt =
    !usingMobileUi &&
    !shrinePrompt &&
    !vaelorisPrompt &&
    !ridgeGatePrompt &&
    !listeningSpikePrompt &&
    !windwardRelayPrompt &&
    !waystonePrompt &&
    !muteSpikePrompt &&
    !ridgePatrolPrompt &&
    !rootwayBlockedPrompt &&
    !sealedRidgePrompt &&
    !thirdSealPrompt &&
    !spireLockNodePrompt &&
    !resonanceLockPrompt &&
    !prismPillarPrompt &&
    !lastDoorPrompt &&
    !dialogueBox.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen() &&
    isNearLockedRootwayGate()
      ? "Press Space to inspect the rootway gate"
      : "";
  vaelorisExtractorPromptVisible = Boolean(vaelorisPrompt);
  lastInteractionPrompt =
    shrinePrompt ||
    vaelorisPrompt ||
    ridgeGatePrompt ||
    listeningSpikePrompt ||
    windwardRelayPrompt ||
    waystonePrompt ||
    muteSpikePrompt ||
    chapter9AnchorPrompt ||
    chapter9EchoPrompt ||
    thirdSealPrompt ||
    spireLockNodePrompt ||
    resonanceLockPrompt ||
    prismPillarPrompt ||
    lastDoorPrompt ||
    riftAnchorPrompt ||
    finalClampPrompt ||
    endingChoicePrompt ||
    ridgePatrolPrompt ||
    rootwayBlockedPrompt ||
    sealedRidgePrompt ||
    sealedRootwayPrompt ||
    (!usingMobileUi &&
    nearNpc &&
    !dialogueBox.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen()
      ? "Press Space to talk"
      : "");

  lastMovementInfo = playerController.update({
    dtSeconds: deltaSeconds,
    playerPosition: player.position,
    inputState,
    worldContext: { context: getEffectiveMovementContext() },
  });

  const aiInputAllowed =
    !freezeInput &&
    !sceneManager.isTransitioning() &&
    !sceneManager.hasBlockingUiScene() &&
    !dialogueBox.isOpen() &&
    !shrineSystem.isOpen() &&
    !vaelorisChoicePanel.isOpen() &&
    !harvesterChoicePanel.isOpen() &&
    !listeningSpikeChoicePanel.isOpen();
  const combatContextActive = getEffectiveMovementContext() === "combat";
  updateElaineSupportAi(deltaSeconds, { allowAi: aiInputAllowed, combatActive: combatContextActive });
  updateWillowSupportAi(deltaSeconds, { allowAi: aiInputAllowed, combatActive: combatContextActive });
  const arthurAiAttackEvents = updateArthurInactiveAi(deltaSeconds, {
    allowAi: aiInputAllowed && combatContextActive,
  });

  if (freezeInput) {
    lastMovementInfo.attackEvents = [];
  }

  updatePlayerHitMotion(deltaSeconds);

  lastGuardianFrame = bossInstance.update(deltaSeconds, {
    elapsedSeconds: world.elapsedSeconds,
    playerPosition: player.position,
    onPlayerDamaged,
  });
  guardianCombatForced = Boolean(lastGuardianFrame.active);
  pacingDirector.setPaused(guardianCombatForced);

  veinPlayerProbe.set(player.position.x, player.position.z);
  if (debugVeinSuppressionRemaining > 0) {
    debugVeinSuppressionRemaining = Math.max(0, debugVeinSuppressionRemaining - deltaSeconds);
  }
  lastVeinFrame = updateThreatVeins(deltaSeconds, veinPlayerProbe, {
    sceneId: currentSceneInfo.sceneId,
    elapsedSeconds: world.elapsedSeconds,
    camera,
    playerStrain: pacingDirector.playerStrain,
    waveCountOffset: getCrownMoodInfluence().veinWaveOffset ?? 0,
    waveBreathScale: getCrownMoodInfluence().veinWaveBreathScale ?? 1,
    regionBaselinePressure: sceneManager.getRegionBaselinePressure(),
    getEncounterComposition: (pressure) =>
      pacingDirector.getEncounterComposition(pressure, {
        sceneId: currentSceneInfo.sceneId,
        crownTier: crownMood.getTierLabel(),
        pressureStage: vaelorisPressureStage,
        forVein: true,
      }),
    spawnEnemies: (definitions) => combatSystem.spawnEnemies(definitions),
    countAliveEnemies: (enemyIds) => combatSystem.countAliveEnemiesByIds(enemyIds),
    despawnEnemies: (enemyIds) => combatSystem.despawnEnemiesByIds(enemyIds),
    saveState,
    suppressActivation: guardianCombatForced || debugVeinSuppressionRemaining > 0,
    onToast: (message, durationSeconds) => setTransientMessage(message, durationSeconds),
    onVeinStarted: () => setVeinDroneEnabled(true),
    onVeinEnded: () => setVeinDroneEnabled(false),
    onWaveStart: () => audioBus.play("root_surge"),
    onDirectorEvent: (name) => {
      pacingDirector.recordEvent(name);
      if (name === "vein_completed") {
        adjustCrownMood(CROWN_MOOD_VEIN_COMPLETED_DELTA, "threat_vein_completed");
      } else if (name === "vein_failed") {
        adjustCrownMood(CROWN_MOOD_VEIN_FAILED_DELTA, "threat_vein_failed");
      }
    },
    onStabilityReward: (amount, vein) => {
      world.applyStabilityBump(amount, currentSceneInfo.regionId ?? vein.sceneId, currentSceneInfo.regionName);
      stabilityToastText = "+Stability";
      stabilityToastSeconds = Math.max(stabilityToastSeconds, 1.2);
    },
  });
  setVeinDroneEnabled(lastVeinFrame.active && !guardianCombatForced);
  const veinBarrierActiveNow = Boolean(lastVeinFrame.active && lastVeinFrame.barrierScale > 0.02);
  if (veinBarrierActiveNow !== lastAutoRefreshVeinBarrierActive) {
    lastAutoRefreshVeinBarrierActive = veinBarrierActiveNow;
    markMapDirty();
  }
  if (lastVeinFrame.correctedPlayerPosition) {
    player.position.x = lastVeinFrame.correctedPlayerPosition.x;
    player.position.z = lastVeinFrame.correctedPlayerPosition.y;
  }
  const bossCorrection = bossInstance.getPlayerCorrection();
  if (bossCorrection) {
    player.position.x = bossCorrection.x;
    player.position.z = bossCorrection.y;
  }

  let willowManualDamage = 0;
  const activeAttackProfile = getPrimaryAttackProfile(activePartyMember);
  const playerMeleeAttackEvents = activeAttackProfile === "melee" ? lastMovementInfo.attackEvents : [];
  lastPlayerMeleeEventCount = playerMeleeAttackEvents.length;
  if (activeAttackProfile === "ranged" && lastMovementInfo.attackEvents.length > 0) {
    for (const attackEvent of lastMovementInfo.attackEvents) {
      if (activePartyMember === "willow") {
        const resolvedTargetId =
          attackEvent.targetEnemyId ??
          combatSystem.getClosestAliveEnemy(
            new THREE.Vector2(
              player.position.x + (attackEvent.direction?.x ?? playerFacingVector.x) * 2.1,
              player.position.z + (attackEvent.direction?.y ?? playerFacingVector.y) * 2.1
            ),
            1.25
          )?.id ??
          null;
        const targetPoint =
          (resolvedTargetId ? combatSystem.getEnemyTargetPoint(resolvedTargetId) : null) ??
          new THREE.Vector2(
            player.position.x + (attackEvent.direction?.x ?? playerFacingVector.x) * 2.35,
            player.position.z + (attackEvent.direction?.y ?? playerFacingVector.y) * 2.35
          );
        const damage = partySystem.triggerWillowBolt(resolvedTargetId, targetPoint, {
          sourcePosition: player.position,
          damage: attackEvent.type === "charge" ? WILLOW_BOLT_CHARGED_DAMAGE : WILLOW_BOLT_LIGHT_DAMAGE,
          cooldown: 0.16,
          ignoreCooldown: true,
        });
        if (damage > 0) {
          aiStats.willowBoltCount += 1;
          willowManualDamage += damage;
          if (resolvedTargetId) {
            lastArthurTargetEnemyId = resolvedTargetId;
          }
          if (attackEvent.type === "charge") {
            const direction = attackEvent.direction?.clone?.() ?? new THREE.Vector2(0, 1);
            if (direction.lengthSq() <= 1e-6) {
              direction.set(0, 1);
            } else {
              direction.normalize();
            }
            const nudge = CAMERA_ATTACK_NUDGE_WORLD * 0.84;
            cameraAttackNudgeOffset.x += direction.x * nudge;
            cameraAttackNudgeOffset.y += direction.y * nudge;
          }
        }
      } else if (activePartyMember === "elaine") {
        const targetIntent = resolveElaineBoltTargetIntent(attackEvent);
        const sourcePosition = resolveElaineBoltSourcePosition();
        const isChargedBolt = attackEvent.type === "charge";
        const damage = partySystem.triggerHolyBolt(
          targetIntent.targetEnemyId,
          targetIntent.targetPoint,
          isChargedBolt ? ELAINE_CHARGED_BOLT_DAMAGE_MULTIPLIER : 1,
          {
            sourcePosition: { x: sourcePosition.x, z: sourcePosition.y },
            cooldown: isChargedBolt ? ELAINE_CHARGED_BOLT_COOLDOWN : ELAINE_BASIC_BOLT_COOLDOWN,
            maxRange: ELAINE_BOLT_TARGET_RANGE,
          }
        );
        if (damage > 0) {
          aiStats.elaineHolyBoltCount += 1;
          if (targetIntent.targetEnemyId) {
            lastArthurTargetEnemyId = targetIntent.targetEnemyId;
          }
          elaineBoltCastFlashRemaining = Math.max(
            elaineBoltCastFlashRemaining,
            isChargedBolt ? ELAINE_BOLT_CAST_FLASH_SECONDS + 0.06 : ELAINE_BOLT_CAST_FLASH_SECONDS
          );
          if (isChargedBolt) {
            const direction = attackEvent.direction?.clone?.() ?? new THREE.Vector2(0, 1);
            if (direction.lengthSq() <= 1e-6) {
              direction.set(0, 1);
            } else {
              direction.normalize();
            }
            const nudge = CAMERA_ATTACK_NUDGE_WORLD * 0.46;
            cameraAttackNudgeOffset.x += direction.x * nudge;
            cameraAttackNudgeOffset.y += direction.y * nudge;
          }
        }
      }
    }
  }
  const activeMeleeAttackerId = activePartyMember === "elaine" ? STATUS_ENTITY_IDS.ELAINE : STATUS_ENTITY_IDS.ARTHUR;
  const guardianAttackResult = guardianCombatForced
    ? bossInstance.applyPlayerAttackEvents(playerMeleeAttackEvents, player.position, {
        heavyDamageMultiplier: playerHeavyDamageMultiplier,
        attackMultiplier: statusEffects.getAttackMultiplier(activeMeleeAttackerId),
      })
    : { consumedIndexes: [], damageDealt: 0 };
  const guardianConsumedSet = new Set(guardianAttackResult.consumedIndexes ?? []);
  const combatAttackEvents = playerMeleeAttackEvents
    .map((attackEvent) => {
      const baseMultiplier = attackEvent.type === "charge" ? playerHeavyDamageMultiplier : 1;
      return {
        ...attackEvent,
        attackerId: attackEvent.attackerId ?? activeMeleeAttackerId,
        damageType: attackEvent.damageType ?? "physical",
        damageMultiplier: Math.max(0, Number(attackEvent.damageMultiplier) || baseMultiplier),
      };
    })
    .filter((_, index) => !guardianConsumedSet.has(index))
    .concat(arthurAiAttackEvents);

  lastSpriteFrame = updatePlayerPresentation(deltaSeconds, lastMovementInfo);
  updateCamera(deltaSeconds);

  const enemyThreatTargets = buildEnemyThreatTargets();
  lastCombatFrame = combatSystem.update(deltaSeconds, {
    playerPosition: player.position,
    threatTargets: enemyThreatTargets,
    attackEvents: combatAttackEvents,
    onPlayerDamaged,
    onPartyDamaged: onPlayerDamaged,
    onStatusApplied: onEnemyStatusApplied,
    onEnemyHit: (hit) => {
      if (hit?.targetId) {
        lastArthurTargetEnemyId = hit.targetId;
      }
      if (hit?.targetId && hasElaineJoined() && !elaineDowned) {
        const boltDamage = partySystem.triggerHolyBolt(
          hit.targetId,
          { x: player.position.x, z: player.position.z },
          1
        );
        if (boltDamage > 0) {
          pacingDirector.recordDamageDealt(boltDamage);
        }
      }
      if (!hit || hit.type !== "charge") return;
      const direction = hit.direction?.clone?.() ?? new THREE.Vector2(0, 1);
      if (direction.lengthSq() <= 1e-6) {
        direction.set(0, 1);
      } else {
        direction.normalize();
      }
      const nudge = CAMERA_ATTACK_NUDGE_WORLD * (0.82 + (hit.chargeRatio ?? 0) * 0.55);
      cameraAttackNudgeOffset.x += direction.x * nudge;
      cameraAttackNudgeOffset.y += direction.y * nudge;
    },
  });
  combatFromEnemies = lastCombatFrame.combatActive;
  const partyResult = partySystem.update({
    dtSeconds: deltaSeconds,
    elapsedSeconds: world.elapsedSeconds,
    sceneId: currentSceneInfo.sceneId,
    camera,
    playerPosition: player.position,
    tacticsMode: getTacticsMode(),
    preferredTargetEnemyId: lastArthurTargetEnemyId || "",
    combatActive: combatContextActive,
    bossInstanceActive: guardianCombatForced || bossInstance.isActive(),
    partyVitals: {
      arthur: {
        hp: playerState.hp,
        maxHp: playerState.maxHP,
        downed: arthurDowned,
      },
      elaine: {
        hp: elaineHp,
        maxHp: elaineMaxHp,
        downed: elaineDowned,
      },
      willow: {
        hp: 100,
        maxHp: 100,
        downed: false,
      },
    },
    elaineCastRooted: Boolean(elaineSpellCast?.rooted),
  });
  const partySnapshot = partySystem.getState();
  lastPartyAiFrame = partyResult?.ai ?? partySnapshot.ai ?? partySystem.getAiState?.() ?? lastPartyAiFrame;
  const willowShotCount = Number(partySnapshot.willowShotCount) || 0;
  const willowShotDelta = Math.max(0, willowShotCount - lastWillowShotCountSeen);
  if (willowShotDelta > 0 && activePartyMember !== "willow") {
    aiStats.willowBoltCount += willowShotDelta;
  }
  lastWillowShotCountSeen = willowShotCount;
  lastPartyFrame = {
    damageDealt: Number(((partyResult?.damageDealt ?? 0) + willowManualDamage).toFixed(2)),
    ...partySnapshot,
    ai: lastPartyAiFrame,
  };
  lastGuardianFrame = bossInstance.getState();
  guardianCombatForced = Boolean(lastGuardianFrame.active);
  if (guardianCombatForced !== lastAutoRefreshBossBarrierActive) {
    lastAutoRefreshBossBarrierActive = guardianCombatForced;
    markMapDirty();
  }
  vfxSystem.update(deltaSeconds);

  if (lastCombatFrame.damageDealt > 0) {
    pacingDirector.recordDamageDealt(lastCombatFrame.damageDealt);
  }
  if (partyResult?.damageDealt > 0) {
    pacingDirector.recordDamageDealt(partyResult.damageDealt);
  }
  if (willowManualDamage > 0) {
    pacingDirector.recordDamageDealt(willowManualDamage);
  }
  if (lastCombatFrame.damageTaken > 0) {
    pacingDirector.recordDamageTaken(lastCombatFrame.damageTaken);
  }
  updateOpeningBeat(deltaSeconds);
  const firstVeinCompleted = Boolean(saveState.getStoryFlag(FIRST_VEIN_COMPLETION_FLAG));
  if (!firstVeinCompletedLatched && firstVeinCompleted) {
    firstVeinCompletedLatched = true;
    setStoryFlag("first_vein_stabilized", true);
    const stabilizedCount = Math.max(
      0,
      Number(getStoryValue("progress_beats.veins_stabilized_count", "story.", 0)) || 0
    );
    setStoryValue("progress_beats.veins_stabilized_count", Math.max(stabilizedCount, 1));
    if (hasVeinQuestActive() && !hasVeinQuestComplete()) {
      setTransientMessage("The ground breathes easier.", 1.9);
      setVeinQuestComplete(true);
      setVeinQuestActive(false);
      beginElaineIntro();
    }
    refreshQuestText();
  }
  updateElaineIntro(deltaSeconds);
  updatePulseEvent(deltaSeconds);
  pacingDirector.update(deltaSeconds, {
    inCombat: getEffectiveMovementContext() === "combat",
    playerHealthRatio:
      (activePartyMember === "elaine" ? elaineHp / Math.max(1, elaineMaxHp) : playerState.hp / playerState.maxHP) || 0,
  });

  world.update(deltaSeconds);
  statusEffects.setTime(world.elapsedSeconds);
  const explorationActive = getEffectiveMovementContext() === "exploration" && !frozenForTransition && !dialogueBox.isOpen();
  lastAnomalyFrame = anomalySystem.update(deltaSeconds, {
    elapsedSeconds: world.elapsedSeconds,
    playerPosition: player.position,
    explorationActive,
    sceneId: currentSceneInfo.sceneId,
    omenTier: world.getOmenTier(),
    camera,
    onCollected: () => {
      verdantMoteCount += 1;
      world.triggerAnomalyCalm();
      audioBus.play("anomaly_collected");
      setTransientMessage("A warm hum brushes your skin.", 2.1);
    },
  });
  updateAmbientMoteSystem(ambientMoteSystem, deltaSeconds, world.elapsedSeconds, cameraFollowTarget);
  updateGuidanceLine();
  updateIdleBanter(deltaSeconds, { freezeInput });

  saveWriteAccumulator += deltaSeconds;
  safeSpotWriteAccumulator += deltaSeconds;
  if (saveWriteAccumulator >= 0.5 && !sceneManager.isTransitioning() && isPlayableScene(currentSceneInfo.sceneId)) {
    saveState.setPlayerPosition(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
    saveWriteAccumulator = 0;
  }
  if (
    safeSpotWriteAccumulator >= SAFE_SPOT_UPDATE_SECONDS &&
    !sceneManager.isTransitioning() &&
    isPlayableScene(currentSceneInfo.sceneId) &&
    getEffectiveMovementContext() === "exploration" &&
    !dialogueBox.isOpen() &&
    !lastVeinFrame.active
  ) {
    saveState.setSafeSpot(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
    safeSpotWriteAccumulator = 0;
  }

  applyWorldVisuals(deltaSeconds);
}

function render() {
  sceneManager.render({
    camera,
    dtSeconds: fixedStep,
    elapsedSeconds: world.elapsedSeconds,
  });
  renderer.render(scene, camera);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("resize", resize);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

let accumulator = 0;
let lastTime = performance.now();
function gameLoop(currentTime) {
  const deltaSeconds = Math.min(0.1, (currentTime - lastTime) / 1000);
  lastTime = currentTime;

  if (!screenshotMode) {
    accumulator += deltaSeconds;
    while (accumulator >= fixedStep) {
      update(fixedStep);
      accumulator -= fixedStep;
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

window.setScreenshotMode = (enabled) => {
  screenshotMode = Boolean(enabled);
  if (!screenshotMode) {
    lastTime = performance.now();
  }
};

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (fixedStep * 1000)));
  for (let i = 0; i < steps; i += 1) {
    update(fixedStep);
  }
  render();
};

function getDebugRenderState() {
  const activeCharacter = normalizePartyCharacterId(activePartyMember);
  const partyRenderState = partySystem.getRenderState?.() ?? {};
  const activeEntry = {
    hasBase: true,
    baseVisible: Boolean(player.visible),
    hasWeapon: Boolean(activeWeaponSprite.visible),
    weaponScale: Number((activeWeaponSprite.scale?.x ?? 0).toFixed(3)),
    groupScale: Number((player.scale?.x / (PLAYER_SPRITE_WORLD_WIDTH * CHARACTER_SCALE || 1)).toFixed(3)),
    weaponKey: activeWeaponKey,
    glowVisible: Boolean(activeWeaponGlowSprite.visible),
  };

  const buildEntry = (characterId) => {
    if (characterId === activeCharacter) {
      return {
        active: true,
        ...activeEntry,
      };
    }
    const fallback = partyRenderState?.[characterId] ?? {};
    return {
      active: false,
      hasBase: Boolean(fallback.hasBase),
      baseVisible: Boolean(fallback.baseVisible),
      hasWeapon: Boolean(fallback.hasWeapon),
      weaponScale: Number(Number(fallback.weaponScale ?? 0).toFixed(3)),
      groupScale: Number(Number(fallback.groupScale ?? 0).toFixed(3)),
      weaponKey: "",
      glowVisible: false,
    };
  };

  return {
    activeCharacter,
    characters: {
      arthur: buildEntry("arthur"),
      elaine: buildEntry("elaine"),
      willow: buildEntry("willow"),
    },
  };
}

window.render_game_to_text = () => {
  const pacingState = pacingDirector.getState();
  const dialogueState = dialogueBox.getState();
  const sceneUiState = sceneManager.getSceneUiState();
  const hudTargetState = resolveHudTarget();
  const completedVeinFlags = Object.keys(saveState.getStoryFlags()).filter(
    (key) => key.startsWith("vein_completed_") && Boolean(saveState.getStoryFlag(key))
  );
  const debugState = {
    ...world.getPublicDebugState(),
    crown_tier: crownMood.getTierLabel(),
    crown_mood_score: Number(crownMood.getMood().toFixed(3)),
    crown_mood_tier: crownMood.getTierLabel(),
    crown_mood_tier_key: crownMood.getTier(),
    scene_id: currentSceneInfo.sceneId,
    scene_name: currentSceneInfo.sceneName,
    scene_region: currentSceneInfo.regionName,
    debug_scene_id: lastSceneDebugFrame.currentSceneId,
    debug_scene_objects: lastSceneDebugFrame.sceneObjectCount,
    debug_has_ground: lastSceneDebugFrame.hasGroundMesh,
    debug_portals: lastSceneDebugFrame.hasPortalCount,
    debug_npcs: lastSceneDebugFrame.hasNpcCount,
    debug_enemies: lastSceneDebugFrame.hasEnemyCount,
    debug_enemy_attacks_enabled: lastSceneDebugFrame.enemyAttacksEnabled,
    debug_terrain_status: lastSceneDebugFrame.terrainStatusText,
    map_dirty: mapDirty,
    map_refresh_generation: mapRefreshGeneration,
    map_last_render_age: Number(Math.max(0, world.elapsedSeconds - lastMapRenderTimeSeconds).toFixed(3)),
    movement_context: lastMovementInfo.context,
    movement_mode: lastMovementInfo.mode,
    movement_has_target: Boolean(lastMovementInfo.target),
    movement_speed: Number(lastMovementInfo.speed.toFixed(3)),
    pending_npc_interaction: pendingNpcInteractionId,
    combat_dev_override: devCombatOverride,
    combat_scene_forced: sceneCombatForced,
    combat_from_enemies: combatFromEnemies,
    combat_guardian_forced: guardianCombatForced,
    combat_linger: Number(lastCombatFrame.combatLingerRemaining.toFixed(3)),
    transition_active: sceneManager.isTransitioning(),
    player_health: Number(playerState.hp.toFixed(2)),
    player_max_health: playerState.maxHP,
    tactics_mode: getTacticsMode(),
    guidance_line: guidanceLineText,
    current_objective: currentObjectiveState.id,
    objective_progress_key: currentObjectiveState.progressKey,
    active_character: activePartyMember,
    party_active_member: activePartyMember,
    party_arthur_downed: arthurDowned,
    party_arthur_bleedout: Number(Math.max(0, arthurBleedoutRemaining).toFixed(3)),
    party_elaine_health: Number(elaineHp.toFixed(2)),
    party_elaine_max_health: Number(elaineMaxHp.toFixed(2)),
    party_elaine_downed: elaineDowned,
    party_elaine_bleedout: Number(Math.max(0, elaineBleedoutRemaining).toFixed(3)),
    party_elaine_mp: Number(elaineMp.toFixed(2)),
    party_elaine_max_mp: Number(elaineMaxMp.toFixed(2)),
    party_elaine_casting: Boolean(elaineSpellCast),
    party_elaine_cast_spell: elaineSpellCast?.spellId ?? "",
    party_elaine_cast_remaining: Number(Math.max(0, elaineSpellCast?.remaining ?? 0).toFixed(3)),
    party_elaine_buff_remaining: Number(Math.max(0, getElaineBuffRemainingSeconds()).toFixed(3)),
    status_effects: {
      arthur: getStatusIcons(STATUS_ENTITY_IDS.ARTHUR),
      elaine: getStatusIcons(STATUS_ENTITY_IDS.ELAINE),
      willow: getStatusIcons(STATUS_ENTITY_IDS.WILLOW),
      target: (() => {
        const targetId = resolveHudTarget()?.id ?? "";
        return targetId ? getStatusIcons(targetId) : [];
      })(),
    },
    party_willow_mp: Number(willowMp.toFixed(2)),
    party_willow_max_mp: Number(willowMaxMp.toFixed(2)),
    party_willow_stance: willowStance.getWillowStance(),
    party_willow_auto_stance: willowStance.getAutoStanceEnabled(),
    party_willow_spell_cooldowns: { ...willowSpellCooldowns },
    mobile_ui_enabled: isMobileUiEnabled(),
    mobile_ui_forced: debugForceMobileUi,
    elaine_spellbar_visible: (() => {
      const spellbar = document.getElementById("elaine-spellbar");
      return Boolean(spellbar && spellbar.style.display !== "none");
    })(),
    willow_spellbar_visible: (() => {
      const spellbar = document.getElementById("willow-spellbar");
      return Boolean(spellbar && spellbar.style.display !== "none");
    })(),
    tactics_toggle_visible: (() => {
      const toggle = document.querySelector("[data-testid='tactics-toggle']");
      return Boolean(toggle && toggle.style.display !== "none");
    })(),
    willow_auto_toggle_visible: (() => {
      const toggle = document.querySelector("[data-testid='toggle-willow-auto-stance']");
      return Boolean(toggle && toggle.style.display !== "none");
    })(),
    portrait_bar_visible: (() => {
      const bar = document.querySelector("[data-testid='party-portraits']");
      return Boolean(bar && bar.style.display !== "none");
    })(),
    player_invuln_remaining_ms: Math.round(playerState.invulnRemainingSeconds * 1000),
    player_charge: Number(lastMovementInfo.chargeMeter.toFixed(3)),
    player_melee_attack_events: lastPlayerMeleeEventCount,
    player_combo_step: lastMovementInfo.comboStep,
    player_anim_state: lastRenderedAnimState,
    weapon_overlay_mounted: activeWeaponMounted,
    weapon_overlay_key: activeWeaponKey,
    weapon_glow_key: activeWeaponGlowKey,
    weapon_glow_visible: activeWeaponGlowSprite.visible,
    last_attack_type: lastAttackTypePlayed,
    player_sprite: lastSpriteFrame,
    loot_count: lastCombatFrame.lootCount,
    verdant_mote_count: verdantMoteCount,
    relic_shard_count: relicShardCount,
    loot_orbs_active: lastCombatFrame.activeOrbs,
    anomalies_active: lastAnomalyFrame.activeCount,
    anomaly_nearby: lastAnomalyFrame.nearby,
    anomaly_collected_this_frame: lastAnomalyFrame.collected,
    enemy_projectiles_active: lastCombatFrame.activeProjectiles ?? 0,
    vein_active: lastVeinFrame.active,
    vein_id: lastVeinFrame.activeVeinId,
    vein_state: lastVeinFrame.state,
    vein_wave_index: lastVeinFrame.waveIndex,
    vein_total_waves: lastVeinFrame.totalWaves,
    vein_enemies_remaining: lastVeinFrame.enemiesRemaining,
    vein_hud_text: lastVeinFrame.hudText,
    vein_overlay_opacity: Number(lastVeinFrame.localOverlayOpacity.toFixed(4)),
    vein_local_fog_density_delta: Number(lastVeinFrame.localFogDensityDelta.toFixed(5)),
    vein_local_tint_darken: Number(lastVeinFrame.localTintDarken.toFixed(4)),
    vein_local_desaturation: Number(lastVeinFrame.localDesaturation.toFixed(4)),
    vein_wave_transition_active: lastVeinFrame.waveTransitionActive,
    vein_wave_transition_intensity: Number(lastVeinFrame.waveTransitionIntensity.toFixed(4)),
    vein_barrier_scale: Number(lastVeinFrame.barrierScale.toFixed(4)),
    vein_barrier_growth: Number(lastVeinFrame.barrierGrowth.toFixed(4)),
    vein_completed_flags: completedVeinFlags,
    threat_veins: getThreatVeins(),
    npcs: sceneManager.getNpcs(),
    dialogue_active: dialogueState.open,
    dialogue_npc: dialogueState.npcName,
    dialogue_line: dialogueState.currentLine,
    dialogue_line_index: dialogueState.lineIndex,
    start_active: sceneManager.isStartSceneActive(),
    prologue_active: sceneManager.isPrologueSceneActive(),
    title_active: sceneManager.isTitleSceneActive(),
    story_title_seen: Boolean(saveState.getStoryFlag("title_seen") ?? saveState.getFlag("story.title_seen")),
    story_prologue_seen: hasPrologueSeen(),
    story_is_new_game: Boolean(saveState.getStoryFlag("is_new_game") ?? saveState.getFlag("story.is_new_game")),
    story_opening_played: hasOpeningPlayed(),
    story_vein_quest_active: hasVeinQuestActive(),
    story_vein_quest_complete: hasVeinQuestComplete(),
    story_chapter2_started: hasChapter2Started(),
    story_chapter2_arrived_emberfall: hasChapter2ArrivedEmberfall(),
    story_chapter3_rowan_debrief_done: hasChapter3RowanDebriefDone(),
    story_chapter4_rowan_report_done: hasChapter4RowanReportDone(),
    story_chapter5_aftershock_done: hasChapter5AftershockDone(),
    story_listening_spike_lead_unlocked: hasListeningSpikeLeadUnlocked(),
    story_listening_spike_site_cleared: hasListeningSpikeSiteCleared(),
    story_listening_spike_choice: getListeningSpikeChoice(),
    story_willow_met: hasWillowMet(),
    story_emberfall_unlocked: hasStoryEmberfallUnlocked(),
    story_elaine_joined: hasElaineJoined(),
    story_willow_joined: hasWillowJoined(),
    story_vein_guardian_active: hasVeinGuardianActive(),
    story_vein_guardian_defeated: hasVeinGuardianDefeated(),
    story_vaeloris_field_triggered: hasVaelorisFieldTriggered(),
    story_vaeloris_first_choice: vaelorisChoice,
    story_vaeloris_harvester_active: hasHarvesterBossActive(),
    story_vaeloris_harvester_defeated: hasHarvesterBossDefeated(),
    story_vaeloris_harvester_choice: getHarvesterChoice(),
    story_harvester_site_unlocked: hasHarvesterSiteUnlocked(),
    story_harvester_warden_defeated: hasHarvesterBossDefeated(),
    story_vaeloris_pressure_stage: getVaelorisPressureStage(),
    story_rowan_council_done: hasRowanCouncilDone(),
    story_emberfall_lead_unlocked: hasEmberfallLeadUnlocked(),
    story_act2_fallout_done: hasAct2FalloutDone(),
    story_ridge_gate_unlocked: isRidgeGateUnlocked(),
    story_region3_seed_unlocked: hasRegion3SeedUnlocked(),
    story_region3_seed_entered: hasRegion3SeedEntered(),
    story_chapter6_arrived_windward: hasChapter6ArrivedWindward(),
    story_chapter6_relay_dropped: hasChapter6RelayDropped(),
    story_chapter6_waystone_attuned: hasChapter6WaystoneAttuned(),
    story_chapter7_choir_engine_defeated: hasChapter7ChoirEngineDefeated(),
    story_chapter7_convergence_choice: getChapter7ConvergenceChoice(),
    story_chapter8_aftermath_done: hasChapter8AftermathDone(),
    story_chapter8_retaliation_started: hasChapter8RetaliationStarted(),
    story_chapter8_mute_spikes_cleared: hasChapter8MuteSpikesCleared(),
    story_region4_seed_unlocked: hasRegion4SeedUnlocked(),
    story_region4_seed_gate_unlocked: hasRegion4SeedGateUnlocked(),
    story_region4_seed_entered: hasRegion4SeedEntered(),
    story_vaeloris_patrol_setpiece_done: hasVaelorisPatrolSetpieceDone(),
    story_vaeloris_patrol_cleared_once: hasVaelorisPatrolClearedOnce(),
    story_vaeloris_tag_obtained: hasVaelorisTagObtained(),
    story_chapter9_started: hasChapter9Started(),
    story_chapter9_anchors_attuned: hasChapter9AnchorsAttuned(),
    story_chapter9_null_archivist_defeated: hasChapter9NullArchivistDefeated(),
    story_chapter9_null_archivist_active: Boolean(getStoryFlag("chapter9_null_archivist_active")),
    story_chapter9_choice: getChapter9Choice(),
    story_endgame_started: hasEndgameStarted(),
    story_endgame_goal_id: getEndgameGoalId(),
    story_endgame_route_seed_unlocked: hasEndgameRouteSeedUnlocked(),
    story_endgame_act1_started: hasEndgameAct1Started(),
    story_endgame_task_third_seal_obtained: hasEndgameThirdSealObtained(),
    story_endgame_outer_spire_unlocked: hasEndgameOuterSpireUnlocked(),
    story_endgame_outer_spire_breached: hasEndgameOuterSpireBreached(),
    story_endgame_gatewarden_defeated: hasEndgameGatewardenDefeated(),
    story_endgame_spire_entry_unlocked: hasEndgameSpireEntryUnlocked(),
    story_endgame_spire_gatewarden_active: Boolean(getStoryFlag("endgame_spire_gatewarden_active")),
    story_endgame_act2_started: hasEndgameAct2Started(),
    story_endgame_inner_spire_entered: hasEndgameInnerSpireEntered(),
    story_endgame_resonance_lock_1: hasEndgameResonanceLock(1),
    story_endgame_resonance_lock_2: hasEndgameResonanceLock(2),
    story_endgame_resonance_lock_3: hasEndgameResonanceLock(3),
    story_endgame_loom_proctor_defeated: hasEndgameLoomProctorDefeated(),
    story_endgame_loom_proctor_active: Boolean(getStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE)),
    story_endgame_act3_unlocked: hasEndgameAct3Unlocked(),
    story_endgame_last_door_seen: hasEndgameLastDoorSeen(),
    story_endgame_act3_started: hasEndgameAct3Started(),
    story_endgame_last_door_opened: hasEndgameLastDoorOpened(),
    story_endgame_last_spire_entered: hasEndgameLastSpireEntered(),
    story_endgame_setpiece_rift_crossed: hasEndgameSetpieceRiftCrossed(),
    story_endgame_setpiece_core_reached: hasEndgameSetpieceCoreReached(),
    story_endgame_final_boss_defeated: hasEndgameFinalBossDefeated(),
    story_endgame_narrator_active: Boolean(getStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE)),
    story_endgame_choice_made: hasEndgameChoiceMade(),
    story_endgame_ending: getEndgameEnding(),
    story_endgame_credits_seen: hasEndgameCreditsSeen(),
    story_ngplus_unlocked: hasNgPlusUnlocked(),
    story_crownheart_key: Boolean(getStoryFlag("crownheart_key")),
    story_endgame_retaliation_flag: Boolean(getStoryFlag("endgame_retaliation_flag")),
    story_endgame_task_waystone: Boolean(getStoryFlag("endgame_task_waystone")),
    story_endgame_task_crownheart: Boolean(getStoryFlag("endgame_task_crownheart")),
    story_endgame_task_third_seal: Boolean(getStoryFlag("endgame_task_third_seal")),
    story_endgame_task_seal_1: Boolean(getStoryFlag("endgame_task_seal_1")),
    story_endgame_task_seal_2: Boolean(getStoryFlag("endgame_task_seal_2")),
    story_endgame_task_seal_3: Boolean(getStoryFlag("endgame_task_seal_3")),
    chapter2_arrival_pending: Boolean(chapter2ArrivalPending),
    chapter3_debrief_pending: Boolean(chapter3DebriefPending),
    chapter4_rowan_report_pending: Boolean(chapter4RowanReportPending),
    chapter5_aftershock_pending: Boolean(chapter5AftershockPending),
    chapter6_arrival_pending: Boolean(chapter6ArrivalPending),
    chapter6_waystone_lore_pending: Boolean(chapter6WaystoneLorePending),
    chapter2_willow_meet_pending: Boolean(willowMeetPending),
    chapter2_ambush_active: willowAmbushState.active,
    chapter2_ambush_enemy_count: willowAmbushState.enemyIds.length,
    chapter2_ambush_radius: Number(willowAmbushState.radius.toFixed(3)),
    listening_spike_setpiece_active: listeningSpikeSetpieceState.active,
    listening_spike_setpiece_enemy_count: listeningSpikeSetpieceState.enemyIds.length,
    listening_spike_setpiece_radius: Number(listeningSpikeSetpieceState.radius.toFixed(3)),
    ridge_patrol_setpiece_active: ridgePatrolSetpieceState.active,
    ridge_patrol_setpiece_enemy_count: ridgePatrolSetpieceState.enemyIds.length,
    ridge_patrol_setpiece_radius: Number(ridgePatrolSetpieceState.radius.toFixed(3)),
    chapter6_relay_setpiece_active: chapter6RelaySetpieceState.active,
    chapter6_relay_enemy_count: chapter6RelaySetpieceState.active
      ? combatSystem.countAliveEnemiesByIds(chapter6RelaySetpieceState.enemyIds)
      : 0,
    chapter6_relay_tethers_remaining: getRelaySetpieceRemainingTethers(),
    chapter6_relay_radius: Number(chapter6RelaySetpieceState.radius.toFixed(3)),
    chapter8_retaliation_setpiece_active: chapter8RetaliationSetpieceState.active,
    chapter8_retaliation_enemy_count: chapter8RetaliationSetpieceState.active
      ? combatSystem.countAliveEnemiesByIds(chapter8RetaliationSetpieceState.enemyIds)
      : 0,
    chapter8_retaliation_spikes_remaining: getChapter8RetaliationRemainingSpikes(),
    chapter8_retaliation_ward_markers: chapter8RetaliationSetpieceState.wardMarkers.length,
    chapter8_retaliation_radius: Number(chapter8RetaliationSetpieceState.radius.toFixed(3)),
    chapter9_setpiece_active: chapter9SetpieceState.active,
    chapter9_start_pending: Boolean(chapter9StartPending),
    chapter9_lore_pending: Boolean(chapter9LoreVisionPending),
    chapter9_anchor_channeling: Boolean(chapter9SetpieceState.channeling),
    chapter9_anchor_channel_index: Number(chapter9SetpieceState.channeling?.anchorIndex ?? -1),
    chapter9_anchor_channel_remaining: Number(
      Math.max(0, Number(chapter9SetpieceState.channeling?.remaining ?? 0)).toFixed(3)
    ),
    chapter9_anchors_remaining: getChapter9AnchorCountRemaining(),
    chapter9_sunder_active: chapter9SetpieceState.sunderActive,
    chapter9_sunder_meter: Number(Math.max(0, Number(chapter9SetpieceState.sunderMeter) || 0).toFixed(4)),
    chapter9_sunder_waves: Number(chapter9SetpieceState.sunderWaves ?? 0),
    chapter9_sunder_failures: Number(chapter9SetpieceState.failures ?? 0),
    chapter9_echo_nodes_alive: chapter9SetpieceState.echoNodes.filter((node) => node?.alive).length,
    chapter9_null_fields_active: chapter9SetpieceState.nullFields.length,
    chapter9_boss_started: Boolean(chapter9SetpieceState.bossStarted),
    chapter9_vault_choice_open: vaultChoicePanel.isOpen(),
    chapter9_lore_vision_open: loreVisionOverlay.isOpen(),
    endgame_act1_start_pending: Boolean(endgameAct1StartPending),
    endgame_act2_start_pending: Boolean(endgameAct2StartPending),
    endgame_act2_lore_pending: Boolean(endgameAct2LorePending),
    endgame_act3_start_pending: Boolean(endgameAct3StartPending),
    endgame_act3_lore_pending: Boolean(endgameAct3LorePanelsPending),
    third_seal_setpiece_active: Boolean(thirdSealQuestState.active),
    third_seal_setpiece_started: Boolean(thirdSealQuestState.started),
    third_seal_attune_ready: Boolean(thirdSealQuestState.attuneReady),
    third_seal_attuned: Boolean(thirdSealQuestState.attuned),
    third_seal_channeling: Boolean(thirdSealQuestState.channeling),
    third_seal_channel_remaining: Number(Math.max(0, Number(thirdSealQuestState.channeling?.remaining ?? 0)).toFixed(3)),
    spire_breach_active: Boolean(spireBreachState.active),
    spire_breach_started: Boolean(spireBreachState.started),
    spire_breach_meter_active: Boolean(spireBreachState.meterActive),
    spire_breach_meter: Number(Math.max(0, Number(spireBreachState.meter) || 0).toFixed(4)),
    spire_breach_discharges: Number(spireBreachState.discharges ?? 0),
    spire_breach_channeling: Boolean(spireBreachState.channeling),
    spire_breach_channel_node_index: Number(spireBreachState.channeling?.nodeIndex ?? -1),
    spire_breach_channel_remaining: Number(Math.max(0, Number(spireBreachState.channeling?.remaining ?? 0)).toFixed(3)),
    spire_breach_nodes_remaining: spireBreachState.lockNodes.reduce(
      (count, node) => count + (node?.disabled ? 0 : 1),
      0
    ),
    spire_gatewarden_boss_started: Boolean(spireBreachState.bossStarted),
    inner_spire_active: Boolean(innerSpireState.active),
    inner_spire_initialized: Boolean(innerSpireState.initialized),
    inner_spire_lock_channeling: Boolean(innerSpireState.lockChanneling),
    inner_spire_locks_remaining: getResonanceLockCountRemaining(),
    inner_spire_lock_channel_index: Number(getResonanceChannelState()?.index ?? -1),
    inner_spire_lock_channel_remaining: Number(Math.max(0, Number(getResonanceChannelState()?.remaining ?? 0)).toFixed(3)),
    inner_spire_memory_pressure_active: Boolean(memoryPressureTracker.getState().active),
    inner_spire_memory_pressure: Number(Math.max(0, Number(memoryPressureTracker.getState().value ?? 0)).toFixed(4)),
    inner_spire_memory_pressure_tiers: Array.isArray(memoryPressureTracker.getState().triggeredThresholds)
      ? memoryPressureTracker.getState().triggeredThresholds.length
      : 0,
    loom_proctor_boss_started: Boolean(innerSpireState.loomBossStarted),
    loom_proctor_phase: innerSpireState.currentPhase,
    loom_proctor_prism_pillars_alive: innerSpireState.prismPillars.reduce((count, pillar) => count + (pillar?.alive ? 1 : 0), 0),
    loom_proctor_fissures_active: innerSpireState.fissures.length,
    last_spire_active: Boolean(lastSpireState.active),
    last_spire_initialized: Boolean(lastSpireState.initialized),
    last_spire_rift_active: Boolean(lastSpireState.riftActive),
    last_spire_rift_stability: Number(Math.max(0, Number(lastSpireState.riftStability) || 0).toFixed(4)),
    last_spire_rift_shockwaves: Number(lastSpireState.riftShockwaves ?? 0),
    last_spire_rift_anchors_attuned: lastSpireState.riftAnchors.reduce((count, anchor) => count + (anchor?.attuned ? 1 : 0), 0),
    last_spire_rift_channeling: Boolean(lastSpireState.riftChanneling),
    last_spire_rift_channel_anchor_index: Number(lastSpireState.riftChanneling?.anchorIndex ?? -1),
    last_spire_rift_channel_remaining: Number(Math.max(0, Number(lastSpireState.riftChanneling?.remaining ?? 0)).toFixed(3)),
    last_spire_core_active: Boolean(lastSpireState.coreActive),
    last_spire_core_clamps_remaining: lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 0 : 1), 0),
    last_spire_core_channeling: Boolean(lastSpireState.coreChanneling),
    last_spire_core_channel_clamp_index: Number(lastSpireState.coreChanneling?.clampIndex ?? -1),
    last_spire_core_channel_remaining: Number(Math.max(0, Number(lastSpireState.coreChanneling?.remaining ?? 0)).toFixed(3)),
    last_spire_boss_started: Boolean(lastSpireState.bossStarted),
    narrator_phase: lastSpireState.narratorPhase,
    narrator_line_pending: Boolean(lastSpireState.narratorLineTelegraph),
    narrator_shockwave_pending: Number(Math.max(0, Number(lastSpireState.narratorShockwaveResolveTimer) || 0).toFixed(3)),
    ending_choice_open: endingChoicePanel.isOpen(),
    cinematic_panel_open: cinematicPanelOverlay.isOpen(),
    credits_overlay_open: creditsOverlay.isOpen(),
    last_door_nearby: isNearLastDoorInteraction(),
    rift_anchor_nearby: isNearRiftAnchorInteraction(),
    final_clamp_nearby: isNearFinalClampInteraction(),
    choice_altar_nearby: isNearEndingChoiceAltar(),
    scene_ui_state: sceneUiState,
    prologue_slide_index: typeof sceneUiState.slideIndex === "number" ? sceneUiState.slideIndex : -1,
    prologue_slide_key: sceneUiState.slideKey ?? "",
    prologue_skip_progress: Number((sceneUiState.skipProgress ?? 0).toFixed(3)),
    prologue_completed: Boolean(sceneUiState.completed),
    intro_text_active: introTextBeat.isActive(),
    intro_text_line: introTextBeat.getMessage(),
    story_intro_text_seen: hasIntroTextSeen(),
    story_intro_spoken: Boolean(saveState.getStoryFlag("intro_spoken") ?? saveState.getFlag("story.intro_spoken")),
    story_hollowscar_pulse_seen: hasPulseSeen(),
    pulse_active: lastPulseFrame.active,
    pulse_elapsed: lastPulseFrame.elapsedSeconds,
    pulse_progress: lastPulseFrame.progress,
    pulse_phase: lastPulseFrame.phaseId,
    pulse_phase_progress: lastPulseFrame.phaseProgress,
    pulse_surge_spawned: lastPulseFrame.surgeSpawned,
    pulse_surge_roles: lastPulseFrame.surgeRoles,
    pulse_overlay_visible: lastPulseFrame.overlayVisible,
    pulse_damage_taken: Number(pulseDamageTaken.toFixed(3)),
    party: lastPartyFrame,
    party_ai_state: lastPartyAiFrame,
    ai_stats: { ...aiStats },
    banter_state: banterDirector.getState(),
    party_chat: partyChat.getLines(),
    guardian: lastGuardianFrame,
    boss_instance: bossInstance.getState(),
    boss_hud: bossInstance.getHudState(),
    hud_target: hudTargetState,
    music_state: audioBus.getDebugState?.() ?? { currentMusic: audioBus.currentMusic ?? "" },
    music_track: audioBus.currentMusic ?? "",
    quest_text: currentQuestText,
    shrine_open: shrineSystem.isOpen(),
    shrine_state: shrineSystem.getState(),
    vaeloris_choice_panel_open: vaelorisChoicePanel.isOpen(),
    harvester_choice_panel_open: harvesterChoicePanel.isOpen(),
    listening_spike_choice_panel_open: listeningSpikeChoicePanel.isOpen(),
    vaeloris_event_active: vaelorisEventActive,
    vaeloris_constructs_alive: vaelorisConstructsAlive,
    vaeloris_dialogue_active: vaelorisDialogueActive,
    vaeloris_extractor_prompt: vaelorisExtractorPromptVisible,
    vaeloris_extractor_destroyed: sceneManager.isVaelorisExtractorDestroyed?.() ?? false,
    vaeloris_patrol: vaelorisPatrolFrame,
    ash_gate_locked_nearby: isNearLockedAshGate(),
    ridge_gate_locked_nearby: isNearLockedRidgeGate(),
    rootway_gate_locked_nearby: isNearLockedRootwayGate(),
    rootway_gate_blocked_nearby: isNearRootwayGateBlockedByRetaliation(),
    player_upgrades: playerUpgrades,
    visual_ambient_intensity: Number(lastVisualFrame.ambientIntensity.toFixed(4)),
    visual_directional_intensity: Number(lastVisualFrame.directionalIntensity.toFixed(4)),
    visual_fog_density: Number(lastVisualFrame.fogDensity.toFixed(5)),
    visual_overlay_opacity: Number(lastVisualFrame.overlayOpacity.toFixed(4)),
    visual_region_tint_strength: Number(lastVisualFrame.regionTintStrength.toFixed(4)),
    visual_foliage_sway_multiplier: Number(lastVisualFrame.foliageSwayMultiplier.toFixed(4)),
    visual_pulse_overlay_opacity: Number(lastVisualFrame.pulseOverlayOpacity.toFixed(4)),
    visual_saturation_shift: Number((lastVisualFrame.saturationShift ?? 0).toFixed(4)),
    visual_warmth_shift: Number((lastVisualFrame.warmthShift ?? 0).toFixed(4)),
    camera_zoom_scalar: Number(cameraZoomScalar.toFixed(4)),
    camera_shake_world_x: Number(cameraShakeOffset.x.toFixed(4)),
    camera_shake_world_z: Number(cameraShakeOffset.z.toFixed(4)),
    director_region_baseline_pressure: Number(sceneManager.getRegionBaselinePressure().toFixed(3)),
    director_preview_composition: pacingDirector.getEncounterComposition(sceneManager.getRegionBaselinePressure(), {
      sceneId: currentSceneInfo.sceneId,
      crownTier: crownMood.getTierLabel(),
      pressureStage: vaelorisPressureStage,
      forVein: false,
    }),
    enemies_alive: lastCombatFrame.enemiesAlive,
    enemies_total: lastCombatFrame.enemiesTotal,
    enemies: combatSystem.getEnemySnapshots(),
    enemy_projectiles: combatSystem.getEnemyProjectileSnapshots(),
    vfx: vfxSystem.getDebugState(),
    pacing: pacingState,
    coordinate_system: "origin=(0,0,0); +x=right, +z=downscreen, +y=up",
    player: {
      x: Number(player.position.x.toFixed(3)),
      y: Number(player.position.y.toFixed(3)),
      z: Number(player.position.z.toFixed(3)),
    },
    controls: [
      "WASD",
      "ArrowKeys",
      "Shift(run in exploration)",
      "Tap-to-move",
      "MouseLeft(light/charge attack)",
      "W/S/Arrows(start menu)",
      "Enter/Space(select menu)",
      "Hold Space/LongPress(skip prologue)",
      "Space(portal)",
      "K",
      "J",
      "L",
      "V",
      "T",
      "Y",
      "Tab(cycle tactics)",
      "1/2(select Arthur/Elaine)",
      "3(select Willow after join; press again as Willow to cycle stance)",
      "H/J/K/L (Willow spells)",
      "U/I/O/P (Elaine spells)",
      "Enter(advance dialogue)",
    ],
  };
  debugState.story_integrity_issues = validateStoryState(debugState);
  return JSON.stringify(debugState);
};

window.world_to_screen = (x, z) => worldToScreen(x, z);
window.is_combat_active = () => getEffectiveMovementContext() === "combat";
window.get_scene_name = () => currentSceneInfo.sceneName;
window.get_scene_id = () => currentSceneInfo.sceneId;
window.get_scene_portals = () =>
  sceneManager.getPortals().map((portal) => ({
    ...portal,
    screen: worldToScreen(portal.x, portal.z),
  }));
window.get_enemies = () =>
  combatSystem.getEnemySnapshots().map((enemy) => ({
    ...enemy,
    screen: worldToScreen(enemy.x, enemy.z),
  }));
window.get_loot_orbs = () =>
  combatSystem.getOrbSnapshots().map((orb) => ({
    ...orb,
    screen: worldToScreen(orb.x, orb.z),
  }));
window.get_anomalies = () =>
  anomalySystem.getSnapshots().map((anomaly) => ({
    ...anomaly,
    screen: worldToScreen(anomaly.x, anomaly.z),
  }));
window.get_threat_veins = () => getThreatVeins();
window.get_npcs = () =>
  sceneManager.getNpcs().map((npc) => ({
    ...npc,
    screen: worldToScreen(npc.x, npc.z),
  }));
  window.debug_force_mobile_ui = (value) => setDebugMobileUiOverride(value);
  window.debug_prologue_next = () => sceneManager.debugPrologueNext();
if (DEV_MODE) {
  window.debug_warp_to_scene = (sceneId = "thornmere") => {
    const normalized = String(sceneId ?? "").trim().toLowerCase();
    const target =
      normalized === "hollowscar"
        ? "hollowScar"
        : normalized === "emberfall"
          ? "emberfall"
          : normalized === "ridgepass"
          ? "ridgepass"
            : normalized === "windward" ||
                normalized === "region3_windward" ||
                normalized === "region3-windward" ||
                normalized === "region3_seed" ||
                normalized === "region3-seed" ||
                normalized === "region3seed"
              ? "windward"
              : normalized === "region4_seed" ||
                  normalized === "region4-seed" ||
                  normalized === "region4seed" ||
                  normalized === "rootway"
                ? "region4_seed"
              : normalized === "endgame_route_seed" ||
                  normalized === "endgame-route-seed"
                ? "endgame_route_seed"
              : normalized === "lastspire" ||
                  normalized === "last_spire" ||
                  normalized === "last-spire"
                ? "last_spire"
              : normalized === "spire_approach" ||
                  normalized === "spire-approach" ||
                  normalized === "outer_spire" ||
                  normalized === "outer-spire"
                ? "spire_approach"
              : normalized === "spire_antechamber" ||
                  normalized === "spire-antechamber" ||
                  normalized === "antechamber"
                ? "spire_antechamber"
              : normalized === "inner_spire" ||
                  normalized === "inner-spire"
                ? "inner_spire"
              : normalized === "inner_spire_last_door" ||
                  normalized === "inner-spire-last-door" ||
                  normalized === "last_door"
                ? "inner_spire_last_door"
              : "thornmere";
    forceLoadSceneForDebug(target);
    return {
      sceneId: currentSceneInfo.sceneId,
      x: Number(player.position.x.toFixed(3)),
      z: Number(player.position.z.toFixed(3)),
    };
  };
  window.debug_trigger_willow_join = () => {
    if (currentSceneInfo.sceneId !== "emberfall") {
      forceLoadSceneForDebug("emberfall");
    }
    setWillowJoined(true, { showToast: true });
    return {
      joined: hasWillowJoined(),
      party: partySystem.getState(),
      activeCharacter: activePartyMember,
    };
  };
  window.debug_trigger_willow_meet = () => {
    if (currentSceneInfo.sceneId !== "emberfall") {
      forceLoadSceneForDebug("emberfall");
    }
    setChapter2Started(true);
    setStoryEmberfallUnlocked(true);
    setChapter2ArrivedEmberfall(true);
    if (!hasWillowJoined()) {
      setWillowMet(false);
    }
    chapter2ArrivalPending = null;
    introTextBeat.clear();
    dialogueBox.closeDialogue();
    const config = getWillowEncounterConfig();
    if (config?.center) {
      const nextX = Number(config.center.x) || 0;
      const nextZ = Number(config.center.y) || 0;
      player.position.set(nextX, 0, nextZ);
      cameraFollowTarget.set(nextX, 0, nextZ);
      updateCamera(fixedStep, true);
    }
    const triggered = tryTriggerWillowMeetEvent({ force: true });
    return {
      triggered,
      sceneId: currentSceneInfo.sceneId,
      chapter2Started: hasChapter2Started(),
      chapter2ArrivedEmberfall: hasChapter2ArrivedEmberfall(),
      willowMet: hasWillowMet(),
      willowJoined: hasWillowJoined(),
      pending: Boolean(willowMeetPending),
      objective: currentObjectiveState.id,
    };
  };
  window.debug_spawn_ambush = () => {
    if (currentSceneInfo.sceneId !== "emberfall") {
      forceLoadSceneForDebug("emberfall");
    }
    setChapter2Started(true);
    setStoryEmberfallUnlocked(true);
    setChapter2ArrivedEmberfall(true);
    setWillowMet(true);
    const spawned = startWillowAmbushSetpiece({ force: true });
    return {
      spawned,
      active: willowAmbushState.active,
      enemyIds: [...willowAmbushState.enemyIds],
      radius: Number(willowAmbushState.radius.toFixed(3)),
      objective: currentObjectiveState.id,
    };
  };
  window.debug_force_willow_join = () => {
    if (!hasWillowMet()) {
      setWillowMet(true);
    }
    completeWillowAmbushSetpiece({ force: true });
    return {
      joined: hasWillowJoined(),
      willowMet: hasWillowMet(),
      objective: currentObjectiveState.id,
      members: partySystem.getState().members ?? [],
      activeCharacter: activePartyMember,
    };
  };
  window.debug_get_party_members = () => {
    return [...(partySystem.getState().members ?? [])];
  };
  window.debug_randomize_seed = () => {
    randomizeSeed();
    return { seed: currentRngSeed };
  };
  window.debug_defeat_all_enemies = () => combatSystem.forceDefeatAllEnemies();
  window.debug_set_enemy_attacks_enabled = (enabled) => combatSystem.setEnemyAttacksEnabled(enabled);
  window.debug_set_strain = (value) => pacingDirector.setDebugStrain(value);
  window.debug_get_encounter_composition = (pressure, options = {}) =>
    pacingDirector.getEncounterComposition(
      typeof pressure === "number" ? pressure : sceneManager.getRegionBaselinePressure(),
      {
        sceneId: String(options.sceneId ?? currentSceneInfo.sceneId),
        crownTier: String(options.crownTier ?? crownMood.getTierLabel()),
        pressureStage: Number(options.pressureStage ?? vaelorisPressureStage),
        forVein: Boolean(options.forVein),
      }
    );
  window.debug_spawn_enemy_roles = (roles = ["skirmisher"]) => {
    const desiredRoles = Array.isArray(roles) ? roles : [String(roles)];
    if (lastVeinFrame.active && lastVeinFrame.activeVeinId) {
      onVeinFail(lastVeinFrame.activeVeinId);
    }
    debugVeinSuppressionRemaining = Math.max(debugVeinSuppressionRemaining, 5);
    combatSystem.clearScene();
    const snapshots = combatSystem.spawnEnemies(
      desiredRoles.map((role, index) => ({
        // Debug role showcases use sturdier units so AI positioning tests remain stable.
        maxHealth:
          role === "skirmisher"
            ? 72
            : role === "striker"
              ? 56
              : role === "harrier"
                ? 64
                : undefined,
        health:
          role === "skirmisher"
            ? 72
            : role === "striker"
              ? 56
              : role === "harrier"
                ? 64
                : undefined,
        id: `debug-role-${role}-${index + 1}`,
        role,
        type: role === "harrier" || role === "striker" ? "ambush" : "standard",
        x: player.position.x + 2.25 + index * 0.75,
        z: player.position.z + (index % 2 === 0 ? 0.35 : -0.35),
        // Keep showcase enemies stationary so visual snapshots stay deterministic.
        aggroRadius: 0.15,
        attackRange:
          role === "brute" || role === "bulwark"
            ? 0.76
            : role === "construct" || role === "hexer"
              ? 1.04
              : role === "striker"
                ? 0.72
                : 0.68,
      }))
    );
    lastArthurTargetEnemyId = snapshots?.[0] ?? "";
    return combatSystem.getEnemySnapshots();
  };
  window.debug_spawn_enemy_type = (role = "skirmisher", x = player.position.x + 1.4, z = player.position.z) => {
    const normalizedRole = String(role ?? "skirmisher").toLowerCase();
    if (lastVeinFrame.active && lastVeinFrame.activeVeinId) {
      onVeinFail(lastVeinFrame.activeVeinId);
    }
    debugVeinSuppressionRemaining = Math.max(debugVeinSuppressionRemaining, 5);
    const enemyId = `debug-type-${normalizedRole}-${Math.floor(world.elapsedSeconds * 1000)}`;
    const spawned = combatSystem.spawnEnemies([
      {
        id: enemyId,
        role: normalizedRole,
        type: normalizedRole === "harrier" || normalizedRole === "striker" ? "ambush" : "standard",
        x: Number(x),
        z: Number(z),
        aggroRadius: 4.2,
        attackRange:
          normalizedRole === "brute" || normalizedRole === "bulwark"
            ? 0.76
            : normalizedRole === "construct" || normalizedRole === "hexer"
              ? 1.04
              : normalizedRole === "striker"
                ? 0.72
                : 0.68,
      },
    ]);
    lastArthurTargetEnemyId = spawned?.[0] ?? lastArthurTargetEnemyId;
    return spawned?.[0] ?? null;
  };
  window.debug_get_enemy_state = (enemyId = "") => combatSystem.getEnemyState(String(enemyId ?? ""));
  window.debug_get_party_effects = () => ({
    arthur: window.debug_get_effects?.(STATUS_ENTITY_IDS.ARTHUR) ?? [],
    elaine: window.debug_get_effects?.(STATUS_ENTITY_IDS.ELAINE) ?? [],
    willow: window.debug_get_effects?.(STATUS_ENTITY_IDS.WILLOW) ?? [],
  });
  window.debug_force_hexer_cast = (enemyId = "") => {
    const state = combatSystem.getEnemyState(String(enemyId ?? ""));
    if (!state || state.type !== "hexer") return { cast: false };
    const threatTargets = buildEnemyThreatTargets();
    const explicitTarget = threatTargets
      .slice()
      .sort((left, right) => {
        if (Boolean(right.squishy) !== Boolean(left.squishy)) {
          return Number(Boolean(right.squishy)) - Number(Boolean(left.squishy));
        }
        if (Math.abs((right.hexPriority ?? 0) - (left.hexPriority ?? 0)) > 1e-6) {
          return (right.hexPriority ?? 0) - (left.hexPriority ?? 0);
        }
        const leftHpRatio = (left.effectiveHp ?? left.hp ?? 0) / Math.max(1, left.maxHp ?? 1);
        const rightHpRatio = (right.effectiveHp ?? right.hp ?? 0) / Math.max(1, right.maxHp ?? 1);
        if (Math.abs(leftHpRatio - rightHpRatio) > 1e-6) return leftHpRatio - rightHpRatio;
        return String(left.id).localeCompare(String(right.id));
      })[0] ?? null;
    if (!explicitTarget) return { cast: false };
    return combatSystem.forceHexerCast(String(enemyId ?? ""), {
      targetId: explicitTarget.id,
      targetPosition: { x: explicitTarget.x, z: explicitTarget.z },
      onStatusApplied: onEnemyStatusApplied,
    });
  };
  window.debug_spawn_threat_vein = () => debugSpawnVeinNearPlayer();
  window.debug_complete_active_vein = () => onVeinComplete(lastVeinFrame.activeVeinId);
  window.debug_fail_active_vein = () => onVeinFail(lastVeinFrame.activeVeinId);
  window.debug_clear_vein_flags = () => clearThreatVeinsCompletionFlags(saveState);
  window.debug_spawn_guardian = () => {
    if (currentSceneInfo.sceneId !== "hollowScar") {
      forceLoadSceneForDebug("hollowScar");
    }
    spawnVeinGuardianEncounter({ force: true });
    return bossInstance.getState();
  };
  window.debug_get_guardian = () => bossInstance.getState();
  window.debug_damage_guardian = (amount = 0) => {
    const outcome = bossInstance.damageBoss(Number(amount) || 0);
    lastGuardianFrame = bossInstance.getState();
    return { dealt: outcome.dealt, guardian: lastGuardianFrame };
  };
  window.debug_force_guardian_shield = () => {
    const forced = bossInstance.getActiveEntity()?.forceShield?.() ?? false;
    lastGuardianFrame = bossInstance.getState();
    return { forced, guardian: lastGuardianFrame };
  };
  window.debug_start_boss = () => {
    if (currentSceneInfo.sceneId !== "hollowScar") {
      forceLoadSceneForDebug("hollowScar");
    }
    spawnVeinGuardianEncounter({ force: true });
    lastGuardianFrame = bossInstance.getState();
    return lastGuardianFrame;
  };
  window.debug_damage_boss = (amount = 0) => {
    const outcome = bossInstance.damageBoss(Number(amount) || 0);
    lastGuardianFrame = bossInstance.getState();
    return { dealt: outcome.dealt, boss: lastGuardianFrame };
  };
  window.debug_set_boss_hp = (percent = 1) => {
    const state = bossInstance.setBossHpPercent(Number(percent) || 0);
    lastGuardianFrame = bossInstance.getState();
    return { boss: lastGuardianFrame, raw: state };
  };
  window.debug_force_phase = (phaseId = "p2") => {
    const state = bossInstance.forcePhase(phaseId);
    lastGuardianFrame = bossInstance.getState();
    return { boss: lastGuardianFrame, raw: state };
  };
  window.debug_get_boss = () => bossInstance.getState();
  window.debug_boss_hud = () => bossInstance.getHudState();
  window.debug_set_hp = (value) => {
    playerState.setHP(value, { resetInvulnerability: true });
    if (playerState.hp > 0) {
      arthurDowned = false;
      arthurBleedoutRemaining = 0;
    }
    nearDeathLatched = playerState.hp <= playerState.maxHP * 0.2;
    return playerState.getSnapshot();
  };
  window.debug_get_hp = () => playerState.getSnapshot();
  window.debug_damage_player = (amount) => onPlayerDamaged(Number(amount) || 0);
  window.debug_set_crown_mood = (value) => {
    const moodScore = setCrownMood(value, "debug_override");
    applyVaelorisWorldModifiers();
    return {
      moodScore,
      tier: crownMood.getTier(),
      tierLabel: crownMood.getTierLabel(),
    };
  };
  window.debug_get_crown_mood = () => crownMood.getMood();
  window.debug_get_crown_tier = () => crownMood.getTierLabel();
  window.debug_get_crown_mood_tier = () => crownMood.getTierLabel();
  window.debug_get_effects = (entityId = STATUS_ENTITY_IDS.ARTHUR) => {
    const resolvedEntityId = resolveDebugEntityId(entityId);
    return statusEffects.getEffects(resolvedEntityId).map((effect) => ({
      id: effect.id,
      remaining: Number(Math.max(0, effect.remainingSeconds).toFixed(3)),
      charges: effect.charges == null ? null : effect.charges,
      positive: effect.positive === true,
    }));
  };
  window.debug_add_effect = (entityId = STATUS_ENTITY_IDS.ARTHUR, effectId = "", seconds = 1, charges = undefined) => {
    const resolvedEntityId = resolveDebugEntityId(entityId);
    const resolvedEffectId = normalizeDebugEffectId(effectId);
    if (!resolvedEntityId || !resolvedEffectId) return false;
    const added = statusEffects.addEffect(resolvedEntityId, {
      id: resolvedEffectId,
      durationSeconds: Math.max(0.05, Number(seconds) || 0.05),
      charges: charges == null ? undefined : Math.max(0, Math.floor(Number(charges) || 0)),
      sourceId: "debug",
    });
    return Boolean(added);
  };
  window.debug_tick = (seconds = 0) => {
    const durationMs = Math.max(0, Number(seconds) || 0) * 1000;
    if (durationMs > 0) {
      window.advanceTime?.(durationMs);
    }
    return {
      elapsedSeconds: Number(world.elapsedSeconds.toFixed(3)),
      effects: statusEffects.getEntityIdsWithEffects().reduce((acc, entityId) => {
        acc[entityId] = statusEffects.getEffects(entityId).map((effect) => ({
          id: effect.id,
          remaining: Number(Math.max(0, effect.remainingSeconds).toFixed(3)),
          charges: effect.charges == null ? null : effect.charges,
        }));
        return acc;
      }, {}),
    };
  };
  window.debug_set_target_entity = (entityId = "") => {
    const resolved = resolveDebugEntityId(entityId);
    debugTargetEntityIdOverride = resolved;
    return {
      targetEntityId: debugTargetEntityIdOverride,
      targetVisible: Boolean(resolveHudTarget()),
    };
  };
  window.debug_damage_party = (payload = {}) => debugDamageParty(payload);
  window.debug_set_target_hp = (value = 1) => debugSetTargetHp(value);
  window.debug_force_attack = (type = "light") => debugForceAttack(type);
  window.debug_force_basic_attack = () => debugForceBasicAttack();
  window.debug_force_cast = (spellName = "heal_single") => debugForceCast(spellName);
  window.debug_force_elaine_cast = (spellKey = "u") => debugForceElaineCast(spellKey);
  window.debug_get_render_state = () => getDebugRenderState();
  window.debug_start_guardian_boss = () => {
    if (currentSceneInfo.sceneId !== "hollowScar") {
      forceLoadSceneForDebug("hollowScar");
    }
    spawnVeinGuardianEncounter({ force: true });
    lastGuardianFrame = bossInstance.getState();
    return lastGuardianFrame;
  };
  window.debug_start_harvester_boss = () => {
    if (currentSceneInfo.sceneId !== "emberfall") {
      forceLoadSceneForDebug("emberfall");
    }
    setChapter4RowanReportDone(true);
    setHarvesterSiteUnlocked(true);
    setHarvesterBossDefeated(false);
    setHarvesterChoice(HARVESTER_CHOICE_VALUES.NONE);
    harvesterChoice = HARVESTER_CHOICE_VALUES.NONE;
    spawnHarvesterWardenEncounter({ force: true });
    lastGuardianFrame = bossInstance.getState();
    return lastGuardianFrame;
  };
  window.debug_set_extraction = (value0to1 = 0) => {
    const state = bossInstance.setExtractionMeter(Number(value0to1) || 0);
    lastGuardianFrame = bossInstance.getState();
    return {
      extraction: state?.objective?.extraction ?? null,
      boss: lastGuardianFrame,
    };
  };
  window.debug_damage_anchor = (index = 0, amount = 999) => {
    const result = bossInstance.damageAnchor(Math.max(0, Math.floor(Number(index) || 0)), Number(amount) || 0);
    lastGuardianFrame = bossInstance.getState();
    return {
      damaged: result?.damaged ?? false,
      destroyed: result?.destroyed ?? false,
      anchor: result?.anchor ?? null,
      boss: lastGuardianFrame,
    };
  };
  window.debug_trigger_ch9_start = () => {
    if (currentSceneInfo.sceneId !== "region4_seed") {
      forceLoadSceneForDebug("region4_seed");
    }
    setRegion4SeedUnlocked(true);
    setChapter8MuteSpikesCleared(true);
    const triggered = tryTriggerChapter9StartEvent({ force: true });
    return {
      triggered,
      sceneId: currentSceneInfo.sceneId,
      chapter9Started: hasChapter9Started(),
      objective: resolveStoryObjectiveState().id,
      sunderActive: chapter9SetpieceState.sunderActive,
      sunderMeter: Number((chapter9SetpieceState.sunderMeter ?? 0).toFixed(4)),
      anchorsRemaining: getChapter9AnchorCountRemaining(),
    };
  };
  window.debug_set_sunder = (value0to1 = 0) => {
    const ratio = Math.max(0, Math.min(1, Number(value0to1) || 0));
    chapter9SetpieceState.sunderActive = true;
    chapter9SetpieceState.sunderMeter = ratio;
    return {
      active: chapter9SetpieceState.sunderActive,
      value: Number(chapter9SetpieceState.sunderMeter.toFixed(4)),
      waves: chapter9SetpieceState.sunderWaves,
    };
  };
  window.debug_trigger_sunder_wave = () => {
    if (!chapter9SetpieceState.sunderActive) {
      chapter9SetpieceState.sunderActive = true;
    }
    triggerChapter9SunderWave();
    return {
      waves: chapter9SetpieceState.sunderWaves,
      meter: Number(chapter9SetpieceState.sunderMeter.toFixed(4)),
      failures: chapter9SetpieceState.failures,
    };
  };
  window.debug_attune_anchor = (index = 0) => {
    if (currentSceneInfo.sceneId !== "region4_seed") {
      forceLoadSceneForDebug("region4_seed");
    }
    if (!hasChapter9Started()) {
      setRegion4SeedUnlocked(true);
      setChapter8MuteSpikesCleared(true);
      tryTriggerChapter9StartEvent({ force: true });
    }
    if (!chapter9SetpieceState.anchors.length) {
      const config = getChapter9RootwayConfig();
      primeChapter9SetpieceFromConfig(config, { preserveAttuned: false });
    }
    const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
    const applied = completeChapter9AnchorAttunement(safeIndex);
    return {
      applied,
      index: safeIndex,
      anchorsRemaining: getChapter9AnchorCountRemaining(),
      anchorsAttuned: hasChapter9AnchorsAttuned(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_start_null_archivist = () => {
    if (currentSceneInfo.sceneId !== "region4_seed") {
      forceLoadSceneForDebug("region4_seed");
    }
    setRegion4SeedUnlocked(true);
    setChapter8MuteSpikesCleared(true);
    setChapter9Started(true);
    setChapter9AnchorsAttuned(true);
    setChapter9NullArchivistDefeated(false);
    const config = getChapter9RootwayConfig();
    primeChapter9SetpieceFromConfig(config, { preserveAttuned: true });
    const started = spawnNullArchivistEncounter({ force: true });
    return {
      started,
      boss: bossInstance.getState(),
      objective: resolveStoryObjectiveState().id,
      anchorsAttuned: hasChapter9AnchorsAttuned(),
    };
  };
  window.debug_spawn_echo_nodes = (count = 2) => {
    const spawned = spawnChapter9EchoNodes(count);
    return {
      spawned,
      alive: chapter9SetpieceState.echoNodes.filter((node) => node?.alive).length,
    };
  };
  window.debug_trigger_lore_vision = () => {
    const triggered = queueChapter9LoreVision({ force: true });
    return {
      triggered,
      pending: Boolean(chapter9LoreVisionPending),
      overlayOpen: loreVisionOverlay.isOpen(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_get_boss_state = () => bossInstance.getState();
  window.debug_force_third_seal_obtained = () => {
    if (currentSceneInfo.sceneId !== "region4_seed") {
      forceLoadSceneForDebug("region4_seed");
    }
    setEndgameStarted(true);
    setEndgameAct1Started(true);
    setEndgameThirdSealObtained(true);
    setStoryFlag("endgame_task_third_seal", true);
    setEndgameOuterSpireUnlocked(true);
    clearThirdSealQuestState({ keepProgress: true });
    thirdSealQuestState.started = true;
    thirdSealQuestState.attuned = true;
    setCurrentObjectiveId(OBJECTIVE_IDS.BREACH_OUTER_SPIRE);
    refreshQuestText();
    return {
      sceneId: currentSceneInfo.sceneId,
      thirdSealObtained: hasEndgameThirdSealObtained(),
      outerSpireUnlocked: hasEndgameOuterSpireUnlocked(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_start_spire_breach = () => {
    if (currentSceneInfo.sceneId !== "spire_approach") {
      forceLoadSceneForDebug("spire_approach");
    }
    setEndgameStarted(true);
    setEndgameAct1Started(true);
    setEndgameThirdSealObtained(true);
    setStoryFlag("endgame_task_third_seal", true);
    setEndgameOuterSpireUnlocked(true);
    setEndgameOuterSpireBreached(false);
    setEndgameGatewardenDefeated(false);
    setEndgameSpireEntryUnlocked(false);
    setCurrentObjectiveId(OBJECTIVE_IDS.BREACH_OUTER_SPIRE);
    refreshQuestText();
    const started = startSpireBreachSetpiece({ force: true });
    return {
      started,
      active: spireBreachState.active,
      meterActive: spireBreachState.meterActive,
      lockNodes: spireBreachState.lockNodes.map((node) => ({
        index: node.index,
        disabled: Boolean(node.disabled),
      })),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_disable_lock_node = (index = 0) => {
    const safeIndex = Math.max(0, Math.floor(Number(index) || 0));
    const disabled = completeSpireLockNodeChannel(safeIndex);
    return {
      index: safeIndex,
      disabled,
      remaining: spireBreachState.lockNodes.reduce((count, node) => count + (node?.disabled ? 0 : 1), 0),
      breached: hasEndgameOuterSpireBreached(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_set_breach_meter = (value0to1 = 0) => {
    const ratio = Math.max(0, Math.min(1, Number(value0to1) || 0));
    spireBreachState.meterActive = true;
    spireBreachState.meter = ratio;
    return {
      active: spireBreachState.meterActive,
      value: Number(spireBreachState.meter.toFixed(4)),
      discharges: Number(spireBreachState.discharges ?? 0),
    };
  };
  window.debug_start_gatewarden_boss = () => {
    if (currentSceneInfo.sceneId !== "spire_approach") {
      forceLoadSceneForDebug("spire_approach");
    }
    setEndgameStarted(true);
    setEndgameAct1Started(true);
    setEndgameThirdSealObtained(true);
    setStoryFlag("endgame_task_third_seal", true);
    setEndgameOuterSpireUnlocked(true);
    setEndgameOuterSpireBreached(true);
    setEndgameGatewardenDefeated(false);
    setEndgameSpireEntryUnlocked(false);
    const breachConfig = getSpireBreachConfig();
    if (breachConfig?.gateCenter) {
      spireBreachState.center.set(Number(breachConfig.gateCenter.x) || 3.44, Number(breachConfig.gateCenter.y) || -0.92);
      spireBreachState.radius = Math.max(1.8, Number(breachConfig.arenaRadius) || 2.62);
      spireBreachState.coverPillars = Array.isArray(breachConfig.coverPillars)
        ? breachConfig.coverPillars.map((entry) => ({
            x: Number(entry?.x) || 0,
            z: Number(entry?.y ?? entry?.z) || 0,
          }))
        : [];
    }
    setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_GATEWARDEN);
    refreshQuestText();
    const started = spawnSpireGatewardenEncounter({ force: true });
    return {
      started,
      boss: bossInstance.getState(),
      objective: resolveStoryObjectiveState().id,
      breached: hasEndgameOuterSpireBreached(),
    };
  };
  window.debug_complete_resonance_lock = (index = 1) => {
    if (currentSceneInfo.sceneId !== "inner_spire") {
      forceLoadSceneForDebug("inner_spire");
    }
    setEndgameStarted(true);
    setEndgameAct1Started(true);
    setEndgameThirdSealObtained(true);
    setEndgameOuterSpireUnlocked(true);
    setEndgameOuterSpireBreached(true);
    setEndgameGatewardenDefeated(true);
    setEndgameSpireEntryUnlocked(true);
    setEndgameAct2Started(true);
    setEndgameInnerSpireEntered(true);
    setEndgameLoomProctorDefeated(false);
    setEndgameAct3Unlocked(false);
    setCurrentObjectiveId(OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS);
    refreshQuestText();
    initializeInnerSpireState({ force: true });
    const oneBased = Math.max(1, Math.min(3, Math.floor(Number(index) || 1)));
    const zeroBased = oneBased - 1;
    const completed = completeResonanceLock(zeroBased);
    if (completed) {
      setResonanceLockStoryFlag(zeroBased, true);
      memoryPressureTracker.relieve(MEMORY_PRESSURE_RELIEF, {
        slowSeconds: MEMORY_PRESSURE_SLOW_SECONDS,
      });
    }
    if (hasEndgameAllResonanceLocks()) {
      setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR);
      refreshQuestText();
    }
    const channel = getResonanceChannelState();
    return {
      completed,
      index: oneBased,
      locksRemaining: getResonanceLockCountRemaining(),
      objective: resolveStoryObjectiveState().id,
      channel,
    };
  };
  window.debug_set_memory_pressure = (value0to1 = 0) => {
    const ratio = Math.max(0, Math.min(1, Number(value0to1) || 0));
    const shouldRun = currentSceneInfo.sceneId === "inner_spire" && !hasEndgameAllResonanceLocks() && !hasEndgameLoomProctorDefeated();
    memoryPressureTracker.setActive(shouldRun || ratio > 0, { resetValue: false });
    memoryPressureTracker.setValue(ratio);
    const state = memoryPressureTracker.getState();
    return {
      active: Boolean(state.active),
      value: Number((state.value ?? 0).toFixed(4)),
      thresholds: Array.isArray(state.triggeredThresholds) ? [...state.triggeredThresholds] : [],
    };
  };
  window.debug_start_loom_proctor = () => {
    if (currentSceneInfo.sceneId !== "inner_spire") {
      forceLoadSceneForDebug("inner_spire");
    }
    setEndgameStarted(true);
    setEndgameAct1Started(true);
    setEndgameThirdSealObtained(true);
    setEndgameOuterSpireUnlocked(true);
    setEndgameOuterSpireBreached(true);
    setEndgameGatewardenDefeated(true);
    setEndgameSpireEntryUnlocked(true);
    setEndgameAct2Started(true);
    setEndgameInnerSpireEntered(true);
    setEndgameLoomProctorDefeated(false);
    setEndgameAct3Unlocked(false);
    setEndgameLastDoorSeen(false);
    setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR);
    refreshQuestText();
    initializeInnerSpireState({ force: true });
    for (let i = 0; i < 3; i += 1) {
      completeResonanceLock(i);
      setResonanceLockStoryFlag(i, true);
    }
    const started = spawnLoomProctorEncounter({ force: true });
    return {
      started,
      boss: bossInstance.getState(),
      objective: resolveStoryObjectiveState().id,
      locksRemaining: getResonanceLockCountRemaining(),
    };
  };
  window.debug_trigger_act2_lore = () => {
    const triggered = queueEndgameAct2LoreVision({ force: true });
    return {
      triggered,
      pending: Boolean(endgameAct2LorePending),
      overlayOpen: loreVisionOverlay.isOpen(),
      act3Unlocked: hasEndgameAct3Unlocked(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_start_rift_setpiece = () => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    setEndgameStarted(true);
    setEndgameAct3Unlocked(true);
    setEndgameAct3Started(true);
    setEndgameLastDoorOpened(true);
    setEndgameLastSpireEntered(true);
    setEndgameSetpieceRiftCrossed(false);
    setEndgameSetpieceCoreReached(false);
    setEndgameFinalBossDefeated(false);
    setEndgameChoiceMade(false);
    setEndgameEnding("");
    setEndgameCreditsSeen(false);
    setNgPlusUnlocked(false);
    setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
    initializeLastSpireState({ force: true });
    setCurrentObjectiveId(OBJECTIVE_IDS.CROSS_RIFT);
    refreshQuestText();
    const started = startLastSpireRiftSetpiece({ force: true });
    return {
      started,
      active: Boolean(lastSpireState.riftActive),
      stability: Number(clamp01(lastSpireState.riftStability).toFixed(4)),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_complete_rift_anchor = (index = 1) => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    if (!lastSpireState.riftActive) {
      startLastSpireRiftSetpiece({ force: true });
    }
    const parsed = Math.floor(Number(index) || 0);
    const safeIndex = parsed >= 1 && parsed <= 3 ? parsed - 1 : Math.max(0, Math.min(2, parsed));
    const completed = completeRiftAnchorChannel(safeIndex);
    return {
      completed,
      index: safeIndex + 1,
      anchorsAttuned: lastSpireState.riftAnchors.reduce((count, anchor) => count + (anchor?.attuned ? 1 : 0), 0),
      riftCrossed: hasEndgameSetpieceRiftCrossed(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_set_rift_stability = (value0to1 = 0) => {
    const ratio = clamp01(value0to1);
    if (currentSceneInfo.sceneId === "last_spire") {
      initializeLastSpireState({ force: false });
      lastSpireState.riftStability = ratio;
      if (!lastSpireState.riftActive && !hasEndgameSetpieceRiftCrossed()) {
        lastSpireState.riftActive = true;
      }
    }
    return {
      value: Number(ratio.toFixed(4)),
      active: Boolean(lastSpireState.riftActive),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_start_core_setpiece = () => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    setEndgameStarted(true);
    setEndgameAct3Unlocked(true);
    setEndgameAct3Started(true);
    setEndgameLastDoorOpened(true);
    setEndgameLastSpireEntered(true);
    setEndgameSetpieceRiftCrossed(true);
    setEndgameSetpieceCoreReached(false);
    setEndgameFinalBossDefeated(false);
    setEndgameChoiceMade(false);
    setEndgameEnding("");
    setEndgameCreditsSeen(false);
    setNgPlusUnlocked(false);
    setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
    initializeLastSpireState({ force: true });
    lastSpireState.lorePanelsShown = true;
    setCurrentObjectiveId(OBJECTIVE_IDS.REACH_CROWN_ENGINE);
    refreshQuestText();
    const started = startLastSpireCoreSetpiece({ force: true });
    return {
      started,
      active: Boolean(lastSpireState.coreActive),
      clampsRemaining: lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 0 : 1), 0),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_disable_final_clamp = (index = 1) => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    if (!lastSpireState.coreActive && !hasEndgameSetpieceCoreReached()) {
      startLastSpireCoreSetpiece({ force: true });
    }
    const parsed = Math.floor(Number(index) || 0);
    const safeIndex = parsed >= 1 && parsed <= 3 ? parsed - 1 : Math.max(0, Math.min(2, parsed));
    const disabled = completeFinalClampChannel(safeIndex);
    return {
      disabled,
      index: safeIndex + 1,
      clampsRemaining: lastSpireState.finalClamps.reduce((count, clamp) => count + (clamp?.disabled ? 0 : 1), 0),
      coreReached: hasEndgameSetpieceCoreReached(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_start_final_boss = () => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    setEndgameStarted(true);
    setEndgameAct3Unlocked(true);
    setEndgameAct3Started(true);
    setEndgameLastDoorOpened(true);
    setEndgameLastSpireEntered(true);
    setEndgameSetpieceRiftCrossed(true);
    setEndgameSetpieceCoreReached(true);
    setEndgameFinalBossDefeated(false);
    setEndgameChoiceMade(false);
    setEndgameEnding("");
    setEndgameCreditsSeen(false);
    setNgPlusUnlocked(false);
    initializeLastSpireState({ force: true });
    for (const clamp of lastSpireState.finalClamps) {
      if (clamp) clamp.disabled = true;
    }
    lastSpireState.coreActive = false;
    lastSpireState.coreStarted = true;
    lastSpireState.narratorChoiceReady = false;
    setCurrentObjectiveId(OBJECTIVE_IDS.DEFEAT_FINAL_BOSS);
    refreshQuestText();
    const started = spawnNarratorCrownEncounter({ force: true });
    return {
      started,
      boss: bossInstance.getState(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_trigger_choice_ui = () => {
    if (currentSceneInfo.sceneId !== "last_spire") {
      forceLoadSceneForDebug("last_spire");
    }
    initializeLastSpireState({ force: false });
    if (!hasEndgameFinalBossDefeated()) {
      setEndgameFinalBossDefeated(true);
      setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
    }
    setCurrentObjectiveId(OBJECTIVE_IDS.CHOOSE_ENDING);
    refreshQuestText();
    const altar = getLastSpireConfig()?.choiceAltar ?? {};
    const altarX = Number(altar.x) || 4.04;
    const altarZ = Number(altar.y) || -1.76;
    player.position.set(altarX, 0, altarZ);
    cameraFollowTarget.set(altarX, 0, altarZ);
    updateCamera(fixedStep, true);
    const opened = tryOpenEndingChoiceAltar({ showToast: false });
    return {
      opened,
      panelOpen: endingChoicePanel.isOpen(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_choose_ending = (choice = ENDGAME_ENDING_SEAL) => {
    const normalized = String(choice ?? "")
      .trim()
      .toLowerCase();
    const resolved = normalized === ENDGAME_ENDING_REWRITE ? ENDGAME_ENDING_REWRITE : ENDGAME_ENDING_SEAL;
    if (!hasEndgameFinalBossDefeated()) {
      window.debug_trigger_choice_ui?.();
    }
    const applied = applyEndgameEndingChoice(resolved);
    return {
      applied,
      ending: getEndgameEnding(),
      choiceMade: hasEndgameChoiceMade(),
      creditsOpen: creditsOverlay.isOpen(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_force_choice = (choice = HARVESTER_CHOICE_VALUES.SHATTER) => {
    const normalized = String(choice ?? "").trim().toLowerCase();
    const harvesterChoiceRequested =
      normalized === HARVESTER_CHOICE_VALUES.SHATTER || normalized === HARVESTER_CHOICE_VALUES.SALVAGE;
    const listeningChoiceRequested =
      normalized === LISTENING_SPIKE_CHOICE_VALUES.CRUSH || normalized === LISTENING_SPIKE_CHOICE_VALUES.POCKET;
    const chapter9ChoiceRequested = normalized === CHAPTER9_CHOICE_SEAL || normalized === CHAPTER9_CHOICE_TAKE_KEY;
    let applied = false;
    let domain = "none";
    if (harvesterChoiceRequested) {
      domain = "harvester";
      applied = applyHarvesterChoice(normalized, { force: true });
    } else if (listeningChoiceRequested) {
      domain = "listening_spike";
      applied = applyListeningSpikeChoice(normalized, { force: true });
    } else if (chapter9ChoiceRequested) {
      domain = "chapter9";
      applied = applyChapter9EndgameState(normalized);
    }
    return {
      applied,
      domain,
      choice:
        domain === "listening_spike"
          ? getListeningSpikeChoice()
          : domain === "chapter9"
            ? getChapter9Choice()
            : getHarvesterChoice(),
      harvesterChoice: getHarvesterChoice(),
      listeningSpikeChoice: getListeningSpikeChoice(),
      chapter9Choice: getChapter9Choice(),
      endgameStarted: hasEndgameStarted(),
      endgameGoalId: getEndgameGoalId(),
      endgameRouteSeedUnlocked: hasEndgameRouteSeedUnlocked(),
      pressureStage: getVaelorisPressureStage(),
      mood: crownMood.getMood(),
      tier: crownMood.getTierLabel(),
      relicShards: relicShardCount,
    };
  };
  window.debug_get_party_state = () => ({
    activeMember: activePartyMember,
    arthurDowned,
    arthurBleedoutRemaining,
    elaineDowned,
    elaineHp,
    elaineMaxHp,
    elaineMp,
    elaineMaxMp,
    elaineCast: elaineSpellCast ? { ...elaineSpellCast } : null,
    elaineCooldowns: { ...elaineSpellCooldowns },
    elaineBuffRemaining: Number(getElaineBuffRemainingSeconds().toFixed(3)),
    willowJoined: hasWillowJoined(),
    willowMp,
    willowMaxMp,
    willowStance: willowStance.getWillowStance(),
    willowAutoStanceEnabled: willowStance.getAutoStanceEnabled(),
    willowCooldowns: { ...willowSpellCooldowns },
    partyMembers: partySystem.getState().members,
  });
  window.debug_set_elaine_mp = (value) => {
    elaineMp = Math.max(0, Math.min(elaineMaxMp, Number(value) || 0));
    return { mp: elaineMp, maxMp: elaineMaxMp };
  };
  window.debug_set_willow_joined = (joined = true) => {
    setWillowJoined(Boolean(joined), { showToast: false });
    return {
      joined: hasWillowJoined(),
      activeCharacter: activePartyMember,
      partyMembers: partySystem.getState().members,
    };
  };
  window.debug_set_willow_stance = (stance = "ruby") => {
    const normalized = normalizeWillowStance(stance);
    const result = willowStance.setWillowStance(normalized, "manual", {
      nowMs: getNowMs(),
      combatActive: false,
      bossInstanceActive: false,
      force: true,
    });
    persistWillowStanceSettings();
    return {
      changed: result.changed,
      stance: willowStance.getWillowStance(),
      autoEnabled: willowStance.getAutoStanceEnabled(),
    };
  };
  window.debug_set_willow_mp = (value = 0) => {
    willowMp = Math.max(0, Math.min(willowMaxMp, Number(value) || 0));
    return { mp: willowMp, maxMp: willowMaxMp };
  };
  window.debug_cast_willow_spell = (spellKey = "h") => {
    const result = castWillowSpell(spellKey, {
      showFailureToast: false,
      fromUi: false,
      fromAi: false,
    });
    return {
      ...result,
      mp: willowMp,
      cooldowns: { ...willowSpellCooldowns },
      stance: willowStance.getWillowStance(),
    };
  };
  window.debug_set_combat_active = (active = false) => {
    devCombatOverride = Boolean(active);
    if (devCombatOverride) {
      inputManager.clearTouchTarget();
      pendingMobileAttackEnemyId = null;
    }
    return {
      combatActive: getEffectiveMovementContext() === "combat",
      devCombatOverride,
    };
  };
  window.debug_get_willow_state = () => ({
    joined: hasWillowJoined(),
    activeStance: willowStance.getWillowStance(),
    autoStanceEnabled: willowStance.getAutoStanceEnabled(),
    stanceState: willowStance.getDebugState(getNowMs()),
    mp: Number(willowMp.toFixed(2)),
    maxMp: Number(willowMaxMp.toFixed(2)),
    cooldowns: { ...willowSpellCooldowns },
    pendingCasts: willowPendingCasts.map((cast) => ({
      spellId: cast.spell?.id ?? "",
      executeAt: Number((cast.executeAt ?? 0).toFixed(3)),
      targetId: cast.targetId ?? "",
    })),
    debuffs: getLegacyWillowDebuffState(),
  });
  window.debug_damage_elaine = (amount) => {
    const incoming = Math.max(0, Number(amount) || 0);
    if (elaineDowned) return { damage: 0, elaineDowned: true };
    const nextHp = Math.max(0, elaineHp - incoming);
    const damage = elaineHp - nextHp;
    elaineHp = nextHp;
    if (elaineHp <= 0) {
      onElaineDowned();
    }
    return { damage, hp: elaineHp, downed: elaineDowned };
  };
  window.debug_set_tactics_mode = (mode = "balanced") => {
    const next = setTacticsMode(mode);
    return { tacticsMode: next };
  };
  window.debug_get_tactics_mode = () => getTacticsMode();
  window.debug_set_active_character = (characterId = "arthur") => {
    requestActiveCharacter(characterId, { showFailureToast: false, fromUi: true });
    return { activeCharacter: activePartyMember };
  };
  window.debug_get_active_character = () => activePartyMember;
  window.debug_get_ai_stats = () => ({ ...aiStats });
  window.debug_toggle_ai_overlay = (force = null) => {
    if (force === null || force === undefined) {
      aiOverlayEnabled = !aiOverlayEnabled;
    } else {
      aiOverlayEnabled = Boolean(force);
    }
    return { enabled: aiOverlayEnabled };
  };
  window.debug_get_party_ai_state = () => partySystem.getAiState?.() ?? lastPartyAiFrame;
  function triggerBanterDebug({
    channel = "guidance",
    topicId = "",
    contextKey = "",
    forceToast = false,
  } = {}) {
    const context = buildBanterContext({
      deltaSeconds: 0,
      freezeInput: false,
      contextOverrideKey: contextKey,
    });
    const event = banterDirector.forceTrigger(context, {
      channel,
      topicId,
      contextKey,
    });
    const line = commitBanterEvent(event, {
      forceToast: Boolean(forceToast),
    });
    return {
      triggered: Boolean(line),
      line,
      channel: event?.channel ?? "",
      topicId: event?.topicId ?? "",
      contextKey: event ? banterDirector.getState().lastContextKey : "",
      escalationLevel: banterDirector.getState().escalationLevel,
      blocked: context.blocked,
      cooldownRemaining: banterDirector.getState().cooldownRemaining,
    };
  }
  window.debug_trigger_banter = (contextKey = "") => {
    return triggerBanterDebug({
      channel: "guidance",
      contextKey,
      forceToast: true,
    });
  };
  window.debug_force_banter = (channelOrContext = "guidance", topicId = "") => {
    const normalized = String(channelOrContext ?? "")
      .trim()
      .toLowerCase();
    if (normalized === "guidance" || normalized === "lore") {
      return triggerBanterDebug({
        channel: normalized,
        topicId,
        forceToast: normalized === "guidance",
      });
    }
    return triggerBanterDebug({
      channel: "guidance",
      contextKey: normalized,
      topicId,
      forceToast: true,
    });
  };
  window.debug_unlock_topic = (topicId = "") => {
    const unlocked = banterDirector.unlockTopic?.(topicId) ?? false;
    persistBanterStateIfDirty();
    return { unlocked, topicId: String(topicId ?? "").trim().toLowerCase() };
  };
  window.debug_get_banter_state = () => banterDirector.getState();
  window.debug_set_banter_frequency = (mode = "high") => {
    const frequency = banterDirector.setFrequency?.(mode) ?? BANTER_FREQUENCY_VALUES.high;
    persistBanterStateIfDirty();
    return {
      frequency,
      state: banterDirector.getState(),
    };
  };
  window.debug_set_objective = (objectiveId = OBJECTIVE_IDS.NONE) => {
    const resolved = setCurrentObjectiveId(objectiveId);
    currentObjectiveState = resolveStoryObjectiveState();
    resetObjectiveTelemetry();
    updateGuidanceLine();
    return resolved;
  };
  window.debug_set_active_member = (member = "arthur") => {
    const normalized = normalizePartyCharacterId(member);
    setActivePartyMember(normalized);
    return { activeMember: activePartyMember };
  };
  window.debug_mark_map_dirty = () => {
    markMapDirty();
    return { mapDirty };
  };
  window.debug_add_motes = (amount = 0) => {
    verdantMoteCount = Math.max(0, verdantMoteCount + Math.floor(Number(amount) || 0));
    return verdantMoteCount;
  };
  window.debug_add_shards = (amount = 0) => {
    const delta = Math.floor(Number(amount) || 0);
    relicShardCount = saveState.addRelicShards?.(delta) ?? Math.max(0, relicShardCount + delta);
    return relicShardCount;
  };
  window.debug_get_upgrades = () => ({ ...playerUpgrades });
  window.debug_set_story_flag = (flagKey, value) => {
    const key = String(flagKey ?? "").trim();
    if (!key) return false;
    if (key === CURRENT_OBJECTIVE_FLAG || key === "current_objective") {
      setCurrentObjectiveId(value);
      currentObjectiveState = resolveStoryObjectiveState();
      resetObjectiveTelemetry();
      updateGuidanceLine();
      return true;
    }
    if (key === ROWAN_COUNCIL_FLAG || key === "rowan_council_done") {
      setRowanCouncilDone(Boolean(value));
      if (!Boolean(value)) {
        rowanCouncilPending = null;
      }
      return true;
    }
    if (key === EMBERFALL_LEAD_UNLOCKED_FLAG || key === "emberfall_lead_unlocked") {
      setEmberfallLeadUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER2_FLAGS.STARTED || key === "chapter2_started") {
      setChapter2Started(Boolean(value));
      if (!Boolean(value)) {
        chapter2ArrivalPending = null;
        willowMeetPending = null;
      }
      return true;
    }
    if (key === CHAPTER2_FLAGS.ARRIVED_EMBERFALL || key === "chapter2_arrived_emberfall") {
      setChapter2ArrivedEmberfall(Boolean(value));
      chapter2ArrivalPending = null;
      if (!Boolean(value)) {
        willowMeetPending = null;
      }
      return true;
    }
    if (key === CHAPTER2_FLAGS.WILLOW_MET || key === "willow_met") {
      setWillowMet(Boolean(value));
      if (!Boolean(value)) {
        willowMeetPending = null;
      }
      return true;
    }
    if (key === CHAPTER2_FLAGS.EMBERFALL_UNLOCKED || key === "emberfall_unlocked") {
      setStoryEmberfallUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER3_FLAGS.ROWAN_DEBRIEF_DONE || key === "chapter3_rowan_debrief_done") {
      setChapter3RowanDebriefDone(Boolean(value));
      if (!Boolean(value)) {
        chapter3DebriefPending = null;
      }
      return true;
    }
    if (key === CHAPTER4_FLAGS.ROWAN_REPORT_DONE || key === "chapter4_rowan_report_done") {
      setChapter4RowanReportDone(Boolean(value));
      if (!Boolean(value)) {
        chapter4RowanReportPending = null;
      }
      return true;
    }
    if (key === CHAPTER4_FLAGS.HARVESTER_SITE_UNLOCKED || key === "harvester_site_unlocked") {
      setHarvesterSiteUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER5_FLAGS.AFTERSHOCK_DONE || key === "chapter5_aftershock_done") {
      setChapter5AftershockDone(Boolean(value));
      if (!Boolean(value)) {
        chapter5AftershockPending = null;
      }
      return true;
    }
    if (key === CHAPTER5_FLAGS.RIDGE_GATE_UNLOCKED || key === "ridge_gate_unlocked") {
      setRidgeGateUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER5_FLAGS.REGION3_SEED_UNLOCKED || key === "region3_seed_unlocked") {
      setRegion3SeedUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER5_FLAGS.PATROL_SETPIECE_DONE || key === "vaeloris_patrol_setpiece_done") {
      setVaelorisPatrolSetpieceDone(Boolean(value));
      if (Boolean(value)) {
        clearRidgePatrolSetpieceState();
      }
      return true;
    }
    if (key === CHAPTER6_FLAGS.ARRIVED_WINDWARD || key === "chapter6_arrived_windward") {
      setChapter6ArrivedWindward(Boolean(value));
      if (!Boolean(value)) {
        chapter6ArrivalPending = null;
      }
      return true;
    }
    if (key === CHAPTER6_FLAGS.RELAY_DROPPED || key === "chapter6_relay_dropped") {
      setChapter6RelayDropped(Boolean(value));
      if (!Boolean(value)) {
        clearChapter6RelaySetpieceState();
      }
      return true;
    }
    if (key === CHAPTER6_FLAGS.WAYSTONE_ATTUNED || key === "chapter6_waystone_attuned") {
      setChapter6WaystoneAttuned(Boolean(value));
      if (!Boolean(value)) {
        chapter6WaystoneLorePending = null;
      }
      return true;
    }
    if (key === CHAPTER7_CHOIR_ENGINE_DEFEATED_FLAG || key === "chapter7_choir_engine_defeated") {
      setChapter7ChoirEngineDefeated(Boolean(value));
      return true;
    }
    if (key === CHAPTER7_CONVERGENCE_CHOICE_FLAG || key === "chapter7_convergence_choice") {
      setChapter7ConvergenceChoice(value);
      return true;
    }
    if (key === CHAPTER8_FLAGS.AFTERMATH_DONE || key === "chapter8_aftermath_done") {
      setChapter8AftermathDone(Boolean(value));
      if (!Boolean(value)) {
        chapter8AftermathPending = null;
      }
      return true;
    }
    if (key === CHAPTER8_FLAGS.RETALIATION_STARTED || key === "chapter8_retaliation_started") {
      setChapter8RetaliationStarted(Boolean(value));
      return true;
    }
    if (key === CHAPTER8_FLAGS.MUTE_SPIKES_CLEARED || key === "chapter8_mute_spikes_cleared") {
      setChapter8MuteSpikesCleared(Boolean(value));
      if (Boolean(value)) {
        clearChapter8RetaliationSetpieceState();
      }
      return true;
    }
    if (key === CHAPTER8_FLAGS.REGION4_SEED_UNLOCKED || key === "region4_seed_unlocked") {
      setRegion4SeedUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER8_FLAGS.REGION4_SEED_GATE_UNLOCKED || key === "region4_seed_gate_unlocked") {
      setRegion4SeedGateUnlocked(Boolean(value));
      return true;
    }
    if (key === "region3_seed_entered") {
      setRegion3SeedEntered(Boolean(value));
      return true;
    }
    if (key === "region4_seed_entered") {
      setRegion4SeedEntered(Boolean(value));
      return true;
    }
    if (key === CHAPTER9_FLAGS.STARTED || key === "chapter9_started") {
      setChapter9Started(Boolean(value));
      if (!Boolean(value)) {
        chapter9StartPending = null;
        chapter9LoreVisionPending = null;
        clearChapter9SetpieceState();
      }
      return true;
    }
    if (key === CHAPTER9_FLAGS.ANCHORS_ATTUNED || key === "chapter9_anchors_attuned") {
      setChapter9AnchorsAttuned(Boolean(value));
      return true;
    }
    if (key === CHAPTER9_FLAGS.NULL_ARCHIVIST_DEFEATED || key === "chapter9_null_archivist_defeated") {
      setChapter9NullArchivistDefeated(Boolean(value));
      return true;
    }
    if (key === CHAPTER9_FLAGS.CHOICE || key === "chapter9_choice") {
      setChapter9Choice(value);
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.STARTED || key === "endgame_act1_started") {
      setEndgameAct1Started(Boolean(value));
      if (!Boolean(value)) {
        endgameAct1StartPending = null;
        clearThirdSealQuestState();
        clearSpireBreachState();
      }
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.THIRD_SEAL_OBTAINED || key === "endgame_task_third_seal_obtained") {
      setEndgameThirdSealObtained(Boolean(value));
      if (Boolean(value)) {
        setStoryFlag("endgame_task_third_seal", true);
      }
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.OUTER_SPIRE_UNLOCKED || key === "endgame_outer_spire_unlocked") {
      setEndgameOuterSpireUnlocked(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.OUTER_SPIRE_BREACHED || key === "endgame_outer_spire_breached") {
      setEndgameOuterSpireBreached(Boolean(value));
      if (!Boolean(value)) {
        clearSpireBreachState();
      }
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.GATEWARDEN_DEFEATED || key === "endgame_gatewarden_defeated") {
      setEndgameGatewardenDefeated(Boolean(value));
      if (Boolean(value)) {
        setStoryFlag("endgame_spire_gatewarden_active", false);
      }
      return true;
    }
    if (key === ENDGAME_ACT1_FLAGS.SPIRE_ENTRY_UNLOCKED || key === "endgame_spire_entry_unlocked") {
      setEndgameSpireEntryUnlocked(Boolean(value));
      return true;
    }
    if (key === "endgame_spire_gatewarden_active") {
      setStoryFlag("endgame_spire_gatewarden_active", Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.STARTED || key === "endgame_act2_started") {
      setEndgameAct2Started(Boolean(value));
      if (!Boolean(value)) {
        endgameAct2StartPending = null;
        endgameAct2LorePending = null;
        resetInnerSpireRuntime({ keepProgress: false });
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.INNER_SPIRE_ENTERED || key === "endgame_inner_spire_entered") {
      setEndgameInnerSpireEntered(Boolean(value));
      if (!Boolean(value)) {
        resetInnerSpireRuntime({ keepProgress: true });
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_1 || key === "endgame_resonance_lock_1") {
      const resolved = Boolean(value);
      setEndgameResonanceLock(1, resolved);
      if (currentSceneInfo.sceneId === "inner_spire") {
        initializeInnerSpireState({ force: true });
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_2 || key === "endgame_resonance_lock_2") {
      const resolved = Boolean(value);
      setEndgameResonanceLock(2, resolved);
      if (currentSceneInfo.sceneId === "inner_spire") {
        initializeInnerSpireState({ force: true });
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_3 || key === "endgame_resonance_lock_3") {
      const resolved = Boolean(value);
      setEndgameResonanceLock(3, resolved);
      if (currentSceneInfo.sceneId === "inner_spire") {
        initializeInnerSpireState({ force: true });
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_DEFEATED || key === "endgame_loom_proctor_defeated") {
      setEndgameLoomProctorDefeated(Boolean(value));
      if (!Boolean(value)) {
        endgameAct2LorePending = null;
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.ACT3_UNLOCKED || key === "endgame_act3_unlocked") {
      setEndgameAct3Unlocked(Boolean(value));
      if (!Boolean(value)) {
        setEndgameLastDoorSeen(false);
      }
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.LAST_DOOR_SEEN || key === "endgame_last_door_seen") {
      setEndgameLastDoorSeen(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE || key === "endgame_loom_proctor_active") {
      setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.STARTED || key === "endgame_act3_started") {
      setEndgameAct3Started(Boolean(value));
      if (!Boolean(value)) {
        endgameAct3StartPending = null;
      }
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.LAST_DOOR_OPENED || key === "endgame_last_door_opened") {
      setEndgameLastDoorOpened(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.LAST_SPIRE_ENTERED || key === "endgame_last_spire_entered") {
      setEndgameLastSpireEntered(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.SETPIECE_RIFT_CROSSED || key === "endgame_setpiece_rift_crossed") {
      setEndgameSetpieceRiftCrossed(Boolean(value));
      if (!Boolean(value)) {
        endgameAct3LorePanelsPending = null;
      }
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.SETPIECE_CORE_REACHED || key === "endgame_setpiece_core_reached") {
      setEndgameSetpieceCoreReached(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.FINAL_BOSS_DEFEATED || key === "endgame_final_boss_defeated") {
      setEndgameFinalBossDefeated(Boolean(value));
      if (!Boolean(value)) {
        endingChoicePanel.close();
      }
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.CHOICE_MADE || key === "endgame_choice_made") {
      setEndgameChoiceMade(Boolean(value));
      if (!Boolean(value)) {
        setEndgameEnding("");
      }
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.ENDING || key === "endgame_ending") {
      setEndgameEnding(String(value ?? ""));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.CREDITS_SEEN || key === "endgame_credits_seen") {
      setEndgameCreditsSeen(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.NGPLUS_UNLOCKED || key === "ngplus_unlocked") {
      setNgPlusUnlocked(Boolean(value));
      return true;
    }
    if (key === ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE || key === "endgame_narrator_crown_active") {
      setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, Boolean(value));
      return true;
    }
    if (key === "endgame_started") {
      setEndgameStarted(Boolean(value));
      if (!Boolean(value)) {
        setEndgameGoalId("");
        setEndgameRouteSeedUnlocked(false);
        setEndgameAct1Started(false);
        setEndgameThirdSealObtained(false);
        setEndgameOuterSpireUnlocked(false);
        setEndgameOuterSpireBreached(false);
        setEndgameGatewardenDefeated(false);
        setEndgameSpireEntryUnlocked(false);
        setEndgameAct2Started(false);
        setEndgameInnerSpireEntered(false);
        setEndgameResonanceLock(1, false);
        setEndgameResonanceLock(2, false);
        setEndgameResonanceLock(3, false);
        setEndgameLoomProctorDefeated(false);
        setEndgameAct3Unlocked(false);
        setEndgameLastDoorSeen(false);
        setEndgameAct3Started(false);
        setEndgameLastDoorOpened(false);
        setEndgameLastSpireEntered(false);
        setEndgameSetpieceRiftCrossed(false);
        setEndgameSetpieceCoreReached(false);
        setEndgameFinalBossDefeated(false);
        setEndgameChoiceMade(false);
        setEndgameEnding("");
        setEndgameCreditsSeen(false);
        setNgPlusUnlocked(false);
        setStoryFlag("endgame_spire_gatewarden_active", false);
        setStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE, false);
        setStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE, false);
        endgameAct1StartPending = null;
        endgameAct2StartPending = null;
        endgameAct2LorePending = null;
        endgameAct3StartPending = null;
        endgameAct3LorePanelsPending = null;
        endgameAct3EndingPending = null;
        clearThirdSealQuestState();
        clearSpireBreachState();
        resetInnerSpireRuntime({ keepProgress: false });
        resetLastSpireRuntime({ keepProgress: false });
        endingChoicePanel.close();
        creditsOverlay.close();
        cinematicPanelOverlay.close();
      }
      return true;
    }
    if (key === "endgame_goal_id") {
      setEndgameGoalId(String(value ?? ""));
      return true;
    }
    if (key === "endgame_route_seed_unlocked") {
      setEndgameRouteSeedUnlocked(Boolean(value));
      return true;
    }
    if (key === CHAPTER3_FLAGS.LISTENING_SPIKE_LEAD_UNLOCKED || key === "listening_spike_lead_unlocked") {
      setListeningSpikeLeadUnlocked(Boolean(value));
      return true;
    }
    if (key === LISTENING_SPIKE_FLAGS.SITE_CLEARED || key === "listening_spike_site_cleared") {
      setListeningSpikeSiteCleared(Boolean(value));
      if (!Boolean(value)) {
        clearListeningSpikeSetpieceState();
      }
      return true;
    }
    if (key === LISTENING_SPIKE_FLAGS.CHOICE || key === "listening_spike_choice") {
      listeningSpikeChoice = setListeningSpikeChoice(value);
      if (listeningSpikeChoice === LISTENING_SPIKE_CHOICE_VALUES.NONE) {
        listeningSpikeChoicePanel.close();
      }
      return true;
    }
    if (key === "vaeloris_first_choice") {
      setVaelorisChoice(normalizeVaelorisChoice(value));
      syncVaelorisExtractorVisual();
      applyVaelorisWorldModifiers();
      return true;
    }
    if (key === VAELORIS_HARVESTER_CHOICE_FLAG || key === "vaeloris_harvester_choice") {
      setHarvesterChoice(normalizeHarvesterChoice(value));
      harvesterChoice = getHarvesterChoice();
      applyVaelorisWorldModifiers();
      return true;
    }
    if (key === VAELORIS_PRESSURE_STAGE_FLAG || key === "vaeloris_pressure_stage") {
      vaelorisPressureStage = setVaelorisPressureStage(value);
      applyVaelorisWorldModifiers();
      return true;
    }
    if (key === VAELORIS_HARVESTER_ACTIVE_FLAG || key === "vaeloris_harvester_active") {
      setHarvesterBossActive(Boolean(value));
      return true;
    }
    if (key === VAELORIS_HARVESTER_DEFEATED_FLAG || key === "vaeloris_harvester_defeated") {
      setHarvesterBossDefeated(Boolean(value));
      return true;
    }
    if (key === CHAPTER4_FLAGS.HARVESTER_WARDEN_DEFEATED || key === "harvester_warden_defeated") {
      setHarvesterBossDefeated(Boolean(value));
      return true;
    }
    if (key === VAELORIS_FIELD_TRIGGER_FLAG) {
      setVaelorisFieldTriggered(Boolean(value));
      return true;
    }
    setStoryFlag(key, Boolean(value));
    if (key === ACT2_FALLOUT_FLAG) {
      act2FalloutPending = null;
      rowanCouncilPending = null;
    }
    if (key === CHAPTER2_FLAGS.STARTED || key === CHAPTER2_FLAGS.ARRIVED_EMBERFALL) {
      chapter2ArrivalPending = null;
      willowMeetPending = null;
    }
    if (key === CHAPTER2_FLAGS.WILLOW_MET && !Boolean(value)) {
      willowMeetPending = null;
    }
    if (key === "elaine_joined") {
      setElaineJoined(Boolean(value));
    }
    if (key === "willow_joined") {
      setWillowJoined(Boolean(value), { showToast: false });
    }
    if (key === "vein_quest_active" || key === "vein_quest_complete") {
      refreshQuestText();
    }
    return true;
  };
  window.debug_get_story_flags = () => ({
    ...saveState.getStoryFlags(),
    [CHAPTER9_FLAGS.CHOICE]: getChapter9Choice(),
    endgame_goal_id: getEndgameGoalId(),
    [ENDGAME_ACT1_FLAGS.STARTED]: hasEndgameAct1Started(),
    [ENDGAME_ACT1_FLAGS.THIRD_SEAL_OBTAINED]: hasEndgameThirdSealObtained(),
    [ENDGAME_ACT1_FLAGS.OUTER_SPIRE_UNLOCKED]: hasEndgameOuterSpireUnlocked(),
    [ENDGAME_ACT1_FLAGS.OUTER_SPIRE_BREACHED]: hasEndgameOuterSpireBreached(),
    [ENDGAME_ACT1_FLAGS.GATEWARDEN_DEFEATED]: hasEndgameGatewardenDefeated(),
    [ENDGAME_ACT1_FLAGS.SPIRE_ENTRY_UNLOCKED]: hasEndgameSpireEntryUnlocked(),
    [ENDGAME_ACT2_FLAGS.STARTED]: hasEndgameAct2Started(),
    [ENDGAME_ACT2_FLAGS.INNER_SPIRE_ENTERED]: hasEndgameInnerSpireEntered(),
    [ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_1]: hasEndgameResonanceLock(1),
    [ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_2]: hasEndgameResonanceLock(2),
    [ENDGAME_ACT2_FLAGS.RESONANCE_LOCK_3]: hasEndgameResonanceLock(3),
    [ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_DEFEATED]: hasEndgameLoomProctorDefeated(),
    [ENDGAME_ACT2_FLAGS.ACT3_UNLOCKED]: hasEndgameAct3Unlocked(),
    [ENDGAME_ACT2_FLAGS.LAST_DOOR_SEEN]: hasEndgameLastDoorSeen(),
    [ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE]: Boolean(getStoryFlag(ENDGAME_ACT2_FLAGS.LOOM_PROCTOR_ACTIVE)),
    [ENDGAME_ACT3_FLAGS.STARTED]: hasEndgameAct3Started(),
    [ENDGAME_ACT3_FLAGS.LAST_DOOR_OPENED]: hasEndgameLastDoorOpened(),
    [ENDGAME_ACT3_FLAGS.LAST_SPIRE_ENTERED]: hasEndgameLastSpireEntered(),
    [ENDGAME_ACT3_FLAGS.SETPIECE_RIFT_CROSSED]: hasEndgameSetpieceRiftCrossed(),
    [ENDGAME_ACT3_FLAGS.SETPIECE_CORE_REACHED]: hasEndgameSetpieceCoreReached(),
    [ENDGAME_ACT3_FLAGS.FINAL_BOSS_DEFEATED]: hasEndgameFinalBossDefeated(),
    [ENDGAME_ACT3_FLAGS.CHOICE_MADE]: hasEndgameChoiceMade(),
    [ENDGAME_ACT3_FLAGS.ENDING]: getEndgameEnding(),
    [ENDGAME_ACT3_FLAGS.CREDITS_SEEN]: hasEndgameCreditsSeen(),
    [ENDGAME_ACT3_FLAGS.NGPLUS_UNLOCKED]: hasNgPlusUnlocked(),
    [ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE]: Boolean(getStoryFlag(ENDGAME_ACT3_FLAGS.NARRATOR_ACTIVE)),
  });
  window.debug_get_current_objective = () => {
    currentObjectiveState = resolveStoryObjectiveState();
    return currentObjectiveState.id;
  };
  window.debug_validate_story = () => {
    const raw = window.render_game_to_text?.();
    if (!raw) {
      return {
        ok: false,
        issues: ["render_game_to_text unavailable"],
      };
    }
    try {
      const parsed = JSON.parse(raw);
      const issues = validateStoryState(parsed);
      return {
        ok: issues.length === 0,
        issues,
        objective: parsed.current_objective ?? "",
        sceneId: parsed.scene_id ?? "",
      };
    } catch (error) {
      return {
        ok: false,
        issues: [error?.message ?? String(error)],
      };
    }
  };
  window.debug_get_vaeloris_pressure_stage = () => getVaelorisPressureStage();
  window.debug_trigger_rowan_council = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const before = hasRowanCouncilDone();
    const triggered = tryTriggerRowanCouncilEvent({ force: true });
    return {
      triggered,
      before,
      after: hasRowanCouncilDone(),
      objective: currentObjectiveState.id,
      emberfallLeadUnlocked: hasEmberfallLeadUnlocked(),
      ridgeGateUnlocked: isRidgeGateUnlocked(),
    };
  };
  window.debug_trigger_rowan_debrief_ch3 = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const before = hasChapter3RowanDebriefDone();
    const triggered = tryTriggerRowanDebriefChapter3Event({
      force: false,
      nearRowan: true,
    });
    return {
      triggered,
      before,
      after: hasChapter3RowanDebriefDone(),
      leadUnlocked: hasListeningSpikeLeadUnlocked(),
      objective: resolveStoryObjectiveState().id,
      pending: Boolean(chapter3DebriefPending),
    };
  };
  window.debug_trigger_rowan_report_ch4 = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const before = hasChapter4RowanReportDone();
    const triggered = tryTriggerChapter4RowanReportEvent({
      force: false,
      nearRowan: true,
    });
    return {
      triggered,
      before,
      after: hasChapter4RowanReportDone(),
      siteUnlocked: hasHarvesterSiteUnlocked(),
      objective: resolveStoryObjectiveState().id,
      pending: Boolean(chapter4RowanReportPending),
    };
  };
  window.debug_trigger_ch5_aftershock = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const before = hasChapter5AftershockDone();
    const triggered = tryTriggerChapter5AftershockEvent({
      force: false,
      nearRowan: true,
    });
    return {
      triggered,
      before,
      after: hasChapter5AftershockDone(),
      ridgeGateUnlocked: isRidgeGateUnlocked(),
      region3SeedUnlocked: hasRegion3SeedUnlocked(),
      patrolSetpieceDone: hasVaelorisPatrolSetpieceDone(),
      pressureStage: getVaelorisPressureStage(),
      objective: resolveStoryObjectiveState().id,
      pending: Boolean(chapter5AftershockPending),
    };
  };
  window.debug_trigger_ch6_arrival = () => {
    if (currentSceneInfo.sceneId !== "windward") {
      forceLoadSceneForDebug("windward");
    }
    setChapter5AftershockDone(true);
    setVaelorisPatrolSetpieceDone(true);
    setRegion3SeedUnlocked(true);
    const before = hasChapter6ArrivedWindward();
    const triggered = tryTriggerChapter6ArrivalEvent({ force: false });
    return {
      triggered,
      before,
      after: hasChapter6ArrivedWindward(),
      objective: resolveStoryObjectiveState().id,
      pending: Boolean(chapter6ArrivalPending),
    };
  };
  window.debug_trigger_relay_setpiece = () => {
    if (currentSceneInfo.sceneId !== "windward") {
      forceLoadSceneForDebug("windward");
    }
    setChapter5AftershockDone(true);
    setVaelorisPatrolSetpieceDone(true);
    setRegion3SeedUnlocked(true);
    setChapter6ArrivedWindward(true);
    setChapter6RelayDropped(false);
    setChapter6WaystoneAttuned(false);
    clearChapter6RelaySetpieceState();
    const relayConfig = getWindwardRelayConfig();
    if (relayConfig?.center) {
      player.position.set(relayConfig.center.x, 0, relayConfig.center.y);
      cameraFollowTarget.set(relayConfig.center.x, 0, relayConfig.center.y);
      updateCamera(fixedStep, true);
    }
    const triggered = startChapter6RelaySetpiece({ force: true });
    return {
      triggered,
      active: chapter6RelaySetpieceState.active,
      enemyCount: chapter6RelaySetpieceState.active
        ? combatSystem.countAliveEnemiesByIds(chapter6RelaySetpieceState.enemyIds)
        : 0,
      tethersRemaining: getRelaySetpieceRemainingTethers(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_damage_tether = (index = 0, amount = 999) => {
    const result = damageChapter6RelayTether(index, amount);
    return {
      changed: Boolean(result),
      result,
      active: chapter6RelaySetpieceState.active,
      tethersRemaining: getRelaySetpieceRemainingTethers(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_force_relay_complete = () => {
    const completed = completeChapter6RelaySetpiece({ force: true });
    return {
      completed,
      relayDropped: hasChapter6RelayDropped(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_trigger_waystone_lore = () => {
    if (currentSceneInfo.sceneId !== "windward") {
      forceLoadSceneForDebug("windward");
    }
    setChapter5AftershockDone(true);
    setVaelorisPatrolSetpieceDone(true);
    setRegion3SeedUnlocked(true);
    setChapter6ArrivedWindward(true);
    setChapter6RelayDropped(true);
    setChapter6WaystoneAttuned(false);
    chapter6WaystoneLorePending = null;
    const config = getWaystoneCircleConfig();
    if (config?.center) {
      player.position.set(config.center.x, 0, config.center.y);
      cameraFollowTarget.set(config.center.x, 0, config.center.y);
      updateCamera(fixedStep, true);
    }
    const triggered = tryTriggerChapter6WaystoneLoreEvent({ force: true });
    return {
      triggered,
      pending: Boolean(chapter6WaystoneLorePending),
      attuned: hasChapter6WaystoneAttuned(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_trigger_ch8_aftermath = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const before = hasChapter8AftermathDone();
    const triggered = tryTriggerChapter8AftermathEvent({
      force: true,
      nearRowan: true,
    });
    return {
      triggered,
      before,
      after: hasChapter8AftermathDone(),
      retaliationStarted: hasChapter8RetaliationStarted(),
      muteSpikesCleared: hasChapter8MuteSpikesCleared(),
      region4SeedUnlocked: hasRegion4SeedUnlocked(),
      region4SeedGateUnlocked: hasRegion4SeedGateUnlocked(),
      pressureStage: getVaelorisPressureStage(),
      pending: Boolean(chapter8AftermathPending),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_trigger_retaliation_setpiece = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    setChapter8AftermathDone(true);
    setChapter8RetaliationStarted(true);
    setChapter8MuteSpikesCleared(false);
    setRegion4SeedUnlocked(true);
    setRegion4SeedGateUnlocked(false);
    chapter8AftermathPending = null;
    clearChapter8RetaliationSetpieceState();
    const config = getChapter8RetaliationConfig();
    if (config?.center) {
      player.position.set(config.center.x, 0, config.center.y);
      cameraFollowTarget.set(config.center.x, 0, config.center.y);
      updateCamera(fixedStep, true);
    }
    const triggered = startChapter8RetaliationSetpiece({ force: true });
    return {
      triggered,
      active: chapter8RetaliationSetpieceState.active,
      remainingSpikes: getChapter8RetaliationRemainingSpikes(),
      enemyCount: chapter8RetaliationSetpieceState.active
        ? combatSystem.countAliveEnemiesByIds(chapter8RetaliationSetpieceState.enemyIds)
        : 0,
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_damage_mute_spike = (index = 0, amount = CHAPTER8_RETALIATION_SPIKE_DAMAGE) => {
    const result = damageChapter8MuteSpike(index, amount);
    return {
      changed: Boolean(result),
      result,
      active: chapter8RetaliationSetpieceState.active,
      remainingSpikes: getChapter8RetaliationRemainingSpikes(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_force_setpiece_complete = () => {
    const completed = completeChapter8RetaliationSetpiece({ force: true });
    return {
      completed,
      muteSpikesCleared: hasChapter8MuteSpikesCleared(),
      region4SeedUnlocked: hasRegion4SeedUnlocked(),
      region4SeedGateUnlocked: hasRegion4SeedGateUnlocked(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_trigger_act2_fallout = () => {
    const before = hasAct2FalloutDone();
    const triggered = tryTriggerAct2FalloutEvent({ force: true });
    return {
      triggered,
      before,
      after: hasAct2FalloutDone(),
      ridgeGateUnlocked: isRidgeGateUnlocked(),
    };
  };
  window.debug_spawn_ridge_patrol = () => {
    if (currentSceneInfo.sceneId !== "thornmere") {
      forceLoadSceneForDebug("thornmere");
    }
    const spawned = vaelorisPressureSystem.spawnPatrol(combatSystem, { force: true });
    vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
    if (spawned?.spawned) {
      if (hasChapter5AftershockDone() && !hasVaelorisPatrolSetpieceDone()) {
        startRidgePatrolSetpiece();
      }
      setTransientMessage("A Vaeloris patrol arrives.", 1.2);
      markMapDirty();
    }
    return {
      ...spawned,
      state: vaelorisPatrolFrame,
      setpieceActive: ridgePatrolSetpieceState.active,
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_force_patrol_defeat = () => {
    combatSystem.forceDefeatAllEnemies();
    if (ridgePatrolSetpieceState.active) {
      completeRidgePatrolSetpiece();
    }
    vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
    return {
      patrolSetpieceDone: hasVaelorisPatrolSetpieceDone(),
      patrolClearedOnce: hasVaelorisPatrolClearedOnce(),
      tagObtained: hasVaelorisTagObtained(),
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_spawn_vaeloris_patrol = () => {
    const spawned = vaelorisPressureSystem.spawnPatrol(combatSystem, { force: true });
    vaelorisPatrolFrame = vaelorisPressureSystem.getDebugState();
    if (spawned?.spawned) {
      setTransientMessage("A Vaeloris patrol arrives.", 1.2);
    }
    return {
      ...spawned,
      state: vaelorisPatrolFrame,
    };
  };
  window.debug_trigger_listening_spike_setpiece = () => {
    if (currentSceneInfo.sceneId !== "emberfall") {
      forceLoadSceneForDebug("emberfall");
    }
    setListeningSpikeLeadUnlocked(true);
    setChapter3RowanDebriefDone(true);
    setListeningSpikeSiteCleared(false);
    listeningSpikeChoice = setListeningSpikeChoice(LISTENING_SPIKE_CHOICE_VALUES.NONE);
    listeningSpikeChoicePanel.close();
    clearListeningSpikeSetpieceState();
    const config = getListeningSpikeSiteConfig();
    if (config?.center) {
      player.position.set(config.center.x, 0, config.center.y);
      cameraFollowTarget.set(config.center.x, 0, config.center.y);
      updateCamera(fixedStep, true);
    }
    const triggered = startListeningSpikeSetpiece({ force: true });
    return {
      triggered,
      sceneId: currentSceneInfo.sceneId,
      active: listeningSpikeSetpieceState.active,
      enemyCount: listeningSpikeSetpieceState.enemyIds.length,
      center: {
        x: Number(listeningSpikeSetpieceState.center.x.toFixed(3)),
        z: Number(listeningSpikeSetpieceState.center.y.toFixed(3)),
      },
      objective: resolveStoryObjectiveState().id,
    };
  };
  window.debug_get_vaeloris = () => ({
    choice: vaelorisChoice,
    triggered: hasVaelorisFieldTriggered(),
    eventActive: vaelorisEventActive,
    constructsAlive: vaelorisConstructsAlive,
    pressureStage: getVaelorisPressureStage(),
    patrol: vaelorisPatrolFrame,
    panelOpen: vaelorisChoicePanel.isOpen(),
    extractorDestroyed: sceneManager.isVaelorisExtractorDestroyed?.() ?? false,
  });
  window.debug_complete_opening = () => {
    markOpeningPlayed();
    setStoryFlag("is_new_game", false);
    openingKillResolved = true;
    openingTransitionTimer = 0;
    if (currentSceneInfo.sceneId === OPENING_SCENE_ID) {
      sceneManager.requestTransition("thornmere", { flow: "opening-complete-debug" });
    }
    return true;
  };
  window.debug_teleport_player = (x, z) => {
    const nextX = Number(x) || 0;
    const nextZ = Number(z) || 0;
    player.position.set(nextX, 0, nextZ);
    cameraFollowTarget.set(nextX, 0, nextZ);
    updateCamera(fixedStep, true);
    return { x: nextX, z: nextZ };
  };
}

window.addEventListener("beforeunload", () => {
  const skipSave = Boolean(window.__verdant_skip_save_on_unload);
  persistBanterStateIfDirty();
  if (!skipSave && isPlayableScene(currentSceneInfo.sceneId)) {
    saveState.setPlayerPosition(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
    saveState.setSafeSpot(currentSceneInfo.sceneId, {
      x: player.position.x,
      z: player.position.z,
    });
  }
  inputManager.destroy();
  combatSystem.dispose();
  bossInstance.dispose();
  sceneManager.dispose();
  anomalySystem.dispose();
  disposeThreatVeins();
  eventRunner.clear();
  pulsePresentation.dispose();
  introTextBeat.destroy();
  vfxSystem.dispose();
  partySystem.dispose();
  shrineSystem.dispose();
  vaelorisChoicePanel.destroy();
  harvesterChoicePanel.destroy();
  listeningSpikeChoicePanel.destroy();
  elaineSpellBar.destroy();
  willowSpellBar.destroy();
  tacticsToggleButton.destroy();
  willowAutoStanceToggle.destroy();
  partyPortraitBar.destroy();
  disposeAmbientMoteSystem(ambientMoteSystem, scene);
  for (const record of weaponTextureCache.values()) {
    record.disposed = true;
    record.texture?.dispose?.();
    if (record.fallbackTexture && record.fallbackTexture !== record.texture) {
      record.fallbackTexture.dispose?.();
    }
  }
  weaponTextureCache.clear();
  activeWeaponMaterial.dispose();
  activeWeaponGlowMaterial.dispose();
  activeWeaponGemMaterial.dispose();
  playerOutlineMaterial.dispose();
  playerMaterial.dispose();
  playerShadow.material.dispose();
  playerShadow.geometry.dispose();
  partyChat.destroy();
  hud.destroy();
  sceneDebugOverlay.destroy();
  dialogueBox.destroy();
  loreVisionOverlay.destroy();
  cinematicPanelOverlay.destroy();
  endingChoicePanel.destroy();
  creditsOverlay.destroy();
  damageTintOverlay.destroy();
  audioBus.stopMusic("vein");
  audioBus.stopMusic();
});

resize();
updateCamera(fixedStep, true);
applyWorldVisuals(fixedStep);
render();
requestAnimationFrame(gameLoop);
