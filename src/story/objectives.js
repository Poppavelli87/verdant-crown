export const OBJECTIVE_IDS = Object.freeze({
  NONE: "none",
  RETURN_TO_ROWAN: "return_to_rowan",
  REPORT_BACK_TO_ROWAN: "report_back_to_rowan",
  TRAVEL_TO_EMBERFALL: "travel_to_emberfall",
  FIND_WILLOW: "find_willow",
  SURVIVE_AMBUSH: "survive_ambush",
  INVESTIGATE_LISTENING_SPIKE: "investigate_listening_spike",
  REACH_HARVESTER_SITE: "reach_harvester_site",
  DEFEAT_HARVESTER_WARDEN: "defeat_harvester_warden",
  RETURN_TO_ROWAN_AFTER_HARVESTER: "return_to_rowan_after_harvester",
  CLEAR_RIDGE_PATROL: "clear_ridge_patrol",
  CROSS_RIDGE_GATE: "cross_ridge_gate",
  FIND_WAYSTONE_CIRCLE: "find_waystone_circle",
  DROP_RELAY: "drop_relay",
  ATTUNE_WAYSTONE: "attune_waystone",
  RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS: "return_to_rowan_with_waystone_news",
  RETURN_TO_ROWAN_AFTER_CONVERGENCE: "return_to_rowan_after_convergence",
  STOP_MUTE_SPIKES: "stop_mute_spikes",
  TAKE_NEW_ROUTE: "take_new_route",
  RETURN_TO_ROWAN_OR_PRESS_ON: "return_to_rowan_or_press_on",
  REGION3_FIRST_STEPS: "region3_first_steps",
  REACH_CROWNHEART_VAULT: "reach_crownheart_vault",
  STABILIZE_WORLDROOTS: "stabilize_worldroots",
  DEFEAT_NULL_ARCHIVIST: "defeat_null_archivist",
  MAKE_VAULT_CHOICE: "make_vault_choice",
  PREPARE_ENDGAME: "prepare_endgame",
  OBTAIN_THIRD_SEAL: "obtain_third_seal",
  BREACH_OUTER_SPIRE: "breach_outer_spire",
  DEFEAT_GATEWARDEN: "defeat_gatewarden",
  ENTER_OUTER_SPIRE: "enter_outer_spire",
  ENTER_INNER_SPIRE: "enter_inner_spire",
  SOLVE_RESONANCE_LOCKS: "solve_resonance_locks",
  DEFEAT_LOOM_PROCTOR: "defeat_loom_proctor",
  APPROACH_LAST_DOOR: "approach_last_door",
  OPEN_LAST_DOOR: "open_last_door",
  CROSS_RIFT: "cross_rift",
  REACH_CROWN_ENGINE: "reach_crown_engine",
  DEFEAT_FINAL_BOSS: "defeat_final_boss",
  CHOOSE_ENDING: "choose_ending",
  CREDITS: "credits",
});

const OBJECTIVE_DEFINITIONS = Object.freeze({
  [OBJECTIVE_IDS.NONE]: Object.freeze({
    hudLine: "",
    hint: null,
  }),
  [OBJECTIVE_IDS.RETURN_TO_ROWAN]: Object.freeze({
    hudLine: "Return to Rowan. The roots are restless.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -0.25,
      z: 0.42,
    }),
  }),
  [OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN]: Object.freeze({
    hudLine: "Return to Rowan. Tell him what you found.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -0.25,
      z: 0.42,
    }),
  }),
  [OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL]: Object.freeze({
    hudLine: "Follow the ash wind. The ridge path waits.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: 7.42,
      z: 2.68,
    }),
  }),
  [OBJECTIVE_IDS.FIND_WILLOW]: Object.freeze({
    hudLine: "Find Willow at the fused basalt outcrop.",
    hint: Object.freeze({
      sceneId: "emberfall",
      x: 2.35,
      z: -0.82,
    }),
  }),
  [OBJECTIVE_IDS.SURVIVE_AMBUSH]: Object.freeze({
    hudLine: "Hold the clearing. Survive the Vaeloris ambush.",
    hint: Object.freeze({
      sceneId: "emberfall",
      x: 2.35,
      z: -0.82,
    }),
  }),
  [OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE]: Object.freeze({
    hudLine: "Follow the metallic hum in Emberfall. Find what's listening.",
    hint: Object.freeze({
      sceneId: "emberfall",
      x: -1.95,
      z: 2.08,
    }),
  }),
  [OBJECTIVE_IDS.REACH_HARVESTER_SITE]: Object.freeze({
    hudLine: "Return to Emberfall. Find the Harvester rig.",
    hint: Object.freeze({
      sceneId: "emberfall",
      x: 4.28,
      z: -2.18,
    }),
  }),
  [OBJECTIVE_IDS.DEFEAT_HARVESTER_WARDEN]: Object.freeze({
    hudLine: "Break the anchors. Stop the extraction.",
    hint: Object.freeze({
      sceneId: "emberfall",
      x: 4.28,
      z: -2.18,
    }),
  }),
  [OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_HARVESTER]: Object.freeze({
    hudLine: "Return to Rowan. Tell him what you chose.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -0.25,
      z: 0.42,
    }),
  }),
  [OBJECTIVE_IDS.CLEAR_RIDGE_PATROL]: Object.freeze({
    hudLine: "Vaeloris scouts prowl the ridge road. Clear the path.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: 6.88,
      z: 2.48,
    }),
  }),
  [OBJECTIVE_IDS.CROSS_RIDGE_GATE]: Object.freeze({
    hudLine: "The ridge path is open. Cross before it seals again.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: 7.42,
      z: 2.68,
    }),
  }),
  [OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE]: Object.freeze({
    hudLine: "Find the Waystone Circle. The wind will guide you.",
    hint: Object.freeze({
      sceneId: "windward",
      x: 1.9,
      z: -0.26,
    }),
  }),
  [OBJECTIVE_IDS.DROP_RELAY]: Object.freeze({
    hudLine: "Vaeloris is relaying signals. Drop the tether posts.",
    hint: Object.freeze({
      sceneId: "windward",
      x: 2.72,
      z: 1.38,
    }),
  }),
  [OBJECTIVE_IDS.ATTUNE_WAYSTONE]: Object.freeze({
    hudLine: "Touch the Waystone. Listen carefully.",
    hint: Object.freeze({
      sceneId: "windward",
      x: 1.9,
      z: -0.26,
    }),
  }),
  [OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS]: Object.freeze({
    hudLine: "Return to Rowan with what the Waystone showed you.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -0.25,
      z: 0.42,
    }),
  }),
  [OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_CONVERGENCE]: Object.freeze({
    hudLine: "Return to Rowan. The wind won't carry this news gently.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -0.25,
      z: 0.42,
    }),
  }),
  [OBJECTIVE_IDS.STOP_MUTE_SPIKES]: Object.freeze({
    hudLine: "Vaeloris is silencing the roots. Destroy the Mute Spikes.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -3.26,
      z: 2.22,
    }),
  }),
  [OBJECTIVE_IDS.TAKE_NEW_ROUTE]: Object.freeze({
    hudLine: "The roots have shifted. Take the Rootway.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: -4.42,
      z: 2.84,
    }),
  }),
  [OBJECTIVE_IDS.RETURN_TO_ROWAN_OR_PRESS_ON]: Object.freeze({
    hudLine: "Mark the path, then return to Rowan with what changed.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: -0.42,
      z: -0.06,
    }),
  }),
  [OBJECTIVE_IDS.REGION3_FIRST_STEPS]: Object.freeze({
    hudLine: "Beyond the ridge, the air changes. Keep moving.",
    hint: Object.freeze({
      sceneId: "windward",
      x: 0.95,
      z: 0.18,
    }),
  }),
  [OBJECTIVE_IDS.REACH_CROWNHEART_VAULT]: Object.freeze({
    hudLine: "The roots scream below. Find the Crownheart Vault.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: 1.82,
      z: 0.24,
      landmark: "vault_approach",
    }),
  }),
  [OBJECTIVE_IDS.STABILIZE_WORLDROOTS]: Object.freeze({
    hudLine: "Attune the three Worldroot Anchors. Stop the Sundering.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: 3.12,
      z: -0.24,
      landmark: "vault_door",
    }),
  }),
  [OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST]: Object.freeze({
    hudLine: "End the Null Archivist. It's erasing memory.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: 3.66,
      z: -1.16,
      landmark: "vault_arena",
    }),
  }),
  [OBJECTIVE_IDS.MAKE_VAULT_CHOICE]: Object.freeze({
    hudLine: "Choose: seal the Vault... or take the Key.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: 3.18,
      z: -0.22,
      landmark: "vault_choice",
    }),
  }),
  [OBJECTIVE_IDS.PREPARE_ENDGAME]: Object.freeze({
    hudLine: "The endgame begins. Find the route to the Last Spire.",
    hint: Object.freeze({
      sceneId: "thornmere",
      x: 6.34,
      z: -2.44,
      landmark: "endgame_gate",
    }),
  }),
  [OBJECTIVE_IDS.OBTAIN_THIRD_SEAL]: Object.freeze({
    hudLine: "Find the Oath Sigil Shrine. Bind the Third Seal.",
    hint: Object.freeze({
      sceneId: "region4_seed",
      x: -1.34,
      z: 1.36,
      landmark: "oath_shrine",
    }),
  }),
  [OBJECTIVE_IDS.BREACH_OUTER_SPIRE]: Object.freeze({
    hudLine: "Reach the Outer Spire. Break the lock nodes.",
    hint: Object.freeze({
      sceneId: "spire_approach",
      x: 2.84,
      z: -0.16,
      landmark: "spire_gate",
    }),
  }),
  [OBJECTIVE_IDS.DEFEAT_GATEWARDEN]: Object.freeze({
    hudLine: "End the Gatewarden. Open the Spire.",
    hint: Object.freeze({
      sceneId: "spire_approach",
      x: 3.44,
      z: -0.92,
      landmark: "spire_arena",
    }),
  }),
  [OBJECTIVE_IDS.ENTER_OUTER_SPIRE]: Object.freeze({
    hudLine: "Step inside. The Spire won't wait.",
    hint: Object.freeze({
      sceneId: "spire_antechamber",
      x: -0.24,
      z: 0.04,
      landmark: "spire_entry",
    }),
  }),
  [OBJECTIVE_IDS.ENTER_INNER_SPIRE]: Object.freeze({
    hudLine: "Beyond the gate: a loom of memory. Step inside.",
    hint: Object.freeze({
      sceneId: "spire_antechamber",
      x: 3.62,
      z: -0.24,
      landmark: "inner_spire_entry",
    }),
  }),
  [OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS]: Object.freeze({
    hudLine: "Align the three Resonance Locks. Keep the Loom quiet.",
    hint: Object.freeze({
      sceneId: "inner_spire",
      x: 0.18,
      z: 1.28,
      landmark: "resonance_locks",
    }),
  }),
  [OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR]: Object.freeze({
    hudLine: "The Loom Proctor awakens. Cut the weave.",
    hint: Object.freeze({
      sceneId: "inner_spire",
      x: 2.18,
      z: 0.22,
      landmark: "loom_arena",
    }),
  }),
  [OBJECTIVE_IDS.APPROACH_LAST_DOOR]: Object.freeze({
    hudLine: "The Last Door waits. Prepare for the final act.",
    hint: Object.freeze({
      sceneId: "inner_spire_last_door",
      x: 1.84,
      z: -0.14,
      landmark: "last_door",
    }),
  }),
  [OBJECTIVE_IDS.OPEN_LAST_DOOR]: Object.freeze({
    hudLine: "The Last Door listens. Step forward.",
    hint: Object.freeze({
      sceneId: "inner_spire_last_door",
      x: 1.84,
      z: -0.14,
      landmark: "last_door",
    }),
  }),
  [OBJECTIVE_IDS.CROSS_RIFT]: Object.freeze({
    hudLine: "Cross the Rift. Do not let reality close behind you.",
    hint: Object.freeze({
      sceneId: "last_spire",
      x: -1.18,
      z: 0.12,
      landmark: "rift-bridge",
    }),
  }),
  [OBJECTIVE_IDS.REACH_CROWN_ENGINE]: Object.freeze({
    hudLine: "Reach the Crown Engine. Break the final clamps.",
    hint: Object.freeze({
      sceneId: "last_spire",
      x: 2.46,
      z: -0.34,
      landmark: "crown-engine",
    }),
  }),
  [OBJECTIVE_IDS.DEFEAT_FINAL_BOSS]: Object.freeze({
    hudLine: "Face the Narrator Crown. Hold the line.",
    hint: Object.freeze({
      sceneId: "last_spire",
      x: 3.24,
      z: -1.08,
      landmark: "boss-arena",
    }),
  }),
  [OBJECTIVE_IDS.CHOOSE_ENDING]: Object.freeze({
    hudLine: "Choose: Seal the Crown, or Rewrite the world.",
    hint: Object.freeze({
      sceneId: "last_spire",
      x: 3.84,
      z: -1.72,
      landmark: "choice-altar",
    }),
  }),
  [OBJECTIVE_IDS.CREDITS]: Object.freeze({
    hudLine: "",
    hint: Object.freeze({
      sceneId: "last_spire",
      x: 0,
      z: 0,
      landmark: "credits",
    }),
  }),
});

export function getObjectiveHudLine(objectiveId) {
  const normalized = normalizeObjectiveId(objectiveId);
  return OBJECTIVE_DEFINITIONS[normalized]?.hudLine ?? "";
}

export function getObjectiveHint(objectiveId) {
  const normalized = normalizeObjectiveId(objectiveId);
  const hint = OBJECTIVE_DEFINITIONS[normalized]?.hint;
  if (!hint) return null;
  return {
    sceneId: hint.sceneId,
    x: hint.x,
    z: hint.z,
    landmark: hint.landmark ?? "",
  };
}

export function normalizeObjectiveId(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    normalized === OBJECTIVE_IDS.RETURN_TO_ROWAN ||
    normalized === OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN ||
    normalized === OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL ||
    normalized === OBJECTIVE_IDS.FIND_WILLOW ||
    normalized === OBJECTIVE_IDS.SURVIVE_AMBUSH ||
    normalized === OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE ||
    normalized === OBJECTIVE_IDS.REACH_HARVESTER_SITE ||
    normalized === OBJECTIVE_IDS.DEFEAT_HARVESTER_WARDEN ||
    normalized === OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_HARVESTER ||
    normalized === OBJECTIVE_IDS.CLEAR_RIDGE_PATROL ||
    normalized === OBJECTIVE_IDS.CROSS_RIDGE_GATE ||
    normalized === OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE ||
    normalized === OBJECTIVE_IDS.DROP_RELAY ||
    normalized === OBJECTIVE_IDS.ATTUNE_WAYSTONE ||
    normalized === OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS ||
    normalized === OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_CONVERGENCE ||
    normalized === OBJECTIVE_IDS.STOP_MUTE_SPIKES ||
    normalized === OBJECTIVE_IDS.TAKE_NEW_ROUTE ||
    normalized === OBJECTIVE_IDS.RETURN_TO_ROWAN_OR_PRESS_ON ||
    normalized === OBJECTIVE_IDS.REGION3_FIRST_STEPS ||
    normalized === OBJECTIVE_IDS.REACH_CROWNHEART_VAULT ||
    normalized === OBJECTIVE_IDS.STABILIZE_WORLDROOTS ||
    normalized === OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST ||
    normalized === OBJECTIVE_IDS.MAKE_VAULT_CHOICE ||
    normalized === OBJECTIVE_IDS.PREPARE_ENDGAME ||
    normalized === OBJECTIVE_IDS.OBTAIN_THIRD_SEAL ||
    normalized === OBJECTIVE_IDS.BREACH_OUTER_SPIRE ||
    normalized === OBJECTIVE_IDS.DEFEAT_GATEWARDEN ||
    normalized === OBJECTIVE_IDS.ENTER_OUTER_SPIRE ||
    normalized === OBJECTIVE_IDS.ENTER_INNER_SPIRE ||
    normalized === OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS ||
    normalized === OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR ||
    normalized === OBJECTIVE_IDS.APPROACH_LAST_DOOR ||
    normalized === OBJECTIVE_IDS.OPEN_LAST_DOOR ||
    normalized === OBJECTIVE_IDS.CROSS_RIFT ||
    normalized === OBJECTIVE_IDS.REACH_CROWN_ENGINE ||
    normalized === OBJECTIVE_IDS.DEFEAT_FINAL_BOSS ||
    normalized === OBJECTIVE_IDS.CHOOSE_ENDING ||
    normalized === OBJECTIVE_IDS.CREDITS
  ) {
    return normalized;
  }
  return OBJECTIVE_IDS.NONE;
}

function buildProgressKey(id, context) {
  if (id === OBJECTIVE_IDS.RETURN_TO_ROWAN) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.nearRowan)),
      Number(Boolean(context.milestoneMet)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.nearRowan)),
      Number(Boolean(context.chapter3RowanDebriefDone)),
      Number(Boolean(context.listeningSpikeSiteCleared)),
      Number(Boolean(context.listeningSpikeChoiceResolved)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter2Started)),
      Number(Boolean(context.chapter2ArrivedEmberfall)),
      Number(Boolean(context.emberfallLeadUnlocked)),
      Number(Boolean(context.emberfallUnlocked)),
      Number(Boolean(context.willowJoined)),
      Number(Boolean(context.ridgeGateUnlocked)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.FIND_WILLOW) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter2Started)),
      Number(Boolean(context.chapter2ArrivedEmberfall)),
      Number(Boolean(context.willowMet)),
      Number(Boolean(context.willowJoined)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.SURVIVE_AMBUSH) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter2ArrivedEmberfall)),
      Number(Boolean(context.willowMet)),
      Number(Boolean(context.chapter2AmbushActive)),
      Number(Boolean(context.willowJoined)),
      Number(context.chapter2AmbushEnemyCount ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter3RowanDebriefDone)),
      Number(Boolean(context.listeningSpikeLeadUnlocked)),
      Number(Boolean(context.listeningSpikeSiteCleared)),
      Number(Boolean(context.listeningSpikeChoiceResolved)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.REACH_HARVESTER_SITE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter4RowanReportDone)),
      Number(Boolean(context.harvesterSiteUnlocked)),
      Number(Boolean(context.harvesterBossDefeated)),
      Number(Boolean(context.harvesterChoiceResolved)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DEFEAT_HARVESTER_WARDEN) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter4RowanReportDone)),
      Number(Boolean(context.harvesterSiteUnlocked)),
      Number(Boolean(context.harvesterBossActive)),
      Number(Boolean(context.harvesterBossDefeated)),
      Number(Boolean(context.harvesterChoiceResolved)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_HARVESTER) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.harvesterBossDefeated)),
      Number(Boolean(context.harvesterChoiceResolved)),
      Number(Boolean(context.chapter4RowanReportDone)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.CLEAR_RIDGE_PATROL) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter5AftershockDone)),
      Number(Boolean(context.ridgeGateUnlocked)),
      Number(Boolean(context.patrolSetpieceDone)),
      Number(Boolean(context.patrolNearby)),
      Number(context.patrolEnemyCount ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.CROSS_RIDGE_GATE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter5AftershockDone)),
      Number(Boolean(context.ridgeGateUnlocked)),
      Number(Boolean(context.patrolSetpieceDone)),
      Number(Boolean(context.region3SeedUnlocked)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter6ArrivedWindward)),
      Number(Boolean(context.chapter6RelayDropped)),
      Number(Boolean(context.chapter6WaystoneAttuned)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DROP_RELAY) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter6ArrivedWindward)),
      Number(Boolean(context.chapter6RelayActive)),
      Number(Boolean(context.chapter6RelayDropped)),
      Number(context.chapter6RelayRemainingTethers ?? 0),
      Number(context.chapter6RelayEnemyCount ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.ATTUNE_WAYSTONE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter6RelayDropped)),
      Number(Boolean(context.chapter6WaystoneAttuned)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter6WaystoneAttuned)),
      Number(Boolean(context.nearRowan)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_CONVERGENCE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter7ChoirEngineDefeated)),
      String(context.chapter7ConvergenceChoice ?? ""),
      Number(Boolean(context.chapter8AftermathDone)),
      Number(Boolean(context.nearRowan)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.STOP_MUTE_SPIKES) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter8AftermathDone)),
      Number(Boolean(context.chapter8RetaliationStarted)),
      Number(Boolean(context.chapter8MuteSpikesCleared)),
      Number(Boolean(context.chapter8SetpieceActive)),
      Number(context.chapter8RemainingSpikes ?? 0),
      Number(context.chapter8EnemyCount ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.TAKE_NEW_ROUTE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter8MuteSpikesCleared)),
      Number(Boolean(context.region4SeedUnlocked)),
      Number(Boolean(context.region4SeedGateUnlocked)),
      Number(Boolean(context.region4SeedEntered)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.RETURN_TO_ROWAN_OR_PRESS_ON) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.region4SeedEntered)),
      Number(Boolean(context.nearRowan)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.REGION3_FIRST_STEPS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.region3SeedUnlocked)),
      Number(Boolean(context.enteredRegion3Seed)),
      Number(Boolean(context.chapter6ArrivedWindward)),
      Number(Boolean(context.patrolSetpieceDone)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.REACH_CROWNHEART_VAULT) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.region4SeedUnlocked)),
      Number(Boolean(context.region4SeedEntered)),
      Number(Boolean(context.chapter8MuteSpikesCleared)),
      Number(Boolean(context.chapter9Started)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.STABILIZE_WORLDROOTS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter9Started)),
      Number(Boolean(context.chapter9AnchorsAttuned)),
      Number(Boolean(context.chapter9SetpieceActive)),
      Number(context.chapter9AnchorsRemaining ?? 0),
      Number(context.chapter9SunderWaves ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter9AnchorsAttuned)),
      Number(Boolean(context.chapter9NullArchivistDefeated)),
      Number(Boolean(context.chapter9BossActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.MAKE_VAULT_CHOICE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.chapter9NullArchivistDefeated)),
      String(context.chapter9Choice ?? ""),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.PREPARE_ENDGAME) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameStarted)),
      String(context.endgameGoalId ?? ""),
      Number(Boolean(context.endgameRouteSeedUnlocked)),
      Number(Boolean(context.endgameAct1Started)),
      Number(Boolean(context.endgameTaskThirdSealObtained)),
      Number(Boolean(context.endgameOuterSpireUnlocked)),
      Number(Boolean(context.endgameOuterSpireBreached)),
      Number(Boolean(context.endgameGatewardenDefeated)),
      Number(Boolean(context.endgameSpireEntryUnlocked)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.OBTAIN_THIRD_SEAL) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameStarted)),
      Number(Boolean(context.endgameAct1Started)),
      Number(Boolean(context.endgameTaskThirdSealObtained)),
      Number(Boolean(context.endgameOuterSpireUnlocked)),
      Number(Boolean(context.thirdSealSetpieceActive)),
      Number(Boolean(context.thirdSealAttuneReady)),
      Number(Boolean(context.thirdSealChanneling)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.BREACH_OUTER_SPIRE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameTaskThirdSealObtained)),
      Number(Boolean(context.endgameOuterSpireUnlocked)),
      Number(Boolean(context.endgameOuterSpireBreached)),
      Number(Boolean(context.spireBreachActive)),
      Number(context.spireBreachNodesRemaining ?? 0),
      Number(context.spireBreachDischarges ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DEFEAT_GATEWARDEN) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameOuterSpireBreached)),
      Number(Boolean(context.endgameGatewardenDefeated)),
      Number(Boolean(context.spireGatewardenActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.ENTER_OUTER_SPIRE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameGatewardenDefeated)),
      Number(Boolean(context.endgameSpireEntryUnlocked)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.ENTER_INNER_SPIRE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameGatewardenDefeated)),
      Number(Boolean(context.endgameSpireEntryUnlocked)),
      Number(Boolean(context.endgameAct2Started)),
      Number(Boolean(context.endgameInnerSpireEntered)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameAct2Started)),
      Number(Boolean(context.endgameInnerSpireEntered)),
      Number(Boolean(context.endgameResonanceLock1)),
      Number(Boolean(context.endgameResonanceLock2)),
      Number(Boolean(context.endgameResonanceLock3)),
      Number(Boolean(context.memoryPressureActive)),
      Number(context.memoryPressureTierCount ?? 0),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameResonanceLock1)),
      Number(Boolean(context.endgameResonanceLock2)),
      Number(Boolean(context.endgameResonanceLock3)),
      Number(Boolean(context.endgameLoomProctorDefeated)),
      Number(Boolean(context.loomProctorActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.APPROACH_LAST_DOOR) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameLoomProctorDefeated)),
      Number(Boolean(context.endgameAct3Unlocked)),
      Number(Boolean(context.endgameLastDoorSeen)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.OPEN_LAST_DOOR) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameAct3Unlocked)),
      Number(Boolean(context.endgameAct3Started)),
      Number(Boolean(context.endgameLastDoorOpened)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.CROSS_RIFT) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameAct3Started)),
      Number(Boolean(context.endgameLastDoorOpened)),
      Number(Boolean(context.endgameLastSpireEntered)),
      Number(Boolean(context.endgameSetpieceRiftCrossed)),
      Number(context.riftAnchorCount ?? 0),
      Number(Boolean(context.riftSetpieceActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.REACH_CROWN_ENGINE) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameSetpieceRiftCrossed)),
      Number(Boolean(context.endgameSetpieceCoreReached)),
      Number(context.coreClampsRemaining ?? 0),
      Number(Boolean(context.coreSetpieceActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.DEFEAT_FINAL_BOSS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameSetpieceCoreReached)),
      Number(Boolean(context.endgameFinalBossDefeated)),
      Number(Boolean(context.narratorCrownActive)),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.CHOOSE_ENDING) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameFinalBossDefeated)),
      Number(Boolean(context.endgameChoiceMade)),
      String(context.endgameEnding ?? ""),
    ].join(":");
  }
  if (id === OBJECTIVE_IDS.CREDITS) {
    return [
      id,
      String(context.sceneId ?? ""),
      Number(Boolean(context.endgameChoiceMade)),
      String(context.endgameEnding ?? ""),
      Number(Boolean(context.endgameCreditsSeen)),
      Number(Boolean(context.ngplusUnlocked)),
    ].join(":");
  }
  return `${OBJECTIVE_IDS.NONE}:${String(context.sceneId ?? "")}`;
}

export function resolveCurrentObjective(context = {}) {
  const chapter5AftershockDone = Boolean(context.chapter5AftershockDone);
  const patrolSetpieceDone = Boolean(context.patrolSetpieceDone);
  const region3SeedUnlocked = Boolean(context.region3SeedUnlocked);
  const enteredRegion3Seed = Boolean(context.enteredRegion3Seed);
  const chapter6ArrivedWindward = Boolean(context.chapter6ArrivedWindward);
  const chapter6RelayActive = Boolean(context.chapter6RelayActive);
  const chapter6RelayDropped = Boolean(context.chapter6RelayDropped);
  const chapter6WaystoneAttuned = Boolean(context.chapter6WaystoneAttuned);
  const chapter7ChoirEngineDefeated = Boolean(context.chapter7ChoirEngineDefeated);
  const convergenceChoice = String(context.chapter7ConvergenceChoice ?? "")
    .trim()
    .toLowerCase();
  const convergenceChoiceResolved = convergenceChoice === "shatter" || convergenceChoice === "tune";
  const chapter8AftermathDone = Boolean(context.chapter8AftermathDone);
  const chapter8RetaliationStarted = Boolean(context.chapter8RetaliationStarted);
  const chapter8MuteSpikesCleared = Boolean(context.chapter8MuteSpikesCleared);
  const chapter8SetpieceActive = Boolean(context.chapter8SetpieceActive);
  const region4SeedUnlocked = Boolean(context.region4SeedUnlocked);
  const region4SeedGateUnlocked = Boolean(context.region4SeedGateUnlocked);
  const region4SeedEntered = Boolean(context.region4SeedEntered);
  const chapter9Started = Boolean(context.chapter9Started);
  const chapter9SetpieceActive = Boolean(context.chapter9SetpieceActive);
  const chapter9AnchorsAttuned = Boolean(context.chapter9AnchorsAttuned);
  const chapter9NullArchivistDefeated = Boolean(context.chapter9NullArchivistDefeated);
  const chapter9Choice = String(context.chapter9Choice ?? "")
    .trim()
    .toLowerCase();
  const chapter9ChoiceMade = chapter9Choice === "seal" || chapter9Choice === "take_key";
  const endgameStarted = Boolean(context.endgameStarted);
  const endgameGoalId = String(context.endgameGoalId ?? "");
  const endgameRouteSeedUnlocked = Boolean(context.endgameRouteSeedUnlocked);
  const endgameAct1Started = Boolean(context.endgameAct1Started);
  const endgameTaskThirdSealObtained = Boolean(context.endgameTaskThirdSealObtained);
  const endgameOuterSpireUnlocked = Boolean(context.endgameOuterSpireUnlocked);
  const endgameOuterSpireBreached = Boolean(context.endgameOuterSpireBreached);
  const endgameGatewardenDefeated = Boolean(context.endgameGatewardenDefeated);
  const endgameSpireEntryUnlocked = Boolean(context.endgameSpireEntryUnlocked);
  const endgameAct2Started = Boolean(context.endgameAct2Started);
  const endgameInnerSpireEntered = Boolean(context.endgameInnerSpireEntered);
  const endgameResonanceLock1 = Boolean(context.endgameResonanceLock1);
  const endgameResonanceLock2 = Boolean(context.endgameResonanceLock2);
  const endgameResonanceLock3 = Boolean(context.endgameResonanceLock3);
  const allResonanceLocksComplete = endgameResonanceLock1 && endgameResonanceLock2 && endgameResonanceLock3;
  const endgameLoomProctorDefeated = Boolean(context.endgameLoomProctorDefeated);
  const endgameAct3Unlocked = Boolean(context.endgameAct3Unlocked);
  const endgameAct3Started = Boolean(context.endgameAct3Started);
  const endgameLastDoorOpened = Boolean(context.endgameLastDoorOpened);
  const endgameLastSpireEntered = Boolean(context.endgameLastSpireEntered);
  const endgameSetpieceRiftCrossed = Boolean(context.endgameSetpieceRiftCrossed);
  const endgameSetpieceCoreReached = Boolean(context.endgameSetpieceCoreReached);
  const endgameFinalBossDefeated = Boolean(context.endgameFinalBossDefeated);
  const endgameChoiceMade = Boolean(context.endgameChoiceMade);
  const endgameEnding = String(context.endgameEnding ?? "")
    .trim()
    .toLowerCase();
  const endgameCreditsSeen = Boolean(context.endgameCreditsSeen);
  const ngplusUnlocked = Boolean(context.ngplusUnlocked);
  const harvesterChoiceResolved = Boolean(context.harvesterChoiceResolved);
  const harvesterBossActive = Boolean(context.harvesterBossActive);
  const harvesterBossDefeated = Boolean(context.harvesterBossDefeated);
  const chapter4RowanReportDone = Boolean(context.chapter4RowanReportDone);
  const harvesterSiteUnlocked = Boolean(context.harvesterSiteUnlocked);
  const sceneId = String(context.sceneId ?? "").toLowerCase();
  const inThornmere = sceneId === "thornmere";
  const chapter2Started = Boolean(context.chapter2Started);
  const chapter2ArrivedEmberfall = Boolean(context.chapter2ArrivedEmberfall);
  const willowMet = Boolean(context.willowMet);
  const willowJoined = Boolean(context.willowJoined);
  const chapter3RowanDebriefDone = Boolean(context.chapter3RowanDebriefDone);
  const listeningSpikeLeadUnlocked = Boolean(context.listeningSpikeLeadUnlocked);
  const listeningSpikeSiteCleared = Boolean(context.listeningSpikeSiteCleared);
  const listeningSpikeChoice = String(context.listeningSpikeChoice ?? "")
    .trim()
    .toLowerCase();
  const listeningSpikeChoiceResolved = listeningSpikeChoice === "crush" || listeningSpikeChoice === "pocket";
  let id = OBJECTIVE_IDS.NONE;
  if (chapter7ChoirEngineDefeated && convergenceChoiceResolved && !chapter8AftermathDone) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_CONVERGENCE;
  } else if (endgameStarted) {
    if (endgameChoiceMade || endgameCreditsSeen || ngplusUnlocked) {
      id = OBJECTIVE_IDS.CREDITS;
    } else if (endgameFinalBossDefeated) {
      id = OBJECTIVE_IDS.CHOOSE_ENDING;
    } else if (endgameSetpieceCoreReached) {
      id = OBJECTIVE_IDS.DEFEAT_FINAL_BOSS;
    } else if (endgameSetpieceRiftCrossed) {
      id = OBJECTIVE_IDS.REACH_CROWN_ENGINE;
    } else if (endgameLastSpireEntered || endgameAct3Started) {
      id = OBJECTIVE_IDS.CROSS_RIFT;
    } else if (endgameLastDoorOpened) {
      id = OBJECTIVE_IDS.OPEN_LAST_DOOR;
    } else if (endgameAct3Unlocked || endgameLoomProctorDefeated) {
      id = OBJECTIVE_IDS.APPROACH_LAST_DOOR;
    } else if (allResonanceLocksComplete && !endgameLoomProctorDefeated) {
      id = OBJECTIVE_IDS.DEFEAT_LOOM_PROCTOR;
    } else if (endgameInnerSpireEntered && !allResonanceLocksComplete) {
      id = OBJECTIVE_IDS.SOLVE_RESONANCE_LOCKS;
    } else if (endgameAct2Started && !endgameInnerSpireEntered) {
      id = OBJECTIVE_IDS.ENTER_INNER_SPIRE;
    } else if (endgameGatewardenDefeated && endgameSpireEntryUnlocked) {
      id = OBJECTIVE_IDS.ENTER_OUTER_SPIRE;
    } else if (endgameOuterSpireBreached && !endgameGatewardenDefeated) {
      id = OBJECTIVE_IDS.DEFEAT_GATEWARDEN;
    } else if (endgameTaskThirdSealObtained && endgameOuterSpireUnlocked && !endgameOuterSpireBreached) {
      id = OBJECTIVE_IDS.BREACH_OUTER_SPIRE;
    } else if (endgameAct1Started && !endgameTaskThirdSealObtained) {
      id = OBJECTIVE_IDS.OBTAIN_THIRD_SEAL;
    } else {
      id = OBJECTIVE_IDS.PREPARE_ENDGAME;
    }
  } else if (chapter9NullArchivistDefeated && !chapter9ChoiceMade) {
    id = OBJECTIVE_IDS.MAKE_VAULT_CHOICE;
  } else if (chapter9AnchorsAttuned && !chapter9NullArchivistDefeated) {
    id = OBJECTIVE_IDS.DEFEAT_NULL_ARCHIVIST;
  } else if (chapter9Started || chapter9SetpieceActive) {
    id = OBJECTIVE_IDS.STABILIZE_WORLDROOTS;
  } else if (
    chapter8MuteSpikesCleared &&
    region4SeedUnlocked &&
    region4SeedEntered &&
    !chapter9Started
  ) {
    id = OBJECTIVE_IDS.REACH_CROWNHEART_VAULT;
  } else if (chapter8AftermathDone && chapter8RetaliationStarted && !chapter8MuteSpikesCleared) {
    id = OBJECTIVE_IDS.STOP_MUTE_SPIKES;
  } else if (chapter8MuteSpikesCleared && !region4SeedEntered) {
    id = OBJECTIVE_IDS.TAKE_NEW_ROUTE;
  } else if (region4SeedEntered) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN_OR_PRESS_ON;
  } else if (!harvesterChoiceResolved && inThornmere && Boolean(context.milestoneMet) && !Boolean(context.rowanCouncilDone)) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN;
  } else if (!harvesterChoiceResolved && chapter2Started && !chapter2ArrivedEmberfall) {
    id = OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL;
  } else if (!harvesterChoiceResolved && chapter2ArrivedEmberfall && !willowMet) {
    id = OBJECTIVE_IDS.FIND_WILLOW;
  } else if (!harvesterChoiceResolved && chapter2ArrivedEmberfall && willowMet && !willowJoined) {
    id = OBJECTIVE_IDS.SURVIVE_AMBUSH;
  } else if (willowJoined && !chapter3RowanDebriefDone) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN;
  } else if (chapter3RowanDebriefDone && listeningSpikeLeadUnlocked && !listeningSpikeSiteCleared) {
    id = OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE;
  } else if (
    chapter3RowanDebriefDone &&
    listeningSpikeLeadUnlocked &&
    listeningSpikeSiteCleared &&
    !listeningSpikeChoiceResolved
  ) {
    id = OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE;
  } else if (listeningSpikeSiteCleared && listeningSpikeChoiceResolved && !chapter4RowanReportDone) {
    id = OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN;
  } else if (chapter4RowanReportDone && harvesterSiteUnlocked && !harvesterBossDefeated) {
    id = harvesterBossActive ? OBJECTIVE_IDS.DEFEAT_HARVESTER_WARDEN : OBJECTIVE_IDS.REACH_HARVESTER_SITE;
  } else if (harvesterBossDefeated && !harvesterChoiceResolved) {
    id = OBJECTIVE_IDS.DEFEAT_HARVESTER_WARDEN;
  } else if (harvesterBossDefeated && harvesterChoiceResolved && !chapter5AftershockDone) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN_AFTER_HARVESTER;
  } else if (chapter5AftershockDone && !patrolSetpieceDone) {
    id = OBJECTIVE_IDS.CLEAR_RIDGE_PATROL;
  } else if (chapter6WaystoneAttuned) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN_WITH_WAYSTONE_NEWS;
  } else if (chapter6RelayDropped) {
    id = OBJECTIVE_IDS.ATTUNE_WAYSTONE;
  } else if (chapter6RelayActive) {
    id = OBJECTIVE_IDS.DROP_RELAY;
  } else if (chapter6ArrivedWindward || enteredRegion3Seed || sceneId === "windward" || sceneId === "region3_seed") {
    id = OBJECTIVE_IDS.FIND_WAYSTONE_CIRCLE;
  } else if (chapter5AftershockDone && patrolSetpieceDone && region3SeedUnlocked) {
    id = OBJECTIVE_IDS.CROSS_RIDGE_GATE;
  } else if (region4SeedUnlocked || region4SeedGateUnlocked || sceneId === "region4_seed") {
    id = OBJECTIVE_IDS.TAKE_NEW_ROUTE;
  } else if (enteredRegion3Seed || sceneId === "region3_seed") {
    id = OBJECTIVE_IDS.REGION3_FIRST_STEPS;
  } else if (!harvesterChoiceResolved && willowJoined) {
    id = OBJECTIVE_IDS.RETURN_TO_ROWAN;
  } else if (
    !harvesterChoiceResolved &&
    inThornmere &&
    Boolean(context.emberfallLeadUnlocked) &&
    !willowJoined
  ) {
    id = OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL;
  }
  return {
    id,
    hudLine: OBJECTIVE_DEFINITIONS[id]?.hudLine ?? "",
    progressKey: buildProgressKey(id, context),
    hint: getObjectiveHint(id),
  };
}
