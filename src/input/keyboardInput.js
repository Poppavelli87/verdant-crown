import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// KeyboardInput normalizes PC movement intent into a single 2D direction vector.
export class KeyboardInput {
  constructor(eventTarget = window) {
    this.eventTarget = eventTarget;
    this._pressed = new Set();
    this._moveVector = new THREE.Vector2();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    this.eventTarget.addEventListener("keydown", this._onKeyDown);
    this.eventTarget.addEventListener("keyup", this._onKeyUp);
  }

  _onKeyDown(event) {
    if (this._isEditableContext(event.target)) return;
    this._pressed.add(event.code);

    // Keep movement keys from scrolling the page in browser contexts.
    if (this._isMovementCode(event.code)) {
      event.preventDefault();
    }
  }

  _onKeyUp(event) {
    if (this._isEditableContext(event.target)) return;
    this._pressed.delete(event.code);

    if (this._isMovementCode(event.code)) {
      event.preventDefault();
    }
  }

  _isMovementCode(code) {
    return (
      code === "KeyW" ||
      code === "KeyA" ||
      code === "KeyS" ||
      code === "KeyD" ||
      code === "ArrowUp" ||
      code === "ArrowDown" ||
      code === "ArrowLeft" ||
      code === "ArrowRight"
    );
  }

  _isEditableContext(target) {
    const element = target instanceof HTMLElement ? target : document.activeElement;
    if (!(element instanceof HTMLElement)) return false;
    return (
      element.isContentEditable ||
      element.tagName === "INPUT" ||
      element.tagName === "TEXTAREA" ||
      element.tagName === "SELECT"
    );
  }

  getDesiredMoveVector() {
    let x = 0;
    let y = 0;

    if (this._pressed.has("KeyW") || this._pressed.has("ArrowUp")) y -= 1;
    if (this._pressed.has("KeyS") || this._pressed.has("ArrowDown")) y += 1;
    if (this._pressed.has("KeyA") || this._pressed.has("ArrowLeft")) x -= 1;
    if (this._pressed.has("KeyD") || this._pressed.has("ArrowRight")) x += 1;

    this._moveVector.set(x, y);
    if (this._moveVector.lengthSq() > 0) {
      this._moveVector.normalize();
    }

    return this._moveVector.clone();
  }

  isRunPressed() {
    return this._pressed.has("ShiftLeft") || this._pressed.has("ShiftRight");
  }

  destroy() {
    this.eventTarget.removeEventListener("keydown", this._onKeyDown);
    this.eventTarget.removeEventListener("keyup", this._onKeyUp);
  }
}
