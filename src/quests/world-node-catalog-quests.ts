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

  function getWorldNodeCatalogOpportunitiesApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES) {
      throw new Error("World-node opportunity catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_CATALOG_OPPORTUNITIES;
  }

  const QUEST_DEFINITIONS_A: Record<number, QuestNodeDefinition> = {
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
  };

  runtimeWindow.__ROUGE_WNC_QUESTS = {
    questsA: QUEST_DEFINITIONS_A,
    questOutcomeEffect,
    nodeOutcomeEffect,
    questFollowUpEffect,
    questConsequenceEffect,
    getWorldNodeCatalogOpportunitiesApi,
  };
})();
