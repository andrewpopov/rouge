(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    getItemDefinition,
    getRuneDefinition,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    cloneInventoryEntry,
    getEntryLabel,
    hydrateProfileStash,
    removeCarriedEntry,
  } = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  // --- Buy / sell pricing ---
  const MIN_RUNE_BUY_PRICE = 10;
  const RUNE_BUY_MARKUP = 1.75;
  const MIN_EQUIPMENT_BUY_PRICE = 14;
  const EQUIPMENT_BUY_MARKUP = 1.6;
  const MIN_RUNE_SELL_PRICE = 4;
  const RUNE_SELL_RATE = 0.75;
  const MIN_EQUIPMENT_SELL_PRICE = 6;
  const EQUIPMENT_SELL_RATE = 0.65;

  // --- Vendor refresh ---
  const MIN_REFRESH_COST = 8;
  const BASE_REFRESH_COST = 10;
  const REFRESH_ACT_SCALE = 4;
  const REFRESH_COUNT_SCALE = 6;

  // --- Consignment fees ---
  const RUNE_CONSIGNMENT_BASE_FEE = 4;
  const EQUIPMENT_CONSIGNMENT_BASE_FEE = 8;
  const CONSIGNMENT_BUY_PRICE_FRACTION = 0.12;
  const MAX_CONSIGNMENT_STASH_LOAD_FEE = 6;

  // --- Socket commission ---
  const COMMISSION_BASE_COST = 16;
  const COMMISSION_TIER_SCALE = 10;
  const COMMISSION_SOCKET_SCALE = 7;
  const COMMISSION_ACT_SCALE = 3;
  const COMMISSION_STASH_LOCATION_FEE = 7;
  const COMMISSION_LOADOUT_LOCATION_FEE = 3;
  const MAX_COMMISSION_STASH_PRESSURE = 5;
  const MAX_COMMISSION_SOCKET_PRESSURE = 3;
  const MIN_COMMISSION_COST_STASH = 16;
  const MIN_COMMISSION_COST_DEFAULT = 12;

  const pricingApi = runtimeWindow.__ROUGE_ITEM_TOWN_PRICING;
  const {
    getAccountEconomyFeatures,
    getEntryPlanningMatch,
    getEquipmentPlanningMatch,
    getPlannedRunewordArchiveState,
    getEquipmentValue,
    getRuneValue,
    getStashPlanningPressure,
    hasOpenPlanningCharter,
    canCommissionSocket,
  } = pricingApi;

  const BUY_DISCOUNT_RATES: [string, number][] = [
    ["economyLedger", 0.9],
    ["salvageTithes", 0.92],
    ["artisanStock", 0.96],
    ["brokerageCharter", 0.95],
    ["treasuryExchange", 0.93],
    ["merchantPrincipate", 0.94],
    ["sovereignExchange", 0.97],
    ["ascendantExchange", 0.95],
    ["tradeHegemony", 0.92],
    ["imperialExchange", 0.96],
    ["mythicExchange", 0.94],
    ["economyFocus", 0.97],
  ];

  const SELL_BONUS_RATES: [string, number][] = [
    ["economyLedger", 1.15],
    ["salvageTithes", 1.12],
    ["artisanStock", 1.04],
    ["brokerageCharter", 1.06],
    ["treasuryExchange", 1.08],
    ["merchantPrincipate", 1.08],
    ["sovereignExchange", 1.05],
    ["ascendantExchange", 1.06],
    ["tradeHegemony", 1.08],
    ["imperialExchange", 1.05],
    ["mythicExchange", 1.06],
    ["economyFocus", 1.05],
  ];

  function applyFeatureRates(baseValue: number, features: AccountEconomyFeatures, rates: [string, number][]): number {
    let result = baseValue;
    for (const [key, rate] of rates) {
      if ((features as unknown as Record<string, boolean>)[key]) {
        result *= rate;
      }
    }
    return result;
  }

  function getEntryBuyPrice(entry: InventoryEntry, content: GameContent, profile: ProfileState | null = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === ENTRY_KIND.RUNE) {
      return Math.max(MIN_RUNE_BUY_PRICE, Math.floor(applyFeatureRates(getRuneValue(entry.runeId, content) * RUNE_BUY_MARKUP, features, BUY_DISCOUNT_RATES)));
    }
    return Math.max(MIN_EQUIPMENT_BUY_PRICE, Math.floor(applyFeatureRates(getEquipmentValue(entry.equipment, content) * EQUIPMENT_BUY_MARKUP, features, BUY_DISCOUNT_RATES)));
  }

  function getEntrySellPrice(entry: InventoryEntry, content: GameContent, profile: ProfileState | null = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === ENTRY_KIND.RUNE) {
      return Math.max(MIN_RUNE_SELL_PRICE, Math.floor(applyFeatureRates(getRuneValue(entry.runeId, content) * RUNE_SELL_RATE, features, SELL_BONUS_RATES)));
    }
    return Math.max(MIN_EQUIPMENT_SELL_PRICE, Math.floor(applyFeatureRates(getEquipmentValue(entry.equipment, content) * EQUIPMENT_SELL_RATE, features, SELL_BONUS_RATES)));
  }

  function sellCarriedEntry(run: RunState, entryId: string, content: GameContent, profile: ProfileState | null = null) {
    const entry = removeCarriedEntry(run, entryId);
    if (!entry) {
      return { ok: false, message: "That inventory entry is no longer available." };
    }
    const sellPrice = getEntrySellPrice(entry, content, profile);
    run.gold += sellPrice;
    run.summary.goldGained += sellPrice;
    return { ok: true, message: `Sold for ${sellPrice} gold.` };
  }

  function getVendorRefreshCost(run: RunState, profile: ProfileState | null = null, content: GameContent | null = null) {
    const features = getAccountEconomyFeatures(profile);
    const planningPressure = getStashPlanningPressure(profile);
    const chronicleDiscount =
      features.chronicleExchange ? 1 + Number(hasOpenPlanningCharter(profile, content) || planningPressure.stashEntries > 0) : 0;
    const discount =
      (features.advancedVendorStock ? 2 : 0) +
      (features.economyLedger ? 4 : 0) +
      (features.salvageTithes ? 2 : 0) +
      (features.artisanStock ? 2 : 0) +
      (features.brokerageCharter ? 2 : 0) +
      (features.treasuryExchange ? 3 : 0) +
      (features.merchantPrincipate ? 2 : 0) +
      (features.sovereignExchange ? 2 : 0) +
      (features.ascendantExchange && run.actNumber >= 5 ? 1 : 0) +
      (features.tradeHegemony && run.actNumber >= 5 ? 2 : 0) +
      (features.imperialExchange && run.actNumber >= 5 ? 2 : 0) +
      (features.mythicExchange && run.actNumber >= 5 ? 2 : 0) +
      chronicleDiscount +
      (features.paragonExchange && run.actNumber >= 5 ? 1 : 0) +
      (features.economyFocus ? 1 : 0);
    return Math.max(MIN_REFRESH_COST, BASE_REFRESH_COST + run.actNumber * REFRESH_ACT_SCALE + toNumber(run.town?.vendor?.refreshCount, 0) * REFRESH_COUNT_SCALE - discount);
  }

  function getVendorConsignmentFee(entry: InventoryEntry, content: GameContent, profile: ProfileState | null = null) {
    const features = getAccountEconomyFeatures(profile);
    if (!features.treasuryExchange) {
      return 0;
    }
    const buyPrice = getEntryBuyPrice(entry, content, profile);
    const planningPressure = getStashPlanningPressure(profile);
    const baseFee = entry.kind === ENTRY_KIND.RUNE ? RUNE_CONSIGNMENT_BASE_FEE : EQUIPMENT_CONSIGNMENT_BASE_FEE;
    const stashLoadFee = Math.min(MAX_CONSIGNMENT_STASH_LOAD_FEE, planningPressure.stashEntries);
    const planningFee = planningPressure.socketReadyEntries + planningPressure.runewordEntries;
    const planningMatch = getEntryPlanningMatch(entry, content, profile);
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
    const planningDiscount =
      planningMatch ? 3 + Number(features.economyFocus) + Number(planningArchiveState?.unfulfilled) * 2 : 0;
    const repeatableDiscount =
      planningMatch && toNumber(planningArchiveState?.completedRunCount, 0) > 0 ? 3 + Number(planningPressure.socketReadyEntries > 0) : 0;
    const chronicleDiscount = features.chronicleExchange ? 2 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const paragonDiscount = features.paragonExchange && entry.kind === ENTRY_KIND.EQUIPMENT ? 1 + Number(Boolean(planningMatch)) : 0;
    const merchantDiscount = features.merchantPrincipate ? 1 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const sovereignDiscount = features.sovereignExchange ? 1 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const ascendantDiscount =
      features.ascendantExchange && entry.kind === ENTRY_KIND.EQUIPMENT ? 1 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const hegemonyDiscount =
      features.tradeHegemony ? 2 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const imperialDiscount =
      features.imperialExchange ? 2 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const mythicDiscount =
      features.mythicExchange && entry.kind === ENTRY_KIND.EQUIPMENT ? 2 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const fee =
      baseFee +
      Math.floor(buyPrice * CONSIGNMENT_BUY_PRICE_FRACTION) +
      stashLoadFee +
      planningFee -
      Number(features.economyFocus) -
      planningDiscount -
      repeatableDiscount -
      chronicleDiscount -
      paragonDiscount -
      merchantDiscount -
      sovereignDiscount -
      ascendantDiscount -
      hegemonyDiscount -
      imperialDiscount -
      mythicDiscount;
    return Math.max(entry.kind === ENTRY_KIND.RUNE ? RUNE_CONSIGNMENT_BASE_FEE : EQUIPMENT_CONSIGNMENT_BASE_FEE, fee);
  }

  function getSocketCommissionCost(run: RunState, equipment: RunEquipmentState | null, content: GameContent, profile: ProfileState | null = null, location: string = "inventory") {
    if (!canCommissionSocket(equipment, content)) {
      return 0;
    }
    const item = getItemDefinition(content, equipment?.itemId || "");
    const features = getAccountEconomyFeatures(profile);
    const planningPressure = getStashPlanningPressure(profile);
    const planningMatch = getEquipmentPlanningMatch(equipment, content, profile);
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
    const nextSocketCount = toNumber(equipment?.socketsUnlocked, 0) + 1;
    const baseCost = COMMISSION_BASE_COST + toNumber(item?.progressionTier, 1) * COMMISSION_TIER_SCALE + nextSocketCount * COMMISSION_SOCKET_SCALE + run.actNumber * COMMISSION_ACT_SCALE;
    let locationFee = 0;
    if (location === "stash") {
      locationFee = COMMISSION_STASH_LOCATION_FEE;
    } else if (location === "loadout") {
      locationFee = COMMISSION_LOADOUT_LOCATION_FEE;
    }
    const planningLoadFee = Math.min(MAX_COMMISSION_STASH_PRESSURE, planningPressure.stashEntries) + Math.min(MAX_COMMISSION_SOCKET_PRESSURE, planningPressure.socketReadyEntries);
    const planningDiscount =
      planningMatch ? 3 + Number(Boolean(planningArchiveState?.unfulfilled)) + Number(features.economyFocus) : 0;
    const repeatForgeDiscount =
      planningMatch && toNumber(planningArchiveState?.completedRunCount, 0) > 0 ? 3 + Number(planningPressure.socketReadyEntries > 0) : 0;
    const featureDiscount =
      Number(features.economyLedger) +
      Number(features.salvageTithes) +
      Number(features.artisanStock) +
      Number(features.brokerageCharter) +
      Number(features.chronicleExchange) +
      Number(features.sovereignExchange) +
      Number(features.paragonExchange) +
      Number(features.economyFocus) +
      Number(features.treasuryExchange) * 2 +
      Number(features.merchantPrincipate) * 2 +
      Number(features.ascendantExchange) * 2 +
      Number(features.tradeHegemony) * 2 +
      Number(features.imperialExchange) * 2 +
      Number(features.mythicExchange) * 2;
    return Math.max(location === "stash" ? MIN_COMMISSION_COST_STASH : MIN_COMMISSION_COST_DEFAULT, baseCost + locationFee + planningLoadFee - planningDiscount - repeatForgeDiscount - featureDiscount);
  }

  function buildSocketCommissionPreviewLines(run: RunState, equipment: RunEquipmentState | null, content: GameContent, profile: ProfileState | null = null, location: string = "inventory") {
    const item = getItemDefinition(content, equipment?.itemId || "");
    const features = getAccountEconomyFeatures(profile);
    const planningMatch = getEquipmentPlanningMatch(equipment, content, profile);
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
    const cost = getSocketCommissionCost(run, equipment, content, profile, location);
    const lines = [
      `${item?.name || equipment?.itemId} sockets ${toNumber(equipment?.insertedRunes?.length, 0)}/${toNumber(equipment?.socketsUnlocked, 0)}/${toNumber(
        item?.maxSockets,
        0
      )} -> ${toNumber(equipment?.insertedRunes?.length, 0)}/${toNumber(equipment?.socketsUnlocked, 0) + 1}/${toNumber(item?.maxSockets, 0)}.`,
      `Commission fee ${cost} gold.`,
      "Inserted runes stay in place.",
    ];
    if (location === "stash" && features.treasuryExchange) {
      lines.push("Treasury Exchange is routing this socket work directly onto stash stock.");
    }
    if (planningMatch) {
      lines.push(`${planningMatch.slot === "weapon" ? "Weapon" : "Armor"} charter match: ${planningMatch.runeword.name}.`);
      if (toNumber(planningArchiveState?.completedRunCount, 0) > 0) {
        lines.push(
          `Archive already completed ${planningMatch.runeword.name} through Act ${Math.max(
            1,
            toNumber(planningArchiveState?.bestActsCleared, 0)
          )}; this commission is supporting a repeat forge lane.`
        );
      } else if (planningArchiveState?.unfulfilled) {
        lines.push(`Archive charter is still open for ${planningMatch.runeword.name}; this commission advances the pinned base.`);
      }
    } else {
      lines.push("No active runeword charter match on this base.");
    }
    return lines;
  }

  function buildInventoryAction(entry: InventoryEntry, content: GameContent, kind: string, subtitle: string, description: string, previewLines: string[], action: { label: string; cost?: number; disabled?: boolean }) {
    let category = "inventory";
    const itemDefinition = entry.kind === ENTRY_KIND.EQUIPMENT ? getItemDefinition(content, entry.equipment?.itemId || "") : null;
    const runeDefinition = entry.kind === ENTRY_KIND.RUNE ? getRuneDefinition(content, entry.runeId || "") : null;
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
      cost: action.cost || 0,
      actionLabel: action.label,
      disabled: action.disabled || false,
      entryKind: entry.kind,
      itemSourceId: itemDefinition?.sourceId || "",
      itemSlot: itemDefinition?.slot || "",
      itemFamily: itemDefinition?.family || "",
      itemRarity: entry.kind === ENTRY_KIND.EQUIPMENT ? entry.equipment?.rarity || "" : "",
      runeSourceId: runeDefinition?.sourceId || "",
      runeTier: toNumber(runeDefinition?.progressionTier, 0),
    };
  }

  function buildSocketCommissionAction(run: RunState, equipment: RunEquipmentState | null, content: GameContent, profile: ProfileState | null, location: string, actionId: string, subtitle: string, description: string) {
    if (!canCommissionSocket(equipment, content)) {
      return null;
    }
    if (location === "stash" && !getAccountEconomyFeatures(profile).treasuryExchange) {
      return null;
    }
    const entry: InventoryEquipmentEntry = {
      entryId: actionId.replace(/^.*?_commission_/, ""),
      kind: ENTRY_KIND.EQUIPMENT,
      equipment: equipment!,
    };
    const cost = getSocketCommissionCost(run, equipment, content, profile, location);
    return buildInventoryAction(
      entry,
      content,
      location === "stash" ? "stash_commission" : "inventory_commission",
      subtitle,
      description,
      buildSocketCommissionPreviewLines(run, equipment, content, profile, location),
      { label: "Commission", cost, disabled: run.gold < cost }
    );
  }

  function commissionEquipmentSocket(equipment: RunEquipmentState, content: GameContent) {
    if (!canCommissionSocket(equipment, content)) {
      return false;
    }
    equipment.socketsUnlocked += 1;
    equipment.runewordId = resolveRunewordId(equipment, content);
    return true;
  }

  function addVendorEntryToProfileStash(profile: ProfileState, entry: InventoryEntry, content: GameContent) {
    const { STASH_CAPACITY } = runtimeWindow.ROUGE_ITEM_LOADOUT;
    profile.stash = profile.stash || { entries: [] };
    if ((profile.stash.entries?.length || 0) >= STASH_CAPACITY) {
      return null;
    }
    const cloned = cloneInventoryEntry(entry);
    if (!cloned) {
      return null;
    }
    profile.stash.entries.push(cloned);
    hydrateProfileStash(profile, content);
    return cloned;
  }

  // Append fee/commission functions onto the existing pricing namespace
  pricingApi.getEntryBuyPrice = getEntryBuyPrice;
  pricingApi.getEntrySellPrice = getEntrySellPrice;
  pricingApi.sellCarriedEntry = sellCarriedEntry;
  pricingApi.getVendorRefreshCost = getVendorRefreshCost;
  pricingApi.getVendorConsignmentFee = getVendorConsignmentFee;
  pricingApi.getSocketCommissionCost = getSocketCommissionCost;
  pricingApi.buildSocketCommissionAction = buildSocketCommissionAction;
  pricingApi.commissionEquipmentSocket = commissionEquipmentSocket;
  pricingApi.addVendorEntryToProfileStash = addVendorEntryToProfileStash;
  pricingApi.buildInventoryAction = buildInventoryAction;
})();
