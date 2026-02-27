const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const ROOT = path.resolve(__dirname, "..");

const MODULE_FILES = [
  "balance.js",
  "utils.js",
  "runtime-utils.js",
  "persistence.js",
  "progression.js",
  "progression-content.js",
  "tuning-readers.js",
  "enemy-catalog.js",
  "card-catalog.js",
  "forecast.js",
  "threats.js",
  "enemy-phase.js",
  "combat-core.js",
  "player-actions.js",
  "run-flow.js",
  "meta-progression.js",
  "game-state.js",
  "hud-state.js",
  "enemy-ui.js",
  "controls-ui.js",
  "run-snapshot.js",
  "run-ui.js",
];

const REQUIRED_SURFACES = {
  BRASSLINE_UTILS: [
    "clamp",
    "randomInt",
    "shuffleInPlace",
    "escapeHtml",
    "formatLaneCoverage",
    "parseLaneData",
    "getTelegraphProgress",
  ],
  BRASSLINE_RUNTIME_UTILS: ["createRuntimeUtils"],
  BRASSLINE_PERSISTENCE: [
    "readJson",
    "writeJson",
    "removeKey",
    "readMetaUpgrades",
    "readRunRecords",
    "writeMetaUpgrades",
    "writeRunRecords",
    "readOnboarding",
    "writeOnboarding",
  ],
  BRASSLINE_PROGRESSION: [
    "cloneRunSectors",
    "sanitizeConfiguredRunSectors",
    "sanitizeConfiguredCardList",
    "sanitizeConfiguredInterludes",
    "buildConfiguredProgression",
    "buildRunRouteSignature",
    "buildUpgradePathCatalog",
    "createDefaultUpgradeState",
    "createDefaultRunStats",
    "createDefaultRunRecords",
    "createDefaultRecordHighlights",
    "createDefaultRunTimeline",
    "ensureRunStats",
    "ensureRunRecords",
    "normalizeRewardChoice",
    "getRewardChoiceKey",
    "findInterludeAfterSector",
    "describeInterludeOptionEffects",
  ],
  BRASSLINE_PROGRESSION_CONTENT: [
    "getDefaultRunSectors",
    "getDefaultStarterDeckRecipe",
    "getDefaultRewardPool",
    "getDefaultInterludes",
    "getDefaultUpgradePathCatalog",
  ],
  BRASSLINE_TUNING_READERS: ["getTuningValue", "createTuningReaders"],
  BRASSLINE_ENEMY_CATALOG: ["createEnemyBlueprints"],
  BRASSLINE_CARD_CATALOG: ["createCardCatalog"],
  BRASSLINE_FORECAST: [
    "getAimedShotLaneThreats",
    "getNextEnemyPhaseForecast",
    "getShiftCapability",
    "getEndTurnProjection",
    "getProjectionAdvice",
    "getForecastRecommendedAction",
    "getForecastThreatClassName",
    "getEndTurnLockMessage",
    "renderLaneThreatForecast",
    "renderControlRecommendations",
  ],
  BRASSLINE_THREATS: [
    "telegraphAffectsLane",
    "getEnemyTelegraphs",
    "getTelegraphCoverageLanes",
    "getTelegraphThreatTypeLabel",
    "renderTrackMap",
  ],
  BRASSLINE_ENEMY_PHASE: ["chooseNextIntent", "rollEnemyIntents", "resolveEnemyIntent"],
  BRASSLINE_COMBAT_CORE: [
    "normalizeCookTier",
    "getCookTurns",
    "getLockedAimLane",
    "getAimedShotDamage",
    "describeIntent",
    "clampLane",
    "getLobLanes",
    "makeSweepLanes",
    "queueTelegraph",
    "resolveTelegraph",
    "advanceTelegraphs",
    "releaseExpiredLockedHighlight",
    "makeCardInstance",
    "createEnemy",
  ],
  BRASSLINE_PLAYER_ACTIONS: [
    "drawCards",
    "damageEnemy",
    "damagePlayer",
    "gainHeat",
    "gainBlock",
    "gainEnergy",
    "consumeAttackMultiplier",
    "collectDeckInstances",
    "isCardPlayable",
    "playCard",
    "discardHand",
    "purgeHand",
    "useOverclock",
    "shiftLane",
    "startPlayerTurn",
    "endTurn",
  ],
  BRASSLINE_RUN_FLOW: [
    "drawRewardChoices",
    "beginInterlude",
    "resolveInterludeOption",
    "beginSectorBattle",
    "applyRewardAndAdvance",
    "checkEndStates",
  ],
  BRASSLINE_META_PROGRESSION: [
    "saveMetaUpgradeState",
    "clearMetaUpgradeState",
    "getUpgradeLevel",
    "hasInstalledMetaUpgrades",
    "getMetaInstalledLevelsTotal",
    "getMetaPossibleLevelsTotal",
    "hasRunRecordsData",
    "isMetaResetArmed",
    "isRunRecordsResetArmed",
    "applyUpgradeDerivedCaps",
    "getUpgradeablePathIds",
    "getTurnStartCoolingAmount",
    "getTurnStartBlockAmount",
    "applyUpgradePath",
    "recordRunOutcome",
  ],
  BRASSLINE_GAME_STATE: [
    "createPlayerState",
    "createFreshRunState",
    "createInitialGameState",
    "applyFreshRunState",
  ],
  BRASSLINE_HUD_STATE: ["getHeatState", "updateSectorLabel", "updateHud"],
  BRASSLINE_ENEMY_UI: [
    "describeTelegraphForTooltip",
    "getIntentPreview",
    "buildEnemyTooltipEntries",
    "buildEnemyThreatRows",
    "renderEnemies",
  ],
  BRASSLINE_CONTROLS_UI: [
    "renderOnboardingPanel",
    "isTypingTarget",
    "isInteractiveShortcutTarget",
    "triggerControlShortcut",
  ],
  BRASSLINE_RUN_SNAPSHOT: [
    "isResumableRunPhase",
    "getCardInstanceNumericId",
    "getTelegraphNumericId",
    "readRunSnapshotState",
    "restoreRunSnapshotState",
    "buildRunSnapshotState",
    "saveRunSnapshotState",
    "clearRunSnapshotState",
  ],
  BRASSLINE_RUN_UI: [
    "createUpgradeNode",
    "getSuggestedUpgradePathId",
    "renderUpgradeStrip",
    "renderRewardMetaSummary",
    "renderRewardPanel",
    "renderInterludePanel",
    "renderRunSummaryPanel",
  ],
};

function loadRuntimeModules() {
  const sandbox = {
    window: {},
  };
  vm.createContext(sandbox);

  MODULE_FILES.forEach((file) => {
    const modulePath = path.join(ROOT, file);
    const source = fs.readFileSync(modulePath, "utf8");
    const script = new vm.Script(source, { filename: modulePath });
    script.runInContext(sandbox);
  });

  return sandbox.window;
}

test("runtime modules expose required function surfaces", () => {
  const runtime = loadRuntimeModules();

  Object.entries(REQUIRED_SURFACES).forEach(([namespace, functions]) => {
    const api = runtime[namespace];
    assert.ok(api && typeof api === "object", `Expected window.${namespace} to be defined`);
    functions.forEach((name) => {
      assert.equal(
        typeof api[name],
        "function",
        `Expected window.${namespace}.${name} to be a function`
      );
    });
  });
});
