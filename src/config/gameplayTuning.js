export const COMBAT_TUNING = Object.freeze({
  hitStopSecondsLight: 0.024,
  hitStopSecondsCharge: 0.042,
  aggressionRampPerSecond: 0.065,
  aggressionDecayPerSecond: 0.08,
  maxAggressionRamp: 0.65,
  attackCooldownScaleAtMaxAggression: 0.8,
  movementSpeedScaleAtMaxAggression: 1.2,
  postAttackRecoverySeconds: 0.16,
  staggerImmunitySeconds: 0.32,
});

export const COLLISION_TUNING = Object.freeze({
  iterations: 3,
  playerRadius: 0.34,
  companionRadius: 0.31,
  npcRadiusPadding: 0.08,
  enemyWeight: 1,
  companionWeight: 0.9,
  playerWeight: 0.7,
  staticWeight: 0,
  personalSpaceMultiplier: 1.08,
});

export const COMPANION_AI_TUNING = Object.freeze({
  roamRadius: 2.4,
  leashDistanceSoft: 2.2,
  leashDistanceHard: 3.4,
  wanderIntervalSecondsMin: 1.1,
  wanderIntervalSecondsMax: 2.4,
  pauseSecondsMin: 0.25,
  pauseSecondsMax: 0.85,
  investigationChance: 0.28,
  investigationRadius: 1.1,
  combatSpreadBias: 0.26,
});
