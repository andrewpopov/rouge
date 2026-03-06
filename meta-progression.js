(() => {
  function saveMetaUpgradeState({ writeMetaUpgrades, key, upgrades, metaUnlocks, metaBranches }) {
    if (typeof writeMetaUpgrades === "function") {
      writeMetaUpgrades({
        key,
        upgrades,
        unlocks: metaUnlocks,
        branches: metaBranches,
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

  function createDefaultMetaUnlockState({ upgradePathCatalog }) {
    return Object.fromEntries(Object.keys(upgradePathCatalog || {}).map((pathId) => [pathId, []]));
  }

  function createDefaultMetaBranchState({ upgradePathCatalog }) {
    return Object.fromEntries(Object.keys(upgradePathCatalog || {}).map((pathId) => [pathId, ""]));
  }

  function getPathTierUnlocks(path) {
    return (Array.isArray(path?.tierUnlocks) ? path.tierUnlocks : [])
      .filter((entry) => entry && typeof entry.id === "string")
      .slice()
      .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
  }

  function getTierUnlockIdsForLevel(path, level) {
    const safeLevel = Number.isInteger(level) ? Math.max(0, level) : 0;
    return getPathTierUnlocks(path)
      .filter((tier) => Number.isInteger(tier.level) && tier.level > 0 && safeLevel >= tier.level)
      .map((tier) => tier.id);
  }

  function getPathBranchChoices(path) {
    const branchChoices = path?.branchChoices;
    if (!branchChoices || typeof branchChoices !== "object") {
      return null;
    }
    const unlockLevel = Number.parseInt(branchChoices.unlockLevel, 10);
    if (!Number.isInteger(unlockLevel) || unlockLevel <= 0) {
      return null;
    }
    const options = (Array.isArray(branchChoices.options) ? branchChoices.options : [])
      .map((option) => {
        if (!option || typeof option !== "object" || typeof option.id !== "string") {
          return null;
        }
        const id = option.id.trim();
        if (!id) {
          return null;
        }
        return {
          id,
          title: typeof option.title === "string" ? option.title : id,
          description: typeof option.description === "string" ? option.description : "",
          effect: typeof option.effect === "string" ? option.effect.trim() : "",
          value: Number.isFinite(option.value) ? Math.round(option.value) : 0,
        };
      })
      .filter(Boolean);
    if (options.length < 2) {
      return null;
    }
    return {
      unlockLevel,
      options,
    };
  }

  function hydrateMetaUnlockState({ upgradePathCatalog, upgrades, metaUnlocks }) {
    const normalized = createDefaultMetaUnlockState({ upgradePathCatalog });

    Object.values(upgradePathCatalog || {}).forEach((path) => {
      if (!path || typeof path !== "object" || typeof path.id !== "string") {
        return;
      }
      const tierUnlocks = getPathTierUnlocks(path);
      if (tierUnlocks.length === 0) {
        normalized[path.id] = [];
        return;
      }

      const allowed = new Set(tierUnlocks.map((tier) => tier.id));
      const rawUnlocked = Array.isArray(metaUnlocks?.[path.id]) ? metaUnlocks[path.id] : [];
      const normalizedUnlocked = rawUnlocked
        .map((tierId) => (typeof tierId === "string" ? tierId.trim() : ""))
        .filter((tierId) => tierId && allowed.has(tierId));
      const unlockedByLevel = getTierUnlockIdsForLevel(path, upgrades?.[path.id] ?? 0);
      const merged = new Set([...normalizedUnlocked, ...unlockedByLevel]);
      normalized[path.id] = tierUnlocks.map((tier) => tier.id).filter((tierId) => merged.has(tierId));
    });

    return normalized;
  }

  function hydrateMetaBranchState({
    upgradePathCatalog,
    upgrades,
    metaBranches,
    autoAssignByLevel = true,
  }) {
    const normalized = createDefaultMetaBranchState({ upgradePathCatalog });

    Object.values(upgradePathCatalog || {}).forEach((path) => {
      if (!path || typeof path !== "object" || typeof path.id !== "string") {
        return;
      }
      const branchChoices = getPathBranchChoices(path);
      if (!branchChoices) {
        normalized[path.id] = "";
        return;
      }

      const allowed = new Set(branchChoices.options.map((option) => option.id));
      const stored = typeof metaBranches?.[path.id] === "string" ? metaBranches[path.id].trim() : "";
      if (stored && allowed.has(stored)) {
        normalized[path.id] = stored;
        return;
      }

      const level = Number.isInteger(upgrades?.[path.id]) ? upgrades[path.id] : 0;
      if (autoAssignByLevel && level >= branchChoices.unlockLevel) {
        normalized[path.id] = branchChoices.options[0].id;
        return;
      }

      normalized[path.id] = "";
    });

    return normalized;
  }

  function getUnlockedTierCount({ metaUnlocks }) {
    return Object.values(metaUnlocks || {}).reduce((sum, value) => {
      if (!Array.isArray(value)) {
        return sum;
      }
      return sum + value.length;
    }, 0);
  }

  function getMetaTierBonusTotals({ upgradePathCatalog, metaUnlocks }) {
    const totals = {
      max_energy_bonus: 0,
      max_hull_bonus: 0,
      turn_start_cooling_bonus: 0,
      turn_start_block_bonus: 0,
    };

    Object.values(upgradePathCatalog || {}).forEach((path) => {
      if (!path || typeof path !== "object" || typeof path.id !== "string") {
        return;
      }
      const unlocked = new Set(Array.isArray(metaUnlocks?.[path.id]) ? metaUnlocks[path.id] : []);
      getPathTierUnlocks(path).forEach((tier) => {
        if (!unlocked.has(tier.id)) {
          return;
        }
        const effect = typeof tier.effect === "string" ? tier.effect.trim() : "";
        const value = Number.isFinite(tier.value) ? Math.round(tier.value) : 0;
        if (!effect || !Object.prototype.hasOwnProperty.call(totals, effect) || value === 0) {
          return;
        }
        totals[effect] += value;
      });
    });

    return totals;
  }

  function getMetaBranchBonusTotals({ upgradePathCatalog, metaBranches }) {
    const totals = {
      max_energy_bonus: 0,
      max_hull_bonus: 0,
      turn_start_cooling_bonus: 0,
      turn_start_block_bonus: 0,
    };

    Object.values(upgradePathCatalog || {}).forEach((path) => {
      if (!path || typeof path !== "object" || typeof path.id !== "string") {
        return;
      }
      const selectedId = typeof metaBranches?.[path.id] === "string" ? metaBranches[path.id] : "";
      if (!selectedId) {
        return;
      }
      const branchChoices = getPathBranchChoices(path);
      if (!branchChoices) {
        return;
      }
      const selected = branchChoices.options.find((option) => option.id === selectedId);
      if (!selected) {
        return;
      }
      const effect = typeof selected.effect === "string" ? selected.effect.trim() : "";
      const value = Number.isFinite(selected.value) ? Math.round(selected.value) : 0;
      if (!effect || !Object.prototype.hasOwnProperty.call(totals, effect) || value === 0) {
        return;
      }
      totals[effect] += value;
    });

    return totals;
  }

  function getMetaBranchSelection({ metaBranches, pathId }) {
    const selected = typeof metaBranches?.[pathId] === "string" ? metaBranches[pathId].trim() : "";
    return selected || "";
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
    upgradePathCatalog,
    metaUnlocks,
    metaBranches,
  }) {
    if (!game?.player) {
      return;
    }
    const tierBonuses = getMetaTierBonusTotals({
      upgradePathCatalog,
      metaUnlocks,
    });
    const branchBonuses = getMetaBranchBonusTotals({
      upgradePathCatalog,
      metaBranches,
    });
    const nextMaxHull =
      baseMaxHull +
      getUpgradeLevelFn("hull_plating") * hullPerHullPlatingLevel +
      tierBonuses.max_hull_bonus +
      branchBonuses.max_hull_bonus;
    const nextMaxEnergy =
      baseMaxEnergy +
      getUpgradeLevelFn("condenser_bank") +
      tierBonuses.max_energy_bonus +
      branchBonuses.max_energy_bonus;
    game.player.maxHull = nextMaxHull;
    game.player.hull = clamp(game.player.hull, 0, nextMaxHull);
    game.player.maxEnergy = nextMaxEnergy;
    game.player.energy = clamp(game.player.energy, 0, nextMaxEnergy);
  }

  function getUpgradeablePathChoices({
    upgradePathCatalog,
    getUpgradeLevelFn,
    getMetaBranchSelectionFn = () => "",
  }) {
    return Object.values(upgradePathCatalog).flatMap((path) => {
      const currentLevel = getUpgradeLevelFn(path.id);
      if (currentLevel >= path.maxLevel) {
        return [];
      }
      const branchChoices = getPathBranchChoices(path);
      const selectedBranch = getMetaBranchSelectionFn(path.id);
      const hasPendingBranch =
        branchChoices &&
        !selectedBranch &&
        Number.isInteger(branchChoices.unlockLevel) &&
        currentLevel + 1 >= branchChoices.unlockLevel;
      if (!hasPendingBranch) {
        return [{ upgradeId: path.id }];
      }
      return branchChoices.options.map((option) => ({
        upgradeId: path.id,
        branchId: option.id,
      }));
    });
  }

  function getUpgradeablePathIds({ upgradePathCatalog, getUpgradeLevelFn, getMetaBranchSelectionFn = () => "" }) {
    const ids = getUpgradeablePathChoices({
      upgradePathCatalog,
      getUpgradeLevelFn,
      getMetaBranchSelectionFn,
    }).map((choice) => choice.upgradeId);
    return Array.from(new Set(ids));
  }

  function getTurnStartCoolingAmount({
    turnStartCoolingBase,
    getUpgradeLevelFn,
    turnStartCoolingPerLevel,
    upgradePathCatalog,
    metaUnlocks,
    metaBranches,
  }) {
    const tierBonuses = getMetaTierBonusTotals({
      upgradePathCatalog,
      metaUnlocks,
    });
    const branchBonuses = getMetaBranchBonusTotals({
      upgradePathCatalog,
      metaBranches,
    });
    return (
      turnStartCoolingBase +
      getUpgradeLevelFn("coolant_loop") * turnStartCoolingPerLevel +
      tierBonuses.turn_start_cooling_bonus +
      branchBonuses.turn_start_cooling_bonus
    );
  }

  function getTurnStartBlockAmount({
    getUpgradeLevelFn,
    turnStartBlockPerGuardLevel,
    upgradePathCatalog,
    metaUnlocks,
    metaBranches,
  }) {
    const tierBonuses = getMetaTierBonusTotals({
      upgradePathCatalog,
      metaUnlocks,
    });
    const branchBonuses = getMetaBranchBonusTotals({
      upgradePathCatalog,
      metaBranches,
    });
    return (
      getUpgradeLevelFn("guard_protocol") * turnStartBlockPerGuardLevel +
      tierBonuses.turn_start_block_bonus +
      branchBonuses.turn_start_block_bonus
    );
  }

  function applyUpgradePath({
    game,
    pathId,
    branchId = "",
    upgradePathCatalog,
    getUpgradeLevelFn,
    getMetaBranchSelectionFn = () => "",
    applyUpgradeDerivedCapsFn,
    clamp,
    createDefaultMetaBranchStateFn = () => ({}),
    hydrateMetaBranchStateFn = hydrateMetaBranchState,
    getPathBranchChoicesFn = getPathBranchChoices,
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

    if (!game.metaBranches || typeof game.metaBranches !== "object") {
      game.metaBranches = createDefaultMetaBranchStateFn({ upgradePathCatalog });
    }

    const nextLevel = currentLevel + 1;
    const previousMaxHull = game.player.maxHull;
    const previousMaxEnergy = game.player.maxEnergy;
    const previousUnlocked = new Set(
      Array.isArray(game.metaUnlocks?.[pathId]) ? game.metaUnlocks[pathId] : []
    );
    game.upgrades[pathId] = nextLevel;
    game.metaUnlocks = hydrateMetaUnlockState({
      upgradePathCatalog,
      upgrades: game.upgrades,
      metaUnlocks: game.metaUnlocks,
    });
    game.metaBranches = hydrateMetaBranchStateFn({
      upgradePathCatalog,
      upgrades: game.upgrades,
      metaBranches: game.metaBranches,
      autoAssignByLevel: false,
    });
    const branchChoices = getPathBranchChoicesFn(path);
    const selectedBefore = getMetaBranchSelectionFn(pathId);
    let selectedBranch = selectedBefore;
    if (
      branchChoices &&
      !selectedBefore &&
      Number.isInteger(branchChoices.unlockLevel) &&
      nextLevel >= branchChoices.unlockLevel
    ) {
      const selectedOption =
        branchChoices.options.find((option) => option.id === branchId) || branchChoices.options[0] || null;
      if (selectedOption) {
        game.metaBranches[pathId] = selectedOption.id;
        selectedBranch = selectedOption.id;
      }
    }
    applyUpgradeDerivedCapsFn();

    if (pathId === "condenser_bank" && game.player.maxEnergy > previousMaxEnergy) {
      game.player.energy = game.player.maxEnergy;
    }
    if (pathId === "hull_plating" && game.player.maxHull > previousMaxHull) {
      const gainedHull = game.player.maxHull - previousMaxHull;
      game.player.hull = clamp(game.player.hull + gainedHull, 0, game.player.maxHull);
    }
    saveMetaUpgradeStateFn();

    const unlockedTierIds = Array.isArray(game.metaUnlocks?.[pathId]) ? game.metaUnlocks[pathId] : [];
    const newlyUnlockedTiers = getPathTierUnlocks(path).filter(
      (tier) => unlockedTierIds.includes(tier.id) && !previousUnlocked.has(tier.id)
    );
    const chosenBranch =
      branchChoices && selectedBranch
        ? branchChoices.options.find((option) => option.id === selectedBranch) || null
        : null;

    return {
      path,
      currentLevel,
      nextLevel,
      newlyUnlockedTiers,
      chosenBranch,
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
    if (outcome !== "run_complete" && outcome !== "run_failed") {
      return;
    }

    const records = ensureRunRecords();
    const stats = ensureRunStats();
    const previous = { ...records };
    const highlights = createDefaultRecordHighlights();
    const sectorsCleared =
      outcome === "run_complete" ? runSectorsLength : clamp(game.sectorIndex, 0, runSectorsLength);
    const installedMeta = getMetaInstalledLevelsTotalFn();

    records.totalRuns += 1;
    if (outcome === "run_complete") {
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
    createDefaultMetaUnlockState,
    createDefaultMetaBranchState,
    getPathBranchChoices,
    hydrateMetaUnlockState,
    hydrateMetaBranchState,
    getUnlockedTierCount,
    getMetaBranchSelection,
    hasInstalledMetaUpgrades,
    getMetaInstalledLevelsTotal,
    getMetaPossibleLevelsTotal,
    hasRunRecordsData,
    isMetaResetArmed,
    isRunRecordsResetArmed,
    applyUpgradeDerivedCaps,
    getUpgradeablePathChoices,
    getUpgradeablePathIds,
    getTurnStartCoolingAmount,
    getTurnStartBlockAmount,
    applyUpgradePath,
    recordRunOutcome,
  };
})();
