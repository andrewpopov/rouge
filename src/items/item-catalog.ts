(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;
  const { ITEM_TEMPLATES, RUNE_TEMPLATES, RUNEWORD_TEMPLATES, RUNE_REWARD_POOLS } = runtimeWindow.ROUGE_ITEM_DATA;
  const { clamp, toNumber, uniquePush } = runtimeWindow.ROUGE_UTILS;

  const RARITY = { WHITE: "white", MAGIC: "yellow", UNIQUE: "brown", SET: "green" } as const;

  const SLOT_FAMILY_DEFAULTS: Record<EquipmentSlot, string> = {
    weapon: "Weapons", armor: "Body Armor", helm: "Helms", shield: "Shields",
    gloves: "Gloves", boots: "Boots", belt: "Belts", ring: "Rings", amulet: "Amulets",
  };

  function toItemDefinition(seedEntry: Record<string, unknown> | null, templateId: string, template: ItemTemplateDefinition) {
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: (seedEntry?.name as string) || template.sourceId,
      slot: template.slot as EquipmentSlot,
      family: (seedEntry?.family as string) || template.family || (SLOT_FAMILY_DEFAULTS[template.slot as EquipmentSlot] || "Gear"),
      summary: (seedEntry?.summary as string) || "A salvaged piece of gear adapted for Rouge's persistent build growth.",
      actRequirement: template.actRequirement,
      progressionTier: template.progressionTier,
      maxSockets: clamp(toNumber((seedEntry?.stats as Record<string, unknown>)?.socketsMax, 2), 0, 3),
      bonuses: { ...template.bonuses },
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
      summary: (seedEntry?.summary as string) || "A socketable rune adapted for Rouge's runeword seam.",
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
      summary: (seedEntry?.summary as string) || "A simplified runeword route for Rouge's progression layer.",
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

    const equipment = {
      entryId: typeof obj.entryId === "string" ? obj.entryId : "",
      itemId: item.id,
      slot,
      socketsUnlocked,
      insertedRunes,
      runewordId: "",
      rarity: (obj.rarity as string) || RARITY.WHITE,
      rarityBonuses: (obj.rarityBonuses as ItemBonusSet) || {},
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

  function rollItemRarity(zoneKind: string, randomFn: RandomFn) {
    const roll = randomFn();
    if (zoneKind === ZONE_KIND.BOSS) {
      if (roll < 0.30) { return RARITY.WHITE; }
      return roll < 0.70 ? RARITY.MAGIC : RARITY.UNIQUE;
    }
    if (zoneKind === ZONE_KIND.MINIBOSS) {
      if (roll < 0.50) { return RARITY.WHITE; }
      return roll < 0.85 ? RARITY.MAGIC : RARITY.UNIQUE;
    }
    if (roll < 0.70) { return RARITY.WHITE; }
    return roll < 0.95 ? RARITY.MAGIC : RARITY.UNIQUE;
  }

  function generateRarityBonuses(itemDef: RuntimeItemDefinition | null, rarity: string, randomFn: RandomFn) {
    if (!itemDef || rarity === RARITY.WHITE || !rarity) { return {}; }
    const multiplier = rarity === RARITY.UNIQUE ? 1.5 : 1.3;
    const extraLineCount = rarity === RARITY.UNIQUE ? 2 : 1;
    const scaled: Record<string, number> = {};
    Object.entries(itemDef.bonuses || {}).forEach(([key, value]: [string, number]) => {
      const base = toNumber(value, 0);
      const boosted = Math.ceil(base * multiplier);
      if (boosted > base) { scaled[key] = boosted - base; }
    });
    for (let i = 0; i < extraLineCount; i++) {
      const pick = EXTRA_BONUS_POOL[Math.floor(randomFn() * EXTRA_BONUS_POOL.length)];
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
    getRuneRewardPool,
    getWeaponFamily,
    rollItemRarity,
    generateRarityBonuses,
  };
})();
