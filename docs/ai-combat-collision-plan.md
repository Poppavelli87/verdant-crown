# AI / Combat / Collision Improvement Plan

## Target systems
- Combat loop: `src/combat/combatSystem.js`, `src/combat/enemy.js`
- Companion behavior: `src/party/partySystem.js`, `src/party/roleAi.js`
- World actors and NPC data: `src/scenes/sceneManager.js`, `src/world/npc.js`
- Debug/state output used by tests: `src/main.js`
- Tuning surface: `src/config/gameplayTuning.js`

## Implementation order
1. Add shared gameplay tuning constants for combat, collision, and companion roaming.
2. Add robust circle-based separation resolution and integrate it into the frame update so player/NPC/enemy/companions cannot stack.
3. Upgrade companion non-combat behavior to roam independently with soft/hard leash + deterministic idle variety (idle/wander/investigate/regroup).
4. Improve combat feel with configurable aggression ramping, post-attack recovery windows, stagger immunity guardrails, and hit-stop debug signal.
5. Add tests:
   - Unit test for overlap separation.
   - Companion behavior test verifying idle-time distance from player.
   - Combat test verifying telegraph/feedback debug state occurs.
6. Run project checks and update docs/readme tuning notes.
