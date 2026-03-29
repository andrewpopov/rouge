(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    nodeOutcomeEffect,
    questConsequenceEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const OPPORTUNITY_DEFINITIONS_A: Record<number, OpportunityNodeDefinition> = {
    2: {
      kind: "opportunity",
      id: "sunwell_route_opportunity",
      title: "Sunwell Route Opportunity",
      zoneTitle: "Sunwell Opportunity",
      description: "The reliquary chain leaves one more desert-side logistics opening once the follow-up settles.",
      summary: "A third route node now cashes out the reliquary chain.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
      variants: [
        {
          id: "marching_vanguard",
          title: "Marching Vanguard",
          description: "The march blessing turns the caravan-arming chain into a disciplined desert vanguard.",
          summary: "A shrine-backed caravan path opens a stronger vanguard package.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_march"],
          choices: [
            {
              id: "drive_the_lance_column",
              title: "Drive the Lance Column",
              subtitle: "Route Opportunity",
              description: "Push the march blessing into the lance train and turn the column into a fast strike screen.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "drive_the_lance_column", "Drive the Lance Column", [
                  "sunwell_lance_column",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "drive_the_lance_column",
                  "Drive the Lance Column",
                  "lance_column_driven",
                  ["sunwell_lance_column"]
                ),
                { kind: "class_point", value: 1 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
            {
              id: "shield_the_water_train",
              title: "Shield the Water Train",
              subtitle: "Route Opportunity",
              description: "Use the march discipline to keep the whole caravan steadier across the desert push.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "shield_the_water_train", "Shield the Water Train", [
                  "sunwell_water_train_shielded",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "shield_the_water_train",
                  "Shield the Water Train",
                  "water_train_shielded",
                  ["sunwell_water_train_shielded"]
                ),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "spearwall_march",
          title: "Spearwall March",
          description: "With a desert guard under contract, the march blessing turns the caravan line into a true spearwall column.",
          summary: "A contracted spearwall and shrine-backed caravan route create a heavier desert march.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_march"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            {
              id: "fix_the_spearwall_posts",
              title: "Fix the Spearwall Posts",
              subtitle: "Route Opportunity",
              description: "Use the contracted guard to turn the march route into a disciplined line of spearwall posts.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "fix_the_spearwall_posts", "Fix the Spearwall Posts", [
                  "sunwell_spearwall_posts",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "fix_the_spearwall_posts",
                  "Fix the Spearwall Posts",
                  "spearwall_posts_fixed",
                  ["sunwell_spearwall_posts"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "hero_max_life", value: 3 },
              ],
            },
            {
              id: "drive_the_shield_train",
              title: "Drive the Shield Train",
              subtitle: "Route Opportunity",
              description: "Put the guard at the front of the caravan and keep the whole desert column harder to break.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "drive_the_shield_train", "Drive the Shield Train", [
                  "sunwell_shield_train",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "drive_the_shield_train",
                  "Drive the Shield Train",
                  "shield_train_driven",
                  ["sunwell_shield_train"]
                ),
                { kind: "reinforce_build" },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
          ],
        },
        {
          id: "relay_network",
          title: "Relay Network",
          description: "Your sealed reliquary route can become either a caravan relay or a fast scout line.",
          summary: "The sealed chamber path opens a cleaner desert relay network.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          choices: [
            {
              id: "stage_water_train",
              title: "Stage Water Train",
              subtitle: "Route Opportunity",
              description: "Anchor the relay into a water train and keep the march healthier.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "stage_water_train", "Stage Water Train", [
                  "sunwell_water_train",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "stage_water_train",
                  "Stage Water Train",
                  "water_train_staged",
                  ["sunwell_water_train"]
                ),
                { kind: "support_build" },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "push_the_outriders",
              title: "Push the Outriders",
              subtitle: "Route Opportunity",
              description: "Convert the relay into a harder outrider line that keeps the escort dangerous.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "push_the_outriders", "Push the Outriders", [
                  "sunwell_outriders",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "push_the_outriders",
                  "Push the Outriders",
                  "outriders_pushed",
                  ["sunwell_outriders"]
                ),
                { kind: "reinforce_build" },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
          ],
        },
        {
          id: "sunwell_reserve",
          title: "Sunwell Reserve",
          description: "The shrine's focus blessing turns the relay chain into a cleaner reserve net instead of a simple dispatch route.",
          summary: "A shrine-backed relay path opens a steadier desert reserve package.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          requiresFlagIds: ["sunwell_focus"],
          choices: [
            {
              id: "steady_the_water_posts",
              title: "Steady the Water Posts",
              subtitle: "Route Opportunity",
              description: "Turn the shrine's focus inward and stabilize the relay into a safer water-post chain.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "steady_the_water_posts", "Steady the Water Posts", [
                  "sunwell_water_posts_steadied",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "steady_the_water_posts",
                  "Steady the Water Posts",
                  "water_posts_steadied",
                  ["sunwell_water_posts_steadied"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "focus_the_beacon_chain",
              title: "Focus the Beacon Chain",
              subtitle: "Route Opportunity",
              description: "Put the same blessing into the relay beacons and keep the desert line more precise.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "focus_the_beacon_chain", "Focus the Beacon Chain", [
                  "sunwell_beacon_chain_focused",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "focus_the_beacon_chain",
                  "Focus the Beacon Chain",
                  "beacon_chain_focused",
                  ["sunwell_beacon_chain_focused"]
                ),
                { kind: "reinforce_build" },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
          ],
        },
        {
          id: "relic_brokerage",
          title: "Relic Brokerage",
          description: "The harvested reliquary can become a cleaner cash deal or a tighter reserve core.",
          summary: "The harvested relic path opens a final brokerage decision.",
          grants: { gold: 6, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["auction_the_fragments", "keep_the_core"],
          choices: [
            {
              id: "sell_the_polished_shards",
              title: "Sell the Polished Shards",
              subtitle: "Route Opportunity",
              description: "Move the cleaned fragments and take the larger war chest.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "sunwell_route_opportunity",
                  "sell_the_polished_shards",
                  "Sell the Polished Shards",
                  ["sunwell_polished_shards"]
                ),
                questConsequenceEffect(
                  "lost_reliquary",
                  "sell_the_polished_shards",
                  "Sell the Polished Shards",
                  "polished_shards_sold",
                  ["sunwell_polished_shards"]
                ),
                { kind: "gold_bonus", value: 18 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "fortify_the_core_guard",
              title: "Fortify the Core Guard",
              subtitle: "Route Opportunity",
              description: "Hold the reliquary core inside the escort and build a sturdier guard line.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "sunwell_route_opportunity",
                  "fortify_the_core_guard",
                  "Fortify the Core Guard",
                  ["sunwell_core_guard"]
                ),
                questConsequenceEffect(
                  "lost_reliquary",
                  "fortify_the_core_guard",
                  "Fortify the Core Guard",
                  "core_guard_fortified",
                  ["sunwell_core_guard"]
                ),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "caravan_plate",
          title: "Caravan Plate",
          description: "The armed caravan can become either a lance reserve or a plated march line.",
          summary: "The caravan-arming chain now opens a final equipment choice.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          choices: [
            {
              id: "reserve_the_lances",
              title: "Reserve the Lances",
              subtitle: "Route Opportunity",
              description: "Hold the extra lance racks for the harder fights still ahead.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "reserve_the_lances", "Reserve the Lances", [
                  "sunwell_lances_reserved",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "reserve_the_lances",
                  "Reserve the Lances",
                  "lances_reserved",
                  ["sunwell_lances_reserved"]
                ),
                { kind: "reinforce_build" },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
            {
              id: "plate_the_vanguard",
              title: "Plate the Vanguard",
              subtitle: "Route Opportunity",
              description: "Push the plating onto the forward line and make the route more durable.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_route_opportunity", "plate_the_vanguard", "Plate the Vanguard", [
                  "sunwell_vanguard_plated",
                ]),
                questConsequenceEffect(
                  "lost_reliquary",
                  "plate_the_vanguard",
                  "Plate the Vanguard",
                  "vanguard_plated",
                  ["sunwell_vanguard_plated"]
                ),
                { kind: "hero_max_life", value: 3 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
          ],
        },
      ],
    },
  };

  runtimeWindow.__ROUGE_WNC_OPPS_A = {
    opportunitiesA: OPPORTUNITY_DEFINITIONS_A,
  };
})();
