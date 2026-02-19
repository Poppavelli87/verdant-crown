const STATUS_ICON_PATHS = Object.freeze({
  buff_attdef: "./assets/sprites/ui/status/buff_attdef.png",
  ignite_mark: "./assets/sprites/ui/status/ignite_mark.png",
  wither_mark: "./assets/sprites/ui/status/wither_mark.png",
  focus_mark: "./assets/sprites/ui/status/focus_mark.png",
  suppression_field: "./assets/sprites/ui/status/suppression_field.png",
  hex_weakened: "./assets/sprites/ui/status/hex_weakened.png",
  silenced_roots: "./assets/sprites/ui/status/silenced_roots.png",
  null_silence: "./assets/sprites/ui/status/null_silence.png",
  null_clamp: "./assets/sprites/ui/status/null_clamp.png",
  memory_tax: "./assets/sprites/ui/status/memory_tax.png",
  rewrite_mark: "./assets/sprites/ui/status/rewrite_mark.png",
});

export function createHud({ version = "" } = {}) {
  // Lightweight DOM overlay for qualitative world feedback and combat readouts.
  const hudRoot = document.createElement("div");
  hudRoot.id = "hud-root";
  hudRoot.style.position = "fixed";
  hudRoot.style.top = "12px";
  hudRoot.style.left = "12px";
  hudRoot.style.zIndex = "10";
  hudRoot.style.pointerEvents = "none";
  hudRoot.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  hudRoot.style.color = "#e5e7eb";
  hudRoot.style.textShadow = "0 1px 3px rgba(0, 0, 0, 0.75)";
  hudRoot.style.letterSpacing = "0.02em";

  function createStatusRow(testid) {
    const row = document.createElement("div");
    row.dataset.testid = testid;
    row.style.display = "none";
    row.style.gap = "2px";
    row.style.marginTop = "2px";
    row.style.minHeight = "12px";
    row.style.pointerEvents = "none";
    return row;
  }

  function renderStatusIcons(row, effects = [], elapsedSeconds = 0) {
    const list = Array.isArray(effects) ? effects : [];
    row.innerHTML = "";
    if (list.length === 0) {
      row.style.display = "none";
      return;
    }
    row.style.display = "flex";
    for (const effect of list) {
      const icon = document.createElement("div");
      icon.style.width = "11px";
      icon.style.height = "11px";
      icon.style.border = "1px solid rgba(10, 14, 10, 0.82)";
      icon.style.boxSizing = "border-box";
      icon.style.borderRadius = "2px";
      icon.style.background = "rgba(11, 16, 12, 0.72)";
      icon.style.backgroundImage = `url('${STATUS_ICON_PATHS[effect.icon] ?? ""}')`;
      icon.style.backgroundSize = "cover";
      icon.style.backgroundPosition = "center";
      icon.style.imageRendering = "pixelated";
      icon.style.position = "relative";
      icon.style.opacity = "0.95";
      const isExpiring = Boolean(effect.expiring || Number(effect.remaining) < 2);
      if (isExpiring && Math.floor(Math.max(0, Number(elapsedSeconds) || 0) * 8) % 2 === 0) {
        icon.style.opacity = "0.5";
      }
      if (effect.positive === true) {
        icon.style.boxShadow = "0 0 0 1px rgba(167, 255, 194, 0.28) inset";
      } else {
        icon.style.boxShadow = "0 0 0 1px rgba(255, 144, 144, 0.24) inset";
      }
      const hasCharges = Number.isFinite(Number(effect.charges)) && Number(effect.charges) > 0;
      if (hasCharges) {
        const charges = document.createElement("div");
        charges.textContent = String(Math.max(0, Math.floor(Number(effect.charges))));
        charges.style.position = "absolute";
        charges.style.right = "-1px";
        charges.style.bottom = "-6px";
        charges.style.fontSize = "9px";
        charges.style.lineHeight = "9px";
        charges.style.color = "#f4f9ef";
        charges.style.textShadow = "0 1px 1px rgba(0,0,0,0.85)";
        icon.appendChild(charges);
      }
      row.appendChild(icon);
    }
  }

  const omenMessage = document.createElement("div");
  omenMessage.dataset.testid = "omen-message";
  omenMessage.style.fontSize = "13px";
  omenMessage.style.opacity = "0.94";

  const crownOmen = document.createElement("div");
  crownOmen.dataset.testid = "crown-omen";
  crownOmen.style.fontSize = "11px";
  crownOmen.style.marginTop = "3px";
  crownOmen.style.opacity = "0.84";
  crownOmen.style.color = "#d9f6ce";
  crownOmen.style.transition = "opacity 120ms linear, color 120ms linear";

  const sceneName = document.createElement("div");
  sceneName.dataset.testid = "scene-name";
  sceneName.style.fontSize = "12px";
  sceneName.style.marginTop = "2px";
  sceneName.style.opacity = "0.86";

  const regionFeel = document.createElement("div");
  regionFeel.dataset.testid = "region-feel";
  regionFeel.style.fontSize = "12px";
  regionFeel.style.marginTop = "2px";
  regionFeel.style.opacity = "0.86";

  const tacticsMode = document.createElement("div");
  tacticsMode.dataset.testid = "tactics-mode";
  tacticsMode.style.display = "none";
  tacticsMode.style.fontSize = "11px";
  tacticsMode.style.marginTop = "3px";
  tacticsMode.style.opacity = "0.86";
  tacticsMode.style.color = "#d6ecff";

  const activeCharacter = document.createElement("div");
  activeCharacter.dataset.testid = "active-character";
  activeCharacter.style.display = "none";
  activeCharacter.style.fontSize = "11px";
  activeCharacter.style.marginTop = "2px";
  activeCharacter.style.opacity = "0.86";
  activeCharacter.style.color = "#d0f1e2";

  const willowStance = document.createElement("div");
  willowStance.dataset.testid = "willow-stance";
  willowStance.style.display = "none";
  willowStance.style.fontSize = "11px";
  willowStance.style.marginTop = "2px";
  willowStance.style.opacity = "0.86";
  willowStance.style.color = "#d6e4ff";

  const guidanceLine = document.createElement("div");
  guidanceLine.dataset.testid = "guidance-line";
  guidanceLine.style.display = "none";
  guidanceLine.style.fontSize = "11px";
  guidanceLine.style.marginTop = "4px";
  guidanceLine.style.opacity = "0.84";
  guidanceLine.style.color = "#ecf8cf";

  const hpLine = document.createElement("div");
  hpLine.dataset.testid = "hud-hp";
  hpLine.style.fontSize = "12px";
  hpLine.style.marginTop = "4px";
  hpLine.style.opacity = "0.9";
  hpLine.style.color = "#f8dbcf";

  const hpBar = document.createElement("div");
  hpBar.style.marginTop = "2px";
  hpBar.style.width = "136px";
  hpBar.style.height = "7px";
  hpBar.style.border = "1px solid rgba(12, 20, 12, 0.75)";
  hpBar.style.background = "rgba(20, 28, 20, 0.52)";
  hpBar.style.borderRadius = "4px";
  hpBar.style.overflow = "hidden";

  const hpFill = document.createElement("div");
  hpFill.style.height = "100%";
  hpFill.style.width = "100%";
  hpFill.style.background = "linear-gradient(90deg, #ef4444, #f59e0b)";
  hpFill.style.transition = "width 90ms linear";
  hpBar.appendChild(hpFill);

  const partyPanel = document.createElement("div");
  partyPanel.style.marginTop = "6px";
  partyPanel.style.display = "grid";
  partyPanel.style.gap = "4px";

  const partyArthurRow = document.createElement("div");
  partyArthurRow.dataset.testid = "hp-arthur";
  partyArthurRow.style.display = "grid";
  partyArthurRow.style.gap = "1px";
  partyArthurRow.style.maxWidth = "152px";

  const partyArthurLabel = document.createElement("div");
  partyArthurLabel.style.fontSize = "10px";
  partyArthurLabel.style.opacity = "0.88";
  partyArthurLabel.style.color = "#f6ded0";
  partyArthurLabel.textContent = "Arthur";

  const partyArthurBar = document.createElement("div");
  partyArthurBar.style.width = "136px";
  partyArthurBar.style.height = "5px";
  partyArthurBar.style.border = "1px solid rgba(12, 20, 12, 0.75)";
  partyArthurBar.style.background = "rgba(20, 28, 20, 0.52)";
  partyArthurBar.style.borderRadius = "4px";
  partyArthurBar.style.overflow = "hidden";

  const partyArthurFill = document.createElement("div");
  partyArthurFill.style.height = "100%";
  partyArthurFill.style.width = "100%";
  partyArthurFill.style.background = "linear-gradient(90deg, #dc2626, #f59e0b)";
  partyArthurFill.style.transition = "width 90ms linear";
  partyArthurBar.appendChild(partyArthurFill);
  const statusArthur = createStatusRow("status-arthur");
  partyArthurRow.append(partyArthurLabel, partyArthurBar, statusArthur);

  const partyElaineRow = document.createElement("div");
  partyElaineRow.dataset.testid = "hp-elaine";
  partyElaineRow.style.display = "none";
  partyElaineRow.style.gap = "1px";
  partyElaineRow.style.maxWidth = "152px";

  const partyElaineLabel = document.createElement("div");
  partyElaineLabel.style.fontSize = "10px";
  partyElaineLabel.style.opacity = "0.88";
  partyElaineLabel.style.color = "#d9ecff";
  partyElaineLabel.textContent = "Elaine";

  const partyElaineBar = document.createElement("div");
  partyElaineBar.style.width = "136px";
  partyElaineBar.style.height = "5px";
  partyElaineBar.style.border = "1px solid rgba(12, 20, 12, 0.75)";
  partyElaineBar.style.background = "rgba(20, 28, 20, 0.52)";
  partyElaineBar.style.borderRadius = "4px";
  partyElaineBar.style.overflow = "hidden";

  const partyElaineFill = document.createElement("div");
  partyElaineFill.style.height = "100%";
  partyElaineFill.style.width = "100%";
  partyElaineFill.style.background = "linear-gradient(90deg, #3b82f6, #60a5fa)";
  partyElaineFill.style.transition = "width 90ms linear";
  partyElaineBar.appendChild(partyElaineFill);
  const statusElaine = createStatusRow("status-elaine");
  partyElaineRow.append(partyElaineLabel, partyElaineBar, statusElaine);

  const partyWillowRow = document.createElement("div");
  partyWillowRow.dataset.testid = "status-willow";
  partyWillowRow.style.display = "none";
  partyWillowRow.style.gap = "1px";
  partyWillowRow.style.maxWidth = "152px";

  const partyWillowLabel = document.createElement("div");
  partyWillowLabel.style.fontSize = "10px";
  partyWillowLabel.style.opacity = "0.86";
  partyWillowLabel.style.color = "#d6e4ff";
  partyWillowLabel.textContent = "Willow";
  const statusWillow = createStatusRow("status-willow-icons");
  partyWillowRow.append(partyWillowLabel, statusWillow);

  partyPanel.append(partyArthurRow, partyElaineRow, partyWillowRow);

  const mpLine = document.createElement("div");
  mpLine.dataset.testid = "hud-mp";
  mpLine.style.fontSize = "11px";
  mpLine.style.marginTop = "3px";
  mpLine.style.opacity = "0.88";
  mpLine.style.color = "#d7e7ff";

  const mpBar = document.createElement("div");
  mpBar.style.marginTop = "2px";
  mpBar.style.width = "136px";
  mpBar.style.height = "6px";
  mpBar.style.border = "1px solid rgba(10, 18, 28, 0.75)";
  mpBar.style.background = "rgba(16, 24, 34, 0.48)";
  mpBar.style.borderRadius = "4px";
  mpBar.style.overflow = "hidden";

  const mpFill = document.createElement("div");
  mpFill.style.height = "100%";
  mpFill.style.width = "100%";
  mpFill.style.background = "linear-gradient(90deg, #60a5fa, #34d399)";
  mpFill.style.transition = "width 90ms linear";
  mpBar.appendChild(mpFill);

  const willowMpLine = document.createElement("div");
  willowMpLine.dataset.testid = "hud-willow-mp";
  willowMpLine.style.display = "none";
  willowMpLine.style.fontSize = "11px";
  willowMpLine.style.marginTop = "3px";
  willowMpLine.style.opacity = "0.88";
  willowMpLine.style.color = "#d6e2ff";

  const willowMpBar = document.createElement("div");
  willowMpBar.style.display = "none";
  willowMpBar.style.marginTop = "2px";
  willowMpBar.style.width = "136px";
  willowMpBar.style.height = "6px";
  willowMpBar.style.border = "1px solid rgba(12, 16, 28, 0.75)";
  willowMpBar.style.background = "rgba(17, 22, 35, 0.5)";
  willowMpBar.style.borderRadius = "4px";
  willowMpBar.style.overflow = "hidden";

  const willowMpFill = document.createElement("div");
  willowMpFill.style.height = "100%";
  willowMpFill.style.width = "100%";
  willowMpFill.style.background = "linear-gradient(90deg, #7ea9ff, #63c8ff)";
  willowMpFill.style.transition = "width 90ms linear";
  willowMpBar.appendChild(willowMpFill);

  const lootCounter = document.createElement("div");
  lootCounter.dataset.testid = "loot-counter";
  lootCounter.style.fontSize = "12px";
  lootCounter.style.marginTop = "4px";
  lootCounter.style.opacity = "0.86";

  const moteCounter = document.createElement("div");
  moteCounter.dataset.testid = "verdant-mote-counter";
  moteCounter.style.fontSize = "12px";
  moteCounter.style.marginTop = "2px";
  moteCounter.style.opacity = "0.86";

  const relicCounter = document.createElement("div");
  relicCounter.dataset.testid = "relic-shard-counter";
  relicCounter.style.fontSize = "12px";
  relicCounter.style.marginTop = "2px";
  relicCounter.style.opacity = "0.86";

  const anomalyStatus = document.createElement("div");
  anomalyStatus.dataset.testid = "anomaly-status";
  anomalyStatus.style.fontSize = "11px";
  anomalyStatus.style.marginTop = "2px";
  anomalyStatus.style.opacity = "0.78";
  anomalyStatus.style.color = "#c9ffd7";
  anomalyStatus.style.display = "none";

  const combatIndicator = document.createElement("div");
  combatIndicator.dataset.testid = "combat-indicator";
  combatIndicator.textContent = "Combat";
  combatIndicator.style.display = "none";
  combatIndicator.style.fontSize = "11px";
  combatIndicator.style.marginTop = "8px";
  combatIndicator.style.padding = "2px 6px";
  combatIndicator.style.border = "1px solid rgba(248, 113, 113, 0.85)";
  combatIndicator.style.borderRadius = "999px";
  combatIndicator.style.background = "rgba(127, 29, 29, 0.3)";
  combatIndicator.style.width = "fit-content";

  const veinStatus = document.createElement("div");
  veinStatus.dataset.testid = "vein-status";
  veinStatus.style.display = "none";
  veinStatus.style.fontSize = "11px";
  veinStatus.style.marginTop = "6px";
  veinStatus.style.padding = "2px 6px";
  veinStatus.style.border = "1px solid rgba(176, 236, 156, 0.82)";
  veinStatus.style.borderRadius = "999px";
  veinStatus.style.background = "rgba(38, 74, 41, 0.35)";
  veinStatus.style.width = "fit-content";

  const questLine = document.createElement("div");
  questLine.dataset.testid = "quest-line";
  questLine.style.display = "none";
  questLine.style.fontSize = "11px";
  questLine.style.marginTop = "6px";
  questLine.style.padding = "2px 6px";
  questLine.style.border = "1px solid rgba(196, 230, 168, 0.82)";
  questLine.style.borderRadius = "999px";
  questLine.style.background = "rgba(56, 72, 34, 0.32)";
  questLine.style.width = "fit-content";

  const sunderLine = document.createElement("div");
  sunderLine.style.display = "none";
  sunderLine.style.fontSize = "11px";
  sunderLine.style.marginTop = "6px";
  sunderLine.style.color = "#ffd8cc";

  const sunderBar = document.createElement("div");
  sunderBar.dataset.testid = "sunder-meter";
  sunderBar.style.display = "none";
  sunderBar.style.marginTop = "2px";
  sunderBar.style.width = "164px";
  sunderBar.style.height = "7px";
  sunderBar.style.border = "1px solid rgba(32, 16, 16, 0.84)";
  sunderBar.style.background = "rgba(34, 16, 16, 0.58)";
  sunderBar.style.borderRadius = "4px";
  sunderBar.style.overflow = "hidden";

  const sunderFill = document.createElement("div");
  sunderFill.style.height = "100%";
  sunderFill.style.width = "0%";
  sunderFill.style.background = "linear-gradient(90deg, #f6c26d, #f87171)";
  sunderFill.style.transition = "width 90ms linear";
  sunderBar.appendChild(sunderFill);

  const breachLine = document.createElement("div");
  breachLine.style.display = "none";
  breachLine.style.fontSize = "11px";
  breachLine.style.marginTop = "6px";
  breachLine.style.color = "#d2f7ff";

  const breachBar = document.createElement("div");
  breachBar.dataset.testid = "breach-meter";
  breachBar.style.display = "none";
  breachBar.style.marginTop = "2px";
  breachBar.style.width = "164px";
  breachBar.style.height = "7px";
  breachBar.style.border = "1px solid rgba(14, 22, 32, 0.84)";
  breachBar.style.background = "rgba(14, 22, 32, 0.58)";
  breachBar.style.borderRadius = "4px";
  breachBar.style.overflow = "hidden";

  const breachFill = document.createElement("div");
  breachFill.style.height = "100%";
  breachFill.style.width = "0%";
  breachFill.style.background = "linear-gradient(90deg, #7dd3fc, #fb923c)";
  breachFill.style.transition = "width 90ms linear";
  breachBar.appendChild(breachFill);

  const memoryPressureLine = document.createElement("div");
  memoryPressureLine.style.display = "none";
  memoryPressureLine.style.fontSize = "11px";
  memoryPressureLine.style.marginTop = "6px";
  memoryPressureLine.style.color = "#e4d5ff";

  const memoryPressureBar = document.createElement("div");
  memoryPressureBar.dataset.testid = "memory-pressure";
  memoryPressureBar.style.display = "none";
  memoryPressureBar.style.marginTop = "2px";
  memoryPressureBar.style.width = "164px";
  memoryPressureBar.style.height = "7px";
  memoryPressureBar.style.border = "1px solid rgba(24, 18, 34, 0.84)";
  memoryPressureBar.style.background = "rgba(24, 18, 34, 0.58)";
  memoryPressureBar.style.borderRadius = "4px";
  memoryPressureBar.style.overflow = "hidden";

  const memoryPressureFill = document.createElement("div");
  memoryPressureFill.style.height = "100%";
  memoryPressureFill.style.width = "0%";
  memoryPressureFill.style.background = "linear-gradient(90deg, #a78bfa, #f97316)";
  memoryPressureFill.style.transition = "width 90ms linear";
  memoryPressureBar.appendChild(memoryPressureFill);

  const riftStabilityLine = document.createElement("div");
  riftStabilityLine.style.display = "none";
  riftStabilityLine.style.fontSize = "11px";
  riftStabilityLine.style.marginTop = "6px";
  riftStabilityLine.style.color = "#d5e9ff";

  const riftStabilityBar = document.createElement("div");
  riftStabilityBar.dataset.testid = "rift-stability";
  riftStabilityBar.style.display = "none";
  riftStabilityBar.style.marginTop = "2px";
  riftStabilityBar.style.width = "164px";
  riftStabilityBar.style.height = "7px";
  riftStabilityBar.style.border = "1px solid rgba(20, 24, 38, 0.84)";
  riftStabilityBar.style.background = "rgba(20, 24, 38, 0.58)";
  riftStabilityBar.style.borderRadius = "4px";
  riftStabilityBar.style.overflow = "hidden";

  const riftStabilityFill = document.createElement("div");
  riftStabilityFill.style.height = "100%";
  riftStabilityFill.style.width = "0%";
  riftStabilityFill.style.background = "linear-gradient(90deg, #60a5fa, #c084fc)";
  riftStabilityFill.style.transition = "width 90ms linear";
  riftStabilityBar.appendChild(riftStabilityFill);

  const clampStatusLine = document.createElement("div");
  clampStatusLine.dataset.testid = "clamp-status";
  clampStatusLine.style.display = "none";
  clampStatusLine.style.fontSize = "11px";
  clampStatusLine.style.marginTop = "6px";
  clampStatusLine.style.color = "#f8e8bf";

  const transientMessage = document.createElement("div");
  transientMessage.dataset.testid = "transient-message";
  transientMessage.style.display = "none";
  transientMessage.style.fontSize = "12px";
  transientMessage.style.marginTop = "7px";
  transientMessage.style.opacity = "0.9";
  transientMessage.style.color = "#d9f99d";

  const interactPrompt = document.createElement("div");
  interactPrompt.dataset.testid = "interact-prompt";
  interactPrompt.style.display = "none";
  interactPrompt.style.fontSize = "12px";
  interactPrompt.style.marginTop = "7px";
  interactPrompt.style.opacity = "0.88";
  interactPrompt.style.color = "#ecf8cf";

  // Test hook for the Thornmere -> Emberfall travel marker.
  const ashGateMarker = document.createElement("div");
  ashGateMarker.dataset.testid = "ash-gate";
  ashGateMarker.style.display = "none";

  // Test hook for the Thornmere ridge gate marker.
  const ridgeGateMarker = document.createElement("div");
  ridgeGateMarker.dataset.testid = "ridge-gate";
  ridgeGateMarker.style.display = "none";

  const bossHud = document.createElement("div");
  bossHud.dataset.testid = "boss-hud";
  bossHud.style.position = "fixed";
  bossHud.style.left = "50%";
  bossHud.style.top = "14px";
  bossHud.style.transform = "translateX(-50%)";
  bossHud.style.width = "min(420px, 68vw)";
  bossHud.style.padding = "6px 8px";
  bossHud.style.background = "rgba(14, 18, 14, 0.82)";
  bossHud.style.border = "1px solid rgba(190, 244, 194, 0.74)";
  bossHud.style.boxShadow = "0 0 0 1px rgba(26, 42, 30, 0.78) inset";
  bossHud.style.display = "none";
  bossHud.style.zIndex = "12";

  const bossName = document.createElement("div");
  bossName.style.fontSize = "12px";
  bossName.style.fontWeight = "700";
  bossName.style.color = "#efffef";

  const bossPhase = document.createElement("div");
  bossPhase.style.fontSize = "11px";
  bossPhase.style.color = "#ccf7d3";
  bossPhase.style.marginTop = "2px";

  const bossBar = document.createElement("div");
  bossBar.dataset.testid = "hp-boss";
  bossBar.style.marginTop = "5px";
  bossBar.style.width = "100%";
  bossBar.style.height = "9px";
  bossBar.style.border = "1px solid rgba(12, 20, 12, 0.76)";
  bossBar.style.background = "rgba(20, 28, 20, 0.58)";
  bossBar.style.borderRadius = "5px";
  bossBar.style.overflow = "hidden";

  const bossHp = document.createElement("div");
  bossHp.dataset.testid = "boss-hp";
  bossHp.style.height = "100%";
  bossHp.style.width = "100%";
  bossHp.style.background = "linear-gradient(90deg, #ef6f7f, #f87171)";
  bossHp.style.transition = "width 90ms linear";
  bossBar.appendChild(bossHp);

  const bossExtractionLine = document.createElement("div");
  bossExtractionLine.style.display = "none";
  bossExtractionLine.style.fontSize = "10px";
  bossExtractionLine.style.marginTop = "4px";
  bossExtractionLine.style.color = "#d7fff0";

  const bossExtractionBar = document.createElement("div");
  bossExtractionBar.dataset.testid = "boss-extraction";
  bossExtractionBar.style.display = "none";
  bossExtractionBar.style.marginTop = "2px";
  bossExtractionBar.style.width = "100%";
  bossExtractionBar.style.height = "6px";
  bossExtractionBar.style.border = "1px solid rgba(16, 22, 18, 0.78)";
  bossExtractionBar.style.background = "rgba(18, 26, 20, 0.6)";
  bossExtractionBar.style.borderRadius = "4px";
  bossExtractionBar.style.overflow = "hidden";

  const bossExtractionFill = document.createElement("div");
  bossExtractionFill.style.height = "100%";
  bossExtractionFill.style.width = "0%";
  bossExtractionFill.style.background = "linear-gradient(90deg, #7fe7cd, #f3b56f)";
  bossExtractionFill.style.transition = "width 90ms linear";
  bossExtractionBar.appendChild(bossExtractionFill);

  const bossHpLine = document.createElement("div");
  bossHpLine.style.fontSize = "11px";
  bossHpLine.style.marginTop = "3px";
  bossHpLine.style.color = "#ffd8de";

  bossHud.append(bossName, bossPhase, bossBar, bossExtractionLine, bossExtractionBar, bossHpLine);
  document.body.appendChild(bossHud);

  const targetHud = document.createElement("div");
  targetHud.dataset.testid = "hp-target";
  targetHud.style.position = "fixed";
  targetHud.style.left = "50%";
  targetHud.style.top = "86px";
  targetHud.style.transform = "translateX(-50%)";
  targetHud.style.width = "min(280px, 48vw)";
  targetHud.style.padding = "4px 6px";
  targetHud.style.background = "rgba(14, 18, 14, 0.68)";
  targetHud.style.border = "1px solid rgba(206, 216, 198, 0.62)";
  targetHud.style.boxShadow = "0 0 0 1px rgba(26, 34, 30, 0.72) inset";
  targetHud.style.display = "none";
  targetHud.style.zIndex = "11";

  const targetName = document.createElement("div");
  targetName.style.fontSize = "11px";
  targetName.style.color = "#eff7ea";

  const targetBar = document.createElement("div");
  targetBar.style.marginTop = "3px";
  targetBar.style.width = "100%";
  targetBar.style.height = "7px";
  targetBar.style.border = "1px solid rgba(12, 20, 12, 0.76)";
  targetBar.style.background = "rgba(20, 28, 20, 0.56)";
  targetBar.style.borderRadius = "4px";
  targetBar.style.overflow = "hidden";

  const targetFill = document.createElement("div");
  targetFill.style.height = "100%";
  targetFill.style.width = "100%";
  targetFill.style.background = "linear-gradient(90deg, #fca5a5, #f97316)";
  targetFill.style.transition = "width 90ms linear";
  targetBar.appendChild(targetFill);

  const targetHpLine = document.createElement("div");
  targetHpLine.style.fontSize = "10px";
  targetHpLine.style.marginTop = "2px";
  targetHpLine.style.color = "#ffd8cf";
  const statusTarget = createStatusRow("status-target");

  targetHud.append(targetName, targetBar, targetHpLine, statusTarget);
  document.body.appendChild(targetHud);

  const stabilityToast = document.createElement("div");
  stabilityToast.dataset.testid = "stability-toast";
  stabilityToast.style.display = "none";
  stabilityToast.style.fontSize = "11px";
  stabilityToast.style.marginTop = "4px";
  stabilityToast.style.opacity = "0.9";
  stabilityToast.style.color = "#bbf7d0";

  hudRoot.append(
    omenMessage,
    crownOmen,
    sceneName,
    regionFeel,
    tacticsMode,
    activeCharacter,
    willowStance,
    guidanceLine,
    hpLine,
    hpBar,
    partyPanel,
    mpLine,
    mpBar,
    willowMpLine,
    willowMpBar,
    lootCounter,
    moteCounter,
    relicCounter,
    anomalyStatus,
    combatIndicator,
    veinStatus,
    questLine,
    sunderLine,
    sunderBar,
    breachLine,
    breachBar,
    memoryPressureLine,
    memoryPressureBar,
    riftStabilityLine,
    riftStabilityBar,
    clampStatusLine,
    transientMessage,
    stabilityToast,
    interactPrompt,
    ashGateMarker,
    ridgeGateMarker
  );
  document.body.appendChild(hudRoot);

  const hazeOverlay = document.createElement("div");
  hazeOverlay.id = "verdant-haze";
  hazeOverlay.style.position = "fixed";
  hazeOverlay.style.inset = "0";
  hazeOverlay.style.pointerEvents = "none";
  hazeOverlay.style.zIndex = "2";
  hazeOverlay.style.background =
    "radial-gradient(circle at 22% 18%, rgba(139, 190, 129, 0.26), rgba(83, 139, 80, 0.11) 42%, rgba(22, 44, 25, 0.35) 100%)";
  hazeOverlay.style.opacity = "0";
  hazeOverlay.style.transition = "opacity 220ms linear";
  document.body.appendChild(hazeOverlay);

  const chargeRoot = document.createElement("div");
  chargeRoot.dataset.testid = "charge-bar";
  chargeRoot.style.position = "fixed";
  chargeRoot.style.width = "56px";
  chargeRoot.style.height = "6px";
  chargeRoot.style.border = "1px solid rgba(12, 20, 12, 0.8)";
  chargeRoot.style.background = "rgba(16, 26, 16, 0.45)";
  chargeRoot.style.borderRadius = "4px";
  chargeRoot.style.pointerEvents = "none";
  chargeRoot.style.zIndex = "11";
  chargeRoot.style.transform = "translate(-50%, -50%)";
  chargeRoot.style.opacity = "0";
  chargeRoot.style.transition = "opacity 160ms linear";

  const chargeFill = document.createElement("div");
  chargeFill.style.height = "100%";
  chargeFill.style.width = "0%";
  chargeFill.style.background = "linear-gradient(90deg, #86efac, #facc15)";
  chargeFill.style.borderRadius = "3px";
  chargeRoot.appendChild(chargeFill);
  document.body.appendChild(chargeRoot);

  const versionLabel = document.createElement("div");
  versionLabel.dataset.testid = "version-label";
  versionLabel.style.position = "fixed";
  versionLabel.style.left = "10px";
  versionLabel.style.bottom = "8px";
  versionLabel.style.pointerEvents = "none";
  versionLabel.style.zIndex = "10";
  versionLabel.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  versionLabel.style.fontSize = "11px";
  versionLabel.style.opacity = "0.55";
  versionLabel.style.color = "#d7dfd1";
  versionLabel.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.65)";
  versionLabel.textContent = version ? `v${version}` : "";
  document.body.appendChild(versionLabel);

  return {
    update({
      regionName,
      sceneName: sceneDisplayName,
      regionFeel: regionFeelState,
      omenMessage: omenMessageText,
      crownOmen: crownOmenText = "",
      crownOmenFlash = 0,
      combatActive,
      veinStatus: veinStatusText = "",
      transientMessage: transient,
      stabilityToast: stabilityMessage = "",
      lootCount = 0,
      verdantMoteCount = 0,
      relicShardCount = 0,
      anomalyNearby = false,
      interactionPrompt = "",
      hp = 100,
      maxHp = 100,
      mp = 0,
      maxMp = 100,
      showMp = false,
      willowMp = 0,
      willowMaxMp = 100,
      showWillowMp = false,
      questText = "",
      supportText = "",
      tacticsText = "",
      activeCharacterText = "",
      willowStanceText = "",
      guidanceText = "",
      partyHealth = null,
      partyStatus = null,
      targetStatus = null,
      statusTime = 0,
      target = null,
      boss = null,
      sunder = null,
      breach = null,
      memoryPressure = null,
      riftStability = null,
      clampStatus = null,
      showAshGateMarker = false,
      showRidgeGateMarker = false,
    }) {
      const safeMaxHp = Math.max(1, Number(maxHp) || 1);
      const safeHp = Math.max(0, Number(hp) || 0);
      const hpRatio = Math.max(0, Math.min(1, safeHp / safeMaxHp));
      const safeMaxMp = Math.max(1, Number(maxMp) || 1);
      const safeMp = Math.max(0, Number(mp) || 0);
      const mpRatio = Math.max(0, Math.min(1, safeMp / safeMaxMp));
      const safeWillowMaxMp = Math.max(1, Number(willowMaxMp) || 1);
      const safeWillowMp = Math.max(0, Number(willowMp) || 0);
      const willowMpRatio = Math.max(0, Math.min(1, safeWillowMp / safeWillowMaxMp));

      omenMessage.textContent = omenMessageText;
      crownOmen.textContent = crownOmenText ? `Crown: ${crownOmenText}` : "Crown: Balanced";
      const flashStrength = Math.max(0, Math.min(1, Number(crownOmenFlash) || 0));
      crownOmen.style.opacity = (0.84 + flashStrength * 0.16).toFixed(3);
      crownOmen.style.color = flashStrength > 0.01 ? "#efffd6" : "#d9f6ce";
      sceneName.textContent = sceneDisplayName;
      regionFeel.textContent = `${regionName} feels ${regionFeelState}`;
      if (tacticsText) {
        tacticsMode.textContent = `Mode: ${tacticsText}`;
        tacticsMode.style.display = "block";
      } else {
        tacticsMode.style.display = "none";
      }
      if (activeCharacterText) {
        activeCharacter.textContent = `Active: ${activeCharacterText}`;
        activeCharacter.style.display = "block";
      } else {
        activeCharacter.style.display = "none";
      }
      if (willowStanceText) {
        willowStance.textContent = `Willow: ${willowStanceText}`;
        willowStance.style.display = "block";
      } else {
        willowStance.style.display = "none";
      }
      if (guidanceText) {
        guidanceLine.textContent = guidanceText;
        guidanceLine.style.display = "block";
      } else {
        guidanceLine.style.display = "none";
      }
      hpLine.textContent = `HP ${Math.round(safeHp)}/${safeMaxHp}`;
      hpFill.style.width = `${(hpRatio * 100).toFixed(1)}%`;
      const showPartyPanel = Boolean(partyHealth?.elaine?.available || partyHealth?.willow?.available);
      partyPanel.style.display = showPartyPanel ? "grid" : "none";
      partyArthurRow.style.display = showPartyPanel ? "grid" : "none";
      const partyArthurHp = Math.max(0, Number(partyHealth?.arthur?.hp ?? safeHp) || 0);
      const partyArthurMax = Math.max(1, Number(partyHealth?.arthur?.maxHp ?? safeMaxHp) || 1);
      const partyArthurRatio = Math.max(0, Math.min(1, partyArthurHp / partyArthurMax));
      const partyArthurDowned = Boolean(partyHealth?.arthur?.downed);
      partyArthurLabel.textContent = `Arthur ${Math.round(partyArthurHp)}/${partyArthurMax}${partyArthurDowned ? " (Downed)" : ""}`;
      partyArthurFill.style.width = `${(partyArthurRatio * 100).toFixed(1)}%`;
      renderStatusIcons(statusArthur, partyStatus?.arthur ?? [], statusTime);

      const showElaineRow = Boolean(partyHealth?.elaine?.available);
      partyElaineRow.style.display = showElaineRow ? "grid" : "none";
      if (showElaineRow) {
        const partyElaineHp = Math.max(0, Number(partyHealth?.elaine?.hp ?? 0) || 0);
        const partyElaineMax = Math.max(1, Number(partyHealth?.elaine?.maxHp ?? 1) || 1);
        const partyElaineRatio = Math.max(0, Math.min(1, partyElaineHp / partyElaineMax));
        const partyElaineDowned = Boolean(partyHealth?.elaine?.downed);
        partyElaineLabel.textContent = `Elaine ${Math.round(partyElaineHp)}/${partyElaineMax}${partyElaineDowned ? " (Downed)" : ""}`;
        partyElaineFill.style.width = `${(partyElaineRatio * 100).toFixed(1)}%`;
        renderStatusIcons(statusElaine, partyStatus?.elaine ?? [], statusTime);
      } else {
        renderStatusIcons(statusElaine, [], statusTime);
      }
      const showWillowRow = Boolean(partyHealth?.willow?.available);
      partyWillowRow.style.display = showWillowRow ? "grid" : "none";
      if (showWillowRow) {
        renderStatusIcons(statusWillow, partyStatus?.willow ?? [], statusTime);
      } else {
        renderStatusIcons(statusWillow, [], statusTime);
      }
      mpLine.textContent = supportText ? `${supportText}  MP ${Math.round(safeMp)}/${safeMaxMp}` : `MP ${Math.round(safeMp)}/${safeMaxMp}`;
      mpFill.style.width = `${(mpRatio * 100).toFixed(1)}%`;
      mpLine.style.display = showMp ? "block" : "none";
      mpBar.style.display = showMp ? "block" : "none";
      willowMpLine.textContent = `Willow MP ${Math.round(safeWillowMp)}/${safeWillowMaxMp}`;
      willowMpFill.style.width = `${(willowMpRatio * 100).toFixed(1)}%`;
      willowMpLine.style.display = showWillowMp ? "block" : "none";
      willowMpBar.style.display = showWillowMp ? "block" : "none";
      lootCounter.textContent = `Orbs gathered: ${lootCount}`;
      moteCounter.textContent = `Verdant motes: ${verdantMoteCount}`;
      relicCounter.textContent = `Relic shards: ${relicShardCount}`;
      anomalyStatus.textContent = "Verdant anomaly nearby";
      anomalyStatus.style.display = anomalyNearby ? "block" : "none";
      combatIndicator.style.display = combatActive ? "inline-block" : "none";
      if (veinStatusText) {
        veinStatus.textContent = veinStatusText;
        veinStatus.style.display = "inline-block";
      } else {
        veinStatus.style.display = "none";
      }
      if (questText) {
        questLine.textContent = questText;
        questLine.style.display = "inline-block";
      } else {
        questLine.style.display = "none";
      }
      if (sunder?.active && Number.isFinite(Number(sunder.value))) {
        const ratio = Math.max(0, Math.min(1, Number(sunder.value) || 0));
        sunderLine.style.display = "block";
        sunderBar.style.display = "block";
        sunderLine.textContent = `${String(sunder.label || "SUNDER METER")} ${Math.round(ratio * 100)}%`;
        sunderFill.style.width = `${(ratio * 100).toFixed(1)}%`;
      } else {
        sunderLine.style.display = "none";
        sunderBar.style.display = "none";
      }
      if (breach?.active && Number.isFinite(Number(breach.value))) {
        const ratio = Math.max(0, Math.min(1, Number(breach.value) || 0));
        breachLine.style.display = "block";
        breachBar.style.display = "block";
        breachLine.textContent = `${String(breach.label || "BREACH METER")} ${Math.round(ratio * 100)}%`;
        breachFill.style.width = `${(ratio * 100).toFixed(1)}%`;
      } else {
        breachLine.style.display = "none";
        breachBar.style.display = "none";
      }
      if (memoryPressure?.active && Number.isFinite(Number(memoryPressure.value))) {
        const ratio = Math.max(0, Math.min(1, Number(memoryPressure.value) || 0));
        memoryPressureLine.style.display = "block";
        memoryPressureBar.style.display = "block";
        memoryPressureLine.textContent = `${String(memoryPressure.label || "MEMORY PRESSURE")} ${Math.round(ratio * 100)}%`;
        memoryPressureFill.style.width = `${(ratio * 100).toFixed(1)}%`;
      } else {
        memoryPressureLine.style.display = "none";
        memoryPressureBar.style.display = "none";
      }
      if (riftStability?.active && Number.isFinite(Number(riftStability.value))) {
        const ratio = Math.max(0, Math.min(1, Number(riftStability.value) || 0));
        riftStabilityLine.style.display = "block";
        riftStabilityBar.style.display = "block";
        riftStabilityLine.textContent = `${String(riftStability.label || "RIFT STABILITY")} ${Math.round(ratio * 100)}%`;
        riftStabilityFill.style.width = `${(ratio * 100).toFixed(1)}%`;
      } else {
        riftStabilityLine.style.display = "none";
        riftStabilityBar.style.display = "none";
      }
      if (clampStatus?.active) {
        clampStatusLine.style.display = "block";
        clampStatusLine.textContent = String(clampStatus.text || "");
      } else {
        clampStatusLine.style.display = "none";
      }
      if (transient) {
        transientMessage.textContent = transient;
        transientMessage.style.display = "block";
      } else {
        transientMessage.style.display = "none";
      }
      if (stabilityMessage) {
        stabilityToast.textContent = stabilityMessage;
        stabilityToast.style.display = "block";
      } else {
        stabilityToast.style.display = "none";
      }
      if (interactionPrompt) {
        interactPrompt.textContent = interactionPrompt;
        interactPrompt.style.display = "block";
      } else {
        interactPrompt.style.display = "none";
      }
      ashGateMarker.style.display = showAshGateMarker ? "block" : "none";
      ridgeGateMarker.style.display = showRidgeGateMarker ? "block" : "none";

      if (target?.active) {
        const safeTargetMax = Math.max(1, Number(target.maxHp ?? target.maxHP) || 1);
        const safeTargetHp = Math.max(0, Number(target.hp) || 0);
        const safeTargetRatio = Math.max(0, Math.min(1, safeTargetHp / safeTargetMax));
        targetHud.style.display = "block";
        targetName.textContent = target.name || "Target";
        targetFill.style.width = `${(safeTargetRatio * 100).toFixed(1)}%`;
        targetHpLine.textContent = `HP ${Math.round(safeTargetHp)}/${safeTargetMax}`;
        renderStatusIcons(statusTarget, targetStatus ?? [], statusTime);
      } else {
        targetHud.style.display = "none";
        renderStatusIcons(statusTarget, [], statusTime);
      }

      if (boss?.active) {
        const safeBossMax = Math.max(1, Number(boss.maxHP) || 1);
        const safeBossHp = Math.max(0, Number(boss.hp) || 0);
        const safeBossRatio = Math.max(
          0,
          Math.min(1, Number.isFinite(Number(boss.hpRatio)) ? Number(boss.hpRatio) : safeBossHp / safeBossMax)
        );
        bossHud.style.display = "block";
        bossName.textContent = boss.name || "Boss";
        bossPhase.textContent = boss.phaseLabel ? `Phase: ${boss.phaseLabel}` : "";
        bossHp.style.width = `${(safeBossRatio * 100).toFixed(1)}%`;
        if (boss.extraction && Number.isFinite(Number(boss.extraction.value))) {
          const extractionRatio = Math.max(0, Math.min(1, Number(boss.extraction.value) || 0));
          bossExtractionLine.style.display = "block";
          bossExtractionBar.style.display = "block";
          bossExtractionLine.textContent = `${boss.extraction.label || "Extraction"} ${Math.round(extractionRatio * 100)}%`;
          bossExtractionFill.style.width = `${(extractionRatio * 100).toFixed(1)}%`;
        } else {
          bossExtractionLine.style.display = "none";
          bossExtractionBar.style.display = "none";
        }
        bossHpLine.textContent = `HP ${Math.round(safeBossHp)}/${safeBossMax}`;
      } else {
        bossHud.style.display = "none";
        bossExtractionLine.style.display = "none";
        bossExtractionBar.style.display = "none";
      }
    },
    updateChargeBar({ value, visible, screenX, screenY }) {
      const clamped = Math.max(0, Math.min(1, value));
      chargeFill.style.width = `${(clamped * 100).toFixed(1)}%`;

      const shouldShow = visible || clamped > 0.01;
      chargeRoot.style.visibility = shouldShow ? "visible" : "hidden";
      chargeRoot.style.opacity = shouldShow ? "0.95" : "0";
      if (shouldShow) {
        chargeRoot.style.left = `${screenX}px`;
        chargeRoot.style.top = `${screenY - 54}px`;
      }
    },
    setHazeOpacity(opacity) {
      hazeOverlay.style.opacity = opacity.toFixed(3);
    },
    setVisible(visible) {
      hudRoot.style.display = visible ? "block" : "none";
      chargeRoot.style.display = visible ? "block" : "none";
      if (!visible) {
        bossHud.style.display = "none";
        bossExtractionLine.style.display = "none";
        bossExtractionBar.style.display = "none";
        targetHud.style.display = "none";
      }
      versionLabel.style.opacity = visible ? "0.55" : "0.42";
    },
    destroy() {
      hudRoot.remove();
      bossHud.remove();
      targetHud.remove();
      hazeOverlay.remove();
      chargeRoot.remove();
      versionLabel.remove();
    },
  };
}
