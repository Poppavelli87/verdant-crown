const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const advance = (ms) => page.evaluate((stepMs) => window.advanceTime?.(stepMs), ms);
  const getState = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.evaluate(() => { window.setScreenshotMode?.(true); window.advanceTime?.(250); window.__verdant_skip_save_on_unload = true; window.localStorage.removeItem('verdant-crown-save-v1'); window.localStorage.removeItem('threejs-rpg-save-v1');});
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.evaluate(() => { window.setScreenshotMode?.(true); window.advanceTime?.(250); });
  let state = await getState();
  if (state.scene_id === 'start') { await page.keyboard.press('Enter'); await advance(900); }
  state = await getState();
  if (state.scene_id === 'prologue') { await page.keyboard.down('Space'); await advance(1300); await page.keyboard.up('Space'); await advance(1500);} 
  state = await getState();
  if (state.scene_id === 'arthurOpening') { await page.evaluate(() => window.debug_complete_opening?.()); await advance(900);} 
  await page.evaluate(() => {
    window.debug_set_story_flag?.('elaine_joined', true);
    window.debug_trigger_willow_join?.();
    window.debug_warp_to_scene?.('hollowScar');
    window.debug_set_story_flag?.('elaine_joined', false);
    window.debug_set_enemy_attacks_enabled?.(false);
    window.debug_defeat_all_enemies?.();
    window.debug_spawn_enemy_roles?.(['brute']);
    window.debug_set_active_character?.('willow');
    window.debug_set_willow_stance?.('ruby');
    window.debug_set_willow_mp?.(100);
  });
  await advance(220);
  state = await getState();
  console.log('active', state.active_character, 'party', state.party.members);
  const enemy = await page.evaluate(() => (window.get_enemies?.() ?? []).find((e) => e.state !== 'dead'));
  await page.evaluate(({x,z,id})=>{ window.debug_teleport_player?.(x-0.56,z); window.debug_set_target_entity?.(id); window.debug_set_target_hp?.(110); }, enemy);
  await page.evaluate(() => window.debug_set_combat_active?.(true));
  await advance(140);
  for (let i=0;i<4;i++) {
    const res = await page.evaluate((id) => { window.debug_set_target_entity?.(id); return window.debug_cast_willow_spell?.('h'); }, enemy.id);
    state = await getState();
    console.log('attempt',i,'res',res,'active',state.active_character,'partyActive',state.party_active_member,'willowFollower',state.party.willowFollower,'members',state.party_ai_state?.members);
    await advance(240);
  }
  await browser.close();
})();
