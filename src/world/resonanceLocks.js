function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampPositive(value, fallback = 0) {
  return Math.max(0, toNumber(value, fallback));
}

function cloneLock(lock) {
  return {
    index: lock.index,
    id: lock.id,
    x: lock.x,
    z: lock.z,
    completed: lock.completed,
    cooldown: lock.cooldown,
    echoNodeAlive: lock.echoNodeAlive,
  };
}

const DEFAULT_LOCK_LAYOUT = Object.freeze([
  Object.freeze({ id: "resonance-lock-1", x: -1.76, z: -0.62 }),
  Object.freeze({ id: "resonance-lock-2", x: 0.18, z: 1.28 }),
  Object.freeze({ id: "resonance-lock-3", x: 2.26, z: -0.14 }),
]);

const resonanceState = {
  sceneId: "inner_spire",
  seed: 0,
  locks: [],
  channel: null,
  channelSeconds: 1.5,
  retryCooldownSeconds: 3,
  interactRadius: 1.02,
};

function getLockByIndex(index = 0) {
  const safeIndex = Math.max(0, Math.floor(toNumber(index, 0)));
  return resonanceState.locks[safeIndex] ?? null;
}

function setChannel(nullOrChannel) {
  resonanceState.channel = nullOrChannel
    ? {
        index: Math.max(0, Math.floor(toNumber(nullOrChannel.index, 0))),
        remaining: clampPositive(nullOrChannel.remaining, resonanceState.channelSeconds),
      }
    : null;
}

function resetLock(lock, index) {
  return {
    index,
    id: String(lock?.id ?? `resonance-lock-${index + 1}`),
    x: toNumber(lock?.x, 0),
    z: toNumber(lock?.z ?? lock?.y, 0),
    completed: false,
    cooldown: 0,
    echoNodeAlive: Boolean(lock?.echoNodeAlive),
  };
}

export function initResonanceLocks(sceneId = "inner_spire", seed = 0, config = {}) {
  const layout = Array.isArray(config?.locks) && config.locks.length >= 3 ? config.locks : DEFAULT_LOCK_LAYOUT;
  resonanceState.sceneId = String(sceneId ?? "inner_spire")
    .trim()
    .toLowerCase();
  resonanceState.seed = Math.floor(toNumber(seed, 0));
  resonanceState.channelSeconds = Math.max(0.1, clampPositive(config?.channelSeconds, 1.5));
  resonanceState.retryCooldownSeconds = Math.max(0.2, clampPositive(config?.retryCooldownSeconds, 3));
  resonanceState.interactRadius = Math.max(0.25, clampPositive(config?.interactRadius, 1.02));
  resonanceState.locks = layout.slice(0, 3).map((entry, index) => resetLock(entry, index));
  setChannel(null);
  return getResonanceLocks();
}

export function resetResonanceLocks({ keepCompleted = false } = {}) {
  resonanceState.locks = resonanceState.locks.map((lock, index) => ({
    ...lock,
    completed: keepCompleted ? lock.completed : false,
    cooldown: 0,
    echoNodeAlive: keepCompleted && lock.completed ? false : lock.echoNodeAlive,
  }));
  setChannel(null);
  return getResonanceLocks();
}

export function getResonanceLocks() {
  return resonanceState.locks.map((lock) => cloneLock(lock));
}

export function getResonanceLockCountRemaining() {
  return resonanceState.locks.reduce((count, lock) => count + (lock.completed ? 0 : 1), 0);
}

export function getResonanceChannelState() {
  if (!resonanceState.channel) return null;
  return {
    index: resonanceState.channel.index,
    remaining: resonanceState.channel.remaining,
  };
}

export function canStartResonanceLock(index = 0, { requireEchoNodeClear = false } = {}) {
  if (resonanceState.channel) return false;
  const lock = getLockByIndex(index);
  if (!lock || lock.completed) return false;
  if (lock.cooldown > 0) return false;
  if (requireEchoNodeClear && lock.echoNodeAlive) return false;
  return true;
}

export function startResonanceLockChannel(index = 0, { requireEchoNodeClear = false } = {}) {
  if (!canStartResonanceLock(index, { requireEchoNodeClear })) return false;
  setChannel({
    index,
    remaining: resonanceState.channelSeconds,
  });
  return true;
}

export function interruptResonanceLockChannel({ cooldownSeconds = resonanceState.retryCooldownSeconds } = {}) {
  if (!resonanceState.channel) return false;
  const lock = getLockByIndex(resonanceState.channel.index);
  if (lock && !lock.completed) {
    lock.cooldown = Math.max(lock.cooldown, Math.max(0.1, clampPositive(cooldownSeconds, resonanceState.retryCooldownSeconds)));
  }
  setChannel(null);
  return true;
}

export function destroyResonanceEchoNode(index = 0) {
  const lock = getLockByIndex(index);
  if (!lock || lock.completed || !lock.echoNodeAlive) return false;
  lock.echoNodeAlive = false;
  return true;
}

export function completeResonanceLock(index = 0) {
  const lock = getLockByIndex(index);
  if (!lock || lock.completed) return false;
  lock.completed = true;
  lock.cooldown = 0;
  lock.echoNodeAlive = false;
  if (resonanceState.channel?.index === lock.index) {
    setChannel(null);
  }
  return true;
}

export function isNearResonanceLock(playerPos = null, { includeCompleted = false, interactRadius = null } = {}) {
  if (!playerPos) return null;
  const radius = Math.max(0.2, toNumber(interactRadius, resonanceState.interactRadius));
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const lock of resonanceState.locks) {
    if (!includeCompleted && lock.completed) continue;
    if (lock.cooldown > 0) continue;
    const distance = Math.hypot(toNumber(playerPos.x, 0) - lock.x, toNumber(playerPos.z, 0) - lock.z);
    if (distance <= radius && distance < bestDistance) {
      bestDistance = distance;
      best = lock;
    }
  }
  if (!best) return null;
  return {
    index: best.index,
    id: best.id,
    distance: bestDistance,
  };
}

export function updateResonanceLocks(dtSeconds, playerPos = null, ctx = {}) {
  const dt = Math.max(0, toNumber(dtSeconds, 0));
  const retryCooldown = Math.max(0.1, toNumber(ctx.retryCooldownSeconds, resonanceState.retryCooldownSeconds));
  const interactRadius = Math.max(0.2, toNumber(ctx.interactRadius, resonanceState.interactRadius));
  const lockCompleted = [];
  const lockInterrupted = [];

  for (const lock of resonanceState.locks) {
    lock.cooldown = Math.max(0, lock.cooldown - dt);
  }

  if (resonanceState.channel) {
    const lock = getLockByIndex(resonanceState.channel.index);
    const noLock = !lock || lock.completed;
    const dist = lock && playerPos ? Math.hypot(playerPos.x - lock.x, playerPos.z - lock.z) : Number.POSITIVE_INFINITY;
    const interruptedByDistance = Number.isFinite(dist) ? dist > interactRadius + 0.24 : true;
    const interruptedByContext = Boolean(ctx.interrupted);
    const interruptedByCallback =
      typeof ctx.canChannel === "function" ? ctx.canChannel(cloneLock(lock), resonanceState.channel) === false : false;

    if (noLock || interruptedByDistance || interruptedByContext || interruptedByCallback) {
      const interruptedIndex = resonanceState.channel?.index ?? lock?.index ?? -1;
      if (interruptResonanceLockChannel({ cooldownSeconds: retryCooldown })) {
        lockInterrupted.push(interruptedIndex);
      }
    } else {
      resonanceState.channel.remaining = Math.max(0, resonanceState.channel.remaining - dt);
      if (typeof ctx.onChannelTick === "function") {
        ctx.onChannelTick({
          index: lock.index,
          remaining: resonanceState.channel.remaining,
          lock: cloneLock(lock),
        });
      }
      if (resonanceState.channel.remaining <= 0) {
        if (completeResonanceLock(lock.index)) {
          lockCompleted.push(lock.index);
          if (typeof ctx.onLockCompleted === "function") {
            ctx.onLockCompleted({
              index: lock.index,
              lock: cloneLock(lock),
              remaining: getResonanceLockCountRemaining(),
            });
          }
        }
      }
    }
  }

  if (lockInterrupted.length > 0 && typeof ctx.onChannelInterrupted === "function") {
    for (const index of lockInterrupted) {
      ctx.onChannelInterrupted({ index });
    }
  }

  return {
    sceneId: resonanceState.sceneId,
    channel: getResonanceChannelState(),
    locks: getResonanceLocks(),
    remaining: getResonanceLockCountRemaining(),
    completed: lockCompleted,
  };
}
