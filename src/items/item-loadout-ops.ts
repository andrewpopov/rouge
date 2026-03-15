(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildHydratedLoadout,
    getItemDefinition,
    getRuneDefinition,
    getRunewordDefinition,
    isRuneAllowedInSlot,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const loadoutApi = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const {
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
    syncRunewordTracking,
  } = loadoutApi;

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

  function applyChoice(run, choice, content) {
    const effects = Array.isArray(choice?.effects) ? choice.effects : [];

    hydrateRunLoadout(run, content);
    runtimeWindow.ROUGE_ITEM_TOWN?.hydrateRunInventory?.(run, content);

    for (let index = 0; index < effects.length; index += 1) {
      const effect = effects[index];

      if (effect.kind === "equip_item") {
        const item = getItemDefinition(content, effect.itemId);
        if (!item) {
          return { ok: false, message: "Reward item is invalid." };
        }
        const entry = addEquipmentToInventory(run, item.id, content, effect.rarity || "white", effect.rarityBonuses || {});
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
        addBonuses(total, equipment.rarityBonuses || {});
        equipment.insertedRunes.forEach((runeId) => addBonuses(total, getRuneDefinition(content, runeId)?.bonuses || {}));
        addBonuses(total, activeRuneword?.bonuses || {});
      });

    return total;
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
})();
