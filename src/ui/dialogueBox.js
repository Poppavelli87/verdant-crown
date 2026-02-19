const CHARS_PER_SECOND = 56;

function cloneScript(scriptArray) {
  if (!Array.isArray(scriptArray)) return [];
  return scriptArray.map((line) => String(line ?? ""));
}

export function createDialogueBox() {
  const root = document.createElement("div");
  root.dataset.testid = "dialogue-root";
  root.style.position = "fixed";
  root.style.left = "50%";
  root.style.bottom = "18px";
  root.style.transform = "translateX(-50%)";
  root.style.width = "min(94vw, 820px)";
  root.style.padding = "12px 14px 10px 14px";
  root.style.background = "rgba(14, 18, 16, 0.9)";
  root.style.border = "2px solid rgba(186, 217, 166, 0.86)";
  root.style.boxShadow = "0 0 0 2px rgba(21, 30, 23, 0.95) inset";
  root.style.pointerEvents = "none";
  root.style.zIndex = "30";
  root.style.display = "none";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  root.style.color = "#edf5e8";
  root.style.textShadow = "0 1px 2px rgba(0, 0, 0, 0.75)";

  const speaker = document.createElement("div");
  speaker.dataset.testid = "dialogue-speaker";
  speaker.style.fontSize = "13px";
  speaker.style.letterSpacing = "0.04em";
  speaker.style.marginBottom = "7px";
  speaker.style.color = "#d4f0bf";

  const line = document.createElement("div");
  line.dataset.testid = "dialogue-text";
  line.style.fontSize = "16px";
  line.style.lineHeight = "1.35";
  line.style.minHeight = "40px";
  line.style.whiteSpace = "pre-wrap";

  const hint = document.createElement("div");
  hint.style.marginTop = "8px";
  hint.style.fontSize = "11px";
  hint.style.opacity = "0.78";
  hint.textContent = "Space / Enter / Tap to continue";

  root.append(speaker, line, hint);
  document.body.appendChild(root);

  const state = {
    open: false,
    speakerName: "",
    script: [],
    lineIndex: 0,
    visibleChars: 0,
    onComplete: null,
    onClose: null,
  };

  function getCurrentLine() {
    return state.script[state.lineIndex] ?? "";
  }

  function render() {
    if (!state.open) {
      root.style.display = "none";
      return;
    }

    root.style.display = "block";
    speaker.textContent = state.speakerName;
    const currentLine = getCurrentLine();
    const clampedChars = Math.max(0, Math.min(currentLine.length, Math.floor(state.visibleChars)));
    line.textContent = currentLine.slice(0, clampedChars);
  }

  function closeDialogue({ completed = false } = {}) {
    const onComplete = completed ? state.onComplete : null;
    const onClose = state.onClose;

    state.open = false;
    state.speakerName = "";
    state.script = [];
    state.lineIndex = 0;
    state.visibleChars = 0;
    state.onComplete = null;
    state.onClose = null;

    render();
    onComplete?.();
    onClose?.();
  }

  function openDialogue(scriptArray, { npcName = "", onComplete = null, onClose = null } = {}) {
    const lines = cloneScript(scriptArray);
    if (lines.length === 0) {
      closeDialogue({ completed: false });
      return false;
    }

    state.open = true;
    state.speakerName = npcName;
    state.script = lines;
    state.lineIndex = 0;
    state.visibleChars = 0;
    state.onComplete = onComplete;
    state.onClose = onClose;
    render();
    return true;
  }

  function update(dtSeconds) {
    if (!state.open) return;

    const currentLine = getCurrentLine();
    if (state.visibleChars < currentLine.length) {
      state.visibleChars = Math.min(currentLine.length, state.visibleChars + CHARS_PER_SECOND * dtSeconds);
      render();
    }
  }

  function advance() {
    if (!state.open) return false;

    const currentLine = getCurrentLine();
    if (state.visibleChars < currentLine.length) {
      state.visibleChars = currentLine.length;
      render();
      return true;
    }

    if (state.lineIndex < state.script.length - 1) {
      state.lineIndex += 1;
      state.visibleChars = 0;
      render();
      return true;
    }

    closeDialogue({ completed: true });
    return true;
  }

  function getState() {
    return {
      open: state.open,
      npcName: state.speakerName,
      lineIndex: state.lineIndex,
      lineCount: state.script.length,
      currentLine: state.open ? getCurrentLine().slice(0, Math.floor(state.visibleChars)) : "",
    };
  }

  function destroy() {
    root.remove();
  }

  return {
    openDialogue,
    closeDialogue,
    update,
    advance,
    isOpen: () => state.open,
    getState,
    destroy,
  };
}
