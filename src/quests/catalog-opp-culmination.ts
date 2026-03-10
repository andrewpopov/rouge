(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const culminationChoice = (...args) => helpers.buildOpportunityChoice("Culmination Opportunity", ...args);

  const CULMINATION_OPPORTUNITY_DEFINITIONS: Record<number, CulminationOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_culmination_opportunity",
      title: "Rogue Culmination",
      zoneTitle: "Rogue Culmination",
      description: "Once the ridge relay settles, the Tristram route can be committed into one final posture before Andariel.",
      summary: "The act now has a post-relay culmination that pays off the original quest line and the late relay together.",
      grants: { gold: 8, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresRelayOpportunityId: "rogue_relay_opportunity",
      variants: [
        {
          id: "andariel_march",
          title: "Andariel March",
          description: "The resolved ridge route can always become either a stocked gate line or a steadier final watch before the monastery push.",
          summary: "A fallback culmination appears once the ridge relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "stage_the_gate_supplies",
              "Stage the Gate Supplies",
              "Push the last supplies into the monastery gates and stop the final march from going lean.",
              "gate_supplies_staged",
              ["rogue_culmination_gate_supplies"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "set_the_final_watch",
              "Set the Final Watch",
              "Use the same route to post one more watch over the last ridge before Andariel.",
              "final_watch_set",
              ["rogue_culmination_final_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "scout_report_endgame",
          title: "Scout Report Endgame",
          description: "A recovered scout report and hidden relay chain turn the final ridge into a deliberate witch-hunt approach.",
          summary: "The scout-report branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["take_scout_report"],
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_relay_hidden_chain"],
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "signal_the_cathedral_approach",
              "Signal the Cathedral Approach",
              "Carry the hidden chain into the cathedral road and make the final angle easier to read.",
              "cathedral_approach_signaled",
              ["rogue_culmination_cathedral_approach"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "prepare_the_witch_hunt",
              "Prepare the Witch Hunt",
              "Use the same hidden route to stage the last hunt instead of spending it on static supplies.",
              "witch_hunt_prepared",
              ["rogue_culmination_witch_hunt"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "rogue_scout_last_wayfinders",
          title: "Rogue Scout Last Wayfinders",
          description: "With a Rogue Scout under contract, the hidden relay becomes a true last-wayfinder net instead of a generic cathedral approach.",
          summary: "A contracted scout makes the culmination lane more specific than the generic scout-report payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["take_scout_report"],
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_relay_hidden_chain"],
          requiresMercenaryIds: ["rogue_scout"],
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "commission_the_last_wayfinders",
              "Commission the Last Wayfinders",
              "Let the contracted scout turn the hidden chain into the last guides on the Andariel road.",
              "last_wayfinders_commissioned",
              ["rogue_culmination_last_wayfinders"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "cut_the_andariel_flanks",
              "Cut the Andariel Flanks",
              "Use the same contract to mark the last flanks before the monastery push.",
              "andariel_flanks_cut",
              ["rogue_culmination_andariel_flanks"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_culmination_opportunity",
      title: "Sunwell Culmination",
      zoneTitle: "Sunwell Culmination",
      description: "Once the desert relay settles, the reliquary route can be committed into one final crossing plan before Duriel.",
      summary: "The act now has a post-relay culmination that revisits the reliquary route and the last relay together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresRelayOpportunityId: "sunwell_relay_opportunity",
      variants: [
        {
          id: "tomb_crossing",
          title: "Tomb Crossing",
          description: "The settled desert route can always become either a stocked tomb crossing or a steadier marked final march.",
          summary: "A fallback culmination appears once the desert relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "pack_the_tomb_casks",
              "Pack the Tomb Casks",
              "Turn the last desert line into a stocked cask run before the tomb descent.",
              "tomb_casks_packed",
              ["sunwell_culmination_tomb_casks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "mark_the_final_crossing",
              "Mark the Final Crossing",
              "Carry the relay into the last marked crossing and stop the desert line from wasting motion.",
              "final_crossing_marked",
              ["sunwell_culmination_final_crossing"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "caravan_lance_endgame",
          title: "Caravan Lance Endgame",
          description: "An armed caravan and lance dispatch turn the final crossing into a drilled tomb screen instead of a generic marked route.",
          summary: "The caravan-martial quest branch now pays off again after the relay instead of stopping at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["arm_the_caravan"],
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_relay_lance_dispatch"],
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "ready_the_tomb_screen",
              "Ready the Tomb Screen",
              "Carry the lance dispatch into a tighter screen over the last tomb approach.",
              "tomb_screen_readied",
              ["sunwell_culmination_tomb_screen"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "stock_the_reliquary_sleds",
              "Stock the Reliquary Sleds",
              "Use the same hard route to keep the last sleds loaded for the descent.",
              "reliquary_sleds_stocked",
              ["sunwell_culmination_reliquary_sleds"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "desert_guard_final_spearline",
          title: "Desert Guard Final Spearline",
          description: "With a Desert Guard under contract, the lance dispatch becomes a true final spearline instead of a generic tomb screen.",
          summary: "A contracted guard makes the culmination lane more specific than the generic caravan-lance payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["arm_the_caravan"],
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_relay_lance_dispatch"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "anchor_the_final_spearline",
              "Anchor the Final Spearline",
              "Let the contracted guard carry the lance dispatch into a true spearline before the tomb gate.",
              "final_spearline_anchored",
              ["sunwell_culmination_final_spearline"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "raise_the_tomb_wardens",
              "Raise the Tomb Wardens",
              "Use the same contract to hold wardens over the last desert crossing.",
              "tomb_wardens_raised",
              ["sunwell_culmination_tomb_wardens"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_culmination_opportunity",
      title: "Harbor Culmination",
      zoneTitle: "Harbor Culmination",
      description: "Once the harbor relay settles, the smugglers' wake can be committed into one final Durance approach.",
      summary: "The act now has a post-relay culmination that pays off the original dockside branch and the last relay together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresRelayOpportunityId: "kurast_relay_opportunity",
      variants: [
        {
          id: "durance_approach",
          title: "Durance Approach",
          description: "The resolved harbor route can always become either a stocked river push or a steadier dock signal line.",
          summary: "A fallback culmination appears once the harbor relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "float_the_durance_stores",
              "Float the Durance Stores",
              "Turn the last hidden harbor line into a stocked river push before the Durance.",
              "durance_stores_floated",
              ["kurast_culmination_durance_stores"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "light_the_dock_signals",
              "Light the Dock Signals",
              "Carry the relay into the last dock marks and keep the hidden harbor legible.",
              "dock_signals_lit",
              ["kurast_culmination_dock_signals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "idol_wake_endgame",
          title: "Idol Wake Endgame",
          description: "A purified idol and pilot chain turn the last harbor route into a cleaner Durance channel instead of a generic river push.",
          summary: "The sanctified quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["purify_the_idol"],
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["kurast_relay_pilot_chain"],
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "clear_the_durance_channel",
              "Clear the Durance Channel",
              "Carry the pilot chain into the river mouth and make the Durance approach cleaner.",
              "durance_channel_cleared",
              ["kurast_culmination_durance_channel"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "stash_the_river_oils",
              "Stash the River Oils",
              "Use the same sanctified route to keep the last oils and marks hidden before the Durance.",
              "river_oils_stashed",
              ["kurast_culmination_river_oils"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "kurast_specialist_endgame",
          title: "Kurast Specialist Endgame",
          description: "With a Kurast Shadow or Iron Wolf under contract, the pilot chain becomes a true specialist harbor command instead of a generic Durance channel.",
          summary: "A contracted Kurast specialist makes the culmination lane more specific than the generic sanctified payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["purify_the_idol"],
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["kurast_relay_pilot_chain"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "charter_the_spellblade_wards",
              "Charter the Spellblade Wards",
              "Let the contracted specialist carry the sanctified chain into spellblade ward posts over the harbor.",
              "spellblade_wards_chartered",
              ["kurast_culmination_spellblade_wards"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "seal_the_shadow_ledgers",
              "Seal the Shadow Ledgers",
              "Use the same contract to keep the last ledgers and harbor marks in shadow.",
              "shadow_ledgers_sealed",
              ["kurast_culmination_shadow_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_culmination_opportunity",
      title: "Hellforge Culmination",
      zoneTitle: "Hellforge Culmination",
      description: "Once the infernal relay settles, the Hellforge claim can be committed into one final breach plan before Diablo.",
      summary: "The act now has a post-relay culmination that pays off the original forge branch and the late relay together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresRelayOpportunityId: "hellforge_relay_opportunity",
      variants: [
        {
          id: "sanctuary_breach",
          title: "Sanctuary Breach",
          description: "The resolved infernal route can always become either a stocked breach line or a steadier marked approach into the sanctuary.",
          summary: "A fallback culmination appears once the infernal relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "stage_the_sanctuary_stores",
              "Stage the Sanctuary Stores",
              "Turn the last infernal route into a stocked breach line before the sanctuary push.",
              "sanctuary_stores_staged",
              ["hellforge_culmination_sanctuary_stores"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "mark_the_breach_paths",
              "Mark the Breach Paths",
              "Carry the relay into the last breach marks and keep the infernal line moving cleanly.",
              "breach_paths_marked",
              ["hellforge_culmination_breach_paths"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forged_turn_endgame",
          title: "Forged Turn Endgame",
          description: "Tempered armor and a turning relay turn the last infernal route into a true breach chain instead of a generic marked approach.",
          summary: "The tempered-forge quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["temper_the_armor"],
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["hellforge_relay_turning_line"],
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "raise_the_breach_rivets",
              "Raise the Breach Rivets",
              "Carry the turning relay into a harder breach chain before the sanctuary line.",
              "breach_rivets_raised",
              ["hellforge_culmination_breach_rivets"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "temper_the_sanctuary_chain",
              "Temper the Sanctuary Chain",
              "Use the same forged turn to keep the last infernal chain ready for the breach.",
              "sanctuary_chain_tempered",
              ["hellforge_culmination_sanctuary_chain"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "act_four_specialist_endgame",
          title: "Act IV Specialist Endgame",
          description: "With a Templar Vanguard or Pandemonium Scout under contract, the turning relay becomes a true breach command instead of a generic forged turn.",
          summary: "A contracted Act IV specialist makes the culmination lane more specific than the generic forge payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["temper_the_armor"],
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["hellforge_relay_turning_line"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "raise_the_templar_breachscreen",
              "Raise the Templar Breachscreen",
              "Let the contracted specialist carry the forged turn into a true breachscreen before Diablo.",
              "templar_breachscreen_raised",
              ["hellforge_culmination_breachscreen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "mark_the_pandemonium_cuts",
              "Mark the Pandemonium Cuts",
              "Use the same contract to open and hold the final cuts through the breach line.",
              "pandemonium_cuts_marked",
              ["hellforge_culmination_pandemonium_cuts"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_culmination_opportunity",
      title: "Summit Culmination",
      zoneTitle: "Summit Culmination",
      description: "Once the summit relay settles, the Harrogath rescue can be committed into one final ascent plan before the Ancients.",
      summary: "The act now has a post-relay culmination that pays off the original summit branch and the last relay together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresRelayOpportunityId: "harrogath_relay_opportunity",
      variants: [
        {
          id: "ancients_finale",
          title: "Ancients Finale",
          description: "The resolved summit route can always become either a stocked ascent line or a steadier fire-marked final climb.",
          summary: "A fallback culmination appears once the summit relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "pack_the_ancients_caches",
              "Pack the Ancients Caches",
              "Turn the last summit route into a stocked ascent cache before the final climb.",
              "ancients_caches_packed",
              ["harrogath_culmination_ancients_caches"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "light_the_last_fires",
              "Light the Last Fires",
              "Carry the relay into the final watchfires and keep the ascent from going cold.",
              "last_fires_lit",
              ["harrogath_culmination_last_fires"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "ration_column_endgame",
          title: "Ration Column Endgame",
          description: "Secured rations and a last-column relay turn the final summit route into a true Ancients approach instead of a generic ascent cache.",
          summary: "The ration quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["secure_the_rations"],
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["harrogath_relay_last_column"],
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "stack_the_ancients_provisions",
              "Stack the Ancients Provisions",
              "Carry the last column into true ascent provisions before the final oath.",
              "ancients_provisions_stacked",
              ["harrogath_culmination_ancients_provisions"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "marshal_the_frost_bearers",
              "Marshal the Frost Bearers",
              "Use the same last column to keep frost bearers moving on the final climb.",
              "frost_bearers_marshaled",
              ["harrogath_culmination_frost_bearers"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "harrogath_captain_endgame",
          title: "Harrogath Captain Endgame",
          description: "With the Harrogath Captain under contract, the last-column relay becomes a true Ancients guard instead of a generic ration column.",
          summary: "A contracted captain makes the culmination lane more specific than the generic summit payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["secure_the_rations"],
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["harrogath_relay_last_column"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "muster_the_ancients_guard",
              "Muster the Ancients Guard",
              "Let the captain carry the last column into a true guard on the Ancients ascent.",
              "ancients_guard_mustered",
              ["harrogath_culmination_ancients_guard"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "raise_the_last_banners",
              "Raise the Last Banners",
              "Use the same command line to raise the final banners over the summit road.",
              "last_banners_raised",
              ["harrogath_culmination_last_banners"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.culminationOpportunityDefinitions = CULMINATION_OPPORTUNITY_DEFINITIONS;
})();
