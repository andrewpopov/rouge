(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const reserveChoice = helpers.buildOpportunityChoiceFactory("Reserve Opportunity");

  const RESERVE_OPPORTUNITY_DEFINITIONS: Record<number, ReserveOpportunityDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_reserve_opportunity",
      title: "Sunwell Reserve",
      zoneTitle: "Sunwell Reserve",
      description: "Once the desert route, shrine lane, and crossroads are all resolved, a final reserve column opens off the main crossing.",
      summary: "The act now ends with a reserve caravan payoff after every side lane settles.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresOpportunityId: "sunwell_route_opportunity",
      requiresShrineOpportunityId: "sunwell_shrine_opportunity",
      requiresCrossroadOpportunityId: "sunwell_crossroads_opportunity",
      variants: [
        {
          id: "desert_rearguard",
          title: "Desert Rearguard",
          description: "The finished desert branches can still become a cask reserve or a steadier guide-post line.",
          summary: "A fallback reserve caravan appears once the act's side routes are done.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "stack_the_rearguard_casks",
              "Stack the Rearguard Casks",
              "Commit the reserve to casks and keep the desert line healthier between fights.",
              "rearguard_casks_stacked",
              ["sunwell_reserve_cask_line"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "set_the_guide_posts",
              "Set the Guide Posts",
              "Push reserve guides deeper into the desert and keep the caravan route cleaner.",
              "guide_posts_set",
              ["sunwell_reserve_guide_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "spearwall_reserve",
          title: "Spearwall Reserve",
          description: "The spearwall pylons let the reserve become a disciplined reserve cordon instead of a simple cask train.",
          summary: "The spearwall crossing opens a harder reserve screen behind the wells.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_crossroads_spearwall_pylons"],
          choices: [
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "brace_the_pylon_reserve",
              "Brace the Pylon Reserve",
              "Use the pylon line to harden the reserve camp behind the desert crossing.",
              "pylon_reserve_braced",
              ["sunwell_reserve_pylon_screen"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "drill_the_well_relievers",
              "Drill the Well Relievers",
              "Keep relievers moving behind the spearwall so the line never sags under attrition.",
              "well_relievers_drilled",
              ["sunwell_reserve_well_relievers"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "contract_guard_reserve",
          title: "Contract Guard Reserve",
          description: "A marched contract guard turns the reserve into a forward reserve column instead of a static rear camp.",
          summary: "The contract guard path opens a more aggressive reserve payoff at the end of the desert route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_crossroads_contract_guard"],
          choices: [
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "march_the_reserve_lances",
              "March the Reserve Lances",
              "Push reserve lances forward behind the contract guard and keep the whole route dangerous.",
              "reserve_lances_marched",
              ["sunwell_reserve_lances"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
            reserveChoice(
              "sunwell_reserve_opportunity",
              "lost_reliquary",
              "shelter_the_way_caches",
              "Shelter the Way Caches",
              "Use the same guard line to keep the reserve caches sheltered and harder to strip.",
              "way_caches_sheltered",
              ["sunwell_reserve_way_caches"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_reserve_opportunity",
      title: "Harbor Reserve",
      zoneTitle: "Harbor Reserve",
      description: "Once the harbor route, shrine lane, and crossroads are all settled, a final reserve line opens through the hidden docks.",
      summary: "The act now ends with a reserve harbor payoff after every non-combat lane resolves.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresOpportunityId: "kurast_route_opportunity",
      requiresShrineOpportunityId: "jade_shrine_opportunity",
      requiresCrossroadOpportunityId: "kurast_crossroads_opportunity",
      variants: [
        {
          id: "harbor_rearguard",
          title: "Harbor Rearguard",
          description: "The fully resolved harbor routes can still become a deeper river cache or a cleaner crew reserve.",
          summary: "A fallback reserve harbor appears once the act's other lanes are done.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "open_the_river_cache",
              "Open the River Cache",
              "Turn the reserve into a deeper river cache line and keep the harbor supplied.",
              "river_cache_opened",
              ["kurast_reserve_river_cache"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "pay_the_reserve_crews",
              "Pay the Reserve Crews",
              "Keep the reserve crews loyal and the hidden harbor moving with fewer delays.",
              "reserve_crews_paid",
              ["kurast_reserve_crews_paid"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "shadow_pilot_reserve",
          title: "Shadow Pilot Reserve",
          description: "The shadow pilots turn the reserve into a covert harbor relay instead of a plain crew cache.",
          summary: "The shadow-pilot crossroads route opens a covert reserve lane through the docks.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_crossroads_shadow_pilots"],
          choices: [
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "float_the_pilot_caches",
              "Float the Pilot Caches",
              "Hide reserve stores along the same pilot lane and keep the covert harbor alive.",
              "pilot_caches_floated",
              ["kurast_reserve_pilot_caches"],
              [{ kind: "gold_bonus", value: 14 }, { kind: "mercenary_attack", value: 1 }]
            ),
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "signal_the_night_convoys",
              "Signal the Night Convoys",
              "Use the same covert lane to keep reserve convoys moving after dark.",
              "night_convoys_signaled",
              ["kurast_reserve_night_convoys"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "night_berth_reserve",
          title: "Night Berth Reserve",
          description: "The screened night berths turn the reserve into a steadier harbor shelter instead of a loose cache line.",
          summary: "The night-berth crossroads route opens a better defended reserve payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_crossroads_night_berths"],
          choices: [
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "screen_the_reserve_berths",
              "Screen the Reserve Berths",
              "Keep the reserve berths screened and stop the harbor shelters from folding.",
              "reserve_berths_screened",
              ["kurast_reserve_berths"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            reserveChoice(
              "kurast_reserve_opportunity",
              "smugglers_wake",
              "stash_the_harbor_medicinals",
              "Stash the Harbor Medicinals",
              "Use the same screened line to keep reserve medicinals tucked into the harbor.",
              "harbor_medicinals_stashed",
              ["kurast_reserve_medicinals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_reserve_opportunity",
      title: "Hellforge Reserve",
      zoneTitle: "Hellforge Reserve",
      description: "Once the forge route, shrine lane, and crossroads all settle, one final infernal reserve line opens before the sanctuary push.",
      summary: "The act now ends with a reserve forge payoff after every non-combat branch resolves.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresOpportunityId: "hellforge_route_opportunity",
      requiresShrineOpportunityId: "infernal_shrine_opportunity",
      requiresCrossroadOpportunityId: "hellforge_crossroads_opportunity",
      variants: [
        {
          id: "forge_rearguard",
          title: "Forge Rearguard",
          description: "The resolved infernal routes can still become a black-iron reserve or a cleaner ash-relief line.",
          summary: "A fallback reserve forge line appears after the act's other lanes resolve.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "bank_the_blackstores",
              "Bank the Blackstores",
              "Turn the reserve into banked blackstores and keep the infernal line harder to starve.",
              "blackstores_banked",
              ["hellforge_reserve_blackstores"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "pace_the_ash_reliefs",
              "Pace the Ash Reliefs",
              "Use the same reserve to keep ash-relief teams moving behind the line.",
              "ash_reliefs_paced",
              ["hellforge_reserve_ash_reliefs"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "hellward_turn_reserve",
          title: "Hellward Turn Reserve",
          description: "A drilled hellward turn makes the reserve more specific than a simple blackstore line.",
          summary: "The hellward crossroads route opens a tighter infernal reserve pivot.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_crossroads_hellward_turn"],
          choices: [
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "drill_the_turning_reserve",
              "Drill the Turning Reserve",
              "Use the hellward pivot to keep the reserve turning cleanly behind the forge line.",
              "turning_reserve_drilled",
              ["hellforge_reserve_turning_line"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }]
            ),
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "temper_the_relief_cache",
              "Temper the Relief Cache",
              "Keep the reserve cache tempered and ready to survive the sanctuary climb.",
              "relief_cache_tempered",
              ["hellforge_reserve_relief_cache"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "phalanx_relief_reserve",
          title: "Phalanx Relief Reserve",
          description: "The paced phalanx reliefs turn the reserve into a disciplined relief wall instead of a loose ash column.",
          summary: "The phalanx-relief crossroads route opens a harder reserve barrier at the end of the act.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_crossroads_phalanx_reliefs"],
          choices: [
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "lock_the_relief_wall",
              "Lock the Relief Wall",
              "Turn the reserve into a true relief wall and stop the infernal line from cracking open.",
              "relief_wall_locked",
              ["hellforge_reserve_relief_wall"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            reserveChoice(
              "hellforge_reserve_opportunity",
              "hellforge_claim",
              "stage_the_cinder_bearers",
              "Stage the Cinder Bearers",
              "Use the same reserve to keep cinder bearers moving behind the relief line.",
              "cinder_bearers_staged",
              ["hellforge_reserve_cinder_bearers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_reserve_opportunity",
      title: "Summit Reserve",
      zoneTitle: "Summit Reserve",
      description: "Once the climb route, shrine lane, and crossroads all settle, one last summit reserve opens before the Ancients.",
      summary: "The act now ends with a reserve summit payoff after every side lane resolves.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresOpportunityId: "harrogath_route_opportunity",
      requiresShrineOpportunityId: "ancients_way_route_opportunity",
      requiresCrossroadOpportunityId: "harrogath_crossroads_opportunity",
      variants: [
        {
          id: "summit_rearguard",
          title: "Summit Rearguard",
          description: "The resolved climb routes can still become a stocked cache or a steadier frost-post line.",
          summary: "A fallback summit reserve appears after the act's other opportunity branches resolve.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "stack_the_climb_cache",
              "Stack the Climb Cache",
              "Turn the reserve into a stocked climb cache before the final ascent.",
              "climb_cache_stacked",
              ["harrogath_reserve_climb_cache"],
              [{ kind: "refill_potions", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "post_the_frost_relays",
              "Post the Frost Relays",
              "Use the same reserve to keep frost relays moving through the last stretch.",
              "frost_relays_posted",
              ["harrogath_reserve_frost_relays"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "switchback_reserve",
          title: "Switchback Reserve",
          description: "The captain's switchbacks turn the reserve into a drilled summit guard instead of a simple climb cache.",
          summary: "The switchback crossroads route opens a harder reserve guard for the final approach.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_crossroads_switchbacks"],
          choices: [
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "drill_the_switchback_guard",
              "Drill the Switchback Guard",
              "Use the drilled switchbacks to turn the reserve into a summit guard line.",
              "switchback_guard_drilled",
              ["harrogath_reserve_switchback_guard"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "stock_the_frost_sleds",
              "Stock the Frost Sleds",
              "Keep reserve sleds moving on the same switchbacks and stop the summit line from running dry.",
              "frost_sleds_stocked",
              ["harrogath_reserve_frost_sleds"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "summit_column_reserve",
          title: "Summit Column Reserve",
          description: "A held summit reserve turns the final lane into a steadier column instead of a loose climb cache.",
          summary: "The summit-reserve crossroads route opens a better supplied last reserve line.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_crossroads_summit_reserve"],
          choices: [
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "hold_the_last_column",
              "Hold the Last Column",
              "Use the summit reserve to keep a last column ready behind the ascent.",
              "last_column_held",
              ["harrogath_reserve_last_column"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            reserveChoice(
              "harrogath_reserve_opportunity",
              "harrogath_rescue",
              "marshal_the_watchfire_loads",
              "Marshal the Watchfire Loads",
              "Keep reserve loads moving under the watchfires and stop the final line from going cold.",
              "watchfire_loads_marshaled",
              ["harrogath_reserve_watchfire_loads"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.reserveOpportunityDefinitions = RESERVE_OPPORTUNITY_DEFINITIONS;
})();
