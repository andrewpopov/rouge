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

  function readMetaUpgrades({ key, upgradePathCatalog, createDefaultUpgradeState, clamp }) {
    const fallback = createDefaultUpgradeState();
    const parsed = readJson(key);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }
    const stored = parsed.upgrades && typeof parsed.upgrades === "object" ? parsed.upgrades : parsed;

    Object.keys(upgradePathCatalog || {}).forEach((pathId) => {
      const level = Number.parseInt(stored[pathId], 10);
      const maxLevel = Number.parseInt(upgradePathCatalog[pathId]?.maxLevel, 10);
      const cappedMax = Number.isInteger(maxLevel) && maxLevel > 0 ? maxLevel : 0;
      fallback[pathId] = Number.isInteger(level) ? clamp(level, 0, cappedMax) : 0;
    });

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

  function writeMetaUpgrades({ key, upgrades }) {
    return writeJson(key, {
      upgrades,
    });
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
