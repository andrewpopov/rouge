(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const {
    getCardTree,
    getEvolution,
    getEvolutionCost,
    listEvolvableCards,
  } = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
  const sharedApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SHARED as {
    getCardRewardRole(cardId: string, content: GameContent): CardRewardRole;
  };

  function getBlacksmithRefinementCost(cardId: string, content: GameContent): number {
    const card = content.cardCatalog[cardId];
    const role = sharedApi.getCardRewardRole(cardId, content);
    const base = 40 + Math.max(0, (card?.tier || 1) - 1) * 12;
    if (role === "engine") {
      return base + 6;
    }
    if (role === "support" || role === "tech") {
      return Math.max(25, base - 2);
    }
    return base;
  }

  function getBaseCardId(cardId: string) {
    return String(cardId || "").replace(/_plus$/i, "");
  }

  function getDeckCardCopyCount(run: RunState, cardId: string) {
    const baseCardId = getBaseCardId(cardId);
    return (Array.isArray(run.deck) ? run.deck : []).reduce((count: number, deckCardId: string) => {
      return getBaseCardId(deckCardId) === baseCardId ? count + 1 : count;
    }, 0);
  }

  function getReinforcementDuplicateCap(cardId: string, content: GameContent): number {
    const card = content.cardCatalog[cardId];
    const role = sharedApi.getCardRewardRole(cardId, content);
    const roleTag = String(card?.roleTag || "answer");
    const tier = Number(card?.tier || 1);

    if (roleTag === "payoff" && tier >= 4) {
      return 5;
    }
    if (roleTag === "payoff") {
      return 6;
    }
    if (roleTag === "setup" && role === "engine") {
      return 7;
    }
    if (role === "engine") {
      return 6;
    }
    if (role === "support" || role === "tech") {
      return 4;
    }
    return 3;
  }

  function listRefinableCards(run: RunState, content: GameContent): Array<{ cardId: string; targetId: string; cost: number }> {
    const seen = new Set<string>();
    const buildPath = runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES?.getRewardPathPreference?.(run, content) || null;
    const refinable = (Array.isArray(run.deck) ? run.deck : [])
      .filter((cardId: string) => {
        if (seen.has(cardId) || cardId.endsWith("_plus")) {
          return false;
        }
        seen.add(cardId);
        return Boolean(content.cardCatalog[`${cardId}_plus`]);
      })
      .map((cardId: string) => ({
        cardId,
        targetId: `${cardId}_plus`,
        cost: getBlacksmithRefinementCost(cardId, content),
      }));

    return refinable.sort((left, right) => {
      const leftTree = getCardTree(left.cardId);
      const rightTree = getCardTree(right.cardId);
      const leftPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(leftTree)));
      const rightPrimary = Number(Boolean(buildPath?.primaryTrees?.includes(rightTree)));
      if (leftPrimary !== rightPrimary) {
        return rightPrimary - leftPrimary;
      }
      const leftSupport = Number(Boolean(buildPath?.supportTrees?.includes(leftTree)));
      const rightSupport = Number(Boolean(buildPath?.supportTrees?.includes(rightTree)));
      if (leftSupport !== rightSupport) {
        return rightSupport - leftSupport;
      }
      return left.cardId.localeCompare(right.cardId);
    });
  }

  function buildBlacksmithActions(run: RunState, content: GameContent): TownAction[] {
    const actions: TownAction[] = [];
    const evolvable = listEvolvableCards(run);
    const refinable = listRefinableCards(run, content);

    for (const entry of evolvable) {
      const sourceCard = content.cardCatalog[entry.cardId];
      const targetCard = content.cardCatalog[entry.targetId];
      if (!sourceCard || !targetCard) {
        continue;
      }
      const targetDuplicateCap = getReinforcementDuplicateCap(entry.targetId, content);
      const targetDuplicateCount = getDeckCardCopyCount(run, entry.targetId);
      if (targetDuplicateCount >= targetDuplicateCap) {
        continue;
      }
      const tree = getCardTree(entry.cardId);
      const affordable = run.gold >= entry.cost;
      actions.push({
        id: `blacksmith_evolve_${entry.cardId}`,
        category: "blacksmith",
        title: `${sourceCard.title} \u2192 ${targetCard.title}`,
        subtitle: "Evolve",
        description: `Transform ${sourceCard.title} into ${targetCard.title}. The card is replaced in your deck — deck size stays the same.`,
        previewLines: [
          `${targetCard.text}`,
          `Tree: ${tree}. Cost: ${entry.cost} gold.`,
          `Tier ${sourceCard.tier || 1} \u2192 Tier ${targetCard.tier || 1}.`,
        ],
        cost: entry.cost,
        actionLabel: "Evolve",
        disabled: !affordable,
      });
    }

    for (const entry of refinable) {
      const sourceCard = content.cardCatalog[entry.cardId];
      const targetCard = content.cardCatalog[entry.targetId];
      if (!sourceCard || !targetCard) {
        continue;
      }
      const role = sharedApi.getCardRewardRole(entry.cardId, content);
      const affordable = run.gold >= entry.cost;
      actions.push({
        id: `blacksmith_refine_${entry.cardId}`,
        category: "blacksmith",
        title: `${sourceCard.title} \u2192 ${targetCard.title}`,
        subtitle: "Refine",
        description: `Reforge ${sourceCard.title} into a sharper, more reliable version without changing deck size.`,
        previewLines: [
          `${targetCard.text}`,
          `Role: ${runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES?.CARD_ROLE_LABELS?.[role] || role}. Cost: ${entry.cost} gold.`,
          "This is the blacksmith's generic reinforcement path.",
        ],
        cost: entry.cost,
        actionLabel: "Refine",
        disabled: !affordable,
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: "blacksmith_no_forge_work",
        category: "blacksmith",
        title: "No Forge Work Available",
        subtitle: "Blacksmith",
        description: "No evolutions or refinements are available right now. Return after gaining stronger cards or new tree investment.",
        previewLines: ["Forge work opens through evolutions, reward upgrades, and better core cards."],
        cost: 0,
        actionLabel: "—",
        disabled: true,
      });
    }

    return actions;
  }

  function applyBlacksmithAction(run: RunState, content: GameContent, actionId: string): ActionResult {
    if (actionId.startsWith("blacksmith_refine_")) {
      const cardId = actionId.replace("blacksmith_refine_", "");
      const upgradedCardId = `${cardId}_plus`;
      const cost = getBlacksmithRefinementCost(cardId, content);
      const sourceCard = content.cardCatalog[cardId];
      const targetCard = content.cardCatalog[upgradedCardId];

      if (!sourceCard || !targetCard) {
        return { ok: false, message: "No refinement path found for that card." };
      }
      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for this refinement." };
      }

      const deckIndex = run.deck.indexOf(cardId);
      if (deckIndex < 0) {
        return { ok: false, message: "Card is not in your deck." };
      }

      run.gold -= cost;
      run.deck[deckIndex] = upgradedCardId;
      return { ok: true, message: `${sourceCard.title} refined into ${targetCard.title}.` };
    }

    const cardId = actionId.replace("blacksmith_evolve_", "");
    const evolution = getEvolution(cardId);
    if (!evolution) {
      return { ok: false, message: "No evolution path found for that card." };
    }

    const cost = getEvolutionCost(evolution.requiredTier);
    if (run.gold < cost) {
      return { ok: false, message: "Not enough gold for this evolution." };
    }

    const deckIndex = run.deck.indexOf(cardId);
    if (deckIndex < 0) {
      return { ok: false, message: "Card is not in your deck." };
    }

    if (!content.cardCatalog[evolution.targetId]) {
      return { ok: false, message: "Evolution target card not found." };
    }
    if (getDeckCardCopyCount(run, evolution.targetId) >= getReinforcementDuplicateCap(evolution.targetId, content)) {
      return { ok: false, message: "That evolution path is already saturated in your deck." };
    }

    run.gold -= cost;
    run.deck[deckIndex] = evolution.targetId;

    const sourceCard = content.cardCatalog[cardId];
    const targetCard = content.cardCatalog[evolution.targetId];
    const sourceName = sourceCard?.title || cardId;
    const targetName = targetCard?.title || evolution.targetId;

    return { ok: true, message: `${sourceName} evolved into ${targetName}.` };
  }

  registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_BLACKSMITH = {
    buildBlacksmithActions,
    applyBlacksmithAction,
  };
})();
