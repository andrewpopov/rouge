(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildHydratedLoadout,
    clamp,
    getItemDefinition,
    getRuneDefinition,
    isRuneAllowedInSlot,
    normalizeEquipmentState,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;

  function createDefaultTraining() {
    return {
      vitality: 0,
      focus: 0,
      command: 0,
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

  function cloneInventoryEntry(entry): InventoryEntry | null {
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

  function normalizeInventoryEntry(entry, run, content, fallbackId = ""): InventoryEntry | null {
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

  function addEquipmentToInventory(run, itemId, content): InventoryEquipmentEntry | null {
    const item = getItemDefinition(content, itemId);
    if (!item) {
      return null;
    }
    const entryId = allocateInventoryEntryId(run);
    const entry: InventoryEquipmentEntry = {
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

  function addRuneToInventory(run, runeId, content): InventoryRuneEntry | null {
    const rune = getRuneDefinition(content, runeId);
    if (!rune) {
      return null;
    }
    const entry: InventoryRuneEntry = {
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

  // Ops (equip, socket, combat) are appended by item-loadout-ops.ts after this script loads
  runtimeWindow.ROUGE_ITEM_LOADOUT = {
    createDefaultInventory,
    createDefaultTownState,
    hydrateRunLoadout,
    hydrateProfileStash,
    syncRunewordTracking,
    cloneEquipmentState,
    cloneInventoryEntry,
    ensureEquipmentEntryId,
    normalizeInventoryEntry,
    getEntryLabel,
    buildBareEquipment,
    getPreservedSlotProgression,
    addEquipmentToInventory,
    addRuneToInventory,
    findCarriedEntry,
    removeCarriedEntry,
    removeStashEntry,
  } as ItemLoadoutApi;
})();
