(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const buildAccordChoice = helpers.buildOpportunityChoiceFactory("Accord Opportunity");

  const ACCORD_OPPORTUNITY_DEFINITIONS: Record<number, AccordOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_accord_opportunity",
      title: "Reliquary Accord",
      zoneTitle: "Reliquary Accord",
      description: "After the last tomb crossing settles, the shrine lane, desert crossroads, and culmination can still be bound into one lasting reliquary accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineOpportunityId: "sunwell_shrine_opportunity",
      requiresCrossroadOpportunityId: "sunwell_crossroads_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "caravan_accord",
          title: "Caravan Accord",
          description: "Even without a sharper beacon or spearwall line, the desert route can still settle into a cleaner reliquary accord.",
          summary: "A fallback accord lane appears once the Sunwell shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "restore_the_last_guide_casks",
              "Restore the Last Guide Casks",
              "Use the settled crossing to restage the final guide casks around the reliquary road.",
              "guide_casks_restored",
              ["sunwell_accord_guide_casks"],
              [{ kind: "support_build" }, { kind: "refill_potions", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "remark_the_tomb_waystations",
              "Remark the Tomb Waystations",
              "Turn the same accord into one final set of waystation marks before the Sepulcher Devourer.",
              "tomb_waystations_remarked",
              ["sunwell_accord_tomb_waystations"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "beacon_accord",
          title: "Beacon Accord",
          description: "Aligned water beacons and the contract guard turn the accord lane into a true reliquary bind instead of a generic caravan restage.",
          summary: "The shrine beacon line and the desert crossroads now settle the reliquary together after the crossing closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_crossroads_contract_guard"],
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "bind_the_beacon_posts",
              "Bind the Beacon Posts",
              "Carry the beacon line and contract guard into one final desert post chain around the reliquary.",
              "beacon_posts_bound",
              ["sunwell_accord_beacon_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "marshal_the_last_well_screens",
              "Marshal the Last Well Screens",
              "Use the same accord to screen the last well line before the tomb road narrows.",
              "last_well_screens_marshaled",
              ["sunwell_accord_well_screens"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_accord",
          title: "Spearline Accord",
          description: "Aligned water beacons, the contract guard, and the final spearline turn the accord lane into a true desert close instead of a generic screen line.",
          summary: "The shrine, crossroads, and culmination all settle together into one final reliquary accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_crossroads_contract_guard", "sunwell_culmination_final_spearline"],
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "trace_the_final_spear_posts",
              "Trace the Final Spear Posts",
              "Carry the full beacon and spearline route into one last spear-post survey across the reliquary edge.",
              "final_spear_posts_traced",
              ["sunwell_accord_spear_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "ready_the_reliquary_screen",
              "Ready the Reliquary Screen",
              "Use the same accord to ready the last screened approach into the reliquary.",
              "reliquary_screen_readied",
              ["sunwell_accord_reliquary_screen"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_accord_opportunity",
      title: "Harbor Accord",
      zoneTitle: "Harbor Accord",
      description: "After the last harbor push settles, the shrine lane, crossroads, and culmination can still be bound into one lasting harbor accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineOpportunityId: "jade_shrine_opportunity",
      requiresCrossroadOpportunityId: "kurast_crossroads_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "dock_accord",
          title: "Dock Accord",
          description: "Even without a sharper pilot or channel line, the harbor can still settle into a cleaner dockside accord.",
          summary: "A fallback accord lane appears once the harbor shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "recover_the_tally_ledgers",
              "Recover the Tally Ledgers",
              "Bind the last harbor ledgers into one clean account before the Idol Patriarch.",
              "tally_ledgers_recovered",
              ["kurast_accord_tally_ledgers"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "rehang_the_last_berth_signals",
              "Rehang the Last Berth Signals",
              "Turn the same accord into one final run of berth signals across the harbor edge.",
              "last_berth_signals_rehung",
              ["kurast_accord_berth_signals"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "pilot_accord",
          title: "Pilot Accord",
          description: "Floated supply marks and shadow pilots turn the accord lane into a guided harbor bind instead of a generic ledger recovery.",
          summary: "The shrine tide line and the harbor crossroads now settle the docks together after the river route clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_crossroads_shadow_pilots"],
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "chart_the_pilot_chain",
              "Chart the Pilot Chain",
              "Carry the supply marks and shadow pilots into one final charted line over the river mouth.",
              "pilot_chain_charted",
              ["kurast_accord_pilot_chain"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "stage_the_shadow_berths",
              "Stage the Shadow Berths",
              "Use the same accord to stage the last shadow berths before the docks shut.",
              "shadow_berths_staged",
              ["kurast_accord_shadow_berths"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "channel_accord",
          title: "Channel Accord",
          description: "Floated supply marks, shadow pilots, and the cleared Sanctum channel turn the accord lane into a true harbor close instead of a generic berth restage.",
          summary: "The shrine, crossroads, and culmination all settle together into one final harbor accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_crossroads_shadow_pilots", "kurast_culmination_durance_channel"],
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "recount_the_channel_marks",
              "Recount the Channel Marks",
              "Carry the full pilot chain into one last channel-mark census across the harbor approach.",
              "channel_marks_recounted",
              ["kurast_accord_channel_marks"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "seal_the_last_harbor_cordons",
              "Seal the Last Harbor Cordons",
              "Use the same accord to bind the last harbor cordons before the Sanctum push.",
              "last_harbor_cordons_sealed",
              ["kurast_accord_harbor_cordons"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_accord_opportunity",
      title: "Sanctuary Accord",
      zoneTitle: "Sanctuary Accord",
      description: "After the final breach settles, the shrine lane, crossroads, and culmination can still be bound into one lasting sanctuary accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineOpportunityId: "infernal_shrine_opportunity",
      requiresCrossroadOpportunityId: "hellforge_crossroads_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "ash_accord",
          title: "Ash Accord",
          description: "Even without a sharper forgegate line, the breach can still settle into a cleaner sanctuary accord.",
          summary: "A fallback accord lane appears once the hellforge shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "tally_the_sanctuary_staples",
              "Tally the Sanctuary Staples",
              "Bind the last sanctuary staples into one final count around the infernal cut.",
              "sanctuary_staples_tallied",
              ["hellforge_accord_sanctuary_staples"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "remark_the_last_ash_routes",
              "Remark the Last Ash Routes",
              "Turn the same accord into one final ash-route marking run before the Cinder Tyrant.",
              "last_ash_routes_remarked",
              ["hellforge_accord_ash_routes"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "forgegate_accord",
          title: "Forgegate Accord",
          description: "Chained forge gates and the hellward turn transform the accord lane into a true sanctuary bind instead of a generic ash tally.",
          summary: "The shrine iron line and the breach crossroads now settle the sanctuary together after the cut hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_crossroads_hellward_turn"],
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "bind_the_forgegate_turns",
              "Bind the Forgegate Turns",
              "Carry the chained gates and hellward turn into one final forgegate circuit before the sanctuary seals.",
              "forgegate_turns_bound",
              ["hellforge_accord_forgegate_turns"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "stage_the_last_hellward_relief",
              "Stage the Last Hellward Relief",
              "Use the same accord to stage the last relief line around the infernal breach.",
              "last_hellward_relief_staged",
              ["hellforge_accord_hellward_relief"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "rivet_accord",
          title: "Rivet Accord",
          description: "Chained forge gates, the hellward turn, and the breach rivets transform the accord lane into a true sanctuary close instead of a generic relief post.",
          summary: "The shrine, crossroads, and culmination all settle together into one final sanctuary accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_crossroads_hellward_turn", "hellforge_culmination_breach_rivets"],
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "recount_the_breach_rivets",
              "Recount the Breach Rivets",
              "Carry the full forgegate line into one last rivet count across the sanctuary cut.",
              "breach_rivets_recounted",
              ["hellforge_accord_breach_rivets"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "ring_the_last_sanctuary_hammers",
              "Ring the Last Sanctuary Hammers",
              "Use the same accord to ring the last hammer line around the infernal breach.",
              "last_sanctuary_hammers_rung",
              ["hellforge_accord_sanctuary_hammers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_accord_opportunity",
      title: "Summit Accord",
      zoneTitle: "Summit Accord",
      description: "After the final ascent settles, the shrine lane, crossroads, and culmination can still be bound into one lasting summit accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineOpportunityId: "ancients_way_route_opportunity",
      requiresCrossroadOpportunityId: "harrogath_crossroads_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "watch_accord",
          title: "Watch Accord",
          description: "Even without a sharper watchfire line, the summit can still settle into a cleaner mountain accord.",
          summary: "A fallback accord lane appears once the summit shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "count_the_summit_stores",
              "Count the Summit Stores",
              "Bind the last summit stores into one final ration count before the Siege Tyrant.",
              "summit_stores_counted",
              ["harrogath_accord_summit_stores"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "rehang_the_last_switchback_marks",
              "Rehang the Last Switchback Marks",
              "Turn the same accord into one final run of marks over the frozen switchbacks.",
              "last_switchback_marks_rehung",
              ["harrogath_accord_switchback_marks"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "watchfire_accord",
          title: "Watchfire Accord",
          description: "Ringed watchfires and the switchback crossroads turn the accord lane into a guided summit bind instead of a generic ration count.",
          summary: "The shrine watchfire line and the mountain crossroads now settle the summit together after the ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_crossroads_switchbacks"],
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "bind_the_watchfire_posts",
              "Bind the Watchfire Posts",
              "Carry the watchfire ring and switchback route into one final post line over the summit ascent.",
              "watchfire_posts_bound",
              ["harrogath_accord_watchfire_posts"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "stage_the_last_sled_guides",
              "Stage the Last Sled Guides",
              "Use the same accord to set the last guide sleds before the Ruin Crown climb.",
              "last_sled_guides_staged",
              ["harrogath_accord_sled_guides"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "provision_accord",
          title: "Provision Accord",
          description: "Ringed watchfires, the switchback crossroads, and the Ancients provisions turn the accord lane into a true summit close instead of a generic guide post.",
          summary: "The shrine, crossroads, and culmination all settle together into one final summit accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_crossroads_switchbacks", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "recount_the_provision_chain",
              "Recount the Provision Chain",
              "Carry the full summit line into one last provision count across the Ancients road.",
              "provision_chain_recounted",
              ["harrogath_accord_provision_chain"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "raise_the_last_ancients_posts",
              "Raise the Last Ancients Posts",
              "Use the same accord to raise the last oath posts before the summit push.",
              "last_ancients_posts_raised",
              ["harrogath_accord_ancients_posts"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.accordOpportunityDefinitions = ACCORD_OPPORTUNITY_DEFINITIONS;
})();
