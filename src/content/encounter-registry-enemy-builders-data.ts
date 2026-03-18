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

  function buildEliteIntentSet(profile: EncounterRegistryEliteAffixProfile, scale: EncounterRegistryEnemyScale, name: string): EnemyIntent[] {
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

  const ELITE_MODIFIER_MAP: Record<string, MonsterTraitKind> = {
    warded: "stone_skin",
    huntsman: "extra_fast",
    gravebound: "cursed",
    blackarrow: "extra_strong",
    rampaging: "extra_fast",
    dunebound: "stone_skin",
    sunscorched: "fire_enchanted",
    sandwarden: "stone_skin",
    vampiric: "mana_burn",
    hexbound: "cursed",
    fetid: "cold_enchanted",
    bloodpriest: "cursed",
    hellforged: "fire_enchanted",
    tormentor: "lightning_enchanted",
    cinderlord: "fire_enchanted",
    doomtide: "extra_strong",
    warcaller: "extra_strong",
    frostbound: "cold_enchanted",
    stormbanner: "lightning_enchanted",
    icevein: "cold_enchanted",
  };

  const monsterFamilies = runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_MONSTER_FAMILIES;

  runtimeWindow.ROUGE_ENCOUNTER_REGISTRY_ENEMY_BUILDERS_DATA = {
    ROLE_KEYWORDS,
    ROLE_STATS,
    ELITE_AFFIX_PROFILES,
    ACT_ELITE_PACKAGES,
    buildEliteIntentSet,
    ELITE_MODIFIER_MAP,
    MONSTER_FAMILY_OVERRIDES: monsterFamilies.MONSTER_FAMILY_OVERRIDES,
    findFamilyOverride: monsterFamilies.findFamilyOverride,
  };
})();

