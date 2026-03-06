(() => {
  const DEFAULT_QUEST_CATALOG = {
    blackroad_cache: {
      id: "blackroad_cache",
      kind: "chest_cache",
      title: "Blackroad Cache",
      description: "A contraband cache is wired into the route. Reach it cleanly and claim the relic inside.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/path_crypt-entrance.svg",
      rewardPool: [
        {
          gearId: "blackroad_glaive",
          gearTitle: "Blackroad Glaive",
        },
        {
          gearId: "reliquary_heart",
          gearTitle: "Reliquary Heart",
        },
      ],
    },
    ashen_rite: {
      id: "ashen_rite",
      kind: "shrine_attunement",
      title: "Ashen Rite",
      description: "A shrine along the map can stabilize the reactor if you reach it under control.",
      icon: "./assets/curated/themes/diablo-inspired/icons/cards/10_burning-embers.svg",
      rewards: {
        statPoints: 2,
      },
    },
    crown_bounty: {
      id: "crown_bounty",
      kind: "boss_bounty",
      title: "Crown Bounty",
      description: "A crown contract has been posted on one boss sector. Finish the fight under strict terms.",
      icon: "./assets/curated/themes/diablo-inspired/icons/ui/alert_death-skull.svg",
      rewards: {
        skillPoints: 1,
      },
    },
  };

  const SUPPORTED_QUEST_KINDS = new Set(["chest_cache", "shrine_attunement", "boss_bounty"]);

  function defaultClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function normalizePositiveInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
  }

  function createDeterministicRandom(seed = 1) {
    let state = (Number.isInteger(seed) && seed > 0 ? seed : 1) >>> 0;
    if (state === 0) {
      state = 1;
    }
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  function uniqueStringList(values) {
    return [...new Set(
      (Array.isArray(values) ? values : [])
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    )];
  }

  function normalizeQuestKind(kind) {
    const normalized = normalizeText(kind).toLowerCase();
    return SUPPORTED_QUEST_KINDS.has(normalized) ? normalized : "";
  }

  function normalizeNodeType(type) {
    const normalized = normalizeText(type).toLowerCase();
    return normalized || "enemy";
  }

  function normalizeRewardPool(rawPool) {
    const source = Array.isArray(rawPool) ? rawPool : [];
    return source
      .map((entry) => {
        const gearId = normalizeText(entry?.gearId);
        if (!gearId) {
          return null;
        }
        return {
          gearId,
          gearTitle: normalizeText(entry?.gearTitle, gearId),
        };
      })
      .filter(Boolean);
  }

  function normalizeRewards(rawRewards) {
    const source = rawRewards && typeof rawRewards === "object" ? rawRewards : {};
    const rewards = {};
    ["gold", "healingPotions", "itemUpgradeTokens", "hull", "statPoints", "skillPoints"].forEach((key) => {
      const value = Number.parseInt(source[key], 10);
      if (Number.isInteger(value) && value > 0) {
        rewards[key] = value;
      }
    });

    const gearId = normalizeText(source.gearId);
    if (gearId) {
      rewards.gearId = gearId;
      rewards.gearTitle = normalizeText(source.gearTitle, gearId);
    }

    return rewards;
  }

  function cloneQuestCatalog(catalog = DEFAULT_QUEST_CATALOG) {
    const source = catalog && typeof catalog === "object" ? Object.values(catalog) : [];
    return Object.fromEntries(
      source
        .filter((quest) => quest && typeof quest === "object" && typeof quest.id === "string")
        .map((quest) => {
          const id = normalizeText(quest.id);
          const kind = normalizeQuestKind(quest.kind);
          if (!id || !kind) {
            return null;
          }
          return [
            id,
            {
              id,
              kind,
              title: normalizeText(quest.title, id),
              description: normalizeText(quest.description),
              icon: normalizeText(quest.icon),
              rewards: normalizeRewards(quest.rewards),
              rewardPool: normalizeRewardPool(quest.rewardPool),
            },
          ];
        })
        .filter(Boolean)
    );
  }

  function createDefaultQuestState() {
    return {
      activeQuestIds: [],
      activeQuests: [],
      completedQuestIds: [],
      failedQuestIds: [],
      generatedFromSeed: 0,
    };
  }

  function hasRouteNodes(stageNodesBySector) {
    return Array.isArray(stageNodesBySector) && stageNodesBySector.some((nodes) => Array.isArray(nodes) && nodes.length > 0);
  }

  function getSectorName(runSectors, sectorIndex) {
    const sector = Array.isArray(runSectors) ? runSectors[sectorIndex] : null;
    return normalizeText(sector?.name, `Sector ${sectorIndex + 1}`);
  }

  function getNodeCandidates({ runSectors, stageNodesBySector, nodeType }) {
    return (Array.isArray(stageNodesBySector) ? stageNodesBySector : []).flatMap((nodes, sectorIndex) =>
      (Array.isArray(nodes) ? nodes : [])
        .map((node, nodeIndex) => {
          const normalizedType = normalizeNodeType(node?.type);
          if (normalizedType !== nodeType) {
            return null;
          }
          return {
            sectorIndex,
            sectorName: getSectorName(runSectors, sectorIndex),
            nodeIndex,
            nodeId: normalizeText(node?.id, `s${sectorIndex + 1}_n${nodeIndex + 1}_${normalizedType}`),
            nodeType: normalizedType,
            nodeLabel: normalizeText(node?.label, normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)),
          };
        })
        .filter(Boolean)
    );
  }

  function getBossSectorCandidates(runSectors) {
    return (Array.isArray(runSectors) ? runSectors : [])
      .map((sector, sectorIndex) =>
        sector?.boss
          ? {
              sectorIndex,
              sectorName: getSectorName(runSectors, sectorIndex),
            }
          : null
      )
      .filter(Boolean);
  }

  function pickDeterministicEntry(entries, random, excludedSectorIndexes = null) {
    const source = Array.isArray(entries) ? entries : [];
    if (source.length === 0) {
      return null;
    }
    const excluded = excludedSectorIndexes instanceof Set ? excludedSectorIndexes : null;
    const preferred = excluded ? source.filter((entry) => !excluded.has(entry.sectorIndex)) : source;
    const pool = preferred.length > 0 ? preferred : source;
    const index = Math.floor(random() * pool.length);
    return pool[index] || pool[0] || null;
  }

  function pickRewardFromPool(pool, random) {
    const rewards = normalizeRewardPool(pool);
    if (rewards.length === 0) {
      return {};
    }
    const index = Math.floor(random() * rewards.length);
    const reward = rewards[index] || rewards[0];
    return {
      gearId: reward.gearId,
      gearTitle: reward.gearTitle,
    };
  }

  function createChestQuest({ template, target, reward }) {
    return {
      id: `${template.id}_${target.nodeId}`,
      templateId: template.id,
      kind: template.kind,
      title: template.title,
      description: `Secure the cache at ${target.sectorName} without taking Hull damage in that sector.`,
      icon: template.icon,
      target: {
        sectorIndex: target.sectorIndex,
        sectorName: target.sectorName,
        nodeId: target.nodeId,
        nodeType: target.nodeType,
        nodeLabel: target.nodeLabel,
      },
      objective: {
        label: "Take no Hull damage in that sector before opening the cache.",
        damageLimit: 0,
      },
      rewards: reward,
    };
  }

  function getShrineHeatLimit(sectorIndex) {
    return Math.max(20, 36 - Math.max(0, sectorIndex) * 2);
  }

  function createShrineQuest({ template, target }) {
    const heatLimit = getShrineHeatLimit(target.sectorIndex);
    return {
      id: `${template.id}_${target.nodeId}`,
      templateId: template.id,
      kind: template.kind,
      title: template.title,
      description: `Reach the shrine at ${target.sectorName} with reactor heat at ${heatLimit} or lower.`,
      icon: template.icon,
      target: {
        sectorIndex: target.sectorIndex,
        sectorName: target.sectorName,
        nodeId: target.nodeId,
        nodeType: target.nodeType,
        nodeLabel: target.nodeLabel,
      },
      objective: {
        label: `Arrive at the shrine with ${heatLimit} Heat or less.`,
        heatLimit,
      },
      rewards: {
        ...template.rewards,
      },
    };
  }

  function getBossDamageLimit(sectorIndex) {
    return Math.max(1, 5 - Math.floor(Math.max(0, sectorIndex) / 2));
  }

  function createBossQuest({ template, target }) {
    const damageLimit = getBossDamageLimit(target.sectorIndex);
    return {
      id: `${template.id}_s${target.sectorIndex + 1}`,
      templateId: template.id,
      kind: template.kind,
      title: template.title,
      description: `Finish the boss sector at ${target.sectorName} while taking ${damageLimit} or less Hull damage.`,
      icon: template.icon,
      target: {
        sectorIndex: target.sectorIndex,
        sectorName: target.sectorName,
        nodeId: "",
        nodeType: "boss",
        nodeLabel: "Boss",
      },
      objective: {
        label: `Defeat the boss while taking ${damageLimit} or less Hull damage in that sector.`,
        damageLimit,
      },
      rewards: {
        ...template.rewards,
      },
    };
  }

  function buildGeneratedQuests({ questCatalog, runSectors, stageNodesBySector, runSeed }) {
    if (!hasRouteNodes(stageNodesBySector)) {
      return [];
    }

    const catalog = questCatalog && typeof questCatalog === "object" ? questCatalog : cloneQuestCatalog();
    const safeRunSeed = Number.isInteger(runSeed) && runSeed > 0 ? runSeed : 1;
    const random = createDeterministicRandom((safeRunSeed ^ 0x5f3759df) >>> 0);
    const quests = [];
    const usedSectorIndexes = new Set();

    const chestTemplate = catalog.blackroad_cache;
    if (chestTemplate) {
      const chestTargets = getNodeCandidates({
        runSectors,
        stageNodesBySector,
        nodeType: "chest",
      });
      const chestTarget = pickDeterministicEntry(chestTargets, random, usedSectorIndexes);
      if (chestTarget) {
        const reward = pickRewardFromPool(chestTemplate.rewardPool, random);
        quests.push(
          createChestQuest({
            template: chestTemplate,
            target: chestTarget,
            reward,
          })
        );
        usedSectorIndexes.add(chestTarget.sectorIndex);
      }
    }

    const shrineTemplate = catalog.ashen_rite;
    if (shrineTemplate) {
      const shrineTargets = getNodeCandidates({
        runSectors,
        stageNodesBySector,
        nodeType: "shrine",
      });
      const shrineTarget = pickDeterministicEntry(shrineTargets, random, usedSectorIndexes);
      if (shrineTarget) {
        quests.push(
          createShrineQuest({
            template: shrineTemplate,
            target: shrineTarget,
          })
        );
        usedSectorIndexes.add(shrineTarget.sectorIndex);
      }
    }

    const bossTemplate = catalog.crown_bounty;
    if (bossTemplate) {
      const bossTargets = getBossSectorCandidates(runSectors);
      const bossTarget = pickDeterministicEntry(bossTargets, random);
      if (bossTarget) {
        quests.push(
          createBossQuest({
            template: bossTemplate,
            target: bossTarget,
          })
        );
      }
    }

    return quests;
  }

  function sanitizeQuestTarget(rawTarget = {}, fallbackSectorIndex = 0) {
    const sectorIndex = normalizePositiveInt(rawTarget?.sectorIndex, fallbackSectorIndex);
    return {
      sectorIndex,
      sectorName: normalizeText(rawTarget?.sectorName, `Sector ${sectorIndex + 1}`),
      nodeId: normalizeText(rawTarget?.nodeId),
      nodeType: normalizeNodeType(rawTarget?.nodeType),
      nodeLabel: normalizeText(rawTarget?.nodeLabel),
    };
  }

  function sanitizeQuestObjective(rawObjective = {}) {
    return {
      label: normalizeText(rawObjective?.label),
      damageLimit: normalizePositiveInt(rawObjective?.damageLimit, 0),
      heatLimit: normalizePositiveInt(rawObjective?.heatLimit, 0),
    };
  }

  function sanitizeActiveQuest({ questCatalog, rawQuest }) {
    if (!rawQuest || typeof rawQuest !== "object") {
      return null;
    }

    const templateId = normalizeText(rawQuest.templateId, normalizeText(rawQuest.id));
    const template = questCatalog?.[templateId];
    const kind = normalizeQuestKind(rawQuest.kind || template?.kind);
    const id = normalizeText(rawQuest.id);
    if (!kind || !id) {
      return null;
    }

    const target = sanitizeQuestTarget(rawQuest.target, 0);
    const objective = sanitizeQuestObjective(rawQuest.objective);
    return {
      id,
      templateId: template?.id || templateId || id,
      kind,
      title: normalizeText(rawQuest.title, normalizeText(template?.title, id)),
      description: normalizeText(rawQuest.description, normalizeText(template?.description)),
      icon: normalizeText(rawQuest.icon, normalizeText(template?.icon)),
      target,
      objective,
      rewards: normalizeRewards(rawQuest.rewards || template?.rewards),
    };
  }

  function sanitizeQuestState({
    questCatalog,
    rawState,
    runSeed = 0,
    runSectors = [],
    stageNodesBySector = [],
  } = {}) {
    const fallback = createDefaultQuestState();
    const source = rawState && typeof rawState === "object" ? rawState : {};
    let activeQuests = Array.isArray(source.activeQuests)
      ? source.activeQuests.map((quest) => sanitizeActiveQuest({ questCatalog, rawQuest: quest })).filter(Boolean)
      : [];

    const safeRunSeed = Number.isInteger(runSeed) && runSeed > 0 ? runSeed : 0;
    if (activeQuests.length === 0 && hasRouteNodes(stageNodesBySector)) {
      activeQuests = buildGeneratedQuests({
        questCatalog,
        runSectors,
        stageNodesBySector,
        runSeed: safeRunSeed || 1,
      });
    }

    const activeQuestIds = activeQuests.map((quest) => quest.id);
    const activeQuestIdSet = new Set(activeQuestIds);
    const completedQuestIds = uniqueStringList(source.completedQuestIds).filter((questId) => activeQuestIdSet.has(questId));
    const completedSet = new Set(completedQuestIds);
    const failedQuestIds = uniqueStringList(source.failedQuestIds).filter(
      (questId) => activeQuestIdSet.has(questId) && !completedSet.has(questId)
    );

    return {
      ...fallback,
      activeQuestIds,
      activeQuests,
      completedQuestIds,
      failedQuestIds,
      generatedFromSeed: safeRunSeed,
    };
  }

  function getCurrentSectorDamage({ game, sectorIndex }) {
    if (!game || typeof game !== "object") {
      return 0;
    }
    if (Number.parseInt(game.sectorIndex, 10) !== sectorIndex) {
      return 0;
    }
    const currentDamage = Number.parseInt(game?.runStats?.damageTaken, 10);
    const startDamage = Number.parseInt(game?.sectorDamageTakenStart, 10);
    const safeCurrent = Number.isInteger(currentDamage) ? Math.max(0, currentDamage) : 0;
    const safeStart = Number.isInteger(startDamage) ? Math.max(0, startDamage) : safeCurrent;
    return Math.max(0, safeCurrent - safeStart);
  }

  function getQuestLocationLabel(quest) {
    const sectorName = normalizeText(quest?.target?.sectorName, `Sector ${(quest?.target?.sectorIndex || 0) + 1}`);
    const nodeLabel = normalizeText(quest?.target?.nodeLabel);
    return nodeLabel ? `${sectorName} · ${nodeLabel}` : sectorName;
  }

  function getQuestActiveProgressLabel({ quest, game }) {
    if (!quest || typeof quest !== "object") {
      return "Active";
    }

    if (quest.kind === "shrine_attunement") {
      const currentHeat = normalizePositiveInt(game?.player?.heat, 0);
      const limit = normalizePositiveInt(quest?.objective?.heatLimit, 0);
      const currentSectorIndex = Number.parseInt(game?.sectorIndex, 10);
      if (currentSectorIndex === quest.target.sectorIndex) {
        return `${currentHeat}/${limit} heat`;
      }
      return `<=${limit} heat`;
    }

    if (quest.kind === "chest_cache" || quest.kind === "boss_bounty") {
      const currentSectorIndex = Number.parseInt(game?.sectorIndex, 10);
      const damageLimit = normalizePositiveInt(quest?.objective?.damageLimit, 0);
      if (currentSectorIndex === quest.target.sectorIndex) {
        return `${getCurrentSectorDamage({ game, sectorIndex: quest.target.sectorIndex })}/${damageLimit} dmg`;
      }
      return `<=${damageLimit} dmg`;
    }

    return "Active";
  }

  function formatQuestRewardSummary({ quest }) {
    const rewards = normalizeRewards(quest?.rewards);
    const parts = [];
    if (rewards.gearId) {
      parts.push(rewards.gearTitle || rewards.gearId);
    }
    if (rewards.statPoints) {
      parts.push(`+${rewards.statPoints} Stat Point${rewards.statPoints === 1 ? "" : "s"}`);
    }
    if (rewards.skillPoints) {
      parts.push(`+${rewards.skillPoints} Skill Point${rewards.skillPoints === 1 ? "" : "s"}`);
    }
    if (rewards.gold) {
      parts.push(`+${rewards.gold} Gold`);
    }
    if (rewards.healingPotions) {
      parts.push(`+${rewards.healingPotions} Potion${rewards.healingPotions === 1 ? "" : "s"}`);
    }
    if (rewards.itemUpgradeTokens) {
      parts.push(`+${rewards.itemUpgradeTokens} Upgrade Token${rewards.itemUpgradeTokens === 1 ? "" : "s"}`);
    }
    if (rewards.hull) {
      parts.push(`+${rewards.hull} Hull`);
    }
    return parts.join(" // ") || "No reward";
  }

  function getQuestProgressEntries({ questCatalog, questState, game, runSeed, runSectors, stageNodesBySector }) {
    const state = sanitizeQuestState({
      questCatalog,
      rawState: questState,
      runSeed,
      runSectors,
      stageNodesBySector,
    });
    const completedSet = new Set(state.completedQuestIds);
    const failedSet = new Set(state.failedQuestIds);

    return state.activeQuests.map((quest) => {
      const completed = completedSet.has(quest.id);
      const failed = failedSet.has(quest.id);
      return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        icon: quest.icon,
        current: completed ? 1 : 0,
        target: 1,
        completed,
        failed,
        statusLabel: completed ? "Completed" : failed ? "Missed" : "Active",
        progressLabel: completed ? "Completed" : failed ? "Missed" : getQuestActiveProgressLabel({ quest, game }),
        objectiveLabel: normalizeText(quest?.objective?.label, normalizeText(quest?.description)),
        locationLabel: getQuestLocationLabel(quest),
        rewardSummary: formatQuestRewardSummary({ quest }),
      };
    });
  }

  function applyQuestRewards({ game, quest, clamp = defaultClamp, applyGearReward = null }) {
    if (!game || typeof game !== "object") {
      return {};
    }

    const rewards = normalizeRewards(quest?.rewards);
    const appliedRewards = {};
    if (rewards.gold) {
      const currentGold = Number.parseInt(game.gold, 10);
      game.gold = (Number.isInteger(currentGold) ? Math.max(0, currentGold) : 0) + rewards.gold;
      appliedRewards.gold = rewards.gold;
    }
    if (rewards.healingPotions) {
      const currentPotions = Number.parseInt(game.healingPotions, 10);
      game.healingPotions = (Number.isInteger(currentPotions) ? Math.max(0, currentPotions) : 0) + rewards.healingPotions;
      appliedRewards.healingPotions = rewards.healingPotions;
    }
    if (rewards.itemUpgradeTokens) {
      const currentTokens = Number.parseInt(game.itemUpgradeTokens, 10);
      game.itemUpgradeTokens =
        (Number.isInteger(currentTokens) ? Math.max(0, currentTokens) : 0) + rewards.itemUpgradeTokens;
      appliedRewards.itemUpgradeTokens = rewards.itemUpgradeTokens;
    }
    if (rewards.hull && game.player && typeof game.player === "object") {
      const maxHull = Number.parseInt(game.player.maxHull, 10);
      const currentHull = Number.parseInt(game.player.hull, 10);
      const safeMaxHull = Number.isInteger(maxHull) && maxHull > 0 ? maxHull : 1;
      const safeCurrentHull = Number.isInteger(currentHull) ? clamp(currentHull, 0, safeMaxHull) : safeMaxHull;
      const nextHull = clamp(safeCurrentHull + rewards.hull, 0, safeMaxHull);
      game.player.hull = nextHull;
      appliedRewards.hull = nextHull - safeCurrentHull;
    }
    if (rewards.statPoints) {
      game.classState = game.classState && typeof game.classState === "object" ? game.classState : {};
      const currentStatPoints = Number.parseInt(game.classState.statPoints, 10);
      game.classState.statPoints =
        (Number.isInteger(currentStatPoints) ? Math.max(0, currentStatPoints) : 0) + rewards.statPoints;
      appliedRewards.statPoints = rewards.statPoints;
    }
    if (rewards.skillPoints) {
      game.classState = game.classState && typeof game.classState === "object" ? game.classState : {};
      const currentSkillPoints = Number.parseInt(game.classState.skillPoints, 10);
      game.classState.skillPoints =
        (Number.isInteger(currentSkillPoints) ? Math.max(0, currentSkillPoints) : 0) + rewards.skillPoints;
      appliedRewards.skillPoints = rewards.skillPoints;
    }
    if (rewards.gearId) {
      if (typeof applyGearReward === "function") {
        applyGearReward(rewards.gearId);
      }
      appliedRewards.gearId = rewards.gearId;
      appliedRewards.gearTitle = rewards.gearTitle || rewards.gearId;
    }
    return appliedRewards;
  }

  function eventMatchesQuest({ quest, context }) {
    if (!quest || typeof quest !== "object" || !context || typeof context !== "object") {
      return false;
    }

    if (quest.kind === "boss_bounty") {
      return context.type === "sector_cleared" && normalizePositiveInt(context.sectorIndex, -1) === quest.target.sectorIndex;
    }

    if (context.type !== "stage_node") {
      return false;
    }

    const nodeId = normalizeText(context?.node?.id, normalizeText(context?.nodeId));
    if (quest.target.nodeId && nodeId) {
      return quest.target.nodeId === nodeId;
    }

    return (
      normalizePositiveInt(context.sectorIndex, -1) === quest.target.sectorIndex &&
      normalizeNodeType(context?.node?.type || context?.nodeType) === normalizeNodeType(quest.target.nodeType)
    );
  }

  function evaluateQuestOutcome({ quest, game, context }) {
    if (!eventMatchesQuest({ quest, context })) {
      return {
        matched: false,
        completed: false,
        failed: false,
      };
    }

    if (quest.kind === "chest_cache") {
      const damageTaken = normalizePositiveInt(context?.damageTakenThisSector, getCurrentSectorDamage({
        game,
        sectorIndex: quest.target.sectorIndex,
      }));
      return {
        matched: true,
        completed: damageTaken <= normalizePositiveInt(quest?.objective?.damageLimit, 0),
        failed: damageTaken > normalizePositiveInt(quest?.objective?.damageLimit, 0),
      };
    }

    if (quest.kind === "shrine_attunement") {
      const currentHeat = normalizePositiveInt(context?.currentHeat, normalizePositiveInt(game?.player?.heat, 0));
      return {
        matched: true,
        completed: currentHeat <= normalizePositiveInt(quest?.objective?.heatLimit, 0),
        failed: currentHeat > normalizePositiveInt(quest?.objective?.heatLimit, 0),
      };
    }

    if (quest.kind === "boss_bounty") {
      const damageTaken = normalizePositiveInt(context?.damageTakenThisSector, getCurrentSectorDamage({
        game,
        sectorIndex: quest.target.sectorIndex,
      }));
      const isBossSector = Boolean(context?.sector?.boss);
      const limit = normalizePositiveInt(quest?.objective?.damageLimit, 0);
      return {
        matched: true,
        completed: isBossSector && damageTaken <= limit,
        failed: !isBossSector || damageTaken > limit,
      };
    }

    return {
      matched: false,
      completed: false,
      failed: false,
    };
  }

  function resolveQuestCompletions({
    questCatalog,
    questState,
    game,
    context = null,
    clamp = defaultClamp,
    applyGearReward = null,
    runSeed,
    runSectors,
    stageNodesBySector,
  }) {
    const state = sanitizeQuestState({
      questCatalog,
      rawState: questState,
      runSeed,
      runSectors,
      stageNodesBySector,
    });
    const completedSet = new Set(state.completedQuestIds);
    const failedSet = new Set(state.failedQuestIds);
    const newlyCompletedQuests = [];
    const newlyFailedQuests = [];

    state.activeQuests.forEach((quest) => {
      if (completedSet.has(quest.id) || failedSet.has(quest.id)) {
        return;
      }
      const outcome = evaluateQuestOutcome({
        quest,
        game,
        context,
      });
      if (!outcome.matched) {
        return;
      }
      if (outcome.completed) {
        completedSet.add(quest.id);
        const appliedRewards = applyQuestRewards({
          game,
          quest,
          clamp,
          applyGearReward,
        });
        newlyCompletedQuests.push({
          ...quest,
          appliedRewards,
          rewardSummary: formatQuestRewardSummary({ quest }),
        });
        return;
      }
      failedSet.add(quest.id);
      newlyFailedQuests.push({
        ...quest,
        rewardSummary: formatQuestRewardSummary({ quest }),
      });
    });

    return {
      state: {
        ...state,
        activeQuestIds: state.activeQuests.map((quest) => quest.id),
        completedQuestIds: state.activeQuests
          .map((quest) => quest.id)
          .filter((questId) => completedSet.has(questId)),
        failedQuestIds: state.activeQuests
          .map((quest) => quest.id)
          .filter((questId) => failedSet.has(questId) && !completedSet.has(questId)),
      },
      newlyCompletedQuests,
      newlyFailedQuests,
    };
  }

  window.BRASSLINE_QUEST_SYSTEM = {
    cloneQuestCatalog,
    createDefaultQuestState,
    sanitizeQuestState,
    getQuestProgressEntries,
    formatQuestRewardSummary,
    resolveQuestCompletions,
  };
})();
