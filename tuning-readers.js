(() => {
  function getTuningValue(container, key, fallback) {
    if (!container || typeof container !== "object" || !(key in container)) {
      return fallback;
    }
    const candidate = container[key];
    if (typeof fallback === "number") {
      return Number.isFinite(candidate) ? candidate : fallback;
    }
    if (typeof fallback === "string") {
      return typeof candidate === "string" ? candidate : fallback;
    }
    if (typeof fallback === "boolean") {
      return typeof candidate === "boolean" ? candidate : fallback;
    }
    return candidate ?? fallback;
  }

  function createTuningReaders({ enemyTuning, cardTuning, upgradePathTuning } = {}) {
    const enemyMap = enemyTuning && typeof enemyTuning === "object" ? enemyTuning : {};
    const cardMap = cardTuning && typeof cardTuning === "object" ? cardTuning : {};
    const upgradePathMap =
      upgradePathTuning && typeof upgradePathTuning === "object" ? upgradePathTuning : {};

    function getEnemyTuning(enemyId) {
      const tuning = enemyMap[enemyId];
      if (!tuning || typeof tuning !== "object") {
        return {};
      }
      return tuning;
    }

    function enemyTune(enemyId, key, fallback) {
      return getTuningValue(getEnemyTuning(enemyId), key, fallback);
    }

    function enemyIntentTune(enemyId, intentIndex, key, fallback) {
      const intents = getEnemyTuning(enemyId).intents;
      if (!Array.isArray(intents) || !intents[intentIndex] || typeof intents[intentIndex] !== "object") {
        return fallback;
      }
      return getTuningValue(intents[intentIndex], key, fallback);
    }

    function getCardTuning(cardId) {
      const tuning = cardMap[cardId];
      if (!tuning || typeof tuning !== "object") {
        return {};
      }
      return tuning;
    }

    function cardTune(cardId, key, fallback) {
      return getTuningValue(getCardTuning(cardId), key, fallback);
    }

    function getUpgradePathTuning(pathId) {
      const tuning = upgradePathMap[pathId];
      if (!tuning || typeof tuning !== "object") {
        return {};
      }
      return tuning;
    }

    function upgradePathTune(pathId, key, fallback) {
      return getTuningValue(getUpgradePathTuning(pathId), key, fallback);
    }

    return {
      getEnemyTuning,
      enemyTune,
      enemyIntentTune,
      getCardTuning,
      cardTune,
      getUpgradePathTuning,
      upgradePathTune,
    };
  }

  window.BRASSLINE_TUNING_READERS = {
    getTuningValue,
    createTuningReaders,
  };
})();
