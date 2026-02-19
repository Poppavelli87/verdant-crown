const MOOD_MIN = -100;
const MOOD_MAX = 100;

const TIER_LABELS = Object.freeze({
  still: "Still",
  uneasy: "Uneasy",
  balanced: "Balanced",
  restless: "Restless",
  fractured: "Fractured",
});

const TIER_EFFECTS = Object.freeze({
  still: Object.freeze({
    veinWaveOffset: -1,
    veinWaveBreathScale: 1.12,
    anomalySpawnBias: -0.012,
    veinActivationBias: -0.01,
    fogDensityDelta: -0.0008,
    ambientIntensityDelta: 0.038,
    tintStrengthDelta: -0.012,
    saturationShift: 0.045,
    warmthShift: 0.08,
  }),
  uneasy: Object.freeze({
    veinWaveOffset: 0,
    veinWaveBreathScale: 1.03,
    anomalySpawnBias: -0.004,
    veinActivationBias: -0.003,
    fogDensityDelta: -0.0002,
    ambientIntensityDelta: 0.012,
    tintStrengthDelta: -0.004,
    saturationShift: 0.015,
    warmthShift: 0.03,
  }),
  balanced: Object.freeze({
    veinWaveOffset: 0,
    veinWaveBreathScale: 1,
    anomalySpawnBias: 0,
    veinActivationBias: 0,
    fogDensityDelta: 0,
    ambientIntensityDelta: 0,
    tintStrengthDelta: 0,
    saturationShift: 0,
    warmthShift: 0,
  }),
  restless: Object.freeze({
    veinWaveOffset: 0,
    veinWaveBreathScale: 0.93,
    anomalySpawnBias: 0.007,
    veinActivationBias: 0.006,
    fogDensityDelta: 0.0008,
    ambientIntensityDelta: -0.02,
    tintStrengthDelta: 0.01,
    saturationShift: -0.032,
    warmthShift: -0.02,
  }),
  fractured: Object.freeze({
    veinWaveOffset: 1,
    veinWaveBreathScale: 0.86,
    anomalySpawnBias: 0.015,
    veinActivationBias: 0.015,
    fogDensityDelta: 0.0017,
    ambientIntensityDelta: -0.048,
    tintStrengthDelta: 0.023,
    saturationShift: -0.08,
    warmthShift: -0.06,
  }),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveTier(score) {
  if (score >= 40) return "still";
  if (score >= 10) return "uneasy";
  if (score <= -40) return "fractured";
  if (score <= -10) return "restless";
  return "balanced";
}

export function getCrownMoodTierLabel(tier) {
  return TIER_LABELS[tier] ?? TIER_LABELS.balanced;
}

export function getCrownMoodTierEffects(tier) {
  return TIER_EFFECTS[tier] ?? TIER_EFFECTS.balanced;
}

export class CrownMoodState {
  constructor({ initialMood = 0 } = {}) {
    this.moodScore = clamp(Number(initialMood) || 0, MOOD_MIN, MOOD_MAX);
    this.lastManualOverrideTime = 0;
    this.lastChangeTime = 0;
    this.lastReason = "init";
    this.elapsedSeconds = 0;
  }

  setElapsedSeconds(seconds) {
    const next = Number(seconds);
    this.elapsedSeconds = Number.isFinite(next) ? Math.max(0, next) : this.elapsedSeconds;
  }

  adjustMood(amount, reason = "event") {
    const delta = Number(amount);
    if (!Number.isFinite(delta) || delta === 0) {
      return this.moodScore;
    }
    const next = clamp(this.moodScore + delta, MOOD_MIN, MOOD_MAX);
    if (next !== this.moodScore) {
      this.moodScore = next;
      this.lastChangeTime = this.elapsedSeconds;
      this.lastReason = String(reason || "event");
    }
    return this.moodScore;
  }

  setMood(value, reason = "manual") {
    const next = clamp(Number(value) || 0, MOOD_MIN, MOOD_MAX);
    if (next !== this.moodScore) {
      this.moodScore = next;
      this.lastChangeTime = this.elapsedSeconds;
      this.lastReason = String(reason || "manual");
    }
    this.lastManualOverrideTime = this.elapsedSeconds;
    return this.moodScore;
  }

  getMood() {
    return this.moodScore;
  }

  getTier() {
    return resolveTier(this.moodScore);
  }

  getTierLabel() {
    return getCrownMoodTierLabel(this.getTier());
  }

  getTierEffects() {
    return getCrownMoodTierEffects(this.getTier());
  }

  getDebugState() {
    return {
      moodScore: this.moodScore,
      tier: this.getTier(),
      tierLabel: this.getTierLabel(),
      lastReason: this.lastReason,
      lastChangeTime: Number(this.lastChangeTime.toFixed(3)),
      lastManualOverrideTime: Number(this.lastManualOverrideTime.toFixed(3)),
    };
  }
}

