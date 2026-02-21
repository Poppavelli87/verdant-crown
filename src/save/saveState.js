const SAVE_VERSION = 2;
const SLOT_SCHEMA_VERSION = 1;
const SLOT_COUNT = 5;
const STORAGE_KEY = "verdant-crown-save-v1";
const LEGACY_STORAGE_KEY = "threejs-rpg-save-v1";
const SLOT_METADATA_KEY = "verdantCrown.saveSlots";
const SLOT_ACTIVE_KEY = "verdantCrown.activeSlot";
const SLOT_MIGRATED_KEY = "verdantCrown.slotMigrationDone";

function getSlotStorageKey(slotIndex) {
  return `verdantCrown.saveSlot.${slotIndex}`;
}

function getDefaultSlotName(slotIndex) {
  return `Save ${slotIndex}`;
}

function createDefaultSlotMeta(slotIndex) {
  return {
    slot: slotIndex,
    name: getDefaultSlotName(slotIndex),
    occupied: false,
    timestamp: null,
    sceneId: "",
    objectiveId: "",
    schemaVersion: SLOT_SCHEMA_VERSION,
  };
}

function createDefaultSlotList() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => createDefaultSlotMeta(index + 1));
}

function createDefaultData() {
  return {
    version: SAVE_VERSION,
    lastSceneId: "thornmere",
    playerPositions: {},
    safeSpots: {},
    crownMoodScore: 0,
    playerUpgrades: {
      maxHpLevel: 0,
      chargeSpeedLevel: 0,
      moveSpeedLevel: 0,
      relicAttunementLevel: 0,
    },
    willowState: {
      activeStance: "ruby",
      autoStanceEnabled: true,
    },
    banterState: {
      frequency: "high",
      completedTopics: [],
      topicCursor: 0,
      guidanceCursorByCategory: {},
      quipCursorBySpeaker: {},
    },
    relicShards: 0,
    flags: {},
    storyFlags: {},
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function shouldSkipPersist() {
  return typeof window !== "undefined" && Boolean(window.__verdant_skip_save_on_unload);
}

function normalizeData(parsed) {
  const data = {
    ...createDefaultData(),
    ...(parsed ?? {}),
    version: SAVE_VERSION,
    playerPositions: parsed?.playerPositions ?? {},
    safeSpots: parsed?.safeSpots ?? {},
    crownMoodScore: Math.max(-100, Math.min(100, Number(parsed?.crownMoodScore) || 0)),
    playerUpgrades: {
      ...createDefaultData().playerUpgrades,
      ...(parsed?.playerUpgrades ?? {}),
    },
    willowState: {
      ...createDefaultData().willowState,
      ...(parsed?.willowState ?? {}),
    },
    banterState: {
      ...createDefaultData().banterState,
      ...(parsed?.banterState ?? {}),
    },
    relicShards: Math.max(0, Number(parsed?.relicShards) || 0),
    flags: parsed?.flags ?? {},
    storyFlags: parsed?.storyFlags ?? {},
  };

  const stance = String(data.willowState.activeStance ?? "ruby").toLowerCase();
  data.willowState.activeStance = stance === "emerald" || stance === "sapphire" || stance === "ruby" ? stance : "ruby";
  data.willowState.autoStanceEnabled = data.willowState.autoStanceEnabled !== false;
  const banterFrequency = String(data.banterState.frequency ?? "high").toLowerCase();
  data.banterState.frequency =
    banterFrequency === "low" || banterFrequency === "normal" || banterFrequency === "high" ? banterFrequency : "high";
  data.banterState.completedTopics = Array.isArray(data.banterState.completedTopics)
    ? data.banterState.completedTopics
        .map((entry) => String(entry ?? "").trim().toLowerCase())
        .filter((entry) => entry.length > 0)
    : [];
  data.banterState.topicCursor = Math.max(0, Math.floor(Number(data.banterState.topicCursor) || 0));
  data.banterState.guidanceCursorByCategory =
    data.banterState.guidanceCursorByCategory && typeof data.banterState.guidanceCursorByCategory === "object"
      ? data.banterState.guidanceCursorByCategory
      : {};
  data.banterState.quipCursorBySpeaker =
    data.banterState.quipCursorBySpeaker && typeof data.banterState.quipCursorBySpeaker === "object"
      ? data.banterState.quipCursorBySpeaker
      : {};

  if (typeof data.flags["story.intro_spoken"] === "boolean" && data.storyFlags.intro_spoken === undefined) {
    data.storyFlags.intro_spoken = data.flags["story.intro_spoken"];
  }
  return data;
}

function parseSlotIndex(slotIndex) {
  const next = Math.max(1, Math.min(SLOT_COUNT, Math.floor(Number(slotIndex) || 1)));
  return next;
}

function normalizeSlotMetaList(rawList) {
  const defaults = createDefaultSlotList();
  if (!Array.isArray(rawList)) return defaults;
  return defaults.map((entry, index) => {
    const source = rawList[index] && typeof rawList[index] === "object" ? rawList[index] : {};
    return {
      ...entry,
      name: String(source.name ?? entry.name).slice(0, 32),
      occupied: Boolean(source.occupied),
      timestamp: source.timestamp ? String(source.timestamp) : null,
      sceneId: String(source.sceneId ?? ""),
      objectiveId: String(source.objectiveId ?? ""),
      schemaVersion: SLOT_SCHEMA_VERSION,
    };
  });
}

export class SaveState {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.data = createDefaultData();
    this.hasPersistedData = false;
    this.slotMeta = createDefaultSlotList();
    this.activeSlot = 1;
    this.load();
  }

  load() {
    this.slotMeta = this.readSlotMeta();
    this.activeSlot = this.readActiveSlot();
    this.migrateLegacySaveIfNeeded();
    this.loadActiveSlotData();
  }

  loadActiveSlotData() {
    const slotData = this.readSlotData(this.activeSlot);
    if (slotData) {
      this.data = normalizeData(slotData);
      this.hasPersistedData = true;
      return;
    }

    const raw = this.storage.getItem(STORAGE_KEY) ?? this.storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      this.data = createDefaultData();
      this.hasPersistedData = false;
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || (parsed.version !== 1 && parsed.version !== SAVE_VERSION)) {
        this.data = createDefaultData();
        this.hasPersistedData = false;
        return;
      }
      this.data = normalizeData(parsed);
      this.hasPersistedData = true;
    } catch {
      this.data = createDefaultData();
      this.hasPersistedData = false;
    }
  }

  readSlotMeta() {
    try {
      const raw = this.storage.getItem(SLOT_METADATA_KEY);
      if (!raw) return createDefaultSlotList();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.schemaVersion !== SLOT_SCHEMA_VERSION) {
        return createDefaultSlotList();
      }
      return normalizeSlotMetaList(parsed.slots);
    } catch {
      return createDefaultSlotList();
    }
  }

  persistSlotMeta() {
    this.storage.setItem(
      SLOT_METADATA_KEY,
      JSON.stringify({
        schemaVersion: SLOT_SCHEMA_VERSION,
        slots: this.slotMeta,
      })
    );
  }

  readActiveSlot() {
    return parseSlotIndex(this.storage.getItem(SLOT_ACTIVE_KEY));
  }

  setActiveSlot(slotIndex) {
    this.activeSlot = parseSlotIndex(slotIndex);
    this.storage.setItem(SLOT_ACTIVE_KEY, String(this.activeSlot));
    return this.activeSlot;
  }

  readSlotData(slotIndex) {
    try {
      const raw = this.storage.getItem(getSlotStorageKey(parseSlotIndex(slotIndex)));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || (parsed.version !== 1 && parsed.version !== SAVE_VERSION)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  writeSlotData(slotIndex, data = this.data) {
    const resolvedSlot = parseSlotIndex(slotIndex);
    const normalized = normalizeData(data);
    this.storage.setItem(getSlotStorageKey(resolvedSlot), JSON.stringify(normalized));
    const storyFlags = normalized.storyFlags ?? {};
    const objective = storyFlags.current_objective ?? normalized.flags?.["story.current_objective"] ?? "";
    this.slotMeta[resolvedSlot - 1] = {
      ...this.slotMeta[resolvedSlot - 1],
      occupied: true,
      timestamp: new Date().toISOString(),
      sceneId: String(normalized.lastSceneId ?? ""),
      objectiveId: String(objective ?? ""),
      schemaVersion: SLOT_SCHEMA_VERSION,
    };
    this.persistSlotMeta();
    this.storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    this.hasPersistedData = true;
    return normalized;
  }

  hasAnySlotData() {
    return this.slotMeta.some((slot) => slot.occupied) || Array.from({ length: SLOT_COUNT }).some((_, index) => {
      const raw = this.storage.getItem(getSlotStorageKey(index + 1));
      return Boolean(raw);
    });
  }

  migrateLegacySaveIfNeeded() {
    if (this.storage.getItem(SLOT_MIGRATED_KEY) === "1") return;
    if (this.hasAnySlotData()) {
      this.storage.setItem(SLOT_MIGRATED_KEY, "1");
      return;
    }
    const raw = this.storage.getItem(STORAGE_KEY) ?? this.storage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      this.storage.setItem(SLOT_MIGRATED_KEY, "1");
      this.persistSlotMeta();
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || (parsed.version !== 1 && parsed.version !== SAVE_VERSION)) {
        this.storage.setItem(SLOT_MIGRATED_KEY, "1");
        this.persistSlotMeta();
        return;
      }
      this.writeSlotData(1, parsed);
      this.storage.setItem(SLOT_MIGRATED_KEY, "1");
    } catch {
      this.storage.setItem(SLOT_MIGRATED_KEY, "1");
    }
  }

  getSlotSummaries() {
    return this.slotMeta.map((slot) => ({ ...slot }));
  }

  renameSlot(slotIndex, name) {
    const resolvedSlot = parseSlotIndex(slotIndex);
    const current = this.slotMeta[resolvedSlot - 1];
    this.slotMeta[resolvedSlot - 1] = {
      ...current,
      name: String(name ?? "").trim().slice(0, 32) || getDefaultSlotName(resolvedSlot),
    };
    this.persistSlotMeta();
    return { ...this.slotMeta[resolvedSlot - 1] };
  }

  saveToSlot(slotIndex, data = this.data) {
    const resolvedSlot = parseSlotIndex(slotIndex);
    const payload = this.writeSlotData(resolvedSlot, data);
    if (resolvedSlot === this.activeSlot) {
      this.data = payload;
    }
    return { ...this.slotMeta[resolvedSlot - 1] };
  }

  loadFromSlot(slotIndex) {
    const resolvedSlot = parseSlotIndex(slotIndex);
    const data = this.readSlotData(resolvedSlot);
    if (!data) return false;
    this.setActiveSlot(resolvedSlot);
    this.data = normalizeData(data);
    this.hasPersistedData = true;
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    return true;
  }

  deleteSlot(slotIndex) {
    const resolvedSlot = parseSlotIndex(slotIndex);
    this.storage.removeItem(getSlotStorageKey(resolvedSlot));
    const current = this.slotMeta[resolvedSlot - 1];
    this.slotMeta[resolvedSlot - 1] = {
      ...current,
      occupied: false,
      timestamp: null,
      sceneId: "",
      objectiveId: "",
      schemaVersion: SLOT_SCHEMA_VERSION,
    };
    this.persistSlotMeta();
    if (resolvedSlot === this.activeSlot) {
      this.data = createDefaultData();
      this.hasPersistedData = false;
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
    return { ...this.slotMeta[resolvedSlot - 1] };
  }

  persist() {
    if (shouldSkipPersist()) {
      return;
    }
    this.writeSlotData(this.activeSlot, this.data);
  }

  getLastSceneId() {
    return this.data.lastSceneId || "thornmere";
  }

  setLastSceneId(sceneId) {
    this.data.lastSceneId = sceneId;
    this.persist();
  }

  getPlayerPosition(sceneId) {
    const position = this.data.playerPositions[sceneId];
    if (!position) return null;
    if (typeof position.x !== "number" || typeof position.z !== "number") return null;
    return { x: position.x, z: position.z };
  }

  setPlayerPosition(sceneId, position) {
    this.data.playerPositions[sceneId] = {
      x: Number(position.x.toFixed(3)),
      z: Number(position.z.toFixed(3)),
    };
    this.persist();
  }

  getSafeSpot(sceneId) {
    const safeSpot = this.data.safeSpots[sceneId];
    if (!safeSpot) return null;
    if (typeof safeSpot.x !== "number" || typeof safeSpot.z !== "number") return null;
    return { x: safeSpot.x, z: safeSpot.z };
  }

  setSafeSpot(sceneId, position) {
    this.data.safeSpots[sceneId] = {
      x: Number(position.x.toFixed(3)),
      z: Number(position.z.toFixed(3)),
    };
    this.persist();
  }

  getCrownMoodScore() {
    return Math.max(-100, Math.min(100, Number(this.data.crownMoodScore) || 0));
  }

  setCrownMoodScore(value) {
    this.data.crownMoodScore = Math.max(-100, Math.min(100, Number(value) || 0));
    this.persist();
    return this.data.crownMoodScore;
  }

  getPlayerUpgrades() {
    return {
      ...createDefaultData().playerUpgrades,
      ...(this.data.playerUpgrades ?? {}),
    };
  }

  setPlayerUpgrades(nextUpgrades) {
    this.data.playerUpgrades = {
      ...createDefaultData().playerUpgrades,
      ...(nextUpgrades ?? {}),
    };
    this.persist();
  }

  incrementPlayerUpgrade(upgradeKey, amount = 1) {
    const key = String(upgradeKey ?? "");
    if (!Object.prototype.hasOwnProperty.call(createDefaultData().playerUpgrades, key)) {
      return this.getPlayerUpgrades();
    }
    const step = Math.max(0, Number(amount) || 0);
    const current = this.getPlayerUpgrades();
    current[key] = Math.max(0, Math.round(current[key] + step));
    this.setPlayerUpgrades(current);
    return current;
  }

  getRelicShards() {
    return Math.max(0, Number(this.data.relicShards) || 0);
  }

  setRelicShards(value) {
    this.data.relicShards = Math.max(0, Math.floor(Number(value) || 0));
    this.persist();
    return this.data.relicShards;
  }

  addRelicShards(amount = 0) {
    const delta = Math.floor(Number(amount) || 0);
    const next = Math.max(0, this.getRelicShards() + delta);
    return this.setRelicShards(next);
  }

  getWillowState() {
    const raw = this.data.willowState ?? createDefaultData().willowState;
    const stance = String(raw.activeStance ?? "ruby").toLowerCase();
    return {
      activeStance: stance === "emerald" || stance === "sapphire" || stance === "ruby" ? stance : "ruby",
      autoStanceEnabled: raw.autoStanceEnabled !== false,
    };
  }

  setWillowState(nextState = {}) {
    const resolved = {
      ...this.getWillowState(),
      ...(nextState ?? {}),
    };
    const stance = String(resolved.activeStance ?? "ruby").toLowerCase();
    this.data.willowState = {
      activeStance: stance === "emerald" || stance === "sapphire" || stance === "ruby" ? stance : "ruby",
      autoStanceEnabled: resolved.autoStanceEnabled !== false,
    };
    this.persist();
    return this.getWillowState();
  }

  getWillowStance() {
    return this.getWillowState().activeStance;
  }

  setWillowStance(stance) {
    return this.setWillowState({ activeStance: stance }).activeStance;
  }

  getWillowAutoStanceEnabled() {
    return this.getWillowState().autoStanceEnabled;
  }

  setWillowAutoStanceEnabled(enabled) {
    return this.setWillowState({ autoStanceEnabled: Boolean(enabled) }).autoStanceEnabled;
  }

  getBanterState() {
    const raw = this.data.banterState ?? createDefaultData().banterState;
    const frequency = String(raw.frequency ?? "high").toLowerCase();
    return {
      frequency: frequency === "low" || frequency === "normal" || frequency === "high" ? frequency : "high",
      completedTopics: Array.isArray(raw.completedTopics)
        ? raw.completedTopics
            .map((entry) => String(entry ?? "").trim().toLowerCase())
            .filter((entry) => entry.length > 0)
        : [],
      topicCursor: Math.max(0, Math.floor(Number(raw.topicCursor) || 0)),
      guidanceCursorByCategory:
        raw.guidanceCursorByCategory && typeof raw.guidanceCursorByCategory === "object"
          ? { ...raw.guidanceCursorByCategory }
          : {},
      quipCursorBySpeaker:
        raw.quipCursorBySpeaker && typeof raw.quipCursorBySpeaker === "object"
          ? { ...raw.quipCursorBySpeaker }
          : {},
    };
  }

  setBanterState(nextState = {}) {
    const resolved = {
      ...this.getBanterState(),
      ...(nextState ?? {}),
    };
    const frequency = String(resolved.frequency ?? "high").toLowerCase();
    this.data.banterState = {
      frequency: frequency === "low" || frequency === "normal" || frequency === "high" ? frequency : "high",
      completedTopics: Array.isArray(resolved.completedTopics)
        ? resolved.completedTopics
            .map((entry) => String(entry ?? "").trim().toLowerCase())
            .filter((entry) => entry.length > 0)
        : [],
      topicCursor: Math.max(0, Math.floor(Number(resolved.topicCursor) || 0)),
      guidanceCursorByCategory:
        resolved.guidanceCursorByCategory && typeof resolved.guidanceCursorByCategory === "object"
          ? { ...resolved.guidanceCursorByCategory }
          : {},
      quipCursorBySpeaker:
        resolved.quipCursorBySpeaker && typeof resolved.quipCursorBySpeaker === "object"
          ? { ...resolved.quipCursorBySpeaker }
          : {},
    };
    this.persist();
    return this.getBanterState();
  }

  getFlags() {
    return cloneJson(this.data.flags);
  }

  getFlag(flagKey) {
    return this.data.flags[flagKey];
  }

  setFlag(flagKey, value) {
    this.data.flags[flagKey] = value;
    this.persist();
  }

  getStoryFlags() {
    return cloneJson(this.data.storyFlags);
  }

  getStoryFlag(flagKey) {
    return this.data.storyFlags[flagKey];
  }

  setStoryFlag(flagKey, value) {
    this.data.storyFlags[flagKey] = value;
    this.persist();
  }

  clear() {
    this.data = createDefaultData();
    this.slotMeta = createDefaultSlotList();
    this.activeSlot = 1;
    this.storage.removeItem(STORAGE_KEY);
    this.storage.removeItem(LEGACY_STORAGE_KEY);
    this.storage.removeItem(SLOT_METADATA_KEY);
    this.storage.removeItem(SLOT_ACTIVE_KEY);
    this.storage.removeItem(SLOT_MIGRATED_KEY);
    for (let index = 1; index <= SLOT_COUNT; index += 1) {
      this.storage.removeItem(getSlotStorageKey(index));
    }
    this.hasPersistedData = false;
  }

  hasPersistedSave() {
    return this.hasPersistedData;
  }
}
