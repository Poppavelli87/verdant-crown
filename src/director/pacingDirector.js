const WINDOW_SECONDS = 30;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function sumEvents(events) {
  let total = 0;
  for (const event of events) {
    total += event.amount;
  }
  return total;
}

// PacingDirector tracks player strain signals for future adaptive logic.
export class PacingDirector {
  constructor() {
    this.reset();
  }

  reset() {
    this.elapsedSeconds = 0;
    this.timeInCombat = 0;

    this.damageTakenEvents = [];
    this.damageDealtEvents = [];
    this.nearDeathEvents = [];
    this.storyEventLog = [];

    this.playerStrain = 0;
    this.debugStrainOverride = null;
    this.paused = false;
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
  }

  _pruneEvents() {
    const cutoff = this.elapsedSeconds - WINDOW_SECONDS;
    this.damageTakenEvents = this.damageTakenEvents.filter((event) => event.time >= cutoff);
    this.damageDealtEvents = this.damageDealtEvents.filter((event) => event.time >= cutoff);
    this.nearDeathEvents = this.nearDeathEvents.filter((event) => event.time >= cutoff);
    this.storyEventLog = this.storyEventLog.filter((event) => event.time >= cutoff);
  }

  recordDamageTaken(amount) {
    if (this.paused) return;
    if (amount <= 0) return;
    this.damageTakenEvents.push({ time: this.elapsedSeconds, amount });
  }

  recordDamageDealt(amount) {
    if (this.paused) return;
    if (amount <= 0) return;
    this.damageDealtEvents.push({ time: this.elapsedSeconds, amount });
  }

  recordNearDeath() {
    if (this.paused) return;
    this.nearDeathEvents.push({ time: this.elapsedSeconds, amount: 1 });
  }

  recordEvent(name, amount = 1) {
    if (this.paused) return;
    if (!name) return;
    this.storyEventLog.push({
      time: this.elapsedSeconds,
      name: String(name),
      amount: Number(amount) || 1,
    });
  }

  _getEventSummary() {
    const summary = {};
    for (const event of this.storyEventLog) {
      summary[event.name] = Number(((summary[event.name] ?? 0) + event.amount).toFixed(3));
    }
    return summary;
  }

  _getRecentCombatSuccess() {
    const dealt = sumEvents(this.damageDealtEvents);
    const taken = sumEvents(this.damageTakenEvents);
    if (dealt <= 0 && taken <= 0) {
      return 0.5;
    }
    return clamp01((dealt + 28 - taken * 0.9) / 80);
  }

  setDebugStrain(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      this.debugStrainOverride = null;
      return;
    }
    this.debugStrainOverride = clamp01(Number(value));
    this.playerStrain = this.debugStrainOverride;
  }

  getEncounterComposition(regionBaselinePressure = 0.35, context = {}) {
    const strain = this.debugStrainOverride ?? this.playerStrain;
    const baseline = clamp01(regionBaselinePressure);
    const success = this._getRecentCombatSuccess();
    const challenge = clamp01((1 - strain) * 0.58 + baseline * 0.24 + success * 0.18);
    const sceneId = String(context?.sceneId ?? "").trim();
    const crownTier = String(context?.crownTier ?? "Balanced");
    const pressureStage = Math.max(1, Math.min(2, Math.floor(Number(context?.pressureStage) || 1)));
    const forVein = Boolean(context?.forVein);

    if (forVein) {
      if (strain >= 0.86) {
        return ["striker", "bulwark"];
      }
      if (pressureStage >= 2 || crownTier === "Fractured") {
        return ["bulwark", "hexer", "striker"];
      }
      return challenge >= 0.58 ? ["bulwark", "striker", "hexer"] : ["bulwark", "striker", "skirmisher"];
    }

    if (sceneId === "emberfall") {
      if (strain >= 0.82) {
        return ["striker", "bulwark"];
      }
      if (pressureStage >= 2 || crownTier === "Fractured") {
        return ["striker", "striker", "bulwark"];
      }
      return ["striker", "bulwark", "hexer"];
    }

    if (sceneId === "thornmere") {
      if (strain >= 0.84) {
        return ["striker"];
      }
      if (pressureStage >= 2) {
        return ["striker", "hexer", "bulwark"];
      }
      return ["striker", "hexer"];
    }

    // Role composition is intentionally small and deterministic for the current vertical slice.
    if (strain >= 0.85) {
      return ["skirmisher"];
    }
    if (strain >= 0.62) {
      return ["skirmisher", "skirmisher"];
    }
    if (strain >= 0.45) {
      return challenge > 0.57 ? ["skirmisher", "harrier"] : ["skirmisher", "skirmisher"];
    }
    if (strain <= 0.22 && challenge > 0.72) {
      return ["brute", "harrier"];
    }
    if (challenge > 0.64) {
      return ["brute", "skirmisher"];
    }
    if (challenge > 0.42) {
      return ["skirmisher", "harrier"];
    }
    return ["skirmisher", "skirmisher"];
  }

  update(dtSeconds, { inCombat, playerHealthRatio }) {
    if (this.paused) {
      return this.getState();
    }
    this.elapsedSeconds += dtSeconds;
    if (inCombat) {
      this.timeInCombat += dtSeconds;
    }

    this._pruneEvents();

    const damageTakenLast30s = sumEvents(this.damageTakenEvents);
    const damageDealtLast30s = sumEvents(this.damageDealtEvents);
    const nearDeathCount = this.nearDeathEvents.length;

    const takenPressure = clamp01(damageTakenLast30s / 100);
    const dealtPressure = clamp01(damageDealtLast30s / 120);
    const combatPressure = clamp01(this.timeInCombat / 30);
    const nearDeathPressure = clamp01(nearDeathCount / 3);
    const healthPressure = clamp01(1 - playerHealthRatio);

    const computedStrain = clamp01(
      takenPressure * 0.38 +
        (1 - dealtPressure) * 0.17 +
        combatPressure * 0.2 +
        nearDeathPressure * 0.15 +
        healthPressure * 0.1
    );
    this.playerStrain = this.debugStrainOverride ?? computedStrain;

    return this.getState();
  }

  getState() {
    return {
      damageTakenLast30s: Number(sumEvents(this.damageTakenEvents).toFixed(3)),
      damageDealtLast30s: Number(sumEvents(this.damageDealtEvents).toFixed(3)),
      timeInCombat: Number(this.timeInCombat.toFixed(3)),
      nearDeathEvents: this.nearDeathEvents.length,
      playerStrain: Number(this.playerStrain.toFixed(3)),
      debugStrainOverride:
        this.debugStrainOverride === null ? null : Number(this.debugStrainOverride.toFixed(3)),
      recentCombatSuccess: Number(this._getRecentCombatSuccess().toFixed(3)),
      eventSummary: this._getEventSummary(),
      paused: this.paused,
    };
  }
}
