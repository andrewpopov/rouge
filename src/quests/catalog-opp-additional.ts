(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const { nodeOutcomeEffect, questConsequenceEffect } = helpers;

  const ADDITIONAL_OPPORTUNITY_VARIANTS: Record<number, OpportunityNodeVariantDefinition[]> = {
    2: [
      {
        id: "welltrain_convoy",
        title: "Welltrain Convoy",
        description: "The warded caravan and welltrain blessing turn the desert line into a moving fortress.",
        summary: "A shrine-backed caravan ward opens a more durable convoy package.",
        grants: { gold: 8, xp: 8, potions: 0 },
        requiresPrimaryOutcomeIds: ["seal_the_chamber"],
        requiresFollowUpOutcomeIds: ["relay_to_the_caravan"],
        requiresConsequenceIds: ["caravan_warded"],
        requiresFlagIds: ["sunwell_welltrain"],
        choices: [
          {
            id: "sanctify_the_cisterns",
            title: "Sanctify the Cisterns",
            subtitle: "Route Opportunity",
            description: "Push the blessing into the caravan wells and keep recovery steadier under attrition.",
            effects: [
              nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "sanctify_the_cisterns", "Sanctify the Cisterns", [
                "sunwell_cisterns_sanctified",
              ]),
              questConsequenceEffect(
                "lost_reliquary",
                "sanctify_the_cisterns",
                "Sanctify the Cisterns",
                "cisterns_sanctified",
                ["sunwell_cisterns_sanctified"]
              ),
              { kind: "belt_capacity", value: 1 },
              { kind: "hero_potion_heal", value: 1 },
            ],
          },
          {
            id: "arm_the_well_guards",
            title: "Arm the Well Guards",
            subtitle: "Route Opportunity",
            description: "Fold the same blessing into the convoy guard and keep the desert escort dangerous.",
            effects: [
              nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "arm_the_well_guards", "Arm the Well Guards", [
                "sunwell_well_guards_armed",
              ]),
              questConsequenceEffect(
                "lost_reliquary",
                "arm_the_well_guards",
                "Arm the Well Guards",
                "well_guards_armed",
                ["sunwell_well_guards_armed"]
              ),
              { kind: "mercenary_attack", value: 1 },
              { kind: "mercenary_max_life", value: 4 },
            ],
          },
        ],
      },
    ],
    3: [
      {
        id: "harbor_freeport",
        title: "Harbor Freeport",
        description: "The trade-wind blessing and hidden bales let you formalize a richer dockside freeport.",
        summary: "A stashed-contraband path can now cash out into a more specific harbor network.",
        grants: { gold: 10, xp: 8, potions: 0 },
        requiresPrimaryOutcomeIds: ["move_the_contraband"],
        requiresFollowUpOutcomeIds: ["stash_the_bales"],
        requiresConsequenceIds: ["bales_stashed"],
        requiresFlagIds: ["jade_shrine_trade_winds"],
        choices: [
          {
            id: "open_the_hidden_berths",
            title: "Open the Hidden Berths",
            subtitle: "Route Opportunity",
            description: "Spend the blessing on secret berths and keep the dockside cut flowing.",
            effects: [
              nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "open_the_hidden_berths", "Open the Hidden Berths", [
                "kurast_hidden_berths_opened",
              ]),
              questConsequenceEffect(
                "smugglers_wake",
                "open_the_hidden_berths",
                "Open the Hidden Berths",
                "hidden_berths_opened",
                ["kurast_hidden_berths_opened"]
              ),
              { kind: "gold_bonus", value: 14 },
              { kind: "refill_potions", value: 1 },
            ],
          },
          {
            id: "hire_the_night_crews",
            title: "Hire the Night Crews",
            subtitle: "Route Opportunity",
            description: "Use the same freeport to keep your own line better staffed and moving.",
            effects: [
              nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "hire_the_night_crews", "Hire the Night Crews", [
                "kurast_night_crews_hired",
              ]),
              questConsequenceEffect(
                "smugglers_wake",
                "hire_the_night_crews",
                "Hire the Night Crews",
                "night_crews_hired",
                ["kurast_night_crews_hired"]
              ),
              { kind: "mercenary_attack", value: 1 },
              { kind: "belt_capacity", value: 1 },
            ],
          },
        ],
      },
    ],
    4: [
      {
        id: "quenched_bulwark",
        title: "Quenched Bulwark",
        description: "The cinder screen and quenched plating let you build a real ash bulwark before Diablo.",
        summary: "A cooled-forge path now opens a stronger infernal-route bulwark.",
        grants: { gold: 8, xp: 10, potions: 0 },
        requiresPrimaryOutcomeIds: ["temper_the_armor"],
        requiresFollowUpOutcomeIds: ["quench_the_plating"],
        requiresConsequenceIds: ["plating_quenched"],
        requiresFlagIds: ["infernal_altar_cinder_screen"],
        choices: [
          {
            id: "raise_the_ash_shields",
            title: "Raise the Ash Shields",
            subtitle: "Route Opportunity",
            description: "Turn the plated route into a denser shield wall and keep the body steadier.",
            effects: [
              nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "raise_the_ash_shields", "Raise the Ash Shields", [
                "hellforge_ash_shields_raised",
              ]),
              questConsequenceEffect(
                "hellforge_claim",
                "raise_the_ash_shields",
                "Raise the Ash Shields",
                "ash_shields_raised",
                ["hellforge_ash_shields_raised"]
              ),
              { kind: "hero_max_life", value: 3 },
              { kind: "hero_potion_heal", value: 1 },
            ],
          },
          {
            id: "stage_the_cooling_crews",
            title: "Stage the Cooling Crews",
            subtitle: "Route Opportunity",
            description: "Keep the forgehands on the road and let them preserve the line between fights.",
            effects: [
              nodeOutcomeEffect(
                "opportunity",
                "hellforge_route_opportunity",
                "stage_the_cooling_crews",
                "Stage the Cooling Crews",
                ["hellforge_cooling_crews_staged"]
              ),
              questConsequenceEffect(
                "hellforge_claim",
                "stage_the_cooling_crews",
                "Stage the Cooling Crews",
                "cooling_crews_staged",
                ["hellforge_cooling_crews_staged"]
              ),
              { kind: "mercenary_max_life", value: 4 },
              { kind: "gold_bonus", value: 12 },
            ],
          },
        ],
      },
    ],
    5: [
      {
        id: "watchfire_train",
        title: "Watchfire Train",
        description: "The stacked cache and watchfire blessing let you formalize the climb into a supplied war train.",
        summary: "A shrine-backed ration path opens a more specific summit supply line.",
        grants: { gold: 10, xp: 10, potions: 0 },
        requiresPrimaryOutcomeIds: ["secure_the_rations"],
        requiresFollowUpOutcomeIds: ["stack_the_cache"],
        requiresConsequenceIds: ["cache_stacked"],
        requiresFlagIds: ["ancients_way_watchfires"],
        choices: [
          {
            id: "light_the_climb_posts",
            title: "Light the Climb Posts",
            subtitle: "Route Opportunity",
            description: "Commit the watchfires to the path itself and keep the summit line steadier.",
            effects: [
              nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "light_the_climb_posts", "Light the Climb Posts", [
                "summit_climb_posts_lit",
              ]),
              questConsequenceEffect(
                "harrogath_rescue",
                "light_the_climb_posts",
                "Light the Climb Posts",
                "climb_posts_lit",
                ["summit_climb_posts_lit"]
              ),
              { kind: "refill_potions", value: 1 },
              { kind: "hero_max_life", value: 4 },
            ],
          },
          {
            id: "assign_the_frost_pickets",
            title: "Assign the Frost Pickets",
            subtitle: "Route Opportunity",
            description: "Use the same train to keep pickets posted and the last escort harder to collapse.",
            effects: [
              nodeOutcomeEffect(
                "opportunity",
                "harrogath_route_opportunity",
                "assign_the_frost_pickets",
                "Assign the Frost Pickets",
                ["summit_frost_pickets_assigned"]
              ),
              questConsequenceEffect(
                "harrogath_rescue",
                "assign_the_frost_pickets",
                "Assign the Frost Pickets",
                "frost_pickets_assigned",
                ["summit_frost_pickets_assigned"]
              ),
              { kind: "mercenary_attack", value: 1 },
              { kind: "belt_capacity", value: 1 },
            ],
          },
        ],
      },
    ],
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.additionalOpportunityVariants = ADDITIONAL_OPPORTUNITY_VARIANTS;
})();
