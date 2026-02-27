(() => {
  function cloneRunSectors(sectors) {
    return (Array.isArray(sectors) ? sectors : []).map((sector) => ({
      name: sector?.name,
      boss: Boolean(sector?.boss),
      enemies: Array.isArray(sector?.enemies)
        ? sector.enemies.map((entry) => ({
            key: entry?.key,
            power: entry?.power,
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
            return { key, power };
          })
          .filter(Boolean);

        if (enemies.length === 0) {
          return null;
        }

        return {
          name: nameCandidate || `Sector ${index + 1}`,
          boss: Boolean(sector.boss),
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
        const enemySig = (Array.isArray(sector?.enemies) ? sector.enemies : [])
          .map((entry) => `${entry.key}:${entry.power}`)
          .join(",");
        return `${index + 1}:${sector?.name}:${sector?.boss ? "boss" : "normal"}:${enemySig}`;
      })
      .join("|");

    const interludeSig = (Array.isArray(runInterludes) ? runInterludes : [])
      .map((entry) => `${entry.afterSector}:${entry.type}:${entry.title}:${(entry.options || []).map((option) => option.label).join(",")}`)
      .join("|");

    return `${sectorSig}::${interludeSig}`;
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

          return [
            pathId,
            {
              id: pathId,
              title,
              icon,
              description,
              maxLevel,
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
      return {
        type: "upgrade",
        upgradeId: choice.upgradeId,
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
    return `upgrade:${normalized.upgradeId}`;
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
    buildUpgradePathCatalog,
    createDefaultUpgradeState,
    createDefaultRunStats,
    createDefaultRunRecords,
    createDefaultRecordHighlights,
    createDefaultRunTimeline,
    ensureRunStats,
    ensureRunRecords,
    normalizeRewardChoice,
    getRewardChoiceKey,
    findInterludeAfterSector,
    describeInterludeOptionEffects,
  };
})();
