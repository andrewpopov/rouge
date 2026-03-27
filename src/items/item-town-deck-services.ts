(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    getCardTree,
    getEvolution,
    getEvolutionCost,
    getSagePurgeCost,
    getSageTransformCost,
    listEvolvableCards,
  } = runtimeWindow.__ROUGE_SKILL_EVOLUTION;

  function hashString(value: string) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function getRunSeed(run: RunState) {
    const parsed = Number(run?.seed);
    if (Number.isFinite(parsed)) {
      const normalized = parsed >>> 0;
      if (normalized > 0) {
        return normalized;
      }
    }
    return hashString([run?.id || "run", run?.classId || "class"].join("|")) || 1;
  }

  function createActionRandom(run: RunState, actionId: string): RandomFn {
    const deckSignature = Array.isArray(run?.deck) ? run.deck.join("|") : "";
    let state = hashString([
      String(getRunSeed(run)),
      actionId,
      String(run?.actNumber || 1),
      String(run?.gold || 0),
      String(run?.town?.sagePurgeCount || 0),
      String(run?.summary?.encountersCleared || 0),
      deckSignature,
    ].join("|")) || 1;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  function pickRandomValue<T>(candidates: T[], randomFn: RandomFn): T | null {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return null;
    }
    const index = Math.floor(randomFn() * candidates.length);
    return candidates[Math.max(0, Math.min(candidates.length - 1, index))] || candidates[0] || null;
  }

  // ── Blacksmith: evolution + generic upgrades ──

  function buildBlacksmithActions(run: RunState, content: GameContent): TownAction[] {
    const actions: TownAction[] = [];
    const evolvable = listEvolvableCards(run);

    for (const entry of evolvable) {
      const sourceCard = content.cardCatalog[entry.cardId];
      const targetCard = content.cardCatalog[entry.targetId];
      if (!sourceCard || !targetCard) {
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

    if (actions.length === 0) {
      actions.push({
        id: "blacksmith_no_evolutions",
        category: "blacksmith",
        title: "No Evolutions Available",
        subtitle: "Blacksmith",
        description: "Progress further into skill trees or advance to later acts to unlock card evolutions.",
        previewLines: ["Evolve cards by investing in skill trees."],
        cost: 0,
        actionLabel: "—",
        disabled: true,
      });
    }

    return actions;
  }

  function applyBlacksmithAction(run: RunState, content: GameContent, actionId: string): ActionResult {
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

    // Verify target card exists in the catalog
    if (!content.cardCatalog[evolution.targetId]) {
      return { ok: false, message: "Evolution target card not found." };
    }

    run.gold -= cost;
    run.deck[deckIndex] = evolution.targetId;

    const sourceCard = content.cardCatalog[cardId];
    const targetCard = content.cardCatalog[evolution.targetId];
    const sourceName = sourceCard?.title || cardId;
    const targetName = targetCard?.title || evolution.targetId;

    return { ok: true, message: `${sourceName} evolved into ${targetName}.` };
  }

  // ── Sage (Deckard Cain): purge + transform ──

  function getSagePurgeCount(run: RunState): number {
    return run.town.sagePurgeCount || 0;
  }

  function buildSageActions(run: RunState, content: GameContent): TownAction[] {
    const actions: TownAction[] = [];
    const purgeCount = getSagePurgeCount(run);
    const purgeCost = getSagePurgeCost(purgeCount);
    const transformCost = getSageTransformCost();

    // Purge action for each removable card
    const seen = new Set<string>();
    let hasPurgeable = false;
    for (const cardId of run.deck) {
      if (seen.has(cardId)) {
        continue;
      }
      seen.add(cardId);
      const card = content.cardCatalog[cardId];
      if (!card) {
        continue;
      }
      // Can't purge if deck would go below 5 cards
      if (run.deck.length <= 5) {
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

    // Transform action for each card
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
      const affordable = run.gold >= transformCost;
      actions.push({
        id: `sage_transform_${cardId}`,
        category: "sage",
        title: `Transform ${card.title}`,
        subtitle: "Transform",
        description: `Replace ${card.title} with a random card of the same tier. You might get something better — or worse.`,
        previewLines: [
          `Current: ${card.text}`,
          `Tier ${card.tier || 1}. Transform cost: ${transformCost} gold.`,
        ],
        cost: transformCost,
        actionLabel: "Transform",
        disabled: !affordable,
      });
    }

    // Identify action (free)
    const evolvable = listEvolvableCards(run);
    const identifyLines = evolvable.length > 0
      ? evolvable.map((e: { cardId: string; targetId: string; cost: number }) => {
          const src = content.cardCatalog[e.cardId];
          const tgt = content.cardCatalog[e.targetId];
          return `${src?.title || e.cardId} \u2192 ${tgt?.title || e.targetId} (${e.cost}g)`;
        })
      : ["No evolution paths available yet."];

    actions.unshift({
      id: "sage_identify",
      category: "sage",
      title: "Identify Evolution Paths",
      subtitle: "Consult",
      description: "Deckard Cain reveals which cards in your deck can be evolved at the blacksmith.",
      previewLines: identifyLines,
      cost: 0,
      actionLabel: "Identify",
      disabled: false,
    });

    return actions;
  }

  function applySageAction(run: RunState, content: GameContent, actionId: string): ActionResult {
    if (actionId === "sage_identify") {
      return { ok: true, message: "Cain examines your deck and reveals the evolution paths." };
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
      const sourceTier = sourceCard?.tier || 1;

      // Find all cards of the same tier that aren't the current card
      const candidates = Object.values(content.cardCatalog)
        .filter((card) => (card.tier || 1) === sourceTier && card.id !== cardId)
        .map((card) => card.id);

      if (candidates.length === 0) {
        return { ok: false, message: "No transform candidates available for this tier." };
      }

      run.gold -= cost;
      const randomFn = createActionRandom(run, actionId);
      const newCardId = pickRandomValue(candidates, randomFn);
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

  // ── Gambler: mystery purchases ──

  const GAMBLER_TIERS = {
    bronze: { id: "bronze", label: "Bronze", minCost: 60, maxCost: 80, minAct: 1 },
    silver: { id: "silver", label: "Silver", minCost: 120, maxCost: 160, minAct: 1 },
    gold:   { id: "gold",   label: "Gold",   minCost: 200, maxCost: 280, minAct: 3 },
  };

  function getGamblerCost(tierId: string, actNumber: number): number {
    const tier = GAMBLER_TIERS[tierId as keyof typeof GAMBLER_TIERS];
    if (!tier) {
      return 0;
    }
    // Scale cost slightly by act
    const scale = 1 + (actNumber - 1) * 0.1;
    return Math.round((tier.minCost + tier.maxCost) / 2 * scale);
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
    const randomFn = createActionRandom(run, actionId);

    // Roll outcome: 50% card, 30% gold refund, 20% nothing special
    const roll = randomFn();

    if (tierId === "bronze") {
      if (roll < 0.5) {
        // Random tier-1 card from any class
        const tier1Cards = Object.values(content.cardCatalog)
          .filter((card) => (card.tier || 0) === 1)
          .map((card) => card.id);
        if (tier1Cards.length > 0) {
          const cardId = pickRandomValue(tier1Cards, randomFn);
          if (!cardId) {
            return { ok: true, message: `Gamble reveals: a pouch of ${Math.floor(cost * 0.4)} gold. Better luck next time.` };
          }
          run.deck.push(cardId);
          const card = content.cardCatalog[cardId];
          return { ok: true, message: `Gamble reveals: ${card?.title || cardId}! Added to your deck.` };
        }
      }
      // Gold refund (partial)
      const refund = Math.floor(cost * 0.4);
      run.gold += refund;
      return { ok: true, message: `Gamble reveals: a pouch of ${refund} gold. Better luck next time.` };
    }

    if (tierId === "silver") {
      if (roll < 0.55) {
        // Random tier-2 class card
        const tier2Cards = Object.values(content.cardCatalog)
          .filter((card) => (card.tier || 0) === 2)
          .map((card) => card.id);
        if (tier2Cards.length > 0) {
          const cardId = pickRandomValue(tier2Cards, randomFn);
          if (!cardId) {
            return { ok: true, message: `Gamble reveals: a sack of ${Math.floor(cost * 0.5)} gold.` };
          }
          run.deck.push(cardId);
          const card = content.cardCatalog[cardId];
          return { ok: true, message: `Gamble reveals: ${card?.title || cardId}! Added to your deck.` };
        }
      }
      if (roll < 0.75) {
        // Decent gold refund
        const refund = Math.floor(cost * 0.5);
        run.gold += refund;
        return { ok: true, message: `Gamble reveals: a sack of ${refund} gold.` };
      }
      // Tier-1 card consolation
      const tier1Cards = Object.values(content.cardCatalog)
        .filter((card) => (card.tier || 0) === 1)
        .map((card) => card.id);
      if (tier1Cards.length > 0) {
        const cardId = pickRandomValue(tier1Cards, randomFn);
        if (!cardId) {
          return { ok: true, message: "Gamble reveals: dust. The gambler shrugs." };
        }
        run.deck.push(cardId);
        const card = content.cardCatalog[cardId];
        return { ok: true, message: `Gamble reveals: ${card?.title || cardId}. Not quite what you hoped for.` };
      }
      return { ok: true, message: "Gamble reveals: dust. The gambler shrugs." };
    }

    if (tierId === "gold") {
      if (roll < 0.4) {
        // Random tier-3 or tier-4 card (rare)
        const rareCards = Object.values(content.cardCatalog)
          .filter((card) => (card.tier || 0) >= 3)
          .map((card) => card.id);
        if (rareCards.length > 0) {
          const cardId = pickRandomValue(rareCards, randomFn);
          if (!cardId) {
            const refund = Math.floor(cost * 0.35);
            run.gold += refund;
            return { ok: true, message: `Gamble reveals: ${refund} gold and an empty box. The gambler smirks.` };
          }
          run.deck.push(cardId);
          const card = content.cardCatalog[cardId];
          return { ok: true, message: `Gamble reveals: ${card?.title || cardId}! A rare find. Added to your deck.` };
        }
      }
      if (roll < 0.65) {
        // Tier-2 card
        const tier2Cards = Object.values(content.cardCatalog)
          .filter((card) => (card.tier || 0) === 2)
          .map((card) => card.id);
        if (tier2Cards.length > 0) {
          const cardId = pickRandomValue(tier2Cards, randomFn);
          if (!cardId) {
            const refund = Math.floor(cost * 0.35);
            run.gold += refund;
            return { ok: true, message: `Gamble reveals: ${refund} gold and an empty box. The gambler smirks.` };
          }
          run.deck.push(cardId);
          const card = content.cardCatalog[cardId];
          return { ok: true, message: `Gamble reveals: ${card?.title || cardId}. Added to your deck.` };
        }
      }
      // Gold refund
      const refund = Math.floor(cost * 0.35);
      run.gold += refund;
      return { ok: true, message: `Gamble reveals: ${refund} gold and an empty box. The gambler smirks.` };
    }

    return { ok: false, message: "Unknown gamble tier." };
  }

  // ── Exports ──

  runtimeWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES = {
    buildBlacksmithActions,
    applyBlacksmithAction,
    buildSageActions,
    applySageAction,
    buildGamblerActions,
    applyGamblerAction,
  };
})();
