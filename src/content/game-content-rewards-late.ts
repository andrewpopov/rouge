(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { consequenceRewardPackagesLateB } = runtimeWindow.__ROUGE_GC_REWARDS_LATE_B;

  function consequenceRewardPackage(id, title, zoneRole, requiredFlagIds, grants, bonusLines = []) {
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

  const consequenceRewardPackagesLate = {
    3: [
      consequenceRewardPackage(
        "kurast_recovery_spellward_dividend",
        "Spellward Dividend",
        "branchBattle",
        ["kurast_recovery_spellward_bins"],
        { gold: 8, xp: 5, potions: 1 },
        ["Recovered spellward bins reach the next jungle battle as a routed cache."]
      ),
      consequenceRewardPackage(
        "kurast_accord_channel_dividend",
        "Channel Dividend",
        "branchMiniboss",
        ["kurast_accord_channel_marks"],
        { gold: 10, xp: 6, potions: 1 },
        ["The channel accord pays out when the next dockside host goes down."]
      ),
      consequenceRewardPackage(
        "kurast_covenant_harbor_dividend",
        "Harbor Dividend",
        "boss",
        ["kurast_covenant_spellward_ledger"],
        { gold: 16, xp: 9, potions: 1 },
        ["The harbor covenant settles in full when the durance boss court falls."]
      ),
      consequenceRewardPackage(
        "kurast_detour_fleet_dividend",
        "Hidden Fleet Dividend",
        "branchBattle",
        ["kurast_recovery_spellward_bins", "kurast_detour_hidden_fleet"],
        { gold: 12, xp: 6, potions: 1 },
        ["The hidden river fleet turns the next harbor branch into a richer routed cache instead of a flatter recovery bonus."]
      ),
      consequenceRewardPackage(
        "kurast_detour_spellward_dividend",
        "Spellward Sidepass Dividend",
        "branchBattle",
        ["kurast_recovery_spellward_bins", "kurast_detour_spellward_sidepass"],
        { gold: 10, xp: 6, potions: 1 },
        ["The spellward sidepass turns the next harbor branch into a guided routed cache before the full fleet detour comes online."]
      ),
      consequenceRewardPackage(
        "kurast_detour_freeport_dividend",
        "Freeport Beacon Dividend",
        "branchBattle",
        ["kurast_recovery_spellward_bins", "kurast_detour_hidden_fleet", "jade_supply_marks_floated"],
        { gold: 14, xp: 7, potions: 1 },
        ["Floated supply marks now carry through the hidden fleet and turn the next harbor branch into a sharper dockside payout."]
      ),
      consequenceRewardPackage(
        "kurast_detour_channel_dividend",
        "Channel Fleet Dividend",
        "branchBattle",
        [
          "kurast_recovery_spellward_bins",
          "kurast_detour_hidden_fleet",
          "jade_supply_marks_floated",
          "kurast_accord_channel_marks",
          "kurast_crossroads_night_berths",
        ],
        { gold: 15, xp: 8, potions: 1 },
        ["The channel accord, night berths, and floated supply marks now carry through the full hidden fleet and turn the next harbor branch into the most mobilized dockside payout."]
      ),
      consequenceRewardPackage(
        "kurast_escalation_durance_dividend",
        "Durance Surge Dividend",
        "branchMiniboss",
        ["kurast_reckoning_harbor_seals", "kurast_escalation_durance_surge"],
        { gold: 14, xp: 7, potions: 1 },
        ["The durance surge pays out when the next elite harbor host is broken by force."]
      ),
      consequenceRewardPackage(
        "kurast_escalation_harbor_dividend",
        "Harbor Breach Dividend",
        "branchMiniboss",
        ["kurast_reckoning_harbor_seals", "kurast_escalation_harbor_push"],
        { gold: 12, xp: 7, potions: 1 },
        ["The harbor push turns the next elite river host into a sharper breach payout before the full durance surge."]
      ),
      consequenceRewardPackage(
        "kurast_escalation_pilot_dividend",
        "Pilot Surge Dividend",
        "branchMiniboss",
        ["kurast_reckoning_harbor_seals", "kurast_escalation_durance_surge", "kurast_crossroads_shadow_pilots"],
        { gold: 16, xp: 8, potions: 1 },
        ["The earlier shadow pilots now route the full durance surge into a more directed elite payout."]
      ),
      consequenceRewardPackage(
        "kurast_escalation_channel_dividend",
        "Channel Surge Dividend",
        "branchMiniboss",
        [
          "kurast_reckoning_harbor_seals",
          "kurast_escalation_durance_surge",
          "kurast_crossroads_shadow_pilots",
          "kurast_accord_channel_marks",
          "kurast_shadow_barges",
        ],
        { gold: 17, xp: 9, potions: 1 },
        ["The channel accord, shadow barges, and shadow pilots now route the full durance surge into the most mobilized harbor elite payout."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_durance_dividend",
        "Harbor Aftermath Dividend",
        "boss",
        ["kurast_detour_hidden_fleet", "kurast_escalation_durance_surge", "kurast_covenant_spellward_ledger"],
        { gold: 20, xp: 11, potions: 1 },
        ["Detour, escalation, and covenant now settle together when the durance boss court falls."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_spellward_dividend",
        "Spellward Aftermath Dividend",
        "boss",
        ["kurast_detour_hidden_fleet", "kurast_escalation_durance_surge", "kurast_covenant_spellward_ledger", "kurast_crossroads_shadow_pilots"],
        { gold: 22, xp: 12, potions: 1 },
        ["The earlier shadow pilots now steer the full harbor aftermath into a more directed durance settlement."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_beacon_dividend",
        "Harbor Beacon Dividend",
        "boss",
        [
          "kurast_detour_hidden_fleet",
          "kurast_escalation_durance_surge",
          "kurast_covenant_spellward_ledger",
          "kurast_crossroads_shadow_pilots",
          "jade_supply_marks_floated",
        ],
        { gold: 24, xp: 13, potions: 1 },
        ["Floated supply marks and shadow pilots now settle the full harbor aftermath into the sharpest durance payout."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_berth_dividend",
        "Night Berth Dividend",
        "boss",
        [
          "kurast_detour_hidden_fleet",
          "kurast_escalation_durance_surge",
          "kurast_covenant_spellward_ledger",
          "kurast_crossroads_night_berths",
          "kurast_shadow_barges",
        ],
        { gold: 23, xp: 13, potions: 1 },
        ["Shadow barges and the night berths now settle the full harbor aftermath into a drilled durance payout."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_channel_dividend",
        "Channel Mobilized Dividend",
        "boss",
        [
          "kurast_detour_hidden_fleet",
          "kurast_escalation_durance_surge",
          "kurast_covenant_spellward_ledger",
          "kurast_crossroads_night_berths",
          "kurast_shadow_barges",
          "kurast_accord_channel_marks",
        ],
        { gold: 25, xp: 14, potions: 1 },
        ["Channel marks, shadow barges, and the night berths now settle the full harbor aftermath into the most mobilized durance payout."]
      ),
      consequenceRewardPackage(
        "kurast_aftermath_bell_dividend",
        "Harbor Bell Aftermath Dividend",
        "boss",
        ["kurast_detour_spellward_sidepass", "kurast_escalation_harbor_push", "kurast_covenant_harbor_bells"],
        { gold: 22, xp: 12, potions: 1 },
        ["Harbor bells, the spellward sidepass, and the harbor push now hold the full durance aftermath behind a posted river court."]
      ),
    ],
    ...consequenceRewardPackagesLateB,
  };

  runtimeWindow.__ROUGE_GC_REWARDS_LATE = {
    consequenceRewardPackagesLate,
  };
})();
