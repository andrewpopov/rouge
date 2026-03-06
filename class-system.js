(() => {
  const TREE_UNLOCK_LEVELS = [0, 6, 18, 30];

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getClassDefinition({ classCatalog, classId }) {
    if (!classCatalog || typeof classCatalog !== "object") {
      return null;
    }
    return classCatalog[classId] || null;
  }

  function getClassTree({ classCatalog, skillTreeCatalog, classId }) {
    const classDef = getClassDefinition({ classCatalog, classId });
    if (!classDef || typeof classDef.treeId !== "string") {
      return null;
    }
    return skillTreeCatalog?.[classDef.treeId] || null;
  }

  function getSpellEntriesForClass({ spellCatalog, classId }) {
    if (!spellCatalog || typeof spellCatalog !== "object" || typeof classId !== "string" || !classId.trim()) {
      return [];
    }
    return Object.values(spellCatalog).filter(
      (spell) => spell && typeof spell === "object" && spell.classId === classId && typeof spell.id === "string"
    );
  }

  function getSpellDefinition({ spellCatalog, spellId }) {
    if (!spellCatalog || typeof spellCatalog !== "object") {
      return null;
    }
    return typeof spellId === "string" ? spellCatalog[spellId] || null : null;
  }

  function getSpellBySkillId({ spellCatalog, skillId }) {
    if (!spellCatalog || typeof spellCatalog !== "object" || typeof skillId !== "string") {
      return null;
    }
    return (
      Object.values(spellCatalog).find(
        (spell) =>
          spell &&
          typeof spell === "object" &&
          typeof spell.linkedSkillId === "string" &&
          spell.linkedSkillId === skillId
      ) || null
    );
  }

  function createDefaultClassState({
    classCatalog = {},
    skillTreeCatalog = {},
    spellCatalog = {},
    classId = "",
  }) {
    const chosenClassId = classId && classCatalog[classId] ? classId : Object.keys(classCatalog)[0] || "";
    const classDef = getClassDefinition({ classCatalog, classId: chosenClassId });
    const tree = getClassTree({
      classCatalog,
      skillTreeCatalog,
      classId: chosenClassId,
    });

    const nodeRanks = {};
    (Array.isArray(tree?.nodes) ? tree.nodes : []).forEach((node) => {
      if (typeof node?.id === "string" && node.id.trim()) {
        nodeRanks[node.id] = 0;
      }
    });

    const spellRanks = {};
    getSpellEntriesForClass({
      spellCatalog,
      classId: chosenClassId,
    }).forEach((spell) => {
      const rankCapRaw = Number.parseInt(spell.rankCap, 10);
      const rankCap = Number.isInteger(rankCapRaw) && rankCapRaw > 0 ? rankCapRaw : 5;
      spellRanks[spell.id] = clamp(1, 1, rankCap);
    });

    return {
      classId: chosenClassId,
      level: 1,
      xp: 0,
      skillPoints: 0,
      statPoints: 0,
      allocatedStats: {
        strength: 0,
        dexterity: 0,
        vitality: 0,
        energy: 0,
      },
      nodeRanks,
      cooldowns: {},
      spellRanks,
      baseStats: deepClone(classDef?.baseStats || {}),
      baseResistances: deepClone(classDef?.baseResistances || {}),
    };
  }

  function sanitizeNodeRanks({ tree, rawRanks }) {
    const fallback = {};
    const source = rawRanks && typeof rawRanks === "object" ? rawRanks : {};
    (Array.isArray(tree?.nodes) ? tree.nodes : []).forEach((node) => {
      if (!node || typeof node.id !== "string") {
        return;
      }
      const maxRankRaw = Number.parseInt(node.maxRank, 10);
      const maxRank = Number.isInteger(maxRankRaw) && maxRankRaw > 0 ? maxRankRaw : 1;
      const rankRaw = Number.parseInt(source[node.id], 10);
      fallback[node.id] = Number.isInteger(rankRaw) ? clamp(rankRaw, 0, maxRank) : 0;
    });
    return fallback;
  }

  function sanitizeClassState({
    classCatalog = {},
    skillTreeCatalog = {},
    spellCatalog = {},
    levelTable = [],
    rawState = null,
  }) {
    const fallback = createDefaultClassState({
      classCatalog,
      skillTreeCatalog,
      spellCatalog,
      classId:
        rawState && typeof rawState.classId === "string" ? rawState.classId : "",
    });
    const source = rawState && typeof rawState === "object" ? rawState : {};
    const tree = getClassTree({
      classCatalog,
      skillTreeCatalog,
      classId: fallback.classId,
    });

    const levelCap = Math.max(1, Array.isArray(levelTable) ? levelTable.length - 1 : 1);
    const levelRaw = Number.parseInt(source.level, 10);
    const level = Number.isInteger(levelRaw) ? clamp(levelRaw, 1, levelCap) : 1;
    const xpRaw = Number.parseInt(source.xp, 10);
    const xp = Number.isInteger(xpRaw) ? Math.max(0, xpRaw) : 0;
    const skillPointsRaw = Number.parseInt(source.skillPoints, 10);
    const skillPoints = Number.isInteger(skillPointsRaw) ? Math.max(0, skillPointsRaw) : 0;
    const statPointsRaw = Number.parseInt(source.statPoints, 10);
    const statPoints = Number.isInteger(statPointsRaw) ? Math.max(0, statPointsRaw) : 0;
    const cooldowns = Object.fromEntries(
      Object.entries(source.cooldowns && typeof source.cooldowns === "object" ? source.cooldowns : {})
        .map(([skillId, turns]) => [skillId, Number.parseInt(turns, 10)])
        .filter(([, turns]) => Number.isInteger(turns) && turns > 0)
    );
    const spellRanks = Object.fromEntries(
      getSpellEntriesForClass({
        spellCatalog,
        classId: fallback.classId,
      }).map((spell) => {
        const rankCapRaw = Number.parseInt(spell.rankCap, 10);
        const rankCap = Number.isInteger(rankCapRaw) && rankCapRaw > 0 ? rankCapRaw : 5;
        const rankRaw = Number.parseInt(source.spellRanks?.[spell.id], 10);
        return [spell.id, Number.isInteger(rankRaw) ? clamp(rankRaw, 1, rankCap) : 1];
      })
    );
    const allocatedStats = {
      strength: Math.max(0, Number.parseInt(source.allocatedStats?.strength, 10) || 0),
      dexterity: Math.max(0, Number.parseInt(source.allocatedStats?.dexterity, 10) || 0),
      vitality: Math.max(0, Number.parseInt(source.allocatedStats?.vitality, 10) || 0),
      energy: Math.max(0, Number.parseInt(source.allocatedStats?.energy, 10) || 0),
    };

    return {
      ...fallback,
      level,
      xp,
      skillPoints,
      statPoints,
      allocatedStats,
      nodeRanks: sanitizeNodeRanks({
        tree,
        rawRanks: source.nodeRanks,
      }),
      cooldowns,
      spellRanks,
      baseStats: {
        ...fallback.baseStats,
        ...(source.baseStats && typeof source.baseStats === "object" ? source.baseStats : {}),
      },
      baseResistances: {
        ...fallback.baseResistances,
        ...(source.baseResistances && typeof source.baseResistances === "object"
          ? source.baseResistances
          : {}),
      },
    };
  }

  function getNodeById({ classCatalog, skillTreeCatalog, classState, nodeId }) {
    const tree = getClassTree({
      classCatalog,
      skillTreeCatalog,
      classId: classState?.classId,
    });
    return (Array.isArray(tree?.nodes) ? tree.nodes : []).find((node) => node?.id === nodeId) || null;
  }

  function canUpgradeNode({ classCatalog, skillTreeCatalog, classState, nodeId }) {
    if (!classState || typeof nodeId !== "string" || !nodeId.trim()) {
      return false;
    }
    const node = getNodeById({
      classCatalog,
      skillTreeCatalog,
      classState,
      nodeId,
    });
    if (!node) {
      return false;
    }
    const currentRank = Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0;
    const maxRankRaw = Number.parseInt(node.maxRank, 10);
    const maxRank = Number.isInteger(maxRankRaw) && maxRankRaw > 0 ? maxRankRaw : 1;
    if (currentRank >= maxRank) {
      return false;
    }

    const costRaw = Number.parseInt(node.cost, 10);
    const cost = Number.isInteger(costRaw) && costRaw > 0 ? costRaw : 1;
    if ((classState.skillPoints || 0) < cost) {
      return false;
    }

    const prereq = Array.isArray(node.prereq) ? node.prereq : [];
    return prereq.every((requiredNodeId) => (Number.parseInt(classState.nodeRanks?.[requiredNodeId], 10) || 0) > 0);
  }

  function upgradeNode({ classCatalog, skillTreeCatalog, classState, nodeId }) {
    if (!canUpgradeNode({ classCatalog, skillTreeCatalog, classState, nodeId })) {
      return null;
    }
    const node = getNodeById({
      classCatalog,
      skillTreeCatalog,
      classState,
      nodeId,
    });
    const costRaw = Number.parseInt(node.cost, 10);
    const cost = Number.isInteger(costRaw) && costRaw > 0 ? costRaw : 1;
    const currentRank = Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0;

    classState.skillPoints -= cost;
    classState.nodeRanks[node.id] = currentRank + 1;
    return {
      node,
      nextRank: classState.nodeRanks[node.id],
      remainingPoints: classState.skillPoints,
    };
  }

  function getNodeBonus({ classCatalog, skillTreeCatalog, classState, effectId }) {
    if (!classState || typeof effectId !== "string" || !effectId.trim()) {
      return 0;
    }
    const tree = getClassTree({
      classCatalog,
      skillTreeCatalog,
      classId: classState.classId,
    });
    return (Array.isArray(tree?.nodes) ? tree.nodes : []).reduce((sum, node) => {
      const rank = Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0;
      if (rank <= 0) {
        return sum;
      }
      const value = Number.parseInt(node?.effects?.[effectId], 10);
      return Number.isInteger(value) ? sum + value * rank : sum;
    }, 0);
  }

  function getUnlockedSkillIds({ classCatalog, skillTreeCatalog, classState, skillCatalog = {} }) {
    if (!classState) {
      return [];
    }
    const classDef = getClassDefinition({
      classCatalog,
      classId: classState.classId,
    });
    const starterSkills = Array.isArray(classDef?.starterSkillIds) ? classDef.starterSkillIds : [];
    const tree = getClassTree({
      classCatalog,
      skillTreeCatalog,
      classId: classState.classId,
    });
    const unlockedFromTreeRanks = [];
    const treeNodes = Array.isArray(tree?.nodes) ? tree.nodes : [];
    const classSkills = Object.values(skillCatalog || {}).filter(
      (skill) => skill && typeof skill === "object" && skill.classId === classState.classId
    );
    const unlockCapsByTreeId = Object.fromEntries(
      treeNodes
        .map((node) => {
          const unlockTreeId =
            typeof node?.effects?.unlock_tree_id === "string" ? node.effects.unlock_tree_id.trim() : "";
          if (!unlockTreeId) {
            return null;
          }
          const rank = Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0;
          const cappedRank = clamp(rank, 0, TREE_UNLOCK_LEVELS.length - 1);
          return [unlockTreeId, TREE_UNLOCK_LEVELS[cappedRank] || 0];
        })
        .filter(Boolean)
    );
    classSkills.forEach((skill) => {
      const requiredLevel = Number.parseInt(skill.requiredLevel, 10) || 1;
      const unlockCap = unlockCapsByTreeId[skill.treeId] || 0;
      if (requiredLevel <= Math.min(classState.level || 1, unlockCap)) {
        unlockedFromTreeRanks.push(skill.id);
      }
    });
    const unlockedByTree = (Array.isArray(tree?.nodes) ? tree.nodes : [])
      .filter((node) => (Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0) > 0)
      .map((node) => (typeof node?.effects?.unlock_skill === "string" ? node.effects.unlock_skill.trim() : ""))
      .filter(Boolean);
    return [...new Set([...starterSkills, ...unlockedFromTreeRanks, ...unlockedByTree])];
  }

  function gainXp({ classState, amount = 0, levelTable = [] }) {
    if (!classState || !Array.isArray(levelTable) || levelTable.length < 2) {
      return {
        gainedLevels: 0,
        nextLevel: classState?.level || 1,
        skillPointsGained: 0,
        statPointsGained: 0,
      };
    }

    const xpGain = Number.parseInt(amount, 10);
    if (!Number.isInteger(xpGain) || xpGain <= 0) {
      return {
        gainedLevels: 0,
        nextLevel: classState.level,
        skillPointsGained: 0,
        statPointsGained: 0,
      };
    }

    classState.xp = Math.max(0, (Number.parseInt(classState.xp, 10) || 0) + xpGain);
    let gainedLevels = 0;
    while (
      classState.level < levelTable.length - 1 &&
      classState.xp >= (Number.parseInt(levelTable[classState.level], 10) || Number.MAX_SAFE_INTEGER)
    ) {
      classState.level += 1;
      classState.skillPoints += 1;
      classState.statPoints += 5;
      gainedLevels += 1;
    }

    return {
      gainedLevels,
      nextLevel: classState.level,
      skillPointsGained: gainedLevels,
      statPointsGained: gainedLevels * 5,
    };
  }

  function tickSkillCooldowns({ classState }) {
    if (!classState || typeof classState !== "object") {
      return;
    }
    const cooldowns = classState.cooldowns && typeof classState.cooldowns === "object" ? classState.cooldowns : {};
    Object.keys(cooldowns).forEach((skillId) => {
      const turns = Number.parseInt(cooldowns[skillId], 10);
      if (!Number.isInteger(turns) || turns <= 1) {
        delete cooldowns[skillId];
      } else {
        cooldowns[skillId] = turns - 1;
      }
    });
    classState.cooldowns = cooldowns;
  }

  function getSkillCooldown({ classState, skillId }) {
    const value = Number.parseInt(classState?.cooldowns?.[skillId], 10);
    return Number.isInteger(value) && value > 0 ? value : 0;
  }

  function canUseSkill({
    classCatalog,
    skillTreeCatalog,
    classState,
    skillCatalog,
    skillId,
    phase = "encounter",
    combatSubphase = "player_turn",
    energy = 0,
  }) {
    if (phase !== "encounter" || combatSubphase !== "player_turn" || !classState || !skillCatalog?.[skillId]) {
      return false;
    }
    const unlocked = new Set(
      getUnlockedSkillIds({
        classCatalog,
        skillTreeCatalog,
        classState,
        skillCatalog,
      })
    );
    if (!unlocked.has(skillId)) {
      return false;
    }
    if (getSkillCooldown({ classState, skillId }) > 0) {
      return false;
    }
    const skill = skillCatalog[skillId];
    const costRaw = Number.parseInt(skill.energyCost, 10);
    const energyCost = Number.isInteger(costRaw) && costRaw > 0 ? costRaw : 0;
    return energy >= energyCost;
  }

  function useSkill({ classState, skillCatalog, skillId }) {
    if (!classState || !skillCatalog?.[skillId]) {
      return null;
    }
    const skill = skillCatalog[skillId];
    const cooldownRaw = Number.parseInt(skill.cooldown, 10);
    const cooldown = Number.isInteger(cooldownRaw) && cooldownRaw > 0 ? cooldownRaw : 0;
    if (!classState.cooldowns || typeof classState.cooldowns !== "object") {
      classState.cooldowns = {};
    }
    if (cooldown > 0) {
      classState.cooldowns[skillId] = cooldown;
    } else {
      delete classState.cooldowns[skillId];
    }
    return skill;
  }

  function getSpellRank({ classState, spellCatalog, spellId }) {
    const spell = getSpellDefinition({ spellCatalog, spellId });
    if (!spell) {
      return 1;
    }
    const rankCapRaw = Number.parseInt(spell.rankCap, 10);
    const rankCap = Number.isInteger(rankCapRaw) && rankCapRaw > 0 ? rankCapRaw : 5;
    const rankRaw = Number.parseInt(classState?.spellRanks?.[spellId], 10);
    return Number.isInteger(rankRaw) ? clamp(rankRaw, 1, rankCap) : 1;
  }

  function gainSpellRank({ classState, spellCatalog, spellId, amount = 1 }) {
    const spell = getSpellDefinition({ spellCatalog, spellId });
    if (!classState || !spell) {
      return null;
    }
    const amountRaw = Number.parseInt(amount, 10);
    const increment = Number.isInteger(amountRaw) && amountRaw > 0 ? amountRaw : 0;
    if (increment <= 0) {
      return {
        spell,
        previousRank: getSpellRank({ classState, spellCatalog, spellId }),
        nextRank: getSpellRank({ classState, spellCatalog, spellId }),
        gained: 0,
      };
    }
    const rankCapRaw = Number.parseInt(spell.rankCap, 10);
    const rankCap = Number.isInteger(rankCapRaw) && rankCapRaw > 0 ? rankCapRaw : 5;
    const previousRank = getSpellRank({ classState, spellCatalog, spellId });
    const nextRank = clamp(previousRank + increment, 1, rankCap);
    if (!classState.spellRanks || typeof classState.spellRanks !== "object") {
      classState.spellRanks = {};
    }
    classState.spellRanks[spellId] = nextRank;
    return {
      spell,
      previousRank,
      nextRank,
      gained: nextRank - previousRank,
      rankCap,
    };
  }

  function getSpellPowerBreakdown({
    classCatalog,
    skillTreeCatalog,
    classState,
    skillCatalog = {},
    spellCatalog = {},
    spellId,
    deckCardIds = [],
  }) {
    const spell = getSpellDefinition({ spellCatalog, spellId });
    if (!spell) {
      return {
        totalValue: 0,
        totalBonus: 0,
      };
    }

    const baseValue = Math.max(0, Number.parseInt(spell.effect?.value, 10) || 0);
    const spellTreeId = typeof spell.treeId === "string" ? spell.treeId.trim() : "";
    const rank = getSpellRank({ classState, spellCatalog, spellId });
    const rankBonusPerLevel = Math.max(0, Number.parseInt(spell.rankBonusPerLevel, 10) || 0);
    const rankBonus = Math.max(0, rank - 1) * rankBonusPerLevel;
    const safeDeckCardIds = Array.isArray(deckCardIds) ? deckCardIds.filter((cardId) => typeof cardId === "string") : [];
    const sameTreeSpellIds = safeDeckCardIds.filter((cardId) => {
      const candidate = spellCatalog[cardId];
      return spellTreeId && candidate && candidate.classId === spell.classId && candidate.treeId === spellTreeId;
    });
    const sameTreeDistinctCount = new Set(sameTreeSpellIds.filter((cardId) => cardId !== spellId)).size;
    const sameTreeCopyCount = sameTreeSpellIds.filter((cardId) => cardId === spellId).length;
    const sameTreeDistinctBonus =
      sameTreeDistinctCount * Math.max(0, Number.parseInt(spell.deckSynergy?.sameTreeDistinctBonus, 10) || 0);
    const sameSpellCopyBonus =
      Math.max(0, sameTreeCopyCount - 1) *
      Math.max(0, Number.parseInt(spell.deckSynergy?.sameSpellCopyBonus, 10) || 0);
    const supportSkillIds = Array.isArray(spell.deckSynergy?.supportSkillIds) ? spell.deckSynergy.supportSkillIds : [];
    const supportSpellCards = safeDeckCardIds
      .map((cardId) => spellCatalog[cardId] || null)
      .filter(
        (candidate) =>
          candidate &&
          typeof candidate.linkedSkillId === "string" &&
          supportSkillIds.includes(candidate.linkedSkillId)
      );
    const supportPresenceBonus =
      supportSpellCards.length * Math.max(0, Number.parseInt(spell.deckSynergy?.supportPresenceBonus, 10) || 0);
    const supportRankBonus = supportSkillIds.reduce((sum, supportSkillId) => {
      const supportSpell = getSpellBySkillId({ spellCatalog, skillId: supportSkillId });
      if (!supportSpell) {
        return sum;
      }
      const supportRank = getSpellRank({
        classState,
        spellCatalog,
        spellId: supportSpell.id,
      });
      return (
        sum +
        Math.max(0, supportRank - 1) *
          Math.max(0, Number.parseInt(spell.deckSynergy?.supportRankBonusPerLevel, 10) || 0)
      );
    }, 0);
    const role = typeof spell.cardRole === "string" ? spell.cardRole.trim().toLowerCase() : "spell";
    const treeNodeBonus = getNodeBonus({
      classCatalog,
      skillTreeCatalog,
      classState,
      effectId: `${role === "attack" ? "tree_attack_bonus_" : "tree_spell_bonus_"}${spellTreeId}`,
    });
    const totalBonus =
      rankBonus + sameTreeDistinctBonus + sameSpellCopyBonus + supportPresenceBonus + supportRankBonus + treeNodeBonus;
    return {
      spell,
      skill: skillCatalog[spell.linkedSkillId] || null,
      baseValue,
      rank,
      rankBonus,
      sameTreeDistinctCount,
      sameTreeDistinctBonus,
      sameSpellCopyCount: sameTreeCopyCount,
      sameSpellCopyBonus,
      supportCount: supportSpellCards.length,
      supportPresenceBonus,
      supportRankBonus,
      treeNodeBonus,
      totalBonus,
      totalValue: baseValue + totalBonus,
    };
  }

  function getLevelProgress({ classState, levelTable = [] }) {
    const level = Number.parseInt(classState?.level, 10);
    const safeLevel = Number.isInteger(level) && level > 0 ? level : 1;
    const xp = Number.parseInt(classState?.xp, 10);
    const safeXp = Number.isInteger(xp) && xp >= 0 ? xp : 0;
    const currentFloor = Number.parseInt(levelTable[safeLevel - 1], 10) || 0;
    const nextThreshold = Number.parseInt(levelTable[safeLevel], 10);
    if (!Number.isInteger(nextThreshold) || nextThreshold <= currentFloor) {
      return {
        current: safeXp,
        needed: safeXp,
        ratio: 1,
      };
    }
    const clamped = clamp(safeXp, currentFloor, nextThreshold);
    return {
      current: clamped - currentFloor,
      needed: nextThreshold - currentFloor,
      ratio: (clamped - currentFloor) / (nextThreshold - currentFloor),
    };
  }

  window.BRASSLINE_CLASS_SYSTEM = {
    createDefaultClassState,
    sanitizeClassState,
    getClassTree,
    canUpgradeNode,
    upgradeNode,
    getNodeBonus,
    getUnlockedSkillIds,
    gainXp,
    tickSkillCooldowns,
    getSkillCooldown,
    canUseSkill,
    useSkill,
    getSpellRank,
    gainSpellRank,
    getSpellPowerBreakdown,
    getLevelProgress,
  };
})();
