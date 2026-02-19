const DEFAULT_MAX_HP = 100;
const DEFAULT_INVULN_WINDOW_MS = 350;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// PlayerState keeps runtime-only HP and invulnerability behavior deterministic.
export class PlayerState {
  constructor({ maxHP = DEFAULT_MAX_HP, invulnWindowMs = DEFAULT_INVULN_WINDOW_MS } = {}) {
    this.maxHP = Math.max(1, Number(maxHP) || DEFAULT_MAX_HP);
    this.hp = this.maxHP;
    this.invulnWindowMs = Math.max(0, Number(invulnWindowMs) || DEFAULT_INVULN_WINDOW_MS);
    this.invulnRemainingSeconds = 0;
  }

  update(dtSeconds) {
    this.invulnRemainingSeconds = Math.max(0, this.invulnRemainingSeconds - Math.max(0, dtSeconds));
  }

  canTakeDamage() {
    return this.invulnRemainingSeconds <= 0;
  }

  grantInvulnerability(seconds) {
    const duration = Math.max(0, Number(seconds) || 0);
    this.invulnRemainingSeconds = Math.max(this.invulnRemainingSeconds, duration);
  }

  applyDamage(amount) {
    if (!this.canTakeDamage()) {
      return 0;
    }
    const incoming = Math.max(0, Number(amount) || 0);
    const nextHp = clamp(this.hp - incoming, 0, this.maxHP);
    const dealt = this.hp - nextHp;
    this.hp = nextHp;
    if (dealt > 0 && this.invulnWindowMs > 0) {
      this.invulnRemainingSeconds = this.invulnWindowMs / 1000;
    }
    return dealt;
  }

  setHP(value, { resetInvulnerability = false } = {}) {
    this.hp = clamp(Number(value) || 0, 0, this.maxHP);
    if (resetInvulnerability) {
      this.invulnRemainingSeconds = 0;
    }
  }

  setMaxHP(nextMaxHP, { restoreToFull = false } = {}) {
    const resolved = Math.max(1, Number(nextMaxHP) || this.maxHP);
    this.maxHP = resolved;
    if (restoreToFull) {
      this.hp = this.maxHP;
      return;
    }
    this.hp = clamp(this.hp, 0, this.maxHP);
  }

  restoreToFull({ resetInvulnerability = true } = {}) {
    this.hp = this.maxHP;
    if (resetInvulnerability) {
      this.invulnRemainingSeconds = 0;
    }
  }

  isDepleted() {
    return this.hp <= 0;
  }

  getSnapshot() {
    return {
      hp: this.hp,
      maxHP: this.maxHP,
      invulnRemainingMs: Math.round(this.invulnRemainingSeconds * 1000),
      invulnWindowMs: this.invulnWindowMs,
    };
  }
}
