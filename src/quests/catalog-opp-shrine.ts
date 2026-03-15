(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const { nodeOutcomeEffect } = helpers;

  const SHRINE_OPPORTUNITY_DEFINITIONS: Record<number, ShrineOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_vigil_route_opportunity",
      title: "Vigil Route Opportunity",
      zoneTitle: "Vigil Opportunity",
      description: "The vigil blessing opens a second route-side lane built around barricades, supply fires, or a contracted scout screen.",
      summary: "The shrine now opens its own later payoff instead of feeding only the main quest lane.",
      grants: { gold: 6, xp: 8, potions: 0 },
      requiresShrineId: "rogue_vigil_shrine",
      variants: [
        {
          id: "grit_redoubt",
          title: "Grit Redoubt",
          description: "A grit blessing can harden the route into either a barricaded redoubt or a better-stocked watch line.",
          summary: "The endurance blessing opens a sturdier roadside package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_grit"],
          choices: [
            {
              id: "raise_the_barricades",
              title: "Raise the Barricades",
              subtitle: "Shrine Opportunity",
              description: "Turn the shrine's endurance rite into a real barricade line around the route camp.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_vigil_route_opportunity", "raise_the_barricades", "Raise the Barricades", [
                  "rogue_vigil_barricades_raised",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "stock_the_watchfires",
              title: "Stock the Watchfires",
              subtitle: "Shrine Opportunity",
              description: "Feed the night line instead of the walls and keep the watch healthier through attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_vigil_route_opportunity", "stock_the_watchfires", "Stock the Watchfires", [
                  "rogue_vigil_watchfires_stocked",
                ]),
                { kind: "hero_potion_heal", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
          ],
        },
        {
          id: "volley_line",
          title: "Volley Line",
          description: "A volley blessing can become either a stocked firing line or a steadier archer post network.",
          summary: "The ranged blessing opens a sharper perimeter package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_volley"],
          choices: [
            {
              id: "stack_the_arrow_crates",
              title: "Stack the Arrow Crates",
              subtitle: "Shrine Opportunity",
              description: "Put the blessing into ammunition and keep the route escort dangerous.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_vigil_route_opportunity", "stack_the_arrow_crates", "Stack the Arrow Crates", [
                  "rogue_vigil_arrow_crates_stacked",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
            {
              id: "roof_the_archer_posts",
              title: "Roof the Archer Posts",
              subtitle: "Shrine Opportunity",
              description: "Use the shrine's favor to stabilize the archer posts instead of spending it on raw supplies.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_vigil_route_opportunity", "roof_the_archer_posts", "Roof the Archer Posts", [
                  "rogue_vigil_archer_posts_roofed",
                ]),
                { kind: "hero_max_energy", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "beacon_bastion",
          title: "Beacon Bastion",
          description: "A beacon blessing can harden the route into a lantern-marked bastion instead of a simple firing line.",
          summary: "The beacon blessing opens a steadier signal-post package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_beacons"],
          choices: [
            {
              id: "raise_the_signal_lanterns",
              title: "Raise the Signal Lanterns",
              subtitle: "Shrine Opportunity",
              description: "Turn the shrine's beacons into a true signal line that steadies the next route stretch.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "rogue_vigil_route_opportunity",
                  "raise_the_signal_lanterns",
                  "Raise the Signal Lanterns",
                  ["rogue_vigil_signal_lanterns"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
          ],
        },
        {
          id: "scout_screen",
          title: "Scout Screen",
          description: "With a rogue scout under contract, the volley blessing can become a true forward screen instead of a simple firing line.",
          summary: "A contracted scout turns the shrine lane into real route intelligence.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_volley"],
          requiresMercenaryIds: ["rogue_scout"],
          choices: [
            {
              id: "post_the_forward_spotters",
              title: "Post the Forward Spotters",
              subtitle: "Shrine Opportunity",
              description: "Let the scout turn the shrine's favor into an actual forward spotter net.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "rogue_vigil_route_opportunity",
                  "post_the_forward_spotters",
                  "Post the Forward Spotters",
                  ["rogue_route_forward_spotters"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "mark_the_flank_trails",
              title: "Mark the Flank Trails",
              subtitle: "Shrine Opportunity",
              description: "Use the same contract to turn the vigil line into safer flank trails for the next stretch.",
              effects: [
                nodeOutcomeEffect("opportunity", "rogue_vigil_route_opportunity", "mark_the_flank_trails", "Mark the Flank Trails", [
                  "rogue_route_flank_trails",
                ]),
                { kind: "hero_max_life", value: 2 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_shrine_opportunity",
      title: "Sunwell Route Opportunity",
      zoneTitle: "Sunwell Vigil",
      description: "The Sunwell blessing opens a second desert lane built around beacons, reserve casks, or a contracted spearwall screen.",
      summary: "The shrine now branches into its own caravan-side payoff.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresShrineId: "sunwell_shrine",
      variants: [
        {
          id: "sunwell_batteries",
          title: "Sunwell Batteries",
          description: "A sun blessing can feed either a cleaner beacon line or better reserve stores across the march.",
          summary: "The focus blessing opens a cleaner desert reserve package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_sun"],
          choices: [
            {
              id: "align_the_water_beacons",
              title: "Align the Water Beacons",
              subtitle: "Shrine Opportunity",
              description: "Put the shrine's focus into the beacon chain and keep the route clearer under pressure.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "align_the_water_beacons", "Align the Water Beacons", [
                  "sunwell_water_beacons_aligned",
                ]),
                { kind: "hero_max_energy", value: 1 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "bless_the_reserve_casks",
              title: "Bless the Reserve Casks",
              subtitle: "Shrine Opportunity",
              description: "Carry the blessing into the reserve casks and make the caravan healthier through attrition.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "bless_the_reserve_casks", "Bless the Reserve Casks", [
                  "sunwell_reserve_casks_blessed",
                ]),
                { kind: "gold_bonus", value: 12 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "march_reserve",
          title: "March Reserve",
          description: "A march blessing can brace the whole caravan or sharpen the guards walking beside it.",
          summary: "The caravan blessing now opens a sturdier escort lane.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_march"],
          choices: [
            {
              id: "brace_the_pack_column",
              title: "Brace the Pack Column",
              subtitle: "Shrine Opportunity",
              description: "Use the shrine's discipline on the whole marching column instead of only the front line.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "brace_the_pack_column", "Brace the Pack Column", [
                  "sunwell_pack_column_braced",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
            {
              id: "drill_the_supply_guard",
              title: "Drill the Supply Guard",
              subtitle: "Shrine Opportunity",
              description: "Turn the same blessing into a tighter guard around the water train and reserve wagons.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "drill_the_supply_guard", "Drill the Supply Guard", [
                  "sunwell_supply_guard_drilled",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 10 },
              ],
            },
          ],
        },
        {
          id: "welltrain_reserve",
          title: "Welltrain Reserve",
          description: "A welltrain blessing can anchor a cleaner reserve post chain across the caravan route.",
          summary: "The welltrain blessing opens a steadier desert reserve package.",
          grants: { gold: 4, xp: 6, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_welltrain"],
          choices: [
            {
              id: "stage_the_welltrain_posts",
              title: "Stage the Welltrain Posts",
              subtitle: "Shrine Opportunity",
              description: "Use the shrine's welltrain favor to stage steadier reserve posts across the desert push.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "sunwell_shrine_opportunity",
                  "stage_the_welltrain_posts",
                  "Stage the Welltrain Posts",
                  ["sunwell_welltrain_posts_staged"]
                ),
                { kind: "hero_potion_heal", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "desert_spearline",
          title: "Desert Spearline",
          description: "With a desert guard under contract, the march blessing can turn into a true spearline route instead of simple caravan discipline.",
          summary: "A contracted guard turns the shrine lane into a spearwall payoff.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresShrineOutcomeIds: ["blessing_of_the_march"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            {
              id: "fix_the_spearwall_posts",
              title: "Fix the Spearwall Posts",
              subtitle: "Shrine Opportunity",
              description: "Use the contracted guard to establish a line of true spearwall posts across the desert route.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "fix_the_spearwall_posts", "Fix the Spearwall Posts", [
                  "sunwell_spearwall_posts",
                ]),
                { kind: "hero_max_life", value: 3 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
            {
              id: "drive_the_shield_train",
              title: "Drive the Shield Train",
              subtitle: "Shrine Opportunity",
              description: "Put the guard at the front of the column and let the desert route move under a shield train.",
              effects: [
                nodeOutcomeEffect("opportunity", "sunwell_shrine_opportunity", "drive_the_shield_train", "Drive the Shield Train", [
                  "sunwell_shield_train",
                ]),
                { kind: "mercenary_attack", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
      ],
    },
  };


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.shrineOpportunityDefinitions = SHRINE_OPPORTUNITY_DEFINITIONS;
})();
