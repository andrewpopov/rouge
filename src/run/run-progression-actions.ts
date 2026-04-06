(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const h = runtimeWindow.__ROUGE_RUN_PROGRESSION_HELPERS;
  const {
    TRAINING_SLOT_META, getClassProgression, listClassTrees, getTreeRank,
    getSkillTreeForSkill, getSkillDefinition,
    hasLearnedBridgeSkill, isTreeFavoredForCapstone,
    isBridgeSlotUnlocked, isCapstoneSlotUnlocked, isTrainingSlotUnlocked,
    getSkillEligibility, isSkillEquippableInSlot, getTreeNextUnlockLabel,
    syncUnlockedClassSkills, buildProgressionBonuses, getProgressionSummary,
    applyTrainingRank,
  } = h;
  const {
    createDefaultAttributes,
    createDefaultTraining,
    toBonusValue,
  } = runtimeWindow.ROUGE_RUN_STATE;

  function buildProgressionAction(run: RunState, track: string, title: string, description: string, previewLines: string[]) {
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

  function getNextSlotGateLabel(run: RunState, definition: RuntimeClassProgressionDefinition | null) {
    if (!isTrainingSlotUnlocked(run, definition, "slot2")) {
      return "Slot 2 opens at Level 6 and 3 points in any tree.";
    }
    if (!isTrainingSlotUnlocked(run, definition, "slot3")) {
      return "Slot 3 opens at Level 12 with 6 points in a favored tree and one bridge skill from that tree.";
    }
    return "All three skill slots are open for this run.";
  }

  function getTreeCommitmentBadgeLabels(
    run: RunState,
    definition: RuntimeClassProgressionDefinition | null,
    tree: RuntimeClassTreeDefinition
  ) {
    const badges: string[] = [];
    const rank = getTreeRank(run, tree.id);
    if (isBridgeSlotUnlocked(run, tree)) {
      badges.push("Bridge Ready");
    } else {
      const pointsNeeded = Math.max(0, 3 - rank);
      badges.push(pointsNeeded > 0 ? `Needs ${pointsNeeded} More Point${pointsNeeded === 1 ? "" : "s"}` : "Bridge Locked");
    }
    if (isTreeFavoredForCapstone(run, definition, tree.id)) {
      badges.push("Favored Tree");
    } else {
      badges.push("Tie Broken By 2+ Needed");
    }
    if (isCapstoneSlotUnlocked(run, definition, tree)) {
      badges.push("Capstone Ready");
    } else if (rank < 6) {
      const pointsNeeded = Math.max(0, 6 - rank);
      badges.push(`Needs ${pointsNeeded} More Point${pointsNeeded === 1 ? "" : "s"}`);
    } else if (!hasLearnedBridgeSkill(run, tree)) {
      badges.push("Learn Bridge Skill");
    } else {
      badges.push("Capstone Locked");
    }
    return badges;
  }

  function buildAttributeAction(run: RunState, attribute: string, title: string, description: string, previewLines: string[]) {
    const canSpend = run.progression.attributePointsAvailable > 0;
    return {
      id: `progression_attribute_${attribute}`,
      category: "progression",
      title,
      subtitle: "Allocate Attribute",
      description,
      previewLines: [
        ...previewLines,
        `${title} rank ${toBonusValue((run.progression.attributes as unknown as Record<string, number>)?.[attribute])}.`,
        canSpend
          ? `${run.progression.attributePointsAvailable} attribute point${run.progression.attributePointsAvailable === 1 ? "" : "s"} ready.`
          : "Level up to unlock another attribute point.",
      ],
      cost: 0,
      actionLabel: canSpend ? "Allocate" : "Locked",
      disabled: !canSpend,
    };
  }

  function buildClassTreeAction(
    run: RunState,
    definition: RuntimeClassProgressionDefinition | null,
    tree: RuntimeClassTreeDefinition,
    treeSummary: RunClassTreeSummary | null
  ) {
    const treeRank = treeSummary?.rank || 0;
    const maxRank = treeSummary?.maxRank || Math.max(1, toBonusValue(tree.maxRank, tree.skills.length));
    const canSpend = run.progression.classPointsAvailable > 0 && treeRank < maxRank;
    const threshold = Math.max(1, toBonusValue(tree.unlockThreshold, 2));
    const bonusPreview = Array.isArray(treeSummary?.bonusLines) ? treeSummary.bonusLines.slice(0, runtimeWindow.ROUGE_LIMITS.BONUS_PREVIEW) : [];
    const favoredLead = isTreeFavoredForCapstone(run, definition, tree.id);
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
        `Tree rank ${treeRank}/${maxRank}. Learned skills ${treeSummary?.unlockedSkills || 0}. Rank-eligible skills ${treeSummary?.availableSkills || 0}.`,
        treeSummary?.nextUnlock || "Next unlock path unavailable.",
        `Bridge ready: ${isBridgeSlotUnlocked(run, tree) ? "yes" : "no"}. Capstone ready: ${isCapstoneSlotUnlocked(run, definition, tree) ? "yes" : "no"}. Favored lead: ${favoredLead ? "yes" : "no"}.`,
        `Every ${threshold} rank-eligible skill${threshold === 1 ? "" : "s"} grants an extra tree passive.`,
        ...(bonusPreview.length > 0 ? bonusPreview : ["No derived tree bonuses yet."]),
      ],
      cost: 0, actionLabel, disabled: !canSpend,
    };
  }

  function listProgressionActions(run: RunState, content: GameContent) {
    if (!run?.progression) { return []; }
    const progressionSummary = getProgressionSummary(run, content);
    const treeSummaries = new Map<string, RunClassTreeSummary>(progressionSummary.treeSummaries.map((entry: RunClassTreeSummary) => [entry.treeId, entry]));
    const actions = [
      buildProgressionAction(run, "vitality", "Vitality Drill", "Convert one banked skill point into permanent hero durability.", ["Hero max Life +4."]),
      buildProgressionAction(run, "focus", "Focus Drill", "Convert one banked skill point into permanent hero casting stamina.", ["Hero max Energy +1.", "Potion healing +1."]),
      buildProgressionAction(run, "command", "Command Drill", "Convert one banked skill point into permanent mercenary pressure.", ["Mercenary attack +1.", "Mercenary max Life +3."]),
      buildAttributeAction(run, "strength", "Strength", "Invest in raw physical power for higher card damage.", ["Hero card damage +1."]),
      buildAttributeAction(run, "dexterity", "Dexterity", "Invest in timing and control for stronger guard skills.", ["Guard skills +1."]),
      buildAttributeAction(run, "vitality", "Vitality", "Invest in durability for a larger Life pool.", ["Hero max Life +3."]),
      buildAttributeAction(run, "energy", "Energy", "Invest in spell fuel for mana growth and burn scaling.", ["Every 2 ranks: Hero max Energy +1.", "Every 2 ranks: Burn +1."]),
    ];
    const classProgression = getClassProgression(content, run.classId);
    listClassTrees(classProgression).forEach((tree: RuntimeClassTreeDefinition) => {
      actions.push(buildClassTreeAction(run, classProgression, tree, treeSummaries.get(tree.id) || null));
    });
    return actions;
  }

  function applyProgressionAction(run: RunState, actionId: string, content: GameContent) {
    if (!actionId.startsWith("progression_spend_") && !actionId.startsWith("progression_attribute_") && !actionId.startsWith("progression_tree_")) {
      return { ok: false, message: "Unknown progression action." };
    }
    if (actionId.startsWith("progression_spend_")) {
      if (run.progression.skillPointsAvailable <= 0) { return { ok: false, message: "No banked skill points are available." }; }
      const track = actionId.replace("progression_spend_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultTraining(), track)) { return { ok: false, message: "Unknown progression track." }; }
      run.progression.trainingPointsSpent += 1;
      run.progression.skillPointsAvailable = Math.max(0, run.progression.skillPointsAvailable - 1);
      (run.progression.training as Record<string, number>)[track] += 1;
      applyTrainingRank(run, track);
      return { ok: true, message: "Training updated." };
    }
    if (actionId.startsWith("progression_attribute_")) {
      if (run.progression.attributePointsAvailable <= 0) { return { ok: false, message: "No attribute points are available." }; }
      const attribute = actionId.replace("progression_attribute_", "");
      if (!Object.prototype.hasOwnProperty.call(createDefaultAttributes(), attribute)) { return { ok: false, message: "Unknown attribute." }; }
      run.progression.attributePointsSpent += 1;
      run.progression.attributePointsAvailable = Math.max(0, run.progression.attributePointsAvailable - 1);
      (run.progression.attributes as unknown as Record<string, number>)[attribute] += 1;
      return { ok: true, message: "Attributes updated." };
    }
    if (run.progression.classPointsAvailable <= 0) { return { ok: false, message: "No class points are available." }; }
    const treeId = actionId.replace("progression_tree_", "");
    const classProgression = getClassProgression(content, run.classId);
    const tree = classProgression?.trees?.find((entry: RuntimeClassTreeDefinition) => entry.id === treeId) || null;
    if (!tree) { return { ok: false, message: "Unknown class progression tree." }; }
    if (getTreeRank(run, treeId) >= Math.max(1, toBonusValue(tree.maxRank, tree.skills.length))) {
      return { ok: false, message: "That class tree is fully invested for this run." };
    }
    run.progression.classPointsSpent += 1;
    run.progression.classPointsAvailable = Math.max(0, run.progression.classPointsAvailable - 1);
    run.progression.classProgression.treeRanks[treeId] = toBonusValue(run.progression.classProgression.treeRanks?.[treeId]) + 1;
    h.updateFavoredTree(run, treeId);
    syncUnlockedClassSkills(run, content);
    return { ok: true, message: "Class progression updated." };
  }

  function buildTrainingSlotViewModel(run: RunState, definition: RuntimeClassProgressionDefinition | null, slotKey: RunSkillBarSlotKey) {
    const meta = TRAINING_SLOT_META[slotKey];
    const unlocked = isTrainingSlotUnlocked(run, definition, slotKey);
    const equippedSkillId = run.progression?.classProgression?.equippedSkillBar?.[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] || "";
    const equippedSkill = getSkillDefinition(definition, equippedSkillId);
    const equippedSkillName = equippedSkill?.name || "";
    let statusLabel = "Locked";
    if (equippedSkill) { statusLabel = "Equipped"; }
    else if (unlocked) { statusLabel = "Available"; }
    return {
      slotKey, slotNumber: meta.slotNumber, roleLabel: meta.roleLabel, unlocked,
      statusLabel,
      gateLabel: unlocked ? `${meta.roleLabel} slot is ready.` : meta.lockedLabel,
      equippedSkillId, equippedSkillName,
      family: equippedSkill?.family || "",
      cost: Math.max(0, toBonusValue(equippedSkill?.cost)),
      cooldown: Math.max(0, toBonusValue(equippedSkill?.cooldown)),
      shortRuleText: equippedSkill?.summary || (unlocked ? `No ${meta.roleLabel.toLowerCase()} skill equipped yet.` : meta.lockedLabel),
    };
  }

  function getTrainingSkillState(
    run: RunState, definition: RuntimeClassProgressionDefinition | null,
    tree: RuntimeClassTreeDefinition, skill: RuntimeClassSkillDefinition
  ): TrainingSkillViewModel["state"] {
    const equipped = Object.values(run.progression?.classProgression?.equippedSkillBar || {}).includes(skill.id);
    if (equipped) { return "equipped"; }
    if (skill.isStarter || skill.slot === 1 || skill.tier === "starter") { return "starter"; }
    if ((run.progression?.classProgression?.unlockedSkillIds || []).includes(skill.id)) { return "unlocked"; }
    if (getSkillEligibility(run, definition, tree, skill).eligible) { return "eligible"; }
    return "locked";
  }

  function buildTrainingSkillViewModel(
    run: RunState, definition: RuntimeClassProgressionDefinition | null,
    tree: RuntimeClassTreeDefinition, skill: RuntimeClassSkillDefinition
  ): TrainingSkillViewModel {
    const state = getTrainingSkillState(run, definition, tree, skill);
    const eligibility = getSkillEligibility(run, definition, tree, skill);
    let gateLabel = eligibility.gateLabel;
    if (state === "equipped") { gateLabel = "Equipped on the skill bar."; }
    else if (state === "starter") { gateLabel = "Starter skill for this run."; }
    else if (state === "unlocked") { gateLabel = "Learned and ready to equip."; }
    return {
      skillId: skill.id, treeId: tree.id, treeName: tree.name, name: skill.name,
      family: skill.family, slot: skill.slot, tier: skill.tier,
      requiredLevel: skill.requiredLevel, cost: skill.cost, cooldown: skill.cooldown,
      summary: skill.summary, exactText: skill.exactText, state, gateLabel,
      isStarter: Boolean(skill.isStarter), oncePerBattle: Boolean(skill.oncePerBattle),
      chargeCount: Math.max(0, toBonusValue(skill.chargeCount)),
    };
  }

  function buildTrainingScreenModel(appState: AppState, content: GameContent): TrainingScreenModel | null {
    const run = appState?.run;
    if (!run || (appState.phase !== "safe_zone" && appState.phase !== "act_transition")) { return null; }
    syncUnlockedClassSkills(run, content);
    const definition = getClassProgression(content, run.classId);
    if (!definition) { return null; }
    const trees = listClassTrees(definition);
    const selectedTreeId = trees.some((tree: RuntimeClassTreeDefinition) => tree.id === appState.ui.trainingView.selectedTreeId)
      ? appState.ui.trainingView.selectedTreeId
      : run.progression?.classProgression?.favoredTreeId || trees[0]?.id || "";
    const selectedTree = trees.find((tree: RuntimeClassTreeDefinition) => tree.id === selectedTreeId) || trees[0] || null;
    const selectedSkill = getSkillDefinition(definition, appState.ui.trainingView.selectedSkillId || "");
    const selectedSkillId = selectedSkill && getSkillTreeForSkill(definition, selectedSkill.id)?.id === selectedTreeId
      ? selectedSkill.id : selectedTree?.skills[0]?.id || "";
    const compareSkillId = getSkillDefinition(definition, appState.ui.trainingView.compareSkillId || "")
      ? appState.ui.trainingView.compareSkillId : "";
    const skillPointsAvailable = Math.max(0, toBonusValue(run.progression?.skillPointsAvailable));
    const classPointsAvailable = Math.max(0, toBonusValue(run.progression?.classPointsAvailable));
    const attributePointsAvailable = Math.max(0, toBonusValue(run.progression?.attributePointsAvailable));
    const slots = [
      buildTrainingSlotViewModel(run, definition, "slot1"),
      buildTrainingSlotViewModel(run, definition, "slot2"),
      buildTrainingSlotViewModel(run, definition, "slot3"),
    ];
    const treeModels = trees.map((tree: RuntimeClassTreeDefinition) => ({
      treeId: tree.id, treeName: tree.name,
      rank: getTreeRank(run, tree.id),
      maxRank: Math.max(1, toBonusValue(tree.maxRank, tree.skills.length)),
      favoredForCapstone: isTreeFavoredForCapstone(run, definition, tree.id),
      bridgeReady: isBridgeSlotUnlocked(run, tree),
      capstoneReady: isCapstoneSlotUnlocked(run, definition, tree),
      commitmentBadgeLabels: getTreeCommitmentBadgeLabels(run, definition, tree),
      nextMilestoneLabel: getTreeNextUnlockLabel(run, definition, tree),
      skills: tree.skills.map((skill: RuntimeClassSkillDefinition) => buildTrainingSkillViewModel(run, definition, tree, skill)),
    }));
    const flattenedSkills = treeModels.flatMap((tree: TrainingTreeViewModel) => tree.skills);
    const selectedSkillModel = flattenedSkills.find((skill: TrainingSkillViewModel) => skill.skillId === selectedSkillId) || null;
    const compareSkill = flattenedSkills.find((skill: TrainingSkillViewModel) => skill.skillId === compareSkillId) || null;
    return {
      classId: run.classId, className: run.className, level: run.level,
      mode: appState.ui.trainingView.mode || "browse",
      favoredTreeId: run.progression?.classProgression?.favoredTreeId || "",
      skillPointsAvailable, classPointsAvailable, attributePointsAvailable,
      slotStateLabel: `${slots.filter((slot: TrainingSlotViewModel) => slot.unlocked).length} / 3`,
      nextSlotGateLabel: getNextSlotGateLabel(run, definition),
      selectedTreeId: selectedTreeId || "", selectedSkillId: selectedSkillModel?.skillId || "",
      compareSkillId: compareSkill?.skillId || "", selectedSlot: appState.ui.trainingView.selectedSlot || "",
      slots,
      trees: treeModels, selectedSkill: selectedSkillModel, compareSkill,
      progressionActions: listProgressionActions(run, content),
    };
  }

  function unlockTrainingSkill(run: RunState, content: GameContent, skillId: string): ActionResult {
    const definition = getClassProgression(content, run.classId);
    const tree = getSkillTreeForSkill(definition, skillId);
    const skill = getSkillDefinition(definition, skillId);
    if (!tree || !skill) { return { ok: false, message: "That skill is not part of this class progression." }; }
    syncUnlockedClassSkills(run, content);
    if ((run.progression?.classProgression?.unlockedSkillIds || []).includes(skillId)) {
      return { ok: true, message: `${skill.name} is already learned.` };
    }
    const eligibility = getSkillEligibility(run, definition, tree, skill);
    if (!eligibility.eligible) { return { ok: false, message: eligibility.gateLabel }; }
    run.progression.classProgression.unlockedSkillIds = [...run.progression.classProgression.unlockedSkillIds, skillId];
    syncUnlockedClassSkills(run, content);
    return { ok: true, message: `${skill.name} learned.` };
  }

  function equipTrainingSkill(run: RunState, content: GameContent, slotKey: RunSkillBarSlotKey, skillId: string): ActionResult {
    const definition = getClassProgression(content, run.classId);
    const skill = getSkillDefinition(definition, skillId);
    if (!skill) { return { ok: false, message: "That skill is not available for this class." }; }
    if (slotKey === "slot1") {
      return { ok: false, message: "Slot 1 is fixed to the starter skill for this run." };
    }
    syncUnlockedClassSkills(run, content);
    if (!isSkillEquippableInSlot(run, definition, slotKey, skillId)) {
      return { ok: false, message: `${skill.name} cannot be equipped in that slot yet.` };
    }
    run.progression.classProgression.equippedSkillBar[`${slotKey}SkillId` as keyof RunEquippedSkillBarState] = skillId;
    syncUnlockedClassSkills(run, content);
    return { ok: true, message: `${skill.name} equipped to ${TRAINING_SLOT_META[slotKey].roleLabel}.` };
  }

  runtimeWindow.ROUGE_RUN_PROGRESSION = {
    buildProgressionBonuses, getProgressionSummary,
    syncLevelProgression: h.syncLevelProgression,
    syncUnlockedClassSkills,
    listProgressionActions, applyProgressionAction,
    buildTrainingScreenModel, unlockTrainingSkill, equipTrainingSkill,
  };
})();
