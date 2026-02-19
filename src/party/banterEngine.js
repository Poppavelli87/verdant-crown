import {
  GUIDANCE_BANTER_SETS,
  canUseTopic,
  findTopicById,
  getTravelQuipsForContext,
  getUnlockedTopics,
} from "../story/banterTopics.js";
import { getVoiceProfile } from "../story/voiceProfiles.js";

const BANER_FREQUENCY_VALUES = Object.freeze({
  high: "high",
  normal: "normal",
  low: "low",
});

const LORE_COOLDOWN_MS = Object.freeze({
  [BANER_FREQUENCY_VALUES.high]: 12000,
  [BANER_FREQUENCY_VALUES.normal]: 18000,
  [BANER_FREQUENCY_VALUES.low]: 30000,
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeFrequency(value, fallback = BANER_FREQUENCY_VALUES.high) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === BANER_FREQUENCY_VALUES.low) return BANER_FREQUENCY_VALUES.low;
  if (normalized === BANER_FREQUENCY_VALUES.normal) return BANER_FREQUENCY_VALUES.normal;
  if (normalized === BANER_FREQUENCY_VALUES.high) return BANER_FREQUENCY_VALUES.high;
  return fallback;
}

function normalizeChannel(value, fallback = "guidance") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "lore") return "lore";
  if (normalized === "guidance") return "guidance";
  return fallback;
}

function normalizeObjectiveId(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized || normalized === "none") return "none";
  return normalized;
}

function normalizeCategoryKey(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return "idle";
  if (GUIDANCE_BANTER_SETS[normalized]) return normalized;
  if (normalized === "boss") return "boss_available";
  if (normalized === "ridge") return "ridge_gate";
  if (normalized === "patrol") return "patrol_nearby";
  if (normalized === "crown") return "crown_fractured";
  return "idle";
}

function toSortedUniqueStrings(list) {
  const values = new Set();
  for (const entry of Array.isArray(list) ? list : []) {
    const normalized = String(entry ?? "")
      .trim()
      .toLowerCase();
    if (!normalized) continue;
    values.add(normalized);
  }
  return Array.from(values).sort();
}

function hasSpeaker(context, speakerId = "") {
  return Array.isArray(context?.partyMembersPresent)
    ? context.partyMembersPresent.includes(String(speakerId ?? "").toLowerCase())
    : false;
}

function getSpeakerLabel(speakerId = "") {
  return getVoiceProfile(speakerId).displayName;
}

function buildLineId(scope = "", partA = "", partB = "") {
  return `${scope}:${partA}:${partB}`;
}

function clonePlainObject(value) {
  if (!value || typeof value !== "object") return {};
  return { ...value };
}

export class BanterEngine {
  constructor({
    idleSeconds = 6,
    guidanceCooldownSeconds = 20,
    globalMinGapSeconds = 3.5,
    recentLineMemory = 5,
    threadLineGapSeconds = 2.2,
    initialFrequency = BANER_FREQUENCY_VALUES.high,
    persistentState = null,
  } = {}) {
    this.idleSeconds = Math.max(0, Number(idleSeconds) || 6);
    this.guidanceCooldownMs = Math.max(1000, (Number(guidanceCooldownSeconds) || 20) * 1000);
    this.globalMinGapMs = Math.max(100, (Number(globalMinGapSeconds) || 3.5) * 1000);
    this.threadLineGapMs = Math.max(250, (Number(threadLineGapSeconds) || 2.2) * 1000);
    this.recentLineMemory = Math.max(1, Math.floor(Number(recentLineMemory) || 5));

    this.frequency = normalizeFrequency(initialFrequency);
    this.loreCooldownMs = LORE_COOLDOWN_MS[this.frequency];

    this.completedTopics = new Set();
    this.debugUnlockedTopics = new Set();
    this.guidanceCursorByCategory = {};
    this.quipCursorBySpeaker = {};
    this.topicCursor = 0;

    this.pendingThread = null;
    this.nowMs = 0;
    this.lastAnyLineTimeMs = -Infinity;
    this.lastGuidanceTimeMs = -Infinity;
    this.lastLoreTimeMs = -Infinity;
    this.lastLine = "";
    this.lastLineId = "";
    this.lastSpeakerId = "";
    this.lastTopicId = "";
    this.lastChannel = "";
    this.lastContextKey = "idle";
    this.lastObjectiveId = "none";
    this.lastObjectiveProgressKey = "";
    this.lastGuidanceProgressKey = "";
    this.lastSceneId = "";
    this.escalationLevel = 0;
    this.guidanceTriggerCount = 0;
    this.triggerCount = 0;
    this.recentLineIds = [];
    this._persistenceDirty = false;

    this._debugSnapshot = {
      currentObjective: "none",
      onTrack: false,
      objectiveDistanceNow: null,
      objectiveDistancePrev: null,
      offTrackSeconds: 0,
      idleSeconds: 0,
      travelingSeconds: 0,
    };

    this._restorePersistentState(persistentState);
  }

  _restorePersistentState(state) {
    if (!state || typeof state !== "object") return;
    this.frequency = normalizeFrequency(state.frequency, this.frequency);
    this.loreCooldownMs = LORE_COOLDOWN_MS[this.frequency];

    const completed = Array.isArray(state.completedTopics) ? state.completedTopics : [];
    for (const topicId of completed) {
      const normalized = String(topicId ?? "")
        .trim()
        .toLowerCase();
      if (!normalized) continue;
      this.completedTopics.add(normalized);
    }
    this.topicCursor = Math.max(0, Math.floor(Number(state.topicCursor) || 0));
    this.guidanceCursorByCategory = clonePlainObject(state.guidanceCursorByCategory);
    this.quipCursorBySpeaker = clonePlainObject(state.quipCursorBySpeaker);
  }

  reset({ preserveProgress = true } = {}) {
    this.pendingThread = null;
    this.nowMs = 0;
    this.lastAnyLineTimeMs = -Infinity;
    this.lastGuidanceTimeMs = -Infinity;
    this.lastLoreTimeMs = -Infinity;
    this.lastLine = "";
    this.lastLineId = "";
    this.lastSpeakerId = "";
    this.lastTopicId = "";
    this.lastChannel = "";
    this.lastContextKey = "idle";
    this.lastObjectiveId = "none";
    this.lastObjectiveProgressKey = "";
    this.lastGuidanceProgressKey = "";
    this.lastSceneId = "";
    this.escalationLevel = 0;
    this.guidanceTriggerCount = 0;
    this.triggerCount = 0;
    this.recentLineIds.length = 0;
    this._debugSnapshot = {
      currentObjective: "none",
      onTrack: false,
      objectiveDistanceNow: null,
      objectiveDistancePrev: null,
      offTrackSeconds: 0,
      idleSeconds: 0,
      travelingSeconds: 0,
    };

    if (!preserveProgress) {
      this.completedTopics.clear();
      this.debugUnlockedTopics.clear();
      this.guidanceCursorByCategory = {};
      this.quipCursorBySpeaker = {};
      this.topicCursor = 0;
      this._markPersistDirty();
    }
  }

  _markPersistDirty() {
    this._persistenceDirty = true;
  }

  consumePersistState() {
    if (!this._persistenceDirty) return null;
    this._persistenceDirty = false;
    return this.getPersistentState();
  }

  getPersistentState() {
    return {
      frequency: this.frequency,
      completedTopics: Array.from(this.completedTopics).sort(),
      topicCursor: this.topicCursor,
      guidanceCursorByCategory: clonePlainObject(this.guidanceCursorByCategory),
      quipCursorBySpeaker: clonePlainObject(this.quipCursorBySpeaker),
    };
  }

  setFrequency(mode) {
    const normalized = normalizeFrequency(mode, this.frequency);
    if (normalized === this.frequency) return this.frequency;
    this.frequency = normalized;
    this.loreCooldownMs = LORE_COOLDOWN_MS[this.frequency];
    this._markPersistDirty();
    return this.frequency;
  }

  getFrequency() {
    return this.frequency;
  }

  unlockTopic(topicId = "") {
    const normalized = String(topicId ?? "")
      .trim()
      .toLowerCase();
    if (!normalized) return false;
    this.debugUnlockedTopics.add(normalized);
    this.completedTopics.delete(normalized);
    this._markPersistDirty();
    return true;
  }

  _recordDebugSnapshot(context = {}) {
    this._debugSnapshot = {
      currentObjective: normalizeObjectiveId(context.activeObjective),
      onTrack: Boolean(context.onTrack),
      objectiveDistanceNow:
        Number.isFinite(Number(context.objectiveDistanceNow)) ? Number(context.objectiveDistanceNow) : null,
      objectiveDistancePrev:
        Number.isFinite(Number(context.objectiveDistancePrev)) ? Number(context.objectiveDistancePrev) : null,
      offTrackSeconds: Number(Math.max(0, Number(context.offTrackSeconds) || 0).toFixed(3)),
      idleSeconds: Number(Math.max(0, Number(context.idleSeconds) || 0).toFixed(3)),
      travelingSeconds: Number(Math.max(0, Number(context.travelingSeconds) || 0).toFixed(3)),
    };
  }

  _resolveTimeMs(dtSeconds, context = {}) {
    const worldTimeSeconds = Number(context?.worldTimeSeconds);
    if (Number.isFinite(worldTimeSeconds) && worldTimeSeconds >= 0) {
      this.nowMs = worldTimeSeconds * 1000;
      return this.nowMs;
    }
    this.nowMs += Math.max(0, Number(dtSeconds) || 0) * 1000;
    return this.nowMs;
  }

  _resolveContextKey(context = {}) {
    const forced = normalizeCategoryKey(context.contextOverrideKey ?? context.contextKey);
    if (forced !== "idle") return forced;
    const objectiveKey = normalizeCategoryKey(context.activeObjective);
    if (objectiveKey !== "idle" && objectiveKey !== "none") return objectiveKey;
    if (context.veinActive) return "vein";
    if (context.bossAvailable) return "boss_available";
    if (context.patrolNearby) return "patrol_nearby";
    if (context.ridgeGateUnlocked) return "ridge_gate";
    if (String(context.crownTier ?? "").toLowerCase() === "fractured") return "crown_fractured";
    return "idle";
  }

  _isBlocked(context = {}) {
    return Boolean(context.blocked) || !Boolean(context.enabled);
  }

  _isLineRecent(lineId = "") {
    return this.recentLineIds.includes(lineId);
  }

  _rememberLine(lineId = "") {
    if (!lineId) return;
    this.recentLineIds.push(lineId);
    if (this.recentLineIds.length > this.recentLineMemory) {
      this.recentLineIds.splice(0, this.recentLineIds.length - this.recentLineMemory);
    }
  }

  _canEmitAt(nowMs) {
    return nowMs - this.lastAnyLineTimeMs >= this.globalMinGapMs;
  }

  _emitEvent(event, context = {}) {
    if (!event) return null;
    this.lastAnyLineTimeMs = this.nowMs;
    this.triggerCount += 1;
    this.lastLine = event.text;
    this.lastLineId = event.lineId ?? "";
    this.lastSpeakerId = event.speakerId ?? "";
    this.lastTopicId = event.topicId ?? "";
    this.lastChannel = event.channel ?? "";
    this.lastContextKey = event.contextKey ?? this.lastContextKey;
    this.lastObjectiveId = normalizeObjectiveId(context.activeObjective);
    this.lastObjectiveProgressKey = String(context.objectiveProgressKey ?? "");
    this._rememberLine(this.lastLineId);
    return event;
  }

  _buildEvent({
    channel,
    contextKey,
    speakerId,
    text,
    lineId,
    topicId = "",
    escalationLevel = 0,
    useToast = false,
  }) {
    const normalizedSpeaker = String(speakerId ?? "").trim().toLowerCase();
    const displayText = `${getSpeakerLabel(normalizedSpeaker)}: ${String(text ?? "").trim()}`;
    return {
      channel,
      contextKey,
      speakerId: normalizedSpeaker,
      speakerLabel: getSpeakerLabel(normalizedSpeaker),
      text: String(text ?? "").trim(),
      displayText,
      lineId,
      topicId,
      escalationLevel,
      useToast: Boolean(useToast),
    };
  }

  _selectGuidanceLine(category, context = {}) {
    const entries = Array.isArray(GUIDANCE_BANTER_SETS[category]) && GUIDANCE_BANTER_SETS[category].length > 0
      ? GUIDANCE_BANTER_SETS[category]
      : GUIDANCE_BANTER_SETS.idle;
    const partyPresent = toSortedUniqueStrings(context.partyMembersPresent);
    const inactiveMembers = toSortedUniqueStrings(context.inactiveMembers);
    const preferredSpeakers = inactiveMembers.length > 0 ? inactiveMembers : partyPresent;
    const candidates = entries.filter((entry) => preferredSpeakers.includes(String(entry.speakerId ?? "").toLowerCase()));
    const usableEntries = candidates.length > 0 ? candidates : entries.filter((entry) => hasSpeaker(context, entry.speakerId));
    if (usableEntries.length <= 0) return null;

    const cursorKey = category;
    const start = Math.max(0, Math.floor(Number(this.guidanceCursorByCategory[cursorKey]) || 0)) % usableEntries.length;
    const escalation = clamp(this.escalationLevel, 0, 2);
    for (let offset = 0; offset < usableEntries.length; offset += 1) {
      const index = (start + offset) % usableEntries.length;
      const entry = usableEntries[index];
      const levelIndex = clamp(escalation, 0, Math.max(0, entry.levels.length - 1));
      const text = String(entry.levels[levelIndex] ?? entry.levels[0] ?? "").trim();
      if (!text) continue;
      const lineId = buildLineId("guidance", entry.id, levelIndex);
      if (this._isLineRecent(lineId)) continue;
      this.guidanceCursorByCategory[cursorKey] = (index + 1) % usableEntries.length;
      this._markPersistDirty();
      return {
        speakerId: String(entry.speakerId ?? "arthur").toLowerCase(),
        text,
        lineId,
      };
    }

    const fallback = usableEntries[start];
    const fallbackLevelIndex = clamp(escalation, 0, Math.max(0, fallback.levels.length - 1));
    const fallbackText = String(fallback.levels[fallbackLevelIndex] ?? fallback.levels[0] ?? "").trim();
    if (!fallbackText) return null;
    const fallbackLineId = buildLineId("guidance", fallback.id, fallbackLevelIndex);
    this.guidanceCursorByCategory[cursorKey] = (start + 1) % usableEntries.length;
    this._markPersistDirty();
    return {
      speakerId: String(fallback.speakerId ?? "arthur").toLowerCase(),
      text: fallbackText,
      lineId: fallbackLineId,
    };
  }

  _computeEscalation(category, context = {}) {
    const objectiveId = normalizeObjectiveId(context.activeObjective);
    const progressKey = String(context.objectiveProgressKey ?? "");
    const sceneId = String(context.sceneId ?? "");
    if (sceneId && sceneId !== this.lastSceneId) {
      this.lastSceneId = sceneId;
      this.escalationLevel = 0;
      this.guidanceTriggerCount = 0;
      this.lastGuidanceProgressKey = "";
      return this.escalationLevel;
    }
    if (objectiveId === "none" && category === "idle") {
      this.escalationLevel = 0;
      this.guidanceTriggerCount = 0;
      this.lastGuidanceProgressKey = "";
      return this.escalationLevel;
    }
    if (Boolean(context.onTrack)) {
      this.escalationLevel = 0;
      this.guidanceTriggerCount = 0;
      this.lastGuidanceProgressKey = progressKey;
      return this.escalationLevel;
    }

    const stalled =
      objectiveId !== "none" &&
      objectiveId === this.lastObjectiveId &&
      progressKey &&
      progressKey === this.lastGuidanceProgressKey;
    if (stalled) {
      this.guidanceTriggerCount += 1;
      this.escalationLevel = clamp(this.guidanceTriggerCount, 0, 2);
    } else {
      this.guidanceTriggerCount = 0;
      this.escalationLevel = 0;
    }
    this.lastGuidanceProgressKey = progressKey;
    return this.escalationLevel;
  }

  _triggerGuidance(context = {}, { forced = false } = {}) {
    const category = this._resolveContextKey(context);
    const escalation = this._computeEscalation(category, context);
    const selected = this._selectGuidanceLine(category, context);
    if (!selected) return null;
    this.lastGuidanceTimeMs = this.nowMs;
    if (this.pendingThread) {
      this.pendingThread.nextLineAtMs = Math.max(
        this.pendingThread.nextLineAtMs,
        this.nowMs + this.globalMinGapMs + 200
      );
    }
    return this._buildEvent({
      channel: "guidance",
      contextKey: category,
      speakerId: selected.speakerId,
      text: selected.text,
      lineId: selected.lineId,
      escalationLevel: escalation,
      useToast: true,
      topicId: "",
      forced,
    });
  }

  _selectTopic(context = {}, topicId = "") {
    if (topicId) {
      const exact = findTopicById(topicId);
      if (!exact) return null;
      if (exact.oneTime && this.completedTopics.has(exact.id) && !this.debugUnlockedTopics.has(exact.id)) {
        return null;
      }
      if (!this.debugUnlockedTopics.has(exact.id) && !canUseTopic(exact, context)) return null;
      return exact;
    }

    const unlocked = getUnlockedTopics(context)
      .filter((topic) => !(topic.oneTime && this.completedTopics.has(topic.id)))
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return String(a.id).localeCompare(String(b.id));
      });
    if (unlocked.length <= 0) return null;

    const start = this.topicCursor % unlocked.length;
    for (let offset = 0; offset < unlocked.length; offset += 1) {
      const index = (start + offset) % unlocked.length;
      const topic = unlocked[index];
      const firstLineId = buildLineId("topic", topic.id, 0);
      if (this._isLineRecent(firstLineId)) continue;
      this.topicCursor = (index + 1) % unlocked.length;
      this._markPersistDirty();
      return topic;
    }
    this.topicCursor = (start + 1) % unlocked.length;
    this._markPersistDirty();
    return unlocked[start];
  }

  _beginThread(topic) {
    if (!topic || !Array.isArray(topic.lines) || topic.lines.length <= 0) return;
    this.pendingThread = {
      topicId: topic.id,
      lines: topic.lines.slice(),
      index: 0,
      nextLineAtMs: this.nowMs,
    };
  }

  _emitThreadLine(context = {}) {
    if (!this.pendingThread) return null;
    const line = this.pendingThread.lines[this.pendingThread.index];
    if (!line) {
      this.pendingThread = null;
      return null;
    }
    const speakerId = String(line.speakerId ?? "arthur").toLowerCase();
    const lineId = buildLineId("topic", this.pendingThread.topicId, this.pendingThread.index);
    if (!hasSpeaker(context, speakerId)) {
      this.pendingThread = null;
      return null;
    }

    const event = this._buildEvent({
      channel: "lore",
      contextKey: "lore_topic",
      speakerId,
      text: String(line.text ?? "").trim(),
      lineId,
      topicId: this.pendingThread.topicId,
      escalationLevel: this.escalationLevel,
      useToast: false,
    });

    this.pendingThread.index += 1;
    if (this.pendingThread.index >= this.pendingThread.lines.length) {
      const completedTopicId = this.pendingThread.topicId;
      const topicDefinition = findTopicById(completedTopicId);
      if (topicDefinition?.oneTime) {
        this.completedTopics.add(completedTopicId);
        this._markPersistDirty();
      }
      this.pendingThread = null;
      this.lastTopicId = completedTopicId;
    } else {
      this.pendingThread.nextLineAtMs = this.nowMs + this.threadLineGapMs;
    }

    this.lastLoreTimeMs = this.nowMs;
    return event;
  }

  _selectQuip(context = {}) {
    const available = getTravelQuipsForContext(context);
    if (available.length <= 0) return null;
    const inactive = toSortedUniqueStrings(context.inactiveMembers);
    const speakerPool = inactive.length > 0 ? inactive : toSortedUniqueStrings(context.partyMembersPresent);
    if (speakerPool.length <= 0) return null;

    for (let speakerOffset = 0; speakerOffset < speakerPool.length; speakerOffset += 1) {
      const speakerId = speakerPool[speakerOffset];
      const speakerQuips = available
        .filter((entry) => String(entry.speakerId ?? "").toLowerCase() === speakerId)
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
      if (speakerQuips.length <= 0) continue;
      const cursor = Math.max(0, Math.floor(Number(this.quipCursorBySpeaker[speakerId]) || 0)) % speakerQuips.length;
      for (let offset = 0; offset < speakerQuips.length; offset += 1) {
        const index = (cursor + offset) % speakerQuips.length;
        const quip = speakerQuips[index];
        const lineId = buildLineId("quip", speakerId, quip.id);
        if (this._isLineRecent(lineId)) continue;
        this.quipCursorBySpeaker[speakerId] = (index + 1) % speakerQuips.length;
        this._markPersistDirty();
        return {
          speakerId,
          text: quip.text,
          lineId,
        };
      }
      const fallback = speakerQuips[cursor];
      if (!fallback) continue;
      const fallbackLineId = buildLineId("quip", speakerId, fallback.id);
      this.quipCursorBySpeaker[speakerId] = (cursor + 1) % speakerQuips.length;
      this._markPersistDirty();
      return {
        speakerId,
        text: fallback.text,
        lineId: fallbackLineId,
      };
    }
    return null;
  }

  _triggerLore(context = {}, { forcedTopicId = "" } = {}) {
    if (!this.pendingThread) {
      const topic = this._selectTopic(context, forcedTopicId);
      if (topic) {
        this._beginThread(topic);
      }
    }

    if (this.pendingThread) {
      const event = this._emitThreadLine(context);
      if (event) {
        this.lastLoreTimeMs = this.nowMs;
      }
      return event;
    }

    const quip = this._selectQuip(context);
    if (!quip) return null;
    this.lastLoreTimeMs = this.nowMs;
    return this._buildEvent({
      channel: "lore",
      contextKey: "lore_quip",
      speakerId: quip.speakerId,
      text: quip.text,
      lineId: quip.lineId,
      topicId: "",
      escalationLevel: this.escalationLevel,
      useToast: false,
    });
  }

  _shouldTriggerGuidance(context = {}, forced = false) {
    if (forced) return true;
    const category = this._resolveContextKey(context);
    const objectiveId = normalizeObjectiveId(context.activeObjective);
    const hasObjective = objectiveId !== "none" || category !== "idle";
    if (!hasObjective) return false;
    const idle = Number(context.idleSeconds) || 0;
    const offTrackSeconds = Number(context.offTrackSeconds) || 0;
    const offTrack = offTrackSeconds >= 10;
    return offTrack || idle >= this.idleSeconds;
  }

  _shouldTriggerLore(context = {}, forced = false) {
    if (forced) return true;
    if (!Boolean(context.onTrack)) return false;
    const travelingSeconds = Number(context.travelingSeconds) || 0;
    return travelingSeconds >= 1;
  }

  update(dtSeconds, context = {}) {
    this._resolveTimeMs(dtSeconds, context);
    this._recordDebugSnapshot(context);
    this.lastObjectiveId = normalizeObjectiveId(context.activeObjective);
    this.lastObjectiveProgressKey = String(context.objectiveProgressKey ?? "");

    if (this._isBlocked(context)) {
      return null;
    }

    const canEmit = this._canEmitAt(this.nowMs);
    const threadGapReady = this.nowMs - this.lastAnyLineTimeMs >= this.threadLineGapMs;
    const guidanceReady = this.nowMs - this.lastGuidanceTimeMs >= this.guidanceCooldownMs;
    const loreReady = this.nowMs - this.lastLoreTimeMs >= this.loreCooldownMs;

    if (canEmit && guidanceReady && this._shouldTriggerGuidance(context, false)) {
      const event = this._triggerGuidance(context);
      return this._emitEvent(event, context);
    }

    if (
      this.pendingThread &&
      threadGapReady &&
      this.nowMs >= this.pendingThread.nextLineAtMs &&
      (loreReady || this.pendingThread.index > 0)
    ) {
      const event = this._emitThreadLine(context);
      return this._emitEvent(event, context);
    }

    if (canEmit && loreReady && this._shouldTriggerLore(context, false)) {
      const event = this._triggerLore(context);
      return this._emitEvent(event, context);
    }

    return null;
  }

  forceTrigger(context = {}, { channel = "guidance", topicId = "", contextKey = "" } = {}) {
    this._resolveTimeMs(0, context);
    const mergedContext =
      contextKey && !context.contextOverrideKey
        ? {
            ...context,
            contextOverrideKey: contextKey,
          }
        : context;
    this._recordDebugSnapshot(mergedContext);
    if (this._isBlocked(mergedContext)) {
      return null;
    }

    const normalizedChannel = normalizeChannel(channel, "guidance");
    let event = null;
    if (normalizedChannel === "lore") {
      const forcedTopicId = String(topicId ?? "")
        .trim()
        .toLowerCase();
      event = this._triggerLore(mergedContext, { forcedTopicId: topicId });
      if (forcedTopicId && (!event || String(event.topicId ?? "").toLowerCase() !== forcedTopicId)) {
        return null;
      }
      if (event) {
        this.lastLoreTimeMs = this.nowMs;
      }
    } else {
      event = this._triggerGuidance(mergedContext, { forced: true });
      if (event) {
        this.lastGuidanceTimeMs = this.nowMs;
      }
    }
    return this._emitEvent(event, mergedContext);
  }

  getState() {
    const nowMs = this.nowMs;
    const guidanceRemaining = Math.max(0, (this.lastGuidanceTimeMs + this.guidanceCooldownMs - nowMs) / 1000);
    const loreRemaining = Math.max(0, (this.lastLoreTimeMs + this.loreCooldownMs - nowMs) / 1000);
    const globalRemaining = Math.max(0, (this.lastAnyLineTimeMs + this.globalMinGapMs - nowMs) / 1000);
    return {
      cooldownRemaining: Number(Math.max(guidanceRemaining, loreRemaining, globalRemaining).toFixed(3)),
      guidanceCooldownRemaining: Number(guidanceRemaining.toFixed(3)),
      loreCooldownRemaining: Number(loreRemaining.toFixed(3)),
      globalGapRemaining: Number(globalRemaining.toFixed(3)),
      escalationLevel: this.escalationLevel,
      lastContextKey: this.lastContextKey,
      lastObjectiveKey: this.lastObjectiveId,
      lastObjectiveProgressKey: this.lastObjectiveProgressKey,
      lastSpeaker: this.lastSpeakerId,
      lastSpeakerLabel: getSpeakerLabel(this.lastSpeakerId || "arthur"),
      lastLine: this.lastLine,
      lastLineId: this.lastLineId,
      lastTopic: this.lastTopicId,
      lastChannel: this.lastChannel,
      triggerCount: this.triggerCount,
      recentLinesQueue: [...this.recentLineIds],
      completedTopics: Array.from(this.completedTopics).sort(),
      completedCount: this.completedTopics.size,
      frequency: this.frequency,
      loreCooldownMs: this.loreCooldownMs,
      guidanceCooldownMs: this.guidanceCooldownMs,
      threadActive: Boolean(this.pendingThread),
      threadTopicId: this.pendingThread?.topicId ?? "",
      threadRemainingLines: this.pendingThread
        ? Math.max(0, this.pendingThread.lines.length - this.pendingThread.index)
        : 0,
      currentObjective: this._debugSnapshot.currentObjective,
      onTrack: this._debugSnapshot.onTrack,
      objectiveDistanceNow: this._debugSnapshot.objectiveDistanceNow,
      objectiveDistancePrev: this._debugSnapshot.objectiveDistancePrev,
      offTrackSeconds: this._debugSnapshot.offTrackSeconds,
      idleSeconds: this._debugSnapshot.idleSeconds,
      travelingSeconds: this._debugSnapshot.travelingSeconds,
    };
  }
}

export { BANER_FREQUENCY_VALUES as BANTER_FREQUENCY_VALUES };
