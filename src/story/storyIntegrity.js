import { normalizeObjectiveId, OBJECTIVE_IDS } from "./objectives.js";

function normalizeSceneId(sceneId) {
  const normalized = String(sceneId ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "rootway") return "region4_seed";
  if (normalized === "region3_seed") return "windward";
  return normalized;
}

function sceneAllowed(sceneId, allowedScenes = []) {
  const normalized = normalizeSceneId(sceneId);
  return allowedScenes.some((candidate) => normalizeSceneId(candidate) === normalized);
}

function requireFlag(issues, flagValue, message) {
  if (!flagValue) {
    issues.push(message);
  }
}

export function validateStoryState(state = {}) {
  const issues = [];
  const objective = normalizeObjectiveId(state.current_objective);
  const sceneId = normalizeSceneId(state.scene_id);

  const lock1 = Boolean(state.story_endgame_resonance_lock_1);
  const lock2 = Boolean(state.story_endgame_resonance_lock_2);
  const lock3 = Boolean(state.story_endgame_resonance_lock_3);
  const allLocks = lock1 && lock2 && lock3;

  const endgameAct3Unlocked = Boolean(state.story_endgame_act3_unlocked);
  const endgameAct3Started = Boolean(state.story_endgame_act3_started);
  const lastDoorOpened = Boolean(state.story_endgame_last_door_opened);
  const lastSpireEntered = Boolean(state.story_endgame_last_spire_entered);
  const riftCrossed = Boolean(state.story_endgame_setpiece_rift_crossed);
  const coreReached = Boolean(state.story_endgame_setpiece_core_reached);
  const finalBossDefeated = Boolean(state.story_endgame_final_boss_defeated);
  const endingChosen = Boolean(state.story_endgame_choice_made);
  const creditsSeen = Boolean(state.story_endgame_credits_seen);
  const ngPlusUnlocked = Boolean(state.story_ngplus_unlocked);

  if (objective === OBJECTIVE_IDS.ENTER_INNER_SPIRE) {
    requireFlag(issues, state.story_endgame_gatewarden_defeated, "Objective enter_inner_spire without gatewarden defeated.");
    requireFlag(issues, state.story_endgame_spire_entry_unlocked, "Objective enter_inner_spire without spire entry unlocked.");
    if (!sceneAllowed(sceneId, ["spire_antechamber", "inner_spire"])) {
      issues.push(`Objective enter_inner_spire in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS) {
    requireFlag(issues, state.story_endgame_inner_spire_entered, "Objective solve_resonance_locks without inner spire entered.");
    if (!sceneAllowed(sceneId, ["inner_spire"])) {
      issues.push(`Objective solve_resonance_locks in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR) {
    requireFlag(issues, allLocks, "Objective defeat_loom_proctor without all resonance locks complete.");
    if (!sceneAllowed(sceneId, ["inner_spire"])) {
      issues.push(`Objective defeat_loom_proctor in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.APPROACH_LAST_DOOR || objective === OBJECTIVE_IDS.OPEN_LAST_DOOR) {
    requireFlag(issues, state.story_endgame_loom_proctor_defeated, "Last-door objective without Loom Proctor defeated.");
    requireFlag(issues, endgameAct3Unlocked, "Last-door objective without Act III unlocked.");
    if (!sceneAllowed(sceneId, ["inner_spire_last_door", "inner_spire"])) {
      issues.push(`Last-door objective in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.CROSS_RIFT) {
    requireFlag(issues, endgameAct3Started, "Objective cross_rift without Act III started.");
    requireFlag(issues, lastSpireEntered, "Objective cross_rift without entering last spire.");
    if (!sceneAllowed(sceneId, ["last_spire"])) {
      issues.push(`Objective cross_rift in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.REACH_CROWN_ENGINE) {
    requireFlag(issues, riftCrossed, "Objective reach_crown_engine without rift crossing complete.");
    if (!sceneAllowed(sceneId, ["last_spire"])) {
      issues.push(`Objective reach_crown_engine in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.DEFEAT_FINAL_BOSS) {
    requireFlag(issues, coreReached, "Objective defeat_final_boss without core reached.");
    if (!sceneAllowed(sceneId, ["last_spire"])) {
      issues.push(`Objective defeat_final_boss in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.CHOOSE_ENDING) {
    requireFlag(issues, finalBossDefeated, "Objective choose_ending without final boss defeated.");
    if (!sceneAllowed(sceneId, ["last_spire"])) {
      issues.push(`Objective choose_ending in unexpected scene: ${sceneId}.`);
    }
  }

  if (objective === OBJECTIVE_IDS.CREDITS) {
    requireFlag(issues, endingChosen, "Objective credits without ending choice made.");
  }

  if (state.story_endgame_loom_proctor_defeated && !allLocks) {
    issues.push("Loom Proctor defeated without all resonance locks completed.");
  }
  if (endgameAct3Started && !endgameAct3Unlocked) {
    issues.push("Act III started while Act III unlock flag is false.");
  }
  if (lastDoorOpened && !endgameAct3Started) {
    issues.push("Last door opened without Act III started.");
  }
  if (lastSpireEntered && !lastDoorOpened) {
    issues.push("Last spire entered without opening last door.");
  }
  if (riftCrossed && !lastSpireEntered) {
    issues.push("Rift crossed without entering last spire.");
  }
  if (coreReached && !riftCrossed) {
    issues.push("Core reached without crossing rift.");
  }
  if (finalBossDefeated && !coreReached) {
    issues.push("Final boss defeated without core reached.");
  }
  if (endingChosen && !finalBossDefeated) {
    issues.push("Ending choice made without final boss defeated.");
  }
  if (creditsSeen && !endingChosen) {
    issues.push("Credits seen without ending choice.");
  }
  if (ngPlusUnlocked && !creditsSeen) {
    issues.push("NG+ unlocked without credits seen flag.");
  }
  if (state.story_chapter9_null_archivist_defeated && !state.story_chapter9_anchors_attuned) {
    issues.push("Null Archivist defeated before Chapter 9 anchors are attuned.");
  }

  const nonGameplayScenes = ["start", "prologue", "arthuropening", "title"];
  if (!nonGameplayScenes.includes(sceneId)) {
    if (!Boolean(state.debug_has_ground)) {
      issues.push(`Scene ${sceneId} reports no ground mesh mounted.`);
    }
    if (Number(state.debug_scene_objects ?? 0) <= 3) {
      issues.push(`Scene ${sceneId} has very low scene object count (${state.debug_scene_objects ?? 0}).`);
    }
  }

  return [...new Set(issues)];
}
