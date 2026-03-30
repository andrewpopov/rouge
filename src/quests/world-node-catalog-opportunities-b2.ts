(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    nodeOutcomeEffect,
    questConsequenceEffect,
  } = runtimeWindow.__ROUGE_WNC_QUESTS;

  const OPPORTUNITY_DEFINITIONS_B2: Record<number, OpportunityNodeDefinition> = {
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
              description: "Keep the warfire controlled and turn it into steadier infernal stamina for the push to the Cinder Tyrant.",
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
          description: "With an Ashen Bulwark or Ashen Scout under contract, the iron blessing becomes a disciplined hellward phalanx.",
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
  };

  Object.assign(runtimeWindow.__ROUGE_WNC_OPPS_B.opportunitiesB, OPPORTUNITY_DEFINITIONS_B2);
})();
