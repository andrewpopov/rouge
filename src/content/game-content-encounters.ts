(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const consequenceEncounterPackages = {
    2: [
      {
        id: "sunwell_recovery_ward_line",
        title: "Ward Line Recovery",
        zoneRole: "branchBattle",
        requiredFlagIds: ["sunwell_recovery_spearline_wards"],
        encounterId: "act_2_branch_recovery",
      },
      {
        id: "sunwell_accord_reliquary_host",
        title: "Reliquary Accord Host",
        zoneRole: "branchMiniboss",
        requiredFlagIds: ["sunwell_accord_spear_posts"],
        encounterId: "act_2_miniboss_accord",
      },
      {
        id: "sunwell_covenant_chamber_host",
        title: "Reliquary Covenant Chamber",
        zoneRole: "boss",
        requiredFlagIds: ["sunwell_covenant_final_lance_ledger"],
        encounterId: "act_2_boss_covenant",
      },
      {
        id: "sunwell_detour_caravan_line",
        title: "Reliquary Detour Line",
        zoneRole: "branchBattle",
        requiredFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_detour_hidden_caravan"],
        encounterId: "act_2_branch_detour",
      },
      {
        id: "sunwell_detour_ward_line",
        title: "Warded Sidepass Line",
        zoneRole: "branchBattle",
        requiredFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_detour_warded_sidepass"],
        encounterId: "act_2_branch_detour_guided",
      },
      {
        id: "sunwell_detour_beacon_line",
        title: "Beacon Caravan Line",
        zoneRole: "branchBattle",
        requiredFlagIds: ["sunwell_recovery_spearline_wards", "sunwell_detour_hidden_caravan", "sunwell_water_beacons_aligned"],
        encounterId: "act_2_branch_detour_signal",
      },
      {
        id: "sunwell_detour_spear_post_line",
        title: "Spear Post Mobilized Line",
        zoneRole: "branchBattle",
        requiredFlagIds: [
          "sunwell_recovery_spearline_wards",
          "sunwell_detour_hidden_caravan",
          "sunwell_water_beacons_aligned",
          "sunwell_accord_spear_posts",
          "sunwell_crossroads_spearwall_pylons",
        ],
        encounterId: "act_2_branch_detour_mobilized",
      },
      {
        id: "sunwell_escalation_chamber_host",
        title: "Chamber Escalation Host",
        zoneRole: "branchMiniboss",
        requiredFlagIds: ["sunwell_reckoning_lance_wards", "sunwell_escalation_chamber_surge"],
        encounterId: "act_2_miniboss_escalation",
      },
      {
        id: "sunwell_escalation_lance_host",
        title: "Lance Breach Host",
        zoneRole: "branchMiniboss",
        requiredFlagIds: ["sunwell_reckoning_lance_wards", "sunwell_escalation_lance_breach"],
        encounterId: "act_2_miniboss_escalation_breach",
      },
      {
        id: "sunwell_escalation_contract_host",
        title: "Contract Surge Host",
        zoneRole: "branchMiniboss",
        requiredFlagIds: ["sunwell_reckoning_lance_wards", "sunwell_escalation_chamber_surge", "sunwell_crossroads_contract_guard"],
        encounterId: "act_2_miniboss_escalation_directed",
      },
      {
        id: "sunwell_escalation_spear_post_host",
        title: "Spear Post Mobilized Host",
        zoneRole: "branchMiniboss",
        requiredFlagIds: [
          "sunwell_reckoning_lance_wards",
          "sunwell_escalation_chamber_surge",
          "sunwell_crossroads_contract_guard",
          "sunwell_accord_spear_posts",
          "sunwell_shield_train",
        ],
        encounterId: "act_2_miniboss_escalation_mobilized",
      },
      {
        id: "sunwell_aftermath_chamber_host",
        title: "Reliquary Aftermath Chamber",
        zoneRole: "boss",
        requiredFlagIds: ["sunwell_detour_hidden_caravan", "sunwell_escalation_chamber_surge", "sunwell_covenant_final_lance_ledger"],
        encounterId: "act_2_boss_aftermath",
      },
      {
        id: "sunwell_aftermath_lance_host",
        title: "Directed Lance Aftermath",
        zoneRole: "boss",
        requiredFlagIds: ["sunwell_detour_hidden_caravan", "sunwell_escalation_chamber_surge", "sunwell_covenant_final_lance_ledger", "sunwell_crossroads_contract_guard"],
        encounterId: "act_2_boss_aftermath_directed",
      },
      {
        id: "sunwell_aftermath_beacon_host",
        title: "Beacon Aftermath Chamber",
        zoneRole: "boss",
        requiredFlagIds: [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_contract_guard",
          "sunwell_water_beacons_aligned",
        ],
        encounterId: "act_2_boss_aftermath_signaled",
      },
      {
        id: "sunwell_aftermath_pylon_host",
        title: "Pylon Aftermath Chamber",
        zoneRole: "boss",
        requiredFlagIds: [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_spearwall_pylons",
          "sunwell_shield_train",
        ],
        encounterId: "act_2_boss_aftermath_drilled",
      },
      {
        id: "sunwell_aftermath_reliquary_host",
        title: "Reliquary Mobilized Chamber",
        zoneRole: "boss",
        requiredFlagIds: [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_spearwall_pylons",
          "sunwell_shield_train",
          "sunwell_accord_spear_posts",
        ],
        encounterId: "act_2_boss_aftermath_mobilized",
      },
      {
        id: "sunwell_aftermath_banner_host",
        title: "Bannered Aftermath Chamber",
        zoneRole: "boss",
        requiredFlagIds: ["sunwell_detour_warded_sidepass", "sunwell_escalation_lance_breach", "sunwell_covenant_reliquary_banners"],
        encounterId: "act_2_boss_aftermath_posted",
      },
    ],
  };

  const { consequenceEncounterPackagesLate } = runtimeWindow.__ROUGE_GC_ENCOUNTERS_LATE;
  Object.assign(consequenceEncounterPackages, consequenceEncounterPackagesLate);

  runtimeWindow.__ROUGE_GC_ENCOUNTERS = {
    consequenceEncounterPackages,
  };
})();
