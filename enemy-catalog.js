(() => {
  function createEnemyBlueprints({ enemyTune, enemyIntentTune }) {
    const tuneEnemy = typeof enemyTune === "function" ? enemyTune : (_enemyId, _key, fallback) => fallback;
    const tuneIntent =
      typeof enemyIntentTune === "function"
        ? enemyIntentTune
        : (_enemyId, _intentIndex, _key, fallback) => fallback;

    return {
      rail_hound: {
        key: "rail_hound",
        name: "Rail Hound",
        maxHp: tuneEnemy("rail_hound", "maxHp", 30),
        icon: "./assets/curated/icons/enemies/01_steam-locomotive.svg",
        intents: [
          {
            kind: "attack",
            value: tuneIntent("rail_hound", 0, "value", 6),
            hits: tuneIntent("rail_hound", 0, "hits", 1),
            label: "Bite",
          },
          {
            kind: "attack",
            value: tuneIntent("rail_hound", 1, "value", 8),
            hits: tuneIntent("rail_hound", 1, "hits", 1),
            label: "Ram",
          },
        ],
      },
      ash_gunner: {
        key: "ash_gunner",
        name: "Ash Gunner",
        maxHp: tuneEnemy("ash_gunner", "maxHp", 25),
        icon: "./assets/curated/icons/enemies/07_laser-turret.svg",
        intents: [
          {
            kind: "attack",
            value: tuneIntent("ash_gunner", 0, "value", 3),
            hits: tuneIntent("ash_gunner", 0, "hits", 2),
            label: "Suppress",
          },
          {
            kind: "stoke",
            value: tuneIntent("ash_gunner", 1, "value", 6),
            hits: tuneIntent("ash_gunner", 1, "hits", 0),
            label: "Spark Spray",
          },
        ],
      },
      rail_sentry: {
        key: "rail_sentry",
        name: "Rail Sentry",
        maxHp: tuneEnemy("rail_sentry", "maxHp", 29),
        icon: "./assets/curated/icons/enemies/06_walking-turret.svg",
        startIntentIndex: tuneEnemy("rail_sentry", "startIntentIndex", 0),
        intents: [
          {
            kind: "aim",
            value: tuneIntent("rail_sentry", 0, "value", 4),
            hits: tuneIntent("rail_sentry", 0, "hits", 0),
            label: "Stop & Aim",
          },
          {
            kind: "attack",
            value: tuneIntent("rail_sentry", 1, "value", 9),
            hits: tuneIntent("rail_sentry", 1, "hits", 1),
            label: "Rifle Shot",
          },
        ],
      },
      mortar_engineer: {
        key: "mortar_engineer",
        name: "Mortar Engineer",
        maxHp: tuneEnemy("mortar_engineer", "maxHp", 33),
        icon: "./assets/curated/icons/enemies/02_iron-hulled-warship.svg",
        intents: [
          {
            kind: "lob",
            value: tuneIntent("mortar_engineer", 0, "value", 12),
            cookTier: tuneIntent("mortar_engineer", 0, "cookTier", "slow"),
            radius: tuneIntent("mortar_engineer", 0, "radius", 1),
            label: "Lob Charge",
          },
          {
            kind: "guard",
            value: tuneIntent("mortar_engineer", 1, "value", 5),
            hits: tuneIntent("mortar_engineer", 1, "hits", 0),
            label: "Shield Plate",
          },
        ],
      },
      arc_lancer: {
        key: "arc_lancer",
        name: "Arc Lancer",
        maxHp: tuneEnemy("arc_lancer", "maxHp", 31),
        icon: "./assets/curated/icons/enemies/09_satellite.svg",
        intents: [
          {
            kind: "sweep",
            value: tuneIntent("arc_lancer", 0, "value", 11),
            cookTier: tuneIntent("arc_lancer", 0, "cookTier", "medium"),
            width: tuneIntent("arc_lancer", 0, "width", 3),
            label: "Directional Sweep",
          },
          {
            kind: "charge",
            value: tuneIntent("arc_lancer", 1, "value", 2),
            hits: tuneIntent("arc_lancer", 1, "hits", 0),
            label: "Charge Grid",
          },
        ],
      },
      clockwork_diver: {
        key: "clockwork_diver",
        name: "Clockwork Diver",
        maxHp: tuneEnemy("clockwork_diver", "maxHp", 34),
        icon: "./assets/curated/icons/enemies/05_mechanical-arm.svg",
        intents: [
          {
            kind: "guard",
            value: tuneIntent("clockwork_diver", 0, "value", 6),
            hits: tuneIntent("clockwork_diver", 0, "hits", 0),
            label: "Brace",
          },
          {
            kind: "attack",
            value: tuneIntent("clockwork_diver", 1, "value", 7),
            hits: tuneIntent("clockwork_diver", 1, "hits", 1),
            label: "Hydraulic Slam",
          },
        ],
      },
      zephyr_scout: {
        key: "zephyr_scout",
        name: "Zephyr Scout",
        maxHp: tuneEnemy("zephyr_scout", "maxHp", 28),
        icon: "./assets/curated/icons/enemies/12_zeppelin.svg",
        intents: [
          {
            kind: "charge",
            value: tuneIntent("zephyr_scout", 0, "value", 2),
            hits: tuneIntent("zephyr_scout", 0, "hits", 0),
            label: "Charge",
          },
          {
            kind: "attack",
            value: tuneIntent("zephyr_scout", 1, "value", 5),
            hits: tuneIntent("zephyr_scout", 1, "hits", 2),
            label: "Dive",
          },
        ],
      },
      boiler_guard: {
        key: "boiler_guard",
        name: "Boiler Guard",
        maxHp: tuneEnemy("boiler_guard", "maxHp", 40),
        icon: "./assets/curated/icons/enemies/10_tesla.svg",
        intents: [
          {
            kind: "guard",
            value: tuneIntent("boiler_guard", 0, "value", 8),
            hits: tuneIntent("boiler_guard", 0, "hits", 0),
            label: "Fortify",
          },
          {
            kind: "attack",
            value: tuneIntent("boiler_guard", 1, "value", 9),
            hits: tuneIntent("boiler_guard", 1, "hits", 1),
            label: "Shock Baton",
          },
        ],
      },
      fume_bomber: {
        key: "fume_bomber",
        name: "Fume Bomber",
        maxHp: tuneEnemy("fume_bomber", "maxHp", 32),
        icon: "./assets/curated/icons/enemies/04_gas-mask.svg",
        intents: [
          {
            kind: "lob",
            value: tuneIntent("fume_bomber", 0, "value", 10),
            cookTier: tuneIntent("fume_bomber", 0, "cookTier", "medium"),
            radius: tuneIntent("fume_bomber", 0, "radius", 1),
            label: "Gas Canister",
          },
          {
            kind: "stoke",
            value: tuneIntent("fume_bomber", 1, "value", 5),
            hits: tuneIntent("fume_bomber", 1, "hits", 0),
            label: "Fume Leak",
          },
          {
            kind: "attack",
            value: tuneIntent("fume_bomber", 2, "value", 6),
            hits: tuneIntent("fume_bomber", 2, "hits", 1),
            label: "Shrapnel Shot",
          },
        ],
      },
      coil_priest: {
        key: "coil_priest",
        name: "Coil Priest",
        maxHp: tuneEnemy("coil_priest", "maxHp", 30),
        icon: "./assets/curated/icons/enemies/11_frankenstein-creature.svg",
        intents: [
          {
            kind: "charge",
            value: tuneIntent("coil_priest", 0, "value", 2),
            hits: tuneIntent("coil_priest", 0, "hits", 0),
            label: "Channel Coil",
          },
          {
            kind: "attack",
            value: tuneIntent("coil_priest", 1, "value", 7),
            hits: tuneIntent("coil_priest", 1, "hits", 1),
            label: "Arc Jab",
          },
          {
            kind: "stoke",
            value: tuneIntent("coil_priest", 2, "value", 6),
            hits: tuneIntent("coil_priest", 2, "hits", 0),
            label: "Overheat Chant",
          },
        ],
      },
      orbital_miner: {
        key: "orbital_miner",
        name: "Orbital Miner",
        maxHp: tuneEnemy("orbital_miner", "maxHp", 35),
        icon: "./assets/curated/icons/enemies/08_spoutnik.svg",
        intents: [
          {
            kind: "sweep",
            value: tuneIntent("orbital_miner", 0, "value", 10),
            cookTier: tuneIntent("orbital_miner", 0, "cookTier", "medium"),
            width: tuneIntent("orbital_miner", 0, "width", 2),
            label: "Cutting Sweep",
          },
          {
            kind: "guard",
            value: tuneIntent("orbital_miner", 1, "value", 6),
            hits: tuneIntent("orbital_miner", 1, "hits", 0),
            label: "Ablative Shell",
          },
          {
            kind: "attack",
            value: tuneIntent("orbital_miner", 2, "value", 6),
            hits: tuneIntent("orbital_miner", 2, "hits", 2),
            label: "Drill Burst",
          },
        ],
      },
      cinder_tyrant: {
        key: "cinder_tyrant",
        name: "Cinder Tyrant",
        maxHp: tuneEnemy("cinder_tyrant", "maxHp", 95),
        icon: "./assets/curated/icons/enemies/03_dreadnought.svg",
        intents: [
          {
            kind: "stoke",
            value: tuneIntent("cinder_tyrant", 0, "value", 10),
            hits: tuneIntent("cinder_tyrant", 0, "hits", 0),
            label: "Boil Over",
          },
          {
            kind: "attack",
            value: tuneIntent("cinder_tyrant", 1, "value", 12),
            hits: tuneIntent("cinder_tyrant", 1, "hits", 1),
            label: "Anvil Barrage",
          },
          {
            kind: "charge",
            value: tuneIntent("cinder_tyrant", 2, "value", 3),
            hits: tuneIntent("cinder_tyrant", 2, "hits", 0),
            label: "Core Charge",
          },
          {
            kind: "sweep",
            value: tuneIntent("cinder_tyrant", 3, "value", 13),
            cookTier: tuneIntent("cinder_tyrant", 3, "cookTier", "fast"),
            width: tuneIntent("cinder_tyrant", 3, "width", 2),
            label: "Flash Sweep",
          },
          {
            kind: "attack",
            value: tuneIntent("cinder_tyrant", 4, "value", 8),
            hits: tuneIntent("cinder_tyrant", 4, "hits", 2),
            label: "Furnace Flurry",
          },
        ],
      },
    };
  }

  window.BRASSLINE_ENEMY_CATALOG = {
    createEnemyBlueprints,
  };
})();
