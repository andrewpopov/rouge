(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    getItemDefinition,
    getPreferredRunewordForEquipment,
    getRuneDefinition,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    resolveRunewordId,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    cloneInventoryEntry,
    getEntryLabel,
    hydrateProfileStash,
    removeCarriedEntry,
  } = runtimeWindow.ROUGE_ITEM_LOADOUT;

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

  function hasTownFeature(profile, featureId) {
    return Array.isArray(profile?.meta?.unlocks?.townFeatureIds) && profile.meta.unlocks.townFeatureIds.includes(featureId);
  }

  function getFocusedAccountTreeId(profile) {
    return typeof profile?.meta?.accountProgression?.focusedTreeId === "string" ? profile.meta.accountProgression.focusedTreeId : "";
  }

  const ECONOMY_FEATURE_MAP: [string, string][] = [
    ["advancedVendorStock", "advanced_vendor_stock"],
    ["runewordCodex", "runeword_codex"],
    ["economyLedger", "economy_ledger"],
    ["salvageTithes", "salvage_tithes"],
    ["artisanStock", "artisan_stock"],
    ["brokerageCharter", "brokerage_charter"],
    ["treasuryExchange", "treasury_exchange"],
    ["chronicleExchange", "chronicle_exchange"],
    ["paragonExchange", "paragon_exchange"],
    ["merchantPrincipate", "merchant_principate"],
    ["sovereignExchange", "sovereign_exchange"],
    ["ascendantExchange", "ascendant_exchange"],
    ["tradeHegemony", "trade_hegemony"],
    ["imperialExchange", "imperial_exchange"],
    ["mythicExchange", "mythic_exchange"],
  ];

  function getAccountEconomyFeatures(profile): AccountEconomyFeatures {
    const focusedTreeId = getFocusedAccountTreeId(profile);
    const features = {} as AccountEconomyFeatures;
    let economyUnlocked = false;
    for (const [key, featureId] of ECONOMY_FEATURE_MAP) {
      const unlocked = hasTownFeature(profile, featureId);
      features[key] = unlocked;
      if (unlocked) {
        economyUnlocked = true;
      }
    }
    features.economyFocus = focusedTreeId === "economy" && economyUnlocked;
    return features;
  }

  function getPlannedRunewordId(profile, slot, content = null) {
    if (slot !== "weapon" && slot !== "armor") {
      return "";
    }
    const planningKey = slot === "weapon" ? "weaponRunewordId" : "armorRunewordId";
    const runewordId = typeof profile?.meta?.planning?.[planningKey] === "string" ? profile.meta.planning[planningKey] : "";
    if (!content?.runewordCatalog) {
      return runewordId;
    }
    const runeword = getRunewordDefinition(content, runewordId);
    return runeword?.slot === slot ? runeword.id : "";
  }

  function getPlannedRuneword(profile, slot, content) {
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot, content));
    return runeword?.slot === slot ? runeword : null;
  }

  function getPlannedRunewordTargets(profile, content) {
    return ["weapon", "armor"]
      .map((slot) => getPlannedRuneword(profile, slot, content))
      .filter(Boolean);
  }

  function getPlanningSummary(profile, content = null): ProfilePlanningSummary {
    const fallbackPlanning: ProfilePlanningSummary = {
      weaponRunewordId: "",
      armorRunewordId: "",
      plannedRunewordCount: 0,
      fulfilledPlanCount: 0,
      unfulfilledPlanCount: 0,
      weaponArchivedRunCount: 0,
      weaponCompletedRunCount: 0,
      weaponBestActsCleared: 0,
      armorArchivedRunCount: 0,
      armorCompletedRunCount: 0,
      armorBestActsCleared: 0,
      overview: {
        compatibleCharterCount: 0,
        preparedCharterCount: 0,
        readyCharterCount: 0,
        missingBaseCharterCount: 0,
        socketCommissionCharterCount: 0,
        repeatForgeReadyCharterCount: 0,
        trackedBaseCount: 0,
        highestTrackedBaseTier: 0,
        totalSocketStepsRemaining: 0,
        compatibleRunewordIds: [],
        preparedRunewordIds: [],
        readyRunewordIds: [],
        missingBaseRunewordIds: [],
        fulfilledRunewordIds: [],
        bestFulfilledActsCleared: 0,
        bestFulfilledLoadoutTier: 0,
        nextAction: "idle",
        nextActionLabel: "Quiet",
        nextActionSummary: "No active runeword charter is pinned across the account.",
      },
      weaponCharter: undefined,
      armorCharter: undefined,
    };
    return (
      runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile, content)?.planning || fallbackPlanning
    );
  }

  function hasOpenPlanningCharter(profile, content = null) {
    return toNumber(getPlanningSummary(profile, content)?.unfulfilledPlanCount, 0) > 0;
  }

  function getPlannedRunewordArchiveState(profile, slot, content = null) {
    const planning = getPlanningSummary(profile, content);
    return {
      runewordId: slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId,
      archivedRunCount: slot === "weapon" ? planning.weaponArchivedRunCount : planning.armorArchivedRunCount,
      completedRunCount: slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount,
      bestActsCleared: slot === "weapon" ? planning.weaponBestActsCleared : planning.armorBestActsCleared,
      unfulfilled: Boolean(slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId) &&
        (slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount) === 0,
    };
  }

  function getPlanningStageLine(slot, planning, content) {
    const charter = slot === "weapon" ? planning?.weaponCharter : planning?.armorCharter;
    const runewordId = slot === "weapon" ? planning?.weaponRunewordId : planning?.armorRunewordId;
    const slotLabel = slot === "weapon" ? "Weapon" : "Armor";
    if (!runewordId) {
      return `${slotLabel} charter staging: no ${slot} charter pinned.`;
    }

    const runeword = getRunewordDefinition(content, charter?.runewordId || runewordId);
    const bestBase = charter?.bestBaseItemId ? getItemDefinition(content, charter.bestBaseItemId) : null;
    let stageLine = `${slotLabel} charter staging: ${runeword?.name || runewordId} -> ${toNumber(charter?.readyBaseCount, 0)} ready, ${toNumber(
      charter?.preparedBaseCount,
      0
    )} prepared, ${bestBase?.name || "best base not parked yet"}.`;
    if (toNumber(charter?.completedRunCount, 0) > 0) {
      const classLabel = charter?.bestCompletedClassName || charter?.bestCompletedClassId || "unknown class";
      stageLine += ` Best archive clear: Act ${Math.max(1, toNumber(charter?.bestActsCleared, 0))} with ${classLabel}`;
      if (toNumber(charter?.bestCompletedLoadoutTier, 0) > 0) {
        stageLine += ` at loadout tier ${toNumber(charter?.bestCompletedLoadoutTier, 0)}`;
      }
      stageLine += ".";
    }
    return stageLine;
  }

  function getPlanningRunewordListLabel(runewordIds, content) {
    const labels = [...new Set((Array.isArray(runewordIds) ? runewordIds : []).map((runewordId) => getRunewordDefinition(content, runewordId)?.name || runewordId).filter(Boolean))];
    if (labels.length === 0) {
      return "no charter targets";
    }
    if (labels.length === 1) {
      return labels[0];
    }
    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }
    return `${labels.slice(0, 2).join(", ")}, +${labels.length - 2} more`;
  }

  function getTargetRunewordForEquipment(equipment, run, content, profile = null) {
    if (!equipment) {
      return null;
    }
    const plannedRuneword = getPlannedRuneword(profile, equipment.slot, content);
    return equipment.runewordId ? null : getPreferredRunewordForEquipment(equipment, run, content, plannedRuneword?.id || "");
  }

  function getEntryPlanningMatch(entry, content, profile = null) {
    const plannedRunewords = getPlannedRunewordTargets(profile, content);
    if (plannedRunewords.length === 0 || !entry) {
      return null;
    }
    if (entry.kind === "rune") {
      const matchedRuneword = plannedRunewords.find((runeword) => runeword.requiredRunes.includes(entry.runeId)) || null;
      return matchedRuneword ? { runeword: matchedRuneword, slot: matchedRuneword.slot } : null;
    }
    const item = getItemDefinition(content, entry?.equipment?.itemId || "");
    const matchedRuneword = plannedRunewords.find((runeword) => isRunewordCompatibleWithItem(item, runeword)) || null;
    return matchedRuneword ? { runeword: matchedRuneword, slot: matchedRuneword.slot } : null;
  }

  function getEquipmentPlanningMatch(equipment, content, profile = null) {
    if (!equipment) {
      return null;
    }
    return getEntryPlanningMatch(
      {
        entryId: equipment.entryId || "",
        kind: "equipment",
        equipment,
      },
      content,
      profile
    );
  }

  function canCommissionSocket(equipment, content) {
    if (!equipment || equipment.runewordId) {
      return false;
    }
    const item = getItemDefinition(content, equipment.itemId);
    return Boolean(item) && toNumber(equipment.socketsUnlocked, 0) < toNumber(item?.maxSockets, 0);
  }

  function getStashPlanningPressure(profile) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const equipmentEntries = entries.filter((entry) => entry?.kind === "equipment");
    return {
      stashEntries: entries.length,
      socketReadyEntries: equipmentEntries.filter((entry) => toNumber(entry?.equipment?.socketsUnlocked, 0) > 0).length,
      runewordEntries: equipmentEntries.filter((entry) => entry?.equipment?.runewordId).length,
    };
  }

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
      if (features[key]) {
        result *= rate;
      }
    }
    return result;
  }

  function getEntryBuyPrice(entry, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === "rune") {
      return Math.max(10, Math.floor(applyFeatureRates(getRuneValue(entry.runeId, content) * 1.75, features, BUY_DISCOUNT_RATES)));
    }
    return Math.max(14, Math.floor(applyFeatureRates(getEquipmentValue(entry.equipment, content) * 1.6, features, BUY_DISCOUNT_RATES)));
  }

  function getEntrySellPrice(entry, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === "rune") {
      return Math.max(4, Math.floor(applyFeatureRates(getRuneValue(entry.runeId, content) * 0.75, features, SELL_BONUS_RATES)));
    }
    return Math.max(6, Math.floor(applyFeatureRates(getEquipmentValue(entry.equipment, content) * 0.65, features, SELL_BONUS_RATES)));
  }

  function sellCarriedEntry(run, entryId, content, profile = null) {
    const entry = removeCarriedEntry(run, entryId);
    if (!entry) {
      return { ok: false, message: "That inventory entry is no longer available." };
    }
    const sellPrice = getEntrySellPrice(entry, content, profile);
    run.gold += sellPrice;
    run.summary.goldGained += sellPrice;
    return { ok: true, message: `Sold for ${sellPrice} gold.` };
  }

  function getVendorRefreshCost(run, profile = null, content = null) {
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
    return Math.max(8, 10 + run.actNumber * 4 + toNumber(run.town?.vendor?.refreshCount, 0) * 6 - discount);
  }

  function getVendorConsignmentFee(entry, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    if (!features.treasuryExchange) {
      return 0;
    }
    const buyPrice = getEntryBuyPrice(entry, content, profile);
    const planningPressure = getStashPlanningPressure(profile);
    const baseFee = entry.kind === "rune" ? 4 : 8;
    const stashLoadFee = Math.min(6, planningPressure.stashEntries);
    const planningFee = planningPressure.socketReadyEntries + planningPressure.runewordEntries;
    const planningMatch = getEntryPlanningMatch(entry, content, profile);
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
    const planningDiscount =
      planningMatch ? 3 + Number(features.economyFocus) + Number(planningArchiveState?.unfulfilled) * 2 : 0;
    const repeatableDiscount =
      planningMatch && toNumber(planningArchiveState?.completedRunCount, 0) > 0 ? 3 + Number(planningPressure.socketReadyEntries > 0) : 0;
    const chronicleDiscount = features.chronicleExchange ? 2 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const paragonDiscount = features.paragonExchange && entry.kind === "equipment" ? 1 + Number(Boolean(planningMatch)) : 0;
    const merchantDiscount = features.merchantPrincipate ? 1 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const sovereignDiscount = features.sovereignExchange ? 1 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const ascendantDiscount =
      features.ascendantExchange && entry.kind === "equipment" ? 1 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const hegemonyDiscount =
      features.tradeHegemony ? 2 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const imperialDiscount =
      features.imperialExchange ? 2 + Number(Boolean(planningMatch)) + Number(Boolean(planningArchiveState?.unfulfilled)) : 0;
    const mythicDiscount =
      features.mythicExchange && entry.kind === "equipment" ? 2 + Number(Boolean(planningMatch)) + Number(planningPressure.socketReadyEntries > 0) : 0;
    const fee =
      baseFee +
      Math.floor(buyPrice * 0.12) +
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
    return Math.max(entry.kind === "rune" ? 4 : 8, fee);
  }

  function getSocketCommissionCost(run, equipment, content, profile = null, location = "inventory") {
    if (!canCommissionSocket(equipment, content)) {
      return 0;
    }
    const item = getItemDefinition(content, equipment?.itemId || "");
    const features = getAccountEconomyFeatures(profile);
    const planningPressure = getStashPlanningPressure(profile);
    const planningMatch = getEquipmentPlanningMatch(equipment, content, profile);
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot, content) : null;
    const nextSocketCount = toNumber(equipment?.socketsUnlocked, 0) + 1;
    const baseCost = 16 + toNumber(item?.progressionTier, 1) * 10 + nextSocketCount * 7 + run.actNumber * 3;
    let locationFee = 0;
    if (location === "stash") {
      locationFee = 7;
    } else if (location === "loadout") {
      locationFee = 3;
    }
    const planningLoadFee = Math.min(5, planningPressure.stashEntries) + Math.min(3, planningPressure.socketReadyEntries);
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
    return Math.max(location === "stash" ? 16 : 12, baseCost + locationFee + planningLoadFee - planningDiscount - repeatForgeDiscount - featureDiscount);
  }

  function buildSocketCommissionPreviewLines(run, equipment, content, profile = null, location = "inventory") {
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

  function buildInventoryAction(entry, content, kind, subtitle, description, previewLines, action: { label: string; cost?: number; disabled?: boolean }) {
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
      cost: action.cost || 0,
      actionLabel: action.label,
      disabled: action.disabled || false,
    };
  }

  function buildSocketCommissionAction(run, equipment, content, profile, location, actionId, subtitle, description) {
    if (!canCommissionSocket(equipment, content)) {
      return null;
    }
    if (location === "stash" && !getAccountEconomyFeatures(profile).treasuryExchange) {
      return null;
    }
    const entry = {
      entryId: actionId.replace(/^.*?_commission_/, ""),
      kind: "equipment",
      equipment,
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

  function commissionEquipmentSocket(equipment, content) {
    if (!canCommissionSocket(equipment, content)) {
      return false;
    }
    equipment.socketsUnlocked += 1;
    equipment.runewordId = resolveRunewordId(equipment, content);
    return true;
  }

  function addVendorEntryToProfileStash(profile, entry, content) {
    const cloned = cloneInventoryEntry(entry);
    if (!cloned) {
      return null;
    }
    profile.stash = profile.stash || { entries: [] };
    profile.stash.entries.push(cloned);
    hydrateProfileStash(profile, content);
    return cloned;
  }

  runtimeWindow.__ROUGE_ITEM_TOWN_PRICING = {
    ECONOMY_FEATURE_MAP,
    getAccountEconomyFeatures,
    getPlannedRunewordId,
    getPlannedRuneword,
    getPlannedRunewordTargets,
    getPlannedRunewordArchiveState,
    getPlanningSummary,
    hasOpenPlanningCharter,
    getPlanningStageLine,
    getPlanningRunewordListLabel,
    getTargetRunewordForEquipment,
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
  };
})();
