function hasFlag(context, flagKey) {
  return Boolean(context?.storyFlags?.[flagKey]);
}

function getStoryFlagValue(context, flagKey) {
  return context?.storyFlags?.[flagKey];
}

function hasAllMembers(context, required = []) {
  const present = new Set(
    Array.isArray(context?.partyMembersPresent)
      ? context.partyMembersPresent.map((entry) => String(entry ?? "").toLowerCase())
      : []
  );
  return required.every((memberId) => present.has(String(memberId ?? "").toLowerCase()));
}

function objectiveIs(context, objectiveId = "") {
  return (
    String(context?.activeObjective ?? "")
      .trim()
      .toLowerCase() === String(objectiveId ?? "").trim().toLowerCase()
  );
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

export const GUIDANCE_BANTER_SETS = deepFreeze({
  return_to_rowan: [
    {
      id: "guide-rowan-elaine",
      speakerId: "elaine",
      levels: [
        "Rowan will parse that tremor faster than we can. Back to Thornmere.",
        "We are burning useful minutes. Rowan is waiting.",
        "If you insist on delaying, do it while walking to Rowan.",
      ],
    },
    {
      id: "guide-rowan-arthur",
      speakerId: "arthur",
      levels: [
        "Rowan should hear this now. Move.",
        "No more circling. Rowan first.",
        "Stalling here helps no one. Thornmere. Now.",
      ],
    },
  ],
  travel_to_emberfall: [
    {
      id: "guide-emberfall-elaine",
      speakerId: "elaine",
      levels: [
        "East. The ash-wind marks the ridge path.",
        "Emberfall will not wait for polite timing.",
        "Debate later. Follow the ash-wind now.",
      ],
    },
    {
      id: "guide-emberfall-arthur",
      speakerId: "arthur",
      levels: [
        "Ridge path. East side. Keep moving.",
        "We already have the lead. Take it.",
        "Standing here will not get us to Emberfall.",
      ],
    },
    {
      id: "guide-emberfall-willow",
      speakerId: "willow",
      levels: [
        "Ash on the wind means east. Easy compass.",
        "Trail is cooling. Feet should not be.",
        "Move now, snacks later. Emberfall first.",
      ],
    },
  ],
  find_willow: [
    {
      id: "guide-find-willow-elaine",
      speakerId: "elaine",
      levels: [
        "Search the fused basalt outcrop. Willow favors high stone and clean sightlines.",
        "Do not drift. The outcrop first, conversation second.",
        "Basalt outcrop. Now. We can indulge uncertainty after contact.",
      ],
    },
    {
      id: "guide-find-willow-arthur",
      speakerId: "arthur",
      levels: [
        "Willow should be near the fused rock. Check the clearing.",
        "Eyes up. Find Willow before scouts do.",
        "Stop circling. Basalt outcrop, now.",
      ],
    },
  ],
  survive_ambush: [
    {
      id: "guide-survive-elaine",
      speakerId: "elaine",
      levels: [
        "Hold formation. Break the scouts and keep the line clean.",
        "Contain them quickly. We cannot afford a drawn-out skirmish.",
        "This is simple: survive, then move. No theatrics.",
      ],
    },
    {
      id: "guide-survive-arthur",
      speakerId: "arthur",
      levels: [
        "Ambush is live. Hold this clearing.",
        "No retreat. We finish this pack now.",
        "Scouts first. Breathing later.",
      ],
    },
    {
      id: "guide-survive-willow",
      speakerId: "willow",
      levels: [
        "Ambush math says: stand, strike, repeat.",
        "Keep breathing and keep swinging. Scouts hate that.",
        "No sightseeing. Survive the welcome party.",
      ],
    },
  ],
  investigate_listening_spike: [
    {
      id: "guide-listening-elaine",
      speakerId: "elaine",
      levels: [
        "The metallic hum is our guide. Find the Listening Spike.",
        "Do not wander. Follow the hum and locate the Spike.",
        "Hum first, hesitation later. Find the Listening Spike now.",
      ],
    },
    {
      id: "guide-listening-arthur",
      speakerId: "arthur",
      levels: [
        "Hear that hum? That's the site. Move.",
        "Spike is close. Keep to the sound.",
        "No drifting. Find the listener and break its rhythm.",
      ],
    },
    {
      id: "guide-listening-willow",
      speakerId: "willow",
      levels: [
        "Metal ears are singing nearby. Let's unplug them.",
        "Hot tip: creepy hum means we are close.",
        "Find the humming tooth before it memorizes us.",
      ],
    },
  ],
  report_back_to_rowan: [
    {
      id: "guide-report-rowan-elaine",
      speakerId: "elaine",
      levels: [
        "We have evidence. Rowan should hear it directly.",
        "No detours. We report to Rowan now.",
        "Take this to Rowan before Vaeloris rewrites the scene.",
      ],
    },
    {
      id: "guide-report-rowan-arthur",
      speakerId: "arthur",
      levels: [
        "Spike is handled. Back to Rowan.",
        "Rowan needs this report now.",
        "Enough sightseeing. Thornmere, Rowan, move.",
      ],
    },
    {
      id: "guide-report-rowan-willow",
      speakerId: "willow",
      levels: [
        "Mission note for Grandpa Rowan: we found the loud needle.",
        "Report time. I promise to use only half my dramatic version.",
        "Rowan first, jokes second. Maybe.",
      ],
    },
  ],
  reach_harvester_site: [
    {
      id: "guide-harvester-reach-elaine",
      speakerId: "elaine",
      levels: [
        "Follow the metal stink. The Harvester will not hide itself.",
        "Emberfall first. Rig second. Hesitation never.",
        "The rig is waiting and calibrating. Move.",
      ],
    },
    {
      id: "guide-harvester-reach-arthur",
      speakerId: "arthur",
      levels: [
        "Back to Emberfall. Find the rig.",
        "Trail goes hot ahead. Keep pace.",
        "No drifting. Harvester site now.",
      ],
    },
    {
      id: "guide-harvester-reach-willow",
      speakerId: "willow",
      levels: [
        "If you hear a hum, that's the ground gossiping about the rig.",
        "Metal heartbeat ahead. Let us interrupt politely.",
        "March now, dramatic speeches at the rig.",
      ],
    },
  ],
  defeat_harvester_warden: [
    {
      id: "guide-harvester-defeat-elaine",
      speakerId: "elaine",
      levels: [
        "Those anchors feed the surge. Break them first.",
        "Cut the anchors, then cut the Warden.",
        "Anchor discipline, then damage. Keep focus.",
      ],
    },
    {
      id: "guide-harvester-defeat-arthur",
      speakerId: "arthur",
      levels: [
        "We cut the legs first. Anchors, then core.",
        "Meter climbs if anchors stand. Break them.",
        "No tunnel vision. Anchors now.",
      ],
    },
    {
      id: "guide-harvester-defeat-willow",
      speakerId: "willow",
      levels: [
        "Kick the tripod. Always kick the tripod.",
        "Anchors down, surge down. Easy terrible math.",
        "If it hums louder, break another anchor.",
      ],
    },
  ],
  return_to_rowan_after_harvester: [
    {
      id: "guide-harvester-return-elaine",
      speakerId: "elaine",
      levels: [
        "Choice made. We report to Rowan immediately.",
        "No detours. Rowan needs this before Vaeloris adapts.",
        "Your conscience can wait. Rowan cannot.",
      ],
    },
    {
      id: "guide-harvester-return-arthur",
      speakerId: "arthur",
      levels: [
        "Harvester is done. Back to Rowan.",
        "We move to Thornmere. Now.",
        "Stop circling. Report first.",
      ],
    },
    {
      id: "guide-harvester-return-willow",
      speakerId: "willow",
      levels: [
        "Rowan gets the report and my carefully edited chaos version.",
        "Back to the old man with the good eyebrows.",
        "Report now, regrets later.",
      ],
    },
  ],
  clear_ridge_patrol: [
    {
      id: "guide-ridge-patrol-elaine",
      speakerId: "elaine",
      levels: [
        "Vaeloris scouts are probing the ridge road. Remove them cleanly.",
        "Do not let them map Thornmere. Clear the patrol now.",
        "No dithering. Erase that patrol and reopen the road.",
      ],
    },
    {
      id: "guide-ridge-patrol-arthur",
      speakerId: "arthur",
      levels: [
        "Scouts on the ridge. We clear them first.",
        "Road stays closed until that patrol falls.",
        "Stop circling. Patrol first, then gate.",
      ],
    },
    {
      id: "guide-ridge-patrol-willow",
      speakerId: "willow",
      levels: [
        "Metal birds on the road. Time to un-bird them.",
        "Ridge scouts are humming. Let us interrupt loudly.",
        "Clear the patrol before it writes a map of us.",
      ],
    },
  ],
  cross_ridge_gate: [
    {
      id: "guide-cross-ridge-elaine",
      speakerId: "elaine",
      levels: [
        "The ridge path is open. We cross before Vaeloris adjusts.",
        "Now is the useful window. Through the gate.",
        "Move. Open gates are temporary luxuries.",
      ],
    },
    {
      id: "guide-cross-ridge-arthur",
      speakerId: "arthur",
      levels: [
        "Road is clear. Cross the ridge.",
        "Gate is open. Keep pace.",
        "Forward. This is the moment.",
      ],
    },
    {
      id: "guide-cross-ridge-willow",
      speakerId: "willow",
      levels: [
        "New wind, new trouble. Let us go meet it.",
        "Gate is open and dramatic. We should reward that.",
        "Cross now, overthink later!",
      ],
    },
  ],
  find_waystone_circle: [
    {
      id: "guide-waystone-find-elaine",
      speakerId: "elaine",
      levels: [
        "Follow the cleaner wind and standing stones. The Waystone Circle is near.",
        "Do not meander. Waystone first, speculation after.",
        "The Circle waits. Move before Vaeloris does.",
      ],
    },
    {
      id: "guide-waystone-find-arthur",
      speakerId: "arthur",
      levels: [
        "Circle should be ahead. Keep to the stones.",
        "Wind changed here. Waystone is close.",
        "No drifting. Find the Circle now.",
      ],
    },
    {
      id: "guide-waystone-find-willow",
      speakerId: "willow",
      levels: [
        "Hear the whistle in the rocks? That's Waystone gossip.",
        "Circle's humming. Feet faster, please.",
        "Find the stones before they start judging us.",
      ],
    },
  ],
  drop_relay: [
    {
      id: "guide-relay-drop-elaine",
      speakerId: "elaine",
      levels: [
        "They tethered a relay to the Circle. Cut every post.",
        "Ignore theatrics. Tethers first.",
        "Break the posts now or we fight this song forever.",
      ],
    },
    {
      id: "guide-relay-drop-arthur",
      speakerId: "arthur",
      levels: [
        "Relay is feeding off those posts. Drop them.",
        "Posts first, scouts second if needed.",
        "No tunnel vision. Tear down the tether line.",
      ],
    },
    {
      id: "guide-relay-drop-willow",
      speakerId: "willow",
      levels: [
        "Tripod rules still apply: kick every leg.",
        "Cut posts, kill hum, celebrate later.",
        "Relay's loud because we left poles standing. Fix that.",
      ],
    },
  ],
  attune_waystone: [
    {
      id: "guide-waystone-attune-elaine",
      speakerId: "elaine",
      levels: [
        "Relay is down. Touch the Waystone while it is quiet.",
        "Attunement now, debrief later.",
        "No dawdling. The stone is listening to us now.",
      ],
    },
    {
      id: "guide-waystone-attune-arthur",
      speakerId: "arthur",
      levels: [
        "Circle's clear. We attune now.",
        "Touch the stone and take what it shows.",
        "We're here. Waystone next, move.",
      ],
    },
    {
      id: "guide-waystone-attune-willow",
      speakerId: "willow",
      levels: [
        "Big glowing rock says 'poke me carefully.'",
        "Attune now before the wind changes verse.",
        "Stone-time. Fingers brave, brains on.",
      ],
    },
  ],
  return_to_rowan_with_waystone_news: [
    {
      id: "guide-waystone-report-elaine",
      speakerId: "elaine",
      levels: [
        "We have a reading. Rowan must hear it in full.",
        "No detours. Thornmere, then Rowan.",
        "Report now, regrets later.",
      ],
    },
    {
      id: "guide-waystone-report-arthur",
      speakerId: "arthur",
      levels: [
        "Waystone's done. Back to Rowan.",
        "We move straight home with this.",
        "No wandering. Rowan first.",
      ],
    },
    {
      id: "guide-waystone-report-willow",
      speakerId: "willow",
      levels: [
        "We got spooky stone news for Grandpa Rowan.",
        "Back to Thornmere before my memory gets dramatic.",
        "Move now. I only have so many useful jokes.",
      ],
    },
  ],
  return_to_rowan_after_convergence: [
    {
      id: "guide-convergence-return-elaine",
      speakerId: "elaine",
      levels: [
        "Rowan must hear this before rumor does. Thornmere, now.",
        "No drift, no delay. Rowan first.",
        "If we hesitate now, we hand Vaeloris the initiative.",
      ],
    },
    {
      id: "guide-convergence-return-arthur",
      speakerId: "arthur",
      levels: [
        "We report to Rowan. Move.",
        "No loops. Thornmere, straight line.",
        "We already chose. Now we answer for it.",
      ],
    },
    {
      id: "guide-convergence-return-willow",
      speakerId: "willow",
      levels: [
        "Grandpa Rowan gets first listen. Boots up.",
        "No scenic panic tour. Rowan, now.",
        "We can spiral later. Walk first.",
      ],
    },
  ],
  stop_mute_spikes: [
    {
      id: "guide-mute-spikes-elaine",
      speakerId: "elaine",
      levels: [
        "Vaeloris is choking Thornmere's roots. Destroy all three Mute Spikes.",
        "No distractions. Break the pylons and free the grove.",
        "Three spikes. Zero excuses. Move.",
      ],
    },
    {
      id: "guide-mute-spikes-arthur",
      speakerId: "arthur",
      levels: [
        "Spikes first. Village second. Go.",
        "Every second they stand, Thornmere loses breath.",
        "No waiting. Break them now.",
      ],
    },
    {
      id: "guide-mute-spikes-willow",
      speakerId: "willow",
      levels: [
        "Three rude towers, three things to smash.",
        "Mute Spikes hate being hit repeatedly. Convenient.",
        "Go break the hush machines before they finish the song.",
      ],
    },
  ],
  take_new_route: [
    {
      id: "guide-take-new-route-elaine",
      speakerId: "elaine",
      levels: [
        "The Rootway opened. We cross before it closes.",
        "Move now. Open routes are temporary gifts.",
        "Forward, before someone decides this gate was a mistake.",
      ],
    },
    {
      id: "guide-take-new-route-arthur",
      speakerId: "arthur",
      levels: [
        "Path is open. Take it.",
        "Rootway now. We earned it.",
        "No delay. New route, now.",
      ],
    },
    {
      id: "guide-take-new-route-willow",
      speakerId: "willow",
      levels: [
        "Fresh tunnel, fresh trouble. Let us preemptively wave.",
        "Rootway's open and dramatic. I love that for us.",
        "Move while the roots are still feeling generous.",
      ],
    },
  ],
  return_to_rowan_or_press_on: [
    {
      id: "guide-region4-elaine",
      speakerId: "elaine",
      levels: [
        "Mark this route, then return to Rowan with a proper report.",
        "Observe, record, withdraw. Rowan needs this whole.",
        "No heroics in the dark. Gather truth and move.",
      ],
    },
    {
      id: "guide-region4-arthur",
      speakerId: "arthur",
      levels: [
        "Keep close. Learn the route, then back to Rowan.",
        "Short push, then report. Stay steady.",
        "No wandering. Map the path and return.",
      ],
    },
    {
      id: "guide-region4-willow",
      speakerId: "willow",
      levels: [
        "New cave-song noted. We bring it home to Rowan.",
        "Quick peek, clean memory, then home stretch.",
        "We do not get lost in spooky hallways today.",
      ],
    },
  ],
  region3_first_steps: [
    {
      id: "guide-region3-arthur",
      speakerId: "arthur",
      levels: [
        "Beyond the ridge now. Stay sharp and keep moving.",
        "New ground, same rule: steady pace.",
        "No stopping yet. Learn the path while it is quiet.",
      ],
    },
    {
      id: "guide-region3-elaine",
      speakerId: "elaine",
      levels: [
        "Observe first. Speak second. We are in unfamiliar country.",
        "Take this road in measured steps.",
        "Composure and momentum. Do not break either.",
      ],
    },
    {
      id: "guide-region3-willow",
      speakerId: "willow",
      levels: [
        "New sky-song. Keep walking so it cannot catch up.",
        "Ridge Beyond says hello. We say hello with boots.",
        "Forward, heroes. The wind has notes for us.",
      ],
    },
  ],
  vein: [
    {
      id: "guide-vein-elaine",
      speakerId: "elaine",
      levels: [
        "Hold the ring steady. It is still tightening.",
        "The vein is not finished. Stay with it.",
        "Stillness feeds it. Step, hold, stabilize.",
      ],
    },
    {
      id: "guide-vein-arthur",
      speakerId: "arthur",
      levels: [
        "Vein is live. Keep pressure on it.",
        "We are not done. Hold the line.",
        "Move. The vein punishes hesitation.",
      ],
    },
  ],
  boss_available: [
    {
      id: "guide-boss-elaine",
      speakerId: "elaine",
      levels: [
        "The Warden is active. We should answer it now.",
        "Every delay gives that rig another cycle.",
        "The machine is calibrating while we loiter. Move.",
      ],
    },
    {
      id: "guide-boss-arthur",
      speakerId: "arthur",
      levels: [
        "Harvester site is still hot. Go.",
        "The longer we wait, the worse this gets.",
        "Enough waiting. Warden now.",
      ],
    },
  ],
  ridge_gate: [
    {
      id: "guide-ridge-elaine",
      speakerId: "elaine",
      levels: [
        "The ridge is open. Let us use it.",
        "That path will not stay kind forever.",
        "Ridge gate is open. Do not waste it.",
      ],
    },
    {
      id: "guide-ridge-willow",
      speakerId: "willow",
      levels: [
        "Ridge wind says 'this way.' I vote we listen.",
        "Open gates are polite warnings. We should go.",
        "The ridge is literally open. Legs please.",
      ],
    },
  ],
  patrol_nearby: [
    {
      id: "guide-patrol-arthur",
      speakerId: "arthur",
      levels: [
        "Patrol trail ahead. Clear it and push on.",
        "If we wait, they regroup. Move.",
        "Cut through patrol now, not twice later.",
      ],
    },
    {
      id: "guide-patrol-elaine",
      speakerId: "elaine",
      levels: [
        "Vaeloris patrol coils are nearby. We advance cleanly.",
        "Delay lets them tighten their net.",
        "Move before they claim this route outright.",
      ],
    },
  ],
  crown_fractured: [
    {
      id: "guide-crown-arthur",
      speakerId: "arthur",
      levels: [
        "Crown is fractured. Keep moving.",
        "Air is wrong. We move through it.",
        "Do not root here. Push forward.",
      ],
    },
    {
      id: "guide-crown-willow",
      speakerId: "willow",
      levels: [
        "Fracture-hum is loud. Let us be louder with our footsteps.",
        "Bad sky-song. Better keep pace.",
        "Still feet in fractured air is a terrible hobby.",
      ],
    },
  ],
  reach_crownheart_vault: [
    {
      id: "guide-ch9-reach-vault-arthur",
      speakerId: "arthur",
      levels: [
        "Vault approach is ahead. Move before the roots tear wider.",
        "No detours. Crownheart Vault now.",
        "Every second here helps the Sundering. Move.",
      ],
    },
    {
      id: "guide-ch9-reach-vault-elaine",
      speakerId: "elaine",
      levels: [
        "To the Vault approach. We are out of ornamental time.",
        "Please proceed with urgency and competence.",
        "Forward. The world is not waiting for our hesitation.",
      ],
    },
  ],
  stabilize_worldroots: [
    {
      id: "guide-ch9-stabilize-anchors-arthur",
      speakerId: "arthur",
      levels: [
        "Three anchors. Attune all three before the next wave.",
        "Anchor, move, anchor. Keep the meter down.",
        "Stop drifting. Attune now.",
      ],
    },
    {
      id: "guide-ch9-stabilize-anchors-willow",
      speakerId: "willow",
      levels: [
        "Roots are scream-singing. Hug an anchor and harmonize fast.",
        "If attunement breaks, breathe and restart immediately.",
        "Anchor math is simple: three done or everyone gone.",
      ],
    },
  ],
  defeat_null_archivist: [
    {
      id: "guide-ch9-archivist-elaine",
      speakerId: "elaine",
      levels: [
        "Destroy Echo Nodes when they manifest, then return to the Archivist.",
        "Avoid Null Fields. They corrupt spell rhythm.",
        "Finish this archivist now, before memory folds.",
      ],
    },
    {
      id: "guide-ch9-archivist-arthur",
      speakerId: "arthur",
      levels: [
        "Nodes first if the wipe charge starts.",
        "When the collapse ring blooms, move out or hug anchor light.",
        "No panic. Read and react.",
      ],
    },
  ],
  make_vault_choice: [
    {
      id: "guide-ch9-choice-elaine",
      speakerId: "elaine",
      levels: [
        "Decide now: seal the Vault or take the Key. Delay is its own choice.",
        "Either path carries cost. Choose deliberately.",
        "Make the call. We move the instant it is made.",
      ],
    },
    {
      id: "guide-ch9-choice-willow",
      speakerId: "willow",
      levels: [
        "Seal for safety, key for power. Either way, no pretending.",
        "Pick your terrifying flavor and let's survive it.",
        "Choice time, heroes. Cataclysm will not hold the door.",
      ],
    },
  ],
  prepare_endgame: [
    {
      id: "guide-ch9-endgame-arthur",
      speakerId: "arthur",
      levels: [
        "Endgame route is open. We hunt the Last Spire.",
        "Waystone check, third seal, then the spire path.",
        "Move. Endgame starts now.",
      ],
    },
    {
      id: "guide-ch9-endgame-elaine",
      speakerId: "elaine",
      levels: [
        "The world remains standing by inches. Let us keep those inches.",
        "Attend the tasks in order, and do not indulge dread.",
        "To the route gate. We finish this properly.",
      ],
    },
  ],
  obtain_third_seal: [
    {
      id: "guide-endgame-act1-third-seal-arthur",
      speakerId: "arthur",
      levels: [
        "Oath Sigil Shrine first. Bind the Third Seal and move.",
        "Hold the shrine ring, drop the custodian, attune fast.",
        "No drift. Third Seal now.",
      ],
    },
    {
      id: "guide-endgame-act1-third-seal-elaine",
      speakerId: "elaine",
      levels: [
        "Three binds doctrine begins here. Oath Sigil first, argument later.",
        "If attunement breaks, reset instantly and continue the rite.",
        "Complete the bind. The Spire is already humming.",
      ],
    },
  ],
  breach_outer_spire: [
    {
      id: "guide-endgame-act1-breach-elaine",
      speakerId: "elaine",
      levels: [
        "Disable all three lock nodes before the gate discharges.",
        "Node, rotate, node. Keep the breach meter low.",
        "No hesitation. Break the locks now.",
      ],
    },
    {
      id: "guide-endgame-act1-breach-willow",
      speakerId: "willow",
      levels: [
        "Spire scouts incoming. Smash nodes, dodge lightning, repeat.",
        "If the meter caps, the gate slaps reality. Keep it below screaming.",
        "Three nodes, then dramatic entrance. Move those boots.",
      ],
    },
  ],
  defeat_gatewarden: [
    {
      id: "guide-endgame-act1-gatewarden-arthur",
      speakerId: "arthur",
      levels: [
        "Gatewarden up. Read telegraphs and stay disciplined.",
        "Overload ring means out or behind cover. No guesses.",
        "Finish this now and open the door.",
      ],
    },
    {
      id: "guide-endgame-act1-gatewarden-elaine",
      speakerId: "elaine",
      levels: [
        "Null Clamp zones will blunt our recovery. Step clear deliberately.",
        "Conduit Overload on cast. Respect timing, then punish.",
        "Break the warden. The Spire answers only force now.",
      ],
    },
  ],
  enter_outer_spire: [
    {
      id: "guide-endgame-act1-enter-spire-willow",
      speakerId: "willow",
      levels: [
        "Door is open. We have truth and tools, so now we go loud.",
        "Antechamber first, panic later. Preferably much later.",
        "Inside now. Last Spire is waiting.",
      ],
    },
    {
      id: "guide-endgame-act1-enter-spire-arthur",
      speakerId: "arthur",
      levels: [
        "Gate is ours. Step inside and keep formation tight.",
        "No delay at the threshold. Enter the Spire.",
        "Forward. Endgame continues inside.",
      ],
    },
  ],
  enter_inner_spire: [
    {
      id: "guide-endgame-act2-enter-inner-elaine",
      speakerId: "elaine",
      levels: [
        "Inner gate now. The Loom will not remain patient.",
        "No threshold dithering. Enter and claim lock control.",
        "Inside. We are out of ceremonial time.",
      ],
    },
    {
      id: "guide-endgame-act2-enter-inner-willow",
      speakerId: "willow",
      levels: [
        "Spire belly is open. In we go before it bites shut.",
        "Inner hall, then locks, then dramatic survival. March.",
        "Doorway crossed equals less screaming later. Move.",
      ],
    },
  ],
  solve_resonance_locks: [
    {
      id: "guide-endgame-act2-locks-arthur",
      speakerId: "arthur",
      levels: [
        "Three locks. Align, rotate, align.",
        "Pressure rises if we stall. Finish each channel cleanly.",
        "Lock order does not matter. Completion does.",
      ],
    },
    {
      id: "guide-endgame-act2-locks-elaine",
      speakerId: "elaine",
      levels: [
        "Hold the channel for the full bind. Interruptions waste blood.",
        "If pressure spikes, clear space and resume at once.",
        "One lock left means no mistakes.",
      ],
    },
  ],
  defeat_loom_proctor: [
    {
      id: "guide-endgame-act2-loom-arthur",
      speakerId: "arthur",
      levels: [
        "Weave Cut line incoming. Step out before it lands.",
        "Pillars up means shielded. Break both fast.",
        "Tax phase next. Heals are weaker, spacing matters more.",
      ],
    },
    {
      id: "guide-endgame-act2-loom-willow",
      speakerId: "willow",
      levels: [
        "Do not stand in fresh fissures. They remember grudges.",
        "Prism pillars first, then smack the Proctor.",
        "If your health dips, kite clean and reset rhythm.",
      ],
    },
  ],
  approach_last_door: [
    {
      id: "guide-endgame-act2-last-door-elaine",
      speakerId: "elaine",
      levels: [
        "Approach the Last Door. We verify what it demands.",
        "No bravado. We listen, then prepare final entry.",
        "Stand before the Door and commit to the last bind.",
      ],
    },
    {
      id: "guide-endgame-act2-last-door-arthur",
      speakerId: "arthur",
      levels: [
        "Last Door ahead. Confirm, breathe, then move for the final push.",
        "Door first. Arguments after.",
        "We are one room from the storm. Keep moving.",
      ],
    },
  ],
  open_last_door: [
    {
      id: "guide-endgame-act3-open-door-arthur",
      speakerId: "arthur",
      levels: [
        "Stand at the Door. We open once and do not step back.",
        "Last check. Then through.",
        "No more waiting. Open it.",
      ],
    },
    {
      id: "guide-endgame-act3-open-door-elaine",
      speakerId: "elaine",
      levels: [
        "Protocol is simple now: breathe, bind, advance.",
        "No ceremony. Action.",
        "Door first. Doubt later.",
      ],
    },
  ],
  cross_rift: [
    {
      id: "guide-endgame-act3-rift-arthur",
      speakerId: "arthur",
      levels: [
        "Three anchors stabilize the crossing. Fast channels, no drift.",
        "If stability drops, hit the nearest anchor immediately.",
        "Do not fight in the Rift. Cross it.",
      ],
    },
    {
      id: "guide-endgame-act3-rift-willow",
      speakerId: "willow",
      levels: [
        "Rift bites ankles first, souls second. Keep moving.",
        "Anchor, dodge, anchor, dodge. Beautiful rhythm.",
        "Bridge is temporary. So are we if we stall.",
      ],
    },
  ],
  reach_crown_engine: [
    {
      id: "guide-endgame-act3-core-elaine",
      speakerId: "elaine",
      levels: [
        "Disable all three clamps around the Engine core.",
        "Pulse telegraph means reposition, then resume clamp work.",
        "Clamps down, then crown.",
      ],
    },
    {
      id: "guide-endgame-act3-core-arthur",
      speakerId: "arthur",
      levels: [
        "Split cleanly and clear clamps one by one.",
        "Do not chase adds past the core ring.",
        "Finish clamps now. Boss next.",
      ],
    },
  ],
  defeat_final_boss: [
    {
      id: "guide-endgame-act3-boss-arthur",
      speakerId: "arthur",
      levels: [
        "Read line tells, then punish windows.",
        "Shockwave ring has one safe rule. Follow it every time.",
        "Phase three means tighter tempo, not panic.",
      ],
    },
    {
      id: "guide-endgame-act3-boss-willow",
      speakerId: "willow",
      levels: [
        "When Rewrite Mark lands, play cleaner, not greedier.",
        "Pillars are cover, not decoration.",
        "Hold formation. Make the Crown blink first.",
      ],
    },
  ],
  choose_ending: [
    {
      id: "guide-endgame-act3-choice-elaine",
      speakerId: "elaine",
      levels: [
        "The altar requires intent and confirmation. Choose deliberately.",
        "Seal for stability, rewrite for uncertainty. Both have cost.",
        "This is the final bind. Decide and confirm.",
      ],
    },
    {
      id: "guide-endgame-act3-choice-willow",
      speakerId: "willow",
      levels: [
        "Pick one lane, then tap again to commit. No accidental apocalypse.",
        "Slow hands. Big consequences.",
        "Choose like you mean it.",
      ],
    },
  ],
  credits: [
    {
      id: "guide-endgame-act3-credits-arthur",
      speakerId: "arthur",
      levels: [
        "It is over. Breathe.",
      ],
    },
  ],
  idle: [
    {
      id: "guide-idle-elaine",
      speakerId: "elaine",
      levels: [
        "We should keep pace with the objective.",
        "Progress requires motion, not contemplation.",
        "You may think while walking. Start with walking.",
      ],
    },
    {
      id: "guide-idle-willow",
      speakerId: "willow",
      levels: [
        "We moving or decorating the same patch of dirt?",
        "Objective is over there, dramatically waiting.",
        "I admire statues. We are not statues.",
      ],
    },
  ],
});

const EARLY_AE_UNLOCK = (ctx) => hasAllMembers(ctx, ["arthur", "elaine"]) && hasFlag(ctx, "elaine_joined");
const POST_VEIN_GUARDIAN = (ctx) => EARLY_AE_UNLOCK(ctx) && hasFlag(ctx, "vein_guardian_defeated");
const POST_EXTRACTOR = (ctx) => EARLY_AE_UNLOCK(ctx) && hasFlag(ctx, "vaeloris_field_triggered");
const POST_EMBERFALL_LEAD = (ctx) => EARLY_AE_UNLOCK(ctx) && hasFlag(ctx, "emberfall_lead_unlocked");
const WITH_WILLOW = (ctx) => hasAllMembers(ctx, ["arthur", "elaine", "willow"]) && hasFlag(ctx, "willow_joined");
const OBJECTIVE_TRAVEL_EMBERFALL = (ctx) => POST_EMBERFALL_LEAD(ctx) && objectiveIs(ctx, "travel_to_emberfall");
const OBJECTIVE_FIND_WILLOW = (ctx) => EARLY_AE_UNLOCK(ctx) && objectiveIs(ctx, "find_willow");
const CH3_DEBRIEF_DONE = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter3_rowan_debrief_done");
const OBJECTIVE_INVESTIGATE_SPIKE = (ctx) => CH3_DEBRIEF_DONE(ctx) && objectiveIs(ctx, "investigate_listening_spike");
const OBJECTIVE_REPORT_ROWAN_CH3 = (ctx) => CH3_DEBRIEF_DONE(ctx) && objectiveIs(ctx, "report_back_to_rowan");
const CH3_CHOICE_CRUSH =
  (ctx) => CH3_DEBRIEF_DONE(ctx) && String(getStoryFlagValue(ctx, "listening_spike_choice") ?? "").toLowerCase() === "crush";
const CH3_CHOICE_POCKET =
  (ctx) => CH3_DEBRIEF_DONE(ctx) && String(getStoryFlagValue(ctx, "listening_spike_choice") ?? "").toLowerCase() === "pocket";
const CH4_REPORT_DONE = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter4_rowan_report_done");
const OBJECTIVE_REACH_HARVESTER = (ctx) => CH4_REPORT_DONE(ctx) && objectiveIs(ctx, "reach_harvester_site");
const OBJECTIVE_DEFEAT_HARVESTER = (ctx) => CH4_REPORT_DONE(ctx) && objectiveIs(ctx, "defeat_harvester_warden");
const OBJECTIVE_RETURN_ROWAN_AFTER_HARVESTER =
  (ctx) => CH4_REPORT_DONE(ctx) && objectiveIs(ctx, "return_to_rowan_after_harvester");
const CH4_CHOICE_SHATTER =
  (ctx) => CH4_REPORT_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const CH4_CHOICE_SALVAGE =
  (ctx) => CH4_REPORT_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const CH5_AFTERSHOCK_DONE = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter5_aftershock_done");
const OBJECTIVE_CLEAR_RIDGE_PATROL = (ctx) => CH5_AFTERSHOCK_DONE(ctx) && objectiveIs(ctx, "clear_ridge_patrol");
const OBJECTIVE_CROSS_RIDGE_GATE = (ctx) => CH5_AFTERSHOCK_DONE(ctx) && objectiveIs(ctx, "cross_ridge_gate");
const OBJECTIVE_REGION3_FIRST_STEPS = (ctx) => CH5_AFTERSHOCK_DONE(ctx) && objectiveIs(ctx, "region3_first_steps");
const CH5_CHOICE_SHATTER =
  (ctx) => CH5_AFTERSHOCK_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const CH5_CHOICE_SALVAGE =
  (ctx) => CH5_AFTERSHOCK_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const CH6_ARRIVED_WINDWARD = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter6_arrived_windward");
const CH6_RELAY_DROPPED = (ctx) => CH6_ARRIVED_WINDWARD(ctx) && hasFlag(ctx, "chapter6_relay_dropped");
const CH6_WAYSTONE_ATTUNED = (ctx) => CH6_ARRIVED_WINDWARD(ctx) && hasFlag(ctx, "chapter6_waystone_attuned");
const OBJECTIVE_FIND_WAYSTONE_CIRCLE = (ctx) => CH6_ARRIVED_WINDWARD(ctx) && objectiveIs(ctx, "find_waystone_circle");
const OBJECTIVE_DROP_RELAY = (ctx) => CH6_ARRIVED_WINDWARD(ctx) && objectiveIs(ctx, "drop_relay");
const OBJECTIVE_ATTUNE_WAYSTONE = (ctx) => CH6_ARRIVED_WINDWARD(ctx) && objectiveIs(ctx, "attune_waystone");
const OBJECTIVE_RETURN_WAYSTONE_NEWS =
  (ctx) => CH6_WAYSTONE_ATTUNED(ctx) && objectiveIs(ctx, "return_to_rowan_with_waystone_news");
const CH6_CHOICE_SHATTER = (ctx) =>
  CH6_ARRIVED_WINDWARD(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const CH6_CHOICE_SALVAGE = (ctx) =>
  CH6_ARRIVED_WINDWARD(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const CH8_AFTERMATH_DONE = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter8_aftermath_done");
const CH8_RETALIATION_ACTIVE = (ctx) =>
  CH8_AFTERMATH_DONE(ctx) &&
  hasFlag(ctx, "chapter8_retaliation_started") &&
  !hasFlag(ctx, "chapter8_mute_spikes_cleared");
const CH8_MUTE_SPIKES_CLEARED = (ctx) => CH8_AFTERMATH_DONE(ctx) && hasFlag(ctx, "chapter8_mute_spikes_cleared");
const CH8_REGION4_ENTERED = (ctx) => CH8_AFTERMATH_DONE(ctx) && hasFlag(ctx, "region4_seed_entered");
const OBJECTIVE_RETURN_AFTER_CONVERGENCE =
  (ctx) => WITH_WILLOW(ctx) && objectiveIs(ctx, "return_to_rowan_after_convergence");
const OBJECTIVE_STOP_MUTE_SPIKES = (ctx) => CH8_AFTERMATH_DONE(ctx) && objectiveIs(ctx, "stop_mute_spikes");
const OBJECTIVE_TAKE_NEW_ROUTE = (ctx) => CH8_MUTE_SPIKES_CLEARED(ctx) && objectiveIs(ctx, "take_new_route");
const OBJECTIVE_RETURN_OR_PRESS_ON =
  (ctx) => CH8_REGION4_ENTERED(ctx) && objectiveIs(ctx, "return_to_rowan_or_press_on");
const CH8_CONVERGENCE_SHATTER =
  (ctx) => CH8_AFTERMATH_DONE(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "shatter";
const CH8_CONVERGENCE_TUNE =
  (ctx) => CH8_AFTERMATH_DONE(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "tune";
const CH8_HARVESTER_SHATTER =
  (ctx) => CH8_AFTERMATH_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const CH8_HARVESTER_SALVAGE =
  (ctx) => CH8_AFTERMATH_DONE(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const CH9_STARTED = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter9_started");
const CH9_ANCHORS_ATTUNED = (ctx) => CH9_STARTED(ctx) && hasFlag(ctx, "chapter9_anchors_attuned");
const CH9_ARCHIVIST_DEFEATED = (ctx) => CH9_STARTED(ctx) && hasFlag(ctx, "chapter9_null_archivist_defeated");
const CH9_ENDGAME_STARTED = (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "endgame_started");
const OBJECTIVE_REACH_CROWNHEART_VAULT = (ctx) => CH8_MUTE_SPIKES_CLEARED(ctx) && objectiveIs(ctx, "reach_crownheart_vault");
const OBJECTIVE_STABILIZE_WORLDROOTS = (ctx) => CH9_STARTED(ctx) && objectiveIs(ctx, "stabilize_worldroots");
const OBJECTIVE_DEFEAT_NULL_ARCHIVIST = (ctx) => CH9_ANCHORS_ATTUNED(ctx) && objectiveIs(ctx, "defeat_null_archivist");
const OBJECTIVE_MAKE_VAULT_CHOICE = (ctx) => CH9_ARCHIVIST_DEFEATED(ctx) && objectiveIs(ctx, "make_vault_choice");
const OBJECTIVE_PREPARE_ENDGAME = (ctx) => CH9_ENDGAME_STARTED(ctx) && objectiveIs(ctx, "prepare_endgame");
const CH9_HARVESTER_SHATTER =
  (ctx) => CH9_STARTED(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const CH9_HARVESTER_SALVAGE =
  (ctx) => CH9_STARTED(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const CH9_CONVERGENCE_SHATTER =
  (ctx) => CH9_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "shatter";
const CH9_CONVERGENCE_TUNE =
  (ctx) => CH9_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "tune";
const CH9_CHOICE_SEAL =
  (ctx) => CH9_ENDGAME_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "seal";
const CH9_CHOICE_TAKE_KEY =
  (ctx) => CH9_ENDGAME_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "take_key";
const ENDGAME_ACT1_STARTED = (ctx) => CH9_ENDGAME_STARTED(ctx) && hasFlag(ctx, "endgame_act1_started");
const ENDGAME_THIRD_SEAL_OBTAINED = (ctx) => ENDGAME_ACT1_STARTED(ctx) && hasFlag(ctx, "endgame_task_third_seal_obtained");
const ENDGAME_OUTER_SPIRE_UNLOCKED = (ctx) => ENDGAME_THIRD_SEAL_OBTAINED(ctx) && hasFlag(ctx, "endgame_outer_spire_unlocked");
const ENDGAME_OUTER_SPIRE_BREACHED = (ctx) => ENDGAME_OUTER_SPIRE_UNLOCKED(ctx) && hasFlag(ctx, "endgame_outer_spire_breached");
const ENDGAME_GATEWARDEN_DEFEATED = (ctx) => ENDGAME_OUTER_SPIRE_BREACHED(ctx) && hasFlag(ctx, "endgame_gatewarden_defeated");
const OBJECTIVE_OBTAIN_THIRD_SEAL = (ctx) => ENDGAME_ACT1_STARTED(ctx) && objectiveIs(ctx, "obtain_third_seal");
const OBJECTIVE_BREACH_OUTER_SPIRE = (ctx) => ENDGAME_OUTER_SPIRE_UNLOCKED(ctx) && objectiveIs(ctx, "breach_outer_spire");
const OBJECTIVE_DEFEAT_GATEWARDEN = (ctx) => ENDGAME_OUTER_SPIRE_BREACHED(ctx) && objectiveIs(ctx, "defeat_gatewarden");
const OBJECTIVE_ENTER_OUTER_SPIRE = (ctx) => ENDGAME_GATEWARDEN_DEFEATED(ctx) && objectiveIs(ctx, "enter_outer_spire");
const ENDGAME_ACT2_STARTED = (ctx) => ENDGAME_GATEWARDEN_DEFEATED(ctx) && hasFlag(ctx, "endgame_act2_started");
const ENDGAME_INNER_SPIRE_ENTERED = (ctx) => ENDGAME_ACT2_STARTED(ctx) && hasFlag(ctx, "endgame_inner_spire_entered");
const ENDGAME_RESONANCE_LOCKS_COMPLETE = (ctx) =>
  ENDGAME_INNER_SPIRE_ENTERED(ctx) &&
  hasFlag(ctx, "endgame_resonance_lock_1") &&
  hasFlag(ctx, "endgame_resonance_lock_2") &&
  hasFlag(ctx, "endgame_resonance_lock_3");
const ENDGAME_LOOM_PROCTOR_DEFEATED = (ctx) => ENDGAME_INNER_SPIRE_ENTERED(ctx) && hasFlag(ctx, "endgame_loom_proctor_defeated");
const ENDGAME_ACT3_UNLOCKED = (ctx) => ENDGAME_LOOM_PROCTOR_DEFEATED(ctx) && hasFlag(ctx, "endgame_act3_unlocked");
const ENDGAME_ACT3_STARTED = (ctx) => ENDGAME_ACT3_UNLOCKED(ctx) && hasFlag(ctx, "endgame_act3_started");
const ENDGAME_LAST_SPIRE_ENTERED = (ctx) => ENDGAME_ACT3_STARTED(ctx) && hasFlag(ctx, "endgame_last_spire_entered");
const ENDGAME_RIFT_CROSSED = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && hasFlag(ctx, "endgame_setpiece_rift_crossed");
const ENDGAME_CORE_REACHED = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && hasFlag(ctx, "endgame_setpiece_core_reached");
const ENDGAME_FINAL_BOSS_DEFEATED = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && hasFlag(ctx, "endgame_final_boss_defeated");
const OBJECTIVE_ENTER_INNER_SPIRE = (ctx) => ENDGAME_ACT2_STARTED(ctx) && objectiveIs(ctx, "enter_inner_spire");
const OBJECTIVE_SOLVE_RESONANCE_LOCKS = (ctx) => ENDGAME_INNER_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "solve_resonance_locks");
const OBJECTIVE_DEFEAT_LOOM_PROCTOR = (ctx) => ENDGAME_RESONANCE_LOCKS_COMPLETE(ctx) && objectiveIs(ctx, "defeat_loom_proctor");
const OBJECTIVE_APPROACH_LAST_DOOR = (ctx) => ENDGAME_ACT3_UNLOCKED(ctx) && objectiveIs(ctx, "approach_last_door");
const OBJECTIVE_OPEN_LAST_DOOR = (ctx) => ENDGAME_ACT3_UNLOCKED(ctx) && objectiveIs(ctx, "open_last_door");
const OBJECTIVE_CROSS_RIFT = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "cross_rift");
const OBJECTIVE_REACH_CROWN_ENGINE = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "reach_crown_engine");
const OBJECTIVE_DEFEAT_FINAL_BOSS = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "defeat_final_boss");
const OBJECTIVE_CHOOSE_ENDING = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "choose_ending");
const OBJECTIVE_CREDITS = (ctx) => ENDGAME_LAST_SPIRE_ENTERED(ctx) && objectiveIs(ctx, "credits");
const ENDGAME_CHOICE_SEAL = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "seal";
const ENDGAME_CHOICE_TAKE_KEY = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "take_key";
const ENDGAME_HARVESTER_SHATTER = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "shatter";
const ENDGAME_HARVESTER_SALVAGE = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "vaeloris_harvester_choice") ?? "").toLowerCase() === "salvage";
const ENDGAME_CONVERGENCE_SHATTER = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "shatter";
const ENDGAME_CONVERGENCE_TUNE = (ctx) =>
  ENDGAME_ACT1_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter7_convergence_choice") ?? "").toLowerCase() === "tune";
const ENDGAME_ACT2_CHOICE_SEAL = (ctx) =>
  ENDGAME_ACT2_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "seal";
const ENDGAME_ACT2_CHOICE_TAKE_KEY = (ctx) =>
  ENDGAME_ACT2_STARTED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "take_key";
const ENDGAME_ACT3_CHOICE_SEAL = (ctx) =>
  ENDGAME_LAST_SPIRE_ENTERED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "seal";
const ENDGAME_ACT3_CHOICE_TAKE_KEY = (ctx) =>
  ENDGAME_LAST_SPIRE_ENTERED(ctx) && String(getStoryFlagValue(ctx, "chapter9_choice") ?? "").toLowerCase() === "take_key";
const ENDGAME_ACT3_ENDING_SEAL = (ctx) =>
  ENDGAME_LAST_SPIRE_ENTERED(ctx) && String(getStoryFlagValue(ctx, "endgame_ending") ?? "").toLowerCase() === "seal";
const ENDGAME_ACT3_ENDING_REWRITE = (ctx) =>
  ENDGAME_LAST_SPIRE_ENTERED(ctx) && String(getStoryFlagValue(ctx, "endgame_ending") ?? "").toLowerCase() === "rewrite";
const CROWN_FRACTURED = (ctx) => String(ctx?.crownTier ?? "").trim().toLowerCase() === "fractured";
const CROWN_STILL_OR_UNEASY = (ctx) => {
  const tier = String(ctx?.crownTier ?? "").trim().toLowerCase();
  return tier === "still" || tier === "uneasy";
};

export const BANTER_TOPICS = deepFreeze([
  {
    id: "endgame_act3_nudge_open_last_door",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_OPEN_LAST_DOOR,
    priority: 760,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "This is the threshold. Open the Door and step through." },
      { speakerId: "elaine", text: "Composure, then entry. No hesitation at the hinge." },
    ],
  },
  {
    id: "endgame_act3_nudge_cross_rift_route",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CROSS_RIFT,
    priority: 759,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Three anchors stabilize the bridge. Left, rear, then far side." },
      { speakerId: "willow", text: "Tiny sprint, enormous consequences. Go anchor to anchor." },
    ],
  },
  {
    id: "endgame_act3_nudge_cross_rift_stability",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CROSS_RIFT,
    priority: 758,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "If Rift stability dips, pause damage and finish the nearest channel." },
      { speakerId: "arthur", text: "Stability first. Then advance." },
    ],
  },
  {
    id: "endgame_act3_nudge_core_clamps",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_CROWN_ENGINE,
    priority: 757,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Three clamps around the Engine. Disable all three before the Crown manifests." },
      { speakerId: "elaine", text: "Work methodically: clamp, reposition, clamp." },
    ],
  },
  {
    id: "endgame_act3_nudge_core_pulse",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_CROWN_ENGINE,
    priority: 756,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Engine pulse ring means move now, then resume clamps." },
      { speakerId: "elaine", text: "Quite so. Survive the pulse, return to work." },
    ],
  },
  {
    id: "endgame_act3_nudge_final_boss",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_FINAL_BOSS,
    priority: 755,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Read line tells, survive shockwaves, hold formation." },
      { speakerId: "willow", text: "No freestyle heroics. We outlast, then end it." },
    ],
  },
  {
    id: "endgame_act3_nudge_choice_confirm",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CHOOSE_ENDING,
    priority: 754,
    oneTime: true,
    tags: ["endgame_act3", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "The altar demands deliberate confirmation. Choose and commit." },
      { speakerId: "arthur", text: "No accidental ending. Decide." },
    ],
  },
  {
    id: "endgame_act3_backstory_elaine_cage_confession",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_LAST_SPIRE_ENTERED,
    priority: 750,
    oneTime: true,
    tags: ["endgame_act3", "elaine_backstory", "duty_guilt"],
    lines: [
      { speakerId: "elaine", text: "My house called them polite cages and taught me to smile while turning the lock." },
      { speakerId: "elaine", text: "I was dutiful. I was wrong." },
      { speakerId: "arthur", text: "Then finish this differently. Move." },
    ],
  },
  {
    id: "endgame_act3_backstory_elaine_compassion_choice",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CORE_REACHED,
    priority: 749,
    oneTime: true,
    tags: ["endgame_act3", "elaine_backstory", "climax"],
    lines: [
      { speakerId: "elaine", text: "Duty without compassion built this Spire. I choose compassion, even if it costs me title and name." },
      { speakerId: "willow", text: "For the record, that was terrifyingly sincere." },
      { speakerId: "elaine", text: "Good. Keep that terror and disable the final clamp." },
    ],
  },
  {
    id: "endgame_act3_backstory_arthur_lead",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_LAST_SPIRE_ENTERED,
    priority: 748,
    oneTime: true,
    tags: ["endgame_act3", "arthur_backstory", "crownseed"],
    lines: [
      { speakerId: "arthur", text: "Crownseed means the Spire recognizes me. It does not command me." },
      { speakerId: "elaine", text: "Then lead it where it fears to go." },
      { speakerId: "arthur", text: "Forward. Together." },
    ],
  },
  {
    id: "endgame_act3_backstory_arthur_foundling_resolution",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CORE_REACHED,
    priority: 747,
    oneTime: true,
    tags: ["endgame_act3", "arthur_backstory", "foundling"],
    lines: [
      { speakerId: "arthur", text: "Foundling, planted, chosen. Fine. I still choose what happens next." },
      { speakerId: "willow", text: "There he is. Oak with verbs." },
      { speakerId: "arthur", text: "Save commentary. Boss room." },
    ],
  },
  {
    id: "endgame_act3_backstory_willow_teacher_payoff",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_LAST_SPIRE_ENTERED,
    priority: 746,
    oneTime: true,
    tags: ["endgame_act3", "willow_backstory", "teacher"],
    lines: [
      { speakerId: "arthur", text: "Your teacher knew this place?" },
      { speakerId: "willow", text: "Mirthsage Ilyra, Laughing Seer of Saffron Glass, mapped this corridor in riddles and bad jokes." },
      { speakerId: "elaine", text: "Then honor her map and keep pace." },
    ],
  },
  {
    id: "endgame_act3_backstory_willow_mask_slip",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_FINAL_BOSS_DEFEATED,
    priority: 745,
    oneTime: true,
    tags: ["endgame_act3", "willow_backstory", "teacher"],
    lines: [
      { speakerId: "willow", text: "Ilyra did not vanish. She held a collapse gate so I could get out." },
      { speakerId: "willow", text: "I laugh because if I do not, I stop." },
      { speakerId: "arthur", text: "You keep moving. We all do. Choose at the altar." },
    ],
  },
  {
    id: "endgame_act3_backstory_trio_earned_funny",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_RIFT_CROSSED,
    priority: 744,
    oneTime: true,
    tags: ["endgame_act3", "bonding", "funny"],
    lines: [
      { speakerId: "willow", text: "When this is over, I demand one hallway that is not trying to edit my soul." },
      { speakerId: "elaine", text: "I can arrange a hallway. Soul safety remains uncertain." },
      { speakerId: "arthur", text: "Best offer we have. Keep moving." },
    ],
  },
  {
    id: "endgame_act3_reactive_choice_seal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_ACT3_CHOICE_SEAL,
    priority: 740,
    oneTime: true,
    tags: ["endgame_act3", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "elaine", text: "Sealing the Vault steadied the field and marked us as traitors to Vaeloris." },
      { speakerId: "arthur", text: "Then we finish before their answer arrives." },
    ],
  },
  {
    id: "endgame_act3_reactive_choice_take_key",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_ACT3_CHOICE_TAKE_KEY,
    priority: 739,
    oneTime: true,
    tags: ["endgame_act3", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "arthur", text: "The Crownheart Key still hums. It wants this room." },
      { speakerId: "willow", text: "Great. Keep it pointed away from our faces and toward progress." },
    ],
  },
  {
    id: "endgame_act3_reactive_crown_fractured",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT3_STARTED(ctx) && CROWN_FRACTURED(ctx),
    priority: 738,
    oneTime: true,
    tags: ["endgame_act3", "reactive", "crown_tier"],
    lines: [
      { speakerId: "willow", text: "Crown tone is fractured. It will pick sharp solutions unless we are sharper." },
      { speakerId: "elaine", text: "Then precision only. Forward." },
    ],
  },
  {
    id: "endgame_act3_reactive_crown_still",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT3_STARTED(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 737,
    oneTime: true,
    tags: ["endgame_act3", "reactive", "crown_tier"],
    lines: [
      { speakerId: "elaine", text: "The Crown is still, which means it is judging every move." },
      { speakerId: "arthur", text: "Then we give it clean moves. Core ahead." },
    ],
  },
  {
    id: "endgame_act2_nudge_enter_inner_threshold",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ENTER_INNER_SPIRE,
    priority: 640,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Inner gate now. Resonance Locks first, panic second." },
      { speakerId: "arthur", text: "Inside, then we keep moving lock to lock." },
    ],
  },
  {
    id: "endgame_act2_nudge_lock_route",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_SOLVE_RESONANCE_LOCKS,
    priority: 639,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Left lock, upper lock, then loom-side lock. Keep the loop tight." },
      { speakerId: "willow", text: "Tiny dungeon, big consequences. No sightseeing." },
    ],
  },
  {
    id: "endgame_act2_nudge_lock_channel",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_SOLVE_RESONANCE_LOCKS,
    priority: 638,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Hold each lock channel to completion. Breaks cost us pressure." },
      { speakerId: "arthur", text: "If interrupted, reset immediately." },
    ],
  },
  {
    id: "endgame_act2_nudge_pressure_thresholds",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_SOLVE_RESONANCE_LOCKS,
    priority: 637,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Pressure climbs in thirds. Hit a lock before the next spike." },
      { speakerId: "arthur", text: "Clear packs fast, then return to channels." },
    ],
  },
  {
    id: "endgame_act2_nudge_loom_pillars",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_LOOM_PROCTOR,
    priority: 636,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "When shield rises, break both Prism Pillars." },
      { speakerId: "elaine", text: "Then punish cleanly. Do not overchase the fissures." },
    ],
  },
  {
    id: "endgame_act2_nudge_last_door",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_APPROACH_LAST_DOOR,
    priority: 635,
    oneTime: true,
    tags: ["endgame_act2", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Approach the Last Door and listen. We prepare before we breach." },
      { speakerId: "arthur", text: "One check, then final act." },
    ],
  },
  {
    id: "endgame_act2_backstory_elaine_etiquette_origin",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_INNER_SPIRE_ENTERED,
    priority: 632,
    oneTime: true,
    tags: ["endgame_act2", "elaine_backstory", "oath_court"],
    lines: [
      { speakerId: "elaine", text: "Oath Court etiquette began as a safety protocol: speak softly, bind precisely, leave no improvisation." },
      { speakerId: "arthur", text: "Then Vaeloris industrialized it." },
      { speakerId: "elaine", text: "Yes. Courtesy became camouflage. Keep moving." },
    ],
  },
  {
    id: "endgame_act2_backstory_elaine_duty_crack",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_RESONANCE_LOCKS_COMPLETE,
    priority: 631,
    oneTime: true,
    tags: ["endgame_act2", "elaine_backstory", "duty_guilt"],
    lines: [
      { speakerId: "elaine", text: "My family called them polite cages and served them with silver smiles." },
      { speakerId: "elaine", text: "I repeated those phrases for years. I am not proud of that." },
      { speakerId: "arthur", text: "You left. That counts." },
      { speakerId: "elaine", text: "It must count enough. Forward." },
    ],
  },
  {
    id: "endgame_act2_backstory_arthur_crownseed_weight",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_INNER_SPIRE_ENTERED,
    priority: 630,
    oneTime: true,
    tags: ["endgame_act2", "arthur_backstory", "crownseed"],
    lines: [
      { speakerId: "arthur", text: "Crownseed means I am not just chosen. I am a key someone planted." },
      { speakerId: "willow", text: "You are still you, Oak. Keys do not decide doors alone." },
      { speakerId: "arthur", text: "Then I decide what opens." },
    ],
  },
  {
    id: "endgame_act2_backstory_arthur_foundling_name",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_RESONANCE_LOCKS_COMPLETE,
    priority: 629,
    oneTime: true,
    tags: ["endgame_act2", "arthur_backstory", "foundling"],
    lines: [
      { speakerId: "elaine", text: "Did Rowan ever tell you where he found you?" },
      { speakerId: "arthur", text: "At a root sink, after a storm. Wrapped in court cloth." },
      { speakerId: "willow", text: "So the Spire wrote your prologue and forgot to hide the page." },
      { speakerId: "arthur", text: "Then we finish the chapter ourselves." },
    ],
  },
  {
    id: "endgame_act2_backstory_willow_teacher_title",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_INNER_SPIRE_ENTERED,
    priority: 628,
    oneTime: true,
    tags: ["endgame_act2", "willow_backstory", "teacher"],
    lines: [
      { speakerId: "arthur", text: "Say the title again. Your teacher." },
      { speakerId: "willow", text: "Mirthsage Ilyra, the Laughing Seer of Saffron Glass. Terrible at introductions, brilliant at exits." },
      { speakerId: "elaine", text: "And currently absent when we require her most." },
      { speakerId: "willow", text: "Very her, yes. Keep marching." },
    ],
  },
  {
    id: "endgame_act2_backstory_willow_personal_slip",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_LOOM_PROCTOR_DEFEATED,
    priority: 627,
    oneTime: true,
    tags: ["endgame_act2", "willow_backstory", "teacher"],
    lines: [
      { speakerId: "willow", text: "Ilyra made me practice listening in total dark until I stopped crying." },
      { speakerId: "willow", text: "Not tragic crying. Efficient tactical crying." },
      { speakerId: "arthur", text: "You do not sound like you found it funny." },
      { speakerId: "willow", text: "I did later. Move." },
    ],
  },
  {
    id: "endgame_act2_backstory_trio_earned_laugh",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_LOOM_PROCTOR_DEFEATED,
    priority: 626,
    oneTime: true,
    tags: ["endgame_act2", "bonding", "funny"],
    lines: [
      { speakerId: "willow", text: "If we survive Act Three, I demand tea and a map with no murder geometry." },
      { speakerId: "arthur", text: "Reasonable request." },
      { speakerId: "elaine", text: "I can provide tea. Murder geometry is less negotiable." },
      { speakerId: "willow", text: "That was almost a joke. Historic moment." },
    ],
  },
  {
    id: "endgame_act2_backstory_oathcourt_industry_split",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_INNER_SPIRE_ENTERED,
    priority: 625,
    oneTime: true,
    tags: ["endgame_act2", "world_tie", "oath_court"],
    lines: [
      { speakerId: "elaine", text: "Oath Court kept binds as stewardship. Vaeloris turned them into throughput." },
      { speakerId: "arthur", text: "Guardianship became ownership." },
      { speakerId: "willow", text: "And now we are repossessing reality. Neat." },
    ],
  },
  {
    id: "endgame_act2_reactive_choice_seal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_ACT2_CHOICE_SEAL,
    priority: 624,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "elaine", text: "Sealing the Vault bought stability. Vaeloris will answer that insult." },
      { speakerId: "arthur", text: "Then we stay ahead of their answer." },
    ],
  },
  {
    id: "endgame_act2_reactive_choice_take_key",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_ACT2_CHOICE_TAKE_KEY,
    priority: 623,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "arthur", text: "Key still hums in my pack. Feels like carrying a storm tooth." },
      { speakerId: "elaine", text: "Power has appetite. Keep your hand steady." },
      { speakerId: "willow", text: "Storm tooth noted. No licking artifacts." },
    ],
  },
  {
    id: "endgame_act2_reactive_crown_fractured",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT2_STARTED(ctx) && CROWN_FRACTURED(ctx),
    priority: 622,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "crown_tier"],
    lines: [
      { speakerId: "willow", text: "Crown tone is splintery. It wants fast, sharp decisions." },
      { speakerId: "elaine", text: "Then we give it precision, not panic." },
    ],
  },
  {
    id: "endgame_act2_reactive_crown_still",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT2_STARTED(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 621,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "crown_tier"],
    lines: [
      { speakerId: "elaine", text: "The Crown is quiet. That is not comfort; that is scrutiny." },
      { speakerId: "arthur", text: "Then we earn the silence and keep moving." },
    ],
  },
  {
    id: "endgame_act2_reactive_harvester_salvage",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT2_STARTED(ctx) && ENDGAME_HARVESTER_SALVAGE(ctx),
    priority: 620,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "willow", text: "You salvaged the Harvester core and the Loom still remembers that rhythm." },
      { speakerId: "arthur", text: "Then we spend it here, not in regret." },
    ],
  },
  {
    id: "endgame_act2_reactive_convergence_tune",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT2_STARTED(ctx) && ENDGAME_CONVERGENCE_TUNE(ctx),
    priority: 619,
    oneTime: true,
    tags: ["endgame_act2", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "elaine", text: "You tuned the Convergence. The Loom treats you as negotiators, not vandals." },
      { speakerId: "arthur", text: "Negotiation ends if they reach the Last Spire core." },
    ],
  },
  {
    id: "endgame_act1_nudge_third_seal_path",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_OBTAIN_THIRD_SEAL,
    priority: 560,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Oath Sigil Shrine first. We bind the Third Seal before the Spire accelerates." },
      { speakerId: "arthur", text: "No detours. Shrine and seal." },
    ],
  },
  {
    id: "endgame_act1_nudge_third_seal_attune",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_OBTAIN_THIRD_SEAL,
    priority: 559,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Custodian down means chant-time. Stand still and bind the sigil fast." },
      { speakerId: "elaine", text: "If the channel breaks, restart instantly." },
    ],
  },
  {
    id: "endgame_act1_nudge_breach_nodes",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_BREACH_OUTER_SPIRE,
    priority: 558,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Three lock nodes. Disable all three or we stay outside." },
      { speakerId: "willow", text: "Node one, node two, node three, heroic screaming optional." },
    ],
  },
  {
    id: "endgame_act1_nudge_breach_meter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_BREACH_OUTER_SPIRE,
    priority: 557,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Watch the breach meter. If it caps, the gate discharges." },
      { speakerId: "arthur", text: "Keep it low. Keep moving." },
    ],
  },
  {
    id: "endgame_act1_nudge_gatewarden_overload",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_GATEWARDEN,
    priority: 556,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Conduit Overload telegraph means out of ring or behind cover." },
      { speakerId: "arthur", text: "Read it early, then punish." },
    ],
  },
  {
    id: "endgame_act1_nudge_gatewarden_null_clamp",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_GATEWARDEN,
    priority: 555,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Blue Null Clamp puddles are rude. Do not stand in rude." },
      { speakerId: "elaine", text: "Correct. Maintain clean footing and tempo." },
    ],
  },
  {
    id: "endgame_act1_nudge_enter_spire_step",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ENTER_OUTER_SPIRE,
    priority: 554,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Gate is open. We step inside now." },
      { speakerId: "elaine", text: "Agreed. We have the truth and the tools. Now force." },
    ],
  },
  {
    id: "endgame_act1_nudge_enter_spire_commit",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ENTER_OUTER_SPIRE,
    priority: 553,
    oneTime: true,
    tags: ["endgame_act1", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "No lingering at dramatic doors. We storm the Spire, remember?" },
      { speakerId: "arthur", text: "Then inside. Keep formation." },
    ],
  },
  {
    id: "endgame_act1_backstory_elaine_oath_court_etiquette",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_OBTAIN_THIRD_SEAL,
    priority: 552,
    oneTime: true,
    tags: ["endgame_act1", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "Oath Court etiquette began as restraint: speak softly, bind precisely, harm last." },
      { speakerId: "arthur", text: "And Vaeloris turned it into procedure." },
      { speakerId: "elaine", text: "Into industry, yes. We restore the older meaning by action." },
    ],
  },
  {
    id: "endgame_act1_backstory_elaine_crack",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_GATEWARDEN,
    priority: 551,
    oneTime: true,
    tags: ["endgame_act1", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "I spent years polishing those polite cages. I was very good at it." },
      { speakerId: "willow", text: "You are better at breaking them." },
      { speakerId: "elaine", text: "Today, yes. Keep me honest and keep moving." },
    ],
  },
  {
    id: "endgame_act1_backstory_arthur_crownseed_weight",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_ACT1_STARTED,
    priority: 550,
    oneTime: true,
    tags: ["endgame_act1", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Crownseed sounds like destiny. Feels more like a burden with a pulse." },
      { speakerId: "elaine", text: "Burden or not, you carry it without vanity." },
      { speakerId: "arthur", text: "I carry it because someone has to." },
    ],
  },
  {
    id: "endgame_act1_backstory_arthur_foundling_truth",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_THIRD_SEAL_OBTAINED,
    priority: 549,
    oneTime: true,
    tags: ["endgame_act1", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "If I was planted to be found, somebody planned this long before Rowan." },
      { speakerId: "willow", text: "Planted, found, raised, stubborn. That part is definitely you." },
      { speakerId: "arthur", text: "Then I finish the job as me, not as a design." },
    ],
  },
  {
    id: "endgame_act1_backstory_willow_teacher_tease",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_BREACH_OUTER_SPIRE,
    priority: 548,
    oneTime: true,
    tags: ["endgame_act1", "willow_backstory", "deep"],
    lines: [
      { speakerId: "willow", text: "Teacher note: Mirthsage Ilyra said Spire doors only respect impossible plans." },
      { speakerId: "elaine", text: "Then she would approve of this company." },
      { speakerId: "willow", text: "She would cackle first, approve second." },
    ],
  },
  {
    id: "endgame_act1_backstory_willow_mask_crack",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_GATEWARDEN,
    priority: 547,
    oneTime: true,
    tags: ["endgame_act1", "willow_backstory", "deep"],
    lines: [
      { speakerId: "willow", text: "Joke version: my teacher vanished in a puff of glitter and bad timing." },
      { speakerId: "willow", text: "Truth version: she stayed behind so I could run. I am done running." },
      { speakerId: "arthur", text: "Then we advance for both of you." },
    ],
  },
  {
    id: "endgame_act1_backstory_trio_laugh",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_THIRD_SEAL_OBTAINED,
    priority: 546,
    oneTime: true,
    tags: ["endgame_act1", "trio", "warm"],
    lines: [
      { speakerId: "willow", text: "If we survive this, I demand one normal lunch." },
      { speakerId: "arthur", text: "Define normal." },
      { speakerId: "elaine", text: "No rituals, no Spires, and absolutely no detonations." },
      { speakerId: "willow", text: "Cruel terms. Accepted." },
    ],
  },
  {
    id: "endgame_act1_backstory_trio_vow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ENTER_OUTER_SPIRE,
    priority: 545,
    oneTime: true,
    tags: ["endgame_act1", "trio", "deep"],
    lines: [
      { speakerId: "elaine", text: "We carry three histories into one door. Let us not waste that convergence." },
      { speakerId: "arthur", text: "We do not split. We do not stop." },
      { speakerId: "willow", text: "Three voices, one charge. Spire gets the memo." },
    ],
  },
  {
    id: "endgame_act1_reactive_choice_seal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CHOICE_SEAL,
    priority: 544,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "elaine", text: "Sealing the Vault steadied the field and guaranteed retaliation." },
      { speakerId: "arthur", text: "Retaliation was coming regardless. We move first." },
    ],
  },
  {
    id: "endgame_act1_reactive_choice_take_key",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CHOICE_TAKE_KEY,
    priority: 543,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "willow", text: "Crownheart Key in pocket. Terrible idea, fantastic leverage." },
      { speakerId: "arthur", text: "Then we use it precisely once, where it matters most." },
    ],
  },
  {
    id: "endgame_act1_reactive_harvester_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_HARVESTER_SHATTER,
    priority: 542,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "arthur", text: "We shattered their harvester and forced them to improvise." },
      { speakerId: "elaine", text: "Good. Vaeloris is weakest when denied script and sequence." },
    ],
  },
  {
    id: "endgame_act1_reactive_harvester_salvage",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_HARVESTER_SALVAGE,
    priority: 541,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "willow", text: "Salvage thrum still pings under my teeth. I dislike that sentence." },
      { speakerId: "elaine", text: "We turn that risk into timing and finish this quickly." },
    ],
  },
  {
    id: "endgame_act1_reactive_convergence_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CONVERGENCE_SHATTER,
    priority: 540,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "elaine", text: "Shattering the convergence bought us silence, not safety." },
      { speakerId: "arthur", text: "Silence is enough. We make the rest." },
    ],
  },
  {
    id: "endgame_act1_reactive_convergence_tune",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: ENDGAME_CONVERGENCE_TUNE,
    priority: 539,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "willow", text: "Tuning convergence made the Spire curious. Curiosity bites." },
      { speakerId: "arthur", text: "Then we bite back first." },
    ],
  },
  {
    id: "endgame_act1_reactive_crown_fractured",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT1_STARTED(ctx) && CROWN_FRACTURED(ctx),
    priority: 538,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "crown_tier"],
    lines: [
      { speakerId: "elaine", text: "Fractured crownfields. One bad cast and the world loses grammar." },
      { speakerId: "willow", text: "Cool. We do immaculate violence, then." },
    ],
  },
  {
    id: "endgame_act1_reactive_crown_still",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => ENDGAME_ACT1_STARTED(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 537,
    oneTime: true,
    tags: ["endgame_act1", "reactive", "crown_tier"],
    lines: [
      { speakerId: "willow", text: "Still-tier crown means held breath. Spire is singing louder anyway." },
      { speakerId: "arthur", text: "Then we move before that breath breaks." },
    ],
  },
  {
    id: "ch9_nudge_reach_vault_arthur",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_CROWNHEART_VAULT,
    priority: 460,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Vault approach is ahead. We do this now or not at all." },
      { speakerId: "elaine", text: "Then we proceed without ceremony." },
    ],
  },
  {
    id: "ch9_nudge_reach_vault_willow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_CROWNHEART_VAULT,
    priority: 459,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "The roots are screaming in six-part panic. Follow the noise." },
      { speakerId: "arthur", text: "We move. Keep eyes up." },
    ],
  },
  {
    id: "ch9_nudge_stabilize_anchors",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STABILIZE_WORLDROOTS,
    priority: 458,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Attune each Worldroot Anchor quickly. Three, then the door." },
      { speakerId: "arthur", text: "If channel breaks, restart immediately." },
    ],
  },
  {
    id: "ch9_nudge_stabilize_meter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STABILIZE_WORLDROOTS,
    priority: 457,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "When that meter fills, reality slaps back. Keep it low." },
      { speakerId: "elaine", text: "Anchor attunement buys us breathing room. Take it." },
    ],
  },
  {
    id: "ch9_nudge_archivist_nodes",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_NULL_ARCHIVIST,
    priority: 456,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Echo Nodes first when it charges the wipe pulse." },
      { speakerId: "willow", text: "Break the memory teeth, then bite back." },
    ],
  },
  {
    id: "ch9_nudge_archivist_fields",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_NULL_ARCHIVIST,
    priority: 455,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Avoid Null Fields. They throttle our casting tempo." },
      { speakerId: "arthur", text: "Stay mobile and disciplined." },
    ],
  },
  {
    id: "ch9_nudge_make_choice",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_MAKE_VAULT_CHOICE,
    priority: 454,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Seal the Vault for stability, or take the Key for leverage." },
      { speakerId: "willow", text: "Either way, we own the consequence." },
    ],
  },
  {
    id: "ch9_nudge_prepare_endgame",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_PREPARE_ENDGAME,
    priority: 453,
    oneTime: true,
    tags: ["chapter9", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Endgame route is open. Last Spire next." },
      { speakerId: "elaine", text: "Then let us finish what history failed to finish." },
    ],
  },
  {
    id: "ch9_backstory_arthur_planted",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 452,
    oneTime: true,
    tags: ["chapter9", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Crownseed. Rootbound. So I was planted, not merely found." },
      { speakerId: "elaine", text: "Planted perhaps, but you chose your own spine." },
      { speakerId: "willow", text: "Good spine too. Very apocalypse-rated." },
    ],
  },
  {
    id: "ch9_backstory_arthur_rowan_oath",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 451,
    oneTime: true,
    tags: ["chapter9", "arthur_backstory", "warm"],
    lines: [
      { speakerId: "arthur", text: "Rowan never asked what I was. He asked what I needed." },
      { speakerId: "elaine", text: "A rare form of nobility." },
      { speakerId: "arthur", text: "I intend to repay it by keeping this world standing." },
    ],
  },
  {
    id: "ch9_backstory_elaine_polite_cages",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 450,
    oneTime: true,
    tags: ["chapter9", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "My family called them safeguards. They were polite cages around the Crown." },
      { speakerId: "arthur", text: "You walked out anyway." },
      { speakerId: "elaine", text: "I refused to become their lock." },
    ],
  },
  {
    id: "ch9_backstory_elaine_refusal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 449,
    oneTime: true,
    tags: ["chapter9", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "willow", text: "You said no to a whole dynasty. Bold hobby." },
      { speakerId: "elaine", text: "No was overdue." },
      { speakerId: "arthur", text: "Keep saying it where it matters." },
    ],
  },
  {
    id: "ch9_backstory_willow_teacher_named",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 448,
    oneTime: true,
    tags: ["chapter9", "willow_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Mirthsage Ilyra. That is your teacher?" },
      { speakerId: "willow", text: "The Laughing Seer of Saffron Glass, yes. She taught me to hear fractures." },
      { speakerId: "elaine", text: "And left you with very selective honesty." },
    ],
  },
  {
    id: "ch9_backstory_willow_mask_slip",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 447,
    oneTime: true,
    tags: ["chapter9", "willow_backstory", "deep"],
    lines: [
      { speakerId: "willow", text: "Joke version: my teacher was a dramatic ghost in expensive scarves." },
      { speakerId: "willow", text: "Truth version: she heard the Crown and ran so I could stay hidden." },
      { speakerId: "arthur", text: "Then we finish what she started." },
    ],
  },
  {
    id: "ch9_backstory_oath_court",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 446,
    oneTime: true,
    tags: ["chapter9", "world_tie", "deep"],
    lines: [
      { speakerId: "elaine", text: "Vaeloris began as Oath Court custodians, not conquerors." },
      { speakerId: "arthur", text: "Then they industrialized the oath." },
      { speakerId: "willow", text: "And now we bill them for planetary damages." },
    ],
  },
  {
    id: "ch9_backstory_spiral_world",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_ARCHIVIST_DEFEATED,
    priority: 445,
    oneTime: true,
    tags: ["chapter9", "world_tie", "deep"],
    lines: [
      { speakerId: "willow", text: "One hundred thousand year echoes. Time here is a spiral staircase." },
      { speakerId: "elaine", text: "Then we are currently between steps." },
      { speakerId: "arthur", text: "Good. We climb before it collapses." },
    ],
  },
  {
    id: "ch9_reactive_harvester_salvage",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_HARVESTER_SALVAGE,
    priority: 444,
    oneTime: true,
    tags: ["chapter9", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "willow", text: "That salvage thrum is still in our pockets, humming trouble." },
      { speakerId: "arthur", text: "Then we use it before it uses us." },
    ],
  },
  {
    id: "ch9_reactive_harvester_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_HARVESTER_SHATTER,
    priority: 443,
    oneTime: true,
    tags: ["chapter9", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "elaine", text: "You shattered their engine when compromise was easier." },
      { speakerId: "arthur", text: "We do hard things or we lose." },
    ],
  },
  {
    id: "ch9_reactive_convergence_tune",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_CONVERGENCE_TUNE,
    priority: 442,
    oneTime: true,
    tags: ["chapter9", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "willow", text: "You tuned the Convergence, so the vision looked hungry when it saw us." },
      { speakerId: "elaine", text: "Then we deny it anything else to consume." },
    ],
  },
  {
    id: "ch9_reactive_convergence_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_CONVERGENCE_SHATTER,
    priority: 441,
    oneTime: true,
    tags: ["chapter9", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "arthur", text: "Shattering it made the vision quieter." },
      { speakerId: "willow", text: "Quiet, yes. Safe, absolutely not." },
    ],
  },
  {
    id: "ch9_reactive_crown_fractured",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH9_STARTED(ctx) && CROWN_FRACTURED(ctx),
    priority: 440,
    oneTime: true,
    tags: ["chapter9", "reactive", "crown_tier"],
    lines: [
      { speakerId: "elaine", text: "Fractured crownfields. One mistake and the world tears wider." },
      { speakerId: "arthur", text: "Then no mistakes." },
    ],
  },
  {
    id: "ch9_reactive_crown_still",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH9_STARTED(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 439,
    oneTime: true,
    tags: ["chapter9", "reactive", "crown_tier"],
    lines: [
      { speakerId: "willow", text: "Still tier. That's not peace, that's held breath." },
      { speakerId: "elaine", text: "Then let us not waste it." },
    ],
  },
  {
    id: "ch9_reactive_choice_seal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_CHOICE_SEAL,
    priority: 438,
    oneTime: true,
    tags: ["chapter9", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "elaine", text: "Sealing the Vault steadies the Crown, and paints us as Vaeloris' priority target." },
      { speakerId: "arthur", text: "Good. Let them find us moving toward the Spire." },
    ],
  },
  {
    id: "ch9_reactive_choice_take_key",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH9_CHOICE_TAKE_KEY,
    priority: 437,
    oneTime: true,
    tags: ["chapter9", "reactive", "chapter9_choice"],
    lines: [
      { speakerId: "willow", text: "Key in pocket. Terrible idea, excellent tool." },
      { speakerId: "elaine", text: "Then we wield it with discipline, not appetite." },
      { speakerId: "arthur", text: "Agreed. Last Spire." },
    ],
  },
  {
    id: "ch8_nudge_return_rowan_after_convergence",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_AFTER_CONVERGENCE,
    priority: 320,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Rowan gets this report first. We return to Thornmere immediately." },
      { speakerId: "arthur", text: "No detours. Rowan, now." },
    ],
  },
  {
    id: "ch8_nudge_stop_spikes_elaine",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STOP_MUTE_SPIKES,
    priority: 319,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Those Mute Spikes are suffocating Thornmere's roots. Break all three." },
      { speakerId: "arthur", text: "Spikes first. Village breathes after." },
    ],
  },
  {
    id: "ch8_nudge_stop_spikes_arthur",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STOP_MUTE_SPIKES,
    priority: 318,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Three pylons, then we push them off this road." },
      { speakerId: "willow", text: "Math checks out. We smash now." },
    ],
  },
  {
    id: "ch8_nudge_stop_spikes_willow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STOP_MUTE_SPIKES,
    priority: 317,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Mute towers ahead. Let's make them extremely non-mute." },
      { speakerId: "elaine", text: "By all means. Forward." },
    ],
  },
  {
    id: "ch8_nudge_take_new_route",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_TAKE_NEW_ROUTE,
    priority: 316,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Rootway is open. We cross while it still is." },
      { speakerId: "willow", text: "New route, old rule: keep moving." },
    ],
  },
  {
    id: "ch8_nudge_region4_return_or_press",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_OR_PRESS_ON,
    priority: 315,
    oneTime: true,
    tags: ["chapter8", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Mark the route cleanly, then we return to Rowan with facts." },
      { speakerId: "arthur", text: "No wandering. Learn, then report." },
    ],
  },
  {
    id: "ch8_arthur_foundling_deeper",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_RETALIATION_ACTIVE,
    priority: 314,
    oneTime: true,
    tags: ["chapter8", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Rowan found me wrapped in wet roots with a cut hand and no name." },
      { speakerId: "elaine", text: "And he chose to raise you anyway." },
      { speakerId: "arthur", text: "He chose Thornmere first. I owe that choice. Keep moving." },
    ],
  },
  {
    id: "ch8_arthur_thornmere_anchor",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STOP_MUTE_SPIKES,
    priority: 313,
    oneTime: true,
    tags: ["chapter8", "arthur_backstory", "warm"],
    lines: [
      { speakerId: "willow", text: "You always stand between trouble and this village." },
      { speakerId: "arthur", text: "Thornmere taught me how to stand." },
      { speakerId: "elaine", text: "Then we stand with you. Forward." },
    ],
  },
  {
    id: "ch8_elaine_proper_life_cost",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_AFTERMATH_DONE,
    priority: 312,
    oneTime: true,
    tags: ["chapter8", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "In Vaeloris proper life means smiling while someone else is measured into loss." },
      { speakerId: "arthur", text: "You walked away from that." },
      { speakerId: "elaine", text: "I refused to become it. We move." },
    ],
  },
  {
    id: "ch8_elaine_refused_title",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_TAKE_NEW_ROUTE,
    priority: 311,
    oneTime: true,
    tags: ["chapter8", "elaine_backstory", "world_tie"],
    lines: [
      { speakerId: "elaine", text: "They offered me a title if I signed off on extraction quotas." },
      { speakerId: "willow", text: "Big hat, tiny soul. Hard pass." },
      { speakerId: "elaine", text: "Precisely. Through the gate." },
    ],
  },
  {
    id: "ch8_willow_gem_prank_teacher_hint",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_STOP_MUTE_SPIKES,
    priority: 310,
    oneTime: true,
    tags: ["chapter8", "willow_silly", "deep"],
    lines: [
      { speakerId: "willow", text: "I once replaced a lecture crystal with sugared glass. Three professors cried." },
      { speakerId: "elaine", text: "You weaponized dessert." },
      { speakerId: "willow", text: "My teacher called it 'pattern disruption'. Keep disrupting, yes?" },
    ],
  },
  {
    id: "ch8_willow_teacher_true_clue",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_OR_PRESS_ON,
    priority: 309,
    oneTime: true,
    tags: ["chapter8", "willow_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "You still will not name your teacher." },
      { speakerId: "willow", text: "Fine clue: she wore no crest and heard numbers in birdsong." },
      { speakerId: "willow", text: "More clues after we survive this route. Move." },
    ],
  },
  {
    id: "ch8_reactive_convergence_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_CONVERGENCE_SHATTER,
    priority: 308,
    oneTime: true,
    tags: ["chapter8", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "arthur", text: "Shattering it bought silence, not safety." },
      { speakerId: "elaine", text: "Then we turn that silence into distance. Keep moving." },
    ],
  },
  {
    id: "ch8_reactive_convergence_tune",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_CONVERGENCE_TUNE,
    priority: 307,
    oneTime: true,
    tags: ["chapter8", "reactive", "convergence_choice"],
    lines: [
      { speakerId: "willow", text: "Tuning a god-machine is brave and slightly unhinged. Respect." },
      { speakerId: "arthur", text: "Now we live with it. Eyes forward." },
    ],
  },
  {
    id: "ch8_reactive_harvester_shatter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_HARVESTER_SHATTER,
    priority: 306,
    oneTime: true,
    tags: ["chapter8", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "elaine", text: "Shattering that core denied Vaeloris one certainty." },
      { speakerId: "willow", text: "And gave us one less ominous paperweight. Progress." },
      { speakerId: "arthur", text: "Keep that progress moving." },
    ],
  },
  {
    id: "ch8_reactive_harvester_salvage",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH8_HARVESTER_SALVAGE,
    priority: 305,
    oneTime: true,
    tags: ["chapter8", "reactive", "harvester_choice"],
    lines: [
      { speakerId: "elaine", text: "Salvage gave us leverage and painted a target." },
      { speakerId: "arthur", text: "Then we carry both carefully." },
      { speakerId: "willow", text: "Carefully and quickly. That is our brand now." },
    ],
  },
  {
    id: "ch8_reactive_crown_fractured",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH8_AFTERMATH_DONE(ctx) && CROWN_FRACTURED(ctx),
    priority: 304,
    oneTime: true,
    tags: ["chapter8", "reactive", "crown_tier"],
    lines: [
      { speakerId: "willow", text: "Fractured tier is loud. The air is basically shouting." },
      { speakerId: "elaine", text: "Then we answer with speed and precision. Move." },
    ],
  },
  {
    id: "ch8_reactive_crown_still",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH8_AFTERMATH_DONE(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 303,
    oneTime: true,
    tags: ["chapter8", "reactive", "crown_tier"],
    lines: [
      { speakerId: "arthur", text: "Still tier. Quiet enough to breathe." },
      { speakerId: "willow", text: "Great. We breathe while walking." },
    ],
  },
  {
    id: "ch6_nudge_find_waystone_arthur",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_FIND_WAYSTONE_CIRCLE,
    priority: 240,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Standing stones ahead. That's our circle. Keep moving." },
      { speakerId: "elaine", text: "Good. We approach with purpose, not noise." },
    ],
  },
  {
    id: "ch6_nudge_find_waystone_elaine",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_FIND_WAYSTONE_CIRCLE,
    priority: 239,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Follow the cleaner wind; it leads straight to the Circle." },
      { speakerId: "willow", text: "And if wind lies, rocks do not. Keep going." },
    ],
  },
  {
    id: "ch6_nudge_drop_relay_posts",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DROP_RELAY,
    priority: 238,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Those tether posts feed the relay. Break all three." },
      { speakerId: "arthur", text: "Posts first. Scouts if they step in." },
    ],
  },
  {
    id: "ch6_nudge_drop_relay_willow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DROP_RELAY,
    priority: 237,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Kick the relay legs until the hum gets shy." },
      { speakerId: "elaine", text: "A vulgar summary, but correct." },
    ],
  },
  {
    id: "ch6_nudge_attune_waystone",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ATTUNE_WAYSTONE,
    priority: 236,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Relay is down. Touch the stone before anything else wakes." },
      { speakerId: "willow", text: "Waystone time. Fingers steady, jokes optional." },
    ],
  },
  {
    id: "ch6_nudge_report_rowan",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_WAYSTONE_NEWS,
    priority: 235,
    oneTime: true,
    tags: ["chapter6", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "We report this to Rowan immediately. No scenic detours." },
      { speakerId: "arthur", text: "Thornmere first. Move." },
    ],
  },
  {
    id: "ch6_arthur_foundling_wind",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_FIND_WAYSTONE_CIRCLE,
    priority: 234,
    oneTime: true,
    tags: ["chapter6", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "This wind smells like the night Rowan found me. Same iron edge." },
      { speakerId: "elaine", text: "Then perhaps this ridge remembers you too." },
      { speakerId: "arthur", text: "Maybe. We keep walking." },
    ],
  },
  {
    id: "ch6_arthur_rowan_anchor",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_WAYSTONE_NEWS,
    priority: 233,
    oneTime: true,
    tags: ["chapter6", "arthur_backstory", "warm"],
    lines: [
      { speakerId: "willow", text: "You trust Rowan like gravity." },
      { speakerId: "arthur", text: "He was there when nothing else was." },
      { speakerId: "elaine", text: "Then we bring him this quickly." },
    ],
  },
  {
    id: "ch6_elaine_table_protocol",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DROP_RELAY,
    priority: 232,
    oneTime: true,
    tags: ["chapter6", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "At Vaeloris tables we were taught: listen first, wound second, apologize never." },
      { speakerId: "arthur", text: "You left that behind." },
      { speakerId: "elaine", text: "I left before it became my voice." },
    ],
  },
  {
    id: "ch6_elaine_departure_cost",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ATTUNE_WAYSTONE,
    priority: 231,
    oneTime: true,
    tags: ["chapter6", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "Leaving Vaeloris cost me family names and comfortable doors." },
      { speakerId: "willow", text: "Comfort is overrated. Doors are replaceable." },
      { speakerId: "elaine", text: "Quite. Conviction is harder to replace." },
    ],
  },
  {
    id: "ch6_willow_gem_fiasco",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_FIND_WAYSTONE_CIRCLE,
    priority: 230,
    oneTime: true,
    tags: ["chapter6", "willow_silly", "warm"],
    lines: [
      { speakerId: "willow", text: "I once tuned a gem by sneezing near it. Entire attic started harmonizing." },
      { speakerId: "elaine", text: "You weaponized allergies." },
      { speakerId: "willow", text: "Incorrect. I discovered accidental acoustics." },
    ],
  },
  {
    id: "ch6_willow_pattern_truth",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_ATTUNE_WAYSTONE,
    priority: 229,
    oneTime: true,
    tags: ["chapter6", "willow_deep", "world_tie"],
    lines: [
      { speakerId: "willow", text: "Patterns are just promises repeated until someone breaks them." },
      { speakerId: "arthur", text: "And this one?" },
      { speakerId: "willow", text: "This one expects us to keep moving." },
    ],
  },
  {
    id: "ch6_choice_shatter_relief",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH6_CHOICE_SHATTER(ctx) && CH6_ARRIVED_WINDWARD(ctx),
    priority: 228,
    oneTime: true,
    tags: ["chapter6", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Shattering the core left cleaner residue. I still stand by it." },
      { speakerId: "arthur", text: "Feels quieter out here. I'll take that." },
      { speakerId: "willow", text: "Quiet is suspicious, but nicer on the ears." },
    ],
  },
  {
    id: "ch6_choice_salvage_tension",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH6_CHOICE_SALVAGE(ctx) && CH6_ARRIVED_WINDWARD(ctx),
    priority: 227,
    oneTime: true,
    tags: ["chapter6", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Salvage bought information at a dangerous price." },
      { speakerId: "arthur", text: "Price is paid. We make it count." },
      { speakerId: "willow", text: "Core likes us. That is not comforting." },
    ],
  },
  {
    id: "ch6_crown_fractured_reaction",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH6_ARRIVED_WINDWARD(ctx) && CROWN_FRACTURED(ctx),
    priority: 226,
    oneTime: true,
    tags: ["chapter6", "crown_reactive"],
    lines: [
      { speakerId: "arthur", text: "Air's splintered. Stay moving and stay tight." },
      { speakerId: "elaine", text: "Fractured crownfields punish hesitation." },
      { speakerId: "willow", text: "Then we hesitate while walking. Problem solved." },
    ],
  },
  {
    id: "ch6_crown_still_reaction",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => CH6_ARRIVED_WINDWARD(ctx) && CROWN_STILL_OR_UNEASY(ctx),
    priority: 225,
    oneTime: true,
    tags: ["chapter6", "crown_reactive"],
    lines: [
      { speakerId: "willow", text: "Still crown-mood. Almost polite." },
      { speakerId: "elaine", text: "Do not trust polite weather." },
      { speakerId: "arthur", text: "We keep pace anyway." },
    ],
  },
  {
    id: "ch5_nudge_clear_patrol_map",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CLEAR_RIDGE_PATROL,
    priority: 214,
    oneTime: true,
    tags: ["chapter5", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Vaeloris scouts are mapping Thornmere's throat. Remove them now." },
      { speakerId: "arthur", text: "Road first. Questions later." },
    ],
  },
  {
    id: "ch5_nudge_clear_patrol_fast",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CLEAR_RIDGE_PATROL,
    priority: 213,
    oneTime: true,
    tags: ["chapter5", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Patrol's ahead. We clear it clean." },
      { speakerId: "willow", text: "Metal birds hate coordinated heroes. Keep moving." },
    ],
  },
  {
    id: "ch5_nudge_clear_patrol_willow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CLEAR_RIDGE_PATROL,
    priority: 212,
    oneTime: true,
    tags: ["chapter5", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Scout season at the ridge road. Let us end it." },
      { speakerId: "elaine", text: "Agreed. Forward." },
    ],
  },
  {
    id: "ch5_nudge_cross_gate_now",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CROSS_RIDGE_GATE,
    priority: 211,
    oneTime: true,
    tags: ["chapter5", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Path is open. Cross before Vaeloris revises the equation." },
      { speakerId: "arthur", text: "Gate now. Keep pace." },
    ],
  },
  {
    id: "ch5_nudge_region3_keep_moving",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REGION3_FIRST_STEPS,
    priority: 210,
    oneTime: true,
    tags: ["chapter5", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "New wind, same mission: walk first, panic never." },
      { speakerId: "arthur", text: "Stay sharp and keep moving." },
    ],
  },
  {
    id: "ch5_elaine_house_protocol",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CLEAR_RIDGE_PATROL,
    priority: 209,
    oneTime: true,
    tags: ["chapter5", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "In my house, fear was called poor posture. We learned to smile through it." },
      { speakerId: "arthur", text: "You do not smile through it now." },
      { speakerId: "elaine", text: "No. Now I walk through it. Patrol first." },
    ],
  },
  {
    id: "ch5_elaine_left_letter",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CROSS_RIDGE_GATE,
    priority: 208,
    oneTime: true,
    tags: ["chapter5", "elaine_backstory", "warm"],
    lines: [
      { speakerId: "elaine", text: "I left Vaeloris with one letter: 'Order without mercy is merely tidy cruelty.'" },
      { speakerId: "willow", text: "Elegant and devastating. I approve." },
      { speakerId: "arthur", text: "Keep that edge. We move." },
    ],
  },
  {
    id: "ch5_arthur_foundling_watchfire",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CLEAR_RIDGE_PATROL,
    priority: 207,
    oneTime: true,
    tags: ["chapter5", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Rowan found me by a dead watchfire. No tracks in, no tracks out." },
      { speakerId: "elaine", text: "Then someone wanted you found, not lost." },
      { speakerId: "arthur", text: "Maybe. We finish this road first." },
    ],
  },
  {
    id: "ch5_arthur_rowan_anchor",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REGION3_FIRST_STEPS,
    priority: 206,
    oneTime: true,
    tags: ["chapter5", "arthur_backstory", "warm"],
    lines: [
      { speakerId: "arthur", text: "Rowan taught me names of roots before names of stars." },
      { speakerId: "willow", text: "Explains why you trust ground more than promises." },
      { speakerId: "arthur", text: "Ground holds. Keep moving." },
    ],
  },
  {
    id: "ch5_willow_gem_kettle",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_CROSS_RIDGE_GATE,
    priority: 205,
    oneTime: true,
    tags: ["chapter5", "willow_silly", "willow_deep"],
    lines: [
      { speakerId: "willow", text: "I once used a storm gem to heat tea. The kettle achieved enlightenment." },
      { speakerId: "elaine", text: "That is not how kettles work." },
      { speakerId: "willow", text: "Neither does the Crown, and yet. Forward." },
    ],
  },
  {
    id: "ch5_choice_shatter_relief",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH5_CHOICE_SHATTER,
    priority: 204,
    oneTime: true,
    tags: ["chapter5", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Shattering the core spared Thornmere one temptation." },
      { speakerId: "arthur", text: "Good. We keep it that way." },
      { speakerId: "willow", text: "Big shiny problem: politely exploded. Love that for us." },
    ],
  },
  {
    id: "ch5_choice_shatter_retaliation",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH5_CHOICE_SHATTER,
    priority: 203,
    oneTime: true,
    tags: ["chapter5", "choice_reactive"],
    lines: [
      { speakerId: "arthur", text: "They will answer us for breaking it." },
      { speakerId: "elaine", text: "Yes. Which is why we hold the road and keep advancing." },
    ],
  },
  {
    id: "ch5_choice_salvage_unease",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH5_CHOICE_SALVAGE,
    priority: 202,
    oneTime: true,
    tags: ["chapter5", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Salvage buys leverage and drags danger home." },
      { speakerId: "arthur", text: "Then we carry it carefully." },
      { speakerId: "willow", text: "Carefully, quickly, and away from civilians. Move." },
    ],
  },
  {
    id: "ch5_choice_salvage_curious",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH5_CHOICE_SALVAGE,
    priority: 201,
    oneTime: true,
    tags: ["chapter5", "choice_reactive"],
    lines: [
      { speakerId: "willow", text: "Core keeps purring. Curious things are never harmless." },
      { speakerId: "elaine", text: "Then let us remain ahead of its curiosity." },
      { speakerId: "arthur", text: "Road first. Then answers." },
    ],
  },
  {
    id: "ch4_nudge_reach_rig",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_HARVESTER,
    priority: 172,
    oneTime: true,
    tags: ["chapter4", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Follow the metal stink. The Harvester rig sits where the ash is thickest." },
      { speakerId: "arthur", text: "Then we go straight there." },
    ],
  },
  {
    id: "ch4_nudge_reach_hum",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_HARVESTER,
    priority: 171,
    oneTime: true,
    tags: ["chapter4", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Hear that low hum? That's our rude machine invitation." },
      { speakerId: "elaine", text: "Accept it with haste, not enthusiasm." },
    ],
  },
  {
    id: "ch4_nudge_break_anchors",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_HARVESTER,
    priority: 170,
    oneTime: true,
    tags: ["chapter4", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "We break anchors first." },
      { speakerId: "elaine", text: "Correct. The surge starves when the anchors fall." },
    ],
  },
  {
    id: "ch4_nudge_report_choice",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_RETURN_ROWAN_AFTER_HARVESTER,
    priority: 169,
    oneTime: true,
    tags: ["chapter4", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Core verdict delivered, now we deliver ourselves to Rowan." },
      { speakerId: "arthur", text: "Report first. Everything else later." },
    ],
  },
  {
    id: "ch4_elaine_silver_room",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_HARVESTER,
    priority: 168,
    oneTime: true,
    tags: ["chapter4", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "Vaeloris taught us that calm faces excuse ugly choices. I wore that lesson too long." },
      { speakerId: "arthur", text: "You left before it finished shaping you." },
      { speakerId: "elaine", text: "I left before it made me proud of it. Keep moving." },
    ],
  },
  {
    id: "ch4_elaine_etiquette_pressure",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_HARVESTER,
    priority: 167,
    oneTime: true,
    tags: ["chapter4", "elaine_backstory", "warm"],
    lines: [
      { speakerId: "elaine", text: "At home, perfection was mandatory and comfort was optional." },
      { speakerId: "willow", text: "My home rule was 'do not explode the pantry twice.'" },
      { speakerId: "arthur", text: "New rule now: survive this rig." },
    ],
  },
  {
    id: "ch4_arthur_storm_name",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REACH_HARVESTER,
    priority: 166,
    oneTime: true,
    tags: ["chapter4", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "When Rowan found me, I could only say one word: storm." },
      { speakerId: "elaine", text: "Then perhaps storms have been your language since birth." },
      { speakerId: "willow", text: "Good. Today we answer in louder language. Forward." },
    ],
  },
  {
    id: "ch4_willow_joke_then_knife",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_DEFEAT_HARVESTER,
    priority: 165,
    oneTime: true,
    tags: ["chapter4", "willow_silly", "willow_deep"],
    lines: [
      { speakerId: "willow", text: "I once named a wrench 'Prince Sparkleton.' It still bit me." },
      { speakerId: "arthur", text: "Point?" },
      { speakerId: "willow", text: "Tools learn your habits. So do tyrants. Break the anchors before they learn more." },
    ],
  },
  {
    id: "ch4_choice_shatter_relief",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH4_CHOICE_SHATTER,
    priority: 164,
    oneTime: true,
    tags: ["chapter4", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Shattering it was the cleaner judgment." },
      { speakerId: "arthur", text: "Air feels lighter already." },
      { speakerId: "willow", text: "And nobody has to carry the angry humming rock. Delightful." },
    ],
  },
  {
    id: "ch4_choice_shatter_grit",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH4_CHOICE_SHATTER,
    priority: 163,
    oneTime: true,
    tags: ["chapter4", "choice_reactive"],
    lines: [
      { speakerId: "arthur", text: "No trophy. Just less danger." },
      { speakerId: "elaine", text: "A disciplined choice. Rare and welcome." },
      { speakerId: "willow", text: "We can collect better trophies later. Like survival." },
    ],
  },
  {
    id: "ch4_choice_salvage_unease",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH4_CHOICE_SALVAGE,
    priority: 162,
    oneTime: true,
    tags: ["chapter4", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Salvage buys leverage and invites consequence." },
      { speakerId: "arthur", text: "Then we hold both." },
      { speakerId: "willow", text: "I can carry consequence in my left pocket. Keep moving." },
    ],
  },
  {
    id: "ch4_choice_salvage_thrums",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH4_CHOICE_SALVAGE,
    priority: 161,
    oneTime: true,
    tags: ["chapter4", "choice_reactive"],
    lines: [
      { speakerId: "willow", text: "Core is purring. Either curious or hungry." },
      { speakerId: "elaine", text: "Do not anthropomorphize the evidence." },
      { speakerId: "arthur", text: "Tell Rowan everything. No edits." },
    ],
  },
  {
    id: "ch3_nudge_spike_hum",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 148,
    oneTime: true,
    tags: ["chapter3", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Metallic hum is ahead. Keep to it." },
      { speakerId: "elaine", text: "Quite. We track the sound, find the Spike, and end this politely." },
    ],
  },
  {
    id: "ch3_nudge_spike_site",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 147,
    oneTime: true,
    tags: ["chapter3", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Look for the tall needle and the nervous scouts around it." },
      { speakerId: "arthur", text: "Needle first. We can argue names later." },
    ],
  },
  {
    id: "ch3_nudge_report_rowan",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REPORT_ROWAN_CH3,
    priority: 146,
    oneTime: true,
    tags: ["chapter3", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "We report to Rowan now. Details decay when delayed." },
      { speakerId: "arthur", text: "Thornmere. No wandering." },
    ],
  },
  {
    id: "ch3_nudge_report_willow",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_REPORT_ROWAN_CH3,
    priority: 145,
    oneTime: true,
    tags: ["chapter3", "objective_nudge"],
    lines: [
      { speakerId: "willow", text: "Rowan gets first listen. Then we panic in alphabetical order." },
      { speakerId: "elaine", text: "We shall skip the panic and keep moving." },
    ],
  },
  {
    id: "ch3_elaine_house_tone",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 144,
    oneTime: true,
    tags: ["chapter3", "elaine_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "In my house, we learned to hear power before we learned to read." },
      { speakerId: "arthur", text: "And Vaeloris turned that into policy." },
      { speakerId: "elaine", text: "Precisely. Which is why we move before policy catches up." },
    ],
  },
  {
    id: "ch3_elaine_silver_etiquette",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 143,
    oneTime: true,
    tags: ["chapter3", "elaine_backstory", "warm"],
    lines: [
      { speakerId: "elaine", text: "There were six forks at Vaeloris winter suppers. Six opportunities to fail." },
      { speakerId: "willow", text: "I use one spoon and immense confidence." },
      { speakerId: "arthur", text: "Use that confidence while we walk." },
    ],
  },
  {
    id: "ch3_arthur_rootbreak_hint",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 142,
    oneTime: true,
    tags: ["chapter3", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Rowan found me by the rootbreak with no pack, no name, no story." },
      { speakerId: "willow", text: "Then maybe your story started in the same hum we're chasing." },
      { speakerId: "arthur", text: "Could be. Keep moving." },
    ],
  },
  {
    id: "ch3_willow_prank_core",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 141,
    oneTime: true,
    tags: ["chapter3", "willow_silly", "warm"],
    lines: [
      { speakerId: "willow", text: "I once swapped a resonator core with a polished beetroot. Lasted twelve minutes." },
      { speakerId: "elaine", text: "You terrorized an entire lab with produce." },
      { speakerId: "willow", text: "Correct. Let us now terrorize this Spike with competence." },
    ],
  },
  {
    id: "ch3_willow_listen_insight",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: OBJECTIVE_INVESTIGATE_SPIKE,
    priority: 140,
    oneTime: true,
    tags: ["chapter3", "willow_deep", "world_tie"],
    lines: [
      { speakerId: "willow", text: "Listening Spikes don't hear words. They hear intention." },
      { speakerId: "arthur", text: "Then we keep ours simple." },
      { speakerId: "willow", text: "Exactly. Walk, strike, breathe, repeat." },
    ],
  },
  {
    id: "ch3_choice_crush_reaction",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH3_CHOICE_CRUSH,
    priority: 139,
    oneTime: true,
    tags: ["chapter3", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Crushing it was proper. Cleaner than carrying that risk." },
      { speakerId: "willow", text: "RIP tiny evil antenna. You were deeply impolite." },
      { speakerId: "arthur", text: "Ground sounds calmer. Back to Rowan while it lasts." },
    ],
  },
  {
    id: "ch3_choice_pocket_reaction",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: CH3_CHOICE_POCKET,
    priority: 138,
    oneTime: true,
    tags: ["chapter3", "choice_reactive"],
    lines: [
      { speakerId: "elaine", text: "Keeping that core is strategically useful and ethically troubling." },
      { speakerId: "willow", text: "Troubling, yes. Useful, very yes. Also it purrs." },
      { speakerId: "arthur", text: "Then we tell Rowan exactly what we did. Move." },
    ],
  },
  {
    id: "c2_ae_etiquette_vs_ash",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: OBJECTIVE_TRAVEL_EMBERFALL,
    priority: 132,
    oneTime: true,
    tags: ["chapter2", "elaine_backstory", "warm"],
    lines: [
      { speakerId: "elaine", text: "I was taught ash on a cuff is a social failure. Today it is merely weather." },
      { speakerId: "arthur", text: "Better habit: keep moving and wash later." },
      { speakerId: "elaine", text: "Practical and inelegant. I approve. East, now." },
    ],
  },
  {
    id: "c2_ae_foundling_hint",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: OBJECTIVE_FIND_WILLOW,
    priority: 131,
    oneTime: true,
    tags: ["chapter2", "arthur_backstory", "deep"],
    lines: [
      { speakerId: "arthur", text: "Rowan found me near split roots, not far from ash-country." },
      { speakerId: "elaine", text: "Then Emberfall may answer more than one question for you." },
      { speakerId: "arthur", text: "One answer at a time. Willow first." },
    ],
  },
  {
    id: "c2_nudge_travel_east",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: OBJECTIVE_TRAVEL_EMBERFALL,
    priority: 130,
    oneTime: true,
    tags: ["chapter2", "objective_nudge"],
    lines: [
      { speakerId: "arthur", text: "Ash wind is east. Gate is waiting." },
      { speakerId: "elaine", text: "Then we stop orbiting and take the path." },
    ],
  },
  {
    id: "c2_nudge_find_landmark",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: OBJECTIVE_FIND_WILLOW,
    priority: 129,
    oneTime: true,
    tags: ["chapter2", "objective_nudge"],
    lines: [
      { speakerId: "elaine", text: "Look for fused basalt and glassflower sheen. That is where watchers stand." },
      { speakerId: "arthur", text: "Outcrop first. Questions after." },
    ],
  },
  {
    id: "c2_aw_nickname_protocol",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: WITH_WILLOW,
    priority: 128,
    oneTime: true,
    tags: ["chapter2", "willow_silly", "warm"],
    lines: [
      { speakerId: "willow", text: "Official names today: Captain Gravel, Lady Proper, and me, Spark Disaster." },
      { speakerId: "elaine", text: "Your title remains unauthorized." },
      { speakerId: "arthur", text: "Keep talking while we move." },
    ],
  },
  {
    id: "c2_aw_pattern_glint",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "chapter2_arrived_emberfall"),
    priority: 127,
    oneTime: true,
    tags: ["chapter2", "willow_deep", "world_tie"],
    lines: [
      { speakerId: "willow", text: "Funny thing about Crown patterns: they hum before machines wake." },
      { speakerId: "arthur", text: "You hear that clearly?" },
      { speakerId: "willow", text: "Clear enough to keep walking before the next note drops." },
    ],
  },
  {
    id: "ae_foundling_roots",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: EARLY_AE_UNLOCK,
    priority: 120,
    oneTime: true,
    tags: ["arthur_backstory", "deep"],
    lines: [
      { speakerId: "elaine", text: "You never answer this plainly, Arthur. Were you truly born in Thornmere?" },
      { speakerId: "arthur", text: "No. Rowan found me in the rootbreak after a storm." },
      { speakerId: "elaine", text: "Found, then. Not abandoned by chance." },
      { speakerId: "arthur", text: "Maybe. We can untangle it later. Keep moving." },
    ],
  },
  {
    id: "ae_rowan_lantern_memory",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: EARLY_AE_UNLOCK,
    priority: 115,
    oneTime: true,
    tags: ["arthur_backstory", "warm"],
    lines: [
      { speakerId: "arthur", text: "Rowan carried a lantern through every storm when I was small." },
      { speakerId: "elaine", text: "A practical devotion. Better than most pedigrees." },
      { speakerId: "arthur", text: "He taught me to walk first, panic second." },
      { speakerId: "elaine", text: "Then honor the lesson and keep pace." },
    ],
  },
  {
    id: "ae_arthur_crown_fear",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_VEIN_GUARDIAN,
    priority: 114,
    oneTime: true,
    tags: ["arthur_backstory", "deep", "crown"],
    lines: [
      { speakerId: "arthur", text: "What if I am not supposed to touch this Crown work at all?" },
      { speakerId: "elaine", text: "Then the roots have made a poor choice in champions." },
      { speakerId: "arthur", text: "I am serious." },
      { speakerId: "elaine", text: "So am I. Fear is permitted. Stopping is not. Forward." },
    ],
  },
  {
    id: "ae_elaine_etiquette_drill",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: EARLY_AE_UNLOCK,
    priority: 111,
    oneTime: true,
    tags: ["elaine_backstory", "warm"],
    lines: [
      { speakerId: "elaine", text: "At ten, I had posture drills before breakfast and silence drills before bed." },
      { speakerId: "arthur", text: "Silence drills?" },
      { speakerId: "elaine", text: "To speak perfectly, one must first be still perfectly. I hated it." },
      { speakerId: "arthur", text: "Good. Talk while we walk, then." },
    ],
  },
  {
    id: "ae_elaine_left_vaeloris",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_EXTRACTOR,
    priority: 118,
    oneTime: true,
    tags: ["elaine_backstory", "vaeloris", "deep"],
    lines: [
      { speakerId: "arthur", text: "You keep reading their machines before they wake." },
      { speakerId: "elaine", text: "I grew up in those halls. Precision, ledgers, consequences ignored." },
      { speakerId: "arthur", text: "So you left." },
      { speakerId: "elaine", text: "I resigned before I became proud of harm. Keep moving." },
    ],
  },
  {
    id: "ae_luminis_pearl_vow",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_VEIN_GUARDIAN,
    priority: 116,
    oneTime: true,
    tags: ["elaine_backstory", "luminis_pearl", "deep"],
    lines: [
      { speakerId: "arthur", text: "That pearl never leaves your staff." },
      { speakerId: "elaine", text: "Luminis Pearl. My mother's. It was meant for ceremony, not war." },
      { speakerId: "arthur", text: "And now?" },
      { speakerId: "elaine", text: "Now it is a vow: protect first, then mourn. We keep moving." },
    ],
  },
  {
    id: "ae_world_tie_old_emberfall",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_EMBERFALL_LEAD,
    priority: 110,
    oneTime: true,
    tags: ["world_tie", "emberfall"],
    lines: [
      { speakerId: "elaine", text: "Emberfall once had another name: Ashcourt Reach." },
      { speakerId: "arthur", text: "Sounds less like a warning." },
      { speakerId: "elaine", text: "Names soften first. Damage comes after. Keep your pace." },
    ],
  },
  {
    id: "ae_world_tie_crown_archive",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_VEIN_GUARDIAN,
    priority: 109,
    oneTime: true,
    tags: ["world_tie", "crown"],
    lines: [
      { speakerId: "arthur", text: "Rowan says the Crown remembers. Vaeloris says it can be measured." },
      { speakerId: "elaine", text: "Both can be true. Measurement without reverence is the danger." },
      { speakerId: "arthur", text: "Then we take neither side whole." },
      { speakerId: "elaine", text: "Exactly. Walk and judge as we go." },
    ],
  },
  {
    id: "ae_warm_training_misfire",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: EARLY_AE_UNLOCK,
    priority: 108,
    oneTime: true,
    tags: ["warm", "bonding"],
    lines: [
      { speakerId: "arthur", text: "You once set your own sleeve alight practicing, did you not?" },
      { speakerId: "elaine", text: "It was controlled flame and a very expensive sleeve." },
      { speakerId: "arthur", text: "So that is a yes." },
      { speakerId: "elaine", text: "Laugh while moving, please." },
    ],
  },
  {
    id: "ae_world_tie_vaeloris_books",
    participantsRequired: ["arthur", "elaine"],
    unlockWhen: POST_EXTRACTOR,
    priority: 107,
    oneTime: true,
    tags: ["world_tie", "vaeloris"],
    lines: [
      { speakerId: "elaine", text: "Vaeloris records every extraction to the grain and heartbeat." },
      { speakerId: "arthur", text: "So they can justify it." },
      { speakerId: "elaine", text: "So they can call it inevitable. Let us prove otherwise. Move." },
    ],
  },
  {
    id: "aw_willow_nicknames",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: WITH_WILLOW,
    priority: 106,
    oneTime: true,
    tags: ["willow_silly", "warm"],
    lines: [
      { speakerId: "willow", text: "Team names update: Stoic Oak, Velvet Dagger, and me, Catastrophe Spark." },
      { speakerId: "arthur", text: "I am not calling you that." },
      { speakerId: "elaine", text: "Nor am I, though it is regrettably accurate." },
      { speakerId: "willow", text: "Fine, titles later. Feet first." },
    ],
  },
  {
    id: "aw_gem_mishap",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: WITH_WILLOW,
    priority: 105,
    oneTime: true,
    tags: ["willow_silly", "warm"],
    lines: [
      { speakerId: "willow", text: "Once I swapped my wand gem with a candy shard by accident." },
      { speakerId: "arthur", text: "How bad?" },
      { speakerId: "willow", text: "Three exploding pastries and a very upset kettle." },
      { speakerId: "elaine", text: "Delightful. Let us avoid repeating that while moving." },
    ],
  },
  {
    id: "aw_watchers_hint",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "vein_guardian_defeated"),
    priority: 112,
    oneTime: true,
    tags: ["willow_deep", "crown"],
    lines: [
      { speakerId: "willow", text: "Sometimes I hear watchers counting between Crown pulses." },
      { speakerId: "arthur", text: "Watchers as in people?" },
      { speakerId: "willow", text: "As in... not quite. We can unpack that after this ridge." },
      { speakerId: "elaine", text: "Then we keep moving until the unpacking point." },
    ],
  },
  {
    id: "aw_pattern_hearing",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "act2_fallout_done"),
    priority: 113,
    oneTime: true,
    tags: ["willow_deep", "world_tie"],
    lines: [
      { speakerId: "willow", text: "You both see veins. I hear them as chords." },
      { speakerId: "elaine", text: "And now?" },
      { speakerId: "willow", text: "Now the chord changed key. Someone taught it new math." },
      { speakerId: "arthur", text: "Then we find who. Keep going." },
    ],
  },
  {
    id: "aw_teacher_refusal",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "vaeloris_harvester_defeated"),
    priority: 111,
    oneTime: true,
    tags: ["willow_deep", "secret"],
    lines: [
      { speakerId: "arthur", text: "Who taught you to read the pulse like this?" },
      { speakerId: "willow", text: "A person who liked masks and hated introductions." },
      { speakerId: "elaine", text: "Helpful." },
      { speakerId: "willow", text: "I know. March first, secrets second." },
    ],
  },
  {
    id: "aw_elaine_duel_club",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: WITH_WILLOW,
    priority: 104,
    oneTime: true,
    tags: ["warm", "bonding"],
    lines: [
      { speakerId: "willow", text: "Elaine parries insults better than knives." },
      { speakerId: "elaine", text: "Years of formal dinners. Excellent combat training." },
      { speakerId: "arthur", text: "Remind me never to attend one." },
      { speakerId: "willow", text: "Good plan. Keep walking." },
    ],
  },
  {
    id: "aw_arthur_quiet_test",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: WITH_WILLOW,
    priority: 103,
    oneTime: true,
    tags: ["warm", "arthur_backstory"],
    lines: [
      { speakerId: "willow", text: "Arthur measures words like rations." },
      { speakerId: "arthur", text: "Words are lighter than mistakes." },
      { speakerId: "elaine", text: "A sensible policy. Continue applying it while advancing." },
    ],
  },
  {
    id: "aw_vaeloris_lab_joke",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "vaeloris_field_triggered"),
    priority: 102,
    oneTime: true,
    tags: ["world_tie", "willow_silly"],
    lines: [
      { speakerId: "willow", text: "Vaeloris labs smell like polished brass and bad decisions." },
      { speakerId: "elaine", text: "Accurate on both notes." },
      { speakerId: "arthur", text: "Then we avoid both. Trail first." },
    ],
  },
  {
    id: "aw_three_step_promise",
    participantsRequired: ["arthur", "elaine", "willow"],
    unlockWhen: (ctx) => WITH_WILLOW(ctx) && hasFlag(ctx, "ridge_gate_unlocked"),
    priority: 101,
    oneTime: true,
    tags: ["bonding", "world_tie"],
    lines: [
      { speakerId: "elaine", text: "We proceed by three rules: observe, decide, act." },
      { speakerId: "willow", text: "And snack, eventually." },
      { speakerId: "arthur", text: "After the gate." },
      { speakerId: "willow", text: "After the gate. March." },
    ],
  },
]);

export const TRAVEL_QUIPS = deepFreeze([
  { id: "quip-arthur-01", speakerId: "arthur", text: "Keep pace. We are closest while moving." },
  { id: "quip-arthur-02", speakerId: "arthur", text: "Eyes up. Trail first, worry second." },
  { id: "quip-arthur-03", speakerId: "arthur", text: "Short breaks, long road." },
  { id: "quip-arthur-04", speakerId: "arthur", text: "Listen to the wind. It is warning us for free." },
  { id: "quip-arthur-05", speakerId: "arthur", text: "The path is easier before it closes." },
  { id: "quip-arthur-06", speakerId: "arthur", text: "We make better time than excuses." },
  { id: "quip-arthur-07", speakerId: "arthur", text: "Keep your footing. Ground is less honest lately." },
  { id: "quip-arthur-08", speakerId: "arthur", text: "If it feels wrong, move through it." },
  { id: "quip-arthur-09", speakerId: "arthur", text: "Rowan says roads answer steady feet." },

  { id: "quip-elaine-01", speakerId: "elaine", text: "A clean pace prevents messy consequences." },
  { id: "quip-elaine-02", speakerId: "elaine", text: "Composure and momentum. In that order." },
  { id: "quip-elaine-03", speakerId: "elaine", text: "The Crown respects discipline more than noise." },
  { id: "quip-elaine-04", speakerId: "elaine", text: "We proceed before uncertainty fattens." },
  { id: "quip-elaine-05", speakerId: "elaine", text: "Do keep moving; dread walks faster than we do." },
  { id: "quip-elaine-06", speakerId: "elaine", text: "Every measured step is a small refusal." },
  { id: "quip-elaine-07", speakerId: "elaine", text: "Vaeloris tracks routes. Let us stay ahead of theirs." },
  { id: "quip-elaine-08", speakerId: "elaine", text: "Order is portable. Bring it with you." },

  { id: "quip-willow-01", speakerId: "willow", text: "Road says hello. We should answer with speed." },
  { id: "quip-willow-02", speakerId: "willow", text: "Ash in the air, adventure in the lungs." },
  { id: "quip-willow-03", speakerId: "willow", text: "March now, mystery snacks later." },
  { id: "quip-willow-04", speakerId: "willow", text: "If the ground hums, hum louder and keep going." },
  { id: "quip-willow-05", speakerId: "willow", text: "I vote we outrun the ominous part." },
  { id: "quip-willow-06", speakerId: "willow", text: "Winds are gossiping east again. Convenient." },
  { id: "quip-willow-07", speakerId: "willow", text: "We are a heroic line segment. Keep extending." },
  { id: "quip-willow-08", speakerId: "willow", text: "The trail is dramatic. Let us be productive." },
]);

export function findTopicById(topicId = "") {
  const normalized = String(topicId ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return BANTER_TOPICS.find((topic) => topic.id === normalized) ?? null;
}

export function canUseTopic(topic, context = {}) {
  if (!topic || typeof topic !== "object") return false;
  if (!hasAllMembers(context, topic.participantsRequired ?? [])) return false;
  if (typeof topic.unlockWhen === "function") {
    return Boolean(topic.unlockWhen(context));
  }
  return true;
}

export function getUnlockedTopics(context = {}) {
  return BANTER_TOPICS.filter((topic) => canUseTopic(topic, context));
}

export function getTravelQuipsForContext(context = {}) {
  return TRAVEL_QUIPS.filter((quip) => {
    const speakerId = String(quip?.speakerId ?? "").toLowerCase();
    return hasAllMembers(context, [speakerId]);
  });
}
