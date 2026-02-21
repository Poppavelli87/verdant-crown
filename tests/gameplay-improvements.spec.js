const { test, expect } = require("@playwright/test");

async function bootstrap(page) {
  await page.goto("/");
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => {
    window.setScreenshotMode?.(true);
    window.advanceTime?.(300);
  });
}

async function getState(page) {
  return page.evaluate(() => JSON.parse(window.render_game_to_text?.() ?? "{}"));
}

async function advance(page, ms) {
  await page.evaluate((stepMs) => window.advanceTime?.(stepMs), ms);
}

test("circle separation solver resolves overlap deterministically", async ({ page }) => {
  await bootstrap(page);
  const result = await page.evaluate(() =>
    window.debug_resolve_circle_separation?.(
      [
        { id: "a", x: 0, z: 0, radius: 0.5, weight: 1 },
        { id: "b", x: 0, z: 0, radius: 0.5, weight: 1 },
      ],
      { iterations: 3, personalSpaceMultiplier: 1 }
    )
  );
  expect(Array.isArray(result)).toBe(true);
  const a = result.find((entry) => entry.id === "a");
  const b = result.find((entry) => entry.id === "b");
  const distance = Math.hypot(a.x - b.x, a.z - b.z);
  expect(distance).toBeGreaterThanOrEqual(1);
});

test("companions roam instead of sticking to player during idle", async ({ page }) => {
  await bootstrap(page);
  await page.evaluate(() => {
    window.debug_warp_to_scene?.("thornmere");
    window.debug_force_willow_join?.();
    window.debug_set_active_character?.("arthur");
    window.debug_set_enemy_attacks_enabled?.(false);
  });
  await advance(page, 1200);

  const distances = [];
  const aiStates = new Set();
  for (let i = 0; i < 35; i += 1) {
    await advance(page, 220);
    const state = await getState(page);
    const player = state.player;
    const willow = state.party?.willowFollower;
    if (!player || !willow) continue;
    distances.push(Math.hypot(willow.x - player.x, willow.z - player.z));
    const willowAi = (state.party?.ai?.members ?? []).find((entry) => entry.id === "willow");
    if (willowAi?.aiState) aiStates.add(willowAi.aiState);
  }

  const avg = distances.reduce((sum, value) => sum + value, 0) / Math.max(1, distances.length);
  const maxDistance = Math.max(...distances);
  expect(avg).toBeGreaterThan(0.7);
  expect(maxDistance).toBeGreaterThan(1.2);
  expect([...aiStates].some((state) => state === "wander" || state === "investigate" || state === "regroup")).toBe(true);
});

test("combat exposes telegraph and hit-stop feedback debug states", async ({ page }) => {
  await bootstrap(page);
  await page.evaluate(() => {
    window.debug_warp_to_scene?.("thornmere");
    window.debug_set_enemy_attacks_enabled?.(true);
    const p = JSON.parse(window.render_game_to_text?.() ?? "{}").player;
    window.debug_spawn_enemy_type?.("skirmisher", (p?.x ?? 0) + 1.15, p?.z ?? 0);
  });

  let telegraphSeen = false;
  for (let i = 0; i < 20; i += 1) {
    await advance(page, 120);
    const state = await getState(page);
    if ((state.enemies ?? []).some((enemy) => enemy.telegraphActive)) {
      telegraphSeen = true;
      break;
    }
  }
  expect(telegraphSeen).toBe(true);

  await page.evaluate(() => window.debug_force_basic_attack?.());
  await advance(page, 50);
  const afterAttack = await getState(page);
  expect(afterAttack.combat_hit_stop_remaining).toBeGreaterThan(0);
});
