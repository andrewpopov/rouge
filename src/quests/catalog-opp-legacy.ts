(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const legacyChoice = helpers.buildOpportunityChoiceFactory("Legacy Opportunity");

  const LEGACY_OPPORTUNITY_DEFINITIONS: Record<number, LegacyOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_legacy_opportunity",
      title: "Sunwell Legacy",
      zoneTitle: "Sunwell Legacy",
      description: "After the final tomb crossing resolves, the reliquary route can still be tuned into one lasting desert posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the tomb plan one more time.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "tomb_legacy",
          title: "Tomb Legacy",
          description: "The settled desert line can always become either a stocked tomb reserve or a cleaner marked withdrawal over the sands.",
          summary: "A fallback legacy lane appears once the sunwell culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "stack_the_tomb_reserves",
              "Stack the Tomb Reserves",
              "Turn the last crossing into a reserve stack that keeps the reliquary road supplied.",
              "tomb_reserves_stacked",
              ["sunwell_legacy_tomb_reserves"],
              [{ kind: "support_build" }, { kind: "refill_potions", value: 1 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "score_the_sand_markers",
              "Score the Sand Markers",
              "Carry the same route into one last line of desert markers before the tomb descent closes.",
              "sand_markers_scored",
              ["sunwell_legacy_sand_markers"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "tomb_screen_legacy",
          title: "Tomb Screen Legacy",
          description: "A readied tomb screen turns the legacy lane into a steadier ward line instead of a generic sand-marker plan.",
          summary: "The caravan-lance culmination pays off one more time after the desert route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_culmination_tomb_screen"],
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "brace_the_tomb_watch",
              "Brace the Tomb Watch",
              "Carry the screened approach into a last watch over the reliquary gate.",
              "tomb_watch_braced",
              ["sunwell_legacy_tomb_watch"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "load_the_last_sledgers",
              "Load the Last Sledgers",
              "Use the same screened line to keep the final sledgers moving into the tomb.",
              "last_sledgers_loaded",
              ["sunwell_legacy_last_sledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "final_spearline_legacy",
          title: "Final Spearline Legacy",
          description: "An anchored spearline turns the legacy lane into a true last desert hold instead of a generic tomb watch.",
          summary: "The contracted spearline culmination pays off one more time after the tomb route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_culmination_final_spearline"],
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "anchor_the_last_spear_posts",
              "Anchor the Last Spear Posts",
              "Carry the final spearline into one last anchored post over the reliquary crossing.",
              "last_spear_posts_anchored",
              ["sunwell_legacy_last_spear_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "raise_the_warden_canopy",
              "Raise the Warden Canopy",
              "Use the same spearline to raise the last desert canopy over the wardens.",
              "warden_canopy_raised",
              ["sunwell_legacy_warden_canopy"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_legacy_opportunity",
      title: "Harbor Legacy",
      zoneTitle: "Harbor Legacy",
      description: "After the final harbor approach resolves, the dockside wake can still be tuned into one lasting Kurast posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the harbor plan one more time.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "harbor_legacy",
          title: "Harbor Legacy",
          description: "The settled harbor line can always become either a stocked dock reserve or a cleaner final signal net.",
          summary: "A fallback legacy lane appears once the harbor culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "stack_the_harbor_reserve",
              "Stack the Harbor Reserve",
              "Turn the last harbor push into a reserve stack over the Durance approach.",
              "harbor_reserve_stacked",
              ["kurast_legacy_harbor_reserve"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "seal_the_last_signal_net",
              "Seal the Last Signal Net",
              "Use the same route to close out the last signal net across the Kurast docks.",
              "last_signal_net_sealed",
              ["kurast_legacy_signal_net"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "durance_channel_legacy",
          title: "Durance Channel Legacy",
          description: "A cleared Durance channel turns the legacy lane into a true river command instead of a generic dock reserve.",
          summary: "The sanctified harbor culmination pays off one more time after the last relay settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_culmination_durance_channel"],
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "sound_the_river_command",
              "Sound the River Command",
              "Carry the cleared channel into one last river command over the Durance mouth.",
              "river_command_sounded",
              ["kurast_legacy_river_command"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "hide_the_last_oil_runs",
              "Hide the Last Oil Runs",
              "Use the same cleaned channel to bury the last oil runs before the Durance closes.",
              "last_oil_runs_hidden",
              ["kurast_legacy_last_oil_runs"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spellblade_legacy",
          title: "Spellblade Legacy",
          description: "Chartered spellblade wards turn the legacy lane into a true harbor command instead of a generic river signal.",
          summary: "The specialist harbor culmination pays off one more time after the final channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_culmination_spellblade_wards"],
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "charter_the_last_spellward",
              "Charter the Last Spellward",
              "Carry the spellblade wards into one last command over the harbor mouth.",
              "last_spellward_chartered",
              ["kurast_legacy_last_spellward"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "seal_the_harbor_ledgers",
              "Seal the Harbor Ledgers",
              "Use the same specialist line to close the last ledgers and marks in shadow.",
              "harbor_ledgers_sealed",
              ["kurast_legacy_harbor_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_legacy_opportunity",
      title: "Hellforge Legacy",
      zoneTitle: "Hellforge Legacy",
      description: "After the final breach resolves, the forge claim can still be tuned into one lasting sanctuary posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the breach plan one more time.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "breach_legacy",
          title: "Breach Legacy",
          description: "The settled infernal line can always become either a stocked breach reserve or a cleaner sanctuary route mark.",
          summary: "A fallback legacy lane appears once the hellforge culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "stack_the_breach_reserves",
              "Stack the Breach Reserves",
              "Turn the last breach push into a reserve wall before the sanctuary seals.",
              "breach_reserves_stacked",
              ["hellforge_legacy_breach_reserves"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "score_the_sanctuary_marks",
              "Score the Sanctuary Marks",
              "Use the same breach line to mark the last safe cuts into the sanctuary.",
              "sanctuary_marks_scored",
              ["hellforge_legacy_sanctuary_marks"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "forged_chain_legacy",
          title: "Forged Chain Legacy",
          description: "Raised breach rivets turn the legacy lane into a true infernal chain instead of a generic sanctuary mark.",
          summary: "The forged-turn culmination pays off one more time after the breach route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_culmination_breach_rivets"],
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "temper_the_last_chain_posts",
              "Temper the Last Chain Posts",
              "Carry the raised rivets into one last chain post before the sanctuary breach.",
              "last_chain_posts_tempered",
              ["hellforge_legacy_last_chain_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "lock_the_sanctuary_rings",
              "Lock the Sanctuary Rings",
              "Use the same forged line to lock the last infernal rings around the breach.",
              "sanctuary_rings_locked",
              ["hellforge_legacy_sanctuary_rings"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "breachscreen_legacy",
          title: "Breachscreen Legacy",
          description: "A raised breachscreen turns the legacy lane into a true closing command instead of a generic forged chain.",
          summary: "The Act IV specialist culmination pays off one more time after the breach route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_culmination_breachscreen"],
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "raise_the_last_breachscreen",
              "Raise the Last Breachscreen",
              "Carry the breachscreen into one last shielded command over the sanctuary cut.",
              "last_breachscreen_raised",
              ["hellforge_legacy_last_breachscreen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "open_the_final_cutmarks",
              "Open the Final Cutmarks",
              "Use the same command to keep the last cutmarks open across the infernal line.",
              "final_cutmarks_opened",
              ["hellforge_legacy_final_cutmarks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_legacy_opportunity",
      title: "Summit Legacy",
      zoneTitle: "Summit Legacy",
      description: "After the final ascent resolves, the Harrogath rescue can still be tuned into one lasting summit posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the summit plan one more time.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_legacy",
          title: "Summit Legacy",
          description: "The settled summit line can always become either a stocked ascent reserve or a cleaner last-fire route mark.",
          summary: "A fallback legacy lane appears once the summit culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "stack_the_summit_reserves",
              "Stack the Summit Reserves",
              "Turn the last ascent route into a reserve stack before the Ancients oath closes.",
              "summit_reserves_stacked",
              ["harrogath_legacy_summit_reserves"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "mark_the_last_switchbacks",
              "Mark the Last Switchbacks",
              "Use the same summit line to mark the last switchbacks into the Ancients road.",
              "last_switchbacks_marked",
              ["harrogath_legacy_last_switchbacks"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "provisions_legacy",
          title: "Ancients Provisions Legacy",
          description: "Stacked Ancients provisions turn the legacy lane into a true summit reserve instead of a generic switchback mark.",
          summary: "The ration-column culmination pays off one more time after the last ascent settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_culmination_ancients_provisions"],
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "lay_the_last_provision_rings",
              "Lay the Last Provision Rings",
              "Carry the stacked provisions into one last ring over the Ancients ascent.",
              "last_provision_rings_laid",
              ["harrogath_legacy_last_provision_rings"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "swing_the_final_bearer_loads",
              "Swing the Final Bearer Loads",
              "Use the same summit load to keep the final bearer chain moving through the cold.",
              "final_bearer_loads_swung",
              ["harrogath_legacy_bearer_loads"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "ancients_guard_legacy",
          title: "Ancients Guard Legacy",
          description: "A mustered Ancients guard turns the legacy lane into a true closing command instead of a generic provision ring.",
          summary: "The captain-led culmination pays off one more time after the summit route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_culmination_ancients_guard"],
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "muster_the_last_guard_ranks",
              "Muster the Last Guard Ranks",
              "Carry the Ancients guard into one last ranked hold over the summit road.",
              "last_guard_ranks_mustered",
              ["harrogath_legacy_last_guard_ranks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "raise_the_oath_banners",
              "Raise the Oath Banners",
              "Use the same command to raise the last oath banners before the Ancients stand.",
              "oath_banners_raised",
              ["harrogath_legacy_oath_banners"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.legacyOpportunityDefinitions = LEGACY_OPPORTUNITY_DEFINITIONS;
})();
