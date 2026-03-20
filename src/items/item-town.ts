(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    addEquipmentToInventory,
    addRuneToInventory,
    createDefaultInventory,
    ensureEquipmentEntryId,
    equipInventoryEntry,
    findCarriedEntry,
    hydrateProfileStash,
    hydrateRunLoadout,
    normalizeInventoryEntry,
    socketInventoryRune,
    stashCarriedEntry,
    syncRunewordTracking,
    unequipSlot,
    withdrawStashEntry,
  } = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const {
    getAccountEconomyFeatures,
    getPlannedRunewordId,
    getPlannedRunewordArchiveState,
    getEntryBuyPrice,
    getEntrySellPrice,
    getVendorRefreshCost,
    getVendorConsignmentFee,
    getSocketCommissionCost,
    commissionEquipmentSocket,
    addVendorEntryToProfileStash,
    sellCarriedEntry,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_PRICING;
  const {
    generateVendorStock,
    normalizeVendorStock,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR;
  const {
    listTownActions,
    getInventorySummary,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_ACTIONS;

  function hydrateRunInventory(run: RunState, content: GameContent, profile: ProfileState | null = null) {
    const inventorySource = (run.inventory || {}) as Record<string, unknown>;
    run.inventory = {
      ...createDefaultInventory(),
      ...(inventorySource as Partial<RunInventoryState>),
      nextEntryId: Math.max(1, toNumber(inventorySource?.nextEntryId, 1)),
      carried: [],
    };

    const allLoadoutSlots: LoadoutSlotKey[] = ["weapon", "armor", "helm", "shield", "gloves", "boots", "belt", "ring1", "ring2", "amulet"];
    const equippedEntryIds = new Set<string>();
    allLoadoutSlots.forEach((slot) => {
      if (run.loadout?.[slot]) {
        ensureEquipmentEntryId(run, run.loadout[slot]);
        if (run.loadout[slot]?.entryId) {
          equippedEntryIds.add(run.loadout[slot].entryId);
        }
      }
    });

    const normalizedCarried = (Array.isArray(inventorySource?.carried) ? inventorySource.carried as unknown[] : [])
      .map((entry: unknown) => normalizeInventoryEntry(entry, run, content))
      .filter(Boolean)
      .filter((entry: InventoryEntry) => {
        if (entry.kind !== "equipment") {
          return true;
        }
        return !equippedEntryIds.has(entry.entryId);
      });

    run.inventory.carried = normalizedCarried;
    normalizeVendorStock(run, content, profile);
  }

  function applyTownAction(run: RunState, profile: ProfileState, content: GameContent, actionId: string) {
    hydrateRunLoadout(run, content);
    hydrateProfileStash(profile, content);
    hydrateRunInventory(run, content, profile);

    if (actionId === "vendor_refresh_stock") {
      const cost = getVendorRefreshCost(run, profile, content);
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold to refresh vendor stock." };
      }
      run.gold -= cost;
      run.town.vendor.refreshCount += 1;
      run.town.vendor.stock = generateVendorStock(run, content, profile);
      return { ok: true, message: "Vendor stock refreshed." };
    }

    if (actionId.startsWith("vendor_buy_")) {
      const entryId = actionId.replace("vendor_buy_", "");
      const index = run.town.vendor.stock.findIndex((entry) => entry.entryId === entryId);
      const stockEntry = index >= 0 ? run.town.vendor.stock[index] : null;
      if (!stockEntry) {
        return { ok: false, message: "That vendor item is no longer available." };
      }
      const cost = getEntryBuyPrice(stockEntry, content, profile);
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

    if (actionId.startsWith("vendor_consign_")) {
      const entryId = actionId.replace("vendor_consign_", "");
      const index = run.town.vendor.stock.findIndex((entry) => entry.entryId === entryId);
      const stockEntry = index >= 0 ? run.town.vendor.stock[index] : null;
      if (!stockEntry) {
        return { ok: false, message: "That vendor item is no longer available." };
      }
      const features = getAccountEconomyFeatures(profile);
      if (!features.treasuryExchange) {
        return { ok: false, message: "Treasury Exchange is not unlocked for stash consignment." };
      }
      const totalCost = getEntryBuyPrice(stockEntry, content, profile) + getVendorConsignmentFee(stockEntry, content, profile);
      if (run.gold < totalCost) {
        return { ok: false, message: "Not enough gold for that consignment." };
      }
      if (!addVendorEntryToProfileStash(profile, stockEntry, content)) {
        return { ok: false, message: "That item could not be consigned to stash." };
      }
      run.gold -= totalCost;
      run.town.vendor.stock.splice(index, 1);
      return { ok: true, message: "Purchase consigned to stash." };
    }

    if (actionId.startsWith("inventory_equip_")) {
      return equipInventoryEntry(run, actionId.replace("inventory_equip_", ""), content);
    }

    if (actionId.startsWith("inventory_unequip_")) {
      return unequipSlot(run, actionId.replace("inventory_unequip_", "") as LoadoutSlotKey, content);
    }

    if (actionId.startsWith("inventory_socket_")) {
      const payload = actionId.replace("inventory_socket_", "");
      const [slot, entryId] = payload.split("__");
      return socketInventoryRune(run, entryId, slot as LoadoutSlotKey, content);
    }

    if (actionId.startsWith("inventory_commission_loadout_")) {
      const slot = actionId.replace("inventory_commission_loadout_", "") as LoadoutSlotKey;
      const equipment = run.loadout?.[slot] || null;
      if (!equipment) {
        return { ok: false, message: "No equipped item is available for commission." };
      }
      const cost = getSocketCommissionCost(run, equipment, content, profile, "loadout");
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for that socket commission." };
      }
      if (!commissionEquipmentSocket(equipment, content)) {
        return { ok: false, message: "That equipped item cannot take another commissioned socket." };
      }
      run.gold -= cost;
      syncRunewordTracking(run, content);
      return { ok: true, message: "Socket commissioned on equipped gear." };
    }

    if (actionId.startsWith("inventory_commission_")) {
      const entryId = actionId.replace("inventory_commission_", "");
      const entry = findCarriedEntry(run, entryId);
      if (!entry || entry.kind !== "equipment") {
        return { ok: false, message: "That carried item is no longer available for commission." };
      }
      const cost = getSocketCommissionCost(run, entry.equipment, content, profile, "inventory");
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for that socket commission." };
      }
      if (!commissionEquipmentSocket(entry.equipment, content)) {
        return { ok: false, message: "That carried item cannot take another commissioned socket." };
      }
      run.gold -= cost;
      return { ok: true, message: "Socket commissioned on carried gear." };
    }

    if (actionId.startsWith("inventory_sell_")) {
      return sellCarriedEntry(run, actionId.replace("inventory_sell_", ""), content, profile);
    }

    if (actionId.startsWith("inventory_stash_")) {
      return stashCarriedEntry(run, profile, actionId.replace("inventory_stash_", ""));
    }

    if (actionId.startsWith("stash_withdraw_")) {
      return withdrawStashEntry(run, profile, actionId.replace("stash_withdraw_", ""));
    }

    if (actionId.startsWith("stash_commission_")) {
      const entryId = actionId.replace("stash_commission_", "");
      const entry = profile?.stash?.entries?.find((candidate) => candidate.entryId === entryId) || null;
      if (!entry || entry.kind !== "equipment") {
        return { ok: false, message: "That stash item is no longer available for commission." };
      }
      if (!getAccountEconomyFeatures(profile).treasuryExchange) {
        return { ok: false, message: "Treasury Exchange is not unlocked for stash socket work." };
      }
      const cost = getSocketCommissionCost(run, entry.equipment, content, profile, "stash");
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for that socket commission." };
      }
      if (!commissionEquipmentSocket(entry.equipment, content)) {
        return { ok: false, message: "That stash item cannot take another commissioned socket." };
      }
      hydrateProfileStash(profile, content);
      run.gold -= cost;
      return { ok: true, message: "Socket commissioned on stash gear." };
    }

    return { ok: false, message: "Unknown inventory action." };
  }

  runtimeWindow.ROUGE_ITEM_TOWN = {
    getAccountEconomyFeatures,
    getPlannedRunewordId,
    getPlannedRunewordArchiveState,
    getEntryBuyPrice,
    getEntrySellPrice,
    getVendorRefreshCost,
    normalizeVendorStock,
    hydrateRunInventory,
    listTownActions,
    applyTownAction,
    getInventorySummary,
  };
})();
