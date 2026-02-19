// Threshold bands convert hidden Crown Awareness into public omen tiers (0..4).
const OMEN_THRESHOLDS = [0.2, 0.4, 0.6, 0.8];

const OMEN_MESSAGES = Object.freeze([
  "Air feels calm",
  "Air feels wrong",
  "Verdant hum rises",
  "Thorns whisper nearby",
  "The Crown is listening",
]);

export function crownAwarenessToOmenTier(crownAwareness) {
  if (crownAwareness >= OMEN_THRESHOLDS[3]) return 4;
  if (crownAwareness >= OMEN_THRESHOLDS[2]) return 3;
  if (crownAwareness >= OMEN_THRESHOLDS[1]) return 2;
  if (crownAwareness >= OMEN_THRESHOLDS[0]) return 1;
  return 0;
}

export function omenTierToMessage(omenTier) {
  return OMEN_MESSAGES[Math.max(0, Math.min(OMEN_MESSAGES.length - 1, omenTier))];
}
