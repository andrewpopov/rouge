/* eslint-disable max-lines */
(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    buildHydratedLoadout,
    getItemDefinition,
    getPreferredRunewordForEquipment,
    getRuneDefinition,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    isRuneAllowedInSlot,
    resolveRunewordId,
    toNumber,
    uniquePush,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    addEquipmentToInventory,
    addRuneToInventory,
    cloneInventoryEntry,
    createDefaultInventory,
    createDefaultTownState,
    equipInventoryEntry,
    findCarriedEntry,
    getEntryLabel,
    hydrateProfileStash,
    hydrateRunLoadout,
    normalizeInventoryEntry,
    removeCarriedEntry,
    socketInventoryRune,
    stashCarriedEntry,
    syncRunewordTracking,
    unequipSlot,
    withdrawStashEntry,
    ensureEquipmentEntryId,
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

  function getAccountEconomyFeatures(profile) {
    const focusedTreeId = getFocusedAccountTreeId(profile);
    const salvageTithes = hasTownFeature(profile, "salvage_tithes");
    const economyUnlocked =
      hasTownFeature(profile, "advanced_vendor_stock") ||
      hasTownFeature(profile, "runeword_codex") ||
      hasTownFeature(profile, "economy_ledger") ||
      hasTownFeature(profile, "brokerage_charter") ||
      hasTownFeature(profile, "artisan_stock") ||
      hasTownFeature(profile, "treasury_exchange") ||
      hasTownFeature(profile, "chronicle_exchange") ||
      hasTownFeature(profile, "paragon_exchange") ||
      hasTownFeature(profile, "merchant_principate") ||
      hasTownFeature(profile, "sovereign_exchange") ||
      hasTownFeature(profile, "ascendant_exchange") ||
      salvageTithes;
    return {
      advancedVendorStock: hasTownFeature(profile, "advanced_vendor_stock"),
      runewordCodex: hasTownFeature(profile, "runeword_codex"),
      economyLedger: hasTownFeature(profile, "economy_ledger"),
      salvageTithes,
      artisanStock: hasTownFeature(profile, "artisan_stock"),
      brokerageCharter: hasTownFeature(profile, "brokerage_charter"),
      treasuryExchange: hasTownFeature(profile, "treasury_exchange"),
      chronicleExchange: hasTownFeature(profile, "chronicle_exchange"),
      paragonExchange: hasTownFeature(profile, "paragon_exchange"),
      merchantPrincipate: hasTownFeature(profile, "merchant_principate"),
      sovereignExchange: hasTownFeature(profile, "sovereign_exchange"),
      ascendantExchange: hasTownFeature(profile, "ascendant_exchange"),
      economyFocus: focusedTreeId === "economy" && economyUnlocked,
    };
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

  function getEntryBuyPrice(entry, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === "rune") {
      return Math.max(
        10,
        Math.floor(
          getRuneValue(entry.runeId, content) *
            1.75 *
            (features.economyLedger ? 0.9 : 1) *
            (features.salvageTithes ? 0.92 : 1) *
            (features.artisanStock ? 0.96 : 1) *
            (features.brokerageCharter ? 0.95 : 1) *
            (features.treasuryExchange ? 0.93 : 1) *
            (features.merchantPrincipate ? 0.94 : 1) *
            (features.sovereignExchange ? 0.97 : 1) *
            (features.ascendantExchange ? 0.95 : 1) *
            (features.economyFocus ? 0.97 : 1)
        )
      );
    }
    return Math.max(
      14,
      Math.floor(
        getEquipmentValue(entry.equipment, content) *
          1.6 *
          (features.economyLedger ? 0.9 : 1) *
          (features.salvageTithes ? 0.92 : 1) *
          (features.artisanStock ? 0.96 : 1) *
          (features.brokerageCharter ? 0.95 : 1) *
          (features.treasuryExchange ? 0.93 : 1) *
          (features.merchantPrincipate ? 0.94 : 1) *
          (features.sovereignExchange ? 0.97 : 1) *
          (features.ascendantExchange ? 0.95 : 1) *
          (features.economyFocus ? 0.97 : 1)
      )
    );
  }

  function getEntrySellPrice(entry, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    if (entry.kind === "rune") {
      return Math.max(
        4,
        Math.floor(
          getRuneValue(entry.runeId, content) *
            0.75 *
            (features.economyLedger ? 1.15 : 1) *
            (features.salvageTithes ? 1.12 : 1) *
            (features.artisanStock ? 1.04 : 1) *
            (features.brokerageCharter ? 1.06 : 1) *
            (features.treasuryExchange ? 1.08 : 1) *
            (features.merchantPrincipate ? 1.08 : 1) *
            (features.sovereignExchange ? 1.05 : 1) *
            (features.ascendantExchange ? 1.06 : 1) *
            (features.economyFocus ? 1.05 : 1)
        )
      );
    }
    return Math.max(
      6,
      Math.floor(
        getEquipmentValue(entry.equipment, content) *
          0.65 *
          (features.economyLedger ? 1.15 : 1) *
          (features.salvageTithes ? 1.12 : 1) *
          (features.artisanStock ? 1.04 : 1) *
          (features.brokerageCharter ? 1.06 : 1) *
          (features.treasuryExchange ? 1.08 : 1) *
          (features.merchantPrincipate ? 1.08 : 1) *
          (features.sovereignExchange ? 1.05 : 1) *
          (features.ascendantExchange ? 1.06 : 1) *
          (features.economyFocus ? 1.05 : 1)
      )
    );
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
      ascendantDiscount;
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
      Number(features.ascendantExchange) * 2;
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
      "Commission",
      cost,
      run.gold < cost
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

  function buildVendorEntryId(run, index) {
    return `vendor_${run.actNumber}_${toNumber(run.town?.vendor?.refreshCount, 0)}_${index}`;
  }

  function getVendorTierAllowance(run, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    const chroniclePressure = features.chronicleExchange;
    return (
      Math.min(2, Math.floor(Math.max(0, toNumber(run.level, 1) - 1) / 3)) +
      Math.min(1, toNumber(run.progression?.bossTrophies?.length, 0)) +
      Math.min(1, Math.floor(Math.max(0, toNumber(run.town?.vendor?.refreshCount, 0)) / 2)) +
      Number(features.advancedVendorStock) +
      Number(features.brokerageCharter && run.actNumber >= 4) +
      Number(features.artisanStock && run.actNumber >= 5) +
      Number(features.merchantPrincipate && run.actNumber >= 5) +
      Number(chroniclePressure && run.actNumber >= 4) +
      Number(features.sovereignExchange && run.actNumber >= 4) +
      Number(features.paragonExchange && run.actNumber >= 5) +
      Number(features.ascendantExchange && run.actNumber >= 5) +
      Number(features.treasuryExchange && run.actNumber >= 5)
    );
  }

  function getCurrentEquipmentTier(equipment, content) {
    return toNumber(getItemDefinition(content, equipment?.itemId || "")?.progressionTier, 0);
  }

  function pickUniqueDefinitions(candidates, options, desiredCount, seed) {
    const selected = [];
    const seenIds = new Set();

    const pushCandidate = (candidate) => {
      if (!candidate?.id || seenIds.has(candidate.id)) {
        return;
      }
      seenIds.add(candidate.id);
      selected.push(candidate);
    };

    (Array.isArray(candidates) ? candidates : []).forEach(pushCandidate);

    for (let offset = 0; selected.length < desiredCount && offset < options.length * 2; offset += 1) {
      pushCandidate(options[(seed + offset) % options.length]);
    }

    return selected.slice(0, desiredCount);
  }

  function pickVendorEquipmentOffers(slot, run, currentEquipment, options, desiredCount, seed, content, profile = null) {
    if (options.length === 0 || desiredCount <= 0) {
      return [];
    }

    const features = getAccountEconomyFeatures(profile);
    const currentTier = getCurrentEquipmentTier(currentEquipment, content);
    const upgradeOptions = options.filter((item) => item.progressionTier > currentTier);
    const lateBias =
      features.advancedVendorStock ||
      features.merchantPrincipate ||
      features.sovereignExchange ||
      features.ascendantExchange ||
      run.actNumber >= 4 ||
      toNumber(run.town?.vendor?.refreshCount, 0) > 0;
    const socketReadyOffer =
      lateBias
        ? [...upgradeOptions]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const socketDelta = toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
              if (socketDelta !== 0) {
                return socketDelta;
              }
              return toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
            })[0] || null
        : null;
    const artisanOffer =
      features.artisanStock && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const treasuryOffer =
      features.treasuryExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 4)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const merchantOffer =
      features.merchantPrincipate && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 4)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const plannedRuneword = getPlannedRuneword(profile, slot, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot, content);
    const chronicleOffer =
      features.chronicleExchange && (run.actNumber >= 4 || planningArchiveState.unfulfilled || hasOpenPlanningCharter(profile, content))
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (!plannedRuneword) {
                return toNumber(item.maxSockets, 0) >= 3;
              }
              return isRunewordCompatibleWithItem(item, plannedRuneword);
            })
            .sort((left, right) => {
              const rightSocketDelta = toNumber(right.maxSockets, 0);
              const leftSocketDelta = toNumber(left.maxSockets, 0);
              if (rightSocketDelta !== leftSocketDelta) {
                return rightSocketDelta - leftSocketDelta;
              }
              return toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
            })[0] || null
        : null;
    const sovereignOffer =
      features.sovereignExchange && (run.actNumber >= 4 || planningArchiveState.unfulfilled || hasOpenPlanningCharter(profile, content))
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword);
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const rightReadySockets = Number(toNumber(right.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              const leftReadySockets = Number(toNumber(left.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              if (rightReadySockets !== leftReadySockets) {
                return rightReadySockets - leftReadySockets;
              }
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const planningOffer =
      plannedRuneword
        ? [...upgradeOptions, ...options]
            .filter((item) => isRunewordCompatibleWithItem(item, plannedRuneword))
            .sort((left, right) => {
              if (planningArchiveState.unfulfilled) {
                const rightSocketsReady = Number(toNumber(right.maxSockets, 0) >= toNumber(plannedRuneword.socketCount, 0));
                const leftSocketsReady = Number(toNumber(left.maxSockets, 0) >= toNumber(plannedRuneword.socketCount, 0));
                if (rightSocketsReady !== leftSocketsReady) {
                  return rightSocketsReady - leftSocketsReady;
                }
                const socketDelta = toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
                if (socketDelta !== 0) {
                  return socketDelta;
                }
              }
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const paragonOffer =
      features.paragonExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const ascendantOffer =
      features.ascendantExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword) && toNumber(item.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword.socketCount, 0));
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const primaryUpgrade =
      upgradeOptions[(lateBias ? upgradeOptions.length - 1 : 0)] ||
      options[Math.max(0, options.length - 1)] ||
      null;
    const secondaryUpgrade =
      upgradeOptions[Math.max(0, upgradeOptions.length - 2)] ||
      options[Math.max(0, options.length - 2)] ||
      null;
    const sidegrade = options[(seed + (slot === "weapon" ? 0 : 1)) % options.length] || null;

    return pickUniqueDefinitions(
      [
        planningOffer,
        sovereignOffer,
        chronicleOffer,
        primaryUpgrade,
        ascendantOffer,
        paragonOffer,
        merchantOffer,
        secondaryUpgrade,
        socketReadyOffer,
        artisanOffer,
        treasuryOffer,
        sidegrade,
      ],
      options,
      desiredCount,
      seed
    );
  }

  function pickVendorRuneOffers(run, runeOptions, desiredCount, seed, content, profile = null) {
    if (runeOptions.length === 0 || desiredCount <= 0) {
      return [];
    }

    const features = getAccountEconomyFeatures(profile);
    const loadout = buildHydratedLoadout(run, content);
    const targetRuneIds = [];
    ["weapon", "armor"].forEach((slot) => {
      const equipment = loadout[slot];
      const runeword = getTargetRunewordForEquipment(equipment, run, content, profile);
      if (!equipment || !runeword || equipment.insertedRunes.length >= runeword.requiredRunes.length) {
        return;
      }
      const codexTargets = features.runewordCodex
        ? runeword.requiredRunes.slice(equipment.insertedRunes.length, equipment.insertedRunes.length + 2)
        : [runeword.requiredRunes[equipment.insertedRunes.length]];
      codexTargets.forEach((runeId) => uniquePush(targetRuneIds, runeId));
    });
    if (features.treasuryExchange) {
      const stashEquipment = (Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [])
        .filter((entry) => entry?.kind === "equipment")
        .map((entry) => entry.equipment)
        .filter(Boolean);
      stashEquipment.forEach((equipment) => {
        const runeword = getTargetRunewordForEquipment(equipment, run, content, profile);
        if (!equipment || !runeword || equipment.insertedRunes.length >= runeword.requiredRunes.length) {
          return;
        }
        runeword.requiredRunes
          .slice(equipment.insertedRunes.length, equipment.insertedRunes.length + 2)
          .forEach((runeId) => uniquePush(targetRuneIds, runeId));
      });
    }
    if (features.runewordCodex || features.treasuryExchange) {
      const planning = getPlanningSummary(profile, content);
      getPlannedRunewordTargets(profile, content).forEach((runeword) => {
        const archiveState = getPlannedRunewordArchiveState(profile, runeword.slot, content);
        const planningCharter = runeword.slot === "weapon" ? planning.weaponCharter : planning.armorCharter;
        const planningTargetCount =
          2 +
          Number(archiveState.unfulfilled && (features.treasuryExchange || features.economyFocus)) +
          Number(archiveState.unfulfilled && features.chronicleExchange) +
          Number(toNumber(archiveState.completedRunCount, 0) > 0 && planningCharter?.hasReadyBase) +
          Number(run.actNumber >= 5 && features.paragonExchange) +
          Number(run.actNumber >= 5 && features.merchantPrincipate) +
          Number(archiveState.unfulfilled && features.sovereignExchange) +
          Number(run.actNumber >= 5 && features.ascendantExchange);
        runeword.requiredRunes.slice(0, planningTargetCount).forEach((runeId) => uniquePush(targetRuneIds, runeId));
      });
    }

    const targetRunes = targetRuneIds
      .map((runeId) => runeOptions.find((rune) => rune.id === runeId) || null)
      .filter(Boolean);
    const premiumRune = runeOptions[Math.max(0, runeOptions.length - 1)] || null;
    const supportRune = runeOptions[Math.max(0, runeOptions.length - 2)] || null;
    const codexRune = features.runewordCodex ? runeOptions[Math.max(0, runeOptions.length - 3)] || null : null;
    const artisanRune = features.artisanStock && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 4)] || null : null;
    const treasuryRune = features.treasuryExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 5)] || null : null;
    const merchantRune = features.merchantPrincipate && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 6)] || null : null;
    const sovereignRune = features.sovereignExchange && run.actNumber >= 4 ? runeOptions[Math.max(0, runeOptions.length - 7)] || null : null;
    const ascendantRune = features.ascendantExchange && run.actNumber >= 5 ? runeOptions[Math.max(0, runeOptions.length - 8)] || null : null;
    const seededRune = runeOptions[seed % runeOptions.length] || null;

    return pickUniqueDefinitions(
      [...(targetRunes || []), premiumRune, supportRune, codexRune, artisanRune, treasuryRune, merchantRune, sovereignRune, ascendantRune, seededRune],
      runeOptions,
      desiredCount,
      seed
    );
  }

  function fillDefinitionSelection(selection, options, desiredCount) {
    const filled = [...selection];
    const seenIds = new Set(filled.map((entry) => entry?.id).filter(Boolean));

    for (let index = options.length - 1; filled.length < desiredCount && index >= 0; index -= 1) {
      const candidate = options[index];
      if (!candidate?.id || seenIds.has(candidate.id)) {
        continue;
      }
      seenIds.add(candidate.id);
      filled.push(candidate);
    }

    return filled.slice(0, desiredCount);
  }

  function generateVendorStock(run, content, profile = null) {
    if (profile) {
      hydrateProfileStash(profile, content);
    }
    const features = getAccountEconomyFeatures(profile);
    const tierAllowance = getVendorTierAllowance(run, profile);
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
      .filter((rune) => rune.progressionTier <= maxTier + 1 + Number(features.runewordCodex))
      .sort((left, right) => left.progressionTier - right.progressionTier);

    const stock = [];
    const loadout = buildHydratedLoadout(run, content);
    const focusOfferBonus = Number(features.economyFocus && (features.advancedVendorStock || features.salvageTithes));
    const artisanOfferBonus = Number(features.artisanStock && run.actNumber >= 5);
    const brokerageOfferBonus = Number(features.brokerageCharter && run.actNumber >= 4);
    const merchantOfferBonus = Number(features.merchantPrincipate && run.actNumber >= 5);
    const chronicleOfferBonus =
      Number(features.chronicleExchange && run.actNumber >= 4) +
      Number(features.chronicleExchange && (hasOpenPlanningCharter(profile, content) || getStashPlanningPressure(profile).stashEntries > 0));
    const sovereignOfferBonus =
      Number(features.sovereignExchange && run.actNumber >= 4) +
      Number(features.sovereignExchange && (hasOpenPlanningCharter(profile, content) || getStashPlanningPressure(profile).socketReadyEntries > 0));
    const paragonOfferBonus = Number(features.paragonExchange && run.actNumber >= 5);
    const ascendantOfferBonus = Number(features.ascendantExchange && run.actNumber >= 5);
    const treasuryOfferBonus = Number(features.treasuryExchange && run.actNumber >= 5);
    const weaponOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 4)) +
      Number(features.advancedVendorStock) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
      merchantOfferBonus +
      chronicleOfferBonus +
      sovereignOfferBonus +
      paragonOfferBonus +
      ascendantOfferBonus +
      treasuryOfferBonus;
    const armorOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
      merchantOfferBonus +
      chronicleOfferBonus +
      sovereignOfferBonus +
      paragonOfferBonus +
      ascendantOfferBonus +
      treasuryOfferBonus;
    const runeOfferCount =
      (run.actNumber >= 5 ? 4 : 2 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) +
      Number(features.runewordCodex) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
      merchantOfferBonus +
      chronicleOfferBonus +
      sovereignOfferBonus +
      paragonOfferBonus +
      ascendantOfferBonus +
      treasuryOfferBonus;
    const selectedWeapons = fillDefinitionSelection(
      pickVendorEquipmentOffers(
      "weapon",
      run,
      loadout.weapon,
      weaponOptions,
      weaponOfferCount,
      itemSeed,
      content,
      profile
      ),
      weaponOptions,
      weaponOfferCount
    );
    const selectedArmor = fillDefinitionSelection(
      pickVendorEquipmentOffers(
      "armor",
      run,
      loadout.armor,
      armorOptions,
      armorOfferCount,
      itemSeed + 3,
      content,
      profile
      ),
      armorOptions,
      armorOfferCount
    );
    const selectedRunes = fillDefinitionSelection(
      pickVendorRuneOffers(run, runeOptions, runeOfferCount, runeSeed, content, profile),
      runeOptions,
      runeOfferCount
    );

    [...selectedWeapons, ...selectedArmor].filter(Boolean).forEach((item, index) => {
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

    selectedRunes.filter(Boolean).forEach((rune, index) => {
      stock.push({
        entryId: buildVendorEntryId(run, index + selectedWeapons.length + selectedArmor.length),
        kind: "rune",
        runeId: rune.id,
      });
    });

    return stock;
  }

  function normalizeVendorStock(run, content, profile = null) {
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

    run.town.vendor.stock = normalized.length > 0 ? normalized : generateVendorStock(run, content, profile);
  }

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

  function buildVendorRefreshAction(run, content, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    const planning = getPlanningSummary(profile, content);
    const planningOverview = planning.overview || getPlanningSummary(null, null).overview;
    const cost = getVendorRefreshCost(run, profile, content);
    const affordable = run.gold >= cost;
    const previewLines = [`Refresh fee ${cost} gold.`, `Current refresh count ${run.town.vendor.refreshCount}.`];
    if (features.advancedVendorStock) {
      previewLines.push("Advanced vendor stock is widening equipment offers.");
    }
    if (features.runewordCodex) {
      previewLines.push("Runeword Codex is biasing rune stock toward unfinished recipes.");
    }
    if (features.economyLedger) {
      previewLines.push("Economy Ledger discount is active on town trading.");
    }
    if (features.chronicleExchange) {
      previewLines.push("Chronicle Exchange is turning archive review into live trade leverage for planning and stash pressure.");
    }
    if (features.merchantPrincipate) {
      previewLines.push("Merchant Principate is widening the late market toward sovereign-tier stock and pricing leverage.");
    }
    if (features.sovereignExchange) {
      previewLines.push("Sovereign Exchange is binding deeper archive retention to premium late-market planning pressure.");
    }
    if (features.treasuryExchange) {
      previewLines.push("Treasury Exchange is opening premium late-act leverage around stash consignment, socket work, and vendor planning.");
    }
    if (features.paragonExchange) {
      previewLines.push("Paragon Exchange is binding mastery doctrine to trade leverage for premium late-act replacements.");
    }
    if (features.ascendantExchange) {
      previewLines.push("Ascendant Exchange is steering the strongest Act V offers toward staged premium replacements.");
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
          "Buy",
          buyPrice,
          run.gold < buyPrice
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
            "Consign",
            consignPrice,
            run.gold < consignPrice
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
            "Equip"
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
          "Withdraw"
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
    const activeEconomyFeatures = [
      features.advancedVendorStock ? "advanced vendor stock" : "",
      features.runewordCodex ? "runeword codex" : "",
      features.economyLedger ? "economy ledger" : "",
      features.salvageTithes ? "salvage tithes" : "",
      features.artisanStock ? "artisan stock" : "",
      features.brokerageCharter ? "brokerage charter" : "",
      features.treasuryExchange ? "treasury exchange" : "",
      features.merchantPrincipate ? "merchant principate" : "",
      features.sovereignExchange ? "sovereign exchange" : "",
      features.ascendantExchange ? "ascendant exchange" : "",
    ].filter(Boolean);

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
