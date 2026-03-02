(() => {
  function getStorage() {
    if (!window?.localStorage) {
      return null;
    }
    return window.localStorage;
  }

  function readJson(key) {
    try {
      const storage = getStorage();
      if (!storage) {
        return null;
      }
      const raw = storage.getItem(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      const storage = getStorage();
      if (!storage) {
        return false;
      }
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function removeKey(key) {
    try {
      const storage = getStorage();
      if (!storage) {
        return false;
      }
      storage.removeItem(key);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function readMetaUpgrades({
    key,
    upgradePathCatalog,
    createDefaultUpgradeState,
    createDefaultMetaUnlockState,
    createDefaultMetaBranchState,
    clamp,
  }) {
    const fallback = createDefaultUpgradeState();
    const fallbackUnlocks =
      typeof createDefaultMetaUnlockState === "function"
        ? createDefaultMetaUnlockState()
        : null;
    const fallbackBranches =
      typeof createDefaultMetaBranchState === "function"
        ? createDefaultMetaBranchState()
        : null;
    const parsed = readJson(key);
    if (!parsed || typeof parsed !== "object") {
      if (fallbackUnlocks || fallbackBranches) {
        const payload = { upgrades: fallback };
        if (fallbackUnlocks) {
          payload.unlocks = fallbackUnlocks;
        }
        if (fallbackBranches) {
          payload.branches = fallbackBranches;
        }
        return payload;
      }
      return fallback;
    }
    const stored = parsed.upgrades && typeof parsed.upgrades === "object" ? parsed.upgrades : parsed;
    const storedUnlocks = parsed.unlocks && typeof parsed.unlocks === "object" ? parsed.unlocks : {};
    const storedBranches = parsed.branches && typeof parsed.branches === "object" ? parsed.branches : {};

    Object.keys(upgradePathCatalog || {}).forEach((pathId) => {
      const level = Number.parseInt(stored[pathId], 10);
      const maxLevel = Number.parseInt(upgradePathCatalog[pathId]?.maxLevel, 10);
      const cappedMax = Number.isInteger(maxLevel) && maxLevel > 0 ? maxLevel : 0;
      fallback[pathId] = Number.isInteger(level) ? clamp(level, 0, cappedMax) : 0;

      if (fallbackUnlocks) {
        const tierIds = new Set(
          (Array.isArray(upgradePathCatalog[pathId]?.tierUnlocks) ? upgradePathCatalog[pathId].tierUnlocks : [])
            .map((entry) => (typeof entry?.id === "string" ? entry.id : ""))
            .filter(Boolean)
        );
        fallbackUnlocks[pathId] = (Array.isArray(storedUnlocks[pathId]) ? storedUnlocks[pathId] : [])
          .map((tierId) => (typeof tierId === "string" ? tierId.trim() : ""))
          .filter((tierId) => tierId && tierIds.has(tierId));
      }
      if (fallbackBranches) {
        const branchIds = new Set(
          (
            Array.isArray(upgradePathCatalog[pathId]?.branchChoices?.options)
              ? upgradePathCatalog[pathId].branchChoices.options
              : []
          )
            .map((entry) => (typeof entry?.id === "string" ? entry.id : ""))
            .filter(Boolean)
        );
        const selectedBranch =
          typeof storedBranches[pathId] === "string" ? storedBranches[pathId].trim() : "";
        fallbackBranches[pathId] = selectedBranch && branchIds.has(selectedBranch) ? selectedBranch : "";
      }
    });

    if (fallbackUnlocks || fallbackBranches) {
      const payload = { upgrades: fallback };
      if (fallbackUnlocks) {
        payload.unlocks = fallbackUnlocks;
      }
      if (fallbackBranches) {
        payload.branches = fallbackBranches;
      }
      return payload;
    }
    return fallback;
  }

  function readRunRecords({ key, createDefaultRunRecords }) {
    const fallback = createDefaultRunRecords();
    const parsed = readJson(key);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    const numericKeys = ["totalRuns", "wins", "bestDamageDealt", "bestSectorsCleared", "bestMetaLevels"];
    numericKeys.forEach((recordKey) => {
      const value = Number.parseInt(parsed[recordKey], 10);
      fallback[recordKey] = Number.isInteger(value) ? Math.max(0, value) : 0;
    });

    const bestTurns = Number.parseInt(parsed.bestVictoryTurns, 10);
    fallback.bestVictoryTurns = Number.isInteger(bestTurns) && bestTurns > 0 ? bestTurns : null;
    return fallback;
  }

  function writeMetaUpgrades({ key, upgrades, unlocks, branches }) {
    const payload = {
      upgrades,
    };
    if (unlocks && typeof unlocks === "object") {
      payload.unlocks = unlocks;
    }
    if (branches && typeof branches === "object") {
      payload.branches = branches;
    }
    return writeJson(key, payload);
  }

  function writeRunRecords({ key, runRecords }) {
    return writeJson(key, runRecords);
  }

  function readOnboarding({ key }) {
    const fallback = {
      dismissed: false,
    };
    const parsed = readJson(key);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }
    return {
      dismissed: Boolean(parsed.dismissed),
    };
  }

  function writeOnboarding({ key, dismissed }) {
    return writeJson(key, {
      dismissed: Boolean(dismissed),
    });
  }

  window.BRASSLINE_PERSISTENCE = {
    readJson,
    writeJson,
    removeKey,
    readMetaUpgrades,
    readRunRecords,
    writeMetaUpgrades,
    writeRunRecords,
    readOnboarding,
    writeOnboarding,
  };
})();
