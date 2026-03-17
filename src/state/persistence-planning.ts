(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const {
    uniqueStrings,
    toNumber,
    sanitizePlanningState,
  } = runtimeWindow.__ROUGE_PERSISTENCE_CORE;

  function createDefaultPlanningOverview(): ProfilePlanningOverviewSummary {
    const overview: ProfilePlanningOverviewSummary = {
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
    };
    return overview;
  }

  function getPlanningRunewordLabel(runewordId: string, content: GameContent | null = null) {
    return (content?.runewordCatalog?.[runewordId]?.name || runewordId || "").trim();
  }

  function getPlanningRunewordListLabel(runewordIds: string[], content: GameContent | null = null) {
    const labels = uniqueStrings((Array.isArray(runewordIds) ? runewordIds : []).map((runewordId: string) => getPlanningRunewordLabel(runewordId, content)));
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

  function buildPlanningCharterSummary(
    profile: ProfileState | null,
    runewordId: string,
    slot: string,
    historySummary: { archivedRunCount: number; completedRunCount: number; bestActsCleared: number; completedEntries: RunHistoryEntry[] },
    content: GameContent | null = null
  ): ProfilePlanningCharterSummary | null {
    if (!runewordId) {
      return null;
    }

    const itemCatalog = runtimeWindow.ROUGE_ITEM_CATALOG || null;
    const runeword =
      itemCatalog?.getRunewordDefinition?.(content, runewordId) ||
      (content?.runewordCatalog ? content.runewordCatalog[runewordId] || null : null);
    if (!runeword || runeword.slot !== slot) {
      return null;
    }

    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const compatibleBases = entries
      .filter((entry: InventoryEntry) => entry?.kind === "equipment" && (entry as InventoryEquipmentEntry)?.equipment && !(entry as InventoryEquipmentEntry).equipment.runewordId)
      .map((entry: InventoryEntry) => {
        const equipment = (entry as InventoryEquipmentEntry).equipment;
        const item =
          itemCatalog?.getItemDefinition?.(content, equipment?.itemId || "") ||
          (content?.itemCatalog ? content.itemCatalog[equipment?.itemId || ""] || null : null);
        if (!item) {
          return null;
        }
        const compatible =
          itemCatalog?.isRunewordCompatibleWithEquipment?.(equipment, runeword, content) ||
          itemCatalog?.isRunewordCompatibleWithItem?.(item, runeword) ||
          false;
        if (!compatible) {
          return null;
        }
        return {
          equipment,
          item,
          socketsUnlocked: toNumber(equipment?.socketsUnlocked, 0),
          insertedRuneCount: Array.isArray(equipment?.insertedRunes) ? equipment.insertedRunes.length : 0,
        };
      })
      .filter(Boolean);

    const preparedBases = compatibleBases.filter((entry) => entry.socketsUnlocked > 0 || entry.insertedRuneCount > 0);
    const readyBases = compatibleBases.filter((entry) => entry.socketsUnlocked >= toNumber(runeword.socketCount, 0));
    const bestCompletedEntry =
      historySummary.completedEntries
        .slice()
        .sort((left: RunHistoryEntry, right: RunHistoryEntry) => {
          if (toNumber(left?.actsCleared, 0) !== toNumber(right?.actsCleared, 0)) {
            return toNumber(right?.actsCleared, 0) - toNumber(left?.actsCleared, 0);
          }
          if (toNumber(left?.loadoutTier, 0) !== toNumber(right?.loadoutTier, 0)) {
            return toNumber(right?.loadoutTier, 0) - toNumber(left?.loadoutTier, 0);
          }
          if (toNumber(left?.loadoutSockets, 0) !== toNumber(right?.loadoutSockets, 0)) {
            return toNumber(right?.loadoutSockets, 0) - toNumber(left?.loadoutSockets, 0);
          }
          if (toNumber(left?.level, 0) !== toNumber(right?.level, 0)) {
            return toNumber(right?.level, 0) - toNumber(left?.level, 0);
          }
          return String(right?.completedAt || "").localeCompare(String(left?.completedAt || ""));
        })
        .shift() || null;
    const bestBase =
      compatibleBases
        .slice()
        .sort((left, right) => {
          const leftReady = Number(left.socketsUnlocked >= toNumber(runeword.socketCount, 0));
          const rightReady = Number(right.socketsUnlocked >= toNumber(runeword.socketCount, 0));
          if (leftReady !== rightReady) {
            return rightReady - leftReady;
          }
          if (toNumber(left.item?.progressionTier, 0) !== toNumber(right.item?.progressionTier, 0)) {
            return toNumber(right.item?.progressionTier, 0) - toNumber(left.item?.progressionTier, 0);
          }
          if (left.socketsUnlocked !== right.socketsUnlocked) {
            return right.socketsUnlocked - left.socketsUnlocked;
          }
          if (left.insertedRuneCount !== right.insertedRuneCount) {
            return right.insertedRuneCount - left.insertedRuneCount;
          }
          return String(left.item?.id || "").localeCompare(String(right.item?.id || ""));
        })
        .shift() || null;

    return {
      slot,
      runewordId,
      archivedRunCount: historySummary.archivedRunCount,
      completedRunCount: historySummary.completedRunCount,
      bestActsCleared: historySummary.bestActsCleared,
      bestCompletedRunId: bestCompletedEntry?.runId || "",
      bestCompletedClassId: bestCompletedEntry?.classId || "",
      bestCompletedClassName: bestCompletedEntry?.className || "",
      bestCompletedAt: bestCompletedEntry?.completedAt || "",
      bestCompletedLoadoutTier: toNumber(bestCompletedEntry?.loadoutTier, 0),
      bestCompletedLoadoutSockets: toNumber(bestCompletedEntry?.loadoutSockets, 0),
      requiredSocketCount: toNumber(runeword.socketCount, 0),
      compatibleBaseCount: compatibleBases.length,
      preparedBaseCount: preparedBases.length,
      readyBaseCount: readyBases.length,
      bestBaseItemId: bestBase?.item?.id || "",
      bestBaseTier: toNumber(bestBase?.item?.progressionTier, 0),
      bestBaseSocketsUnlocked: toNumber(bestBase?.socketsUnlocked, 0),
      bestBaseMaxSockets: toNumber(bestBase?.item?.maxSockets, 0),
      bestBaseInsertedRuneCount: toNumber(bestBase?.insertedRuneCount, 0),
      bestBaseMissingRuneCount: Math.max(0, toNumber(runeword.socketCount, 0) - toNumber(bestBase?.insertedRuneCount, 0)),
      bestBaseSocketGap: Math.max(0, toNumber(runeword.socketCount, 0) - toNumber(bestBase?.socketsUnlocked, 0)),
      commissionableBaseCount: compatibleBases.filter((entry) => entry.socketsUnlocked < toNumber(runeword.socketCount, 0)).length,
      hasReadyBase: readyBases.length > 0,
      repeatForgeReady: readyBases.length > 0 && historySummary.completedRunCount > 0,
    };
  }

  function buildPlanningOverviewSummary(charters: (ProfilePlanningCharterSummary | null)[], content: GameContent | null = null): ProfilePlanningOverviewSummary {
    const activeCharters = (Array.isArray(charters) ? charters : []).filter(Boolean) as ProfilePlanningCharterSummary[];
    if (activeCharters.length === 0) {
      return createDefaultPlanningOverview();
    }

    const compatibleCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.compatibleBaseCount > 0);
    const preparedCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.preparedBaseCount > 0 && !charter.hasReadyBase);
    const readyCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.hasReadyBase);
    const missingBaseCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.compatibleBaseCount === 0);
    const fulfilledCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => toNumber(charter.completedRunCount, 0) > 0);
    const socketCommissionCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.compatibleBaseCount > 0 && toNumber(charter.bestBaseSocketGap, 0) > 0);
    const repeatForgeReadyCharters = activeCharters.filter((charter: ProfilePlanningCharterSummary) => charter.repeatForgeReady);
    const compatibleRunewordIds = compatibleCharters.map((charter: ProfilePlanningCharterSummary) => charter.runewordId);
    const preparedRunewordIds = preparedCharters.map((charter: ProfilePlanningCharterSummary) => charter.runewordId);
    const readyRunewordIds = readyCharters.map((charter: ProfilePlanningCharterSummary) => charter.runewordId);
    const missingBaseRunewordIds = missingBaseCharters.map((charter: ProfilePlanningCharterSummary) => charter.runewordId);
    const fulfilledRunewordIds = fulfilledCharters.map((charter: ProfilePlanningCharterSummary) => charter.runewordId);
    const readyFulfilledRunewordIds = readyCharters.filter((charter: ProfilePlanningCharterSummary) => toNumber(charter.completedRunCount, 0) > 0).map((charter: ProfilePlanningCharterSummary) => charter.runewordId);

    const overview: ProfilePlanningOverviewSummary = {
      compatibleCharterCount: compatibleCharters.length,
      preparedCharterCount: preparedCharters.length,
      readyCharterCount: readyCharters.length,
      missingBaseCharterCount: missingBaseCharters.length,
      socketCommissionCharterCount: socketCommissionCharters.length,
      repeatForgeReadyCharterCount: repeatForgeReadyCharters.length,
      trackedBaseCount: compatibleCharters.reduce((total: number, charter: ProfilePlanningCharterSummary) => total + toNumber(charter.compatibleBaseCount, 0), 0),
      highestTrackedBaseTier: compatibleCharters.reduce((highest: number, charter: ProfilePlanningCharterSummary) => Math.max(highest, toNumber(charter.bestBaseTier, 0)), 0),
      totalSocketStepsRemaining: socketCommissionCharters.reduce((total: number, charter: ProfilePlanningCharterSummary) => total + toNumber(charter.bestBaseSocketGap, 0), 0),
      compatibleRunewordIds,
      preparedRunewordIds,
      readyRunewordIds,
      missingBaseRunewordIds,
      fulfilledRunewordIds,
      bestFulfilledActsCleared: fulfilledCharters.reduce((highest: number, charter: ProfilePlanningCharterSummary) => Math.max(highest, toNumber(charter.bestActsCleared, 0)), 0),
      bestFulfilledLoadoutTier: fulfilledCharters.reduce((highest: number, charter: ProfilePlanningCharterSummary) => Math.max(highest, toNumber(charter.bestCompletedLoadoutTier, 0)), 0),
      nextAction: "hunt_bases",
      nextActionLabel: "Hunt Bases",
      nextActionSummary: `Pinned charters still lack a compatible parked base: ${getPlanningRunewordListLabel(missingBaseRunewordIds, content)}.`,
    };

    if (readyRunewordIds.length > 0) {
      overview.nextAction = "stock_runes";
      overview.nextActionLabel = "Stock Runes";
      overview.nextActionSummary = `Ready base parked for ${getPlanningRunewordListLabel(readyRunewordIds, content)}. Prioritize rune depth before another replacement base.`;
      if (readyFulfilledRunewordIds.length > 0) {
        overview.nextActionSummary = `Ready base parked for ${getPlanningRunewordListLabel(readyRunewordIds, content)}. Archive already proved ${getPlanningRunewordListLabel(
          readyFulfilledRunewordIds,
          content
        )} up through Act ${Math.max(1, overview.bestFulfilledActsCleared)}. Prioritize rune depth for a repeat forge.`;
      }
      return overview;
    }

    if (preparedRunewordIds.length > 0) {
      overview.nextAction = "open_sockets";
      overview.nextActionLabel = "Commission Sockets";
      overview.nextActionSummary = `Prepared base parked for ${getPlanningRunewordListLabel(
        preparedRunewordIds,
        content
      )}. Commission ${Math.max(1, overview.totalSocketStepsRemaining)} more socket${overview.totalSocketStepsRemaining === 1 ? "" : "s"} across the best parked bases before chasing more replacements.`;
      return overview;
    }

    if (compatibleRunewordIds.length > 0) {
      overview.nextAction = "prepare_bases";
      overview.nextActionLabel = "Commission Sockets";
      overview.nextActionSummary = `Compatible base parked for ${getPlanningRunewordListLabel(
        compatibleRunewordIds,
        content
      )}. Commission ${Math.max(1, overview.totalSocketStepsRemaining)} socket${overview.totalSocketStepsRemaining === 1 ? "" : "s"} to start live base prep instead of chasing more replacements.`;
      return overview;
    }

    return overview;
  }

  function buildPlanningSummary(profile: ProfileState | null, content: GameContent | null = null): ProfilePlanningSummary {
    sanitizePlanningState(profile, content);
    const history = Array.isArray(profile?.runHistory) ? profile.runHistory : [];
    const weaponRunewordId = typeof profile?.meta?.planning?.weaponRunewordId === "string" ? profile.meta.planning.weaponRunewordId : "";
    const armorRunewordId = typeof profile?.meta?.planning?.armorRunewordId === "string" ? profile.meta.planning.armorRunewordId : "";
    const summarizeRuneword = (runewordId: string, slotKey: string) => {
      if (!runewordId) {
        return {
          archivedRunCount: 0,
          completedRunCount: 0,
          bestActsCleared: 0,
          completedEntries: [],
        };
      }

      const archivedEntries = history.filter((entry: RunHistoryEntry) => (entry as unknown as Record<string, unknown>)?.[slotKey] === runewordId);
      const completedEntries = archivedEntries.filter((entry: RunHistoryEntry) => {
        return Array.isArray(entry?.completedPlannedRunewordIds) && entry.completedPlannedRunewordIds.includes(runewordId);
      });
      return {
        archivedRunCount: archivedEntries.length,
        completedRunCount: completedEntries.length,
        bestActsCleared: completedEntries.reduce((highest: number, entry: RunHistoryEntry) => Math.max(highest, toNumber(entry?.actsCleared, 0)), 0),
        completedEntries,
      };
    };

    const weaponSummary = summarizeRuneword(weaponRunewordId, "plannedWeaponRunewordId");
    const armorSummary = summarizeRuneword(armorRunewordId, "plannedArmorRunewordId");
    const weaponCharter = buildPlanningCharterSummary(profile, weaponRunewordId, "weapon", weaponSummary, content);
    const armorCharter = buildPlanningCharterSummary(profile, armorRunewordId, "armor", armorSummary, content);
    return {
      weaponRunewordId,
      armorRunewordId,
      plannedRunewordCount: [weaponRunewordId, armorRunewordId].filter(Boolean).length,
      fulfilledPlanCount: Number(Boolean(weaponRunewordId) && weaponSummary.completedRunCount > 0) + Number(Boolean(armorRunewordId) && armorSummary.completedRunCount > 0),
      unfulfilledPlanCount: Number(Boolean(weaponRunewordId) && weaponSummary.completedRunCount === 0) + Number(Boolean(armorRunewordId) && armorSummary.completedRunCount === 0),
      weaponArchivedRunCount: weaponSummary.archivedRunCount,
      weaponCompletedRunCount: weaponSummary.completedRunCount,
      weaponBestActsCleared: weaponSummary.bestActsCleared,
      armorArchivedRunCount: armorSummary.archivedRunCount,
      armorCompletedRunCount: armorSummary.completedRunCount,
      armorBestActsCleared: armorSummary.bestActsCleared,
      overview: buildPlanningOverviewSummary([weaponCharter, armorCharter], content),
      weaponCharter,
      armorCharter,
    };
  }

  runtimeWindow.__ROUGE_PERSISTENCE_PLANNING = {
    buildPlanningSummary,
  };
})();
