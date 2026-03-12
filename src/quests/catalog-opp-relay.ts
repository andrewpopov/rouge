(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const relayChoice = helpers.buildOpportunityChoiceFactory("Relay Opportunity");

  const RELAY_OPPORTUNITY_DEFINITIONS: Record<number, RelayOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_relay_opportunity",
      title: "Sunwell Relay",
      zoneTitle: "Sunwell Relay",
      description: "Once the desert reserve settles, one last relay column can push that work through the Duriel crossing.",
      summary: "The act now has a post-reserve desert relay beyond the current caravan reserve pass.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresReserveOpportunityId: "sunwell_reserve_opportunity",
      variants: [
        {
          id: "well_relay",
          title: "Well Relay",
          description: "The reserve can always become either a water courier lane or a marked dune relay before the tomb descent.",
          summary: "A fallback desert relay appears once the reserve caravan resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "stage_the_water_couriers",
              "Stage the Water Couriers",
              "Use the reserve stores to keep water couriers moving across the last hot stretch.",
              "water_couriers_staged",
              ["sunwell_relay_water_couriers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "mark_the_dune_relays",
              "Mark the Dune Relays",
              "Stake the reserve route deeper into the dunes so the crossing stops wasting motion.",
              "dune_relays_marked",
              ["sunwell_relay_dune_relays"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "pylon_relay",
          title: "Pylon Relay",
          description: "A braced pylon reserve turns the relay into a disciplined desert chain instead of a loose water line.",
          summary: "The pylon reserve now feeds a more specific downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_pylon_screen"],
          choices: [
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "extend_the_pylon_chain",
              "Extend the Pylon Chain",
              "Carry the pylon reserve forward and keep the crossing tighter behind the shield line.",
              "pylon_chain_extended",
              ["sunwell_relay_pylon_chain"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }]
            ),
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "shelter_the_well_scrips",
              "Shelter the Well Scrips",
              "Use the same braced route to keep the desert scrips and water marks intact.",
              "well_scrips_sheltered",
              ["sunwell_relay_well_scrips"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "lance_dispatch",
          title: "Lance Dispatch",
          description: "Marched reserve lances turn the relay into a forward dispatch instead of a passive dune marker line.",
          summary: "The reserve lances open a more aggressive downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_lances"],
          choices: [
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "ride_the_lance_dispatch",
              "Ride the Lance Dispatch",
              "Push the reserve lances through the relay and keep the desert route dangerous.",
              "lance_dispatch_ridden",
              ["sunwell_relay_lance_dispatch"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            relayChoice(
              "sunwell_relay_opportunity",
              "lost_reliquary",
              "pack_the_desert_relays",
              "Pack the Desert Relays",
              "Use the same forward screen to keep every reserve relay packed and ready for the tomb line.",
              "desert_relays_packed",
              ["sunwell_relay_desert_packs"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_relay_opportunity",
      title: "Harbor Relay",
      zoneTitle: "Harbor Relay",
      description: "Once the hidden harbor reserve settles, one last relay lane can carry that work into the Durance approach.",
      summary: "The act now has a post-reserve harbor relay beyond the current reserve payoff.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresReserveOpportunityId: "kurast_reserve_opportunity",
      variants: [
        {
          id: "harbor_relay",
          title: "Harbor Relay",
          description: "The reserve can always become either a river courier line or a signaled night-route screen through the docks.",
          summary: "A fallback harbor relay appears once the reserve line resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "float_the_river_couriers",
              "Float the River Couriers",
              "Turn the reserve into a river courier lane and keep the hidden harbor synchronized.",
              "river_couriers_floated",
              ["kurast_relay_river_couriers"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "signal_the_night_route",
              "Signal the Night Route",
              "Keep the reserve night route marked so the harbor stops losing time to confusion.",
              "night_route_signaled",
              ["kurast_relay_night_route"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "pilot_chain",
          title: "Pilot Chain",
          description: "A floated pilot cache turns the relay into a covert harbor chain instead of a plain river courier route.",
          summary: "The shadow-pilot reserve now feeds a more specific downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_pilot_caches"],
          choices: [
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "extend_the_pilot_chain",
              "Extend the Pilot Chain",
              "Carry the pilot caches forward and keep the covert harbor moving one step ahead.",
              "pilot_chain_extended",
              ["kurast_relay_pilot_chain"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "hide_the_harbor_ledgers",
              "Hide the Harbor Ledgers",
              "Use the same covert chain to keep the harbor tallies and marks out of hostile hands.",
              "harbor_ledgers_hidden",
              ["kurast_relay_harbor_ledgers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "berth_relay",
          title: "Berth Relay",
          description: "Screened reserve berths turn the relay into a defended harbor rotation instead of a loose night signal line.",
          summary: "The screened berth reserve opens a harder downstream relay payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_berths"],
          choices: [
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "screen_the_berth_runners",
              "Screen the Berth Runners",
              "Protect the relay runners moving between the screened reserve berths and the docks.",
              "berth_runners_screened",
              ["kurast_relay_berth_runners"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            relayChoice(
              "kurast_relay_opportunity",
              "smugglers_wake",
              "stash_the_dock_medicinals",
              "Stash the Dock Medicinals",
              "Use the same defended lane to tuck medicinals into the harbor before the durance push.",
              "dock_medicinals_stashed",
              ["kurast_relay_dock_medicinals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_relay_opportunity",
      title: "Hellforge Relay",
      zoneTitle: "Hellforge Relay",
      description: "Once the infernal reserve settles, one last relay line can carry that work into the sanctuary breach.",
      summary: "The act now has a post-reserve infernal relay beyond the current forge reserve pass.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresReserveOpportunityId: "hellforge_reserve_opportunity",
      variants: [
        {
          id: "forge_relay",
          title: "Forge Relay",
          description: "The reserve can always become either a blackstore courier wall or a paced ash-relief line.",
          summary: "A fallback infernal relay appears once the reserve line resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "drive_the_blackstore_runners",
              "Drive the Blackstore Runners",
              "Turn the reserve into a blackstore runner chain before the sanctuary breach.",
              "blackstore_runners_driven",
              ["hellforge_relay_blackstore_runners"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "gold_bonus", value: 12 }]
            ),
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "pace_the_ash_couriers",
              "Pace the Ash Couriers",
              "Keep ash couriers stepping through the infernal line so the climb never stalls.",
              "ash_couriers_paced",
              ["hellforge_relay_ash_couriers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "turning_relay",
          title: "Turning Relay",
          description: "A drilled turning reserve makes the relay more specific than a simple blackstore runner wall.",
          summary: "The hellward turning line now feeds a tighter infernal relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_turning_line"],
          choices: [
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "extend_the_turning_line",
              "Extend the Turning Line",
              "Carry the drilled turn forward so the infernal line keeps pivoting cleanly.",
              "turning_line_extended",
              ["hellforge_relay_turning_line"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }]
            ),
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "temper_the_breach_supplies",
              "Temper the Breach Supplies",
              "Use the same drilled route to keep the breach supplies ready for the sanctuary push.",
              "breach_supplies_tempered",
              ["hellforge_relay_breach_supplies"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "relief_wall_relay",
          title: "Relief Wall Relay",
          description: "A locked relief wall turns the relay into a harder infernal barrier instead of a loose ash courier path.",
          summary: "The relief-wall reserve opens a more defensive downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_relief_wall"],
          choices: [
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "hold_the_relief_chain",
              "Hold the Relief Chain",
              "Use the relief wall to keep a chained reserve line standing through the breach.",
              "relief_chain_held",
              ["hellforge_relay_relief_chain"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            relayChoice(
              "hellforge_relay_opportunity",
              "hellforge_claim",
              "stage_the_cinder_runners",
              "Stage the Cinder Runners",
              "Keep cinder runners moving behind the relief wall and stop the line from falling silent.",
              "cinder_runners_staged",
              ["hellforge_relay_cinder_runners"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_relay_opportunity",
      title: "Summit Relay",
      zoneTitle: "Summit Relay",
      description: "Once the summit reserve settles, one last relay line can carry that work into the Ancients ascent.",
      summary: "The act now has a post-reserve summit relay beyond the current last reserve payoff.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresReserveOpportunityId: "harrogath_reserve_opportunity",
      variants: [
        {
          id: "summit_relay",
          title: "Summit Relay",
          description: "The reserve can always become either a climb courier chain or a stocked frost-post line for the last ascent.",
          summary: "A fallback summit relay appears once the reserve line resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "drive_the_climb_couriers",
              "Drive the Climb Couriers",
              "Turn the reserve into a climb courier chain before the Ancients gate.",
              "climb_couriers_driven",
              ["harrogath_relay_climb_couriers"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "stack_the_frost_posts",
              "Stack the Frost Posts",
              "Keep the frost posts stocked so the last line never freezes in place.",
              "frost_posts_stacked",
              ["harrogath_relay_frost_posts"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "switchback_relay",
          title: "Switchback Relay",
          description: "A drilled switchback guard turns the relay into a disciplined summit line instead of a loose climb courier chain.",
          summary: "The switchback reserve now feeds a more specific downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_switchback_guard"],
          choices: [
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "extend_the_switchback_line",
              "Extend the Switchback Line",
              "Carry the drilled guard farther up the mountain and keep the summit route disciplined.",
              "switchback_line_extended",
              ["harrogath_relay_switchback_line"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "stock_the_watchfire_turns",
              "Stock the Watchfire Turns",
              "Use the same drilled route to keep watchfire turns supplied for the final ascent.",
              "watchfire_turns_stocked",
              ["harrogath_relay_watchfire_turns"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "last_column_relay",
          title: "Last Column Relay",
          description: "A held last column turns the relay into a steadier summit march instead of a plain frost-post line.",
          summary: "The final reserve column opens a better supplied downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_last_column"],
          choices: [
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "marshal_the_last_column",
              "Marshal the Last Column",
              "Use the last reserve column to keep a true march line ready behind the ascent.",
              "last_column_marshaled",
              ["harrogath_relay_last_column"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            relayChoice(
              "harrogath_relay_opportunity",
              "harrogath_rescue",
              "swing_the_watchfire_loads",
              "Swing the Watchfire Loads",
              "Keep the last reserve loads swinging through the watchfires and into the final climb.",
              "watchfire_loads_swung",
              ["harrogath_relay_watchfire_loads"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.relayOpportunityDefinitions = RELAY_OPPORTUNITY_DEFINITIONS;
})();
