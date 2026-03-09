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

  function opportunityChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Route Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function reserveChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Reserve Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function relayChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Relay Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function culminationChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Culmination Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function legacyChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Legacy Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildReckoningChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Reckoning Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildRecoveryChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Recovery Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildAccordChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Accord Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildCovenantChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Covenant Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildDetourChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Detour Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildEscalationChoice(nodeId, questId, outcomeId, title, description, consequenceId, flagIds = [], extraEffects = []) {
    return {
      id: outcomeId,
      title,
      subtitle: "Escalation Opportunity",
      description,
      effects: [
        nodeOutcomeEffect("opportunity", nodeId, outcomeId, title, flagIds),
        questConsequenceEffect(questId, outcomeId, title, consequenceId, flagIds),
        ...(Array.isArray(extraEffects) ? extraEffects : []),
      ],
    };
  }

  function buildLateRouteVariant(choiceBuilder, nodeId, questId, variantDefinition) {
    return {
      id: variantDefinition.id,
      title: variantDefinition.title,
      description: variantDefinition.description,
      summary: variantDefinition.summary,
      grants: { ...(variantDefinition.grants || { gold: 0, xp: 0, potions: 0 }) },
      requiresFlagIds: [...(Array.isArray(variantDefinition.requiresFlagIds) ? variantDefinition.requiresFlagIds : [])],
      choices: [
        choiceBuilder(
          nodeId,
          questId,
          variantDefinition.choice.outcomeId,
          variantDefinition.choice.title,
          variantDefinition.choice.description,
          variantDefinition.choice.consequenceId,
          variantDefinition.choice.flagIds,
          variantDefinition.choice.extraEffects
        ),
      ],
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
          id: "warfire_sortie",
          title: "Warfire Sortie",
          description: "The altar's warfire blessing turns the infernal logistics chain into a live strike sortie.",
          summary: "A shrine-backed forge route opens a harsher warfire payoff.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["arm_the_porters", "pay_the_crew"],
          requiresFlagIds: ["infernal_altar_warfire"],
          choices: [
            {
              id: "ignite_the_vanguard",
              title: "Ignite the Vanguard",
              subtitle: "Route Opportunity",
              description: "Push the altar's fire into the people carrying the line and hit harder on the next stretch.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "ignite_the_vanguard", "Ignite the Vanguard", [
                  "hellforge_vanguard_ignited",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "ignite_the_vanguard",
                  "Ignite the Vanguard",
                  "vanguard_ignited",
                  ["hellforge_vanguard_ignited"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "gold_bonus", value: 14 },
              ],
            },
            {
              id: "temper_the_reserve_flame",
              title: "Temper the Reserve Flame",
              subtitle: "Route Opportunity",
              description: "Keep the warfire controlled and turn it into steadier infernal stamina for the push to Diablo.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "hellforge_route_opportunity",
                  "temper_the_reserve_flame",
                  "Temper the Reserve Flame",
                  ["hellforge_reserve_flame_tempered"]
                ),
                questConsequenceEffect(
                  "hellforge_claim",
                  "temper_the_reserve_flame",
                  "Temper the Reserve Flame",
                  "reserve_flame_tempered",
                  ["hellforge_reserve_flame_tempered"]
                ),
                { kind: "hero_max_energy", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
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
          id: "iron_redoubt",
          title: "Iron Redoubt",
          description: "The altar's iron blessing turns the plating chain into a true redoubt instead of a simple bulwark.",
          summary: "A shrine-backed armor path opens a heavier infernal redoubt.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_iron"],
          choices: [
            {
              id: "lock_the_bastion_rings",
              title: "Lock the Bastion Rings",
              subtitle: "Route Opportunity",
              description: "Turn the shrine's iron blessing into a locked ring of plating before the sanctuary climb.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "lock_the_bastion_rings", "Lock the Bastion Rings", [
                  "hellforge_bastion_rings_locked",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "lock_the_bastion_rings",
                  "Lock the Bastion Rings",
                  "bastion_rings_locked",
                  ["hellforge_bastion_rings_locked"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
            {
              id: "sheathe_the_hellwalkers",
              title: "Sheathe the Hellwalkers",
              subtitle: "Route Opportunity",
              description: "Fit the line with the altar's iron and make every carrier harder to break.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "sheathe_the_hellwalkers", "Sheathe the Hellwalkers", [
                  "hellforge_hellwalkers_sheathed",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "sheathe_the_hellwalkers",
                  "Sheathe the Hellwalkers",
                  "hellwalkers_sheathed",
                  ["hellforge_hellwalkers_sheathed"]
                ),
                { kind: "hero_potion_heal", value: 1 },
                { kind: "mercenary_max_life", value: 4 },
              ],
            },
          ],
        },
        {
          id: "hellward_phalanx",
          title: "Hellward Phalanx",
          description: "With a Templar Vanguard or Pandemonium Scout under contract, the iron blessing becomes a disciplined hellward phalanx.",
          summary: "A contracted infernal specialist and shrine-backed plating route create a harder phalanx.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_iron"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            {
              id: "lock_the_phalanx_steps",
              title: "Lock the Phalanx Steps",
              subtitle: "Route Opportunity",
              description: "Use the contracted specialist to turn the altar's iron into a disciplined phalanx line.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "lock_the_phalanx_steps", "Lock the Phalanx Steps", [
                  "hellforge_phalanx_steps_locked",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "lock_the_phalanx_steps",
                  "Lock the Phalanx Steps",
                  "phalanx_steps_locked",
                  ["hellforge_phalanx_steps_locked"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "hero_max_life", value: 4 },
              ],
            },
            {
              id: "arm_the_hellward_screen",
              title: "Arm the Hellward Screen",
              subtitle: "Route Opportunity",
              description: "Turn the same contract into a harder forward screen and keep the sanctuary approach dangerous.",
              effects: [
                nodeOutcomeEffect("opportunity", "hellforge_route_opportunity", "arm_the_hellward_screen", "Arm the Hellward Screen", [
                  "hellforge_hellward_screen",
                ]),
                questConsequenceEffect(
                  "hellforge_claim",
                  "arm_the_hellward_screen",
                  "Arm the Hellward Screen",
                  "hellward_screen_armed",
                  ["hellforge_hellward_screen"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_energy", value: 1 },
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
          id: "warband_summit",
          title: "Warband Summit",
          description: "The warband blessing turns the oath line into a true summit host instead of a simple banner detail.",
          summary: "A shrine-backed oath path opens a stronger summit host.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["carry_the_banner", "share_the_oath"],
          requiresFlagIds: ["ancients_way_warband"],
          choices: [
            {
              id: "raise_the_summit_host",
              title: "Raise the Summit Host",
              subtitle: "Route Opportunity",
              description: "Bind the blessing to the oath line and climb with a harder warband around you.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "raise_the_summit_host", "Raise the Summit Host", [
                  "harrogath_summit_host",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "raise_the_summit_host",
                  "Raise the Summit Host",
                  "summit_host_raised",
                  ["harrogath_summit_host"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "mercenary_attack", value: 1 },
              ],
            },
            {
              id: "pack_the_peak_reserve",
              title: "Pack the Peak Reserve",
              subtitle: "Route Opportunity",
              description: "Turn the blessing into steadier marching stores and a cleaner reserve for the final fight.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "pack_the_peak_reserve", "Pack the Peak Reserve", [
                  "harrogath_peak_reserve",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "pack_the_peak_reserve",
                  "Pack the Peak Reserve",
                  "peak_reserve_packed",
                  ["harrogath_peak_reserve"]
                ),
                { kind: "refill_potions", value: 1 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
          ],
        },
        {
          id: "captains_warband",
          title: "Captain's Warband",
          description: "With the Harrogath captain under contract, the warband blessing turns the oath line into a drilled summit warband.",
          summary: "A captain's contract and shrine-backed oath path create a stronger summit warband.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["carry_the_banner", "share_the_oath"],
          requiresFlagIds: ["ancients_way_warband"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            {
              id: "drill_the_peak_guard",
              title: "Drill the Peak Guard",
              subtitle: "Route Opportunity",
              description: "Let the contracted captain drill the oath line into a proper peak guard for the final climb.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "drill_the_peak_guard", "Drill the Peak Guard", [
                  "harrogath_peak_guard_drilled",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "drill_the_peak_guard",
                  "Drill the Peak Guard",
                  "peak_guard_drilled",
                  ["harrogath_peak_guard_drilled"]
                ),
                { kind: "mercenary_attack", value: 1 },
                { kind: "hero_max_life", value: 4 },
              ],
            },
            {
              id: "marshal_the_summit_reserve",
              title: "Marshal the Summit Reserve",
              subtitle: "Route Opportunity",
              description: "Use the captain to marshal the oath stores into a cleaner reserve for the last warcamp push.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "harrogath_route_opportunity",
                  "marshal_the_summit_reserve",
                  "Marshal the Summit Reserve",
                  ["harrogath_summit_reserve_marshaled"]
                ),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "marshal_the_summit_reserve",
                  "Marshal the Summit Reserve",
                  "summit_reserve_marshaled",
                  ["harrogath_summit_reserve_marshaled"]
                ),
                { kind: "mercenary_max_life", value: 4 },
                { kind: "refill_potions", value: 1 },
              ],
            },
          ],
        },
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
        {
          id: "summit_bastion",
          title: "Summit Bastion",
          description: "The summit blessing turns the oath line into a true mountain bastion instead of a simple host.",
          summary: "A shrine-backed oath path opens a steadier summit bastion.",
          grants: { gold: 6, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["carry_the_banner", "share_the_oath"],
          requiresFlagIds: ["ancients_way_summit"],
          choices: [
            {
              id: "anchor_the_shield_line",
              title: "Anchor the Shield Line",
              subtitle: "Route Opportunity",
              description: "Turn the shrine's summit blessing into a harder shield wall for the final ascent.",
              effects: [
                nodeOutcomeEffect("opportunity", "harrogath_route_opportunity", "anchor_the_shield_line", "Anchor the Shield Line", [
                  "harrogath_shield_line_anchored",
                ]),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "anchor_the_shield_line",
                  "Anchor the Shield Line",
                  "shield_line_anchored",
                  ["harrogath_shield_line_anchored"]
                ),
                { kind: "hero_max_life", value: 4 },
                { kind: "hero_max_energy", value: 1 },
              ],
            },
            {
              id: "pack_the_summit_barricade",
              title: "Pack the Summit Barricade",
              subtitle: "Route Opportunity",
              description: "Use the same blessing to turn the oath stores into a cleaner barricade reserve.",
              effects: [
                nodeOutcomeEffect(
                  "opportunity",
                  "harrogath_route_opportunity",
                  "pack_the_summit_barricade",
                  "Pack the Summit Barricade",
                  ["harrogath_summit_barricade_packed"]
                ),
                questConsequenceEffect(
                  "harrogath_rescue",
                  "pack_the_summit_barricade",
                  "Pack the Summit Barricade",
                  "summit_barricade_packed",
                  ["harrogath_summit_barricade_packed"]
                ),
                { kind: "refill_potions", value: 1 },
                { kind: "hero_potion_heal", value: 1 },
              ],
            },
          ],
        },
      ],
    },
  };

  const ADDITIONAL_SHRINE_CHOICES: Record<number, WorldNodeChoiceDefinition[]> = {
    1: [
      {
        id: "blessing_of_beacons",
        title: "Blessing of Beacons",
        subtitle: "Shrine Blessing",
        description: "Raise signal fires along the route and keep the rogue line coordinated under pressure.",
        effects: [
          nodeOutcomeEffect("shrine", "rogue_vigil_shrine", "blessing_of_beacons", "Blessing of Beacons", ["rogue_vigil_beacons"]),
          { kind: "hero_max_energy", value: 1 },
          { kind: "gold_bonus", value: 6 },
        ],
      },
    ],
    2: [
      {
        id: "blessing_of_the_welltrain",
        title: "Blessing of the Welltrain",
        subtitle: "Shrine Blessing",
        description: "Put the shrine into the water line and make the whole desert push steadier.",
        effects: [
          nodeOutcomeEffect("shrine", "sunwell_shrine", "blessing_of_the_welltrain", "Blessing of the Welltrain", [
            "sunwell_welltrain",
          ]),
          { kind: "belt_capacity", value: 1 },
          { kind: "hero_potion_heal", value: 1 },
        ],
      },
    ],
    3: [
      {
        id: "blessing_of_trade_winds",
        title: "Blessing of Trade Winds",
        subtitle: "Shrine Blessing",
        description: "Turn the shrine toward the harbor routes and keep your dockside line profitable and fast.",
        effects: [
          nodeOutcomeEffect("shrine", "jade_shrine", "blessing_of_trade_winds", "Blessing of Trade Winds", [
            "jade_shrine_trade_winds",
          ]),
          { kind: "mercenary_attack", value: 1 },
          { kind: "gold_bonus", value: 12 },
        ],
      },
    ],
    4: [
      {
        id: "blessing_of_cinder_screen",
        title: "Blessing of Cinder Screen",
        subtitle: "Shrine Blessing",
        description: "Pull a shield of hot ash across the route and keep the infernal push under tighter control.",
        effects: [
          nodeOutcomeEffect("shrine", "infernal_altar", "blessing_of_cinder_screen", "Blessing of Cinder Screen", [
            "infernal_altar_cinder_screen",
          ]),
          { kind: "hero_max_energy", value: 1 },
          { kind: "mercenary_max_life", value: 4 },
        ],
      },
    ],
    5: [
      {
        id: "blessing_of_watchfires",
        title: "Blessing of Watchfires",
        subtitle: "Shrine Blessing",
        description: "Carry the shrine into the climb posts and keep the summit march supplied through the cold.",
        effects: [
          nodeOutcomeEffect("shrine", "ancients_way_shrine", "blessing_of_watchfires", "Blessing of Watchfires", [
            "ancients_way_watchfires",
          ]),
          { kind: "hero_potion_heal", value: 1 },
          { kind: "mercenary_attack", value: 1 },
        ],
      },
    ],
  };

  const ADDITIONAL_OPPORTUNITY_VARIANTS: Record<number, OpportunityNodeVariantDefinition[]> = {
    1: [
      {
        id: "beacon_bastion",
        title: "Beacon Bastion",
        description: "The beacon blessing and the trained watch let you turn the ridge into a live signal bastion.",
        summary: "A trained watch and shrine beacons create a more specific rogue-route payoff.",
        grants: { gold: 6, xp: 8, potions: 0 },
        requiresPrimaryOutcomeIds: ["escort_survivors"],
        requiresFollowUpOutcomeIds: ["train_the_watch"],
        requiresConsequenceIds: ["watch_trained"],
        requiresFlagIds: ["rogue_vigil_beacons"],
        choices: [
          {
            id: "raise_the_ridge_lanterns",
            title: "Raise the Ridge Lanterns",
            subtitle: "Route Opportunity",
            description: "Commit the blessing to the ridge posts and keep every fallback cleaner.",
            effects: [
              nodeOutcomeEffect("opportunity", "rogue_route_opportunity", "raise_the_ridge_lanterns", "Raise the Ridge Lanterns", [
                "rogue_route_ridge_lanterns",
              ]),
              questConsequenceEffect(
                "tristram_relief",
                "raise_the_ridge_lanterns",
                "Raise the Ridge Lanterns",
                "ridge_lanterns_raised",
                ["rogue_route_ridge_lanterns"]
              ),
              { kind: "hero_max_energy", value: 1 },
              { kind: "gold_bonus", value: 10 },
            ],
          },
          {
            id: "rotate_the_beacon_wardens",
            title: "Rotate the Beacon Wardens",
            subtitle: "Route Opportunity",
            description: "Use the same bastion to keep the wardens fresh and the line harder to crack.",
            effects: [
              nodeOutcomeEffect(
                "opportunity",
                "rogue_route_opportunity",
                "rotate_the_beacon_wardens",
                "Rotate the Beacon Wardens",
                ["rogue_route_beacon_wardens"]
              ),
              questConsequenceEffect(
                "tristram_relief",
                "rotate_the_beacon_wardens",
                "Rotate the Beacon Wardens",
                "beacon_wardens_rotated",
                ["rogue_route_beacon_wardens"]
              ),
              { kind: "mercenary_max_life", value: 4 },
              { kind: "refill_potions", value: 1 },
            ],
          },
        ],
      },
    ],
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

  const CROSSROAD_OPPORTUNITY_DEFINITIONS: Record<number, CrossroadOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_crossroads_opportunity",
      title: "Rogue Crossroads",
      zoneTitle: "Rogue Crossroads",
      description: "Once both the Tristram line and the vigil shrine are resolved, one more ridge-side junction opens beside the act route.",
      summary: "The quest and shrine lanes now converge into a later crossroads payoff.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresShrineId: "rogue_vigil_shrine",
      variants: [
        {
          id: "encampment_junction",
          title: "Encampment Junction",
          description: "Even without a tighter specialty payoff, the joined route can still become a stocked camp or a cleaner outrider line.",
          summary: "The act now has a generic crossroad lane after both non-combat branches resolve.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "stock_the_ridge_camp",
              "Stock the Ridge Camp",
              "Turn the converged route into a steadier ridge camp before the next push.",
              "ridge_camp_stocked",
              ["rogue_crossroads_ridge_camp"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "rotate_the_outriders",
              "Rotate the Outriders",
              "Move fresh outriders through the junction and keep the whole line responsive.",
              "outriders_rotated",
              ["rogue_crossroads_outriders_rotated"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "beacon_charting",
          title: "Beacon Charting",
          description: "The beacon blessing and scout aftermath turn the junction into a live signal chart instead of a plain camp.",
          summary: "A beacon-backed scout route opens a more specific ridge command payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_vigil_beacons"],
          choices: [
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "chart_the_signal_ridges",
              "Chart the Signal Ridges",
              "Commit the beacons to the ridge routes and keep every reserve movement cleaner.",
              "signal_ridges_charted",
              ["rogue_crossroads_signal_ridges"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "stage_the_lantern_couriers",
              "Stage the Lantern Couriers",
              "Use the same signal line to keep couriers moving with steadier supplies.",
              "lantern_couriers_staged",
              ["rogue_crossroads_lantern_couriers"],
              [{ kind: "refill_potions", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "rogue_scout_countermarch",
          title: "Rogue Scout Countermarch",
          description: "With a Rogue Scout under contract, the beacon chart turns into a true countermarch lane around the ridge posts.",
          summary: "A contracted scout makes the crossroads lane more specific than the generic beacon chart.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_vigil_beacons"],
          requiresMercenaryIds: ["rogue_scout"],
          choices: [
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "assign_the_hidden_wayfinders",
              "Assign the Hidden Wayfinders",
              "Let the scout turn the chart into a hidden wayfinder screen on the act's ridge roads.",
              "hidden_wayfinders_assigned",
              ["rogue_crossroads_hidden_wayfinders"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            opportunityChoice(
              "rogue_crossroads_opportunity",
              "tristram_relief",
              "open_the_countermarch",
              "Open the Countermarch",
              "Push the contracted scout through the junction and keep the countermarch line active.",
              "countermarch_opened",
              ["rogue_crossroads_countermarch"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_crossroads_opportunity",
      title: "Sunwell Crossroads",
      zoneTitle: "Sunwell Crossroads",
      description: "Once the reliquary aftermath and the Sunwell blessing both settle, a final desert staging junction opens.",
      summary: "The quest and shrine lanes now merge into a later desert crossroads.",
      grants: { gold: 10, xp: 10, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineId: "sunwell_shrine",
      variants: [
        {
          id: "sunwell_junction",
          title: "Sunwell Junction",
          description: "The converged desert route can always become either safer waystations or a cleaner guide line.",
          summary: "Every act now keeps a fallback crossroad payoff after both routes resolve.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "brace_the_waystations",
              "Brace the Waystations",
              "Turn the joined desert route into harder waystations against attrition.",
              "waystations_braced",
              ["sunwell_crossroads_waystations"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "refill_potions", value: 1 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "hire_the_sand_guides",
              "Hire the Sand Guides",
              "Use the same junction to move guides forward and keep the crossing cleaner.",
              "sand_guides_hired",
              ["sunwell_crossroads_sand_guides"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
        {
          id: "welltrain_relay",
          title: "Welltrain Relay",
          description: "The welltrain blessing and relay aftermath turn the desert junction into a live water-and-beacon network.",
          summary: "A welltrain-backed relay path opens a more specific caravan payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          requiresFlagIds: ["sunwell_welltrain"],
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "sanctify_the_way_cisterns",
              "Sanctify the Way Cisterns",
              "Push the blessing into the junction cisterns and keep the desert line healthier.",
              "way_cisterns_sanctified",
              ["sunwell_crossroads_way_cisterns"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "stage_the_well_caravans",
              "Stage the Well Caravans",
              "Use the same water line to keep the caravan junction steadier under pressure.",
              "well_caravans_staged",
              ["sunwell_crossroads_well_caravans"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "desert_guard_crossing",
          title: "Desert Guard Crossing",
          description: "With a Desert Guard under contract, the welltrain relay becomes a true spear-screen desert crossing.",
          summary: "A contracted spearwall turns the crossroads lane into a more specific escort column.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["relay_to_the_caravan", "relay_to_the_scouts"],
          requiresFlagIds: ["sunwell_welltrain"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "plant_the_spearwall_pylons",
              "Plant the Spearwall Pylons",
              "Let the guard fix the crossing into a disciplined spear screen around the wells.",
              "spearwall_pylons_planted",
              ["sunwell_crossroads_spearwall_pylons"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            opportunityChoice(
              "sunwell_crossroads_opportunity",
              "lost_reliquary",
              "march_the_contract_guard",
              "March the Contract Guard",
              "Put the contracted guard at the front of the crossing and keep the whole line dangerous.",
              "contract_guard_marched",
              ["sunwell_crossroads_contract_guard"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_crossroads_opportunity",
      title: "Kurast Crossroads",
      zoneTitle: "Kurast Crossroads",
      description: "Once the dockside aftermath and jade blessing both settle, a final harbor junction opens off the main route.",
      summary: "The quest and shrine lanes now converge into a later dockside crossroads.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineId: "jade_shrine",
      variants: [
        {
          id: "harbor_exchange",
          title: "Harbor Exchange",
          description: "The converged dock route can always become either deeper stores or a cleaner crew bargain.",
          summary: "A fallback harbor crossroads now sits behind both non-combat lanes.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "open_the_river_stores",
              "Open the River Stores",
              "Turn the joined harbor route into a steadier set of river stores.",
              "river_stores_opened",
              ["kurast_crossroads_river_stores"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "pay_the_wharf_keepers",
              "Pay the Wharf Keepers",
              "Use the same junction to keep the wharf crews moving with fewer delays.",
              "wharf_keepers_paid",
              ["kurast_crossroads_wharf_keepers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "trade_wind_customs",
          title: "Trade-Wind Customs",
          description: "The trade-wind blessing and contraband aftermath turn the harbor junction into a richer customs line.",
          summary: "A trade-wind-backed smuggler route opens a more specific dockside payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["pay_the_port_tax", "stash_the_bales"],
          requiresFlagIds: ["jade_shrine_trade_winds"],
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "license_the_trade_markers",
              "License the Trade Markers",
              "Spend the blessing on markers and keep the hidden harbor line profitable.",
              "trade_markers_licensed",
              ["kurast_crossroads_trade_markers"],
              [{ kind: "gold_bonus", value: 14 }, { kind: "hero_max_energy", value: 1 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "float_the_tariff_caches",
              "Float the Tariff Caches",
              "Use the same junction to hide tariff caches in the waterline and steady supplies.",
              "tariff_caches_floated",
              ["kurast_crossroads_tariff_caches"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "shadow_harbor_lane",
          title: "Shadow Harbor Lane",
          description: "With a Kurast specialist under contract, the trade-wind customs line becomes a true shadow harbor lane.",
          summary: "A contracted harbor specialist makes the crossroads lane more specific than the customs fallback.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["pay_the_port_tax", "stash_the_bales"],
          requiresFlagIds: ["jade_shrine_trade_winds"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "dispatch_the_shadow_pilots",
              "Dispatch the Shadow Pilots",
              "Let the contracted specialist turn the junction into a covert pilot lane through the harbor.",
              "shadow_pilots_dispatched",
              ["kurast_crossroads_shadow_pilots"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            opportunityChoice(
              "kurast_crossroads_opportunity",
              "smugglers_wake",
              "screen_the_night_berths",
              "Screen the Night Berths",
              "Use the same contract to keep hidden berths defended and the convoy line steadier.",
              "night_berths_screened",
              ["kurast_crossroads_night_berths"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_crossroads_opportunity",
      title: "Hellforge Crossroads",
      zoneTitle: "Hellforge Crossroads",
      description: "Once the forge aftermath and altar blessing both settle, one more infernal redeployment lane opens before Diablo.",
      summary: "The quest and shrine lanes now converge into a later infernal crossroads.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineId: "infernal_altar",
      variants: [
        {
          id: "forge_redeployment",
          title: "Forge Redeployment",
          description: "The converged infernal route can still become either a banked reserve or a hotter smith line.",
          summary: "A fallback infernal crossroads now sits behind both non-combat branches.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "bank_the_black_iron",
              "Bank the Black Iron",
              "Turn the junction into a steadier reserve of black iron before the sanctuary climb.",
              "black_iron_banked",
              ["hellforge_crossroads_black_iron"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "arm_the_route_smiths",
              "Arm the Route Smiths",
              "Use the same junction to keep smiths on the line and the route more dangerous.",
              "route_smiths_armed",
              ["hellforge_crossroads_route_smiths"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "cinder_rampart",
          title: "Cinder Rampart",
          description: "The cinder-screen blessing and tempered-plating aftermath turn the junction into a live ash rampart.",
          summary: "A cinder-backed forge route opens a more specific infernal barrier payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_cinder_screen"],
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "raise_the_cinder_rampart",
              "Raise the Cinder Rampart",
              "Commit the ash blessing to the road itself and make the infernal line harder to break.",
              "cinder_rampart_raised",
              ["hellforge_crossroads_cinder_rampart"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "quench_the_screen_posts",
              "Quench the Screen Posts",
              "Use the same screen to keep the line cooler and the reserve steadier between fights.",
              "screen_posts_quenched",
              ["hellforge_crossroads_screen_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "hellward_redeployment",
          title: "Hellward Redeployment",
          description: "With an infernal specialist under contract, the cinder-screen rampart becomes a disciplined hellward turn.",
          summary: "A contracted infernal specialist makes the crossroads lane more specific than the generic cinder rampart.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["infernal_altar_cinder_screen"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "drill_the_hellward_turn",
              "Drill the Hellward Turn",
              "Let the contracted specialist turn the junction into a drilled hellward pivot.",
              "hellward_turn_drilled",
              ["hellforge_crossroads_hellward_turn"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }]
            ),
            opportunityChoice(
              "hellforge_crossroads_opportunity",
              "hellforge_claim",
              "pace_the_phalanx_reliefs",
              "Pace the Phalanx Reliefs",
              "Use the same contract to keep relief carriers moving in step behind the screen.",
              "phalanx_reliefs_paced",
              ["hellforge_crossroads_phalanx_reliefs"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_crossroads_opportunity",
      title: "Harrogath Crossroads",
      zoneTitle: "Harrogath Crossroads",
      description: "Once the rescue aftermath and summit shrine both settle, one more war-camp junction opens before the final ascent.",
      summary: "The quest and shrine lanes now converge into a later summit crossroads.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineId: "ancients_way_shrine",
      variants: [
        {
          id: "summit_muster",
          title: "Summit Muster",
          description: "The converged summit route can always become either a stocked climb line or a steadier frost guide corps.",
          summary: "A fallback summit crossroads now sits behind both non-combat branches.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "stock_the_climb_store",
              "Stock the Climb Store",
              "Turn the converged route into a better-stocked climb store for the last push.",
              "climb_store_stocked",
              ["harrogath_crossroads_climb_store"],
              [{ kind: "refill_potions", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "muster_the_frost_guides",
              "Muster the Frost Guides",
              "Use the same junction to keep guides posted through the coldest stretch.",
              "frost_guides_mustered",
              ["harrogath_crossroads_frost_guides"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "watchfire_column",
          title: "Watchfire Column",
          description: "The watchfire blessing and ration aftermath turn the summit junction into a supplied climb column.",
          summary: "A watchfire-backed ration path opens a more specific summit supply payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["ancients_way_watchfires"],
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "light_the_watchfire_column",
              "Light the Watchfire Column",
              "Commit the blessing to the climb posts and keep the summit line supplied.",
              "watchfire_column_lit",
              ["harrogath_crossroads_watchfire_column"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "brace_the_summit_sleds",
              "Brace the Summit Sleds",
              "Use the same stores to keep sled lines braced for the last stretch.",
              "summit_sleds_braced",
              ["harrogath_crossroads_summit_sleds"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "captains_watchfire_column",
          title: "Captain's Watchfire Column",
          description: "With the Harrogath Captain under contract, the watchfire column becomes a drilled summit reserve line.",
          summary: "A contracted captain makes the crossroads lane more specific than the generic watchfire column.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["ancients_way_watchfires"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "drill_the_captains_switchbacks",
              "Drill the Captain's Switchbacks",
              "Let the captain turn the watchfire line into a drilled switchback guard.",
              "captains_switchbacks_drilled",
              ["harrogath_crossroads_switchbacks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            opportunityChoice(
              "harrogath_crossroads_opportunity",
              "harrogath_rescue",
              "hold_the_summit_reserve",
              "Hold the Summit Reserve",
              "Use the same command to keep a summit reserve ready behind the climb.",
              "summit_reserve_held",
              ["harrogath_crossroads_summit_reserve"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const RESERVE_OPPORTUNITY_DEFINITIONS: Record<number, ReserveOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_reserve_opportunity",
      title: "Rogue Reserve",
      zoneTitle: "Rogue Reserve",
      description: "Once the route lane, shrine lane, and crossroads lane are all settled, one final reserve line opens off the act trail.",
      summary: "The act now has a late reserve payoff after every non-combat lane resolves.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresOpportunityId: "rogue_route_opportunity",
      requiresShrineOpportunityId: "rogue_vigil_route_opportunity",
      requiresCrossroadOpportunityId: "rogue_crossroads_opportunity",
      variants: [
        {
          id: "ridge_rearguard",
          title: "Ridge Rearguard",
          description: "Even without a tighter specialty route, the resolved side lanes can still become a stocked rear camp or a steadier signal wagon line.",
          summary: "A fallback reserve lane appears once the act's other opportunity branches are done.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "stock_the_rear_camp",
              "Stock the Rear Camp",
              "Turn the fully resolved route into a rear camp that can keep the ridge line standing.",
              "rear_camp_stocked",
              ["rogue_reserve_rear_camp"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "turn_the_signal_wagons",
              "Turn the Signal Wagons",
              "Keep the reserve moving through the same ridge network and stop the line from going blind.",
              "signal_wagons_turned",
              ["rogue_reserve_signal_wagons"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
          ],
        },
        {
          id: "hidden_wayfinder_reserve",
          title: "Hidden Wayfinder Reserve",
          description: "A hidden-wayfinder crossroads route lets the whole reserve become more specific than a plain rear camp.",
          summary: "The hidden wayfinders push the reserve into a covert ridge support line.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_crossroads_hidden_wayfinders"],
          choices: [
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "cache_the_hidden_reserve",
              "Cache the Hidden Reserve",
              "Let the wayfinders turn the reserve into a concealed cache line behind the ridge posts.",
              "hidden_reserve_cached",
              ["rogue_reserve_hidden_cache"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "screen_the_lantern_supply",
              "Screen the Lantern Supply",
              "Use the same covert route to keep the lantern carriers alive and the supply path cleaner.",
              "lantern_supply_screened",
              ["rogue_reserve_lantern_screen"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "countermarch_reserve",
          title: "Countermarch Reserve",
          description: "A live countermarch around the crossroads turns the reserve into a drilled counterline instead of a static camp.",
          summary: "The countermarch path opens a more martial reserve payoff at the end of the act route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_crossroads_countermarch"],
          choices: [
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "brace_the_counterline_stores",
              "Brace the Counterline Stores",
              "Harden the reserve stores behind the countermarch and keep the line supplied under pressure.",
              "counterline_stores_braced",
              ["rogue_reserve_counterline_stores"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            reserveChoice(
              "rogue_reserve_opportunity",
              "tristram_relief",
              "drill_the_ridge_relays",
              "Drill the Ridge Relays",
              "Use the same route to keep fresh relays moving behind the countermarch line.",
              "ridge_relays_drilled",
              ["rogue_reserve_ridge_relays"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
          ],
        },
      ],
    },
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

  const RELAY_OPPORTUNITY_DEFINITIONS: Record<number, RelayOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_relay_opportunity",
      title: "Rogue Relay",
      zoneTitle: "Rogue Relay",
      description: "Once the ridge reserve settles, one last relay network can carry that work into the march on Andariel.",
      summary: "The act now has a post-reserve relay payoff beyond the current reserve handoff.",
      grants: { gold: 8, xp: 10, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresReserveOpportunityId: "rogue_reserve_opportunity",
      variants: [
        {
          id: "ridge_relay",
          title: "Ridge Relay",
          description: "The reserve can always become either a courier chain or a stocked lantern trace for the next march.",
          summary: "A fallback relay lane appears once the ridge reserve resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "send_the_ridge_couriers",
              "Send the Ridge Couriers",
              "Turn the reserve into a courier chain that keeps orders moving ahead of the march.",
              "ridge_couriers_sent",
              ["rogue_relay_ridge_couriers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 10 }]
            ),
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "stock_the_lantern_trace",
              "Stock the Lantern Trace",
              "Keep lantern trace caches loaded so the route stops bleeding time between fights.",
              "lantern_trace_stocked",
              ["rogue_relay_lantern_trace"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "hidden_relay_chain",
          title: "Hidden Relay Chain",
          description: "A concealed reserve cache lets the ridge relay become a covert chain instead of a plain courier run.",
          summary: "The hidden reserve now feeds a more specific downstream relay.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_reserve_hidden_cache"],
          choices: [
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "extend_the_hidden_chain",
              "Extend the Hidden Chain",
              "Push the concealed cache network forward and keep the ridge line supplied without showing your hand.",
              "hidden_chain_extended",
              ["rogue_relay_hidden_chain"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "post_the_cache_guides",
              "Post the Cache Guides",
              "Use the same covert reserve to place guides on every blind stretch behind the ridge.",
              "cache_guides_posted",
              ["rogue_relay_cache_guides"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "ridge_rotation_relay",
          title: "Ridge Rotation Relay",
          description: "Drilled ridge relays turn the reserve into a cleaner courier rotation instead of a static rear screen.",
          summary: "The drilled reserve path opens a more martial relay payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_reserve_ridge_relays"],
          choices: [
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "harden_the_relay_posts",
              "Harden the Relay Posts",
              "Brace each relay post so the ridge network stays upright under the last wave of pressure.",
              "relay_posts_hardened",
              ["rogue_relay_posts"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            relayChoice(
              "rogue_relay_opportunity",
              "tristram_relief",
              "drill_the_courier_rotations",
              "Drill the Courier Rotations",
              "Keep fresh runners cycling through the ridge route before the act boss push.",
              "courier_rotations_drilled",
              ["rogue_relay_rotations"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
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

  const CULMINATION_OPPORTUNITY_DEFINITIONS: Record<number, CulminationOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_culmination_opportunity",
      title: "Rogue Culmination",
      zoneTitle: "Rogue Culmination",
      description: "Once the ridge relay settles, the Tristram route can be committed into one final posture before Andariel.",
      summary: "The act now has a post-relay culmination that pays off the original quest line and the late relay together.",
      grants: { gold: 8, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresRelayOpportunityId: "rogue_relay_opportunity",
      variants: [
        {
          id: "andariel_march",
          title: "Andariel March",
          description: "The resolved ridge route can always become either a stocked gate line or a steadier final watch before the monastery push.",
          summary: "A fallback culmination appears once the ridge relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "stage_the_gate_supplies",
              "Stage the Gate Supplies",
              "Push the last supplies into the monastery gates and stop the final march from going lean.",
              "gate_supplies_staged",
              ["rogue_culmination_gate_supplies"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "set_the_final_watch",
              "Set the Final Watch",
              "Use the same route to post one more watch over the last ridge before Andariel.",
              "final_watch_set",
              ["rogue_culmination_final_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "scout_report_endgame",
          title: "Scout Report Endgame",
          description: "A recovered scout report and hidden relay chain turn the final ridge into a deliberate witch-hunt approach.",
          summary: "The scout-report branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["take_scout_report"],
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_relay_hidden_chain"],
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "signal_the_cathedral_approach",
              "Signal the Cathedral Approach",
              "Carry the hidden chain into the cathedral road and make the final angle easier to read.",
              "cathedral_approach_signaled",
              ["rogue_culmination_cathedral_approach"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "prepare_the_witch_hunt",
              "Prepare the Witch Hunt",
              "Use the same hidden route to stage the last hunt instead of spending it on static supplies.",
              "witch_hunt_prepared",
              ["rogue_culmination_witch_hunt"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "rogue_scout_last_wayfinders",
          title: "Rogue Scout Last Wayfinders",
          description: "With a Rogue Scout under contract, the hidden relay becomes a true last-wayfinder net instead of a generic cathedral approach.",
          summary: "A contracted scout makes the culmination lane more specific than the generic scout-report payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["take_scout_report"],
          requiresFollowUpOutcomeIds: ["mark_the_paths", "arm_the_sentries"],
          requiresFlagIds: ["rogue_relay_hidden_chain"],
          requiresMercenaryIds: ["rogue_scout"],
          choices: [
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "commission_the_last_wayfinders",
              "Commission the Last Wayfinders",
              "Let the contracted scout turn the hidden chain into the last guides on the Andariel road.",
              "last_wayfinders_commissioned",
              ["rogue_culmination_last_wayfinders"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "rogue_culmination_opportunity",
              "tristram_relief",
              "cut_the_andariel_flanks",
              "Cut the Andariel Flanks",
              "Use the same contract to mark the last flanks before the monastery push.",
              "andariel_flanks_cut",
              ["rogue_culmination_andariel_flanks"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_culmination_opportunity",
      title: "Sunwell Culmination",
      zoneTitle: "Sunwell Culmination",
      description: "Once the desert relay settles, the reliquary route can be committed into one final crossing plan before Duriel.",
      summary: "The act now has a post-relay culmination that revisits the reliquary route and the last relay together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresRelayOpportunityId: "sunwell_relay_opportunity",
      variants: [
        {
          id: "tomb_crossing",
          title: "Tomb Crossing",
          description: "The settled desert route can always become either a stocked tomb crossing or a steadier marked final march.",
          summary: "A fallback culmination appears once the desert relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "pack_the_tomb_casks",
              "Pack the Tomb Casks",
              "Turn the last desert line into a stocked cask run before the tomb descent.",
              "tomb_casks_packed",
              ["sunwell_culmination_tomb_casks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "mark_the_final_crossing",
              "Mark the Final Crossing",
              "Carry the relay into the last marked crossing and stop the desert line from wasting motion.",
              "final_crossing_marked",
              ["sunwell_culmination_final_crossing"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "caravan_lance_endgame",
          title: "Caravan Lance Endgame",
          description: "An armed caravan and lance dispatch turn the final crossing into a drilled tomb screen instead of a generic marked route.",
          summary: "The caravan-martial quest branch now pays off again after the relay instead of stopping at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["arm_the_caravan"],
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_relay_lance_dispatch"],
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "ready_the_tomb_screen",
              "Ready the Tomb Screen",
              "Carry the lance dispatch into a tighter screen over the last tomb approach.",
              "tomb_screen_readied",
              ["sunwell_culmination_tomb_screen"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "stock_the_reliquary_sleds",
              "Stock the Reliquary Sleds",
              "Use the same hard route to keep the last sleds loaded for the descent.",
              "reliquary_sleds_stocked",
              ["sunwell_culmination_reliquary_sleds"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "desert_guard_final_spearline",
          title: "Desert Guard Final Spearline",
          description: "With a Desert Guard under contract, the lance dispatch becomes a true final spearline instead of a generic tomb screen.",
          summary: "A contracted guard makes the culmination lane more specific than the generic caravan-lance payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["arm_the_caravan"],
          requiresFollowUpOutcomeIds: ["issue_lance_racks", "plate_the_pack_mules"],
          requiresFlagIds: ["sunwell_relay_lance_dispatch"],
          requiresMercenaryIds: ["desert_guard"],
          choices: [
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "anchor_the_final_spearline",
              "Anchor the Final Spearline",
              "Let the contracted guard carry the lance dispatch into a true spearline before the tomb gate.",
              "final_spearline_anchored",
              ["sunwell_culmination_final_spearline"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            culminationChoice(
              "sunwell_culmination_opportunity",
              "lost_reliquary",
              "raise_the_tomb_wardens",
              "Raise the Tomb Wardens",
              "Use the same contract to hold wardens over the last desert crossing.",
              "tomb_wardens_raised",
              ["sunwell_culmination_tomb_wardens"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_culmination_opportunity",
      title: "Harbor Culmination",
      zoneTitle: "Harbor Culmination",
      description: "Once the harbor relay settles, the smugglers' wake can be committed into one final Durance approach.",
      summary: "The act now has a post-relay culmination that pays off the original dockside branch and the last relay together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresRelayOpportunityId: "kurast_relay_opportunity",
      variants: [
        {
          id: "durance_approach",
          title: "Durance Approach",
          description: "The resolved harbor route can always become either a stocked river push or a steadier dock signal line.",
          summary: "A fallback culmination appears once the harbor relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "float_the_durance_stores",
              "Float the Durance Stores",
              "Turn the last hidden harbor line into a stocked river push before the Durance.",
              "durance_stores_floated",
              ["kurast_culmination_durance_stores"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "light_the_dock_signals",
              "Light the Dock Signals",
              "Carry the relay into the last dock marks and keep the hidden harbor legible.",
              "dock_signals_lit",
              ["kurast_culmination_dock_signals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "idol_wake_endgame",
          title: "Idol Wake Endgame",
          description: "A purified idol and pilot chain turn the last harbor route into a cleaner Durance channel instead of a generic river push.",
          summary: "The sanctified quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["purify_the_idol"],
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["kurast_relay_pilot_chain"],
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "clear_the_durance_channel",
              "Clear the Durance Channel",
              "Carry the pilot chain into the river mouth and make the Durance approach cleaner.",
              "durance_channel_cleared",
              ["kurast_culmination_durance_channel"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "stash_the_river_oils",
              "Stash the River Oils",
              "Use the same sanctified route to keep the last oils and marks hidden before the Durance.",
              "river_oils_stashed",
              ["kurast_culmination_river_oils"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "kurast_specialist_endgame",
          title: "Kurast Specialist Endgame",
          description: "With a Kurast Shadow or Iron Wolf under contract, the pilot chain becomes a true specialist harbor command instead of a generic Durance channel.",
          summary: "A contracted Kurast specialist makes the culmination lane more specific than the generic sanctified payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["purify_the_idol"],
          requiresFollowUpOutcomeIds: ["cast_the_ashes_wide", "bottle_the_resin"],
          requiresFlagIds: ["kurast_relay_pilot_chain"],
          requiresMercenaryIds: ["kurast_shadow", "iron_wolf"],
          choices: [
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "charter_the_spellblade_wards",
              "Charter the Spellblade Wards",
              "Let the contracted specialist carry the sanctified chain into spellblade ward posts over the harbor.",
              "spellblade_wards_chartered",
              ["kurast_culmination_spellblade_wards"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            culminationChoice(
              "kurast_culmination_opportunity",
              "smugglers_wake",
              "seal_the_shadow_ledgers",
              "Seal the Shadow Ledgers",
              "Use the same contract to keep the last ledgers and harbor marks in shadow.",
              "shadow_ledgers_sealed",
              ["kurast_culmination_shadow_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_culmination_opportunity",
      title: "Hellforge Culmination",
      zoneTitle: "Hellforge Culmination",
      description: "Once the infernal relay settles, the Hellforge claim can be committed into one final breach plan before Diablo.",
      summary: "The act now has a post-relay culmination that pays off the original forge branch and the late relay together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresRelayOpportunityId: "hellforge_relay_opportunity",
      variants: [
        {
          id: "sanctuary_breach",
          title: "Sanctuary Breach",
          description: "The resolved infernal route can always become either a stocked breach line or a steadier marked approach into the sanctuary.",
          summary: "A fallback culmination appears once the infernal relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "stage_the_sanctuary_stores",
              "Stage the Sanctuary Stores",
              "Turn the last infernal route into a stocked breach line before the sanctuary push.",
              "sanctuary_stores_staged",
              ["hellforge_culmination_sanctuary_stores"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "mark_the_breach_paths",
              "Mark the Breach Paths",
              "Carry the relay into the last breach marks and keep the infernal line moving cleanly.",
              "breach_paths_marked",
              ["hellforge_culmination_breach_paths"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forged_turn_endgame",
          title: "Forged Turn Endgame",
          description: "Tempered armor and a turning relay turn the last infernal route into a true breach chain instead of a generic marked approach.",
          summary: "The tempered-forge quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["temper_the_armor"],
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["hellforge_relay_turning_line"],
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "raise_the_breach_rivets",
              "Raise the Breach Rivets",
              "Carry the turning relay into a harder breach chain before the sanctuary line.",
              "breach_rivets_raised",
              ["hellforge_culmination_breach_rivets"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "temper_the_sanctuary_chain",
              "Temper the Sanctuary Chain",
              "Use the same forged turn to keep the last infernal chain ready for the breach.",
              "sanctuary_chain_tempered",
              ["hellforge_culmination_sanctuary_chain"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "act_four_specialist_endgame",
          title: "Act IV Specialist Endgame",
          description: "With a Templar Vanguard or Pandemonium Scout under contract, the turning relay becomes a true breach command instead of a generic forged turn.",
          summary: "A contracted Act IV specialist makes the culmination lane more specific than the generic forge payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["temper_the_armor"],
          requiresFollowUpOutcomeIds: ["set_the_rivets", "quench_the_plating"],
          requiresFlagIds: ["hellforge_relay_turning_line"],
          requiresMercenaryIds: ["templar_vanguard", "pandemonium_scout"],
          choices: [
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "raise_the_templar_breachscreen",
              "Raise the Templar Breachscreen",
              "Let the contracted specialist carry the forged turn into a true breachscreen before Diablo.",
              "templar_breachscreen_raised",
              ["hellforge_culmination_breachscreen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            culminationChoice(
              "hellforge_culmination_opportunity",
              "hellforge_claim",
              "mark_the_pandemonium_cuts",
              "Mark the Pandemonium Cuts",
              "Use the same contract to open and hold the final cuts through the breach line.",
              "pandemonium_cuts_marked",
              ["hellforge_culmination_pandemonium_cuts"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_culmination_opportunity",
      title: "Summit Culmination",
      zoneTitle: "Summit Culmination",
      description: "Once the summit relay settles, the Harrogath rescue can be committed into one final ascent plan before the Ancients.",
      summary: "The act now has a post-relay culmination that pays off the original summit branch and the last relay together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresRelayOpportunityId: "harrogath_relay_opportunity",
      variants: [
        {
          id: "ancients_finale",
          title: "Ancients Finale",
          description: "The resolved summit route can always become either a stocked ascent line or a steadier fire-marked final climb.",
          summary: "A fallback culmination appears once the summit relay resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "pack_the_ancients_caches",
              "Pack the Ancients Caches",
              "Turn the last summit route into a stocked ascent cache before the final climb.",
              "ancients_caches_packed",
              ["harrogath_culmination_ancients_caches"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "light_the_last_fires",
              "Light the Last Fires",
              "Carry the relay into the final watchfires and keep the ascent from going cold.",
              "last_fires_lit",
              ["harrogath_culmination_last_fires"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "ration_column_endgame",
          title: "Ration Column Endgame",
          description: "Secured rations and a last-column relay turn the final summit route into a true Ancients approach instead of a generic ascent cache.",
          summary: "The ration quest branch now pays off again after the relay instead of ending at the reserve.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["secure_the_rations"],
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["harrogath_relay_last_column"],
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "stack_the_ancients_provisions",
              "Stack the Ancients Provisions",
              "Carry the last column into true ascent provisions before the final oath.",
              "ancients_provisions_stacked",
              ["harrogath_culmination_ancients_provisions"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "marshal_the_frost_bearers",
              "Marshal the Frost Bearers",
              "Use the same last column to keep frost bearers moving on the final climb.",
              "frost_bearers_marshaled",
              ["harrogath_culmination_frost_bearers"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "harrogath_captain_endgame",
          title: "Harrogath Captain Endgame",
          description: "With the Harrogath Captain under contract, the last-column relay becomes a true Ancients guard instead of a generic ration column.",
          summary: "A contracted captain makes the culmination lane more specific than the generic summit payoff.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresPrimaryOutcomeIds: ["secure_the_rations"],
          requiresFollowUpOutcomeIds: ["stack_the_cache", "boil_the_stock"],
          requiresFlagIds: ["harrogath_relay_last_column"],
          requiresMercenaryIds: ["harrogath_captain"],
          choices: [
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "muster_the_ancients_guard",
              "Muster the Ancients Guard",
              "Let the captain carry the last column into a true guard on the Ancients ascent.",
              "ancients_guard_mustered",
              ["harrogath_culmination_ancients_guard"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            culminationChoice(
              "harrogath_culmination_opportunity",
              "harrogath_rescue",
              "raise_the_last_banners",
              "Raise the Last Banners",
              "Use the same command line to raise the final banners over the summit road.",
              "last_banners_raised",
              ["harrogath_culmination_last_banners"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const LEGACY_OPPORTUNITY_DEFINITIONS: Record<number, LegacyOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_legacy_opportunity",
      title: "Rogue Legacy",
      zoneTitle: "Rogue Legacy",
      description: "After the final ridge line settles, the monastery route can still be shaped one last time before the act closes.",
      summary: "The act now has a post-culmination legacy lane that pays off the last ridge plan one more time.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresCulminationOpportunityId: "rogue_culmination_opportunity",
      variants: [
        {
          id: "monastery_legacy",
          title: "Monastery Legacy",
          description: "The settled ridge can always become either a stocked monastery reserve or a cleaner cloister withdrawal line.",
          summary: "A fallback legacy lane appears once the rogue culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "stock_the_monastery_reserves",
              "Stock the Monastery Reserves",
              "Turn the last ridge work into one final reserve stockpile before the monastery gates shut.",
              "monastery_reserves_stocked",
              ["rogue_legacy_monastery_reserves"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "chart_the_cloister_exits",
              "Chart the Cloister Exits",
              "Use the same route to mark the cloister exits and keep the last withdrawal orderly.",
              "cloister_exits_charted",
              ["rogue_legacy_cloister_exits"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "cathedral_legacy",
          title: "Cathedral Legacy",
          description: "A signaled cathedral approach turns the legacy lane into a deliberate guide chain instead of a generic reserve stockpile.",
          summary: "The scout-report branch pays off one more time after the culmination resolves.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_culmination_cathedral_approach"],
          choices: [
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "post_the_cathedral_guides",
              "Post the Cathedral Guides",
              "Carry the cathedral signal into a last guide chain over the monastery approach.",
              "cathedral_guides_posted",
              ["rogue_legacy_cathedral_guides"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "seal_the_watch_rosters",
              "Seal the Watch Rosters",
              "Use the same guided lane to close out the rogue watch cleanly before Andariel.",
              "watch_rosters_sealed",
              ["rogue_legacy_watch_rosters"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "last_wayfinders_legacy",
          title: "Last Wayfinders Legacy",
          description: "The commissioned wayfinders turn the legacy lane into a true closing march instead of a generic cathedral guide chain.",
          summary: "The wayfinder culmination now pays off one more time after the final ridge is committed.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_culmination_last_wayfinders"],
          choices: [
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "extend_the_wayfinder_chain",
              "Extend the Wayfinder Chain",
              "Carry the last wayfinders through one final ridge chain before the monastery closes.",
              "wayfinder_chain_extended",
              ["rogue_legacy_wayfinder_chain"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
            legacyChoice(
              "rogue_legacy_opportunity",
              "tristram_relief",
              "raise_the_monastery_banners",
              "Raise the Monastery Banners",
              "Use the same last-wayfinder line to raise the closing banners over the rogue road.",
              "monastery_banners_raised",
              ["rogue_legacy_monastery_banners"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_legacy_opportunity",
      title: "Sunwell Legacy",
      zoneTitle: "Sunwell Legacy",
      description: "After the final tomb crossing resolves, the reliquary route can still be tuned into one lasting desert posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the tomb plan one more time.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "tomb_legacy",
          title: "Tomb Legacy",
          description: "The settled desert line can always become either a stocked tomb reserve or a cleaner marked withdrawal over the sands.",
          summary: "A fallback legacy lane appears once the sunwell culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "stack_the_tomb_reserves",
              "Stack the Tomb Reserves",
              "Turn the last crossing into a reserve stack that keeps the reliquary road supplied.",
              "tomb_reserves_stacked",
              ["sunwell_legacy_tomb_reserves"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "score_the_sand_markers",
              "Score the Sand Markers",
              "Carry the same route into one last line of desert markers before the tomb descent closes.",
              "sand_markers_scored",
              ["sunwell_legacy_sand_markers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "tomb_screen_legacy",
          title: "Tomb Screen Legacy",
          description: "A readied tomb screen turns the legacy lane into a steadier ward line instead of a generic sand-marker plan.",
          summary: "The caravan-lance culmination pays off one more time after the desert route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_culmination_tomb_screen"],
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "brace_the_tomb_watch",
              "Brace the Tomb Watch",
              "Carry the screened approach into a last watch over the reliquary gate.",
              "tomb_watch_braced",
              ["sunwell_legacy_tomb_watch"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "load_the_last_sledgers",
              "Load the Last Sledgers",
              "Use the same screened line to keep the final sledgers moving into the tomb.",
              "last_sledgers_loaded",
              ["sunwell_legacy_last_sledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "final_spearline_legacy",
          title: "Final Spearline Legacy",
          description: "An anchored spearline turns the legacy lane into a true last desert hold instead of a generic tomb watch.",
          summary: "The contracted spearline culmination pays off one more time after the tomb route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_culmination_final_spearline"],
          choices: [
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "anchor_the_last_spear_posts",
              "Anchor the Last Spear Posts",
              "Carry the final spearline into one last anchored post over the reliquary crossing.",
              "last_spear_posts_anchored",
              ["sunwell_legacy_last_spear_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            legacyChoice(
              "sunwell_legacy_opportunity",
              "lost_reliquary",
              "raise_the_warden_canopy",
              "Raise the Warden Canopy",
              "Use the same spearline to raise the last desert canopy over the wardens.",
              "warden_canopy_raised",
              ["sunwell_legacy_warden_canopy"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_legacy_opportunity",
      title: "Harbor Legacy",
      zoneTitle: "Harbor Legacy",
      description: "After the final harbor approach resolves, the dockside wake can still be tuned into one lasting Kurast posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the harbor plan one more time.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "harbor_legacy",
          title: "Harbor Legacy",
          description: "The settled harbor line can always become either a stocked dock reserve or a cleaner final signal net.",
          summary: "A fallback legacy lane appears once the harbor culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "stack_the_harbor_reserve",
              "Stack the Harbor Reserve",
              "Turn the last harbor push into a reserve stack over the Durance approach.",
              "harbor_reserve_stacked",
              ["kurast_legacy_harbor_reserve"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "seal_the_last_signal_net",
              "Seal the Last Signal Net",
              "Use the same route to close out the last signal net across the Kurast docks.",
              "last_signal_net_sealed",
              ["kurast_legacy_signal_net"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "durance_channel_legacy",
          title: "Durance Channel Legacy",
          description: "A cleared Durance channel turns the legacy lane into a true river command instead of a generic dock reserve.",
          summary: "The sanctified harbor culmination pays off one more time after the last relay settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_culmination_durance_channel"],
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "sound_the_river_command",
              "Sound the River Command",
              "Carry the cleared channel into one last river command over the Durance mouth.",
              "river_command_sounded",
              ["kurast_legacy_river_command"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "hide_the_last_oil_runs",
              "Hide the Last Oil Runs",
              "Use the same cleaned channel to bury the last oil runs before the Durance closes.",
              "last_oil_runs_hidden",
              ["kurast_legacy_last_oil_runs"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spellblade_legacy",
          title: "Spellblade Legacy",
          description: "Chartered spellblade wards turn the legacy lane into a true harbor command instead of a generic river signal.",
          summary: "The specialist harbor culmination pays off one more time after the final channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_culmination_spellblade_wards"],
          choices: [
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "charter_the_last_spellward",
              "Charter the Last Spellward",
              "Carry the spellblade wards into one last command over the harbor mouth.",
              "last_spellward_chartered",
              ["kurast_legacy_last_spellward"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            legacyChoice(
              "kurast_legacy_opportunity",
              "smugglers_wake",
              "seal_the_harbor_ledgers",
              "Seal the Harbor Ledgers",
              "Use the same specialist line to close the last ledgers and marks in shadow.",
              "harbor_ledgers_sealed",
              ["kurast_legacy_harbor_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_legacy_opportunity",
      title: "Hellforge Legacy",
      zoneTitle: "Hellforge Legacy",
      description: "After the final breach resolves, the forge claim can still be tuned into one lasting sanctuary posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the breach plan one more time.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "breach_legacy",
          title: "Breach Legacy",
          description: "The settled infernal line can always become either a stocked breach reserve or a cleaner sanctuary route mark.",
          summary: "A fallback legacy lane appears once the hellforge culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "stack_the_breach_reserves",
              "Stack the Breach Reserves",
              "Turn the last breach push into a reserve wall before the sanctuary seals.",
              "breach_reserves_stacked",
              ["hellforge_legacy_breach_reserves"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "score_the_sanctuary_marks",
              "Score the Sanctuary Marks",
              "Use the same breach line to mark the last safe cuts into the sanctuary.",
              "sanctuary_marks_scored",
              ["hellforge_legacy_sanctuary_marks"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forged_chain_legacy",
          title: "Forged Chain Legacy",
          description: "Raised breach rivets turn the legacy lane into a true infernal chain instead of a generic sanctuary mark.",
          summary: "The forged-turn culmination pays off one more time after the breach route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_culmination_breach_rivets"],
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "temper_the_last_chain_posts",
              "Temper the Last Chain Posts",
              "Carry the raised rivets into one last chain post before the sanctuary breach.",
              "last_chain_posts_tempered",
              ["hellforge_legacy_last_chain_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "lock_the_sanctuary_rings",
              "Lock the Sanctuary Rings",
              "Use the same forged line to lock the last infernal rings around the breach.",
              "sanctuary_rings_locked",
              ["hellforge_legacy_sanctuary_rings"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "breachscreen_legacy",
          title: "Breachscreen Legacy",
          description: "A raised breachscreen turns the legacy lane into a true closing command instead of a generic forged chain.",
          summary: "The Act IV specialist culmination pays off one more time after the breach route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_culmination_breachscreen"],
          choices: [
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "raise_the_last_breachscreen",
              "Raise the Last Breachscreen",
              "Carry the breachscreen into one last shielded command over the sanctuary cut.",
              "last_breachscreen_raised",
              ["hellforge_legacy_last_breachscreen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            legacyChoice(
              "hellforge_legacy_opportunity",
              "hellforge_claim",
              "open_the_final_cutmarks",
              "Open the Final Cutmarks",
              "Use the same command to keep the last cutmarks open across the infernal line.",
              "final_cutmarks_opened",
              ["hellforge_legacy_final_cutmarks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_legacy_opportunity",
      title: "Summit Legacy",
      zoneTitle: "Summit Legacy",
      description: "After the final ascent resolves, the Harrogath rescue can still be tuned into one lasting summit posture.",
      summary: "The act now has a post-culmination legacy lane that pays off the summit plan one more time.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_legacy",
          title: "Summit Legacy",
          description: "The settled summit line can always become either a stocked ascent reserve or a cleaner last-fire route mark.",
          summary: "A fallback legacy lane appears once the summit culmination resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "stack_the_summit_reserves",
              "Stack the Summit Reserves",
              "Turn the last ascent route into a reserve stack before the Ancients oath closes.",
              "summit_reserves_stacked",
              ["harrogath_legacy_summit_reserves"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "mark_the_last_switchbacks",
              "Mark the Last Switchbacks",
              "Use the same summit line to mark the last switchbacks into the Ancients road.",
              "last_switchbacks_marked",
              ["harrogath_legacy_last_switchbacks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "provisions_legacy",
          title: "Ancients Provisions Legacy",
          description: "Stacked Ancients provisions turn the legacy lane into a true summit reserve instead of a generic switchback mark.",
          summary: "The ration-column culmination pays off one more time after the last ascent settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_culmination_ancients_provisions"],
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "lay_the_last_provision_rings",
              "Lay the Last Provision Rings",
              "Carry the stacked provisions into one last ring over the Ancients ascent.",
              "last_provision_rings_laid",
              ["harrogath_legacy_last_provision_rings"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "swing_the_final_bearer_loads",
              "Swing the Final Bearer Loads",
              "Use the same summit load to keep the final bearer chain moving through the cold.",
              "final_bearer_loads_swung",
              ["harrogath_legacy_bearer_loads"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "ancients_guard_legacy",
          title: "Ancients Guard Legacy",
          description: "A mustered Ancients guard turns the legacy lane into a true closing command instead of a generic provision ring.",
          summary: "The captain-led culmination pays off one more time after the summit route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_culmination_ancients_guard"],
          choices: [
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "muster_the_last_guard_ranks",
              "Muster the Last Guard Ranks",
              "Carry the Ancients guard into one last ranked hold over the summit road.",
              "last_guard_ranks_mustered",
              ["harrogath_legacy_last_guard_ranks"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            legacyChoice(
              "harrogath_legacy_opportunity",
              "harrogath_rescue",
              "raise_the_oath_banners",
              "Raise the Oath Banners",
              "Use the same command to raise the last oath banners before the Ancients stand.",
              "oath_banners_raised",
              ["harrogath_legacy_oath_banners"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const RECKONING_OPPORTUNITY_DEFINITIONS: Record<number, ReckoningOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_reckoning_opportunity",
      title: "Rogue Reckoning",
      zoneTitle: "Rogue Reckoning",
      description: "After the last ridge line settles, the reserve and culmination routes can still be tallied into one final monastery reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and culmination together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresReserveOpportunityId: "rogue_reserve_opportunity",
      requiresCulminationOpportunityId: "rogue_culmination_opportunity",
      variants: [
        {
          id: "ridge_reckoning",
          title: "Ridge Reckoning",
          description: "Even without a tighter specialist chain, the settled ridge can still be counted into either stocked stores or a cleaner final bellwatch.",
          summary: "A fallback reckoning lane appears once the rogue reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "audit_the_ridge_stores",
              "Audit the Ridge Stores",
              "Count the ridge stores one last time before the monastery gates close.",
              "ridge_stores_audited",
              ["rogue_reckoning_ridge_stores"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "name_the_last_bellwatch",
              "Name the Last Bellwatch",
              "Turn the same closing route into one final bellwatch over the rogue road.",
              "last_bellwatch_named",
              ["rogue_reckoning_bellwatch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "wayfinder_reckoning",
          title: "Wayfinder Reckoning",
          description: "A hidden reserve and the last wayfinders turn the reckoning lane into a chapel-led account instead of a generic ridge audit.",
          summary: "The hidden reserve and contracted wayfinders pay off together after the culmination resolves.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_reserve_hidden_cache", "rogue_culmination_last_wayfinders"],
          choices: [
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "break_the_last_chapel_ledger",
              "Break the Last Chapel Ledger",
              "Use the hidden reserve and the last wayfinders to settle the final chapel ledger before Andariel.",
              "last_chapel_ledger_broken",
              ["rogue_reckoning_chapel_ledger"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "route_the_cloister_shadows",
              "Route the Cloister Shadows",
              "Carry the same covert route through the cloister shadows and keep the closing march cleaner.",
              "cloister_shadows_routed",
              ["rogue_reckoning_cloister_shadows"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "countermarch_reckoning",
          title: "Countermarch Reckoning",
          description: "A braced countermarch storeline and the cut Andariel flanks turn the reckoning lane into a true battle ledger instead of a generic bellwatch.",
          summary: "The countermarch reserve and culmination flank plan now settle together after the ridge closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_reserve_counterline_stores", "rogue_culmination_andariel_flanks"],
          choices: [
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "pack_the_countermarch_tithes",
              "Pack the Countermarch Tithes",
              "Turn the hardened stores and Andariel flanks into one last ridge tithe before the monastery push.",
              "countermarch_tithes_packed",
              ["rogue_reckoning_countermarch_tithes"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            buildReckoningChoice(
              "rogue_reckoning_opportunity",
              "tristram_relief",
              "mark_the_flank_beacons",
              "Mark the Flank Beacons",
              "Use the same settled flank line to light the last monastery beacons over the ridge.",
              "flank_beacons_marked",
              ["rogue_reckoning_flank_beacons"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_reckoning_opportunity",
      title: "Sunwell Reckoning",
      zoneTitle: "Sunwell Reckoning",
      description: "After the last tomb crossing resolves, the reserve column and culmination lane can still be tallied into one final desert reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresReserveOpportunityId: "sunwell_reserve_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "desert_reckoning",
          title: "Desert Reckoning",
          description: "Even without a sharper formation, the settled desert line can still become either counted casks or one cleaner last-dune survey.",
          summary: "A fallback reckoning lane appears once the sunwell reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "count_the_tomb_casks",
              "Count the Tomb Casks",
              "Audit the last tomb casks and keep the reliquary descent from thinning out.",
              "tomb_casks_counted",
              ["sunwell_reckoning_tomb_casks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "survey_the_last_dunes",
              "Survey the Last Dunes",
              "Turn the same closing line into one final desert survey before the tomb seals.",
              "last_dunes_surveyed",
              ["sunwell_reckoning_last_dunes"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "tomb_screen_reckoning",
          title: "Tomb Screen Reckoning",
          description: "A screened pylon reserve and the final tomb screen turn the reckoning lane into a measured barricade instead of a generic cask count.",
          summary: "The reserve pylon screen and the culmination tomb screen now settle together after the crossing resolves.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_pylon_screen", "sunwell_culmination_tomb_screen"],
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "brace_the_reliquary_barricade",
              "Brace the Reliquary Barricade",
              "Carry the screened reserve and the tomb screen into one last barricade over the reliquary gate.",
              "reliquary_barricade_braced",
              ["sunwell_reckoning_reliquary_barricade"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "lay_the_last_shade_cloth",
              "Lay the Last Shade Cloth",
              "Use the same screened line to finish the last shade cloth over the desert gate.",
              "last_shade_cloth_laid",
              ["sunwell_reckoning_shade_cloth"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_reckoning",
          title: "Spearline Reckoning",
          description: "Marched reserve lances and the final spearline turn the reckoning lane into a true desert mustering instead of a generic dune survey.",
          summary: "The reserve lance line and the desert-guard culmination now settle together after the tomb route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_reserve_lances", "sunwell_culmination_final_spearline"],
          choices: [
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "count_the_lance_wards",
              "Count the Lance Wards",
              "Turn the reserve lances and final spearline into one last ward count over the tomb crossing.",
              "lance_wards_counted",
              ["sunwell_reckoning_lance_wards"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildReckoningChoice(
              "sunwell_reckoning_opportunity",
              "lost_reliquary",
              "raise_the_last_sun_canopy",
              "Raise the Last Sun Canopy",
              "Use the same spearline to raise one final sun canopy over the warden line.",
              "last_sun_canopy_raised",
              ["sunwell_reckoning_sun_canopy"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_reckoning_opportunity",
      title: "Harbor Reckoning",
      zoneTitle: "Harbor Reckoning",
      description: "After the final harbor push resolves, the reserve columns and culmination lane can still be balanced into one lasting dockside reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresReserveOpportunityId: "kurast_reserve_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "harbor_reckoning",
          title: "Harbor Reckoning",
          description: "Even without a sharper specialist route, the settled harbor can still be balanced into either river tallies or cleaner last dock fires.",
          summary: "A fallback reckoning lane appears once the harbor reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "count_the_river_tallies",
              "Count the River Tallies",
              "Settle the last river tallies before the Durance route closes over Kurast.",
              "river_tallies_counted",
              ["kurast_reckoning_river_tallies"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "seal_the_last_dock_fires",
              "Seal the Last Dock Fires",
              "Use the same settled harbor line to bank the last dock fires into the wet season.",
              "last_dock_fires_sealed",
              ["kurast_reckoning_dock_fires"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "pilot_channel_reckoning",
          title: "Pilot Channel Reckoning",
          description: "Pilot caches and the cleared Durance channel turn the reckoning lane into a true river account instead of a generic tally.",
          summary: "The pilot reserve and the Durance-channel culmination now settle together after the harbor route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_pilot_caches", "kurast_culmination_durance_channel"],
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "balance_the_pilot_ledgers",
              "Balance the Pilot Ledgers",
              "Use the pilot caches and clean channel to settle the last ledgers over the Durance mouth.",
              "pilot_ledgers_balanced",
              ["kurast_reckoning_pilot_ledgers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 14 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "sound_the_channel_bells",
              "Sound the Channel Bells",
              "Carry the same clean channel into one last bell call over the harbor current.",
              "channel_bells_sounded",
              ["kurast_reckoning_channel_bells"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "spellward_reckoning",
          title: "Spellward Reckoning",
          description: "Held night berths and the chartered spellblade wards turn the reckoning lane into a true harbor seal instead of a generic dock fire.",
          summary: "The night-berth reserve and the specialist culmination now settle together after the final channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_reserve_berths", "kurast_culmination_spellblade_wards"],
          choices: [
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "ward_the_last_night_berths",
              "Ward the Last Night Berths",
              "Carry the night berths and spellward line into one last harbor ward over the river mouth.",
              "last_night_berths_warded",
              ["kurast_reckoning_night_berths"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildReckoningChoice(
              "kurast_reckoning_opportunity",
              "smugglers_wake",
              "hide_the_last_harbor_seals",
              "Hide the Last Harbor Seals",
              "Use the same specialist route to hide the last harbor seals and close the dockside books.",
              "last_harbor_seals_hidden",
              ["kurast_reckoning_harbor_seals"],
              [{ kind: "belt_capacity", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_reckoning_opportunity",
      title: "Hellforge Reckoning",
      zoneTitle: "Hellforge Reckoning",
      description: "After the final breach resolves, the reserve wall and culmination line can still be judged into one lasting sanctuary reckoning.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresReserveOpportunityId: "hellforge_reserve_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "forge_reckoning",
          title: "Forge Reckoning",
          description: "Even without a sharper specialist line, the settled forge can still be judged into either counted blackstores or one cleaner ash watch.",
          summary: "A fallback reckoning lane appears once the forge reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "count_the_blackstores",
              "Count the Blackstores",
              "Audit the last blackstores before the sanctuary breach closes around the forge.",
              "blackstores_counted",
              ["hellforge_reckoning_blackstores"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "name_the_last_ash_ward",
              "Name the Last Ash Ward",
              "Use the same settled breach line to set one last ash ward over the sanctuary cut.",
              "last_ash_ward_named",
              ["hellforge_reckoning_ash_ward"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "turning_chain_reckoning",
          title: "Turning Chain Reckoning",
          description: "A drilled turning line and the raised breach rivets turn the reckoning lane into a true chain account instead of a generic blackstore count.",
          summary: "The turning reserve and the forged-turn culmination now settle together after the breach route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_turning_line", "hellforge_culmination_breach_rivets"],
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "judge_the_turning_chain",
              "Judge the Turning Chain",
              "Use the turning line and breach rivets to settle the last chain account before the sanctuary seals.",
              "turning_chain_judged",
              ["hellforge_reckoning_turning_chain"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "score_the_last_furnace_cuts",
              "Score the Last Furnace Cuts",
              "Carry the same forged line into one last series of furnace cuts over the breach.",
              "last_furnace_cuts_scored",
              ["hellforge_reckoning_furnace_cuts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "breachscreen_reckoning",
          title: "Breachscreen Reckoning",
          description: "A locked relief wall and the templar breachscreen turn the reckoning lane into a true sanctuary screen instead of a generic ash ward.",
          summary: "The relief-wall reserve and the specialist culmination now settle together after the infernal line hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_reserve_relief_wall", "hellforge_culmination_breachscreen"],
          choices: [
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "hold_the_final_relief_wall",
              "Hold the Final Relief Wall",
              "Carry the relief wall and breachscreen into one last shielded hold over the sanctuary cut.",
              "final_relief_wall_held",
              ["hellforge_reckoning_relief_wall"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildReckoningChoice(
              "hellforge_reckoning_opportunity",
              "hellforge_claim",
              "count_the_sanctuary_screens",
              "Count the Sanctuary Screens",
              "Use the same screened line to settle the last sanctuary screens before Diablo.",
              "sanctuary_screens_counted",
              ["hellforge_reckoning_sanctuary_screens"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_reckoning_opportunity",
      title: "Summit Reckoning",
      zoneTitle: "Summit Reckoning",
      description: "After the final ascent resolves, the reserve columns and culmination line can still be reckoned into one lasting summit posture.",
      summary: "The act now has a parallel post-culmination reckoning lane that pays off the reserve and summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresReserveOpportunityId: "harrogath_reserve_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_reckoning",
          title: "Summit Reckoning",
          description: "Even without a sharper specialist line, the settled summit can still be reckoned into either counted stores or one cleaner watchfire line.",
          summary: "A fallback reckoning lane appears once the summit reserve and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "count_the_frost_stores",
              "Count the Frost Stores",
              "Audit the last frost stores before the Ancients road closes over the summit.",
              "frost_stores_counted",
              ["harrogath_reckoning_frost_stores"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "name_the_last_watchfires",
              "Name the Last Watchfires",
              "Use the same settled ascent to name one last watchfire over the summit road.",
              "last_watchfires_named",
              ["harrogath_reckoning_watchfires"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "provision_reckoning",
          title: "Provision Reckoning",
          description: "A drilled switchback guard and the stacked Ancients provisions turn the reckoning lane into a true supply account instead of a generic store count.",
          summary: "The switchback reserve and the ration-column culmination now settle together after the summit route closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_switchback_guard", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "audit_the_provision_rings",
              "Audit the Provision Rings",
              "Carry the switchback guard and provision stacks into one last ring count over the Ancients ascent.",
              "provision_rings_audited",
              ["harrogath_reckoning_provision_rings"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "call_the_last_switchback_watch",
              "Call the Last Switchback Watch",
              "Use the same provision line to post one final switchback watch under the Ancients oath.",
              "last_switchback_watch_called",
              ["harrogath_reckoning_switchback_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
          ],
        },
        {
          id: "guard_reckoning",
          title: "Guard Reckoning",
          description: "The last column and the mustered Ancients guard turn the reckoning lane into a true summit oath instead of a generic watchfire.",
          summary: "The column reserve and the captain-led culmination now settle together after the last ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_reserve_last_column", "harrogath_culmination_ancients_guard"],
          choices: [
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "count_the_oath_rations",
              "Count the Oath Rations",
              "Carry the last column and the Ancients guard into one final ration count over the summit hold.",
              "oath_rations_counted",
              ["harrogath_reckoning_oath_rations"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildReckoningChoice(
              "harrogath_reckoning_opportunity",
              "harrogath_rescue",
              "raise_the_last_summit_torches",
              "Raise the Last Summit Torches",
              "Use the same guard line to raise the last summit torches before the Worldstone push.",
              "last_summit_torches_raised",
              ["harrogath_reckoning_summit_torches"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
  };

  const RECOVERY_OPPORTUNITY_DEFINITIONS: Record<number, RecoveryOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_recovery_opportunity",
      title: "Rogue Recovery",
      zoneTitle: "Rogue Recovery",
      description: "After the final ridge line settles, the vigil shrine and the closing march can still be turned into one lasting monastery recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the closing march together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresShrineOpportunityId: "rogue_vigil_route_opportunity",
      requiresCulminationOpportunityId: "rogue_culmination_opportunity",
      variants: [
        {
          id: "monastery_recovery",
          title: "Monastery Recovery",
          description: "Even without a sharper signal line, the monastery road can still recover into either stocked chapel cells or cleaner gate lamps.",
          summary: "A fallback recovery lane appears once the rogue shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "restock_the_chapel_cells",
              "Restock the Chapel Cells",
              "Use the settled ridge and shrine stores to refill the last chapel cells before Andariel.",
              "chapel_cells_restocked",
              ["rogue_recovery_chapel_cells"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "relight_the_last_gate_lamps",
              "Relight the Last Gate Lamps",
              "Turn the same closing line into one final run of gate lamps across the monastery road.",
              "last_gate_lamps_relit",
              ["rogue_recovery_gate_lamps"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "lantern_recovery",
          title: "Lantern Recovery",
          description: "Signal lanterns and the last wayfinders turn the recovery lane into a guided chapel return instead of a generic gate-lamp pass.",
          summary: "The shrine lantern line and the wayfinder culmination now recover the monastery together after the ridge closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_signal_lanterns", "rogue_culmination_last_wayfinders"],
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "rehang_the_chapel_lanterns",
              "Rehang the Chapel Lanterns",
              "Carry the signal lanterns and last wayfinders into one final chapel light chain before the monastery seals.",
              "chapel_lanterns_rehung",
              ["rogue_recovery_chapel_lanterns"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "guide_the_last_cloister_watch",
              "Guide the Last Cloister Watch",
              "Use the same lantern line to walk the final cloister watch back across the ridge.",
              "last_cloister_watch_guided",
              ["rogue_recovery_cloister_watch"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "volley_recovery",
          title: "Volley Recovery",
          description: "Stacked arrow crates and the cathedral approach turn the recovery lane into a true archer reset instead of a generic chapel restock.",
          summary: "The shrine volley line and the cathedral culmination now recover the rogue road together after the last ridge settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_arrow_crates_stacked", "rogue_culmination_cathedral_approach"],
          choices: [
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "recover_the_archer_stores",
              "Recover the Archer Stores",
              "Carry the arrow crates and cathedral route into one last archer-store recovery across the monastery edge.",
              "archer_stores_recovered",
              ["rogue_recovery_archer_stores"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "rogue_recovery_opportunity",
              "tristram_relief",
              "mark_the_cathedral_return",
              "Mark the Cathedral Return",
              "Use the same restored route to chart the last return markers under the cathedral walls.",
              "cathedral_return_marked",
              ["rogue_recovery_cathedral_return"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_recovery_opportunity",
      title: "Sunwell Recovery",
      zoneTitle: "Sunwell Recovery",
      description: "After the last tomb crossing resolves, the shrine lane and closing desert march can still be turned into one lasting reliquary recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineOpportunityId: "sunwell_shrine_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "reliquary_recovery",
          title: "Reliquary Recovery",
          description: "Even without a sharper specialist lane, the desert route can still recover into either restored casks or a cleaner last shade line.",
          summary: "A fallback recovery lane appears once the sunwell shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "restore_the_last_cask_rows",
              "Restore the Last Cask Rows",
              "Recover the desert stores and keep the reliquary road from thinning out at the end of the act.",
              "last_cask_rows_restored",
              ["sunwell_recovery_cask_rows"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "shade_the_final_caravan_line",
              "Shade the Final Caravan Line",
              "Turn the same closing route into one last shaded caravan line before the tomb seals.",
              "final_caravan_line_shaded",
              ["sunwell_recovery_caravan_shade"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "beacon_recovery",
          title: "Beacon Recovery",
          description: "Aligned water beacons and the tomb screen turn the recovery lane into a true reliquary reset instead of a generic cask restore.",
          summary: "The shrine beacon line and the screened culmination now recover the crossing together after the desert route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_culmination_tomb_screen"],
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "relight_the_reliquary_beacons",
              "Relight the Reliquary Beacons",
              "Carry the water beacons and tomb screen into one final beacon chain over the reliquary gate.",
              "reliquary_beacons_relit",
              ["sunwell_recovery_reliquary_beacons"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "patch_the_screened_crossing",
              "Patch the Screened Crossing",
              "Use the same guided screen to restore the last clean crossing into the tomb line.",
              "screened_crossing_patched",
              ["sunwell_recovery_screened_crossing"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_recovery",
          title: "Spearline Recovery",
          description: "A braced pack column and the final spearline turn the recovery lane into a true warden reset instead of a generic caravan shade.",
          summary: "The shrine march line and the desert-guard culmination now recover the reliquary together after the last crossing closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_pack_column_braced", "sunwell_culmination_final_spearline"],
          choices: [
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "recover_the_spearline_wards",
              "Recover the Spearline Wards",
              "Carry the braced column and final spearline into one last ward reset over the reliquary road.",
              "spearline_wards_recovered",
              ["sunwell_recovery_spearline_wards"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "sunwell_recovery_opportunity",
              "lost_reliquary",
              "ready_the_last_well_line",
              "Ready the Last Well Line",
              "Use the same guarded lane to ready one final well line before the tomb closes.",
              "last_well_line_readied",
              ["sunwell_recovery_well_line"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_recovery_opportunity",
      title: "Harbor Recovery",
      zoneTitle: "Harbor Recovery",
      description: "After the final harbor push resolves, the shrine lane and closing dockside march can still be turned into one lasting harbor recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineOpportunityId: "jade_shrine_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "dockside_recovery",
          title: "Dockside Recovery",
          description: "Even without a sharper specialist lane, the harbor can still recover into either reopened stores or a cleaner tide-mark return.",
          summary: "A fallback recovery lane appears once the harbor shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "reopen_the_river_stores",
              "Reopen the River Stores",
              "Recover the last river stores and keep the Kurast line from rotting shut before Mephisto.",
              "river_stores_reopened",
              ["kurast_recovery_river_stores"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "rehang_the_tide_signals",
              "Rehang the Tide Signals",
              "Turn the same closing route into one final set of tide signals across the docks.",
              "tide_signals_rehung",
              ["kurast_recovery_tide_signals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "channel_recovery",
          title: "Channel Recovery",
          description: "Floated supply marks and the cleared Durance channel turn the recovery lane into a true river reset instead of a generic dock reopening.",
          summary: "The shrine tide line and the Durance-channel culmination now recover the harbor together after the last relay settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_culmination_durance_channel"],
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "recover_the_pilot_marks",
              "Recover the Pilot Marks",
              "Carry the floated supply marks and clean channel into one last pilot-mark recovery over the river mouth.",
              "pilot_marks_recovered",
              ["kurast_recovery_pilot_marks"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "dry_the_last_channel_ledgers",
              "Dry the Last Channel Ledgers",
              "Use the same clean river line to save the last ledgers from the swamp rot.",
              "last_channel_ledgers_dried",
              ["kurast_recovery_channel_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spellward_recovery",
          title: "Spellward Recovery",
          description: "Sealed dock bins and spellblade wards turn the recovery lane into a true harbor reset instead of a generic tide-signal return.",
          summary: "The shrine storehouse line and the specialist culmination now recover the dockside route together after the last channel clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_dock_bins_sealed", "kurast_culmination_spellblade_wards"],
          choices: [
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "recover_the_spellward_bins",
              "Recover the Spellward Bins",
              "Carry the sealed bins and spellward line into one last harbor-store recovery before the docks close.",
              "spellward_bins_recovered",
              ["kurast_recovery_spellward_bins"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildRecoveryChoice(
              "kurast_recovery_opportunity",
              "smugglers_wake",
              "seal_the_last_dock_passages",
              "Seal the Last Dock Passages",
              "Use the same recovery line to close the last hidden passages across the harbor edge.",
              "last_dock_passages_sealed",
              ["kurast_recovery_dock_passages"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_recovery_opportunity",
      title: "Hellforge Recovery",
      zoneTitle: "Hellforge Recovery",
      description: "After the final breach resolves, the shrine lane and closing sanctuary march can still be turned into one lasting hellforge recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineOpportunityId: "infernal_shrine_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "sanctuary_recovery",
          title: "Sanctuary Recovery",
          description: "Even without a sharper specialist lane, the breach route can still recover into either reopened cutmarks or a cleaner ash-watch return.",
          summary: "A fallback recovery lane appears once the hellforge shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "reopen_the_sanctuary_cutmarks",
              "Reopen the Sanctuary Cutmarks",
              "Recover the last cutmarks and keep the sanctuary breach from sealing too early around the forge.",
              "sanctuary_cutmarks_reopened",
              ["hellforge_recovery_cutmarks"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "relight_the_ash_watch",
              "Relight the Ash Watch",
              "Turn the same closing line into one final ash-watch chain across the infernal cut.",
              "ash_watch_relit",
              ["hellforge_recovery_ash_watch"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forgegate_recovery",
          title: "Forgegate Recovery",
          description: "Chained forge gates and breach rivets turn the recovery lane into a true sanctuary reset instead of a generic cutmark reopening.",
          summary: "The shrine iron line and the forged-turn culmination now recover the sanctuary together after the breach settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_culmination_breach_rivets"],
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "recover_the_forgegate_posts",
              "Recover the Forgegate Posts",
              "Carry the chained gates and breach rivets into one last forgegate recovery before Diablo.",
              "forgegate_posts_recovered",
              ["hellforge_recovery_forgegate_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "temper_the_last_repair_rings",
              "Temper the Last Repair Rings",
              "Use the same forged line to repair the last sanctuary rings around the cut.",
              "last_repair_rings_tempered",
              ["hellforge_recovery_repair_rings"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "warfire_recovery",
          title: "Warfire Recovery",
          description: "Fueled war sconces and the breachscreen turn the recovery lane into a true hellward reset instead of a generic ash-watch return.",
          summary: "The shrine warfire line and the specialist culmination now recover the infernal route together after the sanctuary hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_war_sconces_fueled", "hellforge_culmination_breachscreen"],
          choices: [
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "recover_the_hellward_screen",
              "Recover the Hellward Screen",
              "Carry the war sconces and breachscreen into one last screened recovery over the sanctuary cut.",
              "hellward_screen_recovered",
              ["hellforge_recovery_hellward_screen"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildRecoveryChoice(
              "hellforge_recovery_opportunity",
              "hellforge_claim",
              "restore_the_last_sconce_paths",
              "Restore the Last Sconce Paths",
              "Use the same recovery line to relight the final paths between the infernal sconces.",
              "last_sconce_paths_restored",
              ["hellforge_recovery_sconce_paths"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_recovery_opportunity",
      title: "Summit Recovery",
      zoneTitle: "Summit Recovery",
      description: "After the final ascent resolves, the shrine lane and closing summit march can still be turned into one lasting summit recovery.",
      summary: "The act now has a parallel post-culmination recovery lane that pays off the shrine lane and the summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineOpportunityId: "ancients_way_route_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "summit_recovery",
          title: "Summit Recovery",
          description: "Even without a sharper specialist lane, the mountain route can still recover into either reopened caches or a cleaner watchfire ring.",
          summary: "A fallback recovery lane appears once the summit shrine lane and culmination are both resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_last_frost_caches",
              "Recover the Last Frost Caches",
              "Recover the last frost caches and keep the summit road from starving out before Baal.",
              "last_frost_caches_recovered",
              ["harrogath_recovery_frost_caches"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "relight_the_watchfire_ring",
              "Relight the Watchfire Ring",
              "Turn the same closing climb into one final watchfire ring over the summit.",
              "watchfire_ring_relit",
              ["harrogath_recovery_watchfire_ring"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "watchfire_recovery",
          title: "Watchfire Recovery",
          description: "Ringed watchfires and the Ancients provisions turn the recovery lane into a true summit reset instead of a generic frost-cache return.",
          summary: "The shrine watchfire line and the provisions culmination now recover the final ascent together after the summit route settles.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_provision_fires",
              "Recover the Provision Fires",
              "Carry the watchfire ring and Ancients provisions into one last restored fire line over the summit ascent.",
              "provision_fires_recovered",
              ["harrogath_recovery_provision_fires"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "restage_the_last_bearer_posts",
              "Restage the Last Bearer Posts",
              "Use the same recovered line to restage the final bearer posts across the frozen switchbacks.",
              "last_bearer_posts_restaged",
              ["harrogath_recovery_bearer_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "banner_recovery",
          title: "Banner Recovery",
          description: "A readied banner reserve and the Ancients guard turn the recovery lane into a true summit reset instead of a generic watchfire ring.",
          summary: "The shrine warband line and the guard culmination now recover the summit road together after the last ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_banner_reserve_readied", "harrogath_culmination_ancients_guard"],
          choices: [
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "recover_the_guard_banners",
              "Recover the Guard Banners",
              "Carry the readied banners and Ancients guard into one final restored banner hold over the summit road.",
              "guard_banners_recovered",
              ["harrogath_recovery_guard_banners"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildRecoveryChoice(
              "harrogath_recovery_opportunity",
              "harrogath_rescue",
              "marshal_the_last_oath_posts",
              "Marshal the Last Oath Posts",
              "Use the same recovered guard line to marshal the last oath posts before the Worldstone push.",
              "last_oath_posts_marshaled",
              ["harrogath_recovery_oath_posts"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const ACCORD_OPPORTUNITY_DEFINITIONS: Record<number, AccordOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_accord_opportunity",
      title: "Monastery Accord",
      zoneTitle: "Monastery Accord",
      description: "After the final ridge line settles, the vigil shrine, crossroads, and closing march can still be bound into one lasting monastery accord.",
      summary: "The act now has a fourth post-culmination lane that pays off the shrine lane, crossroads, and culmination together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresShrineOpportunityId: "rogue_vigil_route_opportunity",
      requiresCrossroadOpportunityId: "rogue_crossroads_opportunity",
      requiresCulminationOpportunityId: "rogue_culmination_opportunity",
      variants: [
        {
          id: "cloister_accord",
          title: "Cloister Accord",
          description: "Even without a sharper lantern or wayfinder line, the monastery can still be settled into a cleaner cloister accord.",
          summary: "A fallback accord lane appears once the rogue shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "count_the_cloister_stores",
              "Count the Cloister Stores",
              "Bind the last chapel stores into one quiet cloister count before Andariel.",
              "cloister_stores_counted",
              ["rogue_accord_cloister_stores"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "remark_the_outer_paths",
              "Remark the Outer Paths",
              "Turn the same settled ridge into one final path-marking run around the monastery walls.",
              "outer_paths_remarked",
              ["rogue_accord_outer_paths"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "lantern_accord",
          title: "Lantern Accord",
          description: "Signal lanterns and hidden wayfinders turn the accord lane into a guided cloister bind instead of a generic store count.",
          summary: "The shrine lantern line and the crossroads wayfinders now settle the monastery together after the ridge closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_signal_lanterns", "rogue_crossroads_hidden_wayfinders"],
          choices: [
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "bind_the_lantern_paths",
              "Bind the Lantern Paths",
              "Carry the signal lanterns and hidden wayfinders into one final marked path across the cloister edge.",
              "lantern_paths_bound",
              ["rogue_accord_lantern_paths"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "post_the_cloister_guides",
              "Post the Cloister Guides",
              "Use the same accord to leave the last guide posts standing around the monastery roads.",
              "cloister_guides_posted",
              ["rogue_accord_cloister_guides"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "wayfinder_accord",
          title: "Wayfinder Accord",
          description: "Signal lanterns, hidden wayfinders, and the last commissioned march turn the accord lane into a true monastery close instead of a generic guide post.",
          summary: "The shrine, crossroads, and culmination all settle together into one final rogue-cloister accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_vigil_signal_lanterns", "rogue_crossroads_hidden_wayfinders", "rogue_culmination_last_wayfinders"],
          choices: [
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "recount_the_cloister_paths",
              "Recount the Cloister Paths",
              "Carry the full lantern and wayfinder line into one last cloister-path census before the monastery seals.",
              "cloister_paths_recounted",
              ["rogue_accord_cloister_paths"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "rogue_accord_opportunity",
              "tristram_relief",
              "hang_the_last_wayfinder_bells",
              "Hang the Last Wayfinder Bells",
              "Use the same accord to hang the last bell line over the monastery roads.",
              "last_wayfinder_bells_hung",
              ["rogue_accord_wayfinder_bells"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_accord_opportunity",
      title: "Reliquary Accord",
      zoneTitle: "Reliquary Accord",
      description: "After the last tomb crossing settles, the shrine lane, desert crossroads, and culmination can still be bound into one lasting reliquary accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and tomb finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresShrineOpportunityId: "sunwell_shrine_opportunity",
      requiresCrossroadOpportunityId: "sunwell_crossroads_opportunity",
      requiresCulminationOpportunityId: "sunwell_culmination_opportunity",
      variants: [
        {
          id: "caravan_accord",
          title: "Caravan Accord",
          description: "Even without a sharper beacon or spearwall line, the desert route can still settle into a cleaner reliquary accord.",
          summary: "A fallback accord lane appears once the Sunwell shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "restore_the_last_guide_casks",
              "Restore the Last Guide Casks",
              "Use the settled crossing to restage the final guide casks around the reliquary road.",
              "guide_casks_restored",
              ["sunwell_accord_guide_casks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "remark_the_tomb_waystations",
              "Remark the Tomb Waystations",
              "Turn the same accord into one final set of waystation marks before Duriel.",
              "tomb_waystations_remarked",
              ["sunwell_accord_tomb_waystations"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "beacon_accord",
          title: "Beacon Accord",
          description: "Aligned water beacons and the contract guard turn the accord lane into a true reliquary bind instead of a generic caravan restage.",
          summary: "The shrine beacon line and the desert crossroads now settle the reliquary together after the crossing closes.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_crossroads_contract_guard"],
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "bind_the_beacon_posts",
              "Bind the Beacon Posts",
              "Carry the beacon line and contract guard into one final desert post chain around the reliquary.",
              "beacon_posts_bound",
              ["sunwell_accord_beacon_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "marshal_the_last_well_screens",
              "Marshal the Last Well Screens",
              "Use the same accord to screen the last well line before the tomb road narrows.",
              "last_well_screens_marshaled",
              ["sunwell_accord_well_screens"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "spearline_accord",
          title: "Spearline Accord",
          description: "Aligned water beacons, the contract guard, and the final spearline turn the accord lane into a true desert close instead of a generic screen line.",
          summary: "The shrine, crossroads, and culmination all settle together into one final reliquary accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_water_beacons_aligned", "sunwell_crossroads_contract_guard", "sunwell_culmination_final_spearline"],
          choices: [
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "trace_the_final_spear_posts",
              "Trace the Final Spear Posts",
              "Carry the full beacon and spearline route into one last spear-post survey across the reliquary edge.",
              "final_spear_posts_traced",
              ["sunwell_accord_spear_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "sunwell_accord_opportunity",
              "lost_reliquary",
              "ready_the_reliquary_screen",
              "Ready the Reliquary Screen",
              "Use the same accord to ready the last screened approach into the reliquary.",
              "reliquary_screen_readied",
              ["sunwell_accord_reliquary_screen"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_accord_opportunity",
      title: "Harbor Accord",
      zoneTitle: "Harbor Accord",
      description: "After the last harbor push settles, the shrine lane, crossroads, and culmination can still be bound into one lasting harbor accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and harbor finish together.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresShrineOpportunityId: "jade_shrine_opportunity",
      requiresCrossroadOpportunityId: "kurast_crossroads_opportunity",
      requiresCulminationOpportunityId: "kurast_culmination_opportunity",
      variants: [
        {
          id: "dock_accord",
          title: "Dock Accord",
          description: "Even without a sharper pilot or channel line, the harbor can still settle into a cleaner dockside accord.",
          summary: "A fallback accord lane appears once the harbor shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "recover_the_tally_ledgers",
              "Recover the Tally Ledgers",
              "Bind the last harbor ledgers into one clean account before Mephisto.",
              "tally_ledgers_recovered",
              ["kurast_accord_tally_ledgers"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "rehang_the_last_berth_signals",
              "Rehang the Last Berth Signals",
              "Turn the same accord into one final run of berth signals across the harbor edge.",
              "last_berth_signals_rehung",
              ["kurast_accord_berth_signals"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "pilot_accord",
          title: "Pilot Accord",
          description: "Floated supply marks and shadow pilots turn the accord lane into a guided harbor bind instead of a generic ledger recovery.",
          summary: "The shrine tide line and the harbor crossroads now settle the docks together after the river route clears.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_crossroads_shadow_pilots"],
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "chart_the_pilot_chain",
              "Chart the Pilot Chain",
              "Carry the supply marks and shadow pilots into one final charted line over the river mouth.",
              "pilot_chain_charted",
              ["kurast_accord_pilot_chain"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "stage_the_shadow_berths",
              "Stage the Shadow Berths",
              "Use the same accord to stage the last shadow berths before the docks shut.",
              "shadow_berths_staged",
              ["kurast_accord_shadow_berths"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "channel_accord",
          title: "Channel Accord",
          description: "Floated supply marks, shadow pilots, and the cleared Durance channel turn the accord lane into a true harbor close instead of a generic berth restage.",
          summary: "The shrine, crossroads, and culmination all settle together into one final harbor accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["jade_supply_marks_floated", "kurast_crossroads_shadow_pilots", "kurast_culmination_durance_channel"],
          choices: [
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "recount_the_channel_marks",
              "Recount the Channel Marks",
              "Carry the full pilot chain into one last channel-mark census across the harbor approach.",
              "channel_marks_recounted",
              ["kurast_accord_channel_marks"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildAccordChoice(
              "kurast_accord_opportunity",
              "smugglers_wake",
              "seal_the_last_harbor_cordons",
              "Seal the Last Harbor Cordons",
              "Use the same accord to bind the last harbor cordons before the Durance push.",
              "last_harbor_cordons_sealed",
              ["kurast_accord_harbor_cordons"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_accord_opportunity",
      title: "Sanctuary Accord",
      zoneTitle: "Sanctuary Accord",
      description: "After the final breach settles, the shrine lane, crossroads, and culmination can still be bound into one lasting sanctuary accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and breach finish together.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresShrineOpportunityId: "infernal_shrine_opportunity",
      requiresCrossroadOpportunityId: "hellforge_crossroads_opportunity",
      requiresCulminationOpportunityId: "hellforge_culmination_opportunity",
      variants: [
        {
          id: "ash_accord",
          title: "Ash Accord",
          description: "Even without a sharper forgegate line, the breach can still settle into a cleaner sanctuary accord.",
          summary: "A fallback accord lane appears once the hellforge shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "tally_the_sanctuary_staples",
              "Tally the Sanctuary Staples",
              "Bind the last sanctuary staples into one final count around the infernal cut.",
              "sanctuary_staples_tallied",
              ["hellforge_accord_sanctuary_staples"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "remark_the_last_ash_routes",
              "Remark the Last Ash Routes",
              "Turn the same accord into one final ash-route marking run before Diablo.",
              "last_ash_routes_remarked",
              ["hellforge_accord_ash_routes"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "forgegate_accord",
          title: "Forgegate Accord",
          description: "Chained forge gates and the hellward turn transform the accord lane into a true sanctuary bind instead of a generic ash tally.",
          summary: "The shrine iron line and the breach crossroads now settle the sanctuary together after the cut hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_crossroads_hellward_turn"],
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "bind_the_forgegate_turns",
              "Bind the Forgegate Turns",
              "Carry the chained gates and hellward turn into one final forgegate circuit before the sanctuary seals.",
              "forgegate_turns_bound",
              ["hellforge_accord_forgegate_turns"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "stage_the_last_hellward_relief",
              "Stage the Last Hellward Relief",
              "Use the same accord to stage the last relief line around the infernal breach.",
              "last_hellward_relief_staged",
              ["hellforge_accord_hellward_relief"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "rivet_accord",
          title: "Rivet Accord",
          description: "Chained forge gates, the hellward turn, and the breach rivets transform the accord lane into a true sanctuary close instead of a generic relief post.",
          summary: "The shrine, crossroads, and culmination all settle together into one final sanctuary accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["infernal_forge_gates_chained", "hellforge_crossroads_hellward_turn", "hellforge_culmination_breach_rivets"],
          choices: [
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "recount_the_breach_rivets",
              "Recount the Breach Rivets",
              "Carry the full forgegate line into one last rivet count across the sanctuary cut.",
              "breach_rivets_recounted",
              ["hellforge_accord_breach_rivets"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildAccordChoice(
              "hellforge_accord_opportunity",
              "hellforge_claim",
              "ring_the_last_sanctuary_hammers",
              "Ring the Last Sanctuary Hammers",
              "Use the same accord to ring the last hammer line around the infernal breach.",
              "last_sanctuary_hammers_rung",
              ["hellforge_accord_sanctuary_hammers"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_accord_opportunity",
      title: "Summit Accord",
      zoneTitle: "Summit Accord",
      description: "After the final ascent settles, the shrine lane, crossroads, and culmination can still be bound into one lasting summit accord.",
      summary: "The act now has a fourth post-culmination lane that settles the shrine lane, crossroads, and summit finish together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresShrineOpportunityId: "ancients_way_route_opportunity",
      requiresCrossroadOpportunityId: "harrogath_crossroads_opportunity",
      requiresCulminationOpportunityId: "harrogath_culmination_opportunity",
      variants: [
        {
          id: "watch_accord",
          title: "Watch Accord",
          description: "Even without a sharper watchfire line, the summit can still settle into a cleaner mountain accord.",
          summary: "A fallback accord lane appears once the summit shrine lane, crossroads, and culmination are all resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "count_the_summit_stores",
              "Count the Summit Stores",
              "Bind the last summit stores into one final ration count before Baal.",
              "summit_stores_counted",
              ["harrogath_accord_summit_stores"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "rehang_the_last_switchback_marks",
              "Rehang the Last Switchback Marks",
              "Turn the same accord into one final run of marks over the frozen switchbacks.",
              "last_switchback_marks_rehung",
              ["harrogath_accord_switchback_marks"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "watchfire_accord",
          title: "Watchfire Accord",
          description: "Ringed watchfires and the switchback crossroads turn the accord lane into a guided summit bind instead of a generic ration count.",
          summary: "The shrine watchfire line and the mountain crossroads now settle the summit together after the ascent hardens.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_crossroads_switchbacks"],
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "bind_the_watchfire_posts",
              "Bind the Watchfire Posts",
              "Carry the watchfire ring and switchback route into one final post line over the summit ascent.",
              "watchfire_posts_bound",
              ["harrogath_accord_watchfire_posts"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "stage_the_last_sled_guides",
              "Stage the Last Sled Guides",
              "Use the same accord to set the last guide sleds before the Worldstone climb.",
              "last_sled_guides_staged",
              ["harrogath_accord_sled_guides"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "provision_accord",
          title: "Provision Accord",
          description: "Ringed watchfires, the switchback crossroads, and the Ancients provisions turn the accord lane into a true summit close instead of a generic guide post.",
          summary: "The shrine, crossroads, and culmination all settle together into one final summit accord.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["ancients_watchfires_ringed", "harrogath_crossroads_switchbacks", "harrogath_culmination_ancients_provisions"],
          choices: [
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "recount_the_provision_chain",
              "Recount the Provision Chain",
              "Carry the full summit line into one last provision count across the Ancients road.",
              "provision_chain_recounted",
              ["harrogath_accord_provision_chain"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildAccordChoice(
              "harrogath_accord_opportunity",
              "harrogath_rescue",
              "raise_the_last_ancients_posts",
              "Raise the Last Ancients Posts",
              "Use the same accord to raise the last oath posts before the summit push.",
              "last_ancients_posts_raised",
              ["harrogath_accord_ancients_posts"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const COVENANT_OPPORTUNITY_DEFINITIONS: Record<number, CovenantOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_covenant_opportunity",
      title: "Monastery Covenant",
      zoneTitle: "Monastery Covenant",
      description: "Once the legacy, reckoning, recovery, and accord lanes all settle, the monastery can still be bound into one final covenant before Andariel.",
      summary: "The act now has a post-branch convergence lane that pays off every late rogue route together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresLegacyOpportunityId: "rogue_legacy_opportunity",
      requiresReckoningOpportunityId: "rogue_reckoning_opportunity",
      requiresRecoveryOpportunityId: "rogue_recovery_opportunity",
      requiresAccordOpportunityId: "rogue_accord_opportunity",
      variants: [
        {
          id: "cloister_covenant",
          title: "Cloister Covenant",
          description: "Even without a sharper guided line, the monastery can still close into one final cloister covenant once every late route is spent.",
          summary: "A fallback covenant lane appears once every rogue late route has resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "tally_the_last_monastery_ledger",
              "Tally the Last Monastery Ledger",
              "Bind the last monastery stores into one closing ledger before the gates seal.",
              "last_monastery_ledger_tallied",
              ["rogue_covenant_monastery_ledger"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "refill_potions", value: 1 }]
            ),
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "ring_the_final_cloister_posts",
              "Ring the Final Cloister Posts",
              "Turn the same closing line into one last ring of cloister posts around the monastery roads.",
              "final_cloister_posts_rung",
              ["rogue_covenant_cloister_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "lantern_covenant",
          title: "Lantern Covenant",
          description: "The recovery lantern line and accord path marks turn the covenant lane into a guided monastery close instead of a generic ledger tally.",
          summary: "The recovery and accord routes now settle the cloister together once every late lane is spent.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_recovery_chapel_lanterns", "rogue_accord_cloister_paths"],
          choices: [
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "relight_the_covenant_lanterns",
              "Relight the Covenant Lanterns",
              "Carry the chapel lanterns and accorded path marks into one final monastery light chain.",
              "covenant_lanterns_relit",
              ["rogue_covenant_lanterns"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "bind_the_cloister_rolls",
              "Bind the Cloister Rolls",
              "Use the same covenant to bind the last cloister rolls before the ridge closes for good.",
              "cloister_rolls_bound",
              ["rogue_covenant_cloister_rolls"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "wayfinder_covenant",
          title: "Wayfinder Covenant",
          description: "Legacy, reckoning, recovery, and accord all converge into a true monastery covenant instead of one more lantern pass.",
          summary: "Every rogue late-route payoff now closes together into one final wayfinder covenant.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: [
            "rogue_legacy_wayfinder_chain",
            "rogue_reckoning_chapel_ledger",
            "rogue_recovery_chapel_lanterns",
            "rogue_accord_cloister_paths",
          ],
          choices: [
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "seal_the_wayfinder_ledger",
              "Seal the Wayfinder Ledger",
              "Carry every late rogue line into one final sealed ledger over the monastery roads.",
              "wayfinder_ledger_sealed",
              ["rogue_covenant_wayfinder_ledger"],
              [{ kind: "hero_max_life", value: 2 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "rogue_covenant_opportunity",
              "tristram_relief",
              "consecrate_the_last_cloister_bell",
              "Consecrate the Last Cloister Bell",
              "Use the same covenant to consecrate the last bell line before Andariel.",
              "last_cloister_bell_consecrated",
              ["rogue_covenant_cloister_bell"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_covenant_opportunity",
      title: "Reliquary Covenant",
      zoneTitle: "Reliquary Covenant",
      description: "Once the legacy, reckoning, recovery, and accord lanes all settle, the reliquary can still be bound into one final covenant before Duriel.",
      summary: "The act now has a post-branch convergence lane that pays off every desert late route together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresLegacyOpportunityId: "sunwell_legacy_opportunity",
      requiresReckoningOpportunityId: "sunwell_reckoning_opportunity",
      requiresRecoveryOpportunityId: "sunwell_recovery_opportunity",
      requiresAccordOpportunityId: "sunwell_accord_opportunity",
      variants: [
        {
          id: "caravan_covenant",
          title: "Caravan Covenant",
          description: "Even without a sharper spearline close, the reliquary can still settle into one final desert covenant once every late route is spent.",
          summary: "A fallback covenant lane appears once every Sunwell late route has resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "tally_the_last_beacon_ledger",
              "Tally the Last Beacon Ledger",
              "Bind the last reliquary beacons into one closing ledger over the desert route.",
              "last_beacon_ledger_tallied",
              ["sunwell_covenant_beacon_ledger"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "raise_the_last_tomb_posts",
              "Raise the Last Tomb Posts",
              "Turn the same covenant into one final line of tomb posts before the crossing closes.",
              "last_tomb_posts_raised",
              ["sunwell_covenant_tomb_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "spearline_covenant",
          title: "Spearline Covenant",
          description: "The recovery spearline wards and accord spear posts turn the covenant lane into a true reliquary close instead of a generic beacon tally.",
          summary: "The recovery and accord routes now settle the reliquary together once every late lane is spent.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_accord_spear_posts"],
          choices: [
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "bind_the_spearline_posts",
              "Bind the Spearline Posts",
              "Carry the warded spearline and accorded posts into one final desert circuit.",
              "spearline_posts_bound",
              ["sunwell_covenant_spear_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "seal_the_reliquary_rolls",
              "Seal the Reliquary Rolls",
              "Use the same covenant to seal the last reliquary rolls before Duriel.",
              "reliquary_rolls_sealed",
              ["sunwell_covenant_reliquary_rolls"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "reliquary_covenant",
          title: "Reliquary Covenant",
          description: "Legacy, reckoning, recovery, and accord all converge into a true desert covenant instead of one more spear-post bind.",
          summary: "Every Sunwell late-route payoff now closes together into one final reliquary covenant.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: [
            "sunwell_legacy_last_spear_posts",
            "sunwell_reckoning_lance_wards",
            "sunwell_recovery_spearline_wards",
            "sunwell_accord_spear_posts",
          ],
          choices: [
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "seal_the_final_lance_ledger",
              "Seal the Final Lance Ledger",
              "Carry every late desert line into one final sealed ledger over the reliquary road.",
              "final_lance_ledger_sealed",
              ["sunwell_covenant_final_lance_ledger"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "raise_the_last_reliquary_banners",
              "Raise the Last Reliquary Banners",
              "Use the same covenant to raise the final reliquary banners before the tomb seals.",
              "last_reliquary_banners_raised",
              ["sunwell_covenant_reliquary_banners"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_covenant_opportunity",
      title: "Harbor Covenant",
      zoneTitle: "Harbor Covenant",
      description: "Once the legacy, reckoning, recovery, and accord lanes all settle, the harbor can still be bound into one final covenant before Mephisto.",
      summary: "The act now has a post-branch convergence lane that pays off every harbor late route together.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresLegacyOpportunityId: "kurast_legacy_opportunity",
      requiresReckoningOpportunityId: "kurast_reckoning_opportunity",
      requiresRecoveryOpportunityId: "kurast_recovery_opportunity",
      requiresAccordOpportunityId: "kurast_accord_opportunity",
      variants: [
        {
          id: "dock_covenant",
          title: "Dock Covenant",
          description: "Even without a sharper spellward close, the harbor can still settle into one final covenant once every late route is spent.",
          summary: "A fallback covenant lane appears once every Kurast late route has resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "tally_the_last_tide_ledgers",
              "Tally the Last Tide Ledgers",
              "Bind the last tide ledgers into one closing harbor account before the Durance push.",
              "last_tide_ledgers_tallied",
              ["kurast_covenant_tide_ledgers"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "raise_the_last_harbor_posts",
              "Raise the Last Harbor Posts",
              "Turn the same covenant into one final ring of harbor posts across the river mouth.",
              "last_harbor_posts_raised",
              ["kurast_covenant_harbor_posts"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "spellward_covenant",
          title: "Spellward Covenant",
          description: "The recovery spellward bins and accord channel marks turn the covenant lane into a true harbor close instead of a generic tally.",
          summary: "The recovery and accord routes now settle the harbor together once every late lane is spent.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_recovery_spellward_bins", "kurast_accord_channel_marks"],
          choices: [
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "bind_the_channel_posts",
              "Bind the Channel Posts",
              "Carry the spellward bins and accorded channel marks into one final harbor circuit.",
              "channel_posts_bound",
              ["kurast_covenant_channel_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "seal_the_shadow_ledgers",
              "Seal the Shadow Ledgers",
              "Use the same covenant to seal the last shadow ledgers before Mephisto.",
              "shadow_ledgers_sealed",
              ["kurast_covenant_shadow_ledgers"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
        {
          id: "channel_covenant",
          title: "Channel Covenant",
          description: "Legacy, reckoning, recovery, and accord all converge into a true harbor covenant instead of one more channel bind.",
          summary: "Every Kurast late-route payoff now closes together into one final harbor covenant.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: [
            "kurast_legacy_last_spellward",
            "kurast_reckoning_harbor_seals",
            "kurast_recovery_spellward_bins",
            "kurast_accord_channel_marks",
          ],
          choices: [
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "seal_the_spellward_ledger",
              "Seal the Spellward Ledger",
              "Carry every late harbor line into one final sealed ledger over the docks.",
              "spellward_ledger_sealed",
              ["kurast_covenant_spellward_ledger"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_energy", value: 1 }]
            ),
            buildCovenantChoice(
              "kurast_covenant_opportunity",
              "smugglers_wake",
              "ring_the_last_harbor_bells",
              "Ring the Last Harbor Bells",
              "Use the same covenant to ring the last harbor bells before the river shuts.",
              "last_harbor_bells_rung",
              ["kurast_covenant_harbor_bells"],
              [{ kind: "gold_bonus", value: 12 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_covenant_opportunity",
      title: "Sanctuary Covenant",
      zoneTitle: "Sanctuary Covenant",
      description: "Once the legacy, reckoning, recovery, and accord lanes all settle, the sanctuary can still be bound into one final covenant before Diablo.",
      summary: "The act now has a post-branch convergence lane that pays off every sanctuary late route together.",
      grants: { gold: 14, xp: 14, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresLegacyOpportunityId: "hellforge_legacy_opportunity",
      requiresReckoningOpportunityId: "hellforge_reckoning_opportunity",
      requiresRecoveryOpportunityId: "hellforge_recovery_opportunity",
      requiresAccordOpportunityId: "hellforge_accord_opportunity",
      variants: [
        {
          id: "ash_covenant",
          title: "Ash Covenant",
          description: "Even without a sharper breachscreen close, the sanctuary can still settle into one final covenant once every late route is spent.",
          summary: "A fallback covenant lane appears once every hellforge late route has resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "tally_the_last_ash_ledgers",
              "Tally the Last Ash Ledgers",
              "Bind the last ash ledgers into one closing account over the sanctuary cut.",
              "last_ash_ledgers_tallied",
              ["hellforge_covenant_ash_ledgers"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "hero_potion_heal", value: 1 }]
            ),
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "raise_the_last_sanctuary_posts",
              "Raise the Last Sanctuary Posts",
              "Turn the same covenant into one final ring of sanctuary posts before Diablo.",
              "last_sanctuary_posts_raised",
              ["hellforge_covenant_sanctuary_posts"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "refill_potions", value: 1 }]
            ),
          ],
        },
        {
          id: "hellward_covenant",
          title: "Hellward Covenant",
          description: "The recovery hellward screen and accord relief line turn the covenant lane into a true sanctuary close instead of a generic ash tally.",
          summary: "The recovery and accord routes now settle the sanctuary together once every late lane is spent.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_recovery_hellward_screen", "hellforge_accord_hellward_relief"],
          choices: [
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "bind_the_hellward_posts",
              "Bind the Hellward Posts",
              "Carry the screened hellward line and accord relief into one final sanctuary circuit.",
              "hellward_posts_bound",
              ["hellforge_covenant_hellward_posts"],
              [{ kind: "hero_max_life", value: 3 }, { kind: "mercenary_attack", value: 1 }]
            ),
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "seal_the_screen_ledger",
              "Seal the Screen Ledger",
              "Use the same covenant to seal the last screen ledger before the breach hardens.",
              "screen_ledger_sealed",
              ["hellforge_covenant_screen_ledger"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "breachscreen_covenant",
          title: "Breachscreen Covenant",
          description: "Legacy, reckoning, recovery, and accord all converge into a true sanctuary covenant instead of one more hellward post.",
          summary: "Every hellforge late-route payoff now closes together into one final sanctuary covenant.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: [
            "hellforge_legacy_last_breachscreen",
            "hellforge_reckoning_sanctuary_screens",
            "hellforge_recovery_hellward_screen",
            "hellforge_accord_hellward_relief",
          ],
          choices: [
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "seal_the_breachscreen_ledger",
              "Seal the Breachscreen Ledger",
              "Carry every late sanctuary line into one final sealed ledger over the infernal cut.",
              "breachscreen_ledger_sealed",
              ["hellforge_covenant_breachscreen_ledger"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_max_life", value: 3 }]
            ),
            buildCovenantChoice(
              "hellforge_covenant_opportunity",
              "hellforge_claim",
              "ring_the_last_sanctuary_bells",
              "Ring the Last Sanctuary Bells",
              "Use the same covenant to ring the last sanctuary bells before Diablo.",
              "last_sanctuary_bells_rung",
              ["hellforge_covenant_sanctuary_bells"],
              [{ kind: "hero_max_energy", value: 1 }, { kind: "belt_capacity", value: 1 }]
            ),
          ],
        },
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_covenant_opportunity",
      title: "Summit Covenant",
      zoneTitle: "Summit Covenant",
      description: "Once the legacy, reckoning, recovery, and accord lanes all settle, the summit can still be bound into one final covenant before Baal.",
      summary: "The act now has a post-branch convergence lane that pays off every summit late route together.",
      grants: { gold: 14, xp: 16, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresLegacyOpportunityId: "harrogath_legacy_opportunity",
      requiresReckoningOpportunityId: "harrogath_reckoning_opportunity",
      requiresRecoveryOpportunityId: "harrogath_recovery_opportunity",
      requiresAccordOpportunityId: "harrogath_accord_opportunity",
      variants: [
        {
          id: "watch_covenant",
          title: "Watch Covenant",
          description: "Even without a sharper guard close, the summit can still settle into one final covenant once every late route is spent.",
          summary: "A fallback covenant lane appears once every Harrogath late route has resolved.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choices: [
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "tally_the_last_summit_ledger",
              "Tally the Last Summit Ledger",
              "Bind the last summit stores into one closing ledger before the Worldstone climb.",
              "last_summit_ledger_tallied",
              ["harrogath_covenant_summit_ledger"],
              [{ kind: "hero_max_life", value: 4 }, { kind: "refill_potions", value: 1 }]
            ),
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "raise_the_last_oath_posts",
              "Raise the Last Oath Posts",
              "Turn the same covenant into one final ring of oath posts across the summit.",
              "last_oath_posts_raised",
              ["harrogath_covenant_oath_posts"],
              [{ kind: "hero_potion_heal", value: 1 }, { kind: "gold_bonus", value: 12 }]
            ),
          ],
        },
        {
          id: "guard_covenant",
          title: "Guard Covenant",
          description: "The recovery guard banners and accorded Ancients posts turn the covenant lane into a true summit close instead of a generic ledger tally.",
          summary: "The recovery and accord routes now settle the summit together once every late lane is spent.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_recovery_guard_banners", "harrogath_accord_ancients_posts"],
          choices: [
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "bind_the_guard_banners",
              "Bind the Guard Banners",
              "Carry the recovered guard banners and accorded posts into one final summit circuit.",
              "guard_banners_bound",
              ["harrogath_covenant_guard_banners"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "seal_the_last_frost_rolls",
              "Seal the Last Frost Rolls",
              "Use the same covenant to seal the last frost rolls before Baal.",
              "last_frost_rolls_sealed",
              ["harrogath_covenant_frost_rolls"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
        {
          id: "ancients_covenant",
          title: "Ancients Covenant",
          description: "Legacy, reckoning, recovery, and accord all converge into a true summit covenant instead of one more guard-post bind.",
          summary: "Every Harrogath late-route payoff now closes together into one final summit covenant.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: [
            "harrogath_legacy_last_guard_ranks",
            "harrogath_reckoning_oath_rations",
            "harrogath_recovery_guard_banners",
            "harrogath_accord_ancients_posts",
          ],
          choices: [
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "seal_the_ancients_ledger",
              "Seal the Ancients Ledger",
              "Carry every late summit line into one final sealed ledger under the Ancients oath.",
              "ancients_ledger_sealed",
              ["harrogath_covenant_ancients_ledger"],
              [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }]
            ),
            buildCovenantChoice(
              "harrogath_covenant_opportunity",
              "harrogath_rescue",
              "ring_the_last_summit_bells",
              "Ring the Last Summit Bells",
              "Use the same covenant to ring the last summit bells before the Worldstone push.",
              "last_summit_bells_rung",
              ["harrogath_covenant_summit_bells"],
              [{ kind: "mercenary_max_life", value: 4 }, { kind: "hero_potion_heal", value: 1 }]
            ),
          ],
        },
      ],
    },
  };

  const DETOUR_OPPORTUNITY_DEFINITIONS: Record<number, DetourOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_detour_opportunity",
      title: "Monastery Detour",
      zoneTitle: "Monastery Detour",
      description: "After the monastery covenant closes, the rogue line can still peel into a quieter detour that banks recovery work instead of rushing the catacombs.",
      summary: "The post-covenant route now fans back out into a safer rogue detour lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresRecoveryOpportunityId: "rogue_recovery_opportunity",
      requiresAccordOpportunityId: "rogue_accord_opportunity",
      requiresCovenantOpportunityId: "rogue_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildDetourChoice, "rogue_detour_opportunity", "tristram_relief", {
          id: "supply_detour",
          title: "Supply Detour",
          description: "Even without a cleaner monastery line, the rogues can still cut one late supply detour before the catacombs open.",
          summary: "A fallback detour opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "secure_the_abbey_sidepass",
            title: "Secure the Abbey Sidepass",
            description: "Cut a quiet line through the abbey stores and hold it ready for the next clash.",
            consequenceId: "abbey_sidepass_secured",
            flagIds: ["rogue_detour_abbey_sidepass"],
            extraEffects: [{ kind: "refill_potions", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "rogue_detour_opportunity", "tristram_relief", {
          id: "lantern_detour",
          title: "Lantern Detour",
          description: "Recovery lanterns and cloister path marks turn the detour lane into a true chapel sidepass instead of one more store check.",
          summary: "The recovery and accord lanes now open a safer sidepass through the monastery.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_recovery_chapel_lanterns", "rogue_accord_cloister_paths"],
          choice: {
            outcomeId: "open_the_chapel_sidepass",
            title: "Open the Chapel Sidepass",
            description: "Turn the relit chapel lanterns and marked cloister paths into a guarded sidepass around the next push.",
            consequenceId: "chapel_sidepass_opened",
            flagIds: ["rogue_detour_chapel_sidepass"],
            extraEffects: [{ kind: "hero_max_life", value: 2 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "rogue_detour_opportunity", "tristram_relief", {
          id: "wayfinder_detour",
          title: "Wayfinder Detour",
          description: "The sealed wayfinder ledger turns the detour into a hidden convoy route that changes how the monastery handles the next fight.",
          summary: "A full rogue late-route close can now turn into a protected convoy detour instead of one more straight assault lane.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_recovery_chapel_lanterns", "rogue_accord_cloister_paths", "rogue_covenant_wayfinder_ledger"],
          choice: {
            outcomeId: "stage_the_hidden_abbey_convoy",
            title: "Stage the Hidden Abbey Convoy",
            description: "Move the covenant ledger, lantern chain, and cloister marks into one hidden convoy around the monastery flank.",
            consequenceId: "hidden_abbey_convoy_staged",
            flagIds: ["rogue_detour_hidden_convoy"],
            extraEffects: [{ kind: "hero_max_life", value: 2 }, { kind: "belt_capacity", value: 1 }],
          },
        }),
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_detour_opportunity",
      title: "Reliquary Detour",
      zoneTitle: "Reliquary Detour",
      description: "After the reliquary covenant closes, the desert line can still break into a supply detour that circles the tomb approach instead of driving straight inward.",
      summary: "The post-covenant route now fans back out into a safer desert detour lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresRecoveryOpportunityId: "sunwell_recovery_opportunity",
      requiresAccordOpportunityId: "sunwell_accord_opportunity",
      requiresCovenantOpportunityId: "sunwell_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildDetourChoice, "sunwell_detour_opportunity", "lost_reliquary", {
          id: "caravan_detour",
          title: "Caravan Detour",
          description: "Even without a truer spearline route, the reliquary can still throw one late detour around the tomb mouth.",
          summary: "A fallback detour opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "secure_the_tomb_sidepass",
            title: "Secure the Tomb Sidepass",
            description: "Cut a caravan sidepass through the outer tomb markers and bank it for the next clash.",
            consequenceId: "tomb_sidepass_secured",
            flagIds: ["sunwell_detour_tomb_sidepass"],
            extraEffects: [{ kind: "refill_potions", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "sunwell_detour_opportunity", "lost_reliquary", {
          id: "ward_detour",
          title: "Ward Detour",
          description: "Recovery wards and accorded spear posts turn the detour lane into a true guarded sidepass instead of another caravan count.",
          summary: "The recovery and accord lanes now open a safer sidepass through the desert line.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_accord_spear_posts"],
          choice: {
            outcomeId: "open_the_warded_sidepass",
            title: "Open the Warded Sidepass",
            description: "Turn the spearline wards and accorded posts into a safer reliquary sidepass for the next advance.",
            consequenceId: "warded_sidepass_opened",
            flagIds: ["sunwell_detour_warded_sidepass"],
            extraEffects: [{ kind: "hero_max_life", value: 3 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "sunwell_detour_opportunity", "lost_reliquary", {
          id: "lance_detour",
          title: "Lance Detour",
          description: "The final lance ledger turns the detour into a hidden caravan line that changes how the next desert fight opens.",
          summary: "A full desert late-route close can now turn into a protected hidden detour instead of another direct push.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_accord_spear_posts", "sunwell_covenant_final_lance_ledger"],
          choice: {
            outcomeId: "stage_the_hidden_reliquary_caravan",
            title: "Stage the Hidden Reliquary Caravan",
            description: "Move the final lance ledger, wards, and spear posts into one hidden caravan around the next tomb breach.",
            consequenceId: "hidden_reliquary_caravan_staged",
            flagIds: ["sunwell_detour_hidden_caravan"],
            extraEffects: [{ kind: "hero_max_life", value: 3 }, { kind: "belt_capacity", value: 1 }],
          },
        }),
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_detour_opportunity",
      title: "Harbor Detour",
      zoneTitle: "Harbor Detour",
      description: "After the harbor covenant closes, Kurast can still peel into a quieter river detour that banks recovery work instead of running straight at the Durance.",
      summary: "The post-covenant route now fans back out into a safer harbor detour lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresRecoveryOpportunityId: "kurast_recovery_opportunity",
      requiresAccordOpportunityId: "kurast_accord_opportunity",
      requiresCovenantOpportunityId: "kurast_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildDetourChoice, "kurast_detour_opportunity", "smugglers_wake", {
          id: "dock_detour",
          title: "Dock Detour",
          description: "Even without a sharper channel line, the harbor can still open one last detour through the old docks.",
          summary: "A fallback detour opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "secure_the_dock_sidepass",
            title: "Secure the Dock Sidepass",
            description: "Cut a quiet path through the dock stores and keep it ready for the next river fight.",
            consequenceId: "dock_sidepass_secured",
            flagIds: ["kurast_detour_dock_sidepass"],
            extraEffects: [{ kind: "refill_potions", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "kurast_detour_opportunity", "smugglers_wake", {
          id: "spellward_detour",
          title: "Spellward Detour",
          description: "Recovery spellward bins and accorded channel marks turn the detour lane into a true riverside sidepass instead of another dock tally.",
          summary: "The recovery and accord lanes now open a safer sidepass through the harbor line.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_recovery_spellward_bins", "kurast_accord_channel_marks"],
          choice: {
            outcomeId: "open_the_spellward_sidepass",
            title: "Open the Spellward Sidepass",
            description: "Turn the spellward bins and channel marks into a guarded sidepass around the next Kurast clash.",
            consequenceId: "spellward_sidepass_opened",
            flagIds: ["kurast_detour_spellward_sidepass"],
            extraEffects: [{ kind: "hero_max_energy", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "kurast_detour_opportunity", "smugglers_wake", {
          id: "harbor_detour",
          title: "Harbor Detour",
          description: "The sealed spellward ledger turns the detour into a hidden fleet line that changes how the next harbor fight opens.",
          summary: "A full harbor late-route close can now turn into a protected fleet detour instead of another straight dock surge.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_recovery_spellward_bins", "kurast_accord_channel_marks", "kurast_covenant_spellward_ledger"],
          choice: {
            outcomeId: "stage_the_hidden_river_fleet",
            title: "Stage the Hidden River Fleet",
            description: "Move the covenant ledger, spellward bins, and channel marks into one hidden fleet around the next Durance push.",
            consequenceId: "hidden_river_fleet_staged",
            flagIds: ["kurast_detour_hidden_fleet"],
            extraEffects: [{ kind: "hero_max_energy", value: 1 }, { kind: "gold_bonus", value: 12 }],
          },
        }),
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_detour_opportunity",
      title: "Sanctuary Detour",
      zoneTitle: "Sanctuary Detour",
      description: "After the sanctuary covenant closes, the forge line can still turn into a hard relief detour that circles the next breach instead of driving straight through it.",
      summary: "The post-covenant route now fans back out into a safer sanctuary detour lane.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresRecoveryOpportunityId: "hellforge_recovery_opportunity",
      requiresAccordOpportunityId: "hellforge_accord_opportunity",
      requiresCovenantOpportunityId: "hellforge_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildDetourChoice, "hellforge_detour_opportunity", "hellforge_claim", {
          id: "ash_detour",
          title: "Ash Detour",
          description: "Even without a truer forge relief line, the sanctuary can still open one late detour through the ash belts.",
          summary: "A fallback detour opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "secure_the_ash_sidepass",
            title: "Secure the Ash Sidepass",
            description: "Cut a relief line through the ash belts and hold it ready for the next sanctuary clash.",
            consequenceId: "ash_sidepass_secured",
            flagIds: ["hellforge_detour_ash_sidepass"],
            extraEffects: [{ kind: "refill_potions", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "hellforge_detour_opportunity", "hellforge_claim", {
          id: "hellward_detour",
          title: "Hellward Detour",
          description: "Recovery hellward screens and accord relief lines turn the detour lane into a true sidepass instead of another ash count.",
          summary: "The recovery and accord lanes now open a safer sidepass through the infernal cut.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_recovery_hellward_screen", "hellforge_accord_hellward_relief"],
          choice: {
            outcomeId: "open_the_hellward_sidepass",
            title: "Open the Hellward Sidepass",
            description: "Turn the screened hellward line and relief posts into a guarded sidepass around the next breach.",
            consequenceId: "hellward_sidepass_opened",
            flagIds: ["hellforge_detour_hellward_sidepass"],
            extraEffects: [{ kind: "hero_max_life", value: 3 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "hellforge_detour_opportunity", "hellforge_claim", {
          id: "breachscreen_detour",
          title: "Breachscreen Detour",
          description: "The breachscreen ledger turns the detour into a hidden relief line that changes how the next sanctuary fight breaks.",
          summary: "A full sanctuary late-route close can now turn into a protected relief detour instead of another direct breach.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_recovery_hellward_screen", "hellforge_accord_hellward_relief", "hellforge_covenant_breachscreen_ledger"],
          choice: {
            outcomeId: "stage_the_hidden_relief_line",
            title: "Stage the Hidden Relief Line",
            description: "Move the covenant ledger, relief posts, and hellward screens into one hidden line around the next sanctuary break.",
            consequenceId: "hidden_relief_line_staged",
            flagIds: ["hellforge_detour_hidden_relief"],
            extraEffects: [{ kind: "hero_max_life", value: 3 }, { kind: "belt_capacity", value: 1 }],
          },
        }),
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_detour_opportunity",
      title: "Summit Detour",
      zoneTitle: "Summit Detour",
      description: "After the summit covenant closes, Harrogath can still break into a guarded sled detour that circles the last ascent instead of driving straight at the Worldstone.",
      summary: "The post-covenant route now fans back out into a safer summit detour lane.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresRecoveryOpportunityId: "harrogath_recovery_opportunity",
      requiresAccordOpportunityId: "harrogath_accord_opportunity",
      requiresCovenantOpportunityId: "harrogath_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildDetourChoice, "harrogath_detour_opportunity", "harrogath_rescue", {
          id: "summit_detour",
          title: "Sled Detour",
          description: "Even without a sharper summit line, Harrogath can still open one last sled detour around the frozen climb.",
          summary: "A fallback detour opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "secure_the_sled_sidepass",
            title: "Secure the Sled Sidepass",
            description: "Cut a quiet sled path across the frozen switchbacks and bank it for the next clash.",
            consequenceId: "sled_sidepass_secured",
            flagIds: ["harrogath_detour_sled_sidepass"],
            extraEffects: [{ kind: "refill_potions", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "harrogath_detour_opportunity", "harrogath_rescue", {
          id: "banner_detour",
          title: "Banner Detour",
          description: "Recovery banners and accorded Ancients posts turn the detour lane into a true mountain sidepass instead of another ration count.",
          summary: "The recovery and accord lanes now open a safer sidepass across the summit line.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_recovery_guard_banners", "harrogath_accord_ancients_posts"],
          choice: {
            outcomeId: "open_the_banner_sidepass",
            title: "Open the Banner Sidepass",
            description: "Turn the recovered banners and accorded posts into a guarded sidepass around the next summit clash.",
            consequenceId: "banner_sidepass_opened",
            flagIds: ["harrogath_detour_banner_sidepass"],
            extraEffects: [{ kind: "hero_max_life", value: 4 }],
          },
        }),
        buildLateRouteVariant(buildDetourChoice, "harrogath_detour_opportunity", "harrogath_rescue", {
          id: "ancients_detour",
          title: "Ancients Detour",
          description: "The Ancients ledger turns the detour into a hidden sled chain that changes how the next summit fight opens.",
          summary: "A full summit late-route close can now turn into a protected sled detour instead of another straight Worldstone rush.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_recovery_guard_banners", "harrogath_accord_ancients_posts", "harrogath_covenant_ancients_ledger"],
          choice: {
            outcomeId: "stage_the_hidden_ancients_sleds",
            title: "Stage the Hidden Ancients Sleds",
            description: "Move the covenant ledger, guard banners, and Ancients posts into one hidden sled chain before the next Worldstone push.",
            consequenceId: "hidden_ancients_sleds_staged",
            flagIds: ["harrogath_detour_hidden_sleds"],
            extraEffects: [{ kind: "hero_max_life", value: 4 }, { kind: "belt_capacity", value: 1 }],
          },
        }),
      ],
    },
  };

  const ESCALATION_OPPORTUNITY_DEFINITIONS: Record<number, EscalationOpportunityDefinition> = {
    1: {
      kind: "opportunity",
      id: "rogue_escalation_opportunity",
      title: "Catacomb Escalation",
      zoneTitle: "Catacomb Escalation",
      description: "After the monastery covenant closes, the rogue line can also sharpen into a harsher escalation that spends the late gains on direct pressure.",
      summary: "The post-covenant route now fans back out into a higher-risk rogue escalation lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "tristram_relief",
      requiresLegacyOpportunityId: "rogue_legacy_opportunity",
      requiresReckoningOpportunityId: "rogue_reckoning_opportunity",
      requiresCovenantOpportunityId: "rogue_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildEscalationChoice, "rogue_escalation_opportunity", "tristram_relief", {
          id: "ridge_escalation",
          title: "Ridge Escalation",
          description: "Even without a cleaner line, the rogues can still turn the late route into one final ridge push.",
          summary: "A fallback escalation opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "press_the_ridge_watch",
            title: "Press the Ridge Watch",
            description: "Spend the late route on a direct ridge surge instead of another slower sweep.",
            consequenceId: "ridge_watch_pressed",
            flagIds: ["rogue_escalation_ridge_watch"],
            extraEffects: [{ kind: "gold_bonus", value: 12 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "rogue_escalation_opportunity", "tristram_relief", {
          id: "ledger_escalation",
          title: "Ledger Escalation",
          description: "Legacy wayfinders and the chapel ledger turn the escalation lane into a true pressure route instead of one more ridge check.",
          summary: "The legacy and reckoning lanes now sharpen the monastery into a direct strike route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_legacy_wayfinder_chain", "rogue_reckoning_chapel_ledger"],
          choice: {
            outcomeId: "crack_the_chapel_surge",
            title: "Crack the Chapel Surge",
            description: "Turn the wayfinder chain and chapel ledger into a harder pressure wave through the monastery.",
            consequenceId: "chapel_surge_cracked",
            flagIds: ["rogue_escalation_chapel_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "rogue_escalation_opportunity", "tristram_relief", {
          id: "catacomb_escalation",
          title: "Catacomb Escalation",
          description: "The sealed wayfinder ledger turns the escalation into a full catacomb surge that changes how the next elite line behaves.",
          summary: "A full rogue late-route close can now be spent on one sharper catacomb surge instead of another cautious setup.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["rogue_legacy_wayfinder_chain", "rogue_reckoning_chapel_ledger", "rogue_covenant_wayfinder_ledger"],
          choice: {
            outcomeId: "drive_the_catacomb_surge",
            title: "Drive the Catacomb Surge",
            description: "Spend the legacy, reckoning, and covenant lines on one direct catacomb surge before Andariel.",
            consequenceId: "catacomb_surge_driven",
            flagIds: ["rogue_escalation_catacomb_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }],
          },
        }),
      ],
    },
    2: {
      kind: "opportunity",
      id: "sunwell_escalation_opportunity",
      title: "Chamber Escalation",
      zoneTitle: "Chamber Escalation",
      description: "After the reliquary covenant closes, the desert line can also sharpen into a harsher escalation that spends the late gains on a direct chamber breach.",
      summary: "The post-covenant route now fans back out into a higher-risk desert escalation lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "lost_reliquary",
      requiresLegacyOpportunityId: "sunwell_legacy_opportunity",
      requiresReckoningOpportunityId: "sunwell_reckoning_opportunity",
      requiresCovenantOpportunityId: "sunwell_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildEscalationChoice, "sunwell_escalation_opportunity", "lost_reliquary", {
          id: "dune_escalation",
          title: "Dune Escalation",
          description: "Even without a truer lance route, the desert can still spend the late path on one final dune push.",
          summary: "A fallback escalation opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "press_the_dune_push",
            title: "Press the Dune Push",
            description: "Turn the late route into one harder dune push instead of another slower screen.",
            consequenceId: "dune_push_pressed",
            flagIds: ["sunwell_escalation_dune_push"],
            extraEffects: [{ kind: "gold_bonus", value: 12 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "sunwell_escalation_opportunity", "lost_reliquary", {
          id: "lance_escalation",
          title: "Lance Escalation",
          description: "Legacy spear posts and lance wards turn the escalation lane into a true chamber breach instead of one more dune probe.",
          summary: "The legacy and reckoning lanes now sharpen the desert into a direct strike route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_legacy_last_spear_posts", "sunwell_reckoning_lance_wards"],
          choice: {
            outcomeId: "crack_the_lance_breach",
            title: "Crack the Lance Breach",
            description: "Turn the spear posts and lance wards into a harder breach through the next reliquary line.",
            consequenceId: "lance_breach_cracked",
            flagIds: ["sunwell_escalation_lance_breach"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "sunwell_escalation_opportunity", "lost_reliquary", {
          id: "chamber_escalation",
          title: "Chamber Escalation",
          description: "The final lance ledger turns the escalation into a full chamber surge that changes how the next elite line behaves.",
          summary: "A full desert late-route close can now be spent on one sharper chamber surge instead of another cautious setup.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["sunwell_legacy_last_spear_posts", "sunwell_reckoning_lance_wards", "sunwell_covenant_final_lance_ledger"],
          choice: {
            outcomeId: "drive_the_chamber_surge",
            title: "Drive the Chamber Surge",
            description: "Spend the legacy, reckoning, and covenant lines on one direct chamber surge before Duriel.",
            consequenceId: "chamber_surge_driven",
            flagIds: ["sunwell_escalation_chamber_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }],
          },
        }),
      ],
    },
    3: {
      kind: "opportunity",
      id: "kurast_escalation_opportunity",
      title: "Durance Escalation",
      zoneTitle: "Durance Escalation",
      description: "After the harbor covenant closes, Kurast can also sharpen into a harsher escalation that spends the late gains on a direct durance push.",
      summary: "The post-covenant route now fans back out into a higher-risk harbor escalation lane.",
      grants: { gold: 10, xp: 12, potions: 0 },
      requiresQuestId: "smugglers_wake",
      requiresLegacyOpportunityId: "kurast_legacy_opportunity",
      requiresReckoningOpportunityId: "kurast_reckoning_opportunity",
      requiresCovenantOpportunityId: "kurast_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildEscalationChoice, "kurast_escalation_opportunity", "smugglers_wake", {
          id: "dock_escalation",
          title: "Dock Escalation",
          description: "Even without a truer spellward line, Kurast can still spend the late route on one final dock push.",
          summary: "A fallback escalation opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "press_the_dock_push",
            title: "Press the Dock Push",
            description: "Turn the late route into one harder dockside push instead of another slower river screen.",
            consequenceId: "dock_push_pressed",
            flagIds: ["kurast_escalation_dock_push"],
            extraEffects: [{ kind: "gold_bonus", value: 12 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "kurast_escalation_opportunity", "smugglers_wake", {
          id: "seal_escalation",
          title: "Seal Escalation",
          description: "Legacy spellwards and harbor seals turn the escalation lane into a true durance breach instead of one more dock probe.",
          summary: "The legacy and reckoning lanes now sharpen the harbor into a direct strike route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_legacy_last_spellward", "kurast_reckoning_harbor_seals"],
          choice: {
            outcomeId: "crack_the_harbor_seal_push",
            title: "Crack the Harbor Seal Push",
            description: "Turn the spellward legacy and harbor seals into a harder surge through the next river line.",
            consequenceId: "harbor_seal_push_cracked",
            flagIds: ["kurast_escalation_harbor_push"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "kurast_escalation_opportunity", "smugglers_wake", {
          id: "durance_escalation",
          title: "Durance Escalation",
          description: "The spellward ledger turns the escalation into a full durance surge that changes how the next elite line behaves.",
          summary: "A full harbor late-route close can now be spent on one sharper durance surge instead of another cautious setup.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["kurast_legacy_last_spellward", "kurast_reckoning_harbor_seals", "kurast_covenant_spellward_ledger"],
          choice: {
            outcomeId: "drive_the_durance_surge",
            title: "Drive the Durance Surge",
            description: "Spend the legacy, reckoning, and covenant lines on one direct durance surge before Mephisto.",
            consequenceId: "durance_surge_driven",
            flagIds: ["kurast_escalation_durance_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_energy", value: 1 }],
          },
        }),
      ],
    },
    4: {
      kind: "opportunity",
      id: "hellforge_escalation_opportunity",
      title: "Sanctuary Escalation",
      zoneTitle: "Sanctuary Escalation",
      description: "After the sanctuary covenant closes, the forge line can also sharpen into a harsher escalation that spends the late gains on a direct sanctuary breach.",
      summary: "The post-covenant route now fans back out into a higher-risk sanctuary escalation lane.",
      grants: { gold: 12, xp: 12, potions: 0 },
      requiresQuestId: "hellforge_claim",
      requiresLegacyOpportunityId: "hellforge_legacy_opportunity",
      requiresReckoningOpportunityId: "hellforge_reckoning_opportunity",
      requiresCovenantOpportunityId: "hellforge_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildEscalationChoice, "hellforge_escalation_opportunity", "hellforge_claim", {
          id: "ash_escalation",
          title: "Ash Escalation",
          description: "Even without a truer breachscreen line, the sanctuary can still spend the late route on one final ash push.",
          summary: "A fallback escalation opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "press_the_ash_push",
            title: "Press the Ash Push",
            description: "Turn the late route into one harder ash-belt push instead of another slower relief line.",
            consequenceId: "ash_push_pressed",
            flagIds: ["hellforge_escalation_ash_push"],
            extraEffects: [{ kind: "gold_bonus", value: 12 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "hellforge_escalation_opportunity", "hellforge_claim", {
          id: "screen_escalation",
          title: "Screen Escalation",
          description: "Legacy breachscreens and sanctuary screens turn the escalation lane into a true infernal break instead of one more ash probe.",
          summary: "The legacy and reckoning lanes now sharpen the sanctuary into a direct strike route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_legacy_last_breachscreen", "hellforge_reckoning_sanctuary_screens"],
          choice: {
            outcomeId: "crack_the_sanctuary_screen",
            title: "Crack the Sanctuary Screen",
            description: "Turn the breachscreen legacy and sanctuary screens into a harder surge through the next infernal line.",
            consequenceId: "sanctuary_screen_cracked",
            flagIds: ["hellforge_escalation_sanctuary_screen"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "hellforge_escalation_opportunity", "hellforge_claim", {
          id: "sanctuary_escalation",
          title: "Sanctuary Escalation",
          description: "The breachscreen ledger turns the escalation into a full sanctuary surge that changes how the next elite line behaves.",
          summary: "A full sanctuary late-route close can now be spent on one sharper infernal surge instead of another cautious setup.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["hellforge_legacy_last_breachscreen", "hellforge_reckoning_sanctuary_screens", "hellforge_covenant_breachscreen_ledger"],
          choice: {
            outcomeId: "drive_the_sanctuary_surge",
            title: "Drive the Sanctuary Surge",
            description: "Spend the legacy, reckoning, and covenant lines on one direct sanctuary surge before Diablo.",
            consequenceId: "sanctuary_surge_driven",
            flagIds: ["hellforge_escalation_sanctuary_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 3 }],
          },
        }),
      ],
    },
    5: {
      kind: "opportunity",
      id: "harrogath_escalation_opportunity",
      title: "Worldstone Escalation",
      zoneTitle: "Worldstone Escalation",
      description: "After the summit covenant closes, Harrogath can also sharpen into a harsher escalation that spends the late gains on a direct Worldstone surge.",
      summary: "The post-covenant route now fans back out into a higher-risk summit escalation lane.",
      grants: { gold: 12, xp: 14, potions: 0 },
      requiresQuestId: "harrogath_rescue",
      requiresLegacyOpportunityId: "harrogath_legacy_opportunity",
      requiresReckoningOpportunityId: "harrogath_reckoning_opportunity",
      requiresCovenantOpportunityId: "harrogath_covenant_opportunity",
      variants: [
        buildLateRouteVariant(buildEscalationChoice, "harrogath_escalation_opportunity", "harrogath_rescue", {
          id: "watch_escalation",
          title: "Watch Escalation",
          description: "Even without a truer summit line, Harrogath can still spend the late route on one final watch push.",
          summary: "A fallback escalation opens after the covenant resolves.",
          grants: { gold: 6, xp: 8, potions: 0 },
          choice: {
            outcomeId: "press_the_watch_push",
            title: "Press the Watch Push",
            description: "Turn the late route into one harder summit watch push instead of another slower sled sweep.",
            consequenceId: "watch_push_pressed",
            flagIds: ["harrogath_escalation_watch_push"],
            extraEffects: [{ kind: "gold_bonus", value: 12 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "harrogath_escalation_opportunity", "harrogath_rescue", {
          id: "oath_escalation",
          title: "Oath Escalation",
          description: "Legacy guard ranks and oath rations turn the escalation lane into a true Worldstone breach instead of one more summit probe.",
          summary: "The legacy and reckoning lanes now sharpen the summit into a direct strike route.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_legacy_last_guard_ranks", "harrogath_reckoning_oath_rations"],
          choice: {
            outcomeId: "crack_the_oath_surge",
            title: "Crack the Oath Surge",
            description: "Turn the guard ranks and oath rations into a harder surge through the next summit line.",
            consequenceId: "oath_surge_cracked",
            flagIds: ["harrogath_escalation_oath_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }],
          },
        }),
        buildLateRouteVariant(buildEscalationChoice, "harrogath_escalation_opportunity", "harrogath_rescue", {
          id: "worldstone_escalation",
          title: "Worldstone Escalation",
          description: "The Ancients ledger turns the escalation into a full Worldstone surge that changes how the next elite line behaves.",
          summary: "A full summit late-route close can now be spent on one sharper Worldstone surge instead of another cautious setup.",
          grants: { gold: 8, xp: 8, potions: 0 },
          requiresFlagIds: ["harrogath_legacy_last_guard_ranks", "harrogath_reckoning_oath_rations", "harrogath_covenant_ancients_ledger"],
          choice: {
            outcomeId: "drive_the_worldstone_surge",
            title: "Drive the Worldstone Surge",
            description: "Spend the legacy, reckoning, and covenant lines on one direct Worldstone surge before Baal.",
            consequenceId: "worldstone_surge_driven",
            flagIds: ["harrogath_escalation_worldstone_surge"],
            extraEffects: [{ kind: "mercenary_attack", value: 1 }, { kind: "hero_max_life", value: 4 }],
          },
        }),
      ],
    },
  };

  function buildExpandedShrineDefinitions() {
    return Object.keys(SHRINE_DEFINITIONS).reduce((definitions, actKey) => {
      const actNumber = Number(actKey);
      definitions[actNumber] = {
        ...SHRINE_DEFINITIONS[actNumber],
        choices: [
          ...SHRINE_DEFINITIONS[actNumber].choices,
          ...(ADDITIONAL_SHRINE_CHOICES[actNumber] || []),
        ],
      };
      return definitions;
    }, {} as Record<number, ShrineNodeDefinition>);
  }

  function buildExpandedOpportunityDefinitions() {
    return Object.keys(OPPORTUNITY_DEFINITIONS).reduce((definitions, actKey) => {
      const actNumber = Number(actKey);
      definitions[actNumber] = {
        ...OPPORTUNITY_DEFINITIONS[actNumber],
        variants: [
          ...OPPORTUNITY_DEFINITIONS[actNumber].variants,
          ...(ADDITIONAL_OPPORTUNITY_VARIANTS[actNumber] || []),
        ],
      };
      return definitions;
    }, {} as Record<number, OpportunityNodeDefinition>);
  }

  // Keep the authored base literals readable, then enrich them in one place for the live catalog.
  const EXPANDED_SHRINE_DEFINITIONS = buildExpandedShrineDefinitions();
  const EXPANDED_OPPORTUNITY_DEFINITIONS = buildExpandedOpportunityDefinitions();

  function getCatalog(): WorldNodeCatalog {
    return {
      quests: QUEST_DEFINITIONS,
      shrines: EXPANDED_SHRINE_DEFINITIONS,
      events: EVENT_DEFINITIONS,
      opportunities: EXPANDED_OPPORTUNITY_DEFINITIONS,
      crossroadOpportunities: CROSSROAD_OPPORTUNITY_DEFINITIONS,
      shrineOpportunities: SHRINE_OPPORTUNITY_DEFINITIONS,
      reserveOpportunities: RESERVE_OPPORTUNITY_DEFINITIONS,
      relayOpportunities: RELAY_OPPORTUNITY_DEFINITIONS,
      culminationOpportunities: CULMINATION_OPPORTUNITY_DEFINITIONS,
      legacyOpportunities: LEGACY_OPPORTUNITY_DEFINITIONS,
      reckoningOpportunities: RECKONING_OPPORTUNITY_DEFINITIONS,
      recoveryOpportunities: RECOVERY_OPPORTUNITY_DEFINITIONS,
      accordOpportunities: ACCORD_OPPORTUNITY_DEFINITIONS,
      covenantOpportunities: COVENANT_OPPORTUNITY_DEFINITIONS,
      detourOpportunities: DETOUR_OPPORTUNITY_DEFINITIONS,
      escalationOpportunities: ESCALATION_OPPORTUNITY_DEFINITIONS,
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

  function buildNodeZone(kind, nodeDefinition, actSeed, prerequisites, nodeType = kind) {
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
      nodeType,
    };
  }

  function getQuestDefinition(actNumber) {
    return QUEST_DEFINITIONS[actNumber] || QUEST_DEFINITIONS[1];
  }

  function getShrineDefinition(actNumber) {
    return EXPANDED_SHRINE_DEFINITIONS[actNumber] || EXPANDED_SHRINE_DEFINITIONS[1];
  }

  function getEventDefinition(actNumber) {
    return EVENT_DEFINITIONS[actNumber] || EVENT_DEFINITIONS[1];
  }

  function getOpportunityDefinition(actNumber) {
    return EXPANDED_OPPORTUNITY_DEFINITIONS[actNumber] || EXPANDED_OPPORTUNITY_DEFINITIONS[1];
  }

  function getCrossroadOpportunityDefinition(actNumber) {
    return CROSSROAD_OPPORTUNITY_DEFINITIONS[actNumber] || CROSSROAD_OPPORTUNITY_DEFINITIONS[1];
  }

  function getShrineOpportunityDefinition(actNumber) {
    return SHRINE_OPPORTUNITY_DEFINITIONS[actNumber] || SHRINE_OPPORTUNITY_DEFINITIONS[1];
  }

  function getReserveOpportunityDefinition(actNumber) {
    return RESERVE_OPPORTUNITY_DEFINITIONS[actNumber] || RESERVE_OPPORTUNITY_DEFINITIONS[1];
  }

  function getRelayOpportunityDefinition(actNumber) {
    return RELAY_OPPORTUNITY_DEFINITIONS[actNumber] || RELAY_OPPORTUNITY_DEFINITIONS[1];
  }

  function getCulminationOpportunityDefinition(actNumber) {
    return CULMINATION_OPPORTUNITY_DEFINITIONS[actNumber] || CULMINATION_OPPORTUNITY_DEFINITIONS[1];
  }

  function getLegacyOpportunityDefinition(actNumber) {
    return LEGACY_OPPORTUNITY_DEFINITIONS[actNumber] || LEGACY_OPPORTUNITY_DEFINITIONS[1];
  }

  function getReckoningOpportunityDefinition(actNumber) {
    return RECKONING_OPPORTUNITY_DEFINITIONS[actNumber] || RECKONING_OPPORTUNITY_DEFINITIONS[1];
  }

  function getRecoveryOpportunityDefinition(actNumber) {
    return RECOVERY_OPPORTUNITY_DEFINITIONS[actNumber] || RECOVERY_OPPORTUNITY_DEFINITIONS[1];
  }

  function getAccordOpportunityDefinition(actNumber) {
    return ACCORD_OPPORTUNITY_DEFINITIONS[actNumber] || ACCORD_OPPORTUNITY_DEFINITIONS[1];
  }

  function getCovenantOpportunityDefinition(actNumber) {
    return COVENANT_OPPORTUNITY_DEFINITIONS[actNumber] || COVENANT_OPPORTUNITY_DEFINITIONS[1];
  }

  function getDetourOpportunityDefinition(actNumber) {
    return DETOUR_OPPORTUNITY_DEFINITIONS[actNumber] || DETOUR_OPPORTUNITY_DEFINITIONS[1];
  }

  function getEscalationOpportunityDefinition(actNumber) {
    return ESCALATION_OPPORTUNITY_DEFINITIONS[actNumber] || ESCALATION_OPPORTUNITY_DEFINITIONS[1];
  }

  function isShrineOpportunityNodeId(nodeId) {
    return Object.values(SHRINE_OPPORTUNITY_DEFINITIONS).some((definition) => definition.id === nodeId);
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

  function createCrossroadOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCrossroadOpportunityDefinition(actSeed.act), actSeed, prerequisites, "crossroad_opportunity");
  }

  function createShrineOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getShrineOpportunityDefinition(actSeed.act), actSeed, prerequisites, "shrine_opportunity");
  }

  function createReserveOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getReserveOpportunityDefinition(actSeed.act), actSeed, prerequisites, "reserve_opportunity");
  }

  function createRelayOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getRelayOpportunityDefinition(actSeed.act), actSeed, prerequisites, "relay_opportunity");
  }

  function createCulminationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCulminationOpportunityDefinition(actSeed.act), actSeed, prerequisites, "culmination_opportunity");
  }

  function createLegacyOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getLegacyOpportunityDefinition(actSeed.act), actSeed, prerequisites, "legacy_opportunity");
  }

  function createReckoningOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getReckoningOpportunityDefinition(actSeed.act), actSeed, prerequisites, "reckoning_opportunity");
  }

  function createRecoveryOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getRecoveryOpportunityDefinition(actSeed.act), actSeed, prerequisites, "recovery_opportunity");
  }

  function createAccordOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getAccordOpportunityDefinition(actSeed.act), actSeed, prerequisites, "accord_opportunity");
  }

  function createCovenantOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getCovenantOpportunityDefinition(actSeed.act), actSeed, prerequisites, "covenant_opportunity");
  }

  function createDetourOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getDetourOpportunityDefinition(actSeed.act), actSeed, prerequisites, "detour_opportunity");
  }

  function createEscalationOpportunityZone({
    actSeed,
    prerequisites,
  }: {
    actSeed: ActSeed;
    prerequisites: string[];
  }): ZoneState {
    ensureValidCatalog();
    return buildNodeZone("opportunity", getEscalationOpportunityDefinition(actSeed.act), actSeed, prerequisites, "escalation_opportunity");
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
    const shrineOpportunityZone = createShrineOpportunityZone({
      actSeed,
      prerequisites: [shrineZone.id],
    });
    const crossroadOpportunityZone = createCrossroadOpportunityZone({
      actSeed,
      prerequisites: [eventZone.id, shrineZone.id],
    });
    const reserveOpportunityZone = createReserveOpportunityZone({
      actSeed,
      prerequisites: [opportunityZone.id, shrineOpportunityZone.id, crossroadOpportunityZone.id],
    });
    const relayOpportunityZone = createRelayOpportunityZone({
      actSeed,
      prerequisites: [reserveOpportunityZone.id],
    });
    const culminationOpportunityZone = createCulminationOpportunityZone({
      actSeed,
      prerequisites: [relayOpportunityZone.id],
    });
    const legacyOpportunityZone = createLegacyOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const reckoningOpportunityZone = createReckoningOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const recoveryOpportunityZone = createRecoveryOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const accordOpportunityZone = createAccordOpportunityZone({
      actSeed,
      prerequisites: [culminationOpportunityZone.id],
    });
    const covenantOpportunityZone = createCovenantOpportunityZone({
      actSeed,
      prerequisites: [legacyOpportunityZone.id, reckoningOpportunityZone.id, recoveryOpportunityZone.id, accordOpportunityZone.id],
    });
    const detourOpportunityZone = createDetourOpportunityZone({
      actSeed,
      prerequisites: [covenantOpportunityZone.id],
    });
    const escalationOpportunityZone = createEscalationOpportunityZone({
      actSeed,
      prerequisites: [covenantOpportunityZone.id],
    });
    return [
      questZone,
      shrineZone,
      eventZone,
      opportunityZone,
      shrineOpportunityZone,
      crossroadOpportunityZone,
      reserveOpportunityZone,
      relayOpportunityZone,
      culminationOpportunityZone,
      legacyOpportunityZone,
      reckoningOpportunityZone,
      recoveryOpportunityZone,
      accordOpportunityZone,
      covenantOpportunityZone,
      detourOpportunityZone,
      escalationOpportunityZone,
    ];
  }

  function isWorldNodeZone(zone) {
    return zone?.kind === "quest" || zone?.kind === "shrine" || zone?.kind === "event" || zone?.kind === "opportunity";
  }

  function getWorldNodeVariantsApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_VARIANTS) {
      throw new Error("World-node variant helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_VARIANTS;
  }

  function resolveEventFollowUp(run, actNumber) {
    return getWorldNodeVariantsApi().resolveEventFollowUp(run, actNumber);
  }

  function resolveOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveOpportunityVariant(run, actNumber);
  }

  function resolveCrossroadOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCrossroadOpportunityVariant(run, actNumber);
  }

  function resolveShrineOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveShrineOpportunityVariant(run, actNumber);
  }

  function resolveReserveOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveReserveOpportunityVariant(run, actNumber);
  }

  function resolveRelayOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveRelayOpportunityVariant(run, actNumber);
  }

  function resolveCulminationOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCulminationOpportunityVariant(run, actNumber);
  }

  function resolveLegacyOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveLegacyOpportunityVariant(run, actNumber);
  }

  function resolveReckoningOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveReckoningOpportunityVariant(run, actNumber);
  }

  function resolveRecoveryOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveRecoveryOpportunityVariant(run, actNumber);
  }

  function resolveAccordOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveAccordOpportunityVariant(run, actNumber);
  }

  function resolveCovenantOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveCovenantOpportunityVariant(run, actNumber);
  }

  function resolveDetourOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveDetourOpportunityVariant(run, actNumber);
  }

  function resolveEscalationOpportunityVariant(run, actNumber) {
    return getWorldNodeVariantsApi().resolveEscalationOpportunityVariant(run, actNumber);
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

    if (zone.kind === "opportunity" && zone.nodeType === "shrine_opportunity") {
      const { shrineOpportunityDefinition, shrineRecord, variant } = resolveShrineOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || shrineOpportunityDefinition.title,
        lines: [
          shrineOpportunityDefinition.summary,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...shrineOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "crossroad_opportunity") {
      const { crossroadOpportunityDefinition, questRecord, shrineRecord, variant } = resolveCrossroadOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || crossroadOpportunityDefinition.title,
        lines: [
          crossroadOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...crossroadOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "reserve_opportunity") {
      const { reserveOpportunityDefinition, opportunityRecord, shrineOpportunityRecord, crossroadOpportunityRecord, variant } =
        resolveReserveOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || reserveOpportunityDefinition.title,
        lines: [
          reserveOpportunityDefinition.summary,
          `Earlier route lane: ${opportunityRecord.outcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...reserveOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "relay_opportunity") {
      const { relayOpportunityDefinition, reserveOpportunityRecord, variant } = resolveRelayOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || relayOpportunityDefinition.title,
        lines: [
          relayOpportunityDefinition.summary,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...relayOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "culmination_opportunity") {
      const { culminationOpportunityDefinition, questRecord, relayOpportunityRecord, variant } = resolveCulminationOpportunityVariant(
        run,
        actNumber
      );
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || culminationOpportunityDefinition.title,
        lines: [
          culminationOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier relay lane: ${relayOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...culminationOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "legacy_opportunity") {
      const { legacyOpportunityDefinition, questRecord, culminationOpportunityRecord, variant } = resolveLegacyOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || legacyOpportunityDefinition.title,
        lines: [
          legacyOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...legacyOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "reckoning_opportunity") {
      const { reckoningOpportunityDefinition, questRecord, reserveOpportunityRecord, culminationOpportunityRecord, variant } =
        resolveReckoningOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || reckoningOpportunityDefinition.title,
        lines: [
          reckoningOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...reckoningOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "recovery_opportunity") {
      const { recoveryOpportunityDefinition, questRecord, shrineOpportunityRecord, culminationOpportunityRecord, variant } =
        resolveRecoveryOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || recoveryOpportunityDefinition.title,
        lines: [
          recoveryOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...recoveryOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "accord_opportunity") {
      const {
        accordOpportunityDefinition,
        questRecord,
        shrineOpportunityRecord,
        crossroadOpportunityRecord,
        culminationOpportunityRecord,
        variant,
      } = resolveAccordOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || accordOpportunityDefinition.title,
        lines: [
          accordOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...accordOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "covenant_opportunity") {
      const {
        covenantOpportunityDefinition,
        questRecord,
        legacyOpportunityRecord,
        reckoningOpportunityRecord,
        recoveryOpportunityRecord,
        accordOpportunityRecord,
        variant,
      } = resolveCovenantOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || covenantOpportunityDefinition.title,
        lines: [
          covenantOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...covenantOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "detour_opportunity") {
      const {
        accordOpportunityRecord,
        covenantOpportunityRecord,
        detourOpportunityDefinition,
        questRecord,
        recoveryOpportunityRecord,
        variant,
      } = resolveDetourOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || detourOpportunityDefinition.title,
        lines: [
          detourOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...detourOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === "opportunity" && zone.nodeType === "escalation_opportunity") {
      const {
        covenantOpportunityRecord,
        escalationOpportunityDefinition,
        legacyOpportunityRecord,
        questRecord,
        reckoningOpportunityRecord,
        variant,
      } = resolveEscalationOpportunityVariant(run, actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: variant.title || escalationOpportunityDefinition.title,
        lines: [
          escalationOpportunityDefinition.summary,
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
          variant.summary,
          `${zone.title} is now clear.`,
        ],
        grants: { ...escalationOpportunityDefinition.grants, ...(variant.grants || {}) },
        choices: variant.choices.map((choiceDefinition) => buildChoice("opportunity", choiceDefinition)),
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

  function applyChoice(run, reward, choice) {
    if (!runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES) {
      return { ok: false, message: "World-node outcome helper is unavailable." };
    }
    return runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES.applyChoice(run, reward, choice, {
      isShrineOpportunityNodeId,
    });
  }

  assertValidCatalog();

  runtimeWindow.ROUGE_WORLD_NODES = {
    getCatalog,
    assertValidCatalog,
    createQuestZone,
    createShrineZone,
    createEventZone,
    createOpportunityZone,
    createCrossroadOpportunityZone,
    createShrineOpportunityZone,
    createReserveOpportunityZone,
    createRelayOpportunityZone,
    createCulminationOpportunityZone,
    createLegacyOpportunityZone,
    createReckoningOpportunityZone,
    createRecoveryOpportunityZone,
    createAccordOpportunityZone,
    createCovenantOpportunityZone,
    createDetourOpportunityZone,
    createEscalationOpportunityZone,
    createActWorldNodes,
    isWorldNodeZone,
    buildZoneReward,
    applyChoice,
  };
})();
