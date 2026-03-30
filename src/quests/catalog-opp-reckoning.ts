(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const buildReckoningChoice = helpers.buildOpportunityChoiceFactory("Reckoning Opportunity");

  const RECKONING_OPPORTUNITY_DEFINITIONS: Record<number, ReckoningOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_reckoning_opportunity",
      title: "Sunwell Reckoning",
      zoneTitle: "Sunwell Reckoning",
      description: "After the last tomb crossing resolves, the reserve column and culmination lane can still be tallied into one final desert reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresReserveOpportunityId: "sunwell_reserve_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "desert_reckoning",
          title: "Desert Reckoning",
          description: "Even without a sharper formation, the settled desert line can still become either counted casks or one cleaner last-dune survey.",
          summary: "A fallback reckoning lane appears once the sunwell reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "count_the_tomb_casks",
              "Count the Tomb Casks",
              "Audit the last tomb casks and keep the reliquary descent from thinning out.",
              "tomb_casks_counted",
              ["sunwell_reckoning_tomb_casks"],
              [{ kind: "pivot_build" }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "survey_the_last_dunes",
              "Survey the Last Dunes",
              "Turn the same closing line into one final desert survey before the tomb seals.",
              "last_dunes_surveyed",
              ["sunwell_reckoning_last_dunes"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "tomb_screen_reckoning",
          title: "Tomb Screen Reckoning",
          description: "A screened pylon reserve and the final tomb screen turn the reckoning lane into a measured barricade instead of a generic cask count.",
          summary: "The reserve pylon screen and the culmination tomb screen now settle together after the crossing resolves.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_pylon_screen", "sunwell_culmination_tomb_screen"],
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "brace_the_reliquary_barricade",
              "Brace the Reliquary Barricade",
              "Carry the screened reserve and the tomb screen into one last barricade over the reliquary gate.",
              "reliquary_barricade_braced",
              ["sunwell_reckoning_reliquary_barricade"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "lay_the_last_shade_cloth",
              "Lay the Last Shade Cloth",
              "Use the same screened line to finish the last shade cloth over the desert gate.",
              "last_shade_cloth_laid",
              ["sunwell_reckoning_shade_cloth"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_reckoning",
          title: "Spearline Reckoning",
          description: "Marched reserve lances and the final spearline turn the reckoning lane into a true desert mustering instead of a generic dune survey.",
          summary: "The reserve lance line and the desert-guard culmination now settle together after the tomb route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_lances", "sunwell_culmination_final_spearline"],
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "count_the_lance_wards",
              "Count the Lance Wards",
              "Turn the reserve lances and final spearline into one last ward count over the tomb crossing.",
              "lance_wards_counted",
              ["sunwell_reckoning_lance_wards"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "raise_the_last_sun_canopy",
              "Raise the Last Sun Canopy",
              "Use the same spearline to raise one final sun canopy over the warden line.",
              "last_sun_canopy_raised",
              ["sunwell_reckoning_sun_canopy"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_reckoning_opportunity",
      title: "Harbor Reckoning",
      zoneTitle: "Harbor Reckoning",
      description: "After the final harbor push resolves, the reserve columns and culmination lane can still be balanced into one lasting dockside reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresReserveOpportunityId: "kurast_reserve_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "harbor_reckoning",
          title: "Harbor Reckoning",
          description: "Even without a sharper specialist route, the settled harbor can still be balanced into either river tallies or cleaner last dock fires.",
          summary: "A fallback reckoning lane appears once the harbor reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "count_the_river_tallies",
              "Count the River Tallies",
              "Settle the last river tallies before the Sanctum route closes over Idol Reach.",
              "river_tallies_counted",
              ["kurast_reckoning_river_tallies"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "seal_the_last_dock_fires",
              "Seal the Last Dock Fires",
              "Use the same settled harbor line to bank the last dock fires into the wet season.",
              "last_dock_fires_sealed",
              ["kurast_reckoning_dock_fires"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "pilot_channel_reckoning",
          title: "Pilot Channel Reckoning",
          description: "Pilot caches and the cleared Sanctum channel turn the reckoning lane into a true river account instead of a generic tally.",
          summary: "The pilot reserve and the Sanctum-channel culmination now settle together after the harbor route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_pilot_caches", "kurast_culmination_durance_channel"],
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "balance_the_pilot_ledgers",
              "Balance the Pilot Ledgers",
              "Use the pilot caches and clean channel to settle the last ledgers over the Sanctum mouth.",
              "pilot_ledgers_balanced",
              ["kurast_reckoning_pilot_ledgers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "sound_the_channel_bells",
              "Sound the Channel Bells",
              "Carry the same clean channel into one last bell call over the harbor current.",
              "channel_bells_sounded",
              ["kurast_reckoning_channel_bells"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "spellward_reckoning",
          title: "Spellward Reckoning",
          description: "Held night berths and the chartered spellblade wards turn the reckoning lane into a true harbor seal instead of a generic dock fire.",
          summary: "The night-berth reserve and the specialist culmination now settle together after the final channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_berths", "kurast_culmination_spellblade_wards"],
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "ward_the_last_night_berths",
              "Ward the Last Night Berths",
              "Carry the night berths and spellward line into one last harbor ward over the river mouth.",
              "last_night_berths_warded",
              ["kurast_reckoning_night_berths"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "hide_the_last_harbor_seals",
              "Hide the Last Harbor Seals",
              "Use the same specialist route to hide the last harbor seals and close the dockside books.",
              "last_harbor_seals_hidden",
              ["kurast_reckoning_harbor_seals"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_reckoning_opportunity",
      title: "Hellforge Reckoning",
      zoneTitle: "Hellforge Reckoning",
      description: "After the final breach resolves, the reserve wall and culmination line can still be judged into one lasting sanctuary reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresReserveOpportunityId: "hellforge_reserve_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "forge_reckoning",
          title: "Forge Reckoning",
          description: "Even without a sharper specialist line, the settled forge can still be judged into either counted blackstores or one cleaner ash watch.",
          summary: "A fallback reckoning lane appears once the forge reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "count_the_blackstores",
              "Count the Blackstores",
              "Audit the last blackstores before the sanctuary breach closes around the forge.",
              "blackstores_counted",
              ["hellforge_reckoning_blackstores"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "name_the_last_ash_ward",
              "Name the Last Ash Ward",
              "Use the same settled breach line to set one last ash ward over the sanctuary cut.",
              "last_ash_ward_named",
              ["hellforge_reckoning_ash_ward"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "turning_chain_reckoning",
          title: "Turning Chain Reckoning",
          description: "A drilled turning line and the raised breach rivets turn the reckoning lane into a true chain account instead of a generic blackstore count.",
          summary: "The turning reserve and the forged-turn culmination now settle together after the breach route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_turning_line", "hellforge_culmination_breach_rivets"],
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "judge_the_turning_chain",
              "Judge the Turning Chain",
              "Use the turning line and breach rivets to settle the last chain account before the sanctuary seals.",
              "turning_chain_judged",
              ["hellforge_reckoning_turning_chain"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "score_the_last_furnace_cuts",
              "Score the Last Furnace Cuts",
              "Carry the same forged line into one last series of furnace cuts over the breach.",
              "last_furnace_cuts_scored",
              ["hellforge_reckoning_furnace_cuts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "breachscreen_reckoning",
          title: "Breachscreen Reckoning",
          description: "A locked relief wall and the templar breachscreen turn the reckoning lane into a true sanctuary screen instead of a generic ash ward.",
          summary: "The relief-wall reserve and the specialist culmination now settle together after the infernal line hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_relief_wall", "hellforge_culmination_breachscreen"],
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "hold_the_final_relief_wall",
              "Hold the Final Relief Wall",
              "Carry the relief wall and breachscreen into one last shielded hold over the sanctuary cut.",
              "final_relief_wall_held",
              ["hellforge_reckoning_relief_wall"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "count_the_sanctuary_screens",
              "Count the Sanctuary Screens",
              "Use the same screened line to settle the last sanctuary screens before the Cinder Tyrant.",
              "sanctuary_screens_counted",
              ["hellforge_reckoning_sanctuary_screens"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_reckoning_opportunity",
      title: "Summit Reckoning",
      zoneTitle: "Summit Reckoning",
      description: "After the final ascent resolves, the reserve columns and culmination line can still be reckoned into one lasting summit posture.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresReserveOpportunityId: "harrogath_reserve_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_reckoning",
          title: "Summit Reckoning",
          description: "Even without a sharper specialist line, the settled summit can still be reckoned into either counted stores or one cleaner watchfire line.",
          summary: "A fallback reckoning lane appears once the summit reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "count_the_frost_stores",
              "Count the Frost Stores",
              "Audit the last frost stores before the Ancients road closes over the summit.",
              "frost_stores_counted",
              ["harrogath_reckoning_frost_stores"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "name_the_last_watchfires",
              "Name the Last Watchfires",
              "Use the same settled ascent to name one last watchfire over the summit road.",
              "last_watchfires_named",
              ["harrogath_reckoning_watchfires"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "provision_reckoning",
          title: "Provision Reckoning",
          description: "A drilled switchback guard and the stacked Ancients provisions turn the reckoning lane into a true supply account instead of a generic store count.",
          summary: "The switchback reserve and the ration-column culmination now settle together after the summit route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_switchback_guard", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "audit_the_provision_rings",
              "Audit the Provision Rings",
              "Carry the switchback guard and provision stacks into one last ring count over the Ancients ascent.",
              "provision_rings_audited",
              ["harrogath_reckoning_provision_rings"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "call_the_last_switchback_watch",
              "Call the Last Switchback Watch",
              "Use the same provision line to post one final switchback watch under the Ancients oath.",
              "last_switchback_watch_called",
              ["harrogath_reckoning_switchback_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
          ],
        },
        {
          id: "guard_reckoning",
          title: "Guard Reckoning",
          description: "The last column and the mustered Ancients guard turn the reckoning lane into a true summit oath instead of a generic watchfire.",
          summary: "The column reserve and the captain-led culmination now settle together after the last ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_last_column", "harrogath_culmination_ancients_guard"],
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "count_the_oath_rations",
              "Count the Oath Rations",
              "Carry the last column and the Ancients guard into one final ration count over the summit hold.",
              "oath_rations_counted",
              ["harrogath_reckoning_oath_rations"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "raise_the_last_summit_torches",
              "Raise the Last Summit Torches",
              "Use the same guard line to raise the last summit torches before the Ruin Crown push.",
              "last_summit_torches_raised",
              ["harrogath_reckoning_summit_torches"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.reckoningOpportunityDefinitions = RECKONING_OPPORTUNITY_DEFINITIONS;
})();
