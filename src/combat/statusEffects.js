const EPSILON = 1e-6;
const DEFAULT_DURATION_SECONDS = 1;
const FOCUS_ATTACKER_ID = "willow";

export const STATUS_EFFECT_IDS = Object.freeze({
  BUFF_ATTDEF: "buff_attdef",
  ARTHUR_RAGE: "arthur_rage",
  IGNITE_MARK: "ignite_mark",
  WITHER_MARK: "wither_mark",
  FOCUS_MARK: "focus_mark",
  SUPPRESSION_FIELD: "suppression_field",
  HEX_WEAKENED: "hex_weakened",
  SILENCED_ROOTS: "silenced_roots",
  NULL_SILENCE: "null_silence",
  NULL_CLAMP: "null_clamp",
  MEMORY_TAX: "memory_tax",
  REWRITE_MARK: "rewrite_mark",
});

export const STATUS_EFFECT_DEFINITIONS = Object.freeze({
  [STATUS_EFFECT_IDS.BUFF_ATTDEF]: Object.freeze({
    id: STATUS_EFFECT_IDS.BUFF_ATTDEF,
    icon: "buff_attdef",
    positive: true,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.5,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.ARTHUR_RAGE]: Object.freeze({
    id: STATUS_EFFECT_IDS.ARTHUR_RAGE,
    icon: "buff_attdef",
    positive: true,
    attackMultiplierPerCharge: 0.1,
    maxCharges: 10,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.IGNITE_MARK]: Object.freeze({
    id: STATUS_EFFECT_IDS.IGNITE_MARK,
    icon: "ignite_mark",
    positive: false,
    damageTakenMultiplier: 1.25,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.WITHER_MARK]: Object.freeze({
    id: STATUS_EFFECT_IDS.WITHER_MARK,
    icon: "wither_mark",
    positive: false,
    damageTakenMultiplier: 1.15,
    damageDealtMultiplier: 0.85,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.FOCUS_MARK]: Object.freeze({
    id: STATUS_EFFECT_IDS.FOCUS_MARK,
    icon: "focus_mark",
    positive: false,
    focusBonusMultiplier: 1.4,
    focusAttackerId: FOCUS_ATTACKER_ID,
    consumeOnHit: true,
    nonStackable: true,
    defaultCharges: 3,
  }),
  [STATUS_EFFECT_IDS.SUPPRESSION_FIELD]: Object.freeze({
    id: STATUS_EFFECT_IDS.SUPPRESSION_FIELD,
    icon: "suppression_field",
    positive: false,
    healingReceivedMultiplier: 0.6,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.HEX_WEAKENED]: Object.freeze({
    id: STATUS_EFFECT_IDS.HEX_WEAKENED,
    icon: "hex_weakened",
    positive: false,
    defenseMultiplier: 0.85,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.SILENCED_ROOTS]: Object.freeze({
    id: STATUS_EFFECT_IDS.SILENCED_ROOTS,
    icon: "silenced_roots",
    positive: false,
    mpRegenMultiplier: 0.7,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.NULL_SILENCE]: Object.freeze({
    id: STATUS_EFFECT_IDS.NULL_SILENCE,
    icon: "null_silence",
    positive: false,
    mpRegenMultiplier: 0.6,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.NULL_CLAMP]: Object.freeze({
    id: STATUS_EFFECT_IDS.NULL_CLAMP,
    icon: "null_clamp",
    positive: false,
    healingReceivedMultiplier: 0.8,
    mpRegenMultiplier: 0.7,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.MEMORY_TAX]: Object.freeze({
    id: STATUS_EFFECT_IDS.MEMORY_TAX,
    icon: "memory_tax",
    positive: false,
    healingReceivedMultiplier: 0.75,
    nonStackable: true,
  }),
  [STATUS_EFFECT_IDS.REWRITE_MARK]: Object.freeze({
    id: STATUS_EFFECT_IDS.REWRITE_MARK,
    icon: "rewrite_mark",
    positive: false,
    movementSpeedMultiplier: 0.85,
    nonStackable: true,
  }),
});

const EFFECT_ORDER = Object.freeze([
  STATUS_EFFECT_IDS.BUFF_ATTDEF,
  STATUS_EFFECT_IDS.ARTHUR_RAGE,
  STATUS_EFFECT_IDS.SUPPRESSION_FIELD,
  STATUS_EFFECT_IDS.SILENCED_ROOTS,
  STATUS_EFFECT_IDS.NULL_SILENCE,
  STATUS_EFFECT_IDS.NULL_CLAMP,
  STATUS_EFFECT_IDS.MEMORY_TAX,
  STATUS_EFFECT_IDS.REWRITE_MARK,
  STATUS_EFFECT_IDS.IGNITE_MARK,
  STATUS_EFFECT_IDS.WITHER_MARK,
  STATUS_EFFECT_IDS.FOCUS_MARK,
  STATUS_EFFECT_IDS.HEX_WEAKENED,
]);
const EFFECT_ORDER_INDEX = Object.freeze(
  EFFECT_ORDER.reduce((acc, id, index) => {
    acc[id] = index;
    return acc;
  }, {})
);

function clampPositive(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
}

function clampTime(value) {
  return Math.max(0, Number(value) || 0);
}

function resolveEntityId(entityId) {
  const id = String(entityId ?? "").trim();
  return id || null;
}

function effectComparator(left, right) {
  const leftIndex = EFFECT_ORDER_INDEX[left.id] ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = EFFECT_ORDER_INDEX[right.id] ?? Number.MAX_SAFE_INTEGER;
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return String(left.id).localeCompare(String(right.id));
}

export function isNegativeStatusEffect(effectId) {
  const definition = STATUS_EFFECT_DEFINITIONS[String(effectId ?? "")];
  if (!definition) return false;
  return definition.positive !== true;
}

export class StatusEffectManager {
  constructor({ initialTimeSeconds = 0 } = {}) {
    this.timeSeconds = clampTime(initialTimeSeconds);
    this.effectsByEntity = new Map();
  }

  _getEffectDefinition(effectId) {
    return STATUS_EFFECT_DEFINITIONS[String(effectId ?? "")] ?? null;
  }

  _getEffectList(entityId, { create = false } = {}) {
    const id = resolveEntityId(entityId);
    if (!id) return null;
    const existing = this.effectsByEntity.get(id);
    if (existing || !create) return existing ?? null;
    const created = [];
    this.effectsByEntity.set(id, created);
    return created;
  }

  _pruneEntityEffects(entityId, list) {
    const now = this.timeSeconds;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const effect = list[index];
      if (effect.expiresAtTime <= now + EPSILON || (effect.charges != null && effect.charges <= 0)) {
        list.splice(index, 1);
      }
    }
    if (list.length === 0) {
      this.effectsByEntity.delete(entityId);
    }
  }

  update(dtSeconds) {
    const delta = clampPositive(dtSeconds, 0);
    if (delta > 0) {
      this.timeSeconds += delta;
    }
    for (const [entityId, effects] of this.effectsByEntity.entries()) {
      this._pruneEntityEffects(entityId, effects);
    }
  }

  addEffect(entityId, effectInput = {}) {
    const id = resolveEntityId(entityId);
    if (!id) return null;
    const effectId = String(effectInput.id ?? "").trim();
    const definition = this._getEffectDefinition(effectId);
    if (!definition) return null;

    const now = this.timeSeconds;
    const durationSeconds = clampPositive(
      effectInput.durationSeconds ?? effectInput.seconds ?? effectInput.duration,
      DEFAULT_DURATION_SECONDS
    );
    const requestedExpiry = effectInput.expiresAtTime;
    const expiresAtTime = Number.isFinite(Number(requestedExpiry))
      ? Math.max(now + EPSILON, Number(requestedExpiry))
      : now + durationSeconds;
    const list = this._getEffectList(id, { create: true });
    const existing = list.find((effect) => effect.id === effectId);
    const defaultCharges = definition.defaultCharges;
    const requestedCharges =
      effectInput.charges == null ? defaultCharges : Math.max(0, Math.floor(Number(effectInput.charges) || 0));

    if (existing) {
      existing.expiresAtTime = Math.max(existing.expiresAtTime, expiresAtTime);
      if (requestedCharges != null) {
        const currentCharges = existing.charges == null ? 0 : existing.charges;
        existing.charges = Math.max(currentCharges, requestedCharges);
      }
      if (effectInput.sourceId != null) {
        existing.sourceId = effectInput.sourceId;
      }
      if (effectInput.data != null) {
        existing.data = { ...(existing.data ?? {}), ...(effectInput.data ?? {}) };
      }
    } else {
      list.push({
        id: effectId,
        expiresAtTime,
        charges: requestedCharges,
        sourceId: effectInput.sourceId ?? null,
        data: effectInput.data ? { ...effectInput.data } : null,
      });
      list.sort(effectComparator);
    }

    this._pruneEntityEffects(id, list);
    return this.getEffects(id).find((effect) => effect.id === effectId) ?? null;
  }

  removeEffect(entityId, effectId) {
    const id = resolveEntityId(entityId);
    if (!id) return false;
    const list = this._getEffectList(id);
    if (!list) return false;
    const next = list.filter((effect) => effect.id !== effectId);
    if (next.length === list.length) return false;
    if (next.length === 0) {
      this.effectsByEntity.delete(id);
    } else {
      next.sort(effectComparator);
      this.effectsByEntity.set(id, next);
    }
    return true;
  }

  clearEffects(entityId, { negativeOnly = false } = {}) {
    const id = resolveEntityId(entityId);
    if (!id) return 0;
    const list = this._getEffectList(id);
    if (!list || list.length === 0) return 0;
    if (!negativeOnly) {
      const removed = list.length;
      this.effectsByEntity.delete(id);
      return removed;
    }

    const retained = list.filter((effect) => !isNegativeStatusEffect(effect.id));
    const removed = list.length - retained.length;
    if (retained.length === 0) {
      this.effectsByEntity.delete(id);
    } else {
      retained.sort(effectComparator);
      this.effectsByEntity.set(id, retained);
    }
    return removed;
  }

  clearAllEffects() {
    this.effectsByEntity.clear();
  }

  hasEffect(entityId, effectId) {
    const id = resolveEntityId(entityId);
    if (!id) return false;
    return this.getEffects(id).some((effect) => effect.id === effectId);
  }

  getEffect(entityId, effectId) {
    const effects = this.getEffects(entityId);
    return effects.find((effect) => effect.id === effectId) ?? null;
  }

  getEffects(entityId) {
    const id = resolveEntityId(entityId);
    if (!id) return [];
    const list = this._getEffectList(id);
    if (!list || list.length === 0) return [];
    this._pruneEntityEffects(id, list);
    const now = this.timeSeconds;
    return list
      .map((effect) => {
        const definition = this._getEffectDefinition(effect.id);
        if (!definition) return null;
        return {
          id: effect.id,
          icon: definition.icon,
          positive: definition.positive === true,
          remainingSeconds: Math.max(0, effect.expiresAtTime - now),
          expiresAtTime: effect.expiresAtTime,
          charges: effect.charges == null ? null : effect.charges,
          sourceId: effect.sourceId ?? null,
          data: effect.data ? { ...effect.data } : null,
        };
      })
      .filter(Boolean)
      .sort(effectComparator);
  }

  getEntityIdsWithEffects() {
    return Array.from(this.effectsByEntity.keys()).sort((a, b) => String(a).localeCompare(String(b)));
  }

  getAttackMultiplier(entityId) {
    const effects = this.getEffects(entityId);
    let multiplier = 1;
    for (const effect of effects) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition) continue;
      if (definition.attackMultiplier) {
        multiplier *= definition.attackMultiplier;
      }
      const stackScale = Math.max(0, Number(definition.attackMultiplierPerCharge) || 0);
      if (stackScale > 0) {
        const maxStacks = Number.isFinite(Number(definition.maxCharges))
          ? Math.max(0, Number(definition.maxCharges) || 0)
          : Number.POSITIVE_INFINITY;
        const stacks = Math.min(maxStacks, Math.max(0, Number(effect.charges) || 0));
        if (stacks > 0) {
          multiplier *= 1 + stackScale * stacks;
        }
      }
    }
    return multiplier;
  }

  getDefenseMultiplier(entityId) {
    const effects = this.getEffects(entityId);
    let multiplier = 1;
    for (const effect of effects) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.defenseMultiplier) continue;
      multiplier *= definition.defenseMultiplier;
    }
    return multiplier;
  }

  getDamageDealtMultiplier(attackerId, targetId, damageType = "any") {
    let multiplier = 1;
    for (const effect of this.getEffects(attackerId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (definition?.damageDealtMultiplier) {
        multiplier *= definition.damageDealtMultiplier;
      }
    }
    for (const effect of this.getEffects(targetId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.focusBonusMultiplier) continue;
      const expectedAttacker = definition.focusAttackerId ?? FOCUS_ATTACKER_ID;
      if (String(attackerId ?? "") !== expectedAttacker) continue;
      if ((effect.charges ?? 0) <= 0) continue;
      multiplier *= definition.focusBonusMultiplier;
    }
    return multiplier;
  }

  getDamageTakenMultiplier(targetId, attackerId, damageType = "any") {
    let multiplier = 1;
    for (const effect of this.getEffects(targetId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.damageTakenMultiplier) continue;
      multiplier *= definition.damageTakenMultiplier;
    }
    return multiplier;
  }

  getHealingReceivedMultiplier(entityId) {
    let multiplier = 1;
    for (const effect of this.getEffects(entityId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.healingReceivedMultiplier) continue;
      multiplier *= definition.healingReceivedMultiplier;
    }
    return multiplier;
  }

  getMpRegenMultiplier(entityId) {
    let multiplier = 1;
    for (const effect of this.getEffects(entityId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.mpRegenMultiplier) continue;
      multiplier *= definition.mpRegenMultiplier;
    }
    return multiplier;
  }

  getMovementSpeedMultiplier(entityId) {
    let multiplier = 1;
    for (const effect of this.getEffects(entityId)) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.movementSpeedMultiplier) continue;
      multiplier *= definition.movementSpeedMultiplier;
    }
    return multiplier;
  }

  consumeHitCharges(attackerId, targetId, damageType = "any") {
    const target = resolveEntityId(targetId);
    if (!target) return false;
    const list = this._getEffectList(target);
    if (!list || list.length === 0) return false;
    let consumed = false;
    for (const effect of list) {
      const definition = this._getEffectDefinition(effect.id);
      if (!definition?.consumeOnHit) continue;
      const expectedAttacker = definition.focusAttackerId ?? FOCUS_ATTACKER_ID;
      if (String(attackerId ?? "") !== expectedAttacker) continue;
      if ((effect.charges ?? 0) <= 0) continue;
      effect.charges = Math.max(0, effect.charges - 1);
      consumed = true;
    }
    this._pruneEntityEffects(target, list);
    return consumed;
  }

  setTime(timeSeconds) {
    this.timeSeconds = clampTime(timeSeconds);
    for (const [entityId, effects] of this.effectsByEntity.entries()) {
      this._pruneEntityEffects(entityId, effects);
    }
  }
}
