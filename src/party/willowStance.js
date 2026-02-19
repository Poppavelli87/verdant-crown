const STANCE_SEQUENCE = Object.freeze(["ruby", "emerald", "sapphire"]);
const DEFAULT_STANCE = "ruby";

function normalizeStance(stance) {
  const value = String(stance ?? "").toLowerCase();
  return STANCE_SEQUENCE.includes(value) ? value : DEFAULT_STANCE;
}

function normalizeSource(source) {
  const value = String(source ?? "").toLowerCase();
  return value === "auto" ? "auto" : "manual";
}

function toSafeMs(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, next);
}

export class WillowStanceState {
  constructor({
    initialStance = DEFAULT_STANCE,
    autoStanceEnabled = true,
    stanceCooldownMs = 60000,
    manualLockMs = 300000,
  } = {}) {
    this.activeStance = normalizeStance(initialStance);
    this.autoStanceEnabled = Boolean(autoStanceEnabled);
    this.stanceCooldownMs = Math.max(0, Number(stanceCooldownMs) || 60000);
    this.manualLockMs = Math.max(0, Number(manualLockMs) || 300000);
    this.lastManualStanceTime = -Number.POSITIVE_INFINITY;
    this.lastSwitchTime = -Number.POSITIVE_INFINITY;
  }

  getWillowStance() {
    return this.activeStance;
  }

  getAutoStanceEnabled() {
    return this.autoStanceEnabled;
  }

  setAutoStanceEnabled(enabled) {
    this.autoStanceEnabled = Boolean(enabled);
    return this.autoStanceEnabled;
  }

  canSwitchStance({ combatActive = false, bossInstanceActive = false } = {}) {
    return !combatActive && !bossInstanceActive;
  }

  setWillowStance(
    stance,
    source = "manual",
    { nowMs = 0, combatActive = false, bossInstanceActive = false, force = false } = {}
  ) {
    const resolvedStance = normalizeStance(stance);
    const resolvedSource = normalizeSource(source);
    const timeMs = toSafeMs(nowMs);
    const canSwitchNow = this.canSwitchStance({ combatActive, bossInstanceActive });

    if (resolvedStance === this.activeStance) {
      return { changed: false, stance: this.activeStance, reason: "same" };
    }

    if (!force && !canSwitchNow) {
      return { changed: false, stance: this.activeStance, reason: "locked_combat" };
    }

    if (resolvedSource === "auto") {
      if (!this.autoStanceEnabled && !force) {
        return { changed: false, stance: this.activeStance, reason: "auto_disabled" };
      }
      const sinceManual = timeMs - this.lastManualStanceTime;
      if (!force && sinceManual < this.manualLockMs) {
        return { changed: false, stance: this.activeStance, reason: "manual_lock" };
      }
      const sinceSwitch = timeMs - this.lastSwitchTime;
      if (!force && sinceSwitch < this.stanceCooldownMs) {
        return { changed: false, stance: this.activeStance, reason: "stance_cooldown" };
      }
    }

    this.activeStance = resolvedStance;
    this.lastSwitchTime = timeMs;
    if (resolvedSource === "manual") {
      this.lastManualStanceTime = timeMs;
    }
    return { changed: true, stance: this.activeStance, source: resolvedSource };
  }

  cycleManualStance({ nowMs = 0, combatActive = false, bossInstanceActive = false } = {}) {
    const currentIndex = STANCE_SEQUENCE.indexOf(this.activeStance);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % STANCE_SEQUENCE.length;
    const nextStance = STANCE_SEQUENCE[nextIndex];
    return this.setWillowStance(nextStance, "manual", {
      nowMs,
      combatActive,
      bossInstanceActive,
    });
  }

  getDebugState(nowMs = 0) {
    const now = toSafeMs(nowMs);
    const manualLockRemaining = Math.max(0, this.manualLockMs - (now - this.lastManualStanceTime));
    const cooldownRemaining = Math.max(0, this.stanceCooldownMs - (now - this.lastSwitchTime));
    return {
      activeStance: this.activeStance,
      autoStanceEnabled: this.autoStanceEnabled,
      manualLockRemainingMs: Math.round(manualLockRemaining),
      cooldownRemainingMs: Math.round(cooldownRemaining),
      lastManualStanceTime: Number.isFinite(this.lastManualStanceTime)
        ? Math.round(this.lastManualStanceTime)
        : -1,
      lastSwitchTime: Number.isFinite(this.lastSwitchTime) ? Math.round(this.lastSwitchTime) : -1,
    };
  }
}

export function formatWillowStanceLabel(stance) {
  const resolved = normalizeStance(stance);
  if (resolved === "emerald") return "Emerald";
  if (resolved === "sapphire") return "Sapphire";
  return "Ruby";
}

export function getWillowStanceSequence() {
  return [...STANCE_SEQUENCE];
}
