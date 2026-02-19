// Small deterministic PRNG (mulberry32) for future controlled unpredictability.
let state = 0x12345678;

export function setSeed(seedNumber) {
  const normalized = Number(seedNumber) >>> 0;
  state = normalized === 0 ? 0x6d2b79f5 : normalized;
}

export function nextFloat() {
  state += 0x6d2b79f5;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(max) {
  const safeMax = Math.max(1, Math.floor(max));
  return Math.floor(nextFloat() * safeMax);
}
