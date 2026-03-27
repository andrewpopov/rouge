(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { ITEM_TEMPLATES, RUNE_TEMPLATES, RUNEWORD_TEMPLATES, RUNE_REWARD_POOLS } = runtimeWindow.ROUGE_ITEM_DATA;
  const { clamp, toNumber, uniquePush } = runtimeWindow.ROUGE_UTILS;

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
    Maces: { combat_skills: 2, combat: 3, masteries: 3, offensive_auras: 2, defensive_auras: 2, shape_shifting: 2, elemental: 2 },
    Polearms: { combat_skills: 2, javelin: 2 },
    Spears: { combat_skills: 1, javelin: 3 },
    Javelins: { javelin: 3 },
    Bows: { bow: 3 },
    Crossbows: { bow: 3 },
    Wands: { poison_bone: 4 },
    Staves: { fire: 3, cold: 3, lightning: 3, elemental: 3 },
  };

  const WEAPON_SUPPORT_PROFILES: Record<string, Record<string, number>> = {
    Swords: { masteries: 1, warcries: 1, combat: 1, offensive_auras: 1, defensive_auras: 1, shadow: 2, martial_arts: 1 },
    Maces: { combat: 2, combat_skills: 1, masteries: 3, warcries: 3, offensive_auras: 3, defensive_auras: 3, shape_shifting: 2, elemental: 2, summoning: 2 },
    Polearms: { combat_skills: 1, javelin: 1, passive: 1, warcries: 1 },
    Spears: { javelin: 2, passive: 1 },
    Javelins: { javelin: 2, passive: 2 },
    Bows: { bow: 2, passive: 2 },
    Crossbows: { bow: 2, passive: 2 },
    Wands: { poison_bone: 3, curses: 3, summoning: 4 },
    Staves: { fire: 2, cold: 2, lightning: 2, elemental: 3 },
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
    Maces: [{ type: "fire", amount: 2, proficiency: "combat" }],
    Polearms: [{ type: "fire", amount: 2, proficiency: "combat_skills" }],
    Spears: [{ type: "cold", amount: 2, proficiency: "javelin" }],
    Javelins: [{ type: "lightning", amount: 2, proficiency: "javelin" }],
    Bows: [{ type: "fire", amount: 2, proficiency: "bow" }],
    Crossbows: [{ type: "cold", amount: 2, proficiency: "bow" }],
    Wands: [{ type: "poison", amount: 4, proficiency: "poison_bone" }],
    Staves: [
      { type: "fire", amount: 3, proficiency: "fire" },
      { type: "cold", amount: 3, proficiency: "cold" },
      { type: "lightning", amount: 3, proficiency: "lightning" },
    ],
  };

  const WEAPON_EFFECT_PROFILES: Record<string, WeaponEffectDefinition[]> = {
    Maces: [{ kind: "crushing", amount: 2 }],
    Polearms: [{ kind: "slow", amount: 2, proficiency: "combat_skills" }, { kind: "slow", amount: 1, proficiency: "javelin" }],
    Spears: [{ kind: "slow", amount: 2, proficiency: "javelin" }],
    Javelins: [{ kind: "shock", amount: 2, proficiency: "javelin" }],
    Bows: [{ kind: "burn", amount: 2, proficiency: "bow" }],
    Crossbows: [{ kind: "freeze", amount: 2, proficiency: "bow" }],
    Wands: [{ kind: "slow", amount: 2, proficiency: "curses" }],
    Staves: [
      { kind: "burn", amount: 1, proficiency: "fire" },
      { kind: "freeze", amount: 1, proficiency: "cold" },
      { kind: "shock", amount: 1, proficiency: "lightning" },
    ],
  };

  const DEFAULT_WEAPON_AFFIX_POOL = [
    { kind: "damage", type: "fire" as WeaponDamageType },
    { kind: "damage", type: "cold" as WeaponDamageType },
    { kind: "damage", type: "lightning" as WeaponDamageType },
    { kind: "damage", type: "poison" as WeaponDamageType },
    { kind: "effect", effectKind: "burn" as WeaponEffectKind },
    { kind: "effect", effectKind: "freeze" as WeaponEffectKind },
    { kind: "effect", effectKind: "shock" as WeaponEffectKind },
    { kind: "effect", effectKind: "slow" as WeaponEffectKind },
  ];

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
    default: DEFAULT_WEAPON_AFFIX_POOL,
  };

  const ARMOR_AFFIX_POOL: DamageType[] = ["physical", "fire", "cold", "lightning", "poison"];
  const ARMOR_IMMUNITY_POOL: DamageType[] = ["fire", "cold", "lightning", "poison"];
  const UNIQUE_ARMOR_IMMUNITY_CHANCE = 0.1;

  function getWeaponTierTempoBonus(family: string, progressionTier: number) {
    const tier = Math.max(1, progressionTier);
    const genericBonus =
      tier >= 8 ? 3 :
      tier >= 6 ? 2 :
      tier >= 4 ? 1 :
      0;
    const martialBonus =
      ["Swords", "Maces", "Polearms", "Spears", "Javelins", "Bows", "Crossbows"].includes(family)
        ? (tier >= 7 ? 2 : tier >= 5 ? 1 : 0)
        : 0;
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
    // Legacy saves used yellow for magic before rare items existed.
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

  function cloneWeaponProfile(profile: WeaponCombatProfile | null | undefined): WeaponCombatProfile | undefined {
    if (!profile) {
      return undefined;
    }
    const attackDamageByProficiency = Object.entries(profile.attackDamageByProficiency || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = toNumber(value, 0);
      return total;
    }, {} as Record<string, number>);
    const supportValueByProficiency = Object.entries(profile.supportValueByProficiency || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = toNumber(value, 0);
      return total;
    }, {} as Record<string, number>);
    const typedDamage = Array.isArray(profile.typedDamage)
      ? profile.typedDamage
          .map((damageEntry) => {
            if (!damageEntry?.type) {
              return null;
            }
            return {
              type: damageEntry.type,
              amount: Math.max(1, toNumber(damageEntry.amount, 1)),
              ...(damageEntry.proficiency ? { proficiency: damageEntry.proficiency } : {}),
            };
          })
          .filter(Boolean) as WeaponDamageDefinition[]
      : [];
    const effects = Array.isArray(profile.effects)
      ? profile.effects
          .map((effect) => {
            if (!effect?.kind) {
              return null;
            }
            return {
              kind: effect.kind,
              amount: Math.max(1, toNumber(effect.amount, 1)),
              ...(effect.proficiency ? { proficiency: effect.proficiency } : {}),
            };
          })
          .filter(Boolean) as WeaponEffectDefinition[]
      : [];

    return {
      ...(Object.keys(attackDamageByProficiency).length > 0 ? { attackDamageByProficiency } : {}),
      ...(Object.keys(supportValueByProficiency).length > 0 ? { supportValueByProficiency } : {}),
      ...(typedDamage.length > 0 ? { typedDamage } : {}),
      ...(effects.length > 0 ? { effects } : {}),
    };
  }

  function cloneArmorProfile(profile: ArmorMitigationProfile | null | undefined): ArmorMitigationProfile | undefined {
    if (!profile) {
      return undefined;
    }
    const resistances = Array.isArray(profile.resistances)
      ? profile.resistances
          .map((entry) => {
            if (!entry?.type) {
              return null;
            }
            return {
              type: entry.type,
              amount: Math.max(0, toNumber(entry.amount, 0)),
            };
          })
          .filter(Boolean) as DamageResistanceDefinition[]
      : [];
    const immunities = Array.isArray(profile.immunities)
      ? profile.immunities.filter(Boolean) as DamageType[]
      : [];
    return {
      ...(resistances.length > 0 ? { resistances } : {}),
      ...(immunities.length > 0 ? { immunities: [...new Set(immunities)] } : {}),
    };
  }

  function buildDefaultWeaponProfile(slot: EquipmentSlot, family: string, progressionTier: number): WeaponCombatProfile | undefined {
    if (slot !== "weapon") {
      return undefined;
    }

    const attackDamageByProficiency = Object.entries(WEAPON_ATTACK_PROFILES[family] || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = scaleWeaponTreeBonus(value, progressionTier, family);
      return total;
    }, {} as Record<string, number>);
    const supportValueByProficiency = Object.entries(WEAPON_SUPPORT_PROFILES[family] || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = scaleWeaponTreeBonus(value, progressionTier, family);
      return total;
    }, {} as Record<string, number>);
    const typedDamage = (WEAPON_DAMAGE_PROFILES[family] || []).map((damageEntry) => ({
      ...damageEntry,
      amount: scaleWeaponDamageAmount(damageEntry.amount, progressionTier, family),
    }));
    const effects = (WEAPON_EFFECT_PROFILES[family] || []).map((effect) => ({
      ...effect,
      amount: scaleWeaponEffectAmount(effect, progressionTier, family),
    }));

    if (
      Object.keys(attackDamageByProficiency).length === 0 &&
      Object.keys(supportValueByProficiency).length === 0 &&
      typedDamage.length === 0 &&
      effects.length === 0
    ) {
      return undefined;
    }

    return {
      ...(Object.keys(attackDamageByProficiency).length > 0 ? { attackDamageByProficiency } : {}),
      ...(Object.keys(supportValueByProficiency).length > 0 ? { supportValueByProficiency } : {}),
      ...(typedDamage.length > 0 ? { typedDamage } : {}),
      ...(effects.length > 0 ? { effects } : {}),
    };
  }

  function buildDefaultArmorProfile(slot: EquipmentSlot, progressionTier: number): ArmorMitigationProfile | undefined {
    if (slot !== "armor") {
      return undefined;
    }
    return {
      resistances: [
        {
          type: "physical",
          amount: scaleArmorResistanceAmount(1, progressionTier, "physical"),
        },
      ],
    };
  }

  function mergeWeaponProfiles(baseProfile: WeaponCombatProfile | null | undefined, overrideProfile: WeaponCombatProfile | null | undefined) {
    const base = cloneWeaponProfile(baseProfile);
    const override = cloneWeaponProfile(overrideProfile);
    if (!base && !override) {
      return undefined;
    }

    const attackDamageByProficiency = { ...(base?.attackDamageByProficiency || {}) };
    Object.entries(override?.attackDamageByProficiency || {}).forEach(([proficiency, value]) => {
      attackDamageByProficiency[proficiency] = (attackDamageByProficiency[proficiency] || 0) + toNumber(value, 0);
    });
    const supportValueByProficiency = { ...(base?.supportValueByProficiency || {}) };
    Object.entries(override?.supportValueByProficiency || {}).forEach(([proficiency, value]) => {
      supportValueByProficiency[proficiency] = (supportValueByProficiency[proficiency] || 0) + toNumber(value, 0);
    });
    const typedDamage = [
      ...((base?.typedDamage || []).map((damageEntry) => ({ ...damageEntry }))),
      ...((override?.typedDamage || []).map((damageEntry) => ({ ...damageEntry }))),
    ];
    const effects = [
      ...((base?.effects || []).map((effect) => ({ ...effect }))),
      ...((override?.effects || []).map((effect) => ({ ...effect }))),
    ];

    return {
      ...(Object.keys(attackDamageByProficiency).length > 0 ? { attackDamageByProficiency } : {}),
      ...(Object.keys(supportValueByProficiency).length > 0 ? { supportValueByProficiency } : {}),
      ...(typedDamage.length > 0 ? { typedDamage } : {}),
      ...(effects.length > 0 ? { effects } : {}),
    };
  }

  function mergeArmorProfiles(baseProfile: ArmorMitigationProfile | null | undefined, overrideProfile: ArmorMitigationProfile | null | undefined) {
    const base = cloneArmorProfile(baseProfile);
    const override = cloneArmorProfile(overrideProfile);
    if (!base && !override) {
      return undefined;
    }

    const resistanceMap = [...(base?.resistances || []), ...(override?.resistances || [])].reduce((total, entry) => {
      total[entry.type] = (total[entry.type] || 0) + Math.max(0, toNumber(entry.amount, 0));
      return total;
    }, {} as Record<string, number>);
    const resistances = Object.entries(resistanceMap).map(([type, amount]) => ({
      type: type as DamageType,
      amount,
    }));
    const immunitySet = new Set<DamageType>([...(base?.immunities || []), ...(override?.immunities || [])]);

    return {
      ...(resistances.length > 0 ? { resistances } : {}),
      ...(immunitySet.size > 0 ? { immunities: [...immunitySet] } : {}),
    };
  }

  function getWeaponProfileForRarity(profile: WeaponCombatProfile | null | undefined, rarity: string | undefined) {
    const baseProfile = cloneWeaponProfile(profile);
    if (!baseProfile) {
      return undefined;
    }

    const tuning = getRarityTuning(rarity);
    if (tuning.weaponBonus <= 0 && tuning.damageBonus <= 0 && tuning.effectBonus <= 0) {
      return baseProfile;
    }

    const attackDamageByProficiency = Object.entries(baseProfile.attackDamageByProficiency || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = Math.max(0, toNumber(value, 0) + tuning.weaponBonus);
      return total;
    }, {} as Record<string, number>);
    const supportValueByProficiency = Object.entries(baseProfile.supportValueByProficiency || {}).reduce((total, [proficiency, value]) => {
      total[proficiency] = Math.max(0, toNumber(value, 0) + tuning.weaponBonus);
      return total;
    }, {} as Record<string, number>);
    const typedDamage = (baseProfile.typedDamage || []).map((damageEntry) => ({
      ...damageEntry,
      amount: Math.max(1, toNumber(damageEntry.amount, 1) + tuning.damageBonus),
    }));
    const effects = (baseProfile.effects || []).map((effect) => ({
      ...effect,
      amount: Math.max(1, toNumber(effect.amount, 1) + tuning.effectBonus),
    }));

    return {
      ...(Object.keys(attackDamageByProficiency).length > 0 ? { attackDamageByProficiency } : {}),
      ...(Object.keys(supportValueByProficiency).length > 0 ? { supportValueByProficiency } : {}),
      ...(typedDamage.length > 0 ? { typedDamage } : {}),
      ...(effects.length > 0 ? { effects } : {}),
    };
  }

  function getArmorProfileForRarity(profile: ArmorMitigationProfile | null | undefined, rarity: string | undefined) {
    const baseProfile = cloneArmorProfile(profile);
    if (!baseProfile) {
      return undefined;
    }
    void rarity;
    // Armor rarity now scales through extra item lines and affix count, not flat resistance inflation.
    return baseProfile;
  }

  function buildEquipmentWeaponProfile(equipment: RunEquipmentState | null | undefined, content: GameContent) {
    if (!equipment) {
      return undefined;
    }
    const item = getItemDefinition(content, equipment.itemId);
    const mergedProfile = mergeWeaponProfiles(item?.weaponProfile, equipment.weaponAffixes);
    if (!mergedProfile) {
      return undefined;
    }
    return getWeaponProfileForRarity(
      mergedProfile,
      normalizeRarity(equipment.rarity, equipment.rarityKind)
    );
  }

  function buildEquipmentArmorProfile(equipment: RunEquipmentState | null | undefined, content: GameContent) {
    if (!equipment) {
      return undefined;
    }
    const item = getItemDefinition(content, equipment.itemId);
    const mergedProfile = mergeArmorProfiles(item?.armorProfile, equipment.armorAffixes);
    if (!mergedProfile) {
      return undefined;
    }
    return getArmorProfileForRarity(
      mergedProfile,
      normalizeRarity(equipment.rarity, equipment.rarityKind)
    );
  }

  function rollWeaponAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn) {
    if (!itemDef || itemDef.slot !== "weapon") {
      return undefined;
    }

    const affixCount =
      rarity === RARITY.UNIQUE ? 3 :
      rarity === RARITY.RARE ? 2 :
      rarity === RARITY.MAGIC ? 1 :
      rarity === RARITY.SET ? 2 :
      0;
    if (affixCount <= 0) {
      return undefined;
    }

    const pool = [...(WEAPON_AFFIX_POOLS[itemDef.family as keyof typeof WEAPON_AFFIX_POOLS] || WEAPON_AFFIX_POOLS.default)];
    if (pool.length === 0) {
      return undefined;
    }

    const primaryProficiency = PRIMARY_WEAPON_PROFICIENCY_BY_FAMILY[itemDef.family] || "";
    const typedDamage: WeaponDamageDefinition[] = [];
    const effects: WeaponEffectDefinition[] = [];

    for (let index = 0; index < Math.min(affixCount, pool.length); index += 1) {
      const selectedIndex = Math.floor(randomFn() * pool.length);
      const selected = pool.splice(selectedIndex, 1)[0];
      if (!selected) {
        continue;
      }
      if (selected.kind === "damage" && selected.type) {
        typedDamage.push({
          type: selected.type,
          amount: scaleWeaponDamageAmount(1, itemDef.progressionTier, itemDef.family || ""),
          ...(primaryProficiency ? { proficiency: primaryProficiency } : {}),
        });
        continue;
      }
      if (selected.kind === "effect" && selected.effectKind) {
        effects.push({
          kind: selected.effectKind,
          amount: scaleWeaponEffectAmount({ kind: selected.effectKind, amount: 1 }, itemDef.progressionTier, itemDef.family || ""),
          ...(primaryProficiency ? { proficiency: primaryProficiency } : {}),
        });
      }
    }

    if (typedDamage.length === 0 && effects.length === 0) {
      return undefined;
    }

    return {
      ...(typedDamage.length > 0 ? { typedDamage } : {}),
      ...(effects.length > 0 ? { effects } : {}),
    };
  }

  function rollArmorAffixes(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn) {
    if (!itemDef || itemDef.slot !== "armor") {
      return undefined;
    }

    const affixCount =
      rarity === RARITY.UNIQUE ? 3 :
      rarity === RARITY.RARE ? 2 :
      rarity === RARITY.MAGIC ? 1 :
      rarity === RARITY.SET ? 2 :
      0;
    if (affixCount <= 0) {
      return undefined;
    }

    const pool = [...ARMOR_AFFIX_POOL];
    const resistances: DamageResistanceDefinition[] = [];
    const immunities: DamageType[] = [];

    for (let index = 0; index < Math.min(affixCount, pool.length); index += 1) {
      const selectedIndex = Math.floor(randomFn() * pool.length);
      const selectedType = pool.splice(selectedIndex, 1)[0];
      if (!selectedType) {
        continue;
      }
      resistances.push({
        type: selectedType,
        amount: scaleArmorResistanceAmount(1, itemDef.progressionTier, selectedType),
      });
    }

    if (rarity === RARITY.UNIQUE && randomFn() < UNIQUE_ARMOR_IMMUNITY_CHANCE) {
      const immunityType = ARMOR_IMMUNITY_POOL[Math.floor(randomFn() * ARMOR_IMMUNITY_POOL.length)];
      if (immunityType) {
        immunities.push(immunityType);
      }
    }

    if (resistances.length === 0 && immunities.length === 0) {
      return undefined;
    }

    return {
      ...(resistances.length > 0 ? { resistances } : {}),
      ...(immunities.length > 0 ? { immunities } : {}),
    };
  }

  function toItemDefinition(seedEntry: Record<string, unknown> | null, templateId: string, template: ItemTemplateDefinition) {
    const slot = template.slot as EquipmentSlot;
    const family = (seedEntry?.family as string) || template.family || (SLOT_FAMILY_DEFAULTS[slot] || "Gear");
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || template.sourceId,
      slot,
      family,
      summary: (seedEntry?.summary as string) || "A salvaged piece of gear adapted for Rogue's persistent build growth.",
      actRequirement: template.actRequirement,
      progressionTier: template.progressionTier,
      maxSockets: clamp(toNumber((seedEntry?.stats as Record<string, unknown>)?.socketsMax, 2), 0, 3),
      bonuses: { ...template.bonuses },
      weaponProfile: mergeWeaponProfiles(
        buildDefaultWeaponProfile(slot, family, template.progressionTier),
        template.weaponProfile
      ),
      armorProfile: mergeArmorProfiles(
        buildDefaultArmorProfile(slot, template.progressionTier),
        template.armorProfile
      ),
    };
  }

  function toRuneDefinition(seedEntry: Record<string, unknown> | null, templateId: string, template: RuneTemplateDefinition) {
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || template.sourceId,
      allowedSlots: [...template.allowedSlots] as Array<EquipmentSlot>,
      rank: (seedEntry?.rank as number) || 1,
      progressionTier: template.progressionTier,
      summary: (seedEntry?.summary as string) || "A socketable rune adapted for Rogue's runeword seam.",
      bonuses: { ...template.bonuses },
    };
  }

  function toRunewordDefinition(seedEntry: Record<string, unknown> | null, runewordId: string, template: RunewordTemplateDefinition, runeCatalog: Record<string, RuntimeRuneDefinition>) {
    const progressionTier = template.requiredRunes.reduce((highestTier: number, runeId: string) => {
      const rune = runeCatalog?.[runeId] || null;
      return Math.max(highestTier, toNumber(rune?.progressionTier, 1));
    }, 1);
    return {
      id: runewordId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || runewordId,
      slot: template.slot as EquipmentSlot,
      familyAllowList: [...(template.familyAllowList || [])],
      progressionTier,
      socketCount: template.requiredRunes.length,
      requiredRunes: [...template.requiredRunes],
      summary: (seedEntry?.summary as string) || "A simplified runeword route for Rogue's progression layer.",
      bonuses: { ...template.bonuses },
    };
  }

  function createRuntimeContent(baseContent: GameContent, seedBundle: SeedBundle | null) {
    const itemEntries = Array.isArray((seedBundle?.items as Record<string, unknown>)?.entries) ? (seedBundle!.items as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const runeEntries = Array.isArray((seedBundle?.runes as Record<string, unknown>)?.entries) ? (seedBundle!.runes as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const runewordEntries = Array.isArray((seedBundle?.runewords as Record<string, unknown>)?.entries) ? (seedBundle!.runewords as Record<string, unknown>).entries as Record<string, unknown>[] : [];
    const itemCatalog: Record<string, RuntimeItemDefinition> = {};
    const runeCatalog: Record<string, RuntimeRuneDefinition> = {};
    const runewordCatalog: Record<string, RuntimeRunewordDefinition> = {};

    Object.entries(ITEM_TEMPLATES).forEach(([templateId, template]: [string, ItemTemplateDefinition]) => {
      const seedEntry = itemEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      itemCatalog[templateId] = toItemDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNE_TEMPLATES).forEach(([templateId, template]: [string, RuneTemplateDefinition]) => {
      const seedEntry = runeEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      runeCatalog[templateId] = toRuneDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNEWORD_TEMPLATES).forEach(([runewordId, template]: [string, RunewordTemplateDefinition]) => {
      const seedEntry = runewordEntries.find((entry: Record<string, unknown>) => entry.id === template.sourceId) || null;
      runewordCatalog[runewordId] = toRunewordDefinition(seedEntry, runewordId, template, runeCatalog);
    });

    return {
      ...baseContent,
      itemCatalog,
      runeCatalog,
      runewordCatalog,
    };
  }

  function getItemDefinition(content: GameContent, itemId: string) {
    return content.itemCatalog?.[itemId] || null;
  }

  function getRuneDefinition(content: GameContent, runeId: string) {
    return content.runeCatalog?.[runeId] || null;
  }

  function getRunewordDefinition(content: GameContent, runewordId: string) {
    return content.runewordCatalog?.[runewordId] || null;
  }

  function isRunewordCompatibleWithItem(item: RuntimeItemDefinition | null, runeword: RuntimeRunewordDefinition | null) {
    if (!item || !runeword || item.slot !== runeword.slot) {
      return false;
    }
    if (toNumber(runeword.socketCount, 0) > toNumber(item.maxSockets, 0)) {
      return false;
    }
    if (Array.isArray(runeword.familyAllowList) && runeword.familyAllowList.length > 0) {
      return runeword.familyAllowList.includes(item.family);
    }
    return true;
  }

  function isRunewordCompatibleWithEquipment(equipment: RunEquipmentState | null, runeword: RuntimeRunewordDefinition | null, content: GameContent) {
    if (!equipment || !runeword) {
      return false;
    }
    return isRunewordCompatibleWithItem(getItemDefinition(content, equipment.itemId), runeword);
  }

  function isRuneAllowedInSlot(rune: RuntimeRuneDefinition | null, slot: string) {
    return Array.isArray(rune?.allowedSlots) && rune.allowedSlots.includes(slot as EquipmentSlot);
  }

  function resolveRunewordId(equipment: RunEquipmentState | null, content: GameContent) {
    if (!equipment) {
      return "";
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item) {
      return "";
    }

    const runewords = Object.values(content.runewordCatalog || {}) as RuntimeRunewordDefinition[];
    const match = runewords.find((runeword) => {
      if (runeword.slot !== equipment.slot) {
        return false;
      }
      if (Array.isArray(runeword.familyAllowList) && runeword.familyAllowList.length > 0) {
        if (!runeword.familyAllowList.includes(item.family)) {
          return false;
        }
      }
      if (equipment.socketsUnlocked !== runeword.socketCount || equipment.insertedRunes.length !== runeword.requiredRunes.length) {
        return false;
      }
      return runeword.requiredRunes.every((runeId: string, index: number) => equipment.insertedRunes[index] === runeId);
    });

    return match?.id || "";
  }

  function normalizeEquipmentState(value: unknown, slot: string, content: GameContent, legacyRuneId: string = "") {
    let candidate = value;
    if (typeof candidate === "string") {
      candidate = candidate
        ? {
            itemId: candidate,
            slot,
            socketsUnlocked: legacyRuneId ? 1 : 0,
            insertedRunes: legacyRuneId ? [legacyRuneId] : [],
            runewordId: "",
          }
        : null;
    }

    if (!candidate || typeof candidate !== "object") {
      return null;
    }

    const obj = candidate as Record<string, unknown>;
    const item = getItemDefinition(content, obj.itemId as string);
    if (!item || item.slot !== slot) {
      return null;
    }

    let socketsUnlocked = clamp(toNumber(obj.socketsUnlocked, 0), 0, item.maxSockets);
    const insertedRunes = Array.isArray(obj.insertedRunes)
      ? (obj.insertedRunes as string[])
          .map((runeId: string) => getRuneDefinition(content, runeId))
          .filter((rune: RuntimeRuneDefinition | null) => rune && isRuneAllowedInSlot(rune, slot))
          .slice(0, socketsUnlocked)
          .map((rune: RuntimeRuneDefinition) => rune.id)
      : [];

    socketsUnlocked = Math.max(socketsUnlocked, insertedRunes.length);

    const normalizedRarity = normalizeRarity(obj.rarity as string, obj.rarityKind as string);
    const equipment = {
      entryId: typeof obj.entryId === "string" ? obj.entryId : "",
      itemId: item.id,
      slot,
      socketsUnlocked,
      insertedRunes,
      runewordId: "",
      rarity: normalizedRarity,
      rarityKind: getRarityKind(normalizedRarity),
      rarityBonuses: (obj.rarityBonuses as ItemBonusSet) || {},
      weaponAffixes: cloneWeaponProfile(obj.weaponAffixes as WeaponCombatProfile),
      armorAffixes: cloneArmorProfile(obj.armorAffixes as ArmorMitigationProfile),
    };

    equipment.runewordId = resolveRunewordId(equipment, content);
    return equipment;
  }

  function itemSlotForLoadoutKey(loadoutKey: string): string {
    if (loadoutKey === "ring1" || loadoutKey === "ring2") { return "ring"; }
    return loadoutKey;
  }

  function buildHydratedLoadout(run: RunState, content: GameContent) {
    const source = (run?.loadout || {}) as Record<string, unknown>;
    return {
      weapon: normalizeEquipmentState(source.weapon, "weapon", content, (source.weaponRune as string) || ""),
      armor: normalizeEquipmentState(source.armor, "armor", content, (source.armorRune as string) || ""),
      helm: normalizeEquipmentState(source.helm, "helm", content),
      shield: normalizeEquipmentState(source.shield, "shield", content),
      gloves: normalizeEquipmentState(source.gloves, "gloves", content),
      boots: normalizeEquipmentState(source.boots, "boots", content),
      belt: normalizeEquipmentState(source.belt, "belt", content),
      ring1: normalizeEquipmentState(source.ring1, "ring", content),
      ring2: normalizeEquipmentState(source.ring2, "ring", content),
      amulet: normalizeEquipmentState(source.amulet, "amulet", content),
    };
  }

  function getPreferredRunewordForEquipment(equipment: RunEquipmentState | null, run: RunState, content: GameContent, preferredRunewordId: string = "") {
    if (!equipment) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item) {
      return null;
    }

    const targetTier = Math.max(item.progressionTier, run?.actNumber || 1);
    const matchingRunewords = (Object.values(content.runewordCatalog || {}) as RuntimeRunewordDefinition[]).filter((runeword) => {
        return isRunewordCompatibleWithItem(item, runeword);
      });

    const preferredRuneword = getRunewordDefinition(content, preferredRunewordId);
    if (preferredRuneword && matchingRunewords.some((runeword) => runeword.id === preferredRuneword.id)) {
      return preferredRuneword;
    }

    return (
      matchingRunewords
        .sort((left: RuntimeRunewordDefinition, right: RuntimeRunewordDefinition) => {
          const leftPrefix = left.requiredRunes.reduce((total: number, runeId: string, index: number) => {
            return total + (equipment.insertedRunes[index] === runeId ? 1 : 0);
          }, 0);
          const rightPrefix = right.requiredRunes.reduce((total: number, runeId: string, index: number) => {
            return total + (equipment.insertedRunes[index] === runeId ? 1 : 0);
          }, 0);
          if (leftPrefix !== rightPrefix) {
            return rightPrefix - leftPrefix;
          }

          const leftTierDistance = Math.abs(toNumber(left.progressionTier, 1) - targetTier);
          const rightTierDistance = Math.abs(toNumber(right.progressionTier, 1) - targetTier);
          if (leftTierDistance !== rightTierDistance) {
            return leftTierDistance - rightTierDistance;
          }

          return toNumber(left.progressionTier, 1) - toNumber(right.progressionTier, 1);
        })
        .shift() || null
    );
  }

  function getRuneRewardPool(slot: string) {
    return [...(RUNE_REWARD_POOLS[slot] || [])];
  }

  function getWeaponFamily(itemId: string, content: GameContent) {
    const item = getItemDefinition(content, itemId);
    return item?.family || "";
  }

  const EXTRA_BONUS_POOL = [
    { heroDamageBonus: 1 }, { heroDamageBonus: 2 }, { heroGuardBonus: 1 }, { heroGuardBonus: 2 },
    { heroBurnBonus: 1 }, { heroBurnBonus: 2 }, { heroMaxLife: 3 }, { heroMaxLife: 6 },
    { heroMaxEnergy: 1 }, { heroPotionHeal: 1 }, { heroPotionHeal: 2 },
    { mercenaryAttack: 1 }, { mercenaryAttack: 2 }, { mercenaryMaxLife: 3 }, { mercenaryMaxLife: 6 },
  ];
  const UNIQUE_EXTRA_BONUS_POOL = [
    { heroDamageBonus: 2 }, { heroDamageBonus: 3 }, { heroGuardBonus: 2 }, { heroGuardBonus: 3 },
    { heroBurnBonus: 2 }, { heroBurnBonus: 3 }, { heroMaxLife: 6 }, { heroMaxLife: 10 },
    { heroMaxEnergy: 2 }, { heroPotionHeal: 3 },
    { mercenaryAttack: 2 }, { mercenaryAttack: 3 }, { mercenaryMaxLife: 6 }, { mercenaryMaxLife: 10 },
  ];

  function rollItemRarity(zoneKind: string, randomFn: RandomFn) {
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
  }

  function generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn) {
    if (!itemDef || rarity === RARITY.WHITE || !rarity) { return {}; }
    const tuning = getRarityTuning(rarity);
    const multiplier = tuning.multiplier;
    const extraLineCount = tuning.extraLineCount;
    const bonusPool = rarity === RARITY.UNIQUE ? UNIQUE_EXTRA_BONUS_POOL : EXTRA_BONUS_POOL;
    const scaled: Record<string, number> = {};
    Object.entries(itemDef.bonuses || {}).forEach(([key, value]: [string, number]) => {
      const base = toNumber(value, 0);
      const boosted = Math.ceil(base * multiplier);
      if (boosted > base) { scaled[key] = boosted - base; }
    });
    for (let i = 0; i < extraLineCount; i++) {
      const pick = bonusPool[Math.floor(randomFn() * bonusPool.length)];
      Object.entries(pick).forEach(([key, value]: [string, number]) => { scaled[key] = (scaled[key] || 0) + value; });
    }
    return scaled;
  }

  runtimeWindow.ROUGE_ITEM_CATALOG = {
    RARITY,
    clamp,
    uniquePush,
    toNumber,
    createRuntimeContent,
    itemSlotForLoadoutKey,
    getItemDefinition,
    getRuneDefinition,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    isRunewordCompatibleWithEquipment,
    isRuneAllowedInSlot,
    resolveRunewordId,
    normalizeEquipmentState,
    buildHydratedLoadout,
    getPreferredRunewordForEquipment,
    normalizeRarity,
    getRarityKind,
    getRarityLabel,
    cloneWeaponProfile,
    cloneArmorProfile,
    getWeaponProfileForRarity,
    buildEquipmentWeaponProfile,
    getArmorProfileForRarity,
    buildEquipmentArmorProfile,
    getRuneRewardPool,
    getWeaponFamily,
    rollItemRarity,
    generateRarityBonuses,
    rollWeaponAffixes,
    rollArmorAffixes,
  };
})();
