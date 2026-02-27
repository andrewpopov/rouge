(() => {
  function saveMetaUpgradeState({ writeMetaUpgrades, key, upgrades }) {
    if (typeof writeMetaUpgrades === "function") {
      writeMetaUpgrades({
        key,
        upgrades,
      });
    }
  }

  function clearMetaUpgradeState({ removeKey, key }) {
    if (typeof removeKey === "function") {
      removeKey(key);
    }
  }

  function getUpgradeLevel({ upgrades, pathId }) {
    return upgrades?.[pathId] ?? 0;
  }

  function hasInstalledMetaUpgrades({ upgrades }) {
    return Object.values(upgrades || {}).some((level) => Number.isInteger(level) && level > 0);
  }

  function getMetaInstalledLevelsTotal({ upgradePathCatalog, getUpgradeLevelFn }) {
    return Object.values(upgradePathCatalog).reduce((sum, path) => sum + getUpgradeLevelFn(path.id), 0);
  }

  function getMetaPossibleLevelsTotal({ upgradePathCatalog }) {
    return Object.values(upgradePathCatalog).reduce((sum, path) => sum + path.maxLevel, 0);
  }

  function hasRunRecordsData({ ensureRunRecords }) {
    const records = ensureRunRecords();
    return (
      records.totalRuns > 0 ||
      records.wins > 0 ||
      records.bestVictoryTurns !== null ||
      records.bestDamageDealt > 0 ||
      records.bestSectorsCleared > 0 ||
      records.bestMetaLevels > 0
    );
  }

  function isMetaResetArmed({ metaResetArmedUntil, nowMs = Date.now() }) {
    return Number.isFinite(metaResetArmedUntil) && metaResetArmedUntil > nowMs;
  }

  function isRunRecordsResetArmed({ runRecordsResetArmedUntil, nowMs = Date.now() }) {
    return Number.isFinite(runRecordsResetArmedUntil) && runRecordsResetArmedUntil > nowMs;
  }

  function applyUpgradeDerivedCaps({
    game,
    getUpgradeLevelFn,
    baseMaxHull,
    hullPerHullPlatingLevel,
    baseMaxEnergy,
    clamp,
  }) {
    if (!game?.player) {
      return;
    }
    const nextMaxHull = baseMaxHull + getUpgradeLevelFn("hull_plating") * hullPerHullPlatingLevel;
    const nextMaxEnergy = baseMaxEnergy + getUpgradeLevelFn("condenser_bank");
    game.player.maxHull = nextMaxHull;
    game.player.hull = clamp(game.player.hull, 0, nextMaxHull);
    game.player.maxEnergy = nextMaxEnergy;
    game.player.energy = clamp(game.player.energy, 0, nextMaxEnergy);
  }

  function getUpgradeablePathIds({ upgradePathCatalog, getUpgradeLevelFn }) {
    return Object.values(upgradePathCatalog)
      .filter((path) => getUpgradeLevelFn(path.id) < path.maxLevel)
      .map((path) => path.id);
  }

  function getTurnStartCoolingAmount({ turnStartCoolingBase, getUpgradeLevelFn, turnStartCoolingPerLevel }) {
    return turnStartCoolingBase + getUpgradeLevelFn("coolant_loop") * turnStartCoolingPerLevel;
  }

  function getTurnStartBlockAmount({ getUpgradeLevelFn, turnStartBlockPerGuardLevel }) {
    return getUpgradeLevelFn("guard_protocol") * turnStartBlockPerGuardLevel;
  }

  function applyUpgradePath({
    game,
    pathId,
    upgradePathCatalog,
    getUpgradeLevelFn,
    applyUpgradeDerivedCapsFn,
    clamp,
    saveMetaUpgradeStateFn,
  }) {
    const path = upgradePathCatalog[pathId];
    if (!path) {
      return null;
    }

    const currentLevel = getUpgradeLevelFn(pathId);
    if (currentLevel >= path.maxLevel) {
      return null;
    }

    const nextLevel = currentLevel + 1;
    const previousMaxHull = game.player.maxHull;
    const previousMaxEnergy = game.player.maxEnergy;
    game.upgrades[pathId] = nextLevel;
    applyUpgradeDerivedCapsFn();

    if (pathId === "condenser_bank" && game.player.maxEnergy > previousMaxEnergy) {
      game.player.energy = game.player.maxEnergy;
    }
    if (pathId === "hull_plating" && game.player.maxHull > previousMaxHull) {
      const gainedHull = game.player.maxHull - previousMaxHull;
      game.player.hull = clamp(game.player.hull + gainedHull, 0, game.player.maxHull);
    }
    saveMetaUpgradeStateFn();

    return {
      path,
      currentLevel,
      nextLevel,
    };
  }

  function recordRunOutcome({
    outcome,
    ensureRunRecords,
    ensureRunStats,
    createDefaultRecordHighlights,
    runSectorsLength,
    clamp,
    game,
    getMetaInstalledLevelsTotalFn,
    saveRunRecordsStateFn,
  }) {
    if (outcome !== "run_victory" && outcome !== "gameover") {
      return;
    }

    const records = ensureRunRecords();
    const stats = ensureRunStats();
    const previous = { ...records };
    const highlights = createDefaultRecordHighlights();
    const sectorsCleared =
      outcome === "run_victory" ? runSectorsLength : clamp(game.sectorIndex, 0, runSectorsLength);
    const installedMeta = getMetaInstalledLevelsTotalFn();

    records.totalRuns += 1;
    if (outcome === "run_victory") {
      records.wins += 1;
      if (records.bestVictoryTurns === null || game.turn < records.bestVictoryTurns) {
        records.bestVictoryTurns = game.turn;
        highlights.bestVictoryTurns = true;
      }
    }

    if (stats.damageDealt > previous.bestDamageDealt) {
      records.bestDamageDealt = stats.damageDealt;
      highlights.bestDamageDealt = true;
    }
    if (sectorsCleared > previous.bestSectorsCleared) {
      records.bestSectorsCleared = sectorsCleared;
      highlights.bestSectorsCleared = true;
    }
    if (installedMeta > previous.bestMetaLevels) {
      records.bestMetaLevels = installedMeta;
      highlights.bestMetaLevels = true;
    }

    game.runRecordHighlights = highlights;
    saveRunRecordsStateFn();
  }

  window.BRASSLINE_META_PROGRESSION = {
    saveMetaUpgradeState,
    clearMetaUpgradeState,
    getUpgradeLevel,
    hasInstalledMetaUpgrades,
    getMetaInstalledLevelsTotal,
    getMetaPossibleLevelsTotal,
    hasRunRecordsData,
    isMetaResetArmed,
    isRunRecordsResetArmed,
    applyUpgradeDerivedCaps,
    getUpgradeablePathIds,
    getTurnStartCoolingAmount,
    getTurnStartBlockAmount,
    applyUpgradePath,
    recordRunOutcome,
  };
})();
