export const ROLE_AI_RANGES = Object.freeze({
  elaine: Object.freeze({
    defensive: 5.0,
    balanced: 4.0,
    aggressive: 3.5,
    minSafe: 3.0,
  }),
  willow: Object.freeze({
    defensive: 6.0,
    balanced: 5.0,
    aggressive: 4.5,
    minSafe: 3.5,
  }),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeId(value) {
  return String(value ?? "");
}

function compareByDistanceThenId(a, b) {
  if (a.distance !== b.distance) {
    return a.distance - b.distance;
  }
  return sanitizeId(a.id).localeCompare(sanitizeId(b.id));
}

function toHpRatio(member) {
  const hp = Math.max(0, Number(member?.hp) || 0);
  const maxHp = Math.max(1, Number(member?.maxHp) || 1);
  return hp / maxHp;
}

function normalized(vecX, vecZ, fallbackX = 0, fallbackZ = 1) {
  const length = Math.hypot(vecX, vecZ);
  if (length <= 1e-6) {
    const fallbackLength = Math.hypot(fallbackX, fallbackZ);
    if (fallbackLength <= 1e-6) {
      return { x: 0, z: 1 };
    }
    return { x: fallbackX / fallbackLength, z: fallbackZ / fallbackLength };
  }
  return { x: vecX / length, z: vecZ / length };
}

function getModeRange(role, mode = "balanced") {
  const table = ROLE_AI_RANGES[role];
  if (!table) return 0;
  if (mode === "defensive") return table.defensive;
  if (mode === "aggressive") return table.aggressive;
  return table.balanced;
}

function getLivingMembers(members = []) {
  return members.filter((member) => !member?.downed);
}

function getLowestHpAlly(members = []) {
  const living = getLivingMembers(members);
  if (living.length === 0) return null;
  return [...living]
    .sort((a, b) => {
      const ratioDelta = toHpRatio(a) - toHpRatio(b);
      if (Math.abs(ratioDelta) > 1e-6) return ratioDelta;
      return sanitizeId(a.id).localeCompare(sanitizeId(b.id));
    })
    .at(0);
}

function getSquishyAlly(members = []) {
  const candidates = getLivingMembers(members).filter((member) => member.id === "elaine" || member.id === "willow");
  if (candidates.length === 0) return null;
  return [...candidates]
    .sort((a, b) => {
      const ratioDelta = toHpRatio(a) - toHpRatio(b);
      if (Math.abs(ratioDelta) > 1e-6) return ratioDelta;
      return sanitizeId(a.id).localeCompare(sanitizeId(b.id));
    })
    .at(0);
}

function withDistance(reference, enemies = []) {
  if (!reference) return [];
  return enemies
    .map((enemy) => ({
      id: sanitizeId(enemy?.id),
      x: Number(enemy?.x) || 0,
      z: Number(enemy?.z) || 0,
      role: enemy?.role ?? "",
      distance: Math.hypot((Number(enemy?.x) || 0) - reference.x, (Number(enemy?.z) || 0) - reference.z),
    }))
    .sort(compareByDistanceThenId);
}

export function hasThreatWithinRadius(position, enemies = [], radius = 4.9) {
  const limit = Math.max(0, Number(radius) || 0);
  if (!position || limit <= 0) return false;
  for (const enemy of enemies) {
    const distance = Math.hypot((Number(enemy?.x) || 0) - position.x, (Number(enemy?.z) || 0) - position.z);
    if (distance <= limit) {
      return true;
    }
  }
  return false;
}

export function chooseThreat(party = [], enemies = [], role = "support", leaderId = "arthur") {
  const livingEnemies = enemies.filter((enemy) => enemy && enemy.state !== "dead" && (Number(enemy.health) || 0) > 0);
  if (livingEnemies.length === 0) return null;

  const lowestHpAlly = getLowestHpAlly(party);
  if (lowestHpAlly) {
    const nearestToAlly = withDistance(lowestHpAlly, livingEnemies)[0] ?? null;
    if (nearestToAlly) {
      return {
        ...nearestToAlly,
        reason: "lowest_hp_ally",
        anchorId: lowestHpAlly.id,
        role,
      };
    }
  }

  const leader = getLivingMembers(party).find((member) => member.id === leaderId) ?? getLivingMembers(party)[0] ?? null;
  const nearestToLeader = withDistance(leader, livingEnemies)[0] ?? null;
  if (!nearestToLeader) return null;
  return {
    ...nearestToLeader,
    reason: "leader",
    anchorId: leader?.id ?? "",
    role,
  };
}

function getStrafeSign(memberId) {
  if (memberId === "elaine") return -1;
  if (memberId === "willow") return 1;
  return 1;
}

export function computeDesiredPosition(
  member,
  role,
  mode,
  threat,
  party,
  enemies,
  {
    leader = null,
    followAnchor = null,
    meleeRange = 1.25,
    castingRooted = false,
    strafeEnabled = true,
  } = {}
) {
  const current = {
    x: Number(member?.x) || 0,
    z: Number(member?.z) || 0,
  };
  const resolvedLeader = leader ?? party.find((entry) => entry.id === "arthur") ?? current;
  const fallback = followAnchor
    ? { x: Number(followAnchor.x) || current.x, z: Number(followAnchor.z) || current.z }
    : current;

  if (castingRooted) {
    return {
      x: current.x,
      z: current.z,
      desiredRange: role === "arthur" ? meleeRange * 0.9 : getModeRange(role, mode),
      stateHint: "support_cast",
      distToThreat: threat ? Math.hypot(threat.x - current.x, threat.z - current.z) : null,
    };
  }

  if (!threat) {
    return {
      x: fallback.x,
      z: fallback.z,
      desiredRange: role === "arthur" ? meleeRange * 0.9 : getModeRange(role, mode),
      stateHint: "follow",
      distToThreat: null,
    };
  }

  const toThreat = {
    x: threat.x - current.x,
    z: threat.z - current.z,
  };
  const threatDistance = Math.hypot(toThreat.x, toThreat.z);

  if (role === "arthur") {
    const desiredRange = Math.max(0.7, Number(meleeRange) || 1.25) * 0.9;
    const squishy = getSquishyAlly(party.filter((entry) => entry.id !== "arthur"));
    const defendTarget = squishy ?? resolvedLeader;
    const threatToDefend = normalized(defendTarget.x - threat.x, defendTarget.z - threat.z, 0, 1);
    const intercept = {
      x: threat.x + threatToDefend.x * desiredRange,
      z: threat.z + threatToDefend.z * desiredRange,
    };
    return {
      x: intercept.x,
      z: intercept.z,
      desiredRange,
      stateHint: "intercept",
      distToThreat: threatDistance,
    };
  }

  const desiredRange = getModeRange(role, mode);
  const minSafe = ROLE_AI_RANGES[role]?.minSafe ?? Math.max(2.6, desiredRange - 0.9);
  const threatToLeader = normalized(resolvedLeader.x - threat.x, resolvedLeader.z - threat.z, current.x - threat.x, current.z - threat.z);
  let desired = {
    x: threat.x + threatToLeader.x * desiredRange,
    z: threat.z + threatToLeader.z * desiredRange,
  };

  let stateHint = "engage";
  if (threatDistance < minSafe) {
    const retreatDir = normalized(current.x - threat.x, current.z - threat.z, threatToLeader.x, threatToLeader.z);
    const retreatStep = minSafe - threatDistance + 0.45;
    desired = {
      x: current.x + retreatDir.x * retreatStep,
      z: current.z + retreatDir.z * retreatStep,
    };
    stateHint = "kite";
  }

  if (strafeEnabled) {
    const fromThreat = normalized(desired.x - threat.x, desired.z - threat.z, threatToLeader.x, threatToLeader.z);
    const strafeSign = getStrafeSign(member?.id);
    const strafeMagnitude = role === "willow" ? 0.58 : 0.48;
    desired.x += -fromThreat.z * strafeSign * strafeMagnitude;
    desired.z += fromThreat.x * strafeSign * strafeMagnitude;
  }

  return {
    x: desired.x,
    z: desired.z,
    desiredRange,
    stateHint,
    distToThreat: threatDistance,
  };
}

export function computeSeparationVector(member, others = [], radius = 1.6, strength = 1.0) {
  const targetRadius = Math.max(0.2, Number(radius) || 1.6);
  const targetStrength = Math.max(0, Number(strength) || 0);
  const centerX = Number(member?.x) || 0;
  const centerZ = Number(member?.z) || 0;

  const sortedOthers = [...others].sort((a, b) => sanitizeId(a?.id).localeCompare(sanitizeId(b?.id)));
  let pushX = 0;
  let pushZ = 0;
  for (const other of sortedOthers) {
    if (!other || other.id === member?.id || other.downed) continue;
    const dx = centerX - (Number(other.x) || 0);
    const dz = centerZ - (Number(other.z) || 0);
    const distance = Math.hypot(dx, dz);
    if (distance >= targetRadius) continue;
    const weight = ((targetRadius - distance) / targetRadius) * targetStrength;
    if (distance <= 1e-5) {
      const sign = sanitizeId(member?.id).localeCompare(sanitizeId(other.id)) <= 0 ? 1 : -1;
      pushX += sign * 0.25 * weight;
      continue;
    }
    pushX += (dx / distance) * weight;
    pushZ += (dz / distance) * weight;
  }

  const magnitude = Math.hypot(pushX, pushZ);
  if (magnitude <= 1e-6) {
    return { x: 0, z: 0 };
  }
  const clampedMagnitude = clamp(magnitude, 0, 1.4);
  return {
    x: (pushX / magnitude) * clampedMagnitude,
    z: (pushZ / magnitude) * clampedMagnitude,
  };
}
