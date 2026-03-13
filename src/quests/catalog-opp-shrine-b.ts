(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const { nodeOutcomeEffect } = helpers;

  const SHRINE_OPPORTUNITY_DEFINITIONS_B: Record<number, ShrineOpportunityDefinition> = {
    3: {
      kind: "opportunity",
      id: "jade_shrine_opportunity",
      title: "Jade Route Opportunity",
      zoneTitle: "Jade Opportunity",
      description: "The Jade Shrine opens a second dockside lane built around tide stores, bastions, or a covert contract screen.",
      summary: "The shrine now pays off through its own Kurast route branch.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresShrineId: "jade_shrine",
      variants: [
        {
          id: "tide_cache",
          title: "Tide Cache",
          description: "A tide blessing can become either a floating supply mark chain or cleaner resin stores.",
          summary: "The tide blessing opens a cleaner dockside reserve package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_tides"],
          choices: [
            {
              id: "float_the_supply_marks",
              title: "Float the Supply Marks",
              subtitle: "Shrine Opportunity",
              description: "Carry the blessing downriver and keep the supply marks cleaner through attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "float_the_supply_marks", "Float the Supply Marks", [
                  "jade_supply_marks_floated",
                ]),
                { kind: "hero_max_energy", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "rinse_the_resin_casks",
              title: "Rinse the Resin Casks",
              subtitle: "Shrine Opportunity",
              description: "Put the tide blessing into the route stores and keep the dock caches more reliable.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "rinse_the_resin_casks", "Rinse the Resin Casks", [
                  "jade_resin_casks_rinsed",
                ]),
                { kind: "belt_capacity", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "storehouse_bastion",
          title: "Storehouse Bastion",
          description: "A storehouse blessing can become either sealed dock bins or a tougher loader line.",
          summary: "The storehouse blessing opens a sturdier labor-side package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_storehouse"],
          choices: [
            {
              id: "seal_the_dock_bins",
              title: "Seal the Dock Bins",
              subtitle: "Shrine Opportunity",
              description: "Hold the shrine's favor inside the route stores and make the dockside line sturdier.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "seal_the_dock_bins", "Seal the Dock Bins", [
                  "jade_dock_bins_sealed",
                ]),
                { kind: "belt_capacity", value: 1 },
                { kind: "hero_max_life", value: 3 },
              ],
            },
            {
              id: "garrison_the_loaders",
              title: "Garrison the Loaders",
              subtitle: "Shrine Opportunity",
              description: "Use the same blessing on the dock crew and make the route less fragile under attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "garrison_the_loaders", "Garrison the Loaders", [
                  "jade_loaders_garrisoned",
                ]),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "trade_wind_chain",
          title: "Trade Wind Chain",
          description: "A trade-wind blessing can carry the dock route on a cleaner marker line through the river approach.",
          summary: "The trade-wind blessing opens a steadier Kurast supply chain.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_trade_winds"],
          choices: [
            {
              id: "hang_the_tide_markers",
              title: "Hang the Tide Markers",
              subtitle: "Shrine Opportunity",
              description: "Carry the shrine's trade winds into the route markers and keep the docks easier to read.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "hang_the_tide_markers", "Hang the Tide Markers", [
                  "jade_tide_markers_hung",
                ]),
                { kind: "hero_max_energy", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
          ],
        },
        {
          id: "shadow_harbor",
          title: "Shadow Harbor",
          description: "With a Kurast shadow or Iron Wolf under contract, the shrine's tide blessing can become a covert harbor screen.",
          summary: "A contracted Kurast specialist turns the shrine lane into a stealth dockside payoff.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_tides"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            {
              id: "lace_the_docks_with_wards",
              title: "Lace the Docks with Wards",
              subtitle: "Shrine Opportunity",
              description: "Let the contracted specialist stitch the tide blessing into a covert ward line across the docks.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "lace_the_docks_with_wards", "Lace the Docks with Wards", [
                  "kurast_dock_wards_laced",
                ]),
                { kind: "hero_max_energy", value: 1 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
            {
              id: "move_the_shadow_barges",
              title: "Move the Shadow Barges",
              subtitle: "Shrine Opportunity",
              description: "Use the same contract to move the route stores by hidden barge instead of exposing them on the road.",
              effects: [
                nodeOutcomeEffect("opportunity", "jade_shrine_opportunity", "move_the_shadow_barges", "Move the Shadow Barges", [
                  "kurast_shadow_barges",
                ]),
                { kind: "belt_capacity", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "infernal_shrine_opportunity",
      title: "Infernal Route Opportunity",
      zoneTitle: "Infernal Opportunity",
      description: "The infernal altar opens a second hellside lane built around chained gates, war columns, or a contracted hellward phalanx.",
      summary: "The altar now opens its own later route payoff instead of only feeding the main chain.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresShrineId: "infernal_altar",
      variants: [
        {
          id: "iron_redoubt",
          title: "Iron Redoubt",
          description: "An iron blessing can become either chained forge gates or a harder ash bulwark.",
          summary: "The defensive altar blessing opens a more durable hell route package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_iron"],
          choices: [
            {
              id: "chain_the_forge_gates",
              title: "Chain the Forge Gates",
              subtitle: "Shrine Opportunity",
              description: "Turn the altar's favor into locked forge gates and a more durable route spine.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "chain_the_forge_gates", "Chain the Forge Gates", [
                  "infernal_forge_gates_chained",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "set_the_ash_bulwark",
              title: "Set the Ash Bulwark",
              subtitle: "Shrine Opportunity",
              description: "Carry the same blessing into the route camp and build an ash bulwark against the sanctuary push.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "set_the_ash_bulwark", "Set the Ash Bulwark", [
                  "infernal_ash_bulwark_set",
                ]),
                { kind: "hero_max_life", value: 2 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "warfire_column",
          title: "Warfire Column",
          description: "A warfire blessing can feed either the war sconces or a better-armed hellward.",
          summary: "The aggressive altar blessing opens a sharper escort package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_warfire"],
          choices: [
            {
              id: "fuel_the_war_sconces",
              title: "Fuel the War Sconces",
              subtitle: "Shrine Opportunity",
              description: "Push the blessing into the burning route line and keep the escort more dangerous.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "fuel_the_war_sconces", "Fuel the War Sconces", [
                  "infernal_war_sconces_fueled",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
            {
              id: "arm_the_hellward",
              title: "Arm the Hellward",
              subtitle: "Shrine Opportunity",
              description: "Use the same fire on the guard line itself and keep the sanctuary approach steadier.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "arm_the_hellward", "Arm the Hellward", [
                  "infernal_hellward_armed",
                ]),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "cinder_screen",
          title: "Cinder Screen",
          description: "A cinder-screen blessing can turn the route into a tighter ash-post screen across the sanctuary approach.",
          summary: "The cinder-screen blessing opens a steadier infernal guard package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_cinder_screen"],
          choices: [
            {
              id: "stake_the_cinder_posts",
              title: "Stake the Cinder Posts",
              subtitle: "Shrine Opportunity",
              description: "Use the shrine's cinder screen to lock down a steadier post line before the sanctuary climb.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "stake_the_cinder_posts", "Stake the Cinder Posts", [
                  "infernal_cinder_posts_staked",
                ]),
                { kind: "hero_max_life", value: 2 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
          ],
        },
        {
          id: "hellward_phalanx",
          title: "Hellward Phalanx",
          description: "With a Templar Vanguard or Pandemonium Scout under contract, the warfire blessing can turn into a real hellward phalanx.",
          summary: "A contracted Act IV specialist turns the altar lane into a combat-ready escort screen.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_warfire"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            {
              id: "lock_the_phalanx_steps",
              title: "Lock the Phalanx Steps",
              subtitle: "Shrine Opportunity",
              description: "Let the contracted escort specialist lock the route into a disciplined phalanx advance.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "lock_the_phalanx_steps", "Lock the Phalanx Steps", [
                  "hellforge_phalanx_steps_locked",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
            {
              id: "screen_the_hellward",
              title: "Screen the Hellward",
              subtitle: "Shrine Opportunity",
              description: "Use the same contract to keep the sanctuary route covered by a live hellward screen.",
              effects: [
                nodeOutcomeEffect("opportunity", "infernal_shrine_opportunity", "screen_the_hellward", "Screen the Hellward", [
                  "hellforge_hellward_screen",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "ancients_way_route_opportunity",
      title: "Summit Route Opportunity",
      zoneTitle: "Summit Opportunity",
      description: "The mountain shrine opens a second summit lane built around holdfasts, reserve columns, or a contracted captain's watch.",
      summary: "The summit shrine now pays off through its own warband-side route branch.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresShrineId: "ancients_way_shrine",
      variants: [
        {
          id: "summit_holdfast",
          title: "Summit Holdfast",
          description: "A summit blessing can become either a cut step line or better warming stores for the climb.",
          summary: "The endurance blessing opens a steadier summit package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_summit"],
          choices: [
            {
              id: "cut_the_snow_steps",
              title: "Cut the Snow Steps",
              subtitle: "Shrine Opportunity",
              description: "Put the shrine's favor into the route itself and make the climb more stable.",
              effects: [
                nodeOutcomeEffect("opportunity", "ancients_way_route_opportunity", "cut_the_snow_steps", "Cut the Snow Steps", [
                  "ancients_snow_steps_cut",
                ]),
                { kind: "hero_max_life", value: 4 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "cache_the_warming_draughts",
              title: "Cache the Warming Draughts",
              subtitle: "Shrine Opportunity",
              description: "Keep the blessing inside the reserve packs and arrive on the summit less depleted.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "ancients_way_route_opportunity",
                  "cache_the_warming_draughts",
                  "Cache the Warming Draughts",
                  ["ancients_warming_draughts_cached"]
                ),
                { kind: "hero_potion_heal", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "warband_column",
          title: "Warband Column",
          description: "A warband blessing can steady the summit porters or sharpen the reserve banners marching with you.",
          summary: "The warband blessing opens a broader Harrogath support package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_warband"],
          choices: [
            {
              id: "marshal_the_peak_porters",
              title: "Marshal the Peak Porters",
              subtitle: "Shrine Opportunity",
              description: "Spread the blessing across the whole climbing column and keep the march healthier.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "ancients_way_route_opportunity",
                  "marshal_the_peak_porters",
                  "Marshal the Peak Porters",
                  ["ancients_peak_porters_marshaled"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "ready_the_banner_reserve",
              title: "Ready the Banner Reserve",
              subtitle: "Shrine Opportunity",
              description: "Keep the blessing in reserve around the war banners and climb with a harder escort line.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "ancients_way_route_opportunity",
                  "ready_the_banner_reserve",
                  "Ready the Banner Reserve",
                  ["ancients_banner_reserve_readied"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "watchfire_ring",
          title: "Watchfire Ring",
          description: "A watchfire blessing can turn the last climb into a ring of steadier summit fires.",
          summary: "The watchfire blessing opens a final mountain reserve package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_watchfires"],
          choices: [
            {
              id: "ring_the_watchfires",
              title: "Ring the Watchfires",
              subtitle: "Shrine Opportunity",
              description: "Spread the shrine's watchfires across the whole climb and make the route steadier.",
              effects: [
                nodeOutcomeEffect("opportunity", "ancients_way_route_opportunity", "ring_the_watchfires", "Ring the Watchfires", [
                  "ancients_watchfires_ringed",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "captains_watch",
          title: "Captain's Watch",
          description: "With the Harrogath Captain under contract, the warband blessing can become a true captain's watch over the summit road.",
          summary: "A contracted captain turns the shrine lane into a real final-act command payoff.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_warband"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            {
              id: "drill_the_peak_guard",
              title: "Drill the Peak Guard",
              subtitle: "Shrine Opportunity",
              description: "Let the captain turn the shrine's favor into a drilled guard on the highest road.",
              effects: [
                nodeOutcomeEffect("opportunity", "ancients_way_route_opportunity", "drill_the_peak_guard", "Drill the Peak Guard", [
                  "harrogath_peak_guard_drilled",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_life", value: 3 },
              ],
            },
            {
              id: "marshal_the_summit_reserve",
              title: "Marshal the Summit Reserve",
              subtitle: "Shrine Opportunity",
              description: "Use the same command line to keep a summit reserve marshaled behind the climb.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "ancients_way_route_opportunity",
                  "marshal_the_summit_reserve",
                  "Marshal the Summit Reserve",
                  ["harrogath_summit_reserve_marshaled"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
          ],
        },
      ],
    },
  };

  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  Object.assign(runtimeWindow.__ROUGE_OPP_STAGING.shrineOpportunityDefinitions, SHRINE_OPPORTUNITY_DEFINITIONS_B);
})();
