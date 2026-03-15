(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    nodeOutcomeEffect,
    questConsequenceEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const OPPORTUNITY_DEFINITIONS_B: Record<number, OpportunityNodeDefinition> = {
    3: {
      kind: "opportunity",
      id: "kurast_route_opportunity",
      title: "Kurast Route Opportunity",
      zoneTitle: "Kurast Opportunity",
      description: "The dockside chain opens one more smuggler or purifier payoff once its aftermath resolves.",
      summary: "A third route node now cashes out the Kurast chain.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      variants: [
        {
          id: "storehouse_convoy",
          title: "Storehouse Convoy",
          description: "The storehouse blessing turns the porter chain into a steadier convoy instead of a loose hire line.",
          summary: "A shrine-backed labor path opens a tighter convoy package.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["station_the_loaders", "arm_the_foremen"],
          requiresFlagIds: ["jade_shrine_storehouse"],
          choices: [
            {
              id: "seal_the_supply_barges",
              title: "Seal the Supply Barges",
              subtitle: "Route Opportunity",
              description: "Put the shrine's favor into the convoy itself and keep the route stocked through attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "seal_the_supply_barges", "Seal the Supply Barges", [
                  "kurast_supply_barges",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "seal_the_supply_barges",
                  "Seal the Supply Barges",
                  "supply_barges_sealed",
                  ["kurast_supply_barges"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "armor_the_dock_crew",
              title: "Armor the Dock Crew",
              subtitle: "Route Opportunity",
              description: "Use the same blessing on the labor line and turn the convoy into a sturdier fighting column.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "armor_the_dock_crew", "Armor the Dock Crew", [
                  "kurast_dock_crew_armored",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "armor_the_dock_crew",
                  "Armor the Dock Crew",
                  "dock_crew_armored",
                  ["kurast_dock_crew_armored"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "smuggler_lane",
          title: "Smuggler Lane",
          description: "The contraband chain can become a taxed route or a hidden supply lane.",
          summary: "The contraband aftermath opens a final dockside lane decision.",
          grants: { gold: 6, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["pay_the_port_tax", "stash_the_bales"],
          choices: [
            {
              id: "license_the_wharf",
              title: "License the Wharf",
              subtitle: "Route Opportunity",
              description: "Make the lane official enough to skim the port and keep supplies moving.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "license_the_wharf", "License the Wharf", [
                  "kurast_wharf_licensed",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "license_the_wharf",
                  "License the Wharf",
                  "wharf_licensed",
                  ["kurast_wharf_licensed"]
                ),
                { kind: "gold_bonus", value: 16 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "hide_the_manifest",
              title: "Hide the Manifest",
              subtitle: "Route Opportunity",
              description: "Keep the line deniable and turn the hidden route into a field advantage.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "hide_the_manifest", "Hide the Manifest", [
                  "kurast_manifest_hidden",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "hide_the_manifest",
                  "Hide the Manifest",
                  "manifest_hidden",
                  ["kurast_manifest_hidden"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "purifier_circle",
          title: "Purifier Circle",
          description: "The idol chain can spread into a wider warding circle or be condensed into a harder reserve.",
          summary: "The purified idol path opens a final spiritual payoff.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          choices: [
            {
              id: "raise_the_ward_posts",
              title: "Raise the Ward Posts",
              subtitle: "Route Opportunity",
              description: "Turn the ashes into a standing ward line over the route.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "raise_the_ward_posts", "Raise the Ward Posts", [
                  "kurast_ward_posts",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "raise_the_ward_posts",
                  "Raise the Ward Posts",
                  "ward_posts_raised",
                  ["kurast_ward_posts"]
                ),
                { kind: "hero_max_life", value: 3 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "seal_the_resin_cache",
              title: "Seal the Resin Cache",
              subtitle: "Route Opportunity",
              description: "Hold the resin in reserve and keep it ready for the hardest temple stretch.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "kurast_route_opportunity",
                  "seal_the_resin_cache",
                  "Seal the Resin Cache",
                  ["kurast_resin_cache"]
                ),
                questConsequenceEffect(
                  "smugglers_wake",
                  "seal_the_resin_cache",
                  "Seal the Resin Cache",
                  "resin_cache_sealed",
                  ["kurast_resin_cache"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "tidal_wards",
          title: "Tidal Wards",
          description: "The shrine's tide blessing turns the purifier chain into a flowing ward net instead of a fixed circle.",
          summary: "A shrine-backed purifier path opens a more fluid ward package.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["jade_shrine_tides"],
          choices: [
            {
              id: "float_the_ward_barges",
              title: "Float the Ward Barges",
              subtitle: "Route Opportunity",
              description: "Carry the shrine's tides into the river ward line and keep the route cleaner under attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "float_the_ward_barges", "Float the Ward Barges", [
                  "kurast_ward_barges_floated",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "float_the_ward_barges",
                  "Float the Ward Barges",
                  "ward_barges_floated",
                  ["kurast_ward_barges_floated"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "roll_the_resin_tide",
              title: "Roll the Resin Tide",
              subtitle: "Route Opportunity",
              description: "Move the resin with the tide blessing and turn it into a steadier reserve through the docks.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "roll_the_resin_tide", "Roll the Resin Tide", [
                  "kurast_resin_tide_rolled",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "roll_the_resin_tide",
                  "Roll the Resin Tide",
                  "resin_tide_rolled",
                  ["kurast_resin_tide_rolled"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
          ],
        },
        {
          id: "kurast_shadow_tide",
          title: "Kurast Shadow Tide",
          description: "With a Kurast shadow or Iron Wolf under contract, the tide blessing turns the purifier line into a covert ward net.",
          summary: "A contracted Kurast specialist and shrine-backed purifier path create a sharper dockside tide screen.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["jade_shrine_tides"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            {
              id: "lace_the_docks_with_wards",
              title: "Lace the Docks with Wards",
              subtitle: "Route Opportunity",
              description: "Let the contracted specialist stitch the shrine's tides into a covert ward line across the docks.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "lace_the_docks_with_wards", "Lace the Docks with Wards", [
                  "kurast_dock_wards_laced",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "lace_the_docks_with_wards",
                  "Lace the Docks with Wards",
                  "dock_wards_laced",
                  ["kurast_dock_wards_laced"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
            {
              id: "move_the_shadow_barges",
              title: "Move the Shadow Barges",
              subtitle: "Route Opportunity",
              description: "Use the same contract to move the blessed resin by hidden barge and keep the route stocked in secret.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "move_the_shadow_barges", "Move the Shadow Barges", [
                  "kurast_shadow_barges",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "move_the_shadow_barges",
                  "Move the Shadow Barges",
                  "shadow_barges_moved",
                  ["kurast_shadow_barges"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "porter_column",
          title: "Porter Column",
          description: "The hired labor can become a steadier route train or a tougher frontline crew.",
          summary: "The porter chain now opens a final manpower allocation.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["station_the_loaders", "arm_the_foremen"],
          choices: [
            {
              id: "stage_the_supply_rings",
              title: "Stage the Supply Rings",
              subtitle: "Route Opportunity",
              description: "Spread the hired labor into supply rings and keep the route stocked.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "kurast_route_opportunity",
                  "stage_the_supply_rings",
                  "Stage the Supply Rings",
                  ["kurast_supply_rings"]
                ),
                questConsequenceEffect(
                  "smugglers_wake",
                  "stage_the_supply_rings",
                  "Stage the Supply Rings",
                  "supply_rings_staged",
                  ["kurast_supply_rings"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "arm_the_column",
              title: "Arm the Column",
              subtitle: "Route Opportunity",
              description: "Keep the hired hands in the column and arm them for the harder pushes.",
              effects: [
                nodeOutcomeEffect("opportunity", "kurast_route_opportunity", "arm_the_column", "Arm the Column", [
                  "kurast_column_armed",
                ]),
                questConsequenceEffect(
                  "smugglers_wake",
                  "arm_the_column",
                  "Arm the Column",
                  "column_armed",
                  ["kurast_column_armed"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
      ],
    },
  };

  runtimeWindow.__ROUGE_WNC_OPPS_B = {
    opportunitiesB: OPPORTUNITY_DEFINITIONS_B,
  };
})();
