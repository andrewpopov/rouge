const BALANCE = window.BRASSLINE_BALANCE || {};
const HAND_SIZE = BALANCE.rules?.handSize ?? 5;
const MAX_HEAT = BALANCE.rules?.maxHeat ?? 120;
const REWARD_CHOICE_COUNT = BALANCE.rewards?.choiceCount ?? 3;
const TRACK_LANES = BALANCE.rules?.trackLanes ?? 5;
const COOK_TIER_TURNS = {
  fast: BALANCE.telegraph?.cookTurns?.fast ?? 1,
  medium: BALANCE.telegraph?.cookTurns?.medium ?? 2,
  slow: BALANCE.telegraph?.cookTurns?.slow ?? 3,
};
const COOK_TIER_LABEL = {
  fast: "FAST",
  medium: "MED",
  slow: "SLOW",
};
const BASE_MAX_HULL = BALANCE.player?.baseMaxHull ?? 72;
const BASE_MAX_ENERGY = BALANCE.player?.baseMaxEnergy ?? 3;
const META_STORAGE_KEY = "brassline_meta_v1";
const RUN_RECORDS_STORAGE_KEY = "brassline_run_records_v1";
const RUN_SNAPSHOT_STORAGE_KEY = "brassline_run_snapshot_v1";
const ONBOARDING_STORAGE_KEY = "brassline_onboarding_v1";
const RUN_SNAPSHOT_VERSION = 1;
const RUN_SNAPSHOT_MAX_AGE_MS = BALANCE.ui?.runSnapshotMaxAgeMs ?? 1000 * 60 * 60 * 24 * 7;
const META_RESET_CONFIRM_WINDOW_MS = BALANCE.ui?.metaResetConfirmMs ?? 2500;
const RUN_RECORDS_RESET_CONFIRM_WINDOW_MS = BALANCE.ui?.recordsResetConfirmMs ?? 2500;
const RUN_TIMELINE_RECENT_COUNT = BALANCE.ui?.timelineRecentCount ?? 14;
const PLAYER_START_HEAT = BALANCE.player?.startHeat ?? 35;
const HEAT_CARRY_RATIO = BALANCE.player?.carryRatio ?? 0.55;
const HEAT_CARRY_FLOOR = BALANCE.player?.carryFloor ?? 15;
const REWARD_HEAL_CHOSEN = BALANCE.rewards?.chosenHeal ?? 8;
const REWARD_HEAL_SKIP = BALANCE.rewards?.skipHeal ?? 4;
const OVERCLOCK_HEAT_GAIN = BALANCE.overclock?.heatGain ?? 12;
const OVERCLOCK_STRAIN_HEAT_THRESHOLD = BALANCE.overclock?.strainThreshold ?? 100;
const OVERCLOCK_STRAIN_DAMAGE = BALANCE.overclock?.strainDamage ?? 3;
const HULL_PER_HULL_PLATING_LEVEL = BALANCE.upgrades?.hullPerHullPlatingLevel ?? 6;
const TURN_START_COOLING_BASE = BALANCE.upgrades?.turnStartCoolingBase ?? 8;
const TURN_START_COOLING_PER_LEVEL = BALANCE.upgrades?.turnStartCoolingPerLevel ?? 2;
const TURN_START_BLOCK_PER_GUARD_LEVEL = BALANCE.upgrades?.turnStartBlockPerGuardLevel ?? 3;

const typeToFrame = {
  Attack: "./assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_red5.png",
  Skill: "./assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_blue5.png",
  Reactor: "./assets/raw/kenney/boardgame-pack/PNG/Cards/cardBack_green5.png",
};

const ENEMY_TUNING = BALANCE.enemies || {};
const CARD_TUNING = BALANCE.cards || {};
const UPGRADE_PATH_TUNING = BALANCE.upgradePaths || {};
const BRASSLINE_UTILS = window.BRASSLINE_UTILS || {};
const BRASSLINE_PERSISTENCE = window.BRASSLINE_PERSISTENCE || {};
const BRASSLINE_PROGRESSION = window.BRASSLINE_PROGRESSION || {};
const BRASSLINE_FORECAST = window.BRASSLINE_FORECAST || {};
const BRASSLINE_THREATS = window.BRASSLINE_THREATS || {};
const BRASSLINE_ENEMY_PHASE = window.BRASSLINE_ENEMY_PHASE || {};
const BRASSLINE_COMBAT_CORE = window.BRASSLINE_COMBAT_CORE || {};
const BRASSLINE_PLAYER_ACTIONS = window.BRASSLINE_PLAYER_ACTIONS || {};
const BRASSLINE_RUN_FLOW = window.BRASSLINE_RUN_FLOW || {};
const BRASSLINE_META_PROGRESSION = window.BRASSLINE_META_PROGRESSION || {};
const BRASSLINE_GAME_STATE = window.BRASSLINE_GAME_STATE || {};
const BRASSLINE_HUD_STATE = window.BRASSLINE_HUD_STATE || {};
const BRASSLINE_ENEMY_UI = window.BRASSLINE_ENEMY_UI || {};
const BRASSLINE_CONTROLS_UI = window.BRASSLINE_CONTROLS_UI || {};
const BRASSLINE_RUN_SNAPSHOT = window.BRASSLINE_RUN_SNAPSHOT || {};
const BRASSLINE_RUN_UI = window.BRASSLINE_RUN_UI || {};
const BRASSLINE_ENEMY_CATALOG = window.BRASSLINE_ENEMY_CATALOG || {};
const BRASSLINE_CARD_CATALOG = window.BRASSLINE_CARD_CATALOG || {};
const BRASSLINE_PROGRESSION_CONTENT = window.BRASSLINE_PROGRESSION_CONTENT || {};
const BRASSLINE_TUNING_READERS = window.BRASSLINE_TUNING_READERS || {};
const BRASSLINE_RUNTIME_UTILS = window.BRASSLINE_RUNTIME_UTILS || {};
const BRASSLINE_ENCOUNTER_MODIFIERS = window.BRASSLINE_ENCOUNTER_MODIFIERS || {};

if (typeof BRASSLINE_RUNTIME_UTILS.createRuntimeUtils !== "function") {
  throw new Error("BRASSLINE_RUNTIME_UTILS.createRuntimeUtils is required.");
}

const { clamp, randomInt, shuffleInPlace, escapeHtml, formatLaneCoverage, parseLaneData, getTelegraphProgress } =
  BRASSLINE_RUNTIME_UTILS.createRuntimeUtils({
    utils: BRASSLINE_UTILS,
    trackLanes: TRACK_LANES,
  });

if (typeof BRASSLINE_TUNING_READERS.createTuningReaders !== "function") {
  throw new Error("BRASSLINE_TUNING_READERS.createTuningReaders is required.");
}

const { enemyTune, enemyIntentTune, cardTune, upgradePathTune } =
  BRASSLINE_TUNING_READERS.createTuningReaders({
    enemyTuning: ENEMY_TUNING,
    cardTuning: CARD_TUNING,
    upgradePathTuning: UPGRADE_PATH_TUNING,
  });

if (typeof BRASSLINE_ENEMY_CATALOG.createEnemyBlueprints !== "function") {
  throw new Error("BRASSLINE_ENEMY_CATALOG.createEnemyBlueprints is required.");
}

const enemyBlueprints = BRASSLINE_ENEMY_CATALOG.createEnemyBlueprints({
  enemyTune,
  enemyIntentTune,
});

if (typeof BRASSLINE_CARD_CATALOG.createCardCatalog !== "function") {
  throw new Error("BRASSLINE_CARD_CATALOG.createCardCatalog is required.");
}

const cardCatalog = BRASSLINE_CARD_CATALOG.createCardCatalog({
  cardTune,
});

if (
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultRunSectors !== "function" ||
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultStarterDeckRecipe !== "function" ||
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultRewardPool !== "function" ||
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultInterludes !== "function" ||
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultArtifactCatalog !== "function" ||
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultUpgradePathCatalog !== "function"
) {
  throw new Error("BRASSLINE_PROGRESSION_CONTENT default providers are required.");
}

const DEFAULT_RUN_SECTORS = BRASSLINE_PROGRESSION_CONTENT.getDefaultRunSectors();
const DEFAULT_STARTER_DECK_RECIPE = BRASSLINE_PROGRESSION_CONTENT.getDefaultStarterDeckRecipe();
const DEFAULT_REWARD_POOL = BRASSLINE_PROGRESSION_CONTENT.getDefaultRewardPool();
const DEFAULT_INTERLUDES = BRASSLINE_PROGRESSION_CONTENT.getDefaultInterludes();
const DEFAULT_ARTIFACT_CATALOG = BRASSLINE_PROGRESSION_CONTENT.getDefaultArtifactCatalog();
const DEFAULT_UPGRADE_PATH_CATALOG = BRASSLINE_PROGRESSION_CONTENT.getDefaultUpgradePathCatalog();

if (
  typeof BRASSLINE_ENCOUNTER_MODIFIERS.buildEncounterModifierCatalog !== "function" ||
  typeof BRASSLINE_ENCOUNTER_MODIFIERS.getRandomEncounterModifier !== "function" ||
  typeof BRASSLINE_ENCOUNTER_MODIFIERS.applyEncounterModifier !== "function"
) {
  throw new Error("BRASSLINE_ENCOUNTER_MODIFIERS APIs are required.");
}

let encounterModifierCatalog = {};

let runSectors = [];
let starterDeckRecipe = [];
let rewardPool = [];
let runInterludes = [];
const artifactCatalog = DEFAULT_ARTIFACT_CATALOG;

function refreshConfiguredProgression() {
  const configured = BRASSLINE_PROGRESSION.buildConfiguredProgression({
    progressionBalance: BALANCE.progression,
    defaultRunSectors: DEFAULT_RUN_SECTORS,
    enemyBlueprints,
    starterDeckConfig: BALANCE.progression?.starterDeck,
    defaultStarterDeck: DEFAULT_STARTER_DECK_RECIPE,
    rewardPoolConfig: BALANCE.progression?.rewardPool,
    defaultRewardPool: DEFAULT_REWARD_POOL,
    interludeConfig: BALANCE.progression?.interludes,
    defaultInterludes: DEFAULT_INTERLUDES,
    cardCatalog,
  });
  runSectors = configured.runSectors;
  starterDeckRecipe = configured.starterDeckRecipe;
  rewardPool = configured.rewardPool;
  runInterludes = configured.runInterludes;
}

function refreshEncounterModifierCatalog() {
  encounterModifierCatalog = BRASSLINE_ENCOUNTER_MODIFIERS.buildEncounterModifierCatalog({
    modifierConfig: BALANCE.progression?.encounterModifiers,
  });
}

refreshConfiguredProgression();
refreshEncounterModifierCatalog();

function getRunRouteSignature() {
  return BRASSLINE_PROGRESSION.buildRunRouteSignature({
    runSectors,
    runInterludes,
  });
}

let upgradePathCatalog = {};

function buildUpgradePathCatalog() {
  return BRASSLINE_PROGRESSION.buildUpgradePathCatalog({
    defaultUpgradePathCatalog: DEFAULT_UPGRADE_PATH_CATALOG,
    upgradePathTune,
    clamp,
    turnStartCoolingBase: TURN_START_COOLING_BASE,
    turnStartCoolingPerLevel: TURN_START_COOLING_PER_LEVEL,
    hullPerHullPlatingLevel: HULL_PER_HULL_PLATING_LEVEL,
    turnStartBlockPerGuardLevel: TURN_START_BLOCK_PER_GUARD_LEVEL,
  });
}

function refreshConfiguredUpgradePaths() {
  upgradePathCatalog = buildUpgradePathCatalog();
}

refreshConfiguredUpgradePaths();

function createDefaultUpgradeState() {
  return BRASSLINE_PROGRESSION.createDefaultUpgradeState({
    upgradePathCatalog,
  });
}

function createDefaultRunStats() {
  return BRASSLINE_PROGRESSION.createDefaultRunStats();
}

function createDefaultRunRecords() {
  return BRASSLINE_PROGRESSION.createDefaultRunRecords();
}

function createDefaultRecordHighlights() {
  return BRASSLINE_PROGRESSION.createDefaultRecordHighlights();
}

function createDefaultRunTimeline() {
  return BRASSLINE_PROGRESSION.createDefaultRunTimeline();
}

function createDefaultMetaUnlockState() {
  if (typeof BRASSLINE_META_PROGRESSION.createDefaultMetaUnlockState !== "function") {
    return {};
  }
  return BRASSLINE_META_PROGRESSION.createDefaultMetaUnlockState({
    upgradePathCatalog,
  });
}

function createDefaultMetaBranchState() {
  if (typeof BRASSLINE_META_PROGRESSION.createDefaultMetaBranchState !== "function") {
    return {};
  }
  return BRASSLINE_META_PROGRESSION.createDefaultMetaBranchState({
    upgradePathCatalog,
  });
}

function createRunSeed() {
  return randomInt(2147483646) + 1;
}

function ensureRunStats() {
  return BRASSLINE_PROGRESSION.ensureRunStats({
    game,
    createDefaultRunStatsFn: createDefaultRunStats,
  });
}

function ensureRunRecords() {
  return BRASSLINE_PROGRESSION.ensureRunRecords({
    game,
    createDefaultRunRecordsFn: createDefaultRunRecords,
  });
}

function readMetaUpgradeState() {
  const parsed = BRASSLINE_PERSISTENCE.readMetaUpgrades({
    key: META_STORAGE_KEY,
    upgradePathCatalog,
    createDefaultUpgradeState,
    createDefaultMetaUnlockState,
    createDefaultMetaBranchState,
    clamp,
  });

  const upgrades =
    parsed && typeof parsed === "object" && parsed.upgrades && typeof parsed.upgrades === "object"
      ? parsed.upgrades
      : parsed;
  const unlocksRaw =
    parsed && typeof parsed === "object" && parsed.unlocks && typeof parsed.unlocks === "object"
      ? parsed.unlocks
      : {};
  const branchesRaw =
    parsed && typeof parsed === "object" && parsed.branches && typeof parsed.branches === "object"
      ? parsed.branches
      : {};
  const safeUpgrades = upgrades && typeof upgrades === "object" ? upgrades : createDefaultUpgradeState();
  const safeUnlocks =
    typeof BRASSLINE_META_PROGRESSION.hydrateMetaUnlockState === "function"
      ? BRASSLINE_META_PROGRESSION.hydrateMetaUnlockState({
          upgradePathCatalog,
          upgrades: safeUpgrades,
          metaUnlocks: unlocksRaw,
        })
      : createDefaultMetaUnlockState();
  const safeBranches =
    typeof BRASSLINE_META_PROGRESSION.hydrateMetaBranchState === "function"
      ? BRASSLINE_META_PROGRESSION.hydrateMetaBranchState({
          upgradePathCatalog,
          upgrades: safeUpgrades,
          metaBranches: branchesRaw,
        })
      : createDefaultMetaBranchState();

  return {
    upgrades: safeUpgrades,
    unlocks: safeUnlocks,
    branches: safeBranches,
  };
}

function readRunRecordsState() {
  return BRASSLINE_PERSISTENCE.readRunRecords({
    key: RUN_RECORDS_STORAGE_KEY,
    createDefaultRunRecords,
  });
}

function saveRunRecordsState() {
  BRASSLINE_PERSISTENCE.writeRunRecords({
    key: RUN_RECORDS_STORAGE_KEY,
    runRecords: ensureRunRecords(),
  });
}

function clearRunRecordsState() {
  BRASSLINE_PERSISTENCE.removeKey(RUN_RECORDS_STORAGE_KEY);
}

function readOnboardingState() {
  return BRASSLINE_PERSISTENCE.readOnboarding({
    key: ONBOARDING_STORAGE_KEY,
  });
}

function saveOnboardingState() {
  BRASSLINE_PERSISTENCE.writeOnboarding({
    key: ONBOARDING_STORAGE_KEY,
    dismissed: game.onboardingDismissed,
  });
}

function isResumableRunPhase(phase) {
  return BRASSLINE_RUN_SNAPSHOT.isResumableRunPhase(phase);
}

function getCardInstanceNumericId(instanceId) {
  return BRASSLINE_RUN_SNAPSHOT.getCardInstanceNumericId(instanceId);
}

function getTelegraphNumericId(telegraphId) {
  return BRASSLINE_RUN_SNAPSHOT.getTelegraphNumericId(telegraphId);
}

function readRunSnapshotState() {
  return BRASSLINE_RUN_SNAPSHOT.readRunSnapshotState({
    readJson: BRASSLINE_PERSISTENCE.readJson,
    key: RUN_SNAPSHOT_STORAGE_KEY,
    snapshotVersion: RUN_SNAPSHOT_VERSION,
    snapshotMaxAgeMs: RUN_SNAPSHOT_MAX_AGE_MS,
    nowMs: Date.now(),
    getRunRouteSignature,
    runSectors,
    createDefaultUpgradeState,
    createDefaultMetaUnlockState,
    createDefaultMetaBranchState,
    createDefaultRunStats,
    createDefaultRunTimeline,
    upgradePathCatalog,
    clamp,
    normalizeCookTier,
    enemyBlueprints,
    enemyTune,
    clampLane,
    cardCatalog,
    normalizeRewardChoice,
    encounterModifierCatalog,
    artifactCatalog,
    trackLanes: TRACK_LANES,
    baseMaxHull: BASE_MAX_HULL,
    baseMaxEnergy: BASE_MAX_ENERGY,
    maxHeat: MAX_HEAT,
    playerStartHeat: PLAYER_START_HEAT,
  });
}

function restoreRunSnapshotState(snapshot) {
  return BRASSLINE_RUN_SNAPSHOT.restoreRunSnapshotState({
    snapshot,
    game,
    createDefaultRecordHighlights,
    disarmMetaReset,
    disarmRunRecordsReset,
    applyUpgradeDerivedCaps,
    clamp,
    ensureRunStats,
    ensureRunRecords,
    getSelectedEnemy,
    setLog,
    renderEnemies,
    renderTrackMap,
    renderCards,
    updateHud,
  });
}

function buildRunSnapshotState() {
  return BRASSLINE_RUN_SNAPSHOT.buildRunSnapshotState({
    game,
    snapshotVersion: RUN_SNAPSHOT_VERSION,
    nowMs: Date.now(),
    getRunRouteSignature,
    normalizeRewardChoice,
    ensureRunStats,
  });
}

function saveRunSnapshotState() {
  BRASSLINE_RUN_SNAPSHOT.saveRunSnapshotState({
    writeJson: BRASSLINE_PERSISTENCE.writeJson,
    removeKey: BRASSLINE_PERSISTENCE.removeKey,
    key: RUN_SNAPSHOT_STORAGE_KEY,
    gamePhase: game.phase,
    isResumableRunPhaseFn: isResumableRunPhase,
    buildRunSnapshotStateFn: buildRunSnapshotState,
  });
}

function clearRunSnapshotState() {
  BRASSLINE_RUN_SNAPSHOT.clearRunSnapshotState({
    removeKey: BRASSLINE_PERSISTENCE.removeKey,
    key: RUN_SNAPSHOT_STORAGE_KEY,
  });
}

const game = BRASSLINE_GAME_STATE.createInitialGameState({
  baseMaxHull: BASE_MAX_HULL,
  baseMaxEnergy: BASE_MAX_ENERGY,
  playerStartHeat: PLAYER_START_HEAT,
  trackLanes: TRACK_LANES,
  createRunSeedFn: createRunSeed,
  createDefaultUpgradeStateFn: createDefaultUpgradeState,
  createDefaultMetaUnlockStateFn: createDefaultMetaUnlockState,
  createDefaultMetaBranchStateFn: createDefaultMetaBranchState,
  createDefaultRunStatsFn: createDefaultRunStats,
  createDefaultRunRecordsFn: createDefaultRunRecords,
  createDefaultRecordHighlightsFn: createDefaultRecordHighlights,
  createDefaultRunTimelineFn: createDefaultRunTimeline,
});

const els = {
  heatFill: document.getElementById("heatFill"),
  heatValue: document.getElementById("heatValue"),
  heatState: document.getElementById("heatState"),
  hullValue: document.getElementById("hullValue"),
  blockValue: document.getElementById("blockValue"),
  energyValue: document.getElementById("energyValue"),
  laneValue: document.getElementById("laneValue"),
  turnValue: document.getElementById("turnValue"),
  onboardingPanel: document.getElementById("onboardingPanel"),
  toggleOnboardingBtn: document.getElementById("toggleOnboardingBtn"),
  dismissOnboardingBtn: document.getElementById("dismissOnboardingBtn"),
  drawCount: document.getElementById("drawCount"),
  discardCount: document.getElementById("discardCount"),
  handCount: document.getElementById("handCount"),
  warningText: document.getElementById("warningText"),
  phaseBadge: document.getElementById("phaseBadge"),
  combatLog: document.getElementById("combatLog"),
  sectorLabel: document.getElementById("sectorLabel"),
  trackMap: document.getElementById("trackMap"),
  laneThreatForecast: document.getElementById("laneThreatForecast"),
  enemyRow: document.getElementById("enemyRow"),
  cardRow: document.getElementById("cardRow"),
  rewardPanel: document.getElementById("rewardPanel"),
  rewardSubtitle: document.getElementById("rewardSubtitle"),
  rewardMeta: document.getElementById("rewardMeta"),
  rewardIntel: document.getElementById("rewardIntel"),
  rewardChoices: document.getElementById("rewardChoices"),
  skipRewardBtn: document.getElementById("skipRewardBtn"),
  interludePanel: document.getElementById("interludePanel"),
  interludeTitle: document.getElementById("interludeTitle"),
  interludeSubtitle: document.getElementById("interludeSubtitle"),
  interludeChoices: document.getElementById("interludeChoices"),
  runSummaryPanel: document.getElementById("runSummaryPanel"),
  runSummaryTitle: document.getElementById("runSummaryTitle"),
  runSummarySubtitle: document.getElementById("runSummarySubtitle"),
  runSummaryStats: document.getElementById("runSummaryStats"),
  toggleRunTimelineBtn: document.getElementById("toggleRunTimelineBtn"),
  runSummaryTimeline: document.getElementById("runSummaryTimeline"),
  upgradeStrip: document.getElementById("upgradeStrip"),
  artifactStrip: document.getElementById("artifactStrip"),
  resetMetaBtn: document.getElementById("resetMetaBtn"),
  resetRunRecordsBtn: document.getElementById("resetRunRecordsBtn"),
  overclockBtn: document.getElementById("overclockBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  shiftLeftBtn: document.getElementById("shiftLeftBtn"),
  shiftRightBtn: document.getElementById("shiftRightBtn"),
  cycleHandBtn: document.getElementById("cycleHandBtn"),
};

function livingEnemies() {
  return game.enemies.filter((enemy) => enemy.alive);
}

function findEnemyById(enemyId) {
  return game.enemies.find((enemy) => enemy.id === enemyId) || null;
}

function getSelectedEnemy() {
  const selected = findEnemyById(game.selectedEnemyId);
  if (selected && selected.alive) {
    return selected;
  }
  const fallback = livingEnemies()[0] || null;
  game.selectedEnemyId = fallback ? fallback.id : null;
  return fallback;
}

function setLog(message) {
  game.log = message;
  els.combatLog.textContent = message;
}

function appendRunTimelineEntry(message, options = {}) {
  BRASSLINE_PROGRESSION.appendRunTimelineEntry({
    game,
    message,
    options,
    createDefaultRunTimelineFn: createDefaultRunTimeline,
    clamp,
    runSectorsLength: runSectors.length,
  });
}

function getHeatState(heat) {
  return BRASSLINE_HUD_STATE.getHeatState({ heat });
}

function normalizeCookTier(tier) {
  return BRASSLINE_COMBAT_CORE.normalizeCookTier({ tier });
}

function getCookTurns(intent) {
  return BRASSLINE_COMBAT_CORE.getCookTurns({
    intent,
    normalizeCookTierFn: normalizeCookTier,
    cookTierTurns: COOK_TIER_TURNS,
  });
}

function getLockedAimLane(enemy) {
  return BRASSLINE_COMBAT_CORE.getLockedAimLane({
    enemy,
    clampLaneFn: clampLane,
  });
}

function getAimedShotDamage(enemy, intent = enemy?.intent) {
  return BRASSLINE_COMBAT_CORE.getAimedShotDamage({
    enemy,
    intent,
  });
}

function describeIntent(enemy) {
  return BRASSLINE_COMBAT_CORE.describeIntent({
    enemy,
    getAimedShotDamageFn: getAimedShotDamage,
    getLockedAimLaneFn: getLockedAimLane,
    normalizeCookTierFn: normalizeCookTier,
    getCookTurnsFn: getCookTurns,
    cookTierLabel: COOK_TIER_LABEL,
  });
}

function clampLane(lane) {
  return BRASSLINE_COMBAT_CORE.clampLane({
    lane,
    clamp,
    trackLanes: TRACK_LANES,
  });
}

function getLobLanes(center, radius) {
  return BRASSLINE_COMBAT_CORE.getLobLanes({
    center,
    radius,
    trackLanes: TRACK_LANES,
  });
}

function makeSweepLanes(width) {
  return BRASSLINE_COMBAT_CORE.makeSweepLanes({
    width,
    clamp,
    trackLanes: TRACK_LANES,
    playerLane: game.player.lane,
  });
}

function queueTelegraph(config) {
  BRASSLINE_COMBAT_CORE.queueTelegraph({
    game,
    config,
    normalizeCookTierFn: normalizeCookTier,
  });
}

function resolveTelegraph(telegraph) {
  return BRASSLINE_COMBAT_CORE.resolveTelegraph({
    game,
    telegraph,
    getLobLanesFn: getLobLanes,
    damagePlayerFn: damagePlayer,
  });
}

function advanceTelegraphs() {
  return BRASSLINE_COMBAT_CORE.advanceTelegraphs({
    game,
    resolveTelegraphFn: resolveTelegraph,
    releaseExpiredLockedHighlightFn: releaseExpiredLockedHighlight,
  });
}

function releaseExpiredLockedHighlight() {
  BRASSLINE_COMBAT_CORE.releaseExpiredLockedHighlight({ game });
}

function drawCards(amount) {
  return BRASSLINE_PLAYER_ACTIONS.drawCards({
    game,
    amount,
    shuffleInPlace,
  });
}

function damageEnemy(enemy, amount) {
  return BRASSLINE_PLAYER_ACTIONS.damageEnemy({
    enemy,
    amount,
    ensureRunStats,
  });
}

function damagePlayer(amount, ignoreBlock = false) {
  return BRASSLINE_PLAYER_ACTIONS.damagePlayer({
    game,
    amount,
    ignoreBlock,
    ensureRunStats,
  });
}

function gainHeat(amount) {
  BRASSLINE_PLAYER_ACTIONS.gainHeat({
    game,
    amount,
    clamp,
    maxHeat: MAX_HEAT,
  });
}

function gainBlock(amount) {
  BRASSLINE_PLAYER_ACTIONS.gainBlock({
    game,
    amount,
  });
}

function gainEnergy(amount) {
  BRASSLINE_PLAYER_ACTIONS.gainEnergy({
    game,
    amount,
  });
}

function consumeAttackMultiplier(baseAmount) {
  return BRASSLINE_PLAYER_ACTIONS.consumeAttackMultiplier({
    game,
    baseAmount,
  });
}

function collectDeckInstances() {
  return BRASSLINE_PLAYER_ACTIONS.collectDeckInstances({
    game,
  });
}

function buildContext(targetEnemy) {
  return {
    game,
    target: targetEnemy,
    hasCombo: () => Number.isInteger(game.turnCardsPlayed) && game.turnCardsPlayed > 0,
    damageEnemy,
    drawCards,
    gainHeat,
    gainBlock,
    gainEnergy,
    consumeAttackMultiplier,
    livingEnemies,
    log: setLog,
  };
}

function isCardPlayable(card, selectedEnemy) {
  return BRASSLINE_PLAYER_ACTIONS.isCardPlayable({
    game,
    card,
    selectedEnemy,
  });
}

function playCard(instanceId) {
  BRASSLINE_PLAYER_ACTIONS.playCard({
    game,
    instanceId,
    cardCatalog,
    getSelectedEnemy,
    isCardPlayableFn: isCardPlayable,
    setLog,
    updateHud,
    buildContextFn: buildContext,
    ensureRunStats,
    checkEndStates,
    renderCards,
    renderEnemies,
    renderTrackMap,
  });
}

function discardHand() {
  BRASSLINE_PLAYER_ACTIONS.discardHand({
    game,
  });
}

function purgeHand() {
  BRASSLINE_PLAYER_ACTIONS.purgeHand({
    game,
    initGame,
    setLog,
    updateHud,
    gainHeatFn: gainHeat,
    discardHandFn: discardHand,
    drawCardsFn: drawCards,
    renderCards,
    purgeHeatGain: 6,
  });
}

function useOverclock() {
  const overclockHeatReduction = getRunArtifactBonus("overclock_heat_reduction");
  const effectiveOverclockHeatGain = Math.max(0, OVERCLOCK_HEAT_GAIN - overclockHeatReduction);
  BRASSLINE_PLAYER_ACTIONS.useOverclock({
    game,
    setLog,
    updateHud,
    gainEnergyFn: gainEnergy,
    gainHeatFn: gainHeat,
    damagePlayerFn: damagePlayer,
    overclockHeatGain: effectiveOverclockHeatGain,
    overclockStrainHeatThreshold: OVERCLOCK_STRAIN_HEAT_THRESHOLD,
    overclockStrainDamage: OVERCLOCK_STRAIN_DAMAGE,
  });
}

function shiftLane(direction) {
  BRASSLINE_PLAYER_ACTIONS.shiftLane({
    game,
    direction,
    setLog,
    clampLane,
    renderTrackMap,
    updateHud,
  });
}

function chooseNextIntent(enemy) {
  BRASSLINE_ENEMY_PHASE.chooseNextIntent({
    enemy,
  });
}

function rollEnemyIntents() {
  BRASSLINE_ENEMY_PHASE.rollEnemyIntents({
    enemies: livingEnemies(),
    chooseNextIntentFn: ({ enemy }) => chooseNextIntent(enemy),
  });
}

function resolveEnemyIntent(enemy) {
  return BRASSLINE_ENEMY_PHASE.resolveEnemyIntent({
    enemy,
    playerLane: game.player.lane,
    getPlayerHull: () => game.player.hull,
    getAimedShotDamage,
    getLockedAimLane,
    damagePlayer,
    gainHeat,
    queueTelegraph,
    clampLane,
    randomInt,
    normalizeCookTier,
    getCookTurns,
    makeSweepLanes,
    cookTierLabel: COOK_TIER_LABEL,
  });
}

function makeCardInstance(cardId) {
  return BRASSLINE_COMBAT_CORE.makeCardInstance({
    game,
    cardId,
  });
}

function createEnemy(entry, slot) {
  return BRASSLINE_COMBAT_CORE.createEnemy({
    game,
    entry,
    slot,
    enemyBlueprints,
    enemyTune,
    enemyIntentTune,
    clamp,
  });
}

function getCurrentSector() {
  return runSectors[game.sectorIndex] || null;
}

function saveMetaUpgradeState() {
  BRASSLINE_META_PROGRESSION.saveMetaUpgradeState({
    writeMetaUpgrades: BRASSLINE_PERSISTENCE.writeMetaUpgrades,
    key: META_STORAGE_KEY,
    upgrades: game.upgrades,
    metaUnlocks: game.metaUnlocks,
    metaBranches: game.metaBranches,
  });
}

function clearMetaUpgradeState() {
  BRASSLINE_META_PROGRESSION.clearMetaUpgradeState({
    removeKey: BRASSLINE_PERSISTENCE.removeKey,
    key: META_STORAGE_KEY,
  });
}

function getUpgradeLevel(pathId) {
  return BRASSLINE_META_PROGRESSION.getUpgradeLevel({
    upgrades: game.upgrades,
    pathId,
  });
}

function hasInstalledMetaUpgrades() {
  return BRASSLINE_META_PROGRESSION.hasInstalledMetaUpgrades({
    upgrades: game.upgrades,
  });
}

function getMetaInstalledLevelsTotal() {
  return BRASSLINE_META_PROGRESSION.getMetaInstalledLevelsTotal({
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
  });
}

function getMetaPossibleLevelsTotal() {
  return BRASSLINE_META_PROGRESSION.getMetaPossibleLevelsTotal({
    upgradePathCatalog,
  });
}

function hasRunRecordsData() {
  return BRASSLINE_META_PROGRESSION.hasRunRecordsData({
    ensureRunRecords,
  });
}

function isMetaResetArmed() {
  return BRASSLINE_META_PROGRESSION.isMetaResetArmed({
    metaResetArmedUntil: game.metaResetArmedUntil,
    nowMs: Date.now(),
  });
}

function disarmMetaReset() {
  game.metaResetArmedUntil = 0;
}

function isRunRecordsResetArmed() {
  return BRASSLINE_META_PROGRESSION.isRunRecordsResetArmed({
    runRecordsResetArmedUntil: game.runRecordsResetArmedUntil,
    nowMs: Date.now(),
  });
}

function disarmRunRecordsReset() {
  game.runRecordsResetArmedUntil = 0;
}

function applyUpgradeDerivedCaps() {
  BRASSLINE_META_PROGRESSION.applyUpgradeDerivedCaps({
    game,
    getUpgradeLevelFn: getUpgradeLevel,
    baseMaxHull: BASE_MAX_HULL,
    hullPerHullPlatingLevel: HULL_PER_HULL_PLATING_LEVEL,
    baseMaxEnergy: BASE_MAX_ENERGY,
    clamp,
    upgradePathCatalog,
    metaUnlocks: game.metaUnlocks,
    metaBranches: game.metaBranches,
  });
}

function getUpgradeablePathIds() {
  return BRASSLINE_META_PROGRESSION.getUpgradeablePathIds({
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
    getMetaBranchSelectionFn: getMetaBranchSelection,
  });
}

function getUpgradeablePathChoices() {
  if (typeof BRASSLINE_META_PROGRESSION.getUpgradeablePathChoices !== "function") {
    return getUpgradeablePathIds().map((upgradeId) => ({ upgradeId }));
  }
  return BRASSLINE_META_PROGRESSION.getUpgradeablePathChoices({
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
    getMetaBranchSelectionFn: getMetaBranchSelection,
  });
}

function getMetaBranchSelection(pathId) {
  if (typeof BRASSLINE_META_PROGRESSION.getMetaBranchSelection !== "function") {
    return typeof game.metaBranches?.[pathId] === "string" ? game.metaBranches[pathId] : "";
  }
  return BRASSLINE_META_PROGRESSION.getMetaBranchSelection({
    metaBranches: game.metaBranches,
    pathId,
  });
}

function getTurnStartCoolingAmount() {
  const upgradeCooling = BRASSLINE_META_PROGRESSION.getTurnStartCoolingAmount({
    turnStartCoolingBase: TURN_START_COOLING_BASE,
    getUpgradeLevelFn: getUpgradeLevel,
    turnStartCoolingPerLevel: TURN_START_COOLING_PER_LEVEL,
    upgradePathCatalog,
    metaUnlocks: game.metaUnlocks,
    metaBranches: game.metaBranches,
  });
  return upgradeCooling + getRunArtifactBonus("turn_start_cooling_bonus");
}

function getTurnStartBlockAmount() {
  const upgradeBlock = BRASSLINE_META_PROGRESSION.getTurnStartBlockAmount({
    getUpgradeLevelFn: getUpgradeLevel,
    turnStartBlockPerGuardLevel: TURN_START_BLOCK_PER_GUARD_LEVEL,
    upgradePathCatalog,
    metaUnlocks: game.metaUnlocks,
    metaBranches: game.metaBranches,
  });
  return upgradeBlock + getRunArtifactBonus("turn_start_block_bonus");
}

function getTurnStartEnergyBonus() {
  return getRunArtifactBonus("turn_start_energy_bonus");
}

function getBattleStartDrawBonus() {
  return getRunArtifactBonus("battle_start_draw_bonus");
}

function applyUpgradePath(pathId, branchId = "") {
  return BRASSLINE_META_PROGRESSION.applyUpgradePath({
    game,
    pathId,
    branchId,
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
    getMetaBranchSelectionFn: getMetaBranchSelection,
    applyUpgradeDerivedCapsFn: applyUpgradeDerivedCaps,
    clamp,
    createDefaultMetaBranchStateFn: createDefaultMetaBranchState,
    hydrateMetaBranchStateFn: BRASSLINE_META_PROGRESSION.hydrateMetaBranchState,
    getPathBranchChoicesFn: BRASSLINE_META_PROGRESSION.getPathBranchChoices,
    saveMetaUpgradeStateFn: saveMetaUpgradeState,
  });
}

function recordRunOutcome(outcome) {
  BRASSLINE_META_PROGRESSION.recordRunOutcome({
    outcome,
    ensureRunRecords,
    ensureRunStats,
    createDefaultRecordHighlights,
    runSectorsLength: runSectors.length,
    clamp,
    game,
    getMetaInstalledLevelsTotalFn: getMetaInstalledLevelsTotal,
    saveRunRecordsStateFn: saveRunRecordsState,
  });
}

function drawRewardChoices() {
  return BRASSLINE_RUN_FLOW.drawRewardChoices({
    rewardPool,
    rewardChoiceCount: REWARD_CHOICE_COUNT,
    shuffleInPlace,
    getUpgradeablePathIds,
    getUpgradeablePathChoices,
    getAvailableArtifactIds,
  });
}

function getRunArtifactBonus(effectId) {
  const artifacts = Array.isArray(game.artifacts) ? game.artifacts : [];
  return artifacts.reduce((sum, artifactId) => {
    const artifact = artifactCatalog[artifactId];
    if (!artifact || artifact.effect !== effectId) {
      return sum;
    }
    const value = Number.parseInt(artifact.value, 10);
    return Number.isInteger(value) ? sum + Math.max(0, value) : sum;
  }, 0);
}

function getAvailableArtifactIds() {
  const owned = new Set(Array.isArray(game.artifacts) ? game.artifacts : []);
  return Object.values(artifactCatalog)
    .filter((artifact) => artifact && typeof artifact.id === "string" && !owned.has(artifact.id))
    .map((artifact) => ({
      id: artifact.id,
      weight:
        Number.isFinite(artifact.weight) && artifact.weight > 0
          ? Math.max(1, Math.floor(artifact.weight))
          : 1,
    }));
}

function getArtifactRewardHealBonus() {
  return getRunArtifactBonus("reward_heal_bonus");
}

function getArtifactBattleStartBlockBonus() {
  return getRunArtifactBonus("battle_start_block");
}

function normalizeRewardChoice(choice) {
  return BRASSLINE_PROGRESSION.normalizeRewardChoice(choice);
}

function getRewardChoiceKey(choice) {
  return BRASSLINE_PROGRESSION.getRewardChoiceKey(choice);
}

function getInterludeForAfterSector(afterSector) {
  return BRASSLINE_PROGRESSION.findInterludeAfterSector({
    runInterludes,
    afterSector,
  });
}

function getModifierSummaryForSector(sector) {
  const catalogEntries = Object.values(encounterModifierCatalog || {}).filter((modifier) => {
    if (!modifier || typeof modifier !== "object") {
      return false;
    }
    if (sector?.boss) {
      return modifier.allowedOnBoss !== false;
    }
    return true;
  });

  if (catalogEntries.length === 0) {
    return "Mutators: none configured.";
  }

  const weighted = catalogEntries
    .map((modifier) => ({
      title: typeof modifier.title === "string" ? modifier.title : modifier.id,
      weight:
        Number.isFinite(modifier.weight) && modifier.weight > 0
          ? Math.max(1, Math.floor(modifier.weight))
          : 1,
    }))
    .sort((a, b) => b.weight - a.weight || String(a.title).localeCompare(String(b.title)));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const summary = weighted
    .slice(0, 3)
    .map((entry) => `${entry.title} ${Math.round((entry.weight / totalWeight) * 100)}%`)
    .join(" // ");
  return `Mutators: ${summary}`;
}

function buildThreatIntelDescriptor(blueprint) {
  const intents = Array.isArray(blueprint?.intents) ? blueprint.intents : [];
  const kinds = intents
    .map((intent) => (typeof intent?.kind === "string" ? intent.kind.trim().toLowerCase() : ""))
    .filter(Boolean);
  if (kinds.length === 0) {
    return "Pattern: unknown.";
  }

  const tags = [];
  if (kinds.includes("attack")) {
    tags.push("direct fire");
  }
  if (kinds.includes("aim")) {
    tags.push("aim lock");
  }
  if (kinds.includes("lob") || kinds.includes("sweep")) {
    tags.push("lane aoe");
  }
  if (kinds.includes("stoke") || kinds.includes("charge")) {
    tags.push("heat pressure");
  }
  if (kinds.includes("guard")) {
    tags.push("defensive");
  }

  const pattern = kinds.map((kind) => kind.toUpperCase()).join(" -> ");
  const laneHint =
    kinds.includes("lob") || kinds.includes("sweep")
      ? "Watch telegraph lanes."
      : kinds.includes("aim")
        ? "Expect lane lock shots."
        : "Primarily single-lane pressure.";
  return `Pattern: ${pattern}. Tags: ${tags.join(", ")}. ${laneHint}`;
}

function getNextSectorRewardIntel() {
  const nextSectorIndex = game.sectorIndex + 1;
  const nextSector = runSectors[nextSectorIndex] || null;
  if (!nextSector) {
    return null;
  }

  const enemyPoolSize = Array.isArray(nextSector.enemies) ? nextSector.enemies.length : 0;
  const encounterSizeRaw = Number.parseInt(nextSector?.encounterSize, 10);
  const encounterSize =
    Number.isInteger(encounterSizeRaw) && encounterSizeRaw > 0
      ? Math.min(encounterSizeRaw, Math.max(1, enemyPoolSize))
      : enemyPoolSize;
  const eliteChance =
    typeof BRASSLINE_PROGRESSION.estimateEncounterEliteChance === "function"
      ? BRASSLINE_PROGRESSION.estimateEncounterEliteChance({ sector: nextSector })
      : 0;
  const keyOdds =
    typeof BRASSLINE_PROGRESSION.estimateEncounterKeyInclusionChances === "function"
      ? BRASSLINE_PROGRESSION.estimateEncounterKeyInclusionChances({ sector: nextSector })
      : [];
  const likelyThreatEntries = keyOdds.slice(0, 3).map((entry) => {
    const blueprint = enemyBlueprints?.[entry.key] || null;
    const enemyName = blueprint?.name || entry.key;
    const chancePct = Math.round(Math.max(0, Math.min(1, entry.chance)) * 100);
    const eliteTag = entry.hasElite ? " (Elite)" : "";
    return {
      key: entry.key,
      icon: blueprint?.icon || "",
      name: enemyName,
      elite: Boolean(entry.hasElite),
      chancePct,
      label: `${enemyName}${eliteTag} ${chancePct}%`,
      intelDescription: buildThreatIntelDescriptor(blueprint),
    };
  });
  const likelyThreats = likelyThreatEntries
    .map((entry) => entry.label)
    .filter(Boolean);

  return {
    ...nextSector,
    encounterSize,
    eliteChance: Number.isFinite(eliteChance) ? Math.max(0, Math.min(1, eliteChance)) : 0,
    modifierSummary: getModifierSummaryForSector(nextSector),
    likelyThreatEntries,
    likelyThreats,
  };
}

function describeInterludeOptionEffects(option) {
  return BRASSLINE_PROGRESSION.describeInterludeOptionEffects({
    option,
    cardCatalog,
  });
}

function rollEncounterModifier(sector) {
  return BRASSLINE_ENCOUNTER_MODIFIERS.getRandomEncounterModifier({
    sector,
    modifierCatalog: encounterModifierCatalog,
    randomInt,
  });
}

function applyEncounterModifier(modifier) {
  return BRASSLINE_ENCOUNTER_MODIFIERS.applyEncounterModifier({
    game,
    modifier,
    clamp,
    maxHeat: MAX_HEAT,
  });
}

function selectSectorEnemies(sector) {
  if (typeof BRASSLINE_PROGRESSION.pickSectorEncounter !== "function") {
    return Array.isArray(sector?.enemies) ? sector.enemies : [];
  }
  return BRASSLINE_PROGRESSION.pickSectorEncounter({
    sector,
    sectorIndex: game.sectorIndex,
    runSeed: game.runSeed,
  });
}

function beginInterlude(interlude, deckInstances, rewardMessage) {
  return BRASSLINE_RUN_FLOW.beginInterlude({
    game,
    interlude,
    deckInstances,
    rewardMessage,
    clamp,
    runSectorsLength: runSectors.length,
    appendRunTimelineEntry,
    setLog,
    renderEnemies,
    renderCards,
    renderTrackMap,
    updateHud,
  });
}

function resolveInterludeOption(optionIndex) {
  BRASSLINE_RUN_FLOW.resolveInterludeOption({
    game,
    optionIndex,
    setLog,
    updateHud,
    collectDeckInstances,
    clamp,
    gainHeat,
    makeCardInstance,
    cardCatalog,
    runSectorsLength: runSectors.length,
    appendRunTimelineEntry,
    beginSectorBattle,
  });
}

function beginSectorBattle(deckInstances, freshStart = false) {
  BRASSLINE_RUN_FLOW.beginSectorBattle({
    game,
    deckInstances,
    freshStart,
    getCurrentSector,
    createEnemy,
    clamp,
    heatCarryRatio: HEAT_CARRY_RATIO,
    heatCarryFloor: HEAT_CARRY_FLOOR,
    maxHeat: MAX_HEAT,
    getArtifactBattleStartBlockBonus,
    clampLane,
    trackLanes: TRACK_LANES,
    shuffleInPlace,
    rollEnemyIntents,
    drawCards,
    handSize: HAND_SIZE,
    getBattleStartDrawBonus,
    selectSectorEnemiesFn: selectSectorEnemies,
    rollEncounterModifierFn: rollEncounterModifier,
    applyEncounterModifierFn: applyEncounterModifier,
    setLog,
    appendRunTimelineEntry,
    renderEnemies,
    renderTrackMap,
    renderCards,
    updateHud,
  });
}

function applyRewardAndAdvance(rewardChoice = null) {
  BRASSLINE_RUN_FLOW.applyRewardAndAdvance({
    game,
    rewardChoice,
    normalizeRewardChoice,
    getRewardChoiceKey,
    setLog,
    renderRewardPanel,
    collectDeckInstances,
    rewardHealSkip: REWARD_HEAL_SKIP,
    rewardHealChosen: REWARD_HEAL_CHOSEN,
    cardCatalog,
    artifactCatalog,
    getArtifactRewardHealBonus,
    makeCardInstance,
    ensureRunStats,
    appendRunTimelineEntry,
    applyUpgradePath,
    clamp,
    runSectorsLength: runSectors.length,
    recordRunOutcome,
    renderEnemies,
    renderCards,
    renderTrackMap,
    updateHud,
    getInterludeForAfterSector,
    beginInterlude,
    beginSectorBattle,
  });
}

function checkEndStates() {
  return BRASSLINE_RUN_FLOW.checkEndStates({
    game,
    livingEnemies,
    runSectorsLength: runSectors.length,
    discardHand,
    appendRunTimelineEntry,
    recordRunOutcome,
    drawRewardChoices,
    getCurrentSector,
    setLog,
  });
}

function startPlayerTurn() {
  BRASSLINE_PLAYER_ACTIONS.startPlayerTurn({
    game,
    gainHeatFn: gainHeat,
    gainEnergyFn: gainEnergy,
    getTurnStartCoolingAmount,
    getTurnStartBlockAmount,
    getTurnStartEnergyBonus,
    drawCardsFn: drawCards,
    handSize: HAND_SIZE,
    rollEnemyIntents,
    getSelectedEnemy,
  });
}

function endTurn() {
  BRASSLINE_PLAYER_ACTIONS.endTurn({
    game,
    setLog,
    discardHandFn: discardHand,
    damagePlayerFn: damagePlayer,
    checkEndStates,
    renderCards,
    renderEnemies,
    renderTrackMap,
    updateHud,
    advanceTelegraphs,
    livingEnemies,
    resolveEnemyIntent,
    startPlayerTurnFn: startPlayerTurn,
  });
}

function telegraphAffectsLane(telegraph, lane) {
  return BRASSLINE_THREATS.telegraphAffectsLane({
    telegraph,
    lane,
    getLobLanes,
  });
}

function getEnemyTelegraphs(enemyId) {
  return BRASSLINE_THREATS.getEnemyTelegraphs({
    telegraphs: game.telegraphs,
    enemyId,
  });
}

function getTelegraphCoverageLanes(telegraph) {
  return BRASSLINE_THREATS.getTelegraphCoverageLanes({
    telegraph,
    getLobLanes,
  });
}

function describeTelegraphForTooltip(telegraph) {
  return BRASSLINE_ENEMY_UI.describeTelegraphForTooltip({
    telegraph,
    cookTierLabel: COOK_TIER_LABEL,
    getTelegraphCoverageLanes,
    formatLaneCoverage,
  });
}

function getIntentPreview(enemy) {
  return BRASSLINE_ENEMY_UI.getIntentPreview({
    enemy,
    getLockedAimLane,
    getAimedShotDamage,
    makeSweepLanes,
    formatLaneCoverage,
  });
}

const laneHighlightController = BRASSLINE_THREATS.createLaneHighlightController({
  game,
  parseLaneDataFn: parseLaneData,
  renderTrackMapFn: renderTrackMap,
});
const bindLaneHighlightInteractions = laneHighlightController.bindLaneHighlightInteractions;
const clearLaneHighlight = laneHighlightController.clearLaneHighlight;

function buildEnemyTooltipEntries(enemy) {
  return BRASSLINE_ENEMY_UI.buildEnemyTooltipEntries({
    enemy,
    describeIntent,
    getIntentPreviewFn: getIntentPreview,
    getEnemyTelegraphsFn: getEnemyTelegraphs,
    describeTelegraphForTooltipFn: describeTelegraphForTooltip,
  });
}

function getTelegraphThreatTypeLabel(telegraph) {
  return BRASSLINE_THREATS.getTelegraphThreatTypeLabel({
    telegraph,
  });
}

function buildEnemyThreatRows(enemy) {
  return BRASSLINE_ENEMY_UI.buildEnemyThreatRows({
    enemy,
    getEnemyTelegraphsFn: getEnemyTelegraphs,
    getTelegraphCoverageLanes,
    getTelegraphThreatTypeLabel,
    cookTierLabel: COOK_TIER_LABEL,
    formatLaneCoverage,
    getTelegraphProgress,
    clamp,
    highlightLockKey: game.highlightLockKey,
  });
}

function getAimedShotLaneThreats() {
  return BRASSLINE_FORECAST.getAimedShotLaneThreats({
    enemies: livingEnemies(),
    getLockedAimLane,
    getAimedShotDamage,
  });
}

function getForecastUiState() {
  return BRASSLINE_FORECAST.createForecastUiState({
    phase: game.phase,
    trackLanes: TRACK_LANES,
    player: game.player,
    telegraphs: game.telegraphs,
    enemies: livingEnemies(),
    telegraphAffectsLane,
    getTelegraphCoverageLanes,
    getLockedAimLane,
    getAimedShotDamage,
    clampLane,
  });
}

function renderLaneThreatForecast(forecastUiOverride = null) {
  if (!els.laneThreatForecast) {
    return;
  }
  const forecastUi = forecastUiOverride || getForecastUiState();
  BRASSLINE_FORECAST.renderLaneThreatForecast({
    rootEl: els.laneThreatForecast,
    phase: game.phase,
    playerLane: game.player.lane,
    forecastUi,
    getForecastThreatClassNameFn: BRASSLINE_FORECAST.getForecastThreatClassName,
    getEndTurnLockMessageFn: BRASSLINE_FORECAST.getEndTurnLockMessage,
    escapeHtml,
    bindLaneHighlightInteractions,
    onShiftLane: shiftLane,
    onEndTurn: endTurn,
  });
}

function renderControlRecommendations(forecastUi) {
  BRASSLINE_FORECAST.renderControlRecommendations({
    shiftLeftBtn: els.shiftLeftBtn,
    shiftRightBtn: els.shiftRightBtn,
    endTurnBtn: els.endTurnBtn,
    forecastUi,
  });
}

function renderTrackMap() {
  const aimedThreats = getAimedShotLaneThreats();
  BRASSLINE_THREATS.renderTrackMap({
    rootEl: els.trackMap,
    trackLanes: TRACK_LANES,
    playerLane: game.player.lane,
    highlightLanes: game.highlightLanes,
    telegraphs: game.telegraphs,
    aimedThreats,
    telegraphAffectsLaneFn: telegraphAffectsLane,
    getTelegraphProgress,
    cookTierLabel: COOK_TIER_LABEL,
    trainMarkerSrc: "./assets/curated/icons/enemies/01_steam-locomotive.svg",
  });
}

function renderEnemies() {
  const enemyInteractionHandlers = BRASSLINE_ENEMY_UI.createEnemyInteractionHandlers({
    getOpenEnemyTooltipId: () => game.openEnemyTooltipId,
    setOpenEnemyTooltipId: (value) => {
      game.openEnemyTooltipId = value;
    },
    setSelectedEnemyId: (enemyId) => {
      game.selectedEnemyId = enemyId;
    },
    clearLaneHighlightFn: clearLaneHighlight,
    renderEnemiesFn: renderEnemies,
  });

  BRASSLINE_ENEMY_UI.renderEnemies({
    enemyRowEl: els.enemyRow,
    enemies: game.enemies,
    selectedEnemy: getSelectedEnemy(),
    phase: game.phase,
    openEnemyTooltipId: game.openEnemyTooltipId,
    getLockedAimLane,
    buildEnemyThreatRowsFn: buildEnemyThreatRows,
    buildEnemyTooltipEntriesFn: buildEnemyTooltipEntries,
    describeIntent,
    escapeHtml,
    bindLaneHighlightInteractions,
    onTooltipToggle: enemyInteractionHandlers.onTooltipToggle,
    onEnemySelect: enemyInteractionHandlers.onEnemySelect,
  });
}

function createCardNode(card, clickable, onClick) {
  const cardEl = document.createElement("article");
  cardEl.className = "card";
  cardEl.style.setProperty("--card-frame", `url("${typeToFrame[card.type]}")`);
  if (!clickable) {
    cardEl.classList.add("locked");
  }

  cardEl.innerHTML = `
    <div class="card-top">
      <div>
        <p class="card-type">${card.type}</p>
        <h3 class="card-title">${card.title}</h3>
      </div>
      <span class="card-cost">${card.cost}</span>
    </div>
    <img class="card-icon" src="${card.icon}" alt="${card.title}" />
    <p class="card-text">${card.text}</p>
    <span class="card-foot">${card.heatText}</span>
  `;

  if (clickable && onClick) {
    cardEl.addEventListener("click", onClick);
  }

  return cardEl;
}

function createUpgradeNode(path, onClick, options = {}) {
  return BRASSLINE_RUN_UI.createUpgradeNode({
    path,
    onClick,
    options,
    getUpgradeLevel,
    reactorFrame: typeToFrame.Reactor,
    escapeHtml,
  });
}

function createArtifactNode({ artifact, onClick }) {
  return BRASSLINE_RUN_UI.createArtifactNode({
    artifact,
    onClick,
    reactorFrame: typeToFrame.Reactor,
    escapeHtml,
  });
}

function getSuggestedUpgradePathId() {
  return BRASSLINE_RUN_UI.getSuggestedUpgradePathId({
    upgradePathCatalog,
    getUpgradeLevel,
  });
}

function renderUpgradeStrip() {
  BRASSLINE_RUN_UI.renderUpgradeStrip({
    upgradeStripEl: els.upgradeStrip,
    upgradePathCatalog,
    getUpgradeLevel,
    getMetaInstalledLevelsTotal,
    getMetaPossibleLevelsTotal,
    escapeHtml,
  });
}

function renderArtifactStrip() {
  BRASSLINE_RUN_UI.renderArtifactStrip({
    artifactStripEl: els.artifactStrip,
    artifactCatalog,
    artifacts: game.artifacts,
    escapeHtml,
  });
}

function renderCards() {
  const selectedEnemy = getSelectedEnemy();
  els.cardRow.innerHTML = "";

  game.hand.forEach((instance) => {
    const card = cardCatalog[instance.cardId];
    const playable = isCardPlayable(card, selectedEnemy);
    const cardEl = createCardNode(card, playable, () => {
      playCard(instance.instanceId);
    });
    els.cardRow.appendChild(cardEl);
  });
}

function renderRewardMetaSummary() {
  BRASSLINE_RUN_UI.renderRewardMetaSummary({
    rewardMetaEl: els.rewardMeta,
    upgradePathCatalog,
    getUpgradeLevel,
    getSuggestedUpgradePathIdFn: getSuggestedUpgradePathId,
    escapeHtml,
  });
}

function renderRewardPanel() {
  BRASSLINE_RUN_UI.renderRewardPanel({
    rewardPanelEl: els.rewardPanel,
    rewardMetaEl: els.rewardMeta,
    rewardIntelEl: els.rewardIntel,
    rewardSubtitleEl: els.rewardSubtitle,
    rewardChoicesEl: els.rewardChoices,
    phase: game.phase,
    intermissionHealing: REWARD_HEAL_CHOSEN,
    sectorIndex: game.sectorIndex,
    runSectors,
    sector: getCurrentSector(),
    nextSectorIntel: getNextSectorRewardIntel(),
    rewardChoices: game.rewardChoices,
    artifactCatalog,
    getSuggestedUpgradePathIdFn: getSuggestedUpgradePathId,
    renderRewardMetaSummaryFn: renderRewardMetaSummary,
    upgradePathCatalog,
    createUpgradeNodeFn: createUpgradeNode,
    createArtifactNodeFn: createArtifactNode,
    createCardNodeFn: createCardNode,
    cardCatalog,
    onApplyRewardAndAdvance: applyRewardAndAdvance,
  });
}

function renderInterludePanel() {
  BRASSLINE_RUN_UI.renderInterludePanel({
    interludePanelEl: els.interludePanel,
    interludeTitleEl: els.interludeTitle,
    interludeSubtitleEl: els.interludeSubtitle,
    interludeChoicesEl: els.interludeChoices,
    phase: game.phase,
    interlude: game.interlude,
    describeInterludeOptionEffectsFn: describeInterludeOptionEffects,
    escapeHtml,
    onResolveInterludeOption: resolveInterludeOption,
  });
}

function renderRunSummaryPanel() {
  BRASSLINE_RUN_UI.renderRunSummaryPanel({
    runSummaryPanelEl: els.runSummaryPanel,
    runSummaryTitleEl: els.runSummaryTitle,
    runSummarySubtitleEl: els.runSummarySubtitle,
    runSummaryStatsEl: els.runSummaryStats,
    runSummaryTimelineEl: els.runSummaryTimeline,
    toggleRunTimelineBtnEl: els.toggleRunTimelineBtn,
    artifactCatalog,
    artifacts: game.artifacts,
    phase: game.phase,
    turn: game.turn,
    sectorIndex: game.sectorIndex,
    runSectors,
    runTimeline: game.runTimeline,
    showFullTimeline: game.showFullTimeline,
    runRecordHighlights: game.runRecordHighlights,
    runTimelineRecentCount: RUN_TIMELINE_RECENT_COUNT,
    getCurrentSectorFn: getCurrentSector,
    ensureRunStatsFn: ensureRunStats,
    ensureRunRecordsFn: ensureRunRecords,
    getMetaInstalledLevelsTotalFn: getMetaInstalledLevelsTotal,
    getMetaPossibleLevelsTotalFn: getMetaPossibleLevelsTotal,
    collectDeckInstancesFn: collectDeckInstances,
    clamp,
    escapeHtml,
  });
}

function renderOnboardingPanel() {
  BRASSLINE_CONTROLS_UI.renderOnboardingPanel({
    onboardingPanelEl: els.onboardingPanel,
    toggleOnboardingBtnEl: els.toggleOnboardingBtn,
    dismissOnboardingBtnEl: els.dismissOnboardingBtn,
    shiftLeftBtnEl: els.shiftLeftBtn,
    shiftRightBtnEl: els.shiftRightBtn,
    endTurnBtnEl: els.endTurnBtn,
    showOnboarding: game.showOnboarding,
    onboardingDismissed: game.onboardingDismissed,
  });
}

function updateSectorLabel() {
  BRASSLINE_HUD_STATE.updateSectorLabel({
    game,
    sectorLabelEl: els.sectorLabel,
    getCurrentSectorFn: getCurrentSector,
    runSectorsLength: runSectors.length,
  });
}

function updateHud() {
  BRASSLINE_HUD_STATE.updateHud({
    game,
    els,
    clamp,
    maxHeat: MAX_HEAT,
    trackLanes: TRACK_LANES,
    rewardHealSkip: REWARD_HEAL_SKIP,
    getHeatStateFn: getHeatState,
    getForecastUiStateFn: getForecastUiState,
    getEndTurnLockMessageFn: (projection, endTurnLockedByLethal) =>
      BRASSLINE_FORECAST.getEndTurnLockMessage({
        projection,
        endTurnLockedByLethal,
      }),
    hasInstalledMetaUpgradesFn: hasInstalledMetaUpgrades,
    isMetaResetArmedFn: isMetaResetArmed,
    hasRunRecordsDataFn: hasRunRecordsData,
    isRunRecordsResetArmedFn: isRunRecordsResetArmed,
    renderControlRecommendationsFn: renderControlRecommendations,
    updateSectorLabelFn: updateSectorLabel,
    renderRewardPanelFn: renderRewardPanel,
    renderInterludePanelFn: renderInterludePanel,
    renderRunSummaryPanelFn: renderRunSummaryPanel,
    renderUpgradeStripFn: renderUpgradeStrip,
    renderArtifactStripFn: renderArtifactStrip,
    renderLaneThreatForecastFn: renderLaneThreatForecast,
    renderOnboardingPanelFn: renderOnboardingPanel,
    saveRunSnapshotStateFn: saveRunSnapshotState,
  });
}

function initGame(options = {}) {
  const tryResume = Boolean(options?.tryResume);
  refreshConfiguredUpgradePaths();
  refreshConfiguredProgression();
  refreshEncounterModifierCatalog();
  disarmMetaReset();
  disarmRunRecordsReset();
  const onboardingState = readOnboardingState();
  game.onboardingDismissed = onboardingState.dismissed;
  game.showOnboarding = !game.onboardingDismissed;
  const metaState = readMetaUpgradeState();
  game.upgrades = metaState.upgrades;
  game.metaUnlocks = metaState.unlocks;
  game.metaBranches = metaState.branches;
  game.runRecords = readRunRecordsState();

  if (tryResume) {
    const snapshot = readRunSnapshotState();
    if (snapshot && restoreRunSnapshotState(snapshot)) {
      return;
    }
    clearRunSnapshotState();
  } else {
    clearRunSnapshotState();
  }

  BRASSLINE_GAME_STATE.applyFreshRunState({
    game,
    baseMaxHull: BASE_MAX_HULL,
    baseMaxEnergy: BASE_MAX_ENERGY,
    playerStartHeat: PLAYER_START_HEAT,
    trackLanes: TRACK_LANES,
    createRunSeedFn: createRunSeed,
    createDefaultRunStatsFn: createDefaultRunStats,
    createDefaultRecordHighlightsFn: createDefaultRecordHighlights,
    createDefaultRunTimelineFn: createDefaultRunTimeline,
  });
  applyUpgradeDerivedCaps();
  game.player.hull = game.player.maxHull;
  game.player.energy = game.player.maxEnergy;
  appendRunTimelineEntry("Run started.", { type: "system" });
  setLog("Select an enemy, then play cards.");

  const starterDeck = starterDeckRecipe.map((cardId) => makeCardInstance(cardId));
  beginSectorBattle(starterDeck, true);
}

function resetMetaProgressionAndRestart() {
  if (!hasInstalledMetaUpgrades()) {
    disarmMetaReset();
    setLog("No saved upgrade paths to reset.");
    updateHud();
    return;
  }

  if (!isMetaResetArmed()) {
    game.metaResetArmedUntil = Date.now() + META_RESET_CONFIRM_WINDOW_MS;
    setLog("Press Reset Meta Paths again within 2.5s to confirm.");
    updateHud();
    window.setTimeout(() => {
      if (!isMetaResetArmed()) {
        disarmMetaReset();
        updateHud();
      }
    }, META_RESET_CONFIRM_WINDOW_MS + 60);
    return;
  }

  disarmMetaReset();
  clearMetaUpgradeState();
  initGame();
  setLog("Meta upgrade paths reset. New run started.");
}

function resetRunRecordsProgression() {
  if (!hasRunRecordsData()) {
    disarmRunRecordsReset();
    setLog("No saved run records to reset.");
    updateHud();
    return;
  }

  if (!isRunRecordsResetArmed()) {
    game.runRecordsResetArmedUntil = Date.now() + RUN_RECORDS_RESET_CONFIRM_WINDOW_MS;
    setLog("Press Reset Run Records again within 2.5s to confirm.");
    updateHud();
    window.setTimeout(() => {
      if (!isRunRecordsResetArmed()) {
        disarmRunRecordsReset();
        updateHud();
      }
    }, RUN_RECORDS_RESET_CONFIRM_WINDOW_MS + 60);
    return;
  }

  disarmRunRecordsReset();
  clearRunRecordsState();
  game.runRecords = createDefaultRunRecords();
  game.runRecordHighlights = createDefaultRecordHighlights();
  setLog("Run records cleared.");
  updateHud();
}

const onboardingController = BRASSLINE_CONTROLS_UI.createOnboardingController({
  game,
  saveOnboardingStateFn: saveOnboardingState,
  updateHudFn: updateHud,
});

BRASSLINE_CONTROLS_UI.bindPrimaryControls({
  overclockBtn: els.overclockBtn,
  endTurnBtn: els.endTurnBtn,
  shiftLeftBtn: els.shiftLeftBtn,
  shiftRightBtn: els.shiftRightBtn,
  cycleHandBtn: els.cycleHandBtn,
  toggleOnboardingBtn: els.toggleOnboardingBtn,
  dismissOnboardingBtn: els.dismissOnboardingBtn,
  resetMetaBtn: els.resetMetaBtn,
  resetRunRecordsBtn: els.resetRunRecordsBtn,
  toggleRunTimelineBtn: els.toggleRunTimelineBtn,
  skipRewardBtn: els.skipRewardBtn,
  onUseOverclock: useOverclock,
  onEndTurn: endTurn,
  onShiftLeft: () => shiftLane(-1),
  onShiftRight: () => shiftLane(1),
  onCycleHand: purgeHand,
  onToggleOnboarding: onboardingController.toggleOnboardingPanel,
  onDismissOnboarding: onboardingController.dismissOnboarding,
  onResetMeta: resetMetaProgressionAndRestart,
  onResetRunRecords: resetRunRecordsProgression,
  onToggleRunTimeline: () => {
    BRASSLINE_RUN_UI.toggleRunTimelineView({
      game,
      renderRunSummaryPanelFn: renderRunSummaryPanel,
    });
  },
  onSkipReward: () => {
    applyRewardAndAdvance(null);
  },
});

const handleControlHotkeys = BRASSLINE_CONTROLS_UI.createControlHotkeyHandler({
  isInteractiveShortcutTargetFn: (target) =>
    BRASSLINE_CONTROLS_UI.isInteractiveShortcutTarget(target, BRASSLINE_CONTROLS_UI.isTypingTarget),
  triggerControlShortcutFn: BRASSLINE_CONTROLS_UI.triggerControlShortcut,
  shiftLeftBtn: els.shiftLeftBtn,
  shiftRightBtn: els.shiftRightBtn,
  endTurnBtn: els.endTurnBtn,
  onEndTurnLocked: (lockReason) => {
    setLog(lockReason);
  },
});

document.addEventListener("keydown", handleControlHotkeys);
document.addEventListener(
  "pointerdown",
  BRASSLINE_CONTROLS_UI.createEnemyTooltipDismissHandler({
    getOpenEnemyTooltipId: () => game.openEnemyTooltipId,
    setOpenEnemyTooltipId: (value) => {
      game.openEnemyTooltipId = value;
    },
    clearLaneHighlightFn: clearLaneHighlight,
    renderEnemiesFn: renderEnemies,
  })
);

window.__brasslineDebug = {
  game,
  checkEndStates,
  renderEnemies,
  renderCards,
  updateHud,
  renderTrackMap,
  advanceTelegraphs,
  applyRewardAndAdvance,
  resolveInterludeOption,
  useOverclock,
  initGame,
};

initGame({ tryResume: true });
