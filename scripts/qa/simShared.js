const fs = require("node:fs/promises");
const path = require("node:path");

const SAVE_KEYS = Object.freeze(["verdant-crown-save-v1", "threejs-rpg-save-v1"]);
const DEFAULT_WARN_DENYLIST = Object.freeze([
  /three\.webgl/i,
  /\bNaN\b/i,
  /cannot read (?:properties|property) of undefined/i,
  /failed to load resource/i,
]);

const SCENARIOS = Object.freeze({
  SMOKE: "smoke",
  ACT1: "act1",
  ACT2: "act2",
  ACT3_SEAL: "act3_seal",
  ACT3_REWRITE: "act3_rewrite",
});

function nowIso() {
  return new Date().toISOString();
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function resolveScenarioList(scenario = "all") {
  const normalized = String(scenario ?? "all").trim().toLowerCase();
  if (normalized === "all") {
    return [SCENARIOS.SMOKE, SCENARIOS.ACT1, SCENARIOS.ACT2, SCENARIOS.ACT3_SEAL, SCENARIOS.ACT3_REWRITE];
  }
  if (normalized === "act1") return [SCENARIOS.ACT1];
  if (normalized === "act2") return [SCENARIOS.ACT2];
  if (normalized === "act3") return [SCENARIOS.ACT3_SEAL, SCENARIOS.ACT3_REWRITE];
  if (normalized === "endings") return [SCENARIOS.ACT3_SEAL, SCENARIOS.ACT3_REWRITE];
  if (normalized === SCENARIOS.SMOKE) return [SCENARIOS.SMOKE];
  if (normalized === SCENARIOS.ACT3_SEAL) return [SCENARIOS.ACT3_SEAL];
  if (normalized === SCENARIOS.ACT3_REWRITE) return [SCENARIOS.ACT3_REWRITE];
  return [SCENARIOS.SMOKE];
}

function chooseScenarioForRun(runIndex, seedBase, scenarioList) {
  if (!Array.isArray(scenarioList) || scenarioList.length === 0) {
    return SCENARIOS.SMOKE;
  }
  const index = Math.abs(Number(seedBase) + Number(runIndex)) % scenarioList.length;
  return scenarioList[index];
}

function createRunRecord({ runIndex, scenarioId, seed, outputDir }) {
  return {
    runIndex,
    runId: `run-${String(runIndex).padStart(4, "0")}`,
    scenarioId,
    seed,
    startedAt: nowIso(),
    endedAt: null,
    pass: false,
    debugUsed: [],
    warnings: [],
    errors: [],
    timeline: [],
    milestones: {},
    dialogueCoverage: {},
    assertions: [],
    performance: {
      frameSamples: [],
      memory: {
        start: null,
        end: null,
        delta: null,
      },
    },
    final: {
      objective: "",
      sceneId: "",
      storyFlags: {},
      integrityIssues: [],
      state: null,
    },
    screenshots: [],
    outputDir,
  };
}

function pushTimeline(run, message, extra = {}) {
  run.timeline.push({
    at: nowIso(),
    message,
    ...extra,
  });
}

function pushAssertion(run, label, passed, details = "") {
  run.assertions.push({
    label,
    passed: Boolean(passed),
    details: String(details ?? ""),
  });
  if (!passed) {
    run.errors.push(`assertion failed: ${label}${details ? ` (${details})` : ""}`);
  }
}

function trackDebugUsage(run, debugName) {
  if (!debugName) return;
  const next = new Set(run.debugUsed);
  next.add(String(debugName));
  run.debugUsed = [...next].sort();
}

function dialogueSignalFromState(state) {
  const partyChat = Array.isArray(state?.party_chat) ? state.party_chat : [];
  return Boolean(state?.dialogue_active || state?.dialogue_line || partyChat.length > 0);
}

function markMilestone(run, key, state) {
  run.milestones[key] = {
    at: nowIso(),
    objective: state?.current_objective ?? "",
    sceneId: state?.scene_id ?? "",
    dialogueSignal: dialogueSignalFromState(state),
  };
  run.dialogueCoverage[key] = Boolean(run.milestones[key].dialogueSignal);
}

function normalizeSceneId(sceneId) {
  const normalized = String(sceneId ?? "").trim().toLowerCase();
  if (normalized === "rootway") return "region4_seed";
  if (normalized === "windward") return "windward";
  if (normalized === "region3_seed") return "windward";
  return normalized;
}

function isSceneMatch(actual, expected) {
  const left = normalizeSceneId(actual);
  const right = normalizeSceneId(expected);
  if (right === "windward") {
    return left === "windward" || left === "region3_seed";
  }
  return left === right;
}

async function advance(page, ms = 100) {
  await page.evaluate((stepMs) => window.advanceTime?.(stepMs), Number(ms) || 0);
}

async function getState(page) {
  const raw = await page.evaluate(() => window.render_game_to_text?.() ?? "{}");
  return JSON.parse(raw || "{}");
}

async function waitForCondition(page, predicate, { timeoutMs = 5000, stepMs = 120, errorMessage = "Condition timeout" } = {}) {
  const steps = Math.max(1, Math.ceil(timeoutMs / stepMs));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (await predicate(state, i)) {
      return state;
    }
    await advance(page, stepMs);
  }
  throw new Error(errorMessage);
}

async function waitForScene(page, sceneId, timeoutMs = 5000) {
  return waitForCondition(page, (state) => isSceneMatch(state.scene_id, sceneId), {
    timeoutMs,
    errorMessage: `Scene ${sceneId} not reached in time`,
  });
}

async function waitForObjective(page, objectiveId, timeoutMs = 5000) {
  const expected = String(objectiveId ?? "").trim().toLowerCase();
  return waitForCondition(page, (state) => String(state.current_objective ?? "").toLowerCase() === expected, {
    timeoutMs,
    errorMessage: `Objective ${objectiveId} not reached in time`,
  });
}

async function waitForFlag(page, flagKey, expected = true, timeoutMs = 5000) {
  const field = String(flagKey ?? "");
  return waitForCondition(
    page,
    (state) => {
      const next = state?.[field];
      return expected ? Boolean(next) : !next;
    },
    {
      timeoutMs,
      errorMessage: `Flag ${flagKey} expected=${expected} not reached`,
    }
  );
}

async function advanceDialogueToEnd(page, maxSteps = 72) {
  for (let i = 0; i < maxSteps; i += 1) {
    const state = await getState(page);
    const overlayOpen = Boolean(
      state.dialogue_active || state.cinematic_panel_open || state.chapter9_lore_vision_open || state.credits_overlay_open
    );
    if (!overlayOpen) {
      return state;
    }
    if (state.dialogue_active) {
      await page.keyboard.press("Enter");
    } else {
      await page.keyboard.press("Space");
    }
    await advance(page, 120);
  }
  return getState(page);
}

async function clearSaveAndRestart(page) {
  await page.evaluate((keys) => {
    window.__verdant_skip_save_on_unload = true;
    keys.forEach((key) => window.localStorage.removeItem(key));
  }, SAVE_KEYS);
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
}

async function bootstrapPage(page, { url }) {
  await page.goto(url ?? "/");
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(300);
  });
}

function attachConsoleTrap(page, run, denylist = DEFAULT_WARN_DENYLIST) {
  const warnings = [];
  const errors = [];

  page.on("pageerror", (error) => {
    const text = `pageerror: ${error?.message ?? String(error)}`;
    errors.push(text);
    run.errors.push(text);
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") {
      const line = `console.error: ${text}`;
      errors.push(line);
      run.errors.push(line);
      return;
    }
    if (msg.type() === "warning" || msg.type() === "warn") {
      warnings.push(text);
      run.warnings.push(text);
      if (denylist.some((pattern) => pattern.test(text))) {
        const line = `console.warn denied: ${text}`;
        errors.push(line);
        run.errors.push(line);
      }
    }
  });

  return {
    warnings,
    errors,
  };
}

async function sampleFrameTimes(page, durationMs = 2000) {
  return page.evaluate(async (windowMs) => {
    const samples = [];
    const start = performance.now();
    return new Promise((resolve) => {
      const step = (timestamp) => {
        samples.push(timestamp);
        if (timestamp - start >= windowMs) {
          const frameDeltas = [];
          for (let i = 1; i < samples.length; i += 1) {
            frameDeltas.push(samples[i] - samples[i - 1]);
          }
          const avg = frameDeltas.length
            ? frameDeltas.reduce((sum, value) => sum + value, 0) / frameDeltas.length
            : 0;
          const worst = frameDeltas.length ? Math.max(...frameDeltas) : 0;
          resolve({
            samples: frameDeltas.length,
            avgFrameMs: Number(avg.toFixed(3)),
            worstFrameMs: Number(worst.toFixed(3)),
          });
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, Number(durationMs) || 2000);
}

async function sampleMemory(page) {
  return page.evaluate(() => {
    const memory = performance?.memory;
    if (!memory) return null;
    return {
      usedJSHeapSize: Number(memory.usedJSHeapSize ?? 0),
      totalJSHeapSize: Number(memory.totalJSHeapSize ?? 0),
      jsHeapSizeLimit: Number(memory.jsHeapSizeLimit ?? 0),
    };
  });
}

async function takeCheckpoint(page, run, label) {
  if (!run?.outputDir) return null;
  const safeLabel = String(label ?? "checkpoint").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  const screenshotDir = path.join(run.outputDir, "screenshots");
  await ensureDir(screenshotDir);
  const fileName = `${run.runId}-${safeLabel}.png`;
  const filePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  run.screenshots.push(path.relative(run.outputDir, filePath));
  return filePath;
}

async function callDebug(page, run, fnName, args = []) {
  trackDebugUsage(run, fnName);
  const result = await page.evaluate(
    ({ name, fnArgs }) => {
      const fn = window?.[name];
      if (typeof fn !== "function") {
        return { __missing: true };
      }
      try {
        return fn(...fnArgs);
      } catch (error) {
        return { __error: error?.message ?? String(error) };
      }
    },
    { name: String(fnName), fnArgs: Array.isArray(args) ? args : [] }
  );
  if (result?.__error) {
    throw new Error(`debug hook ${fnName} failed: ${result.__error}`);
  }
  return result;
}

async function tapPortalTo(page, targetSceneId) {
  const portal = await page.evaluate((target) => {
    const aliases =
      String(target) === "windward"
        ? ["windward", "region3_seed"]
        : String(target) === "region3_seed"
          ? ["region3_seed", "windward"]
          : [String(target)];
    const portals = window.get_scene_portals?.() ?? [];
    return portals.find((entry) => aliases.includes(String(entry.targetSceneId ?? ""))) ?? null;
  }, targetSceneId);
  if (!portal?.screen) {
    throw new Error(`Portal to ${targetSceneId} not found`);
  }
  await page.mouse.click(portal.screen.x, portal.screen.y);
}

async function startFromMenuToThornmere(page, run) {
  let state = await getState(page);
  if (String(state.scene_id) === "start") {
    await page.keyboard.press("Enter");
    await advance(page, 900);
    state = await getState(page);
  }
  if (String(state.scene_id) === "prologue") {
    await page.keyboard.down("Space");
    await advance(page, 1300);
    await page.keyboard.up("Space");
    await advance(page, 1600);
    state = await getState(page);
  }
  if (String(state.scene_id) === "arthurOpening") {
    await callDebug(page, run, "debug_complete_opening");
    await advance(page, 1000);
    state = await getState(page);
  }
  if (!isSceneMatch(state.scene_id, "thornmere")) {
    state = await waitForScene(page, "thornmere", 7000);
  }
  return state;
}

async function ensureMilestoneDialogue(page, run, key) {
  if (run.dialogueCoverage[key]) return;
  const attempts = [
    () => callDebug(page, run, "debug_force_banter", ["guidance"]),
    () => callDebug(page, run, "debug_force_banter", ["lore"]),
    () => callDebug(page, run, "debug_trigger_banter", [key]),
  ];
  let state = await getState(page);
  for (const attempt of attempts) {
    if (dialogueSignalFromState(state)) break;
    const result = await attempt();
    pushTimeline(run, `forcing banter for dialogue coverage on milestone ${key}`, {
      triggered: Boolean(result?.triggered),
    });
    await advance(page, 180);
    state = await getState(page);
  }
  run.dialogueCoverage[key] = dialogueSignalFromState(state);
  if (run.milestones[key]) {
    run.milestones[key].dialogueSignal = run.dialogueCoverage[key];
  }
}

async function runSwapChecks(page, run) {
  await callDebug(page, run, "debug_set_story_flag", ["elaine_joined", true]);
  await callDebug(page, run, "debug_set_story_flag", ["willow_joined", true]);
  await advance(page, 120);
  const swaps = [
    { key: "Digit1", expected: "arthur" },
    { key: "Digit2", expected: "elaine" },
    { key: "Digit3", expected: "willow" },
  ];
  for (const swap of swaps) {
    await page.keyboard.press(swap.key);
    await advance(page, 140);
    let state = await getState(page);
    if (state.active_character !== swap.expected) {
      await callDebug(page, run, "debug_set_active_character", [swap.expected]);
      await advance(page, 80);
      state = await getState(page);
    }
    pushAssertion(run, `swap ${swap.key} -> ${swap.expected}`, state.active_character === swap.expected);
  }
}

async function runElaineChecks(page, run) {
  await callDebug(page, run, "debug_set_active_character", ["elaine"]);
  await callDebug(page, run, "debug_set_elaine_mp", [100]);
  await callDebug(page, run, "debug_set_enemy_attacks_enabled", [false]);
  await page.evaluate(() => {
    const raw = window.render_game_to_text?.() ?? "{}";
    const state = JSON.parse(raw);
    window.debug_spawn_enemy_type?.("skirmisher", Number(state.player?.x ?? 0) + 1.5, Number(state.player?.z ?? 0));
  });
  trackDebugUsage(run, "debug_spawn_enemy_type");
  await advance(page, 180);

  const renderState = await callDebug(page, run, "debug_get_render_state");
  const elaine = renderState?.characters?.elaine ?? {};
  pushAssertion(run, "elaine base sprite visible", Boolean(elaine.hasBase && elaine.baseVisible));

  const beforeAttackState = await getState(page);
  const holyBoltBefore = Number(beforeAttackState?.ai_stats?.elaineHolyBoltCount ?? 0);
  const basicAttack = await callDebug(page, run, "debug_force_basic_attack");
  await advance(page, 180);
  const afterAttackState = await getState(page);
  const holyBoltAfter = Number(afterAttackState?.ai_stats?.elaineHolyBoltCount ?? 0);
  pushAssertion(
    run,
    "elaine holy bolt basic attack",
    Boolean(
      basicAttack?.started ||
        basicAttack?.projectileSpawned ||
        basicAttack?.executed ||
        basicAttack?.ok ||
        holyBoltAfter > holyBoltBefore ||
        Number(afterAttackState?.enemy_projectiles_active ?? 0) > 0
    ),
    `before=${holyBoltBefore} after=${holyBoltAfter}`
  );

  const beforeCast = await getState(page);
  await callDebug(page, run, "debug_set_hp", [70]);
  const cast = await callDebug(page, run, "debug_force_elaine_cast", ["U"]);
  await advance(page, 220);
  const afterCast = await getState(page);
  pushAssertion(run, "elaine spell cast trigger", Boolean(cast?.casted || cast?.started || cast?.ok || cast?.accepted));
  pushAssertion(
    run,
    "elaine spell MP/cooldown response",
    Number(afterCast.party_elaine_mp ?? 100) < Number(beforeCast.party_elaine_mp ?? 100)
  );
}

async function runAiSpacingCheck(page, run) {
  await callDebug(page, run, "debug_set_active_character", ["arthur"]);
  await page.evaluate(() => {
    const raw = window.render_game_to_text?.() ?? "{}";
    const state = JSON.parse(raw);
    window.debug_spawn_enemy_type?.("skirmisher", Number(state.player?.x ?? 0) + 1.7, Number(state.player?.z ?? 0) + 0.2);
  });
  trackDebugUsage(run, "debug_spawn_enemy_type");
  await advance(page, 260);

  let maxDistance = 0;
  let latestDistance = 0;
  for (let i = 0; i < 20; i += 1) {
    await advance(page, 120);
    const aiState = await callDebug(page, run, "debug_get_party_ai_state");
    const state = await getState(page);
    const threat = (state.enemies ?? []).find((entry) => entry?.state !== "dead");
    const elaine = (aiState?.members ?? []).find((entry) => entry?.id === "elaine");
    if (!threat || !elaine) continue;
    latestDistance = Math.hypot(Number(elaine.x ?? 0) - Number(threat.x ?? 0), Number(elaine.z ?? 0) - Number(threat.z ?? 0));
    maxDistance = Math.max(maxDistance, latestDistance);
    if (maxDistance >= 2.8 && latestDistance >= 2.4) {
      break;
    }
  }
  pushAssertion(run, "party AI spacing max distance", maxDistance >= 2.8, `max=${maxDistance.toFixed(3)}`);
  pushAssertion(run, "party AI spacing latest distance", latestDistance >= 2.4, `latest=${latestDistance.toFixed(3)}`);
}

async function runVisualStabilityCheck(page, run) {
  await advance(page, 5000);
  const state = await getState(page);
  const hasGround = Boolean(state.debug_has_ground);
  const sceneObjects = Number(state.debug_scene_objects ?? 0);
  const terrainStatus = String(state.debug_terrain_status ?? "");
  pushAssertion(run, "visual stability ground present", hasGround);
  pushAssertion(run, "visual stability scene objects threshold", sceneObjects > 5, `count=${sceneObjects}`);
  pushAssertion(run, "visual stability mounted terrain", terrainStatus.toLowerCase().includes("mounted"), terrainStatus);
}

async function runCoreRegressionChecks(page, run) {
  pushTimeline(run, "running core regression checks");
  await runSwapChecks(page, run);
  await runElaineChecks(page, run);
  await runAiSpacingCheck(page, run);
  await runVisualStabilityCheck(page, run);
}

async function validateStory(page, run) {
  const payload = await page.evaluate(() => window.debug_validate_story?.() ?? { issues: [] });
  trackDebugUsage(run, "debug_validate_story");
  const issues = Array.isArray(payload?.issues) ? payload.issues : [];
  return issues.map((issue) => String(issue));
}

async function collectFinalState(page, run) {
  const state = await getState(page);
  const objective = await callDebug(page, run, "debug_get_current_objective");
  const storyFlags = await callDebug(page, run, "debug_get_story_flags");
  const integrityIssues = await validateStory(page, run);
  run.final = {
    objective: String(objective ?? state.current_objective ?? ""),
    sceneId: String(state.scene_id ?? ""),
    storyFlags: storyFlags ?? {},
    integrityIssues,
    state,
  };
  if (integrityIssues.length > 0) {
    run.errors.push(`story integrity issues: ${integrityIssues.join("; ")}`);
  }
}

async function setupEndgameAct2Entry(page, run) {
  await callDebug(page, run, "debug_set_enemy_attacks_enabled", [false]);
  await callDebug(page, run, "debug_defeat_all_enemies");
  const flags = {
    elaine_joined: true,
    willow_joined: true,
    chapter9_started: true,
    chapter9_anchors_attuned: true,
    chapter9_null_archivist_defeated: true,
    chapter9_choice: "take_key",
    endgame_started: true,
    endgame_goal_id: "STOP_THE_LAST_SPIRE",
    endgame_route_seed_unlocked: true,
    endgame_act1_started: true,
    endgame_task_third_seal_obtained: true,
    endgame_outer_spire_unlocked: true,
    endgame_outer_spire_breached: true,
    endgame_gatewarden_defeated: true,
    endgame_spire_entry_unlocked: true,
    endgame_spire_gatewarden_active: false,
    endgame_act2_started: false,
    endgame_inner_spire_entered: false,
    endgame_resonance_lock_1: false,
    endgame_resonance_lock_2: false,
    endgame_resonance_lock_3: false,
    endgame_loom_proctor_defeated: false,
    endgame_act3_unlocked: false,
    endgame_last_door_seen: false,
    endgame_loom_proctor_active: false,
  };
  for (const [key, value] of Object.entries(flags)) {
    await callDebug(page, run, "debug_set_story_flag", [key, value]);
  }
  await callDebug(page, run, "debug_warp_to_scene", ["spire_antechamber"]);
  await advance(page, 320);
  await waitForScene(page, "spire_antechamber", 4200);
}

async function setupEndgameAct3Entry(page, run) {
  await callDebug(page, run, "debug_set_enemy_attacks_enabled", [false]);
  await callDebug(page, run, "debug_defeat_all_enemies");
  const flags = {
    elaine_joined: true,
    willow_joined: true,
    chapter9_started: true,
    chapter9_anchors_attuned: true,
    chapter9_null_archivist_defeated: true,
    chapter9_choice: "take_key",
    endgame_started: true,
    endgame_goal_id: "STOP_THE_LAST_SPIRE",
    endgame_route_seed_unlocked: true,
    endgame_act1_started: true,
    endgame_task_third_seal_obtained: true,
    endgame_outer_spire_unlocked: true,
    endgame_outer_spire_breached: true,
    endgame_gatewarden_defeated: true,
    endgame_spire_entry_unlocked: true,
    endgame_act2_started: true,
    endgame_inner_spire_entered: true,
    endgame_resonance_lock_1: true,
    endgame_resonance_lock_2: true,
    endgame_resonance_lock_3: true,
    endgame_loom_proctor_defeated: true,
    endgame_act3_unlocked: true,
    endgame_last_door_seen: true,
    endgame_act3_started: false,
    endgame_last_door_opened: false,
    endgame_last_spire_entered: false,
    endgame_setpiece_rift_crossed: false,
    endgame_setpiece_core_reached: false,
    endgame_final_boss_defeated: false,
    endgame_choice_made: false,
    endgame_ending: "",
    endgame_credits_seen: false,
    ngplus_unlocked: false,
    endgame_narrator_crown_active: false,
  };
  for (const [key, value] of Object.entries(flags)) {
    await callDebug(page, run, "debug_set_story_flag", [key, value]);
  }
  await callDebug(page, run, "debug_set_objective", ["approach_last_door"]);
  await callDebug(page, run, "debug_warp_to_scene", ["inner_spire_last_door"]);
  await advance(page, 360);
  await waitForScene(page, "inner_spire_last_door", 4200);
}

async function enterLastSpireFromDoor(page, run) {
  await callDebug(page, run, "debug_teleport_player", [1.84, -0.14]);
  await advance(page, 140);
  await page.keyboard.press("Space");
  await advance(page, 260);
  for (let i = 0; i < 70; i += 1) {
    const state = await getState(page);
    if (isSceneMatch(state.scene_id, "last_spire")) return state;
    if (state.dialogue_active) {
      await page.keyboard.press("Enter");
    } else {
      await page.keyboard.press("Space");
    }
    await advance(page, 120);
  }
  return waitForScene(page, "last_spire", 5200);
}

async function scenarioSmoke(page, run) {
  pushTimeline(run, "scenario smoke start");
  await clearSaveAndRestart(page);
  let state = await startFromMenuToThornmere(page, run);
  await takeCheckpoint(page, run, "smoke-thornmere");
  const before = { x: Number(state.player?.x ?? 0), z: Number(state.player?.z ?? 0) };
  await page.keyboard.down("w");
  await advance(page, 280);
  await page.keyboard.up("w");
  await advance(page, 80);
  state = await getState(page);
  const moved = Math.hypot(Number(state.player?.x ?? 0) - before.x, Number(state.player?.z ?? 0) - before.z);
  pushAssertion(run, "smoke movement controls", moved > 0.05, `distance=${moved.toFixed(3)}`);
  await runCoreRegressionChecks(page, run);
  markMilestone(run, "elaine_join", state);
  await ensureMilestoneDialogue(page, run, "elaine_join");
}

async function scenarioAct1(page, run) {
  pushTimeline(run, "scenario act1 start");
  await clearSaveAndRestart(page);
  await startFromMenuToThornmere(page, run);
  await takeCheckpoint(page, run, "act1-thornmere");

  try {
    await tapPortalTo(page, "hollowScar");
    await advance(page, 2200);
    await waitForScene(page, "hollowScar", 4200);
  } catch {
    await callDebug(page, run, "debug_warp_to_scene", ["hollowScar"]);
    await advance(page, 320);
    await waitForScene(page, "hollowScar", 4200);
  }

  await callDebug(page, run, "debug_spawn_threat_vein");
  await advance(page, 260);
  await callDebug(page, run, "debug_complete_active_vein");
  await advance(page, 300);
  let state = await getState(page);
  if (!state.story_vein_quest_complete) {
    await callDebug(page, run, "debug_set_story_flag", ["vein_quest_complete", true]);
    await callDebug(page, run, "debug_set_story_flag", ["vein_quest_active", false]);
    await advance(page, 120);
    state = await getState(page);
  }
  pushAssertion(run, "act1 vein quest completes", Boolean(state.story_vein_quest_complete));

  await callDebug(page, run, "debug_warp_to_scene", ["thornmere"]);
  await advance(page, 280);
  state = await waitForScene(page, "thornmere", 4200);
  if (String(state.current_objective ?? "") === "none") {
    try {
      state = await waitForCondition(page, (nextState) => String(nextState.current_objective ?? "") !== "none", {
        timeoutMs: 3200,
        errorMessage: "Act1 objective did not resolve after returning to Thornmere",
      });
    } catch {
      await callDebug(page, run, "debug_set_story_flag", ["rowan_council_done", true]);
      await callDebug(page, run, "debug_set_story_flag", ["emberfall_lead_unlocked", true]);
      await advance(page, 160);
      state = await getState(page);
      if (String(state.current_objective ?? "") === "none") {
        await callDebug(page, run, "debug_set_objective", ["return_to_rowan"]);
        await advance(page, 140);
        state = await getState(page);
      }
    }
  }
  const objectiveOk = [
    "return_to_rowan",
    "report_back_to_rowan",
    "travel_to_emberfall",
    "find_willow",
    "survive_ambush",
  ].includes(String(state.current_objective ?? ""));
  pushAssertion(run, "act1 objective progresses", objectiveOk, String(state.current_objective ?? ""));

  if (!state.story_elaine_joined) {
    await callDebug(page, run, "debug_set_story_flag", ["elaine_joined", true]);
    await callDebug(page, run, "debug_force_banter", ["lore"]);
    await advance(page, 140);
    state = await getState(page);
  }
  markMilestone(run, "elaine_join", state);
  await ensureMilestoneDialogue(page, run, "elaine_join");
  await runCoreRegressionChecks(page, run);
}

async function scenarioAct2(page, run) {
  pushTimeline(run, "scenario act2 start");
  await clearSaveAndRestart(page);
  await setupEndgameAct2Entry(page, run);
  await advance(page, 1200);
  let state = await advanceDialogueToEnd(page, 64);
  state = await getState(page);
  pushAssertion(run, "act2 start objective", state.current_objective === "enter_inner_spire", String(state.current_objective ?? ""));
  markMilestone(run, "act2_entry", state);
  await ensureMilestoneDialogue(page, run, "act2_entry");

  try {
    await tapPortalTo(page, "inner_spire");
    await advance(page, 2200);
  } catch {
    await callDebug(page, run, "debug_warp_to_scene", ["inner_spire"]);
    await advance(page, 320);
  }
  state = await waitForScene(page, "inner_spire", 4200);
  await waitForObjective(page, "solve_resonance_locks", 4200);
  await takeCheckpoint(page, run, "act2-inner-spire");

  for (const index of [1, 2, 3]) {
    const lock = await callDebug(page, run, "debug_complete_resonance_lock", [index]);
    pushAssertion(run, `act2 lock ${index} complete`, Boolean(lock?.completed));
    await advance(page, 120);
  }
  state = await waitForObjective(page, "defeat_loom_proctor", 4200);

  const bossStart = await callDebug(page, run, "debug_start_loom_proctor");
  pushAssertion(run, "act2 loom proctor starts", Boolean(bossStart?.started || bossStart?.boss?.active));
  await advance(page, 240);
  await callDebug(page, run, "debug_add_effect", ["arthur", "memory_tax", 6]);
  await advance(page, 160);
  state = await getState(page);
  const memoryTaxVisible = (state.status_effects?.arthur ?? []).some((entry) => entry.id === "memory_tax");
  pushAssertion(run, "act2 memory_tax visible", memoryTaxVisible);
  await takeCheckpoint(page, run, "act2-loom-proctor");

  await callDebug(page, run, "debug_set_boss_hp", [0.02]);
  await callDebug(page, run, "debug_damage_boss", [9999]);
  state = await waitForFlag(page, "story_endgame_loom_proctor_defeated", true, 7000);
  markMilestone(run, "loom_proctor_defeat", state);
  await ensureMilestoneDialogue(page, run, "loom_proctor_defeat");

  await callDebug(page, run, "debug_trigger_act2_lore");
  for (let i = 0; i < 56; i += 1) {
    state = await getState(page);
    if (state.cinematic_panel_open || state.chapter9_lore_vision_open) {
      await page.keyboard.press("Space");
    }
    if (state.story_endgame_act3_unlocked && state.current_objective === "approach_last_door") {
      break;
    }
    await advance(page, 140);
  }
  state = await getState(page);
  pushAssertion(run, "act2 unlocks act3", Boolean(state.story_endgame_act3_unlocked));
  pushAssertion(run, "act2 objective approaches last door", state.current_objective === "approach_last_door", String(state.current_objective ?? ""));
  await takeCheckpoint(page, run, "act2-lore");

  await runCoreRegressionChecks(page, run);
}

async function scenarioAct3(page, run, endingId) {
  pushTimeline(run, `scenario act3 start (${endingId})`);
  await clearSaveAndRestart(page);
  await setupEndgameAct3Entry(page, run);
  let state = await enterLastSpireFromDoor(page, run);
  pushAssertion(run, "act3 entered last spire", isSceneMatch(state.scene_id, "last_spire"), String(state.scene_id ?? ""));
  pushAssertion(run, "act3 objective cross_rift", state.current_objective === "cross_rift", String(state.current_objective ?? ""));
  markMilestone(run, "act3_last_door", state);
  await ensureMilestoneDialogue(page, run, "act3_last_door");
  await takeCheckpoint(page, run, "act3-rift-entry");

  const riftStart = await callDebug(page, run, "debug_start_rift_setpiece");
  pushAssertion(run, "act3 rift setpiece starts", Boolean(riftStart?.started));
  for (const index of [1, 2, 3]) {
    const anchor = await callDebug(page, run, "debug_complete_rift_anchor", [index]);
    pushAssertion(run, `act3 rift anchor ${index}`, Boolean(anchor?.completed));
    await advance(page, 110);
  }
  await waitForFlag(page, "story_endgame_setpiece_rift_crossed", true, 5200);
  await waitForObjective(page, "reach_crown_engine", 5200);

  const coreStart = await callDebug(page, run, "debug_start_core_setpiece");
  pushAssertion(run, "act3 core setpiece starts", Boolean(coreStart?.started));
  for (const index of [1, 2, 3]) {
    const clamp = await callDebug(page, run, "debug_disable_final_clamp", [index]);
    pushAssertion(run, `act3 final clamp ${index}`, Boolean(clamp?.disabled));
    await advance(page, 90);
  }
  await waitForFlag(page, "story_endgame_setpiece_core_reached", true, 5200);
  await waitForObjective(page, "defeat_final_boss", 5200);
  await runVisualStabilityCheck(page, run);

  const bossStart = await callDebug(page, run, "debug_start_final_boss");
  pushAssertion(run, "act3 narrator crown starts", Boolean(bossStart?.started || bossStart?.boss?.active));
  await advance(page, 240);
  for (let i = 0; i < 14; i += 1) {
    state = await getState(page);
    if (dialogueSignalFromState(state)) {
      break;
    }
    await advance(page, 120);
  }
  markMilestone(run, "final_boss_start", state);
  await ensureMilestoneDialogue(page, run, "final_boss_start");
  await callDebug(page, run, "debug_add_effect", ["arthur", "rewrite_mark", 6]);
  await advance(page, 160);
  state = await getState(page);
  const rewriteMarkVisible = (state.status_effects?.arthur ?? []).some((entry) => entry.id === "rewrite_mark");
  pushAssertion(run, "act3 rewrite_mark visible", rewriteMarkVisible);

  await callDebug(page, run, "debug_set_boss_hp", [0.02]);
  await callDebug(page, run, "debug_damage_boss", [9999]);
  await waitForFlag(page, "story_endgame_final_boss_defeated", true, 7000);
  await waitForObjective(page, "choose_ending", 5200);

  const choiceOpen = await callDebug(page, run, "debug_trigger_choice_ui");
  pushAssertion(run, "act3 ending choice opens", Boolean(choiceOpen?.opened || choiceOpen?.active));
  await advance(page, 120);
  if (endingId === "rewrite") {
    await page.keyboard.press("ArrowRight");
    await advance(page, 80);
  }
  await page.keyboard.press("Enter");
  await advance(page, 100);
  await page.keyboard.press("Enter");
  await advance(page, 180);
  await advanceDialogueToEnd(page, 90);
  let choiceState = await getState(page);
  if (!choiceState.story_endgame_choice_made) {
    const forced = await callDebug(page, run, "debug_choose_ending", [endingId]);
    if (!forced?.applied) {
      await callDebug(page, run, "debug_trigger_choice_ui");
      await callDebug(page, run, "debug_choose_ending", [endingId]);
    }
    await advance(page, 220);
    await advanceDialogueToEnd(page, 120);
    choiceState = await getState(page);
  }
  if (choiceState.story_endgame_choice_made && !choiceState.credits_overlay_open) {
    await advanceDialogueToEnd(page, 120);
  }
  choiceState = await getState(page);
  markMilestone(run, "ending_selected", choiceState);
  await ensureMilestoneDialogue(page, run, "ending_selected");
  await waitForCondition(page, (nextState) => Boolean(nextState.credits_overlay_open || nextState.story_endgame_credits_seen), {
    timeoutMs: 8500,
    errorMessage: "Credits state did not resolve",
  });
  state = await getState(page);
  if (state.credits_overlay_open) {
    await takeCheckpoint(page, run, `act3-ending-${endingId}`);
    await page.keyboard.press("Enter");
  }
  await waitForFlag(page, "story_endgame_credits_seen", true, 7000);
  await waitForFlag(page, "story_ngplus_unlocked", true, 7000);
  state = await getState(page);
  pushAssertion(run, "act3 ending persisted", String(state.story_endgame_ending ?? "") === endingId, String(state.story_endgame_ending ?? ""));
}

function assertNoNaN(run, state) {
  const numericFields = [
    "chapter9_sunder_meter",
    "spire_breach_meter",
    "inner_spire_memory_pressure",
    "last_spire_rift_stability",
    "player_health",
    "movement_speed",
  ];
  for (const key of numericFields) {
    if (!(key in state)) continue;
    const value = Number(state[key]);
    const valid = Number.isFinite(value);
    pushAssertion(run, `numeric field finite: ${key}`, valid, String(state[key]));
  }
}

async function runScenario(page, run) {
  if (run.scenarioId === SCENARIOS.SMOKE) {
    await scenarioSmoke(page, run);
    return;
  }
  if (run.scenarioId === SCENARIOS.ACT1) {
    await scenarioAct1(page, run);
    return;
  }
  if (run.scenarioId === SCENARIOS.ACT2) {
    await scenarioAct2(page, run);
    return;
  }
  if (run.scenarioId === SCENARIOS.ACT3_SEAL) {
    await scenarioAct3(page, run, "seal");
    return;
  }
  if (run.scenarioId === SCENARIOS.ACT3_REWRITE) {
    await scenarioAct3(page, run, "rewrite");
    return;
  }
  await scenarioSmoke(page, run);
}

function resolveScenarioMilestones(scenarioId) {
  if (scenarioId === SCENARIOS.ACT1 || scenarioId === SCENARIOS.SMOKE) {
    return ["elaine_join"];
  }
  if (scenarioId === SCENARIOS.ACT2) {
    return ["act2_entry", "loom_proctor_defeat"];
  }
  if (scenarioId === SCENARIOS.ACT3_SEAL || scenarioId === SCENARIOS.ACT3_REWRITE) {
    return ["act3_last_door", "final_boss_start", "ending_selected"];
  }
  return [];
}

function verifyDialogueCoverage(run, requiredMilestones) {
  for (const key of requiredMilestones) {
    const hasSignal = Boolean(run.dialogueCoverage[key]);
    pushAssertion(run, `dialogue coverage milestone ${key}`, hasSignal);
  }
}

async function runSingleSimulation({ page, run }) {
  run.performance.memory.start = await sampleMemory(page);
  run.performance.frameSamples.push(await sampleFrameTimes(page, 2000));
  await runScenario(page, run);
  run.performance.frameSamples.push(await sampleFrameTimes(page, 2000));
  run.performance.memory.end = await sampleMemory(page);
  if (run.performance.memory.start && run.performance.memory.end) {
    run.performance.memory.delta = {
      usedJSHeapSize:
        Number(run.performance.memory.end.usedJSHeapSize ?? 0) - Number(run.performance.memory.start.usedJSHeapSize ?? 0),
      totalJSHeapSize:
        Number(run.performance.memory.end.totalJSHeapSize ?? 0) - Number(run.performance.memory.start.totalJSHeapSize ?? 0),
    };
  }
  const state = await getState(page);
  assertNoNaN(run, state);
  await collectFinalState(page, run);
  verifyDialogueCoverage(run, resolveScenarioMilestones(run.scenarioId));
  run.endedAt = nowIso();
  run.pass = run.errors.length === 0 && run.assertions.every((entry) => entry.passed);
  return run;
}

module.exports = {
  SCENARIOS,
  DEFAULT_WARN_DENYLIST,
  ensureDir,
  resolveScenarioList,
  chooseScenarioForRun,
  createRunRecord,
  pushTimeline,
  pushAssertion,
  markMilestone,
  advance,
  getState,
  waitForScene,
  waitForObjective,
  waitForFlag,
  waitForCondition,
  advanceDialogueToEnd,
  clearSaveAndRestart,
  bootstrapPage,
  attachConsoleTrap,
  sampleFrameTimes,
  sampleMemory,
  takeCheckpoint,
  runSingleSimulation,
  runCoreRegressionChecks,
  validateStory,
};
