(() => {
  const RUN_SECTORS = [
    {
      name: "Freight Corridor",
      encounterSize: 3,
      enemies: [
        { key: "rail_hound", power: 1.0, weight: 3 },
        { key: "rail_sentry", power: 1.0, weight: 2 },
        { key: "ash_gunner", power: 1.0, weight: 2 },
        { key: "mortar_engineer", power: 0.9, weight: 1 },
      ],
    },
    {
      name: "Soot Tunnels",
      encounterSize: 3,
      enemies: [
        { key: "rail_sentry", power: 1.2, weight: 2 },
        { key: "ash_gunner", power: 1.2, weight: 3 },
        { key: "arc_lancer", power: 1.1, weight: 2 },
        { key: "zephyr_scout", power: 1.1, weight: 2 },
        { key: "fume_bomber", power: 1.05, weight: 1 },
        { key: "coil_priest", power: 1.0, weight: 1 },
        { key: "rail_hound", power: 1.1, weight: 1 },
      ],
    },
    {
      name: "Voltage Causeway",
      encounterSize: 3,
      enemies: [
        { key: "coil_priest", power: 1.15, weight: 2 },
        { key: "rail_sentry", power: 1.15, elite: true, weight: 1 },
        { key: "arc_lancer", power: 1.15, weight: 3 },
        { key: "signal_jammer", power: 1.1, weight: 2 },
        { key: "fume_bomber", power: 1.1, weight: 1 },
        { key: "zephyr_scout", power: 1.2, weight: 2 },
        { key: "ash_gunner", power: 1.2, weight: 2 },
      ],
    },
    {
      name: "Orbital Yards",
      encounterSize: 3,
      enemies: [
        { key: "orbital_miner", power: 1.2, weight: 2 },
        { key: "boiler_guard", power: 1.1, weight: 2 },
        { key: "mortar_engineer", power: 1.1, elite: true, weight: 1 },
        { key: "coil_priest", power: 1.2, weight: 2 },
        { key: "rivet_brute", power: 1.15, weight: 2 },
        { key: "rail_hound", power: 1.25, weight: 2 },
      ],
    },
    {
      name: "Foundry Crown",
      boss: true,
      enemies: [
        { key: "cinder_tyrant", power: 1.0 },
        { key: "rail_sentry", power: 1.35 },
        { key: "mortar_engineer", power: 1.25 },
        { key: "arc_lancer", power: 1.25 },
        { key: "fume_bomber", power: 1.2 },
        { key: "orbital_miner", power: 1.15 },
        { key: "signal_jammer", power: 1.2 },
        { key: "rivet_brute", power: 1.15 },
        { key: "ash_gunner", power: 1.25 },
      ],
    },
  ];

  const STARTER_DECK_RECIPE = [
    "stoke_burners",
    "stoke_burners",
    "pressure_vent",
    "pressure_vent",
    "spark_lance",
    "spark_lance",
    "emergency_fog",
    "turret_burst",
    "overpressure",
    "condenser_tap",
    "arc_drill",
    "arc_drill",
  ];

  const REWARD_POOL = [
    "rail_cannon",
    "coolant_flush",
    "boiler_bastion",
    "flash_relay",
    "static_field",
    "pressure_spike",
    "steam_barrier",
    "boiler_spike",
    "scrap_hail",
    "circuit_break",
    "slag_round",
    "blast_shield",
    "combo_strike",
    "relay_tap",
    "heat_sync",
    "siphon_bolt",
    "finisher_volley",
    "ignition_jab",
    "opening_salvo",
    "vent_vector",
    "priming_plating",
    "relay_uplink",
    "breach_line",
    "purge_blast",
    "turret_burst",
    "overpressure",
    "spark_lance",
  ];

  const INTERLUDES = [];

  const ARTIFACT_CATALOG = {
    aegis_booster: {
      id: "aegis_booster",
      title: "Aegis Booster",
      icon: "./assets/curated/icons/ui/alert_wall-light.svg",
      description: "Gain +2 Block at the start of each turn.",
      effect: "turn_start_block_bonus",
      value: 2,
      weight: 3,
      rarity: "common",
    },
    field_medkit: {
      id: "field_medkit",
      title: "Field Medkit",
      icon: "./assets/curated/icons/ui/hp_life-bar.svg",
      description: "Intermission repairs heal +2 extra Hull.",
      effect: "reward_heal_bonus",
      value: 2,
      weight: 2,
      rarity: "uncommon",
    },
    anchor_chassis: {
      id: "anchor_chassis",
      title: "Anchor Chassis",
      icon: "./assets/curated/icons/ui/turn_pocket-watch.svg",
      description: "Start each sector battle with +4 Block.",
      effect: "battle_start_block",
      value: 4,
      weight: 1,
      rarity: "rare",
    },
    coolant_manifold: {
      id: "coolant_manifold",
      title: "Coolant Manifold",
      icon: "./assets/curated/icons/ui/heat_radiations.svg",
      description: "Gain +3 extra turn-start cooling.",
      effect: "turn_start_cooling_bonus",
      value: 3,
      weight: 2,
      rarity: "uncommon",
    },
    capacitor_spindle: {
      id: "capacitor_spindle",
      title: "Capacitor Spindle",
      icon: "./assets/curated/icons/ui/energy_battery-50.svg",
      description: "Start each turn with +1 Steam.",
      effect: "turn_start_energy_bonus",
      value: 1,
      weight: 1,
      rarity: "rare",
    },
    targeting_lens: {
      id: "targeting_lens",
      title: "Targeting Lens",
      icon: "./assets/curated/icons/ui/idea_light-bulb.svg",
      description: "Draw +1 card at the start of each sector battle.",
      effect: "battle_start_draw_bonus",
      value: 1,
      weight: 2,
      rarity: "uncommon",
    },
    overclock_jacket: {
      id: "overclock_jacket",
      title: "Overclock Jacket",
      icon: "./assets/curated/icons/ui/crit_cross-flare.svg",
      description: "Overclock generates 4 less Heat.",
      effect: "overclock_heat_reduction",
      value: 4,
      weight: 3,
      rarity: "common",
    },
  };

  const UPGRADE_PATH_CATALOG = {
    condenser_bank: {
      id: "condenser_bank",
      title: "Condenser Bank",
      icon: "./assets/curated/icons/ui/energy_battery-50.svg",
      description: "Increase max Steam for stronger turns.",
      maxLevel: 3,
      tierUnlocks: [
        {
          id: "condenser_bank_tier_2",
          level: 2,
          title: "Stabilized Cells",
          description: "Condensers now hold pressure with less loss.",
          effect: "milestone",
          value: 0,
        },
        {
          id: "condenser_bank_tier_3",
          level: 3,
          title: "Reserve Coil",
          description: "Gain +1 Max Steam.",
          effect: "max_energy_bonus",
          value: 1,
        },
      ],
      branchChoices: {
        unlockLevel: 2,
        options: [
          {
            id: "condenser_bank_branch_pressure_cells",
            title: "Pressure Cells",
            description: "Gain +1 Max Steam.",
            effect: "max_energy_bonus",
            value: 1,
          },
          {
            id: "condenser_bank_branch_cold_baffles",
            title: "Cold Baffles",
            description: "Gain +2 turn-start cooling.",
            effect: "turn_start_cooling_bonus",
            value: 2,
          },
        ],
      },
    },
    coolant_loop: {
      id: "coolant_loop",
      title: "Coolant Loop",
      icon: "./assets/curated/icons/ui/heat_radiations.svg",
      description: "Increase passive cooling at turn start.",
      maxLevel: 3,
      tierUnlocks: [
        {
          id: "coolant_loop_tier_2",
          level: 2,
          title: "Flow Baffles",
          description: "Improved coolant routing calibration.",
          effect: "milestone",
          value: 0,
        },
        {
          id: "coolant_loop_tier_3",
          level: 3,
          title: "Cryo Spur",
          description: "Gain +2 extra turn-start cooling.",
          effect: "turn_start_cooling_bonus",
          value: 2,
        },
      ],
      branchChoices: {
        unlockLevel: 2,
        options: [
          {
            id: "coolant_loop_branch_frost_lining",
            title: "Frost Lining",
            description: "Gain +2 turn-start cooling.",
            effect: "turn_start_cooling_bonus",
            value: 2,
          },
          {
            id: "coolant_loop_branch_guarded_valves",
            title: "Guarded Valves",
            description: "Gain +2 turn-start Block.",
            effect: "turn_start_block_bonus",
            value: 2,
          },
        ],
      },
    },
    hull_plating: {
      id: "hull_plating",
      title: "Hull Plating",
      icon: "./assets/curated/icons/ui/hp_life-bar.svg",
      description: "Increase max Hull and gain immediate repairs.",
      maxLevel: 3,
      tierUnlocks: [
        {
          id: "hull_plating_tier_2",
          level: 2,
          title: "Riveted Mesh",
          description: "Layered armor lattice unlocked.",
          effect: "milestone",
          value: 0,
        },
        {
          id: "hull_plating_tier_3",
          level: 3,
          title: "Ablative Frame",
          description: "Gain +4 Max Hull.",
          effect: "max_hull_bonus",
          value: 4,
        },
      ],
      branchChoices: {
        unlockLevel: 2,
        options: [
          {
            id: "hull_plating_branch_bulkhead",
            title: "Bulkhead Frame",
            description: "Gain +4 Max Hull.",
            effect: "max_hull_bonus",
            value: 4,
          },
          {
            id: "hull_plating_branch_bastion",
            title: "Bastion Lattice",
            description: "Gain +2 turn-start Block.",
            effect: "turn_start_block_bonus",
            value: 2,
          },
        ],
      },
    },
    guard_protocol: {
      id: "guard_protocol",
      title: "Guard Protocol",
      icon: "./assets/curated/icons/ui/alert_wall-light.svg",
      description: "Start each turn with extra Block.",
      maxLevel: 3,
      tierUnlocks: [
        {
          id: "guard_protocol_tier_2",
          level: 2,
          title: "Threat Scanner",
          description: "Defense targeting routines improved.",
          effect: "milestone",
          value: 0,
        },
        {
          id: "guard_protocol_tier_3",
          level: 3,
          title: "Aegis Cycle",
          description: "Gain +2 extra start-turn Block.",
          effect: "turn_start_block_bonus",
          value: 2,
        },
      ],
      branchChoices: {
        unlockLevel: 2,
        options: [
          {
            id: "guard_protocol_branch_iron_wall",
            title: "Iron Wall",
            description: "Gain +3 turn-start Block.",
            effect: "turn_start_block_bonus",
            value: 3,
          },
          {
            id: "guard_protocol_branch_reactive_coils",
            title: "Reactive Coils",
            description: "Gain +1 Max Steam.",
            effect: "max_energy_bonus",
            value: 1,
          },
        ],
      },
    },
  };

  function normalizeId(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
  }

  function toActLabel(actNumber) {
    const roman = ["I", "II", "III", "IV", "V", "VI"];
    const index = Number.parseInt(actNumber, 10) - 1;
    const suffix = roman[index] || String(actNumber);
    return `Act ${suffix}`;
  }

  function getSeedBundle() {
    const bundle = window.BRASSLINE_SEEDS_D2;
    if (!bundle || typeof bundle !== "object") {
      return null;
    }
    return bundle;
  }

  function collectActEnemyIds(poolEntry) {
    if (!poolEntry || typeof poolEntry !== "object") {
      return [];
    }
    const entries = [
      ...(Array.isArray(poolEntry.enemies) ? poolEntry.enemies : []),
      ...(Array.isArray(poolEntry.nativeEnemies) ? poolEntry.nativeEnemies : []),
    ];

    return entries
      .map((entry) => normalizeId(entry?.id))
      .filter(Boolean)
      .filter((id, index, source) => source.indexOf(id) === index);
  }

  function buildZoneEnemyEntries({ enemyIds, zoneIndex = 0, actPower = 1 }) {
    if (!Array.isArray(enemyIds) || enemyIds.length === 0) {
      return [];
    }
    const sampleSize = Math.min(enemyIds.length, 8);
    const start = (zoneIndex * 3) % enemyIds.length;
    const picked = [];
    for (let i = 0; i < sampleSize; i += 1) {
      picked.push(enemyIds[(start + i) % enemyIds.length]);
    }

    return picked.map((enemyId, index) => ({
      key: enemyId,
      power: Number((actPower + zoneIndex * 0.015 + index * 0.01).toFixed(2)),
      elite: index === 0 && zoneIndex > 0 && zoneIndex % 5 === 0,
      weight: Math.max(1, 3 - (index % 3)),
    }));
  }

  function buildBossSectorEnemies({ bossId, enemyIds, zoneIndex = 0, actPower = 1 }) {
    const support = buildZoneEnemyEntries({
      enemyIds,
      zoneIndex,
      actPower: actPower + 0.12,
    })
      .slice(0, 4)
      .map((entry, index) => ({
        ...entry,
        elite: index === 0,
        power: Number((entry.power + 0.08).toFixed(2)),
      }));

    return [
      {
        key: bossId,
        power: Number((actPower + 0.35).toFixed(2)),
        weight: 5,
      },
      ...support,
    ];
  }

  function buildSeedRunSectors({ zonesDoc, enemyPoolsDoc }) {
    const acts = Array.isArray(zonesDoc?.acts) ? zonesDoc.acts : [];
    const enemyPools = Array.isArray(enemyPoolsDoc?.enemyPools) ? enemyPoolsDoc.enemyPools : [];
    if (acts.length === 0 || enemyPools.length === 0) {
      return [];
    }

    const poolByAct = new Map(
      enemyPools
        .map((entry) => [Number.parseInt(entry?.act, 10), collectActEnemyIds(entry)])
        .filter(([act, ids]) => Number.isInteger(act) && ids.length > 0)
    );

    const sectors = [];
    acts.forEach((actEntry, actIndex) => {
      const actNumber = Number.parseInt(actEntry?.act, 10);
      if (!Number.isInteger(actNumber)) {
        return;
      }
      const actEnemyIds = poolByAct.get(actNumber) || [];
      const mainlineZones = Array.isArray(actEntry?.mainlineZones) ? actEntry.mainlineZones : [];
      const bossZoneName = normalizeId(actEntry?.boss?.zone);
      const bossId = normalizeId(actEntry?.boss?.id);
      const actPower = 0.95 + actIndex * 0.14;

      mainlineZones.forEach((zoneNameRaw, zoneIndex) => {
        const zoneName = typeof zoneNameRaw === "string" && zoneNameRaw.trim() ? zoneNameRaw.trim() : `Zone ${zoneIndex + 1}`;
        const isBossZone = normalizeId(zoneName) === bossZoneName && Boolean(bossId);
        const encounterSize = isBossZone ? 3 : 1 + (zoneIndex % 3);
        const enemies = isBossZone
          ? buildBossSectorEnemies({
              bossId,
              enemyIds: actEnemyIds,
              zoneIndex,
              actPower,
            })
          : buildZoneEnemyEntries({
              enemyIds: actEnemyIds,
              zoneIndex,
              actPower,
            });

        if (enemies.length === 0) {
          return;
        }

        sectors.push({
          name: `${toActLabel(actNumber)} - ${zoneName}`,
          boss: isBossZone,
          encounterSize,
          enemies,
        });
      });
    });

    return sectors;
  }

  function buildSeedInterludes(seedSectors) {
    const sectors = Array.isArray(seedSectors) ? seedSectors : [];
    const actBreakpoints = sectors
      .map((sector, index) => ({ index, sector }))
      .filter(({ sector }) => sector?.boss);

    return actBreakpoints
      .filter(({ index }) => index < sectors.length - 1)
      .map(({ index, sector }, entryIndex) => ({
        afterSector: index + 1,
        type: "event",
        title: `${sector.name} - Camp`,
        description: "Choose one recovery option before entering the next act.",
        options: [
          {
            label: "Recover and regroup (+10 Hull, -8 Heat)",
            hull: 10,
            heat: -8,
          },
          {
            label: "Press tempo (+1 Steam card draw setup)",
            hull: 4,
            heat: -4,
            addCard: entryIndex % 2 === 0 ? "relay_uplink" : "condenser_tap",
          },
          {
            label: "Trim dead weight (remove Pressure Vent)",
            removeCard: "pressure_vent",
            hull: 2,
            heat: -2,
          },
        ],
      }));
  }

  function buildSeedProgressionContent() {
    const bundle = getSeedBundle();
    const runSectors = buildSeedRunSectors({
      zonesDoc: bundle?.zones,
      enemyPoolsDoc: bundle?.enemyPools,
    });
    if (runSectors.length === 0) {
      return null;
    }

    return {
      runSectors,
      interludes: buildSeedInterludes(runSectors),
    };
  }

  const SEEDED_PROGRESSION_CONTENT = buildSeedProgressionContent();

  function cloneRunSectors(sectors) {
    return (Array.isArray(sectors) ? sectors : []).map((sector) => ({
      name: sector?.name,
      boss: Boolean(sector?.boss),
      encounterSize: Number.isInteger(sector?.encounterSize) && sector.encounterSize > 0 ? sector.encounterSize : null,
      enemies: Array.isArray(sector?.enemies)
        ? sector.enemies.map((entry) => ({
            key: entry?.key,
            power: entry?.power,
            elite: Boolean(entry?.elite),
            weight: Number.isFinite(entry?.weight) && entry.weight > 0 ? entry.weight : 1,
          }))
        : [],
    }));
  }

  function cloneUpgradePathCatalog(catalog) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((path) => path && typeof path === "object" && typeof path.id === "string")
        .map((path) => [
          path.id,
          {
            ...path,
            tierUnlocks: (Array.isArray(path.tierUnlocks) ? path.tierUnlocks : []).map((tier) => ({
              ...tier,
            })),
            branchChoices:
              path.branchChoices && typeof path.branchChoices === "object"
                ? {
                    ...path.branchChoices,
                    options: (Array.isArray(path.branchChoices.options) ? path.branchChoices.options : []).map(
                      (option) => ({ ...option })
                    ),
                  }
                : null,
          },
        ])
    );
  }

  function cloneArtifactCatalog(catalog) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((artifact) => artifact && typeof artifact === "object" && typeof artifact.id === "string")
        .map((artifact) => [
          artifact.id,
          {
            ...artifact,
          },
        ])
    );
  }

  function getDefaultRunSectors() {
    return cloneRunSectors(SEEDED_PROGRESSION_CONTENT?.runSectors || RUN_SECTORS);
  }

  function getDefaultStarterDeckRecipe() {
    return [...STARTER_DECK_RECIPE];
  }

  function getDefaultRewardPool() {
    return [...REWARD_POOL];
  }

  function getDefaultInterludes() {
    return [...(SEEDED_PROGRESSION_CONTENT?.interludes || INTERLUDES)];
  }

  function getDefaultArtifactCatalog() {
    return cloneArtifactCatalog(ARTIFACT_CATALOG);
  }

  function getDefaultUpgradePathCatalog() {
    return cloneUpgradePathCatalog(UPGRADE_PATH_CATALOG);
  }

  window.BRASSLINE_PROGRESSION_CONTENT = {
    getDefaultRunSectors,
    getDefaultStarterDeckRecipe,
    getDefaultRewardPool,
    getDefaultInterludes,
    getDefaultArtifactCatalog,
    getDefaultUpgradePathCatalog,
  };
})();
