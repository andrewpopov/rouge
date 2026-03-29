(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

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

  function buildChoice(kind: string, choiceDefinition: WorldNodeChoiceDefinition) {
    return getWorldNodeZonesApi().buildChoice(kind, choiceDefinition);
  }

  function getStrategicWeaponFamilies(run: RunState, content: GameContent) {
    const classPreferredFamilies = runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [];
    return runtimeWindow.ROUGE_REWARD_ENGINE?.getStrategicWeaponFamilies?.(run, content) || classPreferredFamilies;
  }

  const CHOICE_STRATEGY_LABELS = {
    reinforce: "Reinforce Current Build",
    support: "Support Current Build",
    pivot: "Flexible Pivot",
  } as const;

  const CHOICE_STRATEGY_SORT_ORDER = {
    reinforce: 0,
    support: 1,
    pivot: 2,
  } as const;

  const CARD_STRATEGY_WEIGHTS = {
    engine: 12,
    foundation: 9,
    support: 7,
    tech: 6,
  } as const;

  function cloneEffect(effect: RewardChoiceEffect): RewardChoiceEffect {
    return {
      ...effect,
      ...(Array.isArray(effect?.flagIds) ? { flagIds: [...effect.flagIds] } : {}),
      ...(effect?.rarityBonuses ? { rarityBonuses: { ...effect.rarityBonuses } } : {}),
      ...(effect?.weaponAffixes ? { weaponAffixes: runtimeWindow.ROUGE_ITEM_CATALOG?.cloneWeaponProfile?.(effect.weaponAffixes) || effect.weaponAffixes } : {}),
      ...(effect?.armorAffixes ? { armorAffixes: runtimeWindow.ROUGE_ITEM_CATALOG?.cloneArmorProfile?.(effect.armorAffixes) || effect.armorAffixes } : {}),
    };
  }

  function getChoiceStrategyContext(run: RunState, content: GameContent | null) {
    const resolvedContent = getGameContent(content);
    const dominantArchetype = resolvedContent
      ? runtimeWindow.ROUGE_REWARD_ENGINE?.getDominantArchetype?.(run, resolvedContent) || { primary: null, secondary: null }
      : { primary: null, secondary: null };
    return {
      primary: dominantArchetype.primary || null,
      secondary: dominantArchetype.secondary || null,
      strategicWeaponFamilies: resolvedContent ? getStrategicWeaponFamilies(run, resolvedContent) : [],
      preferredWeaponFamilies: runtimeWindow.ROUGE_CLASS_REGISTRY?.getPreferredWeaponFamilies?.(run.classId) || [],
    };
  }

  function classifyChoiceStrategy(
    effects: RewardChoiceEffect[],
    run: RunState,
    content: GameContent | null = null
  ): {
    role: RewardChoice["strategyRole"];
    score: number;
    archetypeId: string;
    archetypeLabel: string;
    previewLine: string;
  } {
    const resolvedContent = getGameContent(content);
    const itemCatalog = resolvedContent ? getItemCatalogApi() : null;
    const rewardEngine = runtimeWindow.ROUGE_REWARD_ENGINE || null;
    const context = getChoiceStrategyContext(run, resolvedContent);
    const scores = {
      reinforce: 0,
      support: 0,
      pivot: 0,
    };

    effects.forEach((effect: RewardChoiceEffect) => {
      const value = Number(effect.value || 0);
      if ((effect.kind === "add_card" || effect.kind === "upgrade_card") && resolvedContent && rewardEngine) {
        const cardId = effect.kind === "add_card" ? effect.cardId || "" : effect.toCardId || effect.fromCardId || "";
        const archetypeTags = rewardEngine.getCardArchetypeTags?.(cardId, resolvedContent) || [];
        const rewardRole = rewardEngine.getCardRewardRole?.(cardId, resolvedContent) || "foundation";
        const baseWeight = CARD_STRATEGY_WEIGHTS[rewardRole] || CARD_STRATEGY_WEIGHTS.foundation;
        if (context.primary?.archetypeId && archetypeTags.includes(context.primary.archetypeId)) {
          scores.reinforce += baseWeight;
          if (rewardRole === "support" || rewardRole === "tech") {
            scores.support += 2;
          }
          return;
        }
        if (context.secondary?.archetypeId && archetypeTags.includes(context.secondary.archetypeId)) {
          scores.support += Math.max(4, baseWeight - 2);
          return;
        }
        if (archetypeTags.length > 0) {
          scores.pivot += Math.max(4, baseWeight - 3);
          return;
        }
      }

      if ((effect.kind === "equip_item" || effect.kind === "grant_item") && resolvedContent && itemCatalog) {
        const item = itemCatalog.getItemDefinition(resolvedContent, effect.itemId || "");
        const family = item?.family || "";
        if (item?.slot === "weapon") {
          if (context.strategicWeaponFamilies.includes(family)) {
            scores.reinforce += 12;
          } else if (context.preferredWeaponFamilies.includes(family)) {
            scores.support += 7;
          } else {
            scores.pivot += 8;
          }
          return;
        }
        if (item?.slot === "armor") {
          scores.support += 8;
          return;
        }
        scores.support += 6;
        return;
      }

      if (effect.kind === "socket_rune") {
        if (effect.slot === "weapon") {
          scores.reinforce += 7;
        } else {
          scores.support += 6;
        }
        return;
      }

      if (effect.kind === "add_socket") {
        if (effect.slot === "weapon") {
          scores.reinforce += 6;
        } else {
          scores.support += 5;
        }
        return;
      }

      if (effect.kind === "grant_rune") {
        scores.support += 4;
        return;
      }

      if (effect.kind === "reinforce_build") {
        scores.reinforce += 10;
        return;
      }

      if (effect.kind === "support_build") {
        scores.support += 10;
        return;
      }

      if (effect.kind === "pivot_build") {
        scores.pivot += 10;
        return;
      }

      if (effect.kind === "hero_max_energy") {
        scores.support += 4 + value * 2;
        return;
      }

      if (effect.kind === "hero_heal") {
        scores.support += 4 + value;
        return;
      }

      if (effect.kind === "hero_max_life") {
        scores.support += 5 + Math.ceil(value / 2);
        return;
      }

      if (effect.kind === "hero_potion_heal") {
        scores.support += 4 + value;
        return;
      }

      if (effect.kind === "mercenary_attack" || effect.kind === "mercenary_max_life") {
        scores.support += 3 + value;
        return;
      }

      if (effect.kind === "belt_capacity") {
        scores.support += 5 + value;
        return;
      }

      if (effect.kind === "refill_potions") {
        scores.support += 4 + value;
        return;
      }

      if (effect.kind === "gold_bonus") {
        scores.pivot += 4 + Math.ceil(value / 4);
        return;
      }

      if (effect.kind === "class_point") {
        scores.reinforce += 8 + value * 2;
        return;
      }

      if (effect.kind === "attribute_point") {
        scores.reinforce += 5 + value * 2;
      }
    });

    const ranked = (Object.entries(scores) as Array<[RewardChoice["strategyRole"], number]>)
      .sort((left, right) => {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }
        return (CHOICE_STRATEGY_SORT_ORDER[left[0] || "support"] || 0) - (CHOICE_STRATEGY_SORT_ORDER[right[0] || "support"] || 0);
      });

    const role = ranked[0]?.[0] || "support";
    const score = ranked[0]?.[1] || 0;
    const archetypeLabel = context.primary?.label || "";
    const targetLabel = archetypeLabel || "your current build";
    let previewLine = `Strategic role: Keep a flexible pivot open from ${targetLabel}.`;
    if (role === "reinforce") {
      previewLine = `Strategic role: Reinforce ${targetLabel}.`;
    } else if (role === "support") {
      previewLine = `Strategic role: Support ${targetLabel}.`;
    }

    return {
      role,
      score,
      archetypeId: context.primary?.archetypeId || "",
      archetypeLabel,
      previewLine,
    };
  }

  function applyChoiceStrategy(choice: RewardChoice, strategy: ReturnType<typeof classifyChoiceStrategy>) {
    const strategyLabel = CHOICE_STRATEGY_LABELS[strategy.role || "support"];
    choice.strategyRole = strategy.role;
    choice.strategyArchetypeId = strategy.archetypeId;
    choice.strategyArchetypeLabel = strategy.archetypeLabel;
    choice.subtitle = choice.subtitle ? `${choice.subtitle} | ${strategyLabel}` : strategyLabel;
    choice.previewLines = [strategy.previewLine, ...(choice.previewLines || []).filter(Boolean)];
    return choice;
  }

  function sortStrategicChoices<T extends { choice: RewardChoice; strategy: ReturnType<typeof classifyChoiceStrategy> }>(choices: T[]) {
    return [...choices].sort((left, right) => {
      const leftOrder = CHOICE_STRATEGY_SORT_ORDER[left.strategy.role || "support"] || 0;
      const rightOrder = CHOICE_STRATEGY_SORT_ORDER[right.strategy.role || "support"] || 0;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      if (right.strategy.score !== left.strategy.score) {
        return right.strategy.score - left.strategy.score;
      }
      return left.choice.title.localeCompare(right.choice.title);
    });
  }

  function buildStrategicChoices(
    kind: string,
    choiceDefinitions: WorldNodeChoiceDefinition[],
    run: RunState,
    content: GameContent | null = null
  ) {
    function resolveDynamicBuildPreview(effect: RewardChoiceEffect) {
      if (!content) {
        return "";
      }
      if (effect.kind === "reinforce_build") {
        return runtimeWindow.ROUGE_REWARD_ENGINE?.resolveReinforceBuildReward?.(run, content)?.previewLine || "Build reinforcement: Gain 1 class point.";
      }
      if (effect.kind === "support_build") {
        return runtimeWindow.ROUGE_REWARD_ENGINE?.resolveSupportBuildReward?.(run, content)?.previewLine || "Build support: Gain 3 max Life.";
      }
      if (effect.kind === "pivot_build") {
        return runtimeWindow.ROUGE_REWARD_ENGINE?.resolvePivotBuildReward?.(run, content)?.previewLine || "Strategic pivot: Gain 1 class point.";
      }
      return "";
    }

    return sortStrategicChoices(
      choiceDefinitions.map((choiceDefinition: WorldNodeChoiceDefinition) => {
        const choice = buildChoice(kind, choiceDefinition);
        if (content) {
          const reinforcePreviewLines = choiceDefinition.effects
            .map((effect: RewardChoiceEffect) => resolveDynamicBuildPreview(effect))
            .filter(Boolean);
          choice.previewLines = [...(choice.previewLines || []).filter(Boolean), ...reinforcePreviewLines];
        }
        const strategy = classifyChoiceStrategy(choiceDefinition.effects, run, content);
        return {
          choice: applyChoiceStrategy(choice, strategy),
          strategy,
        };
      })
    ).map((entry) => entry.choice);
  }

  function buildQuestChoices(run: RunState, zone: ZoneState, actNumber: number, definition: QuestNodeDefinition, content: GameContent | null = null) {
    const runeforgePackage = runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_RUNEFORGE.buildQuestRuneforgePackage(run, zone, actNumber, content);
    const resolvedContent = getGameContent(content);
    const dominantArchetype = resolvedContent
      ? runtimeWindow.ROUGE_REWARD_ENGINE?.getDominantArchetype?.(run, resolvedContent)?.primary || null
      : null;
    return {
      choices: sortStrategicChoices(definition.choices.map((choiceDefinition: WorldNodeChoiceDefinition) => {
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
        const strategy = classifyChoiceStrategy(choiceDefinition.effects, run, resolvedContent);
        if (resolvedContent) {
          const slotLabels = (getItemLoadoutApi().EQUIPMENT_SLOT_LABELS || {}) as Record<string, string>;
          const gearPreviewLines = augmentedChoiceDefinition.effects.map((effect: RewardChoiceEffect) => {
            if (effect.kind === "reinforce_build") {
              return runtimeWindow.ROUGE_REWARD_ENGINE?.resolveReinforceBuildReward?.(run, resolvedContent)?.previewLine || "Build reinforcement: Gain 1 class point.";
            }
            if (effect.kind === "support_build") {
              return runtimeWindow.ROUGE_REWARD_ENGINE?.resolveSupportBuildReward?.(run, resolvedContent)?.previewLine || "Build support: Gain 3 max Life.";
            }
            if (effect.kind === "pivot_build") {
              return runtimeWindow.ROUGE_REWARD_ENGINE?.resolvePivotBuildReward?.(run, resolvedContent)?.previewLine || "Strategic pivot: Gain 1 class point.";
            }
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
        return {
          choice: applyChoiceStrategy(builtChoice, strategy),
          strategy,
        };
      })).map((entry) => entry.choice),
      extraLines: [
        ...(dominantArchetype ? [`Current build lane: ${dominantArchetype.label}.`] : []),
        ...(runeforgePackage ? [runeforgePackage.summaryLine] : []),
      ],
    };
  }

  runtimeWindow.__ROUGE_WORLD_NODE_ENGINE_CHOICE_STRATEGY = {
    buildStrategicChoices,
    buildQuestChoices,
  };
})();
