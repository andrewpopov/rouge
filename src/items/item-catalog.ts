(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ITEM_TEMPLATES, RUNE_TEMPLATES, RUNEWORD_TEMPLATES, RUNE_REWARD_POOLS } = runtimeWindow.ROUGE_ITEM_DATA;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uniquePush(list, value) {
    if (value && !list.includes(value)) {
      list.push(value);
    }
  }

  function toNumber(value, fallback = 0) {
    return Number.parseInt(String(value ?? fallback), 10) || fallback;
  }

  function toItemDefinition(seedEntry, templateId, template) {
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: seedEntry?.name || template.sourceId,
      slot: template.slot,
      family: seedEntry?.family || template.family || (template.slot === "weapon" ? "Weapons" : "Body Armor"),
      summary: seedEntry?.summary || "A salvaged piece of gear adapted for Rouge's persistent build growth.",
      actRequirement: template.actRequirement,
      progressionTier: template.progressionTier,
      maxSockets: clamp(toNumber(seedEntry?.stats?.socketsMax, 2), 0, 3),
      bonuses: { ...template.bonuses },
    };
  }

  function toRuneDefinition(seedEntry, templateId, template) {
    return {
      id: templateId,
      sourceId: template.sourceId,
      name: seedEntry?.name || template.sourceId,
      allowedSlots: [...template.allowedSlots],
      rank: seedEntry?.rank || 1,
      progressionTier: template.progressionTier,
      summary: seedEntry?.summary || "A socketable rune adapted for Rouge's runeword seam.",
      bonuses: { ...template.bonuses },
    };
  }

  function toRunewordDefinition(seedEntry, runewordId, template, runeCatalog) {
    const progressionTier = template.requiredRunes.reduce((highestTier, runeId) => {
      const rune = runeCatalog?.[runeId] || null;
      return Math.max(highestTier, toNumber(rune?.progressionTier, 1));
    }, 1);
    return {
      id: runewordId,
      sourceId: template.sourceId,
      name: seedEntry?.name || runewordId,
      slot: template.slot,
      familyAllowList: [...(template.familyAllowList || [])],
      progressionTier,
      socketCount: template.requiredRunes.length,
      requiredRunes: [...template.requiredRunes],
      summary: seedEntry?.summary || "A simplified runeword route for Rouge's progression layer.",
      bonuses: { ...template.bonuses },
    };
  }

  function createRuntimeContent(baseContent, seedBundle) {
    const itemEntries = Array.isArray(seedBundle?.items?.entries) ? seedBundle.items.entries : [];
    const runeEntries = Array.isArray(seedBundle?.runes?.entries) ? seedBundle.runes.entries : [];
    const runewordEntries = Array.isArray(seedBundle?.runewords?.entries) ? seedBundle.runewords.entries : [];
    const itemCatalog = {};
    const runeCatalog = {};
    const runewordCatalog = {};

    Object.entries(ITEM_TEMPLATES).forEach(([templateId, template]) => {
      const seedEntry = itemEntries.find((entry) => entry.id === template.sourceId) || null;
      itemCatalog[templateId] = toItemDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNE_TEMPLATES).forEach(([templateId, template]) => {
      const seedEntry = runeEntries.find((entry) => entry.id === template.sourceId) || null;
      runeCatalog[templateId] = toRuneDefinition(seedEntry, templateId, template);
    });

    Object.entries(RUNEWORD_TEMPLATES).forEach(([runewordId, template]) => {
      const seedEntry = runewordEntries.find((entry) => entry.id === template.sourceId) || null;
      runewordCatalog[runewordId] = toRunewordDefinition(seedEntry, runewordId, template, runeCatalog);
    });

    return {
      ...baseContent,
      itemCatalog,
      runeCatalog,
      runewordCatalog,
    };
  }

  function getItemDefinition(content, itemId) {
    return content.itemCatalog?.[itemId] || null;
  }

  function getRuneDefinition(content, runeId) {
    return content.runeCatalog?.[runeId] || null;
  }

  function getRunewordDefinition(content, runewordId) {
    return content.runewordCatalog?.[runewordId] || null;
  }

  function isRunewordCompatibleWithItem(item, runeword) {
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

  function isRunewordCompatibleWithEquipment(equipment, runeword, content) {
    if (!equipment || !runeword) {
      return false;
    }
    return isRunewordCompatibleWithItem(getItemDefinition(content, equipment.itemId), runeword);
  }

  function isRuneAllowedInSlot(rune, slot) {
    return Array.isArray(rune?.allowedSlots) && rune.allowedSlots.includes(slot);
  }

  function resolveRunewordId(equipment, content) {
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
      return runeword.requiredRunes.every((runeId, index) => equipment.insertedRunes[index] === runeId);
    });

    return match?.id || "";
  }

  function normalizeEquipmentState(value, slot, content, legacyRuneId = "") {
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

    const item = getItemDefinition(content, candidate.itemId);
    if (!item || item.slot !== slot) {
      return null;
    }

    let socketsUnlocked = clamp(toNumber(candidate.socketsUnlocked, 0), 0, item.maxSockets);
    const insertedRunes = Array.isArray(candidate.insertedRunes)
      ? candidate.insertedRunes
          .map((runeId) => getRuneDefinition(content, runeId))
          .filter((rune) => rune && isRuneAllowedInSlot(rune, slot))
          .slice(0, socketsUnlocked)
          .map((rune) => rune.id)
      : [];

    socketsUnlocked = Math.max(socketsUnlocked, insertedRunes.length);

    const equipment = {
      entryId: typeof candidate.entryId === "string" ? candidate.entryId : "",
      itemId: item.id,
      slot,
      socketsUnlocked,
      insertedRunes,
      runewordId: "",
      rarity: candidate.rarity || "white",
      rarityBonuses: candidate.rarityBonuses || {},
    };

    equipment.runewordId = resolveRunewordId(equipment, content);
    return equipment;
  }

  function buildHydratedLoadout(run, content) {
    const source = run?.loadout || {};
    return {
      weapon: normalizeEquipmentState(source.weapon, "weapon", content, source.weaponRune || ""),
      armor: normalizeEquipmentState(source.armor, "armor", content, source.armorRune || ""),
    };
  }

  function getPreferredRunewordForEquipment(equipment, run, content, preferredRunewordId = "") {
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
        .sort((left, right) => {
          const leftPrefix = left.requiredRunes.reduce((total, runeId, index) => {
            return total + (equipment.insertedRunes[index] === runeId ? 1 : 0);
          }, 0);
          const rightPrefix = right.requiredRunes.reduce((total, runeId, index) => {
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

  function getRuneRewardPool(slot) {
    return [...(RUNE_REWARD_POOLS[slot] || [])];
  }

  function getWeaponFamily(itemId, content) {
    const item = getItemDefinition(content, itemId);
    return item?.family || "";
  }

  const EXTRA_BONUS_POOL = [
    { heroDamageBonus: 1 }, { heroDamageBonus: 2 }, { heroGuardBonus: 1 }, { heroGuardBonus: 2 },
    { heroBurnBonus: 1 }, { heroBurnBonus: 2 }, { heroMaxLife: 3 }, { heroMaxLife: 6 },
    { heroMaxEnergy: 1 }, { heroPotionHeal: 1 }, { heroPotionHeal: 2 },
    { mercenaryAttack: 1 }, { mercenaryAttack: 2 }, { mercenaryMaxLife: 3 }, { mercenaryMaxLife: 6 },
  ];

  function rollItemRarity(zoneKind, randomFn) {
    const roll = randomFn();
    if (zoneKind === "boss") return roll < 0.30 ? "white" : roll < 0.70 ? "yellow" : "brown";
    if (zoneKind === "miniboss") return roll < 0.50 ? "white" : roll < 0.85 ? "yellow" : "brown";
    return roll < 0.70 ? "white" : roll < 0.95 ? "yellow" : "brown";
  }

  function generateRarityBonuses(itemDef, rarity, randomFn) {
    if (!itemDef || rarity === "white" || !rarity) return {};
    const multiplier = rarity === "brown" ? 1.5 : 1.3;
    const extraLineCount = rarity === "brown" ? 2 : 1;
    const scaled = {};
    Object.entries(itemDef.bonuses || {}).forEach(([key, value]) => {
      const base = toNumber(value, 0);
      const boosted = Math.ceil(base * multiplier);
      if (boosted > base) scaled[key] = boosted - base;
    });
    for (let i = 0; i < extraLineCount; i++) {
      const pick = EXTRA_BONUS_POOL[Math.floor(randomFn() * EXTRA_BONUS_POOL.length)];
      Object.entries(pick).forEach(([key, value]) => { scaled[key] = (scaled[key] || 0) + value; });
    }
    return scaled;
  }

  runtimeWindow.ROUGE_ITEM_CATALOG = {
    clamp,
    uniquePush,
    toNumber,
    createRuntimeContent,
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
