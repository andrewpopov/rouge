(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const itemTown = runtimeWindow.ROUGE_ITEM_TOWN;
  const { getAccountEconomyFeatures, getPlannedRunewordArchiveState } = itemTown;
  const {
    buildHydratedLoadout,
    getPreferredRunewordForEquipment,
    isRunewordCompatibleWithItem,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
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

  function getEquipmentTableEntries(
    run: RunState,
    zone: ZoneState | null,
    actNumber: number,
    content: GameContent,
    profile: ProfileState | null = null
  ) {
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
    equipmentTable: ItemSystemEquipmentTableEntry[],
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

  runtimeWindow.__ROUGE_ITEM_SYSTEM_LOOT = {
    createSeededRandom,
    formatPercent,
    getLootSeed,
    getTargetItemTier,
    getZoneDropCount,
    getEquipmentTableEntries,
    getPlanningFocusedEquipmentTable,
    getRuneTableEntries,
    getGuaranteedRuneDropCount,
    buildZoneLootTable,
  };
})();
