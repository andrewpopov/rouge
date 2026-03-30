(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const { nodeOutcomeEffect, questConsequenceEffect } = helpers;

  const OPPORTUNITY_DEFINITIONS_C: Record<number, OpportunityNodeDefinition> = {
    5: {
      kind: "opportunity",
      id: "harrogath_route_opportunity",
      title: "Frosthaven Route Opportunity",
      zoneTitle: "Frosthaven Opportunity",
      description: "The Frosthaven rescue still leaves one more warcamp opening after the aftermath is resolved.",
      summary: "A third route node now cashes out the Frosthaven chain.",
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
          description: "With the Frosthaven captain under contract, the warband blessing turns the oath line into a drilled summit warband.",
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

  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.cOpportunityDefinitions = OPPORTUNITY_DEFINITIONS_C;
})();
