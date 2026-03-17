(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { clamp, deepClone, uniquePush } = runtimeWindow.ROUGE_UTILS;

  const LEVEL_TRAINING_ORDER: Array<keyof RunProgressionState["training"]> = ["vitality", "focus", "command"];

  function toBonusValue(value: unknown, fallback = 0): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  function slugify(value: unknown): string {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function createDefaultTraining(): RunProgressionState["training"] {
    return {
      vitality: 0,
      focus: 0,
      command: 0,
    };
  }

  function createDefaultAttributes(): RunAttributeState {
    return {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      energy: 0,
    };
  }

  function createDefaultClassProgression(): RunClassProgressionState {
    return {
      favoredTreeId: "",
      treeRanks: {},
      unlockedSkillIds: [],
    };
  }

  function createDefaultProgression(): RunProgressionState {
    return {
      bossTrophies: [],
      activatedRunewords: [],
      skillPointsAvailable: 0,
      trainingPointsSpent: 0,
      classPointsAvailable: 0,
      classPointsSpent: 0,
      attributePointsAvailable: 0,
      attributePointsSpent: 0,
      attributes: createDefaultAttributes(),
      classProgression: createDefaultClassProgression(),
      training: createDefaultTraining(),
    };
  }

  function createDefaultWorldState(): RunWorldState {
    return {
      resolvedNodeIds: [],
      questOutcomes: {},
      shrineOutcomes: {},
      eventOutcomes: {},
      opportunityOutcomes: {},
      worldFlags: [],
    };
  }

  function createDefaultInventory(): RunInventoryState {
    return {
      nextEntryId: 1,
      carried: [],
    };
  }

  function createDefaultTownState(): RunTownState {
    return {
      vendor: {
        refreshCount: 0,
        stock: [],
      },
    };
  }

  function createDefaultSummary(): RunState["summary"] {
    return {
      encountersCleared: 0,
      zonesCleared: 0,
      actsCleared: 0,
      goldGained: 0,
      xpGained: 0,
      levelsGained: 0,
      skillPointsEarned: 0,
      classPointsEarned: 0,
      attributePointsEarned: 0,
      trainingRanksGained: 0,
      bossesDefeated: 0,
      runewordsForged: 0,
    };
  }

  function getLevelForXp(xp: unknown): number {
    return Math.max(1, 1 + Math.floor((Number.parseInt(String(xp || 0), 10) || 0) / 50));
  }

  function getTrainingTrackForLevel(level: unknown): keyof RunProgressionState["training"] {
    return LEVEL_TRAINING_ORDER[Math.max(0, (Number.parseInt(String(level || 2), 10) || 2) - 2) % LEVEL_TRAINING_ORDER.length];
  }

  function getTrainingRankCount(training: RunProgressionState["training"] | null | undefined): number {
    return toBonusValue(training?.vitality) + toBonusValue(training?.focus) + toBonusValue(training?.command);
  }

  function addBonusSet(total: ItemBonusSet, bonuses: ItemBonusSet | undefined, multiplier = 1): ItemBonusSet {
    Object.entries(bonuses || {}).forEach(([key, value]) => {
      const typedKey = key as keyof ItemBonusSet;
      total[typedKey] = (total[typedKey] || 0) + toBonusValue(value) * multiplier;
    });
    return total;
  }

  function describeBonusSet(bonuses: ItemBonusSet | null | undefined): string[] {
    const lines = [];
    if (toBonusValue(bonuses?.heroDamageBonus) > 0) {
      lines.push(`Hero card damage +${toBonusValue(bonuses.heroDamageBonus)}.`);
    }
    if (toBonusValue(bonuses?.heroGuardBonus) > 0) {
      lines.push(`Guard skills +${toBonusValue(bonuses.heroGuardBonus)}.`);
    }
    if (toBonusValue(bonuses?.heroBurnBonus) > 0) {
      lines.push(`Burn application +${toBonusValue(bonuses.heroBurnBonus)}.`);
    }
    if (toBonusValue(bonuses?.heroMaxLife) > 0) {
      lines.push(`Hero max Life +${toBonusValue(bonuses.heroMaxLife)}.`);
    }
    if (toBonusValue(bonuses?.heroMaxEnergy) > 0) {
      lines.push(`Hero max Energy +${toBonusValue(bonuses.heroMaxEnergy)}.`);
    }
    if (toBonusValue(bonuses?.heroPotionHeal) > 0) {
      lines.push(`Potion healing +${toBonusValue(bonuses.heroPotionHeal)}.`);
    }
    if (toBonusValue(bonuses?.mercenaryAttack) > 0) {
      lines.push(`Mercenary attack +${toBonusValue(bonuses.mercenaryAttack)}.`);
    }
    if (toBonusValue(bonuses?.mercenaryMaxLife) > 0) {
      lines.push(`Mercenary max Life +${toBonusValue(bonuses.mercenaryMaxLife)}.`);
    }
    return lines;
  }

  runtimeWindow.ROUGE_RUN_STATE = {
    deepClone,
    clamp,
    toBonusValue,
    slugify,
    uniquePush,
    createDefaultProgression,
    createDefaultTraining,
    createDefaultAttributes,
    createDefaultClassProgression,
    createDefaultWorldState,
    createDefaultInventory,
    createDefaultTownState,
    createDefaultSummary,
    getLevelForXp,
    getTrainingTrackForLevel,
    getTrainingRankCount,
    addBonusSet,
    describeBonusSet,
  };
})();
