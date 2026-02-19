import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const WEAPON_ASSETS = Object.freeze({
  arthur_sword: "./assets/sprites/weapons/arthur_sword.png",
  elaine_staff: "./assets/sprites/weapons/elaine_staff.png",
  willow_wand: "./assets/sprites/weapons/willow_wand.png",
  pearl_glow: "./assets/sprites/vfx/pearl_glow.png",
});

const WILLOW_GEM_COLORS = Object.freeze({
  ruby: "#ff7568",
  emerald: "#62e39a",
  sapphire: "#73a8ff",
});

const ARTHUR_ATTACK_PROFILES = Object.freeze({
  light: Object.freeze({
    windupSeconds: 0.05,
    activeSeconds: 0.12,
    recoverySeconds: 0.15,
    travelRadians: 1.9,
    followThroughRadians: 0.22,
    idleScale: 0.94,
  }),
  charge: Object.freeze({
    windupSeconds: 0.08,
    activeSeconds: 0.18,
    recoverySeconds: 0.26,
    travelRadians: 2.9,
    followThroughRadians: 0.44,
    idleScale: 1.02,
  }),
});

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function applyPixelTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function normalizeFacing(facing = "down") {
  if (facing === "left" || facing === "right" || facing === "up" || facing === "down") {
    return facing;
  }
  return "down";
}

function normalizeWillowStance(stance = "ruby") {
  const value = String(stance ?? "").toLowerCase();
  if (value === "emerald" || value === "sapphire" || value === "ruby") {
    return value;
  }
  return "ruby";
}

export function getWillowGemColor(stance = "ruby") {
  return WILLOW_GEM_COLORS[normalizeWillowStance(stance)] ?? WILLOW_GEM_COLORS.ruby;
}

function drawSwordFallback(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#e6eef4";
  ctx.fillRect(11, 2, 2, 14);
  ctx.fillRect(10, 3, 1, 10);
  ctx.fillRect(13, 3, 1, 10);
  ctx.fillStyle = "#b5c7d2";
  ctx.fillRect(12, 3, 1, 10);
  ctx.fillStyle = "#6d7a86";
  ctx.fillRect(7, 15, 10, 2);
  ctx.fillStyle = "#8b5f3f";
  ctx.fillRect(11, 17, 2, 5);
  ctx.fillStyle = "#d5ba8f";
  ctx.fillRect(10, 22, 4, 2);
}

function drawStaffFallback(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#3b2d21";
  ctx.fillRect(11, 5, 2, 18);
  ctx.fillStyle = "#7f5d43";
  ctx.fillRect(10, 8, 1, 12);
  ctx.fillStyle = "#b28a6b";
  ctx.fillRect(13, 8, 1, 12);
  ctx.fillStyle = "#9fdcff";
  ctx.fillRect(10, 2, 4, 4);
  ctx.fillStyle = "#d2f3ff";
  ctx.fillRect(11, 3, 2, 2);
}

function drawWandFallback(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#3d2b1f";
  ctx.fillRect(11, 5, 2, 17);
  ctx.fillStyle = "#7f5d43";
  ctx.fillRect(10, 8, 1, 12);
  ctx.fillStyle = "#b28a6b";
  ctx.fillRect(13, 8, 1, 12);
  ctx.fillStyle = "#6ee8c9";
  ctx.fillRect(9, 1, 6, 6);
  ctx.fillStyle = "#dcfff4";
  ctx.fillRect(11, 3, 2, 2);
}

function drawPearlGlowFallback(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(136, 240, 255, 0.35)";
  ctx.fillRect(2, 2, 4, 4);
  ctx.fillStyle = "rgba(185, 255, 255, 0.75)";
  ctx.fillRect(3, 3, 2, 2);
  ctx.fillStyle = "#f8ffff";
  ctx.fillRect(4, 4, 1, 1);
}

export function createWeaponFallbackTexture(kind) {
  let width = 24;
  let height = 24;
  let drawFn = drawSwordFallback;
  if (kind === "elaine_staff") {
    drawFn = drawStaffFallback;
  }
  if (kind === "willow_wand") {
    drawFn = drawWandFallback;
  }
  if (kind === "pearl_glow") {
    width = 8;
    height = 8;
    drawFn = drawPearlGlowFallback;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, width, height);
  return applyPixelTextureSettings(new THREE.CanvasTexture(canvas));
}

function resolveArthurBasePose(facing) {
  switch (facing) {
    case "left":
      return { x: -0.35, y: 0.11, rotation: 2.76 };
    case "right":
      return { x: 0.34, y: 0.11, rotation: 0.34 };
    case "up":
      return { x: -0.27, y: 0.16, rotation: 2.14 };
    case "down":
    default:
      return { x: 0.31, y: 0.03, rotation: -0.72 };
  }
}

function resolveElaineBasePose(facing) {
  switch (facing) {
    case "left":
      return { x: -0.3, y: 0.12, rotation: 2.66 };
    case "right":
      return { x: 0.29, y: 0.12, rotation: 0.48 };
    case "up":
      return { x: -0.16, y: 0.18, rotation: 2.04 };
    case "down":
    default:
      return { x: 0.19, y: 0.06, rotation: -0.46 };
  }
}

export function getWeaponSprite(characterId, facing, animState = {}) {
  const characterRaw = String(characterId).toLowerCase();
  const character =
    characterRaw === "elaine" ? "elaine" : characterRaw === "willow" ? "willow" : "arthur";
  const normalizedFacing = normalizeFacing(facing);
  if (character === "elaine") {
    return {
      key: "elaine_staff",
      assetPath: WEAPON_ASSETS.elaine_staff,
      alphaTest: 0.08,
      facing: normalizedFacing,
      scale: 1,
      opacity: 0.98,
    };
  }
  if (character === "willow") {
    const stance = normalizeWillowStance(animState.willowStance);
    return {
      key: "willow_wand",
      assetPath: WEAPON_ASSETS.willow_wand,
      alphaTest: 0.08,
      facing: normalizedFacing,
      scale: 1,
      opacity: 0.98,
      color: getWillowGemColor(stance),
    };
  }
  return {
    key: "arthur_sword",
    assetPath: WEAPON_ASSETS.arthur_sword,
    alphaTest: 0.08,
    facing: normalizedFacing,
    scale: 1,
    opacity: 1,
  };
}

export function getWeaponOffset(characterId, facing, animState = {}) {
  const characterRaw = String(characterId).toLowerCase();
  const character =
    characterRaw === "elaine" ? "elaine" : characterRaw === "willow" ? "willow" : "arthur";
  const normalizedFacing = normalizeFacing(facing);
  const movementState = animState.movementState === "walk" ? "walk" : "idle";
  const walkTimer = Number(animState.walkTimer) || 0;
  const walkBob = movementState === "walk" ? Math.sin(walkTimer) * 0.03 : 0;
  if (character === "elaine") {
    const base = resolveElaineBasePose(normalizedFacing);
    const casting = Boolean(animState.castActive);
    let offsetX = base.x;
    let offsetY = base.y + walkBob;
    let rotation = base.rotation;
    let scale = 0.97;
    if (casting) {
      const castRatio = clamp01(Number(animState.castRatio) || 1);
      const castLift = 0.07 + castRatio * 0.04;
      offsetY += castLift;
      offsetX += normalizedFacing === "left" ? -0.02 : normalizedFacing === "right" ? 0.02 : 0.01;
      rotation += normalizedFacing === "left" || normalizedFacing === "up" ? -0.16 : 0.16;
      scale += 0.08 + castRatio * 0.06;
    }
    return {
      x: offsetX,
      y: offsetY,
      z: 0.03,
      rotation,
      scale,
      mounted: true,
    };
  }

  if (character === "willow") {
    const base = resolveElaineBasePose(normalizedFacing);
    const attackType = animState.attackType === "charge" ? "charge" : animState.attackType === "light" ? "light" : "";
    let offsetX = base.x + 0.01;
    let offsetY = base.y + walkBob;
    let rotation = base.rotation + 0.05;
    let scale = 0.9;
    if (attackType) {
      const attackElapsed = Math.max(0, Number(animState.attackElapsed) || 0);
      const attackDuration = Math.max(0.0001, Number(animState.attackDuration) || 0.34);
      const attackT = clamp01(attackElapsed / attackDuration);
      const directionSign = normalizedFacing === "left" || normalizedFacing === "up" ? -1 : 1;
      rotation += directionSign * (0.22 + attackT * 0.5);
      offsetX += directionSign * attackT * 0.04;
      offsetY += attackT * 0.06;
      scale += attackType === "charge" ? 0.14 : 0.08;
    }
    return {
      x: offsetX,
      y: offsetY,
      z: 0.03,
      rotation,
      scale,
      mounted: true,
    };
  }

  const base = resolveArthurBasePose(normalizedFacing);
  let offsetX = base.x;
  let offsetY = base.y + walkBob;
  let rotation = base.rotation;
  let scale = ARTHUR_ATTACK_PROFILES.light.idleScale;
  const attackType = animState.attackType === "charge" ? "charge" : animState.attackType === "light" ? "light" : "";
  if (attackType) {
    const profile = ARTHUR_ATTACK_PROFILES[attackType];
    const attackElapsed = Math.max(0, Number(animState.attackElapsed) || 0);
    const attackDuration =
      Number(animState.attackDuration) ||
      profile.windupSeconds + profile.activeSeconds + profile.recoverySeconds;
    const attackProgress = clamp01(attackElapsed / Math.max(0.0001, attackDuration));
    const directionSign = normalizedFacing === "left" || normalizedFacing === "up" ? -1 : 1;
    const windupRotation = base.rotation - directionSign * (attackType === "charge" ? 0.7 : 0.44);
    const slashRotation = windupRotation + directionSign * profile.travelRadians;
    const followThrough = slashRotation + directionSign * profile.followThroughRadians;

    const windupEnd = profile.windupSeconds;
    const activeEnd = windupEnd + profile.activeSeconds;
    const recoveryEnd = activeEnd + profile.recoverySeconds;
    if (attackElapsed <= windupEnd) {
      const t = clamp01(attackElapsed / Math.max(0.0001, profile.windupSeconds));
      rotation = windupRotation * t + base.rotation * (1 - t);
    } else if (attackElapsed <= activeEnd) {
      const t = clamp01((attackElapsed - windupEnd) / Math.max(0.0001, profile.activeSeconds));
      rotation = slashRotation * t + windupRotation * (1 - t);
    } else if (attackElapsed <= recoveryEnd) {
      const t = clamp01((attackElapsed - activeEnd) / Math.max(0.0001, profile.recoverySeconds));
      rotation = followThrough * (1 - t) + base.rotation * t;
    } else {
      rotation = followThrough;
    }

    offsetX += directionSign * attackProgress * (attackType === "charge" ? 0.12 : 0.06);
    offsetY += attackProgress * (attackType === "charge" ? 0.06 : 0.03);
    const chargeRatio = clamp01(Number(animState.attackChargeRatio) || 0);
    scale = profile.idleScale + (attackType === "charge" ? 0.16 + chargeRatio * 0.24 : 0.04);
  }

  return {
    x: offsetX,
    y: offsetY,
    z: 0.03,
    rotation,
    scale,
    mounted: true,
  };
}

export function getWeaponGlow(characterId, animState = {}) {
  const characterRaw = String(characterId).toLowerCase();
  const character =
    characterRaw === "elaine" ? "elaine" : characterRaw === "willow" ? "willow" : "arthur";
  if (character !== "elaine" && character !== "willow") {
    return {
      enabled: false,
      key: "pearl_glow",
      assetPath: WEAPON_ASSETS.pearl_glow,
      x: 0,
      y: 0,
      z: 0.04,
      scale: 0.3,
      opacity: 0,
    };
  }
  const facing = normalizeFacing(animState.facing ?? "down");
  const castActive = Boolean(animState.castActive) || Boolean(animState.attackType);
  const elapsedSeconds = Number(animState.elapsedSeconds) || 0;
  const willowStance = normalizeWillowStance(animState.willowStance);
  const pulse = 0.5 + 0.5 * Math.sin(elapsedSeconds * 7.2 + 0.4);
  const isWillow = character === "willow";
  const baseOpacity = castActive ? (isWillow ? 0.62 : 0.68) : isWillow ? 0.26 : 0.32;
  const pulseAmplitude = castActive ? (isWillow ? 0.24 : 0.26) : isWillow ? 0.14 : 0.1;
  const baseScale = castActive ? (isWillow ? 0.42 : 0.46) : isWillow ? 0.29 : 0.32;
  let x = 0.23;
  let y = 0.29;
  if (facing === "left") x = -0.23;
  if (facing === "up") {
    x = -0.09;
    y = 0.35;
  }
  if (facing === "down") {
    x = 0.12;
    y = 0.25;
  }
  return {
    enabled: true,
    key: "pearl_glow",
    assetPath: WEAPON_ASSETS.pearl_glow,
    color: isWillow ? getWillowGemColor(willowStance) : "#bff8ff",
    x,
    y,
    z: 0.04,
    scale: baseScale + pulse * (castActive ? 0.14 : 0.05),
    opacity: baseOpacity + pulse * pulseAmplitude,
  };
}
