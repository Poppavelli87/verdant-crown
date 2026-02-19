function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function toPositiveNumber(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return numeric;
}

function normalizeThresholds(values = []) {
  const normalized = Array.isArray(values)
    ? values
        .map((entry) => clamp01(entry))
        .filter((entry) => entry > 0 && entry < 1)
        .sort((a, b) => a - b)
    : [];
  return normalized.length > 0 ? normalized : [0.33, 0.66];
}

export function createMemoryPressureTracker({
  fillPerSecond = 0.064,
  reliefAmount = 0.25,
  slowSecondsOnRelief = 4,
  slowedFillMultiplier = 0.62,
  thresholds = [0.33, 0.66],
} = {}) {
  const state = {
    active: false,
    value: 0,
    fillPerSecond: toPositiveNumber(fillPerSecond, 0.064),
    reliefAmount: clamp01(reliefAmount),
    slowSecondsOnRelief: toPositiveNumber(slowSecondsOnRelief, 4),
    slowedFillMultiplier: clamp01(slowedFillMultiplier),
    slowRemaining: 0,
    thresholds: normalizeThresholds(thresholds),
    triggeredThresholds: new Set(),
  };

  function reset({ value = 0 } = {}) {
    state.value = clamp01(value);
    state.slowRemaining = 0;
    state.triggeredThresholds.clear();
  }

  function setActive(active, { resetValue = false } = {}) {
    const next = Boolean(active);
    if (state.active === next) {
      return state.active;
    }
    state.active = next;
    if (!next || resetValue) {
      reset({ value: 0 });
    }
    return state.active;
  }

  function setValue(value) {
    state.value = clamp01(value);
    return state.value;
  }

  function relieve(amount = state.reliefAmount, { slowSeconds = state.slowSecondsOnRelief } = {}) {
    const drop = clamp01(amount);
    if (drop > 0) {
      state.value = clamp01(state.value - drop);
    }
    state.slowRemaining = Math.max(state.slowRemaining, toPositiveNumber(slowSeconds, state.slowSecondsOnRelief));
    return state.value;
  }

  function update(dtSeconds, { enabled = true } = {}) {
    const dt = Math.max(0, Number(dtSeconds) || 0);
    const thresholdEvents = [];

    if (!state.active || !enabled || dt <= 0) {
      return {
        active: state.active,
        value: state.value,
        thresholdEvents,
      };
    }

    if (state.slowRemaining > 0) {
      state.slowRemaining = Math.max(0, state.slowRemaining - dt);
    }

    let fillRate = state.fillPerSecond;
    if (state.slowRemaining > 0) {
      fillRate *= Math.max(0.1, state.slowedFillMultiplier);
    }
    state.value = clamp01(state.value + fillRate * dt);

    for (const threshold of state.thresholds) {
      if (state.value >= threshold && !state.triggeredThresholds.has(threshold)) {
        state.triggeredThresholds.add(threshold);
        thresholdEvents.push(threshold);
      }
    }

    return {
      active: state.active,
      value: state.value,
      thresholdEvents,
    };
  }

  function getState() {
    return {
      active: state.active,
      value: state.value,
      fillPerSecond: state.fillPerSecond,
      slowRemaining: state.slowRemaining,
      thresholds: [...state.thresholds],
      triggeredThresholds: [...state.triggeredThresholds],
    };
  }

  return {
    reset,
    setActive,
    setValue,
    relieve,
    update,
    getState,
  };
}
