(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    questOutcomeEffect,
    nodeOutcomeEffect,
    questFollowUpEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const QUEST_DEFINITIONS_B: Record<number, QuestNodeDefinition> = {
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

  runtimeWindow.__ROUGE_WNC_SHRINES = {
    questsB: QUEST_DEFINITIONS_B,
    SHRINE_DEFINITIONS,
    EVENT_DEFINITIONS,
  };
})();
