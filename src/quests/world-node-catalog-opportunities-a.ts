(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    nodeOutcomeEffect,
    questConsequenceEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const OPPORTUNITY_DEFINITIONS_A: Record<number, OpportunityNodeDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_route_opportunity",
      title: "Rogue Route Opportunity",
      zoneTitle: "Rogue Opportunity",
      description: "The Tristram detour leaves one more route-side opening once the follow-up work is settled.",
      summary: "A third route node now pays off the full Tristram chain.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "tristram_relief",
      variants: [
        {
          id: "vigil_counterline",
          title: "Vigil Counterline",
          description: "The shrine's volley blessing turns the scout chain into a live kill lane instead of a passive signal post.",
          summary: "A shrine-backed scout path opens a sharper counterline opportunity.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_vigil_volley"],
          choices: [
            {
              id: "call_the_volley_line",
              title: "Call the Volley Line",
              subtitle: "Route Opportunity",
              description: "Fold the shrine blessing into the scout detachment and keep the forward line lethal.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "call_the_volley_line", "Call the Volley Line", [
                  "rogue_route_volley_line",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "call_the_volley_line",
                  "Call the Volley Line",
                  "volley_line_called",
                  ["rogue_route_volley_line"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "stock_the_arrow_caches",
              title: "Stock the Arrow Caches",
              subtitle: "Route Opportunity",
              description: "Use the same blessing to stabilize arrow caches and keep the line supplied under pressure.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "stock_the_arrow_caches", "Stock the Arrow Caches", [
                  "rogue_route_arrow_caches",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "stock_the_arrow_caches",
                  "Stock the Arrow Caches",
                  "arrow_caches_stocked",
                  ["rogue_route_arrow_caches"]
                ),
                { kind: "gold_bonus", value: 12 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "rogue_forward_screen",
          title: "Rogue Forward Screen",
          description: "With a rogue scout under contract, the volley blessing turns the same scout chain into a true forward screen.",
          summary: "A scout contract and shrine-backed route combine into a sharper forward screen.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_vigil_volley"],
          requiresMercenaryIds: ["rogue_scout"],
          choices: [
            {
              id: "post_the_forward_spotters",
              title: "Post the Forward Spotters",
              subtitle: "Route Opportunity",
              description: "Let the contracted scout build a true forward spotting lane under the shrine's volley blessing.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "post_the_forward_spotters", "Post the Forward Spotters", [
                  "rogue_route_forward_spotters",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "post_the_forward_spotters",
                  "Post the Forward Spotters",
                  "forward_spotters_posted",
                  ["rogue_route_forward_spotters"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
            {
              id: "cut_the_flank_trails",
              title: "Cut the Flank Trails",
              subtitle: "Route Opportunity",
              description: "Have the scout open flank trails and keep the counterline mobile instead of static.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "cut_the_flank_trails", "Cut the Flank Trails", [
                  "rogue_route_flank_trails",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "cut_the_flank_trails",
                  "Cut the Flank Trails",
                  "flank_trails_cut",
                  ["rogue_route_flank_trails"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
          ],
        },
        {
          id: "refugee_muster",
          title: "Refugee Muster",
          description: "The stabilized survivor line can turn into either a relief post or a harder escort cordon.",
          summary: "The rescue aftermath opens a disciplined route-side muster.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["quarter_the_caravan", "train_the_watch"],
          choices: [
            {
              id: "open_relief_post",
              title: "Open Relief Post",
              subtitle: "Route Opportunity",
              description: "Formalize the survivor line into a stocked relief post beside the route.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "open_relief_post", "Open Relief Post", [
                  "rogue_route_relief_post",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "open_relief_post",
                  "Open Relief Post",
                  "relief_post_opened",
                  ["rogue_route_relief_post"]
                ),
                { kind: "hero_max_life", value: 2 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "draft_the_wardens",
              title: "Draft the Wardens",
              subtitle: "Route Opportunity",
              description: "Turn the rescued line into wardens and keep the escort armed for the next push.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "draft_the_wardens", "Draft the Wardens", [
                  "rogue_route_wardens",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "draft_the_wardens",
                  "Draft the Wardens",
                  "wardens_drafted",
                  ["rogue_route_wardens"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
          ],
        },
        {
          id: "grit_redoubt",
          title: "Grit Redoubt",
          description: "The shrine's grit blessing turns the refugee line into a tougher redoubt instead of a simple muster.",
          summary: "A shrine-backed refugee path opens a harder defensive redoubt.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["quarter_the_caravan", "train_the_watch"],
          requiresFlagIds: ["rogue_vigil_grit"],
          choices: [
            {
              id: "harden_the_refuge_line",
              title: "Harden the Refuge Line",
              subtitle: "Route Opportunity",
              description: "Use the shrine's endurance blessing to turn the refugee cordon into a real redoubt.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "harden_the_refuge_line", "Harden the Refuge Line", [
                  "rogue_route_refuge_line_hardened",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "harden_the_refuge_line",
                  "Harden the Refuge Line",
                  "refuge_line_hardened",
                  ["rogue_route_refuge_line_hardened"]
                ),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
            {
              id: "stock_the_field_tents",
              title: "Stock the Field Tents",
              subtitle: "Route Opportunity",
              description: "Turn the same grit blessing into a steadier shelter line and better recovery under pressure.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "stock_the_field_tents", "Stock the Field Tents", [
                  "rogue_route_field_tents_stocked",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "stock_the_field_tents",
                  "Stock the Field Tents",
                  "field_tents_stocked",
                  ["rogue_route_field_tents_stocked"]
                ),
                { kind: "hero_potion_heal", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "salvage_exchange",
          title: "Salvage Exchange",
          description: "The convoy haul can still become either pure coin flow or reinforced field gear.",
          summary: "Your salvage follow-up opens one more quartermaster transaction.",
          grants: { gold: 6, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["sell_to_the_rogues", "forge_field_kits"],
          choices: [
            {
              id: "broker_the_sale",
              title: "Broker the Sale",
              subtitle: "Route Opportunity",
              description: "Move the remaining salvage fast and take the cleaner payout.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "broker_the_sale", "Broker the Sale", [
                  "rogue_route_sale_brokered",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "broker_the_sale",
                  "Broker the Sale",
                  "sale_brokered",
                  ["rogue_route_sale_brokered"]
                ),
                { kind: "gold_bonus", value: 16 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "issue_the_kits",
              title: "Issue the Kits",
              subtitle: "Route Opportunity",
              description: "Push the forged kits into circulation and steady the escort for the act.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "issue_the_kits", "Issue the Kits", [
                  "rogue_route_kits_issued",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "issue_the_kits",
                  "Issue the Kits",
                  "kits_issued",
                  ["rogue_route_kits_issued"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "scout_detachment",
          title: "Scout Detachment",
          description: "The mapped trails can support either better signal lines or a better-armed vanguard.",
          summary: "The scout report chain now creates a dedicated route-side detachment choice.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          choices: [
            {
              id: "signal_the_crossroads",
              title: "Signal the Crossroads",
              subtitle: "Route Opportunity",
              description: "Use the cleared routes for cleaner signals and faster reserve movement.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "signal_the_crossroads", "Signal the Crossroads", [
                  "rogue_route_signals",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "signal_the_crossroads",
                  "Signal the Crossroads",
                  "crossroads_signaled",
                  ["rogue_route_signals"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
            {
              id: "equip_the_vanguard",
              title: "Equip the Vanguard",
              subtitle: "Route Opportunity",
              description: "Arm the sentry detachment into a harder vanguard instead of a passive lookout line.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "equip_the_vanguard", "Equip the Vanguard", [
                  "rogue_route_vanguard",
                ]),
                questConsequenceEffect(
                  "tristram_relief",
                  "equip_the_vanguard",
                  "Equip the Vanguard",
                  "vanguard_equipped",
                  ["rogue_route_vanguard"]
                ),
                { kind: "hero_max_life", value: 2 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
          ],
        },
      ],
    },
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
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
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
                { kind: "mercenary_attack", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
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
                { kind: "hero_potion_heal", value: 1 },
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
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 10 },
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
                { kind: "gold_bonus", value: 12 },
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
                { kind: "mercenary_attack", value: 1 },
                { kind: "refill_potions", value: 1 },
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
