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
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot));
    return runeword?.slot === slot ? runeword : null;
  }

  function sortRewardUpgradeItems(
    upgradeItems,
    currentEquipment,
    actNumber,
    zone,
    profile = null,
    plannedRuneword = null,
    planningUnfulfilled = false
  ) {
    const features = getAccountEconomyFeatures(profile);
    const preservedSockets = Math.max(
      toNumber(currentEquipment?.socketsUnlocked, 0),
      Array.isArray(currentEquipment?.insertedRunes) ? currentEquipment.insertedRunes.length : 0
    );
    const preferredLateSockets =
      isLateActPivotZone(zone, actNumber) && (features.artisanStock || features.brokerageCharter || features.treasuryExchange || features.economyFocus)
        ? 3
        : 0;
    const preferredSockets = Math.max(
      preservedSockets,
      preferredLateSockets,
      planningUnfulfilled ? toNumber(plannedRuneword?.socketCount, 0) : 0
    );

    return [...upgradeItems].sort((left, right) => {
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
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot);
    if (!equipment) {
      const sortedItems = sortRewardUpgradeItems(availableItems, null, actNumber, zone, profile, plannedRuneword, planningArchiveState.unfulfilled);
      if (plannedRuneword && (features.runewordCodex || features.treasuryExchange || features.economyFocus)) {
        const plannedItems = sortedItems.filter((item) => isRunewordCompatibleWithItem(item, plannedRuneword));
        return plannedItems[0] || sortedItems[0] || null;
      }
      return sortedItems[0] || null;
    }

    const currentItem = getItemDefinition(content, equipment.itemId);
    const currentTier = currentItem?.progressionTier || 0;
    const upgradeItems = availableItems.filter((item) => item.progressionTier > currentTier);
    const planningItems =
      plannedRuneword && (features.runewordCodex || features.treasuryExchange || features.economyFocus)
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
      planningArchiveState.unfulfilled
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
    if (options.planningUnfulfilled && options.plannedRuneword) {
      previewLines.push("Archive charter still unfulfilled across the account.");
    }

    if (options.lateActPivot) {
      previewLines.push("Late-act pivot: replace the old base before spending more sockets or runes on it.");
    }
    if (options.lateActPivot && (features.artisanStock || features.brokerageCharter || features.treasuryExchange || features.economyFocus)) {
      previewLines.push("Trade Network is steering this reward toward a socket-ready late-game replacement base.");
    }
    if (options.lateActPivot && features.treasuryExchange) {
      previewLines.push("Treasury Exchange is preserving this reward as a premium replacement instead of a short-term sidegrade.");
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
    const economyPressure = features.artisanStock || features.brokerageCharter || features.treasuryExchange || features.economyFocus;

    return (
      tierDelta >= 2 ||
      (Boolean(currentRunewordId) && tierDelta >= 1) ||
      (economyPressure && (tierDelta >= 1 || socketDelta >= 1)) ||
      (zone?.kind === "boss" && currentBaseIsStale && tierDelta >= 1)
    );
  }

  function buildChoiceForSlot(slot, run, zone, actNumber, encounterNumber, content, profile = null) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = loadout[slot];
    const upgradeItem = getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content, profile);
    const plannedRuneword = getPlannedRuneword(slot, profile, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot);

    if (!equipment) {
      return upgradeItem
        ? buildItemChoice(upgradeItem.id, run, content, {
            lateActPivot: isLateActPivotZone(zone, actNumber),
            profile,
            plannedRuneword,
            planningUnfulfilled: planningArchiveState.unfulfilled,
          })
        : null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const targetRuneword = equipment.runewordId
      ? null
      : getPreferredRunewordForEquipment(equipment, run, content, getPlannedRunewordId(profile, slot));

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
