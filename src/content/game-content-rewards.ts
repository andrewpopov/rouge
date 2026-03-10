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
        ["Detour, escalation, and covenant now settle together at Diablo instead of ending at the first covenant pass."]
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
        ["Locked phalanx steps and paced reliefs now settle the full sanctuary aftermath into a drilled Diablo payout."]
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
        ["Breach rivets, locked phalanx steps, and paced reliefs now settle the full sanctuary aftermath into the most mobilized Diablo payout."]
      ),
      consequenceRewardPackage(
        "hellforge_aftermath_bell_dividend",
        "Sanctuary Bell Aftermath Dividend",
        "boss",
        ["hellforge_detour_hellward_sidepass", "hellforge_escalation_sanctuary_screen", "hellforge_covenant_sanctuary_bells"],
        { gold: 24, xp: 13, potions: 1 },
        ["Sanctuary bells, the hellward sidepass, and the sanctuary screen now hold the full Diablo aftermath behind a posted infernal court."]
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
        ["The final summit covenant resolves into a richer boss settlement before Baal falls."]
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
        "Worldstone Surge Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_worldstone_surge"],
        { gold: 16, xp: 8, potions: 1 },
        ["The Worldstone surge pays out when the next elite summit line breaks under full pressure."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_oath_dividend",
        "Oath Breach Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_oath_surge"],
        { gold: 14, xp: 8, potions: 1 },
        ["The oath surge turns the next elite summit host into a sharper breach payout before the full Worldstone rush lands."]
      ),
      consequenceRewardPackage(
        "harrogath_escalation_reserve_dividend",
        "Reserve Surge Dividend",
        "branchMiniboss",
        ["harrogath_reckoning_oath_rations", "harrogath_escalation_worldstone_surge", "harrogath_crossroads_summit_reserve"],
        { gold: 18, xp: 9, potions: 1 },
        ["The earlier summit reserve now routes the full Worldstone surge into a more directed elite payout."]
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
        ["The ancients accord, drilled peak guard, and summit reserve now route the full Worldstone surge into the most mobilized mountain elite payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_worldstone_dividend",
        "Worldstone Aftermath Dividend",
        "boss",
        ["harrogath_detour_hidden_sleds", "harrogath_escalation_worldstone_surge", "harrogath_covenant_ancients_ledger"],
        { gold: 24, xp: 12, potions: 1 },
        ["Detour, escalation, and covenant now settle together when Baal's host falls instead of stopping at the summit covenant."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_ancients_dividend",
        "Ancients Aftermath Dividend",
        "boss",
        ["harrogath_detour_hidden_sleds", "harrogath_escalation_worldstone_surge", "harrogath_covenant_ancients_ledger", "harrogath_crossroads_summit_reserve"],
        { gold: 26, xp: 13, potions: 1 },
        ["The earlier summit reserve line now steers the full Worldstone aftermath into a more directed Ancients settlement."]
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
        ["Ringed watchfires and the summit reserve now settle the full Worldstone aftermath into the sharpest mountain boss payout."]
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
        ["Peak guard drills and the captain's switchbacks now settle the full summit aftermath into a drilled Worldstone payout."]
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
        ["Ancients accord posts, peak guard drills, and the captain's switchbacks now settle the full summit aftermath into the most mobilized Worldstone payout."]
      ),
      consequenceRewardPackage(
        "harrogath_aftermath_bell_dividend",
        "Summit Bell Aftermath Dividend",
        "boss",
        ["harrogath_detour_banner_sidepass", "harrogath_escalation_oath_surge", "harrogath_covenant_summit_bells"],
        { gold: 26, xp: 13, potions: 1 },
        ["Summit bells, the banner sidepass, and the oath surge now hold the full Worldstone aftermath behind a posted mountain court."]
      ),
    ],
  };

  runtimeWindow.__ROUGE_GC_REWARDS = {
    consequenceRewardPackages,
  };
})();
