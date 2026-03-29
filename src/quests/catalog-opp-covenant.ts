(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const helpers = runtimeWindow.__ROUGE_OPP_HELPERS;
  const buildCovenantChoice = helpers.buildOpportunityChoiceFactory("Covenant Opportunity");

  const COVENANT_OPPORTUNITY_DEFINITIONS: Record<number, CovenantOpportunityDefinition> = {
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
              [{ kind: "support_build" }, { kind: "refill_potions", value: 1 }]
            ),
            buildCovenantChoice(
              "sunwell_covenant_opportunity",
              "lost_reliquary",
              "raise_the_last_tomb_posts",
              "Raise the Last Tomb Posts",
              "Turn the same covenant into one final line of tomb posts before the crossing closes.",
              "last_tomb_posts_raised",
              ["sunwell_covenant_tomb_posts"],
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
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
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
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
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
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
              [{ kind: "reinforce_build" }, { kind: "hero_max_energy", value: 1 }]
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


  runtimeWindow.__ROUGE_OPP_STAGING = runtimeWindow.__ROUGE_OPP_STAGING || {};
  runtimeWindow.__ROUGE_OPP_STAGING.covenantOpportunityDefinitions = COVENANT_OPPORTUNITY_DEFINITIONS;
})();
