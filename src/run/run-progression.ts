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

  const MAX_HERO_ENERGY = 6;
  const MAX_HERO_POTION_HEAL = 24;

  function getClassProgression(content, classId) {
    return runtimeWindow.ROUGE_CLASS_REGISTRY?.getClassProgression?.(content, classId) || null;
  }

  function getTreeRank(run, treeId) {
    return Math.max(0, toBonusValue(run?.progression?.classProgression?.treeRanks?.[treeId]));
  }

  function getTreeUnlockedCount(run, tree) {
    return (run?.progression?.classProgression?.unlockedSkillIds || []).filter((skillId) => {
      return tree.skills.some((skill) => skill.id === skillId);
    }).length;
  }

  function getTreeContributionBonuses(run, tree) {
    const total = {};
    const rankCount = getTreeRank(run, tree.id);
    const isFavored = run?.progression?.classProgression?.favoredTreeId === tree.id && rankCount > 0;
    const unlockedCount = getTreeUnlockedCount(run, tree);
    const unlockThreshold = Math.max(1, toBonusValue(tree.unlockThreshold, 2));
    const unlockSteps = Math.floor(unlockedCount / unlockThreshold);

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

  function getTreeNextUnlockLabel(run, tree) {
    const treeRank = getTreeRank(run, tree.id);
    const nextSkill = tree.skills.find((skill, index) => {
      return index >= treeRank && toBonusValue(skill.requiredLevel, 1) <= run.level;
    });
    if (nextSkill) {
      return `Next unlock: ${nextSkill.name} (Lv ${nextSkill.requiredLevel}).`;
    }

    const futureSkill = tree.skills.find((skill, index) => index >= treeRank) || null;
    if (futureSkill) {
      return `Next unlock waits for Lv ${futureSkill.requiredLevel}: ${futureSkill.name}.`;
    }

    return "All current skills in this tree are unlocked.";
  }

  function syncUnlockedClassSkills(run, content) {
    const definition = getClassProgression(content, run.classId);
    if (!definition) {
      run.progression.classProgression.unlockedSkillIds = [];
      run.progression.classProgression.favoredTreeId = "";
      run.progression.classProgression.treeRanks = {};
      return;
    }

    const unlocked = [];
    const normalizedTreeRanks = {};
    definition.trees.forEach((tree) => {
      const maxRank = Math.max(1, toBonusValue(tree.maxRank, tree.skills.length));
      const treeRank = clamp(Math.max(0, toBonusValue(run.progression.classProgression.treeRanks?.[tree.id])), 0, maxRank);
      if (treeRank <= 0) {
        return;
      }
      normalizedTreeRanks[tree.id] = treeRank;

      const eligibleSkills = tree.skills.filter((skill) => toBonusValue(skill.requiredLevel, 1) <= run.level).slice(0, treeRank);
      eligibleSkills.forEach((skill) => {
        if (!unlocked.includes(skill.id)) {
          unlocked.push(skill.id);
        }
      });
    });

    run.progression.classProgression.treeRanks = normalizedTreeRanks;
    run.progression.classProgression.unlockedSkillIds = unlocked;
    if (
      run.progression.classProgression.favoredTreeId &&
      !definition.trees.some((tree) => tree.id === run.progression.classProgression.favoredTreeId)
    ) {
      run.progression.classProgression.favoredTreeId = "";
    }
    if (run.progression.classProgression.favoredTreeId && !normalizedTreeRanks[run.progression.classProgression.favoredTreeId]) {
      run.progression.classProgression.favoredTreeId = "";
    }
  }

  function buildProgressionBonuses(run, content): ItemBonusSet {
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

    (definition?.trees || []).forEach((tree) => {
      addBonusSet(total, getTreeContributionBonuses(run, tree));
    });

    return total;
  }

  function getProgressionSummary(run, content): RunProgressionSummary {
    syncUnlockedClassSkills(run, content);

    const attributes = run.progression?.attributes || createDefaultAttributes();
    const training = run.progression?.training || createDefaultTraining();
    const definition = getClassProgression(content, run.classId);
    const favoredTreeId = run.progression?.classProgression?.favoredTreeId || "";
    const favoredTree = (definition?.trees || []).find((tree) => tree.id === favoredTreeId) || null;
    const treeSummaries = (definition?.trees || []).map((tree) => {
      const rank = getTreeRank(run, tree.id);
      const unlockedSkills = getTreeUnlockedCount(run, tree);
      const availableSkills = tree.skills.filter((skill) => toBonusValue(skill.requiredLevel, 1) <= run.level).length;
      const isFavored = favoredTreeId === tree.id && rank > 0;
      const bonusLines = describeBonusSet(getTreeContributionBonuses(run, tree));

      return {
        treeId: tree.id,
        treeName: tree.name,
        archetypeId: tree.archetypeId || "unknown",
        rank,
        maxRank: Math.max(1, toBonusValue(tree.maxRank, tree.skills.length)),
        unlockedSkills,
        availableSkills,
        isFavored,
        nextUnlock: getTreeNextUnlockLabel(run, tree),
        bonusLines: bonusLines.length > 0 ? bonusLines : ["No derived tree bonuses yet."],
      };
    });

    const nextClassUnlock =
      treeSummaries.find((treeSummary) => treeSummary.isFavored && !treeSummary.nextUnlock.startsWith("All current"))?.nextUnlock ||
      treeSummaries.find((treeSummary) => !treeSummary.nextUnlock.startsWith("All current"))?.nextUnlock ||
      "All current class skills are unlocked.";
    const totalBonuses = buildProgressionBonuses(run, content);
    const bonusSummaryLines = describeBonusSet(totalBonuses);

    return {
      skillPointsAvailable: toBonusValue(run.progression?.skillPointsAvailable),
      classPointsAvailable: toBonusValue(run.progression?.classPointsAvailable),
      attributePointsAvailable: toBonusValue(run.progression?.attributePointsAvailable),
      trainingRanks: getTrainingRankCount(training),
      favoredTreeId,
      favoredTreeName: favoredTree?.name || "",
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

  function applyTrainingRank(run, track) {
    if (track === "vitality") {
      run.hero.maxLife += 4;
      run.hero.currentLife = Math.min(run.hero.maxLife, run.hero.currentLife + 4);
      return;
    }

    if (track === "focus") {
      run.hero.maxEnergy = clamp(run.hero.maxEnergy + 1, 1, MAX_HERO_ENERGY);
      run.hero.potionHeal = clamp(run.hero.potionHeal + 1, 1, MAX_HERO_POTION_HEAL);
      return;
    }

    run.mercenary.attack += 1;
    run.mercenary.maxLife += 3;
    run.mercenary.currentLife = Math.min(run.mercenary.maxLife, run.mercenary.currentLife + 3);
  }

  function syncLevelProgression(run) {
    const targetRanks = Math.max(0, toBonusValue(run.level) - 1);
    const currentRanks = getTrainingRankCount(run.progression?.training);

    for (let rankIndex = currentRanks; rankIndex < targetRanks; rankIndex += 1) {
      const nextLevel = rankIndex + 2;
      const track = getTrainingTrackForLevel(nextLevel);
      run.progression.training[track] += 1;
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

  function buildProgressionAction(run, track, title, description, previewLines) {
    const canSpend = run.progression.skillPointsAvailable > 0;
    return {
      id: `progression_spend_${track}`,
      category: "progression",
      title,
      subtitle: "Spend Skill Point",
      description,
      previewLines: [
        ...previewLines,
        canSpend
          ? `${run.progression.skillPointsAvailable} skill point${run.progression.skillPointsAvailable === 1 ? "" : "s"} ready.`
          : "Earn more levels to unlock another spend.",
      ],
      cost: 0,
      actionLabel: canSpend ? "Spend" : "Locked",
      disabled: !canSpend,
    };
  }

  function buildAttributeAction(run, attribute, title, description, previewLines) {
    const canSpend = run.progression.attributePointsAvailable > 0;
    return {
      id: `progression_attribute_${attribute}`,
      category: "progression",
      title,
      subtitle: "Allocate Attribute",
      description,
      previewLines: [
        ...previewLines,
        `${title} rank ${toBonusValue(run.progression.attributes?.[attribute])}.`,
        canSpend
          ? `${run.progression.attributePointsAvailable} attribute point${run.progression.attributePointsAvailable === 1 ? "" : "s"} ready.`
          : "Level up to unlock another attribute point.",
      ],
      cost: 0,
      actionLabel: canSpend ? "Allocate" : "Locked",
      disabled: !canSpend,
    };
  }

  function buildClassTreeAction(run, tree, treeSummary) {
    const treeRank = treeSummary?.rank || 0;
    const maxRank = treeSummary?.maxRank || Math.max(1, toBonusValue(tree.maxRank, tree.skills.length));
    const canSpend = run.progression.classPointsAvailable > 0 && treeRank < maxRank;
    const threshold = Math.max(1, toBonusValue(tree.unlockThreshold, 2));
    const bonusPreview = Array.isArray(treeSummary?.bonusLines) ? treeSummary.bonusLines.slice(0, 2) : [];

    let actionLabel = "Locked";
    if (treeRank >= maxRank) {
      actionLabel = "Maxed";
    } else if (canSpend) {
      actionLabel = "Invest";
    }

    return {
      id: `progression_tree_${tree.id}`,
      category: "progression",
      title: tree.name,
      subtitle: "Invest Class Point",
      description: tree.summary,
      previewLines: [
        `Tree rank ${treeRank}/${maxRank}. Unlocked skills ${treeSummary?.unlockedSkills || 0}/${tree.skills.length}.`,
        treeSummary?.nextUnlock || "Next unlock path unavailable.",
        `Every ${threshold} unlocked skill${threshold === 1 ? "" : "s"} grants an extra tree passive.`,
        ...(bonusPreview.length > 0 ? bonusPreview : ["No derived tree bonuses yet."]),
      ],
      cost: 0,
      actionLabel,
      disabled: !canSpend,
    };
  }

  function listProgressionActions(run, content) {
    if (!run?.progression) {
      return [];
    }

    const progressionSummary = getProgressionSummary(run, content);
    const treeSummaries = new Map(progressionSummary.treeSummaries.map((entry) => [entry.treeId, entry]));

    const actions = [
      buildProgressionAction(
        run,
        "vitality",
        "Vitality Drill",
        "Convert one banked skill point into permanent hero durability.",
        ["Hero max Life +4."]
      ),
      buildProgressionAction(
        run,
        "focus",
        "Focus Drill",
        "Convert one banked skill point into permanent hero casting stamina.",
        ["Hero max Energy +1.", "Potion healing +1."]
      ),
      buildProgressionAction(
        run,
        "command",
        "Command Drill",
        "Convert one banked skill point into permanent mercenary pressure.",
        ["Mercenary attack +1.", "Mercenary max Life +3."]
      ),
      buildAttributeAction(
        run,
        "strength",
        "Strength",
        "Invest in raw physical power for higher card damage.",
        ["Hero card damage +1."]
      ),
      buildAttributeAction(
        run,
        "dexterity",
        "Dexterity",
        "Invest in timing and control for stronger guard skills.",
        ["Guard skills +1."]
      ),
      buildAttributeAction(
        run,
        "vitality",
        "Vitality",
        "Invest in durability for a larger Life pool.",
        ["Hero max Life +3."]
      ),
      buildAttributeAction(
        run,
        "energy",
        "Energy",
        "Invest in spell fuel for mana growth and burn scaling.",
        ["Every 2 ranks: Hero max Energy +1.", "Every 2 ranks: Burn +1."]
      ),
    ];

    const classProgression = getClassProgression(content, run.classId);
    (classProgression?.trees || []).forEach((tree) => {
      actions.push(buildClassTreeAction(run, tree, treeSummaries.get(tree.id) || null));
    });

    return actions;
  }

  function applyProgressionAction(run, actionId, content) {
    if (!actionId.startsWith("progression_spend_")) {
      if (!actionId.startsWith("progression_attribute_") && !actionId.startsWith("progression_tree_")) {
        return { ok: false, message: "Unknown progression action." };
      }
    }

    if (actionId.startsWith("progression_spend_")) {
      if (run.progression.skillPointsAvailable <= 0) {
        return { ok: false, message: "No banked skill points are available." };
      }

      const track = actionId.replace("progression_spend_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultTraining(), track)) {
        return { ok: false, message: "Unknown progression track." };
      }

      run.progression.trainingPointsSpent += 1;
      run.progression.skillPointsAvailable = Math.max(0, run.progression.skillPointsAvailable - 1);
      run.progression.training[track] += 1;
      applyTrainingRank(run, track);
      return { ok: true, message: "Training updated." };
    }

    if (actionId.startsWith("progression_attribute_")) {
      if (run.progression.attributePointsAvailable <= 0) {
        return { ok: false, message: "No attribute points are available." };
      }

      const attribute = actionId.replace("progression_attribute_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultAttributes(), attribute)) {
        return { ok: false, message: "Unknown attribute." };
      }

      run.progression.attributePointsSpent += 1;
      run.progression.attributePointsAvailable = Math.max(0, run.progression.attributePointsAvailable - 1);
      run.progression.attributes[attribute] += 1;
      return { ok: true, message: "Attributes updated." };
    }

    if (run.progression.classPointsAvailable <= 0) {
      return { ok: false, message: "No class points are available." };
    }

    const treeId = actionId.replace("progression_tree_", "");
    const classProgression = getClassProgression(content, run.classId);
    const tree = classProgression?.trees?.find((entry) => entry.id === treeId) || null;
    if (!tree) {
      return { ok: false, message: "Unknown class progression tree." };
    }
    if (getTreeRank(run, treeId) >= Math.max(1, toBonusValue(tree.maxRank, tree.skills.length))) {
      return { ok: false, message: "That class tree is fully invested for this run." };
    }

    run.progression.classPointsSpent += 1;
    run.progression.classPointsAvailable = Math.max(0, run.progression.classPointsAvailable - 1);
    run.progression.classProgression.treeRanks[treeId] = toBonusValue(run.progression.classProgression.treeRanks?.[treeId]) + 1;
    run.progression.classProgression.favoredTreeId = treeId;
    syncUnlockedClassSkills(run, content);
    return { ok: true, message: "Class progression updated." };
  }

  runtimeWindow.ROUGE_RUN_PROGRESSION = {
    buildProgressionBonuses,
    getProgressionSummary,
    syncLevelProgression,
    syncUnlockedClassSkills,
    listProgressionActions,
    applyProgressionAction,
  };
})();
