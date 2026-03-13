(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  const consequenceRewardPackages = {
    1: [
      consequenceRewardPackage(
        "rogue_recovery_lantern_dividend",
        "Lantern Dividend",
        "branchBattle",
        ["rogue_recovery_chapel_lanterns"],
        { gold: 6, xp: 4, potions: 1 },
        ["Recovery stores from the chapel lantern line reach the next battle payout."]
      ),
      consequenceRewardPackage(
        "rogue_accord_cloister_dividend",
        "Cloister Dividend",
        "branchMiniboss",
        ["rogue_accord_cloister_paths"],
        { gold: 8, xp: 4, potions: 1 },
        ["The cloister accord turns the next miniboss clear into a richer contract payout."]
      ),
      consequenceRewardPackage(
        "rogue_covenant_wayfinder_dividend",
        "Wayfinder Dividend",
        "boss",
        ["rogue_covenant_wayfinder_ledger"],
        { gold: 12, xp: 8, potions: 1 },
        ["The wayfinder covenant turns the act boss reward into a true late-route settlement."]
      ),
      consequenceRewardPackage(
        "rogue_detour_convoy_dividend",
        "Abbey Convoy Dividend",
        "branchBattle",
        ["rogue_recovery_chapel_lanterns", "rogue_detour_hidden_convoy"],
        { gold: 10, xp: 5, potions: 1 },
        ["The hidden abbey convoy turns the next branch clear into a safer but richer monastery payout."]
      ),
      consequenceRewardPackage(
        "rogue_detour_chapel_dividend",
        "Chapel Sidepass Dividend",
        "branchBattle",
        ["rogue_recovery_chapel_lanterns", "rogue_detour_chapel_sidepass"],
        { gold: 8, xp: 5, potions: 1 },
        ["The chapel sidepass turns the next branch into a guided monastery payout instead of stopping at the recovery screen."]
      ),
      consequenceRewardPackage(
        "rogue_detour_signal_dividend",
        "Signal Convoy Dividend",
        "branchBattle",
        ["rogue_recovery_chapel_lanterns", "rogue_detour_hidden_convoy", "rogue_vigil_signal_lanterns"],
        { gold: 12, xp: 6, potions: 1 },
        ["The earlier signal lanterns now carry through the full abbey convoy and turn the next branch into a sharper monastery payout."]
      ),
      consequenceRewardPackage(
        "rogue_detour_cloister_dividend",
        "Cloister Convoy Dividend",
        "branchBattle",
        [
          "rogue_recovery_chapel_lanterns",
          "rogue_detour_hidden_convoy",
          "rogue_vigil_signal_lanterns",
          "rogue_accord_cloister_paths",
          "rogue_route_vanguard",
        ],
        { gold: 13, xp: 7, potions: 1 },
        ["The cloister accord, armed vanguard, and signal lanterns now carry through the full abbey convoy and turn the next branch into the most mobilized monastery payout."]
      ),
      consequenceRewardPackage(
        "rogue_escalation_catacomb_dividend",
        "Catacomb Surge Dividend",
        "branchMiniboss",
        ["rogue_reckoning_chapel_ledger", "rogue_escalation_catacomb_surge"],
        { gold: 10, xp: 6, potions: 1 },
        ["The catacomb surge turns the next elite branch into a harsher contract payout instead of the steadier accord."]
      ),
      consequenceRewardPackage(
        "rogue_escalation_chapel_dividend",
        "Chapel Breach Dividend",
        "branchMiniboss",
        ["rogue_reckoning_chapel_ledger", "rogue_escalation_chapel_surge"],
        { gold: 9, xp: 5, potions: 1 },
        ["The chapel surge turns the next elite branch into a sharper breach payout before the full catacomb rush exists."]
      ),
      consequenceRewardPackage(
        "rogue_escalation_wayfinder_dividend",
        "Wayfinder Surge Dividend",
        "branchMiniboss",
        ["rogue_reckoning_chapel_ledger", "rogue_escalation_catacomb_surge", "rogue_crossroads_hidden_wayfinders"],
        { gold: 12, xp: 7, potions: 1 },
        ["The earlier hidden wayfinders now route the full catacomb surge into a more directed elite payout."]
      ),
      consequenceRewardPackage(
        "rogue_escalation_cloister_dividend",
        "Cloister Surge Dividend",
        "branchMiniboss",
        [
          "rogue_reckoning_chapel_ledger",
          "rogue_escalation_catacomb_surge",
          "rogue_crossroads_hidden_wayfinders",
          "rogue_accord_cloister_paths",
          "rogue_route_vanguard",
        ],
        { gold: 13, xp: 8, potions: 1 },
        ["The cloister accord, armed vanguard, and hidden wayfinders now route the full catacomb surge into the most mobilized rogue elite payout."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_catacomb_dividend",
        "Catacomb Aftermath Dividend",
        "boss",
        ["rogue_detour_hidden_convoy", "rogue_escalation_catacomb_surge", "rogue_covenant_wayfinder_ledger"],
        { gold: 16, xp: 10, potions: 1 },
        ["Detour, escalation, and covenant now settle together at the act boss instead of stopping at the first covenant close."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_wayfinder_dividend",
        "Wayfinder Aftermath Dividend",
        "boss",
        ["rogue_detour_hidden_convoy", "rogue_escalation_catacomb_surge", "rogue_covenant_wayfinder_ledger", "rogue_crossroads_hidden_wayfinders"],
        { gold: 18, xp: 11, potions: 1 },
        ["The earlier hidden wayfinders now steer the full catacomb aftermath into a more directed late-route boss settlement."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_signal_dividend",
        "Signal Aftermath Dividend",
        "boss",
        [
          "rogue_detour_hidden_convoy",
          "rogue_escalation_catacomb_surge",
          "rogue_covenant_wayfinder_ledger",
          "rogue_crossroads_hidden_wayfinders",
          "rogue_vigil_signal_lanterns",
        ],
        { gold: 20, xp: 12, potions: 1 },
        ["The shrine signal line and hidden wayfinders now settle the full catacomb aftermath into the sharpest rogue boss payout."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_vanguard_dividend",
        "Vanguard Aftermath Dividend",
        "boss",
        [
          "rogue_detour_hidden_convoy",
          "rogue_escalation_catacomb_surge",
          "rogue_covenant_wayfinder_ledger",
          "rogue_crossroads_hidden_wayfinders",
          "rogue_route_vanguard",
          "rogue_vigil_signal_lanterns",
        ],
        { gold: 19, xp: 12, potions: 1 },
        ["The armed vanguard, hidden wayfinders, and signal lanterns now settle the full catacomb aftermath into a drilled rogue boss payout."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_cloister_dividend",
        "Cloister Mobilized Dividend",
        "boss",
        [
          "rogue_detour_hidden_convoy",
          "rogue_escalation_catacomb_surge",
          "rogue_covenant_wayfinder_ledger",
          "rogue_crossroads_hidden_wayfinders",
          "rogue_route_vanguard",
          "rogue_vigil_signal_lanterns",
          "rogue_accord_cloister_paths",
        ],
        { gold: 21, xp: 13, potions: 1 },
        ["The cloister accord, armed vanguard, and signal lanterns now settle the full catacomb aftermath into the most mobilized rogue boss payout."]
      ),
      consequenceRewardPackage(
        "rogue_aftermath_bellwatch_dividend",
        "Bellwatch Aftermath Dividend",
        "boss",
        ["rogue_detour_chapel_sidepass", "rogue_escalation_chapel_surge", "rogue_covenant_cloister_bell"],
        { gold: 18, xp: 11, potions: 1 },
        ["The cloister bell, chapel sidepass, and chapel surge now hold the full catacomb aftermath behind a posted rogue court."]
      ),
    ],
    2: [
      consequenceRewardPackage(
        "sunwell_recovery_ward_dividend",
        "Ward Dividend",
        "branchBattle",
        ["sunwell_recovery_spearline_wards"],
        { gold: 8, xp: 4, potions: 1 },
        ["Recovered spearline wards widen the next battle payout and refill the march."]
      ),
      consequenceRewardPackage(
        "sunwell_accord_reliquary_dividend",
        "Reliquary Dividend",
        "branchMiniboss",
        ["sunwell_accord_spear_posts"],
        { gold: 10, xp: 5, potions: 1 },
        ["The reliquary accord pays out directly when the next miniboss line breaks."]
      ),
      consequenceRewardPackage(
        "sunwell_covenant_lance_dividend",
        "Lance Dividend",
        "boss",
        ["sunwell_covenant_final_lance_ledger"],
        { gold: 14, xp: 8, potions: 1 },
        ["Your final lance covenant settles at the chamber doors with a stronger boss reward."]
      ),
      consequenceRewardPackage(
        "sunwell_detour_caravan_dividend",
        "Hidden Caravan Dividend",
        "branchBattle",
        ["sunwell_recovery_spearline_wards", "sunwell_detour_hidden_caravan"],
        { gold: 12, xp: 5, potions: 1 },
        ["The hidden reliquary caravan widens the next desert branch payout instead of leaving the detour as route text only."]
      ),
      consequenceRewardPackage(
        "sunwell_detour_ward_dividend",
        "Warded Sidepass Dividend",
        "branchBattle",
        ["sunwell_recovery_spearline_wards", "sunwell_detour_warded_sidepass"],
        { gold: 10, xp: 5, potions: 1 },
        ["The warded sidepass turns the next desert branch into a guided reliquary payout instead of stopping at the recovery wards."]
      ),
      consequenceRewardPackage(
        "sunwell_detour_beacon_dividend",
        "Beacon Caravan Dividend",
        "branchBattle",
        ["sunwell_recovery_spearline_wards", "sunwell_detour_hidden_caravan", "sunwell_water_beacons_aligned"],
        { gold: 14, xp: 6, potions: 1 },
        ["Aligned water beacons now carry through the hidden caravan and turn the next desert branch into a sharper reliquary payout."]
      ),
      consequenceRewardPackage(
        "sunwell_detour_spear_post_dividend",
        "Spear Post Caravan Dividend",
        "branchBattle",
        [
          "sunwell_recovery_spearline_wards",
          "sunwell_detour_hidden_caravan",
          "sunwell_water_beacons_aligned",
          "sunwell_accord_spear_posts",
          "sunwell_crossroads_spearwall_pylons",
        ],
        { gold: 15, xp: 7, potions: 1 },
        ["The spear-post accord, spearwall pylons, and aligned beacons now carry through the full hidden caravan and turn the next desert branch into the most mobilized reliquary payout."]
      ),
      consequenceRewardPackage(
        "sunwell_escalation_chamber_dividend",
        "Chamber Surge Dividend",
        "branchMiniboss",
        ["sunwell_reckoning_lance_wards", "sunwell_escalation_chamber_surge"],
        { gold: 12, xp: 6, potions: 1 },
        ["The chamber surge pays out directly when the next elite line is forced open."]
      ),
      consequenceRewardPackage(
        "sunwell_escalation_lance_dividend",
        "Lance Breach Dividend",
        "branchMiniboss",
        ["sunwell_reckoning_lance_wards", "sunwell_escalation_lance_breach"],
        { gold: 11, xp: 6, potions: 1 },
        ["The lance breach turns the next elite line into a sharper tomb payout before the full chamber surge lands."]
      ),
      consequenceRewardPackage(
        "sunwell_escalation_contract_dividend",
        "Contract Surge Dividend",
        "branchMiniboss",
        ["sunwell_reckoning_lance_wards", "sunwell_escalation_chamber_surge", "sunwell_crossroads_contract_guard"],
        { gold: 14, xp: 7, potions: 1 },
        ["The earlier contract guard now routes the full chamber surge into a more disciplined elite payout."]
      ),
      consequenceRewardPackage(
        "sunwell_escalation_spear_post_dividend",
        "Spear Post Surge Dividend",
        "branchMiniboss",
        [
          "sunwell_reckoning_lance_wards",
          "sunwell_escalation_chamber_surge",
          "sunwell_crossroads_contract_guard",
          "sunwell_accord_spear_posts",
          "sunwell_shield_train",
        ],
        { gold: 15, xp: 8, potions: 1 },
        ["The spear-post accord, shield train, and contract guard now route the full chamber surge into the most mobilized desert elite payout."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_chamber_dividend",
        "Reliquary Aftermath Dividend",
        "boss",
        ["sunwell_detour_hidden_caravan", "sunwell_escalation_chamber_surge", "sunwell_covenant_final_lance_ledger"],
        { gold: 18, xp: 10, potions: 1 },
        ["Detour, escalation, and covenant now settle together at the chamber doors as a deeper late-route boss payoff."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_lance_dividend",
        "Lance Aftermath Dividend",
        "boss",
        ["sunwell_detour_hidden_caravan", "sunwell_escalation_chamber_surge", "sunwell_covenant_final_lance_ledger", "sunwell_crossroads_contract_guard"],
        { gold: 20, xp: 11, potions: 1 },
        ["The earlier contract guard line now steers the full chamber aftermath into a more directed reliquary settlement."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_beacon_dividend",
        "Beacon Aftermath Dividend",
        "boss",
        [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_contract_guard",
          "sunwell_water_beacons_aligned",
        ],
        { gold: 22, xp: 12, potions: 1 },
        ["Aligned water beacons and the contract guard now settle the full chamber aftermath into the sharpest desert boss payout."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_pylon_dividend",
        "Pylon Aftermath Dividend",
        "boss",
        [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_spearwall_pylons",
          "sunwell_shield_train",
        ],
        { gold: 21, xp: 12, potions: 1 },
        ["The shield train and spearwall pylons now settle the full chamber aftermath into a drilled desert boss payout."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_reliquary_dividend",
        "Reliquary Mobilized Dividend",
        "boss",
        [
          "sunwell_detour_hidden_caravan",
          "sunwell_escalation_chamber_surge",
          "sunwell_covenant_final_lance_ledger",
          "sunwell_crossroads_spearwall_pylons",
          "sunwell_shield_train",
          "sunwell_accord_spear_posts",
        ],
        { gold: 23, xp: 13, potions: 1 },
        ["The reliquary accord, shield train, and spearwall pylons now settle the full chamber aftermath into the most mobilized desert boss payout."]
      ),
      consequenceRewardPackage(
        "sunwell_aftermath_banner_dividend",
        "Bannered Aftermath Dividend",
        "boss",
        ["sunwell_detour_warded_sidepass", "sunwell_escalation_lance_breach", "sunwell_covenant_reliquary_banners"],
        { gold: 20, xp: 11, potions: 1 },
        ["Reliquary banners, the warded sidepass, and the lance breach now hold the full chamber aftermath behind a posted desert court."]
      ),
    ],
  };

  const { consequenceRewardPackagesLate } = runtimeWindow.__ROUGE_GC_REWARDS_LATE;
  Object.assign(consequenceRewardPackages, consequenceRewardPackagesLate);

  runtimeWindow.__ROUGE_GC_REWARDS = {
    consequenceRewardPackages,
  };
})();
