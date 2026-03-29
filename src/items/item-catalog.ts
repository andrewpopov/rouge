(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { RUNE_REWARD_POOLS } = runtimeWindow.ROUGE_ITEM_DATA;
  const { clamp, toNumber, uniquePush } = runtimeWindow.ROUGE_UTILS;
  const fallbackClone = <T>(value: T): T => {
    if (value == null) {
      return value;
    }
    return JSON.parse(JSON.stringify(value)) as T;
  };
  const FALLBACK_ITEM_CATALOG_PROFILES: ItemCatalogProfilesApi = {
    RARITY: {
      WHITE: "white",
      MAGIC: "blue",
      RARE: "yellow",
      UNIQUE: "brown",
      SET: "green",
    },
    SLOT_FAMILY_DEFAULTS: {
      weapon: "Weapon",
      armor: "Body Armor",
      helm: "Helm",
      shield: "Shields",
      gloves: "Gloves",
      boots: "Boots",
      belt: "Belts",
      ring: "Rings",
      amulet: "Amulets",
    },
    normalizeRarity(rarity: unknown) {
      return String(rarity || "white");
    },
    getRarityKind(rarity: string | undefined) {
      return String(rarity || "white");
    },
    getRarityLabel(rarity: string | undefined) {
      return String(rarity || "white");
    },
    cloneWeaponProfile(profile: WeaponCombatProfile | null | undefined) {
      return fallbackClone(profile || undefined);
    },
    cloneArmorProfile(profile: ArmorMitigationProfile | null | undefined) {
      return fallbackClone(profile || undefined);
    },
    buildDefaultWeaponProfile() {
      return undefined;
    },
    buildDefaultArmorProfile() {
      return undefined;
    },
    mergeWeaponProfiles(baseProfile: WeaponCombatProfile | null | undefined, overrideProfile: WeaponCombatProfile | null | undefined) {
      return { ...(baseProfile || {}), ...(overrideProfile || {}) } as WeaponCombatProfile;
    },
    mergeArmorProfiles(baseProfile: ArmorMitigationProfile | null | undefined, overrideProfile: ArmorMitigationProfile | null | undefined) {
      return { ...(baseProfile || {}), ...(overrideProfile || {}) } as ArmorMitigationProfile;
    },
    getWeaponProfileForRarity(profile: WeaponCombatProfile | null | undefined) {
      return fallbackClone(profile || undefined);
    },
    getArmorProfileForRarity(profile: ArmorMitigationProfile | null | undefined) {
      return fallbackClone(profile || undefined);
    },
    buildEquipmentWeaponProfile(equipment: RunEquipmentState | null | undefined, content: GameContent) {
      const item = equipment?.itemId ? content.itemCatalog?.[equipment.itemId] : null;
      return fallbackClone(item?.weaponProfile || undefined);
    },
    buildEquipmentArmorProfile(equipment: RunEquipmentState | null | undefined, content: GameContent) {
      const item = equipment?.itemId ? content.itemCatalog?.[equipment.itemId] : null;
      return fallbackClone(item?.armorProfile || undefined);
    },
    rollWeaponAffixes() {
      return undefined;
    },
    rollArmorAffixes() {
      return undefined;
    },
    rollItemRarity() {
      return "white";
    },
    generateRarityBonuses() {
      return {};
    },
  };
  const itemCatalogProfiles = runtimeWindow.__ROUGE_ITEM_CATALOG_PROFILES || FALLBACK_ITEM_CATALOG_PROFILES;
  const {
    RARITY,
    normalizeRarity,
    getRarityKind,
    getRarityLabel,
    cloneWeaponProfile,
    cloneArmorProfile,
    getWeaponProfileForRarity,
    buildEquipmentWeaponProfile,
    getArmorProfileForRarity,
    buildEquipmentArmorProfile,
    rollItemRarity,
    generateRarityBonuses,
    rollWeaponAffixes,
    rollArmorAffixes,
  } = itemCatalogProfiles;
  const { createRuntimeContent } = runtimeWindow.__ROUGE_ITEM_CATALOG_RUNTIME_CONTENT;

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

  function isRunewordCompatibleWithEquipment(
    equipment: RunEquipmentState | null | undefined,
    runeword: RuntimeRunewordDefinition | null | undefined,
    content: GameContent
  ) {
    if (!equipment || !runeword) {
      return false;
    }
    return isRunewordCompatibleWithItem(getItemDefinition(content, equipment.itemId), runeword);
  }

  function isRuneAllowedInSlot(rune: RuntimeRuneDefinition | null | undefined, slot: string) {
    return Array.isArray(rune?.allowedSlots) && rune.allowedSlots.includes(slot as EquipmentSlot);
  }

  function resolveRunewordId(equipment: RunEquipmentState | null | undefined, content: GameContent) {
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

  function getPreferredRunewordForEquipment(
    equipment: RunEquipmentState | null | undefined,
    run: RunState,
    content: GameContent,
    preferredRunewordId: string = ""
  ) {
    if (!equipment) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item) {
      return null;
    }

    const actNumber = Math.max(1, toNumber(run?.actNumber, 1));
    const targetTier = clamp(
      actNumber + (actNumber >= 4 ? 2 : 1),
      1,
      8
    );
    const matchingRunewords = (Object.values(content.runewordCatalog || {}) as RuntimeRunewordDefinition[]).filter((runeword) => {
      return isRunewordCompatibleWithItem(item, runeword);
    });

    const preferredRuneword = getRunewordDefinition(content, preferredRunewordId);
    if (preferredRuneword && matchingRunewords.some((runeword) => runeword.id === preferredRuneword.id)) {
      return preferredRuneword;
    }

    const getRunewordPowerScore = (runeword: RuntimeRunewordDefinition) => {
      return Object.values(runeword?.bonuses || {}).reduce((sum, value) => {
        return sum + Math.max(0, toNumber(value, 0));
      }, 0);
    };

    const getPreferredMatchForState = (equipmentState: RunEquipmentState) => {
      return (
        [...matchingRunewords]
          .sort((left: RuntimeRunewordDefinition, right: RuntimeRunewordDefinition) => {
            const leftPrefix = left.requiredRunes.reduce((total: number, runeId: string, index: number) => {
              return total + (equipmentState.insertedRunes[index] === runeId ? 1 : 0);
            }, 0);
            const rightPrefix = right.requiredRunes.reduce((total: number, runeId: string, index: number) => {
              return total + (equipmentState.insertedRunes[index] === runeId ? 1 : 0);
            }, 0);
            if (leftPrefix !== rightPrefix) {
              return rightPrefix - leftPrefix;
            }

            const leftTierDistance = Math.abs(toNumber(left.progressionTier, 1) - targetTier);
            const rightTierDistance = Math.abs(toNumber(right.progressionTier, 1) - targetTier);
            if (leftTierDistance !== rightTierDistance) {
              return leftTierDistance - rightTierDistance;
            }

            const leftSpecificity = Math.max(0, 8 - Math.max(1, left.familyAllowList?.length || 1));
            const rightSpecificity = Math.max(0, 8 - Math.max(1, right.familyAllowList?.length || 1));
            if (leftSpecificity !== rightSpecificity) {
              return rightSpecificity - leftSpecificity;
            }

            const leftPowerScore = getRunewordPowerScore(left);
            const rightPowerScore = getRunewordPowerScore(right);
            if (leftPowerScore !== rightPowerScore) {
              return rightPowerScore - leftPowerScore;
            }

            return toNumber(left.progressionTier, 1) - toNumber(right.progressionTier, 1);
          })
          .shift() || null
      );
    };

    const preferredMatch = getPreferredMatchForState(equipment);
    if (!equipment.runewordId) {
      return preferredMatch;
    }

    const blankProjectMatch = getPreferredMatchForState({
      ...equipment,
      insertedRunes: [],
      runewordId: "",
    } as RunEquipmentState);
    const currentRuneword = getRunewordDefinition(content, equipment.runewordId);
    if (!blankProjectMatch || !currentRuneword || blankProjectMatch.id === currentRuneword.id) {
      return preferredMatch;
    }

    const currentTierDistance = Math.abs(toNumber(currentRuneword.progressionTier, 1) - targetTier);
    const blankTierDistance = Math.abs(toNumber(blankProjectMatch.progressionTier, 1) - targetTier);
    const currentPowerScore = getRunewordPowerScore(currentRuneword);
    const blankPowerScore = getRunewordPowerScore(blankProjectMatch);
    const currentTier = toNumber(currentRuneword.progressionTier, 1);
    const blankTier = toNumber(blankProjectMatch.progressionTier, 1);

    if (
      blankTier > currentTier ||
      blankTierDistance < currentTierDistance ||
      blankPowerScore > currentPowerScore + 1
    ) {
      return blankProjectMatch;
    }

    return preferredMatch;
  }

  function getRuneRewardPool(slot: "weapon" | "armor") {
    return [...(RUNE_REWARD_POOLS[slot] || [])];
  }

  function getWeaponFamily(itemId: string, content: GameContent) {
    const item = getItemDefinition(content, itemId);
    return item?.family || "";
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
