import { OBJECTIVE_IDS } from "./objectives.js";

const DEFAULT_RIFT_CONFIG = Object.freeze({
  fillPerSecond: 0.07,
  anchorBoost: 0.28,
  shockwaveReset: 0.4,
});

function clamp01(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 0) return 0;
  if (numeric >= 1) return 1;
  return numeric;
}

function normalizeObjective(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function tryStartRiftCrossing(context = {}) {
  const sceneId = String(context.sceneId ?? "")
    .trim()
    .toLowerCase();
  const objectiveId = normalizeObjective(context.objectiveId);
  const alreadyCrossed = Boolean(context.endgameSetpieceRiftCrossed);
  const alreadyActive = Boolean(context.riftActive);
  if (sceneId !== "last_spire") return { triggered: false };
  if (alreadyCrossed || alreadyActive) return { triggered: false };
  if (objectiveId !== OBJECTIVE_IDS.CROSS_RIFT) return { triggered: false };
  return {
    triggered: true,
    objectiveId: OBJECTIVE_IDS.CROSS_RIFT,
    meterValue: 0.7,
    lockSeconds: 0.35,
    message: "Reality tears open. Stabilize three anchors.",
  };
}

export function updateRiftCrossing(dtSeconds, state = {}, config = DEFAULT_RIFT_CONFIG) {
  const dt = Math.max(0, Number(dtSeconds) || 0);
  const next = {
    ...state,
    active: Boolean(state.active),
    meter: clamp01(state.meter ?? 0.7),
    shocks: Math.max(0, Math.floor(Number(state.shocks) || 0)),
    anchorsDone: Math.max(0, Math.floor(Number(state.anchorsDone) || 0)),
    anchorEvent: false,
    shockEvent: false,
    completed: false,
  };
  if (!next.active) return next;

  const fillPerSecond = Math.max(0.001, Number(config.fillPerSecond) || DEFAULT_RIFT_CONFIG.fillPerSecond);
  next.meter = clamp01(next.meter - fillPerSecond * dt);
  if (next.meter <= 0) {
    next.shocks += 1;
    next.shockEvent = true;
    next.meter = clamp01(config.shockwaveReset ?? DEFAULT_RIFT_CONFIG.shockwaveReset);
  }
  if (next.anchorsDone >= 3) {
    next.completed = true;
    next.active = false;
    next.meter = clamp01(Math.max(0.65, next.meter));
  }
  return next;
}

export function applyRiftAnchorStabilized(state = {}, config = DEFAULT_RIFT_CONFIG) {
  const next = {
    ...state,
    active: Boolean(state.active),
    meter: clamp01(state.meter ?? 0.7),
    anchorsDone: Math.max(0, Math.floor(Number(state.anchorsDone) || 0)),
    anchorEvent: true,
  };
  if (!next.active) return next;
  next.anchorsDone += 1;
  next.meter = clamp01(next.meter + Math.max(0, Number(config.anchorBoost) || DEFAULT_RIFT_CONFIG.anchorBoost));
  if (next.anchorsDone >= 3) {
    next.active = false;
    next.completed = true;
    next.meter = clamp01(Math.max(0.65, next.meter));
  }
  return next;
}

export function isRiftCrossingActive(state = {}) {
  return Boolean(state?.active);
}
