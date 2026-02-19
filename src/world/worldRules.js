export const WORLD_CONSTANTS = Object.freeze({
  // Baseline world pressures in Thornmere (tunable for later regions/acts).
  BASE_EXTRACTION_RATE: 0.42,
  BASE_REGEN_CAPACITY: 0.5,
  BASE_CIV_STABILITY: 0.72,
  INITIAL_CROWN_AWARENESS: 0.12,
  INITIAL_REGION_STABILITY: 0.85,
  DEBUG_SPIKE_EXTRACTION_RATE: 0.95,
  DEBUG_SPIKE_DURATION_SECONDS: 3,
  PULSE_EXTRACTION_DELTA: 0.055,
  ANOMALY_CALM_EXTRACTION_DELTA: -0.06,
  ANOMALY_CALM_DURATION_SECONDS: 8,
  CROWN_GROWTH_FROM_IMBALANCE: 0.45,
  CROWN_GROWTH_FROM_CIV: 0.18,
  CROWN_DECAY_BASE: 0.035,
  REGION_DECAY_FROM_CROWN: 0.12,
  REGION_DECAY_FROM_IMBALANCE: 0.16,
  REGION_RECOVERY_BASE: 0.06,
  BASE_FOG_DENSITY: 0.006,
  MAX_FOG_DENSITY: 0.04,
  BASE_AMBIENT_INTENSITY: 0.75,
  MIN_AMBIENT_INTENSITY: 0.56,
  BASE_HAZE_OPACITY: 0.03,
  MAX_HAZE_OPACITY: 0.34,
  BASE_FOLIAGE_MOTION: 0.25,
  MAX_FOLIAGE_MOTION: 1.0,
  SKY_SHIFT_MAX: 0.85,
});

export function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function lerp(min, max, t) {
  return min + (max - min) * t;
}

export function computeCrownAwarenessDelta({ extractionRate, regenCapacity, civStability }) {
  const imbalance = Math.max(0, extractionRate - regenCapacity);
  if (imbalance > 0) {
    // Growth pressure rises when extraction outpaces regeneration, amplified by stable civilization.
    return imbalance * (WORLD_CONSTANTS.CROWN_GROWTH_FROM_IMBALANCE + civStability * WORLD_CONSTANTS.CROWN_GROWTH_FROM_CIV);
  }
  // If extraction is sustainable, awareness decays slowly over time.
  const restorationHeadroom = Math.max(0, regenCapacity - extractionRate);
  return -(WORLD_CONSTANTS.CROWN_DECAY_BASE + restorationHeadroom * 0.03);
}

export function computeRegionStabilityDelta({ extractionRate, regenCapacity, crownAwareness }) {
  const imbalance = Math.max(0, extractionRate - regenCapacity);
  const pressure =
    crownAwareness * WORLD_CONSTANTS.REGION_DECAY_FROM_CROWN +
    imbalance * WORLD_CONSTANTS.REGION_DECAY_FROM_IMBALANCE;
  const restorationHeadroom = Math.max(0, regenCapacity - extractionRate);
  const recovery = restorationHeadroom * (1 - crownAwareness) * WORLD_CONSTANTS.REGION_RECOVERY_BASE;
  return recovery - pressure;
}

export function stepWorldState(previousState, dt) {
  const nextState = {
    ...previousState,
    extractionRate: clamp01(previousState.extractionRate),
    regenCapacity: clamp01(previousState.regenCapacity),
    civStability: clamp01(previousState.civStability),
    regions: {},
  };

  const crownDelta = computeCrownAwarenessDelta(nextState);
  nextState.crownAwareness = clamp01(previousState.crownAwareness + crownDelta * dt);

  // Each region updates independently so the model can scale from 1 to 8 regions later.
  for (const [id, region] of Object.entries(previousState.regions)) {
    const stabilityDelta = computeRegionStabilityDelta({
      extractionRate: nextState.extractionRate,
      regenCapacity: nextState.regenCapacity,
      crownAwareness: nextState.crownAwareness,
    });

    nextState.regions[id] = {
      ...region,
      stability: clamp01(region.stability + stabilityDelta * dt),
    };
  }

  return nextState;
}

export function deriveRegionVisuals({ regionStability, omenTier }) {
  // Visual cues are driven by qualitative world pressure, not raw Crown Awareness UI.
  const degradation = clamp01(1 - regionStability);
  const omenBoost = clamp01(omenTier / 4);

  return {
    degradation,
    fogDensity: lerp(WORLD_CONSTANTS.BASE_FOG_DENSITY, WORLD_CONSTANTS.MAX_FOG_DENSITY, degradation),
    ambientIntensity: lerp(WORLD_CONSTANTS.BASE_AMBIENT_INTENSITY, WORLD_CONSTANTS.MIN_AMBIENT_INTENSITY, degradation),
    hazeOpacity: clamp01(
      lerp(WORLD_CONSTANTS.BASE_HAZE_OPACITY, WORLD_CONSTANTS.MAX_HAZE_OPACITY, degradation) + omenBoost * 0.06
    ),
    foliageMotionIntensity: clamp01(
      lerp(WORLD_CONSTANTS.BASE_FOLIAGE_MOTION, WORLD_CONSTANTS.MAX_FOLIAGE_MOTION, degradation * 0.85 + omenBoost * 0.35)
    ),
    skyShift: clamp01(degradation * WORLD_CONSTANTS.SKY_SHIFT_MAX + omenBoost * 0.12),
  };
}
