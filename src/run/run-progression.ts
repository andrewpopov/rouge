(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const {
    addBonusSet,
    clamp,
    createDefaultAttributes,
    createDefaultTraining,
    describeBonusSet,
    getTrainingRankCount,
    getTrainingTrackForLevel,
    toBonusValue,
  } = runtimeWindow.ROUGE_RUN_STATE;

  const TRAINING_SLOT_META = {
    slot1: {
      slotNumber: 1 as const,
      roleLabel: "Starter",
      lockedLabel: "Always available from the start of the run.",
    },
    slot2: {
      slotNumber: 2 as const,
      roleLabel: "Bridge",
      lockedLabel: "Unlocks at Level 6 with 3 points in a tree.",
    },
    slot3: {
      slotNumber: 3 as const,
      roleLabel: "Capstone",
      lockedLabel: "Unlocks at Level 12 with 6 points in a favored tree and one learned bridge skill.",
    },
  };

  function getClassProgression(content: GameContent, classId: string) {
    return runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassProgression?.(content, classId) || null;
  }

  function listClassTrees(definition: RuntimeClassProgressionDefinition | null) {
    return Array.isArray(definition?.trees) ? definition.trees : [];
  }

  function getTreeRank(run: RunState, treeId: string) {
    return Math.max(0, toBonusValue(run?.progression?.classProgression?.treeRanks?.[treeId]));
  }

  function syncArchetypeProgression(run: RunState, content: GameContent) {
    return runtimeWindow.ROUGE_REWARD_ENGINE?.syncArchetypeScores?.(run, content) || {};
  }

  function getSkillTreeForSkill(definition: RuntimeClassProgressionDefinition | null, skillId: string) {
    return listClassTrees(definition).find((tree: RuntimeClassTreeDefinition) => {
      return tree.skills.some((skill: RuntimeClassSkillDefinition) => skill.id === skillId);
    }) || null;
  }

  function getSkillDefinition(definition: RuntimeClassProgressionDefinition | null, skillId: string) {
    const tree = getSkillTreeForSkill(definition, skillId);
    return tree?.skills.find((skill: RuntimeClassSkillDefinition) => skill.id === skillId) || null;
  }

  function getAllClassSkills(definition: RuntimeClassProgressionDefinition | null) {
    return listClassTrees(definition).flatMap((tree: RuntimeClassTreeDefinition) => tree.skills);
  }

  function getStarterSkill(definition: RuntimeClassProgressionDefinition | null) {
    const explicitStarter = getSkillDefinition(definition, definition?.starterSkillId || "");
    if (explicitStarter) {
      return explicitStarter;
    }
    return getAllClassSkills(definition).find((skill: RuntimeClassSkillDefinition) => {
      return skill.isStarter || (skill.slot === 1 && skill.tier === "starter");
    }) || null;
  }

  function getDefaultFavoredTreeId(run: RunState, definition: RuntimeClassProgressionDefinition | null) {
    const rankedTrees = listClassTrees(definition)
      .map((tree: RuntimeClassTreeDefinition) => ({
        treeId: tree.id,
        rank: getTreeRank(run, tree.id),
      }))
      .filter((entry) => entry.rank > 0)
      .sort((left, right) => right.rank - left.rank || left.treeId.localeCompare(right.treeId));
    return rankedTrees[0]?.treeId || "";
  }

  function getNormalizedLearnedSkillIds(run: RunState, definition: RuntimeClassProgressionDefinition | null) {
    const knownSkillIds = new Set(getAllClassSkills(definition).map((skill: RuntimeClassSkillDefinition) => skill.id));
    const learned: string[] = [];
    (run?.progression?.classProgression?.unlockedSkillIds || []).forEach((skillId: string) => {
      if (!skillId || !knownSkillIds.has(skillId) || learned.includes(skillId)) {
        return;
      }
      learned.push(skillId);
    });

    const starterSkill = getStarterSkill(definition);
    if (starterSkill && !learned.includes(starterSkill.id)) {
      learned.unshift(starterSkill.id);
    }

    return learned;
  }

  function getTreeEligibleSkills(run: RunState, tree: RuntimeClassTreeDefinition) {
    const levelEligible = tree.skills.filter((skill: RuntimeClassSkillDefinition) => {
      return toBonusValue(skill.requiredLevel, 1) <= run.level;
    });
    return levelEligible.slice(0, getTreeRank(run, tree.id));
  }

  function getTreeEligibleCount(run: RunState, tree: RuntimeClassTreeDefinition) {
    return getTreeEligibleSkills(run, tree).length;
  }

  function getTreeLearnedCount(run: RunState, tree: RuntimeClassTreeDefinition) {
    return (run?.progression?.classProgression?.unlockedSkillIds || []).filter((skillId: string) => {
      return tree.skills.some((skill: RuntimeClassSkillDefinition) => skill.id === skillId);
    }).length;
  }

  function hasLearnedBridgeSkill(run: RunState, tree: RuntimeClassTreeDefinition) {
    const learnedSkillIds = new Set(run?.progression?.classProgression?.unlockedSkillIds || []);
    return tree.skills.some((skill: RuntimeClassSkillDefinition) => {
      return learnedSkillIds.has(skill.id) && (skill.slot === 2 || skill.tier === "bridge");
    });
  }

  function isTreeFavoredForCapstone(run: RunState, definition: RuntimeClassProgressionDefinition | null, treeId: string) {
    const targetRank = getTreeRank(run, treeId);
    if (targetRank <= 0) {
      return false;
    }
    const highestOtherRank = listClassTrees(definition)
      .filter((tree: RuntimeClassTreeDefinition) => tree.id !== treeId)
      .reduce((maxRank, tree: RuntimeClassTreeDefinition) => Math.max(maxRank, getTreeRank(run, tree.id)), 0);
    return targetRank >= highestOtherRank + 2;
  }

  function isBridgeSlotUnlocked(run: RunState, tree: RuntimeClassTreeDefinition) {
    return run.level >= 6 && getTreeRank(run, tree.id) >= 3;
  }

  function isCapstoneSlotUnlocked(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition) {
    return run.level >= 12
      && getTreeRank(run, tree.id) >= 6
      && isTreeFavoredForCapstone(run, definition, tree.id)
      && hasLearnedBridgeSkill(run, tree);
  }

  function isTrainingSlotUnlocked(
    run: RunState,
    definition: RuntimeClassProgressionDefinition | null,
    slotKey: RunSkillBarSlotKey,
    tree: RuntimeClassTreeDefinition | null = null
  ) {
    if (slotKey === "slot1") {
      return Boolean(getStarterSkill(definition));
    }
    if (slotKey === "slot2") {
      const trees = tree ? [tree] : listClassTrees(definition);
      return trees.some((entry: RuntimeClassTreeDefinition) => isBridgeSlotUnlocked(run, entry));
    }
    const trees = tree ? [tree] : listClassTrees(definition);
    return trees.some((entry: RuntimeClassTreeDefinition) => isCapstoneSlotUnlocked(run, definition, entry));
  }

  function getSkillEligibility(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition, skill: RuntimeClassSkillDefinition) {
    if (skill.requiredLevel > run.level) { return { eligible: false, gateLabel: `Requires Level ${skill.requiredLevel}.` }; }
    if (skill.slot === 1 || skill.tier === "starter" || skill.isStarter) { return { eligible: true, gateLabel: "Starting skill for this class." }; }
    if (skill.slot === 2 || skill.tier === "bridge") {
      if (!isBridgeSlotUnlocked(run, tree)) { return { eligible: false, gateLabel: `Requires Level 6 and 3 points in ${tree.name}.` }; }
      return { eligible: true, gateLabel: "Ready to learn." };
    }
    if (run.level < 12) { return { eligible: false, gateLabel: "Requires Level 12." }; }
    if (getTreeRank(run, tree.id) < 6) { return { eligible: false, gateLabel: `Requires 6 points in ${tree.name}.` }; }
    if (!hasLearnedBridgeSkill(run, tree)) { return { eligible: false, gateLabel: `Learn a ${tree.name} bridge skill first.` }; }
    if (!isTreeFavoredForCapstone(run, definition, tree.id)) { return { eligible: false, gateLabel: `${tree.name} needs a favored lead of 2 points.` }; }
    return { eligible: true, gateLabel: "Ready to learn." };
  }

  function isSkillEquippableInSlot(run: RunState, definition: RuntimeClassProgressionDefinition | null, slotKey: RunSkillBarSlotKey, skillId: string) {
    const tree = getSkillTreeForSkill(definition, skillId);
    const skill = getSkillDefinition(definition, skillId);
    if (!tree || !skill) {
      return false;
    }
    const slotMatch = (slotKey === "slot1" && skill.slot === 1)
      || (slotKey === "slot2" && skill.slot === 2)
      || (slotKey === "slot3" && skill.slot === 3);
    if (!slotMatch) {
      return false;
    }
    if (!(run.progression?.classProgression?.unlockedSkillIds || []).includes(skillId)) {
      return false;
    }
    return isTrainingSlotUnlocked(run, definition, slotKey, tree);
  }

  function normalizeEquippedSkillBar(run: RunState, definition: RuntimeClassProgressionDefinition | null, learnedSkillIds: string[]) {
    const equipped = run?.progression?.classProgression?.equippedSkillBar || {
      slot1SkillId: "",
      slot2SkillId: "",
      slot3SkillId: "",
    };
    const normalized = {
      slot1SkillId: "",
      slot2SkillId: "",
      slot3SkillId: "",
    };
    const learnedSet = new Set(learnedSkillIds);
    const starterSkill = getStarterSkill(definition);

    const requestedSlot1 = equipped.slot1SkillId;
    if (requestedSlot1 && learnedSet.has(requestedSlot1) && isSkillEquippableInSlot(run, definition, "slot1", requestedSlot1)) {
      normalized.slot1SkillId = requestedSlot1;
    } else if (starterSkill && learnedSet.has(starterSkill.id)) {
      normalized.slot1SkillId = starterSkill.id;
    }

    (["slot2", "slot3"] as RunSkillBarSlotKey[]).forEach((slotKey) => {
      const requestedSkillId = equipped[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || "";
      if (requestedSkillId && isSkillEquippableInSlot(run, definition, slotKey, requestedSkillId)) {
        normalized[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] = requestedSkillId;
      }
    });

    return normalized;
  }

  function updateFavoredTree(run: RunState, treeId: string) {
    const currentFavoredTreeId = run.progression?.classProgression?.favoredTreeId || "";
    const nextRank = getTreeRank(run, treeId);
    if (!currentFavoredTreeId || currentFavoredTreeId === treeId) {
      run.progression.classProgression.favoredTreeId = treeId;
      return;
    }

    const currentFavoredRank = getTreeRank(run, currentFavoredTreeId);
    if (nextRank > currentFavoredRank) {
      run.progression.classProgression.favoredTreeId = treeId;
    }
  }

  function getTreeContributionBonuses(run: RunState, tree: RuntimeClassTreeDefinition) {
    const total: Record<string, number> = {};
    const rankCount = getTreeRank(run, tree.id);
    const isFavored = run?.progression?.classProgression?.favoredTreeId === tree.id && rankCount > 0;
    const eligibleCount = getTreeEligibleCount(run, tree);
    const unlockThreshold = Math.max(1, toBonusValue(tree.unlockThreshold, 2));
    const unlockSteps = Math.floor(eligibleCount / unlockThreshold);

    if (rankCount > 0) {
      addBonusSet(total, tree.bonusPerRank, rankCount);
    }
    if (isFavored) {
      addBonusSet(total, tree.bonusPerRank, 1);
    }
    if (unlockSteps > 0) {
      addBonusSet(total, tree.unlockBonusPerThreshold, unlockSteps);
    }

    return total;
  }

  function getTreeNextUnlockLabel(run: RunState, definition: RuntimeClassProgressionDefinition | null, tree: RuntimeClassTreeDefinition) {
    const learnedSkillIds = new Set(run?.progression?.classProgression?.unlockedSkillIds || []);
    const learnableNow = tree.skills.find((skill: RuntimeClassSkillDefinition) => {
      return !learnedSkillIds.has(skill.id) && getSkillEligibility(run, definition, tree, skill).eligible;
    }) || null;
    if (learnableNow) {
      return `Next unlock ready: ${learnableNow.name}.`;
    }

    const nextLevelSkill = tree.skills.find((skill: RuntimeClassSkillDefinition) => {
      return !learnedSkillIds.has(skill.id) && skill.requiredLevel > run.level;
    }) || null;
    if (nextLevelSkill) {
      return `Next unlock at Level ${nextLevelSkill.requiredLevel}: ${nextLevelSkill.name}.`;
    }

    const hasUnlearnedBridge = tree.skills.some((skill: RuntimeClassSkillDefinition) => {
      return !learnedSkillIds.has(skill.id) && (skill.slot === 2 || skill.tier === "bridge");
    });
    if (hasUnlearnedBridge && !isBridgeSlotUnlocked(run, tree)) {
      return `Next unlock gate: bridge skills open at Level 6 with 3 points in ${tree.name}.`;
    }

    const hasUnlearnedCapstone = tree.skills.some((skill: RuntimeClassSkillDefinition) => {
      return !learnedSkillIds.has(skill.id) && (skill.slot === 3 || skill.tier === "capstone");
    });
    if (hasUnlearnedCapstone && !isCapstoneSlotUnlocked(run, definition, tree)) {
      return `Next unlock gate: capstone requires Level 12, 6 points in ${tree.name}, a learned bridge skill, and a favored lead.`;
    }

    return "All current skills in this tree are unlocked for this run.";
  }

  function syncUnlockedClassSkills(run: RunState, content: GameContent) {
    const definition = getClassProgression(content, run.classId);
    if (!definition) {
      run.progression.classProgression.unlockedSkillIds = [];
      run.progression.classProgression.equippedSkillBar = {
        slot1SkillId: "",
        slot2SkillId: "",
        slot3SkillId: "",
      };
      run.progression.classProgression.favoredTreeId = "";
      run.progression.classProgression.primaryTreeId = "";
      run.progression.classProgression.secondaryUtilityTreeId = "";
      run.progression.classProgression.specializationStage = "exploratory";
      run.progression.classProgression.treeRanks = {};
      run.progression.classProgression.archetypeScores = {};
      run.progression.classProgression.offTreeUtilityCount = 0;
      run.progression.classProgression.offTreeDamageCount = 0;
      run.progression.classProgression.counterCoverageTags = [];
      return;
    }

    const normalizedTreeRanks: Record<string, number> = {};
    listClassTrees(definition).forEach((tree: RuntimeClassTreeDefinition) => {
      const maxRank = Math.max(1, toBonusValue(tree.maxRank, tree.skills.length));
      const treeRank = clamp(Math.max(0, toBonusValue(run.progression.classProgression.treeRanks?.[tree.id])), 0, maxRank);
      if (treeRank > 0) {
        normalizedTreeRanks[tree.id] = treeRank;
      }
    });

    run.progression.classProgression.treeRanks = normalizedTreeRanks;
    run.progression.classProgression.unlockedSkillIds = getNormalizedLearnedSkillIds(run, definition);
    run.progression.classProgression.equippedSkillBar = normalizeEquippedSkillBar(
      run,
      definition,
      run.progression.classProgression.unlockedSkillIds
    );

    if (
      run.progression.classProgression.favoredTreeId
      && !listClassTrees(definition).some((tree: RuntimeClassTreeDefinition) => tree.id === run.progression.classProgression.favoredTreeId)
    ) {
      run.progression.classProgression.favoredTreeId = "";
    }
    if (run.progression.classProgression.favoredTreeId && !normalizedTreeRanks[run.progression.classProgression.favoredTreeId]) {
      run.progression.classProgression.favoredTreeId = "";
    }
    if (!run.progression.classProgression.favoredTreeId) {
      run.progression.classProgression.favoredTreeId = getDefaultFavoredTreeId(run, definition);
    }

    syncArchetypeProgression(run, content);
  }

  function buildProgressionBonuses(run: RunState, content: GameContent): ItemBonusSet {
    const total: ItemBonusSet = {};
    const attributes = run.progression?.attributes || createDefaultAttributes();
    const definition = getClassProgression(content, run.classId);

    addBonusSet(total, {
      heroDamageBonus: toBonusValue(attributes.strength),
      heroGuardBonus: toBonusValue(attributes.dexterity),
      heroMaxLife: toBonusValue(attributes.vitality) * 3,
      heroMaxEnergy: Math.ceil(toBonusValue(attributes.energy) / 2),
      heroBurnBonus: Math.floor(toBonusValue(attributes.energy) / 2),
    });

    listClassTrees(definition).forEach((tree: RuntimeClassTreeDefinition) => {
      addBonusSet(total, getTreeContributionBonuses(run, tree));
    });

    return total;
  }

  function getProgressionSummary(run: RunState, content: GameContent): RunProgressionSummary {
    syncUnlockedClassSkills(run, content);
    const archetypeSummary = runtimeWindow.ROUGE_REWARD_ENGINE?.getDominantArchetype?.(run, content) || { primary: null, secondary: null };
    const archetypeScores = runtimeWindow.ROUGE_REWARD_ENGINE?.getArchetypeScoreEntries?.(run, content) || [];

    const attributes = run.progression?.attributes || createDefaultAttributes();
    const training = run.progression?.training || createDefaultTraining();
    const definition = getClassProgression(content, run.classId);
    const favoredTreeId = run.progression?.classProgression?.favoredTreeId || "";
    const primaryTreeId = run.progression?.classProgression?.primaryTreeId || "";
    const secondaryUtilityTreeId = run.progression?.classProgression?.secondaryUtilityTreeId || "";
    const specializationStage = run.progression?.classProgression?.specializationStage || "exploratory";
    const favoredTree = listClassTrees(definition).find((tree: RuntimeClassTreeDefinition) => tree.id === favoredTreeId) || null;
    const treeSummaries = listClassTrees(definition).map((tree: RuntimeClassTreeDefinition) => {
      const rank = getTreeRank(run, tree.id);
      const learnedSkills = getTreeLearnedCount(run, tree);
      const availableSkills = getTreeEligibleCount(run, tree);
      const isFavored = favoredTreeId === tree.id && rank > 0;
      const bonusLines = describeBonusSet(getTreeContributionBonuses(run, tree));

      return {
        treeId: tree.id,
        treeName: tree.name,
        archetypeId: tree.archetypeId || "unknown",
        rank,
        maxRank: Math.max(1, toBonusValue(tree.maxRank, tree.skills.length)),
        unlockedSkills: learnedSkills,
        availableSkills,
        isFavored,
        nextUnlock: getTreeNextUnlockLabel(run, definition, tree),
        bonusLines: bonusLines.length > 0 ? bonusLines : ["No derived tree bonuses yet."],
      };
    });

    const nextClassUnlock =
      treeSummaries.find((treeSummary: RunClassTreeSummary) => treeSummary.isFavored && !treeSummary.nextUnlock.startsWith("All current"))?.nextUnlock
      || treeSummaries.find((treeSummary: RunClassTreeSummary) => !treeSummary.nextUnlock.startsWith("All current"))?.nextUnlock
      || "All current class skills are unlocked for this run.";
    const totalBonuses = buildProgressionBonuses(run, content);
    const bonusSummaryLines = describeBonusSet(totalBonuses);

    return {
      skillPointsAvailable: toBonusValue(run.progression?.skillPointsAvailable),
      classPointsAvailable: toBonusValue(run.progression?.classPointsAvailable),
      attributePointsAvailable: toBonusValue(run.progression?.attributePointsAvailable),
      trainingRanks: getTrainingRankCount(training),
      favoredTreeId,
      favoredTreeName: favoredTree?.name || "",
      primaryTreeId,
      secondaryUtilityTreeId,
      specializationStage,
      offTreeUtilityCount: toBonusValue(run.progression?.classProgression?.offTreeUtilityCount),
      offTreeDamageCount: toBonusValue(run.progression?.classProgression?.offTreeDamageCount),
      counterCoverageTags: Array.isArray(run.progression?.classProgression?.counterCoverageTags)
        ? [...run.progression.classProgression.counterCoverageTags]
        : [],
      dominantArchetypeId: archetypeSummary.primary?.archetypeId || "",
      dominantArchetypeLabel: archetypeSummary.primary?.label || "",
      dominantArchetypeScore: toBonusValue(archetypeSummary.primary?.score),
      secondaryArchetypeId: archetypeSummary.secondary?.archetypeId || "",
      secondaryArchetypeLabel: archetypeSummary.secondary?.label || "",
      secondaryArchetypeScore: toBonusValue(archetypeSummary.secondary?.score),
      archetypeScores: archetypeScores.map((entry: RunArchetypeScoreSummary) => ({
        archetypeId: entry.archetypeId,
        label: entry.label,
        score: toBonusValue(entry.score),
      })),
      unlockedClassSkills: Array.isArray(run.progression?.classProgression?.unlockedSkillIds)
        ? run.progression.classProgression.unlockedSkillIds.length
        : 0,
      nextClassUnlock,
      attributeSummaryLines: [
        `Strength ${toBonusValue(attributes.strength)}: Hero card damage +${toBonusValue(attributes.strength)}.`,
        `Dexterity ${toBonusValue(attributes.dexterity)}: Guard skills +${toBonusValue(attributes.dexterity)}.`,
        `Vitality ${toBonusValue(attributes.vitality)}: Hero max Life +${toBonusValue(attributes.vitality) * 3}.`,
        `Energy ${toBonusValue(attributes.energy)}: Hero max Energy +${Math.ceil(toBonusValue(attributes.energy) / 2)}, Burn +${Math.floor(
          toBonusValue(attributes.energy) / 2
        )}.`,
      ],
      trainingSummaryLines: [
        `Vitality drill rank ${toBonusValue(training.vitality)}.`,
        `Focus drill rank ${toBonusValue(training.focus)}.`,
        `Command drill rank ${toBonusValue(training.command)}.`,
      ],
      bonusSummaryLines: bonusSummaryLines.length > 0 ? bonusSummaryLines : ["No derived progression bonuses yet."],
      treeSummaries,
    };
  }

  function applyTrainingRank(run: RunState, track: string) {
    if (track === "vitality") {
      run.hero.maxLife += 4;
      run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + 4);
      return;
    }

    if (track === "focus") {
      run.hero.maxEnergy = clamp(run.hero.maxEnergy + 1, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_ENERGY);
      run.hero.potionHeal = clamp(run.hero.potionHeal + 1, 1, runtimeWindow.ROUGE_LIMITS.MAX_HERO_POTION_HEAL);
      return;
    }

    run.mercenary.attack += 1;
    run.mercenary.maxLife += 3;
    run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + 3);
  }

  function syncLevelProgression(run: RunState) {
    const targetRanks = Math.max(0, toBonusValue(run.level) - 1);
    const currentRanks = getTrainingRankCount(run.progression?.training);

    for (let rankIndex = currentRanks; rankIndex < targetRanks; rankIndex += 1) {
      const nextLevel = rankIndex + 2;
      const track = getTrainingTrackForLevel(nextLevel);
      (run.progression.training as Record<string, number>)[track] += 1;
      run.progression.skillPointsAvailable += 1;
      run.summary.skillPointsEarned += 1;
      run.summary.trainingRanksGained += 1;
      applyTrainingRank(run, track);
    }

    const earnedSkillPoints = Math.max(
      toBonusValue(run.summary.skillPointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.trainingPointsSpent) + toBonusValue(run.progression.skillPointsAvailable))
    );
    const trainingPointsSpent = clamp(toBonusValue(run.progression.trainingPointsSpent), 0, earnedSkillPoints);
    const earnedClassPoints = Math.max(
      toBonusValue(run.summary.classPointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.classPointsSpent) + toBonusValue(run.progression.classPointsAvailable))
    );
    const classPointsSpent = clamp(toBonusValue(run.progression.classPointsSpent), 0, earnedClassPoints);
    const earnedAttributePoints = Math.max(
      toBonusValue(run.summary.attributePointsEarned),
      targetRanks,
      Math.max(0, toBonusValue(run.progression.attributePointsSpent) + toBonusValue(run.progression.attributePointsAvailable))
    );
    const attributePointsSpent = clamp(toBonusValue(run.progression.attributePointsSpent), 0, earnedAttributePoints);

    run.progression.trainingPointsSpent = trainingPointsSpent;
    run.progression.classPointsSpent = classPointsSpent;
    run.progression.attributePointsSpent = attributePointsSpent;
    run.progression.skillPointsAvailable = Math.max(0, earnedSkillPoints - trainingPointsSpent);
    run.progression.classPointsAvailable = Math.max(0, earnedClassPoints - classPointsSpent);
    run.progression.attributePointsAvailable = Math.max(0, earnedAttributePoints - attributePointsSpent);
    run.summary.levelsGained = Math.max(toBonusValue(run.summary.levelsGained), targetRanks);
    run.summary.skillPointsEarned = earnedSkillPoints;
    run.summary.classPointsEarned = earnedClassPoints;
    run.summary.attributePointsEarned = earnedAttributePoints;
    run.summary.trainingRanksGained = Math.max(toBonusValue(run.summary.trainingRanksGained), targetRanks);
  }

  runtimeWindow.__ROUGE_RUN_PROGRESSION_HELPERS = {
    TRAINING_SLOT_META,
    getClassProgression, listClassTrees, getTreeRank, syncArchetypeProgression,
    getSkillTreeForSkill, getSkillDefinition, getAllClassSkills, getStarterSkill,
    getDefaultFavoredTreeId, getNormalizedLearnedSkillIds,
    getTreeEligibleSkills, getTreeEligibleCount, getTreeLearnedCount,
    hasLearnedBridgeSkill, isTreeFavoredForCapstone,
    isBridgeSlotUnlocked, isCapstoneSlotUnlocked, isTrainingSlotUnlocked,
    getSkillEligibility, isSkillEquippableInSlot, normalizeEquippedSkillBar,
    updateFavoredTree, getTreeContributionBonuses, getTreeNextUnlockLabel,
    syncUnlockedClassSkills, buildProgressionBonuses, getProgressionSummary,
    applyTrainingRank, syncLevelProgression,
  };

})();

