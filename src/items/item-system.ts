/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const ITEM_TEMPLATES = {
    item_short_sword: {
      sourceId: "short_sword",
      slot: "weapon",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroDamageBonus: 1,
        mercenaryAttack: 1,
      },
    },
    item_scimitar: {
      sourceId: "scimitar",
      slot: "weapon",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroDamageBonus: 2,
        heroGuardBonus: 1,
      },
    },
    item_sabre: {
      sourceId: "sabre",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroDamageBonus: 2,
        heroBurnBonus: 1,
      },
    },
    item_falchion: {
      sourceId: "falchion",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroDamageBonus: 3,
        heroGuardBonus: 1,
      },
    },
    item_crystal_sword: {
      sourceId: "crystal_sword",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroDamageBonus: 3,
        heroMaxEnergy: 1,
      },
    },
    item_broad_sword: {
      sourceId: "broad_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroDamageBonus: 4,
        heroGuardBonus: 2,
      },
    },
    item_war_sword: {
      sourceId: "war_sword",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroDamageBonus: 4,
        heroBurnBonus: 2,
      },
    },
    item_wand: {
      sourceId: "wand",
      slot: "weapon",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxEnergy: 1,
        heroBurnBonus: 2,
      },
    },
    item_yew_wand: {
      sourceId: "yew_wand",
      slot: "weapon",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxEnergy: 1,
        heroBurnBonus: 1,
      },
    },
    item_bone_wand: {
      sourceId: "bone_wand",
      slot: "weapon",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxEnergy: 2,
        heroBurnBonus: 2,
      },
    },
    item_gnarled_staff: {
      sourceId: "gnarled_staff",
      slot: "weapon",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxEnergy: 1,
        heroGuardBonus: 1,
      },
    },
    item_quilted_armor: {
      sourceId: "quilted_armor",
      slot: "armor",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroMaxLife: 6,
        heroGuardBonus: 1,
      },
    },
    item_breast_plate: {
      sourceId: "breast_plate",
      slot: "armor",
      actRequirement: 1,
      progressionTier: 1,
      bonuses: {
        heroMaxLife: 7,
        heroPotionHeal: 1,
      },
    },
    item_leather_armor: {
      sourceId: "leather_armor",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 8,
        heroPotionHeal: 2,
      },
    },
    item_scale_mail: {
      sourceId: "scale_mail",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 8,
        mercenaryMaxLife: 4,
      },
    },
    item_chain_mail: {
      sourceId: "chain_mail",
      slot: "armor",
      actRequirement: 2,
      progressionTier: 2,
      bonuses: {
        heroMaxLife: 9,
        heroGuardBonus: 1,
      },
    },
    item_ring_mail: {
      sourceId: "ring_mail",
      slot: "armor",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxLife: 10,
        mercenaryMaxLife: 6,
      },
    },
    item_splint_mail: {
      sourceId: "splint_mail",
      slot: "armor",
      actRequirement: 3,
      progressionTier: 3,
      bonuses: {
        heroMaxLife: 11,
        heroGuardBonus: 1,
      },
    },
    item_plate_mail: {
      sourceId: "plate_mail",
      slot: "armor",
      actRequirement: 4,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 13,
        mercenaryMaxLife: 6,
      },
    },
    item_gothic_plate: {
      sourceId: "gothic_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 5,
      bonuses: {
        heroMaxLife: 15,
        heroGuardBonus: 2,
      },
    },
    item_light_plate: {
      sourceId: "light_plate",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 4,
      bonuses: {
        heroMaxLife: 12,
        heroGuardBonus: 2,
      },
    },
    item_full_plate_mail: {
      sourceId: "full_plate_mail",
      slot: "armor",
      actRequirement: 5,
      progressionTier: 6,
      bonuses: {
        heroMaxLife: 18,
        heroGuardBonus: 2,
        heroPotionHeal: 2,
      },
    },
  };

  const RUNE_TEMPLATES = {
    rune_el: {
      sourceId: "el",
      progressionTier: 1,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        heroGuardBonus: 1,
      },
    },
    rune_eld: {
      sourceId: "eld",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroPotionHeal: 2,
      },
    },
    rune_tir: {
      sourceId: "tir",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxEnergy: 1,
      },
    },
    rune_eth: {
      sourceId: "eth",
      progressionTier: 2,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 4,
      },
    },
    rune_ith: {
      sourceId: "ith",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
      },
    },
    rune_nef: {
      sourceId: "nef",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        mercenaryAttack: 1,
      },
    },
    rune_tal: {
      sourceId: "tal",
      progressionTier: 3,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 1,
      },
    },
    rune_ral: {
      sourceId: "ral",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 2,
      },
    },
    rune_ort: {
      sourceId: "ort",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroBurnBonus: 2,
        heroMaxEnergy: 1,
      },
    },
    rune_thul: {
      sourceId: "thul",
      progressionTier: 4,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroGuardBonus: 1,
        heroMaxLife: 2,
      },
    },
    rune_amn: {
      sourceId: "amn",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 2,
        heroMaxLife: 2,
      },
    },
    rune_sol: {
      sourceId: "sol",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroGuardBonus: 2,
        mercenaryMaxLife: 2,
      },
    },
    rune_shael: {
      sourceId: "shael",
      progressionTier: 5,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroDamageBonus: 1,
        heroGuardBonus: 2,
      },
    },
    rune_hel: {
      sourceId: "hel",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxEnergy: 2,
        heroPotionHeal: 2,
      },
    },
    rune_lum: {
      sourceId: "lum",
      progressionTier: 6,
      allowedSlots: ["weapon", "armor"],
      bonuses: {
        heroMaxLife: 5,
        heroGuardBonus: 1,
      },
    },
  };

  const RUNEWORD_TEMPLATES = {
    steel: {
      sourceId: "steel",
      slot: "weapon",
      familyAllowList: ["Swords"],
      requiredRunes: ["rune_tir", "rune_el"],
      bonuses: {
        heroDamageBonus: 3,
        mercenaryAttack: 1,
      },
    },
    stealth: {
      sourceId: "stealth",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_tal", "rune_eth"],
      bonuses: {
        heroMaxLife: 6,
        heroMaxEnergy: 1,
        heroGuardBonus: 2,
      },
    },
    malice: {
      sourceId: "malice",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Scepters", "Staves"],
      requiredRunes: ["rune_ith", "rune_el", "rune_eth"],
      bonuses: {
        heroDamageBonus: 5,
        heroBurnBonus: 1,
      },
    },
    strength: {
      sourceId: "strength",
      slot: "weapon",
      familyAllowList: ["Swords", "Maces", "Polearms", "Scepters", "Staves"],
      requiredRunes: ["rune_amn", "rune_tir"],
      bonuses: {
        heroDamageBonus: 4,
        heroMaxLife: 4,
      },
    },
    smoke: {
      sourceId: "smoke",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_nef", "rune_lum"],
      bonuses: {
        heroMaxLife: 10,
        heroGuardBonus: 3,
      },
    },
    myth: {
      sourceId: "myth",
      slot: "armor",
      familyAllowList: ["Body Armor"],
      requiredRunes: ["rune_hel", "rune_amn", "rune_nef"],
      bonuses: {
        heroMaxLife: 8,
        heroGuardBonus: 2,
        mercenaryAttack: 1,
      },
    },
  };

  const RUNE_REWARD_POOLS = {
    weapon: ["rune_el", "rune_tir", "rune_ith", "rune_nef", "rune_tal", "rune_ral", "rune_ort", "rune_amn", "rune_shael"],
    armor: ["rune_el", "rune_eth", "rune_eld", "rune_tir", "rune_tal", "rune_nef", "rune_thul", "rune_sol", "rune_lum"],
  };

  function createDefaultTraining() {
    return {
      vitality: 0,
      focus: 0,
      command: 0,
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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
      family: seedEntry?.family || (template.slot === "weapon" ? "Weapons" : "Body Armor"),
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

  function toRunewordDefinition(seedEntry, runewordId, template) {
    return {
      id: runewordId,
      sourceId: template.sourceId,
      name: seedEntry?.name || runewordId,
      slot: template.slot,
      familyAllowList: [...(template.familyAllowList || [])],
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
      runewordCatalog[runewordId] = toRunewordDefinition(seedEntry, runewordId, template);
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

  function hydrateRunLoadout(run, content) {
    run.loadout = buildHydratedLoadout(run, content);
    syncRunewordTracking(run, content);
  }

  function syncRunewordTracking(run, content) {
    run.progression = run.progression || {
      bossTrophies: [],
      activatedRunewords: [],
      skillPointsAvailable: 0,
      trainingPointsSpent: 0,
      classPointsAvailable: 0,
      classPointsSpent: 0,
      attributePointsAvailable: 0,
      attributePointsSpent: 0,
      attributes: {
        strength: 0,
        dexterity: 0,
        vitality: 0,
        energy: 0,
      },
      classProgression: {
        favoredTreeId: "",
        treeRanks: {},
        unlockedSkillIds: [],
      },
      training: createDefaultTraining(),
    };
    run.progression.skillPointsAvailable = toNumber(run.progression.skillPointsAvailable, 0);
    run.progression.trainingPointsSpent = toNumber(run.progression.trainingPointsSpent, 0);
    run.progression.classPointsAvailable = toNumber(run.progression.classPointsAvailable, 0);
    run.progression.classPointsSpent = toNumber(run.progression.classPointsSpent, 0);
    run.progression.attributePointsAvailable = toNumber(run.progression.attributePointsAvailable, 0);
    run.progression.attributePointsSpent = toNumber(run.progression.attributePointsSpent, 0);
    run.progression.attributes = {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      energy: 0,
      ...(run.progression.attributes || {}),
    };
    run.progression.classProgression = {
      favoredTreeId: "",
      ...(run.progression.classProgression || {}),
      treeRanks: { ...(run.progression.classProgression?.treeRanks || {}) },
      unlockedSkillIds: Array.isArray(run.progression.classProgression?.unlockedSkillIds)
        ? [...run.progression.classProgression.unlockedSkillIds]
        : [],
    };
    run.progression.training = {
      ...createDefaultTraining(),
      ...(run.progression.training || {}),
    };
    run.summary = {
      encountersCleared: 0,
      zonesCleared: 0,
      actsCleared: 0,
      goldGained: 0,
      xpGained: 0,
      levelsGained: 0,
      skillPointsEarned: 0,
      classPointsEarned: 0,
      attributePointsEarned: 0,
      trainingRanksGained: 0,
      bossesDefeated: 0,
      runewordsForged: 0,
      ...(run.summary || {}),
    };

    const activeIds = [];
    ["weapon", "armor"].forEach((slot) => {
      const equipment = run.loadout?.[slot] || null;
      if (!equipment) {
        return;
      }
      equipment.runewordId = resolveRunewordId(equipment, content);
      if (equipment.runewordId) {
        activeIds.push(equipment.runewordId);
      }
    });

    const merged = Array.from(new Set([...(run.progression.activatedRunewords || []), ...activeIds]));
    run.progression.activatedRunewords = merged;
    run.summary.runewordsForged = Math.max(toNumber(run.summary.runewordsForged, 0), merged.length);
  }

  function createDefaultInventory() {
    return {
      nextEntryId: 1,
      carried: [],
    };
  }

  function createDefaultTownState() {
    return {
      vendor: {
        refreshCount: 0,
        stock: [],
      },
    };
  }

  function cloneEquipmentState(equipment) {
    if (!equipment) {
      return null;
    }
    return {
      entryId: equipment.entryId || "",
      itemId: equipment.itemId,
      slot: equipment.slot,
      socketsUnlocked: toNumber(equipment.socketsUnlocked, 0),
      insertedRunes: Array.isArray(equipment.insertedRunes) ? [...equipment.insertedRunes] : [],
      runewordId: equipment.runewordId || "",
    };
  }

  function cloneInventoryEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    if (entry.kind === "rune") {
      return {
        entryId: entry.entryId || "",
        kind: "rune",
        runeId: entry.runeId || "",
      };
    }
    return {
      entryId: entry.entryId || "",
      kind: "equipment",
      equipment: cloneEquipmentState(entry.equipment || entry),
    };
  }

  function allocateInventoryEntryId(run) {
    run.inventory = run.inventory || createDefaultInventory();
    const nextId = Math.max(1, toNumber(run.inventory.nextEntryId, 1));
    run.inventory.nextEntryId = nextId + 1;
    return `inv_${run.id}_${nextId}`;
  }

  function ensureEquipmentEntryId(run, equipment) {
    if (!equipment) {
      return "";
    }
    if (!equipment.entryId) {
      equipment.entryId = allocateInventoryEntryId(run);
    }
    return equipment.entryId;
  }

  function normalizeInventoryEntry(entry, run, content, fallbackId = "") {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    if (entry.kind === "rune" || entry.runeId) {
      const rune = getRuneDefinition(content, entry.runeId);
      if (!rune) {
        return null;
      }
      return {
        entryId: entry.entryId || fallbackId || allocateInventoryEntryId(run),
        kind: "rune",
        runeId: rune.id,
      };
    }

    const rawEquipment = entry.equipment || entry;
    const slot = rawEquipment.slot || getItemDefinition(content, rawEquipment.itemId)?.slot || "weapon";
    const equipment = normalizeEquipmentState(rawEquipment, slot, content);
    if (!equipment) {
      return null;
    }
    equipment.entryId = entry.entryId || equipment.entryId || fallbackId || allocateInventoryEntryId(run);
    return {
      entryId: equipment.entryId,
      kind: "equipment",
      equipment,
    };
  }

  function normalizeProfileStashEntry(entry, content, fallbackId = "") {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    if (entry.kind === "rune" || entry.runeId) {
      const rune = getRuneDefinition(content, entry.runeId);
      if (!rune) {
        return null;
      }
      return {
        entryId: entry.entryId || fallbackId || "",
        kind: "rune",
        runeId: rune.id,
      };
    }

    const rawEquipment = entry.equipment || entry;
    const slot = rawEquipment.slot || getItemDefinition(content, rawEquipment.itemId)?.slot || "weapon";
    const equipment = normalizeEquipmentState(rawEquipment, slot, content);
    if (!equipment) {
      return null;
    }

    equipment.entryId = entry.entryId || equipment.entryId || fallbackId || "";
    return {
      entryId: equipment.entryId,
      kind: "equipment",
      equipment,
    };
  }

  function hydrateProfileStash(profile, content) {
    profile.stash = profile.stash || { entries: [] };

    const seenEntryIds = new Set();
    let fallbackIndex = 0;
    const normalized = (Array.isArray(profile.stash.entries) ? profile.stash.entries : [])
      .map((entry) => {
        fallbackIndex += 1;
        return normalizeProfileStashEntry(entry, content, `stash_${fallbackIndex}`);
      })
      .filter(Boolean);

    profile.stash.entries = normalized.map((entry, index) => {
      const baseId = entry.entryId || `stash_${index + 1}`;
      let nextId = baseId;
      let suffix = 1;
      while (seenEntryIds.has(nextId)) {
        nextId = `${baseId}_${suffix}`;
        suffix += 1;
      }
      seenEntryIds.add(nextId);

      if (entry.kind === "equipment") {
        return {
          entryId: nextId,
          kind: "equipment",
          equipment: {
            ...cloneEquipmentState(entry.equipment),
            entryId: nextId,
          },
        };
      }

      return {
        entryId: nextId,
        kind: "rune",
        runeId: entry.runeId,
      };
    });
  }

  function getEntryLabel(entry, content) {
    if (!entry) {
      return "Unknown";
    }
    if (entry.kind === "rune") {
      return getRuneDefinition(content, entry.runeId)?.name || entry.runeId;
    }
    return getItemDefinition(content, entry.equipment?.itemId || "")?.name || entry.equipment?.itemId || entry.entryId;
  }

  function getEquipmentValue(equipment, content) {
    const item = getItemDefinition(content, equipment?.itemId || "");
    return (
      Math.max(8, toNumber(item?.progressionTier, 1) * 18) +
      toNumber(equipment?.socketsUnlocked, 0) * 6 +
      (Array.isArray(equipment?.insertedRunes) ? equipment.insertedRunes.length : 0) * 10 +
      (equipment?.runewordId ? 16 : 0)
    );
  }

  function getRuneValue(runeId, content) {
    const rune = getRuneDefinition(content, runeId);
    return Math.max(6, toNumber(rune?.progressionTier, 1) * 12 + toNumber(rune?.rank, 1) * 4);
  }

  function getEntryBuyPrice(entry, content) {
    if (entry.kind === "rune") {
      return Math.max(10, Math.floor(getRuneValue(entry.runeId, content) * 1.75));
    }
    return Math.max(14, Math.floor(getEquipmentValue(entry.equipment, content) * 1.6));
  }

  function getEntrySellPrice(entry, content) {
    if (entry.kind === "rune") {
      return Math.max(4, Math.floor(getRuneValue(entry.runeId, content) * 0.75));
    }
    return Math.max(6, Math.floor(getEquipmentValue(entry.equipment, content) * 0.65));
  }

  function buildBareEquipment(equipment, content) {
    const normalized = normalizeEquipmentState(
      {
        entryId: equipment.entryId,
        itemId: equipment.itemId,
        slot: equipment.slot,
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
      equipment.slot,
      content
    );
    if (!normalized) {
      return null;
    }
    normalized.entryId = equipment.entryId;
    return normalized;
  }

  function getPreservedSlotProgression(currentEquipment, nextItemId, content) {
    if (!currentEquipment) {
      return {
        socketsUnlocked: 0,
        insertedRunes: [],
      };
    }

    const nextItem = getItemDefinition(content, nextItemId);
    const preservedSockets = clamp(toNumber(currentEquipment.socketsUnlocked, 0), 0, nextItem?.maxSockets || 0);
    const preservedRunes = Array.isArray(currentEquipment.insertedRunes)
      ? currentEquipment.insertedRunes
          .map((runeId) => getRuneDefinition(content, runeId))
          .filter((rune) => rune && isRuneAllowedInSlot(rune, nextItem?.slot || currentEquipment.slot))
          .slice(0, preservedSockets)
          .map((rune) => rune.id)
      : [];

    return {
      socketsUnlocked: Math.max(preservedSockets, preservedRunes.length),
      insertedRunes: preservedRunes,
    };
  }

  function addEquipmentToInventory(run, itemId, content) {
    const item = getItemDefinition(content, itemId);
    if (!item) {
      return null;
    }
    const entryId = allocateInventoryEntryId(run);
    const entry = {
      entryId,
      kind: "equipment",
      equipment: {
        entryId,
        itemId: item.id,
        slot: item.slot,
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      },
    };
    run.inventory.carried.push(entry);
    return entry;
  }

  function addRuneToInventory(run, runeId, content) {
    const rune = getRuneDefinition(content, runeId);
    if (!rune) {
      return null;
    }
    const entry = {
      entryId: allocateInventoryEntryId(run),
      kind: "rune",
      runeId: rune.id,
    };
    run.inventory.carried.push(entry);
    return entry;
  }

  function findCarriedEntry(run, entryId) {
    return run.inventory?.carried?.find((entry) => entry.entryId === entryId) || null;
  }

  function removeCarriedEntry(run, entryId) {
    const index = run.inventory?.carried?.findIndex((entry) => entry.entryId === entryId) ?? -1;
    if (index < 0) {
      return null;
    }
    return run.inventory.carried.splice(index, 1)[0] || null;
  }

  function removeStashEntry(profile, entryId) {
    const index = profile?.stash?.entries?.findIndex((entry) => entry.entryId === entryId) ?? -1;
    if (index < 0) {
      return null;
    }
    return profile.stash.entries.splice(index, 1)[0] || null;
  }

  function equipInventoryEntry(run, entryId, content) {
    const entry = findCarriedEntry(run, entryId);
    if (!entry || entry.kind !== "equipment") {
      return { ok: false, message: "That equipment entry is not available." };
    }

    const nextEquipment = cloneEquipmentState(entry.equipment);
    const currentEquipment = run.loadout[nextEquipment.slot];
    const carriedProgress = getPreservedSlotProgression(currentEquipment, nextEquipment.itemId, content);
    nextEquipment.socketsUnlocked = carriedProgress.socketsUnlocked;
    nextEquipment.insertedRunes = carriedProgress.insertedRunes;
    nextEquipment.runewordId = resolveRunewordId(nextEquipment, content);

    removeCarriedEntry(run, entryId);
    if (currentEquipment) {
      ensureEquipmentEntryId(run, currentEquipment);
      const unequippedEquipment = buildBareEquipment(currentEquipment, content);
      if (unequippedEquipment) {
        run.inventory.carried.push({
          entryId: unequippedEquipment.entryId,
          kind: "equipment",
          equipment: unequippedEquipment,
        });
      }
    }

    run.loadout[nextEquipment.slot] = nextEquipment;
    syncRunewordTracking(run, content);
    return { ok: true, message: `${getEntryLabel(entry, content)} equipped.` };
  }

  function unequipSlot(run, slot, content) {
    const equipment = run.loadout?.[slot] || null;
    if (!equipment) {
      return { ok: false, message: "No equipment is equipped in that slot." };
    }

    run.inventory.carried.push({
      entryId: ensureEquipmentEntryId(run, equipment),
      kind: "equipment",
      equipment: cloneEquipmentState(equipment),
    });
    run.loadout[slot] = null;
    syncRunewordTracking(run, content);
    return { ok: true, message: "Equipment moved to inventory." };
  }

  function socketInventoryRune(run, entryId, slot, content) {
    const entry = findCarriedEntry(run, entryId);
    const equipment = run.loadout?.[slot] || null;
    const rune = getRuneDefinition(content, entry?.runeId || "");
    if (!entry || entry.kind !== "rune" || !equipment || !rune || !isRuneAllowedInSlot(rune, slot)) {
      return { ok: false, message: "That rune cannot be socketed right now." };
    }
    if (equipment.insertedRunes.length >= equipment.socketsUnlocked) {
      return { ok: false, message: "No open sockets remain on that item." };
    }

    removeCarriedEntry(run, entryId);
    equipment.insertedRunes.push(rune.id);
    equipment.runewordId = resolveRunewordId(equipment, content);
    syncRunewordTracking(run, content);
    return { ok: true, message: `${rune.name} socketed.` };
  }

  function stashCarriedEntry(run, profile, entryId) {
    const entry = removeCarriedEntry(run, entryId);
    if (!entry) {
      return { ok: false, message: "That inventory entry is no longer available." };
    }
    profile.stash.entries.push(cloneInventoryEntry(entry));
    return { ok: true, message: "Moved to stash." };
  }

  function withdrawStashEntry(run, profile, entryId) {
    const entry = removeStashEntry(profile, entryId);
    if (!entry) {
      return { ok: false, message: "That stash entry is no longer available." };
    }
    const cloned = cloneInventoryEntry(entry);
    run.inventory.carried.push(cloned);
    return { ok: true, message: "Moved to inventory." };
  }

  function sellCarriedEntry(run, entryId, content) {
    const entry = removeCarriedEntry(run, entryId);
    if (!entry) {
      return { ok: false, message: "That inventory entry is no longer available." };
    }
    const sellPrice = getEntrySellPrice(entry, content);
    run.gold += sellPrice;
    run.summary.goldGained += sellPrice;
    return { ok: true, message: `Sold for ${sellPrice} gold.` };
  }

  function getVendorRefreshCost(run) {
    return 10 + run.actNumber * 4 + toNumber(run.town?.vendor?.refreshCount, 0) * 6;
  }

  function buildVendorEntryId(run, index) {
    return `vendor_${run.actNumber}_${toNumber(run.town?.vendor?.refreshCount, 0)}_${index}`;
  }

  function getVendorTierAllowance(run) {
    return Math.min(2, Math.floor(Math.max(0, toNumber(run.level, 1) - 1) / 3)) + Math.min(1, toNumber(run.progression?.bossTrophies?.length, 0));
  }

  function generateVendorStock(run, content) {
    const tierAllowance = getVendorTierAllowance(run);
    const maxTier = Math.max(1, run.actNumber + tierAllowance);
    const itemSeed = run.actNumber * 13 + toNumber(run.town?.vendor?.refreshCount, 0) * 7 + run.level * 3 + run.summary.zonesCleared;
    const runeSeed = run.actNumber * 11 + toNumber(run.town?.vendor?.refreshCount, 0) * 5 + run.summary.encountersCleared;
    const weaponOptions = (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item) => item.slot === "weapon" && item.progressionTier <= maxTier)
      .sort((left, right) => left.progressionTier - right.progressionTier);
    const armorOptions = (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item) => item.slot === "armor" && item.progressionTier <= maxTier)
      .sort((left, right) => left.progressionTier - right.progressionTier);
    const runeOptions = (Object.values(content.runeCatalog || {}) as RuntimeRuneDefinition[])
      .filter((rune) => rune.progressionTier <= maxTier + 1)
      .sort((left, right) => left.progressionTier - right.progressionTier);

    const stock = [];
    const selectedWeapon = weaponOptions.length > 0 ? weaponOptions[itemSeed % weaponOptions.length] : null;
    const selectedArmor = armorOptions.length > 0 ? armorOptions[(itemSeed + 1) % armorOptions.length] : null;
    const selectedRuneOne = runeOptions.length > 0 ? runeOptions[runeSeed % runeOptions.length] : null;
    const selectedRuneTwo = runeOptions.length > 1 ? runeOptions[(runeSeed + 2) % runeOptions.length] : selectedRuneOne;

    [selectedWeapon, selectedArmor].filter(Boolean).forEach((item, index) => {
      stock.push({
        entryId: buildVendorEntryId(run, index),
        kind: "equipment",
        equipment: {
          entryId: "",
          itemId: item.id,
          slot: item.slot,
          socketsUnlocked: 0,
          insertedRunes: [],
          runewordId: "",
        },
      });
    });

    [selectedRuneOne, selectedRuneTwo].filter(Boolean).forEach((rune, index) => {
      stock.push({
        entryId: buildVendorEntryId(run, index + 2),
        kind: "rune",
        runeId: rune.id,
      });
    });

    return stock;
  }

  function normalizeVendorStock(run, content) {
    run.town = {
      ...createDefaultTownState(),
      ...(run.town || {}),
      vendor: {
        ...createDefaultTownState().vendor,
        ...(run.town?.vendor || {}),
      },
    };

    const stock = Array.isArray(run.town.vendor.stock) ? run.town.vendor.stock : [];
    const normalized = stock
      .map((entry, index) => normalizeInventoryEntry(entry, run, content, buildVendorEntryId(run, index)))
      .filter(Boolean);

    run.town.vendor.stock = normalized.length > 0 ? normalized : generateVendorStock(run, content);
  }

  function hydrateRunInventory(run, content) {
    const inventorySource = run.inventory || {};
    run.inventory = {
      ...createDefaultInventory(),
      ...inventorySource,
      nextEntryId: Math.max(1, toNumber(inventorySource?.nextEntryId, 1)),
      carried: [],
    };

    ["weapon", "armor"].forEach((slot) => {
      if (run.loadout?.[slot]) {
        ensureEquipmentEntryId(run, run.loadout[slot]);
      }
    });

    const normalizedCarried = (Array.isArray(inventorySource?.carried) ? inventorySource.carried : [])
      .map((entry) => normalizeInventoryEntry(entry, run, content))
      .filter(Boolean)
      .filter((entry) => {
        if (entry.kind !== "equipment") {
          return true;
        }
        return entry.entryId !== run.loadout?.weapon?.entryId && entry.entryId !== run.loadout?.armor?.entryId;
      });

    run.inventory.carried = normalizedCarried;
    normalizeVendorStock(run, content);
  }

  function describeBonuses(bonuses) {
    const lines = [];
    if (bonuses.heroDamageBonus) {
      lines.push(`Hero card damage +${bonuses.heroDamageBonus}.`);
    }
    if (bonuses.heroGuardBonus) {
      lines.push(`Guard skills +${bonuses.heroGuardBonus}.`);
    }
    if (bonuses.heroBurnBonus) {
      lines.push(`Burn application +${bonuses.heroBurnBonus}.`);
    }
    if (bonuses.heroMaxLife) {
      lines.push(`Hero max Life +${bonuses.heroMaxLife}.`);
    }
    if (bonuses.heroMaxEnergy) {
      lines.push(`Hero max Energy +${bonuses.heroMaxEnergy}.`);
    }
    if (bonuses.heroPotionHeal) {
      lines.push(`Potion healing +${bonuses.heroPotionHeal}.`);
    }
    if (bonuses.mercenaryAttack) {
      lines.push(`Mercenary attack +${bonuses.mercenaryAttack}.`);
    }
    if (bonuses.mercenaryMaxLife) {
      lines.push(`Mercenary max Life +${bonuses.mercenaryMaxLife}.`);
    }
    return lines;
  }

  function describeRunes(equipment, content) {
    if (!equipment || equipment.insertedRunes.length === 0) {
      return "No runes socketed.";
    }
    return equipment.insertedRunes
      .map((runeId) => getRuneDefinition(content, runeId)?.name || runeId)
      .join(" + ");
  }

  function describeEquipmentState(label, equipment, content) {
    if (!equipment) {
      return `${label}: None`;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const activeRuneword = getRunewordDefinition(content, resolveRunewordId(equipment, content));
    const runeSummary = describeRunes(equipment, content);

    return `${label}: ${item?.name || equipment.itemId} (${equipment.insertedRunes.length}/${equipment.socketsUnlocked}/${item?.maxSockets || 0} sockets) ${runeSummary}${activeRuneword ? ` [${activeRuneword.name}]` : ""}`;
  }

  function getActiveRunewords(run, content) {
    const loadout = buildHydratedLoadout(run, content);
    return [loadout.weapon, loadout.armor]
      .filter(Boolean)
      .map((equipment) => getRunewordDefinition(content, resolveRunewordId(equipment, content))?.name || "")
      .filter(Boolean);
  }

  function getLoadoutSummary(run, content) {
    const loadout = buildHydratedLoadout(run, content);
    const lines = [
      describeEquipmentState("Weapon", loadout.weapon, content),
      describeEquipmentState("Armor", loadout.armor, content),
    ];
    const activeRunewords = getActiveRunewords(run, content);
    if (activeRunewords.length > 0) {
      lines.push(`Runewords: ${activeRunewords.join(", ")}`);
    }
    return lines;
  }

  function getEquipmentProgressScore(equipment, content) {
    if (!equipment) {
      return 0;
    }
    const item = getItemDefinition(content, equipment.itemId);
    return (item?.progressionTier || 0) * 10 + equipment.socketsUnlocked * 2 + equipment.insertedRunes.length + (equipment.runewordId ? 5 : 0);
  }

  function getFocusSlots(run, actNumber, encounterNumber, content) {
    const loadout = buildHydratedLoadout(run, content);
    const baseOrder = (actNumber + encounterNumber + run.summary.encountersCleared) % 2 === 0 ? ["weapon", "armor"] : ["armor", "weapon"];
    return [...baseOrder].sort((left, right) => {
      const scoreDelta = getEquipmentProgressScore(loadout[left], content) - getEquipmentProgressScore(loadout[right], content);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return baseOrder.indexOf(left) - baseOrder.indexOf(right);
    });
  }

  function getProgressionTierAllowance(run, zone) {
    const levelAllowance = Math.min(2, Math.floor(Math.max(0, toNumber(run?.level, 1) - 1) / 2));
    const trophyAllowance = zone.kind === "boss" ? 1 : Math.min(1, toNumber(run?.progression?.bossTrophies?.length, 0));
    return levelAllowance + trophyAllowance;
  }

  function getAvailableItemsForSlot(slot, actNumber, zone, run, content) {
    const tierAllowance = zone.kind === "boss" ? 1 : 0;
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    return (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item) => item.slot === slot && item.progressionTier <= actNumber + tierAllowance + progressionAllowance)
      .sort((left, right) => left.progressionTier - right.progressionTier);
  }

  function getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content) {
    const availableItems = getAvailableItemsForSlot(slot, actNumber, zone, run, content);
    if (!equipment) {
      return availableItems[availableItems.length - 1] || null;
    }

    const currentItem = getItemDefinition(content, equipment.itemId);
    return availableItems.find((item) => item.progressionTier > (currentItem?.progressionTier || 0)) || null;
  }

  function getPreferredRunewordForEquipment(equipment, content) {
    if (!equipment) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item) {
      return null;
    }

    return (
      (Object.values(content.runewordCatalog || {}) as RuntimeRunewordDefinition[]).find((runeword) => {
        if (runeword.slot !== equipment.slot) {
          return false;
        }
        if (Array.isArray(runeword.familyAllowList) && runeword.familyAllowList.length > 0) {
          return runeword.familyAllowList.includes(item.family);
        }
        return true;
      }) || null
    );
  }

  function buildReplacementText(currentEquipment, nextItem, content) {
    if (!currentEquipment) {
      return "Slot is empty.";
    }

    const currentItem = getItemDefinition(content, currentEquipment.itemId);
    const preservedRunes = currentEquipment.insertedRunes.length;
    return `Upgrades ${currentItem?.name || currentEquipment.itemId} and preserves ${preservedRunes} socketed rune${preservedRunes === 1 ? "" : "s"}.`;
  }

  function buildItemChoice(itemId, run, content) {
    const item = getItemDefinition(content, itemId);
    if (!item) {
      return null;
    }

    const loadout = buildHydratedLoadout(run, content);
    const currentEquipment = loadout[item.slot];

    return {
      id: `reward_item_${item.id}`,
      kind: "item",
      title: item.name,
      subtitle: item.slot === "weapon" ? "Equip Weapon" : "Equip Armor",
      description: item.summary,
      previewLines: [
        ...describeBonuses(item.bonuses),
        `Base sockets ${item.maxSockets}.`,
        buildReplacementText(currentEquipment, item, content),
      ],
      effects: [{ kind: "equip_item", itemId: item.id }],
    };
  }

  function buildSocketChoice(slot, run, content) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    if (!equipment) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item || equipment.socketsUnlocked >= item.maxSockets) {
      return null;
    }

    return {
      id: `reward_socket_${slot}`,
      kind: "socket",
      title: slot === "weapon" ? "Larzuk's Weapon Socket" : "Larzuk's Armor Socket",
      subtitle: "Open Socket",
      description: `Add one permanent socket to ${item.name}.`,
      previewLines: [
        `${item.name} sockets ${equipment.socketsUnlocked}/${item.maxSockets} -> ${equipment.socketsUnlocked + 1}/${item.maxSockets}.`,
        "Existing runes remain in place.",
      ],
      effects: [{ kind: "add_socket", slot }],
    };
  }

  function buildRuneChoice(runeId, slot, run, content, runeword = null) {
    const rune = getRuneDefinition(content, runeId);
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    if (!rune || !equipment || !isRuneAllowedInSlot(rune, slot)) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const previewLines = [
      ...describeBonuses(rune.bonuses),
      `Socket into ${item?.name || equipment.itemId}.`,
      `${equipment.insertedRunes.length + 1}/${equipment.socketsUnlocked} sockets filled.`,
    ];

    if (runeword) {
      const nextSequence = [...equipment.insertedRunes, rune.id]
        .map((entry) => getRuneDefinition(content, entry)?.name || entry)
        .join(" + ");
      previewLines.push(`Route to ${runeword.name}: ${nextSequence}.`);
    }

    return {
      id: `reward_rune_${slot}_${rune.id}`,
      kind: "rune",
      title: rune.name,
      subtitle: slot === "weapon" ? "Socket Weapon Rune" : "Socket Armor Rune",
      description: rune.summary,
      previewLines,
      effects: [{ kind: "socket_rune", runeId: rune.id, slot }],
    };
  }

  function pickFallbackRuneId(slot, actNumber, encounterNumber, run, zone, content) {
    const pool = RUNE_REWARD_POOLS[slot] || [];
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    const available = pool.filter((runeId) => {
      const rune = getRuneDefinition(content, runeId);
      return rune && rune.progressionTier <= actNumber + 1 + progressionAllowance && isRuneAllowedInSlot(rune, slot);
    });
    if (available.length === 0) {
      return "";
    }
    return available[(actNumber + encounterNumber + run.summary.encountersCleared) % available.length];
  }

  function buildChoiceForSlot(slot, run, zone, actNumber, encounterNumber, content) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    const upgradeItem = getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content);

    if (!equipment) {
      return upgradeItem ? buildItemChoice(upgradeItem.id, run, content) : null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const targetRuneword = equipment.runewordId ? null : getPreferredRunewordForEquipment(equipment, content);

    if (targetRuneword) {
      if (equipment.socketsUnlocked < targetRuneword.socketCount && equipment.socketsUnlocked < item.maxSockets) {
        return buildSocketChoice(slot, run, content);
      }

      if (equipment.insertedRunes.length < targetRuneword.requiredRunes.length && equipment.insertedRunes.length < equipment.socketsUnlocked) {
        const nextRuneId = targetRuneword.requiredRunes[equipment.insertedRunes.length];
        return buildRuneChoice(nextRuneId, slot, run, content, targetRuneword);
      }
    }

    if (upgradeItem && upgradeItem.id !== equipment.itemId) {
      return buildItemChoice(upgradeItem.id, run, content);
    }

    if (equipment.socketsUnlocked < item.maxSockets) {
      return buildSocketChoice(slot, run, content);
    }

    if (equipment.insertedRunes.length < equipment.socketsUnlocked) {
      const fallbackRuneId = pickFallbackRuneId(slot, actNumber, encounterNumber, run, zone, content);
      if (fallbackRuneId) {
        return buildRuneChoice(fallbackRuneId, slot, run, content);
      }
    }

    return null;
  }

  function buildEquipmentChoice({ content, run, zone, actNumber, encounterNumber }) {
    const focusSlots = getFocusSlots(run, actNumber, encounterNumber, content);
    for (let index = 0; index < focusSlots.length; index += 1) {
      const choice = buildChoiceForSlot(focusSlots[index], run, zone, actNumber, encounterNumber, content);
      if (choice) {
        return choice;
      }
    }
    return null;
  }

  function buildInventoryAction(entry, content, kind, subtitle, description, previewLines, actionLabel, cost = 0, disabled = false) {
    let category = "inventory";
    if (kind.startsWith("stash_")) {
      category = "stash";
    } else if (kind.startsWith("vendor_")) {
      category = "vendor";
    }

    return {
      id: `${kind}_${entry.entryId}`,
      category,
      title: getEntryLabel(entry, content),
      subtitle,
      description,
      previewLines,
      cost,
      actionLabel,
      disabled,
    };
  }

  function buildVendorRefreshAction(run) {
    const cost = getVendorRefreshCost(run);
    const affordable = run.gold >= cost;
    return {
      id: "vendor_refresh_stock",
      category: "vendor",
      title: "Refresh Vendor Stock",
      subtitle: "Town Economy",
      description: "Cycle the current vendor inventory for a higher refresh fee each time.",
      previewLines: [`Refresh fee ${cost} gold.`, `Current refresh count ${run.town.vendor.refreshCount}.`],
      cost,
      actionLabel: "Refresh",
      disabled: !affordable,
    };
  }

  function listTownActions(run, profile, content) {
    hydrateRunLoadout(run, content);
    hydrateRunInventory(run, content);
    hydrateProfileStash(profile, content);

    const actions = [buildVendorRefreshAction(run)];

    run.town.vendor.stock.forEach((entry) => {
      const buyPrice = getEntryBuyPrice(entry, content);
      actions.push(
        buildInventoryAction(
          entry,
          content,
          "vendor_buy",
          "Buy From Vendor",
          `Purchase ${getEntryLabel(entry, content)} and move it into run inventory.`,
          [entry.kind === "rune" ? `Rune stock for ${buyPrice} gold.` : `Equipment stock for ${buyPrice} gold.`],
          "Buy",
          buyPrice,
          run.gold < buyPrice
        )
      );
    });

    ["weapon", "armor"].forEach((slot) => {
      const equipment = run.loadout?.[slot];
      if (!equipment) {
        return;
      }
      actions.push(
        {
          id: `inventory_unequip_${slot}`,
          category: "inventory",
          title: getItemDefinition(content, equipment.itemId)?.name || equipment.itemId,
          subtitle: "Unequip",
          description: `Move ${getItemDefinition(content, equipment.itemId)?.name || equipment.itemId} back into carried inventory.`,
          previewLines: [`Sockets ${equipment.insertedRunes.length}/${equipment.socketsUnlocked}.`],
          cost: 0,
          actionLabel: "Unequip",
          disabled: false,
        }
      );
    });

    run.inventory.carried.forEach((entry) => {
      if (entry.kind === "equipment") {
        actions.push(
          buildInventoryAction(
            entry,
            content,
            "inventory_equip",
            "Equip From Inventory",
            `Equip ${getEntryLabel(entry, content)} into the active loadout and keep slot progression on upgrade.`,
            [`Sell value ${getEntrySellPrice(entry, content)} gold.`],
            "Equip"
          )
        );
      } else {
        ["weapon", "armor"].forEach((slot) => {
          const equipment = run.loadout?.[slot];
          const rune = getRuneDefinition(content, entry.runeId);
          if (!equipment || !rune || !isRuneAllowedInSlot(rune, slot)) {
            return;
          }
          actions.push({
            id: `inventory_socket_${slot}__${entry.entryId}`,
            category: "inventory",
            title: getEntryLabel(entry, content),
            subtitle: `Socket ${slot === "weapon" ? "Weapon" : "Armor"} Rune`,
            description: `Socket ${rune.name} into ${getItemDefinition(content, equipment.itemId)?.name || equipment.itemId}.`,
            previewLines: [`${equipment.insertedRunes.length}/${equipment.socketsUnlocked} sockets filled.`],
            cost: 0,
            actionLabel: "Socket",
            disabled: equipment.insertedRunes.length >= equipment.socketsUnlocked,
          });
        });
      }

      actions.push(
        buildInventoryAction(
          entry,
          content,
          "inventory_sell",
          "Sell To Vendor",
          `Convert ${getEntryLabel(entry, content)} into gold immediately.`,
          [`Sale value ${getEntrySellPrice(entry, content)} gold.`],
          "Sell"
        )
      );
      actions.push(
        buildInventoryAction(
          entry,
          content,
          "inventory_stash",
          "Move To Stash",
          `Move ${getEntryLabel(entry, content)} out of the active run inventory and into the profile stash.`,
          ["Withdraw later from any safe zone."],
          "Stash"
        )
      );
    });

    profile.stash.entries.forEach((entry) => {
      actions.push(
        buildInventoryAction(
          entry,
          content,
          "stash_withdraw",
          "Withdraw From Stash",
          `Move ${getEntryLabel(entry, content)} from the profile stash into the active run inventory.`,
          [entry.kind === "rune" ? "Rune stash entry." : "Equipment stash entry."],
          "Withdraw"
        )
      );
    });

    return actions;
  }

  function applyTownAction(run, profile, content, actionId) {
    hydrateRunLoadout(run, content);
    hydrateRunInventory(run, content);
    hydrateProfileStash(profile, content);

    if (actionId === "vendor_refresh_stock") {
      const cost = getVendorRefreshCost(run);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold to refresh vendor stock." };
      }
      run.gold -= cost;
      run.town.vendor.refreshCount += 1;
      run.town.vendor.stock = generateVendorStock(run, content);
      return { ok: true, message: "Vendor stock refreshed." };
    }

    if (actionId.startsWith("vendor_buy_")) {
      const entryId = actionId.replace("vendor_buy_", "");
      const index = run.town.vendor.stock.findIndex((entry) => entry.entryId === entryId);
      const stockEntry = index >= 0 ? run.town.vendor.stock[index] : null;
      if (!stockEntry) {
        return { ok: false, message: "That vendor item is no longer available." };
      }
      const cost = getEntryBuyPrice(stockEntry, content);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for that purchase." };
      }
      run.gold -= cost;
      run.town.vendor.stock.splice(index, 1);
      if (stockEntry.kind === "rune") {
        addRuneToInventory(run, stockEntry.runeId, content);
      } else {
        addEquipmentToInventory(run, stockEntry.equipment.itemId, content);
      }
      return { ok: true, message: "Purchase completed." };
    }

    if (actionId.startsWith("inventory_equip_")) {
      return equipInventoryEntry(run, actionId.replace("inventory_equip_", ""), content);
    }

    if (actionId.startsWith("inventory_unequip_")) {
      return unequipSlot(run, actionId.replace("inventory_unequip_", ""), content);
    }

    if (actionId.startsWith("inventory_socket_")) {
      const payload = actionId.replace("inventory_socket_", "");
      const [slot, entryId] = payload.split("__");
      return socketInventoryRune(run, entryId, slot, content);
    }

    if (actionId.startsWith("inventory_sell_")) {
      return sellCarriedEntry(run, actionId.replace("inventory_sell_", ""), content);
    }

    if (actionId.startsWith("inventory_stash_")) {
      return stashCarriedEntry(run, profile, actionId.replace("inventory_stash_", ""));
    }

    if (actionId.startsWith("stash_withdraw_")) {
      return withdrawStashEntry(run, profile, actionId.replace("stash_withdraw_", ""));
    }

    return { ok: false, message: "Unknown inventory action." };
  }

  function getInventorySummary(run, profile, content) {
    hydrateRunInventory(run, content);
    hydrateProfileStash(profile, content);
    const carriedEquipment = run.inventory.carried.filter((entry) => entry.kind === "equipment").length;
    const carriedRunes = run.inventory.carried.filter((entry) => entry.kind === "rune").length;
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.length : 0;
    const vendorEntries = Array.isArray(run.town?.vendor?.stock) ? run.town.vendor.stock.length : 0;

    return [
      `Carried inventory: ${carriedEquipment} gear, ${carriedRunes} runes.`,
      `Profile stash: ${stashEntries} stored entries.`,
      `Vendor stock: ${vendorEntries} offers available in town.`,
    ];
  }

  function applyChoice(run, choice, content) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];

    hydrateRunLoadout(run, content);
    hydrateRunInventory(run, content);

    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];

      if (effect.kind === "equip_item") {
        const item = getItemDefinition(content, effect.itemId);
        if (!item) {
          return { ok: false, message: "Reward item is invalid." };
        }
        const entry = addEquipmentToInventory(run, item.id, content);
        if (!entry) {
          return { ok: false, message: "Reward item could not be created." };
        }
        const equipResult = equipInventoryEntry(run, entry.entryId, content);
        if (!equipResult.ok) {
          return equipResult;
        }
        continue;
      }

      if (effect.kind === "add_socket") {
        const slot = effect.slot;
        const equipment = run.loadout[slot];
        const item = getItemDefinition(content, equipment?.itemId || "");
        if (!slot || !equipment || !item) {
          return { ok: false, message: "No equipment is available for socketing." };
        }
        if (equipment.socketsUnlocked >= item.maxSockets) {
          return { ok: false, message: "That item has no remaining socket capacity." };
        }
        equipment.socketsUnlocked += 1;
        continue;
      }

      if (effect.kind === "socket_rune") {
        const slot = effect.slot;
        const equipment = run.loadout[slot];
        const rune = getRuneDefinition(content, effect.runeId);
        if (!slot || !equipment || !rune || !isRuneAllowedInSlot(rune, slot)) {
          return { ok: false, message: "Reward rune is invalid." };
        }
        const entry = addRuneToInventory(run, rune.id, content);
        if (!entry) {
          return { ok: false, message: "Reward rune could not be created." };
        }
        const socketResult = socketInventoryRune(run, entry.entryId, slot, content);
        if (!socketResult.ok) {
          return socketResult;
        }
      }
    }

    syncRunewordTracking(run, content);
    return { ok: true };
  }

  function addBonuses(total, bonuses) {
    Object.entries(bonuses || {}).forEach(([key, value]) => {
      total[key] = (total[key] || 0) + toNumber(value, 0);
    });
    return total;
  }

  function buildCombatBonuses(run, content) {
    const loadout = buildHydratedLoadout(run, content);
    const total = {};

    [loadout.weapon, loadout.armor]
      .filter(Boolean)
      .forEach((equipment) => {
        const item = getItemDefinition(content, equipment.itemId);
        const activeRuneword = getRunewordDefinition(content, resolveRunewordId(equipment, content));
        addBonuses(total, item?.bonuses || {});
        equipment.insertedRunes.forEach((runeId) => addBonuses(total, getRuneDefinition(content, runeId)?.bonuses || {}));
        addBonuses(total, activeRuneword?.bonuses || {});
      });

    return total;
  }

  runtimeWindow.ROUGE_ITEM_SYSTEM = {
    createRuntimeContent,
    hydrateRunLoadout,
    hydrateRunInventory,
    hydrateProfileStash,
    buildEquipmentChoice,
    applyChoice,
    listTownActions,
    applyTownAction,
    buildCombatBonuses,
    getActiveRunewords,
    getLoadoutSummary,
    getInventorySummary,
  };
})();
