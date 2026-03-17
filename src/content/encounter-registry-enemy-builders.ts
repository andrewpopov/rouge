(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    ROLE_KEYWORDS,
    ROLE_STATS,
    ELITE_AFFIX_PROFILES,
    ACT_ELITE_PACKAGES,
    buildEliteIntentSet,
  } = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA;

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

  function buildBossIntentSet(actNumber: number, scale: EncounterRegistryEnemyScale, bossName: string): EnemyIntent[] {
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

  function buildEliteTemplate({ actNumber, entry, role, profile, templateIdSuffix }: { actNumber: number; entry: EnemyPoolEntryRef; role: string; profile: EncounterRegistryEliteAffixProfile; templateIdSuffix: string }) {
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

  function buildBossTemplate({ actNumber, actSeed, bossEntry }: { actNumber: number; actSeed: ActSeed; bossEntry: BossEntry }) {
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
