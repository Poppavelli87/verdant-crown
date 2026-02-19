const TACTICS_SEQUENCE = Object.freeze(["balanced", "defensive", "aggressive"]);

function normalizeMode(mode) {
  const value = String(mode ?? "").toLowerCase();
  if (value === "balanced" || value === "defensive" || value === "aggressive") {
    return value;
  }
  return "balanced";
}

export function formatTacticsMode(mode) {
  const normalized = normalizeMode(mode);
  if (normalized === "defensive") return "Defensive";
  if (normalized === "aggressive") return "Aggressive";
  return "Balanced";
}

export class PartyTactics {
  constructor(initialMode = "balanced") {
    this.tacticsMode = normalizeMode(initialMode);
  }

  getTacticsMode() {
    return this.tacticsMode;
  }

  setTacticsMode(mode) {
    this.tacticsMode = normalizeMode(mode);
    return this.tacticsMode;
  }

  cycleTacticsMode() {
    const index = TACTICS_SEQUENCE.indexOf(this.tacticsMode);
    const nextIndex = index >= 0 ? (index + 1) % TACTICS_SEQUENCE.length : 0;
    this.tacticsMode = TACTICS_SEQUENCE[nextIndex];
    return this.tacticsMode;
  }
}

