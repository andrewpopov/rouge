(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;

  const RARITY = { WHITE: "white", MAGIC: "blue", RARE: "yellow", UNIQUE: "brown", SET: "green" } as const;
  const RARITY_KIND_VALUE_MAP = {
    white: RARITY.WHITE,
    magic: RARITY.MAGIC,
    rare: RARITY.RARE,
    unique: RARITY.UNIQUE,
    set: RARITY.SET,
  } as const;

  const SLOT_FAMILY_DEFAULTS: Record<EquipmentSlot, string> = {
    weapon: "Weapons", armor: "Body Armor", helm: "Helms", shield: "Shields",
    gloves: "Gloves", boots: "Boots", belt: "Belts", ring: "Rings", amulet: "Amulets",
  };

  const WEAPON_ATTACK_PROFILES: Record<string, Record<string, number>> = {
    Swords: { combat_skills: 1, masteries: 1, combat: 2, martial_arts: 2 },
    Maces: { combat_skills: 2, combat: 3, masteries: 3, offensive_auras: 2, defensive_auras: 2, shape_shifting: 3, elemental: 4 },
    Polearms: { combat_skills: 2, javelin: 2 },
    Spears: { combat_skills: 1, javelin: 3 },
    Javelins: { javelin: 3 },
    Bows: { bow: 4 },
    Crossbows: { bow: 3 },
    Wands: { poison_bone: 4 },
    Staves: { fire: 3, cold: 3, lightning: 3, elemental: 4 },
  };

  const WEAPON_SUPPORT_PROFILES: Record<string, Record<string, number>> = {
    Swords: { masteries: 1, warcries: 1, combat: 1, offensive_auras: 1, defensive_auras: 1, shadow: 2, martial_arts: 1 },
    Maces: { combat: 2, combat_skills: 1, masteries: 3, warcries: 3, offensive_auras: 3, defensive_auras: 3, shape_shifting: 3, elemental: 4, summoning: 3 },
    Polearms: { combat_skills: 1, javelin: 1, passive: 1, warcries: 1 },
    Spears: { javelin: 2, passive: 1 },
    Javelins: { javelin: 2, passive: 2 },
    Bows: { bow: 3, passive: 2 },
    Crossbows: { bow: 2, passive: 2 },
    Wands: { poison_bone: 3, curses: 3, summoning: 4 },
    Staves: { fire: 2, cold: 2, lightning: 2, elemental: 4, summoning: 2 },
  };

  const PRIMARY_WEAPON_PROFICIENCY_BY_FAMILY: Record<string, string> = {
    Swords: "combat_skills",
    Maces: "combat",
    Polearms: "combat_skills",
    Spears: "javelin",
    Javelins: "javelin",
    Bows: "bow",
    Crossbows: "bow",
    Wands: "poison_bone",
    Staves: "elemental",
  };

  const WEAPON_DAMAGE_PROFILES: Record<string, WeaponDamageDefinition[]> = {
    Swords: [{ type: "lightning", amount: 1, proficiency: "combat_skills" }],
    Maces: [
      { type: "fire", amount: 3, proficiency: "combat" },
      { type: "fire", amount: 2, proficiency: "elemental" },
    ],
    Polearms: [{ type: "fire", amount: 2, proficiency: "combat_skills" }],
    Spears: [{ type: "cold", amount: 2, proficiency: "javelin" }],
    Javelins: [{ type: "lightning", amount: 2, proficiency: "javelin" }],
    Bows: [{ type: "fire", amount: 3, proficiency: "bow" }],
    Crossbows: [{ type: "cold", amount: 2, proficiency: "bow" }],
    Wands: [{ type: "poison", amount: 4, proficiency: "poison_bone" }],
    Staves: [
      { type: "fire", amount: 3, proficiency: "fire" },
      { type: "cold", amount: 3, proficiency: "cold" },
      { type: "lightning", amount: 3, proficiency: "lightning" },
    ],
  };

  const WEAPON_EFFECT_PROFILES: Record<string, WeaponEffectDefinition[]> = {
    Maces: [
      { kind: "crushing", amount: 3 },
      { kind: "burn", amount: 2, proficiency: "elemental" },
    ],
    Polearms: [{ kind: "slow", amount: 2, proficiency: "combat_skills" }, { kind: "slow", amount: 1, proficiency: "javelin" }],
    Spears: [{ kind: "slow", amount: 2, proficiency: "javelin" }],
    Javelins: [{ kind: "shock", amount: 2, proficiency: "javelin" }],
    Bows: [{ kind: "burn", amount: 3, proficiency: "bow" }],
    Crossbows: [{ kind: "freeze", amount: 2, proficiency: "bow" }],
    Wands: [{ kind: "slow", amount: 2, proficiency: "curses" }],
    Staves: [
      { kind: "burn", amount: 1, proficiency: "fire" },
      { kind: "freeze", amount: 1, proficiency: "cold" },
      { kind: "shock", amount: 1, proficiency: "lightning" },
    ],
  };

  const WEAPON_AFFIX_POOLS = {
    Swords: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "effect", effectKind: "burn" as WeaponEffectKind },
      { kind: "effect", effectKind: "shock" as WeaponEffectKind },
    ],
    Maces: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "effect", effectKind: "crushing" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
    Polearms: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "poison" as WeaponDamageType },
      { kind: "effect", effectKind: "crushing" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
    Spears: [
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
    Javelins: [
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "damage", type: "poison" as WeaponDamageType },
      { kind: "effect", effectKind: "shock" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
    Bows: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "poison" as WeaponDamageType },
      { kind: "effect", effectKind: "burn" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
    Crossbows: [
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
      { kind: "effect", effectKind: "shock" as WeaponEffectKind },
    ],
    Wands: [
      { kind: "damage", type: "poison" as WeaponDamageType },
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
      { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
    ],
    Staves: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "effect", effectKind: "burn" as WeaponEffectKind },
      { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
      { kind: "effect", effectKind: "shock" as WeaponEffectKind },
    ],
    default: [
      { kind: "damage", type: "fire" as WeaponDamageType },
      { kind: "damage", type: "cold" as WeaponDamageType },
      { kind: "damage", type: "lightning" as WeaponDamageType },
      { kind: "damage", type: "poison" as WeaponDamageType },
      { kind: "effect", effectKind: "burn" as WeaponEffectKind },
      { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
      { kind: "effect", effectKind: "shock" as WeaponEffectKind },
      { kind: "effect", effectKind: "slow" as WeaponEffectKind },
    ],
  };

  const ARMOR_AFFIX_POOL: DamageType[] = ["physical", "fire", "cold", "lightning", "poison"];
  const ARMOR_IMMUNITY_POOL: DamageType[] = ["fire", "cold", "lightning", "poison"];
  const UNIQUE_ARMOR_IMMUNITY_CHANCE = 0.1;
  const MARTIAL_WEAPON_FAMILIES = ["Swords", "Maces", "Polearms", "Spears", "Javelins", "Bows", "Crossbows"];
  const EXTRA_BONUS_POOL = [
    { heroDamageBonus: 1 }, { heroDamageBonus: 2 }, { heroGuardBonus: 1 }, { heroGuardBonus: 2 },
    { heroBurnBonus: 1 }, { heroBurnBonus: 2 }, { heroMaxLife: 3 }, { heroMaxLife: 6 },
    { heroMaxEnergy: 1 }, { heroPotionHeal: 1 }, { heroPotionHeal: 2 },
    { mercenaryAttack: 1 }, { mercenaryAttack: 2 }, { mercenaryMaxLife: 3 }, { mercenaryMaxLife: 6 },
  ];
  const UNIQUE_EXTRA_BONUS_POOL = [
    { heroDamageBonus: 2 }, { heroDamageBonus: 3 }, { heroGuardBonus: 2 }, { heroGuardBonus: 3 },
    { heroBurnBonus: 2 }, { heroBurnBonus: 3 }, { heroMaxLife: 6 }, { heroMaxLife: 10 },
    { heroMaxEnergy: 2 }, { heroHandSize: 1 }, { heroPotionHeal: 3 },
    { mercenaryAttack: 2 }, { mercenaryAttack: 3 }, { mercenaryMaxLife: 6 }, { mercenaryMaxLife: 10 },
  ];

  function getRarityAffixCount(rarity: string) {
    if (rarity === RARITY.UNIQUE) {
      return 3;
    }
    if (rarity === RARITY.RARE || rarity === RARITY.SET) {
      return 2;
    }
    if (rarity === RARITY.MAGIC) {
      return 1;
    }
    return 0;
  }

  function getWeaponTierTempoBonus(family: string, progressionTier: number) {
    const tier = Math.max(1, progressionTier);
    let genericBonus = 0;
    if (tier >= 8) {
      genericBonus = 3;
    } else if (tier >= 6) {
      genericBonus = 2;
    } else if (tier >= 4) {
      genericBonus = 1;
    }
    let martialBonus = 0;
    if (MARTIAL_WEAPON_FAMILIES.includes(family)) {
      if (tier >= 7) {
        martialBonus = 2;
      } else if (tier >= 5) {
        martialBonus = 1;
      }
    }
    return genericBonus + martialBonus;
  }

  function scaleWeaponTreeBonus(baseValue: number, progressionTier: number, family: string) {
    return Math.max(1, baseValue + Math.floor(Math.max(0, progressionTier - 1) / 2) + getWeaponTierTempoBonus(family, progressionTier));
  }

  function scaleWeaponDamageAmount(baseValue: number, progressionTier: number, family: string) {
    return Math.max(1, baseValue + Math.floor(Math.max(0, progressionTier - 1) / 2) + getWeaponTierTempoBonus(family, progressionTier));
  }

  function scaleWeaponEffectAmount(effect: WeaponEffectDefinition, progressionTier: number, family: string) {
    const step = effect.kind === "crushing" ? 2 : 3;
    return Math.max(
      1,
      toNumber(effect.amount, 1) +
        Math.floor(Math.max(0, progressionTier - 1) / step) +
        Math.floor(getWeaponTierTempoBonus(family, progressionTier) / 2)
    );
  }

  function scaleArmorResistanceAmount(baseValue: number, progressionTier: number, type: DamageType = "physical") {
    if (type === "physical") {
      return Math.max(1, baseValue + Math.floor(Math.max(0, progressionTier - 1) / 6));
    }
    return Math.max(1, baseValue);
  }

  function getRarityKind(rarity: string | undefined): string {
    if (rarity === RARITY.MAGIC) { return "magic"; }
    if (rarity === RARITY.RARE) { return "rare"; }
    if (rarity === RARITY.UNIQUE) { return "unique"; }
    if (rarity === RARITY.SET) { return "set"; }
    return "white";
  }

  function normalizeRarity(rarity: unknown, rarityKind: unknown = ""): string {
    const kindKey = String(rarityKind || "").trim().toLowerCase();
    if (kindKey && kindKey in RARITY_KIND_VALUE_MAP) {
      return RARITY_KIND_VALUE_MAP[kindKey as keyof typeof RARITY_KIND_VALUE_MAP];
    }

    const rarityValue = String(rarity || "").trim().toLowerCase();
    if (!rarityValue || rarityValue === RARITY.WHITE || rarityValue === "normal") {
      return RARITY.WHITE;
    }
    if (rarityValue === RARITY.MAGIC || rarityValue === "magic") {
      return RARITY.MAGIC;
    }
    if (rarityValue === "rare") {
      return RARITY.RARE;
    }
    if (rarityValue === RARITY.UNIQUE || rarityValue === "unique") {
      return RARITY.UNIQUE;
    }
    if (rarityValue === RARITY.SET || rarityValue === "set") {
      return RARITY.SET;
    }
    if (rarityValue === "yellow") {
      return RARITY.MAGIC;
    }
    return RARITY.WHITE;
  }

  function getRarityLabel(rarity: string | undefined): string {
    if (rarity === RARITY.MAGIC) { return "Magic"; }
    if (rarity === RARITY.RARE) { return "Rare"; }
    if (rarity === RARITY.UNIQUE) { return "Unique"; }
    if (rarity === RARITY.SET) { return "Set"; }
    return "";
  }

  function getRarityTuning(rarity: string | undefined) {
    if (rarity === RARITY.MAGIC) {
      return { multiplier: 1.2, extraLineCount: 1, weaponBonus: 1, damageBonus: 1, effectBonus: 0 };
    }
    if (rarity === RARITY.RARE) {
      return { multiplier: 1.45, extraLineCount: 2, weaponBonus: 2, damageBonus: 2, effectBonus: 1 };
    }
    if (rarity === RARITY.UNIQUE) {
      return { multiplier: 2, extraLineCount: 4, weaponBonus: 4, damageBonus: 4, effectBonus: 2 };
    }
    if (rarity === RARITY.SET) {
      return { multiplier: 1.6, extraLineCount: 2, weaponBonus: 2, damageBonus: 2, effectBonus: 1 };
    }
    return { multiplier: 1, extraLineCount: 0, weaponBonus: 0, damageBonus: 0, effectBonus: 0 };
  }

  runtimeWindow.__ROUGE_ITEM_CATALOG_PROFILE_DATA = {
    RARITY,
    SLOT_FAMILY_DEFAULTS,
    WEAPON_ATTACK_PROFILES,
    WEAPON_SUPPORT_PROFILES,
    PRIMARY_WEAPON_PROFICIENCY_BY_FAMILY,
    WEAPON_DAMAGE_PROFILES,
    WEAPON_EFFECT_PROFILES,
    WEAPON_AFFIX_POOLS,
    ARMOR_AFFIX_POOL,
    ARMOR_IMMUNITY_POOL,
    UNIQUE_ARMOR_IMMUNITY_CHANCE,
    EXTRA_BONUS_POOL,
    UNIQUE_EXTRA_BONUS_POOL,
    getRarityAffixCount,
    scaleWeaponTreeBonus,
    scaleWeaponDamageAmount,
    scaleWeaponEffectAmount,
    scaleArmorResistanceAmount,
    getRarityKind,
    normalizeRarity,
    getRarityLabel,
    getRarityTuning,
    getZoneRarityKind: (zoneKind: string, randomFn: RandomFn) => {
      const roll = randomFn();
      if (zoneKind === ZONE_KIND.BOSS) {
        if (roll < 0.30) { return RARITY.WHITE; }
        if (roll < 0.58) { return RARITY.MAGIC; }
        return roll < 0.86 ? RARITY.RARE : RARITY.UNIQUE;
      }
      if (zoneKind === ZONE_KIND.MINIBOSS) {
        if (roll < 0.50) { return RARITY.WHITE; }
        if (roll < 0.76) { return RARITY.MAGIC; }
        return roll < 0.94 ? RARITY.RARE : RARITY.UNIQUE;
      }
      if (roll < 0.70) { return RARITY.WHITE; }
      if (roll < 0.89) { return RARITY.MAGIC; }
      return roll < 0.98 ? RARITY.RARE : RARITY.UNIQUE;
    },
  };
})();
