(() => {
  function normalizeId(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
  }

  function normalizeTitle(value, fallback = "Unknown") {
    if (typeof value !== "string" || !value.trim()) {
      return fallback;
    }
    return value.trim();
  }

  function getSeedBundle() {
    const bundle = window.BRASSLINE_SEEDS_D2;
    if (!bundle || typeof bundle !== "object") {
      return null;
    }
    return bundle;
  }

  function getDefaultEnemyIcon(enemyId) {
    const themedIcons = [
      "./assets/curated/themes/diablo-inspired/icons/enemies/01_diablo-skull.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/02_cultist.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/03_warlock-hood.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/04_ogre.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/05_troll.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/06_vampire-dracula.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/07_shambling-zombie.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/08_grim-reaper.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/09_devil-mask.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/10_death-skull.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/11_dragon-head.svg",
      "./assets/curated/themes/diablo-inspired/icons/enemies/12_crowned-skull.svg",
    ];
    const key = normalizeId(enemyId);
    const hash = Array.from(key).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
    return themedIcons[hash % themedIcons.length];
  }

  function inferEnemyMaxHp({ act = 1, enemyId = "" }) {
    const actIndex = Math.max(1, Number.parseInt(act, 10) || 1);
    const id = normalizeId(enemyId);
    let hp = 22 + actIndex * 6;
    if (id.includes("boss") || id.includes("lord") || id.includes("member")) {
      hp += 12;
    }
    if (id.includes("shaman") || id.includes("mage") || id.includes("priest")) {
      hp -= 4;
    }
    if (id.includes("catapult") || id.includes("tower") || id.includes("trap")) {
      hp += 8;
    }
    return Math.max(20, hp);
  }

  function inferEnemyIntents({ enemyId = "", enemyName = "", act = 1 }) {
    const id = normalizeId(enemyId);
    const name = normalizeTitle(enemyName, enemyId);
    const actBonus = Math.max(0, (Number.parseInt(act, 10) || 1) - 1);
    const baseAttack = 5 + actBonus;

    if (id.includes("shaman")) {
      return [
        {
          kind: "stoke",
          value: 4 + actBonus,
          hits: 0,
          label: "Hex Chant",
        },
        {
          kind: "resurrect",
          value: 1,
          healPercent: 40,
          targetKey: id.includes("fallen") ? "fallen" : "",
          label: "Dark Resurrection",
        },
        {
          kind: "lob",
          value: baseAttack + 2,
          cookTier: "medium",
          radius: 1,
          label: "Cursed Orb",
        },
      ];
    }

    if (id.includes("archer") || id.includes("slinger") || id.includes("vulture")) {
      return [
        {
          kind: "aim",
          value: 3 + actBonus,
          hits: 0,
          label: "Steady Aim",
        },
        {
          kind: "attack",
          value: baseAttack + 2,
          hits: id.includes("slinger") ? 2 : 1,
          label: "Piercing Shot",
        },
      ];
    }

    if (id.includes("catapult") || id.includes("tower") || id.includes("trap") || id.includes("spire")) {
      return [
        {
          kind: "lob",
          value: baseAttack + 4,
          cookTier: "slow",
          radius: 1,
          label: "Siege Lob",
        },
        {
          kind: "attack",
          value: baseAttack + 1,
          hits: 1,
          label: "Volley",
        },
      ];
    }

    if (id.includes("mage") || id.includes("priest") || id.includes("warlock") || id.includes("council")) {
      return [
        {
          kind: "stoke",
          value: 5 + actBonus,
          hits: 0,
          label: "Corrupt Aura",
        },
        {
          kind: "lob",
          value: baseAttack + 3,
          cookTier: "medium",
          radius: 1,
          label: "Orb Burst",
        },
        {
          kind: "attack",
          value: baseAttack + 1,
          hits: 1,
          label: "Bolt",
        },
      ];
    }

    if (
      id.includes("brute") ||
      id.includes("hulk") ||
      id.includes("mauler") ||
      id.includes("blood_lord") ||
      id.includes("abominable") ||
      id.includes("siege_beast")
    ) {
      return [
        {
          kind: "guard",
          value: 5 + actBonus,
          hits: 0,
          label: "Fortify",
        },
        {
          kind: "attack",
          value: baseAttack + 4,
          hits: 1,
          label: "Crushing Blow",
        },
        {
          kind: "sweep",
          value: baseAttack + 2,
          cookTier: "medium",
          width: 2,
          label: "Cleave Arc",
        },
      ];
    }

    if (
      id.includes("imp") ||
      id.includes("fetish") ||
      id.includes("spider") ||
      id.includes("maggot") ||
      id.includes("leaper") ||
      id.includes("hawk")
    ) {
      return [
        {
          kind: "charge",
          value: 2,
          hits: 0,
          label: "Frenzy",
        },
        {
          kind: "attack",
          value: baseAttack,
          hits: 2,
          label: "Flurry",
        },
      ];
    }

    return [
      {
        kind: "attack",
        value: baseAttack + 1,
        hits: 1,
        label: `${name} Strike`,
      },
      {
        kind: "guard",
        value: 4 + actBonus,
        hits: 0,
        label: "Brace",
      },
    ];
  }

  function createSeedEnemyBlueprints({ tuneEnemy, tuneIntent }) {
    const bundle = getSeedBundle();
    const enemyPools = Array.isArray(bundle?.enemyPools?.enemyPools) ? bundle.enemyPools.enemyPools : [];
    if (enemyPools.length === 0) {
      return {};
    }

    const blueprints = {};
    enemyPools.forEach((poolEntry) => {
      const actNumber = Number.parseInt(poolEntry?.act, 10) || 1;
      const enemies = [
        ...(Array.isArray(poolEntry.enemies) ? poolEntry.enemies : []),
        ...(Array.isArray(poolEntry.nativeEnemies) ? poolEntry.nativeEnemies : []),
      ];
      enemies.forEach((enemyEntry) => {
        const enemyId = normalizeId(enemyEntry?.id);
        if (!enemyId || blueprints[enemyId]) {
          return;
        }
        const name = normalizeTitle(enemyEntry?.name, enemyId);
        const intents = inferEnemyIntents({
          enemyId,
          enemyName: name,
          act: actNumber,
        }).map((intent, intentIndex) => ({
          ...intent,
          value: tuneIntent(enemyId, intentIndex, "value", intent.value),
          hits: tuneIntent(enemyId, intentIndex, "hits", intent.hits),
          cookTier: tuneIntent(enemyId, intentIndex, "cookTier", intent.cookTier),
          radius: tuneIntent(enemyId, intentIndex, "radius", intent.radius),
          width: tuneIntent(enemyId, intentIndex, "width", intent.width),
          healPercent: tuneIntent(enemyId, intentIndex, "healPercent", intent.healPercent),
        }));

        blueprints[enemyId] = {
          key: enemyId,
          name,
          maxHp: tuneEnemy(enemyId, "maxHp", inferEnemyMaxHp({ act: actNumber, enemyId })),
          icon: getDefaultEnemyIcon(enemyId),
          intents,
          eliteHpMultiplier: tuneEnemy(enemyId, "eliteHpMultiplier", 1.2),
          eliteStartBlock: tuneEnemy(enemyId, "eliteStartBlock", 3),
          eliteAttackBuff: tuneEnemy(enemyId, "eliteAttackBuff", 1),
          eliteLabel: `${name} Champion`,
        };
      });
    });

    const actBosses = Array.isArray(bundle?.enemyPools?.actBosses) ? bundle.enemyPools.actBosses : [];
    actBosses.forEach((boss) => {
      const bossId = normalizeId(boss?.id);
      if (!bossId) {
        return;
      }
      const act = Number.parseInt(boss?.act, 10) || 1;
      const bossName = normalizeTitle(boss?.name, bossId);
      const bossThemes = Array.isArray(boss?.canonicalTheme) ? boss.canonicalTheme.map((entry) => normalizeId(entry)) : [];
      const hasPoison = bossThemes.some((theme) => theme.includes("poison"));
      const hasCold = bossThemes.some((theme) => theme.includes("cold"));
      const hasLightning = bossThemes.some((theme) => theme.includes("lightning"));
      const baseDamage = 9 + act * 2;

      const intents = [
        {
          kind: "attack",
          value: baseDamage + 2,
          hits: 1,
          label: "Boss Strike",
        },
        {
          kind: "lob",
          value: baseDamage + (hasPoison ? 4 : 2),
          cookTier: hasCold ? "slow" : "medium",
          radius: 1,
          label: hasPoison ? "Venom Burst" : "Ruin Orb",
        },
        {
          kind: hasLightning ? "sweep" : "stoke",
          value: hasLightning ? baseDamage + 3 : 6 + act,
          cookTier: hasLightning ? "fast" : undefined,
          width: hasLightning ? 3 : undefined,
          hits: hasLightning ? 0 : 0,
          label: hasLightning ? "Lightning Hose" : "Demonic Pressure",
        },
      ].map((intent, intentIndex) => ({
        ...intent,
        value: tuneIntent(bossId, intentIndex, "value", intent.value),
        hits: tuneIntent(bossId, intentIndex, "hits", intent.hits),
        cookTier: tuneIntent(bossId, intentIndex, "cookTier", intent.cookTier),
        radius: tuneIntent(bossId, intentIndex, "radius", intent.radius),
        width: tuneIntent(bossId, intentIndex, "width", intent.width),
      }));

      blueprints[bossId] = {
        key: bossId,
        name: bossName,
        maxHp: tuneEnemy(bossId, "maxHp", 84 + act * 16),
        icon: getDefaultEnemyIcon(bossId),
        intents,
        eliteHpMultiplier: tuneEnemy(bossId, "eliteHpMultiplier", 1.3),
        eliteStartBlock: tuneEnemy(bossId, "eliteStartBlock", 5),
        eliteAttackBuff: tuneEnemy(bossId, "eliteAttackBuff", 2),
        eliteLabel: `${bossName} (Empowered)`,
      };
    });

    return blueprints;
  }

  function createEnemyBlueprints({ enemyTune, enemyIntentTune }) {
    const tuneEnemy = typeof enemyTune === "function" ? enemyTune : (_enemyId, _key, fallback) => fallback;
    const tuneIntent =
      typeof enemyIntentTune === "function"
        ? enemyIntentTune
        : (_enemyId, _intentIndex, _key, fallback) => fallback;

    const fallbackBlueprints = {
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
        eliteHpMultiplier: tuneEnemy("rail_sentry", "eliteHpMultiplier", 1.25),
        eliteStartBlock: tuneEnemy("rail_sentry", "eliteStartBlock", 4),
        eliteAttackBuff: tuneEnemy("rail_sentry", "eliteAttackBuff", 1),
        eliteLabel: "Elite Sniper Chassis",
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
        eliteIntents: [
          {
            kind: "aim",
            value: tuneIntent("rail_sentry", 0, "value", 5),
            hits: tuneIntent("rail_sentry", 0, "hits", 0),
            label: "Stop & Mark",
          },
          {
            kind: "attack",
            value: tuneIntent("rail_sentry", 1, "value", 10),
            hits: tuneIntent("rail_sentry", 1, "hits", 1),
            label: "Piercing Shot",
          },
          {
            kind: "sweep",
            value: tuneIntent("rail_sentry", 2, "value", 8),
            cookTier: tuneIntent("rail_sentry", 2, "cookTier", "medium"),
            width: tuneIntent("rail_sentry", 2, "width", 2),
            label: "Rail Sweep",
          },
        ],
      },
      mortar_engineer: {
        key: "mortar_engineer",
        name: "Mortar Engineer",
        maxHp: tuneEnemy("mortar_engineer", "maxHp", 33),
        icon: "./assets/curated/icons/enemies/02_iron-hulled-warship.svg",
        eliteHpMultiplier: tuneEnemy("mortar_engineer", "eliteHpMultiplier", 1.3),
        eliteStartBlock: tuneEnemy("mortar_engineer", "eliteStartBlock", 5),
        eliteAttackBuff: tuneEnemy("mortar_engineer", "eliteAttackBuff", 0),
        eliteLabel: "Elite Siege Crew",
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
        eliteIntents: [
          {
            kind: "lob",
            value: tuneIntent("mortar_engineer", 0, "value", 13),
            cookTier: tuneIntent("mortar_engineer", 0, "cookTier", "medium"),
            radius: tuneIntent("mortar_engineer", 0, "radius", 1),
            label: "Cluster Lob",
          },
          {
            kind: "stoke",
            value: tuneIntent("mortar_engineer", 2, "value", 7),
            hits: tuneIntent("mortar_engineer", 2, "hits", 0),
            label: "Kindle Fuse",
          },
          {
            kind: "attack",
            value: tuneIntent("mortar_engineer", 3, "value", 8),
            hits: tuneIntent("mortar_engineer", 3, "hits", 1),
            label: "Shrapnel Burst",
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
      signal_jammer: {
        key: "signal_jammer",
        name: "Signal Jammer",
        maxHp: tuneEnemy("signal_jammer", "maxHp", 29),
        icon: "./assets/curated/icons/enemies/09_satellite.svg",
        eliteHpMultiplier: tuneEnemy("signal_jammer", "eliteHpMultiplier", 1.2),
        eliteStartBlock: tuneEnemy("signal_jammer", "eliteStartBlock", 4),
        eliteAttackBuff: tuneEnemy("signal_jammer", "eliteAttackBuff", 1),
        eliteLabel: "Elite Jam Core",
        intents: [
          {
            kind: "aim",
            value: tuneIntent("signal_jammer", 0, "value", 4),
            hits: tuneIntent("signal_jammer", 0, "hits", 0),
            label: "Ping Lock",
          },
          {
            kind: "stoke",
            value: tuneIntent("signal_jammer", 1, "value", 6),
            hits: tuneIntent("signal_jammer", 1, "hits", 0),
            label: "Signal Surge",
          },
          {
            kind: "attack",
            value: tuneIntent("signal_jammer", 2, "value", 7),
            hits: tuneIntent("signal_jammer", 2, "hits", 1),
            label: "Pulse Shot",
          },
        ],
        eliteIntents: [
          {
            kind: "aim",
            value: tuneIntent("signal_jammer", 0, "value", 5),
            hits: tuneIntent("signal_jammer", 0, "hits", 0),
            label: "Vector Mark",
          },
          {
            kind: "sweep",
            value: tuneIntent("signal_jammer", 3, "value", 8),
            cookTier: tuneIntent("signal_jammer", 3, "cookTier", "fast"),
            width: tuneIntent("signal_jammer", 3, "width", 2),
            label: "Jammer Sweep",
          },
          {
            kind: "attack",
            value: tuneIntent("signal_jammer", 2, "value", 8),
            hits: tuneIntent("signal_jammer", 2, "hits", 1),
            label: "Pulse Shot",
          },
        ],
      },
      rivet_brute: {
        key: "rivet_brute",
        name: "Rivet Brute",
        maxHp: tuneEnemy("rivet_brute", "maxHp", 37),
        icon: "./assets/curated/icons/enemies/05_mechanical-arm.svg",
        intents: [
          {
            kind: "guard",
            value: tuneIntent("rivet_brute", 0, "value", 7),
            hits: tuneIntent("rivet_brute", 0, "hits", 0),
            label: "Rivet Wall",
          },
          {
            kind: "attack",
            value: tuneIntent("rivet_brute", 1, "value", 9),
            hits: tuneIntent("rivet_brute", 1, "hits", 1),
            label: "Pile Driver",
          },
          {
            kind: "sweep",
            value: tuneIntent("rivet_brute", 2, "value", 9),
            cookTier: tuneIntent("rivet_brute", 2, "cookTier", "medium"),
            width: tuneIntent("rivet_brute", 2, "width", 2),
            label: "Rivet Sweep",
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

    const seedBlueprints = createSeedEnemyBlueprints({
      tuneEnemy,
      tuneIntent,
    });

    return {
      ...fallbackBlueprints,
      ...seedBlueprints,
    };
  }

  window.BRASSLINE_ENEMY_CATALOG = {
    createEnemyBlueprints,
  };
})();
