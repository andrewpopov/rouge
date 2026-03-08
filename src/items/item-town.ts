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
    getEntryLabel,
    hydrateProfileStash,
    hydrateRunLoadout,
    normalizeInventoryEntry,
    removeCarriedEntry,
    socketInventoryRune,
    stashCarriedEntry,
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
      salvageTithes;
    return {
      advancedVendorStock: hasTownFeature(profile, "advanced_vendor_stock"),
      runewordCodex: hasTownFeature(profile, "runeword_codex"),
      economyLedger: hasTownFeature(profile, "economy_ledger"),
      salvageTithes,
      artisanStock: hasTownFeature(profile, "artisan_stock"),
      brokerageCharter: hasTownFeature(profile, "brokerage_charter"),
      treasuryExchange: hasTownFeature(profile, "treasury_exchange"),
      economyFocus: focusedTreeId === "economy" && economyUnlocked,
    };
  }

  function getPlannedRunewordId(profile, slot) {
    if (slot !== "weapon" && slot !== "armor") {
      return "";
    }
    const planningKey = slot === "weapon" ? "weaponRunewordId" : "armorRunewordId";
    return typeof profile?.meta?.planning?.[planningKey] === "string" ? profile.meta.planning[planningKey] : "";
  }

  function getPlannedRuneword(profile, slot, content) {
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot));
    return runeword?.slot === slot ? runeword : null;
  }

  function getPlannedRunewordTargets(profile, content) {
    return ["weapon", "armor"]
      .map((slot) => getPlannedRuneword(profile, slot, content))
      .filter(Boolean);
  }

  function getPlanningSummary(profile) {
    return (
      runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile)?.planning || {
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
      }
    );
  }

  function getPlannedRunewordArchiveState(profile, slot) {
    const planning = getPlanningSummary(profile);
    return {
      runewordId: slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId,
      archivedRunCount: slot === "weapon" ? planning.weaponArchivedRunCount : planning.armorArchivedRunCount,
      completedRunCount: slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount,
      bestActsCleared: slot === "weapon" ? planning.weaponBestActsCleared : planning.armorBestActsCleared,
      unfulfilled: Boolean(slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId) &&
        (slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount) === 0,
    };
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

  function getVendorRefreshCost(run, profile = null) {
    const features = getAccountEconomyFeatures(profile);
    const discount =
      (features.advancedVendorStock ? 2 : 0) +
      (features.economyLedger ? 4 : 0) +
      (features.salvageTithes ? 2 : 0) +
      (features.artisanStock ? 2 : 0) +
      (features.brokerageCharter ? 2 : 0) +
      (features.treasuryExchange ? 3 : 0) +
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
    const planningArchiveState = planningMatch ? getPlannedRunewordArchiveState(profile, planningMatch.slot) : null;
    const planningDiscount =
      planningMatch ? 3 + Number(features.economyFocus) + Number(planningArchiveState?.unfulfilled) * 2 : 0;
    const fee = baseFee + Math.floor(buyPrice * 0.12) + stashLoadFee + planningFee - Number(features.economyFocus) - planningDiscount;
    return Math.max(entry.kind === "rune" ? 4 : 8, fee);
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
    return (
      Math.min(2, Math.floor(Math.max(0, toNumber(run.level, 1) - 1) / 3)) +
      Math.min(1, toNumber(run.progression?.bossTrophies?.length, 0)) +
      Math.min(1, Math.floor(Math.max(0, toNumber(run.town?.vendor?.refreshCount, 0)) / 2)) +
      Number(features.advancedVendorStock) +
      Number(features.brokerageCharter && run.actNumber >= 4) +
      Number(features.artisanStock && run.actNumber >= 5) +
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
    const lateBias = features.advancedVendorStock || run.actNumber >= 4 || toNumber(run.town?.vendor?.refreshCount, 0) > 0;
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
    const plannedRuneword = getPlannedRuneword(profile, slot, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot);
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
      [planningOffer, primaryUpgrade, secondaryUpgrade, socketReadyOffer, artisanOffer, treasuryOffer, sidegrade],
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
      getPlannedRunewordTargets(profile, content).forEach((runeword) => {
        const archiveState = getPlannedRunewordArchiveState(profile, runeword.slot);
        const planningTargetCount = 2 + Number(archiveState.unfulfilled && (features.treasuryExchange || features.economyFocus));
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
    const seededRune = runeOptions[seed % runeOptions.length] || null;

    return pickUniqueDefinitions([...(targetRunes || []), premiumRune, supportRune, codexRune, artisanRune, treasuryRune, seededRune], runeOptions, desiredCount, seed);
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
    const treasuryOfferBonus = Number(features.treasuryExchange && run.actNumber >= 5);
    const weaponOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 4)) +
      Number(features.advancedVendorStock) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
      treasuryOfferBonus;
    const armorOfferCount =
      (run.actNumber >= 5 ? 3 : 1 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
      treasuryOfferBonus;
    const runeOfferCount =
      (run.actNumber >= 5 ? 4 : 2 + Number(run.actNumber >= 3)) +
      Number(features.advancedVendorStock) +
      Number(features.runewordCodex) +
      focusOfferBonus +
      artisanOfferBonus +
      brokerageOfferBonus +
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
    const cost = getVendorRefreshCost(run, profile);
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
    if (features.treasuryExchange) {
      previewLines.push("Treasury Exchange is opening premium late-act leverage around stash and vendor planning.");
    }
    const plannedRunewords = getPlannedRunewordTargets(profile, content)
      .map((runeword) => runeword?.name)
      .filter(Boolean);
    if (plannedRunewords.length > 0) {
      previewLines.push(`Planning charters active for ${plannedRunewords.join(" and ")}.`);
    }
    const unfulfilledPlannedRunewords = (["weapon", "armor"] as const)
      .map((slot) => {
        const archiveState = getPlannedRunewordArchiveState(profile, slot);
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
            ],
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
      const cost = getVendorRefreshCost(run, profile);
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

    if (actionId.startsWith("inventory_sell_")) {
      return sellCarriedEntry(run, actionId.replace("inventory_sell_", ""), content, profile);
    }

    if (actionId.startsWith("inventory_stash_")) {
      return stashCarriedEntry(run, profile, actionId.replace("inventory_stash_", ""));
    }

    if (actionId.startsWith("stash_withdraw_")) {
      return withdrawStashEntry(run, profile, actionId.replace("stash_withdraw_", ""));
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
        `Treasury Exchange can consign vendor offers directly into stash. Current planning load: ${planningPressure.stashEntries} stash entries, ${planningPressure.socketReadyEntries} socket-ready bases.`
      );
    }
    const plannedRunewords = getPlannedRunewordTargets(profile, content);
    if (plannedRunewords.length > 0) {
      lines.push(`Planning charters: ${plannedRunewords.map((runeword) => runeword.name).join(" / ")}.`);
    }
    const planning = getPlanningSummary(profile);
    if (planning.plannedRunewordCount > 0) {
      lines.push(
        `Planning record: ${planning.fulfilledPlanCount}/${planning.plannedRunewordCount} active charter${
          planning.plannedRunewordCount === 1 ? "" : "s"
        } already fulfilled in the archive.`
      );
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
