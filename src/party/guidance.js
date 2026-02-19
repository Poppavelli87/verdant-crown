const GUIDANCE_LINES = Object.freeze({
  objectiveReturnRowan: "Return to Rowan. The roots are restless.",
  objectiveTravelEmberfall: "Follow the ash wind. The ridge path waits.",
  objectiveFindWillow: "Find Willow at the fused basalt outcrop.",
  objectiveSurviveAmbush: "Hold the clearing. Survive the Vaeloris ambush.",
  objectiveInvestigateListeningSpike: "Follow the metallic hum in Emberfall. Find what's listening.",
  objectiveReportBackRowan: "Return to Rowan. Tell him what you found.",
  objectiveReachHarvesterSite: "Return to Emberfall. Find the Harvester rig.",
  objectiveDefeatHarvesterWarden: "Break the anchors. Stop the extraction.",
  objectiveReturnAfterHarvester: "Return to Rowan. Tell him what you chose.",
  objectiveClearRidgePatrol: "Vaeloris scouts prowl the ridge road. Clear the path.",
  objectiveCrossRidgeGate: "The ridge path is open. Cross before it seals again.",
  objectiveFindWaystoneCircle: "Find the Waystone Circle. The wind will guide you.",
  objectiveDropRelay: "Vaeloris is relaying signals. Drop the tether posts.",
  objectiveAttuneWaystone: "Touch the Waystone. Listen carefully.",
  objectiveReturnRowanWaystone: "Return to Rowan with what the Waystone showed you.",
  objectiveRegion3FirstSteps: "Beyond the ridge, the air changes. Keep moving.",
  veinActive: "Hold the ring. The rootline is still unstable.",
  veinQuest: "Rowan's warning lingers: steady the next vein.",
  emberPath: "A scorched path leads beyond Thornmere.",
  willowWatch: "Someone is watching the heat-veins.",
  willowAligned: "The three of you feel... aligned.",
  harvesterApproach: "A Vaeloris harvester is burrowed into Emberfall.",
  harvesterActive: "Anchor nodes feed the surge. Break them first.",
  harvesterAfter: "Return to Thornmere. Rowan should hear this.",
  act2Return: "Rowan should hear what happened.",
  ridgeTrail: "A Vaeloris trail cuts toward the ridge.",
  ridgeOpen: "The ridge path is open. Don't linger.",
  bossActive: "Stay close. The Scar answers every misstep.",
  vaeloris: "The extractor hum is back. Decide what to do with it.",
  shrine: "The shrine can temper your burden.",
  relic: "Relic shards can be attuned at the shrine.",
  joined: "Keep formation. Listen for the pulse.",
  baseline: "",
});

function resolveKey(context) {
  if (context.objectiveId === "return_to_rowan") return "objectiveReturnRowan";
  if (context.objectiveId === "travel_to_emberfall") return "objectiveTravelEmberfall";
  if (context.objectiveId === "find_willow") return "objectiveFindWillow";
  if (context.objectiveId === "survive_ambush") return "objectiveSurviveAmbush";
  if (context.objectiveId === "investigate_listening_spike") return "objectiveInvestigateListeningSpike";
  if (context.objectiveId === "report_back_to_rowan") return "objectiveReportBackRowan";
  if (context.objectiveId === "reach_harvester_site") return "objectiveReachHarvesterSite";
  if (context.objectiveId === "defeat_harvester_warden") return "objectiveDefeatHarvesterWarden";
  if (context.objectiveId === "return_to_rowan_after_harvester") return "objectiveReturnAfterHarvester";
  if (context.objectiveId === "clear_ridge_patrol") return "objectiveClearRidgePatrol";
  if (context.objectiveId === "cross_ridge_gate") return "objectiveCrossRidgeGate";
  if (context.objectiveId === "find_waystone_circle") return "objectiveFindWaystoneCircle";
  if (context.objectiveId === "drop_relay") return "objectiveDropRelay";
  if (context.objectiveId === "attune_waystone") return "objectiveAttuneWaystone";
  if (context.objectiveId === "return_to_rowan_with_waystone_news") return "objectiveReturnRowanWaystone";
  if (context.objectiveId === "region3_first_steps") return "objectiveRegion3FirstSteps";
  if (context.harvesterBossActive) return "harvesterActive";
  if (context.act2FalloutPending) return "act2Return";
  if (context.ridgeTrailActive) return "ridgeTrail";
  if (context.ridgePathReady) return "ridgeOpen";
  if (context.harvesterPostChoice) return "harvesterAfter";
  if (context.harvesterAvailable && !context.harvesterBossDefeated) return "harvesterApproach";
  if (context.bossActive) return "bossActive";
  if (context.veinActive) return "veinActive";
  if (context.veinQuestActive) return "veinQuest";
  if (context.willowJoined) return "willowAligned";
  if (context.emberfallHint) return "emberPath";
  if (context.emberfallUnlocked && !context.willowJoined) return "willowWatch";
  if (context.vaelorisPrompt) return "vaeloris";
  if (context.shrinePromptVisible) return "shrine";
  if (context.hasRelicShard) return "relic";
  if (context.elaineJoined) return "joined";
  return "baseline";
}

export class GuidanceDirector {
  constructor() {
    this.currentKey = "";
    this.currentLine = "";
  }

  update(context = {}) {
    const nextKey = resolveKey(context);
    if (nextKey !== this.currentKey) {
      this.currentKey = nextKey;
      this.currentLine = GUIDANCE_LINES[nextKey] ?? "";
    }
    return this.currentLine;
  }

  getLine() {
    return this.currentLine;
  }
}
