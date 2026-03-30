(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function consequenceRewardPackage(id: string, title: string, zoneRole: string, requiredFlagIds: string[], grants: RewardGrants, bonusLines: string[] = []) {
    return {
      id,
      title,
      zoneRole,
      requiredFlagIds: [...requiredFlagIds],
      grants: {
        gold: grants?.gold || 0,
        xp: grants?.xp || 0,
        potions: grants?.potions || 0,
      },
      bonusLines: Array.isArray(bonusLines) ? [...bonusLines] : [],
    };
  }

  const consequenceRewardPackagesLateB = {
    4: [
      consequenceRewardPackage(
        "hellforge_recovery_hellward_dividend",
        "Hellward Dividend",
        "branchBattle",
        ["hellforge_recovery_hellward_screen"],
        { gold: 10, xp: 5, potions: 1 },
        ["Recovered hellward stores push a harsher branch reward out of the forge line."]
      ),
      consequenceRewardPackage(
        "hellforge_accord_breach_dividend",
        "Breach Dividend",
        "branchMiniboss",
        ["hellforge_accord_breach_rivets"],
        { gold: 12, xp: 6, potions: 1 },
        ["The breach accord pays out when the next hellgate host is brought down."]
      ),
      consequenceRewardPackage(
        "hellforge_covenant_sanctuary_dividend",
        "Sanctuary Dividend",
        "boss",
        ["hellforge_covenant_breachscreen_ledger"],
        { gold: 18, xp: 10, potions: 1 },
        ["The sanctuary covenant settles with a harder boss reward once the forge front holds."]
      ),
      consequenceRewardPackage(
        "hellforge_detour_relief_dividend",
        "Hidden Relief Dividend",
        "branchBattle",
        ["hellforge_recovery_hellward_screen", "hellforge_detour_hidden_relief"],
        { gold: 14, xp: 6, potions: 1 },
        ["The hidden relief line pushes a stronger sanctuary branch payout instead of stopping at the recovery screen."]
      ),
      consequenceRewardPackage(
        "hellforge_detour_hellward_dividend",
        "Hellward Sidepass Dividend",
        "branchBattle",
        ["hellforge_recovery_hellward_screen", "hellforge_detour_hellward_sidepass"],
        { gold: 12, xp: 6, potions: 1 },
        ["The hellward sidepass turns the next sanctuary branch into a guided infernal payout before the full relief line appears."]
      ),
      consequenceRewardPackage(
        "hellforge_detour_cinder_dividend",
        "Cinder Signal Dividend",
        "branchBattle",
        ["hellforge_recovery_hellward_screen", "hellforge_detour_hidden_relief", "infernal_forge_gates_chained"],
        { gold: 16, xp: 7, potions: 1 },
        ["Chained forge gates now carry through the hidden relief line and turn the next sanctuary branch into a sharper infernal payout."]
      ),
      consequenceRewardPackage(
        "hellforge_detour_rivet_dividend",
        "Rivet Relief Dividend",
        "branchBattle",
        [
          "hellforge_recovery_hellward_screen",
          "hellforge_detour_hidden_relief",
          "infernal_forge_gates_chained",
          "hellforge_accord_breach_rivets",
          "hellforge_crossroads_phalanx_reliefs",
        ],
        { gold: 17, xp: 8, potions: 1 },
        ["The breach-rivet accord, phalanx reliefs, and chained forge gates now carry through the full hidden relief line and turn the next sanctuary branch into the most mobilized infernal payout."]
      ),
      consequenceRewardPackage(
        "hellforge_escalation_sanctuary_dividend",
        "Sanctuary Surge Dividend",
        "branchMiniboss",
        ["hellforge_reckoning_sanctuary_screens", "hellforge_escalation_sanctuary_surge"],
        { gold: 14, xp: 7, potions: 1 },
        ["The sanctuary surge pays out when the next elite infernal line is forced apart."]
      ),
      consequenceRewardPackage(
        "hellforge_escalation_hellward_dividend",
        "Hellward Breach Dividend",
        "branchMiniboss",
        ["hellforge_reckoning_sanctuary_screens", "hellforge_escalation_sanctuary_screen"],
        { gold: 13, xp: 7, potions: 1 },
        ["The hellward breach turns the next elite infernal host into a sharper payout before the full sanctuary surge."]
      ),
      consequenceRewardPackage(
        "hellforge_escalation_turn_dividend",
        "Hellward Surge Dividend",
        "branchMiniboss",
        ["hellforge_reckoning_sanctuary_screens", "hellforge_escalation_sanctuary_surge", "hellforge_crossroads_hellward_turn"],
        { gold: 16, xp: 8, potions: 1 },
        ["The earlier hellward turn now routes the full sanctuary surge into a more directed elite payout."]
      ),
      consequenceRewardPackage(
        "hellforge_escalation_rivet_dividend",
        "Rivet Surge Dividend",
        "branchMiniboss",
        [
          "hellforge_reckoning_sanctuary_screens",
          "hellforge_escalation_sanctuary_surge",
          "hellforge_crossroads_hellward_turn",
          "hellforge_accord_breach_rivets",
          "hellforge_phalanx_steps_locked",
        ],
        { gold: 17, xp: 9, potions: 1 },
        ["The breach-rivet accord, locked phalanx steps, and hellward turn now route the full sanctuary surge into the most mobilized infernal elite payout."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_sanctuary_dividend",
        "Sanctuary Aftermath Dividend",
        "boss",
        ["hellforge_detour_hidden_relief", "hellforge_escalation_sanctuary_surge", "hellforge_covenant_breachscreen_ledger"],
        { gold: 22, xp: 12, potions: 1 },
        ["Detour, escalation, and covenant now settle together at the Cinder Tyrant instead of ending at the first covenant pass."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_breachscreen_dividend",
        "Breachscreen Aftermath Dividend",
        "boss",
        ["hellforge_detour_hidden_relief", "hellforge_escalation_sanctuary_surge", "hellforge_covenant_breachscreen_ledger", "hellforge_crossroads_hellward_turn"],
        { gold: 24, xp: 13, potions: 1 },
        ["The earlier hellward turn now steers the full sanctuary aftermath into a more directed infernal settlement."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_cinder_dividend",
        "Cinder Aftermath Dividend",
        "boss",
        [
          "hellforge_detour_hidden_relief",
          "hellforge_escalation_sanctuary_surge",
          "hellforge_covenant_breachscreen_ledger",
          "hellforge_crossroads_hellward_turn",
          "infernal_forge_gates_chained",
        ],
        { gold: 26, xp: 14, potions: 1 },
        ["Chained forge gates and the hellward turn now settle the full sanctuary aftermath into the sharpest infernal boss payout."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_relief_dividend",
        "Phalanx Relief Dividend",
        "boss",
        [
          "hellforge_detour_hidden_relief",
          "hellforge_escalation_sanctuary_surge",
          "hellforge_covenant_breachscreen_ledger",
          "hellforge_crossroads_phalanx_reliefs",
          "hellforge_phalanx_steps_locked",
        ],
        { gold: 25, xp: 14, potions: 1 },
        ["Locked phalanx steps and paced reliefs now settle the full sanctuary aftermath into a drilled the Cinder Tyrant payout."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_breach_dividend",
        "Breach Mobilized Dividend",
        "boss",
        [
          "hellforge_detour_hidden_relief",
          "hellforge_escalation_sanctuary_surge",
          "hellforge_covenant_breachscreen_ledger",
          "hellforge_crossroads_phalanx_reliefs",
          "hellforge_phalanx_steps_locked",
          "hellforge_accord_breach_rivets",
        ],
        { gold: 27, xp: 15, potions: 1 },
        ["Breach rivets, locked phalanx steps, and paced reliefs now settle the full sanctuary aftermath into the most mobilized the Cinder Tyrant payout."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_bell_dividend",
        "Sanctuary Bell Aftermath Dividend",
        "boss",
        ["hellforge_detour_hellward_sidepass", "hellforge_escalation_sanctuary_screen", "hellforge_covenant_sanctuary_bells"],
        { gold: 24, xp: 13, potions: 1 },
        ["Sanctuary bells, the hellward sidepass, and the sanctuary screen now hold the full the Cinder Tyrant aftermath behind a posted infernal court."]
      ),
    ],
    5: [
      consequenceRewardPackage(
        "harrogath_recovery_banner_dividend",
        "Banner Dividend",
        "branchBattle",
        ["harrogath_recovery_guard_banners"],
        { gold: 10, xp: 6, potions: 1 },
        ["Recovered guard banners steady the next summit battle and its payout."]
      ),
      consequenceRewardPackage(
        "harrogath_accord_ancients_dividend",
        "Ancients Dividend",
        "branchMiniboss",
        ["harrogath_accord_ancients_posts"],
        { gold: 12, xp: 7, potions: 1 },
        ["The ancients accord pays out when the next summit host breaks."]
      ),
      consequenceRewardPackage(
        "harrogath_covenant_summit_dividend",
        "Summit Dividend",
        "boss",
        ["harrogath_covenant_ancients_ledger"],
        { gold: 20, xp: 12, potions: 1 },
        ["The final summit covenant resolves into a richer boss settlement before the Siege Tyrant falls."]
      ),
      consequenceRewardPackage(
        "harrogath_detour_sled_dividend",
        "Hidden Sled Dividend",
        "branchBattle",
        ["harrogath_recovery_guard_banners", "harrogath_detour_hidden_sleds"],
        { gold: 14, xp: 7, potions: 1 },
        ["The hidden Ancients sled chain turns the next summit branch into a richer supply clear instead of a flat banner bonus."]
      ),
      consequenceRewardPackage(
        "harrogath_detour_banner_dividend",
        "Banner Sidepass Dividend",
        "branchBattle",
        ["harrogath_recovery_guard_banners", "harrogath_detour_banner_sidepass"],
        { gold: 12, xp: 7, potions: 1 },
        ["The banner sidepass turns the next summit branch into a guided supply payout before the full hidden sled chain arrives."]
      ),
      consequenceRewardPackage(
        "harrogath_detour_watchfire_dividend",
        "Watchfire Detour Dividend",
        "branchBattle",
        ["harrogath_recovery_guard_banners", "harrogath_detour_hidden_sleds", "ancients_watchfires_ringed"],
        { gold: 16, xp: 8, potions: 1 },
        ["Ringed watchfires now carry through the hidden sled chain and turn the next summit branch into a sharper mountain payout."]
      ),
      consequenceRewardPackage(
        "harrogath_detour_ancients_dividend",
        "Ancients Watch Dividend",
        "branchBattle",
        [
          "harrogath_recovery_guard_banners",
          "harrogath_detour_hidden_sleds",
          "ancients_watchfires_ringed",
          "harrogath_accord_ancients_posts",
          "harrogath_crossroads_switchbacks",
        ],
        { gold: 17, xp: 9, potions: 1 },
        ["The ancients accord, switchback routes, and ringed watchfires now carry through the full hidden sled chain and turn the next summit branch into the most mobilized mountain payout."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_worldstone_dividend",
        "Ruin Crown Surge Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_worldstone_surge"],
        { gold: 16, xp: 8, potions: 1 },
        ["The Ruin Crown surge pays out when the next elite summit line breaks under full pressure."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_oath_dividend",
        "Oath Breach Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_oath_surge"],
        { gold: 14, xp: 8, potions: 1 },
        ["The oath surge turns the next elite summit host into a sharper breach payout before the full Ruin Crown rush lands."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_reserve_dividend",
        "Reserve Surge Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_worldstone_surge", "harrogath_crossroads_summit_reserve"],
        { gold: 18, xp: 9, potions: 1 },
        ["The earlier summit reserve now routes the full Ruin Crown surge into a more directed elite payout."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_ancients_dividend",
        "Ancients Surge Dividend",
        "branchMiniboss",
        [
          "harrogath_reckoning_oath_rations",
          "harrogath_escalation_worldstone_surge",
          "harrogath_crossroads_summit_reserve",
          "harrogath_accord_ancients_posts",
          "harrogath_peak_guard_drilled",
        ],
        { gold: 19, xp: 10, potions: 1 },
        ["The ancients accord, drilled peak guard, and summit reserve now route the full Ruin Crown surge into the most mobilized mountain elite payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_worldstone_dividend",
        "Ruin Crown Aftermath Dividend",
        "boss",
        ["harrogath_detour_hidden_sleds", "harrogath_escalation_worldstone_surge", "harrogath_covenant_ancients_ledger"],
        { gold: 24, xp: 12, potions: 1 },
        ["Detour, escalation, and covenant now settle together when the Siege Tyrant's host falls instead of stopping at the summit covenant."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_ancients_dividend",
        "Ancients Aftermath Dividend",
        "boss",
        ["harrogath_detour_hidden_sleds", "harrogath_escalation_worldstone_surge", "harrogath_covenant_ancients_ledger", "harrogath_crossroads_summit_reserve"],
        { gold: 26, xp: 13, potions: 1 },
        ["The earlier summit reserve line now steers the full Ruin Crown aftermath into a more directed Ancients settlement."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_watchfire_dividend",
        "Watchfire Aftermath Dividend",
        "boss",
        [
          "harrogath_detour_hidden_sleds",
          "harrogath_escalation_worldstone_surge",
          "harrogath_covenant_ancients_ledger",
          "harrogath_crossroads_summit_reserve",
          "ancients_watchfires_ringed",
        ],
        { gold: 28, xp: 14, potions: 1 },
        ["Ringed watchfires and the summit reserve now settle the full Ruin Crown aftermath into the sharpest mountain boss payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_switchback_dividend",
        "Switchback Aftermath Dividend",
        "boss",
        [
          "harrogath_detour_hidden_sleds",
          "harrogath_escalation_worldstone_surge",
          "harrogath_covenant_ancients_ledger",
          "harrogath_crossroads_switchbacks",
          "harrogath_peak_guard_drilled",
        ],
        { gold: 27, xp: 15, potions: 1 },
        ["Peak guard drills and the captain's switchbacks now settle the full summit aftermath into a drilled Ruin Crown payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_accord_dividend",
        "Ancients Mobilized Dividend",
        "boss",
        [
          "harrogath_detour_hidden_sleds",
          "harrogath_escalation_worldstone_surge",
          "harrogath_covenant_ancients_ledger",
          "harrogath_crossroads_switchbacks",
          "harrogath_peak_guard_drilled",
          "harrogath_accord_ancients_posts",
        ],
        { gold: 29, xp: 16, potions: 1 },
        ["Ancients accord posts, peak guard drills, and the captain's switchbacks now settle the full summit aftermath into the most mobilized Ruin Crown payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_bell_dividend",
        "Summit Bell Aftermath Dividend",
        "boss",
        ["harrogath_detour_banner_sidepass", "harrogath_escalation_oath_surge", "harrogath_covenant_summit_bells"],
        { gold: 26, xp: 13, potions: 1 },
        ["Summit bells, the banner sidepass, and the oath surge now hold the full Ruin Crown aftermath behind a posted mountain court."]
      ),
    ],
  };

  runtimeWindow.__ROUGE_GC_REWARDS_LATE_B = {
    consequenceRewardPackagesLateB,
  };
})();
