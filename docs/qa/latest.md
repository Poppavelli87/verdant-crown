# Verdant Crown RC Simulation Summary

- Timestamp: 2026-02-19T21:20:21.910Z
- Output directory: `C:\Users\mxz\verdant-crown\output\qa\20260219-161724-330`
- URL: `http://127.0.0.1:4173`
- Runs: 25
- Pass: 25
- Fail: 0
- Console/page errors: 0
- Warnings captured: 4
- Server mode: spawned local python server

## Route map (internal)
- start -> prologue -> Arthur opening -> Thornmere
- Thornmere -> Hollow Scar -> first Vein quest -> Rowan heal/report
- Endgame Act II -> Inner Spire locks -> Loom Proctor -> Last Door
- Endgame Act III -> Last Spire rift/core setpieces -> Narrator Crown -> ending choice

## Debug hooks observed
- `debug_warp_to_scene`
- `debug_set_story_flag`
- `debug_set_objective`
- `debug_get_current_objective`
- `debug_get_story_flags`
- `debug_complete_resonance_lock`
- `debug_start_loom_proctor`
- `debug_start_rift_setpiece`
- `debug_disable_final_clamp`
- `debug_start_final_boss`
- `debug_trigger_choice_ui`
- `debug_force_basic_attack`
- `debug_force_elaine_cast`
- `debug_get_party_ai_state`
- `debug_get_render_state`
- `debug_validate_story`

## Scenario breakdown
- act3_rewrite: 5/5 passed, errors=0
- smoke: 5/5 passed, errors=0
- act1: 5/5 passed, errors=0
- act2: 5/5 passed, errors=0
- act3_seal: 5/5 passed, errors=0

## Story continuity coverage
- elaine_join: dialogue 10/10
- act2_entry: dialogue 5/5
- loom_proctor_defeat: dialogue 5/5
- act3_last_door: dialogue 10/10
- final_boss_start: dialogue 10/10
- ending_selected: dialogue 10/10

## Failed runs
- none

## Notes
- Scenarios are deterministic and selected with `seedBase + runIndex` over the chosen scenario set.
- Debug hooks are used as fallback for deep-story reachability and are recorded in each run JSON.
- Frame-time and heap metrics are best-effort and browser-dependent.
