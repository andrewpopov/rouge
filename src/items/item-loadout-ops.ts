(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildEquipmentArmorProfile,
    buildHydratedLoadout,
    getItemDefinition,
    getRuneDefinition,
    getRunewordDefinition,
    isRuneAllowedInSlot,
    RARITY,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const loadoutApi = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const {
    ALL_LOADOUT_SLOTS,
    addEquipmentToInventory,
    addRuneToInventory,
    buildBareEquipment,
    cloneEquipmentState,
    cloneInventoryEntry,
    ensureEquipmentEntryId,
    findCarriedEntry,
    getEntryLabel,
    getPreservedSlotProgression,
    hydrateRunLoadout,
    removeCarriedEntry,
    removeStashEntry,
    resolveLoadoutKey,
    syncRunewordTracking,
  } = loadoutApi;

  function equipInventoryEntry(run: RunState, entryId: string, content: GameContent, targetLoadoutSlot?: LoadoutSlotKey) {
    const entry = findCarriedEntry(run, entryId);
    if (!entry || entry.kind !== "equipment") {
      return { ok: false, message: "That equipment entry is not available." };
    }

    const nextEquipment = cloneEquipmentState(entry.equipment);
    const loadoutKey = targetLoadoutSlot || resolveLoadoutKey(nextEquipment.slot, run);
    const currentEquipment = run.loadout[loadoutKey];
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

    run.loadout[loadoutKey] = nextEquipment;
    syncRunewordTracking(run, content);
    return { ok: true, message: `${getEntryLabel(entry, content)} equipped.` };
  }

  function equipInventoryEntryFresh(run: RunState, entryId: string, content: GameContent, targetLoadoutSlot?: LoadoutSlotKey) {
    const entry = findCarriedEntry(run, entryId);
    if (!entry || entry.kind !== "equipment") {
      return { ok: false, message: "That equipment entry is not available." };
    }

    const nextEquipment = cloneEquipmentState(entry.equipment);
    const loadoutKey = targetLoadoutSlot || resolveLoadoutKey(nextEquipment.slot, run);
    const currentEquipment = run.loadout[loadoutKey];
    nextEquipment.socketsUnlocked = 0;
    nextEquipment.insertedRunes = [];
    nextEquipment.runewordId = "";

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

    run.loadout[loadoutKey] = nextEquipment;
    syncRunewordTracking(run, content);
    return { ok: true, message: `${getEntryLabel(entry, content)} equipped as a fresh base.` };
  }

  function unequipSlot(run: RunState, slot: LoadoutSlotKey, content: GameContent) {
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

  function socketInventoryRune(run: RunState, entryId: string, slot: LoadoutSlotKey, content: GameContent) {
    const entry = findCarriedEntry(run, entryId);
    const equipment = run.loadout?.[slot] || null;
    const rune = getRuneDefinition(content, (entry as InventoryRuneEntry)?.runeId || "");
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

  function stashCarriedEntry(run: RunState, profile: ProfileState, entryId: string) {
    if (loadoutApi.isStashFull(profile)) {
      return { ok: false, message: "Stash is full." };
    }
    const entry = removeCarriedEntry(run, entryId);
    if (!entry) {
      return { ok: false, message: "That inventory entry is no longer available." };
    }
    profile.stash.entries.push(cloneInventoryEntry(entry));
    return { ok: true, message: "Moved to stash." };
  }

  function withdrawStashEntry(run: RunState, profile: ProfileState, entryId: string) {
    const entry = removeStashEntry(profile, entryId);
    if (!entry) {
      return { ok: false, message: "That stash entry is no longer available." };
    }
    const cloned = cloneInventoryEntry(entry);
    run.inventory.carried.push(cloned);
    return { ok: true, message: "Moved to inventory." };
  }

  function describeRunes(equipment: RunEquipmentState | null, content: GameContent) {
    if (!equipment || equipment.insertedRunes.length === 0) {
      return "No runes socketed.";
    }
    return equipment.insertedRunes
      .map((runeId: string) => getRuneDefinition(content, runeId)?.name || runeId)
      .join(" + ");
  }

  function describeEquipmentState(label: string, equipment: RunEquipmentState | null, content: GameContent) {
    if (!equipment) {
      return `${label}: None`;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const activeRuneword = getRunewordDefinition(content, resolveRunewordId(equipment, content));
    const runeSummary = describeRunes(equipment, content);

    return `${label}: ${item?.name || equipment.itemId} (${equipment.insertedRunes.length}/${equipment.socketsUnlocked}/${item?.maxSockets || 0} sockets) ${runeSummary}${activeRuneword ? ` [${activeRuneword.name}]` : ""}`;
  }

  function getActiveRunewords(run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    return ALL_LOADOUT_SLOTS
      .map((slot: LoadoutSlotKey) => loadout[slot])
      .filter(Boolean)
      .map((equipment: RunEquipmentState) => getRunewordDefinition(content, resolveRunewordId(equipment, content))?.name || "")
      .filter(Boolean);
  }

  function getLoadoutSummary(run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const lines = ALL_LOADOUT_SLOTS
      .filter((slot: LoadoutSlotKey) => loadout[slot])
      .map((slot: LoadoutSlotKey) => describeEquipmentState(loadoutApi.LOADOUT_SLOT_LABELS[slot] || slot, loadout[slot], content));
    if (lines.length === 0) {
      lines.push("No equipment equipped.");
    }
    const activeRunewords = getActiveRunewords(run, content);
    if (activeRunewords.length > 0) {
      lines.push(`Runewords: ${activeRunewords.join(", ")}`);
    }
    return lines;
  }

  function applyChoice(run: RunState, choice: RewardChoice | null, content: GameContent) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];

    hydrateRunLoadout(run, content);
    runtimeWindow.ROUGE_ITEM_TOWN?.hydrateRunInventory?.(run, content);

    const projectedExtraEntries = effects.reduce((total, effect) => {
      if (effect.kind === "grant_item" || effect.kind === "grant_rune") {
        return total + 1;
      }
      if (effect.kind !== "equip_item") {
        return total;
      }
      const item = getItemDefinition(content, effect.itemId || "");
      if (!item) {
        return total;
      }
      const loadoutKey = resolveLoadoutKey(item.slot, run);
      return total + (run.loadout?.[loadoutKey] ? 1 : 0);
    }, 0);
    if ((run.inventory?.carried?.length || 0) + projectedExtraEntries > loadoutApi.INVENTORY_CAPACITY) {
      return { ok: false, message: "Not enough inventory space for this loot claim." };
    }

    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];

      if (effect.kind === "equip_item") {
        const item = getItemDefinition(content, effect.itemId);
        if (!item) {
          return { ok: false, message: "Reward item is invalid." };
        }
        const entry = addEquipmentToInventory(
          run,
          item.id,
          content,
          effect.rarity || RARITY.WHITE,
          effect.rarityBonuses || {},
          effect.weaponAffixes,
          effect.armorAffixes
        );
        if (!entry) {
          return { ok: false, message: "Reward item could not be created." };
        }
        const equipResult = effect.freshBase
          ? equipInventoryEntryFresh(run, entry.entryId, content)
          : equipInventoryEntry(run, entry.entryId, content);
        if (!equipResult.ok) {
          return equipResult;
        }
        if ((effect.rarity || RARITY.WHITE) === RARITY.UNIQUE) {
          run.summary.uniqueItemsFound = toNumber(run.summary?.uniqueItemsFound, 0) + 1;
        }
        continue;
      }

      if (effect.kind === "grant_item") {
        const item = getItemDefinition(content, effect.itemId);
        if (!item) {
          return { ok: false, message: "Loot item is invalid." };
        }
        const entry = addEquipmentToInventory(
          run,
          item.id,
          content,
          effect.rarity || RARITY.WHITE,
          effect.rarityBonuses || {},
          effect.weaponAffixes,
          effect.armorAffixes
        );
        if (!entry) {
          return { ok: false, message: "Loot item could not be created." };
        }
        if ((effect.rarity || RARITY.WHITE) === RARITY.UNIQUE) {
          run.summary.uniqueItemsFound = toNumber(run.summary?.uniqueItemsFound, 0) + 1;
        }
        continue;
      }

      if (effect.kind === "grant_rune") {
        const rune = getRuneDefinition(content, effect.runeId);
        if (!rune) {
          return { ok: false, message: "Loot rune is invalid." };
        }
        const entry = addRuneToInventory(run, rune.id, content);
        if (!entry) {
          return { ok: false, message: "Loot rune could not be created." };
        }
        continue;
      }

      if (effect.kind === "add_socket") {
        const slot = effect.slot;
        const loadoutKey = slot === "ring" ? resolveLoadoutKey("ring", run) : (slot as LoadoutSlotKey);
        const equipment = run.loadout[loadoutKey];
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
        const loadoutKey = slot === "ring" ? resolveLoadoutKey("ring", run) : (slot as LoadoutSlotKey);
        const equipment = run.loadout[loadoutKey];
        const rune = getRuneDefinition(content, effect.runeId);
        if (!slot || !equipment || !rune || !isRuneAllowedInSlot(rune, slot)) {
          return { ok: false, message: "Reward rune is invalid." };
        }
        const entry = addRuneToInventory(run, rune.id, content);
        if (!entry) {
          return { ok: false, message: "Reward rune could not be created." };
        }
        const socketResult = socketInventoryRune(run, entry.entryId, loadoutKey, content);
        if (!socketResult.ok) {
          return socketResult;
        }
      }
    }

    syncRunewordTracking(run, content);
    return { ok: true };
  }

  function addBonuses(total: Record<string, number>, bonuses: ItemBonusSet | null) {
    Object.entries(bonuses || {}).forEach(([key, value]: [string, number]) => {
      total[key] = (total[key] || 0) + toNumber(value, 0);
    });
    return total;
  }

  function buildCombatBonuses(run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const total = {};

    ALL_LOADOUT_SLOTS.forEach((slot: LoadoutSlotKey) => {
      const equipment = loadout[slot];
      if (!equipment) { return; }
      const item = getItemDefinition(content, equipment.itemId);
      const activeRuneword = getRunewordDefinition(content, resolveRunewordId(equipment, content));
      addBonuses(total, item?.bonuses || {});
      addBonuses(total, equipment.rarityBonuses || {});
      equipment.insertedRunes.forEach((runeId: string) => addBonuses(total, getRuneDefinition(content, runeId)?.bonuses || {}));
      addBonuses(total, activeRuneword?.bonuses || {});
    });

    return total;
  }

  function buildCombatMitigationProfile(run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const profiles = loadoutApi.ALL_LOADOUT_SLOTS
      .map((slot: LoadoutSlotKey) => buildEquipmentArmorProfile(loadout[slot], content))
      .filter(Boolean) as ArmorMitigationProfile[];
    if (profiles.length === 0) {
      return undefined;
    }

    const resistanceMap = profiles.reduce((total, profile) => {
      (profile.resistances || []).forEach((entry) => {
        total[entry.type] = (total[entry.type] || 0) + toNumber(entry.amount, 0);
      });
      return total;
    }, {} as Record<string, number>);
    const immunities = Array.from(new Set(profiles.flatMap((profile) => profile.immunities || [])));
    const resistances = Object.entries(resistanceMap).map(([type, amount]) => ({
      type: type as DamageType,
      amount,
    }));

    return {
      ...(resistances.length > 0 ? { resistances } : {}),
      ...(immunities.length > 0 ? { immunities } : {}),
    };
  }

  // Append ops onto the existing ROUGE_ITEM_LOADOUT namespace
  loadoutApi.equipInventoryEntry = equipInventoryEntry;
  loadoutApi.unequipSlot = unequipSlot;
  loadoutApi.socketInventoryRune = socketInventoryRune;
  loadoutApi.stashCarriedEntry = stashCarriedEntry;
  loadoutApi.withdrawStashEntry = withdrawStashEntry;
  loadoutApi.getActiveRunewords = getActiveRunewords;
  loadoutApi.getLoadoutSummary = getLoadoutSummary;
  loadoutApi.applyChoice = applyChoice;
  loadoutApi.buildCombatBonuses = buildCombatBonuses;
  loadoutApi.buildCombatMitigationProfile = buildCombatMitigationProfile;
})();
