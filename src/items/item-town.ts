(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    getItemDefinition,
    getRuneDefinition,
    isRuneAllowedInSlot,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    addEquipmentToInventory,
    addRuneToInventory,
    createDefaultInventory,
    ensureEquipmentEntryId,
    equipInventoryEntry,
    findCarriedEntry,
    getEntryLabel,
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
    ECONOMY_FEATURE_MAP,
    getAccountEconomyFeatures,
    getPlannedRunewordId,
    getPlannedRuneword,
    getPlannedRunewordTargets,
    getPlannedRunewordArchiveState,
    getPlanningSummary,
    getPlanningStageLine,
    getPlanningRunewordListLabel,
    getEntryPlanningMatch,
    getStashPlanningPressure,
    getEntryBuyPrice,
    getEntrySellPrice,
    sellCarriedEntry,
    getVendorRefreshCost,
    getVendorConsignmentFee,
    getSocketCommissionCost,
    buildSocketCommissionAction,
    commissionEquipmentSocket,
    addVendorEntryToProfileStash,
    buildInventoryAction,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_PRICING;
  const {
    generateVendorStock,
    normalizeVendorStock,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR;

  function hydrateRunInventory(run, content, profile = null) {
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
    normalizeVendorStock(run, content, profile);
  }

  function buildVendorRefreshAction(run, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    const planning = getPlanningSummary(profile, content);
    const planningOverview = planning.overview || getPlanningSummary(null, null).overview;
    const cost = getVendorRefreshCost(run, profile, content);
    const affordable = run.gold >= cost;
    const previewLines = [`Refresh fee ${cost} gold.`, `Current refresh count ${run.town.vendor.refreshCount}.`];
    const VENDOR_FEATURE_DESCRIPTIONS: [string, string][] = [
      ["advancedVendorStock", "Advanced vendor stock is widening equipment offers."],
      ["runewordCodex", "Runeword Codex is biasing rune stock toward unfinished recipes."],
      ["economyLedger", "Economy Ledger discount is active on town trading."],
      ["chronicleExchange", "Chronicle Exchange is turning archive review into live trade leverage for planning and stash pressure."],
      ["merchantPrincipate", "Merchant Principate is widening the late market toward sovereign-tier stock and pricing leverage."],
      ["sovereignExchange", "Sovereign Exchange is binding deeper archive retention to premium late-market planning pressure."],
      ["treasuryExchange", "Treasury Exchange is opening premium late-act leverage around stash consignment, socket work, and vendor planning."],
      ["paragonExchange", "Paragon Exchange is binding mastery doctrine to trade leverage for premium late-act replacements."],
      ["ascendantExchange", "Ascendant Exchange is steering the strongest Act V offers toward staged premium replacements."],
      ["tradeHegemony", "Trade Hegemony is opening a third-wave late-market lane around premium pricing, rune routing, and stash planning."],
      ["imperialExchange", "Imperial Exchange is binding imperial archive depth to the strongest staged market pressure."],
      ["mythicExchange", "Mythic Exchange is steering the strongest Act V offers toward mythic staged replacements."],
    ];
    for (const [key, description] of VENDOR_FEATURE_DESCRIPTIONS) {
      if (features[key]) {
        previewLines.push(description);
      }
    }
    const plannedRunewords = getPlannedRunewordTargets(profile, content)
      .map((runeword) => runeword?.name)
      .filter(Boolean);
    if (plannedRunewords.length > 0) {
      previewLines.push(`Planning charters active for ${plannedRunewords.join(" and ")}.`);
    }
    if (planning.plannedRunewordCount > 0) {
      previewLines.push(`Next charter push: ${planningOverview.nextActionLabel}. ${planningOverview.nextActionSummary}`);
      if (toNumber(planningOverview.socketCommissionCharterCount, 0) > 0) {
        previewLines.push(
          `Commission queue: ${toNumber(planningOverview.totalSocketStepsRemaining, 0)} socket step${
            toNumber(planningOverview.totalSocketStepsRemaining, 0) === 1 ? "" : "s"
          } remain across ${toNumber(planningOverview.socketCommissionCharterCount, 0)} staged charter base${
            toNumber(planningOverview.socketCommissionCharterCount, 0) === 1 ? "" : "s"
          }.`
        );
      }
      if (planningOverview.fulfilledRunewordIds.length > 0) {
        previewLines.push(
          `Archive mastery: ${getPlanningRunewordListLabel(planningOverview.fulfilledRunewordIds, content)} already cleared up through Act ${Math.max(
            1,
            toNumber(planningOverview.bestFulfilledActsCleared, 0)
          )}${toNumber(planningOverview.bestFulfilledLoadoutTier, 0) > 0 ? ` at loadout tier ${toNumber(planningOverview.bestFulfilledLoadoutTier, 0)}` : ""}.`
        );
      }
    }
    const unfulfilledPlannedRunewords = (["weapon", "armor"] as const)
      .map((slot) => {
        const archiveState = getPlannedRunewordArchiveState(profile, slot, content);
        if (!archiveState.unfulfilled) {
          return "";
        }
        return getPlannedRuneword(profile, slot, content)?.name || archiveState.runewordId;
      })
      .filter(Boolean);
    if (unfulfilledPlannedRunewords.length > 0) {
      previewLines.push(`Archive charter still open for ${unfulfilledPlannedRunewords.join(" and ")}.`);
    }
    return {
      id: "vendor_refresh_stock",
      category: "vendor",
      title: "Refresh Vendor Stock",
      subtitle: "Town Economy",
      description: "Cycle the current vendor inventory for a higher refresh fee each time.",
      previewLines,
      cost,
      actionLabel: "Refresh",
      disabled: !affordable,
    };
  }

  function listTownActions(run, profile, content) {
    hydrateRunLoadout(run, content);
    hydrateProfileStash(profile, content);
    hydrateRunInventory(run, content, profile);
    const features = getAccountEconomyFeatures(profile);

    const actions = [buildVendorRefreshAction(run, content, profile)];

    run.town.vendor.stock.forEach((entry) => {
      const buyPrice = getEntryBuyPrice(entry, content, profile);
      actions.push(
        buildInventoryAction(
          entry,
          content,
          "vendor_buy",
          "Buy From Vendor",
          `Purchase ${getEntryLabel(entry, content)} and move it into run inventory.`,
          [entry.kind === "rune" ? `Rune stock for ${buyPrice} gold.` : `Equipment stock for ${buyPrice} gold.`],
          { label: "Buy", cost: buyPrice, disabled: run.gold < buyPrice }
        )
      );
      if (features.treasuryExchange) {
        const consignmentFee = getVendorConsignmentFee(entry, content, profile);
        const consignPrice = buyPrice + consignmentFee;
        const planningPressure = getStashPlanningPressure(profile);
        const planningMatch = getEntryPlanningMatch(entry, content, profile);
        const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
        actions.push(
          buildInventoryAction(
            entry,
            content,
            "vendor_consign",
            "Acquire For Stash",
            `Purchase ${getEntryLabel(entry, content)} and consign it directly into the profile stash for future runs.`,
            [
              `Buy ${buyPrice} gold + consignment fee ${consignmentFee} gold = ${consignPrice} total.`,
              `Stash planning load ${planningPressure.stashEntries} entries, ${planningPressure.socketReadyEntries} socket-ready bases.`,
              planningMatch
                ? `${planningMatch.slot === "weapon" ? "Weapon" : "Armor"} charter match: ${planningMatch.runeword.name}.`
                : "No active runeword charter match on this offer.",
              planningMatch && toNumber(planningArchiveState?.completedRunCount, 0) > 0
                ? `Archive already completed ${planningMatch.runeword.name} through Act ${Math.max(1, toNumber(planningArchiveState?.bestActsCleared, 0))}; this consignment is priced for a repeat forge lane.`
                : "",
            ].filter(Boolean),
            { label: "Consign", cost: consignPrice, disabled: run.gold < consignPrice }
          )
        );
      }
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
      const commissionAction = buildSocketCommissionAction(
        run,
        equipment,
        content,
        profile,
        "loadout",
        `inventory_commission_loadout_${slot}`,
        `Commission ${slot === "weapon" ? "Weapon" : "Armor"} Socket`,
        `Pay the town artisan to open the next socket on your equipped ${slot}.`
      );
      if (commissionAction) {
        actions.push(commissionAction);
      }
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
            [`Sell value ${getEntrySellPrice(entry, content, profile)} gold.`],
            { label: "Equip" }
          )
        );
        const commissionAction = buildSocketCommissionAction(
          run,
          entry.equipment,
          content,
          profile,
          "inventory",
          `inventory_commission_${entry.entryId}`,
          "Commission Socket",
          `Pay the town artisan to open the next socket on ${getEntryLabel(entry, content)} without equipping it first.`
        );
        if (commissionAction) {
          actions.push(commissionAction);
        }
      } else {
        (["weapon", "armor"] as const).forEach((slot) => {
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
          [`Sale value ${getEntrySellPrice(entry, content, profile)} gold.`],
          { label: "Sell" }
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
          { label: "Stash" }
        )
      );
    });

    profile.stash.entries.forEach((entry) => {
      if (entry.kind === "equipment") {
        const commissionAction = buildSocketCommissionAction(
          run,
          entry.equipment,
          content,
          profile,
          "stash",
          `stash_commission_${entry.entryId}`,
          "Commission Stash Socket",
          `Pay the town artisan to open the next socket on ${getEntryLabel(entry, content)} without withdrawing it from stash.`
        );
        if (commissionAction) {
          actions.push(commissionAction);
        }
      }
      actions.push(
        buildInventoryAction(
          entry,
          content,
          "stash_withdraw",
          "Withdraw From Stash",
          `Move ${getEntryLabel(entry, content)} from the profile stash into the active run inventory.`,
          [entry.kind === "rune" ? "Rune stash entry." : "Equipment stash entry."],
          { label: "Withdraw" }
        )
      );
    });

    return actions;
  }

  function applyTownAction(run, profile, content, actionId) {
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
      return unequipSlot(run, actionId.replace("inventory_unequip_", ""), content);
    }

    if (actionId.startsWith("inventory_socket_")) {
      const payload = actionId.replace("inventory_socket_", "");
      const [slot, entryId] = payload.split("__");
      return socketInventoryRune(run, entryId, slot, content);
    }

    if (actionId.startsWith("inventory_commission_loadout_")) {
      const slot = actionId.replace("inventory_commission_loadout_", "");
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

  function getInventorySummary(run, profile, content) {
    hydrateRunInventory(run, content, profile);
    hydrateProfileStash(profile, content);
    const carriedEquipment = run.inventory.carried.filter((entry) => entry.kind === "equipment").length;
    const carriedRunes = run.inventory.carried.filter((entry) => entry.kind === "rune").length;
    const stashEntries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries.length : 0;
    const vendorEntries = Array.isArray(run.town?.vendor?.stock) ? run.town.vendor.stock.length : 0;
    const features = getAccountEconomyFeatures(profile);
    const activeEconomyFeatures = ECONOMY_FEATURE_MAP
      .filter(([key]) => features[key])
      .map(([, featureId]) => featureId.replace(/_/g, " "));

    const lines = [
      `Carried inventory: ${carriedEquipment} gear, ${carriedRunes} runes.`,
      `Profile stash: ${stashEntries} stored entries.`,
      `Vendor stock: ${vendorEntries} offers available in town.`,
    ];
    if (activeEconomyFeatures.length > 0) {
      lines.push(`Account economy online: ${activeEconomyFeatures.join(", ")}.`);
    }
    if (features.treasuryExchange) {
      const planningPressure = getStashPlanningPressure(profile);
      lines.push(
        `Treasury Exchange can consign vendor offers directly into stash and commission stash sockets directly against stored gear. Current planning load: ${planningPressure.stashEntries} stash entries, ${planningPressure.socketReadyEntries} socket-ready bases.`
      );
    }
    const plannedRunewords = getPlannedRunewordTargets(profile, content);
    if (plannedRunewords.length > 0) {
      lines.push(`Planning charters: ${plannedRunewords.map((runeword) => runeword.name).join(" / ")}.`);
    }
    const planning = getPlanningSummary(profile, content);
    if (planning.plannedRunewordCount > 0) {
      lines.push(
        `Planning record: ${planning.fulfilledPlanCount}/${planning.plannedRunewordCount} active charter${
          planning.plannedRunewordCount === 1 ? "" : "s"
        } already fulfilled in the archive.`
      );
      lines.push(`Next charter push: ${planning.overview?.nextActionLabel || "Quiet"}. ${planning.overview?.nextActionSummary || "No active runeword charter is pinned across the account."}`);
      if (toNumber(planning.overview?.socketCommissionCharterCount, 0) > 0) {
        lines.push(
          `Commission queue: ${toNumber(planning.overview?.totalSocketStepsRemaining, 0)} socket step${
            toNumber(planning.overview?.totalSocketStepsRemaining, 0) === 1 ? "" : "s"
          } remain across ${toNumber(planning.overview?.socketCommissionCharterCount, 0)} staged charter base${
            toNumber(planning.overview?.socketCommissionCharterCount, 0) === 1 ? "" : "s"
          }.`
        );
      }
      if ((planning.overview?.fulfilledRunewordIds || []).length > 0) {
        lines.push(
          `Archive mastery: ${getPlanningRunewordListLabel(planning.overview?.fulfilledRunewordIds || [], content)} already cleared up through Act ${Math.max(
            1,
            toNumber(planning.overview?.bestFulfilledActsCleared, 0)
          )}${toNumber(planning.overview?.bestFulfilledLoadoutTier, 0) > 0 ? ` at loadout tier ${toNumber(planning.overview?.bestFulfilledLoadoutTier, 0)}` : ""}.`
        );
      }
      lines.push(getPlanningStageLine("weapon", planning, content));
      lines.push(getPlanningStageLine("armor", planning, content));
    }
    return lines;
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
