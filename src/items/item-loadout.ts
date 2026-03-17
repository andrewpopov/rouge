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

  function hydrateRunLoadout(run: RunState, content: GameContent) {
    run.loadout = buildHydratedLoadout(run, content);
    syncRunewordTracking(run, content);
  }

  function syncRunewordTracking(run: RunState, content: GameContent) {
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

    const activeIds: string[] = [];
    (["weapon", "armor"] as const).forEach((slot) => {
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
      carried: [] as InventoryEntry[],
    };
  }

  function createDefaultTownState() {
    return {
      vendor: {
        refreshCount: 0,
        stock: [] as InventoryEntry[],
      },
    };
  }

  function cloneEquipmentState(equipment: RunEquipmentState | null) {
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
      rarity: equipment.rarity || "white",
      rarityBonuses: equipment.rarityBonuses || {},
    };
  }

  function cloneInventoryEntry(entry: InventoryEntry | null): InventoryEntry | null {
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
      equipment: cloneEquipmentState(entry.equipment || (entry as unknown as RunEquipmentState)),
    };
  }

  function allocateInventoryEntryId(run: RunState) {
    run.inventory = run.inventory || createDefaultInventory();
    const nextId = Math.max(1, toNumber(run.inventory.nextEntryId, 1));
    run.inventory.nextEntryId = nextId + 1;
    return `inv_${run.id}_${nextId}`;
  }

  function ensureEquipmentEntryId(run: RunState, equipment: RunEquipmentState | null) {
    if (!equipment) {
      return "";
    }
    if (!equipment.entryId) {
      equipment.entryId = allocateInventoryEntryId(run);
    }
    return equipment.entryId;
  }

  function normalizeInventoryEntry(entry: unknown, run: RunState, content: GameContent, fallbackId: string = ""): InventoryEntry | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const rec = entry as Record<string, unknown>;
    if (rec.kind === "rune" || rec.runeId) {
      const rune = getRuneDefinition(content, rec.runeId as string);
      if (!rune) {
        return null;
      }
      return {
        entryId: (rec.entryId as string) || fallbackId || allocateInventoryEntryId(run),
        kind: "rune",
        runeId: rune.id,
      };
    }

    const rawEquipment = (rec.equipment || rec) as Record<string, unknown>;
    const slot = ((rawEquipment.slot as string) || getItemDefinition(content, rawEquipment.itemId as string)?.slot || "weapon") as "weapon" | "armor";
    const equipment = normalizeEquipmentState(rawEquipment, slot, content);
    if (!equipment) {
      return null;
    }
    equipment.entryId = (rec.entryId as string) || equipment.entryId || fallbackId || allocateInventoryEntryId(run);
    return {
      entryId: equipment.entryId,
      kind: "equipment",
      equipment,
    };
  }

  function normalizeProfileStashEntry(entry: unknown, content: GameContent, fallbackId: string = "") {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const rec = entry as Record<string, unknown>;
    if (rec.kind === "rune" || rec.runeId) {
      const rune = getRuneDefinition(content, rec.runeId as string);
      if (!rune) {
        return null;
      }
      return {
        entryId: (rec.entryId as string) || fallbackId || "",
        kind: "rune",
        runeId: rune.id,
      };
    }

    const rawEquipment = (rec.equipment || rec) as Record<string, unknown>;
    const slot = ((rawEquipment.slot as string) || getItemDefinition(content, rawEquipment.itemId as string)?.slot || "weapon") as "weapon" | "armor";
    const equipment = normalizeEquipmentState(rawEquipment, slot, content);
    if (!equipment) {
      return null;
    }

    equipment.entryId = (rec.entryId as string) || equipment.entryId || fallbackId || "";
    return {
      entryId: equipment.entryId,
      kind: "equipment",
      equipment,
    };
  }

  function hydrateProfileStash(profile: ProfileState, content: GameContent) {
    profile.stash = profile.stash || { entries: [] };

    const seenEntryIds = new Set();
    let fallbackIndex = 0;
    const normalized = (Array.isArray(profile.stash.entries) ? profile.stash.entries : [])
      .map((entry: unknown) => {
        fallbackIndex += 1;
        return normalizeProfileStashEntry(entry, content, `stash_${fallbackIndex}`);
      })
      .filter(Boolean);

    profile.stash.entries = normalized.map((entry: InventoryEntry, index: number) => {
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

  function getEntryLabel(entry: InventoryEntry | null, content: GameContent) {
    if (!entry) {
      return "Unknown";
    }
    if (entry.kind === "rune") {
      return getRuneDefinition(content, entry.runeId)?.name || entry.runeId;
    }
    return getItemDefinition(content, entry.equipment?.itemId || "")?.name || entry.equipment?.itemId || entry.entryId;
  }

  function buildBareEquipment(equipment: RunEquipmentState, content: GameContent) {
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

  function getPreservedSlotProgression(currentEquipment: RunEquipmentState | null, nextItemId: string, content: GameContent) {
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
          .map((runeId: string) => getRuneDefinition(content, runeId))
          .filter((rune: RuntimeRuneDefinition | null) => rune && isRuneAllowedInSlot(rune, nextItem?.slot || currentEquipment.slot))
          .slice(0, preservedSockets)
          .map((rune: RuntimeRuneDefinition) => rune.id)
      : [];

    return {
      socketsUnlocked: Math.max(preservedSockets, preservedRunes.length),
      insertedRunes: preservedRunes,
    };
  }

  function addEquipmentToInventory(run: RunState, itemId: string, content: GameContent, rarity: string = "white", rarityBonuses: ItemBonusSet = {}): InventoryEquipmentEntry | null {
    const item = getItemDefinition(content, itemId);
    if (!item) { return null; }
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
        rarity,
        rarityBonuses,
      },
    };
    run.inventory.carried.push(entry);
    return entry;
  }

  function addRuneToInventory(run: RunState, runeId: string, content: GameContent): InventoryRuneEntry | null {
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

  function findCarriedEntry(run: RunState, entryId: string) {
    return run.inventory?.carried?.find((entry: InventoryEntry) => entry.entryId === entryId) || null;
  }

  function removeCarriedEntry(run: RunState, entryId: string) {
    const index = run.inventory?.carried?.findIndex((entry: InventoryEntry) => entry.entryId === entryId) ?? -1;
    if (index < 0) {
      return null;
    }
    return run.inventory.carried.splice(index, 1)[0] || null;
  }

  function removeStashEntry(profile: ProfileState, entryId: string) {
    const index = profile?.stash?.entries?.findIndex((entry: InventoryEntry) => entry.entryId === entryId) ?? -1;
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
