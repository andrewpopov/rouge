(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const itemLoadout = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const {
    buildHydratedLoadout,
    getItemDefinition,
    getPreferredRunewordForEquipment,
    getRuneDefinition,
    getRuneRewardPool,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    isRuneAllowedInSlot,
    resolveRunewordId,
    toNumber,
  } = itemCatalog;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState, getPlannedRunewordId } = itemTown;

  function describeBonuses(bonuses) {
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

  function getEquipmentProgressScore(equipment, content) {
    if (!equipment) {
      return 0;
    }
    const item = getItemDefinition(content, equipment.itemId);
    return (item?.progressionTier || 0) * 10 + equipment.socketsUnlocked * 2 + equipment.insertedRunes.length + (equipment.runewordId ? 5 : 0);
  }

  function getFocusSlots(run, actNumber, encounterNumber, content) {
    const loadout = buildHydratedLoadout(run, content);
    const baseOrder = (actNumber + encounterNumber + run.summary.encountersCleared) % 2 === 0 ? ["weapon", "armor"] : ["armor", "weapon"];
    return [...baseOrder].sort((left, right) => {
      const scoreDelta = getEquipmentProgressScore(loadout[left], content) - getEquipmentProgressScore(loadout[right], content);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return baseOrder.indexOf(left) - baseOrder.indexOf(right);
    });
  }

  function isLateActPivotZone(zone, actNumber) {
    return (
      actNumber >= 4 &&
      (zone?.kind === "boss" ||
        zone?.kind === "miniboss" ||
        zone?.zoneRole === "branchMiniboss" ||
        zone?.zoneRole === "branchBattle")
    );
  }

  function getProgressionTierAllowance(run, zone) {
    const levelAllowance = Math.min(2, Math.floor(Math.max(0, toNumber(run?.level, 1) - 1) / 2));
    const trophyAllowance = zone.kind === "boss" ? 1 : Math.min(1, toNumber(run?.progression?.bossTrophies?.length, 0));
    return levelAllowance + trophyAllowance;
  }

  function getAvailableItemsForSlot(slot, actNumber, zone, run, content) {
    const tierAllowance = zone.kind === "boss" ? 1 : 0;
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    return (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item) => item.slot === slot && item.progressionTier <= actNumber + tierAllowance + progressionAllowance)
      .sort((left, right) => left.progressionTier - right.progressionTier);
  }

  function getPlannedRuneword(slot, profile, content) {
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot, content));
    return runeword?.slot === slot ? runeword : null;
  }

  function getPlanningSummary(profile, content = null) {
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

  function getPlanningCharterSummary(profile, slot, content = null) {
    const planning = getPlanningSummary(profile, content);
    return slot === "weapon" ? planning.weaponCharter || null : planning.armorCharter || null;
  }

  function sortRewardUpgradeItems(
    upgradeItems,
    currentEquipment,
    actNumber,
    zone,
    profile = null,
    plannedRuneword = null,
    planningUnfulfilled = false,
    planningCharter = null
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

    return [...upgradeItems].sort((left, right) => {
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

  function getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content, profile = null) {
    const availableItems = getAvailableItemsForSlot(slot, actNumber, zone, run, content);
    const features = getAccountEconomyFeatures(profile);
    const plannedRuneword = getPlannedRuneword(slot, profile, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot, content);
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
        const plannedItems = sortedItems.filter((item) => isRunewordCompatibleWithItem(item, plannedRuneword));
        return plannedItems[0] || sortedItems[0] || null;
      }
      return sortedItems[0] || null;
    }

    const currentItem = getItemDefinition(content, equipment.itemId);
    const currentTier = currentItem?.progressionTier || 0;
    const upgradeItems = availableItems.filter((item) => item.progressionTier > currentTier);
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
        ? availableItems.filter((item) => item.id !== currentItem?.id && item.progressionTier >= currentTier && isRunewordCompatibleWithItem(item, plannedRuneword))
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

  function buildReplacementText(currentEquipment, nextItem, content) {
    if (!currentEquipment) {
      return "Slot is empty.";
    }

    const currentItem = getItemDefinition(content, currentEquipment.itemId);
    const preservedRunes = currentEquipment.insertedRunes.length;
    const tierDelta = Math.max(0, toNumber(nextItem?.progressionTier, 0) - toNumber(currentItem?.progressionTier, 0));
    return `Upgrades ${currentItem?.name || currentEquipment.itemId} by ${tierDelta} tier${tierDelta === 1 ? "" : "s"} and preserves ${preservedRunes} socketed rune${preservedRunes === 1 ? "" : "s"}.`;
  }

  function buildItemChoice(
    itemId,
    run,
    content,
    options: {
      profile?: ProfileState | null;
      lateActPivot?: boolean;
      plannedRuneword?: RuntimeRunewordDefinition | null;
      planningUnfulfilled?: boolean;
      planningCharter?: ProfilePlanningCharterSummary | null;
    } = {}
  ) {
    const item = getItemDefinition(content, itemId);
    if (!item) {
      return null;
    }

    const loadout = buildHydratedLoadout(run, content);
    const currentEquipment = loadout[item.slot];
    const features = getAccountEconomyFeatures(options.profile);
    const previewLines = [
      ...describeBonuses(item.bonuses),
      `Base sockets ${item.maxSockets}.`,
      buildReplacementText(currentEquipment, item, content),
    ];
    if (options.plannedRuneword && isRunewordCompatibleWithItem(item, options.plannedRuneword)) {
      previewLines.push(`Planning charter: ${options.plannedRuneword.name}.`);
    }
    if (options.planningCharter?.hasReadyBase && options.plannedRuneword) {
      previewLines.push(`Vault already has a ready ${options.plannedRuneword.name} base parked.`);
    } else if (toNumber(options.planningCharter?.preparedBaseCount, 0) > 0 && options.plannedRuneword) {
      previewLines.push(`Vault already has a prepared ${options.plannedRuneword.name} base parked.`);
    }
    if (toNumber(options.planningCharter?.completedRunCount, 0) > 0 && options.plannedRuneword) {
      previewLines.push(
        `Archive already proved ${options.plannedRuneword.name} through Act ${Math.max(1, toNumber(options.planningCharter?.bestActsCleared, 0))}${
          toNumber(options.planningCharter?.bestCompletedLoadoutTier, 0) > 0
            ? ` at loadout tier ${toNumber(options.planningCharter?.bestCompletedLoadoutTier, 0)}`
            : ""
        }. This reward is supporting a repeat forge.`
      );
    }
    if (options.planningUnfulfilled && options.plannedRuneword) {
      previewLines.push("Archive charter still unfulfilled across the account.");
    }

    if (options.lateActPivot) {
      previewLines.push("Late-act pivot: replace the old base before spending more sockets or runes on it.");
    }
    if (
      options.lateActPivot &&
      (
        features.artisanStock ||
        features.brokerageCharter ||
        features.treasuryExchange ||
        features.merchantPrincipate ||
        features.tradeHegemony ||
        features.sovereignExchange ||
        features.ascendantExchange ||
        features.imperialExchange ||
        features.mythicExchange ||
        features.economyFocus
      )
    ) {
      previewLines.push("Trade Network is steering this reward toward a socket-ready late-game replacement base.");
    }
    if (options.lateActPivot && features.treasuryExchange) {
      previewLines.push("Treasury Exchange is preserving this reward as a premium replacement instead of a short-term sidegrade.");
    }
    if (options.lateActPivot && features.merchantPrincipate) {
      previewLines.push("Merchant Principate is widening this into a sovereign-tier late-market replacement offer.");
    }
    if (options.lateActPivot && features.sovereignExchange) {
      previewLines.push("Sovereign Exchange is binding archive pressure to this premium staged replacement pivot.");
    }
    if (options.lateActPivot && features.paragonExchange) {
      previewLines.push("Paragon Exchange is escalating this into a premium replacement pivot instead of another incremental upgrade.");
    }
    if (options.lateActPivot && features.ascendantExchange) {
      previewLines.push("Ascendant Exchange is escalating this into the strongest staged late-act replacement on offer.");
    }
    if (options.lateActPivot && features.tradeHegemony) {
      previewLines.push("Trade Hegemony is widening this into a third-wave market replacement instead of a late sidegrade.");
    }
    if (options.lateActPivot && features.imperialExchange) {
      previewLines.push("Imperial Exchange is binding imperial archive pressure to this premium replacement pivot.");
    }
    if (options.lateActPivot && features.mythicExchange) {
      previewLines.push("Mythic Exchange is escalating this into a mythic four-socket replacement pivot.");
    }

    return {
      id: `reward_item_${item.id}`,
      kind: "item",
      title: item.name,
      subtitle: item.slot === "weapon" ? "Equip Weapon" : "Equip Armor",
      description: item.summary,
      previewLines,
      effects: [{ kind: "equip_item", itemId: item.id }],
    };
  }

  function buildSocketChoice(slot, run, content) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    if (!equipment) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    if (!item || equipment.socketsUnlocked >= item.maxSockets) {
      return null;
    }

    return {
      id: `reward_socket_${slot}`,
      kind: "socket",
      title: slot === "weapon" ? "Larzuk's Weapon Socket" : "Larzuk's Armor Socket",
      subtitle: "Open Socket",
      description: `Add one permanent socket to ${item.name}.`,
      previewLines: [
        `${item.name} sockets ${equipment.socketsUnlocked}/${item.maxSockets} -> ${equipment.socketsUnlocked + 1}/${item.maxSockets}.`,
        "Existing runes remain in place.",
      ],
      effects: [{ kind: "add_socket", slot }],
    };
  }

  function buildRuneChoice(runeId, slot, run, content, runeword = null) {
    const rune = getRuneDefinition(content, runeId);
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    if (!rune || !equipment || !isRuneAllowedInSlot(rune, slot)) {
      return null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const previewLines = [
      ...describeBonuses(rune.bonuses),
      `Socket into ${item?.name || equipment.itemId}.`,
      `${equipment.insertedRunes.length + 1}/${equipment.socketsUnlocked} sockets filled.`,
    ];

    if (runeword) {
      const nextSequence = [...equipment.insertedRunes, rune.id]
        .map((entry) => getRuneDefinition(content, entry)?.name || entry)
        .join(" + ");
      previewLines.push(`Route to ${runeword.name}: ${nextSequence}.`);
    }

    return {
      id: `reward_rune_${slot}_${rune.id}`,
      kind: "rune",
      title: rune.name,
      subtitle: slot === "weapon" ? "Socket Weapon Rune" : "Socket Armor Rune",
      description: rune.summary,
      previewLines,
      effects: [{ kind: "socket_rune", runeId: rune.id, slot }],
    };
  }

  function pickFallbackRuneId(slot, actNumber, encounterNumber, run, zone, content) {
    const pool = getRuneRewardPool(slot);
    const progressionAllowance = getProgressionTierAllowance(run, zone);
    const available = pool.filter((runeId) => {
      const rune = getRuneDefinition(content, runeId);
      return rune && rune.progressionTier <= actNumber + 1 + progressionAllowance && isRuneAllowedInSlot(rune, slot);
    });
    if (available.length === 0) {
      return "";
    }
    return available[(actNumber + encounterNumber + run.summary.encountersCleared) % available.length];
  }

  function shouldPrioritizeLateActReplacement(equipment, upgradeItem, actNumber, zone, run, content, profile = null) {
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

  function buildChoiceForSlot(slot, run, zone, actNumber, encounterNumber, content, profile = null) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    const upgradeItem = getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content, profile);
    const plannedRuneword = getPlannedRuneword(slot, profile, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot, content);
    const planningCharter = getPlanningCharterSummary(profile, slot, content);

    if (!equipment) {
      return upgradeItem
        ? buildItemChoice(upgradeItem.id, run, content, {
            lateActPivot: isLateActPivotZone(zone, actNumber),
            profile,
            plannedRuneword,
            planningUnfulfilled: planningArchiveState.unfulfilled,
            planningCharter,
          })
        : null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const targetRuneword = equipment.runewordId
      ? null
      : getPreferredRunewordForEquipment(equipment, run, content, getPlannedRunewordId(profile, slot, content));

    const planningPivot =
      upgradeItem &&
      plannedRuneword &&
      planningArchiveState.unfulfilled &&
      isLateActPivotZone(zone, actNumber) &&
      isRunewordCompatibleWithItem(upgradeItem, plannedRuneword);

    if (
      upgradeItem &&
      upgradeItem.id !== equipment.itemId &&
      (shouldPrioritizeLateActReplacement(equipment, upgradeItem, actNumber, zone, run, content, profile) || planningPivot)
    ) {
      return buildItemChoice(upgradeItem.id, run, content, {
        lateActPivot: true,
        profile,
        plannedRuneword,
        planningUnfulfilled: planningArchiveState.unfulfilled,
        planningCharter,
      });
    }

    if (targetRuneword) {
      if (equipment.socketsUnlocked < targetRuneword.socketCount && equipment.socketsUnlocked < item.maxSockets) {
        return buildSocketChoice(slot, run, content);
      }

      if (equipment.insertedRunes.length < targetRuneword.requiredRunes.length && equipment.insertedRunes.length < equipment.socketsUnlocked) {
        const nextRuneId = targetRuneword.requiredRunes[equipment.insertedRunes.length];
        return buildRuneChoice(nextRuneId, slot, run, content, targetRuneword);
      }
    }

    if (upgradeItem && upgradeItem.id !== equipment.itemId) {
      return buildItemChoice(upgradeItem.id, run, content, {
        profile,
        plannedRuneword,
        planningUnfulfilled: planningArchiveState.unfulfilled,
        planningCharter,
      });
    }

    if (equipment.socketsUnlocked < item.maxSockets) {
      return buildSocketChoice(slot, run, content);
    }

    if (equipment.insertedRunes.length < equipment.socketsUnlocked) {
      const fallbackRuneId = pickFallbackRuneId(slot, actNumber, encounterNumber, run, zone, content);
      if (fallbackRuneId) {
        return buildRuneChoice(fallbackRuneId, slot, run, content);
      }
    }

    return null;
  }

  function buildEquipmentChoice({ content, run, zone, actNumber, encounterNumber, profile = null }) {
    const focusSlots = getFocusSlots(run, actNumber, encounterNumber, content);
    for (let index = 0; index < focusSlots.length; index += 1) {
      const choice = buildChoiceForSlot(focusSlots[index], run, zone, actNumber, encounterNumber, content, profile);
      if (choice) {
        return choice;
      }
    }
    return null;
  }

  runtimeWindow.ROUGE_ITEM_SYSTEM = {
    createRuntimeContent: itemCatalog.createRuntimeContent,
    hydrateRunLoadout: itemLoadout.hydrateRunLoadout,
    hydrateRunInventory: itemTown.hydrateRunInventory,
    hydrateProfileStash: itemLoadout.hydrateProfileStash,
    buildEquipmentChoice,
    applyChoice: itemLoadout.applyChoice,
    listTownActions: itemTown.listTownActions,
    applyTownAction: itemTown.applyTownAction,
    buildCombatBonuses: itemLoadout.buildCombatBonuses,
    getActiveRunewords: itemLoadout.getActiveRunewords,
    getLoadoutSummary: itemLoadout.getLoadoutSummary,
    getInventorySummary: itemTown.getInventorySummary,
  };
})();
