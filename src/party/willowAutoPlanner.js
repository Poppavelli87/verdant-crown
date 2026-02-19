function normalizeTier(tier) {
  const value = String(tier ?? "").trim().toLowerCase();
  if (value === "still" || value === "uneasy" || value === "balanced" || value === "restless" || value === "fractured") {
    return value;
  }
  return "balanced";
}

export function planWillowAutoStance({ crownTier = "balanced", bossObjectiveNearby = false } = {}) {
  const tier = normalizeTier(crownTier);
  if (tier === "fractured") return "emerald";
  if (bossObjectiveNearby) return "sapphire";
  return "ruby";
}

export function getWillowAutoStanceBanter(stance) {
  const key = String(stance ?? "").toLowerCase();
  if (key === "emerald") return "Willow: Emerald will hold.";
  if (key === "sapphire") return "Willow: Sapphire sharpens.";
  return "Willow: Ruby suits this.";
}
