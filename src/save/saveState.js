const SAVE_VERSION = 1;
const STORAGE_KEY = "verdant-crown-save-v1";
const LEGACY_STORAGE_KEY = "threejs-rpg-save-v1";

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

// SaveState wraps localStorage with a versioned schema for scene/session persistence.
export class SaveState {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.data = createDefaultData();
    this.hasPersistedData = false;
    this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY) ?? this.storage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        this.data = createDefaultData();
        this.hasPersistedData = false;
        return;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SAVE_VERSION) {
        this.data = createDefaultData();
        this.hasPersistedData = false;
        return;
      }

      this.data = {
        ...createDefaultData(),
        ...parsed,
        playerPositions: parsed.playerPositions ?? {},
        safeSpots: parsed.safeSpots ?? {},
        crownMoodScore: Math.max(-100, Math.min(100, Number(parsed.crownMoodScore) || 0)),
        playerUpgrades: {
          ...createDefaultData().playerUpgrades,
          ...(parsed.playerUpgrades ?? {}),
        },
        willowState: {
          ...createDefaultData().willowState,
          ...(parsed.willowState ?? {}),
        },
        banterState: {
          ...createDefaultData().banterState,
          ...(parsed.banterState ?? {}),
        },
        relicShards: Math.max(0, Number(parsed.relicShards) || 0),
        flags: parsed.flags ?? {},
        storyFlags: parsed.storyFlags ?? {},
      };

      const stance = String(this.data.willowState.activeStance ?? "ruby").toLowerCase();
      this.data.willowState.activeStance =
        stance === "emerald" || stance === "sapphire" || stance === "ruby" ? stance : "ruby";
      this.data.willowState.autoStanceEnabled = this.data.willowState.autoStanceEnabled !== false;
      const banterFrequency = String(this.data.banterState.frequency ?? "high").toLowerCase();
      this.data.banterState.frequency =
        banterFrequency === "low" || banterFrequency === "normal" || banterFrequency === "high"
          ? banterFrequency
          : "high";
      this.data.banterState.completedTopics = Array.isArray(this.data.banterState.completedTopics)
        ? this.data.banterState.completedTopics
            .map((entry) => String(entry ?? "").trim().toLowerCase())
            .filter((entry) => entry.length > 0)
        : [];
      this.data.banterState.topicCursor = Math.max(0, Math.floor(Number(this.data.banterState.topicCursor) || 0));
      this.data.banterState.guidanceCursorByCategory =
        this.data.banterState.guidanceCursorByCategory && typeof this.data.banterState.guidanceCursorByCategory === "object"
          ? this.data.banterState.guidanceCursorByCategory
          : {};
      this.data.banterState.quipCursorBySpeaker =
        this.data.banterState.quipCursorBySpeaker && typeof this.data.banterState.quipCursorBySpeaker === "object"
          ? this.data.banterState.quipCursorBySpeaker
          : {};

      if (typeof this.data.flags["story.intro_spoken"] === "boolean" && this.data.storyFlags.intro_spoken === undefined) {
        this.data.storyFlags.intro_spoken = this.data.flags["story.intro_spoken"];
      }
      this.hasPersistedData = true;
    } catch {
      this.data = createDefaultData();
      this.hasPersistedData = false;
    }
  }

  persist() {
    if (shouldSkipPersist()) {
      return;
    }
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.hasPersistedData = true;
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
    this.storage.removeItem(STORAGE_KEY);
    this.storage.removeItem(LEGACY_STORAGE_KEY);
    this.hasPersistedData = false;
  }

  hasPersistedSave() {
    return this.hasPersistedData;
  }
}
