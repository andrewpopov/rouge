(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const opportunityChoice = helpers.buildOpportunityChoiceFactory("Route Opportunity");

  const CROSSROAD_OPPORTUNITY_DEFINITIONS: Record<number, CrossroadOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_crossroads_opportunity",
      title: "Sunwell Crossroads",
      zoneTitle: "Sunwell Crossroads",
      description: "Once the reliquary aftermath and the Sunwell blessing both settle, a final desert staging junction opens.",
      summary: "The quest and shrine lanes now merge into a later desert crossroads.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineId: "sunwell_shrine",
      variants: [
        {
          id: "sunwell_junction",
          title: "Sunwell Junction",
          description: "The converged desert route can always become either safer waystations or a cleaner guide line.",
          summary: "Every act now keeps a fallback crossroad payoff after both routes resolve.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "brace_the_waystations",
              "Brace the Waystations",
              "Turn the joined desert route into harder waystations against attrition.",
              "waystations_braced",
              ["sunwell_crossroads_waystations"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "refill_potions", value: 1 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "hire_the_sand_guides",
              "Hire the Sand Guides",
              "Use the same junction to move guides forward and keep the crossing cleaner.",
              "sand_guides_hired",
              ["sunwell_crossroads_sand_guides"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "welltrain_relay",
          title: "Welltrain Relay",
          description: "The welltrain blessing and relay aftermath turn the desert junction into a live water-and-beacon network.",
          summary: "A welltrain-backed relay path opens a more specific caravan payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          requiresFlagIds: ["sunwell_welltrain"],
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "sanctify_the_way_cisterns",
              "Sanctify the Way Cisterns",
              "Push the blessing into the junction cisterns and keep the desert line healthier.",
              "way_cisterns_sanctified",
              ["sunwell_crossroads_way_cisterns"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "stage_the_well_caravans",
              "Stage the Well Caravans",
              "Use the same water line to keep the caravan junction steadier under pressure.",
              "well_caravans_staged",
              ["sunwell_crossroads_well_caravans"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "desert_guard_crossing",
          title: "Spearwall Crossing",
          description: "With a Sepulcher Spearwall under contract, the welltrain relay becomes a true spear-screen desert crossing.",
          summary: "A contracted spearwall turns the crossroads lane into a more specific escort column.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          requiresFlagIds: ["sunwell_welltrain"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "plant_the_spearwall_pylons",
              "Plant the Spearwall Pylons",
              "Let the guard fix the crossing into a disciplined spear screen around the wells.",
              "spearwall_pylons_planted",
              ["sunwell_crossroads_spearwall_pylons"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "march_the_contract_guard",
              "March the Contract Guard",
              "Put the contracted guard at the front of the crossing and keep the whole line dangerous.",
              "contract_guard_marched",
              ["sunwell_crossroads_contract_guard"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_crossroads_opportunity",
      title: "Idol Reach Crossroads",
      zoneTitle: "Idol Reach Crossroads",
      description: "Once the dockside aftermath and jade blessing both settle, a final harbor junction opens off the main route.",
      summary: "The quest and shrine lanes now converge into a later dockside crossroads.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineId: "jade_shrine",
      variants: [
        {
          id: "harbor_exchange",
          title: "Harbor Exchange",
          description: "The converged dock route can always become either deeper stores or a cleaner crew bargain.",
          summary: "A fallback harbor crossroads now sits behind both non-combat lanes.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "open_the_river_stores",
              "Open the River Stores",
              "Turn the joined harbor route into a steadier set of river stores.",
              "river_stores_opened",
              ["kurast_crossroads_river_stores"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "pay_the_wharf_keepers",
              "Pay the Wharf Keepers",
              "Use the same junction to keep the wharf crews moving with fewer delays.",
              "wharf_keepers_paid",
              ["kurast_crossroads_wharf_keepers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "trade_wind_customs",
          title: "Trade-Wind Customs",
          description: "The trade-wind blessing and contraband aftermath turn the harbor junction into a richer customs line.",
          summary: "A trade-wind-backed smuggler route opens a more specific dockside payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["pay_the_port_tax", "stash_the_bales"],
          requiresFlagIds: ["jade_shrine_trade_winds"],
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "license_the_trade_markers",
              "License the Trade Markers",
              "Spend the blessing on markers and keep the hidden harbor line profitable.",
              "trade_markers_licensed",
              ["kurast_crossroads_trade_markers"],
              [{ kind: "gold_bonus", value: 14 }, { kind: "hero_max_energy", value: 1 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "float_the_tariff_caches",
              "Float the Tariff Caches",
              "Use the same junction to hide tariff caches in the waterline and steady supplies.",
              "tariff_caches_floated",
              ["kurast_crossroads_tariff_caches"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "shadow_harbor_lane",
          title: "Shadow Harbor Lane",
          description: "With a Idol Reach specialist under contract, the trade-wind customs line becomes a true shadow harbor lane.",
          summary: "A contracted harbor specialist makes the crossroads lane more specific than the customs fallback.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["pay_the_port_tax", "stash_the_bales"],
          requiresFlagIds: ["jade_shrine_trade_winds"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "dispatch_the_shadow_pilots",
              "Dispatch the Shadow Pilots",
              "Let the contracted specialist turn the junction into a covert pilot lane through the harbor.",
              "shadow_pilots_dispatched",
              ["kurast_crossroads_shadow_pilots"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "screen_the_night_berths",
              "Screen the Night Berths",
              "Use the same contract to keep hidden berths defended and the convoy line steadier.",
              "night_berths_screened",
              ["kurast_crossroads_night_berths"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_crossroads_opportunity",
      title: "Hellforge Crossroads",
      zoneTitle: "Hellforge Crossroads",
      description: "Once the forge aftermath and altar blessing both settle, one more infernal redeployment lane opens before the Cinder Tyrant.",
      summary: "The quest and shrine lanes now converge into a later infernal crossroads.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineId: "infernal_altar",
      variants: [
        {
          id: "forge_redeployment",
          title: "Forge Redeployment",
          description: "The converged infernal route can still become either a banked reserve or a hotter smith line.",
          summary: "A fallback infernal crossroads now sits behind both non-combat branches.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "bank_the_black_iron",
              "Bank the Black Iron",
              "Turn the junction into a steadier reserve of black iron before the sanctuary climb.",
              "black_iron_banked",
              ["hellforge_crossroads_black_iron"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "arm_the_route_smiths",
              "Arm the Route Smiths",
              "Use the same junction to keep smiths on the line and the route more dangerous.",
              "route_smiths_armed",
              ["hellforge_crossroads_route_smiths"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "cinder_rampart",
          title: "Cinder Rampart",
          description: "The cinder-screen blessing and tempered-plating aftermath turn the junction into a live ash rampart.",
          summary: "A cinder-backed forge route opens a more specific infernal barrier payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_cinder_screen"],
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "raise_the_cinder_rampart",
              "Raise the Cinder Rampart",
              "Commit the ash blessing to the road itself and make the infernal line harder to break.",
              "cinder_rampart_raised",
              ["hellforge_crossroads_cinder_rampart"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "quench_the_screen_posts",
              "Quench the Screen Posts",
              "Use the same screen to keep the line cooler and the reserve steadier between fights.",
              "screen_posts_quenched",
              ["hellforge_crossroads_screen_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "hellward_redeployment",
          title: "Hellward Redeployment",
          description: "With an infernal specialist under contract, the cinder-screen rampart becomes a disciplined hellward turn.",
          summary: "A contracted infernal specialist makes the crossroads lane more specific than the generic cinder rampart.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_cinder_screen"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "drill_the_hellward_turn",
              "Drill the Hellward Turn",
              "Let the contracted specialist turn the junction into a drilled hellward pivot.",
              "hellward_turn_drilled",
              ["hellforge_crossroads_hellward_turn"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "pace_the_phalanx_reliefs",
              "Pace the Phalanx Reliefs",
              "Use the same contract to keep relief carriers moving in step behind the screen.",
              "phalanx_reliefs_paced",
              ["hellforge_crossroads_phalanx_reliefs"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_crossroads_opportunity",
      title: "Frosthaven Crossroads",
      zoneTitle: "Frosthaven Crossroads",
      description: "Once the rescue aftermath and summit shrine both settle, one more war-camp junction opens before the final ascent.",
      summary: "The quest and shrine lanes now converge into a later summit crossroads.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineId: "ancients_way_shrine",
      variants: [
        {
          id: "summit_muster",
          title: "Summit Muster",
          description: "The converged summit route can always become either a stocked climb line or a steadier frost guide corps.",
          summary: "A fallback summit crossroads now sits behind both non-combat branches.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "stock_the_climb_store",
              "Stock the Climb Store",
              "Turn the converged route into a better-stocked climb store for the last push.",
              "climb_store_stocked",
              ["harrogath_crossroads_climb_store"],
              [{ kind: "refill_potions", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "muster_the_frost_guides",
              "Muster the Frost Guides",
              "Use the same junction to keep guides posted through the coldest stretch.",
              "frost_guides_mustered",
              ["harrogath_crossroads_frost_guides"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "watchfire_column",
          title: "Watchfire Column",
          description: "The watchfire blessing and ration aftermath turn the summit junction into a supplied climb column.",
          summary: "A watchfire-backed ration path opens a more specific summit supply payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["ancients_way_watchfires"],
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "light_the_watchfire_column",
              "Light the Watchfire Column",
              "Commit the blessing to the climb posts and keep the summit line supplied.",
              "watchfire_column_lit",
              ["harrogath_crossroads_watchfire_column"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "brace_the_summit_sleds",
              "Brace the Summit Sleds",
              "Use the same stores to keep sled lines braced for the last stretch.",
              "summit_sleds_braced",
              ["harrogath_crossroads_summit_sleds"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "captains_watchfire_column",
          title: "Captain's Watchfire Column",
          description: "With the Frosthaven Captain under contract, the watchfire column becomes a drilled summit reserve line.",
          summary: "A contracted captain makes the crossroads lane more specific than the generic watchfire column.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["ancients_way_watchfires"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "drill_the_captains_switchbacks",
              "Drill the Captain's Switchbacks",
              "Let the captain turn the watchfire line into a drilled switchback guard.",
              "captains_switchbacks_drilled",
              ["harrogath_crossroads_switchbacks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "hold_the_summit_reserve",
              "Hold the Summit Reserve",
              "Use the same command to keep a summit reserve ready behind the climb.",
              "summit_reserve_held",
              ["harrogath_crossroads_summit_reserve"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.crossroadOpportunityDefinitions = CROSSROAD_OPPORTUNITY_DEFINITIONS;
})();
