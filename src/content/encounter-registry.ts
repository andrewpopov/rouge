(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ROLE_KEYWORDS = {
    support: ["shaman", "priest", "mummy", "sarcophagus", "spire", "tower", "nest", "healer", "mage"],
    ranged: ["archer", "slinger", "hawk", "mosquito", "imp", "succubus", "willowisp", "vulture", "flying", "catapult"],
    brute: ["knight", "hulk", "mauler", "beast", "horror", "lord", "overseer", "megademon", "viper", "raider", "goatman", "brute"],
  };

  const ROLE_STATS = {
    raider: { life: 12, attack: 4 },
    ranged: { life: 10, attack: 5 },
    support: { life: 11, attack: 3, heal: 4 },
    brute: { life: 18, attack: 6, guard: 4 },
    boss: { life: 38, attack: 9, guard: 6, heal: 6 },
  };

  const ELITE_AFFIX_PROFILES = {
    warded: { id: "warded", label: "Warded", lifeBonus: 4, attackBonus: 0, guardBonus: 2 },
    huntsman: { id: "huntsman", label: "Huntsman", lifeBonus: 2, attackBonus: 2, guardBonus: 1 },
    rampaging: { id: "rampaging", label: "Rampaging", lifeBonus: 2, attackBonus: 2, guardBonus: 0 },
    dunebound: { id: "dunebound", label: "Dunebound", lifeBonus: 3, attackBonus: 1, guardBonus: 1 },
    vampiric: { id: "vampiric", label: "Vampiric", lifeBonus: 4, attackBonus: 1, guardBonus: 1 },
    hexbound: { id: "hexbound", label: "Hexbound", lifeBonus: 2, attackBonus: 2, guardBonus: 1 },
    hellforged: { id: "hellforged", label: "Hellforged", lifeBonus: 4, attackBonus: 2, guardBonus: 2 },
    tormentor: { id: "tormentor", label: "Tormentor", lifeBonus: 3, attackBonus: 2, guardBonus: 0 },
    warcaller: { id: "warcaller", label: "Warcaller", lifeBonus: 2, attackBonus: 1, guardBonus: 2 },
    frostbound: { id: "frostbound", label: "Frostbound", lifeBonus: 3, attackBonus: 1, guardBonus: 2 },
  };

  const ACT_ELITE_PACKAGES = {
    1: [
      { profileId: "warded", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "huntsman", role: "ranged", entryIndex: 1, templateIdSuffix: "elite_huntsman" },
    ],
    2: [
      { profileId: "rampaging", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "dunebound", role: "support", entryIndex: 1, templateIdSuffix: "elite_dunebound" },
    ],
    3: [
      { profileId: "vampiric", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "hexbound", role: "support", entryIndex: 1, templateIdSuffix: "elite_hexbound" },
    ],
    4: [
      { profileId: "hellforged", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "tormentor", role: "ranged", entryIndex: 1, templateIdSuffix: "elite_tormentor" },
    ],
    5: [
      { profileId: "warcaller", role: "support", entryIndex: 1, templateIdSuffix: "elite" },
      { profileId: "frostbound", role: "brute", entryIndex: 2, templateIdSuffix: "elite_frostbound" },
    ],
  };

  const ACT_FLAVOR = {
    1: {
      openingLabel: "Wilderness",
      branchBattleLabel: "Monastery",
      branchMinibossLabel: "Burial Grounds",
      bossLabel: "Catacomb",
      openingDescription: "Rogue-outskirts skirmishes with shamans, raiders, and first ranged pressure.",
      branchBattleDescription: "Disciplined cult and monastery pressure with tougher fronts and ranged cover.",
      branchMinibossDescription: "Elite graveyard pressure led by a champion and support backline.",
      bossDescription: "Andariel's guard line and poison-heavy boss pressure.",
      bossAdds: ["brute", "support"],
    },
    2: {
      openingLabel: "Desert",
      branchBattleLabel: "Tomb",
      branchMinibossLabel: "Palace",
      bossLabel: "Duriel Chamber",
      openingDescription: "Open-desert swarms and ranged harassment with faster battlefield pressure.",
      branchBattleDescription: "Crypt and tomb pressure with mummies, brood enemies, and ranged chip damage.",
      branchMinibossDescription: "Palace-adjacent elite defenders backed by reviver-style support.",
      bossDescription: "Duriel's chamber closes around heavy bruisers and relentless boss hits.",
      bossAdds: ["support", "ranged"],
    },
    3: {
      openingLabel: "Jungle",
      branchBattleLabel: "Temple",
      branchMinibossLabel: "Kurast",
      bossLabel: "Durance",
      openingDescription: "Jungle packs swarm with quick attackers, priests, and irregular ranged fire.",
      branchBattleDescription: "Temple and causeway fights lean into cultists, priests, and bruiser escorts.",
      branchMinibossDescription: "Kurast branch encounters feature stronger elites with priest support.",
      bossDescription: "Mephisto's court mixes spell pressure and disciplined support around the act boss.",
      bossAdds: ["support", "ranged"],
    },
    4: {
      openingLabel: "Outer Hell",
      branchBattleLabel: "Infernal Route",
      branchMinibossLabel: "Citadel",
      bossLabel: "Chaos Sanctuary",
      openingDescription: "Hellfield skirmishes escalate immediately into harder-hitting demonic packs.",
      branchBattleDescription: "Infernal route battles favor durable demons, ranged punishment, and attrition.",
      branchMinibossDescription: "Citadel defenders revolve around elite bruisers and spell-support backlines.",
      bossDescription: "Chaos Sanctuary battles center on Diablo's escort pressure and brutal follow-up hits.",
      bossAdds: ["brute", "support"],
    },
    5: {
      openingLabel: "Siege Front",
      branchBattleLabel: "Frozen Pass",
      branchMinibossLabel: "Worldstone Approach",
      bossLabel: "Worldstone",
      openingDescription: "Act V opens with siege pressure, ranged volleys, and heavier frontline enemies.",
      branchBattleDescription: "Frozen routes mix durable beasts, ranged chip, and attrition pressure.",
      branchMinibossDescription: "Worldstone approach encounters feature elite guardians and layered support.",
      bossDescription: "Baal's throne and chamber battles build around escorts, ranged punishment, and boss spike turns.",
      bossAdds: ["brute", "ranged"],
    },
  };

  function uniqueById(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
      if (!entry?.id || seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  function normalizeActPool(seedBundle, actNumber) {
    const poolEntry =
      (Array.isArray(seedBundle?.enemyPools?.enemyPools)
        ? seedBundle.enemyPools.enemyPools.find((entry) => entry.act === actNumber)
        : null) || null;

    const merged = [];
    if (Array.isArray(poolEntry?.enemies)) {
      merged.push(...poolEntry.enemies);
    }
    if (Array.isArray(poolEntry?.nativeEnemies)) {
      merged.push(...poolEntry.nativeEnemies);
    }
    if (Array.isArray(poolEntry?.guestEnemiesNightmareHell)) {
      merged.push(...poolEntry.guestEnemiesNightmareHell.slice(0, 6));
    }
    return uniqueById(merged);
  }

  function classifyRole(entry) {
    const haystack = `${entry.id} ${entry.name}`.toLowerCase();
    if (ROLE_KEYWORDS.support.some((keyword) => haystack.includes(keyword))) {
      return "support";
    }
    if (ROLE_KEYWORDS.ranged.some((keyword) => haystack.includes(keyword))) {
      return "ranged";
    }
    if (ROLE_KEYWORDS.brute.some((keyword) => haystack.includes(keyword))) {
      return "brute";
    }
    return "raider";
  }

  function groupByRole(entries) {
    const grouped = {
      raider: [],
      ranged: [],
      support: [],
      brute: [],
    };

    entries.forEach((entry) => {
      grouped[classifyRole(entry)].push(entry);
    });

    const fallback = entries[0] || { id: "fallen", name: "Fallen" };
    Object.keys(grouped).forEach((role) => {
      if (grouped[role].length === 0) {
        grouped[role].push(fallback);
      }
    });
    return grouped;
  }

  function buildScale(actNumber, role, { elite = false, boss = false } = {}) {
    const base = ROLE_STATS[role];
    let lifeStep = 6;
    let attackStep = 1;

    if (boss) {
      lifeStep = 18;
      attackStep = 4;
    } else if (elite) {
      lifeStep = 10;
      attackStep = 2;
    }

    const life = base.life + actNumber * lifeStep;
    const attack = base.attack + actNumber * attackStep;
    const guard = (base.guard || 0) + (elite || boss ? actNumber : 0);
    const heal = (base.heal || 0) + Math.max(0, actNumber - 1);
    return {
      life,
      attack,
      guard,
      heal,
    };
  }

  function buildIntentSet(actNumber, role, scale, name) {
    if (role === "support") {
      if (actNumber === 2) {
        return [
          { kind: "guard_allies", label: `${name} Sand Prayer`, value: Math.max(3, scale.guard + 1) },
          { kind: "heal_ally", label: `${name} Waterskin Rite`, value: scale.heal + 1 },
        ];
      }
      if (actNumber === 3) {
        return [
          { kind: "heal_ally", label: `${name} Fetish Rite`, value: scale.heal + 1 },
          { kind: "attack_all", label: `${name} Venom Chant`, value: Math.max(4, scale.attack - 1) },
        ];
      }
      if (actNumber === 4) {
        return [
          { kind: "guard_allies", label: `${name} Hell Ward`, value: Math.max(4, scale.guard + 1) },
          { kind: "attack", label: `${name} Cinder Hex`, value: scale.attack + 1, target: "hero" },
        ];
      }
      if (actNumber >= 5) {
        return [
          { kind: "guard_allies", label: `${name} War Blessing`, value: Math.max(4, scale.guard + 2) },
          { kind: "heal_ally", label: `${name} Rally Draft`, value: scale.heal + 1 },
        ];
      }
      return [
        { kind: "heal_ally", label: `${name} Rite`, value: scale.heal },
        { kind: "attack", label: `${name} Hex`, value: scale.attack, target: "hero" },
      ];
    }
    if (role === "ranged") {
      if (actNumber === 2) {
        return [
          { kind: "attack_all", label: `${name} Dust Volley`, value: Math.max(4, scale.attack - 1) },
          { kind: "attack", label: `${name} Shot`, value: scale.attack, target: "hero" },
        ];
      }
      if (actNumber === 3) {
        return [
          { kind: "attack", label: `${name} Needle Shot`, value: scale.attack + 1, target: "lowest_life" },
          { kind: "attack_all", label: `${name} Dart Rain`, value: Math.max(4, scale.attack - 1) },
        ];
      }
      if (actNumber === 4) {
        return [
          { kind: "attack_all", label: `${name} Hell Volley`, value: Math.max(5, scale.attack) },
          { kind: "attack", label: `${name} Punisher Bolt`, value: scale.attack + 1, target: "lowest_life" },
        ];
      }
      if (actNumber >= 5) {
        return [
          { kind: "attack_all", label: `${name} Siege Volley`, value: Math.max(5, scale.attack) },
          { kind: "attack", label: `${name} Ice Shot`, value: scale.attack + 1, target: "hero" },
        ];
      }
      return [
        { kind: "attack", label: `${name} Volley`, value: scale.attack + 1, target: "lowest_life" },
        { kind: "attack", label: `${name} Shot`, value: scale.attack, target: "hero" },
      ];
    }
    if (role === "brute") {
      if (actNumber === 2) {
        return [
          { kind: "sunder_attack", label: `${name} Tomb Ram`, value: scale.attack + 1, target: "hero" },
          { kind: "attack", label: `${name} Crush`, value: scale.attack + 2, target: "hero" },
        ];
      }
      if (actNumber === 3) {
        return [
          { kind: "guard", label: `${name} Brace`, value: scale.guard + 1 },
          {
            kind: "attack_and_guard",
            label: `${name} River Slam`,
            value: scale.attack + 1,
            target: "hero",
            secondaryValue: Math.max(3, scale.guard + 1),
          },
        ];
      }
      if (actNumber === 4) {
        return [
          { kind: "guard", label: `${name} Iron Hide`, value: scale.guard + 1 },
          { kind: "sunder_attack", label: `${name} Breaker`, value: scale.attack + 2, target: "hero" },
        ];
      }
      if (actNumber >= 5) {
        return [
          {
            kind: "attack_and_guard",
            label: `${name} Avalanche Rush`,
            value: scale.attack + 1,
            target: "hero",
            secondaryValue: Math.max(4, scale.guard + 2),
          },
          { kind: "attack", label: `${name} Maul`, value: scale.attack + 2, target: "hero" },
        ];
      }
      return [
        { kind: "guard", label: `${name} Brace`, value: scale.guard },
        { kind: "attack", label: `${name} Smash`, value: scale.attack + 2, target: "hero" },
      ];
    }
    if (actNumber === 3) {
      return [
        {
          kind: "attack_and_guard",
          label: `${name} Knife Rush`,
          value: scale.attack,
          target: "hero",
          secondaryValue: Math.max(2, scale.guard + 1),
        },
        { kind: "attack", label: `${name} Cut`, value: scale.attack + 1, target: "lowest_life" },
      ];
    }
    if (actNumber === 4) {
      return [
        { kind: "attack", label: `${name} Rend`, value: scale.attack + 1, target: "hero" },
        { kind: "sunder_attack", label: `${name} Rupture`, value: scale.attack + 1, target: "hero" },
      ];
    }
    if (actNumber >= 5) {
      return [
        { kind: "attack_all", label: `${name} Snow Sweep`, value: Math.max(4, scale.attack - 1) },
        {
          kind: "attack_and_guard",
          label: `${name} Crest Rush`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(3, scale.guard + 1),
        },
      ];
    }
    return [
      { kind: "attack", label: `${name} Strike`, value: scale.attack, target: "hero" },
      { kind: "guard", label: `${name} Scramble`, value: Math.max(2, scale.guard || 2) },
    ];
  }

  function buildBossIntentSet(actNumber, scale, bossName) {
    if (actNumber === 1) {
      return [
        { kind: "guard_allies", label: `${bossName} Brood Screen`, value: Math.max(4, scale.guard + 1) },
        { kind: "attack_all", label: `${bossName} Poison Spray`, value: Math.max(5, scale.attack - 1) },
        { kind: "attack", label: `${bossName} Lunge`, value: scale.attack + 3, target: "lowest_life" },
      ];
    }
    if (actNumber === 2) {
      return [
        { kind: "sunder_attack", label: `${bossName} Burrow Charge`, value: scale.attack + 2, target: "hero" },
        { kind: "guard", label: `${bossName} Carapace`, value: scale.guard + 3 },
        { kind: "attack", label: `${bossName} Crusher`, value: scale.attack + 4, target: "hero" },
      ];
    }
    if (actNumber === 3) {
      return [
        {
          kind: "drain_attack",
          label: `${bossName} Siphon`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, Math.floor(scale.attack / 2)),
        },
        { kind: "attack_all", label: `${bossName} Hatred Orb`, value: Math.max(6, scale.attack - 1) },
        { kind: "guard_allies", label: `${bossName} Court Shield`, value: Math.max(4, scale.guard + 1) },
      ];
    }
    if (actNumber === 4) {
      return [
        { kind: "guard_allies", label: `${bossName} Sanctuary Guard`, value: Math.max(5, scale.guard + 2) },
        { kind: "attack_all", label: `${bossName} Hellfire`, value: Math.max(7, scale.attack + 1) },
        { kind: "sunder_attack", label: `${bossName} Ruinous Charge`, value: scale.attack + 4, target: "hero" },
      ];
    }
    if (actNumber === 5) {
      return [
        { kind: "attack_all", label: `${bossName} Throne Volley`, value: Math.max(8, scale.attack + 1) },
        {
          kind: "drain_attack",
          label: `${bossName} Essence Theft`,
          value: scale.attack + 2,
          target: "lowest_life",
          secondaryValue: Math.max(5, Math.floor(scale.attack / 2) + 1),
        },
        { kind: "guard_allies", label: `${bossName} War Host`, value: Math.max(6, scale.guard + 2) },
      ];
    }

    return [
      { kind: "guard", label: `${bossName} Fortify`, value: scale.guard + 2 },
      { kind: "attack", label: `${bossName} Ruin`, value: scale.attack + 4, target: "hero" },
      { kind: "attack", label: `${bossName} Pursuit`, value: scale.attack + 2, target: "lowest_life" },
    ];
  }

  function getElitePackages(actNumber) {
    return ACT_ELITE_PACKAGES[actNumber] || ACT_ELITE_PACKAGES[1];
  }

  function buildEliteIntentSet(profile, scale, name) {
    if (profile.id === "warded") {
      return [
        { kind: "guard_allies", label: `${name} Ward`, value: Math.max(4, scale.guard + 1) },
        {
          kind: "attack_and_guard",
          label: `${name} Shield Rush`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(3, scale.guard + 2),
        },
      ];
    }
    if (profile.id === "rampaging") {
      return [
        { kind: "attack_all", label: `${name} Sandstorm`, value: Math.max(5, scale.attack) },
        { kind: "attack", label: `${name} Gore Charge`, value: scale.attack + 3, target: "lowest_life" },
      ];
    }
    if (profile.id === "huntsman") {
      return [
        { kind: "attack", label: `${name} Track Shot`, value: scale.attack + 2, target: "lowest_life" },
        {
          kind: "attack_and_guard",
          label: `${name} Blindside`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(3, scale.guard + 1),
        },
      ];
    }
    if (profile.id === "dunebound") {
      return [
        { kind: "guard_allies", label: `${name} Dust Screen`, value: Math.max(4, scale.guard + 1) },
        { kind: "attack_all", label: `${name} Sand Lash`, value: Math.max(5, scale.attack - 1) },
      ];
    }
    if (profile.id === "vampiric") {
      return [
        {
          kind: "drain_attack",
          label: `${name} Blood Feast`,
          value: scale.attack + 1,
          target: "lowest_life",
          secondaryValue: Math.max(4, Math.floor(scale.attack / 2)),
        },
        { kind: "guard", label: `${name} Shade Hide`, value: Math.max(3, scale.guard + 1) },
      ];
    }
    if (profile.id === "hexbound") {
      return [
        {
          kind: "drain_attack",
          label: `${name} Hex Leech`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, Math.floor(scale.attack / 2)),
        },
        { kind: "guard_allies", label: `${name} Spirit Ward`, value: Math.max(4, scale.guard + 1) },
      ];
    }
    if (profile.id === "hellforged") {
      return [
        { kind: "sunder_attack", label: `${name} Forge Break`, value: scale.attack + 3, target: "hero" },
        {
          kind: "attack_and_guard",
          label: `${name} Ember Plate`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
      ];
    }
    if (profile.id === "tormentor") {
      return [
        { kind: "attack_all", label: `${name} Torment Wave`, value: Math.max(6, scale.attack) },
        { kind: "sunder_attack", label: `${name} Rupture Pike`, value: scale.attack + 2, target: "lowest_life" },
      ];
    }
    if (profile.id === "frostbound") {
      return [
        {
          kind: "attack_and_guard",
          label: `${name} Frost Ram`,
          value: scale.attack + 2,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
        { kind: "attack_all", label: `${name} Whiteout`, value: Math.max(6, scale.attack) },
      ];
    }
    return [
      { kind: "guard_allies", label: `${name} War Cry`, value: Math.max(5, scale.guard + 2) },
      { kind: "attack_all", label: `${name} Avalanche`, value: Math.max(6, scale.attack) },
    ];
  }

  function buildEnemyTemplate({
    actNumber,
    entry,
    role,
    variant = "base",
    templateIdSuffix = "",
    labelPrefix = "",
    scaleOverride = null,
    affixes = [],
    intents = null,
  }) {
    const isElite = variant === "elite";
    const scale = scaleOverride || buildScale(actNumber, role, { elite: isElite });
    const name = labelPrefix ? `${labelPrefix} ${entry.name}` : entry.name;
    const suffix = templateIdSuffix || variant;
    return {
      templateId: `act_${actNumber}_${entry.id}_${suffix}`,
      name,
      maxLife: scale.life,
      intents:
        (Array.isArray(intents) && intents.length > 0 ? intents : buildIntentSet(actNumber, role, scale, entry.name)).map((intent) => ({
          ...intent,
        })),
      role,
      variant,
      ...(affixes.length > 0 ? { affixes: [...affixes] } : {}),
    };
  }

  function buildEliteTemplate({ actNumber, entry, role, profile, templateIdSuffix }) {
    const baseScale = buildScale(actNumber, role, { elite: true });
    const eliteScale = {
      life: baseScale.life + profile.lifeBonus,
      attack: baseScale.attack + profile.attackBonus,
      guard: baseScale.guard + profile.guardBonus,
      heal: baseScale.heal,
    };

    return buildEnemyTemplate({
      actNumber,
      entry,
      role,
      variant: "elite",
      templateIdSuffix,
      labelPrefix: profile.label,
      scaleOverride: eliteScale,
      affixes: [profile.id],
      intents: buildEliteIntentSet(profile, eliteScale, entry.name),
    });
  }

  function buildBossTemplate({ actNumber, actSeed, bossEntry }) {
    const scale = buildScale(actNumber, "boss", { boss: true });
    const bossName = bossEntry?.name || actSeed.boss.name;
    return {
      templateId: `act_${actNumber}_${actSeed.boss.id}_boss`,
      name: bossName,
      maxLife: scale.life,
      intents: buildBossIntentSet(actNumber, scale, bossName),
      role: "boss",
      variant: "boss",
    };
  }

  function getFlavor(actNumber) {
    return ACT_FLAVOR[actNumber] || ACT_FLAVOR[1];
  }

  function pickEntry(entries, index, fallback) {
    if (Array.isArray(entries) && entries.length > 0) {
      return entries[index % entries.length];
    }
    return fallback;
  }

  function pickEscortTemplate(role, rangedTemplateId, supportTemplateId, bruteTemplateId) {
    if (role === "ranged") {
      return rangedTemplateId;
    }
    if (role === "support") {
      return supportTemplateId;
    }
    return bruteTemplateId;
  }

  function makeEncounter(id, name, description, enemyTemplateIds) {
    return {
      id,
      name,
      description,
      enemies: enemyTemplateIds.map((templateId, index) => ({
        id: `${id}_enemy_${index + 1}`,
        templateId,
      })),
    };
  }

  function buildActEncounterSet({ actSeed, bossEntry, groupedEntries }) {
    const actNumber = actSeed.act;
    const flavor = getFlavor(actNumber);
    const raiderA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.raider, 0, groupedEntries.raider[0]), role: "raider" });
    const raiderB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.raider, 1, groupedEntries.raider[0]),
      role: "raider",
      variant: "alt",
    });
    const rangedA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.ranged, 0, groupedEntries.ranged[0]), role: "ranged" });
    const rangedB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.ranged, 1, groupedEntries.ranged[0]),
      role: "ranged",
      variant: "alt",
    });
    const supportA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.support, 0, groupedEntries.support[0]), role: "support" });
    const supportB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.support, 1, groupedEntries.support[0]),
      role: "support",
      variant: "alt",
    });
    const bruteA = buildEnemyTemplate({ actNumber, entry: pickEntry(groupedEntries.brute, 0, groupedEntries.brute[0]), role: "brute" });
    const bruteB = buildEnemyTemplate({
      actNumber,
      entry: pickEntry(groupedEntries.brute, 1, groupedEntries.brute[0]),
      role: "brute",
      variant: "alt",
    });
    const [elitePackageA, elitePackageB] = getElitePackages(actNumber);
    const eliteA = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageA.role], elitePackageA.entryIndex, groupedEntries[elitePackageA.role][0]),
      role: elitePackageA.role,
      profile: ELITE_AFFIX_PROFILES[elitePackageA.profileId],
      templateIdSuffix: elitePackageA.templateIdSuffix,
    });
    const eliteB = buildEliteTemplate({
      actNumber,
      entry: pickEntry(groupedEntries[elitePackageB.role], elitePackageB.entryIndex, groupedEntries[elitePackageB.role][0]),
      role: elitePackageB.role,
      profile: ELITE_AFFIX_PROFILES[elitePackageB.profileId],
      templateIdSuffix: elitePackageB.templateIdSuffix,
    });
    const bossA = buildBossTemplate({ actNumber, actSeed, bossEntry });

    const enemyTemplates = [raiderA, raiderB, rangedA, rangedB, supportA, supportB, bruteA, bruteB, eliteA, eliteB, bossA];
    const enemyCatalog = Object.fromEntries(enemyTemplates.map((template) => [template.templateId, template]));

    const openingIds = [
      `act_${actNumber}_opening_skirmish`,
      `act_${actNumber}_opening_pressure`,
      `act_${actNumber}_opening_horde`,
    ];
    const branchBattleIds = [
      `act_${actNumber}_branch_battle`,
      `act_${actNumber}_branch_ambush`,
    ];
    const branchMinibossId = `act_${actNumber}_branch_miniboss`;
    const bossId = `act_${actNumber}_boss`;
    const bossAddIds = flavor.bossAdds || ["brute", "support"];
    const bossEscortTwo = pickEscortTemplate(bossAddIds[1] || bossAddIds[0], rangedA.templateId, supportA.templateId, bruteA.templateId);
    const bossEnemyTemplateIds =
      actNumber >= 4 ? [bossA.templateId, eliteA.templateId, eliteB.templateId] : [bossA.templateId, eliteB.templateId, bossEscortTwo];

    const encounterCatalog = {
      [openingIds[0]]: makeEncounter(
        openingIds[0],
        `${flavor.openingLabel} Skirmish`,
        flavor.openingDescription,
        [raiderA.templateId, raiderB.templateId, supportA.templateId]
      ),
      [openingIds[1]]: makeEncounter(
        openingIds[1],
        `${flavor.openingLabel} Pressure Pack`,
        `${flavor.openingDescription} The ranged line forces tighter target priority.`,
        [raiderA.templateId, rangedA.templateId, supportA.templateId]
      ),
      [openingIds[2]]: makeEncounter(
        openingIds[2],
        `${flavor.openingLabel} Horde`,
        `${flavor.openingDescription} The pack density is higher, so area zones take more repeated clears.`,
        [raiderA.templateId, raiderB.templateId, rangedA.templateId, supportA.templateId]
      ),
      [branchBattleIds[0]]: makeEncounter(
        branchBattleIds[0],
        `${flavor.branchBattleLabel} Hold`,
        flavor.branchBattleDescription,
        [bruteA.templateId, rangedA.templateId, supportA.templateId]
      ),
      [branchBattleIds[1]]: makeEncounter(
        branchBattleIds[1],
        `${flavor.branchBattleLabel} Ambush`,
        `${flavor.branchBattleDescription} This branch leans harder on ranged pressure and guarded fronts.`,
        [eliteB.templateId, rangedA.templateId, rangedB.templateId]
      ),
      [branchMinibossId]: makeEncounter(
        branchMinibossId,
        `${flavor.branchMinibossLabel} Champion`,
        flavor.branchMinibossDescription,
        actNumber >= 3 ? [eliteA.templateId, eliteB.templateId, supportB.templateId] : [eliteA.templateId, supportB.templateId, bruteA.templateId]
      ),
      [bossId]: makeEncounter(
        bossId,
        actSeed.boss.name,
        flavor.bossDescription,
        bossEnemyTemplateIds
      ),
    };

    return {
      enemyCatalog,
      encounterCatalog,
      encounterIdsByKind: {
        opening: openingIds,
        branchBattle: branchBattleIds,
        branchMiniboss: [branchMinibossId],
        boss: [bossId],
      },
    };
  }

  function createRuntimeContent(baseContent, seedBundle) {
    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidSeedBundle(seedBundle);

    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const generatedEnemyCatalog = {};
    const generatedEncounterCatalog = {};
    const generatedActEncounterIds = {};

    acts.forEach((actSeed) => {
      const poolEntries = normalizeActPool(seedBundle, actSeed.act);
      const groupedEntries = groupByRole(poolEntries);
      const bossEntry = bossEntries.find((entry) => entry.id === actSeed.boss.id) || null;
      const actContent = buildActEncounterSet({
        actSeed,
        bossEntry,
        groupedEntries,
      });
      Object.assign(generatedEnemyCatalog, actContent.enemyCatalog);
      Object.assign(generatedEncounterCatalog, actContent.encounterCatalog);
      generatedActEncounterIds[actSeed.act] = actContent.encounterIdsByKind;
    });

    const runtimeContent = {
      ...baseContent,
      enemyCatalog: {
        ...baseContent.enemyCatalog,
        ...generatedEnemyCatalog,
      },
      encounterCatalog: {
        ...baseContent.encounterCatalog,
        ...generatedEncounterCatalog,
      },
      generatedActEncounterIds,
    };

    runtimeWindow.ROUGE_CONTENT_VALIDATOR?.assertValidRuntimeContent(runtimeContent);
    return runtimeContent;
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY = {
    createRuntimeContent,
  };
})();
