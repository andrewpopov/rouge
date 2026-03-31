(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const registryWindow = runtimeWindow as Window & Record<string, unknown>;

  function getArchetypes() {
    return runtimeWindow.__ROUGE_REWARD_ENGINE_ARCHETYPES;
  }

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

  function listGamblerCardIds(content: GameContent, predicate: (card: CardDefinition) => boolean): string[] {
    return Object.values(content.cardCatalog)
      .filter(predicate)
      .map((card) => card.id);
  }

  function getCardClassId(cardId: string, content: GameContent, card?: CardDefinition | null): string {
    if (!cardId) {
      return "";
    }
    const archetypes = getArchetypes();
    const classId = archetypes?.getCardClassId?.(cardId, card || content.cardCatalog[cardId] || null) || "";
    return classId || "neutral";
  }

  function getCardRewardRole(cardId: string, content: GameContent): CardRewardRole {
    const archetypes = getArchetypes();
    return archetypes?.getCardRewardRole?.(cardId, content) || content.cardCatalog[cardId]?.rewardRole || "foundation";
  }

  registryWindow.__ROUGE_ITEM_TOWN_DECK_SERVICES_SHARED = {
    createActionRandom,
    pickRandomValue,
    listGamblerCardIds,
    getCardClassId,
    getCardRewardRole,
  };
})();
