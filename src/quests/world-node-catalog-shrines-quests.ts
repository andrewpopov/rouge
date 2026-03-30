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
                description: "Spend more of the bargain on the people carrying you to the Cinder Tyrant.",
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
      title: "Frosthaven Rescue",
      zoneTitle: "Frosthaven Rescue",
      description: "A trapped scouting party can be rescued, armed, or stripped for supplies before the Ruin Crown approach.",
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
            summary: "The saved party creates a second war-camp choice before the Siege Tyrant.",
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
          description: "Bind yourself to Frosthaven's defense and push both stamina and focus upward.",
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

  runtimeWindow.__ROUGE_WNC_SHRINES_QUESTS = {
    questsB: QUEST_DEFINITIONS_B,
  };
})();
