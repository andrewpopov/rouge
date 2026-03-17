(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const {
    buildHydratedLoadout,
    getItemDefinition,

    getRuneDefinition,
    getRuneRewardPool,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    isRuneAllowedInSlot,
    resolveRunewordId,
    toNumber,
  } = itemCatalog;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState, getPlannedRunewordId } = itemTown;

  function describeBonuses(bonuses: ItemBonusSet) {
    const lines = [];
    if (bonuses.heroDamageBonus) {
      lines.push(`Hero card damage +${bonuses.heroDamageBonus}.`);
    }
    if (bonuses.heroGuardBonus) {
      lines.push(`Guard skills +${bonuses.heroGuardBonus}.`);
    }
    if (bonuses.heroBurnBonus) {
      lines.push(`Burn application +${bonuses.heroBurnBonus}.`);
    }
    if (bonuses.heroMaxLife) {
      lines.push(`Hero max Life +${bonuses.heroMaxLife}.`);
    }
    if (bonuses.heroMaxEnergy) {
      lines.push(`Hero max Energy +${bonuses.heroMaxEnergy}.`);
    }
    if (bonuses.heroPotionHeal) {
      lines.push(`Potion healing +${bonuses.heroPotionHeal}.`);
    }
    if (bonuses.mercenaryAttack) {
      lines.push(`Mercenary attack +${bonuses.mercenaryAttack}.`);
    }
    if (bonuses.mercenaryMaxLife) {
      lines.push(`Mercenary max Life +${bonuses.mercenaryMaxLife}.`);
    }
    return lines;
  }

  function getEquipmentProgressScore(equipment: RunEquipmentState | null, content: GameContent) {
    if (!equipment) {
      return 0;
    }
    const item = getItemDefinition(content, equipment.itemId);
    return (item?.progressionTier || 0) * 10 + equipment.socketsUnlocked * 2 + equipment.insertedRunes.length + (equipment.runewordId ? 5 : 0);
  }

  function getFocusSlots(run: RunState, actNumber: number, encounterNumber: number, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const baseOrder = (actNumber + encounterNumber + run.summary.encountersCleared) % 2 === 0 ? ["weapon", "armor"] : ["armor", "weapon"];
    return [...baseOrder].sort((left: string, right: string) => {
      const scoreDelta = getEquipmentProgressScore((loadout as unknown as Record<string, RunEquipmentState | null>)[left], content) - getEquipmentProgressScore((loadout as unknown as Record<string, RunEquipmentState | null>)[right], content);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return baseOrder.indexOf(left) - baseOrder.indexOf(right);
    });
  }

  function isLateActPivotZone(zone: ZoneState | null, actNumber: number) {
    return (
      actNumber >= 4 &&
      (zone?.kind === "boss" ||
        zone?.kind === "miniboss" ||
        zone?.zoneRole === "branchMiniboss" ||
        zone?.zoneRole === "branchBattle")
    );
  }

  function getProgressionTierAllowance(run: RunState, zone: ZoneState) {
    const levelAllowance = Math.min(2, Math.floor(Math.max(0, toNumber(run?.level, 1) - 1) / 2));
    const trophyAllowance = zone.kind === "boss" ? 1 : Math.min(1, toNumber(run?.progression?.bossTrophies?.length, 0));
    return levelAllowance + trophyAllowance;
  }

  function getAvailableItemsForSlot(slot: string, actNumber: number, zone: ZoneState, run: RunState, content: GameContent) {
    const tierAllowance = zone.kind === "boss" ? 1 : 0;
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    return (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item: RuntimeItemDefinition) => item.slot === slot && item.progressionTier <= actNumber + tierAllowance + progressionAllowance)
      .sort((left: RuntimeItemDefinition, right: RuntimeItemDefinition) => left.progressionTier - right.progressionTier);
  }

  function getPlannedRuneword(slot: string, profile: ProfileState | null, content: GameContent) {
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot as "weapon" | "armor", content));
    return runeword?.slot === slot ? runeword : null;
  }

  function getPlanningSummary(profile: ProfileState | null, content: GameContent | null = null) {
    return (
      runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile, content)?.planning || {
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
      }
    );
  }

  function getPlanningCharterSummary(profile: ProfileState | null, slot: string, content: GameContent | null = null) {
    const planning = getPlanningSummary(profile, content);
    return slot === "weapon" ? planning.weaponCharter || null : planning.armorCharter || null;
  }

  function sortRewardUpgradeItems(
    upgradeItems: RuntimeItemDefinition[],
    currentEquipment: RunEquipmentState | null,
    actNumber: number,
    zone: ZoneState,
    profile: ProfileState | null = null,
    plannedRuneword: RuntimeRunewordDefinition | null = null,
    planningUnfulfilled: boolean = false,
    planningCharter: ProfilePlanningCharterSummary | null = null
  ) {
    const features = getAccountEconomyFeatures(profile);
    const preservedSockets = Math.max(
      toNumber(currentEquipment?.socketsUnlocked, 0),
      Array.isArray(currentEquipment?.insertedRunes) ? currentEquipment.insertedRunes.length : 0
    );
    const premiumLateSockets = features.tradeHegemony || features.imperialExchange || features.mythicExchange;
    const hasLateEconomyPressure =
      features.artisanStock ||
      features.brokerageCharter ||
      features.treasuryExchange ||
      features.merchantPrincipate ||
      features.tradeHegemony ||
      features.sovereignExchange ||
      features.ascendantExchange ||
      features.imperialExchange ||
      features.mythicExchange ||
      features.economyFocus;
    let preferredLateSockets = 0;
    if (isLateActPivotZone(zone, actNumber) && hasLateEconomyPressure && !planningCharter?.hasReadyBase) {
      preferredLateSockets = premiumLateSockets ? 4 : 3;
    }
    const preferredSockets = Math.max(
      preservedSockets,
      preferredLateSockets,
      planningUnfulfilled && !planningCharter?.hasReadyBase ? toNumber(plannedRuneword?.socketCount, 0) : 0
    );
    const charterBaseTier = toNumber(planningCharter?.bestBaseTier, 0);

    return [...upgradeItems].sort((left: RuntimeItemDefinition, right: RuntimeItemDefinition) => {
      const rightBeatsParkedBase = Number(toNumber(right?.progressionTier, 0) > charterBaseTier);
      const leftBeatsParkedBase = Number(toNumber(left?.progressionTier, 0) > charterBaseTier);
      if (rightBeatsParkedBase !== leftBeatsParkedBase) {
        return rightBeatsParkedBase - leftBeatsParkedBase;
      }

      const rightParagonPremium = Number(
        (features.paragonExchange || features.ascendantExchange || features.mythicExchange) &&
          isLateActPivotZone(zone, actNumber) &&
          toNumber(right?.progressionTier, 0) >= Math.max(features.ascendantExchange || features.mythicExchange ? 7 : 6, actNumber + 1) &&
          toNumber(right?.maxSockets, 0) >= (features.ascendantExchange || features.mythicExchange ? 4 : 3)
      );
      const leftParagonPremium = Number(
        (features.paragonExchange || features.ascendantExchange || features.mythicExchange) &&
          isLateActPivotZone(zone, actNumber) &&
          toNumber(left?.progressionTier, 0) >= Math.max(features.ascendantExchange || features.mythicExchange ? 7 : 6, actNumber + 1) &&
          toNumber(left?.maxSockets, 0) >= (features.ascendantExchange || features.mythicExchange ? 4 : 3)
      );
      if (rightParagonPremium !== leftParagonPremium) {
        return rightParagonPremium - leftParagonPremium;
      }

      const rightPreserves = Number(toNumber(right?.maxSockets, 0) >= preservedSockets);
      const leftPreserves = Number(toNumber(left?.maxSockets, 0) >= preservedSockets);
      if (rightPreserves !== leftPreserves) {
        return rightPreserves - leftPreserves;
      }

      const rightPreferred = Number(toNumber(right?.maxSockets, 0) >= preferredSockets);
      const leftPreferred = Number(toNumber(left?.maxSockets, 0) >= preferredSockets);
      if (rightPreferred !== leftPreferred) {
        return rightPreferred - leftPreferred;
      }

      const tierDelta = toNumber(right?.progressionTier, 0) - toNumber(left?.progressionTier, 0);
      if (tierDelta !== 0) {
        return tierDelta;
      }

      return toNumber(right?.maxSockets, 0) - toNumber(left?.maxSockets, 0);
    });
  }

  function getUpgradeItemForSlot(slot: string, equipment: RunEquipmentState | null, actNumber: number, zone: ZoneState, run: RunState, content: GameContent, profile: ProfileState | null = null) {
    const availableItems = getAvailableItemsForSlot(slot, actNumber, zone, run, content);
    const features = getAccountEconomyFeatures(profile);
    const plannedRuneword = getPlannedRuneword(slot, profile, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot as "weapon" | "armor", content);
    const planningCharter = getPlanningCharterSummary(profile, slot, content);
    if (!equipment) {
      const sortedItems = sortRewardUpgradeItems(availableItems, null, actNumber, zone, profile, plannedRuneword, planningArchiveState.unfulfilled, planningCharter);
      if (
        plannedRuneword &&
        !planningCharter?.compatibleBaseCount &&
        (
          features.runewordCodex ||
          features.treasuryExchange ||
          features.merchantPrincipate ||
          features.tradeHegemony ||
          features.sovereignExchange ||
          features.imperialExchange ||
          features.mythicExchange ||
          features.economyFocus
        )
      ) {
        const plannedItems = sortedItems.filter((item: RuntimeItemDefinition) => isRunewordCompatibleWithItem(item, plannedRuneword));
        return plannedItems[0] || sortedItems[0] || null;
      }
      return sortedItems[0] || null;
    }

    const currentItem = getItemDefinition(content, equipment.itemId);
    const currentTier = currentItem?.progressionTier || 0;
    const upgradeItems = availableItems.filter((item: RuntimeItemDefinition) => item.progressionTier > currentTier);
    const shouldForcePlanningReplacement =
      plannedRuneword &&
      (
        features.runewordCodex ||
        features.treasuryExchange ||
        features.merchantPrincipate ||
        features.tradeHegemony ||
        features.sovereignExchange ||
        features.imperialExchange ||
        features.mythicExchange ||
        features.economyFocus
      ) &&
      (!planningCharter?.compatibleBaseCount ||
        (isLateActPivotZone(zone, actNumber) && toNumber(planningCharter?.bestBaseTier, 0) < Math.max(actNumber, currentTier + 1)));
    const planningItems =
      shouldForcePlanningReplacement
        ? availableItems.filter((item: RuntimeItemDefinition) => item.id !== currentItem?.id && item.progressionTier >= currentTier && isRunewordCompatibleWithItem(item, plannedRuneword))
        : [];
    const candidateItems = planningItems.length > 0 ? planningItems : upgradeItems;
    if (candidateItems.length === 0) {
      return null;
    }
    const sortedUpgradeItems = sortRewardUpgradeItems(
      candidateItems,
      equipment,
      actNumber,
      zone,
      profile,
      plannedRuneword,
      planningArchiveState.unfulfilled,
      planningCharter
    );
    if (zone.kind === "boss" || zone.kind === "miniboss" || zone.zoneRole === "branchBattle") {
      return sortedUpgradeItems[0] || null;
    }
    return sortedUpgradeItems[sortedUpgradeItems.length - 1] || null;
  }

  function buildReplacementText(currentEquipment: RunEquipmentState | null, nextItem: RuntimeItemDefinition | null, content: GameContent) {
    if (!currentEquipment) {
      return "Slot is empty.";
    }

    const currentItem = getItemDefinition(content, currentEquipment.itemId);
    const preservedRunes = currentEquipment.insertedRunes.length;
    const tierDelta = Math.max(0, toNumber(nextItem?.progressionTier, 0) - toNumber(currentItem?.progressionTier, 0));
    return `Upgrades ${currentItem?.name || currentEquipment.itemId} by ${tierDelta} tier${tierDelta === 1 ? "" : "s"} and preserves ${preservedRunes} socketed rune${preservedRunes === 1 ? "" : "s"}.`;
  }

  function pickFallbackRuneId(slot: string, actNumber: number, encounterNumber: number, run: RunState, zone: ZoneState, content: GameContent) {
    const pool = getRuneRewardPool(slot as "weapon" | "armor");
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    const available = pool.filter((runeId: string) => {
      const rune = getRuneDefinition(content, runeId);
      return rune && rune.progressionTier <= actNumber + 1 + progressionAllowance && isRuneAllowedInSlot(rune, slot as "weapon" | "armor");
    });
    if (available.length === 0) {
      return "";
    }
    return available[(actNumber + encounterNumber + run.summary.encountersCleared) % available.length];
  }

  function shouldPrioritizeLateActReplacement(equipment: RunEquipmentState | null, upgradeItem: RuntimeItemDefinition | null, actNumber: number, zone: ZoneState, run: RunState, content: GameContent, profile: ProfileState | null = null) {
    if (!equipment || !upgradeItem || !isLateActPivotZone(zone, actNumber)) {
      return false;
    }

    const currentItem = getItemDefinition(content, equipment.itemId);
    if (!currentItem) {
      return false;
    }

    const features = getAccountEconomyFeatures(profile);
    const tierDelta = Math.max(0, toNumber(upgradeItem?.progressionTier, 0) - toNumber(currentItem?.progressionTier, 0));
    const socketDelta = Math.max(0, toNumber(upgradeItem?.maxSockets, 0) - toNumber(currentItem?.maxSockets, 0));
    const currentRunewordId = resolveRunewordId(equipment, content);
    const currentBaseIsStale = toNumber(currentItem?.progressionTier, 0) <= Math.max(1, actNumber - 2);
    const economyPressure =
      features.artisanStock ||
      features.brokerageCharter ||
      features.treasuryExchange ||
      features.merchantPrincipate ||
      features.sovereignExchange ||
      features.ascendantExchange ||
      features.economyFocus;
    const paragonPressure = (features.paragonExchange || features.ascendantExchange) && actNumber >= 5;

    return (
      tierDelta >= 2 ||
      (Boolean(currentRunewordId) && tierDelta >= 1) ||
      (economyPressure && (tierDelta >= 1 || socketDelta >= 1)) ||
      (paragonPressure && (tierDelta >= 1 || socketDelta >= 1)) ||
      (zone?.kind === "boss" && currentBaseIsStale && tierDelta >= 1)
    );
  }

  runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS = {
    describeBonuses,
    getFocusSlots,
    isLateActPivotZone,
    getAvailableItemsForSlot,
    getPlannedRuneword,
    getPlanningSummary,
    getPlanningCharterSummary,
    getUpgradeItemForSlot,
    buildReplacementText,
    pickFallbackRuneId,
    shouldPrioritizeLateActReplacement,
  };
})();
