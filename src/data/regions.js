// Canonical region metadata table for future scale-up to 8 major regions.
export const REGIONS = Object.freeze([
  {
    id: "verdant-wilds",
    displayName: "Verdant Wilds",
    element: "Wood",
    paletteTint: "#5f8b47",
    baselinePressure: 0.22,
    description: "Ancient growth hums under a restless canopy.",
  },
  {
    id: "emberfall-crags",
    displayName: "Emberfall Crags",
    element: "Fire",
    paletteTint: "#b2522e",
    baselinePressure: 0.41,
    description: "Lava-scarred ridges crackle with unstable heat.",
  },
  {
    id: "tideglass-coast",
    displayName: "Tideglass Coast",
    element: "Water",
    paletteTint: "#3f86a6",
    baselinePressure: 0.29,
    description: "Shallow mirrors and storm tides bend the shoreline.",
  },
  {
    id: "skyreach-steppe",
    displayName: "Skyreach Steppe",
    element: "Wind",
    paletteTint: "#82a9a4",
    baselinePressure: 0.35,
    description: "Open plains carry cutting gusts and distant thunder.",
  },
  {
    id: "gloamfrost-tundra",
    displayName: "Gloamfrost Tundra",
    element: "Ice",
    paletteTint: "#7ea6c9",
    baselinePressure: 0.52,
    description: "Frozen dusk lingers over brittle aurora-lit snow.",
  },
  {
    id: "stonewound-highlands",
    displayName: "Stonewound Highlands",
    element: "Earth",
    paletteTint: "#7f6e56",
    baselinePressure: 0.31,
    description: "Fractured cliffs echo with old tectonic scars.",
  },
  {
    id: "lumen-sanctum",
    displayName: "Lumen Sanctum",
    element: "Light",
    paletteTint: "#d6c978",
    baselinePressure: 0.47,
    description: "Sacred vaults shimmer with vigilant brilliance.",
  },
  {
    id: "umbral-hollows",
    displayName: "Umbral Hollows",
    element: "Shadow",
    paletteTint: "#5a5a74",
    baselinePressure: 0.58,
    description: "Sunless vaults whisper along broken stone veins.",
  },
]);

export const REGIONS_BY_ID = Object.freeze(
  REGIONS.reduce((acc, region) => {
    acc[region.id] = region;
    return acc;
  }, {})
);
