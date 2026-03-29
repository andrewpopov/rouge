(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  function getGameContent(content: GameContent | null = null) {
    return content || runtimeWindow.ROUGE_GAME_CONTENT || null;
  }

  function getItemCatalogApi() {
    if (!runtimeWindow.ROUGE_ITEM_CATALOG) {
      throw new Error("Item catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_ITEM_CATALOG;
  }

  function getItemLoadoutApi() {
    if (!runtimeWindow.ROUGE_ITEM_LOADOUT) {
      throw new Error("Item loadout helper is unavailable.");
    }
    return runtimeWindow.ROUGE_ITEM_LOADOUT;
  }

  function getItemRewardApi() {
    if (!runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS) {
      throw new Error("Item reward helper is unavailable.");
    }
    return runtimeWindow.__ROUGE_ITEM_SYSTEM_REWARDS;
  }

  function getStrategicWeaponFamilies(run: RunState, content: GameContent) {
    const classPreferredFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
    return runtimeWindow.ROUGE_REWARD_ENGINE?.getStrategicWeaponFamilies?.(run, content) || classPreferredFamilies;
  }

  function getRunePrefixLength(insertedRunes: string[], requiredRunes: string[]) {
    let count = 0;
    while (count < insertedRunes.length && insertedRunes[count] === requiredRunes[count]) {
      count += 1;
    }
    return count;
  }

  function isStrictRunePrefix(insertedRunes: string[], requiredRunes: string[]) {
    return getRunePrefixLength(insertedRunes, requiredRunes) === insertedRunes.length;
  }

  function getRunewordBonusScore(runeword: RuntimeRunewordDefinition, toNumber: (value: unknown, fallback?: number) => number) {
    return Object.values(runeword?.bonuses || {}).reduce((total: number, value: unknown) => total + Math.max(0, toNumber(value, 0)), 0);
  }

  function pickQuestRunewordForEquipment(equipment: RunEquipmentState | null, run: RunState, actNumber: number, content: GameContent) {
    if (!equipment) {
      return null;
    }
    const itemCatalog = getItemCatalogApi();
    const item = itemCatalog.getItemDefinition(content, equipment.itemId);
    if (!item) {
      return null;
    }

    const { isRunewordCompatibleWithItem, toNumber } = itemCatalog;
    const insertedRunes = Array.isArray(equipment.insertedRunes) ? equipment.insertedRunes : [];
    const targetTier = Math.max(2, actNumber + Number(equipment.slot === "weapon"));
    const compatibleRunewords = (Object.values(content.runewordCatalog || {}) as RuntimeRunewordDefinition[])
      .filter((runeword: RuntimeRunewordDefinition) => isRunewordCompatibleWithItem(item, runeword))
      .filter((runeword: RuntimeRunewordDefinition) => isStrictRunePrefix(insertedRunes, runeword.requiredRunes))
      .filter((runeword: RuntimeRunewordDefinition) => toNumber(equipment.socketsUnlocked, 0) <= toNumber(runeword.socketCount, 0));

    if (compatibleRunewords.length === 0) {
      return null;
    }

    return [...compatibleRunewords]
      .sort((left: RuntimeRunewordDefinition, right: RuntimeRunewordDefinition) => {
        const leftPrefix = getRunePrefixLength(insertedRunes, left.requiredRunes);
        const rightPrefix = getRunePrefixLength(insertedRunes, right.requiredRunes);
        if (leftPrefix !== rightPrefix) {
          return rightPrefix - leftPrefix;
        }

        const leftSpecificity = Math.max(0, 6 - Math.max(1, left.familyAllowList?.length || 1));
        const rightSpecificity = Math.max(0, 6 - Math.max(1, right.familyAllowList?.length || 1));
        if (leftSpecificity !== rightSpecificity) {
          return rightSpecificity - leftSpecificity;
        }

        const leftTierDistance = Math.abs(toNumber(left.progressionTier, 1) - targetTier);
        const rightTierDistance = Math.abs(toNumber(right.progressionTier, 1) - targetTier);
        if (leftTierDistance !== rightTierDistance) {
          return leftTierDistance - rightTierDistance;
        }

        const leftBonusScore = getRunewordBonusScore(left, toNumber);
        const rightBonusScore = getRunewordBonusScore(right, toNumber);
        if (leftBonusScore !== rightBonusScore) {
          return rightBonusScore - leftBonusScore;
        }

        return String(left.id || "").localeCompare(String(right.id || ""));
      })
      .shift() || null;
  }

  function buildQuestCandidateItems(slot: "weapon" | "armor", run: RunState, zone: ZoneState, actNumber: number, content: GameContent) {
    const rewardApi = getItemRewardApi();
    const itemCatalog = getItemCatalogApi();
    const currentItem = itemCatalog.getItemDefinition(content, run.loadout?.[slot]?.itemId || "");
    const preferredWeaponFamilies = slot === "weapon"
      ? getStrategicWeaponFamilies(run, content)
      : [];
    const candidates = rewardApi.getAvailableItemsForSlot(slot, actNumber, zone, run, content)
      .filter((item: RuntimeItemDefinition) => slot !== "weapon" || preferredWeaponFamilies.length === 0 || preferredWeaponFamilies.includes(item.family || ""))
      .sort((left: RuntimeItemDefinition, right: RuntimeItemDefinition) => {
        const rightPreferred = Number(slot === "weapon" && preferredWeaponFamilies.includes(right.family || ""));
        const leftPreferred = Number(slot === "weapon" && preferredWeaponFamilies.includes(left.family || ""));
        if (rightPreferred !== leftPreferred) {
          return rightPreferred - leftPreferred;
        }

        const rightCurrentFamily = Number((right.family || "") === (currentItem?.family || ""));
        const leftCurrentFamily = Number((left.family || "") === (currentItem?.family || ""));
        if (rightCurrentFamily !== leftCurrentFamily) {
          return rightCurrentFamily - leftCurrentFamily;
        }

        const tierDelta = Number(right.progressionTier || 0) - Number(left.progressionTier || 0);
        if (tierDelta !== 0) {
          return tierDelta;
        }

        return Number(right.maxSockets || 0) - Number(left.maxSockets || 0);
      });

    if (slot === "weapon" && preferredWeaponFamilies.length > 0) {
      return candidates;
    }

    if (candidates.length > 0) {
      return candidates;
    }

    return rewardApi.getAvailableItemsForSlot(slot, actNumber, zone, run, content);
  }

  function createQuestProjectEquipment(
    slot: "weapon" | "armor",
    itemId: string,
    run: RunState,
    content: GameContent
  ) {
    const loadoutApi = getItemLoadoutApi();
    const currentEquipment = run.loadout?.[slot] || null;
    if (currentEquipment?.runewordId) {
      return {
        itemId,
        slot,
        socketsUnlocked: 0,
        insertedRunes: [],
        runewordId: "",
      } as RunEquipmentState;
    }
    const preserved = loadoutApi.getPreservedSlotProgression(currentEquipment, itemId, content);
    return {
      itemId,
      slot,
      socketsUnlocked: preserved.socketsUnlocked,
      insertedRunes: [...preserved.insertedRunes],
      runewordId: "",
    } as RunEquipmentState;
  }

  function buildQuestRuneforgeProjectForSlot(slot: "weapon" | "armor", run: RunState, zone: ZoneState, actNumber: number, content: GameContent) {
    const itemCatalog = getItemCatalogApi();
    const currentEquipment = run.loadout?.[slot] || null;
    const candidateItemIds: string[] = [];
    if (currentEquipment?.itemId) {
      candidateItemIds.push(currentEquipment.itemId);
    }
    buildQuestCandidateItems(slot, run, zone, actNumber, content).forEach((item: RuntimeItemDefinition) => {
      if (!candidateItemIds.includes(item.id)) {
        candidateItemIds.push(item.id);
      }
    });

    let bestProject: {
      slot: "weapon" | "armor";
      itemId: string;
      itemName: string;
      runeword: RuntimeRunewordDefinition;
      equipItemId: string;
      requiresFreshBase: boolean;
      socketsToAdd: number;
      runeIdsToSocket: string[];
      classFit: number;
      score: number;
    } | null = null;

    for (const itemId of candidateItemIds) {
      const simulatedEquipment = createQuestProjectEquipment(slot, itemId, run, content);
      const needsFreshBaseSimulation = Boolean(currentEquipment?.itemId) && (
        currentEquipment.itemId !== itemId ||
        Boolean(currentEquipment.runewordId) ||
        (currentEquipment.insertedRunes?.length || 0) > 0
      );
      const projectEquipment = needsFreshBaseSimulation
        ? ({
            itemId,
            slot,
            socketsUnlocked: 0,
            insertedRunes: [],
            runewordId: "",
          } as RunEquipmentState)
        : simulatedEquipment;
      const runeword = pickQuestRunewordForEquipment(projectEquipment, run, actNumber, content);
      if (!runeword) {
        continue;
      }

      const item = itemCatalog.getItemDefinition(content, itemId);
      const currentItem = currentEquipment ? itemCatalog.getItemDefinition(content, currentEquipment.itemId) : null;
      const currentRunewordId = currentEquipment?.runewordId || "";
      const currentRuneword = currentRunewordId ? itemCatalog.getRunewordDefinition(content, currentRunewordId) : null;
      const alreadyComplete =
        currentEquipment?.itemId === itemId &&
        currentRunewordId === runeword.id &&
        currentEquipment.socketsUnlocked === runeword.socketCount &&
        (currentEquipment.insertedRunes?.length || 0) === runeword.requiredRunes.length;
      if (alreadyComplete) {
        continue;
      }

      const preferredWeaponFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
      const strategicWeaponFamilies = getStrategicWeaponFamilies(run, content);
      const strategyFit = slot === "armor" ? 1 : Number(strategicWeaponFamilies.includes(item?.family || ""));
      const classFit = slot === "armor" ? 1 : Number(preferredWeaponFamilies.includes(item?.family || ""));
      const socketsToAdd = Math.max(0, runeword.socketCount - projectEquipment.socketsUnlocked);
      const runeIdsToSocket = runeword.requiredRunes.slice(projectEquipment.insertedRunes.length);
      const targetTier = Math.max(2, actNumber + Number(slot === "weapon"));
      const tierFit = Math.max(0, 8 - Math.abs(Number(runeword.progressionTier || 1) - targetTier) * 2);
      const currentRunewordTier = Number(currentRuneword?.progressionTier || 0);
      const nextRunewordTier = Number(runeword.progressionTier || 0);
      const currentRunewordPower = currentRuneword ? getRunewordBonusScore(currentRuneword, itemCatalog.toNumber) : 0;
      const nextRunewordPower = getRunewordBonusScore(runeword, itemCatalog.toNumber);
      const runewordUpgrade = Boolean(currentRunewordId && currentRunewordId !== runeword.id);
      const completedRuneword = Boolean(
        currentRunewordId &&
        currentEquipment?.socketsUnlocked === currentRuneword?.socketCount &&
        (currentEquipment?.insertedRunes?.length || 0) >= (currentRuneword?.requiredRunes?.length || 0)
      );
      const fixesSocketBlockedUpgrade =
        Boolean(currentRunewordId) &&
        itemCatalog.toNumber(currentItem?.maxSockets, 0) < itemCatalog.toNumber(runeword.socketCount, 0) &&
        itemCatalog.toNumber(item?.maxSockets, 0) >= itemCatalog.toNumber(runeword.socketCount, 0);
      const requiresFreshBase = needsFreshBaseSimulation;
      const alignedWeaponProject = Number(strategyFit > 0 || classFit > 0);
      const offPlanWeaponPenalty = Number(slot === "weapon" && alignedWeaponProject === 0) * 36;
      const weaponPriority =
        Number(slot === "weapon") * (
          Number(!currentRunewordId) * alignedWeaponProject * (actNumber <= 2 ? 24 : 18) +
          Number(Boolean(currentRunewordId) && !runewordUpgrade) * 6
        );
      const armorCatchUpPriority =
        Number(slot === "armor" && actNumber >= 3) * (
          Number(runewordUpgrade) * 20 +
          Math.max(0, nextRunewordTier - currentRunewordTier) * 6 +
          Number(completedRuneword) * 8 +
          6
        );
      const score =
        Number(!currentRunewordId) * 18 +
        Number(runewordUpgrade) * 22 +
        Number(fixesSocketBlockedUpgrade) * 24 +
        Math.max(0, nextRunewordTier - currentRunewordTier) * 6 +
        Math.max(0, nextRunewordPower - currentRunewordPower) * 2 +
        strategyFit * 24 +
        classFit * 10 +
        weaponPriority +
        armorCatchUpPriority +
        tierFit +
        Number(currentEquipment?.itemId !== itemId) * 4 +
        Number(runeIdsToSocket.length > 0) * 3 +
        Number(Boolean(currentEquipment?.itemId) && currentEquipment.itemId === itemId) * 2 -
        offPlanWeaponPenalty;

      const project = {
        slot,
        itemId,
        itemName: item?.name || itemId,
        runeword,
        equipItemId: currentEquipment?.itemId === itemId && !requiresFreshBase ? "" : itemId,
        requiresFreshBase,
        socketsToAdd,
        runeIdsToSocket,
        classFit,
        score,
      };
      if (
        !bestProject ||
        project.score > bestProject.score ||
        (project.score === bestProject.score && project.classFit > bestProject.classFit)
      ) {
        bestProject = project;
      }
    }

    return bestProject;
  }

  function buildQuestRuneforgePackage(run: RunState, zone: ZoneState, actNumber: number, content: GameContent | null = null) {
    const resolvedContent = getGameContent(content);
    if (!resolvedContent) {
      return null;
    }

    const projects = (["weapon", "armor"] as const)
      .map((slot) => buildQuestRuneforgeProjectForSlot(slot, run, zone, actNumber, resolvedContent))
      .filter(Boolean) as Array<{
        slot: "weapon" | "armor";
        itemId: string;
        itemName: string;
        runeword: RuntimeRunewordDefinition;
        equipItemId: string;
        requiresFreshBase: boolean;
        socketsToAdd: number;
        runeIdsToSocket: string[];
        classFit: number;
        score: number;
      }>;

    if (projects.length === 0) {
      return null;
    }

    const loadoutApi = getItemLoadoutApi();
    const itemCatalog = getItemCatalogApi();
    const project = [...projects]
      .sort((left, right) => right.score - left.score || right.classFit - left.classFit || String(left.slot).localeCompare(String(right.slot)))
      .shift();
    if (!project) {
      return null;
    }

    const slotLabel = loadoutApi.EQUIPMENT_SLOT_LABELS?.[project.slot] || project.slot;
    const effects: RewardChoiceEffect[] = [];
    if (project.equipItemId) {
      effects.push({
        kind: "equip_item",
        itemId: project.equipItemId,
        rarity: itemCatalog.RARITY.WHITE,
        freshBase: project.requiresFreshBase,
      });
    }
    for (let socketIndex = 0; socketIndex < project.socketsToAdd; socketIndex += 1) {
      effects.push({ kind: "add_socket", slot: project.slot });
    }
    project.runeIdsToSocket.forEach((runeId: string) => {
      effects.push({ kind: "socket_rune", slot: project.slot, runeId });
    });

    const runeNames = project.runeword.requiredRunes
      .map((runeId: string) => itemCatalog.getRuneDefinition(resolvedContent, runeId)?.name || runeId)
      .join(" + ");
    return {
      summaryLine: `Runeforge commission: ${slotLabel} -> ${project.runeword.name} on ${project.itemName} (${runeNames}).`,
      descriptionLine: `A route runesmith also prepares your ${slotLabel.toLowerCase()} toward ${project.runeword.name}.`,
      effects,
    };
  }

  runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_RUNEFORGE = {
    buildQuestRuneforgePackage,
  };
})();
