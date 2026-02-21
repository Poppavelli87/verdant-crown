const SLOT_COUNT = 5;

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function createPauseMenu({
  getSlots,
  onResume,
  onSave,
  onLoad,
  onDelete,
  onRename,
  onReturnToTitle = null,
} = {}) {
  const root = document.createElement("div");
  root.dataset.testid = "pause-menu";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.background = "rgba(7, 11, 9, 0.65)";
  root.style.zIndex = "45";
  root.style.display = "none";
  root.style.alignItems = "flex-start";
  root.style.justifyContent = "center";
  root.style.paddingTop = "42px";
  root.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';

  const panel = document.createElement("div");
  panel.style.width = "min(94vw, 760px)";
  panel.style.maxHeight = "86vh";
  panel.style.overflowY = "auto";
  panel.style.background = "rgba(12, 17, 14, 0.93)";
  panel.style.border = "2px solid rgba(186, 217, 166, 0.78)";
  panel.style.boxShadow = "0 0 0 2px rgba(21, 30, 23, 0.95) inset";
  panel.style.padding = "12px";
  panel.style.color = "#e9f3e5";

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.gap = "8px";
  topRow.style.flexWrap = "wrap";
  topRow.style.marginBottom = "10px";

  function createActionButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.style.background = "rgba(40, 58, 44, 0.9)";
    button.style.border = "1px solid rgba(172, 215, 170, 0.6)";
    button.style.color = "#ebf8e7";
    button.style.padding = "6px 10px";
    button.style.fontSize = "12px";
    button.style.borderRadius = "4px";
    button.style.cursor = "pointer";
    button.addEventListener("click", onClick);
    return button;
  }

  topRow.append(
    createActionButton("Resume", () => onResume?.()),
    createActionButton("Save Game", () => slotsContainer.scrollIntoView({ block: "start", behavior: "smooth" })),
    createActionButton("Load Game", () => slotsContainer.scrollIntoView({ block: "start", behavior: "smooth" })),
    createActionButton("Settings", () => {})
  );

  if (typeof onReturnToTitle === "function") {
    topRow.append(createActionButton("Return to Title", () => onReturnToTitle()));
  }

  const heading = document.createElement("div");
  heading.textContent = "Save Slots";
  heading.style.fontSize = "13px";
  heading.style.opacity = "0.9";
  heading.style.marginBottom = "8px";

  const slotsContainer = document.createElement("div");
  slotsContainer.style.display = "grid";
  slotsContainer.style.gap = "8px";

  const slotRows = [];

  function buildSlotRow(index) {
    const row = document.createElement("div");
    row.dataset.testid = `slot-${index}`;
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr auto";
    row.style.gap = "8px";
    row.style.padding = "8px";
    row.style.background = "rgba(24, 32, 27, 0.85)";
    row.style.border = "1px solid rgba(110, 143, 109, 0.6)";
    row.style.borderRadius = "4px";

    const left = document.createElement("div");
    left.style.display = "grid";
    left.style.gap = "5px";

    const nameInput = document.createElement("input");
    nameInput.dataset.testid = `slot-name-${index}`;
    nameInput.type = "text";
    nameInput.maxLength = 32;
    nameInput.style.background = "rgba(9, 14, 11, 0.8)";
    nameInput.style.border = "1px solid rgba(150, 190, 145, 0.5)";
    nameInput.style.color = "#ebf8e7";
    nameInput.style.padding = "5px 6px";
    nameInput.style.borderRadius = "3px";
    nameInput.addEventListener("change", () => onRename?.(index, nameInput.value));

    const meta = document.createElement("div");
    meta.style.fontSize = "11px";
    meta.style.opacity = "0.84";

    const summary = document.createElement("div");
    summary.style.fontSize = "11px";
    summary.style.opacity = "0.8";

    left.append(nameInput, meta, summary);

    const right = document.createElement("div");
    right.style.display = "grid";
    right.style.gridAutoFlow = "row";
    right.style.gap = "5px";

    const saveButton = createActionButton("Save", () => onSave?.(index));
    saveButton.dataset.testid = `slot-save-${index}`;
    const loadButton = createActionButton("Load", () => onLoad?.(index));
    loadButton.dataset.testid = `slot-load-${index}`;
    const deleteButton = createActionButton("Delete", () => onDelete?.(index));
    deleteButton.dataset.testid = `slot-delete-${index}`;
    right.append(saveButton, loadButton, deleteButton);

    row.append(left, right);
    slotsContainer.append(row);

    slotRows[index - 1] = { row, nameInput, meta, summary, loadButton, deleteButton };
  }

  for (let slot = 1; slot <= SLOT_COUNT; slot += 1) {
    buildSlotRow(slot);
  }

  const confirmModal = document.createElement("div");
  confirmModal.dataset.testid = "overwrite-confirm";
  confirmModal.id = "overwrite-confirm-modal";
  confirmModal.style.position = "fixed";
  confirmModal.style.left = "50%";
  confirmModal.style.top = "50%";
  confirmModal.style.transform = "translate(-50%, -50%)";
  confirmModal.style.padding = "10px";
  confirmModal.style.background = "rgba(8, 12, 10, 0.97)";
  confirmModal.style.border = "1px solid rgba(184, 216, 169, 0.75)";
  confirmModal.style.display = "none";
  confirmModal.style.zIndex = "52";

  const confirmText = document.createElement("div");
  confirmText.style.fontSize = "12px";
  confirmText.style.marginBottom = "8px";
  const confirmActions = document.createElement("div");
  confirmActions.style.display = "flex";
  confirmActions.style.gap = "6px";
  const confirmYes = createActionButton("Confirm", () => {
    confirmModal.style.display = "none";
    const action = confirmModalAction;
    confirmModalAction = null;
    action?.();
  });
  confirmYes.id = "overwrite-confirm-yes";
  const confirmNo = createActionButton("Cancel", () => {
    confirmModal.style.display = "none";
    confirmModalAction = null;
  });
  confirmNo.id = "overwrite-confirm-cancel";
  confirmActions.append(confirmYes, confirmNo);
  confirmModal.append(confirmText, confirmActions);

  panel.append(topRow, heading, slotsContainer);
  root.append(panel, confirmModal);

  const mobileButton = createActionButton("☰", () => {
    if (state.open) {
      close();
    } else {
      open();
    }
  });
  mobileButton.dataset.testid = "menu-button";
  mobileButton.style.position = "fixed";
  mobileButton.style.top = "10px";
  mobileButton.style.right = "10px";
  mobileButton.style.zIndex = "44";
  mobileButton.style.pointerEvents = "auto";
  mobileButton.style.padding = "5px 8px";
  mobileButton.style.opacity = "0.86";

  document.body.append(root, mobileButton);

  let confirmModalAction = null;
  const state = {
    open: false,
  };

  function refresh() {
    const slots = Array.isArray(getSlots?.()) ? getSlots() : [];
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const slot = slots[index] ?? { slot: index + 1, name: `Save ${index + 1}` };
      const row = slotRows[index];
      row.nameInput.value = slot.name ?? `Save ${index + 1}`;
      row.meta.textContent = `Updated: ${formatTimestamp(slot.timestamp)}`;
      row.summary.textContent = slot.occupied
        ? `Scene: ${slot.sceneId || "unknown"} • Objective: ${slot.objectiveId || "none"}`
        : "Empty slot";
      row.loadButton.disabled = !slot.occupied;
      row.deleteButton.disabled = !slot.occupied;
      row.row.style.opacity = slot.occupied ? "1" : "0.8";
    }
  }

  function open() {
    refresh();
    state.open = true;
    root.style.display = "flex";
  }

  function close() {
    state.open = false;
    root.style.display = "none";
    confirmModal.style.display = "none";
    confirmModalAction = null;
  }

  function askConfirm(message, action) {
    confirmText.textContent = message;
    confirmModalAction = action;
    confirmModal.style.display = "block";
  }

  function bindActionGuards() {
    for (let slot = 1; slot <= SLOT_COUNT; slot += 1) {
      const slotNode = slotRows[slot - 1];
      const saveButton = slotNode.row.querySelector(`[data-testid='slot-save-${slot}']`);
      saveButton.onclick = (event) => {
        event.preventDefault();
        const slots = getSlots?.() ?? [];
        const current = slots[slot - 1];
        if (current?.occupied) {
          askConfirm(`Overwrite ${current.name || `Save ${slot}`}?`, () => onSave?.(slot));
          return;
        }
        onSave?.(slot);
      };

      const deleteButton = slotNode.row.querySelector(`[data-testid='slot-delete-${slot}']`);
      deleteButton.onclick = (event) => {
        event.preventDefault();
        const slots = getSlots?.() ?? [];
        const current = slots[slot - 1];
        askConfirm(`Delete ${current?.name || `Save ${slot}`} data?`, () => onDelete?.(slot));
      };
    }
  }

  bindActionGuards();

  return {
    open,
    close,
    refresh,
    toggle: () => (state.open ? close() : open()),
    isOpen: () => state.open,
    getMobileButton: () => mobileButton,
  };
}
