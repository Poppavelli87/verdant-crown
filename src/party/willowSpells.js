export const WILLOW_STANCES = Object.freeze(["ruby", "emerald", "sapphire"]);
export const WILLOW_SPELL_KEYS = Object.freeze(["h", "j", "k", "l"]);

export const WILLOW_SPELLS_BY_STANCE = Object.freeze({
  ruby: Object.freeze({
    h: Object.freeze({
      id: "ruby_ember_dart",
      name: "Ember Dart",
      key: "h",
      mpCost: 8,
      cooldownSeconds: 0.58,
      type: "projectile",
      damage: 8.6,
      icon: "D",
      color: "#ff9c66",
    }),
    j: Object.freeze({
      id: "ruby_cinder_fan",
      name: "Cinder Fan",
      key: "j",
      mpCost: 16,
      cooldownSeconds: 2.9,
      type: "spread",
      pellets: 3,
      damage: 6.5,
      icon: "F",
      color: "#ffb36c",
    }),
    k: Object.freeze({
      id: "ruby_pyre_ring",
      name: "Pyre Ring",
      key: "k",
      mpCost: 24,
      cooldownSeconds: 5.7,
      type: "aoe_delayed",
      delaySeconds: 0.5,
      radius: 0.95,
      damage: 18,
      icon: "R",
      color: "#ff8a57",
    }),
    l: Object.freeze({
      id: "ruby_ignite_mark",
      name: "Ignite Mark",
      key: "l",
      mpCost: 18,
      cooldownSeconds: 7.4,
      type: "debuff",
      debuffId: "ignite",
      durationSeconds: 8,
      icon: "M",
      color: "#ff6c5e",
    }),
  }),
  emerald: Object.freeze({
    h: Object.freeze({
      id: "emerald_thorn_dart",
      name: "Thorn Dart",
      key: "h",
      mpCost: 9,
      cooldownSeconds: 0.72,
      type: "projectile",
      damage: 9.8,
      icon: "D",
      color: "#8eea8a",
    }),
    j: Object.freeze({
      id: "emerald_bramble_burst",
      name: "Bramble Burst",
      key: "j",
      mpCost: 20,
      cooldownSeconds: 3.4,
      type: "aoe",
      radius: 0.82,
      damage: 15,
      icon: "B",
      color: "#7ddf86",
    }),
    k: Object.freeze({
      id: "emerald_vine_lash",
      name: "Vine Lash",
      key: "k",
      mpCost: 21,
      cooldownSeconds: 4.6,
      type: "projectile",
      damage: 14.8,
      knockback: 0.6,
      icon: "V",
      color: "#7fd8b5",
    }),
    l: Object.freeze({
      id: "emerald_wither_mark",
      name: "Wither Mark",
      key: "l",
      mpCost: 24,
      cooldownSeconds: 8.2,
      type: "debuff",
      debuffId: "wither",
      durationSeconds: 8,
      icon: "W",
      color: "#6cd29f",
    }),
  }),
  sapphire: Object.freeze({
    h: Object.freeze({
      id: "sapphire_arc_bolt",
      name: "Arc Bolt",
      key: "h",
      mpCost: 8,
      cooldownSeconds: 0.62,
      type: "projectile",
      damage: 8.9,
      markedBonusMultiplier: 1.22,
      icon: "A",
      color: "#8ec8ff",
    }),
    j: Object.freeze({
      id: "sapphire_shard_lance",
      name: "Shard Lance",
      key: "j",
      mpCost: 22,
      cooldownSeconds: 4.8,
      type: "pierce",
      maxTargets: 2,
      range: 3.7,
      width: 0.66,
      damage: 15.7,
      icon: "L",
      color: "#9ac6ff",
    }),
    k: Object.freeze({
      id: "sapphire_storm_sigil",
      name: "Storm Sigil",
      key: "k",
      mpCost: 30,
      cooldownSeconds: 7.2,
      type: "aoe_delayed",
      delaySeconds: 0.42,
      radius: 1.05,
      damage: 22.5,
      icon: "S",
      color: "#89b5ff",
    }),
    l: Object.freeze({
      id: "sapphire_focus_mark",
      name: "Focus Mark",
      key: "l",
      mpCost: 19,
      cooldownSeconds: 9,
      type: "debuff",
      debuffId: "focus",
      durationSeconds: 6,
      icon: "F",
      color: "#7ea9ff",
    }),
  }),
});

export function normalizeWillowStance(stance) {
  const value = String(stance ?? "").toLowerCase();
  return WILLOW_STANCES.includes(value) ? value : "ruby";
}

export function normalizeWillowSpellKey(key) {
  const value = String(key ?? "").toLowerCase();
  return WILLOW_SPELL_KEYS.includes(value) ? value : "";
}

export function getWillowSpellSet(stance) {
  const resolvedStance = normalizeWillowStance(stance);
  return WILLOW_SPELLS_BY_STANCE[resolvedStance];
}

export function getWillowSpell(stance, key) {
  const spellSet = getWillowSpellSet(stance);
  const resolvedKey = normalizeWillowSpellKey(key);
  return resolvedKey ? spellSet[resolvedKey] ?? null : null;
}

export function getWillowSpellKeys() {
  return [...WILLOW_SPELL_KEYS];
}
