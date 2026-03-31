(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;
  const sharedApi = registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SHARED as {
    createActionRandom(run: RunState, actionId: string): RandomFn;
    pickRandomValue<T>(candidates: T[], randomFn: RandomFn): T | null;
    listGamblerCardIds(content: GameContent, predicate: (card: CardDefinition) => boolean): string[];
  };

  const GAMBLER_TIERS = {
    bronze: { id: "bronze", label: "Bronze", minCost: 60, maxCost: 80, minAct: 1 },
    silver: { id: "silver", label: "Silver", minCost: 120, maxCost: 160, minAct: 1 },
    gold: { id: "gold", label: "Gold", minCost: 200, maxCost: 280, minAct: 3 },
  };

  function getGamblerCost(tierId: string, actNumber: number): number {
    const tier = GAMBLER_TIERS[tierId as keyof typeof GAMBLER_TIERS];
    if (!tier) {
      return 0;
    }
    const scale = 1 + (actNumber - 1) * 0.1;
    return Math.round((tier.minCost + tier.maxCost) / 2 * scale);
  }

  function grantGamblerRefund(run: RunState, refund: number, message: string): ActionResult {
    run.gold += refund;
    return { ok: true, message };
  }

  function grantGamblerCard(
    run: RunState,
    content: GameContent,
    candidateCardIds: string[],
    randomFn: RandomFn,
    buildSuccessMessage: (cardTitle: string, cardId: string) => string,
    buildFallbackResult: () => ActionResult
  ): ActionResult | null {
    if (candidateCardIds.length === 0) {
      return null;
    }

    const cardId = sharedApi.pickRandomValue(candidateCardIds, randomFn);
    if (!cardId) {
      return buildFallbackResult();
    }

    run.deck.push(cardId);
    const card = content.cardCatalog[cardId];
    return { ok: true, message: buildSuccessMessage(card?.title || cardId, cardId) };
  }

  function buildGamblerActions(run: RunState): TownAction[] {
    const actions: TownAction[] = [];

    for (const tier of Object.values(GAMBLER_TIERS)) {
      if (run.actNumber < tier.minAct) {
        continue;
      }
      const cost = getGamblerCost(tier.id, run.actNumber);
      const affordable = run.gold >= cost;

      const tierDescriptions: Record<string, string> = {
        bronze: "A random neutral card, a piece of tier-1 equipment, or a small gold refund.",
        silver: "A random class card, tier-2 equipment, or a rune.",
        gold: "A random rare class card, tier-3+ equipment, or a premium rune.",
      };

      actions.push({
        id: `gambler_mystery_${tier.id}`,
        category: "gambler",
        title: `${tier.label} Mystery`,
        subtitle: "Gamble",
        description: `Pay ${cost} gold for a mystery purchase. ${tierDescriptions[tier.id] || ""}`,
        previewLines: [
          `Face-down purchase: ${cost} gold.`,
          tierDescriptions[tier.id] || "",
          "Results are revealed after payment.",
        ],
        cost,
        actionLabel: "Gamble",
        disabled: !affordable,
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: "gambler_unavailable",
        category: "gambler",
        title: "Gambler Unavailable",
        subtitle: "Gamble",
        description: "The gambler has nothing to offer at this time.",
        previewLines: ["Come back later."],
        cost: 0,
        actionLabel: "—",
        disabled: true,
      });
    }

    return actions;
  }

  function applyGamblerAction(run: RunState, content: GameContent, actionId: string): ActionResult {
    const tierId = actionId.replace("gambler_mystery_", "");
    const cost = getGamblerCost(tierId, run.actNumber);

    if (run.gold < cost) {
      return { ok: false, message: "Not enough gold for this gamble." };
    }

    run.gold -= cost;
    const randomFn = sharedApi.createActionRandom(run, actionId);
    const roll = randomFn();

    if (tierId === "bronze") {
      const refund = Math.floor(cost * 0.4);
      const buildRefundResult = () => grantGamblerRefund(run, refund, `Gamble reveals: a pouch of ${refund} gold. Better luck next time.`);
      if (roll < 0.5) {
        const result = grantGamblerCard(
          run,
          content,
          sharedApi.listGamblerCardIds(content, (card) => (card.tier || 0) === 1),
          randomFn,
          (cardTitle) => `Gamble reveals: ${cardTitle}! Added to your deck.`,
          buildRefundResult
        );
        if (result) {
          return result;
        }
      }
      return buildRefundResult();
    }

    if (tierId === "silver") {
      const refund = Math.floor(cost * 0.5);
      const buildRefundResult = () => grantGamblerRefund(run, refund, `Gamble reveals: a sack of ${refund} gold.`);
      if (roll < 0.55) {
        const result = grantGamblerCard(
          run,
          content,
          sharedApi.listGamblerCardIds(content, (card) => (card.tier || 0) === 2),
          randomFn,
          (cardTitle) => `Gamble reveals: ${cardTitle}! Added to your deck.`,
          buildRefundResult
        );
        if (result) {
          return result;
        }
      }
      if (roll < 0.75) {
        return buildRefundResult();
      }
      const result = grantGamblerCard(
        run,
        content,
        sharedApi.listGamblerCardIds(content, (card) => (card.tier || 0) === 1),
        randomFn,
        (cardTitle) => `Gamble reveals: ${cardTitle}. Not quite what you hoped for.`,
        () => ({ ok: true, message: "Gamble reveals: dust. The gambler shrugs." })
      );
      if (result) {
        return result;
      }
      return { ok: true, message: "Gamble reveals: dust. The gambler shrugs." };
    }

    if (tierId === "gold") {
      const refund = Math.floor(cost * 0.35);
      const buildRefundResult = () => grantGamblerRefund(run, refund, `Gamble reveals: ${refund} gold and an empty box. The gambler smirks.`);
      if (roll < 0.4) {
        const result = grantGamblerCard(
          run,
          content,
          sharedApi.listGamblerCardIds(content, (card) => (card.tier || 0) >= 3),
          randomFn,
          (cardTitle) => `Gamble reveals: ${cardTitle}! A rare find. Added to your deck.`,
          buildRefundResult
        );
        if (result) {
          return result;
        }
      }
      if (roll < 0.65) {
        const result = grantGamblerCard(
          run,
          content,
          sharedApi.listGamblerCardIds(content, (card) => (card.tier || 0) === 2),
          randomFn,
          (cardTitle) => `Gamble reveals: ${cardTitle}. Added to your deck.`,
          buildRefundResult
        );
        if (result) {
          return result;
        }
      }
      return buildRefundResult();
    }

    return { ok: false, message: "Unknown gamble tier." };
  }

  registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_GAMBLER = {
    buildGamblerActions,
    applyGamblerAction,
  };
})();
