(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  const LIMITS = {
    COMBAT_LOG_SIZE: 18,
    STASH_PREVIEW_IDS: 4,
    STASH_PREVIEW_ENTRIES: 4,
    RUN_HISTORY_PREVIEW: 4,
    RECENT_RUNS_SCAN: 4,
    RECENT_FEATURE_IDS: 6,
    RECENT_RUNEWORD_IDS: 6,
    REWARD_CHOICES: 3,
    CARD_CHOICES: 3,
    TUTORIAL_CATEGORY_PREVIEW: 3,
    TUTORIAL_ACTION_ROWS: 2,
    TOWN_FEATURES_PREVIEW: 3,
    WORLD_OUTCOMES_LOG: 6,
    LABEL_PREVIEW: 2,
    BONUS_PREVIEW: 2,
    PROGRESSION_PREVIEW_LINES: 2,
    MARKET_PREVIEW_LINES: 3,
    PLANNING_STAGE_COMPACT: 1,
    PLANNING_STAGE_EXTENDED: 2,
    RECENT_RUNS_SUMMARY: 3,
    NIGHTMARE_HELL_GUEST_ENEMIES: 6,
    MAX_HERO_ENERGY: 6,
    MAX_HERO_POTION_HEAL: 24,
  };

  const COMBAT_PHASE = {
    PLAYER: "player" as CombatPhase,
    ENEMY: "enemy" as CombatPhase,
    VICTORY: "victory" as CombatPhase,
    DEFEAT: "defeat" as CombatPhase,
  };

  const COMBAT_OUTCOME = {
    VICTORY: "victory" as const,
    DEFEAT: "defeat" as const,
  };

  const RUN_OUTCOME = {
    COMPLETED: "completed" as const,
    FAILED: "failed" as const,
    ABANDONED: "abandoned" as const,
  };

  const ZONE_KIND = {
    BATTLE: "battle" as const,
    MINIBOSS: "miniboss" as const,
    BOSS: "boss" as const,
    QUEST: "quest" as const,
    SHRINE: "shrine" as const,
    EVENT: "event" as const,
    OPPORTUNITY: "opportunity" as const,
  };

  const ENEMY_ROLE = {
    RAIDER: "raider" as const,
    RANGED: "ranged" as const,
    SUPPORT: "support" as const,
    BRUTE: "brute" as const,
  };

  const ENTRY_KIND = {
    EQUIPMENT: "equipment" as const,
    RUNE: "rune" as const,
  };

  runtimeWindow.ROUGE_LIMITS = LIMITS;
  runtimeWindow.ROUGE_CONSTANTS = {
    COMBAT_PHASE,
    COMBAT_OUTCOME,
    RUN_OUTCOME,
    ZONE_KIND,
    ENEMY_ROLE,
    ENTRY_KIND,
  };
})();
