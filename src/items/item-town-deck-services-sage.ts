(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const {
    getCardTree,
    getSagePurgeCost,
    getSageTransformCost,
    listEvolvableCards,
  } = runtimeWindow.__ROUGE_SKILL_EVOLUTION;
  const sharedApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SHARED as {
    createActionRandom(run: RunState, actionId: string): RandomFn;
    pickRandomValue<T>(candidates: T[], randomFn: RandomFn): T | null;
    getCardClassId(cardId: string, content: GameContent, card?: CardDefinition | null): string;
    getCardRewardRole(cardId: string, content: GameContent): CardRewardRole;
  };

  function listSageTransformCandidates(cardId: string, content: GameContent): string[] {
    const sourceCard = content.cardCatalog[cardId];
    if (!sourceCard) {
      return [];
    }

    const sourceTier = sourceCard.tier || 1;
    const sourceTree = getCardTree(cardId);
    const sourceRole = sharedApi.getCardRewardRole(cardId, content);
    const sourceClassId = sharedApi.getCardClassId(cardId, content, sourceCard);

    const candidates = Object.values(content.cardCatalog)
      .filter((card) => (card.tier || 1) === sourceTier && card.id !== cardId && !card.id.endsWith("_plus"));

    const sameClass = candidates.filter((card) => sharedApi.getCardClassId(card.id, content, card) === sourceClassId);
    const sameTreeAndRole = sameClass.filter((card) => getCardTree(card.id) === sourceTree && sharedApi.getCardRewardRole(card.id, content) === sourceRole);
    if (sameTreeAndRole.length > 0) {
      return sameTreeAndRole.map((card) => card.id);
    }

    const sameTree = sameClass.filter((card) => getCardTree(card.id) === sourceTree);
    if (sameTree.length > 0) {
      return sameTree.map((card) => card.id);
    }

    const sameRole = sameClass.filter((card) => sharedApi.getCardRewardRole(card.id, content) === sourceRole);
    if (sameRole.length > 0) {
      return sameRole.map((card) => card.id);
    }

    if (sameClass.length > 0) {
      return sameClass.map((card) => card.id);
    }

    return candidates
      .filter((card) => sharedApi.getCardRewardRole(card.id, content) === sourceRole)
      .map((card) => card.id);
  }

  function getSagePurgeCount(run: RunState): number {
    return run.town.sagePurgeCount || 0;
  }

  function buildSageActions(run: RunState, content: GameContent): TownAction[] {
    const actions: TownAction[] = [];
    const purgeCount = getSagePurgeCount(run);
    const purgeCost = getSagePurgeCost(purgeCount);
    const transformCost = getSageTransformCost();

    const seen = new Set<string>();
    let hasPurgeable = false;
    for (const cardId of run.deck) {
      if (seen.has(cardId)) {
        continue;
      }
      seen.add(cardId);
      const card = content.cardCatalog[cardId];
      if (!card || run.deck.length <= 5) {
        continue;
      }
      hasPurgeable = true;
      const affordable = run.gold >= purgeCost;
      actions.push({
        id: `sage_purge_${cardId}`,
        category: "sage",
        title: `Remove ${card.title}`,
        subtitle: "Purge",
        description: `Permanently remove one copy of ${card.title} from your deck. Deck size: ${run.deck.length} \u2192 ${run.deck.length - 1}.`,
        previewLines: [
          `${card.text}`,
          `Purge cost: ${purgeCost} gold (${purgeCount > 0 ? `purge #${purgeCount + 1}` : "first purge"}).`,
          `Deck: ${run.deck.filter((id) => id === cardId).length} copies in deck.`,
        ],
        cost: purgeCost,
        actionLabel: "Purge",
        disabled: !affordable,
      });
    }

    if (!hasPurgeable) {
      actions.push({
        id: "sage_purge_none",
        category: "sage",
        title: "Deck Too Small",
        subtitle: "Purge",
        description: "Your deck is at the minimum size. No cards can be removed.",
        previewLines: [`Deck size: ${run.deck.length}. Minimum: 5.`],
        cost: 0,
        actionLabel: "—",
        disabled: true,
      });
    }

    const seenTransform = new Set<string>();
    for (const cardId of run.deck) {
      if (seenTransform.has(cardId)) {
        continue;
      }
      seenTransform.add(cardId);
      const card = content.cardCatalog[cardId];
      if (!card) {
        continue;
      }
      const transformCandidates = listSageTransformCandidates(cardId, content);
      if (transformCandidates.length === 0) {
        continue;
      }
      const affordable = run.gold >= transformCost;
      actions.push({
        id: `sage_transform_${cardId}`,
        category: "sage",
        title: `Transform ${card.title}`,
        subtitle: "Transform",
        description: `Replace ${card.title} with a constrained same-tier alternative. The sage favors role and lane coherence over chaos.`,
        previewLines: [
          `Current: ${card.text}`,
          `Tier ${card.tier || 1}. Transform cost: ${transformCost} gold.`,
          `Candidate pool: ${transformCandidates.length} coherent option${transformCandidates.length === 1 ? "" : "s"}.`,
        ],
        cost: transformCost,
        actionLabel: "Transform",
        disabled: !affordable,
      });
    }

    const evolvable = listEvolvableCards(run);
    const identifyLines = evolvable.length > 0
      ? evolvable.map((entry: { cardId: string; targetId: string; cost: number }) => {
          const src = content.cardCatalog[entry.cardId];
          const tgt = content.cardCatalog[entry.targetId];
          return `${src?.title || entry.cardId} \u2192 ${tgt?.title || entry.targetId} (${entry.cost}g)`;
        })
      : ["No evolution paths available yet."];

    actions.unshift({
      id: "sage_identify",
      category: "sage",
      title: "Identify Evolution Paths",
      subtitle: "Consult",
      description: "The camp sage reveals which cards in your deck can be evolved at the blacksmith.",
      previewLines: identifyLines,
      cost: 0,
      actionLabel: "Identify",
      disabled: false,
    });

    return actions;
  }

  function applySageAction(run: RunState, content: GameContent, actionId: string): ActionResult {
    if (actionId === "sage_identify") {
      return { ok: true, message: "The camp sage examines your deck and reveals the evolution paths." };
    }

    if (actionId.startsWith("sage_purge_")) {
      const cardId = actionId.replace("sage_purge_", "");
      const purgeCount = getSagePurgeCount(run);
      const cost = getSagePurgeCost(purgeCount);

      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for this purge." };
      }
      if (run.deck.length <= 5) {
        return { ok: false, message: "Deck is at minimum size." };
      }
      const deckIndex = run.deck.indexOf(cardId);
      if (deckIndex < 0) {
        return { ok: false, message: "Card not found in deck." };
      }

      run.gold -= cost;
      run.deck.splice(deckIndex, 1);
      run.town.sagePurgeCount = purgeCount + 1;

      const card = content.cardCatalog[cardId];
      return { ok: true, message: `${card?.title || cardId} removed from deck. Deck size: ${run.deck.length}.` };
    }

    if (actionId.startsWith("sage_transform_")) {
      const cardId = actionId.replace("sage_transform_", "");
      const cost = getSageTransformCost();

      if (run.gold < cost) {
        return { ok: false, message: "Not enough gold for this transform." };
      }
      const deckIndex = run.deck.indexOf(cardId);
      if (deckIndex < 0) {
        return { ok: false, message: "Card not found in deck." };
      }

      const sourceCard = content.cardCatalog[cardId];
      const candidates = listSageTransformCandidates(cardId, content);
      if (candidates.length === 0) {
        return { ok: false, message: "No transform candidates available for this tier." };
      }

      run.gold -= cost;
      const randomFn = sharedApi.createActionRandom(run, actionId);
      const newCardId = sharedApi.pickRandomValue(candidates, randomFn);
      if (!newCardId) {
        return { ok: false, message: "No transform candidates available for this tier." };
      }
      run.deck[deckIndex] = newCardId;

      const newCard = content.cardCatalog[newCardId];
      return {
        ok: true,
        message: `${sourceCard?.title || cardId} transformed into ${newCard?.title || newCardId}.`,
      };
    }

    return { ok: false, message: "Unknown sage action." };
  }

  registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SAGE = {
    buildSageActions,
    applySageAction,
  };
})();
