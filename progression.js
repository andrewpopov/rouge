(() => {
  function cloneRunSectors(sectors) {
    return (Array.isArray(sectors) ? sectors : []).map((sector) => ({
      name: sector?.name,
      boss: Boolean(sector?.boss),
      encounterSize: Number.isInteger(sector?.encounterSize) && sector.encounterSize > 0 ? sector.encounterSize : null,
      enemies: Array.isArray(sector?.enemies)
        ? sector.enemies.map((entry) => ({
            key: entry?.key,
            power: entry?.power,
            elite: Boolean(entry?.elite),
            weight: Number.isFinite(entry?.weight) && entry.weight > 0 ? entry.weight : 1,
          }))
        : [],
    }));
  }

  function sanitizeConfiguredRunSectors({ configuredSectors, defaultSectors, enemyBlueprints }) {
    const fallback = cloneRunSectors(defaultSectors);
    if (!Array.isArray(configuredSectors)) {
      return fallback;
    }

    const normalized = configuredSectors
      .map((sector, index) => {
        if (!sector || typeof sector !== "object") {
          return null;
        }

        const nameCandidate = typeof sector.name === "string" ? sector.name.trim() : "";
        const encounterSizeRaw = Number.parseInt(sector.encounterSize, 10);
        const rawEnemies = Array.isArray(sector.enemies) ? sector.enemies : [];
        const enemies = rawEnemies
          .map((entry) => {
            if (!entry || typeof entry !== "object") {
              return null;
            }
            const key = typeof entry.key === "string" ? entry.key : "";
            if (!enemyBlueprints?.[key]) {
              return null;
            }
            const power = Number.isFinite(entry.power) && entry.power > 0 ? entry.power : 1;
            const weight = Number.isFinite(entry.weight) && entry.weight > 0 ? entry.weight : 1;
            return { key, power, elite: Boolean(entry.elite), weight };
          })
          .filter(Boolean);

        if (enemies.length === 0) {
          return null;
        }
        const encounterSize =
          Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
            ? Math.min(encounterSizeRaw, enemies.length)
            : null;

        return {
          name: nameCandidate || `Sector ${index + 1}`,
          boss: Boolean(sector.boss),
          encounterSize,
          enemies,
        };
      })
      .filter(Boolean);

    return normalized.length > 0 ? normalized : fallback;
  }

  function sanitizeConfiguredCardList({ rawList, fallbackList, cardCatalog }) {
    const fallback = [...(Array.isArray(fallbackList) ? fallbackList : [])];
    if (!Array.isArray(rawList)) {
      return fallback;
    }
    const normalized = rawList.filter((cardId) => typeof cardId === "string" && Boolean(cardCatalog?.[cardId]));
    return normalized.length > 0 ? normalized : fallback;
  }

  function sanitizeConfiguredInterludes({
    configuredInterludes,
    defaultInterludes,
    cardCatalog,
    sectorCount,
  }) {
    if (!Array.isArray(configuredInterludes)) {
      return [...(Array.isArray(defaultInterludes) ? defaultInterludes : [])];
    }

    const maxSectors = Number.isInteger(sectorCount) && sectorCount > 0 ? sectorCount : 0;
    const normalized = configuredInterludes
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const afterSectorRaw = Number.parseInt(entry.afterSector, 10);
        const afterSector = Number.isInteger(afterSectorRaw) ? afterSectorRaw : index + 1;
        if (afterSector < 1) {
          return null;
        }

        const type = typeof entry.type === "string" ? entry.type.trim().toLowerCase() : "event";
        const normalizedType = type === "shop" ? "shop" : "event";
        const titleCandidate = typeof entry.title === "string" ? entry.title.trim() : "";
        const descCandidate = typeof entry.description === "string" ? entry.description.trim() : "";

        const options = (Array.isArray(entry.options) ? entry.options : [])
          .map((option) => {
            if (!option || typeof option !== "object") {
              return null;
            }
            const label = typeof option.label === "string" ? option.label.trim() : "";
            if (!label) {
              return null;
            }
            const hull = Number.isFinite(option.hull) ? Math.round(option.hull) : 0;
            const heat = Number.isFinite(option.heat) ? Math.round(option.heat) : 0;
            const addCard =
              typeof option.addCard === "string" && cardCatalog?.[option.addCard] ? option.addCard : null;
            const removeCard =
              typeof option.removeCard === "string" && cardCatalog?.[option.removeCard]
                ? option.removeCard
                : null;
            const targetSectorRaw = Number.parseInt(option.targetSector, 10);
            const targetSector =
              Number.isInteger(targetSectorRaw) &&
              targetSectorRaw > afterSector &&
              targetSectorRaw <= maxSectors
                ? targetSectorRaw
                : null;
            return {
              label,
              hull,
              heat,
              addCard,
              removeCard,
              targetSector,
            };
          })
          .filter(Boolean);

        if (options.length === 0) {
          return null;
        }

        return {
          afterSector,
          type: normalizedType,
          title: titleCandidate || `${normalizedType === "shop" ? "Depot" : "Interlude"} Stop`,
          description: descCandidate || "Choose one route action.",
          options,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.afterSector - b.afterSector || a.title.localeCompare(b.title));

    return normalized;
  }

  function buildConfiguredProgression({
    progressionBalance,
    defaultRunSectors,
    enemyBlueprints,
    starterDeckConfig,
    defaultStarterDeck,
    rewardPoolConfig,
    defaultRewardPool,
    interludeConfig,
    defaultInterludes,
    cardCatalog,
  }) {
    const runSectors = sanitizeConfiguredRunSectors({
      configuredSectors: progressionBalance?.sectors,
      defaultSectors: defaultRunSectors,
      enemyBlueprints,
    });
    const starterDeckRecipe = sanitizeConfiguredCardList({
      rawList: starterDeckConfig,
      fallbackList: defaultStarterDeck,
      cardCatalog,
    });
    const rewardPool = sanitizeConfiguredCardList({
      rawList: rewardPoolConfig,
      fallbackList: defaultRewardPool,
      cardCatalog,
    });
    const runInterludes = sanitizeConfiguredInterludes({
      configuredInterludes: interludeConfig,
      defaultInterludes,
      cardCatalog,
      sectorCount: runSectors.length,
    });

    return {
      runSectors,
      starterDeckRecipe,
      rewardPool,
      runInterludes,
    };
  }

  function buildRunRouteSignature({ runSectors, runInterludes }) {
    const sectorSig = (Array.isArray(runSectors) ? runSectors : [])
      .map((sector, index) => {
        const encounterSizePart =
          Number.isInteger(sector?.encounterSize) && sector.encounterSize > 0
            ? `pick${sector.encounterSize}`
            : "all";
        const enemySig = (Array.isArray(sector?.enemies) ? sector.enemies : [])
          .map((entry) => {
            const elitePart = entry?.elite ? ":elite" : "";
            const weightPart =
              Number.isFinite(entry?.weight) && entry.weight > 0 ? `:w${entry.weight}` : "";
            return `${entry.key}:${entry.power}${elitePart}${weightPart}`;
          })
          .join(",");
        return `${index + 1}:${sector?.name}:${sector?.boss ? "boss" : "normal"}:${encounterSizePart}:${enemySig}`;
      })
      .join("|");

    const interludeSig = (Array.isArray(runInterludes) ? runInterludes : [])
      .map((entry) => `${entry.afterSector}:${entry.type}:${entry.title}:${(entry.options || []).map((option) => option.label).join(",")}`)
      .join("|");

    return `${sectorSig}::${interludeSig}`;
  }

  function createDeterministicRandom(seed) {
    let state = (Number.isInteger(seed) ? seed : 1) >>> 0;
    if (state === 0) {
      state = 1;
    }
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function pickSectorEncounter({ sector, sectorIndex = 0, runSeed = 1 } = {}) {
    const enemyPool = (Array.isArray(sector?.enemies) ? sector.enemies : [])
      .map((entry) => {
        if (!entry || typeof entry !== "object" || typeof entry.key !== "string" || !entry.key.trim()) {
          return null;
        }
        const power = Number.isFinite(entry.power) && entry.power > 0 ? entry.power : 1;
        const weight = Number.isFinite(entry.weight) && entry.weight > 0 ? entry.weight : 1;
        return {
          key: entry.key,
          power,
          elite: Boolean(entry.elite),
          weight,
        };
      })
      .filter(Boolean);

    if (enemyPool.length === 0) {
      return [];
    }

    const encounterSizeRaw = Number.parseInt(sector?.encounterSize, 10);
    const encounterSize =
      Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
        ? Math.min(encounterSizeRaw, enemyPool.length)
        : enemyPool.length;

    if (encounterSize >= enemyPool.length) {
      return enemyPool;
    }

    const seedBase = Number.isInteger(runSeed) ? runSeed : 1;
    const sectorOffset = Number.isInteger(sectorIndex) ? sectorIndex + 1 : 1;
    const random = createDeterministicRandom((seedBase ^ ((sectorOffset * 2654435761) >>> 0)) >>> 0);
    const pool = enemyPool.map((entry) => ({ ...entry }));
    const selected = [];

    while (selected.length < encounterSize && pool.length > 0) {
      const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
      let roll = random() * totalWeight;
      let pickIndex = pool.length - 1;

      for (let index = 0; index < pool.length; index += 1) {
        roll -= pool[index].weight;
        if (roll <= 0) {
          pickIndex = index;
          break;
        }
      }

      selected.push(pool.splice(pickIndex, 1)[0]);
    }

    return selected;
  }

  function estimateEncounterEliteChance({ sector } = {}) {
    const enemyPool = (Array.isArray(sector?.enemies) ? sector.enemies : [])
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const weight = Number.isFinite(entry.weight) && entry.weight > 0 ? entry.weight : 1;
        return {
          elite: Boolean(entry.elite),
          weight,
        };
      })
      .filter(Boolean);

    if (enemyPool.length === 0) {
      return 0;
    }

    const encounterSizeRaw = Number.parseInt(sector?.encounterSize, 10);
    const encounterSize =
      Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
        ? Math.min(encounterSizeRaw, enemyPool.length)
        : enemyPool.length;
    if (encounterSize <= 0) {
      return 0;
    }

    const eliteCount = enemyPool.reduce((sum, entry) => sum + (entry.elite ? 1 : 0), 0);
    if (eliteCount === 0) {
      return 0;
    }
    if (encounterSize >= enemyPool.length) {
      return 1;
    }

    const nonEliteWeights = enemyPool.filter((entry) => !entry.elite).map((entry) => entry.weight);
    if (encounterSize > nonEliteWeights.length) {
      return 1;
    }
    const eliteWeightTotal = enemyPool
      .filter((entry) => entry.elite)
      .reduce((sum, entry) => sum + entry.weight, 0);
    const memo = new Map();

    function noEliteProbability(weights, drawsLeft) {
      if (drawsLeft === 0) {
        return 1;
      }
      if (!Array.isArray(weights) || weights.length === 0 || drawsLeft > weights.length) {
        return 0;
      }

      const key = `${drawsLeft}|${weights.join(",")}`;
      if (memo.has(key)) {
        return memo.get(key);
      }

      const nonEliteWeightTotal = weights.reduce((sum, value) => sum + value, 0);
      const totalWeight = eliteWeightTotal + nonEliteWeightTotal;
      if (totalWeight <= 0 || nonEliteWeightTotal <= 0) {
        memo.set(key, 0);
        return 0;
      }

      let probability = 0;
      for (let index = 0; index < weights.length; index += 1) {
        const pickWeight = weights[index];
        const branchProbability = pickWeight / totalWeight;
        if (branchProbability <= 0) {
          continue;
        }
        const nextWeights = [...weights.slice(0, index), ...weights.slice(index + 1)];
        probability += branchProbability * noEliteProbability(nextWeights, drawsLeft - 1);
      }

      memo.set(key, probability);
      return probability;
    }

    const safeNoElite = Math.max(0, Math.min(1, noEliteProbability(nonEliteWeights, encounterSize)));
    return Math.max(0, Math.min(1, 1 - safeNoElite));
  }

  function estimateEncounterKeyInclusionChances({ sector } = {}) {
    const entries = (Array.isArray(sector?.enemies) ? sector.enemies : [])
      .map((entry) => {
        if (!entry || typeof entry !== "object" || typeof entry.key !== "string" || !entry.key.trim()) {
          return null;
        }
        const weight = Number.isFinite(entry.weight) && entry.weight > 0 ? entry.weight : 1;
        return {
          key: entry.key,
          elite: Boolean(entry.elite),
          weight,
        };
      })
      .filter(Boolean);

    if (entries.length === 0) {
      return [];
    }

    const encounterSizeRaw = Number.parseInt(sector?.encounterSize, 10);
    const encounterSize =
      Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
        ? Math.min(encounterSizeRaw, entries.length)
        : entries.length;
    if (encounterSize <= 0) {
      return [];
    }

    const grouped = new Map();
    entries.forEach((entry) => {
      if (!grouped.has(entry.key)) {
        grouped.set(entry.key, {
          key: entry.key,
          targetWeight: 0,
          nonTargetWeights: [],
          hasElite: false,
        });
      }
      const record = grouped.get(entry.key);
      record.targetWeight += entry.weight;
      record.hasElite = record.hasElite || entry.elite;
    });

    entries.forEach((entry) => {
      grouped.forEach((record, key) => {
        if (entry.key !== key) {
          record.nonTargetWeights.push(entry.weight);
        }
      });
    });

    function probabilityAvoidingTarget(nonTargetWeights, targetWeight, drawsLeft) {
      const memo = new Map();

      function walk(weights, remainingDraws) {
        if (remainingDraws === 0) {
          return 1;
        }
        if (!Array.isArray(weights) || weights.length === 0 || remainingDraws > weights.length) {
          return 0;
        }

        const key = `${remainingDraws}|${weights.join(",")}`;
        if (memo.has(key)) {
          return memo.get(key);
        }

        const nonTargetTotal = weights.reduce((sum, value) => sum + value, 0);
        const totalWeight = targetWeight + nonTargetTotal;
        if (totalWeight <= 0 || nonTargetTotal <= 0) {
          memo.set(key, 0);
          return 0;
        }

        let chance = 0;
        for (let index = 0; index < weights.length; index += 1) {
          const pickWeight = weights[index];
          const branchProbability = pickWeight / totalWeight;
          if (branchProbability <= 0) {
            continue;
          }
          const nextWeights = [...weights.slice(0, index), ...weights.slice(index + 1)];
          chance += branchProbability * walk(nextWeights, remainingDraws - 1);
        }

        memo.set(key, chance);
        return chance;
      }

      return walk(nonTargetWeights, drawsLeft);
    }

    return Array.from(grouped.values())
      .map((record) => {
        if (encounterSize > record.nonTargetWeights.length) {
          return {
            key: record.key,
            hasElite: record.hasElite,
            chance: 1,
          };
        }
        const avoid = probabilityAvoidingTarget(record.nonTargetWeights, record.targetWeight, encounterSize);
        return {
          key: record.key,
          hasElite: record.hasElite,
          chance: Math.max(0, Math.min(1, 1 - avoid)),
        };
      })
      .sort((a, b) => b.chance - a.chance || a.key.localeCompare(b.key));
  }

  function buildUpgradePathCatalog({
    defaultUpgradePathCatalog,
    upgradePathTune,
    clamp,
    turnStartCoolingBase,
    turnStartCoolingPerLevel,
    hullPerHullPlatingLevel,
    turnStartBlockPerGuardLevel,
  }) {
    function sanitizeUpgradePathTierUnlocks(pathId, rawTierUnlocks, maxLevel) {
      const source = Array.isArray(rawTierUnlocks) ? rawTierUnlocks : [];
      const normalized = source
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const levelRaw = Number.parseInt(entry.level, 10);
          if (!Number.isInteger(levelRaw) || levelRaw <= 0 || levelRaw > maxLevel) {
            return null;
          }
          const idCandidate = typeof entry.id === "string" ? entry.id.trim() : "";
          const id = idCandidate || `${pathId}_tier_${levelRaw}_${index + 1}`;
          const titleCandidate = typeof entry.title === "string" ? entry.title.trim() : "";
          const descriptionCandidate =
            typeof entry.description === "string" ? entry.description.trim() : "";
          const effectCandidate = typeof entry.effect === "string" ? entry.effect.trim() : "";
          const value = Number.isFinite(entry.value) ? Math.round(entry.value) : 0;

          return {
            id,
            level: levelRaw,
            title: titleCandidate || `Tier ${levelRaw}`,
            description: descriptionCandidate || "Path milestone unlocked.",
            effect: effectCandidate || "milestone",
            value,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));

      const seen = new Set();
      return normalized.filter((entry) => {
        if (seen.has(entry.id)) {
          return false;
        }
        seen.add(entry.id);
        return true;
      });
    }

    function sanitizeUpgradePathBranchChoices(pathId, rawBranchChoices, maxLevel) {
      if (!rawBranchChoices || typeof rawBranchChoices !== "object") {
        return null;
      }
      const unlockLevelRaw = Number.parseInt(rawBranchChoices.unlockLevel, 10);
      const unlockLevel =
        Number.isInteger(unlockLevelRaw) && unlockLevelRaw >= 1 && unlockLevelRaw <= maxLevel
          ? unlockLevelRaw
          : null;
      const options = (Array.isArray(rawBranchChoices.options) ? rawBranchChoices.options : [])
        .map((option, index) => {
          if (!option || typeof option !== "object") {
            return null;
          }
          const idCandidate = typeof option.id === "string" ? option.id.trim() : "";
          const id = idCandidate || `${pathId}_branch_${index + 1}`;
          const titleCandidate = typeof option.title === "string" ? option.title.trim() : "";
          const descriptionCandidate =
            typeof option.description === "string" ? option.description.trim() : "";
          const effectCandidate = typeof option.effect === "string" ? option.effect.trim() : "";
          const value = Number.isFinite(option.value) ? Math.round(option.value) : 0;
          if (!titleCandidate || !effectCandidate) {
            return null;
          }
          return {
            id,
            title: titleCandidate,
            description: descriptionCandidate || "Meta branch selected.",
            effect: effectCandidate,
            value,
          };
        })
        .filter(Boolean);

      if (!unlockLevel || options.length < 2) {
        return null;
      }
      const seenIds = new Set();
      const deduped = options.filter((entry) => {
        if (seenIds.has(entry.id)) {
          return false;
        }
        seenIds.add(entry.id);
        return true;
      });
      if (deduped.length < 2) {
        return null;
      }
      return {
        unlockLevel,
        options: deduped,
      };
    }

    const source = defaultUpgradePathCatalog && typeof defaultUpgradePathCatalog === "object"
      ? Object.values(defaultUpgradePathCatalog)
      : [];

    return Object.fromEntries(
      source
        .filter((path) => path && typeof path === "object" && typeof path.id === "string")
        .map((fallbackPath) => {
          const pathId = fallbackPath.id;
          const title = upgradePathTune(pathId, "title", fallbackPath.title);
          const icon = upgradePathTune(pathId, "icon", fallbackPath.icon);
          const description = upgradePathTune(pathId, "description", fallbackPath.description);
          const tunedMaxLevel = upgradePathTune(pathId, "maxLevel", fallbackPath.maxLevel);
          const numericMaxLevel = Number.isFinite(tunedMaxLevel) ? tunedMaxLevel : fallbackPath.maxLevel;
          const maxLevel = clamp(Math.floor(numericMaxLevel), 1, 9);
          const tunedTierUnlocks = upgradePathTune(pathId, "tierUnlocks", fallbackPath.tierUnlocks);
          const tierUnlocks = sanitizeUpgradePathTierUnlocks(pathId, tunedTierUnlocks, maxLevel);
          const tunedBranchChoices = upgradePathTune(pathId, "branchChoices", fallbackPath.branchChoices);
          const branchChoices = sanitizeUpgradePathBranchChoices(pathId, tunedBranchChoices, maxLevel);

          return [
            pathId,
            {
              id: pathId,
              title,
              icon,
              description,
              maxLevel,
              tierUnlocks,
              branchChoices,
              bonusLabel: (level) => {
                if (pathId === "condenser_bank") {
                  return `Max Steam +${level}`;
                }
                if (pathId === "coolant_loop") {
                  return `Turn-start cooling ${turnStartCoolingBase + level * turnStartCoolingPerLevel}`;
                }
                if (pathId === "hull_plating") {
                  return `Max Hull +${level * hullPerHullPlatingLevel}`;
                }
                if (pathId === "guard_protocol") {
                  return `Start-turn Block +${level * turnStartBlockPerGuardLevel}`;
                }
                return `Level ${level}`;
              },
            },
          ];
        })
    );
  }

  function createDefaultUpgradeState({ upgradePathCatalog }) {
    return Object.fromEntries(Object.keys(upgradePathCatalog || {}).map((pathId) => [pathId, 0]));
  }

  function createDefaultRunStats() {
    return {
      cardsPlayed: 0,
      damageDealt: 0,
      damageTaken: 0,
      enemiesDestroyed: 0,
      rewardsClaimed: 0,
      cardsRewarded: 0,
      gearRewarded: 0,
      upgradesRewarded: 0,
      rewardSkips: 0,
    };
  }

  function createDefaultRunRecords() {
    return {
      totalRuns: 0,
      wins: 0,
      bestVictoryTurns: null,
      bestDamageDealt: 0,
      bestSectorsCleared: 0,
      bestMetaLevels: 0,
    };
  }

  function createDefaultRecordHighlights() {
    return {
      bestVictoryTurns: false,
      bestDamageDealt: false,
      bestSectorsCleared: false,
      bestMetaLevels: false,
    };
  }

  function createDefaultRunTimeline() {
    return [];
  }

  function defaultClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function appendRunTimelineEntry({
    game,
    message,
    options = {},
    createDefaultRunTimelineFn = createDefaultRunTimeline,
    clamp = defaultClamp,
    runSectorsLength = 0,
    maxEntries = 22,
  }) {
    if (!game || typeof game !== "object") {
      return false;
    }
    if (typeof message !== "string" || message.trim().length === 0) {
      return false;
    }
    if (!Array.isArray(game.runTimeline)) {
      game.runTimeline = createDefaultRunTimelineFn();
    }

    const sectorCount = Number.isInteger(runSectorsLength) ? Math.max(1, runSectorsLength) : 1;
    const sectorPart = Number.isInteger(options.sectorIndex)
      ? `S${clamp(options.sectorIndex + 1, 1, sectorCount)}`
      : "";
    const turnPart = Number.isInteger(options.turn) && options.turn > 0 ? `T${options.turn}` : "";
    const prefix = [sectorPart, turnPart].filter(Boolean).join(" ");
    const line = prefix ? `${prefix} // ${message.trim()}` : message.trim();
    const type = typeof options.type === "string" && options.type.trim() ? options.type.trim() : "info";

    game.runTimeline.push({
      line,
      type,
    });

    while (game.runTimeline.length > maxEntries) {
      game.runTimeline.shift();
    }

    return true;
  }

  function ensureRunStats({ game, createDefaultRunStatsFn = createDefaultRunStats }) {
    const fallback = createDefaultRunStatsFn();
    if (!game.runStats || typeof game.runStats !== "object") {
      game.runStats = fallback;
      return game.runStats;
    }
    Object.keys(fallback).forEach((key) => {
      const current = game.runStats[key];
      game.runStats[key] = Number.isFinite(current) ? Math.max(0, Math.floor(current)) : 0;
    });
    return game.runStats;
  }

  function ensureRunRecords({ game, createDefaultRunRecordsFn = createDefaultRunRecords }) {
    const fallback = createDefaultRunRecordsFn();
    if (!game.runRecords || typeof game.runRecords !== "object") {
      game.runRecords = fallback;
      return game.runRecords;
    }

    const numericKeys = ["totalRuns", "wins", "bestDamageDealt", "bestSectorsCleared", "bestMetaLevels"];
    numericKeys.forEach((key) => {
      const current = game.runRecords[key];
      game.runRecords[key] = Number.isFinite(current) ? Math.max(0, Math.floor(current)) : 0;
    });

    const bestTurns = Number.parseInt(game.runRecords.bestVictoryTurns, 10);
    game.runRecords.bestVictoryTurns = Number.isInteger(bestTurns) && bestTurns > 0 ? bestTurns : null;

    return game.runRecords;
  }

  const STAGE_NODE_TYPES = ["enemy", "chest", "shrine"];

  function normalizeStageNodeType(type) {
    const normalized = typeof type === "string" ? type.trim().toLowerCase() : "";
    return STAGE_NODE_TYPES.includes(normalized) ? normalized : "enemy";
  }

  function normalizeEncounterWeights(rawWeights = {}) {
    const safeSource = rawWeights && typeof rawWeights === "object" ? rawWeights : {};
    const normalized = Object.fromEntries(
      STAGE_NODE_TYPES.map((type) => {
        const value = Number.isFinite(safeSource[type]) ? safeSource[type] : 0;
        return [type, Math.max(0, value)];
      })
    );

    const sum = STAGE_NODE_TYPES.reduce((total, type) => total + normalized[type], 0);
    if (sum <= 0) {
      return {
        enemy: 1,
        chest: 0,
        shrine: 0,
      };
    }
    return normalized;
  }

  function parseActNumberFromSectorName(name) {
    if (typeof name !== "string" || !name.trim()) {
      return null;
    }

    const directMatch = /\bact\s+(\d+)\b/i.exec(name);
    if (directMatch) {
      const value = Number.parseInt(directMatch[1], 10);
      return Number.isInteger(value) && value > 0 ? value : null;
    }

    const romanMatch = /\bact\s+([ivx]+)\b/i.exec(name);
    if (!romanMatch) {
      return null;
    }
    const token = romanMatch[1].toUpperCase();
    const romanMap = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
    };
    return romanMap[token] || null;
  }

  function getSectorActNumber(sector) {
    const explicitAct = Number.parseInt(sector?.act, 10);
    if (Number.isInteger(explicitAct) && explicitAct > 0) {
      return explicitAct;
    }
    return parseActNumberFromSectorName(sector?.name);
  }

  function sanitizeEncounterModel(encounterModel = null) {
    const source = encounterModel && typeof encounterModel === "object" ? encounterModel : {};
    const minRaw = Number.parseInt(source?.encountersPerStage?.min, 10);
    const maxRaw = Number.parseInt(source?.encountersPerStage?.max, 10);
    const min = Number.isInteger(minRaw) && minRaw > 0 ? minRaw : 1;
    const maxUnclamped = Number.isInteger(maxRaw) && maxRaw > 0 ? maxRaw : min;
    const max = Math.max(min, maxUnclamped);

    const actNodeWeightsSource =
      source?.actNodeWeights && typeof source.actNodeWeights === "object" ? source.actNodeWeights : {};
    const actNodeWeights = Object.fromEntries(
      Object.entries(actNodeWeightsSource)
        .map(([actKey, weights]) => {
          const act = Number.parseInt(actKey, 10);
          if (!Number.isInteger(act) || act <= 0) {
            return null;
          }
          return [String(act), normalizeEncounterWeights(weights)];
        })
        .filter(Boolean)
    );

    const defaultWeights = normalizeEncounterWeights({
      enemy: Number.isFinite(source?.defaultNodeWeights?.enemy) ? source.defaultNodeWeights.enemy : 1,
      chest: Number.isFinite(source?.defaultNodeWeights?.chest) ? source.defaultNodeWeights.chest : 0,
      shrine: Number.isFinite(source?.defaultNodeWeights?.shrine) ? source.defaultNodeWeights.shrine : 0,
    });

    return {
      encountersPerStage: {
        min,
        max,
      },
      actNodeWeights,
      defaultNodeWeights: defaultWeights,
    };
  }

  function pickNodeTypeByWeight(weights, random) {
    const entries = STAGE_NODE_TYPES.map((type) => ({
      type,
      weight: Number.isFinite(weights?.[type]) ? Math.max(0, weights[type]) : 0,
    }));
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) {
      return "enemy";
    }

    let roll = random() * totalWeight;
    for (let index = 0; index < entries.length; index += 1) {
      roll -= entries[index].weight;
      if (roll <= 0) {
        return entries[index].type;
      }
    }
    return entries[entries.length - 1].type;
  }

  function sanitizeStageNodeRoute({
    runSectors,
    rawStageNodesBySector,
    fallbackNodeType = "enemy",
  }) {
    const sectors = Array.isArray(runSectors) ? runSectors : [];
    const source = Array.isArray(rawStageNodesBySector) ? rawStageNodesBySector : [];
    const nodesBySector = sectors.map((sector, sectorIndex) => {
      const rawNodes = Array.isArray(source[sectorIndex]) ? source[sectorIndex] : [];
      const normalized = rawNodes
        .map((node, nodeIndex) => {
          const type = normalizeStageNodeType(node?.type);
          const labelCandidate =
            typeof node?.label === "string" && node.label.trim() ? node.label.trim() : "";
          return {
            id: `s${sectorIndex + 1}_n${nodeIndex + 1}_${type}`,
            type,
            label: labelCandidate || type.charAt(0).toUpperCase() + type.slice(1),
          };
        })
        .filter(Boolean);

      if (normalized.length === 0) {
        normalized.push({
          id: `s${sectorIndex + 1}_n1_${normalizeStageNodeType(fallbackNodeType)}`,
          type: normalizeStageNodeType(fallbackNodeType),
          label: normalizeStageNodeType(fallbackNodeType).charAt(0).toUpperCase() + normalizeStageNodeType(fallbackNodeType).slice(1),
        });
      }

      // Keep deterministic combat cadence: first node in every sector is always an enemy.
      normalized[0] = {
        id: `s${sectorIndex + 1}_n1_enemy`,
        type: "enemy",
        label: "Enemy",
      };

      if (sector?.boss) {
        return [normalized[0]];
      }

      return normalized;
    });

    const totalNodes = nodesBySector.reduce((sum, nodes) => sum + nodes.length, 0);
    return {
      stageNodesBySector: nodesBySector,
      totalNodes,
    };
  }

  function buildStageNodeRoute({
    runSectors,
    runSeed = 1,
    encounterModel = null,
    createRandomFn = createDeterministicRandom,
  }) {
    const sectors = Array.isArray(runSectors) ? runSectors : [];
    if (sectors.length === 0) {
      return {
        stageNodesBySector: [],
        totalNodes: 0,
        encounterModel: sanitizeEncounterModel(encounterModel),
      };
    }

    const safeModel = sanitizeEncounterModel(encounterModel);
    const seedValue = Number.isInteger(runSeed) && runSeed > 0 ? runSeed : 1;
    const random = createRandomFn((seedValue ^ 0x9e3779b9) >>> 0);

    const route = sectors.map((sector, sectorIndex) => {
      const act = getSectorActNumber(sector);
      const actWeights =
        act !== null && safeModel.actNodeWeights[String(act)]
          ? safeModel.actNodeWeights[String(act)]
          : safeModel.defaultNodeWeights;
      const min = safeModel.encountersPerStage.min;
      const max = safeModel.encountersPerStage.max;
      const nodeCount = sector?.boss ? 1 : min + Math.floor(random() * (max - min + 1));
      const nodes = [];

      for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
        let type = "enemy";
        if (nodeIndex > 0 && !sector?.boss) {
          const nonCombatWeights = {
            enemy: 0,
            chest: actWeights.chest,
            shrine: actWeights.shrine,
          };
          type = pickNodeTypeByWeight(nonCombatWeights, random);
          if (type === "enemy") {
            type = pickNodeTypeByWeight(actWeights, random);
          }
          if (type === "enemy") {
            type = random() < 0.5 ? "chest" : "shrine";
          }
        }

        nodes.push({
          id: `s${sectorIndex + 1}_n${nodeIndex + 1}_${type}`,
          type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        });
      }

      if (nodes.length === 0) {
        nodes.push({
          id: `s${sectorIndex + 1}_n1_enemy`,
          type: "enemy",
          label: "Enemy",
        });
      }

      nodes[0] = {
        id: `s${sectorIndex + 1}_n1_enemy`,
        type: "enemy",
        label: "Enemy",
      };

      return nodes;
    });

    return {
      ...sanitizeStageNodeRoute({
        runSectors: sectors,
        rawStageNodesBySector: route,
      }),
      encounterModel: safeModel,
    };
  }

  function getStageProgress({ stageNodesBySector, sectorIndex = 0, stageNodeIndex = 0, runSectorsLength = 0 }) {
    const nodesBySector = Array.isArray(stageNodesBySector) ? stageNodesBySector : [];
    const totalNodesRaw = nodesBySector.reduce(
      (sum, nodes) => sum + (Array.isArray(nodes) && nodes.length > 0 ? nodes.length : 1),
      0
    );
    const fallbackTotal = Number.isInteger(runSectorsLength) ? Math.max(0, runSectorsLength) : 0;
    const totalNodes = Math.max(totalNodesRaw, fallbackTotal);
    const safeSectorIndex = Number.isInteger(sectorIndex) ? Math.max(0, sectorIndex) : 0;

    const nodesInSector = (() => {
      const currentNodes = nodesBySector[safeSectorIndex];
      if (Array.isArray(currentNodes) && currentNodes.length > 0) {
        return currentNodes.length;
      }
      return 1;
    })();

    const safeStageNodeIndex = Number.isInteger(stageNodeIndex)
      ? Math.max(0, Math.min(nodesInSector - 1, stageNodeIndex))
      : 0;

    const completedBeforeSector = nodesBySector
      .slice(0, safeSectorIndex)
      .reduce((sum, nodes) => sum + (Array.isArray(nodes) && nodes.length > 0 ? nodes.length : 1), 0);

    const completedNodes = Math.min(totalNodes, completedBeforeSector + safeStageNodeIndex);
    return {
      totalNodes,
      completedNodes,
      nodesInSector,
      stageNodeIndex: safeStageNodeIndex,
    };
  }

  function normalizeRewardChoice(choice) {
    if (!choice) {
      return null;
    }
    if (typeof choice === "string") {
      return {
        type: "card",
        cardId: choice,
      };
    }
    if (choice.type === "card" && typeof choice.cardId === "string") {
      return {
        type: "card",
        cardId: choice.cardId,
      };
    }
    if (choice.type === "upgrade" && typeof choice.upgradeId === "string") {
      const branchId =
        typeof choice.branchId === "string" && choice.branchId.trim() ? choice.branchId.trim() : "";
      return {
        type: "upgrade",
        upgradeId: choice.upgradeId,
        ...(branchId ? { branchId } : {}),
      };
    }
    if (choice.type === "artifact" && typeof choice.artifactId === "string") {
      return {
        type: "artifact",
        artifactId: choice.artifactId,
      };
    }
    if (choice.type === "gear" && typeof choice.gearId === "string") {
      return {
        type: "gear",
        gearId: choice.gearId,
      };
    }
    return null;
  }

  function getRewardChoiceKey(choice) {
    const normalized = normalizeRewardChoice(choice);
    if (!normalized) {
      return "";
    }
    if (normalized.type === "card") {
      return `card:${normalized.cardId}`;
    }
    if (normalized.type === "artifact") {
      return `artifact:${normalized.artifactId}`;
    }
    if (normalized.type === "gear") {
      return `gear:${normalized.gearId}`;
    }
    return normalized.branchId
      ? `upgrade:${normalized.upgradeId}#${normalized.branchId}`
      : `upgrade:${normalized.upgradeId}`;
  }

  function findInterludeAfterSector({ runInterludes, afterSector }) {
    if (!Number.isInteger(afterSector) || afterSector <= 0) {
      return null;
    }
    return (Array.isArray(runInterludes) ? runInterludes : []).find((entry) => entry.afterSector === afterSector) || null;
  }

  function describeInterludeOptionEffects({ option, cardCatalog }) {
    const parts = [];
    if (option?.hull > 0) {
      parts.push(`+${option.hull} Hull`);
    } else if (option?.hull < 0) {
      parts.push(`${option.hull} Hull`);
    }
    if (option?.heat > 0) {
      parts.push(`+${option.heat} Heat`);
    } else if (option?.heat < 0) {
      parts.push(`${option.heat} Heat`);
    }
    if (option?.addCard) {
      parts.push(`Add ${cardCatalog?.[option.addCard]?.title || option.addCard}`);
    }
    if (option?.removeCard) {
      parts.push(`Remove ${cardCatalog?.[option.removeCard]?.title || option.removeCard}`);
    }
    if (option?.targetSector) {
      parts.push(`Route -> Sector ${option.targetSector}`);
    }
    return parts.join(" // ");
  }

  window.BRASSLINE_PROGRESSION = {
    cloneRunSectors,
    sanitizeConfiguredRunSectors,
    sanitizeConfiguredCardList,
    sanitizeConfiguredInterludes,
    buildConfiguredProgression,
    buildRunRouteSignature,
    normalizeStageNodeType,
    sanitizeEncounterModel,
    sanitizeStageNodeRoute,
    buildStageNodeRoute,
    getStageProgress,
    pickSectorEncounter,
    estimateEncounterEliteChance,
    estimateEncounterKeyInclusionChances,
    buildUpgradePathCatalog,
    createDefaultUpgradeState,
    createDefaultRunStats,
    createDefaultRunRecords,
    createDefaultRecordHighlights,
    createDefaultRunTimeline,
    appendRunTimelineEntry,
    ensureRunStats,
    ensureRunRecords,
    normalizeRewardChoice,
    getRewardChoiceKey,
    findInterludeAfterSector,
    describeInterludeOptionEffects,
  };
})();
