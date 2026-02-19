export const VOICES = Object.freeze({
  arthur: Object.freeze({
    id: "arthur",
    displayName: "Arthur",
    style: Object.freeze({
      rules: Object.freeze([
        "Short, grounded sentences.",
        "Minimal slang and minimal ornament.",
        "Dry humor only in small doses.",
        "Curious but determined under pressure.",
      ]),
      do: Object.freeze([
        "State practical observations.",
        "Use plain verbs and direct intent.",
        "Land on action-oriented endings.",
      ]),
      dont: Object.freeze([
        "Do not ramble.",
        "Do not use melodramatic flourishes.",
        "Do not joke through danger.",
      ]),
    }),
  }),
  elaine: Object.freeze({
    id: "elaine",
    displayName: "Elaine",
    style: Object.freeze({
      rules: Object.freeze([
        "Refined, aristocratic diction.",
        "Measured cadence with precise wording.",
        "Mild teasing only, never crude.",
        "Frames stakes as order, consequence, and responsibility.",
      ]),
      do: Object.freeze([
        "Use polished phrasing.",
        "Offer tactical clarity with poise.",
        "Anchor lines in duty and restraint.",
      ]),
      dont: Object.freeze([
        "Do not use coarse slang.",
        "Do not break composure for cheap humor.",
        "Do not undercut danger with flippancy.",
      ]),
    }),
  }),
  willow: Object.freeze({
    id: "willow",
    displayName: "Willow",
    style: Object.freeze({
      rules: Object.freeze([
        "Playful and silly by default.",
        "Uses metaphors, nicknames, and odd comparisons.",
        "Can pivot into sudden sharp insight.",
        "Keeps momentum high with irreverent energy.",
      ]),
      do: Object.freeze([
        "Use imaginative imagery.",
        "Blend humor with tactical nudges.",
        "Drop occasional piercing observations.",
      ]),
      dont: Object.freeze([
        "Do not become mean-spirited.",
        "Do not stay purely comic for every line.",
        "Do not reveal full secrets in one beat.",
      ]),
    }),
  }),
});

export function getVoiceProfile(speakerId = "") {
  const key = String(speakerId ?? "")
    .trim()
    .toLowerCase();
  return VOICES[key] ?? VOICES.arthur;
}
