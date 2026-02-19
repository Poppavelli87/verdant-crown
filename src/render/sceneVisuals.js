const SAFE_VISUAL_CLAMPS = Object.freeze({
  minAmbientIntensity: 0.5,
  maxAmbientIntensity: 1.25,
  minFogDensity: 0.0035,
  maxFogDensity: 0.0175,
  minTintStrength: 0,
  maxTintStrength: 0.72,
  minOverlayOpacity: 0,
  maxOverlayOpacity: 0.34,
  minPulseOverlayOpacity: 0,
  maxPulseOverlayOpacity: 0.18,
  minFoliageSwayMultiplier: 0.6,
  maxFoliageSwayMultiplier: 1.85,
  minSaturationShift: -0.26,
  maxSaturationShift: 0.16,
  minWarmthShift: -0.12,
  maxWarmthShift: 0.14,
});

const BASELINE_VISUALS = Object.freeze({
  start: Object.freeze({
    ambientIntensity: 0.52,
    ambientColor: "#7f8a82",
    directionalIntensity: 0.62,
    directionalColor: "#c0cbbf",
    fogDensity: 0.0134,
    fogColor: "#2f3438",
    regionTintColor: "#4b6a52",
    regionTintStrength: 0.22,
    overlayBaseOpacity: 0.065,
  }),
  prologue: Object.freeze({
    ambientIntensity: 0.58,
    ambientColor: "#8d98a2",
    directionalIntensity: 0.68,
    directionalColor: "#c4cec8",
    fogDensity: 0.0128,
    fogColor: "#4a545d",
    regionTintColor: "#4f6458",
    regionTintStrength: 0.26,
    overlayBaseOpacity: 0.07,
  }),
  thornmere: Object.freeze({
    ambientIntensity: 0.84,
    ambientColor: "#a9bead",
    directionalIntensity: 1.02,
    directionalColor: "#f4d9b2",
    fogDensity: 0.0059,
    fogColor: "#8a9f8b",
    regionTintColor: "#86ab74",
    regionTintStrength: 0.12,
    overlayBaseOpacity: 0.04,
  }),
  hollowscar: Object.freeze({
    ambientIntensity: 0.64,
    ambientColor: "#8d98ab",
    directionalIntensity: 0.82,
    directionalColor: "#d2d9e5",
    fogDensity: 0.0108,
    fogColor: "#6f7a88",
    regionTintColor: "#6b7481",
    regionTintStrength: 0.22,
    overlayBaseOpacity: 0.085,
  }),
  emberfall: Object.freeze({
    ambientIntensity: 0.74,
    ambientColor: "#b7a084",
    directionalIntensity: 1.06,
    directionalColor: "#ffd2a0",
    fogDensity: 0.0087,
    fogColor: "#8f715f",
    regionTintColor: "#b66a45",
    regionTintStrength: 0.2,
    overlayBaseOpacity: 0.058,
  }),
  region3_seed: Object.freeze({
    ambientIntensity: 0.79,
    ambientColor: "#adc1ba",
    directionalIntensity: 1.01,
    directionalColor: "#f0dfbd",
    fogDensity: 0.0063,
    fogColor: "#8ca4aa",
    regionTintColor: "#8ba68f",
    regionTintStrength: 0.14,
    overlayBaseOpacity: 0.046,
  }),
  windward: Object.freeze({
    ambientIntensity: 0.82,
    ambientColor: "#b8cbd2",
    directionalIntensity: 1.08,
    directionalColor: "#d8e4ef",
    fogDensity: 0.0058,
    fogColor: "#93acb8",
    regionTintColor: "#8ea59a",
    regionTintStrength: 0.16,
    overlayBaseOpacity: 0.042,
  }),
  region4_seed: Object.freeze({
    ambientIntensity: 0.76,
    ambientColor: "#a7a88f",
    directionalIntensity: 0.9,
    directionalColor: "#d7c6a3",
    fogDensity: 0.0071,
    fogColor: "#7c7a68",
    regionTintColor: "#627056",
    regionTintStrength: 0.2,
    overlayBaseOpacity: 0.06,
  }),
});

const FALLBACK_SCENE_ID = "thornmere";

const TMP_SKY_COLOR = { r: 0, g: 0, b: 0 };
const TMP_AMBIENT_COLOR = { r: 0, g: 0, b: 0 };
const TMP_DIRECTIONAL_COLOR = { r: 0, g: 0, b: 0 };
const TMP_GROUND_COLOR = { r: 0, g: 0, b: 0 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function normalizeSceneId(sceneId) {
  if (sceneId === "start" || sceneId === "title") return "start";
  if (sceneId === "prologue") return "prologue";
  if (sceneId === "hollowScar") return "hollowscar";
  if (sceneId === "emberfall") return "emberfall";
  if (sceneId === "windward") return "windward";
  if (sceneId === "region3_seed") return "region3_seed";
  if (sceneId === "region4_seed") return "region4_seed";
  if (sceneId === "thornmere") return "thornmere";
  return FALLBACK_SCENE_ID;
}

function parseHexColor(hex) {
  const safeHex = String(hex ?? "#000000").replace("#", "").padStart(6, "0").slice(0, 6);
  return {
    r: Number.parseInt(safeHex.slice(0, 2), 16) / 255,
    g: Number.parseInt(safeHex.slice(2, 4), 16) / 255,
    b: Number.parseInt(safeHex.slice(4, 6), 16) / 255,
  };
}

function mixColor(target, a, b, t) {
  target.r = lerp(a.r, b.r, t);
  target.g = lerp(a.g, b.g, t);
  target.b = lerp(a.b, b.b, t);
  return target;
}

function applySaturation(target, saturationShift = 0) {
  const clampedShift = clamp(
    Number(saturationShift) || 0,
    SAFE_VISUAL_CLAMPS.minSaturationShift,
    SAFE_VISUAL_CLAMPS.maxSaturationShift
  );
  if (Math.abs(clampedShift) <= 1e-6) return target;
  const gray = (target.r + target.g + target.b) / 3;
  const factor = 1 + clampedShift;
  target.r = clamp01(gray + (target.r - gray) * factor);
  target.g = clamp01(gray + (target.g - gray) * factor);
  target.b = clamp01(gray + (target.b - gray) * factor);
  return target;
}

function applyWarmth(target, warmthShift = 0) {
  const clampedShift = clamp(
    Number(warmthShift) || 0,
    SAFE_VISUAL_CLAMPS.minWarmthShift,
    SAFE_VISUAL_CLAMPS.maxWarmthShift
  );
  if (Math.abs(clampedShift) <= 1e-6) return target;
  target.r = clamp01(target.r + clampedShift * 0.22);
  target.g = clamp01(target.g + clampedShift * 0.05);
  target.b = clamp01(target.b - clampedShift * 0.2);
  return target;
}

function cloneBaseline(config) {
  return {
    ambientIntensity: config.ambientIntensity,
    ambientColor: config.ambientColor,
    directionalIntensity: config.directionalIntensity,
    directionalColor: config.directionalColor,
    fogDensity: config.fogDensity,
    fogColor: config.fogColor,
    regionTintColor: config.regionTintColor,
    regionTintStrength: config.regionTintStrength,
    overlayBaseOpacity: config.overlayBaseOpacity,
  };
}

export function getBaselineVisuals(sceneId) {
  const key = normalizeSceneId(sceneId);
  const baseline = BASELINE_VISUALS[key] ?? BASELINE_VISUALS[FALLBACK_SCENE_ID];
  return cloneBaseline(baseline);
}

// Dynamic values are represented as frame-local modifiers and never mutate baselines.
export function getDynamicVisualModifiers(worldVisualState, events, sceneId) {
  const normalizedSceneId = normalizeSceneId(sceneId);
  if (normalizedSceneId === "start" || normalizedSceneId === "prologue") {
    return {
      ambientIntensityDelta: 0,
      fogDensityDelta: 0,
      overlayPulseOpacityDelta: 0,
      tintStrengthDelta: 0,
      foliageSwayMultiplier: normalizedSceneId === "prologue" ? 0.82 : 0.7,
      pulseOverlayOpacity: 0,
      saturationShift: 0,
      warmthShift: 0,
    };
  }

  const degradation = clamp01(worldVisualState?.degradation ?? 0);
  const omenTier = clamp01((worldVisualState?.omenTier ?? 0) / 4);
  const hazeOpacity = clamp01(worldVisualState?.hazeOpacity ?? 0);
  const foliageMotion = clamp01(worldVisualState?.foliageMotionIntensity ?? 0);
  const pulseActive = Boolean(events?.pulseActive ?? events?.pulse?.active);
  const pulseScalar = clamp01(events?.pulse?.pulseScalar ?? 0);
  const pulseFogDelta = Number(events?.pulse?.fogDensityDelta ?? 0);
  const pulseAmbientDelta = Number(events?.pulse?.ambientIntensityDelta ?? 0);
  const pulseTintDelta = Number(events?.pulse?.tintStrengthDelta ?? 0);
  const pulseSwayMultiplier = Number(events?.pulse?.foliageSwayMultiplier ?? 1);
  const pulseOverlayDelta = Number(events?.pulse?.overlayPulseOpacityDelta ?? 0);
  const veinLocalFogReliefDelta = Number(events?.veinLocalFogReliefDelta ?? 0);
  const crownMood = events?.crownMood ?? {};
  const moodFogDensityDelta = Number(crownMood.fogDensityDelta ?? 0);
  const moodAmbientIntensityDelta = Number(crownMood.ambientIntensityDelta ?? 0);
  const moodTintStrengthDelta = Number(crownMood.tintStrengthDelta ?? 0);
  const moodSaturationShift = Number(crownMood.saturationShift ?? 0);
  const moodWarmthShift = Number(crownMood.warmthShift ?? 0);

  const worldPressure = clamp01(degradation * 0.74 + omenTier * 0.5);
  let ambientIntensityDelta = -(worldPressure * 0.11);
  let fogDensityDelta = worldPressure * 0.0044;
  let overlayPulseOpacityDelta = Math.max(0, (hazeOpacity - 0.03) * 0.92) + worldPressure * 0.02;
  let tintStrengthDelta = worldPressure * 0.14;
  let foliageSwayMultiplier = 1 + worldPressure * 0.42 + foliageMotion * 0.18;
  let pulseOverlayOpacity = 0;

  if (pulseActive) {
    ambientIntensityDelta += pulseAmbientDelta;
    fogDensityDelta += pulseFogDelta;
    overlayPulseOpacityDelta += pulseOverlayDelta;
    tintStrengthDelta += pulseTintDelta;
    foliageSwayMultiplier *= pulseSwayMultiplier;
    ambientIntensityDelta -= 0.012 + pulseScalar * 0.01;
    fogDensityDelta += pulseScalar * 0.0008;
    overlayPulseOpacityDelta += pulseScalar * 0.008;
    tintStrengthDelta += pulseScalar * 0.012;
    pulseOverlayOpacity = 0.044 + pulseScalar * 0.058;
  }

  ambientIntensityDelta += moodAmbientIntensityDelta;
  fogDensityDelta += moodFogDensityDelta;
  tintStrengthDelta += moodTintStrengthDelta;
  fogDensityDelta += veinLocalFogReliefDelta;

  return {
    ambientIntensityDelta: clamp(ambientIntensityDelta, -0.32, 0.08),
    fogDensityDelta: clamp(fogDensityDelta, -0.004, 0.015),
    overlayPulseOpacityDelta: clamp(overlayPulseOpacityDelta, 0, 0.24),
    tintStrengthDelta: clamp(tintStrengthDelta, 0, 0.36),
    foliageSwayMultiplier: clamp(
      foliageSwayMultiplier,
      SAFE_VISUAL_CLAMPS.minFoliageSwayMultiplier,
      SAFE_VISUAL_CLAMPS.maxFoliageSwayMultiplier
    ),
    pulseOverlayOpacity: clamp(
      pulseOverlayOpacity,
      SAFE_VISUAL_CLAMPS.minPulseOverlayOpacity,
      SAFE_VISUAL_CLAMPS.maxPulseOverlayOpacity
    ),
    saturationShift: clamp(
      moodSaturationShift,
      SAFE_VISUAL_CLAMPS.minSaturationShift,
      SAFE_VISUAL_CLAMPS.maxSaturationShift
    ),
    warmthShift: clamp(
      moodWarmthShift,
      SAFE_VISUAL_CLAMPS.minWarmthShift,
      SAFE_VISUAL_CLAMPS.maxWarmthShift
    ),
  };
}

export function composeVisualConfig(baseline, modifiers) {
  return {
    ambientIntensity: clamp(
      baseline.ambientIntensity + (modifiers.ambientIntensityDelta ?? 0),
      SAFE_VISUAL_CLAMPS.minAmbientIntensity,
      SAFE_VISUAL_CLAMPS.maxAmbientIntensity
    ),
    ambientColor: baseline.ambientColor,
    directionalIntensity: clamp(
      baseline.directionalIntensity + (modifiers.ambientIntensityDelta ?? 0) * 0.22,
      0.45,
      1.35
    ),
    directionalColor: baseline.directionalColor,
    fogDensity: clamp(
      baseline.fogDensity + (modifiers.fogDensityDelta ?? 0),
      SAFE_VISUAL_CLAMPS.minFogDensity,
      SAFE_VISUAL_CLAMPS.maxFogDensity
    ),
    fogColor: baseline.fogColor,
    regionTintColor: baseline.regionTintColor,
    regionTintStrength: clamp(
      baseline.regionTintStrength + (modifiers.tintStrengthDelta ?? 0),
      SAFE_VISUAL_CLAMPS.minTintStrength,
      SAFE_VISUAL_CLAMPS.maxTintStrength
    ),
    overlayBaseOpacity: baseline.overlayBaseOpacity,
    overlayOpacity: clamp(
      baseline.overlayBaseOpacity + (modifiers.overlayPulseOpacityDelta ?? 0),
      SAFE_VISUAL_CLAMPS.minOverlayOpacity,
      SAFE_VISUAL_CLAMPS.maxOverlayOpacity
    ),
    foliageSwayMultiplier: clamp(
      modifiers.foliageSwayMultiplier ?? 1,
      SAFE_VISUAL_CLAMPS.minFoliageSwayMultiplier,
      SAFE_VISUAL_CLAMPS.maxFoliageSwayMultiplier
    ),
    pulseOverlayOpacity: clamp(
      modifiers.pulseOverlayOpacity ?? 0,
      SAFE_VISUAL_CLAMPS.minPulseOverlayOpacity,
      SAFE_VISUAL_CLAMPS.maxPulseOverlayOpacity
    ),
    saturationShift: clamp(
      modifiers.saturationShift ?? 0,
      SAFE_VISUAL_CLAMPS.minSaturationShift,
      SAFE_VISUAL_CLAMPS.maxSaturationShift
    ),
    warmthShift: clamp(
      modifiers.warmthShift ?? 0,
      SAFE_VISUAL_CLAMPS.minWarmthShift,
      SAFE_VISUAL_CLAMPS.maxWarmthShift
    ),
  };
}

export function applyVisuals(
  rendererContext,
  config,
  {
    tintToSkyFactor = 0.42,
    tintToLightFactor = 0.18,
    tintToDirectionalFactor = 0.14,
    tintToGroundFactor = 0.56,
  } = {}
) {
  const { scene, ambientLight, directionalLight, groundMaterial, groundBaseColor = "#6a9354" } = rendererContext;
  const fogColor = parseHexColor(config.fogColor);
  const tintColor = parseHexColor(config.regionTintColor);
  const ambientColor = parseHexColor(config.ambientColor);
  const directionalColor = parseHexColor(config.directionalColor);
  const groundColor = parseHexColor(groundBaseColor);

  mixColor(TMP_SKY_COLOR, fogColor, tintColor, clamp01(config.regionTintStrength * tintToSkyFactor));
  applySaturation(TMP_SKY_COLOR, config.saturationShift);
  applyWarmth(TMP_SKY_COLOR, config.warmthShift * 0.7);
  scene.background.setRGB(TMP_SKY_COLOR.r, TMP_SKY_COLOR.g, TMP_SKY_COLOR.b);
  scene.fog.color.setRGB(TMP_SKY_COLOR.r, TMP_SKY_COLOR.g, TMP_SKY_COLOR.b);
  scene.fog.density = config.fogDensity;

  mixColor(TMP_AMBIENT_COLOR, ambientColor, tintColor, clamp01(config.regionTintStrength * tintToLightFactor));
  applySaturation(TMP_AMBIENT_COLOR, config.saturationShift * 0.8);
  applyWarmth(TMP_AMBIENT_COLOR, config.warmthShift);
  ambientLight.color.setRGB(TMP_AMBIENT_COLOR.r, TMP_AMBIENT_COLOR.g, TMP_AMBIENT_COLOR.b);
  ambientLight.intensity = config.ambientIntensity;

  mixColor(
    TMP_DIRECTIONAL_COLOR,
    directionalColor,
    tintColor,
    clamp01(config.regionTintStrength * tintToDirectionalFactor)
  );
  applySaturation(TMP_DIRECTIONAL_COLOR, config.saturationShift * 0.6);
  applyWarmth(TMP_DIRECTIONAL_COLOR, config.warmthShift * 0.9);
  directionalLight.color.setRGB(TMP_DIRECTIONAL_COLOR.r, TMP_DIRECTIONAL_COLOR.g, TMP_DIRECTIONAL_COLOR.b);
  directionalLight.intensity = config.directionalIntensity;

  mixColor(TMP_GROUND_COLOR, groundColor, tintColor, clamp01(config.regionTintStrength * tintToGroundFactor));
  applySaturation(TMP_GROUND_COLOR, config.saturationShift * 0.95);
  applyWarmth(TMP_GROUND_COLOR, config.warmthShift * 0.8);
  groundMaterial.color.setRGB(TMP_GROUND_COLOR.r, TMP_GROUND_COLOR.g, TMP_GROUND_COLOR.b);
}

export function getVisualClampConfig() {
  return { ...SAFE_VISUAL_CLAMPS };
}
