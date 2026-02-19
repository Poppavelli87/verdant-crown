import { crownAwarenessToOmenTier, omenTierToMessage } from "./omen.js";
import { WORLD_CONSTANTS, clamp01, deriveRegionVisuals, stepWorldState } from "./worldRules.js";

const DEFAULT_REGION_DEFINITIONS = [{ id: "thornmere", name: "Thornmere" }];

function createRegions(regionDefinitions) {
  const regions = {};
  for (const region of regionDefinitions) {
    regions[region.id] = {
      id: region.id,
      name: region.name,
      stability: WORLD_CONSTANTS.INITIAL_REGION_STABILITY,
    };
  }
  return regions;
}

function normalizeRegionId(rawId) {
  return String(rawId ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function stabilityToFeel(stability) {
  if (stability >= 0.8) return "steady";
  if (stability >= 0.62) return "uneasy";
  if (stability >= 0.42) return "fraying";
  if (stability >= 0.22) return "strained";
  return "blighted";
}

export class WorldState {
  constructor(regionDefinitions = DEFAULT_REGION_DEFINITIONS) {
    this.regionDefinitions = Array.isArray(regionDefinitions) && regionDefinitions.length > 0 ? [...regionDefinitions] : [...DEFAULT_REGION_DEFINITIONS];
    this.reset();
  }

  reset() {
    const regions = createRegions(this.regionDefinitions);
    const firstRegion = this.regionDefinitions[0]?.id ?? "thornmere";

    this.elapsedSeconds = 0;
    this.baseExtractionRate = WORLD_CONSTANTS.BASE_EXTRACTION_RATE;
    // Debug pressure window controlled by the K hotkey in main.js.
    this.debugSpikeRemaining = 0;
    this.anomalyCalmRemaining = 0;
    this.pulsePressureRemaining = 0;
    this.externalExtractionDelta = 0;

    this.state = {
      extractionRate: WORLD_CONSTANTS.BASE_EXTRACTION_RATE,
      regenCapacity: WORLD_CONSTANTS.BASE_REGEN_CAPACITY,
      civStability: WORLD_CONSTANTS.BASE_CIV_STABILITY,
      crownAwareness: WORLD_CONSTANTS.INITIAL_CROWN_AWARENESS,
      activeRegionId: firstRegion,
      regions,
    };
  }

  update(dtSeconds) {
    this.elapsedSeconds += dtSeconds;
    this.anomalyCalmRemaining = Math.max(0, this.anomalyCalmRemaining - dtSeconds);
    this.pulsePressureRemaining = Math.max(0, this.pulsePressureRemaining - dtSeconds);

    if (this.debugSpikeRemaining > 0) {
      this.debugSpikeRemaining = Math.max(0, this.debugSpikeRemaining - dtSeconds);
      this.state.extractionRate = WORLD_CONSTANTS.DEBUG_SPIKE_EXTRACTION_RATE;
    } else {
      const calmOffset = this.anomalyCalmRemaining > 0 ? WORLD_CONSTANTS.ANOMALY_CALM_EXTRACTION_DELTA : 0;
      const pulseOffset = this.pulsePressureRemaining > 0 ? WORLD_CONSTANTS.PULSE_EXTRACTION_DELTA : 0;
      this.state.extractionRate = this.baseExtractionRate + calmOffset + pulseOffset + this.externalExtractionDelta;
    }

    this.state = stepWorldState(this.state, dtSeconds);
  }

  triggerDebugExtractionSpike() {
    this.debugSpikeRemaining = WORLD_CONSTANTS.DEBUG_SPIKE_DURATION_SECONDS;
  }

  triggerAnomalyCalm() {
    this.anomalyCalmRemaining = WORLD_CONSTANTS.ANOMALY_CALM_DURATION_SECONDS;
  }

  triggerPulsePressure(durationSeconds = 6) {
    this.pulsePressureRemaining = Math.max(this.pulsePressureRemaining, durationSeconds);
  }

  setExternalExtractionDelta(delta) {
    const next = Number(delta);
    if (!Number.isFinite(next)) {
      this.externalExtractionDelta = 0;
      return;
    }
    this.externalExtractionDelta = Math.max(-0.2, Math.min(0.2, next));
  }

  _ensureRegion(regionId, regionName = "Unknown Region") {
    const id = normalizeRegionId(regionId);
    if (!id) return null;
    if (!this.state.regions[id]) {
      this.state.regions[id] = {
        id,
        name: String(regionName ?? id),
        stability: WORLD_CONSTANTS.INITIAL_REGION_STABILITY,
      };
    } else if (regionName && this.state.regions[id].name !== regionName) {
      this.state.regions[id].name = String(regionName);
    }
    return this.state.regions[id];
  }

  setActiveRegion(regionId, regionName = "Unknown Region") {
    const ensured = this._ensureRegion(regionId, regionName);
    if (!ensured) return;
    this.state.activeRegionId = ensured.id;
  }

  applyStabilityBump(amount, regionId = this.state.activeRegionId, regionName = "Unknown Region") {
    const ensured = this._ensureRegion(regionId, regionName);
    if (!ensured) return 0;

    const bump = Math.max(0, Number(amount) || 0);
    const before = ensured.stability;
    ensured.stability = clamp01(ensured.stability + bump);
    return Number((ensured.stability - before).toFixed(4));
  }

  applyCrownCalm(amount) {
    const calm = Math.max(0, Number(amount) || 0);
    if (calm <= 0) return 0;
    const before = this.state.crownAwareness;
    this.state.crownAwareness = clamp01(this.state.crownAwareness - calm);
    return Number((before - this.state.crownAwareness).toFixed(4));
  }

  getActiveRegion() {
    return this.state.regions[this.state.activeRegionId];
  }

  getHudState() {
    const activeRegion = this.getActiveRegion();
    const omenTier = this.getOmenTier();

    return {
      regionName: activeRegion.name,
      // Region feel is intentionally qualitative; no numeric meter in the player HUD.
      regionFeel: stabilityToFeel(activeRegion.stability),
      omenTier,
      omenMessage: omenTierToMessage(omenTier),
    };
  }

  getVisualState() {
    const activeRegion = this.getActiveRegion();
    const omenTier = this.getOmenTier();

    return {
      ...deriveRegionVisuals({
        regionStability: activeRegion.stability,
        omenTier,
      }),
      omenTier,
      regionStability: activeRegion.stability,
    };
  }

  getPublicDebugState() {
    // This payload is for test automation and debug text only.
    const hudState = this.getHudState();

    return {
      mode: "gameplay",
      region: hudState.regionName,
      region_feel: hudState.regionFeel,
      omen_tier: hudState.omenTier,
      omen_message: hudState.omenMessage,
      extraction_rate: Number(this.state.extractionRate.toFixed(3)),
      regen_capacity: Number(this.state.regenCapacity.toFixed(3)),
      civ_stability: Number(this.state.civStability.toFixed(3)),
      region_stability: Number(this.getActiveRegion().stability.toFixed(3)),
      anomaly_calm_active: this.anomalyCalmRemaining > 0,
      pulse_pressure_active: this.pulsePressureRemaining > 0,
      extraction_external_delta: Number(this.externalExtractionDelta.toFixed(4)),
    };
  }

  getOmenTier() {
    return crownAwarenessToOmenTier(this.state.crownAwareness);
  }
}
