// Directed graph of currently valid scene transitions.
export const SCENE_GRAPH = Object.freeze({
  start: [
    "prologue",
    "thornmere",
    "hollowScar",
    "emberfall",
    "ridgepass",
    "windward",
    "region3_seed",
    "region4_seed",
    "endgame_route_seed",
    "spire_approach",
    "spire_antechamber",
    "inner_spire",
    "inner_spire_last_door",
    "last_spire",
  ],
  prologue: ["arthurOpening", "thornmere"],
  arthurOpening: ["thornmere"],
  thornmere: [
    "hollowScar",
    "emberfall",
    "ridgepass",
    "windward",
    "region3_seed",
    "region4_seed",
    "endgame_route_seed",
    "spire_approach",
  ],
  hollowScar: ["thornmere"],
  emberfall: ["thornmere"],
  ridgepass: ["thornmere", "windward"],
  windward: ["thornmere", "ridgepass", "region3_seed", "region4_seed", "endgame_route_seed", "spire_approach"],
  region3_seed: ["thornmere", "windward"],
  region4_seed: ["thornmere", "windward", "endgame_route_seed", "spire_approach"],
  endgame_route_seed: ["thornmere", "windward", "region4_seed", "spire_approach"],
  spire_approach: ["thornmere", "windward", "region4_seed", "endgame_route_seed", "spire_antechamber"],
  spire_antechamber: ["spire_approach", "inner_spire"],
  inner_spire: ["spire_antechamber", "inner_spire_last_door"],
  inner_spire_last_door: ["inner_spire", "last_spire"],
  last_spire: ["inner_spire_last_door", "start"],
});

export function getSceneTransitions(sceneId) {
  return SCENE_GRAPH[sceneId] ?? [];
}

export function canTransition(fromSceneId, toSceneId) {
  return getSceneTransitions(fromSceneId).includes(toSceneId);
}
