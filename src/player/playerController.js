import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Tunable locomotion constants shared by keyboard and touch control paths.
export const WALK_SPEED = 2.3;
export const RUN_SPEED = 3.7;
export const COMBAT_SPEED = 2.0;
export const RUN_THRESHOLD = 2.2;
export const ARRIVAL_RADIUS = 0.16;

const EPSILON = 1e-6;
const COMBO_RESET_SECONDS = 0.5;
const CHARGE_BUILD_PER_SECOND = 0.85;
const LIGHT_ATTACK_CHARGE_GAIN = 0.2;
const CHARGE_MIN_HEAVY_THRESHOLD = 0.22;
const CHARGE_MIN_HOLD_SECONDS = 0.2;

const LIGHT_ATTACK_PROFILE = Object.freeze({
  windupSeconds: 0.05,
  activeSeconds: 0.12,
  recoverySeconds: 0.15,
});

const CHARGE_ATTACK_PROFILE = Object.freeze({
  windupSeconds: 0.08,
  activeSeconds: 0.18,
  recoverySeconds: 0.26,
});

function getAttackTotalSeconds(profile) {
  return profile.windupSeconds + profile.activeSeconds + profile.recoverySeconds;
}

function cloneTargetIntent(targetIntent) {
  if (!targetIntent) return null;
  return {
    targetEnemyId: targetIntent.targetEnemyId ?? null,
    targetPoint: targetIntent.targetPoint ? targetIntent.targetPoint.clone() : null,
  };
}

// PlayerController converts movement + attack intent into deterministic world-space actions.
export class PlayerController {
  constructor() {
    this.movementState = {
      context: "exploration",
      mode: "walk",
      target: null,
    };

    this._lastMoveDirection = new THREE.Vector2(0, 1);

    this.attackState = {
      chargeMeter: 0,
      charging: false,
      chargeHeldSeconds: 0,
      comboStep: 0,
      comboTimerRemaining: 0,
      attackCooldownRemaining: 0,
    };

    this._pendingLightIntent = null;
    this._pendingChargeIntent = null;
    this.statModifiers = {
      moveSpeedMultiplier: 1,
      chargeSpeedMultiplier: 1,
    };
  }

  setStatModifiers({ moveSpeedMultiplier = 1, chargeSpeedMultiplier = 1 } = {}) {
    this.statModifiers.moveSpeedMultiplier = Math.max(0.7, Number(moveSpeedMultiplier) || 1);
    this.statModifiers.chargeSpeedMultiplier = Math.max(0.7, Number(chargeSpeedMultiplier) || 1);
  }

  _resolveSpeed(context, mode) {
    const base = context === "combat" ? COMBAT_SPEED : mode === "run" ? RUN_SPEED : WALK_SPEED;
    return base * this.statModifiers.moveSpeedMultiplier;
  }

  _resolveAttackDirection(playerPosition, intentTargetPoint) {
    if (!intentTargetPoint) {
      return this._lastMoveDirection.clone();
    }

    const toTarget = new THREE.Vector2(intentTargetPoint.x - playerPosition.x, intentTargetPoint.y - playerPosition.z);
    if (toTarget.lengthSq() <= EPSILON) {
      return this._lastMoveDirection.clone();
    }
    return toTarget.normalize();
  }

  requestLightAttack(targetIntent = null) {
    this._pendingLightIntent = cloneTargetIntent(targetIntent);
  }

  startCharge() {
    if (this.attackState.charging) return;
    this.attackState.charging = true;
    this.attackState.chargeHeldSeconds = 0;
  }

  releaseCharge(targetIntent = null) {
    if (!this.attackState.charging) return false;

    const heldFor = this.attackState.chargeHeldSeconds;
    const chargeRatio = this.attackState.chargeMeter;

    this.attackState.charging = false;
    this.attackState.chargeHeldSeconds = 0;

    if (chargeRatio < CHARGE_MIN_HEAVY_THRESHOLD && heldFor < CHARGE_MIN_HOLD_SECONDS) {
      this.requestLightAttack(targetIntent);
      return false;
    }

    this._pendingChargeIntent = {
      ...cloneTargetIntent(targetIntent),
      chargeRatio,
    };
    this.attackState.chargeMeter = 0;
    return true;
  }

  interruptCharge() {
    const wasCharging = this.attackState.charging;
    this.attackState.charging = false;
    this.attackState.chargeHeldSeconds = 0;
    this.attackState.chargeMeter = 0;
    this._pendingChargeIntent = null;
    return wasCharging;
  }

  update({ dtSeconds, playerPosition, inputState, worldContext }) {
    const context = worldContext?.context === "combat" ? "combat" : "exploration";
    this.movementState.context = context;

    let isMoving = false;
    let movementMode = "walk";
    let moveDirection = new THREE.Vector2(0, 0);
    let remainingDistance = Infinity;

    if (inputState.desiredMoveVector.lengthSq() > EPSILON) {
      // Direct movement from keyboard vectors.
      moveDirection.copy(inputState.desiredMoveVector).normalize();
      isMoving = true;
      movementMode = context === "combat" ? "walk" : inputState.wantsRun ? "run" : "walk";
      this.movementState.target = null;
    } else if (inputState.desiredMoveTarget) {
      // Target movement from touch taps.
      const toTarget = new THREE.Vector2(
        inputState.desiredMoveTarget.x - playerPosition.x,
        inputState.desiredMoveTarget.y - playerPosition.z
      );
      remainingDistance = toTarget.length();

      if (remainingDistance <= ARRIVAL_RADIUS) {
        inputState.clearTarget?.();
        this.movementState.target = null;
      } else {
        moveDirection.copy(toTarget).multiplyScalar(1 / remainingDistance);
        isMoving = true;
        movementMode = context === "combat" ? "walk" : remainingDistance > RUN_THRESHOLD ? "run" : "walk";
        this.movementState.target = inputState.desiredMoveTarget.clone();
      }
    } else {
      this.movementState.target = null;
    }

    this.movementState.mode = movementMode;
    const speed = this._resolveSpeed(context, movementMode);

    if (isMoving) {
      const maxStep = speed * dtSeconds;
      const stepDistance = Math.min(maxStep, remainingDistance);
      playerPosition.x += moveDirection.x * stepDistance;
      playerPosition.z += moveDirection.y * stepDistance;

      if (moveDirection.lengthSq() > EPSILON) {
        this._lastMoveDirection.copy(moveDirection);
      }

      if (this.movementState.target) {
        const distanceAfterStep = Math.hypot(
          this.movementState.target.x - playerPosition.x,
          this.movementState.target.y - playerPosition.z
        );
        if (distanceAfterStep <= ARRIVAL_RADIUS) {
          inputState.clearTarget?.();
          this.movementState.target = null;
          isMoving = false;
        }
      }
    }

    this.attackState.attackCooldownRemaining = Math.max(0, this.attackState.attackCooldownRemaining - dtSeconds);
    this.attackState.comboTimerRemaining = Math.max(0, this.attackState.comboTimerRemaining - dtSeconds);

    if (this.attackState.charging) {
      this.attackState.chargeHeldSeconds += dtSeconds;
      this.attackState.chargeMeter = Math.min(
        1,
        this.attackState.chargeMeter + dtSeconds * CHARGE_BUILD_PER_SECOND * this.statModifiers.chargeSpeedMultiplier
      );
    }

    const attackEvents = [];

    if (this._pendingChargeIntent && this.attackState.attackCooldownRemaining <= 0) {
      const profile = CHARGE_ATTACK_PROFILE;
      const direction = this._resolveAttackDirection(playerPosition, this._pendingChargeIntent.targetPoint);
      attackEvents.push({
        type: "charge",
        chargeRatio: this._pendingChargeIntent.chargeRatio,
        range: 2.28,
        minDot: -0.15,
        direction,
        targetEnemyId: this._pendingChargeIntent.targetEnemyId ?? null,
        windupSeconds: profile.windupSeconds,
        activeSeconds: profile.activeSeconds,
        recoverySeconds: profile.recoverySeconds,
      });
      this.attackState.attackCooldownRemaining = getAttackTotalSeconds(profile);
      this.attackState.comboStep = 0;
      this.attackState.comboTimerRemaining = 0;
      this._pendingChargeIntent = null;
    }

    if (this._pendingLightIntent && this.attackState.attackCooldownRemaining <= 0) {
      const profile = LIGHT_ATTACK_PROFILE;
      this.attackState.comboStep = this.attackState.comboTimerRemaining > 0 ? (this.attackState.comboStep === 1 ? 2 : 1) : 1;
      this.attackState.comboTimerRemaining = COMBO_RESET_SECONDS;
      this.attackState.attackCooldownRemaining = getAttackTotalSeconds(profile);
      this.attackState.chargeMeter = Math.min(1, this.attackState.chargeMeter + LIGHT_ATTACK_CHARGE_GAIN);

      const direction = this._resolveAttackDirection(playerPosition, this._pendingLightIntent.targetPoint);
      attackEvents.push({
        type: "light",
        comboStep: this.attackState.comboStep,
        range: 1.25,
        minDot: -0.05,
        direction,
        targetEnemyId: this._pendingLightIntent.targetEnemyId ?? null,
        windupSeconds: profile.windupSeconds,
        activeSeconds: profile.activeSeconds,
        recoverySeconds: profile.recoverySeconds,
      });
      this._pendingLightIntent = null;
    }

    return {
      isMoving,
      isRunning: context === "exploration" && movementMode === "run" && isMoving,
      speed,
      context,
      mode: movementMode,
      moveDirection: this._lastMoveDirection.clone(),
      target: this.movementState.target ? this.movementState.target.clone() : null,
      attackEvents,
      chargeMeter: this.attackState.chargeMeter,
      charging: this.attackState.charging,
      comboStep: this.attackState.comboStep,
    };
  }

  getMovementState() {
    return {
      context: this.movementState.context,
      mode: this.movementState.mode,
      target: this.movementState.target ? this.movementState.target.clone() : null,
    };
  }

  getChargeState() {
    return {
      value: this.attackState.chargeMeter,
      charging: this.attackState.charging,
    };
  }
}
