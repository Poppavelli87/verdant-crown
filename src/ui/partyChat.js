function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createPartyChat() {
  const root = document.createElement("div");
  root.id = "party-chat";
  root.dataset.testid = "party-chat";
  root.style.position = "fixed";
  root.style.left = "12px";
  root.style.bottom = "22px";
  root.style.width = "min(380px, 62vw)";
  root.style.display = "none";
  root.style.flexDirection = "column";
  root.style.gap = "3px";
  root.style.zIndex = "22";
  root.style.pointerEvents = "none";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  root.style.fontSize = "12px";
  root.style.color = "#eaf3e6";
  root.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.8)";
  document.body.appendChild(root);

  let elapsedSeconds = 0;
  const lines = [];
  let nextLineId = 1;

  function render() {
    root.innerHTML = "";
    const visibleLines = lines.slice(-3);
    for (const entry of visibleLines) {
      const line = document.createElement("div");
      line.dataset.testid = "party-chat-line";
      line.style.padding = "2px 6px";
      line.style.border = "1px solid rgba(122, 143, 132, 0.4)";
      line.style.borderRadius = "6px";
      line.style.background = entry.channel === "guidance" ? "rgba(36, 56, 44, 0.72)" : "rgba(22, 36, 28, 0.66)";
      line.style.backdropFilter = "blur(1px)";
      line.style.opacity = String(clamp((entry.expiresAt - elapsedSeconds) / 2, 0.3, 1));
      line.textContent = entry.text;
      root.appendChild(line);
    }
    root.style.display = visibleLines.length > 0 ? "flex" : "none";
  }

  return {
    addLine(text, { channel = "lore", lifetimeSeconds = 10 } = {}) {
      const trimmed = String(text ?? "").trim();
      if (!trimmed) return;
      lines.push({
        id: nextLineId++,
        text: trimmed,
        channel: channel === "guidance" ? "guidance" : "lore",
        createdAt: elapsedSeconds,
        expiresAt: elapsedSeconds + Math.max(3, Number(lifetimeSeconds) || 10),
      });
      if (lines.length > 12) {
        lines.splice(0, lines.length - 12);
      }
      render();
    },
    clear() {
      lines.length = 0;
      render();
    },
    update(dtSeconds = 0, { visible = true, mobileUi = false, portraitsVisible = false } = {}) {
      elapsedSeconds += Math.max(0, Number(dtSeconds) || 0);
      while (lines.length > 0 && lines[0].expiresAt <= elapsedSeconds) {
        lines.shift();
      }
      if (!visible) {
        root.style.display = "none";
        return;
      }
      root.style.bottom = mobileUi && portraitsVisible ? "70px" : "22px";
      render();
    },
    getLines() {
      return lines.slice(-3).map((entry) => ({
        id: entry.id,
        text: entry.text,
        channel: entry.channel,
        remaining: Number(Math.max(0, entry.expiresAt - elapsedSeconds).toFixed(3)),
      }));
    },
    destroy() {
      root.remove();
    },
  };
}
