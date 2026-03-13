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
    isRunewordCompatibleWithItem,
    isRuneAllowedInSlot,
    toNumber,
  } = itemCatalog;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState, getPlannedRunewordId } = itemTown;
  const {
    describeBonuses,
    getFocusSlots,
    isLateActPivotZone,
    getPlannedRuneword,
    getPlanningCharterSummary,
    getUpgradeItemForSlot,
    buildReplacementText,
    pickFallbackRuneId,
    shouldPrioritizeLateActReplacement,
  } = runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS;

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
