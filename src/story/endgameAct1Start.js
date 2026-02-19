import { OBJECTIVE_IDS } from "./objectives.js";

export const ENDGAME_ACT1_FLAGS = Object.freeze({
  STARTED: "endgame_act1_started",
  THIRD_SEAL_OBTAINED: "endgame_task_third_seal_obtained",
  OUTER_SPIRE_UNLOCKED: "endgame_outer_spire_unlocked",
  OUTER_SPIRE_BREACHED: "endgame_outer_spire_breached",
  GATEWARDEN_DEFEATED: "endgame_gatewarden_defeated",
  SPIRE_ENTRY_UNLOCKED: "endgame_spire_entry_unlocked",
});

const VALID_SCENES = new Set(["thornmere", "windward", "region4_seed", "rootway"]);

const ACT1_START_LINES = Object.freeze([
  "Elaine: Oath Court doctrine is plain: three seals, three binds, one lawful breach. We begin with the Third Seal. Move.",
  "Arthur: We have the truth now. We get the tools next. Then we storm the Spire. Keep pace.",
  "Willow: Checklist time! Waystone, Crownheart, mystery seal. Super normal apocalypse errands. Start with the shrine.",
  "Elaine: The Oath Sigil shrine still remembers the old rite. We bind it before Vaeloris does. Rootway, now.",
  "Arthur: If the shrine recognizes me, we use it. If it fights, we finish it. Keep moving.",
  "Willow: My teacher called this part the 'deep breath before the cliff jump.' Guess what we do now.",
  "Elaine: We take the breath, then the jump. Bind the Third Seal at once.",
]);

export function tryStartEndgameAct1(context = {}) {
  const {
    currentSceneId = "",
    endgameStarted = false,
    endgameAct1Started = false,
    combatActive = false,
    bossActive = false,
    dialogueOpen = false,
    menuOpen = false,
    force = false,
  } = context;

  const sceneId = String(currentSceneId ?? "")
    .trim()
    .toLowerCase();
  if (!VALID_SCENES.has(sceneId)) {
    return { triggered: false };
  }

  if (!force) {
    if (!endgameStarted) return { triggered: false };
    if (endgameAct1Started) return { triggered: false };
    if (combatActive || bossActive || dialogueOpen || menuOpen) return { triggered: false };
  }

  return {
    triggered: true,
    title: "ENDGAME ACT I",
    lines: [...ACT1_START_LINES],
    objectiveId: OBJECTIVE_IDS.OBTAIN_THIRD_SEAL,
    lockSeconds: 0.9,
    setFlags: Object.freeze({
      [ENDGAME_ACT1_FLAGS.STARTED]: true,
    }),
  };
}

