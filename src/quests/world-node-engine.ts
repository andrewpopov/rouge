(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function questOutcomeEffect(questId, outcomeId, outcomeTitle, flagIds = []) {
    return {
      kind: "record_quest_outcome",
      questId,
      outcomeId,
      outcomeTitle,
      flagIds: [...flagIds],
    };
  }

  function nodeOutcomeEffect(nodeType, nodeId, outcomeId, outcomeTitle, flagIds = []) {
    return {
      kind: "record_node_outcome",
      nodeType,
      nodeId,
      outcomeId,
      outcomeTitle,
      flagIds: [...flagIds],
    };
  }

  function questFollowUpEffect(questId, nodeId, outcomeId, outcomeTitle, consequenceId, flagIds = []) {
    return {
      kind: "record_quest_follow_up",
      questId,
      nodeId,
      outcomeId,
      outcomeTitle,
      consequenceId,
      flagIds: [...flagIds],
    };
  }

  function questConsequenceEffect(questId, outcomeId, outcomeTitle, consequenceId, flagIds = []) {
    return {
      kind: "record_quest_consequence",
      questId,
      outcomeId,
      outcomeTitle,
      consequenceId,
      flagIds: [...flagIds],
    };
  }

  const QUEST_DEFINITIONS: Record<number, QuestNodeDefinition> = {
    1: {
      kind: "quest",
      id: "tristram_relief",
      title: "Tristram Relief",
      zoneTitle: "Tristram Relief",
      description: "Survivors and abandoned supplies lie off the main route. Resolve the crisis without spending a combat node.",
      summary: "A field relief mission opens beside the act route.",
      grants: { gold: 6, xp: 8, potions: 0 },
      choices: [
        {
          id: "escort_survivors",
          title: "Escort Survivors",
          subtitle: "Quest Outcome",
          description: "Lead the refugees back to camp and stabilize the line with field medicine.",
          effects: [
            questOutcomeEffect("tristram_relief", "escort_survivors", "Escort Survivors", ["tristram_refugees_secured"]),
            { kind: "hero_max_life", value: 4 },
            { kind: "refill_potions", value: 1 },
          ],
          followUp: {
            id: "tristram_relief_refugee_caravan",
            title: "Refugee Caravan",
            description: "The survivors you saved want to repay the escort with labor, scouts, and road discipline.",
            summary: "Your earlier rescue created a second route-side payoff.",
            grants: { gold: 8, xp: 8, potions: 0 },
            choices: [
              {
                id: "quarter_the_caravan",
                title: "Quarter the Caravan",
                subtitle: "Quest Aftermath",
                description: "House the refugees inside the route camp and let the line harden around them.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "quarter_the_caravan", "Quarter the Caravan", [
                    "tristram_caravan_secured",
                  ]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "quarter_the_caravan",
                    "Quarter the Caravan",
                    "caravan_secured",
                    ["tristram_caravan_secured"]
                  ),
                  { kind: "hero_max_life", value: 3 },
                  { kind: "gold_bonus", value: 12 },
                ],
              },
              {
                id: "train_the_watch",
                title: "Train the Watch",
                subtitle: "Quest Aftermath",
                description: "Turn the rescued townsfolk into sentries and stretch the escort line wider.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "train_the_watch", "Train the Watch", ["tristram_watch_trained"]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "train_the_watch",
                    "Train the Watch",
                    "watch_trained",
                    ["tristram_watch_trained"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "salvage_cache",
          title: "Salvage Cache",
          subtitle: "Quest Outcome",
          description: "Strip the ruined wagons for gear and keep the best pieces for the road ahead.",
          effects: [
            questOutcomeEffect("tristram_relief", "salvage_cache", "Salvage Cache", ["tristram_salvage_claimed"]),
            { kind: "gold_bonus", value: 20 },
            { kind: "mercenary_max_life", value: 4 },
          ],
          followUp: {
            id: "tristram_relief_salvage_auction",
            title: "Salvage Auction",
            description: "The camp quartermasters turn your haul into either coin flow or field gear.",
            summary: "The salvaged convoy opens one more route transaction.",
            grants: { gold: 6, xp: 8, potions: 0 },
            choices: [
              {
                id: "sell_to_the_rogues",
                title: "Sell to the Rogues",
                subtitle: "Quest Aftermath",
                description: "Move the best pieces fast and take coin instead of comfort.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "sell_to_the_rogues", "Sell to the Rogues", [
                    "tristram_salvage_sold",
                  ]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "sell_to_the_rogues",
                    "Sell to the Rogues",
                    "salvage_sold",
                    ["tristram_salvage_sold"]
                  ),
                  { kind: "gold_bonus", value: 18 },
                  { kind: "hero_potion_heal", value: 1 },
                ],
              },
              {
                id: "forge_field_kits",
                title: "Forge Field Kits",
                subtitle: "Quest Aftermath",
                description: "Convert the metal into reinforced packs and harder escort gear.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "forge_field_kits", "Forge Field Kits", ["tristram_field_kits"]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "forge_field_kits",
                    "Forge Field Kits",
                    "field_kits_forged",
                    ["tristram_field_kits"]
                  ),
                  { kind: "mercenary_max_life", value: 4 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "take_scout_report",
          title: "Take Scout Report",
          subtitle: "Quest Outcome",
          description: "Secure the scout logs and turn the intel into a tighter marching plan.",
          effects: [
            questOutcomeEffect("tristram_relief", "take_scout_report", "Take Scout Report", ["tristram_scout_routes_mapped"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "gold_bonus", value: 10 },
          ],
          followUp: {
            id: "tristram_relief_night_watch",
            title: "Night Watch",
            description: "Your recovered scout logs create one final chance to tune the route.",
            summary: "The route intel turns into a follow-up logistics choice.",
            grants: { gold: 6, xp: 8, potions: 0 },
            choices: [
              {
                id: "mark_the_paths",
                title: "Mark the Paths",
                subtitle: "Quest Aftermath",
                description: "Stake every side path and turn the report into cleaner movement under pressure.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "mark_the_paths", "Mark the Paths", ["tristram_paths_marked"]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "mark_the_paths",
                    "Mark the Paths",
                    "paths_marked",
                    ["tristram_paths_marked"]
                  ),
                  { kind: "hero_max_energy", value: 1 },
                  { kind: "gold_bonus", value: 8 },
                ],
              },
              {
                id: "arm_the_sentries",
                title: "Arm the Sentries",
                subtitle: "Quest Aftermath",
                description: "Put the route details in the hands of people who can actually hold it.",
                effects: [
                  nodeOutcomeEffect("event", "tristram_relief_aftermath", "arm_the_sentries", "Arm the Sentries", ["tristram_sentries_armed"]),
                  questFollowUpEffect(
                    "tristram_relief",
                    "tristram_relief_aftermath",
                    "arm_the_sentries",
                    "Arm the Sentries",
                    "sentries_armed",
                    ["tristram_sentries_armed"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "hero_max_life", value: 2 },
                ],
              },
            ],
          },
        },
      ],
    },
    2: {
      kind: "quest",
      id: "lost_reliquary",
      title: "Lost Reliquary",
      zoneTitle: "Lost Reliquary",
      description: "A Horadric reliquary sits beyond the main route. Preserve it, plunder it, or weaponize it.",
      summary: "A buried reliquary offers a non-combat route reward.",
      grants: { gold: 8, xp: 10, potions: 0 },
      choices: [
        {
          id: "seal_the_chamber",
          title: "Seal the Chamber",
          subtitle: "Quest Outcome",
          description: "Use the reliquary wards to protect the caravan and reinforce your endurance.",
          effects: [
            questOutcomeEffect("lost_reliquary", "seal_the_chamber", "Seal the Chamber", ["lost_reliquary_sealed"]),
            { kind: "hero_max_life", value: 5 },
            { kind: "refill_potions", value: 1 },
          ],
          followUp: {
            id: "lost_reliquary_ward_relay",
            title: "Ward Relay",
            description: "The sealed chamber still channels power if you choose where the wardline terminates.",
            summary: "The sealed reliquary creates a delayed defensive payoff.",
            grants: { gold: 8, xp: 10, potions: 0 },
            choices: [
              {
                id: "relay_to_the_caravan",
                title: "Relay to the Caravan",
                subtitle: "Quest Aftermath",
                description: "Anchor the wards to the caravan line and make every rest stop safer.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "relay_to_the_caravan", "Relay to the Caravan", [
                    "lost_reliquary_caravan_warded",
                  ]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "relay_to_the_caravan",
                    "Relay to the Caravan",
                    "caravan_warded",
                    ["lost_reliquary_caravan_warded"]
                  ),
                  { kind: "hero_max_life", value: 3 },
                  { kind: "hero_potion_heal", value: 2 },
                ],
              },
              {
                id: "relay_to_the_scouts",
                title: "Relay to the Scouts",
                subtitle: "Quest Aftermath",
                description: "Push the wards forward and let your outriders travel farther without folding.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "relay_to_the_scouts", "Relay to the Scouts", [
                    "lost_reliquary_scouts_warded",
                  ]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "relay_to_the_scouts",
                    "Relay to the Scouts",
                    "scouts_warded",
                    ["lost_reliquary_scouts_warded"]
                  ),
                  { kind: "mercenary_max_life", value: 4 },
                  { kind: "mercenary_attack", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "harvest_the_relics",
          title: "Harvest the Relics",
          subtitle: "Quest Outcome",
          description: "Break the seal and convert the find into belt supplies and coin.",
          effects: [
            questOutcomeEffect("lost_reliquary", "harvest_the_relics", "Harvest the Relics", ["lost_reliquary_harvested"]),
            { kind: "belt_capacity", value: 1 },
            { kind: "gold_bonus", value: 16 },
          ],
          followUp: {
            id: "lost_reliquary_relic_market",
            title: "Relic Market",
            description: "Breaking the chamber leaves one more chance to cash out or keep the best fragments.",
            summary: "The plundered reliquary drives a second decision on the route.",
            grants: { gold: 10, xp: 8, potions: 0 },
            choices: [
              {
                id: "auction_the_fragments",
                title: "Auction the Fragments",
                subtitle: "Quest Aftermath",
                description: "Sell the fragments to passing buyers and take the liquidity.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "auction_the_fragments", "Auction the Fragments", [
                    "lost_reliquary_fragments_sold",
                  ]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "auction_the_fragments",
                    "Auction the Fragments",
                    "fragments_sold",
                    ["lost_reliquary_fragments_sold"]
                  ),
                  { kind: "gold_bonus", value: 20 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
              {
                id: "keep_the_core",
                title: "Keep the Core",
                subtitle: "Quest Aftermath",
                description: "Reserve the cleanest relic core for yourself and cut less of the take.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "keep_the_core", "Keep the Core", ["lost_reliquary_core_kept"]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "keep_the_core",
                    "Keep the Core",
                    "core_kept",
                    ["lost_reliquary_core_kept"]
                  ),
                  { kind: "hero_max_energy", value: 1 },
                  { kind: "belt_capacity", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "arm_the_caravan",
          title: "Arm the Caravan",
          subtitle: "Quest Outcome",
          description: "Trade relic steel for hardened escort gear and a more dangerous mercenary line.",
          effects: [
            questOutcomeEffect("lost_reliquary", "arm_the_caravan", "Arm the Caravan", ["lost_reliquary_caravan_armed"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "mercenary_max_life", value: 4 },
          ],
          followUp: {
            id: "lost_reliquary_steel_caravan",
            title: "Steel Caravan",
            description: "The new escort kit can be finished for speed or for staying power.",
            summary: "Weaponizing the reliquary opens a follow-up outfitting stop.",
            grants: { gold: 6, xp: 10, potions: 0 },
            choices: [
              {
                id: "issue_lance_racks",
                title: "Issue Lance Racks",
                subtitle: "Quest Aftermath",
                description: "Standardize the escort weapons and lean into pressure.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "issue_lance_racks", "Issue Lance Racks", [
                    "lost_reliquary_lance_racks",
                  ]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "issue_lance_racks",
                    "Issue Lance Racks",
                    "lance_racks_issued",
                    ["lost_reliquary_lance_racks"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "gold_bonus", value: 10 },
                ],
              },
              {
                id: "plate_the_pack_mules",
                title: "Plate the Pack Mules",
                subtitle: "Quest Aftermath",
                description: "Use the same steel to keep the whole route standing through attrition.",
                effects: [
                  nodeOutcomeEffect("event", "lost_reliquary_aftermath", "plate_the_pack_mules", "Plate the Pack Mules", [
                    "lost_reliquary_pack_mules_plated",
                  ]),
                  questFollowUpEffect(
                    "lost_reliquary",
                    "lost_reliquary_aftermath",
                    "plate_the_pack_mules",
                    "Plate the Pack Mules",
                    "pack_mules_plated",
                    ["lost_reliquary_pack_mules_plated"]
                  ),
                  { kind: "mercenary_max_life", value: 5 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
            ],
          },
        },
      ],
    },
    3: {
      kind: "quest",
      id: "smugglers_wake",
      title: "Smuggler's Wake",
      zoneTitle: "Smuggler's Wake",
      description: "A Kurast dockside deal can fund the run, strengthen the escort, or refit the hero for deeper temple pressure.",
      summary: "A dockside contact offers a quest resolution instead of a fight.",
      grants: { gold: 10, xp: 12, potions: 0 },
      choices: [
        {
          id: "move_the_contraband",
          title: "Move the Contraband",
          subtitle: "Quest Outcome",
          description: "Run the cargo and keep a percentage of the take.",
          effects: [
            questOutcomeEffect("smugglers_wake", "move_the_contraband", "Move the Contraband", ["smugglers_wake_contraband_moved"]),
            { kind: "gold_bonus", value: 26 },
            { kind: "refill_potions", value: 1 },
          ],
          followUp: {
            id: "smugglers_wake_dockside_cut",
            title: "Dockside Cut",
            description: "The contact now offers either cleaner cashflow or better road gear from the same run.",
            summary: "Smuggling success creates a second route-side payout.",
            grants: { gold: 10, xp: 10, potions: 0 },
            choices: [
              {
                id: "pay_the_port_tax",
                title: "Pay the Port Tax",
                subtitle: "Quest Aftermath",
                description: "Spend a little to move the whole cut safely and come out ahead.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "pay_the_port_tax", "Pay the Port Tax", [
                    "smugglers_wake_port_tax_paid",
                  ]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "pay_the_port_tax",
                    "Pay the Port Tax",
                    "port_tax_paid",
                    ["smugglers_wake_port_tax_paid"]
                  ),
                  { kind: "gold_bonus", value: 20 },
                  { kind: "hero_potion_heal", value: 1 },
                ],
              },
              {
                id: "stash_the_bales",
                title: "Stash the Bales",
                subtitle: "Quest Aftermath",
                description: "Keep the goods tucked into your own route caches and ride the supply bump.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "stash_the_bales", "Stash the Bales", ["smugglers_wake_bales_stashed"]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "stash_the_bales",
                    "Stash the Bales",
                    "bales_stashed",
                    ["smugglers_wake_bales_stashed"]
                  ),
                  { kind: "belt_capacity", value: 1 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "purify_the_idol",
          title: "Purify the Idol",
          subtitle: "Quest Outcome",
          description: "Break a blood idol and turn the fragments into cleaner arcane reserves.",
          effects: [
            questOutcomeEffect("smugglers_wake", "purify_the_idol", "Purify the Idol", ["smugglers_wake_idol_purified"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "hero_potion_heal", value: 2 },
          ],
          followUp: {
            id: "smugglers_wake_sanctified_wake",
            title: "Sanctified Wake",
            description: "The purified idol leaves behind one final choice between endurance and cleaner spell flow.",
            summary: "The broken idol keeps paying off one node later.",
            grants: { gold: 8, xp: 10, potions: 0 },
            choices: [
              {
                id: "cast_the_ashes_wide",
                title: "Cast the Ashes Wide",
                subtitle: "Quest Aftermath",
                description: "Spread the ash through the route and carry a wider buffer against attrition.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "cast_the_ashes_wide", "Cast the Ashes Wide", [
                    "smugglers_wake_ashes_cast",
                  ]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "cast_the_ashes_wide",
                    "Cast the Ashes Wide",
                    "ashes_cast",
                    ["smugglers_wake_ashes_cast"]
                  ),
                  { kind: "hero_max_life", value: 4 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
              {
                id: "bottle_the_resin",
                title: "Bottle the Resin",
                subtitle: "Quest Aftermath",
                description: "Keep the cleanest residue for the hero and travel with a sharper reserve.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "bottle_the_resin", "Bottle the Resin", [
                    "smugglers_wake_resin_bottled",
                  ]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "bottle_the_resin",
                    "Bottle the Resin",
                    "resin_bottled",
                    ["smugglers_wake_resin_bottled"]
                  ),
                  { kind: "hero_max_energy", value: 1 },
                  { kind: "gold_bonus", value: 10 },
                ],
              },
            ],
          },
        },
        {
          id: "hire_porters",
          title: "Hire Porters",
          subtitle: "Quest Outcome",
          description: "Use the deal to reinforce your companion line and keep pressure off the hero.",
          effects: [
            questOutcomeEffect("smugglers_wake", "hire_porters", "Hire Porters", ["smugglers_wake_porters_hired"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "mercenary_max_life", value: 5 },
          ],
          followUp: {
            id: "smugglers_wake_harbor_crew",
            title: "Harbor Crew",
            description: "The hired labor can either stay with the wagons or be folded into your fighting line.",
            summary: "The dockside hires become a second logistics choice.",
            grants: { gold: 8, xp: 10, potions: 0 },
            choices: [
              {
                id: "station_the_loaders",
                title: "Station the Loaders",
                subtitle: "Quest Aftermath",
                description: "Keep them on the route and turn the extra labor into safer supplies.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "station_the_loaders", "Station the Loaders", [
                    "smugglers_wake_loaders_stationed",
                  ]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "station_the_loaders",
                    "Station the Loaders",
                    "loaders_stationed",
                    ["smugglers_wake_loaders_stationed"]
                  ),
                  { kind: "mercenary_max_life", value: 5 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
              {
                id: "arm_the_foremen",
                title: "Arm the Foremen",
                subtitle: "Quest Aftermath",
                description: "Promote the best of them into hard escorts and accept the rougher route.",
                effects: [
                  nodeOutcomeEffect("event", "smugglers_wake_aftermath", "arm_the_foremen", "Arm the Foremen", [
                    "smugglers_wake_foremen_armed",
                  ]),
                  questFollowUpEffect(
                    "smugglers_wake",
                    "smugglers_wake_aftermath",
                    "arm_the_foremen",
                    "Arm the Foremen",
                    "foremen_armed",
                    ["smugglers_wake_foremen_armed"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "hero_max_life", value: 3 },
                ],
              },
            ],
          },
        },
      ],
    },
    4: {
      kind: "quest",
      id: "hellforge_claim",
      title: "Hellforge Claim",
      zoneTitle: "Hellforge Claim",
      description: "An anvil cache near the Hellforge can be spent on endurance, logistics, or a high-risk pact that spikes short-term power.",
      summary: "A hell-forged cache creates a non-combat power spike.",
      grants: { gold: 12, xp: 14, potions: 0 },
      choices: [
        {
          id: "temper_the_armor",
          title: "Temper the Armor",
          subtitle: "Quest Outcome",
          description: "Use the forge to harden the hero's kit for the sanctuary push.",
          effects: [
            questOutcomeEffect("hellforge_claim", "temper_the_armor", "Temper the Armor", ["hellforge_claim_armor_tempered"]),
            { kind: "hero_max_life", value: 6 },
            { kind: "hero_potion_heal", value: 2 },
          ],
          followUp: {
            id: "hellforge_claim_anvil_debts",
            title: "Anvil Debts",
            description: "The forgeworkers can still shape a last piece of value from the cooled plates.",
            summary: "Tempering the armor opens a delayed forge payout.",
            grants: { gold: 10, xp: 12, potions: 0 },
            choices: [
              {
                id: "set_the_rivets",
                title: "Set the Rivets",
                subtitle: "Quest Aftermath",
                description: "Finish the plates cleanly and keep leaning into raw staying power.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "set_the_rivets", "Set the Rivets", [
                    "hellforge_claim_rivets_set",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "set_the_rivets",
                    "Set the Rivets",
                    "rivets_set",
                    ["hellforge_claim_rivets_set"]
                  ),
                  { kind: "hero_max_life", value: 4 },
                  { kind: "gold_bonus", value: 12 },
                ],
              },
              {
                id: "quench_the_plating",
                title: "Quench the Plating",
                subtitle: "Quest Aftermath",
                description: "Draw some of the heat back out and turn the same work into better field recovery.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "quench_the_plating", "Quench the Plating", [
                    "hellforge_claim_plating_quenched",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "quench_the_plating",
                    "Quench the Plating",
                    "plating_quenched",
                    ["hellforge_claim_plating_quenched"]
                  ),
                  { kind: "hero_potion_heal", value: 2 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
            ],
          },
        },
        {
          id: "pack_siege_stores",
          title: "Pack Siege Stores",
          subtitle: "Quest Outcome",
          description: "Convert the cache into more belt space and a better-armed companion line.",
          effects: [
            questOutcomeEffect("hellforge_claim", "pack_siege_stores", "Pack Siege Stores", ["hellforge_claim_stores_packed"]),
            { kind: "belt_capacity", value: 1 },
            { kind: "mercenary_attack", value: 1 },
          ],
          followUp: {
            id: "hellforge_claim_siege_route",
            title: "Siege Route",
            description: "The packed stores can still be staged for speed or for attrition resistance.",
            summary: "The siege cache pays out again once the route settles.",
            grants: { gold: 8, xp: 12, potions: 0 },
            choices: [
              {
                id: "cache_the_reserve",
                title: "Cache the Reserve",
                subtitle: "Quest Aftermath",
                description: "Hide the reserve deeper on the route and carry more fallback supplies.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "cache_the_reserve", "Cache the Reserve", [
                    "hellforge_claim_reserve_cached",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "cache_the_reserve",
                    "Cache the Reserve",
                    "reserve_cached",
                    ["hellforge_claim_reserve_cached"]
                  ),
                  { kind: "belt_capacity", value: 1 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
              {
                id: "arm_the_porters",
                title: "Arm the Porters",
                subtitle: "Quest Aftermath",
                description: "Turn the same stores into pressure and accept a lighter reserve line.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "arm_the_porters", "Arm the Porters", [
                    "hellforge_claim_porters_armed",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "arm_the_porters",
                    "Arm the Porters",
                    "porters_armed",
                    ["hellforge_claim_porters_armed"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "gold_bonus", value: 14 },
                ],
              },
            ],
          },
        },
        {
          id: "take_the_pact",
          title: "Take the Pact",
          subtitle: "Quest Outcome",
          description: "Accept a dangerous bargain for sharper control and a cash infusion.",
          effects: [
            questOutcomeEffect("hellforge_claim", "take_the_pact", "Take the Pact", ["hellforge_claim_pact_taken"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "gold_bonus", value: 20 },
          ],
          followUp: {
            id: "hellforge_claim_hellmark_oath",
            title: "Hellmark Oath",
            description: "The bargain still has one clause left to cash in, and you choose where the pain lands.",
            summary: "The pact creates a second, explicit consequence node.",
            grants: { gold: 12, xp: 12, potions: 0 },
            choices: [
              {
                id: "bind_the_embers",
                title: "Bind the Embers",
                subtitle: "Quest Aftermath",
                description: "Keep the pact close and concentrate the power on the hero.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "bind_the_embers", "Bind the Embers", [
                    "hellforge_claim_embers_bound",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "bind_the_embers",
                    "Bind the Embers",
                    "embers_bound",
                    ["hellforge_claim_embers_bound"]
                  ),
                  { kind: "hero_max_energy", value: 1 },
                  { kind: "hero_max_life", value: 3 },
                ],
              },
              {
                id: "pay_the_crew",
                title: "Pay the Crew",
                subtitle: "Quest Aftermath",
                description: "Spend more of the bargain on the people carrying you to Diablo.",
                effects: [
                  nodeOutcomeEffect("event", "hellforge_claim_aftermath", "pay_the_crew", "Pay the Crew", [
                    "hellforge_claim_crew_paid",
                  ]),
                  questFollowUpEffect(
                    "hellforge_claim",
                    "hellforge_claim_aftermath",
                    "pay_the_crew",
                    "Pay the Crew",
                    "crew_paid",
                    ["hellforge_claim_crew_paid"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "gold_bonus", value: 16 },
                ],
              },
            ],
          },
        },
      ],
    },
    5: {
      kind: "quest",
      id: "harrogath_rescue",
      title: "Harrogath Rescue",
      zoneTitle: "Harrogath Rescue",
      description: "A trapped scouting party can be rescued, armed, or stripped for supplies before the Worldstone approach.",
      summary: "A late-run rescue event offers a final route-side decision.",
      grants: { gold: 14, xp: 16, potions: 0 },
      choices: [
        {
          id: "rescue_the_scouts",
          title: "Rescue the Scouts",
          subtitle: "Quest Outcome",
          description: "Bring the trapped scouts home and fold them into the warband.",
          effects: [
            questOutcomeEffect("harrogath_rescue", "rescue_the_scouts", "Rescue the Scouts", ["harrogath_rescue_scouts_saved"]),
            { kind: "mercenary_attack", value: 2 },
            { kind: "mercenary_max_life", value: 6 },
          ],
          followUp: {
            id: "harrogath_rescue_war_camp_muster",
            title: "War Camp Muster",
            description: "The rescued scouts can either hold the rear or be pushed straight into the climb.",
            summary: "The saved party creates a second war-camp choice before Baal.",
            grants: { gold: 10, xp: 14, potions: 0 },
            choices: [
              {
                id: "post_the_scouts",
                title: "Post the Scouts",
                subtitle: "Quest Aftermath",
                description: "Keep them on the route, make every fallback cleaner, and carry more supplies.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "post_the_scouts", "Post the Scouts", [
                    "harrogath_rescue_scouts_posted",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "post_the_scouts",
                    "Post the Scouts",
                    "scouts_posted",
                    ["harrogath_rescue_scouts_posted"]
                  ),
                  { kind: "refill_potions", value: 2 },
                  { kind: "mercenary_max_life", value: 4 },
                ],
              },
              {
                id: "lead_the_charge",
                title: "Lead the Charge",
                subtitle: "Quest Aftermath",
                description: "Use the extra bodies offensively and turn the rescue into forward pressure.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "lead_the_charge", "Lead the Charge", [
                    "harrogath_rescue_charge_led",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "lead_the_charge",
                    "Lead the Charge",
                    "charge_led",
                    ["harrogath_rescue_charge_led"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "hero_max_life", value: 4 },
                ],
              },
            ],
          },
        },
        {
          id: "secure_the_rations",
          title: "Secure the Rations",
          subtitle: "Quest Outcome",
          description: "Take the supply line and turn it into raw endurance for the final climb.",
          effects: [
            questOutcomeEffect("harrogath_rescue", "secure_the_rations", "Secure the Rations", ["harrogath_rescue_rations_secured"]),
            { kind: "belt_capacity", value: 1 },
            { kind: "refill_potions", value: 2 },
          ],
          followUp: {
            id: "harrogath_rescue_frozen_stores",
            title: "Frozen Stores",
            description: "The captured supplies can still be split between the hero and the whole column.",
            summary: "The saved ration line pays off one node later.",
            grants: { gold: 10, xp: 14, potions: 0 },
            choices: [
              {
                id: "stack_the_cache",
                title: "Stack the Cache",
                subtitle: "Quest Aftermath",
                description: "Keep the stores moving with you and maximize the reserve.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "stack_the_cache", "Stack the Cache", [
                    "harrogath_rescue_cache_stacked",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "stack_the_cache",
                    "Stack the Cache",
                    "cache_stacked",
                    ["harrogath_rescue_cache_stacked"]
                  ),
                  { kind: "belt_capacity", value: 1 },
                  { kind: "refill_potions", value: 1 },
                ],
              },
              {
                id: "boil_the_stock",
                title: "Boil the Stock",
                subtitle: "Quest Aftermath",
                description: "Burn through part of the reserve now and make the climb safer on the body.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "boil_the_stock", "Boil the Stock", [
                    "harrogath_rescue_stock_boiled",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "boil_the_stock",
                    "Boil the Stock",
                    "stock_boiled",
                    ["harrogath_rescue_stock_boiled"]
                  ),
                  { kind: "hero_max_life", value: 5 },
                  { kind: "hero_potion_heal", value: 2 },
                ],
              },
            ],
          },
        },
        {
          id: "swear_the_oath",
          title: "Swear the Oath",
          subtitle: "Quest Outcome",
          description: "Bind yourself to Harrogath's defense and push both stamina and focus upward.",
          effects: [
            questOutcomeEffect("harrogath_rescue", "swear_the_oath", "Swear the Oath", ["harrogath_rescue_oath_sworn"]),
            { kind: "hero_max_life", value: 8 },
            { kind: "hero_max_energy", value: 1 },
          ],
          followUp: {
            id: "harrogath_rescue_ancients_favor",
            title: "Ancients' Favor",
            description: "The oath resonates once more before the summit and forces one last commitment.",
            summary: "The oath path carries a final consequence node.",
            grants: { gold: 12, xp: 14, potions: 0 },
            choices: [
              {
                id: "carry_the_banner",
                title: "Carry the Banner",
                subtitle: "Quest Aftermath",
                description: "Take the oath fully onto yourself and climb with a larger personal reserve.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "carry_the_banner", "Carry the Banner", [
                    "harrogath_rescue_banner_carried",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "carry_the_banner",
                    "Carry the Banner",
                    "banner_carried",
                    ["harrogath_rescue_banner_carried"]
                  ),
                  { kind: "hero_max_life", value: 4 },
                  { kind: "hero_max_energy", value: 1 },
                ],
              },
              {
                id: "share_the_oath",
                title: "Share the Oath",
                subtitle: "Quest Aftermath",
                description: "Spread the promise across the warband and keep the whole line steadier.",
                effects: [
                  nodeOutcomeEffect("event", "harrogath_rescue_aftermath", "share_the_oath", "Share the Oath", [
                    "harrogath_rescue_oath_shared",
                  ]),
                  questFollowUpEffect(
                    "harrogath_rescue",
                    "harrogath_rescue_aftermath",
                    "share_the_oath",
                    "Share the Oath",
                    "oath_shared",
                    ["harrogath_rescue_oath_shared"]
                  ),
                  { kind: "mercenary_attack", value: 1 },
                  { kind: "hero_potion_heal", value: 2 },
                ],
              },
            ],
          },
        },
      ],
    },
  };

  const SHRINE_DEFINITIONS: Record<number, ShrineNodeDefinition> = {
    1: {
      kind: "shrine",
      id: "rogue_vigil_shrine",
      title: "Rogue Vigil Shrine",
      zoneTitle: "Vigil Shrine",
      description: "A rogue shrine offers a clean one-node blessing instead of another skirmish.",
      summary: "A roadside shrine offers a brief but meaningful blessing.",
      grants: { gold: 4, xp: 6, potions: 0 },
      choices: [
        {
          id: "blessing_of_grit",
          title: "Blessing of Grit",
          subtitle: "Shrine Blessing",
          description: "Take the camp's endurance rite and steady the hero for a longer act.",
          effects: [
            nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_grit", "Blessing of Grit", ["rogue_vigil_grit"]),
            { kind: "hero_max_life", value: 4 },
            { kind: "refill_potions", value: 1 },
          ],
        },
        {
          id: "blessing_of_volley",
          title: "Blessing of Volley",
          subtitle: "Shrine Blessing",
          description: "Lean into the ranged line and keep the escort dangerous.",
          effects: [
            nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_volley", "Blessing of Volley", ["rogue_vigil_volley"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "gold_bonus", value: 8 },
          ],
        },
      ],
    },
    2: {
      kind: "shrine",
      id: "sunwell_shrine",
      title: "Sunwell Shrine",
      zoneTitle: "Sunwell Shrine",
      description: "A desert shrine offers either cleaner reserves or harder caravan discipline.",
      summary: "A desert shrine lets you convert route time into a focused blessing.",
      grants: { gold: 6, xp: 8, potions: 0 },
      choices: [
        {
          id: "blessing_of_the_sun",
          title: "Blessing of the Sun",
          subtitle: "Shrine Blessing",
          description: "Use the shrine to reclaim some focus and carry better recovery into the tombs.",
          effects: [
            nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_sun", "Blessing of the Sun", ["sunwell_focus"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "hero_potion_heal", value: 1 },
          ],
        },
        {
          id: "blessing_of_the_march",
          title: "Blessing of the March",
          subtitle: "Shrine Blessing",
          description: "Put the blessing into caravan discipline and a sturdier escort line.",
          effects: [
            nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_march", "Blessing of the March", ["sunwell_march"]),
            { kind: "mercenary_max_life", value: 4 },
            { kind: "refill_potions", value: 1 },
          ],
        },
      ],
    },
    3: {
      kind: "shrine",
      id: "jade_shrine",
      title: "Jade Shrine",
      zoneTitle: "Jade Shrine",
      description: "A jungle shrine offers either disciplined reserves or a better-fed route cache.",
      summary: "A Kurast shrine trades a short detour for a permanent run edge.",
      grants: { gold: 8, xp: 10, potions: 0 },
      choices: [
        {
          id: "blessing_of_tides",
          title: "Blessing of Tides",
          subtitle: "Shrine Blessing",
          description: "Smooth the hero's reserves and keep the route cleaner under curse-heavy pressure.",
          effects: [
            nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_tides", "Blessing of Tides", ["jade_shrine_tides"]),
            { kind: "hero_max_energy", value: 1 },
            { kind: "gold_bonus", value: 10 },
          ],
        },
        {
          id: "blessing_of_the_storehouse",
          title: "Blessing of the Storehouse",
          subtitle: "Shrine Blessing",
          description: "Anchor the shrine's favor into the route supply chain instead of the hero directly.",
          effects: [
            nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_the_storehouse", "Blessing of the Storehouse", ["jade_shrine_storehouse"]),
            { kind: "belt_capacity", value: 1 },
            { kind: "refill_potions", value: 1 },
          ],
        },
      ],
    },
    4: {
      kind: "shrine",
      id: "infernal_altar",
      title: "Infernal Altar",
      zoneTitle: "Infernal Altar",
      description: "An infernal altar offers either raw staying power or an aggressively armed line.",
      summary: "A hellish shrine turns one route stop into a durable blessing.",
      grants: { gold: 10, xp: 12, potions: 0 },
      choices: [
        {
          id: "blessing_of_iron",
          title: "Blessing of Iron",
          subtitle: "Shrine Blessing",
          description: "Take the altar's protection and harden your body before the sanctuary climb.",
          effects: [
            nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_iron", "Blessing of Iron", ["infernal_altar_iron"]),
            { kind: "hero_max_life", value: 5 },
            { kind: "hero_potion_heal", value: 1 },
          ],
        },
        {
          id: "blessing_of_warfire",
          title: "Blessing of Warfire",
          subtitle: "Shrine Blessing",
          description: "Turn the altar outward and let the whole line hit harder on the next stretch.",
          effects: [
            nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_warfire", "Blessing of Warfire", ["infernal_altar_warfire"]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "gold_bonus", value: 12 },
          ],
        },
      ],
    },
    5: {
      kind: "shrine",
      id: "ancients_way_shrine",
      title: "Ancients' Way Shrine",
      zoneTitle: "Ancients' Way Shrine",
      description: "A mountain shrine offers either personal endurance or broader warband readiness.",
      summary: "A summit shrine converts route time into a final act blessing.",
      grants: { gold: 12, xp: 14, potions: 0 },
      choices: [
        {
          id: "blessing_of_the_summit",
          title: "Blessing of the Summit",
          subtitle: "Shrine Blessing",
          description: "Take the shrine directly and climb with a larger personal buffer.",
          effects: [
            nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_the_summit", "Blessing of the Summit", [
              "ancients_way_summit",
            ]),
            { kind: "hero_max_life", value: 6 },
            { kind: "hero_max_energy", value: 1 },
          ],
        },
        {
          id: "blessing_of_the_warband",
          title: "Blessing of the Warband",
          subtitle: "Shrine Blessing",
          description: "Spread the shrine across the whole line and make the final march steadier.",
          effects: [
            nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_the_warband", "Blessing of the Warband", [
              "ancients_way_warband",
            ]),
            { kind: "mercenary_attack", value: 1 },
            { kind: "refill_potions", value: 2 },
          ],
        },
      ],
    },
  };

  const EVENT_DEFINITIONS: Record<number, EventNodeDefinition> = {
    1: {
      kind: "event",
      id: "tristram_relief_aftermath",
      title: "Tristram Aftermath",
      zoneTitle: "Tristram Aftermath",
      description: "The Tristram detour creates one more follow-up choice after the first relief decision is made.",
      summary: "Your earlier Tristram choice changes what this route-side event offers.",
      grants: { gold: 6, xp: 8, potions: 0 },
      requiresQuestId: "tristram_relief",
    },
    2: {
      kind: "event",
      id: "lost_reliquary_aftermath",
      title: "Reliquary Aftermath",
      zoneTitle: "Reliquary Aftermath",
      description: "Whatever you did with the reliquary now generates a second route consequence.",
      summary: "The reliquary path pays off again based on your first choice.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
    },
    3: {
      kind: "event",
      id: "smugglers_wake_aftermath",
      title: "Dockside Aftermath",
      zoneTitle: "Dockside Aftermath",
      description: "The Kurast deal continues to echo through the route after the first transaction settles.",
      summary: "Your dockside choice opens a second, outcome-specific event.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "smugglers_wake",
    },
    4: {
      kind: "event",
      id: "hellforge_claim_aftermath",
      title: "Hellforge Aftermath",
      zoneTitle: "Hellforge Aftermath",
      description: "The Hellforge claim does not settle cleanly; the route gets one more follow-up choice.",
      summary: "The Hellforge route now includes an explicit consequence node.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
    },
    5: {
      kind: "event",
      id: "harrogath_rescue_aftermath",
      title: "Harrogath Aftermath",
      zoneTitle: "Harrogath Aftermath",
      description: "The rescue decision feeds directly into one more war-camp or supply-line consequence.",
      summary: "Your final act quest now opens a second route-side choice.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
    },
  };

  const OPPORTUNITY_DEFINITIONS: Record<number, OpportunityNodeDefinition> = {
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
    4: {
      kind: "opportunity",
      id: "hellforge_route_opportunity",
      title: "Hellforge Route Opportunity",
      zoneTitle: "Hellforge Opportunity",
      description: "The forge claim still leaves one more infernal route opening after the aftermath is settled.",
      summary: "A third route node now cashes out the Hellforge chain.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      variants: [
        {
          id: "plated_bulwark",
          title: "Plated Bulwark",
          description: "The tempered armor line can become either a standing bulwark or a hotter strike kit.",
          summary: "The armor-forging chain opens a final plating decision.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          choices: [
            {
              id: "raise_the_plate_wall",
              title: "Raise the Plate Wall",
              subtitle: "Route Opportunity",
              description: "Use the fitted armor to harden the route wall before the sanctuary climb.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "hellforge_route_opportunity",
                  "raise_the_plate_wall",
                  "Raise the Plate Wall",
                  ["hellforge_plate_wall"]
                ),
                questConsequenceEffect(
                  "hellforge_claim",
                  "raise_the_plate_wall",
                  "Raise the Plate Wall",
                  "plate_wall_raised",
                  ["hellforge_plate_wall"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "temper_the_strike_gear",
              title: "Temper the Strike Gear",
              subtitle: "Route Opportunity",
              description: "Keep the best forging in the vanguard and let the line hit harder.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "hellforge_route_opportunity",
                  "temper_the_strike_gear",
                  "Temper the Strike Gear",
                  ["hellforge_strike_gear"]
                ),
                questConsequenceEffect(
                  "hellforge_claim",
                  "temper_the_strike_gear",
                  "Temper the Strike Gear",
                  "strike_gear_tempered",
                  ["hellforge_strike_gear"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "siege_reserve",
          title: "Siege Reserve",
          description: "The packed stores can become a safer reserve or an armed carrying train.",
          summary: "The siege stores chain now opens a final reserve decision.",
          grants: { gold: 6, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["cache_the_reserve", "arm_the_porters"],
          choices: [
            {
              id: "bury_the_black_cache",
              title: "Bury the Black Cache",
              subtitle: "Route Opportunity",
              description: "Hide the clean reserve and save it for the boss road.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "bury_the_black_cache", "Bury the Black Cache", [
                  "hellforge_black_cache",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "bury_the_black_cache",
                  "Bury the Black Cache",
                  "black_cache_buried",
                  ["hellforge_black_cache"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "arm_the_haulers",
              title: "Arm the Haulers",
              subtitle: "Route Opportunity",
              description: "Turn the porters into an armed hauling line and keep the march aggressive.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "arm_the_haulers", "Arm the Haulers", [
                  "hellforge_haulers_armed",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "arm_the_haulers",
                  "Arm the Haulers",
                  "haulers_armed",
                  ["hellforge_haulers_armed"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "ember_bargain",
          title: "Ember Bargain",
          description: "The infernal pact can become a bound ember stock or a paid warband dividend.",
          summary: "The pact chain now opens a final infernal bargain.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["bind_the_embers", "pay_the_crew"],
          choices: [
            {
              id: "seal_the_ember_vault",
              title: "Seal the Ember Vault",
              subtitle: "Route Opportunity",
              description: "Lock the embers away and turn them into a steadier personal reserve.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "seal_the_ember_vault", "Seal the Ember Vault", [
                  "hellforge_ember_vault",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "seal_the_ember_vault",
                  "Seal the Ember Vault",
                  "ember_vault_sealed",
                  ["hellforge_ember_vault"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "pay_the_warband",
              title: "Pay the Warband",
              subtitle: "Route Opportunity",
              description: "Distribute the pact spoils and keep the whole line dangerous.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "pay_the_warband", "Pay the Warband", [
                  "hellforge_warband_paid",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "pay_the_warband",
                  "Pay the Warband",
                  "warband_paid",
                  ["hellforge_warband_paid"]
                ),
                { kind: "gold_bonus", value: 14 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_route_opportunity",
      title: "Harrogath Route Opportunity",
      zoneTitle: "Harrogath Opportunity",
      description: "The Harrogath rescue still leaves one more warcamp opening after the aftermath is resolved.",
      summary: "A third route node now cashes out the Harrogath chain.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      variants: [
        {
          id: "scout_advance",
          title: "Scout Advance",
          description: "The rescued scouts can become a fixed watch or a leading spearhead.",
          summary: "The scout rescue chain opens a final advance-line decision.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["post_the_scouts", "lead_the_charge"],
          choices: [
            {
              id: "fix_the_watchfires",
              title: "Fix the Watchfires",
              subtitle: "Route Opportunity",
              description: "Anchor the rescued scouts into a permanent watchfire line.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "fix_the_watchfires", "Fix the Watchfires", [
                  "harrogath_watchfires_fixed",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "fix_the_watchfires",
                  "Fix the Watchfires",
                  "watchfires_fixed",
                  ["harrogath_watchfires_fixed"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
            {
              id: "arm_the_spearhead",
              title: "Arm the Spearhead",
              subtitle: "Route Opportunity",
              description: "Keep the rescued scouts moving as the act's forward spearhead.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "arm_the_spearhead", "Arm the Spearhead", [
                  "harrogath_spearhead_armed",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "arm_the_spearhead",
                  "Arm the Spearhead",
                  "spearhead_armed",
                  ["harrogath_spearhead_armed"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 12 },
              ],
            },
          ],
        },
        {
          id: "ration_line",
          title: "Ration Line",
          description: "The secured stores can become a deeper cache or a hotter war stock.",
          summary: "The ration chain now opens one final provisioning choice.",
          grants: { gold: 6, xp: 6, potions: 0 },
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          choices: [
            {
              id: "bury_the_winter_cache",
              title: "Bury the Winter Cache",
              subtitle: "Route Opportunity",
              description: "Hide the ration line into a deeper winter cache for the final pushes.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "harrogath_route_opportunity",
                  "bury_the_winter_cache",
                  "Bury the Winter Cache",
                  ["harrogath_winter_cache"]
                ),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "bury_the_winter_cache",
                  "Bury the Winter Cache",
                  "winter_cache_buried",
                  ["harrogath_winter_cache"]
                ),
                { kind: "belt_capacity", value: 1 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
            {
              id: "feed_the_war_line",
              title: "Feed the War Line",
              subtitle: "Route Opportunity",
              description: "Spend the stock aggressively and keep the line ready for one more push.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "feed_the_war_line", "Feed the War Line", [
                  "harrogath_war_line_fed",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "feed_the_war_line",
                  "Feed the War Line",
                  "war_line_fed",
                  ["harrogath_war_line_fed"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
        {
          id: "oath_host",
          title: "Oath Host",
          description: "The sworn banner can become a guarded host or a harder offensive banner line.",
          summary: "The oath chain now opens one final warband choice.",
          grants: { gold: 4, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["carry_the_banner", "share_the_oath"],
          choices: [
            {
              id: "raise_the_shield_host",
              title: "Raise the Shield Host",
              subtitle: "Route Opportunity",
              description: "Turn the oath into a shield host that steadies the whole ascent.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "harrogath_route_opportunity",
                  "raise_the_shield_host",
                  "Raise the Shield Host",
                  ["harrogath_shield_host"]
                ),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "raise_the_shield_host",
                  "Raise the Shield Host",
                  "shield_host_raised",
                  ["harrogath_shield_host"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "drive_the_oath_charge",
              title: "Drive the Oath Charge",
              subtitle: "Route Opportunity",
              description: "Push the oath outward and let the whole line take the harder march.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "harrogath_route_opportunity",
                  "drive_the_oath_charge",
                  "Drive the Oath Charge",
                  ["harrogath_oath_charge"]
                ),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "drive_the_oath_charge",
                  "Drive the Oath Charge",
                  "oath_charge_driven",
                  ["harrogath_oath_charge"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_potion_heal", value: 2 },
              ],
            },
          ],
        },
      ],
    },
  };

  function getCatalog(): WorldNodeCatalog {
    return {
      quests: QUEST_DEFINITIONS,
      shrines: SHRINE_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      opportunities: OPPORTUNITY_DEFINITIONS,
    };
  }

  let catalogValidated = false;

  function assertValidCatalog() {
    const validator = runtimeWindow.ROUGE_CONTENT_VALIDATOR;
    if (!validator) {
      return;
    }
    validator.assertValidWorldNodeCatalog(getCatalog());
    catalogValidated = true;
  }

  function ensureValidCatalog() {
    if (!catalogValidated) {
      assertValidCatalog();
    }
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function uniquePush(list, value) {
    if (value && !list.includes(value)) {
      list.push(value);
    }
  }

  function describeEffect(effect) {
    if (effect.kind === "hero_max_life") {
      return `Hero max Life +${effect.value}.`;
    }
    if (effect.kind === "hero_max_energy") {
      return `Hero max Energy +${effect.value}.`;
    }
    if (effect.kind === "hero_potion_heal") {
      return `Potion healing +${effect.value}.`;
    }
    if (effect.kind === "mercenary_attack") {
      return `Mercenary attack +${effect.value}.`;
    }
    if (effect.kind === "mercenary_max_life") {
      return `Mercenary max Life +${effect.value}.`;
    }
    if (effect.kind === "belt_capacity") {
      return `Belt capacity +${effect.value}.`;
    }
    if (effect.kind === "refill_potions") {
      return `Refill ${effect.value} potion charge${effect.value === 1 ? "" : "s"}.`;
    }
    if (effect.kind === "gold_bonus") {
      return `Gain ${effect.value} extra gold.`;
    }
    return "";
  }

  function buildChoice(kind, choiceDefinition) {
    const previewLines = choiceDefinition.effects.map((effect) => describeEffect(effect)).filter(Boolean);

    return {
      id: `world_node_${kind}_${choiceDefinition.id}`,
      kind,
      title: choiceDefinition.title,
      subtitle: choiceDefinition.subtitle,
      description: choiceDefinition.description,
      previewLines,
      effects: choiceDefinition.effects.map((effect) => ({ ...effect })),
    };
  }

  function buildNodeZone(kind, nodeDefinition, actSeed, prerequisites) {
    const status: ZoneState["status"] = Array.isArray(prerequisites) && prerequisites.length === 0 ? "available" : "locked";
    return {
      id: `act_${actSeed.act}_${slugify(nodeDefinition.zoneTitle)}`,
      actNumber: actSeed.act,
      title: nodeDefinition.zoneTitle,
      kind,
      zoneRole: kind,
      description: nodeDefinition.description,
      encounterIds: [],
      encounterTotal: 1,
      encountersCleared: 0,
      visited: false,
      cleared: false,
      status,
      prerequisites: [...prerequisites],
      nodeId: nodeDefinition.id,
      nodeType: kind,
    };
  }

  function getQuestDefinition(actNumber) {
    return QUEST_DEFINITIONS[actNumber] || QUEST_DEFINITIONS[1];
  }

  function getShrineDefinition(actNumber) {
    return SHRINE_DEFINITIONS[actNumber] || SHRINE_DEFINITIONS[1];
  }

  function getEventDefinition(actNumber) {
    return EVENT_DEFINITIONS[actNumber] || EVENT_DEFINITIONS[1];
  }

  function getOpportunityDefinition(actNumber) {
    return OPPORTUNITY_DEFINITIONS[actNumber] || OPPORTUNITY_DEFINITIONS[1];
  }

  function createQuestZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("quest", getQuestDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createShrineZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("shrine", getShrineDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createEventZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("event", getEventDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getOpportunityDefinition(actSeed.act), actSeed, prerequisites);
  }

  function createActWorldNodes({
    actSeed,
    openingZoneId,
  }: {
    actSeed: ActSeed;
    openingZoneId: string;
  }): ZoneState[] {
    ensureValidCatalog();
    const questZone = createQuestZone({
      actSeed,
      prerequisites: [openingZoneId],
    });
    const shrineZone = createShrineZone({
      actSeed,
      prerequisites: [openingZoneId],
    });
    const eventZone = createEventZone({
      actSeed,
      prerequisites: [questZone.id],
    });
    const opportunityZone = createOpportunityZone({
      actSeed,
      prerequisites: [eventZone.id],
    });
    return [questZone, shrineZone, eventZone, opportunityZone];
  }

  function isWorldNodeZone(zone) {
    return zone?.kind === "quest" || zone?.kind === "shrine" || zone?.kind === "event" || zone?.kind === "opportunity";
  }

  function findChoiceByOutcomeId(definition, outcomeId) {
    return definition.choices.find((choiceDefinition) => {
      return choiceDefinition.effects.some((effect) => effect.kind === "record_quest_outcome" && effect.outcomeId === outcomeId);
    });
  }

  function resolveEventFollowUp(run, actNumber) {
    const eventDefinition = getEventDefinition(actNumber);
    const questDefinition = getQuestDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[eventDefinition.requiresQuestId] || null;

    if (!questRecord?.outcomeId) {
      throw new Error(`Event node "${eventDefinition.id}" requires resolved quest "${eventDefinition.requiresQuestId}".`);
    }

    const questChoice = findChoiceByOutcomeId(questDefinition, questRecord.outcomeId);
    if (!questChoice?.followUp) {
      throw new Error(`Quest "${questDefinition.id}" is missing follow-up content for outcome "${questRecord.outcomeId}".`);
    }

    return {
      eventDefinition,
      questRecord,
      followUp: questChoice.followUp,
    };
  }

  function matchesRequiredValue(requiredIds, value) {
    return !Array.isArray(requiredIds) || requiredIds.length === 0 || requiredIds.includes(value);
  }

  function includesRequiredValues(requiredIds, availableIds) {
    if (!Array.isArray(requiredIds) || requiredIds.length === 0) {
      return true;
    }
    return requiredIds.every((requiredId) => availableIds.includes(requiredId));
  }

  function resolveOpportunityVariant(run, actNumber) {
    const opportunityDefinition = getOpportunityDefinition(actNumber);
    const questRecord = run?.world?.questOutcomes?.[opportunityDefinition.requiresQuestId] || null;
    const worldFlags = Array.isArray(run?.world?.worldFlags) ? run.world.worldFlags : [];

    if (!questRecord?.outcomeId) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" requires resolved quest "${opportunityDefinition.requiresQuestId}".`
      );
    }

    if (!questRecord.followUpOutcomeId) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" requires a resolved follow-up outcome for "${opportunityDefinition.requiresQuestId}".`
      );
    }

    const variant =
      opportunityDefinition.variants.find((variantDefinition) => {
        return (
          matchesRequiredValue(variantDefinition.requiresPrimaryOutcomeIds, questRecord.outcomeId) &&
          matchesRequiredValue(variantDefinition.requiresFollowUpOutcomeIds, questRecord.followUpOutcomeId) &&
          includesRequiredValues(variantDefinition.requiresConsequenceIds, questRecord.consequenceIds || []) &&
          includesRequiredValues(variantDefinition.requiresFlagIds, worldFlags)
        );
      }) || null;

    if (!variant) {
      throw new Error(
        `Opportunity node "${opportunityDefinition.id}" has no authored variant for follow-up outcome "${questRecord.followUpOutcomeId}".`
      );
    }

    return {
      opportunityDefinition,
      questRecord,
      variant,
    };
  }

  function buildZoneReward({ run, zone }) {
    const actNumber = zone?.actNumber || run?.actNumber || 1;

    if (zone.kind === "quest") {
      const definition = getQuestDefinition(actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          "This node resolves immediately and clears the route once you choose an outcome.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices: definition.choices.map((choiceDefinition) => buildChoice("quest", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "shrine") {
      const definition = getShrineDefinition(actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          "Shrines resolve immediately and apply their blessing through the normal reward seam.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices: definition.choices.map((choiceDefinition) => buildChoice("shrine", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "event") {
      const { eventDefinition, questRecord, followUp } = resolveEventFollowUp(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: followUp.title || eventDefinition.title,
        lines: [
          eventDefinition.summary,
          `Earlier quest result: ${questRecord.outcomeTitle}.`,
          followUp.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...eventDefinition.grants, ...(followUp.grants || {}) },
        choices: followUp.choices.map((choiceDefinition) => buildChoice("event", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    const { opportunityDefinition, questRecord, variant } = resolveOpportunityVariant(run, actNumber);
    return {
      zoneId: zone.id,
      zoneTitle: zone.title,
      kind: zone.kind,
      title: variant.title || opportunityDefinition.title,
      lines: [
        opportunityDefinition.summary,
        `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
        variant.summary,
        `${zone.title} is now clear.`,
      ],
      grants: { ...opportunityDefinition.grants, ...(variant.grants || {}) },
      choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
      encounterNumber: 1,
      clearsZone: true,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: run.hero.currentLife,
      mercenaryLifeAfterFight: run.mercenary.currentLife,
    };
  }

  function ensureWorldState(run) {
    if (!run.world || typeof run.world !== "object") {
      run.world = {
        resolvedNodeIds: [],
        questOutcomes: {},
        shrineOutcomes: {},
        eventOutcomes: {},
        opportunityOutcomes: {},
        worldFlags: [],
      };
      return run.world;
    }

    run.world.resolvedNodeIds = Array.isArray(run.world.resolvedNodeIds) ? run.world.resolvedNodeIds : [];
    run.world.questOutcomes = run.world.questOutcomes || {};
    run.world.shrineOutcomes = run.world.shrineOutcomes || {};
    run.world.eventOutcomes = run.world.eventOutcomes || {};
    run.world.opportunityOutcomes = run.world.opportunityOutcomes || {};
    run.world.worldFlags = Array.isArray(run.world.worldFlags) ? run.world.worldFlags : [];
    return run.world;
  }

  function collectFlagIds(effects) {
    return effects.reduce((flagIds, effect) => {
      (Array.isArray(effect?.flagIds) ? effect.flagIds : []).forEach((flagId) => uniquePush(flagIds, flagId));
      return flagIds;
    }, []);
  }

  function recordFlags(world, record, flagIds) {
    flagIds.forEach((flagId) => {
      uniquePush(world.worldFlags, flagId);
      if (record && Array.isArray(record.flags)) {
        uniquePush(record.flags, flagId);
      }
    });
  }

  function recordShrineOutcome(run, reward, choice) {
    const world = ensureWorldState(run);
    const shrineEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "shrine";
    });

    if (!shrineEffect?.nodeId || !shrineEffect?.outcomeId || !shrineEffect?.outcomeTitle) {
      return { ok: false, message: "Shrine choice is missing outcome metadata." };
    }

    const record = {
      nodeId: shrineEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: shrineEffect.outcomeId,
      outcomeTitle: shrineEffect.outcomeTitle,
      flagIds: collectFlagIds(choice.effects),
    };

    world.shrineOutcomes[shrineEffect.nodeId] = record;
    record.flagIds.forEach((flagId) => uniquePush(world.worldFlags, flagId));
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordQuestOutcome(run, reward, choice) {
    const world = ensureWorldState(run);
    const questEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_outcome";
    });

    if (!questEffect?.questId || !questEffect?.outcomeId || !questEffect?.outcomeTitle) {
      return { ok: false, message: "Quest choice is missing outcome metadata." };
    }

    const existingRecord = world.questOutcomes[questEffect.questId] || null;
    const record = {
      questId: questEffect.questId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: questEffect.outcomeId,
      outcomeTitle: questEffect.outcomeTitle,
      status: "primary_resolved",
      followUpNodeId: existingRecord?.followUpNodeId,
      followUpOutcomeId: existingRecord?.followUpOutcomeId,
      followUpOutcomeTitle: existingRecord?.followUpOutcomeTitle,
      consequenceIds: Array.isArray(existingRecord?.consequenceIds) ? [...existingRecord.consequenceIds] : [],
      flags: Array.isArray(existingRecord?.flags) ? [...existingRecord.flags] : [],
    };

    world.questOutcomes[questEffect.questId] = record;
    recordFlags(world, record, collectFlagIds(choice.effects));
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordEventOutcome(run, reward, choice) {
    const world = ensureWorldState(run);
    const nodeEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "event";
    });
    const followUpEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_follow_up";
    });

    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      return { ok: false, message: "Event choice is missing node outcome metadata." };
    }
    if (!followUpEffect?.questId || !followUpEffect?.outcomeId || !followUpEffect?.outcomeTitle || !followUpEffect?.consequenceId) {
      return { ok: false, message: "Event choice is missing quest follow-up metadata." };
    }

    const questRecord = world.questOutcomes[followUpEffect.questId];
    if (!questRecord) {
      return { ok: false, message: `Event choice references missing quest state "${followUpEffect.questId}".` };
    }

    const flagIds = collectFlagIds(choice.effects);
    world.eventOutcomes[nodeEffect.nodeId] = {
      nodeId: nodeEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: nodeEffect.outcomeId,
      outcomeTitle: nodeEffect.outcomeTitle,
      linkedQuestId: followUpEffect.questId,
      flagIds,
    };

    questRecord.status = "follow_up_resolved";
    questRecord.followUpNodeId = nodeEffect.nodeId;
    questRecord.followUpOutcomeId = followUpEffect.outcomeId;
    questRecord.followUpOutcomeTitle = followUpEffect.outcomeTitle;
    uniquePush(questRecord.consequenceIds, followUpEffect.consequenceId);
    recordFlags(world, questRecord, flagIds);
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function recordOpportunityOutcome(run, reward, choice) {
    const world = ensureWorldState(run);
    const nodeEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_node_outcome" && effect.nodeType === "opportunity";
    });
    const consequenceEffect = (Array.isArray(choice?.effects) ? choice.effects : []).find((effect) => {
      return effect.kind === "record_quest_consequence";
    });

    if (!nodeEffect?.nodeId || !nodeEffect?.outcomeId || !nodeEffect?.outcomeTitle) {
      return { ok: false, message: "Opportunity choice is missing node outcome metadata." };
    }
    if (!consequenceEffect?.questId || !consequenceEffect?.outcomeId || !consequenceEffect?.outcomeTitle || !consequenceEffect?.consequenceId) {
      return { ok: false, message: "Opportunity choice is missing quest consequence metadata." };
    }

    const questRecord = world.questOutcomes[consequenceEffect.questId];
    if (!questRecord) {
      return { ok: false, message: `Opportunity choice references missing quest state "${consequenceEffect.questId}".` };
    }

    const flagIds = collectFlagIds(choice.effects);
    world.opportunityOutcomes[nodeEffect.nodeId] = {
      nodeId: nodeEffect.nodeId,
      zoneId: reward.zoneId,
      actNumber: run.actNumber,
      title: reward.title,
      outcomeId: nodeEffect.outcomeId,
      outcomeTitle: nodeEffect.outcomeTitle,
      linkedQuestId: consequenceEffect.questId,
      flagIds,
    };

    questRecord.status = "chain_resolved";
    uniquePush(questRecord.consequenceIds, consequenceEffect.consequenceId);
    recordFlags(world, questRecord, flagIds);
    uniquePush(world.resolvedNodeIds, reward.zoneId);
    return { ok: true };
  }

  function applyChoice(run, reward, choice) {
    if (reward.kind === "quest") {
      return recordQuestOutcome(run, reward, choice);
    }
    if (reward.kind === "shrine") {
      return recordShrineOutcome(run, reward, choice);
    }
    if (reward.kind === "event") {
      return recordEventOutcome(run, reward, choice);
    }
    if (reward.kind === "opportunity") {
      return recordOpportunityOutcome(run, reward, choice);
    }
    return { ok: false, message: "Unsupported world-node reward type." };
  }

  assertValidCatalog();

  runtimeWindow.ROUGE_WORLD_NODES = {
    getCatalog,
    assertValidCatalog,
    createQuestZone,
    createShrineZone,
    createEventZone,
    createOpportunityZone,
    createActWorldNodes,
    isWorldNodeZone,
    buildZoneReward,
    applyChoice,
  };
})();
