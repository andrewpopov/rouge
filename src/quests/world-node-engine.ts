(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  function getWorldNodeCatalogApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_CATALOG) {
      throw new Error("World-node catalog helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_CATALOG;
  }

  function getCatalog(): WorldNodeCatalog {
    return getWorldNodeCatalogApi().getCatalog();
  }

  function assertValidCatalog() {
    getWorldNodeCatalogApi().assertValidCatalog();
  }

  function getWorldNodeZonesApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_ZONES) {
      throw new Error("World-node zones helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_ZONES;
  }

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

  function buildChoice(kind: string, choiceDefinition: WorldNodeChoiceDefinition) {
    return getWorldNodeZonesApi().buildChoice(kind, choiceDefinition);
  }

  function getQuestDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getQuestDefinition(actNumber);
  }

  function getShrineDefinition(actNumber: number) {
    return getWorldNodeZonesApi().getShrineDefinition(actNumber);
  }

  function isShrineOpportunityNodeId(nodeId: string) {
    return getWorldNodeZonesApi().isShrineOpportunityNodeId(nodeId);
  }

  function getWorldNodeVariantsApi() {
    if (!runtimeWindow.ROUGE_WORLD_NODE_VARIANTS) {
      throw new Error("World-node variant helper is unavailable.");
    }
    return runtimeWindow.ROUGE_WORLD_NODE_VARIANTS;
  }

  function cloneEffect(effect: RewardChoiceEffect): RewardChoiceEffect {
    return {
      ...effect,
      ...(Array.isArray(effect?.flagIds) ? { flagIds: [...effect.flagIds] } : {}),
      ...(effect?.rarityBonuses ? { rarityBonuses: { ...effect.rarityBonuses } } : {}),
      ...(effect?.weaponAffixes ? { weaponAffixes: runtimeWindow.ROUGE_ITEM_CATALOG?.cloneWeaponProfile?.(effect.weaponAffixes) || effect.weaponAffixes } : {}),
      ...(effect?.armorAffixes ? { armorAffixes: runtimeWindow.ROUGE_ITEM_CATALOG?.cloneArmorProfile?.(effect.armorAffixes) || effect.armorAffixes } : {}),
    };
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
      ? runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || []
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

    for (const itemId of candidateItemIds) {
      const simulatedEquipment = createQuestProjectEquipment(slot, itemId, run, content);
      const runeword = pickQuestRunewordForEquipment(simulatedEquipment, run, actNumber, content);
      if (!runeword) {
        continue;
      }

      const item = itemCatalog.getItemDefinition(content, itemId);
      const currentRunewordId = currentEquipment?.runewordId || "";
      const alreadyComplete =
        currentEquipment?.itemId === itemId &&
        currentRunewordId === runeword.id &&
        currentEquipment.socketsUnlocked === runeword.socketCount &&
        (currentEquipment.insertedRunes?.length || 0) === runeword.requiredRunes.length;
      if (alreadyComplete) {
        continue;
      }

      const preferredWeaponFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
      const classFit = slot === "armor" ? 1 : Number(preferredWeaponFamilies.includes(item?.family || ""));
      const socketsToAdd = Math.max(0, runeword.socketCount - simulatedEquipment.socketsUnlocked);
      const runeIdsToSocket = runeword.requiredRunes.slice(simulatedEquipment.insertedRunes.length);
      const targetTier = Math.max(2, actNumber + Number(slot === "weapon"));
      const tierFit = Math.max(0, 8 - Math.abs(Number(runeword.progressionTier || 1) - targetTier) * 2);
      const score =
        Number(!currentRunewordId) * 40 +
        classFit * 18 +
        Number(slot === "weapon") * 8 +
        tierFit +
        Number(currentEquipment?.itemId !== itemId) * 4 +
        Number(runeIdsToSocket.length > 0) * 3 +
        Number(Boolean(currentEquipment?.itemId) && currentEquipment.itemId === itemId) * 2;

      return {
        slot,
        itemId,
        itemName: item?.name || itemId,
        runeword,
        equipItemId: currentEquipment?.itemId === itemId ? "" : itemId,
        socketsToAdd,
        runeIdsToSocket,
        classFit,
        score,
      };
    }

    return null;
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

  function buildQuestChoices(run: RunState, zone: ZoneState, actNumber: number, definition: QuestNodeDefinition, content: GameContent | null = null) {
    const runeforgePackage = buildQuestRuneforgePackage(run, zone, actNumber, content);
    const resolvedContent = getGameContent(content);
    return {
      choices: definition.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => {
        const augmentedChoiceDefinition = runeforgePackage
          ? {
              ...choiceDefinition,
              description: `${choiceDefinition.description} ${runeforgePackage.descriptionLine}`.trim(),
              effects: [
                ...choiceDefinition.effects.map((effect: RewardChoiceEffect) => cloneEffect(effect)),
                ...runeforgePackage.effects.map((effect: RewardChoiceEffect) => cloneEffect(effect)),
              ],
            }
          : choiceDefinition;
        const builtChoice = buildChoice("quest", augmentedChoiceDefinition);
        if (resolvedContent) {
          const slotLabels = (getItemLoadoutApi().EQUIPMENT_SLOT_LABELS || {}) as Record<string, string>;
          const gearPreviewLines = augmentedChoiceDefinition.effects.map((effect: RewardChoiceEffect) => {
            if (effect.kind === "equip_item") {
              return `Equip ${getItemCatalogApi().getItemDefinition(resolvedContent, effect.itemId || "")?.name || effect.itemId || "item"}.`;
            }
            if (effect.kind === "grant_item") {
              return `Carry ${getItemCatalogApi().getItemDefinition(resolvedContent, effect.itemId || "")?.name || effect.itemId || "item"}.`;
            }
            if (effect.kind === "grant_rune") {
              return `Carry ${getItemCatalogApi().getRuneDefinition(resolvedContent, effect.runeId || "")?.name || effect.runeId || "rune"}.`;
            }
            if (effect.kind === "add_socket") {
              return `Add 1 socket to ${slotLabels[effect.slot || ""] || effect.slot || "gear"}.`;
            }
            if (effect.kind === "socket_rune") {
              return `Socket ${getItemCatalogApi().getRuneDefinition(resolvedContent, effect.runeId || "")?.name || effect.runeId || "rune"} into ${slotLabels[effect.slot || ""] || effect.slot || "gear"}.`;
            }
            return "";
          }).filter(Boolean);
          builtChoice.previewLines = [...(builtChoice.previewLines || []).filter(Boolean), ...gearPreviewLines];
        }
        return builtChoice;
      }),
      extraLines: runeforgePackage ? [runeforgePackage.summaryLine] : [],
    };
  }

  function buildNodeReward(run: RunState, zone: ZoneState, definition: { title: string; summary: string; grants: RewardGrants }, variant: WorldNodeRewardDefinition, choiceKind: string, contextLines: string[]) {
    return {
      zoneId: zone.id,
      zoneTitle: zone.title,
      kind: zone.kind,
      title: variant.title || definition.title,
      lines: [
        definition.summary,
        ...contextLines,
        variant.summary,
        `${zone.title} is now clear.`,
      ],
      grants: { ...definition.grants, ...(variant.grants || {}) },
      choices: variant.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => buildChoice(choiceKind, choiceDefinition)),
      encounterNumber: 1,
      clearsZone: true,
      endsAct: false,
      endsRun: false,
      heroLifeAfterFight: run.hero.currentLife,
      mercenaryLifeAfterFight: run.mercenary.currentLife,
    };
  }

  const opportunityResolvers = {
    shrine_opportunity(run: RunState, actNumber: number) {
      const { shrineOpportunityDefinition, shrineRecord, variant } =
        getWorldNodeVariantsApi().resolveShrineOpportunityVariant(run, actNumber);
      return {
        definition: shrineOpportunityDefinition,
        variant,
        contextLines: [`Earlier shrine result: ${shrineRecord.outcomeTitle}.`],
      };
    },
    crossroad_opportunity(run: RunState, actNumber: number) {
      const { crossroadOpportunityDefinition, questRecord, shrineRecord, variant } =
        getWorldNodeVariantsApi().resolveCrossroadOpportunityVariant(run, actNumber);
      return {
        definition: crossroadOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine result: ${shrineRecord.outcomeTitle}.`,
        ],
      };
    },
    reserve_opportunity(run: RunState, actNumber: number) {
      const { reserveOpportunityDefinition, opportunityRecord, shrineOpportunityRecord, crossroadOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveReserveOpportunityVariant(run, actNumber);
      return {
        definition: reserveOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier route lane: ${opportunityRecord.outcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    relay_opportunity(run: RunState, actNumber: number) {
      const { relayOpportunityDefinition, reserveOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveRelayOpportunityVariant(run, actNumber);
      return {
        definition: relayOpportunityDefinition,
        variant,
        contextLines: [`Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`],
      };
    },
    culmination_opportunity(run: RunState, actNumber: number) {
      const { culminationOpportunityDefinition, questRecord, relayOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveCulminationOpportunityVariant(run, actNumber);
      return {
        definition: culminationOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier relay lane: ${relayOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    legacy_opportunity(run: RunState, actNumber: number) {
      const { legacyOpportunityDefinition, questRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveLegacyOpportunityVariant(run, actNumber);
      return {
        definition: legacyOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    reckoning_opportunity(run: RunState, actNumber: number) {
      const { reckoningOpportunityDefinition, questRecord, reserveOpportunityRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveReckoningOpportunityVariant(run, actNumber);
      return {
        definition: reckoningOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier reserve lane: ${reserveOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    recovery_opportunity(run: RunState, actNumber: number) {
      const { recoveryOpportunityDefinition, questRecord, shrineOpportunityRecord, culminationOpportunityRecord, variant } =
        getWorldNodeVariantsApi().resolveRecoveryOpportunityVariant(run, actNumber);
      return {
        definition: recoveryOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    accord_opportunity(run: RunState, actNumber: number) {
      const {
        accordOpportunityDefinition,
        questRecord,
        shrineOpportunityRecord,
        crossroadOpportunityRecord,
        culminationOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveAccordOpportunityVariant(run, actNumber);
      return {
        definition: accordOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier shrine lane: ${shrineOpportunityRecord.outcomeTitle}.`,
          `Earlier crossroad: ${crossroadOpportunityRecord.outcomeTitle}.`,
          `Earlier culmination lane: ${culminationOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    covenant_opportunity(run: RunState, actNumber: number) {
      const {
        covenantOpportunityDefinition,
        questRecord,
        legacyOpportunityRecord,
        reckoningOpportunityRecord,
        recoveryOpportunityRecord,
        accordOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveCovenantOpportunityVariant(run, actNumber);
      return {
        definition: covenantOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    detour_opportunity(run: RunState, actNumber: number) {
      const {
        accordOpportunityRecord,
        covenantOpportunityRecord,
        detourOpportunityDefinition,
        questRecord,
        recoveryOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveDetourOpportunityVariant(run, actNumber);
      return {
        definition: detourOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier recovery lane: ${recoveryOpportunityRecord.outcomeTitle}.`,
          `Earlier accord lane: ${accordOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
    escalation_opportunity(run: RunState, actNumber: number) {
      const {
        covenantOpportunityRecord,
        escalationOpportunityDefinition,
        legacyOpportunityRecord,
        questRecord,
        reckoningOpportunityRecord,
        variant,
      } = getWorldNodeVariantsApi().resolveEscalationOpportunityVariant(run, actNumber);
      return {
        definition: escalationOpportunityDefinition,
        variant,
        contextLines: [
          `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
          `Earlier legacy lane: ${legacyOpportunityRecord.outcomeTitle}.`,
          `Earlier reckoning lane: ${reckoningOpportunityRecord.outcomeTitle}.`,
          `Earlier covenant lane: ${covenantOpportunityRecord.outcomeTitle}.`,
        ],
      };
    },
  };

  function buildZoneReward({ run, zone, content = null }: { run: RunState; zone: ZoneState; content?: GameContent | null }) {
    const actNumber = zone?.actNumber || run?.actNumber || 1;

    if (zone.kind === ZONE_KIND.QUEST) {
      const definition = getQuestDefinition(actNumber);
      const { choices, extraLines } = buildQuestChoices(run, zone, actNumber, definition, content);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          ...extraLines,
          "This node resolves immediately and clears the route once you choose an outcome.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices,
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === ZONE_KIND.SHRINE) {
      const definition = getShrineDefinition(actNumber);
      return {
        zoneId: zone.id,
        zoneTitle: zone.title,
        kind: zone.kind,
        title: definition.title,
        lines: [
          definition.summary,
          "Shrines resolve immediately and apply their blessing through the normal reward seam.",
          `${zone.title} is now clear.`,
        ],
        grants: { ...definition.grants },
        choices: definition.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => buildChoice("shrine", choiceDefinition)),
        encounterNumber: 1,
        clearsZone: true,
        endsAct: false,
        endsRun: false,
        heroLifeAfterFight: run.hero.currentLife,
        mercenaryLifeAfterFight: run.mercenary.currentLife,
      };
    }

    if (zone.kind === ZONE_KIND.EVENT) {
      const { eventDefinition, questRecord, followUp } = getWorldNodeVariantsApi().resolveEventFollowUp(run, actNumber);
      return buildNodeReward(run, zone, eventDefinition, followUp, "event", [
        `Earlier quest result: ${questRecord.outcomeTitle}.`,
      ]);
    }

    if (zone.kind === ZONE_KIND.OPPORTUNITY) {
      const resolver = (opportunityResolvers as Record<string, (typeof opportunityResolvers)[keyof typeof opportunityResolvers]>)[zone.nodeType as string];
      if (resolver) {
        const { definition, variant, contextLines } = resolver(run, actNumber);
        return buildNodeReward(run, zone, definition, variant, "opportunity", contextLines);
      }
    }

    const { opportunityDefinition, questRecord, variant } =
      getWorldNodeVariantsApi().resolveOpportunityVariant(run, actNumber);
    return buildNodeReward(run, zone, opportunityDefinition, variant, "opportunity", [
      `Earlier chain: ${questRecord.outcomeTitle} -> ${questRecord.followUpOutcomeTitle}.`,
    ]);
  }

  function applyChoice(run: RunState, reward: RunReward, choice: RewardChoice) {
    if (!runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES) {
      return { ok: false, message: "World-node outcome helper is unavailable." };
    }
    return runtimeWindow.ROUGE_WORLD_NODE_OUTCOMES.applyChoice(run, reward, choice, {
      isShrineOpportunityNodeId,
    });
  }

  assertValidCatalog();
  const worldNodeZones = getWorldNodeZonesApi();

  runtimeWindow.ROUGE_WORLD_NODES = {
    getCatalog,
    assertValidCatalog,
    createQuestZone: worldNodeZones.createQuestZone,
    createShrineZone: worldNodeZones.createShrineZone,
    createEventZone: worldNodeZones.createEventZone,
    createOpportunityZone: worldNodeZones.createOpportunityZone,
    createCrossroadOpportunityZone: worldNodeZones.createCrossroadOpportunityZone,
    createShrineOpportunityZone: worldNodeZones.createShrineOpportunityZone,
    createReserveOpportunityZone: worldNodeZones.createReserveOpportunityZone,
    createRelayOpportunityZone: worldNodeZones.createRelayOpportunityZone,
    createCulminationOpportunityZone: worldNodeZones.createCulminationOpportunityZone,
    createLegacyOpportunityZone: worldNodeZones.createLegacyOpportunityZone,
    createReckoningOpportunityZone: worldNodeZones.createReckoningOpportunityZone,
    createRecoveryOpportunityZone: worldNodeZones.createRecoveryOpportunityZone,
    createAccordOpportunityZone: worldNodeZones.createAccordOpportunityZone,
    createCovenantOpportunityZone: worldNodeZones.createCovenantOpportunityZone,
    createDetourOpportunityZone: worldNodeZones.createDetourOpportunityZone,
    createEscalationOpportunityZone: worldNodeZones.createEscalationOpportunityZone,
    createActWorldNodes: worldNodeZones.createActWorldNodes,
    isWorldNodeZone: worldNodeZones.isWorldNodeZone,
    buildZoneReward,
    applyChoice,
  };
})();
