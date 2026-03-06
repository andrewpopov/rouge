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
const UI_PREFERENCES_STORAGE_KEY = "brassline_ui_preferences_v1";
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
const POTION_HEAL_AMOUNT = BALANCE.player?.potionHealAmount ?? 14;
const HULL_PER_VITALITY_POINT = BALANCE.player?.hullPerVitalityPoint ?? 2;
const ENERGY_POINTS_PER_MAX_ENERGY = BALANCE.player?.energyPointsPerMaxEnergy ?? 6;
const KILL_XP_BASE = BALANCE.progression?.killXpBase ?? 8;
const KILL_XP_ELITE = BALANCE.progression?.killXpElite ?? 16;
const KILL_GOLD_MIN = BALANCE.progression?.killGoldMin ?? 6;
const KILL_GOLD_MAX = BALANCE.progression?.killGoldMax ?? 14;
const KILL_DROP_GOLD_WEIGHT = BALANCE.progression?.killDropGoldWeight ?? 50;
const KILL_DROP_POTION_WEIGHT = BALANCE.progression?.killDropPotionWeight ?? 30;
const KILL_DROP_UPGRADE_WEIGHT = BALANCE.progression?.killDropUpgradeWeight ?? 20;
const KILL_DROP_ITEM_WEIGHT = BALANCE.progression?.killDropItemWeight ?? 16;
const RUN_THEME_ID = "diablo-inspired";
const SPEED_CLEAR_TURN_THRESHOLD = BALANCE.progression?.rewardTreeSpeedClearTurnThreshold ?? 4;
const LEGACY_BALANCE_SECTOR_SIGNATURE = JSON.stringify(
  Array.isArray(BALANCE.progression?.sectors) ? BALANCE.progression.sectors : null
);

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
const BRASSLINE_ENGINE_CORE = window.BRASSLINE_ENGINE_CORE || {};
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
const BRASSLINE_THEME_ASSETS = window.BRASSLINE_THEME_ASSETS || {};
const BRASSLINE_GEAR_SYSTEM = window.BRASSLINE_GEAR_SYSTEM || {};
const BRASSLINE_REWARD_TREE = window.BRASSLINE_REWARD_TREE || {};
const BRASSLINE_QUEST_SYSTEM = window.BRASSLINE_QUEST_SYSTEM || {};
const BRASSLINE_CLASS_CONTENT = window.BRASSLINE_CLASS_CONTENT || {};
const BRASSLINE_CLASS_SYSTEM = window.BRASSLINE_CLASS_SYSTEM || {};

if (typeof BRASSLINE_RUNTIME_UTILS.createRuntimeUtils !== "function") {
  throw new Error("BRASSLINE_RUNTIME_UTILS.createRuntimeUtils is required.");
}

if (typeof BRASSLINE_ENGINE_CORE.createGameEngine !== "function") {
  throw new Error("BRASSLINE_ENGINE_CORE.createGameEngine is required.");
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

const resolveThemeIconPath =
  typeof BRASSLINE_THEME_ASSETS.resolveIconPath === "function"
    ? (iconPath) =>
        BRASSLINE_THEME_ASSETS.resolveIconPath({
          iconPath,
          themeId: RUN_THEME_ID,
        })
    : (iconPath) => iconPath;
const applyThemeToCatalogIcons =
  typeof BRASSLINE_THEME_ASSETS.applyThemeToCatalogIcons === "function"
    ? (catalog) =>
        BRASSLINE_THEME_ASSETS.applyThemeToCatalogIcons({
          catalog,
          themeId: RUN_THEME_ID,
        })
    : (catalog) => catalog;
const applyThemeToEnemyBlueprints =
  typeof BRASSLINE_THEME_ASSETS.applyThemeToEnemyBlueprints === "function"
    ? (catalog) =>
        BRASSLINE_THEME_ASSETS.applyThemeToEnemyBlueprints({
          enemyBlueprints: catalog,
          themeId: RUN_THEME_ID,
        })
    : (catalog) => catalog;
const timelineTypeIcons =
  typeof BRASSLINE_THEME_ASSETS.getTimelineTypeIcons === "function"
    ? BRASSLINE_THEME_ASSETS.getTimelineTypeIcons({ themeId: RUN_THEME_ID })
    : {};

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
  typeof BRASSLINE_CLASS_CONTENT.getLevelTable !== "function" ||
  typeof BRASSLINE_CLASS_CONTENT.getClassCatalog !== "function" ||
  typeof BRASSLINE_CLASS_CONTENT.getSkillTreeCatalog !== "function" ||
  typeof BRASSLINE_CLASS_CONTENT.getSkillCatalog !== "function" ||
  typeof BRASSLINE_CLASS_CONTENT.getItemCatalog !== "function" ||
  typeof BRASSLINE_CLASS_CONTENT.getSpellCatalog !== "function"
) {
  throw new Error("BRASSLINE_CLASS_CONTENT providers are required.");
}

const CLASS_LEVEL_TABLE = BRASSLINE_CLASS_CONTENT.getLevelTable();
const classCatalog = BRASSLINE_CLASS_CONTENT.getClassCatalog();
const classSkillTreeCatalog = BRASSLINE_CLASS_CONTENT.getSkillTreeCatalog();
const classSkillCatalog = BRASSLINE_CLASS_CONTENT.getSkillCatalog();
const classItemCatalog = BRASSLINE_CLASS_CONTENT.getItemCatalog();
const classSpellCatalog = BRASSLINE_CLASS_CONTENT.getSpellCatalog();
const DEFAULT_CLASS_ID = Object.keys(classCatalog)[0] || "";
let selectedClassId = DEFAULT_CLASS_ID;
const CLASS_STAT_DEFINITIONS = [
  { id: "strength", shortLabel: "STR", title: "Strength" },
  { id: "dexterity", shortLabel: "DEX", title: "Dexterity" },
  { id: "vitality", shortLabel: "VIT", title: "Vitality" },
  { id: "energy", shortLabel: "ENE", title: "Energy" },
];
const classSpellBySkillId = Object.values(classSpellCatalog).reduce((acc, spell) => {
  if (!spell || typeof spell !== "object") {
    return acc;
  }
  const linkedSkillId =
    typeof spell.linkedSkillId === "string" && spell.linkedSkillId.trim() ? spell.linkedSkillId.trim() : "";
  if (linkedSkillId) {
    acc[linkedSkillId] = spell;
  }
  return acc;
}, {});

applyThemeToEnemyBlueprints(enemyBlueprints);
applyThemeToCatalogIcons(cardCatalog);
applyThemeToCatalogIcons(DEFAULT_ARTIFACT_CATALOG);
applyThemeToCatalogIcons(classSkillCatalog);
applyThemeToCatalogIcons(classItemCatalog);
applyThemeToCatalogIcons(classSpellCatalog);

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
let stageEncounterModel = BRASSLINE_PROGRESSION.sanitizeEncounterModel(null);
const artifactCatalog = DEFAULT_ARTIFACT_CATALOG;
const gearCatalog =
  typeof BRASSLINE_GEAR_SYSTEM.cloneGearCatalog === "function"
    ? BRASSLINE_GEAR_SYSTEM.cloneGearCatalog()
    : {};
const rewardTreeCatalog =
  typeof BRASSLINE_REWARD_TREE.cloneRewardTreeCatalog === "function"
    ? BRASSLINE_REWARD_TREE.cloneRewardTreeCatalog()
    : {};
const questCatalog =
  typeof BRASSLINE_QUEST_SYSTEM.cloneQuestCatalog === "function"
    ? BRASSLINE_QUEST_SYSTEM.cloneQuestCatalog()
    : {};
applyThemeToCatalogIcons(gearCatalog);
applyThemeToCatalogIcons(rewardTreeCatalog);
applyThemeToCatalogIcons(questCatalog);

function getEffectiveProgressionBalance() {
  const progressionBalance = BALANCE.progression && typeof BALANCE.progression === "object" ? BALANCE.progression : {};
  const seedDefaultsLoaded = Boolean(window.BRASSLINE_SEEDS_D2_LOADED);
  const configuredSectors = Array.isArray(progressionBalance.sectors) ? progressionBalance.sectors : null;
  if (!seedDefaultsLoaded || !configuredSectors) {
    return progressionBalance;
  }

  const currentSignature = JSON.stringify(configuredSectors);
  if (currentSignature !== LEGACY_BALANCE_SECTOR_SIGNATURE) {
    return progressionBalance;
  }

  return {
    ...progressionBalance,
    sectors: undefined,
  };
}

function refreshConfiguredProgression() {
  const effectiveProgressionBalance = getEffectiveProgressionBalance();
  const seedEncounterModel =
    window.BRASSLINE_SEEDS_D2?.zones && typeof window.BRASSLINE_SEEDS_D2.zones === "object"
      ? window.BRASSLINE_SEEDS_D2.zones.encounterModel
      : null;
  const configured = BRASSLINE_PROGRESSION.buildConfiguredProgression({
    progressionBalance: effectiveProgressionBalance,
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
  stageEncounterModel = BRASSLINE_PROGRESSION.sanitizeEncounterModel(
    effectiveProgressionBalance?.encounterModel || seedEncounterModel || null
  );
}

function refreshEncounterModifierCatalog() {
  encounterModifierCatalog = BRASSLINE_ENCOUNTER_MODIFIERS.buildEncounterModifierCatalog({
    modifierConfig: BALANCE.progression?.encounterModifiers,
  });
}

refreshConfiguredProgression();
refreshEncounterModifierCatalog();

function getRunRouteSignature() {
  const routeSignature = BRASSLINE_PROGRESSION.buildRunRouteSignature({
    runSectors,
    runInterludes,
  });
  const encounterSignature = JSON.stringify(stageEncounterModel || {});
  return `${routeSignature}::encounters:${encounterSignature}`;
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
  applyThemeToCatalogIcons(upgradePathCatalog);
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

function createDefaultRunGearState() {
  if (typeof BRASSLINE_GEAR_SYSTEM.createDefaultRunGearState !== "function") {
    return {
      gearInventory: [],
      equippedGear: {
        weapon: "",
        armor: "",
        trinket: "",
      },
    };
  }
  return BRASSLINE_GEAR_SYSTEM.createDefaultRunGearState();
}

function createDefaultQuestState() {
  if (typeof BRASSLINE_QUEST_SYSTEM.createDefaultQuestState !== "function") {
    return {
      activeQuestIds: [],
      activeQuests: [],
      completedQuestIds: [],
      failedQuestIds: [],
      generatedFromSeed: 0,
    };
  }
  return BRASSLINE_QUEST_SYSTEM.createDefaultQuestState({
    questCatalog,
  });
}

function createDefaultRewardTreeState() {
  if (typeof BRASSLINE_REWARD_TREE.createDefaultRewardTreeState !== "function") {
    return {
      objectives: {
        sectorsCleared: 0,
        bossKills: 0,
        flawlessClears: 0,
        speedClears: 0,
      },
      unlockedNodeIds: [],
    };
  }
  return BRASSLINE_REWARD_TREE.createDefaultRewardTreeState();
}

function createDefaultClassState() {
  const desiredClassId = classCatalog[selectedClassId] ? selectedClassId : DEFAULT_CLASS_ID;
  if (typeof BRASSLINE_CLASS_SYSTEM.createDefaultClassState !== "function") {
    return {
      classId: desiredClassId,
      level: 1,
      xp: 0,
      skillPoints: 0,
      statPoints: 0,
      allocatedStats: {
        strength: 0,
        dexterity: 0,
        vitality: 0,
        energy: 0,
      },
      nodeRanks: {},
      cooldowns: {},
      spellRanks: {},
      baseStats: { ...(classCatalog?.[desiredClassId]?.baseStats || {}) },
      baseResistances: { ...(classCatalog?.[desiredClassId]?.baseResistances || {}) },
    };
  }
  return BRASSLINE_CLASS_SYSTEM.createDefaultClassState({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    spellCatalog: classSpellCatalog,
    classId: desiredClassId,
  });
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

function ensureRunGearState() {
  if (typeof BRASSLINE_GEAR_SYSTEM.normalizeRunGearState !== "function") {
    const fallback = createDefaultRunGearState();
    game.gearInventory = Array.isArray(game.gearInventory) ? game.gearInventory : fallback.gearInventory;
    game.equippedGear =
      game.equippedGear && typeof game.equippedGear === "object" ? game.equippedGear : fallback.equippedGear;
    return {
      gearInventory: game.gearInventory,
      equippedGear: game.equippedGear,
    };
  }
  const normalized = BRASSLINE_GEAR_SYSTEM.normalizeRunGearState({
    gearCatalog,
    game,
  });
  game.gearInventory = normalized.gearInventory;
  game.equippedGear = normalized.equippedGear;
  return normalized;
}

function ensureQuestState() {
  if (typeof BRASSLINE_QUEST_SYSTEM.sanitizeQuestState !== "function") {
    if (!game.questState || typeof game.questState !== "object") {
      game.questState = createDefaultQuestState();
    } else {
      game.questState.activeQuestIds = Array.isArray(game.questState.activeQuestIds)
        ? [...new Set(game.questState.activeQuestIds.filter((questId) => typeof questId === "string" && questId.trim()))]
        : [];
      game.questState.activeQuests = Array.isArray(game.questState.activeQuests)
        ? game.questState.activeQuests.map((quest) =>
            quest && typeof quest === "object" ? { ...quest } : null
          ).filter(Boolean)
        : [];
      game.questState.completedQuestIds = Array.isArray(game.questState.completedQuestIds)
        ? [...new Set(game.questState.completedQuestIds.filter((questId) => typeof questId === "string" && questId.trim()))]
        : [];
      game.questState.failedQuestIds = Array.isArray(game.questState.failedQuestIds)
        ? [...new Set(game.questState.failedQuestIds.filter((questId) => typeof questId === "string" && questId.trim()))]
        : [];
      game.questState.generatedFromSeed = Math.max(0, Number.parseInt(game.questState.generatedFromSeed, 10) || 0);
    }
    return game.questState;
  }
  game.questState = BRASSLINE_QUEST_SYSTEM.sanitizeQuestState({
    questCatalog,
    rawState: game.questState,
    runSeed: game.runSeed,
    runSectors,
    stageNodesBySector: game.stageNodesBySector,
  });
  return game.questState;
}

function ensureRewardTreeState() {
  if (typeof BRASSLINE_REWARD_TREE.sanitizeRewardTreeState !== "function") {
    if (!game.rewardTreeState || typeof game.rewardTreeState !== "object") {
      game.rewardTreeState = createDefaultRewardTreeState();
    }
    return game.rewardTreeState;
  }
  game.rewardTreeState = BRASSLINE_REWARD_TREE.sanitizeRewardTreeState({
    rewardTreeCatalog,
    rawState: game.rewardTreeState,
  });
  return game.rewardTreeState;
}

function ensureClassState() {
  if (typeof BRASSLINE_CLASS_SYSTEM.sanitizeClassState !== "function") {
    if (!game.classState || typeof game.classState !== "object") {
      game.classState = createDefaultClassState();
    } else {
      game.classState.statPoints = Math.max(0, Number.parseInt(game.classState.statPoints, 10) || 0);
      game.classState.allocatedStats =
        game.classState.allocatedStats && typeof game.classState.allocatedStats === "object"
          ? {
              strength: Math.max(0, Number.parseInt(game.classState.allocatedStats.strength, 10) || 0),
              dexterity: Math.max(0, Number.parseInt(game.classState.allocatedStats.dexterity, 10) || 0),
              vitality: Math.max(0, Number.parseInt(game.classState.allocatedStats.vitality, 10) || 0),
              energy: Math.max(0, Number.parseInt(game.classState.allocatedStats.energy, 10) || 0),
            }
          : { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
    }
    return game.classState;
  }
  game.classState = BRASSLINE_CLASS_SYSTEM.sanitizeClassState({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    spellCatalog: classSpellCatalog,
    levelTable: CLASS_LEVEL_TABLE,
    rawState: game.classState,
  });
  return game.classState;
}

function ensureClassItems() {
  const allowed = new Set(Object.keys(classItemCatalog || {}));
  const source = Array.isArray(game.classItems) ? game.classItems : [];
  const sanitized = source
    .map((itemId) => (typeof itemId === "string" ? itemId.trim() : ""))
    .filter((itemId) => itemId && allowed.has(itemId));
  game.classItems = [...new Set(sanitized)];
  return game.classItems;
}

function ensureClassResources() {
  const goldRaw = Number.parseInt(game.gold, 10);
  const potionsRaw = Number.parseInt(game.healingPotions, 10);
  const upgradeTokensRaw = Number.parseInt(game.itemUpgradeTokens, 10);
  game.gold = Number.isInteger(goldRaw) ? Math.max(0, goldRaw) : 0;
  game.healingPotions = Number.isInteger(potionsRaw) ? Math.max(0, potionsRaw) : 0;
  game.itemUpgradeTokens = Number.isInteger(upgradeTokensRaw) ? Math.max(0, upgradeTokensRaw) : 0;
  return {
    gold: game.gold,
    healingPotions: game.healingPotions,
    itemUpgradeTokens: game.itemUpgradeTokens,
  };
}

function getClassDefinition() {
  const classState = ensureClassState();
  const classId = typeof classState.classId === "string" ? classState.classId : "";
  return classCatalog[classId] || null;
}

function getClassTree() {
  if (typeof BRASSLINE_CLASS_SYSTEM.getClassTree === "function") {
    const tree = BRASSLINE_CLASS_SYSTEM.getClassTree({
      classCatalog,
      skillTreeCatalog: classSkillTreeCatalog,
      classId: ensureClassState().classId,
    });
    if (tree && typeof tree === "object") {
      return tree;
    }
  }
  const classDef = getClassDefinition();
  return classDef && typeof classDef.treeId === "string" ? classSkillTreeCatalog[classDef.treeId] || null : null;
}

function getClassNodeBonus(effectId) {
  if (typeof BRASSLINE_CLASS_SYSTEM.getNodeBonus !== "function") {
    return 0;
  }
  return BRASSLINE_CLASS_SYSTEM.getNodeBonus({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    classState: ensureClassState(),
    effectId,
  });
}

function getClassItemBonus(effectId) {
  const itemIds = ensureClassItems();
  return itemIds.reduce((sum, itemId) => {
    const entry = classItemCatalog[itemId];
    const value = Number.parseInt(entry?.effects?.[effectId], 10);
    return Number.isInteger(value) ? sum + value : sum;
  }, 0);
}

function getAllocatedClassStat(statId) {
  const classState = ensureClassState();
  const value = Number.parseInt(classState.allocatedStats?.[statId], 10);
  return Number.isInteger(value) ? Math.max(0, value) : 0;
}

function getClassStat(statId) {
  const classState = ensureClassState();
  const base = Number.parseInt(classState.baseStats?.[statId], 10);
  const baseValue = Number.isInteger(base) ? base : 0;
  const allocatedValue = getAllocatedClassStat(statId);
  return baseValue + allocatedValue + getRunPassiveBonus(`stat_${statId}`);
}

function getClassResistanceValue(damageType) {
  if (typeof damageType !== "string" || !damageType.trim()) {
    return 0;
  }
  const normalizedDamageType = damageType.trim().toLowerCase();
  const classState = ensureClassState();
  const base = Number.parseInt(classState.baseResistances?.[normalizedDamageType], 10);
  const value = Number.isInteger(base) ? base : 0;
  const bonus = getRunPassiveBonus(`res_${normalizedDamageType}`);
  return clamp(value + bonus, -75, 85);
}

function getSkillDefinition(skillId) {
  return typeof skillId === "string" ? classSkillCatalog[skillId] || null : null;
}

function getSpellDefinitionForSkill(skillId) {
  const skill = getSkillDefinition(skillId);
  if (!skill) {
    return null;
  }
  const spellBySkill = classSpellBySkillId[skill.id];
  if (spellBySkill && typeof spellBySkill === "object") {
    return spellBySkill;
  }
  const explicitSpellId = typeof skill.spellId === "string" ? skill.spellId.trim() : "";
  if (explicitSpellId && classSpellCatalog[explicitSpellId]) {
    return classSpellCatalog[explicitSpellId];
  }
  return null;
}

function getSpellDefinitionByCardId(cardId) {
  return typeof cardId === "string" ? classSpellCatalog[cardId] || null : null;
}

function getClassStarterCardIds() {
  const classDef = getClassDefinition();
  const explicitStarterDeck = Array.isArray(classDef?.starterDeckCardIds)
    ? classDef.starterDeckCardIds.filter((cardId) => typeof cardId === "string" && cardCatalog[cardId])
    : [];
  if (explicitStarterDeck.length > 0) {
    return explicitStarterDeck;
  }
  const starterSkillIds = Array.isArray(classDef?.starterSkillIds) ? classDef.starterSkillIds : [];
  const starterCopies = Math.max(1, Number.parseInt(classDef?.deckProfile?.starterCardCopies, 10) || 1);
  const starterCardIds = starterSkillIds
    .map((skillId) => getSpellDefinitionForSkill(skillId)?.id || "")
    .filter((cardId) => cardId && cardCatalog[cardId]);
  const additions = [];
  starterCardIds.forEach((cardId) => {
    for (let copy = 0; copy < starterCopies; copy += 1) {
      additions.push(cardId);
    }
  });
  return additions;
}

function getStarterDeckCardIdsForRun() {
  const classDef = getClassDefinition();
  const explicitStarterDeck = Array.isArray(classDef?.starterDeckCardIds)
    ? classDef.starterDeckCardIds.filter((cardId) => typeof cardId === "string" && cardCatalog[cardId])
    : [];
  if (explicitStarterDeck.length > 0) {
    return [...explicitStarterDeck];
  }
  return [...starterDeckRecipe, ...getClassStarterCardIds()];
}

function getUnlockedClassRewardCardIds() {
  const deckCardIds = collectDeckInstances()
    .map((instance) => (typeof instance?.cardId === "string" ? instance.cardId : ""))
    .filter(Boolean);
  return [...new Set(
    getUnlockedSkillIds()
      .map((skillId) => getSpellDefinitionForSkill(skillId) || null)
      .filter(Boolean)
      .filter((spell) => {
        const ownedCopies = deckCardIds.filter((cardId) => cardId === spell.id).length;
        const maxDeckCopies = Math.max(1, Number.parseInt(spell.maxDeckCopies, 10) || 2);
        const currentRank =
          typeof BRASSLINE_CLASS_SYSTEM.getSpellRank === "function"
            ? BRASSLINE_CLASS_SYSTEM.getSpellRank({
                classState: ensureClassState(),
                spellCatalog: classSpellCatalog,
                spellId: spell.id,
              })
            : 1;
        const rankCap = Math.max(1, Number.parseInt(spell.rankCap, 10) || 5);
        return ownedCopies < maxDeckCopies || currentRank < rankCap;
      })
      .map((spell) => spell.id)
      .filter((cardId) => cardId && cardCatalog[cardId])
  )];
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

function readUiPreferences() {
  const parsed = BRASSLINE_PERSISTENCE.readJson(UI_PREFERENCES_STORAGE_KEY);
  if (!parsed || typeof parsed !== "object") {
    return {
      comfortMode: false,
      selectedClassId: DEFAULT_CLASS_ID,
    };
  }
  const parsedClassId =
    typeof parsed.selectedClassId === "string" && classCatalog[parsed.selectedClassId]
      ? parsed.selectedClassId
      : DEFAULT_CLASS_ID;
  return {
    comfortMode: Boolean(parsed.comfortMode),
    selectedClassId: parsedClassId,
  };
}

function saveUiPreferences() {
  BRASSLINE_PERSISTENCE.writeJson(UI_PREFERENCES_STORAGE_KEY, {
    comfortMode: Boolean(game.comfortMode),
    selectedClassId,
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
    createDefaultRunGearState,
    createDefaultQuestState,
    createDefaultRewardTreeState,
    createDefaultClassState,
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
    gearCatalog,
    questCatalog,
    rewardTreeCatalog,
    classItemCatalog,
    normalizeRunGearState:
      typeof BRASSLINE_GEAR_SYSTEM.normalizeRunGearState === "function"
        ? BRASSLINE_GEAR_SYSTEM.normalizeRunGearState
        : null,
    sanitizeQuestState:
      typeof BRASSLINE_QUEST_SYSTEM.sanitizeQuestState === "function"
        ? ({ rawState, runSeed, stageNodesBySector }) =>
            BRASSLINE_QUEST_SYSTEM.sanitizeQuestState({
              questCatalog,
              rawState,
              runSeed,
              runSectors,
              stageNodesBySector,
            })
        : null,
    sanitizeRewardTreeState:
      typeof BRASSLINE_REWARD_TREE.sanitizeRewardTreeState === "function"
        ? BRASSLINE_REWARD_TREE.sanitizeRewardTreeState
        : null,
    sanitizeClassState:
      typeof BRASSLINE_CLASS_SYSTEM.sanitizeClassState === "function"
        ? ({ rawState }) =>
            BRASSLINE_CLASS_SYSTEM.sanitizeClassState({
              classCatalog,
              skillTreeCatalog: classSkillTreeCatalog,
              levelTable: CLASS_LEVEL_TABLE,
              rawState,
            })
        : null,
    sanitizeStageRouteState: ({ rawStageNodesBySector, stageNodeIndex, sectorIndex, runSeed }) => {
      const generated = BRASSLINE_PROGRESSION.buildStageNodeRoute({
        runSectors,
        runSeed,
        encounterModel: stageEncounterModel,
      });
      const source =
        Array.isArray(rawStageNodesBySector) && rawStageNodesBySector.length > 0
          ? rawStageNodesBySector
          : generated.stageNodesBySector;
      const sanitized = BRASSLINE_PROGRESSION.sanitizeStageNodeRoute({
        runSectors,
        rawStageNodesBySector: source,
        fallbackNodeType: "enemy",
      });
      const nodesInSector = Array.isArray(sanitized.stageNodesBySector?.[sectorIndex])
        ? Math.max(1, sanitized.stageNodesBySector[sectorIndex].length)
        : 1;
      const nodeIndexRaw = Number.parseInt(stageNodeIndex, 10);
      const safeStageNodeIndex =
        Number.isInteger(nodeIndexRaw) && nodeIndexRaw >= 0
          ? clamp(nodeIndexRaw, 0, Math.max(0, nodesInSector - 1))
          : 0;
      return {
        stageNodesBySector: sanitized.stageNodesBySector,
        stageNodeIndex: safeStageNodeIndex,
        stageProgress: BRASSLINE_PROGRESSION.getStageProgress({
          stageNodesBySector: sanitized.stageNodesBySector,
          sectorIndex,
          stageNodeIndex: safeStageNodeIndex,
          runSectorsLength: runSectors.length,
        }),
      };
    },
    trackLanes: TRACK_LANES,
    baseMaxHull: BASE_MAX_HULL,
    baseMaxEnergy: BASE_MAX_ENERGY,
    maxHeat: MAX_HEAT,
    playerStartHeat: PLAYER_START_HEAT,
  });
}

function restoreRunSnapshotState(snapshot) {
  const restored = BRASSLINE_RUN_SNAPSHOT.restoreRunSnapshotState({
    snapshot,
    game,
    createDefaultRecordHighlights,
    createDefaultQuestState,
    createDefaultClassState,
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
  if (restored) {
    ensureRunStageRouteState();
    ensureQuestState();
    ensureClassState();
    ensureClassItems();
    ensureClassResources();
    renderClassSkillPanel();
  }
  return restored;
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
  createDefaultRunGearStateFn: createDefaultRunGearState,
  createDefaultQuestStateFn: createDefaultQuestState,
  createDefaultRewardTreeStateFn: createDefaultRewardTreeState,
  createDefaultClassStateFn: createDefaultClassState,
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
  classLevelValue: document.getElementById("classLevelValue"),
  skillPointValue: document.getElementById("skillPointValue"),
  statPointValue: document.getElementById("statPointValue"),
  goldValue: document.getElementById("goldValue"),
  potionValue: document.getElementById("potionValue"),
  itemUpgradeValue: document.getElementById("itemUpgradeValue"),
  onboardingPanel: document.getElementById("onboardingPanel"),
  toggleOnboardingBtn: document.getElementById("toggleOnboardingBtn"),
  dismissOnboardingBtn: document.getElementById("dismissOnboardingBtn"),
  quickGuideGoal: document.getElementById("quickGuideGoal"),
  quickGuideStep: document.getElementById("quickGuideStep"),
  flowLabel: document.getElementById("flowLabel"),
  mapRoleNote: document.getElementById("mapRoleNote"),
  enemySectionHint: document.getElementById("enemySectionHint"),
  handZoneHint: document.getElementById("handZoneHint"),
  turnFlowText: document.getElementById("turnFlowText"),
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
  targetHint: document.getElementById("targetHint"),
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
  questPanel: document.getElementById("questPanel"),
  runSummaryPanel: document.getElementById("runSummaryPanel"),
  runSummaryTitle: document.getElementById("runSummaryTitle"),
  runSummarySubtitle: document.getElementById("runSummarySubtitle"),
  runSummaryStats: document.getElementById("runSummaryStats"),
  toggleRunTimelineBtn: document.getElementById("toggleRunTimelineBtn"),
  runSummaryTimeline: document.getElementById("runSummaryTimeline"),
  upgradeStrip: document.getElementById("upgradeStrip"),
  artifactStrip: document.getElementById("artifactStrip"),
  rewardTreeStrip: document.getElementById("rewardTreeStrip"),
  gearStrip: document.getElementById("gearStrip"),
  resetMetaBtn: document.getElementById("resetMetaBtn"),
  resetRunRecordsBtn: document.getElementById("resetRunRecordsBtn"),
  overclockBtn: document.getElementById("overclockBtn"),
  usePotionBtn: document.getElementById("usePotionBtn"),
  classSelect: document.getElementById("classSelect"),
  applyClassBtn: document.getElementById("applyClassBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  shiftLeftBtn: document.getElementById("shiftLeftBtn"),
  shiftRightBtn: document.getElementById("shiftRightBtn"),
  cycleHandBtn: document.getElementById("cycleHandBtn"),
  toggleComfortModeBtn: document.getElementById("toggleComfortModeBtn"),
  classSummary: document.getElementById("classSummary"),
  statAllocation: document.getElementById("statAllocation"),
  skillTreeNodes: document.getElementById("skillTreeNodes"),
  skillBar: document.getElementById("skillBar"),
};

const gameEngine = BRASSLINE_ENGINE_CORE.createGameEngine({
  game,
  initialPhase: BRASSLINE_ENGINE_CORE.PHASES?.RUN_SETUP || "run_setup",
  onError: (error, actionId) => {
    console.error(`[engine] action failed: ${actionId}`, error);
  },
});

function normalizeGamePhase(value) {
  if (typeof BRASSLINE_ENGINE_CORE?.normalizePhase === "function") {
    return BRASSLINE_ENGINE_CORE.normalizePhase(value);
  }
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim().toLowerCase();
  return normalized || "";
}

function normalizeCombatSubphase(value) {
  if (typeof BRASSLINE_ENGINE_CORE?.normalizeCombatSubphase === "function") {
    return BRASSLINE_ENGINE_CORE.normalizeCombatSubphase(value);
  }
  return value === "enemy_resolve" ? "enemy_resolve" : value === "player_turn" ? "player_turn" : "";
}

function resolveEncounterSubphase(requestedSubphase = "", fallbackSubphase = "") {
  const requested = normalizeCombatSubphase(requestedSubphase);
  if (requested) {
    return requested;
  }
  const fallback = normalizeCombatSubphase(fallbackSubphase);
  if (fallback) {
    return fallback;
  }
  return "player_turn";
}

function getCombatSubphase() {
  return game.combatSubphase === "enemy_resolve" ? "enemy_resolve" : "player_turn";
}

function isPlayerTurnPhase() {
  return game.phase === "encounter" && getCombatSubphase() === "player_turn";
}

function isRunTerminalPhase() {
  return game.phase === "run_complete" || game.phase === "run_failed";
}

function setGamePhase(nextPhase, reason = "", metadata = null) {
  const targetPhase = normalizeGamePhase(nextPhase);
  if (!targetPhase) {
    return false;
  }
  const runtimePhase = normalizeGamePhase(game.phase);
  const trackedPhase = normalizeGamePhase(typeof gameEngine.getPhase === "function" ? gameEngine.getPhase() : "");
  const metadataObject = metadata && typeof metadata === "object" ? { ...metadata } : null;
  const targetCombatSubphase =
    targetPhase === "encounter"
      ? resolveEncounterSubphase(metadataObject?.combatSubphase, game.combatSubphase)
      : null;

  if (metadataObject && targetPhase === "encounter") {
    metadataObject.combatSubphase = targetCombatSubphase;
  }

  if (runtimePhase && trackedPhase && runtimePhase !== trackedPhase) {
    gameEngine.transition(runtimePhase, "external_phase_sync", null, true);
  }
  const transition = gameEngine.transition(targetPhase, reason, metadataObject);
  if (!transition.ok) {
    // Fallback keeps runtime recoverable if a transition rule is too strict.
    game.phase = targetPhase;
    game.combatSubphase = targetCombatSubphase;
    return false;
  }
  if (!transition.changed) {
    game.phase = targetPhase;
  }
  game.combatSubphase = targetCombatSubphase;
  return true;
}

function runGameAction(actionId, execute) {
  if (typeof execute !== "function") {
    return false;
  }
  return gameEngine.dispatch(actionId, execute);
}

function applyThemeToStaticUiIcons() {
  document.querySelectorAll("img.ui-icon").forEach((iconEl) => {
    if (!iconEl || typeof iconEl.getAttribute !== "function") {
      return;
    }
    const rawSrc = iconEl.getAttribute("src");
    if (typeof rawSrc !== "string" || !rawSrc.trim()) {
      return;
    }
    iconEl.setAttribute("src", resolveThemeIconPath(rawSrc));
  });
}

applyThemeToStaticUiIcons();

function syncComfortModeUi() {
  const comfortMode = Boolean(game.comfortMode);
  document.body.dataset.uiScale = comfortMode ? "comfort" : "default";
  if (els.toggleComfortModeBtn) {
    els.toggleComfortModeBtn.textContent = comfortMode
      ? "Larger Targets: On"
      : "Larger Targets: Off";
    els.toggleComfortModeBtn.title = comfortMode
      ? "Comfort mode enabled: larger click/tap targets."
      : "Enable comfort mode: larger click/tap targets.";
  }
}

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

function triggerBodyActionFx(effectClass, durationMs = 260) {
  if (!effectClass || !document?.body?.classList) {
    return;
  }
  document.body.classList.remove(effectClass);
  // Restart the animation if the same effect triggers rapidly.
  void document.body.offsetWidth;
  document.body.classList.add(effectClass);
  window.setTimeout(() => {
    document.body.classList.remove(effectClass);
  }, Math.max(120, durationMs));
}

function ensureRecentImpacts() {
  if (!Array.isArray(game.recentImpacts)) {
    game.recentImpacts = [];
  }
  return game.recentImpacts;
}

function recordLaneImpact(lanes, type = "hit", durationMs = 550) {
  const normalizedLanes = [
    ...new Set(
      (Array.isArray(lanes) ? lanes : [])
        .map((lane) => Number.parseInt(lane, 10))
        .filter((lane) => Number.isInteger(lane) && lane >= 0 && lane < TRACK_LANES)
    ),
  ];
  if (normalizedLanes.length === 0) {
    return;
  }

  const impacts = ensureRecentImpacts();
  impacts.push({
    lanes: normalizedLanes,
    type: typeof type === "string" ? type : "hit",
    until: Date.now() + Math.max(180, durationMs),
  });
}

function trimRecentImpacts() {
  const impacts = ensureRecentImpacts();
  const now = Date.now();
  game.recentImpacts = impacts.filter((impact) => Number.isFinite(impact?.until) && impact.until > now);
}

function toggleComfortMode() {
  game.comfortMode = !game.comfortMode;
  saveUiPreferences();
  syncComfortModeUi();
  setLog(
    game.comfortMode
      ? "Comfort mode on: larger click targets enabled."
      : "Comfort mode off: standard target sizes restored."
  );
  updateHud();
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
  if (telegraph?.type === "lob") {
    recordLaneImpact(getLobLanes(telegraph.targetLane, telegraph.radius), "lob", 620);
  } else if (telegraph?.type === "sweep") {
    recordLaneImpact(telegraph.lanes, "sweep", 620);
  }

  const note = BRASSLINE_COMBAT_CORE.resolveTelegraph({
    game,
    telegraph,
    getLobLanesFn: getLobLanes,
    damagePlayerFn: (amount, ignoreBlock) => {
      const damageType = telegraph?.type === "lob" ? "fire" : "physical";
      return damagePlayer(amount, ignoreBlock, damageType);
    },
  });
  if (note) {
    triggerBodyActionFx("impact-track", 210);
  }
  return note;
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

function getWeightedDropKind() {
  const entries = [
    { kind: "gold", weight: KILL_DROP_GOLD_WEIGHT },
    { kind: "potion", weight: KILL_DROP_POTION_WEIGHT },
    { kind: "upgrade", weight: KILL_DROP_UPGRADE_WEIGHT },
    { kind: "item", weight: KILL_DROP_ITEM_WEIGHT },
  ]
    .map((entry) => ({
      kind: entry.kind,
      weight: Number.parseInt(entry.weight, 10),
    }))
    .filter((entry) => Number.isInteger(entry.weight) && entry.weight > 0);
  if (entries.length === 0) {
    return "gold";
  }
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = randomInt(total);
  for (const entry of entries) {
    if (roll < entry.weight) {
      return entry.kind;
    }
    roll -= entry.weight;
  }
  return entries[entries.length - 1].kind;
}

function getKillXpReward(enemy) {
  return enemy?.elite ? KILL_XP_ELITE : KILL_XP_BASE;
}

function gainClassXp(amount, reason = "combat") {
  const xpGain = Number.parseInt(amount, 10);
  if (!Number.isInteger(xpGain) || xpGain <= 0) {
    return {
      gainedLevels: 0,
      skillPointsGained: 0,
    };
  }
  if (typeof BRASSLINE_CLASS_SYSTEM.gainXp !== "function") {
    return {
      gainedLevels: 0,
      skillPointsGained: 0,
    };
  }
  const classState = ensureClassState();
  const result = BRASSLINE_CLASS_SYSTEM.gainXp({
    classState,
    amount: xpGain,
    levelTable: CLASS_LEVEL_TABLE,
  });
  if (result.gainedLevels > 0) {
    appendRunTimelineEntry(
      `${getClassDefinition()?.title || "Hero"} reached Lv.${result.nextLevel} (+${result.skillPointsGained} skill, +${result.statPointsGained || 0} stat).`,
      {
        type: "reward",
      }
    );
    if (reason === "combat") {
      setLog(
        `Level up: ${getClassDefinition()?.title || "Hero"} is now Lv.${result.nextLevel}.`
      );
    }
  }
  return result;
}

function grantKillDrop(enemy) {
  ensureClassResources();
  ensureClassItems();

  const xp = getKillXpReward(enemy);
  gainClassXp(xp, "combat");
  let rewardLabel = `+${xp} XP`;
  const dropKind = getWeightedDropKind();

  if (dropKind === "gold") {
    const goldSpan = Math.max(1, KILL_GOLD_MAX - KILL_GOLD_MIN + 1);
    const goldReward = KILL_GOLD_MIN + randomInt(goldSpan);
    game.gold += Math.max(0, goldReward);
    rewardLabel += `, +${goldReward} gold`;
  } else if (dropKind === "potion") {
    game.healingPotions += 1;
    rewardLabel += ", +1 potion";
  } else if (dropKind === "upgrade") {
    game.itemUpgradeTokens += 1;
    rewardLabel += ", +1 upgrade token";
  } else {
    const owned = new Set(ensureClassItems());
    const itemChoices = Object.values(classItemCatalog)
      .filter((item) => item && typeof item.id === "string" && !owned.has(item.id))
      .map((item) => ({
        id: item.id,
        weight: Number.isInteger(Number.parseInt(item.dropWeight, 10))
          ? Math.max(1, Number.parseInt(item.dropWeight, 10))
          : 1,
      }));
    if (itemChoices.length > 0) {
      const totalWeight = itemChoices.reduce((sum, item) => sum + item.weight, 0);
      let roll = randomInt(totalWeight);
      let chosenItemId = itemChoices[0].id;
      for (const entry of itemChoices) {
        if (roll < entry.weight) {
          chosenItemId = entry.id;
          break;
        }
        roll -= entry.weight;
      }
      if (!owned.has(chosenItemId)) {
        game.classItems.push(chosenItemId);
        rewardLabel += `, item: ${classItemCatalog[chosenItemId]?.title || chosenItemId}`;
      }
    } else {
      const goldFallback = Math.max(1, Math.floor(KILL_GOLD_MIN / 2));
      game.gold += goldFallback;
      rewardLabel += `, +${goldFallback} gold`;
    }
  }

  applyUpgradeDerivedCaps();
  appendRunTimelineEntry(
    `Defeated ${enemy?.name || "enemy"} (${enemy?.elite ? "elite" : "normal"}): ${rewardLabel}.`,
    {
      type: "reward",
      sectorIndex: game.sectorIndex,
      turn: game.turn,
    }
  );
}

function getMitigatedDamage(amount, damageType = "physical") {
  const raw = Number.parseInt(amount, 10);
  const safeAmount = Number.isInteger(raw) ? Math.max(0, raw) : 0;
  const normalizedDamageType =
    typeof damageType === "string" && damageType.trim() ? damageType.trim().toLowerCase() : "physical";
  if (safeAmount <= 0 || normalizedDamageType === "pure" || normalizedDamageType === "true") {
    return safeAmount;
  }
  const resistance = getClassResistanceValue(normalizedDamageType);
  return Math.max(0, Math.round(safeAmount * ((100 - resistance) / 100)));
}

function damageEnemy(enemy, amount) {
  const wasAlive = Boolean(enemy?.alive);
  const dealt = BRASSLINE_PLAYER_ACTIONS.damageEnemy({
    enemy,
    amount,
    ensureRunStats,
  });
  if (dealt > 0 && enemy) {
    enemy.hitFlashAt = Date.now();
    triggerBodyActionFx("impact-enemy", 180);
  }
  if (enemy && wasAlive && !enemy.alive) {
    enemy.destroyedAt = Date.now();
    grantKillDrop(enemy);
  }
  return dealt;
}

function damagePlayer(amount, ignoreBlock = false, damageType = "physical") {
  const mitigatedAmount = getMitigatedDamage(amount, damageType);
  const took = BRASSLINE_PLAYER_ACTIONS.damagePlayer({
    game,
    amount: mitigatedAmount,
    ignoreBlock,
    ensureRunStats,
  });
  if (took > 0) {
    game.player.hitFlashAt = Date.now();
    recordLaneImpact([game.player.lane], ignoreBlock ? "hull" : "hit");
    triggerBodyActionFx("impact-hull", 240);
  }
  return took;
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

function buildContext(targetEnemy, sourceCard = null) {
  const strengthBonus = Math.max(0, Math.floor(getClassStat("strength") / 25));
  const attackFlatBonus =
    sourceCard?.type === "Attack"
      ? Math.max(0, Number.parseInt(getRunPassiveBonus("attack_flat_bonus"), 10) || 0) + strengthBonus
      : 0;
  return {
    game,
    target: targetEnemy,
    hasCombo: () => Number.isInteger(game.turnCardsPlayed) && game.turnCardsPlayed > 0,
    damageEnemy: (enemy, amount) => damageEnemy(enemy, Math.max(0, amount + attackFlatBonus)),
    damagePlayer: (amount, ignoreBlock = false) => damagePlayer(amount, ignoreBlock, "pure"),
    drawCards,
    gainHeat,
    gainBlock,
    gainEnergy,
    consumeAttackMultiplier,
    livingEnemies,
    castClassSpellCard: ({ spellId, effect, sourceCardType }) =>
      castClassSpellCard({
        spellId,
        effect,
        sourceCardType,
        selectedEnemy: targetEnemy,
        attackFlatBonus,
      }),
    log: setLog,
  };
}

function getSkillEnergyCost(skill) {
  const costRaw = Number.parseInt(skill?.energyCost, 10);
  return Number.isInteger(costRaw) && costRaw > 0 ? costRaw : 0;
}

function getUnlockedSkillIds() {
  if (typeof BRASSLINE_CLASS_SYSTEM.getUnlockedSkillIds !== "function") {
    return [];
  }
  return BRASSLINE_CLASS_SYSTEM.getUnlockedSkillIds({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    classState: ensureClassState(),
    skillCatalog: classSkillCatalog,
  });
}

function canUseClassSkill(skillId) {
  if (typeof BRASSLINE_CLASS_SYSTEM.canUseSkill !== "function") {
    return false;
  }
  return BRASSLINE_CLASS_SYSTEM.canUseSkill({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    classState: ensureClassState(),
    skillCatalog: classSkillCatalog,
    skillId,
    phase: game.phase,
    combatSubphase: getCombatSubphase(),
    energy: game.player.energy,
  });
}

function getSkillCooldown(skillId) {
  if (typeof BRASSLINE_CLASS_SYSTEM.getSkillCooldown !== "function") {
    return 0;
  }
  return BRASSLINE_CLASS_SYSTEM.getSkillCooldown({
    classState: ensureClassState(),
    skillId,
  });
}

function getDeckCardIds({ includeCardId = "" } = {}) {
  const cardIds = collectDeckInstances()
    .map((instance) => (typeof instance?.cardId === "string" ? instance.cardId : ""))
    .filter(Boolean);
  if (includeCardId) {
    cardIds.push(includeCardId);
  }
  return cardIds;
}

function getSpellPowerBreakdown(spellId, includeCardId = "") {
  if (typeof BRASSLINE_CLASS_SYSTEM.getSpellPowerBreakdown !== "function") {
    return {
      totalValue: 0,
      totalBonus: 0,
    };
  }
  return BRASSLINE_CLASS_SYSTEM.getSpellPowerBreakdown({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    classState: ensureClassState(),
    skillCatalog: classSkillCatalog,
    spellCatalog: classSpellCatalog,
    spellId,
    deckCardIds: getDeckCardIds({ includeCardId }),
  });
}

function applySpellEffect({
  effect,
  skill,
  spell,
  selectedEnemy,
  includeCardId = "",
  sourceCardType = "",
  attackFlatBonus = 0,
}) {
  const kind = typeof effect?.kind === "string" ? effect.kind.trim().toLowerCase() : "";
  if (!kind) {
    return {
      ok: false,
      message: "Spell has no effect configured.",
    };
  }

  const label = spell?.title || skill?.title || "Skill";
  const isAttackCard = String(sourceCardType || "").toLowerCase() === "attack";
  const spellBreakdown =
    spell && typeof spell.id === "string"
      ? getSpellPowerBreakdown(spell.id, includeCardId || spell.id)
      : { totalValue: Math.max(0, Number.parseInt(effect?.value, 10) || 0), totalBonus: 0, rank: 1 };
  if (kind === "damage_selected_combo_block") {
    if (!selectedEnemy || !selectedEnemy.alive) {
      return {
        ok: false,
        message: "Select a living enemy to cast this skill.",
      };
    }
    const targetAlreadyDamaged = Boolean(selectedEnemy.tookDamageThisTurn);
    const powerBonus = Math.max(0, Math.floor(getClassStat("energy") / 10));
    const spellDamageBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("spell_damage_bonus"), 10) || 0);
    const damageBase = Math.max(0, spellBreakdown.totalValue + powerBonus + spellDamageBonus);
    const damageBeforeAttackBonus = isAttackCard ? consumeAttackMultiplier(damageBase) : damageBase;
    const damage = Math.max(0, damageBeforeAttackBonus + (isAttackCard ? attackFlatBonus : 0));
    const dealt = damageEnemy(selectedEnemy, damage);
    const bonusBlock = targetAlreadyDamaged ? Math.max(0, Number.parseInt(effect?.bonusBlock, 10) || 0) : 0;
    if (bonusBlock > 0) {
      gainBlock(bonusBlock);
    }
    return {
      ok: true,
      message:
        dealt > 0
          ? `${label} hit ${selectedEnemy.name} for ${dealt}${bonusBlock > 0 ? ` and granted ${bonusBlock} Block.` : "."}`
          : `${label} was blocked by ${selectedEnemy.name}.`,
    };
  }

  if (kind === "damage_selected_first_spell_gain_energy") {
    if (!selectedEnemy || !selectedEnemy.alive) {
      return {
        ok: false,
        message: "Select a living enemy to cast this skill.",
      };
    }
    const firstSpellAction = (Number.isInteger(game.turnSpellActionsUsed) ? game.turnSpellActionsUsed : 0) === 0;
    const powerBonus = Math.max(0, Math.floor(getClassStat("energy") / 10));
    const spellDamageBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("spell_damage_bonus"), 10) || 0);
    const damageBase = Math.max(0, spellBreakdown.totalValue + powerBonus + spellDamageBonus);
    const damageBeforeAttackBonus = isAttackCard ? consumeAttackMultiplier(damageBase) : damageBase;
    const damage = Math.max(0, damageBeforeAttackBonus + (isAttackCard ? attackFlatBonus : 0));
    const dealt = damageEnemy(selectedEnemy, damage);
    const bonusEnergy = firstSpellAction ? Math.max(0, Number.parseInt(effect?.bonusEnergy, 10) || 0) : 0;
    return {
      ok: true,
      afterSkillEnergyGain: bonusEnergy,
      message:
        dealt > 0
          ? `${label} hit ${selectedEnemy.name} for ${dealt}${bonusEnergy > 0 ? ` and restored ${bonusEnergy} Energy.` : "."}`
          : `${label} was blocked by ${selectedEnemy.name}.`,
    };
  }

  if (kind === "damage_selected") {
    if (!selectedEnemy || !selectedEnemy.alive) {
      return {
        ok: false,
        message: "Select a living enemy to cast this skill.",
      };
    }
    const powerBonus = Math.max(0, Math.floor(getClassStat("energy") / 10));
    const spellDamageBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("spell_damage_bonus"), 10) || 0);
    const damageBase = Math.max(0, spellBreakdown.totalValue + powerBonus + spellDamageBonus);
    const damageBeforeAttackBonus = isAttackCard ? consumeAttackMultiplier(damageBase) : damageBase;
    const damage = Math.max(0, damageBeforeAttackBonus + (isAttackCard ? attackFlatBonus : 0));
    const dealt = damageEnemy(selectedEnemy, damage);
    if (dealt <= 0) {
      return {
        ok: false,
        message: `${label} was blocked by ${selectedEnemy.name}.`,
      };
    }
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} hit ${selectedEnemy.name} for ${dealt} (+${spellBreakdown.totalBonus} class card power).`
          : `${label} hit ${selectedEnemy.name} for ${dealt}.`,
    };
  }

  if (kind === "damage_all") {
    const powerBonus = Math.max(0, Math.floor(getClassStat("energy") / 10));
    const spellDamageBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("spell_damage_bonus"), 10) || 0);
    const damageBase = Math.max(0, spellBreakdown.totalValue + powerBonus + spellDamageBonus);
    const damageBeforeAttackBonus = isAttackCard ? consumeAttackMultiplier(damageBase) : damageBase;
    const damage = Math.max(0, damageBeforeAttackBonus + (isAttackCard ? attackFlatBonus : 0));
    const alive = livingEnemies();
    let total = 0;
    alive.forEach((enemy) => {
      total += damageEnemy(enemy, damage);
    });
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} dealt ${total} total damage (+${spellBreakdown.totalBonus} class card power).`
          : `${label} dealt ${total} total damage.`,
    };
  }

  if (kind === "heal_self") {
    const value = Math.max(0, spellBreakdown.totalValue || Number.parseInt(effect.value, 10) || 0);
    const vitalityBonus = Math.max(0, Math.floor(getClassStat("vitality") / 8));
    const heal = Math.max(0, value + vitalityBonus);
    if (heal <= 0) {
      return {
        ok: false,
        message: `${label} had no effect.`,
      };
    }
    const before = game.player.hull;
    game.player.hull = clamp(game.player.hull + heal, 0, game.player.maxHull);
    const healed = game.player.hull - before;
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} restored ${healed} Hull (+${spellBreakdown.totalBonus} class card power).`
          : `${label} restored ${healed} Hull.`,
    };
  }

  if (kind === "gain_block") {
    const value = Math.max(0, spellBreakdown.totalValue || Number.parseInt(effect.value, 10) || 0);
    gainBlock(value);
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} granted ${value} Block (+${spellBreakdown.totalBonus} class card power).`
          : `${label} granted ${value} Block.`,
    };
  }

  if (kind === "gain_energy") {
    const value = Math.max(0, spellBreakdown.totalValue || Number.parseInt(effect.value, 10) || 0);
    gainEnergy(value);
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} granted ${value} Steam (+${spellBreakdown.totalBonus} class card power).`
          : `${label} granted ${value} Steam.`,
    };
  }

  if (kind === "draw_cards") {
    const value = Math.max(0, spellBreakdown.totalValue || Number.parseInt(effect.value, 10) || 0);
    drawCards(value);
    return {
      ok: true,
      message:
        spellBreakdown.totalBonus > 0
          ? `${label} drew ${value} card${value === 1 ? "" : "s"} (+${spellBreakdown.totalBonus} class card power).`
          : `${label} drew ${value} card${value === 1 ? "" : "s"}.`,
    };
  }

  return {
    ok: false,
    message: `Unsupported effect kind: ${kind}.`,
  };
}

function castClassSpellCard({ spellId, effect, sourceCardType, selectedEnemy = null, attackFlatBonus = 0 }) {
  const spell = getSpellDefinitionByCardId(spellId);
  const skill = spell?.linkedSkillId ? getSkillDefinition(spell.linkedSkillId) : null;
  return applySpellEffect({
    effect: effect || spell?.effect || skill?.effect,
    skill,
    spell,
    selectedEnemy,
    includeCardId: spellId,
    sourceCardType,
    attackFlatBonus,
  });
}

function useClassSkill(skillId) {
  const skill = getSkillDefinition(skillId);
  if (!skill) {
    setLog("Unknown skill.");
    updateHud();
    return false;
  }
  if (!canUseClassSkill(skillId)) {
    const cooldown = getSkillCooldown(skillId);
    if (cooldown > 0) {
      setLog(`${skill.title} is on cooldown (${cooldown}).`);
    } else if (!isPlayerTurnPhase()) {
      setLog("Skills can only be cast during your turn.");
    } else {
      setLog(`${skill.title} cannot be cast right now.`);
    }
    updateHud();
    return false;
  }

  const selectedEnemy = getSelectedEnemy();
  const spell = getSpellDefinitionForSkill(skillId);
  const effect = spell?.effect || skill.effect;
  const outcome = applySpellEffect({
    effect,
    skill,
    spell,
    selectedEnemy,
  });
  if (!outcome.ok) {
    setLog(outcome.message);
    updateHud();
    return false;
  }

  const energyCost = getSkillEnergyCost(skill);
  if (energyCost > 0) {
    game.player.energy = Math.max(0, game.player.energy - energyCost);
  }
  if ((Number.parseInt(outcome?.afterSkillEnergyGain, 10) || 0) > 0) {
    gainEnergy(Number.parseInt(outcome.afterSkillEnergyGain, 10) || 0);
  }

  if (typeof BRASSLINE_CLASS_SYSTEM.useSkill === "function") {
    BRASSLINE_CLASS_SYSTEM.useSkill({
      classState: ensureClassState(),
      skillCatalog: classSkillCatalog,
      skillId,
    });
  }

  if (spell && String(spell.cardRole || "").toLowerCase() === "spell") {
    game.turnSpellActionsUsed = Number.isInteger(game.turnSpellActionsUsed) ? game.turnSpellActionsUsed + 1 : 1;
  }

  setLog(outcome.message);
  checkEndStates();
  renderEnemies();
  renderTrackMap();
  renderCards();
  updateHud();
  return true;
}

function upgradeClassNode(nodeId) {
  if (typeof BRASSLINE_CLASS_SYSTEM.upgradeNode !== "function") {
    return false;
  }
  const result = BRASSLINE_CLASS_SYSTEM.upgradeNode({
    classCatalog,
    skillTreeCatalog: classSkillTreeCatalog,
    classState: ensureClassState(),
    nodeId,
  });
  if (!result) {
    setLog("Cannot upgrade this skill tree node.");
    updateHud();
    return false;
  }

  applyUpgradeDerivedCaps();
  const node = result.node || {};
  const maxRankRaw = Number.parseInt(node.maxRank, 10);
  const maxRank = Number.isInteger(maxRankRaw) && maxRankRaw > 0 ? maxRankRaw : 1;
  setLog(
    `Upgraded ${node.title || node.id || "node"} to ${result.nextRank}/${maxRank}. Skill points left: ${result.remainingPoints}.`
  );
  updateHud();
  return true;
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
  const overclockHeatReduction = getRunPassiveBonus("overclock_heat_reduction");
  const effectiveOverclockHeatGain = Math.max(0, OVERCLOCK_HEAT_GAIN - overclockHeatReduction);
  BRASSLINE_PLAYER_ACTIONS.useOverclock({
    game,
    setLog,
    updateHud,
    gainEnergyFn: gainEnergy,
    gainHeatFn: gainHeat,
    damagePlayerFn: (amount, ignoreBlock) => damagePlayer(amount, ignoreBlock, "pure"),
    overclockHeatGain: effectiveOverclockHeatGain,
    overclockStrainHeatThreshold: OVERCLOCK_STRAIN_HEAT_THRESHOLD,
    overclockStrainDamage: OVERCLOCK_STRAIN_DAMAGE,
  });
}

function usePotion() {
  ensureClassResources();
  if (isRunTerminalPhase()) {
    setLog("Cannot use potions outside an active run.");
    updateHud();
    return false;
  }
  if (game.healingPotions <= 0) {
    setLog("No healing potions available.");
    updateHud();
    return false;
  }
  if (game.player.hull >= game.player.maxHull) {
    setLog("Hull is already full.");
    updateHud();
    return false;
  }
  game.healingPotions -= 1;
  const healBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("potion_heal_bonus"), 10) || 0);
  const vitalityBonus = Math.max(0, Math.floor(getClassStat("vitality") / 8));
  const healAmount = Math.max(0, POTION_HEAL_AMOUNT + healBonus + vitalityBonus);
  const before = game.player.hull;
  game.player.hull = clamp(game.player.hull + healAmount, 0, game.player.maxHull);
  const healed = Math.max(0, game.player.hull - before);
  setLog(`Used potion for ${healed} Hull.`);
  updateHud();
  return true;
}

function setSelectedClass(nextClassId) {
  if (typeof nextClassId !== "string" || !classCatalog[nextClassId]) {
    return false;
  }
  selectedClassId = nextClassId;
  saveUiPreferences();
  return true;
}

function applySelectedClassAndRestart() {
  if (!els.classSelect) {
    return false;
  }
  const nextClassId = typeof els.classSelect.value === "string" ? els.classSelect.value : "";
  if (!setSelectedClass(nextClassId)) {
    setLog("Select a valid class.");
    updateHud();
    return false;
  }
  clearRunSnapshotState();
  initGame({ tryResume: false });
  setLog(`New run started as ${classCatalog[selectedClassId]?.title || selectedClassId}.`);
  updateHud();
  return true;
}

function allocateClassStat(statId) {
  const stat = CLASS_STAT_DEFINITIONS.find((entry) => entry.id === statId);
  if (!stat) {
    return false;
  }
  const classState = ensureClassState();
  if ((classState.statPoints || 0) <= 0) {
    setLog("No stat points available.");
    updateHud();
    return false;
  }
  if (!classState.allocatedStats || typeof classState.allocatedStats !== "object") {
    classState.allocatedStats = {
      strength: 0,
      dexterity: 0,
      vitality: 0,
      energy: 0,
    };
  }
  classState.allocatedStats[stat.id] = Math.max(0, Number.parseInt(classState.allocatedStats[stat.id], 10) || 0) + 1;
  classState.statPoints = Math.max(0, (Number.parseInt(classState.statPoints, 10) || 0) - 1);
  applyUpgradeDerivedCaps();
  setLog(`Allocated +1 ${stat.title}.`);
  updateHud();
  return true;
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
    enemies: game.enemies,
    playerLane: game.player.lane,
    getPlayerHull: () => game.player.hull,
    getAimedShotDamage,
    getLockedAimLane,
    damagePlayer: (amount, ignoreBlock) => damagePlayer(amount, ignoreBlock, "physical"),
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

function createFallbackStageNodesForSector(sectorIndex = 0) {
  return [
    {
      id: `s${sectorIndex + 1}_n1_enemy`,
      type: "enemy",
      label: "Enemy",
    },
  ];
}

function getStageNodesForSector(sectorIndex = game.sectorIndex) {
  if (!Array.isArray(game.stageNodesBySector)) {
    return createFallbackStageNodesForSector(sectorIndex);
  }
  const nodes = game.stageNodesBySector[sectorIndex];
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return createFallbackStageNodesForSector(sectorIndex);
  }
  return nodes;
}

function refreshStageProgressState() {
  game.stageProgress = BRASSLINE_PROGRESSION.getStageProgress({
    stageNodesBySector: game.stageNodesBySector,
    sectorIndex: game.sectorIndex,
    stageNodeIndex: game.stageNodeIndex,
    runSectorsLength: runSectors.length,
  });
  return game.stageProgress;
}

function resetRunStageRoute() {
  const route = BRASSLINE_PROGRESSION.buildStageNodeRoute({
    runSectors,
    runSeed: game.runSeed,
    encounterModel: stageEncounterModel,
  });
  game.stageNodesBySector = Array.isArray(route.stageNodesBySector) ? route.stageNodesBySector : [];
  game.stageNodeIndex = 0;
  refreshStageProgressState();
}

function ensureRunStageRouteState() {
  const sanitized = BRASSLINE_PROGRESSION.sanitizeStageNodeRoute({
    runSectors,
    rawStageNodesBySector: game.stageNodesBySector,
    fallbackNodeType: "enemy",
  });
  game.stageNodesBySector = sanitized.stageNodesBySector;
  const nodesInSector = getStageNodesForSector().length;
  const stageNodeIndexRaw = Number.parseInt(game.stageNodeIndex, 10);
  game.stageNodeIndex =
    Number.isInteger(stageNodeIndexRaw) && stageNodeIndexRaw >= 0
      ? clamp(stageNodeIndexRaw, 0, Math.max(0, nodesInSector - 1))
      : 0;
  refreshStageProgressState();
}

function getCurrentStageNode() {
  const nodes = getStageNodesForSector(game.sectorIndex);
  const stageNodeIndexRaw = Number.parseInt(game.stageNodeIndex, 10);
  const stageNodeIndex =
    Number.isInteger(stageNodeIndexRaw) && stageNodeIndexRaw >= 0
      ? clamp(stageNodeIndexRaw, 0, Math.max(0, nodes.length - 1))
      : 0;
  game.stageNodeIndex = stageNodeIndex;
  return nodes[stageNodeIndex] || null;
}

function advanceStageNodeCursor() {
  ensureRunStageRouteState();
  const nodes = getStageNodesForSector(game.sectorIndex);
  const nextNodeIndex = game.stageNodeIndex + 1;
  if (nextNodeIndex < nodes.length) {
    game.stageNodeIndex = nextNodeIndex;
    refreshStageProgressState();
    return {
      advancedSector: false,
      runComplete: false,
    };
  }

  game.sectorIndex += 1;
  game.stageNodeIndex = 0;
  refreshStageProgressState();
  return {
    advancedSector: true,
    runComplete: game.sectorIndex >= runSectors.length,
  };
}

function resolveChestNode() {
  const goldRollRange = Math.max(1, KILL_GOLD_MAX - KILL_GOLD_MIN + 1);
  const baseGold = KILL_GOLD_MIN + randomInt(goldRollRange);
  const stageBonus = Math.max(0, Math.floor(game.sectorIndex / 3));
  const goldGain = baseGold + stageBonus + 4;
  game.gold = Math.max(0, (Number.parseInt(game.gold, 10) || 0) + goldGain);

  const potionGain = randomInt(100) < 35 ? 1 : 0;
  const tokenGain = randomInt(100) < 20 ? 1 : 0;
  if (potionGain > 0) {
    game.healingPotions = Math.max(0, (Number.parseInt(game.healingPotions, 10) || 0) + potionGain);
  }
  if (tokenGain > 0) {
    game.itemUpgradeTokens = Math.max(
      0,
      (Number.parseInt(game.itemUpgradeTokens, 10) || 0) + tokenGain
    );
  }

  const parts = [`+${goldGain} gold`];
  if (potionGain > 0) {
    parts.push(`+${potionGain} potion`);
  }
  if (tokenGain > 0) {
    parts.push(`+${tokenGain} upgrade token`);
  }
  const summary = `Chest found: ${parts.join(", ")}.`;
  appendRunTimelineEntry(summary, {
    sectorIndex: game.sectorIndex,
    type: "reward",
  });
  return summary;
}

function resolveShrineNode() {
  const healBase = 5 + Math.floor(game.sectorIndex / 4) * 2;
  const heatReliefBase = 7 + Math.floor(game.sectorIndex / 5);
  const beforeHull = game.player.hull;
  const beforeHeat = game.player.heat;
  game.player.hull = clamp(game.player.hull + healBase, 0, game.player.maxHull);
  game.player.heat = clamp(game.player.heat - heatReliefBase, 0, MAX_HEAT);
  const healed = Math.max(0, game.player.hull - beforeHull);
  const cooled = Math.max(0, beforeHeat - game.player.heat);
  const summary = `Shrine invoked: +${healed} Hull, -${cooled} Heat.`;
  appendRunTimelineEntry(summary, {
    sectorIndex: game.sectorIndex,
    type: "info",
  });
  return summary;
}

function resolveStageNodeEvent(node) {
  const currentSector = getCurrentSector();
  const questResolution = resolveQuestCompletions({
    type: "stage_node",
    node,
    sector: currentSector,
    sectorIndex: game.sectorIndex,
    damageTakenThisSector: getDamageTakenThisSector(),
    currentHeat: game.player.heat,
  });
  const type = BRASSLINE_PROGRESSION.normalizeStageNodeType(node?.type);
  let summary = "";
  if (type === "chest") {
    summary = resolveChestNode();
  }
  if (type === "shrine") {
    summary = resolveShrineNode();
  }
  const questNotes = Array.isArray(questResolution?.notes) ? questResolution.notes : [];
  if (questNotes.length === 0) {
    return summary;
  }
  return `${summary}${summary ? " " : ""}${questNotes.join(" ")}`.trim();
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
  ensureRunGearState();
  ensureRewardTreeState();
  ensureClassState();
  ensureClassItems();
  ensureClassResources();
  const vitalityInvestment = getAllocatedClassStat("vitality");
  const energyInvestment = getAllocatedClassStat("energy");
  const runMaxHullBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("max_hull_bonus"), 10) || 0);
  const runMaxEnergyBonus = Math.max(0, Number.parseInt(getRunPassiveBonus("max_energy_bonus"), 10) || 0);
  const statMaxHullBonus = vitalityInvestment * HULL_PER_VITALITY_POINT;
  const statMaxEnergyBonus = Math.floor(energyInvestment / ENERGY_POINTS_PER_MAX_ENERGY);
  game.player.maxHull = Math.max(1, game.player.maxHull + runMaxHullBonus + statMaxHullBonus);
  game.player.maxEnergy = Math.max(1, game.player.maxEnergy + runMaxEnergyBonus + statMaxEnergyBonus);
  game.player.hull = clamp(game.player.hull, 0, game.player.maxHull);
  game.player.energy = clamp(game.player.energy, 0, game.player.maxEnergy);
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
  return upgradeCooling + getRunPassiveBonus("turn_start_cooling_bonus");
}

function getTurnStartBlockAmount() {
  const upgradeBlock = BRASSLINE_META_PROGRESSION.getTurnStartBlockAmount({
    getUpgradeLevelFn: getUpgradeLevel,
    turnStartBlockPerGuardLevel: TURN_START_BLOCK_PER_GUARD_LEVEL,
    upgradePathCatalog,
    metaUnlocks: game.metaUnlocks,
    metaBranches: game.metaBranches,
  });
  const dexterityBonus = Math.floor(getAllocatedClassStat("dexterity") / 20);
  return upgradeBlock + getRunPassiveBonus("turn_start_block_bonus") + dexterityBonus;
}

function getTurnStartEnergyBonus() {
  return getRunPassiveBonus("turn_start_energy_bonus");
}

function getBattleStartDrawBonus() {
  return getRunPassiveBonus("battle_start_draw_bonus");
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
  const effectiveRewardPool = [...new Set([...rewardPool, ...getUnlockedClassRewardCardIds()])];
  return BRASSLINE_RUN_FLOW.drawRewardChoices({
    rewardPool: effectiveRewardPool,
    rewardChoiceCount: REWARD_CHOICE_COUNT,
    shuffleInPlace,
    getUpgradeablePathIds,
    getUpgradeablePathChoices,
    getAvailableArtifactIds,
    getAvailableGearIds,
  });
}

function getRunArtifactBonus(effectId) {
  const artifacts = Array.isArray(game.artifacts) ? game.artifacts : [];
  return artifacts.reduce((sum, artifactId) => {
    const artifact = artifactCatalog[artifactId];
    if (!artifact) {
      return sum;
    }
    let nextSum = sum;
    if (artifact.effect === effectId) {
      const value = Number.parseInt(artifact.value, 10);
      nextSum += Number.isInteger(value) ? Math.max(0, value) : 0;
    }
    const effectsValue = Number.parseInt(artifact.effects?.[effectId], 10);
    if (Number.isInteger(effectsValue)) {
      nextSum += Math.max(0, effectsValue);
    }
    return nextSum;
  }, 0);
}

function getRunGearBonus(effectId) {
  if (typeof BRASSLINE_GEAR_SYSTEM.getEquippedGearBonus !== "function") {
    return 0;
  }
  const runGear = ensureRunGearState();
  return BRASSLINE_GEAR_SYSTEM.getEquippedGearBonus({
    gearCatalog,
    equippedGear: runGear.equippedGear,
    effectId,
  });
}

function getRewardTreeBonus(effectId) {
  if (typeof BRASSLINE_REWARD_TREE.getRewardTreeBonus !== "function") {
    return 0;
  }
  return BRASSLINE_REWARD_TREE.getRewardTreeBonus({
    rewardTreeCatalog,
    state: ensureRewardTreeState(),
    effectId,
  });
}

function getClassPassiveBonus(effectId) {
  return getClassNodeBonus(effectId) + getClassItemBonus(effectId);
}

function getRunPassiveBonus(effectId) {
  return (
    getRunArtifactBonus(effectId) +
    getRunGearBonus(effectId) +
    getRewardTreeBonus(effectId) +
    getClassPassiveBonus(effectId)
  );
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

function getAvailableGearIds() {
  if (typeof BRASSLINE_GEAR_SYSTEM.getAvailableGearChoices !== "function") {
    return [];
  }
  const runGear = ensureRunGearState();
  return BRASSLINE_GEAR_SYSTEM.getAvailableGearChoices({
    gearCatalog,
    gearInventory: runGear.gearInventory,
  });
}

function applyGearReward(gearId) {
  if (typeof BRASSLINE_GEAR_SYSTEM.applyGearReward !== "function") {
    return null;
  }
  ensureRunGearState();
  const result = BRASSLINE_GEAR_SYSTEM.applyGearReward({
    game,
    gearId,
    gearCatalog,
  });
  if (result) {
    ensureRunGearState();
  }
  return result;
}

function resolveCardReward({ cardId, deck }) {
  const spell = getSpellDefinitionByCardId(cardId);
  if (!spell) {
    return null;
  }
  const ownedCopies = (Array.isArray(deck) ? deck : []).filter((instance) => instance?.cardId === cardId).length;
  const maxDeckCopies = Math.max(1, Number.parseInt(spell.maxDeckCopies, 10) || 2);
  if (ownedCopies < maxDeckCopies || typeof BRASSLINE_CLASS_SYSTEM.gainSpellRank !== "function") {
    return null;
  }
  const result = BRASSLINE_CLASS_SYSTEM.gainSpellRank({
    classState: ensureClassState(),
    spellCatalog: classSpellCatalog,
    spellId: cardId,
    amount: 1,
  });
  if (!result || result.gained <= 0) {
    return null;
  }
  return {
    mode: "rank_up",
    timelineText: `Reward: empowered ${spell.title} to Rank ${result.nextRank}/${result.rankCap}.`,
    rewardMessage: `Empowered ${spell.title} to Rank ${result.nextRank}/${result.rankCap}. Hull repaired by ${REWARD_HEAL_CHOSEN}.`,
  };
}

function getArtifactRewardHealBonus() {
  return getRunPassiveBonus("reward_heal_bonus");
}

function getArtifactBattleStartBlockBonus() {
  return getRunPassiveBonus("battle_start_block");
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

function applyRewardTreeObjectiveProgress({ delta, sectorIndex = game.sectorIndex }) {
  if (typeof BRASSLINE_REWARD_TREE.applyObjectiveProgress !== "function") {
    return [];
  }
  const result = BRASSLINE_REWARD_TREE.applyObjectiveProgress({
    rewardTreeCatalog,
    state: ensureRewardTreeState(),
    delta,
  });
  game.rewardTreeState = result.state;
  const unlockedNodes = Array.isArray(result.newlyUnlockedNodes) ? result.newlyUnlockedNodes : [];
  if (unlockedNodes.length > 0) {
    applyUpgradeDerivedCaps();
    appendRunTimelineEntry(`Reward tree unlocked: ${unlockedNodes.map((node) => node.title).join(", ")}.`, {
      sectorIndex,
      type: "reward",
    });
  }
  return unlockedNodes;
}

function getDamageTakenThisSector() {
  const stats = ensureRunStats();
  const startDamageTaken = Number.parseInt(game.sectorDamageTakenStart, 10);
  const safeStartDamageTaken = Number.isInteger(startDamageTaken) ? startDamageTaken : stats.damageTaken;
  return Math.max(0, stats.damageTaken - safeStartDamageTaken);
}

function handleSectorClearedObjectives({ sector, sectorIndex, turn }) {
  const damageTakenThisSector = getDamageTakenThisSector();
  const delta = {
    sectorsCleared: 1,
    bossKills: sector?.boss ? 1 : 0,
    flawlessClears: damageTakenThisSector <= 0 ? 1 : 0,
    speedClears:
      Number.isInteger(turn) && turn > 0 && turn <= SPEED_CLEAR_TURN_THRESHOLD ? 1 : 0,
  };
  applyRewardTreeObjectiveProgress({
    delta,
    sectorIndex,
  });
  resolveQuestCompletions({
    type: "sector_cleared",
    sector,
    sectorIndex,
    turn,
    damageTakenThisSector,
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
  const nodeOffset = Number.isInteger(game.stageNodeIndex) ? game.stageNodeIndex : 0;
  return BRASSLINE_PROGRESSION.pickSectorEncounter({
    sector,
    sectorIndex: game.sectorIndex + nodeOffset,
    runSeed: game.runSeed,
  });
}

function beginInterlude(interlude, deckInstances, rewardMessage) {
  return BRASSLINE_RUN_FLOW.beginInterlude({
    game,
    setGamePhaseFn: setGamePhase,
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
  ensureRunStageRouteState();
  game.recentImpacts = [];
  game.sectorDamageTakenStart = ensureRunStats().damageTaken;
  BRASSLINE_RUN_FLOW.beginSectorBattle({
    game,
    setGamePhaseFn: setGamePhase,
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

function resolvePostRewardFlow({
  deck,
  rewardMessage,
  appendRunTimelineEntry: appendRunTimelineEntryFn,
  recordRunOutcome: recordRunOutcomeFn,
  renderEnemies: renderEnemiesFn,
  renderCards: renderCardsFn,
  renderTrackMap: renderTrackMapFn,
  updateHud: updateHudFn,
  beginInterlude: beginInterludeFn,
  beginSectorBattle: beginSectorBattleFn,
}) {
  if (!Array.isArray(game.stageNodesBySector) || game.stageNodesBySector.length === 0) {
    return false;
  }

  let progression = advanceStageNodeCursor();
  const nodeNotes = [];
  let guard = 0;

  while (!progression.runComplete && guard < 24) {
    if (progression.advancedSector) {
      const interlude = getInterludeForAfterSector(game.sectorIndex);
      if (interlude) {
        const suffix = nodeNotes.length > 0 ? ` ${nodeNotes.join(" ")}` : "";
        beginInterludeFn(interlude, deck, `${rewardMessage}${suffix}`.trim());
        return true;
      }
    }

    const stageNode = getCurrentStageNode();
    if (!stageNode || stageNode.type === "enemy") {
      break;
    }

    const nodeNote = resolveStageNodeEvent(stageNode);
    if (nodeNote) {
      nodeNotes.push(nodeNote);
    }

    progression = advanceStageNodeCursor();
    guard += 1;
  }

  if (progression.runComplete || game.sectorIndex >= runSectors.length) {
    setGamePhase("run_complete", "route_secured");
    game.telegraphs = [];
    appendRunTimelineEntryFn("Route secured.", {
      sectorIndex: Math.max(0, runSectors.length - 1),
      turn: game.turn,
      type: "victory",
    });
    recordRunOutcomeFn("run_complete");
    const suffix = rewardMessage ? `${rewardMessage} ` : "";
    const nodeSummary = nodeNotes.length > 0 ? `${nodeNotes.join(" ")} ` : "";
    setLog(`${suffix}${nodeSummary}Route secured. Click Restart Run to play again.`.trim());
    renderEnemiesFn();
    renderCardsFn();
    renderTrackMapFn();
    updateHudFn();
    return true;
  }

  const suffix = nodeNotes.length > 0 ? ` ${nodeNotes.join(" ")}` : "";
  setLog(`${rewardMessage}${suffix}`.trim());
  beginSectorBattleFn(deck, false);
  return true;
}

function applyRewardAndAdvance(rewardChoice = null) {
  BRASSLINE_RUN_FLOW.applyRewardAndAdvance({
    game,
    setGamePhaseFn: setGamePhase,
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
    gearCatalog,
    applyGearReward,
    getArtifactRewardHealBonus,
    applyRunPassiveCaps: applyUpgradeDerivedCaps,
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
    resolveCardRewardFn: resolveCardReward,
    resolvePostRewardFlowFn: resolvePostRewardFlow,
  });
}

function checkEndStates() {
  return BRASSLINE_RUN_FLOW.checkEndStates({
    game,
    setGamePhaseFn: setGamePhase,
    livingEnemies,
    runSectorsLength: runSectors.length,
    discardHand,
    appendRunTimelineEntry,
    recordRunOutcome,
    drawRewardChoices,
    getCurrentSector,
    onSectorCleared: handleSectorClearedObjectives,
    setLog,
  });
}

function startPlayerTurn() {
  if (typeof BRASSLINE_CLASS_SYSTEM.tickSkillCooldowns === "function") {
    BRASSLINE_CLASS_SYSTEM.tickSkillCooldowns({
      classState: ensureClassState(),
    });
  }
  BRASSLINE_PLAYER_ACTIONS.startPlayerTurn({
    game,
    setGamePhaseFn: setGamePhase,
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
    setGamePhaseFn: setGamePhase,
    setLog,
    discardHandFn: discardHand,
    damagePlayerFn: (amount, ignoreBlock) => damagePlayer(amount, ignoreBlock, "pure"),
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
    combatSubphase: getCombatSubphase(),
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
    combatSubphase: getCombatSubphase(),
    playerLane: game.player.lane,
    forecastUi,
    getForecastThreatClassNameFn: BRASSLINE_FORECAST.getForecastThreatClassName,
    getEndTurnLockMessageFn: BRASSLINE_FORECAST.getEndTurnLockMessage,
    escapeHtml,
    bindLaneHighlightInteractions,
    onShiftLane: (direction) =>
      runGameAction(direction < 0 ? "forecast_shift_left" : "forecast_shift_right", () => {
        shiftLane(direction);
      }),
    onEndTurn: () =>
      runGameAction("forecast_end_turn", () => {
        endTurn();
      }),
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
  trimRecentImpacts();
  const aimedThreats = getAimedShotLaneThreats();
  BRASSLINE_THREATS.renderTrackMap({
    rootEl: els.trackMap,
    trackLanes: TRACK_LANES,
    playerLane: game.player.lane,
    highlightLanes: game.highlightLanes,
    telegraphs: game.telegraphs,
    recentImpacts: game.recentImpacts,
    aimedThreats,
    telegraphAffectsLaneFn: telegraphAffectsLane,
    getTelegraphProgress,
    cookTierLabel: COOK_TIER_LABEL,
    trainMarkerSrc: resolveThemeIconPath("./assets/curated/icons/ui/power_plug.svg"),
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
    combatSubphase: getCombatSubphase(),
    openEnemyTooltipId: game.openEnemyTooltipId,
    getLockedAimLane,
    buildEnemyThreatRowsFn: buildEnemyThreatRows,
    buildEnemyTooltipEntriesFn: buildEnemyTooltipEntries,
    describeIntent,
    escapeHtml,
    bindLaneHighlightInteractions,
    onTooltipToggle: (enemyId) =>
      runGameAction(`enemy_tooltip_toggle:${String(enemyId || "")}`, () => {
        enemyInteractionHandlers.onTooltipToggle(enemyId);
      }),
    onEnemySelect: (enemyId) =>
      runGameAction(`enemy_select:${String(enemyId || "")}`, () => {
        enemyInteractionHandlers.onEnemySelect(enemyId);
      }),
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

function createGearNode({ gear, onClick }) {
  return BRASSLINE_RUN_UI.createGearNode({
    gear,
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

function renderGearStrip() {
  const runGear = ensureRunGearState();
  BRASSLINE_RUN_UI.renderGearStrip({
    gearStripEl: els.gearStrip,
    gearCatalog,
    gearInventory: runGear.gearInventory,
    equippedGear: runGear.equippedGear,
    escapeHtml,
  });
}

function renderRewardTreeStrip() {
  BRASSLINE_RUN_UI.renderRewardTreeStrip({
    rewardTreeStripEl: els.rewardTreeStrip,
    rewardTreeCatalog,
    rewardTreeState: ensureRewardTreeState(),
    formatNodeRequirementLabelFn:
      typeof BRASSLINE_REWARD_TREE.formatNodeRequirementLabel === "function"
        ? BRASSLINE_REWARD_TREE.formatNodeRequirementLabel
        : () => "",
    escapeHtml,
  });
}

function getQuestEntries() {
  if (typeof BRASSLINE_QUEST_SYSTEM.getQuestProgressEntries !== "function") {
    return [];
  }
  return BRASSLINE_QUEST_SYSTEM.getQuestProgressEntries({
    questCatalog,
    questState: ensureQuestState(),
    game,
    runSeed: game.runSeed,
    runSectors,
    stageNodesBySector: game.stageNodesBySector,
  });
}

function renderQuestPanel() {
  if (typeof BRASSLINE_RUN_UI.renderQuestPanel !== "function") {
    return;
  }
  BRASSLINE_RUN_UI.renderQuestPanel({
    questPanelEl: els.questPanel,
    questEntries: getQuestEntries(),
    escapeHtml,
  });
}

function resolveQuestCompletions(context = null) {
  if (typeof BRASSLINE_QUEST_SYSTEM.resolveQuestCompletions !== "function") {
    return {
      newlyCompletedQuests: [],
      newlyFailedQuests: [],
      notes: [],
    };
  }
  const result = BRASSLINE_QUEST_SYSTEM.resolveQuestCompletions({
    questCatalog,
    questState: ensureQuestState(),
    game,
    context,
    clamp,
    applyGearReward,
    runSeed: game.runSeed,
    runSectors,
    stageNodesBySector: game.stageNodesBySector,
  });
  game.questState = result.state;
  const newlyCompletedQuests = Array.isArray(result.newlyCompletedQuests) ? result.newlyCompletedQuests : [];
  const newlyFailedQuests = Array.isArray(result.newlyFailedQuests) ? result.newlyFailedQuests : [];
  if (newlyCompletedQuests.length > 0) {
    applyUpgradeDerivedCaps();
  }
  newlyCompletedQuests.forEach((quest) => {
    appendRunTimelineEntry(`Quest complete: ${quest.title}. Reward ${quest.rewardSummary}.`, {
      sectorIndex: game.sectorIndex,
      turn: game.turn,
      type: "reward",
    });
  });
  newlyFailedQuests.forEach((quest) => {
    appendRunTimelineEntry(`Quest missed: ${quest.title}.`, {
      sectorIndex: game.sectorIndex,
      turn: game.turn,
      type: "info",
    });
  });
  if (newlyCompletedQuests.length > 0) {
    const firstQuest = newlyCompletedQuests[0];
    setLog(`Quest complete: ${firstQuest.title}. ${firstQuest.rewardSummary}.`);
  } else if (newlyFailedQuests.length > 0) {
    setLog(`Quest missed: ${newlyFailedQuests[0].title}.`);
  }
  return {
    newlyCompletedQuests,
    newlyFailedQuests,
    notes: [
      ...newlyCompletedQuests.map((quest) => `Quest complete: ${quest.title}. Reward ${quest.rewardSummary}.`),
      ...newlyFailedQuests.map((quest) => `Quest missed: ${quest.title}.`),
    ],
  };
}

function renderClassSkillPanel() {
  const classState = ensureClassState();
  const classDef = getClassDefinition();
  const classTree = getClassTree();
  const classItems = ensureClassItems();
  const currentClassId = typeof classState.classId === "string" ? classState.classId : DEFAULT_CLASS_ID;
  const configuredClassId = classCatalog[selectedClassId] ? selectedClassId : currentClassId;

  if (els.classSelect) {
    const optionHtml = Object.values(classCatalog)
      .map((entry) => `<option value=\"${escapeHtml(entry.id)}\">${escapeHtml(entry.title)}</option>`)
      .join("");
    if (els.classSelect.innerHTML !== optionHtml) {
      els.classSelect.innerHTML = optionHtml;
    }
    els.classSelect.value = configuredClassId;
  }
  if (els.applyClassBtn) {
    els.applyClassBtn.disabled = configuredClassId === currentClassId;
  }

  if (els.classSummary) {
    let levelProgress = {
      current: classState?.xp || 0,
      needed: classState?.xp || 0,
    };
    if (typeof BRASSLINE_CLASS_SYSTEM.getLevelProgress === "function") {
      levelProgress = BRASSLINE_CLASS_SYSTEM.getLevelProgress({
        classState,
        levelTable: CLASS_LEVEL_TABLE,
      });
    }
    const stats = CLASS_STAT_DEFINITIONS
      .map((stat) => `${stat.shortLabel}:${getClassStat(stat.id)}`)
      .join(" ");
    const resistances = ["physical", "fire", "cold", "poison"]
      .map((damageType) => `${damageType.slice(0, 3).toUpperCase()}:${getClassResistanceValue(damageType)}%`)
      .join(" ");
    const equippedItems = classItems
      .map((itemId) => classItemCatalog[itemId]?.title || itemId)
      .join(", ");
    const itemText = equippedItems || "None";
    els.classSummary.textContent = `${classDef?.title || "Class"} Lv.${classState.level} | XP ${levelProgress.current}/${levelProgress.needed} | Stat Pts ${classState.statPoints || 0} | Skill Pts ${classState.skillPoints || 0} | ${stats} | ${resistances} | Items: ${itemText}`;
  }

  if (els.statAllocation) {
    els.statAllocation.innerHTML = "";
    CLASS_STAT_DEFINITIONS.forEach((stat) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      const value = getClassStat(stat.id);
      const invested = getAllocatedClassStat(stat.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stat-btn";
      button.disabled = (classState.statPoints || 0) <= 0;
      button.textContent = `+ ${stat.shortLabel}`;
      button.addEventListener("click", () => {
        allocateClassStat(stat.id);
      });
      row.innerHTML = `<span class=\"stat-label\">${stat.title}</span><span class=\"stat-value\">${value} <small>(+${invested})</small></span>`;
      row.appendChild(button);
      els.statAllocation.appendChild(row);
    });
  }

  if (els.skillTreeNodes) {
    els.skillTreeNodes.innerHTML = "";
    const nodes = Array.isArray(classTree?.nodes) ? classTree.nodes : [];
    if (nodes.length === 0) {
      const empty = document.createElement("small");
      empty.textContent = "No skill tree configured.";
      els.skillTreeNodes.appendChild(empty);
    } else {
      nodes.forEach((node) => {
        if (!node || typeof node.id !== "string") {
          return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "skill-tree-node";
        const rank = Number.parseInt(classState.nodeRanks?.[node.id], 10) || 0;
        const maxRankRaw = Number.parseInt(node.maxRank, 10);
        const maxRank = Number.isInteger(maxRankRaw) && maxRankRaw > 0 ? maxRankRaw : 1;
        const costRaw = Number.parseInt(node.cost, 10);
        const cost = Number.isInteger(costRaw) && costRaw > 0 ? costRaw : 1;
        const canUpgrade =
          typeof BRASSLINE_CLASS_SYSTEM.canUpgradeNode === "function"
            ? BRASSLINE_CLASS_SYSTEM.canUpgradeNode({
                classCatalog,
                skillTreeCatalog: classSkillTreeCatalog,
                classState,
                nodeId: node.id,
              })
            : false;
        button.disabled = !canUpgrade;
        button.title = node.description || "";
        button.innerHTML = `<strong>${escapeHtml(node.title || node.id)} ${rank}/${maxRank}</strong><small>Cost ${cost} SP</small>`;
        button.addEventListener("click", () => {
          upgradeClassNode(node.id);
        });
        els.skillTreeNodes.appendChild(button);
      });
    }
  }

  if (els.skillBar) {
    els.skillBar.innerHTML = "";
    const unlockedSkillIds = getUnlockedSkillIds();
    if (unlockedSkillIds.length === 0) {
      const hint = document.createElement("small");
      hint.textContent = "Unlock class cards in the tree.";
      els.skillBar.appendChild(hint);
    } else {
      unlockedSkillIds.forEach((skillId) => {
        const skill = getSkillDefinition(skillId);
        if (!skill) {
          return;
        }
        const spell = getSpellDefinitionForSkill(skillId);
        const entry = document.createElement("div");
        entry.className = "skill-btn";
        const energyCost = getSkillEnergyCost(skill);
        const rank =
          typeof BRASSLINE_CLASS_SYSTEM.getSpellRank === "function" && spell?.id
            ? BRASSLINE_CLASS_SYSTEM.getSpellRank({
                classState: ensureClassState(),
                spellCatalog: classSpellCatalog,
                spellId: spell.id,
              })
            : 1;
        const deckCopies = collectDeckInstances().filter((instance) => instance?.cardId === spell?.id).length;
        entry.title = spell?.description || skill.description || "";
        entry.innerHTML = `<strong>${escapeHtml(skill.title || skillId)}</strong><small>${energyCost} Steam | Rank ${rank}${deckCopies > 0 ? ` | Deck ${deckCopies}` : ""}</small>`;
        els.skillBar.appendChild(entry);
      });
    }
  }
}

function renderCards() {
  const selectedEnemy = getSelectedEnemy();
  els.cardRow.innerHTML = "";

  game.hand.forEach((instance) => {
    const card = cardCatalog[instance.cardId];
    const playable = isCardPlayable(card, selectedEnemy);
    const cardEl = createCardNode(card, playable, () => {
      runGameAction(`play_card:${instance.instanceId}`, () => {
        playCard(instance.instanceId);
      });
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
    gearCatalog,
    getSuggestedUpgradePathIdFn: getSuggestedUpgradePathId,
    renderRewardMetaSummaryFn: renderRewardMetaSummary,
    upgradePathCatalog,
    createUpgradeNodeFn: createUpgradeNode,
    createArtifactNodeFn: createArtifactNode,
    createGearNodeFn: createGearNode,
    createCardNodeFn: createCardNode,
    cardCatalog,
    onApplyRewardAndAdvance: (rewardChoice) =>
      runGameAction(`reward_choice:${getRewardChoiceKey(rewardChoice) || "skip"}`, () => {
        applyRewardAndAdvance(rewardChoice);
      }),
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
    onResolveInterludeOption: (optionIndex) =>
      runGameAction(`interlude_option:${Number.parseInt(optionIndex, 10) || 0}`, () => {
        resolveInterludeOption(optionIndex);
      }),
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
    gearInventory: game.gearInventory,
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
    timelineTypeIcons,
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
  ensureRunStageRouteState();
  ensureQuestState();
  ensureClassState();
  ensureClassItems();
  ensureClassResources();
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
    renderGearStripFn: renderGearStrip,
    renderRewardTreeStripFn: renderRewardTreeStrip,
    renderLaneThreatForecastFn: renderLaneThreatForecast,
    renderOnboardingPanelFn: renderOnboardingPanel,
    saveRunSnapshotStateFn: saveRunSnapshotState,
  });
  renderQuestPanel();
  renderClassSkillPanel();
  syncComfortModeUi();
}

function initGame(options = {}) {
  const tryResume = Boolean(options?.tryResume);
  const uiPrefs = readUiPreferences();
  game.comfortMode = uiPrefs.comfortMode;
  selectedClassId = classCatalog[uiPrefs.selectedClassId] ? uiPrefs.selectedClassId : DEFAULT_CLASS_ID;
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
  syncComfortModeUi();

  if (tryResume) {
    const snapshot = readRunSnapshotState();
    if (snapshot && restoreRunSnapshotState(snapshot)) {
      ensureRunStageRouteState();
      selectedClassId = ensureClassState().classId || selectedClassId;
      saveUiPreferences();
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
    createDefaultRunGearStateFn: createDefaultRunGearState,
    createDefaultQuestStateFn: createDefaultQuestState,
    createDefaultRewardTreeStateFn: createDefaultRewardTreeState,
    createDefaultClassStateFn: createDefaultClassState,
  });
  resetRunStageRoute();
  ensureRunGearState();
  ensureQuestState();
  ensureRewardTreeState();
  ensureClassState();
  const starterItemIds = Array.isArray(getClassDefinition()?.starterItemIds) ? getClassDefinition().starterItemIds : [];
  game.classItems = starterItemIds.slice();
  ensureClassItems();
  ensureClassResources();
  applyUpgradeDerivedCaps();
  game.player.hull = game.player.maxHull;
  game.player.energy = game.player.maxEnergy;
  appendRunTimelineEntry("Run started.", { type: "system" });
  setLog("You are the blue marker on the track map. Click an enemy unit, play combat cards, then end turn.");

  const starterDeck = getStarterDeckCardIdsForRun().map((cardId) => makeCardInstance(cardId));
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
  usePotionBtn: els.usePotionBtn,
  endTurnBtn: els.endTurnBtn,
  shiftLeftBtn: els.shiftLeftBtn,
  shiftRightBtn: els.shiftRightBtn,
  cycleHandBtn: els.cycleHandBtn,
  toggleComfortModeBtn: els.toggleComfortModeBtn,
  toggleOnboardingBtn: els.toggleOnboardingBtn,
  dismissOnboardingBtn: els.dismissOnboardingBtn,
  resetMetaBtn: els.resetMetaBtn,
  resetRunRecordsBtn: els.resetRunRecordsBtn,
  toggleRunTimelineBtn: els.toggleRunTimelineBtn,
  skipRewardBtn: els.skipRewardBtn,
  onUseOverclock: () =>
    runGameAction("use_overclock", () => {
      useOverclock();
    }),
  onUsePotion: () =>
    runGameAction("use_potion", () => {
      usePotion();
    }),
  onEndTurn: () =>
    runGameAction("end_turn", () => {
      endTurn();
    }),
  onShiftLeft: () =>
    runGameAction("shift_left", () => {
      shiftLane(-1);
    }),
  onShiftRight: () =>
    runGameAction("shift_right", () => {
      shiftLane(1);
    }),
  onCycleHand: () =>
    runGameAction("purge_hand", () => {
      purgeHand();
    }),
  onToggleComfortMode: toggleComfortMode,
  onToggleOnboarding: onboardingController.toggleOnboardingPanel,
  onDismissOnboarding: onboardingController.dismissOnboarding,
  onResetMeta: resetMetaProgressionAndRestart,
  onResetRunRecords: resetRunRecordsProgression,
  onToggleRunTimeline: () =>
    runGameAction("toggle_timeline", () => {
      BRASSLINE_RUN_UI.toggleRunTimelineView({
        game,
        renderRunSummaryPanelFn: renderRunSummaryPanel,
      });
    }),
  onSkipReward: () =>
    runGameAction("skip_reward", () => {
      applyRewardAndAdvance(null);
    }),
});

if (els.classSelect) {
  els.classSelect.addEventListener("change", () => {
    const nextClassId = typeof els.classSelect.value === "string" ? els.classSelect.value : "";
    if (setSelectedClass(nextClassId)) {
      renderClassSkillPanel();
    }
  });
}

if (els.applyClassBtn) {
  els.applyClassBtn.addEventListener("click", () => {
    runGameAction("apply_class_restart", () => {
      applySelectedClassAndRestart();
    });
  });
}

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
  engine: gameEngine,
  setGamePhase,
  runGameAction,
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
  getRunSectorsLength: () => runSectors.length,
};

initGame({ tryResume: true });
