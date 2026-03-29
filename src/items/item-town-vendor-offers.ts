(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    isRunewordCompatibleWithItem,
    toNumber,
  } = runtimeWindow.ROUGE_ITEM_CATALOG;
  const {
    getAccountEconomyFeatures,
    getPlannedRuneword,
    getPlannedRunewordArchiveState,
    hasOpenPlanningCharter,
  } = runtimeWindow.__ROUGE_ITEM_TOWN_PRICING;
  type PlanningSlot = "weapon" | "armor";
  type DefinitionWithId = { id: string };

  function getCurrentEquipmentTier(equipment: RunEquipmentState | null, content: GameContent) {
    const { getItemDefinition } = runtimeWindow.ROUGE_ITEM_CATALOG;
    return toNumber(getItemDefinition(content, equipment?.itemId || "")?.progressionTier, 0);
  }

  function pickUniqueDefinitions<T extends DefinitionWithId>(candidates: (T | null | undefined)[], options: T[], desiredCount: number, seed: number): T[] {
    const selected: T[] = [];
    const seenIds = new Set<string>();

    const pushCandidate = (candidate: T | null | undefined) => {
      if (!candidate?.id || seenIds.has(candidate.id)) {
        return;
      }
      seenIds.add(candidate.id);
      selected.push(candidate);
    };

    (Array.isArray(candidates) ? candidates : []).forEach(pushCandidate);

    for (let offset = 0; selected.length < desiredCount && offset < options.length * 2; offset += 1) {
      pushCandidate(options[(seed + offset) % options.length]);
    }

    return selected.slice(0, desiredCount);
  }

  function pickVendorEquipmentOffers(slot: PlanningSlot, run: RunState, currentEquipment: RunEquipmentState | null, options: RuntimeItemDefinition[], desiredCount: number, seed: number, content: GameContent, profile: ProfileState | null = null) {
    if (options.length === 0 || desiredCount <= 0) {
      return [];
    }

    const features = getAccountEconomyFeatures(profile);
    const currentTier = getCurrentEquipmentTier(currentEquipment, content);
    const preferredWeaponFamilies = slot === "weapon"
      ? runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || []
      : [];
    const strategicWeaponFamilies = slot === "weapon"
      ? runtimeWindow.ROUGE_REWARD_ENGINE?.getStrategicWeaponFamilies?.(run, content) || preferredWeaponFamilies
      : [];
    const primaryStrategicWeaponFamily = strategicWeaponFamilies[0] || "";
    let prioritizedOptions = options;
    if (primaryStrategicWeaponFamily) {
      prioritizedOptions = options.filter((item: RuntimeItemDefinition) => (item.family || "") === primaryStrategicWeaponFamily);
    } else if (strategicWeaponFamilies.length > 0) {
      prioritizedOptions = options.filter((item: RuntimeItemDefinition) => strategicWeaponFamilies.includes(item.family || ""));
    } else if (preferredWeaponFamilies.length > 0) {
      prioritizedOptions = options.filter((item: RuntimeItemDefinition) => preferredWeaponFamilies.includes(item.family || ""));
    }
    const optionPool = options;
    const prioritizedPool = prioritizedOptions.length > 0 ? prioritizedOptions : options;
    const upgradeOptions = optionPool.filter((item: RuntimeItemDefinition) => item.progressionTier > currentTier);
    const prioritizedUpgradeOptions = prioritizedPool.filter((item: RuntimeItemDefinition) => item.progressionTier > currentTier);
    const lateBias =
      features.advancedVendorStock ||
      features.merchantPrincipate ||
      features.tradeHegemony ||
      features.sovereignExchange ||
      features.ascendantExchange ||
      features.imperialExchange ||
      features.mythicExchange ||
      run.actNumber >= 4 ||
      toNumber(run.town?.vendor?.refreshCount, 0) > 0;
    const socketReadyOffer =
      lateBias
        ? [...upgradeOptions]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const socketDelta = toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
              if (socketDelta !== 0) {
                return socketDelta;
              }
              return toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
            })[0] || null
        : null;
    const artisanOffer =
      features.artisanStock && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const treasuryOffer =
      features.treasuryExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 4)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const merchantOffer =
      features.merchantPrincipate && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 4)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const hegemonyOffer =
      features.tradeHegemony && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 4)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const plannedRuneword = getPlannedRuneword(profile, slot, content);
    const planningArchiveState = getPlannedRunewordArchiveState(profile, slot, content);
    const chronicleOffer =
      features.chronicleExchange && (run.actNumber >= 4 || planningArchiveState.unfulfilled || hasOpenPlanningCharter(profile, content))
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (!plannedRuneword) {
                return toNumber(item.maxSockets, 0) >= 3;
              }
              return isRunewordCompatibleWithItem(item, plannedRuneword);
            })
            .sort((left, right) => {
              const rightSocketDelta = toNumber(right.maxSockets, 0);
              const leftSocketDelta = toNumber(left.maxSockets, 0);
              if (rightSocketDelta !== leftSocketDelta) {
                return rightSocketDelta - leftSocketDelta;
              }
              return toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
            })[0] || null
        : null;
    const sovereignOffer =
      features.sovereignExchange && (run.actNumber >= 4 || planningArchiveState.unfulfilled || hasOpenPlanningCharter(profile, content))
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword);
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const rightReadySockets = Number(toNumber(right.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              const leftReadySockets = Number(toNumber(left.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              if (rightReadySockets !== leftReadySockets) {
                return rightReadySockets - leftReadySockets;
              }
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const planningOffer =
      plannedRuneword
        ? [...upgradeOptions, ...options]
            .filter((item) => isRunewordCompatibleWithItem(item, plannedRuneword))
            .sort((left, right) => {
              if (planningArchiveState.unfulfilled) {
                const rightSocketsReady = Number(toNumber(right.maxSockets, 0) >= toNumber(plannedRuneword.socketCount, 0));
                const leftSocketsReady = Number(toNumber(left.maxSockets, 0) >= toNumber(plannedRuneword.socketCount, 0));
                if (rightSocketsReady !== leftSocketsReady) {
                  return rightSocketsReady - leftSocketsReady;
                }
                const socketDelta = toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
                if (socketDelta !== 0) {
                  return socketDelta;
                }
              }
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const paragonOffer =
      features.paragonExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => toNumber(item.maxSockets, 0) >= 3)
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const ascendantOffer =
      features.ascendantExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword) && toNumber(item.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword.socketCount, 0));
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const imperialOffer =
      features.imperialExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword);
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const rightReadySockets = Number(toNumber(right.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              const leftReadySockets = Number(toNumber(left.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword?.socketCount, 0)));
              if (rightReadySockets !== leftReadySockets) {
                return rightReadySockets - leftReadySockets;
              }
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const mythicOffer =
      features.mythicExchange && run.actNumber >= 5
        ? [...upgradeOptions, ...options]
            .filter((item) => {
              if (plannedRuneword) {
                return isRunewordCompatibleWithItem(item, plannedRuneword) && toNumber(item.maxSockets, 0) >= Math.max(4, toNumber(plannedRuneword.socketCount, 0));
              }
              return toNumber(item.maxSockets, 0) >= 4;
            })
            .sort((left, right) => {
              const progressionDelta = toNumber(right.progressionTier, 0) - toNumber(left.progressionTier, 0);
              if (progressionDelta !== 0) {
                return progressionDelta;
              }
              return toNumber(right.maxSockets, 0) - toNumber(left.maxSockets, 0);
            })[0] || null
        : null;
    const primaryUpgrade =
      prioritizedUpgradeOptions[(lateBias ? prioritizedUpgradeOptions.length - 1 : 0)] ||
      upgradeOptions[(lateBias ? upgradeOptions.length - 1 : 0)] ||
      prioritizedPool[Math.max(0, prioritizedPool.length - 1)] ||
      optionPool[Math.max(0, optionPool.length - 1)] ||
      null;
    const secondaryUpgrade =
      prioritizedUpgradeOptions[Math.max(0, prioritizedUpgradeOptions.length - 2)] ||
      upgradeOptions[Math.max(0, upgradeOptions.length - 2)] ||
      prioritizedPool[Math.max(0, prioritizedPool.length - 2)] ||
      optionPool[Math.max(0, optionPool.length - 2)] ||
      null;
    const sidegrade = optionPool[(seed + (slot === "weapon" ? 0 : 1)) % optionPool.length] || null;

    return pickUniqueDefinitions(
      [
        planningOffer,
        sovereignOffer,
        imperialOffer,
        chronicleOffer,
        primaryUpgrade,
        mythicOffer,
        ascendantOffer,
        paragonOffer,
        hegemonyOffer,
        merchantOffer,
        secondaryUpgrade,
        socketReadyOffer,
        artisanOffer,
        treasuryOffer,
        sidegrade,
      ],
      optionPool,
      desiredCount,
      seed
    );
  }

  function fillDefinitionSelection<T extends DefinitionWithId>(selection: T[], options: T[], desiredCount: number): T[] {
    const filled = [...selection];
    const seenIds = new Set(filled.map((entry: T) => entry?.id).filter(Boolean));

    for (let index = options.length - 1; filled.length < desiredCount && index >= 0; index -= 1) {
      const candidate = options[index];
      if (!candidate?.id || seenIds.has(candidate.id)) {
        continue;
      }
      seenIds.add(candidate.id);
      filled.push(candidate);
    }

    return filled.slice(0, desiredCount);
  }

  runtimeWindow.__ROUGE_ITEM_TOWN_VENDOR_OFFERS = {
    pickUniqueDefinitions,
    pickVendorEquipmentOffers,
    fillDefinitionSelection,
  };
})();
