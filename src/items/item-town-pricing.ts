(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    getItemDefinition,
    getPreferredRunewordForEquipment,
    getRuneDefinition,
    getRunewordDefinition,
    isRunewordCompatibleWithItem,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const { ENTRY_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  // --- Equipment & rune valuation ---
  const MIN_EQUIPMENT_VALUE = 8;
  const EQUIPMENT_TIER_SCALE = 18;
  const SOCKET_VALUE_MULTIPLIER = 6;
  const INSERTED_RUNE_VALUE_MULTIPLIER = 10;
  const RUNEWORD_BONUS_VALUE = 16;
  const MIN_RUNE_VALUE = 6;
  const RUNE_TIER_SCALE = 12;
  const RUNE_RANK_SCALE = 4;

  function getEquipmentValue(equipment: RunEquipmentState | null, content: GameContent) {
    const item = getItemDefinition(content, equipment?.itemId || "");
    return (
      Math.max(MIN_EQUIPMENT_VALUE, toNumber(item?.progressionTier, 1) * EQUIPMENT_TIER_SCALE) +
      toNumber(equipment?.socketsUnlocked, 0) * SOCKET_VALUE_MULTIPLIER +
      (Array.isArray(equipment?.insertedRunes) ? equipment.insertedRunes.length : 0) * INSERTED_RUNE_VALUE_MULTIPLIER +
      (equipment?.runewordId ? RUNEWORD_BONUS_VALUE : 0)
    );
  }

  function getRuneValue(runeId: string, content: GameContent) {
    const rune = getRuneDefinition(content, runeId);
    return Math.max(MIN_RUNE_VALUE, toNumber(rune?.progressionTier, 1) * RUNE_TIER_SCALE + toNumber(rune?.rank, 1) * RUNE_RANK_SCALE);
  }

  const { hasTownFeature, getFocusedAccountTreeId } = runtimeWindow.ROUGE_UTILS;

  const ECONOMY_FEATURE_MAP: [string, string][] = [
    ["advancedVendorStock", "advanced_vendor_stock"],
    ["runewordCodex", "runeword_codex"],
    ["economyLedger", "economy_ledger"],
    ["salvageTithes", "salvage_tithes"],
    ["artisanStock", "artisan_stock"],
    ["brokerageCharter", "brokerage_charter"],
    ["treasuryExchange", "treasury_exchange"],
    ["chronicleExchange", "chronicle_exchange"],
    ["paragonExchange", "paragon_exchange"],
    ["merchantPrincipate", "merchant_principate"],
    ["sovereignExchange", "sovereign_exchange"],
    ["ascendantExchange", "ascendant_exchange"],
    ["tradeHegemony", "trade_hegemony"],
    ["imperialExchange", "imperial_exchange"],
    ["mythicExchange", "mythic_exchange"],
  ];

  function getAccountEconomyFeatures(profile: ProfileState | null): AccountEconomyFeatures {
    const focusedTreeId = getFocusedAccountTreeId(profile);
    const features = {} as AccountEconomyFeatures;
    let economyUnlocked = false;
    for (const [key, featureId] of ECONOMY_FEATURE_MAP) {
      const unlocked = hasTownFeature(profile, featureId);
      (features as unknown as Record<string, boolean>)[key] = unlocked;
      if (unlocked) {
        economyUnlocked = true;
      }
    }
    features.economyFocus = focusedTreeId === "economy" && economyUnlocked;
    return features;
  }

  function getPlannedRunewordId(profile: ProfileState | null, slot: string, content: GameContent | null = null) {
    if (slot !== "weapon" && slot !== "armor") {
      return "";
    }
    const planningKey = slot === "weapon" ? "weaponRunewordId" : "armorRunewordId";
    const runewordId = typeof profile?.meta?.planning?.[planningKey] === "string" ? profile.meta.planning[planningKey] : "";
    if (!content?.runewordCatalog) {
      return runewordId;
    }
    const runeword = getRunewordDefinition(content, runewordId);
    return runeword?.slot === slot ? runeword.id : "";
  }

  function getPlannedRuneword(profile: ProfileState | null, slot: string, content: GameContent) {
    const runeword = getRunewordDefinition(content, getPlannedRunewordId(profile, slot, content));
    return runeword?.slot === slot ? runeword : null;
  }

  function getPlannedRunewordTargets(profile: ProfileState | null, content: GameContent) {
    return ["weapon", "armor"]
      .map((slot: string) => getPlannedRuneword(profile, slot, content))
      .filter(Boolean);
  }

  function getPlanningSummary(profile: ProfileState | null, content: GameContent | null = null): ProfilePlanningSummary {
    const fallbackPlanning: ProfilePlanningSummary = {
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
    };
    return (
      runtimeWindow.ROUGE_PERSISTENCE?.getAccountProgressSummary?.(profile, content)?.planning || fallbackPlanning
    );
  }

  function hasOpenPlanningCharter(profile: ProfileState | null, content: GameContent | null = null) {
    return toNumber(getPlanningSummary(profile, content)?.unfulfilledPlanCount, 0) > 0;
  }

  function getPlannedRunewordArchiveState(profile: ProfileState | null, slot: string, content: GameContent | null = null) {
    const planning = getPlanningSummary(profile, content);
    return {
      runewordId: slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId,
      archivedRunCount: slot === "weapon" ? planning.weaponArchivedRunCount : planning.armorArchivedRunCount,
      completedRunCount: slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount,
      bestActsCleared: slot === "weapon" ? planning.weaponBestActsCleared : planning.armorBestActsCleared,
      unfulfilled: Boolean(slot === "weapon" ? planning.weaponRunewordId : planning.armorRunewordId) &&
        (slot === "weapon" ? planning.weaponCompletedRunCount : planning.armorCompletedRunCount) === 0,
    };
  }

  function getPlanningStageLine(slot: string, planning: ProfilePlanningSummary | null, content: GameContent) {
    const charter = slot === "weapon" ? planning?.weaponCharter : planning?.armorCharter;
    const runewordId = slot === "weapon" ? planning?.weaponRunewordId : planning?.armorRunewordId;
    const slotLabel = slot === "weapon" ? "Weapon" : "Armor";
    if (!runewordId) {
      return `${slotLabel} charter staging: no ${slot} charter pinned.`;
    }

    const runeword = getRunewordDefinition(content, charter?.runewordId || runewordId);
    const bestBase = charter?.bestBaseItemId ? getItemDefinition(content, charter.bestBaseItemId) : null;
    let stageLine = `${slotLabel} charter staging: ${runeword?.name || runewordId} -> ${toNumber(charter?.readyBaseCount, 0)} ready, ${toNumber(
      charter?.preparedBaseCount,
      0
    )} prepared, ${bestBase?.name || "best base not parked yet"}.`;
    if (toNumber(charter?.completedRunCount, 0) > 0) {
      const classLabel = charter?.bestCompletedClassName || charter?.bestCompletedClassId || "unknown class";
      stageLine += ` Best archive clear: Act ${Math.max(1, toNumber(charter?.bestActsCleared, 0))} with ${classLabel}`;
      if (toNumber(charter?.bestCompletedLoadoutTier, 0) > 0) {
        stageLine += ` at loadout tier ${toNumber(charter?.bestCompletedLoadoutTier, 0)}`;
      }
      stageLine += ".";
    }
    return stageLine;
  }

  function getPlanningRunewordListLabel(runewordIds: string[], content: GameContent) {
    const labels = [...new Set((Array.isArray(runewordIds) ? runewordIds : []).map((runewordId: string) => getRunewordDefinition(content, runewordId)?.name || runewordId).filter(Boolean))];
    if (labels.length === 0) {
      return "no charter targets";
    }
    if (labels.length === 1) {
      return labels[0];
    }
    if (labels.length === 2) {
      return `${labels[0]} and ${labels[1]}`;
    }
    return `${labels.slice(0, runtimeWindow.ROUGE_LIMITS.LABEL_PREVIEW).join(", ")}, +${labels.length - 2} more`;
  }

  function getTargetRunewordForEquipment(equipment: RunEquipmentState | null, run: RunState, content: GameContent, profile: ProfileState | null = null) {
    if (!equipment) {
      return null;
    }
    const plannedRuneword = getPlannedRuneword(profile, equipment.slot, content);
    const targetRuneword = getPreferredRunewordForEquipment(equipment, run, content, plannedRuneword?.id || "");
    if (!targetRuneword) {
      return null;
    }
    const targetSatisfied =
      equipment.runewordId === targetRuneword.id &&
      toNumber(equipment.socketsUnlocked, 0) >= toNumber(targetRuneword.socketCount, 0) &&
      (equipment.insertedRunes?.length || 0) >= targetRuneword.requiredRunes.length;
    return targetSatisfied ? null : targetRuneword;
  }

  function getEntryPlanningMatch(entry: InventoryEntry | null, content: GameContent, profile: ProfileState | null = null) {
    const plannedRunewords = getPlannedRunewordTargets(profile, content);
    if (plannedRunewords.length === 0 || !entry) {
      return null;
    }
    if (entry.kind === ENTRY_KIND.RUNE) {
      const matchedRuneword = plannedRunewords.find((runeword: RuntimeRunewordDefinition) => runeword.requiredRunes.includes((entry as InventoryRuneEntry).runeId)) || null;
      return matchedRuneword ? { runeword: matchedRuneword, slot: matchedRuneword.slot } : null;
    }
    const item = getItemDefinition(content, entry?.equipment?.itemId || "");
    const matchedRuneword = plannedRunewords.find((runeword: RuntimeRunewordDefinition) => isRunewordCompatibleWithItem(item, runeword)) || null;
    return matchedRuneword ? { runeword: matchedRuneword, slot: matchedRuneword.slot } : null;
  }

  function getEquipmentPlanningMatch(equipment: RunEquipmentState | null, content: GameContent, profile: ProfileState | null = null) {
    if (!equipment) {
      return null;
    }
    return getEntryPlanningMatch(
      {
        entryId: equipment.entryId || "",
        kind: ENTRY_KIND.EQUIPMENT,
        equipment,
      },
      content,
      profile
    );
  }

  function canCommissionSocket(equipment: RunEquipmentState | null, content: GameContent) {
    if (!equipment || equipment.runewordId) {
      return false;
    }
    const item = getItemDefinition(content, equipment.itemId);
    return Boolean(item) && toNumber(equipment.socketsUnlocked, 0) < toNumber(item?.maxSockets, 0);
  }

  function getStashPlanningPressure(profile: ProfileState | null) {
    const entries = Array.isArray(profile?.stash?.entries) ? profile.stash.entries : [];
    const equipmentEntries = entries.filter((entry: InventoryEntry) => entry?.kind === ENTRY_KIND.EQUIPMENT);
    return {
      stashEntries: entries.length,
      socketReadyEntries: equipmentEntries.filter((entry: InventoryEntry) => toNumber((entry as InventoryEquipmentEntry)?.equipment?.socketsUnlocked, 0) > 0).length,
      runewordEntries: equipmentEntries.filter((entry: InventoryEntry) => (entry as InventoryEquipmentEntry)?.equipment?.runewordId).length,
    };
  }

  runtimeWindow.__ROUGE_ITEM_TOWN_PRICING = {
    ECONOMY_FEATURE_MAP,
    getAccountEconomyFeatures,
    getPlannedRunewordId,
    getPlannedRuneword,
    getPlannedRunewordTargets,
    getPlannedRunewordArchiveState,
    getPlanningSummary,
    hasOpenPlanningCharter,
    getPlanningStageLine,
    getPlanningRunewordListLabel,
    getTargetRunewordForEquipment,
    getEntryPlanningMatch,
    getEquipmentPlanningMatch,
    canCommissionSocket,
    getStashPlanningPressure,
    getEquipmentValue,
    getRuneValue,
  };
})();
