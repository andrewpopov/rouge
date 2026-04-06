(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildHydratedLoadout,
    clamp,
    cloneArmorProfile,
    cloneWeaponProfile,
    getRarityKind,
    getItemDefinition,
    getRuneDefinition,
    isRuneAllowedInSlot,
    normalizeEquipmentState,
    RARITY,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  const ALL_LOADOUT_SLOTS: LoadoutSlotKey[] = ["weapon", "armor", "helm", "shield", "gloves", "boots", "belt", "ring1", "ring2", "amulet"];
  const ALL_EQUIPMENT_SLOTS: EquipmentSlot[] = ["weapon", "armor", "helm", "shield", "gloves", "boots", "belt", "ring", "amulet"];
  const INVENTORY_CAPACITY = 10;
  const STASH_CAPACITY = 5;

  const LOADOUT_SLOT_LABELS: Record<LoadoutSlotKey, string> = {
    weapon: "Weapon", armor: "Armor", helm: "Helm", shield: "Shield",
    gloves: "Gloves", boots: "Boots", belt: "Belt",
    ring1: "Ring 1", ring2: "Ring 2", amulet: "Amulet",
  };

  const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
    weapon: "Weapon", armor: "Armor", helm: "Helm", shield: "Shield",
    gloves: "Gloves", boots: "Boots", belt: "Belt",
    ring: "Ring", amulet: "Amulet",
  };

  const EQUIPMENT_SLOT_FAMILIES: Record<EquipmentSlot, string> = {
    weapon: "Weapons", armor: "Body Armor", helm: "Helms", shield: "Shields",
    gloves: "Gloves", boots: "Boots", belt: "Belts",
    ring: "Rings", amulet: "Amulets",
  };

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
        primaryTreeId: "",
        secondaryUtilityTreeId: "",
        specializationStage: "exploratory",
        treeRanks: {},
        unlockedSkillIds: [],
        equippedSkillBar: {
          slot1SkillId: "",
          slot2SkillId: "",
          slot3SkillId: "",
        },
        archetypeScores: {},
        offTreeUtilityCount: 0,
        offTreeDamageCount: 0,
        counterCoverageTags: [],
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
      primaryTreeId: "",
      secondaryUtilityTreeId: "",
      specializationStage: "exploratory",
      offTreeUtilityCount: 0,
      offTreeDamageCount: 0,
      ...(run.progression.classProgression || {}),
      treeRanks: { ...(run.progression.classProgression?.treeRanks || {}) },
      unlockedSkillIds: Array.isArray(run.progression.classProgression?.unlockedSkillIds)
        ? [...run.progression.classProgression.unlockedSkillIds]
        : [],
      equippedSkillBar: {
        slot1SkillId: run.progression.classProgression?.equippedSkillBar?.slot1SkillId || "",
        slot2SkillId: run.progression.classProgression?.equippedSkillBar?.slot2SkillId || "",
        slot3SkillId: run.progression.classProgression?.equippedSkillBar?.slot3SkillId || "",
      },
      archetypeScores: { ...(run.progression.classProgression?.archetypeScores || {}) },
      counterCoverageTags: Array.isArray(run.progression.classProgression?.counterCoverageTags)
        ? [...run.progression.classProgression.counterCoverageTags]
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
      uniqueItemsFound: 0,
      enemiesDefeated: 0,
      cardsPlayed: 0,
      potionsUsed: 0,
      lowestHeroLife: 0,
      lowestHeroLifeMax: 0,
      lowestMercenaryLife: 0,
      lowestMercenaryLifeMax: 0,
      ...(run.summary || {}),
    };

    const activeIds: string[] = [];
    ALL_LOADOUT_SLOTS.forEach((slot) => {
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
      sagePurgeCount: 0,
      quartermasterDeckSurgeryUsed: false,
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
      rarity: equipment.rarity || RARITY.WHITE,
      rarityKind: equipment.rarityKind || getRarityKind(equipment.rarity || RARITY.WHITE),
      rarityBonuses: equipment.rarityBonuses || {},
      weaponAffixes: cloneWeaponProfile(equipment.weaponAffixes),
      armorAffixes: cloneArmorProfile(equipment.armorAffixes),
    };
  }

  function cloneInventoryEntry(entry: InventoryEntry | null): InventoryEntry | null {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    if (entry.kind === ENTRY_KIND.RUNE) {
      return {
        entryId: entry.entryId || "",
        kind: ENTRY_KIND.RUNE,
        runeId: entry.runeId || "",
      };
    }
    return {
      entryId: entry.entryId || "",
      kind: ENTRY_KIND.EQUIPMENT,
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
    if (rec.kind === ENTRY_KIND.RUNE || rec.runeId) {
      const rune = getRuneDefinition(content, rec.runeId as string);
      if (!rune) {
        return null;
      }
      return {
        entryId: (rec.entryId as string) || fallbackId || allocateInventoryEntryId(run),
        kind: ENTRY_KIND.RUNE,
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
      kind: ENTRY_KIND.EQUIPMENT,
      equipment,
    };
  }

  function normalizeProfileStashEntry(entry: unknown, content: GameContent, fallbackId: string = "") {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const rec = entry as Record<string, unknown>;
    if (rec.kind === ENTRY_KIND.RUNE || rec.runeId) {
      const rune = getRuneDefinition(content, rec.runeId as string);
      if (!rune) {
        return null;
      }
      return {
        entryId: (rec.entryId as string) || fallbackId || "",
        kind: ENTRY_KIND.RUNE,
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
      kind: ENTRY_KIND.EQUIPMENT,
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

      if (entry.kind === ENTRY_KIND.EQUIPMENT) {
        return {
          entryId: nextId,
          kind: ENTRY_KIND.EQUIPMENT,
          equipment: {
            ...cloneEquipmentState(entry.equipment),
            entryId: nextId,
          },
        };
      }

      return {
        entryId: nextId,
        kind: ENTRY_KIND.RUNE,
        runeId: entry.runeId,
      };
    });
  }

  function getEntryLabel(entry: InventoryEntry | null, content: GameContent) {
    if (!entry) {
      return "Unknown";
    }
    if (entry.kind === ENTRY_KIND.RUNE) {
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
        rarity: equipment.rarity || RARITY.WHITE,
        rarityKind: equipment.rarityKind || getRarityKind(equipment.rarity || RARITY.WHITE),
        rarityBonuses: equipment.rarityBonuses || {},
        weaponAffixes: cloneWeaponProfile(equipment.weaponAffixes),
        armorAffixes: cloneArmorProfile(equipment.armorAffixes),
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

  function addEquipmentToInventory(
    run: RunState,
    itemId: string,
    content: GameContent,
    rarity: string = RARITY.WHITE,
    rarityBonuses: ItemBonusSet = {},
    weaponAffixes: WeaponCombatProfile | undefined = undefined,
    armorAffixes: ArmorMitigationProfile | undefined = undefined
  ): InventoryEquipmentEntry | null {
    const item = getItemDefinition(content, itemId);
    if (!item) { return null; }
    const rarityKind = getRarityKind(rarity);
    const entryId = allocateInventoryEntryId(run);
    const entry: InventoryEquipmentEntry = {
      entryId,
      kind: ENTRY_KIND.EQUIPMENT,
      equipment: {
        entryId,
        itemId: item.id,
        slot: item.slot,
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
        rarity,
        rarityKind,
        rarityBonuses,
        weaponAffixes: cloneWeaponProfile(weaponAffixes),
        armorAffixes: cloneArmorProfile(armorAffixes),
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
      kind: ENTRY_KIND.RUNE,
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

  function resolveLoadoutKey(slot: EquipmentSlot, run: RunState): LoadoutSlotKey {
    if (slot === "ring") {
      if (!run.loadout.ring1) { return "ring1"; }
      if (!run.loadout.ring2) { return "ring2"; }
      return "ring1";
    }
    return slot as LoadoutSlotKey;
  }

  function isInventoryFull(run: RunState): boolean {
    return (run.inventory?.carried?.length || 0) >= INVENTORY_CAPACITY;
  }

  function isStashFull(profile: ProfileState): boolean {
    return (profile?.stash?.entries?.length || 0) >= STASH_CAPACITY;
  }

  // Ops (equip, socket, combat) are appended by item-loadout-ops.ts after this script loads
  runtimeWindow.ROUGE_ITEM_LOADOUT = {
    ALL_LOADOUT_SLOTS,
    ALL_EQUIPMENT_SLOTS,
    INVENTORY_CAPACITY,
    STASH_CAPACITY,
    LOADOUT_SLOT_LABELS,
    EQUIPMENT_SLOT_LABELS,
    EQUIPMENT_SLOT_FAMILIES,
    resolveLoadoutKey,
    isInventoryFull,
    isStashFull,
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
