const DEFAULT_EVENT_DEFINITIONS = Object.freeze({
  hollowscar_pulse: {
    phases: [
      { id: "surge", duration: 2.4 },
      { id: "echo", duration: 3.6 },
    ],
  },
});

function normalizeDefinition(definition) {
  const phases = Array.isArray(definition?.phases) ? definition.phases : [];
  const normalizedPhases = phases.map((phase, index) => ({
    id: String(phase.id ?? `phase-${index}`),
    duration: Math.max(0.01, Number(phase.duration ?? 0.01)),
  }));
  const totalDuration = normalizedPhases.reduce((sum, phase) => sum + phase.duration, 0);
  return {
    phases: normalizedPhases,
    totalDuration: Math.max(0.01, totalDuration),
  };
}

function resolvePhaseState(definition, elapsedSeconds) {
  let phaseIndex = definition.phases.length - 1;
  let phaseStart = 0;
  let phaseDuration = definition.phases[phaseIndex].duration;

  let accumulator = 0;
  for (let i = 0; i < definition.phases.length; i += 1) {
    const phase = definition.phases[i];
    const nextAccumulator = accumulator + phase.duration;
    if (elapsedSeconds <= nextAccumulator || i === definition.phases.length - 1) {
      phaseIndex = i;
      phaseStart = accumulator;
      phaseDuration = phase.duration;
      break;
    }
    accumulator = nextAccumulator;
  }

  const phaseElapsed = Math.max(0, elapsedSeconds - phaseStart);
  const phaseProgress = Math.max(0, Math.min(1, phaseElapsed / phaseDuration));
  const phaseId = definition.phases[phaseIndex].id;
  return { phaseIndex, phaseId, phaseProgress, phaseElapsed, phaseDuration };
}

// WorldEventRunner handles deterministic, time-phased story events.
export class WorldEventRunner {
  constructor(definitions = DEFAULT_EVENT_DEFINITIONS) {
    this.definitions = {};
    for (const [id, definition] of Object.entries(definitions)) {
      this.definitions[id] = normalizeDefinition(definition);
    }

    this.activeEvents = new Map();
  }

  startEvent(id) {
    if (!this.definitions[id]) return false;
    if (this.activeEvents.has(id)) return false;

    const definition = this.definitions[id];
    this.activeEvents.set(id, {
      id,
      elapsedSeconds: 0,
      totalDuration: definition.totalDuration,
      phaseIndex: 0,
      startedThisFrame: true,
      completedThisFrame: false,
    });
    return true;
  }

  isEventActive(id) {
    return this.activeEvents.has(id);
  }

  getEventState(id) {
    const entry = this.activeEvents.get(id);
    if (!entry) return null;
    const definition = this.definitions[id];
    const phaseState = resolvePhaseState(definition, entry.elapsedSeconds);
    return {
      id: entry.id,
      elapsedSeconds: entry.elapsedSeconds,
      totalDuration: entry.totalDuration,
      progress: Math.max(0, Math.min(1, entry.elapsedSeconds / entry.totalDuration)),
      phaseIndex: phaseState.phaseIndex,
      phaseId: phaseState.phaseId,
      phaseProgress: phaseState.phaseProgress,
      startedThisFrame: entry.startedThisFrame,
      completedThisFrame: entry.completedThisFrame,
    };
  }

  update(dtSeconds) {
    const active = [];
    const completed = [];
    const dt = Math.max(0, dtSeconds);

    for (const [id, entry] of this.activeEvents) {
      const definition = this.definitions[id];
      entry.startedThisFrame = entry.startedThisFrame && dt <= 0;
      entry.completedThisFrame = false;

      if (dt > 0) {
        entry.startedThisFrame = false;
        entry.elapsedSeconds += dt;
      }

      if (entry.elapsedSeconds >= definition.totalDuration) {
        completed.push({
          id,
          elapsedSeconds: definition.totalDuration,
          totalDuration: definition.totalDuration,
          progress: 1,
        });
        this.activeEvents.delete(id);
        continue;
      }

      const phaseState = resolvePhaseState(definition, entry.elapsedSeconds);
      entry.phaseIndex = phaseState.phaseIndex;
      active.push({
        id,
        elapsedSeconds: entry.elapsedSeconds,
        totalDuration: entry.totalDuration,
        progress: Math.max(0, Math.min(1, entry.elapsedSeconds / entry.totalDuration)),
        phaseIndex: phaseState.phaseIndex,
        phaseId: phaseState.phaseId,
        phaseProgress: phaseState.phaseProgress,
      });
    }

    return { active, completed };
  }

  clear() {
    this.activeEvents.clear();
  }
}
