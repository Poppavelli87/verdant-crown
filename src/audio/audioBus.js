// AudioBus is a lightweight no-op hook used so future sound work can plug in without refactors.
function normalizeTrackName(name) {
  const raw = String(name ?? "");
  const normalized = raw.trim().toLowerCase();
  if (normalized === "battle_normal") return "overworld";
  if (normalized === "battle_boss") return "boss";
  if (normalized === "battle_final_phase") return "boss_final";
  if (normalized === "victory_boss") return "victory";
  return raw;
}

export class AudioBus {
  constructor() {
    this.currentMusic = "";
    this.musicLayers = new Map();
    this.transition = null;
  }

  play(_name) {}

  playMusic(name, layer = "main") {
    const normalizedLayer = String(layer ?? "main");
    const value = normalizeTrackName(name);
    const previous = this.musicLayers.get(normalizedLayer) ?? "";
    this.musicLayers.set(normalizedLayer, value);
    if (normalizedLayer === "main") {
      this.currentMusic = value;
      this.transition = {
        type: "play",
        from: previous,
        to: value,
        durationMs: 0,
      };
    }
  }

  crossfadeTo(name, ms = 400, layer = "main") {
    const normalizedLayer = String(layer ?? "main");
    const value = normalizeTrackName(name);
    const previous = this.musicLayers.get(normalizedLayer) ?? "";
    this.musicLayers.set(normalizedLayer, value);
    if (normalizedLayer === "main") {
      this.currentMusic = value;
      this.transition = {
        type: "crossfade",
        from: previous,
        to: value,
        durationMs: Math.max(0, Math.floor(Number(ms) || 0)),
      };
    }
  }

  stopMusic(layer = "main") {
    const normalizedLayer = String(layer ?? "main");
    const previous = this.musicLayers.get(normalizedLayer) ?? "";
    this.musicLayers.delete(normalizedLayer);
    if (normalizedLayer === "main") {
      this.currentMusic = "";
      this.transition = {
        type: "stop",
        from: previous,
        to: "",
        durationMs: 0,
      };
    }
  }

  playTrack(trackId, layer = "main") {
    this.playMusic(trackId, layer);
  }

  fadeOut(durationMs = 300, layer = "main") {
    const normalizedLayer = String(layer ?? "main");
    const previous = this.musicLayers.get(normalizedLayer) ?? "";
    if (normalizedLayer === "main") {
      this.transition = {
        type: "fadeOut",
        from: previous,
        to: previous,
        durationMs: Math.max(0, Math.floor(Number(durationMs) || 0)),
      };
    }
  }

  fadeIn(durationMs = 300, layer = "main") {
    const normalizedLayer = String(layer ?? "main");
    const current = this.musicLayers.get(normalizedLayer) ?? "";
    if (normalizedLayer === "main") {
      this.transition = {
        type: "fadeIn",
        from: current,
        to: current,
        durationMs: Math.max(0, Math.floor(Number(durationMs) || 0)),
      };
    }
  }

  getDebugState() {
    return {
      currentMusic: this.currentMusic,
      layers: Object.fromEntries(this.musicLayers.entries()),
      transition: this.transition ? { ...this.transition } : null,
    };
  }
}
