(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // ── Assemble class cards from per-class staging files ─────────────────
  // Each class-cards-{name}.ts writes its cards, starterDeck, and rewardPool
  // into runtimeWindow.__ROUGE_CLASS_CARDS_STAGING.{name}.

  const staging = runtimeWindow.__ROUGE_CLASS_CARDS_STAGING;
  const CLASS_NAMES = [
    "amazon", "assassin", "barbarian", "druid",
    "necromancer", "paladin", "sorceress",
  ] as const;

  // ── Merge all class cards into a single catalog ──

  const classCardCatalog: Record<string, CardDefinition> = {};
  for (const name of CLASS_NAMES) {
    Object.assign(classCardCatalog, staging[name].cards);
  }

  // ── Per-class starter decks ──

  const classStarterDecks: Record<string, string[]> = {};
  for (const name of CLASS_NAMES) {
    classStarterDecks[name] = staging[name].starterDeck;
  }

  // ── Per-class reward pools organized by tier ──

  const classRewardPools: Record<string, { early: string[]; mid: string[]; late: string[] }> = {};
  for (const name of CLASS_NAMES) {
    classRewardPools[name] = staging[name].rewardPool;
  }

  // ── Publish the same public API shape as before ──

  runtimeWindow.__ROUGE_CLASS_CARDS = {
    classCardCatalog,
    classStarterDecks,
    classRewardPools,
  };
})();
