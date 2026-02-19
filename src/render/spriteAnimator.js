import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const WALK_FRAME_SECONDS = 0.2;
const DEFAULT_ATTACK_SECONDS = 0.12;

const DIRECTION_TO_ROW = Object.freeze({
  down: 0,
  left: 1,
  right: 2,
  up: 3,
});

const STATE_TO_COLUMN = Object.freeze({
  idle: 0,
  walk1: 1,
  walk2: 2,
  attack: 3,
});

export function resolveDirectionFromVector(vector, fallback = "down") {
  if (!vector || vector.lengthSq() <= 1e-6) {
    return fallback;
  }

  if (Math.abs(vector.x) > Math.abs(vector.y)) {
    return vector.x >= 0 ? "right" : "left";
  }
  return vector.y >= 0 ? "down" : "up";
}

// SpriteAnimator maps movement/attack state into deterministic sprite-sheet UV frames.
export class SpriteAnimator {
  constructor({
    texture,
    frameWidth = 48,
    frameHeight = 64,
    columns = 4,
    rows = 4,
    initialDirection = "down",
  }) {
    this.texture = texture;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = columns;
    this.rows = rows;

    this.direction = DIRECTION_TO_ROW[initialDirection] !== undefined ? initialDirection : "down";
    this.requestedState = "idle";
    this.activeState = "idle";
    this.walkTimer = 0;
    this.attackRemaining = 0;
    this.lastFrame = { row: 0, column: 0, state: "idle", direction: this.direction };

    this.texture.repeat.set(1 / this.columns, 1 / this.rows);
    this.texture.needsUpdate = true;
    this._applyFrame();
  }

  setDirection(direction) {
    if (DIRECTION_TO_ROW[direction] === undefined) return;
    this.direction = direction;
  }

  setState(state) {
    if (state !== "idle" && state !== "walk" && state !== "attack") return;
    this.requestedState = state;
  }

  triggerAttack(durationSeconds = DEFAULT_ATTACK_SECONDS) {
    this.attackRemaining = Math.max(this.attackRemaining, durationSeconds);
    this.activeState = "attack";
    this._applyFrame();
  }

  _resolveWalkFrameColumn() {
    const phase = Math.floor(this.walkTimer / WALK_FRAME_SECONDS) % 2;
    return phase === 0 ? STATE_TO_COLUMN.walk1 : STATE_TO_COLUMN.walk2;
  }

  _applyFrame() {
    let column = STATE_TO_COLUMN.idle;
    let stateLabel = "idle";

    if (this.activeState === "attack") {
      column = STATE_TO_COLUMN.attack;
      stateLabel = "attack";
    } else if (this.activeState === "walk") {
      column = this._resolveWalkFrameColumn();
      stateLabel = column === STATE_TO_COLUMN.walk1 ? "walk1" : "walk2";
    }

    const row = DIRECTION_TO_ROW[this.direction] ?? DIRECTION_TO_ROW.down;
    const yFromBottom = this.rows - 1 - row;
    this.texture.offset.set(column / this.columns, yFromBottom / this.rows);

    this.lastFrame = {
      row,
      column,
      state: stateLabel,
      direction: this.direction,
    };
  }

  update(dtSeconds) {
    this.attackRemaining = Math.max(0, this.attackRemaining - dtSeconds);
    if (this.attackRemaining > 0) {
      this.activeState = "attack";
    } else {
      this.activeState = this.requestedState;
    }

    if (this.activeState === "walk") {
      this.walkTimer += dtSeconds;
    } else {
      this.walkTimer = 0;
    }

    this._applyFrame();
    return {
      ...this.lastFrame,
      u: this.texture.offset.x,
      v: this.texture.offset.y,
      uSize: this.texture.repeat.x,
      vSize: this.texture.repeat.y,
    };
  }

  getFrameData() {
    return { ...this.lastFrame };
  }
}
