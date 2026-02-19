import { BaseScene } from "./baseScene.js";

const SKIP_HOLD_SECONDS = 1.2;
const TYPEWRITER_LEAD_SECONDS = 0.6;

const NARRATION = Object.freeze([
  "Before there were kingdoms, the world was only growth.",
  "Roots traded life in silence beneath the soil.",
  "When mankind learned fire, the lattice began to listen.",
  "It did not hate. It calculated.",
  "Civilizations rose and drank from the veins below.",
  "For a time, harmony and ambition wore the same face.",
  "Then extraction outpaced renewal.",
  "The Crown corrected, the way a body rejects a wound.",
  "Storms rose. Crops failed. Memory fractured.",
  "Survivors rebuilt without knowing what they had lost.",
  "Myth replaced history. History became warning.",
  "Centuries later, iron returned to the veins.",
  "Vaeloris called it progress.",
  "The world called it hunger.",
  "Beneath Thornmere, the lock weakened.",
  "The Hollow Scar pulsed like a buried heart.",
  "A blade was pulled from silence.",
  "Now the Crown watches again.",
  "Not to punish. To measure.",
  "You are not here to conquer.",
  "You are here to decide what deserves to continue.",
]);

const SLIDES = Object.freeze([
  {
    key: "origin-growth",
    lines: [NARRATION[0], NARRATION[1]],
    duration: 20,
    paletteTop: "#2d4638",
    paletteBottom: "#0a0f10",
    panX: 18,
    panY: -8,
    zoom: 0.12,
    layers: [
      { asset: "forest_canopy.png", y: 55, depth: 0.18, opacity: 0.92, scale: 4.2 },
      { asset: "root_lattice.png", y: 63, depth: 0.35, opacity: 0.86, scale: 3.9 },
      { asset: "crown_fractal.png", y: 47, depth: 0.5, opacity: 0.26, scale: 2.8 },
    ],
  },
  {
    key: "fire-listened",
    lines: [NARRATION[2], NARRATION[3]],
    duration: 20,
    paletteTop: "#3f3a2f",
    paletteBottom: "#0e0d0f",
    panX: -22,
    panY: -10,
    zoom: 0.14,
    layers: [
      { asset: "storm_shards.png", y: 31, depth: 0.2, opacity: 0.45, scale: 2.5 },
      { asset: "forest_canopy.png", y: 60, depth: 0.38, opacity: 0.78, scale: 3.8 },
      { asset: "root_lattice.png", y: 66, depth: 0.6, opacity: 0.88, scale: 3.5 },
    ],
  },
  {
    key: "city-rise",
    lines: [NARRATION[4], NARRATION[5]],
    duration: 20,
    paletteTop: "#37504b",
    paletteBottom: "#0b0f12",
    panX: 24,
    panY: -6,
    zoom: 0.16,
    layers: [
      { asset: "sylvan_city.png", y: 58, depth: 0.22, opacity: 0.8, scale: 3.8 },
      { asset: "forest_canopy.png", y: 67, depth: 0.4, opacity: 0.64, scale: 4.1 },
      { asset: "root_lattice.png", y: 70, depth: 0.65, opacity: 0.84, scale: 4.3 },
    ],
  },
  {
    key: "correction",
    lines: [NARRATION[6], NARRATION[7]],
    duration: 20,
    paletteTop: "#4a3a35",
    paletteBottom: "#0d0b0d",
    panX: -26,
    panY: -12,
    zoom: 0.12,
    layers: [
      { asset: "storm_shards.png", y: 34, depth: 0.2, opacity: 0.65, scale: 2.8 },
      { asset: "ruined_stone.png", y: 64, depth: 0.4, opacity: 0.75, scale: 3.9 },
      { asset: "crown_fractal.png", y: 48, depth: 0.62, opacity: 0.45, scale: 2.6 },
    ],
  },
  {
    key: "fracture",
    lines: [NARRATION[8], NARRATION[9], NARRATION[10]],
    duration: 20,
    paletteTop: "#3b4148",
    paletteBottom: "#0d1013",
    panX: 18,
    panY: -7,
    zoom: 0.1,
    layers: [
      { asset: "memory_ashes.png", y: 40, depth: 0.24, opacity: 0.5, scale: 2.9 },
      { asset: "ruined_stone.png", y: 64, depth: 0.42, opacity: 0.8, scale: 4.2 },
      { asset: "storm_shards.png", y: 31, depth: 0.68, opacity: 0.38, scale: 2.3 },
    ],
  },
  {
    key: "vaeloris-rise",
    lines: [NARRATION[11], NARRATION[12], NARRATION[13]],
    duration: 20,
    paletteTop: "#2d3f45",
    paletteBottom: "#0c0f12",
    panX: -28,
    panY: -8,
    zoom: 0.15,
    layers: [
      { asset: "vaeloris_smoke.png", y: 38, depth: 0.2, opacity: 0.55, scale: 2.6 },
      { asset: "vaeloris_towers.png", y: 59, depth: 0.42, opacity: 0.88, scale: 3.6 },
      { asset: "root_lattice.png", y: 69, depth: 0.7, opacity: 0.55, scale: 3.8 },
    ],
  },
  {
    key: "thornmere-lock",
    lines: [NARRATION[14], NARRATION[15]],
    duration: 20,
    paletteTop: "#374a43",
    paletteBottom: "#0a0f10",
    panX: 20,
    panY: -8,
    zoom: 0.12,
    layers: [
      { asset: "forest_canopy.png", y: 57, depth: 0.2, opacity: 0.85, scale: 4.2 },
      { asset: "hollow_scar.png", y: 66, depth: 0.45, opacity: 0.88, scale: 3.8 },
      { asset: "root_lattice.png", y: 70, depth: 0.7, opacity: 0.72, scale: 4.1 },
    ],
  },
  {
    key: "blade",
    lines: [NARRATION[16], NARRATION[17]],
    duration: 20,
    paletteTop: "#463f4d",
    paletteBottom: "#0d0b10",
    panX: -16,
    panY: -6,
    zoom: 0.14,
    layers: [
      { asset: "hollow_scar.png", y: 63, depth: 0.2, opacity: 0.76, scale: 3.8 },
      { asset: "blade_altar.png", y: 60, depth: 0.43, opacity: 0.9, scale: 2.8 },
      { asset: "storm_shards.png", y: 34, depth: 0.68, opacity: 0.45, scale: 2.4 },
    ],
  },
  {
    key: "measure",
    lines: [NARRATION[18], NARRATION[19]],
    duration: 20,
    paletteTop: "#2f3943",
    paletteBottom: "#090b0e",
    panX: 19,
    panY: -10,
    zoom: 0.12,
    layers: [
      { asset: "crown_fractal.png", y: 45, depth: 0.2, opacity: 0.54, scale: 2.5 },
      { asset: "ruined_stone.png", y: 67, depth: 0.45, opacity: 0.72, scale: 4.1 },
      { asset: "root_lattice.png", y: 72, depth: 0.74, opacity: 0.62, scale: 4.1 },
    ],
  },
  {
    key: "final-choice",
    lines: [NARRATION[20]],
    duration: 10,
    paletteTop: "#1d2329",
    paletteBottom: "#040507",
    panX: 8,
    panY: -2,
    zoom: 0.08,
    layers: [
      { asset: "crown_fractal.png", y: 48, depth: 0.3, opacity: 0.62, scale: 2.9 },
      { asset: "blade_altar.png", y: 63, depth: 0.55, opacity: 0.82, scale: 2.8 },
      { asset: "root_lattice.png", y: 71, depth: 0.8, opacity: 0.72, scale: 3.7 },
    ],
  },
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function createOverlay() {
  const root = document.createElement("div");
  root.dataset.testid = "prologue-root";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.zIndex = "13";
  root.style.pointerEvents = "none";
  root.style.overflow = "hidden";
  root.style.background = "linear-gradient(180deg, #2d4638 0%, #0a0f10 100%)";
  root.style.opacity = "0";

  const layerWrap = document.createElement("div");
  layerWrap.style.position = "absolute";
  layerWrap.style.inset = "0";
  root.appendChild(layerWrap);

  const layers = [];
  for (let i = 0; i < 3; i += 1) {
    const img = document.createElement("img");
    img.alt = "";
    img.draggable = false;
    img.style.position = "absolute";
    img.style.left = "50%";
    img.style.top = "50%";
    img.style.transform = "translate(-50%, -50%)";
    img.style.pointerEvents = "none";
    img.style.imageRendering = "pixelated";
    img.style.opacity = "0";
    img.style.willChange = "transform, opacity";
    layerWrap.appendChild(img);
    layers.push(img);
  }

  const text = document.createElement("div");
  text.dataset.testid = "prologue-text";
  text.style.position = "absolute";
  text.style.left = "50%";
  text.style.bottom = "12%";
  text.style.transform = "translateX(-50%)";
  text.style.width = "min(900px, 86vw)";
  text.style.textAlign = "center";
  text.style.color = "#eaf4e4";
  text.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  text.style.fontSize = "27px";
  text.style.lineHeight = "1.42";
  text.style.letterSpacing = "0.03em";
  text.style.textShadow = "0 2px 8px rgba(0, 0, 0, 0.78)";
  text.style.whiteSpace = "pre-line";
  text.style.opacity = "0";
  root.appendChild(text);

  const skip = document.createElement("div");
  skip.dataset.testid = "skip-indicator";
  skip.style.position = "absolute";
  skip.style.right = "14px";
  skip.style.bottom = "12px";
  skip.style.width = "190px";
  skip.style.padding = "7px";
  skip.style.border = "1px solid rgba(183, 210, 188, 0.56)";
  skip.style.background = "rgba(12, 16, 16, 0.56)";
  skip.style.color = "#dfe9db";
  skip.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  skip.style.fontSize = "11px";
  skip.style.textAlign = "left";
  skip.style.opacity = "0.8";
  const skipLabel = document.createElement("div");
  skipLabel.textContent = "Hold Space / Long-Press to skip";
  skipLabel.style.marginBottom = "5px";
  const skipBar = document.createElement("div");
  skipBar.style.height = "5px";
  skipBar.style.border = "1px solid rgba(168, 194, 171, 0.52)";
  skipBar.style.background = "rgba(18, 24, 20, 0.64)";
  const skipFill = document.createElement("div");
  skipFill.style.height = "100%";
  skipFill.style.width = "0%";
  skipFill.style.background = "linear-gradient(90deg, #90d49a, #e6f4bd)";
  skipFill.style.transition = "width 40ms linear";
  skipBar.appendChild(skipFill);
  skip.append(skipLabel, skipBar);
  root.appendChild(skip);

  const blackout = document.createElement("div");
  blackout.style.position = "absolute";
  blackout.style.inset = "0";
  blackout.style.pointerEvents = "none";
  blackout.style.background = "#000000";
  blackout.style.opacity = "0";
  root.appendChild(blackout);

  document.body.appendChild(root);
  return { root, layers, text, skipFill, blackout };
}

function buildSlideOffsets(slides) {
  const offsets = [];
  let cursor = 0;
  for (const slide of slides) {
    offsets.push(cursor);
    cursor += slide.duration;
  }
  return {
    offsets,
    totalDuration: cursor,
  };
}

function getSlideState(elapsedSeconds, offsets, slides) {
  let index = slides.length - 1;
  for (let i = 0; i < slides.length; i += 1) {
    const start = offsets[i];
    const end = start + slides[i].duration;
    if (elapsedSeconds < end) {
      index = i;
      break;
    }
  }
  const slide = slides[index];
  const start = offsets[index];
  const localElapsed = Math.max(0, elapsedSeconds - start);
  return {
    index,
    slide,
    localElapsed,
    progress: clamp01(localElapsed / slide.duration),
  };
}

export class MythicPrologueScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "prologue";
    this.displayName = "Mythic Prologue";
    this.regionId = "verdant-wilds";
    this.overlay = createOverlay();
    this.elapsedSeconds = 0;
    this.skipHolding = false;
    this.skipProgress = 0;
    this.completed = false;
    this.readyAction = null;
    this.currentSlideIndex = -1;
    this.currentSlideKey = "";

    const offsetData = buildSlideOffsets(SLIDES);
    this.slideOffsets = offsetData.offsets;
    this.totalDuration = offsetData.totalDuration;
  }

  _applySlideAssets(slide) {
    for (let i = 0; i < this.overlay.layers.length; i += 1) {
      const layer = this.overlay.layers[i];
      const layerConfig = slide.layers[i];
      if (!layerConfig) {
        layer.style.opacity = "0";
        continue;
      }
      layer.src = `./assets/sprites/cinematic/${layerConfig.asset}`;
      layer.dataset.asset = layerConfig.asset;
      layer.style.opacity = String(layerConfig.opacity ?? 1);
      layer.style.width = `${Math.round((layerConfig.scale ?? 3) * 100)}px`;
      layer.style.height = "auto";
    }
  }

  _completePrologue(reason = "completed") {
    if (this.completed) return;
    this.completed = true;
    this.skipHolding = false;
    this.skipProgress = 1;
    this.readyAction = { type: "prologue-complete", reason };
  }

  beginSkipHold() {
    if (this.completed) return;
    this.skipHolding = true;
  }

  endSkipHold() {
    this.skipHolding = false;
  }

  debugNextSlide() {
    if (this.completed) return false;
    if (this.currentSlideIndex >= SLIDES.length - 1) {
      this._completePrologue("debug-skip");
      return true;
    }
    const nextSlideStart = this.slideOffsets[this.currentSlideIndex + 1] ?? this.totalDuration;
    this.elapsedSeconds = Math.min(this.totalDuration, nextSlideStart + 0.01);
    return true;
  }

  handleKeyDown(event) {
    if (event.code === "Space") {
      this.beginSkipHold();
      return true;
    }
    if (event.code === "Enter" || event.code === "ArrowRight") {
      this.debugNextSlide();
      return true;
    }
    return false;
  }

  handleKeyUp(event) {
    if (event.code === "Space") {
      this.endSkipHold();
      return true;
    }
    return false;
  }

  handlePointerDown(_event) {
    this.beginSkipHold();
    return true;
  }

  handlePointerUp(_event) {
    this.endSkipHold();
    return true;
  }

  handlePointerCancel(_event) {
    this.endSkipHold();
    return true;
  }

  consumeAction() {
    const action = this.readyAction;
    this.readyAction = null;
    return action;
  }

  getUiState() {
    return {
      slideIndex: this.currentSlideIndex,
      slideKey: this.currentSlideKey,
      skipProgress: Number(this.skipProgress.toFixed(3)),
      completed: this.completed,
    };
  }

  getVisualConfig() {
    return {
      skyTint: "#1a1d22",
      lightTint: "#87929a",
      groundTint: "#1d2424",
      fogMultiplier: 1.48,
    };
  }

  update(dtSeconds) {
    super.update(dtSeconds);

    if (!this.completed) {
      this.elapsedSeconds += dtSeconds;
      if (this.skipHolding) {
        this.skipProgress = clamp01(this.skipProgress + dtSeconds / SKIP_HOLD_SECONDS);
      } else {
        this.skipProgress = clamp01(this.skipProgress - dtSeconds * 1.8);
      }
      if (this.skipProgress >= 1) {
        this._completePrologue("skip-hold");
      }
      if (this.elapsedSeconds >= this.totalDuration) {
        this._completePrologue("timeline-end");
      }
    }

    const sceneState = getSlideState(Math.min(this.elapsedSeconds, this.totalDuration), this.slideOffsets, SLIDES);
    this.currentSlideIndex = sceneState.index;
    this.currentSlideKey = sceneState.slide.key;

    if (this.currentSlideIndex !== Number(this.overlay.root.dataset.slideIndex ?? "-1")) {
      this.overlay.root.dataset.slideIndex = String(this.currentSlideIndex);
      this._applySlideAssets(sceneState.slide);
    }

    const overlayAlpha = clamp01(this.elapsedSeconds / 0.8);
    this.overlay.root.style.opacity = overlayAlpha.toFixed(3);

    const pulse = 0.15 + Math.sin(this.elapsedSeconds * 0.9) * 0.05;
    this.overlay.root.style.background = `linear-gradient(180deg, ${sceneState.slide.paletteTop} 0%, ${sceneState.slide.paletteBottom} 100%)`;

    for (let i = 0; i < this.overlay.layers.length; i += 1) {
      const layer = this.overlay.layers[i];
      const layerConfig = sceneState.slide.layers[i];
      if (!layerConfig) continue;
      const driftX = (sceneState.progress - 0.5) * sceneState.slide.panX * layerConfig.depth;
      const driftY = (sceneState.progress - 0.5) * sceneState.slide.panY * layerConfig.depth;
      const zoom = 1 + sceneState.slide.zoom * sceneState.progress * layerConfig.depth;
      const layerOpacity = (layerConfig.opacity ?? 1) * (0.92 + pulse * 0.4);
      layer.style.opacity = layerOpacity.toFixed(3);
      layer.style.transform = `translate(-50%, -50%) translate(${driftX.toFixed(2)}px, ${driftY.toFixed(
        2
      )}px) scale(${zoom.toFixed(3)})`;
      layer.style.top = `${layerConfig.y.toFixed(2)}%`;
    }

    const fullText = sceneState.slide.lines.join("\n");
    const revealProgress = clamp01(
      (sceneState.localElapsed - TYPEWRITER_LEAD_SECONDS) / Math.max(0.4, sceneState.slide.duration * 0.58)
    );
    const revealCount = Math.max(1, Math.floor(fullText.length * revealProgress));
    this.overlay.text.textContent = fullText.slice(0, revealCount);
    const fadeIn = clamp01(sceneState.localElapsed / 1.1);
    const fadeOut = clamp01((sceneState.slide.duration - sceneState.localElapsed) / 1.35);
    this.overlay.text.style.opacity = (fadeIn * fadeOut).toFixed(3);

    let blackoutOpacity = 0;
    if (sceneState.index === SLIDES.length - 1) {
      const tailSeconds = Math.max(0, sceneState.localElapsed - (sceneState.slide.duration - 2));
      blackoutOpacity = clamp01(tailSeconds / 2);
      this.overlay.text.textContent = fullText;
      this.overlay.text.style.opacity = (0.82 * (1 - blackoutOpacity * 0.86)).toFixed(3);
    }
    this.overlay.blackout.style.opacity = blackoutOpacity.toFixed(3);
    this.overlay.skipFill.style.width = `${(this.skipProgress * 100).toFixed(1)}%`;
  }

  dispose() {
    this.overlay.root.remove();
    super.dispose();
  }
}
