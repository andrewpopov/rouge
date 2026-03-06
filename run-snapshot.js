(() => {
  function defaultClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cloneQuestState(value) {
    if (!value || typeof value !== "object") {
      return {
        activeQuestIds: [],
        completedQuestIds: [],
      };
    }

    return {
      ...value,
      activeQuestIds: Array.isArray(value.activeQuestIds) ? [...value.activeQuestIds] : [],
      activeQuests: Array.isArray(value.activeQuests)
        ? value.activeQuests.map((quest) => (quest && typeof quest === "object" ? JSON.parse(JSON.stringify(quest)) : null)).filter(Boolean)
        : undefined,
      completedQuestIds: Array.isArray(value.completedQuestIds) ? [...value.completedQuestIds] : [],
      failedQuestIds: Array.isArray(value.failedQuestIds) ? [...value.failedQuestIds] : undefined,
    };
  }

  function isResumableRunPhase(phase) {
    return phase === "encounter" || phase === "reward" || phase === "world_map";
  }

  function getCardInstanceNumericId(instanceId) {
    if (typeof instanceId !== "string") {
      return null;
    }
    const match = /^c_(\d+)_/.exec(instanceId);
    if (!match) {
      return null;
    }
    const value = Number.parseInt(match[1], 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function getTelegraphNumericId(telegraphId) {
    if (typeof telegraphId !== "string") {
      return null;
    }
    const match = /^tg_(\d+)$/.exec(telegraphId);
    if (!match) {
      return null;
    }
    const value = Number.parseInt(match[1], 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function readRunSnapshotState(options = {}) {
    const {
      readJson,
      key,
      snapshotVersion = 1,
      snapshotMaxAgeMs = 0,
      nowMs = Date.now(),
      getRunRouteSignature = () => "",
      runSectors = [],
      createDefaultUpgradeState = () => ({}),
      createDefaultMetaUnlockState = () => ({}),
      createDefaultMetaBranchState = () => ({}),
      createDefaultRunStats = () => ({}),
      createDefaultRunTimeline = () => [],
      createDefaultRunGearState = () => ({
        gearInventory: [],
        equippedGear: {
          weapon: "",
          armor: "",
          trinket: "",
        },
      }),
      createDefaultQuestState = () => ({
        activeQuestIds: [],
        completedQuestIds: [],
      }),
      createDefaultRewardTreeState = () => ({
        objectives: {
          sectorsCleared: 0,
          bossKills: 0,
          flawlessClears: 0,
          speedClears: 0,
        },
            unlockedNodeIds: [],
          }),
      createDefaultClassState = () => ({
        classId: "",
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
        nodeRanks: {},
        cooldowns: {},
        baseStats: {},
        baseResistances: {},
      }),
      upgradePathCatalog = {},
      clamp = defaultClamp,
      normalizeCookTier = (tier) => tier,
      enemyBlueprints = {},
      enemyTune = (_enemyId, _k, fallback) => fallback,
      clampLane = (lane) => lane,
      cardCatalog = {},
      normalizeRewardChoice = (choice) => choice,
      encounterModifierCatalog = {},
      artifactCatalog = {},
      gearCatalog = {},
      questCatalog = {},
      rewardTreeCatalog = {},
      classItemCatalog = {},
      normalizeRunGearState = ({ game }) => ({
        ...createDefaultRunGearState(),
        ...(game && typeof game === "object" ? game : {}),
      }),
      sanitizeQuestState = ({ rawState }) => rawState || createDefaultQuestState(),
      sanitizeRewardTreeState = ({ rawState }) => rawState || createDefaultRewardTreeState(),
      sanitizeClassState = ({ rawState }) => rawState || createDefaultClassState(),
      sanitizeStageRouteState = () => ({
        stageNodesBySector: [],
        stageNodeIndex: 0,
        stageProgress: {
          totalNodes: 0,
          completedNodes: 0,
          nodesInSector: 1,
          stageNodeIndex: 0,
        },
      }),
      trackLanes = 5,
      baseMaxHull = 72,
      baseMaxEnergy = 3,
      maxHeat = 120,
      playerStartHeat = 35,
    } = options;

    function sanitizeSnapshotUpgradeState(rawValue) {
      const fallback = createDefaultUpgradeState();
      const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
      Object.keys(upgradePathCatalog).forEach((pathId) => {
        const level = Number.parseInt(raw[pathId], 10);
        fallback[pathId] = Number.isInteger(level)
          ? clamp(level, 0, upgradePathCatalog[pathId].maxLevel)
          : 0;
      });
      return fallback;
    }

    function sanitizeSnapshotRunStats(rawValue) {
      const fallback = createDefaultRunStats();
      const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
      Object.keys(fallback).forEach((statKey) => {
        const value = Number.parseInt(raw[statKey], 10);
        fallback[statKey] = Number.isInteger(value) ? Math.max(0, value) : 0;
      });
      return fallback;
    }

    function sanitizeSnapshotMetaUnlocks(rawUnlocks, upgrades) {
      const fallback = createDefaultMetaUnlockState();
      const raw = rawUnlocks && typeof rawUnlocks === "object" ? rawUnlocks : {};

      Object.keys(upgradePathCatalog || {}).forEach((pathId) => {
        const path = upgradePathCatalog[pathId];
        const tierUnlocks = Array.isArray(path?.tierUnlocks) ? path.tierUnlocks : [];
        const allowed = new Set(
          tierUnlocks
            .map((entry) => (typeof entry?.id === "string" ? entry.id.trim() : ""))
            .filter(Boolean)
        );
        const level = Number.parseInt(upgrades?.[pathId], 10);
        const unlockedByLevel = tierUnlocks
          .filter((entry) => Number.isInteger(entry?.level) && entry.level > 0 && level >= entry.level)
          .map((entry) => entry.id);
        const stored = (Array.isArray(raw[pathId]) ? raw[pathId] : [])
          .map((tierId) => (typeof tierId === "string" ? tierId.trim() : ""))
          .filter((tierId) => tierId && allowed.has(tierId));
        const merged = new Set([...stored, ...unlockedByLevel]);
        fallback[pathId] = tierUnlocks.map((entry) => entry.id).filter((tierId) => merged.has(tierId));
      });

      return fallback;
    }

    function sanitizeSnapshotMetaBranches(rawBranches, upgrades) {
      const fallback = createDefaultMetaBranchState();
      const raw = rawBranches && typeof rawBranches === "object" ? rawBranches : {};

      Object.keys(upgradePathCatalog || {}).forEach((pathId) => {
        const path = upgradePathCatalog[pathId];
        const branchChoices = path?.branchChoices;
        const unlockLevel = Number.parseInt(branchChoices?.unlockLevel, 10);
        const branchOptionIds = (
          Array.isArray(branchChoices?.options) ? branchChoices.options : []
        )
          .map((entry) => (typeof entry?.id === "string" ? entry.id.trim() : ""))
          .filter(Boolean);
        if (branchOptionIds.length === 0 || !Number.isInteger(unlockLevel) || unlockLevel <= 0) {
          fallback[pathId] = "";
          return;
        }

        const selectedBranch = typeof raw[pathId] === "string" ? raw[pathId].trim() : "";
        if (selectedBranch && branchOptionIds.includes(selectedBranch)) {
          fallback[pathId] = selectedBranch;
          return;
        }

        const level = Number.parseInt(upgrades?.[pathId], 10);
        fallback[pathId] =
          Number.isInteger(level) && level >= unlockLevel ? branchOptionIds[0] : "";
      });

      return fallback;
    }

    function sanitizeSnapshotRunTimeline(rawTimeline) {
      if (!Array.isArray(rawTimeline)) {
        return createDefaultRunTimeline();
      }
      const allowedTypes = new Set(["info", "system", "sector", "reward", "danger", "victory"]);
      const timeline = rawTimeline
        .map((entry) => {
          if (typeof entry === "string" && entry.trim()) {
            return {
              line: entry.trim(),
              type: "info",
            };
          }
          if (!entry || typeof entry !== "object" || typeof entry.line !== "string") {
            return null;
          }
          const line = entry.line.trim();
          if (!line) {
            return null;
          }
          const type =
            typeof entry.type === "string" && allowedTypes.has(entry.type) ? entry.type : "info";
          return {
            line,
            type,
          };
        })
        .filter(Boolean);
      return timeline.slice(-22);
    }

    function sanitizeSnapshotEncounterModifier(rawModifier) {
      if (!rawModifier || typeof rawModifier !== "object") {
        return null;
      }
      const id = typeof rawModifier.id === "string" ? rawModifier.id.trim() : "";
      if (!id) {
        return null;
      }
      const catalogEntry =
        encounterModifierCatalog && typeof encounterModifierCatalog === "object"
          ? encounterModifierCatalog[id]
          : null;
      if (catalogEntry && typeof catalogEntry === "object") {
        return { ...catalogEntry };
      }

      const effect = typeof rawModifier.effect === "string" ? rawModifier.effect.trim() : "";
      if (!effect) {
        return null;
      }
      const title = typeof rawModifier.title === "string" ? rawModifier.title.trim() : id;
      const description =
        typeof rawModifier.description === "string" ? rawModifier.description.trim() : "";
      const value = Number.isFinite(rawModifier.value) ? Math.round(rawModifier.value) : 0;
      return {
        id,
        title: title || id,
        description,
        effect,
        value,
      };
    }

    function sanitizeSnapshotCardInstance(rawInstance, fallbackId) {
      if (!rawInstance || typeof rawInstance !== "object") {
        return null;
      }
      const cardId = typeof rawInstance.cardId === "string" ? rawInstance.cardId : "";
      if (!cardCatalog[cardId]) {
        return null;
      }
      const instanceId =
        typeof rawInstance.instanceId === "string" && rawInstance.instanceId.trim()
          ? rawInstance.instanceId.trim()
          : fallbackId;
      return {
        cardId,
        instanceId,
      };
    }

    function sanitizeSnapshotDeckInstances(rawDeck, prefix) {
      if (!Array.isArray(rawDeck)) {
        return [];
      }
      return rawDeck
        .map((instance, index) => sanitizeSnapshotCardInstance(instance, `${prefix}_${index + 1}`))
        .filter(Boolean);
    }

    function sanitizeSnapshotIntent(rawIntent) {
      if (!rawIntent || typeof rawIntent !== "object") {
        return null;
      }

      const kind = typeof rawIntent.kind === "string" ? rawIntent.kind.trim().toLowerCase() : "";
      if (!["attack", "guard", "charge", "stoke", "aim", "lob", "sweep"].includes(kind)) {
        return null;
      }

      const intent = {
        kind,
        value: Number.isFinite(rawIntent.value) ? Math.round(rawIntent.value) : 0,
        hits: Number.isFinite(rawIntent.hits) ? Math.max(0, Math.round(rawIntent.hits)) : 0,
        label:
          typeof rawIntent.label === "string" && rawIntent.label.trim()
            ? rawIntent.label.trim()
            : kind,
      };

      if (kind === "lob" || kind === "sweep") {
        intent.cookTier = normalizeCookTier(rawIntent.cookTier);
      }
      if (kind === "lob") {
        intent.radius = Number.isFinite(rawIntent.radius)
          ? Math.max(0, Math.round(rawIntent.radius))
          : 0;
      }
      if (kind === "sweep") {
        intent.width = Number.isFinite(rawIntent.width) ? Math.max(1, Math.round(rawIntent.width)) : 3;
      }

      return intent;
    }

    function sanitizeSnapshotEnemy(rawEnemy, index, sectorIndex) {
      if (!rawEnemy || typeof rawEnemy !== "object") {
        return null;
      }
      const enemyKey = typeof rawEnemy.key === "string" ? rawEnemy.key : "";
      const blueprint = enemyBlueprints[enemyKey];
      if (!blueprint) {
        return null;
      }
      const isElite = Boolean(rawEnemy.elite);
      const fallbackIntentsSource =
        isElite && Array.isArray(blueprint.eliteIntents) && blueprint.eliteIntents.length > 0
          ? blueprint.eliteIntents
          : Array.isArray(blueprint.intents)
            ? blueprint.intents
            : [];

      const intents = Array.isArray(rawEnemy.intents)
        ? rawEnemy.intents.map((intent) => sanitizeSnapshotIntent(intent)).filter(Boolean)
        : [];
      const safeIntents =
        intents.length > 0
          ? intents
          : fallbackIntentsSource
              .map((intent) => sanitizeSnapshotIntent(intent))
              .filter(Boolean);
      if (safeIntents.length === 0) {
        return null;
      }

      const eliteHpMultiplier =
        isElite && Number.isFinite(blueprint.eliteHpMultiplier) && blueprint.eliteHpMultiplier > 0
          ? blueprint.eliteHpMultiplier
          : 1;
      const fallbackMaxHp = enemyTune(enemyKey, "maxHp", blueprint.maxHp);
      const maxHp = Number.isFinite(rawEnemy.maxHp)
        ? Math.max(1, Math.round(rawEnemy.maxHp))
        : Math.max(1, Math.round(fallbackMaxHp * eliteHpMultiplier));
      const hp = Number.isFinite(rawEnemy.hp) ? clamp(Math.round(rawEnemy.hp), 0, maxHp) : maxHp;
      const intentIndexRaw = Number.parseInt(rawEnemy.intentIndex, 10);
      const intentIndex = Number.isInteger(intentIndexRaw) ? Math.max(0, intentIndexRaw) : 0;
      const nextIntent =
        sanitizeSnapshotIntent(rawEnemy.intent) || safeIntents[intentIndex % safeIntents.length] || null;
      const aimedLaneRaw = Number.parseInt(rawEnemy.aimedLane, 10);
      const aimedLane = Number.isInteger(aimedLaneRaw) ? clampLane(aimedLaneRaw) : null;
      const alive = rawEnemy.alive !== false && hp > 0;
      const idFallback = `enemy_${sectorIndex + 1}_${index + 1}_${enemyKey}`;
      const id =
        typeof rawEnemy.id === "string" && rawEnemy.id.trim() ? rawEnemy.id.trim() : idFallback;

      return {
        id,
        key: enemyKey,
        name: blueprint.name,
        maxHp,
        hp,
        block: Number.isFinite(rawEnemy.block)
          ? Math.max(0, Math.round(rawEnemy.block))
          : isElite && Number.isFinite(blueprint.eliteStartBlock)
            ? Math.max(0, Math.round(blueprint.eliteStartBlock))
            : 0,
        attackBuff: Number.isFinite(rawEnemy.attackBuff)
          ? Math.max(0, Math.round(rawEnemy.attackBuff))
          : isElite && Number.isFinite(blueprint.eliteAttackBuff)
            ? Math.max(0, Math.round(blueprint.eliteAttackBuff))
            : 0,
        aimed: Boolean(rawEnemy.aimed) && aimedLane !== null,
        aimedLane,
        icon: blueprint.icon,
        intents: safeIntents,
        intentIndex,
        intent: alive ? nextIntent : null,
        alive,
        elite: isElite,
        eliteLabel:
          isElite && typeof rawEnemy.eliteLabel === "string" && rawEnemy.eliteLabel.trim()
            ? rawEnemy.eliteLabel.trim()
            : isElite && typeof blueprint.eliteLabel === "string"
              ? blueprint.eliteLabel
              : "",
      };
    }

    function sanitizeSnapshotTelegraph(rawTelegraph, index) {
      if (!rawTelegraph || typeof rawTelegraph !== "object") {
        return null;
      }

      const type =
        rawTelegraph.type === "lob" || rawTelegraph.type === "sweep" ? rawTelegraph.type : null;
      if (!type) {
        return null;
      }

      const cookTurnsRaw = Number.parseInt(rawTelegraph.cookTurns, 10);
      const cookTurns = Number.isInteger(cookTurnsRaw) ? Math.max(1, cookTurnsRaw) : 1;
      const turnsLeftRaw = Number.parseInt(rawTelegraph.turnsLeft, 10);
      const turnsLeft = Number.isInteger(turnsLeftRaw) ? clamp(turnsLeftRaw, 1, cookTurns) : cookTurns;
      const targetLaneRaw = Number.parseInt(rawTelegraph.targetLane, 10);
      const targetLane = Number.isInteger(targetLaneRaw) ? clampLane(targetLaneRaw) : null;
      const lanes = Array.isArray(rawTelegraph.lanes)
        ? [
            ...new Set(
              rawTelegraph.lanes
                .map((lane) => Number.parseInt(lane, 10))
                .filter((lane) => Number.isInteger(lane))
            ),
          ]
            .map((lane) => clampLane(lane))
            .sort((a, b) => a - b)
        : [];

      if (type === "lob" && targetLane === null) {
        return null;
      }
      if (type === "sweep" && lanes.length === 0) {
        return null;
      }

      const id =
        typeof rawTelegraph.id === "string" && rawTelegraph.id.trim()
          ? rawTelegraph.id.trim()
          : `tg_${index + 1}`;

      return {
        id,
        type,
        damage: Number.isFinite(rawTelegraph.damage) ? Math.max(0, Math.round(rawTelegraph.damage)) : 0,
        cookTurns,
        turnsLeft,
        cookTier: normalizeCookTier(rawTelegraph.cookTier),
        targetLane,
        lanes,
        radius: Number.isFinite(rawTelegraph.radius) ? Math.max(0, Math.round(rawTelegraph.radius)) : 0,
        direction:
          rawTelegraph.direction === "left" || rawTelegraph.direction === "right"
            ? rawTelegraph.direction
            : null,
        sourceEnemyId:
          typeof rawTelegraph.sourceEnemyId === "string" ? rawTelegraph.sourceEnemyId : null,
      };
    }

    function sanitizeSnapshotRewardChoices(rawChoices) {
      if (!Array.isArray(rawChoices)) {
        return [];
      }
      return rawChoices
        .map((choice) => normalizeRewardChoice(choice))
        .filter((choice) => {
          if (!choice) {
            return false;
          }
          if (choice.type === "card") {
            return Boolean(cardCatalog[choice.cardId]);
          }
          if (choice.type === "artifact") {
            return Boolean(artifactCatalog[choice.artifactId]);
          }
          if (choice.type === "gear") {
            return Boolean(gearCatalog[choice.gearId]);
          }
          return Boolean(upgradePathCatalog[choice.upgradeId]);
        });
    }

    function sanitizeSnapshotInterludeOption(rawOption, sectorIndex) {
      if (!rawOption || typeof rawOption !== "object") {
        return null;
      }
      const label = typeof rawOption.label === "string" ? rawOption.label.trim() : "";
      if (!label) {
        return null;
      }
      const targetSectorRaw = Number.parseInt(rawOption.targetSector, 10);
      const targetSector =
        Number.isInteger(targetSectorRaw) &&
        targetSectorRaw >= sectorIndex + 1 &&
        targetSectorRaw <= runSectors.length
          ? targetSectorRaw
          : null;
      return {
        label,
        hull: Number.isFinite(rawOption.hull) ? Math.round(rawOption.hull) : 0,
        heat: Number.isFinite(rawOption.heat) ? Math.round(rawOption.heat) : 0,
        addCard:
          typeof rawOption.addCard === "string" && cardCatalog[rawOption.addCard]
            ? rawOption.addCard
            : null,
        removeCard:
          typeof rawOption.removeCard === "string" && cardCatalog[rawOption.removeCard]
            ? rawOption.removeCard
            : null,
        targetSector,
      };
    }

    function sanitizeSnapshotInterlude(rawInterlude, sectorIndex) {
      if (!rawInterlude || typeof rawInterlude !== "object") {
        return null;
      }
      const type = rawInterlude.type === "shop" ? "shop" : "event";
      const title = typeof rawInterlude.title === "string" ? rawInterlude.title.trim() : "";
      const description =
        typeof rawInterlude.description === "string" ? rawInterlude.description.trim() : "";
      const options = (Array.isArray(rawInterlude.options) ? rawInterlude.options : [])
        .map((option) => sanitizeSnapshotInterludeOption(option, sectorIndex))
        .filter(Boolean);
      if (!title || options.length === 0) {
        return null;
      }
      return {
        type,
        title,
        description: description || "Choose one route action.",
        options,
      };
    }

    function sanitizeSnapshotPlayer(rawPlayer) {
      const fallbackLane = Math.floor(trackLanes / 2);
      const laneRaw = Number.parseInt(rawPlayer?.lane, 10);
      const maxHullRaw = Number.parseInt(rawPlayer?.maxHull, 10);
      const maxEnergyRaw = Number.parseInt(rawPlayer?.maxEnergy, 10);
      const maxHull = Number.isInteger(maxHullRaw) ? Math.max(1, maxHullRaw) : baseMaxHull;
      const maxEnergy = Number.isInteger(maxEnergyRaw) ? Math.max(1, maxEnergyRaw) : baseMaxEnergy;
      const hullRaw = Number.parseInt(rawPlayer?.hull, 10);
      const energyRaw = Number.parseInt(rawPlayer?.energy, 10);

      return {
        maxHull,
        hull: Number.isInteger(hullRaw) ? clamp(hullRaw, 0, maxHull) : maxHull,
        block: Number.isFinite(rawPlayer?.block) ? Math.max(0, Math.round(rawPlayer.block)) : 0,
        heat: Number.isFinite(rawPlayer?.heat)
          ? clamp(Math.round(rawPlayer.heat), 0, maxHeat)
          : playerStartHeat,
        energy: Number.isInteger(energyRaw) ? clamp(energyRaw, 0, maxEnergy) : maxEnergy,
        maxEnergy,
        lane: Number.isInteger(laneRaw) ? clampLane(laneRaw) : fallbackLane,
        movedThisTurn: Boolean(rawPlayer?.movedThisTurn),
        nextAttackMultiplier: Number.isFinite(rawPlayer?.nextAttackMultiplier)
          ? Math.max(1, Math.round(rawPlayer.nextAttackMultiplier))
          : 1,
        nextAttackFlatBonus: Number.isFinite(rawPlayer?.nextAttackFlatBonus)
          ? Math.max(0, Math.round(rawPlayer.nextAttackFlatBonus))
          : 0,
        pendingEnergyNextTurn: Number.isFinite(rawPlayer?.pendingEnergyNextTurn)
          ? Math.max(0, Math.round(rawPlayer.pendingEnergyNextTurn))
          : 0,
        overclockUsed: Boolean(rawPlayer?.overclockUsed),
      };
    }

    function sanitizeSnapshotRunSeed(rawSeed) {
      const value = Number.parseInt(rawSeed, 10);
      return Number.isInteger(value) && value > 0 ? value : 1;
    }

    function sanitizeSnapshotArtifacts(rawArtifacts) {
      const allowed = new Set(Object.keys(artifactCatalog || {}));
      return (Array.isArray(rawArtifacts) ? rawArtifacts : [])
        .map((artifactId) => (typeof artifactId === "string" ? artifactId.trim() : ""))
        .filter((artifactId) => artifactId && allowed.has(artifactId));
    }

    function sanitizeSnapshotRunGearState(rawInventory, rawEquipped) {
      const fallback = createDefaultRunGearState();
      const rawGameState = {
        gearInventory: Array.isArray(rawInventory) ? rawInventory : fallback.gearInventory,
        equippedGear: rawEquipped && typeof rawEquipped === "object" ? rawEquipped : fallback.equippedGear,
      };
      const normalized =
        typeof normalizeRunGearState === "function"
          ? normalizeRunGearState({
              gearCatalog,
              game: rawGameState,
            })
          : rawGameState;
      const gearInventory = Array.isArray(normalized?.gearInventory)
        ? normalized.gearInventory
            .map((gearId) => (typeof gearId === "string" ? gearId.trim() : ""))
            .filter((gearId) => gearId && gearCatalog?.[gearId])
        : [];
      const equippedGearSource =
        normalized?.equippedGear && typeof normalized.equippedGear === "object"
          ? normalized.equippedGear
          : fallback.equippedGear;
      const equippedGear = {
        weapon:
          typeof equippedGearSource.weapon === "string" && gearCatalog?.[equippedGearSource.weapon]?.slot === "weapon"
            ? equippedGearSource.weapon
            : "",
        armor:
          typeof equippedGearSource.armor === "string" && gearCatalog?.[equippedGearSource.armor]?.slot === "armor"
            ? equippedGearSource.armor
            : "",
        trinket:
          typeof equippedGearSource.trinket === "string" &&
          gearCatalog?.[equippedGearSource.trinket]?.slot === "trinket"
            ? equippedGearSource.trinket
            : "",
      };
      const inventorySet = new Set(gearInventory);
      if (equippedGear.weapon && !inventorySet.has(equippedGear.weapon)) {
        equippedGear.weapon = "";
      }
      if (equippedGear.armor && !inventorySet.has(equippedGear.armor)) {
        equippedGear.armor = "";
      }
      if (equippedGear.trinket && !inventorySet.has(equippedGear.trinket)) {
        equippedGear.trinket = "";
      }
      return {
        gearInventory,
        equippedGear,
      };
    }

    function sanitizeSnapshotQuestState(rawState, snapshotContext = {}) {
      if (typeof sanitizeQuestState === "function") {
        return sanitizeQuestState({
          questCatalog,
          rawState,
          runSeed: snapshotContext.runSeed,
          runSectors,
          stageNodesBySector: snapshotContext.stageNodesBySector,
        });
      }
      return cloneQuestState(rawState || createDefaultQuestState());
    }

    function sanitizeSnapshotRewardTree(rawState) {
      if (typeof sanitizeRewardTreeState === "function") {
        return sanitizeRewardTreeState({
          rewardTreeCatalog,
          rawState,
        });
      }
      const fallback = createDefaultRewardTreeState();
      return rawState && typeof rawState === "object" ? rawState : fallback;
    }

    function sanitizeSnapshotClass(rawState) {
      if (typeof sanitizeClassState === "function") {
        return sanitizeClassState({
          rawState,
        });
      }
      const fallback = createDefaultClassState();
      if (!rawState || typeof rawState !== "object") {
        return fallback;
      }
      return {
        ...fallback,
        ...rawState,
        statPoints: Math.max(0, Number.parseInt(rawState.statPoints, 10) || 0),
        allocatedStats:
          rawState.allocatedStats && typeof rawState.allocatedStats === "object"
            ? {
                strength: Math.max(0, Number.parseInt(rawState.allocatedStats.strength, 10) || 0),
                dexterity: Math.max(0, Number.parseInt(rawState.allocatedStats.dexterity, 10) || 0),
                vitality: Math.max(0, Number.parseInt(rawState.allocatedStats.vitality, 10) || 0),
                energy: Math.max(0, Number.parseInt(rawState.allocatedStats.energy, 10) || 0),
              }
            : fallback.allocatedStats,
        nodeRanks:
          rawState.nodeRanks && typeof rawState.nodeRanks === "object"
            ? { ...rawState.nodeRanks }
            : fallback.nodeRanks,
        cooldowns:
          rawState.cooldowns && typeof rawState.cooldowns === "object"
            ? { ...rawState.cooldowns }
            : fallback.cooldowns,
        baseStats:
          rawState.baseStats && typeof rawState.baseStats === "object"
            ? { ...rawState.baseStats }
            : fallback.baseStats,
        baseResistances:
          rawState.baseResistances && typeof rawState.baseResistances === "object"
            ? { ...rawState.baseResistances }
            : fallback.baseResistances,
      };
    }

    function sanitizeSnapshotClassItems(rawItems) {
      const allowed = new Set(Object.keys(classItemCatalog || {}));
      const source = Array.isArray(rawItems) ? rawItems : [];
      const cleaned = source
        .map((itemId) => (typeof itemId === "string" ? itemId.trim() : ""))
        .filter((itemId) => itemId && allowed.has(itemId));
      return [...new Set(cleaned)];
    }

    function sanitizeSnapshotCounter(value) {
      const parsed = Number.parseInt(value, 10);
      return Number.isInteger(parsed) ? Math.max(0, parsed) : 0;
    }

    function sanitizeSnapshotStageProgress(rawProgress) {
      const source = rawProgress && typeof rawProgress === "object" ? rawProgress : {};
      const totalNodes = sanitizeSnapshotCounter(source.totalNodes);
      const completedNodes = Math.min(totalNodes, sanitizeSnapshotCounter(source.completedNodes));
      const nodesInSectorRaw = Number.parseInt(source.nodesInSector, 10);
      const nodesInSector = Number.isInteger(nodesInSectorRaw) ? Math.max(1, nodesInSectorRaw) : 1;
      const stageNodeIndexRaw = Number.parseInt(source.stageNodeIndex, 10);
      const stageNodeIndex = Number.isInteger(stageNodeIndexRaw)
        ? clamp(stageNodeIndexRaw, 0, Math.max(0, nodesInSector - 1))
        : 0;
      return {
        totalNodes,
        completedNodes,
        nodesInSector,
        stageNodeIndex,
      };
    }

    try {
      if (typeof readJson !== "function") {
        return null;
      }
      const parsed = readJson(key);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      if (parsed.version !== snapshotVersion) {
        return null;
      }

      const savedAt = Number.parseInt(parsed.savedAt, 10);
      if (!Number.isInteger(savedAt) || savedAt <= 0) {
        return null;
      }
      if (snapshotMaxAgeMs > 0 && nowMs - savedAt > snapshotMaxAgeMs) {
        return null;
      }

      const routeSignature = typeof parsed.routeSignature === "string" ? parsed.routeSignature : "";
      if (!routeSignature || routeSignature !== getRunRouteSignature()) {
        return null;
      }

      const phase = typeof parsed.phase === "string" ? parsed.phase : "";
      if (!isResumableRunPhase(phase)) {
        return null;
      }
      const combatSubphase =
        phase === "encounter" && parsed.combatSubphase === "enemy_resolve"
          ? "enemy_resolve"
          : phase === "encounter"
            ? "player_turn"
            : null;

      const turnRaw = Number.parseInt(parsed.turn, 10);
      const turn = Number.isInteger(turnRaw) ? Math.max(1, turnRaw) : 1;
      const turnCardsPlayedRaw = Number.parseInt(parsed.turnCardsPlayed, 10);
      const turnCardsPlayed = Number.isInteger(turnCardsPlayedRaw) ? Math.max(0, turnCardsPlayedRaw) : 0;
      const turnSpellActionsUsedRaw = Number.parseInt(parsed.turnSpellActionsUsed, 10);
      const turnSpellActionsUsed = Number.isInteger(turnSpellActionsUsedRaw)
        ? Math.max(0, turnSpellActionsUsedRaw)
        : 0;
      const sectorIndexRaw = Number.parseInt(parsed.sectorIndex, 10);
      if (!Number.isInteger(sectorIndexRaw) || sectorIndexRaw < 0 || sectorIndexRaw >= runSectors.length) {
        return null;
      }
      const sectorIndex = sectorIndexRaw;
      const runSeed = sanitizeSnapshotRunSeed(parsed.runSeed);
      const stageRouteState =
        typeof sanitizeStageRouteState === "function"
          ? sanitizeStageRouteState({
              rawStageNodesBySector: parsed.stageNodesBySector,
              stageNodeIndex: parsed.stageNodeIndex,
              stageProgress: parsed.stageProgress,
              sectorIndex,
              runSeed,
            })
          : null;
      const stageNodesBySector = Array.isArray(stageRouteState?.stageNodesBySector)
        ? stageRouteState.stageNodesBySector.map((nodes) =>
            (Array.isArray(nodes) ? nodes : []).map((node) => ({ ...node }))
          )
        : [];
      const stageNodeIndexRaw = Number.parseInt(
        stageRouteState?.stageNodeIndex ?? parsed.stageNodeIndex,
        10
      );
      const stageNodeIndex =
        Number.isInteger(stageNodeIndexRaw) && stageNodeIndexRaw >= 0 ? stageNodeIndexRaw : 0;
      const stageProgress = sanitizeSnapshotStageProgress(
        stageRouteState?.stageProgress || parsed.stageProgress
      );

      const player = sanitizeSnapshotPlayer(parsed.player);
      const enemies = Array.isArray(parsed.enemies)
        ? parsed.enemies
            .map((enemy, index) => sanitizeSnapshotEnemy(enemy, index, sectorIndex))
            .filter(Boolean)
        : [];
      const telegraphs = Array.isArray(parsed.telegraphs)
        ? parsed.telegraphs
            .map((telegraph, index) => sanitizeSnapshotTelegraph(telegraph, index))
            .filter(Boolean)
        : [];

      const drawPile = sanitizeSnapshotDeckInstances(parsed.drawPile, "c_resume_draw");
      const discardPile = sanitizeSnapshotDeckInstances(parsed.discardPile, "c_resume_discard");
      const hand = sanitizeSnapshotDeckInstances(parsed.hand, "c_resume_hand");
      const exhaustPile = sanitizeSnapshotDeckInstances(parsed.exhaustPile, "c_resume_exhaust");
      const allDecks = [drawPile, discardPile, hand, exhaustPile];
      const highestCardId = allDecks
        .flat()
        .reduce(
          (max, instance) => Math.max(max, getCardInstanceNumericId(instance.instanceId) || 0),
          0
        );

      const nextCardRaw = Number.parseInt(parsed.nextCardInstanceId, 10);
      const nextCardInstanceId = Math.max(
        Number.isInteger(nextCardRaw) && nextCardRaw > 0 ? nextCardRaw : 1,
        highestCardId + 1
      );
      const highestTelegraphId = telegraphs.reduce(
        (max, telegraph) => Math.max(max, getTelegraphNumericId(telegraph.id) || 0),
        0
      );
      const nextTelegraphRaw = Number.parseInt(parsed.nextTelegraphId, 10);
      const nextTelegraphId = Math.max(
        Number.isInteger(nextTelegraphRaw) && nextTelegraphRaw > 0 ? nextTelegraphRaw : 1,
        highestTelegraphId + 1
      );

      const rewardChoices = sanitizeSnapshotRewardChoices(parsed.rewardChoices);
      const interlude = sanitizeSnapshotInterlude(parsed.interlude, sectorIndex);
      const interludeDeck = sanitizeSnapshotDeckInstances(parsed.interludeDeck, "c_resume_interlude");
      const encounterModifier = sanitizeSnapshotEncounterModifier(parsed.encounterModifier);
      const upgrades = sanitizeSnapshotUpgradeState(parsed.upgrades);
      const metaUnlocks = sanitizeSnapshotMetaUnlocks(parsed.metaUnlocks, upgrades);
      const metaBranches = sanitizeSnapshotMetaBranches(parsed.metaBranches, upgrades);
      const runStats = sanitizeSnapshotRunStats(parsed.runStats);
      const runGear = sanitizeSnapshotRunGearState(parsed.gearInventory, parsed.equippedGear);
      const questState = sanitizeSnapshotQuestState(parsed.questState, {
        runSeed,
        stageNodesBySector,
      });
      const rewardTreeState = sanitizeSnapshotRewardTree(parsed.rewardTreeState);
      const classState = sanitizeSnapshotClass(parsed.classState);
      const classItems = sanitizeSnapshotClassItems(parsed.classItems);
      const gold = sanitizeSnapshotCounter(parsed.gold);
      const healingPotions = sanitizeSnapshotCounter(parsed.healingPotions);
      const itemUpgradeTokens = sanitizeSnapshotCounter(parsed.itemUpgradeTokens);
      const sectorDamageTakenStartRaw = Number.parseInt(parsed.sectorDamageTakenStart, 10);
      const sectorDamageTakenStart = Number.isInteger(sectorDamageTakenStartRaw)
        ? Math.max(0, sectorDamageTakenStartRaw)
        : runStats.damageTaken;
      if (phase === "reward" && rewardChoices.length === 0) {
        return null;
      }
      if (phase === "world_map" && !interlude) {
        return null;
      }

      return {
        phase,
        combatSubphase,
        turn,
        turnCardsPlayed,
        turnSpellActionsUsed,
        sectorIndex,
        runSeed,
        stageNodeIndex,
        stageNodesBySector,
        stageProgress,
        nextCardInstanceId,
        nextTelegraphId,
        player,
        enemies,
        telegraphs,
        drawPile,
        discardPile,
        hand,
        exhaustPile,
        selectedEnemyId: typeof parsed.selectedEnemyId === "string" ? parsed.selectedEnemyId : null,
        rewardChoices,
        interlude,
        interludeDeck,
        encounterModifier,
        artifacts: sanitizeSnapshotArtifacts(parsed.artifacts),
        gearInventory: runGear.gearInventory,
        equippedGear: runGear.equippedGear,
        questState,
        rewardTreeState,
        classState,
        classItems,
        gold,
        healingPotions,
        itemUpgradeTokens,
        sectorDamageTakenStart,
        upgrades,
        metaUnlocks,
        metaBranches,
        runStats,
        runTimeline: sanitizeSnapshotRunTimeline(parsed.runTimeline),
        showFullTimeline: Boolean(parsed.showFullTimeline),
        log: typeof parsed.log === "string" ? parsed.log.trim() : "",
      };
    } catch (_error) {
      return null;
    }
  }

  function restoreRunSnapshotState(options = {}) {
    const {
      snapshot,
      game,
      createDefaultRecordHighlights = () => ({}),
      createDefaultQuestState = () => ({
        activeQuestIds: [],
        completedQuestIds: [],
      }),
      createDefaultClassState = () => ({
        classId: "",
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
        nodeRanks: {},
        cooldowns: {},
        baseStats: {},
        baseResistances: {},
      }),
      disarmMetaReset = () => {},
      disarmRunRecordsReset = () => {},
      applyUpgradeDerivedCaps = () => {},
      clamp = defaultClamp,
      ensureRunStats = () => ({}),
      ensureRunRecords = () => ({}),
      getSelectedEnemy = () => null,
      setLog = () => {},
      renderEnemies = () => {},
      renderTrackMap = () => {},
      renderCards = () => {},
      updateHud = () => {},
    } = options;

    if (!snapshot || typeof snapshot !== "object" || !game || typeof game !== "object") {
      return false;
    }

    game.phase = snapshot.phase;
    game.combatSubphase = snapshot.phase === "encounter" ? snapshot.combatSubphase || "player_turn" : null;
    game.turn = snapshot.turn;
    game.turnCardsPlayed = Number.isInteger(snapshot.turnCardsPlayed)
      ? Math.max(0, snapshot.turnCardsPlayed)
      : 0;
    game.turnSpellActionsUsed = Number.isInteger(snapshot.turnSpellActionsUsed)
      ? Math.max(0, snapshot.turnSpellActionsUsed)
      : 0;
    game.sectorIndex = snapshot.sectorIndex;
    game.stageNodeIndex = Number.isInteger(snapshot.stageNodeIndex)
      ? Math.max(0, snapshot.stageNodeIndex)
      : 0;
    game.stageNodesBySector = (Array.isArray(snapshot.stageNodesBySector) ? snapshot.stageNodesBySector : []).map(
      (nodes) => (Array.isArray(nodes) ? nodes : []).map((node) => ({ ...node }))
    );
    game.stageProgress =
      snapshot.stageProgress && typeof snapshot.stageProgress === "object"
        ? {
            totalNodes: Number.isInteger(snapshot.stageProgress.totalNodes)
              ? Math.max(0, snapshot.stageProgress.totalNodes)
              : 0,
            completedNodes: Number.isInteger(snapshot.stageProgress.completedNodes)
              ? Math.max(0, snapshot.stageProgress.completedNodes)
              : 0,
            nodesInSector: Number.isInteger(snapshot.stageProgress.nodesInSector)
              ? Math.max(1, snapshot.stageProgress.nodesInSector)
              : 1,
            stageNodeIndex: Number.isInteger(snapshot.stageProgress.stageNodeIndex)
              ? Math.max(0, snapshot.stageProgress.stageNodeIndex)
              : 0,
          }
        : {
            totalNodes: 0,
            completedNodes: 0,
            nodesInSector: 1,
            stageNodeIndex: 0,
          };
    game.runSeed = Number.isInteger(snapshot.runSeed) && snapshot.runSeed > 0 ? snapshot.runSeed : 1;
    game.nextCardInstanceId = snapshot.nextCardInstanceId;
    game.nextTelegraphId = snapshot.nextTelegraphId;
    game.player = {
      ...snapshot.player,
    };
    game.enemies = (Array.isArray(snapshot.enemies) ? snapshot.enemies : []).map((enemy) => ({
      ...enemy,
      intents: (Array.isArray(enemy.intents) ? enemy.intents : []).map((intent) => ({ ...intent })),
      intent: enemy.intent ? { ...enemy.intent } : null,
    }));
    game.telegraphs = (Array.isArray(snapshot.telegraphs) ? snapshot.telegraphs : []).map((telegraph) => ({
      ...telegraph,
    }));
    game.drawPile = (Array.isArray(snapshot.drawPile) ? snapshot.drawPile : []).map((instance) => ({
      ...instance,
    }));
    game.discardPile = (Array.isArray(snapshot.discardPile) ? snapshot.discardPile : []).map((instance) => ({
      ...instance,
    }));
    game.hand = (Array.isArray(snapshot.hand) ? snapshot.hand : []).map((instance) => ({ ...instance }));
    game.exhaustPile = (Array.isArray(snapshot.exhaustPile) ? snapshot.exhaustPile : []).map((instance) => ({
      ...instance,
    }));
    game.selectedEnemyId = snapshot.selectedEnemyId;
    game.openEnemyTooltipId = null;
    game.highlightLanes = [];
    game.highlightLockKey = null;
    game.rewardChoices =
      snapshot.phase === "reward"
        ? (Array.isArray(snapshot.rewardChoices) ? snapshot.rewardChoices : []).map((choice) => ({
            ...choice,
          }))
        : [];
    game.interlude =
      snapshot.phase === "world_map" && snapshot.interlude
        ? {
            ...snapshot.interlude,
            options: (Array.isArray(snapshot.interlude.options) ? snapshot.interlude.options : []).map(
              (option) => ({ ...option })
            ),
          }
        : null;
    game.interludeDeck =
      snapshot.phase === "world_map"
        ? (Array.isArray(snapshot.interludeDeck) ? snapshot.interludeDeck : []).map((instance) => ({
            ...instance,
          }))
        : [];
    game.encounterModifier =
      snapshot.encounterModifier && typeof snapshot.encounterModifier === "object"
        ? { ...snapshot.encounterModifier }
        : null;
    game.artifacts = (Array.isArray(snapshot.artifacts) ? snapshot.artifacts : []).slice();
    game.gearInventory = (Array.isArray(snapshot.gearInventory) ? snapshot.gearInventory : []).slice();
    game.equippedGear =
      snapshot.equippedGear && typeof snapshot.equippedGear === "object"
        ? { ...snapshot.equippedGear }
        : { weapon: "", armor: "", trinket: "" };
    game.questState = cloneQuestState(snapshot.questState || createDefaultQuestState());
    game.rewardTreeState =
      snapshot.rewardTreeState && typeof snapshot.rewardTreeState === "object"
        ? {
            objectives:
              snapshot.rewardTreeState.objectives &&
              typeof snapshot.rewardTreeState.objectives === "object"
                ? { ...snapshot.rewardTreeState.objectives }
                : {},
            unlockedNodeIds: Array.isArray(snapshot.rewardTreeState.unlockedNodeIds)
              ? [...snapshot.rewardTreeState.unlockedNodeIds]
              : [],
          }
        : {
            objectives: {},
            unlockedNodeIds: [],
          };
    game.classState =
      snapshot.classState && typeof snapshot.classState === "object"
        ? {
            ...snapshot.classState,
            allocatedStats:
              snapshot.classState.allocatedStats && typeof snapshot.classState.allocatedStats === "object"
                ? { ...snapshot.classState.allocatedStats }
                : { strength: 0, dexterity: 0, vitality: 0, energy: 0 },
            nodeRanks:
              snapshot.classState.nodeRanks && typeof snapshot.classState.nodeRanks === "object"
                ? { ...snapshot.classState.nodeRanks }
                : {},
            cooldowns:
              snapshot.classState.cooldowns && typeof snapshot.classState.cooldowns === "object"
                ? { ...snapshot.classState.cooldowns }
                : {},
            baseStats:
              snapshot.classState.baseStats && typeof snapshot.classState.baseStats === "object"
                ? { ...snapshot.classState.baseStats }
                : {},
            baseResistances:
              snapshot.classState.baseResistances &&
              typeof snapshot.classState.baseResistances === "object"
                ? { ...snapshot.classState.baseResistances }
                : {},
          }
        : createDefaultClassState();
    game.classItems = (Array.isArray(snapshot.classItems) ? snapshot.classItems : []).slice();
    game.gold = Number.isInteger(snapshot.gold) ? Math.max(0, snapshot.gold) : 0;
    game.healingPotions = Number.isInteger(snapshot.healingPotions)
      ? Math.max(0, snapshot.healingPotions)
      : 0;
    game.itemUpgradeTokens = Number.isInteger(snapshot.itemUpgradeTokens)
      ? Math.max(0, snapshot.itemUpgradeTokens)
      : 0;
    game.sectorDamageTakenStart = Number.isInteger(snapshot.sectorDamageTakenStart)
      ? Math.max(0, snapshot.sectorDamageTakenStart)
      : 0;
    game.upgrades = { ...(snapshot.upgrades || {}) };
    game.metaUnlocks = { ...(snapshot.metaUnlocks || {}) };
    game.metaBranches = { ...(snapshot.metaBranches || {}) };
    game.runStats = { ...(snapshot.runStats || {}) };
    game.runRecordHighlights = createDefaultRecordHighlights();
    game.runTimeline = (Array.isArray(snapshot.runTimeline) ? snapshot.runTimeline : []).map((entry) => ({
      ...entry,
    }));
    game.showFullTimeline = Boolean(snapshot.showFullTimeline);
    disarmMetaReset();
    disarmRunRecordsReset();
    applyUpgradeDerivedCaps();
    game.player.hull = clamp(game.player.hull, 0, game.player.maxHull);
    game.player.energy = clamp(game.player.energy, 0, game.player.maxEnergy);
    ensureRunStats();
    ensureRunRecords();
    getSelectedEnemy();

    const resumeMessage = snapshot.log ? `Run resumed. ${snapshot.log}` : "Run resumed from snapshot.";
    setLog(resumeMessage);
    renderEnemies();
    renderTrackMap();
    renderCards();
    updateHud();
    return true;
  }

  function buildRunSnapshotState(options = {}) {
    const {
      game,
      snapshotVersion = 1,
      nowMs = Date.now(),
      getRunRouteSignature = () => "",
      normalizeRewardChoice = (choice) => choice,
      ensureRunStats = () => ({}),
    } = options;

    if (!game || typeof game !== "object") {
      return null;
    }

    return {
      version: snapshotVersion,
      savedAt: nowMs,
      routeSignature: getRunRouteSignature(),
      phase: game.phase,
      combatSubphase:
        game.phase === "encounter" && game.combatSubphase === "enemy_resolve"
          ? "enemy_resolve"
          : game.phase === "encounter"
            ? "player_turn"
            : null,
      turn: game.turn,
      turnCardsPlayed: Number.isInteger(game.turnCardsPlayed) ? Math.max(0, game.turnCardsPlayed) : 0,
      turnSpellActionsUsed: Number.isInteger(game.turnSpellActionsUsed) ? Math.max(0, game.turnSpellActionsUsed) : 0,
      sectorIndex: game.sectorIndex,
      stageNodeIndex: Number.isInteger(game.stageNodeIndex) ? Math.max(0, game.stageNodeIndex) : 0,
      stageNodesBySector: (Array.isArray(game.stageNodesBySector) ? game.stageNodesBySector : []).map((nodes) =>
        (Array.isArray(nodes) ? nodes : []).map((node) => ({ ...node }))
      ),
      stageProgress:
        game.stageProgress && typeof game.stageProgress === "object"
          ? {
              totalNodes: Number.isInteger(game.stageProgress.totalNodes)
                ? Math.max(0, game.stageProgress.totalNodes)
                : 0,
              completedNodes: Number.isInteger(game.stageProgress.completedNodes)
                ? Math.max(0, game.stageProgress.completedNodes)
                : 0,
              nodesInSector: Number.isInteger(game.stageProgress.nodesInSector)
                ? Math.max(1, game.stageProgress.nodesInSector)
                : 1,
              stageNodeIndex: Number.isInteger(game.stageProgress.stageNodeIndex)
                ? Math.max(0, game.stageProgress.stageNodeIndex)
                : 0,
            }
          : {
              totalNodes: 0,
              completedNodes: 0,
              nodesInSector: 1,
              stageNodeIndex: 0,
            },
      runSeed: Number.isInteger(game.runSeed) && game.runSeed > 0 ? game.runSeed : 1,
      nextCardInstanceId: game.nextCardInstanceId,
      nextTelegraphId: game.nextTelegraphId,
      player: {
        ...game.player,
      },
      enemies: (Array.isArray(game.enemies) ? game.enemies : []).map((enemy) => ({
        ...enemy,
        intents: (Array.isArray(enemy.intents) ? enemy.intents : []).map((intent) => ({ ...intent })),
        intent: enemy.intent ? { ...enemy.intent } : null,
      })),
      telegraphs: (Array.isArray(game.telegraphs) ? game.telegraphs : []).map((telegraph) => ({
        ...telegraph,
      })),
      drawPile: (Array.isArray(game.drawPile) ? game.drawPile : []).map((instance) => ({ ...instance })),
      discardPile: (Array.isArray(game.discardPile) ? game.discardPile : []).map((instance) => ({
        ...instance,
      })),
      hand: (Array.isArray(game.hand) ? game.hand : []).map((instance) => ({ ...instance })),
      exhaustPile: (Array.isArray(game.exhaustPile) ? game.exhaustPile : []).map((instance) => ({
        ...instance,
      })),
      selectedEnemyId: game.selectedEnemyId,
      rewardChoices: (Array.isArray(game.rewardChoices) ? game.rewardChoices : [])
        .map((choice) => normalizeRewardChoice(choice))
        .filter(Boolean)
        .map((choice) => ({ ...choice })),
      interlude: game.interlude
        ? {
            ...game.interlude,
            options: (Array.isArray(game.interlude.options) ? game.interlude.options : []).map((option) => ({
              ...option,
            })),
          }
        : null,
      interludeDeck: (Array.isArray(game.interludeDeck) ? game.interludeDeck : []).map((instance) => ({
        ...instance,
      })),
      encounterModifier:
        game.encounterModifier && typeof game.encounterModifier === "object"
          ? { ...game.encounterModifier }
          : null,
      artifacts: (Array.isArray(game.artifacts) ? game.artifacts : []).slice(),
      gearInventory: (Array.isArray(game.gearInventory) ? game.gearInventory : []).slice(),
      equippedGear:
        game.equippedGear && typeof game.equippedGear === "object"
          ? { ...game.equippedGear }
          : { weapon: "", armor: "", trinket: "" },
      questState: cloneQuestState(game.questState),
      rewardTreeState:
        game.rewardTreeState && typeof game.rewardTreeState === "object"
          ? {
              objectives:
                game.rewardTreeState.objectives && typeof game.rewardTreeState.objectives === "object"
                  ? { ...game.rewardTreeState.objectives }
                  : {},
              unlockedNodeIds: Array.isArray(game.rewardTreeState.unlockedNodeIds)
                ? [...game.rewardTreeState.unlockedNodeIds]
                : [],
            }
          : {
              objectives: {},
              unlockedNodeIds: [],
            },
      classState:
        game.classState && typeof game.classState === "object"
          ? {
              ...game.classState,
              allocatedStats:
                game.classState.allocatedStats && typeof game.classState.allocatedStats === "object"
                  ? { ...game.classState.allocatedStats }
                  : { strength: 0, dexterity: 0, vitality: 0, energy: 0 },
              nodeRanks:
                game.classState.nodeRanks && typeof game.classState.nodeRanks === "object"
                  ? { ...game.classState.nodeRanks }
                  : {},
              cooldowns:
                game.classState.cooldowns && typeof game.classState.cooldowns === "object"
                  ? { ...game.classState.cooldowns }
                  : {},
              baseStats:
                game.classState.baseStats && typeof game.classState.baseStats === "object"
                  ? { ...game.classState.baseStats }
                  : {},
              baseResistances:
                game.classState.baseResistances && typeof game.classState.baseResistances === "object"
                  ? { ...game.classState.baseResistances }
                  : {},
            }
          : null,
      classItems: (Array.isArray(game.classItems) ? game.classItems : []).slice(),
      gold: Number.isInteger(game.gold) ? Math.max(0, game.gold) : 0,
      healingPotions: Number.isInteger(game.healingPotions) ? Math.max(0, game.healingPotions) : 0,
      itemUpgradeTokens: Number.isInteger(game.itemUpgradeTokens) ? Math.max(0, game.itemUpgradeTokens) : 0,
      sectorDamageTakenStart: Number.isInteger(game.sectorDamageTakenStart)
        ? Math.max(0, game.sectorDamageTakenStart)
        : 0,
      upgrades: {
        ...(game.upgrades || {}),
      },
      metaUnlocks: {
        ...(game.metaUnlocks || {}),
      },
      metaBranches: {
        ...(game.metaBranches || {}),
      },
      runStats: {
        ...ensureRunStats(),
      },
      runTimeline: (Array.isArray(game.runTimeline) ? game.runTimeline : []).map((entry) =>
        typeof entry === "string" ? entry : { ...entry }
      ),
      showFullTimeline: Boolean(game.showFullTimeline),
      log: game.log,
    };
  }

  function saveRunSnapshotState(options = {}) {
    const {
      writeJson,
      removeKey,
      key,
      gamePhase,
      isResumableRunPhaseFn = isResumableRunPhase,
      buildRunSnapshotStateFn,
    } = options;

    if (typeof writeJson !== "function") {
      return;
    }
    if (!isResumableRunPhaseFn(gamePhase)) {
      if (typeof removeKey === "function") {
        removeKey(key);
      }
      return;
    }
    if (typeof buildRunSnapshotStateFn !== "function") {
      return;
    }
    const snapshot = buildRunSnapshotStateFn();
    if (snapshot && typeof snapshot === "object") {
      writeJson(key, snapshot);
    }
  }

  function clearRunSnapshotState(options = {}) {
    const { removeKey, key } = options;
    if (typeof removeKey === "function") {
      removeKey(key);
    }
  }

  window.BRASSLINE_RUN_SNAPSHOT = {
    isResumableRunPhase,
    getCardInstanceNumericId,
    getTelegraphNumericId,
    readRunSnapshotState,
    restoreRunSnapshotState,
    buildRunSnapshotState,
    saveRunSnapshotState,
    clearRunSnapshotState,
  };
})();
