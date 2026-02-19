import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// InputManager is the cross-platform bridge to controller-friendly intent.
export class InputManager {
  constructor({ keyboardInput, touchInput }) {
    this.keyboardInput = keyboardInput;
    this.touchInput = touchInput;
  }

  getState() {
    const desiredMoveVector = this.keyboardInput.getDesiredMoveVector();
    const hasKeyboardVector = desiredMoveVector.lengthSq() > 0;

    // Keyboard vector wins over a stale touch target for predictable PC control.
    if (hasKeyboardVector) {
      this.touchInput.clearMoveTarget();
    }

    return {
      desiredMoveVector: hasKeyboardVector ? desiredMoveVector : new THREE.Vector2(0, 0),
      desiredMoveTarget: hasKeyboardVector ? null : this.touchInput.getMoveTarget(),
      wantsRun: hasKeyboardVector && this.keyboardInput.isRunPressed(),
      clearTarget: () => this.touchInput.clearMoveTarget(),
    };
  }

  clearTouchTarget() {
    this.touchInput.clearMoveTarget();
  }

  destroy() {
    this.keyboardInput.destroy();
    this.touchInput.destroy();
  }
}
