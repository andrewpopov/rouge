(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    ROLE_KEYWORDS,
    ROLE_STATS,
    ELITE_AFFIX_PROFILES,
    ACT_ELITE_PACKAGES,
    buildEliteIntentSet,
    ELITE_MODIFIER_MAP,
    findFamilyOverride,
  } = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA;
  const { TRAIT } = runtimeWindow.__ROUGE_COMBAT_MONSTER_ACTIONS;

  function uniqueById(entries: EnemyPoolEntryRef[]) {
    const seen = new Set();
    return entries.filter((entry: EnemyPoolEntryRef) => {
      if (!entry?.id || seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  function normalizeActPool(seedBundle: SeedBundle, actNumber: number) {
    const poolEntry =
      (Array.isArray(seedBundle?.enemyPools?.enemyPools)
        ? seedBundle.enemyPools.enemyPools.find((entry: EnemyPoolEntry) => entry.act === actNumber)
        : null) || null;

    const merged = [];
    if (Array.isArray(poolEntry?.enemies)) {
      merged.push(...poolEntry.enemies);
    }
    if (Array.isArray(poolEntry?.nativeEnemies)) {
      merged.push(...poolEntry.nativeEnemies);
    }
    if (Array.isArray(poolEntry?.guestEnemiesNightmareHell)) {
      merged.push(...poolEntry.guestEnemiesNightmareHell.slice(0, runtimeWindow.ROUGE_LIMITS.NIGHTMARE_HELL_GUEST_ENEMIES));
    }
    return uniqueById(merged);
  }

  function classifyRole(entry: EnemyPoolEntryRef) {
    // Check family overrides first for role override
    const familyOverride = findFamilyOverride(entry.name);
    if (familyOverride?.roleOverride) {
      return familyOverride.roleOverride;
    }

    const haystack = `${entry.id} ${entry.name}`.toLowerCase();
    if (ROLE_KEYWORDS.support.some((keyword: string) => haystack.includes(keyword))) {
      return "support";
    }
    if (ROLE_KEYWORDS.ranged.some((keyword: string) => haystack.includes(keyword))) {
      return "ranged";
    }
    if (ROLE_KEYWORDS.brute.some((keyword: string) => haystack.includes(keyword))) {
      return "brute";
    }
    return "raider";
  }

  function groupByRole(entries: EnemyPoolEntryRef[]) {
    const grouped: EncounterRegistryGroupedEntries = {
      raider: [],
      ranged: [],
      support: [],
      brute: [],
    };

    entries.forEach((entry: EnemyPoolEntryRef) => {
      (grouped as unknown as Record<string, EnemyPoolEntryRef[]>)[classifyRole(entry)].push(entry);
    });

    const fallback = entries[0] || { id: "fallen", name: "Fallen" };
    Object.keys(grouped).forEach((role) => {
      if ((grouped as unknown as Record<string, EnemyPoolEntryRef[]>)[role].length === 0) {
        (grouped as unknown as Record<string, EnemyPoolEntryRef[]>)[role].push(fallback);
      }
    });
    return grouped;
  }

  function buildScale(actNumber: number, role: string, { elite = false, boss = false } = {}) {
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

    let lifeMultiplier = 1;
    let lifeBonus = 0;
    let attackBonus = 0;
    let guardBonus = 0;
    let healBonus = 0;

    if (actNumber === 1) {
      if (boss) {
        lifeMultiplier = 1;
        lifeBonus = 0;
        attackBonus = 0;
        guardBonus = 0;
      } else if (elite) {
        lifeMultiplier = 1.12;
        lifeBonus = 3;
        attackBonus = 1;
        guardBonus = 1;
      } else {
        lifeMultiplier = 1;
        lifeBonus = 0;
        attackBonus = 0;
        guardBonus = 0;
      }
    } else if (actNumber === 2) {
      if (boss) {
        lifeMultiplier = 1.15;
        lifeBonus = 6;
        attackBonus = 1;
        guardBonus = 1;
      } else if (elite) {
        lifeMultiplier = 1.2;
        lifeBonus = 6;
        attackBonus = 1;
        guardBonus = 1;
      } else {
        lifeMultiplier = 1.1;
        lifeBonus = 3;
        attackBonus = 1;
      }
    } else if (actNumber === 3) {
      if (boss) {
        lifeMultiplier = 1.3;
        lifeBonus = 12;
        attackBonus = 2;
        guardBonus = 1;
        healBonus = 1;
      } else if (elite) {
        lifeMultiplier = 1.55;
        lifeBonus = 18;
        attackBonus = 4;
        guardBonus = 2;
        healBonus = 1;
      } else {
        lifeMultiplier = 1.32;
        lifeBonus = 10;
        attackBonus = 3;
        guardBonus = 1;
        healBonus = 1;
      }
    } else if (actNumber === 4) {
      if (boss) {
        lifeMultiplier = 1.45;
        lifeBonus = 20;
        attackBonus = 3;
        guardBonus = 2;
        healBonus = 1;
      } else if (elite) {
        lifeMultiplier = 1.8;
        lifeBonus = 28;
        attackBonus = 5;
        guardBonus = 3;
        healBonus = 2;
      } else {
        lifeMultiplier = 1.5;
        lifeBonus = 18;
        attackBonus = 4;
        guardBonus = 2;
        healBonus = 1;
      }
    } else if (actNumber >= 5) {
      if (boss) {
        lifeMultiplier = 1.6;
        lifeBonus = 28;
        attackBonus = 4;
        guardBonus = 3;
        healBonus = 2;
      } else if (elite) {
        lifeMultiplier = 2.05;
        lifeBonus = 38;
        attackBonus = 6;
        guardBonus = 4;
        healBonus = 2;
      } else {
        lifeMultiplier = 1.7;
        lifeBonus = 26;
        attackBonus = 5;
        guardBonus = 3;
        healBonus = 2;
      }
    }

    const life = Math.floor((base.life + actNumber * lifeStep + lifeBonus) * lifeMultiplier);
    const attack = base.attack + actNumber * attackStep + attackBonus;
    const guard = (base.guard || 0) + (elite || boss ? actNumber : 0) + guardBonus;
    const heal = (base.heal || 0) + Math.max(0, actNumber - 1) + healBonus;
    return {
      life,
      attack,
      guard,
      heal,
    };
  }

  function buildIntentSet(actNumber: number, role: string, scale: EncounterRegistryEnemyScale, name: string): EnemyIntent[] {
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
          { kind: "heal_allies", label: `${name} Rally Draft`, value: Math.max(4, scale.heal + 1) },
          { kind: "guard_allies", label: `${name} War Blessing`, value: Math.max(4, scale.guard + 2) },
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

  function buildBossIntentSet(actNumber: number, scale: EncounterRegistryEnemyScale, bossName: string, bossId: string): EnemyIntent[] {
    if (bossId === "andariel") {
      return [
        {
          kind: "charge",
          label: `${bossName} Venom Spit`,
          value: scale.attack + 5,
          target: "hero",
          secondaryValue: Math.max(3, scale.guard + 1),
          damageType: "poison",
        },
        { kind: "attack_poison", label: `${bossName} Venom Spit`, value: scale.attack + 5, target: "hero", secondaryValue: 4 },
        { kind: "attack_poison_all", label: `${bossName} Poison Burst`, value: Math.max(4, scale.attack), secondaryValue: 2 },
        { kind: "attack_poison", label: `${bossName} Venom Claw`, value: Math.max(6, scale.attack + 3), target: "hero", secondaryValue: 4 },
      ];
    }
    if (bossId === "duriel") {
      return [
        {
          kind: "charge",
          label: `${bossName} Burrow Charge`,
          value: scale.attack + 6,
          target: "mercenary",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
        { kind: "sunder_attack", label: `${bossName} Burrow Charge`, value: scale.attack + 6, target: "mercenary" },
        { kind: "attack", label: `${bossName} Crushing Pincher`, value: scale.attack + 3, target: "hero" },
        {
          kind: "attack_and_guard",
          label: `${bossName} Shell Ram`,
          value: scale.attack + 4,
          target: "lowest_life",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
      ];
    }
    if (bossId === "mephisto") {
      return [
        {
          kind: "charge",
          label: `${bossName} Lightning Nova`,
          value: scale.attack + 4,
          target: "all_allies",
          secondaryValue: Math.max(4, scale.guard + 1),
          damageType: "lightning",
        },
        { kind: "attack_lightning_all", label: `${bossName} Lightning Nova`, value: scale.attack + 4 },
        { kind: "heal_allies", label: `${bossName} Durance Pact`, value: Math.max(4, scale.heal + 1) },
        { kind: "attack_lightning", label: `${bossName} Soul Bolt`, value: scale.attack + 2, target: "hero" },
      ];
    }
    if (bossId === "diablo") {
      return [
        {
          kind: "charge",
          label: `${bossName} Apocalypse`,
          value: scale.attack + 1,
          target: "all_allies",
          secondaryValue: Math.max(3, scale.guard),
          damageType: "fire",
        },
        { kind: "attack_burn_all", label: `${bossName} Apocalypse`, value: scale.attack + 1, secondaryValue: 2 },
        { kind: "attack_burn", label: `${bossName} Firestorm`, value: scale.attack + 1, target: "hero", secondaryValue: 1 },
        { kind: "sunder_attack", label: `${bossName} Hell Charge`, value: scale.attack + 1, target: "hero" },
      ];
    }
    if (bossId === "baal") {
      return [
        { kind: "teleport", label: `${bossName} Teleport Away`, value: Math.max(5, scale.guard + 3) },
        { kind: "summon_minion", label: `${bossName} Worldstone Call`, value: Math.max(6, scale.attack - 1), secondaryValue: 2, cooldown: 3 },
        {
          kind: "charge",
          label: `${bossName} Rift Burst`,
          value: scale.attack + 5,
          target: "all_allies",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
        { kind: "attack_all", label: `${bossName} Rift Burst`, value: scale.attack + 5 },
        { kind: "heal_and_guard", label: `${bossName} Frozen Host`, value: Math.max(5, scale.heal + 1), secondaryValue: Math.max(6, scale.guard + 2) },
      ];
    }
    if (actNumber === 1) {
      return [
        { kind: "guard_allies", label: `${bossName} Brood Screen`, value: Math.max(4, scale.guard + 1) },
        { kind: "attack_all", label: `${bossName} Poison Spray`, value: Math.max(5, scale.attack - 1) },
        {
          kind: "attack_and_guard",
          label: `${bossName} Nest Rush`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 1),
        },
        { kind: "attack", label: `${bossName} Lunge`, value: scale.attack + 3, target: "lowest_life" },
      ];
    }
    if (actNumber === 2) {
      return [
        { kind: "sunder_attack", label: `${bossName} Burrow Charge`, value: scale.attack + 2, target: "hero" },
        { kind: "guard", label: `${bossName} Carapace`, value: scale.guard + 3 },
        { kind: "attack_all", label: `${bossName} Sand Burst`, value: Math.max(6, scale.attack - 1) },
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
        { kind: "heal_allies", label: `${bossName} Blood Court`, value: Math.max(4, scale.heal) },
        { kind: "guard_allies", label: `${bossName} Court Shield`, value: Math.max(4, scale.guard + 1) },
      ];
    }
    if (actNumber === 4) {
      return [
        { kind: "guard_allies", label: `${bossName} Sanctuary Guard`, value: Math.max(5, scale.guard + 2) },
        { kind: "attack_all", label: `${bossName} Hellfire`, value: Math.max(7, scale.attack + 1) },
        {
          kind: "attack_and_guard",
          label: `${bossName} Ashen Advance`,
          value: scale.attack + 2,
          target: "hero",
          secondaryValue: Math.max(5, scale.guard + 2),
        },
        { kind: "sunder_attack", label: `${bossName} Ruinous Charge`, value: scale.attack + 4, target: "hero" },
      ];
    }
    if (actNumber === 5) {
      return [
        { kind: "attack_all", label: `${bossName} Throne Volley`, value: Math.max(8, scale.attack + 1) },
        { kind: "heal_allies", label: `${bossName} War Host`, value: Math.max(5, scale.heal + 1) },
        {
          kind: "drain_attack",
          label: `${bossName} Essence Theft`,
          value: scale.attack + 2,
          target: "lowest_life",
          secondaryValue: Math.max(5, Math.floor(scale.attack / 2) + 1),
        },
        {
          kind: "heal_and_guard",
          label: `${bossName} Frozen Host`,
          value: Math.max(5, scale.heal + 1),
          secondaryValue: Math.max(6, scale.guard + 2),
        },
      ];
    }

    return [
      { kind: "guard", label: `${bossName} Fortify`, value: scale.guard + 2 },
      { kind: "attack", label: `${bossName} Ruin`, value: scale.attack + 4, target: "hero" },
      { kind: "attack", label: `${bossName} Pursuit`, value: scale.attack + 2, target: "lowest_life" },
    ];
  }

  function getElitePackages(actNumber: number) {
    return ACT_ELITE_PACKAGES[actNumber] || ACT_ELITE_PACKAGES[1];
  }

  function getEliteAffixProfile(profileId: string) {
    return ELITE_AFFIX_PROFILES[profileId] || ELITE_AFFIX_PROFILES.warded;
  }

  function getBossScaleAdjustments(bossId: string) {
    if (bossId === "andariel") {
      return { lifeMultiplier: 1.2, attackBonus: 2, guardBonus: 0, healBonus: 0 };
    }
    if (bossId === "duriel") {
      return { lifeMultiplier: 1.45, attackBonus: 2, guardBonus: 3, healBonus: 0 };
    }
    if (bossId === "mephisto") {
      return { lifeMultiplier: 1.6, attackBonus: 2, guardBonus: 3, healBonus: 1 };
    }
    if (bossId === "diablo") {
      return { lifeMultiplier: 1.8, attackBonus: 0, guardBonus: 1, healBonus: 1 };
    }
    if (bossId === "baal") {
      return { lifeMultiplier: 2.15, attackBonus: 4, guardBonus: 6, healBonus: 2 };
    }
    return { lifeMultiplier: 1.2, attackBonus: 1, guardBonus: 1, healBonus: 0 };
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
  }: {
    actNumber: number;
    entry: EnemyPoolEntryRef;
    role: string;
    variant?: string;
    templateIdSuffix?: string;
    labelPrefix?: string;
    scaleOverride?: EncounterRegistryEnemyScale | null;
    affixes?: string[];
    intents?: EnemyIntent[] | null;
  }) {
    const isElite = variant === "elite";
    const familyOverride = findFamilyOverride(entry.name);
    const effectiveRole = (familyOverride?.roleOverride) || role;
    const scale = scaleOverride || buildScale(actNumber, effectiveRole, { elite: isElite });

    // Apply family stat multipliers
    if (familyOverride) {
      if (familyOverride.lifeMultiplier) {
        scale.life = Math.floor(scale.life * familyOverride.lifeMultiplier);
      }
      if (familyOverride.attackMultiplier) {
        scale.attack = Math.floor(scale.attack * familyOverride.attackMultiplier);
      }
    }

    const name = labelPrefix ? `${labelPrefix} ${entry.name}` : entry.name;
    const suffix = templateIdSuffix || variant;

    // Determine intents: explicit > family override > generic role-based
    let resolvedIntents: EnemyIntent[];
    if (Array.isArray(intents) && intents.length > 0) {
      resolvedIntents = intents;
    } else if (familyOverride?.buildIntents) {
      resolvedIntents = familyOverride.buildIntents(scale, entry.name);
    } else {
      resolvedIntents = buildIntentSet(actNumber, effectiveRole, scale, entry.name);
    }

    return {
      templateId: `act_${actNumber}_${entry.id}_${suffix}`,
      name,
      maxLife: scale.life,
      intents: resolvedIntents.map((intent) => ({ ...intent })),
      role: effectiveRole,
      variant,
      ...(affixes.length > 0 ? { affixes: [...affixes] } : {}),
      ...(familyOverride?.traits && familyOverride.traits.length > 0 ? { traits: [...familyOverride.traits] } : {}),
      ...(familyOverride?.family ? { family: familyOverride.family } : {}),
      ...(familyOverride?.spawnConfig ? { spawnConfig: { ...familyOverride.spawnConfig, traits: [...familyOverride.spawnConfig.traits] } } : {}),
    };
  }

  function buildEliteTemplate({ actNumber, entry, role, profile, templateIdSuffix }: { actNumber: number; entry: EnemyPoolEntryRef; role: string; profile: EncounterRegistryEliteAffixProfile; templateIdSuffix: string }) {
    const baseScale = buildScale(actNumber, role, { elite: true });
    const modifier: MonsterTraitKind | undefined = ELITE_MODIFIER_MAP[profile.id];
    const eliteBaselineLifeBonus = Math.max(4, actNumber * 2);
    const eliteBaselineAttackBonus = Math.max(1, Math.floor((actNumber + 1) / 3));
    const eliteBaselineGuardBonus = 1;
    let elitePressureLifeMultiplier = 1;
    let elitePressureLifeBonus = 0;
    let elitePressureAttackBonus = 0;
    let elitePressureGuardBonus = 0;
    let elitePressureHealBonus = 0;

    if (actNumber === 3) {
      elitePressureLifeMultiplier = 1.15;
      elitePressureLifeBonus = 8;
      elitePressureAttackBonus = 2;
      elitePressureGuardBonus = 1;
    } else if (actNumber === 4) {
      elitePressureLifeMultiplier = 1.25;
      elitePressureLifeBonus = 14;
      elitePressureAttackBonus = 3;
      elitePressureGuardBonus = 2;
      elitePressureHealBonus = 1;
    } else if (actNumber >= 5) {
      elitePressureLifeMultiplier = 1.4;
      elitePressureLifeBonus = 20;
      elitePressureAttackBonus = 4;
      elitePressureGuardBonus = 2;
      elitePressureHealBonus = 1;
    }

    const baseEliteLife =
      baseScale.life +
      profile.lifeBonus +
      eliteBaselineLifeBonus +
      elitePressureLifeBonus +
      (modifier === TRAIT.STONE_SKIN ? Math.floor((baseScale.life + profile.lifeBonus + eliteBaselineLifeBonus) * 0.5) : 0);
    const eliteScale = {
      life: Math.floor(baseEliteLife * elitePressureLifeMultiplier),
      attack: baseScale.attack + profile.attackBonus + eliteBaselineAttackBonus + elitePressureAttackBonus,
      guard: baseScale.guard + profile.guardBonus + eliteBaselineGuardBonus + elitePressureGuardBonus,
      heal: baseScale.heal + (role === "support" ? 1 : 0) + elitePressureHealBonus,
    };

    const template = buildEnemyTemplate({
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

    if (modifier) {
      const existingTraits: MonsterTraitKind[] = Array.isArray(template.traits) ? template.traits : [];
      template.traits = [...existingTraits, modifier];
    }

    return template;
  }

  function buildBossTemplate({ actNumber, actSeed, bossEntry }: { actNumber: number; actSeed: ActSeed; bossEntry: BossEntry }) {
    const scale = buildScale(actNumber, "boss", { boss: true });
    const bossId = bossEntry?.id || actSeed.boss.id;
    const adjustments = getBossScaleAdjustments(bossId);
    const bossScale = {
      life: Math.floor((scale.life + 12 + actNumber * 4) * adjustments.lifeMultiplier),
      attack: scale.attack + 1 + adjustments.attackBonus,
      guard: scale.guard + 1 + adjustments.guardBonus,
      heal: scale.heal + 1 + adjustments.healBonus,
    };
    const bossName = bossEntry?.name || actSeed.boss.name;
    return {
      templateId: `act_${actNumber}_${actSeed.boss.id}_boss`,
      name: bossName,
      maxLife: bossScale.life,
      intents: buildBossIntentSet(actNumber, bossScale, bossName, bossId),
      role: "boss",
      variant: "boss",
    };
  }

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS = {
    normalizeActPool,
    groupByRole,
    getElitePackages,
    getEliteAffixProfile,
    buildEnemyTemplate,
    buildEliteTemplate,
    buildBossTemplate,
  };
})();
