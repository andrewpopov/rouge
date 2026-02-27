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
  typeof BRASSLINE_PROGRESSION_CONTENT.getDefaultUpgradePathCatalog !== "function"
) {
  throw new Error("BRASSLINE_PROGRESSION_CONTENT default providers are required.");
}

const DEFAULT_RUN_SECTORS = BRASSLINE_PROGRESSION_CONTENT.getDefaultRunSectors();
const DEFAULT_STARTER_DECK_RECIPE = BRASSLINE_PROGRESSION_CONTENT.getDefaultStarterDeckRecipe();
const DEFAULT_REWARD_POOL = BRASSLINE_PROGRESSION_CONTENT.getDefaultRewardPool();
const DEFAULT_INTERLUDES = BRASSLINE_PROGRESSION_CONTENT.getDefaultInterludes();
const DEFAULT_UPGRADE_PATH_CATALOG = BRASSLINE_PROGRESSION_CONTENT.getDefaultUpgradePathCatalog();

let runSectors = [];
let starterDeckRecipe = [];
let rewardPool = [];
let runInterludes = [];

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

refreshConfiguredProgression();

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
  return BRASSLINE_PERSISTENCE.readMetaUpgrades({
    key: META_STORAGE_KEY,
    upgradePathCatalog,
    createDefaultUpgradeState,
    clamp,
  });
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
  createDefaultUpgradeStateFn: createDefaultUpgradeState,
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
  if (typeof message !== "string" || message.trim().length === 0) {
    return;
  }
  if (!Array.isArray(game.runTimeline)) {
    game.runTimeline = createDefaultRunTimeline();
  }

  const sectorPart = Number.isInteger(options.sectorIndex)
    ? `S${clamp(options.sectorIndex + 1, 1, runSectors.length)}`
    : "";
  const turnPart = Number.isInteger(options.turn) && options.turn > 0 ? `T${options.turn}` : "";
  const prefix = [sectorPart, turnPart].filter(Boolean).join(" ");
  const line = prefix ? `${prefix} // ${message.trim()}` : message.trim();
  const type = typeof options.type === "string" && options.type.trim() ? options.type.trim() : "info";
  game.runTimeline.push({
    line,
    type,
  });
  const maxEntries = 22;
  while (game.runTimeline.length > maxEntries) {
    game.runTimeline.shift();
  }
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
  BRASSLINE_PLAYER_ACTIONS.useOverclock({
    game,
    setLog,
    updateHud,
    gainEnergyFn: gainEnergy,
    gainHeatFn: gainHeat,
    damagePlayerFn: damagePlayer,
    overclockHeatGain: OVERCLOCK_HEAT_GAIN,
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
  });
}

function getUpgradeablePathIds() {
  return BRASSLINE_META_PROGRESSION.getUpgradeablePathIds({
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
  });
}

function getTurnStartCoolingAmount() {
  return BRASSLINE_META_PROGRESSION.getTurnStartCoolingAmount({
    turnStartCoolingBase: TURN_START_COOLING_BASE,
    getUpgradeLevelFn: getUpgradeLevel,
    turnStartCoolingPerLevel: TURN_START_COOLING_PER_LEVEL,
  });
}

function getTurnStartBlockAmount() {
  return BRASSLINE_META_PROGRESSION.getTurnStartBlockAmount({
    getUpgradeLevelFn: getUpgradeLevel,
    turnStartBlockPerGuardLevel: TURN_START_BLOCK_PER_GUARD_LEVEL,
  });
}

function applyUpgradePath(pathId) {
  return BRASSLINE_META_PROGRESSION.applyUpgradePath({
    game,
    pathId,
    upgradePathCatalog,
    getUpgradeLevelFn: getUpgradeLevel,
    applyUpgradeDerivedCapsFn: applyUpgradeDerivedCaps,
    clamp,
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
  });
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

function describeInterludeOptionEffects(option) {
  return BRASSLINE_PROGRESSION.describeInterludeOptionEffects({
    option,
    cardCatalog,
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
    clampLane,
    trackLanes: TRACK_LANES,
    shuffleInPlace,
    rollEnemyIntents,
    drawCards,
    handSize: HAND_SIZE,
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
    getTurnStartCoolingAmount,
    getTurnStartBlockAmount,
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

function bindLaneHighlightInteractions(items, keyPrefix) {
  items.forEach((item, index) => {
    const lanes = parseLaneData(item.dataset.lanes || "");
    if (lanes.length === 0) {
      return;
    }
    const fallback = (item.textContent || "").trim() || `row_${index + 1}`;
    const highlightKey = item.dataset.highlightKey || `${keyPrefix}_${index + 1}_${fallback}`;

    item.addEventListener("pointerenter", (event) => {
      event.stopPropagation();
      if (game.highlightLockKey !== null) {
        return;
      }
      setLaneHighlight(lanes, null);
    });

    item.addEventListener("pointerleave", (event) => {
      event.stopPropagation();
      if (game.highlightLockKey !== null) {
        return;
      }
      clearLaneHighlight(false);
    });

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleLockedHighlight(highlightKey, lanes);
    });
  });
}

function setLaneHighlight(lanes, lockKey = null) {
  const uniqueLanes = [...new Set(lanes)];
  game.highlightLanes = uniqueLanes;
  game.highlightLockKey = lockKey;
  renderTrackMap();
}

function clearLaneHighlight(force = false) {
  if (!force && game.highlightLockKey !== null) {
    return;
  }
  if (game.highlightLanes.length === 0 && game.highlightLockKey === null) {
    return;
  }
  game.highlightLanes = [];
  game.highlightLockKey = null;
  renderTrackMap();
}

function toggleLockedHighlight(lockKey, lanes) {
  if (game.highlightLockKey === lockKey) {
    clearLaneHighlight(true);
    return;
  }
  setLaneHighlight(lanes, lockKey);
}

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

function getNextEnemyPhaseForecast() {
  return BRASSLINE_FORECAST.getNextEnemyPhaseForecast({
    trackLanes: TRACK_LANES,
    telegraphs: game.telegraphs,
    enemies: livingEnemies(),
    getTelegraphCoverageLanes,
    getLockedAimLane,
    getAimedShotDamage,
  });
}

function getShiftCapability() {
  return BRASSLINE_FORECAST.getShiftCapability({
    phase: game.phase,
    playerLane: game.player.lane,
    movedThisTurn: game.player.movedThisTurn,
    playerEnergy: game.player.energy,
    trackLanes: TRACK_LANES,
  });
}

function getEndTurnProjection(forecast) {
  const shiftCapability = getShiftCapability();
  return BRASSLINE_FORECAST.getEndTurnProjection({
    trackLanes: TRACK_LANES,
    player: game.player,
    telegraphs: game.telegraphs,
    enemies: livingEnemies(),
    forecast,
    shiftCapability,
    telegraphAffectsLane,
    getLockedAimLane,
    getAimedShotDamage,
    clampLane,
  });
}

function getProjectionAdvice(projection, shiftCapability) {
  return BRASSLINE_FORECAST.getProjectionAdvice({
    projection,
    shiftCapability,
    playerHull: game.player.hull,
  });
}

function getForecastRecommendedAction(projection, adviceCode, shiftCapability, endTurnLockedByLethal) {
  return BRASSLINE_FORECAST.getForecastRecommendedAction({
    projection,
    adviceCode,
    shiftCapability,
    endTurnLockedByLethal,
    phase: game.phase,
  });
}

function getForecastUiState() {
  const forecast = getNextEnemyPhaseForecast();
  const projection = getEndTurnProjection(forecast);
  const shiftCapability = getShiftCapability();
  const advice = getProjectionAdvice(projection, shiftCapability);
  const endTurnLockedByLethal = game.phase === "player" && projection.canEscapeCurrentLethal;
  const recommendedAction = getForecastRecommendedAction(
    projection,
    advice.code,
    shiftCapability,
    endTurnLockedByLethal
  );

  return {
    forecast,
    projection,
    shiftCapability,
    advice,
    recommendedAction,
    endTurnLockedByLethal,
  };
}

function getForecastThreatClassName(damage) {
  return BRASSLINE_FORECAST.getForecastThreatClassName(damage);
}

function getEndTurnLockMessage(projection, endTurnLockedByLethal) {
  return BRASSLINE_FORECAST.getEndTurnLockMessage({
    projection,
    endTurnLockedByLethal,
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
    getForecastThreatClassNameFn: getForecastThreatClassName,
    getEndTurnLockMessageFn: ({ projection, endTurnLockedByLethal }) =>
      getEndTurnLockMessage(projection, endTurnLockedByLethal),
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
    onTooltipToggle: (enemyId) => {
      if (game.openEnemyTooltipId === enemyId) {
        game.openEnemyTooltipId = null;
      } else {
        game.openEnemyTooltipId = enemyId;
      }
      clearLaneHighlight(true);
      renderEnemies();
    },
    onEnemySelect: (enemyId) => {
      game.selectedEnemyId = enemyId;
      game.openEnemyTooltipId = null;
      clearLaneHighlight(true);
      renderEnemies();
    },
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
    rewardSubtitleEl: els.rewardSubtitle,
    rewardChoicesEl: els.rewardChoices,
    phase: game.phase,
    intermissionHealing: REWARD_HEAL_CHOSEN,
    sectorIndex: game.sectorIndex,
    runSectors,
    sector: getCurrentSector(),
    rewardChoices: game.rewardChoices,
    getSuggestedUpgradePathIdFn: getSuggestedUpgradePathId,
    renderRewardMetaSummaryFn: renderRewardMetaSummary,
    upgradePathCatalog,
    createUpgradeNodeFn: createUpgradeNode,
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

function toggleOnboardingPanel() {
  game.showOnboarding = !game.showOnboarding;
  updateHud();
}

function dismissOnboarding() {
  if (!game.onboardingDismissed) {
    game.onboardingDismissed = true;
    saveOnboardingState();
  }
  game.showOnboarding = false;
  updateHud();
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
    getEndTurnLockMessageFn: getEndTurnLockMessage,
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
    renderLaneThreatForecastFn: renderLaneThreatForecast,
    renderOnboardingPanelFn: renderOnboardingPanel,
    saveRunSnapshotStateFn: saveRunSnapshotState,
  });
}

function initGame(options = {}) {
  const tryResume = Boolean(options?.tryResume);
  refreshConfiguredUpgradePaths();
  refreshConfiguredProgression();
  disarmMetaReset();
  disarmRunRecordsReset();
  const onboardingState = readOnboardingState();
  game.onboardingDismissed = onboardingState.dismissed;
  game.showOnboarding = !game.onboardingDismissed;
  game.upgrades = readMetaUpgradeState();
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

function toggleRunTimelineView() {
  game.showFullTimeline = !game.showFullTimeline;
  renderRunSummaryPanel();
}

els.overclockBtn.addEventListener("click", useOverclock);
els.endTurnBtn.addEventListener("click", endTurn);
els.shiftLeftBtn.addEventListener("click", () => shiftLane(-1));
els.shiftRightBtn.addEventListener("click", () => shiftLane(1));
els.cycleHandBtn.addEventListener("click", purgeHand);
if (els.toggleOnboardingBtn) {
  els.toggleOnboardingBtn.addEventListener("click", toggleOnboardingPanel);
}
if (els.dismissOnboardingBtn) {
  els.dismissOnboardingBtn.addEventListener("click", dismissOnboarding);
}
els.resetMetaBtn.addEventListener("click", resetMetaProgressionAndRestart);
if (els.resetRunRecordsBtn) {
  els.resetRunRecordsBtn.addEventListener("click", resetRunRecordsProgression);
}
if (els.toggleRunTimelineBtn) {
  els.toggleRunTimelineBtn.addEventListener("click", toggleRunTimelineView);
}
els.skipRewardBtn.addEventListener("click", () => {
  applyRewardAndAdvance(null);
});
function isTypingTarget(target) {
  return BRASSLINE_CONTROLS_UI.isTypingTarget(target);
}

function isInteractiveShortcutTarget(target) {
  return BRASSLINE_CONTROLS_UI.isInteractiveShortcutTarget(target, isTypingTarget);
}

function triggerControlShortcut(button) {
  return BRASSLINE_CONTROLS_UI.triggerControlShortcut(button);
}

function handleControlHotkeys(event) {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    isInteractiveShortcutTarget(event.target)
  ) {
    return;
  }

  if (event.code === "KeyQ") {
    if (triggerControlShortcut(els.shiftLeftBtn)) {
      event.preventDefault();
    }
    return;
  }

  if (event.code === "KeyE") {
    if (triggerControlShortcut(els.shiftRightBtn)) {
      event.preventDefault();
    }
    return;
  }

  if (event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter") {
    if (triggerControlShortcut(els.endTurnBtn)) {
      event.preventDefault();
      return;
    }
    const lockReason = els.endTurnBtn.dataset.lockReason;
    if (lockReason) {
      event.preventDefault();
      setLog(lockReason);
    }
  }
}

document.addEventListener("keydown", handleControlHotkeys);
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".enemy") && game.openEnemyTooltipId !== null) {
    game.openEnemyTooltipId = null;
    clearLaneHighlight(true);
    renderEnemies();
  }
});

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
  initGame,
};

initGame({ tryResume: true });
