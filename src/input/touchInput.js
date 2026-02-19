import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// TouchInput converts pointer taps on the canvas into a world-space move target.
export class TouchInput {
  constructor(
    canvas,
    {
      screenToWorld,
      getPlayerPosition,
      onTapRipple,
      onWorldTap,
      tapMoveLimitPx = 14,
      tapStopRadius = 0.42,
    }
  ) {
    this.canvas = canvas;
    this.screenToWorld = screenToWorld;
    this.getPlayerPosition = getPlayerPosition;
    this.onTapRipple = onTapRipple;
    this.onWorldTap = onWorldTap;
    this.tapMoveLimitPx = tapMoveLimitPx;
    this.tapStopRadius = tapStopRadius;

    this._pendingPointer = null;
    this._moveTarget = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);

    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    this.canvas.addEventListener("pointerup", this._onPointerUp);
    this.canvas.addEventListener("pointercancel", this._onPointerCancel);
  }

  _onPointerDown(event) {
    if (event.button !== 0) return;

    this._pendingPointer = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      timeStamp: event.timeStamp,
    };
  }

  _onPointerUp(event) {
    if (!this._pendingPointer) return;
    if (event.pointerId !== this._pendingPointer.pointerId) return;

    const dx = event.clientX - this._pendingPointer.clientX;
    const dy = event.clientY - this._pendingPointer.clientY;
    const travel = Math.hypot(dx, dy);
    const elapsed = Math.max(0, event.timeStamp - this._pendingPointer.timeStamp);
    this._pendingPointer = null;

    // Treat short, low-delta pointer sequences as intentional taps.
    if (travel > this.tapMoveLimitPx || elapsed > 600) return;

    const worldPoint = this.screenToWorld(event.clientX, event.clientY);
    if (!worldPoint) return;

    const tapOutcome = this.onWorldTap?.({
      worldPoint,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
    });
    if (tapOutcome?.consumed) {
      if (tapOutcome.clearTarget) {
        this._moveTarget = null;
      }
      if (tapOutcome.target) {
        this._moveTarget = tapOutcome.target.clone();
      }
      this.onTapRipple?.(event.clientX, event.clientY);
      return;
    }

    const playerPosition = this.getPlayerPosition();
    const playerDistance = Math.hypot(worldPoint.x - playerPosition.x, worldPoint.y - playerPosition.y);

    if (playerDistance <= this.tapStopRadius) {
      this._moveTarget = null;
    } else {
      this._moveTarget = new THREE.Vector2(worldPoint.x, worldPoint.y);
    }

    this.onTapRipple?.(event.clientX, event.clientY);
  }

  _onPointerCancel(event) {
    if (this._pendingPointer && this._pendingPointer.pointerId === event.pointerId) {
      this._pendingPointer = null;
    }
  }

  getMoveTarget() {
    return this._moveTarget ? this._moveTarget.clone() : null;
  }

  clearMoveTarget() {
    this._moveTarget = null;
  }

  setMoveTarget(target) {
    if (!target) {
      this._moveTarget = null;
      return;
    }
    this._moveTarget = new THREE.Vector2(target.x, target.y);
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    this.canvas.removeEventListener("pointerup", this._onPointerUp);
    this.canvas.removeEventListener("pointercancel", this._onPointerCancel);
  }
}
