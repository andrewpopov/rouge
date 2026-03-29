(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG;
  const { RARITY } = itemCatalog;
  const itemLoadout = runtimeWindow.ROUGE_ITEM_LOADOUT;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState } = itemTown;
  const {
    buildHydratedLoadout,
    buildEquipmentArmorProfile,
    buildEquipmentWeaponProfile,
    createRuntimeContent,
    generateRarityBonuses,
    getItemDefinition,
    getPreferredRunewordForEquipment,
    isRunewordCompatibleWithItem,
    getRarityLabel,
    getRuneDefinition,
    rollArmorAffixes,
    rollWeaponAffixes,
    toNumber,
  } = itemCatalog;
  const {
    getPlannedRuneword,
    getPlanningCharterSummary,
    isLateActPivotZone,
  } = runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS;

  function hashString(value: string) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seed: number): RandomFn {
    let state = (seed >>> 0) || 1;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  function formatPercent(value: number) {
    if (value >= 0.1) {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toFixed(2)}%`;
  }

  function getLootSeed(run: RunState, zone: ZoneState | null, actNumber: number, encounterNumber: number) {
    return hashString([
      String((toNumber((run as RunState | null)?.seed, 0) >>> 0) || hashString([run.id || "run", run.classId || "class"].join("|")) || 1),
      zone?.id || zone?.title || "zone",
      String(actNumber),
      String(encounterNumber),
      String(toNumber(run.summary?.encountersCleared, 0)),
      String(toNumber(run.summary?.uniqueItemsFound, 0)),
    ].join("|"));
  }

  function getTargetItemTier(run: RunState, zone: ZoneState | null, actNumber: number, content: GameContent) {
    const maxItemTier = Math.max(
      1,
      ...(Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[]).map((item) => toNumber(item?.progressionTier, 1))
    );
    const levelAllowance = Math.min(2, Math.floor(Math.max(0, toNumber(run?.level, 1) - 1) / 2));
    const trophyAllowance = zone?.kind === "boss" ? 1 : Math.min(1, toNumber(run?.progression?.bossTrophies?.length, 0));
    const zoneAllowance = zone?.kind === "boss" ? 1 : 0;
    return Math.max(1, Math.min(maxItemTier, actNumber + levelAllowance + trophyAllowance + zoneAllowance));
  }

  function getBaseZoneDropCount(zone: ZoneState | null) {
    if (zone?.kind === "boss") {
      return 4;
    }
    if (zone?.kind === "miniboss") {
      return 3;
    }
    if (zone?.zoneRole === "branchBattle") {
      return 2;
    }
    return 1;
  }

  function getZoneDropCount(zone: ZoneState | null, actNumber: number) {
    let dropCount = getBaseZoneDropCount(zone);
    if (actNumber >= 4) {
      dropCount += zone?.kind === "battle" ? 1 : 0;
    }
    if (actNumber >= 3 && (zone?.kind === "miniboss" || zone?.kind === "boss")) {
      dropCount += 1;
    }
    if (actNumber >= 5 && zone?.kind === "boss") {
      dropCount += 1;
    }
    return Math.max(1, dropCount);
  }

  function getLateLootBias(profile: ProfileState | null, zone: ZoneState | null, actNumber: number) {
    const features = getAccountEconomyFeatures(profile);
    if (!isLateActPivotZone(zone, actNumber)) {
      return { tierBias: 0, socketBias: 0 };
    }
    let tierBias = 0;
    let socketBias = 0;
    if (features.artisanStock || features.brokerageCharter) {
      socketBias += 2;
    }
    if (features.treasuryExchange) {
      tierBias += 1;
    }
    if (features.merchantPrincipate) {
      tierBias += 1;
      socketBias += 1;
    }
    if (features.tradeHegemony) {
      socketBias += 1;
    }
    if (features.paragonExchange) {
      tierBias += 1;
    }
    if (features.ascendantExchange) {
      tierBias += 2;
      socketBias += 1;
    }
    if (features.imperialExchange) {
      tierBias += 2;
      socketBias += 2;
    }
    if (features.mythicExchange) {
      tierBias += 3;
      socketBias += 3;
    }
    return { tierBias, socketBias };
  }

  function getEquipmentTableEntries(run: RunState, zone: ZoneState | null, actNumber: number, content: GameContent, profile: ProfileState | null = null) {
    const targetTier = getTargetItemTier(run, zone, actNumber, content);
    let maxTier = targetTier;
    if (zone?.kind === "boss") {
      maxTier += 2;
    } else if (zone?.kind === "miniboss") {
      maxTier += 1;
    }
    const minTier = Math.max(1, targetTier - 2);
    const lateBias = getLateLootBias(profile, zone, actNumber);
    const preferredWeaponFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
    const strategicWeaponFamilies = runtimeWindow.ROUGE_REWARD_ENGINE?.getStrategicWeaponFamilies?.(run, content) || preferredWeaponFamilies;
    const primaryStrategicWeaponFamily = strategicWeaponFamilies[0] || "";
    const currentWeaponTier = Math.max(0, toNumber(content.itemCatalog?.[run.loadout?.weapon?.itemId || ""]?.progressionTier, 0));
    const currentArmorTier = Math.max(0, toNumber(content.itemCatalog?.[run.loadout?.armor?.itemId || ""]?.progressionTier, 0));
    const entries = (Object.values(content.itemCatalog || {}) as RuntimeItemDefinition[])
      .filter((item) => {
        const tier = toNumber(item?.progressionTier, 1);
        const requiredAct = Math.max(1, toNumber(item?.actRequirement, 1));
        return tier >= minTier && tier <= maxTier && requiredAct <= actNumber;
      })
      .map((item) => {
        const tier = toNumber(item.progressionTier, 1);
        let weight = Math.max(1, 10 - Math.abs(tier - targetTier) * 3);
        if (item.slot === "weapon" || item.slot === "armor") {
          weight += 3;
        } else if (item.slot === "shield" || item.slot === "helm") {
          weight += 1;
        }
        if (item.slot === "weapon" && (item.family || "") === primaryStrategicWeaponFamily) {
          weight += 8;
        } else if (item.slot === "weapon" && strategicWeaponFamilies.includes(item.family || "")) {
          weight += 5;
        } else if (item.slot === "weapon" && preferredWeaponFamilies.includes(item.family || "")) {
          weight += 3;
        }
        if (item.slot === "weapon" && tier > currentWeaponTier) {
          weight += 2 + (tier - currentWeaponTier) * 2;
          if ((item.family || "") === primaryStrategicWeaponFamily) {
            weight += 6;
          } else if (strategicWeaponFamilies.includes(item.family || "")) {
            weight += 4;
          } else if (preferredWeaponFamilies.includes(item.family || "")) {
            weight += 2;
          }
        }
        if (item.slot === "armor" && tier > currentArmorTier) {
          weight += 1 + (tier - currentArmorTier);
        }
        if (zone?.kind === "boss" && tier >= targetTier) {
          weight += 1;
        }
        if (zone?.kind === "battle" && tier > targetTier) {
          weight = Math.max(1, weight - 2);
        }
        if (lateBias.tierBias > 0 || lateBias.socketBias > 0) {
          weight += tier * lateBias.tierBias;
          weight += toNumber(item.maxSockets, 0) * lateBias.socketBias;
        }
        return { kind: "equipment" as const, id: item.id, item, weight };
      });
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return entries.map((entry) => ({ ...entry, dropRate: entry.weight / totalWeight }));
  }

  function getPlanningFocusedEquipmentTable(
    equipmentTable: Array<{ kind: "equipment"; id: string; item: RuntimeItemDefinition; weight: number; dropRate: number }>,
    run: RunState,
    profile: ProfileState | null,
    content: GameContent
  ) {
    const planningPriority: Array<"weapon" | "armor"> = ["weapon", "armor"];
    for (const slot of planningPriority) {
      const plannedRuneword = getPlannedRuneword(slot, profile, content);
      const planningArchiveState = getPlannedRunewordArchiveState(profile, slot, content);
      const planningCharter = getPlanningCharterSummary(profile, slot, content);
      const shouldFocus =
        Boolean(plannedRuneword) &&
        (
          planningArchiveState.unfulfilled ||
          toNumber(planningCharter?.completedRunCount, 0) > 0 ||
          Boolean(planningCharter?.hasReadyBase) ||
          toNumber(planningCharter?.preparedBaseCount, 0) > 0
        );
      if (!plannedRuneword || !shouldFocus) {
        continue;
      }
      const slotIsEmpty = !run.loadout?.[slot];
      const matches = equipmentTable.filter((entry) => {
        return entry.item.slot === slot && isRunewordCompatibleWithItem(entry.item, plannedRuneword);
      });
      if (matches.length > 0 && slotIsEmpty) {
        return matches;
      }
      if (matches.length > 0 && slot === "weapon") {
        return matches;
      }
    }
    return equipmentTable;
  }

  function getRuneTableEntries(run: RunState, zone: ZoneState | null, actNumber: number, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const targetProjects = (["weapon", "armor"] as const)
      .map((slot) => {
        const equipment = loadout[slot];
        const targetRuneword = equipment
          ? getPreferredRunewordForEquipment(equipment, run, content)
          : null;
        if (!targetRuneword) {
          return null;
        }
        const hasActiveProject =
          !equipment?.runewordId ||
          equipment.runewordId !== targetRuneword.id ||
          toNumber(equipment.socketsUnlocked, 0) < toNumber(targetRuneword.socketCount, 0) ||
          (equipment.insertedRunes?.length || 0) < targetRuneword.requiredRunes.length;
        if (!hasActiveProject) {
          return null;
        }
        const insertedRunes = Array.isArray(equipment?.insertedRunes) ? equipment.insertedRunes : [];
        const prefixLength = insertedRunes.reduce((count: number, runeId: string, index: number) => {
          return count === index && targetRuneword.requiredRunes[index] === runeId ? count + 1 : count;
        }, 0);
        return {
          nextRuneId: targetRuneword.requiredRunes[prefixLength] || "",
          remainingRuneIds: targetRuneword.requiredRunes.slice(prefixLength),
        };
      })
      .filter(Boolean) as Array<{ nextRuneId: string; remainingRuneIds: string[] }>;
    const nextTargetRuneIds = Array.from(new Set(targetProjects.map((project) => project.nextRuneId).filter(Boolean)));
    const remainingTargetRuneIds = Array.from(new Set(targetProjects.flatMap((project) => project.remainingRuneIds).filter(Boolean)));
    let runeTargetTier = Math.max(1, actNumber);
    if (zone?.kind === "boss") {
      runeTargetTier += 2;
    } else if (zone?.kind === "miniboss") {
      runeTargetTier += 1;
    }
    const entries = (Object.values(content.runeCatalog || {}) as RuntimeRuneDefinition[])
      .filter((rune) => toNumber(rune?.progressionTier, 1) <= runeTargetTier)
      .map((rune) => {
        const tier = toNumber(rune.progressionTier, 1);
        let weight = Math.max(1, 7 - Math.abs(tier - runeTargetTier) * 2);
        if (zone?.kind === "boss" && tier >= runeTargetTier - 1) {
          weight += 1;
        }
        if (nextTargetRuneIds.includes(rune.id)) {
          if (zone?.kind === "boss") {
            weight += 7;
          } else if (zone?.kind === "miniboss") {
            weight += 5;
          } else {
            weight += 3;
          }
        } else if (remainingTargetRuneIds.includes(rune.id)) {
          if (zone?.kind === "boss") {
            weight += 4;
          } else if (zone?.kind === "miniboss") {
            weight += 3;
          } else {
            weight += 1;
          }
        }
        if (actNumber <= 2 && tier <= actNumber + 2) {
          weight += 1;
        }
        return { kind: "rune" as const, id: rune.id, rune, weight };
      });
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return entries.map((entry) => ({ ...entry, dropRate: entry.weight / totalWeight }));
  }

  function getGuaranteedRuneDropCount(zone: ZoneState | null, run: RunState, content: GameContent) {
    const loadout = buildHydratedLoadout(run, content);
    const hasActiveRunewordProject = (["weapon", "armor"] as const).some((slot) => {
      const equipment = loadout[slot];
      const targetRuneword = equipment
        ? getPreferredRunewordForEquipment(equipment, run, content)
        : null;
      return Boolean(
        equipment &&
        targetRuneword &&
        (
          !equipment.runewordId ||
          equipment.runewordId !== targetRuneword.id ||
          toNumber(equipment.socketsUnlocked, 0) < toNumber(targetRuneword.socketCount, 0) ||
          (equipment.insertedRunes?.length || 0) < targetRuneword.requiredRunes.length
        )
      );
    });
    if (zone?.kind === "boss") {
      return 1;
    }
    if (zone?.kind === "miniboss" && hasActiveRunewordProject) {
      return 1;
    }
    return 0;
  }

  function buildZoneLootTable({
    content,
    run,
    zone,
    actNumber,
    profile = null,
  }: {
    content: GameContent;
    run: RunState;
    zone: ZoneState | null;
    actNumber: number;
    encounterNumber: number;
    profile?: ProfileState | null;
  }) {
    const combined = [
      ...getEquipmentTableEntries(run, zone, actNumber, content, profile),
      ...getRuneTableEntries(run, zone, actNumber, content),
    ];
    const totalWeight = combined.reduce((sum, entry) => sum + entry.weight, 0) || 1;
    return combined
      .map((entry) => ({ kind: entry.kind, id: entry.id, weight: entry.weight, dropRate: entry.weight / totalWeight }))
      .sort((left, right) => right.weight - left.weight || left.id.localeCompare(right.id));
  }

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
    equipmentTable: Array<{ kind: "equipment"; id: string; item: RuntimeItemDefinition; weight: number; dropRate: number }>,
    zone: ZoneState | null,
    run: RunState,
    randomFn: RandomFn,
    actNumber: number,
    profile: ProfileState | null
  ) {
    const lateBias = getLateLootBias(profile, zone, actNumber);
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
      if (lateBias.tierBias > 0 || lateBias.socketBias > 0) {
        return left.id.localeCompare(right.id);
      }
      return left.id.localeCompare(right.id);
    })[0] || null;
    if (!selected) {
      return null;
    }
    const rarity = rollEquipmentRarity(zone, run, randomFn);
    return {
      kind: "equipment" as const,
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
    equipmentTable: Array<{ kind: "equipment"; id: string; item: RuntimeItemDefinition; weight: number; dropRate: number }>;
    runeTable: Array<{ kind: "rune"; id: string; rune: RuntimeRuneDefinition; weight: number; dropRate: number }>;
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
    const drops: Array<
      | {
          kind: "equipment";
          id: string;
          tableDropRate: number;
          rarity: string;
          rarityBonuses: ItemBonusSet;
          weaponAffixes?: WeaponCombatProfile;
          armorAffixes?: ArmorMitigationProfile;
        }
      | { kind: "rune"; id: string; tableDropRate: number }
    > = [];

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
    const randomFn = createSeededRandom(getLootSeed(run, zone, actNumber, encounterNumber));
    const equipmentTable = getEquipmentTableEntries(run, zone, actNumber, content, profile);
    const runeTable = getRuneTableEntries(run, zone, actNumber, content);
    const primaryEquipmentTable = getPlanningFocusedEquipmentTable(equipmentTable, run, profile, content);
    const primaryDrop = rollPrimaryEquipmentDrop(primaryEquipmentTable, zone, run, randomFn, actNumber, profile);
    if (!primaryDrop) {
      return null;
    }

    const totalDropCount = getZoneDropCount(zone, actNumber);
    const guaranteedRuneCount = getGuaranteedRuneDropCount(zone, run, content);
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
    const targetTier = getTargetItemTier(run, zone, actNumber, content);
    const primaryLabel = buildDropLabel(content, { kind: "equipment", id: primaryDrop.id, rarity: primaryDrop.rarity });
    const previewLines = [
      `${zone?.title || "Zone"} rolled ${1 + extraDrops.length} loot drop${1 + extraDrops.length === 1 ? "" : "s"} at target tier ${targetTier}.`,
      `Primary drop: ${primaryLabel} (${formatPercent(primaryDrop.tableDropRate * 100)} table chance).`,
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
      previewLines.push(`Extra drop: ${buildDropLabel(content, { kind: drop.kind, id: drop.id, rarity: "rarity" in drop ? drop.rarity : undefined })} (${formatPercent(drop.tableDropRate * 100)} table chance).`);
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

  runtimeWindow.ROUGE_ITEM_SYSTEM = {
    createRuntimeContent,
    hydrateRunLoadout: itemLoadout.hydrateRunLoadout,
    hydrateRunInventory: itemTown.hydrateRunInventory,
    hydrateProfileStash: itemLoadout.hydrateProfileStash,
    buildEquipmentChoice,
    buildZoneLootTable,
    applyChoice: itemLoadout.applyChoice,
    listTownActions: itemTown.listTownActions,
    applyTownAction: itemTown.applyTownAction,
    buildCombatBonuses: itemLoadout.buildCombatBonuses,
    buildCombatMitigationProfile: itemLoadout.buildCombatMitigationProfile,
    getActiveRunewords: itemLoadout.getActiveRunewords,
    getLoadoutSummary: itemLoadout.getLoadoutSummary,
    getInventorySummary: itemTown.getInventorySummary,
  };
})();
