(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const { RARITY } = itemCatalog;
  const itemLoadout = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const {
    buildHydratedLoadout,
    getItemDefinition,
    getPreferredRunewordForEquipment,
    getRuneDefinition,
    isRunewordCompatibleWithItem,
    isRuneAllowedInSlot,
    rollItemRarity,
    generateRarityBonuses,
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
    itemId: string,
    run: RunState,
    content: GameContent,
    options: {
      profile?: ProfileState | null;
      lateActPivot?: boolean;
      plannedRuneword?: RuntimeRunewordDefinition | null;
      planningUnfulfilled?: boolean;
      planningCharter?: ProfilePlanningCharterSummary | null;
      rarity?: string;
      rarityBonuses?: ItemBonusSet;
    } = {}
  ) {
    const item = getItemDefinition(content, itemId);
    if (!item) {
      return null;
    }

    const rarity = options.rarity || RARITY.WHITE;
    const rarityBonuses = options.rarityBonuses || {};
    const combinedBonuses = { ...item.bonuses };
    Object.entries(rarityBonuses).forEach(([k, v]: [string, number]) => { (combinedBonuses as unknown as Record<string, number>)[k] = ((combinedBonuses as unknown as Record<string, number>)[k] || 0) + toNumber(v, 0); });
    let rarityLabel = "";
    if (rarity === RARITY.UNIQUE) { rarityLabel = "Unique"; }
    else if (rarity === RARITY.MAGIC) { rarityLabel = "Magic"; }
    const rarityTitle = rarityLabel ? `${rarityLabel} ${item.name}` : item.name;

    const loadout = buildHydratedLoadout(run, content);
    const loadoutKey = itemLoadout.resolveLoadoutKey(item.slot, run);
    const currentEquipment = loadout[loadoutKey];
    const features = getAccountEconomyFeatures(options.profile);
    const previewLines = [
      ...describeBonuses(combinedBonuses),
      `Base sockets ${item.maxSockets}.`,
      buildReplacementText(currentEquipment, item, content),
    ];
    if (rarityLabel) { previewLines.unshift(`Rarity: ${rarityLabel}.`); }
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
      const hasAnyTradeFeature =
        features.artisanStock || features.brokerageCharter || features.treasuryExchange ||
        features.merchantPrincipate || features.tradeHegemony || features.sovereignExchange ||
        features.ascendantExchange || features.imperialExchange || features.mythicExchange ||
        features.economyFocus;
      if (hasAnyTradeFeature) {
        previewLines.push("Trade Network is steering this reward toward a socket-ready late-game replacement base.");
      }
      const PIVOT_FEATURE_LABELS: [keyof AccountEconomyFeatures, string][] = [
        ["treasuryExchange", "Treasury Exchange is preserving this reward as a premium replacement instead of a short-term sidegrade."],
        ["merchantPrincipate", "Merchant Principate is widening this into a sovereign-tier late-market replacement offer."],
        ["sovereignExchange", "Sovereign Exchange is binding archive pressure to this premium staged replacement pivot."],
        ["paragonExchange", "Paragon Exchange is escalating this into a premium replacement pivot instead of another incremental upgrade."],
        ["ascendantExchange", "Ascendant Exchange is escalating this into the strongest staged late-act replacement on offer."],
        ["tradeHegemony", "Trade Hegemony is widening this into a third-wave market replacement instead of a late sidegrade."],
        ["imperialExchange", "Imperial Exchange is binding imperial archive pressure to this premium replacement pivot."],
        ["mythicExchange", "Mythic Exchange is escalating this into a mythic four-socket replacement pivot."],
      ];
      for (const [featureKey, label] of PIVOT_FEATURE_LABELS) {
        if (features[featureKey]) {
          previewLines.push(label);
        }
      }
    }

    return {
      id: `reward_item_${item.id}`,
      kind: "item",
      title: rarityTitle,
      subtitle: `Equip ${itemLoadout.EQUIPMENT_SLOT_LABELS[item.slot] || item.slot}`,
      description: item.summary,
      previewLines,
      effects: [{ kind: "equip_item" as const, itemId: item.id, rarity, rarityBonuses }],
    };
  }

  function buildSocketChoice(slot: string, run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = (loadout as unknown as Record<string, RunEquipmentState | null>)[slot];
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
      title: `Larzuk's ${itemLoadout.EQUIPMENT_SLOT_LABELS[slot as EquipmentSlot] || "Gear"} Socket`,
      subtitle: "Open Socket",
      description: `Add one permanent socket to ${item.name}.`,
      previewLines: [
        `${item.name} sockets ${equipment.socketsUnlocked}/${item.maxSockets} -> ${equipment.socketsUnlocked + 1}/${item.maxSockets}.`,
        "Existing runes remain in place.",
      ],
      effects: [{ kind: "add_socket" as const, slot: slot as "weapon" | "armor" }],
    };
  }

  function buildRuneChoice(runeId: string, slot: string, run: RunState, content: GameContent, runeword: RuntimeRunewordDefinition | null = null) {
    const rune = getRuneDefinition(content, runeId);
    const loadout = buildHydratedLoadout(run, content);
    const equipment = (loadout as unknown as Record<string, RunEquipmentState | null>)[slot];
    if (!rune || !equipment || !isRuneAllowedInSlot(rune, slot as "weapon" | "armor")) {
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
        .map((entry: string) => getRuneDefinition(content, entry)?.name || entry)
        .join(" + ");
      previewLines.push(`Route to ${runeword.name}: ${nextSequence}.`);
    }

    return {
      id: `reward_rune_${slot}_${rune.id}`,
      kind: "rune",
      title: rune.name,
      subtitle: `Socket ${itemLoadout.EQUIPMENT_SLOT_LABELS[slot as EquipmentSlot] || "Gear"} Rune`,
      description: rune.summary,
      previewLines,
      effects: [{ kind: "socket_rune" as const, runeId: rune.id, slot: slot as "weapon" | "armor" }],
    };
  }

  function buildChoiceForSlot(slot: string, run: RunState, zone: ZoneState | null, actNumber: number, encounterNumber: number, content: GameContent, profile: ProfileState | null = null, rarityOpts: { rarity?: string; rarityBonuses?: ItemBonusSet } = {}): RewardChoice | null {
    const loadout = buildHydratedLoadout(run, content);
    const equipment = (loadout as unknown as Record<string, RunEquipmentState | null>)[slot];
    const upgradeItem = getUpgradeItemForSlot(slot, equipment, actNumber, zone, run, content, profile);
    const plannedRuneword = getPlannedRuneword(slot, profile, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot as "weapon" | "armor", content);
    const planningCharter = getPlanningCharterSummary(profile, slot, content);

    if (!equipment) {
      return upgradeItem
        ? buildItemChoice(upgradeItem.id, run, content, {
            lateActPivot: isLateActPivotZone(zone, actNumber),
            profile,
            plannedRuneword,
            planningUnfulfilled: planningArchiveState.unfulfilled,
            planningCharter,
            ...rarityOpts,
          })
        : null;
    }

    const item = getItemDefinition(content, equipment.itemId);
    const targetRuneword = equipment.runewordId
      ? null
      : getPreferredRunewordForEquipment(equipment, run, content, getPlannedRunewordId(profile, slot as "weapon" | "armor", content));

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
        ...rarityOpts,
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
        ...rarityOpts,
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

  function buildEquipmentChoice({ content, run, zone, actNumber, encounterNumber, profile = null }: { content: GameContent; run: RunState; zone: ZoneState | null; actNumber: number; encounterNumber: number; profile?: ProfileState | null }): RewardChoice | null {
    const randomFn = Math.random;
    const rarity = rollItemRarity(zone?.kind || "battle", randomFn);
    const focusSlots = getFocusSlots(run, actNumber, encounterNumber, content);
    for (let index = 0; index < focusSlots.length; index += 1) {
      const slot = focusSlots[index];
      const upgradeItem = getUpgradeItemForSlot(slot, (buildHydratedLoadout(run, content) as unknown as Record<string, RunEquipmentState | null>)[slot], actNumber, zone, run, content, profile);
      const itemDef = upgradeItem ? getItemDefinition(content, upgradeItem.id) : null;
      const rarityBonuses = itemDef && rarity !== RARITY.WHITE ? generateRarityBonuses(itemDef, rarity, randomFn) : {};
      const rarityOpts = { rarity, rarityBonuses };
      const choice = buildChoiceForSlot(slot, run, zone, actNumber, encounterNumber, content, profile, rarityOpts);
      if (choice) { return choice; }
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
