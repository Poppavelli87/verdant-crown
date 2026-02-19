function normalizeChoice(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeTier(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    normalized === "still" ||
    normalized === "uneasy" ||
    normalized === "balanced" ||
    normalized === "restless" ||
    normalized === "fractured"
  ) {
    return normalized;
  }
  return "balanced";
}

function resolveTierAccent(tier) {
  if (tier === "still" || tier === "uneasy") return "steady";
  if (tier === "restless") return "nervous";
  if (tier === "fractured") return "splintered";
  return "balanced";
}

export function playEndingSeal(context = {}) {
  const tier = normalizeTier(context.crownTier);
  const chapter9Choice = normalizeChoice(context.chapter9Choice);
  const convergence = normalizeChoice(context.convergenceChoice);
  const salvage = normalizeChoice(context.harvesterChoice);
  const tierAccent = resolveTierAccent(tier);
  const keyThread =
    chapter9Choice === "take_key"
      ? "The Crownheart Key cools in your hand and then goes mute."
      : "The sealed Vault answers with one final, grateful pulse.";
  const convergenceThread =
    convergence === "tune"
      ? "The tuned choir finally quiets."
      : convergence === "shatter"
        ? "The broken chorus settles into silence."
        : "Old harmonics fall away.";
  const salvageThread =
    salvage === "salvage"
      ? "Even salvaged industry cannot out-sing this seal."
      : "Shattered machinery rusts into harmless memory.";
  return {
    id: "seal",
    title: "ENDING A - SEAL",
    lines: [
      "Arthur: Hold the line. We seal it now.",
      "Elaine: By oath and witness, I bind what my house caged.",
      "Willow: Joke quota suspended. This part matters.",
      `Narration: The Crown turns ${tierAccent}, then silent.`,
      keyThread,
      convergenceThread,
      salvageThread,
      "Arthur: I will carry what remains. Move. We are done here.",
      "Elaine: Duty without compassion made this wound. We do not repeat it.",
      "Willow: World still breathing. Ugly, loud, alive. I'll take it.",
    ],
    epilogues: [
      "Arthur keeps the watch at the edge of the sealed chamber.",
      "Elaine dismantles the last polite cages her family preserved.",
      "Willow laughs first, then teaches children to listen without obeying.",
    ],
    credits: [
      "Verdant Crown",
      "A tale of three: Arthur, Elaine, Willow",
      "The Crown remembers.",
    ],
    ngPlusHook:
      "A faint pulse returns from beneath the seal. New Game+ awaits: different echoes, same names.",
  };
}

export function playEndingRewrite(context = {}) {
  const tier = normalizeTier(context.crownTier);
  const chapter9Choice = normalizeChoice(context.chapter9Choice);
  const convergence = normalizeChoice(context.convergenceChoice);
  const salvage = normalizeChoice(context.harvesterChoice);
  const tierAccent = resolveTierAccent(tier);
  const keyThread =
    chapter9Choice === "take_key"
      ? "The Crownheart Key ignites and rewrites the first line."
      : "Even without the key, the altar answers your rewrite.";
  const convergenceThread =
    convergence === "tune"
      ? "Tuned harmonics bloom into unknown chords."
      : convergence === "shatter"
        ? "Shattered harmonics reform as new grammar."
        : "Old harmonics fracture into new cadence.";
  const salvageThread =
    salvage === "salvage"
      ? "Salvaged fragments become tools in a less obedient world."
      : "Broken Vaeloris steel dissolves into harmless dust.";
  return {
    id: "rewrite",
    title: "ENDING B - REWRITE",
    lines: [
      "Arthur: This may break us. We do it anyway.",
      "Elaine: Then let the record show: I choose mercy over pedigree.",
      "Willow: Teacher said reality is a draft. Time to edit.",
      `Narration: The world loosens, ${tierAccent} at the edges.`,
      keyThread,
      convergenceThread,
      salvageThread,
      "Arthur: We do not control what comes next. We face it.",
      "Elaine: I am terrified. I am also, finally, hopeful.",
      "Willow: New chapter, same weird trio. Move before I cry on purpose.",
    ],
    epilogues: [
      "Arthur leads survivors through a world that no longer obeys old maps.",
      "Elaine writes a new oath: no cages, no single voice.",
      "Willow follows a laugh in saffron glass and stops pretending she is not ready.",
    ],
    credits: [
      "Verdant Crown",
      "A tale of three: Arthur, Elaine, Willow",
      "The Crown remembers.",
    ],
    ngPlusHook:
      "A rewritten horizon flickers with familiar footprints. New Game+ unlocks alternate memories.",
  };
}
