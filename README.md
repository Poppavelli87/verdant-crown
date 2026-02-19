# Verdant Crown
Verdant Crown is a real-time Secret-of-Mana-style web RPG built with deterministic simulation at its core: party banter and guidance, escalating Threat Veins, world-state pressure systems, and multi-phase instanced bosses that carry forward into branching endgame routes and endings.

## Highlights
- Real-time party combat with active member swaps and AI companions.
- Deterministic story/objective progression across Act I, II, and III.
- Setpiece systems:
  - Threat Veins and extraction pressure
  - Chapter 9 Sunder meter + anchor stabilization
  - Endgame breach/memory/rift pressure tracks
- Instanced bosses (Harvester Warden, Null Archivist, Gatewarden, Loom Proctor, Narrator Crown).
- Branching outcomes (Chapter 9 choice and Act III ending choice).
- Extensive debug hooks + Playwright coverage for regression and story continuity.

## Controls
### Desktop
- Movement: `WASD` or arrow keys
- Sprint (exploration): hold `Shift`
- Attack: mouse left click (tap = light, hold = charged)
- Interact / dialogue / portals: `Space` or `Enter` (context-dependent)
- Party swaps: `1` (Arthur), `2` (Elaine), `3` (Willow after join)
- Tactics cycle: `Tab`
- Elaine spells: `U`, `I`, `O`, `P`
- Willow spells: `H`, `J`, `K`, `L`

### Mobile
- Tap-to-move and tap combat controls
- Portrait buttons for party selection
- Spell buttons for Elaine/Willow
- Choice panels require explicit confirmation taps

## Run Locally
### Prerequisites
- Node.js (for Playwright and QA scripts)
- Python 3 (for local static server)

### Install
```bash
npm install
npx playwright install
```

### Start Local Server
```bash
python -m http.server 4173
```
Open: `http://127.0.0.1:4173`

## Testing
### Full Playwright suite
```bash
npx playwright test
```

### Deterministic simulation harness
```bash
node scripts/qa/run_simulations.js --runs=25 --scenario=all --seedBase=1234 --url=http://127.0.0.1:4173
```

### Project scan report
```bash
node scripts/qa/scan_project.js --out=output/qa/scan-report.md
```

## Game Loop Overview
- Explore, stabilize regions, and manage threat escalation.
- Resolve story setpieces and boss instances with deterministic mechanics.
- Build toward endgame through seals, lock puzzles, and Spire breaches.
- Reach Act III, complete Rift/Core setpieces, defeat the final boss, and choose an ending.

## Story Structure (Spoiler-Light)
- Act I: regional destabilization, first Vein arc, party growth.
- Act II: Inner Spire traversal, Resonance Locks, Loom Proctor, Memory Loom reveal.
- Act III: Last Spire setpieces, Narrator Crown showdown, Seal vs Rewrite ending choice.

## Debug Tools
Key browser hooks (`window.*`) include:
- Story/state: `debug_set_story_flag`, `debug_get_story_flags`, `debug_set_objective`, `debug_get_current_objective`
- Scene warp: `debug_warp_to_scene`
- Combat/party: `debug_set_active_character`, `debug_force_basic_attack`, `debug_force_elaine_cast`, `debug_get_render_state`
- Endgame flow:
  - Act I/II: `debug_force_third_seal_obtained`, `debug_start_spire_breach`, `debug_start_gatewarden_boss`, `debug_complete_resonance_lock`, `debug_start_loom_proctor`
  - Act III: `debug_start_rift_setpiece`, `debug_complete_rift_anchor`, `debug_start_core_setpiece`, `debug_disable_final_clamp`, `debug_start_final_boss`, `debug_trigger_choice_ui`, `debug_choose_ending`
- Integrity validation: `debug_validate_story`

## Project Structure
- `src/scenes`: scene routing and map content (Thornmere, Windward, Rootway, Spire scenes)
- `src/story`: objective definitions, chapter/endgame events, endings, integrity checks
- `src/combat`: combat systems, status effects, enemies, bosses
- `src/party`: party swaps, AI behavior, banter/guidance systems
- `src/ui`: HUD, dialogue, party chat, choice panels
- `src/world`: pressure systems, mood, anomalies, world rules
- `assets`: sprites/icons/VFX textures
- `tests`: Playwright E2E/regression/stress specs
- `scripts/qa`: deterministic simulation + static scan tooling

## Determinism Notes
- Tests and QA flows rely on deterministic hooks (`debug_*`) and objective-driven assertions.
- Simulation harness uses seeded scenario selection (`seedBase + runIndex`) and deterministic story setup.
- State verification is driven by `render_game_to_text` and `debug_validate_story`.

## Roadmap
- Willow join/state depth expansions and gem-state progression.
- Optional HJKL spell set growth and post-ending NG+ systems.
- Smarter companion AI role plans (tank/support/glass-cannon templates).
- Targeted performance optimizations and content expansion across post-Spire routes.
