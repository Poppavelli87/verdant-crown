import { normalizeObjectiveId, OBJECTIVE_IDS } from "./objectives.js";

export const SAVE_MIGRATION_JOIN_STATE_FLAG = "save_migration_v2_join_state";

function normalizeMemberId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function hasMember(partyState = {}, memberId) {
  const target = normalizeMemberId(memberId);
  const members = Array.isArray(partyState.members) ? partyState.members : [];
  return members.some((entry) => normalizeMemberId(entry) === target);
}

function addMember(partyState = {}, memberId) {
  const target = normalizeMemberId(memberId);
  if (!target) return;
  const existing = Array.isArray(partyState.members) ? partyState.members.map((entry) => normalizeMemberId(entry)) : [];
  if (!existing.includes(target)) {
    existing.push(target);
  }
  partyState.members = existing;
}

function isPastElaineJoinMilestone(storyFlags = {}) {
  const currentObjective = normalizeObjectiveId(storyFlags.current_objective);
  const objectivePastJoin = new Set([
    OBJECTIVE_IDS.TRAVEL_TO_EMBERFALL,
    OBJECTIVE_IDS.FIND_WILLOW,
    OBJECTIVE_IDS.SURVIVE_AMBUSH,
    OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE,
  ]);
  if (objectivePastJoin.has(currentObjective)) return true;
  return Boolean(
    storyFlags.rowan_council_done ||
      storyFlags.emberfall_lead_unlocked ||
      storyFlags.chapter2_started ||
      storyFlags.chapter2_arrived_emberfall ||
      storyFlags.willow_met ||
      storyFlags.willow_joined
  );
}

function isPastWillowJoinMilestone(storyFlags = {}) {
  const currentObjective = normalizeObjectiveId(storyFlags.current_objective);
  const objectivePastJoin = new Set([
    OBJECTIVE_IDS.RETURN_TO_ROWAN,
    OBJECTIVE_IDS.INVESTIGATE_LISTENING_SPIKE,
    OBJECTIVE_IDS.REPORT_BACK_TO_ROWAN,
  ]);
  if (objectivePastJoin.has(currentObjective)) return true;
  return Boolean(
    storyFlags.chapter3_rowan_debrief_done ||
      storyFlags.listening_spike_lead_unlocked ||
      storyFlags.listening_spike_site_cleared
  );
}

export function reconcileJoinState(storyFlags = {}, partyState = {}) {
  const nextStoryFlags = { ...storyFlags };
  const nextPartyState = {
    ...partyState,
    members: Array.isArray(partyState.members) ? partyState.members.map((entry) => normalizeMemberId(entry)).filter(Boolean) : [],
  };
  const corrections = [];

  const elaineFlag = Boolean(nextStoryFlags.elaine_joined);
  const elaineInParty = hasMember(nextPartyState, "elaine");
  if (elaineFlag && !elaineInParty) {
    if (isPastElaineJoinMilestone(nextStoryFlags)) {
      addMember(nextPartyState, "elaine");
      corrections.push("added_elaine_to_party");
    } else {
      nextStoryFlags.elaine_joined = false;
      corrections.push("unset_elaine_joined_flag");
    }
  } else if (!elaineFlag && elaineInParty) {
    nextStoryFlags.elaine_joined = true;
    corrections.push("set_elaine_joined_flag");
  }

  const willowFlag = Boolean(nextStoryFlags.willow_joined);
  const willowInParty = hasMember(nextPartyState, "willow");
  if (willowFlag && !willowInParty) {
    if (isPastWillowJoinMilestone(nextStoryFlags)) {
      addMember(nextPartyState, "willow");
      corrections.push("added_willow_to_party");
    } else {
      nextStoryFlags.willow_joined = false;
      corrections.push("unset_willow_joined_flag");
    }
  } else if (!willowFlag && willowInParty) {
    nextStoryFlags.willow_joined = true;
    corrections.push("set_willow_joined_flag");
  }

  return {
    storyFlags: nextStoryFlags,
    partyState: nextPartyState,
    changed: corrections.length > 0,
    corrections,
  };
}
