function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(min, max, t) {
  return min + (max - min) * t;
}

function deterministicUnit(seed) {
  const raw = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return raw - Math.floor(raw);
}

function nextInterval(tuning, seed) {
  return lerp(tuning.wanderIntervalSecondsMin, tuning.wanderIntervalSecondsMax, deterministicUnit(seed));
}

export function createCompanionRoamState() {
  return {
    state: "idle",
    timer: 0,
    pauseRemaining: 0,
    target: null,
    cycle: 0,
  };
}

export function computeCompanionRoamGoal({
  companionId,
  currentPosition,
  leaderPosition,
  elapsedSeconds,
  roamState,
  tuning,
}) {
  const state = roamState ?? createCompanionRoamState();
  const dx = leaderPosition.x - currentPosition.x;
  const dz = leaderPosition.z - currentPosition.z;
  const distanceToLeader = Math.hypot(dx, dz);

  if (distanceToLeader >= tuning.leashDistanceHard) {
    state.state = "regroup";
    state.target = { x: leaderPosition.x, z: leaderPosition.z };
    state.pauseRemaining = 0;
    state.timer = nextInterval(tuning, elapsedSeconds + state.cycle + 11);
    return { x: leaderPosition.x, z: leaderPosition.z, aiState: "regroup", roamState: state };
  }

  if (state.pauseRemaining > 0) {
    state.pauseRemaining = Math.max(0, state.pauseRemaining - (1 / 60));
    return { x: currentPosition.x, z: currentPosition.z, aiState: "idle", roamState: state };
  }

  state.timer = Math.max(0, state.timer - (1 / 60));
  const shouldPickNewTarget = !state.target || state.timer <= 0 || Math.hypot(state.target.x - currentPosition.x, state.target.z - currentPosition.z) < 0.25;

  if (shouldPickNewTarget) {
    state.cycle += 1;
    const baseSeed = elapsedSeconds + state.cycle + companionId.length * 17;
    const investigateRoll = deterministicUnit(baseSeed + 0.37);
    const radius = clamp(deterministicUnit(baseSeed + 0.73), 0.2, 1) * tuning.roamRadius;
    const angle = deterministicUnit(baseSeed + 0.19) * Math.PI * 2;
    const origin = distanceToLeader > tuning.leashDistanceSoft ? leaderPosition : currentPosition;
    let targetX = origin.x + Math.cos(angle) * radius;
    let targetZ = origin.z + Math.sin(angle) * radius;
    let nextState = "wander";

    if (investigateRoll <= tuning.investigationChance) {
      const investigateAngle = deterministicUnit(baseSeed + 0.91) * Math.PI * 2;
      const investigateDistance = clamp(deterministicUnit(baseSeed + 1.2), 0.25, 1) * tuning.investigationRadius;
      targetX = currentPosition.x + Math.cos(investigateAngle) * investigateDistance;
      targetZ = currentPosition.z + Math.sin(investigateAngle) * investigateDistance;
      nextState = "investigate";
    }

    state.state = nextState;
    state.target = { x: targetX, z: targetZ };
    state.timer = nextInterval(tuning, baseSeed + 1.6);
    state.pauseRemaining = lerp(tuning.pauseSecondsMin, tuning.pauseSecondsMax, deterministicUnit(baseSeed + 2.1));
  }

  return {
    x: state.target?.x ?? currentPosition.x,
    z: state.target?.z ?? currentPosition.z,
    aiState: state.state,
    roamState: state,
  };
}
