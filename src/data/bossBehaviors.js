const STONE_WARD_MESSAGE = "The arena hardens under Stone Master's command!";
const SHADE_RITUAL_MESSAGE = "A dark ritual shrouds the field!";
const VOLT_SHIFT_MESSAGE = "The twins shift positions!";
const FINAL_SURGE_MESSAGE = "You feel the Aether surge!";

function setScriptFlag(ctx, key, value = true) {
  if (!ctx?.battleState?.scriptFlags) {
    ctx.battleState.scriptFlags = {};
  }
  ctx.battleState.scriptFlags[key] = value;
}

function getScriptFlag(ctx, key) {
  return Boolean(ctx?.battleState?.scriptFlags?.[key]);
}

function ensureTurnClock(ctx, dt) {
  if (!ctx?.battleState) return;
  ctx.battleState.turnClock = Math.max(0, Number(ctx.battleState.turnClock) || 0) + Math.max(0, Number(dt) || 0);
}

// Boss behavior callbacks are intentionally side-effect scoped to boss-instance hooks.
export const BOSS_BEHAVIORS = Object.freeze({
  stone_master_start(ctx) {
    if (!ctx?.setBattleModifier) return;
    if (getScriptFlag(ctx, "stone_start_done")) return;
    setScriptFlag(ctx, "stone_start_done", true);
    ctx.setBattleModifier({
      firstHitReduced: true,
      firstHitConsumed: false,
    });
    ctx.enqueueMessage?.(STONE_WARD_MESSAGE, 1.6);
  },

  shade_archivist_start(ctx) {
    if (!ctx?.setBattleModifier) return;
    if (getScriptFlag(ctx, "shade_start_done")) return;
    setScriptFlag(ctx, "shade_start_done", true);
    ctx.applyStatus?.("both", "gloom");
    ctx.setBattleModifier("damageModifier", 1.1);
    ctx.enqueueMessage?.(SHADE_RITUAL_MESSAGE, 1.6);
  },

  volt_twins_shift(ctx) {
    if (!ctx?.battleState) return;
    const dt = Math.max(0, Number(ctx?.payload?.dt) || 0);
    const elapsed = Math.max(0, Number(ctx.battleState.twinsShiftElapsed) || 0) + dt;
    ctx.battleState.twinsShiftElapsed = elapsed;
    if (elapsed < 2) return;
    ctx.battleState.twinsShiftElapsed = 0;
    const switched = ctx.repositionBoss?.("volt_twins") ?? false;
    if (!switched) return;
    ctx.enqueueMessage?.(VOLT_SHIFT_MESSAGE, 1.3);
  },

  final_boss_surge(ctx) {
    if (!ctx?.setBattleModifier) return;
    if (getScriptFlag(ctx, "final_surge_done")) return;
    setScriptFlag(ctx, "final_surge_done", true);
    const current = Number(ctx.battleState?.damageModifier) || 1;
    ctx.repositionBoss?.("final_phase");
    ctx.setBattleModifier("damageModifier", current + 0.1);
    ctx.enqueueMessage?.(FINAL_SURGE_MESSAGE, 1.4);
    ctx.playMusic?.("battle_final_phase", 400);
  },

  // Runs every update tick when configured as specialBehaviorId.
  adaptive_boss_cadence(ctx) {
    ensureTurnClock(ctx, ctx?.payload?.dt);

    // Keep brief stone ward windows recurring without global mechanics.
    const timer = Math.max(0, Number(ctx?.battleState?.wardTimer) || 0) - Math.max(0, Number(ctx?.payload?.dt) || 0);
    if (timer <= 0) {
      ctx.setBattleModifier?.({
        firstHitReduced: true,
        firstHitConsumed: false,
      });
      ctx.battleState.wardTimer = 6;
    } else {
      ctx.battleState.wardTimer = timer;
    }

    BOSS_BEHAVIORS.volt_twins_shift(ctx);
  },
});
