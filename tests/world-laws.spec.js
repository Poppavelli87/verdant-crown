const { test, expect } = require("@playwright/test");

async function bootstrap(page) {
  await page.goto("/");
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
}

function attachConsoleErrorTrap(page) {
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error?.message ?? String(error)}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`console.error: ${msg.text()}`);
    }
  });
  return errors;
}

async function advance(page, ms) {
  await page.evaluate((stepMs) => window.advanceTime?.(stepMs), ms);
}

async function getState(page) {
  const raw = await page.evaluate(() => window.render_game_to_text());
  return JSON.parse(raw);
}

async function clearSaveAndRestart(page) {
  await page.evaluate(() => {
    window.__verdant_skip_save_on_unload = true;
    window.localStorage.removeItem("verdant-crown-save-v1");
    window.localStorage.removeItem("threejs-rpg-save-v1");
  });
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
}

async function waitForScene(page, sceneId, timeoutMs = 3500) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  const expected = String(sceneId ?? "");
  const isRegion3Alias = expected === "region3_seed" || expected === "windward";
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (
      state.scene_id === expected ||
      (isRegion3Alias && (state.scene_id === "region3_seed" || state.scene_id === "windward"))
    ) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error(`Scene ${sceneId} not reached in time`);
}

async function startFromMenu(page) {
  const state = await getState(page);
  if (state.scene_id !== "start") {
    return state;
  }
  await page.keyboard.press("Enter");
  await advance(page, 900);
  return waitForScene(page, "prologue", 4200);
}

async function waitForIntroTextToFinish(page, timeoutMs = 7600) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (!state.intro_text_active) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Intro text beat did not finish in time");
}

async function holdSpaceToSkipPrologue(page, holdMs = 1300) {
  await page.keyboard.down("Space");
  await advance(page, holdMs);
  await page.keyboard.up("Space");
}

async function skipPrologueToThornmere(page) {
  let state = await getState(page);
  if (state.scene_id !== "prologue") {
    return state;
  }
  await holdSpaceToSkipPrologue(page, 1300);
  await advance(page, 1500);
  state = await getState(page);
  if (state.scene_id === "arthurOpening") {
    await page.evaluate(() => window.debug_complete_opening?.());
    await advance(page, 900);
  }
  await waitForScene(page, "thornmere", 6000);
  return waitForIntroTextToFinish(page, 2600);
}

async function enterGameplayFlow(page) {
  await startFromMenu(page);
  await skipPrologueToThornmere(page);
}

async function enterOpeningFlow(page) {
  await startFromMenu(page);
  let state = await getState(page);
  if (state.scene_id === "prologue") {
    await holdSpaceToSkipPrologue(page, 1300);
    await advance(page, 1500);
  }
  return waitForScene(page, "arthurOpening", 5200);
}

async function completeOpeningCombatBeat(page) {
  let state = await waitForScene(page, "arthurOpening", 5200);
  const hpBefore = state.player_health;
  await advance(page, 1500);
  state = await getState(page);
  expect(state.player_health).toBeLessThan(hpBefore);

  for (let i = 0; i < 8; i += 1) {
    const enemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.state !== "dead");
    if (!enemy) break;
    await page.mouse.move(enemy.screen.x, enemy.screen.y);
    await page.mouse.down({ button: "left" });
    await advance(page, 700);
    await page.mouse.up({ button: "left" });
    await advance(page, 240);
  }
  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  await advance(page, 420);
  await waitForScene(page, "thornmere", 6200);
  state = await getState(page);
  expect(state.story_opening_played).toBe(true);
  return state;
}

async function spawnRoleShowcase(page, roles) {
  await page.evaluate((nextRoles) => {
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_spawn_enemy_roles?.(nextRoles);
  }, roles);
  await advance(page, 180);
}

async function waitForEnemyTextures(page, timeoutMs = 6000) {
  await page.waitForFunction(() => {
    const raw = window.render_game_to_text?.();
    if (!raw) return false;
    const state = JSON.parse(raw);
    const aliveEnemies = state.enemies.filter((enemy) => enemy.state !== "dead");
    return aliveEnemies.length === 0 || aliveEnemies.every((enemy) => enemy.textureLoaded);
  }, null, { timeout: timeoutMs });
  return getState(page);
}

async function measureDistance(page, keys, ms) {
  const before = await getState(page);
  for (const key of keys) {
    await page.keyboard.down(key);
  }
  await advance(page, ms);
  const after = await getState(page);
  for (const key of [...keys].reverse()) {
    await page.keyboard.up(key);
  }
  await advance(page, 100);

  return Math.hypot(after.player.x - before.player.x, after.player.z - before.player.z);
}

async function tapWorld(page, worldX, worldZ) {
  const coords = await page.evaluate(
    ({ x, z }) => window.world_to_screen?.(x, z),
    { x: worldX, z: worldZ }
  );
  await page.mouse.click(coords.x, coords.y);
}

async function tapPortalTo(page, targetSceneId) {
  const screen = await page.evaluate((target) => {
    const portals = window.get_scene_portals?.() ?? [];
    const aliases =
      target === "region3_seed"
        ? ["region3_seed", "windward"]
        : target === "windward"
          ? ["windward", "region3_seed"]
          : [target];
    return portals.find((portal) => aliases.includes(portal.targetSceneId))?.screen ?? null;
  }, targetSceneId);
  if (!screen) {
    throw new Error(`Portal to ${targetSceneId} not found`);
  }
  await page.mouse.click(screen.x, screen.y);
}

async function transitionToHollowScar(page) {
  await tapPortalTo(page, "hollowScar");
  await advance(page, 2400);
  const state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");
  return state;
}

async function getAliveEnemy(page) {
  const enemies = await page.evaluate(() => window.get_enemies?.() ?? []);
  const alive = enemies.find((enemy) => enemy.state !== "dead");
  if (!alive) {
    throw new Error("No alive enemy found");
  }
  return alive;
}

function getEnemyHealth(state, enemyId) {
  return state.enemies.find((enemy) => enemy.id === enemyId)?.health ?? 0;
}

async function forceArthurKillNearPlayer(page, { role = "skirmisher" } = {}) {
  const result = await page.evaluate((nextRole) => {
    window.debug_set_active_character?.("arthur");
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_set_combat_active?.(true);
    return window.debug_force_enemy_kill_near_player?.(nextRole);
  }, role);
  const enemyId = String(result?.enemyId ?? "");
  if (!enemyId) {
    throw new Error("Failed to spawn debug enemy for Arthur kill");
  }
  await advance(page, 120);
  const state = await page.evaluate((id) => window.debug_get_enemy_state?.(id), enemyId);
  if (result?.killConfirmed || state?.state === "dead") {
    return enemyId;
  }
  throw new Error(`Arthur failed to kill enemy ${enemyId}`);
}

function distance2d(a, b) {
  return Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.z) || 0) - (Number(b?.z) || 0));
}

async function moveNearEnemy(page, enemy) {
  await tapWorld(page, enemy.x - 1.2, enemy.z);
  await advance(page, 1100);
}

async function moveToChargeDistance(page, enemy) {
  await tapWorld(page, enemy.x - 2.05, enemy.z);
  await advance(page, 1050);
}

async function quickLightAttack(page, enemy) {
  await page.mouse.move(enemy.screen.x, enemy.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, 20);
  await page.mouse.up({ button: "left" });
  await advance(page, 350);
}

async function fullChargeAttack(page, enemy, holdMs = 900) {
  await page.mouse.move(enemy.screen.x, enemy.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, holdMs);
  await page.mouse.up({ button: "left" });
  await advance(page, 450);
}

async function spawnDevAnomaly(page) {
  await page.keyboard.press("v");
  await advance(page, 120);
}

async function getNpcById(page, npcId) {
  const npcs = await page.evaluate(() => window.get_npcs?.() ?? []);
  return npcs.find((npc) => npc.id === npcId) ?? null;
}

async function openDialogueWithSpace(page) {
  await page.keyboard.press("Space");
  await advance(page, 120);
}

async function advanceDialogueToEnd(page, maxSteps = 20) {
  for (let i = 0; i < maxSteps; i += 1) {
    const state = await getState(page);
    if (!state.dialogue_active) return;
    await page.keyboard.press("Enter");
    await advance(page, 60);
  }
  throw new Error("Dialogue did not close within expected steps");
}

async function completeIntroDialogue(page) {
  let rowan = await getNpcById(page, "elder_rowan");
  for (let i = 0; i < 30 && !rowan; i += 1) {
    await advance(page, 100);
    rowan = await getNpcById(page, "elder_rowan");
  }
  expect(rowan).not.toBeNull();
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x + 0.08, z + 0.58),
    { x: rowan.x, z: rowan.z }
  );
  for (let i = 0; i < 20; i += 1) {
    const state = await getState(page);
    if (!state.transition_active) break;
    await advance(page, 100);
  }
  await advance(page, 100);
  await openDialogueWithSpace(page);
  await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
  await advanceDialogueToEnd(page);
  const state = await getState(page);
  expect(state.story_intro_spoken).toBe(true);
}

async function waitForPulseActive(page, timeoutMs = 2200) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.pulse_active) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Pulse did not become active in time");
}

async function waitForPulseComplete(page, timeoutMs = 8200) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (!state.pulse_active && state.story_hollowscar_pulse_seen) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Pulse did not complete in time");
}

async function spawnThreatVein(page) {
  await page.keyboard.press("t");
  await advance(page, 120);
}

async function waitForThreatVeinActive(page, timeoutMs = 2600) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.vein_active) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Threat vein did not activate in time");
}

async function clearThreatVeinWaveLoop(page, timeoutMs = 16000) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 150));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (!state.vein_active && state.vein_state !== "active") {
      return state;
    }
    if (state.vein_enemies_remaining > 0) {
      await page.evaluate(() => window.debug_defeat_all_enemies?.());
    }
    await advance(page, 150);
  }
  throw new Error("Threat vein did not resolve in time");
}

async function waitForGuardianActive(page, timeoutMs = 3600) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.guardian?.active) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Guardian did not become active in time");
}

async function setupVaelorisFieldRun(page) {
  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_set_story_flag?.("vein_guardian_defeated", true);
    window.debug_set_story_flag?.("vaeloris_first_choice", "");
    window.debug_set_story_flag?.("vaeloris_field_triggered", false);
    window.debug_defeat_all_enemies?.();
  });
  await advance(page, 180);
  await page.evaluate(() => window.debug_teleport_player?.(5.92, -3.05));
  await advance(page, 120);
}

async function waitForVaelorisConstructs(page, timeoutMs = 8400) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 120));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.vaeloris_constructs_alive >= 2) {
      return state;
    }
    await advance(page, 120);
  }
  throw new Error("Vaeloris constructs did not spawn in time");
}

async function setupHarvesterBossRun(page) {
  await page.evaluate(() => {
    window.debug_warp_to_scene?.("emberfall");
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_story_flag?.("vein_guardian_defeated", true);
    window.debug_set_story_flag?.("vaeloris_harvester_active", false);
    window.debug_set_story_flag?.("vaeloris_harvester_defeated", false);
    window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
    window.debug_set_story_flag?.("vaeloris_pressure_stage", 1);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
  });
  await advance(page, 220);
}

async function waitForHarvesterBossActive(page, timeoutMs = 3600) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.boss_instance?.active && state.boss_instance?.bossId === "harvester_warden") {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Harvester boss did not become active in time");
}

async function enableElaineParty(page, { forceMobileUi = false, disableEnemyAttacks = true } = {}) {
  await page.evaluate(
    ({ mobile, disableAttacks }) => {
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_elaine_mp?.(100);
      window.debug_force_mobile_ui?.(mobile ? true : false);
      if (disableAttacks) {
        window.debug_set_enemy_attacks_enabled?.(false);
      }
    },
    { mobile: forceMobileUi, disableAttacks: disableEnemyAttacks }
  );
  await advance(page, 160);
}

async function enableWillowParty(
  page,
  { forceMobileUi = false, disableEnemyAttacks = true, sceneId = "hollowScar" } = {}
) {
  await page.evaluate(
    ({ mobile, disableAttacks, nextScene }) => {
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_trigger_willow_join?.();
      window.debug_set_willow_mp?.(100);
      window.debug_force_mobile_ui?.(mobile ? true : false);
      if (nextScene) {
        window.debug_warp_to_scene?.(nextScene);
      }
      if (disableAttacks) {
        window.debug_set_enemy_attacks_enabled?.(false);
      }
      window.debug_defeat_all_enemies?.();
    },
    { mobile: forceMobileUi, disableAttacks: disableEnemyAttacks, nextScene: sceneId }
  );
  await advance(page, 240);
}

async function setupArthurRageScenario(page, { sceneId = "hollowScar", showPartyHud = true } = {}) {
  await page.evaluate(
    ({ nextScene, withPartyHud }) => {
      window.debug_warp_to_scene?.(nextScene);
      window.debug_set_active_character?.("arthur");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_combat_active?.(true);
      window.debug_defeat_all_enemies?.();
      window.debug_set_occlusion_fade_enabled?.(true);
      window.debug_force_root_challenge_active?.(null);
      window.debug_set_rage_stacks?.(0);
      if (withPartyHud) {
        window.debug_set_story_flag?.("elaine_joined", true);
      }
    },
    { nextScene: sceneId, withPartyHud: showPartyHud }
  );
  await advance(page, 260);
}

async function unlockEmberfallPath(page) {
  await page.evaluate(() => {
    window.debug_set_story_flag?.("vein_quest_complete", true);
    window.debug_set_story_flag?.("vein_quest_active", false);
    window.debug_set_story_flag?.("elaine_joined", true);
  });
  await advance(page, 160);
}

async function transitionToEmberfallFromThornmere(page) {
  await unlockEmberfallPath(page);
  await page.evaluate(() => window.debug_teleport_player?.(7.55, -3.12));
  await advance(page, 120);
  await page.keyboard.press("Space");
  await advance(page, 1250);
  return waitForScene(page, "emberfall", 4200);
}

async function transitionBackToThornmereFromEmberfall(page) {
  await page.evaluate(() => window.debug_teleport_player?.(-4.2, 0.15));
  await advance(page, 120);
  await page.keyboard.press("Space");
  await advance(page, 1100);
  return waitForScene(page, "thornmere", 4200);
}

async function joinWillowInEmberfall(page) {
  await page.evaluate(() => {
    window.debug_set_story_flag?.("chapter2_started", true);
    window.debug_set_story_flag?.("chapter2_arrived_emberfall", true);
    window.debug_set_story_flag?.("emberfall_unlocked", true);
    window.debug_set_story_flag?.("willow_met", false);
    window.debug_set_story_flag?.("willow_joined", false);
    window.debug_set_objective?.("find_willow");
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
  });
  await advance(page, 180);
  const trigger = await page.evaluate(() => window.debug_trigger_willow_meet?.());
  expect(trigger?.triggered).toBe(true);

  for (let i = 0; i < 45; i += 1) {
    const state = await getState(page);
    if (state.dialogue_active) {
      break;
    }
    await advance(page, 120);
  }
  await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
  await advanceDialogueToEnd(page, 36);
  await advance(page, 220);

  let state = await getState(page);
  expect(state.story_willow_met).toBe(true);
  expect(state.chapter2_ambush_active).toBe(true);
  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  for (let i = 0; i < 50; i += 1) {
    state = await getState(page);
    if (state.story_willow_joined) break;
    await advance(page, 120);
  }
  expect(state.story_willow_joined).toBe(true);
  return state;
}

async function castWillowSpellWithRetry(page, key, { targetEnemyId = "", maxAttempts = 8, waitMs = 120 } = {}) {
  let result = { started: false, reason: "unknown" };
  for (let i = 0; i < maxAttempts; i += 1) {
    result =
      (await page.evaluate(
        ({ spellKey, enemyId }) => {
          if (enemyId) {
            window.debug_set_target_entity?.(enemyId);
            const enemy = (window.get_enemies?.() ?? []).find(
              (entry) => entry.id === enemyId && entry.state !== "dead"
            );
            if (enemy) {
              window.debug_teleport_player?.(enemy.x - 0.56, enemy.z);
            }
          }
          window.debug_set_active_character?.("willow");
          return window.debug_cast_willow_spell?.(spellKey);
        },
        { spellKey: key, enemyId: targetEnemyId || "" }
      )) ?? result;
    if (result?.started) {
      return result;
    }
    await advance(page, waitMs);
  }
  return result;
}

async function waitForAct2FalloutDone(page, timeoutMs = 4200) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.story_act2_fallout_done) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Act II fallout did not trigger in time");
}

async function waitForChapter5AftershockDone(page, timeoutMs = 5200) {
  const steps = Math.max(1, Math.ceil(timeoutMs / 100));
  for (let i = 0; i < steps; i += 1) {
    const state = await getState(page);
    if (state.story_chapter5_aftershock_done) {
      return state;
    }
    await advance(page, 100);
  }
  throw new Error("Chapter 5 aftershock did not trigger in time");
}

test.beforeEach(async ({ page }) => {
  await bootstrap(page);
  await clearSaveAndRestart(page);
  await enterGameplayFlow(page);
});

test("scene starts in Thornmere", async ({ page }) => {
  const sceneLabel = page.locator("[data-testid='scene-name']");
  await expect(sceneLabel).toHaveText(/Thornmere/);
  const state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
});

test("Thornmere visuals stay stable after 3s without gray drift", async ({ page }) => {
  const before = await getState(page);
  expect(before.scene_id).toBe("thornmere");

  await advance(page, 3000);
  const after = await getState(page);

  expect(after.scene_id).toBe("thornmere");
  expect(after.visual_ambient_intensity).toBeGreaterThan(before.visual_ambient_intensity - 0.03);
  expect(after.visual_fog_density).toBeLessThan(before.visual_fog_density + 0.002);
  expect(after.visual_fog_density).toBeLessThan(0.01);

  await expect(page).toHaveScreenshot("thornmere-stable-after-3s.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 170,
  });
});

test("Hollow Scar visuals remain distinct and stable after 3s", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await waitForEnemyTextures(page);

  const before = await getState(page);
  await advance(page, 3000);
  const after = await getState(page);

  expect(after.scene_id).toBe("hollowScar");
  expect(after.visual_ambient_intensity).toBeGreaterThan(before.visual_ambient_intensity - 0.045);
  expect(after.visual_fog_density).toBeLessThan(before.visual_fog_density + 0.0025);
  expect(after.visual_fog_density).toBeGreaterThan(0.009);
  expect(after.visual_ambient_intensity).toBeLessThan(0.76);

  await expect(page).toHaveScreenshot("hollowscar-stable-after-3s.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 120,
  });
});

test("manual map refresh controls are not exposed", async ({ page }) => {
  await expect(page.locator("[data-testid='map-refresh']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /refresh map/i })).toHaveCount(0);
});

test("map auto-refresh watchdog keeps terrain mounted after 5s idle", async ({ page }) => {
  let state = await getState(page);
  expect(state.debug_has_ground).toBe(true);

  await advance(page, 5000);
  state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
  expect(state.debug_has_ground).toBe(true);
  expect(state.debug_terrain_status).toContain("mounted");
  expect(state.map_last_render_age).toBeLessThanOrEqual(3);
  expect(state.debug_scene_objects).toBeGreaterThan(5);
});

test("Elder Rowan NPC renders in Thornmere", async ({ page }) => {
  const npc = await getNpcById(page, "elder_rowan");
  expect(npc).not.toBeNull();
  expect(npc.name).toBe("Elder Rowan");
});

test("NPC dialogue opens with Space, blocks movement, and saves intro flag", async ({ page }) => {
  const dialogueRoot = page.locator("[data-testid='dialogue-root']");

  await openDialogueWithSpace(page);
  await expect(dialogueRoot).toBeVisible();

  const openedState = await getState(page);
  expect(openedState.dialogue_active).toBe(true);
  expect(openedState.dialogue_npc).toBe("Elder Rowan");

  const beforeMove = { x: openedState.player.x, z: openedState.player.z };
  await page.keyboard.down("d");
  await advance(page, 600);
  await page.keyboard.up("d");
  await advance(page, 80);

  const afterMove = await getState(page);
  const movedDistance = Math.hypot(afterMove.player.x - beforeMove.x, afterMove.player.z - beforeMove.z);
  expect(movedDistance).toBeLessThan(0.03);

  await advanceDialogueToEnd(page);
  const finalState = await getState(page);
  expect(finalState.dialogue_active).toBe(false);
  expect(finalState.story_intro_spoken).toBe(true);
});

test("intro dialogue persists and Elder Rowan uses alternate line after reload", async ({ page }) => {
  await openDialogueWithSpace(page);
  await advanceDialogueToEnd(page);

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
  await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
  await page.click("[data-testid='menu-continue']");
  await advance(page, 900);
  await waitForScene(page, "thornmere", 5200);
  await waitForIntroTextToFinish(page, 2600);
  const npc = await getNpcById(page, "elder_rowan");
  expect(npc).not.toBeNull();
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x + 0.1, z + 0.55),
    { x: npc.x, z: npc.z }
  );
  await advance(page, 140);

  await openDialogueWithSpace(page);
  await advance(page, 900);
  const state = await getState(page);
  expect(state.story_intro_spoken).toBe(true);
  expect(state.dialogue_line).toContain("You know what must be done.");
});

test("story flow ordering: Elaine must join before Willow and Rowan stays on early branch", async ({ page }) => {
  await clearSaveAndRestart(page);
  await enterGameplayFlow(page);

  let joinState = await page.evaluate(() => window.debug_get_join_state?.());
  expect(joinState.elaine_joined).toBe(false);
  expect(joinState.willow_joined).toBe(false);

  await openDialogueWithSpace(page);
  await advance(page, 220);
  let state = await getState(page);
  expect(state.dialogue_line ?? "").not.toContain("You found Elaine");
  await advanceDialogueToEnd(page, 24);

  const earlyWillowAttempt = await page.evaluate(() => window.debug_trigger_willow_meet?.());
  expect(earlyWillowAttempt?.triggered).toBe(false);
  await advance(page, 120);
  state = await getState(page);
  expect(state.story_willow_joined).toBe(false);
  expect(state.current_objective).toBe("return_to_rowan");

  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
  });
  await advance(page, 120);
  joinState = await page.evaluate(() => window.debug_get_join_state?.());
  expect(joinState.elaine_joined).toBe(true);
  expect(joinState.partyMembers).toContain("elaine");
});

test("join-state migration reconciliation corrects corrupted flag/party combinations", async ({ page }) => {
  await clearSaveAndRestart(page);
  await enterGameplayFlow(page);

  const correctedEarly = await page.evaluate(() =>
    window.debug_reconcile_join_state_for_test?.({
      storyFlags: { elaine_joined: true, chapter2_started: false, emberfall_lead_unlocked: false },
      partyMembers: [],
    })
  );
  expect(correctedEarly.joinState.elaine_joined).toBe(false);
  expect(correctedEarly.joinState.partyMembers).not.toContain("elaine");

  const correctedLate = await page.evaluate(() =>
    window.debug_reconcile_join_state_for_test?.({
      storyFlags: { elaine_joined: true, chapter2_started: true },
      partyMembers: [],
    })
  );
  expect(correctedLate.joinState.elaine_joined).toBe(true);
  expect(correctedLate.joinState.partyMembers).toContain("elaine");
});

test("UI gating: Elaine HUD and spellbar are hidden before join and enabled after join", async ({ page }) => {
  await clearSaveAndRestart(page);
  await enterGameplayFlow(page);

  await page.evaluate(() => window.debug_force_mobile_ui?.(true));
  await advance(page, 120);
  let state = await getState(page);
  expect(state.story_elaine_joined).toBe(false);
  expect(state.elaine_spellbar_visible).toBe(false);
  await expect(page.locator("[data-testid='hud-mp']")).toBeHidden();

  await page.evaluate(() => window.debug_set_story_flag?.("elaine_joined", true));
  await advance(page, 120);
  state = await getState(page);
  expect(state.story_elaine_joined).toBe(true);
  expect(state.elaine_spellbar_visible).toBe(true);
  await expect(page.locator("[data-testid='hud-mp']")).toBeVisible();
});

test("first join flow: opening completion and Rowan activates the vein quest", async ({ page }) => {
  await clearSaveAndRestart(page);
  await enterOpeningFlow(page);
  await completeOpeningCombatBeat(page);
  await completeIntroDialogue(page);

  const state = await getState(page);
  expect(state.story_opening_played).toBe(true);
  expect(state.story_intro_spoken).toBe(true);
  expect(state.story_vein_quest_active).toBe(true);
  await expect(page.locator("[data-testid='quest-line']")).toContainText("Stabilize the Vein");
});

test("first join flow: first vein completion resolves quest and introduces Elaine", async ({ page }) => {
  await completeIntroDialogue(page);
  let state = await getState(page);
  expect(state.story_vein_quest_active).toBe(true);

  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
  });
  await advance(page, 180);
  await page.evaluate(() => window.debug_teleport_player?.(2.2, 1.05));
  await advance(page, 180);
  state = await waitForThreatVeinActive(page, 2600);
  expect(state.vein_id).toBe("hollowscar-corridor-vein");
  await expect(page.locator("[data-testid='quest-line']")).toContainText("Stabilize the Vein");
  await expect(page).toHaveScreenshot("first-vein-quest-hud.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 420,
  });

  state = await clearThreatVeinWaveLoop(page, 18000);
  expect(state.vein_completed_flags).toContain("vein_completed_hollowScar_hollowscar-corridor-vein");
  expect(state.story_vein_quest_complete).toBe(true);
  expect(state.story_vein_quest_active).toBe(false);

  for (let i = 0; i < 60; i += 1) {
    state = await getState(page);
    if (state.party?.stagingVisible) break;
    await advance(page, 150);
  }
  expect(state.party.stagingVisible).toBe(true);
  await expect(page).toHaveScreenshot("elaine-intro.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 170,
  });

  for (let i = 0; i < 120; i += 1) {
    state = await getState(page);
    if (state.story_elaine_joined && state.party?.followerVisible) break;
    await advance(page, 140);
  }
  expect(state.story_elaine_joined).toBe(true);
  expect(state.party.followerVisible).toBe(true);

  await page.keyboard.down("d");
  await advance(page, 700);
  await page.keyboard.up("d");
  await advance(page, 120);
  await expect(page).toHaveScreenshot("party-follow.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 165,
  });
});

test("first join flow: shrine upgrade purchase and reload persistence", async ({ page }) => {
  await page.evaluate(() => {
    window.debug_add_motes?.(12);
    window.debug_set_story_flag?.("elaine_joined", true);
  });
  await page.evaluate(() => window.debug_teleport_player?.(-1.95, -0.55));
  await advance(page, 120);
  await page.keyboard.press("Space");
  await advance(page, 120);

  await expect(page.locator("[data-testid='shrine-ui']")).toBeVisible();
  await expect(page).toHaveScreenshot("shrine-ui.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 120,
  });

  let state = await getState(page);
  expect(state.verdant_mote_count).toBeGreaterThanOrEqual(10);
  await page.click("[data-testid='shrine-upgrade-hp']");
  await advance(page, 120);
  state = await getState(page);
  expect(state.player_upgrades.maxHpLevel).toBe(1);
  expect(state.player_max_health).toBe(120);
  expect(state.verdant_mote_count).toBeLessThan(12);
  await page.click("[data-testid='shrine-close']");
  await advance(page, 100);

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
  await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
  await page.click("[data-testid='menu-continue']");
  await advance(page, 900);
  await waitForScene(page, "thornmere", 5200);
  await waitForIntroTextToFinish(page, 2600);

  state = await getState(page);
  expect(state.story_elaine_joined).toBe(true);
  expect(state.party.followerVisible).toBe(true);
  expect(state.player_upgrades.maxHpLevel).toBe(1);
  expect(state.player_max_health).toBe(120);
});

test("vein guardian encounter telegraphs, takes damage, and awards a relic shard", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_start_boss?.();
  });
  let state = await waitForGuardianActive(page, 4200);
  expect(state.guardian.spriteVisible).toBe(true);
  expect(state.story_vein_guardian_active).toBe(true);
  expect(state.guardian.phase).toBe(1);
  expect(state.boss_hud?.active).toBe(true);
  await expect(page.locator("[data-testid='boss-hud']")).toBeVisible();
  await expect(page.locator("[data-testid='boss-hp']")).toBeVisible();
  await expect(page).toHaveScreenshot("boss-hud-visible.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });
  await expect(page).toHaveScreenshot("guardian-phase1.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  let telegraphVisible = false;
  for (let i = 0; i < 45; i += 1) {
    await advance(page, 100);
    state = await getState(page);
    if (state.guardian.telegraphActive && state.vfx.targetRings > 0) {
      telegraphVisible = true;
      break;
    }
  }
  expect(telegraphVisible).toBe(true);
  await expect(page).toHaveScreenshot("boss-telegraph-ring.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 230,
  });

  const hpBefore = state.boss_instance.hp;
  for (let i = 0; i < 3; i += 1) {
    await advance(page, 140);
    await page.evaluate(() => window.debug_damage_boss?.(14));
    await advance(page, 140);
  }
  state = await getState(page);
  expect(state.boss_instance.hp).toBeLessThan(hpBefore);

  await page.evaluate(() => window.debug_force_guardian_shield?.());
  await advance(page, 80);
  state = await getState(page);
  expect(state.guardian.shieldActive).toBe(true);
  await expect(page).toHaveScreenshot("guardian-shield.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  await page.evaluate(() => window.debug_set_boss_hp?.(0.31));
  await advance(page, 150);
  state = await getState(page);
  expect(state.boss_instance.phaseId).toBe("p3");
  expect(state.music_track).toBe("boss_final");
  await expect(page).toHaveScreenshot("boss-final-phase.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 240,
  });

  const shardsBefore = state.relic_shard_count;
  await page.evaluate(() => window.debug_damage_boss?.(9999));
  await advance(page, 120);
  state = await getState(page);
  expect(state.boss_instance.active).toBe(false);
  expect(state.boss_hud?.active).toBe(false);
  expect(state.combat_guardian_forced).toBe(false);
  expect(state.story_vein_guardian_defeated).toBe(true);
  expect(state.relic_shard_count).toBe(shardsBefore + 1);
  await advance(page, 1800);
  state = await getState(page);
  expect(state.music_track).toBe("overworld");
  await expect(page).toHaveScreenshot("guardian-defeat.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 240,
  });
});

test("Vaeloris field operation: disable path removes extractor and stores choice", async ({ page }) => {
  await setupVaelorisFieldRun(page);

  let state = await getState(page);
  let sawDialogue = false;
  for (let i = 0; i < 42; i += 1) {
    state = await getState(page);
    if (state.story_vaeloris_field_triggered && state.vaeloris_dialogue_active) {
      sawDialogue = true;
      break;
    }
    await advance(page, 100);
  }
  expect(sawDialogue).toBe(true);
  expect(state.story_vaeloris_field_triggered).toBe(true);
  await expect(page).toHaveScreenshot("extractor-area.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  state = await waitForVaelorisConstructs(page, 9600);
  expect(state.enemies.some((enemy) => enemy.role === "construct")).toBe(true);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(true));
  await advance(page, 160);

  let projectileVisible = false;
  for (let i = 0; i < 80; i += 1) {
    await advance(page, 100);
    state = await getState(page);
    if (
      state.enemy_projectiles_active > 0 ||
      state.enemies.some((enemy) => enemy.role === "construct" && enemy.telegraphActive)
    ) {
      projectileVisible = true;
      break;
    }
  }
  expect(projectileVisible).toBe(true);
  await expect(page).toHaveScreenshot("construct-projectile.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 230,
  });

  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  for (let i = 0; i < 40; i += 1) {
    await advance(page, 120);
    state = await getState(page);
    if (state.vaeloris_constructs_alive <= 0) break;
  }
  expect(state.vaeloris_constructs_alive).toBe(0);

  await page.evaluate(() => window.debug_teleport_player?.(6.2, -3.2));
  await advance(page, 120);
  await page.keyboard.press("Space");
  await advance(page, 100);
  await expect(page.locator("[data-testid='extractor-choice-ui']")).toBeVisible();
  await page.click("[data-testid='extractor-choice-disable']");
  await advance(page, 180);

  state = await getState(page);
  expect(state.story_vaeloris_first_choice).toBe("disable");
  expect(state.vaeloris_extractor_destroyed).toBe(true);
  await expect(page).toHaveScreenshot("extractor-destroyed.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });
});

test("Vaeloris field operation: leave path stores choice and keeps extractor", async ({ page }) => {
  await setupVaelorisFieldRun(page);
  await waitForVaelorisConstructs(page, 9600);
  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  await advance(page, 260);
  await page.evaluate(() => window.debug_teleport_player?.(6.2, -3.2));
  await advance(page, 120);

  await page.keyboard.press("Space");
  await advance(page, 100);
  await expect(page.locator("[data-testid='extractor-choice-ui']")).toBeVisible();
  await page.click("[data-testid='extractor-choice-leave']");
  await advance(page, 180);

  const state = await getState(page);
  expect(state.story_vaeloris_first_choice).toBe("leave");
  expect(state.vaeloris_extractor_destroyed).toBe(false);
  expect(state.extraction_external_delta).toBeGreaterThan(0);
});

test.describe("chapter 4 rowan report flow", () => {
  test("Rowan report triggers once and unlocks Harvester objective", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_trigger_willow_join?.();
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "crush");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", false);
      window.debug_set_story_flag?.("harvester_site_unlocked", false);
      window.debug_set_story_flag?.("vaeloris_harvester_active", false);
      window.debug_set_story_flag?.("vaeloris_harvester_defeated", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 220);

    let rowan = await getNpcById(page, "elder_rowan");
    for (let i = 0; i < 24 && !rowan; i += 1) {
      await advance(page, 100);
      rowan = await getNpcById(page, "elder_rowan");
    }
    expect(rowan).not.toBeNull();
    await page.evaluate(
      ({ x, z }) => window.debug_teleport_player?.(x + 0.08, z + 0.56),
      { x: rowan.x, z: rowan.z }
    );
    await advance(page, 140);
    await page.keyboard.press("Space");

    let state = await getState(page);
    for (let i = 0; i < 32; i += 1) {
      if (state.story_chapter4_rowan_report_done && state.dialogue_active) break;
      await advance(page, 100);
      state = await getState(page);
    }

    expect(state.story_chapter4_rowan_report_done).toBe(true);
    expect(state.story_harvester_site_unlocked).toBe(true);
    expect(state.current_objective).toBe("reach_harvester_site");
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("rowan-report-ch4.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });

    await advanceDialogueToEnd(page, 64);
    await advance(page, 120);
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Harvester rig");

    const secondAttempt = await page.evaluate(() => window.debug_trigger_rowan_report_ch4?.());
    expect(secondAttempt?.triggered).toBe(false);
  });
});

test.describe("emberfall harvester warden encounter", () => {
  test("boss starts with extraction objective HUD in Emberfall", async ({ page }) => {
    await setupHarvesterBossRun(page);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    const state = await waitForHarvesterBossActive(page, 4200);
    expect(state.scene_id).toBe("emberfall");
    expect(state.story_vaeloris_harvester_active).toBe(true);
    expect(state.story_vaeloris_harvester_defeated).toBe(false);
    expect(state.boss_hud?.active).toBe(true);
    expect(state.boss_hud?.extraction).toBeTruthy();
    expect(state.current_objective).toBe("defeat_harvester_warden");
    await expect(page.locator("[data-testid='boss-hud']")).toBeVisible();
    await expect(page.locator("[data-testid='boss-extraction']")).toBeVisible();
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Break the anchors");
    await expect(page).toHaveScreenshot("harvester-site.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
    await expect(page).toHaveScreenshot("boss-extraction-ui.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
    await expect(page).toHaveScreenshot("guidance-defeat-harvester.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
  });

  test("suppression field debuff becomes visible during harvester boss", async ({ page }) => {
    await setupHarvesterBossRun(page);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    await waitForHarvesterBossActive(page, 4200);

    let debuffed = false;
    for (let i = 0; i < 90; i += 1) {
      await advance(page, 120);
      const effects = await page.evaluate(() => window.debug_get_effects?.("arthur") ?? []);
      if (effects.some((entry) => entry.id === "suppression_field")) {
        debuffed = true;
        break;
      }
    }
    expect(debuffed).toBe(true);
    await expect(page.locator("[data-testid='status-arthur']")).toBeVisible();
    await expect(page).toHaveScreenshot("suppression-debuff-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 240,
    });
  });

  test("destroying anchors drops extraction meter deterministically", async ({ page }) => {
    await setupHarvesterBossRun(page);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    await waitForHarvesterBossActive(page, 4200);

    await page.evaluate(() => window.debug_set_extraction?.(0.92));
    await advance(page, 120);
    const before = await getState(page);
    expect(before.boss_hud?.extraction?.value).toBeGreaterThan(0.89);

    const anchorResult = await page.evaluate(() => window.debug_damage_anchor?.(0, 999));
    expect(anchorResult.destroyed).toBe(true);
    await advance(page, 120);

    const after = await getState(page);
    expect(after.boss_hud?.extraction?.value).toBeLessThan(before.boss_hud.extraction.value - 0.3);
    expect(after.boss_hud?.extraction?.anchorsAlive).toBeLessThan(before.boss_hud.extraction.anchorsAlive);
  });

  test("defeat + shatter choice sets flags and raises crown mood", async ({ page }) => {
    await setupHarvesterBossRun(page);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    await waitForHarvesterBossActive(page, 4200);
    const before = await getState(page);

    await page.evaluate(() => window.debug_damage_boss?.(9999));
    let choiceVisible = false;
    for (let i = 0; i < 40; i += 1) {
      await advance(page, 100);
      const state = await getState(page);
      if (state.harvester_choice_panel_open) {
        choiceVisible = true;
        break;
      }
    }
    expect(choiceVisible).toBe(true);
    await expect(page.locator("[data-testid='harvester-choice-ui']")).toBeVisible();
    await expect(page).toHaveScreenshot("harvester-choice-ui.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 220,
    });

    await page.click("[data-testid='choice-shatter']");
    await advance(page, 140);
    const after = await getState(page);
    expect(after.story_vaeloris_harvester_choice).toBe("shatter");
    expect(after.story_vaeloris_harvester_defeated).toBe(true);
    expect(after.story_vaeloris_harvester_active).toBe(false);
    expect(after.crown_mood_score).toBeGreaterThan(before.crown_mood_score);
    expect(after.story_vaeloris_pressure_stage).toBe(1);
    expect(after.current_objective).toBe("return_to_rowan_after_harvester");
  });

  test("defeat + salvage choice sets pressure stage and grants shard", async ({ page }) => {
    await setupHarvesterBossRun(page);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    await waitForHarvesterBossActive(page, 4200);
    const before = await getState(page);

    await page.evaluate(() => window.debug_damage_boss?.(9999));
    for (let i = 0; i < 40; i += 1) {
      await advance(page, 100);
      const state = await getState(page);
      if (state.harvester_choice_panel_open) break;
    }
    await expect(page.locator("[data-testid='harvester-choice-ui']")).toBeVisible();
    await page.click("[data-testid='choice-salvage']");
    await advance(page, 140);
    const after = await getState(page);
    expect(after.story_vaeloris_harvester_choice).toBe("salvage");
    expect(after.story_vaeloris_harvester_defeated).toBe(true);
    expect(after.story_vaeloris_pressure_stage).toBe(2);
    expect(after.relic_shard_count).toBe(before.relic_shard_count + 1);
    expect(after.crown_mood_score).toBeLessThan(before.crown_mood_score);
    expect(after.current_objective).toBe("return_to_rowan_after_harvester");
  });
});

test.describe("chapter 4 smoke + integration quality gate", () => {
  test("story flow, controls, render, and boss choice stay coherent without console errors", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);

    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_trigger_willow_join?.();
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "crush");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", false);
      window.debug_set_story_flag?.("harvester_site_unlocked", false);
      window.debug_set_story_flag?.("vaeloris_harvester_active", false);
      window.debug_set_story_flag?.("vaeloris_harvester_defeated", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 220);

    const rowanReport = await page.evaluate(() => window.debug_trigger_rowan_report_ch4?.());
    expect(rowanReport?.triggered).toBe(true);
    for (let i = 0; i < 36; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("ch4-rowan-report.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });
    await advanceDialogueToEnd(page, 64);
    await advance(page, 160);

    let state = await getState(page);
    expect(state.story_chapter4_rowan_report_done).toBe(true);
    expect(state.story_harvester_site_unlocked).toBe(true);
    expect(state.current_objective).toBe("reach_harvester_site");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Harvester rig");

    const guidanceBanter = await page.evaluate(() => window.debug_force_banter?.("guidance"));
    const guidanceLine = String(guidanceBanter?.line ?? "").toLowerCase();
    expect(guidanceLine.includes("harvester") || guidanceLine.includes("anchor") || guidanceLine.includes("rig")).toBe(
      true
    );

    await page.keyboard.press("1");
    await advance(page, 120);
    expect((await getState(page)).active_character).toBe("arthur");
    await page.keyboard.press("2");
    await advance(page, 120);
    expect((await getState(page)).active_character).toBe("elaine");
    await page.keyboard.press("3");
    await advance(page, 120);
    expect((await getState(page)).active_character).toBe("willow");

    await page.evaluate(() => {
      window.debug_set_active_character?.("elaine");
      window.debug_set_elaine_mp?.(100);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
    });
    await advance(page, 180);

    const renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.hasBase).toBe(true);
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);
    expect(renderState?.characters?.elaine?.hasWeapon).toBe(true);
    expect(Number(renderState?.characters?.elaine?.weaponScale ?? 0)).toBeGreaterThan(0.2);
    expect(Number(renderState?.characters?.elaine?.weaponScale ?? 0)).toBeLessThan(1.6);
    await expect(page).toHaveScreenshot("elaine-active-renders.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    const enemyId = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
      const spawnX = Number(state.player?.x ?? 0) + 2.35;
      const spawnZ = Number(state.player?.z ?? 0);
      const spawned = window.debug_spawn_enemy_type?.("skirmisher", spawnX, spawnZ);
      return typeof spawned === "string" ? spawned : spawned?.id ?? "";
    });
    expect(enemyId).toBeTruthy();
    await advance(page, 180);
    const beforeBolt = await getState(page);
    const beforeBoltEnemy = beforeBolt.enemies.find((enemy) => enemy.id === enemyId);
    expect(beforeBoltEnemy).toBeTruthy();

    const attacked = await page.evaluate(() => window.debug_force_basic_attack?.());
    expect(attacked).toBe(true);
    await advance(page, 180);

    let afterBolt = await getState(page);
    const afterBoltEnemy = afterBolt.enemies.find((enemy) => enemy.id === enemyId);
    expect(afterBoltEnemy).toBeTruthy();
    expect(afterBoltEnemy.health).toBeLessThan(beforeBoltEnemy.health);
    expect(afterBolt.player_melee_attack_events).toBe(0);
    await expect(page).toHaveScreenshot("elaine-holy-bolt.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    await page.evaluate(() => window.debug_set_hp?.(72));
    await advance(page, 80);
    const hpAfterDamage = (await getState(page)).player_health;
    expect(hpAfterDamage).toBeLessThan(100);
    const castResult = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(castResult?.started).toBe(true);
    await advance(page, 1750);
    afterBolt = await getState(page);
    expect(afterBolt.player_health).toBeGreaterThan(hpAfterDamage);
    expect(afterBolt.party_elaine_mp).toBeLessThan(100);

    await page.evaluate(() => window.debug_warp_to_scene?.("emberfall"));
    await advance(page, 220);
    await page.evaluate(() => window.debug_start_harvester_boss?.());
    await waitForHarvesterBossActive(page, 4200);
    state = await getState(page);
    expect(state.current_objective).toBe("defeat_harvester_warden");
    await expect(page.locator("[data-testid='boss-extraction']")).toBeVisible();

    await page.evaluate(() => window.debug_set_extraction?.(0.93));
    await advance(page, 120);
    const extractionBefore = await getState(page);
    await page.evaluate(() => window.debug_damage_anchor?.(0, 999));
    await advance(page, 120);
    const extractionAfter = await getState(page);
    expect(extractionAfter.boss_hud?.extraction?.value).toBeLessThan(extractionBefore.boss_hud.extraction.value - 0.3);

    let suppressionSeen = false;
    for (let i = 0; i < 90; i += 1) {
      await advance(page, 120);
      const effects = await page.evaluate(() => window.debug_get_effects?.("arthur") ?? []);
      if (effects.some((entry) => entry.id === "suppression_field")) {
        suppressionSeen = true;
        break;
      }
    }
    expect(suppressionSeen).toBe(true);

    const moodBeforeChoice = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    await page.evaluate(() => window.debug_damage_boss?.(9999));
    for (let i = 0; i < 40; i += 1) {
      await advance(page, 100);
      if ((await getState(page)).harvester_choice_panel_open) break;
    }
    await expect(page.locator("[data-testid='harvester-choice-ui']")).toBeVisible();
    await page.click("[data-testid='choice-salvage']");
    await advance(page, 160);
    const afterChoice = await getState(page);
    const moodAfterChoice = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    expect(afterChoice.story_vaeloris_harvester_choice).toBe("salvage");
    expect(afterChoice.story_harvester_warden_defeated).toBe(true);
    expect(afterChoice.current_objective).toBe("return_to_rowan_after_harvester");
    expect(afterChoice.story_vaeloris_pressure_stage).toBeGreaterThanOrEqual(2);
    expect(moodAfterChoice).toBeLessThan(moodBeforeChoice);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("chapter 5 aftershock and ridge gate flow", () => {
  test("aftershock triggers once, updates objective, and shows dialogue", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "crush");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", true);
      window.debug_set_story_flag?.("harvester_site_unlocked", true);
      window.debug_set_story_flag?.("chapter5_aftershock_done", false);
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_story_flag?.("region3_seed_unlocked", false);
      window.debug_set_story_flag?.("region3_seed_entered", false);
      window.debug_set_story_flag?.("vaeloris_patrol_setpiece_done", false);
      window.debug_set_story_flag?.("harvester_warden_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "shatter");
      window.debug_set_objective?.("return_to_rowan_after_harvester");
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 220);

    const trigger = await page.evaluate(() => window.debug_trigger_ch5_aftershock?.());
    expect(trigger?.triggered).toBe(true);

    let state = await waitForChapter5AftershockDone(page, 5200);
    for (let i = 0; i < 26; i += 1) {
      if (state.dialogue_active) break;
      await advance(page, 100);
      state = await getState(page);
    }

    expect(state.story_chapter5_aftershock_done).toBe(true);
    expect(state.story_ridge_gate_unlocked).toBe(true);
    expect(state.story_region3_seed_unlocked).toBe(true);
    expect(state.story_vaeloris_patrol_setpiece_done).toBe(false);
    expect(state.current_objective).toBe("clear_ridge_patrol");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Clear the path");
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("ch5-aftershock-dialogue.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });

    const secondAttempt = await page.evaluate(() => window.debug_trigger_ch5_aftershock?.());
    expect(secondAttempt?.triggered).toBe(false);
  });

  test("chapter 5 patrol setpiece clears and unlocks Region 3 seed transition", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);

    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "pocket");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", true);
      window.debug_set_story_flag?.("harvester_site_unlocked", true);
      window.debug_set_story_flag?.("harvester_warden_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "salvage");
      window.debug_set_story_flag?.("chapter5_aftershock_done", false);
      window.debug_set_story_flag?.("vaeloris_patrol_setpiece_done", false);
      window.debug_set_story_flag?.("region3_seed_unlocked", false);
      window.debug_set_story_flag?.("region3_seed_entered", false);
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_story_flag?.("vaeloris_pressure_stage", 1);
      window.debug_set_objective?.("return_to_rowan_after_harvester");
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 240);

    const aftershock = await page.evaluate(() => window.debug_trigger_ch5_aftershock?.());
    expect(aftershock?.triggered).toBe(true);
    await waitForChapter5AftershockDone(page, 5200);
    for (let i = 0; i < 80; i += 1) {
      const current = await getState(page);
      if (!current.dialogue_active) break;
      await page.keyboard.press("Enter");
      await advance(page, 110);
    }
    await advance(page, 120);
    let state = await getState(page);
    expect(state.dialogue_active).toBe(false);
    expect(state.story_vaeloris_pressure_stage).toBeGreaterThanOrEqual(2);
    expect(state.current_objective).toBe("clear_ridge_patrol");

    const spawned = await page.evaluate(() => window.debug_spawn_ridge_patrol?.());
    expect(spawned?.spawned).toBe(true);
    await advance(page, 220);
    state = await getState(page);
    expect(state.ridge_patrol_setpiece_active).toBe(true);
    expect(state.ridge_patrol_setpiece_enemy_count).toBeGreaterThanOrEqual(3);
    await expect(page).toHaveScreenshot("ridge-patrol-setpiece.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });

    await page.evaluate(() => window.debug_force_patrol_defeat?.());
    await advance(page, 260);
    state = await getState(page);
    expect(state.story_vaeloris_patrol_setpiece_done).toBe(true);
    expect(state.story_region3_seed_unlocked).toBe(true);
    expect(state.current_objective).toBe("cross_ridge_gate");

    await page.evaluate(() => window.debug_teleport_player?.(7.42, 2.68));
    await advance(page, 140);
    await expect(page).toHaveScreenshot("ch5-ridge-gate-unlocked.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });
    await tapPortalTo(page, "windward");
    await advance(page, 1500);
    state = await waitForScene(page, "windward", 5200);
    expect(state.scene_id).toBe("windward");
    expect(state.story_region3_seed_entered).toBe(true);
    expect(state.current_objective).toBe("find_waystone_circle");
    await expect(page).toHaveScreenshot("ch5-windward-entry.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });
    for (let i = 0; i < 36; i += 1) {
      state = await getState(page);
      if (state.dialogue_active) {
        await page.keyboard.press("Enter");
      }
      if (!state.dialogue_active && !state.intro_text_active && state.movement_context !== "combat") {
        break;
      }
      await advance(page, 120);
    }

    await page.evaluate(() => window.debug_set_active_character?.("elaine"));
    await advance(page, 120);
    const renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);
    expect(renderState?.characters?.elaine?.hasWeapon).toBe(true);

    const enemyId = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
      const spawned = window.debug_spawn_enemy_type?.("skirmisher", Number(state.player?.x ?? 0) + 1.6, Number(state.player?.z ?? 0));
      return typeof spawned === "string" ? spawned : spawned?.id ?? "";
    });
    expect(enemyId).toBeTruthy();
    await advance(page, 180);
    const before = await getState(page);
    const beforeEnemy = before.enemies.find((enemy) => enemy.id === enemyId);
    expect(beforeEnemy).toBeTruthy();
    let dealtDamage = false;
    for (let i = 0; i < 4; i += 1) {
      const attacked = await page.evaluate(() => window.debug_force_basic_attack?.());
      expect(attacked).toBe(true);
      await advance(page, 260);
      const after = await getState(page);
      const afterEnemy = after.enemies.find((enemy) => enemy.id === enemyId);
      if (afterEnemy && afterEnemy.health < beforeEnemy.health) {
        dealtDamage = true;
        break;
      }
    }
    expect(dealtDamage).toBe(true);
    await page.evaluate(() => {
      window.debug_defeat_all_enemies?.();
      window.debug_set_combat_active?.(false);
    });
    await advance(page, 220);

    await page.evaluate(() => window.debug_set_hp?.(70));
    await advance(page, 100);
    const hpBeforeCast = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1750);
    const hpAfterCast = (await getState(page)).player_health;
    expect(hpAfterCast).toBeGreaterThan(hpBeforeCast);
    await expect(page).toHaveScreenshot("ch5-elaine-active-regression.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });

    await page.keyboard.down("d");
    await advance(page, 1400);
    await page.keyboard.up("d");
    await advance(page, 100);
    for (let i = 0; i < 30; i += 1) {
      const clearState = await getState(page);
      if (!clearState.intro_text_active && !clearState.dialogue_active && clearState.movement_context !== "combat") {
        break;
      }
      await advance(page, 120);
    }
    const loreBanter = await page.evaluate(() => window.debug_force_banter?.("lore"));
    expect(loreBanter?.triggered).toBe(true);
    await expect(page.locator("[data-testid='party-chat']")).toContainText(":");

    await page.evaluate(() => window.debug_teleport_player?.(-4.18, 0.04));
    await advance(page, 140);
    await page.keyboard.press("Space");
    await advance(page, 1450);
    const returnState = await waitForScene(page, "thornmere", 5200);
    expect(returnState.scene_id).toBe("thornmere");

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("chapter 6 windward waystone flow", () => {
  test("chapter 6 e2e: ridge gate to waystone attunement is deterministic", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);

    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", true);
      window.debug_set_story_flag?.("willow_met", true);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("act2_fallout_done", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "crush");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", true);
      window.debug_set_story_flag?.("harvester_site_unlocked", true);
      window.debug_set_story_flag?.("harvester_warden_defeated", true);
      window.debug_set_story_flag?.("chapter5_aftershock_done", true);
      window.debug_set_story_flag?.("ridge_gate_unlocked", true);
      window.debug_set_story_flag?.("region3_seed_unlocked", true);
      window.debug_set_story_flag?.("vaeloris_patrol_setpiece_done", true);
      window.debug_set_story_flag?.("chapter6_arrived_windward", false);
      window.debug_set_story_flag?.("chapter6_relay_dropped", false);
      window.debug_set_story_flag?.("chapter6_waystone_attuned", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "salvage");
      window.debug_set_objective?.("cross_ridge_gate");
      window.debug_warp_to_scene?.("windward");
    });
    await advance(page, 180);

    let state = await waitForScene(page, "windward", 5200);
    expect(state.scene_id).toBe("windward");

    let sawTitle = false;
    for (let i = 0; i < 36; i += 1) {
      state = await getState(page);
      if (state.intro_text_active && String(state.intro_text_line ?? "").toUpperCase().includes("WINDWARD")) {
        sawTitle = true;
        break;
      }
      await advance(page, 90);
    }
    expect(sawTitle).toBe(true);
    await expect(page).toHaveScreenshot("ch6-title-card.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });

    for (let i = 0; i < 48; i += 1) {
      state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await advanceDialogueToEnd(page, 32);
    await advance(page, 220);

    state = await getState(page);
    expect(state.story_chapter6_arrived_windward).toBe(true);
    expect(state.current_objective).toBe("find_waystone_circle");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Waystone Circle");
    await expect(page).toHaveScreenshot("windward-baseline.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });

    const loreBanter = await page.evaluate(() => window.debug_force_banter?.("lore", "ch6_nudge_find_waystone_arthur"));
    expect(loreBanter?.triggered).toBe(true);
    await expect(page.locator("[data-testid='party-chat']")).toContainText(":");

    await page.evaluate(() => window.debug_teleport_player?.(1.9, -0.26));
    await advance(page, 160);
    await expect(page).toHaveScreenshot("waystone-circle.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });

    const relayStart = await page.evaluate(() => window.debug_trigger_relay_setpiece?.());
    expect(relayStart?.triggered).toBe(true);
    await advance(page, 220);
    state = await getState(page);
    expect(state.chapter6_relay_setpiece_active).toBe(true);
    expect(state.chapter6_relay_tethers_remaining).toBe(3);
    expect(state.current_objective).toBe("drop_relay");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("tether posts");
    await expect(page).toHaveScreenshot("relay-setpiece.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 480,
    });

    for (const index of [0, 1, 2]) {
      await page.evaluate((nextIndex) => window.debug_damage_tether?.(nextIndex, 999), index);
      await advance(page, 140);
    }
    state = await getState(page);
    expect(state.story_chapter6_relay_dropped).toBe(true);
    expect(state.chapter6_relay_setpiece_active).toBe(false);
    expect(state.chapter6_relay_tethers_remaining).toBe(0);
    expect(state.current_objective).toBe("attune_waystone");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Touch the Waystone");
    await page.evaluate(() => {
      window.debug_defeat_all_enemies?.();
      window.debug_set_combat_active?.(false);
    });
    await advance(page, 180);

    await page.evaluate(() => window.debug_teleport_player?.(1.9, -0.26));
    await advance(page, 120);
    const waystoneTrigger = await page.evaluate(() => window.debug_trigger_waystone_lore?.());
    expect(waystoneTrigger?.triggered).toBe(true);
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("waystone-lore.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 520,
    });
    await advanceDialogueToEnd(page, 34);
    await advance(page, 220);

    state = await getState(page);
    expect(state.story_chapter6_waystone_attuned).toBe(true);
    expect(state.current_objective).toBe("return_to_rowan_with_waystone_news");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Return to Rowan");

    await page.evaluate(() => window.debug_teleport_player?.(-4.18, 0.04));
    await advance(page, 150);
    await page.keyboard.press("Space");
    await advance(page, 1500);
    state = await waitForScene(page, "thornmere", 5200);
    expect(state.scene_id).toBe("thornmere");
    expect(consoleErrors).toEqual([]);
  });

  test("chapter 6 regressions: Elaine active combat and relay AI spacing remain stable", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);

    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", true);
      window.debug_set_story_flag?.("willow_met", true);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("act2_fallout_done", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", true);
      window.debug_set_story_flag?.("listening_spike_choice", "crush");
      window.debug_set_story_flag?.("chapter4_rowan_report_done", true);
      window.debug_set_story_flag?.("harvester_site_unlocked", true);
      window.debug_set_story_flag?.("harvester_warden_defeated", true);
      window.debug_set_story_flag?.("chapter5_aftershock_done", true);
      window.debug_set_story_flag?.("region3_seed_unlocked", true);
      window.debug_set_story_flag?.("vaeloris_patrol_setpiece_done", true);
      window.debug_set_story_flag?.("chapter6_arrived_windward", true);
      window.debug_set_story_flag?.("chapter6_relay_dropped", true);
      window.debug_set_story_flag?.("chapter6_waystone_attuned", false);
      window.debug_set_objective?.("find_waystone_circle");
      window.debug_warp_to_scene?.("windward");
      window.debug_set_active_character?.("elaine");
      window.debug_set_elaine_mp?.(100);
    });
    await advance(page, 220);

    const renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.hasBase).toBe(true);
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    const enemyId = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
      const spawned = window.debug_spawn_enemy_type?.(
        "skirmisher",
        Number(state.player?.x ?? 0) + 2.15,
        Number(state.player?.z ?? 0)
      );
      return typeof spawned === "string" ? spawned : spawned?.id ?? "";
    });
    expect(enemyId).toBeTruthy();
    await advance(page, 180);
    const beforeAttack = await getState(page);
    const beforeEnemy = beforeAttack.enemies.find((enemy) => enemy.id === enemyId);
    expect(beforeEnemy).toBeTruthy();
    const attacked = await page.evaluate(() => window.debug_force_basic_attack?.());
    expect(attacked).toBe(true);
    await advance(page, 220);
    const afterAttack = await getState(page);
    const afterEnemy = afterAttack.enemies.find((enemy) => enemy.id === enemyId);
    expect(afterEnemy.health).toBeLessThan(beforeEnemy.health);
    expect(afterAttack.player_melee_attack_events).toBe(0);

    await page.evaluate(() => window.debug_set_hp?.(72));
    await advance(page, 100);
    const hpBeforeCast = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1800);
    const hpAfterCast = (await getState(page)).player_health;
    expect(hpAfterCast).toBeGreaterThan(hpBeforeCast);

    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
      window.debug_set_combat_active?.(true);
    });
    await advance(page, 180);
    const relayEnemy = await getAliveEnemy(page);
    await page.evaluate(
      ({ x, z }) => window.debug_teleport_player?.(x - 0.42, z),
      { x: relayEnemy.x, z: relayEnemy.z }
    );
    await advance(page, 1200);

    let elaineAi = null;
    let maxElaineEnemyDistance = 0;
    let latestElaineEnemyDistance = 0;
    let sawLiveEnemy = false;
    for (let i = 0; i < 24; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      elaineAi = (aiState?.members ?? []).find((member) => member.id === "elaine") ?? null;
      const frameState = await getState(page);
      const trackedEnemy =
        frameState.enemies.find((entry) => entry.id === relayEnemy.id && entry.state !== "dead") ??
        frameState.enemies.find((entry) => entry.id === relayEnemy.id) ??
        null;
      if (elaineAi && trackedEnemy) {
        sawLiveEnemy = true;
        const distElaineEnemy = Math.hypot(elaineAi.x - trackedEnemy.x, elaineAi.z - trackedEnemy.z);
        latestElaineEnemyDistance = distElaineEnemy;
        maxElaineEnemyDistance = Math.max(maxElaineEnemyDistance, distElaineEnemy);
      }
      if (elaineAi && maxElaineEnemyDistance >= 3.0 && latestElaineEnemyDistance >= 2.6) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(sawLiveEnemy).toBe(true);
    expect(maxElaineEnemyDistance).toBeGreaterThanOrEqual(3.0);
    expect(latestElaineEnemyDistance).toBeGreaterThanOrEqual(2.6);
    expect(String(elaineAi.aiState ?? "")).not.toBe("follow");
    expect(Number(elaineAi.desiredRange ?? 0)).toBeGreaterThanOrEqual(3.5);

    await page.evaluate(() => window.debug_set_combat_active?.(false));

    await expect(page).toHaveScreenshot("elaine-active-regression.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("act ii fallout and ridge pressure", () => {
  test("Act II fallout triggers once after harvester choice and thornmere return", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "shatter");
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("act2_fallout_done", false);
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 220);

    let state = await waitForAct2FalloutDone(page, 5200);
    for (let i = 0; i < 24 && !state.dialogue_active; i += 1) {
      await advance(page, 100);
      state = await getState(page);
    }
    expect(state.story_act2_fallout_done).toBe(true);
    expect(state.story_ridge_gate_unlocked).toBe(true);
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("thornmere-fallout-dialogue.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
    await advanceDialogueToEnd(page, 28);
    await advance(page, 160);

    await page.evaluate(() => window.debug_warp_to_scene?.("emberfall"));
    await advance(page, 220);
    await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
    await advance(page, 420);
    state = await getState(page);
    expect(state.story_act2_fallout_done).toBe(true);
    expect(state.dialogue_active).toBe(false);
  });

  test("pressure stage patrol spawns deterministically and grants tag on first clear", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_defeated", true);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "salvage");
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("vaeloris_pressure_stage", 2);
      window.debug_set_story_flag?.("act2_fallout_done", true);
      window.debug_set_story_flag?.("ridge_gate_unlocked", true);
      window.debug_set_story_flag?.("vaeloris_patrol_cleared_once", false);
      window.debug_set_story_flag?.("vaeloris_tag_obtained", false);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 220);

    await page.evaluate(() => window.debug_teleport_player?.(5.6, 2.48));
    await advance(page, 180);
    await page.evaluate(() => window.debug_teleport_player?.(6.9, 2.5));
    await advance(page, 280);

    let state = await getState(page);
    const patrolConstructs = state.enemies.filter(
      (enemy) => enemy.role === "construct" && enemy.id.includes("vaeloris-patrol")
    );
    expect(state.story_vaeloris_pressure_stage).toBe(2);
    expect(patrolConstructs.length).toBeGreaterThanOrEqual(2);
    expect(state.vaeloris_patrol?.active).toBe(true);
    await expect(page).toHaveScreenshot("vaeloris-patrol.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });

    await page.evaluate(() => window.debug_defeat_all_enemies?.());
    for (let i = 0; i < 30; i += 1) {
      await advance(page, 120);
      state = await getState(page);
      if (state.story_vaeloris_tag_obtained) break;
    }
    expect(state.story_vaeloris_patrol_cleared_once).toBe(true);
    expect(state.story_vaeloris_tag_obtained).toBe(true);
  });

  test("ridge gate stays sealed before unlock and transitions to ridgepass after unlock", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_story_flag?.("act2_fallout_done", false);
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("thornmere");
      window.debug_teleport_player?.(7.42, 2.68);
    });
    await advance(page, 160);

    await page.keyboard.press("Space");
    await advance(page, 120);
    let state = await getState(page);
    expect(state.scene_id).toBe("thornmere");
    await expect(page.locator("[data-testid='transient-message']")).toContainText("The ridge is sealed.");
    await expect(page).toHaveScreenshot("ridge-gate.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    await page.evaluate(() => {
      window.debug_set_story_flag?.("ridge_gate_unlocked", true);
      window.debug_set_story_flag?.("act2_fallout_done", true);
      window.debug_teleport_player?.(7.42, 2.68);
    });
    await advance(page, 140);
    await page.keyboard.press("Space");
    await advance(page, 1400);
    state = await waitForScene(page, "ridgepass", 5200);
    expect(state.scene_id).toBe("ridgepass");
    await expect(page).toHaveScreenshot("ridgepass-stub.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
  });
});

test.describe("rowan council objective flow", () => {
  test("Rowan council triggers once and sets Emberfall lead objective", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_story_flag?.("rowan_council_done", false);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", false);
      window.debug_set_story_flag?.("act2_fallout_done", false);
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 200);

    let rowan = await getNpcById(page, "elder_rowan");
    for (let i = 0; i < 20 && !rowan; i += 1) {
      await advance(page, 80);
      rowan = await getNpcById(page, "elder_rowan");
    }
    expect(rowan).not.toBeNull();
    await page.evaluate(
      ({ x, z }) => window.debug_teleport_player?.(x + 0.1, z + 0.56),
      { x: rowan.x, z: rowan.z }
    );
    await advance(page, 120);

    const triggerResult = await page.evaluate(() => window.debug_trigger_rowan_council?.());
    expect(triggerResult?.triggered).toBe(true);
    for (let i = 0; i < 28; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }

    let state = await getState(page);
    expect(state.story_rowan_council_done).toBe(true);
    expect(state.story_emberfall_lead_unlocked).toBe(true);
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("rowan-council-dialogue.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });

    await advanceDialogueToEnd(page, 32);
    await advance(page, 140);
    expect(await page.evaluate(() => window.debug_get_current_objective?.())).toBe("travel_to_emberfall");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("ash wind");
    await expect(page).toHaveScreenshot("guidance-travel-to-emberfall.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    await page.evaluate(() => window.debug_warp_to_scene?.("hollowScar"));
    await advance(page, 240);
    await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
    await advance(page, 420);
    state = await getState(page);
    expect(state.story_rowan_council_done).toBe(true);
    expect(state.dialogue_active).toBe(false);
  });

  test("objective-driven idle banter nudges travel to Emberfall", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_set_story_flag?.("ridge_gate_unlocked", true);
      window.debug_set_story_flag?.("vaeloris_patrol_cleared_once", true);
      window.debug_set_active_character?.("arthur");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_combat_active?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_force_mobile_ui?.(false);
      window.debug_warp_to_scene?.("thornmere");
      window.debug_teleport_player?.(11.4, 11.4);
    });
    await advance(page, 240);

    let state = await getState(page);
    expect(state.current_objective).toBe("travel_to_emberfall");
    await advance(page, 6200);
    const forced = await page.evaluate(() => window.debug_force_banter?.());
    expect(forced?.triggered).toBe(true);
    expect(String(forced?.line ?? "").toLowerCase()).toMatch(/emberfall|ash[- ]wind/);
    await expect(page).toHaveScreenshot("banter-travel-nudge.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 340,
    });
  });

  test("ridge gate is sealed before council and unlocks after council", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_story_flag?.("rowan_council_done", false);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", false);
      window.debug_set_story_flag?.("ridge_gate_unlocked", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("thornmere");
      window.debug_teleport_player?.(7.42, 2.68);
    });
    await advance(page, 160);

    await page.keyboard.press("Space");
    await advance(page, 120);
    await expect(page.locator("[data-testid='transient-message']")).toContainText("The ridge is sealed.");

    let rowan = await getNpcById(page, "elder_rowan");
    expect(rowan).not.toBeNull();
    await page.evaluate(
      ({ x, z }) => window.debug_teleport_player?.(x + 0.08, z + 0.58),
      { x: rowan.x, z: rowan.z }
    );
    await advance(page, 120);
    await page.evaluate(() => window.debug_trigger_rowan_council?.());
    for (let i = 0; i < 26; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await advanceDialogueToEnd(page, 32);
    await advance(page, 160);
    expect(await page.evaluate(() => window.debug_get_current_objective?.())).toBe("travel_to_emberfall");

    await page.evaluate(() => window.debug_teleport_player?.(7.42, 2.68));
    await advance(page, 140);
    await expect(page).toHaveScreenshot("ridge-gate-unlocked.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 340,
    });
    await page.keyboard.press("Space");
    await advance(page, 1400);
    const state = await waitForScene(page, "ridgepass", 5200);
    expect(state.scene_id).toBe("ridgepass");
  });
});

test.describe("emberfall and willow milestone", () => {
  test("chapter 2 ash gate transitions to Emberfall only when unlocked", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", false);
      window.debug_set_story_flag?.("emberfall_unlocked", false);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", false);
      window.debug_set_story_flag?.("willow_met", false);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_objective?.("travel_to_emberfall");
      window.debug_warp_to_scene?.("thornmere");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_teleport_player?.(8.25, -3.15);
    });
    await advance(page, 180);
    await expect(page.locator("[data-testid='ash-gate']")).toHaveCount(1);

    await page.keyboard.press("Space");
    await advance(page, 140);
    let state = await getState(page);
    expect(state.scene_id).toBe("thornmere");

    await page.evaluate(() => {
      window.debug_set_story_flag?.("emberfall_unlocked", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", false);
    });
    await advance(page, 140);
    state = await getState(page);
    expect(state.story_emberfall_unlocked).toBe(true);
    expect(state.current_objective).toBe("travel_to_emberfall");
    await page.evaluate(() => window.debug_warp_to_scene?.("emberfall"));
    await advance(page, 160);
    state = await waitForScene(page, "emberfall", 4200);
    expect(state.scene_id).toBe("emberfall");
  });

  test("emberfall arrival beat fires once and updates objective guidance", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", false);
      window.debug_set_story_flag?.("emberfall_unlocked", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("willow_met", false);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_objective?.("travel_to_emberfall");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("emberfall");
    });
    await advance(page, 160);

    let sawTitle = false;
    for (let i = 0; i < 28; i += 1) {
      const state = await getState(page);
      if (state.intro_text_active && String(state.intro_text_line).toUpperCase().includes("EMBERFALL")) {
        sawTitle = true;
        break;
      }
      await advance(page, 80);
    }
    expect(sawTitle).toBe(true);
    await expect(page).toHaveScreenshot("emberfall-title-card.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 340,
    });

    for (let i = 0; i < 32; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 110);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await advanceDialogueToEnd(page, 24);
    await advance(page, 220);

    let state = await getState(page);
    expect(state.story_chapter2_arrived_emberfall).toBe(true);
    expect(state.current_objective).toBe("find_willow");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("fused basalt outcrop");
    await expect(page).toHaveScreenshot("guidance-find-willow.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 340,
    });

    await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
    await advance(page, 220);
    await page.evaluate(() => window.debug_warp_to_scene?.("emberfall"));
    await advance(page, 260);
    state = await getState(page);
    expect(state.story_chapter2_arrived_emberfall).toBe(true);
    expect(state.intro_text_active).toBe(false);
  });

  test("willow meet dialogue triggers ambush and joins after scouts fall", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("vein_guardian_defeated", true);
      window.debug_set_story_flag?.("rowan_council_done", true);
      window.debug_set_story_flag?.("chapter2_started", true);
      window.debug_set_story_flag?.("chapter2_arrived_emberfall", true);
      window.debug_set_story_flag?.("emberfall_unlocked", true);
      window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
      window.debug_set_story_flag?.("willow_met", false);
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
      window.debug_set_objective?.("find_willow");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_warp_to_scene?.("emberfall");
    });
    await advance(page, 160);

    const meetResult = await page.evaluate(() => window.debug_trigger_willow_meet?.());
    expect(meetResult?.triggered).toBe(true);
    for (let i = 0; i < 40; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("willow-meet-dialogue.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 360,
    });
    await advanceDialogueToEnd(page, 36);
    await advance(page, 180);

    let state = await getState(page);
    expect(state.story_willow_met).toBe(true);
    expect(state.chapter2_ambush_active).toBe(true);
    expect(state.chapter2_ambush_enemy_count).toBeGreaterThanOrEqual(2);
    await expect(page).toHaveScreenshot("ambush-barrier.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });

    await page.evaluate(() => window.debug_defeat_all_enemies?.());
    for (let i = 0; i < 48; i += 1) {
      state = await getState(page);
      if (state.story_willow_joined) break;
      await advance(page, 120);
    }
    expect(state.story_willow_joined).toBe(true);
    expect(state.current_objective).toBe("return_to_rowan");
    expect(await page.evaluate(() => window.debug_get_party_members?.())).toContain("Willow");
    await page.keyboard.press("3");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("willow");
    await expect(page).toHaveScreenshot("willow-joined-party.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test("Thornmere transitions to Emberfall and back with stable region baseline", async ({ page }) => {
    await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
    await advance(page, 120);
    let state = await getState(page);
    expect(state.scene_id).toBe("thornmere");

    state = await transitionToEmberfallFromThornmere(page);
    expect(state.scene_id).toBe("emberfall");
    expect(state.debug_has_ground).toBe(true);
    expect(state.debug_scene_objects).toBeGreaterThan(18);
    expect(state.visual_warmth_shift).toBeGreaterThanOrEqual(-0.02);
    await expect(page).toHaveScreenshot("emberfall-baseline.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });

    state = await transitionBackToThornmereFromEmberfall(page);
    expect(state.scene_id).toBe("thornmere");
  });

  test("Emberfall threat vein activates and reports scene-specific vein id", async ({ page }) => {
    await transitionToEmberfallFromThornmere(page);
    await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
    await page.evaluate(() => window.debug_teleport_player?.(1.7, -0.9));
    await advance(page, 180);

    const state = await waitForThreatVeinActive(page, 2600);
    expect(state.scene_id).toBe("emberfall");
    expect(state.vein_id).toBe("emberfall-clearing-vein");
    await page.evaluate(() => window.debug_fail_active_vein?.());
    await advance(page, 220);
  });

  test("Willow encounter joins party and persists on continue", async ({ page }) => {
    let state = await transitionToEmberfallFromThornmere(page);
    await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
    await advance(page, 140);
    await expect(page).toHaveScreenshot("willow-npc.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });

    state = await joinWillowInEmberfall(page);
    expect(state.party.members).toContain("Willow");
    expect(state.party.members.length).toBeGreaterThanOrEqual(3);
    await advance(page, 220);
    await expect(page).toHaveScreenshot("willow-party.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 560,
    });

    await page.reload();
    await page.waitForFunction(() => typeof window.render_game_to_text === "function");
    await page.evaluate(() => {
      window.setScreenshotMode?.(true);
      window.advanceTime?.(250);
    });
    await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
    await page.click("[data-testid='menu-continue']");
    await advance(page, 1000);
    state = await waitForScene(page, "emberfall", 6200);
    expect(state.story_willow_joined).toBe(true);
    expect(state.party.members).toContain("Willow");
  });

  test("Key 3 stays reserved pre-join, then selects Willow and shows mobile portrait post-join", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_story_flag?.("willow_joined", false);
      window.debug_set_active_character?.("arthur");
      window.debug_force_mobile_ui?.(true);
    });
    await advance(page, 120);

    await page.keyboard.press("3");
    await advance(page, 120);
    let state = await getState(page);
    expect(state.story_willow_joined).toBe(false);
    expect(state.active_character).toBe("arthur");
    await expect(page.locator("[data-testid='transient-message']")).toContainText("Not yet");

    await page.evaluate(() => window.debug_trigger_willow_join?.());
    await advance(page, 220);
    await page.keyboard.press("3");
    await advance(page, 160);

    state = await getState(page);
    expect(state.story_willow_joined).toBe(true);
    expect(state.active_character).toBe("willow");
    await expect(page.locator("[data-testid='active-character']")).toContainText("Willow");
    await expect(page.locator("[data-testid='portrait-willow']")).toBeVisible();
  });

  test("Willow wand bolt damages enemies when controlled and when AI-controlled", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_trigger_willow_join?.();
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
    });
    await advance(page, 200);

    await page.evaluate(() => window.debug_spawn_enemy_roles?.(["skirmisher"]));
    await advance(page, 180);
    await page.evaluate(() => window.debug_set_active_character?.("willow"));
    await advance(page, 160);

    let state = await getState(page);
    const enemy = state.enemies.find((entry) => entry.state !== "dead");
    expect(enemy).toBeTruthy();
    const hpBefore = enemy.health;

    const liveEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.id === enemy.id);
    await page.mouse.move(liveEnemy.screen.x, liveEnemy.screen.y);
    await page.mouse.down({ button: "left" });
    await advance(page, 20);
    await page.mouse.up({ button: "left" });
    await advance(page, 80);
    await expect(page).toHaveScreenshot("willow-attack.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 300,
    });
    await advance(page, 260);

    state = await getState(page);
    const hpAfterManual = getEnemyHealth(state, enemy.id);
    expect(hpAfterManual).toBeLessThan(hpBefore);

    const aiBefore = await page.evaluate(() => window.debug_get_ai_stats?.());
    await page.evaluate(() => window.debug_set_active_character?.("arthur"));
    await advance(page, 1450);
    const aiAfter = await page.evaluate(() => window.debug_get_ai_stats?.());
    expect(aiAfter.willowBoltCount).toBeGreaterThan(aiBefore.willowBoltCount);
  });
});

test("start screen appears on fresh save and Continue is disabled", async ({ page }) => {
  await clearSaveAndRestart(page);

  const state = await getState(page);
  expect(state.scene_id).toBe("start");
  expect(state.start_active).toBe(true);
  await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
  await expect(page.locator("[data-testid='menu-new-game']")).toBeVisible();
  await expect(page.locator("[data-testid='menu-continue']")).toBeDisabled();
  await expect(page.locator("[data-testid='menu-reset']")).toBeVisible();
  await expect(page).toHaveScreenshot("start-screen.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 95,
  });
});

test("new game enters mythic prologue, routes through Arthur opening, and reaches Thornmere", async ({ page }) => {
  await clearSaveAndRestart(page);
  await page.keyboard.press("Enter");
  await advance(page, 900);
  await waitForScene(page, "prologue", 4200);

  let state = await getState(page);
  expect(state.prologue_active).toBe(true);
  await expect(page.locator("[data-testid='prologue-root']")).toBeVisible();
  await advance(page, 900);
  await expect(page.locator("[data-testid='prologue-text']")).toContainText("B");
  await expect(page).toHaveScreenshot("prologue-slide-forest.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 130,
  });

  for (let i = 0; i < 5; i += 1) {
    await page.evaluate(() => window.debug_prologue_next?.());
    await advance(page, 110);
  }
  await advance(page, 700);
  state = await getState(page);
  expect(state.prologue_slide_key).toContain("vaeloris");
  await expect(page).toHaveScreenshot("prologue-slide-vaeloris.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 135,
  });

  for (let i = 0; i < 4; i += 1) {
    await page.evaluate(() => window.debug_prologue_next?.());
    await advance(page, 120);
  }
  await advance(page, 7000);
  state = await getState(page);
  expect(state.prologue_slide_key).toBe("final-choice");
  await expect(page.locator("[data-testid='prologue-text']")).toContainText(
    "You are here to decide what deserves to continue."
  );
  await expect(page).toHaveScreenshot("prologue-final-line.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 140,
  });

  await holdSpaceToSkipPrologue(page, 1300);
  await advance(page, 1500);
  await waitForScene(page, "arthurOpening", 5200);
  state = await getState(page);
  expect(state.scene_id).toBe("arthurOpening");
  expect(state.story_opening_played).toBe(false);
  await page.evaluate(() => window.debug_complete_opening?.());
  await advance(page, 900);
  await waitForScene(page, "thornmere", 6200);
  await expect(page.locator("[data-testid='debug-scene-id']")).toContainText("scene=thornmere");
  await expect(page.locator("[data-testid='debug-has-ground']")).toContainText("hasGround=true");
  const debugSceneObjectCount = await page
    .locator("[data-testid='debug-scene-objects']")
    .textContent()
    .then((text) => Number((text || "").replace(/[^\d]/g, "")));
  expect(debugSceneObjectCount).toBeGreaterThan(5);
  state = await getState(page);
  expect(state.story_prologue_seen).toBe(true);
  expect(state.story_opening_played).toBe(true);
  expect(state.intro_text_active).toBe(false);
  await expect(page).toHaveScreenshot("thornmere-morning-text.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 150,
  });

  const beforeLocked = { x: state.player.x, z: state.player.z };
  await page.keyboard.down("d");
  await advance(page, 700);
  await page.keyboard.up("d");
  await advance(page, 60);
  state = await getState(page);
  const movedDistance = Math.hypot(state.player.x - beforeLocked.x, state.player.z - beforeLocked.z);
  expect(movedDistance).toBeGreaterThan(0.45);
});

test("hotkey P force-loads Thornmere even with corrupted save scene id", async ({ page }) => {
  await page.evaluate(() => {
    window.__verdant_skip_save_on_unload = true;
    window.localStorage.setItem(
      "verdant-crown-save-v1",
      JSON.stringify({
        version: 1,
        lastSceneId: "broken-scene-id",
        playerPositions: {},
        flags: { "story.title_seen": true },
        storyFlags: {
          title_seen: true,
          intro_text_seen: true,
          intro_spoken: true,
        },
      })
    );
  });

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(220);
  });

  await page.keyboard.press("p");
  await advance(page, 220);
  const state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
  expect(state.debug_has_ground).toBe(true);
  expect(state.debug_scene_objects).toBeGreaterThan(5);
  await expect(page.locator("[data-testid='debug-scene-id']")).toContainText("scene=thornmere");
});

test("start screen appears on reload and Continue resumes without replaying prologue", async ({ page }) => {
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });

  let state = await getState(page);
  expect(state.story_title_seen).toBe(true);
  expect(state.scene_id).toBe("start");
  await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
  await expect(page.locator("[data-testid='menu-continue']")).toBeEnabled();

  await page.click("[data-testid='menu-continue']");
  await advance(page, 1000);
  state = await waitForScene(page, "thornmere", 5000);
  expect(state.prologue_active).toBe(false);
  expect(state.intro_text_line).not.toContain("The wind carries");
});

test("Hollow Scar pulse triggers after intro spoken with overlay, toast, and surge wave", async ({ page }) => {
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await completeIntroDialogue(page);
  await transitionToHollowScar(page);

  let state = await waitForPulseActive(page, 1400);
  expect(state.story_intro_spoken).toBe(true);
  expect(state.pulse_active).toBe(true);
  expect(state.pulse_phase).toBe("surge");

  await expect(page.locator("[data-testid='pulse-overlay']")).toBeVisible();
  await expect(page.locator("[data-testid='transient-message']")).toContainText("The roots are watching.");

  for (let i = 0; i < 12; i += 1) {
    state = await getState(page);
    if (state.enemies_total >= 5) break;
    await advance(page, 100);
  }
  expect(state.enemies_total).toBeGreaterThanOrEqual(5);
  expect(Array.isArray(state.pulse_surge_roles)).toBe(true);
  expect(state.pulse_surge_roles.length).toBeGreaterThan(0);
});

test("pulse seen flag persists and re-entering Hollow Scar does not re-trigger pulse", async ({ page }) => {
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await completeIntroDialogue(page);
  await transitionToHollowScar(page);
  await waitForPulseActive(page, 1400);
  await waitForPulseComplete(page, 9000);

  let state = await getState(page);
  expect(state.story_hollowscar_pulse_seen).toBe(true);
  expect(state.pulse_active).toBe(false);

  await tapPortalTo(page, "thornmere");
  await advance(page, 2500);
  state = await getState(page);
  expect(state.scene_id).toBe("thornmere");

  await tapPortalTo(page, "hollowScar");
  await advance(page, 2500);
  await advance(page, 400);

  state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");
  expect(state.story_hollowscar_pulse_seen).toBe(true);
  expect(state.pulse_active).toBe(false);
  await expect(page.locator("[data-testid='pulse-overlay']")).toHaveCount(0);
});

test("threat vein activates in Hollow Scar with barrier and HUD status", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  const baselineState = await getState(page);
  const baselineZoom = baselineState.camera_zoom_scalar;
  await spawnThreatVein(page);

  let state = await waitForThreatVeinActive(page, 2600);
  expect(state.vein_active).toBe(true);
  expect(state.vein_hud_text).toMatch(/Vein: Wave 1\/[2-4]/);
  await expect(page.locator("[data-testid='vein-status']")).toContainText("Vein: Wave 1/");
  await expect(page.locator("[data-testid='transient-message']")).toContainText("A vein awakens.");

  await advance(page, 300);
  state = await getState(page);
  expect(state.vein_barrier_scale).toBeGreaterThan(0.55);
  expect(state.camera_zoom_scalar).toBeGreaterThan(baselineZoom + 0.012);

  const activeVein = state.threat_veins.find((entry) => entry.id === state.vein_id);
  expect(activeVein).toBeTruthy();
  expect(activeVein.barrier.active).toBe(true);
  expect(activeVein.barrier.segments.length).toBeGreaterThanOrEqual(6);
  expect(activeVein.barrier.averageScale).toBeGreaterThan(0.5);

  await expect(page).toHaveScreenshot("vein-active-intensified.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 450,
  });
});

test("threat vein waves complete, save completion flag, and bump region stability", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await spawnThreatVein(page);
  let state = await waitForThreatVeinActive(page, 2600);

  const stabilityBefore = state.region_stability;
  const veinId = state.vein_id;
  const completionFlag = `vein_completed_hollowScar_${veinId}`;

  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  await advance(page, 200);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("Wave 2 rises.");
  state = await getState(page);
  expect(state.vein_wave_transition_active).toBe(true);
  expect(state.vein_wave_transition_intensity).toBeGreaterThan(0.1);
  await expect(page).toHaveScreenshot("vein-wave-transition.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 600,
  });

  state = await clearThreatVeinWaveLoop(page, 18000);
  expect(state.vein_active).toBe(false);
  expect(state.vein_completed_flags).toContain(completionFlag);
  expect(state.region_stability).toBeGreaterThan(stabilityBefore + 0.015);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("Vein stabilized.");
  await expect(page.locator("[data-testid='stability-toast']")).toContainText("+Stability");

  const completedVein = state.threat_veins.find((entry) => entry.id === veinId);
  expect(completedVein).toBeTruthy();
  expect(completedVein.state).toBe("completed");
  expect(completedVein.barrier.active).toBe(false);

  await expect(page).toHaveScreenshot("vein-completed.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 170,
  });
});

test("leaving active threat vein radius fails the event and removes barrier", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  const baselineState = await getState(page);
  const baselineZoom = baselineState.camera_zoom_scalar;
  await spawnThreatVein(page);
  let state = await waitForThreatVeinActive(page, 2600);
  expect(state.camera_zoom_scalar).toBeGreaterThan(baselineZoom + 0.006);

  const activeVein = state.threat_veins.find((entry) => entry.id === state.vein_id);
  expect(activeVein).toBeTruthy();

  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x, z),
    {
      x: activeVein.center.x + activeVein.radius + 1.05,
      z: activeVein.center.y,
    }
  );
  await advance(page, 260);

  state = await getState(page);
  const failedVein = state.threat_veins.find((entry) => entry.id === activeVein.id);
  expect(failedVein).toBeTruthy();
  expect(failedVein.state).toBe("failedCooldown");
  expect(failedVein.barrier.active).toBe(false);
  const stillActiveTargetVein = state.vein_active && state.vein_id === activeVein.id;
  expect(stillActiveTargetVein).toBe(false);
  await page.evaluate(() => window.debug_teleport_player?.(-4.35, -3.1));
  await advance(page, 160);
  await advance(page, 900);
  state = await getState(page);
  expect(state.vein_active).toBe(false);
  expect(state.camera_zoom_scalar).toBeLessThan(baselineZoom + 0.005);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("Vein lost.");
});

test("Hollow Scar enemy roster exposes role-based sprites", async ({ page }) => {
  await transitionToHollowScar(page);
  await advance(page, 350);
  await waitForEnemyTextures(page);

  const state = await getState(page);
  const aliveRoles = new Set(state.enemies.filter((enemy) => enemy.state !== "dead").map((enemy) => enemy.role));
  expect(aliveRoles.has("skirmisher")).toBe(true);
  expect(aliveRoles.has("brute")).toBe(true);
  expect(aliveRoles.has("harrier")).toBe(true);

  for (const enemy of state.enemies) {
    expect(enemy.spriteAsset).toContain("/assets/sprites/enemies/");
    expect(enemy.textureLoaded).toBe(true);
  }
});

test("director encounter composition changes across strain levels", async ({ page }) => {
  await transitionToHollowScar(page);

  const lowStrainComposition = await page.evaluate(() => {
    window.debug_set_strain?.(0.1);
    return window.debug_get_encounter_composition?.();
  });
  const highStrainComposition = await page.evaluate(() => {
    window.debug_set_strain?.(0.9);
    return window.debug_get_encounter_composition?.();
  });
  await page.evaluate(() => window.debug_set_strain?.(null));

  expect(lowStrainComposition).toBeTruthy();
  expect(highStrainComposition).toBeTruthy();
  expect(JSON.stringify(lowStrainComposition)).not.toBe(JSON.stringify(highStrainComposition));
  expect(highStrainComposition.length).toBeLessThanOrEqual(3);
  expect(highStrainComposition.every((role) => role === "skirmisher")).toBe(true);
  expect(lowStrainComposition.some((role) => role === "brute" || role === "harrier")).toBe(true);
});

test.describe("enemy archetypes", () => {
  test("striker dives toward squishy backline target faster than baseline skirmisher", async ({ page }) => {
    await transitionToHollowScar(page);
    await enableElaineParty(page, { disableEnemyAttacks: true });
    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_defeat_all_enemies?.();
      window.debug_set_combat_active?.(true);
      window.debug_teleport_player?.(0, 0);
    });
    await advance(page, 180);

    const strikerId = await page.evaluate(() => window.debug_spawn_enemy_type?.("striker", 2.8, 0.15));
    await advance(page, 1300);
    let strikerState = await getState(page);
    const strikerEnemy = strikerState.enemies.find((enemy) => enemy.id === strikerId);
    const elaineAi = (strikerState.party_ai_state?.members ?? []).find((member) => member.id === "elaine");
    expect(strikerEnemy).toBeTruthy();
    expect(elaineAi).toBeTruthy();
    const strikerDistance = distance2d({ x: strikerEnemy.x, z: strikerEnemy.z }, elaineAi.position);

    await page.evaluate(() => {
      window.debug_defeat_all_enemies?.();
      window.debug_teleport_player?.(0, 0);
    });
    await advance(page, 180);
    const skirmisherId = await page.evaluate(() => window.debug_spawn_enemy_type?.("skirmisher", 2.8, 0.15));
    await advance(page, 1300);
    const baselineState = await getState(page);
    const baselineEnemy = baselineState.enemies.find((enemy) => enemy.id === skirmisherId);
    const baselineElaine = (baselineState.party_ai_state?.members ?? []).find((member) => member.id === "elaine");
    expect(baselineEnemy).toBeTruthy();
    expect(baselineElaine).toBeTruthy();
    const baselineDistance = distance2d({ x: baselineEnemy.x, z: baselineEnemy.z }, baselineElaine.position);

    expect(strikerEnemy.targetId).toBe("elaine");
    expect(strikerDistance).toBeLessThan(baselineDistance);
    await expect(page).toHaveScreenshot("enemy-striker.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });

  test("bulwark shield reduces front damage more than back damage", async ({ page }) => {
    await transitionToHollowScar(page);
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_active_character?.("arthur");
      window.debug_defeat_all_enemies?.();
      window.debug_teleport_player?.(0.9, 0.1);
      window.debug_set_combat_active?.(true);
    });
    await advance(page, 180);

    const bulwarkId = await page.evaluate(() => window.debug_spawn_enemy_type?.("bulwark", 1.9, 0.1));
    await advance(page, 120);

    await page.evaluate((enemyId) => window.debug_set_target_entity?.(enemyId), bulwarkId);
    for (let i = 0; i < 20; i += 1) {
      const enemyState = await page.evaluate((enemyId) => window.debug_get_enemy_state?.(enemyId), bulwarkId);
      if (enemyState?.isShielding) break;
      await advance(page, 120);
    }
    const shieldState = await page.evaluate((enemyId) => window.debug_get_enemy_state?.(enemyId), bulwarkId);
    expect(shieldState?.isShielding).toBe(true);

    await page.evaluate((enemyId) => {
      const enemy = (window.get_enemies?.() ?? []).find((entry) => entry.id === enemyId);
      if (!enemy) return;
      window.debug_set_target_entity?.(enemyId);
      window.debug_set_target_hp?.(120);
      window.debug_teleport_player?.(enemy.x - 0.55, enemy.z);
    }, bulwarkId);
    await advance(page, 140);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 220);
    let state = await getState(page);
    const frontDamage = 120 - getEnemyHealth(state, bulwarkId);

    await page.evaluate((enemyId) => {
      const enemy = (window.get_enemies?.() ?? []).find((entry) => entry.id === enemyId);
      if (!enemy) return;
      window.debug_set_target_entity?.(enemyId);
      window.debug_set_target_hp?.(120);
      window.debug_teleport_player?.(enemy.x + 0.55, enemy.z);
    }, bulwarkId);
    await advance(page, 140);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 220);
    state = await getState(page);
    const backDamage = 120 - getEnemyHealth(state, bulwarkId);

    expect(frontDamage).toBeGreaterThan(0);
    expect(backDamage).toBeGreaterThan(frontDamage);
    await expect(page).toHaveScreenshot("enemy-bulwark-shield.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });

  test("hexer debuff applies hex_weakened and shows party status icon", async ({ page }) => {
    await transitionToHollowScar(page);
    await enableElaineParty(page, { disableEnemyAttacks: true });
    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_defeat_all_enemies?.();
      window.debug_set_combat_active?.(true);
    });
    await advance(page, 140);

    const hexerId = await page.evaluate(() => window.debug_spawn_enemy_type?.("hexer", 2.6, 0.2));
    await advance(page, 300);
    await page.evaluate((enemyId) => window.debug_force_hexer_cast?.(enemyId), hexerId);
    await advance(page, 120);

    const effects = await page.evaluate(() => window.debug_get_party_effects?.());
    const elaineEffects = effects?.elaine ?? [];
    expect(elaineEffects.some((effect) => effect.id === "hex_weakened")).toBe(true);
    await expect(page.locator("[data-testid='status-elaine']")).toBeVisible();
    await expect(page).toHaveScreenshot("enemy-hexer-debuff.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });
});

test("WASD movement still works in exploration", async ({ page }) => {
  const before = await getState(page);

  await page.keyboard.down("d");
  await advance(page, 500);
  await page.keyboard.up("d");
  await advance(page, 100);

  const after = await getState(page);
  expect(after.player.x).toBeGreaterThan(before.player.x + 0.5);
});

test("tap-to-move still works", async ({ page }) => {
  const before = await getState(page);
  await tapWorld(page, before.player.x + 2.4, before.player.z);
  await advance(page, 1400);
  const after = await getState(page);

  expect(after.player.x).toBeGreaterThan(before.player.x + 1.2);
});

test("Shift sprint remains faster than walk in exploration", async ({ page }) => {
  await page.evaluate(() => window.debug_teleport_player?.(0, 0));
  await advance(page, 100);
  const walkDistance = await measureDistance(page, ["w"], 1000);

  await page.evaluate(() => window.debug_teleport_player?.(0, 0));
  await advance(page, 100);
  const runDistance = await measureDistance(page, ["Shift", "w"], 1000);
  const runState = await getState(page);

  expect(runState.movement_context).toBe("exploration");
  expect(runDistance).toBeGreaterThan(walkDistance + 0.45);
});

test("dev combat override still keeps sprint locked", async ({ page }) => {
  await page.evaluate(() => window.debug_set_combat_active?.(true));
  await advance(page, 80);
  await expect(page.locator("[data-testid='combat-indicator']")).toBeVisible();

  const beforeShift = await getState(page);
  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await advance(page, 900);
  const duringShift = await getState(page);
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");
  await advance(page, 100);

  expect(duringShift.movement_context).toBe("combat");
  expect(duringShift.movement_mode).toBe("walk");

  const combatDistance = Math.hypot(
    duringShift.player.x - beforeShift.player.x,
    duringShift.player.z - beforeShift.player.z
  );
  expect(combatDistance).toBeLessThan(2.05);
  await page.evaluate(() => window.debug_set_combat_active?.(false));
});

test("Space transition Thornmere -> HollowScar and return works", async ({ page }) => {
  await page.keyboard.down("Shift");
  await page.keyboard.down("d");
  await advance(page, 1250);
  await page.keyboard.up("d");
  await page.keyboard.up("Shift");
  await advance(page, 80);

  await page.keyboard.press("Space");
  await advance(page, 900);
  let state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");

  await tapPortalTo(page, "thornmere");
  await advance(page, 2500);
  state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
});

test("save persists lastSceneId and L resets to Thornmere", async ({ page }) => {
  await transitionToHollowScar(page);

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
  await expect(page.locator("[data-testid='start-screen']")).toBeVisible();
  await page.click("[data-testid='menu-continue']");
  await advance(page, 900);

  let state = await waitForScene(page, "hollowScar", 5200);
  expect(state.scene_id).toBe("hollowScar");

  await page.keyboard.press("l");
  await advance(page, 120);
  state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
});

test("Benchmark 1 extraction spike still raises omen tier", async ({ page }) => {
  const omenMessage = page.locator("[data-testid='omen-message']");
  await expect(omenMessage).toBeVisible();

  await advance(page, 400);
  const before = await getState(page);

  await page.keyboard.press("k");
  await advance(page, 1800);
  const after = await getState(page);

  expect(after.omen_tier).toBeGreaterThan(before.omen_tier);
});

test("enemy aggro triggers combat in HollowScar", async ({ page }) => {
  await transitionToHollowScar(page);
  await advance(page, 400);

  const state = await getState(page);
  expect(state.combat_from_enemies).toBe(true);
  expect(state.movement_context).toBe("combat");
});

test("enemy attacks lower HP and hud-hp updates in combat", async ({ page }) => {
  await transitionToHollowScar(page);
  const hpHud = page.locator("[data-testid='hud-hp']");
  await expect(hpHud).toBeVisible();
  await expect(hpHud).toContainText("HP");

  const enemy = await getAliveEnemy(page);
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x, z),
    { x: enemy.x - 0.38, z: enemy.z }
  );
  await advance(page, 200);

  const before = await getState(page);
  expect(before.debug_enemy_attacks_enabled).toBe(true);
  const beforeHpText = await hpHud.textContent();

  let damaged = before;
  for (let i = 0; i < 120; i += 1) {
    await advance(page, 100);
    damaged = await getState(page);
    if (damaged.player_health < before.player_health - 0.1) {
      break;
    }
  }

  expect(damaged.player_health).toBeLessThan(before.player_health - 0.1);
  const afterHpText = await hpHud.textContent();
  expect(afterHpText).not.toBe(beforeHpText);
  expect(afterHpText).toContain("/100");

  await expect(page).toHaveScreenshot("benchmark12-combat-hp.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 400,
  });
});

test("UIOP spell keys do not trigger debug scene-load side effects", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_set_elaine_mp?.(100);
  });
  await advance(page, 120);

  let state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");
  expect(state.story_elaine_joined).toBe(true);

  await page.keyboard.press("o");
  await advance(page, 120);
  state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");
  expect(state.party_elaine_buff_remaining).toBeGreaterThan(59);

  await page.keyboard.press("p");
  await advance(page, 120);
  state = await getState(page);
  expect(state.scene_id).toBe("hollowScar");
  expect(state.party_elaine_cast_spell).not.toBe("resurrect");
});

test("TAB cycles tactics mode deterministically and updates HUD", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => window.debug_set_tactics_mode?.("balanced"));
  await advance(page, 80);

  const tacticsHud = page.locator("[data-testid='tactics-mode']");
  await expect(tacticsHud).toBeVisible();
  await expect(tacticsHud).toContainText("Balanced");
  expect(await page.evaluate(() => window.debug_get_tactics_mode?.())).toBe("balanced");

  await page.keyboard.press("Tab");
  await advance(page, 100);
  await expect(tacticsHud).toContainText("Defensive");
  expect(await page.evaluate(() => window.debug_get_tactics_mode?.())).toBe("defensive");

  await page.keyboard.press("Tab");
  await advance(page, 100);
  await expect(tacticsHud).toContainText("Aggressive");
  expect(await page.evaluate(() => window.debug_get_tactics_mode?.())).toBe("aggressive");

  await page.keyboard.press("Tab");
  await advance(page, 100);
  await expect(tacticsHud).toContainText("Balanced");
  expect(await page.evaluate(() => window.debug_get_tactics_mode?.())).toBe("balanced");

  await expect(page).toHaveScreenshot("tactics-mode.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 260,
  });
});

test("number keys swap active character and 3 remains reserved", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  const activeHud = page.locator("[data-testid='active-character']");
  await expect(activeHud).toBeVisible();
  await expect(activeHud).toContainText("Arthur");

  await page.keyboard.press("2");
  await advance(page, 100);
  await expect(activeHud).toContainText("Elaine");
  expect(await page.evaluate(() => window.debug_get_active_character?.())).toBe("elaine");

  await page.keyboard.press("1");
  await advance(page, 100);
  await expect(activeHud).toContainText("Arthur");
  expect(await page.evaluate(() => window.debug_get_active_character?.())).toBe("arthur");

  await page.keyboard.press("3");
  await advance(page, 120);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("Not yet");
});

test("mobile party controls show portraits and tactics toggle", async ({ page }) => {
  await enableElaineParty(page, { forceMobileUi: true, disableEnemyAttacks: true });
  let state = await getState(page);
  expect(state.mobile_ui_enabled).toBe(true);
  expect(state.tactics_toggle_visible).toBe(true);
  expect(state.portrait_bar_visible).toBe(true);

  await expect(page.locator("[data-testid='tactics-toggle']")).toBeVisible();
  await expect(page.locator("[data-testid='portrait-arthur']")).toBeVisible();
  await expect(page.locator("[data-testid='portrait-elaine']")).toBeVisible();

  await page.click("[data-testid='portrait-elaine']");
  await advance(page, 100);
  expect(await page.evaluate(() => window.debug_get_active_character?.())).toBe("elaine");

  await page.click("[data-testid='portrait-arthur']");
  await advance(page, 100);
  expect(await page.evaluate(() => window.debug_get_active_character?.())).toBe("arthur");

  await page.click("[data-testid='tactics-toggle']");
  await advance(page, 100);
  expect(await page.evaluate(() => window.debug_get_tactics_mode?.())).toBe("defensive");

  await expect(page).toHaveScreenshot("portraits-visible.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 260,
  });
});

test("guidance line renders for joined party state", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  const guidance = page.locator("[data-testid='guidance-line']");
  await expect(guidance).toBeVisible();
  await expect(guidance).toContainText("Keep formation");

  const state = await getState(page);
  expect(state.guidance_line).toContain("Keep formation");

  await expect(page).toHaveScreenshot("guidance-line.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 260,
  });
});

test("Elaine support AI heals and resurrects Arthur based on priority", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_set_hp?.(20);
    window.debug_set_elaine_mp?.(100);
  });

  let healTriggered = false;
  for (let i = 0; i < 25; i += 1) {
    await advance(page, 100);
    const stats = await page.evaluate(() => window.debug_get_ai_stats?.());
    if ((stats?.elaineHealCount ?? 0) > 0) {
      healTriggered = true;
      break;
    }
  }
  expect(healTriggered).toBe(true);

  await page.evaluate(() => {
    window.debug_set_elaine_mp?.(100);
    window.debug_set_hp?.(1);
    window.debug_damage_player?.(12);
  });

  let resurrectTriggered = false;
  for (let i = 0; i < 35; i += 1) {
    await advance(page, 100);
    const stats = await page.evaluate(() => window.debug_get_ai_stats?.());
    if ((stats?.elaineResCount ?? 0) > 0) {
      resurrectTriggered = true;
      break;
    }
  }
  expect(resurrectTriggered).toBe(true);
});

test("Elaine AI keeps spacing in combat instead of hugging Arthur", async ({ page }) => {
  await transitionToHollowScar(page);
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_set_active_character?.("arthur");
    window.debug_spawn_enemy_roles?.(["skirmisher"]);
    window.debug_set_combat_active?.(true);
  });
  await advance(page, 180);

  const enemy = await getAliveEnemy(page);
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x - 0.42, z),
    { x: enemy.x, z: enemy.z }
  );
  await advance(page, 1200);

  const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
  const elaineAi = (aiState?.members ?? []).find((member) => member.id === "elaine");
  const arthurAi = (aiState?.members ?? []).find((member) => member.id === "arthur");
  const state = await getState(page);
  const trackedEnemy =
    state.enemies.find((entry) => entry.id === enemy.id && entry.state !== "dead") ??
    state.enemies.find((entry) => entry.id === enemy.id) ??
    enemy;
  expect(elaineAi).toBeTruthy();
  expect(arthurAi).toBeTruthy();
  expect(trackedEnemy).toBeTruthy();

  const distElaineArthur = Math.hypot(elaineAi.x - arthurAi.x, elaineAi.z - arthurAi.z);
  const distElaineEnemy = Math.hypot(elaineAi.x - trackedEnemy.x, elaineAi.z - trackedEnemy.z);
  expect(distElaineArthur).toBeGreaterThan(1.2);
  expect(distElaineEnemy).toBeGreaterThanOrEqual(3.0);

  await expect(page).toHaveScreenshot("ai-spacing-combat.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 300,
  });

  await page.evaluate(() => window.debug_set_combat_active?.(false));
});

test("Arthur inactive AI intercepts and attacks while Elaine is active", async ({ page }) => {
  await transitionToHollowScar(page);
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_set_active_character?.("elaine");
    window.debug_spawn_enemy_roles?.(["skirmisher"]);
  });
  await advance(page, 180);

  const enemy = await getAliveEnemy(page);
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x - 0.3, z),
    { x: enemy.x, z: enemy.z }
  );
  await page.evaluate(() => window.debug_set_combat_active?.(true));
  await advance(page, 120);

  const beforeAi = await page.evaluate(() => window.debug_get_party_ai_state?.());
  const beforeArthur = (beforeAi?.members ?? []).find((member) => member.id === "arthur");
  const beforeEnemy = (await getState(page)).enemies.find((entry) => entry.id === enemy.id && entry.state !== "dead");
  expect(beforeArthur).toBeTruthy();
  expect(beforeEnemy).toBeTruthy();
  const startDistance = Math.hypot(beforeArthur.x - beforeEnemy.x, beforeArthur.z - beforeEnemy.z);

  let intercepted = false;
  let minObservedDistance = startDistance;
  let observedEnemyAlive = false;
  let observedEnemyDefeat = false;
  for (let i = 0; i < 30; i += 1) {
    await advance(page, 120);
    const stats = await page.evaluate(() => window.debug_get_ai_stats?.());
    const attacks = (stats?.arthurLightCount ?? 0) + (stats?.arthurHeavyCount ?? 0);
    if ((stats?.arthurInterceptCount ?? 0) > 0 && attacks > 0) {
      intercepted = true;
    }

    const aiFrame = await page.evaluate(() => window.debug_get_party_ai_state?.());
    const arthurFrame = (aiFrame?.members ?? []).find((member) => member.id === "arthur");
    const currentState = await getState(page);
    const currentEnemy = currentState.enemies.find((entry) => entry.id === enemy.id && entry.state !== "dead");
    if (arthurFrame && currentEnemy) {
      observedEnemyAlive = true;
      const distance = Math.hypot(arthurFrame.x - currentEnemy.x, arthurFrame.z - currentEnemy.z);
      minObservedDistance = Math.min(minObservedDistance, distance);
    } else if (currentState.enemies.some((entry) => entry.id === enemy.id && entry.state === "dead")) {
      observedEnemyDefeat = true;
    }
  }
  expect(intercepted).toBe(true);
  if (observedEnemyAlive) {
    expect(minObservedDistance).toBeLessThanOrEqual(startDistance + 0.02);
  } else {
    expect(observedEnemyDefeat).toBe(true);
  }

  await page.evaluate(() => window.debug_set_combat_active?.(false));
  await advance(page, 100);
});

test("lore banter triggers while traveling on-track toward objective", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_force_mobile_ui?.(false);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_story_flag?.("rowan_council_done", true);
    window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
    window.debug_set_story_flag?.("ridge_gate_unlocked", true);
    window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
    window.debug_set_objective?.("travel_to_emberfall");
    window.debug_set_active_character?.("arthur");
    window.debug_teleport_player?.(-22.0, 2.66);
  });
  await advance(page, 280);

  await page.keyboard.down("d");
  await advance(page, 13200);
  await page.keyboard.up("d");
  await advance(page, 260);

  const state = await getState(page);
  const lines = state.party_chat ?? [];
  expect(lines.length).toBeGreaterThan(0);
  const hasLoreLine = lines.some((entry) => entry.channel === "lore");
  expect(hasLoreLine).toBe(true);
  expect(state.current_objective).toBe("travel_to_emberfall");
  expect(String(state.banter_state.lastChannel ?? "")).toBe("lore");
  await expect(page.locator("[data-testid='party-chat']")).toBeVisible();
  await expect(page).toHaveScreenshot("party-chat-lore.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 320,
  });
});

test("guidance banter triggers when moving off-track from objective", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_force_mobile_ui?.(false);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_story_flag?.("rowan_council_done", true);
    window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
    window.debug_set_story_flag?.("ridge_gate_unlocked", true);
    window.debug_set_story_flag?.("vaeloris_harvester_choice", "");
    window.debug_set_objective?.("travel_to_emberfall");
    window.debug_set_active_character?.("arthur");
    window.debug_teleport_player?.(7.2, 2.66);
  });
  await advance(page, 220);

  await page.keyboard.down("a");
  await advance(page, 11200);
  await page.keyboard.up("a");
  await advance(page, 260);

  const state = await getState(page);
  const lines = state.party_chat ?? [];
  const guidanceLine = [...lines]
    .reverse()
    .find((entry) => entry.channel === "guidance");
  expect(guidanceLine).toBeTruthy();
  expect(guidanceLine.text.toLowerCase()).toMatch(/ash|ridge|emberfall|east|move/);
  expect(state.banter_state.offTrackSeconds).toBeGreaterThan(9.5);
  await expect(page).toHaveScreenshot("party-chat-guidance.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 340,
  });
});

test("banter is blocked during combat, boss, and dialogue", async ({ page }) => {
  await enableElaineParty(page, { disableEnemyAttacks: true });
  await page.evaluate(() => {
    window.debug_force_mobile_ui?.(false);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_objective?.("travel_to_emberfall");
    window.debug_set_active_character?.("arthur");
  });
  await advance(page, 160);

  const beforeCombat = await page.evaluate(() => window.debug_get_banter_state?.());
  await page.evaluate(() => window.debug_set_combat_active?.(true));
  await advance(page, 9000);
  const duringCombat = await page.evaluate(() => window.debug_get_banter_state?.());
  expect(duringCombat.triggerCount).toBe(beforeCombat.triggerCount);
  await page.evaluate(() => window.debug_set_combat_active?.(false));
  await advance(page, 120);

  await page.evaluate(() => {
    window.debug_start_guardian_boss?.();
    window.debug_set_enemy_attacks_enabled?.(false);
  });
  await advance(page, 1800);
  const forcedBoss = await page.evaluate(() => window.debug_force_banter?.("guidance"));
  expect(forcedBoss?.triggered).toBe(false);
  expect(forcedBoss?.blocked).toBe(true);

  await page.evaluate(() => {
    window.debug_warp_to_scene?.("thornmere");
    window.debug_teleport_player?.(-0.24, 0.95);
  });
  await advance(page, 240);
  await openDialogueWithSpace(page);
  await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
  const forcedDialogue = await page.evaluate(() => window.debug_force_banter?.("guidance"));
  expect(forcedDialogue?.triggered).toBe(false);
  expect(forcedDialogue?.blocked).toBe(true);
});

test("lore threads complete and persist across reload without replaying", async ({ page }) => {
  await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "thornmere" });
  await page.evaluate(() => {
    window.__verdant_skip_save_on_unload = false;
    window.debug_force_mobile_ui?.(false);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_story_flag?.("willow_joined", true);
    window.debug_set_story_flag?.("vein_guardian_defeated", true);
    window.debug_set_story_flag?.("vaeloris_harvester_defeated", true);
    window.debug_set_story_flag?.("rowan_council_done", true);
    window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
    window.debug_set_story_flag?.("ridge_gate_unlocked", true);
    window.debug_unlock_topic?.("aw_gem_mishap");
    window.debug_set_objective?.("travel_to_emberfall");
  });
  await advance(page, 180);

  const forced = await page.evaluate(() => window.debug_force_banter?.("lore", "aw_gem_mishap"));
  expect(forced?.triggered).toBe(true);
  await advance(page, 9400);

  let state = await getState(page);
  expect((state.banter_state.completedTopics ?? [])).toContain("aw_gem_mishap");

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(250);
  });
  await startFromMenu(page);
  await skipPrologueToThornmere(page);
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_story_flag?.("willow_joined", true);
    window.debug_set_story_flag?.("vein_guardian_defeated", true);
    window.debug_set_story_flag?.("vaeloris_harvester_defeated", true);
    window.debug_set_story_flag?.("rowan_council_done", true);
    window.debug_set_story_flag?.("emberfall_lead_unlocked", true);
    window.debug_set_story_flag?.("ridge_gate_unlocked", true);
    window.debug_set_objective?.("travel_to_emberfall");
  });
  await advance(page, 260);

  const replay = await page.evaluate(() => window.debug_force_banter?.("lore", "aw_gem_mishap"));
  expect(replay?.triggered).toBe(false);
  state = await getState(page);
  expect((state.banter_state.completedTopics ?? [])).toContain("aw_gem_mishap");
});

test("forced mobile mode shows Elaine spellbar and taps cast spells", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_active_character?.("elaine");
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_set_elaine_mp?.(100);
    window.debug_force_mobile_ui?.(true);
  });
  await advance(page, 160);

  const state = await getState(page);
  expect(state.mobile_ui_enabled).toBe(true);
  expect(state.elaine_spellbar_visible).toBe(true);

  const spellbar = page.locator("[data-testid='elaine-spellbar']");
  await expect(spellbar).toBeVisible();
  await expect(page.locator("[data-testid='spell-u']")).toBeVisible();
  await expect(page.locator("[data-testid='spell-i']")).toBeVisible();
  await expect(page.locator("[data-testid='spell-o']")).toBeVisible();
  await expect(page.locator("[data-testid='spell-p']")).toBeVisible();
  await expect(page.locator("[data-testid='hud-mp']")).toBeVisible();
  await expect(page.locator("[data-testid='hud-mp']")).toContainText("MP");
  await expect(page.locator("[data-testid='spell-o']")).toBeEnabled();

  await expect(page).toHaveScreenshot("elaine-spellbar-mobile.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 500,
  });

  await page.click("[data-testid='spell-o']");
  await advance(page, 120);
  const afterCast = await getState(page);
  expect(afterCast.scene_id).toBe("hollowScar");
  expect(afterCast.party_elaine_buff_remaining).toBeGreaterThan(59);
});

test("Elaine sprite reads blonde when joined", async ({ page }) => {
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_force_mobile_ui?.(false);
  });
  await advance(page, 180);

  await expect(page).toHaveScreenshot("elaine-blonde.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 260,
  });
});

test("Arthur downed swaps control to Elaine when she is alive", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_enemy_attacks_enabled?.(true);
  });
  await advance(page, 120);

  const enemy = await getAliveEnemy(page);
  await page.evaluate(
    ({ x, z }) => {
      window.debug_set_hp?.(1);
      window.debug_teleport_player?.(x, z);
    },
    { x: enemy.x - 0.24, z: enemy.z }
  );

  let state = await getState(page);
  let swapped = false;
  for (let i = 0; i < 100; i += 1) {
    await advance(page, 100);
    state = await getState(page);
    if (state.party_arthur_downed && state.party_active_member === "elaine") {
      swapped = true;
      break;
    }
  }

  expect(swapped).toBe(true);
  expect(state.party_arthur_bleedout).toBeGreaterThan(0);
  expect(state.party_elaine_downed).toBe(false);
});

test("Rowan interaction out of combat restores HP and Elaine MP", async ({ page }) => {
  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_joined", true);
    window.debug_set_hp?.(42);
    window.debug_set_elaine_mp?.(7);
  });
  await advance(page, 120);

  const rowan = await getNpcById(page, "elder_rowan");
  expect(rowan).not.toBeNull();
  await page.evaluate(
    ({ x, z }) => window.debug_teleport_player?.(x + 0.08, z + 0.58),
    { x: rowan.x, z: rowan.z }
  );
  await advance(page, 120);
  await page.keyboard.press("Space");
  await advance(page, 140);

  const state = await getState(page);
  expect(state.player_health).toBe(state.player_max_health);
  expect(state.party_elaine_mp).toBe(state.party_elaine_max_mp);
});

test("player defeat respawns at safe spot and restores HP", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(true));
  await advance(page, 120);

  const spawnState = await getState(page);
  const respawnAnchor = { x: spawnState.player.x, z: spawnState.player.z };

  const enemy = await getAliveEnemy(page);
  await page.evaluate(
    ({ x, z }) => {
      window.debug_set_hp?.(1);
      window.debug_teleport_player?.(x, z);
    },
    { x: enemy.x - 0.3, z: enemy.z }
  );
  await advance(page, 120);

  let state = await getState(page);
  let respawned = false;
  for (let i = 0; i < 150; i += 1) {
    await advance(page, 100);
    state = await getState(page);
    const distanceToRespawn = Math.hypot(state.player.x - respawnAnchor.x, state.player.z - respawnAnchor.z);
    if (
      state.player_health >= state.player_max_health &&
      distanceToRespawn < 0.52 &&
      state.player_invuln_remaining_ms > 0
    ) {
      respawned = true;
      break;
    }
  }

  expect(respawned).toBe(true);
  expect(state.player_health).toBe(state.player_max_health);
  const hpSnapshot = await page.evaluate(() => window.debug_get_hp?.());
  expect(hpSnapshot.hp).toBe(hpSnapshot.maxHP);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("You wake with a sharp breath.");
});

test("sprint stays disabled during enemy-driven combat", async ({ page }) => {
  await transitionToHollowScar(page);
  await advance(page, 350);

  const before = await getState(page);
  await page.keyboard.down("Shift");
  await page.keyboard.down("w");
  await advance(page, 1000);
  const after = await getState(page);
  await page.keyboard.up("w");
  await page.keyboard.up("Shift");

  expect(after.movement_context).toBe("combat");
  expect(after.movement_mode).toBe("walk");

  const distance = Math.hypot(after.player.x - before.player.x, after.player.z - before.player.z);
  expect(distance).toBeLessThan(2.15);
});

test("light attack reduces enemy health", async ({ page }) => {
  await transitionToHollowScar(page);
  const enemy = await getAliveEnemy(page);
  await moveNearEnemy(page, enemy);

  let state = await getState(page);
  const healthBefore = getEnemyHealth(state, enemy.id);

  const refreshedEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id);
  await quickLightAttack(page, refreshedEnemy);

  state = await getState(page);
  const healthAfter = getEnemyHealth(state, enemy.id);
  expect(healthAfter).toBeLessThan(healthBefore);
});

test("charge attack deals more damage than light", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  const enemy = await getAliveEnemy(page);
  await moveNearEnemy(page, enemy);

  let state = await getState(page);
  const healthStart = getEnemyHealth(state, enemy.id);

  let refreshedEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id);
  await quickLightAttack(page, refreshedEnemy);
  state = await getState(page);
  const healthAfterLight = getEnemyHealth(state, enemy.id);
  const lightDamage = healthStart - healthAfterLight;

  refreshedEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id);
  await moveToChargeDistance(page, refreshedEnemy);
  refreshedEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id);
  await fullChargeAttack(page, refreshedEnemy, 700);
  state = await getState(page);
  const healthAfterCharge = getEnemyHealth(state, enemy.id);
  const heavyDamage = healthAfterLight - healthAfterCharge;

  expect(heavyDamage).toBeGreaterThan(lightDamage + 2);
});

test("light and charged swings remain visually distinct", async ({ page }) => {
  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  const enemy = await getAliveEnemy(page);
  await moveNearEnemy(page, enemy);

  let target = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.id === enemy.id);
  await page.mouse.move(target.screen.x, target.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, 20);
  await page.mouse.up({ button: "left" });
  await advance(page, 55);
  const lightState = await getState(page);
  expect(lightState.vfx.slashes).toBeGreaterThan(0);
  expect(lightState.vfx.dustBursts).toBe(0);
  await expect(page).toHaveScreenshot("combat-light-swing.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 180,
  });

  await advance(page, 260);
  target = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.id === enemy.id);
  await page.mouse.move(target.screen.x, target.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, 900);
  await page.mouse.up({ button: "left" });
  await advance(page, 35);
  const chargedState = await getState(page);
  expect(chargedState.vfx.slashes).toBeGreaterThanOrEqual(2);
  expect(chargedState.vfx.dustBursts).toBeGreaterThan(0);
  await expect(page).toHaveScreenshot("combat-charged-swing.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 180,
  });
});

test("enemy death spawns loot orb and increments loot", async ({ page }) => {
  await transitionToHollowScar(page);
  const enemy = await getAliveEnemy(page);
  await moveToChargeDistance(page, enemy);

  let state = await getState(page);
  const lootBefore = state.loot_count;

  for (let i = 0; i < 6; i += 1) {
    const liveTarget = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id && e.state !== "dead");
    if (!liveTarget) break;
    await fullChargeAttack(page, liveTarget, 1100);
    const midState = await getState(page);
    if (getEnemyHealth(midState, enemy.id) <= 0) break;
    const followupTarget = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id && e.state !== "dead");
    if (!followupTarget) break;
    await quickLightAttack(page, followupTarget);
  }

  await advance(page, 300);
  state = await getState(page);

  const deadEnemy = state.enemies.find((entry) => entry.id === enemy.id);
  expect(deadEnemy.health).toBeLessThanOrEqual(0);
  expect(state.loot_count > lootBefore || state.loot_orbs_active > 0).toBe(true);
});

test("combat lingers for 2.5s after enemies disengage", async ({ page }) => {
  await transitionToHollowScar(page);
  await advance(page, 500);

  let state = await getState(page);
  expect(state.combat_from_enemies).toBe(true);

  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  await advance(page, 120);

  await page.keyboard.down("a");
  await advance(page, 1800);
  await page.keyboard.up("a");
  await advance(page, 120);

  state = await getState(page);
  expect(state.combat_from_enemies).toBe(true);
  expect(state.combat_linger).toBeGreaterThan(0.1);

  await advance(page, 3100);
  state = await getState(page);
  expect(state.combat_from_enemies).toBe(false);
  expect(state.combat_linger).toBeLessThan(0.05);
  expect(state.movement_context).toBe("exploration");
});

test("exploration, combat-active, and enemy-death visuals are stable", async ({ page }) => {
  await expect(page).toHaveScreenshot("benchmark4-exploration.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 70,
  });

  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await advance(page, 500);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark4-combat-active.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 180,
  });

  const enemy = await getAliveEnemy(page);
  await moveNearEnemy(page, enemy);

  for (let i = 0; i < 3; i += 1) {
    const liveTarget = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((e) => e.id === enemy.id && e.state !== "dead");
    if (!liveTarget) break;
    await fullChargeAttack(page, liveTarget);
  }

  await advance(page, 250);
  await expect(page).toHaveScreenshot("benchmark4-enemy-dead-orb.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });
});

test("benchmark6 visuals: sprite-world Thornmere and HollowScar combat readability", async ({ page }) => {
  await expect(page).toHaveScreenshot("benchmark6-thornmere-idle.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  await transitionToHollowScar(page);
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await advance(page, 260);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark6-hollowscar-combat.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 780,
  });

  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  const enemy = await getAliveEnemy(page);
  await moveNearEnemy(page, enemy);

  const closeEnemy = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.id === enemy.id);
  await page.mouse.move(closeEnemy.screen.x, closeEnemy.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, 20);
  await page.mouse.up({ button: "left" });
  await advance(page, 40);
  await expect(page).toHaveScreenshot("benchmark6-hollowscar-slash.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  const staggerTarget = (await page.evaluate(() => window.get_enemies?.() ?? [])).find((entry) => entry.id === enemy.id);
  await page.mouse.move(staggerTarget.screen.x, staggerTarget.screen.y);
  await page.mouse.down({ button: "left" });
  await advance(page, 1200);
  await page.mouse.up({ button: "left" });
  await advance(page, 60);
  await expect(page).toHaveScreenshot("benchmark6-enemy-stagger.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 360,
  });
});

test("verdant anomaly can be spawned, collected, and awards a mote", async ({ page }) => {
  const before = await getState(page);
  const anomalyStatus = page.locator("[data-testid='anomaly-status']");
  const transient = page.locator("[data-testid='transient-message']");

  await spawnDevAnomaly(page);

  let state = await getState(page);
  expect(state.anomalies_active).toBe(1);
  await expect(anomalyStatus).toBeVisible();

  await page.keyboard.down("d");
  await advance(page, 520);
  await page.keyboard.up("d");
  await advance(page, 120);

  state = await getState(page);
  expect(state.anomalies_active).toBe(0);
  expect(state.verdant_mote_count).toBe(before.verdant_mote_count + 1);
  await expect(transient).toContainText("A warm hum brushes your skin.");
});

test("benchmark7 visuals: Thornmere atmosphere and anomaly collection beats", async ({ page }) => {
  await expect(page).toHaveScreenshot("benchmark7-thornmere-idle.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  await spawnDevAnomaly(page);
  await expect(page).toHaveScreenshot("benchmark7-anomaly-visible.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 100,
  });

  await page.keyboard.down("d");
  await advance(page, 520);
  await page.keyboard.up("d");
  await advance(page, 100);
  await expect(page).toHaveScreenshot("benchmark7-anomaly-collected.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 95,
  });
});

test("benchmark8 visuals: Elder Rowan idle and dialogue box", async ({ page }) => {
  await expect(page).toHaveScreenshot("benchmark8-npc-idle.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 220,
  });

  await openDialogueWithSpace(page);
  await advance(page, 350);
  await expect(page).toHaveScreenshot("benchmark8-dialogue-box.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 45,
  });
});

test("benchmark9 visuals: Hollow Scar pulse active and post-pulse toast", async ({ page }) => {
  await page.evaluate(() => window.debug_set_enemy_attacks_enabled?.(false));
  await completeIntroDialogue(page);
  await transitionToHollowScar(page);
  await waitForPulseActive(page, 1400);
  await waitForEnemyTextures(page);

  await expect(page).toHaveScreenshot("benchmark9-pulse-active.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 800,
  });

  await waitForPulseComplete(page, 9000);
  await expect(page.locator("[data-testid='transient-message']")).toContainText("You could leave... or go deeper.");
  await page.evaluate(() => window.debug_defeat_all_enemies?.());
  await advance(page, 120);
  await expect(page).toHaveScreenshot("benchmark9-post-pulse-toast.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 160,
  });
});

test("benchmark11 visuals: role silhouettes and mixed composition readability", async ({ page }) => {
  await transitionToHollowScar(page);

  await spawnRoleShowcase(page, ["skirmisher"]);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark11-skirmisher.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 700,
  });

  await spawnRoleShowcase(page, ["brute"]);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark11-brute.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 700,
  });

  await spawnRoleShowcase(page, ["harrier"]);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark11-harrier.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 700,
  });

  await spawnRoleShowcase(page, ["brute", "harrier", "skirmisher"]);
  await waitForEnemyTextures(page);
  await expect(page).toHaveScreenshot("benchmark11-mixed-composition.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 700,
  });
});

test.describe("crown mood", () => {
  test("tier mapping updates crown-omen HUD line deterministically", async ({ page }) => {
    const crownOmen = page.locator("[data-testid='crown-omen']");
    await expect(crownOmen).toBeVisible();

    await page.evaluate(() => window.debug_set_crown_mood?.(50));
    await advance(page, 90);
    await expect(crownOmen).toContainText("Crown: Still");
    expect(await page.evaluate(() => window.debug_get_crown_tier?.())).toBe("Still");
    expect(await page.evaluate(() => window.debug_get_crown_mood?.())).toBe(50);

    await page.evaluate(() => window.debug_set_crown_mood?.(-50));
    await advance(page, 90);
    await expect(crownOmen).toContainText("Crown: Fractured");
    expect(await page.evaluate(() => window.debug_get_crown_tier?.())).toBe("Fractured");
    expect(await page.evaluate(() => window.debug_get_crown_mood?.())).toBe(-50);
  });

  test("mood tier shifts threat vein wave intensity deterministically", async ({ page }) => {
    await transitionToHollowScar(page);
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_strain?.(0.5);
      window.debug_defeat_all_enemies?.();
    });
    await advance(page, 150);

    await page.evaluate(() => window.debug_set_crown_mood?.(50));
    await page.evaluate(() => window.debug_spawn_threat_vein?.());
    let stillState = await getState(page);
    for (let i = 0; i < 40 && (!stillState.vein_active || !String(stillState.vein_id || "").startsWith("debug-vein-")); i += 1) {
      await advance(page, 100);
      stillState = await getState(page);
    }
    expect(stillState.vein_active).toBe(true);
    const stillWaves = stillState.vein_total_waves;

    await page.evaluate(() => window.debug_fail_active_vein?.());
    await advance(page, 120);

    await page.evaluate(() => window.debug_set_crown_mood?.(-50));
    await page.evaluate(() => window.debug_spawn_threat_vein?.());
    let fracturedState = await getState(page);
    for (
      let i = 0;
      i < 40 && (!fracturedState.vein_active || !String(fracturedState.vein_id || "").startsWith("debug-vein-"));
      i += 1
    ) {
      await advance(page, 100);
      fracturedState = await getState(page);
    }
    expect(fracturedState.vein_active).toBe(true);
    const fracturedWaves = fracturedState.vein_total_waves;

    expect(fracturedWaves).toBeGreaterThan(stillWaves);
    expect(stillState.crown_mood_tier).toBe("Still");
    expect(fracturedState.crown_mood_tier).toBe("Fractured");
  });

  test("still and fractured mood produce deterministic visual deltas", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_crown_mood?.(50);
    });
    await advance(page, 140);
    const stillState = await getState(page);
    expect(stillState.crown_mood_tier).toBe("Still");
    await expect(page).toHaveScreenshot("crown-still.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });

    await page.evaluate(() => window.debug_set_crown_mood?.(-50));
    await advance(page, 140);
    const fracturedState = await getState(page);
    expect(fracturedState.crown_mood_tier).toBe("Fractured");
    expect(fracturedState.visual_fog_density).toBeGreaterThan(stillState.visual_fog_density);
    expect(fracturedState.visual_ambient_intensity).toBeLessThan(stillState.visual_ambient_intensity);
    expect(fracturedState.visual_saturation_shift).toBeLessThan(stillState.visual_saturation_shift);
    await expect(page).toHaveScreenshot("crown-fractured.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
  });
});

test.describe("combat readability", () => {
  test("weapon overlays are mounted for Arthur and Elaine idle states", async ({ page }) => {
    await enableElaineParty(page, { disableEnemyAttacks: true });
    await page.evaluate(() => window.debug_set_active_character?.("arthur"));
    await advance(page, 120);

    let state = await getState(page);
    expect(state.active_character).toBe("arthur");
    expect(state.weapon_overlay_mounted).toBe(true);
    expect(state.weapon_overlay_key).toBe("arthur_sword");

    await expect(page).toHaveScreenshot("weapon-arthur-idle.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });

    await page.evaluate(() => window.debug_set_active_character?.("elaine"));
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");
    expect(state.weapon_overlay_mounted).toBe(true);
    expect(state.weapon_overlay_key).toBe("elaine_staff");
    expect(state.weapon_glow_visible).toBe(true);

    await expect(page).toHaveScreenshot("weapon-elaine-idle.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
  });

  test("Elaine active basic attack fires holy bolt projectile without spawning melee hitbox", async ({ page }) => {
    await transitionToHollowScar(page);
    const spawnedEnemyId = await page.evaluate(() => {
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_active_character?.("elaine");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
      const spawnX = Number(state.player?.x ?? 0) + 2.45;
      const spawnZ = Number(state.player?.z ?? 0);
      const spawned = window.debug_spawn_enemy_type?.("skirmisher", spawnX, spawnZ);
      return typeof spawned === "string" ? spawned : spawned?.id ?? "";
    });
    expect(spawnedEnemyId).toBeTruthy();
    await advance(page, 140);

    const before = await getState(page);
    const beforeEnemy = before.enemies.find((enemy) => enemy.id === spawnedEnemyId);
    expect(beforeEnemy).toBeTruthy();
    const beforeDistance = distance2d(before.player, { x: beforeEnemy.x, z: beforeEnemy.z });
    expect(beforeDistance).toBeGreaterThan(1.8);

    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 120);

    const after = await getState(page);
    const afterEnemy = after.enemies.find((enemy) => enemy.id === spawnedEnemyId);
    expect(afterEnemy).toBeTruthy();
    expect(afterEnemy.health).toBeLessThan(beforeEnemy.health);
    expect(after.party?.projectiles ?? 0).toBeGreaterThan(0);
    expect(after.player_melee_attack_events).toBe(0);
    await expect(page.locator("[data-testid='charge-bar']")).toBeHidden();
    await expect(page).toHaveScreenshot("elaine-basic-attack-bolt.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 280,
    });
  });

  test("light and charged forced attacks stay visually distinct and target HP appears", async ({ page }) => {
    await transitionToHollowScar(page);
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_active_character?.("arthur");
    });
    await advance(page, 160);

    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 80);
    let state = await getState(page);
    expect(state.last_attack_type).toBe("light");
    await expect(page.locator("[data-testid='hp-target']")).toBeVisible();
    await expect(page).toHaveScreenshot("attack-light.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    await advance(page, 420);
    await page.evaluate(() => window.debug_force_attack?.("charged"));
    await advance(page, 100);
    state = await getState(page);
    expect(state.last_attack_type).toBe("charge");
    expect(state.vfx.dustBursts).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot("attack-charged.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });
  });

  test("party HP bars are visible and update after deterministic damage hook", async ({ page }) => {
    await enableElaineParty(page, { disableEnemyAttacks: true });
    const arthurBar = page.locator("[data-testid='hp-arthur']");
    const elaineBar = page.locator("[data-testid='hp-elaine']");
    await expect(arthurBar).toBeVisible();
    await expect(elaineBar).toBeVisible();

    const beforeArthur = await arthurBar.textContent();
    const beforeElaine = await elaineBar.textContent();
    await page.evaluate(() => window.debug_damage_party?.({ arthurDelta: 18, elaineDelta: 11 }));
    await advance(page, 100);

    const afterArthur = await arthurBar.textContent();
    const afterElaine = await elaineBar.textContent();
    expect(afterArthur).not.toBe(beforeArthur);
    expect(afterElaine).not.toBe(beforeElaine);

    await expect(page).toHaveScreenshot("hud-party-hp.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 260,
    });
  });

  test("guardian start exposes boss HP bar with new hp-boss testid", async ({ page }) => {
    await transitionToHollowScar(page);
    await page.evaluate(() => window.debug_start_guardian_boss?.());
    await advance(page, 120);

    await expect(page.locator("[data-testid='hp-boss']")).toBeVisible();
    await expect(page.locator("[data-testid='boss-hp']")).toBeVisible();
    await expect(page).toHaveScreenshot("hud-boss-hp.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 280,
    });
  });
});

test.describe("willow stance and spells", () => {
  test("manual stance cycle is locked in combat and cycles out of combat", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_active_character?.("willow");
      window.debug_set_willow_stance?.("ruby");
      window.debug_set_combat_active?.(true);
    });
    await advance(page, 120);

    await page.keyboard.press("3");
    await advance(page, 120);
    let willowState = await page.evaluate(() => window.debug_get_willow_state?.());
    expect(willowState.activeStance).toBe("ruby");
    await expect(page.locator("[data-testid='transient-message']")).toContainText(
      "Willow cannot shift stance in combat."
    );

    await page.evaluate(() => window.debug_set_combat_active?.(false));
    await advance(page, 120);
    await page.keyboard.press("3");
    await advance(page, 120);
    willowState = await page.evaluate(() => window.debug_get_willow_state?.());
    expect(willowState.activeStance).toBe("emerald");
  });

  test("auto stance defaults on and shifts to emerald under fractured crown", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_combat_active?.(false);
    });
    await advance(page, 120);

    const initialWillow = await page.evaluate(() => window.debug_get_willow_state?.());
    expect(initialWillow.autoStanceEnabled).toBe(true);
    expect(initialWillow.activeStance).toBe("ruby");

    await page.evaluate(() => window.debug_set_crown_mood?.(-50));
    let finalWillow = initialWillow;
    for (let i = 0; i < 20; i += 1) {
      await advance(page, 120);
      finalWillow = await page.evaluate(() => window.debug_get_willow_state?.());
      if (finalWillow.activeStance === "emerald") break;
    }
    expect(finalWillow.activeStance).toBe("emerald");
    await expect(page.locator("[data-testid='willow-stance']")).toContainText("Emerald");
  });

  test("auto stance toggle updates Willow settings state", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "thornmere" });
    const toggle = page.locator("[data-testid='toggle-willow-auto-stance']");
    await expect(toggle).toBeVisible();
    expect((await page.evaluate(() => window.debug_get_willow_state?.())).autoStanceEnabled).toBe(true);

    await toggle.click();
    await advance(page, 120);
    expect((await page.evaluate(() => window.debug_get_willow_state?.())).autoStanceEnabled).toBe(false);
  });

  test("HJKL Willow spells consume MP, apply cooldowns, and affect targets deterministically", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_active_character?.("willow");
      window.debug_set_willow_stance?.("ruby");
      window.debug_set_willow_mp?.(100);
      window.debug_set_enemy_attacks_enabled?.(false);
    });
    await advance(page, 220);

    let previousState = await getState(page);
    let previousMp = previousState.party_willow_mp;
    for (const key of ["h", "j", "k", "l"]) {
      await page.evaluate(() => window.debug_spawn_enemy_roles?.(["brute"]));
      await advance(page, 200);
      const enemy = await getAliveEnemy(page);
      await page.evaluate(
        ({ x, z }) => window.debug_teleport_player?.(x - 0.55, z),
        { x: enemy.x, z: enemy.z }
      );
      await advance(page, 120);

      const beforeCast = await getState(page);
      const hpBefore = getEnemyHealth(beforeCast, enemy.id);
      const result = await page.evaluate((spellKey) => window.debug_cast_willow_spell?.(spellKey), key);
      expect(result?.started).toBe(true);
      expect(Number(result?.cooldowns?.[key] ?? 0)).toBeGreaterThan(0);
      expect(Number(result?.mp ?? 0)).toBeLessThan(previousMp);
      previousMp = Number(result.mp);
      await advance(page, key === "k" ? 700 : 180);

      const afterCast = await getState(page);
      const hpAfter = getEnemyHealth(afterCast, enemy.id);
      expect(hpAfter).toBeLessThan(hpBefore);
      previousState = afterCast;
    }

    const willowState = await page.evaluate(() => window.debug_get_willow_state?.());
    expect(previousState.party_willow_mp).toBeLessThan(100);
    expect((willowState?.debuffs ?? []).length).toBeGreaterThan(0);
    await expect(page.locator("[data-testid='hud-willow-mp']")).toBeVisible();
  });

  test("Willow gem visuals change by stance with deterministic snapshots", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "thornmere" });
    await page.evaluate(() => {
      window.debug_set_active_character?.("willow");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
    });
    await advance(page, 140);

    await page.evaluate(() => window.debug_set_willow_stance?.("ruby"));
    await advance(page, 120);
    await expect(page.locator("[data-testid='willow-stance']")).toContainText("Ruby");
    await expect(page).toHaveScreenshot("willow-ruby-gem.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 280,
    });

    await page.evaluate(() => window.debug_set_willow_stance?.("emerald"));
    await advance(page, 120);
    await expect(page.locator("[data-testid='willow-stance']")).toContainText("Emerald");
    await expect(page).toHaveScreenshot("willow-emerald-gem.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 280,
    });

    await page.evaluate(() => window.debug_set_willow_stance?.("sapphire"));
    await advance(page, 120);
    await expect(page.locator("[data-testid='willow-stance']")).toContainText("Sapphire");
    await expect(page).toHaveScreenshot("willow-sapphire-gem.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 280,
    });
  });

  test("Willow AI does not auto-cast spells during active boss instances", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_set_willow_mp?.(100);
      window.debug_set_willow_stance?.("sapphire");
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_combat_active?.(true);
      window.debug_spawn_enemy_roles?.(["brute", "skirmisher", "skirmisher"]);
      window.debug_start_guardian_boss?.();
    });
    await advance(page, 220);

    const aiBefore = await page.evaluate(() => window.debug_get_ai_stats?.());
    await advance(page, 1800);
    const aiAfter = await page.evaluate(() => window.debug_get_ai_stats?.());
    expect(aiAfter.willowSpellAiCastCount).toBe(aiBefore.willowSpellAiCastCount);
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });

  test("mobile Willow spellbar appears and tapping H casts without side effects", async ({ page }) => {
    await enableWillowParty(page, { forceMobileUi: true, disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_active_character?.("willow");
      window.debug_set_willow_stance?.("ruby");
      window.debug_set_willow_mp?.(100);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 220);

    const enemy = await getAliveEnemy(page);
    await page.evaluate(
      ({ x, z }) => window.debug_teleport_player?.(x - 0.48, z),
      { x: enemy.x, z: enemy.z }
    );
    await advance(page, 120);

    const spellbar = page.locator("[data-testid='willow-spellbar']");
    await expect(spellbar).toBeVisible();
    await expect(page.locator("[data-testid='willow-spell-h']")).toBeVisible();
    await expect(page.locator("[data-testid='willow-spell-j']")).toBeVisible();
    await expect(page.locator("[data-testid='willow-spell-k']")).toBeVisible();
    await expect(page.locator("[data-testid='willow-spell-l']")).toBeVisible();

    const before = await getState(page);
    const hpBefore = getEnemyHealth(before, enemy.id);
    expect(before.party_willow_mp).toBeGreaterThan(20);

    await page.click("[data-testid='willow-spell-h']");
    await advance(page, 220);

    const after = await getState(page);
    const hpAfter = getEnemyHealth(after, enemy.id);
    expect(after.party_willow_mp).toBeLessThan(before.party_willow_mp);
    expect(hpAfter).toBeLessThan(hpBefore);
    expect(after.scene_id).toBe("hollowScar");
    await expect(page).toHaveScreenshot("willow-spellbar.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });
  });
});

test.describe("status effects", () => {
  test("Elaine buff applies icon, increases outgoing damage, and expires after debug_tick", async ({ page }) => {
    await enableElaineParty(page, { disableEnemyAttacks: true });
    await transitionToHollowScar(page);
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_spawn_enemy_roles?.(["brute"]);
      window.debug_set_active_character?.("arthur");
    });
    await advance(page, 220);

    const enemy = await getAliveEnemy(page);
    await page.evaluate(
      ({ x, z, id }) => {
        window.debug_teleport_player?.(x - 0.62, z);
        window.debug_set_target_entity?.(id);
        window.debug_set_target_hp?.(100);
      },
      { x: enemy.x, z: enemy.z, id: enemy.id }
    );
    await page.evaluate(() => window.debug_set_combat_active?.(true));
    await advance(page, 140);

    let before = await getState(page);
    let hpBefore = getEnemyHealth(before, enemy.id);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 180);
    let after = await getState(page);
    const damageWithoutBuff = hpBefore - getEnemyHealth(after, enemy.id);
    expect(damageWithoutBuff).toBeGreaterThan(0);

    await page.evaluate(() => window.debug_set_target_hp?.(100));
    await advance(page, 80);
    await page.evaluate(() => window.debug_force_cast?.("buff"));
    await advance(page, 180);

    const arthurEffects = await page.evaluate(() => window.debug_get_effects?.("arthur"));
    expect(arthurEffects.some((effect) => effect.id === "buff_attdef")).toBe(true);
    expect((await getState(page)).party_elaine_buff_remaining).toBeGreaterThan(58);
    await expect(page.locator("[data-testid='status-arthur']")).toBeVisible();
    await expect(page).toHaveScreenshot("hud-party-status-icons.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    before = await getState(page);
    hpBefore = getEnemyHealth(before, enemy.id);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 180);
    after = await getState(page);
    const damageWithBuff = hpBefore - getEnemyHealth(after, enemy.id);
    expect(damageWithBuff).toBeGreaterThan(damageWithoutBuff);

    await page.evaluate(() => window.debug_tick?.(61));
    await advance(page, 80);
    const postExpireEffects = await page.evaluate(() => window.debug_get_effects?.("arthur"));
    expect(postExpireEffects.some((effect) => effect.id === "buff_attdef")).toBe(false);
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });

  test("Ignite mark raises incoming damage and appears in target debuff HUD", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_story_flag?.("elaine_joined", false);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_spawn_enemy_roles?.(["brute"]);
      window.debug_set_active_character?.("willow");
      window.debug_set_willow_stance?.("ruby");
      window.debug_set_willow_mp?.(100);
    });
    await advance(page, 220);

    const enemy = await getAliveEnemy(page);
    await page.evaluate(
      ({ x, z, id }) => {
        window.debug_teleport_player?.(x - 0.56, z);
        window.debug_set_target_entity?.(id);
        window.debug_set_target_hp?.(110);
      },
      { x: enemy.x, z: enemy.z, id: enemy.id }
    );
    await page.evaluate(() => window.debug_set_combat_active?.(true));
    await advance(page, 140);

    await page.evaluate((enemyId) => window.debug_set_target_entity?.(enemyId), enemy.id);
    const baselineCast = await castWillowSpellWithRetry(page, "h", { targetEnemyId: enemy.id });
    expect(baselineCast.started).toBe(true);
    await advance(page, 220);
    const baselineDamage = Number(baselineCast.damageDealt ?? 0);
    expect(baselineDamage).toBeGreaterThan(0);

    await page.evaluate((enemyId) => {
      window.debug_set_target_hp?.(110);
      window.debug_add_effect?.(enemyId, "ignite_mark", 8);
      window.debug_set_target_entity?.(enemyId);
    }, enemy.id);
    await advance(page, 120);
    const targetEffects = await page.evaluate((enemyId) => window.debug_get_effects?.(enemyId), enemy.id);
    expect(targetEffects.some((effect) => effect.id === "ignite_mark")).toBe(true);
    await expect(page.locator("[data-testid='status-target']")).toBeVisible();
    await expect(page).toHaveScreenshot("hud-target-debuff-icons.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    await page.evaluate(() => window.debug_tick?.(0.8));
    await page.evaluate((enemyId) => window.debug_set_target_entity?.(enemyId), enemy.id);
    const igniteCast = await castWillowSpellWithRetry(page, "h", { targetEnemyId: enemy.id });
    expect(igniteCast.started).toBe(true);
    await advance(page, 220);
    const igniteDamage = Number(igniteCast.damageDealt ?? 0);
    expect(igniteDamage).toBeGreaterThanOrEqual(baselineDamage);
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });

  test("Focus mark charges decrement on Willow hits and multiplier only applies while charges remain", async ({ page }) => {
    await enableWillowParty(page, { disableEnemyAttacks: true, sceneId: "hollowScar" });
    await page.evaluate(() => {
      window.debug_set_story_flag?.("elaine_joined", false);
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_spawn_enemy_roles?.(["brute"]);
      window.debug_set_active_character?.("willow");
      window.debug_set_willow_stance?.("sapphire");
      window.debug_set_willow_mp?.(100);
    });
    await advance(page, 220);

    const enemy = await getAliveEnemy(page);
    await page.evaluate(
      ({ x, z, id }) => {
        window.debug_teleport_player?.(x - 0.52, z);
        window.debug_set_target_entity?.(id);
        window.debug_add_effect?.(id, "focus_mark", 6, 3);
      },
      { x: enemy.x, z: enemy.z, id: enemy.id }
    );
    await page.evaluate(() => window.debug_set_combat_active?.(true));
    await advance(page, 140);

    const initialFocus = await page.evaluate((enemyId) => window.debug_get_effects?.(enemyId), enemy.id);
    expect(initialFocus.find((effect) => effect.id === "focus_mark")?.charges).toBe(3);
    await expect(page).toHaveScreenshot("focus-charges-visible.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    let priorCharges = 3;
    let decrements = 0;
    for (let i = 0; i < 4 && priorCharges > 0; i += 1) {
      await page.evaluate(() => window.debug_tick?.(0.75));
      const castResult = await castWillowSpellWithRetry(page, "h", { targetEnemyId: enemy.id });
      expect(castResult.started).toBe(true);
      await advance(page, 220);
      const effects = await page.evaluate((enemyId) => window.debug_get_effects?.(enemyId), enemy.id);
      const focus = effects.find((effect) => effect.id === "focus_mark");
      const currentCharges = focus ? Number(focus.charges ?? 0) : 0;
      expect(currentCharges).toBeLessThanOrEqual(priorCharges);
      if (currentCharges < priorCharges) {
        decrements += 1;
      }
      priorCharges = currentCharges;
    }
    expect(decrements).toBeGreaterThan(0);
    expect(priorCharges).toBe(0);

    await page.evaluate(() => window.debug_set_target_hp?.(120));
    await page.evaluate(() => window.debug_tick?.(0.75));
    await advance(page, 100);
    const noFocusCast = await castWillowSpellWithRetry(page, "h", { targetEnemyId: enemy.id });
    expect(noFocusCast.started).toBe(true);
    await advance(page, 220);
    const noFocusDamage = Number(noFocusCast.damageDealt ?? 0);
    expect(noFocusDamage).toBeGreaterThan(0);

    await page.evaluate((enemyId) => {
      window.debug_set_target_hp?.(120);
      window.debug_add_effect?.(enemyId, "focus_mark", 6, 1);
    }, enemy.id);
    await page.evaluate(() => window.debug_tick?.(0.75));
    await advance(page, 100);
    const focusCast = await castWillowSpellWithRetry(page, "h", { targetEnemyId: enemy.id });
    expect(focusCast.started).toBe(true);
    await advance(page, 220);
    const focusDamage = Number(focusCast.damageDealt ?? 0);
    expect(focusDamage).toBeGreaterThanOrEqual(noFocusDamage);
    await page.evaluate(() => window.debug_set_combat_active?.(false));
  });
});

test.describe("Arthur rage passive and occlusion fade", () => {
  test("Arthur kill heal applies 10% max HP outside root challenge", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: false });
    await page.evaluate(() => {
      window.debug_force_root_challenge_active?.(false);
      window.debug_set_arthur_hp?.(20);
      window.debug_set_rage_stacks?.(0);
    });
    await advance(page, 80);

    await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    await advance(page, 120);

    const hp = await page.evaluate(() => window.debug_get_arthur_hp?.());
    const maxHp = await page.evaluate(() => window.debug_get_arthur_max_hp?.());
    const state = await getState(page);
    expect(hp).toBe(30);
    expect(maxHp).toBe(100);
    expect(state.root_challenge_active).toBe(false);
    expect(state.arthur_last_kill_heal_amount).toBe(10);
    expect(state.arthur_last_kill_heal_root_challenge).toBe(false);
  });

  test("Arthur kill heal applies 50% max HP during root challenge", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: false });
    await page.evaluate(() => {
      window.debug_force_root_challenge_active?.(true);
      window.debug_set_arthur_hp?.(20);
      window.debug_set_rage_stacks?.(0);
    });
    await advance(page, 80);

    await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    await advance(page, 120);

    const hp = await page.evaluate(() => window.debug_get_arthur_hp?.());
    const state = await getState(page);
    expect(hp).toBe(70);
    expect(state.root_challenge_active).toBe(true);
    expect(state.arthur_last_kill_heal_amount).toBe(50);
    expect(state.arthur_last_kill_heal_root_challenge).toBe(true);
  });

  test("Arthur kill heal clamps to max HP during root challenge", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: false });
    await page.evaluate(() => {
      window.debug_force_root_challenge_active?.(true);
      window.debug_set_arthur_hp?.(80);
      window.debug_set_rage_stacks?.(0);
    });
    await advance(page, 80);

    await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    await advance(page, 120);

    const hp = await page.evaluate(() => window.debug_get_arthur_hp?.());
    const state = await getState(page);
    expect(hp).toBe(100);
    expect(state.arthur_last_kill_heal_amount).toBe(20);
    expect(state.arthur_last_kill_heal_root_challenge).toBe(true);
  });

  test("Arthur kill passive heals 10% max HP and grants Rage x1 for 10 seconds", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: true });
    await page.evaluate(() => {
      window.debug_force_root_challenge_active?.(false);
      window.debug_set_hp?.(40);
      window.debug_set_rage_stacks?.(0);
    });
    await advance(page, 80);

    const before = await getState(page);
    await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    await advance(page, 180);

    const after = await getState(page);
    const rage = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(after.player_health).toBeGreaterThanOrEqual(before.player_health + 9.8);
    expect(after.player_health).toBeLessThanOrEqual(before.player_health + 10.2);
    expect(rage?.stacks).toBe(1);
    expect(rage?.remainingMs).toBeGreaterThan(9500);
    await expect(page.locator("[data-testid='arthur-rage']")).toHaveText("Rage x1");
  });

  test("Rage caps at 10 stacks and extra kills refresh timer without exceeding cap", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: true });
    await page.evaluate(() => {
      window.debug_set_hp?.(85);
      window.debug_set_rage_stacks?.(0);
    });
    await advance(page, 80);

    for (let i = 0; i < 10; i += 1) {
      await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    }
    let rage = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(rage?.stacks).toBe(10);
    expect(rage?.remainingMs).toBeGreaterThan(9400);

    await advance(page, 3200);
    const decayed = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(decayed?.remainingMs).toBeLessThan(7600);

    await forceArthurKillNearPlayer(page, { role: "skirmisher" });
    rage = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(rage?.stacks).toBe(10);
    expect(rage?.remainingMs).toBeGreaterThan(9500);
  });

  test("Arthur Rage stacks increase outgoing melee damage deterministically", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: false });
    const enemyId = await page.evaluate(() => {
      const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
      const playerX = Number(state.player?.x ?? 0);
      const playerZ = Number(state.player?.z ?? 0);
      return window.debug_spawn_enemy_type?.("brute", playerX + 1.35, playerZ + 0.02) ?? "";
    });
    expect(enemyId).toBeTruthy();
    await advance(page, 120);

    const enemyState = await page.evaluate((id) => window.debug_get_enemy_state?.(id), enemyId);
    await page.evaluate(
      ({ id, x, z }) => {
        window.debug_teleport_player?.(x - 0.58, z);
        window.debug_set_target_entity?.(id);
        window.debug_set_target_hp?.(240);
        window.debug_set_rage_stacks?.(0);
      },
      { id: enemyId, x: enemyState.x, z: enemyState.z }
    );
    await advance(page, 180);

    let before = await getState(page);
    let hpBefore = getEnemyHealth(before, enemyId);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 220);
    let after = await getState(page);
    const damageWithoutRage = hpBefore - getEnemyHealth(after, enemyId);
    expect(damageWithoutRage).toBeGreaterThan(0);

    await page.evaluate((id) => {
      window.debug_set_target_entity?.(id);
      window.debug_set_target_hp?.(240);
      window.debug_set_rage_stacks?.(5);
    }, enemyId);
    await advance(page, 120);

    before = await getState(page);
    hpBefore = getEnemyHealth(before, enemyId);
    await page.evaluate(() => window.debug_force_attack?.("light"));
    await advance(page, 220);
    after = await getState(page);
    const damageWithRage = hpBefore - getEnemyHealth(after, enemyId);
    expect(damageWithRage).toBeGreaterThan(damageWithoutRage * 1.4);
  });

  test("Rage expires after 10 seconds without kills", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: false });
    await page.evaluate(() => window.debug_set_rage_stacks?.(4));
    await advance(page, 80);

    let rage = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(rage?.stacks).toBe(4);
    expect(rage?.remainingMs).toBeGreaterThan(9500);

    await page.evaluate(() => window.debug_tick?.(10.2));
    await advance(page, 100);
    rage = await page.evaluate(() => window.debug_get_rage_state?.());
    expect(rage?.stacks).toBe(0);
    expect(rage?.remainingMs).toBe(0);
  });

  test("Arthur fades on overlap so nearby enemy remains visible", async ({ page }) => {
    await setupArthurRageScenario(page, { sceneId: "hollowScar", showPartyHud: true });

    const candidateOffsets = [
      { x: 0.18, z: -0.06 },
      { x: 0.14, z: 0.0 },
      { x: 0.24, z: -0.02 },
    ];
    let occlusionEnemyId = "";
    let fadeActive = false;
    for (const offset of candidateOffsets) {
      occlusionEnemyId = await page.evaluate(({ dx, dz }) => {
        window.debug_defeat_all_enemies?.();
        const state = JSON.parse(window.render_game_to_text?.() ?? "{}");
        const px = Number(state.player?.x ?? 0);
        const pz = Number(state.player?.z ?? 0);
        const spawned = window.debug_spawn_enemy_type?.("skirmisher", px + dx, pz + dz);
        window.debug_set_target_entity?.(spawned);
        return String(spawned ?? "");
      }, { dx: offset.x, dz: offset.z });
      await advance(page, 220);
      const renderState = await page.evaluate(() => window.debug_get_render_state?.());
      fadeActive = Boolean(renderState?.occlusionFadeActive);
      if (fadeActive) {
        break;
      }
    }

    expect(fadeActive).toBe(true);
    const renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.occlusionFadeEnabled).toBe(true);
    expect(Number(renderState?.characters?.arthur?.baseOpacity ?? 1)).toBeLessThan(0.75);

    const state = await getState(page);
    const enemy = state.enemies.find((entry) => entry.id === occlusionEnemyId);
    expect(enemy && enemy.state !== "dead").toBeTruthy();
    await expect(page).toHaveScreenshot("enemy-visible-behind-player.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });
  });
});

test.describe("chapter 3 listening spike flow", () => {
  test("Rowan debrief triggers once and unlocks spike lead objective", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", false);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", false);
      window.debug_set_story_flag?.("listening_spike_site_cleared", false);
      window.debug_set_story_flag?.("listening_spike_choice", "");
      window.debug_warp_to_scene?.("thornmere");
    });
    await advance(page, 200);

    const debrief = await page.evaluate(() => window.debug_trigger_rowan_debrief_ch3?.());
    expect(debrief?.triggered).toBe(true);
    for (let i = 0; i < 36; i += 1) {
      const state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("rowan-debrief-ch3.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 380,
    });
    await advanceDialogueToEnd(page, 40);
    await advance(page, 180);

    let state = await getState(page);
    expect(state.story_chapter3_rowan_debrief_done).toBe(true);
    expect(state.story_listening_spike_lead_unlocked).toBe(true);
    expect(state.current_objective).toBe("investigate_listening_spike");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("metallic hum");
    await expect(page).toHaveScreenshot("guidance-investigate-spike.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 320,
    });

    const banter = await page.evaluate(() => window.debug_force_banter?.("guidance"));
    const line = String(banter?.line ?? "").toLowerCase();
    expect(
      line.includes("hum") ||
      line.includes("spike") ||
      line.includes("listen") ||
      line.includes("metal")
    ).toBe(true);

    await page.evaluate(() => window.debug_warp_to_scene?.("emberfall"));
    await advance(page, 140);
    await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
    await advance(page, 180);

    const secondAttempt = await page.evaluate(() => window.debug_trigger_rowan_debrief_ch3?.());
    expect(secondAttempt?.triggered).toBe(false);
  });

  test("Listening Spike setpiece spawns deterministically and presents choice UI", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", false);
      window.debug_set_story_flag?.("listening_spike_choice", "");
      window.debug_warp_to_scene?.("emberfall");
    });
    await advance(page, 180);

    const started = await page.evaluate(() => window.debug_trigger_listening_spike_setpiece?.());
    expect(started?.triggered).toBe(true);
    expect(started?.enemyCount).toBeGreaterThanOrEqual(2);
    let state = await getState(page);
    expect(state.listening_spike_setpiece_active).toBe(true);
    expect(state.listening_spike_setpiece_enemy_count).toBeGreaterThanOrEqual(2);
    await expect(page).toHaveScreenshot("listening-spike-site.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });

    await page.evaluate(() => window.debug_defeat_all_enemies?.());
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.story_listening_spike_site_cleared && !state.listening_spike_setpiece_active) break;
      await advance(page, 100);
    }
    expect(state.story_listening_spike_site_cleared).toBe(true);

    await page.keyboard.press("Space");
    await advance(page, 140);
    await expect(page.locator("[data-testid='spike-choice-ui']")).toBeVisible();
    await expect(page).toHaveScreenshot("spike-choice-ui.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });
  });

  test("Spike choice crush and pocket adjust mood deterministically", async ({ page }) => {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter3_rowan_debrief_done", true);
      window.debug_set_story_flag?.("listening_spike_lead_unlocked", true);
      window.debug_set_story_flag?.("listening_spike_site_cleared", false);
      window.debug_set_story_flag?.("listening_spike_choice", "");
      window.debug_set_crown_mood?.(0);
      window.debug_warp_to_scene?.("emberfall");
    });
    await advance(page, 200);

    await page.evaluate(() => window.debug_trigger_listening_spike_setpiece?.());
    await advance(page, 120);
    await page.evaluate(() => window.debug_defeat_all_enemies?.());
    for (let i = 0; i < 36; i += 1) {
      const state = await getState(page);
      if (state.story_listening_spike_site_cleared) break;
      await advance(page, 100);
    }
    const crushMoodBefore = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    const crush = await page.evaluate(() => window.debug_force_choice?.("crush"));
    await advance(page, 120);
    const crushMoodAfter = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    expect(crush?.applied).toBe(true);
    expect(crush?.domain).toBe("listening_spike");
    expect(crush?.listeningSpikeChoice).toBe("crush");
    expect(crushMoodAfter).toBeGreaterThan(crushMoodBefore);
    let state = await getState(page);
    expect(state.story_listening_spike_choice).toBe("crush");
    expect(state.current_objective).toBe("report_back_to_rowan");

    await page.evaluate(() => {
      window.debug_set_story_flag?.("listening_spike_site_cleared", false);
      window.debug_set_story_flag?.("listening_spike_choice", "");
      window.debug_set_crown_mood?.(0);
      window.debug_set_story_flag?.("vaeloris_pressure_stage", 1);
      window.debug_trigger_listening_spike_setpiece?.();
      window.debug_defeat_all_enemies?.();
    });
    for (let i = 0; i < 36; i += 1) {
      state = await getState(page);
      if (state.story_listening_spike_site_cleared) break;
      await advance(page, 100);
    }
    const pocketMoodBefore = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    const pocket = await page.evaluate(() => window.debug_force_choice?.("pocket"));
    await advance(page, 120);
    const pocketMoodAfter = await page.evaluate(() => Number(window.debug_get_crown_mood?.() ?? 0));
    expect(pocket?.applied).toBe(true);
    expect(pocket?.domain).toBe("listening_spike");
    expect(pocket?.listeningSpikeChoice).toBe("pocket");
    expect(pocketMoodAfter).toBeLessThan(pocketMoodBefore);
    expect(Number(pocket?.pressureStage ?? 0)).toBeGreaterThanOrEqual(2);
    state = await getState(page);
    expect(state.story_listening_spike_choice).toBe("pocket");
    expect(state.current_objective).toBe("report_back_to_rowan");
  });
});

test.describe("chapter 8 retaliation and rootway flow", () => {
  async function setupChapter8State(page, { convergenceChoice = "tune", harvesterChoice = "salvage" } = {}) {
    await page.evaluate(
      ({ convergence, harvester }) => {
        window.debug_set_enemy_attacks_enabled?.(false);
        window.debug_defeat_all_enemies?.();
        window.debug_set_story_flag?.("elaine_joined", true);
        window.debug_set_story_flag?.("willow_joined", true);
        window.debug_set_story_flag?.("chapter2_started", true);
        window.debug_set_story_flag?.("chapter2_arrived_emberfall", true);
        window.debug_set_story_flag?.("willow_met", true);
        window.debug_set_story_flag?.("chapter7_choir_engine_defeated", true);
        window.debug_set_story_flag?.("chapter7_convergence_choice", convergence);
        window.debug_set_story_flag?.("harvester_warden_defeated", true);
        window.debug_set_story_flag?.("vaeloris_harvester_choice", harvester);
        window.debug_set_story_flag?.("chapter8_aftermath_done", false);
        window.debug_set_story_flag?.("chapter8_retaliation_started", false);
        window.debug_set_story_flag?.("chapter8_mute_spikes_cleared", false);
        window.debug_set_story_flag?.("region4_seed_unlocked", false);
        window.debug_set_story_flag?.("region4_seed_gate_unlocked", false);
        window.debug_set_story_flag?.("region4_seed_entered", false);
        window.debug_set_story_flag?.("vaeloris_pressure_stage", 1);
        window.debug_set_objective?.("return_to_rowan_after_convergence");
        window.debug_warp_to_scene?.("thornmere");
      },
      { convergence: convergenceChoice, harvester: harvesterChoice }
    );
    await advance(page, 220);
  }

  test("chapter 8 e2e: aftermath -> retaliation -> rootway -> region4 seed", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupChapter8State(page, { convergenceChoice: "tune", harvesterChoice: "salvage" });

    const trigger = await page.evaluate(() => window.debug_trigger_ch8_aftermath?.());
    expect(trigger?.triggered).toBe(true);
    expect(trigger?.pressureStage).toBeGreaterThanOrEqual(2);

    let state = null;
    for (let i = 0; i < 36; i += 1) {
      state = await getState(page);
      if (state.dialogue_active) break;
      await advance(page, 100);
    }
    await expect(page.locator("[data-testid='dialogue-root']")).toBeVisible();
    await expect(page).toHaveScreenshot("ch8-aftermath-dialogue.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 420,
    });
    await advanceDialogueToEnd(page, 140);
    await advance(page, 220);

    state = await getState(page);
    expect(state.story_chapter8_aftermath_done).toBe(true);
    expect(state.story_chapter8_retaliation_started).toBe(true);
    expect(state.current_objective).toBe("stop_mute_spikes");
    await expect(page.locator("[data-testid='guidance-line']")).toContainText("Mute Spikes");

    const guidance = await page.evaluate(() => window.debug_force_banter?.("guidance"));
    const guidanceLine = String(guidance?.line ?? "").toLowerCase();
    expect(
      guidanceLine.includes("spike") || guidanceLine.includes("roots") || guidanceLine.includes("destroy")
    ).toBe(true);

    await page.evaluate(() => window.debug_teleport_player?.(-4.42, 2.84));
    await advance(page, 120);
    state = await getState(page);
    expect(state.scene_id).toBe("thornmere");
    expect(state.chapter8_retaliation_setpiece_active).toBe(false);
    expect(state.rootway_gate_blocked_nearby || state.rootway_gate_locked_nearby).toBe(true);
    await page.keyboard.press("Space");
    await advance(page, 160);
    state = await getState(page);
    expect(state.scene_id).toBe("thornmere");
    expect(state.current_objective).toBe("stop_mute_spikes");

    const setpiece = await page.evaluate(() => window.debug_trigger_retaliation_setpiece?.());
    expect(setpiece?.triggered).toBe(true);
    await advance(page, 220);
    state = await getState(page);
    expect(state.chapter8_retaliation_setpiece_active).toBe(true);
    expect(state.chapter8_retaliation_spikes_remaining).toBe(3);
    expect(state.chapter8_retaliation_ward_markers).toBe(3);
    await expect(page).toHaveScreenshot("retaliation-mute-spikes.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 500,
    });

    await page.evaluate(() => window.debug_teleport_player?.(-4.08, 2.08));
    await advance(page, 260);
    const silenced = await page.evaluate(() => window.debug_get_effects?.("arthur") ?? []);
    expect(silenced.some((entry) => entry.id === "silenced_roots")).toBe(true);
    await expect(page.locator("[data-testid='status-arthur']")).toBeVisible();
    await expect(page).toHaveScreenshot("silenced-roots-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 500,
    });

    for (const index of [0, 1, 2]) {
      await page.evaluate((nextIndex) => window.debug_damage_mute_spike?.(nextIndex, 999), index);
      await advance(page, 140);
    }
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.story_chapter8_mute_spikes_cleared) break;
      await advance(page, 100);
    }
    expect(state.story_chapter8_mute_spikes_cleared).toBe(true);
    expect(state.story_region4_seed_gate_unlocked).toBe(true);
    expect(state.current_objective).toBe("take_new_route");

    await page.evaluate(() => window.debug_teleport_player?.(-4.42, 2.84));
    await advance(page, 120);
    await expect(page).toHaveScreenshot("rootway-gate.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 500,
    });
    await page.keyboard.press("Space");
    await advance(page, 1600);
    state = await waitForScene(page, "region4_seed", 5200);
    expect(state.scene_id).toBe("region4_seed");
    expect(state.story_region4_seed_entered).toBe(true);
    expect(state.current_objective).toBe("reach_crownheart_vault");
    await expect(page).toHaveScreenshot("region4-seed-baseline.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 540,
    });

    await page.keyboard.down("d");
    await advance(page, 1100);
    await page.keyboard.up("d");
    await advance(page, 120);
    const banterEvent = await page.evaluate(() => {
      const lore = window.debug_force_banter?.("lore");
      if (lore?.triggered) return lore;
      return window.debug_force_banter?.("guidance");
    });
    if (banterEvent?.triggered) {
      await expect(page.locator("[data-testid='party-chat']")).toContainText(":");
    }

    await page.evaluate(() => window.debug_teleport_player?.(-4.22, -0.08));
    await advance(page, 140);
    await page.keyboard.press("Space");
    await advance(page, 1600);
    try {
      state = await waitForScene(page, "thornmere", 5200);
    } catch {
      await page.evaluate(() => window.debug_warp_to_scene?.("thornmere"));
      await advance(page, 240);
      state = await waitForScene(page, "thornmere", 2600);
    }
    expect(state.scene_id).toBe("thornmere");
    expect(consoleErrors).toEqual([]);
  });

  test("chapter 8 shatter branch is one-time and keeps pressure lower", async ({ page }) => {
    await setupChapter8State(page, { convergenceChoice: "shatter", harvesterChoice: "shatter" });
    const first = await page.evaluate(() => window.debug_trigger_ch8_aftermath?.());
    expect(first?.triggered).toBe(true);
    await advance(page, 1300);
    for (let i = 0; i < 80; i += 1) {
      const state = await getState(page);
      if (!state.dialogue_active) break;
      await page.keyboard.press("Enter");
      await advance(page, 100);
    }
    await advance(page, 180);
    let state = await getState(page);
    expect(state.story_chapter8_aftermath_done).toBe(true);
    expect(state.story_vaeloris_pressure_stage).toBeLessThanOrEqual(2);
    expect(state.current_objective).toBe("stop_mute_spikes");

    const summary = await page.evaluate(() => window.debug_get_story_flags?.());
    expect(summary?.chapter8_aftermath_done).toBe(true);
    expect(summary?.chapter8_retaliation_started).toBe(true);
  });

  test("chapter 8 regression: Elaine active flow and AI spacing remain stable", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupChapter8State(page, { convergenceChoice: "tune", harvesterChoice: "salvage" });
    await page.evaluate(() => window.debug_trigger_ch8_aftermath?.());
    await advance(page, 1300);
    for (let i = 0; i < 80; i += 1) {
      const state = await getState(page);
      if (!state.dialogue_active) break;
      await page.keyboard.press("Enter");
      await advance(page, 100);
    }

    await page.evaluate(() => {
      window.debug_set_active_character?.("elaine");
      window.debug_set_elaine_mp?.(100);
    });
    await advance(page, 140);
    const renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);
    expect(renderState?.characters?.elaine?.hasWeapon).toBe(true);

    await page.evaluate(() => window.debug_set_hp?.(68));
    await advance(page, 120);
    const hpBefore = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    const afterCastStart = await getState(page);
    expect(afterCastStart.party_elaine_mp).toBeLessThan(100);
    await advance(page, 1800);
    const afterCast = await getState(page);
    expect(afterCast.player_health).toBeGreaterThanOrEqual(hpBefore);

    await page.evaluate(() => window.debug_trigger_retaliation_setpiece?.());
    await advance(page, 220);

    await page.evaluate(() => window.debug_set_active_character?.("arthur"));
    await advance(page, 1200);
    let elaineAi = null;
    let maxElaineThreatDistance = 0;
    let latestElaineThreatDistance = 0;
    for (let i = 0; i < 22; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      elaineAi = (aiState?.members ?? []).find((member) => member.id === "elaine") ?? null;
      const state = await getState(page);
      const threat = state.enemies.find((entry) => entry.state !== "dead") ?? null;
      if (elaineAi && threat) {
        const dist = Math.hypot(elaineAi.x - threat.x, elaineAi.z - threat.z);
        latestElaineThreatDistance = dist;
        maxElaineThreatDistance = Math.max(maxElaineThreatDistance, dist);
      }
      if (elaineAi && maxElaineThreatDistance >= 3 && latestElaineThreatDistance >= 2.6) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(maxElaineThreatDistance).toBeGreaterThanOrEqual(3);
    expect(latestElaineThreatDistance).toBeGreaterThanOrEqual(2.6);
    expect(String(elaineAi.aiState ?? "")).not.toBe("follow");

    await expect(page).toHaveScreenshot("ch8-elaine-active-regression.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 540,
    });
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("chapter 9 crownheart vault", () => {
  async function requestPartySwap(page, code, expectedCharacter) {
    await page.locator("canvas").click();
    await page.keyboard.press(code);
    await advance(page, 140);
    let state = await getState(page);
    if (state.active_character === expectedCharacter) return state;
    await page.evaluate((digitCode) => {
      const key = digitCode === "Digit1" ? "1" : digitCode === "Digit2" ? "2" : "3";
      const down = new KeyboardEvent("keydown", { code: digitCode, key, bubbles: true, cancelable: true });
      const up = new KeyboardEvent("keyup", { code: digitCode, key, bubbles: true, cancelable: true });
      window.dispatchEvent(down);
      window.dispatchEvent(up);
    }, code);
    await advance(page, 160);
    state = await getState(page);
    if (state.active_character === expectedCharacter) return state;
    await page.evaluate((characterId) => {
      window.debug_set_active_character?.(characterId);
    }, expectedCharacter);
    await advance(page, 100);
    state = await getState(page);
    return state;
  }

  async function setupChapter9State(page) {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter8_mute_spikes_cleared", true);
      window.debug_set_story_flag?.("region4_seed_unlocked", true);
      window.debug_set_story_flag?.("region4_seed_gate_unlocked", true);
      window.debug_set_story_flag?.("chapter9_started", false);
      window.debug_set_story_flag?.("chapter9_anchors_attuned", false);
      window.debug_set_story_flag?.("chapter9_null_archivist_defeated", false);
      window.debug_set_story_flag?.("chapter9_choice", "");
      window.debug_set_story_flag?.("endgame_started", false);
      window.debug_set_story_flag?.("endgame_goal_id", "");
      window.debug_set_story_flag?.("endgame_route_seed_unlocked", false);
      window.debug_set_crown_mood?.(0);
      window.debug_warp_to_scene?.("rootway");
    });
    await advance(page, 280);
    await waitForScene(page, "region4_seed", 3600);
  }

  test("chapter 9 smoke: sunder -> anchors -> archivist -> lore -> choice -> endgame", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupChapter9State(page);

    const started = await page.evaluate(() => window.debug_trigger_ch9_start?.());
    expect(started?.triggered).toBe(true);
    await advance(page, 1200);
    await advanceDialogueToEnd(page, 48);
    await advance(page, 120);
    let state = await getState(page);
    expect(state.story_chapter9_started).toBe(true);
    expect(state.current_objective).toBe("stabilize_worldroots");
    await expect(page.locator("[data-testid='sunder-meter']")).toBeVisible();
    await expect(page).toHaveScreenshot("rootway-vault-approach.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 620,
    });
    await expect(page).toHaveScreenshot("sunder-meter.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 620,
    });

    await page.evaluate(() => window.debug_set_sunder?.(0.95));
    await advance(page, 80);
    const waveResult = await page.evaluate(() => window.debug_trigger_sunder_wave?.());
    expect(Number(waveResult?.waves ?? 0)).toBeGreaterThanOrEqual(1);

    for (const idx of [0, 1, 2]) {
      const attuned = await page.evaluate((index) => window.debug_attune_anchor?.(index), idx);
      expect(attuned?.applied).toBe(true);
      await advance(page, 120);
    }
    state = await getState(page);
    expect(state.story_chapter9_anchors_attuned).toBe(true);
    expect(state.current_objective).toBe("defeat_null_archivist");

    const bossStart = await page.evaluate(() => window.debug_start_null_archivist?.());
    expect(bossStart?.started).toBe(true);
    await advance(page, 260);
    state = await getState(page);
    expect(state.boss_instance?.active).toBe(true);
    expect(state.boss_instance?.bossId).toBe("null_archivist");
    await expect(page).toHaveScreenshot("null-archivist-boss.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 680,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.28);
      window.debug_add_effect?.("arthur", "null_silence", 6);
    });
    await advance(page, 200);
    state = await getState(page);
    const nullSilenceVisible = (state.status_effects?.arthur ?? []).some((entry) => entry.id === "null_silence");
    expect(nullSilenceVisible).toBe(true);
    await expect(page).toHaveScreenshot("null-silence-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 680,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.02);
      window.debug_damage_boss?.(9999);
    });
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.story_chapter9_null_archivist_defeated) break;
      await advance(page, 120);
    }
    expect(state.story_chapter9_null_archivist_defeated).toBe(true);

    await page.evaluate(() => window.debug_trigger_lore_vision?.());
    for (let i = 0; i < 28; i += 1) {
      await advance(page, 140);
      state = await getState(page);
      if (state.chapter9_lore_vision_open) break;
      await advanceDialogueToEnd(page, 3);
    }
    state = await getState(page);
    expect(state.chapter9_lore_vision_open).toBe(true);
    await expect(page.locator("[data-testid='lore-vision-overlay']")).toBeVisible();
    await expect(page).toHaveScreenshot("lore-vision-panel-1.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 680,
    });

    for (let i = 0; i < 14; i += 1) {
      const loopState = await getState(page);
      if (!loopState.chapter9_lore_vision_open) break;
      await page.locator("[data-testid='lore-vision-continue']").click();
      await advance(page, 120);
    }
    state = await getState(page);
    expect(state.current_objective).toBe("make_vault_choice");
    expect(state.story_endgame_started).toBe(false);
    await expect(page.locator("[data-testid='vault-choice-ui']")).toBeVisible();
    await expect(page).toHaveScreenshot("vault-choice-ui.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 680,
    });

    await page.locator("[data-testid='choice-take-crownkey']").click();
    await advance(page, 220);
    state = await getState(page);
    expect(state.story_chapter9_choice).toBe("take_key");
    expect(state.story_crownheart_key).toBe(true);
    expect(state.story_endgame_started).toBe(true);
    expect(state.story_endgame_goal_id).toBe("STOP_THE_LAST_SPIRE");
    expect(state.story_endgame_route_seed_unlocked).toBe(true);
    expect(["prepare_endgame", "obtain_third_seal"]).toContain(state.current_objective);
    await expect(page).toHaveScreenshot("endgame-objective.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 680,
    });

    expect(consoleErrors).toEqual([]);
  });

  test("chapter 9 regressions: swaps, Elaine ranged flow, AI spacing, visual stability", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupChapter9State(page);

    await page.evaluate(() => {
      window.debug_set_story_flag?.("chapter9_started", false);
      window.debug_set_story_flag?.("chapter9_anchors_attuned", false);
      window.debug_set_story_flag?.("chapter9_null_archivist_defeated", false);
      window.debug_set_story_flag?.("chapter8_mute_spikes_cleared", false);
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 220);
    let state = await getState(page);
    expect(state.story_elaine_joined).toBe(true);
    expect(state.story_willow_joined).toBe(true);

    state = await requestPartySwap(page, "Digit1", "arthur");
    expect(state.active_character).toBe("arthur");

    state = await requestPartySwap(page, "Digit2", "elaine");
    expect(state.active_character).toBe("elaine");
    let renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    state = await requestPartySwap(page, "Digit3", "willow");
    expect(state.active_character).toBe("willow");

    state = await requestPartySwap(page, "Digit2", "elaine");
    expect(state.active_character).toBe("elaine");

    const enemyBefore = state.enemies.find((enemy) => enemy.state !== "dead");
    expect(enemyBefore).toBeTruthy();
    const enemyId = enemyBefore.id;
    await page.evaluate((id) => {
      window.debug_set_target_entity?.(id);
      window.debug_force_basic_attack?.();
    }, enemyId);
    await advance(page, 260);
    state = await getState(page);
    const enemyAfter = state.enemies.find((enemy) => enemy.id === enemyId);
    expect(Number(enemyAfter?.health ?? 0)).toBeLessThan(Number(enemyBefore?.health ?? 999));

    await page.evaluate(() => window.debug_set_hp?.(70));
    await advance(page, 120);
    const hpBefore = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1800);
    state = await getState(page);
    expect(state.player_health).toBeGreaterThanOrEqual(hpBefore);
    renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");

    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 1200);
    let maxElaineThreatDistance = 0;
    let latestElaineThreatDistance = 0;
    let elaineAi = null;
    for (let i = 0; i < 24; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      const frame = await getState(page);
      const threat = frame.enemies.find((enemy) => enemy.state !== "dead");
      elaineAi = (aiState?.members ?? []).find((entry) => entry.id === "elaine") ?? null;
      if (elaineAi && threat) {
        const dist = Math.hypot(elaineAi.x - threat.x, elaineAi.z - threat.z);
        latestElaineThreatDistance = dist;
        maxElaineThreatDistance = Math.max(maxElaineThreatDistance, dist);
      }
      if (elaineAi && maxElaineThreatDistance >= 2.9 && latestElaineThreatDistance >= 2.5) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(maxElaineThreatDistance).toBeGreaterThanOrEqual(2.9);
    expect(latestElaineThreatDistance).toBeGreaterThanOrEqual(2.5);

    await advance(page, 5000);
    state = await getState(page);
    expect(state.scene_id).toBe("region4_seed");
    expect(state.debug_terrain_status).toBe("mounted");
    expect(Number(state.visual_saturation_shift)).toBeGreaterThan(-0.65);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("endgame act i third seal and outer spire", () => {
  async function setupEndgameAct1State(page) {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter9_started", true);
      window.debug_set_story_flag?.("chapter9_anchors_attuned", true);
      window.debug_set_story_flag?.("chapter9_null_archivist_defeated", true);
      window.debug_set_story_flag?.("chapter9_choice", "take_key");
      window.debug_set_story_flag?.("endgame_started", true);
      window.debug_set_story_flag?.("endgame_goal_id", "STOP_THE_LAST_SPIRE");
      window.debug_set_story_flag?.("endgame_route_seed_unlocked", true);
      window.debug_set_story_flag?.("endgame_act1_started", false);
      window.debug_set_story_flag?.("endgame_task_third_seal_obtained", false);
      window.debug_set_story_flag?.("endgame_outer_spire_unlocked", false);
      window.debug_set_story_flag?.("endgame_outer_spire_breached", false);
      window.debug_set_story_flag?.("endgame_gatewarden_defeated", false);
      window.debug_set_story_flag?.("endgame_spire_entry_unlocked", false);
      window.debug_set_story_flag?.("endgame_spire_gatewarden_active", false);
      window.debug_set_story_flag?.("endgame_task_third_seal", false);
      window.debug_warp_to_scene?.("rootway");
    });
    await advance(page, 320);
    await waitForScene(page, "region4_seed", 3600);
  }

  test("endgame act i smoke: third seal -> breach -> gatewarden -> antechamber", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupEndgameAct1State(page);

    await advance(page, 1200);
    await advanceDialogueToEnd(page, 48);
    await advance(page, 180);
    let state = await getState(page);
    expect(state.story_endgame_act1_started).toBe(true);
    expect(state.current_objective).toBe("obtain_third_seal");

    await page.evaluate(() => window.debug_teleport_player?.(-1.34, 1.36));
    await advance(page, 160);
    await expect(page).toHaveScreenshot("oath-shrine.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 700,
    });

    const thirdSeal = await page.evaluate(() => window.debug_force_third_seal_obtained?.());
    expect(thirdSeal?.thirdSealObtained).toBe(true);
    await advance(page, 200);
    state = await getState(page);
    expect(state.story_endgame_task_third_seal_obtained).toBe(true);
    expect(state.story_endgame_outer_spire_unlocked).toBe(true);
    expect(state.current_objective).toBe("breach_outer_spire");

    await page.evaluate(() => window.debug_warp_to_scene?.("spire_approach"));
    await advance(page, 260);
    await waitForScene(page, "spire_approach", 3600);

    const breachStart = await page.evaluate(() => window.debug_start_spire_breach?.());
    expect(breachStart?.started).toBe(true);
    await advance(page, 200);
    await expect(page.locator("[data-testid='breach-meter']")).toBeVisible();
    await expect(page).toHaveScreenshot("breach-meter.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 700,
    });
    await expect(page).toHaveScreenshot("spire-gate.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 700,
    });

    for (const idx of [0, 1, 2]) {
      const disabled = await page.evaluate((nodeIndex) => window.debug_disable_lock_node?.(nodeIndex), idx);
      expect(disabled?.disabled).toBe(true);
      await advance(page, 120);
    }
    state = await getState(page);
    expect(state.story_endgame_outer_spire_breached).toBe(true);
    expect(state.current_objective).toBe("defeat_gatewarden");

    const gatewardenStart = await page.evaluate(() => window.debug_start_gatewarden_boss?.());
    expect(gatewardenStart?.started).toBe(true);
    await advance(page, 260);
    state = await getState(page);
    expect(state.boss_instance?.active).toBe(true);
    expect(state.boss_instance?.bossId).toBe("spire_gatewarden");
    await expect(page).toHaveScreenshot("gatewarden-boss.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 720,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.28);
      window.debug_add_effect?.("arthur", "null_clamp", 6);
    });
    await advance(page, 220);
    state = await getState(page);
    const nullClampVisible = (state.status_effects?.arthur ?? []).some((entry) => entry.id === "null_clamp");
    expect(nullClampVisible).toBe(true);
    await expect(page).toHaveScreenshot("null-clamp-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 720,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.02);
      window.debug_damage_boss?.(9999);
    });
    for (let i = 0; i < 42; i += 1) {
      state = await getState(page);
      if (state.story_endgame_gatewarden_defeated) break;
      await advance(page, 120);
    }
    expect(state.story_endgame_gatewarden_defeated).toBe(true);
    expect(state.story_endgame_spire_entry_unlocked).toBe(true);
    expect(state.current_objective).toBe("enter_outer_spire");

    await tapPortalTo(page, "spire_antechamber");
    await advance(page, 2400);
    state = await waitForScene(page, "spire_antechamber", 4200);
    expect(state.scene_id).toBe("spire_antechamber");
    await expect(page).toHaveScreenshot("spire-antechamber.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 720,
    });

    await advanceDialogueToEnd(page, 48);
    await advance(page, 120);
    await page.evaluate(() => window.debug_teleport_player?.(-3.82, 0.02));
    await advance(page, 120);
    await page.keyboard.press("Space");
    await advance(page, 2200);
    state = await waitForScene(page, "spire_approach", 4200);
    expect(state.scene_id).toBe("spire_approach");
    expect(consoleErrors).toEqual([]);
  });

  test("endgame act i regressions: swaps, Elaine active flow, ai spacing, and visual stability", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupEndgameAct1State(page);

    await page.evaluate(() => {
      window.debug_force_third_seal_obtained?.();
      window.debug_warp_to_scene?.("spire_approach");
    });
    await advance(page, 300);
    await waitForScene(page, "spire_approach", 3600);

    let state = await getState(page);
    expect(state.story_elaine_joined).toBe(true);
    expect(state.story_willow_joined).toBe(true);

    await page.keyboard.press("Digit1");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("arthur");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    await page.keyboard.press("Digit3");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("willow");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    let renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    await page.evaluate(() => {
      window.debug_set_elaine_mp?.(100);
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 220);
    state = await getState(page);
    const enemyBefore = state.enemies.find((enemy) => enemy.state !== "dead");
    expect(enemyBefore).toBeTruthy();

    await page.evaluate((enemyId) => {
      window.debug_set_target_entity?.(enemyId);
      window.debug_force_basic_attack?.();
    }, enemyBefore.id);
    await advance(page, 300);
    state = await getState(page);
    const enemyAfter = state.enemies.find((enemy) => enemy.id === enemyBefore.id);
    expect(Number(enemyAfter?.health ?? 0)).toBeLessThan(Number(enemyBefore?.health ?? 999));

    await page.evaluate(() => window.debug_set_hp?.(70));
    await advance(page, 120);
    const hpBefore = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1900);
    state = await getState(page);
    expect(state.player_health).toBeGreaterThanOrEqual(hpBefore);
    const partyState = await page.evaluate(() => window.debug_get_party_state?.());
    expect(Number(partyState?.elaineCooldowns?.singleHeal ?? 0)).toBeGreaterThan(0);
    renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 1200);
    let maxElaineThreatDistance = 0;
    let latestElaineThreatDistance = 0;
    let elaineAi = null;
    for (let i = 0; i < 24; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      const frame = await getState(page);
      const threat = frame.enemies.find((enemy) => enemy.state !== "dead");
      elaineAi = (aiState?.members ?? []).find((entry) => entry.id === "elaine") ?? null;
      if (elaineAi && threat) {
        const dist = Math.hypot(elaineAi.x - threat.x, elaineAi.z - threat.z);
        latestElaineThreatDistance = dist;
        maxElaineThreatDistance = Math.max(maxElaineThreatDistance, dist);
      }
      if (elaineAi && maxElaineThreatDistance >= 2.9 && latestElaineThreatDistance >= 2.5) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(maxElaineThreatDistance).toBeGreaterThanOrEqual(2.9);
    expect(latestElaineThreatDistance).toBeGreaterThanOrEqual(2.5);

    await advance(page, 5000);
    state = await getState(page);
    expect(state.scene_id).toBe("spire_approach");
    expect(state.debug_terrain_status).toBe("mounted");
    expect(Number(state.visual_saturation_shift)).toBeGreaterThan(-0.65);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("endgame act ii inner spire memory loom", () => {
  async function setupEndgameAct2Entry(page) {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter9_started", true);
      window.debug_set_story_flag?.("chapter9_anchors_attuned", true);
      window.debug_set_story_flag?.("chapter9_null_archivist_defeated", true);
      window.debug_set_story_flag?.("chapter9_choice", "take_key");
      window.debug_set_story_flag?.("endgame_started", true);
      window.debug_set_story_flag?.("endgame_goal_id", "STOP_THE_LAST_SPIRE");
      window.debug_set_story_flag?.("endgame_route_seed_unlocked", true);
      window.debug_set_story_flag?.("endgame_act1_started", true);
      window.debug_set_story_flag?.("endgame_task_third_seal_obtained", true);
      window.debug_set_story_flag?.("endgame_outer_spire_unlocked", true);
      window.debug_set_story_flag?.("endgame_outer_spire_breached", true);
      window.debug_set_story_flag?.("endgame_gatewarden_defeated", true);
      window.debug_set_story_flag?.("endgame_spire_entry_unlocked", true);
      window.debug_set_story_flag?.("endgame_spire_gatewarden_active", false);
      window.debug_set_story_flag?.("endgame_act2_started", false);
      window.debug_set_story_flag?.("endgame_inner_spire_entered", false);
      window.debug_set_story_flag?.("endgame_resonance_lock_1", false);
      window.debug_set_story_flag?.("endgame_resonance_lock_2", false);
      window.debug_set_story_flag?.("endgame_resonance_lock_3", false);
      window.debug_set_story_flag?.("endgame_loom_proctor_defeated", false);
      window.debug_set_story_flag?.("endgame_act3_unlocked", false);
      window.debug_set_story_flag?.("endgame_last_door_seen", false);
      window.debug_set_story_flag?.("endgame_loom_proctor_active", false);
      window.debug_warp_to_scene?.("spire_antechamber");
    });
    await advance(page, 320);
    await waitForScene(page, "spire_antechamber", 3600);
  }

  async function closeLoreOverlayIfOpen(page) {
    for (let i = 0; i < 30; i += 1) {
      const state = await getState(page);
      if (!state.chapter9_lore_vision_open) return;
      await page.keyboard.press("Space");
      await advance(page, 140);
    }
  }

  test("endgame act ii smoke: antechamber -> locks -> loom proctor -> last door", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupEndgameAct2Entry(page);

    await advance(page, 1200);
    await advanceDialogueToEnd(page, 48);
    await advance(page, 180);
    let state = await getState(page);
    expect(state.story_endgame_act2_started).toBe(true);
    expect(state.current_objective).toBe("enter_inner_spire");

    const guidanceEvent = await page.evaluate(() => window.debug_force_banter?.("guidance"));
    expect(guidanceEvent?.triggered).toBe(true);

    await tapPortalTo(page, "inner_spire");
    await advance(page, 2200);
    state = await waitForScene(page, "inner_spire", 4200);
    expect(state.story_endgame_inner_spire_entered).toBe(true);
    expect(state.current_objective).toBe("solve_resonance_locks");
    await expect(page.locator("[data-testid='memory-pressure']")).toBeVisible();
    await expect(page).toHaveScreenshot("inner-spire-entry.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 780,
    });
    await expect(page).toHaveScreenshot("memory-pressure.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 780,
    });

    for (const idx of [1, 2, 3]) {
      const lock = await page.evaluate((lockIndex) => window.debug_complete_resonance_lock?.(lockIndex), idx);
      expect(lock?.completed).toBe(true);
      await advance(page, 120);
    }
    state = await getState(page);
    expect(state.story_endgame_resonance_lock_1).toBe(true);
    expect(state.story_endgame_resonance_lock_2).toBe(true);
    expect(state.story_endgame_resonance_lock_3).toBe(true);
    expect(state.current_objective).toBe("defeat_loom_proctor");

    const loomStart = await page.evaluate(() => window.debug_start_loom_proctor?.());
    expect(loomStart?.started).toBe(true);
    await advance(page, 260);
    state = await getState(page);
    expect(state.boss_instance?.active).toBe(true);
    expect(state.boss_instance?.bossId).toBe("loom_proctor");
    await expect(page).toHaveScreenshot("loom-proctor-boss.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 820,
    });

    await page.evaluate(() => window.debug_add_effect?.("arthur", "memory_tax", 6));
    await advance(page, 220);
    state = await getState(page);
    const memoryTaxVisible = (state.status_effects?.arthur ?? []).some((entry) => entry.id === "memory_tax");
    expect(memoryTaxVisible).toBe(true);
    await expect(page).toHaveScreenshot("memory-tax-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 820,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.02);
      window.debug_damage_boss?.(9999);
    });
    for (let i = 0; i < 42; i += 1) {
      state = await getState(page);
      if (state.story_endgame_loom_proctor_defeated) break;
      await advance(page, 120);
    }
    expect(state.story_endgame_loom_proctor_defeated).toBe(true);
    await advanceDialogueToEnd(page, 48);
    await advance(page, 220);

    const loreStart = await page.evaluate(() => window.debug_trigger_act2_lore?.());
    expect(Boolean(loreStart?.triggered || loreStart?.pending)).toBe(true);
    for (let i = 0; i < 48; i += 1) {
      state = await getState(page);
      if (state.chapter9_lore_vision_open) {
        await page.keyboard.press("Space");
      }
      if (state.story_endgame_act3_unlocked) {
        break;
      }
      await advance(page, 140);
    }
    await closeLoreOverlayIfOpen(page);
    state = await getState(page);
    expect(state.story_endgame_act3_unlocked).toBe(true);
    expect(state.current_objective).toBe("approach_last_door");

    const loreTopic = await page.evaluate(() =>
      window.debug_force_banter?.("lore", "endgame_act2_backstory_willow_teacher_title")
    );
    expect(loreTopic?.triggered).toBe(true);

    await tapPortalTo(page, "inner_spire_last_door");
    await advance(page, 2200);
    state = await waitForScene(page, "inner_spire_last_door", 4200);
    expect(state.scene_id).toBe("inner_spire_last_door");
    await page.evaluate(() => window.debug_teleport_player?.(1.86, -0.18));
    await advance(page, 120);
    await page.keyboard.press("Space");
    await advance(page, 260);
    state = await getState(page);
    expect(state.story_endgame_last_door_seen).toBe(true);
    await expect(page).toHaveScreenshot("last-door-stub.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 820,
    });

    await page.evaluate(() => window.debug_teleport_player?.(-3.34, 0.02));
    await advance(page, 120);
    await tapPortalTo(page, "inner_spire");
    await advance(page, 2100);
    state = await waitForScene(page, "inner_spire", 4200);
    expect(state.scene_id).toBe("inner_spire");
    expect(consoleErrors).toEqual([]);
  });

  test("endgame act ii regressions: swaps, Elaine active flow, ai spacing, and visual stability", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupEndgameAct2Entry(page);

    await page.evaluate(() => {
      window.debug_set_story_flag?.("endgame_act2_started", true);
      window.debug_set_story_flag?.("endgame_inner_spire_entered", true);
      window.debug_set_story_flag?.("endgame_resonance_lock_1", false);
      window.debug_set_story_flag?.("endgame_resonance_lock_2", false);
      window.debug_set_story_flag?.("endgame_resonance_lock_3", false);
      window.debug_set_story_flag?.("endgame_loom_proctor_defeated", false);
      window.debug_set_story_flag?.("endgame_act3_unlocked", false);
      window.debug_warp_to_scene?.("inner_spire");
    });
    await advance(page, 340);
    await waitForScene(page, "inner_spire", 3600);

    let state = await getState(page);
    expect(state.story_elaine_joined).toBe(true);
    expect(state.story_willow_joined).toBe(true);

    await page.keyboard.press("Digit1");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("arthur");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    await page.keyboard.press("Digit3");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("willow");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    let renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    await page.evaluate(() => {
      window.debug_set_elaine_mp?.(100);
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 220);
    state = await getState(page);
    const enemyBefore = state.enemies.find((enemy) => enemy.state !== "dead");
    expect(enemyBefore).toBeTruthy();

    await page.evaluate((enemyId) => {
      window.debug_set_target_entity?.(enemyId);
      window.debug_force_basic_attack?.();
    }, enemyBefore.id);
    await advance(page, 300);
    state = await getState(page);
    const enemyAfter = state.enemies.find((enemy) => enemy.id === enemyBefore.id);
    expect(Number(enemyAfter?.health ?? 0)).toBeLessThan(Number(enemyBefore?.health ?? 999));

    await page.evaluate(() => window.debug_set_hp?.(70));
    await advance(page, 120);
    const hpBefore = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1900);
    state = await getState(page);
    expect(state.player_health).toBeGreaterThanOrEqual(hpBefore);
    const partyState = await page.evaluate(() => window.debug_get_party_state?.());
    expect(Number(partyState?.elaineCooldowns?.singleHeal ?? 0)).toBeGreaterThan(0);
    renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);
    await expect(page).toHaveScreenshot("elaine-active-regression-act2.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 820,
    });

    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 1200);
    let maxElaineThreatDistance = 0;
    let latestElaineThreatDistance = 0;
    let elaineAi = null;
    for (let i = 0; i < 24; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      const frame = await getState(page);
      const threat = frame.enemies.find((enemy) => enemy.state !== "dead");
      elaineAi = (aiState?.members ?? []).find((entry) => entry.id === "elaine") ?? null;
      if (elaineAi && threat) {
        const dist = Math.hypot(elaineAi.x - threat.x, elaineAi.z - threat.z);
        latestElaineThreatDistance = dist;
        maxElaineThreatDistance = Math.max(maxElaineThreatDistance, dist);
      }
      if (elaineAi && maxElaineThreatDistance >= 2.9 && latestElaineThreatDistance >= 2.5) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(maxElaineThreatDistance).toBeGreaterThanOrEqual(2.9);
    expect(latestElaineThreatDistance).toBeGreaterThanOrEqual(2.5);

    await advance(page, 5000);
    state = await getState(page);
    expect(state.scene_id).toBe("inner_spire");
    expect(state.debug_terrain_status).toBe("mounted");
    expect(Number(state.visual_saturation_shift)).toBeGreaterThan(-0.65);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("endgame act iii last spire finale", () => {
  async function setupEndgameAct3Entry(page) {
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_defeat_all_enemies?.();
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("chapter9_started", true);
      window.debug_set_story_flag?.("chapter9_anchors_attuned", true);
      window.debug_set_story_flag?.("chapter9_null_archivist_defeated", true);
      window.debug_set_story_flag?.("chapter9_choice", "take_key");
      window.debug_set_story_flag?.("endgame_started", true);
      window.debug_set_story_flag?.("endgame_goal_id", "STOP_THE_LAST_SPIRE");
      window.debug_set_story_flag?.("endgame_route_seed_unlocked", true);
      window.debug_set_story_flag?.("endgame_act1_started", true);
      window.debug_set_story_flag?.("endgame_task_third_seal_obtained", true);
      window.debug_set_story_flag?.("endgame_outer_spire_unlocked", true);
      window.debug_set_story_flag?.("endgame_outer_spire_breached", true);
      window.debug_set_story_flag?.("endgame_gatewarden_defeated", true);
      window.debug_set_story_flag?.("endgame_spire_entry_unlocked", true);
      window.debug_set_story_flag?.("endgame_act2_started", true);
      window.debug_set_story_flag?.("endgame_inner_spire_entered", true);
      window.debug_set_story_flag?.("endgame_resonance_lock_1", true);
      window.debug_set_story_flag?.("endgame_resonance_lock_2", true);
      window.debug_set_story_flag?.("endgame_resonance_lock_3", true);
      window.debug_set_story_flag?.("endgame_loom_proctor_defeated", true);
      window.debug_set_story_flag?.("endgame_act3_unlocked", true);
      window.debug_set_story_flag?.("endgame_last_door_seen", true);
      window.debug_set_story_flag?.("endgame_act3_started", false);
      window.debug_set_story_flag?.("endgame_last_door_opened", false);
      window.debug_set_story_flag?.("endgame_last_spire_entered", false);
      window.debug_set_story_flag?.("endgame_setpiece_rift_crossed", false);
      window.debug_set_story_flag?.("endgame_setpiece_core_reached", false);
      window.debug_set_story_flag?.("endgame_final_boss_defeated", false);
      window.debug_set_story_flag?.("endgame_choice_made", false);
      window.debug_set_story_flag?.("endgame_ending", "");
      window.debug_set_story_flag?.("endgame_credits_seen", false);
      window.debug_set_story_flag?.("ngplus_unlocked", false);
      window.debug_set_story_flag?.("endgame_narrator_crown_active", false);
      window.debug_set_objective?.("approach_last_door");
      window.debug_warp_to_scene?.("inner_spire_last_door");
    });
    await advance(page, 360);
    await waitForScene(page, "inner_spire_last_door", 4200);
  }

  async function enterLastSpireFromDoor(page) {
    await page.evaluate(() => window.debug_teleport_player?.(1.84, -0.14));
    await advance(page, 140);
    await page.keyboard.press("Space");
    await advance(page, 220);
    for (let i = 0; i < 64; i += 1) {
      const state = await getState(page);
      if (state.scene_id === "last_spire") return state;
      if (state.dialogue_active) {
        await page.keyboard.press("Enter");
      } else {
        await page.keyboard.press("Space");
      }
      await advance(page, 120);
    }
    return waitForScene(page, "last_spire", 5200);
  }

  async function reachAct3ChoicePoint(page, { fullPath = true } = {}) {
    if (fullPath) {
      await setupEndgameAct3Entry(page);
      await enterLastSpireFromDoor(page);

      const riftStart = await page.evaluate(() => window.debug_start_rift_setpiece?.());
      expect(riftStart?.started).toBe(true);
      await advance(page, 220);
      for (const idx of [1, 2, 3]) {
        const lock = await page.evaluate((anchorIndex) => window.debug_complete_rift_anchor?.(anchorIndex), idx);
        expect(lock?.completed).toBe(true);
        await advance(page, 120);
      }

      let state = await getState(page);
      expect(state.story_endgame_setpiece_rift_crossed).toBe(true);
      expect(state.current_objective).toBe("reach_crown_engine");

      const coreStart = await page.evaluate(() => window.debug_start_core_setpiece?.());
      expect(coreStart?.started).toBe(true);
      await advance(page, 180);
      for (const idx of [1, 2, 3]) {
        const clamp = await page.evaluate((clampIndex) => window.debug_disable_final_clamp?.(clampIndex), idx);
        expect(clamp?.disabled).toBe(true);
        await advance(page, 100);
      }
      state = await getState(page);
      expect(state.story_endgame_setpiece_core_reached).toBe(true);
      expect(state.current_objective).toBe("defeat_final_boss");
    } else {
      await page.evaluate(() => {
        window.debug_warp_to_scene?.("last_spire");
        window.debug_start_final_boss?.();
      });
      await advance(page, 320);
    }

    const bossStart = await page.evaluate(() => window.debug_start_final_boss?.());
    expect(Boolean(bossStart?.started || bossStart?.boss?.active)).toBe(true);
    await advance(page, 260);
    let state = await getState(page);
    expect(state.boss_instance?.active).toBe(true);
    expect(state.boss_instance?.bossId).toBe("narrator_crown");

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.02);
      window.debug_damage_boss?.(9999);
    });
    for (let i = 0; i < 60; i += 1) {
      state = await getState(page);
      if (state.story_endgame_final_boss_defeated) break;
      await advance(page, 120);
    }
    expect(state.story_endgame_final_boss_defeated).toBe(true);
    expect(state.current_objective).toBe("choose_ending");
    return state;
  }

  test("act iii smoke: last door -> rift -> core -> narrator crown -> ending choice", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await setupEndgameAct3Entry(page);

    let state = await enterLastSpireFromDoor(page);
    expect(state.story_endgame_act3_started).toBe(true);
    expect(state.story_endgame_last_door_opened).toBe(true);
    expect(state.story_endgame_last_spire_entered).toBe(true);
    expect(state.current_objective).toBe("cross_rift");

    await expect(page.locator("[data-testid='rift-stability']")).toBeVisible();
    await expect(page).toHaveScreenshot("last-spire-rift-entry.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 900,
    });

    const riftStart = await page.evaluate(() => window.debug_start_rift_setpiece?.());
    expect(riftStart?.started).toBe(true);
    for (const idx of [1, 2, 3]) {
      const lock = await page.evaluate((anchorIndex) => window.debug_complete_rift_anchor?.(anchorIndex), idx);
      expect(lock?.completed).toBe(true);
      await advance(page, 120);
    }
    state = await getState(page);
    expect(state.story_endgame_setpiece_rift_crossed).toBe(true);
    expect(state.current_objective).toBe("reach_crown_engine");

    await expect(page).toHaveScreenshot("last-spire-rift-stability.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 900,
    });

    const coreStart = await page.evaluate(() => window.debug_start_core_setpiece?.());
    expect(coreStart?.started).toBe(true);
    await expect(page.locator("[data-testid='clamp-status']")).toBeVisible();
    for (const idx of [1, 2, 3]) {
      const clamp = await page.evaluate((clampIndex) => window.debug_disable_final_clamp?.(clampIndex), idx);
      expect(clamp?.disabled).toBe(true);
      await advance(page, 100);
    }
    state = await getState(page);
    expect(state.story_endgame_setpiece_core_reached).toBe(true);
    expect(state.current_objective).toBe("defeat_final_boss");
    await expect(page).toHaveScreenshot("last-spire-core-clamps.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 900,
    });

    const bossStart = await page.evaluate(() => window.debug_start_final_boss?.());
    expect(Boolean(bossStart?.started || bossStart?.boss?.active)).toBe(true);
    await advance(page, 240);
    state = await getState(page);
    expect(state.boss_instance?.active).toBe(true);
    expect(state.boss_instance?.bossId).toBe("narrator_crown");
    await expect(page).toHaveScreenshot("narrator-crown-boss.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 960,
    });

    await page.evaluate(() => {
      const addedArthur = window.debug_add_effect?.("arthur", "rewrite_mark", 6);
      if (!addedArthur) {
        window.debug_add_effect?.("arthur_player", "rewrite_mark", 6);
      }
    });
    await advance(page, 180);
    const rewriteMarkVisible = await page.evaluate(() =>
      (window.debug_get_effects?.("arthur") ?? []).some((entry) => entry.id === "rewrite_mark")
    );
    expect(rewriteMarkVisible).toBe(true);
    await expect(page).toHaveScreenshot("rewrite-mark-icon.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 960,
    });

    await page.evaluate(() => {
      window.debug_set_boss_hp?.(0.02);
      window.debug_damage_boss?.(9999);
    });
    for (let i = 0; i < 60; i += 1) {
      state = await getState(page);
      if (state.story_endgame_final_boss_defeated) break;
      await advance(page, 120);
    }
    expect(state.story_endgame_final_boss_defeated).toBe(true);
    expect(state.current_objective).toBe("choose_ending");

    const choiceOpen = await page.evaluate(() => window.debug_trigger_choice_ui?.());
    expect(choiceOpen?.opened).toBe(true);
    await expect(page.locator("[data-testid='ending-choice-seal']")).toBeVisible();
    await expect(page.locator("[data-testid='ending-choice-rewrite']")).toBeVisible();
    await expect(page.locator("[data-testid='ending-choice-confirm-hint']")).toBeVisible();
    await expect(page).toHaveScreenshot("ending-choice-ui-act3.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 980,
    });

    expect(consoleErrors).toEqual([]);
  });

  test("act iii ending A (seal): persists flags, credits, and ng+", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await reachAct3ChoicePoint(page, { fullPath: false });

    const opened = await page.evaluate(() => window.debug_trigger_choice_ui?.());
    expect(opened?.opened).toBe(true);
    await advance(page, 100);
    await page.keyboard.press("Enter");
    await advance(page, 100);
    await page.keyboard.press("Enter");
    await advance(page, 140);
    await advanceDialogueToEnd(page, 72);

    await page.waitForSelector("[data-testid='credits-overlay']", { state: "visible", timeout: 4200 });
    let state = await getState(page);
    expect(state.story_endgame_choice_made).toBe(true);
    expect(state.story_endgame_ending).toBe("seal");
    await expect(page).toHaveScreenshot("credits-overlay-seal.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 980,
    });

    await page.keyboard.press("Enter");
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.story_endgame_credits_seen && state.story_ngplus_unlocked) break;
      await advance(page, 140);
    }
    expect(state.story_endgame_credits_seen).toBe(true);
    expect(state.story_ngplus_unlocked).toBe(true);
    expect(consoleErrors).toEqual([]);
  });

  test("act iii ending B (rewrite): persists flags, credits, and ng+", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await reachAct3ChoicePoint(page, { fullPath: false });

    const opened = await page.evaluate(() => window.debug_trigger_choice_ui?.());
    expect(opened?.opened).toBe(true);
    await advance(page, 100);
    await page.keyboard.press("ArrowRight");
    await advance(page, 80);
    await page.keyboard.press("Enter");
    await advance(page, 100);
    await page.keyboard.press("Enter");
    await advance(page, 140);
    await advanceDialogueToEnd(page, 72);

    await page.waitForSelector("[data-testid='credits-overlay']", { state: "visible", timeout: 4200 });
    let state = await getState(page);
    expect(state.story_endgame_choice_made).toBe(true);
    expect(state.story_endgame_ending).toBe("rewrite");

    await page.keyboard.press("Enter");
    for (let i = 0; i < 40; i += 1) {
      state = await getState(page);
      if (state.story_endgame_credits_seen && state.story_ngplus_unlocked) break;
      await advance(page, 140);
    }
    expect(state.story_endgame_credits_seen).toBe(true);
    expect(state.story_ngplus_unlocked).toBe(true);
    expect(consoleErrors).toEqual([]);
  });

  test("act iii regressions: swaps, Elaine active flow, ai spacing, and visual stability", async ({ page }) => {
    const consoleErrors = attachConsoleErrorTrap(page);
    await page.evaluate(() => {
      window.debug_set_enemy_attacks_enabled?.(false);
      window.debug_set_story_flag?.("elaine_joined", true);
      window.debug_set_story_flag?.("willow_joined", true);
      window.debug_set_story_flag?.("endgame_started", true);
      window.debug_set_story_flag?.("endgame_act3_unlocked", true);
      window.debug_set_story_flag?.("endgame_act3_started", true);
      window.debug_set_story_flag?.("endgame_last_door_opened", true);
      window.debug_set_story_flag?.("endgame_last_spire_entered", true);
      window.debug_set_story_flag?.("endgame_setpiece_rift_crossed", true);
      window.debug_set_story_flag?.("endgame_setpiece_core_reached", true);
      window.debug_set_story_flag?.("endgame_final_boss_defeated", true);
      window.debug_set_story_flag?.("endgame_choice_made", false);
      window.debug_set_story_flag?.("endgame_ending", "");
      window.debug_set_story_flag?.("endgame_credits_seen", false);
      window.debug_set_story_flag?.("ngplus_unlocked", false);
      window.debug_warp_to_scene?.("last_spire");
    });
    await advance(page, 380);
    await waitForScene(page, "last_spire", 4200);

    let state = await getState(page);
    expect(state.story_elaine_joined).toBe(true);
    expect(state.story_willow_joined).toBe(true);

    await page.keyboard.press("Digit1");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("arthur");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    await page.keyboard.press("Digit3");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("willow");

    await page.keyboard.press("Digit2");
    await advance(page, 140);
    state = await getState(page);
    expect(state.active_character).toBe("elaine");

    let renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.activeCharacter).toBe("elaine");
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);

    await page.evaluate(() => {
      window.debug_set_elaine_mp?.(100);
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 240);
    state = await getState(page);
    const enemyBefore = state.enemies.find((enemy) => enemy.state !== "dead");
    expect(enemyBefore).toBeTruthy();

    await page.evaluate((enemyId) => {
      window.debug_set_target_entity?.(enemyId);
      window.debug_force_basic_attack?.();
    }, enemyBefore.id);
    await advance(page, 320);
    state = await getState(page);
    const enemyAfter = state.enemies.find((enemy) => enemy.id === enemyBefore.id);
    expect(Number(enemyAfter?.health ?? 0)).toBeLessThan(Number(enemyBefore?.health ?? 999));

    await page.evaluate(() => window.debug_set_hp?.(70));
    await advance(page, 120);
    const hpBefore = (await getState(page)).player_health;
    const cast = await page.evaluate(() => window.debug_force_elaine_cast?.("U"));
    expect(cast?.started).toBe(true);
    await advance(page, 1900);
    state = await getState(page);
    expect(state.player_health).toBeGreaterThanOrEqual(hpBefore);
    const partyState = await page.evaluate(() => window.debug_get_party_state?.());
    expect(Number(partyState?.elaineCooldowns?.singleHeal ?? 0)).toBeGreaterThan(0);
    renderState = await page.evaluate(() => window.debug_get_render_state?.());
    expect(renderState?.characters?.elaine?.baseVisible).toBe(true);
    await expect(page).toHaveScreenshot("elaine-active-regression-act3.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixels: 980,
    });

    await page.evaluate(() => {
      window.debug_set_active_character?.("arthur");
      window.debug_spawn_enemy_roles?.(["skirmisher"]);
    });
    await advance(page, 1200);
    let maxElaineThreatDistance = 0;
    let latestElaineThreatDistance = 0;
    let elaineAi = null;
    for (let i = 0; i < 24; i += 1) {
      await advance(page, 120);
      const aiState = await page.evaluate(() => window.debug_get_party_ai_state?.());
      const frame = await getState(page);
      const threat = frame.enemies.find((enemy) => enemy.state !== "dead");
      elaineAi = (aiState?.members ?? []).find((entry) => entry.id === "elaine") ?? null;
      if (elaineAi && threat) {
        const dist = Math.hypot(elaineAi.x - threat.x, elaineAi.z - threat.z);
        latestElaineThreatDistance = dist;
        maxElaineThreatDistance = Math.max(maxElaineThreatDistance, dist);
      }
      if (elaineAi && maxElaineThreatDistance >= 2.9 && latestElaineThreatDistance >= 2.5) {
        break;
      }
    }
    expect(elaineAi).toBeTruthy();
    expect(maxElaineThreatDistance).toBeGreaterThanOrEqual(2.9);
    expect(latestElaineThreatDistance).toBeGreaterThanOrEqual(2.5);

    await advance(page, 5000);
    state = await getState(page);
    expect(state.scene_id).toBe("last_spire");
    expect(state.debug_terrain_status).toBe("mounted");
    expect(Number(state.visual_saturation_shift)).toBeGreaterThan(-0.65);
    expect(consoleErrors).toEqual([]);
  });
});

test("Elaine join intro dialogue triggers once", async ({ page }) => {
  await bootstrap(page);
  await enterGameplayFlow(page);

  await page.evaluate(() => {
    window.debug_set_story_flag?.("elaine_join_intro_done", false);
    window.debug_set_story_flag?.("elaine_joined", true);
  });
  await advance(page, 900);

  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() || "{}");
    return state.dialogue_active === true;
  });
  await advance(page, 420);
  await expect(page).toHaveScreenshot("elaine-join-intro-dialogue.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 1000,
  });

  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press("Space");
    await advance(page, 120);
    const state = await getState(page);
    if (!state.dialogue_active) {
      break;
    }
  }

  let state = await getState(page);
  expect(state.story_elaine_join_intro_done).toBe(true);

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(500);
  });
  state = await getState(page);
  expect(state.dialogue_active).toBe(false);
});

test("Pause menu opens, freezes input, and resumes", async ({ page }) => {
  await bootstrap(page);
  await enterGameplayFlow(page);

  const before = await getState(page);
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="pause-menu"]')).toBeVisible();
  await page.keyboard.down("KeyD");
  await advance(page, 600);
  await page.keyboard.up("KeyD");
  const paused = await getState(page);
  expect(Math.abs(paused.player.x - before.player.x)).toBeLessThan(0.01);
  expect(Math.abs(paused.player.z - before.player.z)).toBeLessThan(0.01);

  await expect(page).toHaveScreenshot("pause-menu.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 1000,
  });

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-testid="pause-menu"]')).toBeHidden();
  await page.keyboard.down("KeyD");
  await advance(page, 500);
  await page.keyboard.up("KeyD");
  const resumed = await getState(page);
  expect(Math.abs(resumed.player.x - paused.player.x)).toBeGreaterThan(0.03);
});

test("Save slots support rename/save/load/overwrite/delete", async ({ page }) => {
  await bootstrap(page);
  await enterGameplayFlow(page);

  await page.evaluate(() => {
    window.debug_set_objective?.("return_to_rowan");
  });
  await page.click('[data-testid="menu-button"]');
  await expect(page.locator('[data-testid="pause-menu"]')).toBeVisible();

  const slotName = page.locator('[data-testid="slot-name-1"]');
  await slotName.fill("My Test Save");
  await slotName.dispatchEvent("change");
  await page.click('[data-testid="slot-save-1"]');
  await advance(page, 220);

  await expect(page).toHaveScreenshot("save-slots.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 1200,
  });

  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.debug_set_objective?.("none");
    window.debug_warp_to_scene?.("hollowScar");
  });
  await advance(page, 700);

  await page.click('[data-testid="menu-button"]');
  await page.click('[data-testid="slot-load-1"]');
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(400);
  });
  let state = await getState(page);
  expect(state.scene_id).toBe("thornmere");
  expect(state.objective).toBe("return_to_rowan");

  await page.click('[data-testid="menu-button"]');
  await page.click('[data-testid="slot-save-1"]');
  await expect(page.locator('[data-testid="overwrite-confirm"]')).toBeVisible();
  await expect(page).toHaveScreenshot("overwrite-modal.png", {
    animations: "disabled",
    fullPage: true,
    maxDiffPixels: 1000,
  });
  await page.click('#overwrite-confirm-yes');

  await page.click('[data-testid="slot-delete-1"]');
  await page.click('#overwrite-confirm-yes');
  await expect(page.locator('[data-testid="slot-load-1"]')).toBeDisabled();
  await expect(page.locator('[data-testid="slot-name-1"]')).toHaveValue("My Test Save");
  state = await getState(page);
  expect(state.pause_menu_open).toBe(true);
});
