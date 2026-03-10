(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const buildRecoveryChoice = (nodeId: string, questId: string, outcomeId: string, title: string, description: string, consequenceId: string, flagIds?: string[], extraEffects?: RewardChoiceEffect[]) => helpers.buildOpportunityChoice("Recovery Opportunity", nodeId, questId, outcomeId, title, description, consequenceId, flagIds, extraEffects);

  const RECOVERY_OPPORTUNITY_DEFINITIONS: Record<number, RecoveryOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_recovery_opportunity",
      title: "Rogue Recovery",
      zoneTitle: "Rogue Recovery",
      description: "After the final ridge line settles, the vigil shrine and the closing march can still be turned into one lasting monastery recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the closing march together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresShrineOpportunityId: "rogue_vigil_route_opportunity",
      requiresCulminationOpportunityId: "rogue_culmination_opportunity",
      variants: [
        {
          id: "monastery_recovery",
          title: "Monastery Recovery",
          description: "Even without a sharper signal line, the monastery road can still recover into either stocked chapel cells or cleaner gate lamps.",
          summary: "A fallback recovery lane appears once the rogue shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "restock_the_chapel_cells",
              "Restock the Chapel Cells",
              "Use the settled ridge and shrine stores to refill the last chapel cells before Andariel.",
              "chapel_cells_restocked",
              ["rogue_recovery_chapel_cells"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "relight_the_last_gate_lamps",
              "Relight the Last Gate Lamps",
              "Turn the same closing line into one final run of gate lamps across the monastery road.",
              "last_gate_lamps_relit",
              ["rogue_recovery_gate_lamps"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "lantern_recovery",
          title: "Lantern Recovery",
          description: "Signal lanterns and the last wayfinders turn the recovery lane into a guided chapel return instead of a generic gate-lamp pass.",
          summary: "The shrine lantern line and the wayfinder culmination now recover the monastery together after the ridge closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_signal_lanterns", "rogue_culmination_last_wayfinders"],
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "rehang_the_chapel_lanterns",
              "Rehang the Chapel Lanterns",
              "Carry the signal lanterns and last wayfinders into one final chapel light chain before the monastery seals.",
              "chapel_lanterns_rehung",
              ["rogue_recovery_chapel_lanterns"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "guide_the_last_cloister_watch",
              "Guide the Last Cloister Watch",
              "Use the same lantern line to walk the final cloister watch back across the ridge.",
              "last_cloister_watch_guided",
              ["rogue_recovery_cloister_watch"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "volley_recovery",
          title: "Volley Recovery",
          description: "Stacked arrow crates and the cathedral approach turn the recovery lane into a true archer reset instead of a generic chapel restock.",
          summary: "The shrine volley line and the cathedral culmination now recover the rogue road together after the last ridge settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_arrow_crates_stacked", "rogue_culmination_cathedral_approach"],
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "recover_the_archer_stores",
              "Recover the Archer Stores",
              "Carry the arrow crates and cathedral route into one last archer-store recovery across the monastery edge.",
              "archer_stores_recovered",
              ["rogue_recovery_archer_stores"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "mark_the_cathedral_return",
              "Mark the Cathedral Return",
              "Use the same restored route to chart the last return markers under the cathedral walls.",
              "cathedral_return_marked",
              ["rogue_recovery_cathedral_return"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_recovery_opportunity",
      title: "Sunwell Recovery",
      zoneTitle: "Sunwell Recovery",
      description: "After the last tomb crossing resolves, the shrine lane and closing desert march can still be turned into one lasting reliquary recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineOpportunityId: "sunwell_shrine_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "reliquary_recovery",
          title: "Reliquary Recovery",
          description: "Even without a sharper specialist lane, the desert route can still recover into either restored casks or a cleaner last shade line.",
          summary: "A fallback recovery lane appears once the sunwell shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "restore_the_last_cask_rows",
              "Restore the Last Cask Rows",
              "Recover the desert stores and keep the reliquary road from thinning out at the end of the act.",
              "last_cask_rows_restored",
              ["sunwell_recovery_cask_rows"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "shade_the_final_caravan_line",
              "Shade the Final Caravan Line",
              "Turn the same closing route into one last shaded caravan line before the tomb seals.",
              "final_caravan_line_shaded",
              ["sunwell_recovery_caravan_shade"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "beacon_recovery",
          title: "Beacon Recovery",
          description: "Aligned water beacons and the tomb screen turn the recovery lane into a true reliquary reset instead of a generic cask restore.",
          summary: "The shrine beacon line and the screened culmination now recover the crossing together after the desert route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_culmination_tomb_screen"],
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "relight_the_reliquary_beacons",
              "Relight the Reliquary Beacons",
              "Carry the water beacons and tomb screen into one final beacon chain over the reliquary gate.",
              "reliquary_beacons_relit",
              ["sunwell_recovery_reliquary_beacons"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "patch_the_screened_crossing",
              "Patch the Screened Crossing",
              "Use the same guided screen to restore the last clean crossing into the tomb line.",
              "screened_crossing_patched",
              ["sunwell_recovery_screened_crossing"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_recovery",
          title: "Spearline Recovery",
          description: "A braced pack column and the final spearline turn the recovery lane into a true warden reset instead of a generic caravan shade.",
          summary: "The shrine march line and the desert-guard culmination now recover the reliquary together after the last crossing closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_pack_column_braced", "sunwell_culmination_final_spearline"],
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "recover_the_spearline_wards",
              "Recover the Spearline Wards",
              "Carry the braced column and final spearline into one last ward reset over the reliquary road.",
              "spearline_wards_recovered",
              ["sunwell_recovery_spearline_wards"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "ready_the_last_well_line",
              "Ready the Last Well Line",
              "Use the same guarded lane to ready one final well line before the tomb closes.",
              "last_well_line_readied",
              ["sunwell_recovery_well_line"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_recovery_opportunity",
      title: "Harbor Recovery",
      zoneTitle: "Harbor Recovery",
      description: "After the final harbor push resolves, the shrine lane and closing dockside march can still be turned into one lasting harbor recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineOpportunityId: "jade_shrine_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "dockside_recovery",
          title: "Dockside Recovery",
          description: "Even without a sharper specialist lane, the harbor can still recover into either reopened stores or a cleaner tide-mark return.",
          summary: "A fallback recovery lane appears once the harbor shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "reopen_the_river_stores",
              "Reopen the River Stores",
              "Recover the last river stores and keep the Kurast line from rotting shut before Mephisto.",
              "river_stores_reopened",
              ["kurast_recovery_river_stores"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "rehang_the_tide_signals",
              "Rehang the Tide Signals",
              "Turn the same closing route into one final set of tide signals across the docks.",
              "tide_signals_rehung",
              ["kurast_recovery_tide_signals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "channel_recovery",
          title: "Channel Recovery",
          description: "Floated supply marks and the cleared Durance channel turn the recovery lane into a true river reset instead of a generic dock reopening.",
          summary: "The shrine tide line and the Durance-channel culmination now recover the harbor together after the last relay settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_culmination_durance_channel"],
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "recover_the_pilot_marks",
              "Recover the Pilot Marks",
              "Carry the floated supply marks and clean channel into one last pilot-mark recovery over the river mouth.",
              "pilot_marks_recovered",
              ["kurast_recovery_pilot_marks"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "dry_the_last_channel_ledgers",
              "Dry the Last Channel Ledgers",
              "Use the same clean river line to save the last ledgers from the swamp rot.",
              "last_channel_ledgers_dried",
              ["kurast_recovery_channel_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spellward_recovery",
          title: "Spellward Recovery",
          description: "Sealed dock bins and spellblade wards turn the recovery lane into a true harbor reset instead of a generic tide-signal return.",
          summary: "The shrine storehouse line and the specialist culmination now recover the dockside route together after the last channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_dock_bins_sealed", "kurast_culmination_spellblade_wards"],
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "recover_the_spellward_bins",
              "Recover the Spellward Bins",
              "Carry the sealed bins and spellward line into one last harbor-store recovery before the docks close.",
              "spellward_bins_recovered",
              ["kurast_recovery_spellward_bins"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "seal_the_last_dock_passages",
              "Seal the Last Dock Passages",
              "Use the same recovery line to close the last hidden passages across the harbor edge.",
              "last_dock_passages_sealed",
              ["kurast_recovery_dock_passages"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_recovery_opportunity",
      title: "Hellforge Recovery",
      zoneTitle: "Hellforge Recovery",
      description: "After the final breach resolves, the shrine lane and closing sanctuary march can still be turned into one lasting hellforge recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineOpportunityId: "infernal_shrine_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "sanctuary_recovery",
          title: "Sanctuary Recovery",
          description: "Even without a sharper specialist lane, the breach route can still recover into either reopened cutmarks or a cleaner ash-watch return.",
          summary: "A fallback recovery lane appears once the hellforge shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "reopen_the_sanctuary_cutmarks",
              "Reopen the Sanctuary Cutmarks",
              "Recover the last cutmarks and keep the sanctuary breach from sealing too early around the forge.",
              "sanctuary_cutmarks_reopened",
              ["hellforge_recovery_cutmarks"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "relight_the_ash_watch",
              "Relight the Ash Watch",
              "Turn the same closing line into one final ash-watch chain across the infernal cut.",
              "ash_watch_relit",
              ["hellforge_recovery_ash_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forgegate_recovery",
          title: "Forgegate Recovery",
          description: "Chained forge gates and breach rivets turn the recovery lane into a true sanctuary reset instead of a generic cutmark reopening.",
          summary: "The shrine iron line and the forged-turn culmination now recover the sanctuary together after the breach settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_culmination_breach_rivets"],
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "recover_the_forgegate_posts",
              "Recover the Forgegate Posts",
              "Carry the chained gates and breach rivets into one last forgegate recovery before Diablo.",
              "forgegate_posts_recovered",
              ["hellforge_recovery_forgegate_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "temper_the_last_repair_rings",
              "Temper the Last Repair Rings",
              "Use the same forged line to repair the last sanctuary rings around the cut.",
              "last_repair_rings_tempered",
              ["hellforge_recovery_repair_rings"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "warfire_recovery",
          title: "Warfire Recovery",
          description: "Fueled war sconces and the breachscreen turn the recovery lane into a true hellward reset instead of a generic ash-watch return.",
          summary: "The shrine warfire line and the specialist culmination now recover the infernal route together after the sanctuary hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_war_sconces_fueled", "hellforge_culmination_breachscreen"],
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "recover_the_hellward_screen",
              "Recover the Hellward Screen",
              "Carry the war sconces and breachscreen into one last screened recovery over the sanctuary cut.",
              "hellward_screen_recovered",
              ["hellforge_recovery_hellward_screen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "restore_the_last_sconce_paths",
              "Restore the Last Sconce Paths",
              "Use the same recovery line to relight the final paths between the infernal sconces.",
              "last_sconce_paths_restored",
              ["hellforge_recovery_sconce_paths"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_recovery_opportunity",
      title: "Summit Recovery",
      zoneTitle: "Summit Recovery",
      description: "After the final ascent resolves, the shrine lane and closing summit march can still be turned into one lasting summit recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineOpportunityId: "ancients_way_route_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_recovery",
          title: "Summit Recovery",
          description: "Even without a sharper specialist lane, the mountain route can still recover into either reopened caches or a cleaner watchfire ring.",
          summary: "A fallback recovery lane appears once the summit shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_last_frost_caches",
              "Recover the Last Frost Caches",
              "Recover the last frost caches and keep the summit road from starving out before Baal.",
              "last_frost_caches_recovered",
              ["harrogath_recovery_frost_caches"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "relight_the_watchfire_ring",
              "Relight the Watchfire Ring",
              "Turn the same closing climb into one final watchfire ring over the summit.",
              "watchfire_ring_relit",
              ["harrogath_recovery_watchfire_ring"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "watchfire_recovery",
          title: "Watchfire Recovery",
          description: "Ringed watchfires and the Ancients provisions turn the recovery lane into a true summit reset instead of a generic frost-cache return.",
          summary: "The shrine watchfire line and the provisions culmination now recover the final ascent together after the summit route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_provision_fires",
              "Recover the Provision Fires",
              "Carry the watchfire ring and Ancients provisions into one last restored fire line over the summit ascent.",
              "provision_fires_recovered",
              ["harrogath_recovery_provision_fires"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "restage_the_last_bearer_posts",
              "Restage the Last Bearer Posts",
              "Use the same recovered line to restage the final bearer posts across the frozen switchbacks.",
              "last_bearer_posts_restaged",
              ["harrogath_recovery_bearer_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "banner_recovery",
          title: "Banner Recovery",
          description: "A readied banner reserve and the Ancients guard turn the recovery lane into a true summit reset instead of a generic watchfire ring.",
          summary: "The shrine warband line and the guard culmination now recover the summit road together after the last ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_banner_reserve_readied", "harrogath_culmination_ancients_guard"],
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_guard_banners",
              "Recover the Guard Banners",
              "Carry the readied banners and Ancients guard into one final restored banner hold over the summit road.",
              "guard_banners_recovered",
              ["harrogath_recovery_guard_banners"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "marshal_the_last_oath_posts",
              "Marshal the Last Oath Posts",
              "Use the same recovered guard line to marshal the last oath posts before the Worldstone push.",
              "last_oath_posts_marshaled",
              ["harrogath_recovery_oath_posts"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.recoveryOpportunityDefinitions = RECOVERY_OPPORTUNITY_DEFINITIONS;
})();
