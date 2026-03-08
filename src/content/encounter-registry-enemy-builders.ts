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
    gravebound: { id: "gravebound", label: "Gravebound", lifeBonus: 3, attackBonus: 1, guardBonus: 2 },
    blackarrow: { id: "blackarrow", label: "Black Arrow", lifeBonus: 2, attackBonus: 3, guardBonus: 1 },
    rampaging: { id: "rampaging", label: "Rampaging", lifeBonus: 2, attackBonus: 2, guardBonus: 0 },
    dunebound: { id: "dunebound", label: "Dunebound", lifeBonus: 3, attackBonus: 1, guardBonus: 1 },
    sunscorched: { id: "sunscorched", label: "Sun-Scorched", lifeBonus: 2, attackBonus: 2, guardBonus: 1 },
    sandwarden: { id: "sandwarden", label: "Sandwarden", lifeBonus: 4, attackBonus: 1, guardBonus: 2 },
    vampiric: { id: "vampiric", label: "Vampiric", lifeBonus: 4, attackBonus: 1, guardBonus: 1 },
    hexbound: { id: "hexbound", label: "Hexbound", lifeBonus: 2, attackBonus: 2, guardBonus: 1 },
    fetid: { id: "fetid", label: "Fetid", lifeBonus: 3, attackBonus: 1, guardBonus: 1 },
    bloodpriest: { id: "bloodpriest", label: "Bloodpriest", lifeBonus: 3, attackBonus: 1, guardBonus: 2 },
    hellforged: { id: "hellforged", label: "Hellforged", lifeBonus: 4, attackBonus: 2, guardBonus: 2 },
    tormentor: { id: "tormentor", label: "Tormentor", lifeBonus: 3, attackBonus: 2, guardBonus: 0 },
    cinderlord: { id: "cinderlord", label: "Cinderlord", lifeBonus: 4, attackBonus: 2, guardBonus: 1 },
    doomtide: { id: "doomtide", label: "Doomtide", lifeBonus: 3, attackBonus: 2, guardBonus: 1 },
    warcaller: { id: "warcaller", label: "Warcaller", lifeBonus: 2, attackBonus: 1, guardBonus: 2 },
    frostbound: { id: "frostbound", label: "Frostbound", lifeBonus: 3, attackBonus: 1, guardBonus: 2 },
    stormbanner: { id: "stormbanner", label: "Stormbanner", lifeBonus: 3, attackBonus: 1, guardBonus: 2 },
    icevein: { id: "icevein", label: "Icevein", lifeBonus: 3, attackBonus: 2, guardBonus: 1 },
  };

  const ACT_ELITE_PACKAGES = {
    1: [
      { profileId: "warded", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "huntsman", role: "ranged", entryIndex: 1, templateIdSuffix: "elite_huntsman" },
      { profileId: "gravebound", role: "support", entryIndex: 0, templateIdSuffix: "elite_gravebound" },
      { profileId: "blackarrow", role: "ranged", entryIndex: 0, templateIdSuffix: "elite_blackarrow" },
    ],
    2: [
      { profileId: "rampaging", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "dunebound", role: "support", entryIndex: 1, templateIdSuffix: "elite_dunebound" },
      { profileId: "sunscorched", role: "ranged", entryIndex: 0, templateIdSuffix: "elite_sunscorched" },
      { profileId: "sandwarden", role: "support", entryIndex: 0, templateIdSuffix: "elite_sandwarden" },
    ],
    3: [
      { profileId: "vampiric", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "hexbound", role: "support", entryIndex: 1, templateIdSuffix: "elite_hexbound" },
      { profileId: "fetid", role: "support", entryIndex: 0, templateIdSuffix: "elite_fetid" },
      { profileId: "bloodpriest", role: "support", entryIndex: 0, templateIdSuffix: "elite_bloodpriest" },
    ],
    4: [
      { profileId: "hellforged", role: "brute", entryIndex: 2, templateIdSuffix: "elite" },
      { profileId: "tormentor", role: "ranged", entryIndex: 1, templateIdSuffix: "elite_tormentor" },
      { profileId: "cinderlord", role: "brute", entryIndex: 0, templateIdSuffix: "elite_cinderlord" },
      { profileId: "doomtide", role: "support", entryIndex: 0, templateIdSuffix: "elite_doomtide" },
    ],
    5: [
      { profileId: "warcaller", role: "support", entryIndex: 1, templateIdSuffix: "elite" },
      { profileId: "frostbound", role: "brute", entryIndex: 2, templateIdSuffix: "elite_frostbound" },
      { profileId: "stormbanner", role: "support", entryIndex: 0, templateIdSuffix: "elite_stormbanner" },
      { profileId: "icevein", role: "ranged", entryIndex: 0, templateIdSuffix: "elite_icevein" },
    ],
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

  function buildBossIntentSet(actNumber, scale, bossName) {
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

  function getElitePackages(actNumber) {
    return ACT_ELITE_PACKAGES[actNumber] || ACT_ELITE_PACKAGES[1];
  }

  function getEliteAffixProfile(profileId) {
    return ELITE_AFFIX_PROFILES[profileId] || ELITE_AFFIX_PROFILES.warded;
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
    if (profile.id === "gravebound") {
      return [
        { kind: "heal_allies", label: `${name} Crypt Choir`, value: Math.max(4, scale.heal) },
        { kind: "attack", label: `${name} Pale Hex`, value: scale.attack + 1, target: "hero" },
      ];
    }
    if (profile.id === "blackarrow") {
      return [
        { kind: "attack_all", label: `${name} Black Rain`, value: Math.max(5, scale.attack) },
        { kind: "attack", label: `${name} Cull Shot`, value: scale.attack + 2, target: "lowest_life" },
      ];
    }
    if (profile.id === "dunebound") {
      return [
        { kind: "guard_allies", label: `${name} Dust Screen`, value: Math.max(4, scale.guard + 1) },
        { kind: "attack_all", label: `${name} Sand Lash`, value: Math.max(5, scale.attack - 1) },
      ];
    }
    if (profile.id === "sunscorched") {
      return [
        { kind: "attack_all", label: `${name} Mirage Volley`, value: Math.max(5, scale.attack) },
        { kind: "sunder_attack", label: `${name} Blinding Shot`, value: scale.attack + 1, target: "lowest_life" },
      ];
    }
    if (profile.id === "sandwarden") {
      return [
        {
          kind: "heal_and_guard",
          label: `${name} Sand Citadel`,
          value: Math.max(4, scale.heal),
          secondaryValue: Math.max(4, scale.guard + 1),
        },
        { kind: "guard_allies", label: `${name} Dune Bulwark`, value: Math.max(4, scale.guard + 1) },
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
    if (profile.id === "fetid") {
      return [
        { kind: "heal_allies", label: `${name} Rot Chant`, value: Math.max(4, scale.heal) },
        {
          kind: "drain_attack",
          label: `${name} Sump Bite`,
          value: scale.attack + 1,
          target: "lowest_life",
          secondaryValue: Math.max(4, Math.floor(scale.attack / 2)),
        },
      ];
    }
    if (profile.id === "bloodpriest") {
      return [
        {
          kind: "heal_and_guard",
          label: `${name} Blood Seal`,
          value: Math.max(4, scale.heal),
          secondaryValue: Math.max(3, scale.guard + 1),
        },
        {
          kind: "drain_attack",
          label: `${name} Vein Lash`,
          value: scale.attack + 1,
          target: "lowest_life",
          secondaryValue: Math.max(4, Math.floor(scale.attack / 2)),
        },
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
    if (profile.id === "cinderlord") {
      return [
        { kind: "attack_all", label: `${name} Ember Collapse`, value: Math.max(6, scale.attack) },
        {
          kind: "attack_and_guard",
          label: `${name} Molten Plating`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
      ];
    }
    if (profile.id === "doomtide") {
      return [
        { kind: "attack_all", label: `${name} Doom Wave`, value: Math.max(6, scale.attack) },
        {
          kind: "heal_and_guard",
          label: `${name} Infernal Litany`,
          value: Math.max(4, scale.heal),
          secondaryValue: Math.max(4, scale.guard + 1),
        },
      ];
    }
    if (profile.id === "warcaller") {
      return [
        { kind: "heal_allies", label: `${name} Rally Chant`, value: Math.max(4, scale.heal + 1) },
        { kind: "attack_all", label: `${name} Avalanche`, value: Math.max(6, scale.attack) },
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
    if (profile.id === "stormbanner") {
      return [
        { kind: "heal_allies", label: `${name} War Drum`, value: Math.max(4, scale.heal + 1) },
        {
          kind: "attack_and_guard",
          label: `${name} Banner Charge`,
          value: scale.attack + 1,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
      ];
    }
    if (profile.id === "icevein") {
      return [
        {
          kind: "attack_and_guard",
          label: `${name} Ice Pike`,
          value: scale.attack + 2,
          target: "hero",
          secondaryValue: Math.max(4, scale.guard + 2),
        },
        { kind: "attack", label: `${name} Freezing Mark`, value: scale.attack + 2, target: "lowest_life" },
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
