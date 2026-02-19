import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const AUTOMATED_TEST_MODE = typeof navigator !== "undefined" && Boolean(navigator.webdriver);

function applyNearestTextureSettings(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function disposeMaterial(material) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry?.dispose?.();
    }
  } else {
    material.dispose?.();
  }
}

function hashString(value = "") {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createAutomatedFallbackTexture(assetPath = "", width = 32, height = 48) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const hash = hashString(assetPath);
  const bodyPalette = ["#4f6f43", "#5a7b4d", "#47625d", "#6f6a42", "#5f556f"];
  const accentPalette = ["#8fbc75", "#9fd68b", "#8bb7aa", "#c2be7e", "#b1a6d6"];
  const body = bodyPalette[hash % bodyPalette.length];
  const accent = accentPalette[(hash >>> 3) % accentPalette.length];
  const notch = (hash >>> 5) % 5;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
  ctx.fillRect(6, height - 6, width - 12, 4);
  ctx.fillStyle = body;
  ctx.fillRect(6, 8, width - 12, height - 14);
  ctx.fillStyle = accent;
  ctx.fillRect(8, 11, width - 16, 3);
  ctx.fillRect(10 + notch, 18, width - 20, 2);
  ctx.fillRect(8 + ((hash >>> 8) % 4), 24, width - 18, 2);
  ctx.fillStyle = "#101810";
  ctx.fillRect(5, 8, 1, height - 14);
  ctx.fillRect(width - 6, 8, 1, height - 14);
  ctx.fillRect(6, 7, width - 12, 1);

  return applyNearestTextureSettings(new THREE.CanvasTexture(canvas));
}

export function resolveDepthOrder(worldZ, baseOrder = 1100) {
  return baseOrder + Math.floor((worldZ + 40) * 100);
}

// BillboardSprite keeps a transparent sprite plane facing camera with Y-axis lock only.
export class BillboardSprite {
  constructor({
    root,
    assetPath,
    fallbackTexture,
    width = 1,
    height = 1,
    position,
    groundY = -0.9,
    yOffset = 0,
    swayAmount = 0,
    swaySpeed = 1,
    swayPhase = 0,
    depthBaseOrder = 1100,
    alphaTest = 0.1,
    opacity = 1,
    tint = "#ffffff",
  }) {
    this.root = root;
    this.assetPath = assetPath;
    this.position2D = position.clone();
    this.groundY = groundY;
    this.yOffset = yOffset;
    this.swayAmount = swayAmount;
    this.swaySpeed = swaySpeed;
    this.swayPhase = swayPhase;
    this.depthBaseOrder = depthBaseOrder;
    this.baseOpacity = opacity;

    this._disposed = false;
    const generatedFallback =
      AUTOMATED_TEST_MODE && !fallbackTexture ? createAutomatedFallbackTexture(this.assetPath) : null;
    this._ownsFallbackTexture = Boolean(fallbackTexture || generatedFallback);
    this._fallbackTexture = fallbackTexture ?? generatedFallback ?? null;
    this._texture = this._fallbackTexture;

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: this._texture,
        color: tint,
        transparent: true,
        opacity: this.baseOpacity,
        alphaTest,
        depthWrite: false,
      })
    );
    this.mesh.userData.billboard = this;
    this.mesh.userData.depthSort = true;
    this.mesh.position.set(this.position2D.x, this.groundY + height * 0.5 + this.yOffset, this.position2D.y);
    this.mesh.renderOrder = resolveDepthOrder(this.position2D.y, this.depthBaseOrder);
    this.root.add(this.mesh);

    this._loadTextureFromAsset();
  }

  _loadTextureFromAsset() {
    if (!this.assetPath) return;
    if (AUTOMATED_TEST_MODE) return;
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (this._disposed) return;
      const texture = applyNearestTextureSettings(new THREE.Texture(image));
      this._texture = texture;
      this.mesh.material.map = texture;
      this.mesh.material.needsUpdate = true;
    };
    image.onerror = () => {};
    image.src = this.assetPath;
  }

  setOpacity(opacity) {
    this.mesh.material.opacity = this.baseOpacity * opacity;
  }

  update(dtSeconds, elapsedSeconds, camera, foliageMotionIntensity = 1) {
    if (this._disposed) return;

    // Y-axis locked billboarding.
    this.mesh.lookAt(camera.position.x, this.mesh.position.y, camera.position.z);

    if (this.swayAmount > 0) {
      const sway = Math.sin(elapsedSeconds * this.swaySpeed + this.swayPhase) * this.swayAmount * foliageMotionIntensity;
      this.mesh.rotation.z = sway;
    } else {
      this.mesh.rotation.z = 0;
    }

    this.mesh.renderOrder = resolveDepthOrder(this.position2D.y, this.depthBaseOrder);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;

    if (this.mesh.parent === this.root) {
      this.root.remove(this.mesh);
    }

    this.mesh.geometry?.dispose?.();
    disposeMaterial(this.mesh.material);
    if (this._texture && this._texture !== this._fallbackTexture) {
      this._texture.dispose?.();
    }
    if (this._ownsFallbackTexture && this._fallbackTexture) {
      this._fallbackTexture.dispose?.();
    }
  }
}

export function createPixelBillboardFallbackTexture(drawFn, width = 32, height = 48) {
  const spriteCanvas = document.createElement("canvas");
  spriteCanvas.width = width;
  spriteCanvas.height = height;
  const ctx = spriteCanvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  drawFn(ctx, width, height);
  return applyNearestTextureSettings(new THREE.CanvasTexture(spriteCanvas));
}
