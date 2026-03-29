(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const loot = runtimeWindow.__ROUGE_ITEM_SYSTEM_LOOT;
  const { RARITY } = itemCatalog;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState } = itemTown;
  const {
    buildEquipmentArmorProfile,
    buildEquipmentWeaponProfile,
    generateRarityBonuses,
    getItemDefinition,
    getRarityLabel,
    getRuneDefinition,
    isRunewordCompatibleWithItem,
    rollArmorAffixes,
    rollWeaponAffixes,
    toNumber,
  } = itemCatalog;
  const {
    getPlannedRuneword,
    getPlanningCharterSummary,
    isLateActPivotZone,
  } = runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS;

  function pickWeightedEntry<T extends { weight: number }>(entries: T[], randomFn: RandomFn): T | null {
    const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (totalWeight <= 0) {
      return null;
    }
    let remaining = randomFn() * totalWeight;
    for (const entry of entries) {
      remaining -= Math.max(0, entry.weight);
      if (remaining <= 0) {
        return entry;
      }
    }
    return entries[entries.length - 1] || null;
  }

  function rollEquipmentRarity(zone: ZoneState | null, run: RunState, randomFn: RandomFn) {
    const uniqueSeen = toNumber(run.summary?.uniqueItemsFound, 0);
    let uniqueChanceBase = 0.0005;
    if (zone?.kind === "boss") {
      uniqueChanceBase = 0.03;
    } else if (zone?.kind === "miniboss") {
      uniqueChanceBase = 0.005;
    } else if (zone?.kind === "event" || zone?.kind === "opportunity") {
      uniqueChanceBase = 0.015;
    }
    const uniqueChance = uniqueChanceBase * (uniqueSeen > 0 ? 0.2 : 1);
    const roll = randomFn();
    if (roll < uniqueChance) {
      return RARITY.UNIQUE;
    }
    const normalizedRoll = (roll - uniqueChance) / Math.max(0.0001, 1 - uniqueChance);
    if (zone?.kind === "boss") {
      if (normalizedRoll < 0.35) { return RARITY.WHITE; }
      if (normalizedRoll < 0.78) { return RARITY.MAGIC; }
      return RARITY.RARE;
    }
    if (zone?.kind === "miniboss" || zone?.zoneRole === "branchBattle") {
      if (normalizedRoll < 0.48) { return RARITY.WHITE; }
      if (normalizedRoll < 0.84) { return RARITY.MAGIC; }
      return RARITY.RARE;
    }
    if (normalizedRoll < 0.65) { return RARITY.WHITE; }
    if (normalizedRoll < 0.92) { return RARITY.MAGIC; }
    return RARITY.RARE;
  }

  function buildDropLabel(
    content: GameContent,
    drop: {
      kind: "equipment" | "rune";
      id: string;
      rarity?: string;
    }
  ) {
    if (drop.kind === "rune") {
      return getRuneDefinition(content, drop.id)?.name || drop.id;
    }
    const item = getItemDefinition(content, drop.id);
    const rarityLabel = getRarityLabel(drop.rarity || RARITY.WHITE);
    return `${rarityLabel ? `${rarityLabel} ` : ""}${item?.name || drop.id}`;
  }

  function buildPrimaryItemPreviewLines(
    content: GameContent,
    primaryDrop: {
      itemId: string;
      rarity: string;
      rarityBonuses: ItemBonusSet;
      weaponAffixes?: WeaponCombatProfile;
      armorAffixes?: ArmorMitigationProfile;
    }
  ) {
    const item = getItemDefinition(content, primaryDrop.itemId);
    if (!item) {
      return [];
    }
    const combinedBonuses = { ...item.bonuses };
    Object.entries(primaryDrop.rarityBonuses || {}).forEach(([key, value]) => {
      (combinedBonuses as unknown as Record<string, number>)[key] = ((combinedBonuses as unknown as Record<string, number>)[key] || 0) + toNumber(value, 0);
    });
    const previewEquipment: RunEquipmentState = {
      entryId: "",
      itemId: item.id,
      slot: item.slot,
      socketsUnlocked: 0,
      insertedRunes: [],
      runewordId: "",
      rarity: primaryDrop.rarity,
      rarityKind: itemCatalog.getRarityKind(primaryDrop.rarity),
      rarityBonuses: primaryDrop.rarityBonuses,
      weaponAffixes: primaryDrop.weaponAffixes,
      armorAffixes: primaryDrop.armorAffixes,
    };
    return [
      ...runtimeWindow.ROUGE_RUN_STATE.describeBonusSet(combinedBonuses),
      ...runtimeWindow.ROUGE_RUN_STATE.describeWeaponProfile(buildEquipmentWeaponProfile(previewEquipment, content)),
      ...runtimeWindow.ROUGE_RUN_STATE.describeArmorProfile(buildEquipmentArmorProfile(previewEquipment, content)),
      `Base sockets ${item.maxSockets}.`,
    ];
  }

  function rollPrimaryEquipmentDrop(
    equipmentTable: ItemSystemEquipmentTableEntry[],
    zone: ZoneState | null,
    run: RunState,
    randomFn: RandomFn
  ): ItemSystemEquipmentDrop | null {
    const selected = [...equipmentTable].sort((left, right) => {
      const weightDelta = right.weight - left.weight;
      if (weightDelta !== 0) {
        return weightDelta;
      }
      const tierDelta = toNumber(right.item?.progressionTier, 0) - toNumber(left.item?.progressionTier, 0);
      if (tierDelta !== 0) {
        return tierDelta;
      }
      const socketDelta = toNumber(right.item?.maxSockets, 0) - toNumber(left.item?.maxSockets, 0);
      if (socketDelta !== 0) {
        return socketDelta;
      }
      return left.id.localeCompare(right.id);
    })[0] || null;
    if (!selected) {
      return null;
    }
    const rarity = rollEquipmentRarity(zone, run, randomFn);
    return {
      kind: "equipment",
      id: selected.id,
      tableDropRate: selected.dropRate,
      rarity,
      rarityBonuses: rarity !== RARITY.WHITE ? generateRarityBonuses(selected.item, rarity, randomFn) : {},
      weaponAffixes: rollWeaponAffixes(selected.item, rarity, randomFn),
      armorAffixes: rollArmorAffixes(selected.item, rarity, randomFn),
    };
  }

  function rollExtraDrops({
    equipmentTable,
    runeTable,
    zone,
    run,
    randomFn,
    desiredCount,
    primaryItemId,
    primaryItemSlot,
    guaranteedRuneCount,
  }: {
    equipmentTable: ItemSystemEquipmentTableEntry[];
    runeTable: ItemSystemRuneTableEntry[];
    zone: ZoneState | null;
    run: RunState;
    randomFn: RandomFn;
    desiredCount: number;
    primaryItemId: string;
    primaryItemSlot: EquipmentSlot;
    guaranteedRuneCount: number;
  }) {
    const chosenIds = new Set<string>([primaryItemId]);
    const chosenEquipmentSlots = new Set<EquipmentSlot>([primaryItemSlot]);
    const drops: ItemSystemExtraDrop[] = [];

    while (drops.length < Math.min(desiredCount, guaranteedRuneCount)) {
      const availableRunes = runeTable.filter((entry) => !chosenIds.has(entry.id));
      if (availableRunes.length === 0) {
        break;
      }
      const selectedRune = pickWeightedEntry(availableRunes, randomFn);
      if (!selectedRune) {
        break;
      }
      chosenIds.add(selectedRune.id);
      drops.push({ kind: "rune", id: selectedRune.id, tableDropRate: selectedRune.dropRate });
    }

    while (drops.length < desiredCount) {
      const availableEquipment = equipmentTable.filter((entry) => {
        return !chosenIds.has(entry.id) && !chosenEquipmentSlots.has(entry.item.slot);
      });
      const availableRunes = runeTable.filter((entry) => !chosenIds.has(entry.id));
      const combined = [...availableEquipment, ...availableRunes];
      if (combined.length === 0) {
        break;
      }
      const selected = pickWeightedEntry(combined, randomFn);
      if (!selected) {
        break;
      }
      chosenIds.add(selected.id);
      if (selected.kind === "rune") {
        drops.push({ kind: "rune", id: selected.id, tableDropRate: selected.dropRate });
        continue;
      }
      chosenEquipmentSlots.add(selected.item.slot);
      const rarity = rollEquipmentRarity(zone, run, randomFn);
      drops.push({
        kind: "equipment",
        id: selected.id,
        tableDropRate: selected.dropRate,
        rarity,
        rarityBonuses: rarity !== RARITY.WHITE ? generateRarityBonuses(selected.item, rarity, randomFn) : {},
        weaponAffixes: rollWeaponAffixes(selected.item, rarity, randomFn),
        armorAffixes: rollArmorAffixes(selected.item, rarity, randomFn),
      });
    }

    return drops;
  }

  function buildEquipmentChoice({
    content,
    run,
    zone,
    actNumber,
    encounterNumber,
    profile = null,
  }: {
    content: GameContent;
    run: RunState;
    zone: ZoneState | null;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }): RewardChoice | null {
    const randomFn = loot.createSeededRandom(loot.getLootSeed(run, zone, actNumber, encounterNumber));
    const equipmentTable = loot.getEquipmentTableEntries(run, zone, actNumber, content, profile);
    const runeTable = loot.getRuneTableEntries(run, zone, actNumber, content);
    const primaryEquipmentTable = loot.getPlanningFocusedEquipmentTable(equipmentTable, run, profile, content);
    const primaryDrop = rollPrimaryEquipmentDrop(primaryEquipmentTable, zone, run, randomFn);
    if (!primaryDrop) {
      return null;
    }

    const totalDropCount = loot.getZoneDropCount(zone, actNumber);
    const guaranteedRuneCount = loot.getGuaranteedRuneDropCount(zone, run, content);
    const extraDrops = rollExtraDrops({
      equipmentTable,
      runeTable,
      zone,
      run,
      randomFn,
      desiredCount: Math.max(0, totalDropCount - 1),
      primaryItemId: primaryDrop.id,
      primaryItemSlot: getItemDefinition(content, primaryDrop.id)?.slot || "weapon",
      guaranteedRuneCount,
    });
    const targetTier = loot.getTargetItemTier(run, zone, actNumber, content);
    const primaryLabel = buildDropLabel(content, { kind: "equipment", id: primaryDrop.id, rarity: primaryDrop.rarity });
    const previewLines = [
      `${zone?.title || "Zone"} rolled ${1 + extraDrops.length} loot drop${1 + extraDrops.length === 1 ? "" : "s"} at target tier ${targetTier}.`,
      `Primary drop: ${primaryLabel} (${loot.formatPercent(primaryDrop.tableDropRate * 100)} table chance).`,
      ...buildPrimaryItemPreviewLines(content, {
        itemId: primaryDrop.id,
        rarity: primaryDrop.rarity,
        rarityBonuses: primaryDrop.rarityBonuses,
        weaponAffixes: primaryDrop.weaponAffixes,
        armorAffixes: primaryDrop.armorAffixes,
      }),
    ];
    const primaryItem = getItemDefinition(content, primaryDrop.id);
    const primarySlot = primaryItem?.slot || "weapon";
    const plannedRuneword =
      primarySlot === "weapon" || primarySlot === "armor"
        ? getPlannedRuneword(primarySlot, profile, content)
        : null;
    const planningArchiveState =
      plannedRuneword && (primarySlot === "weapon" || primarySlot === "armor")
        ? getPlannedRunewordArchiveState(profile, primarySlot, content)
        : { unfulfilled: false };
    const planningCharter = getPlanningCharterSummary(profile, primarySlot, content);
    const features = getAccountEconomyFeatures(profile);
    if (plannedRuneword && primaryItem && isRunewordCompatibleWithItem(primaryItem, plannedRuneword)) {
      previewLines.push(`Planning charter: ${plannedRuneword.name}.`);
    }
    if (planningArchiveState.unfulfilled && plannedRuneword) {
      previewLines.push("Archive charter still unfulfilled across the account.");
    } else if (plannedRuneword && toNumber(planningCharter?.completedRunCount, 0) > 0) {
      previewLines.push(
        `Archive already proved ${plannedRuneword.name} through Act ${Math.max(1, toNumber(planningCharter?.bestActsCleared, 0))}${
          toNumber(planningCharter?.bestCompletedLoadoutTier, 0) > 0
            ? ` at loadout tier ${toNumber(planningCharter?.bestCompletedLoadoutTier, 0)}`
            : ""
        }. This reward is supporting a repeat forge.`
      );
    }
    if (isLateActPivotZone(zone, actNumber)) {
      previewLines.push("Late-act pivot: replace the old base before spending more sockets or runes on it.");
      const hasAnyTradeFeature =
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
      if (hasAnyTradeFeature) {
        previewLines.push("Trade Network is steering this reward toward a socket-ready late-game replacement base.");
      }
      const pivotFeatureLabels: Array<[keyof AccountEconomyFeatures, string]> = [
        ["treasuryExchange", "Treasury Exchange is preserving this reward as a premium replacement instead of a short-term sidegrade."],
        ["merchantPrincipate", "Merchant Principate is widening this into a sovereign-tier late-market replacement offer."],
        ["sovereignExchange", "Sovereign Exchange is binding archive pressure to this premium staged replacement pivot."],
        ["paragonExchange", "Paragon Exchange is escalating this into a premium replacement pivot instead of another incremental upgrade."],
        ["ascendantExchange", "Ascendant Exchange is escalating this into the strongest staged late-act replacement on offer."],
        ["tradeHegemony", "Trade Hegemony is widening this into a third-wave market replacement instead of a late sidegrade."],
        ["imperialExchange", "Imperial Exchange is binding imperial archive pressure to this premium replacement pivot."],
        ["mythicExchange", "Mythic Exchange is escalating this into a mythic four-socket replacement pivot."],
      ];
      pivotFeatureLabels.forEach(([featureKey, label]) => {
        if (features[featureKey]) {
          previewLines.push(label);
        }
      });
    }
    extraDrops.forEach((drop) => {
      previewLines.push(
        `Extra drop: ${buildDropLabel(content, { kind: drop.kind, id: drop.id, rarity: "rarity" in drop ? drop.rarity : undefined })} (${loot.formatPercent(drop.tableDropRate * 100)} table chance).`
      );
    });
    previewLines.push(
      zone?.kind === "boss"
        ? "Boss loot tables carry the main unique pressure and always stamp at least one rune into the reward pile."
        : "Unique items are mostly reserved for bosses and special outcomes."
    );
    if (toNumber(run.summary?.uniqueItemsFound, 0) > 0) {
      previewLines.push("A unique already dropped this run, so additional unique rolls are heavily suppressed.");
    }

    const effects: RewardChoiceEffect[] = [
      {
        kind: "equip_item",
        itemId: primaryDrop.id,
        rarity: primaryDrop.rarity,
        rarityBonuses: primaryDrop.rarityBonuses,
        weaponAffixes: primaryDrop.weaponAffixes,
        armorAffixes: primaryDrop.armorAffixes,
      },
    ];
    extraDrops.forEach((drop) => {
      if (drop.kind === "rune") {
        effects.push({ kind: "grant_rune", runeId: drop.id });
        return;
      }
      effects.push({
        kind: "grant_item",
        itemId: drop.id,
        rarity: drop.rarity,
        rarityBonuses: drop.rarityBonuses,
        weaponAffixes: drop.weaponAffixes,
        armorAffixes: drop.armorAffixes,
      });
    });

    return {
      id: `reward_loot_${zone?.id || "zone"}_${encounterNumber}`,
      kind: "item",
      title: primaryLabel,
      subtitle: "Zone Loot Table",
      description: `Roll ${1 + extraDrops.length} drop${1 + extraDrops.length === 1 ? "" : "s"} from ${zone?.title || "this area"}, then auto-equip the headline piece and carry the rest.`,
      previewLines,
      effects,
    };
  }

  runtimeWindow.__ROUGE_ITEM_SYSTEM_CHOICE = {
    buildEquipmentChoice,
  };
})();
