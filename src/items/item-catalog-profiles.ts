(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { toNumber } = runtimeWindow.ROUGE_UTILS;
  const profileData = (runtimeWindow as Window & {
    __ROUGE_ITEM_CATALOG_PROFILE_DATA: {
      RARITY: ItemCatalogApi["RARITY"];
      SLOT_FAMILY_DEFAULTS: Record<EquipmentSlot, string>;
      WEAPON_ATTACK_PROFILES: Record<string, Record<string, number>>;
      WEAPON_SUPPORT_PROFILES: Record<string, Record<string, number>>;
      PRIMARY_WEAPON_PROFICIENCY_BY_FAMILY: Record<string, string>;
      WEAPON_DAMAGE_PROFILES: Record<string, WeaponDamageDefinition[]>;
      WEAPON_EFFECT_PROFILES: Record<string, WeaponEffectDefinition[]>;
      WEAPON_AFFIX_POOLS: Record<string, Array<{ kind: string; type?: WeaponDamageType; effectKind?: WeaponEffectKind }>>;
      ARMOR_AFFIX_POOL: DamageType[];
      ARMOR_IMMUNITY_POOL: DamageType[];
      UNIQUE_ARMOR_IMMUNITY_CHANCE: number;
      EXTRA_BONUS_POOL: ItemBonusSet[];
      UNIQUE_EXTRA_BONUS_POOL: ItemBonusSet[];
      getRarityAffixCount(rarity: string): number;
      scaleWeaponTreeBonus(baseValue: number, progressionTier: number, family: string): number;
      scaleWeaponDamageAmount(baseValue: number, progressionTier: number, family: string): number;
      scaleWeaponEffectAmount(effect: WeaponEffectDefinition, progressionTier: number, family: string): number;
      scaleArmorResistanceAmount(baseValue: number, progressionTier: number, type?: DamageType): number;
      getRarityKind(rarity: string | undefined): string;
      normalizeRarity(rarity: unknown, rarityKind?: unknown): string;
      getRarityLabel(rarity: string | undefined): string;
      getRarityTuning(rarity: string | undefined): {
        multiplier: number;
        extraLineCount: number;
        weaponBonus: number;
        damageBonus: number;
        effectBonus: number;
      };
      getZoneRarityKind(zoneKind: string, randomFn: RandomFn): string;
    };
  }).__ROUGE_ITEM_CATALOG_PROFILE_DATA;
  const {
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
    getZoneRarityKind,
  } = profileData;

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
    return baseProfile;
  }

  function buildEquipmentWeaponProfile(equipment: RunEquipmentState | null | undefined, content: GameContent) {
    if (!equipment) {
      return undefined;
    }
    const item = content.itemCatalog?.[equipment.itemId] || null;
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
    const item = content.itemCatalog?.[equipment.itemId] || null;
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

    const affixCount = getRarityAffixCount(rarity);
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

    const affixCount = getRarityAffixCount(rarity);
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

  function rollItemRarity(zoneKind: string, randomFn: RandomFn) {
    return getZoneRarityKind(zoneKind, randomFn);
  }

  function generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn) {
    if (!itemDef || rarity === RARITY.WHITE || !rarity) { return {}; }
    const tuning = getRarityTuning(rarity);
    const bonusPool = rarity === RARITY.UNIQUE ? UNIQUE_EXTRA_BONUS_POOL : EXTRA_BONUS_POOL;
    const scaled: Record<string, number> = {};
    Object.entries(itemDef.bonuses || {}).forEach(([key, value]: [string, number]) => {
      const base = toNumber(value, 0);
      const boosted = Math.ceil(base * tuning.multiplier);
      if (boosted > base) { scaled[key] = boosted - base; }
    });
    for (let index = 0; index < tuning.extraLineCount; index += 1) {
      const pick = bonusPool[Math.floor(randomFn() * bonusPool.length)];
      Object.entries(pick).forEach(([key, value]: [string, number]) => {
        scaled[key] = (scaled[key] || 0) + value;
      });
    }
    if ((scaled as ItemBonusSet).heroHandSize) {
      (scaled as ItemBonusSet).heroHandSize = Math.min(1, toNumber((scaled as ItemBonusSet).heroHandSize, 0));
    }
    return scaled;
  }

  runtimeWindow.__ROUGE_ITEM_CATALOG_PROFILES = {
    RARITY,
    SLOT_FAMILY_DEFAULTS,
    normalizeRarity,
    getRarityKind,
    getRarityLabel,
    cloneWeaponProfile,
    cloneArmorProfile,
    buildDefaultWeaponProfile,
    buildDefaultArmorProfile,
    mergeWeaponProfiles,
    mergeArmorProfiles,
    getWeaponProfileForRarity,
    getArmorProfileForRarity,
    buildEquipmentWeaponProfile,
    buildEquipmentArmorProfile,
    rollWeaponAffixes,
    rollArmorAffixes,
    rollItemRarity,
    generateRarityBonuses,
  };
})();
