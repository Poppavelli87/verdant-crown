import { GAME_VERSION } from "../config/version.js";
import { BaseScene } from "./baseScene.js";

const MENU_ITEMS = ["new-game", "continue", "reset"];
const START_PARTICLE_COUNT = 20;
const EXIT_SECONDS = 0.45;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function createButton(label, testId) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.testid = testId;
  button.textContent = label;
  button.style.display = "block";
  button.style.width = "210px";
  button.style.padding = "9px 10px";
  button.style.margin = "8px auto 0";
  button.style.border = "1px solid rgba(186, 218, 175, 0.58)";
  button.style.background = "rgba(17, 26, 22, 0.78)";
  button.style.color = "#e8f3e1";
  button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  button.style.fontSize = "14px";
  button.style.letterSpacing = "0.04em";
  button.style.cursor = "pointer";
  button.style.pointerEvents = "auto";
  button.style.transition = "background 120ms linear, border-color 120ms linear, opacity 120ms linear";
  return button;
}

function createOverlay() {
  const root = document.createElement("div");
  root.dataset.testid = "start-screen";
  root.setAttribute("data-legacy-scene", "title-screen");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.zIndex = "13";
  root.style.pointerEvents = "auto";
  root.style.background =
    "radial-gradient(circle at 50% 45%, rgba(55, 85, 63, 0.34), rgba(7, 10, 12, 0.92) 72%, rgba(2, 3, 6, 0.98) 100%)";
  root.style.opacity = "0";
  root.style.transition = "opacity 260ms linear";

  const pulse = document.createElement("div");
  pulse.style.position = "absolute";
  pulse.style.inset = "0";
  pulse.style.pointerEvents = "none";
  pulse.style.opacity = "0.13";
  pulse.style.background =
    "radial-gradient(circle at 52% 56%, rgba(132, 202, 143, 0.44), rgba(36, 60, 45, 0.1) 58%, rgba(0, 0, 0, 0) 100%)";
  root.appendChild(pulse);

  const particleLayer = document.createElement("div");
  particleLayer.style.position = "absolute";
  particleLayer.style.inset = "0";
  particleLayer.style.overflow = "hidden";
  particleLayer.style.pointerEvents = "none";
  root.appendChild(particleLayer);

  const center = document.createElement("div");
  center.style.position = "absolute";
  center.style.left = "50%";
  center.style.top = "50%";
  center.style.transform = "translate(-50%, -50%)";
  center.style.textAlign = "center";
  center.style.color = "#e9f4e8";
  center.style.textShadow = "0 2px 8px rgba(0, 0, 0, 0.7)";
  center.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  center.style.letterSpacing = "0.08em";
  root.appendChild(center);

  const title = document.createElement("div");
  title.dataset.testid = "menu-title";
  title.textContent = "VERDANT CROWN";
  title.style.fontSize = "56px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1";
  center.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.textContent = "Echoes of the Verdant Crown";
  subtitle.style.marginTop = "12px";
  subtitle.style.fontSize = "18px";
  subtitle.style.opacity = "0.8";
  subtitle.style.letterSpacing = "0.04em";
  center.appendChild(subtitle);

  const menuWrap = document.createElement("div");
  menuWrap.style.marginTop = "26px";
  center.appendChild(menuWrap);

  const newGame = createButton("New Game", "menu-new-game");
  const cont = createButton("Continue", "menu-continue");
  const reset = createButton("Reset Save", "menu-reset");
  menuWrap.append(newGame, cont, reset);

  const prompt = document.createElement("div");
  prompt.style.marginTop = "16px";
  prompt.style.fontSize = "12px";
  prompt.style.opacity = "0.72";
  prompt.textContent = "W/S or Arrow Keys + Enter";
  center.appendChild(prompt);

  const ngPlusHint = document.createElement("div");
  ngPlusHint.dataset.testid = "menu-ngplus-hint";
  ngPlusHint.style.marginTop = "10px";
  ngPlusHint.style.fontSize = "11px";
  ngPlusHint.style.opacity = "0.86";
  ngPlusHint.style.color = "#d9edff";
  ngPlusHint.style.display = "none";
  ngPlusHint.textContent = "New Game+ unlocked";
  center.appendChild(ngPlusHint);

  const version = document.createElement("div");
  version.dataset.testid = "menu-version";
  version.style.position = "absolute";
  version.style.left = "10px";
  version.style.bottom = "8px";
  version.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  version.style.fontSize = "11px";
  version.style.opacity = "0.55";
  version.style.color = "#d7dfd1";
  version.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.65)";
  version.textContent = `v${GAME_VERSION}`;
  root.appendChild(version);

  const confirm = document.createElement("div");
  confirm.style.display = "none";
  confirm.style.position = "absolute";
  confirm.style.left = "50%";
  confirm.style.top = "50%";
  confirm.style.transform = "translate(-50%, -50%)";
  confirm.style.width = "280px";
  confirm.style.padding = "14px 14px 12px";
  confirm.style.border = "1px solid rgba(220, 181, 181, 0.75)";
  confirm.style.background = "rgba(18, 9, 9, 0.9)";
  confirm.style.color = "#f9e0df";
  confirm.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  confirm.style.textAlign = "center";
  confirm.style.pointerEvents = "auto";
  confirm.style.zIndex = "2";
  const confirmText = document.createElement("div");
  confirmText.textContent = "Clear all save data?";
  confirmText.style.fontSize = "14px";
  confirmText.style.marginBottom = "10px";
  const confirmHint = document.createElement("div");
  confirmHint.style.fontSize = "11px";
  confirmHint.style.opacity = "0.75";
  confirmHint.style.marginBottom = "12px";
  confirmHint.textContent = "This cannot be undone.";
  const confirmButtons = document.createElement("div");
  confirmButtons.style.display = "flex";
  confirmButtons.style.gap = "8px";
  confirmButtons.style.justifyContent = "center";
  const confirmYes = createButton("Yes", "menu-reset-yes");
  const confirmNo = createButton("Cancel", "menu-reset-cancel");
  confirmYes.style.margin = "0";
  confirmNo.style.margin = "0";
  confirmYes.style.width = "110px";
  confirmNo.style.width = "110px";
  confirmButtons.append(confirmYes, confirmNo);
  confirm.append(confirmText, confirmHint, confirmButtons);
  root.appendChild(confirm);

  document.body.appendChild(root);
  return {
    root,
    pulse,
    particleLayer,
    ngPlusHint,
    buttons: { newGame, cont, reset },
    confirm,
    confirmButtons: { yes: confirmYes, no: confirmNo },
  };
}

function createParticles(layer, rng) {
  const particles = [];
  for (let i = 0; i < START_PARTICLE_COUNT; i += 1) {
    const dot = document.createElement("div");
    dot.style.position = "absolute";
    dot.style.width = "2px";
    dot.style.height = "2px";
    dot.style.borderRadius = "999px";
    dot.style.background = "rgba(188, 242, 194, 0.7)";
    dot.style.boxShadow = "0 0 8px rgba(172, 232, 180, 0.45)";
    layer.appendChild(dot);

    const seedX = (rng.nextInt(1000) + 0.5) / 1000;
    const seedY = (rng.nextInt(1000) + 0.5) / 1000;
    const driftX = ((rng.nextInt(1000) + 0.5) / 1000 - 0.5) * 0.075;
    const driftY = ((rng.nextInt(1000) + 0.5) / 1000 - 0.5) * 0.075;
    const speed = 0.03 + ((rng.nextInt(1000) + 0.5) / 1000) * 0.08;
    const phase = ((rng.nextInt(1000) + 0.5) / 1000) * Math.PI * 2;
    particles.push({
      dot,
      seedX,
      seedY,
      driftX,
      driftY,
      speed,
      phase,
    });
  }
  return particles;
}

export class StartScreenScene extends BaseScene {
  constructor(context) {
    super(context);
    this.id = "start";
    this.displayName = "Start Screen";
    this.regionId = "verdant-wilds";
    this.elapsedSeconds = 0;
    this.exitRemaining = 0;
    this.pendingAction = null;
    this.readyAction = null;
    this.confirmResetOpen = false;
    this.confirmSelection = 1;

    this.overlay = createOverlay();
    this.particles = createParticles(this.overlay.particleLayer, context.rng);
    this.selectedIndex = 0;
    this.hasContinue = this.saveState?.hasPersistedSave?.() ?? false;
    this.ngPlusUnlocked = Boolean(this.saveState?.getStoryFlag?.("ngplus_unlocked") ?? this.saveState?.getFlag?.("story.ngplus_unlocked"));

    this._bindButtons();
    this._syncButtonStates();
    this._syncNgPlusState();
  }

  _bindButtons() {
    this.overlay.buttons.newGame.addEventListener("click", () => this._activateMenuItem("new-game"));
    this.overlay.buttons.cont.addEventListener("click", () => this._activateMenuItem("continue"));
    this.overlay.buttons.reset.addEventListener("click", () => this._activateMenuItem("reset"));
    this.overlay.confirmButtons.yes.addEventListener("click", () => this._confirmReset(true));
    this.overlay.confirmButtons.no.addEventListener("click", () => this._confirmReset(false));
  }

  _selectNext(step) {
    let next = this.selectedIndex;
    for (let i = 0; i < MENU_ITEMS.length; i += 1) {
      next = (next + step + MENU_ITEMS.length) % MENU_ITEMS.length;
      const id = MENU_ITEMS[next];
      if (id !== "continue" || this.hasContinue) {
        this.selectedIndex = next;
        this._syncButtonStates();
        return;
      }
    }
  }

  _syncButtonStates() {
    const entries = [
      [MENU_ITEMS[0], this.overlay.buttons.newGame],
      [MENU_ITEMS[1], this.overlay.buttons.cont],
      [MENU_ITEMS[2], this.overlay.buttons.reset],
    ];

    for (let i = 0; i < entries.length; i += 1) {
      const [id, button] = entries[i];
      const disabled = id === "continue" && !this.hasContinue;
      button.disabled = disabled;
      button.style.opacity = disabled ? "0.45" : "1";
      const selected = i === this.selectedIndex && !this.confirmResetOpen;
      button.style.background = selected ? "rgba(76, 121, 87, 0.86)" : "rgba(17, 26, 22, 0.78)";
      button.style.borderColor = selected ? "rgba(230, 247, 214, 0.9)" : "rgba(186, 218, 175, 0.58)";
    }

    this.overlay.confirm.style.display = this.confirmResetOpen ? "block" : "none";
    this.overlay.confirmButtons.yes.style.background =
      this.confirmResetOpen && this.confirmSelection === 0 ? "rgba(118, 57, 57, 0.9)" : "rgba(30, 14, 14, 0.86)";
    this.overlay.confirmButtons.no.style.background =
      this.confirmResetOpen && this.confirmSelection === 1 ? "rgba(49, 83, 52, 0.9)" : "rgba(16, 24, 17, 0.82)";
  }

  _syncNgPlusState() {
    if (!this.overlay?.ngPlusHint) return;
    this.overlay.ngPlusHint.style.display = this.ngPlusUnlocked ? "block" : "none";
  }

  _beginExit(action) {
    if (this.exitRemaining > 0) return false;
    this.pendingAction = action;
    this.exitRemaining = EXIT_SECONDS;
    return true;
  }

  _confirmReset(confirmed) {
    if (!this.confirmResetOpen) return;
    if (confirmed) {
      this.saveState?.clear?.();
      this.hasContinue = false;
      this.ngPlusUnlocked = false;
    }
    this.confirmResetOpen = false;
    this.confirmSelection = 1;
    this.selectedIndex = 0;
    this._syncButtonStates();
    this._syncNgPlusState();
  }

  _activateMenuItem(itemId = MENU_ITEMS[this.selectedIndex]) {
    if (this.confirmResetOpen) return false;
    if (itemId === "continue" && !this.hasContinue) return false;
    if (itemId === "reset") {
      this.confirmResetOpen = true;
      this.confirmSelection = 1;
      this._syncButtonStates();
      return true;
    }
    return this._beginExit(itemId === "new-game" ? "new-game" : "continue");
  }

  requestStart() {
    if (this.confirmResetOpen) {
      this._confirmReset(this.confirmSelection === 0);
      return true;
    }
    return this._activateMenuItem();
  }

  handleKeyDown(event) {
    if (this.exitRemaining > 0) return true;

    if (this.confirmResetOpen) {
      if (event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "KeyW") {
        this.confirmSelection = 0;
        this._syncButtonStates();
        return true;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD" || event.code === "KeyS") {
        this.confirmSelection = 1;
        this._syncButtonStates();
        return true;
      }
      if (event.code === "Escape") {
        this._confirmReset(false);
        return true;
      }
      if (event.code === "Enter" || event.code === "Space") {
        this._confirmReset(this.confirmSelection === 0);
        return true;
      }
      return false;
    }

    if (event.code === "ArrowUp" || event.code === "KeyW") {
      this._selectNext(-1);
      return true;
    }
    if (event.code === "ArrowDown" || event.code === "KeyS") {
      this._selectNext(1);
      return true;
    }
    if (event.code === "Enter" || event.code === "Space") {
      this.requestStart();
      return true;
    }
    return false;
  }

  consumeAction() {
    const action = this.readyAction;
    this.readyAction = null;
    return action;
  }

  getUiState() {
    return {
      continueEnabled: this.hasContinue,
      selectedMenuItem: MENU_ITEMS[this.selectedIndex],
      confirmResetOpen: this.confirmResetOpen,
    };
  }

  getVisualConfig() {
    return {
      skyTint: "#343b3d",
      lightTint: "#b6c4bb",
      groundTint: "#2a3429",
      fogMultiplier: 1.55,
    };
  }

  update(dtSeconds) {
    super.update(dtSeconds);
    this.elapsedSeconds += dtSeconds;
    const nextNgPlus = Boolean(this.saveState?.getStoryFlag?.("ngplus_unlocked") ?? this.saveState?.getFlag?.("story.ngplus_unlocked"));
    if (nextNgPlus !== this.ngPlusUnlocked) {
      this.ngPlusUnlocked = nextNgPlus;
      this._syncNgPlusState();
    }

    const fadeIn = clamp01(this.elapsedSeconds / 0.8);
    let alpha = fadeIn;
    if (this.exitRemaining > 0) {
      this.exitRemaining = Math.max(0, this.exitRemaining - dtSeconds);
      alpha *= clamp01(this.exitRemaining / EXIT_SECONDS);
      if (this.exitRemaining <= 0 && this.pendingAction) {
        this.readyAction = this.pendingAction;
        this.pendingAction = null;
      }
    }
    this.overlay.root.style.opacity = alpha.toFixed(3);
    this.overlay.pulse.style.opacity = (0.08 + Math.sin(this.elapsedSeconds * 1.1) * 0.04).toFixed(3);

    for (const particle of this.particles) {
      const x = (((particle.seedX + this.elapsedSeconds * particle.driftX) % 1) + 1) % 1;
      const y =
        (((particle.seedY - this.elapsedSeconds * particle.speed + Math.sin(this.elapsedSeconds * 0.75 + particle.phase) * particle.driftY) %
          1) +
          1) %
        1;
      particle.dot.style.left = `${(x * 100).toFixed(3)}%`;
      particle.dot.style.top = `${(y * 100).toFixed(3)}%`;
      particle.dot.style.opacity = (0.34 + Math.sin(this.elapsedSeconds * 1.5 + particle.phase) * 0.2).toFixed(3);
    }
  }

  dispose() {
    for (const particle of this.particles) {
      particle.dot.remove();
    }
    this.particles.length = 0;
    this.overlay.root.remove();
    super.dispose();
  }
}
