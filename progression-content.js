(() => {
  const RUN_SECTORS = [
    {
      name: "Freight Corridor",
      enemies: [
        { key: "rail_hound", power: 1.0 },
        { key: "rail_sentry", power: 1.0 },
        { key: "ash_gunner", power: 1.0 },
        { key: "mortar_engineer", power: 0.9 },
      ],
    },
    {
      name: "Soot Tunnels",
      enemies: [
        { key: "rail_sentry", power: 1.2 },
        { key: "ash_gunner", power: 1.2 },
        { key: "arc_lancer", power: 1.1 },
        { key: "zephyr_scout", power: 1.1 },
        { key: "fume_bomber", power: 1.05 },
        { key: "coil_priest", power: 1.0 },
        { key: "rail_hound", power: 1.1 },
      ],
    },
    {
      name: "Voltage Causeway",
      enemies: [
        { key: "coil_priest", power: 1.15 },
        { key: "rail_sentry", power: 1.25 },
        { key: "arc_lancer", power: 1.15 },
        { key: "fume_bomber", power: 1.1 },
        { key: "zephyr_scout", power: 1.2 },
        { key: "ash_gunner", power: 1.2 },
      ],
    },
    {
      name: "Orbital Yards",
      enemies: [
        { key: "orbital_miner", power: 1.2 },
        { key: "boiler_guard", power: 1.1 },
        { key: "mortar_engineer", power: 1.2 },
        { key: "coil_priest", power: 1.2 },
        { key: "rail_hound", power: 1.25 },
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
    "turret_burst",
    "overpressure",
    "spark_lance",
  ];

  const INTERLUDES = [];

  const UPGRADE_PATH_CATALOG = {
    condenser_bank: {
      id: "condenser_bank",
      title: "Condenser Bank",
      icon: "./assets/curated/icons/ui/energy_battery-50.svg",
      description: "Increase max Steam for stronger turns.",
      maxLevel: 3,
    },
    coolant_loop: {
      id: "coolant_loop",
      title: "Coolant Loop",
      icon: "./assets/curated/icons/ui/heat_radiations.svg",
      description: "Increase passive cooling at turn start.",
      maxLevel: 3,
    },
    hull_plating: {
      id: "hull_plating",
      title: "Hull Plating",
      icon: "./assets/curated/icons/ui/hp_life-bar.svg",
      description: "Increase max Hull and gain immediate repairs.",
      maxLevel: 3,
    },
    guard_protocol: {
      id: "guard_protocol",
      title: "Guard Protocol",
      icon: "./assets/curated/icons/ui/alert_wall-light.svg",
      description: "Start each turn with extra Block.",
      maxLevel: 3,
    },
  };

  function cloneRunSectors(sectors) {
    return (Array.isArray(sectors) ? sectors : []).map((sector) => ({
      name: sector?.name,
      boss: Boolean(sector?.boss),
      enemies: Array.isArray(sector?.enemies)
        ? sector.enemies.map((entry) => ({
            key: entry?.key,
            power: entry?.power,
          }))
        : [],
    }));
  }

  function cloneUpgradePathCatalog(catalog) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((path) => path && typeof path === "object" && typeof path.id === "string")
        .map((path) => [path.id, { ...path }])
    );
  }

  function getDefaultRunSectors() {
    return cloneRunSectors(RUN_SECTORS);
  }

  function getDefaultStarterDeckRecipe() {
    return [...STARTER_DECK_RECIPE];
  }

  function getDefaultRewardPool() {
    return [...REWARD_POOL];
  }

  function getDefaultInterludes() {
    return [...INTERLUDES];
  }

  function getDefaultUpgradePathCatalog() {
    return cloneUpgradePathCatalog(UPGRADE_PATH_CATALOG);
  }

  window.BRASSLINE_PROGRESSION_CONTENT = {
    getDefaultRunSectors,
    getDefaultStarterDeckRecipe,
    getDefaultRewardPool,
    getDefaultInterludes,
    getDefaultUpgradePathCatalog,
  };
})();
