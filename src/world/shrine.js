import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { BillboardSprite, createPixelBillboardFallbackTexture, resolveDepthOrder } from "../render/billboard.js";

const SHRINE_SCENE_ID = "thornmere";
const SHRINE_POSITION = new THREE.Vector2(-1.95, -0.55);
const SHRINE_INTERACT_RADIUS = 1.05;
const UPGRADE_DEFINITIONS = Object.freeze([
  { id: "maxHpLevel", testId: "shrine-upgrade-hp", label: "+20 Max HP", cost: 4, currency: "motes" },
  { id: "chargeSpeedLevel", testId: "shrine-upgrade-charge", label: "+10% Charge Speed", cost: 4, currency: "motes" },
  { id: "moveSpeedLevel", testId: "shrine-upgrade-move", label: "+5% Movement Speed", cost: 3, currency: "motes" },
  {
    id: "relicAttunementLevel",
    testId: "shrine-upgrade-attunement",
    label: "Relic Attunement",
    cost: 1,
    currency: "shards",
    unlockFlag: "vein_guardian_defeated",
  },
]);

function createShrineFallbackTexture() {
  return createPixelBillboardFallbackTexture((ctx) => {
    ctx.clearRect(0, 0, 32, 48);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(8, 44, 16, 3);
    ctx.fillStyle = "#18231b";
    ctx.fillRect(10, 20, 12, 20);
    ctx.fillStyle = "#4d6452";
    ctx.fillRect(11, 22, 10, 16);
    ctx.fillStyle = "#7ea089";
    ctx.fillRect(13, 24, 6, 12);
    ctx.fillStyle = "#9ce3a6";
    ctx.fillRect(14, 15, 4, 5);
    ctx.fillStyle = "#c8ffd1";
    ctx.fillRect(15, 13, 2, 2);
  }, 32, 48);
}

function createButton(label, testId) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.testid = testId;
  button.style.display = "block";
  button.style.width = "100%";
  button.style.marginTop = "6px";
  button.style.padding = "7px 9px";
  button.style.border = "1px solid rgba(152, 214, 164, 0.65)";
  button.style.background = "rgba(19, 31, 24, 0.86)";
  button.style.color = "#e7f4e5";
  button.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  button.style.fontSize = "12px";
  button.style.cursor = "pointer";
  button.style.pointerEvents = "auto";
  return button;
}

function createShrineUi() {
  const root = document.createElement("div");
  root.dataset.testid = "shrine-ui";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "26px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(320px, 92vw)";
  root.style.padding = "10px";
  root.style.background = "rgba(14, 19, 16, 0.93)";
  root.style.border = "2px solid rgba(138, 206, 147, 0.76)";
  root.style.boxShadow = "0 0 0 2px rgba(19, 34, 24, 0.95) inset";
  root.style.zIndex = "31";
  root.style.pointerEvents = "auto";
  root.style.display = "none";

  const title = document.createElement("div");
  title.dataset.testid = "shrine-title";
  title.textContent = "Verdant Shrine";
  title.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  title.style.fontSize = "14px";
  title.style.letterSpacing = "0.04em";
  title.style.color = "#e4f5df";
  title.style.marginBottom = "4px";

  const motes = document.createElement("div");
  motes.dataset.testid = "shrine-motes";
  motes.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  motes.style.fontSize = "12px";
  motes.style.color = "#cef2cb";

  const shards = document.createElement("div");
  shards.dataset.testid = "shrine-shards";
  shards.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  shards.style.fontSize = "12px";
  shards.style.color = "#d8f1dc";

  const status = document.createElement("div");
  status.dataset.testid = "shrine-status";
  status.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  status.style.fontSize = "11px";
  status.style.color = "#d3e3d1";
  status.style.marginTop = "6px";
  status.style.minHeight = "14px";

  const buttons = {};
  const hpButton = createButton("+20 Max HP", "shrine-upgrade-hp");
  const chargeButton = createButton("+10% Charge Speed", "shrine-upgrade-charge");
  const moveButton = createButton("+5% Movement Speed", "shrine-upgrade-move");
  const attunementButton = createButton("Relic Attunement", "shrine-upgrade-attunement");
  buttons.maxHpLevel = hpButton;
  buttons.chargeSpeedLevel = chargeButton;
  buttons.moveSpeedLevel = moveButton;
  buttons.relicAttunementLevel = attunementButton;

  const closeButton = createButton("Close", "shrine-close");
  closeButton.style.marginTop = "10px";
  closeButton.style.borderColor = "rgba(146, 182, 151, 0.58)";
  closeButton.style.background = "rgba(24, 29, 25, 0.86)";

  root.append(title, motes, shards, hpButton, chargeButton, moveButton, attunementButton, status, closeButton);
  document.body.appendChild(root);

  return {
    root,
    motes,
    shards,
    status,
    buttons,
    closeButton,
  };
}

function applyButtonState(button, { enabled, purchased, suffix }) {
  button.disabled = !enabled;
  button.textContent = suffix ? `${button.dataset.baseLabel ?? button.textContent.split(" (")[0]} ${suffix}` : button.textContent;
  if (purchased) {
    button.style.background = "rgba(34, 52, 39, 0.9)";
    button.style.borderColor = "rgba(164, 223, 173, 0.75)";
    button.style.color = "#d3f3d0";
    return;
  }
  button.style.background = enabled ? "rgba(19, 31, 24, 0.86)" : "rgba(27, 31, 28, 0.82)";
  button.style.borderColor = enabled ? "rgba(152, 214, 164, 0.65)" : "rgba(112, 136, 116, 0.4)";
  button.style.color = enabled ? "#e7f4e5" : "#a4b9a8";
}

export class ShrineSystem {
  constructor({ threeScene, onPurchase }) {
    this.threeScene = threeScene;
    this.onPurchase = onPurchase;
    this.activeSceneId = "";
    this.open = false;
    this.inRange = false;
    this.lastStatus = "";
    this.latestMotes = 0;
    this.latestShards = 0;
    this.latestUpgrades = {
      maxHpLevel: 0,
      chargeSpeedLevel: 0,
      moveSpeedLevel: 0,
      relicAttunementLevel: 0,
    };
    this.latestStoryFlags = {
      vein_guardian_defeated: false,
    };
    this.latestPlayerPosition = new THREE.Vector2(0, 0);

    this.root = new THREE.Group();
    this.root.name = "shrine-root";
    this.threeScene.add(this.root);

    this.shrineBillboard = new BillboardSprite({
      root: this.root,
      assetPath: "./assets/sprites/props/shrine_pedestal.png",
      fallbackTexture: createShrineFallbackTexture(),
      width: 1.2,
      height: 1.48,
      position: SHRINE_POSITION.clone(),
      groundY: -0.9,
      yOffset: 0.02,
      depthBaseOrder: 1164,
      opacity: 0.96,
      tint: "#e4f7e1",
    });

    this.glowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.42, 28),
      new THREE.MeshBasicMaterial({
        color: "#9cf2b1",
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.glowRing.rotation.x = -Math.PI / 2;
    this.glowRing.position.set(SHRINE_POSITION.x, -0.884, SHRINE_POSITION.y);
    this.glowRing.renderOrder = resolveDepthOrder(SHRINE_POSITION.y, 1038);
    this.root.add(this.glowRing);

    this.ui = createShrineUi();
    for (const definition of UPGRADE_DEFINITIONS) {
      const button = this.ui.buttons[definition.id];
      button.dataset.baseLabel = definition.label;
      button.addEventListener("click", () => this.purchase(definition.id));
    }
    this.ui.closeButton.addEventListener("click", () => this.close());
  }

  setScene(sceneId) {
    this.activeSceneId = sceneId;
    const visible = sceneId === SHRINE_SCENE_ID;
    this.root.visible = visible;
    if (!visible) {
      this.close();
      this.inRange = false;
    }
  }

  isOpen() {
    return this.open;
  }

  isInRange() {
    return this.inRange;
  }

  openPanel() {
    if (this.activeSceneId !== SHRINE_SCENE_ID || !this.inRange) return false;
    this.open = true;
    this.ui.root.style.display = "block";
    this.renderUi();
    return true;
  }

  close() {
    this.open = false;
    this.ui.root.style.display = "none";
    this.lastStatus = "";
    this.ui.status.textContent = "";
  }

  toggle() {
    if (this.open) {
      this.close();
      return true;
    }
    return this.openPanel();
  }

  handleWorldTap(worldPoint) {
    if (this.activeSceneId !== SHRINE_SCENE_ID || !worldPoint) return { consumed: false };
    const distance = Math.hypot(worldPoint.x - SHRINE_POSITION.x, worldPoint.y - SHRINE_POSITION.y);
    if (distance > SHRINE_INTERACT_RADIUS * 0.95) return { consumed: false };
    if (this.inRange) {
      this.toggle();
      return { consumed: true, clearTarget: true };
    }
    return { consumed: false };
  }

  tryInteract() {
    if (this.activeSceneId !== SHRINE_SCENE_ID || !this.inRange) return false;
    return this.toggle();
  }

  setStatus(message) {
    this.lastStatus = message;
    this.ui.status.textContent = message;
  }

  purchase(upgradeId) {
    if (!this.open) return false;
    const definition = UPGRADE_DEFINITIONS.find((entry) => entry.id === upgradeId);
    if (!definition) return false;
    const level = Number(this.latestUpgrades[upgradeId] || 0);
    if (level >= 1) {
      this.setStatus("Already attuned.");
      this.renderUi();
      return false;
    }
    const currencyType = definition.currency === "shards" ? "shards" : "motes";
    const currencyAmount = currencyType === "shards" ? this.latestShards : this.latestMotes;
    if (currencyAmount < definition.cost) {
      this.setStatus(definition.currency === "shards" ? "Not enough shards." : "Not enough motes.");
      this.renderUi();
      return false;
    }
    if (definition.unlockFlag && !this.latestStoryFlags[definition.unlockFlag]) {
      this.setStatus("The relic remains inert.");
      this.renderUi();
      return false;
    }
    const success = this.onPurchase?.(upgradeId, definition.cost, definition.currency ?? "motes");
    if (!success) {
      this.setStatus("The shrine remains still.");
      return false;
    }
    this.setStatus("The shrine answers.");
    this.renderUi();
    return true;
  }

  renderUi() {
    this.ui.motes.textContent = `Verdant motes: ${this.latestMotes}`;
    this.ui.shards.textContent = `Relic shards: ${this.latestShards}`;
    for (const definition of UPGRADE_DEFINITIONS) {
      const button = this.ui.buttons[definition.id];
      const level = Number(this.latestUpgrades[definition.id] || 0);
      const purchased = level >= 1;
      const unlocked = !definition.unlockFlag || Boolean(this.latestStoryFlags[definition.unlockFlag]);
      const currencyType = definition.currency === "shards" ? "shards" : "motes";
      const currencyAmount = currencyType === "shards" ? this.latestShards : this.latestMotes;
      const enabled = unlocked && !purchased && currencyAmount >= definition.cost;
      const unit = definition.cost === 1 ? (currencyType === "shards" ? "shard" : "mote") : currencyType;
      const suffix = purchased ? "(Attuned)" : unlocked ? `(${definition.cost} ${unit})` : "(Locked)";
      button.textContent = `${definition.label} ${suffix}`;
      applyButtonState(button, { enabled, purchased, suffix: "" });
    }
  }

  update({ dtSeconds, elapsedSeconds, camera, playerPosition, motes, shards, upgrades, storyFlags }) {
    this.latestMotes = Math.max(0, Number(motes) || 0);
    this.latestShards = Math.max(0, Number(shards) || 0);
    this.latestUpgrades = {
      ...this.latestUpgrades,
      ...(upgrades ?? {}),
    };
    this.latestStoryFlags = {
      ...this.latestStoryFlags,
      ...(storyFlags ?? {}),
    };

    if (playerPosition) {
      this.latestPlayerPosition.set(playerPosition.x, playerPosition.z);
    }
    this.inRange =
      this.activeSceneId === SHRINE_SCENE_ID &&
      Math.hypot(this.latestPlayerPosition.x - SHRINE_POSITION.x, this.latestPlayerPosition.y - SHRINE_POSITION.y) <=
        SHRINE_INTERACT_RADIUS;

    this.shrineBillboard.update(dtSeconds, elapsedSeconds, camera, 1);
    const pulse = 0.58 + Math.sin(elapsedSeconds * 2.1) * 0.42;
    this.glowRing.material.opacity = this.activeSceneId === SHRINE_SCENE_ID ? 0.11 + pulse * 0.16 : 0;
    this.glowRing.scale.setScalar(this.inRange ? 1.08 : 1);
    this.glowRing.visible = this.activeSceneId === SHRINE_SCENE_ID;

    if (this.open) {
      this.renderUi();
    }
  }

  getPromptText() {
    if (this.open) return "";
    if (this.activeSceneId !== SHRINE_SCENE_ID || !this.inRange) return "";
    return "Press Space to commune";
  }

  getState() {
    return {
      sceneId: this.activeSceneId,
      open: this.open,
      inRange: this.inRange,
      motes: this.latestMotes,
      shards: this.latestShards,
      upgrades: { ...this.latestUpgrades },
      storyFlags: { ...this.latestStoryFlags },
    };
  }

  dispose() {
    this.close();
    this.shrineBillboard.dispose();
    this.ui.root.remove();
    if (this.glowRing.parent === this.root) {
      this.root.remove(this.glowRing);
    }
    this.glowRing.geometry.dispose();
    this.glowRing.material.dispose();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

export const SHRINE_UPGRADES = UPGRADE_DEFINITIONS;
export const SHRINE_SCENE = SHRINE_SCENE_ID;
